---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-v6-source-first
validation_type: source_only_behavioral_coverage_audit
source_commit: 03ed458a9466b780d751dae0ed4e168b797bf529
command: node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1
result: 148_passed_0_failed_0_skipped
requirements_completed: []
requirementsComplete: false
empirical_credit: false
phase_complete: false
---

# Plan 265-16 replay-v6 source validation

**Disposition:** The requested v6 behavioral coverage ran successfully: 148/148 tests passed (v6 and unchanged v5 suites). This validates synthetic source behavior only. It is not native capacity/feasibility evidence, empirical execution, LEAG credit, or whole-Phase completion. No implementation files were changed.

## Coverage findings

| Plan behavior | Behavioral evidence | Result |
|---|---|---|
| Exact full allocation admission before v6 validation-only selection | `run-v1-38-lean-replay-validation-v6.test.ts`: actual `verifyLeanEvidence` on synthetic diagnostic and baseline allocations; forged caps, approval, supplement, policy, allocation root, slot selection and extra-key cases assert rejection before any inflate. Unsupported/mislabeled schemas also reject before inflate. | FILLED |
| Replay/publication joins and readback | Synthetic diagnostic reused-source and baseline new-source flows call the real publication/readback consumers; exact snapshot bytes are preserved; foreign HEAD/publication proof and foreign allocation/source identity reject. | FILLED |
| Real startup capability claims and exact v5 compatibility | Tests issue authority through the real issuer, claim factory → planner → session in order, check v6 descriptor and unchanged v5 policy/lifetime/receipt bounds, and reject wrong layer/reuse. Generic factory/planner scalar startup authority is refused. Broker round-trip compares generated v6 bytes to v5 after only wire-label normalization. No provider is constructed or invoked. | FILLED, synthetic capability boundary only |
| v1–v5 decoder compatibility | v6 suite tests default/legacy v0–v4 full-text decoder behavior and exact output; v5 suite runs its explicit validator/legacy controls. Structural selector assertions ensure admission precedes the v6 validator and preserve explicit v5 branches. | FILLED |
| Bounds, finite predecessor, zero-charge empty-ledger custody | Synthetic route/path disjointness and caps are asserted. Exact named predecessor roots, 24 prior charges, closed elapsed time/reader close, empty ledger and inactive state are accepted; null substitutions and a stopped marker reject. No old reader is invoked. | FILLED |
| One-open setup witness and interrupted-gap rejection | Rehashed extra segment, closed sole segment, closed-plus-one-hour gap, and near-cap erasure witnesses reject. Exact one-open witness charges every current-turn millisecond; 43,199,999 ms is accepted and 43,200,000 ms rejected. | FILLED |
| Conservative effective reader close | Synthetic 1 ns monotonic lead with equal rounded wall time is admitted using conservative close/gap; foreign allocation identity rejects. | FILLED |
| Late malformed replay frame | Fully rehashed malformed final frame in both routes rejects after first valid frame is visited. Baseline missing sample/failure replay, unexpected unselected replay, and charge-without-terminal also reject without unintended inflate. | FILLED |

## Actual test execution

```text
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1
Test Files  2 passed (2)
Tests       148 passed (148)
Duration    9.42s
```

No gap required a test repair or implementation escalation. The suite's explicit synthetic-only guards deny child-process and Worker creation; fixtures are temporary synthetic ledger/replay data. This audit ran no helper, provider, Strategy, Match, real/historical replay reader, or real gzip payload.

## Limits and phase status

These tests do not show RSS feasibility: decompression remains full-buffer, and mocked memory samples only test guard arithmetic/order. They do not show that a 36-Match run fits the carried remaining time, bytes, or charges. The independent source review is clean, but source verification remains a separate pending gate. Per plan authority, do not proceed to new data/helper/allocation/entry until ordered independent source verification also passes. Phase 265 remains incomplete and LEAG-01–09 remain uncredited; no freeze, formation, holdout, public, counted, or production credit is claimed.

**Files created:** this validation report only.
