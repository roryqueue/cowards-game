import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { expect, test, type Page } from "@playwright/test"

const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN
const artifactDir = ".planning/artifacts"
const proofJsonPath = path.join(
  artifactDir,
  "v1.32-four-language-signed-in-proof.json",
)
const proofMarkdownPath = path.join(
  artifactDir,
  "v1.32-four-language-signed-in-proof.md",
)
const sessionCookieName = "cowards_session"

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "strategySource",
  "rawRuntimeDetails",
  "privateRuntime",
  "runtimeInternals",
  "Traceback",
  "DATABASE_URL",
  "Bearer ",
  "COWARDS_GO_BACKEND_INTERNAL_TOKEN",
] as const

const pythonSource = `
def select_activations(input):
    soldiers = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [{"soldierId": soldier["id"], "objective": {"role": "screen"}} for soldier in soldiers[: input["activationCount"]]],
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    for cell in input["awarenessGrid"]["cells"]:
        if cell["contents"] == "ENEMY_ACTIVE":
            if (cell["dx"] == 0 and (cell["dy"] == -1 or cell["dy"] == 1)) or (cell["dy"] == 0 and (cell["dx"] == -1 or cell["dx"] == 1)):
                return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
    return {"action": {"type": "TURN", "direction": input["self"]["facing"] or "UP"}, "soldierMemory": input["soldierMemory"]}
`.trim()

const rustSource = `
use std::io::{self, Read};

fn first_active_soldier_id(input: &str) -> Option<&str> {
    let soldiers_start = input.find("\\"mySoldiers\\":[")?;
    let soldiers = &input[soldiers_start..];
    let active = soldiers.find("\\"status\\":\\"ACTIVE\\"")?;
    let before_active = &soldiers[..active];
    let id_start = before_active.rfind("\\"id\\":\\"")? + "\\"id\\":\\"".len();
    let after_id = &before_active[id_start..];
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
            r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[{{"soldierId":"{}","objective":{{"stance":"rust-proof"}}}}],"strategyMemory":null}}}}"#,
            soldier_id
        );
    } else {
        println!(r#"{{"ok":true,"abiVersion":"strategy-runtime-abi-v1.14","value":{{"activationOrders":[],"strategyMemory":null}}}}"#);
    }
}
`.trim()

const zigSource = `
const Iovec = extern struct { buf: [*]u8, buf_len: usize };
const Ciovec = extern struct { buf: [*]const u8, buf_len: usize };

extern "wasi_snapshot_preview1" fn fd_read(u32, *const Iovec, usize, *usize) u16;
extern "wasi_snapshot_preview1" fn fd_write(u32, *const Ciovec, usize, *usize) u16;

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

fn containsBytes(haystack: []const u8, needle: []const u8) bool {
    return indexOfBytes(haystack, needle) != null;
}

fn firstActiveSoldierId(input: []const u8) ?[]const u8 {
    const soldiers_marker = "\\"mySoldiers\\":[";
    const id_marker = "\\"id\\":\\"";
    const active_marker = "\\"status\\":\\"ACTIVE\\"";
    const soldiers_start = indexOfBytes(input, soldiers_marker) orelse return null;
    const soldiers = input[soldiers_start..];
    const active = indexOfBytes(soldiers, active_marker) orelse return null;
    const before_active = soldiers[0..active];
    var last_id: ?usize = null;
    var offset: usize = 0;
    while (offset < before_active.len) : (offset += 1) {
        if (indexOfBytes(before_active[offset..], id_marker)) |found| {
            last_id = offset + found;
            offset = offset + found + id_marker.len;
        }
    }
    const id_index = last_id orelse return null;
    const id_start = id_index + id_marker.len;
    const after_id = before_active[id_start..];
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
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"action\\":{\\"type\\":\\"TURN\\",\\"direction\\":\\"UP\\"},\\"soldierMemory\\":null}}\\n");
    } else if (firstActiveSoldierId(input_buf[0..nread])) |soldier_id| {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[{\\"soldierId\\":\\"");
        writeAll(soldier_id);
        writeAll("\\",\\"objective\\":{\\"stance\\":\\"zig-proof\\"}}],\\"strategyMemory\\":null}}\\n");
    } else {
        writeAll("{\\"ok\\":true,\\"abiVersion\\":\\"strategy-runtime-abi-v1.14\\",\\"value\\":{\\"activationOrders\\":[],\\"strategyMemory\\":null}}\\n");
    }
}
`.trim()

test.skip(
  process.env.RUN_V1_32_PROOF !== "1",
  "v1.32 signed-in proof requires live web, Go backend, runtime-service, Postgres, Wasmtime, Rust wasm32-wasip1, Zig, and RUN_V1_32_PROOF=1.",
)

interface Timed<T> {
  value: T
  durationMs: number
}

type SourceFormat = "typescript" | "python" | "rust" | "zig"
type SessionCookie = `${typeof sessionCookieName}=${string}`
type Matchup =
  | "typescript-vs-python"
  | "typescript-vs-rust"
  | "typescript-vs-zig"
  | "python-vs-rust"
  | "python-vs-zig"
  | "rust-vs-zig"

interface ProofExhibition {
  matchSetId: string
  publicHref?: string | undefined
}

interface PublicMatchSetSummary {
  matchSetId: string
  status: string
  metadata?: { countedStatus?: string | undefined } | undefined
  matches: {
    matchId: string
    status: string
    replayAvailable?: boolean | undefined
  }[]
}

interface VerifiedExhibition extends ProofExhibition {
  matchup: Matchup
  observedStatus: string
  countedStatus: string | null
  observedMatchStatuses: string[]
  resultPageMs: number
  replayPageMs: number
  resultBodyLength: number
  replayBodyLength: number
  replayMatchId: string
  replayBoardCanvasBytes: number
}

interface ProofAccount {
  handle: string
  sessionCookie: SessionCookie
  signupMs: number
  revisions: Record<SourceFormat, string>
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

const expectNoHorizontalOverflow = async (page: Page): Promise<void> => {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 2)
}

const extractSessionCookie = (setCookie: string): SessionCookie => {
  const cookie = setCookie
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${sessionCookieName}=`))
  expect(
    cookie,
    "sign-up response must set a Coward's Game session",
  ).toBeTruthy()
  return cookie!.split(";")[0] as SessionCookie
}

const addBrowserSessionCookie = async (
  page: Page,
  sessionCookie: SessionCookie,
): Promise<void> => {
  const value = sessionCookie.slice(`${sessionCookieName}=`.length)
  await page.context().addCookies([
    {
      name: sessionCookieName,
      value: decodeURIComponent(value),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ])
}

const saveRevision = async (
  page: Page,
  sessionCookie: SessionCookie,
  input: {
    source: string
    sourceFormat: SourceFormat
    label: string
    notes: string
  },
): Promise<string> => {
  const response = await page.request.post("/api/account/revisions/save", {
    headers: { cookie: sessionCookie },
    data: input,
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = (await response.json()) as { revision: { id: string } }
  return body.revision.id
}

const createProofAccount = async (
  page: Page,
  input: {
    suffix: string
    accountKey: string
    templateSource: string
  },
): Promise<ProofAccount> => {
  const handle = `v132-${input.suffix}-${input.accountKey}`
  const signupTiming = await timed(async () => {
    const signup = await page.request.post("/api/auth/sign-up", {
      data: {
        username: `v132_${input.suffix}_${input.accountKey}`,
        handle,
        displayName: "v1.32 Four-Language Proof",
        password: `v132-proof-${input.suffix}-${input.accountKey}`,
      },
    })
    expect(signup.status(), await signup.text()).toBe(201)
    return extractSessionCookie(signup.headers()["set-cookie"] ?? "")
  })
  const sessionCookie = signupTiming.value
  const revisions = {
    typescript: await saveRevision(page, sessionCookie, {
      source: input.templateSource,
      sourceFormat: "typescript",
      label: `v1.32 TypeScript counted proof revision ${input.accountKey}`,
      notes: "Signed-in v1.32 counted provider proof.",
    }),
    python: await saveRevision(page, sessionCookie, {
      source: pythonSource,
      sourceFormat: "python",
      label: `v1.32 Python counted proof revision ${input.accountKey}`,
      notes: "Signed-in v1.32 counted provider proof.",
    }),
    rust: await saveRevision(page, sessionCookie, {
      source: rustSource,
      sourceFormat: "rust",
      label: `v1.32 Rust counted proof revision ${input.accountKey}`,
      notes: "Signed-in v1.32 counted provider proof.",
    }),
    zig: await saveRevision(page, sessionCookie, {
      source: zigSource,
      sourceFormat: "zig",
      label: `v1.32 Zig counted proof revision ${input.accountKey}`,
      notes: "Signed-in v1.32 counted provider proof.",
    }),
  }
  return {
    handle,
    sessionCookie,
    signupMs: signupTiming.durationMs,
    revisions,
  }
}

const createCountedExhibition = async (
  page: Page,
  sessionCookie: SessionCookie,
  revisionIds: string[],
): Promise<ProofExhibition> => {
  const response = await page.request.post("/api/exhibitions", {
    headers: { cookie: sessionCookie },
    data: {
      presetId: "smoke-exhibition-v1",
      revisionIds,
      counted: true,
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
  summary.matches.some((match) => match.status === "running")

const settleExhibitions = async (
  page: Page,
  exhibitions: ProofExhibition[],
): Promise<{ workerStatuses: number[] }> => {
  const workerStatuses: number[] = []
  const startedAt = Date.now()
  while (Date.now() - startedAt <= 300_000) {
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
    if (workerStatuses.length > 24) {
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

const expectReplayBoardRealism = async (page: Page): Promise<number> => {
  await expect(
    page.getByRole("slider", { name: "Replay timeline" }),
  ).toBeVisible()
  await expect(
    page.getByRole("img", { name: /Replay board at sequence 0/i }),
  ).toBeVisible()
  const canvas = page.locator("canvas")
  await expect(canvas).toHaveCount(1)
  const dataUrl = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  )
  expect(dataUrl.length).toBeGreaterThan(500)
  return dataUrl.length
}

const verifyResultAndReplay = async (
  page: Page,
  exhibition: ProofExhibition,
  matchup: Matchup,
): Promise<VerifiedExhibition> => {
  let summary = await readMatchSetSummary(page, exhibition.matchSetId)
  const resultTiming = await timed(async () => {
    await page.goto(
      exhibition.publicHref ??
        `/matchsets/${encodeURIComponent(exhibition.matchSetId)}`,
    )
    await expect(
      page.getByRole("heading", { name: /Smoke exhibition/i }),
    ).toBeVisible()
    const evidence = page.getByTestId("matchset-evidence-panel")
    await expect(evidence).toBeVisible()
    await expect(evidence).toContainText("provider-compatible runtime evidence")
    await expect(evidence).toContainText("WASI Preview 1 stdin/stdout JSON")
    await expect(evidence).toContainText("not broad sandbox certification")
    await expect(page.locator("body")).toContainText("counted")
    await expectNoHorizontalOverflow(page)
    return expectPublicSafe(page)
  })

  summary = await readMatchSetSummary(page, exhibition.matchSetId)
  const replayableMatch = summary.matches.find((match) => match.replayAvailable)
  expect(replayableMatch).toBeTruthy()

  let canvasBytes = 0
  const replayTiming = await timed(async () => {
    await page.goto(
      `/matches/${encodeURIComponent(replayableMatch!.matchId)}/replay`,
    )
    await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
    const evidence = page.getByTestId("replay-evidence-panel")
    await expect(evidence).toBeVisible()
    await expect(evidence).toContainText("Replay DTO shows public outcome")
    canvasBytes = await expectReplayBoardRealism(page)
    await expectNoHorizontalOverflow(page)
    return expectPublicSafe(page)
  })

  return {
    ...exhibition,
    matchup,
    observedStatus: summary.status,
    countedStatus: summary.metadata?.countedStatus ?? null,
    observedMatchStatuses: summary.matches.map((match) => match.status),
    resultPageMs: resultTiming.durationMs,
    replayPageMs: replayTiming.durationMs,
    resultBodyLength: resultTiming.value,
    replayBodyLength: replayTiming.value,
    replayMatchId: replayableMatch!.matchId,
    replayBoardCanvasBytes: canvasBytes,
  }
}

const writeProofArtifacts = (proof: {
  account: { handle: string; signupMs: number }
  accounts: { handle: string; signupMs: number }[]
  totals: {
    matchSetCount: number
    workerIterations: number
    privateMarkerScanPassed: boolean
    pairwiseCoverage: Matchup[]
    desktopMobileLayoutChecks: string[]
  }
  exhibitions: VerifiedExhibition[]
  providerIds: Record<SourceFormat, string>
  abiDecision: string
  antiAbuseBoundary: string
  boundaryMonitor: string
  privacyScan: string
  nonClaims: string[]
  promotionDecision: Record<string, string>
}): void => {
  mkdirSync(artifactDir, { recursive: true })
  writeFileSync(proofJsonPath, `${JSON.stringify(proof, null, 2)}\n`)
  const lines = [
    "# v1.32 Four-Language Signed-In Proof",
    "",
    `Account: @${proof.account.handle}`,
    `MatchSets: ${proof.totals.matchSetCount}`,
    `Worker iterations: ${proof.totals.workerIterations}`,
    `Private marker scan passed: ${proof.totals.privateMarkerScanPassed ? "yes" : "no"}`,
    `Pairwise coverage: ${proof.totals.pairwiseCoverage.join(", ")}`,
    `Desktop/mobile checks: ${proof.totals.desktopMobileLayoutChecks.join(", ")}`,
    "",
    "## Promotion Decision",
    "",
    ...Object.entries(proof.promotionDecision).map(
      ([label, value]) => `- ${label}: ${value}`,
    ),
    "",
    "## Accounts",
    "",
    ...proof.accounts.map(
      (account) => `- @${account.handle}: signup ${account.signupMs} ms`,
    ),
    "",
    "## Provider and Boundary Evidence",
    "",
    ...Object.entries(proof.providerIds).map(
      ([label, value]) => `- ${label}: ${value}`,
    ),
    `- ABI decision: ${proof.abiDecision}`,
    `- Boundary monitor: ${proof.boundaryMonitor}`,
    `- Privacy scan: ${proof.privacyScan}`,
    `- Anti-abuse boundary: ${proof.antiAbuseBoundary}`,
    "",
    "## Non-Claims",
    "",
    ...proof.nonClaims.map((claim) => `- ${claim}`),
    "",
    "## Observed MatchSets",
    "",
    "| Matchup | MatchSet | Counted status | Match statuses | Replay Match | Canvas bytes |",
    "| --- | --- | --- | --- | --- | ---: |",
    ...proof.exhibitions.map(
      (exhibition) =>
        `| ${exhibition.matchup} | ${exhibition.matchSetId} | ${exhibition.countedStatus ?? "unknown"} | ${exhibition.observedMatchStatuses.join(", ")} | ${exhibition.replayMatchId} | ${exhibition.replayBoardCanvasBytes} |`,
    ),
    "",
  ]
  writeFileSync(proofMarkdownPath, `${lines.join("\n")}\n`)
}

test("signed-in v1.32 proof covers TypeScript, Python, Rust, and Zig counted flows", async ({
  page,
}) => {
  test.setTimeout(600_000)
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()

  const workshop = await page.request.get("/api/workshop")
  expect(workshop.status(), await workshop.text()).toBe(200)
  const workshopBody = (await workshop.json()) as { templateSource: string }
  const suffix = Date.now().toString(36)
  const accountA = await createProofAccount(page, {
    suffix,
    accountKey: "a",
    templateSource: workshopBody.templateSource,
  })
  const accountB = await createProofAccount(page, {
    suffix,
    accountKey: "b",
    templateSource: workshopBody.templateSource,
  })
  await addBrowserSessionCookie(page, accountA.sessionCookie)

  await page.goto("/account")
  for (const label of [
    "TypeScript · Counted eligible",
    "Python · Counted eligible",
    "Rust · Counted eligible",
    "Zig · Counted eligible",
  ]) {
    await expect(page.getByText(label).first()).toBeVisible()
  }
  await expectNoHorizontalOverflow(page)

  await page.goto("/exhibitions/new")
  await expect(
    page.getByRole("heading", { name: /Create exhibition/i }),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: /Counted/i })).toBeVisible()

  const created = await timed(async () => ({
    typescriptVsPython: await createCountedExhibition(
      page,
      accountA.sessionCookie,
      [accountA.revisions.typescript, accountA.revisions.python],
    ),
    typescriptVsRust: await createCountedExhibition(
      page,
      accountA.sessionCookie,
      [accountA.revisions.typescript, accountA.revisions.rust],
    ),
    typescriptVsZig: await createCountedExhibition(
      page,
      accountA.sessionCookie,
      [accountA.revisions.typescript, accountA.revisions.zig],
    ),
    pythonVsRust: await createCountedExhibition(page, accountB.sessionCookie, [
      accountB.revisions.python,
      accountB.revisions.rust,
    ]),
    pythonVsZig: await createCountedExhibition(page, accountB.sessionCookie, [
      accountB.revisions.python,
      accountB.revisions.zig,
    ]),
    rustVsZig: await createCountedExhibition(page, accountB.sessionCookie, [
      accountB.revisions.rust,
      accountB.revisions.zig,
    ]),
  }))
  const exhibitions = Object.values(created.value)
  const worker = await timed(async () => runWorkerIterations(page, 12))
  const settle = await timed(async () => settleExhibitions(page, exhibitions))
  const workerStatuses = [...worker.value, ...settle.value.workerStatuses]

  await page.setViewportSize({ width: 1440, height: 900 })
  const verified: VerifiedExhibition[] = [
    await verifyResultAndReplay(
      page,
      created.value.typescriptVsPython,
      "typescript-vs-python",
    ),
    await verifyResultAndReplay(
      page,
      created.value.typescriptVsRust,
      "typescript-vs-rust",
    ),
    await verifyResultAndReplay(
      page,
      created.value.typescriptVsZig,
      "typescript-vs-zig",
    ),
    await verifyResultAndReplay(
      page,
      created.value.pythonVsRust,
      "python-vs-rust",
    ),
    await verifyResultAndReplay(
      page,
      created.value.pythonVsZig,
      "python-vs-zig",
    ),
    await verifyResultAndReplay(page, created.value.rustVsZig, "rust-vs-zig"),
  ]

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/workshop")
  await expect(
    page.getByRole("heading", { name: "Strategy Workshop" }),
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.goto("/learn#supported-languages")
  await expect(
    page.getByRole("heading", { name: /Supported Strategy languages/i }),
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.goto(
    `/matchsets/${encodeURIComponent(created.value.pythonVsZig.matchSetId)}`,
  )
  await expect(page.getByTestId("matchset-evidence-panel")).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.goto(
    `/matches/${encodeURIComponent(verified[0]!.replayMatchId)}/replay`,
  )
  await expectReplayBoardRealism(page)
  await expectNoHorizontalOverflow(page)

  const proof = {
    schemaVersion: "v1.32-four-language-signed-in-proof",
    generatedAt: new Date().toISOString(),
    account: {
      handle: `${accountA.handle}, ${accountB.handle}`,
      signupMs: accountA.signupMs + accountB.signupMs,
    },
    accounts: [
      { handle: accountA.handle, signupMs: accountA.signupMs },
      { handle: accountB.handle, signupMs: accountB.signupMs },
    ],
    revisions: { accountA: accountA.revisions, accountB: accountB.revisions },
    createMs: created.durationMs,
    workerMs: worker.durationMs,
    settleMs: settle.durationMs,
    workerStatuses,
    exhibitions: verified,
    totals: {
      matchSetCount: verified.length,
      workerIterations: workerStatuses.length,
      privateMarkerScanPassed: true,
      pairwiseCoverage: verified.map((entry) => entry.matchup),
      desktopMobileLayoutChecks: [
        "desktop-result-replay",
        "mobile-workshop",
        "mobile-learn",
        "mobile-result",
        "mobile-replay",
      ],
    },
    runtimePath:
      "web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> provider-selected runtime implementation",
    providerIds: {
      typescript: "strategy-language-provider-js-ts",
      python: "strategy-language-provider-python",
      rust: "strategy-language-provider-rust-wasi",
      zig: "strategy-language-provider-zig-wasi",
    },
    abiDecision:
      "WASI Preview 1 stdin/stdout JSON remains active for Rust/Zig.",
    countedEligibility:
      "TypeScript, Python, Rust, and Zig entered counted MatchSet paths with provider proof.",
    antiAbuseBoundary:
      "Pairwise proof uses two signed-in accounts to respect the live five-exhibition-create-per-hour account limit.",
    boundaryMonitor:
      ".planning/artifacts/v1.32-drift-monitor-boundary-proof.md",
    privacyScan: "Public result and replay body scans passed.",
    nonClaims: [
      "Provider-gated counted support is not broad sandbox certification.",
      "No Strategy execution was moved into web/API/Go.",
      "Public replay output omits Strategy source and private memory by default.",
    ],
    promotionDecision: {
      TypeScript: "counted eligible through JS/TS provider",
      Python: "counted eligible through constrained Python provider proof",
      Rust: "counted eligible through immutable WASM/WASI artifact provider proof",
      Zig: "counted eligible through no-std/import-audited WASM/WASI provider proof",
      Sandbox: "no broad production sandbox certification claimed",
    },
  }
  writeProofArtifacts(proof)
})
