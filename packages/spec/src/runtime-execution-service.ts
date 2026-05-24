import type {
  ArenaVariant,
  BoardBounds,
  Chronicle,
  CompatibilityVersions,
  JsonValue,
  MatchId,
  MatchOutcome,
  PlayerId,
  Soldier,
  StrategyRevision,
  StrategyRevisionId,
} from "./types.js"
import type {
  StrategyRuntimeLimits,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "./runtime.js"

export const RUNTIME_EXECUTION_SERVICE_VERSION =
  "runtime-execution-service-v1.15" as const

export const RUNTIME_EXECUTION_SERVICE_SYSTEM_FAILURE_CODES = [
  "MALFORMED_REQUEST",
  "SOURCE_HASH_MISMATCH",
  "SOURCE_BYTES_MISMATCH",
  "UNSUPPORTED_RUNTIME_ADAPTER",
  "EXECUTION_EXCEPTION",
  "RESPONSE_SCHEMA_INVALID",
] as const

export type RuntimeExecutionServiceSystemFailureCode =
  (typeof RUNTIME_EXECUTION_SERVICE_SYSTEM_FAILURE_CODES)[number]

export type RuntimeExecutionPlayerSlot = "bottom" | "top"
export type RuntimeExecutionPlayerSide = "bottom" | "top"
export type RuntimeExecutionMatchPhase = "ROUND" | "CONTRACTION" | "COMPLETE"
export type RuntimeExecutionRoundNumber = 1 | 2 | 3 | 4
export type RuntimeExecutionActivationCount = 1 | 2 | 3 | 4

export interface RuntimeExecutionMatchInput {
  matchId: MatchId
  seed: string
  arenaVariant: ArenaVariant
  bottomPlayerId: PlayerId
  topPlayerId: PlayerId
  bottomStrategyRevisionId: StrategyRevisionId
  topStrategyRevisionId: StrategyRevisionId
  maxPhases?: number | undefined
}

export interface RuntimeExecutionServiceRequest {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION
  kind: "executeMatch"
  requestId: string
  match: RuntimeExecutionMatchInput
  strategies: {
    bottom: StrategyRevision
    top: StrategyRevision
  }
  limits: StrategyRuntimeLimits
}

export interface RuntimeExecutionEnginePlayer {
  id: PlayerId
  side: RuntimeExecutionPlayerSide
  strategyRevisionId: StrategyRevisionId
  strategyMemory: JsonValue
}

export interface RuntimeExecutionFinalState {
  matchId: MatchId
  seed: string
  versions: CompatibilityVersions
  arenaVariant: ArenaVariant
  players: [RuntimeExecutionEnginePlayer, RuntimeExecutionEnginePlayer]
  phase: RuntimeExecutionMatchPhase
  phaseNumber: number
  roundNumber: RuntimeExecutionRoundNumber
  activationCount: RuntimeExecutionActivationCount
  initiativePlayerId: PlayerId
  bounds: BoardBounds
  soldiers: Soldier[]
  terrainStones: ArenaVariant["terrainStones"]
  outcome?: MatchOutcome | undefined
}

export interface RuntimeExecutionServiceSuccessResponse {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION
  ok: true
  kind: "executionResult"
  requestId: string
  matchId: MatchId
  runtimeAbiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  result: {
    privacy: "internal_runtime_result"
    chronicle: Chronicle
    finalState: RuntimeExecutionFinalState
    runtimeViolationEventCount: number
  }
}

export interface RuntimeExecutionServiceSystemFailureResponse {
  contractVersion: typeof RUNTIME_EXECUTION_SERVICE_VERSION
  ok: false
  kind: "systemFailure"
  requestId: string
  matchId?: MatchId | undefined
  runtimeAbiVersion: typeof STRATEGY_RUNTIME_ABI_VERSION
  systemFailure: {
    code: RuntimeExecutionServiceSystemFailureCode
    message: string
    publicMessage: string
    retryable: boolean
    diagnostics?: JsonValue | undefined
  }
}

export type RuntimeExecutionServiceResponse =
  | RuntimeExecutionServiceSuccessResponse
  | RuntimeExecutionServiceSystemFailureResponse
