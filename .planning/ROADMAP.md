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
- [x] **v1.13 Go Backend Ownership Cutover** - Phases 82-88, shipped 2026-05-23 with selected Go backend route promotion. See `.planning/milestones/v1.13-ROADMAP.md`.
- [x] **v1.14 Generic Strategy Artifact and Runtime Boundary Contract** - Phases 89-95, shipped 2026-05-23 with artifact-backed Go forks and runtime ABI v1.14. See `.planning/milestones/v1.14-ROADMAP.md`.
- [x] **v1.15 Go Backend Ownership Completion** - Phases 96-102, shipped 2026-05-24 with Go backend ownership completion and strict topology/monitor/page-smoke gates. See `.planning/milestones/v1.15-ROADMAP.md`.
- [x] **v1.16 Runtime Isolation and TypeScript Backend Retirement** - Phases 103-109, shipped 2026-05-24 with no normal TypeScript backend except frontend plus isolated JS/TS Strategy runtime service. See `.planning/milestones/v1.16-ROADMAP.md`.
- [ ] **v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening** - Phases 110-116, in planning.

## Current Milestone: v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening

**Status:** Planning
**Phases:** 110-116
**Granularity:** Standard
**Requirements:** 52/52 mapped
**Research:** `.planning/research/SUMMARY.md`

## Overview

v1.17 makes Python an experimental end-to-end Strategy language through the Strategy Execution Service / Runtime Broker contract. The milestone uses v1.16 as the backend-retirement baseline: normal topology remains `web frontend -> Go backend -> isolated runtime service(s)`, JS/TS support remains intact, and Python stays runtime-only, non-counted, and non-ranked.

The target flow is:

`web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated JS/TS or Python runtime implementation`

Python may be authored, submitted, validated, executed, and replayed only through schema-validated runtime ABI envelopes and non-counted Workshop or exhibition-style MatchSets. Python must not become a backend, persistence owner, route owner, job lifecycle owner, public evidence owner, or silent fallback path.

## Phases

- [ ] **Phase 110: Broker Registry Baseline and Contract Hardening** - Developers can inspect the v1.17 baseline and a concrete Runtime Broker registry contract before Python runtime expansion begins.
- [ ] **Phase 111: Strategy Artifact Language Metadata and Eligibility** - Developers can represent JS/TS and Python Strategy Revisions as immutable artifacts with language/runtime/package/validation/eligibility metadata.
- [ ] **Phase 112: Python Submission Validation and Diagnostics** - Users can submit Python source to an experimental Workshop path and receive public-safe parse/compile/package diagnostics without executing Strategy logic in web/API/Go.
- [ ] **Phase 113: Python Runtime Execution Behind Broker ABI** - Developers can execute Python Strategies only through the runtime service/runtime ABI with JS/TS parity for schemas, timeouts, invalid output, failures, redaction, and authority limits.
- [ ] **Phase 114: Go Orchestration and Non-Counted Eligibility** - Go can invoke registered Python runtime metadata through the runtime service envelope while rejecting Python from counted/ranked gates and preserving no-fallback behavior.
- [ ] **Phase 115: Python Starter Strategy and Replay Proof** - Users can load a Python Starter Strategy, validate and submit it, run it in a non-counted MatchSet, and inspect replay evidence.
- [ ] **Phase 116: Topology, Monitors, Privacy, and Promotion Gate** - Developers can run final topology, monitor, privacy, page-smoke, replay, and audit gates proving Python is runtime-only and non-counted.

## Phase Details

### Phase 110: Broker Registry Baseline and Contract Hardening

**Goal:** Developers can inspect the v1.17 baseline and a concrete Strategy Execution Service / Runtime Broker registry contract before Python runtime expansion begins.
**Depends on:** Phase 109
**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BROKER-01, BROKER-02, BROKER-03, BROKER-04, BROKER-05, BROKER-06

**Success Criteria:**
1. Developer can inspect a v1.17 baseline artifact proving v1.16 remains the backend-retirement floor.
2. Developer can inspect a runtime registry contract for JS/TS and Python with adapter metadata, limits, package policy, readiness, counted eligibility, and health metadata.
3. Developer can verify Go/web/API do not execute Strategy source and route execution only through schema-validated runtime execution envelopes.
4. Developer can run contract and monitor tests that fail on ABI drift, unknown runtime targets, registry drift, or runtime authority creep.

**Plans:** 1 plan

### Phase 111: Strategy Artifact Language Metadata and Eligibility

**Goal:** Developers can represent Python Strategy Revisions as immutable artifacts without weakening JS/TS artifact, source privacy, or counted eligibility semantics.
**Depends on:** Phase 110
**Requirements:** ART-01, ART-02, ART-03, ART-04, ART-05

**Success Criteria:**
1. Developer can inspect schemas and generated artifacts that support Python source format, language version, runtime target, package metadata, compile metadata, validation status, artifact hash, and eligibility flags.
2. Developer can verify behavior compatibility keys include language/runtime/package/compile metadata.
3. Developer can verify public summaries expose only safe labels and never expose source, memory, objective, stderr, stack, host path, package path, token, DB DSN, or private runtime data.
4. Developer can verify Python artifacts are non-counted while JS/TS counted eligibility remains intact.

**Plans:** 1 plan

### Phase 112: Python Submission Validation and Diagnostics

**Goal:** Users can validate and submit Python source as experimental Strategy Revision material with public-safe diagnostics and no web/API/Go execution.
**Depends on:** Phase 111
**Requirements:** PYVAL-01, PYVAL-02, PYVAL-03, PYVAL-04, PYVAL-05, PYVAL-06

**Success Criteria:**
1. User can choose or submit Python source through an explicitly experimental Workshop path.
2. User receives diagnostics for parse errors, compile errors, missing Strategy functions, forbidden imports/capabilities, unsupported package metadata, and source size.
3. Developer can verify validation uses parse/compile checks where practical and does not run Strategy logic in web/API/Go.
4. Developer can verify diagnostics and invalid validation reports are public-safe and do not echo private source, stack, stderr, host path, environment, token, DB DSN, or private runtime internals.

**Plans:** 1 plan

### Phase 113: Python Runtime Execution Behind Broker ABI

**Goal:** Developers can execute Python Strategies only as a registered runtime implementation behind the runtime service/runtime ABI.
**Depends on:** Phase 112
**Requirements:** PYRUN-01, PYRUN-02, PYRUN-03, PYRUN-04, PYRUN-05, PYRUN-06, PYRUN-07

**Success Criteria:**
1. Developer can run Python Strategy methods needed for a full Match through the same runtime execution service envelope family as JS/TS.
2. Developer can verify Python invalid output, timeout, crash, subprocess exit/signal, malformed IPC, oversized output, forbidden capability, stderr, and stack behavior map to the broker failure taxonomy.
3. Developer can verify Python runtime code has no filesystem, network, package install, shell, database, job lifecycle, Match completion, Chronicle persistence, scoring, route, or public evidence authority.
4. Developer can verify successful Python execution returns internal runtime results only and Go remains the owner of orchestration, persistence, scoring, and public replay/evidence.

**Plans:** 1 plan

### Phase 114: Go Orchestration and Non-Counted Eligibility

**Goal:** Go can invoke Python only through schema-validated runtime service envelopes and keeps Python out of counted/ranked paths.
**Depends on:** Phase 113
**Requirements:** GO-01, GO-02, GO-03, GO-04, GO-05

**Success Criteria:**
1. Developer can verify Go accepts Python runtime metadata only when it matches the registered broker/runtime ABI contract.
2. Developer can verify Go rejects Python for ranked ladder, counted MatchSet, counted gauntlet, and normal counted eligibility paths.
3. User can create a non-counted Workshop or exhibition-style MatchSet with a valid Python Strategy Revision.
4. Developer can verify stopped Python runtime, stopped runtime service, registry mismatch, and unsupported artifact failures fail closed without TypeScript backend, Go execution, or JS/TS fallback execution.

**Plans:** 1 plan

### Phase 115: Python Starter Strategy and Replay Proof

**Goal:** Users can exercise a visible Python proof point from Workshop authoring through replay evidence.
**Depends on:** Phase 114
**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06

**Success Criteria:**
1. User can load a small Python Starter Strategy with experimental and non-counted labels.
2. User can validate and submit the Python Starter Strategy as an immutable artifact with Python runtime metadata.
3. User can run the Python Strategy in a non-counted MatchSet against an approved JS/TS or fixture opponent.
4. User can open replay evidence showing a plausible full Match start with in-bounds visible Soldiers and terrain.
5. Developer can run an end-to-end proof command or page smoke covering edit -> validate -> submit -> create MatchSet -> execute through runtime service -> replay.

**Plans:** 1 plan

### Phase 116: Topology, Monitors, Privacy, and Promotion Gate

**Goal:** Developers can prove v1.17 achieved Python runtime-only support without backend ownership creep, privacy leaks, registry drift, or counted eligibility promotion.
**Depends on:** Phase 115
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, EXIT-01, EXIT-02, EXIT-03, EXIT-04, EXIT-05

**Success Criteria:**
1. Developer can run topology checks proving normal topology remains web frontend -> Go backend -> isolated runtime service(s), with Python only behind the broker/runtime boundary.
2. Developer can run monitors that fail on ABI drift, runtime registry drift, broker contract drift, Go client drift, stale generated artifacts, Python execution outside runtime service, backend ownership creep, route ownership creep, persistence access, job lifecycle ownership, scoring, public evidence delivery, or silent fallback.
3. Developer can run public-output privacy checks and browser/page smoke for Python Workshop and replay proof.
4. Developer can inspect final v1.17 artifacts and promotion decision showing Python remains experimental, runtime-only, and non-counted.
5. Developer can complete v1.17 archive, remove active requirements, update state docs, and tag `v1.17`.

**Plans:** 1 plan

## Progress

**Execution Order:** Phase 110 -> Phase 111 -> Phase 112 -> Phase 113 -> Phase 114 -> Phase 115 -> Phase 116

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 110. Broker Registry Baseline and Contract Hardening | 0/1 | Not Started | - |
| 111. Strategy Artifact Language Metadata and Eligibility | 0/1 | Not Started | - |
| 112. Python Submission Validation and Diagnostics | 0/1 | Not Started | - |
| 113. Python Runtime Execution Behind Broker ABI | 0/1 | Not Started | - |
| 114. Go Orchestration and Non-Counted Eligibility | 0/1 | Not Started | - |
| 115. Python Starter Strategy and Replay Proof | 0/1 | Not Started | - |
| 116. Topology, Monitors, Privacy, and Promotion Gate | 0/1 | Not Started | - |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| BASE-01 through BASE-05, BROKER-01 through BROKER-06 | Phase 110 | 11 |
| ART-01 through ART-05 | Phase 111 | 5 |
| PYVAL-01 through PYVAL-06 | Phase 112 | 6 |
| PYRUN-01 through PYRUN-07 | Phase 113 | 7 |
| GO-01 through GO-05 | Phase 114 | 5 |
| PROOF-01 through PROOF-06 | Phase 115 | 6 |
| GATE-01 through GATE-07, EXIT-01 through EXIT-05 | Phase 116 | 12 |

**Coverage:** 52/52 v1.17 requirements mapped.
**Unmapped requirements:** 0.

## Next Up

Phase 110: Broker Registry Baseline and Contract Hardening.

---
*Created: 2026-05-24 for v1.17 milestone initialization*
