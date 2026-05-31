# Phase 232 Plan: Live Four-Language Signed-In Proof

## Goal

Prove that JS/TS, Python, Rust, and Zig are not label-only promotions: they can be saved by signed-in users, enter counted MatchSet paths, execute through provider-owned runtime boundaries, and render public-safe result/replay evidence.

## Work Items

1. Add a dedicated Playwright proof runner for v1.32 four-language signed-in flows.
2. Configure the live local proof stack with Postgres, runtime-service, Go backend, Next web, and shared provider validation secret.
3. Save valid TypeScript, Python, Rust, and Zig Strategy Revisions through signed-in Account APIs.
4. Create six counted pairwise MatchSets: TypeScript/Python, TypeScript/Rust, TypeScript/Zig, Python/Rust, Python/Zig, Rust/Zig.
5. Run internal worker iterations until MatchSets settle.
6. Verify result pages, replay pages, privacy scans, board realism, and desktop/mobile layout.
7. Write `.planning/artifacts/v1.32-four-language-signed-in-proof.json` and `.planning/artifacts/v1.32-four-language-signed-in-proof.md`.
8. Update Phase 232 GSD docs and milestone state.

## Verification

- `PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop --workers=1 apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts` should skip unless `RUN_V1_32_PROOF=1` is set.
- The live proof command with `RUN_V1_32_PROOF=1`, Go/runtime URLs, internal token, and provider validation secret must pass.
- Generated proof artifacts must record provider ids, ABI posture, counted eligibility, pairwise coverage, privacy scan, boundary monitor reference, board realism canvas evidence, and non-claims.

## Risks

- Missing provider validation secret makes non-TypeScript saves fail through runtime-service validation.
- Local proof can be rate-limited by real exhibition anti-abuse controls.
- Replay proof must inspect a nonblank canvas and accessible replay board state, not only route reachability.

