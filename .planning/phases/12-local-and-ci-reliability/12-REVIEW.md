---
phase: 12-local-and-ci-reliability
reviewed: 2026-05-18T19:59:07Z
depth: deep
files_reviewed: 28
files_reviewed_list:
  - .github/workflows/ci.yml
  - README.md
  - apps/web/app/api/test-support/run-worker-once/route.test.ts
  - apps/web/app/api/test-support/run-worker-once/route.ts
  - apps/web/e2e/workshop-to-replay.spec.ts
  - apps/worker/src/runner.test.ts
  - compose.yaml
  - package.json
  - packages/persistence/src/chronicle-store.test.ts
  - packages/persistence/src/dev-smoke.ts
  - packages/replay/src/build.ts
  - packages/replay/src/grammar.ts
  - scripts/dev-local-postgres.sh
  - scripts/preflight.ts
  - scripts/wait-for-compose-services.sh
  - .planning/phases/12-local-and-ci-reliability/12-CONTEXT.md
  - .planning/phases/12-local-and-ci-reliability/12-DISCUSSION-LOG.md
  - .planning/phases/12-local-and-ci-reliability/12-RESEARCH.md
  - .planning/phases/12-local-and-ci-reliability/12-01-PLAN.md
  - .planning/phases/12-local-and-ci-reliability/12-01-SUMMARY.md
  - .planning/phases/12-local-and-ci-reliability/12-02-PLAN.md
  - .planning/phases/12-local-and-ci-reliability/12-02-SUMMARY.md
  - .planning/phases/12-local-and-ci-reliability/12-03-PLAN.md
  - .planning/phases/12-local-and-ci-reliability/12-03-SUMMARY.md
  - .planning/phases/12-local-and-ci-reliability/12-04-PLAN.md
  - .planning/phases/12-local-and-ci-reliability/12-04-SUMMARY.md
  - .planning/phases/12-local-and-ci-reliability/12-05-PLAN.md
  - .planning/phases/12-local-and-ci-reliability/12-05-SUMMARY.md
findings:
  critical: 2
  warning: 3
  info: 0
  total: 5
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-18T19:59:07Z
**Depth:** deep
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Reviewed commits after `dfbb504`, especially `02a065c`, across the Phase 12 reliability scripts, Compose setup, CI workflow, service-backed E2E diagnostics, fixture/test changes, and Phase 12 artifacts. The implementation adds useful command slices, but REL-03 and REL-06 are not actually met: preflight can pass by validating stale unrelated data, and the UI check does not open a replay route.

## Critical Issues

### CR-01: BLOCKER - Preflight can pass using stale unrelated Chronicles

**File:** `scripts/preflight.ts:177`

**Issue:** The smoke path creates a unique MatchSet, but `runWorkerOnce` claims the oldest queued job globally, not necessarily the MatchSet created by this preflight run. The result status and per-MatchSet Chronicle count are never asserted, `runDevelopmentMatchSetSmoke` counts all Chronicles in the database at `packages/persistence/src/dev-smoke.ts:57`, and `latestChronicle` selects a global latest Chronicle at `scripts/preflight.ts:125`. A dirty local database or CI retry queue can therefore produce a PASS for seeding, Chronicle validation, and replay projection without the preflight MatchSet ever completing. This is an incorrect reliability gate and leaves REL-03/REL-06 falsely satisfied.

**Fix:**
```ts
const result = await runDevelopmentMatchSetSmoke(pool, {
  matchSetId,
  runQueuedMatch: async (matchIds) => {
    await runWorkerUntilMatchesComplete(pool, matchIds, { workerId: "worker:preflight" })
  },
})
if (result.status !== "complete" || result.chronicleCount < result.matchCount) {
  throw new Error(`preflight MatchSet did not complete: ${result.status}`)
}
const chronicle = await latestChronicleForMatchSet(pool, result.matchSetId)
```

Return the created match IDs/count from `runDevelopmentMatchSetSmoke`, count Chronicles for that MatchSet only, and make replay validation consume that same Chronicle set.

### CR-02: BLOCKER - UI rendering preflight does not check a replay route

**File:** `scripts/preflight.ts:226`

**Issue:** The check is named `Web replay route`, but it fetches `options.webUrl` directly. With the default from `--require-web`, that is just `http://localhost:3000`, so a healthy home page can pass even when `/matches/{matchId}/replay` is broken. It also does not validate replay page content, and `COWARDS_WEB_URL` alone does not enable the check. REL-03 requires replay endpoint readiness, and REL-06 requires layer-specific UI/replay failure attribution; this gate currently cannot prove either.

**Fix:**
```ts
const replayUrl = new URL(`/matches/${encodeURIComponent(matchId)}/replay`, baseWebUrl)
const response = await fetch(replayUrl)
if (!response.ok) {
  throw new Error(`${replayUrl} returned HTTP ${response.status}`)
}
const html = await response.text()
if (!html.includes("Replay")) {
  throw new Error(`${replayUrl} did not render replay content`)
}
```

Use the Match/Chronicle created by the same preflight smoke run, and either make `COWARDS_WEB_URL` imply `requireWeb` or fail fast when `--web-url` has no value.

## Warnings

### WR-01: WARNING - Service E2E is race-prone across Playwright projects

**File:** `package.json:19`

**Issue:** `e2e:service` runs `workshop-to-replay.spec.ts` without constraining Playwright projects or workers. The shared config runs both desktop and mobile projects (`playwright.config.ts:20`), both mutate the same service database, and the test-support route drains up to eight arbitrary queued jobs from the global queue (`apps/web/app/api/test-support/run-worker-once/route.ts:34`). One project can process the other project's queued MatchSet or leave its own pending, which makes the CI service gate flaky rather than reliable.

**Fix:** Run the service-backed trust loop as a single isolated project/worker, or isolate the database and worker queue per project. For example:

```json
"e2e:service": "RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 pnpm e2e -- workshop-to-replay.spec.ts --project=desktop --workers=1"
```

For broader matrix coverage, pass a MatchSet ID to the test-support endpoint and only process jobs belonging to that MatchSet.

### WR-02: WARNING - `--skip-smoke` still requires smoke-produced data

**File:** `scripts/preflight.ts:170`

**Issue:** `--skip-smoke` skips the only step that guarantees a persisted Chronicle exists, but the Chronicle validation and public projection checks still run unconditionally at `scripts/preflight.ts:195` and `scripts/preflight.ts:213`. On a clean database this option fails with "No persisted Chronicle found after smoke execution"; on a dirty database it can validate stale data. That makes the option misleading and undermines the diagnostic command's reliability.

**Fix:** Either remove `--skip-smoke`, or make it explicitly skip Chronicle/replay checks unless the caller supplies a specific `--match-set-id`/`--chronicle-id` to validate.

### WR-03: WARNING - Phase 12 validation artifact is missing

**File:** `.planning/phases/12-local-and-ci-reliability/12-05-PLAN.md:8`

**Issue:** Plan 12-05 declares `.planning/phases/12-local-and-ci-reliability/12-VALIDATION.md` as a modified file and explicitly requires mapping REL-01 through REL-06 to command-backed evidence at line 26, but that file is absent. The summary then claims all proof commands passed at `.planning/phases/12-local-and-ci-reliability/12-05-SUMMARY.md:5`. Downstream review has no durable evidence that REL-01..REL-06 were actually verified.

**Fix:** Add `12-VALIDATION.md` with command, timestamp, environment, exit status, and evidence for each REL item, or revise the plan/summary so they do not claim missing validation evidence.

## Fix Closure

**Closed:** 2026-05-18

| Finding | Resolution | Verification |
| --- | --- | --- |
| CR-01 | `runDevelopmentMatchSetSmoke` now returns created Match IDs/count, counts Chronicles only for that MatchSet, and `scripts/preflight.ts` waits until those specific Matches are complete before parsing/projection. | `pnpm test:fast` passed. `pnpm preflight:docker -- --skip-web` passed with `chronicles=1/1` for the generated preflight MatchSet. |
| CR-02 | `scripts/preflight.ts` now makes `COWARDS_WEB_URL` enable the web check and fetches `/matches/{matchId}/replay` for the generated preflight Match. | `COWARDS_WEB_URL=http://localhost:3000 pnpm preflight -- --require-web` passed and reported replay content from the generated Match route. |
| WR-01 | `e2e:service` is constrained to the desktop Playwright project with one worker. | `pnpm e2e:service` passed, running 1 test using 1 worker. |
| WR-02 | Removed the misleading `--skip-smoke` option so Chronicle validation/projection always have a same-run smoke MatchSet. | `pnpm test:fast` and `pnpm preflight:docker -- --skip-web` passed. |
| WR-03 | Added `.planning/phases/12-local-and-ci-reliability/12-VALIDATION.md` with REL-01 through REL-06 evidence. | Validation artifact now maps each requirement to commands and files. |

---

_Reviewed: 2026-05-18T19:59:07Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
