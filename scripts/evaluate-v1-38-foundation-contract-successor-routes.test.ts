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
  V138_SUCCESSOR_AUTHORIZED_SOURCE_PATHS_V4,
  checkV138Plan26221PreLiveDestinationAbsence,
  checkV138Plan26221AuthorizationV3PostLive,
  checkV138SealedWorktreeAtA4,
  checkV138SuccessorSealCommitV4,
  deriveV138ProtectedHistoryV4,
  inspectSourceCustodyA4,
} from "./lib/v1-38-successor-source-seal.js"
import {
  V138_PLAN_262_25_ROUTE_CONTRACT,
  V138_PLAN_262_25_DISPOSITIONS,
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
  deriveV138CalibrationAttemptMappings,
  planV138MatrixShards,
  consumeV138Plan26225Stage,
  deriveV138Plan26225InterruptionProof,
  writeV138Plan26225TerminalV1,
  checkV138Plan26225TerminalBranch,
  buildV138Plan26225TerminalV1,
  enumerateV138CurrentMatrix,
  type V138ParallelShardRunner,
} from "./lib/v1-38-current-matrix-reproduction.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceA3 = "7ec7bae62fac9344bed9919b6e5095f9451c7eea"
const sourceB3 = "1387813e9f7262ac0c5916635addee9cdb96354b"
// The reviewed candidate is the immutable commit containing this suite. Binding
// to HEAD avoids an impossible self-referential source hash while custody still
// proves the complete sourceBase4..candidate lineage and exact five-path delta.
const sourceA4 = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repoRoot, encoding: "utf8",
}).trim()
let syntheticRoot = ""

const canonicalManifest = (value: unknown): string => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("test canonical manifest invalid")
  return `${Buffer.from(encoded.bytes).toString("utf8")}\n`
}

const canonicalRoot = (domain: "canonicalJsonProfile", schema: string,
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

const resetSyntheticRepository = (): void => {
  execFileSync("git", ["reset", "--hard", "-q", "HEAD"], {
    cwd: syntheticRoot,
  })
  execFileSync("git", ["clean", "-fdx", "-q"], { cwd: syntheticRoot })
}

const prepareRoutedV8 = () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "cowards-route-v8-case-"))
  execFileSync("git", ["clone", "-q", "--shared", repoRoot, tempRoot])
  const root =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000"
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
  writeFileSync(path.resolve(tempRoot, V138_PLAN_262_25_FRESH_DESTINATIONS[0]),
    `${JSON.stringify(context)}\n`)
  return { tempRoot, sourceA4, sourceB4: sourceA4, context,
    route: route as never }
}

beforeAll(() => {
  syntheticRoot = mkdtempSync(path.join(tmpdir(), "cowards-successor-routes-"))
  execFileSync("git", ["clone", "-q", "--shared", repoRoot, syntheticRoot])
})

afterAll(() => {
  if (syntheticRoot !== "") rmSync(syntheticRoot, { recursive: true, force: true })
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
      expect(existsSync(path.resolve(repoRoot, repoPath))).toBe(false)
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
            V138_PLAN_262_25_FRESH_DESTINATIONS[0]), "utf8")), fixture.route))
          .toEqual(fixture.context)
        let preflight: Record<string, unknown> | undefined
        if (stage !== "preflight") {
          preflight = buildV138HostHeadroomPreflightV8Receipt({
            context: fixture.context, result: await admittedV8Headroom() })
          writeFileSync(path.resolve(fixture.tempRoot,
            V138_PLAN_262_25_FRESH_DESTINATIONS[1]),
          `${JSON.stringify(preflight)}\n`)
          consumeV138Plan26225Stage({ repoRoot: fixture.tempRoot,
            stage: "preflight", context: fixture.context,
            predecessorRoot: fixture.context.receiptRoot,
            chargedAttemptIds: ["preflight:v8:0"] })
        }
        let calibration: Record<string, unknown> | undefined
        if (stage === "reproduction") {
          const inventory = enumerateV138CurrentMatrix(fixture.tempRoot)
          const supervised = await calibrateV138ParallelMatrix({ inventory,
            runner: successfulV8Runner(),
            sharedHeadroomObserver: admittedV8Headroom,
            hardwareIdentity: { operatingSystem: "test",
              architecture: "test", nodeVersion: "test", cpuIdentity: "test" },
            executionIdentityVersion: "v8" })
          calibration = buildV138ParallelCalibrationV8Receipt({ inventory,
            context: fixture.context, preflight: preflight!,
            calibration: supervised })
          writeFileSync(path.resolve(fixture.tempRoot,
            V138_PLAN_262_25_FRESH_DESTINATIONS[2]),
          `${JSON.stringify(calibration)}\n`)
          consumeV138Plan26225Stage({ repoRoot: fixture.tempRoot,
            stage: "calibration", context: fixture.context,
            predecessorRoot: preflight!.receiptRoot,
            chargedAttemptIds: deriveV138CalibrationAttemptMappings(inventory,
              "v8").map(({ executionAttemptId }) => executionAttemptId) })
          expect(calibration.status).toBe("admitted")
        }
        const inventory = enumerateV138CurrentMatrix(fixture.tempRoot)
        const chargedAttemptIds = stage === "preflight" ? ["preflight:v8:0"] :
          stage === "calibration" ? deriveV138CalibrationAttemptMappings(
            inventory, "v8").map(({ executionAttemptId }) =>
            executionAttemptId) : planV138MatrixShards(inventory).shards.flatMap(
              ({ attemptIds }) => attemptIds.map((id) =>
                `reproduction:v8:${id}`))
        const predecessorRoot = stage === "preflight" ?
          fixture.context.receiptRoot : stage === "calibration" ?
            preflight!.receiptRoot : calibration!.receiptRoot
        const markerRoot = consumeV138Plan26225Stage({
          repoRoot: fixture.tempRoot, stage, context: fixture.context,
          predecessorRoot, chargedAttemptIds })
        expect(deriveV138Plan26225InterruptionProof(fixture.tempRoot))
          .toMatchObject({ stage, markerRoot,
            chargedAttemptCount: stage === "preflight" ? 1 :
              stage === "calibration" ? 8 : 540 })
        const terminal = writeV138Plan26225TerminalV1(fixture.tempRoot,
          V138_PLAN_262_25_FRESH_DESTINATIONS[4],
          "fresh_destination_failed", fixture.sourceA4, fixture.sourceB4,
          fixture.route)
        expect(terminal).toMatchObject({
          disposition: "consumed_stage_interrupted",
          interruptionProof: { stage, markerRoot }, completeCleanup: false,
          chargedCalibrationAttemptCount: stage === "preflight" ? 0 : 8,
          chargedReproductionAttemptCount: stage === "reproduction" ? 540 : 0,
          acceptedCellCount: 0, authorityExpired: true, noRetry: true,
        })
        expect(checkV138Plan26225TerminalBranch(fixture.tempRoot,
          fixture.sourceA4, fixture.sourceB4, fixture.route).disposition)
          .toBe("consumed_stage_interrupted")
        expect(existsSync(path.resolve(fixture.tempRoot,
          V138_PLAN_262_25_FRESH_DESTINATIONS[stage === "preflight" ? 1 :
            stage === "calibration" ? 2 : 3]))).toBe(false)
      } finally {
        rmSync(fixture.tempRoot, { recursive: true, force: true })
      }
    }, 60_000)

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

describe.sequential("v1.38 child protocol", () => {
  const protocolModule = path.resolve(
    repoRoot,
    "scripts/lib/v1-38-current-matrix-child-protocol.ts",
  )
  const run = (mode: string) => spawnSync(process.execPath, [
    "--import", "tsx", protocolModule, "--protocol-fixture-child", mode,
  ], { cwd: repoRoot, encoding: null })

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
