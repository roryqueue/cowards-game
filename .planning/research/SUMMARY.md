# Research Summary

**Project:** Coward's Game
**Date:** 2026-05-19
**Milestone context:** v1.2 Competitive Alpha

## Key Findings

**Stack:** Keep the current TypeScript monorepo, Next.js web app, shared packages, PostgreSQL persistence, worker execution, Chronicle validation, and Playwright/Vitest verification spine. v1.2 should add minimal account/session persistence and competitive MatchSet data contracts without changing the engine's purity boundary.

**Ownership:** Competitive submissions need stable User identity, password-backed sign in, session persistence, display names/handles, and server-side ownership checks. Email verification, password reset, OAuth, account recovery, organizations, and admin moderation are not required for this alpha.

**Competition:** Start with small unranked or seeded exhibition MatchSets rather than ranked ladders. The model must lock immutable Strategy Revision snapshots, define stale revision behavior, scoring policy, tie-breakers, publication rules, and failure policy before UX surfaces make results public.

**Self-play:** v1.2 should allow one user to enter multiple distinct owned Strategy Revisions into the same exhibition MatchSet so developers/players can test strategies against each other. Exact duplicate snapshots can be rejected; one Strategy per user belongs with ranked or more formal competition.

**Replay Evidence:** Public result pages should show standings, score breakdowns, per-Match replay links, degraded/failed handling, and provenance. Public projections must preserve v1.1 privacy gates for Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, and runtime internals.

**Fairness:** Competitive Alpha needs basic abuse and fairness guardrails: rate limits, duplicate snapshot handling, deterministic runtime failure penalties, system-vs-strategy failure classification, valid-result criteria, and tests proving public output stays privacy-safe.

## Prescriptive Direction

1. Start with competitive ownership/session work so Strategy Revisions and entries have stable owners before public competition flows rely on them.
2. Define MatchSet competition contracts before building queue or result UI; scoring and publication rules are trust contracts, not decoration.
3. Build exhibition/seeding flows as unranked alpha competition and explicitly allow same-owner self-play with distinct Strategy Revisions.
4. Publish result/replay evidence only through strict Chronicle validation and public privacy projection.
5. Close the milestone with guardrail tests that prove invalid, duplicate, failed, degraded, and private-leaking competitive outputs are handled correctly.

## Requirements Implications

Recommended v1.2 requirement categories:

- Competitive Ownership
- MatchSet Competition Model
- Exhibition Queue
- Results and Replay Evidence
- Abuse and Fairness Guardrails

## Roadmap Implications

Recommended phase continuation after v1.1 Phase 13:

1. **Phase 14: Competitive Ownership and Sessions**
   Minimal username/password ownership, sessions, Strategy ownership, and competitive authorization.
2. **Phase 15: MatchSet Competition Model**
   Presets, immutable snapshots, scoring, tie-breakers, stale revision behavior, and publication contracts.
3. **Phase 16: Exhibition Queue and Entry**
   Unranked or seeded MatchSets, alpha self-play, queue status, compatibility checks, and exact duplicate handling.
4. **Phase 17: Result Pages and Replay Evidence**
   Public MatchSet pages, scoring breakdowns, replay links, provenance, degraded/failed Match visibility, and privacy-safe output.
5. **Phase 18: Abuse and Fairness Guardrails**
   Rate limits, duplicate policy, failure penalties, valid-result criteria, and privacy/fairness tests.

## Watch Out For

- Accidentally turning exhibition MatchSets into ranked ladder infrastructure.
- Treating `player:workshop-local` as a competitive owner.
- Enforcing one Strategy per user too early and losing useful self-play testing.
- Publishing Strategy source, StrategyMemory, SoldierMemory, objectives, owner debug, raw Awareness Grid details, or runtime internals on public result pages.
- Letting tie-breakers depend on wall-clock time, database row order, worker scheduling, or any other non-deterministic source.
- Penalizing players for system failures instead of classifying degraded or invalid competitive results.

## Sources

- User milestone brief for v1.2 Competitive Alpha.
- `.planning/PROJECT.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.1-ROADMAP.md`
