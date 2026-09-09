---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "189"
subsystem: hostile-runtime
tags: [docker, exact-absence, custody, preflight, lean-admit-03]
requires:
  - phase: 262-188
    provides: immutable preflight-v6 refusal, seven-category review, and bounded diagnosis
provides:
  - byte-exact historical and Docker 29.4 absence recognition
  - separately committed source-only v8 custody and effect family
affects: [262-190, 262-175, phase-262-closure]
tech-stack:
  added: []
  patterns: [exact byte-tuple disjunction, pass-only authorization, immutable refusal lineage]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-189-SUMMARY.md
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-container-match-session.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
key-decisions:
  - "Recognize only the historical canonical absent-container tuple and the directly observed Docker 29.4 tuple; reject every near miss without normalization."
  - "Bind the repair to a separately committed v8 source path while preserving Plan188 and all earlier non-pass evidence as immutable, non-authorizing history."
requirements-completed: []
metrics:
  duration: 12m
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 189: Exact Docker Absence Repair and v8 Custody Summary

The container session now recognizes exactly the two proven absent-object byte tuples, and a fresh source-only v8 custody path authenticates the separately committed repair without running Docker, a preflight, or a Match.

## Performance

- **Tasks:** 2/2
- **Focused tests:** 75 passed, 25 historical skips
- **Successor locks:** 36 preserved
- **Docker / preflight / Match invocations:** 0 / 0 / 0

## Accomplishments

- Added RED/GREEN coverage proving the historical tuple remains accepted at session-open and post-remove cleanup.
- Added RED/GREEN coverage for Docker 29.4's exact status-1, null-signal, no-transport-error response: stdout is exactly one line-feed byte and stderr is exactly lowercase `error: no such object: <exact-name>\n`.
- Rejected wrong status, signal, transport error, stdout length/content, case, target, prefix, suffix, missing newline, extra newline, and extra stderr bytes.
- Reserved unique preflight-v7, authorization-v8, review-v8, invocation-v8, terminal-v8, adjudication-v8, and eligibility-v8 paths.
- Added source custody that verifies the exact two-tuple predicate and tests, exact tracked runnable bytes, the 29-path executable closure, immutable Plan188 preflight/review/diagnosis roots, 36 locks, absent fresh destinations, and false authority.
- Added strict preflight, authorization, seven-category review, invocation, terminal, adjudication, and eligibility validators for the fresh family without writing any operational artifact.

## Exact Source Identity

- **Runnable commit:** `d0193911dc4612f77d5ea56e20aada4289fd5a53`
- **Runnable tree:** `7a6fe2cb2ca8f53885ba2f4bda677ba4021ae10a`
- **Executable closure:** 29 paths
- **Executable closure root:** `sha256:e66b213548df095a62c4fbf642a999c88cdd4c08ba44e6cedc52cdc2c5781c6f`

## Task Commits

1. **Task 1 RED:** `9377ec58` — exact Docker 29.4 and near-miss session tests
2. **Task 1 GREEN:** `d90d197d` — narrow two-tuple absence predicate
3. **Task 2 RED:** `671f9f00` — fresh v8 paths, entry points, and exact-source requirements
4. **Task 2 GREEN:** `d0193911` — v8 custody, validators, writers, selectors, and immutable-history checks

## Verification

- `pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts scripts/check-v1-38-lean-admission.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1`
- `pnpm exec tsc --noEmit --pretty false`
- `node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-exact-absence-source-only-v8`
- `git diff --check`
- Exactly 36 `.v138-successor-*.lock` files remain.
- Every v8 operational destination remains absent.

## Deviations from Plan

None - the plan was executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The change narrows an existing ownership decision to two proven exact byte tuples and adds no network endpoint, authentication path, persistence schema, gameplay rule, or public surface.

## Next Phase Readiness

Plan190 may run exactly one fresh non-consuming preflight-v7 over the runnable commit above. It may create authorization-v8 only on exact pass and must still invoke zero Matches. Plan175 remains denied until preflight-v7 passes and an independent exactly-seven-category review-v8 records zero blockers.

## Self-Check: PASSED

All four task commits and all listed files exist. The focused suite and TypeScript pass, source-only v8 checking authenticates the exact runnable commit/tree/closure, no v8 artifact exists, no Docker/preflight/Match selector ran, and all 36 locks remain preserved.
