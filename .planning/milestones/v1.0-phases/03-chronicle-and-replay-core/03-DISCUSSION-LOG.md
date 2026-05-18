# Phase 3: Chronicle and Replay Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 3-Chronicle and Replay Core
**Areas discussed:** Chronicle Event Shape, Replay Reconstruction Strategy, Privacy Projection Boundary, Determinism and Integrity Contract, Awareness Grid Recording

---

## Chronicle Event Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Event plus snapshots | Store event payloads plus enough before/after board snapshots at meaningful boundaries to make replay/debug straightforward. | ✓ |
| Event deltas only | Smaller and elegant, but reconstruction becomes more fragile and every event must be perfectly reversible. | |
| Full snapshots often | Simplest replay reconstruction, but larger artifacts and less pressure to design precise event semantics. | |

**User's choice:** Event plus snapshots.
**Notes:** Snapshots should occur at key boundaries. Event payloads should be semantic rather than state dumps. `packages/spec` owns canonical Chronicle contracts; `packages/replay` implements construction/reconstruction/validation/projection. Chronicle uses a full reproducibility envelope and hierarchical sequence fields. Awareness observation events are public markers that reference private owner-only payloads.

---

## Replay Reconstruction Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Snapshots plus semantic replay | Start from boundary snapshots, apply events between them, and verify reconstructed state matches the next boundary snapshot. | ✓ |
| Snapshot navigation only | Replay jumps between stored boundary snapshots and uses events mostly as annotations. | |
| Pure event replay | Rebuild the full match from initial state and event stream only. | |

**User's choice:** Snapshots plus semantic replay.
**Notes:** First API should optimize for `stateAt(sequence)` lookup while mapping cleanly to a linear iterator. Checkpoints are boundary-only in Phase 3. Failures return typed structured validation errors. Replay may use pure shared helpers/selectors but must not re-run strategies or depend on re-executing engine transitions. Phase 3 validates required canonical event set and broad ordering, but not exhaustive grammar.

---

## Privacy Projection Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Board truth only | Public projection includes visible board state, event types, public semantic payloads, positions/status/facing, outcomes, and runtime violation markers, but no private inputs/memory/objectives. | ✓ |
| Explainable public replay | Public projection also includes sanitized objectives/intent labels when safe. | |
| Minimal public replay | Public projection only exposes board states and final outcome. | |

**User's choice:** Board truth only.
**Notes:** Owner-only projection is per-player. One canonical Chronicle artifact contains public and private sections; projection utilities filter by viewer/player. Runtime violations are public as category/marker plus affected activation/Soldier, while raw details are private to the owning player.

---

## Determinism and Integrity Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Semantically identical normalized Chronicle | Same inputs produce the same normalized Chronicle content, ignoring nondeterministic metadata. | ✓ |
| Byte-identical artifact | Same inputs produce exactly identical serialized bytes. | |
| Outcome/event-type identical only | Same outcome and event type sequence. | |

**User's choice:** Semantically identical normalized Chronicle.
**Notes:** Chronicle carries a deterministic content hash over normalized canonical content plus schema/version metadata. Version incompatibility returns typed structured errors. Phase 3 defines migration interfaces/extension points, but implements no real migrations yet.

---

## Awareness Grid Recording

| Option | Description | Selected |
|--------|-------------|----------|
| Exact 5x5 grid plus context | Store canonical 5x5 cells, active Soldier ID, cycle index, objective reference, and sequence context. | ✓ |
| Grid summary only | Store counts/nearby entity summaries, not exact cells. | |
| Event marker only | Record that observation happened, but no grid payload. | |

**User's choice:** Exact 5x5 grid plus context.
**Notes:** Owner-only Awareness Grid payloads store exactly what `SoldierBrainInput.awarenessGrid` contained. Awareness events reference objective metadata rather than inline objective payloads. Phase 3 must include privacy tests proving public projection strips grids, objective payloads, and private debug data. Canonical Chronicles store private debug sections for both players, with projection controlling access per player.

---

## the agent's Discretion

None. The user selected concrete choices for all discussed areas.

## Deferred Ideas

- Add a post-Phase-7 Chronicle Grammar and Replay Verification Hardening phase with strict exhaustive event grammar, state-machine validation, fuzz/property tests, version migration checks, and legal/illegal event-sequence fixtures.
