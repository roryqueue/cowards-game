# Requirements: Coward's Game v1.9 Backend and Runtime Ownership Split

**Defined:** 2026-05-22
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.9 Requirements

Requirements for making one deliberate ownership move: migrate more web read/user surfaces behind `@cowards/service` and widen strict import enforcement, while keeping Go, production runtime isolation, and non-JS counted play behind explicit guardrails.

### Ownership Decision and Scope Control

- [x] **OWN-01**: Developer can inspect a v1.9 ownership matrix that names which selected routes, files, DTOs, and processes are owned by web, `@cowards/service`, `@cowards/spec`, Go, runtime adapters, or future milestones.
- [x] **OWN-02**: Developer can verify baseline boundary evidence before migration, including `pnpm boundary:imports`, `pnpm boundary:monitors`, current strict offenses, and current report-only broad web persistence/runtime offenses.
- [x] **OWN-03**: Developer can see explicit v1.9 non-goals for Go writes, production sandbox promotion, counted non-JS play, full replay projection, Workshop Strategy source/test/save flows, and backend rewrites.
- [x] **OWN-04**: Developer can verify that no v1.9 ownership change moves game rules into React components, web route handlers, service DTO mappers, or Go handlers.

### Public Player Profile Service Migration

- [x] **SVC-01**: User can view the public player profile page with the same found, not-found, Strategy card, ladder history, and privacy behavior after the page reads through `@cowards/service`.
- [x] **SVC-02**: Developer can call a canonical `@cowards/service` public player profile read that validates input and output with `@cowards/spec` schemas before returning data.
- [x] **SVC-03**: Developer can verify public player profile DTOs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- [x] **SVC-04**: Developer can verify the migrated public player profile page and its chosen dependency closure are covered by strict import enforcement against persistence roots, migrations, workers, runtime adapters, and Strategy execution modules.
- [x] **SVC-05**: Developer can verify the broad web import-boundary baseline decreases after the player profile migration instead of masking migrated direct-import fingerprints.

### Owner Account Read Migration

- [x] **ACCT-01**: Signed-in user can load the account session snapshot through a service-owned read while preserving existing authenticated and unauthenticated behavior.
- [x] **ACCT-02**: Signed-in user can view their account Strategy Revision list through a service-owned read that returns metadata, hashes, status, language/runtime labels, counted eligibility, and compatibility data without returning Strategy source.
- [x] **ACCT-03**: Developer can verify owner account reads authorize before resource-specific disclosure and do not expose session ids, bearer tokens, private handles, existence oracles, stack traces, stderr, host paths, or private runtime internals in DTOs or diagnostics.
- [x] **ACCT-04**: Developer can verify account read migration does not move Strategy saves, source retrieval, validation/test execution, submissions, MatchSet creation, analytics reruns, exports, or other mutation flows behind the new read slice.
- [x] **ACCT-05**: Developer can verify migrated account read files and their chosen dependency closure are covered by strict import enforcement.

### Public Ladder Read Follow-Up Boundary

- [x] **READ-01**: Developer can verify the selected v1.9 follow-up read boundary is a public ladder season service read, not Go route expansion.
- [x] **READ-02**: User can view the selected ladder season through `@cowards/service` while preserving not-found behavior, standings, entry metadata, MatchSet links, counted-state explanations, and no-permanent-ratings copy.
- [x] **READ-05**: Developer can verify Go mutation endpoints, auth/session mutation, ladder entry/schedule/status writes, Match orchestration, job claiming, migrations, persistence writes, and Strategy execution remain out of scope.

### Runtime Isolation Guardrails

- [x] **RUN-01**: Developer can inspect runtime isolation promotion-readiness criteria covering required container probes, resource limits, filesystem denial, network denial, output caps, timeouts, image provenance, deployment prerequisites, failure taxonomy, and redacted diagnostics.
- [x] **RUN-02**: Developer can verify v1.9 does not promote worker-thread, host subprocess, container subprocess, Deno-style, WASM/WASI, gVisor, microVM, or any other candidate to production counted Match execution by default.
- [x] **RUN-03**: Developer can verify required runtime checks fail loudly rather than silently falling back to worker-thread, host subprocess, JS/TS, stale fixtures, or in-process execution.
- [x] **RUN-04**: Developer can verify runtime diagnostics distinguish Strategy runtime violations from system failures without exposing Strategy source, StrategyMemory, SoldierMemory, objective payloads, stderr, stack traces, host paths, sessions, tokens, or private runtime internals.

### Non-JS Runtime Guardrails

- [x] **NJS-01**: Developer can inspect non-JS promotion criteria covering deterministic language semantics, package policy, Workshop UX/docs, compatibility keys, counted eligibility, replay/export privacy, rollback, and deprecation rules.
- [x] **NJS-02**: Developer can verify Python and other non-JS runtimes remain experimental, disabled for normal counted play, and fail-closed for MatchSet, ladder, and gauntlet counted eligibility.
- [x] **NJS-03**: User-facing runtime labels and validation messages can mention experimental non-JS semantics without adding a public language picker or implying production support parity.
- [x] **NJS-04**: Developer can verify compatibility and boundary monitors fail on accidental non-JS counted eligibility or unsupported runtime promotion.

### Milestone Verification

- [x] **VER-01**: Developer can run v1.9 verification commands for contracts, import boundaries, service tests, web tests, typecheck, topology, boundary monitors, and any selected Go/runtime guardrail checks.
- [x] **VER-02**: Developer can verify existing JS/TS Workshop, immutable Strategy Revision behavior, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged.
- [x] **VER-03**: Developer can verify public replay, service, Go, topology, monitor, export, analytics, and runtime outputs still omit private Strategy/runtime data by default.

## Future Requirements

Deferred to later milestones.

### Backend Migration

- **BACKX-01**: Developer can move Go mutation endpoints only after route ownership, auth/session, job claiming, persistence writes, migrations, rollback, transactional semantics, and write behavior are specified.
- **BACKX-02**: Developer can route production web reads to Go only after service ownership, generated parity fixtures, topology checks, rollback, and operational failure behavior are proven.
- **BACKX-03**: Developer can generate TypeScript-service-backed parity fixtures for exactly one service-owned public route before adding any future Go read-model handler.
- **BACKX-04**: Developer can verify any future Go read-model route is GET-only, allowlisted, privacy-scanned, parity-checked, topology-diagnosed, and behind an explicit rollback path with no silent fallback in required-boundary checks.

### Runtime Expansion

- **RUNX-01**: Developer can promote one runtime isolation candidate to production counted execution only after required live container or stronger isolation evidence is complete in CI or an accepted production-equivalent lane.
- **RUNX-02**: User can submit counted non-JS Strategy Revisions only after sandbox, package, Workshop UX, documentation, compatibility, privacy, and rollback criteria are satisfied.

### Product and Operations

- **PRODX-01**: User can choose Strategy language in the public Workshop only after more than JS/TS is production-supported.
- **OPSX-01**: Operator can use production deployment and observability topology only after local topology, boundary diagnostics, privacy-safe logs, and rollback semantics have stabilized.

## Out of Scope

Explicitly excluded from v1.9. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Full Go backend rewrite | v1.9 chooses one service-backed web ownership move before backend ownership expands. |
| Go mutation endpoints, persistence writes, job claiming, migrations, Match orchestration, or Strategy execution | These require route ownership, auth, jobs, rollback, and write semantics that are not proven by v1.8. |
| Production hostile-code sandbox promotion | v1.9 may document readiness criteria, but v1.8 evidence is not enough for hostile public counted execution. |
| Counted Python or other non-JS MatchSets, ladders, gauntlets, analytics comparisons, or standings | Non-JS sandbox, package, compatibility, fairness, and product support are not proven. |
| Public language picker or package dependency ecosystem | These would imply support parity before promotion criteria are met. |
| Workshop Strategy source, save, submit, validation/test execution, analytics rerun, or export mutation migration | v1.9 first moves selected read/user surfaces only. |
| Full replay projection or owner-debug replay migration | Replay privacy and Chronicle projection are too sensitive for the first service ownership slice. |
| Node `vm` or `vm2` as a security boundary | Node `vm` is not a security mechanism for hostile Strategy code. |
| Kubernetes, service mesh, cloud deployment, or production observability stack | v1.9 needs local boundary proof and ownership clarity, not production infrastructure expansion. |
| Rule, Chronicle, scoring, terminology, engine, or deterministic runtime semantics changes | Ownership splitting must preserve deterministic gameplay and existing replay/evidence compatibility. |
| Durable ratings, official public tournaments, custom arenas, monetization, or live model/human control | These do not serve the v1.9 ownership-split goal. |

## Traceability

Which phases cover active v1.9 requirements. The selected read-model follow-up branch is the public ladder service read; Go read-model expansion requirements are deferred to future backend migration.

| Requirement | Phase | Status |
| --- | --- | --- |
| OWN-01 | Phase 57 | Complete |
| OWN-02 | Phase 57 | Complete |
| OWN-03 | Phase 57 | Complete |
| OWN-04 | Phase 57 | Complete |
| SVC-01 | Phase 58 | Complete |
| SVC-02 | Phase 58 | Complete |
| SVC-03 | Phase 58 | Complete |
| SVC-04 | Phase 58 | Complete |
| SVC-05 | Phase 58 | Complete |
| ACCT-01 | Phase 59 | Complete |
| ACCT-02 | Phase 59 | Complete |
| ACCT-03 | Phase 59 | Complete |
| ACCT-04 | Phase 59 | Complete |
| ACCT-05 | Phase 59 | Complete |
| READ-01 | Phase 60 | Complete |
| READ-02 | Phase 60 | Complete |
| READ-05 | Phase 60 | Complete |
| RUN-01 | Phase 61 | Complete |
| RUN-02 | Phase 61 | Complete |
| RUN-03 | Phase 61 | Complete |
| RUN-04 | Phase 61 | Complete |
| NJS-01 | Phase 62 | Complete |
| NJS-02 | Phase 62 | Complete |
| NJS-03 | Phase 62 | Complete |
| NJS-04 | Phase 62 | Complete |
| VER-01 | Phase 63 | Complete |
| VER-02 | Phase 63 | Complete |
| VER-03 | Phase 63 | Complete |

**Coverage:**
- v1.9 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0
- Active branch: public ladder service read
- Deferred Go read-model branch: BACKX-03, BACKX-04

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after Phase 63 verification*
