# Phase 32 UI Spec

## Surface

Advanced Strategies appear in the Workshop, public Strategy cards, and player profiles.

## Requirements

- Label Advanced entries as `Advanced seed`.
- Show archetype, doctrine notes, source hash, validation status, byte count, and memory-use classification in owner-authorized Workshop surfaces.
- Public Strategy cards show tier/archetype and evidence links without source.
- Player profiles identify Advanced seed lineage without exposing Strategy source.

## Verification

Browser checks passed for Workshop root, `/strategies/strategy%3Ademo%3Av1-5%3Astonewall-shear`, and `/players/v15-stonewall-shear`.
