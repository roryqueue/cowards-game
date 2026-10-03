# Retained-ledger verification-gap validation

Source anchor: `748d7869a50d1311db1aa2d3edbb86f667ae0553`. Scope: the source-repair subgoal only, not a pilot, whole-phase gate or empirical admission.

The source verifier's v1 finding was repaired by reusing the shared bounded descriptor reader for retained attempt starts and terminals. Canonical schema, filename/root and start-terminal linkage checks remain. Stable legitimate ordinary and lean ledger semantics are unchanged; file growth is rejected without allocating an unbounded input.

## Actual focused results

- Root command: `env -u NODE_OPTIONS -u NODE_COMPILE_CACHE TSX_DISABLE_CACHE=1 NODE_DISABLE_COMPILE_CACHE=1 pnpm exec vitest run packages/strategy-lab/src/factory/repository.test.ts scripts/assess-v1-38-factory-independence.test.ts --maxWorkers=1 -t 'reopens real canonical ledger records|factory repository'`: **10 passed, 8 filtered, two files, 3.56 s**. Includes deterministic growth after opening and oversized start/terminal denial.
- Root strategy-lab project TypeScript and `git diff --check`: passed.
- Root factory boundary scanner: passed, zero violations, 1,362 files.
- Author additionally reported scoped strict TypeScript over four source/test files passing; root does not claim that scoped command was rerun here.
- Independent review v5: clean, zero findings. Independent source verification v2: `source-repair-verified` only.

The previous validation v2's genuine full-48 assessment, two-candidate root equality / three legacy versus one lean assessment call, and honest interrupted broad-suite record remain unchanged. No redundant historical stress suite or real private historical reader was run here. This is not a full-suite pass, measured peak-memory proof or capacity receipt.

## Remaining frontier

Source repair is closed. Historical peak disk usage is still unknown; the separately proposed historical-disk accounting decision is pending and unapplied. The earlier human approval applies to prospective crash-time accounting, not this later disk choice. Fresh preparation remains denied until that genuine resource decision is resolved or a defensible historic numeric bound exists. No new allocation, provider, Match, result/head, retained empirical verifier, LEAG/freeze or phase-completion credit was produced. Failed history, 565,459-ms time carry-forward, 15GB/28,800,000-ms/300-Match ceilings, gameplay/runtime/privacy, unopened holdout and freeze-before-formation order remain unchanged.
