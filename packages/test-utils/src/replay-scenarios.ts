import { type RunMatchInput, type StrategyRuntime } from "@cowards/engine"
import { buildChronicleFromMatch } from "@cowards/replay"
import {
  INITIAL_BOUNDS,
  type Action,
  type Chronicle,
  type ChronicleEventType,
  type Direction,
  type JsonValue,
  type PlayerId,
  type SoldierBrainInput,
  type StrategyInput,
} from "@cowards/spec"

export const canonicalReplayScenarioIds = [
  "push",
  "fall",
  "contraction",
  "legal-backstab",
  "runtime-failure",
  "endgame",
  "compound-tour",
] as const

export type CanonicalReplayScenarioId =
  (typeof canonicalReplayScenarioIds)[number]

export interface CanonicalReplayVisualCheckpoint {
  name: string
  sequence: number
  eventType: ChronicleEventType
  assertions: string[]
}

export interface CanonicalReplayScenario {
  id: CanonicalReplayScenarioId
  title: string
  chronicle: Chronicle
  expectedEventTypes: ChronicleEventType[]
  visualCheckpoints: CanonicalReplayVisualCheckpoint[]
}

type ScriptedActivation = {
  soldierId: string
  actions: readonly Action[]
}

type ScriptedSelections = Record<string, readonly ScriptedActivation[]>

const bottomPlayerId = "bottom"
const topPlayerId = "top"

const activationKey = (
  phaseNumber: number,
  roundNumber: number,
  playerId: PlayerId,
): string => `${phaseNumber}:${roundNumber}:${playerId}`

const move = (direction: Direction, count: number): Action[] =>
  Array.from({ length: count }, () => ({ type: "MOVE", direction }) as const)

const turn = (direction: Direction): Action => ({ type: "TURN", direction })

const turnToStone: Action = { type: "TURN_TO_STONE" }

const readObjectivePlanId = (
  objective: JsonValue | undefined,
): string | undefined => {
  if (!objective || typeof objective !== "object" || Array.isArray(objective)) {
    return undefined
  }
  const planId = objective.actionPlanId
  return typeof planId === "string" ? planId : undefined
}

const createScriptedRuntime = (
  selections: ScriptedSelections,
  options: {
    violationSoldierId?: string | undefined
  } = {},
): StrategyRuntime => {
  const actionPlans = new Map<string, readonly Action[]>()

  return {
    selectActivations(input: StrategyInput) {
      const ownerPlayerId = input.mySoldiers[0]?.ownerPlayerId ?? "unknown"
      const key = activationKey(
        input.phaseNumber,
        input.roundNumber,
        ownerPlayerId,
      )
      const selected = selections[key] ?? []

      return {
        ok: true,
        value: {
          activationOrders: selected.map((activation, index) => {
            const actionPlanId = `${key}:${index}:${activation.soldierId}`
            actionPlans.set(actionPlanId, activation.actions)
            return {
              soldierId: activation.soldierId,
              objective: { actionPlanId },
            }
          }),
          strategyMemory: {},
        },
      }
    },
    runSoldierBrain(input: SoldierBrainInput) {
      if (input.self.id === options.violationSoldierId) {
        return {
          ok: false,
          violation: {
            type: "TIMEOUT",
            message: "Deterministic replay scenario runtime violation.",
          },
        }
      }

      const planId = readObjectivePlanId(input.objective)
      const actions = planId === undefined ? undefined : actionPlans.get(planId)
      const action =
        actions?.[input.cycleIndex] ??
        turn(
          input.self.facing ?? input.self.lastSuccessfulMoveDirection ?? "UP",
        )

      return {
        ok: true,
        value: {
          action,
          soldierMemory: {},
        },
      }
    },
  }
}

const createStoningRuntime = (): StrategyRuntime => ({
  selectActivations(input: StrategyInput) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter((soldier) => soldier.status === "ACTIVE")
          .slice(0, input.activationCount)
          .map((soldier) => ({ soldierId: soldier.id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: {
        action: turnToStone,
        soldierMemory: {},
      },
    }
  },
})

const createMatchInput = (
  id: CanonicalReplayScenarioId,
  seed: string,
  runtime: StrategyRuntime,
  maxPhases = 1,
): RunMatchInput => ({
  matchId: `canonical-replay-${id}`,
  seed,
  arenaVariant: {
    id: `canonical-replay-${id}-arena`,
    name: `Canonical Replay ${id} Arena`,
    initialBounds: INITIAL_BOUNDS,
    terrainStones: [],
  },
  bottomPlayerId,
  topPlayerId,
  bottomStrategyRevisionId: `canonical-replay-${id}-bottom-revision`,
  topStrategyRevisionId: `canonical-replay-${id}-top-revision`,
  runtime,
  maxPhases,
})

const sequenceOf = (
  chronicle: Chronicle,
  eventType: ChronicleEventType,
): number => {
  const event = chronicle.events.find(
    (candidate) => candidate.type === eventType,
  )
  if (!event) {
    throw new Error(`Canonical replay scenario is missing ${eventType}.`)
  }
  return event.sequence
}

const buildScenario = (
  id: CanonicalReplayScenarioId,
  title: string,
  input: RunMatchInput,
  expectedEventTypes: ChronicleEventType[],
  checkpoints: Array<{
    name: string
    eventType: ChronicleEventType
    assertions: string[]
  }>,
): CanonicalReplayScenario => {
  const { chronicle } = buildChronicleFromMatch(input)

  return {
    id,
    title,
    chronicle,
    expectedEventTypes,
    visualCheckpoints: checkpoints.map((checkpoint) => ({
      ...checkpoint,
      sequence: sequenceOf(chronicle, checkpoint.eventType),
    })),
  }
}

const createPushScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "push",
    "Push Resolution Demo Match",
    createMatchInput(
      "push",
      "a",
      createScriptedRuntime({
        [activationKey(1, 1, topPlayerId)]: [
          {
            soldierId: "top-soldier-4",
            actions: [{ type: "MOVE", direction: "DOWN" }, turn("LEFT")],
          },
        ],
        [activationKey(1, 1, bottomPlayerId)]: [
          {
            soldierId: "bottom-soldier-4",
            actions: move("UP", 10),
          },
        ],
      }),
    ),
    ["PUSH_RESOLVED", "MOVE_ADVANCED", "MATCH_ENDED"],
    [
      {
        name: "push-after-resolution",
        eventType: "PUSH_RESOLVED",
        assertions: [
          "A bottom Soldier has Advanced into the target square.",
          "The pushed top Soldier remains on the board after the Action.",
          "The event callout identifies PUSH_RESOLVED.",
        ],
      },
    ],
  )

const createFallScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "fall",
    "Fall Resolution Demo Match",
    createMatchInput(
      "fall",
      "a",
      createScriptedRuntime({
        [activationKey(1, 1, topPlayerId)]: [
          {
            soldierId: "top-soldier-8",
            actions: [{ type: "MOVE", direction: "RIGHT" }, turn("LEFT")],
          },
        ],
        [activationKey(1, 1, bottomPlayerId)]: [
          {
            soldierId: "bottom-soldier-8",
            actions: [{ type: "MOVE", direction: "RIGHT" }, ...move("UP", 11)],
          },
        ],
      }),
    ),
    ["PUSH_RESOLVED", "SOLDIER_FELL", "MATCH_ENDED"],
    [
      {
        name: "fall-after-push-off-board",
        eventType: "SOLDIER_FELL",
        assertions: [
          "The pushed Soldier is marked FALLEN after leaving the board.",
          "The board edge is visible at the fall location.",
          "The event callout identifies SOLDIER_FELL.",
        ],
      },
    ],
  )

const createContractionScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "contraction",
    "Contraction Demo Match",
    createMatchInput("contraction", "b", createScriptedRuntime({})),
    ["CONTRACTION_RESOLVED", "MATCH_ENDED"],
    [
      {
        name: "bounds-after-contraction",
        eventType: "CONTRACTION_RESOLVED",
        assertions: [
          "The board bounds shrink by one square on every side.",
          "Soldiers outside the contracted bounds are no longer in active play.",
          "The event callout identifies CONTRACTION_RESOLVED.",
        ],
      },
    ],
  )

const createLegalBackstabScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "legal-backstab",
    "Legal Backstab Demo Match",
    createMatchInput(
      "legal-backstab",
      "b",
      createScriptedRuntime({
        [activationKey(1, 1, bottomPlayerId)]: [
          {
            soldierId: "bottom-soldier-4",
            actions: [{ type: "MOVE", direction: "UP" }, turn("LEFT")],
          },
        ],
        [activationKey(1, 1, topPlayerId)]: [
          {
            soldierId: "top-soldier-5",
            actions: move("DOWN", 10),
          },
        ],
      }),
    ),
    ["BACKSTAB_RESOLVED", "SOLDIER_STONED", "MATCH_ENDED"],
    [
      {
        name: "backstab-directly-behind",
        eventType: "BACKSTAB_RESOLVED",
        assertions: [
          "The attacking Soldier occupies the square directly behind the victim.",
          "The victim Soldier changes to STONE after the legal Backstab.",
          "The event callout identifies BACKSTAB_RESOLVED.",
        ],
      },
    ],
  )

const createRuntimeFailureScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "runtime-failure",
    "Runtime Failure Demo Match",
    createMatchInput(
      "runtime-failure",
      "b",
      createScriptedRuntime(
        {
          [activationKey(1, 1, bottomPlayerId)]: [
            {
              soldierId: "bottom-soldier-1",
              actions: [turn("UP")],
            },
          ],
        },
        { violationSoldierId: "bottom-soldier-1" },
      ),
    ),
    ["RUNTIME_VIOLATION", "SOLDIER_STONED", "MATCH_ENDED"],
    [
      {
        name: "runtime-violation-callout",
        eventType: "RUNTIME_VIOLATION",
        assertions: [
          "The violating Soldier remains identifiable without Strategy source.",
          "The Soldier becomes STONE after the runtime violation.",
          "The event callout identifies RUNTIME_VIOLATION.",
        ],
      },
    ],
  )

const createEndgameScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "endgame",
    "Endgame Demo Match",
    createMatchInput("endgame", "b", createStoningRuntime(), 2),
    ["SOLDIER_STONED", "MATCH_ENDED"],
    [
      {
        name: "terminal-match-ended",
        eventType: "MATCH_ENDED",
        assertions: [
          "The Match is terminal after exactly one MATCH_ENDED event.",
          "Remaining Soldiers show terminal STONE or ACTIVE status consistently.",
          "The event callout identifies MATCH_ENDED.",
        ],
      },
    ],
  )

const createCompoundTourScenario = (): CanonicalReplayScenario =>
  buildScenario(
    "compound-tour",
    "Compound Tour Smoke Match",
    createMatchInput(
      "compound-tour",
      "b",
      createScriptedRuntime({
        [activationKey(1, 1, bottomPlayerId)]: [
          {
            soldierId: "bottom-soldier-4",
            actions: [{ type: "MOVE", direction: "UP" }, turn("LEFT")],
          },
        ],
        [activationKey(1, 1, topPlayerId)]: [
          {
            soldierId: "top-soldier-5",
            actions: move("DOWN", 10),
          },
        ],
      }),
    ),
    ["BACKSTAB_RESOLVED", "CONTRACTION_RESOLVED", "MATCH_ENDED"],
    [
      {
        name: "tour-backstab",
        eventType: "BACKSTAB_RESOLVED",
        assertions: [
          "The smoke Match includes a legal Backstab from engine execution.",
          "The victim Soldier is converted to STONE in the Chronicle.",
          "The event callout identifies BACKSTAB_RESOLVED.",
        ],
      },
      {
        name: "tour-contraction",
        eventType: "CONTRACTION_RESOLVED",
        assertions: [
          "The same generated Match reaches board Contraction.",
          "The contracted board bounds are inspectable from the Chronicle.",
          "The event callout identifies CONTRACTION_RESOLVED.",
        ],
      },
    ],
  )

const scenarioBuilders = {
  push: createPushScenario,
  fall: createFallScenario,
  contraction: createContractionScenario,
  "legal-backstab": createLegalBackstabScenario,
  "runtime-failure": createRuntimeFailureScenario,
  endgame: createEndgameScenario,
  "compound-tour": createCompoundTourScenario,
} satisfies Record<CanonicalReplayScenarioId, () => CanonicalReplayScenario>

export const getCanonicalReplayScenarioIds =
  (): readonly CanonicalReplayScenarioId[] => canonicalReplayScenarioIds

export const getCanonicalReplayScenario = (
  id: CanonicalReplayScenarioId,
): CanonicalReplayScenario => scenarioBuilders[id]()

export const getCanonicalReplayScenarios = (): CanonicalReplayScenario[] =>
  canonicalReplayScenarioIds.map((id) => getCanonicalReplayScenario(id))
