---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "06"
subsystem: go-backend
tags: [go, scheduling, set-conditions, revision-admission, postgresql, atomicity]

requires:
  - phase: 260-01
    provides: Generated canonical arena catalog and four-condition Set authority
  - phase: 260-04
    provides: Immutable arena, scenario, condition, and revision-revalidation persistence
  - phase: 260-05
    provides: TypeScript canonical scenario vectors and atomic revision-admission contract
  - phase: 260-16
    provides: Generated Go candidate projection beside the Phase-259 current selector
provides:
  - Explicit runtime-v1.19 Go four-condition scheduler with byte-exact TypeScript identity parity
  - Serializable Go candidate creation transaction with exact per-revision D-04 admission
  - Revision-admission roots frozen into every candidate Match and job evidence pair
affects: [260-07, 260-08, 260-09, 260-14, go-backend, matchset-creation]

tech-stack:
  added: []
  patterns: [generated-authority-consumer, explicit-version-dispatch, revision-bound-request-evidence, serializable-four-row-publication]

key-files:
  created: []
  modified:
    - apps/go-backend/live_backend.go
    - apps/go-backend/live_backend_run_once_test.go
    - apps/go-backend/integrity_creation.go
    - apps/go-backend/integrity_creation_test.go
    - apps/go-backend/semantic_integrity_test.go

key-decisions:
  - "Keep the generated Phase-259 runtime-v1.17 selector as the only current Go scheduler; runtime-v1.19 remains reachable only by an explicit internal candidate call."
  - "Consume generated catalog, tuple, policy, and condition rows directly; Go does not hash arena geometry, parse fairness from seeds, infer kernel state, or execute Strategy code."
  - "Require each immutable Strategy Revision's own exact non-revoked real runtime-v1.19 revalidation and reviewed conformance certificate before candidate persistence."
  - "Bind both revision-admission hashes and the canonical request identity into every Match/job evidence-pair hash, then publish the scenario, four conditions, Matches, jobs, and memberships in one serializable transaction."

patterns-established:
  - "Candidate Go scheduling: generated authority plus explicit runtime-v1.19 dispatch, never a replacement for the selected current projection."
  - "Candidate Go creation: authority/catalog/revision/admission locks precede one all-or-nothing four-condition publication."

requirements-completed: [STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]

coverage:
  - id: D1
    description: "Explicit runtime-v1.19 Go scheduling produces the exact four TypeScript canonical condition and request identities from generated authority while current output remains Phase-259 exact."
    requirement: SET-03
    verification:
      - kind: unit
        ref: "apps/go-backend/live_backend_run_once_test.go#TestCandidatePairwiseFourConditionMatchesV119MatchTypeScriptCanonicalBytes"
        status: pass
      - kind: command
        ref: "cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Arena|Condition|Pairwise|SemanticIntegrity'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one scenario, four conditions, four Matches, four jobs, and four memberships commit together with explicit side and initiative identity."
    requirement: SET-04
    verification:
      - kind: integration
        ref: "apps/go-backend/integrity_creation_test.go#TestCandidateIntegrityCreationV119PostgresPublishesExactlyFourOrNothing"
        status: pass
      - kind: command
        ref: "COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game PATH=/usr/local/go/bin:$PATH go test ./... -run 'IntegrityCreation|FourCondition|Cartesian'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Missing, cross-revision, old-tuple, synthetic, artifact-substituted, certificate-substituted, or revoked admission fails closed; a late job fault rolls back every candidate row."
    requirement: STRAT-04
    verification:
      - kind: unit
        ref: "apps/go-backend/integrity_creation_test.go#TestCandidateIntegrityCreationV119RequiresExactRevisionAdmissions"
        status: pass
      - kind: integration
        ref: "apps/go-backend/integrity_creation_test.go#TestCandidateIntegrityCreationV119PostgresPublishesExactlyFourOrNothing"
        status: pass
    human_judgment: false
  - id: D4
    description: "The Go candidate has no geometry-hash, seed-parser, gameplay transition, Chronicle scheduler, or Strategy evaluation authority."
    requirement: SET-01
    verification:
      - kind: structural
        ref: "apps/go-backend/semantic_integrity_test.go#TestSemanticIntegrityCandidateSchedulingHasNoGameplayOrStrategyExecutionAuthority"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 06: Go Four-Condition Scheduler Candidate Summary

**Go now stages an explicit generated-authority runtime-v1.19 scheduler that matches TypeScript canonical scenario bytes and atomically publishes revision-admitted four-condition jobs, while the selected Go scheduler remains Phase-259 exact.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-17T04:29:26Z
- **Completed:** 2026-07-17T04:41:09Z
- **Tasks:** 2 TDD tasks
- **Files modified:** 5

## Accomplishments

- Added an explicit generated-authority Go candidate that selects only active schedulable v1.37 arenas, excludes Open Field as a historical alias, and reproduces the four TypeScript canonical scenario, condition, side, initiative, and request identities.
- Preserved the generated runtime-v1.17 current selector, current arena installation, current presets, mirror semantics, router, and pairwise persistence without redirecting any normal Go call.
- Added exact per-revision runtime-v1.19 admission validation against immutable source/artifact/language/provider/lane identity, real service receipt roots, and the reviewed conformance certificate.
- Added a serializable transaction that locks candidate authority, catalog, revisions, and admissions before publishing one scenario, four conditions, four Matches, four jobs, and four memberships together.
- Proved with PostgreSQL that a late job fault leaves no partial matrix and a revoked admission cannot create a MatchSet.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1 RED: generated Go candidate parity and boundary expectations** - `e40bc96` (test)
2. **Task 1 GREEN: generated four-condition scheduler candidate** - `867fddf` (feat)
3. **Task 2 RED: exact admission and atomic creation expectations** - `9f80ee3` (test)
4. **Task 2 GREEN: serializable revision-bound candidate publication** - `8a35c09` (feat)

## Files Created/Modified

- `apps/go-backend/live_backend.go` - Adds generated candidate catalog installation, canonical four-condition generation, exact admission loading, and one serializable publication transaction.
- `apps/go-backend/live_backend_run_once_test.go` - Proves TypeScript identity parity and unchanged Phase-259 current scheduling outputs.
- `apps/go-backend/integrity_creation.go` - Defines frozen revision admission evidence and request-bound candidate evidence-pair hashing.
- `apps/go-backend/integrity_creation_test.go` - Covers admission substitution, real PostgreSQL publication cardinality, late-write rollback, and revocation rejection.
- `apps/go-backend/semantic_integrity_test.go` - Structurally prohibits gameplay, Strategy execution, geometry hashing, and seed-derived fairness in the candidate branch.

## Decisions Made

- Candidate authority is verified against the generated source/output roots and exact runtime-v1.19 tuple before any scheduling record is consumed.
- Scenario and request identity use the same framed canonical JSON algorithm and identity domains as TypeScript; Go does not invent a second identity contract.
- The canonical request identity remains spec-byte-exact, while the queued execution evidence-pair hash additionally freezes both revisions' exact admission hashes.
- Existing containment/conformance execution identity remains the persistence binding for Match/job execution evidence; the runtime-v1.19 D-04 revalidation is an additional exact revision-level gate, not a replacement or additive source tolerance.

## Deviations from Plan

None - the plan was implemented as specified.

## Issues Encountered

- `go vet ./...` still reports three pre-existing unreachable-code findings in `matchset_status_test.go`, `orchestrator_test.go`, and `phase244_account_provider_db_test.go`; none is in a Plan 06 file or changed by this plan. All required focused, full Go, parity, generated-authority, PostgreSQL, and protected-baseline gates pass.

## User Setup Required

None - the established local PostgreSQL test URL was sufficient and no new variable, secret, or service is required.

## Verification

- Plan-focused scheduler command: passed.
- Plan-focused PostgreSQL integrity/Cartesian command: passed, including forced late-write rollback and revoked-admission rejection.
- Full Go suite with the established PostgreSQL URL: passed.
- `pnpm go:parity` with both established PostgreSQL URLs: immutable v1.16 fixture parity and complete Go tests passed.
- Generated authority check: `[ARENA_SET_AUTHORITY:v1.37] wrote=false checked=true`.
- Protected-baseline check: passed with `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Protected user files remain the only unstaged changes: `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md`.
- Stub scan: no TODO, FIXME, XXX, placeholder, or unimplemented marker in changed candidate code/tests; the only `panic` match is the pre-existing cryptographic-random failure guard.
- Threat checks: generated-authority substitution, alias scheduling, geometry or seed spoofing, gameplay/Strategy elevation, revision absence/cross-binding/substitution/revocation, and late-transaction failure are covered and pass.

## TDD Gate Compliance

- Task 1 RED `e40bc96` failed because explicit runtime-v1.19 Go scenario generation did not exist; GREEN `867fddf` passes exact TypeScript parity and current-selector preservation.
- Task 2 RED `9f80ee3` failed because exact revision admission and atomic candidate publication did not exist; GREEN `8a35c09` passes pure mutation and PostgreSQL rollback proof.

## Next Phase Readiness

- Plan 260-07 can gate completion and scoring on the persisted exact four-condition scenario and condition identities.
- Plans 260-08 and 260-09 can consume the frozen request/admission evidence for Go status parity and replay proof without deriving fairness or gameplay state.
- Plan 260-14 remains the sole activation owner; runtime-v1.19 has no route, default selector, or normal scheduler ownership in Go.
- The pre-existing user modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remain untouched and uncommitted.

## Self-Check: PASSED

- All five modified runtime/test files exist and all four RED/GREEN commits are present in git history.
- Focused and full PostgreSQL tests, full Go tests, parity, generated-authority, structural boundary, stub, and protected-baseline checks pass.
- No current selector, current preset, current arena, current pairwise output, protected user file, gameplay authority, or Strategy execution path changed.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
