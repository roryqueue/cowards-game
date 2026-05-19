# Roadmap: Coward's Game

**Last updated:** 2026-05-19
**Current milestone:** v1.3 Competition Trust Beta
**Granularity:** Standard
**Execution:** Parallel where phase plans are independent

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).
- ✅ **v1.1 Trustworthy Simulation Beta** — Phases 8-13, shipped 2026-05-18. See [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md).
- ✅ **v1.2 Competitive Alpha** — Phases 14-18, shipped 2026-05-19. See [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md).
- ✅ **v1.3 Competition Trust Beta** — Phases 19-24, completed 2026-05-19. See [v1.3-MILESTONE-AUDIT.md](milestones/v1.3-MILESTONE-AUDIT.md).

## Overview

Coward's Game v1.3 turns the alpha competitive surface into a trustable beta loop. A new player can fork a credible starter Strategy, test it in exhibition, enter one eligible revision into a resettable trial ladder, inspect standings and replay-backed evidence, and rely on governance, privacy, and runtime boundaries that keep counted results trustworthy without promising permanent ratings.

## Phase Summary

| Phase | Name | Goal | Requirements | Status |
| --- | --- | --- | ---: | --- |
| 19 | Starter Strategy Library | Seed a credible, forkable library of playable starter doctrines and make them normal account-owned Strategy Revisions when forked. | 7 | Complete |
| 20 | Trial Ladder Season Model | Define resettable season, entry, eligibility, snapshot, next-season replacement, stale revision, and publication contracts. | 14 | Complete |
| 21 | Ladder Scheduling and Standings | Generate deterministic ladder MatchSets, aggregate counted standings, and exclude invalid/degraded/system-failed results from rankings. | 9 | Complete |
| 22 | Public Profiles and Strategy Cards | Publish privacy-safe player handle pages and Strategy cards with lineage, history, standings, results, and replay links. | 6 | Complete |
| 23 | Disputes and Competition Governance | Add result flagging, admin review, invalid/non-competitive marking, standings exclusion, and audit logs. | 8 | Complete |
| 24 | Production Runtime Boundary Spike | Choose and prototype the production Strategy runtime boundary behind the existing adapter with hostile regression coverage. | 7 | Complete |

**Coverage:** 51 v1.3 requirements mapped, 0 unmapped.

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

<details>
<summary>✅ v1.1 Trustworthy Simulation Beta (Phases 8-13) — SHIPPED 2026-05-18</summary>

- [x] Phase 8: Replay Fixture Fidelity and Visual Regression (4/4 plans) — archived in `.planning/milestones/v1.1-phases/08-replay-fixture-fidelity-and-visual-regression/`
- [x] Phase 9: Strict Chronicle Grammar and Compatibility (5/5 plans) — archived in `.planning/milestones/v1.1-phases/09-strict-chronicle-grammar-and-compatibility/`
- [x] Phase 10: Runtime Isolation Hardening (5/5 plans) — archived in `.planning/milestones/v1.1-phases/10-runtime-isolation-hardening/`
- [x] Phase 11: Doctrine Debugging UX (6/6 plans) — archived in `.planning/milestones/v1.1-phases/11-doctrine-debugging-ux/`
- [x] Phase 12: Local and CI Reliability (5/5 plans) — archived in `.planning/milestones/v1.1-phases/12-local-and-ci-reliability/`
- [x] Phase 13: Close Gap: Persisted Owner Replay Debug Authorization (4/4 plans) — archived in `.planning/milestones/v1.1-phases/13-close-gap-persisted-owner-replay-debug-authorization/`

</details>

<details>
<summary>✅ v1.2 Competitive Alpha (Phases 14-18) — SHIPPED 2026-05-19</summary>

- [x] Phase 14: Competitive Ownership and Sessions (2/2 plans) — archived in `.planning/milestones/v1.2-phases/14-competitive-ownership-and-sessions/`
- [x] Phase 15: MatchSet Competition Model (2/2 plans) — archived in `.planning/milestones/v1.2-phases/15-matchset-competition-model/`
- [x] Phase 16: Exhibition Queue and Entry (2/2 plans) — archived in `.planning/milestones/v1.2-phases/16-exhibition-queue-and-entry/`
- [x] Phase 17: Result Pages and Replay Evidence (2/2 plans) — archived in `.planning/milestones/v1.2-phases/17-result-pages-and-replay-evidence/`
- [x] Phase 18: Abuse and Fairness Guardrails (2/2 plans) — archived in `.planning/milestones/v1.2-phases/18-abuse-and-fairness-guardrails/`

</details>

### Phase 19: Starter Strategy Library

**Goal:** Seed a credible, forkable library of playable starter doctrines and make them normal account-owned Strategy Revisions when forked.
**Mode:** standard
**Status:** Complete

**Requirements:** START-01, START-02, START-03, START-04, START-05, START-06, START-07

**Success Criteria:**
1. A new player can browse approximately 10 named starter Strategies covering distinct tactical doctrines.
2. Each starter exposes safe metadata, doctrine notes, expected behavior, validation status, source hash, and source in the Workshop library.
3. A signed-in user can fork a starter into an account-owned Strategy without mutating the system template.
4. Forked starters behave like normal immutable Strategy Revisions and can be tested in exhibition.
5. Tests validate every starter and run starter smoke coverage without forbidden runtime behavior.

**Notes:**
- The starter set should include Centerline Bully, Corner Lurker, Backstab Hunter, Wall Press, Ring Runner, Mirror Breaker, Center Turtle, Aggro Chaser, Escape Artist, and Trap Setter.
- Keep source readable and doctrine-commented; competence matters, opacity does not.
- Do not auto-submit starters to competitions.

### Phase 20: Trial Ladder Season Model

**Goal:** Define resettable season, entry, eligibility, snapshot, next-season replacement, stale revision, and publication contracts.
**Mode:** standard
**Status:** Complete

**Requirements:** SEASON-01, SEASON-02, SEASON-03, SEASON-04, SEASON-05, SEASON-06, ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04, ENTRY-05, ENTRY-06, ENTRY-07, ENTRY-08

**Success Criteria:**
1. A public trial ladder season can be created, opened, closed, completed, archived, and viewed without any permanent rating semantics.
2. Signed-in users can enter exactly one valid owned immutable Strategy Revision snapshot per active season.
3. Exhibition self-play remains unchanged while ladder eligibility enforces one active revision per user.
4. Next-season-only replacement and stale revision behavior are encoded in contracts, persistence, and user-facing rejection messages.
5. Season public state clearly distinguishes pending, open, scheduling, active, completed, and archived.

**Notes:**
- Avoid Elo, Glicko, all-time leaderboard, official tier, prize, or tournament naming.
- Entry snapshots should reuse v1.2 entrant snapshot vocabulary where possible.
- This phase is the trust contract for later scheduling and standings.

### Phase 21: Ladder Scheduling and Standings

**Goal:** Generate deterministic ladder MatchSets, aggregate counted standings, and exclude invalid/degraded/system-failed results from rankings.
**Mode:** standard
**Status:** Complete

**Requirements:** SCHED-01, SCHED-02, SCHED-03, SCHED-04, SCHED-05, SCHED-06, SCHED-07, SCHED-08, SCHED-09

**Success Criteria:**
1. Developer or scheduler can form deterministic seeded or round-robin pods from eligible season entries.
2. Generated ladder MatchSets reuse existing MatchSet, Match, worker, scoring, Chronicle, replay, and result infrastructure.
3. Users can see ladder entry and MatchSet lifecycle states from pending through complete, degraded, invalid, or non-competitive.
4. Public standings aggregate only counted MatchSets with complete scoring and replay/provenance evidence.
5. Tests prove deterministic scheduling, standings recomputation, tie-breakers, counted/non-counted exclusion, and retry/degraded handling.

**Notes:**
- Stable entry ids, snapshot hashes, preset policy, and explicit scheduler decisions should drive ordering.
- Do not let database row order, wall-clock timing, or worker scheduling affect pairings or tie-breakers.
- Standings should be recomputable from source evidence, even if cached for display.

### Phase 22: Public Profiles and Strategy Cards

**Goal:** Publish privacy-safe player handle pages and Strategy cards with lineage, history, standings, results, and replay links.
**Mode:** standard
**Status:** Complete

**Requirements:** PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06

**Success Criteria:**
1. Public player handle pages show display name, handle, public Strategies, ladder history, record, and result/replay links.
2. Public Strategy cards show name, description, tags, author handle, lineage metadata, source hash, runtime compatibility, competition history, and replay/result links.
3. Public profile/card DTOs reject private Strategy source, memory, objective, owner debug, raw Awareness Grid, runtime internal, and private error fields.
4. Authorized owners still have server-side affordances to fork, edit, inspect source, and debug.
5. Tests prove privacy-safe projections and stable links from profiles/cards to seasons, MatchSets, and replays.

**Notes:**
- Public Strategy pride and learning are goals; source disclosure is not.
- Lineage should describe revision relationships and metadata without exposing private code.

### Phase 23: Disputes and Competition Governance

**Goal:** Add result flagging, admin review, invalid/non-competitive marking, standings exclusion, and audit logs.
**Mode:** standard
**Status:** Complete

**Requirements:** GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06, GOV-07, GOV-08

**Success Criteria:**
1. Signed-in users can flag MatchSet results with dispute notes tied to replay/provenance evidence.
2. Public result pages show counted, under-review, invalid, and non-competitive state.
3. Admin-only review can inspect provenance, snapshots, scoring, Chronicle hashes, failure classification, and private review details.
4. Admin invalidation or non-competitive marking excludes MatchSets from standings without deleting public replay evidence.
5. Audit logs capture actor, target, timestamp, reason, before/after state, and public explanation for all governance decisions.

**Notes:**
- Keep this focused: result governance, not a full enterprise admin platform.
- Public moderation output must remain privacy-safe.
- Standings exclusion should be recomputable from moderation state.

### Phase 24: Production Runtime Boundary Spike

**Goal:** Choose and prototype the production Strategy runtime boundary behind the existing adapter with hostile regression coverage.
**Mode:** standard
**Status:** Complete

**Requirements:** RUNTIME-01, RUNTIME-02, RUNTIME-03, RUNTIME-04, RUNTIME-05, RUNTIME-06, RUNTIME-07

**Success Criteria:**
1. Developer can read a documented recommendation for hardened subprocess, containerized subprocess, or WASM/WASI prototype as the v1.3 production boundary path.
2. The chosen boundary is implemented or prototyped behind `StrategyExecutionAdapter` without changing engine rules or Strategy API contracts.
3. Worker-thread runtime remains available and clearly labeled as local/dev fallback.
4. Adapter metadata exposes isolation boundary, resource controls, timeout/output behavior, environment policy, and production-readiness state.
5. Hostile Strategy regression coverage proves forbidden capability, timeout, memory/output pressure, invalid output, thrown exception, malformed IPC, and subprocess/container termination behavior.

**Notes:**
- Node worker threads are not the production hostile-code security boundary.
- Node `node:wasi` should not be relied on for untrusted Strategy execution.
- Keep Strategy failure vs system failure taxonomy crisp so standings are not distorted.

## Progress

| Milestone | Phases | Plans | Requirements | Status | Shipped |
| --- | ---: | ---: | ---: | --- | --- |
| v1.0 MVP | 7/7 | 33/33 | 80/80 | Complete | 2026-05-17 |
| v1.1 Trustworthy Simulation Beta | 6/6 | 29/29 | 34/34 | Complete | 2026-05-18 |
| v1.2 Competitive Alpha | 5/5 | 10/10 | 33/33 | Complete | 2026-05-19 |
| v1.3 Competition Trust Beta | 6/6 | 6/6 | 51/51 | Complete | 2026-05-19 |

## Next

Use the completed v1.3 demo ladder at `/ladder/v13-demo` to review player-facing trust flow and tune Starter Strategy balance in a future milestone.
