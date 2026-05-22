# Requirements: Coward's Game v1.8 Production Boundary Hardening

**Defined:** 2026-05-22
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.8 Requirements

Requirements for turning the v1.7 service/runtime/backend contracts into sturdier operating boundaries without prematurely rewriting orchestration, backend ownership, or production multi-language runtime support.

### Service Contract Generation and Route Migration

- [x] **GEN-01**: Developer can regenerate a deterministic service contract artifact from canonical `@cowards/spec` route and DTO schemas.
- [x] **GEN-02**: Generated or generation-ready service artifacts include stable route ids, operation ids, methods, paths, auth scopes, privacy classes, request/response schemas, shared error schemas, examples, and fixture references for the v1.8 route surface.
- [x] **GEN-03**: Contract linting and stale-output checks fail when generated service artifacts drift from canonical schemas.
- [x] **GEN-04**: Public, owner-authorized, and internal DTO schemas remain separated so public contract output excludes private persistence/runtime records by default.
- [x] **GEN-05**: A named set of low-risk Next route handlers or server loaders moves from direct persistence workflow imports to the typed `@cowards/service` boundary.
- [x] **GEN-06**: Migrated routes preserve existing DTO behavior, deterministic ordering, compatibility fields, public error shapes, and privacy redaction.
- [x] **GEN-07**: Import-boundary checks fail if migrated web/API routes import persistence roots, migration code, worker entrypoints, runtime adapters, or Strategy execution modules directly.

### Go Read-Only Backend Parity

- [x] **GO-01**: Developer can run the Go read-only service against real golden fixtures or safe local persisted data instead of only static DTO examples.
- [x] **GO-02**: Go read-only endpoints cover health, public MatchSet summary, replay metadata, and one selected analytics summary.
- [x] **GO-03**: Go and TypeScript service outputs match as parsed canonical DTOs for status, deterministic ordering, compatibility/version fields, privacy redaction, and public error shapes.
- [x] **GO-04**: Go route inventory is allowlisted and read-only, with tests failing on mutation verbs or unsupported ownership expansion.
- [x] **GO-05**: Go backend documentation states that auth mutation, Strategy submission, Strategy source retrieval, MatchSet creation, Match orchestration, job claiming, migrations, persistence writes, and Strategy execution remain TypeScript-owned.
- [x] **GO-06**: Go parity fixtures include at least one degraded or system-failed evidence case without exposing private Strategy/runtime data in public responses.

### Runtime Sandbox Hardening Prototype

- [x] **SBX-01**: Developer can run a sandbox evaluation harness through the existing Strategy runtime ABI without changing counted Match execution defaults.
- [x] **SBX-02**: Sandbox evaluation compares practical candidates such as worker baseline, host subprocess, container subprocess, WASM/WASI, Deno-style permissions, gVisor, and microVM-style isolation where locally feasible.
- [x] **SBX-03**: Hostile fixture probes cover system time, randomness, filesystem, network, environment, shell/process access, dynamic code execution, malformed IPC, oversized output, stdout/stderr caps, memory/source limits, timeout, and crash behavior.
- [x] **SBX-04**: Sandbox results preserve the existing failure taxonomy by distinguishing Strategy runtime violations from system failures with public-safe messages.
- [x] **SBX-05**: Sandbox evaluation records containment gaps, deterministic-execution risk, resource-limit behavior, startup and developer ergonomics, adapter metadata implications, and unresolved production risks.
- [x] **SBX-06**: v1.8 documentation explicitly states that no sandbox candidate is promoted to production hostile-code isolation or counted-play eligibility by default.

### Non-JS Strategy Product Semantics

- [x] **NJS-01**: Strategy language and runtime registry metadata defines language id/version, ABI version, runtime adapter id/version, readiness, isolation notes, capability limits, source/package metadata policy, and counted-play eligibility.
- [x] **NJS-02**: Non-JS Strategy surfaces expose experimental labels, compatibility warnings, validation codes, docs/examples hooks, and clear non-counted eligibility wording wherever they are surfaced.
- [x] **NJS-03**: Validation messages cover unsupported language, unsupported package metadata, incompatible adapter, ABI mismatch, source size limit, memory limit, timeout, forbidden capability, and non-counted eligibility.
- [x] **NJS-04**: Counted MatchSet, ladder, and gauntlet eligibility checks fail closed for experimental non-JS adapters with stable user-facing reasons.
- [x] **NJS-05**: Existing JS/TS Strategy Revision behavior, metadata normalization, Workshop save/test flow, and counted-play eligibility remain unchanged unless explicitly covered by compatibility tests.
- [x] **NJS-06**: Python and any other non-JS runtime remain experimental unless a future milestone defines and satisfies promotion criteria.

### Cross-Process Local Deployment Harness

- [x] **TOPO-01**: Developer can run a repeatable local boundary topology for the web app, TypeScript service path, worker/runtime adapter, Go read-only backend, and fixture loading.
- [x] **TOPO-02**: Local topology health checks identify each component, process/base URL, contract version, fixture id, endpoint, and readiness state.
- [x] **TOPO-03**: Smoke requests cover web service health, TypeScript service DTOs, Go health, Go public MatchSet summary, Go replay metadata, selected analytics summary, and runtime adapter diagnostics.
- [x] **TOPO-04**: Local topology fails loudly when a required boundary process is unavailable instead of silently falling back to in-process or stale fixture behavior.
- [x] **TOPO-05**: Local diagnostics are privacy-safe and omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals by default.
- [x] **TOPO-06**: Setup documentation lists required commands, ports, environment variables, fixture-loading steps, smoke checks, and common failure diagnostics.

### Observability, Privacy, and Boundary Drift Monitors

- [ ] **MON-01**: Boundary checks fail on service contract drift, stale generated artifacts, or route schema mismatches.
- [ ] **MON-02**: Public DTO leak scanners fail if service, replay, MatchSet, ladder, analytics, export, Go, topology, or diagnostic outputs expose private Strategy/runtime fields by default.
- [ ] **MON-03**: Web/API boundary monitors fail on direct Strategy runtime execution or runtime worker imports from web/API processes.
- [ ] **MON-04**: Migrated-route monitors fail on direct persistence-root imports outside approved service implementation modules.
- [ ] **MON-05**: Adapter compatibility drift checks compare registry metadata, ABI version, adapter id/version, language id/version, limits, readiness, and counted-play eligibility against executable adapter behavior.
- [ ] **MON-06**: Go/TypeScript parity drift checks run locally or in CI for every v1.8 Go read-only endpoint.
- [ ] **MON-07**: v1.8 verification proves existing JS/TS Workshop, immutable Strategy Revision, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged.

## Future Requirements

Deferred to later milestones.

### Backend Migration

- **BACKX-01**: Developer can move mutation endpoints, orchestration, persistence writes, job claiming, or Match execution behind a Go backend after read-only contract parity and local topology are proven.
- **BACKX-02**: Developer can run Go against production-like read models after route ownership, auth, deployment, and observability semantics are defined.

### Runtime Expansion

- **RUNX-01**: Developer can promote one sandbox candidate to production hostile-code isolation after deeper resource, kernel, deployment, abuse, and operational evidence is complete.
- **RUNX-02**: User can submit production-supported non-JS Strategy Revisions after sandbox, package, Workshop, compatibility, documentation, and counted-play semantics are proven.
- **RUNX-03**: User can manage non-JS package dependencies after reproducible package metadata, lockfile behavior, supply-chain policy, and sandbox rules are designed.

### Product and Operations

- **PRODX-01**: User can choose Strategy language in the public Workshop once more than JS/TS is production-supported.
- **PRODX-02**: User can participate in official scheduled tournaments or durable ratings after backend/runtime trust boundaries are production-ready.
- **OPSX-01**: Operator can use a production observability stack after local boundary monitors and privacy-safe diagnostics have stabilized.

## Out of Scope

Explicitly excluded from v1.8. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Full Go backend rewrite | v1.8 proves read-only parity and topology before moving ownership. |
| Go mutation endpoints, job claiming, migrations, Match orchestration, or Strategy execution | These would split authoritative behavior before contracts and parity are proven. |
| Production-grade hostile-code sandbox promotion | v1.8 evaluates candidates and records gaps; it does not certify one for hostile public scale. |
| Counted non-JS MatchSets, ladders, or gauntlets by default | Non-JS sandbox, package, compatibility, and product support are not proven. |
| Public language picker implying support parity | Experimental non-JS semantics must not read as production support. |
| Package installation ecosystem for non-JS Strategies | Reproducible lockfiles, supply-chain policy, native modules, and sandbox rules are larger than this milestone. |
| Node `vm` or `vm2` as a security boundary | Node `vm` is not a security mechanism for hostile Strategy code. |
| Kubernetes, service mesh, cloud deployment, or full production observability stack | v1.8 needs repeatable local topology and lightweight monitors, not production infrastructure expansion. |
| Rule, Chronicle, scoring, or game terminology changes | Boundary hardening should preserve deterministic gameplay and existing replay/evidence compatibility. |
| Durable ratings, official public tournaments, custom arenas, monetization, or live model/human control | These do not serve the v1.8 boundary-hardening goal. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| GEN-01 | Phase 51 | Complete |
| GEN-02 | Phase 51 | Complete |
| GEN-03 | Phase 51 | Complete |
| GEN-04 | Phase 51 | Complete |
| GEN-05 | Phase 51 | Complete |
| GEN-06 | Phase 51 | Complete |
| GEN-07 | Phase 51 | Complete |
| GO-01 | Phase 52 | Complete |
| GO-02 | Phase 52 | Complete |
| GO-03 | Phase 52 | Complete |
| GO-04 | Phase 52 | Complete |
| GO-05 | Phase 52 | Complete |
| GO-06 | Phase 52 | Complete |
| SBX-01 | Phase 53 | Complete |
| SBX-02 | Phase 53 | Complete |
| SBX-03 | Phase 53 | Complete |
| SBX-04 | Phase 53 | Complete |
| SBX-05 | Phase 53 | Complete |
| SBX-06 | Phase 53 | Complete |
| NJS-01 | Phase 54 | Complete |
| NJS-02 | Phase 54 | Complete |
| NJS-03 | Phase 54 | Complete |
| NJS-04 | Phase 54 | Complete |
| NJS-05 | Phase 54 | Complete |
| NJS-06 | Phase 54 | Complete |
| TOPO-01 | Phase 55 | Complete |
| TOPO-02 | Phase 55 | Complete |
| TOPO-03 | Phase 55 | Complete |
| TOPO-04 | Phase 55 | Complete |
| TOPO-05 | Phase 55 | Complete |
| TOPO-06 | Phase 55 | Complete |
| MON-01 | Phase 56 | Pending |
| MON-02 | Phase 56 | Pending |
| MON-03 | Phase 56 | Pending |
| MON-04 | Phase 56 | Pending |
| MON-05 | Phase 56 | Pending |
| MON-06 | Phase 56 | Pending |
| MON-07 | Phase 56 | Pending |

**Coverage:**
- v1.8 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-05-22*
*Last updated: 2026-05-22 after Phase 55 completion*
