# Plan 265-15 Task A bounded import — source-only execution

Status: source-only Task A implemented and focused checks passed. This report is not the Plan 265-15 SUMMARY, a pilot result, a capacity receipt, a Match charge, or LEAG/freeze credit.

## Implemented path

- `readLeanPilotInitialCandidates(repository, selection, beforeCell?)` is a private lean-only, additive entrypoint. For each selected historical assessment root it calls the complete `verifyHistoricalFactoryAssessmentForLeague` once with bounded import enabled, then binds that result to the exact repository object and root in a local closure shared by both candidate imports and their later imported-assessment checks. The existing `readLeagueInitialCandidates` signature and default behavior remain unchanged.
- The historical verifier still reopens the full 48-cell ledger, all terminal/supervision roots, every retained receipt and execution commitment, numeric control table, threshold, base edges, candidate publications, source/runtime/tuple membership, and final assessment root. No producer label or manifest alone grants admission. The candidate importer still checks publication, membership, terminal, supervision receipt, source slot uniqueness, numeric threshold/control comparison, packet/proposal/validation/source closure and S01/S03 base qualification; the lean path only changes how the already-authenticated assessment result is reused.
- A separate bounded supervision reader authenticates the whole chunk chain, then parses one raw chunk at a time in forward record order. It preserves the legacy full-byte reader unchanged and reconstructs the same complete receipt, execution and trace commitments. Each accepted historical cell remains capped at 64 MiB of canonical stream bytes and 50,000 records. The lean numeric projector has a fail-closed 64 MiB per-cell conservative token charge and 256 MiB conservative aggregate projection charge across all 48 cells. Raw supervision arrays are scoped to one cell, not retained across the assessment loop. The `beforeCell` hook allows the trusted lean parent/child path to check its current resource position before each cell.
- Candidate supervision reopens in lean mode also use the bounded reader and the same 64 MiB/50,000-record ceiling. Legacy callers keep their original limits and full-stream behavior. No new dependency, game rule, runtime ceiling, public evidence path, or Strategy execution route was added.

## Focused source-only checks

- `pnpm exec vitest run packages/strategy-lab/src/factory/supervision-artifacts.test.ts packages/strategy-lab/src/league/contracts.test.ts scripts/v1-38-factory-observations.test.ts scripts/assess-v1-38-factory-independence.test.ts` — **24/24 passed**.
- `pnpm exec vitest run scripts/run-v1-38-serious-league.test.ts -t 'lean import authenticates one selected assessment'` — **1/1 passed**, 150 unrelated tests skipped by name. A two-candidate synthetic store produced exact legacy/lean candidate admission roots, with verifier calls three versus one respectively. The memoized closure rejected a different repository object. No historical 48-cell private store was read.
- `pnpm --filter @cowards/strategy-lab typecheck` — **passed**.
- `pnpm exec tsc --ignoreConfig --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --strict --esModuleInterop --types node scripts/run-v1-38-serious-league.ts scripts/assess-v1-38-factory-independence.ts scripts/v1-38-factory-observations.ts` — **passed**.
- The new token-ceiling test was observed failing before its implementation and passing afterward. The existing full reader and bounded reader produced equal complete synthetic records, including a >8 MiB multi-chunk fixture; forged descriptor and corrupted chunk controls were denied.

## Limits and handoff

These checks are synthetic/source-only. They do not prove actual historical 48-cell root equality in the real private store, entire-process RSS, pilot feasibility, or empirical success. The shared source gate and independent review remain root-owned. Parent/child admission must enforce simultaneous working-set and disk/time checks, including the `beforeCell` hook, before the root-only distinct fresh pilot. The immutable failed route and zero-byte reservations were not opened or modified.
