/* eslint-disable no-restricted-imports -- private lab runner binds reviewed fixture seams. */
import { fork, spawnSync, type ChildProcess } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto"
import { closeSync, constants, existsSync, fsyncSync, openSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  BOTTOM_STARTING_POSITIONS, CANONICAL_ARENA_CATALOG_V1_37, CANONICAL_COMPATIBILITY_TUPLES,
  CURRENT_SEMANTIC_RUNTIME_ABI_VERSION, DEFAULT_RUNTIME_LIMITS,
  RUNTIME_EXECUTION_SERVICE_VERSION, RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  RuntimeExecutionServiceRequestSchema, RuntimeExecutionServiceRequestV118Schema,
  RuntimeExecutionServiceResponseV118Schema, TOP_STARTING_POSITIONS, createRuntimeSemanticTupleV118,
  defaultRuntimeMetadata, StrategyRevisionSchema, StrategyInputSchema, SoldierBrainInputSchema,
  createSetScenarioV137, type RuntimeCertificateReferenceV118,
  type RuntimeExecutionServiceRequest, type RuntimeExecutionServiceRequestV118,
  type StrategyRevision,
} from "@cowards/spec"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import type { StrategyExecutionAdapterV117 } from "../packages/runtime-js/src/adapter.js"
import { buildStarterStrategyRevision, findStarterStrategy } from "../packages/persistence/src/starter-strategies.js"
import { buildAdvancedStrategyRevision, findAdvancedStrategy } from "../packages/persistence/src/advanced-strategies.js"
import { createCandidateInitialGameStateV119 } from "../packages/engine/src/kernel/create-initial-state.js"
import { createPreparedRuntimeServiceDependenciesV118, executePreparedRuntimeServiceRequestV118 } from "../apps/runtime-service/src/execute-match.js"
import { createFixtureDeploymentLaneIdentity, createFixtureRuntimeExecutionAuthorityContext } from "../apps/runtime-service/src/runtime-execution-evidence.test-support.js"
import { createRuntimeServiceConfig } from "../apps/runtime-service/src/runtime-config.js"
import {
  LEAN_AUTHORITY_FALSE, LEAN_DEADLINE_MS, buildLeanSchedule,
  LEAN_CURRENT_FORMATION_ROOT, currentFormationIsRealistic, hashLeanValue, leanRequestRealismRoot,
  projectLeanV118Response, reduceLeanExecutions,
  type LeanCell, type LeanExecutionClassification, type LeanExecutionRecord,
  type LeanTerminal,
} from "./lib/v1-38-lean-runner-feasibility.js"
import {
  createLeanContainerMatchSession,
  type LeanContainerMatchSession,
  type LeanContainerSessionCloseResult,
} from "./lib/v1-38-lean-container-match-session.js"

export const LEAN_LIVE_SELECTOR = "--run-reviewed-live-gate" as const
export const LEAN_CHILD_SELECTOR = "--execute-reviewed-cell" as const
export const LEAN_CORRECTIVE_SELECTOR = "--run-reviewed-corrective-gate" as const
export const LEAN_CORRECTIVE_RECOVERY_ONLY_SELECTOR = "--recover-reviewed-corrective-interruption" as const
export const LEAN_DIRECT_SELECTOR = "--run-reviewed-direct-gate" as const
export const LEAN_CONTAINER_ADAPTER_ID = "container-subprocess" as const
export const LEAN_CONTAINER_RUNTIME_ID = "runtime-js-container-subprocess" as const
export const LEAN_CONTAINER_IMAGE = "node:24-alpine@sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14" as const
export const LEAN_CELL_DEADLINE_MS = 45_000
export const LEAN_CLEANUP_DEADLINE_MS = 2_000
export const LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS = 5_000
export const LEAN_CONTAINER_METHOD_CEILINGS = Object.freeze({ selectActivations: 20, soldierBrain: 240 })

export interface ExactDockerImageIdentity {
  readonly repository: string
  readonly digest: string
}

export const parseExactDockerImageIdentity = (value: string): ExactDockerImageIdentity | undefined => {
  const match = /^(.+)@sha256:([0-9a-f]{64})$/u.exec(value)
  if (match === null) return undefined
  let repository = match[1]!
  const lastSlash = repository.lastIndexOf("/")
  const tagColon = repository.lastIndexOf(":")
  if (tagColon > lastSlash) repository = repository.slice(0, tagColon)
  if (repository.length === 0 || /[@\s]/u.test(repository)) return undefined
  return { repository, digest: match[2]! }
}

export const exactDockerImageIdentityEquals = (left: string, right: string): boolean => {
  const a = parseExactDockerImageIdentity(left)
  const b = parseExactDockerImageIdentity(right)
  return a !== undefined && b !== undefined && a.repository === b.repository && a.digest === b.digest
}

export const deriveLeanContainerName = (matchId: string): string =>
  `cg-v138-${createHash("sha256").update(`${LEAN_CONTAINER_IMAGE}\0${matchId}`, "utf8").digest("hex").slice(0, 40)}`

export const deriveLeanContainerOwnershipLabel = (matchId: string): string =>
  `v1.38-lean-owner:${createHash("sha256").update(`owner\0${LEAN_CONTAINER_IMAGE}\0${matchId}`, "utf8").digest("hex")}`

export interface LeanContainerPreflightSample {
  readonly fixtureId: "starter:aggro-chaser" | "advanced:vanguard-pressure"
  readonly method: "selectActivations" | "soldierBrain"
  readonly elapsedMilliseconds: number
  readonly ok: boolean
}
export interface LeanContainerControls {
  readonly network: "none"
  readonly readOnlyRoot: true
  readonly tmpfs: "/tmp:rw,noexec,nosuid,size=16m"
  readonly memory: "64m"
  readonly cpus: "0.5"
  readonly pidsLimit: 64
  readonly capDrop: "ALL"
  readonly noNewPrivileges: true
  readonly environment: "minimal"
  readonly shell: false
  readonly stdoutLimit: true
  readonly stderrLimit: true
  readonly methodTimeout: true
}
export interface LeanContainerPreflightInput {
  readonly dockerServerVersion: string
  readonly imageReference: string
  readonly localRepoDigests: readonly string[]
  readonly adapterId: string
  readonly controls: LeanContainerControls
  readonly lifecycleSamples: readonly {
    readonly elapsedMilliseconds: number
    readonly cleanupComplete: boolean
  }[]
  readonly samples: readonly LeanContainerPreflightSample[]
}
export interface LeanContainerPreflightEvidence {
  readonly status: "pass"
  readonly dockerServerVersion: string
  readonly imageReference: typeof LEAN_CONTAINER_IMAGE
  readonly adapterId: typeof LEAN_CONTAINER_ADAPTER_ID
  readonly controlsRoot: `sha256:${string}`
  readonly sampleCount: number
  readonly sampleRoot: `sha256:${string}`
  readonly lifecycleSampleCount: number
  readonly lifecycleSampleRoot: `sha256:${string}`
  readonly lifecycleMaximumMilliseconds: number
  readonly methodCeilings: typeof LEAN_CONTAINER_METHOD_CEILINGS
  readonly startupCleanupMarginMilliseconds: number
  readonly projectedCellMilliseconds: number
  readonly projectedRunMilliseconds: number
  readonly cellDeadlineMilliseconds: number
  readonly outerDeadlineMilliseconds: number
}

export const LEAN_CONTAINER_CONTROLS: LeanContainerControls = Object.freeze({
  network: "none", readOnlyRoot: true, tmpfs: "/tmp:rw,noexec,nosuid,size=16m",
  memory: "64m", cpus: "0.5", pidsLimit: 64, capDrop: "ALL",
  noNewPrivileges: true, environment: "minimal", shell: false,
  stdoutLimit: true, stderrLimit: true, methodTimeout: true,
})

export interface LeanExecutionResult {
  readonly classification: LeanExecutionClassification
  readonly cleanupComplete: boolean
  readonly orphanedChild: boolean
  readonly boardRealism: boolean
  readonly integrityValid: boolean
  readonly requestRealismRoot?: `sha256:${string}`
  readonly currentFormationRoot?: `sha256:${string}`
  readonly outcomeRoot?: `sha256:${string}`
  readonly finalStateRoot?: `sha256:${string}`
  readonly transitionEventRoot?: `sha256:${string}`
  readonly runtimeAccountingRoot?: `sha256:${string}`
}
export interface LeanCleanupResult { readonly cleanupComplete: boolean; readonly orphanedChild: boolean }
export interface LeanExecutionDependencies {
  readonly now: () => number
  readonly execute: (cell: LeanCell, signal: AbortSignal) => Promise<LeanExecutionResult>
  readonly terminateActive: () => Promise<LeanCleanupResult>
  readonly onAbort?: () => void
  readonly deadlineMilliseconds?: number
  readonly cleanupDeadlineMilliseconds?: number
  readonly armDeadline?: (onDeadline: () => void, milliseconds: number) => () => void
}
export interface LeanSupervisorOptions {
  readonly spawnChild?: () => ChildProcess
  readonly cellDeadlineMilliseconds?: number
  readonly cleanupDeadlineMilliseconds?: number
  readonly correctiveOwnership?: {
    readonly token: string
    readonly persist: (pid: number, processGroupId: number, token: string) => void
    readonly clear: (token: string) => void
  }
}
export interface LeanCorrectiveWrapperDependencies {
  readonly preflight?: () => Promise<void>
  readonly invoke: () => Promise<void>
  readonly recover: () => Promise<void>
  readonly postcheck: () => Promise<void>
}
export interface LeanCorrectiveRecoveryOnlyDependencies {
  readonly markerPresent: boolean
  readonly terminalPresent: boolean
  readonly cleanup: () => Promise<void>
  readonly terminalizeInvalid: () => Promise<void>
  readonly postcheck: () => Promise<void>
}
export interface LeanDirectGateDependencies {
  readonly checkReviewedReady: () => Promise<void>
  readonly preflight: () => Promise<void>
  readonly createMarker: () => void
  readonly invoke: () => Promise<void>
}

export const runLeanDirectGateInjected = async (
  dependencies: LeanDirectGateDependencies,
): Promise<void> => {
  await dependencies.checkReviewedReady()
  await dependencies.preflight()
  dependencies.createMarker()
  await dependencies.invoke()
}

export const runLeanCorrectiveWrapperInjected = async (
  dependencies: LeanCorrectiveWrapperDependencies,
): Promise<void> => {
  await dependencies.preflight?.()
  let invocationError: unknown
  try {
    await dependencies.invoke()
  } catch (error) {
    invocationError = error
  } finally {
    await dependencies.recover()
    await dependencies.postcheck()
  }
  if (invocationError !== undefined) throw invocationError
}

export const runLeanCorrectiveRecoveryOnlyInjected = async (
  dependencies: LeanCorrectiveRecoveryOnlyDependencies,
): Promise<void> => {
  if (!dependencies.markerPresent) throw new TypeError("LEAN_CORRECTIVE_MARKER_REQUIRED")
  if (dependencies.terminalPresent) throw new TypeError("LEAN_CORRECTIVE_TERMINAL_EXISTS")
  await dependencies.cleanup()
  await dependencies.terminalizeInvalid()
  await dependencies.postcheck()
}

const unlaunched = (cell: LeanCell): LeanExecutionRecord => ({
  ...cell, classification: "unlaunched", cleanupComplete: true,
  orphanedChild: false, boardRealism: currentFormationIsRealistic(cell), integrityValid: true,
})
const boundedCleanup = async (dependencies: LeanExecutionDependencies): Promise<LeanCleanupResult> => {
  let timer: NodeJS.Timeout | undefined
  try {
    return await Promise.race([
      dependencies.terminateActive(),
      new Promise<LeanCleanupResult>((resolve) => {
        timer = setTimeout(() => resolve({ cleanupComplete: false, orphanedChild: true }), dependencies.cleanupDeadlineMilliseconds ?? LEAN_CLEANUP_DEADLINE_MS)
        timer.unref()
      }),
    ])
  } catch {
    return { cleanupComplete: false, orphanedChild: true }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export const runLeanFeasibilityInjected = async (dependencies: LeanExecutionDependencies): Promise<LeanTerminal> => {
  const schedule = buildLeanSchedule()
  const records: LeanExecutionRecord[] = []
  const controller = new AbortController()
  const started = dependencies.now()
  const deadline = dependencies.deadlineMilliseconds ?? LEAN_DEADLINE_MS
  let deadlineReached = false
  let stopLaunching = false
  let runnerInvalid = false
  let resolveDeadline!: () => void
  const deadlinePromise = new Promise<void>((resolve) => { resolveDeadline = resolve })
  const abortOnce = (): void => {
    if (deadlineReached) return
    deadlineReached = true
    controller.abort("LEAN_OUTER_DEADLINE")
    dependencies.onAbort?.()
    resolveDeadline()
  }
  const armDeadline = dependencies.armDeadline ?? ((onDeadline, milliseconds) => {
    const timer = setTimeout(onDeadline, milliseconds); timer.unref(); return () => clearTimeout(timer)
  })
  const cancelDeadline = armDeadline(abortOnce, deadline)
  try {
    for (const cell of schedule) {
      if (dependencies.now() - started >= deadline) { abortOnce(); stopLaunching = true; break }
      try {
        const execution = await Promise.race([
          dependencies.execute(cell, controller.signal),
          deadlinePromise.then((): LeanExecutionResult => ({
            classification: "cancelled", cleanupComplete: false, orphanedChild: true,
            boardRealism: currentFormationIsRealistic(cell), integrityValid: true,
          })),
        ])
        records.push({ ...cell, ...execution })
        if (deadlineReached || !execution.cleanupComplete || execution.orphanedChild) { stopLaunching = true; break }
      } catch {
        records.push({
          ...cell, classification: controller.signal.aborted ? "cancelled" : "system_failure",
          cleanupComplete: false, orphanedChild: true, boardRealism: currentFormationIsRealistic(cell),
          integrityValid: false,
        })
        stopLaunching = true
        runnerInvalid = true
        break
      }
    }
  } finally { cancelDeadline() }
  if (deadlineReached || stopLaunching) {
    const cleanup = await boundedCleanup(dependencies)
    const last = records.at(-1)
    if (last !== undefined && (!last.cleanupComplete || last.orphanedChild)) records[records.length - 1] = { ...last, ...cleanup }
    if (!cleanup.cleanupComplete || cleanup.orphanedChild) runnerInvalid = true
  }
  for (const cell of schedule.slice(records.length)) records.push(unlaunched(cell))
  if (runnerInvalid && records.length > 0) records[0] = { ...records[0]!, integrityValid: false }
  return reduceLeanExecutions(records, runnerInvalid)
}

const fsyncParentDirectory = (targetPath: string): void => {
  const descriptor = openSync(path.dirname(targetPath), constants.O_RDONLY)
  try { fsyncSync(descriptor) } finally { closeSync(descriptor) }
}
export const createExclusiveLeanInvocationMarker = (markerPath: string, marker: Readonly<Record<string, unknown>>): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(markerPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
    const bytes = Buffer.from(`${JSON.stringify(marker)}\n`, "utf8")
    let offset = 0
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset)
    fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined
    fsyncParentDirectory(markerPath)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    throw new TypeError(code === "EEXIST" ? "LEAN_INVOCATION_EXISTS" : "LEAN_INVOCATION_CREATE_FAILED")
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}

const legacyFixtureRevision = (fixtureId: string) => {
  const starter = findStarterStrategy(fixtureId)
  if (starter !== null) return buildStarterStrategyRevision(starter)
  const advanced = findAdvancedStrategy(fixtureId)
  if (advanced !== null) return buildAdvancedStrategyRevision(advanced)
  throw new TypeError("LEAN_FIXTURE_MISSING")
}
const rawSha256 = (value: string | Uint8Array): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`

export const createContainerFixtureRevision = (fixtureId: string): StrategyRevision => {
  const legacy = legacyFixtureRevision(fixtureId)
  const current = defaultRuntimeMetadata("typescript")
  const runtime = {
    ...current,
    adapter: { id: LEAN_CONTAINER_RUNTIME_ID, version: current.adapter.version },
    limits: { ...current.limits, filesystem: "read-only-root" as const, network: "disabled" as const },
  }
  const preliminary = buildStrategyRevision({
    source: legacy.source,
    strategyId: legacy.strategyId,
    metadata: { ...legacy.metadata, providerValidation: undefined },
    runtime,
  })
  const artifact = preliminary.metadata.sourceArtifact
  if (artifact === undefined) throw new TypeError("LEAN_CONTAINER_FIXTURE_ARTIFACT_MISSING")
  return StrategyRevisionSchema.parse(buildStrategyRevision({
    source: legacy.source,
    strategyId: legacy.strategyId,
    runtime,
    metadata: {
      ...legacy.metadata,
      sourceArtifact: artifact,
      providerValidation: {
        providerId: "fixture-provider:typescript:container-subprocess",
        contractVersion: "fixture-provider-validation-v1.38",
        sourceHash: preliminary.sourceHash,
        sourceBytes: preliminary.sourceBytes,
        artifactHash: artifact.hash,
        artifactBytes: artifact.bytes,
        proof: `sha256:${rawSha256(JSON.stringify({ fixtureId, sourceHash: preliminary.sourceHash, artifactHash: artifact.hash })).slice("sha256:".length)}`,
      },
    },
  }))
}

const fixtureRevision = (fixtureId: string) => createContainerFixtureRevision(fixtureId)

const parseDockerVersion = (version: string): readonly [number, number, number] => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u.exec(version)
  if (match === null) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_DOCKER_VERSION")
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

const dockerVersionCompatible = (version: string): boolean => {
  const [major, minor, patch] = parseDockerVersion(version)
  return major > 29 || (major === 29 && (minor > 4 || (minor === 4 && patch >= 0)))
}

const exactContainerControls = (value: LeanContainerControls): boolean =>
  JSON.stringify(value) === JSON.stringify(LEAN_CONTAINER_CONTROLS)

export const evaluateLeanContainerPreflight = (
  input: LeanContainerPreflightInput,
): LeanContainerPreflightEvidence => {
  if (!dockerVersionCompatible(input.dockerServerVersion)) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_DOCKER_INCOMPATIBLE")
  if (input.imageReference !== LEAN_CONTAINER_IMAGE || !input.localRepoDigests.some((candidate) => exactDockerImageIdentityEquals(LEAN_CONTAINER_IMAGE, candidate))) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_IMAGE_DRIFT")
  if (input.adapterId !== LEAN_CONTAINER_ADAPTER_ID || !exactContainerControls(input.controls)) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_ISOLATION_DRIFT")
  const expectedPairs = new Set([
    "starter:aggro-chaser\0selectActivations", "starter:aggro-chaser\0soldierBrain",
    "advanced:vanguard-pressure\0selectActivations", "advanced:vanguard-pressure\0soldierBrain",
  ])
  if (input.samples.length < expectedPairs.size || input.samples.some(({ ok, elapsedMilliseconds }) => !ok || !Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0)) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_PROBE_FAILED")
  if (input.lifecycleSamples.length < 1 || input.lifecycleSamples.some(({ elapsedMilliseconds, cleanupComplete }) => !cleanupComplete || !Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0)) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_LIFECYCLE_FAILED")
  const grouped = new Map<string, number[]>()
  for (const sample of input.samples) {
    const key = `${sample.fixtureId}\0${sample.method}`
    if (!expectedPairs.has(key)) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_SAMPLE_DRIFT")
    const values = grouped.get(key) ?? []
    values.push(sample.elapsedMilliseconds)
    grouped.set(key, values)
  }
  if ([...expectedPairs].some((key) => (grouped.get(key)?.length ?? 0) < 1)) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_OBSERVATION_MISSING")
  const maxima = (method: LeanContainerPreflightSample["method"]): number => Math.max(...input.samples.filter((sample) => sample.method === method).map(({ elapsedMilliseconds }) => elapsedMilliseconds))
  const lifecycleMaximumMilliseconds = Math.max(...input.lifecycleSamples.map(({ elapsedMilliseconds }) => elapsedMilliseconds))
  const projectedCellMilliseconds = Math.ceil(
    LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS + lifecycleMaximumMilliseconds + 2 * (
      LEAN_CONTAINER_METHOD_CEILINGS.selectActivations * maxima("selectActivations") +
      LEAN_CONTAINER_METHOD_CEILINGS.soldierBrain * maxima("soldierBrain")
    ),
  )
  const projectedRunMilliseconds = projectedCellMilliseconds * 24
  if (projectedCellMilliseconds > LEAN_CELL_DEADLINE_MS || projectedRunMilliseconds > LEAN_DEADLINE_MS) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_INFEASIBLE")
  return Object.freeze({
    status: "pass",
    dockerServerVersion: input.dockerServerVersion,
    imageReference: LEAN_CONTAINER_IMAGE,
    adapterId: LEAN_CONTAINER_ADAPTER_ID,
    controlsRoot: hashLeanValue(LEAN_CONTAINER_CONTROLS),
    sampleCount: input.samples.length,
    sampleRoot: hashLeanValue(input.samples),
    lifecycleSampleCount: input.lifecycleSamples.length,
    lifecycleSampleRoot: hashLeanValue(input.lifecycleSamples),
    lifecycleMaximumMilliseconds,
    methodCeilings: LEAN_CONTAINER_METHOD_CEILINGS,
    startupCleanupMarginMilliseconds: LEAN_CONTAINER_STARTUP_CLEANUP_MARGIN_MS,
    projectedCellMilliseconds,
    projectedRunMilliseconds,
    cellDeadlineMilliseconds: LEAN_CELL_DEADLINE_MS,
    outerDeadlineMilliseconds: LEAN_DEADLINE_MS,
  })
}

const dockerText = (args: readonly string[]): string => {
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  })
  if (result.error !== undefined || result.status !== 0 || result.signal !== null) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_DOCKER_UNAVAILABLE")
  return result.stdout.trim()
}

export const buildLeanContainerPreflightProbeInput = (method: LeanContainerPreflightSample["method"]): unknown => {
  const bottom = {
    id: "bottom-soldier-1", ownerPlayerId: "player:bottom", status: "ACTIVE",
    position: { x: 5, y: 10 }, facing: "UP", lastSuccessfulMoveDirection: null,
  } as const
  const top = {
    id: "top-soldier-1", ownerPlayerId: "player:top", status: "ACTIVE",
    position: { x: 5, y: 1 }, facing: "DOWN", lastSuccessfulMoveDirection: null,
  } as const
  if (method === "selectActivations") {
    return StrategyInputSchema.parse({
      phaseNumber: 1, roundNumber: 1, activationCount: 1,
      initialInitiativePlayerId: "player:bottom", hasInitialInitiative: true,
      roundInitiativePlayerId: "player:bottom", hasRoundInitiative: true,
      board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers: [bottom, top], terrainStones: [] },
      mySoldiers: [bottom], enemySoldiers: [top], strategyMemory: {},
    })
  }
  const cells = []
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) cells.push({
    dx,
    dy,
    absoluteX: bottom.position.x + dx,
    absoluteY: bottom.position.y + dy,
    contents: dx === 0 && dy === 0 ? "FRIENDLY_ACTIVE" : "EMPTY",
  })
  return SoldierBrainInputSchema.parse({
    self: bottom, awarenessGrid: { cells }, cycleIndex: 0, maxCycles: 12,
    hasAdvancedThisActivation: false, soldierMemory: {},
    objective: { preferred: "UP", safeDirs: ["UP", "LEFT", "RIGHT"], contractionSoon: false },
  })
}

export const runActualLeanContainerPreflight = (): LeanContainerPreflightEvidence => {
  const dockerServerVersion = dockerText(["version", "--format", "{{.Server.Version}}"])
  const repoDigestsRaw = dockerText(["image", "inspect", "--format", "{{json .RepoDigests}}", LEAN_CONTAINER_IMAGE])
  let localRepoDigests: readonly string[]
  try {
    const parsed = JSON.parse(repoDigestsRaw) as unknown
    if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) throw new TypeError()
    localRepoDigests = parsed
  } catch {
    throw new TypeError("LEAN_CONTAINER_PREFLIGHT_IMAGE_INSPECT_INVALID")
  }
  const samples: LeanContainerPreflightSample[] = []
  const lifecycleSamples: { elapsedMilliseconds: number; cleanupComplete: boolean }[] = []
  for (const fixtureId of ["starter:aggro-chaser", "advanced:vanguard-pressure"] as const) {
    const lifecycleStarted = process.hrtime.bigint()
    const matchId = `match:lean:preflight:${fixtureId}`
    const session = createLeanContainerMatchSession({ matchId, containerName: deriveLeanContainerName(matchId), ownershipLabel: deriveLeanContainerOwnershipLabel(matchId), image: LEAN_CONTAINER_IMAGE })
    const lifecycleCreateMilliseconds = Number(process.hrtime.bigint() - lifecycleStarted) / 1_000_000
    const adapter = session.adapter
    if (adapter.metadata.id !== LEAN_CONTAINER_ADAPTER_ID || adapter.metadata.diagnostics?.fallback !== false) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_ADAPTER_DRIFT")
    const revision = createContainerFixtureRevision(fixtureId)
    const artifact = revision.metadata.sourceArtifact
    if (artifact === undefined) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_ARTIFACT_MISSING")
    const source = Buffer.from(artifact.bytesBase64, "base64").toString("utf8")
    let close: LeanContainerSessionCloseResult
    try {
      for (const method of ["selectActivations", "soldierBrain"] as const) {
        const request = { source, methodName: method, input: buildLeanContainerPreflightProbeInput(method), timeoutMs: 5_000, outputByteLimit: 32_768 } as const
        const warm = adapter.execute(request)
        if (!warm.ok) throw new TypeError("LEAN_CONTAINER_PREFLIGHT_PROBE_FAILED")
        for (let ordinal = 0; ordinal < 3; ordinal += 1) {
          const started = process.hrtime.bigint()
          const result = adapter.execute(request)
          const elapsedMilliseconds = Number(process.hrtime.bigint() - started) / 1_000_000
          samples.push({ fixtureId, method, elapsedMilliseconds, ok: result.ok })
        }
      }
    } finally {
      const cleanupStarted = process.hrtime.bigint()
      close = session.close()
      lifecycleSamples.push({
        elapsedMilliseconds: lifecycleCreateMilliseconds + Number(process.hrtime.bigint() - cleanupStarted) / 1_000_000,
        cleanupComplete: close.cleanupComplete && !close.orphanedChild,
      })
    }
  }
  return evaluateLeanContainerPreflight({
    dockerServerVersion,
    imageReference: LEAN_CONTAINER_IMAGE,
    localRepoDigests,
    adapterId: adapter.metadata.id,
    controls: LEAN_CONTAINER_CONTROLS,
    lifecycleSamples,
    samples,
  })
}
export interface CanonicalLeanPreparedRequest {
  readonly request: RuntimeExecutionServiceRequestV118
  readonly nestedRequest: RuntimeExecutionServiceRequest
  readonly initialStateRoot: `sha256:${string}`
  readonly requestRealismRoot: `sha256:${string}`
  readonly context: ReturnType<typeof createFixtureRuntimeExecutionAuthorityContext>
}

const certificateReference = (
  side: "bottom" | "top",
  nestedRequest: RuntimeExecutionServiceRequest,
  context: ReturnType<typeof createFixtureRuntimeExecutionAuthorityContext>,
): RuntimeCertificateReferenceV118 => {
  const revision = nestedRequest.strategies[side]
  const entrant = nestedRequest.evidenceSnapshot.entrants[side]
  const certificate = context.authority.payload.certificates.find(
    (candidate) => candidate.kind === "containment" && candidate.certificateId === entrant.containmentCertificateId,
  )
  const attestation = context.authority.payload.attestations.find(
    (candidate) => certificate?.attestationIds.includes(candidate.attestationId),
  )
  const artifact = revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  if (certificate === undefined || attestation === undefined || artifact === undefined) throw new TypeError("LEAN_CERTIFICATE_REFERENCE_MISSING")
  return {
    side,
    certificateId: certificate.certificateId,
    certificateRecordHash: hashLeanValue({ side, certificateId: certificate.certificateId }),
    registryGeneration: context.authority.registryGeneration,
    lane: certificate.laneIdentity.languageId,
    freshUntil: certificate.freshUntil,
    sourceIdentity: {
      side,
      strategyRevisionId: revision.id,
      originalSourceSha256: rawSha256(revision.source),
      normalizedSourceSha256: rawSha256(revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n")),
      artifactSha256: `sha256:${artifact.hash.replace(/^sha256:/u, "")}`,
      identityManifestRoot: certificate.laneIdentityHash as `sha256:${string}`,
      evidenceGraphRoot: attestation.attestationHash as `sha256:${string}`,
      laneIdentityHash: certificate.laneIdentityHash as `sha256:${string}`,
    },
  }
}

export const buildCanonicalLeanRequestV118 = (cell: LeanCell): CanonicalLeanPreparedRequest => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(({ id }) => id === cell.executionArenaId)
  const tuple = CANONICAL_COMPATIBILITY_TUPLES.find(({ tuple: candidate }) => candidate.runtimeAbi === CURRENT_SEMANTIC_RUNTIME_ABI_VERSION)
  if (arena === undefined || tuple === undefined) throw new TypeError("LEAN_CANONICAL_INPUT_MISSING")
  const bottom = fixtureRevision(cell.bottomFixtureId)
  const top = fixtureRevision(cell.topFixtureId)
  const authority = createFixtureRuntimeExecutionAuthorityContext({
    fixtureId: `lean:${hashLeanValue(cell.baseCellId).slice("sha256:".length)}`,
    bottom,
    top,
    compatibility: tuple,
  })
  const baseSeed = `lean-seed:${hashLeanValue(cell.baseCellId).slice("sha256:".length)}`
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: { entrantKey: authority.evidenceSnapshot.entrants.bottom.entrantKey, playerId: "player:bottom" },
    entrantB: { entrantKey: authority.evidenceSnapshot.entrants.top.entrantKey, playerId: "player:top" },
    baseSeed,
  })
  const initiativePlayerId = `player:${cell.initiativeSide}`
  const condition = scenario.conditions.find((candidate) => candidate.bottomEntrantKey === authority.evidenceSnapshot.entrants.bottom.entrantKey && candidate.initialInitiativePlayerId === initiativePlayerId)
  if (condition === undefined) throw new TypeError("LEAN_CONDITION_MISSING")
  // Both passes execute byte-identical Match input. Pass identity exists only
  // in the charged schedule record, never in gameplay or receipt semantics.
  const stableCellIdentity = hashLeanValue(cell.baseCellId).slice("sha256:".length)
  const matchId = `match:lean:${stableCellIdentity}`
  const nestedRequest = RuntimeExecutionServiceRequestSchema.parse({
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION, kind: "executeMatch", requestId: `request:lean:${stableCellIdentity}`,
    match: {
      matchId, seed: baseSeed,
      arenaVariant: { id: arena.id, name: arena.name, initialBounds: { ...arena.initialBounds }, terrainStones: arena.terrainStones.map((position) => ({ ...position })) },
      bottomPlayerId: "player:bottom", topPlayerId: "player:top",
      bottomStrategyRevisionId: bottom.id, topStrategyRevisionId: top.id,
      initialInitiativePlayerId: initiativePlayerId, maxPhases: 100,
      candidateMatch: {
        semanticAuthorityKey: "runtime-v1.19", matchId, seed: baseSeed, arenaVariantId: arena.id,
        bottomStrategyRevisionId: bottom.id, topStrategyRevisionId: top.id,
        bottomPlayerId: "player:bottom", topPlayerId: "player:top",
        bottomEntrantKey: condition.bottomEntrantKey, topEntrantKey: condition.topEntrantKey,
        setPolicyVersion: scenario.setPolicyVersion, scenarioId: scenario.scenarioId,
        conditionId: condition.conditionId, conditionOrdinal: condition.ordinal,
        conditionSuffix: condition.suffix, requestIdentity: condition.requestIdentity,
        arenaCatalogVersion: scenario.arenaCatalogVersion,
        arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
        initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
        initialInitiativePlayerId: condition.initialInitiativePlayerId,
      },
    },
    strategies: { bottom, top }, limits: DEFAULT_RUNTIME_LIMITS,
    evidenceSnapshot: authority.evidenceSnapshot,
  }) as RuntimeExecutionServiceRequest
  const initial = createCandidateInitialGameStateV119({
    matchId: nestedRequest.match.matchId,
    seed: nestedRequest.match.seed,
    arenaVariant: nestedRequest.match.arenaVariant,
    bottomPlayerId: nestedRequest.match.bottomPlayerId,
    topPlayerId: nestedRequest.match.topPlayerId,
    bottomStrategyRevisionId: nestedRequest.match.bottomStrategyRevisionId,
    topStrategyRevisionId: nestedRequest.match.topStrategyRevisionId,
    initialInitiativePlayerId: nestedRequest.match.initialInitiativePlayerId!,
  })
  if (!initial.ok || !currentFormationIsRealistic(cell)) throw new TypeError("LEAN_CANONICAL_INITIAL_STATE_INVALID")
  const actualBottom = initial.state.soldiers.filter(({ ownerPlayerId }) => ownerPlayerId === "player:bottom").map(({ position }) => position)
  const actualTop = initial.state.soldiers.filter(({ ownerPlayerId }) => ownerPlayerId === "player:top").map(({ position }) => position)
  if (JSON.stringify(actualBottom) !== JSON.stringify(BOTTOM_STARTING_POSITIONS) || JSON.stringify(actualTop) !== JSON.stringify(TOP_STARTING_POSITIONS)) throw new TypeError("LEAN_CURRENT_FORMATION_DRIFT")
  const budgetProfileRoot = hashLeanValue({ limits: DEFAULT_RUNTIME_LIMITS, profile: "lean-v1" })
  const ledgerPrestateRoot = hashLeanValue({ cell: cell.baseCellId, ledger: "prestate" })
  const request = RuntimeExecutionServiceRequestV118Schema.parse({
    contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
    kind: "executeMatch",
    requestId: nestedRequest.requestId,
    matchId: nestedRequest.match.matchId,
    semanticTuple: createRuntimeSemanticTupleV118(tuple.tuple),
    authorityGeneration: nestedRequest.evidenceSnapshot.registryGeneration,
    evaluationInstant: "2026-07-13T00:00:00.000Z",
    certificateReferences: {
      bottom: certificateReference("bottom", nestedRequest, authority),
      top: certificateReference("top", nestedRequest, authority),
    },
    accounting: { budgetProfileRoot, ledgerPrestateRoot },
    match: nestedRequest,
  })
  return {
    request,
    nestedRequest,
    initialStateRoot: hashLeanValue(initial.state),
    requestRealismRoot: leanRequestRealismRoot(cell),
    context: authority,
  }
}

const executePreparedLeanRequest = (
  prepared: CanonicalLeanPreparedRequest,
  sessionAdapter?: StrategyExecutionAdapterV117,
) => {
  const keys = generateKeyPairSync("ed25519")
  const configured = createRuntimeServiceConfig({
    strategyExecutionAdapter: LEAN_CONTAINER_ADAPTER_ID,
    containerImage: LEAN_CONTAINER_IMAGE,
    semanticReceiptSecret: "fixture-only:v1.38-lean-runner",
    resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
  })
  const runtimeConfig = sessionAdapter === undefined
    ? configured
    : { ...configured, adapter: sessionAdapter, metadata: sessionAdapter.metadata }
  const actual = createPreparedRuntimeServiceDependenciesV118({
      runtimeConfig,
      authorityLoader: prepared.context.authorityLoader,
      signer: {
        keyId: "runtime-service:lean-fixture:v1.18",
        publicKeyPem: keys.publicKey.export({ format: "pem", type: "spki" }) as string,
        sign: (bytes) => sign(null, bytes, keys.privateKey),
      },
      budgetProfileRoot: prepared.request.accounting.budgetProfileRoot,
      ledgerPrestateRoot: prepared.request.accounting.ledgerPrestateRoot,
      evaluationInstant: () => prepared.request.evaluationInstant,
    })
  const response = RuntimeExecutionServiceResponseV118Schema.parse(executePreparedRuntimeServiceRequestV118(
    prepared.request,
    {
      ...actual,
      // Reviewed fixture-only admission seam: source identity remains strict,
      // while test-domain certificate record hashes are made side-distinct.
      admitCertificateReference: ({ reference }) => ({
        certificateRecordHash: reference.certificateRecordHash,
        sourceIdentity: reference.sourceIdentity,
        commonSupervisorEvidenceRoot: reference.sourceIdentity.evidenceGraphRoot,
      }),
    },
  ))
  return response
}

export const executePreparedLeanCellResponse = (cell: LeanCell) => {
  const prepared = buildCanonicalLeanRequestV118(cell)
  const session = createLeanContainerMatchSession({ matchId: prepared.request.matchId, containerName: deriveLeanContainerName(prepared.request.matchId), ownershipLabel: deriveLeanContainerOwnershipLabel(prepared.request.matchId), image: LEAN_CONTAINER_IMAGE })
  try { return executePreparedLeanRequest(prepared, session.adapter) }
  finally {
    const cleanup = session.close()
    if (!cleanup.cleanupComplete || cleanup.orphanedChild) throw new TypeError("LEAN_CONTAINER_SESSION_CLEANUP_AMBIGUOUS")
  }
}

export const finalizePreparedLeanProjection = (
  projection: ReturnType<typeof projectLeanV118Response>,
  requestRealismRoot: `sha256:${string}`,
): LeanExecutionResult => {
  const semantic = projection.classification === "success" || projection.classification === "player_violation"
  return parseLeanExecutionResult({
    ...projection,
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: true,
    integrityValid: true,
    ...(semantic ? { requestRealismRoot, currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT } : {}),
  })
}

type LeanPreparedProjection = ReturnType<typeof projectLeanV118Response>
export interface ExecutePreparedLeanCellDependencies {
  readonly createSession: (input: { readonly matchId: string; readonly containerName: string; readonly ownershipLabel: string; readonly image: typeof LEAN_CONTAINER_IMAGE }) => Pick<LeanContainerMatchSession, "adapter" | "close">
  readonly executePrepared: (prepared: CanonicalLeanPreparedRequest, adapter: StrategyExecutionAdapterV117) => LeanPreparedProjection
}

const defaultPreparedLeanCellDependencies: ExecutePreparedLeanCellDependencies = {
  createSession: createLeanContainerMatchSession,
  executePrepared: (prepared, adapter) => projectLeanV118Response(executePreparedLeanRequest(prepared, adapter)),
}

export const executePreparedLeanCellInjected = async (
  cell: LeanCell,
  dependencies: ExecutePreparedLeanCellDependencies,
): Promise<LeanExecutionResult> => {
  const prepared = buildCanonicalLeanRequestV118(cell)
  let session: Pick<LeanContainerMatchSession, "adapter" | "close"> | undefined
  let projection: LeanPreparedProjection | undefined
  let executionFailed = false
  try {
    session = dependencies.createSession({ matchId: prepared.request.matchId, containerName: deriveLeanContainerName(prepared.request.matchId), ownershipLabel: deriveLeanContainerOwnershipLabel(prepared.request.matchId), image: LEAN_CONTAINER_IMAGE })
    projection = dependencies.executePrepared(prepared, session.adapter)
  } catch {
    executionFailed = true
  }
  const cleanup = session?.close() ?? { cleanupComplete: false, orphanedChild: true }
  if (executionFailed || projection === undefined || !cleanup.cleanupComplete || cleanup.orphanedChild) {
    return parseLeanExecutionResult({
      classification: "system_failure",
      cleanupComplete: cleanup.cleanupComplete,
      orphanedChild: cleanup.orphanedChild,
      boardRealism: true,
      integrityValid: false,
    })
  }
  return finalizePreparedLeanProjection(projection, prepared.requestRealismRoot)
}

export const executePreparedLeanCell = async (cell: LeanCell): Promise<LeanExecutionResult> =>
  executePreparedLeanCellInjected(cell, defaultPreparedLeanCellDependencies)

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
const isSha = (value: unknown): value is `sha256:${string}` => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
export const parseLeanExecutionResult = (value: unknown): LeanExecutionResult => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("LEAN_CHILD_OUTPUT_INVALID")
  const candidate = value as Record<string, unknown>
  const classification = candidate.classification
  if (!["success", "player_violation", "system_failure", "timeout", "cancelled", "unlaunched"].includes(String(classification))) throw new TypeError("LEAN_CHILD_OUTPUT_INVALID")
  const successful = classification === "success" || classification === "player_violation"
  const keys = ["classification", "cleanupComplete", "orphanedChild", "boardRealism", "integrityValid", ...(successful ? ["requestRealismRoot", "currentFormationRoot", "outcomeRoot", "finalStateRoot", "transitionEventRoot", "runtimeAccountingRoot"] : [])]
  if (!exactKeys(candidate, keys) || typeof candidate.cleanupComplete !== "boolean" || typeof candidate.orphanedChild !== "boolean" || typeof candidate.boardRealism !== "boolean" || typeof candidate.integrityValid !== "boolean" || (successful && ![candidate.requestRealismRoot, candidate.currentFormationRoot, candidate.outcomeRoot, candidate.finalStateRoot, candidate.transitionEventRoot, candidate.runtimeAccountingRoot].every(isSha))) throw new TypeError("LEAN_CHILD_OUTPUT_INVALID")
  return globalThis.structuredClone(candidate) as unknown as LeanExecutionResult
}

const parseLeanCell = (value: unknown): LeanCell => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("LEAN_CHILD_CELL_INVALID")
  const candidate = value as LeanCell
  const expected = buildLeanSchedule().find(({ cellId }) => cellId === candidate.cellId)
  if (expected === undefined || JSON.stringify(candidate) !== JSON.stringify(expected)) throw new TypeError("LEAN_CHILD_CELL_INVALID")
  return expected
}

export const createSupervisedLeanExecutionDependencies = (
  capability: string,
  options: LeanSupervisorOptions = {},
): LeanExecutionDependencies => {
  if (!/^[0-9a-f]{64}$/u.test(capability)) throw new TypeError("LEAN_CHILD_CAPABILITY_INVALID")
  let active: ChildProcess | undefined
  let termination: Promise<LeanCleanupResult> | undefined
  let lastCleanup: LeanCleanupResult | undefined
  let ownershipPersisted = false
  const clearOwnership = (): void => {
    if (!ownershipPersisted || options.correctiveOwnership === undefined) return
    options.correctiveOwnership.clear(options.correctiveOwnership.token)
    ownershipPersisted = false
  }
  const terminateActive = async (): Promise<LeanCleanupResult> => {
    if (termination !== undefined) return termination
    const child = active
    if (child === undefined) return lastCleanup ?? { cleanupComplete: true, orphanedChild: false }
    if (child.exitCode !== null || child.signalCode !== null) {
      active = undefined
      lastCleanup = { cleanupComplete: true, orphanedChild: false }
      return lastCleanup
    }
    let resolveTermination!: (result: LeanCleanupResult) => void
    const pending = new Promise<LeanCleanupResult>((resolve) => { resolveTermination = resolve })
    termination = pending
    let complete = false
    const finish = (result: LeanCleanupResult): void => {
      if (complete) return
      complete = true
      clearTimeout(timer)
      active = undefined
      let finalResult = result
      try { clearOwnership() } catch { finalResult = { cleanupComplete: false, orphanedChild: true } }
      lastCleanup = finalResult
      termination = undefined
      resolveTermination(finalResult)
    }
    const timer = setTimeout(
      () => finish({ cleanupComplete: false, orphanedChild: true }),
      options.cleanupDeadlineMilliseconds ?? LEAN_CLEANUP_DEADLINE_MS,
    )
    timer.unref()
    child.once("exit", () => finish({ cleanupComplete: true, orphanedChild: false }))
    try {
      if (child.pid !== undefined) {
        try { process.kill(-child.pid, "SIGKILL") } catch { child.kill("SIGKILL") }
      } else child.kill("SIGKILL")
    } catch {
      finish({ cleanupComplete: false, orphanedChild: true })
    }
    return pending
  }
  return {
    now: () => performance.now(), terminateActive,
    cleanupDeadlineMilliseconds: options.cleanupDeadlineMilliseconds,
    execute: async (cell, signal) => {
      if (active !== undefined) throw new TypeError("LEAN_CHILD_ALREADY_ACTIVE")
      const ownership = options.correctiveOwnership
      if (ownership !== undefined && !/^[0-9a-f]{64}$/u.test(ownership.token)) throw new TypeError("LEAN_CORRECTIVE_CHILD_TOKEN_INVALID")
      const child = options.spawnChild?.() ?? fork(fileURLToPath(import.meta.url), [LEAN_CHILD_SELECTOR, ...(ownership === undefined ? [] : [ownership.token])], {
          cwd: process.cwd(), execArgv: ["--import", "tsx"],
          detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe", "ipc"],
          env: { ...process.env, LEAN_CHILD_CAPABILITY: capability },
        })
      active = child
      lastCleanup = undefined
      let stderr = ""
      child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8") })
      return await new Promise<LeanExecutionResult>((resolve, reject) => {
        let settled = false
        let terminating = false
        let readySeen = false
        let ownershipReadySeen = false
        let pendingResult: LeanExecutionResult | undefined
        const settle = (complete: () => void): void => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          signal.removeEventListener("abort", abort)
          complete()
        }
        const terminateWith = (classification: "timeout" | "cancelled"): void => {
          if (settled || terminating) return
          terminating = true
          void terminateActive().then(
            (cleanup) => settle(() => resolve(parseLeanExecutionResult({ classification, ...cleanup, boardRealism: currentFormationIsRealistic(cell), integrityValid: true }))),
            (error: unknown) => settle(() => reject(error)),
          )
        }
        const failWithCleanup = (error: unknown): void => {
          if (settled || terminating) return
          terminating = true
          void terminateActive().then(
            () => settle(() => reject(error)),
            () => settle(() => reject(error)),
          )
        }
        const timer = setTimeout(() => terminateWith("timeout"), options.cellDeadlineMilliseconds ?? LEAN_CELL_DEADLINE_MS)
        timer.unref()
        const abort = () => terminateWith("cancelled")
        signal.addEventListener("abort", abort, { once: true })
        child.once("error", failWithCleanup)
        child.on("message", (message: unknown) => {
          if (settled || terminating) return
          if (message === null || typeof message !== "object" || Array.isArray(message)) {
            failWithCleanup(new TypeError("LEAN_CHILD_PROTOCOL_INVALID"))
            return
          }
          const body = message as Record<string, unknown>
          if (ownership !== undefined && body.kind === "ownership-ready" && body.token === ownership.token && exactKeys(body, ["kind", "token"])) {
            if (ownershipReadySeen || readySeen || pendingResult !== undefined || child.pid === undefined) { failWithCleanup(new TypeError("LEAN_CHILD_PROTOCOL_DUPLICATE")); return }
            ownershipReadySeen = true
            try {
              ownership.persist(child.pid, child.pid, ownership.token)
              ownershipPersisted = true
              child.send({ kind: "admit", token: ownership.token })
            } catch (error) { failWithCleanup(error) }
          } else if (body.kind === "ready" && body.capability === capability && exactKeys(body, ["kind", "capability"])) {
            if (ownership !== undefined && !ownershipPersisted) { failWithCleanup(new TypeError("LEAN_CORRECTIVE_CHILD_OWNERSHIP_REQUIRED")); return }
            if (readySeen || pendingResult !== undefined) { failWithCleanup(new TypeError("LEAN_CHILD_PROTOCOL_DUPLICATE")); return }
            readySeen = true
            child.send({ kind: "execute", capability, cell })
          } else if (body.kind === "result" && body.capability === capability && exactKeys(body, ["kind", "capability", "result"])) {
            if (!readySeen || pendingResult !== undefined) { failWithCleanup(new TypeError("LEAN_CHILD_PROTOCOL_DUPLICATE")); return }
            try {
              pendingResult = parseLeanExecutionResult(body.result)
            } catch (error) { failWithCleanup(error) }
          } else {
            failWithCleanup(new TypeError("LEAN_CHILD_PROTOCOL_INVALID"))
          }
        })
        child.once("exit", (code, exitSignal) => {
          if (terminating || settled) return
          active = undefined
          try { clearOwnership() } catch (error) { settle(() => reject(error)); return }
          lastCleanup = { cleanupComplete: true, orphanedChild: false }
          if (code === 0 && exitSignal === null && pendingResult !== undefined) {
            settle(() => resolve({ ...pendingResult!, cleanupComplete: true, orphanedChild: false }))
          } else {
            settle(() => reject(new TypeError(code === 0 && exitSignal === null ? "LEAN_CHILD_RESULT_MISSING" : stderr.trim() || "LEAN_CHILD_FAILED")))
          }
        })
      })
    },
  }
}

export const syntheticLeanTerminal = async (): Promise<LeanTerminal> => runLeanFeasibilityInjected({
  now: () => 0, terminateActive: async () => ({ cleanupComplete: true, orphanedChild: false }),
  execute: async (cell) => ({
    classification: "success", cleanupComplete: true, orphanedChild: false,
    boardRealism: currentFormationIsRealistic(cell), integrityValid: true,
    requestRealismRoot: leanRequestRealismRoot(cell), currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT,
    outcomeRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "outcome" }),
    finalStateRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "state" }),
    transitionEventRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "events" }),
    runtimeAccountingRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "accounting" }),
  }),
})

// Immutable recovery proof fixture retained for Plan 170 history. Nothing calls
// this function, and the active parser below has no recovery selector branch.
const retiredLeanCorrectiveRecoveryDispatch = async (selector: string): Promise<void> => {
  if (selector !== LEAN_CORRECTIVE_RECOVERY_ONLY_SELECTOR) return
  const leanAdmissionRecovery = await import("./check-v1-38-lean-admission.js")
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const markerPath = path.resolve(repoRoot, leanAdmissionRecovery.LEAN_CORRECTIVE_ARTIFACT_PATHS.invocation)
  const terminalPath = path.resolve(repoRoot, leanAdmissionRecovery.LEAN_CORRECTIVE_ARTIFACT_PATHS.terminal)
  await runLeanCorrectiveRecoveryOnlyInjected({
    markerPresent: existsSync(markerPath),
    terminalPresent: existsSync(terminalPath),
    cleanup: async () => { await leanAdmissionRecovery.recoverLeanCorrectiveOrphan(repoRoot) },
    terminalizeInvalid: async () => { leanAdmissionRecovery.terminalizeLeanCorrectiveInterruption(repoRoot) },
    postcheck: async () => { leanAdmissionRecovery.checkLeanCorrectiveRecoveryTerminal(repoRoot) },
  })
}
void retiredLeanCorrectiveRecoveryDispatch

const main = async (): Promise<void> => {
  const selector = process.argv[2]
  if (selector === "--synthetic") { process.stdout.write(`${JSON.stringify(await syntheticLeanTerminal())}\n`); return }
  if (selector === LEAN_CHILD_SELECTOR) {
    const capability = process.env.LEAN_CHILD_CAPABILITY
    const ownershipToken = process.argv[3]
    if (typeof process.send !== "function" || !/^[0-9a-f]{64}$/u.test(capability ?? "")) throw new TypeError("LEAN_CHILD_PARENT_REQUIRED")
    const checker = await import("./check-v1-38-lean-admission.js")
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const beginAdmittedExecution = (): void => {
      checker.loadAndCheckLeanChildInvocation(repoRoot, capability!, ownershipToken)
      process.once("message", (message: unknown) => {
      void (async () => {
        if (message === null || typeof message !== "object") throw new TypeError("LEAN_CHILD_MESSAGE_INVALID")
        const body = message as Record<string, unknown>
        if (body.kind !== "execute" || body.capability !== capability) throw new TypeError("LEAN_CHILD_CAPABILITY_MISMATCH")
        const result = await executePreparedLeanCell(parseLeanCell(body.cell))
        process.send?.({ kind: "result", capability, result }, () => process.disconnect())
      })().catch((error: unknown) => {
        process.stderr.write(`${error instanceof Error ? error.message : "LEAN_CHILD_FAILED"}\n`)
        process.exitCode = 1
        process.disconnect()
      })
      })
      process.send?.({ kind: "ready", capability })
    }
    if (ownershipToken === undefined) beginAdmittedExecution()
    else {
      if (!/^[0-9a-f]{64}$/u.test(ownershipToken)) throw new TypeError("LEAN_CORRECTIVE_CHILD_TOKEN_INVALID")
      process.once("message", (message: unknown) => {
        if (message === null || typeof message !== "object" || Array.isArray(message)) throw new TypeError("LEAN_CORRECTIVE_CHILD_ADMISSION_INVALID")
        const body = message as Record<string, unknown>
        if (body.kind !== "admit" || body.token !== ownershipToken || !exactKeys(body, ["kind", "token"])) throw new TypeError("LEAN_CORRECTIVE_CHILD_ADMISSION_INVALID")
        beginAdmittedExecution()
      })
      process.send({ kind: "ownership-ready", token: ownershipToken })
    }
    return
  }
  if (selector === LEAN_DIRECT_SELECTOR) {
    const checker = await import("./check-v1-38-lean-admission.js")
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    let reviewed: ReturnType<typeof checker.loadAndCheckLeanDirectReviewedReadyV5> | undefined
    let capability = ""
    let invocation: ReturnType<typeof checker.createLeanDirectInvocationV5> | undefined
    let terminal: LeanTerminal | undefined
    await runLeanDirectGateInjected({
      checkReviewedReady: async () => { reviewed = checker.loadAndCheckLeanDirectReviewedReadyV5(repoRoot) },
      preflight: async () => { runActualLeanContainerPreflight() },
      createMarker: () => {
        if (reviewed === undefined) throw new TypeError("LEAN_DIRECT_REVIEW_REQUIRED")
        capability = randomBytes(32).toString("hex")
        invocation = checker.createLeanDirectInvocationV5(reviewed.authorization, reviewed.review, hashLeanValue(capability))
        createExclusiveLeanInvocationMarker(path.resolve(repoRoot, checker.LEAN_DIRECT_V5_ARTIFACT_PATHS.invocation), invocation)
      },
      invoke: async () => {
        if (invocation === undefined) throw new TypeError("LEAN_DIRECT_MARKER_REQUIRED")
        terminal = await runLeanFeasibilityInjected(createSupervisedLeanExecutionDependencies(capability))
        checker.createExclusiveLeanDirectTerminalV5(repoRoot, checker.createLeanDirectTerminalArtifactV5(invocation, terminal))
      },
    })
    process.stdout.write(`${JSON.stringify(terminal)}\n`)
    return
  }
  throw new TypeError("LEAN_DIRECT_SELECTOR_REQUIRED")
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "LEAN_RUNNER_FAILED"}\n`); process.exitCode = 1
})
export const LEAN_RUNNER_AUTHORITY = LEAN_AUTHORITY_FALSE
