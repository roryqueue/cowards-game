---
phase: 266
slug: content-addressed-current-league-freeze
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-23
---

# Phase 266 — Validation Strategy

> Source-only checks may proceed before Phase 265 closes. A real freeze `--check` and any publication require its complete verified retained league result; synthetic fixtures never substitute for it.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6, TypeScript 6.0.3 |
| Config file | Existing workspace Vitest and `packages/strategy-lab/tsconfig.json` |
| Quick run command | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/freeze.test.ts scripts/lib/v1-38-current-freeze-inventory.test.ts` |
| Full suite command | Quick run plus `scripts/freeze-v1-38-current-league.test.ts`, `pnpm exec tsc -b packages/strategy-lab/tsconfig.json --pretty false`, `pnpm exec tsx scripts/check-v1-38-lab-boundaries.ts`, and `pnpm exec tsx scripts/check-v1-38-serious-league-boundaries.ts` |
| Estimated runtime | Establish from Wave 0; do not claim a feedback-time bound before the tests exist |

## Sampling Rate

- After every source-task commit: run the quick test command once its Wave 0 files exist.
- After every plan wave: run the full Phase 266 source suite, not an empirical league replay.
- Before `$gsd-verify-work`: the full source suite and real read-only retained-evidence checker must pass.
- Max feedback latency: to be measured in Wave 0; a long historical reopener may require a separate, bounded phase-gate command rather than per-task execution.

## Per-Task Verification Map

Task IDs and waves are provisional until Phase 266 PLAN.md files pass the plan checker.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0-freeze | TBD | 0 | FRZE-01, FRZE-04 | leaf substitution, incomplete charge | Changed/missing/conflicting leaf or process-invalid graph rejects; process-valid non-pass preserves honest outcome | unit | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/freeze.test.ts` | ❌ W0 | ⬜ pending |
| W0-absence | TBD | 0 | FRZE-02 | premature materialization | Every forbidden class and naming/identity path canary rejects; prose control passes | unit | `pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-current-freeze-inventory.test.ts` | ❌ W0 | ⬜ pending |
| W0-seal-finalist | TBD | 0 | FRZE-03 | premature opening/promotion | Precursor/final-root join is non-circular; exact-source allowlist and empty-list branch work; preimage is never read | unit | `pnpm exec vitest run --maxWorkers=1 scripts/freeze-v1-38-current-league.test.ts` | ❌ W0 | ⬜ pending |
| real-freeze-gate | TBD | final | FRZE-01–04 | false freeze publication | Complete Phase 265 verified head, actual unopened commitment receipt, all storage scopes, and preliminary finalist proof are required before write | integration | Read-only `freeze-v1-38-current-league --check` on the exact retained roots, then independent publication review | N/A until Phase 265 closes | ⬜ pending |

## Wave 0 Requirements

- [ ] Create source-only freeze graph fixtures and missing/changed/duplicate/unused-charge regressions.
- [ ] Create inventory canaries for repository, generated, private artifact, task/lineage, cache, prompt, trace/replay, and configured storage roots, with policy prose as a negative control.
- [ ] Create fake restricted-store seal-bridge tests and exact-hash finalist-allowlist tests without a real holdout preimage.
- [ ] Measure quick and full feedback times; update provisional task IDs/waves after planning.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Independent interpretation of complete real Phase 265 evidence and freeze claim scope | FRZE-01, FRZE-03, FRZE-04 | Source tests cannot attest actual source/custody completeness or a sealed operator-local store | After Phase 265 retained verification, independently inspect exact manifest and privacy-safe projection, actual unopened commitment/ledger receipt, charged evidence closure, finalist eligibility, and empty-eligibility branch if applicable. Do not query the holdout preimage. |

## Validation Sign-Off

- [ ] Every finalized task has an automated check or explicit Wave 0 dependency.
- [ ] No three consecutive source tasks lack an automated check.
- [ ] Wave 0 covers every currently missing test reference.
- [ ] No watch-mode flags or source-only fixture is represented as empirical proof.
- [ ] Actual quick feedback latency is measured and recorded.
- [ ] `nyquist_compliant: true` is set only after all evidence above is complete.

**Approval:** pending Phase 266 planning and Phase 265 empirical closure.
