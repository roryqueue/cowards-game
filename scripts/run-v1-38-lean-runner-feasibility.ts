/* eslint-disable no-restricted-imports -- private lab runner binds reviewed fixture seams. */
import { spawn, type ChildProcess } from "node:child_process"
import { closeSync, constants, fsyncSync, openSync, writeSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  CANONICAL_ARENA_CATALOG_V1_37, CANONICAL_COMPATIBILITY_TUPLES,
  CURRENT_SEMANTIC_RUNTIME_ABI_VERSION, DEFAULT_RUNTIME_LIMITS,
  RUNTIME_EXECUTION_SERVICE_VERSION, RuntimeExecutionServiceRequestSchema,
  createSetScenarioV137, type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
} from "@cowards/spec"
import { buildStarterStrategyRevision, findStarterStrategy } from "../packages/persistence/src/starter-strategies.js"
import { buildAdvancedStrategyRevision, findAdvancedStrategy } from "../packages/persistence/src/advanced-strategies.js"
import { executeCurrentMatchServiceTestSupport } from "../apps/runtime-service/src/runtime-execution-current-match.test-support.js"
import { createFixtureRuntimeExecutionAuthorityContext } from "../apps/runtime-service/src/runtime-execution-evidence.test-support.js"
import { createRuntimeServiceConfig } from "../apps/runtime-service/src/runtime-config.js"
import {
  LEAN_AUTHORITY_FALSE, LEAN_DEADLINE_MS, buildLeanSchedule,
  currentFormationIsRealistic, hashLeanValue, reduceLeanExecutions,
  type LeanCell, type LeanExecutionClassification, type LeanExecutionRecord,
  type LeanTerminal,
} from "./lib/v1-38-lean-runner-feasibility.js"

export const LEAN_LIVE_SELECTOR = "--run-reviewed-live-gate" as const
export const LEAN_CHILD_SELECTOR = "--execute-reviewed-cell" as const
export const LEAN_CELL_DEADLINE_MS = 30_000
export const LEAN_CLEANUP_DEADLINE_MS = 2_000

export interface LeanExecutionResult {
  readonly classification: LeanExecutionClassification
  readonly cleanupComplete: boolean
  readonly orphanedChild: boolean
  readonly boardRealism: boolean
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

const unlaunched = (cell: LeanCell): LeanExecutionRecord => ({
  ...cell, classification: "unlaunched", cleanupComplete: true,
  orphanedChild: false, boardRealism: currentFormationIsRealistic(cell),
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
            boardRealism: currentFormationIsRealistic(cell),
          })),
        ])
        records.push({ ...cell, ...execution })
        if (deadlineReached || !execution.cleanupComplete || execution.orphanedChild) { stopLaunching = true; break }
      } catch {
        records.push({
          ...cell, classification: controller.signal.aborted ? "cancelled" : "system_failure",
          cleanupComplete: false, orphanedChild: true, boardRealism: currentFormationIsRealistic(cell),
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
const requestContext = (cell: LeanCell) => {
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
  const request = RuntimeExecutionServiceRequestSchema.parse({
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
  return { request, authorityLoader: authority.authorityLoader }
}
export const buildCanonicalLeanRequest = (cell: LeanCell): RuntimeExecutionServiceRequest => requestContext(cell).request

export const projectLeanPrivateRuntimeResponse = (response: RuntimeExecutionServiceResponse): Omit<LeanExecutionResult, "cleanupComplete" | "orphanedChild" | "boardRealism"> => {
  if (!response.ok || response.result.finalState.outcome === undefined) return { classification: "system_failure" }
  return {
    classification: response.result.runtimeViolationEventCount === 0 ? "success" : "player_violation",
    outcomeRoot: hashLeanValue(response.result.finalState.outcome),
    finalStateRoot: hashLeanValue(response.result.finalState),
    transitionEventRoot: hashLeanValue(response.result.chronicle),
    runtimeAccountingRoot: hashLeanValue({
      runtimeAbiVersion: response.runtimeAbiVersion,
      runtimeViolationEventCount: response.result.runtimeViolationEventCount,
    }),
  }
}
const executeReviewedCellInChild = (cell: LeanCell): LeanExecutionResult => {
  const { request, authorityLoader } = requestContext(cell)
  const response = executeCurrentMatchServiceTestSupport(request, createRuntimeServiceConfig({
    strategyExecutionAdapter: "worker-thread", semanticReceiptSecret: "fixture-only:v1.38-lean-runner",
  }), { authorityLoader })
  return { ...projectLeanPrivateRuntimeResponse(response), cleanupComplete: true, orphanedChild: false, boardRealism: currentFormationIsRealistic(cell) }
}
const encodeCell = (cell: LeanCell): string => Buffer.from(JSON.stringify(cell), "utf8").toString("base64url")
const decodeCell = (value: string): LeanCell => {
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as LeanCell
  const expected = buildLeanSchedule().find(({ cellId }) => cellId === parsed.cellId)
  if (expected === undefined || JSON.stringify(parsed) !== JSON.stringify(expected)) throw new TypeError("LEAN_CHILD_CELL_INVALID")
  return expected
}

export const createSupervisedLeanExecutionDependencies = (): LeanExecutionDependencies => {
  let active: ChildProcess | undefined
  const terminateActive = async (): Promise<LeanCleanupResult> => {
    const child = active
    if (child === undefined || child.exitCode !== null || child.signalCode !== null) { active = undefined; return { cleanupComplete: true, orphanedChild: false } }
    if (child.pid !== undefined) { try { process.kill(-child.pid, "SIGKILL") } catch { child.kill("SIGKILL") } } else child.kill("SIGKILL")
    await new Promise<void>((resolve) => child.once("exit", () => resolve()))
    active = undefined
    return { cleanupComplete: true, orphanedChild: false }
  }
  return {
    now: () => performance.now(), terminateActive,
    execute: async (cell, signal) => {
      if (active !== undefined) throw new TypeError("LEAN_CHILD_ALREADY_ACTIVE")
      const child = spawn(process.execPath, ["--import", "tsx", fileURLToPath(import.meta.url), LEAN_CHILD_SELECTOR, encodeCell(cell)], {
        cwd: process.cwd(), detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
      })
      active = child
      let stdout = ""; let stderr = ""
      child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString("utf8") })
      child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8") })
      return await new Promise<LeanExecutionResult>((resolve, reject) => {
        const finish = (result: LeanExecutionResult): void => { active = undefined; resolve(result) }
        const timer = setTimeout(() => { void terminateActive().then(() => finish({ classification: "timeout", cleanupComplete: true, orphanedChild: false, boardRealism: currentFormationIsRealistic(cell) })) }, LEAN_CELL_DEADLINE_MS)
        timer.unref()
        const abort = () => { void terminateActive().then(() => finish({ classification: "cancelled", cleanupComplete: true, orphanedChild: false, boardRealism: currentFormationIsRealistic(cell) })) }
        signal.addEventListener("abort", abort, { once: true })
        child.once("error", reject)
        child.once("exit", (code) => {
          clearTimeout(timer); signal.removeEventListener("abort", abort); active = undefined
          if (code !== 0) return reject(new TypeError(stderr.trim() || "LEAN_CHILD_FAILED"))
          try { resolve(JSON.parse(stdout) as LeanExecutionResult) } catch { reject(new TypeError("LEAN_CHILD_OUTPUT_INVALID")) }
        })
      })
    },
  }
}

export const syntheticLeanTerminal = async (): Promise<LeanTerminal> => runLeanFeasibilityInjected({
  now: () => 0, terminateActive: async () => ({ cleanupComplete: true, orphanedChild: false }),
  execute: async (cell) => ({
    classification: "success", cleanupComplete: true, orphanedChild: false,
    boardRealism: currentFormationIsRealistic(cell),
    outcomeRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "outcome" }),
    finalStateRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "state" }),
    transitionEventRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "events" }),
    runtimeAccountingRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "accounting" }),
  }),
})

const main = async (): Promise<void> => {
  const selector = process.argv[2]
  if (selector === "--synthetic") { process.stdout.write(`${JSON.stringify(await syntheticLeanTerminal())}\n`); return }
  if (selector === LEAN_CHILD_SELECTOR) { process.stdout.write(`${JSON.stringify(executeReviewedCellInChild(decodeCell(process.argv[3] ?? "")))}\n`); return }
  if (selector === LEAN_LIVE_SELECTOR) {
    const checker = await import("./check-v1-38-lean-admission.js")
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const readiness = checker.loadAndCheckLeanReviewedReady(repoRoot)
    createExclusiveLeanInvocationMarker(path.resolve(repoRoot, checker.LEAN_ARTIFACT_PATHS.invocation), {
      schemaVersion: "v1.38-lean-runner-invocation-v1", sourceCommit: readiness.sourceCommit,
      liveInvocationOrdinal: 1, authority: LEAN_AUTHORITY_FALSE,
    })
    const terminal = await runLeanFeasibilityInjected(createSupervisedLeanExecutionDependencies())
    checker.createExclusiveLeanTerminal(repoRoot, terminal)
    process.stdout.write(`${JSON.stringify(terminal)}\n`)
    return
  }
  throw new TypeError("LEAN_LIVE_SELECTOR_REQUIRES_PLAN_150_READINESS")
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "LEAN_RUNNER_FAILED"}\n`); process.exitCode = 1
})
export const LEAN_RUNNER_AUTHORITY = LEAN_AUTHORITY_FALSE
