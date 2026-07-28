-- Bind newly created MatchSets to the exact immutable authority installation
-- receipt verified by the creation transaction. Historical rows remain null.

alter table match_sets
  add column if not exists authority_publication_id text,
  add column if not exists authority_install_receipt_id text,
  add column if not exists authority_payload_sha256 text,
  add column if not exists authority_envelope_sha256 text,
  add column if not exists authority_source_manifest_hash text,
  add column if not exists authority_source_set jsonb;

do $$ begin
  alter table match_sets add constraint match_sets_authority_publication_fk
    foreign key (authority_publication_id)
    references runtime_evidence_authority_publications(id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table match_sets add constraint match_sets_authority_install_receipt_fk
    foreign key (authority_install_receipt_id)
    references runtime_evidence_authority_publication_events(id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table match_sets add constraint match_sets_authority_receipt_all_or_none check (
    num_nonnulls(
      authority_publication_id,
      authority_install_receipt_id,
      authority_payload_sha256,
      authority_envelope_sha256,
      authority_source_manifest_hash,
      authority_source_set
    ) in (0, 6)
  ) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table match_sets add constraint match_sets_authority_receipt_hash_formats check (
    authority_payload_sha256 is null or (
      authority_payload_sha256 ~ '^sha256:[0-9a-f]{64}$' and
      authority_envelope_sha256 ~ '^sha256:[0-9a-f]{64}$' and
      authority_source_manifest_hash ~ '^sha256:[0-9a-f]{64}$'
    )
  ) not valid;
exception when duplicate_object then null; end $$;

alter table match_set_execution_entrants
  alter column conformance_certificate_kind drop not null,
  alter column conformance_certificate_id drop not null,
  alter column conformance_certificate_version drop not null,
  alter column conformance_certificate_hash drop not null;

do $$ begin
  alter table match_set_execution_entrants
    add constraint match_set_execution_entrants_conformance_all_or_none check (
      num_nonnulls(
        conformance_certificate_kind,
        conformance_certificate_id,
        conformance_certificate_version,
        conformance_certificate_hash
      ) in (0, 4)
    ) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table match_set_execution_entrants
    add constraint match_set_execution_entrants_purpose_floor check (
      (scheduling_status = 'counted' and num_nonnulls(
        conformance_certificate_kind,
        conformance_certificate_id,
        conformance_certificate_version,
        conformance_certificate_hash
      ) = 4) or
      scheduling_status = 'exhibition_only' or
      scheduling_status = 'disabled'
    ) not valid;
exception when duplicate_object then null; end $$;

create or replace function prevent_match_set_authority_receipt_rewrite()
returns trigger language plpgsql as $$
begin
  if (
    old.authority_publication_id is distinct from new.authority_publication_id or
    old.authority_install_receipt_id is distinct from new.authority_install_receipt_id or
    old.authority_payload_sha256 is distinct from new.authority_payload_sha256 or
    old.authority_envelope_sha256 is distinct from new.authority_envelope_sha256 or
    old.authority_source_manifest_hash is distinct from new.authority_source_manifest_hash or
    old.authority_source_set is distinct from new.authority_source_set
  ) and old.authority_publication_id is not null then
    raise exception 'persisted MatchSet authority receipt is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists match_sets_authority_receipt_immutable on match_sets;
create trigger match_sets_authority_receipt_immutable
before update on match_sets
for each row execute function prevent_match_set_authority_receipt_rewrite();
