---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T14:05:00Z
depth: narrow-amendment
source_head: bd9b976e1150e0e4e9b6bb2d18bbcb6fbc1d644e
diff_base: 7ee156ab
diff_head: bd9b976e1150e0e4e9b6bb2d18bbcb6fbc1d644e
files_reviewed: 3
files_reviewed_list:
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/run-v1-38-lean-private-probe.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: PASS_WITH_WARNINGS
---

# Phase 265 Plan 16 small replacement: source review v2

**Reviewed:** 2026-10-10T14:05:00Z  
**Scope:** Numeric time-window amendment only; exact diff `7ee156ab..bd9b976e`.  
**Status:** PASS_WITH_WARNINGS; no new blocker found.

## Summary

The exact diff contains four line replacements in three scoped files. The production changes update the cumulative-time anchor/carry, prospective cap, hard deadline, and retained-verifier recomputation to the explicitly approved one-hour extension. The test-only change moves the frozen fixture clock to the new anchor. No source behavior beyond time admission/recomputation changed in this diff. No Matches, providers, runtime operations, tests, or historical scans were run by this review.

Arithmetic independently checked against `265-16-SMALL-REPLACEMENT-HOUR-APPROVAL-v1.md`:

- Anchor: `1791640699000` ms = 2026-10-10 13:58:19 UTC.
- Carry at anchor: `292757903` ms.
- Cap: `296357903` ms = carry plus exactly `3600000` ms.
- Required reserve: `1860000` ms (31 minutes), making the final admission/source frontier 2026-10-10 14:27:19 UTC.
- Hard deadline: `1791644299000` ms = 2026-10-10 14:58:19 UTC.
- The live check and retained verifier use the same cumulative equation and reserve/deadline comparisons. Historical charge count (`40`), historical allocated bytes (`29970432`), and authenticated snapshot digest/root remain unchanged.

The unchanged allocation checks still require four cases, zero Matches, and the existing guest/host/startup/Match ceilings (`1000/5000/2500/600000` ms). Existing disk, RAM, privacy, and retained-byte limits are unchanged. The extension is prospective; no historical reset or refund is encoded in the reviewed diff.

## Narrative Findings (AI reviewer)

### WR-01: Full retained-verifier and default-provider integration coverage remains incomplete — WARNING (inherited)

**File:** `scripts/lib/v1-38-lean-experiment-authority.test.ts:32`; `scripts/run-v1-38-lean-private-probe.ts:267`

**Issue:** As recorded in source review v1, tests still do not provide a complete inert fixture for retained-store verifier tampering and actual default-provider constructor integration. This amendment only changes the frozen test clock and time-bound arithmetic; it does not close that pre-existing coverage gap. This is not a new defect in the amendment and does not negate the bounded source-pass disposition, but remains an explicit validation limitation.

**Fix:** Preserve the inherited gap in the handoff; add the smallest inert retained-store/provider integration fixtures only if they fit the approved scope. Do not interpret this source review as empirical runtime or full integration proof.

## Diff audit

- `authority.ts`: only `cumulativeElapsedMs`, minimum carry, prospective cap, and absolute deadline constants changed.
- `authority.test.ts`: only the fixed fixture clock changed from the expired prior anchor to the approved new anchor.
- `runner.ts`: only the retained-verifier copy of the same time equation and bounds changed.
- `git diff --check` passed for the scoped diff. The review did not execute the focused suite.

_Reviewer: gsd-code-reviewer (narrow independent amendment review)_
