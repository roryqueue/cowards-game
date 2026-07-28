---
phase: 256-counted-safety-and-canonical-authority
plan: "19"
subsystem: worker-runtime-boundary
tags: [worker-retirement, fail-closed, typescript-ast, privacy, tdd]
requires:
  - phase: 256-01
    provides: canonical runtime ownership and semantic authority baseline
provides:
  - unconditional retirement of every direct TypeScript Match worker purpose
  - zero-side-effect regression matrix across ownership, environment, and dependency injection variants
  - AST-backed structural sentinel for startup, claim, lifecycle, and alternate-route drift
affects: [phase-256-boundary-chain, runtime-service-ownership, demos, preflight, test-support]
tech-stack:
  added: []
  patterns: [fatal first-operation retirement, public-safe stable failure, parsed source-region sentinel]
key-files:
  created:
    - scripts/check-v1-37-worker-retirement.ts
    - scripts/check-v1-37-worker-retirement.test.ts
  modified:
    - apps/worker/src/runner.ts
    - apps/worker/src/runner.test.ts
    - apps/worker/src/index.ts
key-decisions:
  - "The legacy direct TypeScript Match worker has no normal, rollback, test, parity, demo, or emergency execution purpose."
  - "Retired startup emits only TYPESCRIPT_WORKER_RETIRED and a stable message; source locations, host paths, and diagnostics are suppressed."
  - "The focused retirement sentinel proves fatal ordering and forbidden route absence; Plan 256-14 owns integration into the broad serialized boundary chain."
patterns-established:
  - "Retired executable boundaries call one fatal assertion before reading options, environment, runtime config, pools, claims, or injected dependencies."
  - "Structural proof parses AST statements/imports/calls and rejects synthetic bypasses without accepting comments or identifier names as evidence."
requirements-completed: [SAFE-01, SAFE-02, AUTH-03, AUTH-05]
coverage:
  - id: D1
    description: "Every direct TypeScript worker invocation fails before claim, runtime, Chronicle, persistence, or penalty effects"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "apps/worker/src/runner.test.ts#retired direct TypeScript Match worker"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/worker typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "A parsed structural sentinel rejects former-purpose, ordering, injection, alternate-loop, and claim-to-completion bypasses"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "scripts/check-v1-37-worker-retirement.test.ts#v1.37 direct TypeScript worker retirement sentinel"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-37-worker-retirement.ts"
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 19: Direct TypeScript Worker Retirement Summary

**The legacy TypeScript Match worker now fails every purpose at its first operation, with executable zero-effect tests and an AST-backed drift sentinel.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-13T02:03:22Z
- **Completed:** 2026-07-13T02:13:48Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Removed the rollback/test/parity allowlist, database claim path, runtime construction, Chronicle construction, completion, retry/failure mutation, and loop implementation from the direct worker.
- Added 34 worker tests covering declared and malformed purposes, lifecycle owners, environment labels, injected dependency sets, loop startup, stable errors, zero calls, and real-process privacy-safe output.
- Added a focused TypeScript-AST sentinel with nine real/synthetic cases for purpose exceptions, environment bypass, assertion ordering, alternate loops, executable dependency defaults, direct claim-to-completion routes, and cosmetic comment/name guards.

## Task Commits

1. **Task 1 RED: all-purpose zero-effect retirement matrix** - `7ddb381` (test)
2. **Task 1 GREEN: direct worker retirement** - `e3b7cca` (feat)
3. **Task 2 RED: structural bypass fixtures** - `3dae672` (test)
4. **Task 2 GREEN: AST retirement sentinel** - `8b28ab7` (feat)
5. **Verification RED: unsafe real-process diagnostic proof** - `3118df1` (test)
6. **Verification GREEN: safe startup failure projection** - `409c397` (fix)

## Files Created/Modified

- `apps/worker/src/runner.ts` - Stable retirement error and fatal once/loop boundaries with no production lifecycle dependencies.
- `apps/worker/src/runner.test.ts` - All-purpose, zero-call, real-process, and privacy regressions.
- `apps/worker/src/index.ts` - Retirement before configuration/pool/startup effects with allowlisted stderr output.
- `scripts/check-v1-37-worker-retirement.ts` - Focused parsed structural evaluator and safe CLI result.
- `scripts/check-v1-37-worker-retirement.test.ts` - Independent synthetic bypass fixtures plus live-repository proof.

## Decisions Made

- Kept the exported once/loop function names temporarily so existing callers fail closed with the same retirement error instead of failing via inconsistent import/build errors.
- Removed executable helper implementations because no production consumer imports them; runtime-service remains the Strategy execution owner.
- Kept the sentinel narrowly scoped to the retired worker. The broad authority/writer chain remains Plan 256-14's single-writer integration responsibility.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Privacy Bug] Sanitized real-process startup failure output**
- **Found during:** Overall verification
- **Issue:** An uncaught retired error still let the TSX loader print a source location and absolute host path even after clearing `Error.stack`.
- **Fix:** Caught the fatal assertion only after it ran as the first operation and emitted an exact allowlisted code/message payload with exit status 1.
- **Files modified:** `apps/worker/src/index.ts`, `apps/worker/src/runner.test.ts`, `scripts/check-v1-37-worker-retirement.ts`
- **Verification:** The test launches the real entrypoint and asserts exact stderr with no host, source, artifact, memory, objective, credential, diagnostic, or stack markers.
- **Committed in:** `3118df1`, `409c397`

---

**Total deviations:** 1 auto-fixed privacy bug.
**Impact on plan:** The fix strengthened the planned public-safe failure boundary without restoring execution or changing gameplay.

## Issues Encountered

- The repository-wide `pnpm typecheck` reached 24/25 successful tasks, then the web package failed on pre-existing duplicate generated `.next/types/* 3.ts` declarations. Worker, sentinel, and service-boundary focused checks are green; no generated web cache was modified or committed by this plan.

## User Setup Required

None - no external service configuration or package installation is required.

## Verification

- `pnpm --filter @cowards/worker test` - 34/34 passed.
- `pnpm --filter @cowards/worker typecheck` - passed.
- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-v1-37-worker-retirement.test.ts` - 19/19 passed.
- `pnpm exec tsx scripts/check-v1-37-worker-retirement.ts` - `worker_retirement_findings=0`.
- Real `apps/worker/src/index.ts` process - exit 1 with exact safe JSON and empty stdout.

## Next Phase Readiness

- Plan 256-14 can invoke the focused sentinel from the serialized boundary-monitor chain.
- Demo, preflight, and web test-support callers now receive the same closed retirement result and must migrate to the normal service-owned execution path in their owning plans.
- No gameplay state, Action legality, event order, outcome, Strategy observation, runtime-service ownership, or historical evidence changed.

## Self-Check: PASSED

- Both created sentinel files and all three modified worker files exist.
- All six TDD/fix commits exist in history.
- Focused worker, structural sentinel, import-boundary, package typecheck, real-process safety, and live-repository checks pass.
- The user-owned consolidated spec and `.planning/config.json` changes remain unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
