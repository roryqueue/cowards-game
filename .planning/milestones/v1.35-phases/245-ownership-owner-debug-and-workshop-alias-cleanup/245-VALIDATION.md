# Phase 245 Validation

**Status:** Passed

## Automated Checks

| Command | Result |
| --- | --- |
| `pnpm exec vitest run scripts/evaluate-v1-35-ownership-alias-proof.test.ts` | Passed, 6 tests |
| `pnpm v1.35:ownership-alias-proof:check` | Passed |
| `pnpm --filter @cowards/web exec vitest run app/matches/server.test.ts app/matches/[matchId]/replay/owner-debug.test.ts app/workshop/workshop-client.test.tsx app/api/workshop/source/route.test.ts app/api/workshop/revisions/[revisionId]/source/route.test.ts app/api/workshop/revisions/route.test.ts app/api/workshop/validate/route.test.ts` | Passed, 60 tests |
| `pnpm exec vitest run tests/phase-105-selected-go-route-behavior.test.ts apps/web/lib/account-service-adapter.test.ts scripts/evaluate-v1-35-ownership-alias-proof.test.ts` | Passed, 18 tests |
| `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Owner\|Test.*Auth\|Test.*Route\|Test.*Source\|Test.*PublicResponses\|TestAnalyticsRunSummary' -count=1` | Passed |

## Requirement Coverage

- `AUTH-01`: local Workshop identity cannot authorize owner-private replay; account/entry routes remain session-backed.
- `AUTH-02`: account source path remains server session plus Go owner join plus private/no-store response.
- `PRIV-01`: owner-debug requires server-side authorization; query params alone stay public.
- `PRIV-02`: public/default replay and alias responses omit private markers.
- `API-01` / `API-02`: source aliases are deprecated with explicit public-safe 410 migration errors.
- `API-03`: retained Workshop routes remain local-only and covered by provider-proof/privacy tests.
