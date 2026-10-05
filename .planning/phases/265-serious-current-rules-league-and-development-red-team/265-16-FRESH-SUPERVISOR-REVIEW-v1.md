---
phase: 265
plan: "16"
reviewed: 2026-10-05T12:29:46Z
depth: deep
author_agent: /root/execute_265_supervisor_routes_reader
reviewer_agent: /root/review_265_fresh_supervisor_v3
source_commit: c107648fd0497b246ec0f008408473645931983b
source_manifest: sha256:c83a6c559dfc6b89089bd9bcd717000ba5758272cec57cc0cda71cf54388913c/886entries
files_reviewed: 10
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.test.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-baseline-source.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-authority.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
empirical_started: false
---

# Phase 265 Plan 16: Fresh Supervisor v3 Code Review

**Reviewed:** 2026-10-05
**Depth:** deep, scoped cross-file review
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the frozen source commit and traced v3 route selection, request/allocation admission, time and disk carry, retained-check gating, source-manifest closure, and the three real publisher/issuer consumers. One blocker remains: the v3 setup witness is a required writable retained artifact but is omitted from predecessor survivor inventory, so the cumulative disk charge is understated. This review did not run tests or any empirical workflow.

## Critical Issues

### CR-01: V3 setup witness is omitted from cumulative disk inventory (BLOCKER)

**File:** `scripts/run-v1-38-lean-correction.ts:319`
**Issue:** `inspectLeanFreshSupervisorPredecessor` inventories the prior v2 setup witness (`LEAN_SUPERVISOR_SETUP_WITNESS`) but not the fresh v3 witness at `LEAN_FRESH_SUPERVISOR_SETUP_WITNESS`. That v3 witness is a required retained file: `readLeanSupervisorSetupWitness("v3")` reads it and `leanWritablePaths` includes `LEAN_FRESH_SUPERVISOR_SETUP_PATH`. Consequently both the v3 diagnostic predecessor and the later baseline carry can omit its allocated bytes from `survivors` and `allocatedDiskBytes`, allowing capacity admission to undercount cumulative retained disk against the 15GB ceiling.
**Fix:** Include the exact v3 witness identity in the predecessor inventory alongside the v2 witness, and add a focused regression asserting its allocated blocks appear exactly once in both diagnostic and baseline carry (including nested/alias protections).

---

_Reviewed: 2026-10-05_
_Reviewer: /root/review_265_fresh_supervisor_v3_
_Depth: deep_
