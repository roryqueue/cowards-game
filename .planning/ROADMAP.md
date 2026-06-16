# Roadmap: Coward's Game

## Milestones

- **v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup** - Phases 243-248, shipped 2026-06-15
- **v1.36 Competition Maturity** - Phases 249-255, active execution

## Shipped Context

### v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup

**Status:** Shipped 2026-06-15
**Phase range:** 243-248
**Plans:** 11/11 complete
**Requirements:** 32/32 complete

v1.35 closed runtime, account ownership, sandbox-readiness, and package-policy edges that v1.36 now consumes. Provider-proof-backed account save and entry gates, server-authorized account source boundaries, deprecated Workshop aliases, evidence-scoped sandbox-readiness labels, package mode `none`, PostgreSQL-backed proof, privacy scans, and boundary monitors are shipped baseline constraints, not active v1.36 work.

Archive:

- `.planning/milestones/v1.35-ROADMAP.md`
- `.planning/milestones/v1.35-REQUIREMENTS.md`
- `.planning/milestones/v1.35-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.35-phases/`

## Active Milestone

### v1.36 Competition Maturity

**Goal:** Move Coward's Game competition from alpha/trial posture toward mature public beta by tightening season policy, entry eligibility, standings/result governance, abuse/dispute/recovery expectations, public trust copy, and replay/result proof while preserving deterministic rules and runtime ownership boundaries.

**Granularity:** standard
**Requirement coverage:** 39/39 v1.36 requirements mapped
**Phase range:** 249-255

### Roadmap Notes

- v1.36 uses resettable public beta trial competition language and does not promise durable permanent ratings, all-time rankings, rating refunds, or mature staffed moderation.
- Strategy execution remains outside web/API/Go and behind runtime-service / Runtime Broker / provider boundaries.
- Game rules, pure engine behavior, Chronicle semantics, and canonical terminology are unchanged.
- Current production Strategy lanes keep package mode `none`; rich package ecosystems remain future work.
- TinyGo remains spike-only and hidden from production surfaces.
- TypeScript and Python remain source-language provenance lanes, not WASM isolation or production sandbox certification.
- Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes.
- Public/default output must not expose Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, dispute internals, account-recovery payloads, or operator-only governance details.

## Phases

- [x] **Phase 249: Competition Surface Inventory and Policy Lock** - Lock v1.36 public beta posture, surface inventory, vocabulary, owners, privacy exclusions, and forbidden claims.
- [ ] **Phase 250: Counted Entry and One-Active-Revision Enforcement** - Enforce provider-proof-backed counted eligibility, one active counted revision per Season, and explicit exhibition separation. Plan 01 completed the shared spec contract.
- [ ] **Phase 251: Season Lifecycle and Scheduling Policy** - Define public-safe Season lifecycle, entry and scheduling windows, entrant snapshots, archive behavior, and reset semantics.
- [ ] **Phase 252: Counted-State Classifier and Standings Recompute** - Classify result states and recompute Season standings from canonical counted evidence plus governance state.
- [ ] **Phase 253: Governance, Dispute, Abuse, and Recovery Surfaces** - Add minimal public-safe reporting, dispute, governance, abuse-policy, and recovery-expectation behavior.
- [ ] **Phase 254: Public Trust UX Projections** - Render policy-backed competition, standings, result, replay, player, Strategy, and entry trust projections without owning rules in UI.
- [ ] **Phase 255: Service-Backed E2E Proof and Boundary Monitors** - Prove the full counted competition path, negative cases, governance scenarios, privacy, boundary monitors, and replay realism.

## Phase Details

### Phase 249: Competition Surface Inventory and Policy Lock
**Goal**: Competition posture, vocabulary, authority, privacy boundaries, and forbidden claims are stable before entry, Season, standings, governance, or public projection work builds on them.
**Depends on**: v1.35 shipped baseline
**Requirements**: POST-01, POST-02, POST-03, POST-04, POST-05
**Success Criteria** (what must be TRUE):
  1. Public competition surfaces describe v1.36 as public beta trial competition with resettable Season-scoped standings and no durable rating promise.
  2. A surface inventory identifies each competition surface's owner, public/private data class, counted behavior, replay evidence requirement, and privacy risk.
  3. A versioned competition policy contract defines counted-state vocabulary, reset policy, privacy exclusions, forbidden claims, and authoritative owners.
  4. Public copy monitors reject durable-rating, production-sandbox, package-ecosystem, TinyGo-production, raw-diagnostic, and private-runtime overclaims.
**Plans**: 3 plans
Plans:
- [x] 249-01-PLAN.md — Create the spec-owned `competition-policy-v1.36` contract for posture, vocabulary, privacy exclusions, owners, and forbidden claims.
- [x] 249-02-PLAN.md — Generate the Markdown/JSON route-code-artifact competition surface inventory from a typed evaluator.
- [x] 249-03-PLAN.md — Wire fail-loud v1.36 copy/privacy monitor checks into package scripts and the boundary monitor chain.

### Phase 250: Counted Entry and One-Active-Revision Enforcement
**Goal**: Players can enter counted trial competition only through current, immutable, account-owned, provider-proof-valid Strategy Revisions, while exhibition workflows remain clearly non-counted where appropriate.
**Depends on**: Phase 249
**Requirements**: ELIG-01, ELIG-02, ELIG-03, ELIG-04, ELIG-05, ELIG-06
**Success Criteria** (what must be TRUE):
  1. A Player with a valid immutable account-owned Strategy Revision can enter counted trial competition when provider proof, language/provider support, provenance/artifact evidence, runtime readiness, engine compatibility, and package mode satisfy v1.35 policy.
  2. Counted entry rejects stale artifacts, missing or mismatched provider proof, unsupported providers, hidden TinyGo lanes, invalid provenance, unavailable runtime lanes, owner mismatch, mutable drafts, and non-`none` package modes.
  3. Entry rejection responses provide public-safe eligibility categories and remediation copy without exposing private Strategy, artifact, provider, runtime, host, package, token, or database details.
  4. A Player can have only one active Strategy Revision entry per counted Season, and counted mid-season replacement is blocked.
  5. Exhibition MatchSets still support explicitly labeled same-user, self-play, and multi-revision workflows without affecting counted trial standings.
**Plans**: 3 plans
Plans:
- [x] 250-01-PLAN.md — Create the spec-owned counted entry eligibility category/remediation contract and leak-safe tests.
- [ ] 250-02-PLAN.md — Implement persistence counted entry evaluation, public-safe category failures, and one-owner-per-Season enforcement.
- [ ] 250-03-PLAN.md — Align web/API/public discovery/Go readiness projection and preserve exhibition separation.

Wave dependency notes:
- **Wave 1:** 250-01 establishes the shared spec contract.
- **Wave 2 (blocked on Wave 1 completion):** 250-02 consumes the spec contract in persistence.
- **Wave 3 (blocked on Waves 1-2 completion):** 250-03 projects the persistence/spec contract through API, discovery, readiness parity, and exhibition copy.

Cross-cutting constraints:
- Counted entry must consume v1.35 provider-proof, runtime, provenance, engine, and package-policy evidence without creating new runtime, sandbox, package, TinyGo, or durable-rating claims.
- Public entry responses and projections must use stable public categories/remediation and exclude private Strategy, provider, runtime, artifact, database, token, memory, objective, and operator-only details.
- Strategy execution remains outside web/API/Go.
- Exhibition flows remain separate from counted trial standings and continue to support labeled same-user, self-play, and multi-revision workflows.

### Phase 251: Season Lifecycle and Scheduling Policy
**Goal**: Trial Seasons expose stable lifecycle and scheduling rules that lock counted entrants, preserve resettable archives, and prevent cross-Season standings contamination.
**Depends on**: Phase 250
**Requirements**: SEAS-01, SEAS-02, SEAS-03, SEAS-04, SEAS-05
**Success Criteria** (what must be TRUE):
  1. Trial Seasons expose lifecycle state, entry window, scheduling window, active/completed/archive state, reset policy, and counted-entry rules through public-safe DTOs.
  2. Season scheduling snapshots eligible entrants before MatchSet creation so counted MatchSets use locked Strategy Revisions.
  3. Completed or archived Seasons keep stable public links to standings, results, and replay evidence while visibly remaining resettable and non-durable.
  4. Season standings do not mix entrants, MatchSets, or counted results across Season boundaries.
  5. Season policy explains minimum entries, target MatchSet or pod behavior where applicable, and insufficient-evidence outcomes.
**Plans**: TBD

### Phase 252: Counted-State Classifier and Standings Recompute
**Goal**: Players can trust Season standings because every MatchSet has a public-safe counted state and rankings are recomputed from canonical evidence instead of UI-owned display state.
**Depends on**: Phase 251
**Requirements**: RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06
**Success Criteria** (what must be TRUE):
  1. MatchSets expose public-safe counted-state projections for pending, counted, retrying, degraded/system failure, non-counted, non-competitive, disputed/under review, invalid, and invalidated outcomes.
  2. Public result pages explain why a MatchSet did or did not count and how that state affects standings.
  3. Standings recompute from canonical complete counted MatchSet evidence plus governance state, not React-owned display state or manually edited rank rows.
  4. Degraded, failed, disputed, invalid, invalidated, non-counted, and non-competitive MatchSets do not silently pollute counted standings.
  5. Repeated recomputation from the same canonical inputs produces deterministic, Season-scoped, stable standings rows with public-safe evidence availability, exclusion, tie-breaker, result, and replay links.
**Plans**: TBD
**UI hint**: yes

### Phase 253: Governance, Dispute, Abuse, and Recovery Surfaces
**Goal**: Players can report or dispute competition results and see honest public governance status while private evidence, operator details, and recovery-sensitive data stay private.
**Depends on**: Phase 252
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06
**Success Criteria** (what must be TRUE):
  1. Signed-in Players can submit a minimal report or dispute form for eligible competition results, and the product records private-safe report metadata.
  2. Governance actions can mark MatchSets or MatchSet groups under review, counted, non-counted, non-competitive, invalid, or invalidated with auditable private records and public-safe explanations.
  3. Public governance projections expose only coarse status, safe reason category, safe explanation, timestamp where appropriate, standings impact, and replay availability.
  4. Abuse, fair-play, and account recovery surfaces explain current product behavior and future limitations without promising automatic punishment, public sanction history, appeal SLAs, permanent rating repair, or full recovery.
  5. Public/default outputs exclude reporter identity, operator notes, raw diagnostics, recovery evidence, tokens, DB details, private runtime internals, Strategy-private data, dispute internals, and account-recovery payloads.
**Plans**: TBD
**UI hint**: yes

### Phase 254: Public Trust UX Projections
**Goal**: Public and signed-in users can understand eligibility, counted status, Season state, evidence availability, privacy boundaries, and resettable public beta posture from authoritative public projections.
**Depends on**: Phase 253
**Requirements**: TRUST-01, TRUST-02, TRUST-03, TRUST-04, TRUST-05
**Success Criteria** (what must be TRUE):
  1. Competition index/detail, Season, standings, entry, result, replay, player, and Strategy pages render eligibility, counted status, Season state, evidence availability, and resettable/no-durable-rating posture from policy-backed public DTOs.
  2. Public player and Strategy pages distinguish counted trial evidence from exhibition, study, self-play, and other non-counted evidence without exposing private Strategy data.
  3. Replay and result pages preserve source, memory, objective, dispute, recovery, and private-runtime privacy while showing public Chronicle/replay evidence and counted-state explanations.
  4. Public trust copy is calm, product-facing, and honest about resets, degraded Matches, disputes, invalidations, and limited recovery/moderation maturity.
  5. Public UI renders authoritative projections only and does not implement game rules, scoring truth, entry eligibility truth, or Strategy execution.
**Plans**: TBD
**UI hint**: yes

### Phase 255: Service-Backed E2E Proof and Boundary Monitors
**Goal**: v1.36 closes only after service-backed proof shows counted competition works end to end and monitors prove privacy, runtime, package, TinyGo, sandbox-claim, React-rule, and replay-realism boundaries hold.
**Depends on**: Phase 254
**Requirements**: PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06
**Success Criteria** (what must be TRUE):
  1. Service-backed proof covers entry -> counted MatchSet -> execution -> result -> standings -> replay for at least one realistic counted Season flow.
  2. Negative proof covers stale/missing/mismatched provider proof, unsupported provider/language, hidden TinyGo, invalid provenance, unavailable runtime lane, package-policy violation, same-user counted entry, and mid-season replacement rejection.
  3. Governance proof covers degraded, non-counted, disputed/under-review, invalid, and invalidated scenarios with standings recomputation and public-safe explanations.
  4. Privacy scans and boundary monitors pass for public APIs, pages, fixtures, proof artifacts, copy snapshots, Strategy execution ownership, React rule ownership, Node `vm` avoidance, package/TinyGo/sandbox claims, and runtime-service / Runtime Broker / provider boundaries.
  5. Browser replay/result realism checks verify visible Soldier, STONE, and terrain positions stay inside declared board bounds, canonical arenas contain canonical starting positions, FALLEN/STONE display remains plausible, and public replay pages show plausible full Match starts.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 249. Competition Surface Inventory and Policy Lock | 3/3 | Complete | 2026-06-16 |
| 250. Counted Entry and One-Active-Revision Enforcement | 1/3 | In progress | - |
| 251. Season Lifecycle and Scheduling Policy | 0/0 | Not started | - |
| 252. Counted-State Classifier and Standings Recompute | 0/0 | Not started | - |
| 253. Governance, Dispute, Abuse, and Recovery Surfaces | 0/0 | Not started | - |
| 254. Public Trust UX Projections | 0/0 | Not started | - |
| 255. Service-Backed E2E Proof and Boundary Monitors | 0/0 | Not started | - |

## Coverage

| Requirement Group | Requirements | Phase |
|-------------------|--------------|-------|
| Posture and Policy | POST-01, POST-02, POST-03, POST-04, POST-05 | Phase 249 |
| Entry Eligibility | ELIG-01, ELIG-02, ELIG-03, ELIG-04, ELIG-05, ELIG-06 | Phase 250 |
| Season Lifecycle | SEAS-01, SEAS-02, SEAS-03, SEAS-04, SEAS-05 | Phase 251 |
| Result and Standings Integrity | RESULT-01, RESULT-02, RESULT-03, RESULT-04, RESULT-05, RESULT-06 | Phase 252 |
| Governance, Dispute, Abuse, and Recovery | GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06 | Phase 253 |
| Public Trust UX | TRUST-01, TRUST-02, TRUST-03, TRUST-04, TRUST-05 | Phase 254 |
| Verification and Boundary Proof | PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06 | Phase 255 |

**Coverage validation:** 39/39 v1.36 requirements mapped exactly once. No v1.35 requirements are active v1.36 scope.

## Next

Start sequential phase discussion with `$gsd-discuss-phase 250`.
