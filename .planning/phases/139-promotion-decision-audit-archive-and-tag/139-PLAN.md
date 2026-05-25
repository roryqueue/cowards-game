# Phase 139: Promotion Decision, Audit, Archive, and Tag - Plan

**Status:** Ready for execution
**Date:** 2026-05-25

## Objective

Close v1.20 with explicit conservative promotion decisions, final verification, audit evidence, milestone archive, active requirements removal, project state updates, commit, and tag.

## Tasks

1. Run final verification gates across sandbox evidence, runtime packages, spec contracts, Go backend, web typecheck, focused web/runtime tests, boundary monitors, and signed-in proof artifact.
2. Record a v1.20 promotion decision that keeps Python non-counted exhibition beta and runtime isolation readiness-only.
3. Record a milestone audit with findings, fixes, verification commands, signed-in proof result, and expected runsc fail-loud status.
4. Mark completion requirements complete.
5. Archive v1.20 roadmap, requirements, and active phase directories under `.planning/milestones/`.
6. Remove active `.planning/REQUIREMENTS.md`.
7. Update `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/MILESTONES.md`, and `.planning/RETROSPECTIVE.md`.
8. Commit and tag `v1.20`.

## Verification

- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:container`
- `pnpm sandbox:evaluate:check`
- `pnpm sandbox:evaluate:runsc` expected fail-loud
- `pnpm --filter @cowards/runtime-js test`
- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/web typecheck`
- `PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts apps/web/app/matchsets/evidence-copy.test.ts scripts/check-boundary-monitors.test.ts`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
