/* eslint-disable no-restricted-imports -- the private live selector must bind the selected supervised runtime implementation directly. */
import { closeSync, constants, fsyncSync, openSync, writeSync } from "node:fs"
import { pathToFileURL } from "node:url"
import {
  executePreparedRuntimeServiceRequestV118,
  type PreparedRuntimeServiceDependenciesV118,
} from "../apps/runtime-service/src/execute-match.js"
import type { RuntimeExecutionServiceRequestV118 } from "@cowards/spec"
import {
  LEAN_AUTHORITY_FALSE,
  LEAN_DEADLINE_MS,
  buildLeanSchedule,
  currentFormationIsRealistic,
  hashLeanValue,
  reduceLeanExecutions,
  type LeanCell,
  type LeanExecutionClassification,
  type LeanExecutionRecord,
  type LeanTerminal,
} from "./lib/v1-38-lean-runner-feasibility.js"

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

export interface LeanExecutionDependencies {
  readonly now: () => number
  readonly execute: (cell: LeanCell, signal: AbortSignal) => Promise<LeanExecutionResult>
  readonly onAbort?: () => void
  readonly awaitCleanup?: (signal: AbortSignal) => Promise<{ cleanupComplete: boolean; orphanedChild: boolean }>
  readonly deadlineMilliseconds?: number
  readonly armDeadline?: (onDeadline: () => void, milliseconds: number) => () => void
}

const unlaunched = (cell: LeanCell): LeanExecutionRecord => ({
  ...cell,
  classification: "unlaunched",
  cleanupComplete: true,
  orphanedChild: false,
  boardRealism: currentFormationIsRealistic(cell),
})

export const runLeanFeasibilityInjected = async (
  dependencies: LeanExecutionDependencies,
): Promise<LeanTerminal> => {
  const schedule = buildLeanSchedule()
  const records: LeanExecutionRecord[] = []
  const controller = new AbortController()
  const started = dependencies.now()
  const deadline = dependencies.deadlineMilliseconds ?? LEAN_DEADLINE_MS
  let deadlineReached = false
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
    const timer = setTimeout(onDeadline, milliseconds)
    timer.unref()
    return () => clearTimeout(timer)
  })
  const cancelDeadline = armDeadline(abortOnce, deadline)
  for (const cell of schedule) {
    if (dependencies.now() - started >= deadline) {
      abortOnce()
      break
    }
    try {
      const execution = await Promise.race([
        dependencies.execute(cell, controller.signal),
        deadlinePromise.then((): LeanExecutionResult => ({
          classification: "cancelled", cleanupComplete: false,
          orphanedChild: true, boardRealism: currentFormationIsRealistic(cell),
        })),
      ])
      records.push({ ...cell, ...execution })
      if (deadlineReached) break
    } catch {
      records.push({
        ...cell,
        classification: controller.signal.aborted ? "cancelled" : "system_failure",
        cleanupComplete: false,
        orphanedChild: true,
        boardRealism: currentFormationIsRealistic(cell),
      })
    }
  }
  cancelDeadline()
  if (deadlineReached && dependencies.awaitCleanup) {
    const cleanup = await dependencies.awaitCleanup(controller.signal)
    const last = records.at(-1)
    if (last?.classification === "cancelled") {
      records[records.length - 1] = { ...last, ...cleanup }
    }
  }
  for (const cell of schedule.slice(records.length)) records.push(unlaunched(cell))
  return reduceLeanExecutions(records)
}

export const createExclusiveLeanInvocationMarker = (
  markerPath: string,
  marker: Readonly<Record<string, unknown>>,
): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(
      markerPath,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        (constants.O_NOFOLLOW ?? 0),
      0o600,
    )
    const bytes = Buffer.from(`${JSON.stringify(marker)}\n`, "utf8")
    let offset = 0
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset)
    fsyncSync(descriptor)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    throw new TypeError(code === "EEXIST" ? "LEAN_INVOCATION_EXISTS" : "LEAN_INVOCATION_CREATE_FAILED")
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

type PreparedResponse = {
  readonly ok?: boolean
  readonly result?: {
    readonly outcome?: unknown
    readonly finalState?: unknown
    readonly chronicle?: unknown
    readonly ledgerPoststateRoot?: unknown
    readonly runtimeViolationEventCount?: number
  }
}

/**
 * Adapts the selected v1.18 service function without evaluating Strategy source
 * in this process. Construction of its real dependencies belongs exclusively
 * to the Plan 151 live selector after Plan 150 readiness.
 */
export const createPreparedLeanExecutor = (input: {
  readonly requestForCell: (cell: LeanCell) => RuntimeExecutionServiceRequestV118
  readonly dependencies: PreparedRuntimeServiceDependenciesV118
}): LeanExecutionDependencies["execute"] => async (cell, signal) => {
  if (signal.aborted) {
    return { classification: "cancelled", cleanupComplete: true, orphanedChild: false, boardRealism: currentFormationIsRealistic(cell) }
  }
  const response = executePreparedRuntimeServiceRequestV118(
    input.requestForCell(cell),
    input.dependencies,
  ) as PreparedResponse
  if (!response.ok || response.result === undefined) {
    return { classification: "system_failure", cleanupComplete: true, orphanedChild: false, boardRealism: currentFormationIsRealistic(cell) }
  }
  const result = response.result
  return {
    classification: result.runtimeViolationEventCount === 0 ? "success" : "player_violation",
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: currentFormationIsRealistic(cell),
    outcomeRoot: hashLeanValue(normalizeLeanSemantic(result.outcome)),
    finalStateRoot: hashLeanValue(normalizeLeanSemantic(result.finalState)),
    transitionEventRoot: hashLeanValue(normalizeLeanSemantic(result.chronicle)),
    runtimeAccountingRoot: hashLeanValue(normalizeLeanSemantic({ ledgerPoststateRoot: result.ledgerPoststateRoot, runtimeViolationEventCount: result.runtimeViolationEventCount })),
  }
}

export const syntheticLeanTerminal = async (): Promise<LeanTerminal> =>
  runLeanFeasibilityInjected({
    now: () => 0,
    execute: async (cell) => ({
      classification: "success",
      cleanupComplete: true,
      orphanedChild: false,
      boardRealism: currentFormationIsRealistic(cell),
      outcomeRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "outcome" }),
      finalStateRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "state" }),
      transitionEventRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "events" }),
      runtimeAccountingRoot: hashLeanValue({ cell: cell.baseCellId, semantic: "accounting" }),
    }),
  })

const main = async (): Promise<void> => {
  const selector = process.argv[2]
  if (selector !== "--synthetic") {
    throw new TypeError("LEAN_LIVE_SELECTOR_REQUIRES_PLAN_150_READINESS")
  }
  process.stdout.write(`${JSON.stringify(await syntheticLeanTerminal())}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "LEAN_RUNNER_FAILED"}\n`)
    process.exitCode = 1
  })
}

export const LEAN_RUNNER_AUTHORITY = LEAN_AUTHORITY_FALSE

const UNSTABLE_KEYS = new Set(["requestId", "matchId", "invocationId", "startedAt", "completedAt", "recordedAt", "wallClockMilliseconds"])
export const normalizeLeanSemantic = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeLeanSemantic)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !UNSTABLE_KEYS.has(key))
      .map(([key, child]) => [key, normalizeLeanSemantic(child)]))
  }
  if (typeof value === "string") {
    return value.replaceAll(":pass:a", ":pass:*").replaceAll(":pass:b", ":pass:*")
  }
  return value
}
