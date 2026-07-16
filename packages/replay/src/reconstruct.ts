import { createHash } from "node:crypto"
import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationError,
  FullBoardSnapshot,
  MatchOutcome,
} from "@cowards/spec"
import {
  applyReplayEvent,
  compareReplayStateToSnapshot,
  stateFromSnapshot,
  type ReplayState,
  type ReplayStateResult,
} from "./replay-transition.js"
import { stableStringify } from "./hash.js"
import {
  createChronicleBoundaryAnchors,
  type ChronicleRecorderExecution,
} from "./record.js"
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
    ? createValidatedReplay(input.chronicle)
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
      readonly outcome: MatchOutcome
    }
  | {
      readonly ok: false
      readonly code:
        | "CURRENT_RECONSTRUCTION_SHAPE_INVALID"
        | "CURRENT_SEMANTIC_ADMISSION_INVALID"
        | "CURRENT_TRANSITION_STATE_MISMATCH"
        | "CURRENT_TERMINAL_EVENT_INVALID"
        | "CURRENT_TERMINAL_STATE_MISMATCH"
      readonly transitionIndex?: number | undefined
    }

export interface CurrentReplayReconstructionInput {
  readonly chronicle: Chronicle
  readonly execution: ChronicleRecorderExecution
}

const replayStateFromProjection = (
  projection: Readonly<Record<string, unknown>>,
): ReplayState | undefined => {
  if (
    !projection.bounds ||
    !Array.isArray(projection.soldiers) ||
    !Array.isArray(projection.terrainStones)
  ) {
    return undefined
  }
  return {
    board: globalThis.structuredClone({
      bounds: projection.bounds,
      soldiers: projection.soldiers,
      terrainStones: projection.terrainStones,
    }) as FullBoardSnapshot,
    ...(projection.outcome === null || projection.outcome === undefined
      ? {}
      : {
          outcome: globalThis.structuredClone(
            projection.outcome,
          ) as MatchOutcome,
        }),
  }
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

export const validateCurrentReplayReconstruction = ({
  chronicle,
  execution,
}: CurrentReplayReconstructionInput): CurrentReplayReconstructionResult => {
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

  const semanticAdmission = validateCurrentChronicleSemantics({
    profile: "current-exact",
    compatibility: {
      tupleId: execution.transitions[0]!.semanticTupleId,
      tuple: execution.transitions[0]!.semanticTuple,
    },
    chronicle,
    boundaryAnchors: createChronicleBoundaryAnchors(execution),
    execution,
  })
  if (!semanticAdmission.ok) {
    return { ok: false, code: "CURRENT_SEMANTIC_ADMISSION_INVALID" }
  }

  for (let index = 0; index < execution.transitions.length; index += 1) {
    const transition = execution.transitions[index]!
    const before = replayStateFromProjection(transition.beforeState)
    const expectedAfter = replayStateFromProjection(transition.afterState)
    if (before === undefined || expectedAfter === undefined) {
      return {
        ok: false,
        code: "CURRENT_RECONSTRUCTION_SHAPE_INVALID",
        transitionIndex: index,
      }
    }
    let reconstructed = before
    for (const summary of transition.events) {
      const applied = applyReplayEvent(reconstructed, {
        type: summary.type,
        sequence: summary.sequence,
        context: summary.context ?? {},
        privacy: summary.privacy ?? "public",
        payload: summary.payload,
      })
      if (!applied.ok) {
        return {
          ok: false,
          code: "CURRENT_TRANSITION_STATE_MISMATCH",
          transitionIndex: index,
        }
      }
      reconstructed = applied.state
    }
    if (stableStringify(reconstructed) !== stableStringify(expectedAfter)) {
      return {
        ok: false,
        code: "CURRENT_TRANSITION_STATE_MISMATCH",
        transitionIndex: index,
      }
    }
  }

  const last = execution.transitions.at(-1)!
  const finalState = finalReplayState(execution)
  const projectedFinal = replayStateFromProjection(last.afterState)
  const terminalSnapshot = chronicle.snapshots.at(-1)
  const outcome = execution.recorderMaterial.finalState.outcome
  if (
    outcome === undefined ||
    projectedFinal === undefined ||
    stableStringify(projectedFinal) !== stableStringify(finalState) ||
    terminalSnapshot?.kind !== "TERMINAL" ||
    stableStringify(stateFromSnapshot(terminalSnapshot)) !==
      stableStringify(finalState) ||
    stableStringify(terminalEvents[0]!.payload) !== stableStringify(outcome) ||
    stableStringify(last.terminalStatus) !== stableStringify(outcome)
  ) {
    return { ok: false, code: "CURRENT_TERMINAL_STATE_MISMATCH" }
  }
  return {
    ok: true,
    terminalStateHash: last.afterStateHash,
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
