-- Persist the exact current execution authority on new Chronicles while
-- leaving immutable historical v1.4 evidence unresolved and unchanged.

alter table chronicles
  add column if not exists compatibility_tuple_id text,
  add column if not exists compatibility_rules_version text,
  add column if not exists compatibility_engine_version text,
  add column if not exists compatibility_runtime_abi_version text,
  add column if not exists compatibility_chronicle_version text,
  add column if not exists compatibility_arena_catalog_version text,
  add column if not exists compatibility_set_policy_version text,
  add column if not exists authority_bundle_hash text,
  add column if not exists authority_registry_generation text,
  add column if not exists authority_publication_id text,
  add column if not exists authority_install_receipt_id text,
  add column if not exists authority_payload_sha256 text,
  add column if not exists authority_envelope_sha256 text,
  add column if not exists authority_source_manifest_hash text,
  add column if not exists authority_source_set jsonb;

do $$ begin
  alter table chronicles add constraint chronicles_authority_publication_fk
    foreign key (authority_publication_id) references runtime_evidence_authority_publications(id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table chronicles add constraint chronicles_authority_receipt_fk
    foreign key (authority_install_receipt_id) references runtime_evidence_authority_publication_events(id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table chronicles add constraint chronicles_complete_integrity_all_or_none check (
    num_nonnulls(
      compatibility_tuple_id, compatibility_rules_version,
      compatibility_engine_version, compatibility_runtime_abi_version,
      compatibility_chronicle_version, compatibility_arena_catalog_version,
      compatibility_set_policy_version, authority_bundle_hash,
      authority_registry_generation, authority_publication_id,
      authority_install_receipt_id, authority_payload_sha256,
      authority_envelope_sha256, authority_source_manifest_hash,
      authority_source_set, integrity_match_set_id,
      bottom_execution_entrant_key, top_execution_entrant_key,
      bottom_execution_evidence, top_execution_evidence,
      execution_evidence_pair_hash
    ) in (0, 21)
  ) not valid;
exception when duplicate_object then null; end $$;

create or replace function prevent_chronicle_integrity_identity_rewrite()
returns trigger language plpgsql as $$
begin
  if old.compatibility_tuple_id is not null and (
    old.compatibility_tuple_id is distinct from new.compatibility_tuple_id or
    old.compatibility_rules_version is distinct from new.compatibility_rules_version or
    old.compatibility_engine_version is distinct from new.compatibility_engine_version or
    old.compatibility_runtime_abi_version is distinct from new.compatibility_runtime_abi_version or
    old.compatibility_chronicle_version is distinct from new.compatibility_chronicle_version or
    old.compatibility_arena_catalog_version is distinct from new.compatibility_arena_catalog_version or
    old.compatibility_set_policy_version is distinct from new.compatibility_set_policy_version or
    old.authority_bundle_hash is distinct from new.authority_bundle_hash or
    old.authority_registry_generation is distinct from new.authority_registry_generation or
    old.authority_publication_id is distinct from new.authority_publication_id or
    old.authority_install_receipt_id is distinct from new.authority_install_receipt_id or
    old.authority_payload_sha256 is distinct from new.authority_payload_sha256 or
    old.authority_envelope_sha256 is distinct from new.authority_envelope_sha256 or
    old.authority_source_manifest_hash is distinct from new.authority_source_manifest_hash or
    old.authority_source_set is distinct from new.authority_source_set or
    old.integrity_match_set_id is distinct from new.integrity_match_set_id or
    old.bottom_execution_entrant_key is distinct from new.bottom_execution_entrant_key or
    old.top_execution_entrant_key is distinct from new.top_execution_entrant_key or
    old.bottom_execution_evidence is distinct from new.bottom_execution_evidence or
    old.top_execution_evidence is distinct from new.top_execution_evidence or
    old.execution_evidence_pair_hash is distinct from new.execution_evidence_pair_hash
  ) then
    raise exception 'persisted Chronicle integrity identity is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists chronicles_execution_evidence_immutable on chronicles;
drop trigger if exists chronicles_integrity_identity_immutable on chronicles;
create trigger chronicles_integrity_identity_immutable
before update on chronicles
for each row execute function prevent_chronicle_integrity_identity_rewrite();
