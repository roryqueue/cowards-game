---
phase: 09
slug: strict-chronicle-grammar-and-compatibility
status: planned
nyquist_compliant: planned
wave_0_complete: false
created: 2026-05-18
---

# Phase 09 Validation Plan

## Test Infrastructure

| Property | Value |
|----------|-------|
| Unit/integration framework | Vitest 4.1.6 |
| Config files | `vitest.config.ts`, `apps/web/vitest.config.ts` |
| Quick replay command | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts project.test.ts` |
| Focused web command | `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` |
| Legal scenario command | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` |
| Phase gate | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts project.test.ts && pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts && pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts && pnpm --filter @cowards/replay typecheck && pnpm --filter @cowards/test-utils typecheck && pnpm --filter @cowards/web typecheck` |

## Requirement Coverage

| Requirement | Behavioral Evidence To Add | Automated Command | Plan |
|-------------|----------------------------|-------------------|------|
| GRAM-01 | `validateChronicle` performs Zod shape parsing, compatibility checks, semantic grammar checks, snapshot boundary checks, transition contradiction checks, and hash checks before replay DTO assembly. | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts` | 09-01, 09-03, 09-04, 09-05 |
| GRAM-02 | Invalid event order, missing required events, duplicate terminal events, and illegal Match/Round/Activation/Cycle windows return stable validation errors. | `pnpm --filter @cowards/replay test -- grammar.test.ts validate.test.ts` | 09-03, 09-05 |
| GRAM-03 | Required context fields and payload/context consistency are enforced for event types with known round, activation, cycle, Soldier, and player fields. | `pnpm --filter @cowards/replay test -- grammar.test.ts validate.test.ts` | 09-03, 09-05 |
| GRAM-04 | Snapshot kind, sequence, context, end-boundary, Contraction, terminal, and outcome rules are enforced before reconstruction. | `pnpm --filter @cowards/replay test -- snapshot-boundaries.test.ts validate.test.ts` | 09-04, 09-05 |
| GRAM-05 | Missing snapshot references and provable event/snapshot board contradictions are rejected without re-running Strategy source. | `pnpm --filter @cowards/replay test -- snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts validate.test.ts` | 09-04, 09-05 |
| GRAM-06 | Unsupported Chronicle schema, engine, runtime, Strategy Revision, and Arena Variant compatibility versions fail explicitly. | `pnpm --filter @cowards/replay test -- validate.test.ts && pnpm --filter @cowards/web test -- server.test.ts` | 09-01 |
| GRAM-07 | Public projection excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, and private runtime details by default. | `pnpm --filter @cowards/replay test -- project.test.ts && pnpm --filter @cowards/web test -- replay-fixture.test.ts` | 09-02 |
| GRAM-08 | Negative fixtures cover corrupted, impossible, private-leaking, and version-incompatible Chronicles; legal generated scenarios remain accepted. | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts project.test.ts && pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` | 09-01 through 09-05 |

## Per-Plan Verification Map

| Plan | Automated Verification | Required New/Expanded Tests | Status |
|------|------------------------|-----------------------------|--------|
| 09-01 | `pnpm --filter @cowards/replay test -- validate.test.ts`; `pnpm --filter @cowards/web test -- server.test.ts`; package typechecks | Compatibility version matrix and replay-unavailable diagnostics | planned |
| 09-02 | `pnpm --filter @cowards/replay test -- project.test.ts`; `pnpm --filter @cowards/web test -- replay-fixture.test.ts`; package typechecks | Hostile nested privacy markers and web fixture public DTO privacy | planned |
| 09-03 | `pnpm --filter @cowards/replay test -- grammar.test.ts`; replay typecheck | Event-window, required context, and payload consistency negative fixtures | planned |
| 09-04 | `pnpm --filter @cowards/replay test -- snapshot-boundaries.test.ts`; replay typecheck | Snapshot kind/event matrix, context mismatch, missing sequence, Round end and Activation end boundary sequence tests | planned |
| 09-05 | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts`; `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts`; package typechecks | Public validation integration, board contradiction checks, legal scenario strict validation | planned |

## Wave 0 Gaps

- [ ] `packages/replay/src/grammar.test.ts` for event-window/context/payload negative fixtures.
- [ ] `packages/replay/src/snapshot-boundaries.test.ts` for boundary attachment, missing sequence, context, outcome, Round end, and Activation end negative fixtures.
- [ ] `packages/replay/src/replay-transition.test.ts` for provable board contradiction fixtures.
- [ ] Expanded `packages/replay/src/project.test.ts` hostile nested privacy marker fixtures.
- [ ] Expanded `apps/web/app/matches/server.test.ts` and `apps/web/app/matches/replay-fixture.test.ts` replay loading/privacy gates.

## Nyquist Sign-Off Criteria

- [ ] Every GRAM-01 through GRAM-08 behavior has at least one automated test.
- [ ] Tests exercise behavior through public package or web entrypoints, not only helper existence.
- [ ] Negative fixtures fail closed with stable validation codes and clear messages.
- [ ] Legal engine-generated Chronicles remain accepted by strict validation and replay reconstruction.
- [ ] Public replay output remains private by default through package and web DTO paths.

