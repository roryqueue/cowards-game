---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-10-03T18:36:39Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-IMPORT-CRASH-REVIEW-v1.md
iteration: 1
findings_in_scope: 5
fixed: 4
skipped: 1
status: partial
---

# Phase 265: Import-crash code review fix report

**Source review:** `265-15-IMPORT-CRASH-REVIEW-v1.md`  
**Iteration:** 1  
**Scope:** source and synthetic, inert tests only. No preparation, private historical reader, provider, container, Match, model, or empirical run was invoked. This report does not pass the pilot or phase.

## Fixed issues

### CR-01 — Import allocations exceed the claimed source-bounded memory reserve

**Files modified:** `packages/strategy-lab/src/factory/supervision-artifacts.ts`, `packages/strategy-lab/src/factory/supervision-artifacts.test.ts`, `packages/strategy-lab/src/league/contracts.ts`, `scripts/assess-v1-38-factory-independence.ts`, `scripts/run-v1-38-lean-experiment.ts`, `scripts/run-v1-38-serious-league.ts`, `scripts/v1-38-factory-observations.ts`  
**Commit:** `c026b715`  
**Status:** fixed: requires human verification.  
**Applied fix:** Added preparse supervision-chunk admission and repeated live joint-capacity checks, reserves before constructing the indexed record graph and numeric projections, bounded the token-construction shape, and charged duplicated decision-signature bytes. A synthetic 48-distinct-cell, multi-chunk fixture compares old and bounded descriptor/record outcomes and rejects insufficient preparse reserve. The expansion allowance is an explicit conservative implementation estimate, not a measured RSS proof or a genuine full historical-assessment verifier fixture. Independent source review must assess whether its upper bound covers the entire simultaneous working set.

### CR-02 — Orphan child can continue a charged Match after observing-parent loss

**Files modified:** `scripts/run-v1-38-lean-experiment.ts`, `scripts/run-v1-38-lean-experiment.test.ts`  
**Commit:** `d3fe1ea3`  
**Status:** fixed: requires human verification.  
**Applied fix:** Bound dispatch to the entry parent PID and live IPC, registered disconnect cleanup, and checked parent observation before charging/invoking and after an invocation. A synthetic mid-invocation disconnect test checks provider cleanup and no subsequent charge or invoke. Synchronous in-flight provider code cannot be preempted by a queued JavaScript disconnect event; the guard stops work at the next observable boundary. An unterminalized ledger interval remains fail-closed.

### CR-03 — Failed-prefix disk admission omits possible out-of-store crash writes

**Files modified:** `packages/strategy-lab/src/league/lean-experiment.ts`, `packages/strategy-lab/src/league/lean-experiment.test.ts`, `scripts/run-v1-38-lean-experiment.ts`, `scripts/run-v1-38-lean-experiment.test.ts`  
**Commit:** `ae930c8e`  
**Status:** fixed: requires human verification; admission intentionally remains closed.  
**Applied fix:** Required a separately reviewed, exact-path failed-prefix disk inventory bound to the immutable old source and failure, authenticated existing allocated blocks and conservative destination bounds, and included its disk debit in the predecessor and all cumulative accounting. Prospective CLI operation additionally requires TSX cache disabled before process launch and a zero inherited core soft limit. No inventory JSON was fabricated: the old PID's core limit and historical TSX cache delta were not retained, and today's absence/snapshot cannot establish them. Until an independent numeric inventory satisfies the source gate, v2 allocation/preparation fails closed. This is a disk-write issue; old peak RSS is separately unmeasured and not represented by current store bytes.

### WR-02 — Parent sampling can use a reparented process

**Files modified:** `scripts/run-v1-38-lean-experiment.ts`, `scripts/run-v1-38-lean-experiment.test.ts`  
**Commit:** `a36b7d3a`  
**Status:** fixed: requires human verification.  
**Applied fix:** Removed default-to-current-parent sampling, required the immutable entry parent PID and live IPC on every capacity sample, and denied identity loss before or after the RSS read. Synthetic tests exercise parent mismatch and disconnected IPC.

## Skipped issue

### WR-01 — Import regression fixture does not test the real historical verifier path

**Files:** `scripts/run-v1-38-serious-league.test.ts`, `scripts/assess-v1-38-factory-independence.test.ts`  
**Reason:** A genuine synthetic complete retained 48-cell repository exercising both historical verifier modes, exact assessment/threshold/candidate roots, and independent negative mutations was not built in this iteration. The existing two-candidate test still mocks historical verification, and the existing charge-only 48-cell test still reuses one small object. CR-01's new 48-distinct-cell parser fixture does not satisfy this finding. The missing fixture must remain an open warning, not be described as a passing authenticity check.

## Verification and limits

- Focused synthetic checks passed: lean runner tests (12), observation tests (7), CR-01 48-cell supervision preflight fixture, CR-03 inventory gate fixture, and selected lean-import/assessment tests. The selected two-candidate assessment test uses a mocked historical verifier and is not WR-01 evidence.
- Strategy-lab typecheck and strict TypeScript checks for the changed runner/test passed; `git diff --check` passed. A broader focused-suite invocation was interrupted after a long-running large synthetic supervision test; it is not reported as a pass.
- The full strategy-lab lean-experiment suite was not run in the isolated worktree because historical private artifacts and the as-yet-unproven review inventory were not present there. No legacy/private reader was called.
- No runtime guest/host/Match limits, public/private boundary, engine/gameplay rule, or immutable old-failure semantics were intentionally changed. No new experimental authority or pilot result is claimed.

---

_Fixed: 2026-10-03T18:36:39Z_  
_Fixer: gsd-code-fixer_  
_Iteration: 1_
