---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "138"
subsystem: custody-validation
tags: [tdd, native-custody, deterministic-roots, privacy, source-only]
requires:
  - Plan136 committed review 9e82ea12 with CR-01 genuine-to-stable mapping failure
provides:
  - exact two-C-file identity authentication at live subject 3882cd5d
  - six-record mode/ordinal genuine-to-stable custody bijection
  - Plan139-only review eligibility without publication or execution authority
affects: [262-139]
tech-stack:
  added: []
  patterns: [transient genuine-root verification, stable identity mapping, domain-separated v8 roots]
key-files:
  created:
    - scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts
    - scripts/check-v1-38-plan-262-138-live-v13-custody-v8.test.ts
  modified: []
key-decisions:
  - "Plan136 remains immutable process_invalid_genuine_to_stable_native_mapping history and Plan137 remains unexecuted and ineligible."
  - "Path-dependent genuine roots are verified on every fresh run but discarded before durable evidence; stable roots bind exact authenticated repository-relative C identity tuples."
  - "Only independent Plan139 review may continue; Plan110 and every effect path remain false."
metrics:
  duration: 33m
  completed: 2026-08-31
status: complete
---

# Phase 262 Plan 138: Genuine-to-Stable Native Custody v8 Summary

Exact authentication of the two C files actually measured by every genuine Plan133 observation now anchors a deterministic six-record custody mapping without serializing host paths or granting execution authority.

## Performance

- **Duration:** 33m
- **Completed:** 2026-08-31
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Authenticated the live subject `3882cd5d3ec7a834e1de88254dd0daf955da12aa`, exact Git mode, blob identity, historical bytes, current no-follow bytes, Git blob digest, SHA-256 digest, and no-later-rewrite state for both measured C files on every supplied-root call.
- Reran all six genuine Plan133 observations without caching, validated canonical mode/status/ordinal, exact disposable path suffix/order, path-dependent native root, original v5 observation root, reduced value, and zero producer/effect state before normalization.
- Constructed a strict bijection across six unique mode/ordinal records, each bound to the same ordered stable C identity set and a new domain-separated v8 mapping root.
- Derived stable Git-object, native-source, execution, observation, aggregate, prospective payload, and carrier roots only after the genuine observation and exact C identities were authenticated.
- Rejected ordered-entry swaps, deletion, duplication, Plan132 path/blob substitution, wrong mode, wrong digest, forged genuine-custody domain, mapping-root, execution-root, observation-root, observations-root, authority, and fully repaired payload/carrier attacks.
- Proved fresh same-process supplied-root checks and byte-identical privacy-safe evidence from independent fresh processes over distinct cloned roots.
- Preserved every Plan136/137 byte and created no v8 trio, readiness, live, producer, capacity, retry, terminal, reproduction-v17, Route-11, or downstream artifact.

## Task Commits

1. **Task 1 RED: genuine native mapping regressions** — `3fe3aa204f429f2a192bc9ca70ffcdf48ee2ab14`
2. **Task 2 GREEN: exact native custody mapping v8** — `d17c5af0b0484eda7c37299b38d03e3182598d00`

## Exact Source Custody

- **GREEN commit:** `d17c5af0b0484eda7c37299b38d03e3182598d00`
- **Tree:** `94ffe78d0bf0ee9f897d9f68d610ba8b14ddedfc`
- **Parent:** `3fe3aa204f429f2a192bc9ca70ffcdf48ee2ab14`
- **Source blob:** `fed8abafba2d05bbdb52bc81d6c176ed084dac9a`
- **Source SHA-256:** `sha256:12c276eb13a73312c36c5cf237e1e91a5c0b080e1482a21bd6a9fc38c812c7c8`
- **Test blob:** `f33d96991c246b8c9d41645a19d9692e1b921a9c`
- **Test SHA-256:** `sha256:250063b4c0e445c517bff3a3ecf826e551d237c7edae1acee5130c017db2a80b`

## Exact Measured Native Identities

1. `scripts/native/v1-38-successor-transaction-helper-v6.c`
   - mode `100644`
   - blob `ca694310a8a99c30d7a4070a415b968d3e341409`
   - SHA-256 `sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a`
2. `scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c`
   - mode `100644`
   - blob `99da3517ccb8b919759663daf713b4f20337b8b1`
   - SHA-256 `sha256:fef25dc7eab2cb372e6cd7549adb8836ab466340bd8a18b5eb748de906aefcea`

## Immutable Review Custody

- **Plan136 review commit:** `9e82ea12af8e63fce5172e5e77ff15c68648ad11`
- **Review blob:** `9cea509302dade7b32dd7f13783971844c7f5680`
- **Review SHA-256:** `sha256:c618bb1dde223a32911f49342343d7fc8caf2de4a363f14c03d977801aaf13b5`
- **Disposition:** `process_invalid_genuine_to_stable_native_mapping`
- **Plan137 eligibility:** false
- **Plan110 eligibility:** false

## Verification

- RED failed because the v8 implementation module was absent.
- Focused serialized Vitest passed: 1 file, 4 tests in 544.34 seconds.
- Source-only CLI passed with Plan139 eligible, Plan137 and Plan110 ineligible, required accepted 540, all invocation/fresh counters zero, all authorities false, and downstream authority denied.
- TypeScript `pnpm exec tsc --noEmit --pretty false` passed.
- Two fresh processes over distinct cloned roots emitted byte-identical stable mapping, observation, observations, payload, and carrier roots.
- `git diff --check`, privacy scans, protected-history checks, and effect-absence checks passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed path-dependent genuine roots from durable mapping bytes**
- **Found during:** Task 2 first full hostile suite
- **Issue:** Persisting the verified Plan133 native and observation roots made durable evidence vary because those genuine roots intentionally include transient absolute disposable paths.
- **Fix:** Continue recomputing and comparing both genuine roots before normalization, then discard them and bind the durable mapping to the exact verification domain, canonical mode/ordinal, and authenticated ordered C identity tuples.
- **Files modified:** `scripts/check-v1-38-plan-262-138-live-v13-custody-v8.ts`, `scripts/check-v1-38-plan-262-138-live-v13-custody-v8.test.ts`
- **Commit:** `d17c5af0`

## Known Stubs

None.

## Threat Flags

None. The source is read-only custody verification and creates no network, runtime, public, production, or effect surface.

## Next Phase Readiness

Only `262-139-PLAN.md` may independently review this exact source/test/summary custody. No v8 publication or Plan110/effect authority exists.

## Self-Check: PASSED

- RED and GREEN commits exist with the recorded exact tree, parent, blobs, and SHA-256 values.
- Both C tuples match the live subject and current checkout without later rewrites.
- Plan136 source/test/summary/tracking/review and all earlier bytes remain unchanged.
- No Plan139 trio, producer, live, readiness, retry, capacity, or effect destination was created.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-31*
