import type {
  Chronicle,
  ChronicleEvent,
  FullBoardSnapshot,
  SoldierInactivityExplanationCause,
  SoldierSnapshot,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { buildSoldierInactivityExplanations } from "./debug-explanations.js"

const soldier = (
  id: string,
  ownerPlayerId: "bottom" | "top" = "bottom",
  overrides: Partial<SoldierSnapshot> = {},
): SoldierSnapshot => ({
  id,
  ownerPlayerId,
  status: "ACTIVE",
  position: { x: 1, y: 1 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  ...overrides,
})

const board = (soldiers: SoldierSnapshot[]): FullBoardSnapshot => ({
  bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
  terrainStones: [],
  soldiers,
})

const event = (
  type: ChronicleEvent["type"],
  sequence: number,
  payload: ChronicleEvent["payload"],
  context: ChronicleEvent["context"] = {},
): ChronicleEvent => ({
  type,
  sequence,
  context,
  privacy: "public",
  payload,
})

const createChronicle = (
  events: ChronicleEvent[],
  startBoard: FullBoardSnapshot = board([
    soldier("bottom-1"),
    soldier("bottom-2"),
    soldier("bottom-3"),
    soldier("top-1", "top"),
  ]),
  endBoard: FullBoardSnapshot = startBoard,
): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: {
    matchId: "debug-explanations-match",
    seed: "debug-seed",
    arenaVariantId: "arena",
    arenaVariantVersion: "0.1.0",
    strategyRevisionIds: ["bottom-rev", "top-rev"],
    versions: {
      spec: "1.0.0",
      engine: "0.1.0",
      runtimeJs: "0.1.0",
      chronicle: "0.1.0",
      strategyRevision: "0.1.0",
      arenaVariant: "0.1.0",
    },
  },
  events,
  snapshots: [
    { kind: "MATCH_START", sequence: 0, context: {}, board: startBoard },
    {
      kind: "TERMINAL",
      sequence: events.at(-1)?.sequence ?? 0,
      context: {},
      board: endBoard,
      outcome: { type: "DRAW" },
    },
  ],
})

const causeFor = (
  chronicle: Chronicle,
  soldierId: string,
): SoldierInactivityExplanationCause[] =>
  buildSoldierInactivityExplanations({
    chronicle,
    ownerPlayerId: "bottom",
  })
    .filter((explanation) => explanation.soldierId === soldierId)
    .map((explanation) => explanation.cause)

describe("buildSoldierInactivityExplanations", () => {
  it("derives not_selected from active Soldiers omitted from Activation starts", () => {
    const chronicle = createChronicle([
      event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
      event(
        "ROUND_STARTED",
        1,
        { roundNumber: 1 },
        {
          phaseNumber: 1,
          roundNumber: 1,
        },
      ),
      event(
        "STRATEGY_EVALUATED",
        2,
        { playerId: "bottom" },
        {
          phaseNumber: 1,
          roundNumber: 1,
          actingPlayerId: "bottom",
        },
      ),
      event(
        "ACTIVATION_STARTED",
        3,
        { soldierId: "bottom-1" },
        {
          phaseNumber: 1,
          roundNumber: 1,
          actingPlayerId: "bottom",
          soldierId: "bottom-1",
        },
      ),
    ])

    const explanations = buildSoldierInactivityExplanations({
      chronicle,
      ownerPlayerId: "bottom",
    })

    expect(explanations).toContainEqual(
      expect.objectContaining({
        soldierId: "bottom-2",
        playerId: "bottom",
        sequence: 2,
        cause: "not_selected",
      }),
    )
    expect(causeFor(chronicle, "bottom-1")).not.toContain("not_selected")
    expect(JSON.stringify(explanations)).not.toContain("top-1")
  })

  it("maps invalid runtime output and immediate reversal facts to invalid_action", () => {
    const chronicle = createChronicle([
      event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
      event(
        "RUNTIME_VIOLATION",
        1,
        {
          type: "INVALID_OUTPUT",
          ownerPlayerId: "bottom",
          soldierId: "bottom-1",
        },
        { actingPlayerId: "bottom", soldierId: "bottom-1" },
      ),
      event(
        "MOVE_BLOCKED",
        2,
        { soldierId: "bottom-2", reason: "IMMEDIATE_REVERSAL" },
        { actingPlayerId: "bottom", soldierId: "bottom-2" },
      ),
    ])

    expect(causeFor(chronicle, "bottom-1")).toContain("invalid_action")
    expect(causeFor(chronicle, "bottom-2")).toContain("invalid_action")
  })

  it("maps MOVE_BLOCKED and PUSH_BLOCKED facts to blocked_movement", () => {
    const chronicle = createChronicle([
      event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
      event(
        "MOVE_BLOCKED",
        1,
        { soldierId: "bottom-1", reason: "TERRAIN_STONE" },
        { actingPlayerId: "bottom", soldierId: "bottom-1" },
      ),
      event(
        "PUSH_BLOCKED",
        2,
        { soldierId: "bottom-2", targetSoldierId: "top-1" },
        { actingPlayerId: "bottom", soldierId: "bottom-2" },
      ),
    ])

    expect(causeFor(chronicle, "bottom-1")).toContain("blocked_movement")
    expect(causeFor(chronicle, "bottom-2")).toContain("blocked_movement")
  })

  it("maps runtime TIMEOUT and THROWN_EXCEPTION facts to dedicated causes", () => {
    const chronicle = createChronicle([
      event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
      event(
        "RUNTIME_VIOLATION",
        1,
        {
          type: "TIMEOUT",
          ownerPlayerId: "bottom",
          soldierId: "bottom-1",
        },
        { actingPlayerId: "bottom", soldierId: "bottom-1" },
      ),
      event(
        "RUNTIME_VIOLATION",
        2,
        {
          type: "THROWN_EXCEPTION",
          ownerPlayerId: "bottom",
          soldierId: "bottom-2",
        },
        { actingPlayerId: "bottom", soldierId: "bottom-2" },
      ),
    ])

    expect(causeFor(chronicle, "bottom-1")).toContain("timeout")
    expect(causeFor(chronicle, "bottom-2")).toContain("thrown_exception")
  })

  it("maps STONE, FALLEN, and Match ended facts to terminal causes", () => {
    const startBoard = board([
      soldier("bottom-1"),
      soldier("bottom-2"),
      soldier("bottom-3"),
    ])
    const terminalBoard = board([
      soldier("bottom-1", "bottom", { status: "STONE" }),
      soldier("bottom-2", "bottom", { status: "FALLEN", position: null }),
      soldier("bottom-3"),
    ])
    const chronicle = createChronicle(
      [
        event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
        event(
          "SOLDIER_STONED",
          1,
          { soldierId: "bottom-1", reason: "TURN_TO_STONE" },
          { actingPlayerId: "bottom", soldierId: "bottom-1" },
        ),
        event(
          "SOLDIER_FELL",
          2,
          { soldierId: "bottom-2", reason: "MOVED_OFF_BOARD" },
          { actingPlayerId: "bottom", soldierId: "bottom-2" },
        ),
        event("MATCH_ENDED", 3, { type: "DRAW" }),
      ],
      startBoard,
      terminalBoard,
    )

    expect(causeFor(chronicle, "bottom-1")).toContain("stone")
    expect(causeFor(chronicle, "bottom-2")).toContain("fallen")
    expect(causeFor(chronicle, "bottom-3")).toContain("match_ended")
  })

  it("does not expose private Strategy, memory, objective, grid, or runtime details", () => {
    const privateMarkers = [
      "PRIVATE_STRATEGY_SOURCE",
      "PRIVATE_STRATEGY_MEMORY",
      "PRIVATE_SOLDIER_MEMORY",
      "PRIVATE_OBJECTIVE_PAYLOAD",
      "PRIVATE_AWARENESS_GRID",
      "PRIVATE_RUNTIME_MESSAGE",
      "PRIVATE_RUNTIME_STACK",
    ]
    const chronicle = createChronicle([
      event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
      {
        ...event(
          "RUNTIME_VIOLATION",
          1,
          {
            type: "TIMEOUT",
            ownerPlayerId: "bottom",
            soldierId: "bottom-1",
            message: "PRIVATE_RUNTIME_MESSAGE",
            stack: "PRIVATE_RUNTIME_STACK",
            objectivePayload: "PRIVATE_OBJECTIVE_PAYLOAD",
            strategyMemory: "PRIVATE_STRATEGY_MEMORY",
            soldierMemory: "PRIVATE_SOLDIER_MEMORY",
            awarenessGrid: "PRIVATE_AWARENESS_GRID",
            source: "PRIVATE_STRATEGY_SOURCE",
          } as ChronicleEvent["payload"],
          { actingPlayerId: "bottom", soldierId: "bottom-1" },
        ),
        privateRef: "private:event:1",
      },
    ])
    chronicle.private = {
      byPlayerId: {
        bottom: {
          source: "PRIVATE_STRATEGY_SOURCE",
          strategyMemory: "PRIVATE_STRATEGY_MEMORY",
          soldierMemory: "PRIVATE_SOLDIER_MEMORY",
          objectivePayload: "PRIVATE_OBJECTIVE_PAYLOAD",
          awarenessGrid: "PRIVATE_AWARENESS_GRID",
        },
      },
    }

    const serialized = JSON.stringify(
      buildSoldierInactivityExplanations({
        chronicle,
        ownerPlayerId: "bottom",
      }),
    )

    for (const marker of privateMarkers) {
      expect(serialized).not.toContain(marker)
    }
  })

  it("is deterministic and links every explanation to a source sequence", () => {
    const chronicle = createChronicle([
      event("MATCH_STARTED", 0, { matchId: "debug-explanations-match" }),
      event(
        "MOVE_BLOCKED",
        1,
        { soldierId: "bottom-1", reason: "TERRAIN_STONE" },
        { actingPlayerId: "bottom", soldierId: "bottom-1" },
      ),
      event("MATCH_ENDED", 2, { type: "DRAW" }),
    ])

    const first = buildSoldierInactivityExplanations({ chronicle })
    const second = buildSoldierInactivityExplanations({ chronicle })

    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThan(0)
    expect(first.every((explanation) => explanation.sequence >= 0)).toBe(true)
  })
})
