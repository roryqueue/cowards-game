# Roadmap: Coward's Game

**Last updated:** 2026-05-18
**Current milestone:** v1.1 Trustworthy Simulation Beta
**Granularity:** Standard
**Execution:** Parallel where phase plans are independent

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).
- ⚠️ **v1.1 Trustworthy Simulation Beta** — Phases 8-13, audit found closure gap 2026-05-18.

## Overview

Coward's Game v1.1 sharpens trust in the simulation loop shipped in v1.0. The milestone focuses on legal engine-generated replay fixtures, strict Chronicle grammar, stronger runtime isolation boundaries, doctrine debugging UX, and repeatable Docker/no-Docker local plus CI verification.

## Phase Summary

| Phase | Name | Goal | Requirements | Status |
| --- | --- | --- | ---: | --- |
| 8 | Replay Fixture Fidelity and Visual Regression | Replace fragile hand-authored replay demos with legal engine-generated scenarios and focused visual checks. | 7 | Complete |
| 9 | Strict Chronicle Grammar and Compatibility | Reject invalid, impossible, private-leaking, or incompatible Chronicles before replay rendering. | 8 | Complete |
| 10 | Runtime Isolation Hardening | Make the Strategy runtime boundary explicit, test hostile code, and spike stronger process/container/WASM isolation. | 7 | Complete |
| 11 | Doctrine Debugging UX | Help players understand validation failures, runtime violations, replay links, and why Soldiers did nothing without moving rules into React. | 6 | Complete |
| 12 | Local and CI Reliability | Make Docker, no-Docker, and service-backed CI startup and E2E verification boring and diagnosable. | 6 | Complete |
| 13 | Close Gap: Persisted Owner Replay Debug Authorization | Connect persisted Match replay pages to a trusted owner-debug authorization path and prove owner-only inactivity explanations on real persisted replays. | 2 | Not Planned |

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
**Status:** Complete

**Requirements:** ISO-01, ISO-02, ISO-03, ISO-04, ISO-05, ISO-06, ISO-07
**Plans:** 5 plans

Plans:
- [x] 10-01-PLAN.md - Strategy execution adapter contract and worker-thread default
- [x] 10-02-PLAN.md - Opt-in subprocess JSON IPC adapter
- [x] 10-03-PLAN.md - Hostile Strategy matrix and failure taxonomy
- [x] 10-04-PLAN.md - Worker adapter selection and propagation
- [x] 10-05-PLAN.md - Isolation boundary audit and validation evidence

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
**Status:** Complete

**Plans:** 6 plans

Plans:
- [x] 11-01-PLAN.md - Validation and runtime actionable message contracts
- [x] 11-02-PLAN.md - Sample Strategy catalog
- [x] 11-03-PLAN.md - Workshop debugging guidance
- [x] 11-04-PLAN.md - Replay inactivity explanation DTOs
- [x] 11-05-PLAN.md - Owner-only replay debug overlays
- [x] 11-06-PLAN.md - Public privacy gates for debugging UX

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
**Status:** Complete

**Requirements:** REL-01, REL-02, REL-03, REL-04, REL-05, REL-06
**Plans:** 5 plans

Plans:
- [x] 12-01-PLAN.md - Docker Compose service readiness
- [x] 12-02-PLAN.md - No-Docker local startup diagnostics
- [x] 12-03-PLAN.md - Service-backed E2E diagnostics
- [x] 12-04-PLAN.md - CI and command separation
- [x] 12-05-PLAN.md - Reliability validation evidence

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

### Phase 13: Close Gap: Persisted Owner Replay Debug Authorization

**Goal:** Connect persisted Match replay pages to trusted owner debug authorization so real owner replay flows can inspect Soldier inactivity explanations without exposing private data publicly.
**Mode:** standard
**Status:** Not Planned

**Requirements:** DEBUG-04, DEBUG-05

**Success Criteria:**
1. A persisted Match replay opened by an authorized owner can opt into owner debug mode.
2. `ReplayReadyDto.ownerDebug.soldierInactivityExplanations` reaches the replay client only for authorized owner views.
3. Public persisted replay views remain privacy-safe by default and do not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or private runtime details.
4. A service-backed failing Strategy E2E or equivalent integration test proves runtime violation -> persisted Chronicle -> owner debug explanation.
5. Phase 8-13 milestone evidence includes formal verification or an explicit accepted replacement for `*-VERIFICATION.md` artifacts before the milestone is archived.

**Notes:**
- Inserted after the v1.1 audit found DEBUG-04 and DEBUG-05 partial for real persisted replay user flows.
- Keep authorization server-side; query parameters may request owner debug, but must not by themselves establish trust.

## Progress

| Milestone | Phases | Plans | Requirements | Status | Shipped |
| --- | ---: | ---: | ---: | --- | --- |
| v1.0 MVP | 7/7 | 33/33 | 80/80 | Complete | 2026-05-17 |
| v1.1 Trustworthy Simulation Beta | 5/6 | 25/25 | 32/34 | Gaps Found | — |

## Next

Plan Phase 13 to close the persisted owner replay debug gap before archiving v1.1.
