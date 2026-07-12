---
phase: 250-counted-entry-and-one-active-revision-enforcement
verified: 2026-07-11T13:42:00Z
status: passed
score: 6/6 must-haves verified
gaps: []
human_verification: []
---

# Phase 250 Verification

**Goal:** Counted trial entry accepts only current immutable account-owned provider-proof-valid revisions, enforces one entry per Player per Season, and remains separate from exhibitions.

## Verified Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | TypeScript, Python, Rust, and Zig can enter with current immutable provider/runtime/engine evidence. | VERIFIED | Spec, persistence, and Go readiness matrices pass. |
| 2 | Stale/missing/mismatched proof, unsupported/TinyGo lanes, invalid/mutable revisions, unavailable runtimes, package/capability policy, ownership, and Season state fail closed. | VERIFIED | `competition-entry-eligibility.test.ts`, `ladder.test.ts`, and `provider_readiness_test.go`. |
| 3 | Public rejections are category-shaped and leak-safe. | VERIFIED | Ladder route tests and canonical public copy contract; policy scanner passes. |
| 4 | One owner entry per Season and no replacement are enforced, including owner and entry-index race handling. | VERIFIED | Database uniqueness, preflight, constraint-specific fallback, and retry tests. |
| 5 | Signed-in discovery consumes stored eligibility categories and existing Season entry state rather than React/runtime-label inference. | VERIFIED | Account service DTO, discovery service, and focused tests. |
| 6 | Same-player self-play and multiple revisions remain exhibition-only with no trial standings impact. | VERIFIED | Exhibition UI/API copy, route response, route test, and pairwise matrix test. |

## Automated Evidence

- `pnpm exec vitest run packages/spec/src/competition-entry-eligibility.test.ts packages/persistence/src/ladder.test.ts 'apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts' apps/web/lib/public-discovery-service.test.ts packages/persistence/src/competition.test.ts apps/web/app/api/exhibitions/route.test.ts` - 59 tests passed before review fixes; the post-fix focused set expanded to 74 passing tests.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1` - passed.
- `pnpm v1.36:competition-policy:check` - passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` - passed after the Phase 250 web-test boundary correction.
- `250-REVIEW.md` - clean after re-review; zero remaining findings.

## Boundaries

- No Strategy execution moved into web/API/Go.
- No game-rule, durable-rating, package-ecosystem, TinyGo-production, or production-sandbox claim was added.
- Public/default projections exclude source, memory, objectives, proof material, artifact bytes, paths, environment values, tokens, database details, private runtime internals, and operator-only data.

## Result

Phase 250 passes all ELIG-01 through ELIG-06 requirements with no open verification gaps.
