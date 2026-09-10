---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "02"
subsystem: strategy-lab-planner
tags: [missions, ordered-beam, deterministic, legal-observations]
requires: [{phase: 263-01, provides: Canonical legal corpus and frozen structural budget}]
provides: [Ten mission objective lifecycles, Dual-initiative ordered assignment beam]
affects: [263-03, 263-06]
tech-stack:
  added: []
  patterns: [Type-only canonical imports, Lexicographic worst-hypothesis ranking, Reserved complete fallback]
key-files:
  created: [packages/strategy-lab/src/planner/missions.ts, packages/strategy-lab/src/planner/missions.test.ts, packages/strategy-lab/src/planner/assign.ts, packages/strategy-lab/src/planner/assign.test.ts]
  modified: []
key-decisions:
  - Mission goals are observational intentions, never a duplicate Action legality or transition engine.
  - Fixture context is ignored rather than interpreted as the deployed mission ABI.
  - Shared phase tracking remains with the orchestrator during concurrent execution.
requirements-covered: [PLAN-01, PLAN-02]
requirements-completed: []
duration: 9min
completed: 2026-09-09
status: complete
---

# Phase 263 Plan 02: Observable Missions and Ordered Assignment Summary

Ten bounded mission lifecycles and a beam-four ordered assignment policy rank both initiative hypotheses with noncompensatory hard constraints and a reserved complete fallback.

## Accomplishments

- Evacuation selects an inward goal; rear-entry selects the observed target rear; edge-push selects the inward pushing side of a near edge; screen interposes between ally and enemy; anchor selects center facing; graph-cut STONE ranks local visible-occupancy detour obstruction; reserve waits for a later Round; recovery changes facing toward pressure; bait uses an allied supporting position; pincer chooses the flank opposite a named partner.
- Strict mission-v1 packets bind visible Soldier/target/partner IDs, goal coordinates, phase/round validity, and goal facing. Reject unknown fields, invalid coordinate shape/bounds, hidden references, enemy/friendly target mismatches and missing/inappropriate partners. Known ASCII bounded fields make serialized length equal canonical UTF-8 length, tested through the canonical encoder at the1024-byte limit.
- Lifecycle returns active/complete/stale/failed with reasons; expiry, target movement, Soldier/target/partner loss, immobility and mission-specific completion are explicit. Cheap reserve fallback never claims a new Action or Advance.
- Beam evaluates ordered assignments with both entrant-first/entrant-second pressure estimates. Lexicographic survival, assignment legality, immediate tactical obligations and mission consistency precede soft preferences. Compare complete worst-hypothesis vectors, not fabricated per-component worlds. IDs/mission ordinals/coordinates determine stable ties.
- Reserve up to canonical activationCount distinct ACTIVE Soldiers before optional expansion. Optional expansions never exceed256; beam never exceeds4. StrategyMemory contains actual expansion/reservation/hypothesis counters and bounded missions, not private prior-memory fields. Zero optional budget still returns complete schema-valid assignments.

## Task Commits

1. Mission RED: `723b7c48`; GREEN: `7ab72327`.
2. Assignment RED: `43307155`; GREEN: `28d0fa74`.

Both RED runs failed on their absent implementation module before implementation. No tracked files were deleted.

## Verification

- `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/planner/missions.test.ts packages/strategy-lab/src/planner/assign.test.ts`:20/20 passed,4.06seconds. Includes ten active/complete/stale/failed/fallback cases, forged packets, distinct mission goals, hard-before-soft, both initiatives, activationCount1..4, insufficient ACTIVE population, zero budget, stale memory, array-order invariance, visible-danger positive control and all100 canonical planner corpus cases.
- `./node_modules/.bin/tsc -b packages/strategy-lab`: passed.
- No package install, lockfile edit, live emitted-source execution, preflight, benchmark, Match, holdout, formation, runtime-limit change or production import occurred.
- No TODO, placeholder or unwired behavior stubs in owned implementation.

## Deviations and Limits

- Initial recovery positive fixture was already facing its goal; corrected fixture to face away, making the positive-to-complete assertion substantive.
- Early package typecheck intersected Plan04's unfinished test module. No edits were made to that agent's files; final package typecheck passes after its implementation landed.
- Removed a test-to-test fixture import before finalization so the20-test total has no duplicate suite registration.
- Pure policy functions expect canonically admitted StrategyInputV119, as supplied by the existing runtime boundary. Objective packets deliberately cap printable ASCII references at128 characters; current generated canonical Soldier IDs satisfy this representation. No arbitrary user-defined identifier support is claimed.
- Tactical and connectivity quantities are bounded policy heuristics, not exhaustive reachability, forced-win proofs or graph articulation certificates. No empirical source/runtime feasibility or competitive strength is claimed; those remain downstream gates.
- Reservation and hypothesis/expansion counters describe the declared search units; preprocessing and fixed bounded candidate scoring are not measured elapsed-time evidence.
- Shared STATE/ROADMAP/REQUIREMENTS and barrel integration are reserved for the parent orchestrator to avoid concurrent overwrite.

## Integration API

`MissionObjective`: `{schemaVersion:"mission-v1",kind,soldierId,issuedPhase,issuedRound,expiresPhase,goal:{x,y},goalFacing,targetId,targetPosition:{x,y}|null,partnerId}`.

`createMission(kind,input,soldierId)` returns a packet or null when unsupported. `validateMission(value,input)` is the strict packet guard; `evaluateMission(packet,input)` returns status/reason; `fallbackMission(input,soldierId)` produces reserve for an eligible ACTIVE Soldier. `selectPlannerActivations(input,budget={maxExpansions:256})` returns the actual StrategyResult. `compareAssignmentCandidates` and `scoreAssignment` expose ranking for focused tests.

Both implementation modules use only type imports from canonical spec plus their local mission module; no host/package runtime capability enters the policy. Plan03 owns source bundling. Corpus `fixtureContext` is intentionally ignored and is not the mission ABI; any downstream replacement/mapping must be explicit.

## Self-Check: PASSED

All four implementation/test files exist; all four task commits exist. Focused suites and package typecheck pass. Parent retains shared tracking ownership.
