# Roadmap: Coward's Game v1.29

## Milestones

- [x] **v1.28 Match Execution Operations, Recovery, and Incident Drills** - Phases 201-209, shipped 2026-05-30 with internal recovery proof behind frozen `match-execution-app-v1`.
- [x] **v1.29 Replay and Result Trust Polish** - Phases 210-217, implemented in workstream `v1-29-replay-and-result-trust-polish`.

## Active Milestone

**v1.29 Replay and Result Trust Polish**

**Goal:** Improve the public result and replay experience so players can better understand completed, queued, running, degraded, failed, stale-artifact, unavailable-runtime, malformed-runtime-result, missing-Chronicle, and no-result states while staying strictly on the app/public UX side of the existing Match execution contract.

**Decision baseline:** `match-execution-app-v1` remains frozen. Do not add public execution DTO fields. Do not change Go match execution, runtime-service behavior, retry/recovery policy, quarantine semantics, job lifecycle, MatchSet scoring, Chronicle persistence, internal operator controls, runtime eligibility, or WASM/WASI ABI. Public output remains private-data safe. v1.27 is not a baseline unless explicitly merged into this checkout.

## Phase Overview

| Phase | Name | Goal | Requirements | Success Criteria |
| --- | --- | --- | --- | --- |
| 210 | Public Result/Replay Baseline Inventory | Lock current public result/replay UX surfaces, fixture coverage, and proof gaps before implementation. | BASE-01..BASE-05 | 5 |
| 211 | Result-State Explanation Polish | Improve public result page state explanations and Match ledger evidence using existing DTO data only. | STATE-01..STATE-06 | 5 |
| 212 | Replay Trust Cues and Missing Evidence States | Improve ready and unavailable replay trust cues, including missing Chronicle, invalid Chronicle, stale evidence, and no-result states. | REPLAY-01..REPLAY-06 | 5 |
| 213 | Public Privacy Scan Expansion | Expand public result/replay privacy scans across pages, fixtures, generated proof, and copy snapshots. | PRIV-01..PRIV-05 | 5 |
| 214 | Board Realism and Visual Regression Coverage | Strengthen browser, board realism, and visual regression proof for public replay/result trust surfaces. | BOARD-01..BOARD-06 | 5 |
| 215 | Contract Compatibility Monitors | Prove public outcomes still validate against frozen `match-execution-app-v1` and no public contract drift occurred. | COMPAT-01..COMPAT-06 | 5 |
| 216 | Public Page Proof | Produce fixture-backed or signed-in public page proof across all target result and replay states. | PROOF-01..PROOF-05 | 5 |
| 217 | Audit, Archive, Commit, and Tag | Review, validate, archive, commit, and tag v1.29 after proof passes. | CLOSE-01..CLOSE-05 | 5 |

## Phase Details

### Phase 210: Public Result/Replay Baseline Inventory

**Goal:** Lock current public result/replay UX surfaces, fixture coverage, and proof gaps before implementation.

**Requirements:** BASE-01, BASE-02, BASE-03, BASE-04, BASE-05

**Success criteria:**
1. Inventory lists public result/replay pages, evidence copy, fixture adapters, E2E proof, visual tests, and boundary monitors.
2. Inventory maps target states to existing lifecycle/failure/availability fields and service DTO inputs.
3. Public UX surfaces are separated from Go execution internals, runtime-service internals, quarantine/operator evidence, persistence internals, and fixture-only adapters.
4. Fixture/proof gaps are recorded for missing Chronicle and no-result states.
5. Baseline artifact states no public contract change, no DTO fields, no execution-policy change, no runtime promotion, and no v1.27 dependency.

### Phase 211: Result-State Explanation Polish

**Goal:** Improve public result page state explanations and Match ledger evidence using existing DTO data only.

**Requirements:** STATE-01, STATE-02, STATE-03, STATE-04, STATE-05, STATE-06

**Success criteria:**
1. Result summary explains complete, queued, running, degraded, failed, unavailable, and pending-evidence states.
2. Failure categories use public-safe canonical wording for Strategy failure, system failure, timeout, unavailable runtime, malformed runtime result, stale artifact, missing Chronicle, and no-result.
3. Result/replay availability is explained using existing lifecycle fields only.
4. Retryability copy remains public-level and excludes retry counts, operator actions, quarantine, raw diagnostics, recovery payloads, and runtime internals.
5. Result page tests prove copy, layout, and Match ledger evidence are public-safe and DTO-derived.

### Phase 212: Replay Trust Cues and Missing Evidence States

**Goal:** Improve ready and unavailable replay trust cues, including missing Chronicle, invalid Chronicle, stale evidence, and no-result states.

**Requirements:** REPLAY-01, REPLAY-02, REPLAY-03, REPLAY-04, REPLAY-05, REPLAY-06

**Success criteria:**
1. Ready replay pages explain public Chronicle projection/public replay evidence without private Strategy data.
2. Replay unavailable pages explain missing Chronicle, invalid Chronicle, missing public evidence, stale evidence, and no-result states.
3. Replay evidence panel surfaces existing public hash/schema/event/snapshot/arena/lifecycle/privacy/projection data where already available.
4. Public view remains clearly separated from owner debug view.
5. Tests cover ready, missing, invalid, stale, and no-result replay states with canonical terminology.

### Phase 213: Public Privacy Scan Expansion

**Goal:** Expand public result/replay privacy scans across pages, fixtures, generated proof, and copy snapshots.

**Requirements:** PRIV-01, PRIV-02, PRIV-03, PRIV-04, PRIV-05

**Success criteria:**
1. Public result pages are scanned for all forbidden private markers.
2. Public replay and replay-unavailable pages are scanned across ready, missing, invalid, stale, and no-result states.
3. Fixture payloads, generated proof artifacts, and public copy snapshots fail loudly on private marker leakage.
4. Player-facing privacy copy avoids exposing private implementation field names.
5. Owner/test-only debug paths remain disabled in public mode and cannot become public evidence fallback.

### Phase 214: Board Realism and Visual Regression Coverage

**Goal:** Strengthen browser, board realism, and visual regression proof for public replay/result trust surfaces.

**Requirements:** BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06

**Success criteria:**
1. Browser validation confirms replay boards are nonblank, unclipped, and plausibly framed on desktop and mobile.
2. Board realism checks keep visible Soldier and STONE positions inside declared bounds.
3. FALLEN Soldiers are not rendered as visible pieces and visible Soldiers have positions.
4. Canonical arenas contain canonical starting positions at Match start where applicable.
5. Visual regressions capture replay trust panels, missing/unavailable replay states, long ids, long public messages, no replay rows, and responsive evidence panels.

### Phase 215: Contract Compatibility Monitors

**Goal:** Prove public outcomes still validate against frozen `match-execution-app-v1` and no public contract drift occurred.

**Requirements:** COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04, COMPAT-05, COMPAT-06

**Success criteria:**
1. Contract tests cover every public outcome under `match-execution-app-v1`.
2. Monitors prove no public execution DTO fields were added, removed, renamed, narrowed, or repurposed.
3. Monitors prove no v1.29 public contract version appears.
4. Monitors reject public recovery, quarantine, operator, runtime-service-internal, and private diagnostics state.
5. Boundary monitor output explicitly classifies v1.29 as app/public presentation and proof over existing DTOs.

### Phase 216: Public Page Proof

**Goal:** Produce fixture-backed or signed-in public page proof across all target result and replay states.

**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05

**Success criteria:**
1. Proof opens public result pages for completed, queued, running, degraded, failed, stale-artifact, unavailable-runtime, malformed-runtime-result, missing-Chronicle, and no-result states.
2. Proof opens ready replay and unavailable/missing/invalid/stale/no-result replay states where representable.
3. Proof records URLs, state classifications, contract version, evidence rows, replay availability, board realism, privacy scans, and visual references.
4. Live signed-in proof is optional and limited to JS/TS counted execution if needed.
5. Proof artifact states all non-claims: no contract expansion, DTO fields, runtime promotion, sandbox certification, ABI migration, counted non-JS play, operator UI, or web/API/Go Strategy execution.

### Phase 217: Audit, Archive, Commit, and Tag

**Goal:** Review, validate, archive, commit, and tag v1.29 after proof passes.

**Requirements:** CLOSE-01, CLOSE-02, CLOSE-03, CLOSE-04, CLOSE-05

**Success criteria:**
1. Code review covers result/replay copy, layout, privacy scans, fixtures, visual proof, board realism, and contract monitors.
2. Validation covers requirements, tests, fixture/signed-in proof, browser proof, visual regressions, privacy scans, and boundary monitors.
3. Final decision preserves the frozen contract, JS/TS counted path, non-JS beta-only status, Preview 1 JSON ABI, no sandbox certification, no v1.27 dependency, and no Strategy execution in web/API/Go.
4. Planning artifacts are archived and commit/tag evidence is recorded only after audit and validation pass.
5. Retrospective records trust lessons, remaining evidence gaps, fixture/proof limitations, and future contract-version criteria.

## Coverage

- v1 requirements: 44 total
- Complete: 44
- Planned: 0
- Mapped to phases: 44
- Unmapped: 0

## Next Up

Phase 217: final audit/commit/tag.

Suggested next command:

`$gsd-audit-fix`

---
*Roadmap created: 2026-05-31 after v1.29 phase map confirmation*
