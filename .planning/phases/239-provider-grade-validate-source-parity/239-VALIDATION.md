---
phase: 239
slug: provider-grade-validate-source-parity
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-14
---

# Phase 239 Validation Strategy

## Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Vitest, TypeScript |
| Config file | package-local Vitest defaults |
| Quick run command | `pnpm --filter @cowards/spec test -- workshop-checker` |
| Full suite command | `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client` |
| Estimated runtime | ~15 seconds |

## Per-Task Verification Map

| Requirement | Behavior | Automated Command | Evidence | Status |
| --- | --- | --- | --- | --- |
| CHECKVAL-01 | TypeScript remains on provider-grade checker envelope | `pnpm v1.34:workshop-checker` | TypeScript row `ready` | green |
| CHECKVAL-02 | Python Validate uses runtime-service/provider validation | `pnpm --filter @cowards/web test -- app/api/workshop/validate` | Python route test asserts runtime-service call | green |
| CHECKVAL-03 | Rust Validate uses provider/WASI artifact semantics | `pnpm v1.34:workshop-checker` | Rust row `ready`, WASI artifact present | green |
| CHECKVAL-04 | Zig Validate uses provider/WASI artifact semantics | `pnpm v1.34:workshop-checker` | Zig row `ready`, WASI artifact present | green |
| CHECKVAL-05 | No stale, malformed, or unavailable fallback acceptance | `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions` | Identity mismatch and unavailable submit tests | green |

## Manual-Only Verifications

All Phase 239 behaviors have automated verification.

## Validation Sign-Off

- All tasks have automated verification.
- Runtime-service/provider ownership is checked by route tests and boundary monitors.
- Approval: approved 2026-06-14.
