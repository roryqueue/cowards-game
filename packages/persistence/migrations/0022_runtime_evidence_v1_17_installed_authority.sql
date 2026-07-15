-- Additive v1.17 mounted-authority ledger. The incompatible legacy/current
-- publication tables remain unchanged, and no production successor authority
-- is seeded by this migration.

create table runtime_evidence_v1_17_installed_authorities (
  id text primary key,
  authority_bundle_hash text not null unique
    check (authority_bundle_hash ~ '^sha256:[0-9a-f]{64}$'),
  source_manifest_hash text not null
    check (source_manifest_hash ~ '^sha256:[0-9a-f]{64}$'),
  registry_generation text not null
    check (registry_generation ~ '^(0|[1-9][0-9]{0,15})$'),
  semantic_tuple_manifest_hash text not null
    check (semantic_tuple_manifest_hash ~ '^sha256:[0-9a-f]{64}$'),
  envelope_sha256 text not null unique
    check (envelope_sha256 ~ '^sha256:[0-9a-f]{64}$'),
  trust_domain text not null check (trust_domain in (
    'cowards-game:runtime-evidence-authority:fixture:v1',
    'cowards-game:runtime-evidence-authority:production:v1'
  )),
  signer_key_id text not null,
  install_receipt_id text not null unique,
  install_receipt_hash text not null unique
    check (install_receipt_hash ~ '^sha256:[0-9a-f]{64}$'),
  issued_at timestamptz not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  installed_at timestamptz not null,
  payload_bytes bytea not null,
  envelope_bytes bytea not null,
  attestation_ids jsonb not null check (jsonb_typeof(attestation_ids) = 'array'),
  certificate_ids jsonb not null check (jsonb_typeof(certificate_ids) = 'array'),
  install_receipt jsonb not null,
  check (issued_at <= valid_from and valid_from < valid_until),
  check (installed_at >= issued_at),
  check (
    install_receipt->>'schemaVersion' =
      'v1.37-runtime-evidence-authority-install-receipt-v1.17'
    and install_receipt->>'installReceiptId' = install_receipt_id
    and install_receipt->>'authorityBundleHash' = authority_bundle_hash
    and install_receipt->>'sourceManifestHash' = source_manifest_hash
    and install_receipt->>'registryGeneration' = registry_generation
    and install_receipt->>'semanticTupleManifestHash' = semantic_tuple_manifest_hash
    and install_receipt->>'envelopeSha256' = envelope_sha256
    and install_receipt->>'installedAt' = to_char(
      installed_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
    )
    and install_receipt->'attestationIds' = attestation_ids
    and install_receipt->'certificateIds' = certificate_ids
  )
);

create unique index runtime_evidence_v1_17_production_generation_unique
  on runtime_evidence_v1_17_installed_authorities (registry_generation)
  where trust_domain = 'cowards-game:runtime-evidence-authority:production:v1';

create trigger runtime_evidence_v1_17_installed_authorities_append_only
before update or delete on runtime_evidence_v1_17_installed_authorities
for each row execute function reject_integrity_authority_mutation();
