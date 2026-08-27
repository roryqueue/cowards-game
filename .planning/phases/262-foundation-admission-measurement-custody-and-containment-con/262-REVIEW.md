---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-27T16:22:57Z
depth: deep
files_reviewed: 11
files_reviewed_list:
  - scripts/lib/v1-38-bounded-retry-envelope.ts
  - scripts/run-v1-38-bounded-retry-envelope.ts
  - scripts/run-v1-38-bounded-retry-envelope.test.ts
  - scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.ts
  - scripts/check-v1-38-plan-262-83-bounded-retry-source-rereview.test.ts
  - scripts/check-v1-38-plan-262-post-run-audit-correction.ts
  - scripts/check-v1-38-plan-262-post-run-audit-correction.test.ts
  - scripts/check-v1-38-plan-262-80-bounded-retry-admission.ts
  - scripts/check-v1-38-plan-262-80-bounded-retry-admission.test.ts
  - scripts/check-v1-38-plan-262-81-lifecycle.ts
  - scripts/check-v1-38-plan-262-81-lifecycle.test.ts
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-27T16:22:57Z
**Depth:** deep
**Files Reviewed:** 11
**Status:** issues_found

## Summary

The five submitted fix commits close the original cleanup-root and semantic-review defects, add real SIGKILL coverage, and preserve the historical exhausted `0/540` result. They do not produce a shippable custody chain. The committed post-run correction fails its own canonical checker in the clean checkout, stale-owner takeover has a race that can remove a newly acquired live lock, the correction is not anchored to immutable historical blobs or its own publication lineage, and the corrected read-only outcome path reports reproduction absence without inspecting that path.

The focused suite exposed the immediate integration failure: the six-suite command stopped in Plan 80 with `V138_AUDIT_CORRECTION_INVALID`. Fresh derivation computes private-receipt root `sha256:266e2ec2...43e121`, while the committed correction records `sha256:e79542e6...1ef9a`, changing the correction root from `sha256:3834bd50...be026` to `sha256:b0f59df7...07b43b`. The canonical correction check, Plan-80 check, and terminal read-only check all fail. The remaining five suites pass 64/64, TypeScript and `git diff --check` pass, and the Plan-83 check truthfully returns blocked with 13 findings. No live evidence or source file was modified by this review.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The committed correction is invalid against the evidence it is supposed to authenticate

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-post-run-audit-correction.ts:131-172,219-247`; `scripts/check-v1-38-plan-262-post-run-audit-correction.test.ts:11-53`

**Issue:** `checkV138PostRunAuditCorrection()` recomputes the correction from the current private-receipt directory and requires byte equality with the committed artifact. In the submitted clean checkout those values already differ: the artifact records private-receipt root `sha256:e79542e6...1ef9a`, while derivation returns `sha256:266e2ec2...43e121`. Consequently `--check-correction`, Plan 80's canonical checker, and the terminal-envelope checker all fail with `V138_AUDIT_CORRECTION_INVALID`. The correction test misses this because it validates a freshly derived object against itself rather than calling the checker on the published artifact.

**Fix:** Determine and preserve the intended immutable receipt set, regenerate the additive correction only from authenticated historical inputs, and add an integration test that calls `checkV138PostRunAuditCorrection(process.cwd())` against the committed artifact. The same test must transitively run the canonical Plan-80 and terminal read-only checks.

### CR-02: Stale-lock takeover can delete a newly acquired live owner's lock

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope.ts:1353-1395`; `scripts/run-v1-38-bounded-retry-envelope.test.ts:1159-1245`

**Issue:** After reading a dead lease, takeover blindly renames whichever file is currently at the lock path. With two contenders, both can read the same stale lease; contender A can rename it and acquire a new live lease, then contender B can execute `renameSync(lock, quarantine)` against A's new lease and unlink it. B can then acquire the path while A is still executing. The SIGKILL tests exercise one successor only and cannot detect this compare-and-swap race. This permits simultaneous production owners and identity reuse.

**Fix:** Use an OS advisory lock whose ownership ends with the process, or implement an atomic compare-and-takeover protocol that proves the renamed inode/bytes are the exact stale lease observed before removal. Add a synchronized two-successor test proving exactly one contender acquires and that the winner's lock cannot be removed by the loser.

### CR-03: The additive correction does not prove immutable historical custody or its own publication lineage

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-post-run-audit-correction.ts:119-176,240-248`

**Issue:** The checker verifies only that named historical commits are ancestors. For the seal, envelope, journal, terminal, private receipts, old Plan-83 artifact, and old Plan-80 disposition it hashes current filesystem bytes and then derives the expected correction from those same mutable bytes. It never compares tracked evidence with `git show <historical-commit>:<path>`, never authenticates private receipts to a durable historical carrier, and never proves that the correction artifact has one immutable introducing commit with no later rewrite. Thus the asserted `historicalBytesMutated: false` is not established. Republishing or rewriting evidence and its correction can become self-consistent; the current private-root drift in CR-01 demonstrates the practical fragility.

**Fix:** Bind each tracked historical artifact to the exact blob at its declared commit, put private-receipt hashes in a committed historical manifest, and require a unique correction publication commit whose blob equals the working-tree artifact with no later path rewrite. Reject any current-byte mismatch instead of deriving a new expected history from it.

### CR-04: The corrected read-only path falsely asserts that reproduction is absent

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope.ts:1425-1462`

**Issue:** When a correction exists, `checkV138PublishedRetryOutcome()` returns `reproductionPresent: false` unconditionally. It never checks the canonical reproduction path. An unexpected regular file, symlink, or directory at that path is therefore reported absent, breaking the fail-closed terminal contract and allowing unauthorized reproduction material to coexist with a claimed exhausted/no-reproduction outcome.

**Fix:** Inspect the canonical reproduction path in the correction branch and require it to be exactly absent for the exhausted result. Fail for every other filesystem type. Add tests for regular-file, symlink, and directory injection at that path.

## Prior Finding Closure Audit

| Prior finding | Status | Evidence |
|---|---|---|
| Cleanup pending work and root binding | **CLOSED** | Pending reservations are reconciled before expiry and `completeCleanup` is included in the hashed body; focused tests cover both pending kinds and root mutation. |
| Additive correction / trust consistency | **OPEN** | A correction exists, but its committed root is already invalid and its custody proof is circular over current bytes. |
| Stale lock and journal/receipt recovery | **OPEN** | Receipt reconciliation and SIGKILL recovery were added, but concurrent stale takeover is not atomic. |
| Plan-83 token attestation | **CLOSED AS SCOPED** | Observation results now come from explicit executions, incomplete families fail closed, and the historical review correctly returns blocked with 13 findings. |

## Verification

- `pnpm exec vitest run` over all six changed test files: **failed**, 1 Plan-80 failure (`V138_AUDIT_CORRECTION_INVALID`) after the first test.
- The other five changed suites run separately: **64/64 passed**.
- `pnpm exec tsx scripts/check-v1-38-plan-262-post-run-audit-correction.ts --check-correction`: **failed** with `V138_AUDIT_CORRECTION_INVALID`.
- Canonical Plan-80 disposition check: **failed** with `V138_AUDIT_CORRECTION_INVALID`.
- Canonical terminal-envelope check: **failed** with `V138_AUDIT_CORRECTION_INVALID`.
- Canonical Plan-83 review check: **passed as blocked**, 13 findings, no execution authority.
- `pnpm exec tsc --noEmit --pretty false`: **passed**.
- `git diff --check`: **passed**.

## Current Bounded-Retry Verdict

**ISSUES FOUND.** Preserve the historical journal, terminal, private receipts, absent reproduction-v15, absent Route-9 activation, and empirical `0/540`. Do not retry or grant Phase-263/downstream authority. The custody correction and owner-lock protocol must be repaired before this machinery can be trusted.

---

_Reviewed: 2026-08-27T16:22:57Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_

## REVIEW COMPLETE
