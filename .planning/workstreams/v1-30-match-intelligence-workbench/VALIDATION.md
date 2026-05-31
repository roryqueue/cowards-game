# v1.30 Validation

## Result

Pass. No open validation gaps remain for v1.30.

## Commands Run

| Command | Result |
| --- | --- |
| `pnpm --filter @cowards/web lint` | Pass |
| `pnpm --filter @cowards/web typecheck` | Pass |
| `pnpm --filter @cowards/web test` | Pass: 23 files, 162 tests |
| `pnpm match-execution:intelligence` | Pass: generated proof |
| `pnpm match-execution:intelligence:check` | Pass |
| `pnpm exec tsx scripts/check-boundary-monitors.ts` | Pass |
| `PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile --workers=1 v1-30-match-intelligence-workbench.spec.ts` | Pass: 6/6 |
| `PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --project=mobile --workers=1 replay.visual.spec.ts` | Pass: 14/14 |

## Requirement Coverage

- BASE-01..BASE-06: covered by proof artifact inventory and DTO field-shape checks.
- INTEL-01..INTEL-08: covered by pure adapter, unit tests, proof artifact, and private marker scans.
- RES-01..RES-07: covered by result-page rendering, v1.30 browser proof, and result fixture coverage.
- REP-01..REP-06: covered by replay annotations, filters, focus links, unit/browser proof, and privacy scans.
- TACT-01..TACT-07: covered by Soldier status, board-control, terrain/STONE, action-mix panels, board realism proof, and replay visual proof.
- STATE-01..STATE-06: covered by lifecycle/failure copy and unavailable replay empty-output checks.
- GATE-01..GATE-05: covered by public marker scans and continued owner-debug separation.
- PROOF-01..PROOF-06: covered by v1.30 browser proof, visual proof, screenshots, and private marker scans.
- MON-01..MON-04 and LIVE-01..LIVE-03: covered by v1.30 proof artifact, boundary monitors, and fixture-backed local page compatibility. Live execution services were not required and no live-only execution claim is made.
- CLOSE-01..CLOSE-06: covered by code review, UI review, validation, verify-work, audit, archive, and final non-claim decision.

## Residual Risk

- Live signed-in proof was not run against live execution services in this pass; this is accepted because v1.30 normal proof is fixture-backed and public DTO-compatible.
- No deferred DTO gap blocks v1.30; richer public contract evolution remains future work.
