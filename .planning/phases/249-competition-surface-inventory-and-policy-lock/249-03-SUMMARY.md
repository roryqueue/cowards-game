---
phase: 249-competition-surface-inventory-and-policy-lock
plan: 03
subsystem: tooling
tags: [competition-policy, boundary-monitors, privacy-scan, vitest, tdd]

requires:
  - phase: 249-01
    provides: spec-owned competition-policy-v1.36 posture, privacy exclusions, and forbidden-claim taxonomy
  - phase: 249-02
    provides: v1.36 competition surface inventory evaluator and Markdown/JSON artifacts
provides:
  - v1.36 competition policy package scripts
  - Broad local copy/privacy scanner with documented suppression schema
  - Registered v1.36 competition policy check in the boundary monitor hub and package chain
affects: [phase-249, phase-250, phase-251, phase-252, phase-253, phase-254, phase-255]

tech-stack:
  added: []
  patterns: [local static scanner, documented suppressions, monitor wrapper registration, TDD red-green monitor tests]

key-files:
  created:
    - .planning/phases/249-competition-surface-inventory-and-policy-lock/249-03-SUMMARY.md
  modified:
    - scripts/evaluate-v1-36-competition-policy.ts
    - scripts/evaluate-v1-36-competition-policy.test.ts
    - scripts/check-boundary-monitors.ts
    - scripts/check-boundary-monitors.test.ts
    - package.json

key-decisions:
  - "The v1.36 scanner remains local-file-only and excludes generated/build/cache outputs from default scanning."
  - "Policy examples, research guardrails, and test fixtures use documented suppression records instead of ad hoc allow-all regexes."
  - "The boundary monitor hub preserves existing v1.35 checks and adds a named v1.36 competition policy check."

patterns-established:
  - "Broad public-copy scans should require clear positive public exposure or overclaim wording and treat negated guardrail copy as allowed."
  - "Suppression records require path, category, rationale, owner, and expiry and apply only to exact normalized path/category pairs."

requirements-completed: [POST-01, POST-02, POST-03, POST-04, POST-05]

duration: 14min
completed: 2026-06-15
---

# Phase 249 Plan 03: Competition Policy Monitor Summary

**Fail-loud v1.36 competition policy monitor wired into package scripts and the boundary monitor chain with scanner coverage for public posture, forbidden overclaims, privacy markers, and posture-copy requirements.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-06-15T23:32:00Z
- **Completed:** 2026-06-15T23:46:35Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added RED monitor/scanner tests for package scripts, boundary monitor registration, default roots, text filtering, forbidden/private marker failures, required posture-label failures, and documented suppressions.
- Implemented `scanV136CompetitionPolicyTextRoots`, `checkV136CompetitionPolicyScan`, `V136CompetitionPolicyScanSuppression`, default roots/extensions, generated/build filtering, binary null-byte skip, and inventory-driven posture checks.
- Added `v1.36:competition-policy` and `v1.36:competition-policy:check` scripts, inserted the check before `scripts/check-boundary-monitors.ts`, and registered `v1.36 competition policy` in the monitor hub.

## Task Commits

1. **Task 1: Add monitor and script wiring tests** - `4def073` (test)
2. **Task 2: Register the v1.36 monitor and package scripts** - `2f0cf35` (feat)
3. **Task 3: Run final Phase 249 validation gates** - no code changes after verification; summary commit records the validation result.

**Plan metadata:** recorded by the final docs commit for this summary.

## Files Created/Modified

- `scripts/evaluate-v1-36-competition-policy.ts` - Added broad text scanning, default roots/extensions, suppression schema, posture checks, and combined CLI `--check`.
- `scripts/evaluate-v1-36-competition-policy.test.ts` - Added scanner and suppression coverage.
- `scripts/check-boundary-monitors.ts` - Added `checkV136CompetitionPolicyMonitor` and registered it in `runBoundaryMonitorChecks`.
- `scripts/check-boundary-monitors.test.ts` - Added package script, monitor wrapper, failure, and full-chain inclusion tests.
- `package.json` - Added v1.36 write/check scripts and chained the check into `boundary:monitors`.
- `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-03-SUMMARY.md` - Plan completion record.

## Decisions Made

- Kept scanner scope to static local files and did not start services, browser, Go backend, Docker, runtime-service, database, or Strategy execution.
- Used documented suppressions for intentional policy examples, research guardrails, downstream posture-copy handoffs, and test fixtures.
- Did not update `.planning/STATE.md` or `.planning/ROADMAP.md`; the orchestrator owns central tracking for this run.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Calibrated broad scanner against existing policy and research artifacts**
- **Found during:** Task 2 (Register the v1.36 monitor and package scripts)
- **Issue:** The first scanner pass correctly failed on clear overclaim examples, but also matched intentional policy taxonomy, research guardrails, and internal test/example text.
- **Fix:** Added documented default suppressions, generated/build/test path filtering, positive public-exposure matching for private markers, and negated guardrail calibration for phrases such as "must not", "never expose", "omit", and "but not".
- **Files modified:** `scripts/evaluate-v1-36-competition-policy.ts`
- **Verification:** `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts`; `pnpm v1.36:competition-policy:check`; `pnpm exec tsx scripts/check-boundary-monitors.ts`
- **Committed in:** `2f0cf35`

---

**Total deviations:** 1 auto-fixed (1 blocking calibration issue).
**Impact on plan:** The scanner remains fail-loud for clear product overclaims and public/private exposure claims while avoiding archived/generated/internal false positives.

## Issues Encountered

- The exact `grep -R` scope gates traversed generated `.next` cache files and binary Turbopack artifacts. I stopped those broad scans and reran equivalent `rg` gates with build/dependency/cache excludes. The resulting lines were policy examples, tests, existing runtime-boundary code, or explicit non-goal/handoff text, not new Phase 249 product behavior.

## User Setup Required

None - no external service configuration required.

## Verification

- `pnpm exec vitest run scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` - passed, 35 tests.
- `pnpm v1.36:competition-policy:check` - passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` - passed; includes `[PASS] [contract_drift] v1.36 competition policy`.
- `pnpm exec vitest run packages/spec/src/spec.test.ts scripts/evaluate-v1-36-competition-policy.test.ts scripts/check-boundary-monitors.test.ts` - passed, 79 tests.
- `pnpm boundary:monitors` - passed, including v1.35 checks and `pnpm v1.36:competition-policy:check`.
- Scope/privacy grep gates - reviewed with generated/cache excludes; no clear Phase 249 product-scope violation introduced.

## Boundary Monitor Result

`pnpm boundary:monitors` completed successfully. The package chain now runs `pnpm v1.36:competition-policy:check` after `pnpm v1.35:final-proof:check` and before `pnpm exec tsx scripts/check-boundary-monitors.ts`.

## Known Stubs

None. Stub scan found no `TODO`, `FIXME`, placeholder copy, hardcoded empty UI values, or unwired mock data in the plan files.

## Threat Flags

None. The new filesystem access is the planned static local scanner for public-copy/privacy drift and does not introduce network endpoints, auth paths, database boundaries, runtime execution, Strategy execution, service-backed proof, or product mutations.

## TDD Gate Compliance

- RED commit present: `4def073`
- GREEN commit present after RED: `2f0cf35`
- REFACTOR commit: not needed

## Self-Check: PASSED

- Found created/modified files: `scripts/evaluate-v1-36-competition-policy.ts`, `scripts/evaluate-v1-36-competition-policy.test.ts`, `scripts/check-boundary-monitors.ts`, `scripts/check-boundary-monitors.test.ts`, `package.json`, and this summary.
- Found task commits: `4def073` and `2f0cf35`.
- Re-ran final verification gates: focused Vitest, combined spec/monitor Vitest, v1.36 policy check, standalone monitor hub, and `pnpm boundary:monitors` all passed.

## Next Phase Readiness

Phase 249 now has the policy contract, synchronized competition surface inventory, package scripts, and fail-loud boundary monitor coverage needed before Phase 250 entry eligibility work. This plan did not implement Phase 250-255 behavior, database migrations, entry enforcement, Season lifecycle, standings recompute, governance workflow, React game rules, Strategy execution, service-backed proof, or Node `vm`.

---
*Phase: 249-competition-surface-inventory-and-policy-lock*
*Completed: 2026-06-15*
