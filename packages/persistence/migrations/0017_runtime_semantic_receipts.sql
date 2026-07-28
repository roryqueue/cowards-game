-- Add authenticated semantic-admission receipts to newly produced current
-- Chronicles without manufacturing or rewriting historical evidence.

alter table chronicles
  add column if not exists runtime_semantic_receipt jsonb,
  add column if not exists runtime_semantic_receipt_hash text;

do $$ begin
  alter table chronicles add constraint chronicles_runtime_semantic_receipt_all_or_none check (
    (runtime_semantic_receipt is null) = (runtime_semantic_receipt_hash is null)
    and (
      runtime_semantic_receipt_hash is null or
      runtime_semantic_receipt_hash ~ '^sha256:[0-9a-f]{64}$'
    )
  ) not valid;
exception when duplicate_object then null; end $$;

create or replace function prevent_chronicle_runtime_semantic_receipt_rewrite()
returns trigger language plpgsql as $$
begin
  if old.runtime_semantic_receipt is not null and (
    old.runtime_semantic_receipt is distinct from new.runtime_semantic_receipt or
    old.runtime_semantic_receipt_hash is distinct from new.runtime_semantic_receipt_hash
  ) then
    raise exception 'persisted Chronicle runtime semantic receipt is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists chronicles_runtime_semantic_receipt_immutable on chronicles;
create trigger chronicles_runtime_semantic_receipt_immutable
before update on chronicles
for each row execute function prevent_chronicle_runtime_semantic_receipt_rewrite();
