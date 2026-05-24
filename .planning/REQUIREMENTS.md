# Requirements: Coward's Game

**Defined:** 2026-05-24
**Milestone:** v1.16 Runtime Isolation and TypeScript Backend Retirement
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline And Classification

- [x] **BASE-01**: Developer can inspect a v1.16 inventory of every remaining Next.js API route, TypeScript server module, persistence import, `@cowards/service` use, worker/job lifecycle path, replay/public evidence path, runtime-service path, frontend-only path, parity-only path, rollback-only path, test-only path, and deferred path.
- [x] **BASE-02**: Developer can inspect a v1.16 ownership manifest that defines allowed TypeScript roles as frontend, runtime-only, parity-only, rollback-only, test-only, fixture-only, or deferred, with no normal TypeScript backend role.
- [x] **BASE-03**: Developer can verify v1.15 Go ownership behavior is treated as the backend baseline for orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence.
- [x] **BASE-04**: Developer can verify TypeScript service/backend behavior is documented only as parity oracle, test fixture source, rollback reference, frontend support, or isolated runtime service where still needed.
- [x] **BASE-05**: Developer can verify explicit v1.16 non-goals exclude replacing JS/TS Strategy support, building the future Runtime Broker, promoting WASM/WASI or non-JS counted play, production sandbox replacement, Go/web/API Strategy execution, Node `vm` security-boundary use, Node `node:wasi` as an untrusted-code sandbox, Go migration/schema ownership, durable ratings, official tournaments, custom arenas, marketplace work, or cloud deployment work.
- [x] **BASE-06**: Developer can verify the v1.16 baseline preserves deterministic engine purity, Strategy Revision immutability, schema validation, replay/public-output privacy, owner-source privacy, hostile-code isolation, rollback clarity, and no silent fallback.

### Runtime Service Boundary

- [x] **RT-01**: Developer can inspect the final v1.16 runtime service boundary as a broker-ready, language-neutral **Strategy Execution Service** / **Runtime Broker** contract, including transport contract, runtime ABI use, JSON/schema-validated envelopes, source package policy, execution limits, timeouts, diagnostics, logs, crash semantics, replay privacy, and no-fallback behavior.
- [x] **RT-02**: Developer can verify JS/TS Strategy execution remains supported only inside the isolated runtime service or its explicit runtime adapter boundary.
- [x] **RT-03**: Developer can verify the runtime service does not claim jobs, complete Matches, persist Chronicles, refresh MatchSet scoring, serve normal product API routes, access web/API request state, or act as a backend fallback.
- [x] **RT-04**: Developer can verify Go invokes runtime execution exclusively through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14` or a documented compatible successor whose JSON request/response shape can be implemented by every language runtime and fronted by a future language-neutral Runtime Broker.
- [x] **RT-05**: Developer can verify runtime service request and response schemas reject ABI drift, malformed inputs, source hash/byte mismatches, oversized payloads, timeout failures, invalid outputs, unsafe diagnostics, and private output leaks, and that Strategy Revision submission performs compile, validation, or artifact packaging checks where practical before immutable Match execution.
- [x] **RT-06**: Developer can verify Go and web/API processes do not import, evaluate, transpile, or execute Strategy source and do not use Node `vm` as a hostile-code security boundary.
- [x] **RT-07**: Developer can verify runtime readiness labels for worker-thread, subprocess, container-subprocess, and non-JS candidates remain explicit and do not silently promote production hostile-code isolation or counted non-JS play.

### Web And API Backend Retirement

- [x] **WEB-01**: User can perform selected normal account/session flows through web frontend routes that call Go-owned contracts without TypeScript persistence or `@cowards/service` fallback.
- [x] **WEB-02**: User can create selected exhibition MatchSets through web frontend routes that call Go-owned contracts without TypeScript competition persistence fallback.
- [x] **WEB-03**: User can view selected public Strategy, player, ladder, MatchSet, replay metadata, and public replay evidence pages through Go-owned read contracts without TypeScript service fallback.
- [x] **WEB-04**: Developer can verify selected Next.js API routes are frontend adapters to Go or are explicitly test-only, parity-only, rollback-only, runtime-only, or deferred.
- [x] **WEB-05**: Developer can verify `apps/web/app/competitive/server.ts` no longer owns selected normal auth/session/account/fork/exhibition backend behavior, or the remaining code is quarantined as rollback/deferred only.
- [x] **WEB-06**: Developer can verify `apps/web/lib/account-service-adapter.ts` and `apps/web/lib/public-service-adapter.ts` cannot silently fall back to TypeScript backend behavior when Go is selected or required.
- [x] **WEB-07**: Developer can verify selected public replay evidence avoids persistence-backed TypeScript Chronicle reads except explicitly authorized owner-debug or test/deferred paths.
- [x] **WEB-08**: Developer can verify all selected web/API cutovers preserve schema validation, error classification, auth/session privacy, owner-source privacy, public DTO privacy, and no secret-bearing diagnostics.

### TypeScript Worker And Persistence Quarantine

- [ ] **QUAR-01**: Developer can verify `apps/worker` is no longer a normal backend worker entrypoint and can run only as explicit rollback, parity, or test infrastructure.
- [ ] **QUAR-02**: Developer can verify TypeScript job claim, lease, retry, failure, Match completion, Chronicle persistence, and MatchSet scoring modules are no longer exported or reachable as normal runtime backend paths.
- [ ] **QUAR-03**: Developer can verify TypeScript MatchSet creation services for selected normal exhibition flows are deleted, quarantined, or relabeled as rollback/deferred/test-only.
- [ ] **QUAR-04**: Developer can verify TypeScript public DTO reads no longer lazily refresh Go-owned MatchSet scoring/status in selected normal public evidence paths.
- [ ] **QUAR-05**: Developer can verify `@cowards/service` is treated as parity oracle, fixture generator, rollback reference, or deferred support rather than the normal backend for selected routes.
- [ ] **QUAR-06**: Developer can run tests proving normal TypeScript job ownership remains blocked unless the worker purpose is explicitly rollback, test, or parity.
- [ ] **QUAR-07**: Developer can inspect rollback documentation that prevents mixed Go and TypeScript DB claim/completion owners and describes queued jobs, running jobs, expired leases, retries, incomplete MatchSets, and public evidence behavior.

### Deferred Surfaces And Privacy

- [ ] **DEF-01**: Developer can inspect remaining Workshop validation, source, test launch, analytics rerun, profile save, export, and runtime flows labeled as deferred unless migrated to Go in this milestone.
- [ ] **DEF-02**: Developer can inspect remaining admin/governance and ladder mutation surfaces labeled as deferred unless migrated to Go in this milestone.
- [ ] **DEF-03**: Developer can inspect owner-debug replay behavior as an explicit private/deferred path with authorization gates, not a public evidence fallback.
- [ ] **DEF-04**: Developer can verify test-support routes, fixture generators, and parity harnesses are gated and labeled so they cannot serve normal product runtime traffic.
- [ ] **DEF-05**: Developer can verify all deferred or rollback TypeScript paths preserve public-output privacy and owner-source privacy when exercised by tests or explicit local workflows.
- [ ] **DEF-06**: Developer can inspect a final TypeScript surface label artifact that covers every remaining TypeScript backend-like path and explains why it is allowed to remain.

### Topology And Monitors

- [ ] **GATE-01**: Developer can run a no-TypeScript-backend topology mode proving normal product topology works as web frontend -> Go backend -> isolated JS/TS runtime service, with TypeScript service/backend disabled or absent except for frontend and runtime service.
- [ ] **GATE-02**: Developer can verify `pnpm topology:check` has a v1.16 strict mode that requires no-TypeScript-backend behavior, Go health, runtime service health, selected web-through-Go routes, and representative page-load smoke.
- [ ] **GATE-03**: Developer can verify `pnpm boundary:monitors` includes representative page-load smoke and fails when any major page type stops loading.
- [ ] **GATE-04**: Developer can verify monitors fail on TypeScript backend ownership creep, direct web persistence access, unsafe fallback to retired TypeScript backend paths, runtime ABI drift, route manifest drift, boundary monitor drift, and unexpected Strategy execution outside the runtime service.
- [ ] **GATE-05**: Developer can verify monitors fail on public-output leaks of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack, stderr, session, token, DB DSN, host path, or private runtime internals.
- [ ] **GATE-06**: Developer can verify Go route manifests, fixture manifests, runtime service contracts, topology artifacts, TypeScript surface labels, and boundary monitors stay synchronized after route/runtime/ownership changes.
- [ ] **GATE-07**: Developer can verify stopped-Go and stopped-runtime-service drills fail closed or classify failures explicitly without TypeScript backend fallback.
- [ ] **GATE-08**: Developer can verify browser replay validation still shows plausible full Match starts with in-bounds visible Soldiers and terrain for Go-created or Go-completed replay evidence.
- [ ] **GATE-09**: Developer can verify final v1.16 evidence records the remaining TypeScript production-ish role as only frontend plus isolated JS/TS Strategy runtime service.

### Completion And Audit

- [ ] **EXIT-01**: Developer can run the full v1.16 verification suite, including Go tests, runtime-service tests/typecheck, web/service tests, topology strict mode, boundary monitors, replay/page smoke, and public-output privacy scans.
- [ ] **EXIT-02**: Developer can inspect a deletion/quarantine audit showing removed, moved, relabeled, deferred, rollback-only, parity-only, test-only, runtime-only, and frontend-only TypeScript surfaces.
- [ ] **EXIT-03**: Developer can inspect a promotion decision stating whether v1.16 achieved "no TypeScript backend" and listing any accepted deferred surfaces.
- [ ] **EXIT-04**: Developer can verify v1.16 completion archives requirements, roadmap, phase artifacts, and milestone audit; removes active `.planning/REQUIREMENTS.md`; updates PROJECT, STATE, MILESTONES, and RETROSPECTIVE; and tags `v1.16`.
- [ ] **EXIT-05**: Developer can verify no v1.16 artifact or diagnostic leaks private Strategy, owner, session, host, database, runtime, or source material.

## Future Requirements

### Runtime And Sandbox

- **RTP-01**: Developer can implement or promote a language-neutral Strategy Execution Service / Runtime Broker, or replace the JS/TS runtime service with another production runtime host, only after parity, isolation, observability, package policy, diagnostics redaction, no-fallback, and rollback evidence are complete.
- **RTP-02**: Developer can promote a production hostile-code isolation boundary after live container/microVM/resource/filesystem/network evidence and operational rollback criteria pass.
- **RTP-03**: User can submit counted non-JS Strategy Revisions only after sandbox, package policy, Workshop UX, docs, compatibility, privacy, and rollback criteria are satisfied.
- **RTP-04**: Developer can evaluate WASM/WASI/component-model runtime hosting as a long-term unifying path for some languages while proving deterministic execution, capability sandboxing, resource limits, compilation provenance, and host-runtime security instead of assuming WASI is sufficient by itself.

### Product And Operations

- **WORK-01**: Go can own Workshop validation, test launch, analytics rerun, profile save, export, or runtime flows after the deferred Workshop surface is selected and planned.
- **RPLY-01**: Go can own full owner-debug replay projection after public/private Chronicle projection parity and owner authorization semantics are proven.
- **LADR-01**: Go can own broader ladder scheduling, admin, and governance mutations after no-TypeScript-backend selected routes are stable.
- **OPS-01**: Go can own database migrations/schema after migration ownership, rollback, compatibility, and local topology contracts are explicitly planned.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Removing JS/TS Strategy support entirely | v1.16 target is no TypeScript backend, not no TypeScript runtime process. |
| Executing Strategy code in Go or web/API | Violates hostile-code isolation and deterministic boundary constraints. |
| Node `vm` as a security boundary | Explicitly prohibited and not suitable for hostile code isolation. |
| Production sandbox replacement | v1.16 preserves the existing runtime service boundary; sandbox promotion is separate. |
| Building the Strategy Execution Service / Runtime Broker | v1.16 shapes the contract so a broker can front or replace the TypeScript runtime service later; it does not implement the broker. |
| Promoting WASM/WASI/component-model runtime hosting | Strong long-term candidate for some languages, especially with deterministic fuel and sandbox guidance, but not a silver bullet and not promoted in v1.16. |
| Node `node:wasi` for untrusted code | Node's WASI implementation is not accepted as a hostile Strategy sandbox. |
| Counted non-JS MatchSets, ladders, or gauntlets by default | Requires separate product, sandbox, package, compatibility, and rollback work. |
| Go-owned migrations/schema ownership | Separate operational rollback risk. |
| Durable ratings, official tournaments, custom arenas, monetization, or marketplace work | Not part of TypeScript backend retirement. |
| Cloud deployment, Kubernetes, service mesh, or production observability stack | Local deterministic topology and monitors are the target. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 103 | Complete |
| BASE-02 | Phase 103 | Complete |
| BASE-03 | Phase 103 | Complete |
| BASE-04 | Phase 103 | Complete |
| BASE-05 | Phase 103 | Complete |
| BASE-06 | Phase 103 | Complete |
| RT-01 | Phase 104 | Complete |
| RT-02 | Phase 104 | Complete |
| RT-03 | Phase 104 | Complete |
| RT-04 | Phase 104 | Complete |
| RT-05 | Phase 104 | Complete |
| RT-06 | Phase 104 | Complete |
| RT-07 | Phase 104 | Complete |
| WEB-01 | Phase 105 | Complete |
| WEB-02 | Phase 105 | Complete |
| WEB-03 | Phase 105 | Complete |
| WEB-04 | Phase 105 | Complete |
| WEB-05 | Phase 105 | Complete |
| WEB-06 | Phase 105 | Complete |
| WEB-07 | Phase 105 | Complete |
| WEB-08 | Phase 105 | Complete |
| QUAR-01 | Phase 106 | Pending |
| QUAR-02 | Phase 106 | Pending |
| QUAR-03 | Phase 106 | Pending |
| QUAR-04 | Phase 106 | Pending |
| QUAR-05 | Phase 106 | Pending |
| QUAR-06 | Phase 106 | Pending |
| QUAR-07 | Phase 106 | Pending |
| DEF-01 | Phase 107 | Pending |
| DEF-02 | Phase 107 | Pending |
| DEF-03 | Phase 107 | Pending |
| DEF-04 | Phase 107 | Pending |
| DEF-05 | Phase 107 | Pending |
| DEF-06 | Phase 107 | Pending |
| GATE-01 | Phase 108 | Pending |
| GATE-02 | Phase 108 | Pending |
| GATE-03 | Phase 108 | Pending |
| GATE-04 | Phase 108 | Pending |
| GATE-05 | Phase 108 | Pending |
| GATE-06 | Phase 108 | Pending |
| GATE-07 | Phase 108 | Pending |
| GATE-08 | Phase 108 | Pending |
| GATE-09 | Phase 108 | Pending |
| EXIT-01 | Phase 109 | Pending |
| EXIT-02 | Phase 109 | Pending |
| EXIT-03 | Phase 109 | Pending |
| EXIT-04 | Phase 109 | Pending |
| EXIT-05 | Phase 109 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after Phase 105 verification*
