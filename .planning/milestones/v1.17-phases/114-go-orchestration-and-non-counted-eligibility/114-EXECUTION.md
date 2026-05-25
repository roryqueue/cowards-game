# Phase 114 Execution: Go Orchestration and Non-Counted Eligibility

**Status:** Complete
**Date:** 2026-05-24

## Implemented

- Hardened Go runtime-service strategy validation to accept only registered runtime broker metadata.
- Added non-counted exhibition request support with counted status/reason/explanation fields.
- Preserved counted gates so Python cannot enter counted MatchSet/ranked-style eligibility.
- Updated exhibition UI/client request flow with Counted and Unranked modes.

## Code Review

- Finding: unranked exhibition selection needed to avoid silently weakening counted gates.
- Fix: counted mode still filters to counted-eligible revisions; unranked mode allows experimental valid revisions and marks the MatchSet non-counted.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/web test`
- Browser page smoke: `/exhibitions/new` renders the expected sign-in/account gate without runtime error.

## Result

Phase 114 is complete. Go remains the orchestrator and only invokes runtimes through runtime-service envelopes; Python remains non-counted.
