/**
 * Focused reproductions captured during the 2026-07-12 core-rules audit.
 *
 * Run from the repository root:
 *   pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts
 */
import {
  ChronicleEventSchema,
  StrategyResultSchema,
  type Soldier,
} from "../../../packages/spec/src/index.ts"
import {
  createInitialGameState,
  resolveAction,
  resolveActivation,
  resolveActivationCycle,
  resolveActivationSelection,
  success,
  type ActivationSlotState,
  type GameState,
  type StrategyRuntime,
} from "../../../packages/engine/src/index.ts"

const baseInput = {
  matchId: "audit-match",
  seed: "audit-seed",
  arenaVariant: {
    id: "audit-arena",
    name: "Audit Arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "bottom",
  topPlayerId: "top",
  bottomStrategyRevisionId: "bottom-rev",
  topStrategyRevisionId: "top-rev",
}

const soldier = (overrides: Partial<Soldier> & { id: string }): Soldier => ({
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 5 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
  soldierMemory: {},
  ...overrides,
})

const stateWith = (soldiers: Soldier[]): GameState => ({
  ...createInitialGameState(baseInput),
  soldiers,
})

const brainRuntime = (action: unknown): StrategyRuntime => ({
  selectActivations: () =>
    success({ activationOrders: [], strategyMemory: {} }),
  runSoldierBrain: () => success({ action, soldierMemory: {} } as never),
})

const noAdvanceState = stateWith([
  soldier({
    id: "last-bottom",
    lastSuccessfulMoveDirection: "UP",
  }),
  soldier({
    id: "last-top",
    ownerPlayerId: "top",
    position: { x: 9, y: 9 },
  }),
])
const noAdvance = resolveActivation(
  noAdvanceState,
  brainRuntime({ type: "MOVE", direction: "DOWN" }),
  "last-bottom",
)

const backstabState = stateWith([
  soldier({ id: "actor", position: { x: 5, y: 5 }, facing: "UP" }),
  soldier({ id: "bottom-survivor", position: { x: 1, y: 1 } }),
  soldier({
    id: "enemy-behind-after-turn",
    ownerPlayerId: "top",
    position: { x: 4, y: 5 },
    facing: "DOWN",
  }),
])
const slot: ActivationSlotState = {
  activationId: "1:1:0",
  activationIndex: 0,
  actingPlayerId: "bottom",
  soldierId: "actor",
  cycleIndex: 0,
  advanced: false,
  ended: false,
}
const postBackstab = resolveActivationCycle(
  backstabState,
  brainRuntime({ type: "TURN", direction: "RIGHT" }),
  slot,
  0,
)

const selectionState = createInitialGameState(baseInput)
const validSoldierId = selectionState.soldiers[0]!.id
const excessMalformedRuntime: StrategyRuntime = {
  selectActivations: () =>
    success({
      activationOrders: [
        { soldierId: validSoldierId },
        { soldierId: 42 as never },
      ],
      strategyMemory: {},
    }),
  runSoldierBrain: brainRuntime({ type: "TURN_TO_STONE" }).runSoldierBrain,
}
const excessMalformed = resolveActivationSelection(
  selectionState,
  excessMalformedRuntime,
  "bottom",
)

let deep: unknown = null
for (let index = 0; index < 3_000; index += 1) deep = [deep]
let deepValidation: string
try {
  const parsed = StrategyResultSchema.safeParse({
    activationOrders: [],
    strategyMemory: deep,
  })
  deepValidation = parsed.success ? "accepted" : "rejected"
} catch (error) {
  deepValidation = `threw:${error instanceof Error ? error.name : String(error)}`
}

let overlappingArenaAccepted = false
try {
  createInitialGameState({
    ...baseInput,
    arenaVariant: {
      ...baseInput.arenaVariant,
      terrainStones: [{ x: 2, y: 11 }],
    },
  })
  overlappingArenaAccepted = true
} catch {
  overlappingArenaAccepted = false
}

const legacyBoundaryAccepted = ChronicleEventSchema.safeParse({
  type: "BACKSTAB_RESOLVED",
  sequence: 0,
  context: {},
  privacy: "public",
  payload: { boundary: "post-advance", pairs: [] },
}).success

const pushState = stateWith([
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
  }),
])
const pushed = resolveAction(
  pushState,
  "pusher",
  { type: "MOVE", direction: "RIGHT" },
  { advanced: false },
)

console.log(
  JSON.stringify(
    {
      noAdvanceLastSoldier: {
        status: noAdvance.state.soldiers.find(
          (candidate) => candidate.id === "last-bottom",
        )?.status,
        outcome: noAdvance.state.outcome ?? null,
        matchEndedEvents: noAdvance.events.filter(
          (event) => event.type === "MATCH_ENDED",
        ).length,
      },
      cycleEndBackstabActor: {
        status: postBackstab.state.soldiers.find(
          (candidate) => candidate.id === "actor",
        )?.status,
        slotEnded: postBackstab.slot.ended,
        terminalReason: postBackstab.slot.terminalReason ?? null,
      },
      excessMalformedOrder: {
        validOrdersRetained: excessMalformed.state.orders.length,
        violationEvents: excessMalformed.events.filter(
          (event) => event.type === "RUNTIME_VIOLATION",
        ).length,
      },
      deepValidation,
      overlappingArenaAccepted,
      legacyBoundaryAccepted,
      successfulPushPusherHistory:
        pushed.state.soldiers.find((candidate) => candidate.id === "pusher")
          ?.lastSuccessfulMoveDirection,
    },
    null,
    2,
  ),
)
