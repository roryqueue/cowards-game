# Requirements: Coward's Game

**Defined:** 2026-05-25
**Milestone:** v1.20 Runtime Sandbox Candidate and Exhibition Reliability Proof
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline, Candidate Decision, And Budget Contract

- [x] **BASE-01**: Developer can inspect a v1.20 baseline that treats v1.19 as the floor and preserves normal topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementations.
- [x] **BASE-02**: Developer can inspect a candidate decision that selects Docker/container subprocess as the primary executable stronger lane because Docker is locally available.
- [x] **BASE-03**: Developer can inspect a fail-loud gVisor/runsc decision that records `runsc` as unavailable unless it is genuinely installed and executing probes.
- [x] **BASE-04**: Developer can inspect a timeout budget contract separating Strategy call, Match execution, MatchSet/job orchestration, runtime-service HTTP, and browser proof budgets.
- [x] **BASE-05**: Developer can verify the milestone excludes Python counted play, arbitrary packages, Python backend ownership, silent fallback, unbounded local stress tests, and production sandbox certification unless evidence genuinely supports it.

### Executable Container Candidate Lane

- [x] **CAND-01**: Developer can run an executable Docker/container subprocess candidate lane that executes the hostile probe matrix under the real container adapter when Docker is available.
- [x] **CAND-02**: Developer can inspect container evidence for `--network none`, read-only root filesystem, tmpfs scratch, dropped capabilities, no-new-privileges, PID limits, memory limits, CPU limits, no shell, and strict JSON IPC.
- [x] **CAND-03**: Developer can inspect container preflight evidence that distinguishes Docker unavailable, image unavailable, daemon failure, unsupported resource controls, adapter failure, Strategy violation, and system failure.
- [x] **CAND-04**: Developer can compare hardened subprocess and container candidate evidence side by side, including latency, pass/fail/skip counts, failure taxonomy, and non-promotion limits.
- [x] **CAND-05**: Developer can require container evidence in a command lane that fails loudly if the candidate is skipped, stale, unavailable, or silently substituted.
- [x] **CAND-06**: Developer can inspect gVisor/runsc strict-lane evidence that fails loudly when `runsc` is unavailable or no runsc adapter executes probes.
- [x] **CAND-07**: Developer can verify candidate artifacts and public language never claim production sandbox certification from Docker/container evidence alone.

### Hostile Probe And No-Fallback Parity

- [x] **PROBE-01**: Developer can run filesystem, host-path, read-only-root, tmpfs/write, and package-path probes across hardened subprocess and container lanes where practical.
- [x] **PROBE-02**: Developer can run network, DNS, socket, localhost, metadata IP, and proxy probes against container lanes that claim network denial.
- [x] **PROBE-03**: Developer can run process, shell, subprocess, fork, signal, environment, token, DB DSN, and local secret probes without executing Strategy code in web/API/Go.
- [x] **PROBE-04**: Developer can run import, package, dynamic-code, source-size, output-pressure, memory-pressure, timeout, crash, malformed IPC, stderr, stack, and schema-invalid output probes with deterministic failure taxonomy.
- [x] **PROBE-05**: Developer can verify public diagnostics redact source, memory, objectives, stderr, stacks, host paths, package paths, environment values, tokens, DB DSNs, sessions, and private runtime internals.
- [x] **PROBE-06**: Developer can run no-fallback drills for stopped runtime-service, stopped Python runtime, Docker unavailable, container image unavailable, runsc unavailable, stale artifacts, and candidate substitution.
- [x] **PROBE-07**: Developer can run monitors that fail on runtime ABI drift, registry drift, broker selection drift, candidate evidence drift, production overclaiming, backend ownership creep, and JS/TS regression.

### Timeout, Latency, And Reliability Budgets

- [x] **BUDGET-01**: Developer can inspect the configured deterministic per-Strategy execution caps for JS/TS and Python and verify they are not loosened to hide latency.
- [x] **BUDGET-02**: Developer can inspect whole-Match execution timeout behavior separately from per-Strategy call timeouts.
- [x] **BUDGET-03**: Developer can inspect MatchSet/job orchestration timeout and retry budgets for queued, running, completed, degraded, strategy-failed, and system-failed states.
- [x] **BUDGET-04**: Developer can inspect runtime-service HTTP timeout behavior and verify Go reports runtime-service timeouts without executing Strategy code or silently falling back.
- [x] **BUDGET-05**: Developer can inspect browser proof timeout budgets and verify they are bounded and justified by measured local proof behavior.
- [x] **BUDGET-06**: Developer can measure JS/TS-vs-Python and Python-vs-Python exhibition MatchSet latency with bounded repeat counts and recorded local environment metadata.
- [x] **BUDGET-07**: Developer can inspect latency evidence that separates cold-start, per-call runtime, whole-Match, job orchestration, result page, and replay page timings where practical.

### Exhibition Execution Reliability And Retry Semantics

- [x] **REL-01**: User can create repeated signed-in non-counted exhibition MatchSets involving Python without spurious runtime-service timeouts under the documented local proof budget.
- [x] **REL-02**: Developer can verify Python exhibition latency is reduced or stabilized where practical without weakening deterministic Strategy caps, schema validation, or runtime isolation boundaries.
- [x] **REL-03**: Developer can verify Strategy-caused runtime violations are not blindly retried as system failures.
- [x] **REL-04**: Developer can verify retryable runtime-service, Docker/container, or orchestration system failures are classified separately from player-caused Strategy failures.
- [x] **REL-05**: Developer can verify MatchSet completion, scoring, public status refresh, and replay availability remain Go-owned across success, degraded, timeout, and failure paths.
- [x] **REL-06**: Developer can verify JS/TS validation, runtime execution, counted eligibility, exhibition creation, result evidence, and replay safety remain intact.

### Degraded-State UX And Public-Safe Evidence

- [x] **UX-01**: User can understand when a Python exhibition MatchSet is queued, running, slow, completed, degraded, timed out, strategy-failed, or system-failed.
- [x] **UX-02**: User can see retry/no-retry wording that distinguishes Strategy errors from retryable system/runtime-service/container failures.
- [x] **UX-03**: User can open MatchSet result evidence and see safe language/runtime labels, non-counted status, timeout budget cues, candidate lane evidence, and evidence limits.
- [x] **UX-04**: User can open replay evidence and see non-counted exhibition beta cues, degraded/timeout context when applicable, and plausible in-bounds board state.
- [x] **UX-05**: Developer can verify public MatchSet/replay outputs remain private-data safe across success, running, degraded, timeout, strategy-failed, and system-failed outcomes.
- [x] **UX-06**: Developer can verify owner-source privacy remains intact for account-owned JS/TS and Python revisions.

### Signed-In Reliability Proof

- [x] **PROOF-01**: User can create or sign into a local account.
- [x] **PROOF-02**: User can create and save one JS/TS Strategy Revision.
- [x] **PROOF-03**: User can create and save two Python Strategy Revisions.
- [x] **PROOF-04**: User can create non-counted mixed JS/TS-vs-Python and Python-vs-Python exhibition MatchSets.
- [x] **PROOF-05**: Developer can verify Match execution flows through Go -> Runtime Broker/runtime-service -> selected runtime implementation(s), including the selected candidate lane where required.
- [x] **PROOF-06**: User can open MatchSet result and replay evidence and verify labels, reliability evidence, candidate lane evidence, degraded/timeout wording where applicable, and plausible board state.
- [x] **PROOF-07**: Developer can verify the proof public outputs remain private-data safe and contain no silent fallback, ownership drift, Python counted eligibility, or JS/TS regression.

### Completion And Promotion

- [ ] **EXIT-01**: Developer can inspect v1.20 artifacts for baseline, candidate decision, executable container evidence, runsc fail-loud evidence, hostile probes, no-fallback drills, timeout budgets, latency measurements, degraded UX, public evidence, signed-in proof, and privacy checks.
- [ ] **EXIT-02**: Developer can inspect a promotion decision stating Python remains non-counted exhibition beta unless explicit future counted-play gates pass.
- [ ] **EXIT-03**: Developer can inspect a promotion decision stating runtime isolation remains readiness evidence unless stronger production-grade proof genuinely passes.
- [ ] **EXIT-04**: Developer can run final verification across runtime-python, runtime-js/runtime-service, spec/contracts, Go backend, web, topology, boundary monitors, privacy, container candidate evidence, JS/TS regression, and signed-in browser proof.
- [ ] **EXIT-05**: Developer can archive requirements/roadmap/phases, remove active `.planning/REQUIREMENTS.md`, update PROJECT/STATE/MILESTONES/RETROSPECTIVE, audit cleanly, commit, and tag `v1.20`.

## Future Requirements

- **RTP-01**: Promote Python to ranked/counted play only after explicit production sandbox, package, determinism, rollback, replay, privacy, abuse, and governance criteria pass.
- **RTP-02**: Promote Docker/container subprocess to production sandbox status only after required live hostile probes, operational hardening, image provenance, deployment preflight, rollback behavior, and public claim review pass.
- **RTP-03**: Promote gVisor/runsc only after local or CI availability, executable adapter implementation, hostile probe evidence, operational proof, and rollback behavior pass.
- **PKG-01**: Add arbitrary PyPI/package installs only after reproducible supply-chain, lockfile, native-extension, sandbox install/build, and vulnerability policy exists.
- **OPS-01**: Add cloud/Kubernetes/service-mesh/production observability only in a future ops milestone with deployment-specific evidence.
- **LANG-01**: Add broad multi-language product support only after language onboarding, compatibility, documentation, runtime policy, and counted eligibility semantics are separately planned.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Python ranked/ladder/counted play | Requires explicit future promotion gates and production-grade isolation evidence. |
| Arbitrary PyPI/package installs | Supply-chain, native extension, lockfile, and sandbox installation risks are outside v1.20. |
| Production sandbox certification | v1.20 makes one stronger candidate executable and honest; it does not overclaim. |
| Replacing JS/TS support | JS/TS remains the counted Strategy path through the broker/runtime ABI. |
| Python backend ownership | Violates the runtime-only boundary and Go-owned orchestration model. |
| Silent fallback | Hides runtime failures and invalidates readiness and reliability evidence. |
| Passing gVisor/runsc without runsc | `runsc` is unavailable locally; strict lanes must fail loudly until real proof exists. |
| Broad language marketplace | v1.20 improves Python exhibition beta reliability only. |
| Cloud deployment/Kubernetes/service mesh | Local candidate and signed-in reliability proof are the milestone focus. |
| Go/web/API Strategy execution | Strategy code must execute only behind schema-validated runtime ABI envelopes. |
| Unbounded stress testing | Reliability evidence must be bounded, repeatable, and safe for local development. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 132 | Complete |
| BASE-02 | Phase 132 | Complete |
| BASE-03 | Phase 132 | Complete |
| BASE-04 | Phase 132 | Complete |
| BASE-05 | Phase 132 | Complete |
| CAND-01 | Phase 133 | Complete |
| CAND-02 | Phase 133 | Complete |
| CAND-03 | Phase 133 | Complete |
| CAND-04 | Phase 133 | Complete |
| CAND-05 | Phase 133 | Complete |
| CAND-06 | Phase 133 | Complete |
| CAND-07 | Phase 133 | Complete |
| PROBE-01 | Phase 134 | Complete |
| PROBE-02 | Phase 134 | Complete |
| PROBE-03 | Phase 134 | Complete |
| PROBE-04 | Phase 134 | Complete |
| PROBE-05 | Phase 134 | Complete |
| PROBE-06 | Phase 134 | Complete |
| PROBE-07 | Phase 134 | Complete |
| BUDGET-01 | Phase 135 | Complete |
| BUDGET-02 | Phase 135 | Complete |
| BUDGET-03 | Phase 135 | Complete |
| BUDGET-04 | Phase 135 | Complete |
| BUDGET-05 | Phase 135 | Complete |
| BUDGET-06 | Phase 135 | Complete |
| BUDGET-07 | Phase 135 | Complete |
| REL-01 | Phase 136 | Complete |
| REL-02 | Phase 136 | Complete |
| REL-03 | Phase 136 | Complete |
| REL-04 | Phase 136 | Complete |
| REL-05 | Phase 136 | Complete |
| REL-06 | Phase 136 | Complete |
| UX-01 | Phase 137 | Complete |
| UX-02 | Phase 137 | Complete |
| UX-03 | Phase 137 | Complete |
| UX-04 | Phase 137 | Complete |
| UX-05 | Phase 137 | Complete |
| UX-06 | Phase 137 | Complete |
| PROOF-01 | Phase 138 | Complete |
| PROOF-02 | Phase 138 | Complete |
| PROOF-03 | Phase 138 | Complete |
| PROOF-04 | Phase 138 | Complete |
| PROOF-05 | Phase 138 | Complete |
| PROOF-06 | Phase 138 | Complete |
| PROOF-07 | Phase 138 | Complete |
| EXIT-01 | Phase 139 | Pending |
| EXIT-02 | Phase 139 | Pending |
| EXIT-03 | Phase 139 | Pending |
| EXIT-04 | Phase 139 | Pending |
| EXIT-05 | Phase 139 | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.20 milestone initialization*
