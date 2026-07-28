import { describe, expect, it } from "vitest"
import {
  STRATEGY_OBSERVATION_ABI_V1_19,
  SoldierBrainInputV119Schema,
  StrategyInputV119Schema,
  validateStrategyInputV119,
  type StrategyInputV119,
} from "./strategy-observation-abi-v1-19.js"

const playerA = "player:a"
const playerB = "player:b"

const soldier = (id: string, ownerPlayerId: string) => ({
  id,
  ownerPlayerId,
  status: "ACTIVE" as const,
  position: { x: ownerPlayerId === playerA ? 3 : 8, y: 5 },
  facing: ownerPlayerId === playerA ? ("RIGHT" as const) : ("LEFT" as const),
  lastSuccessfulMoveDirection: null,
})

const validStrategyInput = (): StrategyInputV119 => {
  const a = soldier("soldier:a", playerA)
  const b = soldier("soldier:b", playerB)
  return {
    phaseNumber: 1,
    roundNumber: 2,
    activationCount: 1,
    initialInitiativePlayerId: playerA,
    hasInitialInitiative: true,
    roundInitiativePlayerId: playerB,
    hasRoundInitiative: false,
    board: {
      bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      soldiers: [a, b],
      terrainStones: [],
    },
    mySoldiers: [a],
    enemySoldiers: [b],
    strategyMemory: null,
  }
}

const validationContext = {
  entrantPlayerIds: [playerA, playerB] as const,
  observingPlayerId: playerA,
}

describe("strategy observation ABI v1.19", () => {
  it("freezes one inactive observational-only successor contract", () => {
    expect(STRATEGY_OBSERVATION_ABI_V1_19).toMatchObject({
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      lifecycle: { status: "candidate", active: false },
      ownership: {
        initiative: "canonical-match-kernel",
        hasAdvancedThisActivation: "activation-slot-scheduler-state",
      },
      semantics: {
        observationOnly: true,
        changesActionLegality: false,
        addsHoldOrEndActivation: false,
      },
      compatibility: {
        additiveFieldsImplyCompatibility: false,
        requiresExecutionRevalidation: true,
      },
    })
    expect(Object.isFrozen(STRATEGY_OBSERVATION_ABI_V1_19)).toBe(true)
    expect(Object.isFrozen(STRATEGY_OBSERVATION_ABI_V1_19.semantics)).toBe(
      true,
    )
  })

  it("admits exact absolute and player-relative initiative truth", () => {
    const input = validStrategyInput()
    expect(StrategyInputV119Schema.parse(input)).toEqual(input)
    expect(validateStrategyInputV119(input, validationContext)).toEqual({
      ok: true,
      value: input,
    })
  })

  it.each([
    ["initialInitiativePlayerId", "UNKNOWN_INITIAL_INITIATIVE_PLAYER"],
    ["roundInitiativePlayerId", "UNKNOWN_ROUND_INITIATIVE_PLAYER"],
  ] as const)("rejects unknown %s", (field, code) => {
    const input = { ...validStrategyInput(), [field]: "player:unknown" }
    expect(validateStrategyInputV119(input, validationContext)).toMatchObject({
      ok: false,
      error: { code, path: [field] },
    })
  })

  it.each([
    ["hasInitialInitiative", "INITIAL_INITIATIVE_RELATIVE_MISMATCH"],
    ["hasRoundInitiative", "ROUND_INITIATIVE_RELATIVE_MISMATCH"],
  ] as const)("rejects contradictory %s", (field, code) => {
    const original = validStrategyInput()
    const input = { ...original, [field]: !original[field] }
    expect(validateStrategyInputV119(input, validationContext)).toMatchObject({
      ok: false,
      error: { code, path: [field] },
    })
  })

  it.each([
    ["initialInitiativePlayerId"],
    ["hasInitialInitiative"],
    ["roundInitiativePlayerId"],
    ["hasRoundInitiative"],
  ] as const)("rejects missing successor field %s", (field) => {
    const input = { ...validStrategyInput() } as Record<string, unknown>
    delete input[field]
    expect(StrategyInputV119Schema.safeParse(input).success).toBe(false)
  })

  it("rejects extra and mixed old/new Strategy input", () => {
    expect(
      StrategyInputV119Schema.safeParse({
        ...validStrategyInput(),
        initiativePlayerId: playerA,
      }).success,
    ).toBe(false)
    expect(
      StrategyInputV119Schema.safeParse({
        ...validStrategyInput(),
        unknownObservation: true,
      }).success,
    ).toBe(false)
  })

  it("requires an exact two-entrant observing context", () => {
    expect(
      validateStrategyInputV119(validStrategyInput(), {
        entrantPlayerIds: [playerA, playerA],
        observingPlayerId: playerA,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_ENTRANT_CONTEXT" },
    })
    expect(
      validateStrategyInputV119(validStrategyInput(), {
        entrantPlayerIds: [playerA, playerB],
        observingPlayerId: "player:observer-not-entrant",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_OBSERVING_PLAYER" },
    })
  })

  it("requires closed pre-Action activation-slot Advance truth", () => {
    const input = {
      self: soldier("soldier:a", playerA),
      awarenessGrid: {
        cells: Array.from({ length: 25 }, (_, index) => ({
          dx: ((index % 5) - 2) as -2 | -1 | 0 | 1 | 2,
          dy: (Math.floor(index / 5) - 2) as -2 | -1 | 0 | 1 | 2,
          absoluteX: index % 5,
          absoluteY: Math.floor(index / 5),
          contents: "EMPTY" as const,
        })),
      },
      cycleIndex: 1,
      maxCycles: 12 as const,
      soldierMemory: null,
      hasAdvancedThisActivation: true,
    }

    expect(SoldierBrainInputV119Schema.parse(input)).toEqual(input)
    expect(
      SoldierBrainInputV119Schema.safeParse({
        ...input,
        hasAdvancedThisActivation: undefined,
      }).success,
    ).toBe(false)
    expect(
      SoldierBrainInputV119Schema.safeParse({
        ...input,
        advanced: true,
      }).success,
    ).toBe(false)
  })
})
