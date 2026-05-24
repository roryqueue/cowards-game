# Phase 96: Boundary Baseline and Go Ownership Contract - Plan

**Status:** Ready for execution
**Research:** `096-RESEARCH.md`
**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

## Objective

Create the v1.15 source of truth for backend lifecycle ownership before code migration: a human-readable baseline, a machine-readable lifecycle ownership manifest, and monitor coverage that blocks drift.

## Tasks

1. Add `.planning/artifacts/v1.15-boundary-baseline.md`.
   - Record current Go-owned route families, TypeScript-owned lifecycle surfaces, direct web persistence baseline, topology gaps, monitor gaps, v1.14 artifact links, non-goals, and deferred surfaces.
   - Include concrete code references for TypeScript job claim/completion, Chronicle persistence, MatchSet scoring, replay/public evidence, and web report-only direct persistence offenses.

2. Add `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json`.
   - Include route, lifecycle, runtime, persistence, scoring, public evidence, topology, monitor, fallback, and rollback surfaces.
   - Use TypeScript roles `parity_only`, `rollback_only`, `test_only`, `runtime_only`, `deferred`, and `frontend`.
   - Declare no silent fallback, stopped-Go behavior, stopped-runtime behavior where applicable, rollback owner, evidence required, and disallowed scopes for every selected Go surface.

3. Extend `scripts/check-boundary-monitors.ts`.
   - Add v1.15 lifecycle manifest parsing and validation.
   - Validate required surfaces, allowed TypeScript role labels, no mixed DB-completing owners, runtime-only restrictions, no-fallback policies, rollback owners, non-goals, public-output denylist, and `strict_offenses=0 report_only_offenses=29`.
   - Add the check to `runBoundaryMonitorChecks()`.

4. Add or extend focused monitor tests if the repo has an existing monitor test harness.
   - Cover missing required surface, invalid TypeScript role, runtime-only DB ownership, unsafe fallback, and report-only baseline drift.

5. Update phase artifacts.
   - Write `096-SUMMARY.md`, `096-VERIFICATION.md`, and `096-VALIDATION.md` after implementation and verification.

## Verification

- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `pnpm boundary:monitors` if runtime/container prerequisites are available; otherwise record the exact blocked prerequisite.
- `git diff --check`

## Exit Criteria

- v1.15 baseline and lifecycle manifest exist and are public-safe.
- Boundary monitors fail on lifecycle ownership drift and pass on the committed manifest.
- Phase 97 can use the manifest as the lifecycle ownership contract.
