# Roadmap: Coward's Game

**Last updated:** 2026-05-20
**Current milestone:** v1.5 Strategy Workshop Power Tools and Advanced Strategy Library
**Granularity:** Standard
**Execution:** Sequential evidence/tooling spine first, then parallel tuning and verification where safe

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).
- ✅ **v1.1 Trustworthy Simulation Beta** — Phases 8-13, shipped 2026-05-18. See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md).
- ✅ **v1.2 Competitive Alpha** — Phases 14-18, shipped 2026-05-19. See [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md).
- ✅ **v1.3 Competition Trust Beta** — Phases 19-24, shipped 2026-05-20. See [v1.3-ROADMAP.md](milestones/v1.3-ROADMAP.md).
- ✅ **v1.4 Cycle-Interleaved Rules Correction** — Phases 25-29, shipped 2026-05-20. See [v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md).
- ◆ **v1.5 Strategy Workshop Power Tools and Advanced Strategy Library** — Phases 30-37, planning complete.

## Overview

Coward's Game v1.5 improves the Strategy Workshop from a single-test authoring surface into a deterministic Strategy lab. Players should be able to run selected immutable Strategy Revisions through gauntlet matrices, compare revisions, inspect validation/runtime diagnostics, hand off interesting or failed tests to replay, and read performance summaries tied to exact deterministic Match/MatchSet evidence.

The milestone then uses those tools and v1.4 demo result evidence to create a distinct Advanced Strategy Library: 8-10 stronger, diverse Strategies that cover pressure/contact, anti-backstab positioning, wall control, center control, contraction survival, evasive mobility, trap/control, mirror-breaking/adaptive play, late-cycle stabilization, and memory-based opponent response. The accepted set must be validated through deterministic starter and advanced gauntlets, curated example MatchSets, replay review, and a completed v1.5 demo tournament.

This milestone does not create durable ratings, official public tournament operations, production sandbox hardening, custom arenas, non-JS runtimes, live model inference, or human input during Matches.

## Phase Summary

| Phase | Name | Goal | Requirements | Status |
| --- | --- | --- | ---: | --- |
| 30 | Workshop Power Tools | Add deterministic gauntlet matrix, revision comparison, structured diagnostics, replay handoff, and performance summaries to the Strategy Workshop. | 15 | Pending |
| 31 | Result Data Analysis and Evidence Model | Analyze v1.4 results and define reusable evidence summaries, Chronicle-derived behavior signals, dominance review triggers, and local report shape. | 6 | Pending |
| 32 | Advanced Strategy Library Design | Create and publish the distinct v1.5 Advanced Strategy tier with archetype coverage, immutable seed Revisions, cards, and Workshop fork/apply flows. | 10 | Pending |
| 33 | Deterministic Gauntlet Validation | Run starter, advanced, and curated counter gauntlets; tune the advanced set through documented deterministic review gates. | 7 | Pending |
| 34 | Example MatchSet Generation | Generate representative example MatchSets for archetype interactions and link them from the local demo/report. | 2 | Pending |
| 35 | Completed Demo Tournament | Generate and complete a realistic 8+ entrant advanced-only demo tournament with counted MatchSets, standings, provenance, and replay links. | 4 | Pending |
| 36 | Replay Review and Tuning | Review representative replays for realism, diversity, and non-degenerate tactical play; document any tuning and rerun evidence. | 4 | Pending |
| 37 | Demo and Regression Verification | Browser-verify public/owner evidence paths, run determinism/privacy/runtime isolation tests, and update documentation before milestone completion. | 5 | Pending |

**Coverage:** 53 v1.5 requirements mapped, 0 unmapped.

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

<details>
<summary>✅ v1.4 Cycle-Interleaved Rules Correction (Phases 25-29) — SHIPPED 2026-05-20</summary>

- [x] Phase 25: Rule Source-of-Truth Version (1/1 plan)
- [x] Phase 26: Engine Cycle Scheduler Rewrite (1/1 plan)
- [x] Phase 27: Chronicle and Replay Rebaseline (1/1 plan)
- [x] Phase 28: Starter Strategy and Input Rebaseline (1/1 plan)
- [x] Phase 29: Demo Competition Rebuild (1/1 plan)

Archived phase details: [v1.4-ROADMAP.md](milestones/v1.4-ROADMAP.md), [v1.4-REQUIREMENTS.md](milestones/v1.4-REQUIREMENTS.md), and [v1.4-phases/](milestones/v1.4-phases/).

</details>

### Phase 30: Workshop Power Tools

**Goal:** Add deterministic gauntlet matrix, revision comparison, structured diagnostics, replay handoff, and performance summaries to the Strategy Workshop.
**Mode:** standard
**Status:** Pending

**Requirements:** WSHOP-01, WSHOP-02, WSHOP-03, WSHOP-04, WSHOP-05, WSHOP-06, WSHOP-07, WSHOP-08, WSHOP-09, DIAG-01, DIAG-02, DIAG-03, DIAG-04, DIAG-05, DIAG-06

**Success Criteria:**
1. Users can select submitted immutable Strategy Revisions, opponents, and presets to launch deterministic gauntlet matrices with visible match count and caps.
2. Matrix profiles persist compatibility metadata and expand in stable order.
3. Matrix cells show live status, outcome, failure category, scoring impact, and replay links when available.
4. Users can compare owned immutable revisions with owner-only source diff, metadata deltas, validation deltas, and profile-safe result deltas.
5. Public diagnostics and replay handoff preserve all existing privacy and runtime isolation guarantees.

**Notes:**
- Reuse existing MatchSet/job/replay infrastructure rather than introducing a separate runner.
- Do not execute Strategy code in React, the browser, Next.js route handlers, API processes, or Node `vm`.
- Source diff is owner-authorized only; public cards may show hashes and records, not private source.

### Phase 31: Result Data Analysis and Evidence Model

**Goal:** Analyze v1.4 results and define reusable evidence summaries, Chronicle-derived behavior signals, dominance review triggers, and local report shape.
**Mode:** standard
**Status:** Pending

**Requirements:** EVID-01, EVID-02, EVID-03, EVID-04, EVID-05, EVID-06

**Success Criteria:**
1. v1.4 demo results are analyzed, including Backstab Hunter, Aggro Chaser, and Wall Press as fixed benchmark evidence.
2. Evidence summaries include standings, W-L-D, points, counted status, rule/Chronicle/runtime versions, generated-at timestamp, and representative links.
3. Chronicle-derived behavior signals support archetype claims without exposing private payloads.
4. Review triggers identify dominance, filler entrants, overfitting, missing archetype behavior, system-failed standings, and privacy regressions.
5. A local report shape is ready for advanced-vs-starter and advanced-vs-advanced evidence.

**Notes:**
- Treat v1.4 winners as benchmarks, not as templates for the whole advanced set.
- Evidence should be generated from MatchSet/Chronicle summaries where possible, not hand-maintained prose.

### Phase 32: Advanced Strategy Library Design

**Goal:** Create and publish the distinct v1.5 Advanced Strategy tier with archetype coverage, immutable seed Revisions, cards, and Workshop fork/apply flows.
**Mode:** standard
**Status:** Pending

**Requirements:** ADV-01, ADV-02, ADV-03, ADV-04, ADV-05, ADV-06, ADV-07, ADV-08, ADV-09, ADV-10

**Success Criteria:**
1. The Advanced Library is a distinct tier with target 10 Strategies and a documented quality gate for accepting 8-9.
2. The set covers the required archetypes or explicitly justifies any missing archetype.
3. Advanced Revisions are immutable system-owned seed Revisions with v1.5 provenance and compatibility metadata.
4. Public cards show safe doctrine, tags, records, hashes, and evidence links without leaking private source or memory data.
5. Workshop users can intentionally fork or apply Advanced Strategies.

**Notes:**
- Keep naming vivid but tied to canonical gameplay terms.
- Require source-hash and doctrine differences so advanced seeds are not minor Starter clones.
- Mix stateless and memory-based Strategies to preserve teaching diversity.

### Phase 33: Deterministic Gauntlet Validation

**Goal:** Run starter, advanced, and curated counter gauntlets; tune the advanced set through documented deterministic review gates.
**Mode:** standard
**Status:** Pending

**Requirements:** GAUNT-01, GAUNT-02, GAUNT-03, GAUNT-04, GAUNT-05, GAUNT-06, GAUNT-07

**Success Criteria:**
1. Every Advanced Strategy runs against all 10 v1.4 Starters.
2. The Advanced set runs against itself in a complete deterministic round robin or equivalent MatchSet suite.
3. Curated counter gauntlets validate anti-backstab, wall/edge control, center control vs mobility, contraction survival, trap/control vs pressure, and memory adaptation.
4. Every Advanced Strategy has at least one representative replay link and one close/favorable matchup proving its role.
5. Tuning is performed only through documented review triggers and regenerated source hashes/provenance.

**Notes:**
- Specialists may have uneven aggregate records if their role is real and replay-backed.
- System failures and non-counted outcomes must not masquerade as Strategy performance.

### Phase 34: Example MatchSet Generation

**Goal:** Generate representative example MatchSets for archetype interactions and link them from the local demo/report.
**Mode:** standard
**Status:** Pending

**Requirements:** DEMO-01, DEMO-02

**Success Criteria:**
1. At least five curated example MatchSets demonstrate meaningful archetype interactions.
2. Example MatchSets are complete, counted when eligible, replay-backed, and linked from the local demo/report.
3. Selected v1.4 benchmark starters are included where they clarify advanced Strategy behavior.

**Notes:**
- Prefer non-transitive and counter-style examples over strongest-vs-weakest demonstrations.
- Example MatchSets should be reproducible from local scripts or documented commands.

### Phase 35: Completed Demo Tournament

**Goal:** Generate and complete a realistic 8+ entrant advanced-only demo tournament with counted MatchSets, standings, provenance, and replay links.
**Mode:** standard
**Status:** Pending

**Requirements:** DEMO-03, DEMO-04, DEMO-05, DEMO-06

**Success Criteria:**
1. The tournament has at least 8 Advanced entrants if the accepted set is strong enough.
2. Tournament standings are decided only by complete, counted, replay-backed MatchSets.
3. Tournament pages show entrants, format, standings or stage results, MatchSet links, replay links, provenance, and non-durable demo framing.
4. Public tournament links connect to Strategy cards and player/profile pages where applicable without private-data leaks.

**Notes:**
- Round robin or group round robin is preferred because it shows matchup texture.
- Do not present the tournament as official public operations or durable ranking truth.

### Phase 36: Replay Review and Tuning

**Goal:** Review representative replays for realism, diversity, and non-degenerate tactical play; document any tuning and rerun evidence.
**Mode:** standard
**Status:** Pending

**Requirements:** REV-01, REV-02, REV-03, REV-04

**Success Criteria:**
1. Replays from starter gauntlets, advanced gauntlets, example MatchSets, and the tournament are reviewed.
2. Review confirms realistic Cycle-interleaved play, Cycle-boundary Backstab behavior, and diverse tactical families.
3. Any tuning after replay review is documented with source hash/provenance and rerun evidence.
4. The local report includes links to the example tournament, representative MatchSets, and representative replays.

**Notes:**
- Replay review is a product-quality gate, not only a correctness gate.
- Tune for credible diversity and tactical texture, not just the tournament champion.

### Phase 37: Demo and Regression Verification

**Goal:** Browser-verify public/owner evidence paths, run determinism/privacy/runtime isolation tests, and update documentation before milestone completion.
**Mode:** standard
**Status:** Pending

**Requirements:** VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04, VERIFY-05

**Success Criteria:**
1. Public DTO/page tests reject Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, and private runtime internals.
2. Determinism tests prove gauntlet profile expansion and summary ordering are stable.
3. Runtime/web isolation tests prove web/API routes create jobs but never execute Strategy code.
4. Browser verification covers Advanced Library, Strategy cards, MatchSet pages, tournament page, player/profile pages if applicable, and representative replays.
5. Docs describe Workshop tools, Advanced Library purpose, evidence vocabulary, local report regeneration, representative links, and non-durable framing.

**Notes:**
- This phase should produce a concise verification summary with local links.
- Browser verification should include realistic completed data, not only empty/scaffold states.

## Progress

| Milestone | Phases | Plans | Requirements | Status | Shipped |
| --- | ---: | ---: | ---: | --- | --- |
| v1.0 MVP | 7/7 | 33/33 | 80/80 | Complete | 2026-05-17 |
| v1.1 Trustworthy Simulation Beta | 6/6 | 29/29 | 34/34 | Complete | 2026-05-18 |
| v1.2 Competitive Alpha | 5/5 | 10/10 | 33/33 | Complete | 2026-05-19 |
| v1.3 Competition Trust Beta | 6/6 | 6/6 | 51/51 | Complete | 2026-05-20 |
| v1.4 Cycle-Interleaved Rules Correction | 5/5 | 5/5 | 33/33 | Complete | 2026-05-20 |
| v1.5 Strategy Workshop Power Tools and Advanced Strategy Library | 0/8 | 0/8 | 0/53 | Planning | — |

## Next

Start Phase 30 with `$gsd-plan-phase 30`.
