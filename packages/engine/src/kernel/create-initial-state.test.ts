import {
  BOTTOM_STARTING_POSITIONS,
  CANONICAL_COMPATIBILITY_TUPLES,
  COMPATIBILITY_VERSIONS,
  INITIAL_BOUNDS,
  TOP_STARTING_POSITIONS,
  fixtures,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { getInitialInitiativePlayerId } from "../state.js"
import { createCandidateInitialGameState } from "./create-initial-state.js"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const candidateInput = () => ({
  matchId: "match:candidate-initial-state",
  seed: fixtures.valid.sampleSeed,
  arenaVariant: clone(fixtures.valid.standardArenaVariant),
  bottomPlayerId: "alice",
  topPlayerId: "bob",
  bottomStrategyRevisionId: "alice-rev",
  topStrategyRevisionId: "bob-rev",
})

const expectCandidateState = () => {
  const result = createCandidateInitialGameState(candidateInput())
  expect(result.ok).toBe(true)
  if (!result.ok) {
    throw new Error(
      `Expected valid candidate state, got ${result.failure.issues.map((issue) => issue.code).join(",")}`,
    )
  }
  return result.state
}

describe("candidate initial-state constant and clone ownership", () => {
  it("deep-freezes every nested canonical constant", () => {
    expect(Object.isFrozen(INITIAL_BOUNDS)).toBe(true)
    expect(Object.isFrozen(BOTTOM_STARTING_POSITIONS)).toBe(true)
    expect(BOTTOM_STARTING_POSITIONS.every(Object.isFrozen)).toBe(true)
    expect(Object.isFrozen(TOP_STARTING_POSITIONS)).toBe(true)
    expect(TOP_STARTING_POSITIONS.every(Object.isFrozen)).toBe(true)

    const before = JSON.stringify({
      initialBounds: INITIAL_BOUNDS,
      bottom: BOTTOM_STARTING_POSITIONS,
      top: TOP_STARTING_POSITIONS,
      versions: COMPATIBILITY_VERSIONS,
    })
    expect(() => {
      ;(BOTTOM_STARTING_POSITIONS[0] as { x: number }).x = 99
    }).toThrow(TypeError)
    expect(
      JSON.stringify({
        initialBounds: INITIAL_BOUNDS,
        bottom: BOTTOM_STARTING_POSITIONS,
        top: TOP_STARTING_POSITIONS,
        versions: COMPATIBILITY_VERSIONS,
      }),
    ).toBe(before)
  })

  it("clones caller arena values before exposing candidate state", () => {
    const input = candidateInput()
    const result = createCandidateInitialGameState(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    input.arenaVariant.initialBounds.minX = 7
    input.arenaVariant.terrainStones.push({ x: 10, y: 10 })

    expect(result.state.bounds.minX).toBe(0)
    expect(result.state.arenaVariant.initialBounds.minX).toBe(0)
    expect(result.state.terrainStones).toEqual([])
    expect(result.state.arenaVariant.terrainStones).toEqual([])
  })

  it("owns every nested state reference independently across constructions", () => {
    const first = expectCandidateState()
    const second = expectCandidateState()

    expect(first).toEqual(second)
    expect(first).not.toBe(second)
    expect(first.versions).not.toBe(second.versions)
    expect(first.versions).not.toBe(COMPATIBILITY_VERSIONS)
    expect(Object.isFrozen(first.versions)).toBe(true)
    expect(first.bounds).not.toBe(second.bounds)
    expect(first.bounds).not.toBe(first.arenaVariant.initialBounds)
    expect(first.arenaVariant).not.toBe(second.arenaVariant)
    expect(first.arenaVariant.initialBounds).not.toBe(
      second.arenaVariant.initialBounds,
    )
    expect(first.terrainStones).not.toBe(second.terrainStones)
    expect(first.terrainStones).not.toBe(first.arenaVariant.terrainStones)
    expect(first.players).not.toBe(second.players)
    expect(first.players[0]).not.toBe(second.players[0])
    expect(first.players[0].strategyMemory).not.toBe(
      second.players[0].strategyMemory,
    )
    expect(first.soldiers).not.toBe(second.soldiers)
    expect(first.soldiers[0]).not.toBe(second.soldiers[0])
    expect(first.soldiers[0]?.position).not.toBe(second.soldiers[0]?.position)
    expect(first.soldiers[0]?.soldierMemory).not.toBe(
      second.soldiers[0]?.soldierMemory,
    )
  })

  it("isolates later states, fixtures, and authority hashes from first-state mutation", () => {
    const authorityHash = CANONICAL_COMPATIBILITY_TUPLES[0]!.sha256
    const fixtureBefore = JSON.stringify(fixtures.valid.standardArenaVariant)
    const first = expectCandidateState()
    const secondBefore = expectCandidateState()

    first.bounds.minX = 5
    first.arenaVariant.initialBounds.minX = 6
    first.arenaVariant.terrainStones.push({ x: 10, y: 10 })
    first.terrainStones.push({ x: 9, y: 9 })
    first.players[0].strategyMemory = { mutated: true }
    first.soldiers[0]!.position = { x: 1, y: 1 }
    first.soldiers[0]!.soldierMemory = { mutated: true }
    expect(() => {
      first.versions.engine = "mutated"
    }).toThrow(TypeError)

    const secondAfter = expectCandidateState()
    expect(secondAfter).toEqual(secondBefore)
    expect(JSON.stringify(fixtures.valid.standardArenaVariant)).toBe(
      fixtureBefore,
    )
    expect(CANONICAL_COMPATIBILITY_TUPLES[0]!.sha256).toBe(authorityHash)
  })
})

describe("candidate initial-state semantic admission", () => {
  const invalidArenaCases = [
    {
      name: "starting-position overlap",
      mutate: (arena: ReturnType<typeof candidateInput>["arenaVariant"]) => {
        arena.terrainStones = [{ x: 2, y: 11 }]
      },
      expected: [
        {
          code: "ARENA_TERRAIN_START_OVERLAP",
          path: ["terrainStones", 0],
          metadata: { side: "bottom" },
        },
      ],
    },
    {
      name: "out-of-bounds terrain",
      mutate: (arena: ReturnType<typeof candidateInput>["arenaVariant"]) => {
        arena.terrainStones = [{ x: 12, y: 4 }]
      },
      expected: [
        {
          code: "ARENA_TERRAIN_OUT_OF_BOUNDS",
          path: ["terrainStones", 0],
          metadata: {},
        },
      ],
    },
    {
      name: "duplicate terrain",
      mutate: (arena: ReturnType<typeof candidateInput>["arenaVariant"]) => {
        arena.terrainStones = [
          { x: 5, y: 5 },
          { x: 5, y: 5 },
        ]
      },
      expected: [
        {
          code: "ARENA_TERRAIN_DUPLICATE",
          path: ["terrainStones", 1],
          metadata: {},
        },
      ],
    },
  ] as const

  for (const vector of invalidArenaCases) {
    it(`rejects ${vector.name} before exposing any GameState`, () => {
      const input = candidateInput()
      vector.mutate(input.arenaVariant)
      const before = JSON.stringify(input)
      const result = createCandidateInitialGameState(input)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(Object.keys(result)).toEqual(["ok", "failure"])
      expect(result.failure).toMatchObject({
        category: "CANONICAL_INTEGRITY_FAILURE",
        ownership: "system_integrity",
        truncated: false,
      })
      expect(
        result.failure.issues.map(({ code, path, metadata }) => ({
          code,
          path: [...path],
          metadata: { ...metadata },
        })),
      ).toEqual(vector.expected)
      expect(JSON.stringify(input)).toBe(before)
    })
  }

  it("preserves deterministic v1.4 starts and initiative for both seed parities", () => {
    for (const seed of [fixtures.valid.sampleSeed, "odd-seed"] as const) {
      const input = { ...candidateInput(), seed }
      const first = createCandidateInitialGameState(input)
      const second = createCandidateInitialGameState(input)
      expect(first).toEqual(second)
      expect(first.ok).toBe(true)
      if (!first.ok) continue

      const bottom = first.state.soldiers.filter(
        (soldier) => soldier.ownerPlayerId === input.bottomPlayerId,
      )
      const top = first.state.soldiers.filter(
        (soldier) => soldier.ownerPlayerId === input.topPlayerId,
      )
      expect(bottom.map((soldier) => soldier.position)).toEqual(
        BOTTOM_STARTING_POSITIONS,
      )
      expect(top.map((soldier) => soldier.position)).toEqual(
        TOP_STARTING_POSITIONS,
      )
      expect(first.state.initiativePlayerId).toBe(
        getInitialInitiativePlayerId(
          seed,
          input.bottomPlayerId,
          input.topPlayerId,
        ),
      )
    }
  })
})
