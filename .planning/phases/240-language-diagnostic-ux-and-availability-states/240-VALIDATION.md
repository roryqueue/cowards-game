---
phase: 240
slug: language-diagnostic-ux-and-availability-states
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-14
---

# Phase 240 Validation Strategy

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
| CHECKDIAG-01 | Python policy/import/package categories | `pnpm --filter @cowards/spec test -- workshop-checker` | category mapping tests | green |
| CHECKDIAG-02 | Rust compile/toolchain/provenance categories | `pnpm --filter @cowards/spec test -- workshop-checker` | toolchain category tests | green |
| CHECKDIAG-03 | Zig no-std/helper/toolchain categories | `pnpm --filter @cowards/spec test -- workshop-checker` | no-std/helper category tests | green |
| CHECKDIAG-04 | Calm unavailable states | `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions` | unavailable route tests | green |
| CHECKDIAG-05 | Public-safe diagnostics | `pnpm exec vitest run scripts/evaluate-v1-34-workshop-checker.test.ts --reporter=dot` | privacy scanner passes | green |

## Manual-Only Verifications

All Phase 240 behaviors have automated verification or code-level UI assertions.

## Validation Sign-Off

- Diagnostic categories are centralized in `packages/spec/src/workshop-checker.ts`.
- Public output privacy is covered by contract tests and the service-backed proof scanner.
- Approval: approved 2026-06-14.
