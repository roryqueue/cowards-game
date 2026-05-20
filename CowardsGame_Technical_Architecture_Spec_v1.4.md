# Coward's Game Technical Architecture Specification v1.4

This document is the implementation map for `cowards-rules-v1.4`. It
supersedes scheduler, Chronicle, replay, starter, fixture, and demo surfaces
that assumed full-Activation sequencing in
`CowardsGame_Technical_Architecture_Spec_V1.md`.

## Architecture Impact Map

Every v1.4 implementation must align these surfaces:

| Surface               | Required v1.4 Alignment                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| Rules docs            | Root v1.4 rule contract defines Cycle-interleaved selected slots.          |
| Engine                | Round scheduler owns selected-slot state and loops Cycle layers 0-11.      |
| Movement              | Advance no longer triggers an extra `post-advance` Backstab boundary.      |
| Backstab              | Cycle-start and Cycle-end boundaries use simultaneous all-board snapshots. |
| Runtime input         | SoldierBrain sees fresh board-derived input on each interleaved Cycle.     |
| Chronicle schema      | Event context supports open selected slots and interleaved Cycle events.   |
| Replay grammar        | Validates per-slot Cycle progression without requiring contiguous events.  |
| Replay reconstruction | Rebuilds board state through interleaved Cycle events.                     |
| Public projection     | Preserves privacy guarantees while exposing safe lifecycle timing.         |
| Fixtures              | Active fixtures are regenerated under `cowards-rules-v1.4`.                |
| Starters/templates    | Starter Strategies account for board changes between own Cycles.           |
| Demo ladder           | Public evidence uses `/ladder/v1-4-demo`, not `v13-demo` or `v14-demo`.    |

## Engine Scheduler

The engine keeps Strategy-level selection at Round start, then creates selected
slot state:

- stable slot id/index/order
- acting player id
- Soldier id
- objective payload
- current Cycle index
- whether the slot has Advanced
- whether the slot has ended
- terminal reason

The scheduler iterates Cycle layer 0 through 11. For each layer, it visits the
selected slots in Round snake order. Ended slots emit skip evidence where the
surface supports it, but do not invoke SoldierBrain and do not write memory.

Match end interrupts immediately at Cycle-start or Cycle-end.

## Backstab Boundaries

`cycle-start` runs before SoldierBrain input for the current opportunity.
`cycle-end` runs after Action resolution for the current opportunity.

Both boundaries check all ACTIVE Soldiers from a simultaneous snapshot. Multiple
victims and mutual Backstabs resolve together.

The v1.4 engine must not also run `post-advance` Backstab after MOVE/PUSH.

## Runtime Boundary

The web/API process must not execute user Strategy code. Worker/runtime
boundaries continue to treat Strategy code as hostile and schema-validate all
outputs.

Runtime violations and invalid output close only the relevant selected slot.
Blocked MOVE/PUSH are tactical costs, not terminal runtime failures.

## Chronicle and Replay

Chronicle `chronicle-v1.4` data may contain multiple selected slots open in one
Round. Grammar validation must track slot state by `activationId` instead of a
single global active Activation.

Replay UI should group by Round and selected slot while making Cycle alternation
visible. Public DTOs may expose safe lifecycle metadata such as round number,
slot index, Cycle index, skip reason, and terminal reason. They must not expose
Strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness
Grid details, or raw runtime internals by default.

## Starter and Demo Data

Starter revisions for v1.4 should identify:

- rule version `cowards-rules-v1.4`
- starter version `v1.4`
- source hash
- generation provenance

Old v1.3 demo data is historical only. Active demo generation must clean old
`v13-demo` demo users, Strategies, revisions, MatchSets, jobs, and Chronicles
before generating `/ladder/v1-4-demo` evidence.
