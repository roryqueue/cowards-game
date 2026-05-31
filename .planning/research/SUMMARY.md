# v1.31 Research Summary

**Project:** Coward's Game
**Milestone:** v1.31 Public Site Spine and Discovery Reads
**Domain:** Public site navigation, discovery reads, Watch/competition hubs, signed-in entry spine, public-safe cross-linking, and boundary monitors separate from `match-execution-app-v1`
**Researched:** 2026-05-31
**Confidence:** High after implementation, validation, and audit.

## Executive Summary

Coward's Game now has strong individual product surfaces, but they are not arranged like a public competitive site. The root route renders Workshop directly, the global layout has no site shell, and public discovery relies on knowing object URLs such as MatchSet result pages, replay pages, player profiles, Strategy cards, and ladder detail pages.

v1.31 added a public discovery spine without reopening the frozen execution/app contract. The delivered shape is a separate set of discovery reads: `getPublicHomeDiscovery`, `getPublicWatchIndex`, `getPublicCompetitionIndex`, `getPublicCompetitionDetail`, and `getSignedInCompetitionEntryDashboard`. These reads aggregate existing public-safe projections and canonical hrefs while avoiding any change to `match-execution-app-v1`.

## Baseline Findings

- `/` currently imports `WorkshopClient` and `getWorkshopInitialData`, so anonymous visitors land in the Workshop instead of a public front door.
- `/workshop` already exists and can become the canonical Workshop route.
- Existing global layout only renders `{children}` and imports `globals.css`; it has no global navigation or public/signed-in shell.
- Existing object pages:
  - `/matchsets/[matchSetId]` consumes `getPublicMatchSetResult`.
  - `/matches/[matchId]/replay` consumes replay metadata/evidence through `getMatchReplay`.
  - `/players/[handle]` consumes `getPublicPlayerProfile`.
  - `/strategies/[strategyId]` consumes `getPublicStrategyCard`.
  - `/ladder/[seasonId]` consumes `getPublicLadderSeason`.
  - `/account` consumes account-safe user/revision reads.
  - `/exhibitions/new` is the existing signed-in exhibition entry page.
- Missing desired routes: `/watch`, `/competitions`, `/competitions/[competitionId]`, `/competitions/[competitionId]/enter`, and `/learn`.
- Existing public read route ownership already knows selected Go-backed public reads: Strategy, player, ladder, MatchSet summary, replay metadata, and replay evidence.
- Existing service DTOs support individual public pages, but not discovery/index pages.

## Recommended Scope

- Add discovery DTOs and routes in a new public discovery namespace or service module that is plainly separate from `match-execution-app-v1`.
- Use canonical hrefs that point at existing object pages instead of embedding private or execution-internal payloads.
- Move public landing content to `/`, keep Workshop at `/workshop`, and add a global shell that makes public/signed-in paths obvious.
- Build Watch and competition hubs after the discovery contracts exist.
- Add signed-in entry dashboard reads that list eligible saved revisions without Strategy source.
- Extend privacy and boundary monitors to scan discovery DTOs, pages, and generated proof artifacts.

## Watch Outs

- Do not reuse `match-execution-app-v1` naming, versioning, schemas, or DTOs for discovery reads.
- Do not add fields to `PublicMatchSetResultDto`, replay metadata/evidence DTOs, or match-execution compatibility DTOs just to support index pages.
- Do not surface quarantine, operator actions, recovery payloads, raw diagnostics, runtime-service internals, host paths, env values, DB details, tokens, package paths, Strategy source, StrategyMemory, SoldierMemory, or objective payloads.
- Do not make Python/Rust/Zig look counted or ranked. They remain non-counted exhibition beta.
- Do not execute Strategy code in web/API/Go.
- Do not let the public shell become a landing-page-only veneer; the first screen should route to real public evidence.

## Recommended Phase Structure

1. Phase 211: Route and Link Inventory.
2. Phase 212: Discovery Read Requirements and Boundary Design.
3. Phase 213: Global Site Shell and Navigation.
4. Phase 214: Public Home Discovery Hub.
5. Phase 215: Watch Hub.
6. Phase 216: Competition Hub and Competition Detail.
7. Phase 217: Signed-In Entry Spine.
8. Phase 218: Cross-Link Pass Across Existing Object Pages.
9. Phase 219: Privacy, Boundary, and Discovery Monitor Coverage.
10. Phase 220: Public and Signed-In Journey Proof.
11. Phase 221: Audit, Archive, Commit, and Tag.

## Sources Consulted

- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/MILESTONES.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/v1.29-SUMMARY.md`
- `.planning/milestones/v1.29-MILESTONE-AUDIT.md`
- `.planning/workstreams/v1-27-result-replay-workbench/REQUIREMENTS.md`
- `.planning/workstreams/v1-27-result-replay-workbench/ROADMAP.md`
- `.planning/workstreams/v1-27-result-replay-workbench/research/SUMMARY.md`
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md`
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md`
- `.planning/artifacts/v1.29-replay-result-trust-proof.md`
- `apps/web/app/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/workshop/page.tsx`
- `apps/web/app/account/page.tsx`
- `apps/web/app/exhibitions/new/page.tsx`
- `apps/web/app/ladder/[seasonId]/page.tsx`
- `apps/web/app/matchsets/[matchSetId]/page.tsx`
- `apps/web/app/matches/[matchId]/replay/page.tsx`
- `apps/web/app/players/[handle]/page.tsx`
- `apps/web/app/strategies/[strategyId]/page.tsx`
- `apps/web/lib/public-service-boundary.ts`
- `apps/web/lib/public-service-adapter.ts`
- `apps/web/lib/public-go-read-client.ts`
- `packages/spec/src/competition.ts`
- `packages/spec/src/service.ts`
- `packages/service/src/index.ts`
- `apps/go-backend/live_backend.go`

---
*Research summary written: 2026-05-31*
