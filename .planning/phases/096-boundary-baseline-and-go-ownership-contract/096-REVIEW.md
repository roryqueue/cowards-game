---
phase: 096-boundary-baseline-and-go-ownership-contract
reviewed: 2026-05-24T02:25:03Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .planning/artifacts/v1.15-boundary-baseline.md
  - .planning/artifacts/v1.15-lifecycle-ownership-manifest.json
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
findings:
  critical: 3
  warning: 2
  info: 0
  total: 5
status: issues_found
---

# Phase 096: Code Review Report

**Reviewed:** 2026-05-24T02:25:03Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 96 adds the v1.15 baseline, lifecycle manifest, and boundary monitor extension. Fixes are needed before this phase should be accepted: the monitor has false negatives for privacy denylist drift, runtime ownership expansion, and report-only baseline drift. The human baseline also misses concrete report-only offense references required by the phase plan.

Verification run during review:

- `pnpm exec tsc --noEmit --pretty false` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm boundary:imports` reported `strict_offenses=0 report_only_offenses=29`.

## Critical Issues

### CR-01: BLOCKER - v1.15 privacy denylist is not validated

**File:** `scripts/check-boundary-monitors.ts:888`
**Issue:** `validateV115LifecycleOwnershipManifest()` never checks `manifest.publicOutputForbiddenByDefault`. The public-safe projection at lines 888-907 omits that field entirely, and the test fixture sets `publicOutputForbiddenByDefault: []` at `scripts/check-boundary-monitors.test.ts:37` while still expecting validation to pass. This means the manifest can silently drop Strategy source, StrategyMemory, SoldierMemory, objective payloads, tokens, host paths, DB DSNs, or private runtime internals from the Phase 96 privacy contract without monitor failure.
**Fix:**
```ts
const requiredPublicOutputForbidden = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "owner debug",
  "raw Awareness Grid",
  "stack traces",
  "stderr",
  "sessions",
  "tokens",
  "host paths",
  "DB DSNs",
  "private runtime internals",
] as const

for (const marker of requiredPublicOutputForbidden) {
  if (!manifest.publicOutputForbiddenByDefault.includes(marker)) {
    throw new Error(`v1.15 public-output denylist missing ${marker}`)
  }
}
```
Update the test fixture to contain the required entries and add a negative test that removing one entry throws.

### CR-02: BLOCKER - runtime-only surfaces can drop most DB ownership prohibitions

**File:** `scripts/check-boundary-monitors.ts:846`
**Issue:** The runtime-only guard uses `.some(...)`, so a runtime-only surface passes if it contains any one of `db_job_claiming`, `match_completion`, `chronicle_persistence`, `matchset_scoring`, or `product_api_fallback`. That is a false negative against the Phase 96 requirement that TypeScript runtime-only surfaces must not claim jobs, complete Matches, persist Chronicles, score MatchSets, or act as product API fallback. I confirmed a mutated manifest with `runtimeExecutionService.disallowedScopes = ["db_job_claiming"]` still passes validation.
**Fix:**
```ts
const requiredRuntimeOnlyDisallowedScopes = [
  "db_job_claiming",
  "match_completion",
  "chronicle_persistence",
  "matchset_scoring",
  "product_api_fallback",
] as const

if (surface.typeScriptRole === "runtime_only") {
  for (const scope of requiredRuntimeOnlyDisallowedScopes) {
    if (!surface.disallowedScopes.includes(scope)) {
      throw new Error(`${surface.surfaceId} missing runtime-only prohibition ${scope}`)
    }
  }
}
```
Add a focused test that removes each required runtime-only prohibition and expects validation failure.

### CR-03: BLOCKER - live report-only baseline count is not enforced

**File:** `scripts/check-boundary-monitors.ts:1089`
**Issue:** `checkWebBoundary()` rejects unknown report-only offense keys, but it never verifies that the live report-only count still equals the v1.15 baseline of 29. `validateV115LifecycleOwnershipManifest()` checks only the manifest's declared number at lines 765-770, not the actual `analyzeServiceBoundaryImports()` result. This allows baseline drift to pass the boundary monitor without explicit rebaseline evidence, contrary to BASE-05 and the Phase 96 plan's `strict_offenses=0 report_only_offenses=29` monitor requirement.
**Fix:**
```ts
if (analysis.reportOnlyOffenses.length !== knownReportOnlyBoundaryOffenses.size) {
  throw new Error(
    `report-only offense baseline drifted: expected ${knownReportOnlyBoundaryOffenses.size}, got ${analysis.reportOnlyOffenses.length}`,
  )
}
```
Also add a test for report-only baseline count drift; the Phase 96 plan explicitly asked for this coverage.

## Warnings

### WR-01: WARNING - mixed DB-completing owner prohibitions can be removed from lifecycle surfaces

**File:** `scripts/check-boundary-monitors.ts:858`
**Issue:** The per-surface mixed-owner check is effectively dead because `mixedDbCompletingOwnersAllowed` is already required to be `false` at lines 777-779. If `matchJobLifecycle` or `matchCompletion` removes `mixed_db_completing_owners` from `disallowedScopes`, validation still passes. I confirmed a mutated manifest with that prohibition removed from `matchCompletion` still passes. That weakens the machine-readable ownership contract Phase 97 needs for no-mixed-DB-completing-owner enforcement.
**Fix:** Require selected Go DB lifecycle surfaces to include `mixed_db_completing_owners` in `disallowedScopes`, then test removal from each DB-claim/completion surface.

### WR-02: WARNING - baseline artifact omits concrete report-only offense references

**File:** `.planning/artifacts/v1.15-boundary-baseline.md:57`
**Issue:** The baseline says there are 29 broad web report-only offenses and lists only broad areas. Phase 96 requires concrete code references for report-only direct persistence offenses, but the human-readable artifact does not list the 29 file/line references or stable offense keys. Developers cannot inspect the actual baseline from this artifact without reading the script.
**Fix:** Add a table or appendix with the 29 current report-only offense paths, line numbers, forbidden pattern, and import statement, matching the monitor baseline.

---

_Reviewed: 2026-05-24T02:25:03Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_

## Resolution

All findings were fixed in the Phase 96 implementation:

- CR-01: `validateV115LifecycleOwnershipManifest()` now requires every public-output denylist marker and has a negative fixture test.
- CR-02: runtime-only surfaces now require every DB/API ownership prohibition, with a negative fixture test.
- CR-03: `checkWebBoundary()` now fails on live report-only baseline count drift, covered by `assertReportOnlyBoundaryOffenseCount()`.
- WR-01: DB lifecycle surfaces now require explicit `mixed_db_completing_owners` prohibitions.
- WR-02: the human baseline now includes the 29-offense report-only appendix with file, line, pattern, and import evidence.

Verification after fixes:

- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts`
- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `git diff --check`
