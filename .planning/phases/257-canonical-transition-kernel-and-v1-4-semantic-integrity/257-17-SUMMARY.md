---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "17"
subsystem: go-semantic-admission-and-completion
tags: [go, semantic-integrity, candidate-tuple, postgres, chronicle, rollback]
requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: shared semantic-integrity vectors and the inactive exact candidate tuple
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: internal candidate runtime-service result and Chronicle contract
provides:
  - Strict original-byte Go validation for the exact inactive candidate result envelope
  - Shared-code semantic agreement for every applicable arena and state vector without a Go scheduler
  - Pre-completion candidate rejection in canonical orchestration with system-owned retry state
  - Twice-validated candidate completion evidence and isolated PostgreSQL exact-success/rollback proof
affects: [257-19, go-backend, runtime-service, completion, chronicle, counted-scheduling]
tech-stack:
  added: []
  patterns: [original-byte admission, bounded semantic failure, no-Go-scheduler guard, pre-derive and in-transaction revalidation, isolated-schema rollback proof]
key-files:
  created:
    - apps/go-backend/semantic_integrity.go
  modified:
    - apps/go-backend/semantic_integrity_test.go
    - apps/go-backend/runtime_service_client.go
    - apps/go-backend/runtime_service_client_test.go
    - apps/go-backend/orchestrator.go
    - apps/go-backend/orchestrator_test.go
    - apps/go-backend/completion.go
    - apps/go-backend/completion_test.go
key-decisions:
  - "Candidate-shaped responses route only when all six tuple fields and the tuple ID are exact; partial and mixed envelopes fail as bounded system integrity."
  - "The inactive candidate may be decoded and proved, but canonical Go orchestration always records it as retryable system failure before completion until the atomic current switch."
  - "Go validates state, Chronicle, identity, terminal hash, and failure ownership but does not reproduce transition scheduling or claim unavailable transition-stream parity."
  - "Candidate completion re-decodes immutable response bytes before derivation and again after transaction locks; real-PostgreSQL candidate success exists only in a random isolated schema."
patterns-established:
  - "Go semantic boundary: strict bytes -> exact candidate envelope -> shared semantic meaning -> Chronicle/final/hash agreement -> inactive orchestration rejection."
  - "Completion boundary: original candidate bytes revalidated before derive and after authority/job locks before any canonical insert."
requirements-completed: [KERN-03, KERN-10, KERN-11]
coverage:
  - id: D1
    description: Go admits only exact candidate evidence, agrees with all applicable shared semantic vectors, preserves old-current behavior, and contains no gameplay scheduler.
    requirement: KERN-03
    verification:
      - kind: integration
        ref: "apps/go-backend/semantic_integrity_test.go#TestSemanticIntegritySharedVectors and TestRuntimeServiceCandidateSemanticRouting"
        status: pass
      - kind: unit
        ref: "apps/go-backend/semantic_integrity_test.go#recursive Go AST scheduler guard"
        status: pass
      - kind: integration
        ref: "apps/go-backend/orchestrator_test.go#TestGoMatchOrchestratorRejectsInactiveCandidateBeforeCompletion"
        status: pass
    human_judgment: false
  - id: D2
    description: Candidate semantic failure cannot mutate gameplay, while exact locked evidence persists once and remains idempotent in real PostgreSQL.
    requirement: KERN-11
    verification:
      - kind: integration
        ref: "apps/go-backend/completion_test.go#TestMatchCompletionSemanticDatabase"
        status: pass
      - kind: integration
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1"
        status: pass
    human_judgment: false
duration: 80min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 17: Go Semantic Admission and Completion Summary

**Go now proves exact candidate semantic meaning and zero-mutation failure at the runtime and PostgreSQL boundaries without becoming a second Match engine or changing active old-current execution.**

## Accomplishments

- Added a standard-library-only Go semantic validator with the committed 34-code vocabulary, exact family/code/path ordering, bounded safe metadata, JavaScript-safe integers, immutable inputs, and every applicable shared arena/state/cascade/valid vector.
- Strictly decodes original runtime response bytes with duplicate-key, UTF-8, unknown-field, safe-number, and EOF enforcement. Only the exact candidate ID plus all six exact tuple fields can enter the candidate branch; partial and mixed shapes fail closed.
- Validates request/result identity, semantic final state, outcome, terminal projection hash, Chronicle metadata, final event, runtime-violation count, terminal outcome, and terminal-board agreement. It deliberately makes no transition parity claim because the response has no transition stream.
- Preserves current old-response handling, but rejects the inactive candidate before canonical completion and records only a bounded retryable system failure. Candidate-declared retryability is preserved and never becomes a player penalty.
- Added a recursive Go-AST guard against Match scheduling/rule-resolution entry points and declarations, including aliases and recursion, while proving validator purity and deep equality.
- Revalidates locked candidate bytes before completion derivation and again after authority/job transaction locks.
- Proved in a random, fully migrated PostgreSQL schema that early semantic invalidity, late installed-receipt drift, and a forced failure after Chronicle insertion leave canonical gameplay/result/standings rows exact. Exact synthetic candidate evidence stores its tuple, receipt, and Chronicle once and duplicate completion is idempotent.

## Task Commits

1. **Task 1: Validate shared semantics before Go orchestration** — `4591eb8`
2. **Task 2: Prove Go real-PostgreSQL rollback and exact success** — `87e46f2`

## Files Created/Modified

- `apps/go-backend/semantic_integrity.go` — Exact candidate route, shared semantic contract, strict byte decoder, final/Chronicle/hash agreement, and immutable evidence revalidation.
- `apps/go-backend/semantic_integrity_test.go` — Shared vectors, cascades, ordering/caps, malformed bytes, purity, AST scheduler guard, identity drift, and locked-byte revalidation.
- `apps/go-backend/runtime_service_client.go` — Candidate-aware original-byte response decoding while retaining the active old-current contract.
- `apps/go-backend/runtime_service_client_test.go` — Candidate system ownership, exact retryability, and privacy-safe failure proof.
- `apps/go-backend/orchestrator.go` — Inactive candidate rejection through operational attempt failure before completion.
- `apps/go-backend/orchestrator_test.go` — Old-current preservation and pre-completion ordering proof.
- `apps/go-backend/completion.go` — Pre-derive and in-transaction candidate evidence revalidation.
- `apps/go-backend/completion_test.go` — Random-schema exact snapshots for invalidity, receipt drift, post-insert rollback, success, and idempotence.

## Decisions Made

- The committed semantic corpus contains 34 codes, not the plan prose's stale count of 33; Go follows the committed source, including `ARENA_TERRAIN_AUTHORITY_MISMATCH`.
- Transition and lifecycle vectors that require unavailable transition-stream fields are not fabricated. Go validates the final state and recorded Chronicle, while the TypeScript kernel remains the sole transition authority.
- The candidate route is observable only as inactive internal evidence. Its successful direct completion proof uses a fully locked authority publication in a random isolated test schema; no shared/production candidate publication or activation occurs.

## Deviations from Plan

### Auto-fixed Issues

**1. Source-of-truth correction — semantic vocabulary count**

- **Found during:** Task 1
- **Issue:** The plan described 33 stable codes, while the committed corpus contains 34 after the arena terrain-authority code was added.
- **Fix:** Used the committed 34-code vocabulary and added an exact vocabulary guard.
- **Verification:** Shared corpus/code-order test and complete Go suite pass.
- **Committed in:** `4591eb8`

**Total deviations:** 1 auto-fixed source-of-truth correction. No gameplay behavior changed.

## Issues Encountered

- `scripts/dev-local-postgres.sh --setup-only` found PostgreSQL already listening but attempted local-user password authentication and exited before setup. The required explicit DSN `postgresql://cowards:cowards@localhost:5432/cowards_game` was healthy; all focused and full DSN-backed Go suites passed against it.
- The Plan-15 candidate service entry remains intentionally internal/test-only and has no public HTTP route. Consequently, Go proves the exact serialized service contract and real persistence behavior here, but a live cross-process candidate-service request cannot exist until the later atomic current switch. This is an intentional staging boundary, not a claimed service-backed proof.

## Verification

- Focused semantic/runtime/orchestrator/completion suite with explicit DSN: passed.
- Plan Task-2 PostgreSQL command with explicit DSN: passed.
- Full `go test ./... -count=1` with explicit DSN: passed in 5.4 seconds.
- Random isolated schema semantic completion test: all 4 cases passed.
- `git diff --check`, bounded failure/privacy assertions, active-old preservation, and recursive no-scheduler AST guard: passed.

## Protected Working Bytes

- `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained user-owned and were not staged or modified by this plan.
- `STATE.md` and `ROADMAP.md` were not modified.

## User Setup Required

None.

## Next Phase Readiness

- Plan 19 can atomically switch current ownership knowing that Go already distinguishes exact candidate evidence, rejects mixed/partial identity, and revalidates before persistence.
- Live cross-process candidate-service proof remains correctly unavailable while the candidate entry point is test-only and inactive; the later switch must supply that service-level evidence before any counted/current claim.

## Self-Check: PASSED

- Both task commits exist and all eight owned Go files are present.
- Full Go and real-PostgreSQL suites pass with the explicit DSN.
- No candidate Chronicle/result is produced for failure, no player penalty is assigned, and active old-current behavior remains green.
- No Go gameplay scheduler or transition parity claim was introduced.

---

_Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity_
_Completed: 2026-07-13_
