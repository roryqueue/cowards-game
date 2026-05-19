---
phase: 09
slug: strict-chronicle-grammar-and-compatibility
status: complete
nyquist_compliant: true
wave_0_complete: true
validated: 2026-05-18T16:51:25Z
result: VALIDATION PASS
---

# Phase 09 Validation Audit

## Result

**VALIDATION PASS** — GRAM-01 through GRAM-08 have automated behavioral coverage, and the phase gate passed on 2026-05-18.

This audit confirmed the implemented tests exercise Chronicle validation, replay reconstruction, public projection, fixture legality, and web replay loading behavior through package or web entrypoints. No Nyquist gaps remain.

## Test Infrastructure

| Property | Value |
|----------|-------|
| Unit/integration framework | Vitest 4.1.6 |
| Config files | `vitest.config.ts`, `apps/web/vitest.config.ts` |
| Replay command | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts project.test.ts` |
| Test-utils command | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` |
| Web command | `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` |
| Typecheck commands | `pnpm --filter @cowards/replay typecheck`; `pnpm --filter @cowards/test-utils typecheck`; `pnpm --filter @cowards/web typecheck` |

## Verification Results

| Command | Result |
|---------|--------|
| `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts project.test.ts` | passed: 10 files / 118 tests |
| `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` | passed: 2 files / 15 tests |
| `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` | passed: 9 files / 63 tests |
| `pnpm --filter @cowards/replay typecheck` | passed |
| `pnpm --filter @cowards/test-utils typecheck` | passed |
| `pnpm --filter @cowards/web typecheck` | passed |

## Requirement Coverage

| Requirement | Behavioral Evidence | Automated Command | Status |
|-------------|---------------------|-------------------|--------|
| GRAM-01 | `validate.test.ts` rejects corrupted event order, grammar failures, snapshot boundary failures, impossible transitions, and version incompatibility through `validateChronicle`; `reconstruct.test.ts` exercises `createReplay` behavior from Chronicles. | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts` | green |
| GRAM-02 | `grammar.test.ts` mutates legal Chronicles to place events before `MATCH_STARTED`, outside Match/Round/Activation/Cycle windows, duplicate terminal events, events after terminal, skipped Cycles, and an open Cycle abandoned before `ACTION_EMITTED`; failures assert stable codes. | `pnpm --filter @cowards/replay test -- grammar.test.ts validate.test.ts` | green |
| GRAM-03 | `grammar.test.ts` removes required context fields and mutates payload/context IDs for Round, Activation, Cycle, Soldier, player, runtime, and Cycle payload consistency; assertions require `CONTEXT_MISSING`, `CONTEXT_MISMATCH`, or `PAYLOAD_INCONSISTENT`. | `pnpm --filter @cowards/replay test -- grammar.test.ts validate.test.ts` | green |
| GRAM-04 | `snapshot-boundaries.test.ts` mutates snapshot kind, sequence, context, and terminal outcome attachments for Match start/end, Round start/end, Activation start/end, Contraction, and terminal snapshots; `validate.test.ts` confirms per-instance Round/Activation snapshots are required through the integrated gate. | `pnpm --filter @cowards/replay test -- snapshot-boundaries.test.ts validate.test.ts` | green |
| GRAM-05 | `snapshot-boundaries.test.ts` rejects snapshots referencing missing event sequences; `replay-transition.test.ts` rejects provable board contradictions for movement, push, fall, stone, Contraction, Match end, and unknown Soldier references while accepting insufficiently evidenced transitions. | `pnpm --filter @cowards/replay test -- snapshot-boundaries.test.ts replay-transition.test.ts reconstruct.test.ts validate.test.ts` | green |
| GRAM-06 | `validate.test.ts` covers every key in `COMPATIBILITY_VERSIONS` plus unsupported schema migration; `server.test.ts` proves incompatible persisted Chronicles return replay-unavailable validation diagnostics before ready DTO rendering and without private marker leakage. | `pnpm --filter @cowards/replay test -- validate.test.ts && pnpm --filter @cowards/web test -- server.test.ts` | green |
| GRAM-07 | `project.test.ts` hostile nested fixtures scan public projection serialization for Strategy source, StrategyMemory, SoldierMemory, objectives, raw Awareness Grid fields, runtime details, private refs, debug, and storage metadata; `replay-fixture.test.ts` verifies the web fixture DTO consumes the shared public projection and remains private by default. | `pnpm --filter @cowards/replay test -- project.test.ts && pnpm --filter @cowards/web test -- replay-fixture.test.ts` | green |
| GRAM-08 | Negative fixtures cover corrupted grammar/order, missing and incompatible snapshots, impossible board transitions, private-leaking projection payloads, and version-incompatible Chronicles; `replay-scenarios.legality.test.ts` proves canonical generated scenarios remain valid and reconstructable under strict validation. | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts snapshot-boundaries.test.ts replay-transition.test.ts project.test.ts && pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` | green |

## Code Review Closure

| Finding | Closure Evidence | Status |
|---------|------------------|--------|
| CR-01: snapshot validation checked kind presence instead of every boundary instance | `validate.test.ts` removes all but one Round/Activation end snapshot and expects `SNAPSHOT_MISSING`; `snapshot-boundaries.ts` requires single matching boundary snapshots per event-derived context. | closed |
| CR-02: Activation/Cycle windows accepted impossible indices and broken Cycle sequencing | `grammar.test.ts` rejects out-of-range activation indices, out-of-range Cycle indices, skipped Cycles, and replacing `ACTION_EMITTED` with `MOVE_BLOCKED` while a Cycle is open. | closed |
| CR-03: transition replay silently ignored unknown Soldier references | `replay-transition.test.ts` rejects unknown Soldier references for `TURN_RESOLVED`, `SOLDIER_STONED`, `SOLDIER_FELL`, and `BACKSTAB_RESOLVED`. | closed |
| RR-01: open Cycles could be abandoned without `ACTION_EMITTED` | `grammar.test.ts` includes the re-review regression for abandoning an open Cycle before `ACTION_EMITTED`. | closed |

## Nyquist Sign-Off

| Criterion | Status |
|-----------|--------|
| Every GRAM-01 through GRAM-08 behavior has automated coverage. | pass |
| Tests exercise behavior through public package or web entrypoints, not file existence. | pass |
| Negative fixtures fail closed with stable validation codes and clear messages. | pass |
| Legal engine-generated Chronicles remain accepted by strict validation and replay reconstruction. | pass |
| Public replay output remains private by default through package and web DTO paths. | pass |
| Code-review fixes and re-review closure have regression coverage. | pass |

## Files Audited

- `packages/replay/src/validate.test.ts`
- `packages/replay/src/grammar.test.ts`
- `packages/replay/src/snapshot-boundaries.test.ts`
- `packages/replay/src/replay-transition.test.ts`
- `packages/replay/src/reconstruct.test.ts`
- `packages/replay/src/project.test.ts`
- `packages/test-utils/src/replay-scenarios.legality.test.ts`
- `apps/web/app/matches/server.test.ts`
- `apps/web/app/matches/replay-fixture.test.ts`

## Validation Audit 2026-05-18

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Manual-only | 0 |
