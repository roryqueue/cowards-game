# Roadmap: Coward's Game

## Milestones

- [x] **v1.0 MVP** - Phases 1-7, shipped 2026-05-17. See `.planning/milestones/v1.0-ROADMAP.md`.
- [x] **v1.1 Trustworthy Simulation Beta** - Phases 8-13, shipped 2026-05-18. See `.planning/milestones/v1.1-ROADMAP.md`.
- [x] **v1.2 Competitive Alpha** - Phases 14-18, shipped 2026-05-19. See `.planning/milestones/v1.2-ROADMAP.md`.
- [x] **v1.3 Competition Trust Beta** - Phases 19-24, shipped 2026-05-20. See `.planning/milestones/v1.3-ROADMAP.md`.
- [x] **v1.4 Cycle-Interleaved Rules Correction** - Phases 25-29, shipped 2026-05-20. See `.planning/milestones/v1.4-ROADMAP.md`.
- [x] **v1.5 Strategy Workshop Power Tools and Advanced Strategy Library** - Phases 30-37, shipped 2026-05-21. See `.planning/milestones/v1.5-ROADMAP.md`.
- [x] **v1.6 Workshop Analytics and Evidence Explorer** - Phases 38-44, shipped 2026-05-22. See `.planning/milestones/v1.6-ROADMAP.md`.
- [x] **v1.7 Runtime and Backend Boundary Stabilization** - Phases 45-50, shipped 2026-05-22. See `.planning/milestones/v1.7-ROADMAP.md`.
- [x] **v1.8 Production Boundary Hardening** - Phases 51-56, shipped 2026-05-22. See `.planning/milestones/v1.8-ROADMAP.md`.
- [x] **v1.9 Backend and Runtime Ownership Split** - Phases 57-63, shipped 2026-05-23. See `.planning/milestones/v1.9-ROADMAP.md`.
- [x] **v1.10 Service Boundary Completion and Go Read-Model Decision** - Phases 64-69, shipped 2026-05-23. See `.planning/milestones/v1.10-ROADMAP.md`.
- [x] **v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence** - Phases 70-75, shipped 2026-05-23. See `.planning/milestones/v1.11-ROADMAP.md`.
- [x] **v1.12 Go Backend Promotion Readiness and Cutover Plan** - Phases 76-81, shipped 2026-05-23 with `promote-none-yet`. See `.planning/milestones/v1.12-ROADMAP.md`.
- [x] **v1.13 Go Backend Ownership Cutover** - Phases 82-88, completed 2026-05-23 with selected Go backend route promotion. See `.planning/milestones/v1.13-ROADMAP.md`.
- [x] **v1.14 Generic Strategy Artifact and Runtime Boundary Contract** - Phases 89-95, completed 2026-05-23 with artifact-backed Go fork promotion and runtime ABI v1.14.
- [x] **v1.15 Go Backend Ownership Completion** - Phases 96-102, completed 2026-05-24 with Go backend ownership completion and strict topology/monitor gates.

## Current Milestone: v1.15 Go Backend Ownership Completion

**Status:** Complete - final audit passed
**Phases:** 96-102
**Granularity:** Standard
**Requirements:** 48/48 complete
**Research:** `.planning/research/SUMMARY.md`

## Overview

v1.15 completes the normal backend ownership cutover by making Go the owner of persistence-facing orchestration, Match lifecycle coordination, Chronicle persistence, MatchSet scoring completion, and public evidence delivery. TypeScript remains the frontend, the parity oracle for migrated semantics, and the isolated JS/TS Strategy runtime boundary. The milestone must not move hostile Strategy execution into Go or web/API processes.

The target flow is:

`web frontend -> Go backend -> TypeScript runtime execution boundary -> Go persistence -> Go public evidence`

## Phases

- [x] **Phase 96: Boundary Baseline and Go Ownership Contract** - Developers can inspect the v1.15 ownership baseline, lifecycle manifest, non-goals, and parity/reference surfaces before implementation.
- [x] **Phase 97: Go Job Lifecycle and Persistence Contracts** - Developers can claim, lease, retry, fail, and complete job lifecycle primitives in Go with TypeScript parity and no duplicate DB-owning workers.
- [x] **Phase 98: Runtime Execution Service Boundary** - Developers can coordinate Match execution from Go through a strict TypeScript runtime service boundary while Strategy execution remains isolated behind `strategy-runtime-abi-v1.14`.
- [x] **Phase 99: Go Match Completion and Chronicle Persistence** - Developers can complete Matches and persist validated Chronicles through Go atomically, with replay compatibility and failure-safe idempotency.
- [x] **Phase 100: Go MatchSet Scoring and Failure Classification** - Users can see Go-scored MatchSet standings/status after terminal Matches, with parity for scoring, penalties, degraded/system failure, and tie-breakers.
- [x] **Phase 101: Public Evidence Delivery and Web Cutover** - Users can view Go-owned public MatchSet/replay evidence and selected normal web workflows without TypeScript backend fallback or public privacy leaks.
- [x] **Phase 102: Topology, Monitors, Rollback, and Promotion Gate** - Developers can prove the full local topology, no-fallback behavior, rollback path, privacy safety, board realism, and ownership monitors before promotion.

## Phase Details

### Phase 96: Boundary Baseline and Go Ownership Contract

**Goal:** Developers can inspect the v1.15 baseline for Go route ownership, TypeScript job/runtime ownership, public/private replay ownership, broad web report-only offenses, topology gaps, lifecycle ownership, rollback owners, and non-goals.
**Depends on:** Phase 95
**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success Criteria:**
1. Developer can inspect a v1.15 ownership manifest separating Go primary routes, Go lifecycle surfaces, TypeScript parity-oracle surfaces, TypeScript runtime execution surfaces, test-only surfaces, rollback owners, and deferred surfaces.
2. Developer can verify explicit non-goals prevent Go/web/API Strategy execution, Node `vm` use, production sandbox replacement, final TypeScript runtime retirement, Go migration/schema ownership, counted non-JS play, owner-debug replay migration, and broad ladder/governance expansion.
3. Developer can inspect concrete code references for TypeScript-owned job claim/completion, Chronicle persistence, MatchSet scoring, replay/public evidence, and report-only direct persistence offenses.
4. Developer can verify baseline evidence records `strict_offenses=0`, report-only offenses at 29 unless explicitly rebaselined, and current topology/monitor gaps.

**Plans:** 1 plan

### Phase 97: Go Job Lifecycle and Persistence Contracts

**Goal:** Developers can use Go-owned job claim, lease, heartbeat, retry, and failure contracts that preserve TypeScript parity and prevent duplicate DB-owning workers in normal product paths.
**Depends on:** Phase 96
**Requirements:** ORCH-01, ORCH-02, ORCH-03, ORCH-04, ORCH-05, ORCH-06, ORCH-07, ORCH-08

**Success Criteria:**
1. Developer can claim queued and expired-running Match jobs through Go with lease tokens, attempt rows, and database locking semantics equivalent to TypeScript.
2. Developer can heartbeat/extend leases and reject stale or mismatched leases.
3. Developer can record retryable and exhausted system failures through Go with redacted diagnostics and correct Match/job/attempt state.
4. Developer can run Go tests and TypeScript parity fixtures for successful claim, idle, lease mismatch, expired lease reclaim, retry queueing, retry exhaustion, and duplicate-claim prevention.
5. Developer can verify Go-selected normal orchestration disables TypeScript DB claim/completion ownership except explicit rollback/test paths.

**Plans:** 1 plan

### Phase 98: Runtime Execution Service Boundary

**Goal:** Developers can coordinate Match execution from Go through a strict TypeScript execution service while preserving the v1.14 runtime ABI and keeping hostile Strategy execution out of Go/web/API.
**Depends on:** Phase 97
**Requirements:** RT-01, RT-02, RT-03, RT-04, RT-05, RT-06

**Success Criteria:**
1. Developer can validate a versioned Go-to-TypeScript execution request/response contract for complete Match inputs and execution results.
2. Developer can verify the TypeScript execution service runs Strategy code only behind `strategy-runtime-abi-v1.14` and performs no normal job claim/completion/Chronicle persistence/scoring writes.
3. Developer can verify Go does not import, evaluate, transpile, or execute Strategy source and does not use Node `vm`.
4. Developer can test invalid output, timeout, malformed response, source hash mismatch, oversized output, stopped runtime service, runtime violation, system failure, and redacted diagnostics behavior.
5. Developer can verify runtime readiness labels remain unchanged for worker-thread, subprocess, container-subprocess, and non-JS candidates.

**Plans:** 1 plan

### Phase 99: Go Match Completion and Chronicle Persistence

**Goal:** Developers can complete claimed Matches and persist validated Chronicles through Go atomically, while preserving replay compatibility, content integrity, and idempotent recovery semantics.
**Depends on:** Phases 97 and 98
**Requirements:** COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08

**Success Criteria:**
1. Developer can complete a Match through Go only with a valid running lease and idempotently return existing Chronicle metadata for already complete Matches.
2. Developer can verify Go derives outcome, winner, survivor counts, per-side counts, survival turns, and per-side survival turns with TypeScript parity.
3. Developer can verify Go validates Chronicle schema, Match id, Strategy Revision ids, arena id, terminal outcome, event/snapshot counts, metadata, and content hash before insert.
4. Developer can verify Chronicle persistence, Match completion, job completion, and attempt completion are one atomic operation.
5. Developer can verify invalid Chronicles, mismatched ids, hash drift, missing terminal outcomes, storage conflicts, and public/private projection leaks fail closed.
6. Developer can verify Go-completed Chronicles remain readable by replay reconstruction and public projection code.

**Plans:** 1 plan

### Phase 100: Go MatchSet Scoring and Failure Classification

**Goal:** Users can see Go-scored MatchSet standings and terminal status after Match completion, with parity for scoring, degraded/system failure, strategy failure penalties, and tie-breakers.
**Depends on:** Phase 99
**Requirements:** SCORE-01, SCORE-02, SCORE-03, SCORE-04, SCORE-05, SCORE-06

**Success Criteria:**
1. Developer can run Go scoring parity fixtures for wins, losses, draws, points, penalties, failed system Matches, survivor totals, survival turns, and stable tie-breakers.
2. Developer can refresh MatchSet status through Go for pending, running, complete, degraded, failed-system, and blocked scenarios.
3. Developer can verify Go updates `match_sets.status`, `scoring`, `degraded`, and `completed_at` after terminal Match results without relying on TypeScript public reads to lazily refresh scoring.
4. User can view Go-scored public MatchSet standings after complete or degraded MatchSets.
5. Developer can verify runtime violations and system failures are classified into scoring/degraded outcomes without false player losses.

**Plans:** 1 plan

### Phase 101: Public Evidence Delivery and Web Cutover

**Goal:** Users can use selected normal web workflows and view public MatchSet/replay evidence through Go-owned contracts, while remaining TypeScript backend surfaces are explicitly parity-only, test-only, runtime-only, rollback-only, or deferred.
**Depends on:** Phase 100
**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06

**Success Criteria:**
1. User can create an exhibition through the web frontend with Go selected and receive a Go-owned queued response without TypeScript backend fallback.
2. User can view public MatchSet summary/evidence produced from Go-completed Matches and Go-scored MatchSets.
3. User can view public replay metadata and selected replay evidence from Go-owned contracts without exposing raw Chronicle/private projection data by default.
4. Developer can verify selected normal web workflows call Go-owned contracts instead of direct persistence/service internals.
5. Developer can inspect remaining TypeScript service/web API surfaces labeled as test-only, parity-only, rollback-only, runtime-only, or deferred.
6. Developer can run privacy checks proving public/account/workshop/replay/evidence outputs omit private Strategy, owner, session, host, DB, and runtime internals by default.

**Plans:** 1 plan

### Phase 102: Topology, Monitors, Rollback, and Promotion Gate

**Goal:** Developers can prove v1.15 Go backend ownership with live local topology, no-fallback behavior, rollback drills, public-output privacy, board realism, and monitor coverage before recording promotion/defer decisions.
**Depends on:** Phase 101
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08

**Success Criteria:**
1. Developer can run a repeatable topology command that creates a Go-owned exhibition, executes through the TypeScript runtime boundary, persists Chronicles through Go, finalizes scoring through Go, and fetches public evidence through Go.
2. Developer can verify browser replay validation shows plausible full Match starts with in-bounds visible Soldiers and terrain for Go-created or Go-completed replay evidence.
3. Developer can verify stopped-Go and stopped-runtime-service drills fail closed or classify failures explicitly without TypeScript persistence fallback.
4. Developer can verify rollback to TypeScript worker ownership is explicit and does not mix DB-completing owners.
5. Developer can verify boundary monitors fail on unexpected TypeScript backend ownership, unsafe fallback, schema drift, runtime ABI drift, route manifest drift, privacy drift, report-only offense increases, and public-output leaks.
6. Developer can inspect final promotion/defer artifacts showing remaining TypeScript production-ish ownership is limited to the isolated JS/TS runtime worker/service plus documented parity/test/rollback surfaces.

**Plans:** 1 plan

## Progress

**Execution Order:** Phase 96 -> Phase 97 -> Phase 98 -> Phase 99 -> Phase 100 -> Phase 101 -> Phase 102

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 96. Boundary Baseline and Go Ownership Contract | 1/1 | Complete | 2026-05-24 |
| 97. Go Job Lifecycle and Persistence Contracts | 1/1 | Complete | 2026-05-24 |
| 98. Runtime Execution Service Boundary | 1/1 | Complete | 2026-05-24 |
| 99. Go Match Completion and Chronicle Persistence | 1/1 | Complete | 2026-05-24 |
| 100. Go MatchSet Scoring and Failure Classification | 1/1 | Complete | 2026-05-24 |
| 101. Public Evidence Delivery and Web Cutover | 1/1 | Complete | 2026-05-24 |
| 102. Topology, Monitors, Rollback, and Promotion Gate | 1/1 | Complete | 2026-05-24 |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| BASE-01 through BASE-06 | Phase 96 | 6 |
| ORCH-01 through ORCH-08 | Phase 97 | 8 |
| RT-01 through RT-06 | Phase 98 | 6 |
| COMP-01 through COMP-08 | Phase 99 | 8 |
| SCORE-01 through SCORE-06 | Phase 100 | 6 |
| API-01 through API-06 | Phase 101 | 6 |
| GATE-01 through GATE-08 | Phase 102 | 8 |

**Coverage:** 48/48 v1.15 requirements mapped and complete.
**Unmapped requirements:** 0.
**Completed phases:** 96-102.

## Next Up

Final milestone audit passed. Completion packaging is ready when v1.15 is archived.

---
*Last updated: 2026-05-24 after v1.15 final audit*
