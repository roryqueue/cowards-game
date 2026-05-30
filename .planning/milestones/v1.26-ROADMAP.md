# Roadmap: Coward's Game v1.26

## Milestones

- [x] **v1.25 Match Execution Interface Freeze and Parallel App/Execution Contract** - Phases 174-182, shipped 2026-05-30 with `match-execution-app-v1` frozen. See `.planning/milestones/v1.25-ROADMAP.md`.
- [x] **v1.26 Match Execution Reliability, Retry Semantics, and Failure Drills** - Phases 183-191, active in workstream `v1-26-match-execution-reliability`.

## Active Milestone

**v1.26 Match Execution Reliability, Retry Semantics, and Failure Drills**

**Goal:** Harden the execution side behind the frozen `match-execution-app-v1` boundary so Go/runtime-service orchestration, retry classification, unavailable/degraded handling, malformed result handling, stale artifact detection, and live failure drills are deterministic, bounded, public-safe, and contract-compatible.

**Decision baseline:** Keep `match-execution-app-v1` frozen. Split retry classification by layer. Prioritize local live drills. JS/TS remains counted. Python, Rust, and Zig remain non-counted exhibition beta. Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI. No production sandbox certification, direct-export migration, Component Model/WIT migration, counted non-JS promotion, or result/replay UX expansion is in scope.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 183 | v1.25 Contract Baseline and Execution-Side Drift Inventory | Rebaseline the frozen app contract and inventory execution-side drift risks before implementation. | BASE-01..BASE-06 | 5 |
| 184 | Retry and Non-Retry Lifecycle Semantics in Go Orchestration | Make Go retry classification deterministic, bounded, layer-aware, and public-safe. | RETRY-01..RETRY-07 | 5 |
| 185 | Runtime Unavailable and Stopped-Service Live Drills | Prove stopped runtime-service and unavailable-service behavior with local live drills. | DRILL-01..DRILL-06 | 5 |
| 186 | Malformed Runtime Result and Stale Artifact Failure Drills | Prove malformed runtime result and stale artifact paths fail closed with correct retry semantics. | FAIL-01..FAIL-07 | 5 |
| 187 | Runtime-Service Failure Envelope Translation Hardening | Harden runtime-service envelopes, redaction, and Go translation across failure modes. | RUNTIME-01..RUNTIME-06 | 5 |
| 188 | Persistence and Job Lifecycle Reliability Checks | Strengthen retry/job lifecycle idempotency, stale lease handling, completion safety, and MatchSet refresh reliability. | JOB-01..JOB-06 | 5 |
| 189 | Contract Compatibility Proof Against match-execution-app-v1 | Prove public execution outcomes remain compatible with the frozen app-facing contract and monitors. | COMPAT-01..COMPAT-06 | 5 |
| 190 | End-to-End Signed-In Execution Reliability Proof | Run signed-in local proof across JS/TS counted path, non-counted beta regressions, failure outcomes, pages, and privacy scans. | E2E-01..E2E-06 | 5 |
| 191 | Audit, Archive, Commit, and Tag | Review, validate, archive, commit, and tag v1.26. | CLOSE-01..CLOSE-05 | 5 |

## Phase Details

### Phase 183: v1.25 Contract Baseline and Execution-Side Drift Inventory

**Goal:** Rebaseline the frozen app contract and inventory execution-side drift risks before implementation.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success criteria:**
1. v1.25 freeze decision and `match-execution-app-v1` schemas are summarized as the compatibility target.
2. Inventory covers Go orchestration, runtime-service envelopes, job lifecycle, persistence, public evidence projection, fixtures, proof harnesses, and monitors.
3. Each surface is classified as frozen app contract, Go internal, runtime-service internal, persistence internal, owner/test-only, or intentionally unstable.
4. Inventory identifies current emitters of unavailable, degraded, system failure, malformed runtime result, stale artifact, timeout, retryable, and non-retryable evidence.
5. A no-contract-addition decision is recorded unless a backward-compatible addition is proven necessary.

### Phase 184: Retry and Non-Retry Lifecycle Semantics in Go Orchestration

**Goal:** Make Go retry classification deterministic, bounded, layer-aware, and public-safe.

**Requirements:** RETRY-01, RETRY-02, RETRY-03, RETRY-04, RETRY-05, RETRY-06, RETRY-07

**Success criteria:**
1. Retry classification table separates transport/envelope/system retryability from request/local validation, Strategy output, and artifact failures.
2. Go tests cover retryable below-limit, retryable exhausted, non-retryable terminal, stale lease, duplicate failure, and public-safe details.
3. Retry attempts are bounded by configured max attempts and cannot loop indefinitely.
4. Terminal retry exhaustion updates Match and MatchSet state once with public-safe failure evidence.
5. Public failure projection uses frozen lifecycle/failure categories without raw diagnostics.

### Phase 185: Runtime Unavailable and Stopped-Service Live Drills

**Goal:** Prove stopped runtime-service and unavailable-service behavior with local live drills.

**Requirements:** DRILL-01, DRILL-02, DRILL-03, DRILL-04, DRILL-05, DRILL-06

**Success criteria:**
1. Local stopped-runtime drill produces retryable unavailable behavior while attempts remain.
2. Exhausted unavailable-service drill produces terminal public-safe system failure evidence.
3. Drill evidence distinguishes service unavailable from Strategy failure and malformed runtime-output failures.
4. Repeated drills leave no orphaned running jobs, stale active leases, or duplicate terminal MatchSet refreshes.
5. Public result/replay pages remain compatible with `match-execution-app-v1` and pass privacy scans.

### Phase 186: Malformed Runtime Result and Stale Artifact Failure Drills

**Goal:** Prove malformed runtime result and stale artifact paths fail closed with correct retry semantics.

**Requirements:** FAIL-01, FAIL-02, FAIL-03, FAIL-04, FAIL-05, FAIL-06, FAIL-07

**Success criteria:**
1. Malformed runtime-service HTTP/envelope response drill remains retryable while attempts remain.
2. Malformed Strategy/runtime output drill becomes non-retryable Strategy/runtime-output evidence.
3. Stale WASM/WASI artifact drill fails closed without source fallback and projects public-safe `stale_artifact` evidence where supported.
4. Tests prove no Strategy execution was added to web/API/Go and deterministic engine boundaries remain intact.
5. Drill artifacts document retryability, terminality, degraded/unavailable status, and privacy-safe public evidence.

### Phase 187: Runtime-Service Failure Envelope Translation Hardening

**Goal:** Harden runtime-service envelopes, redaction, and Go translation across failure modes.

**Requirements:** RUNTIME-01, RUNTIME-02, RUNTIME-03, RUNTIME-04, RUNTIME-05, RUNTIME-06

**Success criteria:**
1. Runtime-service system failures remain schema-valid and limited to registered failure codes.
2. Raw diagnostics are redacted before Go persistence, job attempts, public evidence, and proof artifacts.
3. Go rejects unknown codes, non-contract fields, ABI drift, oversized responses, malformed JSON, and response drift safely.
4. Runtime violations inside successful Match execution remain distinguishable from service-level system failures.
5. Runtime-service boundary tests prove it has no persistence, job lifecycle, scoring, public evidence, or product route authority.

### Phase 188: Persistence and Job Lifecycle Reliability Checks

**Goal:** Strengthen retry/job lifecycle idempotency, stale lease handling, completion safety, and MatchSet refresh reliability.

**Requirements:** JOB-01, JOB-02, JOB-03, JOB-04, JOB-05, JOB-06

**Success criteria:**
1. Job claim, lease, heartbeat, retry queue, terminal failure, and completion paths are covered for stale/duplicate attempts.
2. Completion rejects stale lease tokens, terminal rewrites, duplicate Chronicle writes, and stale completion after terminal failure.
3. MatchSet refresh remains idempotent across retry, failure, degraded, complete, and no-result outcomes.
4. Failure detail persistence stores only allowlisted public-safe scalars.
5. Local Postgres integration coverage or equivalent live drill evidence is recorded.

### Phase 189: Contract Compatibility Proof Against match-execution-app-v1

**Goal:** Prove public execution outcomes remain compatible with the frozen app-facing contract and monitors.

**Requirements:** COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04, COMPAT-05, COMPAT-06

**Success criteria:**
1. Contract tests validate all public execution outcomes against `match-execution-app-v1`.
2. Outcome coverage includes complete, queued/running, degraded, unavailable runtime, system failure, timeout, malformed runtime result, stale artifact, strategy failure, missing Chronicle, and no-result.
3. Compatibility proof shows no required public DTO field removal or semantic narrowing.
4. Any optional addition is documented as necessary and backward-compatible; otherwise no addition is made.
5. Boundary monitors catch contract drift, ownership creep, Strategy execution in web/API/Go, privacy leaks, production fixture fallback, and premature promotion claims.

### Phase 190: End-to-End Signed-In Execution Reliability Proof

**Goal:** Run signed-in local proof across JS/TS counted path, non-counted beta regressions, failure outcomes, pages, and privacy scans.

**Requirements:** E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06

**Success criteria:**
1. Signed-in proof creates or reuses JS/TS counted revisions and proves counted execution still works.
2. Python, Rust, and Zig are exercised only as non-counted exhibition beta regression lanes.
3. Result and replay pages open for successful and available failure-drill outcomes.
4. Public pages and proof artifacts pass private-marker scans.
5. Proof records commands, topology, service states, MatchSet IDs, retry counts, outcome classifications, public links, and explicit non-promotion claims.

### Phase 191: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, archive, commit, and tag v1.26.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05

**Success criteria:**
1. Code review verifies retry classification, failure drills, redaction, persistence/job lifecycle idempotency, contract compatibility, and monitor changes.
2. Validation verifies all requirements, tests, live drills, signed-in proof, contract compatibility, privacy scans, and boundary monitors.
3. Final decision preserves frozen v1.25 contract, JS/TS counted path, non-JS beta-only status, Preview 1 JSON ABI, no sandbox certification, and no Strategy execution in web/API/Go.
4. Planning artifacts are archived and commit/tag evidence is recorded.
5. Retrospective records reliability lessons, remaining unstable internals, rollback clarity, and future promotion boundaries.

## Coverage

- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

## Next Up

All v1.26 phases 183-191 are complete and validated.

---
*Roadmap created: 2026-05-30 after v1.26 milestone initialization*
