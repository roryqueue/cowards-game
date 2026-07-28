alter table strategy_revisions
  add column if not exists source_identity_version text,
  add column if not exists original_source_hash text,
  add column if not exists original_source_bytes integer,
  add column if not exists normalized_source_hash text,
  add column if not exists normalized_source_bytes integer,
  add column if not exists source_normalization_policy text,
  add column if not exists source_line_endings jsonb,
  add column if not exists source_has_final_newline boolean;

alter table strategy_revisions
  add constraint strategy_revisions_source_identity_all_or_none
  check (
    num_nonnulls(
      source_identity_version,
      original_source_hash,
      original_source_bytes,
      normalized_source_hash,
      normalized_source_bytes,
      source_normalization_policy,
      source_line_endings,
      source_has_final_newline
    ) in (0, 8)
  ),
  add constraint strategy_revisions_source_identity_v2_shape
  check (
    source_identity_version is null or (
      source_identity_version = 'strategy-source-identity-v2' and
      original_source_hash ~ '^[0-9a-f]{64}$' and
      original_source_bytes = octet_length(source) and
      original_source_bytes >= 0 and
      normalized_source_hash ~ '^[0-9a-f]{64}$' and
      normalized_source_bytes >= 0 and
      source_normalization_policy = 'source-line-endings-lf-v1.17' and
      jsonb_typeof(source_line_endings) = 'object' and
      source_line_endings ->> 'kind' in ('none', 'lf', 'crlf', 'cr', 'mixed') and
      jsonb_typeof(source_line_endings -> 'lf') = 'number' and
      jsonb_typeof(source_line_endings -> 'crlf') = 'number' and
      jsonb_typeof(source_line_endings -> 'cr') = 'number'
    )
  );

create function prevent_strategy_revision_source_identity_update()
returns trigger
language plpgsql
as $$
begin
  if old.source_identity_version is distinct from new.source_identity_version or
     old.original_source_hash is distinct from new.original_source_hash or
     old.original_source_bytes is distinct from new.original_source_bytes or
     old.normalized_source_hash is distinct from new.normalized_source_hash or
     old.normalized_source_bytes is distinct from new.normalized_source_bytes or
     old.source_normalization_policy is distinct from new.source_normalization_policy or
     old.source_line_endings is distinct from new.source_line_endings or
     old.source_has_final_newline is distinct from new.source_has_final_newline or
     (old.source_identity_version is not null and old.source is distinct from new.source)
  then
    raise exception 'source identity v2 is immutable';
  end if;
  return new;
end;
$$;

create trigger strategy_revisions_source_identity_immutable
before update on strategy_revisions
for each row
execute function prevent_strategy_revision_source_identity_update();

-- Deliberately no backfill: existing rows retain their persisted bytes as
-- legacy-original evidence and do not acquire manufactured v2 provenance.
