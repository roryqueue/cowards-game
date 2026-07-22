---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "18"
subsystem: persistence-semantic-admission
tags: [persistence, postgresql, chronicle, receipt, rollback]
status: complete
completed: 2026-07-16
requirements-completed: [CHRN-04, CHRN-05]
---

# Phase 259 Plan 18: Durable v1.18 Semantic Admission Summary

Persistence now has an additive v1.18 completion route that independently recomputes Chronicle/reconstruction anchors and verifies the exact spec receipt before derived fields or a database transaction can begin.

## Delivered

- Added a strict v1.18 completion envelope alongside the unchanged current route.
- Required the current tuple, exact Match and authority generation, distinct current conformance references, source/lane/artifact identity, freshness, and common-supervisor roots.
- Reused `validateCurrentChronicle` and `validateCurrentReplayReconstruction`; persistence implements no Chronicle grammar or gameplay rules.
- Recomputed Chronicle, transition, final-state, outcome, terminal, and accounting claims and verified Ed25519 bytes through `@cowards/spec`.
- Returned cloned Chronicle, final state, and receipt bytes so later caller mutation cannot change admitted meaning.
- Rejected malformed or mismatched evidence with one stable non-penalizing semantic system-failure family before SQL.
- Kept the existing PostgreSQL rollback matrix and privacy-safe semantic integrity proof green.

## Review Corrections

- Required the trusted certificate resolver to return and match the complete source identity.
- Wrapped parser/verifier exceptions into the stable persistence system-failure class.
- Proved invalid receipt bytes cause zero pool queries and no transaction start.
- Confirmed persistence imports no runtime-service app authority.

## Verification

- PostgreSQL-backed completion and semantic-integrity suites: 2 files, 13 tests passed.
- Focused v1.18 service/issuer/persistence tests: 10 passed.
- Persistence typecheck and lint passed.
- Protected working-tree baseline remained exact.

## Commit

- `fbf0d61` — admit v1.18 receipts before persistence

## Next Readiness

The evidence ledger and Go verifier can now consume the same two-sided spec claim while preserving independent authority and transactional rollback.
