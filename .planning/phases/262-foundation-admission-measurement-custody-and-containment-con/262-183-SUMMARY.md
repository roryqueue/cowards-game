---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "183"
subsystem: lean-runner-admission
tags: [docker, image-identity, cleanup, containment, custody]
requires:
  - 262-182 immutable zero-Match refusal and two result-validity findings
provides:
  - exact repository-plus-digest Docker identity normalization
  - ownership-labeled deterministic container lifecycle cleanup
  - collision-free v5 trust and effect paths
affects:
  - 262-184 may perform one fresh non-consuming preflight
tech-stack:
  added: []
  patterns: [tag-preserving digest normalization, ownership-aware cleanup-by-name, source-only custody]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-183-SUMMARY.md
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-container-match-session.test.ts
    - scripts/run-v1-38-lean-runner-feasibility.ts
    - scripts/run-v1-38-lean-runner-feasibility.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
decisions:
  - Docker RepoDigest comparison removes only the final path component's tag and still requires exact repository plus full lowercase SHA-256 equality.
  - Ambiguous creation removes a container only after its exact immutable ownership label is confirmed; foreign collisions are retained and fail closed.
  - Plan182 remains immutable refusal history while the live selector and future effects move to the fresh v5 family.
metrics:
  duration: 16 min
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 183: Final Container Preflight Repairs Summary

**The frozen tag-bearing image now matches Docker's canonical tagless RepoDigest only by exact repository and digest, while every container lifecycle is caller-named, ownership-labeled, and cleanup-safe before the final non-consuming preflight.**

## Performance

- **Duration:** 16 min
- **Tasks:** 2 TDD tasks
- **Focused tests:** 78 passed, 25 historical skipped
- **Corrective Match invocations:** 0

## Accomplishments

- Added a strict pure parser/comparator that accepts `node:24-alpine@sha256:...` and Docker's corresponding `node@sha256:...` as the same identity without admitting digest-only values, floating tags, other repositories, malformed digests, or substring matches.
- Kept `LEAN_CONTAINER_IMAGE` byte-identical as the only Docker invocation and inspection reference.
- Added deterministic names and immutable ownership labels before `docker create`; start, exec, close, and poison paths use the verified name instead of trusting create output.
- Added bounded pre-create absence checks, ownership inspection, matching-only force removal, and post-removal absence confirmation. Pre-existing and raced foreign collisions are never deleted or reused.
- Reserved fresh preflight-v4, authorization/review-v5, and invocation/terminal/adjudication/eligibility-v5 destinations with exact-source and immutable-history checks.
- Rewired the dormant direct selector to v5 readiness and effect paths without invoking it.

## Task Commits

1. **RED: image representation and ambiguous-create ownership gates** — `43f254b9`
2. **GREEN: exact identity, ownership-safe cleanup, and v5 custody** — `daae3aaa`
3. **Coverage: bind the complete fresh v5 admission surface** — `2e746e9b`

## Exact Runnable Custody

- Source commit: `2e746e9b84c0f35b1d5507187bf1d423cf0872d1`
- Source tree: `4bea6709f7525f67913c0b3e9a9f1e79bb10759a`
- Executable closure: `sha256:4d778bfb78344dc8fb04b3f38ae0a2aca72020cd7bdddde74f8a4e54fd63513a`
- Source-only v5 check: pass
- Successor locks: exactly 36

## Verification

- `pnpm exec vitest run scripts/check-v1-38-lean-admission.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/run-v1-38-lean-runner-feasibility.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1` — 78 passed, 25 skipped.
- `pnpm exec tsc --noEmit --pretty false` — passed.
- `node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-container-session-source-only-v5` — passed with zero live invocations and all authority false.
- Lock count and `git diff --check` — passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical containment] Protected foreign containers during a post-precheck name collision**

- **Found during:** Task 2 plan review
- **Issue:** Unconditional cleanup-by-name after ambiguous create could delete a foreign container that won a name-collision race.
- **Fix:** Added an immutable caller-provided ownership label, inspect-before-remove, matching-only removal, and foreign-occupant retention.
- **Files modified:** `scripts/lib/v1-38-lean-container-match-session.ts`, `scripts/lib/v1-38-lean-container-match-session.test.ts`, `scripts/run-v1-38-lean-runner-feasibility.ts`
- **Commit:** `daae3aaa`

## Known Stubs

None.

## Threat Flags

None. This plan strengthens an existing private Docker execution boundary and adds no network endpoint, public surface, authentication path, persistence schema, or production deployment.

## Next Phase Readiness

Plan184 may now run exactly one fresh non-consuming preflight over these committed bytes and conditionally publish authorization plus one seven-category review. No Docker preflight, operational artifact, marker, Match, terminal, eligibility, tracking, archive, or tag effect occurred in Plan183.

## Self-Check: PASSED

- All six runnable source/test files and this summary exist.
- RED, GREEN, and v5 coverage commits exist.
- Exact source-only v5 custody passes over the recorded source commit.
- Plan182 refusal artifacts remain unchanged and all v5 operational destinations are absent.
- Exactly 36 successor locks remain.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-09-08*
