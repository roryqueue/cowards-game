# Milestones

## v1.22 WASM/WASI Multi-Compiler Alpha and Runtime Hardening (Shipped: 2026-05-25)

**Status:** Shipped 2026-05-25
**Phases:** 8
**Phase range:** 148-155
**Plans:** 8/8 complete
**Discussion Context:** `.planning/milestones/v1.22-DISCUSSION-LOG.md`
**Requirements:** 16/16 complete
**Research:** `.planning/research/v1.22-SUMMARY.md`
**Roadmap:** `.planning/milestones/v1.22-ROADMAP.md`
**Decision baseline:** Zig is non-counted exhibition alpha only after compile/artifact/runtime/ABI proof; Rust remains non-counted alpha; WASM/WASI remains candidate-readiness evidence only.
**Audit:** `.planning/milestones/v1.22-MILESTONE-AUDIT.md`
**Archives:** `.planning/milestones/v1.22-ROADMAP.md`, `.planning/milestones/v1.22-REQUIREMENTS.md`, `.planning/milestones/v1.22-phases/`

**Goal:** Make WASM/WASI a more serious multi-compiler Strategy runtime platform by combining Zig artifact alpha proof, runtime hardening evidence, and ABI evolution research without overclaiming promotion or sandbox certification.

**Delivered:**

- Zig is detected through PATH-aware preflight and compiles a no-std `wasm32-wasi` Strategy to immutable WASM artifact metadata.
- Zig executes through runtime-service / Runtime Broker / Wasmtime using the existing Preview 1 stdin/stdout JSON envelope.
- Workshop and account save paths route Zig validation through runtime-service and label Zig as non-counted exhibition alpha only.
- Artifact validation is language-aware: Rust uses `wasm32-wasip1`; Zig uses `wasm32-wasi`.
- WASM/WASI hardening evidence passes 19/19 probes.
- ABI evolution decision keeps Preview 1 stdin/stdout JSON as the only v1.22 execution path and defers direct exports/component model/WIT.
- Promotion decision keeps JS/TS counted, Python beta, Rust alpha, Zig alpha, and no production sandbox certification.

### Active Constraints

- Rust, Zig, and WASM/WASI are not ranked, ladder, counted, gauntlet, broad production multi-language support, or production sandbox certification.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Strategy code does not execute in web/API/Go.
- Zig no-std alpha is intentionally narrow until a future milestone proves safer ergonomic bindings.

## v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha (Shipped: 2026-05-25)

**Status:** Shipped 2026-05-25
**Phases:** 8
**Phase range:** 140-147
**Plans:** 8/8 complete
**Discussion Context:** Phases 140-147 ready for planning and execution
**Requirements:** 59/59 complete
**Research:** .planning/research/v1.21-SUMMARY.md
**Roadmap:** .planning/milestones/v1.21-ROADMAP.md
**Decision baseline:** Rust/WASM is non-counted exhibition alpha only; WASM/WASI is runtime-candidate evidence only; Zig is fail-loud unavailable unless future readiness proof passes.
**Audit:** .planning/milestones/v1.21-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.21-ROADMAP.md, .planning/milestones/v1.21-REQUIREMENTS.md, .planning/milestones/v1.21-phases/

**Goal:** Make WASM/WASI the next serious immutable multi-language Strategy runtime candidate, prove Rust end to end through non-counted exhibitions, and keep promotion claims conservative.

**Target features:**

- Add a WASI Preview 1 stdin/stdout JSON ABI lane behind the existing Strategy Execution Service / Runtime Broker.
- Compile Rust Strategy source in runtime-service validation into immutable WASM artifact metadata and bytes.
- Execute Rust Strategy Revisions through Wasmtime from runtime-service, not from web/API/Go.
- Add Rust Workshop/account/exhibition/result/replay labels and safe starter samples.
- Probe WASM/WASI hostile capabilities, determinism risks, output caps, artifact integrity, privacy, and no-fallback behavior.
- Treat Zig as a fail-loud stretch target and avoid exposing it as working when readiness evidence is unavailable.
- Run a two-cycle signed-in proof covering JS/TS-vs-Rust and Rust-vs-Rust non-counted exhibitions.

### Delivered

- Rust can be saved as non-counted exhibition alpha through runtime-service compile/validation, with immutable WASM artifact metadata on the Strategy Revision.
- Match execution uses the artifact-backed WASM/WASI runtime lane through Wasmtime and the broker/runtime-service boundary.
- Public result and replay pages show Rust/WASM evidence without exposing source, memory, objectives, raw diagnostics, host paths, env, tokens, DB DSNs, or private runtime internals.
- WASM/WASI hostile probes pass 15/15; Zig readiness records fail-loud unavailable.
- Signed-in proof completed two bounded cycles and four MatchSets: JS/TS-vs-Rust and Rust-vs-Rust in each cycle.
- JS/TS remains the counted Strategy path; Python remains non-counted exhibition beta.

### Active Constraints

- Rust, Zig, and WASM/WASI are not ranked, ladder, counted, gauntlet, broad production multi-language support, or production sandbox certification.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Strategy code does not execute in web/API/Go.
- Rust/Zig do not become backend owners, persistence owners, or silent fallback paths.
- No arbitrary Cargo or Zig package install support is exposed as a product feature.

## v1.20 Runtime Sandbox Candidate and Exhibition Reliability Proof (Shipped: 2026-05-25)

**Status:** Shipped 2026-05-25
**Phases:** 8
**Phase range:** 132-139
**Plans:** 8/8 complete
**Discussion Context:** Phases 132-139 ready for planning
**Requirements:** 50/50 complete
**Research:** .planning/research/v1.20-SUMMARY.md
**Roadmap:** .planning/milestones/v1.20-ROADMAP.md
**Decision baseline:** Docker/container subprocess is the primary executable stronger runtime candidate lane; gVisor/runsc remains fail-loud unless genuinely available and executable.
**Audit:** .planning/milestones/v1.20-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.20-ROADMAP.md, .planning/milestones/v1.20-REQUIREMENTS.md, .planning/milestones/v1.20-phases/

**Goal:** Make one stronger runtime isolation candidate executable and honestly testable while improving Python non-counted exhibition beta reliability, latency, timeout behavior, degraded-state UX, and signed-in proof evidence.

**Target features:**

- Preserve v1.19's topology, ownership, privacy, Python non-counted exhibition beta status, and runtime-isolation-readiness-only claim.
- Implement executable Docker/container subprocess candidate evidence with hostile probes, no-fallback drills, resource/IPC evidence, and public-safe diagnostics.
- Keep gVisor/runsc strict evidence lanes fail-loud when `runsc` is unavailable or no adapter executes probes.
- Define separate timeout budgets for Strategy call, Match execution, MatchSet/job orchestration, runtime-service HTTP, and browser proof.
- Measure mixed JS/TS-vs-Python and Python-vs-Python exhibition latency with bounded repeated local proof.
- Stabilize Python exhibition reliability where practical while preserving deterministic per-Strategy caps and schema validation.
- Improve slow/running/degraded/timeout/failed UX and public-safe evidence.
- Run a realistic signed-in proof with one JS/TS revision, two Python revisions, mixed and Python-vs-Python exhibitions, result/replay evidence, private-data safety, no-fallback checks, candidate lane evidence, and JS/TS regression safety.

### Delivered

- Docker/container subprocess strict evidence passed locally with the `node:24-alpine` container lane.
- Hostile probes and no-fallback drills cover subprocess plus container candidate evidence where practical.
- Runtime reliability budgets are documented and monitored without loosening deterministic per-Strategy caps.
- Public MatchSet/replay evidence explains running, slow, degraded, timeout, strategy-failed, and system-failed states with privacy-safe copy.
- Signed-in proof completed three bounded cycles with one JS/TS and two Python revisions per cycle, mixed JS/TS-vs-Python and Python-vs-Python exhibitions, result/replay evidence, and private-marker scans.
- Go job lease now aligns with the runtime-service HTTP timeout plus grace, fixing a proof-discovered Python-vs-Python reliability issue.
- Python remains non-counted exhibition beta only; runtime isolation remains readiness evidence only.

### Active Constraints

- Python remains runtime-only, non-ranked, non-counted, and ineligible for ladder/ranked/counted play.
- No arbitrary package installs or PyPI support.
- No production sandbox claim from Docker/container evidence unless the proof genuinely supports it.
- No Strategy execution in web/API/Go and no silent fallback when runtime-service, Python runtime, Docker/container, or strict candidates are unavailable.
- Public outputs omit private Strategy data, private runtime diagnostics, host/package paths, DB/session/token details, and private runtime internals by default.

## v1.19 Runtime Isolation Readiness and Exhibition Beta Trust (Shipped: 2026-05-25)

**Status:** Shipped 2026-05-25
**Phases:** 8
**Phase range:** 124-131
**Plans:** 8/8 complete
**Requirements:** 48/48 complete
**Audit:** .planning/milestones/v1.19-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.19-ROADMAP.md, .planning/milestones/v1.19-REQUIREMENTS.md, .planning/milestones/v1.19-phases/
**Decision:** `keep-python-non-counted-exhibition-beta-runtime-isolation-readiness-only`

**Key accomplishments:**

- Promoted runtime isolation evidence into explicit readiness lanes with deterministic subprocess evidence and fail-loud container/runsc strict commands.
- Expanded hostile probe coverage into one taxonomy spanning filesystem, host paths, network, process/shell, imports/packages, environment, output/memory pressure, timeout, crash, malformed IPC, redaction, schema-invalid output, and no-fallback drills.
- Added monitor gates for readiness artifact drift, production overclaiming, unsupported candidate mislabeling, source-boundary drift, public privacy leaks, and JS/TS regression safety.
- Improved Python exhibition beta trust with compact persistent labels, safer validation copy, three credible safe Python samples, and public-safe MatchSet/replay Evidence panels.
- Ran a signed-in proof that created one JS/TS and two Python revisions, completed mixed JS/TS-vs-Python and Python-vs-Python non-counted exhibitions, and opened result/replay evidence through the live Go/runtime-service path.
- Fixed proof-discovered gaps in runtime-service HTTP timeout budgeting and public privacy wording.

### Delivered

- JS/TS Strategy support remains intact through the existing broker/runtime ABI.
- Python remains non-counted exhibition beta only.
- Runtime isolation remains readiness evidence only, not production sandbox certification.
- Public proof outputs are private-data safe and avoid internal private-field names.
- Docker/container and gVisor/runsc-style evidence lanes fail loudly when required evidence is unavailable or unimplemented.

### Completed Phases

| Phase | Name |
| --- | --- |
| 124 | Isolation Readiness Baseline and Candidate Contract - Complete |
| 125 | Hostile Probe Matrix Expansion - Complete |
| 126 | Candidate Execution Evidence - Complete |
| 127 | Runtime Evidence Monitors and Drift Gates - Complete |
| 128 | Python Exhibition Beta UX Trust - Complete |
| 129 | MatchSet Result and Replay Trust Cues - Complete |
| 130 | Signed-In End-to-End Proof and JS/TS Regression Gate - Complete |
| 131 | Promotion Decision and Archive Gate - Complete |

### Active Constraints

- Python remains runtime-only, non-ranked, non-counted, and ineligible for ladder/ranked/counted play.
- No arbitrary package installs or PyPI support.
- No production sandbox claim from v1.19 evidence.
- No Strategy execution in web/API/Go and no silent fallback when runtime-service, Python runtime, or strict candidates are unavailable.
- Public outputs omit private Strategy data, private runtime diagnostics, host/package paths, DB/session/token details, and internal runtime fields by default.

## v1.18 Runtime Isolation and Multi-Language Exhibition Beta (Shipped: 2026-05-25)

**Status:** Shipped 2026-05-25
**Phases:** 7
**Phase range:** 117-123
**Plans:** 7/7 complete
**Requirements:** 40/40 complete
**Audit:** .planning/milestones/v1.18-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.18-ROADMAP.md, .planning/milestones/v1.18-REQUIREMENTS.md, .planning/milestones/v1.18-phases/
**Decision:** `promote-python-non-counted-exhibition-beta`

**Key accomplishments:**

- Established v1.17 as the broker/runtime floor and documented an exhibition-beta hostile Strategy threat model.
- Hardened Python subprocess launch and failure behavior with isolated-mode host launch, empty environment, no shell, deterministic caps, timeout, malformed IPC, crash, and cleanup classification.
- Replaced heuristic Python validation with a Python AST/compile host and public-safe diagnostics.
- Made Python saveable as account-owned immutable Strategy Revisions with runtime metadata and non-counted exhibition beta eligibility.
- Added a signed-in local proof that saves JS/TS and Python revisions, creates a non-counted exhibition, executes through Go -> runtime-service -> runtime implementation, and opens replay evidence.
- Extended boundary monitors and proof artifacts for v1.18 baseline, runtime isolation sources, signed-in proof evidence, ownership boundaries, privacy, no-fallback behavior, and JS/TS regression safety.

### Delivered

- JS/TS Strategy support remains intact through the existing broker/runtime ABI.
- Python is promoted only to non-counted exhibition beta.
- Runtime isolation evidence is stronger and monitored, but remains readiness evidence rather than production sandbox certification.
- Public proof outputs are private-data safe and the final proof MatchSet completed with zero runtime violations.

### Completed Phases

| Phase | Name |
| --- | --- |
| 117 | Isolation Baseline and Threat Model - Complete |
| 118 | Runtime Resource and Process Hardening - Complete |
| 119 | Python Validation and Public-Safe Diagnostics - Complete |
| 120 | Exhibition Beta Revision and Eligibility Model - Complete |
| 121 | Signed-In Multi-Language Exhibition Proof - Complete |
| 122 | Topology, Monitors, Hostile Probes, and Privacy Gate - Complete |
| 123 | Final Evidence, Promotion Decision, and Archive Gate - Complete |

### Active Constraints

- Python remains runtime-only, non-ranked, non-counted, and ineligible for ladder/ranked/counted play.
- No arbitrary package installs or PyPI support.
- No production sandbox claim from v1.18 evidence.
- No Strategy execution in web/API/Go and no silent fallback when runtime-service or Python runtime is stopped.
- Public outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, package paths, and private runtime internals by default.

## v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening (Shipped: 2026-05-24)

**Status:** Shipped 2026-05-24
**Phases:** 7
**Phase range:** 110-116
**Plans:** 7/7 complete
**Requirements:** 52/52 complete
**Audit:** .planning/milestones/v1.17-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.17-ROADMAP.md, .planning/milestones/v1.17-REQUIREMENTS.md, .planning/milestones/v1.17-phases/
**Decision:** `promote-python-experimental-runtime-path-only`

**Key accomplishments:**

- Added a concrete Runtime Broker registry contract covering JS/TS runtime targets and the experimental Python runtime target.
- Added Python Strategy Revision metadata, validation, immutable revision construction, Workshop source-format selection, and public-safe diagnostics.
- Added Python subprocess runtime execution behind the runtime-service ABI with schema-validated envelopes and engine-compatible synchronous runtime integration.
- Kept Go as Match orchestrator and Python as non-counted runtime implementation only.
- Added a Python tactical starter proof through Workshop and runtime-service Match execution evidence.
- Extended boundary monitors and public-output privacy checks for runtime registry drift, Python execution outside the runtime boundary, Python privacy markers, and premature counted eligibility.

### Delivered

- JS/TS Strategy support remains intact through the existing isolated runtime service.
- Python can be represented, validated, submitted, and executed as an experimental Strategy language behind the same broker/ABI contract.
- Python is not a backend, persistence owner, route owner, job lifecycle owner, Match completion owner, scoring owner, public evidence owner, or silent fallback path.
- Python remains non-counted and out of ranked/ladder play.

### Completed Phases

| Phase | Name |
| --- | --- |
| 110 | Broker Registry Baseline and Contract Hardening - Complete |
| 111 | Strategy Artifact Language Metadata and Eligibility - Complete |
| 112 | Python Submission Validation and Diagnostics - Complete |
| 113 | Python Runtime Execution Behind Broker ABI - Complete |
| 114 | Go Orchestration and Non-Counted Eligibility - Complete |
| 115 | Python Starter Strategy and Replay Proof - Complete |
| 116 | Topology, Monitors, Privacy, and Promotion Gate - Complete |

### Active Constraints

- Normal topology remains `web frontend -> Go backend -> isolated runtime service(s)`.
- Strategy code does not execute in web/API/Go processes.
- Python is experimental and non-counted until a future production sandbox/package/determinism/privacy promotion milestone.
- Public outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, stack, stderr, host paths, package paths, tokens, DB DSNs, and private runtime internals by default.

## v1.16 Runtime Isolation and TypeScript Backend Retirement (Shipped: 2026-05-24)

**Status:** Shipped 2026-05-24
**Phases:** 7
**Phase range:** 103-109
**Plans:** 7/7 complete
**Requirements:** 48/48 complete
**Audit:** .planning/milestones/v1.16-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.16-ROADMAP.md, .planning/milestones/v1.16-REQUIREMENTS.md, .planning/milestones/v1.16-phases/
**Decision:** `promote-no-typescript-backend-except-frontend-and-isolated-js-ts-runtime-service`

**Key accomplishments:**

- Established the v1.16 TypeScript backend retirement taxonomy across 185 TypeScript backend-like surfaces.
- Defined the broker-ready Strategy Execution Service / Runtime Broker contract while preserving JS/TS Strategy support only inside the isolated runtime service boundary.
- Cut selected account/session, fork, exhibition, public read, and public replay evidence routes to Go-owned contracts with no TypeScript backend fallback.
- Quarantined TypeScript worker and persistence lifecycle code so it cannot claim or complete normal backend work outside rollback/test/parity purposes.
- Added final TypeScript surface labels and monitor enforcement for deferred Workshop, ladder, governance, owner-debug, fixture, rollback, parity, frontend, and runtime-only surfaces.
- Added strict no-TypeScript-backend topology, live boundary monitor, route/runtime/privacy drift, public-output, and representative page-smoke gates.

### Delivered

- Normal product topology is now `web frontend -> Go backend -> isolated JS/TS Strategy runtime service`.
- TypeScript is not a normal backend owner for orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring completion, public evidence delivery, or silent fallback.
- Every future language runtime is expected to implement the same JSON/runtime ABI and schema-validated envelopes.
- Strategy Revision submission performs compile, validation, or artifact packaging where practical; Matches execute immutable artifacts.
- WASM/WASI/component-model are documented as strong long-term candidates for some languages, not v1.16 promotions; Node `node:wasi` is not treated as an untrusted-code sandbox.

### Completed Phases

| Phase | Name |
| --- | --- |
| 103 | TypeScript Backend Inventory and Retirement Contract - Complete |
| 104 | Isolated Runtime Service Boundary Hardening - Complete |
| 105 | Web/API Go-Only Cutover and Fallback Removal - Complete |
| 106 | TypeScript Worker and Persistence Quarantine - Complete |
| 107 | Deferred Surface Relabeling and Privacy Preservation - Complete |
| 108 | No-TypeScript-Backend Topology and Monitor Gate - Complete |
| 109 | Milestone Verification, Deletion Audit, and Promotion Decision - Complete |

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in web/API/Go processes, and Node `vm` is not used as a hostile-code security boundary.
- JS/TS Strategy execution remains supported only through the isolated runtime service and public runtime ABI.
- Public outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.
- `pnpm boundary:monitors` must remain synchronized with route manifests, topology artifacts, runtime contracts, final TypeScript surface labels, and fixture gates.

### Known Deferred Items

- True language-neutral Runtime Broker replacement and production hostile-code sandbox promotion remain future milestones.
- Workshop migration, broader ladder/governance migration, full owner-debug replay migration, counted non-JS play, and Go-owned migrations/schema remain deferred.

## v1.15 Go Backend Ownership Completion (Shipped: 2026-05-24)

**Status:** Shipped 2026-05-24
**Phases:** 7
**Phase range:** 96-102
**Plans:** 7/7 complete
**Requirements:** 48/48 complete
**Audit:** .planning/milestones/v1.15-MILESTONE-AUDIT.md
**Archives:** .planning/milestones/v1.15-ROADMAP.md, .planning/milestones/v1.15-REQUIREMENTS.md, .planning/milestones/v1.15-phases/
**Decision:** `promote-go-backend-ownership-completion`

**Key accomplishments:**

- Established the v1.15 ownership baseline and lifecycle manifest separating Go-owned, TypeScript runtime-only, parity-only, rollback-only, test-only, and deferred surfaces.
- Added Go-owned job lifecycle contracts for claim, lease, heartbeat, retry, failure, diagnostics redaction, and rollback/no-fallback behavior.
- Added the TypeScript runtime execution service boundary and Go client so Go orchestrates Matches only through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`.
- Added Go-owned Match completion, Chronicle persistence handoff, idempotent completion, and MatchSet scoring/status refresh with parity and failure classification tests.
- Cut selected public evidence and normal public web reads to Go-owned contracts while preserving public replay/privacy guarantees and leaving owner-debug/workshop/runtime-heavy surfaces deferred.
- Added strict topology, boundary monitor, rollback, failure-drill, browser replay realism, representative page-smoke, and Docker/OrbStack evidence gates.

### Delivered

- Go is now the normal backend owner for orchestration, persistence-facing Match lifecycle, Chronicle persistence, MatchSet scoring completion, and selected public evidence delivery.
- TypeScript remains frontend, parity oracle, rollback/test reference, and the isolated JS/TS Strategy runtime worker/service.
- Normal v1.15 topology proves `web frontend -> Go backend -> TypeScript runtime service -> Go persistence/public evidence` without silent TypeScript backend fallback.
- Boundary monitors and topology checks fail on unexpected TypeScript backend ownership creep, unsafe fallback, route/schema/runtime ABI drift, privacy drift, report-only drift, public-output leaks, and representative page-load failures.

### Completed Phases

| Phase | Name |
| --- | --- |
| 96 | Boundary Baseline and Go Ownership Contract - Complete |
| 97 | Go Job Lifecycle and Persistence Contracts - Complete |
| 98 | Runtime Execution Service Boundary - Complete |
| 99 | Go Match Completion and Chronicle Persistence - Complete |
| 100 | Go MatchSet Scoring and Failure Classification - Complete |
| 101 | Public Evidence Delivery and Web Cutover - Complete |
| 102 | Topology, Monitors, Rollback, and Promotion Gate - Complete |

### Active Constraints

- Engine logic remains pure, deterministic, serializable, and side-effect free.
- Strategy code does not execute in the web/API process or Go backend, and Node `vm` is not used as a hostile-code security boundary.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- TypeScript runtime worker/service remains the hostile Strategy execution owner unless a later milestone explicitly promotes another boundary.
- Public replay, service, Go, topology, monitor, analytics, export, and runtime outputs omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

### Known Deferred Items

- Production sandbox replacement and final TypeScript runtime retirement remain v1.16+ scope.
- Full owner-debug replay projection, Workshop runtime/test/rerun/profile/export migration, broader ladder/governance migration, and Go-owned migrations/schema remain deferred.
- 29 broad web report-only direct persistence offenses remain visible baseline debt for future service/backend ownership milestones.

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
