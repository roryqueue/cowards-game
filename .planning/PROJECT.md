# Coward's Game

## Current State

**Shipped version:** v1.1 Trustworthy Simulation Beta on 2026-05-18
**Status:** v1.2 Competitive Alpha is active and ready for Phase 14 planning.
**Audit:** v1.1 passed, 34/34 requirements satisfied.

Coward's Game is a deterministic two-player programmable strategy game for the web. Players can author immutable JS/TS Strategy Revisions, run service-backed MatchSets, persist strict Chronicles, replay legal engine-generated scenarios, and inspect public or authorized owner-debug replays with high confidence that the replay reflects the engine and that private Strategy data remains contained.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Current Milestone: v1.2 Competitive Alpha

**Goal:** A developer/player can submit immutable Strategy Revisions into a small unranked or seeded competitive MatchSet, inspect fair scoring and replay evidence, and trust that public results do not leak private Strategy data.

**Target features:**
- Username/password sign in and session-backed stable User identity for competitive submissions.
- Immutable Strategy Revision ownership and private-source authorization checks beyond `player:workshop-local`.
- Small unranked or seeded exhibition MatchSets with presets, entrants, immutable snapshots, scoring policy, tie-breakers, stale revision behavior, result publication rules, and alpha self-play that allows one user to enter multiple distinct Strategy Revisions.
- Public MatchSet result pages with per-Match replay evidence, scoring breakdowns, degraded/failed Match handling, and provenance suitable for disputes.
- Competitive abuse and fairness guardrails for rate limits, duplicate submissions, runtime failure penalties, sandbox failure policy, visibility, and valid-result criteria.

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

## Out of Scope Until Replanned

- Ranked ladders, durable ratings, public tournaments, and spectator surfaces beyond public MatchSet result pages.
- One Strategy per user competition limits until ranked or more formal competition is introduced.
- Randomized arena generation and custom user-created maps.
- Multi-language runtimes beyond the hardened JS/TS runtime boundary.
- Enterprise-grade authentication features such as email verification, password reset, OAuth, organizations, admin moderation, and account recovery.
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
| Start competition with exhibition MatchSets | Unranked or seeded MatchSets provide real competitive evidence without committing to durable ratings too early. | Active in v1.2 |
| Add only minimal production ownership first | Competitive submissions need stable User identity and private-source authorization, but email/OAuth/recovery can wait. | Active in v1.2 |

## Constraints

The active constraints remain: deterministic engine behavior, engine purity, Strategy Revision immutability, hostile Strategy treatment, runtime isolation, memory/source/output limits, package boundaries, replay privacy, Chronicle compatibility, and competitive integrity.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-19 after v1.2 milestone definition*
