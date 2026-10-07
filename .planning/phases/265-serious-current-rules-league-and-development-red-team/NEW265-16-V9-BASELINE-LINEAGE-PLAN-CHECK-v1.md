---
phase: 265
plan: 16
scope: source-only-baseline-lineage-repair-plan-check
status: needs_revision
reviewed: 2026-10-07T05:49:44Z
findings: 2
empirical_authority: false
---

# Existing Plan16 V9 Baseline-Lineage Repair Plan Check

**Verdict: NEEDS REVISION.** The source-only direction is plausible and respects the closed envelope, but two details must be made exact before implementation so the guard exception and physical accounting cannot broaden unintentionally.

## BLOCKER 1 — Pin the exception to the exact preparation marker

**Plan:** `NEW265-16-V9-BASELINE-LINEAGE-REPAIR-PLAN-v1.md`, item 1–2.

**Issue:** The plan says “Only the currentordinal baseline destination may be present during its legitimate lineage read.” That permits a wider interpretation than the diagnosed case: current-ordinal baseline store, allocation, run-start, or other destination state could be tolerated by a lineage-specific bypass. The reproduced predicate is triggered by the current baseline's own `admission-prepare-start.json`; the bounded exception must name that exact marker and leave every other same-ordinal baseline destination fail-closed. The failure report explicitly says the original MAIN throwpoint is withheld, so the patch must remain limited to the statically reproduced predicate rather than imply the withheld throwpoint is known.

**Fix:** Require the lineage path to authenticate the exact own-ordinal baseline `admission-prepare-start.json` (and its paired close record, if required by the authenticated custody contract), and exempt only that start-marker identity from the nested spent-destination check. Continue rejecting the same ordinal's store, allocation, run marker, entry/result state, and any other marker; reject other-ordinal baseline and future diagnostic markers. Add composed-path regression cases for the one allowed exact marker and each forbidden same-ordinal destination. Do not add a generic skip-guards Boolean.

## BLOCKER 2 — Enumerate the physical-only inventory identities

**Plan:** `NEW265-16-V9-BASELINE-LINEAGE-REPAIR-PLAN-v1.md`, item 2.

**Issue:** “Add exact new planning/review/validation/verification/debug-report identities” does not enumerate those identities. This work creates a new plan-check artifact, and the diagnosis itself lives outside the phase directory at `.planning/debug/v9-baseline-prepare.md`; if either is omitted, future predecessor inventory will again fail to debit extant report bytes. A generic phase-directory allowlist would be broader than necessary and would not cover the debug path.

**Fix:** List every exact identity to be added to the physical-custody inventory, including `.planning/debug/v9-baseline-prepare.md`, `.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-V9-BASELINE-LINEAGE-REPAIR-PLAN-v1.md`, this `NEW265-16-V9-BASELINE-LINEAGE-PLAN-CHECK-v1.md`, and the named source summary/review/review-fix/validation/verification artifacts (including any exact re-review artifact). Require one-time extant-file allocation debit in the connected regression. Keep these identities out of the functional manifest and use exact paths only.

## Resolved boundaries

- The debug record and actual terminal verification support a source-only investigation: session 52980 exited before allocation/store/entry/Match, with 31 prior charges retained and no new charge. The accepted v9-2 diagnostic and failed baseline artifacts remain immutable.
- The plan explicitly forbids retrying prepare/helper/allocation/reader/Match in the ended envelope and preserves all elapsed/resource costs, reserve, caps, and approval literals.
- It correctly requires a composed lineage regression, strict fresh diagnostic admission, unchanged FINAL/source joins, no future baseline authorization, and no legacy/public/gameplay changes.

No source change, test, reader, or empirical action was performed. This plan check grants no authority to resume the ended envelope.

_Reviewed: 2026-10-07T05:49:44Z_
_Reviewer: `/root/review_265_remaining_envelope`_
