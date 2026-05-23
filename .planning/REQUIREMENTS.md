# Requirements: Coward's Game v1.13 Go Backend Ownership Cutover

**Defined:** 2026-05-23
**Outcome:** v1.13 complete 2026-05-23. 42/44 requirements complete or promoted; ACCT-04 and ACCT-05 accepted deferred because Go lacks library source manifest access required for fork parity.
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.13 Requirements

Requirements for a fast, decisive Go backend ownership cutover. Go should become the primary backend owner for selected normal product workflows, including public reads, owner/account reads, auth/session mutations, Strategy Revision source/write/fork flows, and exhibition creation. TypeScript service behavior remains the parity oracle and migration reference.

### Final Status

Selected Go promotion succeeded for public reads, auth/session, account revision list/source/create/save, and exhibition creation. Starter and Advanced fork routes remain TypeScript-owned by default and are recorded as blocked in the v1.13 route ownership manifest until Go can consume parity-safe library source manifests.

### Ownership and Cutover Scope

- [ ] **OWN-01**: Developer can inspect a v1.13 ownership matrix that re-baselines TypeScript-service, TypeScript web/API, TypeScript worker/runtime, and Go ownership for all selected route families.
- [ ] **OWN-02**: Developer can inspect a route ownership registry covering public, owner/session, and mutation routes with route id, method, path, auth scope, privacy class, selected owner, fallback policy, rollback owner, diagnostics class, and disallowed scopes.
- [ ] **OWN-03**: Developer can verify the v1.13 selected primary scope includes public Strategy, public player, public ladder, public MatchSet summary, public replay metadata, auth/session read and mutation, account Strategy Revision list/source/create/save/fork, and exhibition MatchSet creation.
- [ ] **OWN-04**: Developer can verify TypeScript service behavior is documented as the parity oracle and rollback reference, not the future production path for selected Go-owned routes.
- [ ] **OWN-05**: Developer can verify explicit non-goals keep Strategy execution, job claiming/completion, Match execution, Chronicle generation, full replay projection, owner-debug/private Chronicle assembly, Go-owned migrations, production sandbox promotion, counted non-JS play, and rule/engine changes outside v1.13.
- [ ] **OWN-06**: Developer can verify baseline evidence records `strict_offenses=0`, current `report_only_offenses=29`, current Go fixture-backed route inventory, v1.12 `promote-none-yet` blockers, and the v1.13 aggressive cutover decision.

### Go Persistence and DTO Foundation

- [ ] **GODB-01**: Developer can configure the Go backend with a PostgreSQL connection using sanitized environment handling that never prints DB DSNs, credentials, host paths, tokens, or private runtime internals.
- [ ] **GODB-02**: Developer can verify Go startup supports live DB-backed mode for selected routes and rejects claimed promotion when only fixture-backed data is available.
- [ ] **GODB-03**: Developer can inspect Go query/provider code for selected DTOs and see route-specific data access rather than broad persistence ownership, ORM adoption, or migration ownership.
- [ ] **GODB-04**: Developer can compare Go live DTOs against TypeScript service/reference outputs for seeded local data covering success, missing, malformed id, unauthorized, forbidden, storage unavailable, ordering, and public error behavior.
- [ ] **GODB-05**: Developer can verify Go responses parse through canonical service schemas or generated contract checks and run privacy scans before being returned to web clients.
- [ ] **GODB-06**: Developer can verify Go errors map to canonical public-safe service error shapes without stack traces, SQL details, DB DSNs, host paths, session tokens, or private runtime internals.

### Public Read Ownership

- [ ] **PUB-01**: User can load public Strategy pages through Go-owned live data by default for selected v1.13 topology, with TypeScript service retained only as explicit rollback/reference.
- [ ] **PUB-02**: User can load public player pages through Go-owned live data by default, preserving strategy cards, ladder history, result links, and private-field exclusions.
- [ ] **PUB-03**: User can load public ladder pages through Go-owned live data by default, preserving entries, standings, MatchSet links, policy text, counted-state explanations, and privacy exclusions.
- [ ] **PUB-04**: User can load public MatchSet summary pages through Go-owned live data by default, preserving scoring, entrants, standings, replay links, governance public explanations, and owner-source affordance safety.
- [ ] **PUB-05**: User can load public replay metadata through Go-owned live data by default without exposing full replay private projection, owner debug, Strategy memory, Soldier memory, objective payloads, or raw Awareness Grid.
- [ ] **PUB-06**: Developer can verify every selected public Go read fails closed without silent TypeScript fallback when Go is unavailable, times out, returns invalid JSON, violates schema, violates privacy, diverges, or returns unsafe links.

### Auth and Session Ownership

- [ ] **AUTH-01**: User can sign up through a Go-owned session/auth mutation path that preserves username, handle, display name, password policy, password hashing, uniqueness, cookie handoff, and public-safe error behavior.
- [ ] **AUTH-02**: User can sign in through a Go-owned session/auth mutation path that preserves authentication semantics, session token hashing, cookie handoff, invalid-credential behavior, and public-safe errors.
- [ ] **AUTH-03**: User can sign out through a Go-owned session revoke path that preserves idempotent revoke behavior and does not expose session identifiers or token hashes.
- [ ] **AUTH-04**: User can refresh the account session through a Go-owned session read path that returns only public account fields and preserves `last_seen_at` or an explicitly documented compatible behavior.
- [ ] **AUTH-05**: Developer can verify session, token, password hash, cookie, and auth diagnostics never appear in public/service/Go/topology/monitor outputs by default.
- [ ] **AUTH-06**: Developer can verify Go session/auth behavior has TypeScript parity tests for valid, missing, expired, revoked, malformed, wrong-password, duplicate, and storage-unavailable cases.

### Account Strategy Revision Ownership

- [ ] **ACCT-01**: User can list account Strategy Revision metadata through Go-owned live data without exposing Strategy source in list responses.
- [ ] **ACCT-02**: User can retrieve owner-private Strategy Revision source through a Go-owned route only when authenticated as the owner, with private/no-store response behavior and no inclusion in public or evidence artifacts by default.
- [ ] **ACCT-03**: User can save/create an account Strategy Revision through a Go-owned mutation path that preserves immutable revision semantics, source hashing, source byte limits, metadata, validation status, runtime metadata, and engine compatibility.
- [ ] **ACCT-04**: User can fork Starter Strategies through a Go-owned mutation path that preserves Starter lineage, source hash, tags, name, notes, validation status, and owner association.
- [ ] **ACCT-05**: User can fork Advanced Strategies through a Go-owned mutation path that preserves Advanced lineage, archetype, source hash, tags, name, notes, validation status, and owner association.
- [ ] **ACCT-06**: Developer can verify Strategy Revision source handling in Go never executes Strategy code in the web/API or Go process and does not use Node `vm` as a hostile-code security boundary.
- [ ] **ACCT-07**: Developer can verify account revision source/write/fork routes fail closed without silent TypeScript fallback and return public-safe or owner-private-safe errors for unauthorized, invalid source, invalid fork id, duplicate, storage-unavailable, schema, and privacy failures.

### Exhibition Creation Ownership

- [ ] **MUT-01**: User can create an exhibition MatchSet through a Go-owned mutation path that preserves preset validation, 2-8 distinct revision validation, ownership checks, counted-runtime eligibility checks, rate limits, and active duplicate prevention.
- [ ] **MUT-02**: Developer can verify Go exhibition creation writes MatchSet, entrant, Match, job, revision lock, provenance, and audit records with transactional semantics equivalent to the TypeScript reference.
- [ ] **MUT-03**: Developer can verify TypeScript worker ownership remains explicit for job claiming, Strategy execution, Match completion, Chronicle generation, scoring completion, and runtime failure classification after Go creates the exhibition.
- [ ] **MUT-04**: User can inspect the created exhibition result page after Go creation and see the same public-safe queued/running/complete/degraded behavior as TypeScript-created exhibitions.
- [ ] **MUT-05**: Developer can verify exhibition creation errors map to public-safe service error shapes for invalid preset, invalid revision ids, unauthorized, duplicate active exhibition, rate limit, storage unavailable, and transaction failure.
- [ ] **MUT-06**: Developer can verify Go exhibition creation does not execute Strategy source, does not read private owner source into public DTOs, and does not move Match orchestration or worker runtime ownership.

### Privacy, Topology, Rollback, and Verification

- [ ] **GATE-01**: Developer can run boundary monitors and verify route manifests, selected owners, privacy classes, no-fallback policy, rollback owners, and disallowed scopes match v1.13 requirements.
- [ ] **GATE-02**: Developer can run topology checks proving direct Go, web-through-Go, TypeScript rollback/reference, stopped-Go no-fallback, bad body, timeout, schema/privacy failure, divergence, and rollback behavior for selected route families.
- [ ] **GATE-03**: Developer can verify `pnpm boundary:imports` remains `strict_offenses=0` and report-only broad web offenses do not increase above 29 unless a documented ownership rebaseline explains the count.
- [ ] **GATE-04**: Developer can verify public/service/Go/topology/monitor/log/evidence outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- [ ] **GATE-05**: Operator can follow rollback instructions for every selected route family using explicit owner/config/code-revert steps without silent per-request TypeScript fallback in Go-selected evidence paths.
- [ ] **GATE-06**: Developer can run v1.13 verification covering contracts, OpenAPI lint, boundary imports, boundary monitors, Go tests, Go live parity, TypeScript parity/reference tests, web adapter tests, mutation tests, topology checks, typecheck, formatting, and whitespace checks.
- [ ] **GATE-07**: Developer can inspect final evidence recording which selected routes are Go-owned, which were rolled back or deferred, why, and what remains for v1.14.

## Future Requirements

Deferred to later milestones unless v1.13 explicitly replans.

### Runtime and Orchestration

- **RUNX-01**: Developer can move job claiming, Match execution, Chronicle generation, scoring completion, and runtime failure classification to Go only after worker ownership, hostile-code isolation, retries, idempotency, and rollback semantics are specified and proven.
- **RUNX-02**: Developer can promote one production hostile-code sandbox only after live resource-limit evidence is complete in CI or an accepted production-equivalent lane.
- **RUNX-03**: User can submit counted non-JS Strategy Revisions only after sandbox, package policy, Workshop UX, docs, compatibility, privacy, and rollback criteria are satisfied.

### Persistence and Operations

- **BACKX-01**: Developer can move migration/schema ownership to Go only after migration generation, compatibility, rollback, and TypeScript interoperability are specified.
- **BACKX-02**: Operator can use production deployment and observability topology only after local topology, boundary diagnostics, privacy-safe logs, and rollback semantics have stabilized.

### Product

- **PRODX-01**: User can choose Strategy language in the public Workshop only after more than JS/TS is production-supported.
- **PRODX-02**: User can participate in durable ratings, official public tournaments, or permanent standings only after governance, abuse controls, and sandbox evidence support them.

## Out of Scope

Explicitly excluded from v1.13. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Strategy execution in Go or web/API | Hostile Strategy code must remain outside web/API and the Go backend cutover. |
| Node `vm` as a security boundary | It is explicitly not acceptable for hostile Strategy isolation. |
| Worker job claiming/completion ownership | v1.13 may create exhibition jobs, but execution ownership remains TypeScript worker-owned. |
| Match execution, Chronicle generation, scoring completion, and runtime failure classification in Go | These are runtime/orchestration surfaces, not backend API cutover surfaces. |
| Full replay projection, owner-debug replay migration, or private Chronicle assembly | Replay privacy is too sensitive to bundle into this API ownership cutover. |
| Go-owned migrations/schema ownership | v1.13 uses existing schema; migration ownership needs a separate plan. |
| Production hostile-code sandbox promotion | Runtime isolation remains evidence-only unless a future milestone proves promotion criteria. |
| Counted Python or other non-JS MatchSets, ladders, gauntlets, analytics comparisons, or standings | Non-JS sandbox, package, compatibility, fairness, and product support remain unproven. |
| Public language picker or package dependency ecosystem | These would imply non-JS support parity before promotion criteria are met. |
| Rule, Chronicle, scoring, terminology, engine, or deterministic runtime semantics changes | Backend ownership must preserve deterministic gameplay and replay/evidence compatibility. |
| Kubernetes, service mesh, gRPC, GraphQL, broad ORM adoption, or production observability stack | These expand operational surface without being necessary for local Go ownership cutover. |
| Durable ratings, official public tournaments, custom arenas, monetization, or live model/human control | These do not serve the v1.13 ownership goal. |

## Traceability

Which phases cover active v1.13 requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| OWN-01 | Phase 82 | Pending |
| OWN-02 | Phase 82 | Pending |
| OWN-03 | Phase 82 | Pending |
| OWN-04 | Phase 82 | Pending |
| OWN-05 | Phase 82 | Pending |
| OWN-06 | Phase 82 | Pending |
| GODB-01 | Phase 83 | Pending |
| GODB-02 | Phase 83 | Pending |
| GODB-03 | Phase 83 | Pending |
| GODB-04 | Phase 83 | Pending |
| GODB-05 | Phase 83 | Pending |
| GODB-06 | Phase 83 | Pending |
| PUB-01 | Phase 84 | Pending |
| PUB-02 | Phase 84 | Pending |
| PUB-03 | Phase 84 | Pending |
| PUB-04 | Phase 84 | Pending |
| PUB-05 | Phase 84 | Pending |
| PUB-06 | Phase 84 | Pending |
| AUTH-01 | Phase 85 | Pending |
| AUTH-02 | Phase 85 | Pending |
| AUTH-03 | Phase 85 | Pending |
| AUTH-04 | Phase 85 | Pending |
| AUTH-05 | Phase 85 | Pending |
| AUTH-06 | Phase 85 | Pending |
| ACCT-01 | Phase 86 | Pending |
| ACCT-02 | Phase 86 | Pending |
| ACCT-03 | Phase 86 | Pending |
| ACCT-04 | Phase 86 | Accepted deferred |
| ACCT-05 | Phase 86 | Accepted deferred |
| ACCT-06 | Phase 86 | Pending |
| ACCT-07 | Phase 86 | Pending |
| MUT-01 | Phase 87 | Pending |
| MUT-02 | Phase 87 | Pending |
| MUT-03 | Phase 87 | Pending |
| MUT-04 | Phase 87 | Pending |
| MUT-05 | Phase 87 | Pending |
| MUT-06 | Phase 87 | Pending |
| GATE-01 | Phase 88 | Pending |
| GATE-02 | Phase 88 | Pending |
| GATE-03 | Phase 88 | Pending |
| GATE-04 | Phase 88 | Pending |
| GATE-05 | Phase 88 | Pending |
| GATE-06 | Phase 88 | Pending |
| GATE-07 | Phase 88 | Pending |

**Coverage:**
- v1.13 requirements: 44 total
- Mapped to phases: 44
- Complete or promoted: 42
- Accepted deferred: 2
- Unmapped: 0
- Final boundary baseline: `strict_offenses=0 report_only_offenses=29`
- Selected cutover mode: aggressive Go backend ownership with selected-route promotion

---
*Requirements defined: 2026-05-23*
*Last updated: 2026-05-23 after v1.13 selected Go backend route promotion*
