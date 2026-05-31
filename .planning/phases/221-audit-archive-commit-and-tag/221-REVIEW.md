# Phase 221 Review

**Status:** Passed after fixes
**Scope:** v1.31 public discovery DTOs, service reads, site shell, public routes, cross-links, privacy monitors, and journey proof.

## Findings Fixed

1. **Unsafe public hrefs could validate and render.** Fixed by adding safe relative href validation to public discovery schemas, extending tests, validating rendered hrefs in Playwright, and checking Go public ladder result/replay links through the existing public read guard.
2. **Exhibition detail aggregated unrelated fixture MatchSets.** Fixed by carrying preset identity on discovery MatchSet cards and filtering competition detail to the requested exhibition preset.
3. **One configured ladder read failure could break discovery.** Fixed by switching configured ladder aggregation to `Promise.allSettled`.
4. **Boundary monitor coverage missed route/component surfaces.** Fixed by expanding `scripts/check-public-discovery-boundary.ts` and the v1.31 Playwright privacy marker scan.
5. **Merged baseline surface inventory drifted.** Fixed by regenerating v1.16 TypeScript backend inventory and final surface labels, then rerunning `pnpm boundary:monitors`.

## Residual Risk

- Live signed-in account creation and live competition entry still depend on local Go/auth/database services. v1.31 proves the signed-in entry dashboard at the service level and the anonymous sign-in gate in browser proof; a fully live signed-in entry-to-result proof remains a future environment-dependent run.

## Boundary Decision

Discovery APIs remain separate from `match-execution-app-v1`; no execution DTO fields or execution behaviors were changed for v1.31.
