---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "30"
subsystem: public-spec-contract
tags: [spec, public-api, receipts, certificates]
status: complete
completed: 2026-07-16
requirements-completed: [CONF-04, CONF-05, CHRN-04, CHRN-05]
---

# Phase 259 Plan 30: Public v1.18 Spec Contract Summary

The conformance certificate and additive v1.18 execution-service and semantic-receipt APIs are now available only through the public `@cowards/spec` entry point.

## Delivered

- Exported the pure v1.17 conformance-certificate contract.
- Exported the additive v1.18 service request/response and two-sided certificate-reference contract.
- Exported the spec-owned v1.18 canonical encoder, strict parser, safe projection, and Ed25519 verifier.
- Added the certificate, v1.18 service, and v1.18 receipt suites to the spec package's explicit normal test command without removing any prior suite.
- Confirmed production runtime-service, persistence, and runtime-package sources do not import `@cowards/spec/src` or relative spec source paths.

## Verification

- Explicit spec suite: 18 files, 326 tests passed.
- Root-owned supporting spec scripts: 3 files, 35 tests passed.
- Spec build and lint passed.
- Production-source public-boundary scan passed.
- The broad literal scan also found one pre-existing persistence test importing a JSON fixture by relative repository path; it is test-only evidence, not a production contract bypass.

## Commit

- `ed11625` — publish v1.18 receipt contract

## Next Readiness

Runtime-service, persistence, and Go verification plans can now consume one buildable public contract without importing implementation source or reimplementing Chronicle semantics.
