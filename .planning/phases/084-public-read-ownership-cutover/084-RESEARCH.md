# Phase 84 Research: Public Read Ownership Cutover

## Findings

- Public route contracts: `getPublicStrategyPage`, `getPublicPlayerPage`, `getPublicLadderSeason`, `getPublicMatchSetSummary`, and `getPublicReplayMetadata`.
- TypeScript reference builders: `packages/persistence/src/profiles.ts`, `packages/persistence/src/ladder.ts`, `packages/persistence/src/competition.ts`, and `packages/service/src/index.ts`.
- Existing web switch only covers public Strategy reads through `apps/web/lib/public-service-adapter.ts` and `apps/web/lib/public-go-read-client.ts`.
- Public output privacy denylist is already enforced in TypeScript schemas and Go fixture validation.

## Implementation Notes

- Extend Go live handlers to all selected public read routes.
- Generalize the web Go read client and adapter to route-family ownership.
- Preserve fail-closed no-fallback behavior for selected Go routes.
- Keep replay scope to metadata only.

