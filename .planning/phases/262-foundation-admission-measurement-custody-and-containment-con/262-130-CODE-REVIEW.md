---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "130"
reviewed: 2026-08-30T23:45:48Z
reviewed_head: 0e83ac040c0b7259c52e0fb8e36f4ca785de8a8c
subject_commit: cd6c93c18664307abc20a8d98a88b3577456a36e
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-130-live-v13-custody-v4.ts
  - scripts/check-v1-38-plan-262-130-live-v13-custody-v4.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 262 Plan 130: Code Review Report

**Reviewed:** 2026-08-30T23:45:48Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Narrative Findings (AI reviewer)

The v4 correction was reviewed against Plan 262-130, committed review `73d1be60`, the immutable v3 publication, the live-v13 custody helpers, and current later HEAD `0e83ac04`. The exact b331 seven-path check, v3 byte immutability/current ineligibility, source-only effect boundary, and pure strict-ancestor assertion are present. The focused suite, TypeScript compilation, and guarded source-only probe all pass. They do not establish a clean result: disposable native-source custody remains bound to the canonical checkout, and the independent AST boundary still accepts identifier-indirected constructor, eval, and module-loader recovery.

## Critical Issues

### CR-01 [BLOCKER]: Disposable native-source custody is still derived from the canonical checkout

**File:** `scripts/check-v1-38-plan-262-130-live-v13-custody-v4.ts:303-307`

**Issue:** v4 now passes `linked` to `deriveV138PathStableCustody`, but it calls the helper imported into the canonical review process. The helper's native-custody dependency binds `transactionSource` and `ownerLockSource` once from its own `import.meta.url` (`scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts:39-47`) and later hashes those module-level canonical paths into `nativeSourcesRoot` (`scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts:350-354`). It does not derive those paths from the supplied `repoRoot`. Consequently, every `disposable.localNativeSourcesRoot` is custody of the canonical checkout's native sources, even though the observation claims to be complete custody derived inside the linked worktree. `checkV138PathStableCustodyForReview(disposable, disposable)` is only a self-consistency check and cannot detect this root misbinding. This leaves CR-01 from the prior review incompletely corrected.

**Fix:** Make local native custody explicitly root-relative: either change the custody helper to resolve and hash both native sources from `repoRoot`, or execute a committed custody entrypoint loaded from each linked worktree so its module-relative paths bind to that worktree. Compare the returned portable reviewed closure with canonical main, but retain the independently derived linked local roots. Add an adversarial test that proves the local native manifest names the linked paths (or fails when the helper is loaded from canonical main) instead of merely asserting a SHA-256 shape.

### CR-02 [BLOCKER]: Identifier-indirected dynamic code and loader recovery bypasses the AST policy

**File:** `scripts/check-v1-38-plan-262-130-live-v13-custody-v4.ts:127-179`

**Issue:** `constantString` resolves only expressions inline at the dangerous access site and the visitor does not inspect plain string literals or track constant/alias bindings. Therefore all of the following read-only mutations were accepted by `inspectV138Plan130BoundarySourceForReview`: `const k = "constructor"; globalThis[k][k]("return 1")()`, `const k = "eval"; globalThis[k]("1")`, and `const k = "getBuiltinModule"; process[k]("node:module")`. A stronger accepted mutation builds `k` with `['con', 'structor'].join('')` and passes generated code that recovers the module loader and `runV138V3ProductionLive`; because the dangerous names occur inside an unparsed string and the element accesses use identifiers, `dangerous` remains zero. This bypasses both the claimed fail-closed boundary and the static-import producer guard, so CR-02 remains open.

**Fix:** Use a fail-closed binding-aware policy. Resolve immutable identifier aliases and string-producing expressions before accepting element access; reject computed access when the key cannot be proven safe; reject references to code-generation or loader capabilities through globals, destructuring, `Reflect`, descriptors, and aliases; and inspect or categorically reject strings supplied to any dynamically recovered callable. Prefer an allowlist of the exact permitted live-v13 AST surface over an expanding denylist. Add the accepted identifier-indirection mutations above, plus recovered callable aliases, to the hostile suite and require rejection before any zero-effect execution.

## Verified Corrections and Boundaries

- `b331baad` currently has exactly the sorted seven required name-status entries: two additions and five modifications; missing, extra, and status-changed mutations are tested.
- The exact v3 trio remains at its original blobs with no successor rewrite, retains stored `plan110Eligible: true`, and is reclassified by v4 as currently ineligible under `process_invalid_false_clean_custody` without modifying stored bytes.
- The pure later-HEAD assertion rejects equality and false ancestry. No v4 publication exists in Plan130; actual Git-backed publication authentication remains a Plan131 responsibility.
- Plan130 adds only the v4 source and test. The source-only probe reports two guarded modes, zero producer calls, zero readiness/live invocation, zero charging/acceptance, and denied authority; no effect destination was created.
- Source and reviewer remain separated: the live-v13 subject is `3882cd5d`, the corrective implementation ends at `cd6c93c1`, and this review ran from later HEAD `0e83ac04`.

## Verification

- Focused serialized Vitest: passed, 1 file / 4 tests, 148.63 seconds.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `pnpm exec tsx scripts/check-v1-38-plan-262-130-live-v13-custody-v4.ts --check-source-only`: passed and reported literal-zero producer/effect/authority fields with `plan110Eligible:false`.
- Adversarial in-memory AST mutations: four identifier-indirected constructor/eval/loader variants were incorrectly accepted, confirming CR-02.
- `git diff --check e0a4f146..cd6c93c1`: passed.

## Effect Boundary

No readiness selector, live selector, historical producer, producer destination, or effect artifact was invoked or created during this review. Only focused tests, TypeScript compilation, the source-only guarded probe, static/Git reads, and in-memory AST mutations were used.

---

_Reviewed: 2026-08-30T23:45:48Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
