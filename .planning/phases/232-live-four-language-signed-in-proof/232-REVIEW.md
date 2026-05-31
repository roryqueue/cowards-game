# Phase 232 Review: Live Four-Language Signed-In Proof

## Review Scope

- `apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts`
- `.planning/artifacts/v1.32-four-language-signed-in-proof.json`
- `.planning/artifacts/v1.32-four-language-signed-in-proof.md`

## Findings

No open code findings remain.

## Fixes Made During Review

- Explicitly carried the `cowards_session` cookie from sign-up into signed-in API calls and browser context so the proof reflects a real authenticated session.
- Restarted the proof stack with `COWARDS_PROVIDER_VALIDATION_SECRET` set consistently across runtime-service, Go, and web.
- Updated the exhibition page assertion to current product copy: `Create exhibition`.
- Split the six counted MatchSet creations across two signed-in proof accounts to respect the live five-create-per-hour exhibition anti-abuse limiter.
- Corrected the proof artifact boundary monitor field from an attempted Markdown-as-JSON parse to the canonical boundary proof artifact path.

## Residual Risk

The proof is intentionally local-live rather than hosted production. It exercises the real local web, Go, runtime-service, Postgres, provider validation, worker execution, result pages, replay pages, and browser rendering surfaces, but it does not claim hosted deployment proof.

