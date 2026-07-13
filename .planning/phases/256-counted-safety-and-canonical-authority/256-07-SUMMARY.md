---
phase: 256-counted-safety-and-canonical-authority
plan: "07"
subsystem: persistence-integrity-governance
tags: [historical-resolution, cohort-governance, standings, postgresql, append-only, tdd]
requires:
  - phase: 256-02
    provides: exact executable lane identity and evidence-derived counted decisions
  - phase: 256-04
    provides: nullable historical identity and append-only integrity authority schema
  - phase: 256-15
    provides: verified-attestation-closed certificate import
provides:
  - read-only resolved-historical, legacy-incomplete, and unresolved v1.4 projections
  - branded exact-current standings gate requiring a registered tuple and certified evidence for every entrant
  - deterministic cohort preview, append-only classification, compensation, and effective-event folding
  - standings recomputation derived from exact integrity resolution and effective governance events
affects: [phase-256-public-projections, phase-256-boundary-monitors, phase-259-conformance, ladder-standings]
tech-stack:
  added: []
  patterns: [weakset-branded resolution, deterministic framed hashes, transaction-time preview recheck, append-only compensation]
key-files:
  created: []
  modified:
    - packages/persistence/src/integrity-evidence.ts
    - packages/persistence/src/integrity-evidence.test.ts
    - packages/persistence/src/governance.ts
    - packages/persistence/src/governance.test.ts
    - packages/persistence/src/standings-recompute.ts
    - packages/persistence/src/standings-recompute.test.ts
key-decisions:
  - "Historical v1.4 eligibility is a branded read-only projection from persisted anchors plus an immutable release manifest; it never becomes current certification."
  - "Current standings points require a branded exact MatchSet identity whose complete entrant set remains counted with EVIDENCE_CURRENT."
  - "Integrity correction authority is the append-only cohort event fold; mutable MatchSet status actions cannot perform counted, non-counted, invalid, or invalidated corrections."
patterns-established:
  - "Read-only history: source hashes include original version anchors, counted meaning, and outcome, while resolution returns cloned/frozen projections and performs no query."
  - "Governance fold: lock, re-evaluate exact predicate, compare preview hash/count/sample, append monotonic event, then recompute from effective events."
requirements-completed: [SAFE-03, SAFE-04, AUTH-03, AUTH-04]
coverage:
  - id: D1
    description: "Historical v1.4 evidence resolves read-only as resolved-historical, legacy-incomplete, or unresolved without changing original outcome or counted meaning"
    requirement: AUTH-04
    verification:
      - kind: unit
        ref: "packages/persistence/src/integrity-evidence.test.ts#historical and legacy integrity resolution"
        status: pass
      - kind: integration
        ref: "packages/persistence/src/governance.test.ts#PostgreSQL append-only integrity cohort governance source-row hash"
        status: pass
    human_judgment: false
  - id: D2
    description: "Current standings points require one exact registered tuple and certified evidence for every entrant while every failure class stays visible but excluded"
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "packages/persistence/src/integrity-evidence.test.ts#current standings integrity resolution"
        status: pass
      - kind: unit
        ref: "packages/persistence/src/standings-recompute.test.ts#rejected current identity matrix"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only explicitly resolved historical v1.4 evidence can retain its persisted original-semantic standings eligibility"
    requirement: SAFE-03
    verification:
      - kind: unit
        ref: "packages/persistence/src/standings-recompute.test.ts#resolved historical original counted meaning"
        status: pass
    human_judgment: false
  - id: D4
    description: "Cohort findings use deterministic previews, append-only monotonic classification and compensation, and event-derived standings recomputation"
    requirement: SAFE-03
    verification:
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/integrity-evidence.test.ts src/governance.test.ts src/standings-recompute.test.ts (47 passed)"
        status: pass
      - kind: unit
        ref: "pnpm --filter @cowards/persistence test (155 passed, 12 skipped)"
        status: pass
    human_judgment: false
duration: 12min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 07: Historical Resolution and Cohort Governance Summary

**Historical v1.4 evidence now resolves without writes, while exact current certification and append-only cohort events are the only paths to standings points or integrity correction.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-13T04:43:00Z
- **Completed:** 2026-07-13T04:55:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added immutable historical projections that distinguish resolved v1.4, incomplete legacy, and unresolved evidence while retaining original outcomes and counted meaning.
- Added an exact current standings gate for registered tuple expansion, complete entrant certification, and certified Strategy Revision coverage; every missing, unknown, mixed, uncertified, incomplete, or unresolved input remains visible but scores zero.
- Added deterministic exact-ID cohort previews, transaction-time drift rejection, reproducible evidence requirements, monotonic append-only classification and compensation, and effective-event standings recomputation.

## Task Commits

Each TDD task was committed through RED and GREEN:

1. **Task 1 RED: historical resolution contract** - `9a926a9` (test)
2. **Task 1 GREEN: read-only v1.4 resolver** - `ab13a86` (feat)
3. **Task 2 RED: governance and standings gates** - `1e9373e` (test)
4. **Task 2 GREEN: append-only event fold and exact scoring gate** - `6be9b10` (feat)

## Files Created/Modified

- `packages/persistence/src/integrity-evidence.ts` - Read-only historical resolver, source-row hashing, branded current resolution, and exact standings eligibility.
- `packages/persistence/src/integrity-evidence.test.ts` - Resolved/incomplete/unresolved history plus missing/unknown/mixed/uncertified current identity matrix.
- `packages/persistence/src/governance.ts` - Stable predicate AST, cohort preview, evidence validation, append, compensation, fold, and transactional recomputation services.
- `packages/persistence/src/governance.test.ts` - Determinism, documentation-only rejection, mutable-path retirement, configured PostgreSQL append-only/rollback/source-hash proof.
- `packages/persistence/src/standings-recompute.ts` - Exact integrity and effective-classification gates before score aggregation.
- `packages/persistence/src/standings-recompute.test.ts` - Certified current, historical original-semantic, exclusion, compensation, and stable tie-break coverage.

## Decisions Made

- Required both persisted `cowards-rules-v1.4` and `chronicle-v1.4` anchors for historical resolution; partial anchors remain `legacy_incomplete` and conflicts remain `unresolved`.
- Kept historical compatibility in a separately named `historicalCompatibility` projection with no containment, conformance, authority-bundle, or registry fields, preventing an old row from being upgraded to current proof.
- Stored predicate AST, sample IDs, and exact evidence references in the immutable event payload while using fixed-field framed hashes for preview and evidence identities.
- Used a transaction-scoped PostgreSQL advisory lock and zero-padded global event sequence in event IDs so concurrent apply/compensate operations remain monotonic without a mutable counter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Retired mutable status updates as an integrity-correction bypass**
- **Found during:** Task 2 authority review
- **Issue:** The older group governance API could still directly set counted, non-counted, invalid, or invalidated MatchSet status without an exact cohort preview or reproducible evidence.
- **Fix:** Those integrity-sensitive actions now fail with a conflict and direct callers to the append-only cohort service; review holds and non-integrity competition policy remain separate.
- **Files modified:** `packages/persistence/src/governance.ts`, `packages/persistence/src/governance.test.ts`
- **Verification:** Focused unit test proves rejection occurs before pool connection; configured PostgreSQL event/recompute proof remains green.
- **Committed in:** `6be9b10`

---

**Total deviations:** 1 auto-fixed (1 missing critical authority control).
**Impact on plan:** The fix closes the exact mutable-authority path the plan required replacing; it does not rewrite historical evidence or change gameplay semantics.

## Issues Encountered

- Package typecheck still reports concurrent/pre-existing Plan-256 writer migration errors in `competition.ts`, `dev-smoke.ts`, `ladder.ts`, `matchset-service.test.ts`, `match-service.test.ts`, and `workshop.ts` because their creation inputs have not yet adopted the exact integrity identity contract. No typecheck error remains in this plan's implementation files; focused and full persistence tests pass. The owning caller-migration plans remain responsible for those sites.
- The first fold unit expectation included the restoration event without its required compensation record. The test was corrected to model the append-only lifecycle accurately before GREEN was committed.

## User Setup Required

None - the configured local PostgreSQL topology was exercised through a disposable schema.

## Verification

- Configured PostgreSQL focused run: 47/47 passed, including preview drift rollback, source-row hash equality, append-only trigger rejection, compensation, and recomputed points.
- `pnpm --filter @cowards/persistence test`: 155 passed, 12 skipped.
- `git diff --check`: passed.
- Historical resolver contains no database dependency or query path; all write SQL remains confined to current identity persistence and append-only governance services.

## Next Phase Readiness

- Public/operator projections can consume explicit historical resolution and effective finding state without exposing exact runtime evidence internals.
- Boundary monitors can now reject direct integrity status mutation and require the cohort append/compensate service.
- Phase 259 conformance can mint exact current evidence that the standings gate will accept; until then unresolved or uncertified current MatchSets remain non-counted.
- No original Match, MatchSet, Chronicle, entrant, score, execution evidence, or v1.4 artifact was rewritten.

## Self-Check: PASSED

- All six planned files exist and the four RED/GREEN commits are ordered.
- All task acceptance criteria and plan verification commands pass, including configured PostgreSQL proof.
- The protected dirty consolidated spec and `.planning/config.json` remained unstaged and untouched.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
