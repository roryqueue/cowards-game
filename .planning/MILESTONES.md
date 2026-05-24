# Milestones

## v1.15 Go Backend Ownership Completion

**Status:** Planning started 2026-05-24
**Phases:** 7
**Phase range:** 96-102
**Plans:** 0/7 complete
**Requirements:** 48/48 mapped, 0 complete
**Roadmap:** .planning/ROADMAP.md
**Requirements file:** .planning/REQUIREMENTS.md
**Research:** .planning/research/SUMMARY.md

### Goal

Make Go the owner of normal backend orchestration, persistence-facing API behavior, Match lifecycle coordination, Chronicle persistence, MatchSet scoring completion, and public evidence delivery while TypeScript remains frontend, parity oracle, and the isolated JS/TS Strategy runtime boundary.

### Selected Direction

- Treat TypeScript service and persistence behavior as parity oracle or rollback reference, not the future normal backend path.
- Move normal job claiming, lease, retry, failure, Match completion, Chronicle persistence, and MatchSet scoring completion to Go-owned contracts.
- Keep Strategy execution outside Go and web/API processes by routing execution through the v1.14 runtime ABI and a strict TypeScript runtime worker/service boundary.
- Move selected public evidence and normal web backend workflows to Go-owned contracts without silent TypeScript fallback.
- Preserve schema validation, hostile-code isolation, deterministic engine boundaries, replay/public-output privacy, owner-source privacy, and immutable Strategy Revision/Match eligibility.
- Keep production sandbox replacement and final TypeScript runtime retirement out of scope for v1.16 or later.

### Planned Phases

| Phase | Name |
| --- | --- |
| 96 | Boundary Baseline and Go Ownership Contract |
| 97 | Go Job Lifecycle and Persistence Contracts |
| 98 | Runtime Execution Service Boundary |
| 99 | Go Match Completion and Chronicle Persistence |
| 100 | Go MatchSet Scoring and Failure Classification |
| 101 | Public Evidence Delivery and Web Cutover |
| 102 | Topology, Monitors, Rollback, and Promotion Gate |

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- TypeScript runtime worker/service remains the hostile Strategy execution owner unless a later milestone explicitly promotes another boundary.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

## v1.14 Generic Strategy Artifact and Runtime Boundary Contract

**Status:** Shipped 2026-05-23
**Phases:** 7
**Phase range:** 89-95
**Plans:** 7/7 complete
**Requirements:** 48/48 complete
**Audit:** .planning/milestones/v1.14-MILESTONE-AUDIT.md
**Decision:** `promote-artifact-backed-go-forks-and-runtime-abi-v1.14`
**Archives:** .planning/milestones/v1.14-ROADMAP.md, .planning/milestones/v1.14-REQUIREMENTS.md, .planning/milestones/v1.14-phases/

### Goal

Define and implement generic Strategy Artifact/Revision contracts and a strict runtime ABI boundary so Go can consume parity-safe Strategy templates/forks without executing hostile Strategy code, while public outputs, replay safety, schema validation, and deterministic engine boundaries remain hard gates.

### Selected Direction

- Treat TypeScript service behavior as the parity oracle where needed, not the future backend path.
- Create a generic Strategy Artifact / Revision model for user revisions, server-native templates, Starter and Advanced libraries, future language variants, runtime metadata, source hashes, validation, lineage, and immutable Match eligibility.
- Generate parity-safe Strategy artifact manifests from TypeScript-owned source registries instead of duplicating library source in Go.
- Define `strategy-runtime-abi-v1.14` as the strict public interface between deterministic server/native orchestration and hostile Strategy runtime code.
- Keep Strategy execution out of web/API/Go processes; TypeScript worker/runtime remains the owner unless a later milestone explicitly promotes another boundary.
- Let Go consume generated artifacts for Starter/Advanced forks and lineage-preserving saves without executing Strategy source.
- Preserve public-output privacy and replay board realism through shared deny-list contracts, topology evidence, and browser/server validation.

### Completed Phases

| Phase | Name |
| --- | --- |
| 89 | Boundary Baseline and Scope Lock - Complete |
| 90 | Generic Strategy Artifact Contract - Complete |
| 91 | Generated Strategy Artifact Manifest - Complete |
| 92 | Runtime ABI v1.14 Contract - Complete |
| 93 | JS Runtime Adapter Conformance - Complete |
| 94 | Go Artifact Consumption and Fork Parity - Complete |
| 95 | Privacy, Realism, Topology, and Promotion Gate - Complete |

### Delivered

- Added generic Strategy Artifact and Strategy Revision schemas for source-bearing artifacts, source-safe summaries, runtime metadata, validation, lineage, behavior compatibility, and immutable Match eligibility.
- Generated `strategy-artifact-manifest-v1.14` from canonical TypeScript Starter, Advanced, and template registries with stale-output checks.
- Promoted `strategy-runtime-abi-v1.14` and added an explicit runtime JS ABI bridge for `selectActivations` and `soldierBrain`.
- Implemented Go-owned Starter and Advanced fork routes that consume generated artifacts as data only, preserve validation/runtime/hash/lineage metadata, and fail closed without silent TypeScript fallback.
- Centralized public-output privacy deny-list behavior in `@cowards/spec` and reused it across service, analytics, competition, replay projection, and monitors.
- Added replay board realism checks for invalid bounds, canonical starting layout, visible piece sanity, and terrain/Soldier overlap.
- Recorded v1.14 topology, ownership, and promotion artifacts.

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- TypeScript worker/runtime remains the owner for hostile Strategy execution and Match job completion unless a later milestone explicitly promotes that boundary.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

## v1.13 Go Backend Ownership Cutover

**Status:** Complete 2026-05-23
**Phases:** 7
**Phase range:** 82-88
**Plans:** 7/7 complete
**Requirements:** 42/44 complete or promoted; 2/44 accepted deferred; 44/44 mapped
**Decision:** `promote-selected-go-backend-routes`

### Goal

Perform a fast, decisive Go backend ownership cutover for normal product workflows. Go should become the primary owner for selected public reads, owner/account reads, auth/session mutations, account Strategy Revision source/write/fork flows, and exhibition creation while preserving deterministic engine boundaries, privacy, schema validation, hostile Strategy isolation, and public-output safety.

### Selected Direction

- Add Go DB/persistence access and live DTO assembly, replacing fixture-backed Go reads where practical.
- Treat TypeScript service behavior as the parity oracle and rollback reference.
- Make Go primary for public Strategy, player, ladder, MatchSet summary, and replay metadata reads.
- Make Go primary for auth/session read and mutation plus account Strategy Revision list/source/create/save; keep fork routes TypeScript-owned until Go can preserve library source parity.
- Make Go primary for exhibition MatchSet creation while keeping TypeScript worker/runtime ownership for job claiming, Match execution, Chronicle generation, and Strategy execution.
- Fail closed for Go-selected paths and avoid silent TypeScript fallback in evidence paths.
- Keep public/service/Go/topology/monitor outputs free of private Strategy, owner, session, host, database, and runtime internals by default.

### Completed Phases

| Phase | Name |
| --- | --- |
| 82 | Ownership Baseline and Aggressive Cutover Registry - Complete |
| 83 | Go Persistence and Live DTO Foundation - Complete |
| 84 | Public Read Ownership Cutover - Complete |
| 85 | Auth, Session, and Account Read Ownership - Complete |
| 86 | Account Strategy Revision Source and Write Ownership - Complete with fork deferral |
| 87 | Exhibition Creation Ownership and Worker Handoff - Complete |
| 88 | Multi-Route Cutover Verification and Rollback Gate - Complete |

### Delivered

- Added live PostgreSQL-backed Go backend mode with route-specific DTO assembly.
- Cut over selected public reads, auth/session routes, account revision list/source/create/save, and exhibition creation to Go ownership under explicit owner switches.
- Preserved fail-closed behavior for Go-selected web paths without silent TypeScript fallback.
- Kept TypeScript worker/runtime ownership for hostile Strategy execution and Match completion.
- Recorded Starter/Advanced fork routes as blocked/deferred because Go lacks parity-safe library source manifest access.
- Passed `go test ./...`, `pnpm test:fast`, `pnpm boundary:monitors`, `pnpm preflight -- --skip-web`, and live browser validation.

### Archives

- .planning/milestones/v1.13-ROADMAP.md
- .planning/milestones/v1.13-REQUIREMENTS.md
- .planning/milestones/v1.13-MILESTONE-AUDIT.md
- .planning/milestones/v1.13-phases/
- .planning/artifacts/v1.13-promotion-decision.md
- .planning/artifacts/v1.13-live-web-go-topology.json

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- TypeScript worker/runtime remains the owner for hostile Strategy execution and Match job completion unless a later milestone explicitly promotes that boundary.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

## v1.12 Go Backend Promotion Readiness and Cutover Plan

**Status:** Complete 2026-05-23
**Phases:** 6
**Phase range:** 76-81
**Plans:** 6/6 complete
**Requirements:** 36/36 complete or explicitly blocked/deferred; 36/36 mapped
**Audit:** .planning/milestones/v1.12-MILESTONE-AUDIT.md
**Decision:** `promote-none-yet`

### Delivered

- Re-baselined TypeScript-service versus Go ownership, including the 29 report-only broad web offenses and five GET-only Go manifest entries.
- Selected only `getPublicStrategyPage` as a candidate and recorded all other routes as blocked, evidence-only, or deferred.
- Added a route-specific public Strategy Go read switch that defaults to TypeScript, requires explicit config, validates canonical schemas, scans raw JSON for private fields, rejects unsafe links, and fails closed without TypeScript fallback.
- Added web-through-Go topology evidence and a route ownership manifest gate to boundary monitors.
- Ran operational drills for forward switch, stopped-Go no-fallback, bad body/schema/privacy/divergence handling, and rollback.
- Recorded `promote-none-yet` because the Go handler remains fixture-backed and lacks a production-equivalent data provider.

### Planned Phases

| Phase | Name |
| --- | --- |
| 76 | Scope Lock and Route Ownership Manifest — Complete |
| 77 | Production Read Switch Contract — Complete |
| 78 | Conditional Public Strategy Go Read Path — Complete |
| 79 | Privacy, Parity, and Boundary Drift Gate — Complete |
| 80 | Rollback and Operational Failure Drill — Complete |
| 81 | Milestone Verification and Promotion Decision — Complete |

### Archives

- .planning/milestones/v1.12-MILESTONE-AUDIT.md
- .planning/artifacts/v1.12-promotion-decision.md
- .planning/artifacts/v1.12-live-web-go-topology.json

## v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence

**Status:** Shipped 2026-05-23
**Phases:** 6
**Phase range:** 70-75
**Plans:** 6/6 complete
**Requirements:** 30/30 complete; 30/30 mapped
**Audit:** .planning/milestones/v1.11-MILESTONE-AUDIT.md

### Goal

Build on v1.10's service-boundary completion work by reducing the remaining broad web report-only direct persistence debt from the 30-offense baseline, selecting the next narrow public/owner-safe Workshop read surfaces to route through `@cowards/service`, and requiring live Go readiness evidence as validation-only proof without promoting Go ownership.

### Selected Direction

- Re-baseline and classify the current 30 broad web report-only offenses before implementation.
- Move Workshop test-summary GET reads behind spec/service-owned DTOs while keeping launch/source/runtime behavior out of scope.
- Move Workshop analytics-compare GET reads behind spec/service-owned DTOs while keeping rerun/save/export/execution behavior out of scope.
- Promote only proven migrated files and source-free type cleanup to strict import enforcement.
- Require live Go readiness evidence through parity, boundary monitors, required local topology checks, privacy checks, no-fallback semantics, and rollback documentation.
- Keep Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence writes, Strategy source retrieval, Strategy execution, production Go routing, production sandbox promotion, and counted non-JS play out of scope.

### Delivered

- Re-baselined the 30 broad web report-only direct persistence offenses and selected two narrow Workshop read surfaces.
- Moved Workshop test-summary GET and Workshop analytics-compare GET reads behind `@cowards/service` with spec-owned DTO validation.
- Promoted selected migrated routes and the safe read-boundary helper to strict import enforcement.
- Removed one real report-only fingerprint from `apps/web/app/workshop/types.ts`, reducing report-only debt from 30 to 29.
- Required live Go readiness evidence as validation only, including no-fallback proof when Go is unavailable.
- Preserved TypeScript ownership for writes, source retrieval, Workshop source/save/test/rerun/export/runtime flows, Match orchestration, jobs, migrations, Strategy execution, production Go routing, runtime promotion, and counted non-JS play.

### Planned Phases

| Phase | Name |
| --- | --- |
| 70 | Boundary Debt Rebaseline and v1.11 Scope Lock — Complete |
| 71 | Workshop Test Summary Read Boundary — Complete |
| 72 | Workshop Analytics Compare Read Boundary — Complete |
| 73 | Boundary Enforcement and Source-Free Type Cleanup — Complete |
| 74 | Live Go Readiness Evidence Gate — Complete |
| 75 | Milestone Verification and Regression Gate — Complete |

### Archives

- .planning/milestones/v1.11-ROADMAP.md
- .planning/milestones/v1.11-REQUIREMENTS.md
- .planning/milestones/v1.11-MILESTONE-AUDIT.md
- .planning/milestones/v1.11-phases/

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process, and Node `vm` is not used as a hostile-code security boundary.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- Go backend work remains read-only and evidence-only; production web traffic remains on the TypeScript service path.
- Python and other non-JS runtimes remain experimental, disabled for normal play, and non-counted.

### Known Deferred Items

- 29 remaining broad web report-only direct persistence offenses not selected in v1.11 remain visible for future service-boundary milestones.
- Workshop source/save/validation/test-launch/runtime/rerun/profile-save/export flows remain TypeScript-owned.
- Replay owner-debug/private Chronicle assembly remains out of scope.
- Go mutation endpoints, auth/session mutation, ladder writes, jobs, migrations, Match orchestration, persistence writes, Strategy source retrieval, and Strategy execution remain TypeScript-owned.
- Production runtime isolation promotion and counted non-JS play remain deferred.

## v1.10 Service Boundary Completion and Go Read-Model Decision

**Status:** Shipped 2026-05-23
**Phases:** 6
**Phase range:** 64-69
**Plans:** 6/6 complete
**Requirements:** 29/29 complete; 29/29 mapped
**Audit:** .planning/milestones/v1.10-MILESTONE-AUDIT.md

### Delivered

- Classified the 34-offense v1.9 broad web report-only baseline and locked v1.10 scope before migration.
- Moved account Strategy Revision list reads behind `@cowards/service` while keeping save, source, fork, validation, test, submission, and MatchSet creation behavior out of scope.
- Moved the Workshop analytics/Evidence Explorer read slice behind spec/service-owned DTOs while keeping Workshop source/save/test/runtime/rerun/export flows out of scope.
- Added exactly one Go read-model expansion, public `GET /public/strategies/{strategyId}`, backed by generated TypeScript-service parity fixtures.
- Promoted migrated slices to strict import enforcement and reduced broad web report-only direct persistence debt from 34 to 30.
- Preserved runtime isolation as evidence-only and kept Python/other non-JS runtimes experimental and non-counted.
- Verified the milestone through contracts, OpenAPI lint, typecheck, tests, Go parity, topology, boundary monitors, replay smoke, formatting, whitespace checks, audit-fix, and milestone audit.

### Goal

Build on v1.9's first service-boundary ownership move by migrating high-value web read/user surfaces behind `@cowards/service`, reducing the remaining broad web report-only direct persistence debt from the 34-offense baseline, and implementing exactly one guarded Go public Strategy read-model route only after route ownership, auth/error semantics, generated TypeScript-service-backed parity fixtures, topology checks, privacy checks, and rollback criteria are explicit.

### Selected Direction

- Continue service-backed web read migration and promote proven slices from report-only to strict enforcement.
- Disentangle the account Strategy Revision list read without moving save, fork, source, validation, test, submission, or MatchSet creation behavior.
- Move a narrow Workshop analytics/Evidence Explorer read slice behind spec/service-owned DTOs without moving Workshop source/save/test/runtime flows.
- Add exactly one Go read-model expansion: public `GET /public/strategies/{strategyId}` via generated TypeScript-service-backed fixtures.
- Keep Go writes, jobs, migrations, Match orchestration, Strategy execution, production sandbox promotion, and counted non-JS play out of scope.

### Planned Phases

| Phase | Name |
| --- | --- |
| 64 | Boundary Debt Triage and Scope Lock — Complete |
| 65 | Account Revision List Read Boundary — Complete |
| 66 | Workshop Analytics Evidence Read Boundary — Complete |
| 67 | Public Strategy Go Read-Model Route — Complete |
| 68 | Boundary Enforcement and Promotion Guardrails — Complete |
| 69 | Milestone Verification and Regression Gate — Complete |

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process, and Node `vm` is not used as a hostile-code security boundary.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- Go backend work remains read-only and limited to exactly one selected public Strategy read route.
- Python and other non-JS runtimes remain experimental, disabled for normal play, and non-counted.

### Archives

- .planning/milestones/v1.10-ROADMAP.md
- .planning/milestones/v1.10-REQUIREMENTS.md
- .planning/milestones/v1.10-MILESTONE-AUDIT.md
- .planning/milestones/v1.10-phases/

### Known Deferred Items

- 30 broad web report-only direct persistence offenses remain for future service-boundary milestones.
- Workshop source/save/test/runtime/rerun/export flows remain TypeScript-owned and outside the v1.10 analytics read migration.
- Go mutation endpoints, auth/session mutation, ladder writes, jobs, migrations, Match orchestration, persistence writes, Strategy source retrieval, and Strategy execution remain TypeScript-owned.
- Production web traffic still routes through the TypeScript service path; Go remains a read-only parity-backed route set unless a future milestone proves promotion and rollback criteria.
- Production hostile-code sandbox promotion still requires live container or stronger production-equivalent evidence.
- Python and other non-JS runtimes remain experimental, disabled for normal counted play, and non-counted.

## v1.9 Backend and Runtime Ownership Split

**Status:** Shipped 2026-05-23
**Phases:** 7
**Phase range:** 57-63
**Plans:** 7/7 complete
**Requirements:** 28/28 complete; 28/28 mapped
**Audit:** .planning/milestones/v1.9-MILESTONE-AUDIT.md

### Delivered

- Moved selected public/player, owner account, and public ladder read surfaces behind `@cowards/service`.
- Widened strict import enforcement while reducing broad web report-only persistence debt from 41 to 34 known offenses.
- Added runtime isolation readiness and non-JS promotion guardrails without promoting any runtime candidate.
- Fixed the audit-found container runtime eligibility blocker so the production-candidate container adapter remains evidence-only and non-counted.
- Verified the milestone through package tests, replay smoke tests, typecheck, topology, sandbox evaluation checks, Go parity, and boundary monitors.

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
| 58 | Public Player Profile Service Read — Complete |
| 59 | Owner Account Read Service Slice — Complete |
| 60 | Public Ladder Service Read Follow-Up — Complete |
| 61 | Runtime Isolation Readiness Guardrails — Complete |
| 62 | Experimental Non-JS Runtime Guardrails — Complete |
| 63 | Milestone Verification and Regression Gate — Complete |

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process, and Node `vm` is not used as a hostile-code security boundary.
- Public replay, service, Go, topology, monitor, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- Go backend work remains read-only unless v1.9 explicitly scopes a write boundary.
- Non-JS runtimes remain experimental unless v1.9 explicitly proves promotion criteria.

### Archives

- .planning/milestones/v1.9-ROADMAP.md
- .planning/milestones/v1.9-REQUIREMENTS.md
- .planning/milestones/v1.9-MILESTONE-AUDIT.md
- .planning/milestones/v1.9-phases/

### Known Deferred Items

- Future Go read-model expansion remains deferred until a route is explicitly scoped with generated TypeScript-service-backed parity fixtures, GET-only routing, topology diagnosis, and rollback scope.
- Go mutation endpoints, writes, jobs, migrations, Match orchestration, and Strategy execution remain TypeScript-owned.
- Production hostile-code sandbox promotion remains deferred until live container or stronger isolation evidence is complete in CI or a production-equivalent lane.
- Python and other non-JS runtimes remain experimental and non-counted.

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
