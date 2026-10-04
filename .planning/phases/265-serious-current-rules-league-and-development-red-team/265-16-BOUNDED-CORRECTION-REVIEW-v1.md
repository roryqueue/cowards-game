---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-04
depth: standard
status: issues_found
author_agent: /root
reviewer_agent: /root/review_265_bounded_correction
independently_reviewed: true
source_commit: 5551e79725e158f0456a01d3667610de8bf776ea
source_root: sha256:b65689a35b684da65266ae5d4a5fd90f3ed940c5a8b9a4f2bae9892d90de398a
diff_base: c07fe821
files_reviewed: 16
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.test.ts
  - scripts/lib/v1-38-lean-baseline-pipeline.ts
  - scripts/lib/v1-38-lean-baseline-reuse.test.ts
  - scripts/lib/v1-38-lean-baseline-reuse.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.test.ts
  - scripts/run-v1-38-lean-correction.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
empirical_execution: not_started
---

# Phase 265-16 bounded-correction source review v1

Reviewed committed changes c07fe821..5551e797 against the approved continuation decision, checked correction plan/research, task handoffs, AGENTS.md and active lean constraints. Cross-module traces include training, factory/planner runtime composition and the existing retained-reader contracts. No Docker, provider, Strategy execution, historical empirical reader, route preparation, source edit or commit was performed. The source-manifest root above was computed by its inert exported manifest function.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: Request admission and child startup are outside cumulative accounting

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:245-252`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-baseline.ts:238-259`.

**Issue:** Run mode reauthenticates historical artifacts, reviews and the source closure and inventories predecessors before opening any interval. The parent then forks and waits up to 30 seconds for ready; only afterward does it create `pilot-entry` with a new current timestamp. Those successful startup costs are omitted, and rejection/timeout before entry records none of them. This is a real cumulative eight-hour accounting hole, not an unknown historical-peak concern. The preparation path similarly leaves failed admission before ledger creation without a prospective cost record.

**Fix:** Start a single prospective monotonic accounting carrier before run/preparation admission and launch, transfer that same start into entry without double counting, and persist bounded failed-pre-entry time/identity on every exit path. Subtract already measured time plus cleanup/terminal/check reserves before releasing a child. Add mocked slow-admission and ready-timeout assertions; do not run a real broker to test this.

### CR-02 — BLOCKER: Complete reader compares canonical sorted training roots with dispatch order

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:100-102`.

**Issue:** `buildCandidate` in `packages/strategy-lab/src/league/lean-training.ts:179` stores `trainingMatchRoots` sorted lexicographically; response construction also sorts at line 267. This reader compares those arrays against execution roots in ordinal order. A valid completed baseline therefore fails `TRAINING_JOIN` whenever its four/eight hashes are not already sorted. The unique reader is spent before this check, so this cannot safely be discovered after spending the 36 cells.

**Fix:** Compare with a copied, sorted expected root array while retaining the exact ordinal/source schedule checks separately. Add a complete synthetic fixture with deliberately nonlexicographic execution roots.

### CR-03 — BLOCKER: Complete reader requires a field that the response-work producer never writes

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:113-114`.

**Issue:** This code requires `rooted(work.root)`. `LeanResponseWork` has no `root` field, and `trainLeanResponse` publishes its exact unrooted work object through `onWork` at `lean-training.ts:271-272`. The correction pipeline retains that object directly at `v1-38-lean-baseline-pipeline.ts:140`. Thus every genuine complete baseline fails `RESPONSE_WORK`, even after CR-02 is fixed. The diagnostic-only fixture never reaches this branch.

**Fix:** Admit the producer's exact existing work schema and authenticate `labRoot("lean-training-decision-v1", work)` against the response candidate's `decisionRoot`, rather than requiring an invented field. Keep historical producer bytes unchanged.

### CR-04 — BLOCKER: Response source and work-channel custody are not joined

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:99-114`.

**Issue:** Initial selected source roots are joined, but the final response snapshot is never joined to the response candidate's source/root/structure. The work check only tests a cap, a numeric counter and a root-shaped string: it does not authenticate target roots, planner evidence, eight node roots, training outcomes, actual-node totals or candidate `decisionRoot`. `auditLeanTrainingVector` checks only response-node array length/root shapes, not those relationships. After a superficial CR-03 fix, an unrelated runtime response source or altered work evidence can still be reported as a complete fixed-budget baseline. This breaks the approved 128-node future-work and source-identity contract.

**Fix:** Join the response candidate to `final-response` bytes/structure and join the strict work object to its decision root, common root, frozen mixture/strongest target, retained response-training outcomes/inputs, node roots and actual-node sum. Use retained deterministic evidence/digests, not a cold builder or search rerun. Add individually re-rooted source, target, work-counter and node mutation tests to the complete fixture.

### CR-05 — BLOCKER: Retained schedule allows a different response opponent or probe entrant

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:58-60,107-112`.

**Issue:** For ordinals 12-19 the schedule predicate verifies only that the entrant is `response-0`; it does not check the prescribed frozen-mixture target at 12-15 or strongest pure at 16-19. For 28-31 it verifies only the `probe` seat, never that the other seat is the selected eligible pure. The later complete audit reconstructs the matrices but never closes either schedule join. An authentic charged pair against another published source passes these predicates and its outcomes can then train/evaluate the wrong procedure while the report says complete.

**Fix:** Reconstruct expected response targets with the existing frozen initial analysis and `selectLeanMixtureTarget`, and require the opposite probe seat to equal the selected source. Apply these checks to every available row, including partial prefixes after initial analysis exists. Add wrong-target and wrong-selected-probe tests.

### WR-01 — WARNING: Diagnostic retained origin is not tied to its invocation

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:75-78`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.ts:53-65,355-364`.

**Issue:** The live session validates its origin against an ephemeral ordinal/payload root, but that binding is not retained alongside invocation identity/method/input. The reader later validates only ordinal/root syntax and the source/seat, then promotes any matching deadline fields to `observedOrigin: legacy_deadline`. It cannot reject a well-shaped origin with a different invocation ordinal/root for the same source/seat, or independently establish which method failed. This narrows the useful diagnosis and permits stale invocation metadata to survive the retained check.

**Fix:** Retain a finite host-owned method/invocation/input/executable binding with the origin and independently join it to the failed runtime evidence/diagnostic. Keep raw source/input/error text excluded and unavailable lifecycle/native cause explicitly unknown. Test a re-rooted different-invocation origin rejection.

## Review disposition

Fix these source defects before preparing either route. In particular, build one synthetic complete 36-cell retained fixture through the existing producer seams: it directly exposes CR-02 and CR-03 without empirical execution, added search opportunity or heavyweight certification. The unchanged guest1000/host5000/Match600000 clocks, old byte custody and unopened holdout are not permission to waive these prospective joins. This review establishes no diagnosis, capacity receipt, empirical success, phase completion or formation/freeze authority.
