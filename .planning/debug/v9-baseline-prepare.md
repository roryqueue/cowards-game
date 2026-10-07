---
status: investigating
trigger: Approved bounded v1.38 continuation; baseline preparation failed before allocation
created: 2026-10-07
updated: 2026-10-07
goal: find_root_cause_only
---

## Symptoms

Expected: independently reviewed fresh conditional36 baseline prepares a new immutable allocation after newly accepted diagnostic and actual FINAL closure.
Actual: unique MAIN52980 exited1/detailswithheld; 4404ms admission start/close; no allocation/store/entry/result/Match. MAINdraft62187 andfinalize23115 succeeded. ONE independent PREPARATION-terminal-only verification closed; source/HEADhold released. Existing approvedONEbaseline envelope now ended, no retries/newMatch.
Timeline: actualv9-2 diagnostic passed at heldHEAD1665c296/source664f2da8, oneSUCCESS/cumulative31/FINALclosure3c38820a. Source unchanged through baseline prepare atHEAD6c48eece.
Reproduction boundary: source-only pure input construction/finite metadata reads allowed, but NEVER rerun consumed prepare/helper/ordinaryreader or any Match. Do not expose raw private source/IO/errors. Exact actual throw point is withheld and not yet observed; distinguish proven static mismatch from causation.

## Current Focus

hypothesis: baseline preparation's accepted-diagnostic authentication re-enters diagnostic predecessor admission, where the current baseline prepare marker is misclassified as a spent diagnostic destination
test: trace the v9 baseline request -> accepted diagnostic authentication -> diagnostic request -> predecessor spent-destination guard, and compare with the exact destination inventory
expecting: distinguish the reproducible nested guard from MAIN's withheld exact throwpoint
next_action: stop diagnosis; recommend a scoped source correction without invoking the consumed route
reasoning_checkpoint: Samecaps72Mms15GB300/all31charges/allcosts/deadline06:19:23.053Z/reserve1860000. No empirical authority remains afterbaselineoutcome. Source-only diagnosis/repair may continue safely.

## Evidence

- Actualterminalreport: NEW265-16-V9-BASELINE-FOR-2-PREPARATION-TERMINAL-VERIFICATION-v1.md, 52980closed1/4404ms/nullallocation/parent57503absent.
- Freshrequestraw5f8f0cea417c8134d0bfb6347bf734e96b15f8d5898115f045d198f40729f4da.
- Acceptednewdiagnosticcheck0fd99e98/actualFINAL3c38820a/closed1791351187999/31charged; immutable, never re-run.
- 2026-10-07: Corrected required evidence path: terminal-verification report is under `.planning/phases/265-serious-current-rules-league-and-development-red-team/`, not a separate `265-16-v9-baseline-for-2-preparation-terminal-verification/` directory. Its recorded outcome matches the symptom summary: session 52980 exit 1, 4,404 ms, null allocation, no store/entry/result, and private failure details withheld.
- 2026-10-07: Static trace of `prepareLeanCorrection` -> `readLeanRemainingRequestV9` -> accepted-check authentication and `inspectLeanRemainingPredecessorV9` found the expected bounded chain. For baseline v9-2, the request path requires the accepted v9-2 check/FINAL closure; predecessor inspection includes v9-1 refusal custody and requires v9-2 accepted closure. The diagnostic nested authentication terminates on the diagnostic branch (which does not require baseline acceptance), so no static recursion contradiction is established.
- 2026-10-07: Static comparisons do not establish that any of these predicates caused session 52980 to exit. The terminal-only report intentionally withholds the exact error/throwpoint, and no matching in-process admission records are available in the report. Therefore no predicate mismatch or root cause can be claimed from the current evidence.
- 2026-10-07: One authorized inert check used the immutable baseline request (bytes root matched `5f8f0cea417c8134d0bfb6347bf734e96b15f8d5898115f045d198f40729f4da`), called `inspectLeanRemainingPredecessorV9("baseline", 1791351546464, "v9-2")`, and would have passed its returned predecessor into `createLeanSupervisorCorrectionAllocation(..., 8)` in memory. The predecessor call refused with finite validation code `LEAN_CORRECTION_SPENT_DESTINATION`; allocation construction was not reached. The source maps this code to the spent-destination predicate in `inspectLeanRemainingPredecessorV9`. This reproduces a preparation-path guard under present metadata, but because MAIN's exact failure is withheld it does not prove that this was MAIN 52980's throwpoint or identify which destination satisfied the guard. No publication, admission, test, or workflow was performed.
- 2026-10-07: Follow-up source trace confirms the nested path: `prepareLeanCorrection` calls `readLeanCorrectionRequest` for baseline v9-2; `readLeanRemainingRequestV9` authenticates the accepted diagnostic check; `authenticateLeanSupervisorDiagnosticCheck` calls `readLeanCorrectionRequest` for diagnostic v9-2; that request validation calls `inspectLeanRemainingPredecessorV9` with route `diagnostic`. The diagnostic-route spent scan does not exempt the current baseline v9-2 `admission-prepare-start.json`, so the just-started baseline prepare marker satisfies `SPENT_DESTINATION` during nested diagnostic custody validation. By contrast, top-level baseline inspection explicitly exempts its own ordinal (`route === baseline && i === n`).
- 2026-10-07: Parent-provided finite existence inventory states that the only v9-2 destination markers are the diagnostic store/allocation/prepare/run markers and the current baseline v9-2 prepare-start marker; all v9-1 and v9-3 baseline destinations are absent. This rules out those alternative baseline ordinals for the reproduced guard. The sequence explains why finalization passed before a prepare marker existed and why the inert same-anchor check fails after it exists. MAIN's terminal artifact still withholds the exact thrown code, so this is a source-confirmed causal path consistent with the refusal, not a directly observed original throwpoint.
- 2026-10-07: Correction recommendation for the source owner: separate immutable accepted-diagnostic lineage authentication from strict fresh diagnostic execution admission, scoping the own-ordinal baseline exemption narrowly to accepted-lineage validation; preserve future and other baseline spent-destination guards, accepted FINAL/source joins, and strict actual diagnostic execution admission. No change or route execution was performed here.

## Resolution

root_cause: accepted-baseline authentication re-enters diagnostic v9-2 request validation, whose diagnostic spent-destination scan sees the current baseline v9-2 prepare-start marker and raises LEAN_CORRECTION_SPENT_DESTINATION; this matches the refusal but MAIN's exact throwpoint remains unconfirmed
fix: recommended scoped separation of accepted diagnostic lineage authentication from fresh diagnostic execution admission, preserving other spent-destination and FINAL/source checks; not applied
verification: inert source-only check reproduced predecessor spent-destination refusal; allocation not reached; no MAIN throwpoint available
