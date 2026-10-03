---
status: investigating
trigger: Fresh private V12 entry stopped with TypeError before publishing league evidence or result
created: 2026-10-03
updated: 2026-10-03
goal: find_root_cause_only
---

# Phase 265 V12 pre-reservation stop

## Symptoms

- Expected: checked private V3 entry statically validates all inputs, then admits fresh same-process capacity before reserve/charge/dispatch.
- Actual: unique entry15575/PID44627 ended exit1 after approximately15minutes; retained failure marker reports TypeError, details withheld, resultPublishedfalse, noRetrytrue.
- Error: finite public wrapper code PHASE265_V12_ENTRY_FAILURE; underlying throw point/cause UNKNOWN.
- Timeline: entry2026-10-03T04:28:03.922Z; failure2026-10-03T04:42:54.570Z.
- Evidence: league-evidence real0700 empty; reserved canonical result-v12 zero bytes; no result head, so ordinary retained verification cannot be invoked. The bounded unique terminal-only verification is complete.
- Production source: accepted9ffde3ff, actual858entries implementation552bba3d/source defe5024; unchangedHEAD526bb7c1. V12 allocation admitted02bb7a07/raw19cce0e4.
- Scope: diagnosis only, no Match/provider/native construction/capacity receipt/reservation/route replay, no consumed artifact edits, no source/bound changes.

## Current Focus

- hypothesis: present free disk is below the exact static physical projection plus terminal reserve plus required free margin, predicting LEAGUE_ALLOCATION_CAPACITY_MARGIN before reservation. This is a present-resource candidate; the original TypeError cause remains unknown.
- test: completed one authorized present resource observation and pure arithmetic comparison; no receipt/CLI/run/historical candidate replay.
- expecting: no additional observation; return the precise present disk deficit separately from unproved retrospective original causality.
- next_action: return INVESTIGATION INCONCLUSIVE for the original failure, with confirmed present disk-margin rejection candidate and completed safe report; no repeated observation or further scan without separately bounded direction.
- reasoning_checkpoint: retained evidence cannot establish absence of all unrecorded host observations/transient native construction; do not guess original throw point from empty records.

## Evidence

- timestamp: 2026-10-03
  observed: independent entry-terminal-only report confirms exact immutable start/failure/allocation byte bindings, closed process and empty retained evidence/result reservation; cause unknown.

- timestamp: 2026-10-03
  checked: complete authoring module, factory repository read path, allocation admission and prospective producer check, imported CLI/transport guards
  found: preflightLeagueAuthoring calls allocation admission, artifact/schema/hash joins and model path metadata checks only. createFactoryRepository validates/freeze-wraps an existing directory without inventory recovery. App-server spawn is inside createFactoryAppServerTransport, which the direct preflight never invokes; intake CLI main is import-meta guarded. No Worker/Docker/model/provider operation lies on the direct preflight call path.
  implication: the eleven direct static job checks can run without executing the run CLI, capacity observation/admission, reserveRun, factory publication or Strategy code; a new reproduction will not independently identify the original unrecorded throw site.

- timestamp: 2026-10-03T04:54:56.135Z
  checked: pnpm exec tsx .strategy-lab/265-v12-static-authoring-diagnosis-20261003-bounded-v1.ts
  found: exact raw/admitted allocation identities checked; all eleven actual compiled authoring jobs passed. Diagnostic timestamps 04:54:51.978Z–04:54:56.135Z, internal 4155.492574ms, shell 4.962549139s, exit0. Ordinal0–10 durations 270.052936/262.369237/238.950414/259.899280/247.800855/237.244737/244.204159/252.075891/241.272327/239.217932/266.056286ms. No raw private artifact values or unknown error strings emitted. No historical scan or capacity/Match/native/model operation invoked.
  implication: current direct authoring checks do not reproduce the original failure; only static success, not league readiness or original-cause proof.

- timestamp: 2026-10-03
  checked: scripts/run-v1-38-serious-league.ts source-order lines684–720 plus LeagueConnectedSession constructor lines449–457
  found: actual entry uses capacity-input, not capacity-receipt. prepareLeagueRunInputs runs source/allocation/plan joins, historical candidate reader and candidate closure checks, all eleven authoring checks, then read-only empty league inventory. runSeriousLeague next measures/admit fresh capacity, re-observes via guard, builds budget, and constructs session. Session constructor validates the supplied new receipt and observes capacity again before reserveRun. reserveRun and run-start publication are before the main try/catch; native provider construction is inside later cell execution.
  implication: capacity-input branch has no live observation inside prepareLeagueRunInputs. Cheap authoring pass does not establish original completion of the preceding historical reader; empty evidence does not exclude capacity observation or session construction before reservation.

- timestamp: 2026-10-03T04:57:38.285Z
  checked: pnpm exec tsx .strategy-lab/265-v12-static-joins-diagnosis-20261003-bounded-v1.ts
  found: exact allocation and capacity-plan raw bindings match; pure admitLeagueCapacityPlanInput passes; derived current implementation/source bindings both match. Diagnostic timestamps04:57:37.598Z–04:57:38.285Z, internal685.900575ms, shell2.672610530s, exit0. No live host measurement or receipt creation/admission occurred. Source inventory excludes root private/planning/generated/dependency evidence; no historical candidate reader was called.
  implication: current static capacity-plan/source join failure is eliminated; no TypeError has been newly reproduced and no original throw point is established.

- timestamp: 2026-10-03
  checked: original retained start/failure timestamps from completed terminal-only report, compared with new diagnostic scope
  found: original wrapper interval890.648seconds (14m50.648s); wrapper preserves only TypeError and withheld details. The main run failure catch begins after reserveRun/run-start, so absence of a retained head does not label which earlier operation threw. The historical reader dominates the observed prior routes but was not replayed; duration resemblance is not causal proof.
  implication: source narrowing plus static passes are not a retrospective original-cause diagnosis. No capacity/Strategy/system-failure subtype or absence of all unrecorded construction is inferred.

- timestamp: 2026-10-03T05:01:05.110Z
  checked: newly authorized pnpm exec tsx .strategy-lab/265-v12-present-resource-diagnosis-20261003-bounded-v1.ts; full existing darwin-headroom request/parser and source capacity arithmetic read first
  found: began05:01:03.830Z, observedAt05:01:05.103Z, ended05:01:05.110Z; internal1279.066244ms, shell1.989471735s, exit0. Exactly two statfs calls (one per exact declared directory), same filesystem; exactly one allowed /usr/bin/memory_pressure -Q invocation (C locale,200ms timeout,4096byte max,shellfalse), every other child/Worker/fswrite blocked. Free disk209669144576bytes; physical projected167418829480 + terminal reserve21474836480 + free margin21474836480 = required210368502440; deficit699357864bytes. Effective available memory11854109736 vs required1073741824bytes passes. Raw command buffers were wiped, never emitted; no receipt constructed/admitted or runtime operation called.
  implication: confirmed present disk-margin rejection candidate. Source createLeagueCapacityReceipt would reject this vector with LEAGUE_ALLOCATION_CAPACITY_MARGIN during measureProspectiveCapacity before reserveRun. That function was not invoked and no TypeError was newly thrown. Original free disk and capacity-stage arrival remain unknown; retrospective original root cause is not confirmed.

## Eliminated

- hypothesis: at least one actual V12 compiled job deterministically fails direct preflightLeagueAuthoring under unchanged source/current filesystem metadata.
  evidence: every actual job ordinal0–10 passed the guarded read-only direct preflight; source and consumed artifacts unchanged.
  timestamp: 2026-10-03T04:54:56.135Z

- hypothesis: the exact current capacity plan or derived implementation/source binding deterministically fails its cheap pure static join.
  evidence: exact-byte plan admission succeeds and both source binding comparisons are true in the new read-only diagnostic.
  timestamp: 2026-10-03T04:57:38.285Z

## Resolution

- root_cause: original TypeError unknown; present disk-margin deficit699357864bytes is a confirmed current rejection candidate only, not retrospective causal proof
- fix: not applied
- verification: terminal-only scope complete; eleven direct static authoring checks and exact static capacity-plan/source joins pass. Single present resource observation finds insufficient disk margin and sufficient memory. Original diagnosis INCONCLUSIVE; no original TypeError reproduced or throw site authenticated.
- files_changed: debug file, one new safe phase report and three fresh private diagnostic scripts only; none in production or consumed artifacts
