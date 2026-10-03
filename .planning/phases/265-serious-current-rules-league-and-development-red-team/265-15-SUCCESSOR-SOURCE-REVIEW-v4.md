---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T23:43:04Z
depth: deep
source_commit: c4226fc366e6cd2d55cfa893e0bdfc2b0885910a
source_root: sha256:4eb2980da684c8e876f78fa1e19b8756dbadd526971993045ad1377cc694dc36
source_manifest_entries: 863
author_agent: /root/fixture_265_15_full_verifier
co_author_agents:
  - /root/debug_lean_pilot_ipc_exit
  - /root
reviewer_agent: /root/review_265_15_import_crash
independently_reviewed: true
files_reviewed: 2
files_reviewed_list:
  - scripts/lib/v1-38-lean-child-cli-terminal.ts
  - scripts/run-v1-38-lean-experiment.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 265-15: Finite-stage source re-review

## Summary

The two-file fix preserves exact finite diagnostic codes while changing shared trusted-import and `LEAN_EXPERIMENT_RESOURCE`/`BUFFER_CAP` codes to stage `unknown`. That closes the specific new global-loop misclassification in review v3; unknown private and near-miss errors remain bounded. The unchanged successor accounting findings-free portions of v3 remain in force: 1,362,476 ms, zero charges, a 212,992-byte conservative disk floor, unknown historical peak, immutable v1/v2/v3 lineage and disjoint v4/v5 route. A guarded inert source-manifest recomputation yielded the exact root and 863 entries in frontmatter. Root reports 45 focused tests, types and diff checks passed; I did not rerun them or invoke the historical importer, provider or Match.

One pre-existing global stage assignment still has the same correctness defect. Thus this report is not clean source admission for a diagnostic-purpose entry, and it makes no claim about the consumed v3 failure's cause.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: `PREFIX_CAPACITY` still claims candidate-import stage after a charge

**File:** `scripts/lib/v1-38-lean-child-cli-terminal.ts:53-56,74-79`; affected callsites `scripts/run-v1-38-lean-experiment.ts:100-109,185,201-212,229-236`

**Issue:** The changed helper removes the new global candidate-import loop, but the existing `codeStages` table still maps `LEAN_PILOT_PREFIX_CAPACITY` to `candidate-import`. `trackBuffer()` calls `assertLeanPrefixCapacity()` both before import and after the durable `chargeLeanSlot()`—including inside each provider invocation and after replay retention. Those postcharge checks throw the same `LEAN_PILOT_PREFIX_CAPACITY` literal on a capacity failure. The CLI therefore still records a postcharge failure as precharge candidate import. The new tests cover shared `LEAN_EXPERIMENT_*` resource codes but not this surviving shared `LEAN_PILOT_*` code.

**Fix:** Preserve finite actionable codes but remove global message-to-stage inference unless a trusted callsite explicitly supplies stage provenance; `PREFIX_CAPACITY` must report `unknown` on the current context-free helper path. Apply the same rule to other globally staged literals rather than cherry-picking this one. Add a focused inert regression for the shared code before and after charge. Do not change the capacity checks or infer any historical error cause.

---

_Reviewer: /root/review_265_15_import_crash; narrow source-only re-review at the fixed commit above._
