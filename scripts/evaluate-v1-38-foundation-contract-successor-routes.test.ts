import { execFileSync, spawnSync } from "node:child_process"
import { Buffer } from "node:buffer"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest"
import { encodeCanonicalJson, hashCanonicalIdentity,
  type JsonValue } from "@cowards/spec"
import {
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES,
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
  classifyV138CurrentMatrixChildFailure,
  decodeV138CurrentMatrixChildProtocolResult,
} from "./lib/v1-38-current-matrix-child-protocol.js"
import {
  V138_PLAN_262_22_FRESH_DESTINATIONS,
  V138_PLAN_262_25_FRESH_DESTINATIONS,
  V138_PLAN_262_30_FRESH_DESTINATIONS,
  V138_PLAN_262_28_SOURCE_BASE5,
  V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5,
  V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4,
  checkV138Plan26221PreLiveDestinationAbsence,
  checkV138Plan26221AuthorizationV3PostLive,
  checkV138SealedWorktreeAtA4,
  checkV138SealedWorktreeAtA5,
  checkV138Plan26229AuthorizationV5,
  checkV138SuccessorSourceSealV5,
  checkV138SuccessorSealCommitV5,
  inspectV138SuccessorSealCommitV5Anchor,
  checkV138SuccessorSealCommitV4,
  deriveV138ProtectedHistoryV4,
  deriveV138ProtectedHistoryV5,
  inspectSourceCustodyA4,
  inspectSourceCustodyA5,
  v138Plan26224AuthorizationLiteral,
  v138Plan26229AuthorizationLiteral,
  writeV138Plan26224AuthorizationV4,
  writeV138Plan26229AuthorizationV5,
  writeV138SuccessorSourceSealV4,
  writeV138SuccessorSourceSealV5,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_PLAN_262_25_ROUTE_CONTRACT,
  V138_PLAN_262_25_DISPOSITIONS,
  V138_PLAN_262_30_ROUTE_CONTRACT,
  V138_PLAN_262_30_DISPOSITIONS,
  buildV138Plan26230TerminalV1,
  checkV138Plan26225RouteContract,
  checkV138Plan26225PrerequisiteRoots,
  dispatchV138CurrentMatrixDirectEntry,
  buildV138ExecutionContextV8Receipt,
  checkV138ExecutionContextV8Receipt,
  buildV138HostHeadroomPreflightV8Receipt,
  checkV138HostHeadroomPreflightV8Receipt,
  buildV138ParallelCalibrationV8Receipt,
  checkV138ParallelCalibrationV8Receipt,
  checkV138AuthoritativeMatrixV9Receipt,
  buildV138AuthoritativeMatrixV9Receipt,
  calibrateV138ParallelMatrix,
  deriveV138Plan26225InterruptionProof,
  deriveV138Plan26230PreObservationProof,
  writeV138ExecutionContextV8Receipt,
  writeV138ExecutionContextV9Receipt,
  writeV138HostHeadroomPreflightV9Receipt,
  checkV138Plan26230PreflightV9,
  writeV138ParallelCalibrationV9Receipt,
  writeV138AuthoritativeMatrixV10Receipt,
  writeV138Plan26230TerminalV1,
  checkV138Plan26230TerminalBranch,
  executeV138ParallelMatrix,
  writeV138HostHeadroomPreflightV8Receipt,
  writeV138ParallelCalibrationV8Receipt,
  writeV138AuthoritativeMatrixV9Receipt,
  writeV138Plan26225TerminalV1,
  checkV138Plan26225TerminalBranch,
  buildV138Plan26225TerminalV1,
  enumerateV138CurrentMatrix,
  type V138ParallelShardRunner,
} from "./lib/v1-38-current-matrix-reproduction.js"
import * as v138Reproduction from
  "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceA3 = "7ec7bae62fac9344bed9919b6e5095f9451c7eea"
const sourceB3 = "1387813e9f7262ac0c5916635addee9cdb96354b"
const sourceA4 = "1be54efec080436ea47ba5be3644ab1ab1686163"
let syntheticRoot = ""
let sealedRouteRoot = ""
let sealedRouteV5Root = ""
let sourceA5 = ""

const canonicalManifest = (value: unknown): string => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("test canonical manifest invalid")
  return `${Buffer.from(encoded.bytes).toString("utf8")}\n`
}

const canonicalRoot = (domain: "canonicalJsonProfile" | "evidenceBundle" |
  "containmentPolicy", schema: string,
  value: unknown) => {
  const bytes = Buffer.from(canonicalManifest(value).slice(0, -1), "utf8")
  return `sha256:${hashCanonicalIdentity(domain, [
    Buffer.from(schema, "utf8"), bytes,
  ])}`
}

const admittedV8Headroom = async () => ({ ok: true as const, observation: {
  metricId: "darwin-memorystatus-effective-available-basis-points-v1" as const,
  providerId: "apple-memory-pressure-q-v1" as const,
  parserId: "apple-memory-pressure-q-c-locale-parser-v1" as const,
  stdoutByteLength: 100,
  stdoutSha256:
    "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" as const,
  totalBytes: 4096, pageCount: 1, pageSizeBytes: 4096, percentage: 25,
  observedBasisPoints: 2500, disposition: "preflight_admitted" as const,
} })

const successfulV8Runner = (): V138ParallelShardRunner => ({ async run(
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

const runSuccessfulV8Calibration: typeof calibrateV138ParallelMatrix =
  (input) => calibrateV138ParallelMatrix({ ...input,
    runner: successfulV8Runner(),
    sharedHeadroomObserver: admittedV8Headroom })

const runSuccessfulV9Execution: typeof executeV138ParallelMatrix =
  (input) => executeV138ParallelMatrix({ ...input,
    runner: successfulV8Runner(),
    sharedHeadroomObserver: admittedV8Headroom })

const resetSyntheticRepository = (): void => {
  execFileSync("git", ["reset", "--hard", "-q", "HEAD"], {
    cwd: syntheticRoot,
  })
  execFileSync("git", ["clean", "-fdx", "-q"], { cwd: syntheticRoot })
}

const prepareRoutedV8 = () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v8-case-"))
  execFileSync("git", ["clone", "-q", "--shared", sealedRouteRoot, tempRoot])
  writeSyntheticReview(tempRoot)
  const sourceB4 = execFileSync("git", ["rev-parse", "HEAD"],
    { cwd: tempRoot, encoding: "utf8" }).trim()
  const authorizationPath =
    ".planning/artifacts/v1.38-plan-262-24-authorization-v4.json"
  const sealPath =
    ".planning/artifacts/v1.38-successor-source-seal-v4.json"
  const context = writeV138ExecutionContextV8Receipt(tempRoot,
    V138_PLAN_262_25_FRESH_DESTINATIONS[0], "gsd-pattern-c-inline-main",
    "/Users/roryquinlan/runtime/cowards-game", { schemaVersion:
      "v1.38-plan-262-25-terminal-agent-registry-v1",
      activeExecutorCount: 0, agents: [] }, authorizationPath, sealPath,
    sourceA4, sourceB4)
  return { tempRoot, sourceA4, sourceB4, context, authorizationPath, sealPath }
}

const reviewPath =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-24-REVIEW.md"
const writeSyntheticReview = (targetRoot: string) => writeFileSync(
  path.resolve(targetRoot, reviewPath), `---
plan: 24
depth: deep
repair_start_head4: 7d2b23d2be79b57d1e88e6254169629f61fd9ef0
source_base4: 52377f2cf5c019b6a7979f98ab5aa5d625778302
source_a4: ${sourceA4}
fixes_applied: false
files_reviewed: 5
files_reviewed_list:
${V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4.map((repoPath) =>
    `  - ${repoPath}`).join("\n")}
findings:
  critical: 0
  high: 0
  medium: 0
  low: 0
  warning: 0
  info: 0
  total: 0
status: clean
---
`)

const prepareSealedRouteBase = () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v8-sealed-"))
  execFileSync("git", ["clone", "-q", "--shared", repoRoot, tempRoot])
  execFileSync("git", ["checkout", "-q", "--detach", sourceA4], {
    cwd: tempRoot,
  })
  execFileSync("git", ["config", "user.email", "route4@example.invalid"],
    { cwd: tempRoot })
  execFileSync("git", ["config", "user.name", "Route Four"],
    { cwd: tempRoot })
  writeSyntheticReview(tempRoot)
  const authorizationPath =
    ".planning/artifacts/v1.38-plan-262-24-authorization-v4.json"
  const sealPath =
    ".planning/artifacts/v1.38-successor-source-seal-v4.json"
  const authorization = writeV138Plan26224AuthorizationV4(tempRoot,
    authorizationPath, sourceA4, Buffer.from(
      v138Plan26224AuthorizationLiteral(tempRoot, sourceA4), "utf8"))
  writeV138SuccessorSourceSealV4(tempRoot, sealPath, authorization)
  execFileSync("git", ["add", authorizationPath, sealPath], { cwd: tempRoot })
  execFileSync("git", ["commit", "-q", "-m", "seal route four"],
    { cwd: tempRoot })
  return tempRoot
}

const reviewV5Path =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-28-REVIEW.md"
const reviewFixV5Path =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-28-REVIEW-FIX.md"
const writeSyntheticReviewV5 = (targetRoot: string, commit: string) => {
  mkdirSync(path.dirname(path.resolve(targetRoot, reviewV5Path)),
    { recursive: true })
  writeFileSync(path.resolve(targetRoot, reviewV5Path), `---
plan: 28
depth: deep
source_base5: ${V138_PLAN_262_28_SOURCE_BASE5}
source_a5: ${commit}
fixes_applied: true
files_reviewed: 5
files_reviewed_list:
${V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5.map((repoPath) =>
    `  - ${repoPath}`).join("\n")}
findings:
  critical: 0
  high: 0
  medium: 0
  low: 0
  warning: 0
  info: 0
  total: 0
status: clean
---
`)
  writeFileSync(path.resolve(targetRoot, reviewFixV5Path), `---
status: all_fixed
skipped: 0
final_source_a5: ${commit}
---
`)
}

const prepareSealedRouteV5 = () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v9-sealed-"))
  execFileSync("git", ["clone", "-q", "--shared", repoRoot, tempRoot])
  execFileSync("git", ["checkout", "-q", "--detach", sourceA5],
    { cwd: tempRoot })
  execFileSync("git", ["config", "user.email", "route5@example.invalid"],
    { cwd: tempRoot })
  execFileSync("git", ["config", "user.name", "Route Five"],
    { cwd: tempRoot })
  writeSyntheticReviewV5(tempRoot, sourceA5)
  const authorizationPath =
    ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json"
  const sealPath = ".planning/artifacts/v1.38-successor-source-seal-v5.json"
  const authorization = writeV138Plan26229AuthorizationV5(tempRoot,
    authorizationPath, sourceA5, Buffer.from(
      v138Plan26229AuthorizationLiteral(tempRoot, sourceA5), "utf8"))
  writeV138SuccessorSourceSealV5(tempRoot, sealPath, authorization)
  execFileSync("git", ["add", authorizationPath, sealPath], { cwd: tempRoot })
  execFileSync("git", ["commit", "-q", "-m", "seal route five"],
    { cwd: tempRoot })
  return tempRoot
}

beforeAll(() => {
  sourceA5 = execFileSync("git", ["log", "-1", "--format=%H", "HEAD", "--",
    ...V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5],
  { cwd: repoRoot, encoding: "utf8" }).trim()
  if (sourceA5.length === 0) throw new TypeError("route-five A5 not found")
  syntheticRoot = mkdtempSync(path.join(tmpdir(), "cowards-successor-routes-"))
  execFileSync("git", ["clone", "-q", "--shared", repoRoot, syntheticRoot])
  sealedRouteRoot = prepareSealedRouteBase()
  sealedRouteV5Root = prepareSealedRouteV5()
}, 900_000)

afterAll(() => {
  if (syntheticRoot !== "") rmSync(syntheticRoot, { recursive: true, force: true })
  if (sealedRouteRoot !== "") rmSync(sealedRouteRoot,
    { recursive: true, force: true })
  if (sealedRouteV5Root !== "") rmSync(sealedRouteV5Root,
    { recursive: true, force: true })
})

describe.sequential("v1.38 successor temporal checkers", () => {
  it("keeps the strict pre-live v3 checker strict after route artifacts exist", () => {
    expect(() => checkV138Plan26221PreLiveDestinationAbsence(repoRoot))
      .toThrow("V138_PLAN_262_15_ARTIFACT_MUST_BE_ABSENT")
  })

  it("accepts the exact terminal-selected calibration-stopped v3 row", () => {
    expect(checkV138Plan26221AuthorizationV3PostLive({
      repoRoot,
      sourceA3,
      sourceB3,
    })).toMatchObject({
      disposition: "calibration_stopped",
      chargedCalibrationAttemptCount: 8,
      chargedReproductionAttemptCount: 0,
      acceptedCellCount: 0,
    })
  })

  it.each([
    [V138_PLAN_262_22_FRESH_DESTINATIONS[0], "V138_ROUTE_3_CONTEXT_REQUIRED"],
    [V138_PLAN_262_22_FRESH_DESTINATIONS[2], "V138_ROUTE_3_CALIBRATION_REQUIRED"],
    [V138_PLAN_262_22_FRESH_DESTINATIONS[3], "V138_ROUTE_3_REPRODUCTION_MUST_BE_ABSENT"],
  ] as const)("reports route/path-scoped post-live errors for %s", (repoPath, code) => {
    resetSyntheticRepository()
    const target = path.resolve(syntheticRoot, repoPath)
    if (existsSync(target)) rmSync(target)
    else {
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, "{}\n")
    }
    expect(() => checkV138Plan26221AuthorizationV3PostLive({
      repoRoot: syntheticRoot,
      sourceA3,
      sourceB3,
    })).toThrow(code)
  })

  it("rejects replaced, wrong-generation, terminal, charge, and authority bytes", () => {
    const mutations: Array<() => void> = [
      () => {
        const target = path.resolve(syntheticRoot,
          V138_PLAN_262_22_FRESH_DESTINATIONS[0])
        rmSync(target)
        symlinkSync("missing", target)
      },
      () => {
        const target = path.resolve(syntheticRoot,
          V138_PLAN_262_22_FRESH_DESTINATIONS[1])
        const value = JSON.parse(readFileSync(target, "utf8")) as
          Record<string, unknown>
        value.schemaVersion = "v1.38-current-matrix-headroom-preflight-v8"
        writeFileSync(target, canonicalManifest(value))
      },
      () => {
        const target = path.resolve(syntheticRoot,
          V138_PLAN_262_22_FRESH_DESTINATIONS[2])
        const value = JSON.parse(readFileSync(target, "utf8")) as {
          attempts: Record<string, unknown>[]
        }
        value.attempts[0]!.publicAttemptId = "calibration:v7:forged"
        writeFileSync(target, canonicalManifest(value))
      },
      () => {
        const target = path.resolve(syntheticRoot,
          V138_PLAN_262_22_FRESH_DESTINATIONS[4])
        const value = JSON.parse(readFileSync(target, "utf8")) as
          Record<string, unknown>
        value.acceptedCellCount = 1
        writeFileSync(target, canonicalManifest(value))
      },
      () => {
        const target = path.resolve(syntheticRoot,
          ".planning/artifacts/v1.38-plan-262-21-authorization-v3.json")
        const value = JSON.parse(readFileSync(target, "utf8")) as
          Record<string, unknown>
        value.routeOrdinal = 4
        writeFileSync(target, canonicalManifest(value))
      },
    ]
    for (const mutate of mutations) {
      resetSyntheticRepository()
      mutate()
      expect(() => checkV138Plan26221AuthorizationV3PostLive({
        repoRoot: syntheticRoot, sourceA3, sourceB3,
      })).toThrow()
    }
  })

  it.each([
    ["authorization", "V138_ROUTE_3_AUTHORIZATION_INVALID"],
    ["seal", "V138_ROUTE_3_SEAL_INVALID"],
  ] as const)("scopes malformed %s JSON exactly", (kind, code) => {
    resetSyntheticRepository()
    const repoPath = kind === "authorization" ?
      ".planning/artifacts/v1.38-plan-262-21-authorization-v3.json" :
      ".planning/artifacts/v1.38-successor-source-seal-v3.json"
    writeFileSync(path.resolve(syntheticRoot, repoPath), "{\n")
    expect(() => checkV138Plan26221AuthorizationV3PostLive({
      repoRoot: syntheticRoot, sourceA3, sourceB3,
    })).toThrow(code)
  })

  it.each(["unknown", "extra-key", "forged-root"])(
    "rejects hostile terminal disposition form %s", (mode) => {
      resetSyntheticRepository()
      const target = path.resolve(syntheticRoot,
        V138_PLAN_262_22_FRESH_DESTINATIONS[4])
      const value = JSON.parse(readFileSync(target, "utf8")) as
        Record<string, unknown>
      if (mode === "unknown") value.disposition = "unknown"
      if (mode === "extra-key") value.extra = true
      if (mode === "forged-root") {
        value.acceptedCellCount = 1
        const { terminalRoot: _ignored, ...body } = value
        value.terminalRoot = canonicalRoot("canonicalJsonProfile",
          String(value.schemaVersion), body)
      }
      writeFileSync(target, canonicalManifest(value))
      expect(() => checkV138Plan26221AuthorizationV3PostLive({
        repoRoot: syntheticRoot, sourceA3, sourceB3,
      })).toThrow()
    },
  )
})

describe.sequential("v1.38 route ordinal 4 additive contracts", () => {
  it("keeps marker fabrication and route bypasses out of the public API", () => {
    expect("consumeV138Plan26225Stage" in v138Reproduction).toBe(false)
    expect(v138Reproduction.writeV138Plan26225TerminalV1.length).toBe(5)
    expect(v138Reproduction.checkV138Plan26225TerminalBranch.length).toBe(3)
  })

  it("declares only the five reviewed A4 source paths", () => {
    expect(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4).toEqual([
      "scripts/evaluate-v1-38-foundation-contract-successor-routes.test.ts",
      "scripts/evaluate-v1-38-foundation-contract.test.ts",
      "scripts/lib/v1-38-current-matrix-child-protocol.ts",
      "scripts/lib/v1-38-current-matrix-reproduction.ts",
      "scripts/lib/v1-38-successor-source-seal.ts",
    ])
  })

  it("precommits fresh route-4 destinations without creating them", () => {
    expect(V138_PLAN_262_25_FRESH_DESTINATIONS).toEqual([
      ".planning/artifacts/v1.38-current-matrix-execution-context-v8.json",
      ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v8.json",
      ".planning/artifacts/v1.38-current-matrix-calibration-v8.json",
      ".planning/artifacts/v1.38-current-matrix-reproduction-v9.json",
      ".planning/artifacts/v1.38-plan-262-25-terminal-v1.json",
      ".planning/artifacts/v1.38-plan-262-25-preflight-consumption-v1.json",
      ".planning/artifacts/v1.38-plan-262-25-calibration-consumption-v1.json",
      ".planning/artifacts/v1.38-plan-262-25-reproduction-consumption-v1.json",
    ])
    for (const repoPath of V138_PLAN_262_25_FRESH_DESTINATIONS) {
      expect(existsSync(path.resolve(sealedRouteRoot, repoPath))).toBe(false)
    }
  })

  it("freezes context-v8, preflight-v8, calibration-v8, reproduction-v9, and terminal contracts", () => {
    expect(checkV138Plan26225RouteContract({
      ...V138_PLAN_262_25_ROUTE_CONTRACT,
    })).toBe(V138_PLAN_262_25_ROUTE_CONTRACT)
    expect(V138_PLAN_262_25_ROUTE_CONTRACT).toMatchObject({
      routeOrdinal: 4,
      executionContextSchema: "v1.38-current-matrix-execution-context-v8",
      preflightSchema: "v1.38-current-matrix-headroom-preflight-v8",
      calibrationSchema: "v1.38-current-matrix-calibration-v8",
      reproductionSchema: "v1.38-current-matrix-reproduction-v9",
      terminalSchema: "v1.38-plan-262-25-terminal-v1",
      calibrationAttemptCount: 8,
      calibrationShardCount: 4,
      reproductionCellCount: 540,
      requiredHostHeadroomBasisPoints: 2500,
      resourceSampleMilliseconds: 200,
      noRetry: true,
      partialAcceptedEvidenceReusable: false,
    })
    expect(() => checkV138Plan26225RouteContract({
      ...V138_PLAN_262_25_ROUTE_CONTRACT,
      reproductionCellCount: 539,
    })).toThrow("MATRIX_PLAN_262_25_ROUTE_CONTRACT_INVALID")
    expect(V138_PLAN_262_25_ROUTE_CONTRACT.terminalDispositions)
      .toEqual(V138_PLAN_262_25_DISPOSITIONS)
  })

  it("revalidates exact A2/B2/A3/B3 ancestry, v5/v6/v7 history, prior authorization bytes, and 24 charges", () => {
    const custody = inspectSourceCustodyA4({ repoRoot,
      repairStartHead4: "7d2b23d2be79b57d1e88e6254169629f61fd9ef0",
      sourceBase4: "52377f2cf5c019b6a7979f98ab5aa5d625778302",
      sourceA4 })
    expect(custody.aggregateChangedPaths).toEqual(
      V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4)
    const history = deriveV138ProtectedHistoryV4(repoRoot, sourceA4)
    expect(history).toMatchObject({ sourceA3, sourceB3,
      terminalDisposition: "calibration_stopped",
      reproductionV8Absent: true,
      reproductionV8ConsumptionMarkerAbsent: true,
      acceptedEvidenceCount: 0 })
    expect(history.cumulativeChargedPublicAttemptIds).toHaveLength(24)
    expect(history.priorAuthorizationBytes).toHaveLength(3)
    expect(history.artifacts).toHaveLength(8)
  })

  it("rejects wrong A4 custody and hostile B4 parent or delta before authority parsing", () => {
    expect(() => inspectSourceCustodyA4({ repoRoot,
      repairStartHead4: "7d2b23d2be79b57d1e88e6254169629f61fd9ef0",
      sourceBase4: "52377f2cf5c019b6a7979f98ab5aa5d625778302",
      sourceA4: "7d2b23d2be79b57d1e88e6254169629f61fd9ef0",
    })).toThrow()
    expect(() => checkV138SuccessorSealCommitV4({ repoRoot,
      sourceA4, sourceB4: sourceA4 })).toThrow(
      "V138_SUCCESSOR_SEAL_B4_PARENT_INVALID")
    resetSyntheticRepository()
    execFileSync("git", ["reset", "--hard", "-q", sourceA4],
      { cwd: syntheticRoot })
    execFileSync("git", ["config", "user.email", "route4@example.invalid"],
      { cwd: syntheticRoot })
    execFileSync("git", ["config", "user.name", "Route Four"],
      { cwd: syntheticRoot })
    writeFileSync(path.resolve(syntheticRoot, "route4-unexpected"), "x\n")
    execFileSync("git", ["add", "route4-unexpected"], { cwd: syntheticRoot })
    execFileSync("git", ["commit", "-q", "-m", "hostile delta"],
      { cwd: syntheticRoot })
    const sourceB4 = execFileSync("git", ["rev-parse", "HEAD"],
      { cwd: syntheticRoot, encoding: "utf8" }).trim()
    expect(() => checkV138SuccessorSealCommitV4({ repoRoot: syntheticRoot,
      sourceA4, sourceB4 })).toThrow("V138_SUCCESSOR_SEAL_B4_DELTA_INVALID")
  })

  it("detects reviewed A4 source and selected dependency worktree drift", () => {
    resetSyntheticRepository()
    const custody = inspectSourceCustodyA4({ repoRoot: syntheticRoot,
      repairStartHead4: "7d2b23d2be79b57d1e88e6254169629f61fd9ef0",
      sourceBase4: "52377f2cf5c019b6a7979f98ab5aa5d625778302",
      sourceA4 })
    const history = deriveV138ProtectedHistoryV4(syntheticRoot, sourceA4)
    const first = custody.sourceBlobs[0]!
    const dependency = history.artifacts[0]!
    const closure = { sourceBlobs: [first], resolverMetadata: [dependency] }
    const seal = { sourceCustody: custody, protectedHistory: history,
      selectedRouteClosure: closure }
    expect(checkV138SealedWorktreeAtA4(syntheticRoot,
      seal as never)).toBe(true)
    writeFileSync(path.resolve(syntheticRoot, first.path), "drift\n")
    expect(() => checkV138SealedWorktreeAtA4(syntheticRoot,
      seal as never)).toThrow("V138_SEALED_WORKTREE_V4_DRIFT")
    resetSyntheticRepository()
    writeFileSync(path.resolve(syntheticRoot, dependency.path), "drift\n")
    expect(() => checkV138SealedWorktreeAtA4(syntheticRoot,
      seal as never)).toThrow("V138_SEALED_WORKTREE_V4_DRIFT")
  })

  it("routes every Plan 262-25 direct CLI command to a real receipt handler", async () => {
    for (const command of ["--write-execution-context-v8-receipt",
      "--write-headroom-preflight-v8-receipt",
      "--calibrate-parallel-v8-receipt", "--write-authoritative-v9-receipt",
      "--write-plan-262-25-terminal-v1", "--check-plan-262-25-terminal-v1",
      "--check-plan-262-25-preflight-v8"]) {
      await expect(dispatchV138CurrentMatrixDirectEntry(command, {
        runShard: () => "shard", runReceipt: () => `receipt:${command}`,
      })).resolves.toBe(`receipt:${command}`)
    }
    await expect(dispatchV138CurrentMatrixDirectEntry(
      "--not-a-route", { runShard: () => "shard", runReceipt: () => "x" },
    )).rejects.toThrow("MATRIX_RECEIPT_CLI_COMMAND_INVALID")
  })

  it("round-trips pure context:v8, preflight:v8, stopped calibration:v8, and terminal contracts", () => {
    const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    const route = { custody: { sourceA4, sourceB4: sourceA4,
      custodyRoot: root }, authorization: { authorizationRoot: root },
      seal: { sealRoot: root,
        selectedRouteClosure: { closureRoot: root },
        protectedHistory: { protectedHistoryRoot: root,
          priorAuthorizationBytes: [] } } }
    const context = buildV138ExecutionContextV8Receipt({ route: route as never,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      terminalAgentRegistry: { schemaVersion:
        "v1.38-plan-262-25-terminal-agent-registry-v1",
        activeExecutorCount: 0, agents: [] } })
    expect(checkV138ExecutionContextV8Receipt(context, route as never))
      .toEqual(context)
    const preflight = buildV138HostHeadroomPreflightV8Receipt({
      result: { ok: false, reason: "resource_measurement_unavailable" },
      context })
    expect(checkV138HostHeadroomPreflightV8Receipt(preflight, context))
      .toEqual(preflight)
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = buildV138ParallelCalibrationV8Receipt({ inventory,
      context, preflight })
    expect(checkV138ParallelCalibrationV8Receipt(inventory, calibration,
      context, preflight)).toEqual(calibration)
    expect(buildV138Plan26225TerminalV1({
      disposition: "preflight_unavailable", sourceA4, sourceB4: sourceA4,
      authorizationRoot: root, sealRoot: root, context, preflight,
      markerRoots: { preflight: root, calibration: null,
        reproduction: null },
    })).toMatchObject({ disposition: "preflight_unavailable",
      chargedCalibrationAttemptCount: 0,
      chargedReproductionAttemptCount: 0, acceptedCellCount: 0,
      authorityExpired: true, noRetry: true })
  })

  it.each([
    ["totalBytes-zero", (value: Record<string, unknown>) => {
      value.totalBytes = 0
    }],
    ["pageCount-zero", (value: Record<string, unknown>) => {
      value.pageCount = 0
    }],
    ["pageSize-zero", (value: Record<string, unknown>) => {
      value.pageSizeBytes = 0
    }],
    ["percentage-negative", (value: Record<string, unknown>) => {
      value.percentage = -1; value.observedBasisPoints = -100
    }],
    ["percentage-over-range", (value: Record<string, unknown>) => {
      value.percentage = 101; value.observedBasisPoints = 10_100
    }],
    ["unsafe-product", (value: Record<string, unknown>) => {
      value.pageCount = Number.MAX_SAFE_INTEGER
      value.pageSizeBytes = 2
      value.totalBytes = Number.MAX_SAFE_INTEGER * 2
    }],
  ] as const)("rejects hostile v8 preflight observation %s", (_name, mutate) => {
    const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    const route = { custody: { sourceA4, sourceB4: sourceA4,
      custodyRoot: root }, authorization: { authorizationRoot: root },
      seal: { sealRoot: root, selectedRouteClosure: { closureRoot: root },
        protectedHistory: { protectedHistoryRoot: root,
          priorAuthorizationBytes: [] } } }
    const context = buildV138ExecutionContextV8Receipt({ route: route as never,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      terminalAgentRegistry: { schemaVersion:
        "v1.38-plan-262-25-terminal-agent-registry-v1",
        activeExecutorCount: 0, agents: [] } })
    const receipt = buildV138HostHeadroomPreflightV8Receipt({ context,
      result: { ok: true, observation: { metricId:
        "darwin-memorystatus-effective-available-basis-points-v1",
        providerId: "apple-memory-pressure-q-v1",
        parserId: "apple-memory-pressure-q-c-locale-parser-v1",
        stdoutByteLength: 100, stdoutSha256: root, totalBytes: 4096,
        pageCount: 1, pageSizeBytes: 4096, percentage: 25,
        observedBasisPoints: 2500, disposition: "preflight_admitted" } } })
    const hostile = JSON.parse(JSON.stringify(receipt)) as Record<string, unknown>
    mutate(hostile.observation as Record<string, unknown>)
    const { receiptRoot: _ignored, ...body } = hostile
    hostile.receiptRoot = canonicalRoot("canonicalJsonProfile",
      String(hostile.schemaVersion), body)
    expect(() => checkV138HostHeadroomPreflightV8Receipt(hostile, context))
      .toThrow("MATRIX_PREFLIGHT_V8_INVALID")
  })

  it("requires admitted calibration before V9 or reproduction terminal outcomes", () => {
    const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    const route = { custody: { sourceA4, sourceB4: sourceA4,
      custodyRoot: root }, authorization: { authorizationRoot: root },
      seal: { sealRoot: root, selectedRouteClosure: { closureRoot: root },
        protectedHistory: { protectedHistoryRoot: root,
          priorAuthorizationBytes: [] } } }
    const context = buildV138ExecutionContextV8Receipt({ route: route as never,
      mode: "gsd-pattern-c-inline-main",
      cwd: "/Users/roryquinlan/runtime/cowards-game",
      terminalAgentRegistry: { schemaVersion:
        "v1.38-plan-262-25-terminal-agent-registry-v1",
        activeExecutorCount: 0, agents: [] } })
    const preflight = buildV138HostHeadroomPreflightV8Receipt({ context,
      result: { ok: false, reason: "resource_measurement_unavailable" } })
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const calibration = buildV138ParallelCalibrationV8Receipt({ inventory,
      context, preflight })
    expect(() => buildV138AuthoritativeMatrixV9Receipt({ inventory, context,
      preflight, calibration })).toThrow(
        "MATRIX_REPRODUCTION_V9_CALIBRATION_NOT_ADMITTED")
    expect(() => checkV138AuthoritativeMatrixV9Receipt({}, { inventory, context,
      preflight, calibration })).toThrow(
        "MATRIX_REPRODUCTION_V9_CALIBRATION_NOT_ADMITTED")
    expect(() => buildV138Plan26225TerminalV1({
      disposition: "reproduction_stopped", sourceA4, sourceB4: sourceA4,
      authorizationRoot: root, sealRoot: root, context, preflight,
      calibration, reproduction: { receiptRoot: root, chargedAttemptCount: 540,
        acceptedCellCount: 0, completeCleanup: true },
      markerRoots: { preflight: root, calibration: root, reproduction: root },
    })).toThrow("MATRIX_PLAN_262_25_DISPOSITION_JOIN_INVALID")
  })

  it("rejects async publication races across every prerequisite root", () => {
    const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    const changed = "sha256:1111111111111111111111111111111111111111111111111111111111111111"
    expect(checkV138Plan26225PrerequisiteRoots({ context: root,
      preflight: root, calibration: root }, { context: root,
      preflight: root, calibration: root })).toBe(true)
    for (const key of ["context", "preflight", "calibration"] as const) {
      expect(() => checkV138Plan26225PrerequisiteRoots({ context: root,
        preflight: root, calibration: root }, { context: root,
        preflight: root, calibration: root, [key]: changed })).toThrow(
          "MATRIX_PLAN_262_25_PREREQUISITE_CHANGED")
    }
  })

  it("rejects an unknown Plan 262-25 disposition in builder and CLI", () => {
    const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    expect(() => buildV138Plan26225TerminalV1({
      disposition: "unknown" as never, sourceA4, sourceB4: sourceA4,
      authorizationRoot: root, sealRoot: root,
      markerRoots: { preflight: null, calibration: null, reproduction: null },
    })).toThrow("MATRIX_PLAN_262_25_DISPOSITION_INVALID")
    const modulePath = path.resolve(repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts")
    const result = spawnSync(process.execPath, ["--import", "tsx", modulePath,
      "--write-plan-262-25-terminal-v1",
      V138_PLAN_262_25_FRESH_DESTINATIONS[4],
      "--authorization",
      ".planning/artifacts/v1.38-plan-262-24-authorization-v4.json",
      "--seal", ".planning/artifacts/v1.38-successor-source-seal-v4.json",
      "--context", V138_PLAN_262_25_FRESH_DESTINATIONS[0],
      "--preflight", V138_PLAN_262_25_FRESH_DESTINATIONS[1],
      "--calibration", V138_PLAN_262_25_FRESH_DESTINATIONS[2],
      "--reproduction", V138_PLAN_262_25_FRESH_DESTINATIONS[3],
      "--source-a4", sourceA4, "--source-b4", sourceA4,
      "--disposition", "unknown"], { cwd: repoRoot, encoding: "utf8" })
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain("MATRIX_PLAN_262_25_CLI_ARGUMENTS_INVALID")
  })

  it.each(["preflight", "calibration", "reproduction"] as const)(
    "accounts truthfully for consumed %s interruption", (stage) => {
      const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      const needsPreflight = stage !== "preflight"
      const needsCalibration = stage === "reproduction"
      const terminal = buildV138Plan26225TerminalV1({
        disposition: "consumed_stage_interrupted", sourceA4,
        sourceB4: sourceA4, authorizationRoot: root, sealRoot: root,
        context: { receiptRoot: root },
        preflight: needsPreflight ? { receiptRoot: root } : undefined,
        calibration: needsCalibration ? { receiptRoot: root,
          chargedAttemptCount: 8, completeCleanup: true, status: "admitted" } :
          undefined,
        markerRoots: { preflight: root,
          calibration: needsPreflight ? root : null,
          reproduction: needsCalibration ? root : null },
        interruptionProof: { stage, markerRoot: root,
          chargedAttemptCount: stage === "preflight" ? 1 :
            stage === "calibration" ? 8 : 540,
          chargedIdentityId: stage === "preflight" ? "preflight:v8:0" : null,
          observationMode: "unknown_after_consumption", childLaunchCount: null,
          terminalOutcomeCount: null, completeCleanup: false },
      })
      expect(terminal).toMatchObject({ disposition: "consumed_stage_interrupted",
        chargedCalibrationAttemptCount: stage === "preflight" ? 0 : 8,
        chargedReproductionAttemptCount: stage === "reproduction" ? 540 : 0,
        acceptedCellCount: 0, completeCleanup: false })
    })

  it.each(["preflight", "calibration", "reproduction"] as const)(
    "terminalizes real marker-present receipt-absent %s evidence", async (stage) => {
      const fixture = prepareRoutedV8()
      try {
        expect(checkV138ExecutionContextV8Receipt(JSON.parse(readFileSync(
          path.resolve(fixture.tempRoot,
            V138_PLAN_262_25_FRESH_DESTINATIONS[0]), "utf8"))))
          .toEqual(fixture.context)
        if (stage !== "preflight") {
          await writeV138HostHeadroomPreflightV8Receipt(fixture.tempRoot,
            V138_PLAN_262_25_FRESH_DESTINATIONS[1],
            V138_PLAN_262_25_FRESH_DESTINATIONS[0],
            fixture.authorizationPath, fixture.sealPath, fixture.sourceA4,
            fixture.sourceB4, admittedV8Headroom)
        }
        if (stage === "reproduction") {
          const calibration = await writeV138ParallelCalibrationV8Receipt(
            fixture.tempRoot, V138_PLAN_262_25_FRESH_DESTINATIONS[2],
            V138_PLAN_262_25_FRESH_DESTINATIONS[1],
            V138_PLAN_262_25_FRESH_DESTINATIONS[0], fixture.sourceA4,
            fixture.sourceB4, runSuccessfulV8Calibration)
          expect(calibration.status).toBe("admitted")
        }
        const authorizationTarget = path.resolve(fixture.tempRoot,
          fixture.authorizationPath)
        const authorizationBytes = readFileSync(authorizationTarget)
        const sabotageAuthority = () => writeFileSync(authorizationTarget,
          "{}\n")
        try {
          if (stage === "preflight") {
            await expect(writeV138HostHeadroomPreflightV8Receipt(
              fixture.tempRoot, V138_PLAN_262_25_FRESH_DESTINATIONS[1],
              V138_PLAN_262_25_FRESH_DESTINATIONS[0],
              fixture.authorizationPath, fixture.sealPath, fixture.sourceA4,
              fixture.sourceB4, async () => {
                sabotageAuthority()
                return admittedV8Headroom()
              })).rejects.toThrow()
          } else if (stage === "calibration") {
            await expect(writeV138ParallelCalibrationV8Receipt(
              fixture.tempRoot, V138_PLAN_262_25_FRESH_DESTINATIONS[2],
              V138_PLAN_262_25_FRESH_DESTINATIONS[1],
              V138_PLAN_262_25_FRESH_DESTINATIONS[0], fixture.sourceA4,
              fixture.sourceB4, async (input) => {
                sabotageAuthority()
                return runSuccessfulV8Calibration(input)
              })).rejects.toThrow()
          } else {
            await expect(writeV138AuthoritativeMatrixV9Receipt(
              fixture.tempRoot, V138_PLAN_262_25_FRESH_DESTINATIONS[3],
              V138_PLAN_262_25_FRESH_DESTINATIONS[2],
              V138_PLAN_262_25_FRESH_DESTINATIONS[0], fixture.sourceA4,
              fixture.sourceB4, async () => {
                sabotageAuthority()
                throw new Error("controlled post-consumption failure")
              })).rejects.toThrow()
          }
        } finally {
          writeFileSync(authorizationTarget, authorizationBytes)
        }
        const interruption = deriveV138Plan26225InterruptionProof(
          fixture.tempRoot)
        const markerRoot = interruption?.markerRoot
        expect(deriveV138Plan26225InterruptionProof(fixture.tempRoot))
          .toMatchObject({ stage, markerRoot,
            chargedAttemptCount: stage === "preflight" ? 1 :
              stage === "calibration" ? 8 : 540 })
        const terminal = writeV138Plan26225TerminalV1(fixture.tempRoot,
          V138_PLAN_262_25_FRESH_DESTINATIONS[4],
          "fresh_destination_failed", fixture.sourceA4, fixture.sourceB4,
        )
        expect(terminal).toMatchObject({
          disposition: "consumed_stage_interrupted",
          interruptionProof: { stage, markerRoot }, completeCleanup: false,
          chargedCalibrationAttemptCount: stage === "preflight" ? 0 : 8,
          chargedReproductionAttemptCount: stage === "reproduction" ? 540 : 0,
          acceptedCellCount: 0, authorityExpired: true, noRetry: true,
        })
        expect(checkV138Plan26225TerminalBranch(fixture.tempRoot,
          fixture.sourceA4, fixture.sourceB4).disposition)
          .toBe("consumed_stage_interrupted")
        expect(existsSync(path.resolve(fixture.tempRoot,
          V138_PLAN_262_25_FRESH_DESTINATIONS[stage === "preflight" ? 1 :
            stage === "calibration" ? 2 : 3]))).toBe(false)
      } finally {
        rmSync(fixture.tempRoot, { recursive: true, force: true })
      }
    }, 900_000)

  it.each(["context", "preflight", "calibration", "reproduction"] as const)(
    "records truthful fresh-destination obstruction at %s", (stage) => {
      const root = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      const needsContext = stage !== "context"
      const needsPreflight = stage === "calibration" || stage === "reproduction"
      const needsCalibration = stage === "reproduction"
      const terminal = buildV138Plan26225TerminalV1({
        disposition: "fresh_destination_failed", sourceA4,
        sourceB4: sourceA4, authorizationRoot: root, sealRoot: root,
        context: needsContext ? { receiptRoot: root } : undefined,
        preflight: needsPreflight ? { receiptRoot: root } : undefined,
        calibration: needsCalibration ? { receiptRoot: root,
          chargedAttemptCount: 8, completeCleanup: true, status: "admitted" } :
          undefined,
        markerRoots: { preflight: needsPreflight ? root : null,
          calibration: needsCalibration ? root : null, reproduction: null },
        obstructionProof: { stage,
          path: V138_PLAN_262_25_FRESH_DESTINATIONS[stage === "context" ? 0 :
            stage === "preflight" ? 1 : stage === "calibration" ? 2 : 3],
          type: "file", metadataRoot: root },
      })
      expect(terminal).toMatchObject({ disposition: "fresh_destination_failed",
        chargedCalibrationAttemptCount: needsCalibration ? 8 : 0,
        chargedReproductionAttemptCount: 0, acceptedCellCount: 0,
        completeCleanup: true })
    })

  it.each([
    ["--write-execution-context-v8-receipt",
      "MATRIX_EXECUTION_CONTEXT_V8_CLI_ARGUMENTS_INVALID"],
    ["--write-headroom-preflight-v8-receipt",
      "MATRIX_PREFLIGHT_V8_CLI_ARGUMENTS_INVALID"],
    ["--calibrate-parallel-v8-receipt",
      "MATRIX_CALIBRATION_V8_CLI_ARGUMENTS_INVALID"],
    ["--write-authoritative-v9-receipt",
      "MATRIX_REPRODUCTION_V9_CLI_ARGUMENTS_INVALID"],
  ] as const)("dispatches actual CLI handler %s", (command, code) => {
    const modulePath = path.resolve(repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts")
    const result = spawnSync(process.execPath,
      ["--import", "tsx", modulePath, command],
      { cwd: repoRoot, encoding: "utf8" })
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain(code)
    expect(result.stderr).not.toContain("MATRIX_RECEIPT_CLI_COMMAND_INVALID")
  })
})

describe.sequential("v1.38 route ordinal 5 offline contract", () => {
  const root =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000"
  const context = { receiptRoot: root }
  const preflight = { receiptRoot: root }
  const stoppedCalibration = { receiptRoot: root, chargedAttemptCount: 8,
    completeCleanup: true, status: "stopped_process_failure" }
  const admittedCalibration = { ...stoppedCalibration, status: "admitted" }
  const stoppedReproduction = { receiptRoot: root, chargedAttemptCount: 540,
    acceptedCellCount: 0, completeCleanup: true,
    status: "stopped_process_failure" }
  const passedReproduction = { ...stoppedReproduction,
    acceptedCellCount: 540, status: "passed_exact" }

  it("checks A5 custody, protected history, authorization, seal, and B5 custody behaviorally", () => {
    const sourceB5 = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: sealedRouteV5Root, encoding: "utf8",
    }).trim()
    const authorizationPath =
      ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json"
    const sealPath =
      ".planning/artifacts/v1.38-successor-source-seal-v5.json"
    const authorization = JSON.parse(readFileSync(path.resolve(
      sealedRouteV5Root, authorizationPath), "utf8"))
    const seal = JSON.parse(readFileSync(path.resolve(
      sealedRouteV5Root, sealPath), "utf8"))
    expect(inspectSourceCustodyA5({ repoRoot: sealedRouteV5Root,
      sourceBase5: V138_PLAN_262_28_SOURCE_BASE5,
      sourceA5 }).aggregateChangedPaths)
      .toEqual([...V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5].sort())
    expect(deriveV138ProtectedHistoryV5(sealedRouteV5Root, sourceA5)
      .cumulativeChargedPublicAttemptIds).toHaveLength(32)
    const checkedAuthorization = checkV138Plan26229AuthorizationV5(
      sealedRouteV5Root, authorization)
    const checkedSeal = checkV138SuccessorSourceSealV5(sealedRouteV5Root,
      seal, checkedAuthorization)
    expect(checkV138SealedWorktreeAtA5(sealedRouteV5Root, checkedSeal)).toBe(true)
    expect(checkV138SuccessorSealCommitV5({ repoRoot: sealedRouteV5Root,
      sourceA5, sourceB5 })).toMatchObject({ sourceA5, sourceB5,
      authorizationRoot: checkedAuthorization.authorizationRoot,
      sealRoot: checkedSeal.sealRoot })
    const anchor = inspectV138SuccessorSealCommitV5Anchor({
      repoRoot: sealedRouteV5Root, sourceA5, sourceB5 })
    for (const disposition of ["tool_identity_failed",
      "protected_history_failed", "formation_absence_failed"] as const) {
      expect(() => deriveV138Plan26230PreObservationProof({
        repoRoot: sealedRouteV5Root, sourceA5, anchor, disposition,
      })).toThrow("MATRIX_PLAN_262_30_PRE_OBSERVATION_CHECK_SUCCEEDED")
    }
    const invalidObservation = { mode: "delegated-worker",
      cwd: "/tmp/not-the-main-orchestrator", terminalAgentRegistry: {
        schemaVersion: "v1.38-plan-262-30-terminal-agent-registry-v1",
        activeExecutorCount: 0,
        agents: [{ id: "private-agent-id", status: "completed" }] } }
    const failureProof = deriveV138Plan26230PreObservationProof({
      repoRoot: sealedRouteV5Root, sourceA5, anchor,
      disposition: "pattern_c_ownership_failed",
      patternCObservation: invalidObservation })
    expect(failureProof).toMatchObject({
      disposition: "pattern_c_ownership_failed", sealedRoot: null })
    expect(JSON.stringify(failureProof)).not.toContain("private-agent-id")
    expect(() => deriveV138Plan26230PreObservationProof({
      repoRoot: sealedRouteV5Root, sourceA5, anchor,
      disposition: "pattern_c_ownership_failed", patternCObservation: {
        mode: "gsd-pattern-c-inline-main",
        cwd: "/Users/roryquinlan/runtime/cowards-game",
        terminalAgentRegistry: { schemaVersion:
          "v1.38-plan-262-30-terminal-agent-registry-v1",
          activeExecutorCount: 0, agents: [] } },
    })).toThrow("MATRIX_PLAN_262_30_PRE_OBSERVATION_CHECK_SUCCEEDED")
  }, 900_000)

  it("rejects a direct-child B5 with self-hashed unauthorized authority", () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v9-forged-"))
    try {
      execFileSync("git", ["clone", "-q", "--shared", sealedRouteV5Root,
        tempRoot])
      execFileSync("git", ["checkout", "-q", "--detach", sourceA5],
        { cwd: tempRoot })
      execFileSync("git", ["config", "user.email", "forged@example.invalid"],
        { cwd: tempRoot })
      execFileSync("git", ["config", "user.name", "Forged Route"],
        { cwd: tempRoot })
      writeSyntheticReviewV5(tempRoot, sourceA5)
      const authorizationPath =
        ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json"
      const sealPath =
        ".planning/artifacts/v1.38-successor-source-seal-v5.json"
      const authorization = JSON.parse(readFileSync(path.resolve(
        sealedRouteV5Root, authorizationPath), "utf8")) as Record<string, unknown>
      const seal = JSON.parse(readFileSync(path.resolve(sealedRouteV5Root,
        sealPath), "utf8")) as Record<string, unknown>
      delete authorization.authorizationRoot
      authorization.operator = "unauthorized-operator"
      authorization.authorizationRoot = canonicalRoot("evidenceBundle",
        String(authorization.schemaVersion), authorization)
      delete seal.sealRoot
      seal.authorizationRoot = authorization.authorizationRoot
      seal.sealRoot = canonicalRoot("containmentPolicy",
        String(seal.schemaVersion), seal)
      mkdirSync(path.dirname(path.resolve(tempRoot, authorizationPath)),
        { recursive: true })
      writeFileSync(path.resolve(tempRoot, authorizationPath),
        canonicalManifest(authorization))
      writeFileSync(path.resolve(tempRoot, sealPath), canonicalManifest(seal))
      execFileSync("git", ["add", authorizationPath, sealPath], { cwd: tempRoot })
      execFileSync("git", ["commit", "-q", "-m", "forged route five"],
        { cwd: tempRoot })
      const forgedB5 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: tempRoot, encoding: "utf8",
      }).trim()
      expect(() => inspectV138SuccessorSealCommitV5Anchor({ repoRoot: tempRoot,
        sourceA5, sourceB5: forgedB5 })).toThrow(
        "V138_PLAN_262_29_AUTHORIZATION_INVALID")
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }, 900_000)

  it("writes and rejects collisions for the exact v9 context destination", () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v9-case-"))
    try {
      execFileSync("git", ["clone", "-q", "--shared", sealedRouteV5Root,
        tempRoot])
      writeSyntheticReviewV5(tempRoot, sourceA5)
      const sourceB5 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: tempRoot, encoding: "utf8",
      }).trim()
      const target = V138_PLAN_262_30_FRESH_DESTINATIONS[0]
      const receipt = writeV138ExecutionContextV9Receipt(tempRoot, target,
        "gsd-pattern-c-inline-main",
        "/Users/roryquinlan/runtime/cowards-game", { schemaVersion:
          "v1.38-plan-262-30-terminal-agent-registry-v1",
          activeExecutorCount: 0, agents: [] },
        ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
        ".planning/artifacts/v1.38-successor-source-seal-v5.json",
        sourceA5, sourceB5)
      expect(receipt).toMatchObject({ schemaVersion:
        "v1.38-current-matrix-execution-context-v9",
        patternCOwnership: "main_orchestrator_only", acceptedCellCount: 0,
        noRetry: true })
      expect(() => writeV138ExecutionContextV9Receipt(tempRoot, target,
        "gsd-pattern-c-inline-main",
        "/Users/roryquinlan/runtime/cowards-game", { schemaVersion:
          "v1.38-plan-262-30-terminal-agent-registry-v1",
          activeExecutorCount: 0, agents: [] },
        ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
        ".planning/artifacts/v1.38-successor-source-seal-v5.json",
        sourceA5, sourceB5)).toThrow("MATRIX_PLAN_262_30_DESTINATION_NOT_FRESH")
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }, 900_000)

  it("writes and rechecks the complete admitted v9/v10 route and terminal", async () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v10-case-"))
    try {
      execFileSync("git", ["clone", "-q", "--shared", sealedRouteV5Root,
        tempRoot])
      writeSyntheticReviewV5(tempRoot, sourceA5)
      const sourceB5 = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: tempRoot, encoding: "utf8",
      }).trim()
      const [contextPath, preflightPath, calibrationPath, reproductionPath,
        terminalPath] = V138_PLAN_262_30_FRESH_DESTINATIONS
      writeV138ExecutionContextV9Receipt(tempRoot, contextPath,
        "gsd-pattern-c-inline-main",
        "/Users/roryquinlan/runtime/cowards-game", { schemaVersion:
          "v1.38-plan-262-30-terminal-agent-registry-v1",
          activeExecutorCount: 0, agents: [] },
        ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
        ".planning/artifacts/v1.38-successor-source-seal-v5.json",
        sourceA5, sourceB5)
      await writeV138HostHeadroomPreflightV9Receipt(tempRoot, preflightPath,
        contextPath,
        ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
        ".planning/artifacts/v1.38-successor-source-seal-v5.json",
        sourceA5, sourceB5, admittedV8Headroom)
      expect(checkV138Plan26230PreflightV9(tempRoot, sourceA5, sourceB5)
        .disposition).toBe("preflight_admitted")
      const calibration = await writeV138ParallelCalibrationV9Receipt(tempRoot,
        calibrationPath, preflightPath, contextPath, sourceA5, sourceB5,
        runSuccessfulV8Calibration)
      expect(calibration.status).toBe("admitted")
      const reproduction = await writeV138AuthoritativeMatrixV10Receipt(
        tempRoot, reproductionPath, calibrationPath, contextPath,
        sourceA5, sourceB5, runSuccessfulV9Execution)
      expect(reproduction).toMatchObject({ status: "passed_exact",
        acceptedCellCount: 540 })
      const terminal = writeV138Plan26230TerminalV1(tempRoot, terminalPath,
        "reproduction_passed", sourceA5, sourceB5)
      expect(terminal).toMatchObject({ disposition: "reproduction_passed",
        chargedCalibrationAttemptCount: 8,
        chargedReproductionAttemptCount: 540, acceptedCellCount: 540 })
      expect(checkV138Plan26230TerminalBranch(tempRoot, sourceA5, sourceB5)
        .terminalRoot).toBe(terminal.terminalRoot)
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }, 900_000)

  it("freezes the noncolliding v5/v9/v10 route and exact policy constants", () => {
    expect(V138_PLAN_262_30_ROUTE_CONTRACT).toEqual({
      schemaVersion: "v1.38-plan-262-30-route-contract-v1",
      routeOrdinal: 5,
      authorizationSchema: "v1.38-plan-262-29-authorization-v5",
      sealSchema: "v1.38-successor-source-seal-v5",
      executionContextSchema: "v1.38-current-matrix-execution-context-v9",
      preflightSchema: "v1.38-current-matrix-headroom-preflight-v9",
      calibrationSchema: "v1.38-current-matrix-calibration-v9",
      reproductionSchema: "v1.38-current-matrix-reproduction-v10",
      consumptionSchema: "v1.38-plan-262-30-consumption-v1",
      terminalSchema: "v1.38-plan-262-30-terminal-v1",
      terminalDispositions: V138_PLAN_262_30_DISPOSITIONS,
      failureProtocolSchema: "v1.38-current-matrix-child-control-v2",
      resourceSampleMilliseconds: 200,
      requiredHostHeadroomBasisPoints: 2500,
      calibrationAttemptCount: 8,
      calibrationShardCount: 4,
      reproductionCellCount: 540,
      canonicalDestinations: V138_PLAN_262_30_FRESH_DESTINATIONS,
      noRetry: true,
      partialAcceptedEvidenceReusable: false,
    })
    expect(new Set(V138_PLAN_262_30_FRESH_DESTINATIONS).size).toBe(8)
    expect(V138_PLAN_262_30_FRESH_DESTINATIONS.every((repoPath) =>
      !existsSync(path.resolve(repoRoot, repoPath)))).toBe(true)
    expect(V138_PLAN_262_28_SOURCE_BASE5).toBe(
      "1cd79971145eff892f49aad928642b0d875fef53",
    )
    expect(V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V5).toHaveLength(5)
  })

  it.each(V138_PLAN_262_30_DISPOSITIONS)(
    "builds the closed terminal disposition %s with fail-closed presence rules",
    (disposition) => {
      const preObservation = ["tool_identity_failed", "protected_history_failed",
        "formation_absence_failed", "pattern_c_ownership_failed"]
        .includes(disposition)
      const fresh = disposition === "fresh_destination_failed"
      const interrupted = disposition === "consumed_stage_interrupted"
      const calibrationStage = ["calibration_stopped", "reproduction_stopped",
        "reproduction_passed"].includes(disposition)
      const reproductionStage = ["reproduction_stopped",
        "reproduction_passed"].includes(disposition)
      const needsContext = !preObservation && !fresh
      const needsPreflight = needsContext
      const needsCalibration = calibrationStage || interrupted
      const needsReproduction = reproductionStage
      const terminal = buildV138Plan26230TerminalV1({ disposition,
        sourceA5: "a5", sourceB5: "b5", authorizationRoot: root,
        sealRoot: root,
        ...(needsContext ? { context } : {}),
        ...(needsPreflight ? { preflight } : {}),
        ...(needsCalibration ? { calibration: reproductionStage
          ? admittedCalibration : stoppedCalibration } : {}),
        ...(needsReproduction ? { reproduction: disposition ===
          "reproduction_passed" ? passedReproduction : stoppedReproduction } : {}),
        markerRoots: { preflight: needsPreflight || interrupted ? root : null,
          calibration: needsCalibration || interrupted ? root : null,
          reproduction: needsReproduction || interrupted ? root : null },
        ...(fresh ? { obstructionProof: { stage: "context" as const,
          path: V138_PLAN_262_30_FRESH_DESTINATIONS[0], type: "file" as const,
          metadataRoot: root } } : {}),
        ...(interrupted ? {
          interruptionProof: { stage: "reproduction" as const,
            markerRoot: root, chargedAttemptCount: 540 as const,
            chargedIdentityId: null,
            observationMode: "unknown_after_consumption" as const,
            childLaunchCount: null, terminalOutcomeCount: null,
            completeCleanup: false as const } } : {}),
        ...(preObservation ? { preObservationProof: {
          schemaVersion:
            "v1.38-plan-262-30-pre-observation-proof-v1" as const,
          disposition: disposition as "tool_identity_failed",
          sealedRoot: disposition === "pattern_c_ownership_failed" ? null : root,
          observedRoot: root, expectedContractRoot: disposition ===
            "pattern_c_ownership_failed" ? root : null, proofRoot: root,
        } } : {}),
      })
      expect(terminal).toMatchObject({ disposition, sourceA5: "a5",
        sourceB5: "b5", acceptedCellCount: disposition ===
          "reproduction_passed" ? 540 : 0,
        authorityExpired: true, noRetry: true,
        partialAcceptedEvidenceReusable: false })
    },
  )

  it("dispatches every future v9/v10 CLI mode without falling through", () => {
    const modulePath = path.resolve(repoRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts")
    for (const [command, code] of [
      ["--write-execution-context-v9-receipt",
        "MATRIX_EXECUTION_CONTEXT_V9_CLI_ARGUMENTS_INVALID"],
      ["--write-headroom-preflight-v9-receipt",
        "MATRIX_PREFLIGHT_V9_CLI_ARGUMENTS_INVALID"],
      ["--calibrate-parallel-v9-receipt",
        "MATRIX_CALIBRATION_V9_CLI_ARGUMENTS_INVALID"],
      ["--write-authoritative-v10-receipt",
        "MATRIX_REPRODUCTION_V10_CLI_ARGUMENTS_INVALID"],
      ["--write-plan-262-30-terminal-v1",
        "MATRIX_PLAN_262_30_CLI_ARGUMENTS_INVALID"],
      ["--check-plan-262-30-terminal-v1",
        "MATRIX_PLAN_262_30_CLI_ARGUMENTS_INVALID"],
    ] as const) {
      const result = spawnSync(process.execPath,
        ["--import", "tsx", modulePath, command],
        { cwd: repoRoot, encoding: "utf8" })
      expect(result.status, command).not.toBe(0)
      expect(result.stderr, command).toContain(code)
      expect(result.stderr, command).not.toContain(
        "MATRIX_RECEIPT_CLI_COMMAND_INVALID",
      )
    }
  }, 30_000)
})

describe.sequential("v1.38 child protocol", () => {
  const protocolFixture = `
const mode = process.argv[1]
const valid = '{"failureCode":"RESOURCE_POLICY_SHARD_FAILED","schemaVersion":"v1.38-current-matrix-child-failure-v1"}\\n'
if (mode === "valid") process.stdout.write(valid)
else if (mode === "malformed-json") process.stdout.write("{\\n")
else if (mode === "malformed-utf8") process.stdout.write(Buffer.from([255]))
else if (mode === "unknown-key") process.stdout.write('{"extra":true,"failureCode":"RESOURCE_POLICY_SHARD_FAILED","schemaVersion":"v1.38-current-matrix-child-failure-v1"}\\n')
else if (mode === "unknown-code") process.stdout.write('{"failureCode":"UNKNOWN","schemaVersion":"v1.38-current-matrix-child-failure-v1"}\\n')
else if (mode === "duplicate-message") process.stdout.write(valid + valid)
else if (mode === "duplicate-key") process.stdout.write('{"failureCode":"RESOURCE_POLICY_SHARD_FAILED","failureCode":"RESOURCE_POLICY_SHARD_FAILED","schemaVersion":"v1.38-current-matrix-child-failure-v1"}\\n')
else if (mode === "whitespace") process.stdout.write(" " + valid)
else if (mode === "oversize") process.stdout.write(Buffer.alloc(${V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES + 1}, 120))
else if (mode === "stderr-contamination") { process.stdout.write(valid); process.stderr.write("x") }
else if (mode === "nonzero-exit") { process.stdout.write(valid); process.exitCode = 1 }
`
  const run = (mode: string) => spawnSync(process.execPath,
    ["-e", protocolFixture, mode], { cwd: repoRoot, encoding: null })

  it("maps one exact finite failure code through the public-safe handler", () => {
    const message = {
      schemaVersion: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
      failureCode: "RESOURCE_POLICY_SHARD_FAILED" as const,
    }
    expect(classifyV138CurrentMatrixChildFailure(message)).toEqual({
      classification: "system_failure",
      code: "RESOURCE_POLICY_SHARD_FAILED",
      retryable: false,
    })
    const result = run("valid")
    expect(decodeV138CurrentMatrixChildProtocolResult(result)).toEqual({
      classification: "system_failure",
      code: "RESOURCE_POLICY_SHARD_FAILED",
      retryable: false,
    })
  })

  it.each([
    "malformed-json",
    "malformed-utf8",
    "unknown-key",
    "unknown-code",
    "duplicate-message",
    "duplicate-key",
    "whitespace",
    "oversize",
    "stderr-contamination",
    "nonzero-exit",
  ])("fails closed on protocol fixture mode %s", (mode) => {
    const result = run(mode)
    expect(() => decodeV138CurrentMatrixChildProtocolResult(result)).toThrow()
  })

  it("keeps captured protocol bytes bounded and free of private/runtime/game fields", () => {
    const result = run("valid")
    expect(result.stdout.byteLength).toBeLessThanOrEqual(
      V138_CURRENT_MATRIX_CHILD_PROTOCOL_MAX_BYTES,
    )
    const captured = Buffer.concat([result.stdout, result.stderr])
      .toString("utf8")
      .toLowerCase()
    for (const prohibited of [
      "strategy", "match", "observation", "source", "memory", "objective",
      "environment", "filesystem", "database", "host", "diagnostic",
    ]) expect(captured).not.toContain(`"${prohibited}`)
  })
})
