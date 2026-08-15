import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync,
  unlinkSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import { performance } from "node:perf_hooks"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"
import { encodeCanonicalJson, hashCanonicalIdentity } from "@cowards/spec"
import {
  V138_PLAN_262_57_ROUTE_CONTRACT,
  V138_RECEIPT_DIRECT_COMMANDS,
  V138_ROUTE_7_SOURCE_MANIFEST,
  buildV138ExecutionContextV11Receipt,
  calibrateV138ParallelMatrix,
  buildV138Plan26257RouteStartV1,
  checkV138Plan26257RouteStartV1,
  checkV138Route7SourceCompleteness,
  dispatchV138CurrentMatrixDirectEntry,
  executeV138ParallelMatrix,
  runReceiptCli,
  writeV138Plan26257RouteStartV1,
  type V138ParallelShardRunner,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  V138_PLAN_262_30_FRESH_DESTINATIONS,
  V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_56_CANONICAL_PATHS,
  V138_PLAN_262_57_FRESH_DESTINATIONS,
  V138_PLAN_262_57_ROUTE_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
  V138_PLAN_262_54_SOURCE_BASE7,
  V138_PLAN_262_54_SOURCE_PATHS,
  buildV138Plan26255ReviewDocument,
  inspectV138SourceIdentityA7,
  checkV138SuccessorSealCommitV7,
  v138Plan26256AuthorizationLiteral,
  writeV138Plan26256AuthorizationV7,
  writeV138SuccessorSourceSealV7,
} from "./lib/v1-38-successor-source-seal.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
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

it("keeps a closed route-7 command, handler, destination, and disposition manifest", async () => {
  expect(checkV138Route7SourceCompleteness()).toBe(V138_ROUTE_7_SOURCE_MANIFEST)
  expect(V138_PLAN_262_57_ROUTE_CONTRACT).toMatchObject({
    routeOrdinal: 7,
    authorizationSchema: V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
    sealSchema: V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
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
    custody: { sourceA7: "a".repeat(40), sourceB7: "b".repeat(40),
      custodyRoot: root },
    authorization: { authorizationRoot: root },
    seal: { sealRoot: root, selectedRouteClosure: { closureRoot: root },
      protectedHistory: { protectedHistoryRoot: root,
        priorAuthorizationBytes: [] } },
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

it("reaches route-7 writers from exact recorded A7 despite docs descendants", async () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-route-7-git-"))
  const git = (...args: string[]) => execFileSync("git", args, {
    cwd: fixtureRoot, encoding: "utf8" }).trim()
  const before = V138_PLAN_262_57_FRESH_DESTINATIONS.map((repoPath) =>
    existsSync(path.resolve(repoRoot, repoPath)))
  let observations = 0
  let calibrations = 0
  let reproductions = 0
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot,
      fixtureRoot])
    git("config", "user.name", "Plan 262-54 Fixture")
    git("config", "user.email", "plan-262-54-fixture@example.invalid")
    const sourceA7 = resolveRecordedA7()
    git("checkout", "--detach", sourceA7)
    const custody = inspectV138SourceIdentityA7(fixtureRoot, sourceA7)
    expect(custody).toMatchObject({ sourceBase7:
      V138_PLAN_262_54_SOURCE_BASE7, sourceA7,
      aggregateChangedPaths: [...V138_PLAN_262_54_SOURCE_PATHS].sort() })
    expect(custody.reviewedSourceParents).toEqual([
      custody.sourceRangeCommits.at(-2) ?? V138_PLAN_262_54_SOURCE_BASE7])
    expect(git("rev-parse", `${sourceA7}^{tree}`)).toBe(
      custody.reviewedSourceTree)
    for (const blob of custody.reviewedSourceBlobs) {
      expect(git("rev-parse", `${sourceA7}:${blob.path}`)).toBe(blob.blobOid)
      expect(readFileSync(path.resolve(fixtureRoot, blob.path))).toEqual(
        readFileSync(path.resolve(repoRoot, blob.path)))
    }
    writeFileSync(path.resolve(fixtureRoot, "A7-DOCS-DESCENDANT.md"),
      "planning-only descendant\n")
    git("add", "A7-DOCS-DESCENDANT.md")
    git("commit", "-m", "docs: fixture post-A7 descendant")
    const docsDescendant = git("rev-parse", "HEAD")
    expect(docsDescendant).not.toBe(sourceA7)
    git("checkout", "--detach", sourceA7)
    expect(inspectV138SourceIdentityA7(fixtureRoot, sourceA7).sourceA7)
      .toBe(sourceA7)
    const review = buildV138Plan26255ReviewDocument(fixtureRoot, sourceA7)
    const falseIdentityClaim = { ...review, independentPersonClaimed: true,
      cryptographicReviewerIdentityClaimed: true } as Record<string, unknown>
    falseIdentityClaim.reviewRoot = recomputeReviewRoot(falseIdentityClaim)
    writeFileSync(path.resolve(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview),
    canonicalBytes(falseIdentityClaim))
    git("add", V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview)
    git("commit", "-m", "fixture: reject false independent-person claim")
    git("branch", "fabricated-review")
    expect(() => v138Plan26256AuthorizationLiteral(fixtureRoot, sourceA7,
      falseIdentityClaim)).toThrow("V138_PLAN_262_55_REVIEW_CUSTODY_INVALID")
    git("checkout", "--detach", sourceA7)
    git("branch", "-D", "fabricated-review")
    writeFileSync(path.resolve(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview),
    canonicalBytes(review))
    git("add", V138_PLAN_262_56_CANONICAL_PATHS.sourceCompletenessReview)
    git("commit", "-m", "fixture: procedural post-A7 source review")
    git("branch", "fixture-review-262-55")
    git("checkout", "--detach", sourceA7)
    expect(() => v138Plan26256AuthorizationLiteral(fixtureRoot, sourceA7,
      { ...review, reviewRoot: `sha256:${"5".repeat(64)}` }))
      .toThrow("V138_PLAN_262_55_REVIEW_INVALID")
    const literal = Buffer.from(v138Plan26256AuthorizationLiteral(fixtureRoot,
      sourceA7, review), "utf8")
    const authorization = writeV138Plan26256AuthorizationV7(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.authorization, sourceA7, review, literal)
    const seal = writeV138SuccessorSourceSealV7(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.seal, authorization)
    git("add", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      V138_PLAN_262_56_CANONICAL_PATHS.seal)
    git("commit", "-m", "fixture: seal source B7")
    const sourceB7 = git("rev-parse", "HEAD")
    expect(() => checkV138SuccessorSealCommitV7({ repoRoot: fixtureRoot,
      sourceA7, sourceB7, authorizationValue: { ...authorization,
        noRetry: false }, sealValue: seal })).toThrow(
      "V138_SUCCESSOR_SEAL_B7_COMMITTED_BYTES_INVALID")
    const authorizationPath = path.resolve(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.authorization)
    const authorizationBytes = readFileSync(authorizationPath)
    writeFileSync(authorizationPath, Buffer.concat([authorizationBytes,
      Buffer.from("\n")]))
    expect(() => checkV138SuccessorSealCommitV7({ repoRoot: fixtureRoot,
      sourceA7, sourceB7, authorizationValue: authorization,
      sealValue: seal })).toThrow("V138_SUCCESSOR_SEAL_B7_WORKTREE_DRIFT")
    writeFileSync(authorizationPath, authorizationBytes)
    const routeStart = V138_PLAN_262_57_ROUTE_DESTINATIONS[0]!
    const routeStartArgv = ["node", "route",
      "--write-plan-262-57-route-start-v1", routeStart,
      "--mode", "gsd-pattern-c-inline-main", "--cwd",
      "/Users/roryquinlan/runtime/cowards-game",
      "--terminal-agent-registry-json", JSON.stringify({ schemaVersion:
        "v1.38-plan-262-57-terminal-agent-registry-v1",
        activeExecutorCount: 0, agents: [] }), "--authorization",
      V138_PLAN_262_56_CANONICAL_PATHS.authorization, "--seal",
      V138_PLAN_262_56_CANONICAL_PATHS.seal, "--source-a7", sourceA7,
      "--source-b7", sourceB7]
    const sealedSourcePath = path.resolve(fixtureRoot, SOURCE_PATHS[0])
    const sealedSourceBytes = readFileSync(sealedSourcePath)
    writeFileSync(sealedSourcePath, Buffer.concat([sealedSourceBytes,
      Buffer.from("\n// drift\n")]))
    await expect(runReceiptCli({ repoRoot: fixtureRoot, argv: routeStartArgv,
      writeOutput: () => undefined })).rejects.toThrow(
      "V138_SUCCESSOR_SEAL_A7_WORKTREE_DRIFT")
    writeFileSync(sealedSourcePath, sealedSourceBytes)
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-pre-execution-readiness-v1",
      "--authorization", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      "--seal", V138_PLAN_262_56_CANONICAL_PATHS.seal,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    writeOutput: () => undefined })
    const danglingPath = path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!)
    symlinkSync("missing-route-7-target", danglingPath)
    await expect(runReceiptCli({ repoRoot: fixtureRoot, argv: routeStartArgv,
      writeOutput: () => undefined })).rejects.toThrow(
      "MATRIX_PLAN_262_57_ROUTE_ALREADY_RESERVED")
    unlinkSync(danglingPath)
    let competingWriterRejected = false
    expect(() => writeV138Plan26257RouteStartV1(fixtureRoot, routeStart,
      "gsd-pattern-c-inline-main",
      "/Users/roryquinlan/runtime/cowards-game", { schemaVersion:
        "v1.38-plan-262-57-terminal-agent-registry-v1",
        activeExecutorCount: 0, agents: [] },
      V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      V138_PLAN_262_56_CANONICAL_PATHS.seal, sourceA7, sourceB7, () => {
        try {
          writeV138Plan26257RouteStartV1(fixtureRoot, routeStart,
            "gsd-pattern-c-inline-main",
            "/Users/roryquinlan/runtime/cowards-game", { schemaVersion:
              "v1.38-plan-262-57-terminal-agent-registry-v1",
              activeExecutorCount: 0, agents: [] },
            V138_PLAN_262_56_CANONICAL_PATHS.authorization,
            V138_PLAN_262_56_CANONICAL_PATHS.seal, sourceA7, sourceB7)
        } catch (error) {
          competingWriterRejected = error instanceof Error && error.message ===
            "MATRIX_PLAN_262_57_ROUTE_ALREADY_RESERVED"
        }
        symlinkSync("racing-dangling-target", danglingPath)
      })).toThrow("MATRIX_PLAN_262_57_DESTINATION_NOT_FRESH")
    expect(competingWriterRejected).toBe(true)
    unlinkSync(danglingPath)
    await runReceiptCli({ repoRoot: fixtureRoot, argv: routeStartArgv,
      writeOutput: () => undefined })
    expect(existsSync(path.resolve(fixtureRoot, routeStart))).toBe(true)
    await expect(runReceiptCli({ repoRoot: fixtureRoot, argv: routeStartArgv,
      writeOutput: () => undefined })).rejects.toThrow(
      "MATRIX_PLAN_262_57_DESTINATION_NOT_FRESH")
    await expect(runReceiptCli({ repoRoot: fixtureRoot,
      argv: [...routeStartArgv.slice(0, 2),
        "--write-execution-context-v11-receipt", ...routeStartArgv.slice(3)],
      writeOutput: () => undefined })).rejects.toThrow(
      "MATRIX_PLAN_262_57_ROUTE_ALREADY_RESERVED")
    const terminalPath = V138_PLAN_262_57_ROUTE_DESTINATIONS[4]!
    const patternCObservation = { mode: "delegated-worker",
      cwd: "/tmp/not-canonical", terminalAgentRegistry: { schemaVersion:
        "v1.38-plan-262-57-terminal-agent-registry-v1",
      activeExecutorCount: 1, agents: ["worker"] } }
    const terminalBaseFlags = ["--authorization",
      V138_PLAN_262_56_CANONICAL_PATHS.authorization, "--seal",
      V138_PLAN_262_56_CANONICAL_PATHS.seal, "--route-start", routeStart,
      "--preflight", V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!,
      "--calibration", V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!,
      "--reproduction", V138_PLAN_262_57_ROUTE_DESTINATIONS[3]!,
      "--source-a7", sourceA7, "--source-b7", sourceB7]
    const observedRootOverrides = {
      tool_identity_failed:
        "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" as const,
      protected_history_failed:
        "sha256:123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0" as const,
      formation_absence_failed:
        "sha256:23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01" as const,
    }
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-terminal-v1", terminalPath,
      ...terminalBaseFlags, "--disposition", "consumed_stage_interrupted"],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
      "--terminal", terminalPath], writeOutput: () => undefined })
    unlinkSync(path.resolve(fixtureRoot, terminalPath))
    const preObservationDispositions = ["tool_identity_failed",
      "protected_history_failed", "formation_absence_failed",
      "pattern_c_ownership_failed"] as const
    const selectedDisposition = process.env.V138_TEST_DISPOSITION
    for (const disposition of preObservationDispositions.filter((candidate) =>
      selectedDisposition === undefined || candidate === selectedDisposition)) {
      const protectedDriftPath = path.resolve(fixtureRoot,
        V138_PLAN_262_30_FRESH_DESTINATIONS[3]!)
      if (disposition === "protected_history_failed") {
        writeFileSync(protectedDriftPath, "actual protected-history drift\n")
      }
      const dependencies = { repoRoot: fixtureRoot,
        patternCObservation: disposition === "pattern_c_ownership_failed" ?
          patternCObservation : undefined,
        observedRootOverrides: disposition === "protected_history_failed" ?
          { tool_identity_failed: observedRootOverrides.tool_identity_failed,
            formation_absence_failed:
              observedRootOverrides.formation_absence_failed } :
          observedRootOverrides, writeOutput: () => undefined }
      try {
        await runReceiptCli({ ...dependencies, argv: ["node", "route",
          "--write-plan-262-57-terminal-v1", terminalPath,
          ...terminalBaseFlags, "--disposition", disposition] })
      } catch (error) {
        throw new TypeError(`${disposition}:${error instanceof Error ?
          error.message : "UNKNOWN"}`)
      }
      await runReceiptCli({ ...dependencies, argv: ["node", "route",
        "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
        "--terminal", terminalPath] })
      const terminalBytes = readFileSync(path.resolve(fixtureRoot, terminalPath))
      const terminal = JSON.parse(terminalBytes.toString("utf8"))
      expect(terminal).toMatchObject({ disposition,
        artifactRoots: { context: expect.any(String), preflight: null },
        consumptionMarkerRoots: { preflight: expect.any(String),
          calibration: null, reproduction: null } })
      if (disposition === "tool_identity_failed") {
        terminal.preObservationProof.observedRoot =
          "sha256:3456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012"
        writeFileSync(path.resolve(fixtureRoot, terminalPath),
          canonicalBytes(terminal))
        await expect(runReceiptCli({ ...dependencies, argv: ["node", "route",
          "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
          "--terminal", terminalPath] })).rejects.toThrow(
          "MATRIX_PLAN_262_30_TERMINAL_INVALID")
        writeFileSync(path.resolve(fixtureRoot, terminalPath), terminalBytes)
      }
      if (disposition === "protected_history_failed") {
        const tampered = JSON.parse(terminalBytes.toString("utf8"))
        tampered.preObservationProof.observedRoot =
          `sha256:${"8".repeat(64)}`
        writeFileSync(path.resolve(fixtureRoot, terminalPath),
          canonicalBytes(tampered))
        await expect(runReceiptCli({ ...dependencies, argv: ["node", "route",
          "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
          "--terminal", terminalPath] })).rejects.toThrow(
          "MATRIX_PLAN_262_30_TERMINAL_INVALID")
        writeFileSync(path.resolve(fixtureRoot, terminalPath), terminalBytes)
        unlinkSync(protectedDriftPath)
      }
      unlinkSync(path.resolve(fixtureRoot, terminalPath))
    }
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-headroom-preflight-v11-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!, "--route-start", routeStart,
      "--authorization", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      "--seal", V138_PLAN_262_56_CANONICAL_PATHS.seal,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    observeHeadroom: async () => { observations += 1; return { ok: false,
      reason: "resource_measurement_unavailable" } },
    writeOutput: () => undefined })
    expect(observations).toBe(1)
    expect(JSON.parse(readFileSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!), "utf8")))
      .toMatchObject({ disposition: "preflight_unavailable",
        chargedIdentityId: "preflight:v11:0" })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-terminal-v1", terminalPath,
      ...terminalBaseFlags, "--disposition", "preflight_unavailable"],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
      "--terminal", terminalPath], writeOutput: () => undefined })
    unlinkSync(path.resolve(fixtureRoot, terminalPath))
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--calibrate-parallel-v11-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!, "--preflight",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!, "--route-start", routeStart,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    calibrate: async (input) => { calibrations += 1
      return calibrateV138ParallelMatrix({ ...input,
        runner: injectedSuccessfulRunner(),
        sharedHeadroomObserver: admittedHeadroom }) },
    writeOutput: () => undefined })
    expect(calibrations).toBe(0)
    await expect(runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-authoritative-v12-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[3]!, "--calibration",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!, "--route-start", routeStart,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    executeMatrix: async (input) => { reproductions += 1
      return executeV138ParallelMatrix({ ...input,
        runner: injectedSuccessfulRunner(),
        sharedHeadroomObserver: admittedHeadroom }) },
    writeOutput: () => undefined })).rejects.toThrow(
      "MATRIX_REPRODUCTION_V10_CALIBRATION_NOT_ADMITTED")
    expect(reproductions).toBe(0)
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[5]!))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!))
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-headroom-preflight-v11-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!, "--route-start", routeStart,
      "--authorization", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      "--seal", V138_PLAN_262_56_CANONICAL_PATHS.seal,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    observeHeadroom: async () => ({ ok: true, observation: {
      ...(await admittedHeadroom()).observation, percentage: 24,
      observedBasisPoints: 2400,
      disposition: "preflight_refused" as const } }),
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-terminal-v1", terminalPath,
      ...terminalBaseFlags, "--disposition", "preflight_refused"],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
      "--terminal", terminalPath], writeOutput: () => undefined })
    unlinkSync(path.resolve(fixtureRoot, terminalPath))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!))
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-headroom-preflight-v11-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!, "--route-start", routeStart,
      "--authorization", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      "--seal", V138_PLAN_262_56_CANONICAL_PATHS.seal,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    observeHeadroom: admittedHeadroom, writeOutput: () => undefined })
    const calibrationPath = path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!)
    symlinkSync("racing-calibration-target", calibrationPath)
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-terminal-v1", terminalPath,
      ...terminalBaseFlags, "--disposition", "fresh_destination_failed"],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
      "--terminal", terminalPath], writeOutput: () => undefined })
    unlinkSync(path.resolve(fixtureRoot, terminalPath))
    unlinkSync(calibrationPath)
    const calibrationArgv = ["node", "route",
      "--calibrate-parallel-v11-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!, "--preflight",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!, "--route-start", routeStart,
      "--source-a7", sourceA7, "--source-b7", sourceB7]
    await runReceiptCli({ repoRoot: fixtureRoot, argv: calibrationArgv,
      calibrate: async () => { calibrations += 1
        throw new TypeError("INJECTED_CALIBRATION_STOP") },
      writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-terminal-v1", terminalPath,
      ...terminalBaseFlags, "--disposition", "calibration_stopped"],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
      "--terminal", terminalPath], writeOutput: () => undefined })
    unlinkSync(path.resolve(fixtureRoot, terminalPath))
    unlinkSync(calibrationPath)
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[5]!))
    await runReceiptCli({ repoRoot: fixtureRoot, argv: calibrationArgv,
      calibrate: async (input) => { calibrations += 1
        return calibrateV138ParallelMatrix({ ...input,
          runner: injectedSuccessfulRunner(),
          sharedHeadroomObserver: admittedHeadroom }) },
      writeOutput: () => undefined })
    const reproductionArgv = ["node", "route",
      "--write-authoritative-v12-receipt",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[3]!, "--calibration",
      V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!, "--route-start", routeStart,
      "--source-a7", sourceA7, "--source-b7", sourceB7]
    await runReceiptCli({ repoRoot: fixtureRoot, argv: reproductionArgv,
      executeMatrix: async () => { reproductions += 1
        throw new TypeError("INJECTED_REPRODUCTION_STOP") },
      writeOutput: () => undefined })
    for (const disposition of ["reproduction_stopped"] as const) {
      await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
        "--write-plan-262-57-terminal-v1", terminalPath,
        ...terminalBaseFlags, "--disposition", disposition],
      writeOutput: () => undefined })
      await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
        "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
        "--terminal", terminalPath], writeOutput: () => undefined })
      unlinkSync(path.resolve(fixtureRoot, terminalPath))
    }
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[3]!))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[6]!))
    await runReceiptCli({ repoRoot: fixtureRoot, argv: reproductionArgv,
      executeMatrix: async (input) => { reproductions += 1
        return executeV138ParallelMatrix({ ...input,
          runner: injectedSuccessfulRunner(),
          sharedHeadroomObserver: admittedHeadroom }) },
      writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-terminal-v1", terminalPath,
      ...terminalBaseFlags, "--disposition", "reproduction_passed"],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-terminal-v1", ...terminalBaseFlags,
      "--terminal", terminalPath], writeOutput: () => undefined })
    expect({ observations, calibrations, reproductions }).toEqual({
      observations: 1, calibrations: 2, reproductions: 2 })
    unlinkSync(path.resolve(fixtureRoot, terminalPath))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[3]!))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[6]!))
    unlinkSync(path.resolve(fixtureRoot, routeStart))
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!))
    unlinkSync(calibrationPath)
    unlinkSync(path.resolve(fixtureRoot,
      V138_PLAN_262_57_ROUTE_DESTINATIONS[5]!))
    symlinkSync("missing-route-7-target", danglingPath)
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--resolve-plan-262-57-pre-start-v1",
      ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
      "--authorization", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      "--seal", V138_PLAN_262_56_CANONICAL_PATHS.seal,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    writeOutput: () => undefined })
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--check-plan-262-57-pre-start-obstruction-v1",
      "--authorization", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      "--seal", V138_PLAN_262_56_CANONICAL_PATHS.seal,
      "--source-a7", sourceA7, "--source-b7", sourceB7],
    writeOutput: () => undefined })
    unlinkSync(danglingPath)
    await expect(runReceiptCli({ repoRoot: fixtureRoot, argv: routeStartArgv,
      writeOutput: () => undefined })).rejects.toThrow(
      "MATRIX_PLAN_262_30_AUTHORITY_EXPIRED")
  } finally {
    expect(V138_PLAN_262_57_FRESH_DESTINATIONS.map((repoPath) =>
      existsSync(path.resolve(repoRoot, repoPath)))).toEqual(before)
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}, 1_500_000)
