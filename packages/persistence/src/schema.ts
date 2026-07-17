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

export const RUNTIME_AUTHORITY_IMPORT_TRUST_ROOT_DEPLOYMENT_COLUMNS =
  Object.freeze([
    "id",
    "descriptor_sha256",
    "descriptor_bytes",
    "producer_id",
    "key_id",
    "trust_domain",
    "public_key_fingerprint",
    "generation",
  ] as const)

export const ARENA_CATALOG_ENTRY_COLUMNS = Object.freeze([
  "catalog_version",
  "arena_id",
  "arena_version",
  "arena_name",
  "arena_status",
  "schedulable",
  "alias_of_arena_id",
  "geometry_hash_profile",
  "semantic_geometry_hash",
  "config",
] as const)

export const SET_CONDITION_IDENTITY_COLUMNS = Object.freeze([
  "scenario_id",
  "condition_id",
  "condition_ordinal",
  "arena_catalog_version",
  "arena_semantic_geometry_hash",
  "bottom_entrant_key",
  "top_entrant_key",
  "initial_initiative_entrant_key",
  "initial_initiative_player_id",
] as const)

export const STRATEGY_REVISION_V1_19_REVALIDATION_COLUMNS = Object.freeze([
  "strategy_revision_id",
  "source_hash",
  "source_bytes",
  "artifact_sha256",
  "artifact_bytes",
  "language_id",
  "provider_id",
  "lane_id",
  "runtime_abi_version",
  "semantic_runtime_version",
  "semantic_tuple_id",
  "execution_request_root",
  "execution_result_root",
  "execution_receipt_root",
  "reviewed_certificate_id",
  "reviewed_certificate_sha256",
] as const)
