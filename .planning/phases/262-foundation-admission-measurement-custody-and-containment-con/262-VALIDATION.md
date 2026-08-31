---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: partial
nyquist_compliant: true
coverage_state: complete
empirical_state: blocked
wave_0_complete: true
created: 2026-07-28
last_audited: 2026-08-28
---

# Phase 262 — Validation Strategy

## Disposition

Phase 262 is **Nyquist-compliant but empirically incomplete**. Automated behavioral coverage exists for every active Phase 262 requirement and task family, including the exact pass-only ADMIT-03 boundary. That coverage must not be confused with satisfaction: the independently reconstructed bounded retry ended `exhausted` at fresh `0/540`, reproduction-v16 is absent, ADMIT-03 remains blocked, Phase 262 remains incomplete, and Phase 263 remains denied.

The current additive correction is `v1.38-phase-262-review-fix-correction-v10` at correction root `sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3`. It preserves the explicit assurance boundary `single_operator_local_seal_v1_no_hostile_same_uid`; it does not claim hostile-same-UID resistance, independent custody, or pathname-launch replacement resistance.

## Test Infrastructure

| Layer | Framework / mechanism | Canonical command pattern |
|---|---|---|
| TypeScript behavioral tests | Vitest 4.1.6, fork pool, one worker | `pnpm exec vitest run <files> --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=900000 --hookTimeout=900000 --bail=1` |
| Source and artifact checks | `tsx` closed-schema CLIs | `pnpm exec tsx <checker> --check` |
| Native boundary checks | clang C11 warnings-as-errors | `clang -std=c11 -Wall -Wextra -Werror <source> -o <private-output>` |
| Repository topology | Git object, blob, history, and clean-tree checks | Plan-local exact commands; no mutable prose is accepted as authority |

## Complete Active Plan and Task Map

All 70 active plans and all 70 committed summaries were read and cross-referenced. Their 160 explicit tasks contain 208 automated verification blocks. Plans 262-67 and 262-68 use a historical human checkpoint plus downstream byte/root tamper tests; the checkpoint is not treated as live authorization, and its machine-verifiable denial semantics remain covered.

| Active plans | Plans | Tasks | Verify blocks | Coverage |
|---|---:|---:|---:|---|
| 01, 02, 08–31 | 26 | 65 | 91 | covered — foundation admission, historical matrix, runtime/resource/accounting, stopped-route and immutable-history behavior |
| 32–39, 42, 44, 45, 49, 51–54 | 16 | 37 | 44 | covered — dependency revision, measurement, classifiers, containment, local seal, terminal/defer and non-authorization behavior |
| 60, 61, 63–73 | 13 | 28 | 31 | covered — replacement/reviewer chains, exact topology, route-8 source/review/obstruction and lifecycle denial |
| 75–89 | 15 | 30 | 42 | covered — bounded retry v1/v2, corrected source review, seal/envelope, live terminal, independent disposition and lifecycle-v2 |
| **Total** | **70** | **160** | **208** | **covered** |

## Requirement Coverage

| Requirement | Nyquist coverage | Empirical / lifecycle result |
|---|---|---|
| ADMIT-01 | COVERED | satisfied; exact v1.37 audit/archive/tag/post-tag join retained |
| ADMIT-02 | COVERED | satisfied; selected semantic/runtime/research identities retained |
| ADMIT-03 | COVERED | **BLOCKED / UNSATISFIED**; fresh accepted `0/540`, reproduction-v16 absent |
| ADMIT-04 | COVERED | satisfied; stale, mismatched, contaminated, or drifting authority fails closed |
| MEAS-01…MEAS-10 | COVERED | satisfied; frozen estimand, budgets, accounting, report semantics, and local-seal contract retained |
| SEAL-01 | COVERED | satisfied only at `single_operator_local_seal_v1_no_hostile_same_uid`; no stronger custody or concurrency claim |
| DECI-02 | COVERED | satisfied; profile-neutral classifiers and formation-absence boundary retained |

## Current Evidence and Denials

| Check | Observed result |
|---|---|
| Active topology | 70 plans / 70 summaries |
| Bounded retry disposition | `non_pass` / `exhausted` |
| Fresh accepted | `0/540` |
| Calibration accounting | 24 charged identities, 3 route starts, 3 preflight observations |
| Reproduction-v16 | absent |
| Route-10 / foundation activation | absent |
| Phase 262 | incomplete; `gaps_found` |
| Phase 263 planning/execution | denied |
| Candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag authority | all false |

## Exact Verification Commands and Results

| Command | Result |
|---|---|
| `pnpm exec tsx scripts/check-v1-38-phase-262-review-fix-correction-v10.ts --check` | green; `review_fix_correction_v10_valid=true` |
| `pnpm exec vitest run scripts/lib/v1-38-private-native-bootstrap-v2.test.ts scripts/lib/v1-38-secure-workspace-path-v6.test.ts scripts/run-v1-38-phase-262-historical-correction-checkouts-v4.test.ts scripts/check-v1-38-phase-262-review-fix-correction-v10.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=900000 --hookTimeout=900000 --bail=1` | green; 4 files, 62/62 tests |
| `clang -std=c11 -Wall -Wextra -Werror scripts/native/v1-38-successor-transaction-helper-v6.c -o /tmp/v138-successor-validation-v6` | green |
| `clang -std=c11 -Wall -Wextra -Werror scripts/native/v1-38-secure-manifest-reader-v6.c -o /tmp/v138-reader-validation-v6` | green |
| `pnpm exec vitest run scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts -t 'lifecycle' --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --hookTimeout=180000 --bail=1` | green; 4 repaired lifecycle tests passed, 72 unrelated tests skipped |

The clean deep code review at `262-REVIEW.md` records 0 critical, 0 warning, and 0 informational findings across correction-v10, historical-v5, controller-v6, secure reader-v6, their tests, both native helpers, and package entry points.

## Nyquist Gap Repair

One real validation gap was found. The Plan 262-61 historical lifecycle suite invoked its frozen 48-plan reviewer against the current 70-plan repository. That made the positive case fail and could let later mutation cases pass for the wrong pre-existing reason. The test now creates a disposable clone at exact lifecycle baseline commit `3a63735a603e85a605ce8ce2e82f1dbb0a78873d` before testing the 48-plan graph and its mutation denials. No implementation or protected evidence changed.

The first broad post-repair invocation of all 76 Plan 262-61 reviewer tests remained healthy and continued producing short-lived Git children but did not terminate within the 15-minute validation threshold; it was stopped with exit 130 and no failure output. The gap-specific four-test lifecycle run then completed green in 39.52 seconds. The broad run is not represented as passing.

## Manual-Only

None for Nyquist coverage. ADMIT-03 is not manual-only: its behavior and pass-only gate are automated, but its required empirical outcome did not occur. Re-running or extending the exhausted envelope would be new authority and is outside this validation audit.

## Validation Audit 2026-08-28

| Metric | Count |
|---|---:|
| Active plans read | 70 |
| Active summaries read | 70 |
| Explicit tasks mapped | 160 |
| Automated verify blocks mapped | 208 |
| Requirement IDs covered | 16/16 |
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

## Sign-Off

### Additive live-v14 dependency repair (2026-08-31; planned, not executed)

The original audit above remains historical proof. New144 source-only at Wave108 must create scripts/run-v1-38-bounded-retry-envelope-v3-live-v14.test.ts before GREEN; open143 at109 must extend its existing RED test to independently measure actual144, separately from historical142/133. Cheap named pure-predicate/current-subject/stage/AST tests target under60 seconds; full private-runtime/two-root/six-mode suites are heavyweight and run once on final frozen source. Use the exact direct Node24 commands and targeted source-plus-test tsc in144/143 plans, not root files=[] typechecking or worktree package installation. Neither new suite has run at planning time. Independent code review must be clean before144 summary or143 publication; docs-only descendants reuse full proof only under unchanged source/test/runtime identities with focused custody checks. Pre11 absence and post conditional5/six-downstream absence require separate coverage. Current125 plans/108 summaries/13 active/4 inactive is bookkeeping, not ADMIT-03 satisfaction;0/540 and all downstream denials persist.

- `nyquist_compliant: true` means the active Phase 262 contract has executable behavioral coverage.
- It does **not** complete ADMIT-03, Phase 262, or the milestone.
- It grants no retry, reproduction, activation, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, Phase 263, archive, or tag authority.
