# Research Summary: v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence

**Project:** Coward's Game
**Milestone:** v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence
**Date:** 2026-05-23
**Confidence:** HIGH for Workshop test-summary and analytics-compare read migration; HIGH for live Go evidence-only validation; MEDIUM for exact report-only count reduction until implementation proves dependency cleanup.

## Executive Recommendation

v1.11 should continue service-boundary debt reduction from the live baseline of `strict_offenses=0 report_only_offenses=30`. Most remaining offenses are writes, source-bearing owner reads, replay owner-debug/private Chronicle assembly, or mixed Workshop source/runtime/export surfaces. The safest selected slice is Workshop test-summary GET plus Workshop analytics-compare GET behind `@cowards/service`, with source-free type cleanup only where DTO ownership is proven.

Live Go readiness is mature enough to require as validation evidence, but not mature enough for production promotion. Require Go parity, boundary monitors, and required live Go topology evidence, while keeping production web traffic on the TypeScript service path.

## Selected v1.11 Scope

- Re-baseline and classify all 30 remaining broad web report-only offenses before implementation.
- Move `GET /api/workshop/tests/{matchSetId}` behind a spec/service-owned source-free test-summary DTO.
- Move `GET /api/workshop/analytics/profiles/{profileId}/compare` behind a spec/service-owned comparison DTO.
- Promote only proven migrated files and source-free type cleanup to strict import enforcement.
- Require live Go readiness evidence with no production Go routing or ownership promotion.

## Explicit Non-Goals

- Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence writes, Strategy source retrieval, or Strategy execution.
- Production web routing to Go or silent TypeScript fallback during required Go validation.
- Production hostile-code sandbox promotion or counted non-JS play.
- Workshop source retrieval, source save, validation/test execution, test launch, analytics rerun, profile save, or export migration.
- Full replay projection, owner-debug replay migration, private Chronicle assembly, or replay fixture rewrite.
- Rule, Chronicle, scoring, terminology, engine, or deterministic runtime semantics changes.

## Validation Commands

Expected milestone gate:

```bash
pnpm contract:check
pnpm contract:lint
pnpm boundary:imports
pnpm --filter @cowards/spec test
pnpm --filter @cowards/service test
pnpm --filter @cowards/web test
pnpm typecheck
pnpm go:parity
pnpm boundary:monitors
pnpm topology:check -- --require-go --json
pnpm e2e:smoke
pnpm format:check
git diff --check
```

Expected outcomes:

- `strict_offenses=0`.
- `report_only_offenses` drops below 30 through real fingerprint removal.
- Public/service/Go/topology/monitor outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- Live Go evidence is required for validation but does not route production web traffic to Go.
- Runtime isolation and non-JS remain evidence-only/non-counted.

## Key Risks

- Migrating Workshop reads through a new broad facade without reducing direct persistence debt.
- Accidentally moving Workshop launch, source, rerun, export, or runtime behavior under the read DTO work.
- Treating replay as a low-risk read surface even though the remaining replay imports touch private Chronicle and owner-debug assembly.
- Treating live Go evidence as production promotion.
- Letting required Go validation silently fall back to TypeScript when Go is unavailable or divergent.
