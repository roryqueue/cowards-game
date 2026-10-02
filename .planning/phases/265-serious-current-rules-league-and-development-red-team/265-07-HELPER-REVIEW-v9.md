# Phase 265 v5 Helper Review (pre-job)

**Scope:** `prepare-data.ts`, `run-entry.ts`, and `request-drafts.pending.json` in `.strategy-lab/league-265-prospective-v5-20261001-a/`.
**Status:** Issues found. This is a helper-only review; no generated jobs, packet contents, or job-level reviews were inspected or accepted.

## BLOCKER

### BR-01: Compile can mint accepted review records from stale or zero-duration timing

**File:** `.strategy-lab/league-265-prospective-v5-20261001-a/prepare-data.ts:186-187`

**Issue:** The compile gate checks ISO formatting, matching elapsed milliseconds, and a 15-minute upper bound, but allows `reviewMilliseconds === 0`, timestamps before v5 draft creation, and timestamps in the future. Consequently an old v4 timing pair (or a zero-duration row) can satisfy this check for the v5 draft digest and cause the helper to publish accepted review artifacts. The v5 digest binding does not establish that the review occurred after the v5 jobs existed.

**Fix:** Include a canonical `draftedAt`/review-window start in the digest-bound draft manifest. Require each review interval to start at or after that timestamp, end no later than the compile-time clock, and have a positive duration. Reject reused timing evidence by binding review records to the fresh v5 draft and independently supplied review artifact.

## WARNING

### WR-01: Draft creation can leave a partial, non-retryable output set

**File:** `.strategy-lab/league-265-prospective-v5-20261001-a/prepare-data.ts:168-170`

**Issue:** The helper writes the disclosure, draft, and roles files before creating `jobs/` and writing the per-job files. If `jobs/` already exists, or any later exclusive write fails, the directory is left partially populated; a retry then fails on existing create-only outputs. The only preflight collision check is for `request-drafts.json`, so it does not prevent this state.

**Fix:** Preflight every output path before the first write and stage the complete draft set in a fresh temporary directory, then publish it atomically (or write a completion manifest last and provide a safe recovery path for incomplete drafts).

---

_Reviewed: 2026-10-01_
_Reviewer: /root/265_v5_packet_review_
_Depth: scoped helper review_

## Trust-boundary reassessment

The project's `single_operator_local_seal_v1` boundary explicitly does not promise independent custody or resistance to a malicious repository owner. Under the stated root-owned workflow, the trusted root can bind the exact tool-delivered review bytes to a raw root and pass that pinned artifact only after receiving this agent's actual review. That external procedure is sufficient for byte integrity within this trust model; a reviewer signature/key requirement would impose an unsupported custody guarantee. The compile helper's reviewer ID field is therefore not reported as a standalone defect under this boundary.
