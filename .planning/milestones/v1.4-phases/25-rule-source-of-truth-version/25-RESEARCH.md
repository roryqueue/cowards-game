# Phase 25: Rule Source-of-Truth Version - Research

## Findings

- The root rules and architecture specs still described v1.0-v1.3 timing where
  a selected Soldier resolves its whole Activation before the next selected
  Soldier acts.
- `README.md` pointed at the old activation-boundary Backstab amendment, which
  would mislead future v1.4 implementation and audit work.
- The safest correction is additive: publish root v1.4 canonical documents and
  leave the v1 files as historical evidence for shipped milestones.

## Implementation Targets

- `CowardsGameSpec_CycleInterleaved_v1.4.md`
- `CowardsGame_Technical_Architecture_Spec_v1.4.md`
- `README.md`

## Verification Focus

- Rule label `cowards-rules-v1.4` is visible.
- Round 3 selected-slot order repeats by Cycle layer.
- Cycle-start/Cycle-end replace `post-advance` as v1.4 Backstab boundaries.
- Architecture notes cover engine, movement, Chronicle, replay, starters,
  fixtures, public projection, and demo data.

