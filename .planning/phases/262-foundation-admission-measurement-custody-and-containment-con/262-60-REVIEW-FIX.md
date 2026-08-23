---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-23T20:19:33Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-CODE-REVIEW-V2.md
iteration: 2
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 262 Plan 60: Code Review Fix Report

**Fixed at:** 2026-08-23T20:19:33Z
**Source review:** `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-CODE-REVIEW-V2.md`
**Iteration:** 2

**Summary:**

- Findings in scope: 4
- Fixed: 4
- Skipped: 0
- Corrected sourceBase9: `f4d25b38ed1e23d1d575b3f0d0fd6bb587d848b0`
- Corrected sourceA9: `8e32ae56a6a61a1c8553c769514b8e17f5833737`
- Corrected sourceA9 tree: `f7b6adbbb2b6c62c0f3f6115297d0f340ed39dae`
- Corrected sourceA9 sole parent: `f4d25b38ed1e23d1d575b3f0d0fd6bb587d848b0`
- Author-run trailer: `Plan-262-60-Author-Run: codex-plan-262-60-a9-review-fix-v2`
- Source correction commit: `8e32ae56`

The corrected author run contains exactly the six current source/test paths
listed in the summary's Exact A9 Custody table. The two reviewer-v2 deletions
are not aggregate members; they are authenticated separately at historical
commit `8c3cab21d7da0d59101480e17a973e0317646622` with their prior blobs,
digests, byte lengths, exact `D` statuses, and continued absences.

## Fixed Issues

### CR-01: Review evidence could not be independently reproduced

**Files modified:** `scripts/lib/v1-38-source-completeness-review-v3.ts`, `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commit:** `8e32ae56`
**Status:** fixed: requires human verification
**Applied fix:** Commands and handler observations are now independently supplied to authorization and joined exactly against one immutable route manifest. Command records carry exact argv plus stdout/stderr bytes and recomputed SHA-256 digests. Handler observations carry the manifest's command, handler, runtime, version, schema, and ordinal semantics. Mutation tests reject each semantically significant field and prove that document-internal claims cannot self-authorize.

### CR-02: A9 custody conflated six corrected paths with two historical deletions

**Files modified:** `scripts/check-v1-38-dependency-revision-boundaries.ts`, `scripts/lib/v1-38-source-completeness-review-v3.ts`, `scripts/lib/v1-38-successor-source-seal.ts`
**Commit:** `8e32ae56`
**Status:** fixed: requires human verification
**Applied fix:** The correction run and summary now bind exactly six current source/test paths. The two removed reviewer-v2 paths are authenticated independently through their deletion commit, sole parent, tree, trailer, exact `D` records, prior blobs/digests/lengths, and absence at sourceA9/current state. No claim combines those distinct histories.

### CR-03: Tool-identity failure could be produced from a healthy identity

**Files modified:** `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/lib/v1-38-current-matrix-reproduction.ts`, `scripts/evaluate-v1-38-successor-source-complete.test.ts`
**Commit:** `8e32ae56`
**Status:** fixed: requires human verification
**Applied fix:** Authorization and seal now carry the same immutable expected tool-identity root. The observed root is derived independently in the route checker. Equality follows the healthy success path and cannot publish a tool-identity failure; only a genuine mismatch produces the failure proof. A valid-v9 regression test covers both branches and verifies the sealed expected root.

### CR-04: Detached review input had a path-swap race

**Files modified:** `scripts/lib/v1-38-source-completeness-review-v3.ts`, `scripts/lib/v1-38-successor-source-seal.ts`, `scripts/evaluate-v1-38-successor-route.test.ts`
**Commit:** `8e32ae56`
**Status:** fixed: requires human verification
**Applied fix:** Detached input is read once through a Darwin native `openat` helper. It opens every ancestor relative to retained directory descriptors with `O_NOFOLLOW`, opens the leaf relative to the validated parent, caps input at 16 MiB, performs one exact `pread`, rejects zero/truncated reads, rechecks leaf identity, and rewalks the namespace to detect ancestor substitution. Authorization consumes that single immutable snapshot. Adversarial tests swap an ancestor and truncate the leaf during the controlled read window; both abort before authorization.

## Exact Correction-Run Custody

| Path | Mode | Blob | SHA-256 | Bytes |
|---|---:|---|---|---:|
| `scripts/check-v1-38-dependency-revision-boundaries.ts` | `100644` | `b2c6954ffe563e417658e9999d2e29871b4621de` | `sha256:14f177a21fc7ae5b5fb3ca5bc5283edef621866f6b7e7ca2dfcad9a4129f5ca3` | 76434 |
| `scripts/evaluate-v1-38-successor-route.test.ts` | `100644` | `6947740c0314d587882d861e099db99d781aa956` | `sha256:aa59e3a6e5eab8e65c8eca251f53ae8a7c9484aa5d40e3a39c24dcdffbaffb86` | 38235 |
| `scripts/evaluate-v1-38-successor-source-complete.test.ts` | `100644` | `cdbe8990cc2d73ce377083ff007dfa8460585559` | `sha256:ddcdd0e5ec9329b4abb74d9bf33438ee6eb2547dc00d1fea6393e3e4530e1607` | 23748 |
| `scripts/lib/v1-38-current-matrix-reproduction.ts` | `100644` | `049a6e06addc19a44729b1bd8c1092c1ef489e18` | `sha256:8469a1c3b466e5d3a6ab37c7db345b43c9f53bcc9706a176f8e3c8791dfec406` | 847199 |
| `scripts/lib/v1-38-source-completeness-review-v3.ts` | `100644` | `287ccce61933474c74d8099889f18856b335cd83` | `sha256:9e68a095dd0156c5b29706a4bbda339c719cbd2da791398e2ca8417cc6d3bae2` | 35359 |
| `scripts/lib/v1-38-successor-source-seal.ts` | `100644` | `5e44dba8d4ac354bf420fc2c09f1f37a83c9c9e8` | `sha256:43ae9c87f5413950f8ab5f8f26767c297edad62129a9e91574e51e3ef9b84c70` | 348396 |

## Verification

- `pnpm exec vitest run scripts/evaluate-v1-38-successor-route.test.ts scripts/evaluate-v1-38-successor-source-complete.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=1500000 --bail=1` — 2 files, 29 tests passed, 0 skipped.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` — passed with zero findings after the committed six-path correction run and exact summary bindings.
- `pnpm turbo typecheck --concurrency=1` — 27/27 tasks passed.
- `git diff --check f4d25b38ed1e23d1d575b3f0d0fd6bb587d848b0..HEAD` — passed.
- Reviewer-v2 active checker/test remain deleted; canonical review-v3/report, authorization-v9, seal-v9, B9, route-start, and live destinations remain absent.

## Skipped Issues

None.

---

_Fixed: 2026-08-23T20:19:33Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 2_
