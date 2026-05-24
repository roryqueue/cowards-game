# Phase 99 Code Review

**Reviewed:** 2026-05-24
**Status:** Findings fixed

## Findings and Resolution

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| CR-01 | BLOCKER | A valid running lease for one job could complete a different Match because completion only checked `job_id`, `lease_token`, and `status`. | Fixed by locking `match_jobs.match_id`, requiring it to equal both final state and Chronicle Match ids, and adding a DB integration test for wrong-job lease rejection. |
| CR-02 | BLOCKER | Chronicle metadata and final state could disagree on outcome or persisted Match ownership fields. | Fixed by deep-comparing final-state outcome with terminal Chronicle outcome and locking/comparing the `matches` row player ids, Strategy Revision ids, and arena id before insert. |
| CR-03 | BLOCKER | Go accepted Chronicle shapes that TypeScript replay would reject. | Fixed by adding conservative Go validation for supported schema version, contiguous event sequence, required Match start/end events, required Match start/terminal snapshots, terminal outcome, and board bounds/soldier/terrain shape. |
| CR-04 | BLOCKER | Go hashed the raw Chronicle artifact instead of the TypeScript replay normalized content shape. | Fixed by hashing only `schemaVersion`, `reproducibility`, `events`, `snapshots`, and optional `private`, with stable key ordering and tests proving `integrity`/`storageMetadata` do not affect the hash. |
| CR-05 | BLOCKER | Public-output privacy validation was incomplete. | Fixed by mirroring the canonical forbidden public keys and markers, normalizing keys, recursively scanning public Chronicle content, and allowing owner-private persisted Chronicle sections outside public output. |
| CR-06 | BLOCKER | Duplicate completion idempotency accepted stored metadata drift when id/hash matched. | Fixed by comparing the full stored Chronicle metadata row before idempotent success. |
| WR-01 | WARNING | Missing negative tests for wrong job, outcome drift, and metadata/hash privacy boundaries. | Fixed with added unit and DB integration coverage. |

## Follow-Up Risk

Go still does not fully port every TypeScript replay validator. For this milestone, TypeScript replay remains the oracle while Go completion rejects the dangerous drift classes needed for backend ownership.
