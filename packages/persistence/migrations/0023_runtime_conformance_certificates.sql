-- Additive Phase-259 provenance for exact reviewed runtime conformance
-- certificates. This extends the existing integrity-authority certificate
-- ledger; it does not create a second certificate registry or rewrite history.

alter table runtime_evidence_certificates
  add column exact_certificate_bytes bytea,
  add column exact_certificate_sha256 text,
  add column conformance_producer_key_id text,
  add column conformance_trust_domain text,
  add column conformance_managed_identity boolean,
  add column conformance_language_id text,
  add column conformance_lane_id text,
  add column conformance_corpus_root_sha256 text,
  add column conformance_case_inventory_sha256 text,
  add column conformance_fixture_source_sha256 text,
  add column conformance_artifact_sha256 text,
  add column conformance_adapter_build_sha256 text,
  add column conformance_runtime_executable_sha256 text,
  add column conformance_toolchain_sha256 text,
  add column conformance_sysroot_stdlib_sha256 text,
  add column conformance_runtime_abi_version text,
  add column conformance_canonical_json_profile_id text,
  add column conformance_budget_policy_sha256 text,
  add column conformance_containment_policy_sha256 text,
  add column conformance_semantic_tuple_sha256 text,
  add column conformance_identity_manifest_root text,
  add column conformance_evidence_graph_root text,
  add column conformance_behavior_settings_sha256 text,
  add column conformance_run_count integer,
  add column conformance_result_root_sha256 text,
  add column conformance_evidence_root_sha256 text,
  add column conformance_requested_valid_until timestamptz,
  add column conformance_import_producer_id text,
  add column conformance_import_key_id text,
  add column conformance_import_trust_domain text,
  add column conformance_import_payload jsonb,
  add column conformance_import_signature_base64 text,
  add column conformance_import_envelope_hash text,
  add constraint runtime_evidence_certificates_phase259_all_or_none check (
    num_nonnulls(
      exact_certificate_bytes,
      exact_certificate_sha256,
      conformance_producer_key_id,
      conformance_trust_domain,
      conformance_managed_identity,
      conformance_language_id,
      conformance_lane_id,
      conformance_corpus_root_sha256,
      conformance_case_inventory_sha256,
      conformance_fixture_source_sha256,
      conformance_artifact_sha256,
      conformance_adapter_build_sha256,
      conformance_runtime_executable_sha256,
      conformance_toolchain_sha256,
      conformance_sysroot_stdlib_sha256,
      conformance_runtime_abi_version,
      conformance_canonical_json_profile_id,
      conformance_budget_policy_sha256,
      conformance_containment_policy_sha256,
      conformance_semantic_tuple_sha256,
      conformance_identity_manifest_root,
      conformance_evidence_graph_root,
      conformance_behavior_settings_sha256,
      conformance_run_count,
      conformance_result_root_sha256,
      conformance_evidence_root_sha256,
      conformance_requested_valid_until,
      conformance_import_producer_id,
      conformance_import_key_id,
      conformance_import_trust_domain,
      conformance_import_payload,
      conformance_import_signature_base64,
      conformance_import_envelope_hash
    ) in (0, 33)
  ),
  add constraint runtime_evidence_certificates_phase259_shape check (
    exact_certificate_sha256 is null or (
      certificate_kind = 'conformance'
      and certificate_version = 'runtime-conformance-certificate-v1.17'
      and certificate_status = 'passed'
      and exact_certificate_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and exact_certificate_sha256 = 'sha256:' || certificate_record_hash
      and octet_length(exact_certificate_bytes) between 1 and 1048576
      and conformance_managed_identity
      and conformance_trust_domain in ('production', 'fixture')
      and conformance_language_id in ('typescript', 'python', 'rust', 'zig')
      and conformance_run_count = 3
      and conformance_requested_valid_until >= issued_at
      and fresh_until <= conformance_requested_valid_until
      and conformance_runtime_abi_version = 'strategy-runtime-abi-v1.18'
      and conformance_canonical_json_profile_id = 'canonical-json-v1.1'
      and conformance_corpus_root_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_case_inventory_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_fixture_source_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_artifact_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_adapter_build_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_runtime_executable_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_toolchain_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_sysroot_stdlib_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_budget_policy_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_containment_policy_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_semantic_tuple_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_identity_manifest_root ~ '^sha256:[0-9a-f]{64}$'
      and conformance_evidence_graph_root ~ '^sha256:[0-9a-f]{64}$'
      and conformance_behavior_settings_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_result_root_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_evidence_root_sha256 ~ '^sha256:[0-9a-f]{64}$'
      and conformance_import_envelope_hash ~ '^[0-9a-f]{64}$'
      and conformance_import_payload->>'domain' = 'conformance-certificate'
      and conformance_import_payload->>'targetCertificateId' = id
      and conformance_import_payload->>'targetCertificateRecordHash' =
        exact_certificate_sha256
      and lane_identity->>'languageId' = conformance_language_id
      and lane_identity->>'laneId' = conformance_lane_id
      and lane_identity->>'identityManifestRoot' =
        conformance_identity_manifest_root
      and lane_identity->>'evidenceGraphRoot' =
        conformance_evidence_graph_root
    )
  ),
  add constraint runtime_evidence_certificates_phase259_id_hash_unique
    unique (id, certificate_record_hash),
  add constraint runtime_evidence_certificates_phase259_sha_unique
    unique (exact_certificate_sha256);

create table runtime_evidence_conformance_certificate_runs (
  certificate_id text not null,
  certificate_record_hash text not null,
  run_ordinal integer not null check (run_ordinal between 0 and 2),
  run_id text not null,
  workspace_id text not null,
  process_id text not null,
  status text not null check (status = 'passed'),
  complete boolean not null check (complete),
  fresh_workspace boolean not null check (fresh_workspace),
  fresh_process boolean not null check (fresh_process),
  skipped_case_count integer not null check (skipped_case_count = 0),
  unsupported_case_count integer not null check (unsupported_case_count = 0),
  fallback_used boolean not null check (not fallback_used),
  synthetic_evidence boolean not null check (not synthetic_evidence),
  case_count integer not null check (case_count > 0),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  valid_until timestamptz not null,
  identity jsonb not null,
  result_root_sha256 text not null check (
    result_root_sha256 ~ '^sha256:[0-9a-f]{64}$'
  ),
  evidence_root_sha256 text not null check (
    evidence_root_sha256 ~ '^sha256:[0-9a-f]{64}$'
  ),
  created_at timestamptz not null default now(),
  primary key (certificate_id, run_ordinal),
  unique (run_id),
  unique (workspace_id),
  unique (process_id),
  check (started_at <= completed_at and completed_at <= valid_until),
  foreign key (
    certificate_id,
    certificate_record_hash
  ) references runtime_evidence_certificates (
    id,
    certificate_record_hash
  )
);

create trigger runtime_evidence_conformance_certificate_runs_append_only
before update or delete on runtime_evidence_conformance_certificate_runs
for each row execute function reject_integrity_authority_mutation();
