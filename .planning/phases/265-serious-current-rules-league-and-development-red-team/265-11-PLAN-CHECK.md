# Phase 265 Plans 11–12 — pre-execution plan check

**Verdict: BLOCK.** Three blockers require plan revision before Plan 11 source work or Plan 12 allocation. This is a static plan check only: no allocation, host/Docker preflight, provider, Strategy, Match, or historical artifact write was performed. Plans 11–12 are a bounded diagnostic route, not Phase 265 completion; LEAG-01–09 and the Phase 266 freeze remain blocked regardless of a one-cell success.

## Goal-backward scope

The Phase 265 goal is a complete independently attacked current-rules empirical game, response loop, diverse pure portfolio, and robust-pure or explicit no-finalist outcome. Existing Plans 01–07 cover LEAG-01–09 in their frontmatter and source tasks, but Plan 07's sole empirical run is consumed `process_invalid`; Plan 09's separate four-cell pilot is likewise consumed after one charged failure. Plan 10 is source-only and its signed gate explicitly has `empiricalAuthority:false` and `runAllowed:false`. Plans 11–12 correctly say that a new single cell can diagnose or measure one Match, never complete any LEAG requirement, permit a freeze, or begin formation. Their safe incremental objective is reviewable, but it must not be reported as phase-goal achievement. The prospective research also deliberately leaves the later 4,632-Match feasibility policy and a no-success outcome as future human-only decisions.

## BLOCKER 1 — v3 execution cannot use the specified protected bridge as planned

**Dimension:** key links / architectural tier / task completeness. **Plan:** 265-11, Tasks 1–2.

Plan 11 promises an exact, version-disjoint one-cell `allocation-v3`, start, stage ledger, and new mode-0700 store while directing Task 2 to reuse `runDiagnosticPilotCell`, the Plan 10 worker/IPC semantics, and existing supervised issuers. Its `files_modified` contains only new v3 files and review artifacts. The existing exported `issueDiagnosticPilotProviderFromFactoryCandidate` and `runDiagnosticPilotCell` both call `admitDiagnosticPilotAllocation` and `admitDiagnosticPilotCell`; those constructors require the old `diagnostic-pilot-allocation-v1` schema, old seed, four condition rows, 1,800,000-ms overall bound, and old-derived roots. `openDiagnosticPilotLedger` also accepts only the consumed Plan 09 directory. See `packages/strategy-lab/src/league/diagnostic-pilot.ts` allocation/ledger contracts and `packages/strategy-lab/src/league/connected-runner.ts` pilot issuer/runner. A cast or v1 wrapper would make the claimed v3 allocation/charge different from the allocation authenticated by the host boundary; direct provider construction in the new coordinator would bypass the opaque-issued-provider protection.

**Required revision:** Name and own a concrete version-neutral or v3-specific private issuer/runner and ledger adapter that authenticates the *same* v3 allocation/cell/start/charge at provider issuance and canonical `MATCH_KERNEL` entry. Add the actual existing files requiring changes (at minimum the connected-runner bridge, with focused tests) to Plan 11's file list/source closure, or describe an equally exact new-file integration that uses the protected issuer without lying about v1 identity. Preserve all v1/v2 exports, path checks, roots, old verdicts and source-gate verification. Add a negative test that a v3 charge cannot be accepted as an old four-cell charge, and vice versa.

## BLOCKER 2 — failed standalone preflight does not durably expire the route

**Dimension:** key links / cross-plan data contract / verification derivation. **Plans:** 265-11 Task 2 and 265-12 Tasks 2–3.

Plan 12 says the sole standalone preflight is attempted once and a failed or unknown observation expires the route with no `run`. Yet Task 2 lists only authorization and allocation files; its automated verification checks only the allocation. Plan 11's CLI contract requires an exact operator approval for live selectors but specifies no rooted preflight disposition, consumption marker, or `run`-side join to a passed preflight. Task 3's prose says to run only after Task 2 passed, but its proposed command accepts approval/gate/allocation/result/repository paths, not a preflight proof. If preflight denies for transient capacity, the same still-present authorization and allocation could later pass the run process's repeated host checks and launch a Match, contradicting the promised terminal no-dispatch outcome. A mutable summary statement cannot be the only one-shot enforcement.

**Required revision:** Either make preflight and the conditional run one indivisible guarded command, or plan an exclusive, rooted v3 preflight-disposition artifact with exact allocation/authorization/source-gate/host-observation identities and a durable one-shot state. A failed/unknown disposition must make `run` permanently ineligible; a passed disposition must be checked by `run` *in addition* to its fresh same-process host/capacity admission. Add no-retry/failure-injection tests, Plan 12 file/verify coverage, and an unambiguous no-start terminal/attempt marker. Do not treat any of Plan 09's three unused slots as balance.

## BLOCKER 3 — requirement frontmatter contradicts the diagnostic-only contract

**Dimension:** requirement coverage / context compliance. **Plans:** 265-11 and 265-12 frontmatter and summaries.

Both new plans declare `requirements: [LEAG-02]`, while each source-coverage audit, must-have denial and the committed prospective research explicitly say the diagnostic completes **none** of LEAG-01–09. LEAG-02 is the complete-league rule that every missing, duplicate, conflicting, invalid or system-failed *payoff cell* blocks meta-solving; one diagnostic cell can exercise its fail-closed principle but cannot deliver its full empirical requirement. Plan 10 correctly left requirement credit empty. Leaving a contradictory requirement mapping risks a GSD execution summary or milestone audit treating the new one-cell route as LEAG-02 completion and then incorrectly advancing the current-league/freeze chain.

**Required revision:** Remove `LEAG-02` from these diagnostic-only frontmatter fields (or use the project's explicit non-credit mechanism if one exists), and require both summaries to set `requirements-completed: []` and retain LEAG-01–09 unchecked even on a process-valid one-cell result. Existing Plans 01–07 keep the actual requirement coverage obligation; the consumed Plan 07 run does not complete it.

## Checks that otherwise pass for this bounded route

| Dimension | Finding |
| --- | --- |
| Structure/dependencies/scope | `verify.plan-structure` reports three complete tasks in each plan. Plan 11 wave 7 depends on completed Plan 10 (wave 6); Plan 12 wave 8 depends on Plan 11. No cycle or same-wave file conflict; 9 and 4 declared files respectively. |
| Research/context | The v3 seed and derived S01/S03 Smoke `a-bottom-a-first` request, private current rules, no formation/holdout/public/counted route, zero retry, old-history immutability, and no diagnostic-to-LEAG promotion follow D-01–D-10 and `265-11-PROSPECTIVE-RESEARCH.md`. Deferred formation/rule changes are absent. The new overall 600,000-ms bound is correctly marked proposed and subject to later exact human approval. |
| Admission/resource plan | Plan 11 requires complete independently reopened execution-manifest joins before any process-valid diagnosis, negative partial/system/duplicate/uncertain tests, six stage and post-link/fsync/IPC faults, a conservative 21,686,779,904-byte / 2,218,528-record / 4,437,184-inode single-cell ceiling plus terminal reserve, and a hard component sum within the proposed 600,000-ms entry envelope. Arithmetic leaves 285,261 ms beyond the 44,739-ms reader, 240,000-ms cell and 30,000-ms reserve; signing is refused if another component lacks a maximum. These are source gates, not observed host feasibility. |
| Authority/privacy | Plan 11's independent signed source gate remains explicitly non-authorizing, and live selectors are required to reject Plan 10/11 gates alone, generic approval and old unused slots. Plan 12 is `autonomous:false` with an exact fresh human checkpoint before allocation or host observation, then repeat host admission inside the run process. Both preserve old Plan 07/09 result roots and five old baselines. |
| Nyquist/AGENTS | Phase `265-VALIDATION.md` exists, Nyquist is enabled, and all six tasks have automated checks (with an additional human check at the checkpoint). New tests are injected/source-only; no watch command, raw guest exception retention, direct-source executor, React rules, public DTO or engine mutation is planned. The independent receipt calls for the existing full 29-file league suite, strict types/build and relevant boundary/privacy checks. |
| Pattern map | New v3 files are not enumerated in the older phase `265-PATTERNS.md`; the prospective research supplies the applicable analogs, but Blocker 1 must make the protected bridge wiring concrete and include any newly modified analog files in the review closure. |

## Structured issues

```yaml
issues:
  - plan: "265-11"
    dimension: key_links_planned
    severity: BLOCKER
    task: 2
    description: "The named supervised issuer/canonical bridge only accepts the consumed four-cell v1 identity and old ledger path, while the v3 plan owns no bridge adaptation."
    fix_hint: "Plan a v3-authenticating protected issuer/runner and ledger integration, add its existing files/tests to source ownership and signed review, and prove v1/v3 cross-admission fails."
  - plan: "265-11/265-12"
    dimension: cross_plan_data_contract
    severity: BLOCKER
    task: "11-T2; 12-T2/T3"
    description: "A failed standalone preflight is claimed to expire the one-shot route, but no durable disposition or run-side pass/denial join is planned."
    fix_hint: "Use a single guarded command or a rooted exclusive preflight disposition checked by run, with failure permanently denying run and tests/verification for the no-start path."
  - plan: "265-11/265-12"
    dimension: requirement_coverage
    severity: BLOCKER
    task: "frontmatter and summaries"
    description: "Both diagnostic-only plans claim LEAG-02 in requirements frontmatter although they explicitly cannot complete any LEAG requirement."
    fix_hint: "Remove false LEAG-02 credit and mandate requirements-completed: [] in both summaries, including after a process-valid diagnostic cell."
```

**Recommendation:** Return all three findings to the planner. Recheck the revised plan set before any Plan 11 execution. Even after a bounded-route PASS, Plan 12 still cannot start without the exact later operator literal, and a one-cell result cannot close Phase 265.
