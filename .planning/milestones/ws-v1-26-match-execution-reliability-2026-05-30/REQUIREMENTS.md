# Requirements: Coward's Game v1.26

**Defined:** 2026-05-30
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Harden the execution side behind the frozen `match-execution-app-v1` boundary. Improve Go/runtime-service orchestration reliability, retry classification, unavailable/degraded/system-failure handling, stale artifact detection, malformed runtime result handling, and live failure drills without changing the app-facing contract except for strictly backward-compatible additions that are proven necessary.

## Baseline

- v1.25 is complete, committed, tagged `v1.25`, and archived.
- Active root `.planning/REQUIREMENTS.md` is absent before this milestone begins; v1.26 requirements live in workstream `v1-26-match-execution-reliability`.
- `match-execution-app-v1` is frozen for parallel app/execution work.
- This milestone is behind the v1.25 interface and defaults to no app-facing contract additions.
- JS/TS remains the counted Strategy path.
- Python, Rust, and Zig remain non-counted exhibition beta only.
- WASI Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI.
- No new language promotion, production sandbox certification, direct-export ABI migration, Component Model/WIT ABI migration, counted non-JS play, or broad result/replay UX expansion is allowed.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Strategy code must not execute in web/API/Go.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals by default.

## v1 Requirements

### Baseline and Drift Inventory

- [x] **BASE-01**: Operator can inspect a v1.25 freeze baseline proving `match-execution-app-v1` is the public compatibility target.
- [x] **BASE-02**: Operator can inspect an execution-side drift inventory covering Go orchestration, runtime-service envelopes, job lifecycle, persistence, public evidence projection, fixtures, proof harnesses, and monitors.
- [x] **BASE-03**: Inventory distinguishes app-facing frozen contract surfaces from Go internals, runtime-service internals, persistence internals, owner/test-only proof surfaces, and intentionally unstable implementation details.
- [x] **BASE-04**: Inventory identifies every current path that can emit unavailable, degraded, system failure, malformed runtime result, stale artifact, timeout, retryable, or non-retryable public evidence.
- [x] **BASE-05**: Inventory records whether any backward-compatible app-facing addition is necessary; default outcome is no `match-execution-app-v1` change.
- [x] **BASE-06**: Baseline artifacts preserve JS/TS counted status, Python/Rust/Zig non-counted beta status, Preview 1 JSON ABI status, Go/runtime-service ownership, and public-output privacy.

### Retry and Non-Retry Lifecycle Semantics

- [x] **RETRY-01**: Go retry policy is documented as deterministic, bounded, lease-aware, and owned by Go orchestration.
- [x] **RETRY-02**: Go distinguishes retryable transport/envelope/system failures from non-retryable request/local validation failures.
- [x] **RETRY-03**: Go distinguishes malformed runtime-service HTTP/envelope failures from malformed Strategy/runtime output failures.
- [x] **RETRY-04**: Strategy output violations, invalid Strategy output, source mismatches, unsupported runtime metadata, and stale artifacts are not blindly retried.
- [x] **RETRY-05**: Retry attempts remain bounded by configured job limits and cannot loop indefinitely.
- [x] **RETRY-06**: Retry and terminal failure states project into public-safe lifecycle/failure evidence without exposing raw diagnostics.
- [x] **RETRY-07**: Unit or integration tests cover retryable below-limit, retryable exhausted, non-retryable immediate terminal, stale lease, and duplicate failure cases.

### Runtime Unavailable and Stopped-Service Drills

- [x] **DRILL-01**: Live stopped-runtime-service drill proves Go classifies runtime-service unavailability as retryable while attempts remain.
- [x] **DRILL-02**: Live unavailable-service drill proves exhausted retry attempts become terminal public-safe system failure evidence.
- [x] **DRILL-03**: Drill evidence distinguishes runtime-service unavailable from Strategy failure and malformed runtime-output failures.
- [x] **DRILL-04**: Drill leaves no orphaned running jobs, stale active leases, or duplicate terminal MatchSet refreshes.
- [x] **DRILL-05**: Public result/replay surfaces remain compatible with `match-execution-app-v1` during unavailable/degraded outcomes.
- [x] **DRILL-06**: Drill artifacts redact raw diagnostics, host paths, env values, tokens, DB details, package paths, and runtime internals.

### Malformed Runtime Result and Stale Artifact Drills

- [x] **FAIL-01**: Malformed runtime-service HTTP/envelope responses are classified as retryable system/envelope failures while attempts remain.
- [x] **FAIL-02**: Malformed Strategy/runtime output is classified as non-retryable Strategy/runtime-output failure, not as service unavailability.
- [x] **FAIL-03**: Stale or mismatched immutable artifact metadata fails closed before or inside runtime-service without source fallback.
- [x] **FAIL-04**: Stale artifact paths project to public-safe `stale_artifact` evidence where the frozen contract supports it.
- [x] **FAIL-05**: Malformed and stale failure drills never expose Strategy source, memories, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
- [x] **FAIL-06**: Tests prove malformed and stale paths preserve deterministic engine boundaries and do not execute Strategy code in web/API/Go.
- [x] **FAIL-07**: Drill artifacts document which failures are retryable, non-retryable, degraded, unavailable, or terminal.

### Runtime-Service Failure Envelope Translation

- [x] **RUNTIME-01**: Runtime-service system failure envelopes remain schema-validated and limited to registered failure codes.
- [x] **RUNTIME-02**: Runtime-service raw diagnostics are redacted before any Go persistence, job-attempt detail, public evidence, or proof artifact can expose them.
- [x] **RUNTIME-03**: Go rejects unknown runtime-service failure codes, non-contract fields, ABI drift, response contract drift, oversized responses, and malformed JSON safely.
- [x] **RUNTIME-04**: Runtime-service distinguishes system failure envelopes from successful Match execution outcomes that contain runtime violations.
- [x] **RUNTIME-05**: Runtime-service failure tests cover invalid requests, source hash/byte mismatch, unsupported runtime metadata, execution exception, invalid internal response shape, and artifact mismatch.
- [x] **RUNTIME-06**: Runtime-service remains free of persistence ownership, job lifecycle ownership, MatchSet scoring, public evidence delivery, and web/API product routes.

### Persistence and Job Lifecycle Reliability

- [x] **JOB-01**: Job claiming, lease, heartbeat, retry queueing, terminal failure, and completion paths are idempotent under duplicate or stale attempts.
- [x] **JOB-02**: Stale lease reclaim behavior is deterministic and does not allow simultaneous active workers for the same unexpired job.
- [x] **JOB-03**: Match completion rejects stale lease tokens, terminal job rewrites, duplicate Chronicle writes, and stale completion after terminal failure.
- [x] **JOB-04**: MatchSet status refresh is idempotent across retry, failure, degraded, complete, and no-result paths.
- [x] **JOB-05**: Failure detail persistence stores only allowlisted public-safe scalars and never stores raw Strategy/runtime diagnostics.
- [x] **JOB-06**: Integration tests or live drills cover job lifecycle behavior with local Postgres where required.

### Contract Compatibility Proof

- [x] **COMPAT-01**: Contract tests prove every public execution outcome still validates against `match-execution-app-v1`.
- [x] **COMPAT-02**: Compatibility proof covers complete, queued/running, degraded, unavailable runtime, system failure, timeout, malformed runtime result, stale artifact, strategy failure, missing Chronicle, and no-result outcomes.
- [x] **COMPAT-03**: Compatibility proof shows no required public DTO fields were removed or semantically narrowed.
- [x] **COMPAT-04**: Any optional field addition is documented as backward-compatible, public-safe, and necessary; otherwise no contract addition is made.
- [x] **COMPAT-05**: Boundary monitors catch ownership creep, Strategy execution in web/API/Go, contract drift, privacy leaks, fixture fallback in production, and premature runtime promotion claims.
- [x] **COMPAT-06**: Public result/replay proof pages render compatible evidence without exposing private fields or execution internals.

### Signed-In Execution Reliability Proof

- [x] **E2E-01**: Signed-in live proof creates or reuses eligible JS/TS counted Strategy Revisions and proves JS/TS counted execution still works.
- [x] **E2E-02**: Signed-in live proof exercises Python, Rust, and Zig only as non-counted exhibition beta regression lanes.
- [x] **E2E-03**: Live proof opens result and replay pages for successful and failure-drill outcomes where available.
- [x] **E2E-04**: Live proof verifies public pages and artifacts omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, and private runtime internals.
- [x] **E2E-05**: Live proof records commands, topology, service availability states, MatchSet IDs, outcome classifications, retry counts, and public links.
- [x] **E2E-06**: Live proof explicitly states no runtime promotion, production sandbox certification, ABI migration, or counted non-JS claim is made.

### Audit and Closure

- [x] **CLOSE-01**: Code review verifies retry classification, failure drills, redaction, persistence/job lifecycle idempotency, contract compatibility, and monitor changes.
- [x] **CLOSE-02**: Validation verifies requirements, tests, live drills, signed-in proof, contract compatibility, privacy scans, and boundary monitors.
- [x] **CLOSE-03**: Final milestone decision preserves the frozen v1.25 contract, JS/TS counted path, non-JS beta-only status, Preview 1 JSON ABI, no production sandbox certification, and no Strategy execution in web/API/Go.
- [x] **CLOSE-04**: v1.26 planning artifacts are archived, active workstream requirements are removed or marked complete at milestone close, and commit/tag evidence is recorded.
- [x] **CLOSE-05**: Retrospective records reliability lessons, remaining unstable internals, rollback clarity, and future promotion boundaries.

## Future Requirements

### Execution Reliability Follow-Up

- **FUT-RETRY-01**: Future retry-policy tuning may adjust backoff or attempt budgets only through Go-owned deterministic policy and public-safe evidence.
- **FUT-CONTRACT-01**: Future app-facing DTO additions require a separate compatibility decision or new contract version; v1.26 defaults to preserving `match-execution-app-v1`.
- **FUT-SANDBOX-01**: Future production sandbox certification requires separate hostile-code, deployment, resource, isolation, observability, rollback, and abuse evidence.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Result/replay UX expansion beyond proof pages | v1.26 hardens execution reliability behind the frozen contract, not product presentation. |
| New Strategy language promotion | JS/TS remains counted; Python/Rust/Zig remain non-counted exhibition beta. |
| Production sandbox certification | Reliability drills do not prove production hostile-code isolation. |
| Direct-export or Component Model/WIT ABI migration | Preview 1 stdin/stdout JSON remains active until a future explicit promotion decision. |
| Counted non-JS play | Runtime eligibility remains unchanged. |
| Runtime-service backend ownership | Runtime-service owns hostile execution only; Go owns orchestration, lifecycle, scoring, public evidence, retry policy, and promotion decisions. |
| Go/web/API Strategy execution | Hostile Strategy code must stay behind runtime-service / Runtime Broker boundaries. |
| Public raw diagnostics or private runtime internals | Public evidence must remain source-free and private-data safe. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 183 | Complete |
| BASE-02 | Phase 183 | Complete |
| BASE-03 | Phase 183 | Complete |
| BASE-04 | Phase 183 | Complete |
| BASE-05 | Phase 183 | Complete |
| BASE-06 | Phase 183 | Complete |
| RETRY-01 | Phase 184 | Complete |
| RETRY-02 | Phase 184 | Complete |
| RETRY-03 | Phase 184 | Complete |
| RETRY-04 | Phase 184 | Complete |
| RETRY-05 | Phase 184 | Complete |
| RETRY-06 | Phase 184 | Complete |
| RETRY-07 | Phase 184 | Complete |
| DRILL-01 | Phase 185 | Complete |
| DRILL-02 | Phase 185 | Complete |
| DRILL-03 | Phase 185 | Complete |
| DRILL-04 | Phase 185 | Complete |
| DRILL-05 | Phase 185 | Complete |
| DRILL-06 | Phase 185 | Complete |
| FAIL-01 | Phase 186 | Complete |
| FAIL-02 | Phase 186 | Complete |
| FAIL-03 | Phase 186 | Complete |
| FAIL-04 | Phase 186 | Complete |
| FAIL-05 | Phase 186 | Complete |
| FAIL-06 | Phase 186 | Complete |
| FAIL-07 | Phase 186 | Complete |
| RUNTIME-01 | Phase 187 | Complete |
| RUNTIME-02 | Phase 187 | Complete |
| RUNTIME-03 | Phase 187 | Complete |
| RUNTIME-04 | Phase 187 | Complete |
| RUNTIME-05 | Phase 187 | Complete |
| RUNTIME-06 | Phase 187 | Complete |
| JOB-01 | Phase 188 | Complete |
| JOB-02 | Phase 188 | Complete |
| JOB-03 | Phase 188 | Complete |
| JOB-04 | Phase 188 | Complete |
| JOB-05 | Phase 188 | Complete |
| JOB-06 | Phase 188 | Complete |
| COMPAT-01 | Phase 189 | Complete |
| COMPAT-02 | Phase 189 | Complete |
| COMPAT-03 | Phase 189 | Complete |
| COMPAT-04 | Phase 189 | Complete |
| COMPAT-05 | Phase 189 | Complete |
| COMPAT-06 | Phase 189 | Complete |
| E2E-01 | Phase 190 | Complete |
| E2E-02 | Phase 190 | Complete |
| E2E-03 | Phase 190 | Complete |
| E2E-04 | Phase 190 | Complete |
| E2E-05 | Phase 190 | Complete |
| E2E-06 | Phase 190 | Complete |
| CLOSE-01 | Phase 191 | Complete |
| CLOSE-02 | Phase 191 | Complete |
| CLOSE-03 | Phase 191 | Complete |
| CLOSE-04 | Phase 191 | Complete |
| CLOSE-05 | Phase 191 | Complete |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

---
*Requirements defined: 2026-05-30*
