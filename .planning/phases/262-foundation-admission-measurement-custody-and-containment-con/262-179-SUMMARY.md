---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "179"
subsystem: lean-admission
tags: [tdd, soldier-brain, container-preflight, custody, fail-closed]
requires:
  - 262-178
provides:
  - schema-valid SoldierBrain preflight awareness cells
  - collision-free v3 direct preflight and review trust path
  - source-only proof with no operational effects
affects:
  - 262-180
tech-stack:
  added: []
  patterns: [exact Git closure custody, additive immutable history, pass-only authorization]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-179-SUMMARY.md
  modified:
    - scripts/run-v1-38-lean-runner-feasibility.ts
    - scripts/run-v1-38-lean-runner-feasibility.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
decisions:
  - Preserve Plan 178's occupied v2 review filename as authenticated immutable history and use entirely fresh v3 destinations.
  - Represent a refused fresh preflight with one aggregate reason code while permitting authorization only from exact pass evidence.
metrics:
  duration: 16m
  completed: 2026-09-08
status: complete
---

# Phase 262 Plan 179: Lean SoldierBrain Preflight Repair Summary

The corrected preflight now derives all 25 absolute awareness coordinates from the unchanged probed Soldier position and relative offsets, while a fresh v3 trust family keeps the failed Plan 178 outcome immutable and leaves the one corrective Match opportunity unconsumed.

## Tasks Completed

| Task | Description | Commit |
|---|---|---|
| RED | Added failing coverage for missing absolute coordinates and the absent v3 trust family | `1432a2b9` |
| GREEN | Added schema-valid cells, v2 preflight outcome handling, v3 authorization/review/effect gates, and direct-runner wiring | `bcc8aa0b` |
| Fix | Corrected the source-only history check for Plan 178's occupied blocked-review path | `4261dcd0` |

## Runnable Source Custody

- Source commit: `4261dcd0998f81dbd822f1c435ff92d8d41483bb`
- Source tree: `6c97c1075aacb89f1da6688e275caeb007c68f97`
- Executable closure root: `sha256:a126ceda28183d64afd3fff950f55eea72ab8be6619262504855a063fede6462`
- Plan 178 preflight SHA-256 remains `f7a22597fd6661fdc4d060ae5c9447c2b33b3c63c685c3a93eec89f7cfd55953`.
- Plan 178 review SHA-256 remains `e2a8bc1071d9344db43d11df3aac3c01597967f7a278a191525a4ad763fe8acb`.

## Verification

- Focused Vitest: 62 passed, 25 historical recovery tests skipped.
- TypeScript: `pnpm exec tsc --noEmit --pretty false` passed.
- Source-only custody: `--check-direct-container-source-only-v3` passed with live invocation count zero and all authority false.
- Exactly 36 authenticated successor locks remain unchanged.
- Every fresh preflight-v2, authorization-v3, review-v3, invocation-v3, terminal-v3, adjudication-v3, and eligibility-v3 destination remains absent.
- No Docker preflight, Match, marker, authorization, review, or live selector was run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved the occupied Plan 178 v2 review path**

- **Found during:** Post-GREEN source-only verification
- **Issue:** The obsolete v2 path map aliases the already committed Plan 178 blocked review, so a blanket v2-absence check rejected authentic history.
- **Fix:** Authenticated the exact Plan 178 review bytes and excluded only that historical path from obsolete-effect absence checks.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`, `scripts/check-v1-38-lean-admission.test.ts`
- **Commit:** `4261dcd0`

**2. [Rule 2 - Missing critical functionality] Routed child admission through the v3 invocation**

- **Found during:** GREEN implementation
- **Issue:** Rewiring only the parent selector would leave the child unable to authenticate the fresh v3 marker.
- **Fix:** Added a v3-first child-admission branch bound to reviewed readiness and the exact capability root.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Commit:** `bcc8aa0b`

## Known Stubs

None.

## Threat Flags

None. The change adds no endpoint, authentication path, package, network access, or new trust-boundary data; it tightens the already planned local preflight and Git-custody boundary.

## Self-Check: PASSED

All five declared files exist, all three task commits resolve, the source-only checker passes, and no fresh operational artifact exists.
