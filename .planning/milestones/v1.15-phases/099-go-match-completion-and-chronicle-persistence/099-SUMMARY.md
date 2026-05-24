# Phase 99: Go Match Completion and Chronicle Persistence - Summary

**Completed:** 2026-05-24
**Status:** Complete

## What Changed

- Added Go-owned Match completion service in `apps/go-backend/completion.go`.
- Go completion now derives Match completion fields, validates a running job lease for the same Match, checks Chronicle metadata against the locked `matches` row, inserts the Chronicle row, updates `matches`, marks `match_jobs` complete, and finishes the current `match_job_attempts` row in one transaction.
- Added conservative idempotency for already-complete Matches only when the existing Chronicle id, hash, schema, outcome, counts, player ids, Strategy Revision ids, and arena id are compatible with the requested Chronicle.
- Added Go unit and DB-backed integration tests for completion fields, Chronicle metadata validation, successful atomic completion, duplicate completion, invalid lease, wrong-job lease, outcome drift, invalid Chronicle, and fail-closed behavior.
- Go Chronicle hashing now mirrors the TypeScript replay normalized content hash shape: `schemaVersion`, `reproducibility`, `events`, `snapshots`, and optional `private`, excluding `integrity` and `storageMetadata`.

## Requirements Covered

- COMP-01: completion requires a valid running job lease for the same Match unless compatible idempotency applies.
- COMP-02: duplicate completion returns the existing Chronicle only when the Match is complete and all stored Chronicle metadata is compatible.
- COMP-03: Go derives outcome, winner, survivor counts, side survivor counts, and survival turns with TypeScript parity formula.
- COMP-04: Go validates Chronicle schema-level metadata, terminal outcome, ids, event/snapshot counts, normalized hash/id, basic event/snapshot/board shape, and public-output private markers before persistence.
- COMP-05: Chronicle insert and Match/job/attempt updates happen in one PostgreSQL transaction.
- COMP-06: invalid lease, invalid Chronicle, missing terminal outcome, and private markers fail closed without completion.
- COMP-07: Chronicles are stored in the existing `chronicles.artifact` JSONB shape.
- COMP-08: Go tests and TypeScript oracle tests cover completion fields and Chronicle storage behavior.

## Verification Run

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm exec vitest run packages/persistence/src/complete-match.test.ts packages/persistence/src/chronicle-store.test.ts packages/replay/src/project.test.ts`
- `git diff --check`

## Notes

Phase 99 does not score MatchSets or publish public evidence; those remain Phase 100 and Phase 101. TypeScript remains the replay compatibility oracle during migration, but Go now uses the same normalized Chronicle hash inputs for persisted identity.
