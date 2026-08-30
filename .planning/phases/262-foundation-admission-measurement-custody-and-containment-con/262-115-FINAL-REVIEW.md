---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "115"
reviewed: 2026-08-30T03:06:19Z
depth: deep
source_range: 89ba082b..bbdc8998
files_reviewed: 5
files_reviewed_list:
  - scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts
  - scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts
  - scripts/native/v1-38-plan-262-115-exclusive-writer-v1.c
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-115-SUMMARY.md
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-PLAN.md
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 115 Final Code Review

**Reviewed:** 2026-08-30T03:06:19Z
**Depth:** deep
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The two prior blockers are resolved. Every helper invocation compiles into a fresh owner-only directory and authenticates the resulting executable's type, owner, mode, link count, device/inode, and hash before execution; the pre-seeded legacy cache test passes without executing the poison file. The Plan-116 handoff also exactly matches Git commit `a13b5600`, its tree/parent, and all three adapter/test/native `100644` blobs.

One new correctness blocker prevents a clean result. The current-file reader applies a universal physical `0644` requirement to historical custody inputs, but the canonical sealed pair files in the shared checkout are physically `0600`. The required shared-checkout source-only selector now fails immediately, while disposable worktree tests mask the mismatch because Git recreates files using ordinary `0644` permissions.

Verification:

- The pre-seeded predictable-cache substitution test passed in 5.88 seconds; the poison executable was not invoked.
- Exact handoff identities were independently reproduced from Git: commit `a13b5600`, tree `a555fc01`, parent `89ba082b`, adapter/test/native blobs `30083284` / `a2275640` / `a733b6ce`.
- `pnpm exec tsc --noEmit --pretty false` and scoped `git diff --check` passed.
- Canonical `--check-source-only` failed with `V138_SUPPLEMENT_ADAPTER_FILE_UNSAFE:.planning/artifacts/v1.38-successor-source-seal-v13.json`; both the seal and envelope are currently regular non-executable mode `0600` with committed Git mode `100644`.
- Canonical supplement-v3 and every live/effect destination remained absent.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Universal physical 0644 enforcement rejects the canonical sealed pair

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts:136-153`; `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts:116-147,224-240`

**Issue:** `readRegularNoFollow` requires every current file to have physical mode exactly `0644`. That is correct for the authoritative review trio, final-clean review, and canonical supplement, but it is also applied to the sealed pair and all historical inputs. In the actual shared checkout, `v1.38-successor-source-seal-v13.json` and `v1.38-plan-262-90-retry-envelope-v3.json` are regular non-executable `0600` files. Therefore Plan 115's canonical `--check-source-only` command cannot complete, and Plan 116 cannot begin from the required source-only proof. The tests use fresh Git worktrees, which recreate these tracked files as `0644` and never exercise the canonical physical-mode contract.

**Fix:** Make current-mode expectations explicit per custody class. Require exact `0644` for the Plan-114 v2 trio, final-clean review, and supplement; preserve the sealed pair's established secure `0600` physical mode (or explicitly accept the documented non-executable `0600|0644` projection if cross-checkout portability is intended) while still requiring committed `100644`, regular no-follow identity, stable mode, and exact bytes. Add a test reproducing the shared checkout's `0600` pair and require source-only success, plus mutations to executable or unexpected modes that fail closed.

## Non-Authority

This review grants no Plan-116 or Plan-109 eligibility and creates no supplement, readiness, live invocation, producer effect, counter consumption, downstream artifact, or Phase-263 authority. Plan 115 remains blocked pending correction and a fresh independent re-review.

---

_Reviewed: 2026-08-30T03:06:19Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
