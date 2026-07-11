---
phase: 250-counted-entry-and-one-active-revision-enforcement
reviewed: 2026-07-11T13:41:33Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - packages/persistence/src/ladder.ts
  - packages/persistence/src/ladder.test.ts
  - apps/go-backend/live_backend.go
  - apps/go-backend/provider_readiness.go
  - apps/go-backend/provider_readiness_test.go
  - apps/web/lib/account-service-boundary.ts
  - apps/web/lib/public-discovery-service.ts
  - apps/web/lib/public-discovery-service.test.ts
  - packages/persistence/src/account-revisions.ts
  - packages/service/src/index.ts
  - packages/service/src/service.test.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/service.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 250: Code Review Report

**Reviewed:** 2026-07-11T13:41:33Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** clean

## Summary

Re-reviewed only the three findings from the prior Phase 250 review against commit `8d20f56`. All three previously reported issues are resolved. No remaining blocker was found in the re-review scope.

## Resolved Findings

### CR-01: RESOLVED - Different-user concurrent entries can be rejected as duplicate-owner entries

**Original Classification:** BLOCKER
**File:** `packages/persistence/src/ladder.ts`

`enterTrialLadderSeason` now allocates `entry_index` from `max(entry_index) + 1`, retries `23505` collisions whose constraint contains `entry_index`, and only maps owner/revision uniqueness collisions to `already_entered_season` or `replacement_blocked`. `packages/persistence/src/ladder.test.ts` now includes an entry-index race retry test.

### CR-02: RESOLVED - Missing runtime-service engine evidence is promoted to counted-ready in Go

**Original Classification:** BLOCKER
**File:** `apps/go-backend/live_backend.go`, `apps/go-backend/provider_readiness.go`

`accountRevisionInsertFromProviderValidation` no longer synthesizes engine compatibility before readiness classification, and `engineCompatibilityMatches` now rejects nil engine evidence. `apps/go-backend/provider_readiness_test.go` now covers missing engine evidence and expects `incompatible_runtime_metadata` with counted eligibility false.

### WR-01: RESOLVED - Signed-in dashboard projects counted eligibility from runtime semantics instead of persistence eligibility truth

**Original Classification:** WARNING
**File:** `apps/web/lib/public-discovery-service.ts`

The account revision DTO now carries `countedEntryEligibilityCategory` from the stored revision eligibility evaluator, and public discovery uses that category instead of inferring from runtime semantics. The dashboard also checks existing ladder entries for the signed-in handle and maps them to `already_entered_season` or `replacement_blocked` before per-revision eligibility.

## Verification

- `pnpm exec vitest run packages/persistence/src/ladder.test.ts apps/web/lib/public-discovery-service.test.ts packages/service/src/service.test.ts` - passed, 58 tests.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Provider.*Readiness' -count=1` - passed.

---

_Reviewed: 2026-07-11T13:41:33Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
