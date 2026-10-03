---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T22:50:57Z
depth: deep
source_commit: e15638276336f05565ca808466fffb2110436468
source_root: sha256:89b8835a2abe1c694b0573d5a158cdff79f9e96267aa1ad3a4fa5125f29d383a
source_manifest_entries: 863
author_agent: /root/fixture_265_15_full_verifier
co_author_agent: /root/debug_lean_pilot_ipc_exit
reviewer_agent: /root/review_265_15_import_crash
independently_reviewed: true
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.sh
  - scripts/lib/v1-38-lean-child-cli-terminal.ts
  - scripts/fixtures/v1-38-lean-child-terminal-probe.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265-15: Integrated successor source review

## Summary

The bounded successor accounting preserves the consumed v1/v2 identities and readers, binds the closed v2 allocation/request/entry/terminal/time/empty-charge and independent report bytes, and checks parent/child and interval linkage. Its v3 route selects disjoint store/temp/canonical/request identities. The carry-forward is 1,323,030 ms, zero charges and a conservative 114,688-byte disk floor (the larger of the terminal snapshot and 53,248 surviving measured bytes), without claiming the unknown historical peak. The 15 GB total, 12/2/1 GB partitions, eight-hour, 300-Match and runtime limits remain unchanged. I verified the terminal report's source-bound raw digest and recomputed the current `leanSourceManifest()` root through the inert import only.

The child CLI helper waits for action settlement, sends only a finite allowlisted diagnostic on error, and disconnects IPC on both success and failure; the inert fork fixtures exercise those paths. One integration defect remains in the parent terminal path, so this report is not a clean source authorization for a next entry. Author-reported 35 focused tests, types and shell checks passed; I did not rerun tests, invoke a private historical reader, prepare an allocation, or run a provider or Match. No empirical or Phase credit follows from this review.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: Optional failure marker can prevent the mandatory parent terminal

**File:** `scripts/run-v1-38-lean-experiment.ts:307-315` (bounded writer and capacity guard at line 86)

**Issue:** After observing the child `exit`, the parent writes `entry-failure.json` when it received a valid bounded failure receipt, *before* deriving and publishing `child-terminal.json`. The marker uses `exclusive()`, which can throw `RESOURCE` when the failed child's actual owned writes have exhausted the retained-file envelope; it can also throw on a normal exclusive-write error. That throw skips `publishLeanChildTerminal` entirely. Thus the very error path for which the IPC repair was added can leave a known-exited child with an open `pilot-entry` interval and no parent terminal. The new tests cover child cleanup, receipt schema and disconnect, but do not exercise a marker-publication failure through the parent terminal flow.

**Fix:** Make bounded diagnostic-marker publication non-gating. After child exit, authenticate the receipt and preserve any marker failure as an uncertain/failure condition, but guarantee the parent attempts the create-exclusive terminal and interval close regardless of whether `entry-failure.json` could be retained. A terminal-path regression should force the marker writer to fail while asserting that one failed terminal and its time close are still published; never bypass the existing capacity guard to force the optional marker onto disk.

---

_Reviewer: /root/review_265_15_import_crash; narrow source-only review of the fixed commit above._
