# v1.27 Phase Cycle Log

**Milestone:** v1.27 Result and Replay Workbench Against Frozen Match Execution Fixtures
**Workstream:** v1-27-result-replay-workbench
**Date:** 2026-05-30

This log records the synchronous GSD cycle across phases 192-200 after phase discussions were completed.

## Cycle Summary

| Phase | Plan | UI Spec | Execute | Code Review/Fix | UI Review/Fix | Validate | Verify |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 192 | Baseline frozen contract and UX inventory | n/a | Mapped app-facing surfaces and monitor gaps | Boundary review found privacy/monitor scope gaps; fixed in v1.27 monitor | n/a | `check-boundary-monitors` | Complete |
| 193 | Gated fixture catalog route | Fixture catalog as operational switchboard | Added `/test-support/match-execution-fixtures` | Added fail-closed gate and monitor checks | Catalog accepted; future filtering deferred | Playwright catalog proof | Complete |
| 194 | Contract-derived result view model | Result workbench cards | Added `result-view-model.ts` and refactored result page | Fixed publicReason tone and privacy serialization risk | Humanized primary enum copy | Vitest + Playwright all fixtures | Complete |
| 195 | Replay workbench ergonomics | Board-centered tri-pane | Reordered replay controls above fold, added privacy badge | Added replay client contract redaction | Fixed timeline visibility and mobile board height | Browser proof + Playwright | Complete |
| 196 | Public state coverage | State-specific result cards | Covered complete/running/queued/degraded/failed/unavailable fixtures | Fixed complete/no-standings copy | Result pages read as inspection surfaces | Playwright all fixtures | Complete |
| 197 | Privacy and owner/test-only gating | Public-safe evidence cues | Broadened visible/HTML privacy scans and replay unavailable copy | Removed replay contract privacy denylist from client props | Reduced header privacy dominance | Privacy scans + monitor | Complete |
| 198 | Desktop/tablet/mobile proof | Responsive proof targets | Added tablet project and v1.27 Playwright suite | Strengthened board in-bounds proof anchors | Mobile ledger stacking and board sizing fixed | 36 Playwright checks | Complete |
| 199 | Live compatibility and boundary monitors | n/a | Extended boundary monitor for DTO-only UI coupling and ownership creep | Fixed monitor coverage for changed files | n/a | Monitor pass | Complete for contract compatibility; live signed-in service proof not run because `COWARDS_GO_BACKEND_URL` and live service env were absent |
| 200 | Audit, archive, commit, tag | n/a | Prepared closeout artifacts | Code/UI audit findings fixed | Final browser pass | Validation + verify-work + audit-fix | Ready for commit/tag |

## Implementation Highlights

- Added a non-production fixture catalog at `/test-support/match-execution-fixtures`.
- Added a contract-derived MatchSet result workbench view model.
- Improved result evidence readability, public state copy, replay unavailable copy, and replay privacy cues.
- Added replay board proof anchors and tablet/mobile Playwright coverage.
- Prevented serialized replay client props from exposing the canonical private-field denylist.
- Extended boundary monitors for v1.27 result/replay workbench ownership and privacy drift.

## Verification Commands

- `pnpm --filter @cowards/web test -- apps/web/app/matchsets/result-view-model.test.ts apps/web/app/matches/server.test.ts apps/web/app/matches/replay-fixture.test.ts 'apps/web/app/matches/[matchId]/replay/replay-state.test.ts'`
- `pnpm --filter @cowards/worker exec tsx /Users/roryquinlan/runtime/cowards-game/scripts/check-boundary-monitors.ts`
- `PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop --project=tablet --project=mobile --workers=3 v1-27-result-replay-workbench.spec.ts`

## Known Verification Note

`pnpm --filter @cowards/web typecheck` still reports pre-existing workspace project-reference/dist-state failures and unrelated strictness errors across older files. The v1.27 targeted Vitest, browser proof, and boundary monitor gates pass.

Live signed-in proof was not claimed because the local environment did not provide `COWARDS_GO_BACKEND_URL`, `COWARDS_GO_BACKEND_INTERNAL_TOKEN`, or database/runtime-service wiring for the existing signed-in proof tests.
