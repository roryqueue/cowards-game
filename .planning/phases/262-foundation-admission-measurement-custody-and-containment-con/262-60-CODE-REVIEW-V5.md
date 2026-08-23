---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-23T21:26:05Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 262-60: Code Review V5

**Reviewed:** 2026-08-23T21:26:05Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The V4 layer truthfully identifies one source commit, `c5a08bd50eec0f8c937b42bd07fd9009e7b88c17`, over the four paths recorded in the summary, and the current repository's production custody result agrees with the analyzer and the documented V3 six-path ancestry. The V4 signal fix also closes V4 WR-01: cleanup removes only helper-owned listeners, resets installation state, remains idempotent, removes the helper directory, and preserves unrelated host listeners.

However, the new layered custody check authenticates the historical V3 run and the current V4 run independently without protecting the gap between them. A disposable adversarial repository inserted an unauthorized mutation to a V3-only source path after the authenticated V3 tip and before the V4 base; the production custody function accepted the chain. This defeats the claim that the current four-path layer sits atop an unchanged authenticated six-path layer.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Intervening commits can mutate the authenticated V3 source layer

**Classification:** BLOCKER
**File:** `scripts/lib/v1-38-successor-source-seal.ts:5865-5870`
**Issue:** `inspectV138SourceA9Custody()` verifies the four-commit V3 run and then checks only that `priorSourceA9` is an ancestor of the V4 `sourceBase9`. It never requires the six V3 source paths to remain unchanged across `priorSourceA9..sourceBase9`. Two of those paths—`scripts/lib/v1-38-current-matrix-reproduction.ts` and `scripts/evaluate-v1-38-successor-source-complete.test.ts`—are not members of the four-path V4 boundary, so an intervening commit can alter them without being inspected by the V4 run loop. The returned `priorCorrectionLayer` still labels the old V3 tip as authenticated.

This was reproduced in a disposable shared clone: checkout authenticated V3 tip `32eef5c1`, commit an unauthorized change to `scripts/lib/v1-38-current-matrix-reproduction.ts`, use that commit as `sourceBase9`, then cherry-pick the exact `c5a08bd5` V4 correction. `inspectV138SourceA9Custody()` returned successfully with `accepted: true` and `priorSourceA9: 32eef5c1`, even though `git diff --name-only priorSourceA9 sourceBase9` reported the unauthorized source path. A future review/authorization document can therefore bind attacker-modified route code while presenting a valid V3 ancestry record.

The analyzer does not independently close this hole: it delegates layered authentication to the same production function at `scripts/check-v1-38-dependency-revision-boundaries.ts:1414-1427`, so production/analyzer agreement can be agreement on the same incomplete invariant.

**Fix:** Reject any commit touching a V3 boundary path between the authenticated prior tip and the V4 base. For example, require the following result to be empty before returning custody:

```ts
const interveningPriorPathChanges = gitText(repoRoot, [
  "log", "--format=%H", `${priorSourceA9}..${sourceBase9}`, "--",
  ...V138_PLAN_262_60_V3_SOURCE_PATHS,
]).split("\n").filter(Boolean)
if (interveningPriorPathChanges.length !== 0) {
  fail("V138_PLAN_262_56_AUTHORIZATION_V9_PRIOR_CUSTODY_INVALID")
}
```

Add an adversarial fixture that inserts a commit modifying each V3-only path between `32eef5c1` and the V4 base, applies the exact V4 correction, and requires both production custody and the analyzer to reject it.

## Prior Finding Disposition

- **V4 WR-01 — closed:** named helper callbacks are tracked, disposal unregisters only those callbacks, and `detachedHooksInstalled` resets. The targeted signal test passed and proved unrelated listener preservation, idempotent repeated disposal, helper-directory deletion, and signal re-raise.
- **V3 CR-01 — closed:** production, analyzer, validation, and tests share the current correction-run identifier; the current one-commit/four-path V4 identity is truthful.
- **V3 CR-02 — closed:** disposable B9 execution still reaches the real readiness and route-start handlers with distinct non-empty outputs and no circular real-B9 prerequisite.
- **V3 CR-03 — closed:** expected tool identity remains immutable and observed mismatch enters through the provider seam.
- **V3 CR-04 — closed:** historical reviewer-v2 deletion remains an exactly-once first-parent ancestor with authenticated deletion metadata.
- **V3 WR-01 — closed:** normal, compilation-failure, explicit, suite, CLI-finally, and signal disposal paths do not create a new helper temp leak.
- Earlier V1/V2 findings remain covered by the V3/V4 corrected production paths and focused regression suite. CR-01 above is a new cross-layer gap introduced by V4 custody composition.

## Verification Evidence

- Targeted signal test: 1 passed, 23 skipped; unrelated listener ownership, idempotence, re-raise, and temp cleanup passed.
- Full serialized focused suite: 2 files, 32 tests passed in 162.94 seconds.
- `pnpm exec tsc --noEmit --pretty false` — passed.
- `pnpm typecheck` — 27/27 Turbo tasks passed.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` — passed with `findingCount: 0`, `matrixAdmissionStatus: blocked`, and `downstreamAuthority: denied` on the real repository.
- Direct production custody on the real repository resolved V4 base `7ce7e1e9`, V4 source `c5a08bd5`, the exact four paths, and V3 base/tip `2296a581..32eef5c1` with the exact six paths.
- Adversarial custody reproduction accepted an unauthorized intervening mutation, confirming CR-01 independently of the analyzer.
- Pre/post full-suite `v138-openat-*` inventories were identical.
- Canonical review/report, authorization/seal, route-start, preflight, calibration, reproduction, and terminal destinations remained absent.
- No source or canonical/live-state file was modified. Only this V5 report was added; pre-existing untracked review reports were preserved.

---

_Reviewed: 2026-08-23T21:26:05Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
