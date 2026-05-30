# Roadmap: Coward's Game v1.27

**Workstream:** v1-27-result-replay-workbench

## Active Milestone

**v1.27 Result and Replay Workbench Against Frozen Match Execution Fixtures**

**Goal:** Build serious result/replay/workbench UX on top of the frozen `match-execution-app-v1` boundary, using fixture-backed development so app proof does not depend on live Match execution services.

**Decision baseline:** v1.25 froze `match-execution-app-v1`. v1.27 consumes that boundary rather than redesigning it. JS/TS remains counted; Python, Rust, and Zig remain non-counted exhibition beta; WASI Preview 1 stdin/stdout JSON remains the active WASM/WASI execution ABI. No production sandbox certification, direct-export migration, Component Model/WIT migration, counted non-JS promotion, Go orchestration ownership creep, runtime-service ownership creep, or Strategy execution in web/API/Go is in scope.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 192 | v1.25 App Contract Baseline and Result/Replay UX Inventory | Inventory current result/replay UX and dependencies against the frozen app contract. | BASE-01..BASE-05 | 5 |
| 193 | Fixture Catalog Browser or Developer Fixture Switcher | Make the v1.25 fixture catalog reachable as an explicit non-production workbench surface. | FIX-01..FIX-06 | 5 |
| 194 | Result Page State Model and Evidence Readability Pass | Refactor result page evidence into a contract-derived state model and improve public readability. | RES-01..RES-06 | 5 |
| 195 | Replay Page Workbench Layout and Timeline Ergonomics | Improve replay workbench layout, timeline scanning, playback, focus, and mobile ergonomics. | REP-01..REP-06 | 5 |
| 196 | Degraded, Unavailable, Failed, Queued, and Running Public States | Make every non-happy public state distinct, realistic, and public-safe. | STATE-01..STATE-06 | 5 |
| 197 | Public-Safe Evidence Details, Privacy Copy, and Owner/Test-Only Gating | Tighten privacy copy, evidence provenance, and debug gating across result/replay/fixture surfaces. | PRIV-01..PRIV-05 | 5 |
| 198 | Desktop/Mobile Visual Proof Across All Fixtures | Prove result fixtures and public-safe replay render plausibly on desktop and mobile without live execution. | PROOF-01..PROOF-06 | 5 |
| 199 | Live Signed-In Compatibility Proof Without Execution-Internal UI Coupling | Run live compatibility proof and strengthen boundary monitors for contract-only UI consumption. | LIVE-01..LIVE-03, MON-01..MON-03 | 5 |
| 200 | Audit, Archive, Commit, and Tag | Review, validate, verify, archive, commit, and tag v1.27. | CLOSE-01..CLOSE-06 | 5 |

## Phase Details

### Phase 192: v1.25 App Contract Baseline and Result/Replay UX Inventory

**Goal:** Inventory current result/replay UX and dependencies against the frozen app contract.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05

**Success criteria:**
1. Baseline artifact names the frozen `match-execution-app-v1` surfaces, fixture scenarios, adapter gates, public/private boundaries, and intentionally unstable internals.
2. Result page inventory maps current data dependencies, state rendering, evidence rows, replay links, privacy copy, and UX gaps.
3. Replay page inventory maps current board, timeline, event groups, playback, focus behavior, evidence, owner-debug gates, and mobile risks.
4. Inventory identifies any current or likely result/replay coupling to execution internals, raw diagnostics, persistence internals, or private debug payloads.
5. Inventory preserves v1.27 non-goals: no schema redesign, no live execution dependency for normal UI proof, no runtime promotion, no sandbox certification, no ABI migration, and no Strategy execution in web/API/Go.

### Phase 193: Fixture Catalog Browser or Developer Fixture Switcher

**Goal:** Make the v1.25 fixture catalog reachable as an explicit non-production workbench surface.

**Requirements:** FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06

**Success criteria:**
1. Developer/test users can browse or switch among all v1.25 MatchSet fixture result scenarios.
2. Fixture labels clearly communicate lifecycle/failure category, result availability, replay availability, retry disposition, and public-safe status.
3. Fixture workbench consumes frozen DTOs or fixture adapter reads rather than execution internals.
4. Fixture controls are unavailable as a silent production fallback and fail closed when fixture mode is disabled.
5. Tests prove fixture IDs are reachable only under allowed local/test gates.

### Phase 194: Result Page State Model and Evidence Readability Pass

**Goal:** Refactor result page evidence into a contract-derived state model and improve public readability.

**Requirements:** RES-01, RES-02, RES-03, RES-04, RES-05, RES-06

**Success criteria:**
1. Result page view model is derived from `match-execution-app-v1` lifecycle/result/replay/failure/runtime/privacy fields.
2. Evidence sections are grouped for scanning and cover lifecycle, availability, failure/retry semantics, runtime eligibility, scoring, provenance, and privacy.
3. Standings, entrants, Match ledger, replay links, and no-result states remain coherent across all fixtures.
4. Public copy distinguishes strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, queued, running, degraded, complete, retryable, and non-retryable states.
5. Result page tests render every fixture through the same view model and scan for private markers.

### Phase 195: Replay Page Workbench Layout and Timeline Ergonomics

**Goal:** Improve replay workbench layout, timeline scanning, playback, focus, and mobile ergonomics.

**Requirements:** REP-01, REP-02, REP-03, REP-04, REP-05, REP-06

**Success criteria:**
1. Desktop replay layout keeps board, timeline, selected event, current position, playback controls, and evidence visible in a workbench arrangement.
2. Timeline supports event-group scanning, sequence selection, Round/Activation/Cycle context, stepping, playback, speed selection, and focus fallback.
3. Mobile replay layout keeps stable board dimensions, reachable controls, readable evidence, and no core text/control overlap.
4. Replay evidence consumes frozen replay DTOs and avoids raw Chronicle debug/runtime-internal inference.
5. Public-safe replay fixture renders visible in-bounds Soldiers and terrain with nonblank board output on desktop and mobile.

### Phase 196: Degraded, Unavailable, Failed, Queued, and Running Public States

**Goal:** Make every non-happy public state distinct, realistic, and public-safe.

**Requirements:** STATE-01, STATE-02, STATE-03, STATE-04, STATE-05, STATE-06

**Success criteria:**
1. Queued and running fixtures are clearly pending/non-terminal with Go-owned lifecycle language.
2. Degraded fixtures show partial/terminal public evidence without implying counted clean outcomes.
3. Unavailable runtime, system failure, timeout, malformed runtime result, stale artifact, blocked, and no-result states have distinct public explanations.
4. Strategy failure is terminal Strategy-caused evidence without leaking source, memory, objective payloads, or raw diagnostics.
5. Missing/unavailable replay states avoid blank, clipped, misleading, or private-output UI.

### Phase 197: Public-Safe Evidence Details, Privacy Copy, and Owner/Test-Only Gating

**Goal:** Tighten privacy copy, evidence provenance, and debug gating across result/replay/fixture surfaces.

**Requirements:** PRIV-01, PRIV-02, PRIV-03, PRIV-04, PRIV-05

**Success criteria:**
1. Default public result/replay/fixture pages scan clean for private markers.
2. Owner/test-only debug controls remain server-authorized or explicit test/local gated and absent from default public output.
3. Privacy copy is specific, readable, and tied to public evidence provenance.
4. Fixture browser/switcher does not reveal private Strategy data, raw diagnostics, host/env/token/DB/package details, or private runtime internals.
5. Boundary monitors scan schema artifacts, fixtures, app copy, rendered page proof artifacts, and Markdown evidence for privacy regressions.

### Phase 198: Desktop/Mobile Visual Proof Across All Fixtures

**Goal:** Prove result fixtures and public-safe replay render plausibly on desktop and mobile without live execution.

**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06

**Success criteria:**
1. Browser proof renders every v1.25 MatchSet fixture result page in fixture mode.
2. Desktop replay proof validates nonblank board output and visible in-bounds Soldiers/terrain.
3. Mobile replay proof validates nonblank board output, visible in-bounds Soldiers/terrain, and no overlapping core controls.
4. Proof records screenshots or artifacts for representative result states and replay workbench layouts.
5. Proof verifies fixture mode does not require live execution services and fails closed when disabled or production mode is simulated.

### Phase 199: Live Signed-In Compatibility Proof Without Execution-Internal UI Coupling

**Goal:** Run live compatibility proof and strengthen boundary monitors for contract-only UI consumption.

**Requirements:** LIVE-01, LIVE-02, LIVE-03, MON-01, MON-02, MON-03

**Success criteria:**
1. Signed-in live regression opens MatchSet result and replay pages successfully.
2. UI consumes only frozen app-facing DTOs or existing public service DTO projections, not runtime-service raw envelopes, Go retry internals, persistence internals, or private debug payloads.
3. Live proof preserves JS/TS counted support and non-JS non-counted exhibition beta semantics without new promotion, sandbox, or ABI claims.
4. Boundary monitors catch lifecycle vocabulary drift, contract version drift, fixture scenario gaps, production fixture fallback, privacy regressions, and owner/test-only leakage.
5. Boundary monitors preserve no Strategy execution in web/API/Go, no new language promotion, no production sandbox certification, and Preview 1 JSON ABI status.

### Phase 200: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, verify, archive, commit, and tag v1.27.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05, CLOSE-06

**Success criteria:**
1. Code review verifies result page, replay page, fixture workbench, privacy, visual proof, and monitor changes.
2. UI review verifies the result/replay UX feels like a serious autonomous Match inspection workbench.
3. Validation verifies requirements coverage, tests, fixture-mode proof, live compatibility proof, replay board realism, privacy scans, and boundary monitors.
4. Verify-work confirms every v1.25 fixture scenario renders with clear public-safe UI and no live execution dependency for normal app proof.
5. Final decision preserves frozen contract, runtime eligibility, sandbox, ABI, ownership, and privacy non-claims.

## Coverage

- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

## Next Up

**Phase 192: v1.25 App Contract Baseline and Result/Replay UX Inventory** - Inventory current result/replay UX and dependencies against the frozen app contract.

`$gsd-discuss-phase 192 --ws v1-27-result-replay-workbench`

Also: `$gsd-plan-phase 192 --ws v1-27-result-replay-workbench` - skip discussion, plan directly.

---
*Roadmap created: 2026-05-30 after v1.27 workstream milestone initialization*
