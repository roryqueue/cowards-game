# Phase 37 Verification

## Automated Checks

- PASS: `pnpm format:check`
- PASS: `pnpm lint`
- PASS: `pnpm typecheck`
- PASS: `pnpm --filter @cowards/spec test`
- PASS: `pnpm --filter @cowards/web test -- workshop-client.test.tsx server.test.ts`
- PASS: `pnpm --filter @cowards/persistence test -- workshop.test.ts`

## Demo Generation

- PASS: `STRATEGY_EXECUTION_ADAPTER=worker-thread pnpm exec tsx scripts/run-v1-5-advanced-demo.ts`
- Report JSON: `.planning/phases/37-demo-and-regression-verification/v1-5-demo-report.json`
- Report Markdown: `.planning/phases/37-demo-and-regression-verification/v1-5-demo-report.md`

## Browser Checks

Base URL: `http://localhost:3000`

- PASS: `/` renders Strategy Workshop with Advanced Library.
- PASS: `/ladder/v1-5-demo` renders completed v1.5 tournament.
- PASS: `/matchsets/match-set%3Av1-5%3Atournament%3Aadvanced-eight` renders counted tournament MatchSet.
- PASS: `/matchsets/match-set%3Av1-5%3Aexample%3Aanti-backstab-stress` renders counted example MatchSet.
- PASS: `/strategies/strategy%3Ademo%3Av1-5%3Acenter-gravity` renders Advanced Strategy card.
- PASS: `/players/v15-center-gravity` renders player profile.
- PASS: `/matches/match%3Amatch-set%3Av1-5%3Atournament%3Aadvanced-eight%3A0/replay` renders representative replay.

No checked public page contained `StrategyMemory`, `SoldierMemory`, objective payloads, owner debug, password hashes, or Strategy source.

## Realism Review

Initial demo was rejected because Recall Hunter swept 7-0. Recall Hunter was tuned away from a direct Backstab Hunter clone and evidence was regenerated.

After browser review, the Advanced set received a second-take retune so every seed shares a tactical competence baseline before applying archetype flavor:

- prioritize Soldiers that have not yet left the starting edge;
- take immediate rear-square/backstab opportunities when available;
- avoid ending on the outer ring before contraction where a safer lane exists;
- avoid direct `TURN_TO_STONE` self-stoning;
- avoid known off-board, wall, terrain-stone, stone-Soldier, and immediate-reversal moves.

Final regenerated tournament has a stronger but non-sweeping champion:

- Center Gravity: 6-1-0
- Stonewall Shear: 5-2-0
- Rear Guard Sentinel: 5-2-0
- Vanguard Pressure: 4-3-0

Second-take evidence sanity checks across 33 Chronicles:

- `MOVE_ADVANCED`: 7103
- `BACKSTAB_RESOLVED`: 412
- `MOVE_BLOCKED`: 0
- `MOVED_OFF_BOARD`: 0
- direct `TURN_TO_STONE`: 0
- `NO_ADVANCE` cleanup stones: 17

Chronicle metrics include Cycle starts, skipped Activations, Advances, blocked moves, Backstab resolutions, contractions, and 33 Match endings under `chronicle-v1.4` / `cowards-rules-v1.4`.
