# Phase 2 Spec Amendment: Backstab Rule

Backstab is position-triggered, not only voluntary-advance-triggered.

At the beginning and end of every Soldier Activation, check all ACTIVE Soldiers on the board. If any ACTIVE Soldier is directly behind an enemy ACTIVE Soldier, that enemy becomes STONE.

Backstab check boundaries:

- at the beginning of every Soldier Activation, before any SoldierBrain Cycle
- at the end of every Soldier Activation, before match-end checks
- after each successful Advance

Multiple Backstabs at the same activation boundary resolve from a simultaneous snapshot, then all unique victims become STONE together. Mutual Backstab cases stone both Soldiers if both relationships are true in the simultaneous snapshot.

Pushed Soldiers can trigger Backstab by ending behind an enemy Soldier, regardless of how they got there. Pushes do not update `lastSuccessfulMoveDirection`.

After Backstab boundary resolution, immediately check match-end conditions.

This amendment supersedes the original narrower wording that Backstab checks occur only after each successful Advance.
