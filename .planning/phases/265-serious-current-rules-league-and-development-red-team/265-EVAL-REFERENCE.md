---
phase: 265
plan: "07"
scope: source-only injected evaluation reference corpus
empirical_authority: false
---

# Phase 265 evaluation reference

`LEAGUE_EVALUATION_FIXTURES` is an immutable index of trusted synthetic/injected
mechanics checks. No row is a candidate, Match, model call, participant action,
external submission, holdout read, or empirical result. Every row carries
`evidenceClass: injected_fixture` and `empiricalRequirementsComplete: false`.

| Group | Exact source assertion | Requirements | Decisions / threats |
|---|---|---|---|
| complete-alias-aware-matrix | `integration.test.ts` — eight-cell matrix → solver → persisted terminal → `issued:false` reopen | LEAG-01, LEAG-02 | D-07–D-10; alias/partial-matrix denial |
| matrix-fault-families | `matrix.test.ts` — blocks every gap, duplicate, identity mismatch, invalid disposition, and system failure | LEAG-01 | D-09; no imputation |
| invalid-and-system-terminals | `matrix.test.ts` — same terminal-integrity assertion | LEAG-02 | D-09; terminal integrity |
| degenerate-solver | `solver.test.ts` — decisive exact synthetic candidate with golden/boundary evidence | LEAG-03 | D-11–D-12; numeric exactness |
| permutation-and-numeric-boundary | `solver.test.ts` — canonical exact output across repeat, source-order, worker, shard, and restart probes | LEAG-03 | D-12; reduction invariance |
| repeat-layout-and-replay | `matrix.test.ts` — reordered operational layouts retain semantic payoff bytes and roots | LEAG-01, LEAG-03 | D-10–D-13; identity/replay |
| round-targets | `psro.test.ts` — frozen mixture plus strongest/vulnerable targets are rooted before response work | LEAG-04 | D-13–D-15; target drift |
| accepted-counter-reentry | `red-team.test.ts` — positive counter re-enters actual PSRO and prevents early closure | LEAG-04, LEAG-09 | D-15; omitted counter |
| charged-outcomes | `red-team.test.ts` — starts burn reservations and retain all terminals | LEAG-09 | D-05, D-20; hidden retries |
| clone-and-novelty | `selection.test.ts` — candidate-specific assessed base edges resist control laundering | LEAG-06 | D-08, D-17; diversity laundering |
| mixture-and-portfolio | `selection.test.ts` — retained fingerprint evidence, not independent labels, creates a portfolio | LEAG-06, LEAG-07 | D-16–D-17; promotion boundary |
| robust-pure-pass | `selection.test.ts` — recomputes frozen policy/maximin gates | LEAG-07, LEAG-08 | D-18; aggregate-score overclaim |
| no-finalist | `selection.test.ts` — insufficient behavioral/core evidence stays no-finalist | LEAG-08 | D-19; least-bad substitution |
| nine-probes | `red-team.test.ts` — all nine identity/valid-condition probes are recorded | LEAG-09 | D-20; incomplete attack suite |
| hostile-runtime | `connected-runner.test.ts` — forged closure/caller provider rejected; cleanup failure is charged evidence | LEAG-02, LEAG-09 | hostile source/runtime boundary |
| safe-projection-denial | `report.test.ts` — stale/incomplete state and sensitive fields fail closed | LEAG-05 | D-21; privacy/public-claim boundary |

The fixture index parses all sixteen file/test callbacks and requires an invoked
matcher whose `expect` message is the row's `league-eval:<id>` marker. Comments,
standalone strings, bare `expect` calls, and markers in another test do not link.
This only checks assertion linkage: neither the index nor its descriptions prove
behavior. Executed behavioral tests and captured outputs remain the evidence.
`integration.test.ts` covers the minimal eight-cell package path and the expanded
sixteen-entrant/960-cell matrix, solver, bounded transport and read-only
reconstruction. It does not import or purport to execute the CLI.

The separate, larger source-only CLI evidence remains in
`scripts/run-v1-38-serious-league.test.ts`: `runs all cells, both rounds and all
nine probes through fresh host issuance without empirical work` covers the
80-cell/two-round/nine-probe loop. The parameterized `re-enters a measured positive
response and reopens the whole loop` covers successful growth, failure after
growth, a thrown response provider, and honest last-round nonclosure.
`retains two distinct consecutive responses beating their own preceding frozen
targets` covers connected iteration measurements and contemporaneous-target
tamper denial. These are trusted injected source checks, not empirical runs;
the repair report distinguishes captured focused runs from pending integrated
gate execution.

`scripts/check-v1-38-serious-league-boundaries.test.ts` uses the shared resolved
AST/import graph for innocent-package/barrel, dynamic-loader, manifest-alias,
public/deployment-root, and restricted historic-selector denial cases, while
allowing the reviewed factory/kernel bridge. Its command reports affected paths
and rules rather than making a blanket name-based allowance.

The retained reader always returns `issued: false`; it cannot authorize a provider or dispatch. The only empirical authority remains a separately approved Phase 265 allocation after source review.
