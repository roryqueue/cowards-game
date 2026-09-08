---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "177"
subsystem: admission-runtime-containment
tags: [container-subprocess, digest-pinning, preflight, git-custody, tdd]
requires:
  - phase: 262-174
    provides: denied direct authorization and two independently identified result-validity findings
provides:
  - Digest-pinned container-only Starter and Advanced fixture revisions
  - Non-consuming Docker, image, harness, isolation-control, and throughput preflight before marker creation
  - Explicit runnable Git source custody and additive direct authorization v2 trust path
affects: [262-178, 262-179, ADMIT-03]
tech-stack:
  added: []
  patterns: [container-only hostile execution, pre-marker measured feasibility, explicit Git object custody]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-177-SUMMARY.md
  modified:
    - scripts/run-v1-38-lean-runner-feasibility.ts
    - scripts/run-v1-38-lean-runner-feasibility.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
key-decisions:
  - "The lean gate now has one runtime choice: container-subprocess with the exact node:24-alpine digest and no fallback."
  - "Readiness is non-consuming and must prove both fixture methods plus conservative 20/240 per-entrant throughput under the unchanged 45-second cell and 15-minute run limits before marker creation."
  - "Direct authorization v2 requires an explicit separately committed runnable source OID; HEAD, documentation-only commits, stale closures, and dirty tracked bytes are rejected."
metrics:
  duration: 28min
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 177: Container Boundary and Explicit Source Custody Summary

**The lean ADMIT-03 path now rebuilds both fixed fixtures for a digest-pinned hostile container and refuses to consume its one shot until exact source custody and measured runtime feasibility pass.**

## Accomplishments

- Rebuilt `starter:aggro-chaser` and `advanced:vanguard-pressure` with `runtime-js-container-subprocess`, deterministic transpiled artifacts, matching fixture provider validation, preserved system Strategy identities, and preserved Starter/Advanced lineage.
- Selected only `container-subprocess` with `node:24-alpine@sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14`; the existing no-network, read-only-root, tmpfs, memory, CPU, PID, capability, no-new-privileges, minimal-environment, shell-disabled, stream-limit, and timeout controls remain bound.
- Added a non-consuming preflight that checks a Docker 29.4.0-compatible server, the exact locally present RepoDigest without pulling, both fixture methods through the actual container adapter, safe aggregate latency evidence, and conservative cell/run projections before the marker can exist.
- Added an additive v2 trust path for preflight, direct authorization, independent review, reviewed-ready, invocation, terminal, adjudication, and final eligibility checks while leaving the denied v1 authorization and review byte-identical.
- Required authorization v2 to receive an explicit runnable commit OID and derive its tree and recursive executable closure from raw Git objects. Current `HEAD`, documentation-only commits, non-ancestors, stale closures, and dirty tracked bytes fail closed.

## Runnable Source Custody

- **Commit:** `a734dc36794e5de2d64a99793b3e075e0df33148`
- **Tree:** `c09ccacfda174609ac36ea348055c98be8090fa4`
- **Executable closure root:** `sha256:53cc9f23c709b99a642d58337c42a2047cf36d8d8bc4efc54fb3b3264c6fb58f`
- **Denied v1 authorization root:** `sha256:3c546e446e8f5fb9f062676d88ebf18b58ccf2070c6d9faa636fe8312634c04c`
- **Denied v1 review root:** `sha256:8c0b81a777ec5b5513a4afbf582906f7d19a12e8102b1e1688d12e39f453d073`

## Task Commits

1. `7fdf985b` — TDD RED for the container boundary and pre-marker feasibility contract.
2. `2c13e409` — Container fixture rebuild, exact runtime selection, preflight evaluator, and ordered gate.
3. `7da8d6b7` — TDD RED for explicit v2 source custody and historical preservation.
4. `91fcb686` — Additive v2 preflight, authorization, review, and downstream trust-path checks.
5. `bc981963` — Preserve denied v1 roots without reinterpreting them against current source.
6. `a734dc36` — Verify recursive Git tree identities without attempting filesystem hashing of directories.

## Verification

- `pnpm exec vitest run scripts/check-v1-38-lean-admission.test.ts scripts/run-v1-38-lean-runner-feasibility.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1` — 60 passed, 25 historical-path tests skipped.
- `pnpm exec tsc --noEmit --pretty false` — passed.
- `node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-container-source-only-v2` — passed with zero live invocations and exhaustive false authority.
- Exactly 36 authenticated successor lock files remain; `git diff --check` passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed a full-Match unit test from the container-bound source-only plan**
- **Found during:** Task 1 GREEN verification
- **Issue:** The legacy worker-thread test executed an entire Match. Switching it to one container per method made the source-only suite slow and contradicted the new non-consuming preflight boundary.
- **Fix:** Replaced it with source/request assertions proving both prepared revisions and runtime-service configuration select the container-only path. Actual method execution remains exclusively in the non-consuming preflight.
- **Files modified:** `scripts/run-v1-38-lean-runner-feasibility.test.ts`
- **Commit:** `2c13e409`

**2. [Rule 1 - Bug] Preserved historical v1 without validating it against replacement source**
- **Found during:** Task 2 source-only verification
- **Issue:** Re-running the old v1 authorization renderer against new source would falsely treat immutable historical bytes as drift.
- **Fix:** Authenticate the exact frozen v1 roots and denied two-finding disposition without relabeling or reconstructing them.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Commit:** `bc981963`

**3. [Rule 1 - Bug] Compared recursive directory tree objects correctly**
- **Found during:** Task 2 source-only verification
- **Issue:** `git hash-object` cannot hash working-tree directories, while the closure intentionally includes recursive directory tree objects.
- **Fix:** Require a clean tracked tree, then compare each source commit object ID with the corresponding current `HEAD` blob or tree object ID.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Commit:** `a734dc36`

## Known Stubs

None.

## Threat Flags

None. The plan adds no network endpoint, public surface, persistence path, or Match authority. Docker is used only by the future explicit preflight and receives no host path, environment dump, or raw diagnostic output.

## Effects and Authority

No container preflight artifact, v2 authorization, v2 review, Match, invocation marker, terminal, adjudication, eligibility, formation, holdout, public, product, production, archive, or tag effect was created. All broader authority remains false.

## Next Phase Readiness

Plan 262-178 can run the one non-consuming container preflight over the exact runnable commit above, commit that safe aggregate evidence, write authorization v2 against the same source identity, and obtain a fresh independent review. It must stop without marker or Match if Docker, local image identity, either fixture method, isolation controls, or projected throughput fails.

## Self-Check: PASSED

All six source/test commits resolve; the four intended source/test files exist; the summary exists; the exact runnable commit/tree/closure are derivable; all focused tests, TypeScript, source-only custody, lock-count, and diff checks pass; and every v2 effect destination remains absent.
