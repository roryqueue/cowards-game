---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "19"
subsystem: persistence-runtime-evidence-authority
tags: [postgresql, certificates, ed25519, append-only, authority]
requires:
  - phase: 259-09
    provides: Phase-259 certificate binding to the exact Phase-258 identity DAG
  - phase: 259-16
    provides: Four reviewed three-run real-language certificate candidates
  - phase: 259-18
    provides: Durable v1.18 semantic admission before SQL
provides:
  - Exact signed conformance-certificate storage on the existing runtime evidence ledger
  - Three-run immutable certificate provenance and plural operator-import authentication
  - Serializable idempotent certificate import with privacy-safe receipts
affects: [259-22, 259-28, runtime-evidence-authority, persistence]
tech-stack:
  added: []
  patterns:
    - Extend the existing append-only evidence authority instead of creating a parallel registry
    - Authenticate runtime-producer evidence and operator-import authority through distinct Ed25519 domains
key-files:
  created:
    - packages/persistence/migrations/0023_runtime_conformance_certificates.sql
  modified:
    - packages/persistence/src/schema.ts
    - packages/persistence/src/migrations.test.ts
    - packages/persistence/src/runtime-evidence-authority-publisher.ts
    - packages/persistence/src/runtime-evidence-authority-publisher.test.ts
key-decisions:
  - "Phase-259 conformance certificates extend runtime_evidence_certificates and use a child run-provenance table; they do not create a second certificate authority."
  - "Operator import authentication uses the existing plural RuntimeEvidenceAuthorityImportTrustRoot API and remains distinct from runtime producer trust."
patterns-established:
  - "Certificate import re-verifies exact producer bytes, current identity, three-run binding, freshness, and an independently signed operator envelope inside one advisory-locked serializable transaction."
requirements-completed: [CONF-04, CONF-05]
coverage:
  - id: D1
    description: Existing certificate authority stores exact signed certificate bytes and exactly three immutable run records.
    requirement: CONF-04
    verification:
      - kind: integration
        ref: "packages/persistence/src/migrations.test.ts#0023 runtime conformance certificate ledger"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm exec vitest run packages/persistence/src/migrations.test.ts packages/persistence/src/runtime-evidence-authority-publisher.test.ts --testTimeout=15000"
        status: pass
    human_judgment: false
  - id: D2
    description: Only exact producer-verified and plural-operator-authenticated certificates import idempotently with safe receipts.
    requirement: CONF-05
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#importRuntimeConformanceCertificateV117"
        status: pass
    human_judgment: false
duration: resumed
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 19: Append-Only Conformance Certificate Import Summary

**The existing runtime evidence authority now stores and imports exact reviewed Phase-259 certificates with immutable three-run provenance and independent plural operator authentication.**

## Performance

- **Duration:** Resumed closure; implementation timing was not separately recorded
- **Completed:** 2026-07-16
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Extended migration-0012 certificate authority through additive migration 0023 rather than creating a parallel registry.
- Persisted exact signed certificate bytes/hash, v1.18 conformance identity, requested validity, and exactly three immutable child-run records.
- Added serializable advisory-locked import that independently verifies runtime producer evidence and the plural operator import envelope before mutation.
- Proved concurrent identical imports are idempotent, conflicting substitutions reject before mutation, and append-only triggers protect certificate and run rows.

## Task Commits

1. **Tasks 1-2: Extend the ledger and import reviewed certificates** - `6d2be34`

## Files Created/Modified

- `packages/persistence/migrations/0023_runtime_conformance_certificates.sql` - Additive exact certificate and three-run provenance.
- `packages/persistence/src/schema.ts` - Typed certificate and run-ledger schema.
- `packages/persistence/src/migrations.test.ts` - Migration ordering, shape, and append-only coverage.
- `packages/persistence/src/runtime-evidence-authority-publisher.ts` - Producer and plural-operator verified import.
- `packages/persistence/src/runtime-evidence-authority-publisher.test.ts` - PostgreSQL-backed idempotency, conflict, rollback, and privacy proof.

## Decisions Made

- Reused the existing `runtime_evidence_certificates` authority and added a provenance child table.
- Kept runtime producer trust and operator import trust cryptographically and structurally separate.
- Returned only approved certificate identity/status facts from import; no source, artifacts, diagnostics, paths, or key material enter receipts.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None during resumed verification. The joined migration and publisher suite passed 40 tests.

## User Setup Required

None - Plan 28 owns protected plural-root bootstrap.

## Next Phase Readiness

Plan 28 can pin the protected plural operator trust descriptor, and Plan 22 can later sign, immediately verify, and import all four reviewed candidates.

## Self-Check: PASSED

- All declared files exist.
- Production commit `6d2be34` exists.
- Joined PostgreSQL migration/publisher suite passed 40/40 tests.
- Protected working-tree baseline remained exact.
