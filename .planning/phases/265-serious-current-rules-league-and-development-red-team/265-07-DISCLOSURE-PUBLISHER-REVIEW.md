---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-09-23T05:18:19Z
depth: deep
reviewed_commit: 42e10102af2d283e3508b9c59b79770add99a777
diff_base: 42e10102^
files_reviewed: 2
files_reviewed_list:
  - .planning/tools/prepare-phase-265-request-drafts.ts
  - .planning/tools/prepare-phase-265-request-drafts.test.ts
findings:
  critical: 2
  warning: 2
  info: 0
  total: 4
status: issues_found
empirical_authority: false
---

# Phase 265 Plan 07: Disclosure publisher code review

**Reviewed:** 2026-09-23T05:18:19Z  
**Depth:** deep  
**Files reviewed:** 2  
**Status:** issues_found

## Summary

The new publisher uses canonical bytes and the existing content-addressed, no-overwrite factory repository writer. It pins the current implementation/source roots to the reviewed values, and its CLI branch does not take or read an auth-file argument. These checks do not establish a safe publish path: the toolchain inputs can come from a different working directory, and a missing provider value can be interpreted as the next option and committed as provenance. The source manifest's broad JSON inventory also weakens the claimed no-auth-byte-access boundary if credentials are ever placed inside that inventory. No historical artifact, packet, source file, provider, Strategy, or Match was changed or run by this review.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Disclosure can pair reviewed source roots with another project's toolchain

**Classification:** BLOCKER  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.ts:67-79,84-94`  
**Issue:** `factoryAssessmentImplementationManifest()` locates the source inventory relative to its module, but `currentRoots()` reads `pnpm-lock.yaml` and `package.json` relative to `process.cwd()`. The publisher only checks the source/implementation roots; it does not require the toolchain lockfile root to match the `pnpm-lock.yaml` entry in the pinned source inventory. Invoking the exported function or CLI from a different project that has these two files therefore publishes a canonical disclosure claiming the reviewed Coward's Game source commit while recording that other project's lockfile/package manager. Running draft creation from the same foreign directory accepts the mismatched toolchain. This makes source/build provenance false while all publisher guards pass.

**Fix:** Resolve both files from the same module-relative repository root passed to `factoryAssessmentImplementationManifest()`, and assert their byte roots agree with the corresponding pinned manifest entries before publication. Add a test that invokes the publisher from a foreign working directory containing a different package and lockfile and proves it either uses the Coward's Game files or fails before writing.

#### CR-02: Missing provider value publishes a switch name as provider provenance

**Classification:** BLOCKER  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.ts:273-279`  
**Issue:** `arg()` takes the token following a flag without checking whether it is another flag, and the publish branch permits any nonblank `providerId` up to 256 characters. For example, with a valid response factory and settings root, `--publish-disclosure --response-factory <dir> --provider-id --settings-root <root>` sets `providerId` to `--settings-root`; `arg("--settings-root")` still finds the valid root, so the publisher writes an artifact rather than reporting a missing provider. The same permissive parser ignores duplicate/unknown flags and lets `--publish-disclosure` silently change a draft-generation invocation into a publication. A malformed command can thus mint a seemingly valid but unusable or incorrectly labeled dependency before any packet review.

**Fix:** Parse the publish mode against an exact option schema: require exactly one occurrence of each permitted flag, reject unknown or draft-only flags, and reject flag-looking or invalid provider values. Do not call `publishFactoryArtifact` until the complete command is validated. Test missing-value, duplicate, unknown, and mixed-mode cases and assert no artifact appears.

### Warnings

#### WR-01: Recursive source inventory can read an auth JSON file before binding fails

**Classification:** WARNING  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.ts:67-69,84-86` (callee: `scripts/check-v1-38-lab-boundaries.ts:44-59`)  
**Issue:** The publisher does not read an auth path directly, and no `auth.json` is currently in the scanned repository tree. However, its `currentRoots()` call uses `loadLabBoundaryFiles()`, which opens every regular `.json` file outside its excluded directories before the reviewed-root comparison. A regular `auth.json` under a scanned directory would have its bytes read even though the subsequent root check rejects publication. The absolute no-auth-byte-access claim is therefore conditional on credential placement, not enforced by the publisher.

**Fix:** Make source inventory an explicit allowlist or reject credential-shaped paths before any file read. Add a sentinel-auth-file test showing the publish path never opens its bytes.

#### WR-02: New publisher safety failures are not tested

**Classification:** WARNING  
**File:** `/Users/roryquinlan/runtime/cowards-game/.planning/tools/prepare-phase-265-request-drafts.test.ts:37-46,80-93`  
**Issue:** The only direct publisher assertion is a same-process, repository-root happy path that republishes expected bytes. Existing mismatch tests exercise the downstream draft reader, not the new publisher. They cannot catch publication with a wrong working-directory toolchain, an invalid settings root or provider, a malformed CLI invocation, or an accidental write into a supplied historical repository. These are precisely the new publish-before-review boundaries.

**Fix:** Add direct publisher and CLI negative tests using fresh temporary `factory-*` directories. Assert rejection occurs before any new artifact, repeated publication is idempotent, and pre-existing historical artifact bytes and inventory remain unchanged.

## Scope and validation

Reviewed the exact `42e10102` diff, both full files, the factory repository writer, source-inventory implementation, and the model-authoring transport. This is source review only. The separate complete Phase 265 source gate was not touched or interrupted; no empirical authority is claimed.

---

_Reviewed: 2026-09-23T05:18:19Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
