---
phase: 08
slug: replay-fixture-fidelity-and-visual-regression
status: audited
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-18
audited: 2026-05-18
---

# Phase 08 Validation Audit

## Test Infrastructure

| Property | Value |
|----------|-------|
| Unit/integration framework | Vitest 4.1.6 |
| Browser framework | Playwright 1.60.0 |
| Config files | `apps/web/vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts replay-scenarios.legality.test.ts` |
| Focused web command | `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` |
| Visual command | `pnpm e2e:visual` |
| Full Phase 8 command | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts replay-scenarios.legality.test.ts && pnpm --filter @cowards/test-utils typecheck && pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts && pnpm --filter @cowards/web typecheck && PLAYWRIGHT_TEST=1 pnpm e2e replay.fixture.spec.ts --project=desktop && pnpm e2e:visual` |
| Aggregate command | `pnpm verify` |
| Estimated runtime | 2-4 minutes for focused Phase 8 gate |

## Requirement Coverage

| Requirement | Behavioral Evidence | Status |
|-------------|---------------------|--------|
| FID-01 | `packages/test-utils/src/replay-scenarios.ts` builds canonical scenarios through `buildChronicleFromMatch`; manifest tests require exported IDs and non-empty generated Chronicles. | green |
| FID-02 | Manifest and legality tests require push, fall, contraction, legal Backstab, runtime failure, endgame, and compound tour scenarios with required event types. | green |
| FID-03 | `replay-scenarios.legality.test.ts` validates/reconstructs every canonical Chronicle and mutates impossible push/contraction beats to prove rejection before web rendering. | green |
| FID-04 | `apps/web/app/matches/replay-ready.ts` is exercised by persisted replay and generated fixture tests; fixture data equals public/owner Chronicle projections and replay iteration counts. | green |
| FID-05 | `apps/web/e2e/replay.visual.spec.ts` checks focused board screenshots for board scale, Soldier positions, contraction bounds, and event callouts across desktop and mobile baselines. | green |
| FID-06 | Scenario manifests expose `expectedEventTypes` and `visualCheckpoints`; tests prove every checkpoint points to an existing Chronicle sequence and has inspectable assertions. | green |
| FID-07 | Tests and helper errors are layer-prefixed as `[engine legality]`, `[Chronicle validation]`, `[projection]`, or `[ui rendering]`; focused commands exercised all four layers. | green |

## Per-Task Verification Map

| Task | Requirement(s) | Automated Verification | Threat / Risk Covered | File Exists? | Status |
|------|----------------|------------------------|-----------------------|--------------|--------|
| 08-01-01 | FID-01, FID-06 | `pnpm --filter @cowards/test-utils typecheck` | Scenario package imports web/UI or misses engine/replay linkage | Yes | green |
| 08-01-02 | FID-01, FID-02, FID-06 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts` | Generated corpus omits required canonical mechanics | Yes | green |
| 08-01-03 | FID-01, FID-06 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts` | Runtime-failure demo executes Strategy code in web/API or leaks private data | Yes | green |
| 08-02-01 | FID-03, FID-07 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts -t "[Chronicle validation]"` | Invalid generated Chronicle reaches rendering | Yes | green |
| 08-02-02 | FID-02, FID-03, FID-07 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts -t "[engine legality]"` | Scenario describes impossible mechanic outcome | Yes | green |
| 08-02-03 | FID-03, FID-07 | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts -t "impossible"` | Impossible beat fails without layer diagnostics | Yes | green |
| 08-03-01 | FID-04, FID-07 | `pnpm --filter @cowards/web test -- server.test.ts` | Persisted replay and fixture replay diverge in projection/replay assembly | Yes | green |
| 08-03-02 | FID-04, FID-07 | `pnpm --filter @cowards/web test -- replay-fixture.test.ts` | Fixture route bypasses Chronicle projection or leaks private data | Yes | green |
| 08-03-03 | FID-04, FID-07 | `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` | Scenario-specific catalog/href generation fails | Yes | green |
| 08-04-01 | FID-05, FID-07 | `PLAYWRIGHT_TEST=1 pnpm e2e replay.fixture.spec.ts --project=desktop` and `pnpm e2e:smoke` | UI selectors are unstable or depend on broad text matching | Yes | green |
| 08-04-02 | FID-05, FID-07 | `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=desktop` | Board scale, positions, contraction, or callouts regress visually on desktop | Yes | green |
| 08-04-03 | FID-05, FID-07 | `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=mobile` and `pnpm e2e:visual` | Visual gate is not repeatable across desktop/mobile or script entrypoint | Yes | green |

## Audit Evidence

| Command | Result |
|---------|--------|
| `pnpm --filter @cowards/test-utils test -- replay-scenarios.manifest.test.ts replay-scenarios.legality.test.ts` | green: 2 test files, 15 tests passed |
| `pnpm --filter @cowards/test-utils typecheck` | green |
| `pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` | green: 9 test files, 62 tests passed |
| `pnpm --filter @cowards/web typecheck` | green |
| `pnpm exec prettier --check package.json apps/web/e2e/replay.fixture.spec.ts apps/web/e2e/replay.visual.spec.ts packages/test-utils/src/replay-scenarios.manifest.test.ts packages/test-utils/src/replay-scenarios.legality.test.ts apps/web/app/matches/replay-fixture.test.ts apps/web/app/matches/server.test.ts .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md` | green |
| `PLAYWRIGHT_TEST=1 pnpm e2e replay.fixture.spec.ts --project=desktop` | green: 2 tests passed |
| `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=desktop` | green: 7 tests passed |
| `PLAYWRIGHT_TEST=1 pnpm e2e replay.visual.spec.ts --project=mobile` | green: 7 tests passed |
| `pnpm e2e:visual` | green: 14 tests passed across desktop and mobile |
| `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e:smoke && pnpm e2e:visual` | green: lint/typecheck/test passed for all packages; E2E smoke 4 passed; visual 14 passed |
| `pnpm verify` | warning: stopped at `pnpm format:check` because pre-existing `apps/web/next-env.d.ts` is not Prettier-clean |

## Manual-Only Verifications

None. All FID-01 through FID-07 acceptance behaviors have automated behavioral coverage.

## Warnings

- `pnpm verify` is not green in this working tree because `pnpm format:check` reports `apps/web/next-env.d.ts`. That file was already modified before this audit and was not changed here.
- Playwright runs emit recurring `NO_COLOR` / `FORCE_COLOR` warnings. One desktop visual run also emitted a React hydration warning for the replay timeline range input style. These warnings did not fail the focused Phase 8 gates.
- The available `gsd-sdk` on PATH does not expose the `query` commands referenced by the generic GSD validation workflow, so this audit used direct artifact inspection and project commands.

## Validation Sign-Off

- [x] Every requirement FID-01 through FID-07 has at least one automated validation path.
- [x] Tests verify behavior rather than only file existence.
- [x] Engine legality, Chronicle validation, projection, and UI rendering failures are layer-classified.
- [x] Visual regression coverage has desktop and mobile Playwright commands plus a root `e2e:visual` script.
- [x] Public replay privacy is covered in fixture and E2E checks.

## Validation Audit 2026-05-18

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Tests added | 0 |
| Resolved | 0 |
| Escalated | 0 |
