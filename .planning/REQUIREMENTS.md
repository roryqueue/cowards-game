# Requirements: Coward's Game

**Defined:** 2026-05-25
**Milestone:** v1.18 Runtime Isolation and Multi-Language Exhibition Beta
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline And Threat Model

- [ ] **BASE-01**: Developer can inspect a v1.18 baseline that preserves v1.17 topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementations.
- [ ] **BASE-02**: Developer can inspect an explicit hostile Strategy threat model for non-counted exhibition beta readiness.
- [ ] **BASE-03**: Developer can inspect promotion criteria separating runtime-isolation readiness evidence from production sandbox certification.
- [ ] **BASE-04**: Developer can verify JS/TS Strategy support remains intact through the broker/runtime ABI.
- [ ] **BASE-05**: Developer can verify Python remains runtime-only, non-counted, non-ranked, and not a backend/persistence/route/job/scoring/evidence owner.

### Runtime Isolation Hardening

- [ ] **ISO-01**: Developer can inspect hardened Python subprocess launch behavior, including empty environment, Python isolated/safe-path flags where practical, no shell, and deterministic runtime metadata.
- [ ] **ISO-02**: Developer can verify timeout, stdout/stderr/output caps, malformed IPC, crash, signal, and process cleanup behavior map to deterministic failure taxonomy.
- [ ] **ISO-03**: Developer can verify filesystem, network, shell, import/package, environment, host path, and package escape probes fail closed.
- [ ] **ISO-04**: Developer can inspect container/gVisor-style evidence for stronger isolation candidates without promoting them to production counted play.
- [ ] **ISO-05**: Developer can verify stopped runtime service and stopped Python runtime fail loudly without JS/TS, Go, or TypeScript backend fallback.

### Python Validation And Diagnostics

- [ ] **PYVAL-01**: User can validate Python with real AST/compile checks where practical, not only heuristic syntax scanning.
- [ ] **PYVAL-02**: User receives public-safe diagnostics for syntax, compile, missing API functions, forbidden capabilities, package policy, source size, and validation/runtime metadata mismatch.
- [ ] **PYVAL-03**: Developer can verify Python validation never executes Strategy behavior in web/API/Go.
- [ ] **PYVAL-04**: Developer can verify validation output omits source, memory, objectives, stderr, stack, host paths, package paths, env, tokens, DB DSNs, and private runtime internals.
- [ ] **PYVAL-05**: Developer can verify Python package policy remains self-contained source only, with no arbitrary PyPI/package installs.

### Exhibition Beta Revisions And Eligibility

- [ ] **BETA-01**: User can save Python as an account-owned immutable Strategy Revision where practical.
- [ ] **BETA-02**: Developer can verify Python revisions carry language/runtime/adapter/package/validation/artifact hash metadata and non-counted eligibility.
- [ ] **BETA-03**: User-facing labels clearly say Python is non-counted exhibition beta.
- [ ] **BETA-04**: Developer can verify counted/ranked/ladder/gauntlet gates reject Python while JS/TS counted eligibility remains intact.
- [ ] **BETA-05**: Developer can verify public summaries expose safe language/runtime labels without private Strategy or runtime leaks.

### Signed-In Exhibition Proof

- [ ] **PROOF-01**: User can create or sign into a local account.
- [ ] **PROOF-02**: User can create/save a JS/TS Strategy Revision.
- [ ] **PROOF-03**: User can create/save a Python Strategy Revision.
- [ ] **PROOF-04**: User can create a non-counted exhibition MatchSet using Python against JS/TS or Python.
- [ ] **PROOF-05**: Match execution flows through Go -> Runtime Broker -> isolated runtime implementation.
- [ ] **PROOF-06**: User can open replay evidence for the MatchSet.
- [ ] **PROOF-07**: Replay board evidence shows a plausible full Match start with visible Soldiers and terrain inside board bounds.
- [ ] **PROOF-08**: Public outputs for the proof remain private-data safe.

### Monitors, Topology, And Privacy

- [ ] **MON-01**: Developer can run monitors that fail on runtime ABI drift, runtime registry drift, and broker contract drift.
- [ ] **MON-02**: Developer can run monitors that fail on sandbox/isolation authority drift and Python execution outside the runtime boundary.
- [ ] **MON-03**: Developer can run monitors that fail on backend ownership creep, route ownership creep, persistence access, job lifecycle ownership, scoring ownership, public evidence ownership, or silent fallback.
- [ ] **MON-04**: Developer can run hostile probes for filesystem, network, package/import, shell, environment, process, memory/output, timeout, crash, and malformed IPC behavior.
- [ ] **MON-05**: Developer can run privacy checks that fail on source/memory/objective/stderr/stack/path/token/private-runtime leaks.
- [ ] **MON-06**: Developer can run JS/TS regression tests proving existing JS/TS strategy support remains intact.
- [ ] **MON-07**: Developer can run page smoke for Workshop, exhibition creation, MatchSet result, and replay evidence.

### Completion And Promotion

- [ ] **EXIT-01**: Developer can inspect v1.18 artifacts for baseline, threat model, isolation evidence, validation policy, exhibition beta evidence, topology, monitors, privacy, and proof results.
- [ ] **EXIT-02**: Developer can inspect a promotion decision stating Python is promoted only to non-counted exhibition beta.
- [ ] **EXIT-03**: Developer can inspect a promotion decision stating runtime isolation is readiness evidence only unless production-grade proof genuinely passes.
- [ ] **EXIT-04**: Developer can run final verification across spec/contracts, runtime-python, runtime-service, Go backend, web, topology, boundary monitors, privacy, and browser proof.
- [ ] **EXIT-05**: Developer can archive requirements/roadmap/phases, remove active `.planning/REQUIREMENTS.md`, update PROJECT/STATE/MILESTONES/RETROSPECTIVE, and tag `v1.18`.

## Future Requirements

- **RTP-01**: Promote Python to ranked/counted play only after explicit production sandbox, package, determinism, rollback, replay, privacy, and governance criteria pass.
- **RTP-02**: Evaluate WASM/WASI/component-model hosting only as future research unless a later milestone promotes it.
- **PKG-01**: Add arbitrary PyPI/package installs only after reproducible supply-chain and sandbox install/build policy exists.
- **OPS-01**: Add cloud/Kubernetes/service-mesh/production observability only in a future ops milestone.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Python ranked/ladder counted play | Requires explicit future promotion gates. |
| Arbitrary PyPI/package installs | Supply-chain and native extension risk are outside v1.18. |
| Production sandbox certification | v1.18 collects readiness evidence; it does not overclaim. |
| Replacing JS/TS support | JS/TS remains intact through the broker/runtime ABI. |
| Python backend ownership | Violates the runtime-only boundary. |
| Silent fallback | Hides runtime failures and invalidates evidence. |
| Broad multi-language product support | v1.18 is Python exhibition beta, not a language marketplace. |
| Cloud deployment/Kubernetes/service mesh | Not needed for local exhibition beta proof. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 117 | Pending |
| BASE-02 | Phase 117 | Pending |
| BASE-03 | Phase 117 | Pending |
| BASE-04 | Phase 117 | Pending |
| BASE-05 | Phase 117 | Pending |
| ISO-01 | Phase 118 | Pending |
| ISO-02 | Phase 118 | Pending |
| ISO-03 | Phase 118 | Pending |
| ISO-04 | Phase 118 | Pending |
| ISO-05 | Phase 118 | Pending |
| PYVAL-01 | Phase 119 | Pending |
| PYVAL-02 | Phase 119 | Pending |
| PYVAL-03 | Phase 119 | Pending |
| PYVAL-04 | Phase 119 | Pending |
| PYVAL-05 | Phase 119 | Pending |
| BETA-01 | Phase 120 | Pending |
| BETA-02 | Phase 120 | Pending |
| BETA-03 | Phase 120 | Pending |
| BETA-04 | Phase 120 | Pending |
| BETA-05 | Phase 120 | Pending |
| PROOF-01 | Phase 121 | Pending |
| PROOF-02 | Phase 121 | Pending |
| PROOF-03 | Phase 121 | Pending |
| PROOF-04 | Phase 121 | Pending |
| PROOF-05 | Phase 121 | Pending |
| PROOF-06 | Phase 121 | Pending |
| PROOF-07 | Phase 121 | Pending |
| PROOF-08 | Phase 121 | Pending |
| MON-01 | Phase 122 | Pending |
| MON-02 | Phase 122 | Pending |
| MON-03 | Phase 122 | Pending |
| MON-04 | Phase 122 | Pending |
| MON-05 | Phase 122 | Pending |
| MON-06 | Phase 122 | Pending |
| MON-07 | Phase 122 | Pending |
| EXIT-01 | Phase 123 | Pending |
| EXIT-02 | Phase 123 | Pending |
| EXIT-03 | Phase 123 | Pending |
| EXIT-04 | Phase 123 | Pending |
| EXIT-05 | Phase 123 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after v1.18 milestone materialization*
