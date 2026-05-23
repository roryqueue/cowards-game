# Requirements: Coward's Game v1.12 Go Backend Promotion Readiness and Cutover Plan

**Defined:** 2026-05-23
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.12 Requirements

Requirements for one decisive Go backend promotion readiness milestone. v1.12 must prove whether production web reads can safely route to Go, and may promote at most one narrow public read route only if explicit evidence passes. `promote-none-yet` is a valid successful outcome when evidence is insufficient.

### Scope and Route Ownership

- [ ] **OWN-01**: Developer can inspect a v1.12 ownership matrix that re-baselines TypeScript-service versus Go ownership, including the remaining 29 broad web report-only direct persistence offenses and the five current GET-only Go route manifest entries.
- [ ] **OWN-02**: Developer can inspect a route candidate scorecard that evaluates health, public MatchSet summary, public replay metadata, public Strategy page, owner analytics summary, and nearby TypeScript public reads against production-read promotion criteria.
- [ ] **OWN-03**: Developer can verify v1.12 selects at most `getPublicStrategyPage` / `GET /public/strategies/{strategyId}` as the only route eligible for production Go read promotion.
- [ ] **OWN-04**: Developer can verify `promote-none-yet` is documented as an acceptable final decision when live data, parity, topology, privacy, rollback, or failure evidence is insufficient.
- [ ] **OWN-05**: Developer can verify explicit non-goals exclude Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, production runtime sandbox promotion, counted non-JS play, and rule/engine changes.
- [ ] **OWN-06**: Developer can verify baseline evidence records `strict_offenses=0`, current `report_only_offenses=29`, current Go route manifest contents, current topology behavior, and the v1.11 worker-idle preflight caveat.

### Promotion Criteria and Switch Contract

- [ ] **SWCH-01**: Developer can inspect a route-scoped promotion registry that declares route id, method, path, privacy class, default owner, selected owner, fallback policy, rollback owner, diagnostics class, and disallowed scopes.
- [ ] **SWCH-02**: Developer can verify production web reads default to the TypeScript service path unless an explicit route-scoped Go switch is enabled for the selected route.
- [ ] **SWCH-03**: Developer can verify Go-selected mode fails closed without automatic TypeScript fallback for network failure, timeout, non-JSON response, schema drift, privacy failure, 5xx, unavailable Go, or divergence.
- [ ] **SWCH-04**: Developer can verify switch logic lives below pages/routes in a service adapter or client boundary and does not place game rules, persistence access, or Go proxy logic in React components or route handlers.
- [ ] **SWCH-05**: Developer can verify Go client responses are parsed through canonical `@cowards/spec` schemas and mapped to the same public-safe success and error shapes as the TypeScript service.
- [ ] **SWCH-06**: Developer can verify diagnostics for switch state and failures expose only route id, selected backend, public-safe status, duration bucket, and sanitized failure class.

### Conditional Public Strategy Go Read

- [ ] **GOREAD-01**: User can load the public Strategy page through unchanged web behavior when the route switch is unset or TypeScript-owned.
- [ ] **GOREAD-02**: User can load the public Strategy page through a Go-owned path only when `getPublicStrategyPage` is explicitly selected and all promotion criteria are satisfied.
- [ ] **GOREAD-03**: Developer can verify Go does not serve production web public Strategy reads from fixture-only data when promotion is claimed.
- [ ] **GOREAD-04**: Developer can verify TypeScript service and Go return canonical-equivalent parsed DTOs for success, missing record, malformed id, storage unavailable, ordering, and public error behavior.
- [ ] **GOREAD-05**: Developer can verify public Strategy page Go responses omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, database DSNs, and private runtime internals by default.
- [ ] **GOREAD-06**: Developer can verify Go owner analytics, public MatchSet, public replay metadata, health, public player, ladder, Workshop, source retrieval, and private replay routes are not promoted by this slice.
- [ ] **GOREAD-07**: Developer can verify a no-go decision leaves production web traffic on the TypeScript service path with blockers documented rather than half-enabling Go.

### Parity, Privacy, and Boundary Gates

- [ ] **GATE-01**: Developer can run generated Go parity checks and verify fixtures, route manifest, checksums, schema validation, and public error shapes remain aligned with TypeScript-service-generated outputs.
- [ ] **GATE-02**: Developer can run boundary monitors and verify the Go route manifest remains GET-only, canonical, privacy-checked, and limited to the approved read-only route set.
- [ ] **GATE-03**: Developer can run required live Go topology checks that cover direct Go, web-through-selected-route behavior when enabled, TypeScript-owned default behavior, owner analytics auth rejection, and sanitized diagnostics.
- [ ] **GATE-04**: Developer can verify required Go evidence fails loudly without silent TypeScript fallback when Go is unavailable, returns invalid JSON, times out, violates schema, violates privacy, or diverges.
- [ ] **GATE-05**: Developer can verify `pnpm boundary:imports` remains `strict_offenses=0` and the broad report-only offense count does not increase above 29.
- [ ] **GATE-06**: Developer can verify no game rules, Chronicle reconstruction rules, scoring rules, runtime execution behavior, or Strategy validation behavior moved into web route handlers, service DTO mappers, or Go handlers.

### Rollback and Operational Failure Behavior

- [ ] **OPS-01**: Operator can follow a rollback runbook that returns the selected route to TypeScript ownership through one explicit owner/config switch.
- [ ] **OPS-02**: Developer can run a forward cutover drill, stopped-Go drill, timeout/bad-response drill, privacy-failure drill, and rollback drill for the selected route.
- [ ] **OPS-03**: User receives public-safe failure behavior for Go-selected unavailable, timeout, malformed, divergent, missing, and schema/privacy-failed responses.
- [ ] **OPS-04**: Developer can inspect evidence artifacts for forward cutover, no-fallback failure, rollback, privacy scan, route owner state, and final decision without exposing private runtime or owner data.
- [ ] **OPS-05**: Developer can verify logs, topology JSON, monitor output, and evidence artifacts omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, database DSNs, and private runtime internals by default.
- [ ] **OPS-06**: Developer can verify rollback to TypeScript does not affect immutable Strategy Revisions, public Strategy cards, replays, Workshop behavior, MatchSet evidence, or deterministic engine behavior.

### Milestone Verification and Decision

- [ ] **VER-01**: Developer can run the v1.12 verification gate for contracts, OpenAPI lint, import boundaries, spec tests, service tests, web tests, typecheck, Go parity, Go tests, live topology, boundary monitors, formatting, and whitespace checks.
- [ ] **VER-02**: Developer can verify final evidence records either `promote-one-route` with the selected route owner state or `promote-none-yet` with explicit blockers.
- [ ] **VER-03**: Developer can verify final public/service/Go/topology/monitor outputs remain free of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, database DSNs, and private runtime internals by default.
- [ ] **VER-04**: Developer can verify all active v1.12 requirements are mapped to exactly one phase, implemented or explicitly blocked/deferred, and covered by validation evidence before milestone audit.
- [ ] **VER-05**: Developer can verify deferred work is updated for Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, runtime sandbox promotion, counted non-JS play, and any unpromoted read routes.

## Future Requirements

Deferred to later milestones.

### Backend Migration

- **BACKX-01**: Developer can move Go mutation endpoints only after auth/session, transactional semantics, job ownership, persistence writes, migrations, rollback, and write behavior are specified and proven.
- **BACKX-02**: Developer can promote additional production web reads to Go only after v1.12 evidence remains stable and each route has explicit ownership, live parity, privacy, topology, no-fallback, rollback, and failure criteria.
- **BACKX-03**: Developer can move persistence ownership to Go only after migration ownership, schema ownership, transactional boundaries, operational rollback, and TypeScript compatibility are specified.

### Runtime Expansion

- **RUNX-01**: Developer can promote one runtime isolation candidate to production counted execution only after live container or stronger isolation evidence is complete in CI or an accepted production-equivalent lane.
- **RUNX-02**: User can submit counted non-JS Strategy Revisions only after sandbox, package, Workshop UX, documentation, compatibility, privacy, and rollback criteria are satisfied.

### Product and Operations

- **PRODX-01**: User can choose Strategy language in the public Workshop only after more than JS/TS is production-supported.
- **OPSX-01**: Operator can use a production deployment and observability topology only after local topology, boundary diagnostics, privacy-safe logs, and rollback semantics have stabilized.

## Out of Scope

Explicitly excluded from v1.12. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Broad backend rewrite | v1.12 is a readiness and cutover decision milestone, not a backend ownership swap. |
| More than one production Go read route | The milestone must prove one narrow route or prove none are ready. |
| Fixture-backed production web routing | Fixtures prove parity shape, not production data readiness. |
| Silent TypeScript fallback in Go-selected mode | Fallback would invalidate cutover evidence and hide operational failure. |
| Go mutation endpoints, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence writes, or Strategy execution | These require write semantics, identity ownership, transaction rules, job ownership, and rollback plans not proven by read routing. |
| Strategy Revision source retrieval migration | Owner source access is private and source-bearing. |
| Owner analytics production routing | Current owner-token fixture behavior is not production session ownership. |
| Full replay projection, owner-debug replay migration, private Chronicle assembly, or replay fixture rewrite | Replay privacy and Chronicle projection remain too sensitive for this cutover slice. |
| Workshop source retrieval, source save, validation/test launch, analytics rerun, profile save, export, or runtime migration | These are mixed source/runtime/mutation flows, not a narrow public read. |
| Production hostile-code sandbox promotion | Runtime isolation remains evidence-only unless a future milestone proves promotion criteria. |
| Counted Python or other non-JS MatchSets, ladders, gauntlets, analytics comparisons, or standings | Non-JS sandbox, package, compatibility, fairness, and product support remain unproven. |
| Public language picker or package dependency ecosystem | These would imply non-JS support parity before promotion criteria are met. |
| Rule, Chronicle, scoring, terminology, engine, or deterministic runtime semantics changes | Boundary work must preserve deterministic gameplay and existing replay/evidence compatibility. |
| Kubernetes, service mesh, gRPC, GraphQL, broad ORM adoption, or production observability stack | These expand operational surface without being necessary for one route decision. |
| Durable ratings, official public tournaments, custom arenas, monetization, or live model/human control | These do not serve the v1.12 readiness goal. |

## Traceability

Which phases cover active v1.12 requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| OWN-01 | Phase 76 | Pending |
| OWN-02 | Phase 76 | Pending |
| OWN-03 | Phase 76 | Pending |
| OWN-04 | Phase 76 | Pending |
| OWN-05 | Phase 76 | Pending |
| OWN-06 | Phase 76 | Pending |
| SWCH-01 | Phase 77 | Pending |
| SWCH-02 | Phase 77 | Pending |
| SWCH-03 | Phase 77 | Pending |
| SWCH-04 | Phase 77 | Pending |
| SWCH-05 | Phase 77 | Pending |
| SWCH-06 | Phase 77 | Pending |
| GOREAD-01 | Phase 78 | Pending |
| GOREAD-02 | Phase 78 | Pending |
| GOREAD-03 | Phase 78 | Pending |
| GOREAD-04 | Phase 78 | Pending |
| GOREAD-05 | Phase 78 | Pending |
| GOREAD-06 | Phase 78 | Pending |
| GOREAD-07 | Phase 78 | Pending |
| GATE-01 | Phase 79 | Pending |
| GATE-02 | Phase 79 | Pending |
| GATE-03 | Phase 79 | Pending |
| GATE-04 | Phase 79 | Pending |
| GATE-05 | Phase 79 | Pending |
| GATE-06 | Phase 79 | Pending |
| OPS-01 | Phase 80 | Pending |
| OPS-02 | Phase 80 | Pending |
| OPS-03 | Phase 80 | Pending |
| OPS-04 | Phase 80 | Pending |
| OPS-05 | Phase 80 | Pending |
| OPS-06 | Phase 80 | Pending |
| VER-01 | Phase 81 | Pending |
| VER-02 | Phase 81 | Pending |
| VER-03 | Phase 81 | Pending |
| VER-04 | Phase 81 | Pending |
| VER-05 | Phase 81 | Pending |

**Coverage:**
- v1.12 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0
- Complete: 0
- Selected production Go read candidate: `getPublicStrategyPage` / `GET /public/strategies/{strategyId}`
- Valid final decisions: `promote-one-route` or `promote-none-yet`

---
*Requirements defined: 2026-05-23*
*Last updated: 2026-05-23 after v1.12 roadmap creation*
