---
phase: 256-counted-safety-and-canonical-authority
plan: "11"
subsystem: runtime-integrity
tags: [go, postgres, runtime-service, chronicle, fail-closed, evidence-authority]
requires:
  - phase: 256-counted-safety-and-canonical-authority
    provides: canonical tuple, evidence authority, receipt-bound creation, and scheduling decisions
provides:
  - Pre-mutation Go claim gate over the exact installed evidence publication and ordered entrant pair
  - Reference-only runtime transport with a post-response exact-identity recheck
  - Transactional completion and Chronicle persistence of the locked integrity identity
affects: [counted-runtime, chronicle, replay, conformance, service-proof]
tech-stack:
  added: []
  patterns: [receipt-bound lifecycle mutation, immutable reference-only transport, transactional identity recheck]
key-files:
  created:
    - packages/persistence/migrations/0015_chronicle_receipt_bound_integrity.sql
  modified:
    - apps/go-backend/job_lifecycle.go
    - apps/go-backend/runtime_service_client.go
    - apps/go-backend/orchestrator.go
    - apps/go-backend/completion.go
    - packages/spec/src/runtime-execution-service.ts
    - apps/runtime-service/src/execute-match.ts
key-decisions:
  - "Production claim and completion paths fail closed unless the mounted authority and persisted installed receipt agree exactly."
  - "Runtime transport carries identity references and hashes only; runtime-service authority bodies remain independently mounted."
  - "Chronicle receipt-bound fields are nullable only for immutable historical v1.4 records; new strict completion supplies the complete identity."
patterns-established:
  - "Mutation boundary: lock and compare the full identity before changing lifecycle or completion state."
  - "In-flight drift: classify as retryable system failure and never as gameplay or player fault."
requirements-completed: [SAFE-01, SAFE-02, AUTH-02, AUTH-03]
coverage:
  - id: D1
    description: Go claim rejects stale, incomplete, or mismatched installed evidence before lifecycle mutation.
    requirement: SAFE-01
    verification:
      - kind: integration
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1"
        status: pass
      - kind: unit
        ref: "apps/go-backend/job_lifecycle_test.go#TestMatchJobLifecycleIntegrity"
        status: pass
    human_judgment: false
  - id: D2
    description: Runtime execution receives a complete reference-only identity and Go rechecks it after the response.
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "apps/go-backend/runtime_service_client_test.go#TestRuntimeServiceRequestIntegrity"
        status: pass
      - kind: integration
        ref: "apps/runtime-service/src/counted-safety-runtime-service.test.ts and execute-match.test.ts (30 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: Completion rechecks the locked identity and persists it atomically with Chronicle creation.
    requirement: SAFE-02
    verification:
      - kind: integration
        ref: "apps/go-backend/completion_test.go#TestMatchCompletionIntegrity and configured PostgreSQL completion suite"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/migrations.test.ts"
        status: pass
    human_judgment: false
duration: 1h 25m
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 11: Receipt-Bound Go Lifecycle Summary

**Go claim, runtime transport, and Chronicle completion now preserve one exact installed-evidence identity and fail safely on drift.**

## Performance

- **Duration:** 1h 25m
- **Completed:** 2026-07-13
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- The actual production claim transaction verifies the current mounted authority, durable generation anchor, immutable installed receipt, source set, tuple, scheduling decision, and ordered entrant certificates before changing job or Match state.
- Runtime requests carry only exact identity references and hashes. After execution, Go reloads and transactionally rechecks the same identity before completion; drift records a retryable system failure without gameplay or player mutation.
- Completion locks the running lease and full identity again, then copies receipt-bound tuple, authority, source-set, and ordered entrant fields into Chronicle in the same PostgreSQL transaction.

## Task Commits

1. **Task 1: Reject stale evidence in actual Go claim** - `311809c` (RED), `d239180` (GREEN)
2. **Task 2: Carry and recheck exact runtime identity** - `2e74e81` (RED), `3b7905a` (GREEN)
3. **Task 3: Verify identity before completion and Chronicle insert** - `e74d8d3` (RED), `6566a96` (GREEN)
4. **Full-suite compatibility cleanup** - `c6790a1`

## Files Created/Modified

- `apps/go-backend/job_lifecycle.go` - Strict receipt-bound production claim and returned immutable identity.
- `apps/go-backend/runtime_service_client.go` - Ref-only request snapshot and strict structural validation.
- `apps/go-backend/orchestrator.go` - Post-response authority/receipt recheck before completion.
- `apps/go-backend/completion.go` - Transactional final identity lock and Chronicle propagation.
- `packages/persistence/migrations/0015_chronicle_receipt_bound_integrity.sql` - Immutable Chronicle receipt-bound identity columns.
- `packages/spec/src/runtime-execution-service.ts` and `packages/spec/src/schemas.ts` - Canonical request contract.
- `apps/runtime-service/src/execute-match.ts` - Runtime-side exact-reference comparison against independently mounted authority.

## Decisions Made

- Kept authority content out of the transport envelope; publication, receipt, certificate, and decision references are sufficient to bind execution while preserving the runtime-service trust boundary.
- Made evidence failure retryable system failure. It cannot mutate outcome, memories, standings, penalties, or Chronicle.
- Preserved historical Chronicle compatibility by permitting null identity columns on old records while making strict production completion populate the full v1.37 identity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Legacy PostgreSQL fixtures assumed documentation-only evidence could create executable work**

- **Found during:** Full configured-PostgreSQL Go suite
- **Issue:** Three older tests expected unproved strategy revisions to become eligible or create queued/orchestratable Matches, contradicting the milestone's fail-closed policy.
- **Fix:** Updated the fixtures to assert rejection and non-eligibility instead of manufacturing executable work without current receipts.
- **Files modified:** `apps/go-backend/matchset_status_test.go`, `apps/go-backend/orchestrator_test.go`, `apps/go-backend/phase244_account_provider_db_test.go`
- **Verification:** Full configured-PostgreSQL `go test ./... -count=1` passes.
- **Committed in:** `c6790a1`

**Total deviations:** 1 auto-fixed blocking compatibility issue.
**Impact on plan:** No scope expansion; the adjustment removes stale expectations that bypassed the planned fail-closed boundary.

## Issues Encountered

- The local PostgreSQL helper attempted host-user authentication, so verification used the repository's explicit `cowards` PostgreSQL DSN. The complete Go suite passed against that real database.

## User Setup Required

None.

## Verification

- Full Go suite with real PostgreSQL: pass.
- Focused Go claim, transport, orchestrator, completion, and database-boundary suites: pass.
- Runtime-service counted-safety and execution suite: 30 tests pass.
- Spec and runtime-service typechecks: pass.
- Persistence migration discovery/shape suite: pass.

## Next Phase Readiness

The counted execution lifecycle now has one receipt-bound identity from claim through Chronicle. Later conformance, replay, and service-proof plans can treat lifecycle drift as an explicit system-failure boundary rather than reconstructing authority from mutable inputs.

## Self-Check: PASSED

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
