import { createHash } from "node:crypto"
import {
  AuthenticatedRuntimeInvocationRequestV117Schema,
  COMPATIBILITY_VERSIONS,
  RuntimeInvocationResultV117Schema,
  admitCanonicalJsonValue,
  serializeRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationResultV117,
  type RuntimeViolation,
} from "@cowards/spec"
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
import {
  CANDIDATE_KERNEL_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID,
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
  CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
} from "./types.js"
import { hashKernelRecorderMaterial, validateMachine } from "./validate.js"
import { issueCandidateExecutionEvidence } from "./recorder-evidence-authority.js"
import type {
  ActivationSlotState,
  CreateInitialGameStateInput,
  GameState,
} from "../types.js"
import { getSoldier } from "../selectors.js"

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
    semanticTuple?: MatchMachine["semanticTuple"] | undefined
    slots?: readonly ActivationSlotState[] | undefined
  },
): MatchMachine => ({
  executionMode: input.executionMode,
  state,
  initialState: state,
  semanticTuple: input.semanticTuple ?? {
    tupleId: CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID,
    tuple: CANDIDATE_KERNEL_SEMANTIC_TUPLE,
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

export const createCandidateMatchMachineV117 = (
  input: Omit<CandidateMatchInput, "runtime">,
): MatchMachine => {
  const created = createCandidateInitialGameState(input)
  if (!created.ok) throw new Error("CANDIDATE_INITIAL_STATE_REJECTED")
  return assertMachine(
    baseMachine(created.state, {
      executionMode: "match",
      stage: "match_start",
      maxPhases: input.maxPhases ?? 100,
      semanticTuple: {
        tupleId: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
        tuple: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
      },
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

export const createCandidateActivationMachineV117 = (input: {
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
      semanticTuple: {
        tupleId: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID,
        tuple: CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE,
      },
    }),
  )
}

const runtimeResume = (
  runtime: CandidateStrategyRuntime,
  request: KernelEffectRequest,
): KernelResume => {
  try {
    const result = (() => {
      if (
        request.semanticTupleId !==
        CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID
      ) {
        return request.kind === "selectActivations"
          ? runtime.selectActivations(request.input)
          : runtime.runSoldierBrain(request.input)
      }
      const detachedRequest = globalThis.structuredClone(request)
      const deepFreeze = (value: unknown): void => {
        if (
          value === null ||
          typeof value !== "object" ||
          Object.isFrozen(value)
        ) {
          return
        }
        for (const child of Object.values(value as Record<string, unknown>)) {
          deepFreeze(child)
        }
        Object.freeze(value)
      }
      deepFreeze(detachedRequest)
      return detachedRequest.kind === "selectActivations"
        ? runtime.selectActivations(detachedRequest.input, detachedRequest)
        : runtime.runSoldierBrain(detachedRequest.input, detachedRequest)
    })()

    if (
      request.semanticTupleId ===
      CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID
    ) {
      if (!("kind" in result) || result.kind !== "v1_17_bound") {
        return {
          kind: "runtime_resume",
          requestId: request.requestId,
          effectKind: request.kind,
          classification: "system_failure",
          failure: { code: "OUTER_FRAME_UNDECODABLE", retryable: false },
        }
      }
      const parsedRequest =
        AuthenticatedRuntimeInvocationRequestV117Schema.safeParse(
          result.request,
        )
      const parsedOutcome = RuntimeInvocationResultV117Schema.safeParse(
        result.outcome,
      )
      if (!parsedRequest.success || !parsedOutcome.success) {
        return {
          kind: "runtime_resume",
          requestId: request.requestId,
          effectKind: request.kind,
          classification: "system_failure",
          failure: { code: "OUTER_FRAME_UNDECODABLE", retryable: false },
        }
      }
      const boundRequest = parsedRequest.data as typeof result.request
      const successor = parsedOutcome.data as RuntimeInvocationResultV117
      const admittedInput = admitCanonicalJsonValue(request.input, {
        profile: "host-api-value",
      })
      const expectedCandidateTuple = CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE
      const serializedRequest = serializeRuntimeInvocationRequestV117(
        boundRequest,
      )
      const expectedRequestSha256 =
        `sha256:${createHash("sha256").update(serializedRequest).digest("hex")}`
      if (
        !admittedInput.ok ||
        request.semanticTupleId !==
          CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID ||
        boundRequest.kernelRequestId !== request.requestId ||
        boundRequest.method !== request.kind ||
        boundRequest.semanticTuple.tupleId !==
          CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID ||
        boundRequest.semanticTuple.rules !== expectedCandidateTuple.rules ||
        boundRequest.semanticTuple.engine !== expectedCandidateTuple.engine ||
        boundRequest.semanticTuple.runtimeAbi !==
          expectedCandidateTuple.runtimeAbi ||
        boundRequest.semanticTuple.chronicle !==
          expectedCandidateTuple.chronicle ||
        boundRequest.semanticTuple.arenaCatalog !==
          expectedCandidateTuple.arenaCatalog ||
        boundRequest.semanticTuple.setPolicy !==
          expectedCandidateTuple.setPolicy ||
        boundRequest.input.canonicalSha256 !==
          admittedInput.canonicalSha256 ||
        boundRequest.input.canonicalByteLength !==
          admittedInput.canonicalByteLength ||
        successor.trace.requestId !== boundRequest.requestId ||
        successor.trace.invocationId !== boundRequest.invocationId ||
        successor.trace.kernelRequestId !== boundRequest.kernelRequestId ||
        successor.trace.method !== boundRequest.method ||
        successor.trace.requestSha256 !== expectedRequestSha256 ||
        successor.trace.budgetProfileSha256 !==
          boundRequest.budget.profileSha256 ||
        successor.trace.inputSha256 !== boundRequest.input.canonicalSha256 ||
        successor.trace.retryIdentitySha256 !==
          boundRequest.retry.identitySha256
      ) {
        return {
          kind: "runtime_resume",
          requestId: request.requestId,
          effectKind: request.kind,
          classification: "system_failure",
          failure: {
            code: "OUTER_FRAME_WRONG_BINDING",
            retryable: false,
          },
        }
      }
      if (successor.kind === "success") {
        return {
          kind: "runtime_resume",
          requestId: request.requestId,
          effectKind: request.kind,
          classification: "success",
          value: successor.value,
        }
      }
      if (successor.kind === "system_failure") {
        return {
          kind: "runtime_resume",
          requestId: request.requestId,
          effectKind: request.kind,
          classification: "system_failure",
          failure: {
            code: successor.failure.code,
            retryable: successor.failure.retryable,
          },
        }
      }
      const violation: RuntimeViolation = {
        type: successor.violation.code,
        message: successor.violation.publicMessage,
      }
      return {
        kind: "runtime_resume",
        requestId: request.requestId,
        effectKind: request.kind,
        classification: "player_violation",
        violation,
      }
    }
    if ("ok" in result && result.ok) {
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
    if ("violation" in result) {
      return {
        kind: "runtime_resume",
        requestId: request.requestId,
        effectKind: request.kind,
        classification: "player_violation",
        violation: result.violation,
      }
    }
    return {
      kind: "runtime_resume",
      requestId: request.requestId,
      effectKind: request.kind,
      classification: "system_failure",
      failure: { code: "RUNTIME_INVOCATION_THROWN", retryable: false },
    }
  } catch {
    const candidate =
      request.semanticTupleId ===
      CANDIDATE_KERNEL_V117_SEMANTIC_TUPLE_ID
    return {
      kind: "runtime_resume",
      requestId: request.requestId,
      effectKind: request.kind,
      classification: "system_failure",
      failure: candidate
        ? { code: "ADAPTER_CRASH", retryable: true }
        : { code: "RUNTIME_INVOCATION_THROWN", retryable: false },
    }
  }
}

const completedExecution = (
  machine: MatchMachine,
  transitions: readonly KernelTransitionRecord[],
): CandidateExecution => {
  const material = {
    events: machine.fullEvents,
    initialState: machine.initialState,
    finalState: machine.state,
    boundaries: transitions,
  }
  return issueCandidateExecutionEvidence({
    kind: "completed",
    result: {
      state: machine.state,
      events: transitions.flatMap((record) => record.events),
    },
    transitions,
    recorderMaterial: {
      ...material,
      integrityHash: hashKernelRecorderMaterial(material),
    },
  })
}

const failedExecution = (
  unchangedState: GameState | null,
  failure: KernelRestrictedFailure,
): CandidateExecution => ({
  kind: "failure",
  transitions: [],
  failure,
  unchangedState,
})

const drive = (
  initialMachine: MatchMachine,
  runtime: CandidateStrategyRuntime,
  stopAfter: "match" | "activation" | "round",
): CandidateExecution => {
  let machine = initialMachine
  const attemptPrestate = globalThis.structuredClone(
    initialMachine.initialState,
  )
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
      return failedExecution(attemptPrestate, stepped.failure)
    }
    if (stepped.kind === "effect") {
      return failedExecution(
        attemptPrestate,
        restrictedIntegrityFailure("KERNEL_NESTED_EFFECT_INVALID"),
      )
    }
    transitions.push(stepped.record)
    machine = stepped.machine
    if (stepped.kind === "completed") {
      return completedExecution(machine, transitions)
    }
    if (
      ((stopAfter === "activation" &&
        (machine.cursor.stage === "completed" ||
          stepped.record.events.some((summary) =>
            ["ACTIVATION_ENDED", "MATCH_ENDED"].includes(summary.type),
          ))) ||
        (stopAfter === "round" &&
          (machine.cursor.stage === "contraction" ||
            machine.cursor.roundNumber !==
              initialMachine.cursor.roundNumber)))
    ) {
      return completedExecution(machine, transitions)
    }
  }
  return failedExecution(
    attemptPrestate,
    restrictedIntegrityFailure("KERNEL_DRIVER_STEP_LIMIT_EXCEEDED"),
  )
}

export const runCandidateMatch = (
  input: CandidateMatchInput,
): CandidateExecution => {
  let machine: MatchMachine
  try {
    machine = createCandidateMatchMachine(input)
  } catch {
    return failedExecution(
      null,
      restrictedIntegrityFailure("CANDIDATE_MATCH_ADMISSION_FAILED"),
    )
  }
  try {
    return drive(machine, input.runtime, "match")
  } catch {
    return failedExecution(
      globalThis.structuredClone(machine.initialState),
      restrictedIntegrityFailure("KERNEL_DRIVER_UNEXPECTED"),
    )
  }
}

export const runCandidateMatchV117 = (
  input: CandidateMatchInput,
): CandidateExecution => {
  let machine: MatchMachine
  try {
    machine = createCandidateMatchMachineV117(input)
  } catch {
    return failedExecution(
      null,
      restrictedIntegrityFailure("CANDIDATE_MATCH_ADMISSION_FAILED"),
    )
  }
  try {
    return drive(machine, input.runtime, "match")
  } catch {
    return failedExecution(
      globalThis.structuredClone(machine.initialState),
      restrictedIntegrityFailure("KERNEL_DRIVER_UNEXPECTED"),
    )
  }
}

export const runCandidateActivationFromState = (
  input: CandidateActivationInput,
): CandidateActivationExecution => {
  let machine: MatchMachine
  try {
    machine = createCandidateActivationMachine(input)
  } catch {
    return failedExecution(
      globalThis.structuredClone(input.state),
      restrictedIntegrityFailure("CANDIDATE_ACTIVATION_ADMISSION_FAILED"),
    )
  }
  try {
    return drive(machine, input.runtime, "activation")
  } catch {
    return failedExecution(
      globalThis.structuredClone(machine.initialState),
      restrictedIntegrityFailure("KERNEL_DRIVER_UNEXPECTED"),
    )
  }
}

export const runCandidateActivationFromStateV117 = (
  input: CandidateActivationInput,
): CandidateActivationExecution => {
  let machine: MatchMachine
  try {
    machine = createCandidateActivationMachineV117(input)
  } catch {
    return failedExecution(
      globalThis.structuredClone(input.state),
      restrictedIntegrityFailure("CANDIDATE_ACTIVATION_ADMISSION_FAILED"),
    )
  }
  try {
    return drive(machine, input.runtime, "activation")
  } catch {
    return failedExecution(
      globalThis.structuredClone(machine.initialState),
      restrictedIntegrityFailure("KERNEL_DRIVER_UNEXPECTED"),
    )
  }
}

/** Historical evidence projection over the canonical scheduler. */
export const runHistoricalV14RoundFromState = (input: {
  readonly state: GameState
  readonly runtime: CandidateStrategyRuntime
}): { readonly state: GameState; readonly events: KernelTransitionRecord["events"][number][] } => {
  const initialState = globalThis.structuredClone(input.state)
  const executableState = {
    ...initialState,
    versions: { ...COMPATIBILITY_VERSIONS },
  }
  const machine = assertMachine(
    baseMachine(executableState, {
      executionMode: "match",
      stage: "round_start",
      maxPhases: 100,
    }),
  )
  const execution = drive(machine, input.runtime, "round")
  if (execution.kind !== "completed") {
    throw new Error("Historical v1.4 round evidence execution failed.")
  }
  return {
    state: {
      ...execution.result.state,
      versions: initialState.versions,
      roundNumber: initialState.roundNumber,
      activationCount: initialState.activationCount,
      initiativePlayerId: initialState.initiativePlayerId,
    },
    // Original resolveRound evidence predated canonical sequence assignment.
    events: execution.recorderMaterial.events.map((summary) => ({
      ...summary,
      sequence: 0,
    })),
  }
}

export const MATCH_KERNEL = Object.freeze({
  tupleId: CANDIDATE_KERNEL_SEMANTIC_TUPLE_ID,
  tuple: CANDIDATE_KERNEL_SEMANTIC_TUPLE,
  createMachine: createCandidateMatchMachine,
  stepMatch: stepCandidateMatch,
  runMatch: runCandidateMatch,
  createMachineV117: createCandidateMatchMachineV117,
  runMatchV117: runCandidateMatchV117,
  createActivationMachine: createCandidateActivationMachine,
  runActivationFromState: runCandidateActivationFromState,
  createActivationMachineV117: createCandidateActivationMachineV117,
  runActivationFromStateV117: runCandidateActivationFromStateV117,
})
