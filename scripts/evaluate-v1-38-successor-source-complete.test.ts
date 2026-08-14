import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"
import {
  V138_PLAN_262_57_ROUTE_CONTRACT,
  V138_RECEIPT_DIRECT_COMMANDS,
  V138_ROUTE_7_SOURCE_MANIFEST,
  buildV138ExecutionContextV11Receipt,
  buildV138Plan26257RouteStartV1,
  checkV138Plan26257RouteStartV1,
  checkV138Route7SourceCompleteness,
  dispatchV138CurrentMatrixDirectEntry,
  runReceiptCli,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  V138_PLAN_262_56_AUTHORIZATION_SCHEMA,
  V138_PLAN_262_56_CANONICAL_PATHS,
  V138_PLAN_262_57_FRESH_DESTINATIONS,
  V138_PLAN_262_57_ROUTE_DESTINATIONS,
  V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA,
  v138Plan26256AuthorizationLiteral,
  writeV138Plan26256AuthorizationV7,
  writeV138SuccessorSourceSealV7,
} from "./lib/v1-38-successor-source-seal.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

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

it("reaches real route-start and preflight writers only in a disposable Git fixture", async () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "v138-route-7-git-"))
  const git = (...args: string[]) => execFileSync("git", args, {
    cwd: fixtureRoot, encoding: "utf8" }).trim()
  const before = V138_PLAN_262_57_FRESH_DESTINATIONS.map((repoPath) =>
    existsSync(path.resolve(repoRoot, repoPath)))
  let observations = 0
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot,
      fixtureRoot])
    git("config", "user.name", "Plan 262-54 Fixture")
    git("config", "user.email", "plan-262-54-fixture@example.invalid")
    const patchBytes = execFileSync("git", ["diff", "--binary"], {
      cwd: repoRoot })
    execFileSync("git", ["apply", "--binary", "-"], { cwd: fixtureRoot,
      input: patchBytes })
    git("add", "scripts/evaluate-v1-38-successor-route.test.ts",
      "scripts/evaluate-v1-38-successor-source-complete.test.ts",
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
      "scripts/lib/v1-38-successor-source-seal.ts")
    git("commit", "-m", "fixture: freeze source A7\n\n" +
      "Plan-262-54-Author-Run: codex-execute-262-54-20260814T224244Z")
    const sourceA7 = git("rev-parse", "HEAD")
    const review = { a7: sourceA7, findingCount: 0,
      sourceCompletenessPassed: true, reviewRoot: `sha256:${"5".repeat(64)}` }
    const literal = Buffer.from(v138Plan26256AuthorizationLiteral(fixtureRoot,
      sourceA7, review), "utf8")
    const authorization = writeV138Plan26256AuthorizationV7(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.authorization, sourceA7, review, literal)
    writeV138SuccessorSourceSealV7(fixtureRoot,
      V138_PLAN_262_56_CANONICAL_PATHS.seal, authorization)
    git("add", V138_PLAN_262_56_CANONICAL_PATHS.authorization,
      V138_PLAN_262_56_CANONICAL_PATHS.seal)
    git("commit", "-m", "fixture: seal source B7")
    const sourceB7 = git("rev-parse", "HEAD")
    const routeStart = V138_PLAN_262_57_ROUTE_DESTINATIONS[0]!
    await runReceiptCli({ repoRoot: fixtureRoot, argv: ["node", "route",
      "--write-plan-262-57-route-start-v1", routeStart,
      "--mode", "gsd-pattern-c-inline-main", "--cwd", repoRoot,
      "--terminal-agent-registry-json", JSON.stringify({ schemaVersion:
        "v1.38-plan-262-57-terminal-agent-registry-v1",
        activeExecutorCount: 0, agents: [] }), "--authorization",
      V138_PLAN_262_56_CANONICAL_PATHS.authorization, "--seal",
      V138_PLAN_262_56_CANONICAL_PATHS.seal, "--source-a7", sourceA7,
      "--source-b7", sourceB7], writeOutput: () => undefined })
    expect(existsSync(path.resolve(fixtureRoot, routeStart))).toBe(true)
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
  } finally {
    expect(V138_PLAN_262_57_FRESH_DESTINATIONS.map((repoPath) =>
      existsSync(path.resolve(repoRoot, repoPath)))).toEqual(before)
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
}, 120_000)
