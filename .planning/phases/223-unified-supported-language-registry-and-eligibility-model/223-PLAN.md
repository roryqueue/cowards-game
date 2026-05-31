# Phase 223 Plan: Unified Supported Language Registry and Eligibility Model

## Objective

Establish one shared supported-language source of truth for JS/TS, Python, Rust, and Zig while keeping runtime promotion evidence-gated.

## Tasks

1. Add a richer supported-language registry in `@cowards/spec`.
   - Include provider id, source format, runtime target, adapter id, support status, promotion status, counted/entry eligibility, public labels, policies, docs refs, examples refs, deterministic restrictions, and privacy rules.
   - Derive the existing lightweight language registry from the new model so existing runtime callers continue to work.

2. Route product label helpers through the shared registry.
   - Update `apps/web/lib/runtime-labels.ts` to consume spec-level registry helpers instead of directly branching on Python/Rust/Zig.
   - Preserve current public labels until later promotion phases complete proof.

3. Add tests for the new source of truth.
   - Spec test proves all five languages have complete records and adapter/provider coverage.
   - Web test proves label helper output is registry-derived and current labels remain stable.

4. Review and validate.
   - Run focused code review.
   - Run spec tests/typecheck and web typecheck/tests.

## Non-Goals

- Do not flip Python/Rust/Zig counted eligibility yet.
- Do not change runtime-service dispatch, ABI, provider execution behavior, Workshop save behavior, Go backend eligibility, public evidence shape, or monitors in this phase.
- Do not rewrite historical non-promotion artifacts.

## Verification

- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/spec build`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/web test -- runtime-labels`

