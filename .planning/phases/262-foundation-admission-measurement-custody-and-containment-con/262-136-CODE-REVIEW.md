---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "136"
reviewed: 2026-08-31T04:27:00Z
reviewed_head: 13dc20a5
subject_commit: 5bbc3dd3c126ab03b69eb5efea1e17d1404b97c5
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts
  - scripts/check-v1-38-plan-262-136-live-v13-custody-v7.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 262 Plan 136: Code Review Report

**Reviewed:** 2026-08-31T04:27:00Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The v7 implementation removes the module cache, reruns the six disposable modes for each public authority-path call, produces byte-identical serialized evidence across distinct roots, and keeps the named effect artifacts absent. However, the stable native-source root is derived from identities for the wrong files. It discards the genuine native custody measured by Plan 133 and substitutes Plan 132 reviewer source/test blobs, so the resulting observation, aggregate, payload, and carrier roots do not cryptographically attest the native files that were actually executed and checked. Plan 137 publication must remain ineligible until a successor binds normalized evidence to the genuine native inputs.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Stable native-source roots attest unrelated reviewer files instead of the genuine native custody

**File:** `scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts:203-218,349-366`

**Issue:** The genuine observation producer measures `scripts/native/v1-38-successor-transaction-helper-v6.c` and `scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c` and returns their host-derived `disposableLocalNativeSourcesRoot`. `copyObservationV7` deliberately discards that root and its paths. `deriveStableV7Roots` then replaces them with the fixed labels `custody/native-sources/source.ts` and `custody/native-sources/test.ts`, but hashes blob IDs `825772...` and `a974a8...`; those blobs belong to `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts` and its test at commit `52d35e...`, not to either measured C file. The actual C blobs at the live subject are `ca6943...` and `99da35...`. Therefore a successful disposable execution is only a control-flow prerequisite: none of the stable native-source bytes commits the actual native paths, content digests, or genuine returned native root. The synthetic native root can remain identical while the underlying custody being claimed is different, and the derived execution, observation, aggregate, payload, and carrier roots launder that disconnect. The existing cross-process test proves equality of the synthetic constants, not cryptographic correspondence to the measured inputs.

**Fix:** Normalize the two genuine native repository paths (or fixed aliases with an explicit authenticated mapping), read and authenticate their exact committed/current bytes during each supplied-root call, and derive the stable native-source root from the normalized path plus a strong digest of each actual file. Include and validate an explicit link from each genuine disposable observation to that normalized digest set before discarding host paths. Add a negative test that swaps the Plan 132 reviewer blobs for the genuine C identities and proves any unrelated blob/path mapping, omitted mapping, or self-consistently recomputed synthetic replacement fails.

## Verification Performed

- Traced Plan 136 observation conversion through the Plan 133 producer and its `LOCAL_NATIVE_PATHS` definition.
- Verified the hard-coded v7 blobs resolve to the Plan 132 TypeScript reviewer/source test, while the measured native paths resolve to different C blobs and SHA-256 content digests.
- Reproduced a source-only call against historical checkout `f66ca641`; it returned deterministic `plan137Eligible:true` even though Plan 136 source was absent. I did not classify this separately because Plan 137 is explicitly responsible for independently pinning exact Plan 136 source/test/summary custody; the result is nevertheless useful evidence that Plan 136's prospective flag is not self-custody proof.
- Confirmed the existing focused suite result recorded in the summary (5 tests, 676 seconds), clean TypeScript/source-only closeout, and clean diff scopes; no redundant full-suite run was needed for the proven identity mismatch.
- Confirmed the Plan 137 trio, retry journal, terminal, reproduction-v17, Route-11 activation, readiness, live, producer, capacity, and downstream effect artifacts remain absent.
- No source file was modified.

---

_Reviewed: 2026-08-31T04:27:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
