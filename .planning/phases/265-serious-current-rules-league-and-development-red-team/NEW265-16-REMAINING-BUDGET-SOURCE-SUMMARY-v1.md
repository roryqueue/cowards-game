---
phase: 265
plan: 16
subsystem: private-lean-envelope
status: complete
scope: checked-source-supplement-only
empirical_admission: false
tags: [source-only, tdd, v9, bounded-custody]
requires: [remaining-budget-envelope-approval-20261007, checked-remaining-budget-research-plan-v1]
provides: [exact-v9-mode-plumbing, finite-spent-prefix-custody, new-only-final-baseline-join]
affects: [prospective-private-v9-diagnostic-and-conditional-baseline]
tech-stack:
  added: []
  patterns: [exact-additive-envelope-binding, bounded-terminal-only-failure-carry]
key-files:
  created: [scripts/lib/v1-38-lean-remaining-budget.test.ts]
  modified: [packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-correction.ts, scripts/lib/v1-38-lean-correction-retained.ts, scripts/run-v1-38-lean-correction.sh, scripts/lib/v1-38-lean-baseline-retained.ts, scripts/run-v1-38-lean-host-stage-v8.test.ts]
completed: 2026-10-07
---

# Plan265-16 remaining-budget source supplement summary

Exact additive `v9-1/2/3` route identities now preserve the approved remaining-budget binding through request, allocation, CLI/shell/child, retained closure and conditional-baseline consumers. This completes the two source implementation tasks only; Plan265-16, Phase265, empirical source/data/allocation/capacity gates, independent source review/validation/verification and all downstream freezes remain incomplete.

## Atomic tasks and commits

1. RED: `88ee7f40` — new inert contract tests actually failed (10 failures / 5 passes), then committed without implementation.
2. GREEN: `301540f8` — exact new binding, mode plumbing, bounded custody, tests and connected consumers. Normal hooks used; no push.

The existing allocation/request v8 schemas are reused only with the exact independently admitted `lean-remaining-budget-envelope-v9` binding. Allocation mode derives `v9-N` from that binding, not an ordinal cast to v8. Runtime receipt version 8 and inherited broker/startup version 7 remain shared schema/wire identities, not permission to reinterpret a v9 route as legacy v8. `scripts/run-v1-38-lean-baseline.ts` required no edit because its existing admitted-allocation branch already handles this shared schema.

Legacy v8 constants, exact route paths, historical artifact bytes and default legacy closure semantics were not rewritten. New v9 pre-entry closures have no invented allocation, child entry/terminal, result or accepted-check identity. Failed/refused/absent v9 closures are nonauthorizing and `finalReaderClose: false`; only a new accepted ordinary check with actual final reader close can enable the single baseline. A failed new prefix is independently authenticated from finite closed receipt/journal/request byte custody after an applicable source repair, without rerunning an ordinary reader or requiring the failed source to equal the new source.

## Accounting and custody

The exact new extension carries 64,594,435 ms at 1791346557488, all task costs thereafter, 30 historical charges, the approved excluded idle only, three diagnostic identities and one conditional baseline. Unchanged limits are 72,000,000 ms (deadline 2026-10-07T06:19:23.053Z), 15,000,000,000 bytes, 300 Matches, reserve 1,860,000 ms, guest 1,000 ms, host 5,000 ms, startup 2,500 ms and Match 600,000 ms. No refund, reset or full-36 fit guarantee is introduced; historical resource peaks remain unknown.

Old v8-2 preparation custody authenticates ten bounded exact raw pins, including its actual wrapper source/data-review paths and terminal-only planning report. It asserts zero new charges and no store/allocation/child/result/entry or fabricated FINAL acceptance. Old accepted v8-1 diagnostic and failed baseline contribute pinned finite history/cost only through the existing bookkeeping authenticator, never old full-reader authority.

The original complete physical inventory is carried with at least 367 rows / 14,864,384 allocated bytes. Every full row is validated against exact allowed identities before any schedule-only filtered view; only that view is fed to the unchanged schedule builder. New review-path identities are exact, not a phase-directory wildcard. Existing old exceptions remain scoped to legacy bookkeeping. Physical report rows and bounded raw report byte roots are included separately in the predecessor history root. The new functional manifest includes approved envelope/plan/research, existing source closure and owned tests/implementation, but excludes source/data-review reports and is identical across new ordinals.

## Verification results

- Final envelope contracts: 18/18 pass, `pnpm exec vitest run scripts/lib/v1-38-lean-remaining-budget.test.ts --maxWorkers=1`.
- Finite connected set: 145/145 pass across remaining-budget, bookkeeping-continuation, correction-retained, baseline-retained and correction tests with one worker. This run preceded the final extra full-review-row test; that final file was then rerun independently at 18/18.
- Synthetic actual retained lifecycle / accepted-FINAL baseline join: 7 pass, 24 unrelated host-stage tests not selected, using `-t 'v9 synthetic actual|joins FINAL close' --maxWorkers=1`. All runtime/native/provider dispatch is denied by these fixtures. The test-only timeout is 30 seconds; no runtime allowance was changed. Coverage includes accepted/refused/absent one-shot closures, zero-charge pre-ledger failure surviving changed source/HEAD, wrong source/check/non-FINAL refusal, and actual diagnostic/baseline HEADs with committed allocation ancestry and clean functional-source diffs.
- Configured `pnpm --filter @cowards/strategy-lab typecheck`: pass.
- `bash -n scripts/run-v1-38-lean-correction.sh`, `git diff --check`: pass.
- Configured factory boundary scan: pass, 1,415 files, zero violations.

Initial combined connected run was 165 passes / 8 failures. One new synthetic accepted-case test hit Vitest's default 5-second timeout; its explicit test-only timeout was corrected, and the scoped synthetic set passed. Five historical ordinal2 fixture cases collided with an already-existing immutable v8-2 setup path; two legacy pre-entry fixture cases refused admission custody. Those historical fixture gaps were not repaired by overwriting history or broad recertification, and those cases were excluded from later scoped runs. This is not a whole-suite pass claim.

A standalone ad hoc strict scripts compile reports six inherited errors: `feasibility-protocol.ts:52` JSON optional-undefined mismatch and `planner/missions.ts:52,60,66,68,69` undefined SoldierSnapshot mismatches. No changed production-owner error was reported. The configured strategy-lab build passes; inherited standalone errors were not expanded into unrelated repairs.

## Practical MAIN handoff — authoring only after independent gates

Exports from `scripts/run-v1-38-lean-correction.ts`:

```ts
leanRemainingDocumentsV9(route: "diagnostic" | "baseline", mode: LeanRetryMode)
createLeanRemainingSetupWitnessV9(mode: LeanRetryMode, observedAtMs: number)
createLeanRemainingRequestDraftV9(mode: LeanRetryMode, route: "diagnostic" | "baseline", input: {
  sourceRoot: LabRoot; reviewRoot: LabRoot; dataReviewRoot: LabRoot;
  setupAccountingRoot: LabRoot; reuseGrantRoot: LabRoot; authorizationRoot: LabRoot;
  priorClosureRoot: LabRoot | null; continuationRoot: LabRoot | null;
  acceptedCheckRoot: LabRoot | null; acceptedReaderCloseRoot: LabRoot | null;
})
leanCorrectionSourceManifest(mode, LEAN_REMAINING_V9_EXTENSION)
leanCorrectionRequestDataRoot(request)
readLeanRemainingRequestV9(path, route, mode)
inspectLeanRemainingPredecessorV9(route, accountingAtMs, mode)
```

The setup/request draft helpers are pure, not publication, authorization or admission. MAIN must create independently reviewed exact documents and its own immutable private authorizations. Request data roots deliberately exclude the later authorization/data-review byte roots, so those can be authored without a self-hash cycle. Ordinal1 uses null predecessor/continuation roots; later ordinals bind the actual closed previous failed new route and a `lean-remaining-continuation-v9` body with exact extension, ordinal, prior closure, new source root and review root. Baseline selects the one newly accepted diagnostic ordinal and pins its actual accepted check and final closure. Use the exports to obtain exact setup/report/authorization/request/allocation/temp/store paths; never use old manifest/request helpers to reopen history.

The shell's exact new modes are:

```text
prepare-supervisor-diagnostic-v9-N
run-supervisor-diagnostic-v9-N
verify-supervisor-diagnostic-v9-N
verify-terminal-supervisor-diagnostic-v9-N
prepare-supervisor-baseline-v9-N
run-supervisor-baseline-v9-N
verify-supervisor-baseline-v9-N
```

Here N is exactly 1, 2 or 3; each requires `--request` with the exact selected route path. New destinations are dated 20261007 and never alias the historical v8 paths. The shared retained receipt filename is `retry-closure-v8.json` in that distinct new route's store, or temp for actual pre-entry failure. A failed receipt is terminal-only/nonauthorizing, not an accepted check. These commands were not invoked on a real route by this source execution.

Each real route still requires MAIN's current data/source review, new real empty0700 store, immutable allocation committed before the unique entry, and actual passing SAME-PROCESS capacity. The inherited baseline lineage guard binds each actual HEAD separately: diagnostic and baseline allocation commits may differ only with valid ancestry, committed exact allocations and unchanged functional source at both HEADs. It does not fabricate equal HEADs or weaken the source/HEAD join.

## Deviations and limits

No scope expansion, UI/rules/engine change, public/counting/production authority or empirical credit. No actual MAIN preparation/request-authoring/helper/allocation/entry/provider/Strategy/Match operation, old ordinary reader, approval mutation, history overwrite/deletion, STATE/ROADMAP edit or push. Fixture-generated temporary files were cleaned only by their existing scoped test teardown; existing untracked user history was preserved.

The practical source handoff is ready for independent review. Actual memory feasibility, complete 36-cell fit and all experimental outcomes remain unestablished. Independent review may find additional bounded source issues; this summary is not a source-gate or empirical acceptance report.

## Self-Check: PASSED

Owned test/source files exist; RED `88ee7f40` and GREEN `301540f8` exist. Both task commits have no tracked deletions. This source-summary is the owned metadata output; parent retains all state/frontier and source-review/verification responsibilities.
