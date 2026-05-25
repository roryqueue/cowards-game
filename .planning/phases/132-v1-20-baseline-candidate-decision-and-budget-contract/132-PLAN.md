# Phase 132: v1.20 Baseline, Candidate Decision, and Budget Contract - Plan

**Status:** Ready for execution
**Date:** 2026-05-25

## Objective

Create the v1.20 baseline evidence layer: v1.20-specific sandbox evaluation/readiness artifacts, explicit Docker/runc candidate selection, fail-loud runsc preflight behavior, and an initial timeout/reliability budget contract.

## Tasks

1. Update runtime sandbox evaluation versioning from v1.19 to v1.20 while preserving archived v1.19 artifacts.
2. Add v1.20 readiness artifact generation in JSON and Markdown.
3. Add preflight evidence for Docker, configured image, and host `runsc` availability.
4. Add a v1.20 timeout/reliability budget artifact that separates Strategy call, Match, MatchSet/job, runtime-service HTTP, and browser proof budgets.
5. Update boundary monitors to check v1.20 artifacts and conservative promotion wording.
6. Run focused sandbox evaluation and monitor tests.

## Verification

- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:check`
- `pnpm exec vitest run packages/runtime-js/src/container-subprocess-adapter.test.ts`
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts`

## Acceptance

- v1.20 artifacts exist under `.planning/artifacts/`.
- v1.19 archived artifacts remain present.
- Docker/runc is selected as the executable candidate when available.
- `runsc` absence is recorded as fail-loud/non-promotion evidence.
- No artifact claims production sandbox certification or Python counted eligibility.
