---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-02T17:08:27Z
depth: deep
files_reviewed: 2
files_reviewed_list:
  - .strategy-lab/league-265-prospective-v10-20261002-a/prepare-data.ts
  - .strategy-lab/league-265-prospective-v10-20261002-a/run-entry.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 265 v10 Helper Re-review

**Reviewed:** 2026-10-02T17:08:27Z  
**Depth:** deep, scoped to the two private helpers and the dependencies needed to verify the prior findings  
**Files Reviewed:** 2  
**Status:** clean

## Summary

Both prior BLOCKERs are resolved in the reviewed helper bytes. The prepared
league-directory guard now rejects missing, symlinked, non-canonical, wrong,
non-directory, and non-empty targets before publication or entry. The source
gate check is bound to the pinned helper and CI bytes, exact unique start bytes,
absence of a terminal marker, strict ordered completion bytes, and the
root-observed completed report. The corrected strict-type boundary also
explicitly checks the response-factory path before argv construction. No new
actionable BLOCKER or WARNING was found within this bounded review.

## Narrative Findings

No actionable BLOCKER or WARNING found.

### Prior finding disposition

- **CR-01 — resolved.** `prepare-data.ts:33-38` checks the exact expected path
  with `lstatSync`, rejects symlinks and non-directories, requires
  `realpathSync(expected) === expected`, and requires `readdirSync(expected)`
  to return no entries before returning the repository wrapper. `run-entry.ts:66`
  calls this read-only guard before current-source/gate admission and before
  either allocation publication or result/entry reservation. The dependency's
  repository constructor remains read-only for this use.
- **CR-02 — resolved.** `run-entry.ts:37-52` pins the source-gate helper and CI
  bytes, requires the unique start marker and its exact raw hash/fields, rejects
  an existing terminal marker, pins and strictly validates the complete
  marker's exact keys, roots, command order/count, elapsed duration, and
  timestamp, and binds the exact completion root to the pinned report whose
  status is COMPLETE. The observed completion raw SHA is
  `a03bb26f0dce863bb3aad30a4d5187c1ce2112c44e01ea3ed4a0c659e437460d`; the
  scoped report raw SHA is
  `120b171f2fb58722a878e27f37942cf6063c57dffa256b36f71acbc499b96c63`.
  The start marker is pinned to
  `de4355f52084f806ff4b984d7398de498ab25ee7372ba84120fcf76fbd77162e`.
  This review relies on the root-observed unique local gate completion; it does
  not assert independent external custody or empirical route completion.
- **Strict-type correction — verified by inspection.** `prepare-data.ts:152`
  uses `Set<string>` for distinct author/reviewer identity validation, and
  `run-entry.ts:70-83` explicitly rejects a missing response-factory directory
  before constructing argv. No related new unchecked path was found in these
  changes.

## Scope and verification limits

Reviewed helper raw SHA-256 values:

- `prepare-data.ts`: `ce07af105810d8cdab19b8208a19932b5fbda8a0a6be323f760aa3b351baf3cb`
- `run-entry.ts`: `3c661bb7dc38361e879704a398de17adaabeeac6fe4f43c9023f2913eeabc00b`

The source-gate helper (`8500db6bbedc65a11d60b2c1f30c98312a8da1ca9d68d9a8b140e3eeaee1506e`), CI file
(`b02c04cbd7f4b6808153c3a6657df965b78712752bd801118be31b49cf9e186a`),
unique start/completion markers, and final scoped report were read to verify
the gate binding. The root reports strict TypeScript exit 0 after the cited
corrections; this reviewer did not rerun it. No helper mode, test, source gate,
capacity observation, allocation, provider, Match, or retained verifier was
run. No source/helper/test file was modified; only this review artifact was
written.

_Reviewer: independent gsd-code-reviewer; deep scoped helper re-review._
