# Phase 232 Verification: Live Four-Language Signed-In Proof

## Commands

| Command | Result |
| --- | --- |
| `PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop --workers=1 apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts` | Passed: skipped without `RUN_V1_32_PROOF=1` |
| `RUN_V1_32_PROOF=1 PLAYWRIGHT_TEST=1 PLAYWRIGHT_BASE_URL=http://localhost:3000 DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game COWARDS_GO_BACKEND_OWNER=go COWARDS_GO_BACKEND_URL=http://127.0.0.1:8087 COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 COWARDS_GO_BACKEND_INTERNAL_TOKEN=v132-proof-token COWARDS_RUNTIME_SERVICE_PROOF_ADAPTER=worker-thread COWARDS_PROVIDER_VALIDATION_SECRET=cowards-provider-validation-proof-v1.32 pnpm exec playwright test --project=desktop --workers=1 apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts` | Passed: 1 test |

## Live Stack

- Runtime-service: `http://127.0.0.1:3107`
- Go backend: `http://127.0.0.1:8087`
- Web: `http://localhost:3000`
- Database: local Postgres `cowards_game`
- Provider validation secret: configured consistently for runtime-service, Go, and web during proof.

## Evidence

- `.planning/artifacts/v1.32-four-language-signed-in-proof.json`
- `.planning/artifacts/v1.32-four-language-signed-in-proof.md`

## Result

Pass. The proof created six counted MatchSets, ran worker execution, verified complete Matches, rendered result and replay pages, scanned public output, and checked replay board realism.

