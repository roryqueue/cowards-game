import {
  COMPATIBILITY_VERSIONS,
  type Chronicle,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import type { StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "./build.js"
import { createReplay } from "./reconstruct.js"

const turnToStoneRuntime: StrategyRuntime = {
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" },
        soldierMemory: {},
      },
    }
  },
}

const createBuiltChronicle = () =>
  buildChronicleFromMatch({
    matchId: "reconstruct-match",
    seed: "reconstruct-seed",
    arenaVariant: {
      id: "arena",
      name: "Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-rev",
    topStrategyRevisionId: "top-rev",
    runtime: turnToStoneRuntime,
  }).chronicle

const movementChronicle = (): Chronicle => {
  const startBoard = {
    bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
    terrainStones: [],
    soldiers: [
      {
        id: "mover",
        ownerPlayerId: "bottom",
        status: "ACTIVE" as const,
        position: { x: 1, y: 1 },
        facing: "RIGHT" as const,
        lastSuccessfulMoveDirection: null,
      },
      {
        id: "target",
        ownerPlayerId: "top",
        status: "ACTIVE" as const,
        position: { x: 2, y: 1 },
        facing: "UP" as const,
        lastSuccessfulMoveDirection: null,
      },
      {
        id: "victim",
        ownerPlayerId: "top",
        status: "ACTIVE" as const,
        position: { x: 1, y: 2 },
        facing: "UP" as const,
        lastSuccessfulMoveDirection: null,
      },
    ],
  }
  const finalBoard = {
    ...startBoard,
    soldiers: [
      {
        ...startBoard.soldiers[0]!,
        position: { x: 2, y: 1 },
        facing: "RIGHT" as const,
        lastSuccessfulMoveDirection: "RIGHT" as const,
      },
      { ...startBoard.soldiers[1]!, position: { x: 3, y: 1 } },
      { ...startBoard.soldiers[2]!, status: "STONE" as const },
    ],
  }
  const roundContext = { phaseNumber: 1, roundNumber: 1 as const }
  const activationContext = {
    ...roundContext,
    activationId: "1:1:0",
    activationIndex: 0,
    actingPlayerId: "bottom",
    soldierId: "mover",
  }

  return {
    schemaVersion: "chronicle-v1.4",
    reproducibility: {
      matchId: "movement-reconstruct",
      seed: "movement-seed",
      arenaVariantId: "arena",
      arenaVariantVersion: "0.1.0",
      strategyRevisionIds: ["bottom-rev", "top-rev"],
      versions: COMPATIBILITY_VERSIONS,
    },
    events: [
      {
        type: "MATCH_STARTED",
        sequence: 0,
        context: {},
        privacy: "public",
        payload: { matchId: "movement-reconstruct", seed: "movement-seed" },
      },
      {
        type: "ROUND_STARTED",
        sequence: 1,
        context: roundContext,
        privacy: "public",
        payload: { roundNumber: 1 },
      },
      {
        type: "STRATEGY_EVALUATED",
        sequence: 2,
        context: { ...roundContext, actingPlayerId: "bottom" },
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
        type: "PUSH_RESOLVED",
        sequence: 7,
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
        sequence: 8,
        context: { ...activationContext, cycleIndex: 0 },
        privacy: "public",
        payload: { soldierId: "mover", direction: "RIGHT" },
      },
      {
        type: "BACKSTAB_RESOLVED",
        sequence: 9,
        context: { ...activationContext, cycleIndex: 0 },
        privacy: "public",
        payload: {
          boundary: "cycle-end",
          pairs: [{ attackerId: "mover", victimId: "victim" }],
        },
      },
      {
        type: "SOLDIER_STONED",
        sequence: 10,
        context: { ...activationContext, cycleIndex: 0 },
        privacy: "public",
        payload: { soldierId: "victim", reason: "BACKSTAB" },
      },
      {
        type: "CYCLE_ENDED",
        sequence: 11,
        context: { ...activationContext, cycleIndex: 0 },
        privacy: "public",
        payload: { soldierId: "mover", cycleIndex: 0 },
      },
      {
        type: "MATCH_ENDED",
        sequence: 12,
        context: {},
        privacy: "public",
        payload: { type: "DRAW" },
      },
    ],
    snapshots: [
      { kind: "MATCH_START", sequence: 0, context: {}, board: startBoard },
      {
        kind: "ROUND_START",
        sequence: 1,
        context: roundContext,
        board: startBoard,
      },
      {
        kind: "ACTIVATION_START",
        sequence: 3,
        context: activationContext,
        board: startBoard,
      },
      {
        kind: "ACTIVATION_END",
        sequence: 11,
        context: activationContext,
        board: finalBoard,
      },
      {
        kind: "ROUND_END",
        sequence: 11,
        context: roundContext,
        board: finalBoard,
      },
      {
        kind: "MATCH_END",
        sequence: 12,
        context: {},
        board: finalBoard,
        outcome: { type: "DRAW" },
      },
      {
        kind: "TERMINAL",
        sequence: 12,
        context: {},
        board: finalBoard,
        outcome: { type: "DRAW" },
      },
    ],
  }
}

describe("createReplay", () => {
  it("reconstructs built Chronicle states without StrategyRuntime", () => {
    const chronicle = createBuiltChronicle()
    const replay = createReplay(chronicle)

    expect(replay.ok).toBe(true)
    if (!replay.ok) {
      return
    }

    const finalSequence = chronicle.events.at(-1)?.sequence ?? 0
    const final = replay.replay.stateAt(finalSequence)
    const terminalOutcome = chronicle.snapshots.find(
      (snapshot) => snapshot.kind === "TERMINAL",
    )?.outcome
    expect(final.ok).toBe(true)
    expect(final.ok ? final.state.outcome : undefined).toEqual(terminalOutcome)
  })

  it("applies movement, push, Backstab, stone, and match-end effects", () => {
    const replay = createReplay(movementChronicle())

    expect(replay.ok).toBe(true)
    if (!replay.ok) {
      return
    }

    const afterPush = replay.replay.stateAt(7)
    expect(afterPush.ok).toBe(true)
    expect(
      afterPush.ok
        ? afterPush.state.board.soldiers.find(
            (soldier) => soldier.id === "target",
          )?.position
        : undefined,
    ).toEqual({ x: 3, y: 1 })

    const afterMove = replay.replay.stateAt(8)
    expect(afterMove.ok).toBe(true)
    expect(
      afterMove.ok
        ? afterMove.state.board.soldiers.find(
            (soldier) => soldier.id === "mover",
          )
        : undefined,
    ).toMatchObject({
      position: { x: 2, y: 1 },
      facing: "RIGHT",
      lastSuccessfulMoveDirection: "RIGHT",
    })

    const final = replay.replay.stateAt(12)
    expect(final.ok).toBe(true)
    expect(
      final.ok
        ? final.state.board.soldiers.find((soldier) => soldier.id === "victim")
            ?.status
        : undefined,
    ).toBe("STONE")
    expect(final.ok ? final.state.outcome : undefined).toEqual({ type: "DRAW" })
  })

  it("iterates replay states in sequence order", () => {
    const chronicle = movementChronicle()
    const replay = createReplay(chronicle)

    expect(replay.ok).toBe(true)
    if (!replay.ok) {
      return
    }

    const entries = [...replay.replay.iterateReplay()]
    expect(entries.map((entry) => entry.sequence)).toEqual(
      chronicle.events.map((event) => event.sequence),
    )
    expect(entries.at(-1)?.state.outcome).toEqual({ type: "DRAW" })
  })

  it("returns typed errors for invalid Chronicles", () => {
    const chronicle = movementChronicle()
    const replay = createReplay({
      ...chronicle,
      snapshots: chronicle.snapshots.filter(
        (snapshot) => snapshot.kind !== "TERMINAL",
      ),
    })

    expect(replay.ok).toBe(false)
    expect(replay.ok ? [] : replay.errors.map((error) => error.code)).toContain(
      "SNAPSHOT_MISSING",
    )
  })
})
