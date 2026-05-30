# Requirements: Coward's Game v1.28

**Defined:** 2026-05-30
**Workstream:** `v1-28-match-execution-operations-recovery-and-incident-drills`
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Build the operational recovery layer on the execution side behind the frozen `match-execution-app-v1` boundary. Execution failures should become recoverable, auditable, and drillable through internal/operator controls without expanding the public result/replay contract except for strictly backward-compatible additions proven necessary.

## Baseline

- v1.26 is complete, committed, tagged `v1.26`, and archived.
- v1.27 is parallel work in a separate checkout and is not available to this milestone unless explicitly merged later.
- Active root `.planning/REQUIREMENTS.md` is absent; v1.28 requirements live in this workstream.
- `match-execution-app-v1` remains frozen.
- JS/TS remains the counted Strategy path.
- Python, Rust, and Zig remain non-counted exhibition beta only.
- Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry/recovery policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Strategy code must not execute in web/API/Go.
- Public result/replay outputs must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals by default.

## v1 Requirements

### Baseline and Operations Gap Inventory

- [x] **BASE-01**: Operator can inspect a v1.26 recovery baseline that proves `match-execution-app-v1` remains the compatibility target for v1.28.
- [x] **BASE-02**: Operator can inspect an operations gap inventory covering Go job lifecycle, runtime-service envelopes, persistence state, public projection, internal run-once controls, drill scripts, and boundary monitors.
- [x] **BASE-03**: Inventory distinguishes public contract surfaces from Go internal recovery policy, runtime-service internals, private operator evidence, persistence internals, test-only fixtures, and intentionally unstable implementation details.
- [x] **BASE-04**: Inventory records all current terminal and retryable execution failure categories, including runtime unavailable, timeout, malformed runtime result, stale artifact, generic system failure, stale lease, duplicate worker, and interrupted MatchSet execution.
- [x] **BASE-05**: Inventory records whether any backward-compatible public DTO addition is necessary; default outcome is no `match-execution-app-v1` change.
- [x] **BASE-06**: Baseline artifacts explicitly preserve JS/TS counted status, Python/Rust/Zig non-counted beta status, Preview 1 JSON ABI status, Go/runtime-service ownership, public-output privacy, and v1.27 independence.

### Dead-Letter and Quarantine Model

- [x] **QUAR-01**: Go-owned execution lifecycle can place exhausted retryable jobs and immediate non-retryable execution jobs into a deterministic private dead-letter or quarantine model.
- [x] **QUAR-02**: Quarantine state is bounded, queryable by operators, and tied to existing Match, MatchJob, MatchJobAttempt, MatchSet, and failure category data.
- [x] **QUAR-03**: Quarantine does not create a new public result/replay lifecycle state or expose operator-only details through `match-execution-app-v1`.
- [x] **QUAR-04**: Non-retryable malformed Strategy/runtime output and stale artifact failures fail closed and do not silently source-fallback, rebuild mutable artifacts, or retry as generic unavailable runtime failures.
- [x] **QUAR-05**: Quarantine records include redacted, allowlisted private evidence only and exclude source, memories, objectives, raw diagnostics, host paths, env values, tokens, DB details, package paths, and private runtime internals.
- [x] **QUAR-06**: Quarantine model is transactional with terminal job state and MatchSet refresh so derived private evidence cannot drift from source-of-truth execution state.
- [x] **QUAR-07**: Tests cover exhausted retryable quarantine, immediate non-retryable quarantine, stale artifact quarantine, duplicate quarantine attempts, and public projection compatibility.

### Internal Requeue and Rerun Controls

- [x] **OPS-01**: Operator can deterministically requeue eligible failed or quarantined execution jobs through Go-owned internal controls only.
- [x] **OPS-02**: Operator can deterministically rerun eligible Matches or Match execution attempts without changing Match seed, arena, immutable Strategy Revisions, or immutable artifact metadata.
- [x] **OPS-03**: Recovery controls are guarded by internal/operator authorization and are unavailable through public web/API product routes.
- [x] **OPS-04**: Recovery controls cannot duplicate Match completion, Chronicle persistence, MatchSet scoring/status refresh, public evidence projection, or job attempts under repeated requests.
- [x] **OPS-05**: Recovery controls reject completed Matches with existing public Chronicles unless an explicit future replacement-Match design is introduced outside this milestone.
- [x] **OPS-06**: Recovery controls preserve the Go/runtime-service split: Go owns recovery policy, while runtime-service owns only hostile Strategy execution envelopes.
- [x] **OPS-07**: Recovery actions write private audit evidence with deterministic action IDs or idempotency keys and redacted input/output summaries.
- [x] **OPS-08**: Tests cover eligible requeue, ineligible completed Match, duplicate operator request, stale artifact no-source-fallback, and MatchSet refresh idempotency.

### Live Failure-Drill Harness

- [x] **DRILL-01**: Local drill harness can exercise Go backend, runtime-service or fake runtime-service endpoint, local Postgres, and browser proof in a repeatable v1.28 command.
- [x] **DRILL-02**: Drill harness covers stopped runtime-service and unavailable runtime behavior without leaving orphaned running jobs or active stale leases.
- [x] **DRILL-03**: Drill harness covers malformed HTTP/envelope responses separately from malformed Strategy/runtime output.
- [x] **DRILL-04**: Drill harness covers stale artifact and timeout recovery paths without source fallback or public raw diagnostics.
- [x] **DRILL-05**: Drill harness records commands, service topology, seeded MatchSet or Match IDs, before/after job states, retry counts, public categories, private evidence paths, and cleanup status.
- [x] **DRILL-06**: Drill harness writes `.planning/artifacts/v1.28-match-execution-operations-proof.{json,md}` with schema version, contract version, ownership, non-claims, drill outcomes, and privacy scan results.
- [x] **DRILL-07**: Drill harness is deterministic enough for local repeat use and fails loudly when required local services or proof steps are unavailable.

### Stale Lease, Duplicate Worker, and Interrupted MatchSet Recovery

- [x] **LEASE-01**: Stale lease recovery remains deterministic and prevents simultaneous active workers for the same unexpired execution job.
- [x] **LEASE-02**: Duplicate worker and duplicate recovery attempts converge without double completion, duplicate Chronicles, duplicate scoring, or misleading MatchSet state.
- [x] **LEASE-03**: Stale lease tokens cannot complete, fail, requeue, or quarantine a job after a newer lease or terminal state exists.
- [x] **LEASE-04**: Interrupted MatchSet execution can be detected and recovered or quarantined without losing completed Match evidence or marking incomplete evidence as complete.
- [x] **LEASE-05**: MatchSet status refresh remains idempotent across complete, retrying, quarantined, failed_system, no-result, and mixed interrupted states.
- [x] **LEASE-06**: Local Postgres integration tests or live drills prove stale lease reclaim, duplicate worker prevention, interrupted MatchSet recovery, and terminal-state convergence.

### Operator Evidence and Redaction

- [ ] **EVID-01**: Operator-only evidence distinguishes public evidence, private operator audit evidence, runtime-service internal diagnostics, and test-only fixture proof.
- [ ] **EVID-02**: Operator-only evidence is available for internal recovery actions without becoming part of public result/replay DTOs.
- [ ] **EVID-03**: Evidence redaction uses allowlisted scalar fields and removes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, stderr, stacks, host paths, env values, tokens, DB details, package paths, and private runtime internals.
- [ ] **EVID-04**: Runtime-service raw diagnostics remain redacted before Go persistence, operator artifacts, public evidence, and proof artifacts.
- [ ] **EVID-05**: Private-marker scans cover public pages, public fixture/proof payloads, and operator evidence artifacts.
- [ ] **EVID-06**: Boundary checks ensure operator endpoints and evidence cannot be served by public app routes or fixture fallback in production mode.

### Contract Compatibility and Boundary Monitors

- [ ] **COMPAT-01**: Contract tests prove public execution outcomes still validate against `match-execution-app-v1`.
- [ ] **COMPAT-02**: Compatibility proof covers complete, queued/running, retrying, degraded/unavailable runtime, timeout, malformed runtime result, stale artifact, system failure, strategy failure, quarantined/private-only, interrupted MatchSet, missing Chronicle, and no-result outcomes.
- [ ] **COMPAT-03**: Proof shows no required public DTO field was removed, renamed, semantically narrowed, or repurposed for private operations state.
- [ ] **COMPAT-04**: Any optional public addition is documented as strictly backward-compatible, public-safe, and necessary; otherwise no public contract addition is made.
- [ ] **COMPAT-05**: Boundary monitors catch ownership creep, Strategy execution in web/API/Go, runtime-service recovery-policy ownership, TypeScript backend fallback, contract drift, privacy leaks, fixture fallback in production, and premature runtime promotion claims.
- [ ] **COMPAT-06**: Public result/replay pages remain compatible and private-safe for operations-driven outcomes.

### End-to-End Operations Recovery Proof

- [ ] **E2E-01**: Signed-in live proof creates or reuses eligible JS/TS counted Strategy Revisions and proves JS/TS counted execution still works after recovery changes.
- [ ] **E2E-02**: Signed-in proof exercises Python, Rust, and Zig only as non-counted exhibition beta regression lanes if local tooling is available; unavailable beta lanes fail loudly without promotion claims.
- [ ] **E2E-03**: Signed-in proof executes at least one operator recovery path and opens public result/replay pages for recovered or compatible failure outcomes.
- [ ] **E2E-04**: Signed-in proof verifies no public page or public artifact leaks Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
- [ ] **E2E-05**: Signed-in proof records operator action IDs, topology, service states, MatchSet IDs, retry/recovery counts, outcome classifications, public links, and private evidence paths.
- [ ] **E2E-06**: Signed-in proof explicitly states no result/replay UX expansion, runtime promotion, production sandbox certification, ABI migration, or counted non-JS claim is made.

### Audit and Closure

- [ ] **CLOSE-01**: Code review verifies quarantine, recovery controls, drill harness, stale lease handling, duplicate worker convergence, redaction, contract compatibility, and monitor changes.
- [ ] **CLOSE-02**: Validation verifies requirements, tests, live drills, signed-in proof, contract compatibility, privacy scans, public/private separation, and boundary monitors.
- [ ] **CLOSE-03**: Final milestone decision preserves frozen `match-execution-app-v1`, JS/TS counted path, non-JS beta-only status, Preview 1 JSON ABI, no production sandbox certification, no v1.27 dependency, and no Strategy execution in web/API/Go.
- [ ] **CLOSE-04**: v1.28 planning artifacts are archived, active workstream requirements are marked complete or removed at milestone close, and commit/tag evidence is recorded.
- [ ] **CLOSE-05**: Retrospective records operational recovery lessons, remaining unstable internals, rollback clarity, and future promotion boundaries.

## Future Requirements

### Operations Follow-Up

- **FUT-OPS-01**: Future public operations UI requires a separate app contract and privacy design; v1.28 is internal/operator-only.
- **FUT-OPS-02**: Future replacement Match or replacement MatchSet recovery requires a separate design for provenance, scoring, replay links, and public evidence.
- **FUT-OBS-01**: Future external observability or tracing integration requires separate token/path redaction, retention, and access-control proof.
- **FUT-SANDBOX-01**: Future production sandbox certification requires separate hostile-code, deployment, resource, isolation, observability, rollback, and abuse evidence.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Public result/replay UX expansion beyond compatibility proof pages | v1.28 is internal operations recovery behind a frozen app contract. |
| Public admin or operator dashboard | Internal controls and proof artifacts come first; public or product UI requires separate privacy design. |
| New Strategy language promotion | JS/TS remains counted; Python/Rust/Zig remain non-counted exhibition beta. |
| Production sandbox certification | Recovery drills do not prove production hostile-code isolation. |
| Direct-export or Component Model/WIT ABI migration | Preview 1 stdin/stdout JSON remains active until a future explicit promotion decision. |
| Counted non-JS play | Runtime eligibility remains unchanged. |
| Runtime-service backend or recovery ownership | Runtime-service owns hostile execution only; Go owns orchestration, lifecycle, scoring, public evidence, recovery policy, and promotion decisions. |
| TypeScript normal lifecycle fallback | TypeScript lifecycle persistence remains rollback/test/parity only. |
| Go/web/API Strategy execution | Hostile Strategy code must stay behind runtime-service / Runtime Broker boundaries. |
| Automatic mutable-source rebuild as recovery | Strategy Revisions and submitted artifacts remain immutable for Match execution. |
| Public raw diagnostics or private runtime internals | Public evidence must remain source-free and private-data safe. |
| v1.27 dependency | v1.27 is parallel work in another checkout and is not a baseline for this milestone. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 201 | Complete |
| BASE-02 | Phase 201 | Complete |
| BASE-03 | Phase 201 | Complete |
| BASE-04 | Phase 201 | Complete |
| BASE-05 | Phase 201 | Complete |
| BASE-06 | Phase 201 | Complete |
| QUAR-01 | Phase 202 | Complete |
| QUAR-02 | Phase 202 | Complete |
| QUAR-03 | Phase 202 | Complete |
| QUAR-04 | Phase 202 | Complete |
| QUAR-05 | Phase 202 | Complete |
| QUAR-06 | Phase 202 | Complete |
| QUAR-07 | Phase 202 | Complete |
| OPS-01 | Phase 203 | Complete |
| OPS-02 | Phase 203 | Complete |
| OPS-03 | Phase 203 | Complete |
| OPS-04 | Phase 203 | Complete |
| OPS-05 | Phase 203 | Complete |
| OPS-06 | Phase 203 | Complete |
| OPS-07 | Phase 203 | Complete |
| OPS-08 | Phase 203 | Complete |
| DRILL-01 | Phase 204 | Complete |
| DRILL-02 | Phase 204 | Complete |
| DRILL-03 | Phase 204 | Complete |
| DRILL-04 | Phase 204 | Complete |
| DRILL-05 | Phase 204 | Complete |
| DRILL-06 | Phase 204 | Complete |
| DRILL-07 | Phase 204 | Complete |
| LEASE-01 | Phase 205 | Complete |
| LEASE-02 | Phase 205 | Complete |
| LEASE-03 | Phase 205 | Complete |
| LEASE-04 | Phase 205 | Complete |
| LEASE-05 | Phase 205 | Complete |
| LEASE-06 | Phase 205 | Complete |
| EVID-01 | Phase 206 | Planned |
| EVID-02 | Phase 206 | Planned |
| EVID-03 | Phase 206 | Planned |
| EVID-04 | Phase 206 | Planned |
| EVID-05 | Phase 206 | Planned |
| EVID-06 | Phase 206 | Planned |
| COMPAT-01 | Phase 207 | Planned |
| COMPAT-02 | Phase 207 | Planned |
| COMPAT-03 | Phase 207 | Planned |
| COMPAT-04 | Phase 207 | Planned |
| COMPAT-05 | Phase 207 | Planned |
| COMPAT-06 | Phase 207 | Planned |
| E2E-01 | Phase 208 | Planned |
| E2E-02 | Phase 208 | Planned |
| E2E-03 | Phase 208 | Planned |
| E2E-04 | Phase 208 | Planned |
| E2E-05 | Phase 208 | Planned |
| E2E-06 | Phase 208 | Planned |
| CLOSE-01 | Phase 209 | Planned |
| CLOSE-02 | Phase 209 | Planned |
| CLOSE-03 | Phase 209 | Planned |
| CLOSE-04 | Phase 209 | Planned |
| CLOSE-05 | Phase 209 | Planned |

**Coverage:**
- v1 requirements: 57 total
- Complete: 34
- Planned: 23
- Mapped to phases: 57
- Unmapped: 0

---
*Requirements defined: 2026-05-30*
