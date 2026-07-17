import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
} from "./integrity-authority.js"
import { CURRENT_SEMANTIC_AUTHORITY_SOURCE } from "./current-semantic-authority-source.js"
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "./versions.js"

const PHASE_259_SEMANTIC_AUTHORITY_KEY = "runtime-v1.17" as const
const PHASE_259_SEMANTIC_TUPLE_ID =
  "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe" as const

const phase259Selection = {
  semanticAuthorityKey: PHASE_259_SEMANTIC_AUTHORITY_KEY,
  tupleId: PHASE_259_SEMANTIC_TUPLE_ID,
  tuple: {
    rules: "cowards-rules-v1.4",
    engine: "engine-kernel-v1.37-candidate-1",
    runtimeAbi: "strategy-runtime-abi-v1.17",
    chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
    arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
    setPolicy: "canonical-set-policy-v1.4",
  },
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  arenaCatalogVersion: "semantic-arena-catalog-v1.37-candidate-1",
  setPolicyVersion: "canonical-set-policy-v1.4",
  conformanceCertificateVersion: "runtime-conformance-certificate-v1.17",
} as const

const phase259CurrentMatchesGeneratedProjection =
  String(CURRENT_SEMANTIC_AUTHORITY_SOURCE.semanticAuthorityKey) ===
    PHASE_259_SEMANTIC_AUTHORITY_KEY &&
  String(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_KEY) ===
    PHASE_259_SEMANTIC_AUTHORITY_KEY &&
  String(STRATEGY_RUNTIME_ABI_VERSION) ===
    phase259Selection.runtimeAbiVersion &&
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_ID === PHASE_259_SEMANTIC_TUPLE_ID &&
  JSON.stringify(CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tuple) ===
    JSON.stringify(phase259Selection.tuple)

if (!phase259CurrentMatchesGeneratedProjection) {
  throw new Error(
    "Generated current semantic authority is stale or partially selected.",
  )
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256 =
  "sha256:14296beaf5e79d731dba3de3501dde7239731ce51b0c926bced3d76f5eff29e1" as const
export const CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256 =
  "sha256:bb814addab77fd473103651eb9aac2980ed45770d5147fb54de1f703143b2ce0" as const

export const CURRENT_SEMANTIC_AUTHORITY_GENERATED = deepFreeze({
  schemaVersion: "current-semantic-authority-generated-v1",
  generatedBy: "packages/spec/src/current-semantic-authority-source.ts",
  activationOwner: "Phase-260-Plan-14",
  sourceSha256: CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256,
  outputSha256: CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256,
  selection: phase259Selection,
} as const)

export const CURRENT_SEMANTIC_AUTHORITY_KEY =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.semanticAuthorityKey
export const CURRENT_SEMANTIC_TUPLE_ID =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.tupleId
export const CURRENT_SEMANTIC_TUPLE =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.tuple
export const CURRENT_SEMANTIC_RUNTIME_ABI_VERSION =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.runtimeAbiVersion
export const CURRENT_SEMANTIC_ARENA_CATALOG_VERSION =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.arenaCatalogVersion
export const CURRENT_SEMANTIC_SET_POLICY_VERSION =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.setPolicyVersion
export const CURRENT_SEMANTIC_CONFORMANCE_CERTIFICATE_VERSION =
  CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection.conformanceCertificateVersion

export const resolveCurrentSemanticAuthoritySelection = (
  selector: unknown,
): typeof CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection | undefined => {
  if (!selector || typeof selector !== "object" || Array.isArray(selector)) {
    return undefined
  }
  const record = selector as Record<string, unknown>
  if (
    Object.keys(record).length !== 1 ||
    Object.keys(record)[0] !== "semanticAuthorityKey" ||
    record.semanticAuthorityKey !== CURRENT_SEMANTIC_AUTHORITY_KEY
  ) {
    return undefined
  }
  return CURRENT_SEMANTIC_AUTHORITY_GENERATED.selection
}
