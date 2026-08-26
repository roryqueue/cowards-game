---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-26T07:02:32Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-69-route-8-source.ts
  - scripts/check-v1-38-plan-262-69-route-8-source.test.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-26T07:02:32Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The post-fix sentinel is still not runnable or safe to close on main HEAD `5ec30cf0`. The exact production normalization command fails in a clean disposable clone with `V138_ROUTE8_TOPOLOGY_REWRITTEN`: commit `7634f56d` changed `262-74-PLAN.md` after the Plan-73 summary commit that the checker treats as the latest permissible topology anchor. If that blocker is removed, the committed validator still parses as zero requirement rows because the parser rejects the canonical blank line after `## Requirement Coverage`.

Prior CR-04 (checked STATE progress replacements), CR-05 (committed BLOCKED deletion/final XOR), CR-07 (four-option result CLI), and WR-02 (exact CLI option sets) are fixed in the reviewed code. Prior CR-01 remains unresolved because the new manifest proves only locally authored Git ordering and public hashes, not execution-producer authenticity. Prior CR-02's strict-descendant and duplicate-row checks are present, but the canonical validator schema is rejected. Prior CR-03's journal schema/inventory/intent checks are present, but a crash between transaction-directory creation and journal durability permanently wedges recovery. Prior CR-06's legacy migrator exists but is unreachable on current HEAD because topology and validator checks fail first. Prior WR-01 remains: production subprocesses run only against simplified fixtures that omit the canonical defects.

Verification performed: 21 focused tests passed in bounded groups (17 plus the final 4); `pnpm exec tsc --noEmit --pretty false` passed; `git diff --check` passed. The production help and unknown/duplicate option surface behaved correctly. The exact canonical normalization command was run only in a disposable clean clone and failed as described. No source, test, ROADMAP, STATE, VALIDATION, binder, or result carrier was changed in the live checkout.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The execution-provenance manifest still permits a synthetic 540/540 PASS

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:355-399`
**Issue:** The new check proves that self-rooted JSON artifacts were committed across at least two commits before a locally generated manifest and Plan-72 summary. It does not authenticate a runtime producer, command receipt, signature, or independently fixed producer blob. `producerBlob` is simply read from the attacker-selected manifest commit, and authorization/seal are not included in the clean artifact identity inventory. A generic writer can still create the seven claimed artifacts, commit them in two commits, calculate the public manifest root, and satisfy the lineage. The test fixture continues to synthesize the whole chain and manifest locally rather than invoke a v13/v14 producer (`scripts/check-v1-38-plan-262-69-route-8-source.test.ts:215-285`).
**Fix:** Bind the manifest to a pre-authorized exact producer blob/root established before Plan 72 and to producer-issued execution receipts that cannot be recreated by this checker fixture. Include authorization and seal Git identities, the actual execution command/runtime identity, and immutable charged-attempt roots. Add a test showing that a generic two-commit JSON construction is rejected.

### CR-02: Main HEAD is rejected by its own topology anchor

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:253-274`
**Issue:** `topology` requires the latest commit for every canonical plan and summary to be an ancestor of the latest Plan-73 summary commit. The fix's own commit `7634f56d` modifies canonical `262-74-PLAN.md` after Plan-73 summary commit `4b7ff1ea`. Therefore the exact production `--normalize-post-validation` command on a clean clone of HEAD fails with `V138_ROUTE8_TOPOLOGY_REWRITTEN` before migration, normalization, binding, or sentinel execution can begin.
**Fix:** Define a post-fix reviewed topology anchor/manifest that explicitly authenticates the amended Plan-74 and protocol bytes, or stop treating Plan 73 as the latest allowable commit for a sentinel plan that must legitimately receive reviewed command corrections. Add a clean-HEAD subprocess test, not a newly fabricated fixture history.

### CR-03: The validator parser rejects the canonical Markdown table

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:297-304`
**Issue:** The coverage regex requires a table row immediately after `## Requirement Coverage\n`. Canonical `262-VALIDATION.md` has the normal blank line before its table, so the exact regex yields `coverageBytes: 0` and `rows: 0`; the checker then throws `V138_ROUTE8_VALIDATOR_SCHEMA_INVALID`. The fixture generator deliberately emits no blank line at `scripts/check-v1-38-plan-262-69-route-8-source.test.ts:211`, masking the production failure.
**Fix:** Parse Markdown structurally or allow the canonical blank line and require the exact header/separator plus exactly 16 data rows. Test against the committed canonical validation bytes for both obstruction and terminal schemas.

### CR-04: A crash before journal creation permanently wedges transaction recovery

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:663-677,754-767`
**Issue:** Installation durably writes the Git-dir intent, creates and fsyncs the repository transaction directory, and only then creates `journal.json`. A crash or power loss after `mkdirSync`/directory fsync but before the journal is durably present leaves both the directory and intent. On restart, `recoverTransaction` sees the directory and unconditionally reads the missing journal, producing `V138_ROUTE8_TRANSACTION_INVALID`; it cannot determine that no canonical change was installed or clean up/retry. Existing recovery tests inject faults only after artifact installation, not at transaction setup boundaries.
**Fix:** Make the prepared journal durable before publishing the transaction directory (for example, build a private temporary directory and atomically rename it), or recognize an authenticated intent plus missing journal as a pre-install state that can be safely removed. Add abrupt child-process termination tests after intent write, directory creation, journal write, and each fsync boundary.

### CR-05: PASS installs completion carriers before verification and summary

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:1003-1010`
**Issue:** `baseChanges` orders REQUIREMENTS, ROADMAP, and STATE before VALIDATION, VERIFICATION, and `262-74-SUMMARY.md`; recovery installs changes in array order. This directly violates the Plan-74 contract requiring authenticated verification first, summary second, and only then progress/phase completion. A crash after the early installs can expose ADMIT-03 complete, Phase 263 current/authorized, and 56/56 progress while verification and the Plan-74 summary are still absent. A recovery journal does not make those intermediate carrier states invisible to ordinary readers.
**Fix:** Install verification first, then summary, then requirements/progress/completion carriers, and make readers fail closed while an authenticated transaction is pending. Prefer an atomically replaced generation pointer if cross-file visibility must be atomic. Add crash-observation tests after every PASS install boundary that assert no summary means no completed progress.

## Warnings

### WR-01: Exact subprocess tests do not use exact repository carrier bytes or history

**Classification:** WARNING
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.test.ts:203-345,564-591`
**Issue:** The exact CLI argument test is subprocess-level, but its repository is still a handcrafted fixture: validation omits canonical Markdown spacing, execution evidence is synthetically authored, and Plan 74 is never changed after the Plan-73 anchor. Thus it proves argument dispatch while missing both production command blockers and the remaining synthetic-provenance flaw.
**Fix:** Add a disposable clone test at the reviewed HEAD with only branch-specific evidence substitutions, and assert the full documented normalization/check/bind/check/sentinel/result sequence. Keep smaller fixtures for mutation isolation, but do not treat them as production-path proof.

---

_Reviewed: 2026-08-26T07:02:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
