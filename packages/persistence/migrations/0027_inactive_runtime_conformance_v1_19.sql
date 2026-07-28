-- Extend the existing append-only conformance-certificate ledger with the
-- exact inactive v1.19 observation-candidate discriminator. This migration
-- creates no registry row, selector, publication, or current authority.

alter table runtime_evidence_certificates
  drop constraint runtime_evidence_certificates_phase259_shape;

alter table runtime_evidence_certificates
  add constraint runtime_evidence_certificates_phase260_shape check (
    exact_certificate_sha256 is null or (
      certificate_kind = 'conformance'
      and certificate_version in (
        'runtime-conformance-certificate-v1.17',
        'runtime-conformance-certificate-v1.19'
      )
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
      and (
        (
          certificate_version = 'runtime-conformance-certificate-v1.17'
          and conformance_runtime_abi_version = 'strategy-runtime-abi-v1.18'
        )
        or (
          certificate_version = 'runtime-conformance-certificate-v1.19'
          and conformance_runtime_abi_version = 'strategy-runtime-abi-v1.19'
          and registry_generation = 'candidate-0'
        )
      )
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
  );
