# Roadmap: Coward's Game v1.30

**Workstream:** `v1-30-match-intelligence-workbench`

## Active Milestone

**v1.30 Match Intelligence Workbench Against Frozen Result and Replay Fixtures**

**Goal:** Build a public-safe Match Intelligence Workbench that derives tactical summaries, timeline annotations, jump targets, comparison views, Soldier progression, board-control signals, terrain/stone occupancy, and action/engagement summaries from frozen public result/replay DTOs and fixture-backed replay projections.

**Decision baseline:** v1.25 froze `match-execution-app-v1`; v1.27 built the app-side result/replay workbench against fixtures; v1.28 kept execution operations private behind the frozen boundary. v1.30 consumes the frozen boundary and public projections only. JS/TS remains counted; Python, Rust, and Zig remain non-counted exhibition beta; WASI Preview 1 stdin/stdout JSON remains active. No public DTO redesign, runtime promotion, production sandbox certification, direct-export migration, Component Model/WIT migration, counted non-JS promotion, Go orchestration ownership creep, runtime-service ownership creep, AI coach, live model inference, or Strategy execution in web/API/Go is in scope.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 201 | v1.30 Result/Replay Intelligence Signal Inventory | Inventory the frozen public DTO, fixture, replay-ready, and public Chronicle projection signals available for public-safe intelligence. | BASE-01..BASE-06 | 5 |
| 202 | Fixture-Backed Intelligence Derivation Adapter | Build the deterministic app-side intelligence model from public DTOs/projections with explicit confidence and availability bands. | INTEL-01..INTEL-08 | 5 |
| 203 | Result Page Tactical Summary and Comparison Model | Add result-page intelligence summaries, comparison panels, turning-point previews, and low-signal states. | RES-01..RES-07 | 5 |
| 204 | Replay Timeline Annotation and Jump-Target Workbench | Add public-safe replay annotations, category filters/emphasis where feasible, and jump targets using existing focus mechanics. | REP-01..REP-06 | 5 |
| 205 | Soldier Status, Board-Control, Terrain/Stone, and Action-Mix Panels | Add tactical panels and optional overlays derived only from public board states and events. | TACT-01..TACT-07 | 5 |
| 206 | Degraded, Unavailable, Queued, Running, Failed, and Missing-Chronicle Intelligence States | Make every non-happy fixture outcome render an honest, useful intelligence state. | STATE-01..STATE-06 | 5 |
| 207 | Owner/Test-Only Gated Deeper Analysis Review | Add or audit gated derivation diagnostics without leaking private data into default public output. | GATE-01..GATE-05 | 5 |
| 208 | Desktop/Mobile Visual Proof Across Fixtures | Prove the intelligence workbench across fixture states and replay-ready pages on desktop and mobile. | PROOF-01..PROOF-06 | 5 |
| 209 | Boundary Monitors, Privacy Audit, and Live Compatibility Proof | Extend monitors, run privacy audits, and prove signed-in compatibility where local services are available. | MON-01..MON-04, LIVE-01..LIVE-03 | 5 |
| 210 | Audit, Archive, Commit, and Tag | Review, validate, verify, archive, commit, and tag v1.30. | CLOSE-01..CLOSE-06 | 5 |

## Phase Details

### Phase 201: v1.30 Result/Replay Intelligence Signal Inventory

**Goal:** Inventory the frozen public DTO, fixture, replay-ready, and public Chronicle projection signals available for public-safe intelligence.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BASE-06

**Success criteria:**
1. Baseline artifact lists every public result/replay DTO, fixture, replay-ready DTO, public Chronicle projection field, and app view model surface available to v1.30.
2. Artifact classifies each signal as public intelligence, low-signal public state, owner/test-only, execution-internal, persistence-internal, runtime-internal, or intentionally unstable.
3. Completed replay fixtures are assessed for tactical summary, timeline annotation, Soldier progression, board-control, terrain/stone, and action-mix viability.
4. Queued, running, degraded, unavailable, failed, stale, malformed, no-result, and missing-Chronicle fixtures are assessed for limited intelligence copy.
5. Baseline explicitly preserves frozen contract, fixture gates, runtime eligibility, ownership boundaries, and public-output privacy.

### Phase 202: Fixture-Backed Intelligence Derivation Adapter

**Goal:** Build the deterministic app-side intelligence model from public DTOs/projections with explicit confidence and availability bands.

**Requirements:** INTEL-01, INTEL-02, INTEL-03, INTEL-04, INTEL-05, INTEL-06, INTEL-07, INTEL-08

**Success criteria:**
1. Pure app-side adapter derives a stable intelligence model from public MatchSet/replay DTOs, replay-ready DTOs, public events, and board states.
2. Adapter produces evidence availability, confidence, momentum, turning points, timeline annotations, Soldier progression, board-control, terrain/stone, action-mix, and engagement summaries where supported.
3. Low-signal and unavailable states return explicit "not enough public evidence" results rather than invented tactical conclusions.
4. Adapter does not import Go orchestration, runtime-service, persistence internals, owner private Chronicle sections, or private debug payloads.
5. Fixture-backed unit tests cover all frozen scenarios, deterministic output stability, low-signal states, and privacy markers.

### Phase 203: Result Page Tactical Summary and Comparison Model

**Goal:** Add result-page intelligence summaries, comparison panels, turning-point previews, and low-signal states.

**Requirements:** RES-01, RES-02, RES-03, RES-04, RES-05, RES-06, RES-07

**Success criteria:**
1. Result pages show compact Match Intelligence panels for outcome evidence, replay readiness, confidence, failure/degraded limits, and privacy provenance.
2. Comparison panels summarize entrants, Matches, replay-backed evidence, runtime labels, failure categories, and public jump targets.
3. Completed replay-ready fixtures expose useful turning-point previews and replay links.
4. Low-signal, unavailable, queued/running, failed, no-result, and missing-Chronicle fixtures show honest intelligence limits.
5. Result-page tests render every frozen fixture through the intelligence model without live execution services or private marker leaks.

### Phase 204: Replay Timeline Annotation and Jump-Target Workbench

**Goal:** Add public-safe replay annotations, category filters/emphasis where feasible, and jump targets using existing focus mechanics.

**Requirements:** REP-01, REP-02, REP-03, REP-04, REP-05, REP-06

**Success criteria:**
1. Replay timeline shows public-safe annotations for supported turning points such as FALLEN, STONE, backstab, push, contraction, no-advance cleanup, decisive push, and late-cycle stabilization.
2. Jump targets use public sequence numbers and existing replay focus query behavior, including exact focus and fallback states.
3. Annotation groups remain scannable with category, sequence, Round, Activation, Cycle, confidence, and public evidence source.
4. Any filter or emphasis controls remain usable on desktop and mobile.
5. Replay annotation tests cover supported moments, unsupported fallback, privacy labels, and private marker scans.

### Phase 205: Soldier Status, Board-Control, Terrain/Stone, and Action-Mix Panels

**Goal:** Add tactical panels and optional overlays derived only from public board states and events.

**Requirements:** TACT-01, TACT-02, TACT-03, TACT-04, TACT-05, TACT-06, TACT-07

**Success criteria:**
1. Soldier progression panel shows ACTIVE, STONE, FALLEN, last visible position, and recent public event involvement.
2. Board-control panel shows active/STONE occupancy by side, center/edge presence, contraction pressure, and visible area pressure where supported.
3. Terrain/stone and action-mix panels summarize public events and board occupancy without treating FALLEN Soldiers as occupants.
4. Optional overlays/filters use public board states only and remain stable on desktop and mobile.
5. Tactical tests cover in-bounds board realism, canonical starts, sparse projections, unavailable projections, and private marker safety.

### Phase 206: Degraded, Unavailable, Queued, Running, Failed, and Missing-Chronicle Intelligence States

**Goal:** Make every non-happy fixture outcome render an honest, useful intelligence state.

**Requirements:** STATE-01, STATE-02, STATE-03, STATE-04, STATE-05, STATE-06

**Success criteria:**
1. Queued and running states explain intelligence is pending until public evidence exists.
2. Degraded states show partial intelligence only for public evidence that exists.
3. Unavailable runtime, timeout, malformed runtime result, stale artifact, system failure, strategy failure, blocked, no-result, and missing-Chronicle states have distinct public-safe copy.
4. Missing/stale/invalid replay pages do not show fake tactical panels or misleading blank boards.
5. Tests assert every frozen fixture renders useful state-specific intelligence copy without generic misleading analysis.

### Phase 207: Owner/Test-Only Gated Deeper Analysis Review

**Goal:** Add or audit gated derivation diagnostics without leaking private data into default public output.

**Requirements:** GATE-01, GATE-02, GATE-03, GATE-04, GATE-05

**Success criteria:**
1. Default public output omits deeper diagnostics and owner/test-only controls.
2. Gated surfaces show only derivation diagnostics, fixture IDs, confidence inputs, and public projection coverage.
3. Gated surfaces do not expose Strategy source, memories, objectives, raw diagnostics, host/env/token/DB/package details, runtime internals, or owner Chronicle private sections.
4. Tests cover authorized/gated rendering, public absence, fixture-mode behavior, and privacy scans.
5. Boundary monitors catch private/debug/internal import and rendering drift.

### Phase 208: Desktop/Mobile Visual Proof Across Fixtures

**Goal:** Prove the intelligence workbench across fixture states and replay-ready pages on desktop and mobile.

**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06

**Success criteria:**
1. Browser proof renders every frozen public MatchSet fixture with a useful intelligence state in fixture mode.
2. Desktop replay proof validates nonblank board output, visible in-bounds Soldiers/terrain, timeline annotations, jump targets, and tactical panels.
3. Mobile replay proof validates stable board dimensions, reachable controls, no overlapping text or controls, and visible in-bounds board output.
4. Proof artifacts cover representative complete, degraded, unavailable, queued/running, failed, missing-Chronicle, and replay-ready states.
5. Proof verifies fixture mode requires explicit local/test gates, works without live execution services, fails closed when disabled, and scans rendered pages for private markers.

### Phase 209: Boundary Monitors, Privacy Audit, and Live Compatibility Proof

**Goal:** Extend monitors, run privacy audits, and prove signed-in compatibility where local services are available.

**Requirements:** MON-01, MON-02, MON-03, MON-04, LIVE-01, LIVE-02, LIVE-03

**Success criteria:**
1. Boundary monitors catch contract drift, fixture coverage gaps, production fixture fallback, intelligence privacy regressions, owner/test-only leakage, and private markers.
2. Boundary monitors catch imports from runtime-service internals, Go orchestration internals, persistence internals, private Chronicle sections, and private debug payloads.
3. Privacy audit covers schema artifacts, fixture JSON, intelligence outputs, result/replay pages, proof artifacts, and gated panels.
4. Signed-in compatibility opens result/replay pages where local services are available and consumes only frozen app-facing DTOs or existing public service DTO projections.
5. Final compatibility proof preserves runtime eligibility, sandbox, ABI, ownership, and no Strategy execution claims.

### Phase 210: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, verify, archive, commit, and tag v1.30.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05, CLOSE-06

**Success criteria:**
1. Code review verifies intelligence derivation, result/replay UI, degraded states, gated diagnostics, privacy, and monitors.
2. UI review verifies the workbench feels like a serious tactical inspection tool for autonomous Matches.
3. Validation verifies tests, fixture proof, replay board realism, desktop/mobile proof, privacy scans, boundary monitors, and live compatibility where available.
4. Verify-work confirms every frozen public fixture scenario renders useful intelligence and completed replay fixtures show plausible public-safe tactical annotations.
5. Final decision preserves frozen contract, runtime eligibility, sandbox, ABI, ownership, privacy, and no AI-coach/live-inference claims.

## Coverage

- v1 requirements: 64 total
- Mapped to phases: 64
- Unmapped: 0

## Next Up

**Phase 201: v1.30 Result/Replay Intelligence Signal Inventory** - Inventory the frozen public DTO, fixture, replay-ready, and public Chronicle projection signals available for public-safe intelligence.

`$gsd-discuss-phase 201 --ws v1-30-match-intelligence-workbench`

Also: `$gsd-plan-phase 201 --ws v1-30-match-intelligence-workbench` - skip discussion, plan directly.

---
*Roadmap created: 2026-05-31 after v1.30 uncertainty defaults were approved*
