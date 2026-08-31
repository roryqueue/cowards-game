---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "136"
subsystem: custody-validation
tags: [tdd, per-call-authentication, deterministic-roots, privacy, source-only]
requires:
  - Plan134 review f66ca641 with two critical source-only custody findings
provides:
  - fresh supplied-root authentication on every exported validation call
  - cross-process stable root-relative six-mode observation evidence
  - Plan137-only review eligibility without publication or execution authority
affects: [262-137]
tech-stack:
  added: []
  patterns: [fresh per-call Git custody, normalized relative evidence, domain-separated stable roots]
key-files:
  created:
    - scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts
    - scripts/check-v1-38-plan-262-136-live-v13-custody-v7.test.ts
  modified: []
key-decisions:
  - "Plan134 v6 remains immutable process_invalid_cross_root_cache_and_absolute_path_evidence history; Plan135 remains ineligible."
  - "No authority-path cache is permitted: each public validation resolves and authenticates its supplied root and reruns all six genuine observations."
  - "Publication-facing disposable roots derive from authenticated stable identities and normalized repository-relative paths, never host checkout layout."
metrics:
  duration: 32m
  completed: 2026-08-31
status: complete
---

# Phase 262 Plan 136: Deterministic Per-Root Custody v7 Summary

Fresh per-call root authentication and domain-separated root-relative observation evidence eliminate both Plan134 critical findings while preserving all failed history and every execution authority at zero.

## Performance

- **Duration:** 32m
- **Completed:** 2026-08-31
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Removed the process-global evidence cache and made every builder, authenticator, batch validator, and source-only check resolve and authenticate the supplied real repository root before success.
- Reauthenticated the exact protected v5 chain and the Plan134 source, test, summary, tracking, and review `f66ca641` custody on every call, including current-byte and forbidden-destination checks.
- Required a fresh genuine six-mode disposable observation run per exported validation call before producing any v7 result.
- Replaced absolute temporary paths with the strict fixed namespace `custody/native-sources/{source,test}.ts`; absolute, file-URL, drive, UNC, traversal, empty, dot, and backslash forms fail closed.
- Derived Git-object, native-source, execution-closure, observation, aggregate, payload, and carrier roots from domain-separated stable authenticated identities rather than temporary checkout layout.
- Proved same-process invalid-root, cross-root, protected-byte drift, and post-prime effect-path rejection; independently reproduced byte-identical evidence in two fresh processes using distinct temporary roots.
- Retained exhaustive exact-schema, primitive, counter, authority, observation, stable-root, cross-link, and authenticated-stored-return mutation rejection without any readiness, live, producer, retry, capacity, or downstream effect.

## Task Commits

1. **Task 1 RED: deterministic custody regressions** — `3aafd6ebed361f6de0822b5da1939ef83c303096`
2. **Task 2 GREEN: per-root deterministic v7 custody** — `5bbc3dd3c126ab03b69eb5efea1e17d1404b97c5`

## Exact Source Custody

- **GREEN commit:** `5bbc3dd3c126ab03b69eb5efea1e17d1404b97c5`
- **Tree:** `160c38514b8d0ec7cd7ec303415d05146b8a1ad1`
- **Parent:** `3aafd6ebed361f6de0822b5da1939ef83c303096`
- **Source blob:** `012ae30b5090c42b247e43ac915681d26fd72861`
- **Source SHA-256:** `sha256:fc5ca46fb81f1d4d54353480bc676096c353100ab39215988ce0859b646783c5`
- **Test blob:** `10d324797be6d8fa55ac1362e5c0bfbfa8aba330`
- **Test SHA-256:** `sha256:2b91624502d3150a1c85f141651c67871b312d3c11888e979588a142067d3575`

## Immutable Review Custody

- **Plan134 review commit:** `f66ca6417412026e5b75d5af5bae13391e5fbbca`
- **Review blob:** `1334017d5e9b1cbbcac31fa854f34c98304f32a1`
- **Review SHA-256:** `sha256:68a8cdf39b90771136730d1147b56f191878d6cfa802e8da1a16346425744285`
- **Disposition:** `process_invalid_cross_root_cache_and_absolute_path_evidence`
- **Plan135 eligibility:** false
- **Plan110 eligibility:** false

## Verification

- RED failed on the intentionally absent v7 source before GREEN.
- Focused serialized Vitest passed: 1 file, 5 tests in 676.00 seconds.
- Two independent fresh Node processes using distinct cloned roots emitted byte-identical full prospective evidence, observation roots, observations root, payload root, payload SHA, and carrier root.
- TypeScript `pnpm exec tsc --noEmit --pretty false` passed.
- Source-only CLI passed with Plan137 eligible, Plan110 ineligible, all authority false, all invocation/fresh counters zero, required accepted 540, and downstream authority denied.
- Static host-path scan, `git diff --check`, exact protected-history checks, and effect-destination absence checks passed.
- No v7 payload, review, carrier, readiness, live, producer, capacity, retry, terminal, reproduction-v17, Route-11, or downstream artifact exists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Normalized host-derived disposable roots as well as path strings**
- **Found during:** Task 2 fresh-process equality verification
- **Issue:** After literal paths were normalized, disposable Git-object, native-source, and execution-closure roots still depended on clone layout and temporary guard paths.
- **Fix:** Derived every publication-facing disposable root from stable authenticated subject, mode, reduced-value, and normalized-path identities while retaining the genuine underlying observation gate.
- **Files modified:** `scripts/check-v1-38-plan-262-136-live-v13-custody-v7.ts`, `scripts/check-v1-38-plan-262-136-live-v13-custody-v7.test.ts`
- **Commit:** `5bbc3dd3`

**2. [Rule 3 - Blocking] Completed independent clone dependency fixtures**
- **Found during:** Task 2 cross-root verification
- **Issue:** Independent clones lacked pnpm workspace package-level `node_modules` links, so genuine disposable modes failed before reaching custody assertions.
- **Fix:** Test-only clone setup links the existing pinned root/package dependency closures; production source remains unchanged.
- **Files modified:** `scripts/check-v1-38-plan-262-136-live-v13-custody-v7.test.ts`
- **Commit:** `5bbc3dd3`

## Known Stubs

None.

## Threat Flags

None. The new code is read-only source verification and creates no network, runtime, production, or effect surface.

## Next Phase Readiness

Only `262-137-PLAN.md` may independently review the exact Plan136 source/test custody. Plan110 and all effect paths remain ineligible until Plan137 returns literal zero and separately publishes its exact additive trio.

## Self-Check: PASSED

- RED and GREEN commits exist with the recorded exact tree, parent, blobs, and SHA-256 values.
- Plan134 source/test/summary/tracking/review and all earlier bytes remain unchanged.
- The source-only CLI authenticates from the later source commit and returns no authority.
- No Plan137 trio or producer/live/effect destination was created.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-31*
