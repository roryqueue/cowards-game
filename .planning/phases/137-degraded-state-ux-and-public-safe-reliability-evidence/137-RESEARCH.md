# Phase 137: Degraded-State UX and Public-Safe Reliability Evidence - Research

**Status:** Complete
**Date:** 2026-05-25

## Sources Read

- `apps/web/app/matchsets/[matchSetId]/page.tsx`
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx`
- `apps/web/app/matches/types.ts`
- `packages/spec/src/competition.ts`
- `packages/spec/src/schemas.ts`
- `packages/persistence/src/competition.ts`
- `apps/web/e2e/v1-19-exhibition-proof.spec.ts`

## Findings

- MatchSet result pages already expose `data-testid="matchset-evidence-panel"` and runtime labels.
- Replay pages already expose `data-testid="replay-evidence-panel"` and public/owner replay mode.
- Public MatchSet DTOs expose MatchSet status, per-Match status, public reason, entrant runtime metadata, and publication privacy exclusions.
- Replay DTOs do not carry MatchSet/job status or runtime-service diagnostics, so replay reliability copy must stay generic and public-safe.
- Existing tests mostly exercise server/client helpers rather than component rendering; a pure evidence-copy helper fits the local test style.

## Implementation Direction

- Add a pure MatchSet/replay reliability evidence helper.
- Reuse existing evidence panels and details grids.
- Add compact rows for state, retry policy, timeout budget, candidate lane, proof limits, and privacy.
- Avoid exposing source, memory, objective payloads, env values, host path values, package paths, raw streams, stderr, stack traces, tokens, DB DSNs, sessions, or private runtime internals.
