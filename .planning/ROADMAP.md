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
- [ ] **v1.8 Production Boundary Hardening** - Phases 51-56, planned.

## Current Milestone: v1.8 Production Boundary Hardening

**Status:** Planned
**Phases:** 51-56
**Granularity:** Standard
**Requirements:** 38/38 mapped

## Overview

v1.8 turns the v1.7 service, runtime, and backend contracts into harder operating boundaries without moving orchestration ownership, rewriting the backend, or promoting production multi-language runtime support. The milestone generates and checks service contracts, proves Go read-only parity against real evidence, evaluates sandbox options without changing counted play, defines non-JS product semantics as experimental, makes local cross-process topology repeatable, and composes boundary drift monitors that fail before private data or bypasses ship.

## Phases

- [x] **Phase 51: Service Contract Generation and Route Migration** - Developers can regenerate service artifacts and route selected low-risk web reads through the typed service layer.
- [x] **Phase 52: Go Read-Only Backend Parity Against Real Fixtures** - Developers can run the Go read-only service against real evidence and prove parity with TypeScript service DTOs.
- [x] **Phase 53: Runtime Sandbox Hardening Prototype** - Developers can evaluate sandbox candidates through the runtime ABI without changing counted Match defaults.
- [ ] **Phase 54: Non-JS Strategy Product Semantics** - Users and developers see clear experimental language semantics, validation messages, and fail-closed counted-play eligibility.
- [ ] **Phase 55: Cross-Process Local Deployment Harness** - Developers can run and diagnose the local web, service, runtime, Go, and fixture topology as separate boundaries.
- [ ] **Phase 56: Observability, Privacy, and Boundary Drift Monitors** - Boundary, privacy, parity, and compatibility checks fail on drift or bypasses before milestone release.

## Phase Details

### Phase 51: Service Contract Generation and Route Migration
**Goal**: Developers can regenerate stable service contract artifacts from canonical schemas and selected web/API routes use the typed service boundary without changing public behavior.
**Depends on**: Phase 50
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, GEN-06, GEN-07
**Success Criteria** (what must be TRUE):
  1. Developer can regenerate a deterministic v1.8 service contract artifact from canonical `@cowards/spec` route and DTO schemas.
  2. Generated or generation-ready artifacts expose stable route metadata, auth scopes, privacy classes, schemas, errors, examples, and fixture references for the v1.8 route surface.
  3. Public, owner-authorized, and internal DTO schemas remain separated so public contract output excludes private persistence and runtime records by default.
  4. A named low-risk set of Next route handlers or server loaders uses `@cowards/service` while preserving existing DTO behavior, ordering, compatibility fields, errors, and privacy redaction.
  5. Contract linting, stale-output checks, and import-boundary checks fail on schema drift or direct migrated-route imports of persistence, migrations, workers, runtime adapters, or Strategy execution modules.
**Plans**: 3 plans
Plans:
- [x] 51-01-PLAN.md — Generate canonical v1.8 service contract metadata, schemas, fixtures, OpenAPI artifact, and lint/stale checks.
- [x] 51-02-PLAN.md — Migrate the named public read slice through `@cowards/service` while preserving public behavior and privacy.
- [x] 51-03-PLAN.md — Enforce strict named-slice import guards and report-only broad app boundary scanning.

### Phase 52: Go Read-Only Backend Parity Against Real Fixtures
**Goal**: Developers can run the Go read-only service against real golden fixtures or safe local data and prove it matches the TypeScript service for its allowlisted read surface.
**Depends on**: Phase 51
**Requirements**: GO-01, GO-02, GO-03, GO-04, GO-05, GO-06
**Success Criteria** (what must be TRUE):
  1. Developer can run the Go read-only service against real golden fixtures or safe local persisted data instead of only static examples.
  2. Go endpoints cover health, public MatchSet summary, replay metadata, and one selected analytics summary.
  3. Go and TypeScript service outputs match as parsed canonical DTOs for status, deterministic ordering, compatibility/version fields, privacy redaction, and public error shapes.
  4. Go route inventory is explicitly allowlisted and read-only, with tests failing on mutation verbs or unsupported ownership expansion.
  5. Go documentation and fixtures prove TypeScript still owns auth mutation, Strategy submission/source retrieval, MatchSet creation, orchestration, jobs, migrations, writes, Strategy execution, and degraded/system-failed public privacy behavior.
**Plans**: 1 plan
Plans:
- [x] 52-01-PLAN.md — Generate TypeScript-service-backed Go parity fixtures, add owner-scoped analytics summary parity, and harden Go read-only fixture serving.

### Phase 53: Runtime Sandbox Hardening Prototype
**Goal**: Developers can evaluate practical hostile Strategy sandbox candidates through the existing Strategy runtime ABI while counted Match execution defaults remain unchanged.
**Depends on**: Phase 52
**Requirements**: SBX-01, SBX-02, SBX-03, SBX-04, SBX-05, SBX-06
**Success Criteria** (what must be TRUE):
  1. Developer can run a sandbox evaluation harness through the existing Strategy runtime ABI without changing counted Match execution defaults.
  2. The evaluation compares feasible candidates such as worker baseline, host subprocess, container subprocess, WASM/WASI, Deno-style permissions, gVisor, and microVM-style isolation.
  3. Hostile fixture probes cover forbidden time, randomness, filesystem, network, environment, shell/process access, dynamic code execution, malformed IPC, oversized output, caps, limits, timeouts, and crashes.
  4. Sandbox results preserve the existing failure taxonomy by distinguishing Strategy runtime violations from system failures with public-safe messages.
  5. The evaluation records containment gaps, deterministic-execution risk, resource-limit behavior, startup and developer ergonomics, adapter metadata implications, unresolved production risks, and an explicit no-promotion decision for v1.8.
**Plans**: 1 plan
Plans:
- [x] 53-01-PLAN.md — Add an evaluation-only sandbox candidate matrix, hostile probe harness, deterministic report artifact, and no-promotion drift guards.

### Phase 54: Non-JS Strategy Product Semantics
**Goal**: Users and developers can understand non-JS Strategy language metadata, validation outcomes, and eligibility limits while JS/TS behavior remains unchanged.
**Depends on**: Phase 53
**Requirements**: NJS-01, NJS-02, NJS-03, NJS-04, NJS-05, NJS-06
**Success Criteria** (what must be TRUE):
  1. Developer can inspect Strategy language and runtime registry metadata for language id/version, ABI version, adapter id/version, readiness, isolation notes, limits, source/package policy, and counted-play eligibility.
  2. User-facing Strategy surfaces expose experimental labels, compatibility warnings, validation codes, docs/examples hooks, and clear non-counted eligibility wording for non-JS runtimes.
  3. Validation reports stable reasons for unsupported language, unsupported package metadata, incompatible adapter, ABI mismatch, source size limit, memory limit, timeout, forbidden capability, and non-counted eligibility.
  4. Counted MatchSet, ladder, and gauntlet eligibility checks fail closed for experimental non-JS adapters with stable user-facing reasons.
  5. Existing JS/TS Strategy Revision behavior, metadata normalization, Workshop save/test flow, and counted-play eligibility remain unchanged, and Python or other non-JS runtimes remain experimental until a future promotion gate proves otherwise.
**Plans**: TBD
**UI hint**: yes

### Phase 55: Cross-Process Local Deployment Harness
**Goal**: Developers can run a repeatable local boundary topology for web, TypeScript service, worker/runtime adapter, Go read-only service, and fixtures with privacy-safe diagnostics.
**Depends on**: Phase 54
**Requirements**: TOPO-01, TOPO-02, TOPO-03, TOPO-04, TOPO-05, TOPO-06
**Success Criteria** (what must be TRUE):
  1. Developer can run a repeatable local boundary topology for the web app, TypeScript service path, worker/runtime adapter, Go read-only backend, and fixture loading.
  2. Local topology health checks identify each component, process/base URL, contract version, fixture id, endpoint, and readiness state.
  3. Smoke requests cover web service health, TypeScript service DTOs, Go health, Go public MatchSet summary, Go replay metadata, selected analytics summary, and runtime adapter diagnostics.
  4. The topology fails loudly when a required boundary process is unavailable instead of silently falling back to in-process or stale fixture behavior.
  5. Local diagnostics and setup documentation are privacy-safe while listing required commands, ports, environment variables, fixture-loading steps, smoke checks, and common failure diagnostics.
**Plans**: TBD

### Phase 56: Observability, Privacy, and Boundary Drift Monitors
**Goal**: Developers can rely on local or CI checks to catch contract drift, private DTO leaks, runtime/web bypasses, persistence import regressions, adapter drift, Go parity drift, and v1.8 regressions.
**Depends on**: Phase 55
**Requirements**: MON-01, MON-02, MON-03, MON-04, MON-05, MON-06, MON-07
**Success Criteria** (what must be TRUE):
  1. Boundary checks fail on service contract drift, stale generated artifacts, or route schema mismatches.
  2. Public DTO leak scanners fail if service, replay, MatchSet, ladder, analytics, export, Go, topology, or diagnostic outputs expose private Strategy/runtime fields by default.
  3. Web/API boundary monitors fail on direct Strategy runtime execution, runtime worker imports, or direct persistence-root imports outside approved service implementation modules.
  4. Adapter compatibility and Go/TypeScript parity drift checks compare registry metadata, ABI details, limits, readiness, counted-play eligibility, and every v1.8 Go read-only endpoint against executable behavior.
  5. v1.8 verification proves existing JS/TS Workshop, immutable Strategy Revision, exhibition/trial evidence, replay viewer, saved gauntlet analytics, golden parity, and public privacy behavior remain unchanged.
**Plans**: TBD

## Progress

**Execution Order:** Phase 51 -> Phase 52 -> Phase 53 -> Phase 54 -> Phase 55 -> Phase 56

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 51. Service Contract Generation and Route Migration | 3/3 | Complete | 2026-05-22 |
| 52. Go Read-Only Backend Parity Against Real Fixtures | 1/1 | Complete | 2026-05-22 |
| 53. Runtime Sandbox Hardening Prototype | 1/1 | Complete | 2026-05-22 |
| 54. Non-JS Strategy Product Semantics | 0/TBD | Not started | - |
| 55. Cross-Process Local Deployment Harness | 0/TBD | Not started | - |
| 56. Observability, Privacy, and Boundary Drift Monitors | 0/TBD | Not started | - |

## Requirement Coverage

| Requirement Group | Phase | Count |
| --- | --- | ---: |
| GEN-01 through GEN-07 | Phase 51 | 7 |
| GO-01 through GO-06 | Phase 52 | 6 |
| SBX-01 through SBX-06 | Phase 53 | 6 |
| NJS-01 through NJS-06 | Phase 54 | 6 |
| TOPO-01 through TOPO-06 | Phase 55 | 6 |
| MON-01 through MON-07 | Phase 56 | 7 |

**Coverage:** 38/38 requirements mapped.

## Next Up

**Phase 54: Non-JS Strategy Product Semantics** - Define experimental language semantics, validation messages, compatibility warnings, and fail-closed counted-play eligibility.

Recommended next command:

`$gsd-discuss-phase 54`

## Recent Shipped Scope

<details>
<summary>v1.7 Runtime and Backend Boundary Stabilization (Phases 45-50) - SHIPPED 2026-05-22</summary>

- [x] Phase 45: Service Boundary Contract - `service-api-v1.7`, typed `@cowards/service`, public DTO leak checks, and web MatchSet result reads behind the service layer.
- [x] Phase 46: Strategy Runtime ABI - `strategy-runtime-abi-v1.7` JSON envelopes for Strategy execution, metadata, limits, runtime violations, and system failures.
- [x] Phase 47: Golden Parity Harness - deterministic fixtures covering engine, Chronicle, replay, public DTOs, privacy, runtime failures, and ordering.
- [x] Phase 48: Runtime Adapter Registry - first-class Strategy language/adapter metadata, compatibility keys, legacy normalization, and counted-play eligibility checks.
- [x] Phase 49: One Non-JS Runtime Spike - experimental Python subprocess adapter through the same ABI, disabled for counted play.
- [x] Phase 50: Go Backend Spike - minimal read-only Go service with health, public MatchSet summary, and replay metadata DTO envelopes.

</details>

---
*Roadmap created: 2026-05-22 for v1.8 Production Boundary Hardening*
*Last updated: 2026-05-22 after Phase 53 completion*
