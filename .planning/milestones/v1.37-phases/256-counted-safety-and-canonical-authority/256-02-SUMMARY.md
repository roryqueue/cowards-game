---
phase: 256-counted-safety-and-canonical-authority
plan: "02"
subsystem: spec-runtime-integrity
tags: [runtime-evidence, containment, conformance, fail-closed, privacy, tdd]
requires:
  - phase: 256-01
    provides: immutable semantic tuple registry and exact tuple resolver
provides:
  - exact evidence-derived executable lane eligibility evaluator
  - fail-closed runtime and counted-entry compatibility facades
  - separate allowlisted public and restricted operator evidence projections
affects: [persistence, runtime-service, go-backend, competition-entry, phase-256-attestation, phase-256-authority-bundle]
tech-stack:
  added: []
  patterns: [weakset-branded authority resolver, two-certificate eligibility floor, allowlisted evidence projection]
key-files:
  created:
    - packages/spec/src/runtime-evidence.ts
    - packages/spec/src/runtime-evidence.test.ts
  modified:
    - packages/spec/src/runtime.ts
    - packages/spec/src/competition-entry-eligibility.ts
    - packages/spec/src/competition-entry-eligibility.test.ts
    - packages/spec/src/public-output-privacy.ts
    - packages/spec/src/index.ts
    - packages/spec/src/versions.ts
    - packages/spec/src/integrity-authority.ts
    - packages/spec/src/spec.test.ts
key-decisions:
  - "Executable evidence authority is runtime-branded by a module-owned WeakSet; arbitrary resolver-shaped objects cannot assert verification."
  - "Containment and conformance remain independent floors: missing valid containment disables execution, while missing valid conformance permits exhibitions only."
  - "Legacy registry booleans remain descriptive compatibility data, but broker projections and every counted decision fail closed without canonical evidence."
  - "Public and operator evidence DTOs are separately constructed allowlists rather than redactions of one oversized internal record."
patterns-established:
  - "Evidence authority: callers carry immutable certificate references resolved through a verified authority instance, never certificate-shaped input objects."
  - "Reduce-only operations: operator disable wins, while re-enable merely re-runs evidence evaluation and cannot promote a lane."
requirements-completed: [SAFE-01, SAFE-02, SAFE-04, AUTH-01, AUTH-03]
coverage:
  - id: D1
    description: "Exact containment and conformance evaluator quarantines every lane until current full-identity evidence passes"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence.test.ts#v1.37 executable lane evidence"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Runtime and counted-entry compatibility facades derive counted readiness from the canonical evaluator"
    requirement: SAFE-02
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence.test.ts#routes runtime compatibility facades through canonical evidence"
        status: pass
      - kind: unit
        ref: "packages/spec/src/competition-entry-eligibility.test.ts#SAFE-02 fails provider proof closed without exact canonical lane evidence"
        status: pass
    human_judgment: false
  - id: D3
    description: "Separate public and operator evidence projections preserve useful status while rejecting nested private runtime and proof detail"
    requirement: SAFE-04
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence.test.ts#D-13 through D-15 projection and leak matrix"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec test"
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-07-13
status: complete
---

# Phase 256 Plan 02: Exact Runtime Evidence Eligibility Summary

**A branded two-certificate evaluator now keeps every runtime lane disabled or exhibition-only until exact current containment and conformance evidence proves the full executable identity.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-13T01:49:00Z
- **Completed:** 2026-07-13T01:59:30Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Added exact provider, language, runtime, toolchain, adapter, policy, corpus, artifact, build, and semantic-tuple identity binding with deterministic freshness, revocation, failure, registry-drift, and operator-disable decisions.
- Routed runtime product semantics and counted-entry decisions through the canonical evaluator, leaving every current descriptive broker lane non-counted without supplied Phase-256 evidence.
- Added separately typed public and operator projections with stable reason-code mapping, calm public copy, precise remediation, and nested privacy-leak rejection.

## Task Commits

Each TDD task was committed through RED and GREEN:

1. **Task 1 RED: executable evidence failure matrix** - `5b2ddc1` (test)
2. **Task 1 GREEN: exact evidence evaluator** - `a9c9c51` (feat)
3. **Task 2 RED: runtime and entry facade quarantine** - `66eb56a` (test)
4. **Task 2 GREEN: canonical facade convergence** - `ecae029` (feat)
5. **Task 3 RED: public/operator projection privacy** - `8ce5dd1` (test)
6. **Task 3 GREEN: allowlisted evidence projections** - `b467aed` (feat)

## Files Created/Modified

- `packages/spec/src/runtime-evidence.ts` - Exact identity contracts, certificate references, branded authority resolver, pure eligibility evaluator, and public/operator projections.
- `packages/spec/src/runtime-evidence.test.ts` - Quarantine, certificate mutation, freshness, facade, projection, and nested privacy matrix.
- `packages/spec/src/runtime.ts` - Evidence-derived counted compatibility semantics and non-counted broker projections.
- `packages/spec/src/competition-entry-eligibility.ts` - Canonical disabled/exhibition/countable entry decisions.
- `packages/spec/src/competition-entry-eligibility.test.ts` - Entry reason and fail-closed evidence coverage.
- `packages/spec/src/public-output-privacy.ts` - Evidence bytes, proof paths, host/toolchain diagnostics, credentials, and security detail denylist.
- `packages/spec/src/versions.ts` and `packages/spec/src/integrity-authority.ts` - Shared ABI ownership that prevents a runtime/authority import cycle.
- `packages/spec/src/index.ts` and `packages/spec/src/spec.test.ts` - Public export and updated quarantine contract coverage.

## Decisions Made

- Production authority construction remains intentionally unavailable in this plan. The only constructor is explicitly non-production and exists for deterministic unit fixtures; verified import and signed-bundle constructors belong to Plans 256-15 and 256-17.
- Certificate record hashes are safe projection identities; artifact hashes, bytes, source, diagnostics, storage paths, credentials, memory, objectives, and exploit detail remain restricted.
- A certificate is current only when the caller-supplied evaluation instant lies inclusively between issuance and freshness bounds. No wall-clock source is read.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Broke the runtime/evidence/authority import cycle**
- **Found during:** Task 2 full spec verification
- **Issue:** Importing the canonical evaluator into `runtime.ts` exposed an existing ABI constant ownership cycle, leaving the tuple's `runtimeAbi` uninitialized under the full spec import order.
- **Fix:** Moved the ABI constant beside other compatibility versions in `versions.ts`, re-exported it from `runtime.ts`, and made `integrity-authority.ts` depend directly on the version owner.
- **Files modified:** `packages/spec/src/versions.ts`, `packages/spec/src/runtime.ts`, `packages/spec/src/integrity-authority.ts`
- **Verification:** Focused evidence tests, authority tests, typecheck, and the 70-test spec suite passed.
- **Committed in:** `ecae029`

**2. [Rule 1 - Bug] Updated stale provider-label counted assertions**
- **Found during:** Task 2 full spec verification
- **Issue:** Three older spec tests still treated provider/adapter registry labels as counted authority, contradicting the newly required all-lane quarantine.
- **Fix:** Reframed those assertions to require non-counted behavior without exact evidence while retaining artifact/readiness metadata checks.
- **Files modified:** `packages/spec/src/spec.test.ts`
- **Verification:** `pnpm --filter @cowards/spec test` passed 70/70.
- **Committed in:** `ecae029`

---

**Total deviations:** 2 auto-fixed (1 blocking integration issue, 1 stale contract bug).
**Impact on plan:** Both fixes were required to make the canonical evaluator the sole counted authority; no gameplay state, Action legality, event order, outcome, or Strategy observation changed.

## Issues Encountered

- The Task 2 GREEN fixture initially used an adapter-version label instead of the exact registered `0.1.0` identity. The fixture was corrected before the GREEN commit and the wrong-lane case remains explicitly covered.

## User Setup Required

None - no external service configuration or package installation is required.

## Verification

- `pnpm --filter @cowards/spec exec vitest run src/runtime-evidence.test.ts src/competition-entry-eligibility.test.ts` - 30/30 passed.
- `pnpm --filter @cowards/spec typecheck` - passed.
- `pnpm --filter @cowards/spec test` - 70/70 passed.
- `pnpm exec tsx scripts/generate-v1-37-integrity-authority.ts --check` - committed authority artifacts remain current.
- All current broker entries report `countedResultsAllowed: false`; exact evidence tests prove counted promotion only with two current matching certificates.

## Next Phase Readiness

- Persistence, runtime-service, and Go enforcement plans can consume immutable references and canonical reason codes without accepting raw certificate-shaped objects.
- Verified certificate import and signed authority bundle work remain deliberately deferred to Plans 256-15 and 256-17; until then, no production lane can obtain counted evidence.
- No blockers. Existing v1.4 gameplay and the user-owned consolidated-spec edit were untouched.

## Self-Check: PASSED

- Both created files exist and all eight modified files are tracked.
- All six RED/GREEN task commits exist in order.
- Focused, typecheck, full spec, and authority artifact checks pass.
- No task-created stubs, package changes, network endpoints, auth paths, file-access paths, or schema changes were introduced.

---
*Phase: 256-counted-safety-and-canonical-authority*
*Completed: 2026-07-13*
