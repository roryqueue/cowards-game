import type {
  ActivationOrder,
  CanonicalCompatibilityTuple,
  JsonValue,
  MatchOutcome,
  RuntimeViolation,
  SemanticIntegrityIssue,
  SoldierBrainInput,
  StrategyInput,
} from "@cowards/spec"
import type {
  ActivationSlotState,
  GameState,
  TransitionEventSummary,
  TransitionResult,
} from "../types.js"

export type KernelEffectKind = "selectActivations" | "soldierBrain"

export type KernelStage =
  | "match_start"
  | "round_start"
  | "select_bottom"
  | "select_top"
  | "prepare_slots"
  | "cycle_slot_start"
  | "soldier_observation"
  | "soldier_effect"
  | "cycle_slot_finish"
  | "round_finish"
  | "contraction"
  | "max_phases"
  | "completed"

export interface KernelCursor {
  readonly stage: KernelStage
  readonly ordinal: number
  readonly phaseNumber: number
  readonly roundNumber: 1 | 2 | 3 | 4
  readonly cycleLayer: number
  readonly slotIndex: number
}

export interface KernelCoordinates extends Readonly<Record<string, unknown>> {
  readonly phaseNumber: number
  readonly roundNumber: 1 | 2 | 3 | 4
  readonly cycleIndex?: number | undefined
  readonly activationId?: string | undefined
  readonly activationIndex?: number | undefined
  readonly actingPlayerId?: string | undefined
  readonly soldierId?: string | undefined
  readonly stage: KernelStage
  readonly ordinal: number
}

export interface KernelEffectRequestBase {
  readonly requestId: string
  readonly semanticTupleId: string
  readonly coordinates: KernelCoordinates
}

export interface KernelSelectActivationsRequest extends KernelEffectRequestBase {
  readonly kind: "selectActivations"
  readonly input: StrategyInput
}

export interface KernelSoldierBrainRequest extends KernelEffectRequestBase {
  readonly kind: "soldierBrain"
  readonly input: SoldierBrainInput
}

export type KernelEffectRequest =
  | KernelSelectActivationsRequest
  | KernelSoldierBrainRequest

interface KernelResumeBase {
  readonly kind: "runtime_resume"
  readonly requestId: string
  readonly effectKind: KernelEffectKind
}

export interface KernelSuccessResume extends KernelResumeBase {
  readonly classification: "success"
  readonly value: unknown
}

export interface KernelPlayerViolationResume extends KernelResumeBase {
  readonly classification: "player_violation"
  readonly violation: RuntimeViolation
}

export interface KernelSystemFailureResume extends KernelResumeBase {
  readonly classification: "system_failure"
  readonly failure: {
    readonly code: string
    readonly retryable: boolean
  }
}

export type KernelResume =
  | KernelSuccessResume
  | KernelPlayerViolationResume
  | KernelSystemFailureResume

export interface KernelAdvanceCommand {
  readonly kind: "advance"
}

export type KernelInput = KernelAdvanceCommand | KernelResume

export interface KernelSemanticTuple {
  readonly tupleId: string
  readonly tuple: Readonly<CanonicalCompatibilityTuple>
}

export interface KernelTransitionRecord {
  readonly transitionKind: string
  readonly semanticTupleId: string
  readonly semanticTuple: Readonly<CanonicalCompatibilityTuple>
  readonly coordinates: KernelCoordinates
  readonly classification: string
  readonly events: readonly TransitionEventSummary[]
  /** Privacy-safe gameplay projections at this boundary. */
  readonly beforeState: Readonly<Record<string, unknown>>
  readonly afterState: Readonly<Record<string, unknown>>
  readonly beforeStateHash: string
  readonly afterStateHash: string
  /** Machine hashes also bind cursor, pending-effect, and scheduling state. */
  readonly beforeMachineHash: string
  readonly afterMachineHash: string
  readonly terminalStatus: MatchOutcome | null
  readonly failureStatus: null
}

export interface KernelRestrictedFailure {
  readonly classification: "system_failure"
  readonly category: "CANONICAL_INTEGRITY_FAILURE" | "RUNTIME_SYSTEM_FAILURE"
  readonly ownership: "system_integrity" | "runtime_system"
  readonly code: string
  readonly retryable: boolean
  readonly issues?: readonly SemanticIntegrityIssue[] | undefined
}

export interface KernelRecorderMaterial {
  readonly events: readonly TransitionEventSummary[]
  readonly initialState: GameState
  readonly finalState: GameState
  readonly boundaries: readonly KernelTransitionRecord[]
}

export interface MatchMachine {
  readonly executionMode: "match" | "activation"
  readonly state: GameState
  readonly initialState: GameState
  readonly semanticTuple: KernelSemanticTuple
  readonly cursor: KernelCursor
  readonly maxPhases: number
  readonly phasesRun: number
  readonly pendingEffect?: KernelEffectRequest | undefined
  readonly selections: Readonly<{
    bottom: readonly ActivationOrder[]
    top: readonly ActivationOrder[]
  }>
  readonly slots: readonly ActivationSlotState[]
  readonly fullEvents: readonly TransitionEventSummary[]
  readonly consumedRequestIds: readonly string[]
}

export type KernelStepResult =
  | {
      readonly kind: "transition"
      readonly machine: MatchMachine
      readonly record: KernelTransitionRecord
    }
  | {
      readonly kind: "effect"
      readonly machine: MatchMachine
      readonly request: KernelEffectRequest
    }
  | {
      readonly kind: "completed"
      readonly machine: MatchMachine
      readonly record: KernelTransitionRecord
      readonly result: TransitionResult
    }
  | {
      readonly kind: "failure"
      readonly machine: MatchMachine
      readonly failure: KernelRestrictedFailure
    }

export type CandidateExecution =
  | {
      readonly kind: "completed"
      readonly result: TransitionResult
      readonly transitions: readonly KernelTransitionRecord[]
      readonly recorderMaterial: KernelRecorderMaterial
    }
  | {
      readonly kind: "failure"
      readonly transitions: readonly []
      readonly failure: KernelRestrictedFailure
      readonly unchangedState: GameState
    }

export interface CandidateRuntimeSystemFailureResult {
  readonly ok: false
  readonly systemFailure: {
    readonly code: string
    readonly retryable: boolean
  }
}

export interface CandidateActivationExecution {
  readonly kind: "completed" | "failure"
  readonly result?: TransitionResult | undefined
  readonly transitions: readonly KernelTransitionRecord[]
  readonly recorderMaterial?: KernelRecorderMaterial | undefined
  readonly failure?: KernelRestrictedFailure | undefined
  readonly unchangedState?: GameState | undefined
}

export interface CandidateStrategyRuntime {
  selectActivations(input: StrategyInput):
    | {
        readonly ok: true
        readonly value: {
          readonly activationOrders: readonly {
            readonly soldierId: string
            readonly objective?: JsonValue | undefined
          }[]
          readonly strategyMemory: JsonValue
        }
      }
    | { readonly ok: false; readonly violation: RuntimeViolation }
    | CandidateRuntimeSystemFailureResult
  runSoldierBrain(input: SoldierBrainInput):
    | {
        readonly ok: true
        readonly value: {
          readonly action: unknown
          readonly soldierMemory: JsonValue
        }
      }
    | { readonly ok: false; readonly violation: RuntimeViolation }
    | CandidateRuntimeSystemFailureResult
}
