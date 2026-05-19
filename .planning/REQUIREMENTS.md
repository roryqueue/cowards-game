# Requirements: Coward's Game v1.3 Competition Trust Beta

**Defined:** 2026-05-19
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.3 Requirements

Requirements for Competition Trust Beta. Each maps to roadmap phases.

### Starter Strategy Library

- [ ] **START-01**: New player can browse a Starter Strategy Library containing approximately 10 credible, playable default Strategies.
- [ ] **START-02**: Starter Strategy entries include name, description, tags, doctrine notes, expected behavior, source hash, validation status, and source.
- [ ] **START-03**: Starter Strategy source is readable, validated, and structured around tactical priorities such as threat escape, pressure, positioning, and survival.
- [ ] **START-04**: User can fork a Starter Strategy into an account-owned Strategy without mutating the system-owned starter template.
- [ ] **START-05**: Forked starter Strategies create normal immutable Strategy Revisions that can be tested in exhibition and submitted to eligible competitions.
- [ ] **START-06**: Starter Strategy tests prove each starter validates successfully and can run through at least one exhibition smoke Match without forbidden runtime behavior.
- [ ] **START-07**: Developer can identify each starter doctrine as one of Centerline Bully, Corner Lurker, Backstab Hunter, Wall Press, Ring Runner, Mirror Breaker, Center Turtle, Aggro Chaser, Escape Artist, or Trap Setter.

### Trial Ladder Seasons

- [ ] **SEASON-01**: User can view a public resettable trial ladder season with status, name, schedule state, scoring policy, and season-scoped standings.
- [ ] **SEASON-02**: Developer can create, open, close, complete, and archive a trial ladder season without creating permanent all-time ratings.
- [ ] **SEASON-03**: Trial ladder standings are scoped to one season and explicitly reset between seasons.
- [ ] **SEASON-04**: Trial ladder season contracts record preset id, scoring policy version, eligibility policy, replacement policy, stale revision policy, and publication policy.
- [ ] **SEASON-05**: Trial ladder public pages distinguish pending, open, scheduling, active, completed, and archived season states.
- [ ] **SEASON-06**: Trial ladder data model avoids Elo, Glicko, durable all-time ratings, ranked prize ladder, or tournament commitments.

### Ladder Eligibility and Entry

- [ ] **ENTRY-01**: Signed-in user can enter exactly one active Strategy Revision into a trial ladder season.
- [ ] **ENTRY-02**: Trial ladder entry requires an owned, valid, immutable, runtime-compatible Strategy Revision snapshot.
- [ ] **ENTRY-03**: Trial ladder entry locks revision id, owner id, owner handle, source hash, source bytes, runtime compatibility, engine compatibility, and entered-at metadata.
- [ ] **ENTRY-04**: User cannot enter multiple active Strategy Revisions into the same trial ladder season.
- [ ] **ENTRY-05**: Exhibition competition remains flexible and still allows 2-8 owned revisions, including same-user self-play with distinct revisions.
- [ ] **ENTRY-06**: Trial ladder replacement policy is next-season-only for v1.3; users cannot replace an active ladder revision after entering the current season.
- [ ] **ENTRY-07**: User receives clear feedback when a ladder entry is rejected for ownership, validation, compatibility, duplicate active entry, closed season, or stale revision status.
- [ ] **ENTRY-08**: Trial ladder policy defines behavior for deleted, superseded, incompatible, withdrawn, or invalidated revisions before scheduling, after scheduling, and after publication.

### Automated Scheduling and Standings

- [ ] **SCHED-01**: Developer or scheduler can generate deterministic trial ladder MatchSets from eligible season entries.
- [ ] **SCHED-02**: Scheduler creates small seeded or round-robin pods using stable entry ids, snapshot hashes, preset policy, and deterministic ordering rather than database row order or wall-clock tie-breakers.
- [ ] **SCHED-03**: Generated ladder MatchSets reuse existing MatchSet, Match, worker, scoring, Chronicle, replay, and public result infrastructure.
- [ ] **SCHED-04**: User can see ladder entry and MatchSet states as pending, queued, running, complete, degraded, invalid, or non-competitive.
- [ ] **SCHED-05**: Standings aggregate only counted MatchSets with complete valid scoring and replay/provenance evidence.
- [ ] **SCHED-06**: Degraded, failed, invalid, non-competitive, or unresolved system-failure MatchSets do not distort standings.
- [ ] **SCHED-07**: Public standings show rank, points, record, deterministic tie-breakers, counted MatchSets, and links to replay-backed evidence.
- [ ] **SCHED-08**: Standings can be recomputed from season entries, counted MatchSets, scoring policy, and moderation state.
- [ ] **SCHED-09**: Tests prove deterministic scheduling, standings aggregation, tie-breakers, counted/non-counted exclusion, and retry/degraded handling.

### Public Profiles and Strategy Cards

- [ ] **PROF-01**: Public player handle page shows display name, handle, public Strategy cards, trial ladder history, competition record, and replay/result links.
- [ ] **PROF-02**: Public Strategy card shows name, description, tags, author handle, revision lineage metadata, source hash, runtime compatibility, competition history, and replay/result links.
- [ ] **PROF-03**: Public profile and Strategy DTOs exclude Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, private runtime internals, and private errors by default.
- [ ] **PROF-04**: Owner-only affordances let an authorized owner fork, edit, inspect source, or debug their Strategy without changing public output.
- [ ] **PROF-05**: Public Strategy lineage shows metadata and revision relationships without exposing private code or memory.
- [ ] **PROF-06**: Public profile/card tests assert privacy-safe projections and stable links to standings, MatchSets, and replays.

### Dispute and Moderation

- [ ] **GOV-01**: Signed-in user can flag a MatchSet result with a dispute note tied to public replay/provenance evidence.
- [ ] **GOV-02**: Public result pages show whether a MatchSet counted, is under review, was invalidated, or was marked non-competitive.
- [ ] **GOV-03**: Admin can inspect result provenance, entrant snapshots, scoring evidence, Chronicle hashes, runtime failure classifications, and private review-only details through an admin-only surface.
- [ ] **GOV-04**: Admin can mark a MatchSet invalid for standings when evidence is incomplete, corrupted, privacy-unsafe, or affected by unresolved system failure.
- [ ] **GOV-05**: Admin can mark a MatchSet non-competitive without deleting public replay evidence.
- [ ] **GOV-06**: Invalidation or non-competitive marking updates standings by excluding the affected MatchSet from counted results.
- [ ] **GOV-07**: Every dispute, review decision, invalidation, and non-competitive marking writes an audit event with actor, target, timestamp, reason, before/after state, and public explanation.
- [ ] **GOV-08**: Public and admin tests prove result flagging, admin authorization, standings exclusion, audit log creation, and privacy-safe public moderation output.

### Runtime Boundary Spike

- [ ] **RUNTIME-01**: Developer can select and document the recommended production Strategy runtime boundary path for v1.3: hardened subprocess, containerized subprocess, or WASM/WASI prototype.
- [ ] **RUNTIME-02**: Chosen runtime boundary is implemented or prototyped behind the existing `StrategyExecutionAdapter` without changing engine rules or Strategy API output contracts.
- [ ] **RUNTIME-03**: Worker-thread runtime remains available as an explicitly labeled local/dev fallback if the chosen production boundary needs host support.
- [ ] **RUNTIME-04**: Runtime adapter metadata exposes isolation boundary, resource controls, timeout behavior, output caps, environment policy, and production-readiness status.
- [ ] **RUNTIME-05**: Chosen runtime path validates JSON IPC input/output schemas and distinguishes Strategy failure from system failure.
- [ ] **RUNTIME-06**: Hostile Strategy regression coverage includes forbidden globals, dynamic import, process/worker access, filesystem/network attempts, infinite loops, memory pressure, oversized output, invalid output, thrown exceptions, malformed IPC, timeout, and subprocess/container termination.
- [ ] **RUNTIME-07**: Runtime preflight or diagnostics prove configured resource limits and fallback behavior are visible to developers before trial ladder launch.

## Future Requirements

Deferred to a later milestone.

### Durable Competition

- **DURABLE-01**: User can participate in permanent all-time ratings after abuse, moderation, and sandbox data support a durable ranking promise.
- **DURABLE-02**: User can inspect historical rating movement and rating math explanations.
- **DURABLE-03**: User can participate in scheduled public tournaments with bracket or round-robin formats.
- **DURABLE-04**: Competition operators can configure prizes, seasons with durable promotion/relegation, or official ranked tiers.

### Account and Community

- **ACCT-01**: User can verify email ownership.
- **ACCT-02**: User can reset a forgotten password.
- **ACCT-03**: User can use OAuth or passkey sign-in.
- **COMM-01**: User can follow players, save favorite Strategies, or browse a community Strategy gallery.

### Runtime and Arena Expansion

- **MULTI-01**: Developer can add non-JS Strategy runtimes behind the same StrategyRuntime interface.
- **ARENA-01**: User can compete on custom or generated Arena Variants after replay compatibility and preset policy are stable.

## Out of Scope

Explicitly excluded from v1.3. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Permanent Elo/Glicko or all-time ratings | v1.3 intentionally uses resettable trial standings while abuse, moderation, and sandbox behavior are still being learned. |
| Public tournaments, brackets, prizes, or official ranked tiers | Operational complexity and trust stakes are too high before trial ladder governance is proven. |
| Mid-season Strategy replacement | Next-season-only replacement is simpler, clearer, and harder to abuse for the first trial ladder beta. |
| Breaking exhibition self-play | Exhibition remains the flexible testing surface; strict one-entry policy applies only to trial ladder seasons. |
| Publishing Strategy source or private runtime/debug data | Public learning and pride should not leak private code, memory, objective payloads, owner debug, or runtime internals. |
| Full enterprise admin/account platform | v1.3 needs focused result governance, not organizations, support queues, account recovery, or broad role management. |
| Multi-language Strategy support | Runtime spike should harden the current JS/TS adapter boundary before expanding languages. |
| Custom or randomized maps | Arena expansion would complicate fairness and replay compatibility while ladder trust is still being proven. |
| Live human input or live model inference during Matches | Violates deterministic autonomous Match play. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| START-01 | Phase 19 | Pending |
| START-02 | Phase 19 | Pending |
| START-03 | Phase 19 | Pending |
| START-04 | Phase 19 | Pending |
| START-05 | Phase 19 | Pending |
| START-06 | Phase 19 | Pending |
| START-07 | Phase 19 | Pending |
| SEASON-01 | Phase 20 | Pending |
| SEASON-02 | Phase 20 | Pending |
| SEASON-03 | Phase 20 | Pending |
| SEASON-04 | Phase 20 | Pending |
| SEASON-05 | Phase 20 | Pending |
| SEASON-06 | Phase 20 | Pending |
| ENTRY-01 | Phase 20 | Pending |
| ENTRY-02 | Phase 20 | Pending |
| ENTRY-03 | Phase 20 | Pending |
| ENTRY-04 | Phase 20 | Pending |
| ENTRY-05 | Phase 20 | Pending |
| ENTRY-06 | Phase 20 | Pending |
| ENTRY-07 | Phase 20 | Pending |
| ENTRY-08 | Phase 20 | Pending |
| SCHED-01 | Phase 21 | Pending |
| SCHED-02 | Phase 21 | Pending |
| SCHED-03 | Phase 21 | Pending |
| SCHED-04 | Phase 21 | Pending |
| SCHED-05 | Phase 21 | Pending |
| SCHED-06 | Phase 21 | Pending |
| SCHED-07 | Phase 21 | Pending |
| SCHED-08 | Phase 21 | Pending |
| SCHED-09 | Phase 21 | Pending |
| PROF-01 | Phase 22 | Pending |
| PROF-02 | Phase 22 | Pending |
| PROF-03 | Phase 22 | Pending |
| PROF-04 | Phase 22 | Pending |
| PROF-05 | Phase 22 | Pending |
| PROF-06 | Phase 22 | Pending |
| GOV-01 | Phase 23 | Pending |
| GOV-02 | Phase 23 | Pending |
| GOV-03 | Phase 23 | Pending |
| GOV-04 | Phase 23 | Pending |
| GOV-05 | Phase 23 | Pending |
| GOV-06 | Phase 23 | Pending |
| GOV-07 | Phase 23 | Pending |
| GOV-08 | Phase 23 | Pending |
| RUNTIME-01 | Phase 24 | Pending |
| RUNTIME-02 | Phase 24 | Pending |
| RUNTIME-03 | Phase 24 | Pending |
| RUNTIME-04 | Phase 24 | Pending |
| RUNTIME-05 | Phase 24 | Pending |
| RUNTIME-06 | Phase 24 | Pending |
| RUNTIME-07 | Phase 24 | Pending |

**Coverage:**
- v1.3 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0

---
*Requirements defined: 2026-05-19*
*Last updated: 2026-05-19 after v1.3 roadmap creation*
