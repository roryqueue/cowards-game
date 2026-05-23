# Requirements: Coward's Game v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence

**Defined:** 2026-05-23
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.11 Requirements

Requirements for continuing the v1.10 boundary work: reduce the remaining broad web report-only direct persistence debt from the current 30-offense baseline by migrating the next narrow public/owner-safe Workshop read surfaces behind `@cowards/service`, and require live Go readiness evidence only as validation evidence without promoting Go ownership, writes, production routing, runtime isolation, or non-JS counted play.

### Scope and Boundary Baseline

- [ ] **SCOPE-01**: Developer can inspect a v1.11 ownership matrix that re-baselines all 30 broad web report-only offenses and classifies each as selected Workshop read candidate, intentionally deferred write/mutation/orchestration, Strategy source/private owner read, replay owner-debug/private Chronicle surface, Workshop source/runtime/export flow, or test/type cleanup.
- [ ] **SCOPE-02**: Developer can verify the v1.11 starting baseline before migration, including `pnpm boundary:imports`, `strict_offenses=0`, `report_only_offenses=30`, current Go route inventory, current topology checks, and current runtime/non-JS promotion status.
- [ ] **SCOPE-03**: Developer can see explicit v1.11 non-goals for Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, production Go routing, production sandbox promotion, counted non-JS play, Workshop source/save/validation/test-launch/rerun/export migration, full replay projection, Strategy source retrieval, and rule/Chronicle/scoring changes.
- [ ] **SCOPE-04**: Developer can verify each selected Workshop read move names its web route files, service methods, spec DTOs, privacy checks, strict import targets, report-only fingerprints, and rollback/defer criteria before implementation.
- [ ] **SCOPE-05**: Developer can verify candidate selection prefers existing user-facing read surfaces over cleanup-only changes, and cleanup-only changes are tied to a proven selected read boundary.

### Workshop Test Summary Read Boundary

- [ ] **WTEST-01**: User can load an existing Workshop test MatchSet summary through a `GET /api/workshop/tests/{matchSetId}` path that uses a spec/service-owned read DTO rather than the broad `workshop/server` persistence facade.
- [ ] **WTEST-02**: Developer can call a canonical `@cowards/service` Workshop test-summary read method that validates input and output with `@cowards/spec` schemas before returning data.
- [ ] **WTEST-03**: Developer can verify the Workshop test-summary DTO includes only source-free summary fields such as MatchSet id, status, match count, Match ids, public match summaries, scoring, and replay availability.
- [ ] **WTEST-04**: Developer can verify Workshop test launch, Strategy source validation, Strategy source save, Strategy source retrieval, runtime execution, Match orchestration, and worker behavior are not moved by the test-summary read slice.
- [ ] **WTEST-05**: Developer can verify missing MatchSets, storage-unavailable states, and public-safe errors preserve current user-visible behavior without exposing stack traces, stderr, sessions, tokens, host paths, raw Chronicle internals, or private runtime details.

### Workshop Analytics Compare Read Boundary

- [ ] **WCOMP-01**: User can load the existing Workshop analytics profile comparison through `GET /api/workshop/analytics/profiles/{profileId}/compare` using a spec/service-owned comparison DTO.
- [ ] **WCOMP-02**: Developer can call a canonical `@cowards/service` Workshop analytics compare read method that validates the profile id and output with `@cowards/spec` schemas before returning data.
- [ ] **WCOMP-03**: Developer can verify the comparison DTO preserves current profile id, base/compare run ids, compatibility/equivalence, W-L-D, points, evidence, and delta behavior while omitting Strategy source and private runtime/replay data by default.
- [ ] **WCOMP-04**: Developer can verify analytics rerun, profile save, export, gauntlet execution, test Match launch, worker execution, and persistence writes are not moved by the comparison read slice.
- [ ] **WCOMP-05**: Developer can verify local/owner availability checks and storage-unavailable errors remain public-safe and do not become existence oracles for private analytics data.

### Boundary Enforcement and Type Cleanup

- [ ] **BOUND-01**: Developer can promote the migrated Workshop read route files and their safe dependency closures to strict import enforcement without allowing direct imports of `@cowards/persistence`, runtime packages, worker packages, migrations, broad server facades, or Strategy execution modules.
- [ ] **BOUND-02**: Developer can verify migrated report-only fingerprints are removed from the known baseline rather than masked behind a new broad facade.
- [ ] **BOUND-03**: Developer can run `pnpm boundary:imports` and see `strict_offenses=0` with `report_only_offenses` below the v1.11 baseline of 30.
- [ ] **BOUND-04**: Developer can verify source-free Workshop type cleanup replaces direct persistence type imports only where the selected read DTO ownership is proven, and does not spec-promote source-bearing Workshop templates, samples, private source payloads, or runtime internals into public/service outputs.
- [ ] **BOUND-05**: Developer can verify no game rules, Chronicle reconstruction rules, scoring rules, or runtime execution behavior moved into React components, web route handlers, service DTO mappers, or Go handlers.

### Live Go Evidence-Only Validation

- [ ] **GOEVID-01**: Developer can run `pnpm go:parity` and verify Go fixtures, route manifest, checksums, schema validation, and public error shapes still match TypeScript-service-generated outputs.
- [ ] **GOEVID-02**: Developer can run `pnpm boundary:monitors` and verify Go route inventory remains GET-only, privacy-checked, aligned with canonical `SERVICE_API_ROUTES`, and limited to the approved read-only fixture-backed route set.
- [ ] **GOEVID-03**: Developer can start the local Go backend with fixture owner-token configuration and run `pnpm topology:check -- --require-go --json` with required checks passing for health, public MatchSet summary, public replay metadata, public Strategy page, unauthenticated owner analytics rejection, and privacy-safe diagnostics.
- [ ] **GOEVID-04**: Developer can verify required live Go evidence fails loudly when Go is unavailable or divergent and does not silently fall back to TypeScript for required Go validation.
- [ ] **GOEVID-05**: Developer can verify rollback documentation keeps production web traffic on the TypeScript service path and makes Go evidence removable without affecting user-facing TypeScript service behavior.
- [ ] **GOEVID-06**: Developer can verify v1.11 does not add Go writes, Go auth/session mutation, Go ladder writes, Go Match orchestration, Go jobs, Go migrations, Go persistence ownership, Go Strategy source retrieval, Go Strategy execution, production web routing to Go, production runtime sandbox promotion, or counted non-JS play.

### Milestone Verification

- [ ] **VER-01**: Developer can run v1.11 verification commands for contracts, OpenAPI lint, import boundaries, spec tests, service tests, web tests, typecheck, Go parity, topology including required live Go evidence, boundary monitors, replay smoke privacy, formatting, and whitespace checks.
- [ ] **VER-02**: Developer can verify existing JS/TS Workshop behavior, immutable Strategy Revision behavior, Workshop launch/test/rerun/export flows, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged.
- [ ] **VER-03**: Developer can verify the final boundary state, selected migrated files, final report-only count, live Go evidence output, runtime/non-JS non-promotion state, and rollback/defer notes are documented before milestone close.
- [ ] **VER-04**: Developer can verify all active v1.11 requirements are mapped to phases, implemented or explicitly deferred through the workflow, and covered by validation evidence before milestone audit.

## Future Requirements

Deferred to later milestones.

### Backend Migration

- **BACKX-01**: Developer can move Go mutation endpoints only after route ownership, auth/session, job claiming, persistence writes, migrations, rollback, transactional semantics, and write behavior are specified and proven.
- **BACKX-02**: Developer can route production web reads to Go only after service ownership, generated parity fixtures, live topology checks, privacy checks, no-fallback semantics, rollback, and operational failure behavior are explicit and satisfied.
- **BACKX-03**: Developer can add another Go read-model route only after v1.11 live evidence remains stable and the route has TypeScript-service-backed fixtures, GET-only ownership, privacy checks, topology checks, and rollback criteria.

### Runtime Expansion

- **RUNX-01**: Developer can promote one runtime isolation candidate to production counted execution only after required live container or stronger isolation evidence is complete in CI or an accepted production-equivalent lane.
- **RUNX-02**: User can submit counted non-JS Strategy Revisions only after sandbox, package, Workshop UX, documentation, compatibility, privacy, and rollback criteria are satisfied.

### Product and Operations

- **PRODX-01**: User can choose Strategy language in the public Workshop only after more than JS/TS is production-supported.
- **OPSX-01**: Operator can use production deployment and observability topology only after local topology, boundary diagnostics, privacy-safe logs, and rollback semantics have stabilized.

## Out of Scope

Explicitly excluded from v1.11. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Broad backend rewrite | v1.11 is a narrow web read-boundary and evidence milestone, not an ownership swap. |
| Go mutation endpoints, auth/session mutation, ladder entry/schedule/status writes, Match orchestration, job claiming, migrations, persistence writes, or Strategy execution | These require write semantics, identity ownership, transaction rules, job ownership, and rollback plans that are not proven by read-model parity. |
| Production web routing to Go | Live Go readiness is evidence-only; TypeScript service remains the production web path. |
| Additional Go read-model route unless explicitly justified during v1.11 planning | The milestone focus is web read debt burn-down plus live evidence, not route count expansion. |
| Production hostile-code sandbox promotion | Runtime isolation remains evidence-only unless a future milestone proves promotion criteria. |
| Counted Python or other non-JS MatchSets, ladders, gauntlets, analytics comparisons, or standings | Non-JS sandbox, package, compatibility, fairness, and product support remain unproven. |
| Public language picker or package dependency ecosystem | These would imply non-JS support parity before promotion criteria are met. |
| Workshop Strategy source retrieval, source save, validation/test execution, test launch, submission, analytics rerun, profile save, or export mutation migration | The v1.11 Workshop slice is read-only test-summary and analytics-compare data only. |
| Strategy Revision source retrieval migration | Owner source access is private and source-bearing. |
| Full replay projection, owner-debug replay migration, private Chronicle assembly, or replay fixture rewrite | Replay privacy and Chronicle projection remain too sensitive for this service-boundary slice. |
| Node `vm` or `vm2` as a security boundary | Node `vm` is not a security mechanism for hostile Strategy code. |
| Rule, Chronicle, scoring, terminology, engine, or deterministic runtime semantics changes | Boundary work must preserve deterministic gameplay and existing replay/evidence compatibility. |
| Durable ratings, official public tournaments, custom arenas, monetization, or live model/human control | These do not serve the v1.11 boundary and evidence goal. |

## Traceability

Which phases cover active v1.11 requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| SCOPE-01 | Phase 70 | Pending |
| SCOPE-02 | Phase 70 | Pending |
| SCOPE-03 | Phase 70 | Pending |
| SCOPE-04 | Phase 70 | Pending |
| SCOPE-05 | Phase 70 | Pending |
| WTEST-01 | Phase 71 | Pending |
| WTEST-02 | Phase 71 | Pending |
| WTEST-03 | Phase 71 | Pending |
| WTEST-04 | Phase 71 | Pending |
| WTEST-05 | Phase 71 | Pending |
| WCOMP-01 | Phase 72 | Pending |
| WCOMP-02 | Phase 72 | Pending |
| WCOMP-03 | Phase 72 | Pending |
| WCOMP-04 | Phase 72 | Pending |
| WCOMP-05 | Phase 72 | Pending |
| BOUND-01 | Phase 73 | Pending |
| BOUND-02 | Phase 73 | Pending |
| BOUND-03 | Phase 73 | Pending |
| BOUND-04 | Phase 73 | Pending |
| BOUND-05 | Phase 73 | Pending |
| GOEVID-01 | Phase 74 | Pending |
| GOEVID-02 | Phase 74 | Pending |
| GOEVID-03 | Phase 74 | Pending |
| GOEVID-04 | Phase 74 | Pending |
| GOEVID-05 | Phase 74 | Pending |
| GOEVID-06 | Phase 74 | Pending |
| VER-01 | Phase 75 | Pending |
| VER-02 | Phase 75 | Pending |
| VER-03 | Phase 75 | Pending |
| VER-04 | Phase 75 | Pending |

**Coverage:**
- v1.11 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0
- Complete: 0
- Selected web read slices: Workshop test-summary GET and Workshop analytics-compare GET
- Starting report-only baseline: 30

---
*Requirements defined: 2026-05-23*
*Last updated: 2026-05-23 after v1.11 roadmap creation*
