-- Additive high-water for the existing plural operator import trust-root
-- descriptor. It contains public verification identity only and does not
-- confer runtime producer trust.

create table runtime_evidence_authority_import_trust_root_head (
  singleton boolean primary key default true check (singleton),
  next_generation bigint not null default 1 check (next_generation > 0)
);

insert into runtime_evidence_authority_import_trust_root_head (
  singleton,
  next_generation
) values (true, 1);

create function enforce_runtime_authority_import_trust_root_generation()
returns trigger language plpgsql as $$
begin
  if new.next_generation <> old.next_generation + 1 then
    raise exception
      'runtime authority import trust-root generation must advance exactly once';
  end if;
  return new;
end;
$$;

create trigger runtime_evidence_authority_import_trust_root_head_monotonic
before update
on runtime_evidence_authority_import_trust_root_head
for each row execute function
  enforce_runtime_authority_import_trust_root_generation();

create table runtime_evidence_authority_import_trust_root_deployments (
  id text primary key,
  descriptor_sha256 text not null unique
    check (descriptor_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  descriptor_bytes bytea not null
    check (octet_length(descriptor_bytes) between 2 and 65536),
  producer_id text not null,
  key_id text not null,
  trust_domain text not null,
  public_key_fingerprint text not null
    check (public_key_fingerprint ~ '^sha256:[0-9a-f]{64}$'),
  generation bigint not null unique check (generation > 0),
  installed_at timestamptz not null default now(),
  unique (producer_id, key_id, trust_domain)
);

create trigger runtime_evidence_authority_import_trust_root_deployments_append_only
before update or delete
on runtime_evidence_authority_import_trust_root_deployments
for each row execute function reject_integrity_authority_mutation();
