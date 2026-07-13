import { createHash } from "node:crypto"
import { COMPATIBILITY_VERSIONS } from "@cowards/spec"
import type {
  Action,
  JsonValue,
  MatchOutcome,
  Soldier,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import { createActivationSlots } from "../activation.js"
import {
  resolveActivationCycle,
  resolveActivationSelection,
} from "./v1-4-legacy-activation.js"
import { resolveBackstabBoundary } from "../backstab.js"
import { resolveContraction } from "../contraction.js"
import { MATCH_KERNEL } from "../kernel/driver.js"
import { runHistoricalV14RoundFromState } from "../kernel/driver.js"
import { resolveAction } from "../movement.js"
import { createInitialGameState } from "../state.js"
import {
  success,
  violation,
  type ActivationSlotState,
  type GameState,
  type RuntimeResult,
  type StrategyRuntime,
  type TransitionEventSummary,
  type TransitionResult,
} from "../types.js"

export const V1_4_COMPATIBILITY_CORPUS_VERSION =
  "v1.4-full-observation-compatibility-v1" as const

export const COMPATIBILITY_DIMENSIONS = [
  "initialState",
  "intermediateStates",
  "lifecycleCoordinates",
  "events",
  "runtimeCalls",
  "strategyObservations",
  "soldierBrainObservations",
  "memoryHandoffs",
  "objectiveHandoffs",
  "finalState",
  "outcome",
  "failureTrace",
  "terminalEventCount",
] as const

export type CompatibilityDimension = (typeof COMPATIBILITY_DIMENSIONS)[number]
export type ApprovedCompatibilityDelta =
  | "D-09"
  | "D-10"
  | "D-11"
  | "D-13"
  | "D-14"
  | "D-15"

export interface CompatibilityIntermediateState {
  label: string
  state: unknown
}

export interface CompatibilityRuntimeCall {
  kind: "selectActivations" | "runSoldierBrain"
  input: unknown
  result: unknown
}

export interface CompatibilityFailureTrace {
  classification: "none" | "playerViolation" | "systemFailure"
  code: string
  gameplayMutation: boolean
}

export interface V14CompatibilityObservation {
  initialState: unknown
  intermediateStates: CompatibilityIntermediateState[]
  lifecycleCoordinates: unknown[]
  events: TransitionEventSummary[]
  runtimeCalls: CompatibilityRuntimeCall[]
  strategyObservations: StrategyInput[]
  soldierBrainObservations: SoldierBrainInput[]
  memoryHandoffs: unknown[]
  objectiveHandoffs: unknown[]
  finalState: unknown
  outcome: MatchOutcome | null
  failureTrace: CompatibilityFailureTrace[]
  terminalEventCount: number
}

export type CompatibilityDimensionHashes = Readonly<
  Record<CompatibilityDimension, string>
>

export interface V14CompatibilityFixture {
  name: string
  ruling: string
  observation: V14CompatibilityObservation
  dimensionHashes: CompatibilityDimensionHashes
  overallHash: string
}

interface Trace {
  runtimeCalls: CompatibilityRuntimeCall[]
  strategyObservations: StrategyInput[]
  soldierBrainObservations: SoldierBrainInput[]
  memoryHandoffs: unknown[]
  objectiveHandoffs: unknown[]
}

const baseInput = {
  matchId: "match:v1-4-compatibility",
  seed: "v1-4-compatibility-seed",
  arenaVariant: {
    id: "arena:v1-4-compatibility",
    name: "v1.4 Compatibility Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [] as Array<{ x: number; y: number }>,
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-revision",
  topStrategyRevisionId: "top-revision",
}

const HISTORICAL_V1_4_VERSIONS = Object.freeze({
  spec: "cowards-rules-v1.4",
  engine: "0.1.4",
  runtimeJs: "0.1.0",
  chronicle: "chronicle-v1.4",
  strategyRevision: "0.1.4",
  arenaVariant: "0.1.0",
})

const soldier = (overrides: Partial<Soldier> & { id: string }): Soldier => ({
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
  ...overrides,
})

const stateWith = (
  soldiers: Soldier[],
  overrides: Partial<GameState> = {},
): GameState => ({
  ...createInitialGameState(baseInput),
  versions: HISTORICAL_V1_4_VERSIONS,
  soldiers,
  ...overrides,
})

const clone = <T>(value: T): T => globalThis.structuredClone(value)

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalize)
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalize(entry)]),
    )
  }
  return value
}

export const canonicalCompatibilityBytes = (value: unknown): string =>
  JSON.stringify(normalize(value))

export const hashCompatibilityValue = (value: unknown): string =>
  `sha256:${createHash("sha256")
    .update(canonicalCompatibilityBytes(value))
    .digest("hex")}`

export const hashCompatibilityDimensions = (
  observation: V14CompatibilityObservation,
): CompatibilityDimensionHashes =>
  Object.fromEntries(
    COMPATIBILITY_DIMENSIONS.map((dimension) => [
      dimension,
      hashCompatibilityValue(observation[dimension]),
    ]),
  ) as unknown as CompatibilityDimensionHashes

const emptyTrace = (): Trace => ({
  runtimeCalls: [],
  strategyObservations: [],
  soldierBrainObservations: [],
  memoryHandoffs: [],
  objectiveHandoffs: [],
})

const eventCoordinates = (events: TransitionEventSummary[]): unknown[] =>
  events.map(({ type, context }) => ({ type, context: context ?? null }))

const observe = (
  initialState: GameState,
  finalState: GameState,
  events: TransitionEventSummary[],
  intermediateStates: CompatibilityIntermediateState[],
  trace: Trace = emptyTrace(),
  failureTrace: CompatibilityFailureTrace[] = [
    { classification: "none", code: "NONE", gameplayMutation: false },
  ],
): V14CompatibilityObservation => ({
  initialState: clone(initialState),
  intermediateStates: clone(intermediateStates),
  lifecycleCoordinates: eventCoordinates(events),
  events: clone(events),
  runtimeCalls: clone(trace.runtimeCalls),
  strategyObservations: clone(trace.strategyObservations),
  soldierBrainObservations: clone(trace.soldierBrainObservations),
  memoryHandoffs: clone(trace.memoryHandoffs),
  objectiveHandoffs: clone(trace.objectiveHandoffs),
  finalState: clone(finalState),
  outcome: clone(finalState.outcome ?? null),
  failureTrace: clone(failureTrace),
  terminalEventCount: events.filter(({ type }) => type === "MATCH_ENDED")
    .length,
})

const observeTransition = (
  initialState: GameState,
  label: string,
  result: TransitionResult,
): V14CompatibilityObservation =>
  observe(initialState, result.state, result.events, [{ label, state: result }])

const runCompatibilityActivation = (
  state: GameState,
  runtime: StrategyRuntime,
  soldierId: string,
): TransitionResult => {
  const execution = MATCH_KERNEL.runActivationFromState({
    state: { ...state, versions: { ...COMPATIBILITY_VERSIONS } },
    runtime,
    soldierId,
  })
  if (
    execution.kind !== "completed" ||
    execution.result === undefined ||
    execution.recorderMaterial === undefined
  ) {
    throw new Error(
      `candidate compatibility activation failed: ${execution.failure?.code ?? "missing result"}`,
    )
  }
  return {
    state: { ...execution.result.state, versions: state.versions },
    // Immutable v1.4 evidence predates canonical event sequencing. Preserve its
    // original bytes while sourcing the transition from the candidate authority.
    events: execution.recorderMaterial.events.map((summary) => ({
      ...summary,
      sequence: 0,
    })),
  }
}

const makeSlot = (
  soldierId: string,
  objective?: JsonValue,
): ActivationSlotState => ({
  activationId: "1:1:0",
  activationIndex: 0,
  actingPlayerId: "bottom",
  soldierId,
  ...(objective === undefined ? {} : { objective }),
  cycleIndex: 0,
  advanced: false,
  ended: false,
})

const tracedRuntime = (
  trace: Trace,
  options: {
    select?: (input: StrategyInput) => {
      activationOrders: Array<{ soldierId: string; objective?: JsonValue }>
      strategyMemory: JsonValue
    }
    brain: (input: SoldierBrainInput) => RuntimeResult<{
      action: Action
      soldierMemory: JsonValue
    }>
  },
): StrategyRuntime => ({
  selectActivations: (input) => {
    const value = options.select?.(input) ?? {
      activationOrders: [],
      strategyMemory: input.strategyMemory,
    }
    const result = success(value)
    trace.strategyObservations.push(clone(input))
    trace.runtimeCalls.push({
      kind: "selectActivations",
      input: clone(input),
      result: clone(result),
    })
    trace.memoryHandoffs.push({
      kind: "strategy",
      before: clone(input.strategyMemory),
      after: clone(value.strategyMemory),
    })
    return result
  },
  runSoldierBrain: (input) => {
    const result = options.brain(input)
    trace.soldierBrainObservations.push(clone(input))
    trace.runtimeCalls.push({
      kind: "runSoldierBrain",
      input: clone(input),
      result: clone(result),
    })
    trace.objectiveHandoffs.push({
      cycleIndex: input.cycleIndex,
      objective: clone(input.objective ?? null),
    })
    trace.memoryHandoffs.push({
      kind: "soldier",
      cycleIndex: input.cycleIndex,
      before: clone(input.soldierMemory),
      after: clone(
        result.ok ? result.value.soldierMemory : input.soldierMemory,
      ),
    })
    return result
  },
})

type Scenario = {
  name: string
  ruling: string
  capture: () => V14CompatibilityObservation
}

const scenarios: readonly Scenario[] = [
  {
    name: "same-direction-rear-approach-blocks",
    ruling:
      "A same-direction ACTIVE Soldier blocks without Advance or history change.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "mover" }),
        soldier({
          id: "target",
          ownerPlayerId: "top",
          position: { x: 5, y: 4 },
          facing: "UP",
        }),
      ])
      return observeTransition(
        initial,
        "same-direction-blocked",
        resolveAction(
          initial,
          "mover",
          { type: "MOVE", direction: "UP" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "head-to-head-distinction-blocks",
    ruling:
      "A head-to-head target remains distinct from same-direction blocking.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "mover" }),
        soldier({
          id: "target",
          ownerPlayerId: "top",
          position: { x: 5, y: 4 },
          facing: "DOWN",
        }),
      ])
      return observeTransition(
        initial,
        "head-to-head-blocked",
        resolveAction(
          initial,
          "mover",
          { type: "MOVE", direction: "UP" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "successful-side-push-preserves-history-ruling",
    ruling:
      "The pusher records RIGHT while the pushed Soldier retains its prior LEFT history.",
    capture: () => {
      const initial = stateWith([
        soldier({
          id: "pusher",
          position: { x: 4, y: 5 },
          facing: "RIGHT",
          lastSuccessfulMoveDirection: "UP",
        }),
        soldier({
          id: "pushed",
          ownerPlayerId: "top",
          position: { x: 5, y: 5 },
          facing: "UP",
          lastSuccessfulMoveDirection: "LEFT",
        }),
      ])
      return observeTransition(
        initial,
        "side-push-resolved",
        resolveAction(
          initial,
          "pusher",
          { type: "MOVE", direction: "RIGHT" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "terrain-block-is-non-terminal",
    ruling:
      "Terrain blocking consumes a Cycle without Advance or successful-move history.",
    capture: () => {
      const initial = stateWith([soldier({ id: "mover" })], {
        terrainStones: [{ x: 5, y: 4 }],
      })
      return observeTransition(
        initial,
        "terrain-blocked",
        resolveAction(
          initial,
          "mover",
          { type: "MOVE", direction: "UP" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "stone-soldier-block-is-non-terminal",
    ruling:
      "A STONE Soldier blocks without Advance or successful-move history.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "mover" }),
        soldier({
          id: "stone",
          ownerPlayerId: "top",
          position: { x: 5, y: 4 },
          status: "STONE",
        }),
      ])
      return observeTransition(
        initial,
        "stone-blocked",
        resolveAction(
          initial,
          "mover",
          { type: "MOVE", direction: "UP" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "failed-push-is-non-terminal",
    ruling:
      "An occupied push destination blocks without Advance or counterfeit history.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "mover", position: { x: 4, y: 5 }, facing: "RIGHT" }),
        soldier({
          id: "target",
          ownerPlayerId: "top",
          position: { x: 5, y: 5 },
          facing: "UP",
        }),
        soldier({ id: "blocker", position: { x: 6, y: 5 }, facing: "LEFT" }),
      ])
      return observeTransition(
        initial,
        "push-blocked",
        resolveAction(
          initial,
          "mover",
          { type: "MOVE", direction: "RIGHT" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "illegal-reversal-is-terminal",
    ruling:
      "Immediate reversal remains illegal and terminal for the selected slot.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "mover", lastSuccessfulMoveDirection: "UP" }),
        soldier({ id: "reserve" }),
        soldier({
          id: "enemy",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      return observeTransition(
        initial,
        "reversal-blocked",
        resolveAction(
          initial,
          "mover",
          { type: "MOVE", direction: "DOWN" },
          { advanced: false },
        ),
      )
    },
  },
  {
    name: "cycle-interleaved-snake-order-and-initiative",
    ruling:
      "Round 2 repeats bottom/top/top/bottom slot order for each Cycle layer.",
    capture: () => {
      const initial = stateWith(
        [
          soldier({ id: "b1", position: { x: 1, y: 8 }, facing: "UP" }),
          soldier({ id: "b2", position: { x: 3, y: 8 }, facing: "UP" }),
          soldier({ id: "b-reserve", position: { x: 5, y: 8 }, facing: "UP" }),
          soldier({
            id: "t1",
            ownerPlayerId: "top",
            position: { x: 1, y: 3 },
            facing: "DOWN",
          }),
          soldier({
            id: "t2",
            ownerPlayerId: "top",
            position: { x: 3, y: 3 },
            facing: "DOWN",
          }),
          soldier({
            id: "t-reserve",
            ownerPlayerId: "top",
            position: { x: 5, y: 3 },
            facing: "DOWN",
          }),
        ],
        { roundNumber: 2, activationCount: 2, initiativePlayerId: "bottom" },
      )
      const trace = emptyTrace()
      const runtime = tracedRuntime(trace, {
        select: (input) => ({
          activationOrders: input.mySoldiers
            .slice(0, 2)
            .map(({ id }) => ({ soldierId: id })),
          strategyMemory: input.strategyMemory,
        }),
        brain: (input) =>
          success({
            action:
              input.cycleIndex === 0
                ? { type: "MOVE", direction: input.self.facing ?? "UP" }
                : {
                    type: "MOVE",
                    direction: input.self.facing === "UP" ? "DOWN" : "UP",
                  },
            soldierMemory: input.soldierMemory,
          }),
      })
      const result = runHistoricalV14RoundFromState({
        state: initial,
        runtime,
      })
      return observe(
        initial,
        result.state,
        result.events,
        [{ label: "round-complete", state: result }],
        trace,
      )
    },
  },
  {
    name: "cycle-start-backstab-precedes-observation",
    ruling:
      "Cycle-start Backstab remains and its simultaneous result is visible to SoldierBrain.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "actor", position: { x: 5, y: 6 }, facing: "RIGHT" }),
        soldier({
          id: "victim",
          ownerPlayerId: "top",
          position: { x: 5, y: 5 },
          facing: "UP",
        }),
        soldier({
          id: "top-reserve",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      const trace = emptyTrace()
      const runtime = tracedRuntime(trace, {
        brain: (input) =>
          success({
            action: { type: "MOVE", direction: "RIGHT" },
            soldierMemory: input.soldierMemory,
          }),
      })
      const result = resolveActivationCycle(
        initial,
        runtime,
        makeSlot("actor"),
        0,
      )
      return observe(
        initial,
        result.state,
        result.events,
        [{ label: "cycle-start-scan-and-action", state: result }],
        trace,
      )
    },
  },
  {
    name: "cycle-end-backstab-after-action",
    ruling:
      "Cycle-end Backstab evaluates the post-Action board using victim rear geometry.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
        soldier({
          id: "attacker",
          ownerPlayerId: "top",
          position: { x: 4, y: 5 },
          facing: "DOWN",
        }),
        soldier({ id: "bottom-reserve", position: { x: 9, y: 8 } }),
        soldier({
          id: "top-reserve",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      const turned = resolveAction(
        initial,
        "actor",
        { type: "TURN", direction: "RIGHT" },
        { advanced: false },
      )
      const backstabbed = resolveBackstabBoundary(turned.state, "cycle-end")
      return observe(
        initial,
        backstabbed.state,
        [...turned.events, ...backstabbed.events],
        [
          { label: "after-turn", state: turned.state },
          { label: "after-cycle-end-backstab", state: backstabbed.state },
        ],
      )
    },
  },
  {
    name: "mutual-backstab-is-simultaneous",
    ruling:
      "Mutual victims are selected from one snapshot and become STONE together.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "a", position: { x: 5, y: 5 }, facing: "UP" }),
        soldier({
          id: "b",
          ownerPlayerId: "top",
          position: { x: 5, y: 6 },
          facing: "DOWN",
        }),
      ])
      return observeTransition(
        initial,
        "mutual-backstab",
        resolveBackstabBoundary(initial, "cycle-end"),
      )
    },
  },
  {
    name: "multi-victim-backstab-ignores-attacker-facing",
    ruling:
      "Every victim rear-square pair resolves together without an attacker-facing requirement.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "a", position: { x: 5, y: 6 }, facing: "LEFT" }),
        soldier({
          id: "b",
          ownerPlayerId: "top",
          position: { x: 5, y: 5 },
          facing: "UP",
        }),
        soldier({
          id: "c",
          ownerPlayerId: "top",
          position: { x: 6, y: 6 },
          facing: "RIGHT",
        }),
      ])
      return observeTransition(
        initial,
        "multi-victim-backstab",
        resolveBackstabBoundary(initial, "cycle-end"),
      )
    },
  },
  {
    name: "push-creates-cycle-end-backstab-eligibility",
    ruling:
      "A successful push can create eligibility only for the following Cycle-end scan.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "mover", position: { x: 4, y: 6 }, facing: "RIGHT" }),
        soldier({ id: "pushed", position: { x: 5, y: 6 }, facing: "UP" }),
        soldier({
          id: "victim",
          ownerPlayerId: "top",
          position: { x: 6, y: 5 },
          facing: "UP",
        }),
      ])
      const pushed = resolveAction(
        initial,
        "mover",
        { type: "MOVE", direction: "RIGHT" },
        { advanced: false },
      )
      const backstabbed = resolveBackstabBoundary(pushed.state, "cycle-end")
      return observe(
        initial,
        backstabbed.state,
        [...pushed.events, ...backstabbed.events],
        [
          { label: "after-push", state: pushed.state },
          { label: "after-cycle-end-backstab", state: backstabbed.state },
        ],
      )
    },
  },
  {
    name: "turn-creates-cycle-end-backstab-eligibility",
    ruling: "TURN changes rear-square eligibility before the Cycle-end scan.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
        soldier({
          id: "attacker",
          ownerPlayerId: "top",
          position: { x: 4, y: 5 },
          facing: "UP",
        }),
        soldier({ id: "bottom-reserve", position: { x: 9, y: 8 } }),
        soldier({
          id: "top-reserve",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      const turned = resolveAction(
        initial,
        "actor",
        { type: "TURN", direction: "RIGHT" },
        { advanced: false },
      )
      const backstabbed = resolveBackstabBoundary(turned.state, "cycle-end")
      return observe(
        initial,
        backstabbed.state,
        [...turned.events, ...backstabbed.events],
        [
          { label: "after-turn", state: turned.state },
          { label: "after-cycle-end-backstab", state: backstabbed.state },
        ],
      )
    },
  },
  {
    name: "contraction-resolves-final-two-by-two",
    ruling:
      "Contraction removes edge contents before the final 2x2 active-count outcome.",
    capture: () => {
      const initial = stateWith(
        [
          soldier({ id: "bottom-one", position: { x: 1, y: 1 } }),
          soldier({ id: "bottom-two", position: { x: 2, y: 1 } }),
          soldier({ id: "edge", position: { x: 0, y: 2 } }),
          soldier({
            id: "top-one",
            ownerPlayerId: "top",
            position: { x: 1, y: 2 },
          }),
        ],
        {
          bounds: { minX: 0, maxX: 3, minY: 0, maxY: 3 },
          terrainStones: [
            { x: 0, y: 1 },
            { x: 2, y: 2 },
          ],
          roundNumber: 4,
        },
      )
      return observeTransition(
        initial,
        "contracted-to-final-two-by-two",
        resolveContraction(initial),
      )
    },
  },
  {
    name: "player-violation-applies-gameplay-cleanup",
    ruling:
      "A player-owned violation stones a no-Advance actor and remains owner-private evidence.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "actor" }),
        soldier({ id: "bottom-reserve", position: { x: 7, y: 7 } }),
        soldier({
          id: "enemy",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      const trace = emptyTrace()
      const runtime = tracedRuntime(trace, {
        brain: () => violation("TIMEOUT", "bounded timeout"),
      })
      const result = resolveActivationCycle(
        initial,
        runtime,
        makeSlot("actor"),
        0,
      )
      return observe(
        initial,
        result.state,
        result.events,
        [{ label: "player-violation-cleanup", state: result }],
        trace,
        [
          {
            classification: "playerViolation",
            code: "TIMEOUT",
            gameplayMutation: true,
          },
        ],
      )
    },
  },
  {
    name: "system-failure-leaves-gameplay-unchanged",
    ruling:
      "A system-owned runtime failure escapes gameplay resolution with the pre-transition state unchanged.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "actor" }),
        soldier({
          id: "enemy",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      const trace = emptyTrace()
      const runtime: StrategyRuntime = {
        selectActivations: () => {
          throw new Error("not used")
        },
        runSoldierBrain: (input) => {
          trace.soldierBrainObservations.push(clone(input))
          trace.runtimeCalls.push({
            kind: "runSoldierBrain",
            input: clone(input),
            result: { failureKind: "systemFailure", code: "SPAWN_FAILED" },
          })
          throw new Error("SPAWN_FAILED")
        },
      }
      let code = "UNEXPECTED_SUCCESS"
      try {
        resolveActivationCycle(initial, runtime, makeSlot("actor"), 0)
      } catch (error) {
        code = error instanceof Error ? error.message : "UNKNOWN_SYSTEM_FAILURE"
      }
      return observe(
        initial,
        initial,
        [],
        [{ label: "unchanged-after-system-failure", state: initial }],
        trace,
        [{ classification: "systemFailure", code, gameplayMutation: false }],
      )
    },
  },
  {
    name: "strategy-observation-memory-objective-ordering",
    ruling:
      "Selection memory precedes ordered objective-bearing SoldierBrain calls with fresh SoldierMemory.",
    capture: () => {
      const initial = stateWith([
        soldier({ id: "actor", soldierMemory: { count: 0 } }),
        soldier({ id: "bottom-reserve", position: { x: 7, y: 7 } }),
        soldier({
          id: "enemy",
          ownerPlayerId: "top",
          position: { x: 9, y: 9 },
        }),
      ])
      initial.players[0] = {
        ...initial.players[0],
        strategyMemory: { selection: 0 },
      }
      const trace = emptyTrace()
      const runtime = tracedRuntime(trace, {
        select: () => ({
          activationOrders: [
            { soldierId: "actor", objective: { role: "advance", priority: 1 } },
          ],
          strategyMemory: { selection: 1 },
        }),
        brain: (input) => {
          const count =
            Number((input.soldierMemory as { count?: number }).count ?? 0) + 1
          return success({
            action:
              input.cycleIndex === 0
                ? { type: "MOVE", direction: "UP" }
                : { type: "MOVE", direction: "DOWN" },
            soldierMemory: { count },
          })
        },
      })
      const selection = resolveActivationSelection(initial, runtime, "bottom")
      const selectedState = selection.state.state
      const [slot] = createActivationSlots(
        selectedState,
        new Map([
          ["bottom", selection.state.orders],
          ["top", []],
        ]),
        "bottom",
        "top",
      )
      if (!slot) {
        throw new Error("compatibility objective slot was not created")
      }
      const first = resolveActivationCycle(selectedState, runtime, slot, 0)
      const second = resolveActivationCycle(first.state, runtime, first.slot, 1)
      const events = [...selection.events, ...first.events, ...second.events]
      return observe(
        initial,
        second.state,
        events,
        [
          { label: "after-selection", state: selectedState },
          { label: "after-cycle-0", state: first },
          { label: "after-cycle-1", state: second },
        ],
        trace,
      )
    },
  },
  {
    name: "blocked-move-keeps-slot-open-for-next-cycle",
    ruling:
      "A blocked MOVE is non-terminal and SoldierBrain runs again on the next Cycle.",
    capture: () => {
      const initial = stateWith(
        [
          soldier({ id: "actor" }),
          soldier({ id: "bottom-reserve", position: { x: 7, y: 7 } }),
          soldier({
            id: "enemy",
            ownerPlayerId: "top",
            position: { x: 9, y: 9 },
          }),
        ],
        { terrainStones: [{ x: 5, y: 4 }] },
      )
      const trace = emptyTrace()
      const runtime = tracedRuntime(trace, {
        brain: (input) =>
          success({
            action:
              input.cycleIndex === 0
                ? { type: "MOVE", direction: "UP" }
                : { type: "TURN_TO_STONE" },
            soldierMemory: { cycle: input.cycleIndex },
          }),
      })
      const result = runCompatibilityActivation(initial, runtime, "actor")
      return observe(
        initial,
        result.state,
        result.events,
        [{ label: "activation-after-block-and-second-cycle", state: result }],
        trace,
      )
    },
  },
  {
    name: "terminal-push-emits-one-match-ended",
    ruling:
      "A push that removes the last enemy ends immediately with exactly one terminal event.",
    capture: () => {
      const initial = stateWith(
        [
          soldier({ id: "mover", position: { x: 4, y: 5 }, facing: "RIGHT" }),
          soldier({
            id: "target",
            ownerPlayerId: "top",
            position: { x: 5, y: 5 },
            facing: "UP",
          }),
        ],
        { bounds: { minX: 0, maxX: 5, minY: 0, maxY: 11 } },
      )
      const trace = emptyTrace()
      const runtime = tracedRuntime(trace, {
        brain: (input) =>
          success({
            action: { type: "MOVE", direction: "RIGHT" },
            soldierMemory: input.soldierMemory,
          }),
      })
      const result = runCompatibilityActivation(initial, runtime, "mover")
      return observe(
        initial,
        result.state,
        result.events,
        [{ label: "terminal-push", state: result }],
        trace,
      )
    },
  },
]

// These hashes are generated once from the committed pre-refactor engine and then
// reviewed as immutable evidence. Regeneration is guarded below and in tests.
export const LOCKED_V1_4_FIXTURE_HASHES: Readonly<Record<string, string>> = {
  "same-direction-rear-approach-blocks":
    "sha256:1f1e64d4f7a880fed54ad43a282aee722f177f97709d8dd71b9e325bf1aeb74d",
  "head-to-head-distinction-blocks":
    "sha256:c53238ec8dbc6493220736b7a2ecc3279fe787296429abe1049b42d4a4fbc009",
  "successful-side-push-preserves-history-ruling":
    "sha256:5438251b6202cc367893c8c84f8d4340ab633f84d91e0fd1b9795268ac6083e2",
  "terrain-block-is-non-terminal":
    "sha256:aca3fb4832c3ac5e0642a9cc674bd57eac10ef9a697280a5c25387f411e08665",
  "stone-soldier-block-is-non-terminal":
    "sha256:f543022beeff4a0c1ec32e8e4190224b421b3f30643ebac8932891ad26350bc6",
  "failed-push-is-non-terminal":
    "sha256:5544becad7aa84b131205f9f225926127e270c3ddac2b89b8a03dec3827a538d",
  "illegal-reversal-is-terminal":
    "sha256:b3bd4fedc84ac76843a61a26f54546e037e22c40da7dd925fb8e6fc2d16c6bab",
  "cycle-interleaved-snake-order-and-initiative":
    "sha256:e39502e9dd1f0ca1f12b70fbce9aeb0437a22f9bcda0a30ae13721b61ee99a0a",
  "cycle-start-backstab-precedes-observation":
    "sha256:7d1f0b771b3da66f4c28ded0de096383b63910b2e4d4a98e0a6e9166e581d0fd",
  "cycle-end-backstab-after-action":
    "sha256:25e5f53ac5a31f7814455b79ca7c8e7f4d0927b30f5b82909f952c507a6833c0",
  "mutual-backstab-is-simultaneous":
    "sha256:986cd0c9c98cb9e0dfa510989ff032dca408c66992bd1248d49732d6aa78e017",
  "multi-victim-backstab-ignores-attacker-facing":
    "sha256:a97834591b74acd8a293e15c2e74d4f3f586fafe2a79566e2626715937beadb0",
  "push-creates-cycle-end-backstab-eligibility":
    "sha256:15a84f557ff8fb29c29eb793c22a4345cf76f7357e60ef3e043b88528c833177",
  "turn-creates-cycle-end-backstab-eligibility":
    "sha256:1c56176413af7b12405f84a9f4bcb95ca5a5815c08e7468d847da2c01dd5aad7",
  "contraction-resolves-final-two-by-two":
    "sha256:6b503b1167dcd50fd3a098979988d10828d6e1d0e0d4988f9e8ce9b1825aa08a",
  "player-violation-applies-gameplay-cleanup":
    "sha256:37058079c08c7150fda4e3bdc282615cdef3512d4f99cbb53a0e87a844f4fc77",
  "system-failure-leaves-gameplay-unchanged":
    "sha256:10b9686a77b9fe0efdbe2582e7623d5b8b315ce970f380e28ce115dac611af72",
  "strategy-observation-memory-objective-ordering":
    "sha256:d498d2e86d7c71b0d2d8b765ee69238e829737f306785dfe0931ce8de394a7af",
  "blocked-move-keeps-slot-open-for-next-cycle":
    "sha256:f583023849896f80ed55d33be250efd56dbc3d417c5564b3f3d46e164f76bbd4",
  "terminal-push-emits-one-match-ended":
    "sha256:c0cbe06d3c83c01e8a2f0ca7761d6bf37fad190e566e75d7bacdf280dcd12f09",
}

export const LOCKED_V1_4_DIMENSION_ROOTS: CompatibilityDimensionHashes = {
  initialState:
    "sha256:23c1451eccbb86cde16b80939155c16d4930b8821e36bf85acc701da4260503f",
  intermediateStates:
    "sha256:ea627a1ea0c45cefea047a3ad918e3ca939c28891008a2ea8ba5a1d096bec110",
  lifecycleCoordinates:
    "sha256:a3a5d78bbead15fa00c12d15db28c89766ecca4e682ccf421ad9019331c12787",
  events:
    "sha256:49993980b9fb3e4964df9c24ed89080c4694f0945e82806cd6c4eeba45129668",
  runtimeCalls:
    "sha256:866fecac854a4f6e478e2bccc5b8cbf05f85773278f0ea5af725a5f71bb1f4dc",
  strategyObservations:
    "sha256:074e512de122e70d4aef40ea57253d56b25c273fd0467034d07b0ca291f8c3bf",
  soldierBrainObservations:
    "sha256:31d9423e07aed73f503fe10a4f1aff04eea7eb8d8dee1f27ccecab0b0ec5f12b",
  memoryHandoffs:
    "sha256:529b1ae4bed60a80a18fe82e32e5950229429f4a582407842afe919b1ffbf8b0",
  objectiveHandoffs:
    "sha256:3d20cc11bad034df94d3cdf57eec0f9bae6bb8e94a8562c3ff873a12f5302434",
  finalState:
    "sha256:67bcbb2970b2b756293db4ef458494ee00159129456c3f2d70cfce789b526e8d",
  outcome:
    "sha256:52a48e34d7d3d0cbb4716e4e06568229dbf512a45eb7803d5fb808f073dddc78",
  failureTrace:
    "sha256:deb5278afc78882c0878a4d75aad66431d5ce3d8bad9cff7c401a95b4cffa009",
  terminalEventCount:
    "sha256:59f5b593c854dd3d9d22846a20b1afa487fdc5360cff47cf38c7fba468fb9abe",
}

export const captureV14CompatibilityCorpus = (): V14CompatibilityFixture[] =>
  scenarios.map(({ name, ruling, capture }) => {
    const observation = capture()
    const dimensionHashes = hashCompatibilityDimensions(observation)
    return {
      name,
      ruling,
      observation,
      dimensionHashes,
      overallHash: hashCompatibilityValue({
        version: V1_4_COMPATIBILITY_CORPUS_VERSION,
        name,
        ruling,
        dimensionHashes,
      }),
    }
  })

export interface CompatibilityFinding {
  fixture: string
  dimension: CompatibilityDimension
  expectedHash: string
  actualHash: string
  message: string
}

export const compareCompatibilityObservation = (
  fixture: Pick<V14CompatibilityFixture, "name" | "dimensionHashes">,
  observation: V14CompatibilityObservation,
): CompatibilityFinding[] => {
  const expected = fixture.dimensionHashes
  const actual = hashCompatibilityDimensions(observation)
  return COMPATIBILITY_DIMENSIONS.flatMap((dimension) =>
    actual[dimension] === expected[dimension]
      ? []
      : [
          {
            fixture: fixture.name,
            dimension,
            expectedHash: expected[dimension],
            actualHash: actual[dimension],
            message: `Fixture ${fixture.name} changed ${dimension}: expected ${expected[dimension]}, received ${actual[dimension]} (KERN-11 approval required).`,
          },
        ],
  )
}

export const hashCompatibilityDimensionRoots = (
  fixtures: readonly V14CompatibilityFixture[],
): CompatibilityDimensionHashes =>
  Object.fromEntries(
    COMPATIBILITY_DIMENSIONS.map((dimension) => [
      dimension,
      hashCompatibilityValue(
        fixtures.map(({ name, dimensionHashes }) => [
          name,
          dimensionHashes[dimension],
        ]),
      ),
    ]),
  ) as unknown as CompatibilityDimensionHashes

export const findLockedCompatibilityDrift = (
  fixtures: readonly V14CompatibilityFixture[],
): string[] => {
  const actualNames = fixtures.map(({ name }) => name)
  const expectedNames = Object.keys(LOCKED_V1_4_FIXTURE_HASHES)
  const findings: string[] = []
  if (
    canonicalCompatibilityBytes(actualNames) !==
    canonicalCompatibilityBytes(expectedNames)
  ) {
    findings.push(
      `Fixture inventory changed: expected ${expectedNames.join(", ")}; received ${actualNames.join(", ")} (KERN-11 approval required).`,
    )
  }
  for (const fixture of fixtures) {
    const expected = LOCKED_V1_4_FIXTURE_HASHES[fixture.name]
    if (expected !== fixture.overallHash) {
      findings.push(
        `Fixture ${fixture.name} changed: expected ${expected ?? "MISSING"}, received ${fixture.overallHash} (KERN-11 approval required).`,
      )
    }
  }
  const roots = hashCompatibilityDimensionRoots(fixtures)
  for (const dimension of COMPATIBILITY_DIMENSIONS) {
    if (roots[dimension] !== LOCKED_V1_4_DIMENSION_ROOTS[dimension]) {
      findings.push(
        `Compatibility dimension ${dimension} changed: expected ${LOCKED_V1_4_DIMENSION_ROOTS[dimension]}, received ${roots[dimension]} (KERN-11 approval required).`,
      )
    }
  }
  return findings
}

const APPROVED_COMPATIBILITY_DELTAS = new Set<ApprovedCompatibilityDelta>([
  "D-09",
  "D-10",
  "D-11",
  "D-13",
  "D-14",
  "D-15",
])

export const authorizeCompatibilityRegeneration = (
  approvalIds: readonly string[],
): ApprovedCompatibilityDelta[] => {
  if (approvalIds.length === 0) {
    throw new Error(
      "Compatibility regeneration requires at least one explicit approved delta ID.",
    )
  }
  const duplicates = approvalIds.filter(
    (id, index) => approvalIds.indexOf(id) !== index,
  )
  if (duplicates.length > 0) {
    throw new Error(
      `Compatibility regeneration contains duplicate approval IDs: ${[...new Set(duplicates)].join(", ")}.`,
    )
  }
  const unknown = approvalIds.filter(
    (id): id is string =>
      !APPROVED_COMPATIBILITY_DELTAS.has(id as ApprovedCompatibilityDelta),
  )
  if (unknown.length > 0) {
    throw new Error(
      `Compatibility regeneration rejected unknown or preserved approval IDs: ${unknown.join(", ")}.`,
    )
  }
  return [...approvalIds].sort() as ApprovedCompatibilityDelta[]
}

export const createCompatibilityRegenerationRecord = (
  approvalIds: readonly string[],
  fixtures: readonly V14CompatibilityFixture[],
) => ({
  corpusVersion: V1_4_COMPATIBILITY_CORPUS_VERSION,
  approvedDeltas: authorizeCompatibilityRegeneration(approvalIds),
  fixtures: fixtures.map(({ name, dimensionHashes, overallHash }) => ({
    name,
    dimensionHashes,
    overallHash,
  })),
})
