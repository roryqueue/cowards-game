# Phase 249: Competition Surface Inventory and Policy Lock - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 249 locks the v1.36 competition posture, vocabulary, authority, inventory shape, privacy exclusions, and forbidden-claim guardrails before later phases change counted entry, Season lifecycle, standings recomputation, governance, public UX, or final proof.

This phase should create the authoritative v1.36 route/code/artifact inventory, define `competition-policy-v1.36` as a spec-owned policy vocabulary and public-label contract, and add initial fail-loud monitors for clear posture/copy/privacy violations. It should not implement Phase 250 entry gates, Phase 251 scheduling/lifecycle behavior, Phase 252 standings recomputation, Phase 253 dispute/governance workflows, Phase 254 page redesigns, or Phase 255 service-backed E2E proof.

</domain>

<decisions>
## Implementation Decisions

### Public Posture Copy
- **D-01:** Public posture copy should be prominent and plain, not hidden in help text and not styled like a scary warning. It should appear near standings, entry, result, replay, player, Strategy, and other competition trust surfaces where counted or trial evidence appears.
- **D-02:** The default phrase is **public beta trial competition**. Nearby copy must explain resettable Season-scoped standings and no durable permanent rating promise.
- **D-03:** The no-durable-rating/reset language belongs on every competition trust surface, not only entry or standings.
- **D-04:** Completed and archived Seasons must still carry the trial/resettable/no durable rating label so historical evidence never reads like permanent official rating truth.

### Inventory Granularity
- **D-05:** Phase 249 should produce a route/code/artifact inventory modeled after v1.35 Phase 243, not only a broad owner/risk matrix.
- **D-06:** Inventory surfaces include everything that can affect public trust: routes, DTOs, pages, persistence modules, Go paths, UI copy, docs, monitors, proof scripts, proof artifacts, tests, fixtures, and relevant snapshots.
- **D-07:** Every inventory row should have one downstream disposition: `lock-now`, `fix-in-250`, `fix-in-251`, `fix-in-252`, `fix-in-253`, `fix-in-254`, `prove-in-255`, or `future/defer`.
- **D-08:** Phase 249 should write both a Markdown inventory for humans and a JSON inventory for monitors/proof tooling.

### Policy Contract Shape
- **D-09:** `competition-policy-v1.36` should be a spec-owned schema/constants contract in `@cowards/spec` that downstream monitors and UI can consume.
- **D-10:** Phase 249 should lock policy vocabulary and public labels: posture, resettable Season semantics, no durable rating promise, counted-state public projection vocabulary, privacy exclusions, and forbidden-claim categories/examples.
- **D-11:** Counted-state work in Phase 249 is public projection vocabulary only. Exact persistence enum names and storage/internal mappings belong to Phase 252 unless a later plan proves they must be introduced earlier.
- **D-12:** Forbidden claims should be represented as both categories and examples so monitors can reason by category while humans have concrete examples to avoid.

### Forbidden Claims Monitor
- **D-13:** Phase 249 should add a broad copy/privacy scan, not only a narrow keyword guard or a contract-existence test.
- **D-14:** The monitor should fail loud for clear violations in Phase 249, with explicit handling for documented false positives.
- **D-15:** The default scan scope should include `.planning`, `packages`, `apps`, `scripts`, and relevant fixtures/snapshots where text appears.
- **D-16:** The monitor should check both presence and absence: required public beta trial/no durable rating/resettable posture labels where the inventory says they must appear, and forbidden claims/private markers absent.

### the agent's Discretion
The planner may choose exact filenames, table columns, JSON schema details, monitor helper names, and test grouping. Preserve the decisions above, prefer existing v1.35 inventory/proof/monitor patterns, and avoid adding broad public DTO or persistence enum designs before later phases own those behaviors.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase and Milestone Scope
- `.planning/PROJECT.md` - v1.36 milestone intent, target features, hard boundaries, current shipped baseline, and deferred items.
- `.planning/REQUIREMENTS.md` - POST-01 through POST-05 requirements and full v1.36 requirement boundaries.
- `.planning/ROADMAP.md` - Phase 249 goal, success criteria, dependency on v1.35, and downstream phase boundaries.
- `.planning/STATE.md` - Active milestone state and current Phase 249 pointer.
- `.planning/research/SUMMARY.md` - v1.36 research synthesis, suggested phase structure, risks, and architecture guidance.

### Prior Phase Context
- `.planning/milestones/v1.35-phases/243-boundary-surface-inventory-and-contract-lock/243-CONTEXT.md` - Closest inventory precedent: route/code/artifact inventory, disposition taxonomy, privacy/claim calibration, and handoff boundaries.
- `.planning/milestones/v1.35-phases/244-account-revision-provider-proof-and-entry-gates/244-CONTEXT.md` - Provider-proof and entry gate baseline that v1.36 counted-entry policy consumes.

### Canonical Specs
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical terminology, Player/Strategy Revision/Chronicle model, ranked Set lock behavior, replay/privacy expectations, and no game-rule-change baseline.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Pure engine, runtime isolation, MatchSet scoring, replay, validation, and no Strategy execution in web/API/Go.

### Existing Competition and Privacy Contracts
- `packages/spec/src/competition.ts` - Existing competition, trial ladder, counted-status, standings, entrant snapshot, Strategy card, and public ladder DTO vocabulary.
- `packages/spec/src/public-discovery.ts` - Public discovery boundary, private fields excluded, competition/player/Strategy/result card schemas, and public-safe href patterns.
- `packages/spec/src/public-output-privacy.ts` - Public-output privacy guardrails and leak checks.
- `packages/persistence/src/ladder.ts` - Current trial ladder policy, entry eligibility, provider-proof checks, season DTO building, and scheduling behavior.
- `packages/persistence/src/competition.ts` - Exhibition/competition entry and MatchSet creation patterns.
- `packages/persistence/src/governance.ts` - Current governance/status marking surface.
- `packages/persistence/src/scoring.ts` and `packages/persistence/src/matchset-status.ts` - Existing scoring/status refresh inputs that later standing phases consume.

### Go, UI, and Proof Baselines
- `apps/go-backend/provider_readiness.go` - Go provider/readiness evidence that v1.36 eligibility policy consumes.
- `apps/go-backend/matchset_status.go` and `apps/go-backend/scoring.go` - Go-owned status/scoring behavior relevant to inventory and later standings work.
- `apps/web/app/competitions/page.tsx`, `apps/web/app/competitions/[competitionId]/page.tsx`, and `apps/web/app/competitions/[competitionId]/enter/page.tsx` - Public competition and entry surfaces that must carry posture labels.
- `apps/web/app/ladder/[seasonId]/page.tsx` - Trial ladder/Season page surface for posture and standings evidence.
- `apps/web/app/players/[handle]/page.tsx` and `apps/web/app/strategies/[strategyId]/page.tsx` - Public player/Strategy pages that must distinguish counted trial evidence from exhibition/study evidence.
- `apps/web/app/matches/[matchId]/replay/page.tsx` and `apps/web/app/matchsets/result-view-model.ts` - Replay/result trust surfaces that must remain private-data safe.
- `scripts/evaluate-v1-35-boundary-surface-inventory.ts` and `scripts/evaluate-v1-35-final-proof.ts` - Prior inventory/proof evaluator style to reuse.
- `scripts/check-boundary-monitors.ts` - Existing monitor hub for adding v1.36 copy/privacy checks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/spec/src/competition.ts` already has trial ladder status, entry status, counted status, non-counted reason, trial ladder policy, public Season DTO, public MatchSet summary, public player profile, public Strategy card, and scoring policy types that can anchor the new policy vocabulary.
- `packages/spec/src/public-discovery.ts` already defines public discovery boundaries and private fields excluded. It is a natural reference for v1.36 privacy exclusions and public competition projections.
- `packages/persistence/src/ladder.ts` already enforces provider-proof-aware ladder eligibility for TypeScript, Python, Rust, and Zig and builds public ladder Season DTOs.
- `apps/go-backend/provider_readiness.go`, `matchset_status.go`, and `scoring.go` represent Go-owned backend paths that the inventory should classify for downstream phases.
- `scripts/evaluate-v1-35-boundary-surface-inventory.ts` and related v1.35 proof scripts provide an established pattern for Markdown/JSON inventory and monitor-friendly artifacts.
- `scripts/check-boundary-monitors.ts` is the existing entry point for drift monitors and should be extended rather than replaced.

### Established Patterns
- Spec-owned contracts define vocabulary and public-safe DTO semantics before web/UI renders them.
- Go owns normal backend orchestration, MatchSet status/scoring refresh, and selected public evidence while runtime-service / Runtime Broker / providers own hostile Strategy validation/build/execution.
- Public/default outputs expose coarse labels, hashes, counts, links, and public explanations, not Strategy source, private memories, objectives, raw diagnostics, artifacts, host paths, env values, tokens, DB details, provider secrets, private runtime internals, dispute internals, recovery payloads, or operator-only details.
- Recent milestone inventories use a human-readable artifact plus machine-readable JSON and phase-directed dispositions to keep later phases from rediscovering scope.

### Integration Points
- Policy vocabulary should live in `@cowards/spec` and be consumed by web, persistence, Go-compatible generated artifacts where applicable, proof scripts, and boundary monitors.
- Inventory rows should connect public routes/pages, spec DTOs, persistence services, Go backend paths, proof artifacts, and tests to the downstream phase that owns any required change.
- Required posture labels should eventually flow through public competition, entry, Season, standings, result, replay, player, and Strategy surfaces.
- Forbidden-claim and privacy monitors should scan text-bearing files in `.planning`, `packages`, `apps`, `scripts`, and relevant fixture/snapshot locations.

</code_context>

<specifics>
## Specific Ideas

- Use **public beta trial competition** as the default product phrase.
- Use explicit downstream dispositions: `lock-now`, `fix-in-250`, `fix-in-251`, `fix-in-252`, `fix-in-253`, `fix-in-254`, `prove-in-255`, `future/defer`.
- Keep Phase 249 counted-state work at public projection vocabulary level; Phase 252 owns final storage/internal mapping.
- Monitor false positives may be allowed only when documented explicitly.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 249 scope.

</deferred>

---

*Phase: 249-Competition Surface Inventory and Policy Lock*
*Context gathered: 2026-06-15*
