---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-02T19:30:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - .strategy-lab/league-265-prospective-v11-20261002-a/prepare-data.ts
  - .strategy-lab/league-265-prospective-v11-20261002-a/run-entry.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265: V11 Helper Code Review Report

**Reviewed:** 2026-10-02T19:30:00Z  
**Depth:** standard  
**Files Reviewed:** 2  
**Status:** issues_found

## Summary

Reviewed the V11 data-preparation and entry helpers against their V10 templates, the V11 helper draft, and the active V2 IPC source-gate contract. V11 mode separation, fresh namespace/seed/destinations, source pins, prospective per-Match bound, and fail-closed pending gate pins are preserved. The entry flow has one blocker: stale terminal/failure markers are not rejected before a run, which can leave a completed run represented as failed or incomplete.

## Critical Issues

### CR-01: Reject stale terminal and failure markers before entry

**Classification:** BLOCKER  
**File:** `.strategy-lab/league-265-prospective-v11-20261002-a/run-entry.ts:81-95`
**Issue:** The `run` path checks only `run-entry.json` and the result destination before starting. It does not reject pre-existing `run-entry-terminal.json` or `run-entry-failure.json`. If a terminal marker already exists, the Match can execute and the result can be written at lines 90-93, after which exclusive terminal publication at line 95 throws `EEXIST`. The catch then records failure (unless that marker is also stale), leaving a real result without a valid terminal outcome. A stale failure marker similarly prevents reliable failure publication. `prepare-data.ts:92-96` also omits these marker paths from its fresh-output check, so the normal preparation guard does not establish their absence.

**Fix:** Before opening the result file or creating the exclusive entry marker, reject if any of `run-entry.json`, `run-entry-terminal.json`, `run-entry-failure.json`, or the result destination exists. Include the two terminal-marker paths in the preparation freshness guard as well. Preserve the one-shot/no-retry behavior.

## Warnings

## Info

---

_Reviewed: 2026-10-02T19:30:00Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: standard_
