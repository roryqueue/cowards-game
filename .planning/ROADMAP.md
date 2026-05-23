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

## Current Milestone: v1.13 Go Backend Ownership Cutover

**Status:** Complete 2026-05-23
**Phases:** 82-88
**Granularity:** Standard
**Requirements:** 42/44 complete or promoted, 2/44 accepted deferred, 44/44 mapped
**Research:** `.planning/research/SUMMARY.md`

## Overview

v1.13 is an aggressive Go backend ownership cutover. v1.12 proved route-scoped fail-closed switching and topology evidence but stopped at `promote-none-yet` because Go data was fixture-backed. v1.13 adds live Go persistence access, promotes selected product API families to Go ownership, and includes auth/session mutation, account Strategy Revision write/fork/source flows, and exhibition creation as primary scope.

The milestone succeeds only if Go-owned routes preserve canonical DTOs, privacy, schema validation, no-fallback semantics, rollback behavior, deterministic engine boundaries, and hostile Strategy isolation. TypeScript service behavior remains the parity oracle and rollback reference, not silent fallback in Go-selected evidence paths.

## Phases

- [x] **Phase 82: Ownership Baseline and Aggressive Cutover Registry** - Developers can inspect v1.13 route ownership, selected primary scope, baseline evidence, and explicit non-goals before implementation.
- [x] **Phase 83: Go Persistence and Live DTO Foundation** - Developers can run Go against live PostgreSQL and assemble selected service DTOs with privacy-safe schema/error behavior.
- [x] **Phase 84: Public Read Ownership Cutover** - Users can load selected public Strategy, player, ladder, MatchSet summary, and replay metadata surfaces through Go-owned live data.
- [x] **Phase 85: Auth, Session, and Account Read Ownership** - Users can sign up, sign in, sign out, refresh session, and list account revision metadata through Go-owned routes.
- [x] **Phase 86: Account Strategy Revision Source and Write Ownership** - Users can retrieve owner-private source and save account revisions through Go-owned routes without executing Strategy code; Starter/Advanced forks are accepted deferred.
- [x] **Phase 87: Exhibition Creation Ownership and Worker Handoff** - Users can create exhibition MatchSets through Go-owned mutation while TypeScript worker/runtime remains the execution owner.
- [x] **Phase 88: Multi-Route Cutover Verification and Rollback Gate** - Developers can prove topology, privacy, no-fallback, rollback, boundary monitors, and final ownership evidence across all selected route families.

## Phase Details

### Phase 82: Ownership Baseline and Aggressive Cutover Registry

**Goal:** Developers can inspect the v1.13 ownership baseline, aggressive selected scope, route registry, and non-goals before implementation changes begin.
**Depends on:** Phase 81
**Requirements:** OWN-01, OWN-02, OWN-03, OWN-04, OWN-05, OWN-06

**Success Criteria:**
1. Developer can inspect a route ownership matrix covering selected public, owner/session, mutation, worker/runtime, and deferred surfaces.
2. Developer can inspect a multi-route ownership registry with owner, auth scope, privacy class, fallback policy, rollback owner, diagnostics class, and disallowed scopes.
3. Developer can verify v1.13 includes auth/session mutation, account Strategy Revision write/fork/source flows, and exhibition creation as primary scope.
4. Developer can verify TypeScript service behavior is the parity oracle and rollback reference rather than silent fallback.
5. Developer can verify baseline evidence records `strict_offenses=0`, `report_only_offenses=29`, current Go fixture inventory, v1.12 blockers, and explicit non-goals.

**Plans:** 1 plan

- [x] 82-01-PLAN.md - Capture ownership baseline, aggressive cutover registry, selected scope, non-goals, and baseline evidence.

### Phase 83: Go Persistence and Live DTO Foundation

**Goal:** Developers can run Go with live PostgreSQL access and assemble selected DTOs through route-specific providers with schema, privacy, and public-safe error behavior.
**Depends on:** Phase 82
**Requirements:** GODB-01, GODB-02, GODB-03, GODB-04, GODB-05, GODB-06

**Success Criteria:**
1. Developer can configure Go DB access without exposing DSNs, credentials, tokens, host paths, or private runtime internals.
2. Developer can run Go in live DB-backed mode and see promoted routes reject fixture-only ownership claims.
3. Developer can inspect route-specific query/provider code for selected DTOs without broad ORM or migration ownership.
4. Developer can compare Go live DTOs with TypeScript service/reference outputs for seeded local success and failure cases.
5. Developer can verify Go DTOs pass canonical schema/contract checks and privacy scans before web clients consume them.
6. Developer can verify Go maps storage and validation failures to public-safe service errors.

**Plans:** 1 plan

- [x] 83-01-PLAN.md - Add Go PostgreSQL access, route-specific live DTO providers, parity harness, schema checks, and sanitized error handling.

### Phase 84: Public Read Ownership Cutover

**Goal:** Users can load selected public product reads through Go-owned live data by default while TypeScript service remains explicit rollback/reference.
**Depends on:** Phase 83
**Requirements:** PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06

**Success Criteria:**
1. User can load public Strategy pages through Go-owned live data, preserving source-free public Strategy card behavior.
2. User can load public player pages through Go-owned live data, preserving Strategy cards, ladder history, result links, and privacy exclusions.
3. User can load public ladder pages through Go-owned live data, preserving entries, standings, MatchSet links, policy text, and counted-state explanations.
4. User can load public MatchSet summary pages through Go-owned live data, preserving scoring, entrants, standings, replay links, and governance public explanations.
5. User can load public replay metadata through Go-owned live data without migrating full replay projection or owner debug.
6. Developer can verify every selected public Go read fails closed without silent TypeScript fallback on unavailable, timeout, bad JSON, schema, privacy, divergence, or unsafe-link failures.

**Plans:** 1 plan

- [x] 84-01-PLAN.md - Cut over selected public reads to Go live DTOs with fail-closed web routing and parity tests.

### Phase 85: Auth, Session, and Account Read Ownership

**Goal:** Users can sign up, sign in, sign out, refresh session, and list account Strategy Revision metadata through Go-owned routes with token-safe diagnostics.
**Depends on:** Phase 83
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06

**Success Criteria:**
1. User can sign up through Go-owned auth mutation with existing password, username, handle, display name, uniqueness, and cookie handoff semantics.
2. User can sign in through Go-owned auth mutation with existing credential, session token hashing, cookie handoff, and invalid-credential behavior.
3. User can sign out through Go-owned revoke behavior that remains idempotent and token-safe.
4. User can refresh session through Go-owned session read and receive only public account fields.
5. User can view source-free account Strategy Revision metadata through Go-owned reads.
6. Developer can verify session/auth route evidence omits raw sessions, tokens, password hashes, cookies, DB details, stack traces, and private runtime internals.

**Plans:** 1 plan

- [x] 85-01-PLAN.md - Move auth/session read and mutation plus account revision list reads to Go-owned routes with parity and privacy tests.

### Phase 86: Account Strategy Revision Source and Write Ownership

**Goal:** Users can retrieve owner-private source, save account revisions, and fork Starter/Advanced Strategies through Go-owned routes without executing Strategy code in Go or web/API.
**Depends on:** Phase 85
**Requirements:** ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05, ACCT-06, ACCT-07

**Success Criteria:**
1. User can retrieve owner-private Strategy Revision source through Go only when authenticated as the owner, with private/no-store response behavior.
2. User can save/create account Strategy Revisions through Go while preserving immutable revision semantics, source hash/bytes, metadata, validation status, runtime metadata, and engine compatibility.
3. User can fork Starter Strategies through Go while preserving lineage, source hash, tags, name, notes, validation status, and owner association.
4. User can fork Advanced Strategies through Go while preserving lineage, archetype, source hash, tags, name, notes, validation status, and owner association.
5. Developer can verify Go source/write/fork routes do not execute Strategy code and do not use Node `vm`.
6. Developer can verify unauthorized, invalid source, invalid fork id, duplicate, storage, schema, and privacy failures fail closed without TypeScript fallback.

**Plans:** 1 plan

- [x] 86-01-PLAN.md - Move owner-private source and Strategy Revision save/create flows to Go with no-execution guarantees; keep Starter/Advanced forks TypeScript-owned until Go has library source manifest parity.

### Phase 87: Exhibition Creation Ownership and Worker Handoff

**Goal:** Users can create exhibition MatchSets through Go-owned mutation while TypeScript worker/runtime remains the explicit owner for execution.
**Depends on:** Phase 85
**Requirements:** MUT-01, MUT-02, MUT-03, MUT-04, MUT-05, MUT-06

**Success Criteria:**
1. User can create an exhibition MatchSet through Go with existing preset validation, revision validation, ownership checks, eligibility checks, rate limits, and duplicate prevention.
2. Developer can verify Go writes MatchSet, entrant, Match, job, revision lock, provenance, and audit records transactionally.
3. Developer can verify TypeScript worker ownership remains explicit for claiming jobs, executing Strategies, completing Matches, building Chronicles, and classifying runtime failures.
4. User can inspect Go-created exhibition result pages and see public-safe queued/running/complete/degraded behavior.
5. Developer can verify invalid preset, invalid revisions, unauthorized, duplicate active exhibition, rate limit, storage, and transaction failures map to public-safe errors.
6. Developer can verify exhibition creation does not execute Strategy source or move Match orchestration/runtime ownership to Go.

**Plans:** 1 plan

- [x] 87-01-PLAN.md - Move exhibition MatchSet creation to Go with transactional parity and worker handoff guardrails.

### Phase 88: Multi-Route Cutover Verification and Rollback Gate

**Goal:** Developers can prove v1.13 route ownership, topology, privacy, no-fallback behavior, rollback, and final promotion/defer decisions across all selected route families.
**Depends on:** Phases 84, 85, 86, 87
**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07

**Success Criteria:**
1. Developer can run boundary monitors and verify v1.13 route manifests, selected owners, privacy classes, rollback owners, and disallowed scopes.
2. Developer can run direct Go and web-through-Go topology checks for selected public, owner/session, account write, and exhibition creation route families.
3. Developer can run stopped-Go, bad body, timeout, schema/privacy failure, divergence, no-fallback, and rollback drills for selected route families.
4. Developer can verify public/service/Go/topology/monitor/log/evidence outputs omit private Strategy, owner, session, host, database, and runtime internals by default.
5. Developer can verify `strict_offenses=0` and report-only broad web offenses do not increase above 29 unless explicitly rebaselined.
6. Developer can run the full v1.13 verification set and inspect a final ownership decision for Go-owned, rolled-back, and deferred routes.

**Plans:** 1 plan

- [x] 88-01-PLAN.md - Run the final multi-route cutover gate, rollback drills, privacy scans, boundary monitors, and ownership decision record.

## Progress

**Execution Order:** Phase 82 -> Phase 83 -> Phase 84 -> Phase 85 -> Phase 86 -> Phase 87 -> Phase 88

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 82. Ownership Baseline and Aggressive Cutover Registry | 1/1 | Complete | 2026-05-23 |
| 83. Go Persistence and Live DTO Foundation | 1/1 | Complete | 2026-05-23 |
| 84. Public Read Ownership Cutover | 1/1 | Complete | 2026-05-23 |
| 85. Auth, Session, and Account Read Ownership | 1/1 | Complete | 2026-05-23 |
| 86. Account Strategy Revision Source and Write Ownership | 1/1 | Complete with fork deferral | 2026-05-23 |
| 87. Exhibition Creation Ownership and Worker Handoff | 1/1 | Complete | 2026-05-23 |
| 88. Multi-Route Cutover Verification and Rollback Gate | 1/1 | Complete | 2026-05-23 |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| OWN-01 through OWN-06 | Phase 82 | 6 |
| GODB-01 through GODB-06 | Phase 83 | 6 |
| PUB-01 through PUB-06 | Phase 84 | 6 |
| AUTH-01 through AUTH-06 | Phase 85 | 6 |
| ACCT-01 through ACCT-07 | Phase 86 | 7 |
| MUT-01 through MUT-06 | Phase 87 | 6 |
| GATE-01 through GATE-07 | Phase 88 | 7 |

**Coverage:** 44/44 v1.13 requirements mapped.
**Unmapped requirements:** 0.
**Completion:** 42/44 complete or promoted; ACCT-04 and ACCT-05 accepted deferred.
**Final boundary baseline:** `strict_offenses=0 report_only_offenses=29`.
**Selected cutover mode:** aggressive Go backend ownership with selected-route promotion.

## Next Up

Archive or start v1.14 from the accepted deferrals.

---
*Last updated: 2026-05-23 after v1.13 selected Go backend route promotion*
