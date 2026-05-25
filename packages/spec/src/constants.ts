import type { BoardBounds, Position } from "./types.js"

export const INITIAL_BOARD_SIZE = 12

export const INITIAL_BOUNDS = {
  minX: 0,
  maxX: 11,
  minY: 0,
  maxY: 11,
} as const satisfies BoardBounds

export const MAX_ACTIVATION_CYCLES = 12

export const ROUND_ACTIVATION_COUNTS = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
} as const

export const STRATEGY_MEMORY_BYTES = 32768
export const SOLDIER_MEMORY_BYTES = 2048
export const OBJECTIVE_PAYLOAD_BYTES = 1024
export const STRATEGY_SOURCE_BYTES = 65536
export const STRATEGY_WASM_ARTIFACT_BYTES = 4 * 1024 * 1024

export const BOTTOM_STARTING_POSITIONS = [
  { x: 2, y: 11 },
  { x: 3, y: 11 },
  { x: 4, y: 11 },
  { x: 5, y: 11 },
  { x: 6, y: 11 },
  { x: 7, y: 11 },
  { x: 8, y: 11 },
  { x: 9, y: 11 },
] as const satisfies readonly Position[]

export const TOP_STARTING_POSITIONS = [
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 4, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
  { x: 7, y: 0 },
  { x: 8, y: 0 },
  { x: 9, y: 0 },
] as const satisfies readonly Position[]
