# Roadmap: Coward's Game

**Last updated:** 2026-05-20
**Current milestone:** v1.4 Cycle-Interleaved Rules Correction
**Granularity:** Standard
**Execution:** Sequential core contract first, then parallel where safe

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).
- ✅ **v1.1 Trustworthy Simulation Beta** — Phases 8-13, shipped 2026-05-18. See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md).
- ✅ **v1.2 Competitive Alpha** — Phases 14-18, shipped 2026-05-19. See [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md).
- ✅ **v1.3 Competition Trust Beta** — Phases 19-24, shipped 2026-05-20. See [v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md).
- ✅ **v1.4 Cycle-Interleaved Rules Correction** — Phases 25-29, implemented and audit-fix clean on 2026-05-20.

## Overview

Coward's Game v1.4 corrects a core gameplay requirement: selected Soldiers should swap turns between Cycles, not resolve entire Activations before the next selected Soldier acts. The milestone updates the upstream rule source of truth, engine scheduler, Chronicle/replay model, starter Strategy library, preconfigured Strategy inputs, and demo ladder evidence around the corrected Cycle-interleaved timing. Backstab is checked at the start and end of every Cycle using simultaneous all-board resolution.

## Phase Summary

| Phase | Name | Goal | Requirements | Status |
| --- | --- | --- | ---: | --- |
| 25 | Rule Source-of-Truth Version | Publish a corrected canonical rules version and technical architecture note for Cycle-interleaved scheduling and Cycle-boundary Backstab. | 7 | Complete |
| 26 | Engine Cycle Scheduler Rewrite | Replace full-Activation sequencing with deterministic Cycle-layer scheduling while preserving Activation state, no-Advance stoning, and match outcomes. | 8 | Complete |
| 27 | Chronicle and Replay Rebaseline | Update Chronicle grammar, replay reconstruction, fixtures, and UI/debug assumptions for interleaved Activation Cycles. | 6 | Complete |
| 28 | Starter Strategy and Input Rebaseline | Update starter Strategies, templates, fixture Strategies, and preconfigured inputs for the corrected tactical timing. | 7 | Complete |
| 29 | Demo Competition Rebuild | Regenerate and validate sample MatchSets, ladder standings, public pages, and replay evidence under the corrected rule version. | 5 | Complete |

**Coverage:** 33 v1.4 requirements mapped and completed, 0 unmapped.

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-7) — SHIPPED 2026-05-17</summary>

- [x] Phase 1: Foundation And Spec Contracts (4/4 plans)
- [x] Phase 2: Pure Rules Engine (5/5 plans)
- [x] Phase 3: Chronicle And Replay Core (5/5 plans)
- [x] Phase 4: Strategy Runtime Sandbox (4/4 plans)
- [x] Phase 5: Match Orchestration And Persistence (5/5 plans)
- [x] Phase 6: Strategy Workshop Ux (5/5 plans)
- [x] Phase 7: Replay Viewer And End To End Verification (5/5 plans)

Archived phase details: [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) and [v1.0-phases/](milestones/v1.0-phases/).

</details>

<details>
<summary>✅ v1.1 Trustworthy Simulation Beta (Phases 8-13) — SHIPPED 2026-05-18</summary>

- [x] Phase 8: Replay Fixture Fidelity and Visual Regression (4/4 plans)
- [x] Phase 9: Strict Chronicle Grammar and Compatibility (5/5 plans)
- [x] Phase 10: Runtime Isolation Hardening (5/5 plans)
- [x] Phase 11: Doctrine Debugging UX (6/6 plans)
- [x] Phase 12: Local and CI Reliability (5/5 plans)
- [x] Phase 13: Close Gap: Persisted Owner Replay Debug Authorization (4/4 plans)

Archived phase details: [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) and [v1.1-phases/](milestones/v1.1-phases/).

</details>

<details>
<summary>✅ v1.2 Competitive Alpha (Phases 14-18) — SHIPPED 2026-05-19</summary>

- [x] Phase 14: Competitive Ownership and Sessions (2/2 plans)
- [x] Phase 15: MatchSet Competition Model (2/2 plans)
- [x] Phase 16: Exhibition Queue and Entry (2/2 plans)
- [x] Phase 17: Result Pages and Replay Evidence (2/2 plans)
- [x] Phase 18: Abuse and Fairness Guardrails (2/2 plans)

Archived phase details: [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) and [v1.2-phases/](milestones/v1.2-phases/).

</details>

<details>
<summary>✅ v1.3 Competition Trust Beta (Phases 19-24) — SHIPPED 2026-05-20</summary>

- [x] Phase 19: Starter Strategy Library (1/1 plan)
- [x] Phase 20: Trial Ladder Season Model (1/1 plan)
- [x] Phase 21: Ladder Scheduling and Standings (1/1 plan)
- [x] Phase 22: Public Profiles and Strategy Cards (1/1 plan)
- [x] Phase 23: Disputes and Competition Governance (1/1 plan)
- [x] Phase 24: Production Runtime Boundary Spike (1/1 plan)

Archived phase details: [v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md) and [v1.3-phases/](milestones/v1.3-phases/).

</details>

### Phase 25: Rule Source-of-Truth Version

**Goal:** Publish a corrected canonical rules version and technical architecture note for Cycle-interleaved scheduling and Cycle-boundary Backstab.
**Mode:** standard
**Status:** Complete

**Requirements:** RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07

**Success Criteria:**
1. A new canonical spec version clearly supersedes the current full-Activation Round timing language.
2. Round examples show selected Soldier slots repeating by Cycle layer, not one Soldier monopolizing all 12 Cycles.
3. Backstab boundaries are defined as Cycle-start and Cycle-end checks across all ACTIVE Soldiers using simultaneous snapshots.
4. The docs state how `post-advance` vocabulary changes under the new Cycle-end boundary.
5. Architecture notes identify every code and data surface that must follow the corrected rule version.

**Notes:**
- This phase should happen before engine work so implementation follows one written contract.
- Use canonical terms: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.
- Do not leave ambiguous "turn" language in the source-of-truth docs.

### Phase 26: Engine Cycle Scheduler Rewrite

**Goal:** Replace full-Activation sequencing with deterministic Cycle-layer scheduling while preserving Activation state, no-Advance stoning, and match outcomes.
**Mode:** standard
**Status:** Complete

**Requirements:** ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, ENGINE-05, ENGINE-06, ENGINE-07, ENGINE-08

**Success Criteria:**
1. Round resolution selects Activations once, then loops Cycle layer 0 through 11 across the Round snake slot order.
2. Ended Activations are skipped without additional SoldierBrain calls or memory writes.
3. Cycle-start and Cycle-end Backstab checks happen before input and after Action resolution, respectively.
4. No-Advance stoning and FALLEN exception remain deterministic per selected Activation.
5. Focused engine tests prove ordering, skip behavior, memory progression, terminal reasons, Backstab, and match-end interruption.

**Notes:**
- This is the highest-risk phase because it changes the pure rules engine.
- Preserve deterministic serialization and keep all game rules out of React.
- Strategy runtime should still execute only through worker/runtime boundaries.

### Phase 27: Chronicle and Replay Rebaseline

**Goal:** Update Chronicle grammar, replay reconstruction, fixtures, and UI/debug assumptions for interleaved Activation Cycles.
**Mode:** standard
**Status:** Complete

**Requirements:** REPLAY-01, REPLAY-02, REPLAY-03, REPLAY-04, REPLAY-05, REPLAY-06

**Success Criteria:**
1. Chronicle grammar permits and validates multiple concurrently open selected Activations within a Round.
2. Replay reconstruction matches the engine for interleaved Cycle events.
3. Fixture scenarios are regenerated under the corrected rule version.
4. Replay UI and debug explanations remain understandable when Cycle events alternate Soldiers.
5. Public replay privacy guarantees remain intact.

**Notes:**
- Existing grammar likely assumes one active Activation at a time; expect this to be a real rebaseline.
- Preserve replay determinism and integrity hash behavior while introducing rule-version compatibility.

### Phase 28: Starter Strategy and Input Rebaseline

**Goal:** Update starter Strategies, templates, fixture Strategies, and preconfigured inputs for the corrected tactical timing.
**Mode:** standard
**Status:** Complete

**Requirements:** STRAT-01, STRAT-02, STRAT-03, STRAT-04, STRAT-05, STRAT-06, STRAT-07

**Success Criteria:**
1. Strategy docs explain that SoldierBrain may observe board changes caused by other selected Soldiers between its own Cycles.
2. All 10 starter Strategies validate and run credibly under Cycle-interleaved scheduling.
3. Templates, samples, failure examples, and fixture Strategies use corrected rule terminology.
4. Starter smoke coverage checks movement, shrink avoidance, Backstab exposure, memory, and survival.
5. Demo entrants are regenerated or clearly marked stale until regenerated.

**Notes:**
- The starter set should be retuned as product behavior, not only test fixtures.
- At least the memory-using starters should demonstrate useful adaptation to changed board state between Cycles.

### Phase 29: Demo Competition Rebuild

**Goal:** Regenerate and validate sample MatchSets, ladder standings, public pages, and replay evidence under the corrected rule version.
**Mode:** standard
**Status:** Complete

**Requirements:** DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05

**Success Criteria:**
1. Developer can run a v1.4 demo ladder seeded from corrected starter Strategies.
2. Ladder standings, MatchSet result pages, replay links, public profiles, Strategy cards, and governance states render locally.
3. Demo replays show realistic interleaved tactical play and commonly last into board contraction.
4. Result provenance distinguishes v1.4 rule-version evidence from old v1.3 demo evidence.
5. End-to-end verification covers engine, replay, persistence, worker, web, starter, and demo-tournament paths.

**Notes:**
- This phase should include a human-readable demo validation summary, not only green tests.
- Keep invalid/degraded handling from v1.3 intact so standings remain trustworthy.

## Progress

| Milestone | Phases | Plans | Requirements | Status | Shipped |
| --- | ---: | ---: | ---: | --- | --- |
| v1.0 MVP | 7/7 | 33/33 | 80/80 | Complete | 2026-05-17 |
| v1.1 Trustworthy Simulation Beta | 6/6 | 29/29 | 34/34 | Complete | 2026-05-18 |
| v1.2 Competitive Alpha | 5/5 | 10/10 | 33/33 | Complete | 2026-05-19 |
| v1.3 Competition Trust Beta | 6/6 | 6/6 | 51/51 | Complete | 2026-05-20 |
| v1.4 Cycle-Interleaved Rules Correction | 5/5 | 5/5 | 33/33 | Complete | 2026-05-20 |

## Next

Archive or ship v1.4, then choose the next milestone.
