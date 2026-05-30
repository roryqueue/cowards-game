# Requirements: Coward's Game v1.27

**Defined:** 2026-05-30
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.
**Workstream:** v1-27-result-replay-workbench

## Milestone Goal

Build ambitious result/replay/app UX on top of the frozen `match-execution-app-v1` boundary, using fixture-backed development so public app work can proceed without live Match execution services or execution-internal coupling.

## Baseline

- v1.25 is complete, committed, tagged `v1.25`, and archived.
- v1.26 is being executed in parallel in a separate lane; this milestone is v1.27.
- Phase numbering reserves v1.26's expected 183-191 range and starts v1.27 at Phase 192.
- This milestone is in front of the v1.25 `match-execution-app-v1` interface.
- `match-execution-app-v1` is frozen and must not be casually reshaped by UI work.
- Use fixture-backed app/test adapters for normal UI development and proof.
- Do not require live Match execution services for normal result/replay UI development proof.
- JS/TS remains the counted Strategy path.
- Python, Rust, and Zig remain non-counted exhibition beta.
- WASI Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI.
- No Go orchestration or runtime-service ownership creep is allowed.
- No new language promotion, production sandbox certification, direct-export ABI migration, Component Model/WIT ABI migration, or counted non-JS play is allowed.
- Strategy code must not execute in web/API/Go.
- Public output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals by default.

## v1 Requirements

### Baseline and UX Inventory

- [ ] **BASE-01**: Operator can inspect a v1.25 contract baseline that names frozen `match-execution-app-v1` surfaces, fixture scenarios, adapter gates, public/private evidence boundaries, and intentionally unstable internals.
- [ ] **BASE-02**: Operator can inspect a result page UX inventory that maps current data dependencies, state rendering, evidence sections, privacy copy, replay links, and gaps against the frozen DTO contract.
- [ ] **BASE-03**: Operator can inspect a replay page UX inventory that maps current board, timeline, event list, evidence panel, focus behavior, owner-debug gates, and mobile layout risks against the frozen DTO contract.
- [ ] **BASE-04**: Inventory identifies any result/replay UI dependency on Go orchestration internals, runtime-service internals, persistence internals, raw diagnostics, private Chronicle/debug payloads, or non-frozen DTOs.
- [ ] **BASE-05**: Inventory and plan preserve JS/TS counted support, non-JS non-counted exhibition beta status, Preview 1 JSON ABI status, no production sandbox claim, no Strategy execution in web/API/Go, and public-output privacy.

### Fixture Workbench

- [ ] **FIX-01**: Developer/test users can browse or switch among every v1.25 MatchSet result fixture scenario from a visible non-production fixture workbench affordance.
- [ ] **FIX-02**: Fixture workbench labels clearly distinguish complete, running, queued, strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, and public-safe replay scenarios.
- [ ] **FIX-03**: Fixture workbench consumes the frozen app-facing DTOs or DTO-equivalent fixture adapter reads rather than execution internals.
- [ ] **FIX-04**: Fixture workbench is unavailable as a silent production fallback and fails closed when fixture mode is disabled.
- [ ] **FIX-05**: Fixture workbench documentation or copy explains fixture mode as app/test proof only, not live execution proof or runtime promotion evidence.
- [ ] **FIX-06**: Fixture workbench tests prove all catalog fixture IDs remain reachable in allowed local/test modes and unreachable as production fallback.

### Result Page Workbench

- [ ] **RES-01**: Public MatchSet result pages use a view-model/state model derived from `match-execution-app-v1` DTOs instead of scattered React-only lifecycle inference.
- [ ] **RES-02**: Result page evidence sections make lifecycle state, terminality, retry disposition, result availability, replay availability, failure category, runtime eligibility, scoring, provenance, and privacy exclusions easy to scan.
- [ ] **RES-03**: Result page standings, entrants, Match ledger, replay links, and no-result states remain coherent when fixtures have no standings or no replay evidence.
- [ ] **RES-04**: Result page copy distinguishes strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, blocked, missing Chronicle, queued, running, degraded, complete, retryable, and non-retryable states using public-safe language.
- [ ] **RES-05**: Result page default public output excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, and private runtime internals.
- [ ] **RES-06**: Result page tests render every v1.25 fixture scenario through the same state model used by the page.

### Replay Workbench

- [ ] **REP-01**: Public replay pages present a serious workbench layout that keeps board, timeline, selected event, current position, playback controls, and evidence visible and usable on desktop.
- [ ] **REP-02**: Replay timeline ergonomics support scanning event groups, selected sequence, Round/Activation/Cycle position, stepping, playback, speed selection, and focus fallback without losing board context.
- [ ] **REP-03**: Replay workbench remains usable on mobile with stable board dimensions, reachable playback controls, readable evidence, and no overlapping text or controls.
- [ ] **REP-04**: Replay evidence copy consumes frozen replay metadata/evidence DTOs and does not infer public meaning from raw Chronicle debug data or runtime internals.
- [ ] **REP-05**: Public-safe replay fixture renders visible in-bounds Soldiers and terrain with nonblank board output on desktop and mobile.
- [ ] **REP-06**: Replay tests cover board plausibility, timeline ergonomics, public evidence rendering, and owner/test-only debug gating.

### Public State Coverage

- [ ] **STATE-01**: Public result pages render queued and running fixtures as non-terminal pending states with clear Go-owned lifecycle language.
- [ ] **STATE-02**: Public result pages render degraded fixtures as partial/terminal public evidence without implying counted clean outcomes by default.
- [ ] **STATE-03**: Public result pages render unavailable runtime, system failure, timeout, malformed runtime result, stale artifact, and blocked/no-result states with distinct public-safe explanations.
- [ ] **STATE-04**: Public result pages render strategy failure as Strategy-caused terminal evidence without leaking Strategy source, memory, objective payloads, or raw runtime diagnostics.
- [ ] **STATE-05**: Public replay pages handle unavailable or missing replay states without blank, clipped, misleading, or private-output UI.
- [ ] **STATE-06**: Tests assert each public state category appears with expected state-specific copy and never falls through to misleading generic failure copy.

### Privacy and Gating

- [ ] **PRIV-01**: Default public result and replay pages scan clean for Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, and private runtime internals.
- [ ] **PRIV-02**: Owner/test-only debug controls remain server-authorized or explicit test/local gated and are absent from default public fixture/result/replay output.
- [ ] **PRIV-03**: Fixture browser/switcher surfaces do not reveal private Strategy data, owner-only debug payloads, raw runtime diagnostics, host paths, env values, tokens, DB details, package paths, or private runtime internals.
- [ ] **PRIV-04**: Privacy copy is readable, specific, and tied to public evidence provenance rather than generic disclaimers.
- [ ] **PRIV-05**: Boundary monitors catch privacy denylist regressions in schema artifacts, fixture JSON, app copy, rendered result pages, rendered replay pages, and proof artifacts.

### Browser and Visual Proof

- [ ] **PROOF-01**: Playwright or browser proof renders every v1.25 MatchSet fixture scenario on result pages in fixture mode.
- [ ] **PROOF-02**: Browser proof renders public-safe replay fixture on desktop with nonblank board output, visible in-bounds Soldiers/terrain, and no clipped or off-screen pieces.
- [ ] **PROOF-03**: Browser proof renders public-safe replay fixture on mobile with nonblank board output, visible in-bounds Soldiers/terrain, and no overlapping core controls.
- [ ] **PROOF-04**: Browser proof records screenshots or artifact evidence for representative result states and replay workbench layouts.
- [ ] **PROOF-05**: Browser proof verifies fixture mode works without live execution services and fails closed when disabled or when production mode is simulated.
- [ ] **PROOF-06**: Proof scans rendered pages for private markers and confirms owner/test-only debug surfaces are not part of default public output.

### Live Compatibility and Boundary Monitors

- [ ] **LIVE-01**: Signed-in live regression opens MatchSet result and replay pages successfully without UI depending on execution internals.
- [ ] **LIVE-02**: Live compatibility proof consumes only frozen app-facing DTOs or existing public service DTO projections, not runtime-service raw envelopes or Go retry internals.
- [ ] **LIVE-03**: Live proof preserves JS/TS counted support and non-JS non-counted exhibition beta semantics without making new runtime promotion, sandbox, or ABI claims.
- [ ] **MON-01**: Boundary monitors fail on lifecycle vocabulary drift, contract version drift, fixture scenario coverage gaps, production fixture fallback, privacy regressions, or owner/test-only leakage.
- [ ] **MON-02**: Boundary monitors fail on accidental result/replay imports from runtime-service internals, Go orchestration internals, persistence internals, or private debug payloads.
- [ ] **MON-03**: Boundary monitors explicitly preserve no Go/web/API Strategy execution, no new language promotion, no production sandbox certification, and Preview 1 JSON ABI status.

### Audit and Closure

- [ ] **CLOSE-01**: Code review verifies result page, replay page, fixture workbench, privacy, visual proof, and monitor changes before closure.
- [ ] **CLOSE-02**: UI review verifies the result/replay UX feels like a serious autonomous Match inspection workbench, not a landing page or marketing surface.
- [ ] **CLOSE-03**: Validation verifies requirements coverage, tests, fixture-mode proof, live compatibility proof, replay board realism, privacy scans, and boundary monitors.
- [ ] **CLOSE-04**: Verify-work confirms every v1.25 fixture scenario renders with clear public-safe UI and no live execution dependency for normal app proof.
- [ ] **CLOSE-05**: Final milestone decision states that v1.27 does not change `match-execution-app-v1`, promote runtimes, certify production sandboxing, migrate execution ABI, or add Strategy execution in web/API/Go.
- [ ] **CLOSE-06**: v1.27 planning artifacts are archived, active workstream requirements are removed or closed, and commit/tag evidence is recorded.

## Future Requirements

### Future Result and Replay UX

- **FUT-UX-01**: Future result/replay work may add richer filters, comparison views, exports, or owner-only debugging only through public-safe DTO additions or explicitly gated owner/test-only contracts.
- **FUT-UX-02**: Future live execution UX can replace fixture assumptions only through a new compatibility proof and without coupling UI to execution internals.
- **FUT-UX-03**: Future ranked/ladder/gauntlet result experiences must run their own governance, abuse, privacy, and replay proof before becoming durable competitive product scope.

### Future Contract Evolution

- **FUT-CONTRACT-01**: Future changes to `match-execution-app-v1` require explicit versioning or compatibility proof rather than incidental UI-driven schema drift.
- **FUT-CONTRACT-02**: Future production sandbox, ABI migration, counted non-JS, or runtime promotion work must run separate proof and must not use v1.27 workbench proof as promotion evidence.

## Out of Scope

| Feature | Reason |
| --- | --- |
| `match-execution-app-v1` schema redesign | v1.27 builds in front of the frozen v1.25 boundary; schema evolution requires a separate explicit contract version decision. |
| Live Match execution service dependency for normal UI proof | Fixture-backed app/test development is the point of this milestone. |
| Go orchestration ownership changes | v1.27 is app/result/replay UX, not backend orchestration migration. |
| Runtime-service ownership expansion | Runtime-service remains hostile Strategy execution only behind schema-validated ABI envelopes. |
| New Strategy language promotion | JS/TS remains counted; Python/Rust/Zig remain non-counted exhibition beta. |
| Production sandbox certification | This milestone improves app UX and proof ergonomics only. |
| Direct-export or Component Model/WIT ABI migration | WASI Preview 1 stdin/stdout JSON remains active. |
| Counted non-JS play, ranked promotion, broad ladder, or gauntlet expansion | Workbench UX must not silently become competitive product promotion. |
| Strategy execution in web/API/Go | Hostile Strategy code must stay behind runtime-service / Runtime Broker boundaries. |
| Public raw diagnostics or private runtime internals | Public evidence must remain source-free, memory-free, objective-free, diagnostics-safe, path-safe, env-safe, token-safe, DB-safe, package-safe, and private-runtime-safe. |

## Traceability

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 192 | Pending |
| BASE-02 | Phase 192 | Pending |
| BASE-03 | Phase 192 | Pending |
| BASE-04 | Phase 192 | Pending |
| BASE-05 | Phase 192 | Pending |
| FIX-01 | Phase 193 | Pending |
| FIX-02 | Phase 193 | Pending |
| FIX-03 | Phase 193 | Pending |
| FIX-04 | Phase 193 | Pending |
| FIX-05 | Phase 193 | Pending |
| FIX-06 | Phase 193 | Pending |
| RES-01 | Phase 194 | Pending |
| RES-02 | Phase 194 | Pending |
| RES-03 | Phase 194 | Pending |
| RES-04 | Phase 194 | Pending |
| RES-05 | Phase 194 | Pending |
| RES-06 | Phase 194 | Pending |
| REP-01 | Phase 195 | Pending |
| REP-02 | Phase 195 | Pending |
| REP-03 | Phase 195 | Pending |
| REP-04 | Phase 195 | Pending |
| REP-05 | Phase 195 | Pending |
| REP-06 | Phase 195 | Pending |
| STATE-01 | Phase 196 | Pending |
| STATE-02 | Phase 196 | Pending |
| STATE-03 | Phase 196 | Pending |
| STATE-04 | Phase 196 | Pending |
| STATE-05 | Phase 196 | Pending |
| STATE-06 | Phase 196 | Pending |
| PRIV-01 | Phase 197 | Pending |
| PRIV-02 | Phase 197 | Pending |
| PRIV-03 | Phase 197 | Pending |
| PRIV-04 | Phase 197 | Pending |
| PRIV-05 | Phase 197 | Pending |
| PROOF-01 | Phase 198 | Pending |
| PROOF-02 | Phase 198 | Pending |
| PROOF-03 | Phase 198 | Pending |
| PROOF-04 | Phase 198 | Pending |
| PROOF-05 | Phase 198 | Pending |
| PROOF-06 | Phase 198 | Pending |
| LIVE-01 | Phase 199 | Pending |
| LIVE-02 | Phase 199 | Pending |
| LIVE-03 | Phase 199 | Pending |
| MON-01 | Phase 199 | Pending |
| MON-02 | Phase 199 | Pending |
| MON-03 | Phase 199 | Pending |
| CLOSE-01 | Phase 200 | Pending |
| CLOSE-02 | Phase 200 | Pending |
| CLOSE-03 | Phase 200 | Pending |
| CLOSE-04 | Phase 200 | Pending |
| CLOSE-05 | Phase 200 | Pending |
| CLOSE-06 | Phase 200 | Pending |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-05-30*
*Last updated: 2026-05-30 after v1.27 workstream milestone initialization*
