# Phase 99: Go Match Completion and Chronicle Persistence - Plan

**Status:** Ready for execution
**Research:** `099-RESEARCH.md`
**Requirements:** COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08

## Objective

Make Go the normal owner of Match completion and Chronicle persistence after a valid running lease and validated execution result.

## Tasks

1. Implement Go completion fields.
   - Derive outcome, winner, surviving Soldier counts, per-side surviving Soldier counts, survival turns, and per-side survival turns from final state with TypeScript parity.

2. Implement Chronicle validation and metadata.
   - Validate schema version, Match id, Strategy Revision ids, arena id, terminal outcome, event/snapshot counts, canonical metadata, content hash, and public/private projection safety before persistence.

3. Implement atomic Go completion transaction.
   - Validate running job lease.
   - Insert Chronicle.
   - Update `matches`, `match_jobs`, and current `match_job_attempts`.
   - Fail closed on invalid lease, invalid Chronicle, storage conflict ambiguity, or update failure.

4. Implement conservative idempotency.
   - Return existing Chronicle metadata only when the Match is already complete and a compatible Chronicle row exists.
   - Fail closed on hash/id/metadata drift.

5. Add parity and DB tests.
   - Successful completion, runtime violation completion, duplicate completion, invalid lease, invalid Chronicle, storage conflict, hash drift, missing terminal outcome, and replay compatibility.

6. Write `099-SUMMARY.md`, `099-VERIFICATION.md`, and `099-VALIDATION.md`.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- TypeScript parity fixtures for completion fields and Chronicle metadata/hash.
- Replay reconstruction/public projection tests.
- `git diff --check`

## Exit Criteria

- Go completion is atomic, idempotent only in safe cases, Chronicle-safe, replay-compatible, and source/private-data safe.
