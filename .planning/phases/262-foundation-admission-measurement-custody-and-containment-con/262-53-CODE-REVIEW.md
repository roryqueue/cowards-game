---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "53"
reviewed: 2026-08-14T21:57:38Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/lib/v1-38-successor-source-seal.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/check-v1-38-dependency-revision-boundaries.ts
findings:
  critical: 2
  warning: 2
  info: 0
  total: 4
status: issues_found
---

# Phase 262 Plan 53: Code Review Report

**Reviewed:** 2026-08-14T21:57:38Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The source-disposition builder itself derives a detailed expected object from pinned Git commits and rejects value drift by comparing against that object. The final dependency/lifecycle monitor does not preserve those guarantees: it accepts only a shallow selection of fields and excludes the two route-capable modules from policy analysis. As a result, the command that emits `passed_absence` and `downstreamAuthority: denied` can pass despite forged custody evidence or newly introduced authority/live-work code. The mutation suite also leaves much of the promised immutable surface unexercised, and lifecycle carrier checks are unscoped substring searches.

Current-checkout verification completed successfully for the disposition CLI and dependency-boundary CLI. The focused Vitest run reported passing disposition, mutation, schema/absence, and Git-identity cases before the runner output was interrupted; passing checks do not resolve the fail-open paths below.

## Critical Issues

### CR-01 [BLOCKER]: Lifecycle monitor accepts an unverified or forged disposition

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:596-637`

**Issue:** `correctiveDispositionCanonical` does not validate the artifact it labels canonical. It checks a subset of top-level literals, the lengths of the historical ID array, destination names, and only the *format* of `dispositionRoot`. It neither recomputes `dispositionRoot` nor checks exact keys, canonical key ordering, source custody, authorization/seal byte hashes and roots, source-review identity, protected roots, historical ID values/uniqueness, or the empty-ledger roots. `bytes === JSON.stringify(value) + "\n"` only proves that the input is minified in its existing insertion order; it is not a canonical-JSON check. An artifact can therefore replace or delete the immutable evidence fields, supply any syntactically valid root, and still make `planDiscoveryFindings` accept it as lifecycle evidence and allow the CLI to print `passed_absence`.

**Fix:** Use one independent, exact validator for this artifact in the lifecycle monitor. Parse with exact-key validation, derive the expected artifact from pinned A6/B6 Git objects and committed authorization/seal bytes (or invoke a factored read-only validator), compare canonical bytes byte-for-byte, and recompute the domain-separated disposition root. Absence checks should use no-follow `lstat` semantics so dangling symlinks cannot count as absent. For example:

```ts
const actualBytes = readFileSync(target)
const actual = JSON.parse(actualBytes.toString("utf8")) as unknown
const expected = buildV138Plan26247PreExecutionSourceFailureV1(repoRoot)

return actualBytes.equals(Buffer.from(encodeCanonical(expected))) &&
  checkV138Plan26247PreExecutionSourceFailureV1(repoRoot, actual) === expected
```

If independence from the producer module is required, factor the Git/object derivation and canonical root check into a neutral verifier rather than replacing it with shape checks.

### CR-02 [BLOCKER]: Policy scan omits the exact modules that can create route authority and live artifacts

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:576-587`

**Issue:** `changedPolicySources` unconditionally excludes both `scripts/lib/v1-38-current-matrix-reproduction.ts` and `scripts/lib/v1-38-successor-source-seal.ts`. These are the modules containing route execution and artifact writers, and the latter is modified by this plan. Neither their current worktree bytes nor their post-A6 changes are frozen by `protectedInventory`; the disposition only records historical A6 blobs. A later change can add an authority writer, live matrix command, or private-data projection to either excluded file while `analyzeV138DependencyRevisionSources` sees none of it and the boundary CLI still reports a passing denial. This defeats the plan's claim that no executor path can treat the disposition as authority and turns the documented Task 2 deviation into a permanent bypass.

**Fix:** Include both files in policy analysis. Suppress only explicitly identified historical declarations or exact frozen source ranges/byte hashes, and scan all new changes against the baseline. A safe pattern is to maintain a narrow allowlist of `(path, symbol, committed blob SHA-256)` entries and fail when an allowed historical symbol's bytes drift; all other nodes remain subject to `AUTHORITY_WRITER`, `LIVE_WORK_COMMAND`, and privacy checks.

## Warnings

### WR-01 [WARNING]: Mutation tests do not cover most of the promised immutable evidence surface

**File:** `scripts/evaluate-v1-38-successor-route.test.ts:71-99`

**Issue:** The mutation table covers several top-level booleans and counts, but omits `sourceCustody`, authorization/seal byte hashes, `sourceReview`, every `protectedRoots` member, the values and uniqueness of historical charged IDs, both empty-ledger roots, `requiredAcceptedCellCount`, `seal01Status`, `assuranceClass`, `independentCustodyClaimed`, `dispositionRoot`, extra keys, and canonical serialized bytes. The plan explicitly requires mutation of any identity, prior history root, absence, count, boolean, or reason to fail before publication. The current implementation's full expected-object comparison catches many of these today, but the tests would not detect a future validator regression to the same shallow checks used by the lifecycle monitor.

**Fix:** Add table-driven nested mutations for every bound evidence family, plus extra/missing-key and recomputed-root cases. Exercise the serialized artifact and read-only CLI, not just the in-memory builder, and add an exclusive-writer test that proves an existing target is never overwritten.

### WR-02 [WARNING]: Requirements and lifecycle truth are validated by unscoped substring presence

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:291-338`

**Issue:** The monitor accepts each required token if it appears anywhere in an entire Markdown carrier. A stale example, historical paragraph, or duplicated JSON fragment can satisfy the check while the authoritative disposition is missing or contradictory. The same problem affects `next_action`, completed counts, and incomplete-plan arrays in ROADMAP/STATE, so mutually inconsistent current and stale values can coexist while the monitor passes.

**Fix:** Parse one uniquely identified machine-readable status block from each carrier, reject duplicate blocks/keys, validate exact keys and values, and cross-compare the parsed ROADMAP and STATE objects. If Markdown embedding must remain, delimit the authoritative block with a unique schema marker and reject any second occurrence.

---

_Reviewed: 2026-08-14T21:57:38Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
