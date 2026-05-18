# Roadmap: Coward's Game

**Last updated:** 2026-05-18
**Current milestone:** v1.1 Trustworthy Simulation Beta
**Granularity:** Standard
**Execution:** Parallel where phase plans are independent

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).
- 📋 **v1.1 Trustworthy Simulation Beta** — Phases 8-12, planning started 2026-05-18.

## Overview

Coward's Game v1.1 sharpens trust in the simulation loop shipped in v1.0. The milestone focuses on legal engine-generated replay fixtures, strict Chronicle grammar, stronger runtime isolation boundaries, doctrine debugging UX, and repeatable Docker/no-Docker local plus CI verification.

## Phase Summary

| Phase | Name | Goal | Requirements | Status |
| --- | --- | --- | ---: | --- |
| 8 | Replay Fixture Fidelity and Visual Regression | Replace fragile hand-authored replay demos with legal engine-generated scenarios and focused visual checks. | 7 | Complete |
| 9 | Strict Chronicle Grammar and Compatibility | Reject invalid, impossible, private-leaking, or incompatible Chronicles before replay rendering. | 8 | Complete |
| 10 | Runtime Isolation Hardening | Make the Strategy runtime boundary explicit, test hostile code, and spike stronger process/container/WASM isolation. | 7 | Active |
| 11 | Doctrine Debugging UX | Help players understand validation failures, runtime violations, replay links, and why Soldiers did nothing without moving rules into React. | 6 | Pending |
| 12 | Local and CI Reliability | Make Docker, no-Docker, and service-backed CI startup and E2E verification boring and diagnosable. | 6 | Pending |

**Coverage:** 34 v1.1 requirements mapped, 0 unmapped.

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) — SHIPPED 2026-05-17</summary>

- [x] Phase 1: Foundation And Spec Contracts (4/4 plans) — archived in `.planning/milestones/v1.0-phases/01-foundation-and-spec-contracts/`
- [x] Phase 2: Pure Rules Engine (5/5 plans) — archived in `.planning/milestones/v1.0-phases/02-pure-rules-engine/`
- [x] Phase 3: Chronicle And Replay Core (5/5 plans) — archived in `.planning/milestones/v1.0-phases/03-chronicle-and-replay-core/`
- [x] Phase 4: Strategy Runtime Sandbox (4/4 plans) — archived in `.planning/milestones/v1.0-phases/04-strategy-runtime-sandbox/`
- [x] Phase 5: Match Orchestration And Persistence (5/5 plans) — archived in `.planning/milestones/v1.0-phases/05-match-orchestration-and-persistence/`
- [x] Phase 6: Strategy Workshop Ux (5/5 plans) — archived in `.planning/milestones/v1.0-phases/06-strategy-workshop-ux/`
- [x] Phase 7: Replay Viewer And End To End Verification (5/5 plans) — archived in `.planning/milestones/v1.0-phases/07-replay-viewer-and-end-to-end-verification/`

</details>

### Phase 8: Replay Fixture Fidelity and Visual Regression

**Goal:** Replace fragile hand-authored replay demos with legal engine-generated scenarios and focused visual checks.
**Mode:** standard
**Status:** Complete

**Requirements:** FID-01, FID-02, FID-03, FID-04, FID-05, FID-06, FID-07

**Success Criteria:**
1. Canonical replay demo fixtures are generated from legal engine/test-utils scenarios for push, fall, contraction, legal Backstab, runtime failure, and endgame.
2. Fixture legality tests reject impossible event sequences or board states before web replay rendering can consume them.
3. Replay UI consumes the same projection path for generated fixtures and persisted Match Chronicles.
4. Playwright screenshot checks cover board scale, Soldier positions, contraction bounds, and event callouts at stable desktop and mobile viewports.
5. Fixture failures identify the failing layer: engine legality, Chronicle validation, projection, or UI rendering.

**Notes:**
- The post-shipment replay fixture correction from 2026-05-18 is direct evidence that v1.1 should start here.
- Keep any remaining hand-authored data small, explicit, and guarded by legality tests.
- Screenshot tests should be focused and deterministic, not broad full-page visual snapshots.

### Phase 9: Strict Chronicle Grammar and Compatibility

**Goal:** Reject invalid, impossible, private-leaking, or incompatible Chronicles before replay rendering.
**Mode:** standard
**Status:** Complete

**Requirements:** GRAM-01, GRAM-02, GRAM-03, GRAM-04, GRAM-05, GRAM-06, GRAM-07, GRAM-08
**Plans:** 5 plans

Plans:
- [x] 09-01-PLAN.md - Validation error contract and compatibility gate
- [x] 09-02-PLAN.md - Public projection privacy hard gate
- [x] 09-03-PLAN.md - Semantic event grammar state machine
- [x] 09-04-PLAN.md - Snapshot boundary grammar
- [x] 09-05-PLAN.md - Integrated validation gate and provable board contradictions

**Success Criteria:**
1. `packages/replay` validates Chronicle semantic grammar after Zod shape parsing and before replay rendering.
2. Invalid Match/Round/Activation/Cycle event windows, missing required context, duplicate terminal events, and unsupported versions produce clear validation errors.
3. Snapshot boundary validation covers Match, Round, Activation, Contraction, Match end, and terminal snapshots.
4. Negative fixtures cover corrupted, impossible, private-leaking, and version-incompatible Chronicles.
5. Public replay projection privacy is tested for Strategy source, StrategyMemory, SoldierMemory, objectives, raw Awareness Grid details, and runtime details.

**Notes:**
- Treat Chronicle grammar as a trust contract, not UI validation.
- Do not re-run Strategy source during validation or replay reconstruction.

### Phase 10: Runtime Isolation Hardening

**Goal:** Make the Strategy runtime boundary explicit, test hostile code, and spike stronger process/container/WASM isolation.
**Mode:** standard
**Status:** Active

**Requirements:** ISO-01, ISO-02, ISO-03, ISO-04, ISO-05, ISO-06, ISO-07

**Success Criteria:**
1. Runtime execution exposes a replaceable adapter boundary without changing engine rules.
2. Worker-thread execution remains supported but is documented and tested as prototype containment, not a final sandbox.
3. A subprocess/container/WASM/WASI spike or implementation accepts only schema-valid JSON input and returns only schema-validated JSON output.
4. Runtime execution enforces timeout, output caps, minimal environment, resource limits where available, and no inherited host capabilities.
5. Hostile Strategy tests cover forbidden globals, dynamic import, worker/process access, filesystem/network attempts, infinite loops, memory pressure, oversized output, invalid output, and thrown exceptions.
6. Worker tests distinguish strategy violations from system failures including malformed IPC, subprocess exit, signal termination, timeout, and validation failure.

**Notes:**
- Do not use Node `vm` as a security boundary.
- Node Permission Model may be defense-in-depth for subprocesses, but not the sandbox itself.
- Strategy source must stay out of web/API processes.

### Phase 11: Doctrine Debugging UX

**Goal:** Help players understand validation failures, runtime violations, replay links, and why Soldiers did nothing without moving rules into React.
**Mode:** standard
**Status:** Pending

**Requirements:** DEBUG-01, DEBUG-02, DEBUG-03, DEBUG-04, DEBUG-05, DEBUG-06

**Success Criteria:**
1. Workshop validation and runtime messages name the Strategy API constraint and next remediation step.
2. Sample Strategies demonstrate useful doctrine patterns and common failure modes.
3. Workshop Match results expose replay links when a replay exists.
4. Owner replay can explain why a Soldier did nothing: not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, or Match ended.
5. Owner-only debug overlays are generated from replay/engine-derived DTOs rather than React rule inference.
6. Public replay privacy remains intact when owner debug mode is enabled.

**Notes:**
- The UX should help doctrine iteration, not become a generic programming tutor.
- Keep explanations data-driven from replay/runtime facts.

### Phase 12: Local and CI Reliability

**Goal:** Make Docker, no-Docker, and service-backed CI startup and E2E verification boring and diagnosable.
**Mode:** standard
**Status:** Pending

**Requirements:** REL-01, REL-02, REL-03, REL-04, REL-05, REL-06

**Success Criteria:**
1. Docker Compose startup reports service health and readiness clearly.
2. No-Docker local Postgres startup remains supported with equivalent diagnostics.
3. A shared preflight command checks Postgres, Redis if required, migrations, seed state, worker readiness, and replay endpoint readiness.
4. CI runs service-backed edit -> submit revision -> execute Match -> open replay coverage beyond fixture-only smoke tests.
5. Test scripts separate fast unit/invariant tests, service-backed E2E, and replay visual regression checks.
6. Local/CI failures identify the failing layer: service startup, migration, seed, worker, Chronicle validation, replay projection, or UI rendering.

**Notes:**
- This phase should reduce future friction for every later competitive milestone.
- Keep Docker and no-Docker paths intentionally parallel.

## Progress

| Milestone | Phases | Plans | Requirements | Status | Shipped |
| --- | ---: | ---: | ---: | --- | --- |
| v1.0 MVP | 7/7 | 33/33 | 80/80 | Complete | 2026-05-17 |
| v1.1 Trustworthy Simulation Beta | 2/5 | 9/9 | 15/34 | In Progress | — |

## Next

Run `$gsd-plan-phase 9` to create an executable plan for strict Chronicle grammar and compatibility.
