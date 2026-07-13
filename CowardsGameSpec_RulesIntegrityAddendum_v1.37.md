# Coward's Game Rules Integrity Addendum v1.37

## Status and authority

This companion records the approved Phase 257 integrity rulings for the
v1.37 milestone. It does not replace `cowards-rules-v1.4`, widen the set of
legal Actions, or activate the deferred v2.0 experiment program. The
cycle-interleaved v1.4 rules and technical architecture remain authoritative
for valid v1.4 gameplay. This addendum governs only the narrow lifecycle
repairs, compatibility guard, authority cleanup, and event-version consequence
listed below.

The consolidated specification has a protected user-owned working copy. It was
not read as canonical or edited for this addendum. The committed source bytes
used for provenance were read with `git show` and have these SHA-256 digests:

| Committed source                                  | SHA-256                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `CowardsGameSpec_Full_Consolidated_v1.md`         | `4d2d17fd258360cb63b2c85eb5b070fa2dcaaa70eb2d3b7c150046763a7e34fc` |
| `CowardsGameSpec_CycleInterleaved_v1.4.md`        | `39fbeb7f766cd94b394af068b87457b757596f051f4db66061a0de527b431154` |
| `CowardsGame_Technical_Architecture_Spec_v1.4.md` | `a1e67b2996bafa7ecd15fb71d94ba8183da4e0143b021cc856963cf404eae7fb` |

## Approved rulings, in order

### D-09 — retained activation-order prefix

Cap the raw activation-order list at the Round quota before validating it.
Validate every retained entry for shape, Soldier identity, ownership, ACTIVE
status, and duplication. Entries after the cap are ignored and cannot
invalidate or replace an entry in the retained prefix. This repairs the known
excess-order precedence defect without changing any valid retained order.

### D-10 — Cycle-end Backstab removes the actor

When a Cycle-end Backstab makes the acting Soldier non-ACTIVE, finish the
simultaneous scan and emit all Backstab effects first. Then emit `CYCLE_ENDED`,
close the selected slot exactly once with terminal reason `BACKSTABBED`, and
evaluate Match outcome immediately. No SoldierBrain call or scheduling event
may follow a terminal outcome. This repairs an open-slot lifecycle defect; it
does not change Backstab geometry or simultaneous victim selection.

### D-11 — no-Advance cleanup removes the final Soldier

When slot closure applies no-Advance cleanup to the last ACTIVE Soldier for a
player, canonical order is:

1. emit the Soldier status-change event;
2. emit the selected-slot closure with the no-Advance reason;
3. evaluate and emit the immediate Match outcome exactly once.

No later skipped-slot or scheduling event may appear after that outcome. This
repairs missing terminal evaluation after a canonical active-count change.

### D-12 — preserved v1.4 behavior bundle

All of the following remain exact compatibility requirements:

- a same-direction rear approach to an ACTIVE Soldier is blocked;
- head-to-head, same-direction, STONE, terrain, open-target, and failed-push
  cases remain distinct;
- a successful push updates the pusher's successful-move history to the
  attempted direction and leaves the pushed Soldier's prior history unchanged;
- blocked MOVE and blocked PUSH are non-terminal, do not count as an Advance,
  and do not counterfeit successful-move history;
- an illegal immediate reversal remains terminal for its selected slot;
- Cycle-interleaved snake scheduling, initiative, lifecycle coordinates,
  memory handoff, objective handoff, and Strategy observations remain exact;
- Backstab uses the victim's rear square and does not require the attacker to
  face the victim;
- simultaneous, mutual, multi-victim, pushed-Soldier, TURN-created, and
  PUSH-created Backstab eligibility retain current event and state order;
- every active-count or status change is followed by outcome evaluation at its
  documented boundary;
- contraction and final 2x2 resolution retain current ordering; and
- a terminal Match emits exactly one `MATCH_ENDED` and schedules nothing later.

Cycle-start Backstab scans remain part of the current rules. They may be
removed only by a separately approved reachable-state differential proof that
establishes identical state, outcome, canonical events, terminal behavior,
runtime calls, and Strategy observations.

### D-13 — one current execution entry point

Remove the obsolete public contiguous-Activation `resolveActivation` entry
point and its internal wrapper. There is no compatibility alias or test-only
copy. Current callers use kernel transitions or the canonical engine Match
driver. Historical evidence is decoded by its immutable version route; it is
not re-executed through a retained current bypass.

### D-14 — current event vocabulary

Remove `PUSH_ATTEMPTED` from the current canonical event vocabulary. Current
push evidence is expressed by `PUSH_RESOLVED`, `PUSH_BLOCKED`, the associated
movement/fall effects, and their transition record. No committed historical
Chronicle event instance requiring `PUSH_ATTEMPTED` was found. If such evidence
is later proved to exist, support may be added only to the exact historical
decoder route, never to the current vocabulary by implication.

### D-15 — tuple consequence and historical routing

Removing a declared current event is a semantic contract change. The affected
current engine/Chronicle tuple component must therefore be minted, certified,
published, and installed as one exact authority bundle. A mixed tuple is not
valid. The rule identity remains `cowards-rules-v1.4` because D-12 gameplay is
preserved apart from the explicitly approved D-09 through D-11 repairs.

Existing v1.4 Chronicles and Match results remain immutable under their
original tuple and semantics. They route through the strict historical
dispatcher and decoder selected by their persisted identity; they are never
rewritten, silently upgraded, or used to relax current validation.

## KERN-11 compatibility approval gate

The executable v1.4 corpus compares initial, intermediate, and final state;
ordered event payload/context/privacy; lifecycle coordinates; runtime call and
input/output order; Strategy and SoldierBrain observations; StrategyMemory and
SoldierMemory; objective handoff; outcome; failure trace; terminal-event count;
and deterministic hashes.

Only D-09, D-10, D-11, D-13, D-14, and D-15 can authorize an expected Phase
257 delta. D-12 is a preservation ruling, not a regeneration permission. If a
kernel change alters any other valid Match state, Action legality, event order
or payload, outcome, terminal reason or timing, runtime call, memory/objective
handoff, or Strategy observation, KERN-11 requires explicit user approval
before implementation or fixture regeneration continues.

## Explicitly deferred

`HOLD` and `END_ACTIVATION` are not legal current Actions and are not current
canonical events. Adding either after an Advance remains deferred until its
exact scheduling, Backstab, Chronicle, reconstruction, and replay semantics
receive separate approval and proof. Any reachable-outcome change belongs to a
later experimental-rules milestone.

No cycle cap, starting-position, movement/facing, attacker-facing Backstab,
hidden-information, live-randomness, per-Match rule mutation, new official
arena, or other deferred gameplay experiment is activated by this addendum.
