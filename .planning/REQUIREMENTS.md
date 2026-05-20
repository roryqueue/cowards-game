# Requirements: Coward's Game v1.5 Strategy Workshop Power Tools and Advanced Strategy Library

**Defined:** 2026-05-20
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.5 Requirements

Requirements for improving Strategy authoring, comparison, deterministic testing, advanced Strategy seeds, demo MatchSets, and completed tournament evidence.

### Workshop Power Tools

- [ ] **WSHOP-01**: User can launch a deterministic Workshop gauntlet matrix from one or more valid immutable Strategy Revisions against selected starter or seed opponents.
- [ ] **WSHOP-02**: A gauntlet matrix records a persisted profile including candidate revisions, opponent revisions, preset, seed/mirror policy, scoring policy, rule/spec/Chronicle/runtime versions, expanded matrix order, and creator.
- [ ] **WSHOP-03**: Matrix launch shows match count and rejects over-large runs before jobs are created.
- [ ] **WSHOP-04**: Matrix execution uses existing MatchSet, match job, worker/runtime adapter, scoring, Chronicle, and replay infrastructure; web/API routes never execute Strategy code.
- [ ] **WSHOP-05**: User can see queued, running, complete, degraded, Strategy-failed, system-failed, and replay-unavailable matrix cell states.
- [ ] **WSHOP-06**: Completed matrix cells expose Match IDs, side assignment, outcome, failure category where relevant, scoring impact, and replay links when available.
- [ ] **WSHOP-07**: User can compare two owned immutable Strategy Revisions with owner-authorized source diff, metadata deltas, validation deltas, and deterministic result deltas.
- [ ] **WSHOP-08**: Result delta comparison is blocked when revisions were tested under different gauntlet profiles, with a clear profile mismatch explanation.
- [ ] **WSHOP-09**: Workshop performance summaries show points, wins/losses/draws, failure penalties, surviving Soldiers, survival turns, per-opponent record, mirror-side split where applicable, and degraded/system-failed counts.

### Diagnostics and Replay Handoff

- [ ] **DIAG-01**: Validation diagnostics include source location data where available and surface as Monaco editor markers without inventing fake line precision.
- [ ] **DIAG-02**: Runtime/test diagnostics use a typed taxonomy covering validation errors, transpile errors, invalid Strategy output, invalid Action, timeout, source/memory limits, Strategy failure, system failure, Chronicle unavailable, and replay projection unavailable.
- [ ] **DIAG-03**: Diagnostics include public-safe Match, side, Soldier, Round, Activation, Cycle, Action, terminal reason, result impact, and replay context when available.
- [ ] **DIAG-04**: Diagnostics never expose Strategy source excerpts, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, stack traces, owner debug, or private runtime internals in public DTOs.
- [ ] **DIAG-05**: Matrix cells and diagnostic rows link to public replay and owner debug replay according to existing server-side authorization rules.
- [ ] **DIAG-06**: Diagnostics group repeated failures by category and Match so players can identify common causes without inspecting duplicate rows one by one.

### Result Data Analysis and Evidence Model

- [ ] **EVID-01**: v1.5 planning/implementation analyzes existing v1.4 demo results, including the strong Backstab Hunter, Aggro Chaser, and Wall Press benchmark performance.
- [ ] **EVID-02**: v1.5 defines reusable evidence summaries for gauntlets, MatchSets, and tournaments including standings, W-L-D, points, counted status, rule version, Chronicle version, runtime adapter, generated-at timestamp, and representative URLs.
- [ ] **EVID-03**: Evidence extraction includes Chronicle-derived behavior signals for contraction participation, Backstab resolutions, Advances, blocked movement recovery, STONE/FALLEN outcomes, skipped Activations, match terminal reasons, and representative replay links.
- [ ] **EVID-04**: Evidence summaries include review triggers for dominance, helpless filler entrants, over-derivation from v1.4 winners, missing archetype behavior, non-counted/system-failed deciding results, and privacy regressions.
- [ ] **EVID-05**: v1.5 produces a local demo/report summarizing advanced-vs-v1.4-starter and advanced-vs-advanced performance, diversity, review triggers, and representative links.
- [ ] **EVID-06**: Evidence copy states that v1.5 results are benchmark/demo evidence, not durable all-time ratings, official public tournament operations, or permanent balance truth.

### Advanced Strategy Library

- [ ] **ADV-01**: The app defines a distinct Advanced Strategy Library tier separate from the existing Starter Library.
- [ ] **ADV-02**: The Advanced Library targets 10 v1.5 Strategies and may accept 8-9 only when the validation report explains why quality/diversity is stronger than filling all slots.
- [ ] **ADV-03**: The Advanced set covers pressure/contact, anti-backstab positioning, wall control, center control, contraction survival, evasive mobility, trap/control, mirror-breaking/adaptive play, late-cycle stabilization, and memory-based opponent response, or explicitly justifies any missing archetype.
- [ ] **ADV-04**: Each Advanced Strategy has one primary archetype, optional secondary tags, doctrine notes, expected behavior, difficulty or strength framing, uses-memory metadata, source hash, source bytes, validation status, and compatibility metadata.
- [ ] **ADV-05**: Advanced Strategy Revisions are immutable system-owned seed Revisions with v1.5 lineage/provenance and `cowards-rules-v1.4` compatibility unless a newer rule version exists.
- [ ] **ADV-06**: Advanced Strategy cards expose archetype, doctrine notes, tags, validation state, source hash, source size, safe lineage, records, evidence links, rule/runtime compatibility, and fork/apply affordances without public private-data leaks.
- [ ] **ADV-07**: Workshop users can intentionally fork or apply Advanced Strategies in a controlled flow that clearly distinguishes them from beginner Starter Strategies.
- [ ] **ADV-08**: At least three Advanced Strategies are stateless and at least three use StrategyMemory or SoldierMemory unless validation documents a stronger diversity reason.
- [ ] **ADV-09**: Advanced Strategy tuning notes identify which v1.4 evidence influenced each Strategy and which non-v1.4 benchmark prevented overfitting.
- [ ] **ADV-10**: No included Advanced Strategy may be a trivial clone of an existing Starter Strategy; new source hashes and doctrine differences must be documented.

### Gauntlet Validation and Tuning

- [ ] **GAUNT-01**: Every Advanced Strategy runs against all 10 v1.4 Starter Strategies in a deterministic starter gauntlet.
- [ ] **GAUNT-02**: The Advanced set runs against itself in a deterministic advanced-only round robin or equivalent complete MatchSet suite.
- [ ] **GAUNT-03**: Curated counter gauntlets validate at least anti-backstab, wall/edge control, center control vs mobility, contraction survival, trap/control vs pressure, and memory-based adaptation.
- [ ] **GAUNT-04**: Every Advanced Strategy has at least one representative replay link for its claimed archetype behavior.
- [ ] **GAUNT-05**: Every included Advanced Strategy has at least one close or favorable matchup that demonstrates its reason to exist.
- [ ] **GAUNT-06**: The advanced field avoids degenerate outcomes; the champion has at least one close or unfavorable matchup, or the validation report explains why the set remains non-degenerate.
- [ ] **GAUNT-07**: Strategies changed after failed review triggers are regenerated with new source hash/provenance and rerun through affected gauntlets.

### Example MatchSets and Tournament

- [ ] **DEMO-01**: v1.5 generates representative example MatchSets for at least five archetype interactions using accepted Advanced Strategies and selected v1.4 benchmark starters where useful.
- [ ] **DEMO-02**: Example MatchSets are complete, counted when eligible, replay-backed, and linked from the local demo/report.
- [ ] **DEMO-03**: v1.5 generates and completes one realistic advanced-only demo tournament with at least 8 entrants if the Advanced set is strong enough.
- [ ] **DEMO-04**: The demo tournament shows entrants, format, standings or stage results, counted MatchSets, MatchSet links, replay links, provenance, and non-durable demo framing.
- [ ] **DEMO-05**: Degraded, system-failed, or non-counted results do not decide demo tournament standings.
- [ ] **DEMO-06**: Tournament and example MatchSet result pages link to public Strategy cards and player/profile pages where applicable without exposing private Strategy data.

### Replay Review and Tuning

- [ ] **REV-01**: Representative replays from starter gauntlets, advanced gauntlets, example MatchSets, and the demo tournament are reviewed for realistic Cycle-interleaved play.
- [ ] **REV-02**: Replay review verifies the advanced field shows diverse tactics across contact pressure, positioning, wall/center control, contraction survival, mobility, traps, adaptation, late-cycle stabilization, and memory response.
- [ ] **REV-03**: Any replay-reviewed Strategy tuning is documented with source hash/provenance changes and rerun evidence for affected gauntlets or MatchSets.
- [ ] **REV-04**: The local demo/report includes direct local links to the example tournament, representative MatchSets, and representative replays selected during review.

### Verification, Privacy, and Documentation

- [ ] **VERIFY-01**: Public gauntlet, Strategy card, MatchSet, tournament, player/profile, and replay DTO/page tests fail if they expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid details, stack traces, or private runtime internals by default.
- [ ] **VERIFY-02**: Determinism tests prove identical gauntlet profiles expand to identical matrix order, profile hash, scoring projection, and summary ordering.
- [ ] **VERIFY-03**: Runtime/web isolation tests prove Workshop gauntlet and tournament creation routes create jobs but do not execute Strategy code in the web/API process.
- [ ] **VERIFY-04**: Browser verification covers the Advanced Library entry point, representative Advanced Strategy cards, example MatchSet result pages, the completed tournament page, player/profile pages if applicable, and representative replays.
- [ ] **VERIFY-05**: Documentation updates cover Workshop power tools, Advanced Library purpose, evidence vocabulary, local demo/report regeneration, example MatchSet links, tournament links, and non-durable framing before milestone completion.

## Future Requirements

Deferred to later milestones.

### Competition Expansion

- **COMPX-01**: User can participate in durable all-time ratings after governance, abuse data, and balance evidence support a permanent ranking promise.
- **COMPX-02**: User can participate in official scheduled public tournaments with bracket or round-robin formats.
- **COMPX-03**: Operators can compare historical standings across rule versions with explicit compatibility labels.

### Runtime and Arena Expansion

- **RUNX-01**: Developer can promote the containerized subprocess boundary from production-candidate to production-grade hostile-code isolation.
- **RUNX-02**: Developer can add non-JS Strategy runtimes behind the same StrategyRuntime interface.
- **AREN-01**: User can compete on custom or generated Arena Variants after replay compatibility and preset policy are stable.

### Library and Analytics Expansion

- **LIBX-01**: User can save named custom gauntlet profiles after fixed presets prove useful.
- **LIBX-02**: User can export owner-only gauntlet JSON summaries for offline analysis.
- **LIBX-03**: Public pages can show richer matchup heatmaps, evidence bands, and replay deep links after v1.5 validates the core evidence path.

## Out of Scope

Explicitly excluded from v1.5. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Durable ratings or permanent leaderboards | v1.5 creates benchmark/demo evidence, not a permanent competitive promise. |
| Official public tournament operations | The completed tournament is a local example/demo artifact; public operations need future governance and product design. |
| Production-grade hostile-code sandboxing | Existing runtime boundaries remain mandatory, but sandbox hardening is not the v1.5 focus. |
| Browser/API Strategy execution | Violates the core isolation rule; Strategy code continues to run only behind worker/runtime adapter boundaries. |
| Custom or randomized arenas | Arena changes would obscure whether Strategy behavior improved or merely adapted to new maps. |
| New Strategy language runtimes | JS/TS remains the supported Strategy runtime for this milestone. |
| Strategy marketplace, monetization, or cosmetics | Not needed for Workshop iteration, advanced seeds, or demo evidence. |
| Live model inference or human control during Matches | Contradicts the deterministic autonomous Match contract. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| WSHOP-01 | Phase 30 | Pending |
| WSHOP-02 | Phase 30 | Pending |
| WSHOP-03 | Phase 30 | Pending |
| WSHOP-04 | Phase 30 | Pending |
| WSHOP-05 | Phase 30 | Pending |
| WSHOP-06 | Phase 30 | Pending |
| WSHOP-07 | Phase 30 | Pending |
| WSHOP-08 | Phase 30 | Pending |
| WSHOP-09 | Phase 30 | Pending |
| DIAG-01 | Phase 30 | Pending |
| DIAG-02 | Phase 30 | Pending |
| DIAG-03 | Phase 30 | Pending |
| DIAG-04 | Phase 30 | Pending |
| DIAG-05 | Phase 30 | Pending |
| DIAG-06 | Phase 30 | Pending |
| EVID-01 | Phase 31 | Pending |
| EVID-02 | Phase 31 | Pending |
| EVID-03 | Phase 31 | Pending |
| EVID-04 | Phase 31 | Pending |
| EVID-05 | Phase 31 | Pending |
| EVID-06 | Phase 31 | Pending |
| ADV-01 | Phase 32 | Pending |
| ADV-02 | Phase 32 | Pending |
| ADV-03 | Phase 32 | Pending |
| ADV-04 | Phase 32 | Pending |
| ADV-05 | Phase 32 | Pending |
| ADV-06 | Phase 32 | Pending |
| ADV-07 | Phase 32 | Pending |
| ADV-08 | Phase 32 | Pending |
| ADV-09 | Phase 32 | Pending |
| ADV-10 | Phase 32 | Pending |
| GAUNT-01 | Phase 33 | Pending |
| GAUNT-02 | Phase 33 | Pending |
| GAUNT-03 | Phase 33 | Pending |
| GAUNT-04 | Phase 33 | Pending |
| GAUNT-05 | Phase 33 | Pending |
| GAUNT-06 | Phase 33 | Pending |
| GAUNT-07 | Phase 33 | Pending |
| DEMO-01 | Phase 34 | Pending |
| DEMO-02 | Phase 34 | Pending |
| DEMO-03 | Phase 35 | Pending |
| DEMO-04 | Phase 35 | Pending |
| DEMO-05 | Phase 35 | Pending |
| DEMO-06 | Phase 35 | Pending |
| REV-01 | Phase 36 | Pending |
| REV-02 | Phase 36 | Pending |
| REV-03 | Phase 36 | Pending |
| REV-04 | Phase 36 | Pending |
| VERIFY-01 | Phase 37 | Pending |
| VERIFY-02 | Phase 37 | Pending |
| VERIFY-03 | Phase 37 | Pending |
| VERIFY-04 | Phase 37 | Pending |
| VERIFY-05 | Phase 37 | Pending |

**Coverage:**
- v1.5 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-05-20*
*Last updated: 2026-05-20 after v1.5 milestone definition*
