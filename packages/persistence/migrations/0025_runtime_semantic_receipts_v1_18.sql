-- Extend the version-strict Chronicle receipt binding to additive v1.18.
-- Historical rows are not backfilled or reinterpreted.

alter table chronicles
  drop constraint chronicles_runtime_semantic_receipt_v1_17_binding;

alter table chronicles
  add constraint chronicles_runtime_semantic_receipt_version_binding check (
    (
      runtime_semantic_receipt_version is null
      and coalesce(
        runtime_semantic_receipt ->> 'schemaVersion',
        runtime_semantic_receipt -> 'claim' ->> 'schemaVersion',
        ''
      ) not in (
        'runtime-semantic-receipt-v1.17',
        'runtime-semantic-receipt-v1.18'
      )
    )
    or (
      runtime_semantic_receipt_version in (
        'runtime-semantic-receipt-v1.17',
        'runtime-semantic-receipt-v1.18'
      )
      and runtime_semantic_receipt is not null
      and runtime_semantic_receipt_hash is not null
      and coalesce(
        runtime_semantic_receipt ->> 'schemaVersion',
        runtime_semantic_receipt -> 'claim' ->> 'schemaVersion'
      )
        is not distinct from runtime_semantic_receipt_version
    )
  ) not valid;
