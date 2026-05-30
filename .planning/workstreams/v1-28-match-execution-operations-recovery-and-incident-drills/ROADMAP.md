# Roadmap: Coward's Game v1.28

## Milestones

- [x] **v1.26 Match Execution Reliability, Retry Semantics, and Failure Drills** - Phases 183-191, shipped 2026-05-30 with `match-execution-app-v1` preserved and Go/runtime-service reliability hardened.
- [ ] **v1.28 Match Execution Operations, Recovery, and Incident Drills** - Phases 201-209, active in workstream `v1-28-match-execution-operations-recovery-and-incident-drills`.

## Active Milestone

**v1.28 Match Execution Operations, Recovery, and Incident Drills**

**Goal:** Build the internal operational recovery layer on the execution side behind the frozen `match-execution-app-v1` boundary so execution failures are recoverable, auditable, and drillable without expanding public result/replay contracts except for strictly backward-compatible additions proven necessary.

**Decision baseline:** Base this work on v1.26 only; do not assume v1.27. Keep `match-execution-app-v1` frozen by default. Go owns recovery policy, persistence-facing lifecycle, Match lifecycle, scoring, public evidence, and promotion decisions. Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes. JS/TS remains counted. Python, Rust, and Zig remain non-counted exhibition beta. Preview 1 stdin/stdout JSON remains the active WASM/WASI ABI. No production sandbox certification, ABI migration, counted non-JS promotion, or public result/replay UX expansion is in scope.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 201 | v1.26 Recovery Baseline and Operations Gap Inventory | Lock the v1.26 baseline, v1.28 non-goals, and current execution recovery gaps before implementation. | BASE-01..BASE-06 | Complete |
| 202 | Dead-Letter and Quarantine Model | Add deterministic private dead-letter/quarantine semantics for exhausted and non-retryable execution jobs. | QUAR-01..QUAR-07 | Complete |
| 203 | Internal Requeue and Rerun Controls | Add Go-owned operator recovery controls with idempotency guards and no duplicate public evidence. | OPS-01..OPS-08 | Complete |
| 204 | Live Failure-Drill Harness | Build repeatable local drills across Postgres, Go backend, runtime-service/fakes, and browser proof. | DRILL-01..DRILL-07 | 5 |
| 205 | Stale Lease, Duplicate Worker, and Interrupted MatchSet Recovery | Prove stale leases, duplicate workers, and interrupted MatchSets converge without double completion or stale scoring. | LEASE-01..LEASE-06 | 5 |
| 206 | Operator Evidence and Redaction Hardening | Separate operator-only evidence from public evidence and harden redaction across artifacts and endpoints. | EVID-01..EVID-06 | 5 |
| 207 | Contract Compatibility and Boundary Monitors | Prove every public outcome still validates against `match-execution-app-v1` and monitors catch boundary drift. | COMPAT-01..COMPAT-06 | 5 |
| 208 | End-to-End Signed-In Operations Recovery Proof | Run signed-in local proof across counted JS/TS, beta regression lanes where available, operator recovery, public pages, and privacy scans. | E2E-01..E2E-06 | 5 |
| 209 | Audit, Archive, Commit, and Tag | Review, validate, archive, commit, and tag v1.28. | CLOSE-01..CLOSE-05 | 5 |

## Phase Details

### Phase 201: v1.26 Recovery Baseline and Operations Gap Inventory

**Goal:** Lock the v1.26 baseline, v1.28 non-goals, and current execution recovery gaps before implementation.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success criteria:**
1. v1.26 proof, `match-execution-app-v1`, and current Go/runtime-service ownership are summarized as the compatibility and ownership baseline.
2. Inventory covers job lifecycle, runtime-service envelopes, persistence state, public projection, internal run-once controls, proof scripts, and monitors.
3. Every surface is classified as public contract, Go internal, runtime-service internal, private operator evidence, persistence internal, test-only, or intentionally unstable.
4. Current gaps for dead-letter/quarantine, recovery controls, stale leases, duplicate workers, interrupted MatchSets, and operator evidence are identified.
5. A no-public-contract-change default decision and v1.27 independence note are recorded.

### Phase 202: Dead-Letter and Quarantine Model

**Goal:** Add deterministic private dead-letter/quarantine semantics for exhausted and non-retryable execution jobs.

**Requirements:** QUAR-01, QUAR-02, QUAR-03, QUAR-04, QUAR-05, QUAR-06, QUAR-07

**Success criteria:**
1. Exhausted retryable jobs and immediate non-retryable jobs can enter private quarantine deterministically.
2. Quarantine records tie to Match, MatchJob, attempts, MatchSet impact, and failure categories without replacing source-of-truth lifecycle state.
3. Public result/replay projection remains inside frozen compatibility categories.
4. Stale artifact and malformed Strategy/runtime-output paths fail closed without source fallback or mutable rebuild.
5. Tests cover quarantine, duplicate quarantine, redaction, transactionality, and public projection compatibility.

### Phase 203: Internal Requeue and Rerun Controls

**Goal:** Add Go-owned operator recovery controls with idempotency guards and no duplicate public evidence.

**Requirements:** OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07, OPS-08

**Success criteria:**
1. Internal controls can requeue eligible failed/quarantined jobs and rerun eligible execution attempts through Go-owned policy.
2. Controls are internal-token gated and unavailable through public product routes.
3. Repeated recovery requests are idempotent and record deterministic action IDs or idempotency keys.
4. Completed Matches with Chronicles are rejected from same-Match rerun in v1.28.
5. Tests prove no duplicate completion, Chronicle persistence, MatchSet scoring/status refresh, job attempts, or public evidence.

### Phase 204: Live Failure-Drill Harness

**Goal:** Build repeatable local drills across Postgres, Go backend, runtime-service/fakes, and browser proof.

**Requirements:** DRILL-01, DRILL-02, DRILL-03, DRILL-04, DRILL-05, DRILL-06, DRILL-07

**Success criteria:**
1. A v1.28 command can run local operations drills and write JSON/Markdown proof artifacts.
2. Drills cover stopped runtime-service, unavailable runtime, malformed envelopes, malformed runtime output, stale artifacts, and timeouts.
3. Drills record topology, commands, IDs, before/after states, retry counts, public categories, private evidence paths, and cleanup status.
4. Required local service gaps fail loudly with public-safe diagnostics.
5. Proof artifacts include contract version, ownership, non-claims, drill outcomes, and privacy scans.

### Phase 205: Stale Lease, Duplicate Worker, and Interrupted MatchSet Recovery

**Goal:** Prove stale leases, duplicate workers, and interrupted MatchSets converge without double completion or stale scoring.

**Requirements:** LEASE-01, LEASE-02, LEASE-03, LEASE-04, LEASE-05, LEASE-06

**Success criteria:**
1. Unexpired jobs cannot be claimed by duplicate workers or operator recovery paths.
2. Expired leases can be reclaimed deterministically and stale tokens cannot complete, fail, requeue, or quarantine.
3. Duplicate worker/recovery attempts converge to one terminal outcome.
4. Interrupted MatchSets preserve completed Match evidence and identify incomplete or quarantined evidence honestly.
5. Local Postgres tests or live drills prove MatchSet refresh idempotency across mixed complete, retrying, failed, quarantined, and no-result states.

### Phase 206: Operator Evidence and Redaction Hardening

**Goal:** Separate operator-only evidence from public evidence and harden redaction across artifacts and endpoints.

**Requirements:** EVID-01, EVID-02, EVID-03, EVID-04, EVID-05, EVID-06

**Success criteria:**
1. Evidence model distinguishes public evidence, private operator audit evidence, runtime-service internals, and test-only fixture proof.
2. Operator artifacts use allowlisted scalar evidence and exclude private Strategy/runtime data.
3. Runtime-service diagnostics are redacted before Go persistence, operator artifacts, public evidence, and proof artifacts.
4. Private-marker scans cover public pages, public payloads, proof artifacts, and operator evidence artifacts.
5. Boundary checks prevent public app routes, public DTOs, or production fixture fallback from serving private operations evidence.

### Phase 207: Contract Compatibility and Boundary Monitors

**Goal:** Prove every public outcome still validates against `match-execution-app-v1` and monitors catch boundary drift.

**Requirements:** COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04, COMPAT-05, COMPAT-06

**Success criteria:**
1. Contract tests cover complete, queued/running, retrying, degraded/unavailable, timeout, malformed runtime result, stale artifact, system failure, strategy failure, quarantined/private-only, interrupted MatchSet, missing Chronicle, and no-result outcomes.
2. Proof shows no required public DTO field removal, rename, semantic narrowing, or private state repurposing.
3. Any optional public addition is explicitly documented as necessary and backward-compatible; otherwise no addition is made.
4. Boundary monitors catch contract drift, ownership creep, Strategy execution in web/API/Go, runtime-service recovery ownership, TypeScript backend fallback, privacy leaks, fixture fallback in production, and premature promotion claims.
5. Public result/replay pages remain compatible and private-safe for operations-driven outcomes.

### Phase 208: End-to-End Signed-In Operations Recovery Proof

**Goal:** Run signed-in local proof across counted JS/TS, beta regression lanes where available, operator recovery, public pages, and privacy scans.

**Requirements:** E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06

**Success criteria:**
1. Signed-in proof proves JS/TS counted execution still works after recovery changes.
2. Python, Rust, and Zig are exercised only as non-counted exhibition beta regression lanes when local tooling supports them.
3. At least one operator recovery path is executed and linked to public result/replay compatibility proof.
4. Public pages and public artifacts pass private-marker scans.
5. Proof records operator action IDs, topology, service states, MatchSet IDs, retry/recovery counts, outcome classifications, public links, private evidence paths, and explicit non-claims.

### Phase 209: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, archive, commit, and tag v1.28.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05

**Success criteria:**
1. Code review verifies quarantine, recovery controls, drills, stale lease handling, duplicate worker convergence, redaction, compatibility, and monitors.
2. Validation verifies requirements, tests, live drills, signed-in proof, contract compatibility, privacy scans, public/private separation, and boundary monitors.
3. Final decision preserves the frozen app contract, JS/TS counted path, beta-only non-JS status, Preview 1 JSON ABI, no sandbox certification, no v1.27 dependency, and no Strategy execution in web/API/Go.
4. Planning artifacts are archived and commit/tag evidence is recorded.
5. Retrospective records operational recovery lessons, remaining unstable internals, rollback clarity, and future promotion boundaries.

## Coverage

- v1 requirements: 57 total
- Complete: 21
- Planned: 36
- Mapped to phases: 57
- Unmapped: 0

## Next Up

**Phase 204: Live Failure-Drill Harness** - Build repeatable local drills across Postgres, Go backend, runtime-service/fakes, and browser proof.

Suggested next command:

`$gsd-discuss-phase 204 --ws v1-28-match-execution-operations-recovery-and-incident-drills`

---
*Roadmap created: 2026-05-30 after v1.28 milestone initialization*
