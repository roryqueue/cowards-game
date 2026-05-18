# Phase 11 Validation Evidence

**Phase:** 11-doctrine-debugging-ux  
**Validated:** 2026-05-18  
**Scope:** DEBUG-01 through DEBUG-06

## Requirement Evidence

| Requirement | Plan(s) | Evidence files | Command-backed result |
| --- | --- | --- | --- |
| DEBUG-01: validation/runtime messages name Strategy API constraint and remediation | 11-01, 11-03 | `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/spec.test.ts`, `packages/runtime-js/src/validation.ts`, `packages/runtime-js/src/guards.ts`, `packages/runtime-js/src/validation.test.ts`, `apps/web/app/workshop/workshop-client-state.ts`, `apps/web/app/workshop/workshop-client.test.tsx` | `pnpm --filter @cowards/spec test -- spec.test.ts` - passed, 1 file / 19 tests. `pnpm --filter @cowards/runtime-js test -- validation.test.ts` - passed, 9 files / 161 tests. `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` - passed, 9 files / 77 tests. |
| DEBUG-02: sample Strategies cover doctrine patterns and failure modes | 11-02, 11-03 | `packages/persistence/src/workshop.ts`, `packages/persistence/src/workshop.test.ts`, `packages/runtime-js/src/validation.test.ts`, `apps/web/app/workshop/workshop-client-state.ts`, `apps/web/app/workshop/workshop-client.tsx`, `apps/web/app/workshop/workshop-client.test.tsx` | `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts` - passed, 1 file / 11 tests. `pnpm --filter @cowards/runtime-js test -- validation.test.ts` - passed, 9 files / 161 tests. `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` - passed, 9 files / 77 tests. |
| DEBUG-03: Workshop Match results expose replay links when replay exists | 11-03 | `apps/web/app/workshop/workshop-client-state.ts`, `apps/web/app/workshop/workshop-client.tsx`, `apps/web/app/workshop/workshop-client.test.tsx` | `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` - passed, 9 files / 77 tests. |
| DEBUG-04: owner can inspect why a Soldier did nothing across required causes | 11-04, 11-05, 11-06 | `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`, `packages/replay/src/debug-explanations.ts`, `packages/replay/src/debug-explanations.test.ts`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/[matchId]/replay/replay-state.ts`, `apps/web/app/matches/[matchId]/replay/replay-state.test.ts`, `apps/web/app/matches/[matchId]/replay/replay-client.tsx`, `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx`, `apps/web/e2e/replay.fixture.spec.ts` | `pnpm --filter @cowards/spec test -- spec.test.ts` - passed, 1 file / 19 tests. `pnpm --filter @cowards/replay test -- project.test.ts debug-explanations.test.ts` - passed, 11 files / 130 tests. `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` - passed, 9 files / 77 tests. `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` - passed, 6 tests. |
| DEBUG-05: owner debug overlays are generated from replay/engine-derived DTOs, not React rule inference | 11-04, 11-05 | `packages/replay/src/debug-explanations.ts`, `packages/replay/src/debug-explanations.test.ts`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/[matchId]/replay/replay-state.ts`, `apps/web/app/matches/[matchId]/replay/replay-state.test.ts`, `apps/web/app/matches/[matchId]/replay/replay-client.test.tsx` | `pnpm --filter @cowards/replay test -- project.test.ts debug-explanations.test.ts` - passed, 11 files / 130 tests. `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` - passed, 9 files / 77 tests. |
| DEBUG-06: public replay remains privacy-safe with owner debugging enabled | 11-05, 11-06 | `packages/replay/src/project.ts`, `packages/replay/src/project.test.ts`, `apps/web/app/matches/server.test.ts`, `apps/web/app/matches/replay-fixture.test.ts`, `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts`, `apps/web/e2e/replay.fixture.spec.ts` | `pnpm --filter @cowards/replay test -- project.test.ts debug-explanations.test.ts` - passed, 11 files / 130 tests. `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` - passed, 9 files / 77 tests. `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` - passed, 6 tests. |

## Phase Gates

| Command | Result |
| --- | --- |
| `pnpm --filter @cowards/spec test -- spec.test.ts` | Passed, 1 file / 19 tests. |
| `pnpm --filter @cowards/runtime-js test -- validation.test.ts` | Passed, 9 files / 161 tests. |
| `pnpm --filter @cowards/persistence test -- workshop.test.ts` | Failed in unrelated `packages/persistence/src/chronicle-store.test.ts`: `ChronicleValidationSystemFailure: STRATEGY_EVALUATED requires context.roundNumber.` The package script ran the wider persistence suite instead of only `workshop.test.ts`. |
| `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts` | Passed, 1 file / 11 tests. Targeted alternative for DEBUG-02 sample catalog evidence. |
| `pnpm --filter @cowards/replay test -- project.test.ts debug-explanations.test.ts` | Passed, 11 files / 130 tests. |
| `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts replay-fixture.test.ts workshop-client.test.tsx replay-client.test.tsx replay-state.test.ts` | Passed, 9 files / 77 tests. |
| `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` | Passed, 6 tests across desktop and mobile. |
| `pnpm --filter @cowards/spec typecheck` | Passed. |
| `pnpm --filter @cowards/runtime-js typecheck` | Passed. |
| `pnpm --filter @cowards/persistence typecheck` | Passed. |
| `pnpm --filter @cowards/replay typecheck` | Passed. |
| `pnpm --filter @cowards/web typecheck` | Passed. |

## Notes

- Public projection, server DTO, route guard, and browser fixture checks now all assert owner debug privacy boundaries.
- The only failed required command is the known persistence package-script behavior also recorded in Plan 11-02: it runs unrelated `chronicle-store.test.ts` fixtures that currently fail stricter Chronicle grammar. The targeted Workshop sample test passes.

## Validation Audit 2026-05-18

| Metric | Count |
| --- | --- |
| Requirements audited | 6 |
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Phase 11 remains Nyquist-compliant after the code-review and UI-review fix pass. The review-fix delta added explicit persisted-replay and fixture-replay negative coverage for query-requested owner debug, expanded the Workshop sample catalog coverage, and updated the shared validation report schema test for oversized source reports.
