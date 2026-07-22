---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "08"
subsystem: go-control-plane
tags: [go, completion, retry, set-conditions, scoring, postgresql]

requires:
  - phase: 260-06
    provides: Candidate Go four-condition scheduling and frozen runtime-v1.19 D-04 evidence
  - phase: 260-07
    provides: TypeScript terminal, retry, status, and scoring reference vectors
  - phase: 259-21
    provides: Selected Go completion, retry, status, and scoring behavior
provides:
  - Exact runtime-v1.19 Go terminal and retry identity admission
  - Candidate-only PostgreSQL D-04 status and counted-scoring dispatch
  - Canonical scenario/condition scoring independent of completion order
affects: [260-09, 260-14, go-completion, matchset-status, standings]

tech-stack:
  added: []
  patterns: [explicit-version-dispatch, structural-terminal-admission, frozen-revision-evidence, canonical-matrix-order]

key-files:
  modified:
    - apps/go-backend/completion.go
    - apps/go-backend/completion_test.go
    - apps/go-backend/job_lifecycle.go
    - apps/go-backend/retry_policy.go
    - apps/go-backend/retry_policy_test.go
    - apps/go-backend/matchset_status.go
    - apps/go-backend/matchset_status_test.go
    - apps/go-backend/scoring.go
    - apps/go-backend/scoring_test.go
    - apps/go-backend/integrity_creation_test.go

key-decisions:
  - "Dispatch successor status/scoring only for the exact runtime-v1.19 tuple; selected Phase-259 behavior and generated current authority remain unchanged."
  - "Admit only success and player_violation as terminal classes; system failures remain retryable or degraded without becoming condition evidence."
  - "Require exact scenario, condition, side, initiative, request hash, revision, and frozen/current D-04 revalidation identity before terminal admission or counting."
  - "Keep the Go successor branch structural: it does not read Chronicle events, derive gameplay, or execute Strategy code."
  - "Return empty rankings for every pending or degraded successor matrix."

patterns-established:
  - "Candidate Go completion: revalidate exact persisted and signed identity before classifying a terminal or retry disposition."
  - "Candidate Go scoring: validate generated membership and current D-04 evidence, sort by scenario and ordinal, then call the unchanged scorer."

requirements-completed: [STRAT-04, SET-03, SET-04, SET-05]

coverage:
  - id: D1
    description: "Exact persisted and signed runtime-v1.19 condition identity plus current D-04 evidence is required for success or player-violation terminal admission."
    requirement: SET-03
    verification:
      - kind: unit
        ref: "apps/go-backend/completion_test.go#candidate-condition-identity"
        status: pass
    human_judgment: false
  - id: D2
    description: "System retry preserves identical request and evidence identity, is bounded, and cannot reinterpret cancellation or player violation."
    requirement: SET-05
    verification:
      - kind: unit
        ref: "apps/go-backend/retry_policy_test.go#candidate-retry-policy"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only the exact four-condition matrix with current non-revoked D-04 evidence counts; partial, retryable, exhausted, duplicate, substituted, and revoked matrices have empty rankings."
    requirement: SET-04
    verification:
      - kind: unit
        ref: "apps/go-backend/scoring_test.go#candidate-scoring-v119"
        status: pass
      - kind: integration
        ref: "apps/go-backend/integrity_creation_test.go#TestCandidateIntegrityCreationV119PostgresPublishesExactlyFourOrNothing"
        status: pass
    human_judgment: false
  - id: D4
    description: "Canonical condition ordering produces byte-identical Go score output across completion permutations and the successor status branch contains no Chronicle/gameplay interpretation."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "apps/go-backend/scoring_test.go#TestCandidateMatchSetScoringV119MatchesTypeScriptCanonicalVectors"
        status: pass
      - kind: unit
        ref: "apps/go-backend/matchset_status_test.go#TestCandidateMatchSetStatusV119IsStructuralOnly"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 08: Go Successor Completion and Scoring Summary

**Go now independently admits exact runtime-v1.19 condition terminals and retries, and counts only a canonical four-condition matrix whose frozen revision-specific D-04 evidence is still exact and non-revoked, without changing selected Phase-259 behavior.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-17T05:50:43Z
- **Completed:** 2026-07-17T06:08:11Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 10

## Accomplishments

- Added a candidate condition identity that binds the exact scenario, condition, ordinal, request hash, sides, initiative owner, candidate tuple, arena catalog record, both Strategy Revisions, and their D-04 revalidation IDs and roots.
- Added structural terminal admission for only `success` and `player_violation`, plus bounded identical-identity retry/degraded classification for system failures and cancellation.
- Added exact generated four-condition membership validation, canonical scenario/ordinal ordering, and a candidate wrapper around the unchanged current Go scoring arithmetic.
- Added PostgreSQL candidate status dispatch that compares frozen revision admissions with current exact, non-revoked D-04 rows before mutating counted state.
- Proved real persisted four-condition rows count when exact and return to pending with empty rankings after D-04 revocation.
- Added a structural-source guard proving the candidate status path does not query Chronicle data or call gameplay interpretation helpers.

## Task Commits

1. **Task 1 RED: candidate completion/retry identity expectations** - `febf050`
2. **Task 1 GREEN: exact structural terminal and retry admission** - `2916fb8`
3. **Task 2 RED: candidate status/scoring parity expectations** - `2502438`
4. **Task 2 GREEN: PostgreSQL D-04 gate and canonical scoring** - `2c7b4f5`

## Files Created/Modified

- `apps/go-backend/completion.go` - Loads and revalidates the exact persisted candidate condition and D-04 identity before terminal admission.
- `apps/go-backend/completion_test.go` - Covers exact identity, request drift, side/initiative drift, tuple drift, catalog drift, and structural-only boundaries.
- `apps/go-backend/job_lifecycle.go` - Exposes candidate attempt classification without changing current lifecycle behavior.
- `apps/go-backend/retry_policy.go` - Adds bounded identical-identity candidate retry classification.
- `apps/go-backend/retry_policy_test.go` - Covers player/system/cancellation ownership and retry bounds.
- `apps/go-backend/matchset_status.go` - Adds exact-tuple dispatch, PostgreSQL frozen/current D-04 checks, and candidate counted-state mutation.
- `apps/go-backend/matchset_status_test.go` - Covers candidate status states and the no-Chronicle/no-gameplay structural guard.
- `apps/go-backend/scoring.go` - Adds canonical matrix membership, evidence validation, non-counted empty results, and unchanged-scorer dispatch.
- `apps/go-backend/scoring_test.go` - Covers completion permutations, player violation, omissions, duplicates, substitutions, retries, exhaustion, and revocation vectors.
- `apps/go-backend/integrity_creation_test.go` - Extends the existing isolated-schema PostgreSQL candidate fixture through exact countability and revocation invalidation.

## Decisions Made

- Candidate functions are versioned `V119` and selected only by the exact candidate tuple. `current_semantic_authority_generated.go` remains on Phase 259.
- The candidate status query treats Match status as structural terminal evidence and does not inspect Chronicle events. Player-violation terminal and penalty behavior is exercised through explicit structured scoring input, not reconstructed gameplay.
- Frozen D-04 evidence comes from each Match's persisted execution evidence; current evidence must match the immutable revision source, artifact, lane/provider, ABI, tuple, reviewed certificate, revalidation ID, and receipt root with no revocation.
- Pending and degraded matrices persist no rankings, preventing partial or system-failed evidence from influencing standings.

## Deviations from Plan

- The real PostgreSQL candidate status assertion extends the existing Plan-06 isolated-schema creation fixture in `integrity_creation_test.go` instead of duplicating its large authority/certificate/revalidation setup in `matchset_status_test.go`. The candidate status unit and structural-boundary cases remain in the planned status test file.

## Issues Encountered

- The first GREEN scorer validation incorrectly required the Match ID to equal the condition ID; the generated authority intentionally gives those fields distinct domains. The gate was corrected to require both exact generated values independently.
- An initial PostgreSQL scoring draft reused the current-path Chronicle penalty helper. That violated the successor structural-only boundary, so Chronicle was removed from the candidate query and a source-level regression guard was added before the final GREEN commit.

## Verification

- `COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game PATH=/usr/local/go/bin:$PATH go test ./... -run 'Completion|RetryPolicy|ConditionIdentity'` - passed.
- `COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game PATH=/usr/local/go/bin:$PATH go test ./... -run 'MatchSetStatus|Scoring|Cartesian'` - passed.
- Focused isolated-schema candidate creation/status/scoring/revocation PostgreSQL proof - passed.
- Full `apps/go-backend` suite with PostgreSQL - passed.
- TypeScript persistence scoring/status reference suites - passed.
- `git diff --check` - passed.
- Protected user files retained exact starting hashes and remain unstaged.

## TDD Gate Compliance

- Task 1 RED `febf050` proved candidate condition/retry types and functions were missing; GREEN `2916fb8` passes exact structural identity and ownership classification.
- Task 2 RED `2502438` proved candidate status/scoring types and functions were missing; GREEN `2c7b4f5` passes matrix membership, permutation, D-04, PostgreSQL, player-violation, and system-state cases.

## Next Phase Readiness

- Plan 260-09 can persist candidate Chronicle evidence against the already frozen structural terminal identity without granting Go gameplay authority.
- Plan 260-14 remains the only activation owner; generated current authority, selected Phase-259 completion/retry/status/scoring, and production defaults are unchanged.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- All plan implementation files exist, both TDD RED/GREEN commit pairs are present, and the real PostgreSQL proof covers exact counting plus revocation invalidation.
- Focused and full Go suites pass with the required PostgreSQL DSN and Go toolchain path.
- The candidate branch is exact-tuple-only, D-04-bound, non-counting for partial/degraded states, and contains no Chronicle/gameplay or Strategy-execution logic.
- Protected user files match their starting hashes and remain unstaged.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
