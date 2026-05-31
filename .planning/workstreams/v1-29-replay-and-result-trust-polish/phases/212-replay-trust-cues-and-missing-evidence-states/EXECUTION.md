# Phase 212 Execution

## Completed

- Extended `ReplayUnavailableReason` app-local type with `missing-public-evidence`, `stale-evidence`, and `no-result`.
- Added unavailable evidence rows in `apps/web/app/matches/server.ts`.
- Updated `ReplayUnavailable` to render reason/evidence rows.
- Sanitized invalid Chronicle projection/validation messages in `replay-ready.ts`.

## Code Review

- Fixed a component bug by importing `Fragment`.
- Removed raw validation code/detail from public invalid Chronicle output.
- Distinguished selected-Go null public evidence from persisted missing Chronicle.

## Validation

- Server and replay tests passed.
- Playwright proof passed for ready replay plus missing-Chronicle and no-result replay-unavailable pages.
