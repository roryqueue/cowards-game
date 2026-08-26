---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-26T06:30:19Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-69-route-8-source.ts
  - scripts/check-v1-38-plan-262-69-route-8-source.test.ts
findings:
  critical: 7
  warning: 2
  info: 0
  total: 9
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-26T06:30:19Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The iteration-2 fix materially improves the sentinel, but it is not shippable. Prior CR-02, CR-03, CR-05, CR-06, and WR-02 are closed: the canonical local-seal v3 artifact is checked and bound; the 56/55 topology carries content and Git identities; production lifecycle paths are pinned and test injection is separated; normalized carriers are allowlisted; and VERIFICATION/BLOCKED is now mutually exclusive on the normal gaps path.

Prior CR-01, CR-04, CR-07, CR-08, and WR-01 remain unresolved in narrower forms. A complete-looking v13/v14 chain is still self-attested rather than producer-authenticated; validator provenance permits a same-commit validator and ambiguous duplicate rows; durable recovery accepts an attacker-authored journal; and the PASS closeout can report success while leaving real progress counters and a tracked BLOCKED carrier incorrect. Two new integration blockers also exist: the current already-normalized repository state is not migratable by the new normalizer, and Plan 74's exact result-check command cannot satisfy the CLI's required arguments.

Verification performed: the focused Vitest suite passed 17/17; `pnpm exec tsc --noEmit --pretty false` passed; `git diff --check` passed. The two reviewed files have no uncommitted diff. Pre-existing ROADMAP, STATE, and VALIDATION changes were preserved.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Full-chain PASS evidence remains synthetically forgeable

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:349-429`
**Issue:** `checkedTerminalChain` verifies exact schemas, counters, cross-roots, and unkeyed content hashes, but never authenticates the Git blob/introducing commit or an execution-producer identity for route start, preflight, consumptions, calibration, reproduction, and terminal. Anyone able to write the canonical JSON files can calculate every accepted root from public data and manufacture a 540/540 PASS. The test does exactly that with its local `rooted` helper and hard-coded claims (`scripts/check-v1-38-plan-262-69-route-8-source.test.ts:215-266`), so the 17-test suite proves structural consistency, not real v13/v14 execution provenance.
**Fix:** Bind every execution artifact to committed, unique introducing commits descended from the authorized Plan-72 execution commit, require clean working bytes equal those Git blobs, and authenticate a producer-issued execution/root manifest that a generic JSON writer cannot mint. Add mutations for uncommitted, rewritten, wrong-introducer, and same-commit synthetic chains.

### CR-02: Validator provenance is not strictly post-Plan-73 and accepts ambiguous requirement rows

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:283-321`
**Issue:** `merge-base --is-ancestor plan73Commit sourceCommit` accepts equality, so validation committed in the same commit as the Plan-73 summary is labeled post-Plan-73. Requirement parsing also silently keeps only the first row for each ID and checks `statuses.size === 16`; duplicate contradictory rows are ignored. Substring checks such as `Phase 263 planning authorized` also accept negated or contradictory surrounding prose. Consequently the provenance root can authenticate a report that was not produced after Plan 73 or that contains conflicting status claims.
**Fix:** Require `sourceCommit !== plan73Commit` and strict descendant ancestry. Parse an exact validator schema/frontmatter with exactly 16 unique rows and no duplicates, then reject contradictory authority/gap tokens instead of using free-text substring presence.

### CR-03: Recovery trusts a forgeable journal that can overwrite or delete arbitrary repository files

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:557-614`
**Issue:** Startup always recovers any existing `.planning/.v138-plan26274-transaction-v1/journal.json`. `parseJournal` checks only a public SHA-256 over attacker-controlled JSON; it does not enforce exact keys, allowed purpose, unique paths, canonical path sets, or a transaction identifier prepared by this process. A crafted repository journal can therefore make the next normalize/sentinel invocation overwrite or delete arbitrary in-repository files and, for a crafted commit block, ask the GSD commit helper to commit attacker-selected paths.
**Fix:** Validate an exact journal schema and purpose-specific canonical path inventory, reject duplicates and unexpected commit files/messages, and bind recovery to a separately persisted transaction intent created by the sentinel. Add adversarial stale-journal tests for arbitrary targets, duplicate paths, malformed purposes, and forged commit inventories.

### CR-04: PASS closeout does not update the real STATE progress counters

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:830-835`
**Issue:** The replacements require unindented lines such as `^completed_plans: 55$`, but canonical `STATE.md` stores these fields indented under `progress:` (`  completed_plans: 55`, `  completed_phases: 0`, `  percent: 98`). Unlike `replaceExactlyOnce`, these replacements do not verify that they matched. The driver can therefore commit a closeout receipt and return `passed` while canonical progress remains 55 plans, zero completed phases, and 98 percent. The test hides the defect by constructing a non-canonical unindented fixture at `scripts/check-v1-38-plan-262-69-route-8-source.test.ts:284-285` and never asserting the state counters.
**Fix:** Parse and update STATE structurally, or use exact indentation-aware replacements with one-match assertions for every required field. Verify all phase name/status/stopped-at and progress fields against the canonical phase-complete contract, and test with byte-real canonical carrier fixtures.

### CR-05: PASS does not durably enforce VERIFICATION/BLOCKED XOR

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:836-855,862-884`
**Issue:** PASS schedules `262-74-BLOCKED.md` for deletion, but `preparePassCloseout` excludes every null/deletion change from the commit file list. Recovery also skips HEAD verification for null changes, and `checkCommittedCloseout` neither checks the blocked path nor includes it in Git cleanliness checks. If a tracked fallback exists, PASS deletes it only in the working tree, commits the remaining closeout, and subsequently returns idempotent `passed`; the tracked blocked carrier can reappear on checkout or remain as an unnoticed deletion.
**Fix:** Include deletions in the commit inventory, verify `HEAD:<blocked>` is absent after commit, include BLOCKED in closeout cleanliness/idempotence checks, and test PASS starting from a tracked fallback artifact plus crash recovery at each deletion/commit boundary.

### CR-06: The current repository's valid prior normalization cannot be upgraded

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:666-683`
**Issue:** The working repository already contains the earlier normalized ROADMAP/STATE carriers and an older `phase-262-route8-post-validation` marker in VALIDATION. The new normalizer accepts validation only when bytes equal the committed raw validator source or the newly rendered full normalization. The current authenticated older normalization is neither, so the protocol's required canonical `--normalize-post-validation` invocation fails with `V138_ROUTE8_VALIDATOR_PROVENANCE_INVALID` before it can install the fixed schema. No migration/recovery path exists.
**Fix:** Define and authenticate the previous normalized schema, then permit a one-way atomic migration from that exact state to the new schema; alternatively provide a checked recovery command that reconstructs committed validator bytes without requiring manual carrier edits. Add a fixture made from the current ROADMAP/STATE/VALIDATION bytes.

### CR-07: Plan 74's exact result-check command cannot invoke the production CLI

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:995-996`
**Issue:** The production `--check-plan-262-74-result` branch requires `--phase-dir`, `--requirements`, `--roadmap`, `--state`, and `--validation` in addition to binder/result paths. The exact automated command in `262-74-PLAN.md:126` supplies only binder, verification, summary, and blocked, so it deterministically fails with `V138_ROUTE8_ARGUMENTS_INVALID`. The test-only API bypasses CLI parsing and therefore does not cover the published production command.
**Fix:** Either derive the five canonical lifecycle paths internally for this production command or update and execute the authoritative Plan-74 command with all required canonical arguments. Add subprocess tests for every exact protocol/plan CLI command rather than calling only exported test helpers.

## Warnings

### WR-01: PASS and recovery tests use simplified carriers and bypass production dispatch

**Classification:** WARNING
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.test.ts:268-305,424-475`
**Issue:** The lifecycle fixture uses placeholder plan/summary contents, a flat STATE frontmatter unlike the canonical nested progress map, synthetic execution artifacts, alternate test paths, and direct test-only functions. It never runs the exact published subprocess commands, never starts PASS from a tracked BLOCKED file, and never tests migration from the repository's existing normalized schema. This is why CR-04 through CR-07 pass unnoticed.
**Fix:** Add byte-real carrier fixtures and subprocess-level production CLI tests, plus tracked-deletion, old-schema migration, strict post-Plan73, and crash-recovery matrices.

### WR-02: CLI parsing silently accepts duplicate and unknown options

**Classification:** WARNING
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:968-996`
**Issue:** `parse` overwrites duplicate keys in a `Map`, and each command ignores any extra recognized-looking pairs. The supposedly exact production surface therefore accepts duplicate canonical arguments and undocumented options such as caller-selected temp/status flags even though Plan 74 says those inputs must not be accepted.
**Fix:** Define an exact option set per command, reject unknown and duplicate keys, and add CLI tests for every forbidden extra argument.

---

_Reviewed: 2026-08-26T06:30:19Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
