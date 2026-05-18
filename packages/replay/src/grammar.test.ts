import type {
  Chronicle,
  ChronicleEvent,
  ChronicleEventType,
  ChronicleValidationErrorCode,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import type { StrategyRuntime } from "@cowards/engine"
import { describe, expect, it } from "vitest"
import { buildChronicleFromMatch } from "./build.js"
import { validateChronicleGrammar } from "./grammar.js"

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

const createChronicle = (): Chronicle =>
  buildChronicleFromMatch({
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
    runtime,
  }).chronicle

const cloneChronicle = (chronicle: Chronicle): Chronicle =>
  JSON.parse(JSON.stringify(chronicle)) as Chronicle

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
      code: "EVENT_WINDOW_INVALID",
    },
    {
      name: "ROUND_STARTED without an open Match",
      mutate(base: Chronicle): Chronicle {
        return { ...base, events: [findEvent(base, "ROUND_STARTED")] }
      },
      code: "EVENT_WINDOW_INVALID",
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
      code: "EVENT_WINDOW_INVALID",
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
      name: "activation mismatch",
      type: "ACTION_EMITTED",
      mutate(event: ChronicleEvent): ChronicleEvent {
        return {
          ...event,
          context: { ...event.context, activationId: "other-activation" },
        }
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

    expectErrorCode(chronicle, "EVENT_WINDOW_INVALID")
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
})
