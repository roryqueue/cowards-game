---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "115"
reviewed: 2026-08-30T02:55:36Z
depth: deep
source_range: aded29e6..5b6dfa3c
files_reviewed: 4
files_reviewed_list:
  - scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts
  - scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.test.ts
  - scripts/native/v1-38-plan-262-115-exclusive-writer-v1.c
  - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-115-SUMMARY.md
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 115 Fix Re-review

**Reviewed:** 2026-08-30T02:55:36Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

All three original blockers are resolved at their tested boundaries. Plan 115 now exposes only Plan-116 review eligibility, requires exact current `0644` no-follow custody before/during/after reads, and creates the supplement through a retained-directory `openat` helper that detects a real parent symlink swap and cleans only through its retained descriptor.

The correction introduces two new custody blockers. The adapter executes an unauthenticated predictable binary from the shared temporary directory, and the Plan-115 summary still hands Plan 116 the obsolete pre-fix two-file closure rather than the current adapter/test/native closure. Plan 116 therefore cannot safely treat the current implementation as an exact reviewed input.

Verification:

- Focused current-mode and real parent-swap tests passed: 2/2 in 19.94 seconds.
- `pnpm exec tsc --noEmit --pretty false` and scoped `git diff --check` passed.
- Current corrected closure at `737fd0e6`: tree `dd4dbae647026b9f968a75ff8f11914157c14d13`, parent `c21f0ef8947c5f980710e4a7c70fa25b6f092cc8`, adapter blob `b81ed6bb`, test blob `7f285692`, native blob `a733b6ce`, all `100644`.
- Canonical supplement-v3 and all live/effect destinations remained absent.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Predictable shared-temporary binary cache permits arbitrary helper substitution

**Classification:** BLOCKER

**File:** `scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts:378-405`

**Issue:** `nativeWriterExecutable` derives a public filename from the committed C-source hash under the shared `tmpdir()` and trusts any existing entry at that pathname. It does not require a regular owner-only file, verify owner/mode/device/inode, hash the executable, or prove that this process compiled it. Another local user or earlier compromised process can pre-create that predictable path with an arbitrary executable; the adapter then runs it with repository root and canonical bytes. The equally predictable PID-suffixed compiler output and `mv -n` installation do not close the pre-existence attack. This turns the new safety helper into an arbitrary-code execution boundary and can bypass all retained-directory guarantees.

**Fix:** Compile inside a fresh process-owned `mkdtemp` directory with mode `0700`, invoke only that freshly created regular executable after descriptor identity/mode checks, and remove the private directory afterward. Do not reuse a shared pathname based only on source hash. If caching is essential, install into an owner-private directory and authenticate owner, exact mode, inode, and expected executable digest before every invocation; add a pre-seeded-cache substitution test.

#### CR-02: Plan 116 receives the obsolete pre-fix two-file custody closure

**Classification:** BLOCKER

**File:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-115-SUMMARY.md:19-23,59-65,74-94,140-154`

**Issue:** The summary still declares two created files and identifies `d7ebb154` as the final source/test commit with the old adapter/test blobs. The fixes changed both files and added the native helper, with the actual corrected closure ending at `737fd0e6`. The additive paragraph names fix commits but supplies no replacement commit/tree/parent/mode/blob manifest and never adds the native helper to `key-files`. Plan 116 is explicitly required to rederive the exact committed Plan-115 closure from this handoff; following the current summary would review obsolete code and omit the executable security boundary entirely.

**Fix:** Replace the authoritative Git-custody handoff with the exact corrected three-file closure: commit `737fd0e6`, tree `dd4dbae647026b9f968a75ff8f11914157c14d13`, parent `c21f0ef8`, and `100644` blobs `b81ed6bb` (adapter), `7f285692` (test), and `a733b6ce` (native helper). Add the native helper to `key-files`, files-created/modified accounting, threat boundary, and Plan-116 review instructions. Preserve the earlier closure only as superseded history.

## Non-Authority

This review grants no Plan-116 or Plan-109 eligibility and creates no supplement, readiness, live invocation, producer effect, counter consumption, downstream artifact, or Phase-263 authority. Plan 115 remains blocked pending correction and a fresh independent re-review.

---

_Reviewed: 2026-08-30T02:55:36Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
