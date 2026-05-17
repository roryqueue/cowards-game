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
  facing: Direction | null
  selected: boolean
  fill: string
  shape: BoardSoldierShape
  texture: BoardSoldierTexture
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
  board: FullBoardSnapshot
  bounds: BoardBoundsDescriptor
  soldiers: BoardSoldierDescriptor[]
  terrain: BoardTerrainDescriptor[]
  callout: BoardEventCalloutDescriptor | null
}

const stateAtSequence = (data: ReplayReadyDto, sequence: number) =>
  data.states.find((state) => state.sequence === sequence) ?? data.states[0]!

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

export const getEventCalloutDescriptor = (
  entry: ReplayTimelineEntryDto,
): BoardEventCalloutDescriptor | null => {
  const base = {
    sequence: entry.sequence,
    from: getPositionField(entry, ["from", "fromPosition", "start"]),
    to: getPositionField(entry, ["to", "toPosition", "end", "position"]),
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

export const buildReplayBoardModel = (
  data: ReplayReadyDto,
  selectedSequence: number,
  selectedSoldierId: string | null,
): ReplayBoardModel => {
  const state = stateAtSequence(data, selectedSequence)
  const entry = entryAtSequence(data, state.sequence)
  const badges = buildBadgeNumbers(state.board.soldiers)

  return {
    sequence: state.sequence,
    board: state.board,
    bounds: {
      ...state.board.bounds,
      stroke: ReplayBoardColors.boardLine,
      contractionActive: isContractionEvent(entry),
      contractionStroke: ReplayBoardColors.terrain,
    },
    soldiers: state.board.soldiers.map((soldier) => {
      const badgeNumber = badges.get(soldier.id) ?? 0
      return {
        id: soldier.id,
        shortLabel: `${badgeNumber}`,
        owner: soldier.ownerPlayerId,
        badgeNumber,
        status: soldier.status,
        position: soldier.position,
        facing: soldier.facing,
        selected: soldier.id === selectedSoldierId,
        fill:
          soldier.status === "STONE"
            ? ReplayBoardColors.stone
            : ownerColor(data, soldier.ownerPlayerId),
        shape: soldierShape(soldier.status),
        texture: soldierTexture(soldier.status),
      }
    }),
    terrain: state.board.terrainStones.map((position) => ({
      id: `terrain:${position.x}:${position.y}`,
      position,
      fill: ReplayBoardColors.terrain,
      shape: "terrain-square",
      texture: "hatched",
    })),
    callout: getEventCalloutDescriptor(entry),
  }
}
