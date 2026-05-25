# Phase 138 Code Review

**Status:** Findings fixed
**Date:** 2026-05-25

## Findings

### Fixed: Proof artifact recorded creation-time `queued` status

The first passing proof opened result and replay pages, but stored the exhibition creation response status. The proof now fetches the public MatchSet DTO after result-page evidence renders and records observed MatchSet and Match statuses.

### Fixed: Proof accepted replay-visible but still-running sibling Matches

The stricter proof caught a MatchSet with one complete Match and one running Match. The proof now settles MatchSets with bounded polling and only records success after all observed Match statuses are terminal and complete.

### Fixed: Go Match job lease was shorter than the runtime-service HTTP budget

Live Python-vs-Python proof exposed a real reliability bug: Go claimed jobs with a 30s lease while the runtime-service HTTP budget was 90s. Long Python executions could complete after the lease expired, causing Go completion to fail and retry until `failed_system`.

The fix adds `matchJobLeaseForRuntimeService()`, using the runtime-service HTTP timeout plus grace while preserving the default minimum lease. A Go test covers the budget relationship, and the boundary monitor checks the source and test.

### Fixed: Repeated proof reused revision tuples and hit active duplicate guardrails

The proof now creates a fresh account and fresh immutable revision set per bounded cycle. This keeps the product duplicate-exhibition guardrail intact and still exercises the required one JS/TS plus two Python revision flow in every cycle.

## Follow-Up Verification

- `pnpm --filter @cowards/web typecheck` passed.
- `PATH=/usr/local/go/bin:$PATH go test ./...` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts apps/web/app/matchsets/evidence-copy.test.ts` passed.
- Final signed-in proof passed with six complete MatchSets.
