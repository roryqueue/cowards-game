---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "132"
reviewed: 2026-08-31T01:44:14Z
reviewed_head: e2c81f2814415ac311c680e51055a9122dbda25a
depth: deep
files_reviewed: 3
files_reviewed_list:
  - scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts
  - scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-132-SUMMARY.md
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 132: Code Review Report

**Reviewed:** 2026-08-31T01:44:14Z
**Depth:** deep
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The Plan132 v5 source, tests, and summary were reviewed from clean HEAD `e2c81f28` against the committed Plan131 findings and the strict-descendant, exact-history, six-observation, and no-effect contracts. The focused suite, TypeScript compilation, source-only checker, and ordinary hostile observation mutations pass. The correction remains blocked by two trust-boundary defects: ambient Git replacement objects can make an unrelated commit pass the strict-descendant gate, and the exported observation validator can derive a six-mode count from a caller-forged payload and fake custody roots.

## Narrative Findings (AI reviewer)

### CR-01 [BLOCKER]: Ambient Git replacement refs can forge strict-summary ancestry

**File:** `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts:96-102,121-122,171-191`

**Issue:** The v5 checker invokes `/usr/bin/git` with the ambient repository configuration and environment. It does not set `GIT_NO_REPLACE_OBJECTS=1`, isolate global/system configuration, or reject `refs/replace`. Consequently, Git's ancestry and object reads can be redirected by repository-local replacement objects. In a temporary clean clone, a replacement object made the explicitly unrelated commit `6515ea1a2e372a71d9f9d161e395276cf163db76` appear to have exact summary `6a82901a8e73a4c2b8be92ba1b8d606919678784` as its parent. `authenticateV138Plan132V4InvalidHistoryForReview` then accepted that unrelated commit and returned the process-invalid disposition. Running the same `merge-base --is-ancestor` check with replacement objects disabled exited `1`. This violates the fail-closed requirement that unrelated histories be rejected and makes the exact ancestry claim dependent on attacker-controlled repository metadata.

**Fix:** Route all Git text and byte operations through the existing isolated Git custody runner, including a clean environment with `GIT_NO_REPLACE_OBJECTS=1`. Before authenticating history, reject any `refs/replace` entry and dangerous local Git configuration. Add a temporary-repository test that installs a replacement ref for an unrelated commit and requires authentication to fail.

### CR-02 [BLOCKER]: Exported validator derives six-mode authority from a caller-forged payload

**File:** `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts:208-264`

**Issue:** `validateV138Plan132ObservationsForReview` treats its `authenticatedPayload` argument as trusted even though it is an ordinary exported `Json` object with no runtime provenance. Its root comparisons and exact-observation equality are anchored only to fields in that caller-supplied object. A hostile caller can replace every canonical reviewed, installed, Git-object, and native-source root; update all six observations; recompute each execution and observation root; and recompute the aggregate root. The validator accepted this fully forged set and returned `actualModesPassed: 6`. The renderer currently authenticates history before calling the validator, so the normal CLI path is not directly bypassed, but the exported validator and its returned count do not satisfy the advertised exact-history and fully validated-root contract.

**Fix:** Do not accept an unbranded payload as the validator's trust anchor. Have the exported validator take a repository root and internally call the exact-history authenticator, or make the low-level validator private and expose only a wrapper that obtains its anchor from authenticated committed bytes. Add a direct hostile test passing a self-consistent forged payload and six forged custody-root observations; it must fail before returning an aggregate.

## Verification

- Focused serialized Vitest: passed, 1 file / 6 tests.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `pnpm exec tsx scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts --check-source-only`: passed with six modes, zero findings, Plan133 eligible, Plan110 false, and no effects.
- Replacement-ref mutation: unrelated `6515ea1a...` was incorrectly accepted; without replacement objects, ancestry exited `1`.
- Forged-payload mutation: validator incorrectly returned `actualModesPassed: 6` for fake custody roots.
- `git diff --check`: passed before review persistence.

## Effect Boundary

No readiness selector, live selector, producer, producer destination, capacity/reset path, counter consumer, or downstream action was invoked. Review execution was limited to serialized tests, TypeScript compilation, source-only checking, static/Git reads, a temporary clone with a local replacement ref, and in-memory observation mutations.

---

_Reviewed: 2026-08-31T01:44:14Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
