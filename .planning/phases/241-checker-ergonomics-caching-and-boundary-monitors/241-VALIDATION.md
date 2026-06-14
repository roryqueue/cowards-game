---
phase: 241
slug: checker-ergonomics-caching-and-boundary-monitors
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-14
---

# Phase 241 Validation Strategy

## Test Infrastructure

| Property | Value |
| --- | --- |
| Framework | Vitest, TypeScript |
| Config file | package-local Vitest defaults |
| Quick run command | `pnpm --filter @cowards/web test -- app/api/workshop/validate workshop-client` |
| Full suite command | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts --reporter=dot` |
| Estimated runtime | ~15 seconds |

## Per-Task Verification Map

| Requirement | Behavior | Automated Command | Evidence | Status |
| --- | --- | --- | --- | --- |
| CHECKERG-01 | Rust/Zig validation coalesces/caches calls | `pnpm --filter @cowards/web test -- app/api/workshop/validate` | in-flight coalescing test | green |
| CHECKERG-02 | Cache keys include identity/policy | `pnpm --filter @cowards/web test -- app/api/workshop/validate` | stale identity rejection and cache key route code | green |
| CHECKERG-03 | UI states distinct, TinyGo absent | `pnpm --filter @cowards/web test -- workshop-client` | checker state and submit gate tests | green |
| CHECKERG-04 | Boundary remains runtime-service/provider | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts --reporter=dot` | checker_contract monitor | green |

## Manual-Only Verifications

Visual screenshot confirmation is covered later by browser inspection. Code-level UI review was run and priority findings were fixed.

## Validation Sign-Off

- Stale/checking/current checker states are explicitly tested.
- Boundary monitor includes v1.34 checker contract.
- Approval: approved 2026-06-14.
