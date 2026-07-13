import type { CanonicalCompatibilityTuple, JsonValue } from "@cowards/spec"
import { createCandidateInitialGameState } from "./create-initial-state.js"
import { stepCandidateMatch } from "./step.js"
import type {
  CandidateActivationExecution,
  CandidateExecution,
  CandidateStrategyRuntime,
  KernelEffectRequest,
  KernelRestrictedFailure,
  KernelResume,
  KernelTransitionRecord,
  MatchMachine,
} from "./types.js"
import { validateMachine } from "./validate.js"
import type {
  ActivationSlotState,
  CreateInitialGameStateInput,
  GameState,
} from "../types.js"
import { getSoldier } from "../selectors.js"

const CANDIDATE_TUPLE = Object.freeze({
  rules: "cowards-rules-v1.4",
  engine: "engine-kernel-v1.37-candidate-1",
  runtimeAbi: "strategy-runtime-abi-v1.14",
  chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
  arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
  setPolicy: "canonical-set-policy-v1.4",
}) satisfies Readonly<CanonicalCompatibilityTuple>

const CANDIDATE_TUPLE_ID =
  "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae" as const

interface CandidateMatchInput extends CreateInitialGameStateInput {
  readonly runtime: CandidateStrategyRuntime
  readonly maxPhases?: number | undefined
}

interface CandidateActivationInput {
  readonly state: GameState
  readonly runtime: CandidateStrategyRuntime
  readonly soldierId: string
  readonly objective?: JsonValue | undefined
}

const restrictedIntegrityFailure = (code: string): KernelRestrictedFailure => ({
  classification: "system_failure",
  category: "CANONICAL_INTEGRITY_FAILURE",
  ownership: "system_integrity",
  code,
  retryable: false,
})

const baseMachine = (
  state: GameState,
  input: {
    executionMode: MatchMachine["executionMode"]
    stage: MatchMachine["cursor"]["stage"]
    maxPhases: number
    slots?: readonly ActivationSlotState[] | undefined
  },
): MatchMachine => ({
  executionMode: input.executionMode,
  state,
  initialState: state,
  semanticTuple: {
    tupleId: CANDIDATE_TUPLE_ID,
    tuple: CANDIDATE_TUPLE,
  },
  cursor: {
    stage: input.stage,
    ordinal: 0,
    phaseNumber: state.phaseNumber,
    roundNumber: state.roundNumber,
    cycleLayer: 0,
    slotIndex: 0,
  },
  maxPhases: input.maxPhases,
  phasesRun: 0,
  selections: { bottom: [], top: [] },
  slots: input.slots ?? [],
  fullEvents: [],
  consumedRequestIds: [],
})

const assertMachine = (machine: MatchMachine): MatchMachine => {
  const failure = validateMachine(machine)
  if (failure !== undefined) {
    throw new Error(failure.code)
  }
  return machine
}

export const createCandidateMatchMachine = (
  input: Omit<CandidateMatchInput, "runtime">,
): MatchMachine => {
  const created = createCandidateInitialGameState(input)
  if (!created.ok) {
    throw new Error("CANDIDATE_INITIAL_STATE_REJECTED")
  }
  return assertMachine(
    baseMachine(created.state, {
      executionMode: "match",
      stage: "match_start",
      maxPhases: input.maxPhases ?? 100,
    }),
  )
}

export const createCandidateActivationMachine = (input: {
  readonly state: GameState
  readonly soldierId: string
  readonly objective?: JsonValue | undefined
}): MatchMachine => {
  const state = globalThis.structuredClone(input.state)
  const soldier = getSoldier(state, input.soldierId)
  const slot: ActivationSlotState = {
    activationId: `${state.phaseNumber}:${state.roundNumber}:0`,
    activationIndex: 0,
    actingPlayerId: soldier?.ownerPlayerId ?? state.players[0].id,
    soldierId: input.soldierId,
    ...(input.objective === undefined ? {} : { objective: input.objective }),
    cycleIndex: 0,
    advanced: false,
    ended: false,
  }
  return assertMachine(
    baseMachine(state, {
      executionMode: "activation",
      stage: "prepare_slots",
      maxPhases: 100,
      slots: [slot],
    }),
  )
}

const runtimeResume = (
  runtime: CandidateStrategyRuntime,
  request: KernelEffectRequest,
): KernelResume => {
  try {
    const result =
      request.kind === "selectActivations"
        ? runtime.selectActivations(request.input)
        : runtime.runSoldierBrain(request.input)
    if (result.ok) {
      return {
        kind: "runtime_resume",
        requestId: request.requestId,
        effectKind: request.kind,
        classification: "success",
        value: result.value,
      }
    }
    if ("systemFailure" in result) {
      return {
        kind: "runtime_resume",
        requestId: request.requestId,
        effectKind: request.kind,
        classification: "system_failure",
        failure: result.systemFailure,
      }
    }
    return {
      kind: "runtime_resume",
      requestId: request.requestId,
      effectKind: request.kind,
      classification: "player_violation",
      violation: result.violation,
    }
  } catch {
    return {
      kind: "runtime_resume",
      requestId: request.requestId,
      effectKind: request.kind,
      classification: "system_failure",
      failure: { code: "RUNTIME_INVOCATION_THROWN", retryable: false },
    }
  }
}

const completedExecution = (
  machine: MatchMachine,
  transitions: readonly KernelTransitionRecord[],
): CandidateExecution => ({
  kind: "completed",
  result: {
    state: machine.state,
    events: transitions.flatMap((record) => record.events),
  },
  transitions,
  recorderMaterial: {
    events: machine.fullEvents,
    initialState: machine.initialState,
    finalState: machine.state,
    boundaries: transitions,
  },
})

const failedExecution = (
  machine: MatchMachine,
  failure: KernelRestrictedFailure,
): CandidateExecution => ({
  kind: "failure",
  transitions: [],
  failure,
  unchangedState: machine.state,
})

const drive = (
  initialMachine: MatchMachine,
  runtime: CandidateStrategyRuntime,
  stopAfterActivation: boolean,
): CandidateExecution => {
  let machine = initialMachine
  const transitions: KernelTransitionRecord[] = []
  const maximumSteps = Math.max(10_000, (machine.maxPhases + 1) * 10_000)
  for (let stepIndex = 0; stepIndex < maximumSteps; stepIndex += 1) {
    let stepped = stepCandidateMatch(machine, { kind: "advance" })
    if (stepped.kind === "effect") {
      stepped = stepCandidateMatch(
        stepped.machine,
        runtimeResume(runtime, stepped.request),
      )
    }
    if (stepped.kind === "failure") {
      return failedExecution(stepped.machine, stepped.failure)
    }
    if (stepped.kind === "effect") {
      return failedExecution(
        stepped.machine,
        restrictedIntegrityFailure("KERNEL_NESTED_EFFECT_INVALID"),
      )
    }
    transitions.push(stepped.record)
    machine = stepped.machine
    if (stepped.kind === "completed") {
      return completedExecution(machine, transitions)
    }
    if (
      stopAfterActivation &&
      (machine.cursor.stage === "completed" ||
        stepped.record.events.some((summary) =>
          ["ACTIVATION_ENDED", "MATCH_ENDED"].includes(summary.type),
        ))
    ) {
      return completedExecution(machine, transitions)
    }
  }
  return failedExecution(
    machine,
    restrictedIntegrityFailure("KERNEL_DRIVER_STEP_LIMIT_EXCEEDED"),
  )
}

export const runCandidateMatch = (
  input: CandidateMatchInput,
): CandidateExecution => {
  try {
    return drive(createCandidateMatchMachine(input), input.runtime, false)
  } catch {
    throw new Error("CANDIDATE_MATCH_ADMISSION_FAILED")
  }
}

export const runCandidateActivationFromState = (
  input: CandidateActivationInput,
): CandidateActivationExecution =>
  drive(createCandidateActivationMachine(input), input.runtime, true)

/**
 * Inactive integration seam. The current `runMatch` export and authority
 * registry remain untouched until the explicit Phase-257 activation plan.
 */
export const CANDIDATE_MATCH_KERNEL = Object.freeze({
  tupleId: CANDIDATE_TUPLE_ID,
  tuple: CANDIDATE_TUPLE,
  createMachine: createCandidateMatchMachine,
  stepMatch: stepCandidateMatch,
  runMatch: runCandidateMatch,
  createActivationMachine: createCandidateActivationMachine,
  runActivationFromState: runCandidateActivationFromState,
})
