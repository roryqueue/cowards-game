---
phase: 08-replay-fixture-fidelity-and-visual-regression
reviewed: 2026-05-18T15:00:04Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - package.json
  - apps/web/package.json
  - apps/web/app/api/test-support/replay-fixture/route.ts
  - apps/web/app/matches/[matchId]/replay/replay-client.tsx
  - apps/web/app/matches/replay-fixture.test.ts
  - apps/web/app/matches/replay-fixture.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/types.ts
  - apps/web/e2e/replay.fixture.spec.ts
  - apps/web/e2e/replay.visual.spec.ts
  - packages/test-utils/package.json
  - packages/test-utils/tsconfig.json
  - packages/test-utils/src/index.ts
  - packages/test-utils/src/replay-scenarios.ts
  - packages/test-utils/src/replay-scenarios.manifest.test.ts
  - packages/test-utils/src/replay-scenarios.legality.test.ts
  - playwright.config.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-05-18T15:00:04Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Re-reviewed the prior Phase 8 scope plus `playwright.config.ts`, focusing on the previous findings, replay privacy, deterministic fixture generation, and flaky Playwright patterns.

The two prior warnings are fixed:

- `playwright.config.ts` now sets `snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}"`, and committed visual baselines are now `-desktop.png` / `-mobile.png` rather than `-darwin.png`.
- `apps/web/e2e/replay.fixture.spec.ts` no longer hard-codes sequence 42; it selects `AWARENESS_GRID_OBSERVED` events by accessible name pattern.

No BLOCKER issues were found. One remaining WARNING was found in the visual regression test.

## Warnings

### WR-01: Visual screenshot readiness depends on a fixed sleep

**Classification:** WARNING
**File:** `apps/web/e2e/replay.visual.spec.ts:242`
**Issue:** `selectEvent` waits for board visibility and nonblank canvas pixels, then uses `page.waitForTimeout(350)` before taking the visual snapshot. That timeout is not tied to React state completion or Pixi render completion. Under CI load, the board/callout can still be settling when the snapshot assertion starts, creating intermittent visual diffs; on fast runs it also hides the fact that the test lacks an explicit render-ready condition.
**Fix:** Replace the fixed timeout with a deterministic readiness wait. For example, wait for the expected board label and then wait for the canvas pixels to stabilize before calling `toHaveScreenshot`:

```ts
const waitForStableBoardPixels = async (page: Page): Promise<void> => {
  const canvas = page.getByLabel("Replay board canvas")
  let previous = ""
  await expect
    .poll(async () => {
      const screenshot = await canvas.screenshot({ animations: "disabled" })
      const current = screenshot.toString("base64")
      const stable = current === previous
      previous = current
      return stable
    })
    .toBe(true)
}
```

Then call `await waitForStableBoardPixels(page)` instead of `await page.waitForTimeout(350)`.

---

_Reviewed: 2026-05-18T15:00:04Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
