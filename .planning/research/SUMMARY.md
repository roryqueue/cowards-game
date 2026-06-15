# Project Research Summary

**Project:** Coward's Game v1.36 Competition Maturity  
**Domain:** Deterministic programmable strategy-game public beta competition maturity  
**Researched:** 2026-06-15  
**Confidence:** HIGH

## Executive Summary

Coward's Game is a deterministic two-player programmable strategy game where public competition trust depends on immutable Strategy Revisions, provider-proof-backed eligibility, replay-backed evidence, and strict separation between public projections and private runtime/account/governance data. Experts should build this kind of product as an auditable competition policy layer around the existing engine, Chronicle, runtime-service, Go backend, PostgreSQL store, and public UI. They should not solve competition maturity by changing game rules, moving Strategy execution into web/API/Go, adding unproven runtime claims, or introducing durable ratings before governance and abuse maturity are proven.

The recommended v1.36 approach is to make Coward's Game an honest public beta competition with resettable trial seasons and no permanent rating promise. The roadmap should lock a versioned competition posture and policy contract first, then tighten counted entry using v1.35 provider-proof/readiness/package evidence, mature season lifecycle and one-active-revision rules, define counted/non-counted/degraded/disputed/invalidated result semantics, recompute standings from canonical evidence, add minimal public-safe governance/dispute/abuse/recovery expectation surfaces, update trust UX, and finish with service-backed E2E proof plus boundary monitors.

The main risks are trust-contract drift and privacy leakage: standings that look durable, entry gates that accept stale or partial proof, degraded/disputed results that pollute rankings, public pages that overpromise moderation or account recovery, and result/replay/player/Strategy pages that expose private internals. Mitigate these with spec-owned DTOs, Go-owned normal competition orchestration, recomputable projections, coarse public-safe explanations, append-only audit events, privacy scans, copy monitors, and replay board realism checks.

## Key Findings

### Recommended Stack

Do not add a new platform for v1.36. Use the current pnpm/TypeScript/Next.js/React/Go/PostgreSQL/runtime-service stack and add versioned contracts, policy services, persistence hardening, public-safe DTOs, proof scripts, Playwright coverage, and boundary monitors. The stack research is strongly repo-local and recommends extending existing packages rather than introducing rating engines, moderation vendors, runtime systems, or new API frameworks.

**Core technologies:**

- `pnpm@11.1.2`: workspace orchestration and proof scripts — keep milestone evaluators and monitors in the existing command path.
- TypeScript `^6.0.3`: shared spec contracts, Zod schemas, persistence helpers, public DTO privacy guards, and proof harnesses — best fit for versioned competition policy.
- Next.js `^16.2.6` / React `^19.2.6`: public competition, ladder, result, replay, player, Strategy, Learn, and entry surfaces — update trust UX without moving rules into components.
- Go `1.25.0` with `pgx/v5 v5.9.2`: normal backend orchestration, MatchSet status/scoring refresh, public reads, season entry/provider checks, and competition policy ownership — never execute Strategy code here.
- PostgreSQL: canonical store for users, immutable Strategy Revisions, MatchSets, Chronicles, trial seasons, entries, result flags, counted status, standings inputs, and audit events.
- `apps/runtime-service`: authoritative provider validation/build/proof and Strategy execution boundary — v1.36 consumes this evidence; it does not own standings or season policy.
- Vitest and Playwright: contract/persistence/unit tests plus service-backed public flow and replay realism proof.

Critical stack additions should be limited to a v1.36 competition maturity contract in `@cowards/spec`, typed public governance metadata, a `scripts/evaluate-v1-36-competition-maturity.ts` proof evaluator, extended boundary monitors, and one focused service-backed Playwright proof. No dependency installation is recommended.

### Expected Features

v1.36 should make existing alpha/trial competition understandable, bounded, and auditable. The product posture should be "public beta trial competition": resettable season-scoped standings, strict counted eligibility, replay-backed public evidence, and limited public-safe governance explanations.

**Must have (table stakes):**

- Competition surface inventory and posture contract — every exhibition, trial season, entry dashboard, result, replay, player, Strategy, governance, discovery, proof, and monitor surface needs an owner, public/private data class, counted behavior, and proof requirement.
- Public beta/resettable trial season copy — pages must say trial/resettable/no permanent rating and avoid ranked permanence, Elo/Glicko, production sandbox certification, package ecosystem, or TinyGo production claims.
- Versioned season rules — expose lifecycle, entry windows, minimum entries, target pod size, scoring policy, one-entry rule, next-season replacement, stale revision policy, reset policy, and no durable rating promise.
- Counted entry eligibility — require current provider proof, supported language/provider, compatible runtime/engine metadata, valid provenance/artifact evidence, package mode `none`, non-hidden provider, owner authorization, immutable revision state, and no unsupported TinyGo lane.
- One active Strategy Revision per Player per Season — no mid-season replacement for counted trial standings.
- Exhibition versus trial ladder split — exhibitions can remain flexible and same-user/multi-revision where explicitly allowed; counted trial standings stay stricter and exclude same-user/self-play pollution.
- Counted-state taxonomy — `pending`, `counted`, `retrying`, `under_review`/`disputed`, `invalid`/`invalidated`, `non_competitive`, `non_counted`, and degraded/system-failure semantics need clear public standing effects.
- Recomputable standings — derive rankings from counted, complete, replay-backed MatchSets plus governance state, not UI-owned cached display truth.
- Public-safe governance/dispute behavior — result flags, review holds, admin resolution, audit events, and public explanations without private notes, reporter identity, raw diagnostics, or recovery evidence.
- Privacy-safe public projections — default public output must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw diagnostics, tokens, DB details, host paths, package paths, provider proof strings, private runtime internals, dispute internals, recovery payloads, and operator-only governance details.
- End-to-end proof — entry -> counted MatchSet -> execution -> result -> standings -> replay, plus negative eligibility, degraded/non-counted/disputed/invalidated, privacy, boundary, and board realism cases.

**Should have (competitive differentiators):**

- Evidence-first counted standings — every included/excluded ledger row explains why it counts or does not count and links to public result/replay evidence.
- Provider-proof-aware entry UX — Strategy authors see public-safe eligibility categories, not raw diagnostics.
- Public-safe governance trail — transparency through coarse public status, reason, explanation, timestamp where safe, and standings impact.
- Chronicle-centered trust — public results point to deterministic replay evidence instead of opaque adjudication.
- Same-user/self-play separation — useful exhibition learning workflows continue without contaminating trial standings.

**Defer (v2+ or later milestone):**

- Durable permanent ratings, Elo/Glicko/TrueSkill/MMR, rating refunds, and all-time rankings.
- Formal tournaments, prizes, public sanction histories, broad spectator/community features, and tournament legal/governance operations.
- Full moderation console, automated abuse detection, appeals operation, SLAs, and public enforcement history.
- Full account ownership transfer/recovery product.
- Package ecosystem support, TinyGo production support, ABI migration to direct exports or Component Model/WIT, production sandbox certification, and any new runtime ownership.
- Game-rule changes.

External comparison sources in `FEATURES.md` support these conclusions only as secondary context: mature competition platforms distinguish provisional versus final standings, publish fair-play expectations, constrain appeals/reports, and communicate reset/ranking policies. The roadmap should remain primarily grounded in local Coward's Game specs and shipped milestones.

### Architecture Approach

v1.36 should integrate as a competition policy and governance layer around the existing Go-owned MatchSet lifecycle. The architectural center should be a versioned Competition Policy Service described in `@cowards/spec` and owned by Go for normal product behavior. It should consume immutable Strategy Revision/provider-proof state from v1.35, snapshot entrants, classify MatchSets into counted/non-counted/degraded/disputed/invalidated states, recompute standings from canonical evidence plus governance events, and publish redacted public projections. TypeScript persistence helpers remain useful parity/test/rollback references, but public beta claims should be proven through Go-owned service-backed flows.

**Major components:**

1. `@cowards/spec` — versioned competition policy, entry eligibility, counted-state, public governance, standings snapshot, dispute/abuse/recovery expectation, and privacy DTO schemas.
2. Go backend — season lifecycle, entry gates, one-active-revision enforcement, MatchSet orchestration/status refresh, standings recomputation, governance writes, audit events, and public projections.
3. Runtime-service / Runtime Broker / providers — provider validation/build/proof and Strategy execution only; no standings, governance, account recovery, or public policy ownership.
4. Pure engine and Chronicle — deterministic rules and replay reconstruction only; no season, account, governance, ratings, or abuse concepts.
5. PostgreSQL / persistence — immutable revision snapshots, season entries, MatchSets, Matches, Chronicles, scoring snapshots, counted-state overrides, result flags, and audit events.
6. Web UI — public-safe policy/trust explanations and signed-in entry/report forms; no scoring truth, game rules, or Strategy execution.
7. Boundary monitors and proof scripts — enforce no runtime creep, no public overclaims, no private leaks, recomputable standings, and replay board realism.

Key patterns to follow are policy-backed public DTOs, system classifier plus governance override, snapshot entrants, recompute standings, and split private decision evidence from public trust evidence.

### Critical Pitfalls

1. **Public beta copy implies durable ratings or mature governance** — lock a posture contract and forbidden-claim list before UI work; require resettable/trial/no durable rating language everywhere standings are shown.
2. **Counted entry uses stale or partial v1.35 evidence** — gate counted entry on current immutable provider-proof/readiness/provenance/package/account metadata, not Workshop display state or local checker labels.
3. **Exhibition/self-play rules blur into trial standings** — keep same-user and multi-revision play labeled as exhibition/study evidence, while counted trial seasons enforce one active revision per user and exclude same-user/self-play results.
4. **Degraded, failed, disputed, or invalidated results pollute standings** — define an explicit counted-state lattice and recompute standings only from complete replay-backed counted MatchSets.
5. **Public governance output leaks private internals** — separate private audit/operator evidence from public status, reason, explanation, timestamp, standings impact, and replay availability.
6. **Dispute/recovery UX overpromises operations** — add expectation surfaces and minimal private-safe flows only; do not promise appeals, guaranteed recovery, staffed moderation, or rating repair.
7. **Competition maturity changes rules or moves runtime boundaries** — treat engine rules, Chronicle grammar, runtime-service/provider ownership, package mode `none`, and TinyGo hidden/spike-only status as locked unless a future approved milestone changes them.
8. **Policy proof skips replay realism** — final proof must still validate in-bounds Soldier/terrain positions, canonical starts, STONE/FALLEN rendering semantics, and plausible public replay pages.

## Implications for Roadmap

Based on research, suggested phase structure continuing after Phase 248:

### Phase 249: Competition Surface Inventory and Policy Lock

**Rationale:** v1.36 touches many existing surfaces; locking vocabulary and authority first prevents copy, entry, standings, governance, and proof drift.  
**Delivers:** surface inventory, public/private data classification, policy owner map, `competition-policy-v1.36` posture contract, forbidden-claim list, and initial monitor updates.  
**Addresses:** posture inventory, public beta decision, resettable/no-durable-rating promise, privacy exclusions, proof requirements.  
**Avoids:** public beta overclaim, game-rule drift, runtime claim creep, hidden private outputs.

### Phase 250: Counted Entry and One-Active-Revision Enforcement

**Rationale:** Entry eligibility is the gate that protects all later standings and governance work. It must consume v1.35 provider-proof/readiness/package evidence before scheduling or result aggregation matures.  
**Delivers:** canonical entry eligibility decision, public-safe failure categories, one active Strategy Revision per Player per Season, next-season-only replacement, same-user counted restrictions, exhibition labels, Go/spec/persistence parity tests.  
**Addresses:** strict counted eligibility, one-entry rule, exhibition versus trial ladder separation, immutable lock clarity.  
**Avoids:** stale proof acceptance, hidden TinyGo/package bypass, unsupported provider entry, owner mismatch, same-user standings manipulation.

### Phase 251: Season Lifecycle and Scheduling Policy

**Rationale:** Once eligible entries are defined, seasons need explicit lifecycle, freeze, scheduling, archive, and reset semantics.  
**Delivers:** draft/open/scheduling/active/completed/archived behavior, season policy DTOs, deterministic scheduling audit events, resettable archive semantics, historical link stability.  
**Addresses:** versioned season rules, standings reset policy, no-permanent-rating copy, no mid-season mutation.  
**Avoids:** entering closed seasons, mutating entrants after scheduling, cross-season contamination, stale public rank context.

### Phase 252: Counted-State Classifier and Standings Recompute

**Rationale:** Standings cannot be trusted until every MatchSet has a public-safe counted state and standings derive from canonical evidence.  
**Delivers:** counted-state projection enum, public reasons/explanations, replay-backed evidence checks, degraded/non-counted/disputed/invalidated exclusion, deterministic tie-breakers, recompute service, optional materialized snapshot with input hash, unit/property-style recomputation tests.  
**Addresses:** counted taxonomy, recomputable standings, degraded result behavior, evidence-first ledger rows.  
**Avoids:** UI-owned scoring, cached mutable rank truth, counted system failures, unexplained exclusions.

### Phase 253: Governance, Dispute, Abuse, and Recovery Surfaces

**Rationale:** Governance transitions need the counted-state model so report/review/invalidated decisions have deterministic standings effects and public-safe explanations.  
**Delivers:** entrant/admin flagging, review hold, admin resolution to counted/non-counted/non-competitive/invalidated, private notes plus public explanation split, audit event standardization, fair-play policy, limited account recovery expectation copy.  
**Addresses:** dispute/report entry points, admin governance decisions, abuse policy surface, recovery expectations, public-safe governance trail.  
**Avoids:** public accusation labels, operator/private leak, hidden eligibility penalties, unsupported moderation/recovery promises.

### Phase 254: Public Trust UX Projections

**Rationale:** UI should render already-stable public DTOs rather than inventing policy or scoring semantics in React.  
**Delivers:** competition index/detail, season, standings, result, replay, player, Strategy, entry, report/policy pages updated with posture, counted status, public explanation, replay evidence, privacy exclusions, provider/readiness labels, and trial/no-durable-rating copy.  
**Addresses:** public trust UX, Strategy/player public history, public privacy exclusions, external-facing policy clarity.  
**Avoids:** contradictory copy, public raw diagnostics, private Strategy/source/memory/objective leaks, discovery-equivalent treatment for non-counted exhibitions.

### Phase 255: Service-Backed E2E Proof and Boundary Monitors

**Rationale:** v1.36 should close only when the full public beta trust path is proven through service-backed behavior, negative cases, privacy scans, monitors, and replay realism.  
**Delivers:** v1.36 evaluator artifacts, Playwright service-backed counted-flow proof, negative eligibility matrix, counted-state/governance matrix, standings recomputation proof, privacy scans across public outputs and proof artifacts, copy monitors, no-runtime-creep monitors, board realism checks.  
**Addresses:** final verification, boundary monitors, public copy posture, public result/replay proof.  
**Avoids:** fixture-only completion, proof artifact leaks, strategy execution in web/API/Go, Node `vm` misuse, package/TinyGo/sandbox overclaims, visually broken replay evidence.

### Phase Ordering Rationale

- Policy lock must come first because every later phase needs the same vocabulary for public beta, resettable seasons, counted state, privacy exclusions, and forbidden claims.
- Entry and one-active-revision rules come before season scheduling and standings because invalid entrants poison every downstream result.
- Season lifecycle comes before standings recompute because standings need stable season windows, entrant freezes, schedule linkage, and archive semantics.
- Counted-state classification and recomputation must precede dispute/governance UX because review/invalidated/non-counted decisions need deterministic standings impact.
- Public UX comes after DTOs and services are stable so React renders authoritative projections instead of owning scoring or policy.
- Final proof comes last but should be seeded throughout; privacy, boundary, copy, and replay realism checks are acceptance criteria for every phase.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 250:** Confirm exact existing v1.35 provider-proof/readiness/package fields and Go/persistence parity points before implementing the canonical eligibility decision.
- **Phase 252:** Decide whether storage enum names migrate or v1.36 adds a projection enum first. Recommendation: projection enum first.
- **Phase 253:** Clarify product scope for dispute, abuse, and account recovery. Recommendation: minimal public-safe expectation surfaces plus result flag/admin resolution, not a broad moderation or recovery product.
- **Phase 255:** Confirm service-backed topology and proof cost before locking the Playwright matrix; keep at least one real counted happy path and use fixtures only for rare governance branches.

Phases with standard patterns where `$gsd-research-phase` is probably unnecessary:

- **Phase 249:** Well-researched inventory and posture lock based on current local files.
- **Phase 251:** Standard lifecycle and scheduling policy work using existing season/entry/MatchSet patterns.
- **Phase 254:** Public projection rendering and copy/snapshot work once DTOs are stable.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on repo-local stack, versions, packages, service boundaries, migrations, and shipped v1.35 mechanisms. No new dependencies needed. |
| Features | HIGH | Table stakes are directly grounded in `.planning/PROJECT.md`, `.planning/STATE.md`, shipped v1.35 evidence, primary specs, and existing competition/ladder/governance surfaces. External comparisons are secondary only. |
| Architecture | HIGH | Ownership boundaries are repeatedly established: Go owns normal backend orchestration, runtime-service owns hostile Strategy handling, spec owns contracts, engine/Chronicle stay pure, public projections stay redacted. |
| Pitfalls | HIGH | Major risks align across STACK, FEATURES, ARCHITECTURE, PITFALLS, project constraints, and prior milestone audits. |

**Overall confidence:** HIGH

### Gaps to Address

- Exact enum/storage naming for counted states: choose projection enum first unless a requirements phase explicitly justifies data migration.
- Admin/governance UI scope: keep minimal admin resolution and audit proof unless requirements expand it.
- Account recovery depth: publish expectation surfaces only unless separately scoped; do not collect or expose sensitive recovery payloads by default.
- Standings materialization: implement pure recompute first; add materialized snapshot only if performance or public read shape requires it.
- Fixture versus service-backed proof balance: service-back at least one full counted flow; use fixture-backed states only for rare/expensive governance branches.
- External policy copy: fair-play/reporting language should be conservative and product-specific, not copied from external platforms or used to imply mature enforcement.

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` — v1.36 stack additions, contracts, proof harnesses, boundary monitors, and code areas to touch.
- `.planning/research/FEATURES.md` — table-stakes features, differentiators, anti-features, requirement candidate categories, and MVP recommendation.
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flows, contracts, recomputation semantics, build order, and anti-patterns.
- `.planning/research/PITFALLS.md` — critical/moderate/minor pitfalls, phase warnings, and validation targets.
- `.planning/PROJECT.md` — active v1.36 goal, hard boundaries, shipped v1.35 baseline, constraints, and deferred items.
- `.planning/STATE.md` — active planning status, phase numbering after Phase 248, current decisions, blockers, and deferred durable rating/moderation/recovery/runtime/package/TinyGo/ABI items.
- `.planning/MILESTONES.md` — shipped milestone history and carried-forward competition/runtime constraints cited by research files.
- `.planning/milestones/v1.35-REQUIREMENTS.md` and `.planning/milestones/v1.35-ROADMAP.md` — provider-proof, sandbox-readiness, package-policy, privacy, and monitor baseline cited by research files.
- `CowardsGameSpec_Full_Consolidated_v1.md` — deterministic Match/Set rules, Strategy Revision immutability, Chronicle, memory privacy, runtime constraints, and canonical terminology.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — pure engine, runtime isolation, MatchSet scoring, replay visibility, persistence, and testing strategy.
- `packages/spec/src/competition.ts`, `public-discovery.ts`, `public-output-privacy.ts` — current public competition/discovery/privacy contracts cited by research.
- `packages/persistence/src/competition.ts`, `ladder.ts`, `governance.ts`, `scoring.ts`, `matchset-status.ts` and `packages/persistence/migrations/0004_competition_trust_beta.sql` — current exhibition, ladder, governance, scoring, status, and schema mechanisms cited by research.
- `apps/go-backend/provider_readiness.go`, `matchset_status.go`, `scoring.go`, `live_backend.go` — Go provider/readiness/status/scoring/public-read ownership areas cited by research.

### Secondary (MEDIUM confidence)

- Codeforces Contest Rules — comparison context for registration, monitoring/disqualification, unofficial intermediate standings, and final standings.
- Kaggle Competitions Documentation and Community Guidelines — comparison context for public/private leaderboard and conduct patterns.
- Chess.com Fair Play Policy and Lichess Fair Play/Appeal pages — comparison context for fair-play categories, reporting, and appeal constraints.
- Google Account Help compromised-account recovery — comparison context for conservative recovery/security expectations.
- League of Legends ranked update — comparison context for reset/ranking communication as a mature ranked-system concern.

---
*Research completed: 2026-06-15*  
*Ready for roadmap: yes*
