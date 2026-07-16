import { createHash } from "node:crypto"
import type { GameState } from "@cowards/engine"
import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationError,
  MatchOutcome,
} from "@cowards/spec"
import {
  compareCurrentReplayTransitionV137,
  applyReplayEvent,
  compareReplayStateToSnapshot,
  stateFromSnapshot,
  type CurrentReplayTransitionField,
  type ReplayState,
  type ReplayStateResult,
} from "./replay-transition.js"
import {
  applyHistoricalV14Transition,
  type HistoricalV14ReplayState,
} from "./historical-v1-4-transition.js"
import { stableStringify } from "./hash.js"
import {
  createChronicleBoundaryAnchors,
  recordChronicleFromExecution,
  type ChronicleBoundaryAnchor,
  type ChronicleRecorderExecution,
  type RecordedCanonicalTransitionV137,
} from "./record.js"
import {
  replayStateFromCurrentProjection,
  validateCurrentTransitionPostconditions,
} from "./current-transition-postconditions.js"
import {
  type CurrentChronicleSemanticInput,
  type CurrentChronicleSemanticValidationResult,
  validateChronicle,
  validateCurrentChronicle,
  validateCurrentChronicleSemantics,
  validateHistoricalV14Chronicle,
} from "./validate.js"

export interface ReplayTimelineEntry {
  sequence: number
  event: ChronicleEvent
  state: ReplayState
}

export interface Replay {
  stateAt(sequence: number): ReplayStateResult
  iterateReplay(): IterableIterator<ReplayTimelineEntry>
}

export type CreateReplayResult =
  | { ok: true; replay: Replay }
  | { ok: false; errors: ChronicleValidationError[] }

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})

const nearestSnapshotAtOrBefore = (
  chronicle: Chronicle,
  sequence: number,
): ChronicleBoundarySnapshot | undefined =>
  [...chronicle.snapshots]
    .filter((snapshot) => snapshot.sequence <= sequence)
    .sort((left, right) => right.sequence - left.sequence)[0]

const snapshotAt = (
  chronicle: Chronicle,
  sequence: number,
): ChronicleBoundarySnapshot | undefined =>
  chronicle.snapshots.find((snapshot) => snapshot.sequence === sequence)

const createStateAt =
  (chronicle: Chronicle) =>
  (sequence: number): ReplayStateResult => {
    if (!Number.isInteger(sequence) || sequence < 0) {
      return {
        ok: false,
        errors: [
          error(
            "EVENT_ORDER_INVALID",
            "Replay sequence must be a nonnegative integer.",
            {
              actual: sequence,
            },
          ),
        ],
      }
    }
    const event = chronicle.events[sequence]
    if (!event) {
      return {
        ok: false,
        errors: [
          error("EVENT_ORDER_INVALID", "Replay sequence does not exist.", {
            actual: sequence,
          }),
        ],
      }
    }
    const startingSnapshot = nearestSnapshotAtOrBefore(chronicle, sequence)
    if (!startingSnapshot) {
      return {
        ok: false,
        errors: [
          error(
            "SNAPSHOT_MISSING",
            "No boundary snapshot exists before sequence.",
            {
              sequence,
            },
          ),
        ],
      }
    }
    let current = stateFromSnapshot(startingSnapshot)
    for (
      let eventIndex = startingSnapshot.sequence + 1;
      eventIndex <= sequence;
      eventIndex += 1
    ) {
      const eventToApply = chronicle.events[eventIndex]
      if (!eventToApply) {
        return {
          ok: false,
          errors: [
            error(
              "EVENT_ORDER_INVALID",
              "Replay event sequence does not exist.",
              {
                actual: eventIndex,
              },
            ),
          ],
        }
      }
      const result = applyReplayEvent(current, eventToApply)
      if (!result.ok) {
        return result
      }
      current = result.state
      const boundary = snapshotAt(chronicle, eventIndex)
      if (boundary) {
        const snapshotErrors = compareReplayStateToSnapshot(current, boundary)
        if (snapshotErrors.length > 0) {
          return { ok: false, errors: snapshotErrors }
        }
      }
    }
    return { ok: true, state: current }
  }

const createValidatedReplay = (chronicle: Chronicle): CreateReplayResult => {
  const stateAt = createStateAt(chronicle)
  return {
    ok: true,
    replay: {
      stateAt,
      *iterateReplay() {
        for (const event of chronicle.events) {
          const result = stateAt(event.sequence)
          if (!result.ok) {
            return
          }
          yield { sequence: event.sequence, event, state: result.state }
        }
      },
    },
  }
}

export const createReplay = (chronicle: Chronicle): CreateReplayResult => {
  const validation = validateChronicle(chronicle)
  return validation.ok ? createValidatedReplay(chronicle) : validation
}

export interface HistoricalV14ReplayInput {
  readonly profile: "historical-v1.4"
  readonly chronicle: Chronicle
}

const historicalStateFromSnapshot = (
  snapshot: ChronicleBoundarySnapshot,
): HistoricalV14ReplayState => ({
  board: globalThis.structuredClone(snapshot.board),
  ...(snapshot.outcome === undefined
    ? {}
    : { outcome: globalThis.structuredClone(snapshot.outcome) }),
})

const createHistoricalValidatedReplay = (
  chronicle: Chronicle,
): CreateReplayResult => {
  const stateAt = (sequence: number): ReplayStateResult => {
    if (!Number.isInteger(sequence) || sequence < 0) {
      return {
        ok: false,
        errors: [
          error(
            "EVENT_ORDER_INVALID",
            "Replay sequence must be a nonnegative integer.",
            { actual: sequence },
          ),
        ],
      }
    }
    if (chronicle.events[sequence] === undefined) {
      return {
        ok: false,
        errors: [
          error("EVENT_ORDER_INVALID", "Replay sequence does not exist.", {
            actual: sequence,
          }),
        ],
      }
    }
    const startingSnapshot = nearestSnapshotAtOrBefore(chronicle, sequence)
    if (startingSnapshot === undefined) {
      return {
        ok: false,
        errors: [
          error(
            "SNAPSHOT_MISSING",
            "No historical v1.4 boundary snapshot exists before sequence.",
            { sequence },
          ),
        ],
      }
    }
    let current = historicalStateFromSnapshot(startingSnapshot)
    for (
      let eventIndex = startingSnapshot.sequence + 1;
      eventIndex <= sequence;
      eventIndex += 1
    ) {
      const event = chronicle.events[eventIndex]
      if (event === undefined) {
        return {
          ok: false,
          errors: [
            error(
              "EVENT_ORDER_INVALID",
              "Historical v1.4 replay event sequence does not exist.",
              { actual: eventIndex },
            ),
          ],
        }
      }
      const applied = applyHistoricalV14Transition(current, event)
      if (!applied.ok) return { ok: false, errors: [...applied.errors] }
      current = applied.state
      const boundary = snapshotAt(chronicle, eventIndex)
      if (
        boundary !== undefined &&
        stableStringify(current) !==
          stableStringify(historicalStateFromSnapshot(boundary))
      ) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "Historical v1.4 reconstructed state did not match boundary snapshot.",
              { sequence: eventIndex },
            ),
          ],
        }
      }
    }
    return { ok: true, state: current }
  }
  return {
    ok: true,
    replay: {
      stateAt,
      *iterateReplay() {
        for (const event of chronicle.events) {
          const result = stateAt(event.sequence)
          if (!result.ok) return
          yield { sequence: event.sequence, event, state: result.state }
        }
      },
    },
  }
}

/** Frozen historical route; intentionally never dispatches through current. */
export const createHistoricalV14Replay = (
  input: HistoricalV14ReplayInput,
): CreateReplayResult => {
  const validation = validateHistoricalV14Chronicle(input.chronicle)
  if (!validation.ok) return validation
  const requiredSnapshotKinds = [
    "MATCH_START",
    "MATCH_END",
    "TERMINAL",
  ] as const
  const presentSnapshotKinds = new Set(
    input.chronicle.snapshots.map(({ kind }) => kind),
  )
  const snapshotErrors = requiredSnapshotKinds.flatMap((kind) =>
    presentSnapshotKinds.has(kind)
      ? []
      : [
          error(
            "SNAPSHOT_MISSING",
            `Historical v1.4 Chronicle is missing ${kind} snapshot.`,
            { expected: kind },
          ),
        ],
  )
  return snapshotErrors.length === 0
    ? createHistoricalValidatedReplay(input.chronicle)
    : { ok: false, errors: snapshotErrors }
}

const CURRENT_STATE_HASH_DOMAIN =
  "cowards-game:candidate-game-state-projection:v1" as const

const hashCurrentStateProjection = (
  projection: Readonly<Record<string, unknown>>,
): string =>
  `sha256:${createHash("sha256")
    .update(`${CURRENT_STATE_HASH_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(projection), "utf8")
    .digest("hex")}`

export type CurrentReplayReconstructionResult =
  | {
      readonly ok: true
      readonly terminalStateHash: string
      readonly transitionTraceRoot: string
      readonly transitionCount: number
      readonly outcome: MatchOutcome
    }
  | {
      readonly ok: false
      readonly code:
        | "CURRENT_RECONSTRUCTION_SHAPE_INVALID"
        | "CURRENT_SEMANTIC_ADMISSION_INVALID"
        | "CURRENT_TRANSITION_COUNT_MISMATCH"
        | "CURRENT_TRANSITION_FIELD_MISMATCH"
        | "CURRENT_TRANSITION_STATE_MISMATCH"
        | "CURRENT_TERMINAL_EVENT_INVALID"
        | "CURRENT_TERMINAL_STATE_MISMATCH"
        | "CURRENT_FINAL_STATE_MISMATCH"
        | "CURRENT_OUTCOME_MISMATCH"
        | "CURRENT_TRACE_ROOT_MISMATCH"
      readonly transitionIndex?: number | undefined
      readonly field?: CurrentReplayTransitionField | undefined
    }

export interface CurrentReplayReconstructionInput {
  readonly chronicle: Chronicle
  readonly execution: ChronicleRecorderExecution
  readonly boundaryAnchors?: readonly ChronicleBoundaryAnchor[] | undefined
  readonly recordedTransitions?:
    | readonly RecordedCanonicalTransitionV137[]
    | undefined
  readonly transitionTraceRoot?: string | undefined
  readonly recordedFinalState?: GameState | undefined
  readonly recordedOutcome?: MatchOutcome | undefined
}

const finalReplayState = (
  execution: Extract<ChronicleRecorderExecution, { kind: "completed" }>,
): ReplayState => ({
  board: {
    bounds: globalThis.structuredClone(
      execution.recorderMaterial.finalState.bounds,
    ),
    soldiers: execution.recorderMaterial.finalState.soldiers.map(
      ({
        id,
        ownerPlayerId,
        status,
        position,
        facing,
        lastSuccessfulMoveDirection,
      }) => ({
        id,
        ownerPlayerId,
        status,
        position: position === null ? null : { ...position },
        facing,
        lastSuccessfulMoveDirection,
      }),
    ),
    terrainStones: execution.recorderMaterial.finalState.terrainStones.map(
      (position) => ({ ...position }),
    ),
  },
  ...(execution.recorderMaterial.finalState.outcome === undefined
    ? {}
    : { outcome: execution.recorderMaterial.finalState.outcome }),
})

export const validateCurrentReplayReconstruction = (
  input: CurrentReplayReconstructionInput,
): CurrentReplayReconstructionResult => {
  const { chronicle, execution } = input
  if (execution.kind !== "completed" || execution.transitions.length === 0) {
    return { ok: false, code: "CURRENT_RECONSTRUCTION_SHAPE_INVALID" }
  }
  if (
    execution.recorderMaterial.boundaries.length !==
      execution.transitions.length ||
    stableStringify(execution.recorderMaterial.boundaries) !==
      stableStringify(execution.transitions)
  ) {
    return { ok: false, code: "CURRENT_RECONSTRUCTION_SHAPE_INVALID" }
  }
  const terminalEvents = chronicle.events.filter(
    ({ type }) => type === "MATCH_ENDED",
  )
  if (
    terminalEvents.length !== 1 ||
    chronicle.events.at(-1)?.type !== "MATCH_ENDED"
  ) {
    return { ok: false, code: "CURRENT_TERMINAL_EVENT_INVALID" }
  }

  for (let index = 0; index < execution.transitions.length; index += 1) {
    const transition = execution.transitions[index]!
    const previous = execution.transitions[index - 1]
    if (
      hashCurrentStateProjection(transition.beforeState) !==
        transition.beforeStateHash ||
      hashCurrentStateProjection(transition.afterState) !==
        transition.afterStateHash ||
      (previous !== undefined &&
        (previous.afterStateHash !== transition.beforeStateHash ||
          stableStringify(previous.afterState) !==
            stableStringify(transition.beforeState)))
    ) {
      return {
        ok: false,
        code: "CURRENT_TRANSITION_STATE_MISMATCH",
        transitionIndex: index,
      }
    }
  }

  const boundaryAnchors =
    input.boundaryAnchors ?? createChronicleBoundaryAnchors(execution)
  const semanticAdmission = validateCurrentChronicleSemantics({
    profile: "current-exact",
    compatibility: {
      tupleId: execution.transitions[0]!.semanticTupleId,
      tuple: execution.transitions[0]!.semanticTuple,
    },
    chronicle,
    boundaryAnchors,
    execution,
  })
  if (!semanticAdmission.ok) {
    return { ok: false, code: "CURRENT_SEMANTIC_ADMISSION_INVALID" }
  }

  const reconstructedRecording = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: execution.transitions[0]!.semanticTupleId,
      semanticTuple: execution.transitions[0]!.semanticTuple,
    },
  })
  if (!reconstructedRecording.ok) {
    return { ok: false, code: "CURRENT_RECONSTRUCTION_SHAPE_INVALID" }
  }
  const recordedTransitions =
    input.recordedTransitions ?? reconstructedRecording.recordedTransitions
  if (
    recordedTransitions.length !==
    reconstructedRecording.recordedTransitions.length
  ) {
    return {
      ok: false,
      code: "CURRENT_TRANSITION_COUNT_MISMATCH",
      transitionIndex: Math.min(
        recordedTransitions.length,
        reconstructedRecording.recordedTransitions.length,
      ),
    }
  }
  for (let index = 0; index < recordedTransitions.length; index += 1) {
    const comparison = compareCurrentReplayTransitionV137(
      recordedTransitions[index]!,
      reconstructedRecording.recordedTransitions[index]!,
      index,
    )
    if (!comparison.ok) return comparison
  }

  const transitionPostconditions = validateCurrentTransitionPostconditions({
    transitions: execution.transitions,
    finalOutcome: execution.recorderMaterial.finalState.outcome,
  })
  if (!transitionPostconditions.ok) {
    return transitionPostconditions
  }

  const last = execution.transitions.at(-1)!
  const finalState = finalReplayState(execution)
  const projectedFinal = replayStateFromCurrentProjection(last.afterState)
  const terminalSnapshot = chronicle.snapshots.at(-1)
  const outcome = execution.recorderMaterial.finalState.outcome
  const recordedFinalState =
    input.recordedFinalState ?? reconstructedRecording.finalState
  if (
    stableStringify(recordedFinalState) !==
    stableStringify(reconstructedRecording.finalState)
  ) {
    return { ok: false, code: "CURRENT_FINAL_STATE_MISMATCH" }
  }
  const recordedOutcome = input.recordedOutcome ?? outcome
  if (stableStringify(recordedOutcome) !== stableStringify(outcome)) {
    return { ok: false, code: "CURRENT_OUTCOME_MISMATCH" }
  }
  if (
    outcome === undefined ||
    projectedFinal === undefined ||
    stableStringify(projectedFinal) !== stableStringify(finalState) ||
    terminalSnapshot?.kind !== "TERMINAL" ||
    stableStringify(stateFromSnapshot(terminalSnapshot)) !==
      stableStringify(finalState) ||
    stableStringify(terminalEvents[0]!.payload) !== stableStringify(outcome)
  ) {
    return { ok: false, code: "CURRENT_TERMINAL_STATE_MISMATCH" }
  }
  const transitionTraceRoot =
    input.transitionTraceRoot ?? reconstructedRecording.transitionTraceRoot
  if (transitionTraceRoot !== reconstructedRecording.transitionTraceRoot) {
    return { ok: false, code: "CURRENT_TRACE_ROOT_MISMATCH" }
  }
  return {
    ok: true,
    terminalStateHash: last.afterStateHash,
    transitionTraceRoot,
    transitionCount: recordedTransitions.length,
    outcome,
  }
}

export type CreateCurrentReplayResult =
  | { readonly ok: true; readonly replay: Replay }
  | Exclude<CurrentChronicleSemanticValidationResult, { ok: true }>

export const createCurrentReplay = (
  input: CurrentChronicleSemanticInput,
): CreateCurrentReplayResult => {
  const validation = validateCurrentChronicle(input)
  if (!validation.ok) return validation
  return createValidatedReplay(
    input.chronicle as Chronicle,
  ) as CreateCurrentReplayResult
}
