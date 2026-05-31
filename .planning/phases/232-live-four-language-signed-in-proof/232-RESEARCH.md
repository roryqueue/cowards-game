# Phase 232 Research: Live Four-Language Signed-In Proof

## Sources Reviewed

- `.planning/phases/232-live-four-language-signed-in-proof/232-CONTEXT.md`
- `.planning/REQUIREMENTS.md` `PROOF-01..PROOF-05`
- `.planning/ROADMAP.md` Phase 232 success criteria
- `apps/web/e2e/v1-23-multi-compiler-exhibition-proof.spec.ts`
- `apps/web/e2e/workshop-to-replay.spec.ts`
- `apps/web/app/exhibitions/new/page.tsx`
- `apps/runtime-service/src/server.ts`
- `apps/go-backend/live_backend.go`
- `.planning/artifacts/v1.32-drift-monitor-boundary-proof.md`

## Findings

- Existing proof specs already had the right shape for signed-in account creation, revision save, MatchSet creation, worker execution, result/replay rendering, privacy scans, and proof artifact output.
- v1.32 provider validation requires `COWARDS_PROVIDER_VALIDATION_SECRET` to be configured consistently for runtime-service, Go, and any persistence eligibility checks.
- The live Go backend enforces a five-exhibition-create-per-hour per-account limiter. The six-pair proof must respect this by spreading pairwise MatchSets across two fresh signed-in proof accounts.
- The current exhibition route heading is `Create exhibition`; older proof expectations using `New exhibition` were stale.
- Public result and replay pages already expose the evidence panels needed to verify provider-compatible runtime evidence, WASI Preview 1 stdin/stdout JSON posture, and no broad sandbox-certification claim.

## Research Decision

Proceed with a dedicated v1.32 Playwright proof that creates two signed-in accounts, saves JS/TS, Python, Rust, and Zig Strategy Revisions for each account, creates all six cross-language counted MatchSets, runs the live worker, verifies public result/replay pages, checks mobile and desktop layout, scans public output for private markers, and writes JSON/Markdown proof artifacts.

