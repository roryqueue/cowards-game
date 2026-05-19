# Feature Research: v1.2 Competitive Alpha

**Date:** 2026-05-19

## Table Stakes

### Competitive Ownership

- Username/password sign in and sign out.
- Stable User identity for Strategy Revision ownership.
- Display name and handle for public competitive surfaces.
- Session-backed authorization for Strategy Revision submission and competitive entry.
- Server-side ownership checks for private source, owner debug, and competitive entry.

### MatchSet Competition Model

- Competition presets for unranked exhibition and seeded alpha MatchSets.
- Entrants represented as immutable Strategy Revision snapshots.
- Explicit scoring policy, tie-breakers, stale revision behavior, visibility, and result publication rules.
- Public result policy that excludes private Strategy data.

### Exhibition Queue

- Submit owned Strategy Revisions into small unranked/public MatchSets.
- Seed MatchSets from selected owned or fixture revisions.
- Allow one user to submit multiple distinct owned Strategy Revisions for self-play.
- Reject exact duplicate snapshots and incompatible revisions.
- Show accepted, queued, running, complete, degraded, and failed states.

### Results and Evidence

- Public MatchSet result pages.
- Scoring breakdowns, penalties, tie-breaker explanations, degraded/failed Match handling.
- Per-Match replay links generated from persisted Chronicles.
- Provenance for MatchSet, Match, preset, scoring policy, engine, Chronicle hash, and Strategy Revision snapshots.

### Abuse and Fairness

- Basic rate limits.
- Exact duplicate snapshot detection.
- Deterministic runtime failure penalties.
- Strategy failure vs system failure classification.
- Valid competitive result criteria.
- Privacy and fairness tests.

## Differentiators

- Dispute-friendly public evidence before rankings exist.
- Self-play-friendly exhibition MatchSets for rapid Strategy iteration.
- Result privacy treated as part of competition integrity, not just replay rendering.

## Anti-Features for v1.2

- Ranked ladders and durable ratings.
- Public tournaments.
- One Strategy per user limits.
- Full account lifecycle features such as email verification, password reset, OAuth, passkeys, and recovery.
- Strategy marketplace or public doctrine profiles.
