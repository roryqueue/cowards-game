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

| Group | Primary assertion | Requirements | Decisions / threats |
|---|---|---|---|
| complete-alias-aware-matrix | eight cells per pair and one Smoke/Open Field semantic geometry | LEAG-01, LEAG-02 | D-07–D-10; alias/partial-matrix denial |
| matrix-fault-families | sparse and duplicate rows fail closed | LEAG-01 | D-09; no imputation |
| invalid-and-system-terminals | invalid/system terminals never score | LEAG-02 | D-09; terminal integrity |
| degenerate-solver | tied exact vector is deterministic | LEAG-03 | D-11–D-12; numeric exactness |
| permutation-and-numeric-boundary | ordering and boundary bytes remain stable | LEAG-03 | D-12; reduction invariance |
| repeat-layout-and-replay | repeat, shard, restart and replay are byte-identical | LEAG-01, LEAG-03 | D-10–D-13; identity/replay |
| round-targets | mixture and named pure targets remain frozen | LEAG-04 | D-13–D-15; target drift |
| accepted-counter-reentry | accepted counter creates a fresh round | LEAG-04, LEAG-09 | D-15; omitted counter |
| charged-outcomes | all non-success outcomes remain retained and charged | LEAG-09 | D-05, D-20; hidden retries |
| clone-and-novelty | clone, renamed clone and novel fingerprint differ | LEAG-06 | D-08, D-17; diversity laundering |
| mixture-and-portfolio | diagnostic mixture cannot promote to Strategy | LEAG-06, LEAG-07 | D-16–D-17; promotion boundary |
| robust-pure-pass | only maximin-oracle-relative pure with all hard gates passes | LEAG-07, LEAG-08 | D-18; aggregate-score overclaim |
| no-finalist | no robust pure finalist remains a valid disposition | LEAG-08 | D-19; least-bad substitution |
| nine-probes | all prescribed invariance probes are present | LEAG-09 | D-20; incomplete attack suite |
| hostile-runtime | hostile/illegal runtime output is blocked | LEAG-02, LEAG-09 | hostile source/runtime boundary |
| safe-projection-denial | private source/memory/objective/holdout/formation payloads are denied | LEAG-05 | D-21; privacy/public-claim boundary |

Connected mechanics are exercised by the existing `scripts/run-v1-38-serious-league.test.ts` injected 80-cell/two-round/nine-probe and 122-plus-48 response/reopen paths, with `league/integration.test.ts` asserting the private read-only exported fixture/reopen seam. `scripts/check-v1-38-serious-league-boundaries.test.ts` provides direct/transitive/barrel/dynamic/manifest/public-root denial coverage and its command audits the checked-in source graph.

The retained reader always returns `issued: false`; it cannot authorize a provider or dispatch. The only empirical authority remains a separately approved Phase 265 allocation after source review.
