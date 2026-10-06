---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
kind: source_only_existing_plan_repair
subsystem: runtime
tags: [startup, handshake, digest, regression, source-only]
status: complete
completed: 2026-10-06
duration: not instrumented
requires:
  - phase: 265
    provides: Diagnosed immutable v7 producer/broker domain contradiction and passed plan-check-v2
provides:
  - Version-7 host request roots use the generated version-7 broker domain
  - Connected real-producer v5/v6/v7 regression through synthetic OS boundaries
affects: [265-source-review, 265-source-validation, 265-source-verification]
tech-stack:
  added: []
  patterns: [deny-by-default OS interception, generated trusted binding-guard execution]
key-files:
  created:
    - .planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HANDSHAKE-REPAIR-SUMMARY-v1.md
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/run-v1-38-lean-host-stage-v7.test.ts
key-decisions:
  - Preserve production authority injection refusal and correct only the host digest version selection
  - Source readiness is not permission for another empirical envelope
requirements-completed: []
empirical-credit: false
phase-complete: false
source-commit: 5077e3ac1246b4785f7ce60fbbb66b6aea86314d
source-root: sha256:eaa793b2608a5a586a94f319b4cff7efe6575abba4dff80080817cf9ba92ba1c
manifest-entries: 888
---

# Phase 265 Plan 16: Source-Only Handshake Repair Summary

The real version-7 startup frame now hashes the same payload/ordinal domain required by its generated broker; v5 and v6 remain unchanged.

## Accomplishments

- Corrected exactly one production line: startup request-root selection explicitly chooses v7 for a version-7 descriptor, v6 for version 6, and v5 otherwise.
- Extended the existing manifest-bound v7 fixture to issue real v5/v6/v7 runtime authorities and claim factory/planner/session layers. It uses the ordinary default transport, default stream factory and real frame producer, with narrowly enabled fake `spawnSync` and fake shared-buffer stream `Worker` surfaces. Other subprocess APIs and unconfigured Worker/control calls remain denied.
- Each version tests two identical payloads at ordinals 1 and 2, exact generated broker branch selection, emitted version-domain digest equality, and generated broker binding-guard acceptance/rejection of both other version domains. Authority plus either injected transport or streamFactory still rejects before construction.

## Atomic Task Commits and TDD Evidence

One task, two atomic commits:

1. RED `ecd7f16f`: `test(265-16): reproduce v7 startup request digest mismatch`.
2. GREEN `5077e3ac1246b4785f7ce60fbbb66b6aea86314d`: `fix(265-16): align v7 startup request digest with broker`.

Exact focused command for both RED and GREEN:

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts --maxWorkers=1 -t 'connected startup request digest handshake'
```

RED at 2026-10-06 10:21:28 America/New_York: exit 1, 1 failed (v7), 2 passed (v5/v6), 29 skipped; duration 8.88s. Real frame expected `sha256:f252ccc73d1315dea4aca5000655ccb5411e334abd3d1803202db94e09916856`, received the wrong-domain `sha256:5466bfd8e431447d5c6f700bd905c910a5e63f0c9e62655bd238d61e4b3c66e2`. The assertion stack reaches the real session `runMethod`, default stream transaction and fake OS Worker `postMessage`.

GREEN at 10:23:07: exit 0, 3 passed, 29 skipped; duration 8.91s.

Regression command:

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v7.test.ts --maxWorkers=1
node node_modules/typescript/bin/tsc --noEmit -p packages/strategy-lab/tsconfig.json
git diff --check
```

Full existing v7 suite: exit 0, 32/32 passed, duration 31.23s. Strict strategy-lab noEmit and diff check: exit 0. No whole-repository or broad runtime suite claim.

## Full Live Source Binding

Recomputed `leanCorrectionSourceManifest("v7")` from current raw bytes: 888 entries, new root `sha256:eaa793b2608a5a586a94f319b4cff7efe6575abba4dff80080817cf9ba92ba1c`.

Changed manifest entries:

| Path | Current raw-byte root |
| --- | --- |
| scripts/lib/v1-38-lean-container-match-session.ts | sha256:adeead2b13cf87a35706405cd351abebc91788e09a2894bc5df22ab7b40bc0ce |
| scripts/run-v1-38-lean-host-stage-v7.test.ts | sha256:0aa4444b50913725c72b78f535f98aefac69b1ad03fba6768648df449f8899e1 |

No new standalone fixture or supplemental inventory entry was introduced. The old consumed source root `sha256:0e15d33f3533e826a7cb8b14b8294609ce3dec8848604f912072d61e8334b8e4` and source commit `15a2adbdfda547b4b1cdc2a49afc0e63cef57873` remain immutable historical identities, not relabeled as repaired source.

## Fixture Limits and Issues Encountered

The inherited tiny isolated synthetic store, cold-reuse seam, fixture metadata, clock, source/admission construction and fabricated completion response are regression scaffolding, not empirical admission or successful native execution. The test executes only the generated trusted pre-supervisor binding guard using `new Function`, sliced before `superviseLeanStartupV5`; broker imports, guest source, supervisor and native Workers are never executed. This is not a security sandbox claim. The rest of broker execution and actual cleanup outcomes remain unobserved.

Initial fixture-development runs failed before the target assertion because version-specific predecessor counts and the revision's executable artifact bytes were not supplied. Those synthetic inputs were corrected before the retained RED commit. No production adjustment resulted.

No known production stub was introduced. Empty activation orders and null StrategyMemory are intentional fake responses in the test, not unconnected production data. No TODO/FIXME/placeholder marker was found in either changed file. No new security-relevant endpoint, authority path, schema or file-access surface was introduced by the one-line production change.

## Deviations from Plan

None in implementation scope. Per the explicit source-only assignment, STATE.md, ROADMAP.md and REQUIREMENTS.md were not changed and LEAG-02 was not marked complete. The metadata commit contains only this assigned new summary.

## Preserved Boundaries and Next Gate

Startup 2500ms, guest 1000ms, absolute host 5000ms, Match 600000ms and cleanup 2000ms remain unchanged, as do all old authority/constants/policy/allocation/result/journal/request/reader/cleanup semantics. No private historical payload, actual Strategy execution, native Worker, Docker, child process, Match, ordinary retained reader or new empirical route was invoked. Existing 29 spent charges and the ended v7 one-plus-conditional-one envelope remain unchanged; baseline stays denied. No refund/recredit, accepted-check, freeze/formation/holdout/public/counted/production or requirement completion credit is created.

At observed `nowMs=1791296610414`, carried time was `41943494 + nowMs - 1791290048578 = 48505330ms`, below the prospective 57600000ms cap. Carry continues without resetting or excluding source/review/admin gaps under the same 15GB/300 bounds; this is a timestamped observation, not a frozen later total.

Next: independent source review, scoped validation and source verification owned by the parent. Any future empirical envelope requires a genuinely new prospective human decision.

## Self-Check: PASSED

Both assigned source files and this new summary exist. Both RED and GREEN commits resolve as commit objects. Committed source diff from `00a5beda` contains only the two assigned source/test paths; diff check passes. Neither task commit deleted a tracked file.
