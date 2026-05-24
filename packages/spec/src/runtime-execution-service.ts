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
import {
  STRATEGY_RUNTIME_ABI_VERSION,
  type StrategyRuntimeLimits,
} from "./runtime.js"

export const RUNTIME_EXECUTION_SERVICE_VERSION =
  "runtime-execution-service-v1.15" as const

export const RUNTIME_EXECUTION_SERVICE_PUBLIC_NAME =
  "Strategy Execution Service / Runtime Broker" as const

export const RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL =
  "isolated JS/TS runtime service" as const

export const RUNTIME_EXECUTION_SERVICE_BOUNDARY_CONTRACT = {
  publicName: RUNTIME_EXECUTION_SERVICE_PUBLIC_NAME,
  currentImplementationLabel: RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL,
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
  runtimeAbiVersion: STRATEGY_RUNTIME_ABI_VERSION,
  requestSchema: "RuntimeExecutionServiceRequestSchema",
  responseSchema: "RuntimeExecutionServiceResponseSchema",
  resultPrivacy: "internal_runtime_result",
  futureBrokerReady: true,
} as const

export const RUNTIME_EXECUTION_SERVICE_CURRENT_IMPLEMENTATION = {
  label: RUNTIME_EXECUTION_SERVICE_IMPLEMENTATION_LABEL,
  role: "current-http-json-binding",
  notBackend: true,
  notFinalRuntimeBroker: true,
  executesStrategyCodeOnlyBehindRuntimeAdapter: true,
} as const

export const RUNTIME_EXECUTION_SERVICE_TRANSPORT_BINDING = {
  current: "HTTP+JSON",
  endpoint: "POST /execute-match",
  healthEndpoint: "GET /health",
  transportNeutralContract: true,
  replacementPolicy:
    "Future brokers may front or replace this binding without changing Go orchestration, persistence, scoring, or public evidence ownership.",
} as const

export const RUNTIME_EXECUTION_SERVICE_AUTHORITY_POLICY = {
  allowed: [
    "validate-runtime-execution-service-request",
    "execute-js-ts-strategy-through-runtime-abi",
    "return-internal-runtime-result-to-go",
    "return-redacted-schema-valid-system-failure",
  ],
  disallowed: [
    "claim-jobs",
    "complete-matches",
    "persist-chronicles",
    "refresh-matchset-scoring",
    "serve-product-api-routes",
    "read-web-session-state",
    "deliver-public-evidence",
    "fallback-to-retired-typescript-backend",
  ],
} as const

export const RUNTIME_EXECUTION_SERVICE_SUBMISSION_ARTIFACT_POLICY = {
  validateWherePractical: true,
  compileOrTranspileWherePractical: true,
  hashSource: true,
  sizeCheckSource: true,
  packageImmutableRevisionForMatch: true,
  goAndWebApiMayExecuteOrTranspileStrategySource: false,
} as const

export const RUNTIME_EXECUTION_SERVICE_FAILURE_PRIVACY_POLICY = {
  schemaValidatedFailures: true,
  failClosedCodes: [
    "MALFORMED_REQUEST",
    "SOURCE_HASH_MISMATCH",
    "SOURCE_BYTES_MISMATCH",
    "UNSUPPORTED_RUNTIME_ADAPTER",
    "EXECUTION_EXCEPTION",
    "RESPONSE_SCHEMA_INVALID",
  ],
  privateDenylist: [
    "Strategy source",
    "StrategyMemory",
    "SoldierMemory",
    "objective payloads",
    "owner debug",
    "raw Awareness Grid",
    "stack traces",
    "stderr",
    "sessions",
    "tokens",
    "DB DSNs",
    "host paths",
    "private runtime internals",
  ],
} as const

export const RUNTIME_EXECUTION_SERVICE_NON_PROMOTION_POLICY = {
  workerThreadPromotedAsProductionSandbox: false,
  subprocessPromotedAsProductionSandbox: false,
  containerSubprocessPromotedAsProductionSandbox: false,
  wasmWasiComponentModelPromoted: false,
  nodeWasiAcceptedAsSandbox: false,
  countedNonJsPlayPromoted: false,
  productionSandboxReplacementPromoted: false,
} as const

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
