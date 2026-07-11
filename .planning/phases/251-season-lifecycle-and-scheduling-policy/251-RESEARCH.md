# Phase 251 Research

## Existing Base

- Migration `0004_competition_trust_beta.sql` already stores Season statuses, lifecycle timestamps, immutable entry snapshots, schedule runs, Season foreign keys, and audit events.
- `scheduleTrialLadderSeason` deterministically orders entries and creates pairwise pods, but reads while the Season can remain open and creates MatchSets in separate transactions.
- `setTrialLadderSeasonStatus` accepts every status change and never writes `closed_at`.
- TypeScript public ladder DTO includes lifecycle timestamps; Go omits them.

## Implementation Direction

- Add a pure spec contract for allowed transitions, lifecycle windows, and public outcomes.
- Add storage for outcome category and public explanation without storing private diagnostics in public columns.
- Extract MatchSet insertion so scheduling can use one caller-owned transaction while existing callers retain their transaction wrapper.
- Lock the Season row with `FOR UPDATE`, freeze it before reading entries, and create the run plus MatchSets on the same client.
- Make scheduling idempotent by reading the latest complete/no-op run and rejecting/returning deterministically rather than creating duplicates.

## Risks

- Nested transactions across different pool clients would not protect a Season run; caller-owned transaction support is required.
- `ensureCompetitionArenas` must run before the scheduling transaction or use the same transaction-aware repository path.
- Public Go schema parity is required because selected public reads should not silently drop lifecycle policy.
- Phase 252 owns result-state vocabulary; Phase 251 must not preempt that classifier.
