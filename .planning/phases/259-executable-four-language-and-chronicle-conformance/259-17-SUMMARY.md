---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "17"
subsystem: runtime-service-semantic-admission
tags: [chronicle, reconstruction, ed25519, service, privacy]
status: complete
completed: 2026-07-16
requirements-completed: [CHRN-04, CHRN-05, CONF-05]
---

# Phase 259 Plan 17: Runtime-Service Semantic Admission Summary

The additive v1.18 runtime-service path now emits success only after shared Chronicle validation, exact replay reconstruction, two-sided certificate/source admission, common-supervisor evidence matching, and immediate Ed25519 receipt self-verification.

## Delivered

- Added an issuance-only v1.18 signer boundary that receives only spec-encoded claim bytes.
- Added an additive prepared v1.18 service executor without changing v1.16/v1.17 dispatch.
- Revalidated the Chronicle, completed execution, boundary anchors, terminal state, outcome, and exact transition trace root before success.
- Required distinct bottom/top certificate references, full source identity, authority generation, freshness, record hashes, and common-supervisor evidence roots.
- Returned only public roots, terminal/accounting facts, ownership, and the authenticated receipt; Chronicle and final-state bodies remain private.
- Collapsed malformed, stale, mismatched, unavailable, execution, reconstruction, meter, and signer faults to non-penalizing no-mutation system failures.

## Review Corrections

- Required certificate resolvers to return and match the complete source identity rather than only a record hash.
- Kept raw source, artifacts, memories, objectives, diagnostics, stderr, host poison, and private keys out of failure output.
- Immediately verified the newly issued receipt through the public spec verifier before returning it.

## Verification

- Focused service/spec suites: 4 files, 16 tests passed.
- Joined v1.18 issuer/service/spec suite: 3 files, 12 tests passed.
- Runtime-service typecheck and lint passed.
- Protected working-tree baseline remained exact.

## Commit

- `f924dcb` — gate v1.18 service success on semantic proof

## Next Readiness

Persistence and Go can independently reconstruct and verify the same exact claim without importing runtime-service issuance authority.
