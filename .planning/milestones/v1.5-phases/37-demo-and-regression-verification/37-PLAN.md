# Phase 37: Demo and Regression Verification - Plan

## Research Summary

- v1.4 verification artifacts provide the right command/link pattern.
- Final verification must cover generated data, not empty pages.

## Implemented Plan

1. Run format, lint, typecheck, spec, web, and persistence tests.
2. Browser-check Workshop root, tournament, MatchSet result, Strategy card, player profile, and replay pages.
3. Update README with v1.5 demo regeneration commands and non-durable framing.
4. Write local demo report artifacts.

## Verification

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/web test -- workshop-client.test.tsx server.test.ts`
- `pnpm --filter @cowards/persistence test -- workshop.test.ts`
