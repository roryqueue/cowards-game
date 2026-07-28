-- Additive candidate-only v1.17 evidence-graph binding. Legacy rows remain null.

alter table runtime_evidence_verified_attestations
  add column graph_schema_version text,
  add column graph_profile text,
  add column identity_manifest_root text,
  add column evidence_graph_root text,
  add column exact_pin_expansion jsonb,
  add constraint runtime_evidence_attestations_v1_17_binding_shape check (
    num_nonnulls(
      graph_schema_version,
      graph_profile,
      identity_manifest_root,
      evidence_graph_root,
      exact_pin_expansion
    ) in (0, 5)
    and (
      graph_schema_version is null
      or (
        graph_schema_version = 'runtime-evidence-graph-v1.17'
        and graph_profile = 'runtime-identity-evidence-dag-v1'
        and identity_manifest_root ~ '^[0-9a-f]{64}$'
        and evidence_graph_root ~ '^[0-9a-f]{64}$'
        and jsonb_typeof(exact_pin_expansion) = 'array'
        and jsonb_array_length(exact_pin_expansion) = 10
      )
    )
  ),
  add constraint runtime_evidence_attestations_v1_17_binding_unique unique (
    id,
    graph_schema_version,
    graph_profile,
    identity_manifest_root,
    evidence_graph_root,
    exact_pin_expansion
  );

alter table runtime_evidence_certificates
  add column graph_schema_version text,
  add column graph_profile text,
  add column identity_manifest_root text,
  add column evidence_graph_root text,
  add column exact_pin_expansion jsonb,
  add constraint runtime_evidence_certificates_v1_17_binding_shape check (
    num_nonnulls(
      graph_schema_version,
      graph_profile,
      identity_manifest_root,
      evidence_graph_root,
      exact_pin_expansion
    ) in (0, 5)
    and (
      graph_schema_version is null
      or (
        graph_schema_version = 'runtime-evidence-graph-v1.17'
        and graph_profile = 'runtime-identity-evidence-dag-v1'
        and identity_manifest_root ~ '^[0-9a-f]{64}$'
        and evidence_graph_root ~ '^[0-9a-f]{64}$'
        and jsonb_typeof(exact_pin_expansion) = 'array'
        and jsonb_array_length(exact_pin_expansion) = 10
      )
    )
  ),
  add constraint runtime_evidence_certificates_v1_17_binding_attestation_fk
    foreign key (
      verified_attestation_id,
      graph_schema_version,
      graph_profile,
      identity_manifest_root,
      evidence_graph_root,
      exact_pin_expansion
    ) references runtime_evidence_verified_attestations (
      id,
      graph_schema_version,
      graph_profile,
      identity_manifest_root,
      evidence_graph_root,
      exact_pin_expansion
    );

create table runtime_evidence_v1_17_candidates (
  attestation_id text primary key,
  attestation_sha256 text not null unique check (attestation_sha256 ~ '^[0-9a-f]{64}$'),
  certificate_kind text not null check (certificate_kind in ('containment', 'conformance')),
  certificate_id text not null unique,
  certificate_version text not null,
  certificate_record_hash text not null unique check (certificate_record_hash ~ '^sha256:[0-9a-f]{64}$'),
  producer_id text not null,
  producer_key_id text not null,
  trust_domain text not null check (trust_domain in ('fixture', 'production')),
  managed_identity boolean not null check (managed_identity),
  graph_schema_version text not null check (graph_schema_version = 'runtime-evidence-graph-v1.17'),
  graph_profile text not null check (graph_profile = 'runtime-identity-evidence-dag-v1'),
  identity_manifest_root text not null check (identity_manifest_root ~ '^[0-9a-f]{64}$'),
  evidence_graph_root text not null check (evidence_graph_root ~ '^[0-9a-f]{64}$'),
  exact_pin_expansion jsonb not null check (
    jsonb_typeof(exact_pin_expansion) = 'array'
    and jsonb_array_length(exact_pin_expansion) = 10
  ),
  registry_generation text not null check (registry_generation ~ '^(0|[1-9][0-9]{0,15})$'),
  issued_at timestamptz not null,
  valid_until timestamptz not null check (valid_until >= issued_at),
  imported_at timestamptz not null default now()
);

create trigger runtime_evidence_v1_17_candidates_append_only
before update or delete on runtime_evidence_v1_17_candidates
for each row execute function reject_integrity_authority_mutation();
