import type { BoardBounds, Position } from "./types.js"

export const INITIAL_BOARD_SIZE = 12

export const INITIAL_BOUNDS = Object.freeze({
  minX: 0,
  maxX: 11,
  minY: 0,
  maxY: 11,
} as const satisfies BoardBounds)

export const MAX_ACTIVATION_CYCLES = 12

export const ROUND_ACTIVATION_COUNTS = Object.freeze({
  1: 1,
  2: 2,
  3: 3,
  4: 4,
} as const)

export const STRATEGY_MEMORY_BYTES = 32768
export const SOLDIER_MEMORY_BYTES = 2048
export const OBJECTIVE_PAYLOAD_BYTES = 1024
export const STRATEGY_SOURCE_BYTES = 65536
export const STRATEGY_SOURCE_ARTIFACT_BYTES = 256 * 1024
export const STRATEGY_WASM_ARTIFACT_BYTES = 4 * 1024 * 1024

const frozenPosition = (position: Position): Readonly<Position> =>
  Object.freeze({ x: position.x, y: position.y })

export const BOTTOM_STARTING_POSITIONS: readonly Readonly<Position>[] =
  Object.freeze(
    [2, 3, 4, 5, 6, 7, 8, 9].map((x) => frozenPosition({ x, y: 11 })),
  )

export const TOP_STARTING_POSITIONS: readonly Readonly<Position>[] =
  Object.freeze(
    [2, 3, 4, 5, 6, 7, 8, 9].map((x) => frozenPosition({ x, y: 0 })),
  )
