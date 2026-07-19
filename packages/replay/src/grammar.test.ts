import type {
  Chronicle,
  ChronicleEvent,
  ChronicleEventType,
  ChronicleValidationErrorCode,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import { MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import { describe, expect, it } from "vitest"
import {
  advanceCurrentChronicleGrammar,
  createCurrentChronicleGrammarState,
  validateChronicleGrammar,
} from "./grammar.js"
import {
  recordCurrentChronicleTestSupport as recordChronicleFromExecution,
  runCurrentMatchForReplayTestSupport,
} from "./test/current-recording.js"
import { validateCurrentChronicle } from "./validate.js"

const runtime: StrategyRuntime = {
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

const createChronicle = (
  strategyRuntime: StrategyRuntime = runtime,
): Chronicle => {
  const execution = runCurrentMatchForReplayTestSupport({
    matchId: "grammar-match",
    seed: "grammar-seed",
    arenaVariant: {
      id: "grammar-arena",
      name: "Grammar Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-rev",
    topStrategyRevisionId: "top-rev",
    runtime: adaptRuntimeForCurrentKernel(strategyRuntime),
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
  const candidate = validateCurrentChronicle({
    profile: "current-exact",
    compatibility: recorded.semanticIdentity,
    chronicle: recorded.chronicle,
    boundaryAnchors: recorded.boundaryAnchors,
    execution,
  })
  if (!candidate.ok) throw new Error(candidate.issues[0]?.code)
  return recorded.chronicle
}

const cloneChronicle = (chronicle: Chronicle): Chronicle =>
  JSON.parse(JSON.stringify(chronicle)) as Chronicle

const resequenceEvents = (
  events: readonly ChronicleEvent[],
): ChronicleEvent[] => events.map((event, sequence) => ({ ...event, sequence }))

const findEvent = (
  chronicle: Chronicle,
  type: ChronicleEventType,
): ChronicleEvent => {
  const event = chronicle.events.find((candidate) => candidate.type === type)
  if (!event) {
    throw new Error(`Fixture Chronicle is missing ${type}.`)
  }
  return event
}

const mutateFirstEvent = (
  chronicle: Chronicle,
  type: ChronicleEventType,
  mutate: (event: ChronicleEvent) => ChronicleEvent,
): Chronicle => ({
  ...chronicle,
  events: chronicle.events.map((event) =>
    event.type === type ? mutate(event) : event,
  ),
})

const errorsFor = (
  chronicle: Chronicle,
): readonly { code: ChronicleValidationErrorCode; sequence?: number }[] =>
  validateChronicleGrammar(chronicle).map((error) => ({
    code: error.code,
    ...(error.sequence === undefined ? {} : { sequence: error.sequence }),
  }))

const payloadObject = (event: ChronicleEvent): Record<string, unknown> =>
  event.payload !== null &&
  typeof event.payload === "object" &&
  !Array.isArray(event.payload)
    ? event.payload
    : {}

const expectErrorCode = (
  chronicle: Chronicle,
  code: ChronicleValidationErrorCode,
): void => {
  expect(validateChronicleGrammar(chronicle)).toContainEqual(
    expect.objectContaining({ code }),
  )
}

describe("validateChronicleGrammar", () => {
  it("accepts a legal Chronicle built from a Match", () => {
    expect(validateChronicleGrammar(createChronicle())).toEqual([])
  })

  it("accepts canonical no-Advance cleanup after the final Cycle", () => {
    const noAdvanceRuntime: StrategyRuntime = {
      ...runtime,
      runSoldierBrain() {
        return {
          ok: true,
          value: {
            action: { type: "TURN", direction: "RIGHT" },
            soldierMemory: {},
          },
        }
      },
    }
    const chronicle = createChronicle(noAdvanceRuntime)

    expect(
      chronicle.events.some(
        (event) =>
          event.type === "SOLDIER_STONED" &&
          payloadObject(event).reason === "NO_ADVANCE",
      ),
    ).toBe(true)
    expect(validateChronicleGrammar(chronicle)).toEqual([])
  }, 15_000)

  it.each([
    {
      name: "event before MATCH_STARTED",
      mutate(base: Chronicle): Chronicle {
        return {
          ...base,
          events: [
            findEvent(base, "ACTION_EMITTED"),
            findEvent(base, "MATCH_STARTED"),
          ],
        }
      },
      code: "REQUIRED_EVENT_MISSING",
    },
    {
      name: "ROUND_STARTED without an open Match",
      mutate(base: Chronicle): Chronicle {
        return { ...base, events: [findEvent(base, "ROUND_STARTED")] }
      },
      code: "REQUIRED_EVENT_MISSING",
    },
    {
      name: "ACTIVATION_STARTED without an open Round",
      mutate(base: Chronicle): Chronicle {
        return {
          ...base,
          events: [
            findEvent(base, "MATCH_STARTED"),
            findEvent(base, "ACTIVATION_STARTED"),
          ],
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "cycle event without an open Activation",
      mutate(base: Chronicle): Chronicle {
        return {
          ...base,
          events: [
            findEvent(base, "MATCH_STARTED"),
            findEvent(base, "ROUND_STARTED"),
            findEvent(base, "AWARENESS_GRID_OBSERVED"),
          ],
        }
      },
      code: "REQUIRED_EVENT_MISSING",
    },
    {
      name: "duplicate MATCH_ENDED",
      mutate(base: Chronicle): Chronicle {
        const terminal = findEvent(base, "MATCH_ENDED")
        return {
          ...base,
          events: [
            ...base.events,
            { ...terminal, sequence: base.events.length },
          ],
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "event after MATCH_ENDED",
      mutate(base: Chronicle): Chronicle {
        return {
          ...base,
          events: [
            ...base.events,
            {
              ...findEvent(base, "ROUND_STARTED"),
              sequence: base.events.length,
            },
          ],
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "missing terminal MATCH_ENDED",
      mutate(base: Chronicle): Chronicle {
        return {
          ...base,
          events: base.events.filter((event) => event.type !== "MATCH_ENDED"),
        }
      },
      code: "REQUIRED_EVENT_MISSING",
    },
  ] as const)("rejects invalid event windows: $name", ({ mutate, code }) => {
    expectErrorCode(mutate(createChronicle()), code)
  })

  it.each([
    {
      name: "round context",
      type: "ROUND_STARTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return { ...event, context: {} }
      },
    },
    {
      name: "activation context",
      type: "ACTIVATION_STARTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        const { activationId: _activationId, ...context } = event.context
        return { ...event, context }
      },
    },
    {
      name: "cycle context",
      type: "ACTION_EMITTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        const { cycleIndex: _cycleIndex, ...context } = event.context
        return { ...event, context }
      },
    },
    {
      name: "soldier context",
      type: "ACTION_EMITTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        const { soldierId: _soldierId, ...context } = event.context
        return { ...event, context }
      },
    },
    {
      name: "player context",
      type: "STRATEGY_EVALUATED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        const { actingPlayerId: _actingPlayerId, ...context } = event.context
        return { ...event, context }
      },
    },
  ] as const)("rejects missing required $name", ({ type, mutate }) => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      type,
      mutate,
    )

    expectErrorCode(chronicle, "CONTEXT_MISSING")
  })

  it.each([
    {
      name: "round mismatch",
      type: "STRATEGY_EVALUATED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return { ...event, context: { ...event.context, roundNumber: 2 } }
      },
    },
    {
      name: "cycle mismatch",
      type: "ACTION_EMITTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return { ...event, context: { ...event.context, cycleIndex: 1 } }
      },
    },
  ] as const)("rejects $name", ({ type, mutate }) => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      type,
      mutate,
    )

    expectErrorCode(chronicle, "CONTEXT_MISMATCH")
  })

  it.each([
    {
      name: "ROUND_STARTED roundNumber",
      type: "ROUND_STARTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return { ...event, payload: { roundNumber: 2 } }
      },
    },
    {
      name: "soldier payload",
      type: "ACTION_EMITTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return {
          ...event,
          payload: { ...payloadObject(event), soldierId: "other-soldier" },
        }
      },
    },
    {
      name: "STRATEGY_EVALUATED playerId",
      type: "STRATEGY_EVALUATED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return { ...event, payload: { playerId: "other-player" } }
      },
    },
    {
      name: "RUNTIME_VIOLATION ownerPlayerId",
      type: "STRATEGY_EVALUATED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return {
          ...event,
          type: "RUNTIME_VIOLATION",
          payload: { type: "TIMEOUT", ownerPlayerId: "other-player" },
        }
      },
    },
    {
      name: "cycleIndex payload",
      type: "AWARENESS_GRID_OBSERVED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return { ...event, payload: { ...payloadObject(event), cycleIndex: 1 } }
      },
    },
  ] as const)("rejects inconsistent $name", ({ type, mutate }) => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      type,
      mutate,
    )

    expectErrorCode(chronicle, "PAYLOAD_INCONSISTENT")
  })

  it("returns stable sequence data for corrupted fixtures", () => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      "ACTION_EMITTED",
      (event) => ({
        ...event,
        payload: { ...payloadObject(event), soldierId: "other-soldier" },
      }),
    )

    expect(errorsFor(chronicle)).toEqual(
      expect.arrayContaining([
        { code: "PAYLOAD_INCONSISTENT", sequence: expect.any(Number) },
      ]),
    )
  })

  it("rejects activation indices outside the Round Activation window", () => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      "ACTIVATION_STARTED",
      (event) => ({
        ...event,
        context: { ...event.context, activationIndex: 99 },
      }),
    )

    expectErrorCode(chronicle, "EVENT_WINDOW_INVALID")
  })

  it("rejects cycle indices outside the Activation Cycle window", () => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      "AWARENESS_GRID_OBSERVED",
      (event) => ({
        ...event,
        context: { ...event.context, cycleIndex: 99 },
        payload: { ...payloadObject(event), cycleIndex: 99 },
      }),
    )

    expectErrorCode(chronicle, "EVENT_WINDOW_INVALID")
  })

  it("rejects skipped Activation cycles", () => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      "AWARENESS_GRID_OBSERVED",
      (event) => ({
        ...event,
        context: { ...event.context, cycleIndex: 1 },
        payload: { ...payloadObject(event), cycleIndex: 1 },
      }),
    )

    expectErrorCode(chronicle, "CONTEXT_MISMATCH")
  })

  it("rejects abandoning an open Cycle before ACTION_EMITTED", () => {
    const chronicle = mutateFirstEvent(
      cloneChronicle(createChronicle()),
      "ACTION_EMITTED",
      (event) => ({
        ...event,
        type: "MOVE_BLOCKED",
        payload: {
          soldierId: event.context.soldierId ?? "missing-soldier",
          reason: "BLOCKED_BY_STONE",
        },
      }),
    )

    expectErrorCode(chronicle, "EVENT_WINDOW_INVALID")
  })

  it("tracks interleaved activation slots independently in deterministic frozen state", () => {
    const firstRound = createChronicle().events.filter(
      (event) => event.sequence <= 39,
    )
    let state = createCurrentChronicleGrammarState()

    for (const event of firstRound) {
      const advanced = advanceCurrentChronicleGrammar(state, event)
      expect(advanced).toMatchObject({ ok: true })
      if (!advanced.ok) throw new Error(advanced.error.code)
      state = advanced.state
    }

    expect(state.activationSlots.map((slot) => slot.activationIndex)).toEqual([
      0, 1,
    ])
    expect(
      state.activationSlots.map((slot) => ({
        activationId: slot.activationId,
        actingPlayerId: slot.actingPlayerId,
        soldierId: slot.soldierId,
        closed: slot.closed,
        nextCycleIndex: slot.nextCycleIndex,
        hasAdvancedThisActivation: slot.hasAdvancedThisActivation,
        terminalReason: slot.terminalReason,
      })),
    ).toEqual([
      {
        activationId: "1:1:0",
        actingPlayerId: "top",
        soldierId: "top-soldier-1",
        closed: true,
        nextCycleIndex: 12,
        hasAdvancedThisActivation: false,
        terminalReason: "SOLDIER_STONED",
      },
      {
        activationId: "1:1:1",
        actingPlayerId: "bottom",
        soldierId: "bottom-soldier-1",
        closed: true,
        nextCycleIndex: 12,
        hasAdvancedThisActivation: false,
        terminalReason: "SOLDIER_STONED",
      },
    ])
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.activationSlots)).toBe(true)
    expect(state.activationSlots.every(Object.isFrozen)).toBe(true)
    expect(
      Array.isArray(
        (
          JSON.parse(JSON.stringify(state)) as {
            activationSlots: unknown
          }
        ).activationSlots,
      ),
    ).toBe(true)
  })

  it("rejects an actor sequence that cannot follow canonical Round initiative and snake order", () => {
    const base = createChronicle()
    const firstRoundStarts = base.events
      .filter(
        (event) =>
          event.type === "ACTIVATION_STARTED" &&
          event.context.phaseNumber === 1 &&
          event.context.roundNumber === 1,
      )
      .slice(0, 2)
    expect(firstRoundStarts).toHaveLength(2)
    const targetActivationId = firstRoundStarts[0]!.context.activationId!
    const duplicateActor = firstRoundStarts[1]!.context.actingPlayerId!
    const chronicle = {
      ...base,
      events: base.events.map((event) =>
        event.context.activationId === targetActivationId
          ? {
              ...event,
              context: {
                ...event.context,
                actingPlayerId: duplicateActor,
              },
            }
          : event,
      ),
    }

    expect(validateChronicleGrammar(chronicle)[0]).toEqual(
      expect.objectContaining({
        code: "CONTEXT_MISMATCH",
        sequence: firstRoundStarts[1]!.sequence,
      }),
    )
  })

  it("rejects the first Round boundary that would discard an unclosed retained slot", () => {
    const base = createChronicle()
    const targetActivationId = base.events.find(
      (event) =>
        event.type === "ACTIVATION_STARTED" &&
        event.context.phaseNumber === 1 &&
        event.context.roundNumber === 1,
    )!.context.activationId!
    const nextRoundIndex = base.events.findIndex(
      (event) =>
        event.type === "ROUND_STARTED" &&
        event.context.phaseNumber === 1 &&
        event.context.roundNumber === 2,
    )
    expect(nextRoundIndex).toBeGreaterThan(0)
    const events = resequenceEvents(
      base.events.filter(
        (event, index) =>
          !(
            index < nextRoundIndex &&
            event.context.activationId === targetActivationId &&
            (event.type === "ACTIVATION_ENDED" ||
              event.type === "ACTIVATION_SKIPPED")
          ),
      ),
    )
    const roundBoundary = events.find(
      (event) =>
        event.type === "ROUND_STARTED" &&
        event.context.phaseNumber === 1 &&
        event.context.roundNumber === 2,
    )!

    expect(validateChronicleGrammar({ ...base, events })[0]).toEqual(
      expect.objectContaining({
        code: "EVENT_WINDOW_INVALID",
        sequence: roundBoundary.sequence,
      }),
    )
  })

  it.each([
    {
      name: "duplicate Activation start",
      mutate(base: Chronicle): Chronicle {
        const duplicate = base.events[5]!
        return {
          ...base,
          events: resequenceEvents([
            ...base.events.slice(0, 6),
            duplicate,
            ...base.events.slice(6),
          ]),
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "wrong actor for an open slot",
      mutate(base: Chronicle): Chronicle {
        return mutateFirstEvent(base, "AWARENESS_GRID_OBSERVED", (event) => ({
          ...event,
          context: { ...event.context, actingPlayerId: "bottom" },
        }))
      },
      code: "CONTEXT_MISMATCH",
    },
    {
      name: "skipped first Cycle",
      mutate(base: Chronicle): Chronicle {
        return mutateFirstEvent(base, "CYCLE_STARTED", (event) => ({
          ...event,
          context: { ...event.context, cycleIndex: 1 },
          payload: { ...payloadObject(event), cycleIndex: 1 },
        }))
      },
      code: "CONTEXT_MISMATCH",
    },
    {
      name: "another slot at an open boundary",
      mutate(base: Chronicle): Chronicle {
        const wrongSlot = base.events[13]!
        return {
          ...base,
          events: resequenceEvents([
            ...base.events.slice(0, 7),
            wrongSlot,
            ...base.events.slice(7),
          ]),
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "Cycle after its slot closed",
      mutate(base: Chronicle): Chronicle {
        const closedSlotCycle = base.events[6]!
        return {
          ...base,
          events: resequenceEvents([
            ...base.events.slice(0, 12),
            closedSlotCycle,
            ...base.events.slice(12),
          ]),
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "duplicate Activation end",
      mutate(base: Chronicle): Chronicle {
        const duplicate = base.events[11]!
        return {
          ...base,
          events: resequenceEvents([
            ...base.events.slice(0, 12),
            duplicate,
            ...base.events.slice(12),
          ]),
        }
      },
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "terminal reason mismatch",
      mutate(base: Chronicle): Chronicle {
        return mutateFirstEvent(base, "ACTIVATION_ENDED", (event) => ({
          ...event,
          payload: {
            ...payloadObject(event),
            reason: "CYCLE_EXHAUSTED",
          },
        }))
      },
      code: "PAYLOAD_INCONSISTENT",
    },
    {
      name: "Advance history contradicts no-Advance cleanup",
      mutate(base: Chronicle): Chronicle {
        const terminal = findEvent(base, "SOLDIER_STONED")
        const advanced: ChronicleEvent = {
          ...terminal,
          type: "MOVE_ADVANCED",
          payload: {
            soldierId: terminal.context.soldierId ?? "missing-soldier",
            from: { x: 0, y: 0 },
            to: { x: 0, y: 1 },
          },
        }
        const { cycleIndex: _cycleIndex, ...activationContext } =
          terminal.context
        const noAdvance = {
          ...terminal,
          context: activationContext,
          payload: {
            ...payloadObject(terminal),
            reason: "NO_ADVANCE",
          },
        }
        return {
          ...base,
          events: resequenceEvents([
            ...base.events.slice(0, 9),
            advanced,
            noAdvance,
            ...base.events.slice(10),
          ]),
        }
      },
      code: "PAYLOAD_INCONSISTENT",
    },
  ] as const)(
    "rejects per-slot lifecycle corruption: $name",
    ({ mutate, code }) => {
      expect(validateChronicleGrammar(mutate(createChronicle()))[0]).toEqual(
        expect.objectContaining({ code }),
      )
    },
  )

  it("does not mutate grammar state when the first event is rejected", () => {
    const prefix = createChronicle().events.slice(0, 7)
    let state = createCurrentChronicleGrammarState()
    for (const event of prefix) {
      const advanced = advanceCurrentChronicleGrammar(state, event)
      if (!advanced.ok) throw new Error(advanced.error.code)
      state = advanced.state
    }
    const serializedBefore = JSON.stringify(state)
    const awareness = findEvent(createChronicle(), "AWARENESS_GRID_OBSERVED")
    const invalidAwareness: ChronicleEvent = {
      ...awareness,
      context: { ...awareness.context, cycleIndex: 1 },
      payload: { ...payloadObject(awareness), cycleIndex: 1 },
    }

    const rejected = advanceCurrentChronicleGrammar(state, invalidAwareness)

    expect(rejected).toMatchObject({
      ok: false,
      error: { code: "CONTEXT_MISMATCH" },
    })
    expect(rejected.state).toBe(state)
    expect(JSON.stringify(state)).toBe(serializedBefore)

    const accepted = advanceCurrentChronicleGrammar(state, awareness)
    expect(accepted).toMatchObject({
      ok: true,
      state: {
        openCycle: {
          activationId: "1:1:0",
          cycleIndex: 0,
          boundary: "observed",
        },
      },
    })
  })
})
