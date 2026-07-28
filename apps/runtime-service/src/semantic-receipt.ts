import { createHash, createHmac } from "node:crypto"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_SEMANTIC_CHRONICLE_WIRE_DOMAIN,
  RUNTIME_SEMANTIC_FINAL_STATE_WIRE_DOMAIN,
  RUNTIME_SEMANTIC_OUTCOME_WIRE_DOMAIN,
  RUNTIME_SEMANTIC_RECEIPT_ALGORITHM,
  RUNTIME_SEMANTIC_RECEIPT_KEY_ID,
  RUNTIME_SEMANTIC_RECEIPT_PROFILE,
  RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION,
  encodeRuntimeSemanticReceiptClaims,
  type Chronicle,
  type RuntimeExecutionServiceRequest,
  type RuntimeSemanticReceipt,
  type RuntimeSemanticReceiptClaims,
} from "@cowards/spec"
import type { GameState } from "@cowards/engine"

const serializeRuntimeSemanticWireValue = (value: unknown): string => {
  const serialized = JSON.stringify(value)
  if (serialized === undefined) {
    throw new Error("Runtime semantic receipt value is not JSON serializable.")
  }
  return serialized
}

const semanticWireBytesHash = (domain: string, value: unknown): string =>
  `sha256:${createHash("sha256")
    .update(`${domain}\0`, "utf8")
    .update(serializeRuntimeSemanticWireValue(value), "utf8")
    .digest("hex")}`

export const hashRuntimeSemanticChronicleWireBytes = (
  chronicle: Chronicle,
): string =>
  semanticWireBytesHash(RUNTIME_SEMANTIC_CHRONICLE_WIRE_DOMAIN, chronicle)

export const hashRuntimeSemanticFinalStateWireBytes = (
  state: GameState,
): string =>
  semanticWireBytesHash(RUNTIME_SEMANTIC_FINAL_STATE_WIRE_DOMAIN, state)

export const hashRuntimeSemanticOutcomeWireBytes = (
  outcome: GameState["outcome"],
): string =>
  semanticWireBytesHash(RUNTIME_SEMANTIC_OUTCOME_WIRE_DOMAIN, outcome ?? null)

export const issueRuntimeSemanticReceipt = (input: {
  request: RuntimeExecutionServiceRequest
  chronicle: Chronicle
  finalState: GameState
  reconstructedTerminalStateHash: string
  runtimeViolationEventCount: number
  secret: string
}): RuntimeSemanticReceipt => {
  if (input.secret.trim().length === 0) {
    throw new Error("Runtime semantic receipt secret is not configured.")
  }
  if ("integrity" in input.chronicle || "storageMetadata" in input.chronicle) {
    throw new Error(
      "Runtime service Chronicle must not contain integrity or storageMetadata.",
    )
  }
  const tuple = input.request.evidenceSnapshot.compatibility.tuple
  const claims: RuntimeSemanticReceiptClaims = {
    schemaVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION,
    profile: RUNTIME_SEMANTIC_RECEIPT_PROFILE,
    serviceContractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
    requestId: input.request.requestId,
    matchId: input.request.match.matchId,
    compatibilityTupleId: input.request.evidenceSnapshot.compatibility.tupleId,
    rulesVersion: tuple.rules,
    engineVersion: tuple.engine,
    runtimeAbiVersion: tuple.runtimeAbi,
    chronicleVersion: tuple.chronicle,
    arenaCatalogVersion: tuple.arenaCatalog,
    setPolicyVersion: tuple.setPolicy,
    authorityBundleHash: input.request.evidenceSnapshot.authorityBundleHash,
    registryGeneration: input.request.evidenceSnapshot.registryGeneration,
    chronicleWireBytesHash: hashRuntimeSemanticChronicleWireBytes(
      input.chronicle,
    ),
    finalStateWireBytesHash: hashRuntimeSemanticFinalStateWireBytes(
      input.finalState,
    ),
    reconstructedTerminalStateHash: input.reconstructedTerminalStateHash,
    outcomeWireBytesHash: hashRuntimeSemanticOutcomeWireBytes(
      input.finalState.outcome,
    ),
    runtimeViolationEventCount: input.runtimeViolationEventCount,
    algorithm: RUNTIME_SEMANTIC_RECEIPT_ALGORITHM,
    keyId: RUNTIME_SEMANTIC_RECEIPT_KEY_ID,
  }
  return {
    ...claims,
    signature: `hmac-sha256:${createHmac("sha256", input.secret)
      .update(encodeRuntimeSemanticReceiptClaims(claims))
      .digest("hex")}`,
  }
}
