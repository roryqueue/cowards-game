# Plan 16 two-pair v11 supplement — plan check v1

**Status: PASS, with one implementation-risk warning.** The additive supplement is sufficient to implement the approved v11-1/v11-2 plumbing without authorizing execution. It preserves the distinction between source-only preparation and any later empirical admission.

## Goal-backward check

| Required truth | Plan coverage | Result |
|---|---|---|
| v11-1 and v11-2 are distinct, bounded routes; ordinal 3, cross-pair reuse, and v10 route drift reject | Task 1 adds explicit ordinal discriminants, path/dispatch tables and rejection/regression tests | PASS |
| Cumulative time is `93,600,000 + max(0, now - 1791409410738)` ms, capped at `108,000,000`, with all wall time charged and no reset/idle subtraction | Binding bounds; Task 1 extension/accounting implementation and tests | PASS |
| 15GB, 300 Matches, all 32 historical charges/costs/files, 1,860,000ms reserve and per-route bounds remain unchanged; no 36-cell fit claim | Binding bounds; Task 1 positive and mutation tests; Task 3 fresh per-charge capacity gate | PASS |
| Pair 2 can follow any closed pair-1 terminal, including refusal/no entry, no result, failure, or result; it carries authentic evidence only | Task 1 explicitly implements/tests each carry case and pair-2 eligibility; Task 3 records actual custody | PASS |
| A baseline is admitted only by its own newly accepted diagnostic closure and actual `FINAL` | Task 1 same-pair gate and cross-pair mutation tests; Task 3 repeats the gate before baseline preparation | PASS |
| Old v10 acceptance is finite, non-authorizing custody; old ordinary readers are not rerun; each consumer audits accepted closure once without cache | Task 1 accepted-closure adapter, terminal-carry schema, one-audit instrumentation and v10 byte/dispatch regressions | PASS |
| Source-only changes receive independent review, bounded fixes, and exact-HEAD verification before data/helper reviews or MAIN entry | Task 2; Task 3 is explicitly gated on its clean close | PASS |
| No phase/LEAG completion, formation, holdout, public/counting/production authority is inferred | Binding restrictions, goal truths, and Task 3 stop conditions | PASS |

## Source/API seam check

The existing source has no v11 implementation today: `LeanRetryMode` ends with `v10-1`; the prospective binding and path selection route v10 to its fixed one-attempt extension; `parseLeanCorrectionCommand` accepts only v8/v9 ordinals and v10-1; child-supervisor dispatch and the shell temp-directory case table likewise lack v11. Retained verification schemas are versioned and v10-specific. The supplement names the affected implementation files, requires additive discriminants/path tables/CLI and shell dispatch, dedicated per-ordinal custody/request readers, terminal-only verification, and unchanged v10 behavior. Its focused tests exercise each missing route seam and the negative cases. I found no unaddressed source/API seam that makes the bounded implementation impossible.

The existing v10 accepted diagnostic and failed baseline are not interchangeable predecessor evidence. The plan correctly requires accepted diagnostic closure/check metadata plus actual `FINAL`, and the baseline's terminal-only custody, without ordinary historical-reader reconstruction. For v11-2, the pair-1 terminal is accounting/custody only, not success authority. This is consistent with the current `STATE.md` and the two approval records.

## Warning

- **WARNING — task specificity / API integration risk.** Task 1 spans the mode/caps model, request and authorization readers, accepted-closure join, predecessor custody, terminal-only verification, runner dispatch, and shell dispatch. It lists the files and behavioral tests but does not name the exact exported v11 reader/validator entry points or spell out the per-pair terminal-carry record fields. The implementation remains bounded and the research maps the required seams, so this is not a goal blocker; Task 1's RED fixtures should pin those concrete contracts before production edits, as already required by its RED/GREEN ordering.

## Checks and limitations

- Read `265-16-TWO-PAIR-RESEARCH-v1.md`, `265-16-TWO-PAIR-TIME-APPROVAL-20261007.md`, `265-16-TWO-PAIR-APPROVAL-20261007.md`, and current `.planning/STATE.md` entries for the approved time extension and pair status.
- Read the additive supplement and inspected the existing mode/type/binding/path/survivor functions in `packages/strategy-lab/src/league/lean-experiment.ts`, CLI parser and child dispatch in `scripts/run-v1-38-lean-correction.ts`, retained verification seams in `scripts/lib/v1-38-lean-correction-retained.ts`, and the shell route/temp dispatch.
- This is a plan review only. No source was changed; no test, route, provider, Match, allocation, private payload, or historical reader was run or created. It grants no admission or empirical credit.
