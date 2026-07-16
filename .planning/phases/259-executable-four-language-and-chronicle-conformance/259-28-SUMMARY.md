---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "28"
subsystem: runtime-authority-import-trust
tags: [postgresql, ed25519, canonical-json, bootstrap, high-water]
requires:
  - phase: 259-19
    provides: Reviewed conformance certificate import through the existing plural operator trust-root mechanism
provides:
  - Append-only generation ledger for exact plural import trust-root descriptors
  - Protected canonical descriptor bootstrap with independent producer, key, domain, and hash pins
  - Public-safe installed/idempotent bootstrap receipt
affects: [259-21, 259-22, runtime-evidence-authority]
tech-stack:
  added: []
  patterns:
    - Open protected descriptor files with O_NOFOLLOW and validate the same handle before transactional reread
    - Separate operator import trust from runtime producer trust through closed schemas and disjoint persisted identity
key-files:
  created:
    - packages/persistence/migrations/0024_runtime_authority_import_trust_roots.sql
    - scripts/bootstrap-v1-37-runtime-authority-import-trust-roots.ts
    - scripts/bootstrap-v1-37-runtime-authority-import-trust-roots.test.ts
    - .planning/artifacts/v1.37-runtime-authority-import-trust-roots-bootstrap.json
  modified:
    - packages/persistence/src/runtime-evidence-authority-publisher.ts
    - packages/persistence/src/runtime-evidence-authority-publisher.test.ts
    - packages/persistence/src/migrations.test.ts
    - packages/persistence/src/schema.ts
key-decisions:
  - "Bootstrap extends RuntimeEvidenceAuthorityImportTrustRoot[]; it does not add a singular root or allow a runtime producer key to authorize imports."
  - "The selected root is pinned by canonical descriptor bytes, descriptor SHA-256, producer ID, key ID, trust domain, Ed25519 SPKI fingerprint, and monotonic generation."
  - "The committed receipt is a public fixture proof; production installation still requires operator-supplied protected descriptor bytes and independent expected pins."
patterns-established:
  - "First-use trust is authenticated outside the database and reread inside one serializable locked transaction before append-only installation."
requirements-completed: [CONF-04, CONF-05]
coverage:
  - id: D1
    description: Exact protected plural descriptor installation is canonical, hash-pinned, identity-pinned, idempotent, append-only, and generation-monotonic.
    requirement: CONF-04
    verification:
      - kind: integration
        ref: "packages/persistence/src/runtime-evidence-authority-publisher.test.ts#Phase-259 import trust-root bootstrap"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/migrations.test.ts#pins plural authority import trust-root descriptors append-only"
        status: pass
    human_judgment: false
  - id: D2
    description: Missing pins, unsafe file type or permissions, duplicate or poisoned roots, identity substitution, changed bytes, and conflicts fail without durable mutation or private output.
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "scripts/bootstrap-v1-37-runtime-authority-import-trust-roots.test.ts"
        status: pass
      - kind: integration
        ref: ".planning/artifacts/v1.37-runtime-authority-import-trust-roots-bootstrap.json"
        status: pass
    human_judgment: false
duration: 23min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 28: Import Trust-Root Bootstrap Summary

**The existing plural operator import trust-root descriptor now has a non-circular, append-only, transactionally reread high-water anchor before any external conformance signing or import.**

## Accomplishments

- Added a public-only deployment ledger and exact-increment generation head without creating another runtime evidence registry.
- Added strict bounded canonical JSON validation, duplicate/closed-field rejection, exact independent pins, Ed25519 public-key fingerprinting, and idempotent conflict detection.
- Added a protected CLI that opens the descriptor without following symlinks, rejects non-owner or writable files, and rereads it inside the serializable transaction.
- Added a stable public-safe bootstrap receipt containing no path, private material, source, runtime producer assertion, host detail, or diagnostics.

## Task Commits

1. `17990c4` / `0488e4b` — RED/GREEN append-only high-water migration.
2. `7a612ad` / `ad4027f` — RED/GREEN transactional plural-root bootstrap API.
3. `ad0b002` / `c9f4567` — RED/GREEN protected bootstrap CLI.
4. `c1adbc1` — adversarial negative and public-safe artifact proof.
5. `a9b3939` — code-review fixes for no-follow file identity and monotonic generation enforcement.

## Review Findings Fixed

- Replaced path-following metadata checks with `O_NOFOLLOW`, same-handle stat/read/stat validation.
- Added database enforcement that the high-water head advances by exactly one and cannot roll back or skip generations.

## Verification

- PostgreSQL migration, publisher, and bootstrap suites: 46/46 passed.
- Persistence typecheck and focused formatting: passed.
- Protected working-tree baseline: exact.
- Repeated real bootstrap against the local PostgreSQL authority ledger: idempotent with the committed receipt unchanged.

## Historical and Authority Boundaries

- No gameplay, Chronicle, Strategy observation, Action legality, event order, or outcome changed.
- v1.4 evidence and current runtime dispatch remain untouched.
- The fixture receipt proves the mechanism only; it does not promote a production lane or substitute for the external operator configuration required by Plan 22.

## Self-Check: PASSED

- All declared files exist.
- RED, GREEN, review-fix, database, and artifact evidence exist.
- Only the two pre-existing protected working-tree files remain dirty.

