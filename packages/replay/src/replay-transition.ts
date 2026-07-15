import { createHash } from "node:crypto"
import type {
  Chronicle,
  ChronicleBoundarySnapshot,
  ChronicleEvent,
  ChronicleValidationError,
  Direction,
  FullBoardSnapshot,
  JsonValue,
  MatchOutcome,
  Position,
  SoldierSnapshot,
} from "@cowards/spec"
import {
  MatchOutcomeSchema,
  classifyCanonicalCompatibilityTupleId,
  type CanonicalCompatibilityTupleLifecycle,
} from "@cowards/spec"
import { stableStringify } from "./hash.js"
import type { ChronicleRecorderExecution } from "./record.js"

const CURRENT_STATE_HASH_DOMAIN =
  "cowards-game:candidate-game-state-projection:v1" as const

const hashCurrentStateProjection = (
  projection: Readonly<Record<string, unknown>>,
): string =>
  `sha256:${createHash("sha256")
    .update(`${CURRENT_STATE_HASH_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(projection), "utf8")
    .digest("hex")}`
const V1_37_CURRENT_REPLAY_TRANSITION_EVENT_TYPES = new Set<string>([
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "ACTIVATION_SKIPPED",
  "ACTIVATION_ENDED",
  "CYCLE_STARTED",
  "CYCLE_ENDED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MOVE_ADVANCED",
  "MOVE_BLOCKED",
  "TURN_RESOLVED",
  "PUSH_RESOLVED",
  "PUSH_BLOCKED",
  "BACKSTAB_RESOLVED",
  "SOLDIER_STONED",
  "SOLDIER_FELL",
  "CONTRACTION_RESOLVED",
  "MATCH_ENDED",
  "RUNTIME_VIOLATION",
])

export const resolveReplayTransitionEventContract = (
  semanticTupleId: string,
  eventType: string,
): CanonicalCompatibilityTupleLifecycle =>
  V1_37_CURRENT_REPLAY_TRANSITION_EVENT_TYPES.has(eventType)
    ? classifyCanonicalCompatibilityTupleId(semanticTupleId)
    : "historical-or-unknown"

export interface ReplayState {
  board: FullBoardSnapshot
  outcome?: MatchOutcome | undefined
}

export type ReplayStateResult =
  | { ok: true; state: ReplayState }
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

export const cloneBoard = (board: FullBoardSnapshot): FullBoardSnapshot => ({
  bounds: { ...board.bounds },
  soldiers: board.soldiers.map((soldier) => ({
    ...soldier,
    position: soldier.position === null ? null : { ...soldier.position },
  })),
  terrainStones: board.terrainStones.map((position) => ({ ...position })),
})

export const stateFromSnapshot = (
  snapshot: ChronicleBoundarySnapshot,
): ReplayState => ({
  board: cloneBoard(snapshot.board),
  ...(snapshot.outcome === undefined ? {} : { outcome: snapshot.outcome }),
})

const isRecord = (value: unknown): value is Record<string, JsonValue> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const readString = (payload: JsonValue, key: string): string | undefined => {
  if (!isRecord(payload)) {
    return undefined
  }
  const value = payload[key]
  return typeof value === "string" ? value : undefined
}

const readBoolean = (payload: JsonValue, key: string): boolean | undefined => {
  if (!isRecord(payload)) {
    return undefined
  }
  const value = payload[key]
  return typeof value === "boolean" ? value : undefined
}

const readDirection = (
  payload: JsonValue,
  key: string,
): Direction | undefined => {
  const value = readString(payload, key)
  return value === "UP" ||
    value === "DOWN" ||
    value === "LEFT" ||
    value === "RIGHT"
    ? value
    : undefined
}

const readBounds = (
  payload: JsonValue,
): FullBoardSnapshot["bounds"] | undefined => {
  if (!isRecord(payload)) {
    return undefined
  }
  const bounds = payload.bounds
  if (!isRecord(bounds)) {
    return undefined
  }
  const { minX, maxX, minY, maxY } = bounds
  return typeof minX === "number" &&
    typeof maxX === "number" &&
    typeof minY === "number" &&
    typeof maxY === "number"
    ? { minX, maxX, minY, maxY }
    : undefined
}

const movePosition = (position: Position, direction: Direction): Position => {
  switch (direction) {
    case "UP":
      return { x: position.x, y: position.y - 1 }
    case "DOWN":
      return { x: position.x, y: position.y + 1 }
    case "LEFT":
      return { x: position.x - 1, y: position.y }
    case "RIGHT":
      return { x: position.x + 1, y: position.y }
  }
}

const directionBetween = (
  from: Position,
  to: Position,
): Direction | undefined => {
  if (to.x === from.x && to.y === from.y - 1) {
    return "UP"
  }
  if (to.x === from.x && to.y === from.y + 1) {
    return "DOWN"
  }
  if (to.x === from.x - 1 && to.y === from.y) {
    return "LEFT"
  }
  if (to.x === from.x + 1 && to.y === from.y) {
    return "RIGHT"
  }
  return undefined
}

const isWithinBounds = (
  position: Position,
  bounds: FullBoardSnapshot["bounds"],
): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

const findSoldier = (
  state: ReplayState,
  soldierId: string,
): SoldierSnapshot | undefined =>
  state.board.soldiers.find((soldier) => soldier.id === soldierId)

const updateSoldier = (
  state: ReplayState,
  soldierId: string,
  update: (soldier: SoldierSnapshot) => SoldierSnapshot,
): ReplayState => ({
  ...state,
  board: {
    ...state.board,
    soldiers: state.board.soldiers.map((soldier) =>
      soldier.id === soldierId ? update(soldier) : soldier,
    ),
  },
})

const unknownSoldierError = (
  event: ChronicleEvent,
  soldierId: string | undefined,
): ReplayStateResult => ({
  ok: false,
  errors: [
    error("SNAPSHOT_MISMATCH", `${event.type} references an unknown Soldier.`, {
      sequence: event.sequence,
      actual: soldierId ?? "missing",
    }),
  ],
})

export const applyReplayEvent = (
  state: ReplayState,
  event: ChronicleEvent,
): ReplayStateResult => {
  switch (event.type) {
    case "MOVE_ADVANCED": {
      const soldierId = readString(event.payload, "soldierId")
      const direction = readDirection(event.payload, "direction")
      const soldier =
        soldierId === undefined ? undefined : findSoldier(state, soldierId)
      if (
        !soldierId ||
        !direction ||
        soldier?.position === null ||
        soldier === undefined
      ) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "MOVE_ADVANCED payload cannot be applied.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (current) => ({
          ...current,
          position: movePosition(soldier.position!, direction),
          facing: direction,
          lastSuccessfulMoveDirection: direction,
        })),
      }
    }
    case "MOVE_BLOCKED":
    case "AWARENESS_GRID_OBSERVED":
    case "ACTION_EMITTED":
    case "STRATEGY_EVALUATED":
    case "ACTIVATION_STARTED":
    case "ACTIVATION_SKIPPED":
    case "ACTIVATION_ENDED":
    case "CYCLE_STARTED":
    case "CYCLE_ENDED":
    case "ROUND_STARTED":
    case "MATCH_STARTED":
    case "RUNTIME_VIOLATION":
    case "PUSH_ATTEMPTED":
      return { ok: true, state }
    case "TURN_RESOLVED": {
      const soldierId = readString(event.payload, "soldierId")
      const direction = readDirection(event.payload, "direction")
      const soldier =
        soldierId === undefined ? undefined : findSoldier(state, soldierId)
      if (!soldierId || !direction) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "TURN_RESOLVED payload cannot be applied.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      if (soldier === undefined) {
        return unknownSoldierError(event, soldierId)
      }
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (soldier) => ({
          ...soldier,
          facing: direction,
        })),
      }
    }
    case "PUSH_RESOLVED": {
      const soldierId = readString(event.payload, "soldierId")
      const targetSoldierId = readString(event.payload, "targetSoldierId")
      const pushedOffBoard =
        readBoolean(event.payload, "pushedOffBoard") ?? false
      const mover =
        soldierId === undefined ? undefined : findSoldier(state, soldierId)
      const target =
        targetSoldierId === undefined
          ? undefined
          : findSoldier(state, targetSoldierId)
      if (
        !targetSoldierId ||
        mover?.position === null ||
        mover === undefined ||
        target?.position === null ||
        target === undefined
      ) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "PUSH_RESOLVED payload cannot be applied.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      const direction = directionBetween(mover.position, target.position)
      if (!direction) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "PUSH_RESOLVED soldiers are not adjacent.",
              {
                sequence: event.sequence,
              },
            ),
          ],
        }
      }
      return {
        ok: true,
        state: updateSoldier(state, targetSoldierId, (soldier) =>
          pushedOffBoard
            ? { ...soldier, status: "FALLEN", position: null }
            : {
                ...soldier,
                position: movePosition(target.position!, direction),
              },
        ),
      }
    }
    case "PUSH_BLOCKED":
      return { ok: true, state }
    case "BACKSTAB_RESOLVED": {
      if (!isRecord(event.payload) || !Array.isArray(event.payload.pairs)) {
        return { ok: true, state }
      }
      const invalidPair = event.payload.pairs.find(
        (pair) =>
          !isRecord(pair) ||
          typeof pair.attackerId !== "string" ||
          typeof pair.victimId !== "string" ||
          findSoldier(state, pair.attackerId) === undefined ||
          findSoldier(state, pair.victimId) === undefined,
      )
      if (invalidPair !== undefined) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "BACKSTAB_RESOLVED references an unknown Soldier.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      const victimIds = event.payload.pairs.flatMap((pair) =>
        isRecord(pair) && typeof pair.victimId === "string"
          ? [pair.victimId]
          : [],
      )
      return {
        ok: true,
        state: victimIds.reduce(
          (currentState, victimId) =>
            updateSoldier(currentState, victimId, (soldier) => ({
              ...soldier,
              status: "STONE",
            })),
          state,
        ),
      }
    }
    case "SOLDIER_STONED": {
      const soldierId = readString(event.payload, "soldierId")
      const soldier =
        soldierId === undefined ? undefined : findSoldier(state, soldierId)
      if (!soldierId) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "SOLDIER_STONED payload cannot be applied.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      if (soldier === undefined) {
        return unknownSoldierError(event, soldierId)
      }
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (soldier) => ({
          ...soldier,
          status: "STONE",
        })),
      }
    }
    case "SOLDIER_FELL": {
      const soldierId = readString(event.payload, "soldierId")
      const soldier =
        soldierId === undefined ? undefined : findSoldier(state, soldierId)
      if (!soldierId) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "SOLDIER_FELL payload cannot be applied.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      if (soldier === undefined) {
        return unknownSoldierError(event, soldierId)
      }
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (soldier) => ({
          ...soldier,
          status: "FALLEN",
          position: null,
        })),
      }
    }
    case "CONTRACTION_RESOLVED": {
      const bounds = readBounds(event.payload)
      if (!bounds) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "CONTRACTION_RESOLVED payload cannot be applied.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      return {
        ok: true,
        state: {
          ...state,
          board: {
            ...state.board,
            bounds,
            soldiers: state.board.soldiers.map((soldier) =>
              soldier.status !== "FALLEN" &&
              soldier.position !== null &&
              !isWithinBounds(soldier.position, bounds)
                ? { ...soldier, status: "FALLEN", position: null }
                : soldier,
            ),
            terrainStones: state.board.terrainStones.filter((stone) =>
              isWithinBounds(stone, bounds),
            ),
          },
        },
      }
    }
    case "MATCH_ENDED": {
      const parsed = MatchOutcomeSchema.safeParse(event.payload)
      if (!parsed.success) {
        return {
          ok: false,
          errors: [
            error("SNAPSHOT_MISMATCH", "MATCH_ENDED payload is invalid.", {
              sequence: event.sequence,
            }),
          ],
        }
      }
      return {
        ok: true,
        state: {
          ...state,
          outcome: parsed.data as MatchOutcome,
        },
      }
    }
  }
}

export const compareReplayStateToSnapshot = (
  state: ReplayState,
  snapshot: ChronicleBoundarySnapshot,
): ChronicleValidationError[] => {
  const expected = stateFromSnapshot(snapshot)
  return stableStringify(state) === stableStringify(expected)
    ? []
    : [
        error(
          "SNAPSHOT_MISMATCH",
          "Reconstructed state did not match boundary snapshot.",
          {
            sequence: snapshot.sequence,
            expected: expected as unknown as JsonValue,
            actual: state as unknown as JsonValue,
          },
        ),
      ]
}

const orderedBoundarySnapshots = (
  chronicle: Chronicle,
): ChronicleBoundarySnapshot[] =>
  chronicle.snapshots
    .map((snapshot, index) => ({ snapshot, index }))
    .sort((left, right) =>
      left.snapshot.sequence === right.snapshot.sequence
        ? left.index - right.index
        : left.snapshot.sequence - right.snapshot.sequence,
    )
    .map(({ snapshot }) => snapshot)

export const validateChronicleTransitions = (
  chronicle: Chronicle,
): ChronicleValidationError[] => {
  const snapshots = orderedBoundarySnapshots(chronicle)
  const errors: ChronicleValidationError[] = []

  for (let index = 0; index < snapshots.length - 1; index += 1) {
    const start = snapshots[index]
    const end = snapshots[index + 1]
    if (start === undefined || end === undefined) {
      continue
    }
    if (end.sequence < start.sequence) {
      continue
    }

    let current = stateFromSnapshot(start)
    let segmentFailed = false
    for (
      let eventIndex = start.sequence + 1;
      eventIndex <= end.sequence;
      eventIndex += 1
    ) {
      const event = chronicle.events[eventIndex]
      if (event === undefined) {
        errors.push(
          error(
            "EVENT_ORDER_INVALID",
            "Replay event sequence does not exist.",
            {
              actual: eventIndex,
            },
          ),
        )
        segmentFailed = true
        continue
      }
      const result = applyReplayEvent(current, event)
      if (!result.ok) {
        errors.push(...result.errors)
        segmentFailed = true
        break
      }
      current = result.state
    }

    if (segmentFailed) {
      continue
    }
    errors.push(...compareReplayStateToSnapshot(current, end))
  }

  return errors
}

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
