---
phase: 3
slug: chronicle-and-replay-core
status: complete
created: 2026-05-16
---

# Phase 3 Pattern Map

## Closest Existing Analogs

| New Surface | Closest Existing Analog | Pattern to Reuse |
|-------------|-------------------------|------------------|
| Chronicle contracts | `packages/spec/src/types.ts` and `packages/spec/src/schemas.ts` | Keep canonical type names in spec, validate with Zod at boundaries, and export through `packages/spec/src/index.ts`. |
| Event summaries | `packages/engine/src/types.ts` and `event()` helper | Emit pure deterministic summaries outside `GameState`; assign final sequence at match aggregation. |
| Runtime observation inputs | `packages/engine/src/runtime-inputs.ts` | Use the exact input object passed to runtime when recording owner-only Awareness Grid debug data. |
| Match orchestration | `packages/engine/src/match.ts` | Reuse existing full-match flow and outcomes; do not create replay-only rules. |
| Replay package exports | `packages/replay/src/index.ts` | Turn the package into a curated public API surface with implementation split into local modules. |
| Test scenario helpers | `packages/test-utils/src/engine-scenarios.ts` | Add deterministic Chronicle/replay helpers here; keep production packages free of test-utils imports. |

## Data Flow

1. Engine creates deterministic `TransitionEventSummary[]` and final `GameState`.
2. Replay builder adapts summaries and boundary snapshots into a canonical `Chronicle`.
3. Replay normalizer removes nondeterministic metadata and produces deterministic hash input.
4. Replay validator checks schema, version, event ordering, required events, snapshots, and hash integrity.
5. Replay reconstruction uses Chronicle snapshots/events to answer `stateAt(sequence)` and iterate linearly.
6. Projection utilities derive public and owner-specific views from the unified canonical artifact.

## Constraints for Plans

- `GameState` must not gain a Chronicle log.
- `packages/spec` remains the source of truth for Chronicle contracts and schemas.
- `packages/replay` may consume spec and engine outputs, but must not import runtime-js, apps, persistence, database clients, filesystem APIs, network APIs, or clock APIs.
- Public projection tests must search serialized output for known private markers.
- Strict exhaustive event grammar is deferred; Phase 3 only implements required event set and broad ordering rules.
