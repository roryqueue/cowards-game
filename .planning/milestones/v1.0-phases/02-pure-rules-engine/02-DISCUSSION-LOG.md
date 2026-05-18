# Phase 2: Pure Rules Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 2-Pure Rules Engine
**Areas discussed:** Engine State Shape, StrategyRuntime Boundary, Rule Resolution Granularity, Test Confidence Model

---

## Engine State Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single `GameState` aggregate | One immutable state tree contains canonical match state. | ✓ |
| Small state slices | Separate board, match clock, player, runtime memory, and outcome states. | |
| Aggregate plus derived helpers | One state aggregate plus pure selectors for lookup data. | |

**User's choice:** Single `GameState` aggregate.
**Notes:** Derived data is recomputed with selectors. Plain immutable returns are preferred over Immer. Player IDs are explicit and separate from side roles. FALLEN Soldiers remain in the roster. Boundary validation only. SoldierMemory and StrategyMemory live in `GameState`.

---

## StrategyRuntime Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal fake runtime interface | Engine-local `selectActivations` and `runSoldierBrain` interface for deterministic fakes. | ✓ |
| Architecture-spec runtime interface | Broader validation/runtime shape from the architecture spec. | |
| Function callbacks only | Plain callbacks without a named runtime object. | |

**User's choice:** Minimal fake runtime interface.
**Notes:** Runtime methods return typed success or `RuntimeViolation` results. Timing and sandbox constraints are represented only as violations. Runtime calls are synchronous. Fake runtime helpers belong in `packages/test-utils` or tests, not the main engine export.

---

## Rule Resolution Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| State/init plus activation loop first | Establish match loop before deeper movement rules. | ✓ |
| Movement primitives first | Build movement/collision/push/Backstab helpers before match loop. | |
| Vertical thin match first | Run a tiny match with simple rules, then deepen behavior. | |

**User's choice:** State/init plus activation loop first.
**Notes:** Movement uses an ordered pipeline. The user clarified Backstab as position-triggered at activation boundaries: any ACTIVE Soldier directly behind an enemy ACTIVE Soldier at the start or end of any Soldier activation Backstabs that enemy. This applies to all ACTIVE Soldiers, uses simultaneous snapshot resolution, can stone mutual Backstab cases, and includes pushed Soldiers. The canonical gameplay spec must be updated during execution before tests are implemented against this clarification.

---

## Test Confidence Model

| Option | Description | Selected |
|--------|-------------|----------|
| Layered mix | Unit, scenario, invariant-style matrix, and golden full-match tests. | ✓ |
| Scenario-heavy | Mostly human-readable canonical cases. | |
| Property-heavy | Generated states/actions with a property library. | |

**User's choice:** Layered mix.
**Notes:** Start invariant coverage with deterministic fixture matrices, not a property library. Golden tests prove determinism and completion. Add a dedicated Backstab boundary suite. Keep spec fixtures in `packages/spec`; add richer engine builders in `packages/test-utils`.

---

## the agent's Discretion

No areas were delegated to the agent without a user choice.

## Deferred Ideas

None.
