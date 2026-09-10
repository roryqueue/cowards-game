---
phase: 263
slug: legal-planner-and-deterministic-runner-feasibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-09-09
---

# Phase 263 — Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Existing Vitest 4.1.6 |
| Config | `vitest.config.ts` |
| Quick command | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/planner/brain.test.ts` (after creation) |
| Full phase command | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab scripts/check-v1-38-lab-boundaries.test.ts` (after creation) |
| Seam regression | `pnpm exec vitest run --maxWorkers=1 packages/engine/src/kernel/kernel-contract.test.ts packages/engine/src/kernel/runtime-ownership.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts` |
| Types | `pnpm --filter @cowards/strategy-lab typecheck` after package creation |
| Runtime | Unmeasured; target under 30 seconds per focused synthetic file |

## Sampling Rate

- After each task commit, run its affected focused tests, not a nonexistent future file.
- After each wave, run all implemented Phase 263 synthetic tests and the relevant canonical/runtime seam regression.
- Before verification, require the full phase suite and the separately bounded actual-source feasibility gate. Synthetic tests alone cannot pass PLAN-06.
- Freeze benchmark corpus, timing region, warmups, samples, nearest-rank p99 calculation, exact runtime profile and charged allocation before measured output. Preserve strictly below 5 ms direct p99 and all admitted per-method limits.
- Record observed feedback latency during implementation. Empirical Match duration is separately bounded and is not routine unit-test latency.

## Per-Task Verification Map

The planner must replace provisional task IDs with actual plan/task IDs and waves without dropping coverage. These test paths are proposed, not existing evidence.

| Task ID | Requirement | Threat Ref | Secure Behavior | Test Type | Automated file or command | Exists | Status |
|---------|-------------|------------|-----------------|-----------|---------------------------|--------|--------|
| pending | PLAN-01 | — | Hard constraints precede soft scores under both initiative hypotheses | unit/property | `packages/strategy-lab/src/planner/assign.test.ts` | Wave 0 | pending |
| pending | PLAN-02 | — | Ten missions have objective/stale/completion/failure/fallback cases | unit | `packages/strategy-lab/src/planner/missions.test.ts` | Wave 0 | pending |
| pending | PLAN-03 | — | Nine Actions, authoritative Advance, reserved fallback and forced tactics | canonical fixtures | `packages/strategy-lab/src/planner/brain.test.ts` | Wave 0 | pending |
| pending | PLAN-04 | information boundary | Identical legal inputs yield identical deployed choices | supervised integration | `packages/strategy-lab/src/planner/information-boundary.test.ts` | Wave 0 | pending |
| pending | PLAN-05 | hostile source | Self-contained source and bounded schemas; no capabilities | unit/supervised | `packages/strategy-lab/src/planner/emission.test.ts` | Wave 0 | pending |
| pending | PLAN-06 | false feasibility | Actual emitted source passes fixed benchmark and tactical/runtime gate | bounded empirical | `scripts/run-v1-38-planner-feasibility.ts` (flags bound in plan) | Wave 0 | pending |
| pending | FACT-01 | production leakage | Production graph and deployment never reach lab | static negative integration | `scripts/check-v1-38-lab-boundaries.test.ts` | Wave 0 | pending |
| pending | FACT-02 | alternate semantics | Canonical effects and three-way failures; complete cleanup | integration | `packages/strategy-lab/src/runtime-bridge.test.ts` | Wave 0 | pending |
| pending | FACT-03 | lost/duplicate work | Task-sorted semantic bytes invariant across worker/shard/order/restart/resume | property/fault injection | `packages/strategy-lab/src/runner-invariance.test.ts` | Wave 0 | pending |
| pending | FACT-04 | artifact tamper | Reject gaps, duplicates, conflicts, truncation, stale IDs and partial publication | unit/fault injection | `packages/strategy-lab/src/shards.test.ts` | Wave 0 | pending |

Run test files above with `pnpm exec vitest run --maxWorkers=1 <file>`. Plans add exact threat identifiers and test commands for every task. Scientific result roots exclude operational timing and physical shard layout; provenance records retain them separately.

## Wave 0 Requirements

- [ ] Create private package and test scripts using existing infrastructure.
- [ ] Create shared canonical state/legal-input fixtures and each missing test file in its owning implementation task.
- [ ] Bind fixed manifest/benchmark/allocation before empirical execution; do not reuse consumed Phase 262 authority or artifacts.
- [ ] Include hostile-input, hidden-state pairs, board-start realism, three-way runtime failure and interruption/cleanup tests.
- [ ] Fix exact commands/task mapping during planning; no watch-mode flags.

## Manual-Only Verifications

All phase behaviors have automated verification. No UI is created or changed; browser replay testing is not a substitute for the private kernel/board realism tests. A real unavailable runtime or failed feasibility gate is recorded honestly; no weaker lane or extra retry is silently substituted.

## Validation Sign-Off

- [ ] Every task has automated verification or explicit preceding Wave 0 dependency.
- [ ] No three consecutive tasks lack automated verification.
- [ ] All missing references are implemented and exercised.
- [ ] Focused latency is measured and acceptable; empirical timebox is separate.
- [ ] Actual-source gate passes under unchanged bounds.
- [ ] `nyquist_compliant: true` only after demonstrated coverage.

**Approval:** Pending checked plans and execution evidence; ordinary implementation proceeds under the user's autonomous milestone authorization.
