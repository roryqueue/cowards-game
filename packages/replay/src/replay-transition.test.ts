import {
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
  type Chronicle,
  type ChronicleEvent,
  type FullBoardSnapshot,
  type SoldierSnapshot,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import { describe, expect, it } from "vitest"
import {
  createCurrentReplay,
  validateCurrentReplayReconstruction,
} from "./reconstruct.js"
import { validateCurrentTransitionPostconditions } from "./current-transition-postconditions.js"
import {
  type RecordedCanonicalTransitionV137,
} from "./record.js"
import {
  recordCurrentChronicleTestSupport as recordChronicleFromExecution,
  runCurrentMatchForReplayTestSupport,
} from "./test/current-recording.js"
import {
  compareCurrentReplayTransitionV137,
  resolveVersionedReplayTransitionEventContractV117,
  validateChronicleTransitions,
  type CurrentReplayTransitionField,
} from "./replay-transition.js"

describe("versioned runtime-v1.17 event vocabulary", () => {
  it("remains exact when another semantic authority is selected", () => {
    expect(
      resolveVersionedReplayTransitionEventContractV117(
        VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tupleId,
        "MATCH_STARTED",
      ),
    ).toBe("current-exact")
    expect(
      resolveVersionedReplayTransitionEventContractV117(
        VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tupleId,
        "UNKNOWN_EVENT",
      ),
    ).toBe("historical-or-unknown")
  })
})

const soldier = (
  id: string,
  overrides: Partial<SoldierSnapshot> = {},
): SoldierSnapshot => ({
  id,
  ownerPlayerId: id.startsWith("top") ? "top" : "bottom",
  status: "ACTIVE",
  position: { x: 1, y: 1 },
  facing: "RIGHT",
  lastSuccessfulMoveDirection: null,
  ...overrides,
})

const board = (
  soldiers: SoldierSnapshot[],
  bounds: FullBoardSnapshot["bounds"] = { minX: 0, maxX: 4, minY: 0, maxY: 4 },
): FullBoardSnapshot => ({
  bounds,
  terrainStones: [],
  soldiers,
})

const transitionChronicle = (
  event: ChronicleEvent,
  startBoard: FullBoardSnapshot,
  endBoard: FullBoardSnapshot,
  endOutcome?: Chronicle["snapshots"][number]["outcome"],
): Chronicle => ({
  schemaVersion: "chronicle-v1",
  reproducibility: {
    matchId: "transition-match",
    seed: "transition-seed",
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
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { matchId: "transition-match", seed: "transition-seed" },
    },
    event,
  ],
  snapshots: [
    { kind: "MATCH_START", sequence: 0, context: {}, board: startBoard },
    {
      kind: "TERMINAL",
      sequence: 1,
      context: {},
      board: endBoard,
      ...(endOutcome === undefined ? {} : { outcome: endOutcome }),
    },
  ],
})

const expectSnapshotMismatch = (chronicle: Chronicle): void => {
  expect(validateChronicleTransitions(chronicle)).toContainEqual(
    expect.objectContaining({ code: "SNAPSHOT_MISMATCH" }),
  )
}

describe("validateChronicleTransitions", () => {
  it.each([
    {
      name: "MOVE_ADVANCED",
      event: {
        type: "MOVE_ADVANCED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", direction: "RIGHT" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
    },
    {
      name: "PUSH_RESOLVED",
      event: {
        type: "PUSH_RESOLVED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: {
          soldierId: "mover",
          targetSoldierId: "top-target",
          pushedOffBoard: false,
        },
      } satisfies ChronicleEvent,
      start: board([
        soldier("mover"),
        soldier("top-target", { position: { x: 2, y: 1 } }),
      ]),
      contradicted: board([
        soldier("mover"),
        soldier("top-target", { position: { x: 2, y: 1 } }),
      ]),
    },
    {
      name: "SOLDIER_FELL",
      event: {
        type: "SOLDIER_FELL",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", reason: "MOVED_OFF_BOARD" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
    },
    {
      name: "SOLDIER_STONED",
      event: {
        type: "SOLDIER_STONED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", reason: "TURN_TO_STONE" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
    },
    {
      name: "CONTRACTION_RESOLVED",
      event: {
        type: "CONTRACTION_RESOLVED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { bounds: { minX: 1, maxX: 3, minY: 1, maxY: 3 } },
      } satisfies ChronicleEvent,
      start: board([soldier("mover", { position: { x: 0, y: 0 } })]),
      contradicted: board([soldier("mover", { position: { x: 0, y: 0 } })]),
    },
    {
      name: "MATCH_ENDED",
      event: {
        type: "MATCH_ENDED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { type: "DRAW" },
      } satisfies ChronicleEvent,
      start: board([soldier("mover")]),
      contradicted: board([soldier("mover")]),
      contradictedOutcome: { type: "WIN", winnerPlayerId: "bottom" } as const,
    },
  ])("rejects provable $name contradictions", (fixture) => {
    expectSnapshotMismatch(
      transitionChronicle(
        fixture.event,
        fixture.start,
        fixture.contradicted,
        fixture.contradictedOutcome,
      ),
    )
  })

  it("does not reject an unstated transition without a later boundary snapshot", () => {
    const start = board([soldier("mover")])
    const chronicle = transitionChronicle(
      {
        type: "MOVE_ADVANCED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "mover", direction: "RIGHT" },
      },
      start,
      start,
    )

    expect(
      validateChronicleTransitions({
        ...chronicle,
        snapshots: chronicle.snapshots.slice(0, 1),
      }),
    ).toEqual([])
  })

  it.each([
    {
      name: "TURN_RESOLVED",
      event: {
        type: "TURN_RESOLVED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "ghost", direction: "LEFT" },
      } satisfies ChronicleEvent,
    },
    {
      name: "SOLDIER_STONED",
      event: {
        type: "SOLDIER_STONED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "ghost", reason: "TURN_TO_STONE" },
      } satisfies ChronicleEvent,
    },
    {
      name: "SOLDIER_FELL",
      event: {
        type: "SOLDIER_FELL",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { soldierId: "ghost", reason: "MOVED_OFF_BOARD" },
      } satisfies ChronicleEvent,
    },
    {
      name: "BACKSTAB_RESOLVED",
      event: {
        type: "BACKSTAB_RESOLVED",
        sequence: 1,
        context: {},
        privacy: "public",
        payload: { pairs: [{ attackerId: "mover", victimId: "ghost" }] },
      } satisfies ChronicleEvent,
    },
  ])("rejects $name references to unknown Soldiers", ({ event }) => {
    expectSnapshotMismatch(
      transitionChronicle(
        event,
        board([soldier("mover")]),
        board([soldier("mover")]),
      ),
    )
  })
})

describe("current transition postconditions", () => {
  it("rejects an after-state that is not produced by its ordered events", () => {
    const unchanged = board([soldier("mover")])

    expect(
      validateCurrentTransitionPostconditions({
        transitions: [
          {
            beforeState: unchanged,
            afterState: unchanged,
            events: [
              {
                type: "MOVE_ADVANCED",
                sequence: 1,
                payload: { soldierId: "mover", direction: "RIGHT" },
              },
            ],
            terminalStatus: null,
          },
        ],
        finalOutcome: undefined,
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_TRANSITION_STATE_MISMATCH",
      transitionIndex: 0,
    })
  })

  it("rejects terminal status that disagrees with event and final outcome", () => {
    const start = board([soldier("mover")])
    const after = { ...start, outcome: { type: "DRAW" as const } }

    expect(
      validateCurrentTransitionPostconditions({
        transitions: [
          {
            beforeState: start,
            afterState: after,
            events: [
              {
                type: "MATCH_ENDED",
                sequence: 1,
                payload: { type: "DRAW" },
              },
            ],
            terminalStatus: { type: "WIN", winnerPlayerId: "bottom" },
          },
        ],
        finalOutcome: { type: "DRAW" },
      }),
    ).toEqual({
      ok: false,
      code: "CURRENT_TERMINAL_STATE_MISMATCH",
    })
  })
})

const candidateInput = () => {
  const runtime: StrategyRuntime = {
    selectActivations(input: StrategyInput) {
      return {
        ok: true,
        value: {
          activationOrders: input.mySoldiers
            .filter(({ status }) => status === "ACTIVE")
            .slice(0, input.activationCount)
            .map(({ id }) => ({ soldierId: id })),
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
  const execution = runCurrentMatchForReplayTestSupport({
    matchId: "candidate-reconstruction",
    seed: "candidate-reconstruction-seed",
    arenaVariant: {
      id: "candidate-reconstruction-arena",
      name: "Current Reconstruction Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    runtime: adaptRuntimeForCurrentKernel(runtime),
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
    execution,
  }
}

describe("current recorded transition equality", () => {
  it("rejects the first exact D-14 field mismatch with stable safe coordinates", () => {
    const input = candidateInput()
    const expected = input.recordedTransitions.find(
      ({ orderedEvents }) => orderedEvents.length > 1,
    )!
    const hash = `sha256:${"f".repeat(64)}`
    const mutations: ReadonlyArray<{
      readonly field: CurrentReplayTransitionField
      readonly mutate: (
        transition: RecordedCanonicalTransitionV137,
      ) => RecordedCanonicalTransitionV137
    }> = [
      {
        field: "ordinal",
        mutate: (transition) => ({ ...transition, ordinal: -1 }),
      },
      {
        field: "kind",
        mutate: (transition) => ({ ...transition, kind: "MUTATED_KIND" }),
      },
      {
        field: "semanticTupleId",
        mutate: (transition) => ({ ...transition, semanticTupleId: hash }),
      },
      {
        field: "coordinates",
        mutate: (transition) => ({
          ...transition,
          coordinates: { ...transition.coordinates, stage: "mutated-stage" },
        }),
      },
      {
        field: "resultClass",
        mutate: (transition) => ({
          ...transition,
          resultClass:
            transition.resultClass === "success"
              ? "player_violation"
              : "success",
        }),
      },
      {
        field: "canonicalOutputHash",
        mutate: (transition) => ({
          ...transition,
          canonicalOutputHash: hash,
        }),
      },
      {
        field: "strategyMemoryHash",
        mutate: (transition) => ({ ...transition, strategyMemoryHash: hash }),
      },
      {
        field: "soldierMemoryHash",
        mutate: (transition) => ({ ...transition, soldierMemoryHash: hash }),
      },
      {
        field: "objectiveHash",
        mutate: (transition) => ({ ...transition, objectiveHash: hash }),
      },
      {
        field: "orderedEvents",
        mutate: (transition) => ({
          ...transition,
          orderedEvents: [...transition.orderedEvents].reverse(),
        }),
      },
      {
        field: "orderedEventsHash",
        mutate: (transition) => ({ ...transition, orderedEventsHash: hash }),
      },
      {
        field: "beforeStateHash",
        mutate: (transition) => ({ ...transition, beforeStateHash: hash }),
      },
      {
        field: "afterStateHash",
        mutate: (transition) => ({ ...transition, afterStateHash: hash }),
      },
      {
        field: "beforeMachineHash",
        mutate: (transition) => ({ ...transition, beforeMachineHash: hash }),
      },
      {
        field: "afterMachineHash",
        mutate: (transition) => ({ ...transition, afterMachineHash: hash }),
      },
      {
        field: "terminalStatus",
        mutate: (transition) => ({
          ...transition,
          terminalStatus:
            transition.terminalStatus === null ? { type: "DRAW" } : null,
        }),
      },
      {
        field: "failureStatus",
        mutate: (transition) =>
          ({
            ...transition,
            failureStatus: "mutated",
          }) as unknown as RecordedCanonicalTransitionV137,
      },
      {
        field: "terminalHash",
        mutate: (transition) => ({ ...transition, terminalHash: hash }),
      },
      {
        field: "accumulatedTraceRoot",
        mutate: (transition) => ({
          ...transition,
          accumulatedTraceRoot: hash,
        }),
      },
    ]

    for (const { field, mutate } of mutations) {
      expect(
        compareCurrentReplayTransitionV137(
          expected,
          mutate(globalThis.structuredClone(expected)),
          7,
        ),
        field,
      ).toEqual({
        ok: false,
        code: "CURRENT_TRANSITION_FIELD_MISMATCH",
        transitionIndex: 7,
        field,
      })
    }
  })

  it("accepts exact transition equality without exposing compared values", () => {
    const transition = candidateInput().recordedTransitions[0]!

    expect(
      compareCurrentReplayTransitionV137(
        transition,
        globalThis.structuredClone(transition),
        0,
      ),
    ).toEqual({ ok: true })
  })
})

describe("candidate replay reconstruction equivalence", () => {
  it("reconstructs every transition and the exact terminal outcome without scheduling", () => {
    const input = candidateInput()
    const result = validateCurrentReplayReconstruction(input)

    expect(result).toMatchObject({
      ok: true,
      terminalStateHash: input.boundaryAnchors.at(-1)?.stateHash,
      outcome:
        input.execution.kind === "completed"
          ? input.execution.recorderMaterial.finalState.outcome
          : undefined,
    })
    const replay = createCurrentReplay({
      profile: input.profile,
      compatibility: input.compatibility,
      chronicle: input.chronicle,
      boundaryAnchors: input.boundaryAnchors,
      execution: input.execution,
    })
    expect(replay.ok).toBe(true)
    if (!replay.ok) return
    const terminalSequence = input.chronicle.events.at(-1)?.sequence ?? -1
    expect(replay.replay.stateAt(terminalSequence)).toMatchObject({
      ok: true,
      state: { outcome: input.chronicle.snapshots.at(-1)?.outcome },
    })
  })

  it("rejects an intermediate projection that contradicts its events", () => {
    const input = candidateInput()
    if (input.execution.kind !== "completed") throw new Error("not completed")
    const transitionIndex = input.execution.transitions.findIndex(
      ({ events }) => events.some(({ type }) => type === "SOLDIER_STONED"),
    )
    expect(transitionIndex).toBeGreaterThanOrEqual(0)
    const transition = input.execution.transitions[transitionIndex]!
    const soldierId = transition.events.find(
      ({ type }) => type === "SOLDIER_STONED",
    )?.payload as { soldierId?: string }
    const afterState = globalThis.structuredClone(transition.afterState) as {
      soldiers: Array<{ id: string; status: string }>
    }
    const soldier = afterState.soldiers.find(
      ({ id }) => id === soldierId.soldierId,
    )
    if (soldier) soldier.status = "ACTIVE"
    const transitions = input.execution.transitions.map((value, index) =>
      index === transitionIndex ? { ...value, afterState } : value,
    )
    const result = validateCurrentReplayReconstruction({
      ...input,
      execution: {
        ...input.execution,
        transitions,
        recorderMaterial: {
          ...input.execution.recorderMaterial,
          boundaries: transitions,
        },
      },
    })

    expect(result).toEqual({
      ok: false,
      code: "CURRENT_TRANSITION_STATE_MISMATCH",
      transitionIndex,
    })
  })

  it("rejects any event after the one final MATCH_ENDED", () => {
    const input = candidateInput()
    const terminal = input.chronicle.events.at(-1)!
    const result = validateCurrentReplayReconstruction({
      ...input,
      chronicle: {
        ...input.chronicle,
        events: [
          ...input.chronicle.events,
          { ...terminal, sequence: terminal.sequence + 1 },
        ],
      },
    })

    expect(result).toEqual({
      ok: false,
      code: "CURRENT_TERMINAL_EVENT_INVALID",
    })
  })

  it("standalone reconstruction rejects a forged terminal state hash", () => {
    const input = candidateInput()
    if (input.execution.kind !== "completed") throw new Error("not completed")
    const lastIndex = input.execution.transitions.length - 1
    const transitions = input.execution.transitions.map((transition, index) =>
      index === lastIndex
        ? { ...transition, afterStateHash: `sha256:${"0".repeat(64)}` }
        : transition,
    )
    expect(
      validateCurrentReplayReconstruction({
        ...input,
        execution: {
          ...input.execution,
          transitions,
          recorderMaterial: {
            ...input.execution.recorderMaterial,
            boundaries: transitions,
          },
        },
      }),
    ).toMatchObject({
      ok: false,
      code: "CURRENT_TRANSITION_STATE_MISMATCH",
      transitionIndex: lastIndex,
    })
  })
})
