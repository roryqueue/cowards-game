# Coward's Game

## Current State

**Shipped version:** v1.0 MVP on 2026-05-17
**Status:** Initial MVP complete; planning is ready for the next milestone.
**Audit:** Passed, 80/80 v1 requirements satisfied.

Coward's Game is now a deterministic two-player programmable strategy game MVP. Players can author JS/TS autonomous Strategy Revisions in the Workshop, validate and submit immutable revisions, launch test MatchSets, execute simulations through the worker pipeline, persist Chronicles, and inspect completed Matches in a replay viewer with public privacy and owner/debug Awareness Grid support.

## Core Value

Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Validated in v1.0

- ✓ TypeScript monorepo, local workflow, canonical contracts, and versioning spine.
- ✓ Pure deterministic Coward's Game rules engine and invariant test suite.
- ✓ Chronicle creation, validation, hashing, reconstruction, public projection, and owner-only debug projection.
- ✓ Immutable JS/TS Strategy Revisions with safe validation APIs and worker-only runtime execution.
- ✓ PostgreSQL-backed Match/MatchSet persistence, migrations, worker jobs, retries, Chronicle storage, and deterministic scoring.
- ✓ Strategy Workshop authoring UX with Monaco, templates, validation, submission, revision history, and test launch/status.
- ✓ Replay viewer with Pixi board, timeline scrubber, inspector, event callouts, owner Awareness Grid, and full service-backed Workshop-to-replay E2E coverage.

## Next Milestone Goals

Fresh requirements should be defined with `$gsd-new-milestone`. Good candidates from the v1.0 archive include:

- Runtime hardening beyond prototype JS worker isolation, likely subprocess/container/WASM/WASI-style.
- Strict exhaustive Chronicle grammar and replay compatibility hardening.
- Competitive surfaces such as ladders, tournaments, public Chronicle sharing, or strategy publishing.
- Advanced authoring and debugging tools for doctrine iteration.

## Context

Source specifications are archived in the repository root:

- `./CowardsGameSpec_Full_Consolidated_v1.md`
- `./CowardsGame_Technical_Architecture_Spec_V1.md`

Planning archives live under `.planning/milestones/`:

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.0-phases/`

## Out of Scope Until Replanned

- Ranked ladders, public tournaments, and spectator surfaces.
- Randomized arena generation and custom user-created maps.
- Multi-language runtimes beyond the v1.0 JS/TS runtime.
- Live model inference or live human control during Matches.
- Monetization, cosmetics, strategy marketplace, and reinforcement-learning harnesses.

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Build simulation-first | Deterministic engine, replay correctness, sandboxed execution, and Strategy API clarity were foundational. | ✓ Good |
| Use a TypeScript monorepo | Shared contracts and package boundaries kept engine, runtime, replay, worker, and web code separated. | ✓ Good |
| Keep engine pure and runtime-agnostic | The engine now consumes a StrategyRuntime interface without database/network/clock dependencies. | ✓ Good |
| Start with one JS/TS runtime | Enough to prove the authoring/execution loop while preserving a replaceable runtime boundary. | ✓ Good, harden next |
| Make Chronicle the canonical replay artifact | Enabled deterministic replay, privacy projection, persistence, and the visible replay viewer. | ✓ Good |
| Use hand-authored Arena Variants in v1 | Avoided map-generation complexity while proving the core loop. | ✓ Good |
| Prioritize Workshop iteration before ranked infrastructure | The MVP now supports doctrine authoring, validation, local testing, and replay analysis. | ✓ Good |

## Constraints

The v1.0 constraints remain active for future milestones: determinism, engine purity, Strategy Revision immutability, runtime isolation, memory/source limits, package boundaries, replay privacy, and competitive integrity.

---
*Last updated: 2026-05-17 after v1.0 milestone completion*
