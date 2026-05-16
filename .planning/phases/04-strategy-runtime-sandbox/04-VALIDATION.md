---
phase: 4
slug: strategy-runtime-sandbox
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-16
---

# Phase 4 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm --filter @cowards/runtime-js test` |
| Full suite command | `pnpm verify` |
| Estimated runtime | ~60 seconds |

## Sampling Rate

- After every task commit: run the package-level test named in the plan task.
- After every wave: run `pnpm verify`.
- Before `$gsd-verify-work`: full suite must be green.
- Max feedback latency: 90 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 04-01 | 1 | RUN-01, RUN-02 | T-04-01 | Strategy Revision contracts validate immutable source/hash/version metadata | schema | `pnpm --filter @cowards/spec test -- spec.test.ts` | pending | pending |
| 04-01-02 | 04-01 | 1 | RUN-01, RUN-02, RUN-05 | T-04-02 | Runtime validation report records source bytes, compatibility, errors, warnings, and forbidden patterns | unit | `pnpm --filter @cowards/runtime-js test -- validation.test.ts revision.test.ts` | pending | pending |
| 04-02-01 | 04-02 | 2 | RUN-01, RUN-02, RUN-05, RUN-08 | T-04-03 | Static validation rejects forbidden source capabilities before execution | unit | `pnpm --filter @cowards/runtime-js test -- validation.test.ts` | pending | pending |
| 04-02-02 | 04-02 | 2 | RUN-01, RUN-03, RUN-04 | T-04-04 | Transpiled default strategy object exposes synchronous methods only | unit | `pnpm --filter @cowards/runtime-js test -- transpile.test.ts` | pending | pending |
| 04-03-01 | 04-03 | 3 | RUN-03, RUN-04, RUN-05, RUN-06, RUN-07, RUN-08 | T-04-05 | Worker-only runtime maps success and all failure types to `RuntimeResult` without partial memory updates | unit | `pnpm --filter @cowards/runtime-js test -- executor.test.ts` | pending | pending |
| 04-03-02 | 04-03 | 3 | RUN-09, RUN-10 | T-04-06 | Executable runtime entrypoint is worker-only and replaceable behind `StrategyRuntime` | boundary | `pnpm lint` | pending | pending |
| 04-04-01 | 04-04 | 4 | RUN-03, RUN-04, RUN-06, RUN-07, TEST-04 | T-04-07 | Engine and Chronicle integration records public violation markers and owner-only raw details | integration | `pnpm --filter @cowards/runtime-js test -- integration.test.ts` | pending | pending |
| 04-04-02 | 04-04 | 4 | RUN-01 through RUN-10, TEST-04 | T-04-08 | Runtime package exports, docs, and full verification prove Phase 4 coverage | full | `pnpm verify` | pending | pending |

## Wave 0 Requirements

- [ ] `packages/spec/src/spec.test.ts` covers Strategy Revision schema exports.
- [ ] `packages/runtime-js/src/validation.test.ts` covers source limits and forbidden source patterns.
- [ ] `packages/runtime-js/src/revision.test.ts` covers immutable artifacts and content-derived IDs.
- [ ] `packages/runtime-js/src/transpile.test.ts` covers TypeScript transpilation and default object authoring shape.
- [ ] `packages/runtime-js/src/executor.test.ts` covers valid output, invalid output, timeout, thrown exception, forbidden capability, and memory/objective limits.
- [ ] `packages/runtime-js/src/integration.test.ts` covers engine/Chronicle violation behavior.
- [ ] `pnpm lint` covers executable runtime import boundaries.

## Validation Sign-Off

- [ ] All plans include automated verification commands.
- [ ] Sampling continuity: no wave lacks package-level tests.
- [ ] Validation covers RUN-01 through RUN-10 plus TEST-04.
- [ ] No watch-mode flags.
- [ ] `nyquist_compliant: true` set in frontmatter.
