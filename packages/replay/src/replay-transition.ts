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
import { MatchOutcomeSchema } from "@cowards/spec"
import { stableStringify } from "./hash.js"

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
