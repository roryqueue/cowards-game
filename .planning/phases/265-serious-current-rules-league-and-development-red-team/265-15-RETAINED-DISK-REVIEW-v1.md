---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T21:54:05Z
depth: deep
source_commit: 7d4eda7f6bce1be3a5c1973b3552e26067bba5dd
source_root: sha256:313faa36a7780bef52cf9c48996a61e778aeaaddc7a06ca6e88ca34fe6b13b23
source_manifest_entries: 862
author_agent: /root/fixture_265_15_full_verifier
reviewer_agent: /root/review_265_15_import_crash
independently_reviewed: true
files_reviewed: 4
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-experiment.test.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-experiment.sh
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265-15: Retained-disk amendment source review

## Summary

The amendment keeps the old historical peak unknown and the old numeric historical-bound route closed. Its prospective basis separately binds the approved disk decision, six surviving file identities and allocated blocks, and the new writable destinations; the time approval and 15 GB total disk/12 GB retained-file/28,800,000 ms/300-Match ceilings remain distinct. The prospective source manifest was computed through the inert import only, yielding the root in the frontmatter. Author-reported 27 focused tests and types passed; I did not rerun tests, launch preparation, read private historical artifacts, or execute a provider or Match.

The new allocation cannot yet be admitted for a pilot: one code defect allows prospective disk writes before enforcing the approved cumulative retained-file ceiling. This is repairable within the approved policy, not a request for another human resource decision. No claim is made about historical peak, live peak memory, empirical feasibility, or Phase passage.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: New store can be published before the cumulative disk-capacity check

**File:** `packages/strategy-lab/src/league/lean-experiment.ts:323-329`; caller `scripts/run-v1-38-lean-experiment.ts:144-157`

**Issue:** For v2, `createLeanLedger` checks the surviving-file basis, then creates the new store directory and writes `allocation.json`, `ledger.ndjson`, and `time.ndjson` without checking `cumulativeLeanPhysicalBytes`, existing owned temp/request/canonical files, or a pre-publication reserve. The runner checks capacity on the canonical allocation write only *after* this store creation. If existing prospective-owned files already bring the surviving total near the 12,000,000,000-byte retained-file ceiling, these exclusive store writes can cross it before the later check fails, leaving a partially created store. The tests cover the destination list and pure accounting, but do not assert near-cap store creation is denied before any write.

**Fix:** For v2 only, conservatively preflight surviving allocated bytes plus all existing prospective-owned destinations and projected store directory/three-file blocks (including the publication reserve) before `mkdirSync`. Guard each ensuing publication against the cumulative ceiling or use a shared bounded writer, and add a synthetic near-cap fixture asserting failure leaves the new store absent. Preserve the legacy v1 path. The same preflight should honor available filesystem capacity without substituting free space for the retained-byte cap.

---

_Reviewer: /root/review_265_15_import_crash; source-only review at the fixed commit above._
