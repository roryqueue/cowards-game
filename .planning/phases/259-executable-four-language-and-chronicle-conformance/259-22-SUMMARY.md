---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "22"
subsystem: managed-conformance-authority
tags: [ed25519, postgresql, conformance, trust-roots, privacy]
requires:
  - phase: 259-16
    provides: Four reviewed unsigned real-language candidates
  - phase: 259-19
    provides: Append-only authenticated certificate import
  - phase: 259-28
    provides: Plural import trust-root high-water
provides:
  - Protected external producer signing and distinct operator import signing
  - Immutable managed public producer trust
  - Four exact installed certificate receipts and independent lane promotion
affects: [259-23, runtime-authority, counted-lane-admission]
key-decisions:
  - "The conformance producer and operator import authority use distinct protected Ed25519 keys and independently pinned public identities."
  - "Production import requires the import envelope signer itself to equal the unique current bootstrapped database high-water root inside the serializable import transaction."
  - "Lane promotion requires a verifier-issued current certificate plus the exact installed ID, hash, generation, live revocation state, and live lane-control state."
requirements-completed: [CONF-04, CONF-05]
duration: 28min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 22: Managed Signing and Promotion Summary

**TypeScript, Python, Rust, and Zig now have exact reviewed certificates signed by one managed producer, authorized by a separate operator root, and installed in the append-only evidence ledger.**

## Accomplishments

- Added a protected operator command that pins all four reviewed candidate payload hashes, opens keys and descriptors without following symlinks, signs only exact certificate framing, verifies immediately at the current instant, and imports the same certificate bytes.
- Activated one immutable public producer identity shared by the certificate and evidence verifiers; fixture and caller-provided production trust remain rejected.
- Rotated the Plan-28 bootstrap from its mechanism-only fixture root to append-only production root generation `2`; neither private key is committed or rendered.
- Strengthened production import so the envelope producer/key/domain must be the unique current bootstrapped root and is rechecked under the import transaction lock.
- Persisted four fixed-schema public-safe receipts. PostgreSQL contains four exact certificates and twelve immutable run rows.
- Added independent budget promotion with exact certificate ID/hash/generation pins, verifier-issued snapshot branding, current identity/freshness, and live revocation/lane-control inputs.

## Verification

- Sign/verify/import command: passed twice identically for all four lanes.
- PostgreSQL publisher/import suite: 28/28 passed.
- Signer, managed trust, certificate, attestation, and budget suites: 72/72 passed; the explicit database-backed promotion proof reports four current lanes and successful all-four closure.
- Workspace typecheck: 27/27 tasks.
- Focused ESLint and diff checks: passed.
- Protected working-tree baseline: exact.

## Boundaries

- No gameplay state, Action legality, event order, outcome, Strategy observation, or v1.4 history changed.
- Safe receipts contain no signature, key path, source, artifact body, memory, objective, diagnostics, or host data.
- Production signing remains an explicit operator action; default product output and normal startup do not access either private key.

## Self-Check: PASSED

- Four exact installed receipts exist in canonical lane order.
- Four certificate rows and twelve run rows are durable and idempotent.
- Only the two protected pre-existing user files remain dirty outside this plan.
