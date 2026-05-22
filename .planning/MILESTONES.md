# Milestones

## v1.9 Backend and Runtime Ownership Split

**Status:** In progress 2026-05-22
**Phases:** 7
**Phase range:** 57-63
**Plans:** 1/1 complete so far
**Requirements:** 4/28 complete; 28/28 mapped
**Audit:** TBD

### Goal

Use the v1.8 service contracts, Go parity fixtures, runtime semantics, local topology, and boundary monitors to make one deliberate ownership move without blending backend rewrite, production sandbox promotion, and non-JS counted play into one risky change.

### Decision Candidates

- Selected v1.9 production ownership move: migrate more read/user web surfaces behind `@cowards/service` and widen strict import enforcement.
- Selected read-model follow-up branch: public ladder season service read.
- Go read-model expansion remains follow-up-only after TypeScript service ownership and parity fixture scope; Go writes remain out of scope.
- Runtime isolation remains evidence/guardrail-only; no candidate is promoted to counted Match execution by default.
- Python and other non-JS runtimes remain experimental and non-counted unless promotion criteria are defined and satisfied in a future milestone.

### Planned Phases

| Phase | Name |
| --- | --- |
| 57 | Ownership Matrix and Baseline Evidence — Complete |
| 58 | Public Player Profile Service Read |
| 59 | Owner Account Read Service Slice |
| 60 | Public Ladder Service Read Follow-Up |
| 61 | Runtime Isolation Readiness Guardrails |
| 62 | Experimental Non-JS Runtime Guardrails |
| 63 | Milestone Verification and Regression Gate |

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process, and Node `vm` is not used as a hostile-code security boundary.
- Public replay, service, Go, topology, monitor, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- Go backend work remains read-only unless v1.9 explicitly scopes a write boundary.
- Non-JS runtimes remain experimental unless v1.9 explicitly proves promotion criteria.

## v1.8 Production Boundary Hardening

**Status:** Shipped 2026-05-22
**Phases:** 6
**Plans:** 8
**Requirements:** 38/38 satisfied
**Audit:** .planning/milestones/v1.8-MILESTONE-AUDIT.md

### Delivered

- Generated and linted `service-api-v1.8` OpenAPI artifacts from canonical `@cowards/spec` service route and DTO metadata.
- Migrated selected public web reads through `@cowards/service` while preserving public DTO behavior and privacy constraints.
- Promoted the Go backend spike to read-only parity against TypeScript-service-generated fixtures for health, public MatchSet summary, replay metadata, and owner-scoped analytics summary.
- Added an evaluation-only sandbox candidate matrix and hostile probe harness without promoting any boundary to production hostile-code isolation.
- Made non-JS Strategy product semantics spec-owned, with Python remaining experimental and non-counted.
- Added `pnpm topology:check` for repeatable local web/service/runtime/Go fixture diagnostics.
- Added `pnpm boundary:monitors` for service contract, privacy, import-boundary, runtime adapter, Go parity, sandbox, and topology drift checks.

### Archives

- .planning/milestones/v1.8-ROADMAP.md
- .planning/milestones/v1.8-REQUIREMENTS.md
- .planning/milestones/v1.8-MILESTONE-AUDIT.md
- .planning/milestones/v1.8-phases/

### Known Deferred Items

- Go mutation endpoints, persistence writes, job claiming, migrations, Match orchestration, and Strategy execution remain TypeScript-owned.
- Production hostile-code sandbox certification remains future runtime work.
- Python and other non-JS runtimes remain experimental and are not enabled for counted MatchSets, ladders, or gauntlets.
- Public language picker, package dependency ecosystem, cloud deployment, and production observability stack remain future milestone work.

## v1.7 Runtime and Backend Boundary Stabilization

**Status:** Shipped 2026-05-22
**Phases:** 6
**Plans:** 6
**Requirements:** 32/32 satisfied
**Audit:** .planning/milestones/v1.7-MILESTONE-AUDIT.md

### Delivered

- Added `service-api-v1.7` contracts and `@cowards/service` for health, auth/session, Strategy revisions, MatchSets, replay metadata, analytics, exports, ladders, and public pages.
- Added `strategy-runtime-abi-v1.7` request/response envelopes covering source/package metadata, limits, deterministic restrictions, versioning, runtime violations, and system failures.
- Added `@cowards/golden` parity fixtures for deterministic engine outcomes, Chronicle/replay behavior, public DTO privacy, runtime failure taxonomy, and ordering.
- Made Strategy Revision runtime metadata first-class through language/adapter registries, compatibility keys, legacy normalization, and counted-play eligibility checks.
- Added an experimental Python subprocess runtime through the ABI while keeping JS/TS as the only counted runtime path.
- Added a minimal read-only Go backend spike with health, public MatchSet summary, and replay metadata endpoints.
- Fixed audit findings around runtime worker imports, persistence-root service imports, and Workshop schema-drift fallback behavior.

### Archives

- .planning/milestones/v1.7-ROADMAP.md
- .planning/milestones/v1.7-REQUIREMENTS.md
- .planning/milestones/v1.7-MILESTONE-AUDIT.md
- .planning/milestones/v1.7-phases/

### Known Deferred Items

- Production hostile-code isolation beyond current worker/subprocess/container candidates remains future runtime work.
- Python remains an experimental ABI proof and is not enabled for counted MatchSets.
- Go remains read-only/static for the spike; orchestration, writes, jobs, and Strategy execution remain TypeScript-owned.
- Full OpenAPI generation and production non-JS Strategy authoring UX remain future milestone work.

## v1.6 Workshop Analytics and Evidence Explorer

**Status:** Shipped 2026-05-22
**Phases:** 7
**Plans:** 7
**Requirements:** 54/54 satisfied
**Audit:** .planning/milestones/v1.6-MILESTONE-AUDIT.md

### Delivered

- Added stable analytics evidence contracts for saved gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and owner-safe export DTOs.
- Shipped saved named gauntlet profiles with exact deterministic inputs, immutable Strategy Revision ids, compatibility-aware reruns, and compare-only-when-equivalent behavior.
- Added Workshop matchup heatmaps across Starter and Advanced opponents showing W-L-D, points, failures, side bias, evidence confidence, evidence counts, and replay availability.
- Built the Evidence Explorer with sortable/filterable matchup rows, MatchSet/Match id details, compatibility metadata, replay drilldowns, and owner-safe export controls.
- Added deterministic replay deep links to meaningful public moments including Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.
- Added owner-only JSON/CSV gauntlet summary exports with schema and browser privacy checks against private Strategy/runtime/replay data leakage.
- Generated and browser-verified local v1.6 analytics data with realistic mixed outcomes, degraded/system-failed states, representative replay links, and no open milestone audit findings.

### Archives

- .planning/milestones/v1.6-ROADMAP.md
- .planning/milestones/v1.6-REQUIREMENTS.md
- .planning/milestones/v1.6-MILESTONE-AUDIT.md
- .planning/milestones/v1.6-phases/

### Known Deferred Items

- Full replay timeline search, event filters, tactical overlays, and side-by-side replay comparison remain future replay-analysis work.
- Official public tournament operations, governance/moderation flows, and durable ratings remain future competition work.
- Production-grade hostile-code isolation beyond the current worker/subprocess adapter boundary remains future runtime work.
- Strategy snippets, lint rules, tactical helpers, and deeper no-advance/trapped-Soldier diagnostics remain future authoring work.

## v1.5 Strategy Workshop Power Tools and Advanced Strategy Library

**Status:** Shipped 2026-05-21
**Phases:** 8
**Plans:** 8
**Requirements:** 53/53 satisfied
**Audit:** .planning/milestones/v1.5-MILESTONE-AUDIT.md

### Delivered

- Added Strategy Workshop power-tool surfaces: Advanced Library browsing/apply/fork flows, revision comparison, gauntlet/result framing, diagnostics, replay handoff, and performance summaries.
- Created a distinct 10-strategy v1.5 Advanced Strategy Library with public-safe lineage, archetype metadata, memory/stateless diversity, validation, and unique source hashes.
- Generated deterministic local evidence with five example MatchSets and one completed 8-entrant Advanced-only demo tournament.
- Tuned the Advanced set after replay/browser review so the final tournament was non-degenerate and the strategies shared basic tactical fundamentals.
- Browser-verified Workshop, tournament, MatchSet, Strategy card, player/profile, and replay pages without public private-data leaks.
- Produced formal audit, UAT, verification, local report, and regeneration docs for the v1.5 demo evidence.

### Archives

- .planning/milestones/v1.5-ROADMAP.md
- .planning/milestones/v1.5-REQUIREMENTS.md
- .planning/milestones/v1.5-MILESTONE-AUDIT.md
- .planning/milestones/v1.5-AUDIT-FIX.md
- .planning/milestones/v1.5-phases/

### Known Deferred Items

- Named saved gauntlet profiles and owner-only gauntlet JSON export remain future Workshop work.
- Rich matchup heatmaps, evidence bands, and replay deep links remain future analytics work.
- Durable ratings, official public tournament operations, production-grade hostile-code sandboxing, custom arenas, and non-JS runtimes remain future milestone work.

## v1.0 MVP

**Status:** Shipped 2026-05-17
**Phases:** 7
**Plans:** 33
**Requirements:** 80/80 satisfied
**Audit:** .planning/milestones/v1.0-MILESTONE-AUDIT.md

### Delivered

- Established a strict TypeScript monorepo with canonical spec contracts, package boundaries, local topology, and selected E2E verification in pnpm verify.
- Implemented the deterministic Coward's Game rules engine, covering rounds, activation selection, movement, pushing, Backstab, stoning, contraction, end conditions, and purity tests.
- Built Chronicle and replay infrastructure for deterministic reconstruction, integrity validation, public privacy projection, and owner-only debug data.
- Delivered a replaceable JS/TS strategy runtime boundary with immutable Strategy Revisions, validation, worker-only execution, timeout/failure handling, and no production node:vm execution.
- Added PostgreSQL-backed Match/MatchSet orchestration, job claiming, retries, Chronicle persistence, deterministic scoring, and worker execution.
- Shipped the Strategy Workshop and replay viewer, including Monaco authoring, revision history, Workshop test launch, Pixi replay board, timeline/inspector, owner Awareness Grid, and service-backed edit-to-replay Playwright coverage.

### Archives

- .planning/milestones/v1.0-ROADMAP.md
- .planning/milestones/v1.0-REQUIREMENTS.md
- .planning/milestones/v1.0-MILESTONE-AUDIT.md
- .planning/milestones/v1.0-phases/

### Known Deferred Items

None from the open-artifact audit.

## v1.1 Trustworthy Simulation Beta

**Status:** Shipped 2026-05-18
**Phases:** 6
**Plans:** 29
**Requirements:** 34/34 satisfied
**Audit:** .planning/milestones/v1.1-MILESTONE-AUDIT.md

### Delivered

- Replaced fragile replay demos with engine-generated legal scenario fixtures and focused replay visual regression coverage.
- Added strict Chronicle grammar, compatibility, snapshot boundary, impossible-state, and public privacy validation gates.
- Hardened the Strategy runtime boundary with adapter metadata, subprocess JSON IPC, hostile Strategy coverage, output caps, and system-vs-strategy failure taxonomy.
- Improved doctrine debugging with actionable Workshop messages, sample Strategies, replay links, runtime violation explanations, and owner-only Soldier inactivity explanations.
- Made Docker/no-Docker local startup and service-backed CI verification repeatable with layered diagnostics.
- Closed the persisted owner replay debug authorization gap and proved public privacy on the same failing Strategy replay.

### Archives

- .planning/milestones/v1.1-ROADMAP.md
- .planning/milestones/v1.1-REQUIREMENTS.md
- .planning/milestones/v1.1-MILESTONE-AUDIT.md
- .planning/milestones/v1.1-INTEGRATION-CHECK.md
- .planning/milestones/v1.1-phases/

### Known Deferred Items

- Production authentication/session ownership remains deferred.
- Ranked ladders and public competitive surfaces remain deferred.
- Production-grade container, microVM, or WASM/WASI sandboxing remains future runtime work.

## v1.2 Competitive Alpha

**Status:** Shipped 2026-05-19
**Phases:** 5
**Plans:** 10
**Requirements:** 33/33 satisfied
**Audit:** .planning/milestones/v1.2-MILESTONE-AUDIT.md

### Delivered

- Added minimal username/password accounts, session-backed stable User identity, display names/handles, and sign-in/sign-out for competitive submissions.
- Added account-owned immutable Strategy Revision saves, owner-only source access, and server-side authorization for competitive entry.
- Defined public exhibition competition presets, entrant snapshots, MatchSet publication policy, deterministic scoring, tie-breakers, and public result DTO leak guards.
- Shipped unranked public exhibition MatchSets that allow 2-8 distinct owned revisions, including multiple revisions from the same user for alpha self-play.
- Published MatchSet result pages with standings, scoring evidence, per-Match replay links, provenance, degraded/failed vocabulary, and private-data exclusions.
- Added abuse/fairness guardrails for rate limits, active duplicate submissions, entry validity, runtime failure penalties, and runtime/web isolation boundaries.

### Archives

- .planning/milestones/v1.2-ROADMAP.md
- .planning/milestones/v1.2-REQUIREMENTS.md
- .planning/milestones/v1.2-MILESTONE-AUDIT.md
- .planning/milestones/v1.2-phases/

### Known Deferred Items

- Ranked ladders, durable ratings, and public tournaments remain future work.
- One Strategy per user competition limits remain deferred until ranked or more formal competition.
- Email verification, password reset, OAuth, passkeys, organizations, account recovery, and admin moderation remain future account work.
- Rich dispute workflow beyond provenance and replay evidence remains future moderation/product work.
- Production-grade container, microVM, or WASM/WASI sandboxing remains future runtime work.

## v1.3 Competition Trust Beta

**Status:** Shipped 2026-05-20
**Phases:** 6
**Plans:** 6
**Requirements:** 51/51 satisfied
**Audit:** .planning/milestones/v1.3-MILESTONE-AUDIT.md

### Delivered

- Shipped a 10-strategy Starter Library with readable tactical doctrines, Workshop apply/fork flows, source hashes, lineage metadata, validation, and memory-using examples.
- Added resettable trial ladder seasons with one active Strategy Revision per user, immutable entry snapshots, next-season replacement, explicit lifecycle states, and no durable rating contract.
- Built deterministic ladder scheduling, MatchSet generation, counted standings, retry/degraded/non-counted handling, public ladder pages, and a completed local demo tournament.
- Published privacy-safe player handle pages and Strategy cards with lineage, records, tags, runtime compatibility, competition history, result links, and replay links.
- Added focused governance with result flags, admin status marking, audit events, public counted-state explanations, and standings exclusion for invalid/non-competitive results.
- Selected and prototyped a containerized subprocess production-candidate Strategy runtime boundary behind `StrategyExecutionAdapter`, with worker-thread retained as local/dev fallback and hostile regression coverage.
- Tuned the demo starter set after live replay review so seeded matches show more movement, avoid immediate-reversal artifacts, and commonly last into board contraction.

### Archives

- .planning/milestones/v1.3-ROADMAP.md
- .planning/milestones/v1.3-REQUIREMENTS.md
- .planning/milestones/v1.3-MILESTONE-AUDIT.md
- .planning/milestones/v1.3-phases/

### Known Deferred Items

- Durable all-time ratings, ranked prize ladders, official public tournaments, and prize/tier operations remain future work.
- Email verification, password reset, OAuth, passkeys, organizations, and account recovery remain future account work.
- Production-grade container hardening, microVM isolation, or WASM/WASI runtime replacement remains future runtime work.
- Starter Strategy balance can be tuned further, especially weaker mobility/outlast doctrines such as Escape Artist and Ring Runner.

## v1.4 Cycle-Interleaved Rules Correction

**Status:** Shipped 2026-05-20
**Phases:** 5
**Plans:** 5
**Requirements:** 33/33 satisfied
**Audit:** .planning/milestones/v1.4-MILESTONE-AUDIT.md

### Delivered

- Published canonical `cowards-rules-v1.4` rules and architecture docs that explicitly supersede full-Activation scheduling with Cycle-interleaved selected slots.
- Rewrote the pure engine Round scheduler so selected Soldiers act by Cycle layer, ended slots are skipped, blocked movement remains non-terminal, and Backstab resolves at Cycle start and Cycle end.
- Rebased Chronicle, replay grammar, validation, reconstruction, fixtures, and public replay labels on `chronicle-v1.4` and the corrected lifecycle events.
- Refreshed all ten Starter Strategies to v1.4 lineage and added an interleaved starter gauntlet covering real Cycle, Action, movement, contraction, and non-failed outcomes.
- Generated `/ladder/v1-4-demo` with eight likely-winning starter entrants, two counted MatchSets, 96 replay-backed Chronicles, realistic standings, and browser-verified public pages.
- Added configurable replay playback speeds from `0.5x` through `32x`, defaulting to `2x` for dense v1.4 Cycle timelines.

### Archives

- .planning/milestones/v1.4-ROADMAP.md
- .planning/milestones/v1.4-REQUIREMENTS.md
- .planning/milestones/v1.4-MILESTONE-AUDIT.md
- .planning/milestones/v1.4-AUDIT-FIX.md
- .planning/milestones/v1.4-phases/

### Known Deferred Items

- Durable ratings, official public tournaments, production-grade hostile-code sandboxing, non-JS runtimes, and custom arenas remain future milestone work.
