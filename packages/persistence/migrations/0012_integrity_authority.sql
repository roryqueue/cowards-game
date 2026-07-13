-- v1.37 exact integrity identity and append-only authority foundation.
-- Existing rows intentionally remain unresolved: every added identity column is
-- nullable and this migration performs no backfill or source-row rewrite.

create or replace function reject_integrity_authority_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'integrity authority records are append-only';
end;
$$;

create table canonical_release_manifests (
  id text primary key,
  manifest_version text not null,
  manifest_hash text not null unique,
  compatibility_tuple_id text not null,
  compatibility_rules_version text not null,
  compatibility_engine_version text not null,
  compatibility_runtime_abi_version text not null,
  compatibility_chronicle_version text not null,
  compatibility_arena_catalog_version text not null,
  compatibility_set_policy_version text not null,
  original_manifest jsonb not null,
  created_at timestamptz not null default now(),
  check (compatibility_tuple_id ~ '^sha256:[0-9a-f]{64}$'),
  check (manifest_hash ~ '^[0-9a-f]{64}$')
);

create trigger canonical_release_manifests_append_only
before update or delete on canonical_release_manifests
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_verified_attestations (
  id text primary key,
  attestation_sha256 text not null unique,
  verification_status text not null check (verification_status = 'passed'),
  certificate_kind text not null check (certificate_kind in ('containment', 'conformance')),
  producer_id text not null,
  producer_key_id text not null,
  trust_domain text not null,
  schema_version text not null,
  command_id text not null,
  command_digest text not null,
  corpus_id text not null,
  corpus_hash text not null,
  policy_id text not null,
  policy_hash text not null,
  runtime_id text not null,
  runtime_version text not null,
  toolchain_id text not null,
  toolchain_version text not null,
  adapter_id text not null,
  adapter_version text not null,
  artifact_id text not null,
  artifact_hash text not null,
  lane_identity_hash text not null,
  semantic_tuple_id text not null,
  result_manifest_hash text not null,
  result_graph_hash text not null,
  original_evidence_hash text not null,
  derived_certificate_version text not null,
  derived_certificate_record_hash text not null,
  registry_generation text not null,
  lane_identity jsonb not null,
  issued_at timestamptz not null,
  valid_until timestamptz not null,
  imported_at timestamptz not null default now(),
  check (attestation_sha256 ~ '^[0-9a-f]{64}$'),
  check (semantic_tuple_id ~ '^sha256:[0-9a-f]{64}$'),
  check (valid_until >= issued_at),
  unique (
    id,
    verification_status,
    certificate_kind,
    producer_id,
    schema_version,
    command_id,
    command_digest,
    corpus_id,
    corpus_hash,
    policy_id,
    policy_hash,
    toolchain_id,
    toolchain_version,
    artifact_id,
    artifact_hash,
    lane_identity_hash,
    result_graph_hash,
    derived_certificate_version,
    derived_certificate_record_hash,
    registry_generation
  )
);

create trigger runtime_evidence_verified_attestations_append_only
before update or delete on runtime_evidence_verified_attestations
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_certificates (
  id text primary key,
  certificate_kind text not null check (certificate_kind in ('containment', 'conformance')),
  certificate_version text not null,
  certificate_record_hash text not null unique,
  certificate_status text not null check (certificate_status = 'passed'),
  verified_attestation_id text not null,
  verified_attestation_status text not null check (verified_attestation_status = 'passed'),
  producer_id text not null,
  schema_version text not null,
  command_id text not null,
  command_digest text not null,
  corpus_id text not null,
  corpus_hash text not null,
  policy_id text not null,
  policy_hash text not null,
  toolchain_id text not null,
  toolchain_version text not null,
  artifact_id text not null,
  artifact_hash text not null,
  lane_identity_hash text not null,
  lane_identity jsonb not null,
  result_graph_hash text not null,
  registry_generation text not null,
  issued_at timestamptz not null,
  fresh_until timestamptz not null,
  created_at timestamptz not null default now(),
  check (certificate_record_hash ~ '^[0-9a-f]{64}$'),
  check (fresh_until >= issued_at),
  foreign key (
    verified_attestation_id,
    verified_attestation_status,
    certificate_kind,
    producer_id,
    schema_version,
    command_id,
    command_digest,
    corpus_id,
    corpus_hash,
    policy_id,
    policy_hash,
    toolchain_id,
    toolchain_version,
    artifact_id,
    artifact_hash,
    lane_identity_hash,
    result_graph_hash,
    certificate_version,
    certificate_record_hash,
    registry_generation
  ) references runtime_evidence_verified_attestations (
    id,
    verification_status,
    certificate_kind,
    producer_id,
    schema_version,
    command_id,
    command_digest,
    corpus_id,
    corpus_hash,
    policy_id,
    policy_hash,
    toolchain_id,
    toolchain_version,
    artifact_id,
    artifact_hash,
    lane_identity_hash,
    result_graph_hash,
    derived_certificate_version,
    derived_certificate_record_hash,
    registry_generation
  ),
  unique (
    id,
    certificate_kind,
    certificate_version,
    certificate_record_hash,
    registry_generation,
    lane_identity_hash
  )
);

create index runtime_evidence_certificates_attestation_idx
  on runtime_evidence_certificates(verified_attestation_id);
create index runtime_evidence_certificates_identity_idx
  on runtime_evidence_certificates(lane_identity_hash, certificate_kind);

create trigger runtime_evidence_certificates_append_only
before update or delete on runtime_evidence_certificates
for each row execute function reject_integrity_authority_mutation();

create table runtime_lane_control_events (
  id text primary key,
  lane_identity_hash text not null,
  action text not null check (action in ('disable', 'enable')),
  reason_code text not null,
  evidence_reference_hash text not null,
  compensates_event_id text references runtime_lane_control_events(id),
  created_at timestamptz not null default now(),
  check (
    (action = 'disable' and compensates_event_id is null) or
    (action = 'enable' and compensates_event_id is not null)
  )
);

create trigger runtime_lane_control_events_append_only
before update or delete on runtime_lane_control_events
for each row execute function reject_integrity_authority_mutation();

create table integrity_cohort_classification_events (
  id text primary key,
  predicate_version text not null,
  predicate jsonb not null,
  preview_hash text not null,
  preview_count integer not null check (preview_count >= 0),
  evidence_hash text not null,
  classification text not null check (classification in (
    'counted', 'non_counted', 'under_review', 'invalid', 'invalidated'
  )),
  reason text not null,
  actor_user_id text references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create trigger integrity_cohort_classification_events_append_only
before update or delete on integrity_cohort_classification_events
for each row execute function reject_integrity_authority_mutation();

create table integrity_compensation_events (
  id text primary key,
  classification_event_id text not null references integrity_cohort_classification_events(id),
  compensates_event_id text not null references integrity_cohort_classification_events(id),
  evidence_hash text not null,
  reason text not null,
  actor_user_id text references users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (classification_event_id <> compensates_event_id),
  unique (compensates_event_id)
);

create trigger integrity_compensation_events_append_only
before update or delete on integrity_compensation_events
for each row execute function reject_integrity_authority_mutation();

alter table match_sets
  add column compatibility_tuple_id text,
  add column compatibility_rules_version text,
  add column compatibility_engine_version text,
  add column compatibility_runtime_abi_version text,
  add column compatibility_chronicle_version text,
  add column compatibility_arena_catalog_version text,
  add column compatibility_set_policy_version text,
  add column authority_bundle_hash text,
  add column authority_registry_generation text,
  add column execution_evidence_set jsonb,
  add column execution_evidence_set_hash text,
  add constraint match_sets_integrity_identity_all_or_none check (
    num_nonnulls(
      compatibility_tuple_id,
      compatibility_rules_version,
      compatibility_engine_version,
      compatibility_runtime_abi_version,
      compatibility_chronicle_version,
      compatibility_arena_catalog_version,
      compatibility_set_policy_version,
      authority_bundle_hash,
      authority_registry_generation,
      execution_evidence_set,
      execution_evidence_set_hash
    ) in (0, 11)
  ) not valid,
  add constraint match_sets_compatibility_tuple_id_format check (
    compatibility_tuple_id is null or
    compatibility_tuple_id ~ '^sha256:[0-9a-f]{64}$'
  ) not valid,
  add constraint match_sets_execution_evidence_set_hash_format check (
    execution_evidence_set_hash is null or
    execution_evidence_set_hash ~ '^[0-9a-f]{64}$'
  ) not valid;

create table match_set_execution_entrants (
  match_set_id text not null references match_sets(id) on delete cascade,
  entrant_key text not null,
  strategy_revision_id text not null references strategy_revisions(id),
  lane_identity jsonb not null,
  lane_identity_hash text not null,
  containment_certificate_kind text not null check (containment_certificate_kind = 'containment'),
  containment_certificate_id text not null,
  containment_certificate_version text not null,
  containment_certificate_hash text not null,
  conformance_certificate_kind text not null check (conformance_certificate_kind = 'conformance'),
  conformance_certificate_id text not null,
  conformance_certificate_version text not null,
  conformance_certificate_hash text not null,
  scheduling_status text not null check (scheduling_status in ('disabled', 'exhibition_only', 'counted')),
  scheduling_reason_code text not null,
  scheduling_evaluated_at timestamptz not null,
  scheduling_fresh_until timestamptz not null,
  authority_bundle_hash text not null,
  authority_registry_generation text not null,
  execution_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  primary key (match_set_id, entrant_key),
  unique (match_set_id, strategy_revision_id),
  check (entrant_key <> ''),
  check (containment_certificate_id <> conformance_certificate_id),
  check (scheduling_fresh_until >= scheduling_evaluated_at),
  foreign key (
    containment_certificate_id,
    containment_certificate_kind,
    containment_certificate_version,
    containment_certificate_hash,
    authority_registry_generation,
    lane_identity_hash
  ) references runtime_evidence_certificates (
    id,
    certificate_kind,
    certificate_version,
    certificate_record_hash,
    registry_generation,
    lane_identity_hash
  ),
  foreign key (
    conformance_certificate_id,
    conformance_certificate_kind,
    conformance_certificate_version,
    conformance_certificate_hash,
    authority_registry_generation,
    lane_identity_hash
  ) references runtime_evidence_certificates (
    id,
    certificate_kind,
    certificate_version,
    certificate_record_hash,
    registry_generation,
    lane_identity_hash
  )
);

create index match_set_execution_entrants_revision_idx
  on match_set_execution_entrants(strategy_revision_id);
create index match_set_execution_entrants_lane_idx
  on match_set_execution_entrants(lane_identity_hash);

create trigger match_set_execution_entrants_append_only
before update or delete on match_set_execution_entrants
for each row execute function reject_integrity_authority_mutation();

alter table competition_entrants
  add column execution_entrant_key text,
  add constraint competition_entrants_execution_entrant_fk
  foreign key (match_set_id, execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid;

alter table matches
  add column integrity_match_set_id text references match_sets(id),
  add column bottom_execution_entrant_key text,
  add column top_execution_entrant_key text,
  add column bottom_execution_evidence jsonb,
  add column top_execution_evidence jsonb,
  add column execution_evidence_pair_hash text,
  add constraint matches_execution_evidence_pair_all_or_none check (
    num_nonnulls(
      integrity_match_set_id,
      bottom_execution_entrant_key,
      top_execution_entrant_key,
      bottom_execution_evidence,
      top_execution_evidence,
      execution_evidence_pair_hash
    ) in (0, 6)
  ) not valid,
  add constraint matches_execution_evidence_pair_distinct check (
    bottom_execution_entrant_key is null or
    bottom_execution_entrant_key <> top_execution_entrant_key
  ) not valid,
  add constraint matches_bottom_execution_entrant_fk
  foreign key (integrity_match_set_id, bottom_execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid,
  add constraint matches_top_execution_entrant_fk
  foreign key (integrity_match_set_id, top_execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid;

alter table match_jobs
  add column integrity_match_set_id text references match_sets(id),
  add column bottom_execution_entrant_key text,
  add column top_execution_entrant_key text,
  add column bottom_execution_evidence jsonb,
  add column top_execution_evidence jsonb,
  add column execution_evidence_pair_hash text,
  add constraint match_jobs_execution_evidence_pair_all_or_none check (
    num_nonnulls(
      integrity_match_set_id,
      bottom_execution_entrant_key,
      top_execution_entrant_key,
      bottom_execution_evidence,
      top_execution_evidence,
      execution_evidence_pair_hash
    ) in (0, 6)
  ) not valid,
  add constraint match_jobs_execution_evidence_pair_distinct check (
    bottom_execution_entrant_key is null or
    bottom_execution_entrant_key <> top_execution_entrant_key
  ) not valid,
  add constraint match_jobs_bottom_execution_entrant_fk
  foreign key (integrity_match_set_id, bottom_execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid,
  add constraint match_jobs_top_execution_entrant_fk
  foreign key (integrity_match_set_id, top_execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid;

alter table chronicles
  add column integrity_match_set_id text references match_sets(id),
  add column bottom_execution_entrant_key text,
  add column top_execution_entrant_key text,
  add column bottom_execution_evidence jsonb,
  add column top_execution_evidence jsonb,
  add column execution_evidence_pair_hash text,
  add constraint chronicles_execution_evidence_pair_all_or_none check (
    num_nonnulls(
      integrity_match_set_id,
      bottom_execution_entrant_key,
      top_execution_entrant_key,
      bottom_execution_evidence,
      top_execution_evidence,
      execution_evidence_pair_hash
    ) in (0, 6)
  ) not valid,
  add constraint chronicles_execution_evidence_pair_distinct check (
    bottom_execution_entrant_key is null or
    bottom_execution_entrant_key <> top_execution_entrant_key
  ) not valid,
  add constraint chronicles_bottom_execution_entrant_fk
  foreign key (integrity_match_set_id, bottom_execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid,
  add constraint chronicles_top_execution_entrant_fk
  foreign key (integrity_match_set_id, top_execution_entrant_key)
  references match_set_execution_entrants(match_set_id, entrant_key)
  not valid;

create or replace function prevent_integrity_identity_rewrite()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'match_sets' and (
    old.compatibility_tuple_id is distinct from new.compatibility_tuple_id or
    old.compatibility_rules_version is distinct from new.compatibility_rules_version or
    old.compatibility_engine_version is distinct from new.compatibility_engine_version or
    old.compatibility_runtime_abi_version is distinct from new.compatibility_runtime_abi_version or
    old.compatibility_chronicle_version is distinct from new.compatibility_chronicle_version or
    old.compatibility_arena_catalog_version is distinct from new.compatibility_arena_catalog_version or
    old.compatibility_set_policy_version is distinct from new.compatibility_set_policy_version or
    old.authority_bundle_hash is distinct from new.authority_bundle_hash or
    old.authority_registry_generation is distinct from new.authority_registry_generation or
    old.execution_evidence_set is distinct from new.execution_evidence_set or
    old.execution_evidence_set_hash is distinct from new.execution_evidence_set_hash
  ) and old.compatibility_tuple_id is not null then
    raise exception 'persisted MatchSet integrity identity is immutable';
  end if;

  if tg_table_name in ('matches', 'match_jobs', 'chronicles') and (
    old.integrity_match_set_id is distinct from new.integrity_match_set_id or
    old.bottom_execution_entrant_key is distinct from new.bottom_execution_entrant_key or
    old.top_execution_entrant_key is distinct from new.top_execution_entrant_key or
    old.bottom_execution_evidence is distinct from new.bottom_execution_evidence or
    old.top_execution_evidence is distinct from new.top_execution_evidence or
    old.execution_evidence_pair_hash is distinct from new.execution_evidence_pair_hash
  ) and old.integrity_match_set_id is not null then
    raise exception 'persisted ordered execution evidence is immutable';
  end if;

  if tg_table_name = 'competition_entrants' and
     old.execution_entrant_key is distinct from new.execution_entrant_key and
     old.execution_entrant_key is not null then
    raise exception 'persisted competition entrant evidence link is immutable';
  end if;
  return new;
end;
$$;

create trigger match_sets_integrity_identity_immutable
before update on match_sets
for each row execute function prevent_integrity_identity_rewrite();

create trigger matches_execution_evidence_immutable
before update on matches
for each row execute function prevent_integrity_identity_rewrite();

create trigger match_jobs_execution_evidence_immutable
before update on match_jobs
for each row execute function prevent_integrity_identity_rewrite();

create trigger chronicles_execution_evidence_immutable
before update on chronicles
for each row execute function prevent_integrity_identity_rewrite();

create trigger competition_entrants_execution_evidence_immutable
before update on competition_entrants
for each row execute function prevent_integrity_identity_rewrite();
