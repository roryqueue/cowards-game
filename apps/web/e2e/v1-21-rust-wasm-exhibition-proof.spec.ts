import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN
const artifactDir = ".planning/artifacts"
const proofJsonPath = path.join(
  artifactDir,
  "v1.21-signed-in-rust-exhibition-proof.json",
)
const proofMarkdownPath = path.join(
  artifactDir,
  "v1.21-signed-in-rust-exhibition-proof.md",
)

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "strategySource",
  "rawRuntimeDetails",
  "privateRuntime",
  "runtimeInternals",
  "Traceback",
  "stderr",
  "DATABASE_URL",
  "Bearer ",
  "COWARDS_GO_BACKEND_INTERNAL_TOKEN",
]

const rustStoneSource = `
use std::io::{self, Read};

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = input.find("\\"mySoldiers\\":[")?;
    let soldiers = &input[soldiers_start..];
    let id_start = soldiers.find("\\"id\\":\\"")? + "\\"id\\":\\"".len();
    let after_id = &soldiers[id_start..];
    let id_end = after_id.find('"')?;
    Some(&after_id[..id_end])
}

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN_TO_STONE"}},"soldierMemory":null}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"stone"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`.trim()

const rustHoldSource = `
use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    let _ = io::stdin().read_to_string(&mut input);
    if input.contains("\\"methodName\\":\\"soldierBrain\\"") {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN","direction":"UP"}},"soldierMemory":null}}}}"#);
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`.trim()

test.skip(
  process.env.RUN_V1_21_PROOF !== "1",
  "v1.21 signed-in Rust proof requires live web, Go backend, runtime-service, Postgres, Wasmtime, Rust wasm32-wasip1, and RUN_V1_21_PROOF=1.",
)

interface Timed<T> {
  value: T
  durationMs: number
}

interface ProofExhibition {
  matchSetId: string
  publicHref?: string | undefined
}

interface PublicMatchSetSummary {
  matchSetId: string
  status: string
  matches: { status: string }[]
}

interface VerifiedExhibition extends ProofExhibition {
  matchup: "js-ts-vs-rust" | "rust-vs-rust"
  observedStatus: string
  observedMatchStatuses: string[]
  resultPageMs: number
  replayPageMs: number
  resultBodyLength: number
  replayBodyLength: number
}

const timed = async <T>(fn: () => Promise<T>): Promise<Timed<T>> => {
  const startedAt = performance.now()
  const value = await fn()
  return { value, durationMs: Math.round(performance.now() - startedAt) }
}

const expectPublicSafe = async (page: Page): Promise<number> => {
  const bodyText = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(bodyText).not.toContain(marker)
  }
  return bodyText.length
}

const saveRevision = async (
  page: Page,
  input: {
    source: string
    sourceFormat: "typescript" | "rust"
    label: string
    notes: string
  },
): Promise<string> => {
  const response = await page.request.post("/api/account/revisions/save", {
    data: input,
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = (await response.json()) as { revision: { id: string } }
  return body.revision.id
}

const createExhibition = async (
  page: Page,
  revisionIds: string[],
): Promise<ProofExhibition> => {
  const response = await page.request.post("/api/exhibitions", {
    data: {
      presetId: "smoke-exhibition-v1",
      revisionIds,
      counted: false,
    },
  })
  expect(response.status(), await response.text()).toBe(201)
  return (await response.json()) as ProofExhibition
}

const runWorkerIterations = async (
  page: Page,
  iterations: number,
): Promise<number[]> => {
  const statuses: number[] = []
  for (let index = 0; index < iterations; index += 1) {
    const run = await page.request.post(
      `${goBackendUrl}/internal/match-jobs/run-once`,
      {
        headers: { "X-Cowards-Internal-Token": internalToken ?? "" },
      },
    )
    statuses.push(run.status())
    expect(run.status(), await run.text()).toBeLessThan(500)
  }
  return statuses
}

const readMatchSetSummary = async (
  page: Page,
  matchSetId: string,
): Promise<PublicMatchSetSummary> => {
  const response = await page.request.get(
    `/api/matchsets/${encodeURIComponent(matchSetId)}`,
  )
  expect(response.status(), await response.text()).toBe(200)
  return (await response.json()) as PublicMatchSetSummary
}

const isUnsettled = (summary: PublicMatchSetSummary): boolean =>
  summary.status === "queued" ||
  summary.status === "accepted" ||
  summary.status === "running" ||
  summary.matches.some(
    (match) => match.status === "pending" || match.status === "running",
  )

const hasActiveRunningMatch = (summary: PublicMatchSetSummary): boolean =>
  summary.status === "running" ||
  summary.matches.some((match) => match.status === "running")

const settleExhibitions = async (
  page: Page,
  exhibitions: ProofExhibition[],
  options: { maxExtraIterations: number; maxWaitMs: number },
): Promise<{ workerStatuses: number[] }> => {
  const workerStatuses: number[] = []
  const startedAt = Date.now()
  const pollMs = 2_000
  while (Date.now() - startedAt <= options.maxWaitMs) {
    const summaries = await Promise.all(
      exhibitions.map((exhibition) =>
        readMatchSetSummary(page, exhibition.matchSetId),
      ),
    )
    if (!summaries.some(isUnsettled)) {
      return { workerStatuses }
    }
    if (summaries.some(hasActiveRunningMatch)) {
      await page.waitForTimeout(pollMs)
      continue
    }
    if (workerStatuses.length >= options.maxExtraIterations) {
      throw new Error(
        `MatchSets did not settle after ${options.maxExtraIterations} bounded extra worker iterations: ${JSON.stringify(
          summaries.map((summary) => ({
            matchSetId: summary.matchSetId,
            status: summary.status,
            matchStatuses: summary.matches.map((match) => match.status),
          })),
        )}`,
      )
    }
    workerStatuses.push(...(await runWorkerIterations(page, 1)))
    await page.waitForTimeout(pollMs)
  }
  throw new Error(
    `MatchSets did not settle within ${options.maxWaitMs}ms browser proof wait budget.`,
  )
}

const verifyResultAndReplay = async (
  page: Page,
  exhibition: ProofExhibition,
  matchup: VerifiedExhibition["matchup"],
): Promise<VerifiedExhibition> => {
  let observedStatus = "unknown"
  let observedMatchStatuses: string[] = []
  const resultTiming = await timed(async () => {
    await page.goto(
      exhibition.publicHref ??
        `/matchsets/${encodeURIComponent(exhibition.matchSetId)}`,
    )
    await expect(
      page.getByRole("heading", { name: /Smoke exhibition/i }),
    ).toBeVisible()
    const matchSetEvidence = page.getByTestId("matchset-evidence-panel")
    await expect(matchSetEvidence).toBeVisible()
    await expect(
      matchSetEvidence.getByText(/non-counted exhibition/),
    ).toBeVisible()
    await expect(
      matchSetEvidence.getByText(/WASM\/WASI is v1\.21 runtime-candidate/i),
    ).toBeVisible()
    await expect(
      matchSetEvidence.getByText(/Rust · non-counted exhibition alpha/),
    ).toBeVisible()
    await expect(matchSetEvidence.getByText(/timeout budget/i)).toBeVisible()
    const summary = await readMatchSetSummary(page, exhibition.matchSetId)
    observedStatus = summary.status
    observedMatchStatuses = summary.matches.map((match) => match.status)
    expect(observedMatchStatuses.length).toBeGreaterThan(0)
    expect(observedMatchStatuses).not.toContain("pending")
    expect(observedMatchStatuses).not.toContain("running")
    return expectPublicSafe(page)
  })

  const replayTiming = await timed(async () => {
    const replayLink = page.getByRole("link", { name: "Replay" }).first()
    await expect(replayLink).toBeVisible()
    await replayLink.click()
    await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
    const replayEvidence = page.getByTestId("replay-evidence-panel")
    await expect(replayEvidence).toBeVisible()
    await expect(replayEvidence.getByText(/timeout budget/i)).toBeVisible()
    await expect(
      replayEvidence.getByText(/Replay DTO shows public outcome evidence/i),
    ).toBeVisible()
    await expect(
      page.getByRole("slider", { name: "Replay timeline" }),
    ).toBeVisible()
    await expect(
      page.getByRole("img", { name: /Replay board at sequence 0/i }),
    ).toBeVisible()
    return expectPublicSafe(page)
  })

  return {
    ...exhibition,
    matchup,
    observedStatus,
    observedMatchStatuses,
    resultPageMs: resultTiming.durationMs,
    replayPageMs: replayTiming.durationMs,
    resultBodyLength: resultTiming.value,
    replayBodyLength: replayTiming.value,
  }
}

const readJsonArtifact = (artifactPath: string): unknown => {
  try {
    return JSON.parse(readFileSync(artifactPath, "utf8")) as unknown
  } catch {
    return { unavailable: true }
  }
}

const writeProofArtifacts = (proof: unknown): void => {
  mkdirSync(artifactDir, { recursive: true })
  writeFileSync(proofJsonPath, `${JSON.stringify(proof, null, 2)}\n`)
  const summary = proof as {
    cycles: {
      cycle: number
      exhibitions: {
        matchSetId: string
        matchup: string
        observedStatus: string
        observedMatchStatuses: string[]
        resultPageMs: number
        replayPageMs: number
      }[]
    }[]
    totals: {
      matchSetCount: number
      workerIterations: number
      privateMarkerScanPassed: boolean
    }
    promotionDecision: {
      rustStatus: string
      wasmWasiStatus: string
      zigStatus: string
    }
  }
  const lines = [
    "# v1.21 Signed-In Rust Exhibition Proof",
    "",
    `Cycles: ${summary.cycles.length}`,
    `MatchSets: ${summary.totals.matchSetCount}`,
    `Worker iterations: ${summary.totals.workerIterations}`,
    `Private marker scan passed: ${summary.totals.privateMarkerScanPassed ? "yes" : "no"}`,
    "",
    "## Promotion Decision",
    "",
    `- Rust: ${summary.promotionDecision.rustStatus}.`,
    `- WASM/WASI: ${summary.promotionDecision.wasmWasiStatus}.`,
    `- Zig: ${summary.promotionDecision.zigStatus}.`,
    "",
    "## Observed Exhibitions",
    "",
    "| Cycle | Matchup | MatchSet | Observed status | Match statuses | Result page ms | Replay page ms |",
    "| --- | --- | --- | --- | --- | ---: | ---: |",
    ...summary.cycles.flatMap((cycle) =>
      cycle.exhibitions.map(
        (exhibition) =>
          `| ${cycle.cycle} | ${exhibition.matchup} | ${exhibition.matchSetId} | ${exhibition.observedStatus} | ${exhibition.observedMatchStatuses.join(", ")} | ${exhibition.resultPageMs} | ${exhibition.replayPageMs} |`,
      ),
    ),
    "",
  ]
  writeFileSync(proofMarkdownPath, `${lines.join("\n")}\n`)
}

test("signed-in v1.21 Rust WASM exhibition proof covers two bounded cycles", async ({
  page,
}) => {
  test.setTimeout(420_000)
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()

  const workshop = await page.request.get("/api/workshop")
  expect(workshop.status(), await workshop.text()).toBe(200)
  const workshopBody = (await workshop.json()) as { templateSource: string }

  const cycles: {
    cycle: number
    account: { handle: string; signupMs: number }
    revisions: { jsTs: string; rust: string[] }
    createMs: number
    workerMs: number
    settleMs: number
    workerStatuses: number[]
    extraSettleWorkerStatuses: number[]
    exhibitions: VerifiedExhibition[]
  }[] = []
  let totalWorkerIterations = 0
  const suffix = Date.now().toString(36)

  for (let cycle = 1; cycle <= 2; cycle += 1) {
    const handle = `v121-${suffix}-${cycle}`
    const signupTiming = await timed(async () => {
      const signup = await page.request.post("/api/auth/sign-up", {
        data: {
          username: `v121_${suffix}_${cycle}`,
          handle,
          displayName: `v1.21 Rust Proof ${cycle}`,
          password: `v121-proof-${suffix}-${cycle}`,
        },
      })
      expect(signup.status(), await signup.text()).toBe(201)
    })
    const [tsRevisionId, rustStoneId, rustHoldId] = await Promise.all([
      saveRevision(page, {
        source: workshopBody.templateSource,
        sourceFormat: "typescript",
        label: `v1.21 JS/TS regression proof revision ${cycle}`,
        notes: "Signed-in v1.21 JS/TS regression proof.",
      }),
      saveRevision(page, {
        source: rustStoneSource,
        sourceFormat: "rust",
        label: `v1.21 Rust stone proof revision ${cycle}`,
        notes: "Signed-in v1.21 non-counted exhibition alpha proof.",
      }),
      saveRevision(page, {
        source: rustHoldSource,
        sourceFormat: "rust",
        label: `v1.21 Rust hold proof revision ${cycle}`,
        notes: "Signed-in v1.21 non-counted exhibition alpha proof.",
      }),
    ])

    await page.goto("/account")
    await expect(
      page.getByText("Rust · non-counted exhibition alpha"),
    ).toHaveCount(2)

    const created = await timed(async () => {
      const mixed = await createExhibition(page, [tsRevisionId, rustStoneId])
      const rustOnly = await createExhibition(page, [rustStoneId, rustHoldId])
      return { mixed, rustOnly }
    })
    const worker = await timed(async () => runWorkerIterations(page, 4))
    const exhibitions = [created.value.mixed, created.value.rustOnly]
    const settle = await timed(async () =>
      settleExhibitions(page, exhibitions, {
        maxExtraIterations: 10,
        maxWaitMs: 180_000,
      }),
    )
    const workerStatuses = [...worker.value, ...settle.value.workerStatuses]
    totalWorkerIterations += workerStatuses.length
    cycles.push({
      cycle,
      account: { handle, signupMs: signupTiming.durationMs },
      revisions: {
        jsTs: tsRevisionId,
        rust: [rustStoneId, rustHoldId],
      },
      createMs: created.durationMs,
      workerMs: worker.durationMs,
      settleMs: settle.durationMs,
      workerStatuses,
      extraSettleWorkerStatuses: settle.value.workerStatuses,
      exhibitions: [
        await verifyResultAndReplay(page, created.value.mixed, "js-ts-vs-rust"),
        await verifyResultAndReplay(
          page,
          created.value.rustOnly,
          "rust-vs-rust",
        ),
      ],
    })
  }

  const proof = {
    schemaVersion: "v1.21-signed-in-rust-exhibition-proof",
    generatedAt: new Date().toISOString(),
    boundedRepeatCount: 2,
    accounts: cycles.map((cycle) => cycle.account),
    revisions: cycles.map((cycle) => cycle.revisions),
    cycles,
    totals: {
      matchSetCount: cycles.reduce(
        (count, cycle) => count + cycle.exhibitions.length,
        0,
      ),
      workerIterations: totalWorkerIterations,
      privateMarkerScanPassed: true,
      jsTsRegressionChecked: true,
      rustVsRustChecked: true,
      mixedJsTsVsRustChecked: true,
    },
    runtimePath:
      "web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> WASM/WASI runtime implementation -> Wasmtime -> immutable Rust WASM artifact",
    runtimeServiceAdapterEvidence:
      process.env.COWARDS_RUNTIME_SERVICE_PROOF_ADAPTER ??
      "not supplied by proof runner",
    candidateEvidence: {
      wasmWasiProbes: readJsonArtifact(
        ".planning/artifacts/v1.21-wasm-wasi-hostile-probe-evidence.json",
      ),
      zigReadiness: readJsonArtifact(
        ".planning/artifacts/v1.21-zig-readiness-evidence.json",
      ),
    },
    promotionDecision: {
      rustStatus: "non-counted exhibition alpha only",
      wasmWasiStatus:
        "runtime candidate evidence only; no production sandbox certification",
      zigStatus: "fail-loud unavailable unless readiness proof passes",
    },
  }
  writeProofArtifacts(proof)
})
