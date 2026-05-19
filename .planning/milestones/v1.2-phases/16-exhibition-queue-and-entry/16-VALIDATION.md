# Phase 16 Validation

## Coverage
- Browser check: `/exhibitions/new` renders signed-in account revisions and enforces 2-8 selection before enabling creation.
- Unit coverage: pairwise matrix generation creates mirrored matches for same-user entrants.
- Full gates: `pnpm typecheck`, `pnpm test`, `pnpm format:check`, `pnpm lint`, `pnpm build`, `pnpm e2e:smoke`, `pnpm e2e:visual`.

## Verdict
PASS.
