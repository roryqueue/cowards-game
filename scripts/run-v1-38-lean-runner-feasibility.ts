/* eslint-disable no-restricted-imports -- private lab runner binds reviewed fixture seams. */
import { fork, type ChildProcess } from "node:child_process"
import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto"
import { closeSync, constants, fsyncSync, openSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  BOTTOM_STARTING_POSITIONS, CANONICAL_ARENA_CATALOG_V1_37, CANONICAL_COMPATIBILITY_TUPLES,
  CURRENT_SEMANTIC_RUNTIME_ABI_VERSION, DEFAULT_RUNTIME_LIMITS,
  RUNTIME_EXECUTION_SERVICE_VERSION, RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  RuntimeExecutionServiceRequestSchema, RuntimeExecutionServiceRequestV118Schema,
  RuntimeExecutionServiceResponseV118Schema, TOP_STARTING_POSITIONS, createRuntimeSemanticTupleV118,
  createSetScenarioV137, type RuntimeCertificateReferenceV118,
  type RuntimeExecutionServiceRequest, type RuntimeExecutionServiceRequestV118,
} from "@cowards/spec"
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

export const LEAN_LIVE_SELECTOR = "--run-reviewed-live-gate" as const
export const LEAN_CHILD_SELECTOR = "--execute-reviewed-cell" as const
export const LEAN_CELL_DEADLINE_MS = 45_000
export const LEAN_CLEANUP_DEADLINE_MS = 2_000

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

const fixtureRevision = (fixtureId: string) => {
  const starter = findStarterStrategy(fixtureId)
  if (starter !== null) return buildStarterStrategyRevision(starter)
  const advanced = findAdvancedStrategy(fixtureId)
  if (advanced !== null) return buildAdvancedStrategyRevision(advanced)
  throw new TypeError("LEAN_FIXTURE_MISSING")
}
const rawSha256 = (value: string | Uint8Array): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`
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
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(({ id }) => id === cell.arenaId)
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

const executePreparedLeanRequest = (prepared: CanonicalLeanPreparedRequest) => {
  const keys = generateKeyPairSync("ed25519")
  const actual = createPreparedRuntimeServiceDependenciesV118({
      runtimeConfig: createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        semanticReceiptSecret: "fixture-only:v1.38-lean-runner",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
      }),
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

export const executePreparedLeanCellResponse = (cell: LeanCell) => executePreparedLeanRequest(buildCanonicalLeanRequestV118(cell))

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

export const executePreparedLeanCell = async (cell: LeanCell): Promise<LeanExecutionResult> => {
  const prepared = buildCanonicalLeanRequestV118(cell)
  const projection = projectLeanV118Response(executePreparedLeanRequest(prepared))
  return finalizePreparedLeanProjection(projection, prepared.requestRealismRoot)
}

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
      lastCleanup = result
      termination = undefined
      resolveTermination(result)
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
      const child = options.spawnChild?.() ?? fork(fileURLToPath(import.meta.url), [LEAN_CHILD_SELECTOR], {
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
          if (settled) return
          if (message === null || typeof message !== "object" || Array.isArray(message)) {
            failWithCleanup(new TypeError("LEAN_CHILD_PROTOCOL_INVALID"))
            return
          }
          const body = message as Record<string, unknown>
          if (body.kind === "ready" && body.capability === capability && exactKeys(body, ["kind", "capability"])) {
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

const main = async (): Promise<void> => {
  const selector = process.argv[2]
  if (selector === "--synthetic") { process.stdout.write(`${JSON.stringify(await syntheticLeanTerminal())}\n`); return }
  if (selector === LEAN_CHILD_SELECTOR) {
    const capability = process.env.LEAN_CHILD_CAPABILITY
    if (typeof process.send !== "function" || !/^[0-9a-f]{64}$/u.test(capability ?? "")) throw new TypeError("LEAN_CHILD_PARENT_REQUIRED")
    const checker = await import("./check-v1-38-lean-admission.js")
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    checker.loadAndCheckLeanChildInvocation(repoRoot, capability!)
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
    process.send({ kind: "ready", capability })
    return
  }
  if (selector === LEAN_LIVE_SELECTOR) {
    const checker = await import("./check-v1-38-lean-admission.js")
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const readiness = checker.loadAndCheckLeanReviewedReady(repoRoot)
    const capability = randomBytes(32).toString("hex")
    const invocation = checker.createLeanInvocation(readiness, hashLeanValue(capability))
    createExclusiveLeanInvocationMarker(path.resolve(repoRoot, checker.LEAN_ARTIFACT_PATHS.invocation), invocation)
    const terminal = await runLeanFeasibilityInjected(createSupervisedLeanExecutionDependencies(capability))
    checker.createExclusiveLeanTerminal(repoRoot, checker.createLeanTerminalArtifact(invocation, terminal))
    process.stdout.write(`${JSON.stringify(terminal)}\n`)
    return
  }
  throw new TypeError("LEAN_LIVE_SELECTOR_REQUIRES_PLAN_150_READINESS")
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "LEAN_RUNNER_FAILED"}\n`); process.exitCode = 1
})
export const LEAN_RUNNER_AUTHORITY = LEAN_AUTHORITY_FALSE
