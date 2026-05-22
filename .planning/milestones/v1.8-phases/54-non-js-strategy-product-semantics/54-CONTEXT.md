---
phase: 54
slug: non-js-strategy-product-semantics
status: context
created: 2026-05-22
---

# Phase 54 Context — Non-JS Strategy Product Semantics

## Goal

Define what non-JS Strategy authoring means without promoting Python or any other non-JS runtime to production support. The product and code contracts should expose language/runtime metadata, experimental labels, validation semantics, compatibility warnings, counted-play eligibility, and docs/examples hooks while preserving existing JS/TS Workshop behavior.

## Carry-Forward Decisions

- JS/TS remain the normal Workshop and counted-play authoring path.
- Python remains experimental and non-counted.
- No public language picker should imply parity with JS/TS.
- Runtime metadata lives in `@cowards/spec`; executable adapter behavior remains in runtime packages.
- Counted MatchSet, ladder, and gauntlet-style eligibility must fail closed when runtime metadata is disabled, experimental, ABI-incompatible, package-declared, or not counted.
- Public/product surfaces may show compact semantic labels and warnings, but must not expose Strategy source, runtime internals, or private diagnostics.

## Current Code Surfaces

- `packages/spec/src/runtime.ts` already owns language ids, adapter ids, ABI version, adapter registry records, limits, package metadata, and compatibility keys.
- `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` define Strategy Revision validation codes and report schemas.
- `packages/runtime-js/src/validation.ts` validates JS/TS source and emits current validation reports.
- `packages/persistence/src/competition.ts` and `packages/persistence/src/ladder.ts` enforce counted eligibility with local adapter checks.
- `packages/persistence/src/account-revisions.ts` returns account revision summaries consumed by account and exhibition views.
- `apps/web/app/account/page.tsx`, `apps/web/app/exhibitions/new/exhibition-client.tsx`, and `apps/web/app/strategies/[strategyId]/page.tsx` are the narrow user-facing surfaces for runtime semantics.

## Out Of Scope

- Runtime execution for Python in counted play.
- Package installation, dependency resolution, lockfiles, or native modules.
- Public language picker.
- Production sandbox promotion.
- Rewriting Workshop editor modes beyond metadata display.
