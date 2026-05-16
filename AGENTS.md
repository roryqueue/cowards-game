# AGENTS.md

## Project

Coward's Game is a deterministic two-player programmable strategy game for the web. Players author autonomous Strategy Revisions that control Soldiers on a shrinking board; once a Match begins, there is no human input and no live model inference.

Read these planning files before implementation work:

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/SUMMARY.md`

Primary source specs:

- `./CowardsGameSpec_Full_Consolidated_v1.md`
- `./CowardsGame_Technical_Architecture_Spec_V1.md`

## Non-Negotiables

- Keep the engine pure, deterministic, serializable, and side-effect free.
- Do not put game rules in React components.
- Do not execute user Strategy code in the web/API process.
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic.
- Do not use Node `vm` as a security boundary for untrusted code.
- Treat Strategy code as hostile and validate every runtime boundary with schemas.
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.
- Strategy Revisions are immutable once submitted for Match or MatchSet play.
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default.

## Build Order

Follow the roadmap:

1. Foundation and Spec Contracts
2. Pure Rules Engine
3. Chronicle and Replay Core
4. Strategy Runtime Sandbox
5. Match Orchestration and Persistence
6. Strategy Workshop UX
7. Replay Viewer and End-to-End Verification

## Testing Expectations

- Engine rules require focused unit tests and invariant/property-style tests.
- Replay requires deterministic reconstruction and integrity tests.
- Runtime requires tests for invalid outputs, timeout behavior, forbidden capabilities, memory/source limits, and schema validation.
- Worker tests must distinguish strategy failure from system failure.
- End-to-end tests should cover edit -> submit revision -> create MatchSet -> execute -> replay.

## GSD Workflow

- Use `$gsd-discuss-phase 1` to clarify Phase 1.
- Use `$gsd-plan-phase 1` to create an executable plan.
- Use `$gsd-execute-phase 1` to implement a planned phase.
- Keep planning docs committed when updated.
