import { createHash, createHmac } from "node:crypto"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION,
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
import { createChronicleContentHash, stableStringify } from "@cowards/replay"
import type { GameState } from "@cowards/engine"

const semanticHash = (domain: string, value: unknown): string =>
  `sha256:${createHash("sha256")
    .update(`${domain}\0`, "utf8")
    .update(stableStringify(value), "utf8")
    .digest("hex")}`

export const hashRuntimeSemanticChronicle = (chronicle: Chronicle): string =>
  semanticHash(
    "cowards-game:runtime-semantic-chronicle:v1",
    `sha256:${createChronicleContentHash(chronicle).normalizedContentHash}`,
  )

export const hashRuntimeSemanticFinalState = (state: GameState): string =>
  semanticHash("cowards-game:runtime-semantic-final-state:v1", state)

export const hashRuntimeSemanticOutcome = (
  outcome: GameState["outcome"],
): string =>
  semanticHash("cowards-game:runtime-semantic-outcome:v1", outcome ?? null)

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
    chronicleHash: hashRuntimeSemanticChronicle(input.chronicle),
    finalStateHash: hashRuntimeSemanticFinalState(input.finalState),
    reconstructedTerminalStateHash: input.reconstructedTerminalStateHash,
    outcomeHash: hashRuntimeSemanticOutcome(input.finalState.outcome),
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
