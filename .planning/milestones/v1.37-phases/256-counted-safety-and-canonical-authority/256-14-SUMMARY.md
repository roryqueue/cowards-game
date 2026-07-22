---
phase: 256-counted-safety-and-canonical-authority
plan: "14"
subsystem: integrity-proof-and-drift-guards
tags: [authority, historical-dispatch, audit-baseline, postgres, privacy, boundary-monitors]
requires:
  - phase: 256-01-through-256-19
    provides: canonical tuple, executable evidence, publication, runtime, creation, lifecycle, privacy, and worker-retirement foundations
provides:
  - current-source v1.37 ownership, writer, promotion, privacy, request-envelope, receipt, and known-debt drift guards
  - read-only v1.36 proof dispatch pinned to the annotated release tag and archived validator/source blobs
  - exact seven-probe current-HEAD compatibility baseline with deterministic rerun and privacy enforcement
  - complete PostgreSQL, runtime-service, Go, worker, historical, and serialized boundary proof chain
affects: [phase-257-transition-kernel, phase-258-canonical-json, phase-259-conformance, milestone-audit]
tech-stack:
  added: []
  patterns: [version-pinned Git-object validation, exact semantic reproduction baseline, serialized drift-gate composition, receipt-bound Chronicle persistence]
key-files:
  created:
    - scripts/check-v1-36-historical-proof.ts
    - .planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json
    - .planning/artifacts/v1.37-core-rules-audit-baseline.json
    - .planning/artifacts/v1.37-core-rules-audit-baseline.md
  modified:
    - scripts/check-v1-37-integrity-boundaries.ts
    - scripts/check-boundary-monitors.ts
    - package.json
    - packages/persistence/src/chronicle-store.ts
    - apps/web/app/api/test-support/run-worker-once/route.ts
key-decisions:
  - "Active v1.37 evidence is validated from current source, while v1.36 history is validated only from the pinned annotated tag's archived artifact and validator/source blobs."
  - "The Phase-256 gameplay baseline is exactly six reproduced defects plus the preserved successful-push RIGHT ruling; later owners may change it only through explicit compatibility approval."
  - "Runtime and broker registry labels remain descriptive compatibility metadata and never grant counted eligibility without current executable evidence."
  - "A current Chronicle copies the exact immutable publication/install receipt and source set from its locked MatchSet; runtime responses remain comparison input and cannot authorize persistence."
patterns-established:
  - "Historical validators execute inside a read-only archived snapshot with frozen evaluation time and byte/mtime non-rewrite proof."
  - "Current integrity gates combine parsed ownership inventories, exact source fingerprints, deterministic audit reruns, and safe named findings."
  - "Generated legacy inventories are refreshed when current production surfaces change, but immutable v1.36 release artifacts are never regenerated."
requirements-completed: [SAFE-01, SAFE-02, SAFE-03, SAFE-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05]
coverage:
  - id: D1
    description: "Current v1.37 source and immutable v1.36 history have independent executable drift guards"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "scripts/check-v1-37-integrity-boundaries.test.ts and scripts/check-v1-36-historical-proof.test.ts#49 focused tests"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-36-historical-proof.ts && pnpm v1.37:integrity-boundaries:check"
        status: pass
    human_judgment: false
  - id: D2
    description: "The exact seven-probe compatibility baseline persists six defects and the successful-push RIGHT ruling without semantic change"
    requirement: AUTH-04
    verification:
      - kind: integration
        ref: "pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts"
        status: pass
      - kind: unit
        ref: "scripts/check-v1-37-integrity-boundaries.test.ts#v1.37 core-rules audit baseline"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every active writer, runtime, worker, Go lifecycle, PostgreSQL receipt, privacy, and boundary path passes the complete serialized proof gate"
    requirement: SAFE-01
    verification:
      - kind: integration
        ref: "Task 3 PostgreSQL/spec/persistence/runtime-service/worker/Go verification command"
        status: pass
      - kind: integration
        ref: "pnpm boundary:monitors"
        status: pass
    human_judgment: false
  - id: D4
    description: "Chronicle completion persists and conflict-checks the exact locked MatchSet authority publication receipt and source set"
    requirement: AUTH-02
    verification:
      - kind: integration
        ref: "DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game pnpm --filter @cowards/persistence exec vitest run src/complete-match.test.ts -t PostgreSQL"
        status: pass
    human_judgment: false
duration: 37min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 14: Integrity Drift Guards and Complete Proof Gate Summary

**Current v1.37 authority is structurally guarded, v1.36 evidence is validated from immutable release objects, all seven gameplay probes remain exact, and the full PostgreSQL/runtime/Go boundary chain passes.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-07-13T05:18:08-04:00
- **Completed:** 2026-07-13T05:54:34-04:00
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments

- Added synthetic and live structural enforcement for authority ownership, creation/SQL writers, schedulers, UI rules, adapter classification, arena ownership, promotion paths, request-carried authority, publication provenance, anti-rollback, Go receipt locking, runtime request envelopes, privacy, and exact Phase-257 debt fingerprints.
- Pinned the annotated `v1.36` tag object, peeled archive commit, eight proof artifacts, and eleven validator/source blobs; archived validators run read-only with byte and mtime preservation while current-source edits cannot alter historical status.
- Persisted a deterministic current-HEAD JSON/Markdown baseline and rerun guard for all seven core-rules probes: six defects reproduce exactly and successful-push reversal history remains `RIGHT`.
- Wired current integrity, worker retirement, immutable history, authority artifact checks, and refreshed surface inventories into the default serialized boundary chain, then passed the full spec, persistence, PostgreSQL, runtime-service, worker, Go, privacy, and historical gate.
- Closed a receipt propagation gap so current Chronicle completion copies and conflict-checks all 21 authority/tuple/pair fields from the locked MatchSet transactionally.

## Task Commits

1. **Task 1 RED: integrity drift and history-dispatch tests** - `e543d91` (test)
2. **Task 1 GREEN: structural sentinels and archived proof dispatch** - `c28015b` (feat)
3. **Task 2 RED: exact audit-baseline guards** - `d92a80f` (test)
4. **Task 2 GREEN: deterministic seven-probe baseline** - `7ddf281` (feat)
5. **Task 3: complete writer-to-runtime proof gate** - `322b4a9` (feat)

## Files Created/Modified

- `scripts/check-v1-37-integrity-boundaries.ts` - Current-source ownership, writer, promotion, privacy, receipt, request-envelope, known-debt, and audit-baseline evaluator.
- `scripts/check-v1-36-historical-proof.ts` - Git-object-pinned, read-only archived validator dispatcher.
- `.planning/artifacts/v1.37-v1.36-historical-proof-dispatch.json` - Exact tag, commit, artifact, source blob, hash, and byte manifest.
- `.planning/artifacts/v1.37-core-rules-audit-baseline.json` - Machine-readable seven-probe compatibility baseline.
- `.planning/artifacts/v1.37-core-rules-audit-baseline.md` - Human-readable observations and future-phase ownership.
- `scripts/check-boundary-monitors.ts` and `package.json` - Version-aware current/history/retirement/default gate composition.
- `packages/persistence/src/chronicle-store.ts` - Receipt-bound current Chronicle insert and conflict reconciliation.
- `apps/web/app/api/test-support/run-worker-once/route.ts` - Permanently closed historical direct-worker public route.
- `.planning/artifacts/v1.16-*` and `.planning/artifacts/v1.17-runtime-broker-registry.json` - Regenerated current surface inventories and corrected evidence-only broker posture.

## Decisions Made

- Current source can evolve only under v1.37 guards; no current evaluator is permitted to reinterpret or regenerate v1.36 proof.
- The audit artifact records observations, not approvals: defects remain owned by Phases 257-259 and the `RIGHT` push history is a preserved v1.4 fixture.
- Static language/adapter support remains useful descriptive metadata, but every unaccompanied runtime request is non-counted.
- Chronicle authority comes from the locked persisted MatchSet receipt and exact source set, never from a request or runtime response body.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Boundary Bug] Retired a stale public direct-worker test-support route**
- **Found during:** Task 1 live structural evaluation
- **Issue:** `/api/test-support/run-worker-once` could still spawn the retired TypeScript worker and open a database pool from a production route tree.
- **Fix:** Made the route unconditionally return 404 and added source assertions forbidding worker, runtime, and database reachability.
- **Files modified:** `apps/web/app/api/test-support/run-worker-once/route.ts`, `route.test.ts`
- **Verification:** Focused route tests and both worker/integrity structural sentinels pass.
- **Committed in:** `c28015b`

**2. [Rule 1 - Data Integrity Bug] Completed Chronicles omitted the new immutable publication receipt fields**
- **Found during:** Task 3 real PostgreSQL verification
- **Issue:** Chronicle insertion supplied tuple and ordered-pair evidence but not publication/install/source-set fields, violating the 21-field all-or-none constraint before the intended transactional completion proof.
- **Fix:** Copied all authority fields from the locked MatchSet in the insert, required exact MatchSet equality on conflict, and extended the PostgreSQL fixture/assertions.
- **Files modified:** `packages/persistence/src/chronicle-store.ts`, `packages/persistence/src/complete-match.test.ts`
- **Verification:** Focused and full selected PostgreSQL completion suites pass, including forced late rollback and exact success.
- **Committed in:** `322b4a9`

**3. [Rule 3 - Blocking] Updated a stale authority-reference schema fixture**
- **Found during:** Task 3 spec gate
- **Issue:** The authority-bundle test fixture predated required publication and scheduling-decision references.
- **Fix:** Added complete reference-only publication/decision fields and kept disabled, exhibition, and counted cases semantically consistent.
- **Files modified:** `packages/spec/src/runtime-evidence-authority-bundle.test.ts`
- **Verification:** Focused spec gate passes 71/71.
- **Committed in:** `322b4a9`

**4. [Rule 1/3 - Drift Guard] Reconciled legacy inventories and static-counted monitor assumptions**
- **Found during:** Task 3 default boundary chain
- **Issue:** Current Phase-256 surfaces made the v1.16 inventories stale, the legacy worker monitor required a now-deleted pool path, and the v1.17 broker artifact/monitor still treated descriptive support labels as counted authority.
- **Fix:** Regenerated inventories/labels, required the stronger permanently retired entrypoint, and made every broker entry evidence-only for counted evaluation.
- **Files modified:** `.planning/artifacts/v1.16-*`, `.planning/artifacts/v1.17-runtime-broker-registry.json`, `scripts/check-boundary-monitors.ts`
- **Verification:** `pnpm boundary:monitors` and all 24 boundary-monitor tests pass.
- **Committed in:** `322b4a9`

---

**Total deviations:** 4 auto-fixed (2 integrity/boundary bugs, 1 blocking fixture, 1 drift-chain reconciliation).
**Impact on plan:** Every fix was required to make the planned end-to-end proof truthful. No gameplay semantics, v1.36 bytes, package dependencies, or public data boundaries changed.

## Issues Encountered

- Historical validator execution initially needed package-level dependency symlinks inside the read-only archived snapshot; the dispatcher now supplies only dependency resolution links while archived source and artifacts remain immutable.
- The default boundary chain deliberately exposed stale pre-v1.37 assumptions. All were reconciled and the complete rerun is green; no issue remains open.

## User Setup Required

None - no external service configuration or package installation is required.

## Verification

- Spec focused authority/evidence suite: 71/71 passed; spec typecheck passed.
- Persistence focused suite: 157 passed, 24 skipped; selected PostgreSQL suite: 49 passed, 87 skipped; persistence typecheck passed.
- Runtime-service: package-wide typecheck and 53/53 tests passed.
- Worker: 34/34 tests; focused history/publisher/retirement suite: 19/19 passed.
- Go: focused authority/lifecycle suite and real-PostgreSQL creation/lifecycle/completion suite passed; full Go parity inside `boundary:monitors` passed.
- Structural/history/audit suite: 49/49 passed; `v1.36_historical_proof=passed artifacts=8 sources=11`; seven observations exact.
- Default serialized boundary chain: all checks passed; boundary-monitor unit suite 24/24 passed.
- The eight v1.36 artifacts remain byte-identical to tag `v1.36`; the user-owned consolidated spec and `.planning/config.json` remain unstaged.

## Next Phase Readiness

- Phase 256 is complete and its complete proof chain is executable from the default boundary command.
- Phase 257 can fix the three transition defects and arena semantic defect while preserving `RIGHT` push history under exact debt fingerprints and the persisted compatibility baseline.
- Phase 258 owns the deep-memory `RangeError`; Phase 259 owns active-schema historical boundary handling. Any observed semantic delta still requires explicit approval.

## Self-Check: PASSED

- All four created Plan-14 artifacts and both evaluator scripts exist and are committed.
- All five TDD/task commits exist in history.
- Task-level, package, PostgreSQL, Go, historical, audit, privacy, and full serialized boundary gates pass.
- Protected dirty files remain untouched and unstaged; no v1.36 artifact was rewritten.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
