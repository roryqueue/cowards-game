import { CURRENT_SEMANTIC_AUTHORITY_SOURCE } from "./current-semantic-authority-source.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const semanticAuthoritySelections = deepFreeze({
  "runtime-v1.17": {
    semanticAuthorityKey: "runtime-v1.17",
    tupleId:
      "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
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
  },
  "runtime-v1.19": {
    semanticAuthorityKey: "runtime-v1.19",
    tupleId:
      "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
    tuple: {
      rules: "cowards-rules-v1.4",
      engine: "engine-kernel-v1.37-candidate-1",
      runtimeAbi: "strategy-runtime-abi-v1.19",
      chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
      arenaCatalog: "canonical-arena-catalog-v1.37",
      setPolicy: "canonical-set-policy-v1.37-four-condition-v1",
    },
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    arenaCatalogVersion: "canonical-arena-catalog-v1.37",
    setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
    conformanceCertificateVersion: "runtime-conformance-certificate-v1.19",
  },
} as const)

export type SemanticAuthorityKey = keyof typeof semanticAuthoritySelections
export type SemanticAuthoritySelection =
  (typeof semanticAuthoritySelections)[SemanticAuthorityKey]

const exactSemanticAuthorityKey = (
  selector: unknown,
): SemanticAuthorityKey | undefined => {
  if (!selector || typeof selector !== "object" || Array.isArray(selector)) {
    return undefined
  }
  const record = selector as Record<string, unknown>
  const keys = Object.keys(record)
  if (
    keys.length !== 1 ||
    keys[0] !== "semanticAuthorityKey" ||
    (record.semanticAuthorityKey !== "runtime-v1.17" &&
      record.semanticAuthorityKey !== "runtime-v1.19")
  ) {
    return undefined
  }
  return record.semanticAuthorityKey
}

export function resolveSemanticAuthoritySelection<
  Key extends SemanticAuthorityKey,
>(
  selector: Readonly<{ semanticAuthorityKey: Key }>,
): (typeof semanticAuthoritySelections)[Key]
// eslint-disable-next-line no-redeclare -- TypeScript overload signature for unknown callers.
export function resolveSemanticAuthoritySelection(
  selector: unknown,
): SemanticAuthoritySelection | undefined
// eslint-disable-next-line no-redeclare -- TypeScript overload implementation.
export function resolveSemanticAuthoritySelection(
  selector: unknown,
): SemanticAuthoritySelection | undefined {
  const key = exactSemanticAuthorityKey(selector)
  return key === undefined ? undefined : semanticAuthoritySelections[key]
}

const selection = resolveSemanticAuthoritySelection(
  CURRENT_SEMANTIC_AUTHORITY_SOURCE,
)
if (selection === undefined) {
  throw new Error("Current semantic authority source is unknown or malformed.")
}

const selectionDigests = {
  "runtime-v1.17": {
    sourceSha256:
      "sha256:14296beaf5e79d731dba3de3501dde7239731ce51b0c926bced3d76f5eff29e1",
    outputSha256:
      "sha256:bb814addab77fd473103651eb9aac2980ed45770d5147fb54de1f703143b2ce0",
  },
  "runtime-v1.19": {
    sourceSha256:
      "sha256:110d30db98623cb90f07b473045cf04aca3433fb823964163191a0a8cba64b61",
    outputSha256:
      "sha256:15030ee59b81a2bf04667e045344de36d1b11b9834e64f71be05ccf7b73d80d5",
  },
} as const

const digests = selectionDigests[selection.semanticAuthorityKey]

export const CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256 = digests.sourceSha256
export const CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256 = digests.outputSha256

export const CURRENT_SEMANTIC_AUTHORITY_GENERATED = deepFreeze({
  schemaVersion: "current-semantic-authority-generated-v1",
  generatedBy: "packages/spec/src/current-semantic-authority-source.ts",
  activationOwner: "Phase-260-Plan-14",
  sourceSha256: CURRENT_SEMANTIC_AUTHORITY_SOURCE_SHA256,
  outputSha256: CURRENT_SEMANTIC_AUTHORITY_OUTPUT_SHA256,
  selection,
} as const)

export const CURRENT_SEMANTIC_AUTHORITY_KEY = selection.semanticAuthorityKey
export const CURRENT_SEMANTIC_TUPLE_ID = selection.tupleId
export const CURRENT_SEMANTIC_TUPLE = selection.tuple
export const CURRENT_SEMANTIC_RUNTIME_ABI_VERSION = selection.runtimeAbiVersion
export const CURRENT_SEMANTIC_ARENA_CATALOG_VERSION =
  selection.arenaCatalogVersion
export const CURRENT_SEMANTIC_SET_POLICY_VERSION = selection.setPolicyVersion
export const CURRENT_SEMANTIC_CONFORMANCE_CERTIFICATE_VERSION =
  selection.conformanceCertificateVersion

export const resolveCurrentSemanticAuthoritySelection = (
  selector: unknown,
): SemanticAuthoritySelection | undefined => {
  const resolved = resolveSemanticAuthoritySelection(selector)
  return resolved?.semanticAuthorityKey === CURRENT_SEMANTIC_AUTHORITY_KEY
    ? resolved
    : undefined
}
