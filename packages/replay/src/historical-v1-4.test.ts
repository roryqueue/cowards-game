import { readFileSync } from "node:fs"
import type {
  Chronicle,
  ChronicleEvent,
  FullBoardSnapshot,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  resolveReplayCompatibilityIdentity,
  validateChronicle,
} from "./validate.js"
import { validateHistoricalV14Grammar } from "./historical-v1-4-grammar.js"
import {
  applyHistoricalV14Transition,
  interpretHistoricalV14Transitions,
  type HistoricalV14ReplayState,
} from "./historical-v1-4-transition.js"

const historicalVersions = Object.freeze({
  spec: "cowards-rules-v1.4",
  engine: "0.1.4",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-v1.4",
  strategyRevision: "0.1.4",
  arenaVariant: "0.1.0",
})

const activationContext = Object.freeze({
  phaseNumber: 1,
  roundNumber: 1 as const,
  activationId: "1:1:0",
  activationIndex: 0,
  actingPlayerId: "bottom",
  soldierId: "mover",
})

const historicalEvents = (): ChronicleEvent[] => [
  {
    type: "MATCH_STARTED",
    sequence: 0,
    context: {},
    privacy: "public",
    payload: { matchId: "historical-v1.4-vector", seed: "v1.4-seed" },
  },
  {
    type: "ROUND_STARTED",
    sequence: 1,
    context: { phaseNumber: 1, roundNumber: 1 },
    privacy: "public",
    payload: { roundNumber: 1 },
  },
  {
    type: "STRATEGY_EVALUATED",
    sequence: 2,
    context: {
      phaseNumber: 1,
      roundNumber: 1,
      actingPlayerId: "bottom",
    },
    privacy: "owner",
    payload: { playerId: "bottom" },
  },
  {
    type: "ACTIVATION_STARTED",
    sequence: 3,
    context: activationContext,
    privacy: "public",
    payload: { soldierId: "mover" },
  },
  {
    type: "CYCLE_STARTED",
    sequence: 4,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", cycleIndex: 0 },
  },
  {
    type: "AWARENESS_GRID_OBSERVED",
    sequence: 5,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "owner",
    payload: { soldierId: "mover", cycleIndex: 0 },
  },
  {
    type: "ACTION_EMITTED",
    sequence: 6,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "owner",
    payload: {
      soldierId: "mover",
      action: { type: "MOVE", direction: "RIGHT" },
    },
  },
  {
    type: "PUSH_ATTEMPTED",
    sequence: 7,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", targetSoldierId: "target" },
  },
  {
    type: "PUSH_RESOLVED",
    sequence: 8,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: {
      soldierId: "mover",
      targetSoldierId: "target",
      pushedOffBoard: false,
    },
  },
  {
    type: "MOVE_ADVANCED",
    sequence: 9,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", direction: "RIGHT" },
  },
  {
    type: "BACKSTAB_RESOLVED",
    sequence: 10,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: {
      boundary: "activation-end",
      pairs: [{ attackerId: "mover", victimId: "victim" }],
    },
  },
  {
    type: "SOLDIER_STONED",
    sequence: 11,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "victim", reason: "BACKSTAB" },
  },
  {
    type: "CYCLE_ENDED",
    sequence: 12,
    context: { ...activationContext, cycleIndex: 0 },
    privacy: "public",
    payload: { soldierId: "mover", cycleIndex: 0 },
  },
  {
    type: "ACTIVATION_ENDED",
    sequence: 13,
    context: activationContext,
    privacy: "public",
    payload: { soldierId: "mover", reason: "MATCH_ENDED" },
  },
  {
    type: "MATCH_ENDED",
    sequence: 14,
    context: {},
    privacy: "public",
    payload: { type: "DRAW" },
  },
]

const historicalChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1.4",
  reproducibility: {
    matchId: "historical-v1.4-vector",
    seed: "v1.4-seed",
    arenaVariantId: "historical-arena",
    arenaVariantVersion: "0.1.0",
    strategyRevisionIds: ["bottom-revision", "top-revision"],
    versions: historicalVersions,
  },
  events: historicalEvents(),
  snapshots: [],
})

const initialBoard = (): FullBoardSnapshot => ({
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  terrainStones: [],
  soldiers: [
    {
      id: "mover",
      ownerPlayerId: "bottom",
      status: "ACTIVE",
      position: { x: 1, y: 1 },
      facing: "RIGHT",
      lastSuccessfulMoveDirection: null,
    },
    {
      id: "target",
      ownerPlayerId: "top",
      status: "ACTIVE",
      position: { x: 2, y: 1 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
    {
      id: "victim",
      ownerPlayerId: "top",
      status: "ACTIVE",
      position: { x: 1, y: 2 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
})

const initialState = (): HistoricalV14ReplayState => ({
  board: initialBoard(),
})

describe("frozen historical v1.4 interpretation", () => {
  it("accepts original vocabulary, payloads, order, and boundaries", () => {
    expect(validateHistoricalV14Grammar(historicalChronicle())).toEqual([])
    expect(validateChronicle(historicalChronicle())).toMatchObject({
      ok: false,
      errors: [{ code: "SCHEMA_INVALID" }],
    })
  })

  it("rejects literals and boundaries outside the original v1.4 decoder", () => {
    const unknownEvent = historicalChronicle() as unknown as {
      events: Array<Record<string, unknown>>
    }
    unknownEvent.events[7] = {
      ...unknownEvent.events[7],
      type: "CURRENT_ONLY_SENTINEL",
    }
    expect(validateHistoricalV14Grammar(unknownEvent)[0]).toMatchObject({
      code: "SCHEMA_INVALID",
    })

    const unknownBoundary = historicalChronicle() as unknown as {
      events: Array<Record<string, unknown>>
    }
    unknownBoundary.events[10] = {
      ...unknownBoundary.events[10],
      payload: {
        boundary: "current-only-boundary",
        pairs: [{ attackerId: "mover", victimId: "victim" }],
      },
    }
    expect(validateHistoricalV14Grammar(unknownBoundary)[0]).toMatchObject({
      code: "SCHEMA_INVALID",
    })
  })

  it("applies original transition semantics through historical-only symbols", () => {
    let state = initialState()
    for (const event of historicalEvents()) {
      const result = applyHistoricalV14Transition(state, event)
      expect(result).toMatchObject({ ok: true })
      if (!result.ok) throw new Error(result.errors[0]?.code)
      state = result.state
    }

    expect(state).toEqual({
      board: {
        ...initialBoard(),
        soldiers: [
          {
            ...initialBoard().soldiers[0],
            position: { x: 2, y: 1 },
            facing: "RIGHT",
            lastSuccessfulMoveDirection: "RIGHT",
          },
          { ...initialBoard().soldiers[1], position: { x: 3, y: 1 } },
          { ...initialBoard().soldiers[2], status: "STONE" },
        ],
      },
      outcome: { type: "DRAW" },
    })
  })

  it("produces a deterministic order-sensitive interpretation root", () => {
    const interpreted = interpretHistoricalV14Transitions({
      initialState: initialState(),
      events: historicalEvents(),
    })
    expect(interpreted).toMatchObject({
      ok: true,
      interpretationRoot: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u),
    })
    if (!interpreted.ok) throw new Error(interpreted.errors[0]?.code)

    const reordered = historicalEvents()
    ;[reordered[7], reordered[8]] = [reordered[8]!, reordered[7]!]
    const mutation = interpretHistoricalV14Transitions({
      initialState: initialState(),
      events: reordered,
    })
    expect(mutation).toMatchObject({ ok: true })
    if (!mutation.ok) throw new Error(mutation.errors[0]?.code)
    expect(mutation.interpretationRoot).not.toBe(
      interpreted.interpretationRoot,
    )
  })

  it("keeps original-version resolution typed and byte-preserving", () => {
    const input = {
      profile: "historical-v1.4" as const,
      chronicle: historicalChronicle(),
    }
    const before = JSON.stringify(input)

    expect(resolveReplayCompatibilityIdentity(input)).toEqual({
      status: "historical_original_semantics",
      tupleResolution: "unresolved_legacy",
    })
    expect(JSON.stringify(input)).toBe(before)

    const unknown = {
      profile: "historical-v1.16" as const,
      compatibility: {
        tupleId: "sha256:unknown",
        tuple: {
          rules: "unknown",
          engine: "unknown",
          runtimeAbi: "unknown",
          chronicle: "unknown",
          arenaCatalog: "unknown",
          setPolicy: "unknown",
        },
      },
      chronicle: historicalChronicle(),
    }
    const unknownBefore = JSON.stringify(unknown)
    expect(resolveReplayCompatibilityIdentity(unknown)).toEqual({
      status: "invalid",
      reason: "missing_or_mixed_current_tuple",
    })
    expect(JSON.stringify(unknown)).toBe(unknownBefore)
  })

  it("has no dependency on mutable current grammar or transition helpers", () => {
    for (const file of [
      "packages/replay/src/historical-v1-4-grammar.ts",
      "packages/replay/src/historical-v1-4-transition.ts",
    ]) {
      const source = readFileSync(file, "utf8")
      expect(source).not.toMatch(
        /from\s+["']\.\/(?:grammar|replay-transition|validate|reconstruct)\.js["']/u,
      )
      expect(source).not.toContain("validateChronicleGrammar(")
      expect(source).not.toContain("applyReplayEvent(")
      expect(source).not.toContain("migrateChronicle(")
    }
  })
})
