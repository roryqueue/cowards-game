---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "29"
subsystem: protected-working-tree-integrity
tags: [git, provenance, write-once, protected-dirt, phase-baseline]
requires:
  - phase: 258
    provides: exact source/artifact identity and protected historical byte posture
provides:
  - Exact write-once baseline for the two user-owned protected paths
  - Pure non-mutating check of raw bytes, modes, HEAD blobs, staged/unstaged diffs, and status
  - Reproducible evidence that valid phase-start dirt remains byte-identical
affects: [259-21, 259-23, 259-final-audit]
tech-stack:
  added: []
  patterns:
    - separate execution worktree from read-only observed primary checkout
    - exact git binary diff bytes stored as Base64 with SHA-256 and length
    - canonical self-hashed write-once artifact
key-files:
  created:
    - scripts/capture-v1-37-protected-baseline.ts
    - scripts/capture-v1-37-protected-baseline.test.ts
    - .planning/artifacts/v1.37-protected-working-tree-baseline.json
  modified: []
key-decisions:
  - "The baseline observes the protected primary checkout read-only even when execution occurs in an isolated worktree; only the baseline artifact is written in the executor checkout."
  - "Existing modified and unstaged status is valid only when raw SHA-256, length, mode, HEAD blob/mode, exact unstaged and staged binary diff bytes, and porcelain status all match."
  - "The artifact is deterministic and write-once: an identical recapture is a no-op, while any changed evidence or self-hash refuses overwrite."
requirements-completed: [CONF-04]
coverage:
  - id: D1
    description: "The exact two protected paths are captured with raw, HEAD, mode, staged, unstaged, and status evidence."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: scripts/capture-v1-37-protected-baseline.test.ts#clean modified staged and mixed states
        status: pass
      - kind: integration
        ref: pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check
        status: pass
    human_judgment: false
  - id: D2
    description: "Raw-byte, mode, diff-only, missing, extra-path, overwrite, and baseline mutation attacks fail without restoring or staging protected files."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: scripts/capture-v1-37-protected-baseline.test.ts#mutation suite
        status: pass
    human_judgment: false
duration: 8min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 29: Protected Working-Tree Baseline Summary

**A write-once artifact now proves the exact pre-existing protected main-checkout dirt while every capture and check remains read-only toward those files.**

## Performance

- Duration: 8 min
- Tasks: 1 TDD task
- Files created: 3
- Tests: 7/7 focused mutation and state tests passed

## Accomplishments

- Added a fixed two-path capture command for `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md`; extra, missing, reordered, or substituted inventory fails closed.
- Captured raw file SHA-256, byte length, POSIX mode, HEAD blob identity/mode, exact unstaged and cached `git diff --binary --no-ext-diff` bytes/hash/length, and exact per-path porcelain status.
- Stored diff bytes as canonical Base64 so later checks compare exact bytes rather than declarations or normalized text.
- Added deterministic artifact self-hashing and write-once identical-only behavior. A changed checkout cannot rewrite its baseline, and a changed baseline cannot pass its own parser.
- Made isolated execution observe the primary checkout read-only. The script writes only the evidence artifact in its execution checkout and never stages, restores, chmods, normalizes, or writes either protected path.
- Proved the live requested state exactly:
  - config raw `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`, unstaged diff `1372d196c86ee3907fcac07a7075b06814f2eaedf328314a31641713c71e6765`
  - spec raw `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`, unstaged diff `ae29a7dbf894437668f880f7775904eeb580b0e82c99a91cba0dbf9e611bcd2d`
  - both mode `0644`, status unstaged-only, and cached diff SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Commits

| Commit | Description |
|---|---|
| `5ac119f` | RED tests for protected state, drift, and write-once behavior |
| `00c7eb1` | Capture/check command and exact live baseline artifact |

## Decisions Made

- Did not require a clean checkout. The exact valid phase-start modified state is the authority.
- Did not store raw protected file bytes. Raw files are bound by SHA-256, byte length, and mode; exact git diff bytes are retained because the plan explicitly requires staged/unstaged byte identity.
- Did not bind the repository HEAD commit, because unrelated phase commits must not stale the baseline. Each protected path's HEAD blob/mode is independently bound and will fail if that path is committed differently.
- Used the primary worktree only as a read target when invoked from an isolated worktree, avoiding any need to copy user dirt into the executor lane.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Resolved repository roots through filesystem aliases**

- **Found during:** Initial temp-repository GREEN run
- **Issue:** macOS temporary paths may be reported through `/private` aliases, causing byte-identical repository roots to compare as different strings.
- **Fix:** Resolve both requested and Git-reported roots through `realpathSync` before equality checks.
- **Files modified:** `scripts/capture-v1-37-protected-baseline.ts`
- **Verification:** All clean, modified, staged, mixed, and mutation fixtures pass.
- **Commit:** `00c7eb1`

**Total deviations:** 1 auto-fixed bug. **Impact:** Portable exact-root validation without relaxing repository containment.

## Verification

- `pnpm exec vitest run scripts/capture-v1-37-protected-baseline.test.ts` — 7/7 passed.
- `pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --write` — deterministic identical capture succeeded.
- `pnpm exec tsx scripts/capture-v1-37-protected-baseline.ts --check` — exact live primary-checkout verification succeeded.
- Focused ESLint for the script and tests — passed.
- Root `pnpm typecheck` — 25/25 Turbo tasks passed.
- Final direct main-checkout re-observation reproduced all four requested raw/diff SHA-256 values, both `0644` modes, both unstaged-only statuses, and both empty cached diffs after implementation.

## Issues Encountered

None.

## Next Phase Readiness

- Final executable-conformance evaluation can call `--check` and accept the known valid dirt while failing on any Phase-259 change.
- The baseline artifact is deterministic across unrelated HEAD advancement because protected HEAD blobs, not the global commit, are bound.
- No protected path requires cleanup, staging, restoration, or normalization before subsequent waves.

## Self-Check: PASSED

- The script, tests, and artifact exist.
- Both implementation commits exist.
- Exact focused tests, CLI write/check, lint, and root typecheck pass.
- The protected main checkout remains byte-for-byte, mode-for-mode, diff-for-diff, and status-for-status unchanged.
