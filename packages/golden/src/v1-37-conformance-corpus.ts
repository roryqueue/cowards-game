export const V1_37_CONFORMANCE_LANGUAGES = Object.freeze([] as const)
export const V1_37_CONFORMANCE_CASE_KINDS = Object.freeze([] as const)
export const V1_37_CONFORMANCE_REQUIRED_CAPABILITIES = Object.freeze([] as const)

export const V1_37_CONFORMANCE_CORPUS = Object.freeze({
  schemaVersion: "NOT_IMPLEMENTED",
  version: "NOT_IMPLEMENTED",
  fixtures: Object.freeze([]),
  cases: Object.freeze([]),
  corpusRootSha256: "sha256:NOT_IMPLEMENTED",
})

export const V1_37_CONFORMANCE_CORPUS_ROOT =
  V1_37_CONFORMANCE_CORPUS.corpusRootSha256

export const V1_37_CONFORMANCE_ACTIVE_REGISTRY = Object.freeze({
  schemaVersion: "NOT_IMPLEMENTED",
  activeVersion: "NOT_IMPLEMENTED",
  corpusRootSha256: "sha256:NOT_IMPLEMENTED",
  path: "NOT_IMPLEMENTED",
})

const missing = (): never => {
  throw new Error("[EXPECTED_RED:MISSING_V1_37_CONFORMANCE_CORPUS]")
}

export const computeV137ConformanceCorpusRoot = missing
export const validateV137ConformanceCorpus = missing
export const validateCompleteConformanceCaseInventory = missing
export const createV137ConformanceRunRoot = missing
