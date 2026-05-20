# Phase 29: Demo Competition Rebuild - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 29 regenerates and validates the full public demo competition evidence loop under `cowards-rules-v1.4`. It creates a new v1.4 demo ladder route, generates starter-derived entrants, runs MatchSets through the worker, validates standings/results/replays/profiles/Strategy cards/governance states, performs browser visual review, and writes a human-readable demo validation summary.

This phase does not change core rules, rewrite the engine/replay model, or retune starter doctrines except when the qualitative demo gate reveals an issue that must be fixed before the demo can be trusted. If demo play is implausible, unclear, or exposes broken starters, Phase 29 should tune/regenerate or fail rather than passing on green tests alone.

</domain>

<decisions>
## Implementation Decisions

### Demo Rebuild Scope
- **D-01:** Rebuild the full public evidence loop: v1.4 demo ladder, MatchSets, standings, result pages, replay links, player profiles, Strategy cards, and governance/counting states.
- **D-02:** Use a new route/slug in the style `/ladder/v1-4-demo`, not `/ladder/v14-demo`, to avoid confusion with "version fourteen."
- **D-03:** Seed the demo from the v1.4 starter set or representative subset, with a minimum of 8 entrants.
- **D-04:** Main demo evidence should be real generated counted results.
- **D-05:** Add one or two seeded governance/counting examples if needed to prove invalid/non-counted UI states.
- **D-06:** Governance/non-counted examples should be isolated or clearly excluded so the main demo standings remain clean counted evidence.

### Validation Metrics
- **D-07:** Human-readable demo summary must include corrected-rule evidence metrics: rule version, entrant count, MatchSet/job counts, counted/non-counted states, interleaved Cycle trace samples, contraction count, movement count, blocked-move recovery count, Backstab count, replay privacy projection checks, and representative replay links.
- **D-08:** Realistic interleaved tactical play must show multiple behavior signals: alternating selected slots by Cycle layer, board changes observed between the same Soldier's Cycles, non-terminal blocked-move recovery, Cycle-boundary Backstab opportunities/resolutions, and matches reaching contraction.
- **D-09:** Demo matches should commonly reach board contraction, with representative replay links proving it.
- **D-10:** Include short qualitative human review notes in the demo summary: whether play looks credible, which doctrines look weak/strong, and follow-up tuning notes.

### Old v1.3 Cleanup
- **D-11:** Delete active v1.3 demo data, routes, and seeds from active paths. Keep v1.3 demo evidence references only in archived milestone/audit docs if useful.
- **D-12:** Replace the v1.3 demo script/path with a v1.4 script/path using the new route slug, rule-version metadata, and starter generation path.
- **D-13:** The v1.4 demo script should explicitly clean old `v13-demo` demo users, strategies, revisions, MatchSets, jobs, and Chronicles before generating v1.4 data.
- **D-14:** Active README/current docs should point to v1.4 demo evidence, not v1.3.

### Public Surface Verification
- **D-15:** Phase 29 must render all public evidence pages locally: `/ladder/v1-4-demo`, MatchSet result pages, replay pages, player profile pages, Strategy card pages, and governance/non-counted state pages.
- **D-16:** Verify public pages and DTOs do not expose private data: Strategy source where it should be private, StrategyMemory, SoldierMemory, objective payloads, owner debug, Awareness Grid details, raw runtime internals, or private errors.
- **D-17:** Full owner/private workflow verification is not required unless Phase 29 touches those paths.
- **D-18:** Include browser visual review of key local pages after data generation, checking layout, replay clarity, stale/private-data absence, and governance/counting readability.

### End-to-End Test Command
- **D-19:** Phase 29 requires the full v1.4 trust chain: engine, replay, persistence, worker, web, starter, demo tournament, Playwright replay/public page checks, privacy checks, and browser verification.
- **D-20:** Run both `pnpm verify` if feasible and a focused v1.4 demo verification script that checks generated evidence and summary metrics.
- **D-21:** Add a qualitative gate: if metrics or replay review show implausible play, no contraction, unclear interleaving, or obviously broken starters, tune/regenerate or fail instead of passing on green tests alone.
- **D-22:** Write a human-readable `29-SUMMARY.md` or demo validation report with commands run, metrics, representative links, screenshots/visual review notes, privacy checks, and follow-up tuning notes.

### Planner Discretion
- The planner may choose exact script names if they clearly replace the v1.3 demo path and produce v1.4 evidence.
- The planner may choose numeric thresholds for "commonly reach contraction," blocked-move recovery counts, and Backstab counts, provided they are strict enough to catch implausible demos.
- The planner may decide whether seeded governance examples use actual DB state seeded by script or deterministic fixture pages, as long as they are isolated from clean demo standings.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Upstream v1.4 Context
- `.planning/PROJECT.md` — public evidence, privacy, competition trust, and v1.4 correction constraints.
- `.planning/REQUIREMENTS.md` — DEMO-01 through DEMO-05 define Phase 29 requirements.
- `.planning/ROADMAP.md` — Phase 29 goal, success criteria, and notes.
- `.planning/STATE.md` — active milestone context.
- `.planning/milestones/v1.4-phases/25-rule-source-of-truth-version/25-CONTEXT.md` — rule label, provenance, v1.3 historical policy, and evidence-boundary decisions.
- `.planning/milestones/v1.4-phases/26-engine-cycle-scheduler-rewrite/26-CONTEXT.md` — engine behavior the demo must prove.
- `.planning/milestones/v1.4-phases/27-chronicle-and-replay-rebaseline/27-CONTEXT.md` — replay evidence, stale old links, fixture, privacy, and browser verification decisions.
- `.planning/milestones/v1.4-phases/28-starter-strategy-and-input-rebaseline/28-CONTEXT.md` — starter versioning, generated entrant metadata, gauntlet, and pre-live old-data cleanup decisions.
- `.planning/milestones/v1.3-MILESTONE-AUDIT.md` — historical example of useful demo validation metrics and product-learning notes.

### Demo Generation and Competition Surfaces
- `scripts/run-v13-demo-tournament.ts` — current v1.3 demo generation script to replace with v1.4 path.
- `packages/persistence/src/starter-strategies.ts` — v1.4 starter definitions and metadata used to seed demo entrants.
- `packages/persistence/src/ladder.ts` — trial ladder season creation, entry, scheduling, standings, and season DTO generation.
- `packages/persistence/src/matchset-service.ts` — MatchSet creation from entrant snapshots and presets.
- `packages/persistence/src/matchset-status.ts` — completion/degraded status aggregation.
- `packages/persistence/src/scoring.ts` — deterministic scoring and tie-breakers.
- `packages/persistence/src/governance.ts` — flagging, invalid/non-competitive marking, counted status changes, and audit events.
- `apps/worker/src/runner.ts` and `apps/worker/src/runtime-config.ts` — Match execution, worker processing, runtime adapter metadata.
- `scripts/preflight.ts` — existing replay/projection/UI preflight checks to mirror or extend.

### Public Pages and Privacy
- `apps/web/app/ladder/[seasonId]/page.tsx` — public ladder page for `/ladder/v1-4-demo`.
- `apps/web/app/matchsets/[matchSetId]/page.tsx` — public MatchSet result/provenance/evidence page.
- `apps/web/app/matches/[matchId]/replay/page.tsx` and `apps/web/app/matches/[matchId]/replay/replay-client.tsx` — public replay route and UI.
- `apps/web/app/players/[handle]/page.tsx` — public player profile page.
- `apps/web/app/strategies/[strategyId]/page.tsx` — public Strategy card page.
- `packages/spec/src/competition.ts` — public DTO contracts, counted status, publication metadata, and leak-safe assertions.
- `packages/persistence/src/competition.ts` and `packages/persistence/src/profiles.ts` — public result/profile/card projection.
- `apps/web/e2e/replay.fixture.spec.ts` and `apps/web/e2e/replay.visual.spec.ts` — replay browser/visual verification patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `run-v13-demo-tournament.ts` already resets demo data, seeds users/strategies/revisions from starters, schedules a trial ladder, runs worker jobs, checks counted MatchSets, completes the season, and prints JSON summary.
- `buildTrialLadderSeasonDto` already produces standings and MatchSet links for public ladder pages.
- Governance helpers can seed under-review, invalid, non-competitive, or non-counted states when isolated examples are needed.
- Public pages already cover ladder, MatchSet results, profiles, Strategy cards, and replay links.
- `preflight.ts` already demonstrates Chronicle replay parsing, public projection, and web replay route rendering checks.

### Established Patterns
- Counted standings are a projection from complete, valid, replay-backed MatchSets.
- System failures do not become player losses.
- Public evidence surfaces should show provenance and hashes without leaking private Strategy/runtime/debug data.
- Demo validation should include concrete metrics, not only "tests passed."

### Integration Points
- Replace hardcoded `v13-demo` ids, slugs, worker ids, and copy with v1.4 equivalents using `/ladder/v1-4-demo`.
- Add rule-version/starter-version/source-hash/generation metadata to demo revisions and public provenance.
- Add cleanup for old v13 demo rows before v1.4 generation.
- Add focused v1.4 demo verification command/report generation.
- Add browser/Playwright verification of generated public pages and representative replay links.

</code_context>

<specifics>
## Specific Ideas

- Use representative replay links in the summary for: interleaved Cycle trace, contraction, blocked-move recovery, Cycle-boundary Backstab, and governance/non-counted display if applicable.
- Keep main standings clean and counted; prove governance states separately.
- The demo should be allowed to fail on "looks wrong" even when code-level tests pass.
- The final summary should be useful for future milestone audit and onboarding.

</specifics>

<deferred>
## Deferred Ideas

- Durable all-time ratings, official tournaments, and permanent leaderboard promises remain out of scope.
- Broad spectator/community surfaces remain future work.
- Owner-only workflow retesting is deferred unless Phase 29 touches owner/private paths.

</deferred>

---

*Phase: 29-Demo Competition Rebuild*
*Context gathered: 2026-05-20*
