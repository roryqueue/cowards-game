# Requirements: Coward's Game v1.30

**Defined:** 2026-05-31
**Workstream:** `v1-30-match-intelligence-workbench`
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Build a public-safe Match Intelligence Workbench that derives tactical summaries, timeline annotations, jump targets, Soldier progression, board-control signals, action/engagement summaries, and result comparison views from frozen result/replay DTOs and fixture-backed public replay projections.

## Baseline

- v1.28 is complete, committed, tagged, and archived as the latest shipped milestone in this checkout.
- v1.27 Result and Replay Workbench artifacts are present in `.planning/workstreams/v1-27-result-replay-workbench/` and provide the app-side fixture/result/replay baseline.
- Active root `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` were absent before this milestone began.
- v1.30 requirements live in `.planning/workstreams/v1-30-match-intelligence-workbench/`.
- `match-execution-app-v1` remains frozen.
- Normal v1.30 development and proof must use fixture-backed app/test adapters and public DTO/projection data.
- Live Match execution services must not be required for normal UI development proof.
- JS/TS remains the counted Strategy path.
- Python, Rust, and Zig remain non-counted exhibition beta only.
- Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence, retry/recovery policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Strategy code must not execute in web/API/Go.
- Public result/replay outputs and intelligence panels must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals by default.

## v1 Requirements

### Baseline and Intelligence Signal Inventory

- [ ] **BASE-01**: Operator can inspect a v1.30 baseline inventory of every public result DTO, replay metadata DTO, replay evidence DTO, fixture scenario, replay-ready DTO, public Chronicle projection field, and app view model surface that can support public-safe Match intelligence.
- [ ] **BASE-02**: Inventory distinguishes public intelligence signals from owner/test-only diagnostics, owner Chronicle private sections, Go orchestration internals, runtime-service internals, persistence internals, raw diagnostics, and intentionally unstable surfaces.
- [ ] **BASE-03**: Inventory records which completed replay fixtures contain enough public events and board states for tactical summaries, timeline annotations, Soldier progression, board-control, terrain/stone, and action-mix analysis.
- [ ] **BASE-04**: Inventory records which queued, running, failed, degraded, unavailable, stale, malformed, missing-Chronicle, and no-result fixture states can only support limited or unavailable intelligence.
- [ ] **BASE-05**: Inventory explicitly preserves the frozen `match-execution-app-v1` contract, fixture adapter gates, JS/TS counted status, non-JS beta status, Preview 1 JSON ABI status, Go/runtime-service ownership split, and public-output privacy.
- [ ] **BASE-06**: Inventory decides that no public DTO expansion is needed for v1.30 unless a later phase records a separate future contract-evolution requirement instead of changing `match-execution-app-v1`.

### Fixture-Backed Intelligence Derivation Adapter

- [ ] **INTEL-01**: App code can derive a deterministic Match intelligence model from public MatchSet result DTOs, replay metadata/evidence DTOs, replay-ready DTOs, public Chronicle projection events, and public board states.
- [ ] **INTEL-02**: Intelligence derivation lives in the web app unless a phase proves a shared package removes real duplication without expanding the public contract.
- [ ] **INTEL-03**: Adapter returns explicit confidence and evidence-availability bands so low-signal fixtures say what can and cannot be known instead of inventing analysis.
- [ ] **INTEL-04**: Adapter computes richer but copy-limited momentum and turning-point signals from public events, Soldier status changes, occupancy, contraction pressure, and engagement events without claiming hidden Strategy intent.
- [ ] **INTEL-05**: Adapter emits timeline annotation and jump-target candidates compatible with existing replay focus mechanics.
- [ ] **INTEL-06**: Adapter emits Soldier progression summaries using only public Soldier snapshots and public event involvement.
- [ ] **INTEL-07**: Adapter emits board-control, terrain/stone occupancy, action-mix, and engagement summaries only when public replay projection data supports them.
- [ ] **INTEL-08**: Adapter tests cover every frozen public fixture scenario, completed replay fixtures, unavailable intelligence states, privacy scans, and deterministic output stability.

### Result Page Tactical Summary and Comparison Model

- [ ] **RES-01**: Public MatchSet result pages show a Match Intelligence summary derived from public DTOs and replay availability rather than execution internals.
- [ ] **RES-02**: Result-page summary communicates outcome evidence, replay readiness, intelligence confidence, failure/degraded limits, and privacy provenance in compact scannable panels.
- [ ] **RES-03**: Result page compares entrants, Matches, and replay-backed evidence using public MatchSet rows, public replay links, runtime labels, and public failure categories.
- [ ] **RES-04**: Result page surfaces turning points and public jump targets for replay-ready completed Matches.
- [ ] **RES-05**: Result page shows explicit "not enough public evidence" intelligence states for completed-but-low-signal, no-result, missing-Chronicle, unavailable, queued, running, and failed outcomes.
- [ ] **RES-06**: Result page default output excludes private Strategy data, owner-only debug payloads, raw diagnostics, host/env/token/DB/package details, and private runtime internals.
- [ ] **RES-07**: Result-page tests render intelligence panels across all frozen fixture scenarios without relying on live execution services.

### Replay Timeline Annotation and Jump-Target Workbench

- [ ] **REP-01**: Public replay pages show timeline annotations for supported turning points such as FALLEN, STONE, backstab, push, contraction, no-advance cleanup, decisive push, and late-cycle stabilization.
- [ ] **REP-02**: Replay jump targets use public sequence numbers and integrate with existing focus query behavior without depending on owner-only debug payloads.
- [ ] **REP-03**: Replay timeline groups remain scannable while showing annotation category, sequence, Round, Activation, Cycle, confidence, and public evidence source.
- [ ] **REP-04**: Replay page supports filtering or emphasis of annotation categories only when the controls remain usable on desktop and mobile.
- [ ] **REP-05**: Replay annotation copy avoids Strategy-intent claims and states that intelligence is derived from public evidence.
- [ ] **REP-06**: Replay annotation tests cover exact focus, moment fallback, unsupported moment fallback, privacy labels, and no private marker leaks.

### Soldier Status, Board-Control, Terrain/Stone, and Action-Mix Panels

- [ ] **TACT-01**: Public replay pages show Soldier status progression for ACTIVE, STONE, and FALLEN transitions using public board states and event involvement.
- [ ] **TACT-02**: Public replay pages show board-control signals such as active/STONE occupancy by side, center/edge presence, contraction pressure, and visible area pressure when public board states support them.
- [ ] **TACT-03**: Public replay pages show terrain/stone occupancy and congestion signals without treating FALLEN Soldiers as board occupants.
- [ ] **TACT-04**: Public replay pages show action and engagement mix from public event types, including MOVE, TURN, TURN_TO_STONE, push, backstab, blocked movement, contraction, FALLEN, and STONE events where present.
- [ ] **TACT-05**: Optional board overlays or filters are limited to public board states and must remain stable, non-overlapping, and usable on desktop and mobile.
- [ ] **TACT-06**: Tactical panels degrade gracefully when public projection data is sparse, unavailable, stale, invalid, or missing.
- [ ] **TACT-07**: Tactical derivation tests assert visible Soldiers and terrain remain inside declared board bounds and that canonical arenas still contain canonical starting positions where applicable.

### Degraded, Unavailable, Queued, Running, Failed, and Missing-Chronicle Intelligence States

- [ ] **STATE-01**: Queued and running MatchSet result pages show pending intelligence states that explain tactical analysis is unavailable until public result/replay evidence exists.
- [ ] **STATE-02**: Degraded result pages show partial intelligence only for public evidence that exists and clearly distinguish partial evidence from clean completed outcomes.
- [ ] **STATE-03**: Unavailable runtime, timeout, malformed runtime result, stale artifact, system failure, strategy failure, blocked, no-result, and missing-Chronicle states each get distinct public-safe intelligence copy.
- [ ] **STATE-04**: Replay pages for missing, stale, invalid, or unavailable Chronicles do not show fake tactical panels, blank misleading boards, clipped pieces, or private-output UI.
- [ ] **STATE-05**: Intelligence copy states what is knowable from public DTO/projection data and what is withheld or absent without naming private field internals.
- [ ] **STATE-06**: Tests assert every frozen fixture scenario renders a useful intelligence state and never falls through to generic misleading analysis.

### Owner/Test-Only Gated Deeper Analysis Review

- [ ] **GATE-01**: Owner/test-only deeper analysis surfaces remain explicitly gated and absent from default public result/replay output.
- [ ] **GATE-02**: Gated panels may show derivation diagnostics, fixture IDs, confidence inputs, and public projection coverage, but must not reveal Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
- [ ] **GATE-03**: Owner/test-only controls cannot become a production fixture fallback or public route for private data.
- [ ] **GATE-04**: Tests cover authorized/gated rendering, default-public absence, fixture-mode behavior, and private-marker scans.
- [ ] **GATE-05**: Boundary monitors catch accidental imports or rendering of owner Chronicle private sections, runtime-service internals, Go orchestration internals, persistence internals, and private debug payloads.

### Desktop/Mobile Visual Proof Across Fixtures

- [ ] **PROOF-01**: Browser proof renders every frozen public MatchSet fixture scenario with a useful intelligence state in fixture mode.
- [ ] **PROOF-02**: Desktop browser proof renders completed replay intelligence with nonblank board output, visible in-bounds Soldiers/terrain, timeline annotations, jump targets, and tactical panels.
- [ ] **PROOF-03**: Mobile browser proof renders completed replay intelligence with stable board dimensions, reachable controls, no overlapping text or controls, and visible in-bounds board output.
- [ ] **PROOF-04**: Browser proof records screenshots or artifacts for representative complete, degraded, unavailable, queued/running, failed, missing-Chronicle, and replay-ready states.
- [ ] **PROOF-05**: Browser proof verifies fixture mode works without live Match execution services and fails closed when disabled or production mode is simulated.
- [ ] **PROOF-06**: Rendered page scans verify public intelligence does not leak private Strategy data, raw diagnostics, host/env/token/DB/package details, owner/test-only payloads, or private runtime internals.

### Boundary Monitors, Privacy Audit, and Live Compatibility

- [ ] **MON-01**: Boundary monitors fail on `match-execution-app-v1` drift, fixture scenario gaps, production fixture fallback, intelligence privacy regressions, owner/test-only leakage, or private marker exposure.
- [ ] **MON-02**: Boundary monitors fail on intelligence imports from runtime-service internals, Go orchestration internals, persistence internals, private Chronicle sections, or private debug payloads.
- [ ] **MON-03**: Boundary monitors preserve no Strategy execution in web/API/Go, no new language promotion, no production sandbox certification, no direct-export ABI migration, no Component Model/WIT ABI migration, and Preview 1 JSON ABI status.
- [ ] **MON-04**: Privacy audit covers schema artifacts, fixture JSON, intelligence derivation outputs, result/replay pages, proof artifacts, and gated owner/test-only panels.
- [ ] **LIVE-01**: Signed-in live regression opens result and replay pages successfully where local services are available.
- [ ] **LIVE-02**: Live compatibility proof consumes only frozen app-facing DTOs or existing public service DTO projections, not runtime-service raw envelopes, Go retry/recovery internals, persistence internals, or private debug payloads.
- [ ] **LIVE-03**: Live compatibility proof preserves JS/TS counted support and non-JS non-counted exhibition beta semantics without making runtime promotion, sandbox, ABI, or counted non-JS claims.

### Audit and Closure

- [ ] **CLOSE-01**: Code review verifies intelligence derivation, result page panels, replay annotations, tactical panels, degraded states, owner/test-only gates, privacy, and boundary monitors.
- [ ] **CLOSE-02**: UI review verifies the result/replay intelligence workbench feels like a serious tactical inspection tool for autonomous Matches, not a landing page or marketing surface.
- [ ] **CLOSE-03**: Validation verifies requirement coverage, tests, fixture-mode proof, replay board realism, desktop/mobile visual proof, privacy scans, boundary monitors, and live compatibility proof where available.
- [ ] **CLOSE-04**: Verify-work confirms every frozen public fixture scenario renders a useful intelligence state and completed replay fixtures show plausible public-safe tactical annotations.
- [ ] **CLOSE-05**: Final milestone decision states that v1.30 does not change `match-execution-app-v1`, promote runtimes, certify production sandboxing, migrate execution ABI, add counted non-JS play, or execute Strategy code in web/API/Go.
- [ ] **CLOSE-06**: v1.30 planning artifacts are archived or closed, active workstream requirements are marked complete or removed at milestone close, and commit/tag evidence is recorded.

## Future Requirements

### Future Intelligence and Contract Evolution

- **FUT-INTEL-01**: Future intelligence exports, shareable reports, or direct tactical data downloads require separate public-output privacy and retention proof.
- **FUT-INTEL-02**: Future AI-assisted coaching, natural-language tactical commentary, or model-generated recommendations require a separate AI design contract and must not infer hidden Strategy intent from private data.
- **FUT-CONTRACT-01**: Future public DTO additions for richer intelligence require explicit versioning or backward-compatible compatibility proof rather than incidental UI-driven schema drift.
- **FUT-OWNER-01**: Future owner-only deep tactical diagnostics require separate authorization, privacy, retention, and product-scope proof.

## Out of Scope

| Feature | Reason |
| --- | --- |
| `match-execution-app-v1` redesign | v1.30 builds in front of the frozen v1.25 boundary. |
| Public DTO expansion by default | Default intelligence must derive from existing public DTOs/projections; contract evolution is future work unless explicitly proven necessary. |
| Live Match execution dependency for normal UI proof | Fixture-backed app/test development is required for app-side proof. |
| Go orchestration ownership changes | v1.30 is app/result/replay intelligence, not backend orchestration migration. |
| Runtime-service ownership expansion | Runtime-service remains hostile Strategy execution only behind schema-validated ABI envelopes. |
| AI coach or live model inference | Intelligence is deterministic public evidence derivation, not model-generated advice. |
| New Strategy language promotion | JS/TS remains counted; Python/Rust/Zig remain non-counted exhibition beta. |
| Production sandbox certification | Tactical UI does not prove hostile-code isolation. |
| Direct-export or Component Model/WIT ABI migration | WASI Preview 1 stdin/stdout JSON remains active. |
| Counted non-JS play, ranked promotion, broad ladder, or gauntlet expansion | Intelligence views must not silently become competitive product promotion. |
| Strategy execution in web/API/Go | Hostile Strategy code must stay behind runtime-service / Runtime Broker boundaries. |
| Public raw diagnostics or private runtime internals | Public intelligence must remain source-free, memory-free, objective-free, diagnostics-safe, path-safe, env-safe, token-safe, DB-safe, package-safe, and private-runtime-safe. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 201 | Planned |
| BASE-02 | Phase 201 | Planned |
| BASE-03 | Phase 201 | Planned |
| BASE-04 | Phase 201 | Planned |
| BASE-05 | Phase 201 | Planned |
| BASE-06 | Phase 201 | Planned |
| INTEL-01 | Phase 202 | Planned |
| INTEL-02 | Phase 202 | Planned |
| INTEL-03 | Phase 202 | Planned |
| INTEL-04 | Phase 202 | Planned |
| INTEL-05 | Phase 202 | Planned |
| INTEL-06 | Phase 202 | Planned |
| INTEL-07 | Phase 202 | Planned |
| INTEL-08 | Phase 202 | Planned |
| RES-01 | Phase 203 | Planned |
| RES-02 | Phase 203 | Planned |
| RES-03 | Phase 203 | Planned |
| RES-04 | Phase 203 | Planned |
| RES-05 | Phase 203 | Planned |
| RES-06 | Phase 203 | Planned |
| RES-07 | Phase 203 | Planned |
| REP-01 | Phase 204 | Planned |
| REP-02 | Phase 204 | Planned |
| REP-03 | Phase 204 | Planned |
| REP-04 | Phase 204 | Planned |
| REP-05 | Phase 204 | Planned |
| REP-06 | Phase 204 | Planned |
| TACT-01 | Phase 205 | Planned |
| TACT-02 | Phase 205 | Planned |
| TACT-03 | Phase 205 | Planned |
| TACT-04 | Phase 205 | Planned |
| TACT-05 | Phase 205 | Planned |
| TACT-06 | Phase 205 | Planned |
| TACT-07 | Phase 205 | Planned |
| STATE-01 | Phase 206 | Planned |
| STATE-02 | Phase 206 | Planned |
| STATE-03 | Phase 206 | Planned |
| STATE-04 | Phase 206 | Planned |
| STATE-05 | Phase 206 | Planned |
| STATE-06 | Phase 206 | Planned |
| GATE-01 | Phase 207 | Planned |
| GATE-02 | Phase 207 | Planned |
| GATE-03 | Phase 207 | Planned |
| GATE-04 | Phase 207 | Planned |
| GATE-05 | Phase 207 | Planned |
| PROOF-01 | Phase 208 | Planned |
| PROOF-02 | Phase 208 | Planned |
| PROOF-03 | Phase 208 | Planned |
| PROOF-04 | Phase 208 | Planned |
| PROOF-05 | Phase 208 | Planned |
| PROOF-06 | Phase 208 | Planned |
| MON-01 | Phase 209 | Planned |
| MON-02 | Phase 209 | Planned |
| MON-03 | Phase 209 | Planned |
| MON-04 | Phase 209 | Planned |
| LIVE-01 | Phase 209 | Planned |
| LIVE-02 | Phase 209 | Planned |
| LIVE-03 | Phase 209 | Planned |
| CLOSE-01 | Phase 210 | Planned |
| CLOSE-02 | Phase 210 | Planned |
| CLOSE-03 | Phase 210 | Planned |
| CLOSE-04 | Phase 210 | Planned |
| CLOSE-05 | Phase 210 | Planned |
| CLOSE-06 | Phase 210 | Planned |

**Coverage:**
- v1 requirements: 64 total
- Mapped to phases: 64
- Unmapped: 0

---
*Requirements defined: 2026-05-31*
