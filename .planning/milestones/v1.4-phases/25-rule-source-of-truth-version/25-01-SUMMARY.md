---
phase: 25
plan: 01
status: complete
key_files:
  created:
    - CowardsGameSpec_CycleInterleaved_v1.4.md
    - CowardsGame_Technical_Architecture_Spec_v1.4.md
  modified:
    - README.md
requirements:
  - RULE-01
  - RULE-02
  - RULE-03
  - RULE-04
  - RULE-05
  - RULE-06
  - RULE-07
---

# Summary

Published root canonical v1.4 rules and architecture documents for
Cycle-interleaved selected Soldier scheduling. README now points at the v1.4
contract and treats v1 specs as historical.

## Verification

- Confirmed the docs include `cowards-rules-v1.4`, repeating Cycle-layer slot
  order, ended-slot skipping, Cycle-start/Cycle-end Backstab, no extra
  `post-advance` boundary, and the required architecture impact map.

