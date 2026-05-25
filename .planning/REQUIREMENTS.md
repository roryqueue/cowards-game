# Requirements: Coward's Game

**Defined:** 2026-05-24
**Milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1 Requirements

### Baseline And Scope

- [ ] **BASE-01**: Developer can inspect a v1.17 baseline that treats v1.16 as the backend-retirement floor: normal topology is web frontend -> Go backend -> isolated runtime service(s).
- [ ] **BASE-02**: Developer can verify JS/TS Strategy support remains intact through the existing isolated runtime service and public runtime ABI.
- [ ] **BASE-03**: Developer can verify Python is scoped as an experimental second-language runtime path only, not a backend, route owner, persistence owner, worker owner, or fallback path.
- [ ] **BASE-04**: Developer can verify v1.17 non-goals exclude arbitrary PyPI/package installs, ranked/ladder counted Python play, production sandbox promotion, replacing JS/TS support, broad multi-language product support, and WASM/WASI/component-model promotion.
- [ ] **BASE-05**: Developer can verify deterministic engine purity, Strategy Revision immutability, runtime ABI schema validation, owner-source privacy, public replay privacy, rollback clarity, and hostile-code isolation remain hard constraints.

### Runtime Broker Contract

- [ ] **BROKER-01**: Developer can inspect a concrete Strategy Execution Service / Runtime Broker interface that defines runtime registration, adapter selection, language compatibility, request routing, health metadata, and failure taxonomy.
- [ ] **BROKER-02**: Developer can inspect a runtime registry artifact covering JS/TS and Python implementations, including language id/version, runtime target, adapter version, transport binding, limits, package policy, readiness, and counted eligibility.
- [ ] **BROKER-03**: Developer can verify Go invokes Strategy execution only through the runtime execution service envelope and never imports, evaluates, transpiles, or executes Strategy source.
- [ ] **BROKER-04**: Developer can verify the runtime service chooses language implementations only from registry metadata and fails closed on unknown language, unsupported adapter, ABI drift, stale registry, or unavailable runtime target.
- [ ] **BROKER-05**: Developer can verify the broker contract preserves current JS/TS behavior without changing Go orchestration, Chronicle persistence handoff, MatchSet scoring, public replay/evidence projection, or no-fallback semantics.
- [ ] **BROKER-06**: Developer can run contract tests that prove runtime ABI request/response envelopes remain schema-validated, language-neutral, and synchronized across spec artifacts, runtime service code, Go client code, and monitors.

### Strategy Artifact Metadata

- [ ] **ART-01**: Developer can represent a Python Strategy Revision as an immutable Strategy Revision artifact with language id/version, runtime target, adapter version, source format, package policy, compile metadata, validation status, artifact hash, and compatibility key.
- [ ] **ART-02**: Developer can verify Strategy Artifact schemas and public summaries support Python source format and runtime metadata without exposing source in public outputs.
- [ ] **ART-03**: Developer can verify immutable artifact hashes include behavior-significant language/runtime/package/compile metadata so JS/TS and Python revisions cannot collide or compare unsafely.
- [ ] **ART-04**: Developer can verify Match eligibility flags distinguish counted JS/TS play from experimental non-counted Python Workshop or exhibition proof.
- [ ] **ART-05**: Developer can verify account, Workshop, public Strategy, and artifact DTOs expose public-safe language/runtime labels without leaking Strategy source, StrategyMemory, SoldierMemory, objective payloads, stack, stderr, host paths, or private runtime internals.

### Python Submission Validation

- [ ] **PYVAL-01**: User can choose or submit Python Strategy source in an explicitly experimental Workshop path.
- [ ] **PYVAL-02**: User can receive submission-time Python diagnostics for parse errors, compile errors, missing required Strategy functions, forbidden imports/capabilities, source size, and unsupported package metadata.
- [ ] **PYVAL-03**: Developer can verify Python validation uses parse/compile checks where practical and does not execute Strategy logic in the web/API process or Go backend.
- [ ] **PYVAL-04**: Developer can verify Python package policy is self-contained source only: no arbitrary PyPI installs, declared dependencies, native extensions, filesystem/network access, or dynamic package resolution.
- [ ] **PYVAL-05**: Developer can verify Python validation diagnostics are public-safe and redacted, with no source echo, stack trace, stderr, host path, environment, token, DB DSN, or private runtime leak by default.
- [ ] **PYVAL-06**: Developer can verify invalid Python submissions produce immutable invalid validation reports or rejected submissions consistently with existing Strategy Revision validation semantics.

### Python Runtime Execution

- [ ] **PYRUN-01**: Developer can execute Python Strategies only through the Strategy Execution Service / Runtime Broker ABI, using the same runtime execution service request and response envelope family as JS/TS.
- [ ] **PYRUN-02**: Developer can verify Python runtime execution supports the canonical Strategy methods needed for a full Match, including Activation selection and SoldierBrain Actions.
- [ ] **PYRUN-03**: Developer can verify Python runtime responses are schema-validated and invalid output becomes a Strategy runtime violation rather than a system failure.
- [ ] **PYRUN-04**: Developer can verify Python timeout, crash, subprocess exit/signal, malformed IPC, oversized stdout/stderr/payload, forbidden capability, stderr, and stack behavior matches the broker failure taxonomy.
- [ ] **PYRUN-05**: Developer can verify Python runtime execution has no filesystem, network, package install, shell, database, job lifecycle, Match completion, Chronicle persistence, MatchSet scoring, product route, or public evidence authority.
- [ ] **PYRUN-06**: Developer can verify Python execution does not use Node `vm`, does not execute in Go, and does not execute in Next.js web/API routes.
- [ ] **PYRUN-07**: Developer can verify Python runtime success returns internal runtime results only, while Go remains responsible for orchestration, completion, persistence, scoring, and public replay/evidence.

### Go Orchestration And Match Eligibility

- [ ] **GO-01**: Developer can verify Go runtime-service client validation accepts registered Python runtime metadata only through schema-validated ABI envelopes.
- [ ] **GO-02**: Developer can verify Go rejects Python Strategy Revisions for ranked ladder, counted MatchSets, counted gauntlets, and normal counted eligibility.
- [ ] **GO-03**: User can create a non-counted Workshop or exhibition-style MatchSet containing a valid Python Strategy Revision without weakening counted JS/TS entry gates.
- [ ] **GO-04**: Developer can verify Python MatchSet scoring/status/public counted explanation clearly marks the result non-counted or experimental without reclassifying existing JS/TS evidence.
- [ ] **GO-05**: Developer can verify stopped Python runtime, stopped runtime service, registry mismatch, and unsupported Python artifact paths fail closed without TypeScript backend, Go execution, or JS/TS fallback execution.

### User-Facing Python Proof

- [ ] **PROOF-01**: User can load a small Python Starter Strategy from the Workshop with experimental language labeling.
- [ ] **PROOF-02**: User can validate and submit the Python Starter Strategy as an immutable Strategy Revision artifact with Python runtime metadata.
- [ ] **PROOF-03**: User can run the Python Starter Strategy in a non-counted Workshop or exhibition-style MatchSet against an existing JS/TS opponent or approved fixture opponent.
- [ ] **PROOF-04**: User can open replay evidence for the Python proof MatchSet and see plausible full Match start state with visible Soldiers and terrain inside board bounds.
- [ ] **PROOF-05**: User can inspect public-safe result, runtime, and replay labels that identify Python as experimental and non-counted without exposing private Strategy or runtime internals.
- [ ] **PROOF-06**: Developer can run an end-to-end proof command or page smoke covering Python edit -> validate -> submit -> create non-counted MatchSet -> execute through runtime service -> replay.

### Topology, Monitors, And Privacy

- [ ] **GATE-01**: Developer can run topology checks proving normal v1.17 topology remains web frontend -> Go backend -> isolated runtime service(s), with Python behind the runtime/broker boundary only.
- [ ] **GATE-02**: Developer can run boundary monitors that fail on runtime ABI drift, runtime registry drift, broker contract drift, stale generated artifacts, Go client drift, and runtime service authority creep.
- [ ] **GATE-03**: Developer can run monitors that fail if Python executes outside the runtime service boundary or if web/API/Go imports, evaluates, transpiles, or executes Python Strategy source.
- [ ] **GATE-04**: Developer can run monitors that fail on Python backend ownership creep, route ownership creep, persistence access, job lifecycle ownership, Match completion, Chronicle persistence, MatchSet scoring, public evidence delivery, or silent fallback.
- [ ] **GATE-05**: Developer can run public-output privacy checks that fail on Strategy source, StrategyMemory, SoldierMemory, objective payload, owner debug, raw Awareness Grid, stderr, stack, host path, token, DB DSN, package path, or private runtime leak.
- [ ] **GATE-06**: Developer can run tests proving Python cannot claim counted/ranked/ladder eligibility before an explicit future promotion milestone.
- [ ] **GATE-07**: Developer can run browser or page smoke proving the Python Workshop proof and replay proof render without clipped/off-screen pieces and without public privacy leaks.

### Completion And Audit

- [ ] **EXIT-01**: Developer can run the final v1.17 verification suite covering spec/contracts, runtime service tests, Python runtime tests, Go backend tests, topology checks, boundary monitors, public-output privacy checks, and page/replay smoke.
- [ ] **EXIT-02**: Developer can inspect v1.17 artifacts for broker contract, runtime registry, Python validation policy, Python execution evidence, non-counted eligibility evidence, topology evidence, privacy evidence, and promotion/defer decisions.
- [ ] **EXIT-03**: Developer can inspect a promotion decision stating Python remains experimental/non-counted and is implemented only as a runtime implementation behind the Runtime Broker contract.
- [ ] **EXIT-04**: Developer can verify no v1.17 artifact or diagnostic leaks private Strategy, owner, session, host, database, package, runtime, stderr, stack, token, or source material.
- [ ] **EXIT-05**: Developer can complete milestone archive steps after audit: archive requirements, roadmap, phase artifacts, and milestone audit; remove active `.planning/REQUIREMENTS.md`; update PROJECT, STATE, MILESTONES, and RETROSPECTIVE; and tag `v1.17`.

## Future Requirements

### Runtime Promotion

- **RTP-01**: Developer can promote Python to counted/ranked play only after production sandbox, package policy, deterministic reproducibility, rollback, privacy, replay, docs, and governance criteria pass in a future milestone.
- **RTP-02**: Developer can evaluate WASM/WASI/component-model hosting as a future runtime implementation path after deterministic execution, capability sandboxing, resource limits, provenance, and host-runtime security are proven.
- **RTP-03**: Developer can add arbitrary package dependency support only after a reproducible supply-chain policy, lockfile model, native extension policy, and sandbox install/build boundary are designed.
- **RTP-04**: Developer can add broader language product support only after the Runtime Broker contract and registry remain stable with JS/TS and Python.

### Product And Operations

- **WORK-01**: User can use first-class multi-language Workshop UX, docs, and examples after the experimental Python proof is accepted.
- **LADR-01**: User can enter non-JS Strategies into ranked ladders only after explicit counted eligibility promotion.
- **OPS-01**: Operator can manage production runtime deployment, observability, autoscaling, and rollback after runtime sandbox promotion is planned.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Arbitrary PyPI or package installs | v1.17 proves self-contained Python runtime behavior before taking dependency supply-chain risk. |
| Python in ranked/ladder counted play | Counted eligibility requires sandbox, policy, compatibility, privacy, rollback, and governance promotion. |
| Production sandbox promotion | Python subprocess proof is not enough for hostile public-scale isolation. |
| Replacing JS/TS support | JS/TS remains the existing supported runtime through the isolated runtime service. |
| Python as backend, route owner, persistence owner, worker owner, or public evidence owner | Violates v1.16 backend-retirement boundary and runtime-only contract. |
| Silent fallback to JS/TS, TypeScript backend, or Go execution for Python | Would hide runtime failures and break ABI evidence. |
| Broad multi-language product support | v1.17 is a second-language pilot, not a language marketplace. |
| WASM/WASI/component-model promotion | Candidate path remains future research, not this milestone's implementation target. |
| Durable ratings, official tournaments, custom arenas, marketplace work, or cloud deployment | Not part of Python runtime pilot or broker contract hardening. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 110 | Pending |
| BASE-02 | Phase 110 | Pending |
| BASE-03 | Phase 110 | Pending |
| BASE-04 | Phase 110 | Pending |
| BASE-05 | Phase 110 | Pending |
| BROKER-01 | Phase 110 | Pending |
| BROKER-02 | Phase 110 | Pending |
| BROKER-03 | Phase 110 | Pending |
| BROKER-04 | Phase 110 | Pending |
| BROKER-05 | Phase 110 | Pending |
| BROKER-06 | Phase 110 | Pending |
| ART-01 | Phase 111 | Pending |
| ART-02 | Phase 111 | Pending |
| ART-03 | Phase 111 | Pending |
| ART-04 | Phase 111 | Pending |
| ART-05 | Phase 111 | Pending |
| PYVAL-01 | Phase 112 | Pending |
| PYVAL-02 | Phase 112 | Pending |
| PYVAL-03 | Phase 112 | Pending |
| PYVAL-04 | Phase 112 | Pending |
| PYVAL-05 | Phase 112 | Pending |
| PYVAL-06 | Phase 112 | Pending |
| PYRUN-01 | Phase 113 | Pending |
| PYRUN-02 | Phase 113 | Pending |
| PYRUN-03 | Phase 113 | Pending |
| PYRUN-04 | Phase 113 | Pending |
| PYRUN-05 | Phase 113 | Pending |
| PYRUN-06 | Phase 113 | Pending |
| PYRUN-07 | Phase 113 | Pending |
| GO-01 | Phase 114 | Pending |
| GO-02 | Phase 114 | Pending |
| GO-03 | Phase 114 | Pending |
| GO-04 | Phase 114 | Pending |
| GO-05 | Phase 114 | Pending |
| PROOF-01 | Phase 115 | Pending |
| PROOF-02 | Phase 115 | Pending |
| PROOF-03 | Phase 115 | Pending |
| PROOF-04 | Phase 115 | Pending |
| PROOF-05 | Phase 115 | Pending |
| PROOF-06 | Phase 115 | Pending |
| GATE-01 | Phase 116 | Pending |
| GATE-02 | Phase 116 | Pending |
| GATE-03 | Phase 116 | Pending |
| GATE-04 | Phase 116 | Pending |
| GATE-05 | Phase 116 | Pending |
| GATE-06 | Phase 116 | Pending |
| GATE-07 | Phase 116 | Pending |
| EXIT-01 | Phase 116 | Pending |
| EXIT-02 | Phase 116 | Pending |
| EXIT-03 | Phase 116 | Pending |
| EXIT-04 | Phase 116 | Pending |
| EXIT-05 | Phase 116 | Pending |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after initial v1.17 definition*
