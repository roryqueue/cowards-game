alter table strategy_revisions
  add column if not exists compiled_artifact jsonb;

update strategy_revisions
set metadata = jsonb_set(
  metadata,
  '{compiledArtifact}',
  compiled_artifact,
  true
)
where compiled_artifact is not null
  and metadata -> 'compiledArtifact' is null;

create or replace function prevent_locked_strategy_revision_content_update()
returns trigger
language plpgsql
as $$
begin
  if old.locked_at is not null and (
    old.source is distinct from new.source or
    old.source_hash is distinct from new.source_hash or
    old.source_bytes is distinct from new.source_bytes or
    old.runtime is distinct from new.runtime or
    old.engine_compatibility is distinct from new.engine_compatibility or
    old.validation is distinct from new.validation or
    old.metadata is distinct from new.metadata or
    old.compiled_artifact is distinct from new.compiled_artifact
  ) then
    raise exception 'locked Strategy Revision content is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists strategy_revisions_locked_content_immutable on strategy_revisions;

create trigger strategy_revisions_locked_content_immutable
before update on strategy_revisions
for each row
execute function prevent_locked_strategy_revision_content_update();
