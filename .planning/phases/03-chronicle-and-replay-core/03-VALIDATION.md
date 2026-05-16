---
phase: 3
slug: chronicle-and-replay-core
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-16
---

# Phase 3 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm --filter @cowards/replay test` |
| Full suite command | `pnpm verify` |
| Estimated runtime | ~45 seconds |

## Sampling Rate

- After every task commit: run the package-level test named in the plan task.
- After every wave: run `pnpm verify`.
- Before `$gsd-verify-work`: full suite must be green.
- Max feedback latency: 90 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 03-01 | 1 | REPLAY-02, REPLAY-04, REPLAY-05, REPLAY-06, REPLAY-07 | T-03-01 | Canonical Chronicle contracts separate public and private surfaces | schema | `pnpm --filter @cowards/spec test -- spec.test.ts` | green | green |
| 03-01-02 | 03-01 | 1 | REPLAY-05 | T-03-02 | Validation errors are typed and version-aware | schema | `pnpm --filter @cowards/spec typecheck` | green | green |
| 03-02-01 | 03-02 | 2 | REPLAY-01, REPLAY-02, REPLAY-03, REPLAY-07 | T-03-03 | Engine summaries expose deterministic private payload candidates without mutating `GameState` | unit | `pnpm --filter @cowards/engine test -- activation.test.ts match.test.ts` | green | green |
| 03-02-02 | 03-02 | 2 | REPLAY-01, REPLAY-02, REPLAY-04 | T-03-04 | Chronicle builder records required events and boundary snapshots | unit | `pnpm --filter @cowards/replay test -- build.test.ts` | green | green |
| 03-03-01 | 03-03 | 3 | REPLAY-03, REPLAY-04, REPLAY-05, TEST-03 | T-03-05 | Replay reconstructs from Chronicle data and fails clearly on corruption | unit | `pnpm --filter @cowards/replay test -- reconstruct.test.ts validate.test.ts` | green | green |
| 03-04-01 | 03-04 | 4 | REPLAY-06, REPLAY-07 | T-03-06 | Public projection strips private grids, objectives, memory, and raw runtime details | unit | `pnpm --filter @cowards/replay test -- project.test.ts` | green | green |
| 03-05-01 | 03-05 | 5 | REPLAY-01, REPLAY-05, TEST-03 | T-03-07 | Normalized Chronicles and content hashes are deterministic | full | `pnpm --filter @cowards/replay test -- determinism.test.ts integrity.test.ts` | green | green |
| 03-05-02 | 03-05 | 5 | REPLAY-01 through REPLAY-07, TEST-03 | T-03-09 | End-to-end replay APIs build, validate, hash, reconstruct, iterate, and project one deterministic Match | integration | `pnpm --filter @cowards/replay test -- integration.test.ts` | green | green |
| 03-05-03 | 03-05 | 5 | REPLAY-01 through REPLAY-07, TEST-03 | T-03-11 | Replay package API exports and documentation are complete after full verification | full | `pnpm verify` | green | green |

## Wave 0 Requirements

- [x] `packages/spec/src/spec.test.ts` covers Chronicle schema exports.
- [x] `packages/replay/src/build.test.ts` covers required event set and boundary snapshots.
- [x] `packages/replay/src/reconstruct.test.ts` covers `stateAt(sequence)` and linear iterator.
- [x] `packages/replay/src/project.test.ts` covers public and owner privacy.
- [x] `packages/replay/src/determinism.test.ts` covers semantically identical normalized Chronicles.
- [x] `packages/replay/src/integrity.test.ts` covers typed corruption and version errors.

## Validation Sign-Off

- [x] All plans include automated verification commands.
- [x] Sampling continuity: no wave lacks package-level tests.
- [x] Validation covers all REPLAY-01 through REPLAY-07 plus TEST-03.
- [x] No watch-mode flags.
- [x] `nyquist_compliant: true` set in frontmatter.
