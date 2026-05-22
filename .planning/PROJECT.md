# Coward's Game

## Current State

**Shipped version:** v1.5 Strategy Workshop Power Tools and Advanced Strategy Library on 2026-05-21
**Current milestone:** v1.6 Workshop Analytics and Evidence Explorer.
**Status:** v1.6 milestone definition in progress.
**Last audit:** v1.5 milestone audit passed, 53/53 requirements satisfied.

Coward's Game is a deterministic two-player programmable strategy game for the web. Players can author immutable JS/TS Strategy Revisions, save account-owned revisions, fork credible starter Strategies, enter exhibitions or resettable trial ladder seasons, inspect fair standings and replay evidence, and trust that public outputs do not expose private Strategy data.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Current Milestone: v1.6 Workshop Analytics and Evidence Explorer

**Goal:** Turn v1.5's deterministic evidence into studyable Workshop analytics through saved gauntlet profiles, matchup heatmaps, evidence bands, replay deep links, and owner-safe exportable summaries.

**Target features:**
- Saved named gauntlet profiles with exact opponents, presets, seeds, rule versions, scoring policy, and revision ids.
- Compatibility-aware profile reruns and comparisons that never execute Strategy code in the web/API process.
- Workshop matchup heatmaps across selected Strategies and opponents, including W-L-D, points, failures, side bias, evidence confidence, and evidence counts.
- Evidence explorer drilldowns from Strategy to opponent to MatchSet to replay.
- Replay deep links to meaningful public moments such as Backstab, contraction, no-advance cleanup, fall, decisive push, and late-cycle stabilization.
- Owner-only JSON/CSV exports for deterministic gauntlet summaries that preserve public privacy boundaries.

## Latest Shipped Milestone: v1.5 Strategy Workshop Power Tools and Advanced Strategy Library

**Goal:** Improve the Strategy Workshop into a stronger authoring and testing lab, then use it plus v1.4 evidence to create and validate a diverse Advanced Strategy Library, example MatchSets, and a completed realistic tournament.

**Delivered:**
- Advanced Strategy Library with 10 validated v1.5 seeds across pressure, anti-backstab, wall control, center control, contraction survival, evasive mobility, trap/control, mirror/adaptive play, late-cycle stabilization, and memory response.
- Workshop Advanced Library entry point, apply/fork flows, comparison support, gauntlet/result framing, diagnostics, replay handoff, and performance summaries.
- Public-safe `advancedLineage` metadata across immutable revisions, Strategy cards, player/profile pages, and Workshop surfaces.
- Deterministic local evidence from five example MatchSets and one completed 8-entrant Advanced-only demo tournament at `/ladder/v1-5-demo`.
- Replay-reviewed second-take Strategy retune with shared tactical fundamentals: leave starting edge early, seek Backstab opportunities, avoid contraction-edge risk, avoid direct self-stoning, and avoid off-board/wall/stone/terrain/immediate-reversal moves.
- Browser-verified public pages and representative replays with no default exposure of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, or private runtime internals.

## Next Milestone Goals

v1.6 is now active. Candidate directions not included in this milestone remain:

- Replay analysis UX beyond targeted deep links, such as full timeline search, event filters, threat/backstab overlays, contraction risk markers, and side-by-side replay comparison.
- Public competition operations: official scheduled tournament formats, governance/moderation flows, and clearer public tournament pages without durable ratings yet.
- Production runtime hardening: promote containerized subprocess isolation toward a production-grade hostile-code boundary.
- Strategy authoring ergonomics: snippets, lint rules, local tactical helpers, and stronger diagnostics for common no-advance/trapped-Soldier mistakes.

## Validated in v1.4

- ✓ Canonical `cowards-rules-v1.4` rule and architecture docs for Cycle-interleaved selected slots and Cycle-boundary Backstab.
- ✓ Pure engine scheduler now resolves selected Soldier slots by Cycle layer, skips ended slots, treats blocked movement as a non-terminal Cycle cost, and emits Cycle lifecycle summaries.
- ✓ Chronicle and replay stack rebaseline to `chronicle-v1.4`, current compatibility versions, v1.4 lifecycle events, and active replay fixtures.
- ✓ Replay viewer playback now offers seven speed options up to 32x and defaults to 2x the original playback pace for denser v1.4 Cycle timelines.
- ✓ Starter Strategy Library keeps stable IDs while publishing v1.4 lineage, refreshed source hashes, and a real interleaved starter gauntlet.
- ✓ Completed local demo ladder at `/ladder/v1-4-demo` with 8 v1.4 starter entrants, 96 replay-backed Chronicles, counted MatchSets, and browser-verified public pages.

## Validated in v1.5

- ✓ Workshop Advanced Library entry point, apply/fork flows, revision comparison support, gauntlet/result framing, diagnostics, replay handoff, and performance summaries.
- ✓ Distinct 10-strategy Advanced Library with v1.5 lineage, public-safe archetype metadata, memory/stateless diversity, source hashes, and validation.
- ✓ Deterministic evidence model and report artifacts covering standings, W-L-D, counted status, rule/Chronicle versions, runtime adapter, behavior metrics, representative links, and non-durable framing.
- ✓ Five example MatchSets covering anti-backstab stress, wall control under pressure, center control vs mobility, trap breakpoint, and memory adaptation mirror.
- ✓ Completed 8-entrant Advanced-only local demo tournament at `/ladder/v1-5-demo`, with Center Gravity finishing 6-1-0 and no sweep.
- ✓ Second-take Advanced Strategy retune validated across 33 Chronicles: 7103 Moves, 412 Backstab resolutions, 0 blocked moves, 0 direct self-stoning, and 0 self off-board moves.
- ✓ Browser checks for Workshop, tournament, MatchSet, Strategy card, player/profile, and replay pages with public privacy boundaries intact.

## Validated in v1.0

- ✓ TypeScript monorepo, local workflow, canonical contracts, and versioning spine.
- ✓ Pure deterministic Coward's Game rules engine and invariant test suite.
- ✓ Chronicle creation, validation, hashing, reconstruction, public projection, and owner-only debug projection.
- ✓ Immutable JS/TS Strategy Revisions with safe validation APIs and worker-only runtime execution.
- ✓ PostgreSQL-backed Match/MatchSet persistence, migrations, worker jobs, retries, Chronicle storage, and deterministic scoring.
- ✓ Strategy Workshop authoring UX with Monaco, templates, validation, submission, revision history, and test launch/status.
- ✓ Replay viewer with Pixi board, timeline scrubber, inspector, event callouts, owner Awareness Grid, and full service-backed Workshop-to-replay E2E coverage.

## Validated in v1.1

- ✓ Engine-generated canonical replay fixtures for push, fall, contraction, legal Backstab, runtime failure, and endgame paths.
- ✓ Strict Chronicle grammar, compatibility checks, snapshot boundary validation, and impossible-state rejection before replay rendering.
- ✓ Public replay projection privacy gates for Strategy source, StrategyMemory, SoldierMemory, objectives, Awareness Grid details, and runtime internals.
- ✓ Replaceable Strategy execution adapter boundary with worker-thread metadata, subprocess JSON IPC spike, hostile Strategy matrix, timeouts, output caps, and failure taxonomy.
- ✓ Workshop debugging UX with actionable validation/runtime messages, sample Strategies, replay handoff links, and owner-only Soldier inactivity explanations.
- ✓ Persisted owner replay debug authorization for local Workshop Matches, proven through service-backed failing Strategy E2E.
- ✓ Docker and no-Docker local preflight paths plus service-backed, smoke, visual, and fast CI command slices.

## Validated in v1.2

- ✓ Username/password account creation, sign-in, sign-out, session persistence, display name, and public handle for competitive ownership.
- ✓ Stable User identity attached to account-owned immutable Strategy Revisions.
- ✓ Session-backed authorization for saving account revisions, entering owned revisions into exhibitions, and retrieving owner-only Strategy source.
- ✓ Competition presets, immutable entrant snapshots, MatchSet publication policy, deterministic scoring, tie-breakers, and public result DTO privacy checks.
- ✓ Unranked public exhibition MatchSets supporting 2-8 distinct owned revisions, including multiple revisions from the same user for alpha self-play.
- ✓ Public MatchSet result pages with status, standings, scoring policy, replay links, provenance, owner-only source affordances, and privacy-safe output.
- ✓ Abuse and fairness guardrails for rate limits, active duplicate submissions, valid entry criteria, public leak rejection, and runtime/web isolation boundaries.

## Validated in v1.3

- ✓ Forkable 10-strategy Starter Library with readable doctrine notes, source hashes, validation, memory-using starters, and Workshop apply/fork flows.
- ✓ Resettable trial ladder seasons with no permanent Elo/Glicko promise, explicit lifecycle states, one active Strategy Revision per user per season, immutable snapshots, next-season replacement, and stale revision policy.
- ✓ Deterministic ladder scheduling, pod MatchSet generation, counted standings, retry/degraded/non-counted handling, replay-backed evidence, and a completed local demo ladder at `/ladder/v13-demo`.
- ✓ Public player handle pages and public Strategy cards with lineage, records, tags, runtime compatibility, result links, and private-source/memory/debug exclusions.
- ✓ Focused competition governance with result flags, admin status marking, standings exclusion, public counted-state explanations, and audit logs.
- ✓ Containerized subprocess production-candidate Strategy runtime boundary behind `StrategyExecutionAdapter`, with worker-thread retained as local/dev fallback and hostile regression coverage.

## Context

Source specifications are archived in the repository root:

- `./CowardsGameSpec_Full_Consolidated_v1.md`
- `./CowardsGame_Technical_Architecture_Spec_V1.md`

Planning archives live under `.planning/milestones/`:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.0-phases/`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-INTEGRATION-CHECK.md`
- `.planning/milestones/v1.1-phases/`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.2-phases/`
- `.planning/milestones/v1.3-ROADMAP.md`
- `.planning/milestones/v1.3-REQUIREMENTS.md`
- `.planning/milestones/v1.3-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.3-phases/`
- `.planning/milestones/v1.4-ROADMAP.md`
- `.planning/milestones/v1.4-REQUIREMENTS.md`
- `.planning/milestones/v1.4-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.4-AUDIT-FIX.md`
- `.planning/milestones/v1.4-phases/`
- `.planning/milestones/v1.5-ROADMAP.md`
- `.planning/milestones/v1.5-REQUIREMENTS.md`
- `.planning/milestones/v1.5-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.5-AUDIT-FIX.md`
- `.planning/milestones/v1.5-phases/`

## Out of Scope Until Replanned

- Durable all-time ratings, permanent Elo/Glicko contracts, ranked prize ladders, public tournaments, and broad spectator/community surfaces beyond profiles, public Strategy cards, standings, results, and replay links.
- Randomized arena generation and custom user-created maps.
- Multi-language runtimes beyond the hardened JS/TS runtime boundary.
- Enterprise-grade authentication features such as email verification, password reset, OAuth, organizations, and account recovery.
- Live model inference or live human control during Matches.
- Monetization, cosmetics, strategy marketplace, and reinforcement-learning harnesses.

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Build simulation-first | Deterministic engine, replay correctness, sandboxed execution, and Strategy API clarity were foundational. | ✓ Good |
| Use a TypeScript monorepo | Shared contracts and package boundaries kept engine, runtime, replay, worker, and web code separated. | ✓ Good |
| Keep engine pure and runtime-agnostic | The engine consumes a StrategyRuntime interface without database/network/clock dependencies. | ✓ Good |
| Make Chronicle the canonical replay artifact | Enabled deterministic replay, strict validation, privacy projection, persistence, and visual replay. | ✓ Good |
| Replace hand-authored replay demos with engine-generated fixtures | Legal scenario fixtures caught mismatch between visual demos and actual rules. | ✓ Good |
| Treat Chronicle grammar as a trust contract | Invalid order, payload, snapshot, privacy, and version failures are rejected before rendering. | ✓ Good |
| Keep Strategy code out of web/API processes | Runtime execution stays behind worker/runtime boundaries with explicit adapter metadata and tests. | ✓ Good |
| Preserve JS/TS runtime while hardening boundary | Worker-thread execution remains prototype containment; subprocess adapter and hostile matrix clarify next sandbox direction. | ✓ Revisit for production sandbox |
| Keep owner debug server-authorized | Query params may request owner debug, but server-side participant checks decide whether owner DTOs are returned. | ✓ Good |
| Defer ladders until trust base is sharp | Avoids replay disputes, sandbox abuse, stale revisions, compatibility confusion, and privacy leaks before the platform is ready. | ✓ Good |
| Start competition with exhibition MatchSets | Unranked or seeded MatchSets provide real competitive evidence without committing to durable ratings too early. | ✓ Good |
| Add only minimal production ownership first | Competitive submissions need stable User identity and private-source authorization, but email/OAuth/recovery can wait. | ✓ Good |
| Allow same-user multi-revision exhibition entry in alpha | Self-play is valuable for doctrine testing; one-strategy-per-user belongs with ranked or more formal competition. | ✓ Good |
| Publish result evidence without Strategy internals | Public standings, replay links, hashes, and provenance are enough for alpha disputes while source/memory/objective data stays private. | ✓ Good |
| Use resettable trial ladders before durable ratings | Ranking pressure is useful, but permanent ratings should wait until abuse, moderation, and sandbox behavior are better understood. | ✓ Good |
| Seed starter Strategies as forkable templates | Players should begin with readable, credible doctrines they choose to fork, not opaque auto-submissions. | ✓ Good |
| Treat containerized subprocess as the production-candidate runtime path | It preserves the JS/TS Strategy API while adding a clearer process and container boundary than worker threads. | ✓ Revisit before real hostile public scale |
| Interleave selected Soldiers by Cycle, not full Activation | The intended game is simultaneous-feeling tactical pressure where selected Soldiers respond between Cycles instead of one Soldier consuming its whole Cycle budget before the next slot acts. | ✓ Implemented in v1.4 |
| Check Backstab at every Cycle boundary | Backstab should be a tactical contact rule checked before and after each SoldierBrain Cycle, not only at Activation boundaries. | ✓ Implemented in v1.4 |
| Treat advanced seed quality as product evidence | Advanced Strategies should have shared tactical fundamentals and replay-backed archetype roles, not merely stronger source comments around Starters. | ✓ Implemented in v1.5 |
| Keep demo tournaments non-durable | v1.5 tournament evidence is useful for validation and onboarding, but does not create official public operations or permanent rankings. | ✓ Good |

## Constraints

The active constraints remain: deterministic engine behavior, engine purity, Strategy Revision immutability, hostile Strategy treatment, runtime isolation, memory/source/output limits, package boundaries, replay privacy, Chronicle compatibility, and competitive integrity.

Future competition work must preserve exhibition self-play, avoid durable rating promises until governance and abuse data support them, keep all counted standings backed by replay/provenance evidence, and keep public player/Strategy surfaces free of Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, and private runtime internals by default. v1.5 created local example MatchSets and a completed example tournament for demonstration, but did not establish official public tournament operations or durable ratings.

Future rule-correction work must treat the rules docs, engine, Chronicle/replay grammar, fixtures, starter Strategies, and demo competition data as one contract. It should not leave stale timing assumptions in samples, tests, or public explanatory text.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-21 after v1.6 milestone start*
