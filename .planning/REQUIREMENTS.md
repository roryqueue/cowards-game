# Requirements: Coward's Game

**Defined:** 2026-05-25
**Milestone:** v1.19 Runtime Isolation Readiness and Exhibition Beta Trust
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline And Candidate Contract

- [ ] **BASE-01**: Developer can inspect a v1.19 baseline that treats v1.18 as the floor and preserves normal topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementations.
- [ ] **BASE-02**: Developer can inspect an explicit candidate contract comparing hardened subprocess, normal container, and gVisor/runsc-style runtime isolation candidates.
- [ ] **BASE-03**: Developer can inspect an evidence taxonomy that separates local readiness evidence, required hostile probe evidence, unsupported/skipped candidate evidence, and production sandbox certification.
- [ ] **BASE-04**: Developer can verify JS/TS Strategy support remains intact through the broker/runtime ABI while Python remains runtime-only and non-counted.
- [ ] **BASE-05**: Developer can verify the milestone excludes Python ranked/ladder/counted eligibility, arbitrary package installs, Python backend ownership, and production sandbox claims unless stronger proof genuinely passes.

### Hostile Probe Matrix

- [ ] **PROBE-01**: Developer can run filesystem and host-path probes that fail closed and redact host paths from public diagnostics.
- [ ] **PROBE-02**: Developer can run network, DNS, and socket probes that fail closed for runtime candidates claiming network denial.
- [ ] **PROBE-03**: Developer can run process, shell, subprocess, fork, and signal probes that fail closed without executing Strategy code in web/API/Go.
- [ ] **PROBE-04**: Developer can run import, package, dynamic-code, and arbitrary dependency probes that preserve the self-contained-source-only Python package policy.
- [ ] **PROBE-05**: Developer can run environment, token, DB DSN, and local secret probes that fail closed and redact private values.
- [ ] **PROBE-06**: Developer can run output pressure, memory pressure, timeout, crash, malformed IPC, stderr, and stack probes with deterministic failure taxonomy.
- [ ] **PROBE-07**: Developer can run no-fallback drills proving stopped runtime-service, stopped Python runtime, and unavailable stronger candidates fail loudly instead of routing through JS/TS fallback, Go, web/API, stale fixtures, or TypeScript backend behavior.

### Candidate Execution Evidence

- [ ] **CAND-01**: Developer can inspect hardened subprocess evidence for launch flags, empty environment, no shell, timeout/output caps, cleanup, and deterministic metadata.
- [ ] **CAND-02**: Developer can inspect container candidate evidence for read-only filesystem, network denial, tmpfs/write surfaces, capability drops, PID limits, memory/CPU limits, and unsupported local runtime behavior.
- [ ] **CAND-03**: Developer can inspect gVisor/runsc-style candidate evidence that distinguishes OCI compatibility, syscall/interposition benefits, local availability, overhead, and unsupported behavior.
- [ ] **CAND-04**: Developer can compare candidate proof results side by side, including what each candidate proves, does not prove, and would need before promotion.
- [ ] **CAND-05**: Developer can require candidate-specific live evidence in a command lane that fails loudly if the candidate is skipped, stale, unavailable, or silently substituted.
- [ ] **CAND-06**: Developer can verify candidate artifacts and user-facing labels never claim production sandbox certification unless the proof genuinely supports it.

### Monitors, Topology, And Privacy Gates

- [ ] **MON-01**: Developer can run monitors that fail on runtime ABI drift, runtime registry drift, broker selection drift, and schema envelope drift.
- [ ] **MON-02**: Developer can run monitors that fail on sandbox authority drift, candidate evidence drift, unsupported candidate mislabeling, and production-sandbox overclaiming.
- [ ] **MON-03**: Developer can run monitors that fail on backend ownership creep, route ownership creep, persistence access, job lifecycle ownership, Match completion ownership, scoring ownership, public evidence ownership, or silent fallback.
- [ ] **MON-04**: Developer can run privacy checks that fail on Strategy source, StrategyMemory, SoldierMemory, objective payload, owner debug, raw Awareness Grid, stderr, stack, host path, package path, token, DB DSN, session, or private runtime leak markers.
- [ ] **MON-05**: Developer can run JS/TS regression tests for validation, runtime execution, counted eligibility, MatchSet creation, result evidence, and replay safety.
- [ ] **MON-06**: Developer can run topology checks for web -> Go -> Runtime Broker -> runtime implementation and distinguish fixture-mode parity from live signed-in proof data.

### Python Exhibition Beta Trust

- [ ] **BETA-01**: User can clearly see Python labeled as "non-counted exhibition beta" anywhere Python Strategy creation, selection, validation, MatchSet creation, result, or replay evidence appears.
- [ ] **BETA-02**: User can create and save Python Strategy Revisions with validation messages that are actionable, public-safe, and explicit about unsupported imports/packages/capabilities.
- [ ] **BETA-03**: User can use credible sample Python Strategies that demonstrate valid Strategy API behavior without filesystem, network, package, process, environment, or private-data access.
- [ ] **BETA-04**: User can understand why a Python Strategy is eligible for non-counted exhibition beta but ineligible for ranked, ladder, counted, or gauntlet evidence.
- [ ] **BETA-05**: Developer can verify Python revision metadata, validation status, package policy, artifact hash, runtime adapter metadata, and eligibility flags are immutable for submitted MatchSet entries.
- [ ] **BETA-06**: Developer can verify JS/TS authoring, validation, counted eligibility, and exhibition behavior are not regressed by Python exhibition beta trust improvements.

### MatchSet Result And Replay Trust

- [ ] **EVID-01**: User can open a non-counted Python exhibition MatchSet result and see safe runtime path, language/runtime labels, counted status, and explanation text.
- [ ] **EVID-02**: User can open replay evidence and see clear non-counted exhibition beta cues without private Strategy source, memory, objective, stderr, stack, host path, or runtime internals.
- [ ] **EVID-03**: Developer can verify public MatchSet summaries and replay evidence remain private-data safe across successful, runtime-violating, degraded, and system-failed outcomes.
- [ ] **EVID-04**: Developer can verify owner-source privacy remains intact: public proof outputs never expose account-owned JS/TS or Python source.
- [ ] **EVID-05**: Developer can verify replay board evidence remains plausible and in bounds for the signed-in proof.

### Signed-In End-To-End Proof

- [ ] **PROOF-01**: User can create or sign into a local account.
- [ ] **PROOF-02**: User can create and save a JS/TS Strategy Revision.
- [ ] **PROOF-03**: User can create and save one or more Python Strategy Revisions.
- [ ] **PROOF-04**: User can create a non-counted exhibition MatchSet using Python against JS/TS or Python.
- [ ] **PROOF-05**: Developer can verify Match execution flows through Go -> Runtime Broker -> isolated runtime implementation.
- [ ] **PROOF-06**: User can open MatchSet result evidence with clear non-counted exhibition beta labels.
- [ ] **PROOF-07**: User can open replay evidence with clear trust cues and plausible board state.
- [ ] **PROOF-08**: Developer can verify the proof's public outputs remain private-data safe and contain no runtime fallback, ownership, or privacy regressions.

### Completion And Promotion

- [ ] **EXIT-01**: Developer can inspect v1.19 artifacts for baseline, candidate comparison, hostile probes, candidate evidence, monitor results, beta UX trust, public evidence, signed-in proof, and privacy checks.
- [ ] **EXIT-02**: Developer can inspect a promotion decision stating Python remains non-counted exhibition beta unless explicit future counted-play gates pass.
- [ ] **EXIT-03**: Developer can inspect a promotion decision stating runtime isolation remains readiness evidence unless stronger production-grade proof genuinely passes.
- [ ] **EXIT-04**: Developer can run final verification across runtime-python, runtime-js/runtime-service, spec/contracts, Go backend, web, topology, boundary monitors, privacy, JS/TS regression, and signed-in browser proof.
- [ ] **EXIT-05**: Developer can archive requirements/roadmap/phases, remove active `.planning/REQUIREMENTS.md`, update PROJECT/STATE/MILESTONES/RETROSPECTIVE, and tag `v1.19`.

## Future Requirements

- **RTP-01**: Promote Python to ranked/counted play only after explicit production sandbox, package, determinism, rollback, replay, privacy, abuse, and governance criteria pass.
- **RTP-02**: Promote a container, gVisor, microVM, WASM/WASI, or component-model runtime only after required live hostile probes, operational proof, rollback behavior, and public claim review pass.
- **PKG-01**: Add arbitrary PyPI/package installs only after reproducible supply-chain, lockfile, native-extension, sandbox install/build, and vulnerability policy exists.
- **OPS-01**: Add cloud/Kubernetes/service-mesh/production observability only in a future ops milestone with deployment-specific evidence.
- **LANG-01**: Add broad multi-language product support only after language onboarding, compatibility, documentation, runtime policy, and counted eligibility semantics are separately planned.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Python ranked/ladder/counted play | Requires explicit future promotion gates and production-grade isolation evidence. |
| Arbitrary PyPI/package installs | Supply-chain, native extension, lockfile, and sandbox installation risks are outside v1.19. |
| Production sandbox certification | v1.19 strengthens readiness evidence and honesty; it does not overclaim. |
| Replacing JS/TS support | JS/TS remains the counted Strategy path through the broker/runtime ABI. |
| Python backend ownership | Violates the runtime-only boundary and Go-owned orchestration model. |
| Silent fallback | Hides runtime failures and invalidates readiness evidence. |
| Broad language marketplace | v1.19 improves Python exhibition beta trust only. |
| Cloud deployment/Kubernetes/service mesh | Local readiness and signed-in proof are the milestone focus. |
| Go/web/API Strategy execution | Strategy code must execute only behind schema-validated runtime ABI envelopes. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 124 | Pending |
| BASE-02 | Phase 124 | Pending |
| BASE-03 | Phase 124 | Pending |
| BASE-04 | Phase 124 | Pending |
| BASE-05 | Phase 124 | Pending |
| PROBE-01 | Phase 125 | Pending |
| PROBE-02 | Phase 125 | Pending |
| PROBE-03 | Phase 125 | Pending |
| PROBE-04 | Phase 125 | Pending |
| PROBE-05 | Phase 125 | Pending |
| PROBE-06 | Phase 125 | Pending |
| PROBE-07 | Phase 125 | Pending |
| CAND-01 | Phase 126 | Pending |
| CAND-02 | Phase 126 | Pending |
| CAND-03 | Phase 126 | Pending |
| CAND-04 | Phase 126 | Pending |
| CAND-05 | Phase 126 | Pending |
| CAND-06 | Phase 126 | Pending |
| MON-01 | Phase 127 | Pending |
| MON-02 | Phase 127 | Pending |
| MON-03 | Phase 127 | Pending |
| MON-04 | Phase 127 | Pending |
| MON-05 | Phase 127 | Pending |
| MON-06 | Phase 127 | Pending |
| BETA-01 | Phase 128 | Pending |
| BETA-02 | Phase 128 | Pending |
| BETA-03 | Phase 128 | Pending |
| BETA-04 | Phase 128 | Pending |
| BETA-05 | Phase 128 | Pending |
| BETA-06 | Phase 128 | Pending |
| EVID-01 | Phase 129 | Pending |
| EVID-02 | Phase 129 | Pending |
| EVID-03 | Phase 129 | Pending |
| EVID-04 | Phase 129 | Pending |
| EVID-05 | Phase 129 | Pending |
| PROOF-01 | Phase 130 | Pending |
| PROOF-02 | Phase 130 | Pending |
| PROOF-03 | Phase 130 | Pending |
| PROOF-04 | Phase 130 | Pending |
| PROOF-05 | Phase 130 | Pending |
| PROOF-06 | Phase 130 | Pending |
| PROOF-07 | Phase 130 | Pending |
| PROOF-08 | Phase 130 | Pending |
| EXIT-01 | Phase 131 | Pending |
| EXIT-02 | Phase 131 | Pending |
| EXIT-03 | Phase 131 | Pending |
| EXIT-04 | Phase 131 | Pending |
| EXIT-05 | Phase 131 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.19 milestone initialization*
