# Phase 233 Plan: Audit, Archive, Commit, and Tag

## Goal

Close v1.32 only after milestone-wide review, validation, audit/fix, proof inspection, archive creation, and final promotion decision.

## Work Items

1. Review changed v1.32 source and proof surfaces for boundary, privacy, and false-claim risk.
2. Run milestone-wide verification: tests, typecheck, formatting, boundary monitors, public discovery, Go tests, runtime-service tests, and live proof evidence.
3. Fix audit findings until the verification set is clean.
4. Write final milestone audit and Phase 233 GSD artifacts.
5. Mark `CLOSE-01..CLOSE-05` complete.
6. Archive v1.32 roadmap and requirements under `.planning/milestones/`.
7. Update `.planning/MILESTONES.md`, `.planning/PROJECT.md`, `.planning/STATE.md`, and active roadmap/requirements status.
8. Commit closure artifacts and tag `v1.32`.

## Verification Gates

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm --filter @cowards/spec test -- runtime`
- `COWARDS_PROVIDER_VALIDATION_SECRET=... pnpm --filter @cowards/runtime-service test`
- `COWARDS_PROVIDER_VALIDATION_SECRET=... pnpm --filter @cowards/web test`
- `DATABASE_URL=... COWARDS_PROVIDER_VALIDATION_SECRET=... go test ./...`
- `pnpm boundary:imports`
- `pnpm public-discovery:check`
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts scripts/check-service-boundary-imports.test.ts`
- `COWARDS_PROVIDER_VALIDATION_SECRET=... pnpm boundary:monitors`
- Live Phase 232 Playwright proof with `RUN_V1_32_PROOF=1`

