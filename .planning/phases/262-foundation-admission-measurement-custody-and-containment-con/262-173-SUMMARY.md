---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "173"
subsystem: admission-security
tags: [direct-authorization, source-custody, no-recovery, fail-closed]
requires:
  - phase: 262-172
    provides: immutable five-finding certification history and the D-34L.1 replacement contract
provides:
  - Exact committed direct-launch source closure for Plan 174 review
  - One-marker no-recovery execution boundary with pre-effect rejection
  - Source-only proof with every authorization and empirical effect absent
affects: [262-174, 262-175, ADMIT-03]
tech-stack:
  added: []
  patterns: [exact Git-byte authorization, exclusive pre-Match marker, permanently consumed marker-only failure]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-173-SUMMARY.md
  modified:
    - scripts/run-v1-38-lean-runner-feasibility.ts
    - scripts/run-v1-38-lean-runner-feasibility.test.ts
    - scripts/check-v1-38-lean-admission.ts
    - scripts/check-v1-38-lean-admission.test.ts
key-decisions:
  - "The active direct launch accepts only an exact later authorization and zero-finding seven-category review over source commit c11e9173cc29149b16460944676a6c2b11829e9b."
  - "A marker-only interruption is permanently invalid: recovery, partial reuse, resume, and relaunch are unreachable."
  - "The reviewed-ready check rejects every pre-existing direct effect before launch preparation."
patterns-established:
  - "Freeze all runnable bytes before publishing authorization or independent review."
  - "Create the exclusive invocation marker before Match one and derive no evidence from partial work."
requirements-completed: []
coverage:
  - id: D1
    description: The direct authorization schema binds the exact source, five preserved findings, frozen 24-Match contract, one invocation, and exhaustive false authority.
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: scripts/check-v1-38-lean-admission.test.ts#renders an exact D-34L.1 direct authorization with five preserved findings
        status: pass
    human_judgment: false
  - id: D2
    description: The direct launcher has one active selector, writes an exclusive marker before Match one, and exposes no recovery path.
    requirement: MEAS-04
    verification:
      - kind: unit
        ref: scripts/run-v1-38-lean-runner-feasibility.test.ts#exposes one direct launch selector and retires recovery from active dispatch
        status: pass
      - kind: unit
        ref: scripts/run-v1-38-lean-runner-feasibility.test.ts#rejects direct child selection before executing any cell
        status: pass
    human_judgment: false
  - id: D3
    description: Exact committed source is clean apart from 36 authenticated successor locks and every direct authorization, review, and effect destination is absent.
    requirement: ADMIT-04
    verification:
      - kind: integration
        ref: node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-source-only
        status: pass
    human_judgment: false
duration: 14min
completed: 2026-09-08
status: complete
---

# Phase 262 Plan 173: Lean Direct Execution Closure Summary

**A compact exact-byte direct authorization boundary now permits one later reviewed 24-Match fixture run while making recovery, partial reuse, relaunch, and every broader authority unreachable.**

## Performance

- **Duration:** 14 minutes across resumed execution
- **Started:** 2026-09-08T14:43:07Z
- **Completed:** 2026-09-08T14:57:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added exact-key `v1.38-lean-runner-direct-authorization-v1` rendering and validation over immutable history, the five Plan 172 findings, frozen tuple and schedule, one unconsumed invocation, 36-lock inventory, fresh-effect absence, and exhaustive false authority.
- Reduced the active launch graph to one direct selector that authenticates committed bytes, creates an exclusive marker before Match one, executes exactly one complete serial run, and cannot recover or reuse marker-only work.
- Proved the exact committed source closure with 48 focused tests, TypeScript compilation, the direct source-only checker, clean tracked bytes, 36 preserved locks, and no authorization, review, Match, marker, terminal, adjudication, or eligibility effect.

## Task Commits

1. **Task 1 RED: Define direct authorization closure** — `3888e6cf`
2. **Task 1 GREEN: Implement direct no-recovery admission** — `b37d4e59`
3. **Task 1 correction: Reject pre-existing direct effects** — `c11e9173`

## Exact Runnable Source Closure

- **Commit:** `c11e9173cc29149b16460944676a6c2b11829e9b`
- **Tree:** `15edf9a9916403e72a7d30af55d2a0183c8990ca`
- **Executable blobs:**
  - `scripts/lib/v1-38-lean-runner-feasibility.ts`: `068dfab5e64fe08b915048cc29a3e778d41c0f9b`
  - `scripts/lib/v1-38-lean-runner-feasibility.test.ts`: `23033f0baa222f268005afacccc15ef4ed54ffb9`
  - `scripts/run-v1-38-lean-runner-feasibility.ts`: `642153c275cad8b3ef7cc92525c0c66604509e44`
  - `scripts/run-v1-38-lean-runner-feasibility.test.ts`: `91e810b6e2dd66fc506fe738d1667a7d3aebd1ed`
  - `scripts/check-v1-38-lean-admission.ts`: `f1affd6b37e93eea0d98ea229979da87b6494bb5`
  - `scripts/check-v1-38-lean-admission.test.ts`: `9fc2f5ec28f2bd16689e772fb049a99feae7d3af`
  - `apps/runtime-service/src`: `fdd99de6def647c09a62e1828022f7bf64903919`
  - `packages/engine/src`: `bd4863e0e266db5dd224db9f3b6efbc5fcb80d75`
  - `packages/persistence/src`: `4e033da7348e962ac058b8dae0ef5c66b0980ac5`
  - `packages/replay/src`: `a2607b95d7872bfb154b38482dc5eb2b38a7f27f`
  - `packages/runtime-js/src`: `45c27cbaef6c7626ada669637cb7c6a706be8ab1`
  - `packages/runtime-python/src`: `99f2e64639abda0d75c25473936706db9e239554`
  - `packages/runtime-supervisor/src`: `45b2f561db1b0d2976a8490ededb4910dac1fa7e`
  - `packages/runtime-wasm-wasi/src`: `4809132436f4fc5580047152e9805b59b00dbf92`
  - `packages/spec/src`: `d86bfdb4990e45f61bec25183051ba0ee6a7c6d0`
  - `apps/runtime-service/package.json`: `c6ebc56ce3e2b7331acf8ff72e9872c250c4a006`
  - `packages/engine/package.json`: `7fdcbe4c6b1a852e76329f94b570cf065d973b16`
  - `packages/persistence/package.json`: `1c8eb0ffb70c4b2081ca6145464865e740160648`
  - `packages/replay/package.json`: `d0154c2e4e8c862cc39bb0c4b92c88458b7b6f96`
  - `packages/runtime-js/package.json`: `536bbc4db6f5ebbce756570a85c4e8f2720b6855`
  - `packages/runtime-python/package.json`: `8702b6e3a690514d8e4acc8b41aa0a3b14733705`
  - `packages/runtime-supervisor/package.json`: `247b5c5e4b168ac3233351b3ff440459fafd941b`
  - `packages/runtime-wasm-wasi/package.json`: `7e6eb07a8ed1ab6383b4622e45683f1101554e52`
  - `packages/spec/package.json`: `d3489f2aa99b9c79eaaffc7e38d308b560afb0b5`
  - `package.json`: `f470c35c5549c239067ebb78274e93692b169e3d`
  - `pnpm-lock.yaml`: `3cbadfe3a6297d1706c026d381cb4b565935faea`
  - `tsconfig.json`: `d1c932addaa4771c624d425e9761e1f3cf2c7793`

Plan 174 must bind this exact commit, tree, and closure. Any later edit to these paths requires a new source closure; the summary commit itself is documentation-only and does not alter the bound runnable tree.

## Verification

- `pnpm exec vitest run scripts/run-v1-38-lean-runner-feasibility.test.ts scripts/check-v1-38-lean-admission.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1`: **48 passed, 25 skipped**.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `node --import tsx scripts/check-v1-38-lean-admission.ts --check-direct-source-only`: passed with `liveInvocationCount:0` and every authority false.
- Exact successor-lock inventory: 36 and untouched.
- `git diff --check`: passed.

No authorization writer, reviewer, runtime, Match, recovery, live, marker, terminal, adjudication, or eligibility selector was invoked.

## Decisions Made

- The direct authorization remains a future artifact; Plan 173 freezes only the bytes it must authenticate.
- Plan 172's five findings remain visible certification-only history under D-34L.1 and are neither erased nor rewritten as zero.
- A pre-existing direct effect is rejected during reviewed-ready loading, before launch preparation, even if a caller attempts stage-specific operational-path allowance.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Rejected pre-existing direct effects before reviewed launch**
- **Found during:** Task 1 final source verification
- **Issue:** The reviewed-ready loader authenticated authorization and review but did not independently fail if invocation, terminal, adjudication, or eligibility already existed.
- **Fix:** Added an explicit stage-aware pre-effect existence guard before authorization loading.
- **Files modified:** `scripts/check-v1-38-lean-admission.ts`
- **Verification:** Focused tests, TypeScript compilation, and source-only proof all pass.
- **Committed in:** `c11e9173`

---

**Total deviations:** 1 auto-fixed (1 Rule 2)
**Impact on plan:** The correction narrows launch authority and completes the plan's required preexisting-effect rejection without expanding scope.

## Issues Encountered

One subprocess-rejection test exceeded Vitest's default five-second limit on the first run but passed unchanged on the complete serialized rerun; the child command independently rejected in 2.3 seconds with `LEAN_CHILD_PARENT_REQUIRED`. No product or source defect was indicated.

## Known Stubs

None.

## Threat Flags

None. This plan adds no network, public, product, persistence, or production surface; it only narrows a private source-gated execution boundary.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 174 may now publish one exact direct authorization over `c11e9173cc29149b16460944676a6c2b11829e9b` and dispatch one independent seven-category source review. Plan 175 remains unavailable until that review is exact, independently produced, and has zero blocking findings. Every empirical and downstream authority remains false.

## Self-Check: PASSED

All three Task 1 commits resolve; all five Plan 173 files exist; the exact source-only checker, 48 focused tests, TypeScript compilation, lock inventory, and diff check pass; direct authorization/review/effect destinations remain absent; and no live or recovery path was invoked.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-09-08*
