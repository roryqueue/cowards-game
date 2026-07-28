import { createHmac } from "node:crypto"
import {
  RUNTIME_SEMANTIC_RECEIPT_ALGORITHM,
  RUNTIME_SEMANTIC_RECEIPT_KEY_ID,
  RUNTIME_SEMANTIC_RECEIPT_PROFILE,
  encodeRuntimeSemanticReceiptClaims,
  type Chronicle,
  type RuntimeExecutionServiceRequest,
  type RuntimeSemanticReceipt,
  type RuntimeSemanticReceiptClaims,
} from "@cowards/spec"
import type { GameState } from "@cowards/engine"
import {
  hashRuntimeSemanticChronicleWireBytes,
  hashRuntimeSemanticFinalStateWireBytes,
  hashRuntimeSemanticOutcomeWireBytes,
} from "./semantic-receipt.js"

/**
 * Immutable base-service receipt used by the runtime-v1.17 route. The
 * selected-current receipt constants may advance, so this issuer is deliberately
 * separate from the protected v1.16/current implementation.
 */
export const issueVersionedRuntimeSemanticReceiptV117 = (input: {
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
  const claims = {
    schemaVersion: "runtime-semantic-receipt-v1",
    profile: RUNTIME_SEMANTIC_RECEIPT_PROFILE,
    serviceContractVersion: "runtime-execution-service-v1.16",
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
  } as unknown as RuntimeSemanticReceiptClaims
  return {
    ...claims,
    signature: `hmac-sha256:${createHmac("sha256", input.secret)
      .update(encodeRuntimeSemanticReceiptClaims(claims))
      .digest("hex")}`,
  } as RuntimeSemanticReceipt
}
