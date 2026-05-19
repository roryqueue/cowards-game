# Feature Research: v1.3 Competition Trust Beta

**Project:** Coward's Game  
**Date:** 2026-05-19  
**Milestone context:** v1.3 Competition Trust Beta

## Table Stakes

### Trial Ladder Seasons

- Resettable seasons/trial ladders with public status: pending, open, scheduling, active, completed, archived.
- Standings are season-scoped and resettable, not permanent all-time ratings.
- Scoring uses deterministic MatchSet points and visible tie-breakers; v1.3 should not promise Elo/Glicko.
- Public season pages show eligible entries, scheduled/active/completed MatchSets, counted status, standings, and replay evidence.

### Competition Eligibility Rules

- Exhibition remains flexible: 2-8 owned revisions, same-user self-play allowed.
- Trial ladder enforces one active Strategy Revision per user per season.
- Ladder entries lock immutable Strategy Revision snapshots at entry time.
- Replacement policy is explicit: either next-season-only or cooldown-based. Recommended v1.3 default is next-season-only for trust and simplicity, with cooldown-based replacement deferred unless needed.
- Stale, deleted, superseded, incompatible, withdrawn, or invalidated revisions have visible behavior before scheduling, after scheduling, and after result publication.

### Submission and Matchmaking Queue

- Signed-in user can enter an eligible Strategy Revision into the current trial ladder.
- Periodic scheduler generates MatchSets from queued entries.
- Small round-robin pods are the best v1.3 scheduling shape because they are easy to inspect, deterministic, and compatible with existing MatchSet scoring.
- Pending, active, completed, degraded, invalid, and non-competitive states are visible to users.
- Retry/degraded/system-failure policy prevents unresolved system failures from counting toward standings.

### Public Player and Strategy Profiles

- Public handle page for each player.
- Public Strategy card with name, description, tags, author handle, public revision lineage metadata, source hash, runtime compatibility, record, and replay/result links.
- Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, and private runtime internals stay hidden by default.
- Owner-only affordances let the author fork, edit, inspect source, or debug from authorized routes.

### Dispute and Moderation Surface

- Result page can accept a flag/dispute note from a signed-in user.
- Public result pages show whether a MatchSet counted, is under review, was invalidated, or was marked non-competitive.
- Admin-only review view can inspect private evidence needed for governance without changing public projection policy.
- Admin can mark a MatchSet invalid/non-competitive for standings.
- Invalidation creates an immutable audit log with actor, reason, timestamp, target, before/after state, and public explanation.

### Runtime/Sandbox Production Decision Spike

- Choose the near-term production runtime boundary: hardened subprocess, containerized subprocess, or WASM/WASI.
- Prototype the chosen boundary behind the existing `StrategyExecutionAdapter`.
- Keep worker-thread runtime as local/dev fallback if useful.
- Expand hostile Strategy regression coverage around the chosen path.

### Starter Strategy Library

- Seed about 10 forkable starter Strategies as first-class Workshop library entries, not automatic active submissions.
- Each starter has name, description, tags, doctrine notes, expected behavior, source, validation report, and version/source hash.
- Starter Strategies should be simple enough to read and credible enough to beat naive or mismatched opponents.
- Recommended set:
  - Centerline Bully: claims central space and pressures enemies toward contraction danger.
  - Corner Lurker: defensive corner doctrine that punishes overextension.
  - Backstab Hunter: positions for legal Backstab opportunities.
  - Wall Press: uses edges and lateral pressure for traps.
  - Ring Runner: stays just inside danger and outlasts slower opponents.
  - Mirror Breaker: mirrors early, then breaks symmetry around contraction or pressure openings.
  - Center Turtle: conservative central survival and low-risk mobility.
  - Aggro Chaser: direct pursuit baseline with real offensive pressure.
  - Escape Artist: prioritizes legal exits, mobility, and anti-pin behavior.
  - Trap Setter: baits opponent into edge, contraction, or push-chain danger.

## Differentiators

- Replay-backed trial ladder evidence from day one.
- Public Strategy cards that create pride and learning without leaking source.
- Starter Strategies that teach doctrine families instead of only API syntax.
- Governance surface before rankings are permanent.
- Runtime hardening treated as a competition trust feature, not invisible infrastructure.

## Anti-Features for v1.3

- Permanent all-time rating contract.
- Public tournaments or prizes.
- Auto-submitting starter Strategies on behalf of users.
- Publishing Strategy source or private runtime/debug fields.
- Public moderation tooling that exposes sensitive evidence.
- Multi-language Strategy support as part of the starter library.

## Open Product Decisions

1. Replacement policy: recommended next-season-only for v1.3, with cooldown-based replacement as future work.
2. Scheduler cadence: recommended manual/admin-triggered plus periodic job support, so early operations can inspect pods.
3. Admin scope: recommended minimal single-role admin capability rather than full role/organization system.
4. Starter Strategy ownership: recommended system-owned immutable templates that users fork into account-owned Strategies.

## Sources

- User v1.3 milestone brief.
- Local: `.planning/PROJECT.md`
- Local: `.planning/milestones/v1.2-REQUIREMENTS.md`
- Local: `packages/persistence/src/workshop.ts`
- Local: `apps/web/app/exhibitions/new/exhibition-client.tsx`
- Local: `apps/web/app/matchsets/[matchSetId]/page.tsx`
