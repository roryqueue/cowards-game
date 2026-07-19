import type { Chronicle, SoldierBrainInput, StrategyInput } from "@cowards/spec"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import {
  createCurrentReplay,
  createHistoricalV14Replay,
  validateCurrentReplayReconstruction,
} from "./reconstruct.js"
import {
  recordCurrentChronicleTestSupport as recordChronicleFromExecution,
  runCurrentMatchForReplayTestSupport,
  selectedCurrentReconstructionAuthorityTestSupport,
} from "./test/current-recording.js"

const HISTORICAL_V14_VERSIONS = Object.freeze({
  spec: "cowards-rules-v1.4",
  engine: "0.1.4",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-v1.4",
  strategyRevision: "0.1.4",
  arenaVariant: "0.1.0",
})

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

const createBuiltCurrentInput = () => {
  const execution = runCurrentMatchForReplayTestSupport({
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
    runtime: adaptRuntimeForCurrentKernel(turnToStoneRuntime),
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: MATCH_KERNEL.tupleId,
      semanticTuple: MATCH_KERNEL.tuple,
    },
  })
  if (!recorded.ok) throw new Error(recorded.failure.code)
  return {
    profile: "current-exact" as const,
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    recordedTransitions: recorded.recordedTransitions,
    transitionTraceRoot: recorded.transitionTraceRoot,
    recordedFinalState: recorded.finalState,
    recordedOutcome: recorded.finalState.outcome,
    execution,
    ...selectedCurrentReconstructionAuthorityTestSupport(recorded),
  }
}

const createHistoricalReplay = (chronicle: Chronicle) =>
  createHistoricalV14Replay({
    profile: "historical-v1.4",
    chronicle,
  })

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
      versions: HISTORICAL_V14_VERSIONS,
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
  it("keeps historical replay calls isolated from mutable current transitions", () => {
    const source = readFileSync(
      new URL("./reconstruct.ts", import.meta.url),
      "utf8",
    )
    const historicalBody = source.slice(
      source.indexOf("const createHistoricalValidatedReplay"),
      source.indexOf("const CURRENT_STATE_HASH_DOMAIN"),
    )

    expect(historicalBody).toContain("applyHistoricalV14Transition")
    expect(historicalBody).not.toContain("createValidatedReplay")
    expect(historicalBody).not.toContain("applyReplayEvent")
  })

  it("reconstructs built Chronicle states without StrategyRuntime", () => {
    const input = createBuiltCurrentInput()
    const chronicle = input.chronicle
    const replay = createCurrentReplay({
      profile: input.profile,
      compatibility: input.compatibility,
      chronicle: input.chronicle,
      boundaryAnchors: input.boundaryAnchors,
      execution: input.execution,
    })

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
    const replay = createHistoricalReplay(movementChronicle())

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
    const replay = createHistoricalReplay(chronicle)

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
    const replay = createHistoricalReplay({
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

describe("current reconstruction evidence closure", () => {
  it("validates semantics exactly once before exact transition and final proof", () => {
    const input = createBuiltCurrentInput()
    const before = JSON.stringify(input)
    const source = readFileSync(
      new URL("./reconstruct.ts", import.meta.url),
      "utf8",
    )
    const body = source.slice(
      source.indexOf("export const validateCurrentReplayReconstruction"),
      source.indexOf("export type CreateCurrentReplayResult"),
    )

    expect(validateCurrentReplayReconstruction(input)).toEqual({
      ok: true,
      terminalStateHash: input.boundaryAnchors.at(-1)?.stateHash,
      transitionTraceRoot: input.transitionTraceRoot,
      transitionCount: input.recordedTransitions.length,
      outcome: input.recordedOutcome,
    })
    expect(
      body.match(/validateCurrentChronicleSemantics\(/gu) ?? [],
    ).toHaveLength(1)
    expect(body).not.toContain("validateCurrentChronicle(")
    expect(JSON.stringify(input)).toBe(before)
  })

  it("rejects the first and later recorded transition mismatch before later proof", () => {
    const input = createBuiltCurrentInput()
    const laterIndex = Math.floor(input.recordedTransitions.length / 2)

    expect(
      validateCurrentReplayReconstruction({
        ...input,
        recordedTransitions: input.recordedTransitions.slice(0, -1),
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_TRANSITION_COUNT_MISMATCH",
      transitionIndex: input.recordedTransitions.length - 1,
    })

    for (const transitionIndex of [0, laterIndex]) {
      const recordedTransitions = input.recordedTransitions.map(
        (transition, index) =>
          index === transitionIndex
            ? { ...transition, kind: `${transition.kind}:MUTATED` }
            : transition,
      )
      expect(
        validateCurrentReplayReconstruction({
          ...input,
          recordedTransitions,
        }),
      ).toEqual({
        ok: false,
        code: "CURRENT_TRANSITION_FIELD_MISMATCH",
        transitionIndex,
        field: "kind",
      })
    }
  })

  it("keeps validation, final state, outcome, and trace-root failures distinct", () => {
    const input = createBuiltCurrentInput()
    const terminalAnchorIndex = input.boundaryAnchors.length - 1
    const invalidAnchors = input.boundaryAnchors.map((anchor, index) =>
      index === terminalAnchorIndex
        ? { ...anchor, stateHash: `sha256:${"0".repeat(64)}` }
        : anchor,
    )
    expect(
      validateCurrentReplayReconstruction({
        ...input,
        boundaryAnchors: invalidAnchors,
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_SEMANTIC_ADMISSION_INVALID",
    })

    expect(
      validateCurrentReplayReconstruction({
        ...input,
        recordedFinalState: {
          ...globalThis.structuredClone(input.recordedFinalState),
          seed: "mutated-final-seed",
        },
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_FINAL_STATE_MISMATCH",
    })

    expect(
      validateCurrentReplayReconstruction({
        ...input,
        recordedOutcome: { type: "FAILED", reason: "MUTATED_OUTCOME" },
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_OUTCOME_MISMATCH",
    })

    expect(
      validateCurrentReplayReconstruction({
        ...input,
        transitionTraceRoot: `sha256:${"f".repeat(64)}`,
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_TRACE_ROOT_MISMATCH",
    })
  })
})
