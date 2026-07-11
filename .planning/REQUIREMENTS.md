# Requirements: Coward's Game v1.36 Competition Maturity

**Defined:** 2026-06-15
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.36 Requirements

Requirements for the Competition Maturity milestone. Each maps to roadmap phases after approval.

### Posture and Policy

- [x] **POST-01**: Public competition surfaces describe Coward's Game competition as public beta trial competition with resettable season-scoped standings.
- [x] **POST-02**: Public competition surfaces clearly state that v1.36 does not promise durable permanent ratings, all-time rankings, rating refunds, or mature staffed moderation.
- [x] **POST-03**: A versioned competition policy contract defines public beta posture, reset policy, counted-state vocabulary, privacy exclusions, forbidden claims, and authoritative owners for competition decisions.
- [x] **POST-04**: Competition surfaces are inventoried with owner, public/private data class, counted behavior, replay evidence requirement, and privacy risk.
- [x] **POST-05**: Public copy monitors reject durable-rating, production-sandbox, package-ecosystem, TinyGo-production, raw-diagnostic, or private-runtime overclaims.

### Entry Eligibility

- [x] **ELIG-01**: A Player can enter counted trial competition only with an immutable account-owned Strategy Revision whose provider proof, language/provider support, provenance/artifact evidence, runtime readiness, engine compatibility, and package mode satisfy v1.35 policy.
- [x] **ELIG-02**: Counted entry rejects stale artifacts, missing or mismatched provider proof, unsupported providers, hidden TinyGo lanes, invalid provenance, unavailable runtime lanes, owner mismatch, mutable drafts, and non-`none` package modes.
- [x] **ELIG-03**: Counted entry returns public-safe eligibility categories and remediation copy without exposing Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, provider signing material, or private runtime internals.
- [x] **ELIG-04**: A Player can have only one active Strategy Revision entry per counted Season.
- [x] **ELIG-05**: A counted Season entry cannot be replaced mid-season; replacement is allowed only for a future Season or an explicitly non-counted/exhibition path.
- [x] **ELIG-06**: Exhibition MatchSets preserve explicitly labeled same-user, self-play, and multi-revision workflows without allowing those results to affect counted trial standings.

### Season Lifecycle

- [x] **SEAS-01**: Trial Seasons expose lifecycle state, entry window, scheduling window, active/completed/archive state, reset policy, and counted-entry rules through public-safe DTOs.
- [x] **SEAS-02**: Season scheduling snapshots eligible entrants before MatchSet creation so Strategy Revisions remain locked for the Season's counted MatchSets.
- [x] **SEAS-03**: Completed or archived Seasons keep stable public links to standings, results, and replay evidence while making resettable/non-durable status visible.
- [x] **SEAS-04**: Season standings do not mix entrants, MatchSets, or counted results across Season boundaries.
- [x] **SEAS-05**: Season policy explains minimum entries, target MatchSet/pod behavior where applicable, and what happens when a Season cannot produce enough counted evidence.

### Result and Standings Integrity

- [ ] **RESULT-01**: MatchSets expose a public-safe counted-state projection covering pending, counted, retrying, degraded/system failure, non-counted, non-competitive, disputed/under review, invalid, and invalidated outcomes.
- [ ] **RESULT-02**: Public result pages explain why a MatchSet did or did not count and how that state affects standings.
- [ ] **RESULT-03**: Standings are recomputed from canonical complete counted MatchSet evidence plus governance state rather than React-owned display state or manually edited rank rows.
- [ ] **RESULT-04**: Degraded, failed, disputed, invalid, invalidated, non-counted, and non-competitive MatchSets do not silently pollute counted standings.
- [ ] **RESULT-05**: Standings rows expose public-safe evidence availability, counted MatchSet counts, exclusions, tie-breaker inputs, and replay/result links.
- [ ] **RESULT-06**: Recompute tests prove standings are deterministic, season-scoped, and stable across repeated recomputation from the same canonical inputs.

### Governance, Dispute, Abuse, and Recovery

- [ ] **GOV-01**: Signed-in Players can report or dispute eligible competition results through a minimal product surface that records private-safe report metadata.
- [ ] **GOV-02**: Governance actions can mark MatchSets or MatchSet groups under review, counted, non-counted, non-competitive, invalid, or invalidated with auditable private records and public-safe explanations.
- [ ] **GOV-03**: Public governance projections expose only coarse status, safe reason category, safe explanation, timestamp where appropriate, standings impact, and replay availability.
- [ ] **GOV-04**: Private governance data, reporter identity, operator notes, raw diagnostics, recovery evidence, tokens, DB details, private runtime internals, and Strategy-private data are excluded from public/default outputs.
- [ ] **GOV-05**: Abuse and fair-play policy surfaces define current product behavior, reporting expectations, evidence limits, and future moderation work without promising automatic punishment, public sanction history, appeal SLAs, or permanent rating repair.
- [ ] **GOV-06**: Account recovery surfaces explain current account ownership/recovery assumptions and future recovery limitations without collecting or publishing sensitive recovery payloads by default.

### Public Trust UX

- [ ] **TRUST-01**: Competition index/detail, Season, standings, entry, result, replay, player, and Strategy pages render eligibility, counted status, Season state, evidence availability, and resettable/no-durable-rating posture from policy-backed public DTOs.
- [ ] **TRUST-02**: Public player and Strategy pages distinguish counted trial evidence from exhibition/study/self-play evidence without exposing private Strategy data.
- [ ] **TRUST-03**: Replay pages and result pages preserve source/memory/objective/private-runtime privacy while showing public Chronicle/replay evidence and counted-state explanations.
- [ ] **TRUST-04**: Public trust copy is calm and product-facing, avoiding scary internal jargon while remaining honest about resets, degraded Matches, disputes, invalidations, and limited recovery/moderation maturity.
- [ ] **TRUST-05**: Public UI does not implement game rules, scoring truth, entry eligibility truth, or Strategy execution; it renders authoritative public projections.

### Verification and Boundary Proof

- [ ] **PROOF-01**: Service-backed proof covers entry -> counted MatchSet -> execution -> result -> standings -> replay for at least one realistic counted Season flow.
- [ ] **PROOF-02**: Negative proof covers stale/missing/mismatched provider proof, unsupported provider/language, hidden TinyGo, invalid provenance, unavailable runtime lane, package-policy violation, same-user counted entry, and mid-season replacement rejection.
- [ ] **PROOF-03**: Governance proof covers degraded, non-counted, disputed/under-review, invalid, and invalidated scenarios with standings recomputation and public-safe explanations.
- [ ] **PROOF-04**: Privacy scans cover public APIs, pages, fixtures, proof artifacts, and copy snapshots for Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, dispute internals, account-recovery payloads, and operator-only details.
- [ ] **PROOF-05**: Boundary monitors prove no Strategy execution moved into web/API/Go, no game rules moved into React, no Node `vm` security boundary was introduced, no package/TinyGo/sandbox overclaims were added, and runtime-service / Runtime Broker / provider ownership remains intact.
- [ ] **PROOF-06**: Browser replay/result realism checks verify visible Soldier, STONE, and terrain positions stay inside declared board bounds, canonical arenas contain canonical starting positions, FALLEN/STONE display remains plausible, and public replay pages show plausible full Match starts instead of clipped or off-screen pieces.

## Future Requirements

Deferred to future milestones. Tracked but not in the current roadmap.

### Ratings

- **RATING-01**: Players can receive durable permanent ratings backed by a proven rating system, abuse policy, recovery policy, and public promise.
- **RATING-02**: Players can inspect all-time rankings and rating history across Seasons.
- **RATING-03**: Governance can repair or refund durable ratings after invalidation decisions.

### Moderation and Recovery

- **MOD-01**: Operators can use a full moderation console with queues, roles, evidence review, appeals, sanctions, and public enforcement history.
- **MOD-02**: Players can use a full account recovery flow with verified ownership transfer and abuse-resistant recovery evidence handling.
- **MOD-03**: The product can provide appeal SLAs, staffed moderation commitments, and automated abuse detection.

### Runtime, Packages, and Formats

- **RUNTIME-01**: Any runtime lane can claim production sandbox certification after a future explicit certification milestone.
- **RUNTIME-02**: TinyGo can appear as a production-visible Strategy language after forbidden WASI imports and production support requirements are resolved.
- **PKG-01**: TypeScript, Python, Rust, Zig, or TinyGo Strategies can use rich package ecosystems after a future package-lane milestone.
- **ABI-01**: Rust/Zig or future lanes can migrate from WASI Preview 1 stdin/stdout JSON to direct exports or Component Model/WIT after a future ABI milestone.

### Competition Operations

- **TOURNEY-01**: Players can enter formal public tournaments with prizes, bracket governance, legal terms, and durable tournament records.
- **SOCIAL-01**: Spectators can follow players, subscribe to competition events, and participate in public discussion surfaces.

## Out of Scope

Explicitly excluded from v1.36 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Game-rule changes | v1.36 matures competition policy and trust surfaces without changing deterministic Coward's Game rules. |
| Strategy execution in web/API/Go | Hostile Strategy execution remains behind runtime-service / Runtime Broker / provider boundaries. |
| Durable permanent ratings or Elo/Glicko/TrueSkill/MMR | Public beta trial Seasons remain resettable and non-durable until governance and abuse maturity justify a permanent promise. |
| Full moderation, appeal, sanction, or account recovery operations | v1.36 adds honest expectations and minimal safe surfaces, not a staffed operations product. |
| Public raw diagnostics, Strategy source, artifact bytes, private memory, objectives, tokens, DB details, package paths, host paths, env values, dispute internals, recovery payloads, or operator notes | Public/default outputs must remain privacy-safe and source/memory/objective/private-runtime safe. |
| Production sandbox certification | v1.35 evidence is readiness/provenance/artifact evidence only; certification needs a future explicit milestone. |
| Package ecosystem support | Current production Strategy lanes remain package mode `none`. |
| TinyGo production support | TinyGo remains spike-only and hidden from production surfaces. |
| Direct exports or Component Model/WIT ABI migration | WASI Preview 1 stdin/stdout JSON remains the active Rust/Zig artifact-backed ABI until future proof changes it. |
| New rating engine or external moderation/recovery vendor | Research recommends using existing stack and policy/proof layers for v1.36. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| POST-01 | Phase 249 | Complete |
| POST-02 | Phase 249 | Complete |
| POST-03 | Phase 249 | Complete |
| POST-04 | Phase 249 | Complete |
| POST-05 | Phase 249 | Complete |
| ELIG-01 | Phase 250 | Complete |
| ELIG-02 | Phase 250 | Complete |
| ELIG-03 | Phase 250 | Complete |
| ELIG-04 | Phase 250 | Complete |
| ELIG-05 | Phase 250 | Complete |
| ELIG-06 | Phase 250 | Complete |
| SEAS-01 | Phase 251 | Complete |
| SEAS-02 | Phase 251 | Complete |
| SEAS-03 | Phase 251 | Complete |
| SEAS-04 | Phase 251 | Complete |
| SEAS-05 | Phase 251 | Complete |
| RESULT-01 | Phase 252 | Pending |
| RESULT-02 | Phase 252 | Pending |
| RESULT-03 | Phase 252 | Pending |
| RESULT-04 | Phase 252 | Pending |
| RESULT-05 | Phase 252 | Pending |
| RESULT-06 | Phase 252 | Pending |
| GOV-01 | Phase 253 | Pending |
| GOV-02 | Phase 253 | Pending |
| GOV-03 | Phase 253 | Pending |
| GOV-04 | Phase 253 | Pending |
| GOV-05 | Phase 253 | Pending |
| GOV-06 | Phase 253 | Pending |
| TRUST-01 | Phase 254 | Pending |
| TRUST-02 | Phase 254 | Pending |
| TRUST-03 | Phase 254 | Pending |
| TRUST-04 | Phase 254 | Pending |
| TRUST-05 | Phase 254 | Pending |
| PROOF-01 | Phase 255 | Pending |
| PROOF-02 | Phase 255 | Pending |
| PROOF-03 | Phase 255 | Pending |
| PROOF-04 | Phase 255 | Pending |
| PROOF-05 | Phase 255 | Pending |
| PROOF-06 | Phase 255 | Pending |

**Coverage:**
- v1.36 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0
- Coverage: 39/39

---
*Requirements defined: 2026-06-15*
*Last updated: 2026-06-15 after v1.36 roadmap creation*
