import type {
  Direction,
  FullBoardSnapshot,
  Position,
  SoldierSnapshot,
  SoldierStatus,
} from "@cowards/spec"
import type { ReplayReadyDto, ReplayTimelineEntryDto } from "../../types.js"

export const ReplayBoardColors = {
  ownerBottom: "#256d85",
  ownerTop: "#b65a3a",
  stone: "#7d8580",
  terrain: "#46514c",
  warning: "#9a6b12",
  destructive: "#b42318",
  backstab: "#d1403f",
  push: "#b8872c",
  fall: "#6e5acb",
  boardLine: "#c9d1c5",
  selected: "#17201a",
} as const

export type BoardSoldierShape = "active-circle" | "stone-diamond" | "fallen-x"
export type BoardSoldierTexture = "solid" | "cracked" | "absent"
export type BoardEventCalloutVariant =
  | "backstab"
  | "push"
  | "fall"
  | "stone"
  | "blocked"
  | "contraction"
  | "runtime-violation"
  | "outcome"

export interface BoardSoldierDescriptor {
  id: string
  shortLabel: string
  owner: string
  badgeNumber: number
  status: SoldierStatus
  position: Position | null
  previousPosition: Position | null
  previousStatus: SoldierStatus
  facing: Direction | null
  selected: boolean
  fill: string
  shape: BoardSoldierShape
  texture: BoardSoldierTexture
  transition: "steady" | "move" | "pushed" | "stone" | "fall" | "backstab"
}

export interface BoardTerrainDescriptor {
  id: string
  position: Position
  fill: string
  shape: "terrain-square"
  texture: "hatched"
}

export interface BoardBoundsDescriptor {
  minX: number
  maxX: number
  minY: number
  maxY: number
  previousMinX: number
  previousMaxX: number
  previousMinY: number
  previousMaxY: number
  stroke: string
  contractionActive: boolean
  contractionStroke: string
}

export interface BoardEventCalloutDescriptor {
  variant: BoardEventCalloutVariant
  label: string
  color: string
  sequence: number
  from?: Position | undefined
  to?: Position | undefined
}

export interface ReplayBoardModel {
  sequence: number
  arenaBounds: BoardBoundsDescriptor
  board: FullBoardSnapshot
  bounds: BoardBoundsDescriptor
  soldiers: BoardSoldierDescriptor[]
  terrain: BoardTerrainDescriptor[]
  callout: BoardEventCalloutDescriptor | null
}

const stateIndexAtSequence = (data: ReplayReadyDto, sequence: number): number =>
  Math.max(
    data.states.findIndex((state) => state.sequence === sequence),
    0,
  )

const stateAtSequence = (data: ReplayReadyDto, sequence: number) =>
  data.states[stateIndexAtSequence(data, sequence)] ?? data.states[0]!

const previousStateAtSequence = (data: ReplayReadyDto, sequence: number) => {
  const index = stateIndexAtSequence(data, sequence)
  return data.states[Math.max(index - 1, 0)] ?? data.states[0]!
}

const entryAtSequence = (data: ReplayReadyDto, sequence: number) =>
  data.timeline.find((entry) => entry.sequence === sequence) ??
  data.timeline[0]!

const ownerColor = (data: ReplayReadyDto, ownerPlayerId: string): string =>
  ownerPlayerId === data.metadata.bottomPlayerId
    ? ReplayBoardColors.ownerBottom
    : ReplayBoardColors.ownerTop

const soldierShape = (status: SoldierStatus): BoardSoldierShape => {
  if (status === "STONE") {
    return "stone-diamond"
  }
  if (status === "FALLEN") {
    return "fallen-x"
  }
  return "active-circle"
}

const soldierTexture = (status: SoldierStatus): BoardSoldierTexture => {
  if (status === "STONE") {
    return "cracked"
  }
  if (status === "FALLEN") {
    return "absent"
  }
  return "solid"
}

const buildBadgeNumbers = (
  soldiers: SoldierSnapshot[],
): Map<string, number> => {
  const ownerCounts = new Map<string, number>()
  const badges = new Map<string, number>()

  for (const soldier of soldiers) {
    const next = (ownerCounts.get(soldier.ownerPlayerId) ?? 0) + 1
    ownerCounts.set(soldier.ownerPlayerId, next)
    badges.set(soldier.id, next)
  }

  return badges
}

const isContractionEvent = (entry: ReplayTimelineEntryDto): boolean =>
  entry.type === "CONTRACTION_RESOLVED"

const samePosition = (left: Position | null, right: Position | null): boolean =>
  left === right ||
  (left !== null && right !== null && left.x === right.x && left.y === right.y)

const getPayloadRecord = (
  entry: ReplayTimelineEntryDto,
): Record<string, unknown> =>
  entry.payload !== null &&
  typeof entry.payload === "object" &&
  !Array.isArray(entry.payload)
    ? entry.payload
    : {}

const getPositionField = (
  entry: ReplayTimelineEntryDto,
  keys: string[],
): Position | undefined => {
  const payload = getPayloadRecord(entry)
  for (const key of keys) {
    const value = payload[key]
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as { x?: unknown }).x === "number" &&
      typeof (value as { y?: unknown }).y === "number"
    ) {
      return { x: (value as { x: number }).x, y: (value as { y: number }).y }
    }
  }
  return undefined
}

const findSoldier = (
  board: FullBoardSnapshot,
  soldierId: unknown,
): SoldierSnapshot | undefined =>
  typeof soldierId === "string"
    ? board.soldiers.find((soldier) => soldier.id === soldierId)
    : undefined

const optionalPosition = (
  position: Position | null | undefined,
): Position | undefined => position ?? undefined

const firstBackstabPair = (
  entry: ReplayTimelineEntryDto,
): { attackerId: string; victimId: string } | null => {
  const payload = getPayloadRecord(entry)
  const pairs = payload.pairs
  if (!Array.isArray(pairs)) {
    return null
  }
  const pair = pairs[0]
  if (
    pair !== null &&
    typeof pair === "object" &&
    !Array.isArray(pair) &&
    typeof (pair as { attackerId?: unknown }).attackerId === "string" &&
    typeof (pair as { victimId?: unknown }).victimId === "string"
  ) {
    return {
      attackerId: (pair as { attackerId: string }).attackerId,
      victimId: (pair as { victimId: string }).victimId,
    }
  }
  return null
}

const inferCalloutPositions = (
  entry: ReplayTimelineEntryDto,
  previousBoard?: FullBoardSnapshot,
  currentBoard?: FullBoardSnapshot,
): { from?: Position | undefined; to?: Position | undefined } => {
  const explicit = {
    from: getPositionField(entry, ["from", "fromPosition", "start"]),
    to: getPositionField(entry, ["to", "toPosition", "end", "position"]),
  }
  if (explicit.from || explicit.to || !previousBoard || !currentBoard) {
    return explicit
  }

  const payload = getPayloadRecord(entry)
  const contextSoldier = findSoldier(previousBoard, entry.context.soldierId)
  const payloadSoldier = findSoldier(previousBoard, payload.soldierId)
  const currentPayloadSoldier = findSoldier(currentBoard, payload.soldierId)
  const targetSoldier = findSoldier(previousBoard, payload.targetSoldierId)
  const currentTargetSoldier = findSoldier(
    currentBoard,
    payload.targetSoldierId,
  )

  switch (entry.type) {
    case "MOVE_ADVANCED":
      return {
        from: optionalPosition(
          payloadSoldier?.position ?? contextSoldier?.position,
        ),
        to: optionalPosition(currentPayloadSoldier?.position),
      }
    case "PUSH_RESOLVED":
    case "PUSH_ATTEMPTED":
    case "PUSH_BLOCKED":
      return {
        from: optionalPosition(
          targetSoldier?.position ?? payloadSoldier?.position,
        ),
        to: optionalPosition(
          currentTargetSoldier?.position ?? targetSoldier?.position,
        ),
      }
    case "SOLDIER_FELL":
      return {
        from: optionalPosition(
          payloadSoldier?.position ?? contextSoldier?.position,
        ),
        to: optionalPosition(
          payloadSoldier?.position ?? contextSoldier?.position,
        ),
      }
    case "SOLDIER_STONED":
      return {
        from: optionalPosition(
          currentPayloadSoldier?.position ??
            payloadSoldier?.position ??
            contextSoldier?.position,
        ),
        to: optionalPosition(
          currentPayloadSoldier?.position ??
            payloadSoldier?.position ??
            contextSoldier?.position,
        ),
      }
    case "BACKSTAB_RESOLVED": {
      const pair = firstBackstabPair(entry)
      const attacker = findSoldier(previousBoard, pair?.attackerId)
      const victim = findSoldier(previousBoard, pair?.victimId)
      return {
        from: optionalPosition(attacker?.position),
        to: optionalPosition(victim?.position),
      }
    }
    case "RUNTIME_VIOLATION":
    case "MOVE_BLOCKED":
      return {
        from: optionalPosition(
          payloadSoldier?.position ?? contextSoldier?.position,
        ),
        to: optionalPosition(
          payloadSoldier?.position ?? contextSoldier?.position,
        ),
      }
    default:
      return {}
  }
}

export const getEventCalloutDescriptor = (
  entry: ReplayTimelineEntryDto,
  previousBoard?: FullBoardSnapshot,
  currentBoard?: FullBoardSnapshot,
): BoardEventCalloutDescriptor | null => {
  const positions = inferCalloutPositions(entry, previousBoard, currentBoard)
  const base = {
    sequence: entry.sequence,
    ...positions,
  }

  switch (entry.type) {
    case "BACKSTAB_RESOLVED":
      return {
        ...base,
        variant: "backstab",
        label: "Backstab",
        color: ReplayBoardColors.backstab,
      }
    case "PUSH_ATTEMPTED":
    case "PUSH_RESOLVED":
      return {
        ...base,
        variant: "push",
        label: "Push",
        color: ReplayBoardColors.push,
      }
    case "SOLDIER_FELL":
      return {
        ...base,
        variant: "fall",
        label: "Fall",
        color: ReplayBoardColors.fall,
      }
    case "SOLDIER_STONED":
      return {
        ...base,
        variant: "stone",
        label: "Stone",
        color: ReplayBoardColors.stone,
      }
    case "MOVE_BLOCKED":
    case "PUSH_BLOCKED":
      return {
        ...base,
        variant: "blocked",
        label: "Blocked",
        color: ReplayBoardColors.warning,
      }
    case "CONTRACTION_RESOLVED":
      return {
        ...base,
        variant: "contraction",
        label: "Contraction",
        color: ReplayBoardColors.terrain,
      }
    case "RUNTIME_VIOLATION":
      return {
        ...base,
        variant: "runtime-violation",
        label: "Runtime violation",
        color: ReplayBoardColors.destructive,
      }
    case "MATCH_ENDED":
      return {
        ...base,
        variant: "outcome",
        label: "Outcome",
        color: ReplayBoardColors.selected,
      }
    default:
      return null
  }
}

const transitionFor = (
  soldier: SoldierSnapshot,
  previousSoldier: SoldierSnapshot | undefined,
  entry: ReplayTimelineEntryDto,
): BoardSoldierDescriptor["transition"] => {
  if (!previousSoldier) {
    return "steady"
  }
  if (previousSoldier.status !== "FALLEN" && soldier.status === "FALLEN") {
    return "fall"
  }
  if (previousSoldier.status !== "STONE" && soldier.status === "STONE") {
    return entry.type === "BACKSTAB_RESOLVED" ? "backstab" : "stone"
  }
  if (!samePosition(previousSoldier.position, soldier.position)) {
    return entry.type === "PUSH_RESOLVED" ? "pushed" : "move"
  }
  return "steady"
}

const createBoundsDescriptor = (
  current: FullBoardSnapshot["bounds"],
  previous: FullBoardSnapshot["bounds"],
  entry: ReplayTimelineEntryDto,
): BoardBoundsDescriptor => ({
  ...current,
  previousMinX: previous.minX,
  previousMaxX: previous.maxX,
  previousMinY: previous.minY,
  previousMaxY: previous.maxY,
  stroke: ReplayBoardColors.boardLine,
  contractionActive: isContractionEvent(entry),
  contractionStroke: ReplayBoardColors.terrain,
})

export const buildReplayBoardModel = (
  data: ReplayReadyDto,
  selectedSequence: number,
  selectedSoldierId: string | null,
): ReplayBoardModel => {
  const state = stateAtSequence(data, selectedSequence)
  const previousState = previousStateAtSequence(data, selectedSequence)
  const entry = entryAtSequence(data, state.sequence)
  const badges = buildBadgeNumbers(state.board.soldiers)
  const previousSoldiers = new Map(
    previousState.board.soldiers.map((soldier) => [soldier.id, soldier]),
  )

  return {
    sequence: state.sequence,
    arenaBounds: createBoundsDescriptor(
      data.states[0]?.board.bounds ?? state.board.bounds,
      data.states[0]?.board.bounds ?? state.board.bounds,
      entry,
    ),
    board: state.board,
    bounds: createBoundsDescriptor(
      state.board.bounds,
      previousState.board.bounds,
      entry,
    ),
    soldiers: state.board.soldiers.map((soldier) => {
      const badgeNumber = badges.get(soldier.id) ?? 0
      const previousSoldier = previousSoldiers.get(soldier.id)
      return {
        id: soldier.id,
        shortLabel: `${badgeNumber}`,
        owner: soldier.ownerPlayerId,
        badgeNumber,
        status: soldier.status,
        position: soldier.position,
        previousPosition: previousSoldier?.position ?? soldier.position,
        previousStatus: previousSoldier?.status ?? soldier.status,
        facing: soldier.facing,
        selected: soldier.id === selectedSoldierId,
        fill:
          soldier.status === "STONE"
            ? ReplayBoardColors.stone
            : ownerColor(data, soldier.ownerPlayerId),
        shape: soldierShape(soldier.status),
        texture: soldierTexture(soldier.status),
        transition: transitionFor(soldier, previousSoldier, entry),
      }
    }),
    terrain: state.board.terrainStones.map((position) => ({
      id: `terrain:${position.x}:${position.y}`,
      position,
      fill: ReplayBoardColors.terrain,
      shape: "terrain-square",
      texture: "hatched",
    })),
    callout: getEventCalloutDescriptor(entry, previousState.board, state.board),
  }
}
