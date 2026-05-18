import {
  BOTTOM_STARTING_POSITIONS,
  TOP_STARTING_POSITIONS,
  type BoardBounds,
  type Position,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { curatedArenaVariants } from "./index.js"

const containsPosition = (bounds: BoardBounds, position: Position): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

describe("curated arena variants", () => {
  it("contain every canonical starting Soldier position", () => {
    const startingPositions = [
      ...BOTTOM_STARTING_POSITIONS,
      ...TOP_STARTING_POSITIONS,
    ]

    for (const arena of curatedArenaVariants) {
      for (const position of startingPositions) {
        expect(
          containsPosition(arena.initialBounds, position),
          `${arena.id} initial bounds must contain (${position.x}, ${position.y})`,
        ).toBe(true)
      }
    }
  })
})
