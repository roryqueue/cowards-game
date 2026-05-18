# Requirements: Coward's Game v1.1 Trustworthy Simulation Beta

**Defined:** 2026-05-18
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.1 Requirements

Requirements for Trustworthy Simulation Beta. Each maps to roadmap phases.

### Replay Fidelity

- [x] **FID-01**: Developer can generate canonical replay fixtures from legal engine scenarios instead of relying on hand-authored replay data.
- [x] **FID-02**: Developer can run canonical demo Matches covering push, fall, contraction, legal Backstab, runtime failure, and endgame.
- [x] **FID-03**: Developer can run fixture legality tests that reject impossible replay beats before they reach the replay viewer.
- [x] **FID-04**: Replay viewer can render engine-generated fixtures through the same projection path used by persisted Match Chronicles.
- [x] **FID-05**: CI can run visual regression checks for board scale, Soldier positions, contraction bounds, and event callouts at stable desktop and mobile viewports.
- [x] **FID-06**: Developer can inspect expected event sequences and visual checkpoints for each canonical demo Match.
- [x] **FID-07**: Replay fixture failures identify whether the failure is engine legality, Chronicle validation, projection, or UI rendering.

### Chronicle Grammar

- [x] **GRAM-01**: Developer can validate Chronicle event payload shape and semantic grammar before replay rendering accepts a Chronicle.
- [x] **GRAM-02**: Invalid event order, missing required events, duplicate terminal events, and events outside legal Match/Round/Activation/Cycle windows fail with clear validation errors.
- [x] **GRAM-03**: Chronicle validation enforces required context fields and payload consistency for each event type.
- [x] **GRAM-04**: Chronicle validation enforces snapshot boundary rules for Match start/end, Round start/end, Activation start/end, Contraction, and terminal states.
- [x] **GRAM-05**: Chronicle validation rejects snapshots that reference missing event sequences or impossible board transitions where enough snapshot data exists to prove impossibility.
- [x] **GRAM-06**: Replay loading rejects unsupported Chronicle schema, engine, runtime, Strategy Revision, and Arena Variant compatibility versions with explicit failure messages.
- [x] **GRAM-07**: Public replay projection excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, and private runtime details by default.
- [x] **GRAM-08**: Developer can run negative Chronicle grammar fixtures for corrupted, impossible, private-leaking, and version-incompatible Chronicles.

### Runtime Isolation

- [ ] **ISO-01**: Developer can identify which Strategy execution adapter is active and what isolation boundary it provides.
- [ ] **ISO-02**: Runtime execution keeps Strategy source out of web/API processes and runs only through worker/runtime execution boundaries.
- [ ] **ISO-03**: Runtime code exposes a replaceable execution adapter boundary that can support worker-thread, subprocess, container, or WASM/WASI execution without changing engine rules.
- [ ] **ISO-04**: Developer can run a subprocess/container/WASM/WASI spike or implementation that accepts only schema-valid JSON input and returns only schema-validated JSON output.
- [ ] **ISO-05**: Runtime execution enforces wall-clock timeout, output byte caps, memory/resource bounds where available, empty or minimal environment, and no inherited host capabilities.
- [ ] **ISO-06**: Hostile Strategy tests cover forbidden globals, dynamic import attempts, worker/process access, filesystem/network attempts, infinite loops, memory pressure, oversized output, invalid output, and thrown exceptions.
- [ ] **ISO-07**: Worker and runtime tests distinguish strategy violations from system failures, including timeout, malformed IPC, subprocess exit, signal termination, and validation failure.

### Doctrine Debugging

- [ ] **DEBUG-01**: User sees validation and runtime violation messages that name the relevant Strategy API constraint and remediation path.
- [ ] **DEBUG-02**: User can start from sample Strategies that demonstrate common doctrine patterns and common failure modes.
- [ ] **DEBUG-03**: User can open replay links directly from Workshop Match results when a replay exists.
- [ ] **DEBUG-04**: Owner can inspect replay explanations for why a Soldier did nothing, including not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, or Match ended.
- [ ] **DEBUG-05**: Owner-only debug overlays are generated from replay/engine-derived DTOs rather than React rule inference.
- [ ] **DEBUG-06**: Public replay views remain privacy-safe when owner-only debugging features are enabled.

### Local and CI Reliability

- [ ] **REL-01**: Developer can start required services through Docker Compose with health checks and clear readiness diagnostics.
- [ ] **REL-02**: Developer can start required services without Docker through the local Postgres path with clear readiness diagnostics.
- [ ] **REL-03**: Developer can run a shared preflight command that checks Postgres, Redis if required, migrations, seed state, worker readiness, and replay endpoint readiness.
- [ ] **REL-04**: CI can run a service-backed edit -> submit revision -> execute Match -> open replay flow beyond fixture-only smoke coverage.
- [ ] **REL-05**: Developer can run separate commands for fast unit/invariant tests, service-backed E2E, and replay visual regression checks.
- [ ] **REL-06**: Local/CI failures identify whether the failing layer is service startup, migration, seeding, worker execution, Chronicle validation, replay projection, or UI rendering.

## Future Requirements

Deferred to a later milestone.

### Competitive Surfaces

- **COMP-01**: User can enter Strategy Revisions into ranked ladders.
- **COMP-02**: User can participate in tournaments or scheduled public competitions.
- **COMP-03**: User can publish Strategy profiles or public doctrine pages.
- **COMP-04**: User can share public Chronicle links with compatibility and privacy guarantees.

### Runtime Expansion

- **RUNTIME-01**: Developer can add non-JS Strategy runtimes behind the same StrategyRuntime interface.
- **RUNTIME-02**: Developer can run a production-grade container, microVM, or WASM/WASI sandbox with operational resource isolation.

### Arena Expansion

- **ARENA-01**: User can play on custom or generated Arena Variants after replay compatibility policy is stable.

## Out of Scope

Explicitly excluded from v1.1. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Ranked ladders | Ladders multiply replay disputes, sandbox abuse, deterministic compatibility, stale Strategy Revision, privacy, and scoring fairness risks before the trust foundation is sharp. |
| Public tournaments | Tournament operations depend on ladder-grade trust, moderation, compatibility, and abuse controls. |
| Strategy marketplace | Publishing and marketplace surfaces require stronger ownership, abuse, privacy, and compatibility policies. |
| Multi-language runtime implementation | The runtime boundary should remain replaceable, but v1.1 hardens JS/TS first. |
| Custom or randomized maps | Adds fixture, compatibility, and replay complexity while Chronicle/replay trust is still being hardened. |
| Live human control or live model inference during Matches | Violates the deterministic autonomous Match model. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| FID-01 | Phase 8 | Complete |
| FID-02 | Phase 8 | Complete |
| FID-03 | Phase 8 | Complete |
| FID-04 | Phase 8 | Complete |
| FID-05 | Phase 8 | Complete |
| FID-06 | Phase 8 | Complete |
| FID-07 | Phase 8 | Complete |
| GRAM-01 | Phase 9 | Complete |
| GRAM-02 | Phase 9 | Complete |
| GRAM-03 | Phase 9 | Complete |
| GRAM-04 | Phase 9 | Complete |
| GRAM-05 | Phase 9 | Complete |
| GRAM-06 | Phase 9 | Complete |
| GRAM-07 | Phase 9 | Complete |
| GRAM-08 | Phase 9 | Complete |
| ISO-01 | Phase 10 | Pending |
| ISO-02 | Phase 10 | Pending |
| ISO-03 | Phase 10 | Pending |
| ISO-04 | Phase 10 | Pending |
| ISO-05 | Phase 10 | Pending |
| ISO-06 | Phase 10 | Pending |
| ISO-07 | Phase 10 | Pending |
| DEBUG-01 | Phase 11 | Pending |
| DEBUG-02 | Phase 11 | Pending |
| DEBUG-03 | Phase 11 | Pending |
| DEBUG-04 | Phase 11 | Pending |
| DEBUG-05 | Phase 11 | Pending |
| DEBUG-06 | Phase 11 | Pending |
| REL-01 | Phase 12 | Pending |
| REL-02 | Phase 12 | Pending |
| REL-03 | Phase 12 | Pending |
| REL-04 | Phase 12 | Pending |
| REL-05 | Phase 12 | Pending |
| REL-06 | Phase 12 | Pending |

**Coverage:**
- v1.1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after v1.1 roadmap creation*
