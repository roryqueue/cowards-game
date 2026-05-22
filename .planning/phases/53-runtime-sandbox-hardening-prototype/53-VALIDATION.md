---
phase: 53
slug: runtime-sandbox-hardening-prototype
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-22
last_verified: 2026-05-22T17:54:00-04:00
---

# Phase 53 — Validation Strategy

## Test Infrastructure

| Property | Value |
|---|---|
| Framework | Vitest for runtime harness checks; TypeScript script for deterministic artifact generation |
| Quick run command | `pnpm sandbox:evaluate:check` |
| Full phase command | `pnpm sandbox:evaluate && pnpm sandbox:evaluate:check && pnpm --filter @cowards/runtime-js test && pnpm typecheck` |

## Per-Task Verification Map

| Task | Requirement | Automated Command | Status |
|---|---|---|---|
| Candidate and probe model | SBX-01, SBX-02, SBX-03, SBX-04, SBX-05, SBX-06 | `pnpm --filter @cowards/runtime-js test` | pass — 180 runtime-js tests passed, including exact taxonomy, invalid-output normalization, optional candidate execution, probe coverage, and no-promotion checks |
| Evaluation command and artifact | SBX-01, SBX-02, SBX-03, SBX-04, SBX-05 | `pnpm sandbox:evaluate && pnpm sandbox:evaluate:check` | pass — deterministic public-safe artifact generated and stale check passed |
| Drift guards and no-promotion docs | SBX-04, SBX-05, SBX-06 | `pnpm --filter @cowards/runtime-js test && pnpm typecheck` | pass — worker default/text import guard passed and 12 package typechecks passed |

## Additional Verification

| Command | Result |
|---|---|
| `pnpm exec prettier --check package.json scripts/evaluate-runtime-sandbox.ts packages/runtime-js/src/sandbox-evaluation.ts packages/runtime-js/src/sandbox-evaluation.test.ts packages/runtime-js/src/worker-harness.ts packages/runtime-js/src/subprocess-harness.ts packages/runtime-js/src/subprocess-adapter.ts packages/runtime-js/src/subprocess-ipc.ts` | pass |

## Validation Sign-Off

- [x] Harness runs through `StrategyExecutionAdapter`, not counted Match execution.
- [x] Public output omits Strategy source, memory, objectives, host paths, env values, and private runtime internals.
- [x] Worker defaults and counted eligibility remain unchanged.
- [x] Candidate matrix records executable, skipped, and tradeoff-only candidates.
- [x] v1.8 no-promotion decision is explicit.
- [x] Worker-thread and host subprocess executable candidates pass all 21 hostile probes with exact runtime/system taxonomy.
