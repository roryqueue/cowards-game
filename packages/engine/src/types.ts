import type {
  ActivationOrder,
  ArenaVariant,
  BoardBounds,
  ChronicleEventType,
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

export type PlayerSide = "bottom" | "top"
export type MatchPhase = "ROUND" | "CONTRACTION" | "COMPLETE"
export type RoundNumber = 1 | 2 | 3 | 4
export type ActivationCount = 1 | 2 | 3 | 4
export type BackstabBoundary =
  | "activation-start"
  | "activation-end"
  | "post-advance"

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
}

export interface TransitionResult<TState = GameState> {
  state: TState
  events: TransitionEventSummary[]
}

export type RuntimeResult<T> =
  | { ok: true; value: T }
  | { ok: false; violation: RuntimeViolation }

export interface StrategyRuntime {
  selectActivations(input: StrategyInput): RuntimeResult<StrategyResult>
  runSoldierBrain(input: SoldierBrainInput): RuntimeResult<SoldierBrainResult>
}

export type ActivationTerminalReason =
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

export interface RunMatchInput extends CreateInitialGameStateInput {
  runtime: StrategyRuntime
  maxPhases?: number | undefined
}

export interface ActivationSelectionResult {
  state: GameState
  orders: ActivationOrder[]
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
): TransitionEventSummary => ({
  type,
  sequence: 0,
  payload: payload as JsonValue,
})
