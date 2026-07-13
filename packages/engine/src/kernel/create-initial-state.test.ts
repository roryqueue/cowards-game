import {
  BOTTOM_STARTING_POSITIONS,
  CANONICAL_COMPATIBILITY_TUPLES,
  COMPATIBILITY_VERSIONS,
  INITIAL_BOUNDS,
  TOP_STARTING_POSITIONS,
  fixtures,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
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
    expect(Object.isFrozen(COMPATIBILITY_VERSIONS)).toBe(true)

    const before = JSON.stringify({
      initialBounds: INITIAL_BOUNDS,
      bottom: BOTTOM_STARTING_POSITIONS,
      top: TOP_STARTING_POSITIONS,
      versions: COMPATIBILITY_VERSIONS,
    })
    expect(() => {
      ;(BOTTOM_STARTING_POSITIONS[0] as { x: number }).x = 99
    }).toThrow(TypeError)
    expect(() => {
      ;(COMPATIBILITY_VERSIONS as { engine: string }).engine = "tampered"
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
    first.versions.engine = "mutated"

    const secondAfter = expectCandidateState()
    expect(secondAfter).toEqual(secondBefore)
    expect(JSON.stringify(fixtures.valid.standardArenaVariant)).toBe(
      fixtureBefore,
    )
    expect(CANONICAL_COMPATIBILITY_TUPLES[0]!.sha256).toBe(authorityHash)
  })
})
