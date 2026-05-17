---
phase: 7
slug: replay-viewer-and-end-to-end-verification
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-17
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest, Playwright, browser verification |
| **Config file** | `package.json`, `apps/web/package.json`, `apps/web/vitest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `pnpm --filter @cowards/web typecheck && pnpm --filter @cowards/web test` |
| **Full suite command** | `pnpm verify` |
| **Estimated runtime** | ~90 seconds for normal suite; service-backed E2E separate |

---

## Sampling Rate

- **After every task commit:** Run the relevant package command for touched files.
- **After every plan wave:** Run `pnpm verify`.
- **Before `$gsd-verify-work`:** Run `pnpm verify`; run `PLAYWRIGHT_TEST=1 pnpm e2e`. Service-backed smoke is present and skipped unless `RUN_SERVICE_E2E=1` with local Postgres/Redis.
- **Max feedback latency:** 5 minutes during implementation.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | VIEW-01, VIEW-03, VIEW-04 | T-07-01 | Replay route uses stored Chronicles and public projection by default | unit | `pnpm --filter @cowards/web test -- server.test.ts` | W0 | green |
| 07-02-01 | 02 | 2 | VIEW-02, VIEW-03, VIEW-04 | T-07-02 | Timeline and inspector derive state from replay projection, not runtime execution | unit/component | `pnpm --filter @cowards/web test -- replay-state.test.ts replay-client.test.tsx` | W0 | green |
| 07-03-01 | 03 | 3 | VIEW-01, VIEW-05, VIEW-06 | T-07-03 | Canvas board renders distinct canonical states and event callouts without mutating replay state | unit/browser | `pnpm --filter @cowards/web test -- replay-board.test.ts replay-client.test.tsx && PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` | W0 | green |
| 07-04-01 | 04 | 4 | VIEW-07 | T-07-04 | Workshop shows replay links only for completed Matches with stored Chronicles | unit/component | `pnpm --filter @cowards/persistence test -- workshop.test.ts && pnpm --filter @cowards/web test -- workshop-client.test.tsx` | W0 | green |
| 07-05-01 | 05 | 5 | TEST-06 | T-07-05 | Fixture and service-backed E2E prove edit-to-replay without requiring a long-running worker daemon | e2e | `PLAYWRIGHT_TEST=1 pnpm e2e` | W0 | green |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [x] Add `pixi.js`/`@pixi/react` dependency and browser-only replay board wrapper before canvas implementation tasks rely on it.
- [x] Add Playwright dependency, config, and `pnpm e2e` script before service-backed E2E tasks rely on it.
- [x] Add stable replay fixture data or test-support route for fixture-backed replay UI checks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pixi replay board render quality | VIEW-01, VIEW-05, VIEW-06 | Canvas legibility and animation clarity need browser confirmation | Start web app, open a replay, verify nonblank canvas, readable Soldier badges, clear owner colors, visible bounds, stones, falls, and event callouts. |
| Responsive replay layout | VIEW-01, VIEW-02, VIEW-03 | Timeline/inspector/board overlap risks are viewport-dependent | Check 1440x900, 1180x800, 820x1180, and 390x844; confirm controls and text do not overlap. |
| Owner/debug privacy toggle | VIEW-04 | Public/private perception needs human confirmation in addition to string tests | Open public mode and owner/debug mode; confirm exact Awareness Grid appears only when explicitly toggled. |

**Browser verification performed:** `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts` covered desktop `1440x900` and mobile `390x844`; final `PLAYWRIGHT_TEST=1 pnpm e2e` covered the configured desktop/mobile projects. The fixture test asserts nonblank canvas output, scrubber/step behavior, inspector content, callout labels, and public privacy marker absence. Additional narrow viewport checks for `1180x800` and `820x1180` remain manual visual review items unless a later visual matrix expands Playwright projects.

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing framework/dependency references.
- [x] No watch-mode flags in verification commands.
- [x] Feedback latency < 5 minutes for normal checks.
- [x] `nyquist_compliant: true` set in frontmatter once plans map all tasks.

**Approval:** complete
