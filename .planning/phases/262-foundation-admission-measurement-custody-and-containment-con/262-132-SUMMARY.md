---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "132"
subsystem: custody-review
tags: [tdd, git-authentication, observation-validation, fail-closed, no-effect]
requires:
  - Plan131 v4 publication b8078221 and summary 6a82901a
  - committed Plan131 code review f45ee38d
provides:
  - reusable strict-descendant authentication rooted at the exact Plan131 summary
  - hostile-input validation for six exact ordered genuine v4 observations
  - explicit Plan133 and Plan110 denial pending independent review of the corrected source
affects: [262-133, 262-110]
tech-stack:
  added: []
  patterns: [isolated bare metadata snapshot, strict summary ancestry gate, derived observation aggregates, immutable invalid-history disposition]
key-files:
  created:
    - scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts
    - scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-132-SUMMARY.md
  modified: []
key-decisions:
  - "Plan131 v4 remains immutable process-invalid history; stored true eligibility is never current authority."
  - "Observation counts and roots are derived only after exact six-record validation; aggregate fields in caller input are rejected."
  - "Plan132 correction keeps both Plan133 and Plan110 eligibility false pending independent review of the hardened source."
requirements-completed: [ADMIT-04, MEAS-02, MEAS-04, MEAS-09, MEAS-10, SEAL-01]
coverage:
  - id: D1
    description: "Authenticate any strict descendant of exact summary 6a82901a without a direct-child topology assumption."
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts#accepts tracking, review, planning, and current strict descendants"
        status: pass
    human_judgment: false
  - id: D2
    description: "Derive six-mode authority only from exact unique ordered genuine observations and reject forged aggregates."
    requirement: MEAS-10
    verification:
      - kind: unit
        ref: "scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts#observation authority tests"
        status: pass
    human_judgment: false
  - id: D3
    description: "Keep Plan110, execution, producer, readiness, live, effect, capacity, and downstream authority closed."
    requirement: SEAL-01
    verification:
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts --check-source-only"
        status: pass
    human_judgment: false
metrics:
  duration: 6m
  completed: 2026-08-31
status: complete
---

# Phase 262 Plan 132: Live-v13 Custody v5 Correction Summary

Additive v5 correction authenticating arbitrary strict summary descendants and deriving six-mode evidence only from exact genuine observations while Plan110 remains denied.

## Performance

- **Duration:** 6m
- **Started:** 2026-08-31T01:30:01Z
- **Completed:** 2026-08-31T01:36:08Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- Replaced the invalid immediate-child assumption with reusable authentication of any strict descendant of exact summary `6a82901a`, while retaining exact parent, one-add summary scope, three-add publication scope, current-byte equality, and no-rewrite checks.
- Validated exactly six unique observations in canonical mode/status order, recomputing per-observation roots, local execution custody joins, mode-specific reduced values, and the aggregate observations root.
- Rejected empty, missing, duplicate, reordered, forged-status, forged-root, forged-reduced-value, forged-custody, nonzero-producer, and caller-supplied aggregate inputs before eligibility derivation.
- Preserved the v4 trio, review, summary, and tracking history byte-for-byte as `process_invalid_descendant_and_observation_validation`; Plan133 and Plan110 remain false pending independent review of the hardened correction.
- Closed committed review blockers `CR-01` and `CR-02` by routing every Git read through the isolated replacement-disabled custody runner and removing caller-provided payloads from the exported validator trust boundary.
- Closed V2 review blocker `CR-03` by binding history reads to a private bare metadata snapshot, so concurrent graft, shallow, or local-config insertion cannot forge ancestry or conceal protected-path history.

## Task Commits

1. **Task 1 RED: strict-descendant tests** - `cd5148ea`
2. **Task 1 GREEN: arbitrary strict-descendant authentication** - `4b11d0a9`
3. **Task 2 RED: hostile observation authority tests** - `8e8c7de7`
4. **Task 2 GREEN: genuine-observation aggregate derivation** - `36fba458`
5. **Review correction RED: hostile replacement and forged-payload tests** - `772ca8b6`
6. **Review correction GREEN: isolated Git and internal payload authentication** - `26c57dfe`
7. **V2 correction RED: mutable metadata race and root-first forgery tests** - `26ffbcd9`
8. **V2 correction GREEN: isolated bare metadata snapshot** - `52d35eb8`

## Files Created/Modified

- `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.ts` - Read-only v5 history authenticator, observation validator, and source-only correction renderer.
- `scripts/check-v1-38-plan-262-132-live-v13-custody-v5.test.ts` - Strict-descendant, immutable-scope, hostile aggregate, and observation mutation coverage.
- `.planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-132-SUMMARY.md` - Execution and verification record.

## Decisions Made

- Exact committed v4 observation bytes are necessary but not sufficient: v5 independently validates their schema, sequence, custody relationships, reduced semantics, and roots before counting them.
- Literal-zero independent findings are represented by an exact empty findings array; caller-provided count/root fields are rejected rather than compared or trusted.
- A source correction cannot self-authorize Plan133 review or Plan110. Independent review must first authenticate the hardened commit; product, production, public, capacity, reset, readiness, live, producer, and downstream authority remain denied.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rejected ambient Git replacement and repository metadata attacks**

- **Found during:** Committed adversarial review `2bdaf3d8` (`CR-01`)
- **Issue:** Ambient replacement refs could forge strict-summary ancestry for an unrelated commit.
- **Fix:** Routed every Git text/byte/ancestry operation through the existing isolated runner and rejected replace refs, dangerous local config, grafts, and shallow history before authentication.
- **Verification:** A temporary clone with a forged replacement parent fails `V138_PLAN132_REPLACE_REF_FORBIDDEN`.
- **Commit:** `26c57dfe`

**2. [Rule 1 - Bug] Removed caller-forged payload trust from the exported validator**

- **Found during:** Committed adversarial review `2bdaf3d8` (`CR-02`)
- **Issue:** A caller could construct self-consistent fake custody roots and supply the payload used as their own trust anchor.
- **Fix:** The exported validator now takes a repository root and internally authenticates exact committed history; the payload-backed validator is private.
- **Verification:** A self-consistent six-observation/payload forgery fails before an aggregate is returned.
- **Commit:** `26c57dfe`

**3. [Rule 1 - Bug] Bound every history read against concurrent metadata mutation**

- **Found during:** Committed V2 review `3bfb7dc2` (`CR-03`)
- **Issue:** Graft, shallow, and dangerous local configuration were checked before use but remained mutable between isolated Git subprocesses.
- **Fix:** Resolved and reauthenticated source metadata, then ran every ancestry, object, tree, and path-history query through a private bare metadata snapshot containing only fixed config, bound HEAD, and the explicit content-addressed object store.
- **Verification:** A hostile clone injects graft, shallow, and config after the initial check while hiding a rewrite; authentication still reports the protected rewrite.
- **Commit:** `52d35eb8`

**4. [Rule 1 - Test] Exercised forged observations through the current API**

- **Found during:** Committed V2 review `3bfb7dc2` (`WR-01`)
- **Issue:** The forged-observation regression used obsolete argument order and rejected before inspecting observations.
- **Fix:** Calls `validateV138Plan132ObservationsForReview(ROOT, payload.observations)` directly.
- **Verification:** The self-consistent forgery reaches internally authenticated history and fails `V138_PLAN132_OBSERVATIONS_INVALID`.
- **Commit:** `26ffbcd9`

**Total deviations:** 4 auto-fixed issues (3 bugs, 1 test correction). **Impact:** Trust boundaries were tightened without effects or downstream eligibility.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Verification

- Focused serialized Vitest: 1 file, 9 tests passed, including replacement-ref, concurrent graft/shallow/config, hidden-rewrite, and self-consistent forged-payload attacks.
- Source-only CLI: 6 validated modes, 0 findings, Plan133 false, Plan110 false, producer/readiness/live calls zero or false, downstream authority denied.
- TypeScript: `pnpm exec tsc --noEmit` passed.
- `git diff --check` passed.

## Known Stubs

None.

## Next Phase Readiness

The hardened Plan132 source requires fresh independent review before Plan133 can proceed. No Plan133 eligibility, v5 evidence publication, Plan110 eligibility, live execution, producer call, effect, capacity, or downstream authority exists.

## Self-Check: PASSED

- Both source/test files and this summary exist.
- Task commits `cd5148ea`, `4b11d0a9`, `8e8c7de7`, `36fba458`, `772ca8b6`, `26c57dfe`, `26ffbcd9`, and `52d35eb8` exist.
- Exact v4 trio, review, summary, and closeout bytes remain protected and unchanged.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-31*
