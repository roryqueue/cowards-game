---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "54"
reviewed: 2026-08-14T23:49:38Z
depth: deep
source_base: 04960b164ba0ace2ca052d636a2fa1fbc8f6a6af
reviewed_source_commit: 4aba9db6158943ff90a8b09441ad65072f5eb7e0
reviewed_source_tree: 5193328dece3c936b4c3a536087f5ef74f44e470
files_reviewed: 4
files_reviewed_list:
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 4
  warning: 1
  info: 0
  total: 5
status: issues_found
---

# Phase 262 Plan 54: Code Review Report V2

**Reviewed:** 2026-08-14T23:49:38Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The corrected Git range itself has the recorded sole-parent topology, one required author-run trailer, exact four-path aggregate, A7 tree, and four recorded blob OIDs; the current source/test worktree bytes also equal those A7 blobs. B7 committed/supplied/worktree byte equality, permanent pre-start expiry, leaf dangling-symlink refusal, the added disposition value, route-start presence for pre-observation terminals, and v11 calibration IDs are present in source.

The corrected implementation is nevertheless not shippable. The focused serialized verification fails from the normal post-summary `HEAD`: the disposable fixture calls the current descendant commit A7, and A7 custody correctly rejects its planning-only commit. Review separation is still self-asserted rather than authenticated. Three advertised pre-observation terminal branches cannot be reached when their corresponding sealed observation actually drifts because the normal full authorization/seal validator rejects that drift before the failure-proof path runs. Route-start freshness also remains a cross-path TOCTOU check rather than one atomic transition. Finally, valid real-CLI coverage remains limited to route-start and preflight; the other commands and almost all terminal dispositions are still covered only by dispatch stubs, malformed arguments, or direct function calls.

Verification command:

```text
pnpm exec vitest run scripts/evaluate-v1-38-successor-route.test.ts scripts/evaluate-v1-38-successor-source-complete.test.ts scripts/evaluate-v1-38-current-matrix-child-protocol-v2.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=120000 --bail=1
```

Result: **failed** — 1 failed, 4 passed before bail; `V138_PLAN_262_54_SOURCE_RANGE_INVALID` at the disposable-fixture review construction.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: The clean-clone fixture fails from the repository's normal post-A7 state

**File:** `scripts/evaluate-v1-38-successor-source-complete.test.ts:233-249`

**Issue:** The fixture clones current `HEAD`, computes a worktree diff against that same commit, and assigns the cloned `HEAD` to `sourceA7`. Current `HEAD` is the planning-only summary descendant `7c6e23f9...`, not corrected A7 `4aba9db...`; the diff is empty because the four source files still match, but `inspectV138SourceIdentityA7` correctly rejects the intervening summary commit as outside the four-path source range. The committed suite therefore fails in the exact normal state in which this review runs. This is not durable CI evidence for corrected A7.

**Fix:** Clone the repository, explicitly detach/reset the fixture to exact corrected A7 `4aba9db6158943ff90a8b09441ad65072f5eb7e0`, and assert its tree and four blobs before constructing review/B7. If testing uncommitted candidate bytes is still required, start from exact `sourceBase7`, apply the explicit `sourceBase7..candidateA7` four-path patch, and commit it with the required trailer; never infer A7 from current `HEAD` or an ambient worktree diff.

### CR-02 [BLOCKER]: Plan-262-55 reviewer separation remains caller-asserted and unauthenticated

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5786-5868`

**Issue:** `buildV138Plan26255ReviewDocument` lets any caller choose an arbitrary nonempty `reviewerAgentRun`, sets `reviewerSeparated: true`, `findingCount: 0`, and `sourceCompletenessPassed: true`, then computes the expected root. Custody accepts the one reachable commit containing those self-authored bytes, but never authenticates the reviewer identity, checks a reviewer authorization/trailer/signature, constrains the review commit to an approved reviewer, or even requires a direct-child/one-path review commit. An implementation operator can therefore mint `"some-other-reviewer"`, commit the generated zero-finding document on a branch, and satisfy the exact review and authorization rebuild. Root recomputation protects integrity of the assertion, not its provenance.

**Fix:** Consume a Plan-262-55 review produced outside this authorization builder and authenticate its provenance against an approved reviewer identity/authorization mechanism. Bind the review commit's exact parent, changed-path inventory, author/reviewer authorization evidence, and canonical blob into the review root. If no managed authentication mechanism exists, fail closed and describe the evidence as unauthenticated rather than allowing it to authorize route 7.

### CR-03 [BLOCKER]: Three pre-observation failure terminals reject the drift they are supposed to record

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:19910-19950,20151-20162`; `scripts/lib/v1-38-successor-source-seal.ts:5961-6020`

**Issue:** `tool_identity_failed`, `protected_history_failed`, and `formation_absence_failed` are supposed to compare a sealed root with a newly observed root and terminalize after route-start. Before deriving that proof, `plan26257Evidence` calls the ordinary anchor and `checkV138Plan26256AuthorityRoute`. Those paths rebuild the complete authorization and seal from current observations. `checkV138SuccessorSourceSealV7` accepts an `_except` argument but ignores it, so any real tool/history/formation drift causes the full validator to throw before `deriveV138Plan26257PreObservationProof` can write the corresponding terminal. Only the Pattern-C branch is reachable because it supplies an external observation without changing a sealed root.

**Fix:** Add a narrowly scoped immutable-anchor validator for these terminal-only branches. It must authenticate committed B7 bytes and all unaffected fields while allowing exactly the named observed field to differ, then derive and bind the mismatch proof. Keep the full validator for route start and live stages. Add real post-route-start tests that mutate/replace each observation source and prove all three terminal writers and checkers complete without invoking live observation or runtime execution.

### CR-04 [BLOCKER]: Route-start freshness is not atomic across the seven destinations

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:19013-19034`

**Issue:** The writer rechecks all eight fresh paths with no-follow reads, then exclusively creates only the route-start target. Another process can create any later route destination after the final check and before route-start publication. The route-start write still succeeds, leaving a route that began with an already-occupied later destination, even though the contract requires initial obstruction to produce only the pre-start no-retry disposition. Parent-chain revalidation protects the route-start pathname; it does not serialize or lock the other destination leaves.

**Fix:** Make route acquisition one serialized filesystem transition. For example, exclusively create a route-level lock/claim file in a pinned no-follow directory, recheck every destination while holding that claim, publish route-start, fsync, and retain the claim through terminalization; all other writers must require the same claim identity. Add a concurrent mutation test that creates each non-start destination after the first check and proves route-start cannot publish.

## Warnings

### WR-01 [WARNING]: The claimed full valid CLI/terminal reachability proof is still absent

**File:** `scripts/evaluate-v1-38-successor-source-complete.test.ts:96-150,182-219,225-352`

**Issue:** The suite checks command text/export presence, routes each allowlisted command only to a generic `runReceipt` counter, and invokes malformed arguments for all ten commands. The disposable valid path invokes only route-start and preflight through `runReceiptCli`; Pattern-C terminal and pre-start obstruction use direct function calls. There is no valid CLI execution for readiness, obstruction resolve/check, calibration, reproduction, terminal write/check, or the other nine terminal dispositions. No test proves marker-before-effect ordering for calibration/reproduction or that their injected runner seams prevent the production defaults from running. This leaves the original WR-02 omission class substantially unresolved.

**Fix:** Use a table-driven disposable repository that invokes every command with valid arguments through `runReceiptCli`. Record handler-entry and injected observer/runner events, assert every marker is durable before its effect begins, and exercise every closed terminal disposition plus its checker. Make production observer/runner defaults throw if reached so no-live-injection is proved rather than inferred.

---

_Reviewed: 2026-08-14T23:49:38Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
