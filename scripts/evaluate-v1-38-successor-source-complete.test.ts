import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  realpathSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { performance } from "node:perf_hooks"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, expect, it } from "vitest"
import { encodeCanonicalJson, hashCanonicalIdentity } from "@cowards/spec"
import {
  V138_PLAN_262_57_ROUTE_CONTRACT,
  V138_RECEIPT_DIRECT_COMMANDS,
  V138_ROUTE_7_SOURCE_MANIFEST,
  buildV138ExecutionContextV11Receipt,
  calibrateV138ParallelMatrix,
  buildV138Plan26257RouteStartV1,
  checkV138Plan26257RouteStartV1,
  checkV138Plan26256AuthorityRoute,
  checkV138Route7SourceCompleteness,
  dispatchV138CurrentMatrixDirectEntry,
  deriveV138Plan26257PreObservationProof,
  executeV138ParallelMatrix,
  runReceiptCli,
  writeV138Plan26257RouteStartV1,
  type V138ParallelShardRunner,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  V138_PLAN_262_30_FRESH_DESTINATIONS,
  V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA,
  V138_PLAN_262_56_CANONICAL_PATHS,
  V138_PLAN_262_57_FRESH_DESTINATIONS,
  V138_PLAN_262_57_ROUTE_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
  V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA,
  V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS,
  V138_PLAN_262_56_V9_CANONICAL_PATHS,
  V138_PLAN_262_57_ROUTE_CONTRACT_V9,
  V138_PLAN_262_60_SOURCE_PATHS,
  V138_PLAN_262_54_SOURCE_BASE7,
  V138_PLAN_262_54_SOURCE_PATHS,
  buildV138Plan26255ReviewDocument,
  inspectV138SourceIdentityA7,
  checkV138SuccessorSealCommitV7,
  buildV138Plan26256AuthorizationV9,
  buildV138SuccessorSourceSealV9,
  disposeV138DetachedOpenatHelper,
  inspectV138ProtectedHistoryV9,
  inspectV138SourceA9Custody,
  v138Plan26256AuthorizationLiteral,
  writeV138Plan26256AuthorizationV7,
  writeV138SuccessorSourceSealV7,
} from "./lib/v1-38-successor-source-seal.js"
import { buildV138ReviewV3CommandArgv, computeV138ReviewV3Root,
  V138_PLAN_262_60_CORRECTION_RUN, V138_REVIEW_V3_ROUTE_MANIFEST } from
  "./lib/v1-38-source-completeness-review-v3.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
afterAll(() => disposeV138DetachedOpenatHelper())
const SOURCE_PATHS = Object.freeze([
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)

const resolveRecordedA7 = (): string => {
  const explicit = process.env.V138_PLAN_262_54_EXACT_A7
  if (explicit !== undefined) {
    if (!/^[0-9a-f]{40}$/u.test(explicit)) {
      throw new TypeError("V138_PLAN_262_54_EXACT_A7_INVALID")
    }
    return explicit
  }
  const summary = readFileSync(path.resolve(repoRoot,
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-54-SUMMARY.md"),
  "utf8")
  const matches = [...summary.matchAll(/^- \*\*A7:\*\* `([0-9a-f]{40})`$/gmu)]
  if (matches.length !== 1) {
    throw new TypeError("V138_PLAN_262_54_RECORDED_A7_INVALID")
  }
  return matches[0]![1]!
}

const canonicalBytes = (value: unknown): Buffer => {
  const encoded = encodeCanonicalJson(value as never, {
    context: "canonical-manifest",
  })
  if (encoded.ok === false) throw new TypeError("TEST_CANONICAL_JSON_INVALID")
  return Buffer.from(`${Buffer.from(encoded.bytes).toString("utf8")}\n`, "utf8")
}

const recomputeReviewRoot = (value: Record<string, unknown>) => {
  const { reviewRoot: _discarded, ...body } = value
  const encoded = encodeCanonicalJson(body as never, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("TEST_CANONICAL_JSON_INVALID")
  return `sha256:${hashCanonicalIdentity("evidenceBundle", [
    Buffer.from(String(body.schemaVersion), "utf8"), encoded.bytes,
  ])}`
}

const admittedHeadroom = async () => ({ ok: true as const, observation: {
  metricId: "darwin-memorystatus-effective-available-basis-points-v1" as const,
  providerId: "apple-memory-pressure-q-v1" as const,
  parserId: "apple-memory-pressure-q-c-locale-parser-v1" as const,
  stdoutByteLength: 100,
  stdoutSha256:
    "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" as const,
  totalBytes: 4096, pageCount: 1, pageSizeBytes: 4096, percentage: 25,
  observedBasisPoints: 2500, disposition: "preflight_admitted" as const,
} })

it.each([false, true])(
  "bounds a never-settling shard runner (shared observer: %s)",
  async (withObserver) => {
    const inventory = await import(
      "./lib/v1-38-current-matrix-reproduction.js"
    ).then(({ enumerateV138CurrentMatrix }) =>
      enumerateV138CurrentMatrix(repoRoot))
    const neverSettles: V138ParallelShardRunner = { run: async () =>
      await new Promise<never>(() => undefined) }
    const started = performance.now()
    const receipt = await calibrateV138ParallelMatrix({ inventory,
      hardwareIdentity: { operatingSystem: "test", architecture: "test",
        nodeVersion: process.version, cpuIdentity: "test" },
      runner: neverSettles,
      ...(withObserver ? { sharedHeadroomObserver: admittedHeadroom } : {}),
      deadlinePolicy: { maxShardMilliseconds: 20,
        maxTotalRunMilliseconds: 80, cleanupGraceMilliseconds: 10 } })
    expect(performance.now() - started).toBeLessThan(1_000)
    expect(receipt).toMatchObject({ status: "stopped_process_failure",
      reason: "RESOURCE_POLICY_SHARD_TIMEOUT", acceptedCellsPublished: 0,
      partialAcceptedEvidenceReusable: false })
    expect(receipt.terminals.every(({ cleanup }) =>
      cleanup.exitAwaited === false)).toBe(true)
  },
)

const injectedSuccessfulRunner = (): V138ParallelShardRunner => ({ async run(
  shard, control) {
  control.onLaunch({ event: "child_launched", shardId: shard.shardId,
    laneId: shard.laneId, executionAttemptIds: shard.attempts.map(
      ({ executionAttemptId }: { executionAttemptId: string }) =>
        executionAttemptId) })
  control.onResourceSample({ childId: `child:${shard.shardId}`,
    childRssKilobytes: 100, hostTotalMemoryKilobytes: 10_000,
    hostFreeMemoryKilobytes: 5_000 })
  return { shardId: shard.shardId, laneId: shard.laneId,
    classification: "success" as const, elapsedMilliseconds: 100,
    maxRssKilobytes: 100, cleanup: { gracefulTerminationSent: false,
      forceTerminationSent: false, exitAwaited: true, orphanProcessIds: [] },
    outcomes: shard.attempts.map(({ executionAttemptId }:
      { executionAttemptId: string }) => ({ attemptId: executionAttemptId,
      classification: "success" as const, outcome: "draw" as const })) }
} })

const ROUTE_7_COMMANDS = Object.freeze([
  "--calibrate-parallel-v11-receipt",
  "--check-plan-262-57-pre-execution-readiness-v1",
  "--check-plan-262-57-pre-start-obstruction-v1",
  "--check-plan-262-57-terminal-v1",
  "--resolve-plan-262-57-pre-start-v1",
  "--write-authoritative-v12-receipt",
  "--write-execution-context-v11-receipt",
  "--write-headroom-preflight-v11-receipt",
  "--write-plan-262-57-route-start-v1",
  "--write-plan-262-57-terminal-v1",
])

const ROUTE_7_EXPORTS = Object.freeze([
  "V138_PLAN_262_57_ROUTE_CONTRACT",
  "V138_ROUTE_7_SOURCE_MANIFEST",
  "buildV138AuthoritativeMatrixV12Receipt",
  "buildV138ExecutionContextV11Receipt",
  "buildV138HostHeadroomPreflightV11Receipt",
  "buildV138ParallelCalibrationV11Receipt",
  "buildV138Plan26257RouteStartV1",
  "buildV138Plan26257TerminalV1",
  "checkV138AuthoritativeMatrixV12Receipt",
  "checkV138ExecutionContextV11Receipt",
  "checkV138HostHeadroomPreflightV11Receipt",
  "checkV138ParallelCalibrationV11Receipt",
  "checkV138Plan26257ConsumptionMarker",
  "checkV138Plan26257PreExecutionReadinessV1",
  "checkV138Plan26257PreStartObstructionBranch",
  "checkV138Plan26257PreStartObstructionV1",
  "checkV138Plan26257RouteStartV1",
  "checkV138Plan26257TerminalBranch",
  "checkV138Plan26257TerminalV1",
  "checkV138Route7SourceCompleteness",
  "writeV138AuthoritativeMatrixV12Receipt",
  "writeV138ExecutionContextV11Receipt",
  "writeV138HostHeadroomPreflightV11Receipt",
  "writeV138ParallelCalibrationV11Receipt",
  "writeV138Plan26257RouteStartV1",
  "writeV138Plan26257PreStartObstructionV1",
  "writeV138Plan26257TerminalV1",
])

it("PLAN_262_54_RED: route-7 production capability manifest is complete", async () => {
    const module = await import("./lib/v1-38-current-matrix-reproduction.js")
    const source = readFileSync(path.resolve(repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts"), "utf8")
    const missing = [
      ...ROUTE_7_COMMANDS.filter((command) => !source.includes(`\"${command}\"`))
        .map((command) => `command:${command}`),
      ...ROUTE_7_EXPORTS.filter((name) => !(name in module))
        .map((name) => `export:${name}`),
    ].sort()
    if (missing.length > 0) {
      throw new TypeError(
        `V138_PLAN_262_54_ROUTE_7_CAPABILITY_MISSING\n${missing.join("\n")}`,
      )
    }
    expect(missing).toEqual([])
})

it("keeps a closed v8 route-7 command, handler, destination, and disposition manifest", async () => {
  expect(checkV138Route7SourceCompleteness()).toBe(V138_ROUTE_7_SOURCE_MANIFEST)
  expect(V138_PLAN_262_57_ROUTE_CONTRACT_V9).toMatchObject({
    routeOrdinal: 7,
    authorizationSchema: V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA,
    sealSchema: V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA,
    executionContextSchema: "v1.38-current-matrix-execution-context-v11",
    preflightSchema: "v1.38-current-matrix-headroom-preflight-v11",
    calibrationSchema: "v1.38-current-matrix-calibration-v11",
    reproductionSchema: "v1.38-current-matrix-reproduction-v12",
    resourceSampleMilliseconds: 200,
    requiredHostHeadroomBasisPoints: 2500,
    calibrationAttemptCount: 8,
    calibrationShardCount: 4,
    reproductionCellCount: 540,
    noRetry: true,
  })
  expect(V138_PLAN_262_56_AUTHORIZATION_SCHEMA)
    .toBe("v1.38-plan-262-56-authorization-v7")
  expect(V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA)
    .toBe("v1.38-successor-source-seal-v7")
  expect(V138_PLAN_262_56_AUTHORIZATION_SCHEMA)
    .not.toBe(V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA)
  expect(V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA)
    .not.toBe(V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA)
  expect(V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS.every((repoPath) =>
    !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
  expect(V138_ROUTE_7_SOURCE_MANIFEST.map(({ command }) => command).sort())
    .toEqual([...ROUTE_7_COMMANDS].sort())
  expect(V138_ROUTE_7_SOURCE_MANIFEST.map(({ destination }) => destination))
    .toEqual(expect.arrayContaining(V138_PLAN_262_57_ROUTE_DESTINATIONS.slice(0, 5)))
  expect(new Set(V138_PLAN_262_57_FRESH_DESTINATIONS).size)
    .toBe(V138_PLAN_262_57_FRESH_DESTINATIONS.length)
  expect(V138_PLAN_262_57_FRESH_DESTINATIONS.some((candidate) =>
    V138_PLAN_262_47_FRESH_DESTINATIONS.includes(candidate as never))).toBe(false)
  expect(V138_PLAN_262_57_FRESH_DESTINATIONS.every((candidate) =>
    !existsSync(path.resolve(repoRoot, candidate)))).toBe(true)

  for (const command of ROUTE_7_COMMANDS) {
    expect(V138_RECEIPT_DIRECT_COMMANDS.has(command)).toBe(true)
    let reached = 0
    await dispatchV138CurrentMatrixDirectEntry(command, {
      runShard: () => { throw new TypeError("UNEXPECTED_SHARD") },
      runReceipt: () => { reached += 1 },
    })
    expect(reached).toBe(1)
  }
})

it("builds one atomic route start containing context:v11 and preflight consumption", () => {
  const root = `sha256:${"1".repeat(64)}`
  const route = {
    custody: { sourceA9: "a".repeat(40), sourceB9: "b".repeat(40),
      custodyRoot: root },
    authorization: { authorizationRoot: root },
    seal: { sealRoot: root },
    selectedRouteClosure: { closureRoot: root },
    protectedHistory: { protectedHistoryRoot: root,
      priorAuthorizationBytes: [] },
  }
  const context = buildV138ExecutionContextV11Receipt({ route: route as never,
    mode: "gsd-pattern-c-inline-main",
    cwd: "/Users/roryquinlan/runtime/cowards-game",
    terminalAgentRegistry: { schemaVersion:
      "v1.38-plan-262-57-terminal-agent-registry-v1",
      activeExecutorCount: 0, agents: [] } })
  const start = buildV138Plan26257RouteStartV1({ context })
  expect(checkV138Plan26257RouteStartV1(start)).toEqual(start)
  expect(start).toMatchObject({ routeOrdinal: 7, routeStarted: true,
    acceptedCellCount: 0, noRetry: true,
    preflightConsumption: { stage: "preflight", chargedAttemptCount: 1,
      noRetry: true } })
  expect(() => checkV138Plan26257RouteStartV1({ ...start,
    preflightConsumptionRoot: `sha256:${"0".repeat(64)}` }))
    .toThrow("MATRIX_PLAN_262_57_ROUTE_START_INVALID")
})

it("dispatches every malformed route-7 CLI branch without invoking injected effects", async () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-route-7-cli-"))
  let observations = 0
  let calibrations = 0
  let reproductions = 0
  try {
    const expected = new Map<string, string>([
      ["--check-plan-262-57-pre-execution-readiness-v1",
        "MATRIX_PLAN_262_57_PRE_START_CLI_ARGUMENTS_INVALID"],
      ["--check-plan-262-57-pre-start-obstruction-v1",
        "MATRIX_PLAN_262_57_PRE_START_CLI_ARGUMENTS_INVALID"],
      ["--resolve-plan-262-57-pre-start-v1",
        "MATRIX_PLAN_262_57_PRE_START_CLI_ARGUMENTS_INVALID"],
      ["--write-execution-context-v11-receipt",
        "MATRIX_PLAN_262_57_ROUTE_START_CLI_ARGUMENTS_INVALID"],
      ["--write-plan-262-57-route-start-v1",
        "MATRIX_PLAN_262_57_ROUTE_START_CLI_ARGUMENTS_INVALID"],
      ["--write-headroom-preflight-v11-receipt",
        "MATRIX_PREFLIGHT_V11_CLI_ARGUMENTS_INVALID"],
      ["--calibrate-parallel-v11-receipt",
        "MATRIX_CALIBRATION_V11_CLI_ARGUMENTS_INVALID"],
      ["--write-authoritative-v12-receipt",
        "MATRIX_REPRODUCTION_V12_CLI_ARGUMENTS_INVALID"],
      ["--write-plan-262-57-terminal-v1",
        "MATRIX_PLAN_262_57_CLI_ARGUMENTS_INVALID"],
      ["--check-plan-262-57-terminal-v1",
        "MATRIX_PLAN_262_57_CLI_ARGUMENTS_INVALID"],
    ])
    for (const [command, diagnostic] of expected) {
      await expect(runReceiptCli({ repoRoot: fixtureRoot,
        argv: ["node", "route", command],
        observeHeadroom: async () => { observations += 1
          return { ok: false, reason: "resource_measurement_unavailable" } },
        calibrate: async () => { calibrations += 1; throw new Error() },
        executeMatrix: async () => { reproductions += 1; throw new Error() },
        writeOutput: () => { throw new TypeError("UNEXPECTED_OUTPUT") },
      })).rejects.toThrow(diagnostic)
    }
    expect({ observations, calibrations, reproductions })
      .toEqual({ observations: 0, calibrations: 0, reproductions: 0 })
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

it("reaches the real v9 authority checker and route-start handler through full argv", async () => {
  const fixtureParent = mkdtempSync(path.join(tmpdir(), "v138-route-7-v9-"))
  const fixtureRoot = path.join(fixtureParent, "repository")
  const git = (...args: string[]) => execFileSync("git", args, {
    cwd: fixtureRoot, encoding: "utf8" }).trim()
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, fixtureRoot])
    git("config", "user.name", "Plan 262-60 V9 Fixture")
    git("config", "user.email", "plan-262-60-v9@example.invalid")
    const run = git("log", "--first-parent", "--reverse", "--format=%H",
      `--grep=Plan-262-60-Author-Run: ${V138_PLAN_262_60_CORRECTION_RUN}`)
      .split("\n").filter(Boolean)
    const sourceA9 = run.at(-1)!
    const sourceBase9 = git("show", "-s", "--format=%P", run[0]!)
    git("checkout", "--detach", sourceA9)
    const custody = inspectV138SourceA9Custody(fixtureRoot,
      { sourceBase9, sourceA9 })
    const history = inspectV138ProtectedHistoryV9(fixtureRoot, sourceA9)
    const sourceBaseBlobs = V138_PLAN_262_60_SOURCE_PATHS.map((repoPath) => {
      const entry = git("ls-tree", sourceBase9, "--", repoPath)
      if (entry === "") return { path: repoPath, mode: "deleted", blobOid: null,
        sha256: null, byteLength: 0 }
      const bytes = execFileSync("git", ["show", `${sourceBase9}:${repoPath}`],
        { cwd: fixtureRoot })
      return { path: repoPath, mode: entry.split(/\s+/u)[0],
        blobOid: git("rev-parse", `${sourceBase9}:${repoPath}`),
        sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
        byteLength: bytes.byteLength }
    })
    const snapshotRoot = (records: unknown) => {
      const encoded = encodeCanonicalJson(records as never,
        { context: "canonical-manifest" })
      if (!encoded.ok) throw new TypeError("TEST_CANONICAL_JSON_INVALID")
      return `sha256:${hashCanonicalIdentity("artifactManifest", [
        Buffer.from("v1.38-review-v3-source-snapshot-v1", "utf8"),
        encoded.bytes])}`
    }
    const body: Record<string, any> = {
      schemaVersion: "v1.38-plan-262-62-source-completeness-review-v3",
      sourceBase9, sourceA9,
      sourceCustody: { tree: custody.sourceA9Tree,
        parent: custody.sourceA9Parent,
        authorRun: V138_PLAN_262_60_CORRECTION_RUN,
        paths: custody.sourceA9Paths, blobs: custody.sourceA9Blobs,
        deletionHistory: custody.deletionHistory },
      routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST,
      protectedHistory: { root: history.protectedHistoryRoot,
        protectedA8: sourceA9, protectedRoots: history.protectedRoots },
      chargeIds: [5, 6, 7, 8, 9].flatMap(version =>
        Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`)),
      priorAuthorizationBytes: history.priorAuthorizationBytes,
      snapshots: [{ name: "before", inventoryRoot: snapshotRoot(sourceBaseBlobs),
        pathCount: sourceBaseBlobs.length },
      { name: "after", inventoryRoot: snapshotRoot(custody.sourceA9Blobs),
        pathCount: custody.sourceA9Blobs.length }],
      orderedEvents: V138_REVIEW_V3_ROUTE_MANIFEST.map((observation, ordinal) => ({
        ordinal, event: observation.handler, path: observation.destination,
        result: observation.terminalDisposition ?? "none" })),
      cleanup: { complete: true, residualPaths: [] },
      publication: { changedPaths: [
        V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview,
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md"] },
      verdict: { findingCount: 0, sourceCompletenessPassed: true,
        authorizesExecution: false },
      identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
        externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
        independentCustodyClaimed: false, proceduralContext: "fixture reviewer" },
    }
    const review = { ...body, reviewV3Root: computeV138ReviewV3Root(body) }
    const reviewPath = path.join(fixtureRoot,
      V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview)
    const reportPath = path.join(fixtureRoot,
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md")
    mkdirSync(path.dirname(reviewPath), { recursive: true })
    mkdirSync(path.dirname(reportPath), { recursive: true })
    writeFileSync(reviewPath, canonicalBytes(review))
    writeFileSync(reportPath, "# Fixture review\n")
    git("add", V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview,
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-62-REVIEW.md")
    git("commit", "-m", "test: publish fixture review v3")
    const detachedReview = path.join(realpathSync(fixtureParent),
      path.basename(V138_PLAN_262_56_V9_CANONICAL_PATHS.sourceCompletenessReview))
    writeFileSync(detachedReview, canonicalBytes(review)); chmodSync(detachedReview, 0o444)
    const authorization = buildV138Plan26256AuthorizationV9({ repoRoot: fixtureRoot,
      reviewV3AbsolutePath: detachedReview })
    const seal = buildV138SuccessorSourceSealV9({ repoRoot: fixtureRoot,
      authorization })
    writeFileSync(path.join(fixtureRoot,
      V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization), canonicalBytes(authorization))
    writeFileSync(path.join(fixtureRoot,
      V138_PLAN_262_56_V9_CANONICAL_PATHS.seal), canonicalBytes(seal))
    git("add", V138_PLAN_262_56_V9_CANONICAL_PATHS.authorization,
      V138_PLAN_262_56_V9_CANONICAL_PATHS.seal)
    git("commit", "-m", "test: publish fixture authorization v9")
    const sourceB9 = git("rev-parse", "HEAD")
    const anchor = checkV138Plan26256AuthorityRoute({ repoRoot: fixtureRoot,
      sourceA9, sourceB9, authorizationValue: authorization, sealValue: seal })
    expect(() => deriveV138Plan26257PreObservationProof({ repoRoot: fixtureRoot,
      sourceA9, anchor, disposition: "tool_identity_failed" }))
      .toThrow("MATRIX_PLAN_262_30_PRE_OBSERVATION_CHECK_SUCCEEDED")
    const mismatchedToolRoot = `sha256:${"9".repeat(64)}` as const
    let observedToolIdentityRoot = mismatchedToolRoot
    expect(deriveV138Plan26257PreObservationProof({ repoRoot: fixtureRoot,
      sourceA9, anchor, disposition: "tool_identity_failed",
      observationProviders: { toolIdentity: () => observedToolIdentityRoot } }))
      .toMatchObject({ disposition: "tool_identity_failed",
        sealedRoot: authorization.toolIdentity.expectedRoot,
        observedRoot: mismatchedToolRoot })
    const captured: Buffer[] = []
    const commands = ["--check-plan-262-57-pre-execution-readiness-v1",
      "--write-plan-262-57-route-start-v1"] as const
    for (const command of commands) {
      const argv = buildV138ReviewV3CommandArgv(command, sourceA9, sourceB9)
      expect(argv[argv.indexOf("--source-b9") + 1]).toBe(sourceB9)
      expect(sourceB9).not.toBe(sourceBase9)
      let output = ""
      await runReceiptCli({ repoRoot: fixtureRoot, argv,
        writeOutput: value => { output += value } })
      captured.push(Buffer.from(output, "utf8"))
    }
    expect(captured.every(bytes => bytes.byteLength > 0)).toBe(true)
    expect(new Set(captured.map(bytes => bytes.toString("hex"))).size).toBe(2)
    expect(new Set(captured.map(bytes => createHash("sha256").update(bytes)
      .digest("hex"))).size).toBe(2)
    const target = V138_PLAN_262_57_ROUTE_DESTINATIONS[0]!
    expect(JSON.parse(readFileSync(path.join(fixtureRoot, target), "utf8")))
      .toMatchObject({ routeOrdinal: 7, routeStarted: true,
        context: { sourceA9, sourceB9,
          schemaVersion: "v1.38-current-matrix-execution-context-v11" } })
  } finally {
    rmSync(fixtureParent, { recursive: true, force: true })
  }
}, 1_500_000)

it("keeps the obsolete v7 Git fixture retired after the real v9 route proof", () => {
  expect(V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS).toHaveLength(4)
  expect(V138_PLAN_262_56_OBSOLETE_V7_V8_PATHS.every((repoPath) =>
    !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
})
