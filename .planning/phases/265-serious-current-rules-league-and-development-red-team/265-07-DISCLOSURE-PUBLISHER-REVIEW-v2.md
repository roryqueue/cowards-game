---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-23T05:23:57Z
depth: deep
reviewed_commit: 8f5258d7dcaa0911589b7405eef07cf3aff8e8ce
diff_base: 8f5258d7^
files_reviewed: 2
files_reviewed_list:
  - .planning/tools/prepare-phase-265-request-drafts.ts
  - .planning/tools/prepare-phase-265-request-drafts.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
empirical_authority: false
---

# Phase 265 Plan 07: Disclosure publisher repair re-review

**Reviewed:** 2026-09-23T05:23:57Z  
**Depth:** deep  
**Files reviewed:** 2  
**Status:** issues_found

## Summary

The repair closes the two previously reported direct publication bugs. Package/lockfile inputs now come from the same module-relative repository as the pinned source manifest, and the publish CLI parses an exact set of options before writing. The implementation still does not guarantee the requested no-credential-byte-access and exact response-factory-target boundaries: its credential pre-scan misses source-inventory file types and common credential filenames, and its target check deliberately follows a symlink at the named response path. The tests cover several negative cases but never exercise a successful call to the guarded publisher. No source, historical packet/disclosure artifact, provider, Strategy, or Match was changed or run by this review.

## Prior-finding disposition

- **Original CR-01 — closed:** `currentRoots()` derives the source inventory, package file, and lockfile from `REPOSITORY_ROOT`; it also compares raw package/lockfile roots with their source-manifest entries. The foreign-CWD test at `.planning/tools/prepare-phase-265-request-drafts.test.ts:38-47` covers the original mismatch.
- **Original CR-02 — closed:** `parsePhase265DisclosureArguments()` requires one publish flag and exactly the three permitted key/value pairs, rejects missing values, repeats, unknown/mixed flags, malformed roots, and flag-shaped provider IDs. The publisher rechecks the provider syntax. Tests cover the key malformed forms at `.planning/tools/prepare-phase-265-request-drafts.test.ts:58-65`.
- **Original WR-01 — open:** the new pre-scan denies only a narrow set of exact `.json` filenames. See CR-01 below.
- **Original WR-02 — partially closed:** foreign-CWD, parser, and wrong-repository negatives were added, but the guarded publisher's successful/idempotent path and the pre-read credential invariant are not directly tested. See WR-01 below.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Credential-shaped YAML/TOML or suffixed JSON is read before the source pin rejects it

**Classification:** BLOCKER  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.ts:69-87` (callee: `scripts/check-v1-38-lab-boundaries.ts:44-59`)  
**Issue:** `assertNoCredentialInventoryPaths()` rejects only the exact basenames `auth.json`, `credential(s).json`, and `secret(s).json`. The subsequent `factoryAssessmentImplementationManifest()` opens every `.json`, `.yaml`, `.yml`, and `.toml` file in the same scanned tree. Therefore `scripts/auth.yaml`, `scripts/credentials.toml`, or `scripts/auth.local.json` passes the pre-scan and has its credential bytes read by the manifest before the changed source root can fail the reviewed-root check. The repair does not establish the explicitly required no-auth-byte-access boundary.

**Fix:** Before invoking the byte-reading inventory, compare eligible pathnames against an authenticated allowlist/path-set from the reviewed source commit, rejecting any added inventory path without opening it. Also deny credential-shaped names across every inventoried extension. Test representative YAML, TOML, and suffixed JSON names with a read spy or other proof that their bytes were never opened.

#### CR-02: Symlinked response-factory path redirects publication into another factory repository

**Classification:** BLOCKER  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.ts:116-119`  
**Issue:** The expected target is defined as `realpathSync(RESPONSE_FACTORY_PATH)` when the named path exists. If `.strategy-lab/factory-265-current-rules-20260922` is replaced by a symlink to a historical `factory-*` directory, `expected` becomes that historical directory. A `FactoryRepository` created from the historical directory passes the equality check and `publishFactoryArtifact()` appends the new disclosure there. The current workspace target is a regular directory, but the guard does not enforce the exact named response path or historical-store separation under this reachable path state. Existing artifact bytes remain protected by the content-addressed writer; the repository-target boundary is what fails.

**Fix:** Require the named response directory itself to be a real directory with `realpathSync(RESPONSE_FACTORY_PATH) === RESPONSE_FACTORY_PATH`, then require `repository.directory === RESPONSE_FACTORY_PATH` before publication. Add a symlink-to-historical temporary fixture that proves rejection without writing to either directory.

### Warnings

#### WR-01: The actual guarded publication path has no success/idempotence test

**Classification:** WARNING  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.test.ts:48-80`  
**Issue:** The repaired test compares the pure `createPhase265SourceBuildDisclosure()` result, then calls the generic `publishFactoryArtifact()` directly. It tests `publishPhase265SourceBuildDisclosure()` only with a wrong-path repository. Thus the test suite cannot catch a change that makes the exact response repository fail publication, writes unexpected bytes, or breaks repeat publication. The credential sentinel test calls only the pre-scan and reads the sentinel itself; it does not prove that the end-to-end publisher avoids reading credential bytes.

**Fix:** Test the guarded publisher's successful path and repeated content-addressed result in an isolated fixture or through a narrowly injected expected response path. Exercise the complete publish path for credential exclusions while instrumenting file reads, and assert all pre-existing artifacts remain byte-identical.

## Scope and validation

Reviewed the exact `8f5258d7` diff, both complete changed files, the source-inventory reader, and the content-addressed repository writer. This was read-only source review. I did not start or interrupt the separate complete Phase 265 source gate, run model/provider work, publish a disclosure, or claim empirical authority.

---

_Reviewed: 2026-09-23T05:23:57Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
