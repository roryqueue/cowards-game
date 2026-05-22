# Phase 39 Plan: Saved Gauntlet Profiles

## Goal
Let the Workshop expose named deterministic gauntlet profiles and immutable runs without executing Strategy code inside the web/API process.

## Decisions Locked
- Profile definitions are save-before-run/save-from-run, with editable name/notes and immutable test-defining fields.
- Reruns append immutable run records and are blocked by compatibility mismatches, missing revisions, authorization, or duplicate active runs.
- Local demo uses `user:local`; account ownership remains required for non-local exports.

## Tasks
- Add persistence migration tables for profiles and profile runs.
- Add deterministic profile/run helpers and a static demo snapshot fallback for local environments without storage/workers.
- Extend Workshop server data to include analytics profiles and runs.
- Add profile comparison helpers that only compare compatibility-equivalent completed runs.

## Verification
- Persistence unit tests for compatibility hash stability, mismatch blocking, and CSV-safe public data.
- Manual Workshop check that profile summaries do not include Strategy source/memory/objectives.
