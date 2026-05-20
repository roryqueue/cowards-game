# Coward's Game Rules Specification v1.4

This document is the canonical rules source for `cowards-rules-v1.4`.
It supersedes the Round and Backstab timing language in
`CowardsGameSpec_Full_Consolidated_v1.md`. The v1 document remains a
historical record for shipped v1.0-v1.3 evidence.

## Version Boundary

All v1.4 engine output, Chronicles, replay fixtures, starter Strategies, and
demo competition evidence must identify the corrected rules as
`cowards-rules-v1.4`.

The following v1 language is historical and not authoritative for v1.4:

- a selected Soldier completing all 12 Cycles before the next selected Soldier
  acts
- Backstab checks only at Activation start, Activation end, or `post-advance`
- demo or fixture evidence generated under `v13-demo`

## Canonical Terms

Use these terms exactly: Soldier, Match, Phase, Round, Activation, Cycle,
Action, Advance, STONE, FALLEN, Chronicle.

Avoid using "turn" when the intended term is Round, Activation, Cycle, Action,
or Advance.

## Round Selection

Each Round keeps the existing activation count table.

| Round | Activation Count Per Player |
| --- | ---: |
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |

At the start of the Round, each Strategy chooses up to `activationCount`
ACTIVE Soldiers for selected Activation slots. Selected slots retain their
Soldier, objective payload, per-Soldier memory, `advanced` flag, Cycle index,
ended state, and terminal reason for the remainder of the Round.

Selection happens once per player per Round. Later Cycle layers do not re-run
`selectActivations`.

## Round Snake Slot Order

The Round snake slot order is unchanged, but it is applied per Cycle layer
rather than by resolving an entire Activation at once.

For Round 3, if the initiative player is P1 and the other player is P2, the
slot order is:

`P1S1 -> P2S1 -> P2S2 -> P1S2 -> P1S3 -> P2S3`

That same selected-slot order repeats for every Cycle layer while slots remain
open:

| Cycle Layer | Selected-Slot Opportunities |
| ---: | --- |
| 1 | P1S1, P2S1, P2S2, P1S2, P1S3, P2S3 |
| 2 | P1S1, P2S1, P2S2, P1S2, P1S3, P2S3 |
| 3 | P1S1, P2S1, P2S2, P1S2, P1S3, P2S3 |
| ... | Same order through Cycle layer 12 |

An ended selected slot is skipped on all later Cycle layers for that Round.
Skipping an ended slot must not invoke SoldierBrain and must not write
SoldierMemory.

## Cycle Boundaries

Each selected-slot opportunity performs at most one SoldierBrain Cycle.

For a non-ended slot whose Soldier is still ACTIVE:

1. Cycle-start Backstab check resolves using a simultaneous all-board snapshot.
2. If the Match ends, the Round stops immediately.
3. If the Soldier is no longer ACTIVE, the slot ends.
4. SoldierBrain receives a fresh input for the current Cycle.
5. The Action resolves.
6. Cycle-end Backstab check resolves using a simultaneous all-board snapshot.
7. If the Match ends, the Round stops immediately.
8. If the slot reached a terminal reason, it closes.

Cycle-start and Cycle-end replace prior `activation-start`,
`activation-end`, and `post-advance` Backstab timing vocabulary for v1.4
rules. Historical data may still contain the old strings, but v1.4 evidence
must not create an extra Backstab boundary after an Advance.

## Terminal Slot Reasons

Only the selected slot terminates for these causes unless Match outcome ends
the Round:

- runtime violation
- invalid SoldierBrain output
- schema-valid impossible Action such as illegal immediate reversal
- TURN_TO_STONE
- Soldier FALLEN
- 12-Cycle exhaustion
- Match ended

Blocked MOVE and blocked PUSH are non-terminal in v1.4. They consume the
current Cycle, leave the slot open, and still allow Cycle-end Backstab.

## No-Advance Cleanup

If a selected Activation slot ends and the Soldier is still ACTIVE but has not
successfully Advanced during that selected Activation, that Soldier becomes
STONE. This cleanup happens exactly once when the slot closes.

If the Soldier is FALLEN, it remains FALLEN instead of becoming STONE.

## Chronicle and Replay Contract

Chronicles for `cowards-rules-v1.4` must be able to represent multiple open
selected Activation slots in the same Round. Cycle events from one slot are not
required to be contiguous with that slot's earlier Cycle events.

Public replay output must remain privacy-safe by default and must not expose
Strategy source, StrategyMemory, SoldierMemory, objective payloads, Awareness
Grid details, raw runtime internals, or private errors.

