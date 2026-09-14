---
phase: 264
fixed_at: 2026-09-14T00:30:48Z
review_path: .planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-TEACHER-CODE-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 264: Teacher Code Review Fix Report

**Fixed at:** 2026-09-14T00:30:48Z
**Source review:** `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-TEACHER-CODE-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### Finding 1: Search did not compare meaningful candidate responses

**Files modified:** `packages/strategy-oracle-teacher/src/teacher.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
**Commit:** `f27230e1`
**Status:** fixed: requires human verification
**Applied fix:** The teacher now holds one canonical starting machine fixed, resumes the same student-owned effect with three schema-valid mission/Action policies, models opponent effects through a separate cautious/aggressive policy, and ranks canonical terminal/material state consequences. No event-count score or hypothesis bonus remains.

### Finding 2: No teacher-to-student training connection

**Files modified:** `packages/strategy-oracle-teacher/src/teacher.ts`, `packages/strategy-oracle-teacher/src/distill.ts`, `packages/strategy-oracle-teacher/src/index.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
**Commit:** `f27230e1`
**Status:** fixed: requires human verification
**Applied fix:** Selected canonical effects now retain only schema-admitted legal observation/target pairs. `projectTeacherSearchToLegalTraining` validates and strips the private receipt before deterministic feature-bucket distillation, and the focused test builds the emitted student and packet from those projected records.

### Finding 3: Budget exhaustion could throw and counters overclaimed

**Files modified:** `packages/strategy-oracle-teacher/src/teacher.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
**Commit:** `f27230e1`
**Status:** fixed
**Applied fix:** One charge function now gates machine creation and every kernel advance/resume. Low-budget and early-terminal paths stop without a cap exception and report exact nodes, reached student-decision depth, and actually resumed alternatives.

### Finding 4: Activation emission had a second policy implementation

**Files modified:** `packages/strategy-oracle-teacher/src/controller.ts`, `packages/strategy-oracle-teacher/src/distill.ts`, `packages/strategy-oracle-teacher/src/emit.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
**Commit:** `f27230e1`
**Status:** fixed
**Applied fix:** The leaf-owned import-free controller now owns both full entrypoints. Trusted wrappers schema-parse then invoke them, while the emitter bundles the same controller bytes and adds a manifest whose root changes when either entrypoint's bytes change.

### Finding 5: Student and target validation admitted false or extra data

**Files modified:** `packages/strategy-oracle-teacher/src/distill.ts`, `packages/strategy-oracle-teacher/src/emit.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
**Commit:** `f27230e1`
**Status:** fixed
**Applied fix:** Records, legal inputs, Actions, receipts, policies, and students now use exact-key/bounded validation; parser stripping is detected recursively; unknown kinds and fields fail; policy feature keys are bounded and unique; nested output is deeply frozen; and controller identity is rederived before compile or emission.

### Finding 6: Closure checks missed computed capability recovery and export shape

**Files modified:** `packages/strategy-oracle-teacher/src/emit.ts`, `packages/strategy-oracle-teacher/src/teacher.test.ts`
**Commit:** `f27230e1`
**Status:** fixed
**Applied fix:** Static validation now rejects nonnumeric computed property access, requires exactly one default object exposing both required names, and verifies both names resolve to local callable declarations. Numeric array access remains allowed. Generated source was not executed.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-oracle-teacher/src/teacher.test.ts` — 1 file, 7 tests passed.
- `./node_modules/.bin/tsc -b packages/strategy-oracle-teacher --pretty false` — passed with unfiltered diagnostics.
- `git diff --check` — passed before the source commit.
- No guest, provider, network, generated-source evaluation, empirical Match, or broad/historical suite ran.

---

_Fixed: 2026-09-14T00:30:48Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_

## Main integration

- Source cherry-pick: `f27230e1` → `961d3e07`.
- Summary cherry-pick: `dec39da9` → `e4228a47`.
- Main independently passed the seven focused tests and unfiltered package build; the independent verifier closed all six authoritative findings in `264-TEACHER-READINESS-CHECK.md`.
- The generic logic-change inspection flags above are satisfied by main and independent source review, including the canonical Action-resume path. No human-only checkpoint is needed for these inspectable mechanics. Empirical teacher quality remains unclaimed.
