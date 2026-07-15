-- Bind newly produced v1.17 semantic receipts to their exact schema version
-- without manufacturing or rewriting historical v1.16 Chronicle evidence.

alter table chronicles
  add column runtime_semantic_receipt_version text;

alter table chronicles
  add constraint chronicles_runtime_semantic_receipt_v1_17_binding check (
    (
      runtime_semantic_receipt_version is null
      and coalesce(
        runtime_semantic_receipt ->> 'schemaVersion',
        ''
      ) <> 'runtime-semantic-receipt-v1.17'
    )
    or (
      runtime_semantic_receipt_version is not distinct from
        'runtime-semantic-receipt-v1.17'
      and runtime_semantic_receipt is not null
      and runtime_semantic_receipt_hash is not null
      and runtime_semantic_receipt ->> 'schemaVersion'
        is not distinct from runtime_semantic_receipt_version
    )
  ) not valid;

create or replace function prevent_chronicle_runtime_semantic_receipt_rewrite()
returns trigger language plpgsql as $$
begin
  if
    old.runtime_semantic_receipt is not null
    or old.runtime_semantic_receipt_version is not null
  then
    if
      old.runtime_semantic_receipt is distinct from new.runtime_semantic_receipt
      or old.runtime_semantic_receipt_hash is distinct from new.runtime_semantic_receipt_hash
      or old.runtime_semantic_receipt_version is distinct from new.runtime_semantic_receipt_version
    then
      raise exception 'persisted Chronicle runtime semantic receipt is immutable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists chronicles_runtime_semantic_receipt_immutable on chronicles;
create trigger chronicles_runtime_semantic_receipt_immutable
before update on chronicles
for each row execute function prevent_chronicle_runtime_semantic_receipt_rewrite();
