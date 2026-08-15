---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-15T08:27:19Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-CODE-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 262 Plan 60: Code Review Fix Report

**Fixed at:** 2026-08-15T08:27:19Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-CODE-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 7
- Fixed: 7
- Skipped: 0
- Corrected sourceBase9: `81644e27132ce853afc43731c89c3bbf4941b7d0`
- Corrected sourceA9: `70ce6d61a7275bfb23fe9094207c5c5dc92a0043`
- Corrected sourceA9 tree: `553a2303b272f3ce3dd729975898a27e5ba2adaa`
- Corrected sourceA9 sole parent: `ea31c46fbe8bc6020a87c7096c6a1f585ff23dd8`
- Author-run trailer: `Plan-262-60-Author-Run: codex-plan-262-60-a9-review-fix-v1`

## Fixed Issues

### CR-01: Review-v3 exact evidence inventories and independent observation joins

**Files modified:** `scripts/lib/v1-38-source-completeness-review-v3.ts`, `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commits:** `0577eff6`, `1be4462a`, `70ce6d61`
**Status:** fixed: requires human verification
**Applied fix:** Enforced the exact eight-path bijection, exact unique command inventory, unique command/handler observations, command-handler joins, unique prior-byte and snapshot records, and comparison of review custody, publication, protected history, prior bytes, snapshots, and ordered events with independently derived observations. Publication custody identities remain external to the reviewed document to avoid self-referential commit/blob claims.

### CR-02: Real v9 route consumes one normalized custody shape

**Files modified:** `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commit:** `caa014a3`
**Status:** fixed: requires human verification
**Applied fix:** Constructed an explicit v9 route from nested authorization, seal, B9 custody, protected-history, and route-closure records. Context, route-start, preflight, calibration, reproduction, and terminal joins now consume that normalized shape.

### CR-03: Pre-observation terminal branches use v9 anchors

**Files modified:** `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commit:** `caa014a3`
**Status:** fixed: requires human verification
**Applied fix:** Removed active v7 anchor calls and the blanket v9 observation-exception rejection. Each pre-observation disposition now varies only its named observation while retaining exact v9 authorization, seal, B9, protected-history, formation, and route joins.

### CR-04: Authorization records A9's actual sole parent

**Files modified:** `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`
**Commit:** `82d8de09`
**Status:** fixed: requires human verification
**Applied fix:** Source custody now retains sourceBase9 separately and derives sourceA9Parent from the verified final author-run commit. Regression coverage compares it directly with Git.

### CR-05: Deleted reviewer-v2 is historical custody only

**Files modified:** `scripts/check-v1-38-dependency-revision-boundaries.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`
**Commit:** `5ea8284b`
**Status:** fixed: requires human verification
**Applied fix:** Removed reviewer-v2 from active frozen-source collection, authenticated its immutable historical blob separately, removed A9-wide semantic suppression, and bound accepted route-source drift to the later summary's exact A9 tree/blob/SHA records while AST findings are restricted to changed A9 line ranges.

### CR-06: Protected history is pinned to an immutable object and exact root inventory

**Files modified:** `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`
**Commit:** `82d8de09`
**Status:** fixed: requires human verification
**Applied fix:** Pinned the failure artifact to commit `bc0f95141d475d1d56ecf9d8ce67880f29385ea1`, blob `f5efc47d0e65cebee250431cded02c3fa41906c0`, SHA-256 `dffa9bf3915895506958aef5bb45d350f70eb7a3c190078e217384c16f3e4a8a`, 5,792 bytes, and its exact eleven-root inventory. Current and sourceA9 bytes must equal the frozen object.

### WR-01: Focused tests exercise a valid v9 route

**Files modified:** `scripts/evaluate-v1-38-successor-route.test.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commits:** `ea31c46f`, `70ce6d61`
**Applied fix:** Removed stale deleted-reviewer expectations, asserted all four obsolete v7/v8 paths, replaced the v7-shaped route mock, removed the skipped legacy v7 fixture, and added a repository-backed review-v3 publication, authorization-v9, direct-child B9, and full-valid-argv route-start proof through the real authority checker.

## Verification

- `pnpm exec vitest run scripts/evaluate-v1-38-successor-route.test.ts scripts/evaluate-v1-38-successor-source-complete.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=1500000 --bail=1` — 2 files, 27 tests passed, 0 skipped.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` — passed, 0 findings, 16 source files scanned, exact 43/48 lifecycle.
- `pnpm turbo typecheck --concurrency=1` — 27/27 tasks passed.
- `git diff --check` — passed.
- Reviewer-v2 active checker/test remain deleted; canonical review-v3, authorization-v9, seal-v9, B9, route, and live destinations remain absent.

## Skipped Issues

None.

---

_Fixed: 2026-08-15T08:27:19Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
