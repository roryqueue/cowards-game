# Coward's Game

## Current State

**Shipped version:** v1.1 Trustworthy Simulation Beta on 2026-05-18
**Status:** Trustworthy simulation beta complete; ready to define the next milestone.
**Audit:** Passed, 34/34 v1.1 requirements satisfied.

Coward's Game is a deterministic two-player programmable strategy game for the web. Players can author immutable JS/TS Strategy Revisions, run service-backed MatchSets, persist strict Chronicles, replay legal engine-generated scenarios, and inspect public or authorized owner-debug replays with high confidence that the replay reflects the engine and that private Strategy data remains contained.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Next Milestone Goals

Fresh requirements should be defined with `$gsd-new-milestone`. Good candidates now that v1.1 is shipped:

- Competitive surfaces such as ladders, tournaments, scoring policy, or public Match history.
- Production-grade ownership/session authorization beyond the local Workshop owner trust source.
- Runtime sandbox expansion toward container, microVM, or WASM/WASI execution.
- Arena expansion only after replay compatibility and privacy policy remain stable.

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

- Ranked ladders, public tournaments, and spectator surfaces.
- Randomized arena generation and custom user-created maps.
- Multi-language runtimes beyond the hardened JS/TS runtime boundary.
- Production-grade account/session ownership and authorization.
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
*Last updated: 2026-05-18 after v1.1 milestone completion*
