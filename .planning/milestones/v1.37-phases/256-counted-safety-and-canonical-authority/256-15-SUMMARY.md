---
phase: 256-counted-safety-and-canonical-authority
plan: "15"
subsystem: runtime-evidence-integrity
tags: [ed25519, attestations, closed-graph, postgresql, append-only, tdd]
requires:
  - phase: 256-01
    provides: exact six-component canonical compatibility tuple
  - phase: 256-02
    provides: exact executable lane and certificate identity contracts
  - phase: 256-04
    provides: append-only verified-attestation and certificate schema
  - phase: 256-17
    provides: signed authority bundle and reference-only runtime requests
provides:
  - signed fixed-field runtime evidence attestations with byte-complete closed graph verification
  - intentionally empty production producer authority until Phase 259 executable conformance exists
  - one transactionally reverified and derived certificate import path
  - isolated PostgreSQL proof of idempotence, forgery rejection, and rollback
affects: [phase-256-authority-publisher, phase-259-conformance, runtime-service, scheduling]
tech-stack:
  added: []
  patterns: [domain-separated length framing, WeakSet verified-value branding, derived immutable rows, isolated-schema PostgreSQL proof]
key-files:
  created:
    - packages/spec/src/runtime-evidence-attestation.ts
    - packages/spec/src/runtime-evidence-attestation.test.ts
    - packages/persistence/src/runtime-evidence-import.ts
    - packages/persistence/src/runtime-evidence-import.test.ts
  modified:
    - packages/spec/src/index.ts
    - packages/persistence/src/index.ts
key-decisions:
  - "Production trusted containment and conformance producer registries remain empty in Phase 256; caller-supplied trust is accepted only in the explicit fixture domain."
  - "The signed unit is a domain-separated fixed-field byte payload whose graph nodes must all have exact supplied bytes and be reachable from one signed root."
  - "Certificate IDs, record hashes, and all persisted columns are derived from a branded verified snapshot and are never caller inputs."
patterns-established:
  - "Closed evidence: every graph node has digest-verified original bytes, no byte exists outside the graph, and every node is reachable from the signed root."
  - "Sole writer: verification runs before SQL and again inside one transaction; idempotent collisions must match every persisted field."
requirements-completed: [SAFE-01, SAFE-02, AUTH-01, AUTH-03]
coverage:
  - id: D1
    description: "Only an exact signed trusted-producer attestation with a complete closed evidence graph mints a branded verified value"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-attestation.test.ts#runtime evidence attestation"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Production has no trusted producer and rejects fixture, certificate-shaped, documentation-only, renamed-gate, missing-byte, stale, and forged evidence before SQL"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-attestation.test.ts#forgery matrix (13 passed)"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-import.test.ts#writes zero rows"
        status: pass
    human_judgment: false
  - id: D3
    description: "The sole import path derives an exact certificate, is idempotent, and rolls back both rows on any late PostgreSQL failure"
    requirement: AUTH-03
    verification:
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/runtime-evidence-import.test.ts (5 passed)"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/persistence typecheck"
        status: pass
    human_judgment: false
duration: 11min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 15: Closed Evidence Attestation and Import Summary

**Signed, byte-complete evidence graphs are now the only route to derived runtime certificates, while production remains structurally unable to authorize a conformance producer before Phase 259.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-13T03:35:06Z
- **Completed:** 2026-07-13T03:46:32Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added a platform-crypto Ed25519 verifier that binds the exact producer, key, kind, schema, command, corpus, policy, lane/toolchain/adapter/artifact/build identity, semantic tuple, results, gates, validity, and closed evidence graph.
- Kept the production producer registry frozen empty and proved fixture-domain trust, prose, renamed gates, missing bytes, bad signatures, stale results, aliases, graph gaps, and identity drift cannot mint a verified value.
- Added one append-only import service that snapshots inputs, verifies before SQL and inside the transaction, derives all row/certificate fields, rejects mismatched idempotent collisions, and rolls back completely on late failure.

## Task Commits

Each TDD task has an explicit RED and GREEN gate:

1. **Task 1 RED: closed attestation forgery matrix** - `3edc301` (test)
2. **Task 1 GREEN: signed exact closed-graph verifier** - `ef36dd8` (feat)
3. **Task 2 RED: sole verified import contract** - `f4c7f83` (test)
4. **Task 2 GREEN: derived transactional certificate import** - `eb6f5c6` (feat)

## Files Created/Modified

- `packages/spec/src/runtime-evidence-attestation.ts` - Strict contracts, fixed-field encoding, lane/graph hashing, production trust registry, signature verification, graph closure, and branded verified snapshots.
- `packages/spec/src/runtime-evidence-attestation.test.ts` - Valid fixture proof plus forged, stale, incomplete, renamed, and drifted evidence matrix.
- `packages/spec/src/index.ts` - Public attestation contract/verifier export.
- `packages/persistence/src/runtime-evidence-import.ts` - Sole verifier-backed transactional writer with derived immutable rows and exact collision checks.
- `packages/persistence/src/runtime-evidence-import.test.ts` - Fake-transaction and isolated real-PostgreSQL success, idempotence, zero-row rejection, direct-forgery, production-empty, and rollback proof.
- `packages/persistence/src/index.ts` - Public sole import service export.

## Decisions Made

- Caller-supplied producer keys are rejected in production mode. Fixture keys require both explicit fixture mode and fixture trust domain, so tests cannot silently become deployment authority.
- The verifier signs fixed-order, length-framed UTF-8 fields rather than depending on the Phase-258 canonical JSON profile.
- PostgreSQL integration tests migrate into a unique temporary schema and drop it afterward, keeping fixture attestations out of normal authority inventory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Reject aliased nested attestation fields**
- **Found during:** Task 1 threat review
- **Issue:** Verifying only referenced fields could let a correctly signed payload carry ignored alias/extra fields and create ambiguous evidence semantics.
- **Fix:** Added exact-key validation for the attestation and every nested command, corpus, policy, runtime, toolchain, adapter, artifact, result, digest, gate, node, and edge record.
- **Files modified:** `packages/spec/src/runtime-evidence-attestation.ts`
- **Verification:** Focused 13-case attestation matrix and spec typecheck passed.
- **Committed in:** `ef36dd8`

**2. [Rule 2 - Missing Critical] Revalidate immutable input and idempotent collisions**
- **Found during:** Task 2 transaction review
- **Issue:** A mutable caller object could drift between preflight and transaction, while `ON CONFLICT DO NOTHING` alone could accept a pre-existing row with the same key but mismatched fields.
- **Fix:** Snapshot all caller bytes/records, reverify inside SQL, then select and compare every stored column before accepting either attestation or certificate.
- **Files modified:** `packages/persistence/src/runtime-evidence-import.ts`
- **Verification:** Fake late-failure rollback and isolated-schema PostgreSQL idempotence/collision checks passed.
- **Committed in:** `eb6f5c6`

---

**Total deviations:** 2 auto-fixed (2 missing critical integrity controls).
**Impact on plan:** Both changes close declaration and race/collision bypasses without adding a producer or expanding counted eligibility.

## Issues Encountered

- The first real-PostgreSQL run exposed JSONB key-order differences in the exact collision comparison. Comparison now recursively sorts object keys while preserving exact values; the rerun passed all five configured-PostgreSQL tests.
- A broader configured-database persistence run passed 129 tests but exposed one pre-existing/out-of-plan `dev-smoke` trigger failure: `record "old" has no field "integrity_match_set_id"`. Plan 256-15 focused, regression, typecheck, and isolated-schema PostgreSQL gates are green; the concurrent migration/writer plan owns that trigger repair.

## User Setup Required

None - the existing local PostgreSQL topology was used only through a disposable schema.

## Verification

- `pnpm --filter @cowards/spec exec vitest run src/runtime-evidence-attestation.test.ts` - 13 passed.
- `DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/runtime-evidence-import.test.ts` - 5 passed, including fresh migration, production-empty inventory, idempotence, forgery rejection, and rollback.
- `pnpm --filter @cowards/spec test` - 72 passed.
- `pnpm --filter @cowards/spec typecheck` - passed.
- `pnpm --filter @cowards/persistence typecheck` - passed.
- `git diff --check` - passed.

## Next Phase Readiness

- Plan 256-18 can publish only certificates that carry this exact verified-attestation provenance.
- Phase 259 must add the first separately reviewed production conformance producer and executable corpus evidence; until then production verification has no authority capable of creating a certificate.
- No gameplay behavior, historical evidence, public output, or runtime execution boundary changed.

## Self-Check: PASSED

- All four planned implementation/test artifacts exist and both index exports resolve.
- RED and GREEN commits exist in order for both TDD tasks.
- Focused spec, persistence, configured PostgreSQL, regression spec, both typechecks, and diff checks pass.
- Production trusted producers are frozen empty, and fixture trust is rejected in production mode before SQL.
- The dirty consolidated spec and `.planning/config.json` remained unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
