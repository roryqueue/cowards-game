-- v1.37 authenticated runtime-evidence authority publication control plane.
-- Every externally meaningful record is append-only. The singleton head is the
-- only mutable row and exists solely to serialize generation allocation.

alter table runtime_evidence_certificates
  add constraint runtime_evidence_certificates_exact_identity_unique
  unique (id, certificate_record_hash);

alter table runtime_evidence_verified_attestations
  add constraint runtime_evidence_attestations_graph_identity_unique
  unique (id, result_graph_hash);

create table runtime_evidence_lane_controls (
  id text primary key,
  sequence bigint generated always as identity unique,
  action text not null check (action in ('disable', 'enable')),
  lane_identity_hash text not null check (lane_identity_hash ~ '^sha256:[0-9a-f]{64}$'),
  reason_code text not null,
  evidence_reference_hash text not null check (evidence_reference_hash ~ '^sha256:[0-9a-f]{64}$'),
  compensates_control_id text references runtime_evidence_lane_controls(id),
  producer_id text not null,
  producer_key_id text not null,
  trust_domain text not null,
  schema_version text not null,
  signed_payload text not null,
  signature_base64 text not null,
  envelope_hash text not null unique check (envelope_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz not null,
  valid_until timestamptz not null,
  imported_at timestamptz not null default now(),
  verification_status text not null default 'passed' check (verification_status = 'passed'),
  check (valid_until >= issued_at),
  check (
    (action = 'disable' and compensates_control_id is null) or
    (action = 'enable' and compensates_control_id is not null)
  ),
  unique (compensates_control_id)
);

create or replace function validate_runtime_evidence_lane_control()
returns trigger language plpgsql as $$
declare
  disabled runtime_evidence_lane_controls%rowtype;
begin
  if new.action = 'enable' then
    select * into disabled
      from runtime_evidence_lane_controls
     where id = new.compensates_control_id;
    if not found or disabled.action <> 'disable' or
       disabled.lane_identity_hash <> new.lane_identity_hash then
      raise exception 'lane enable must compensate an exact disable';
    end if;
  end if;
  return new;
end;
$$;

create trigger runtime_evidence_lane_controls_validate
before insert on runtime_evidence_lane_controls
for each row execute function validate_runtime_evidence_lane_control();

create trigger runtime_evidence_lane_controls_append_only
before update or delete on runtime_evidence_lane_controls
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_certificate_revocations (
  id text primary key,
  target_certificate_id text not null,
  target_certificate_record_hash text not null check (target_certificate_record_hash ~ '^[0-9a-f]{64}$'),
  verified_attestation_id text not null,
  evidence_graph_hash text not null check (evidence_graph_hash ~ '^[0-9a-f]{64}$'),
  reason_code text not null,
  evidence_reference_hash text not null check (evidence_reference_hash ~ '^sha256:[0-9a-f]{64}$'),
  producer_id text not null,
  producer_key_id text not null,
  trust_domain text not null,
  schema_version text not null,
  signed_payload text not null,
  signature_base64 text not null,
  envelope_hash text not null unique check (envelope_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz not null,
  valid_until timestamptz not null,
  imported_at timestamptz not null default now(),
  verification_status text not null default 'passed' check (verification_status = 'passed'),
  check (valid_until >= issued_at),
  foreign key (target_certificate_id, target_certificate_record_hash)
    references runtime_evidence_certificates(id, certificate_record_hash),
  foreign key (verified_attestation_id, evidence_graph_hash)
    references runtime_evidence_verified_attestations(id, result_graph_hash),
  unique (target_certificate_id)
);

create trigger runtime_evidence_certificate_revocations_append_only
before update or delete on runtime_evidence_certificate_revocations
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_certificate_supersessions (
  id text primary key,
  target_certificate_id text not null,
  target_certificate_record_hash text not null check (target_certificate_record_hash ~ '^[0-9a-f]{64}$'),
  target_verified_attestation_id text not null,
  target_evidence_graph_hash text not null check (target_evidence_graph_hash ~ '^[0-9a-f]{64}$'),
  replacement_certificate_id text not null,
  replacement_certificate_record_hash text not null check (replacement_certificate_record_hash ~ '^[0-9a-f]{64}$'),
  replacement_verified_attestation_id text not null,
  replacement_evidence_graph_hash text not null check (replacement_evidence_graph_hash ~ '^[0-9a-f]{64}$'),
  reason_code text not null,
  evidence_reference_hash text not null check (evidence_reference_hash ~ '^sha256:[0-9a-f]{64}$'),
  producer_id text not null,
  producer_key_id text not null,
  trust_domain text not null,
  schema_version text not null,
  signed_payload text not null,
  signature_base64 text not null,
  envelope_hash text not null unique check (envelope_hash ~ '^[0-9a-f]{64}$'),
  issued_at timestamptz not null,
  valid_until timestamptz not null,
  imported_at timestamptz not null default now(),
  verification_status text not null default 'passed' check (verification_status = 'passed'),
  check (target_certificate_id <> replacement_certificate_id),
  check (valid_until >= issued_at),
  foreign key (target_certificate_id, target_certificate_record_hash)
    references runtime_evidence_certificates(id, certificate_record_hash),
  foreign key (replacement_certificate_id, replacement_certificate_record_hash)
    references runtime_evidence_certificates(id, certificate_record_hash),
  foreign key (target_verified_attestation_id, target_evidence_graph_hash)
    references runtime_evidence_verified_attestations(id, result_graph_hash),
  foreign key (replacement_verified_attestation_id, replacement_evidence_graph_hash)
    references runtime_evidence_verified_attestations(id, result_graph_hash),
  unique (target_certificate_id)
);

create or replace function reject_runtime_evidence_supersession_cycle()
returns trigger language plpgsql as $$
declare
  cycle_found boolean;
begin
  if new.target_certificate_id = new.replacement_certificate_id then
    raise exception 'certificate supersession cannot target itself';
  end if;
  with recursive chain(certificate_id) as (
    select new.replacement_certificate_id
    union all
    select s.replacement_certificate_id
      from runtime_evidence_certificate_supersessions s
      join chain c on s.target_certificate_id = c.certificate_id
  )
  select exists (
    select 1 from chain where certificate_id = new.target_certificate_id
  ) into cycle_found;
  if cycle_found then
    raise exception 'certificate supersession cycle';
  end if;
  return new;
end;
$$;

create trigger runtime_evidence_certificate_supersessions_cycle
before insert on runtime_evidence_certificate_supersessions
for each row execute function reject_runtime_evidence_supersession_cycle();

create trigger runtime_evidence_certificate_supersessions_append_only
before update or delete on runtime_evidence_certificate_supersessions
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_authority_publication_head (
  singleton boolean primary key default true check (singleton),
  next_generation bigint not null default 1 check (next_generation > 0)
);

insert into runtime_evidence_authority_publication_head (singleton, next_generation)
values (true, 1);

create table runtime_evidence_authority_publications (
  id text primary key,
  generation bigint not null unique check (generation > 0),
  semantic_tuple_manifest_hash text not null check (semantic_tuple_manifest_hash ~ '^sha256:[0-9a-f]{64}$'),
  source_manifest_hash text not null check (source_manifest_hash ~ '^sha256:[0-9a-f]{64}$'),
  payload_sha256 text not null unique check (payload_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  envelope_sha256 text not null unique check (envelope_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  signer_key_id text not null,
  trust_domain text not null,
  issued_at timestamptz not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  payload_bytes bytea not null,
  envelope_bytes bytea not null,
  attestation_ids jsonb not null,
  certificate_ids jsonb not null,
  revocation_ids jsonb not null,
  supersession_ids jsonb not null,
  lane_control_ids jsonb not null,
  prepared_at timestamptz not null default now(),
  check (issued_at <= valid_from and valid_from < valid_until)
);

create trigger runtime_evidence_authority_publications_append_only
before update or delete on runtime_evidence_authority_publications
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_authority_publication_sources (
  publication_id text not null references runtime_evidence_authority_publications(id),
  source_type text not null check (source_type in (
    'attestation', 'certificate', 'revocation', 'supersession', 'lane-control'
  )),
  source_id text not null,
  source_record_hash text not null,
  attestation_id text references runtime_evidence_verified_attestations(id),
  certificate_id text references runtime_evidence_certificates(id),
  revocation_id text references runtime_evidence_certificate_revocations(id),
  supersession_id text references runtime_evidence_certificate_supersessions(id),
  lane_control_id text references runtime_evidence_lane_controls(id),
  primary key (publication_id, source_type, source_id),
  check (num_nonnulls(attestation_id, certificate_id, revocation_id, supersession_id, lane_control_id) = 1),
  check (source_id = coalesce(attestation_id, certificate_id, revocation_id, supersession_id, lane_control_id)),
  check (
    (source_type = 'attestation' and attestation_id is not null) or
    (source_type = 'certificate' and certificate_id is not null) or
    (source_type = 'revocation' and revocation_id is not null) or
    (source_type = 'supersession' and supersession_id is not null) or
    (source_type = 'lane-control' and lane_control_id is not null)
  )
);

create trigger runtime_evidence_authority_publication_sources_append_only
before update or delete on runtime_evidence_authority_publication_sources
for each row execute function reject_integrity_authority_mutation();

create table runtime_evidence_authority_publication_events (
  id text primary key,
  publication_id text not null references runtime_evidence_authority_publications(id),
  event_kind text not null check (event_kind in ('prepared', 'installed', 'failed', 'uncertain')),
  attempt_id text not null,
  envelope_sha256 text not null check (envelope_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  reason_code text,
  receipt jsonb not null,
  occurred_at timestamptz not null default now(),
  unique (publication_id, event_kind, attempt_id)
);

create trigger runtime_evidence_authority_publication_events_append_only
before update or delete on runtime_evidence_authority_publication_events
for each row execute function reject_integrity_authority_mutation();
