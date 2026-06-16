# Phase 250: Counted Entry and One-Active-Revision Enforcement - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 250 makes counted trial competition entry consume current v1.35 provider-proof, provenance, runtime-readiness, engine-compatibility, package-policy, account-ownership, and immutability evidence. It also enforces one active Strategy Revision entry per Player per counted Season and keeps exhibition workflows explicitly separated from counted standings.

This phase should harden the counted entry decision, API responses, persistence constraints, and signed-in entry projection. It should not change deterministic game rules, runtime ownership, Season scheduling policy, standings recomputation, governance/dispute workflows, public player/Strategy trust pages, or final service-backed E2E proof beyond focused tests for the entry path.
</domain>

<decisions>
## Implementation Decisions

### Scope
- **D-01:** Cover the full Phase 250 decision space, not a narrow MVP. The approved scope includes stale artifacts, missing or mismatched provider proof, unsupported providers, hidden TinyGo, invalid provenance, unavailable runtime lanes, owner mismatch, mutable drafts, non-`none` package modes, one-active-entry rules, mid-season replacement blocking, and exhibition separation.
- **D-02:** Reuse existing v1.35 evidence and readiness semantics. Phase 250 must consume current provider-proof/runtime/provenance/package/engine compatibility signals instead of inventing broader runtime or sandbox claims.
- **D-03:** Keep Strategy execution behind runtime-service / Runtime Broker / provider boundaries. No Strategy execution belongs in web, API route handlers, Go backend request handlers, or Phase 250 proof scripts.

### Counted Entry Policy
- **D-04:** Counted trial entry requires an immutable account-owned Strategy Revision with valid validation status, current provider proof, matching source/provenance artifacts, supported production language/provider lane, current ABI/runtime metadata, package mode `none`, no required capabilities, and compatible engine metadata.
- **D-05:** TinyGo remains hidden and unsupported for counted competition. Any TinyGo source format or runtime language is rejected with a public-safe unsupported-provider category.
- **D-06:** TypeScript and Python remain provider-proven source-language lanes; Rust and Zig remain provider-proven WASM/WASI Preview 1 artifact-backed lanes. None of these decisions imply production sandbox certification.
- **D-07:** Counted entry rejection must return stable, coarse eligibility categories plus remediation-oriented public copy. It must not expose Strategy source, artifact bytes, raw diagnostics, host paths, env values, package paths, tokens, database details, provider signing material, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, or operator-only data.

### One Active Revision
- **D-08:** A Player may have only one active counted Strategy Revision entry per counted Season.
- **D-09:** Counted mid-season replacement is blocked. Replacement belongs to a future Season or a non-counted/exhibition path.
- **D-10:** Withdrawn or invalidated entries remain historical Season evidence and should not silently permit standings-affecting replacement inside the same Season.
- **D-11:** The database should enforce the one-active-entry invariant where practical, and persistence should also return a public-safe category before callers see low-level constraint details.

### Exhibition Separation
- **D-12:** Exhibition MatchSets remain permissive for explicitly labeled same-user, self-play, and multi-revision workflows when they are non-counted or otherwise cannot affect counted trial standings.
- **D-13:** Counted trial entry must not admit same-user multi-revision or self-play tricks that create more than one active revision for the same Player in the same Season.
- **D-14:** Existing exhibition UI may keep using runtime semantics for helpful labels, but counted ladder entry truth belongs in persistence/spec-owned eligibility logic and public-safe API projections.

### the agent's Discretion
The planner may choose exact helper names, error category enum names, migration shape, route response shape, tests, and whether to factor shared eligibility utilities in `@cowards/spec` or persistence. Prefer the smallest shared contract that keeps public categories stable and avoids duplicating fragile provider-proof logic.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and Milestone Scope
- `.planning/PROJECT.md` - v1.36 milestone intent, hard boundaries, shipped baseline, and deferred items.
- `.planning/REQUIREMENTS.md` - ELIG-01 through ELIG-06 requirements.
- `.planning/ROADMAP.md` - Phase 250 goal, success criteria, dependency on Phase 249, and downstream boundaries.
- `.planning/STATE.md` - Active milestone state and current Phase 250 pointer.
- `.planning/research/SUMMARY.md` - v1.36 research synthesis and architecture guidance.
- `.planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md` - Policy posture and public trust decisions consumed by Phase 250.
- `.planning/artifacts/v1.36-competition-surface-inventory.md` - Phase 250-owned rows: `competition-entry-route`, `competition-persistence-entry`, and `go-provider-readiness`.

### Baseline Evidence
- `.planning/milestones/v1.35-phases/244-account-revision-provider-proof-and-entry-gates/244-CONTEXT.md` - Provider-proof and entry gate baseline.
- `.planning/artifacts/v1.35-boundary-surface-inventory.md` - Archived boundary inventory that v1.36 consumes as baseline evidence.
- `scripts/evaluate-v1-35-account-provider-entry-proof.ts` - v1.35 account/provider proof evaluator.

### Entry, Runtime, and Persistence Code
- `packages/spec/src/runtime.ts` - Runtime metadata, counted-play eligibility, ABI, package-policy, and language semantics.
- `packages/spec/src/competition.ts` - Competition and trial ladder DTOs, entrant snapshots, statuses, and public scoring vocabulary.
- `packages/spec/src/public-discovery.ts` - Signed-in competition entry dashboard DTO and private-field exclusions.
- `packages/persistence/src/ladder.ts` - Current trial ladder entry, provider-proof validation, scheduling snapshots, and active entry behavior.
- `packages/persistence/src/competition.ts` - Exhibition entry helpers and provider-proof validation precedent.
- `packages/persistence/migrations/0004_competition_trust_beta.sql` - Trial ladder tables and current uniqueness constraints.
- `apps/go-backend/provider_readiness.go` - Go readiness classifier and public eligibility categories.
- `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts` - Trial ladder entry API route.
- `apps/web/app/competitive/server.ts` - Web competitive server wrapper and persistence error mapping.
- `apps/web/lib/public-discovery-service.ts` - Signed-in competition entry dashboard projection.
- `apps/web/app/competitions/[competitionId]/enter/page.tsx` - Signed-in entry route surface.
- `apps/web/app/exhibitions/new/exhibition-client.tsx` and `apps/web/app/api/exhibitions/route.ts` - Exhibition creation surface that must remain clearly separated from counted trial competition.

### Specs and Boundaries
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical terminology, Player/Strategy Revision/Chronicle model, ranked Set lock behavior, replay/privacy expectations, and no game-rule-change baseline.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Pure engine, runtime isolation, MatchSet scoring, replay, validation, and no Strategy execution in web/API/Go.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/persistence/src/ladder.ts` already has `assertLadderEligibleRuntime`, provider-proof matching helpers, Season-open checks, active entry snapshots, and `enterTrialLadderSeason`.
- `packages/persistence/src/competition.ts` has equivalent exhibition runtime proof helpers, duplicate/rate-limit behavior, and manual exhibition MatchSet creation.
- `apps/go-backend/provider_readiness.go` already classifies runtime-service unavailable, TinyGo, unsupported source format, incompatible metadata, invalid revision, package policy violation, missing provider proof, mismatched provider proof, and provider-validated success.
- `apps/web/lib/public-discovery-service.ts` already projects signed-in entry dashboard revision labels and runtime counted-play semantics without source exposure.
- `trial_ladder_entries` currently has a unique `(season_id, strategy_revision_id)` constraint but does not yet enforce one active entry per owner per Season.

### Gaps to Close
- Counted ladder entry currently blocks non-open Seasons and owner mismatch, but public errors are message-shaped rather than category-shaped.
- Counted ladder entry locks the Strategy Revision after insertion; the eligibility decision should treat mutable drafts as ineligible before entry succeeds.
- Provider-proof failures are public-safe, but they are not yet normalized into stable categories/remediation copy for API/UI use.
- The database does not yet enforce one active counted entry per owner per Season.
- Withdrawal currently sets active entries to withdrawn, so Phase 250 must decide replacement policy explicitly and prevent withdrawn historical entries from becoming a mid-season replacement loophole.
- Exhibition entry UI remains exhibition-shaped and should not imply counted trial standings participation.

### Integration Points
- Shared public eligibility categories can live in `@cowards/spec` if they are needed by persistence, web, tests, and future UI phases.
- Persistence should own truth for counted entry and convert low-level validation/provider/database failures into public-safe categories.
- Web/API should return stable public-safe fields and status codes, not private runtime/provider internals or raw database constraint messages.
- Go readiness categories should stay aligned with the TypeScript persistence categories where they describe the same public state.
</code_context>

<specifics>
## Specific Ideas

- Add a `CountedEntryEligibilityCategory`/policy contract in spec for stable public categories and remediation copy.
- Add a persistence-level counted-entry eligibility evaluator that returns `{ ok, category, publicMessage, remediation }` before throwing.
- Add a migration/constraint/index to prevent more than one active or historical counted Season entry by owner, depending on replacement policy.
- Add tests for valid TypeScript/Python/Rust/Zig proof, missing/mismatched/stale proof, TinyGo, package mode, invalid revision, owner mismatch, unavailable runtime lane, duplicate owner Season entry, and withdrawn replacement attempts.
- Keep exhibition same-user/self-play/multi-revision behavior in exhibition tests and copy as non-counted or standings-isolated.
</specifics>

<deferred>
## Deferred Ideas

- Season lifecycle/status window copy belongs to Phase 251.
- Counted-state classifier and standings recomputation belong to Phase 252.
- Governance/dispute/abuse/recovery mutation and public projections belong to Phase 253.
- Broad public UX rendering across standings/result/replay/player/Strategy pages belongs to Phase 254.
- Full service-backed E2E proof and replay realism belong to Phase 255.
</deferred>

---

*Phase: 250-Counted Entry and One-Active-Revision Enforcement*
*Context gathered: 2026-06-16*
