# Pitfalls Research: v1.2 Competitive Alpha

**Date:** 2026-05-19

## Competition Scope Creep

**Risk:** Unranked exhibition quietly turns into ranked ladder infrastructure.

**Prevention:** Keep durable ratings, ranking history, tournaments, and one Strategy per user limits out of v1.2. Model publication and scoring carefully, but avoid permanent competitive standing.

## Ownership Shortcut Leakage

**Risk:** Existing `player:workshop-local` ownership appears in persisted competitive flows.

**Prevention:** Make stable User identity a Phase 14 gate for competitive submission and entry. Keep local Workshop ownership either migrated or explicitly non-competitive.

## Self-Play Blocked Too Early

**Risk:** Duplicate policy accidentally prevents one user from testing multiple Strategy Revisions against each other.

**Prevention:** Reject exact duplicate snapshots, not same-owner distinct revisions. Defer one Strategy per user rules to ranked or more formal competition.

## Public Privacy Regression

**Risk:** Result pages expose Strategy source, memory, objectives, raw Awareness Grid details, owner debug, or runtime internals.

**Prevention:** Route public evidence through v1.1 public projection gates and add competitive result privacy tests.

## Non-Deterministic Scoring

**Risk:** Tie-breakers depend on timestamps, database order, worker timing, or incidental execution details.

**Prevention:** Define scoring and tie-breakers as explicit versioned contracts with deterministic inputs only.

## Misclassified Failures

**Risk:** System failures become player penalties or strategy failures become hidden degraded results.

**Prevention:** Carry forward runtime failure taxonomy and require valid-result criteria before publication.
