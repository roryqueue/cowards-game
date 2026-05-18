import type {
  Direction,
  FullBoardSnapshot,
  Position,
  SoldierSnapshot,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { createReplayFixtureData } from "./replay-fixture.js"

const samePosition = (left: Position | null, right: Position | null): boolean =>
  left === right ||
  (left !== null && right !== null && left.x === right.x && left.y === right.y)

const isInsideBounds = (
  position: Position,
  bounds: FullBoardSnapshot["bounds"],
): boolean =>
  position.x >= bounds.minX &&
  position.x <= bounds.maxX &&
  position.y >= bounds.minY &&
  position.y <= bounds.maxY

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

const oppositeDirection = (direction: Direction): Direction => {
  switch (direction) {
    case "UP":
      return "DOWN"
    case "DOWN":
      return "UP"
    case "LEFT":
      return "RIGHT"
    case "RIGHT":
      return "LEFT"
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

const behindSquare = (soldier: SoldierSnapshot): Position | null => {
  if (soldier.position === null || soldier.facing === null) {
    return null
  }
  switch (soldier.facing) {
    case "UP":
      return { x: soldier.position.x, y: soldier.position.y + 1 }
    case "DOWN":
      return { x: soldier.position.x, y: soldier.position.y - 1 }
    case "LEFT":
      return { x: soldier.position.x + 1, y: soldier.position.y }
    case "RIGHT":
      return { x: soldier.position.x - 1, y: soldier.position.y }
  }
}

const payloadRecord = (payload: unknown): Record<string, unknown> =>
  payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {}

const boardAt = (sequence: number): FullBoardSnapshot => {
  const data = createReplayFixtureData()
  const state = data.states.find((candidate) => candidate.sequence === sequence)
  expect(state).toBeDefined()
  return state!.board
}

const soldier = (
  board: FullBoardSnapshot,
  soldierId: string,
): SoldierSnapshot => {
  const found = board.soldiers.find((candidate) => candidate.id === soldierId)
  expect(found).toBeDefined()
  return found!
}

const activeSoldierAt = (
  board: FullBoardSnapshot,
  position: Position,
): SoldierSnapshot | undefined =>
  board.soldiers.find(
    (candidate) =>
      candidate.status !== "FALLEN" &&
      candidate.position !== null &&
      samePosition(candidate.position, position),
  )

describe("replay fixture", () => {
  it("starts with the canonical 12x12 board and both full armies", () => {
    const board = boardAt(0)

    expect(board.bounds).toEqual({ minX: 0, maxX: 11, minY: 0, maxY: 11 })
    expect(
      board.soldiers
        .filter((candidate) => candidate.ownerPlayerId === "player:bottom")
        .map((candidate) => candidate.position),
    ).toEqual([
      { x: 2, y: 11 },
      { x: 3, y: 11 },
      { x: 4, y: 11 },
      { x: 5, y: 11 },
      { x: 6, y: 11 },
      { x: 7, y: 11 },
      { x: 8, y: 11 },
      { x: 9, y: 11 },
    ])
    expect(
      board.soldiers
        .filter((candidate) => candidate.ownerPlayerId === "player:top")
        .map((candidate) => candidate.position),
    ).toEqual([
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
      { x: 7, y: 0 },
      { x: 8, y: 0 },
      { x: 9, y: 0 },
    ])
  })

  it("uses a legal push with an empty destination square", () => {
    const data = createReplayFixtureData()
    const entry = data.timeline.find(
      (candidate) => candidate.type === "PUSH_RESOLVED",
    )
    expect(entry).toBeDefined()
    const payload = payloadRecord(entry!.payload)
    const before = boardAt(entry!.sequence - 1)
    const after = boardAt(entry!.sequence)
    const mover = soldier(before, payload.soldierId as string)
    const target = soldier(before, payload.targetSoldierId as string)

    expect(mover.status).toBe("ACTIVE")
    expect(target.status).toBe("ACTIVE")
    expect(mover.position).not.toBeNull()
    expect(target.position).not.toBeNull()
    const direction = directionBetween(mover.position!, target.position!)
    expect(direction).toBe("RIGHT")
    expect(target.facing).not.toBe(direction)
    expect(target.facing).not.toBe(oppositeDirection(direction!))

    const pushedDestination = movePosition(target.position!, direction!)
    expect(activeSoldierAt(before, pushedDestination)).toBeUndefined()
    expect(
      before.terrainStones.some((stone) =>
        samePosition(stone, pushedDestination),
      ),
    ).toBe(false)
    expect(soldier(after, target.id).position).toEqual(pushedDestination)
  })

  it("uses a real terrain stone for the blocked move", () => {
    const data = createReplayFixtureData()
    const entry = data.timeline.find(
      (candidate) => candidate.type === "MOVE_BLOCKED",
    )
    expect(entry).toBeDefined()
    const payload = payloadRecord(entry!.payload)
    const before = boardAt(entry!.sequence - 1)
    const after = boardAt(entry!.sequence)
    const mover = soldier(before, payload.soldierId as string)

    expect(mover.position).not.toBeNull()
    expect(mover.facing).toBe("UP")
    const destination = movePosition(mover.position!, "UP")
    expect(before.terrainStones).toContainEqual(destination)
    expect(after).toEqual(before)
  })

  it("falls every soldier outside the contracted board", () => {
    const data = createReplayFixtureData()
    const entry = data.timeline.find(
      (candidate) => candidate.type === "CONTRACTION_RESOLVED",
    )
    expect(entry).toBeDefined()
    const before = boardAt(entry!.sequence - 1)
    const after = boardAt(entry!.sequence)

    expect(after.bounds).toEqual({ minX: 1, maxX: 10, minY: 1, maxY: 10 })
    for (const previous of before.soldiers) {
      const current = soldier(after, previous.id)
      if (
        previous.status !== "FALLEN" &&
        previous.position !== null &&
        !isInsideBounds(previous.position, after.bounds)
      ) {
        expect(current.status).toBe("FALLEN")
        expect(current.position).toBeNull()
      }
    }
    expect(
      after.terrainStones.every((stone) => isInsideBounds(stone, after.bounds)),
    ).toBe(true)
  })

  it("only allows backstab callouts for directly-behind attackers", () => {
    const data = createReplayFixtureData()
    const illegalBackstabs = data.timeline
      .filter((candidate) => candidate.type === "BACKSTAB_RESOLVED")
      .flatMap((entry) => {
        const previousBoard = boardAt(entry.sequence - 1)
        const pairs = payloadRecord(entry.payload).pairs
        if (!Array.isArray(pairs)) {
          return [`sequence:${entry.sequence}:missing-pairs`]
        }
        return pairs.flatMap((pair) => {
          const record = payloadRecord(pair)
          const attacker = soldier(previousBoard, record.attackerId as string)
          const victim = soldier(previousBoard, record.victimId as string)
          const directlyBehind = samePosition(
            attacker.position,
            behindSquare(victim),
          )
          return attacker.ownerPlayerId !== victim.ownerPlayerId &&
            attacker.status === "ACTIVE" &&
            victim.status === "ACTIVE" &&
            directlyBehind
            ? []
            : [`sequence:${entry.sequence}:illegal-pair`]
        })
      })

    expect(illegalBackstabs).toEqual([])
  })
})
