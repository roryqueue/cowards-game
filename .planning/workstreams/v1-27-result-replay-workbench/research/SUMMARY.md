# v1.27 Research Summary

**Project:** Coward's Game
**Workstream:** v1-27-result-replay-workbench
**Milestone:** v1.27 Result and Replay Workbench Against Frozen Match Execution Fixtures
**Domain:** Fixture-backed MatchSet result UX, replay workbench ergonomics, public-safe evidence readability, degraded/unavailable public states, visual proof, and frozen Match execution app DTO consumption
**Researched:** 2026-05-30
**Confidence:** High for fixture-backed app development and privacy boundaries; medium for final workbench interaction design until Phase 192 inventory and UI-spec passes inspect the current page constraints; low for any live execution, runtime promotion, production sandbox, or ABI migration claims because those are intentionally excluded.

## Executive Summary

v1.27 should build the ambitious result/replay/app UX that v1.25 made possible, not reopen Match execution internals. The frozen `match-execution-app-v1` contract already gives the app stable lifecycle states, MatchSet/result DTOs, replay metadata/evidence DTOs, failure evidence categories, privacy fields, a schema-valid fixture catalog, and a non-production fixture adapter. The next useful work is to turn those fixtures into a serious app workbench: better public MatchSet result pages, replay inspection ergonomics, fixture browsing or switching, readable evidence panels, degraded/unavailable/failed/running/queued states, and proof that every fixture remains public-safe and visually plausible on desktop and mobile.

The milestone must stay in front of the v1.25 interface. Normal UI development and proof should run against fixtures, while live signed-in proof remains a compatibility regression that opens result/replay pages through frozen DTOs. It must not add Go orchestration ownership, runtime-service ownership, new language promotion, production sandbox certification, direct-export or Component Model/WIT ABI migration, counted non-JS play, or Strategy execution in web/API/Go.

## Baseline Findings

- v1.25 froze the app-facing Match execution boundary as `match-execution-app-v1` in `packages/spec/src/match-execution-contract.ts`.
- The fixture catalog covers complete, running, queued, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, and public-safe replay scenarios.
- `apps/web/lib/match-execution-fixture-adapter.ts` gates fixtures to `PLAYWRIGHT_TEST=1`, `NODE_ENV=test`, or `COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES=1`, and explicitly disables fixture mode in production.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` renders current result evidence, standings, entrants, replay evidence, and provenance, but the layout is still closer to a basic result page than a full inspection workbench.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx` already has a replay shell, board, timeline slider, event list, inspectors, playback controls, and owner-debug gating hooks. v1.27 can improve ergonomics without changing replay rules.
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` proves the current catalog renders without private markers and that the public-safe replay canvas is nonblank, but proof is still narrow: one viewport family, limited fixture navigation ergonomics, and basic evidence readability checks.
- `scripts/check-boundary-monitors.ts` already checks v1.25 lifecycle vocabulary, fixture scenarios, fixture adapter gates, app contract consumption, and privacy denylist markers. v1.27 should extend this to guard workbench-specific drift and fixture-mode production fallback.

## Feature Findings

- Fixture mode should become a visible developer/test workbench affordance rather than a hidden URL trick, while still failing closed in production.
- Result pages need a state model that makes queued, running, complete, degraded, failed, unavailable, retryable, non-retryable, stale, malformed, blocked, and no-result states scannable without exposing raw runtime details.
- Evidence panels should separate public status, lifecycle, result availability, replay availability, retry semantics, runtime eligibility, privacy exclusions, and provenance.
- Replay pages should support timeline inspection as a workbench workflow: event grouping, selected position, current board state, playback, stepping, focus/fallback behavior, and compact evidence should remain useful on desktop and mobile.
- Public pages should avoid debug-like language, raw diagnostics, host paths, environment values, DB details, tokens, package paths, private runtime internals, Strategy source, StrategyMemory, SoldierMemory, and objective payloads by default.
- Owner/test-only details can exist only behind explicit gates and must not appear in default public output or fixture browser flows.

## Architecture Findings

- The app should consume only frozen app-facing DTOs or fixture-backed DTO-equivalent reads. It should not infer public state from runtime-service envelopes, Go orchestration internals, persistence internals, raw Chronicle debug payloads, or private diagnostics.
- Fixture-backed app/test adapters should remain non-production, explicit, schema-validated, and visible in proof. Unknown fixtures should fail closed instead of creating invented states.
- Workbench state modeling should live in app/lib helpers or view-model builders, not React-only conditionals that duplicate lifecycle rules.
- Replay board realism should stay server/projection validated where possible, with Playwright canvas and visible piece checks acting as browser proof, not rule authority.
- Boundary monitors should catch new app imports from execution internals, fixture adapter gate weakening, lifecycle vocabulary drift, privacy denylist leaks, owner/test-only leakage, and accidental live execution dependency in fixture-mode UI tests.

## Watch Out For

- Do not turn fixture mode into a silent production fallback.
- Do not use fixtures as proof of live execution correctness; fixtures prove app behavior against frozen DTOs.
- Do not couple UI to Go orchestration internals, runtime-service internal envelopes, retry implementation details, persistence internals, or raw diagnostics.
- Do not promote Python, Rust, or Zig beyond non-counted exhibition beta; JS/TS remains the counted Strategy path.
- Do not migrate away from WASI Preview 1 stdin/stdout JSON or introduce direct-export or Component Model/WIT ABI execution.
- Do not add Strategy execution to web/API/Go or place game rules in React components.
- Do not let public result/replay pages expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.

## Recommended Phase Structure

1. Phase 192: v1.25 app contract baseline and result/replay UX inventory.
2. Phase 193: Fixture catalog browser or developer fixture switcher.
3. Phase 194: Result page state model and evidence readability pass.
4. Phase 195: Replay page workbench layout and timeline ergonomics.
5. Phase 196: Degraded, unavailable, failed, queued, and running public states.
6. Phase 197: Public-safe evidence details, privacy copy, and owner/test-only gating.
7. Phase 198: Desktop/mobile visual proof across all fixtures.
8. Phase 199: Live signed-in compatibility proof without UI depending on execution internals.
9. Phase 200: Audit, archive, commit, and tag.

## Sources Consulted

- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/MILESTONES.md`
- `.planning/RETROSPECTIVE.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/v1.25-SUMMARY.md`
- `.planning/milestones/v1.25-REQUIREMENTS.md`
- `.planning/milestones/v1.25-ROADMAP.md`
- `.planning/milestones/v1.25-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.25-VERIFY-WORK.md`
- `.planning/milestones/v1.25-CODE-REVIEW.md`
- `.planning/milestones/v1.25-AUDIT-FIX.md`
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md`
- `.planning/artifacts/v1.25-match-execution-proof.md`
- `.planning/artifacts/v1.25-interface-freeze-decision.md`
- `packages/spec/src/match-execution-contract.ts`
- `apps/web/lib/match-execution-fixture-adapter.ts`
- `apps/web/lib/public-service-boundary.ts`
- `apps/web/app/matchsets/[matchSetId]/page.tsx`
- `apps/web/app/matchsets/evidence-copy.ts`
- `apps/web/app/matches/[matchId]/replay/page.tsx`
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx`
- `apps/web/app/matches/replay-ready.ts`
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts`
- `scripts/check-boundary-monitors.ts`

---
*Research summary written: 2026-05-30*
