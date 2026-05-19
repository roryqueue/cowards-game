# Phase 13: Close Gap: Persisted Owner Replay Debug Authorization - Research

**Researched:** 2026-05-18 [VERIFIED: local date context]  
**Domain:** Next.js persisted replay authorization, Workshop replay links, Playwright service E2E, verification artifact closure [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md]  
**Confidence:** HIGH for codebase paths and tests; MEDIUM for the no-auth owner trust source because production authentication is explicitly deferred [VERIFIED: codebase grep] [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Owner Trust Source
- **D-01:** The planner may choose the smallest safe owner-trust source that fits the current no-auth app, but query parameters alone must never establish trust.
- **D-02:** Any persisted owner-debug request must be verified server-side against Match ownership or an equivalent trusted server-side owner source before owner data is returned.
- **D-03:** Development/test shortcuts are acceptable only when explicitly scoped to development/test and still constrained to Match participants.

### Persisted Replay Debug UX
- **D-04:** Workshop Match results should provide the primary user path to owner-debug replay links for persisted Matches when replay data exists.
- **D-05:** Public replay URLs must remain public by default; owner-debug links may request owner debug, but server-side verification decides whether trusted owner data is returned.
- **D-06:** The replay client should continue using the existing opt-in owner debug toggle pattern; do not make owner explanations visible by default.

### Failure-Mode E2E Proof
- **D-07:** Phase 13 must plan a service-backed Workshop failure-mode proof as the must-have end-to-end test: failure sample -> submit/run through worker -> persisted Chronicle -> owner replay link -> Soldier inactivity explanation.
- **D-08:** Lower-level persisted fixture or server tests are welcome as supporting coverage when they reduce flakiness or isolate authorization/projection behavior.
- **D-09:** Public privacy must be asserted alongside owner-debug success so the test proves both availability to owners and non-leakage to public viewers.

### Verification Artifact Closure
- **D-10:** Generate formal `*-VERIFICATION.md` files so the milestone audit contract is satisfied exactly.
- **D-11:** Phase 13 should include its own `13-VERIFICATION.md` and should add/refresh formal verification files for phases 8-12 from existing validation evidence rather than inventing new claims.

### Compatibility Alias Cleanup
- **D-12:** Do not remove orphaned Workshop compatibility API aliases in this phase.
- **D-13:** Document the aliases as compatibility surfaces with no current UI consumer, preserving them unless a later cleanup phase explicitly removes them.

### Carry-Forward Privacy Constraints
- **D-14:** Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, private runtime details, or owner debug DTOs by default.
- **D-15:** Owner debug overlays must be generated from replay/engine-derived DTOs rather than React rule inference.
- **D-16:** Strategy source must stay out of web/API processes; service-backed tests must execute Strategy code through the worker/runtime boundary.

### the agent's Discretion
- The planner may choose exact helper names, query parameter names, owner-link DTO shape, server dependency seams, and verification-file template structure as long as D-01 through D-16 remain true.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Production authentication and account/session ownership are deferred to a later milestone.
- Removing orphaned Workshop compatibility aliases is deferred; Phase 13 should document them only.
- Ranked ladders, tournaments, public doctrine pages, and Strategy marketplace surfaces remain out of scope for v1.1.
</user_constraints>

## Summary

Phase 13 should close one concrete integration gap: persisted replay pages can parse owner-debug query parameters, and the replay builder can emit owner debug DTOs, but the stored Chronicle path currently calls `trustedOwnerReplayOptions(metadata, options)` with no authorized owner list, so query-requested owner debug is downgraded to public. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/page.tsx] [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/app/matches/server.test.ts]

The smallest implementation should add a server-side persisted owner resolver at the replay server seam, pass authorized participant owner IDs into the existing `trustedOwnerReplayOptions` gate, and generate Workshop owner replay links that request owner debug for the actual local Workshop participant side. [VERIFIED: packages/persistence/src/workshop.ts] [VERIFIED: packages/persistence/migrations/0001_initial.sql] [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] [VERIFIED: apps/web/app/workshop/workshop-client.tsx]

**Primary recommendation:** Use the existing shared replay DTO path, but make persisted owner mode reachable only after server-side authorization; then prove it with a service-backed failing Strategy E2E and formal `*-VERIFICATION.md` files for phases 8-13. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Parse owner-debug request parameters | Frontend Server (SSR) | Browser / Client | `ReplayPage` already awaits `searchParams` and calls `resolveOwnerDebugReplayOptions`; Next.js App Router documents `searchParams` as a Promise on pages. [VERIFIED: apps/web/app/matches/[matchId]/replay/page.tsx] [CITED: Context7 /vercel/next.js page.mdx] |
| Authorize persisted owner debug | API / Backend | Database / Storage | Persisted replay loading already runs through `getMatchReplay` and the database Chronicle store; trusted mode must be decided before returning `ReplayReadyDto`. [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| Store / verify Match participant ownership | Database / Storage | API / Backend | The `matches` and `chronicles` tables store `bottom_player_id` and `top_player_id`, and Workshop tests create Matches with `WORKSHOP_PLAYER_ID` plus opponent player IDs. [VERIFIED: packages/persistence/migrations/0001_initial.sql] [VERIFIED: packages/persistence/src/workshop.ts] |
| Render owner inactivity explanations | Browser / Client | API / Backend | `ReplayClient` renders owner debug only when `canShowOwnerDebug(data)` sees owner projection/private DTOs; it does not compute rule causes itself. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts] |
| Execute failing Strategy for proof | Worker | API / Backend | Service E2E already calls `/api/test-support/run-worker-once`, and the architecture spec forbids executing user Strategy code in the web/API process. [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts] [CITED: CowardsGame_Technical_Architecture_Spec_V1.md] |
| Formal milestone closure artifacts | Static / Planning Docs | CI / Test Runner | The milestone audit explicitly found zero v1.1 `*-VERIFICATION.md` artifacts despite existing validation evidence. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, or owner debug/private runtime details by default. [VERIFIED: AGENTS.md] [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEBUG-04 | Owner can inspect replay explanations for why a Soldier did nothing, including not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, or Match ended. [VERIFIED: .planning/REQUIREMENTS.md] | Explanation DTOs and UI already exist; Phase 13 must make them reachable for persisted owner replay by authorizing owner mode on the stored Chronicle path. [VERIFIED: packages/replay/src/debug-explanations.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx] |
| DEBUG-05 | Owner-only debug overlays are generated from replay/engine-derived DTOs rather than React rule inference. [VERIFIED: .planning/REQUIREMENTS.md] | Current `ReplayClient` consumes `ReplayReadyDto.ownerDebug.soldierInactivityExplanations`; Phase 13 should preserve that DTO-only UI pattern and avoid adding React rule inference. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx] |
| P13-SC1 | Authorized owner can opt into owner debug on a persisted Match replay. [VERIFIED: .planning/ROADMAP.md] | Add server-side authorization before `buildReadyReplayFromStoredChronicle` returns owner mode. [VERIFIED: apps/web/app/matches/server.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| P13-SC2 | `ReplayReadyDto.ownerDebug.soldierInactivityExplanations` reaches the client only for authorized owner views. [VERIFIED: .planning/ROADMAP.md] | The DTO is currently only attached when `mode === "owner"` and `ownerPlayerId` exists; authorization should feed that existing condition. [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| P13-SC3 | Public persisted replays remain privacy-safe by default. [VERIFIED: .planning/ROADMAP.md] | Existing public server tests assert absence of StrategyMemory, SoldierMemory, objective payload, awareness grid, source, raw runtime details, ownerDebug, and soldier inactivity strings. [VERIFIED: apps/web/app/matches/server.test.ts] |
| P13-SC4 | Service-backed failing Strategy E2E proves runtime violation -> persisted Chronicle -> owner debug explanation. [VERIFIED: .planning/ROADMAP.md] | Existing service E2E covers the happy path only; the new proof should reuse failure-mode samples and `/api/test-support/run-worker-once`. [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts] [VERIFIED: packages/persistence/src/workshop.ts] |
| P13-SC5 | Phase 8-13 milestone evidence includes formal verification artifacts or an accepted replacement. [VERIFIED: .planning/ROADMAP.md] | Context locks exact `*-VERIFICATION.md` generation for phases 8-13. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] |
</phase_requirements>

## Standard Stack

| Library / Tool | Local Version | Current Registry Version | Purpose | Why Use It |
|----------------|---------------|--------------------------|---------|------------|
| Next.js | `^16.2.6` | `16.2.6`, modified 2026-05-17 | App Router SSR route for persisted replay pages. [VERIFIED: apps/web/package.json] [VERIFIED: npm registry] | Existing app framework; `searchParams` Promise pattern matches current docs. [CITED: Context7 /vercel/next.js page.mdx] |
| React | `^19.2.6` | `19.2.6`, modified 2026-05-08 | Replay and Workshop client UI. [VERIFIED: apps/web/package.json] [VERIFIED: npm registry] | Existing UI dependency; no new UI framework needed. [VERIFIED: codebase grep] |
| Vitest | `^4.1.6` | `4.1.6`, modified 2026-05-11 | Unit/integration tests for replay server, Workshop helpers, replay state, persistence. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing package test runner with many focused tests. [VERIFIED: test file inventory] |
| Playwright | `^1.60.0` | `1.60.0`, modified 2026-05-18 | Service-backed Workshop-to-replay E2E and browser privacy assertions. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing E2E runner; locator/page assertions retry and support URL checks. [CITED: Context7 /microsoft/playwright docs] |
| pg | `^8.20.0` | `8.21.0`, modified 2026-05-18 | PostgreSQL access for persisted Matches and Chronicles. [VERIFIED: packages/persistence/package.json] [VERIFIED: npm registry] | Existing persistence library; do not introduce a new data access layer for this closure. [VERIFIED: codebase grep] |

**Installation:** no new packages are recommended. [VERIFIED: package.json]  
**Version verification commands run:** `npm view next version time.modified`, `npm view react version time.modified`, `npm view @playwright/test version time.modified`, `npm view vitest version time.modified`, and `npm view pg version time.modified`. [VERIFIED: npm registry]

## Relevant Existing Patterns

### Persisted Replay Request Path

`ReplayPage` awaits `params` and `searchParams`, resolves owner-debug options, and calls `getMatchReplay(matchId, options)`. [VERIFIED: apps/web/app/matches/[matchId]/replay/page.tsx] `resolveOwnerDebugReplayOptions` only returns `{ allowOwnerDebug: true, requestedOwnerPlayerId }` when owner debug is environment-enabled and query params include `ownerDebug=1` or `debug=owner` plus `ownerPlayerId`. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts]

### Existing Trusted Owner Gate

`trustedOwnerReplayOptions(metadata, options, authorizedRequestedOwners)` upgrades a requested owner to `{ mode: "owner", ownerPlayerId }` only when `allowOwnerDebug` is true, the requested owner is in `authorizedRequestedOwners`, and that owner is either the bottom or top player in replay metadata. [VERIFIED: apps/web/app/matches/replay-ready.ts] The fixture path passes `[metadata.bottomPlayerId]` as an authorized owner list; the stored Chronicle path passes no authorized owner list. [VERIFIED: apps/web/app/matches/replay-fixture.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts]

### Current Persisted Gap

`createMatchReplayServer().getMatchReplay` loads a stored Chronicle by Match ID and immediately calls `buildReadyReplayFromStoredChronicle(stored, options)`; no persisted Match owner resolver is invoked before building the DTO. [VERIFIED: apps/web/app/matches/server.ts] Server tests currently assert that query-requested persisted owner IDs remain public and that only direct trusted server calls return owner data. [VERIFIED: apps/web/app/matches/server.test.ts]

### Workshop Match Identity

Workshop-owned tests use `WORKSHOP_PLAYER_ID = "player:workshop-local"` and create MatchSets where that player may be bottom or top because preset generation supports mirror sides. [VERIFIED: packages/persistence/src/workshop.ts] [VERIFIED: packages/persistence/src/matchset-service.ts] Current `MatchSetMatchSummary` exposes `matchId`, `status`, `outcome`, `winnerPlayerId`, and `hasReplay`, but not player IDs or owner replay hrefs. [VERIFIED: packages/persistence/src/matchset-status.ts]

### Replay Client Privacy / Opt-In Pattern

`canShowOwnerDebug` requires ready data, owner projection access, and `projection.ownerPrivate`; `ReplayClient` keeps owner debug hidden until the checkbox is checked. [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx] Public fixture E2E asserts the page body does not contain owner debug/private markers by default. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts]

### Failure-Mode Inputs

The Workshop sample catalog already contains failure-mode samples for forbidden clock, runtime timeout, invalid output, thrown exception, and do nothing. [VERIFIED: packages/persistence/src/workshop.ts] The service E2E currently validates/submits the default draft, launches a test, runs the worker once, opens the public replay, and verifies replay UI rendering. [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts]

## Recommended Implementation Strategy

1. Add a server-side persisted owner authorization seam to `createMatchReplayServer`. [VERIFIED: apps/web/app/matches/server.ts] Recommended shape: resolve `authorizedRequestedOwners` after loading the stored Chronicle and before calling `buildReadyReplayFromStoredChronicle`, then pass that list into `trustedOwnerReplayOptions`. [VERIFIED: apps/web/app/matches/replay-ready.ts]

2. Use persisted Match participant data as the current no-auth trust source, scoped to development/test owner-debug gates and constrained to Workshop ownership. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] A practical resolver can query `matches` / `match_set_matches` and authorize `WORKSHOP_PLAYER_ID` only when the Match is part of a Workshop MatchSet and the requested owner is an actual bottom/top participant. [VERIFIED: packages/persistence/migrations/0001_initial.sql] [VERIFIED: packages/persistence/src/workshop.ts] [ASSUMED]

3. Keep query params as a request, not proof. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] The owner-debug URL should carry `ownerDebug=1&ownerPlayerId=...`, but the server must downgrade to public unless the resolver returns that owner as authorized. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] [VERIFIED: apps/web/app/matches/replay-ready.ts]

4. Extend Workshop match summaries or Workshop client helpers to produce an owner replay href for the actual local Workshop player side. [VERIFIED: packages/persistence/src/matchset-status.ts] [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] Do not assume the local player is always bottom, because mirrored presets can put `WORKSHOP_PLAYER_ID` on top. [VERIFIED: packages/persistence/src/matchset-service.ts]

5. Keep the existing public "Open replay" behavior and add an owner-debug-specific link or href field only when replay exists. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] [VERIFIED: apps/web/app/workshop/workshop-client.tsx] Public replay URLs should remain available without owner params and should continue rendering public mode. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md]

6. Reuse the DTO path: `buildSoldierInactivityExplanations` -> `ReplayReadyDto.ownerDebug.soldierInactivityExplanations` -> `ReplayClient` owner debug toggle. [VERIFIED: apps/web/app/matches/replay-ready.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx] Do not add game-rule cause inference to React. [VERIFIED: AGENTS.md] [VERIFIED: .planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md]

7. Generate formal verification artifacts after implementation evidence is real. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] For phases 8-12, summarize existing `*-VALIDATION.md` and summary evidence; for Phase 13, record the new focused commands and the service-backed failure E2E. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md] [VERIFIED: .planning/phases/09-strict-chronicle-grammar-and-compatibility/09-VALIDATION.md] [VERIFIED: .planning/phases/10-runtime-isolation-hardening/10-VALIDATION.md] [VERIFIED: .planning/phases/11-doctrine-debugging-ux/11-VALIDATION.md] [VERIFIED: .planning/phases/12-local-and-ci-reliability/12-VALIDATION.md]

## Do Not Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Replay cause logic in UI | React-side rule inference from board/timeline state | Existing replay DTOs and `buildSoldierInactivityExplanations` | Project constraints require replay/engine-derived DTOs and forbid rules in React. [VERIFIED: AGENTS.md] [VERIFIED: packages/replay/src/debug-explanations.ts] |
| New permission framework | A broad auth/session system | Small server-side owner resolver seam | Production auth is deferred; this phase is a closure phase for persisted owner replay debug. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] |
| New E2E harness | Custom browser scripts | Existing Playwright service E2E | Playwright is already configured for web E2E and service E2E uses the current app route. [VERIFIED: playwright.config.ts] [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts] |
| New persistence abstraction | ORM or migration-heavy ownership model | Existing `pg` queries / repositories | The schema already stores Match and Chronicle participant IDs needed for this closure. [VERIFIED: packages/persistence/migrations/0001_initial.sql] |

## Test / Verification Strategy

### Unit and Integration Tests

- Add server tests proving authorized persisted owner requests return `mode: "owner"`, `ownerPlayerId`, owner projection, and non-empty `ownerDebug.soldierInactivityExplanations`. [VERIFIED: apps/web/app/matches/server.test.ts]  
- Add server tests proving unauthorized requested owners, missing owner IDs, nonparticipants, and public default requests remain `mode: "public"` with no `ownerDebug`. [VERIFIED: apps/web/app/matches/server.test.ts]  
- Add Workshop helper/client tests for public replay href and owner debug replay href generation, including mirrored Matches where `WORKSHOP_PLAYER_ID` is top. [VERIFIED: apps/web/app/workshop/workshop-client-state.ts] [VERIFIED: packages/persistence/src/matchset-service.ts]  
- Add persistence/workshop tests only if match summaries are extended with owner replay authorization data; the existing `workshop.test.ts` already covers sample catalog and match status mapping patterns. [VERIFIED: packages/persistence/src/workshop.test.ts] [VERIFIED: packages/persistence/src/matchset-status.ts]

### Service-Backed Failure E2E

Use `RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 playwright test --project=desktop --workers=1 workshop-to-replay.spec.ts`. [VERIFIED: package.json] [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts] Add a second test that selects a fast failure-mode sample such as "Failure: thrown exception" or "Failure: invalid output", submits it, launches a Workshop test, calls `/api/test-support/run-worker-once`, opens the owner replay link, checks `.replay-status-chip` is "Owner debug", toggles owner debug, selects a runtime violation event, and asserts the inactivity explanation cause. [VERIFIED: packages/persistence/src/workshop.ts] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-client.tsx]

Also open the public replay URL without owner params for the same persisted Match and assert no `Owner debug`, `Why this Soldier did nothing`, `ownerDebug`, `soldierInactivity`, StrategyMemory, SoldierMemory, objective payload, Awareness Grid, Strategy source, or raw runtime detail markers appear. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] [VERIFIED: apps/web/app/matches/server.test.ts]

### Artifact Closure

Create `08-VERIFICATION.md`, `09-VERIFICATION.md`, `10-VERIFICATION.md`, `11-VERIFICATION.md`, `12-VERIFICATION.md`, and `13-VERIFICATION.md`. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] For phases 8-12, cite existing validation evidence and mark Phase 11 DEBUG-04/05 as closed only by Phase 13 evidence. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] For Phase 13, include exact command outputs from focused web/persistence tests, service E2E, typecheck, lint, and privacy assertions. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md]

## Risks / Pitfalls

| Risk | Why It Matters | Avoidance |
|------|----------------|-----------|
| Treating `ownerPlayerId` query params as authorization | Existing query parser returns requested owner IDs, and audit says query-requested persisted owner IDs must not establish trust. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] | Make authorization a server-side resolver and downgrade to public unless it returns the requested owner. [VERIFIED: apps/web/app/matches/replay-ready.ts] |
| Assuming Workshop owner is always bottom | Preset matrix mirroring can swap bottom/top player IDs. [VERIFIED: packages/persistence/src/matchset-service.ts] | Generate owner links from actual persisted participant side or a summary field derived from Match rows. [VERIFIED: packages/persistence/migrations/0001_initial.sql] |
| Leaking owner debug through serialized public DTOs | Public replay must hide Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, runtime details, and owner debug DTOs. [VERIFIED: AGENTS.md] [VERIFIED: apps/web/app/matches/server.test.ts] | Keep privacy assertions at server DTO and browser E2E layers. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] |
| Moving rule explanations into React | Phase 11 required DTO-driven explanations; React currently maps DTOs to view models. [VERIFIED: .planning/phases/11-doctrine-debugging-ux/11-CONTEXT.md] [VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts] | Keep cause construction in `packages/replay` and only render DTO fields in the UI. [VERIFIED: packages/replay/src/debug-explanations.ts] |
| Slow or flaky failure E2E | Timeout samples can be slower than thrown exception or invalid output samples. [VERIFIED: packages/persistence/src/workshop.ts] | Prefer thrown exception or invalid output for the must-have E2E, and reserve timeout for lower-level coverage already present. [VERIFIED: packages/runtime-js/src/hostile-matrix.test.ts] |
| Verification files inventing evidence | Audit says evidence exists in validation artifacts, but formal verification files are missing. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md] | Generate verification docs from actual existing validation files and Phase 13 command output only. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md] |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Unit / integration framework | Vitest `4.1.6`; config files `vitest.config.ts` and `apps/web/vitest.config.ts`. [VERIFIED: package.json] [VERIFIED: local file scan] |
| Browser framework | Playwright `1.60.0`; config file `playwright.config.ts`. [VERIFIED: package.json] [VERIFIED: playwright.config.ts] |
| Quick run command | `pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts workshop-client.test.tsx replay-state.test.ts replay-client.test.tsx` [VERIFIED: test file inventory] |
| Persistence focused command | `pnpm --filter @cowards/persistence exec vitest run src/workshop.test.ts src/chronicle-store.test.ts` if persistence summaries or owner resolver queries change. [VERIFIED: test file inventory] |
| Service E2E command | `pnpm e2e:service` after services are ready. [VERIFIED: package.json] |
| Full phase gate | `pnpm --filter @cowards/web typecheck && pnpm --filter @cowards/web test -- owner-debug.test.ts server.test.ts workshop-client.test.tsx replay-state.test.ts replay-client.test.tsx && RUN_SERVICE_E2E=1 PLAYWRIGHT_TEST=1 playwright test --project=desktop --workers=1 workshop-to-replay.spec.ts` [VERIFIED: package.json] [VERIFIED: test file inventory] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DEBUG-04 | Persisted owner replay shows inactivity explanation for a real runtime violation | service E2E | `pnpm e2e:service` after adding failure-mode case | Existing file, needs new case: `apps/web/e2e/workshop-to-replay.spec.ts` [VERIFIED: local file scan] |
| DEBUG-05 | Owner overlay consumes DTO data, not React rule inference | unit + component | `pnpm --filter @cowards/web test -- replay-state.test.ts replay-client.test.tsx` | Existing files [VERIFIED: local file scan] |
| P13-SC1 | Authorized persisted owner request upgrades to owner mode | unit/integration | `pnpm --filter @cowards/web test -- server.test.ts owner-debug.test.ts` | Existing files [VERIFIED: local file scan] |
| P13-SC2 | Unauthorized persisted requests stay public and omit ownerDebug | unit/integration + browser | `pnpm --filter @cowards/web test -- server.test.ts && pnpm e2e:service` | Existing files, needs new assertions [VERIFIED: local file scan] |
| P13-SC3 | Public privacy default remains clean | unit + browser | `pnpm --filter @cowards/web test -- server.test.ts && pnpm e2e:service` | Existing files, needs persisted public E2E assertion [VERIFIED: local file scan] |
| P13-SC4 | Runtime violation persists into Chronicle and owner debug | service E2E | `pnpm e2e:service` | Existing file, needs new failure test [VERIFIED: local file scan] |
| P13-SC5 | Formal verification artifacts exist for 8-13 | docs/static check | `test -f .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-VERIFICATION.md` plus file inventory for 8-12 | Files missing now [VERIFIED: local file scan] |

### Sampling Rate

- **Per task commit:** run the narrow package test for touched files, usually `pnpm --filter @cowards/web test -- server.test.ts owner-debug.test.ts workshop-client.test.tsx`. [VERIFIED: package.json] [VERIFIED: test file inventory]
- **Per wave merge:** run focused web typecheck/tests plus any touched persistence tests. [VERIFIED: package.json]
- **Phase gate:** run service-backed E2E with services plus `pnpm --filter @cowards/web typecheck` and relevant unit tests. [VERIFIED: package.json]

### Wave 0 Gaps

- [ ] Add server-side persisted owner authorization tests in `apps/web/app/matches/server.test.ts`. [VERIFIED: apps/web/app/matches/server.test.ts]
- [ ] Add Workshop owner replay link tests in `apps/web/app/workshop/workshop-client.test.tsx` or helper tests. [VERIFIED: apps/web/app/workshop/workshop-client.tsx]
- [ ] Add failure-mode service E2E case to `apps/web/e2e/workshop-to-replay.spec.ts`. [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts]
- [ ] Add `*-VERIFICATION.md` files for phases 8-13. [VERIFIED: local file scan]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Typecheck/tests/dev server | Yes | `v24.15.0` [VERIFIED: local command] | None needed |
| pnpm | Workspace scripts | Yes | `11.1.2` [VERIFIED: local command] | npm cannot run workspace scripts equivalently [ASSUMED] |
| npm | Registry version verification | Yes | `11.12.1` [VERIFIED: local command] | Use lockfile/package.json if offline [ASSUMED] |
| Docker daemon | Docker-backed service E2E/preflight | Yes | `29.4.3` [VERIFIED: local command] | No-Docker local Postgres path exists [VERIFIED: scripts/dev-local-postgres.sh] |
| PostgreSQL CLI | Local service checks | Yes | `psql 16.14`, `pg_isready 16.14`; no local server responded on `/tmp:5432` during research. [VERIFIED: local command] | `pnpm services:up` or `pnpm dev:local -- --setup-only` [VERIFIED: package.json] |
| Redis CLI | Direct Redis checks | No | `redis-cli` missing [VERIFIED: local command] | Docker Compose Redis service; preflight can skip Redis for local path. [VERIFIED: scripts/wait-for-compose-services.sh] [VERIFIED: scripts/dev-local-postgres.sh] |

**Missing dependencies with no fallback:** none found for planning. [VERIFIED: local command]  
**Missing dependencies with fallback:** `redis-cli` is missing, but Docker Compose and existing preflight/local scripts provide fallback paths. [VERIFIED: local command] [VERIFIED: package.json]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Partial | Production authentication is deferred, so do not claim authenticated user ownership; use a scoped server-side owner resolver for the no-auth Workshop app. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] |
| V3 Session Management | No for this phase | No session system exists in current scope; adding one is out of scope. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] |
| V4 Access Control | Yes | Server-side authorization must gate owner replay DTOs before they reach the client. [VERIFIED: .planning/v1.1-INTEGRATION-CHECK.md] |
| V5 Input Validation | Yes | Query params are parsed but must be treated as untrusted requests, not authorization. [VERIFIED: apps/web/app/matches/[matchId]/replay/owner-debug.ts] |
| V6 Cryptography | No new crypto | No new token cryptography is recommended unless the planner chooses an opaque grant design; current recommendation uses server-side persisted participant checks. [ASSUMED] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Owner ID guessing through query params | Elevation of privilege / Information disclosure | Server verifies requested owner against trusted persisted owner source and downgrades public otherwise. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] |
| Public replay private DTO leak | Information disclosure | Assert serialized public DTOs and public browser pages omit ownerDebug/private markers. [VERIFIED: apps/web/app/matches/server.test.ts] [VERIFIED: apps/web/e2e/replay.fixture.spec.ts] |
| Web/API Strategy execution during E2E | Elevation of privilege / Tampering | Continue using worker route that launches the worker path; do not execute Strategy source in web/API code. [VERIFIED: apps/web/e2e/workshop-to-replay.spec.ts] [VERIFIED: AGENTS.md] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Authorizing `WORKSHOP_PLAYER_ID` for Workshop MatchSets is an acceptable no-auth local trust source when scoped to development/test owner-debug gates. [ASSUMED] | Recommended Implementation Strategy | If this is too weak, planner should choose an opaque persisted owner grant/link token instead of participant-only authorization. |
| A2 | npm is not a practical fallback for current pnpm workspace scripts. [ASSUMED] | Environment Availability | If wrong, planner could document npm equivalents, but current scripts are pnpm-native. |
| A3 | New cryptographic token design is unnecessary for this closure if server-side Workshop participant authorization is accepted. [ASSUMED] | Security Domain | If stronger non-guessability is required, add a persisted owner-debug grant/token task. |

## Open Questions

1. **Should the no-auth owner resolver authorize by Workshop participant alone, or should it add an opaque owner replay grant?**  
   What we know: production authentication is deferred, query params alone cannot establish trust, and Match/Chronicle rows store participant IDs. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md] [VERIFIED: packages/persistence/migrations/0001_initial.sql]  
   What's unclear: whether participant membership plus local Workshop scoping is considered sufficiently trusted for Phase 13. [ASSUMED]  
   Recommendation: plan the participant resolver as the smallest implementation, with an explicit escalation option to an opaque grant if plan review rejects participant-only trust. [ASSUMED]

2. **Should owner debug links be a second link or replace the current Open replay link in Workshop?**  
   What we know: public replay URLs must remain public by default, and Workshop should be the primary owner-debug path. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md]  
   What's unclear: exact UI copy/placement is discretionary. [VERIFIED: .planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md]  
   Recommendation: keep "Open replay" public and add a distinct owner-debug link when replay exists. [ASSUMED]

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project non-negotiables and testing expectations. [VERIFIED: local file read]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` - milestone status and Phase 13 requirement scope. [VERIFIED: local file read]
- `.planning/v1.1-MILESTONE-AUDIT.md`, `.planning/v1.1-INTEGRATION-CHECK.md` - exact gap definition and required closure. [VERIFIED: local file read]
- `.planning/phases/13-close-gap-persisted-owner-replay-debug-authorization/13-CONTEXT.md` - locked decisions and deferred scope. [VERIFIED: local file read]
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts`, `page.tsx`, `apps/web/app/matches/server.ts`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/replay-fixture.ts` - replay authorization path. [VERIFIED: local file read]
- `apps/web/app/workshop/workshop-client-state.ts`, `workshop-client.tsx`, `packages/persistence/src/workshop.ts`, `packages/persistence/src/matchset-service.ts`, `packages/persistence/src/matchset-status.ts` - Workshop link and Match ownership data. [VERIFIED: local file read]
- `apps/web/e2e/workshop-to-replay.spec.ts`, `apps/web/e2e/replay.fixture.spec.ts`, `apps/web/app/matches/server.test.ts` - existing E2E/privacy/server test patterns. [VERIFIED: local file read]
- `CowardsGameSpec_Full_Consolidated_v1.md`, `CowardsGame_Technical_Architecture_Spec_V1.md` - Chronicle privacy, worker/runtime, replay, and Workshop principles. [CITED: local specs]

### Secondary (MEDIUM confidence)

- Context7 `/vercel/next.js` docs - App Router `searchParams` Promise behavior. [CITED: Context7 CLI]
- Context7 `/microsoft/playwright` docs - locator/page assertions for E2E checks. [CITED: Context7 CLI]
- npm registry - current package versions and publish modified timestamps. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- No tertiary web-only sources used. [VERIFIED: research log]

## Metadata

**Confidence breakdown:**
- Existing code path: HIGH - verified by direct source and tests. [VERIFIED: codebase grep]
- Recommended authorization seam: MEDIUM - exact no-auth trust source is discretionary and has one assumption. [VERIFIED: 13-CONTEXT.md] [ASSUMED]
- Test strategy: HIGH - existing Vitest/Playwright files and scripts are present. [VERIFIED: local file scan]
- Verification artifact strategy: HIGH - audit and existing validation files identify required docs and evidence. [VERIFIED: .planning/v1.1-MILESTONE-AUDIT.md]

**Research date:** 2026-05-18 [VERIFIED: local date context]  
**Valid until:** 2026-06-17 for codebase-specific findings; re-check npm/Next/Playwright versions before dependency changes. [ASSUMED]
