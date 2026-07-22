---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "15"
subsystem: runtime-service-receipt-contract
tags: [spec, ed25519, chronicle, conformance, go]
status: complete
completed: 2026-07-16
requirements-completed: [CONF-04, CONF-05, CHRN-04, CHRN-05]
---

# Phase 259 Plan 15: Additive v1.18 Service Receipt Summary

The repository now has one strict additive v1.18 service and semantic-receipt contract that binds Chronicle reconstruction, final semantic anchors, accounting, and distinct bottom/top conformance certificates without rewriting v1.16 or v1.17 evidence.

## Delivered

- Added closed v1.18 request, success, system-failure, semantic-admission, certificate-reference, and source-identity schemas.
- Required separate bottom and top certificate references, exact authority generation, freshness, lane, record hash, identity manifest, evidence graph, source hashes, and side binding.
- Added spec-owned canonical claim encoding, strict byte parsing, deep-frozen receipt admission, privacy-safe public projection, and pure Ed25519 verification.
- Rejected singular certificates, duplicate or swapped references, side/source mismatch, stale evidence, noncanonical identifiers/base64, cross-version input, extra fields, private material, and result/ownership/no-mutation inconsistency.
- Extended the sole TypeScript-to-Go generator with exact disjoint v1.18 request/response/receipt vectors and generated Go contract tables.
- Preserved exact v1.16 and v1.17 source, artifact, domain, and fixture hashes.

## Review Remediation

Final self-review found two trust gaps and closed both:

1. Certificate source identity is now explicitly bound to `bottom` or `top`, so a fully rehashed certificate cannot be moved across sides.
2. Ed25519 signatures must use the one canonical base64 spelling of exactly 64 bytes; alternate encodings cannot preserve an accepted semantic value with different wire bytes.

Parsed receipts are deep-frozen before being returned to callers.

## Verification

- Focused spec and generator suite: 4 files, 33 tests passed.
- Exact `--write-v1.18-service --check` generation passed while reporting immutable v1.16 hashes.
- Spec typecheck and lint passed.
- Focused Prettier and `git diff --check` passed.
- Database-backed Go suite passed with `COWARDS_GO_BACKEND_TEST_DATABASE_URL`: `go test ./... -count=1`.
- No public spec export was added; Plan 259-30 owns public publication.
- Protected planning/specification files were not modified.

## Commits

- `5e4acab` — define strict v1.18 service contract
- `909a50a` — add two-sided v1.18 service contract
- `c2a2096` — define spec-owned receipt verification
- `bbef2b2` — own Ed25519 receipt verification in spec
- `c120df8` — require additive TypeScript/Go vectors
- `a7a3587` — generate v1.18 TypeScript/Go vectors
- `7b91b69` — bind receipt sides and canonical signatures

## Deviations

The plan-local Go command requires the repository's mandatory PostgreSQL test URL. The initial environment-free run failed closed as designed; the exact database-backed rerun passed. No product change was needed.

## Next Readiness

Plan 259-30 may publish these modules through the sole public `@cowards/spec` entry point. Plans 259-17, 259-18, and 259-20 can then consume the same authenticated claim without implementing Chronicle semantics independently.
