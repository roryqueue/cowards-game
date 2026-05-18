---
phase: 08
slug: replay-fixture-fidelity-and-visual-regression
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-18
---

# Phase 08 Validation Plan

## Test Infrastructure

| Property | Value |
|----------|-------|
| Unit/integration framework | Vitest 4.1.6 |
| Browser framework | Playwright 1.60.0 |
| Config files | `apps/web/vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts replay-scenarios.legality.test.ts` |
| Full suite command | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts replay-scenarios.legality.test.ts && pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts && PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=desktop && PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=mobile` |
| Estimated runtime | 120-180 seconds for focused Phase 8 gate |

## Sampling Rate

- After every task commit, run the focused command named in that task's `<verify>` block.
- After every wave, run the combined acceptance tests for all completed plans in that wave.
- Before verify-work, run `pnpm verify` plus `pnpm e2e:visual` if visual checks are not already included in the verify script.
- Target maximum focused feedback latency is under 3 minutes.

## Per-Task Verification Map

| Task | Requirement(s) | Automated Verification | Threat / Risk Covered | File Exists? | Status |
|------|----------------|------------------------|-----------------------|--------------|--------|
| 08-01-01 | FID-01, FID-06 | `pnpm --filter @cowards/test-utils typecheck` | Scenario package imports web/UI or misses engine/replay linkage | W0 | pending |
| 08-01-02 | FID-01, FID-02, FID-06 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts` | Generated corpus omits required canonical mechanics | W0 | pending |
| 08-01-03 | FID-01, FID-06 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts` | Runtime-failure demo executes Strategy code in web/API or leaks private data | W0 | pending |
| 08-02-01 | FID-03, FID-07 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts -t "[Chronicle validation]"` | Invalid generated Chronicle reaches rendering | W0 | pending |
| 08-02-02 | FID-02, FID-03, FID-07 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts -t "[engine legality]"` | Scenario describes impossible mechanic outcome | W0 | pending |
| 08-02-03 | FID-03, FID-07 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts -t "impossible"` | Impossible beat fails without layer diagnostics | W0 | pending |
| 08-03-01 | FID-04, FID-07 | `pnpm --filter @cowards/web test -- server.test.ts` | Persisted replay and fixture replay diverge in projection/replay assembly | No | pending |
| 08-03-02 | FID-04, FID-07 | `pnpm --filter @cowards/web test -- replay-fixture.test.ts` | Fixture route bypasses Chronicle projection or leaks private data | No | pending |
| 08-03-03 | FID-04, FID-07 | `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` | Scenario-specific catalog/href generation fails | No | pending |
| 08-04-01 | FID-05, FID-07 | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts --project=desktop` | UI selectors are unstable or depend on broad text matching | No | pending |
| 08-04-02 | FID-05, FID-07 | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=desktop` | Board scale, positions, contraction, or callouts regress visually on desktop | W0 | pending |
| 08-04-03 | FID-05, FID-07 | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.visual.spec.ts --project=mobile && pnpm e2e:visual` | Visual gate is not repeatable across desktop/mobile or script entrypoint | W0 | pending |

## Wave 0 Requirements

No separate pre-execution Wave 0 is required. The Phase 8 plans intentionally create the missing scenario, legality, fixture-parity, and visual spec files as task artifacts, then immediately validate them through focused commands.

## Manual-Only Verifications

All Phase 8 acceptance behaviors have automated verification. Any manual browser inspection is optional debugging support, not a release gate.

## Validation Sign-Off

- [x] Every requirement FID-01 through FID-07 has at least one automated validation path.
- [x] New files without existing tests are explicitly mapped to task-created tests.
- [x] Visual regression coverage has dedicated desktop and mobile Playwright commands.
- [x] Public replay privacy is covered in fixture and E2E checks.
