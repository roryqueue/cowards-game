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

export const RUNTIME_CONFORMANCE_CERTIFICATE_V1_17_COLUMNS = Object.freeze([
  "exact_certificate_bytes",
  "exact_certificate_sha256",
  "conformance_producer_key_id",
  "conformance_trust_domain",
  "conformance_managed_identity",
  "conformance_language_id",
  "conformance_lane_id",
  "conformance_corpus_root_sha256",
  "conformance_case_inventory_sha256",
  "conformance_fixture_source_sha256",
  "conformance_artifact_sha256",
  "conformance_adapter_build_sha256",
  "conformance_runtime_executable_sha256",
  "conformance_toolchain_sha256",
  "conformance_sysroot_stdlib_sha256",
  "conformance_runtime_abi_version",
  "conformance_canonical_json_profile_id",
  "conformance_budget_policy_sha256",
  "conformance_containment_policy_sha256",
  "conformance_semantic_tuple_sha256",
  "conformance_identity_manifest_root",
  "conformance_evidence_graph_root",
  "conformance_behavior_settings_sha256",
  "conformance_run_count",
  "conformance_result_root_sha256",
  "conformance_evidence_root_sha256",
  "conformance_requested_valid_until",
  "conformance_import_producer_id",
  "conformance_import_key_id",
  "conformance_import_trust_domain",
  "conformance_import_payload",
  "conformance_import_signature_base64",
  "conformance_import_envelope_hash",
] as const)
