---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-23T22:01:24Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 262-60: Code Review V7

**Reviewed:** 2026-08-23T22:01:24Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The immutable Git identity work closes V6 CR-01. Production now pins V3, V4, and V5 bases/tips, ordered commits, trees, parents, per-commit paths, final modes/blobs/SHA-256/lengths, and all three documentation carriers. The copied-trailer/full-chain attack rejects, every manifest-field mutation rejects, carrier substitution rejects, and the current V6 run remains externally derived from base `b1352f7e` to source `704eed00`. The analyzer consumes the same production custody result.

One robustness defect remains: the exported object described and consumed as the immutable predecessor manifest is only shallow-frozen. Its nested layer objects, commit/blob tuples, and carrier tuples remain writable at runtime. A different importer can therefore alter the process-wide production trust anchor before custody inspection.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The exported immutable predecessor manifest is mutable below its top level

**Classification:** WARNING
**File:** `scripts/lib/v1-38-successor-source-seal.ts:5812-5840`
**Issue:** `Object.freeze()` is applied to the manifest object and the outer `layers` and `carriers` arrays only. The layer records, each layer's `commits` and `blobs` arrays, every tuple, each commit path array, every carrier tuple, and carrier blob arrays are not frozen. `inspectV138PinnedPredecessorManifest()` uses this same exported object as its default production trust anchor at lines 5850-5852.

Direct runtime inspection produced:

```text
manifest=true, layers=true, layer=false, commits=false,
commitTuple=false, blobs=false, carrierArray=true,
carrierTuple=false, carrierBlobs=false
```

Assigning `V138_PLAN_262_60_PREDECESSOR_MANIFEST.layers[0].authorRun = "runtime-mutated"` through an untyped reference succeeded. This does not require changing a Git object or filesystem artifact; any module importing the exported reference can cause custody false failures or replace nested expected fields before production validation. The existing mutation test clones the manifest with JSON first, so it proves field comparisons but does not detect mutability of the actual process-wide trust anchor.

**Fix:** Keep a private recursively frozen manifest as the value used by production, and export either the same deeply frozen value or a read-only cloned projection. Freeze every nested record, array, tuple, and path/blob collection. Add a regression test that recursively asserts `Object.isFrozen()` for the production manifest and verifies attempted nested assignments cannot change any value before a successful custody check.

## Prior Finding Disposition

- **V6 CR-01 — closed:** exact pinned predecessor commit and carrier identities reject copied trailers, extra prior-run commits, correction copies, and substituted carrier histories.
- **V5 CR-01 — closed:** every predecessor-to-successor gap is exactly the pinned single carrier, and protected source tree entries remain equal across it.
- **V4 WR-01 — closed:** helper signal cleanup preserves unrelated listeners, unregisters owned hooks, remains idempotent, and creates no new temp leak.
- **V3 CR-01/02/03/04 and WR-01 — closed:** shared current-run identity, real disposable B9 execution, provider-seam tool observation, deletion lineage, and helper lifecycle remain covered by the passing suite.
- Static route metadata remains separated from disposable synthetic-B9 execution evidence, and canonical/live destinations remain absent.

## Verification Evidence

- Full serialized focused suite: 2 files and 35 tests passed in 251.30 seconds.
- Full copied-trailer/forged-carrier/correction-copy attack rejected.
- Every predecessor manifest identity-field mutation rejected; the exact pinned positive manifest passed.
- Direct production custody resolved V3 tips/commits, V4, V5, all three exact carriers, and externally supplied current V6 base/source `b1352f7e..704eed00`.
- `pnpm exec tsc --noEmit --pretty false` — passed.
- `pnpm typecheck` — 27/27 Turbo tasks passed.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` — passed with `findingCount: 0`, `matrixAdmissionStatus: blocked`, and `downstreamAuthority: denied`.
- Pre/post `v138-openat-*` inventories were identical.
- Canonical review/report, authorization/seal, route-start, preflight, calibration, reproduction, and terminal destinations remained absent.
- No source or canonical/live-state file was modified. Only this V7 report was added; pre-existing untracked review reports were preserved.

---

_Reviewed: 2026-08-23T22:01:24Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
