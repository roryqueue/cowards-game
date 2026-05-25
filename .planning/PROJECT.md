# Coward's Game

## Current State

**Shipped version:** v1.22 WASM/WASI Multi-Compiler Alpha and Runtime Hardening on 2026-05-25
**Current milestone:** None active. v1.22 archived; next milestone requirements should be created fresh.
**Status:** v1.22 complete and ready for the next milestone.
**Last audit:** v1.22 audit passed with Zig exposed only as non-counted exhibition alpha after compile/runtime/ABI proof and WASM/WASI kept as runtime-candidate hardening evidence only.

Coward's Game is a deterministic two-player programmable strategy game for the web. Players can author immutable JS/TS Strategy Revisions, save account-owned revisions, fork credible Starter and Advanced Strategies, enter exhibitions or resettable trial ladder seasons, inspect fair standings and replay evidence, study saved gauntlet analytics, and trust that public outputs do not expose private Strategy data. The project now has generated TypeScript service contracts, selected service-backed public/player/account/ladder/workshop analytics reads, live PostgreSQL-backed Go ownership for normal backend orchestration and selected API routes, artifact-backed Go Starter/Advanced forks, runtime isolation readiness gates, Python non-counted exhibition beta semantics, an executable Docker/container runtime candidate lane, executable Rust and Zig WASM/WASI runtime-candidate lanes for non-counted exhibition alpha, repeatable local topology diagnostics, and boundary drift monitors. Go owns normal job lifecycle, Match completion, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence while hostile Strategy execution remains behind the Strategy Execution Service / Runtime Broker boundary. WASM/WASI is now a more serious immutable multi-compiler runtime candidate, but not production sandbox certification or counted/ranked support.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Latest Shipped Milestone: v1.22 WASM/WASI Multi-Compiler Alpha and Runtime Hardening

**Goal:** Make WASM/WASI a more serious multi-compiler Strategy runtime platform by combining Zig artifact alpha proof, runtime hardening evidence, and ABI evolution research while keeping all promotion claims conservative.

**Target features:**
- Treat v1.21 as the baseline and preserve Rust WASM execution, JS/TS counted Strategy support, Python non-counted exhibition beta, Go/runtime-service ownership boundaries, public replay privacy, and no silent fallback.
- Fix Zig preflight/toolchain detection, prove `wasm32-wasi` compile into immutable artifact metadata, and execute Zig only through runtime-service / Runtime Broker / Wasmtime.
- Expose safe no-std Zig Workshop samples and non-counted alpha labels only after compile, artifact, runtime, and ABI proof pass.
- Harden WASM/WASI evidence for timeout/fuel, memory caps, stdio/result caps, malformed JSON, invalid schema, trap/panic/abort, hash mismatch, missing/stale artifacts, forbidden capabilities, no inherited env/preopens/network, and public-safe diagnostics.
- Document artifact retention, hash verification, rollback, and compatibility metadata.
- Compare Preview 1 stdin/stdout JSON, direct exports, and component model/WIT; keep JSON stdin/stdout as the only v1.22 execution ABI.
- Close with explicit promotion decisions: no Rust/Zig/WASM counted, ranked, ladder, gauntlet, broad production multi-language, or production sandbox promotion.

**Implemented:** v1.22 fixes Zig detection, adds no-std Zig `wasm32-wasi` compile/validation into immutable WASM artifact metadata, executes Zig artifacts through Wasmtime behind runtime-service, adds Zig Workshop/account validation/save support and labels, strengthens language-aware artifact validation, emits 19/19 WASM/WASI hardening probes, writes ABI and promotion decision records, and keeps JS/TS counted while Python remains exhibition beta and Rust/Zig remain non-counted exhibition alpha only.

## Previous Shipped Milestone: v1.21 WASM/WASI Multi-Language Runtime Candidate and Rust Exhibition Alpha

**Goal:** Make WASM/WASI the next serious multi-language Strategy runtime candidate by proving an immutable Rust WASM artifact path end to end for non-counted exhibition alpha, while keeping JS/TS counted support and all runtime boundaries intact.

**Target features:**
- Treat v1.20 as the baseline: Docker/container candidate evidence is executable readiness evidence, Python remains non-counted exhibition beta, JS/TS remains the counted Strategy path, and Go owns orchestration, persistence-facing behavior, Match lifecycle, scoring, retry policy, public evidence, and promotion decisions.
- Define a WASM/WASI runtime lane behind the Strategy Execution Service / Runtime Broker registry, using a WASI Preview 1 stdin/stdout JSON envelope as the first executable ABI and documenting direct exports and component model as future candidates.
- Add Rust Strategy Revision metadata, validation, compile/preflight evidence, immutable `.wasm` artifact hashing, artifact/source privacy rules, safe starter Rust samples, and non-counted exhibition alpha labels.
- Execute Rust WASM Strategies through Go -> Runtime Broker/runtime-service -> WASM/WASI runtime implementation without executing Strategy code in web/API/Go and without mutable-source Match execution.
- Probe WASM/WASI determinism, capabilities, and failure taxonomy: filesystem/preopen denial, network denial, clock/time/random denial, memory caps/growth, fuel/timeout, trap/panic/abort, malformed JSON/ABI result, oversized streams/results, invalid actions/schema, toolchain drift, package/import drift, no-fallback, and private-data redaction.
- Treat Zig as a gated stretch target: use local tooling only if compile/runtime evidence passes loudly, otherwise record fail-loud readiness/preflight evidence without substitution.
- Run realistic signed-in non-counted proof with one JS/TS Strategy Revision, one Rust Strategy Revision compiled to immutable WASM, Rust-vs-Rust and JS/TS-vs-Rust exhibitions, optional Zig proof if available, result/replay evidence, replay plausibility, public-safe evidence, no silent fallback, and JS/TS regression checks.
- Close with explicit conservative promotion decisions: no Rust/Zig/WASM ranked, ladder, counted, gauntlet, broad production multi-language, or production sandbox promotion unless evidence genuinely supports it.

**Key context:** Local tooling supported the executable Rust candidate: Rust `wasm32-wasip1`, Wasmtime, and WASM probing were available. Zig was recorded as fail-loud unavailable in the final readiness evidence. The milestone uses this evidence ambitiously without turning local alpha proof into production sandbox certification.

**Implemented:** v1.21 adds a WASI Preview 1 stdin/stdout JSON runtime lane, Rust runtime-service compile/validation into immutable WASM artifact metadata, Wasmtime execution through the Strategy Execution Service / Runtime Broker, Rust Workshop/account/exhibition/result labels, 15/15 WASM/WASI hostile probes, fail-loud Zig readiness evidence, and a two-cycle signed-in proof covering JS/TS-vs-Rust and Rust-vs-Rust non-counted exhibitions. Rust/WASM remains non-counted exhibition alpha only, Zig remains unavailable/non-promoted, and WASM/WASI remains candidate evidence only.

## Previous Shipped Milestone: v1.20 Runtime Sandbox Candidate and Exhibition Reliability Proof

**Goal:** Make the Docker/container subprocess runtime candidate executable and honestly testable while improving Python non-counted exhibition beta reliability, latency, timeout behavior, degraded-state UX, and signed-in proof evidence.

**Target features:**
- Treat v1.19 as the baseline and preserve the normal topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s).
- Select Docker/container subprocess as the primary stronger sandbox candidate lane because Docker is locally available, while keeping gVisor/runsc strict lanes fail-loud unless `runsc` is genuinely installed and executable.
- Implement real executable candidate evidence for the container lane, including hostile probes, resource/IPC behavior, no-fallback drills, public-safe diagnostics, and clear non-promotion language.
- Define timeout budgets separately for per-Strategy runtime calls, whole-Match execution, MatchSet/job orchestration, runtime-service HTTP calls, and browser proof runs.
- Measure JS/TS-vs-Python and Python-vs-Python exhibition MatchSet latency and stabilize or reduce Python exhibition latency where practical without weakening deterministic per-Strategy caps.
- Make running, slow, degraded, timeout, retry/no-retry, and failed runtime states understandable in UI and public-safe evidence.
- Run a realistic signed-in proof that creates one JS/TS revision, two Python revisions, mixed JS/TS-vs-Python and Python-vs-Python non-counted exhibition MatchSets, result/replay evidence, candidate-lane evidence, degraded/timeout wording checks, private-data safety checks, no-fallback checks, and JS/TS regression checks.
- Close with explicit promotion decisions: Python remains non-counted exhibition beta; runtime isolation remains readiness evidence unless the stronger candidate evidence genuinely supports a stronger claim.

**Key context:** v1.20 starts from the v1.19 proof. Python is already non-counted exhibition beta, JS/TS remains the counted Strategy path, Go owns orchestration and public evidence, and hostile Strategy execution remains only behind schema-validated ABI envelopes and registered runtime implementations. Docker/container evidence may become a stronger executable candidate lane, but this milestone must not overclaim production sandbox certification.

**Implemented:** v1.20 adds strict executable Docker/container subprocess evidence, hostile probe/no-fallback parity, v1.20 reliability budget artifacts, public-safe degraded-state evidence panels, a three-cycle signed-in reliability proof, and a final promotion decision that keeps Python non-counted and runtime isolation readiness-only. The live proof caught and fixed a practical Go job lease bug: the previous lease was shorter than the runtime-service HTTP budget, so long Python-vs-Python Matches could degrade after lease expiry.

## Previous Shipped Milestone: v1.19 Runtime Isolation Readiness and Exhibition Beta Trust

**Goal:** Strengthen runtime isolation readiness evidence while making Python non-counted exhibition beta clearer, safer, and more trustworthy for signed-in users.
**Decision:** `keep-python-non-counted-exhibition-beta-runtime-isolation-readiness-only`
**Archives:** `.planning/milestones/v1.19-ROADMAP.md`, `.planning/milestones/v1.19-REQUIREMENTS.md`, `.planning/milestones/v1.19-phases/`
**Audit:** `.planning/milestones/v1.19-MILESTONE-AUDIT.md`

**Target features:**
- Rebaseline v1.18 as the floor and define honest subprocess, container, and gVisor/runsc-style runtime isolation candidate contracts.
- Expand realistic hostile probes for filesystem, network, shell/process, imports/packages, environment, host paths, output/memory pressure, timeouts, crashes, malformed IPC, redaction, and no-fallback behavior.
- Run required hardened subprocess evidence and practical container/gVisor-style evidence where local runtime support allows, with skipped/unsupported candidates failing loudly in required lanes.
- Extend topology, runtime ABI, candidate evidence, no-fallback, ownership, privacy, and JS/TS regression monitors.
- Improve Python exhibition creation, labels, validation messages, sample Strategies, MatchSet result evidence, and replay trust cues while keeping every user-facing label clear: "non-counted exhibition beta".
- Run a realistic signed-in proof covering account creation/sign-in, JS/TS Strategy Revision save, Python Strategy Revision save, non-counted exhibition MatchSet creation, Go -> Runtime Broker -> isolated runtime execution, MatchSet result evidence, replay evidence, private-data safety, and JS/TS regression safety.
- Close with explicit promotion decisions: Python remains non-counted exhibition beta; runtime isolation remains readiness evidence unless stronger production-grade proof genuinely passes.

**Key context:** v1.19 starts from the v1.18 baseline. Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`. Strategy code must not execute in web/API/Go. Python must not become ranked, ladder-counted, broadly production multi-language support, arbitrary package install support, backend owner, route owner, persistence owner, job lifecycle owner, Match completion owner, scoring owner, public evidence owner, or silent fallback path.

**Implemented:** v1.19 adds a unified hostile probe taxonomy, monitor-readable readiness lanes, explicit no-fallback drills, deterministic runsc/container strict-lane behavior, compact Python exhibition beta labels, credible safe Python samples, public-safe MatchSet/replay Evidence panels, a signed-in JS/TS-plus-two-Python proof, and a final promotion decision that keeps Python non-counted and runtime isolation as readiness evidence only. The live proof caught and fixed two practical gaps: runtime-service HTTP timeout was too low for Python subprocess exhibition Matches, and public evidence copy exposed internal private-field names.

## Previous Shipped Milestone: v1.18 Runtime Isolation and Multi-Language Exhibition Beta

**Goal:** Strengthen the runtime isolation boundary and prove it with a signed-in non-counted multi-language exhibition beta while preserving v1.17's broker/runtime-only contract.
**Decision:** `promote-python-non-counted-exhibition-beta`
**Archives:** `.planning/milestones/v1.18-ROADMAP.md`, `.planning/milestones/v1.18-REQUIREMENTS.md`, `.planning/milestones/v1.18-phases/`
**Audit:** `.planning/milestones/v1.18-MILESTONE-AUDIT.md`

**Target features:**
- Baseline v1.17 runtime behavior, define an exhibition-beta hostile Strategy threat model, and separate isolation readiness evidence from production sandbox certification.
- Harden Python subprocess/resource/process behavior and collect container/gVisor-style readiness evidence without promoting production counted play.
- Replace heuristic Python validation with real AST/compile validation where practical and public-safe diagnostics.
- Represent Python as account-owned immutable Strategy Revisions for non-counted exhibition beta while keeping JS/TS counted support intact.
- Run a signed-in local exhibition proof: account, JS/TS revision, Python revision, non-counted MatchSet, Go -> Runtime Broker -> isolated runtime execution, and replay evidence.
- Extend topology, monitors, hostile probes, privacy checks, and no-fallback drills so isolation regressions fail loudly.
- Close with explicit promotion decisions: Python may become non-counted exhibition beta; runtime isolation remains readiness evidence unless production-grade proof genuinely passes.

**Key context:** v1.18 starts from the v1.17 baseline. Normal topology remains `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`. Python must not become a backend, route owner, persistence owner, job lifecycle owner, Match completion owner, scoring owner, public evidence owner, ranked/counted language, arbitrary package runtime, or silent fallback path.

**Implemented:** Python can now be saved as an account-owned immutable Strategy Revision, selected for signed-in non-counted exhibition beta MatchSets, executed through Go -> runtime-service -> runtime implementation, and replayed through public-safe evidence. Runtime hardening adds isolated Python host launch flags, empty environment, no shell, deterministic timeout/output/crash classification, AST/compile validation, stronger monitors, and proof artifacts. Runtime isolation remains readiness evidence only, not production sandbox certification.

## Previous Shipped Milestone: v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening

**Goal:** Make Python an experimental end-to-end Strategy language through the language-neutral Strategy Execution Service / Runtime Broker contract while preserving the v1.16 backend-retirement boundary.
**Decision:** `promote-python-experimental-runtime-path-only`
**Archives:** `.planning/milestones/v1.17-ROADMAP.md`, `.planning/milestones/v1.17-REQUIREMENTS.md`, `.planning/milestones/v1.17-phases/`
**Audit:** `.planning/milestones/v1.17-MILESTONE-AUDIT.md`

**Target features:**
- Promote the Runtime Broker idea from naming to a concrete interface, registry, artifact, and monitor contract.
- Harden Strategy Revision and Strategy Artifact language/runtime metadata so immutable artifacts carry language id/version, runtime target, package/compile metadata, validation status, artifact hash, and Match eligibility flags.
- Add Python submission-time validation with parse/compile checks, package policy enforcement, immutable artifact creation, and public-safe diagnostics.
- Execute Python Strategies only through the same runtime service/runtime ABI envelopes as JS/TS, with matching timeout, invalid output, crash, oversized payload, stderr/stack redaction, and privacy behavior.
- Provide a user-facing Python Starter Strategy proof that can be authored, submitted, validated, run in a non-counted Workshop or exhibition-style MatchSet, and replayed.
- Extend topology, registry, monitor, page-smoke, and privacy gates so Python remains a runtime implementation only, not a backend, persistence owner, route owner, or counted/ranked fallback.

**Key context:** v1.17 starts from the v1.16 baseline: normal topology remains `web frontend -> Go backend -> isolated runtime service(s)`. JS/TS Strategy support must remain intact through the existing isolated runtime service. Python may become an experimental second runtime path behind the Runtime Broker contract, but it must not become a backend, route owner, persistence owner, silent fallback path, production sandbox promotion, or ranked/ladder counted language.

**Implemented:** Python is now an experimental runtime implementation behind the Strategy Execution Service / Runtime Broker contract. Workshop can load, validate, and submit a Python tactical starter; runtime-service can execute Python Strategies through schema-validated ABI envelopes; Go validates registered runtime metadata and keeps Python non-counted; monitors fail on registry drift, Python execution outside the runtime boundary, backend ownership creep, privacy leaks, and premature counted eligibility.

## Previous Shipped Milestone: v1.16 Runtime Isolation and TypeScript Backend Retirement

**Goal:** Finish the TypeScript backend retirement by making TypeScript's remaining role explicit and narrow: frontend plus an isolated JS/TS Strategy runtime service only.
**Decision:** `promote-no-typescript-backend-except-frontend-and-isolated-js-ts-runtime-service`
**Archives:** `.planning/milestones/v1.16-ROADMAP.md`, `.planning/milestones/v1.16-REQUIREMENTS.md`, `.planning/milestones/v1.16-phases/`
**Audit:** `.planning/milestones/v1.16-MILESTONE-AUDIT.md`

**Delivered:**
- Inventoried 185 TypeScript backend-like surfaces and classified every retained role as frontend, runtime-only, parity-only, rollback-only, test-only, fixture-only, quarantined, deferred, or retired.
- Defined the final JS/TS runtime service boundary as broker-ready and language-neutral, naming the future abstraction **Strategy Execution Service** / **Runtime Broker** and including runtime ABI use, JSON/schema-validated envelopes, source package policy, limits, timeouts, diagnostics, logs, crash semantics, replay privacy, and no-fallback behavior.
- Moved or locked selected normal web/API workflows to Go-owned contracts and removed silent TypeScript backend fallback for account/session, fork, exhibition, public read, and public replay evidence flows.
- Quarantined or relabeled TypeScript worker, job lifecycle, Match completion, Chronicle persistence, MatchSet scoring, MatchSet creation, and `@cowards/service` paths as parity, rollback, test, fixture, or deferred only.
- Added a no-TypeScript-backend topology mode plus monitor gates proving web frontend -> Go backend -> isolated JS/TS runtime service, with representative page-load smoke and public-output privacy checks.

**Key tradeoff:** JS/TS Strategy support remains in scope only through the isolated runtime service boundary. The runtime service may produce ABI execution results for Go, but it must not own normal backend routes, job claiming, persistence, Chronicle storage, MatchSet scoring, public evidence delivery, or fallback behavior. The v1.16 contract should be shaped so a language-neutral runtime broker can front or replace the current TypeScript runtime service without changing normal Go orchestration semantics.

**Runtime portability stance:** Future language runtimes should implement the same JSON/runtime ABI and schema-validated request/response envelopes. Strategy Revision submission should compile, validate, or package artifacts where practical, then Matches should execute immutable artifacts rather than mutable source. WASM/WASI and the WebAssembly component model are strong long-term unifying candidates for some languages, especially with Wasmtime-style deterministic fuel and sandbox guidance, but they are not a silver bullet and Node `node:wasi` must not be treated as an untrusted-code sandbox.

## Previous Shipped Milestone: v1.15 Go Backend Ownership Completion

**Goal:** Make Go the owner of normal backend orchestration, persistence-facing API behavior, Match lifecycle coordination, Chronicle persistence, MatchSet scoring completion, and public evidence delivery while TypeScript remains frontend, parity oracle, and the isolated JS/TS Strategy runtime boundary.

**Delivered:**
- Go-owned job claiming, lease, heartbeat, retry, failure, completion, Match lifecycle state transition, Chronicle persistence handoff, and MatchSet scoring/status refresh contracts.
- `runtime-execution-service-v1.15`, allowing Go orchestration to invoke the TypeScript JS/TS Strategy runtime only through `strategy-runtime-abi-v1.14`.
- Go-owned normal exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence paths with no silent TypeScript backend fallback.
- TypeScript surface labels documenting remaining frontend, runtime-only, parity-only, rollback-only, test-only, and deferred TypeScript ownership.
- Strict topology, rollback, failure-drill, public-output privacy, route ownership, runtime ABI, boundary monitor, representative page-smoke, and Docker/OrbStack evidence gates.
- Browser replay realism checks for plausible full Match starts, in-bounds visible pieces, and nonblank replay canvas rendering.

**Non-goals:** Production sandbox replacement, final TypeScript runtime retirement, Node `vm` as a security boundary, Go/web/API Strategy execution, Go migration/schema ownership, full owner-debug replay migration, counted non-JS play, custom arenas, durable ratings, monetization, or broad governance expansion.

## Previous Shipped Milestone: v1.14 Generic Strategy Artifact and Runtime Boundary Contract

**Goal:** Define and implement generic Strategy Artifact/Revision contracts and a strict runtime ABI boundary so Go can consume parity-safe Strategy templates/forks without executing hostile Strategy code, while public outputs, replay safety, schema validation, and deterministic engine boundaries remain hard gates.

**Delivered:**
- Rebaselined v1.13 route/runtime/privacy state and locked explicit v1.14 non-goals before implementation.
- Created generic Strategy Artifact / Revision contracts for user revisions, server-native templates, Starter and Advanced libraries, future language variants, runtime metadata, source hashes, validation, lineage, and immutable Match eligibility.
- Generated parity-safe Strategy artifact manifests from TypeScript-owned Starter, Advanced, and Workshop template sources without hand-maintained Go copies.
- Defined `strategy-runtime-abi-v1.14` as the strict public interface between deterministic server/native orchestration and hostile Strategy runtime code.
- Made JS runtime adapters conform to the v1.14 ABI through a single explicit bridge while keeping execution outside web/API/Go.
- Let Go consume generated artifacts for Starter/Advanced forks and lineage-preserving account saves without executing Strategy code.
- Centralized public-output privacy rules and added repeatable topology plus replay board realism evidence for Match/replay creation changes.

**Decision:** `promote-artifact-backed-go-forks-and-runtime-abi-v1.14`. Runtime/worker execution remains TypeScript worker-owned; Go consumes built-in Strategy artifacts as data only.

## Previous Shipped Milestone: v1.13 Go Backend Ownership Cutover

**Goal:** Perform a fast, decisive Go backend ownership cutover for normal product workflows, including live Go persistence, public reads, owner/account reads, auth/session mutations, account Strategy Revision writes/source retrieval, and exhibition creation, while keeping Strategy execution, worker orchestration, deterministic engine logic, and private replay internals out of Go ownership.

**Delivered:**
- Add Go DB/persistence access and live DTO assembly so Go no longer depends on committed parity fixtures for selected product routes.
- Make Go the primary owner for public Strategy, player, ladder, MatchSet summary, and replay metadata reads.
- Make Go the primary owner for auth/session read and mutation flows and source-free account Strategy Revision list reads.
- Make Go the primary owner for account Strategy Revision source/create/save flows with strict owner-private source handling and no Strategy execution in web/API or Go.
- Make Go the primary owner for exhibition MatchSet creation while preserving TypeScript worker ownership for job claiming, Match execution, Chronicle generation, and runtime failure handling.
- Extend route ownership manifests, topology checks, privacy scans, boundary monitors, rollback drills, and no-fallback evidence across all selected v1.13 routes.
- Fix Go-created replay board realism by using canonical arena bounds and adding replay validation for out-of-bounds visible pieces.

**Decision:** `promote-selected-go-backend-routes`. TypeScript service behavior remains the parity oracle and rollback reference, not silent fallback in selected Go evidence paths. Starter/Advanced forks are accepted deferred until Go has a parity-safe generic Strategy template/source manifest. Runtime/worker ownership, full replay projection/private Chronicle assembly, Go migration/schema ownership, production sandbox promotion, and counted non-JS play remain deferred.

**Archived audit:** `.planning/milestones/v1.13-MILESTONE-AUDIT.md`
**Tag:** `v1.13`

## Previous Shipped Milestone: v1.12 Go Backend Promotion Readiness and Cutover Plan

**Goal:** Prove whether production web reads can safely route to Go, with at most one narrow public read route promoted only if live parity, privacy, topology, no-fallback behavior, rollback, and operational failure evidence all pass.

**Target features:**
- Re-baseline TypeScript-service versus Go ownership, including the remaining 29 broad web report-only offenses and the existing five GET-only Go route manifest entries.
- Define and enforce promotion criteria for production Go reads: route ownership, generated parity fixtures, schema validation, privacy checks, topology checks, CI-grade live evidence, no-fallback semantics, rollback, diagnostics safety, and failure behavior.
- Add production-equivalent live Go readiness evidence where feasible, including web-through-Go checks, stopped-Go no-fallback checks, and rollback-to-TypeScript evidence.
- Decide whether to promote at most `getPublicStrategyPage` / `GET /public/strategies/{strategyId}` behind an explicit route-scoped switch; otherwise document `promote-none-yet` with blockers.
- Keep Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, persistence ownership, Strategy source retrieval, Strategy execution, production runtime sandbox promotion, counted non-JS play, and rule/engine changes out of scope.

**Decision:** `promote-none-yet`. The route-scoped switch and failure evidence are in place, but Go still serves the selected public Strategy read from parity fixtures rather than a production-equivalent data provider.

**Archived audit:** `.planning/milestones/v1.12-MILESTONE-AUDIT.md`

**Next:** Start a fresh milestone with `$gsd-new-milestone`; `.planning/REQUIREMENTS.md` is intentionally removed at milestone close.

## Previous Shipped Milestone: v1.11 Remaining Web Read Boundary Burn-Down and Live Go Readiness Evidence

**Goal:** Reduce the remaining 30 broad web report-only direct persistence offenses by moving the next narrow Workshop read surfaces behind `@cowards/service`, and make live Go readiness evidence a required evidence-only validation lane without promoting Go ownership.

**Delivered:**
- Re-baselined and classified the 30 remaining broad web report-only offenses before implementation, separating service candidates from deferred write/private/runtime/replay surfaces.
- Moved Workshop test-summary and analytics-compare reads behind spec/service-owned DTOs while keeping Workshop source, save, validation, launch, rerun, export, and runtime flows TypeScript-owned.
- Promoted proven migrated files and source-free type cleanup to strict import enforcement, with `strict_offenses=0` and `report_only_offenses=29`.
- Required live Go readiness evidence through parity, topology, privacy, GET-only route inventory, no-fallback semantics, and rollback documentation while keeping production web traffic on the TypeScript service path.
- Archived audit: `.planning/milestones/v1.11-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.10 Service Boundary Completion and Go Read-Model Decision

**Goal:** Continue the v1.9 service-boundary ownership move by migrating high-value web read/user surfaces behind `@cowards/service`, reducing the remaining broad web report-only direct persistence debt from the 34-offense baseline, and implementing exactly one guarded Go public Strategy read-model route only after TypeScript-service-backed parity fixtures and rollback criteria are explicit.

**Delivered:**
- Classified the remaining broad web report-only baseline before migration.
- Moved account Strategy Revision list reads behind `@cowards/service` while keeping save/source/fork/write behavior out of scope.
- Moved the Workshop analytics/Evidence Explorer read slice behind spec/service-owned DTOs while leaving Workshop source/save/test/runtime/rerun/export flows TypeScript-owned.
- Added exactly one Go read-model route, public `GET /public/strategies/{strategyId}`, generated from TypeScript-service-backed parity fixtures.
- Promoted migrated slices to strict import enforcement and reduced broad web report-only direct persistence debt from 34 to 30.
- Kept Go writes, jobs, migrations, Match orchestration, Strategy execution, production web routing to Go, production sandbox promotion, and counted non-JS play out of scope.
- Archived audit: `.planning/milestones/v1.10-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.9 Backend and Runtime Ownership Split

**Goal:** Use the v1.8 service contracts, Go parity fixtures, runtime semantics, local topology, and boundary monitors to make one deliberate ownership move without blending backend rewrite, production sandbox promotion, and non-JS counted play into one risky change.

**Delivered:**
- Selected the service-backed web read/user branch as the v1.9 ownership move while keeping Go expansion as follow-up-only.
- Moved public player profiles, owner account session/revision-list reads, and public ladder season reads behind `@cowards/service`.
- Widened strict import enforcement and reduced broad web report-only direct persistence debt from 41 to 34 known offenses.
- Added runtime isolation readiness guardrails and monitor evidence without promoting worker, subprocess, container, or other candidates to counted hostile-code execution.
- Added spec-owned non-JS promotion criteria while keeping Python and other non-JS runtimes experimental, disabled for normal play, and non-counted.
- Fixed the audit-found container runtime blocker so the container adapter remains evidence-only and non-counted until explicit promotion criteria are satisfied.
- Archived audit: `.planning/milestones/v1.9-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.8 Production Boundary Hardening

**Goal:** Turn the v1.7 service/runtime/backend contracts into sturdier operating boundaries that are boring, observable, repeatable, and hard to accidentally bypass without prematurely rewriting orchestration, backend ownership, or production multi-language runtime support.

**Delivered:**
- Generated `service-api-v1.8` OpenAPI artifacts from canonical `@cowards/spec` service routes and DTO schemas, with stale-output and lint checks.
- Migrated selected public web reads through `@cowards/service` while preserving existing DTO behavior and privacy constraints.
- Promoted the Go backend spike to read-only parity against TypeScript-service-generated fixtures for health, public MatchSet summary, replay metadata, and owner-scoped analytics summary.
- Added an evaluation-only sandbox matrix and hostile probe harness for worker, subprocess, container, WASM/WASI, Deno-style, gVisor, and microVM tradeoffs without promoting a production sandbox.
- Made non-JS Strategy semantics spec-owned: language/adapter labels, readiness, package policy, validation codes, docs/examples references, warnings, and counted eligibility.
- Added `pnpm topology:check` for repeatable local web/service/runtime/Go fixture diagnostics and `pnpm boundary:monitors` for service contract, privacy, import-boundary, runtime adapter, Go parity, sandbox, and topology drift checks.
- Archived audit: `.planning/milestones/v1.8-MILESTONE-AUDIT.md`.

## Previous Shipped Milestone: v1.7 Runtime and Backend Boundary Stabilization

**Goal:** Make Coward's Game ready for a future Go backend and multi-language Strategy runtimes by freezing typed boundaries and proving parity before any major rewrite.

**Delivered:**
- `service-api-v1.7` contracts and `@cowards/service` for health, auth/session, Strategy revisions, MatchSets, replay metadata, analytics, exports, ladders, and public pages.
- `strategy-runtime-abi-v1.7` contracts for language-neutral Strategy execution envelopes, package/source metadata, limits, timeouts, runtime violations, system failures, and deterministic restrictions.
- Golden parity fixtures proving deterministic engine outcomes, Chronicle projection, replay reconstruction, public DTO privacy, runtime failure taxonomy, and ordering.
- Runtime language/adapter registries with first-class Strategy Revision metadata, compatibility keys, counted-play eligibility, and legacy runtime normalization.
- Experimental Python subprocess runtime through the same ABI, clearly disabled for counted play.
- Minimal read-only Go backend spike for health, public MatchSet summary, and replay metadata DTO envelopes.
- Local validation through `pnpm test:fast`, `pnpm build`, Go tests, and HTTP smoke checks for web and Go endpoints.

## Previous Shipped Milestone: v1.6 Workshop Analytics and Evidence Explorer

**Goal:** Turn v1.5's deterministic evidence into studyable Workshop analytics through saved gauntlet profiles, matchup heatmaps, evidence bands, replay deep links, and owner-safe exportable summaries.

**Delivered:**
- Stable analytics evidence contracts for saved gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and export-safe DTOs.
- Saved named gauntlet profiles with exact deterministic inputs, immutable Strategy Revision ids, compatibility-aware reruns, and compare-only-when-equivalent behavior.
- Workshop matchup heatmaps across Starter and Advanced opponents showing W-L-D, points, failures, side bias, evidence confidence, evidence counts, and replay availability.
- Evidence Explorer drilldowns from Strategy evidence to opponent records, MatchSet ids, Match ids, compatibility metadata, representative replay links, and owner-safe exports.
- Replay deep links to meaningful public moments such as Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.
- Owner-only JSON/CSV exports for deterministic gauntlet summaries, with schema and browser checks preventing Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, or private runtime internals from leaking by default.
- Local demo data and browser-verified pages at `http://localhost:3000/` and `http://localhost:3000/workshop/evidence`.

## Validated in v1.4

- ✓ Canonical `cowards-rules-v1.4` rule and architecture docs for Cycle-interleaved selected slots and Cycle-boundary Backstab.
- ✓ Pure engine scheduler now resolves selected Soldier slots by Cycle layer, skips ended slots, treats blocked movement as a non-terminal Cycle cost, and emits Cycle lifecycle summaries.
- ✓ Chronicle and replay stack rebaseline to `chronicle-v1.4`, current compatibility versions, v1.4 lifecycle events, and active replay fixtures.
- ✓ Replay viewer playback now offers seven speed options up to 32x and defaults to 2x the original playback pace for denser v1.4 Cycle timelines.
- ✓ Starter Strategy Library keeps stable IDs while publishing v1.4 lineage, refreshed source hashes, and a real interleaved starter gauntlet.
- ✓ Completed local demo ladder at `/ladder/v1-4-demo` with 8 v1.4 starter entrants, 96 replay-backed Chronicles, counted MatchSets, and browser-verified public pages.

## Validated in v1.5

- ✓ Workshop Advanced Library entry point, apply/fork flows, revision comparison support, gauntlet/result framing, diagnostics, replay handoff, and performance summaries.
- ✓ Distinct 10-strategy Advanced Library with v1.5 lineage, public-safe archetype metadata, memory/stateless diversity, source hashes, and validation.
- ✓ Deterministic evidence model and report artifacts covering standings, W-L-D, counted status, rule/Chronicle versions, runtime adapter, behavior metrics, representative links, and non-durable framing.
- ✓ Five example MatchSets covering anti-backstab stress, wall control under pressure, center control vs mobility, trap breakpoint, and memory adaptation mirror.
- ✓ Completed 8-entrant Advanced-only local demo tournament at `/ladder/v1-5-demo`, with Center Gravity finishing 6-1-0 and no sweep.
- ✓ Second-take Advanced Strategy retune validated across 33 Chronicles: 7103 Moves, 412 Backstab resolutions, 0 blocked moves, 0 direct self-stoning, and 0 self off-board moves.
- ✓ Browser checks for Workshop, tournament, MatchSet, Strategy card, player/profile, and replay pages with public privacy boundaries intact.

## Validated in v1.6

- ✓ Stable analytics contracts for gauntlet profiles, gauntlet runs, MatchSet summaries, matchup records, evidence bands, archetype tags, replay references, compatibility metadata, and owner-safe export DTOs.
- ✓ Saved gauntlet profiles can be named, rerun, compared only when compatibility-equivalent, and stored without executing Strategy code in the web/API process.
- ✓ Workshop heatmaps show W-L-D, points, evidence bands, evidence counts, failures, side bias, and replay availability across Starter and Advanced opponents.
- ✓ Evidence Explorer supports sorting/filtering/drilldown from Strategy evidence to opponent records, MatchSet ids, Match ids, representative replays, compatibility metadata, and owner-safe exports.
- ✓ Replay deep links target meaningful public moments and focus the replay timeline at or near the selected event.
- ✓ Owner JSON/CSV exports preserve deterministic provenance while omitting Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, owner debug, and private runtime internals by default.
- ✓ Local v1.6 analytics demo and milestone audit pass with realistic mixed outcomes, degraded/system-failed evidence states, runtime isolation checks, browser checks, and no open findings.

## Validated in v1.7

- ✓ `service-api-v1.7` service contracts cover auth/session, Strategy revisions, MatchSets, replay metadata, analytics, exports, ladders, public pages, and health.
- ✓ `@cowards/service` provides a typed service boundary and web MatchSet result reads now pass through it without importing persistence roots.
- ✓ Public service DTO privacy guards reject Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, stack traces, stderr, sessions, and runtime internals.
- ✓ `strategy-runtime-abi-v1.7` defines language-neutral execution envelopes, source/package metadata, limits, deterministic restrictions, versioning, runtime violations, and system failures.
- ✓ Strategy Revisions carry first-class language/runtime adapter metadata, with legacy `runtime-js` normalization and counted-play eligibility checks.
- ✓ Golden parity fixtures cover deterministic Match outcomes, Chronicle/replay behavior, public DTO privacy, runtime failure taxonomy, and deterministic ordering.
- ✓ Experimental Python runtime spike executes through the ABI but remains disabled for normal counted play.
- ✓ Minimal Go backend spike returns v1.7-shaped health, public MatchSet summary, and replay metadata DTOs.
- ✓ Milestone audit fixed boundary issues around runtime worker imports, persistence-root service imports, and schema-drift fallback behavior.

## Validated in v1.8

- ✓ `service-api-v1.8` OpenAPI artifacts are generated from canonical service metadata, linted, and stale-output checked.
- ✓ Selected public web reads use `@cowards/service` and preserve public DTO shape, ordering, errors, and privacy redaction.
- ✓ Go read-only backend parity is generated from TypeScript service outputs for health, public MatchSet summary, replay metadata, owner-scoped analytics summary, and degraded/system-failed evidence.
- ✓ Sandbox hardening is evaluation-only, with hostile probes and candidate tradeoffs recorded without promoting any boundary to production hostile-code isolation.
- ✓ Non-JS Strategy product semantics are spec-owned, with Python and other non-JS runtimes remaining experimental and non-counted.
- ✓ `pnpm topology:check` validates local topology setup, fixtures, TypeScript service health, runtime adapter metadata, optional live web/Go smoke, and privacy-safe diagnostics.
- ✓ `pnpm boundary:monitors` composes contract, privacy, import-boundary, runtime adapter, Go parity, sandbox, and topology drift checks.

## Validated in v1.9

- ✓ Selected service-backed web read/user surfaces as the deliberate production ownership move.
- ✓ Public player profiles, owner account session/revision-list reads, and public ladder season reads now pass through `@cowards/service`.
- ✓ Strict import enforcement widened while broad web report-only direct persistence debt dropped from 41 to 34 known offenses.
- ✓ Runtime isolation readiness, topology diagnostics, and boundary monitors remain evidence-only, with the container adapter explicitly non-counted after audit-fix.
- ✓ Non-JS promotion criteria are spec-owned; Python and other non-JS runtimes remain experimental, disabled for normal play, and non-counted.
- ✓ Full milestone gate covered package tests, typecheck, boundary monitors, replay smoke privacy, Go parity, topology checks, sandbox evidence checks, code review, audit-fix, and milestone audit.

## Validated in v1.10

- ✓ The remaining broad web report-only baseline was classified before migration, with selected slices and non-goals recorded.
- ✓ Account Strategy Revision list reads now pass through `@cowards/service` while save, source, fork, validation, test, submission, and MatchSet creation remain outside the read migration.
- ✓ Workshop analytics/Evidence Explorer reads now use spec/service-owned DTOs, preserving privacy and leaving Workshop source/save/test/runtime/rerun/export flows TypeScript-owned.
- ✓ Go gained exactly one public read-model route, `GET /public/strategies/{strategyId}`, backed by generated TypeScript-service parity fixtures.
- ✓ Strict import offenses remain 0 and broad web report-only direct persistence debt dropped from 34 to 30.
- ✓ Production web traffic was not routed to Go; Go writes, jobs, migrations, Match orchestration, Strategy execution, and Strategy source retrieval remain TypeScript-owned.
- ✓ Runtime isolation remains evidence-only; Python and other non-JS runtimes remain experimental, disabled for normal counted play, and non-counted.
- ✓ Final verification covered contracts, OpenAPI lint, typecheck, tests, Go parity, topology, boundary monitors, replay smoke, formatting, whitespace checks, audit-fix, and milestone audit.

## Validated in v1.0

- ✓ TypeScript monorepo, local workflow, canonical contracts, and versioning spine.
- ✓ Pure deterministic Coward's Game rules engine and invariant test suite.
- ✓ Chronicle creation, validation, hashing, reconstruction, public projection, and owner-only debug projection.
- ✓ Immutable JS/TS Strategy Revisions with safe validation APIs and worker-only runtime execution.
- ✓ PostgreSQL-backed Match/MatchSet persistence, migrations, worker jobs, retries, Chronicle storage, and deterministic scoring.
- ✓ Strategy Workshop authoring UX with Monaco, templates, validation, submission, revision history, and test launch/status.
- ✓ Replay viewer with Pixi board, timeline scrubber, inspector, event callouts, owner Awareness Grid, and full service-backed Workshop-to-replay E2E coverage.

## Validated in v1.1

- ✓ Engine-generated canonical replay fixtures for push, fall, contraction, legal Backstab, runtime failure, and endgame paths.
- ✓ Strict Chronicle grammar, compatibility checks, snapshot boundary validation, and impossible-state rejection before replay rendering.
- ✓ Public replay projection privacy gates for Strategy source, StrategyMemory, SoldierMemory, objectives, Awareness Grid details, and runtime internals.
- ✓ Replaceable Strategy execution adapter boundary with worker-thread metadata, subprocess JSON IPC spike, hostile Strategy matrix, timeouts, output caps, and failure taxonomy.
- ✓ Workshop debugging UX with actionable validation/runtime messages, sample Strategies, replay handoff links, and owner-only Soldier inactivity explanations.
- ✓ Persisted owner replay debug authorization for local Workshop Matches, proven through service-backed failing Strategy E2E.
- ✓ Docker and no-Docker local preflight paths plus service-backed, smoke, visual, and fast CI command slices.

## Validated in v1.2

- ✓ Username/password account creation, sign-in, sign-out, session persistence, display name, and public handle for competitive ownership.
- ✓ Stable User identity attached to account-owned immutable Strategy Revisions.
- ✓ Session-backed authorization for saving account revisions, entering owned revisions into exhibitions, and retrieving owner-only Strategy source.
- ✓ Competition presets, immutable entrant snapshots, MatchSet publication policy, deterministic scoring, tie-breakers, and public result DTO privacy checks.
- ✓ Unranked public exhibition MatchSets supporting 2-8 distinct owned revisions, including multiple revisions from the same user for alpha self-play.
- ✓ Public MatchSet result pages with status, standings, scoring policy, replay links, provenance, owner-only source affordances, and privacy-safe output.
- ✓ Abuse and fairness guardrails for rate limits, active duplicate submissions, valid entry criteria, public leak rejection, and runtime/web isolation boundaries.

## Validated in v1.3

- ✓ Forkable 10-strategy Starter Library with readable doctrine notes, source hashes, validation, memory-using starters, and Workshop apply/fork flows.
- ✓ Resettable trial ladder seasons with no permanent Elo/Glicko promise, explicit lifecycle states, one active Strategy Revision per user per season, immutable snapshots, next-season replacement, and stale revision policy.
- ✓ Deterministic ladder scheduling, pod MatchSet generation, counted standings, retry/degraded/non-counted handling, replay-backed evidence, and a completed local demo ladder at `/ladder/v13-demo`.
- ✓ Public player handle pages and public Strategy cards with lineage, records, tags, runtime compatibility, result links, and private-source/memory/debug exclusions.
- ✓ Focused competition governance with result flags, admin status marking, standings exclusion, public counted-state explanations, and audit logs.
- ✓ Containerized subprocess production-candidate Strategy runtime boundary behind `StrategyExecutionAdapter`, with worker-thread retained as local/dev fallback and hostile regression coverage.

## Validated in v1.15

- ✓ Go-owned job lifecycle contracts cover claim, lease, heartbeat, retry, failure, diagnostics redaction, duplicate-claim prevention, and explicit rollback/no-fallback behavior.
- ✓ Go orchestrates Match execution through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14` while Strategy code stays out of Go and web/API processes.
- ✓ Go-owned Match completion validates lease ownership, Chronicle schema/metadata/hash, terminal outcomes, idempotency, and atomic Chronicle/Match/job/attempt persistence.
- ✓ Go-owned MatchSet scoring/status refresh handles complete, running, degraded, failed-system, strategy-failure penalty, survivor totals, survival turns, and stable tie-breaker scenarios.
- ✓ Selected normal public evidence and web workflows use Go-owned contracts for exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence.
- ✓ Remaining TypeScript production-ish ownership is limited to frontend, isolated JS/TS Strategy runtime worker/service, and explicitly documented parity/test/rollback/deferred surfaces.
- ✓ Strict topology, boundary monitors, rollback/failure drills, browser replay realism, representative page-smoke, Docker/OrbStack retest, and final audit all passed.

## Context

Source specifications are archived in the repository root:

- `./CowardsGameSpec_Full_Consolidated_v1.md`
- `./CowardsGame_Technical_Architecture_Spec_V1.md`

Planning archives live under `.planning/milestones/`:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.0-phases/`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-INTEGRATION-CHECK.md`
- `.planning/milestones/v1.1-phases/`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.2-phases/`
- `.planning/milestones/v1.3-ROADMAP.md`
- `.planning/milestones/v1.3-REQUIREMENTS.md`
- `.planning/milestones/v1.3-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.3-phases/`
- `.planning/milestones/v1.4-ROADMAP.md`
- `.planning/milestones/v1.4-REQUIREMENTS.md`
- `.planning/milestones/v1.4-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.4-AUDIT-FIX.md`
- `.planning/milestones/v1.4-phases/`
- `.planning/milestones/v1.5-ROADMAP.md`
- `.planning/milestones/v1.5-REQUIREMENTS.md`
- `.planning/milestones/v1.5-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.5-AUDIT-FIX.md`
- `.planning/milestones/v1.5-phases/`
- `.planning/milestones/v1.6-ROADMAP.md`
- `.planning/milestones/v1.6-REQUIREMENTS.md`
- `.planning/milestones/v1.6-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.6-phases/`
- `.planning/milestones/v1.7-ROADMAP.md`
- `.planning/milestones/v1.7-REQUIREMENTS.md`
- `.planning/milestones/v1.7-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.7-phases/`
- `.planning/milestones/v1.8-ROADMAP.md`
- `.planning/milestones/v1.8-REQUIREMENTS.md`
- `.planning/milestones/v1.8-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.8-phases/`
- `.planning/milestones/v1.9-ROADMAP.md`
- `.planning/milestones/v1.9-REQUIREMENTS.md`
- `.planning/milestones/v1.9-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.9-phases/`
- `.planning/milestones/v1.10-ROADMAP.md`
- `.planning/milestones/v1.10-REQUIREMENTS.md`
- `.planning/milestones/v1.10-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.10-phases/`
- `.planning/milestones/v1.11-ROADMAP.md`
- `.planning/milestones/v1.11-REQUIREMENTS.md`
- `.planning/milestones/v1.11-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.11-phases/`
- `.planning/milestones/v1.12-ROADMAP.md`
- `.planning/milestones/v1.12-REQUIREMENTS.md`
- `.planning/milestones/v1.12-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.12-phases/`
- `.planning/milestones/v1.13-ROADMAP.md`
- `.planning/milestones/v1.13-REQUIREMENTS.md`
- `.planning/milestones/v1.13-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.13-phases/`
- `.planning/milestones/v1.14-ROADMAP.md`
- `.planning/milestones/v1.14-REQUIREMENTS.md`
- `.planning/milestones/v1.14-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.14-phases/`
- `.planning/milestones/v1.15-ROADMAP.md`
- `.planning/milestones/v1.15-REQUIREMENTS.md`
- `.planning/milestones/v1.15-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.15-phases/`
- `.planning/milestones/v1.16-ROADMAP.md`
- `.planning/milestones/v1.16-REQUIREMENTS.md`
- `.planning/milestones/v1.16-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.16-phases/`
- `.planning/milestones/v1.17-ROADMAP.md`
- `.planning/milestones/v1.17-REQUIREMENTS.md`
- `.planning/milestones/v1.17-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.17-phases/`
- `.planning/milestones/v1.18-ROADMAP.md`
- `.planning/milestones/v1.18-REQUIREMENTS.md`
- `.planning/milestones/v1.18-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.18-phases/`
- `.planning/milestones/v1.19-ROADMAP.md`
- `.planning/milestones/v1.19-REQUIREMENTS.md`
- `.planning/milestones/v1.19-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.19-phases/`

## Out of Scope Until Replanned

- Durable all-time ratings, permanent Elo/Glicko contracts, ranked prize ladders, public tournaments, and broad spectator/community surfaces beyond profiles, public Strategy cards, standings, results, and replay links.
- Randomized arena generation and custom user-created maps.
- Full production multi-language runtime support beyond Python non-counted exhibition beta and runtime boundary readiness evidence.
- Unbounded backend rewrite, job claiming/completion, Match execution, Chronicle generation, or migration of orchestration before Go API ownership, parity, and worker handoff boundaries are proven.
- Enterprise-grade authentication features such as email verification, password reset, OAuth, organizations, and account recovery.
- Live model inference or live human control during Matches.
- Monetization, cosmetics, strategy marketplace, and reinforcement-learning harnesses.

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Build simulation-first | Deterministic engine, replay correctness, sandboxed execution, and Strategy API clarity were foundational. | ✓ Good |
| Use a TypeScript monorepo | Shared contracts and package boundaries kept engine, runtime, replay, worker, and web code separated. | ✓ Good |
| Keep engine pure and runtime-agnostic | The engine consumes a StrategyRuntime interface without database/network/clock dependencies. | ✓ Good |
| Make Chronicle the canonical replay artifact | Enabled deterministic replay, strict validation, privacy projection, persistence, and visual replay. | ✓ Good |
| Replace hand-authored replay demos with engine-generated fixtures | Legal scenario fixtures caught mismatch between visual demos and actual rules. | ✓ Good |
| Treat Chronicle grammar as a trust contract | Invalid order, payload, snapshot, privacy, and version failures are rejected before rendering. | ✓ Good |
| Keep Strategy code out of web/API processes | Runtime execution stays behind worker/runtime boundaries with explicit adapter metadata and tests. | ✓ Good |
| Preserve JS/TS runtime while hardening boundary | Worker-thread execution remains prototype containment; subprocess adapter and hostile matrix clarify next sandbox direction. | ✓ Revisit for production sandbox |
| Keep owner debug server-authorized | Query params may request owner debug, but server-side participant checks decide whether owner DTOs are returned. | ✓ Good |
| Defer ladders until trust base is sharp | Avoids replay disputes, sandbox abuse, stale revisions, compatibility confusion, and privacy leaks before the platform is ready. | ✓ Good |
| Start competition with exhibition MatchSets | Unranked or seeded MatchSets provide real competitive evidence without committing to durable ratings too early. | ✓ Good |
| Add only minimal production ownership first | Competitive submissions need stable User identity and private-source authorization, but email/OAuth/recovery can wait. | ✓ Good |
| Allow same-user multi-revision exhibition entry in alpha | Self-play is valuable for doctrine testing; one-strategy-per-user belongs with ranked or more formal competition. | ✓ Good |
| Publish result evidence without Strategy internals | Public standings, replay links, hashes, and provenance are enough for alpha disputes while source/memory/objective data stays private. | ✓ Good |
| Use resettable trial ladders before durable ratings | Ranking pressure is useful, but permanent ratings should wait until abuse, moderation, and sandbox behavior are better understood. | ✓ Good |
| Seed starter Strategies as forkable templates | Players should begin with readable, credible doctrines they choose to fork, not opaque auto-submissions. | ✓ Good |
| Treat containerized subprocess as the production-candidate runtime path | It preserves the JS/TS Strategy API while adding a clearer process and container boundary than worker threads. | ✓ Revisit before real hostile public scale |
| Interleave selected Soldiers by Cycle, not full Activation | The intended game is simultaneous-feeling tactical pressure where selected Soldiers respond between Cycles instead of one Soldier consuming its whole Cycle budget before the next slot acts. | ✓ Implemented in v1.4 |
| Check Backstab at every Cycle boundary | Backstab should be a tactical contact rule checked before and after each SoldierBrain Cycle, not only at Activation boundaries. | ✓ Implemented in v1.4 |
| Treat advanced seed quality as product evidence | Advanced Strategies should have shared tactical fundamentals and replay-backed archetype roles, not merely stronger source comments around Starters. | ✓ Implemented in v1.5 |
| Keep demo tournaments non-durable | v1.5 tournament evidence is useful for validation and onboarding, but does not create official public operations or permanent rankings. | ✓ Good |
| Treat Workshop analytics as study evidence, not rating truth | Saved gauntlet profiles, heatmaps, evidence bands, and exports should help players inspect deterministic MatchSet evidence without creating durable balance or ranking claims. | ✓ Implemented in v1.6 |
| Keep analytics summary-oriented and public-safe | Evidence Explorer, replay references, and owner exports should expose deterministic summaries and provenance while omitting Strategy source, memories, objectives, raw Awareness Grid, stack traces, owner debug, and private runtime internals by default. | ✓ Good |
| Freeze contracts before rewrites | Service and runtime boundaries should be specified, tested, and proven with small spikes before moving orchestration or production language support. | ✓ Implemented in v1.7 |
| Keep non-JS runtimes experimental until sandbox/product semantics are real | Python can prove ABI shape, but counted play should remain JS/TS until isolation, package policy, Workshop UX, and compatibility are designed. | ✓ Good |
| Keep Go backend migration read-only first | A static/read-only Go spike proves DTO/deployment shape without prematurely moving writes, jobs, or Strategy execution. | ✓ Good |
| Move service-backed web reads before Go route ownership | v1.9 showed that reducing direct web persistence debt is the cleanest first backend ownership move and preserves the TypeScript service as the contract source. | ✓ Good |
| Keep Go expansion follow-up-only until fixtures and rollback are explicit | A future Go read-model route needs generated TypeScript-service-backed parity fixtures, GET-only routing, topology diagnosis, auth/error semantics, and rollback scope before ownership moves. | ✓ Good |
| Keep production runtime promotion evidence-only | The container adapter and other runtime candidates must not become counted hostile-code boundaries until live isolation evidence and promotion criteria are satisfied. | ✓ Good |
| Use an aggressive v1.13 Go API ownership cutover | There is no live usage, so broad API cutover risk is acceptable as long as privacy, schemas, deterministic boundaries, hostile Strategy isolation, and public-output safety remain hard gates. | ✓ Implemented in v1.13 |
| Define artifact and runtime contracts before more Go/runtime ownership | Generic Strategy artifacts and a strict ABI prevent fork/template parity, validation, lineage, and runtime execution boundaries from becoming one-off rewrites. | ✓ Implemented in v1.14 |
| Keep Strategy execution out of Go while Go consumes artifacts as data | v1.14 proved Go can own Starter/Advanced forks through generated manifests without becoming a hostile-code execution boundary. | ✓ Good |
| Make Go the normal backend owner without moving hostile Strategy execution | v1.15 proved Go can own orchestration, Match completion, Chronicle persistence handoff, scoring, and public evidence while invoking TypeScript only through the runtime service ABI. | ✓ Implemented in v1.15 |
| Require representative page smoke before milestone closure | The v1.15 close loop found a public player page hard error after backend promotion; topology now smokes major page shapes before milestone completion. | ✓ Good |
| Retire TypeScript backend, not JS/TS Strategy support | v1.16 removed or quarantined TypeScript service/backend ownership while preserving the isolated JS/TS runtime service as hostile-code execution infrastructure invoked by Go through a broker-ready, language-neutral ABI contract. | ✓ Implemented in v1.16 |
| Name the future execution abstraction now | The current TypeScript runtime service conforms to a future **Strategy Execution Service** / **Runtime Broker** contract so later language-host replacement does not rewrite Go orchestration. | ✓ Implemented in v1.16 |
| Make Python prove the broker before product promotion | v1.17 should add Python only as an experimental runtime implementation behind the Strategy Execution Service / Runtime Broker contract, with non-counted proof and strict monitor gates before any ranked or production sandbox claims. | ✓ Implemented in v1.17 |
| Keep Python exhibition beta honest and understandable | v1.19 improved runtime isolation readiness evidence and user trust cues without turning Python into counted play or overclaiming production sandbox certification. | ✓ Implemented in v1.19 |
| Make the container candidate executable before stronger claims | v1.20 preferred the locally available Docker/container subprocess candidate for real executable evidence, while gVisor/runsc remained fail-loud because it was unavailable. | ✓ Implemented in v1.20 |
| Separate timeout budgets by layer | v1.19 showed whole-Match service timeout is different from per-Strategy caps; v1.20 made Strategy call, Match, MatchSet/job, runtime-service HTTP, and browser proof budgets explicit. | ✓ Implemented in v1.20 |
| Use WASI Preview 1 for the first immutable WASM Strategy proof | v1.21 preferred the simplest executable multi-language path: WASI Preview 1 stdin/stdout JSON envelopes through Wasmtime, with direct exports and component model documented as future evolution rather than forced into the first proof. | ✓ Implemented in v1.21 |
| Treat Rust WASM as exhibition alpha until proof matures | Rust can prove the immutable WASM artifact direction, but counted/ranked/ladder promotion requires separate sandbox, determinism, toolchain, artifact, replay, privacy, rollback, abuse, and operational evidence. | — Pending |

## Constraints

The active constraints remain: deterministic engine behavior, engine purity, Strategy Revision immutability, hostile Strategy treatment, runtime isolation, memory/source/output limits, package boundaries, replay privacy, Chronicle compatibility, competitive integrity, Go-owned normal backend behavior, no silent TypeScript backend fallback, and representative page-load smoke for major page types.

Future competition work must preserve exhibition self-play, avoid durable rating promises until governance and abuse data support them, keep all counted standings backed by replay/provenance evidence, and keep public player/Strategy/analytics surfaces free of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, and private runtime internals by default. v1.5 created local example MatchSets and a completed example tournament for demonstration, and v1.6 created saved gauntlet analytics for study; neither establishes official public tournament operations or durable ratings.

Future rule-correction work must treat the rules docs, engine, Chronicle/replay grammar, fixtures, starter Strategies, and demo competition data as one contract. It should not leave stale timing assumptions in samples, tests, or public explanatory text.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-25 after completing v1.21 milestone*
