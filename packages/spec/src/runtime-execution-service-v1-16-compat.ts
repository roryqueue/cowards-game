import { createHash } from "node:crypto"
import { z } from "zod"
import {
  RuntimeExecutionServiceRequestSchema,
  RuntimeExecutionServiceResponseSchema,
  StrategyRevisionSchema,
  StrategyRuntimeRequestEnvelopeSchema,
  StrategyRuntimeResponseEnvelopeSchema,
} from "./schemas.js"
import {
  RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceResponse,
} from "./runtime-execution-service.js"
import type {
  StrategyRuntimeRequestEnvelope,
  StrategyRuntimeResponseEnvelope,
} from "./runtime.js"
import type { StrategyRevision } from "./types.js"
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD,
} from "./integrity-authority.js"
import { STRATEGY_RUNTIME_ABI_VERSION } from "./versions.js"

export const HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16 = Object.freeze({
  runtimeServiceVersion: "runtime-execution-service-v1.16",
  runtimeAbiVersion: "strategy-runtime-abi-v1.14",
  semanticReceiptVersion: "runtime-semantic-receipt-v1",
  canonicalJsonVersion: "legacy-json-stringify-v1.16",
  requestLegacyJsonSha256:
    "0b8a74fad02e3dd96897509df65e8ad43311d0658c268a637c51972f02b19bfe",
  semanticTupleId:
    "sha256:922a6857fdbc8354b744d6e766bff216f3fee85b5ed381355cb427f5a616b3ae",
  semanticTuple: Object.freeze({
    rules: "cowards-rules-v1.4",
    engine: "engine-kernel-v1.37-candidate-1",
    runtimeAbi: "strategy-runtime-abi-v1.14",
    chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
    arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
    setPolicy: "canonical-set-policy-v1.4",
  }),
  protectedFiles: Object.freeze({
    "packages/spec/src/runtime-execution-service.ts":
      "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
    "packages/spec/artifacts/runtime-execution-service-request.v1.16.json":
      "5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5",
    "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
      "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
    "apps/go-backend/runtime_service_client.go":
      "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c",
    "apps/go-backend/runtime_semantic_receipt.go":
      "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
    "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
      "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
  }),
} as const)

export type HistoricalRuntimeExecutionServiceV116ProtectedPath =
  keyof typeof HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.protectedFiles

export const verifyHistoricalRuntimeExecutionServiceV116ProtectedBytes = (
  relativePath: HistoricalRuntimeExecutionServiceV116ProtectedPath,
  bytes: Uint8Array,
): boolean =>
  createHash("sha256").update(bytes).digest("hex") ===
  HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.protectedFiles[relativePath]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const revisionHasExactAbi = (value: unknown, expectedAbi: string): boolean => {
  if (!isRecord(value) || !isRecord(value.runtime)) return false
  if (value.runtime.abiVersion !== expectedAbi) {
    return false
  }
  if (!isRecord(value.metadata)) return false
  for (const field of ["sourceArtifact", "compiledArtifact"] as const) {
    const artifact = value.metadata[field]
    if (
      artifact !== undefined &&
      (!isRecord(artifact) ||
        artifact.abiVersion !== expectedAbi)
    ) {
      return false
    }
  }
  return true
}

const historicalRevisionHasExactAbi = (value: unknown): boolean =>
  revisionHasExactAbi(
    value,
    HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion,
  )

const historicalRequestHasExactIdentity = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    value.contractVersion !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion
  ) {
    return false
  }
  const strategies = value.strategies
  const evidenceSnapshot = value.evidenceSnapshot
  if (
    !isRecord(strategies) ||
    !historicalRevisionHasExactAbi(strategies.bottom) ||
    !historicalRevisionHasExactAbi(strategies.top) ||
    !isRecord(evidenceSnapshot) ||
    !isRecord(evidenceSnapshot.compatibility) ||
    evidenceSnapshot.compatibility.tupleId !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTupleId ||
    !isRecord(evidenceSnapshot.compatibility.tuple)
  ) {
    return false
  }
  const tuple = evidenceSnapshot.compatibility.tuple
  if (
    Object.entries(
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTuple,
    ).some(([key, expected]) => tuple[key] !== expected)
  ) {
    return false
  }
  return true
}

const versionedV117RequestHasExactIdentity = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    value.contractVersion !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion
  ) {
    return false
  }
  const strategies = value.strategies
  const evidenceSnapshot = value.evidenceSnapshot
  if (
    !isRecord(strategies) ||
    !revisionHasExactAbi(strategies.bottom, "strategy-runtime-abi-v1.17") ||
    !revisionHasExactAbi(strategies.top, "strategy-runtime-abi-v1.17") ||
    !isRecord(evidenceSnapshot) ||
    !isRecord(evidenceSnapshot.compatibility) ||
    evidenceSnapshot.compatibility.tupleId !==
      VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tupleId ||
    !isRecord(evidenceSnapshot.compatibility.tuple)
  ) {
    return false
  }
  const tuple = evidenceSnapshot.compatibility.tuple
  return Object.entries(VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tuple).every(
    ([key, expected]) => tuple[key] === expected,
  )
}

const normalizeRevisionAbiForSelectedSchema = (value: unknown): void => {
  if (
    !isRecord(value) ||
    !isRecord(value.runtime) ||
    !isRecord(value.metadata)
  ) {
    return
  }
  value.runtime.abiVersion = STRATEGY_RUNTIME_ABI_VERSION
  for (const field of ["sourceArtifact", "compiledArtifact"] as const) {
    const artifact = value.metadata[field]
    if (isRecord(artifact)) artifact.abiVersion = STRATEGY_RUNTIME_ABI_VERSION
  }
}

const normalizeHistoricalRequestForSelectedSchema = (
  value: unknown,
): unknown => {
  const normalized = structuredClone(value)
  if (!isRecord(normalized) || !isRecord(normalized.strategies)) {
    return normalized
  }
  normalizeRevisionAbiForSelectedSchema(normalized.strategies.bottom)
  normalizeRevisionAbiForSelectedSchema(normalized.strategies.top)
  if (
    isRecord(normalized.evidenceSnapshot) &&
    isRecord(normalized.evidenceSnapshot.compatibility)
  ) {
    normalized.evidenceSnapshot.compatibility = {
      tupleId: CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId,
      tuple: { ...CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple },
    }
  }
  if (
    String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.19" &&
    isRecord(normalized.match) &&
    isRecord(normalized.evidenceSnapshot) &&
    isRecord(normalized.evidenceSnapshot.entrants) &&
    isRecord(normalized.evidenceSnapshot.entrants.bottom) &&
    isRecord(normalized.evidenceSnapshot.entrants.top)
  ) {
    const match = normalized.match
    match.initialInitiativePlayerId = match.bottomPlayerId
    match.candidateMatch = {
      semanticAuthorityKey: "runtime-v1.19",
      matchId: match.matchId,
      seed: match.seed,
      arenaVariantId: isRecord(match.arenaVariant)
        ? match.arenaVariant.id
        : "invalid",
      bottomStrategyRevisionId: match.bottomStrategyRevisionId,
      topStrategyRevisionId: match.topStrategyRevisionId,
      bottomPlayerId: match.bottomPlayerId,
      topPlayerId: match.topPlayerId,
      bottomEntrantKey:
        normalized.evidenceSnapshot.entrants.bottom.entrantKey,
      topEntrantKey: normalized.evidenceSnapshot.entrants.top.entrantKey,
      setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
      scenarioId: `set-scenario:sha256:${"0".repeat(64)}`,
      conditionId: `set-condition:sha256:${"0".repeat(64)}`,
      conditionOrdinal: 0,
      conditionSuffix: "a-bottom-a-first",
      requestIdentity: `set-request:sha256:${"0".repeat(64)}`,
      arenaCatalogVersion: "canonical-arena-catalog-v1.37",
      arenaSemanticGeometryHash: `sha256:${"0".repeat(64)}`,
      initialInitiativeEntrantKey:
        normalized.evidenceSnapshot.entrants.bottom.entrantKey,
      initialInitiativePlayerId: match.bottomPlayerId,
    }
  }
  return normalized
}

const normalizeHistoricalRevisionForSelectedSchema = (
  value: unknown,
): unknown => {
  const normalized = structuredClone(value)
  normalizeRevisionAbiForSelectedSchema(normalized)
  return normalized
}

export const HistoricalStrategyRevisionV114Schema = z.custom<StrategyRevision>(
  (value) =>
    historicalRevisionHasExactAbi(value) &&
    StrategyRevisionSchema.safeParse(
      normalizeHistoricalRevisionForSelectedSchema(value),
    ).success,
  { error: "historical strategy revision v1.14 is invalid" },
)

export const HistoricalRuntimeExecutionServiceRequestV116Schema =
  z.custom<RuntimeExecutionServiceRequest>(
    (value) =>
      historicalRequestHasExactIdentity(value) &&
      RuntimeExecutionServiceRequestSchema.safeParse(
        normalizeHistoricalRequestForSelectedSchema(value),
      ).success,
    { error: "historical runtime service v1.16 request is invalid" },
  )

/** Immutable runtime-v1.17 Match envelope, independent of selected current. */
export const VersionedRuntimeExecutionServiceRequestV117Schema =
  z.custom<RuntimeExecutionServiceRequest>(
    (value) =>
      versionedV117RequestHasExactIdentity(value) &&
      RuntimeExecutionServiceRequestSchema.safeParse(
        normalizeHistoricalRequestForSelectedSchema(value),
      ).success,
    { error: "versioned runtime service v1.17 request is invalid" },
  )

export const isExactCommittedRuntimeExecutionServiceRequestV116 = (
  value: unknown,
): boolean => {
  if (
    !HistoricalRuntimeExecutionServiceRequestV116Schema.safeParse(value).success
  ) {
    return false
  }
  const serialized = JSON.stringify(value)
  return (
    serialized !== undefined &&
    createHash("sha256").update(serialized, "utf8").digest("hex") ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.requestLegacyJsonSha256
  )
}

const historicalResponseHasExactIdentity = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    value.contractVersion !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion ||
    value.runtimeAbiVersion !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion
  ) {
    return false
  }
  if (value.ok !== true) return value.ok === false
  if (!isRecord(value.result) || !isRecord(value.result.semanticReceipt)) {
    return false
  }
  const receipt = value.result.semanticReceipt
  return (
    receipt.schemaVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticReceiptVersion &&
    receipt.serviceContractVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion &&
    receipt.runtimeAbiVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion &&
    receipt.compatibilityTupleId ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTupleId &&
    receipt.rulesVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTuple.rules &&
    receipt.engineVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTuple.engine &&
    receipt.chronicleVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTuple.chronicle &&
    receipt.arenaCatalogVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTuple.arenaCatalog &&
    receipt.setPolicyVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.semanticTuple.setPolicy
  )
}

const normalizeHistoricalResponseForSelectedSchema = (
  value: unknown,
): unknown => {
  const normalized = structuredClone(value)
  if (isRecord(normalized)) {
    normalized.runtimeAbiVersion = STRATEGY_RUNTIME_ABI_VERSION
    if (
      normalized.ok === true &&
      isRecord(normalized.result) &&
      isRecord(normalized.result.semanticReceipt)
    ) {
      normalized.result.semanticReceipt.schemaVersion =
        RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION
      if (
        String(STRATEGY_RUNTIME_ABI_VERSION) ===
          "strategy-runtime-abi-v1.19" &&
        isRecord(normalized.result.finalState) &&
        Array.isArray(normalized.result.finalState.players) &&
        isRecord(normalized.result.finalState.players[0])
      ) {
        normalized.result.finalState.initialInitiativePlayerId =
          normalized.result.finalState.players[0].id
      }
    }
  }
  return normalized
}

export const HistoricalRuntimeExecutionServiceResponseV116Schema =
  z.custom<RuntimeExecutionServiceResponse>(
    (value) =>
      historicalResponseHasExactIdentity(value) &&
      RuntimeExecutionServiceResponseSchema.safeParse(
        normalizeHistoricalResponseForSelectedSchema(value),
      ).success,
    { error: "historical runtime service v1.16 response is invalid" },
  )

const versionedV117ResponseHasExactIdentity = (value: unknown): boolean => {
  if (
    !isRecord(value) ||
    value.contractVersion !==
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeServiceVersion ||
    value.runtimeAbiVersion !== "strategy-runtime-abi-v1.17"
  ) {
    return false
  }
  if (value.ok !== true) return value.ok === false
  if (!isRecord(value.result) || !isRecord(value.result.semanticReceipt)) {
    return false
  }
  const receipt = value.result.semanticReceipt
  const tuple = VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD
  return (
    receipt.schemaVersion === "runtime-semantic-receipt-v1" &&
    receipt.runtimeAbiVersion === tuple.tuple.runtimeAbi &&
    receipt.compatibilityTupleId === tuple.tupleId &&
    receipt.rulesVersion === tuple.tuple.rules &&
    receipt.engineVersion === tuple.tuple.engine &&
    receipt.chronicleVersion === tuple.tuple.chronicle &&
    receipt.arenaCatalogVersion === tuple.tuple.arenaCatalog &&
    receipt.setPolicyVersion === tuple.tuple.setPolicy
  )
}

const normalizeVersionedV117ResponseForSelectedSchema = (
  value: unknown,
): unknown => {
  const normalized = structuredClone(value)
  if (!isRecord(normalized)) return normalized
  normalized.runtimeAbiVersion = STRATEGY_RUNTIME_ABI_VERSION
  if (
    normalized.ok === true &&
    isRecord(normalized.result) &&
    isRecord(normalized.result.semanticReceipt)
  ) {
    normalized.result.semanticReceipt.schemaVersion =
      RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION
    if (
      String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.19" &&
      isRecord(normalized.result.finalState) &&
      Array.isArray(normalized.result.finalState.players) &&
      isRecord(normalized.result.finalState.players[0])
    ) {
      normalized.result.finalState.initialInitiativePlayerId =
        normalized.result.finalState.players[0].id
    }
  }
  return normalized
}

/** Immutable runtime-v1.17 Match response, independent of selected current. */
export const VersionedRuntimeExecutionServiceResponseV117Schema =
  z.custom<RuntimeExecutionServiceResponse>(
    (value) =>
      versionedV117ResponseHasExactIdentity(value) &&
      RuntimeExecutionServiceResponseSchema.safeParse(
        normalizeVersionedV117ResponseForSelectedSchema(value),
      ).success,
    { error: "versioned runtime service v1.17 response is invalid" },
  )

const historicalRuntimeEnvelopeHasExactAbi = (value: unknown): boolean =>
  isRecord(value) &&
  value.abiVersion ===
    HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion &&
  (!isRecord(value.runtime) ||
    value.runtime.abiVersion ===
      HISTORICAL_RUNTIME_EXECUTION_SERVICE_V1_16.runtimeAbiVersion)

const normalizeHistoricalRuntimeEnvelopeForSelectedSchema = (
  value: unknown,
): unknown => {
  const normalized = structuredClone(value)
  if (!isRecord(normalized)) return normalized
  normalized.abiVersion = STRATEGY_RUNTIME_ABI_VERSION
  if (isRecord(normalized.runtime)) {
    normalized.runtime.abiVersion = STRATEGY_RUNTIME_ABI_VERSION
  }
  return normalized
}

export const HistoricalStrategyRuntimeRequestEnvelopeV114Schema =
  z.custom<StrategyRuntimeRequestEnvelope>(
    (value) =>
      historicalRuntimeEnvelopeHasExactAbi(value) &&
      StrategyRuntimeRequestEnvelopeSchema.safeParse(
        normalizeHistoricalRuntimeEnvelopeForSelectedSchema(value),
      ).success,
    { error: "historical strategy runtime v1.14 request is invalid" },
  )

export const HistoricalStrategyRuntimeResponseEnvelopeV114Schema =
  z.custom<StrategyRuntimeResponseEnvelope>(
    (value) =>
      historicalRuntimeEnvelopeHasExactAbi(value) &&
      StrategyRuntimeResponseEnvelopeSchema.safeParse(
        normalizeHistoricalRuntimeEnvelopeForSelectedSchema(value),
      ).success,
    { error: "historical strategy runtime v1.14 response is invalid" },
  )
