---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "22"
fixed_at: 2026-07-16
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 259 Plan 22: Code Review Fix Report

## Fixed Findings

1. The original Plan-28 fixture root had no retained operator signer. It was replaced by append-only production root generation `2` with a distinct protected operator key.
2. Candidate status alone could have admitted substituted bytes. The signer now pins the four independently reviewed payload hashes and reads each candidate through a stable no-follow file handle.
3. Verification at candidate issuance could have admitted an expired certificate later. Signing and import now evaluate freshness at the actual current instant.
4. A caller could present the current bootstrap receipt while signing the import envelope with another trusted plural root. The import transaction now requires the envelope identity, selected root, fingerprint, descriptor, and current high-water generation all to match exactly.

## Verification

- Real four-lane command repeated idempotently.
- PostgreSQL, signer, trust, certificate, attestation, budget, lint, typecheck, and protected-baseline checks passed.
