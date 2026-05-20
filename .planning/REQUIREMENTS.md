# Requirements: Coward's Game v1.4 Cycle-Interleaved Rules Correction

**Defined:** 2026-05-20
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.4 Requirements

Requirements for correcting the core rules contract from full-Activation sequencing to Cycle-interleaved Soldier scheduling. Each maps to roadmap phases.

### Rule Source of Truth

- [ ] **RULE-01**: Developer can read a new canonical rules version that explicitly supersedes the v1 full-Activation scheduling language.
- [ ] **RULE-02**: Rule docs define that each Round still uses per-player `activationCount` selection, but selected Soldier slots execute one Cycle layer at a time in the Round snake order.
- [ ] **RULE-03**: Rule docs include concrete Round examples, including `P1S1 -> P2S1 -> P2S2 -> P1S2 -> P1S3 -> P2S3`, and explain that the same slot order repeats for Cycle 1, Cycle 2, and later Cycle layers while slots remain active.
- [ ] **RULE-04**: Rule docs state that an ended Activation is skipped in all later Cycle layers for that Round.
- [ ] **RULE-05**: Rule docs define Backstab check boundaries as the start and end of every Cycle using a simultaneous snapshot of all ACTIVE Soldiers.
- [ ] **RULE-06**: Rule docs clarify whether prior `post-advance` Backstab language is replaced by Cycle-end Backstab or retained only as compatibility vocabulary, so there is no extra undocumented Backstab boundary.
- [ ] **RULE-07**: Technical architecture docs identify the engine, Chronicle, replay grammar, runtime input, fixtures, starter Strategies, and demo data surfaces that must align with the new rule version.

### Engine Scheduler

- [ ] **ENGINE-01**: Engine resolves selected Soldier slots by Cycle layer rather than by completing one Soldier's whole Activation before moving to the next slot.
- [ ] **ENGINE-02**: Engine preserves the existing Round snake slot order while applying it at every Cycle layer.
- [ ] **ENGINE-03**: Engine tracks per-slot Activation state, including objective, cycle index, whether the Soldier has Advanced, whether the Activation has ended, and terminal reason.
- [ ] **ENGINE-04**: Engine skips ended Activations on later Cycle layers without re-invoking SoldierBrain or changing that Soldier's memory.
- [ ] **ENGINE-05**: Engine applies Backstab at Cycle start before the acting SoldierBrain input is produced and at Cycle end after the Action resolves, using simultaneous all-board Backstab resolution.
- [ ] **ENGINE-06**: Engine applies no-Advance stoning when a selected Soldier's Activation ends without a successful Advance, while preserving the FALLEN exception.
- [ ] **ENGINE-07**: Runtime violations, invalid SoldierBrain output, invalid MOVE, blocked movement, blocked push, TURN_TO_STONE, FALLEN, 12-cycle exhaustion, and match end terminate only the relevant selected Activation unless the Match outcome ends the Round.
- [ ] **ENGINE-08**: Engine tests prove deterministic Cycle-interleaved ordering, skipped ended slots, Cycle-boundary Backstab, no-Advance stoning, memory progression, match-end interruption, and Round-to-contraction timing.

### Chronicle and Replay

- [ ] **REPLAY-01**: Chronicle event context can represent interleaved Activations whose Cycle events are not contiguous in the event stream.
- [ ] **REPLAY-02**: Replay grammar validates multiple concurrently open selected Activations within one Round and closes each Activation only when that slot ends.
- [ ] **REPLAY-03**: Replay reconstruction produces the same states as the engine under Cycle-interleaved scheduling.
- [ ] **REPLAY-04**: Replay UI timeline, callouts, inspector, and debug explanations remain understandable when event order alternates Soldiers between Cycle layers.
- [ ] **REPLAY-05**: Engine-generated replay fixtures are regenerated or replaced so all canonical fixtures obey the new Cycle-interleaved rule version.
- [ ] **REPLAY-06**: Public replay projection remains privacy-safe and does not expose Strategy source, StrategyMemory, SoldierMemory, objectives, Awareness Grid details, or runtime internals while showing the corrected event timing.

### Strategy Inputs and Starters

- [ ] **STRAT-01**: Strategy and SoldierBrain API docs explain that a SoldierBrain may observe board changes caused by other selected Soldiers between its Cycles.
- [ ] **STRAT-02**: Starter Strategy source comments and behavior are updated to account for interleaved enemy responses and Cycle-boundary Backstab.
- [ ] **STRAT-03**: All 10 starter Strategies validate and run without relying on full-Activation monopolies, illegal immediate reversals, or stale assumptions about uninterrupted 12-Cycle bursts.
- [ ] **STRAT-04**: Workshop templates, sample Strategies, fixture Strategies, and failure-mode examples use terminology and tactics consistent with Cycle-interleaved scheduling.
- [ ] **STRAT-05**: Starter smoke tests cover movement, avoidance of board shrink, contact pressure, Backstab exposure, memory use, and survival under the corrected scheduler.
- [ ] **STRAT-06**: Public Strategy cards and starter metadata reference the corrected rule version where relevant without exposing private Strategy data.
- [ ] **STRAT-07**: Preconfigured demo entrants are regenerated from corrected starter sources or otherwise marked stale until regenerated.

### Demo and Competition Validation

- [ ] **DEMO-01**: Developer can regenerate the v1.4 demo ladder and sample MatchSets under the corrected rules.
- [ ] **DEMO-02**: Demo ladder standings, MatchSet results, replay links, public profiles, Strategy cards, and governance states still render locally after regeneration.
- [ ] **DEMO-03**: Demo replays show realistic interleaved tactical play, including matches that commonly last into board contraction.
- [ ] **DEMO-04**: Result provenance identifies the corrected rule/spec version so old v1.3 demo results cannot be mistaken for v1.4 evidence.
- [ ] **DEMO-05**: Verification includes engine, replay, persistence, worker, web, starter, and demo-tournament tests needed to trust the corrected rule end to end.

## Future Requirements

Deferred to a later milestone.

### Competition Expansion

- **COMPX-01**: User can participate in durable all-time ratings after corrected rules, governance, and abuse data support a permanent ranking promise.
- **COMPX-02**: User can participate in official scheduled public tournaments with bracket or round-robin formats.
- **COMPX-03**: Operators can compare historical standings across rule versions with explicit compatibility labels.

### Runtime and Arena Expansion

- **RUNX-01**: Developer can promote the containerized subprocess boundary from production-candidate to production-grade hostile-code isolation.
- **RUNX-02**: Developer can add non-JS Strategy runtimes behind the same StrategyRuntime interface.
- **AREN-01**: User can compete on custom or generated Arena Variants after replay compatibility and preset policy are stable.

## Out of Scope

Explicitly excluded from v1.4. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Durable ratings or permanent leaderboards | v1.4 corrects the rules contract first; durable standings should wait until results are generated under the corrected rule version. |
| New tournament formats | Scheduling and bracket complexity would distract from the core timing correction. |
| New Strategy language runtimes | The Strategy API timing contract should stabilize before adding more runtime languages. |
| Major replay UI redesign | Replay must clarify interleaved timing, but broad redesign belongs after the corrected event model is proven. |
| Mid-season replacement policy changes | Existing v1.3 next-season replacement remains adequate while rule mechanics are corrected. |
| Custom arenas or randomized maps | Arena changes would obscure whether behavior changes came from timing or board variation. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| RULE-01 | Phase 25 | Pending |
| RULE-02 | Phase 25 | Pending |
| RULE-03 | Phase 25 | Pending |
| RULE-04 | Phase 25 | Pending |
| RULE-05 | Phase 25 | Pending |
| RULE-06 | Phase 25 | Pending |
| RULE-07 | Phase 25 | Pending |
| ENGINE-01 | Phase 26 | Pending |
| ENGINE-02 | Phase 26 | Pending |
| ENGINE-03 | Phase 26 | Pending |
| ENGINE-04 | Phase 26 | Pending |
| ENGINE-05 | Phase 26 | Pending |
| ENGINE-06 | Phase 26 | Pending |
| ENGINE-07 | Phase 26 | Pending |
| ENGINE-08 | Phase 26 | Pending |
| REPLAY-01 | Phase 27 | Pending |
| REPLAY-02 | Phase 27 | Pending |
| REPLAY-03 | Phase 27 | Pending |
| REPLAY-04 | Phase 27 | Pending |
| REPLAY-05 | Phase 27 | Pending |
| REPLAY-06 | Phase 27 | Pending |
| STRAT-01 | Phase 28 | Pending |
| STRAT-02 | Phase 28 | Pending |
| STRAT-03 | Phase 28 | Pending |
| STRAT-04 | Phase 28 | Pending |
| STRAT-05 | Phase 28 | Pending |
| STRAT-06 | Phase 28 | Pending |
| STRAT-07 | Phase 28 | Pending |
| DEMO-01 | Phase 29 | Pending |
| DEMO-02 | Phase 29 | Pending |
| DEMO-03 | Phase 29 | Pending |
| DEMO-04 | Phase 29 | Pending |
| DEMO-05 | Phase 29 | Pending |

**Coverage:**
- v1.4 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-05-20*
*Last updated: 2026-05-20 after v1.4 roadmap creation*
