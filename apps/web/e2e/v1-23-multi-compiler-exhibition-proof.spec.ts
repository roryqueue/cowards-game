import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN
const artifactDir = ".planning/artifacts"
const proofJsonPath = path.join(
  artifactDir,
  "v1.23-signed-in-multi-compiler-proof.json",
)
const proofMarkdownPath = path.join(
  artifactDir,
  "v1.23-signed-in-multi-compiler-proof.md",
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

const rustTurnSource = `
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
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"action":{{"type":"TURN","direction":"UP"}},"soldierMemory":null}}}}"#);
    } else if let Some(soldier_id) = first_active_soldier_id(&input) {
        println!(
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"turn"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`.trim()

const zigSourceForAction = (actionJson: string): string =>
  `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

fn containsBytes(haystack: []const u8, needle: []const u8) bool {
    return indexOfBytes(haystack, needle) != null;
}

fn indexOfBytes(haystack: []const u8, needle: []const u8) ?usize {
    if (needle.len == 0) return 0;
    if (haystack.len < needle.len) return null;
    var index: usize = 0;
    while (index <= haystack.len - needle.len) : (index += 1) {
        var matched = true;
        var offset: usize = 0;
        while (offset < needle.len) : (offset += 1) {
            if (haystack[index + offset] != needle[offset]) {
                matched = false;
                break;
            }
        }
        if (matched) return index;
    }
    return null;
}

fn firstActiveSoldierId(input: []const u8) ?[]const u8 {
    const soldiers_marker = "\\"mySoldiers\\":[";
    const id_marker = "\\"id\\":\\"";
    const soldiers_start = indexOfBytes(input, soldiers_marker) orelse return null;
    const soldiers = input[soldiers_start..];
    const id_start_relative = indexOfBytes(soldiers, id_marker) orelse return null;
    const id_start = id_start_relative + id_marker.len;
    const after_id = soldiers[id_start..];
    const id_end = indexOfBytes(after_id, "\\"") orelse return null;
    return after_id[0..id_end];
}

fn writeAll(bytes: []const u8) void {
    var written: usize = 0;
    var iov = Ciovec{ .buf = bytes.ptr, .buf_len = bytes.len };
    _ = fd_write(1, &iov, 1, &written);
}

export fn _start() void {
    var input_buf: [16384]u8 = undefined;
    var iov = Iovec{ .buf = &input_buf, .buf_len = input_buf.len };
    var nread: usize = 0;
    _ = fd_read(0, &iov, 1, &nread);
    if (containsBytes(input_buf[0..nread], "\\"methodName\\":\\"soldierBrain\\"")) {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":${actionJson},\\"soldierMemory\\":null}}\\n");
    } else if (firstActiveSoldierId(input_buf[0..nread])) |soldier_id| {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[{\\"soldierId\\":\\"");
        writeAll(soldier_id);
        writeAll("\\",\\"objective\\":{\\"stance\\":\\"zig-proof\\"}}],\\"strategyMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`.trim()

const zigStoneSource = zigSourceForAction('{\\"type\\":\\"TURN_TO_STONE\\"}')
const zigTurnSource = zigSourceForAction(
  '{\\"type\\":\\"TURN\\",\\"direction\\":\\"UP\\"}',
)

test.skip(
  process.env.RUN_V1_23_PROOF !== "1",
  "v1.23 signed-in multi-compiler proof requires live web, Go backend, runtime-service, Postgres, Wasmtime, Rust wasm32-wasip1, Zig, and RUN_V1_23_PROOF=1.",
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

type Matchup = "js-ts-vs-rust" | "rust-vs-rust" | "rust-vs-zig" | "zig-vs-zig"

interface VerifiedExhibition extends ProofExhibition {
  matchup: Matchup
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
    sourceFormat: "typescript" | "rust" | "zig"
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
): Promise<{ workerStatuses: number[] }> => {
  const workerStatuses: number[] = []
  const startedAt = Date.now()
  while (Date.now() - startedAt <= 240_000) {
    const summaries = await Promise.all(
      exhibitions.map((exhibition) =>
        readMatchSetSummary(page, exhibition.matchSetId),
      ),
    )
    if (!summaries.some(isUnsettled)) {
      return { workerStatuses }
    }
    if (!summaries.some(hasActiveRunningMatch)) {
      workerStatuses.push(...(await runWorkerIterations(page, 1)))
    }
    if (workerStatuses.length > 16) {
      throw new Error(
        `MatchSets did not settle after bounded worker iterations: ${JSON.stringify(
          summaries,
        )}`,
      )
    }
    await page.waitForTimeout(2_000)
  }
  throw new Error("MatchSets did not settle within proof wait budget.")
}

const verifyResultAndReplay = async (
  page: Page,
  exhibition: ProofExhibition,
  matchup: Matchup,
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
    await expect(matchSetEvidence).toContainText("non-counted exhibition")
    await expect(matchSetEvidence).toContainText("WASM/WASI is v1.23")
    await expect(matchSetEvidence).toContainText("non-counted exhibition beta")
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
    account: { handle: string; signupMs: number }
    revisions: Record<string, string | string[]>
    exhibitions: {
      matchSetId: string
      matchup: string
      observedStatus: string
      observedMatchStatuses: string[]
      resultPageMs: number
      replayPageMs: number
    }[]
    totals: {
      matchSetCount: number
      workerIterations: number
      privateMarkerScanPassed: boolean
      jsTsRegressionChecked: boolean
    }
    promotionDecision: {
      rustStatus: string
      zigStatus: string
      wasmWasiStatus: string
    }
  }
  const lines = [
    "# v1.23 Signed-In Multi-Compiler Proof",
    "",
    `Account: @${summary.account.handle}`,
    `MatchSets: ${summary.totals.matchSetCount}`,
    `Worker iterations: ${summary.totals.workerIterations}`,
    `Private marker scan passed: ${summary.totals.privateMarkerScanPassed ? "yes" : "no"}`,
    `JS/TS regression checked: ${summary.totals.jsTsRegressionChecked ? "yes" : "no"}`,
    "",
    "## Promotion Decision Inputs",
    "",
    `- Rust: ${summary.promotionDecision.rustStatus}.`,
    `- Zig: ${summary.promotionDecision.zigStatus}.`,
    `- WASM/WASI: ${summary.promotionDecision.wasmWasiStatus}.`,
    "",
    "## Observed Exhibitions",
    "",
    "| Matchup | MatchSet | Observed status | Match statuses | Result page ms | Replay page ms |",
    "| --- | --- | --- | --- | ---: | ---: |",
    ...summary.exhibitions.map(
      (exhibition) =>
        `| ${exhibition.matchup} | ${exhibition.matchSetId} | ${exhibition.observedStatus} | ${exhibition.observedMatchStatuses.join(", ")} | ${exhibition.resultPageMs} | ${exhibition.replayPageMs} |`,
    ),
    "",
  ]
  writeFileSync(proofMarkdownPath, `${lines.join("\n")}\n`)
}

test("signed-in v1.23 proof covers JS/TS, Rust, and Zig exhibitions", async ({
  page,
}) => {
  test.setTimeout(480_000)
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()

  const workshop = await page.request.get("/api/workshop")
  expect(workshop.status(), await workshop.text()).toBe(200)
  const workshopBody = (await workshop.json()) as { templateSource: string }
  const suffix = Date.now().toString(36)
  const handle = `v123-${suffix}`

  const signupTiming = await timed(async () => {
    const signup = await page.request.post("/api/auth/sign-up", {
      data: {
        username: `v123_${suffix}`,
        handle,
        displayName: "v1.23 Multi Compiler Proof",
        password: `v123-proof-${suffix}`,
      },
    })
    expect(signup.status(), await signup.text()).toBe(201)
  })

  const tsRevisionId = await saveRevision(page, {
    source: workshopBody.templateSource,
    sourceFormat: "typescript",
    label: "v1.23 JS/TS regression proof revision",
    notes: "Signed-in v1.23 JS/TS counted-path regression proof.",
  })
  const rustStoneId = await saveRevision(page, {
    source: rustStoneSource,
    sourceFormat: "rust",
    label: "v1.23 Rust stone proof revision",
    notes: "Signed-in v1.23 non-counted exhibition beta proof.",
  })
  const rustTurnId = await saveRevision(page, {
    source: rustTurnSource,
    sourceFormat: "rust",
    label: "v1.23 Rust turn companion revision",
    notes:
      "Companion Rust revision required because exhibitions require distinct revision ids.",
  })
  const zigStoneId = await saveRevision(page, {
    source: zigStoneSource,
    sourceFormat: "zig",
    label: "v1.23 Zig stone proof revision",
    notes: "Signed-in v1.23 non-counted exhibition beta proof.",
  })
  const zigTurnId = await saveRevision(page, {
    source: zigTurnSource,
    sourceFormat: "zig",
    label: "v1.23 Zig turn companion revision",
    notes:
      "Companion Zig revision required because exhibitions require distinct revision ids.",
  })

  await page.goto("/account")
  await expect(
    page.getByText("Rust · non-counted exhibition beta"),
  ).toHaveCount(2)
  await expect(page.getByText("Zig · non-counted exhibition beta")).toHaveCount(
    2,
  )

  const created = await timed(async () => ({
    jsTsVsRust: await createExhibition(page, [tsRevisionId, rustStoneId]),
    rustVsRust: await createExhibition(page, [rustStoneId, rustTurnId]),
    rustVsZig: await createExhibition(page, [rustStoneId, zigStoneId]),
    zigVsZig: await createExhibition(page, [zigStoneId, zigTurnId]),
  }))
  const exhibitions = [
    created.value.jsTsVsRust,
    created.value.rustVsRust,
    created.value.rustVsZig,
    created.value.zigVsZig,
  ]
  const worker = await timed(async () => runWorkerIterations(page, 6))
  const settle = await timed(async () => settleExhibitions(page, exhibitions))
  const workerStatuses = [...worker.value, ...settle.value.workerStatuses]

  const verified = [
    await verifyResultAndReplay(
      page,
      created.value.jsTsVsRust,
      "js-ts-vs-rust",
    ),
    await verifyResultAndReplay(page, created.value.rustVsRust, "rust-vs-rust"),
    await verifyResultAndReplay(page, created.value.rustVsZig, "rust-vs-zig"),
    await verifyResultAndReplay(page, created.value.zigVsZig, "zig-vs-zig"),
  ]

  const proof = {
    schemaVersion: "v1.23-signed-in-multi-compiler-proof",
    generatedAt: new Date().toISOString(),
    account: { handle, signupMs: signupTiming.durationMs },
    revisions: {
      jsTs: tsRevisionId,
      rustPrimary: rustStoneId,
      zigPrimary: zigStoneId,
      rustCompanion: rustTurnId,
      zigCompanion: zigTurnId,
      note: "The user-facing gate requires at least one saved JS/TS, Rust, and Zig revision. Same-language exhibitions require distinct revision ids, so companion Rust/Zig revisions are recorded.",
    },
    createMs: created.durationMs,
    workerMs: worker.durationMs,
    settleMs: settle.durationMs,
    workerStatuses,
    exhibitions: verified,
    totals: {
      matchSetCount: verified.length,
      workerIterations: workerStatuses.length,
      privateMarkerScanPassed: true,
      jsTsRegressionChecked: true,
      rustVsRustChecked: true,
      rustVsZigChecked: true,
      zigVsZigChecked: true,
    },
    runtimePath:
      "web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> WASM/WASI runtime implementation -> Wasmtime -> immutable Rust/Zig WASM artifacts",
    runtimeServiceAdapterEvidence:
      process.env.COWARDS_RUNTIME_SERVICE_PROOF_ADAPTER ??
      "not supplied by proof runner",
    candidateEvidence: {
      wasmWasiBetaReadiness: readJsonArtifact(
        ".planning/artifacts/v1.23-wasm-wasi-beta-readiness-evidence.json",
      ),
      abiReadiness: readJsonArtifact(
        ".planning/artifacts/v1.23-abi-readiness-evidence.json",
      ),
    },
    promotionDecision: {
      rustStatus: "non-counted exhibition beta only",
      zigStatus: "non-counted exhibition beta only",
      wasmWasiStatus:
        "runtime beta-readiness evidence only; no production sandbox certification",
    },
  }
  writeProofArtifacts(proof)
})
