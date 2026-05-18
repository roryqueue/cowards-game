---
phase: 12-local-and-ci-reliability
reviewed: 2026-05-18T20:11:45Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - scripts/preflight.ts
  - packages/persistence/src/dev-smoke.ts
  - packages/persistence/src/dev-smoke.test.ts
  - package.json
  - .planning/phases/12-local-and-ci-reliability/12-03-SUMMARY.md
  - .planning/phases/12-local-and-ci-reliability/12-REVIEW.md
  - .planning/phases/12-local-and-ci-reliability/12-VALIDATION.md
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 12: Focused Re-Review Report

**Reviewed:** 2026-05-18T20:11:45Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Focused re-review of the Phase 12 reliability fixes confirms the prior blockers are resolved: preflight now waits on the Match IDs created by the same smoke MatchSet, counts Chronicles only for that MatchSet, parses/projects a Chronicle from that MatchSet, and fetches the generated Match replay route. The service E2E command is constrained to desktop with one worker, `--skip-smoke` has been removed, and `12-VALIDATION.md` now exists with REL-01 through REL-06 evidence.

One remaining warning was found in the web preflight option handling.

## Previous Findings

| Finding | Status | Evidence |
| --- | --- | --- |
| CR-01: BLOCKER - stale/unrelated Chronicle validation | Resolved | `scripts/preflight.ts:182` passes created Match IDs into the worker loop; `scripts/preflight.ts:213` requires complete status and per-MatchSet Chronicle count; `scripts/preflight.ts:118` queries Chronicles by `match_set_id`. |
| CR-02: BLOCKER - web preflight not checking replay route | Resolved | `scripts/preflight.ts:275` selects the generated Match ID and `scripts/preflight.ts:276` builds `/matches/{matchId}/replay`; `scripts/preflight.ts:284` checks page content. |
| WR-01: WARNING - e2e service parallel projects | Resolved | `package.json:19` uses `playwright test --project=desktop --workers=1 workshop-to-replay.spec.ts`. |
| WR-02: WARNING - `--skip-smoke` misleading | Resolved | `scripts/preflight.ts` no longer parses `--skip-smoke`; Chronicle parsing/projection require `smokeResult`. |
| WR-03: WARNING - missing validation artifact | Resolved | `.planning/phases/12-local-and-ci-reliability/12-VALIDATION.md` is present and maps REL-01 through REL-06 to evidence. |

## Warnings

### WR-01: WARNING - Required web preflight can be skipped when the URL value is missing or empty

**File:** `scripts/preflight.ts:66`

**Issue:** `--web-url` sets `requireWeb = true` but does not validate that a value exists, and `COWARDS_WEB_URL=""` also sets `requireWeb = true` with an empty URL. The UI check is guarded by `if (options.requireWeb && options.webUrl)` at `scripts/preflight.ts:269`, so `pnpm preflight -- --web-url` or an empty `COWARDS_WEB_URL` can exit successfully after skipping the required replay-route check. That leaves a false-positive path in the reliability gate.

**Fix:**
```ts
case "--web-url": {
  const value = argv[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error("--web-url requires a URL value")
  }
  options.webUrl = value
  options.requireWeb = true
  index += 1
  break
}

if (options.requireWeb && !options.webUrl) {
  throw new Error("Web preflight requires a non-empty web URL")
}
```

## Verification

- `pnpm --filter @cowards/persistence test -- src/dev-smoke.test.ts` passed.
- `pnpm exec tsc --noEmit --pretty false` passed.

## Fix Closure

**Closed:** 2026-05-18

| Finding | Resolution | Verification |
| --- | --- | --- |
| WR-01 | `scripts/preflight.ts` now rejects `--web-url` without a following URL value and rejects required web preflight when the resolved URL is empty. | `pnpm preflight -- --web-url --skip-web` failed with `--web-url requires a URL value`; `env COWARDS_WEB_URL= pnpm preflight` failed with `Web preflight requires a non-empty web URL`; `COWARDS_WEB_URL=http://localhost:3000 pnpm preflight -- --require-web` passed against a generated replay route. |

---

_Reviewed: 2026-05-18T20:11:45Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
