export const MATCH_STATUSES = [
  "pending",
  "running",
  "complete",
  "failed_system",
  "blocked",
] as const

export const MATCH_SET_STATUSES = [
  "pending",
  "running",
  "complete",
  "failed_system",
  "blocked",
  "degraded",
] as const

export const MATCH_JOB_STATUSES = [
  "queued",
  "running",
  "complete",
  "failed_system",
] as const

export type MatchStatus = (typeof MATCH_STATUSES)[number]
export type MatchSetStatus = (typeof MATCH_SET_STATUSES)[number]
export type MatchJobStatus = (typeof MATCH_JOB_STATUSES)[number]

export const DEFAULT_MAX_JOB_ATTEMPTS = 3

export const RUNTIME_EVIDENCE_V1_17_BINDING_COLUMNS = Object.freeze([
  "graph_schema_version",
  "graph_profile",
  "identity_manifest_root",
  "evidence_graph_root",
  "exact_pin_expansion",
] as const)

export const RUNTIME_SEMANTIC_RECEIPT_V1_17_BINDING_COLUMNS = Object.freeze([
  "runtime_semantic_receipt",
  "runtime_semantic_receipt_hash",
  "runtime_semantic_receipt_version",
] as const)
