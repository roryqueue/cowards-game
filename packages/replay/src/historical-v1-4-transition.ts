import { createHash } from "node:crypto"
import type {
  ChronicleEvent,
  ChronicleValidationError,
  Direction,
  FullBoardSnapshot,
  JsonValue,
  MatchOutcome,
  Position,
  SoldierSnapshot,
} from "@cowards/spec"

export interface HistoricalV14ReplayState {
  readonly board: FullBoardSnapshot
  readonly outcome?: MatchOutcome | undefined
}

export type HistoricalV14TransitionResult =
  | { readonly ok: true; readonly state: HistoricalV14ReplayState }
  | {
      readonly ok: false
      readonly errors: readonly ChronicleValidationError[]
    }

export type HistoricalV14InterpretationResult =
  | {
      readonly ok: true
      readonly state: HistoricalV14ReplayState
      readonly interpretationRoot: string
    }
  | {
      readonly ok: false
      readonly errors: readonly ChronicleValidationError[]
    }

const INTERPRETATION_DOMAIN =
  "cowards-game:historical-v1.4-interpretation:v1" as const

const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({
  code,
  message,
  ...details,
})

const cloneBoard = (board: FullBoardSnapshot): FullBoardSnapshot => ({
  bounds: { ...board.bounds },
  soldiers: board.soldiers.map((soldier) => ({
    ...soldier,
    position: soldier.position === null ? null : { ...soldier.position },
  })),
  terrainStones: board.terrainStones.map((position) => ({ ...position })),
})

const cloneState = (
  state: HistoricalV14ReplayState,
): HistoricalV14ReplayState => ({
  board: cloneBoard(state.board),
  ...(state.outcome === undefined
    ? {}
    : { outcome: globalThis.structuredClone(state.outcome) }),
})

const isRecord = (value: unknown): value is Record<string, JsonValue> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const readString = (payload: JsonValue, key: string): string | undefined => {
  if (!isRecord(payload)) return undefined
  const value = payload[key]
  return typeof value === "string" ? value : undefined
}

const readBoolean = (payload: JsonValue, key: string): boolean | undefined => {
  if (!isRecord(payload)) return undefined
  const value = payload[key]
  return typeof value === "boolean" ? value : undefined
}

const readHistoricalV14MatchOutcome = (
  payload: JsonValue,
): MatchOutcome | undefined => {
  if (!isRecord(payload)) return undefined
  if (payload.type === "DRAW") return { type: "DRAW" }
  if (
    payload.type === "WIN" &&
    typeof payload.winnerPlayerId === "string" &&
    payload.winnerPlayerId.length > 0
  ) {
    return { type: "WIN", winnerPlayerId: payload.winnerPlayerId }
  }
  if (
    payload.type === "FAILED" &&
    typeof payload.reason === "string" &&
    payload.reason.length > 0
  ) {
    return { type: "FAILED", reason: payload.reason }
  }
  return undefined
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
  if (!isRecord(payload) || !isRecord(payload.bounds)) return undefined
  const { minX, maxX, minY, maxY } = payload.bounds
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
  if (to.x === from.x && to.y === from.y - 1) return "UP"
  if (to.x === from.x && to.y === from.y + 1) return "DOWN"
  if (to.x === from.x - 1 && to.y === from.y) return "LEFT"
  if (to.x === from.x + 1 && to.y === from.y) return "RIGHT"
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
  state: HistoricalV14ReplayState,
  soldierId: string,
): SoldierSnapshot | undefined =>
  state.board.soldiers.find((soldier) => soldier.id === soldierId)

const updateSoldier = (
  state: HistoricalV14ReplayState,
  soldierId: string,
  update: (soldier: SoldierSnapshot) => SoldierSnapshot,
): HistoricalV14ReplayState => ({
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
): HistoricalV14TransitionResult => ({
  ok: false,
  errors: [
    error("SNAPSHOT_MISMATCH", `${event.type} references an unknown Soldier.`, {
      sequence: event.sequence,
      actual: soldierId ?? "missing",
    }),
  ],
})

export const applyHistoricalV14Transition = (
  state: HistoricalV14ReplayState,
  event: ChronicleEvent,
): HistoricalV14TransitionResult => {
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
      if (soldier === undefined) return unknownSoldierError(event, soldierId)
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (current) => ({
          ...current,
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
      if (direction === undefined) {
        return {
          ok: false,
          errors: [
            error(
              "SNAPSHOT_MISMATCH",
              "PUSH_RESOLVED soldiers are not adjacent.",
              { sequence: event.sequence },
            ),
          ],
        }
      }
      return {
        ok: true,
        state: updateSoldier(state, targetSoldierId, (current) =>
          pushedOffBoard
            ? { ...current, status: "FALLEN", position: null }
            : {
                ...current,
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
      if (soldier === undefined) return unknownSoldierError(event, soldierId)
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (current) => ({
          ...current,
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
      if (soldier === undefined) return unknownSoldierError(event, soldierId)
      return {
        ok: true,
        state: updateSoldier(state, soldierId, (current) => ({
          ...current,
          status: "FALLEN",
          position: null,
        })),
      }
    }
    case "CONTRACTION_RESOLVED": {
      const bounds = readBounds(event.payload)
      if (bounds === undefined) {
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
      const outcome = readHistoricalV14MatchOutcome(event.payload)
      if (outcome === undefined) {
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
          outcome,
        },
      }
    }
  }
}

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

const hash = (...parts: readonly string[]): string =>
  `sha256:${createHash("sha256")
    .update(`${INTERPRETATION_DOMAIN}\0`, "utf8")
    .update(parts.join("\0"), "utf8")
    .digest("hex")}`

export const interpretHistoricalV14Transitions = (input: {
  readonly initialState: HistoricalV14ReplayState
  readonly events: readonly ChronicleEvent[]
}): HistoricalV14InterpretationResult => {
  let state = cloneState(input.initialState)
  let root = hash("root")
  for (const event of input.events) {
    const before = cloneState(state)
    const applied = applyHistoricalV14Transition(state, event)
    if (!applied.ok) return applied
    state = applied.state
    root = hash(
      root,
      JSON.stringify(
        canonicalize({
          sequence: event.sequence,
          type: event.type,
          context: event.context,
          privacy: event.privacy,
          payload: event.payload,
          before,
          after: state,
        }),
      ),
    )
  }
  return {
    ok: true,
    state: cloneState(state),
    interpretationRoot: root,
  }
}
