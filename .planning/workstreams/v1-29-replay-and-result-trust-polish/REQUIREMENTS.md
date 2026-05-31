# Requirements: Coward's Game v1.29

**Defined:** 2026-05-31
**Workstream:** `v1-29-replay-and-result-trust-polish`
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## Milestone Goal

Improve the public result and replay experience so players can better understand completed, queued, running, degraded, failed, stale-artifact, unavailable-runtime, malformed-runtime-result, missing-Chronicle, and no-result states while staying strictly on the app/public UX side of the existing Match execution contract.

## Baseline

- v1.28 is complete, committed, tagged `v1.28`, and archived.
- `match-execution-app-v1` remains frozen.
- v1.29 must not change, expand, rename, repurpose, or version-bump `match-execution-app-v1`.
- v1.29 must not add new public execution DTO fields.
- Active root `.planning/REQUIREMENTS.md` is absent; v1.29 requirements live in this workstream.
- JS/TS remains the only counted Strategy path.
- Python, Rust, and Zig remain non-counted exhibition beta only.
- Preview 1 stdin/stdout JSON remains the active WASM/WASI ABI.
- Go owns orchestration, persistence-facing backend behavior, Match lifecycle, scoring, public evidence projection, retry/recovery policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution only through schema-validated ABI envelopes and registered runtime implementations.
- Strategy code must not execute in web/API/Go.
- Public result/replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator action details, or recovery payloads.
- v1.27 is not a baseline unless it has been explicitly merged into this checkout.

## v1 Requirements

### Baseline and Public UX Inventory

- [ ] **BASE-01**: Player-facing result and replay inventory identifies current pages, components, fixture adapters, proof scripts, visual tests, privacy scans, and boundary monitors that shape public result/replay trust.
- [ ] **BASE-02**: Inventory maps every target public state to existing `match-execution-app-v1` lifecycle, failure category, result availability, replay availability, public message key, and service DTO inputs.
- [ ] **BASE-03**: Inventory distinguishes app/public UX surfaces from Go execution internals, runtime-service internals, quarantine/operator evidence, persistence internals, fixture-only adapters, and intentionally unstable implementation details.
- [ ] **BASE-04**: Inventory records current fixture and proof coverage for completed, queued, running, degraded, failed, stale-artifact, unavailable-runtime, malformed-runtime-result, missing-Chronicle, and no-result states.
- [ ] **BASE-05**: Baseline artifacts explicitly state that no `match-execution-app-v1` change, no public DTO addition, no execution-policy change, no runtime promotion, and no v1.27 dependency is planned.

### Result-State Explanation Polish

- [ ] **STATE-01**: Player can read a concise public result summary that explains whether a MatchSet is complete, queued, running, degraded, failed, unavailable, or pending evidence without exposing private details.
- [ ] **STATE-02**: Player can distinguish Strategy-caused failures, system failures, timeouts, unavailable runtime, malformed runtime result, stale artifact, missing Chronicle, and no-result outcomes using public-safe canonical wording.
- [ ] **STATE-03**: Player can understand result availability and replay availability using existing lifecycle fields only, including `none`, `partial`, `complete`, `pending`, `available`, `stale`, and `missing`.
- [ ] **STATE-04**: Player can understand retryability at a public level without seeing retry counts, operator actions, quarantine details, raw diagnostics, recovery payloads, or runtime internals.
- [ ] **STATE-05**: Result page layout makes the current state, evidence status, Match ledger, replay links or missing-evidence reasons, entrants, and provenance scannable on desktop and mobile.
- [ ] **STATE-06**: Tests prove result-state copy remains public-safe, canonical, and derived from existing contract/service DTO data.

### Replay Trust Cues and Missing Evidence States

- [ ] **REPLAY-01**: Player can see replay trust cues explaining that public replay playback is reconstructed from public Chronicle projection or public replay evidence, not from private Strategy source or memories.
- [ ] **REPLAY-02**: Replay unavailable page explains missing Chronicle, invalid Chronicle, missing public evidence, stale replay evidence, and no-result states with public-safe next-state language.
- [ ] **REPLAY-03**: Replay evidence panel shows public-safe trust cues for Chronicle hash, schema, event count, snapshot count, arena, lifecycle, replay availability, privacy exclusions, and projection limits when that data is already available.
- [ ] **REPLAY-04**: Replay page distinguishes public view from owner debug view without exposing owner-only debug controls or private data in public mode.
- [ ] **REPLAY-05**: Replay trust copy preserves canonical terms: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle.
- [ ] **REPLAY-06**: Tests cover ready replay, missing Chronicle, invalid Chronicle, missing public evidence, stale evidence, and no-result public replay states.

### Public Privacy Scan Expansion

- [ ] **PRIV-01**: Public result pages are scanned for Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, host paths, env values, tokens, DB details, package paths, private runtime internals, quarantine details, operator details, and recovery payloads.
- [ ] **PRIV-02**: Public replay pages and replay-unavailable pages are scanned for the same private markers across ready, missing, invalid, stale, and no-result states.
- [ ] **PRIV-03**: Fixture payloads, generated proof artifacts, and public copy snapshots are scanned for private markers and fail loudly on leakage.
- [ ] **PRIV-04**: Privacy copy uses public-safe concepts rather than private field names where player-facing language would otherwise expose implementation details.
- [ ] **PRIV-05**: Tests prove owner/test-only debug paths remain disabled in public mode and cannot become public evidence fallback.

### Board Realism and Visual Regression Coverage

- [ ] **BOARD-01**: Browser validation confirms replay board rendering is nonblank, unclipped, and plausibly framed on desktop and mobile.
- [ ] **BOARD-02**: Board realism checks prove visible Soldier and STONE terrain positions stay inside declared board bounds.
- [ ] **BOARD-03**: Board realism checks prove FALLEN Soldiers are not rendered as visible pieces and visible Soldiers have positions.
- [ ] **BOARD-04**: Canonical arenas contain canonical starting positions at Match start where canonical arena validation applies.
- [ ] **BOARD-05**: Visual regression coverage captures public replay trust panels and missing/unavailable replay evidence states without text overlap or layout breakage.
- [ ] **BOARD-06**: Result page visual checks cover long Match ids, long public messages, no replay link rows, and responsive evidence panels.

### Contract Compatibility Monitors

- [ ] **COMPAT-01**: Contract tests prove every public outcome still validates against `match-execution-app-v1`.
- [ ] **COMPAT-02**: Monitor proves no required public execution DTO field was added, removed, renamed, semantically narrowed, or repurposed.
- [ ] **COMPAT-03**: Monitor proves `match-execution-app-v1` contract version remains unchanged and no v1.29-specific public contract version appears.
- [ ] **COMPAT-04**: Monitor proves v1.29 UX copy and fixtures do not introduce public recovery, quarantine, operator, runtime-service internal, or private diagnostics state.
- [ ] **COMPAT-05**: Boundary monitors continue to catch ownership creep, Strategy execution in web/API/Go, runtime-service recovery ownership, TypeScript backend fallback, fixture fallback in production, privacy leaks, and premature runtime promotion claims.
- [ ] **COMPAT-06**: Compatibility proof explicitly states that all v1.29 changes are app/public presentation and proof changes over existing DTOs.

### Public Page Proof

- [ ] **PROOF-01**: Fixture-backed proof opens public result pages for completed, queued, running, degraded, failed, stale-artifact, unavailable-runtime, malformed-runtime-result, missing-Chronicle, and no-result states.
- [ ] **PROOF-02**: Fixture-backed or signed-in proof opens ready replay, replay-unavailable, missing-Chronicle, invalid-Chronicle, stale-evidence, and no-result replay states where the current app can represent them.
- [ ] **PROOF-03**: Proof records public page URLs, state classifications, contract version, evidence rows, replay availability, board realism result, privacy scan result, and screenshot or visual-regression references.
- [ ] **PROOF-04**: Proof uses signed-in JS/TS counted execution only if live proof is needed; Python, Rust, and Zig remain non-counted exhibition beta and are not required for public UX proof.
- [ ] **PROOF-05**: Proof artifacts explicitly state no result/replay contract expansion, no DTO field addition, no runtime promotion, no production sandbox certification, no ABI migration, no counted non-JS play, no operator UI, and no Strategy execution in web/API/Go.

### Audit and Closure

- [ ] **CLOSE-01**: Code review verifies public result/replay copy, layout, privacy scans, fixture coverage, visual proof, board realism checks, and contract monitors.
- [ ] **CLOSE-02**: Validation verifies requirements, tests, fixture-backed or signed-in proof, browser proof, visual regressions, privacy scans, and boundary monitors.
- [ ] **CLOSE-03**: Final milestone decision preserves frozen `match-execution-app-v1`, JS/TS counted path, non-JS beta-only status, Preview 1 JSON ABI, no production sandbox certification, no v1.27 dependency, and no Strategy execution in web/API/Go.
- [ ] **CLOSE-04**: v1.29 planning artifacts are archived, active workstream requirements are marked complete, and commit/tag evidence is recorded only after audit and validation pass.
- [ ] **CLOSE-05**: Retrospective records result/replay trust lessons, remaining public evidence gaps, fixture/proof limitations, and future contract-version criteria.

## Future Requirements

### Public Result and Replay Follow-Up

- **FUT-UX-01**: Future public result/replay contract expansion requires a separate app contract version or explicitly proven backward-compatible addition.
- **FUT-UX-02**: Future public operations or recovery UI requires a separate privacy, access-control, provenance, and operator-boundary design.
- **FUT-UX-03**: Future replacement Match or replacement MatchSet provenance requires a separate public scoring and replay-link design.
- **FUT-UX-04**: Future richer replay explanation that needs StrategyMemory, SoldierMemory, objective payloads, or owner debug data must remain owner-private and must not become public output by default.

## Out of Scope

| Feature | Reason |
| --- | --- |
| `match-execution-app-v1` version bump | v1.29 is public UX polish over the frozen contract. |
| New public execution DTO fields | Result/replay polish must use existing public DTO data and projection. |
| Go match execution changes | v1.29 must stay on the app/public UX side unless a read-only public projection bug is discovered and justified. |
| Runtime-service behavior changes | Runtime-service remains hostile Strategy execution only; UX polish does not require runtime semantics changes. |
| Retry/recovery policy changes | v1.28 already owns internal recovery; v1.29 explains public states without changing policy. |
| Quarantine semantics or operator controls | Quarantine and operator details remain private/internal only. |
| MatchSet scoring changes | Public result trust polish must not alter scoring semantics. |
| Chronicle persistence changes | Replay trust cues consume existing public Chronicle/replay evidence and do not change storage semantics. |
| Public raw diagnostics or private runtime internals | Public evidence remains source-free and private-data safe. |
| Strategy source, StrategyMemory, SoldierMemory, or objective payload exposure | Public replay/result output must not expose private Strategy data by default. |
| Strategy execution in web/API/Go | Hostile Strategy code stays behind runtime-service / Runtime Broker boundaries. |
| Runtime promotion or counted non-JS play | JS/TS remains counted; Python/Rust/Zig remain non-counted exhibition beta. |
| Production sandbox certification | UI trust polish does not prove production hostile-code isolation. |
| Direct-export or Component Model/WIT ABI migration | Preview 1 stdin/stdout JSON remains the active WASM/WASI ABI. |
| v1.27 baseline dependency | v1.27 must not be used unless explicitly merged into this checkout. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| BASE-01 | Phase 210 | Pending |
| BASE-02 | Phase 210 | Pending |
| BASE-03 | Phase 210 | Pending |
| BASE-04 | Phase 210 | Pending |
| BASE-05 | Phase 210 | Pending |
| STATE-01 | Phase 211 | Pending |
| STATE-02 | Phase 211 | Pending |
| STATE-03 | Phase 211 | Pending |
| STATE-04 | Phase 211 | Pending |
| STATE-05 | Phase 211 | Pending |
| STATE-06 | Phase 211 | Pending |
| REPLAY-01 | Phase 212 | Pending |
| REPLAY-02 | Phase 212 | Pending |
| REPLAY-03 | Phase 212 | Pending |
| REPLAY-04 | Phase 212 | Pending |
| REPLAY-05 | Phase 212 | Pending |
| REPLAY-06 | Phase 212 | Pending |
| PRIV-01 | Phase 213 | Pending |
| PRIV-02 | Phase 213 | Pending |
| PRIV-03 | Phase 213 | Pending |
| PRIV-04 | Phase 213 | Pending |
| PRIV-05 | Phase 213 | Pending |
| BOARD-01 | Phase 214 | Pending |
| BOARD-02 | Phase 214 | Pending |
| BOARD-03 | Phase 214 | Pending |
| BOARD-04 | Phase 214 | Pending |
| BOARD-05 | Phase 214 | Pending |
| BOARD-06 | Phase 214 | Pending |
| COMPAT-01 | Phase 215 | Pending |
| COMPAT-02 | Phase 215 | Pending |
| COMPAT-03 | Phase 215 | Pending |
| COMPAT-04 | Phase 215 | Pending |
| COMPAT-05 | Phase 215 | Pending |
| COMPAT-06 | Phase 215 | Pending |
| PROOF-01 | Phase 216 | Pending |
| PROOF-02 | Phase 216 | Pending |
| PROOF-03 | Phase 216 | Pending |
| PROOF-04 | Phase 216 | Pending |
| PROOF-05 | Phase 216 | Pending |
| CLOSE-01 | Phase 217 | Pending |
| CLOSE-02 | Phase 217 | Pending |
| CLOSE-03 | Phase 217 | Pending |
| CLOSE-04 | Phase 217 | Pending |
| CLOSE-05 | Phase 217 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Complete: 0
- Planned: 44
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-05-31*
