---
phase: 263
slug: legal-planner-and-deterministic-runner-feasibility
status: partial
nyquist_compliant: false
wave_0_complete: true
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

Tests were created in the owning implementation tasks. No consumer plan ran before its declared dependencies. The original per-task command map below is retained as planning history; the executed disposition table in the audit section supersedes its pending status cells. Actual source timing and Match feasibility are not inferred from synthetic tests.

| Task ID | Wave | Requirements | Threat Ref | Automated test paths | Status |
|---|---|---|---|---|---|
| 263-01-1 | 1 | FACT-01, FACT-04 | T-263-01-A | `packages/strategy-lab/src/contracts.test.ts` | pending creation/execution |
| 263-01-2 | 1 | PLAN-06, FACT-04 | T-263-01-A | `packages/strategy-lab/src/feasibility-protocol.test.ts` | pending creation/execution |
| 263-01-3 | 1 | FACT-01 | T-263-01-B | `scripts/check-v1-38-lab-boundaries.test.ts` | pending creation/execution |
| 263-02-1 | 2 | PLAN-02 | T-263-02-A | `packages/strategy-lab/src/planner/missions.test.ts` | pending creation/execution |
| 263-02-2 | 2 | PLAN-01 | T-263-02-B | `packages/strategy-lab/src/planner/assign.test.ts` | pending creation/execution |
| 263-03-1 | 3 | PLAN-03 | T-263-03-B/C | `packages/strategy-lab/src/planner/brain.test.ts` | pending creation/execution |
| 263-03-2 | 3 | PLAN-04, PLAN-05 | T-263-03-A | `packages/strategy-lab/src/planner/emission.test.ts` | pending creation/execution |
| 263-04-1 | 2 | FACT-02 | T-263-04-A | `packages/strategy-lab/src/runtime-bridge.test.ts` | pending creation/execution |
| 263-04-2 | 2 | PLAN-04, PLAN-06 | T-263-04-B/C/D | `scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts` — selected-v1.19 roundtrip/profile mismatch and owned timing channel | pending creation/execution |
| 263-04-3 | 2 | PLAN-06 | T-263-04-C | `packages/strategy-lab/src/benchmark.test.ts packages/runtime-js/src/planner-benchmark-observer.test.ts` — private method observer and nearest-rank reducer | pending creation/execution |
| 263-05-1 | 2 | FACT-03, FACT-04 | T-263-05-B | `packages/strategy-lab/src/tasks.test.ts` | pending creation/execution |
| 263-05-2 | 2 | FACT-04 | T-263-05-A/B | `packages/strategy-lab/src/shards.test.ts` | pending creation/execution |
| 263-05-3 | 2 | FACT-03 | T-263-05-C | `packages/strategy-lab/src/runner-invariance.test.ts` | pending creation/execution |
| 263-06-1 | 4 | PLAN-04, PLAN-05, FACT-03 | T-263-06-A/B | `scripts/run-v1-38-planner-feasibility.test.ts packages/strategy-lab/src/planner/information-boundary.test.ts` | pending creation/execution |
| 263-06-2 | 4 | All phase IDs | T-263-06-B | Full phase suite in263-06-PLAN.md Task2; independent review in263-REVIEW.md | pending |
| 263-06-3 | 4 | PLAN-06, FACT-02/03/04 | T-263-06-A/B/C | `pnpm exec tsx scripts/run-v1-38-planner-feasibility.ts --verify --manifest .planning/phases/263-legal-planner-and-deterministic-runner-feasibility/263-feasibility-manifest.json --output .strategy-lab/phase263-feasibility` | pending actual-source run |
| 263-07-1 | 5 | All10 phase IDs | T-263-07-A/B | Full phase plus seam regression command in263-07-PLAN.md Task1 | pending independent verifier |
| 263-07-2 | 5 | All10 phase IDs | T-263-07-A/B | `pnpm --filter @cowards/strategy-lab typecheck`; evidence review in263-UAT.md | pending |

### Fixed empirical boundaries

-2200 benchmark calls (100 warmups +1000 measured per method),256 pre-enumerated supervised validation calls,24 Match attempts; zero retries.
- Canonical maxPhases100,24800 maximum method calls/Match,597656 maximum total invocations including validation/benchmark; tighter selected runtime cumulative limits remain authoritative.
-120000ms/Match and3600000ms complete run including build/validation/benchmark/startup/cleanup. Source-only development is separate and never measured feasibility.
-12 label tasks/pass but8 scientific geometry/side/initiative cells. Alias checks are charged and excluded from payoff/unique-cell denominator.
- Actual variants:1worker/shard1/forward with safe restart after6 complete tasks;2workers/shard3/reverse plus completed-inventory resume. No launched interrupted work is silently rerun.
- Synthetic Cartesian matrix: workers1/2 × shards1/3 × order forward/reverse/fixed-permutation × continuous/restart-after-publication/resume-complete; faults include lost worker and ambiguous publication.
- Full private trace retention for24 attempts; fixed8 geometry-distinct baseline starts plus every failure are reviewed. Source timing and physical shards remain operational metadata.

## Wave 0 Requirements

- [x] Create private package and test scripts using existing infrastructure.
- [x] Create shared canonical state/legal-input fixtures and each missing test file in its owning implementation task.
- [x] Bind fixed manifest/benchmark/allocation before empirical execution; do not reuse consumed Phase 262 authority or artifacts.
- [x] Include hostile-input, hidden-state pairs, board-start realism, three-way runtime failure and interruption/cleanup tests.
- [x] Fix exact commands/task mapping during planning; no watch-mode flags.

## Manual-Only Verifications

All phase behaviors have automated verification. No UI is created or changed; browser replay testing is not a substitute for the private kernel/board realism tests. A real unavailable runtime or failed feasibility gate is recorded honestly; no weaker lane or extra retry is silently substituted.

## Validation Sign-Off

- [ ] Every task has automated verification or explicit preceding Wave 0 dependency.
- [ ] No three consecutive tasks lack automated verification.
- [ ] All missing references are implemented and exercised.
- [ ] Focused latency is measured and acceptable; empirical timebox is separate.
- [ ] Actual-source gate passes under unchanged bounds.
- [ ] `nyquist_compliant: true` only after demonstrated coverage.

**Disposition:** Partial, not a phase pass. The actual selection timing gate failed; downstream Match evidence is blocked. Routine repair is authorized, but the consumed no-retry run cannot be reused.

## Validation Audit — 2026-09-10

| Task | Executed evidence | Current status |
|---|---|---|
| 263-01-1 | Contracts/schema tests | Passed synthetic |
| 263-01-2 | Frozen protocol/corpus/allocation tests | Passed synthetic |
| 263-01-3 | Isolation/boundary monitor and negative imports | Passed static |
| 263-02-1 | Ten mission lifecycle tests | Passed pure fixtures |
| 263-02-2 | Lexicographic assignment/budget/tie-break tests | Passed pure fixtures |
| 263-03-1 | Canonical tactic/Advance/fallback brain tests | Passed pure fixtures |
| 263-03-2 | Static emission/schema/source-size tests | Passed static; actual validation also passed |
| 263-04-1 | Kernel/provider three-way failure tests | Passed injected; actual Match equivalence pending |
| 263-04-2 | Selected supervisor and injected lifecycle/cleanup tests | Passed injected; real validation/benchmark calls completed |
| 263-04-3 | Observer binding and percentile tests | Passed synthetic; real selection timing failed |
| 263-05-1 | Stable tasks/alias/scientific denominator tests | Passed synthetic |
| 263-05-2 | Immutable shards/retained failure/charge/resume tests | Passed synthetic |
| 263-05-3 | 36worker/shard/order/restart variants and faults | Passed real workers with trusted synthetic jobs; not real Matches |
| 263-06-1 | CLI/information/lifecycle/retained ledger regression | Passed8 CLI tests plus package information tests |
| 263-06-2 | Independent full-source review | Clean before measurement; see subsequent terminal reporting limitations |
| 263-06-3 | Sole frozen actual run and read-only verify | Terminal non-pass: selection64.135270ms; brain2.349449ms;0Matches |
| 263-07-1 | Independent goal-backward source/evidence review | See263-VERIFICATION.md; gaps remain |
| 263-07-2 | Private operator UAT and coverage records | Recorded truthfully;3pass/1issue/2blocked |

Final pre-run command used installed local Vitest with `--maxWorkers=1` for `packages/strategy-lab`, the boundary monitor, selected supervised host, observer, executable closure and canonical kernel contract/ownership tests:181/181 passed across19files in223.60seconds. CLI8/8 passed in72.99seconds. Selected static/injected historical session cases7/7 passed in2.58seconds;53 unrelated historical cases were deliberately excluded because some execute guest source. Total196 safe tests, strict standalone CLI/test TypeScript and package build passed. Focused feedback can exceed the original30-second target for closure rebuilding; the full Cartesian worker matrix is deliberately slow and separately identified.

Actual validation consumed256case slots, including232guest calls and24expected pre-runtime rejections. All2200benchmark calls completed. No invocation is retried or reclassified into a new allocation. The sole empirical run lasted8.62minutes and retained13,784,794private bytes. Read-only `--verify` returned non_pass with zero execution. There are no Match traces;8baseline realism inspections,24-Match invariance and complete scientific reduction remain blocked, not manual waivers.

Nyquist remains false because the hard actual-source requirement fails and dependent empirical requirements are incomplete. Adding more synthetic tests cannot satisfy the missing real gate. See263-FEASIBILITY.md for exact roots and cleanup-summary nuance; immutable receipts are preserved. No source edits or extra measurement were made during this validation audit.
