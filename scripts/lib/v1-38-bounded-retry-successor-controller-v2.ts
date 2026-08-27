import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { recoverV138AdmittedObservationWithoutRoute } from "./v1-38-bounded-retry-integrity-successor-v1.js"
import { durablyPublishV138PairV2 } from "./v1-38-durable-pair-successor-v2.js"
import { applyV138RestartableLifecycleTransactionV2 } from "./v1-38-restartable-lifecycle-successor-v2.js"
import {
  completeV138EffectV2,
  recoverV138EffectDecisionV2,
} from "./v1-38-successor-effect-state-machine-v2.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}

export const V138_SUCCESSOR_CONTROLLER_V2_CLI = fileURLToPath(import.meta.url)

export const V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS = Object.freeze([
  "recover_admitted_observation",
  "complete_semantic_effect",
  "recover_semantic_decision",
  "publish_canonical_pair",
  "apply_lifecycle_transaction",
] as const)

/**
 * The one composed successor route. It is deliberately a source-only adapter:
 * callers must select one explicitly bounded operation and the CLI exposes no
 * live, production, retry, reproduction, activation, or lifecycle mode.
 */
export const V138_SUCCESSOR_CONTROLLER_V2 = Object.freeze({
  recoverAdmittedObservation: recoverV138AdmittedObservationWithoutRoute,
  completeSemanticEffect: completeV138EffectV2,
  recoverSemanticDecision: recoverV138EffectDecisionV2,
  publishCanonicalPair: durablyPublishV138PairV2,
  applyLifecycleTransaction: applyV138RestartableLifecycleTransactionV2,
})

export const checkV138SuccessorControllerV2Source = (sourcePath: string): true => {
  const source = readFileSync(sourcePath, "utf8")
  for (const symbol of [
    "recoverV138AdmittedObservationWithoutRoute",
    "completeV138EffectV2",
    "recoverV138EffectDecisionV2",
    "durablyPublishV138PairV2",
    "applyV138RestartableLifecycleTransactionV2",
  ]) {
    if (!source.includes(symbol)) fail("V138_SUCCESSOR_CONTROLLER_ROUTE_INCOMPLETE")
  }
  for (const forbidden of ["--live", "--production", "--retry", "--reproduction", "--activate"]) {
    if (source.includes(`process.argv[2] === \"${forbidden}\"`)) {
      fail("V138_SUCCESSOR_CONTROLLER_LIVE_MODE_FORBIDDEN")
    }
  }
  return true
}

if (process.argv[1] === V138_SUCCESSOR_CONTROLLER_V2_CLI) {
  if (process.argv[2] === "--source-check") {
    checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)
    process.stdout.write("successor_controller_source_only=true\n")
  } else if (process.argv[2] === "--synthetic-check") {
    checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)
    process.stdout.write(
      `${JSON.stringify({
        sourceOnly: true,
        liveSideEffects: false,
        operations: V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS,
      })}\n`,
    )
  } else {
    fail("V138_SUCCESSOR_CONTROLLER_SOURCE_ONLY")
  }
}
