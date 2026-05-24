---
phase: 104-isolated-runtime-service-boundary-hardening
plan: 1
subsystem: runtime
tags: [runtime-service, runtime-broker, go-backend, boundary-monitors, vitest, go-test]
requires:
  - phase: 103-typescript-backend-inventory-and-retirement-contract
    provides: v1.16 TypeScript backend inventory and strict role taxonomy
provides:
  - Broker-ready Strategy Execution Service / Runtime Broker contract metadata
  - Public-safe v1.16 runtime service boundary artifacts
  - Runtime-service schema, redaction, HTTP boundary, and authority tests
  - Go runtime service client no-fallback and drift tests
  - Boundary monitor checks for runtime authority, ABI drift, privacy, and no Strategy execution outside runtime boundary
affects: [phase-105, phase-106, phase-108, runtime-service, go-backend]
tech-stack:
  added: []
  patterns:
    - Transport-neutral runtime execution contract with current HTTP+JSON binding metadata
    - Public-safe JSON plus markdown boundary artifacts consumed by monitors
    - Runtime boundary tests that scan production source for backend authority creep
key-files:
  created:
    - .planning/artifacts/v1.16-runtime-service-boundary.json
    - .planning/artifacts/v1.16-runtime-service-boundary.md
    - apps/runtime-service/src/server.test.ts
    - apps/runtime-service/src/redaction.test.ts
    - .planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md
    - .planning/phases/104-isolated-runtime-service-boundary-hardening/104-SUMMARY.md
  modified:
    - packages/spec/src/runtime-execution-service.ts
    - packages/spec/src/runtime.ts
    - packages/spec/src/spec.test.ts
    - apps/runtime-service/src/execute-match.test.ts
    - apps/runtime-service/src/server.ts
    - apps/runtime-service/src/redaction.ts
    - apps/go-backend/runtime_service_client_test.go
    - scripts/check-boundary-monitors.ts
    - scripts/check-boundary-monitors.test.ts
    - .planning/artifacts/v1.16-typescript-backend-inventory.json
    - .planning/artifacts/v1.16-typescript-backend-inventory.md
key-decisions:
  - "Kept runtime-execution-service-v1.15 and strategy-runtime-abi-v1.14 as the current contract versions while adding broker-ready metadata."
  - "Labeled today's implementation as the isolated JS/TS runtime service, not the backend and not the final Runtime Broker."
  - "Documented partial pnpm boundary:monitors evidence because live local services were not running."
patterns-established:
  - "Runtime-service /health reports boundary name, implementation label, transport binding, and backendAuthority=false."
  - "Boundary monitors validate the v1.16 runtime boundary artifact and scan Go/web files for forbidden runtime execution markers."
requirements-completed: [RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, RT-07]
duration: 16min
completed: 2026-05-24
---

# Phase 104 Plan 1: Isolated Runtime Service Boundary Hardening Summary

**Broker-ready Strategy Execution Service / Runtime Broker contract with isolated JS/TS runtime-service enforcement and Go no-fallback validation**

## Performance

- **Duration:** 16 min
- **Started:** 2026-05-24T17:59:04Z
- **Completed:** 2026-05-24T18:15:10Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Published spec metadata and public-safe artifacts for the Strategy Execution Service / Runtime Broker while preserving the current HTTP+JSON isolated JS/TS runtime service binding.
- Added runtime-service tests for malformed input, source mismatch, invalid output as runtime violations, schema-invalid responses, route narrowness, redaction, and backend-authority absence.
- Extended Go client and boundary monitor coverage for source/ABI drift, unsafe diagnostics, no fallback, runtime-service authority creep, public artifact privacy, and no Strategy execution outside the runtime boundary.
- Recorded Phase 104 validation evidence, including focused passing gates and the residual live topology prerequisite for `pnpm boundary:monitors`.

## Task Commits

1. **Task 1 RED:** `1844116` test(104-1): add failing runtime boundary contract tests
2. **Task 1 GREEN:** `9051aba` feat(104-1): publish runtime service boundary contract
3. **Task 2 RED:** `3e7b173` test(104-2): add failing runtime service boundary tests
4. **Task 2 GREEN:** `8469463` feat(104-2): harden runtime service HTTP boundary
5. **Task 3 RED:** `c7d745d` test(104-3): add failing runtime boundary monitor tests
6. **Task 3 GREEN:** `bd8d0a2` feat(104-3): enforce runtime boundary monitors

## Files Created/Modified

- `packages/spec/src/runtime-execution-service.ts` - Adds broker-ready contract, transport, authority, privacy, artifact, and non-promotion metadata.
- `packages/spec/src/runtime.ts` - Updates v1.16 readiness wording and keeps WASM/WASI/component-model unpromoted.
- `packages/spec/src/spec.test.ts` - Verifies runtime boundary metadata and public-safe artifacts.
- `.planning/artifacts/v1.16-runtime-service-boundary.json` - Machine-readable Phase 104 boundary contract.
- `.planning/artifacts/v1.16-runtime-service-boundary.md` - Human-readable Phase 104 boundary contract.
- `apps/runtime-service/src/execute-match.test.ts` - Extends fail-closed, schema-valid, source mismatch, response drift, and authority scan coverage.
- `apps/runtime-service/src/server.ts` - Adds boundary metadata to `/health`.
- `apps/runtime-service/src/server.test.ts` - Adds HTTP boundary route and body-limit tests.
- `apps/runtime-service/src/redaction.ts` - Redacts owner/session/database/private-runtime markers.
- `apps/runtime-service/src/redaction.test.ts` - Adds serialized D-17 denylist coverage.
- `apps/go-backend/runtime_service_client_test.go` - Extends runtime-service client no-fallback and drift coverage.
- `scripts/check-boundary-monitors.ts` - Adds Phase 104 artifact, authority, no-execution, and non-promotion checks.
- `scripts/check-boundary-monitors.test.ts` - Adds Phase 104 monitor tests.
- `.planning/artifacts/v1.16-typescript-backend-inventory.json` - Regenerated inventory after Phase 104 test and monitor additions.
- `.planning/artifacts/v1.16-typescript-backend-inventory.md` - Regenerated inventory matrix.
- `.planning/phases/104-isolated-runtime-service-boundary-hardening/104-VALIDATION.md` - Validation evidence and residual risk.

## Validation

- `pnpm exec vitest run packages/spec/src/spec.test.ts` - PASS
- `pnpm --filter @cowards/spec contract:check` - PASS
- Runtime boundary artifact key check with `node -e ...` - PASS
- `pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts apps/runtime-service/src/server.test.ts apps/runtime-service/src/redaction.test.ts` - PASS
- `pnpm --filter @cowards/runtime-service typecheck` - PASS
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'RuntimeServiceClient'` - PASS
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` - PASS
- `pnpm typescript-backend:inventory:check` - PASS
- `pnpm boundary:monitors` - PARTIAL: contract, privacy, imports, inventory, Go parity, sandbox, and Phase 104 monitor checks passed; live topology failed because local web, Go, runtime-service, and auth-gated endpoints were not running.

## Requirement Coverage

| Requirement | Status |
| --- | --- |
| RT-01 | Complete: contract metadata and artifacts cover broker-ready transport, ABI, envelopes, package policy, limits, diagnostics, crash, privacy, and no fallback. |
| RT-02 | Complete: runtime-service tests and monitors keep JS/TS execution inside runtime service/runtime adapter boundaries. |
| RT-03 | Complete: tests and monitors reject runtime-service DB/job/API/session/scoring/public-evidence authority. |
| RT-04 | Complete: Go/spec versions remain synchronized at `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`. |
| RT-05 | Complete: schema, mismatch, oversized, timeout/violation, invalid output, unsafe diagnostics, and privacy leak paths are covered. |
| RT-06 | Complete: monitors scan Go/web for forbidden Strategy execution imports and Node `vm`/`node:wasi` markers. |
| RT-07 | Complete: worker-thread, subprocess, container-subprocess, non-JS, WASM/WASI, and component-model remain explicit readiness/evaluation labels only. |

## Decisions Made

- Preserved current service and ABI versions rather than introducing a v1.16 wire version, because Phase 104 is hardening and broker-readiness work rather than a breaking contract migration.
- Made `/health` carry the implementation label and `backendAuthority=false` so topology and monitor checks can distinguish the current runtime service from a backend.
- Treated the stale TypeScript backend inventory as a required monitor synchronization update after adding runtime-service test surfaces and monitor code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Node type reference for spec artifact parsing**
- **Found during:** Task 2 runtime-service typecheck
- **Issue:** Runtime-service typecheck builds the spec package reference, and the new spec artifact parse test imports `node:fs` while the spec tsconfig does not include Node types.
- **Fix:** Added a test-file `/// <reference types="node" />` directive.
- **Files modified:** `packages/spec/src/spec.test.ts`
- **Verification:** `pnpm --filter @cowards/runtime-service typecheck` passed.
- **Committed in:** `8469463`

**2. [Rule 3 - Blocking] Regenerated v1.16 TypeScript backend inventory artifacts**
- **Found during:** Task 3 `pnpm typescript-backend:inventory:check`
- **Issue:** New runtime-service tests and monitor code made the Phase 103 inventory artifacts stale.
- **Fix:** Ran `pnpm typescript-backend:inventory` and committed the updated JSON and markdown artifacts.
- **Files modified:** `.planning/artifacts/v1.16-typescript-backend-inventory.json`, `.planning/artifacts/v1.16-typescript-backend-inventory.md`
- **Verification:** `pnpm typescript-backend:inventory:check` passed.
- **Committed in:** `bd8d0a2`

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were required for the planned verification gates. No runtime authority or product behavior was added.

## Issues Encountered

- `pnpm boundary:monitors` could not complete the live topology lane because local web, Go, runtime-service, and auth-gated endpoints were not running. Focused gates and non-live monitor lanes passed; see `104-VALIDATION.md` for startup commands and residual risk.

## Known Stubs

None.

## Threat Flags

None. Phase 104 changes an existing `/health` response and adds tests, contract metadata, artifacts, and monitors; it does not add new endpoints, auth paths, schema trust boundaries, persistence, or runtime execution authority.

## TDD Gate Compliance

- RED commits present for Tasks 1, 2, and 3: `1844116`, `3e7b173`, `c7d745d`.
- GREEN commits present after each RED commit: `9051aba`, `8469463`, `bd8d0a2`.
- No refactor-only commit was needed.

## Self-Check: PASSED

- Found summary, validation notes, and both v1.16 runtime boundary artifacts.
- Found task commits: `1844116`, `9051aba`, `3e7b173`, `8469463`, `c7d745d`, `bd8d0a2`.

## User Setup Required

No external secrets were written. Full live `pnpm boundary:monitors` requires local services to be running with redacted local environment values as documented in `104-VALIDATION.md`.

## Next Phase Readiness

Phase 105 can rely on the runtime execution boundary being explicit, schema-validated, monitor-enforced, and isolated from backend ownership. Remaining evidence gap is live topology availability, not contract or focused test coverage.

---
*Phase: 104-isolated-runtime-service-boundary-hardening*
*Completed: 2026-05-24*
