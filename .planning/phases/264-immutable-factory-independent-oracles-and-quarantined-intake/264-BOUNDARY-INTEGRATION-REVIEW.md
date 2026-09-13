---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
reviewed: 2026-09-13T18:52:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - scripts/check-v1-38-lab-boundaries.ts
  - scripts/check-v1-38-lab-boundaries.test.ts
  - .dockerignore
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 264: Code Review Report

**Reviewed:** 2026-09-13T18:52:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the Plan 264 integration that adds the three private oracle package names to the existing lab-boundary monitor and Docker context exclusions. The focused Vitest suite passes (29 tests), but image-copy detection is incomplete for ordinary Dockerfile flags and the `.dockerignore` parser accepts only exact directory entries. The report is a source-graph monitor finding, not a claim that the monitor provides container or runtime security certification.

## Critical Issues

### CR-01: Dockerfile copy flags bypass private-image detection

**File:** `scripts/check-v1-38-lab-boundaries.ts:67`
**Issue:** The `COPY`/`ADD` expression only matches an instruction whose first argument is `.` or `./`. It does not accept standard options such as `COPY --chown=1000:1000 . /app`, `COPY --from=builder . /app`, or `ADD --checksum=... . /app`. In a Dockerfile using one of these forms, a missing or incomplete `.dockerignore` produces no `IMAGE_INCLUDES_LAB` violation, even though the instruction copies the entire build context and can include `packages/strategy-oracle-*` (and `packages/strategy-lab`) in the image. The added tests cover only the unflagged form, so this regression is not exercised.
**Fix:** Parse Dockerfile instructions after consuming zero or more `--name[=value]` options, then apply the context-copy check to the remaining source arguments. Add fixtures for at least `--chown`, `--from`, and `ADD` options with absent/incomplete exclusions; retain the existing positive case for a complete exclusion list.

## Warnings

### WR-01: Valid Docker ignore glob patterns are treated as missing exclusions

**File:** `scripts/check-v1-38-lab-boundaries.ts:36-39`
**Issue:** `excludesPrivateImages` requires one exact line per discovered package directory. Valid Docker ignore rules such as `packages/strategy-oracle-*`, `packages/strategy-oracle-tactical/**`, or an equivalent rooted/leading-slash form do not satisfy that test, so a repository using a safe wildcard policy is rejected as exposed. This can make the boundary check fail closed for CI even though Docker would exclude the private package, and the tests do not cover the supported pattern forms.
**Fix:** Implement Docker-ignore matching for the private directory probes (including rooted patterns, `**`, trailing `/**`, comments, and negation ordering), or deliberately document and test the exact-entry restriction as a repository policy instead of implicitly treating all other valid rules as unsafe.

---

_Reviewed: 2026-09-13T18:52:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
