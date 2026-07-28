import type {
  ActivationOrder,
  ArenaVariant,
  BoardBounds,
  ChronicleEventContext,
  ChronicleEventType,
  ChroniclePrivacy,
  CompatibilityVersions,
  JsonValue,
  MatchId,
  MatchOutcome,
  PlayerId,
  Position,
  RuntimeViolation,
  Soldier,
  SoldierBrainInput,
  SoldierBrainResult,
  SoldierId,
  StrategyInput,
  StrategyMemory,
  StrategyResult,
  StrategyRevisionId,
} from "@cowards/spec"
import type {
  CandidateBoundRuntimeInvocationV117,
  KernelSelectActivationsRequest,
  KernelSoldierBrainRequest,
} from "./kernel/types.js"

export type PlayerSide = "bottom" | "top"
export type MatchPhase = "ROUND" | "CONTRACTION" | "COMPLETE"
export type RoundNumber = 1 | 2 | 3 | 4
export type ActivationCount = 1 | 2 | 3 | 4
export type BackstabBoundary =
  | "activation-start"
  | "activation-end"
  | "post-advance"
  | "cycle-start"
  | "cycle-end"

export interface EnginePlayer {
  id: PlayerId
  side: PlayerSide
  strategyRevisionId: StrategyRevisionId
  strategyMemory: StrategyMemory
}

export interface GameState {
  matchId: MatchId
  seed: string
  versions: CompatibilityVersions
  arenaVariant: ArenaVariant
  players: [EnginePlayer, EnginePlayer]
  phase: MatchPhase
  phaseNumber: number
  roundNumber: RoundNumber
  activationCount: ActivationCount
  /** Present only for explicit v1.19 successor dispatch. */
  readonly initialInitiativePlayerId?: PlayerId | undefined
  initiativePlayerId: PlayerId
  bounds: BoardBounds
  soldiers: Soldier[]
  terrainStones: Position[]
  outcome?: MatchOutcome | undefined
}

export interface TransitionEventSummary {
  type: ChronicleEventType
  sequence: number
  payload: JsonValue
  context?: ChronicleEventContext | undefined
  privacy?: ChroniclePrivacy | undefined
  privatePayload?: JsonValue | undefined
}

export interface TransitionResult<TState = GameState> {
  state: TState
  events: TransitionEventSummary[]
}

export type RuntimeResult<T> =
  | { ok: true; value: T }
  | { ok: false; violation: RuntimeViolation }
  | {
      ok: false
      /** Compatibility projection for non-gameplay runtime diagnostics. */
      violation: RuntimeViolation
      systemFailure: { readonly code: string; readonly retryable: boolean }
    }

export interface StrategyRuntime {
  selectActivations(input: StrategyInput): RuntimeResult<StrategyResult>
  runSoldierBrain(input: SoldierBrainInput): RuntimeResult<SoldierBrainResult>
}

/**
 * Current public runtime boundary accepted by the canonical kernel. Every
 * invocation is bound to the required kernel effect request and returns the
 * authenticated v1.17 request/outcome envelope. CandidateStrategyRuntime
 * remains the broader internal boundary for explicit historical dispatch.
 */
export interface CanonicalStrategyRuntime {
  selectActivations(
    input: StrategyInput,
    request: KernelSelectActivationsRequest,
  ): CandidateBoundRuntimeInvocationV117<StrategyResult>
  runSoldierBrain(
    input: SoldierBrainInput,
    request: KernelSoldierBrainRequest,
  ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult>
}

export type ActivationTerminalReason =
  | "BACKSTABBED"
  | "CYCLE_EXHAUSTED"
  | "MOVE_BLOCKED"
  | "INVALID_MOVE"
  | "SOLDIER_FELL"
  | "SOLDIER_STONED"
  | "RUNTIME_VIOLATION"
  | "MATCH_ENDED"

export interface ActivationContext {
  advanced: boolean
  terminalReason?: ActivationTerminalReason | undefined
}

export interface ActionResolution {
  state: GameState
  events: TransitionEventSummary[]
  advanced: boolean
  terminalReason?: ActivationTerminalReason | undefined
}

export interface CreateInitialGameStateInput {
  matchId: MatchId
  seed: string
  arenaVariant: ArenaVariant
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
}

export interface CreateInitialGameStateInputV119
  extends CreateInitialGameStateInput {
  readonly initialInitiativePlayerId: PlayerId
}

export interface RunMatchInput extends CreateInitialGameStateInput {
  runtime: CanonicalStrategyRuntime
  maxPhases?: number | undefined
}

export interface ActivationSelectionResult {
  state: GameState
  orders: ActivationOrder[]
}

export interface ActivationSlotState {
  activationId: string
  activationIndex: number
  actingPlayerId: PlayerId
  soldierId: SoldierId
  objective?: JsonValue | undefined
  cycleIndex: number
  advanced: boolean
  ended: boolean
  terminalReason?: ActivationTerminalReason | undefined
}

export interface BackstabPair {
  attackerId: SoldierId
  victimId: SoldierId
}

export const success = <T>(value: T): RuntimeResult<T> => ({ ok: true, value })

export const violation = <T = never>(
  type: RuntimeViolation["type"],
  message: string,
): RuntimeResult<T> => ({ ok: false, violation: { type, message } })

export const event = (
  type: ChronicleEventType,
  payload: unknown = {},
  options: {
    context?: ChronicleEventContext | undefined
    privacy?: ChroniclePrivacy | undefined
    privatePayload?: JsonValue | undefined
  } = {},
): TransitionEventSummary => ({
  type,
  sequence: 0,
  payload: payload as JsonValue,
  ...options,
})
