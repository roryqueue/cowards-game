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
  CANDIDATE_MATCH_KERNEL,
  createInitialGameState,
  resolveAction,
  success,
  type GameState,
  type StrategyRuntime,
  type TransitionResult,
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

const runCandidateActivation = (
  state: GameState,
  runtime: StrategyRuntime,
  soldierId: string,
): TransitionResult => {
  const execution = CANDIDATE_MATCH_KERNEL.runActivationFromState({
    state,
    runtime,
    soldierId,
  })
  if (execution.kind !== "completed" || execution.result === undefined) {
    throw new Error(
      `candidate audit activation failed: ${execution.failure?.code ?? "missing result"}`,
    )
  }
  return execution.result
}

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
const noAdvance = runCandidateActivation(
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
const postBackstab = runCandidateActivation(
  backstabState,
  brainRuntime({ type: "TURN", direction: "RIGHT" }),
  "actor",
)
const backstabClosure = postBackstab.events.find(
  ({ type }) => type === "ACTIVATION_ENDED",
)

const selectionMachine = CANDIDATE_MATCH_KERNEL.createMachine(baseInput)
const validSoldierId = selectionMachine.state.soldiers[0]!.id
const matchStarted = CANDIDATE_MATCH_KERNEL.stepMatch(selectionMachine, {
  kind: "advance",
})
if (matchStarted.kind !== "transition") {
  throw new Error("candidate audit match-start transition missing")
}
const roundStarted = CANDIDATE_MATCH_KERNEL.stepMatch(matchStarted.machine, {
  kind: "advance",
})
if (roundStarted.kind !== "transition") {
  throw new Error("candidate audit round-start transition missing")
}
const selectionEffect = CANDIDATE_MATCH_KERNEL.stepMatch(
  roundStarted.machine,
  { kind: "advance" },
)
if (selectionEffect.kind !== "effect") {
  throw new Error("candidate audit selection effect missing")
}
const excessMalformed = CANDIDATE_MATCH_KERNEL.stepMatch(
  selectionEffect.machine,
  {
    kind: "runtime_resume",
    requestId: selectionEffect.request.requestId,
    effectKind: selectionEffect.request.kind,
    classification: "success",
    value: {
      activationOrders: [
        { soldierId: validSoldierId },
        { soldierId: 42 },
      ],
      strategyMemory: {},
    },
  },
)
if (excessMalformed.kind !== "transition") {
  throw new Error("candidate audit selection transition missing")
}

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
        slotEnded: backstabClosure !== undefined,
        terminalReason:
          backstabClosure === undefined
            ? null
            : ((backstabClosure.payload as { reason?: unknown }).reason ??
              null),
      },
      excessMalformedOrder: {
        validOrdersRetained: excessMalformed.machine.selections.bottom.length,
        violationEvents: excessMalformed.record.events.filter(
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
