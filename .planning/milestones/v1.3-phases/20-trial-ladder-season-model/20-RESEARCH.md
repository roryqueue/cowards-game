# Phase 20 Research: Trial Ladder Season Model

## Findings

- v1.2 competition entrants and immutable Strategy Revision snapshots are the right foundation for ladder eligibility.
- The first ladder should be resettable and season-scoped, with no permanent Elo/Glicko or all-time rating semantics.
- Entry replacement should be next-season-only for v1.3 to avoid mid-season abuse and standings confusion.

## Decision

Add season and entry tables plus public DTO contracts for trial ladder seasons, policies, entries, and publication state.

