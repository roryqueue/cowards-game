# Phase 101: Public Evidence Delivery and Web Cutover - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 101 cuts selected normal web/product workflows over to Go-owned contracts after Go owns job lifecycle, runtime handoff, Match completion, Chronicle persistence, and MatchSet scoring. The selected surface is exhibition creation, public MatchSet summary/evidence, public replay metadata, and selected public replay evidence. TypeScript remains frontend plus explicitly labeled parity, rollback, test, runtime, or deferred surfaces.

This phase does not migrate every workshop/admin/debug route, owner-debug replay projection, ladder/admin/governance mutation flow, or production topology promotion gate. Those are either deferred or Phase 102 verification concerns.

</domain>

<decisions>
## Implementation Decisions

### Selected Normal Workflows

- **D-01:** Select exhibition creation, public MatchSet summary/evidence, public replay metadata, and selected public replay evidence as the normal v1.15 web workflows for Go ownership.
- **D-02:** Web calls Go-owned contracts for selected workflows when Go is selected.
- **D-03:** Go-selected failures fail closed with schema-validated public errors and must not silently fall through to TypeScript service or direct persistence.

### Replay Data Boundary

- **D-04:** The existing React replay UI may remain the rendering surface.
- **D-05:** Normal replay data access should move behind Go-owned public/evidence contracts instead of direct `@cowards/persistence` Chronicle reads.
- **D-06:** Full owner-debug replay projection remains outside normal public flow and should be labeled deferred or explicitly owner/debug-only where still present.

### TypeScript Surface Labels

- **D-07:** Remaining TypeScript service/web surfaces in product paths must be explicitly labeled `frontend`, `parity_only`, `rollback_only`, `test_only`, `runtime_only`, or `deferred`.
- **D-08:** Workshop internals, owner-debug replay projection, ladder/admin/governance mutation surfaces, and test-support routes should be labeled `deferred` or `test_only` rather than treated as normal backend ownership.
- **D-09:** TypeScript service behavior remains a parity oracle where needed, not the future normal backend path.

### Public Evidence Shape

- **D-10:** Public evidence should be projected and source-safe by default.
- **D-11:** Raw Chronicle/private projection payloads must not be exposed by default.
- **D-12:** Owner-authorized or debug-only evidence must stay outside the normal public workflow and retain explicit labels.

### Privacy Checks

- **D-13:** Privacy checks should cover public, account, workshop, replay, and evidence outputs.
- **D-14:** Public/service/Go/topology/monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

### the agent's Discretion

The agent may choose exact route names, DTO names, adapter structure, and cutover flags, provided selected normal workflows are Go-owned when selected, TypeScript surfaces are labeled, and privacy/no-fallback guarantees are enforced.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` — Current v1.15 milestone goal, non-goals, and active constraints.
- `.planning/REQUIREMENTS.md` — API-01 through API-06 and full v1.15 requirement vocabulary.
- `.planning/ROADMAP.md` — Phase 101 goal, dependencies, success criteria, and sequencing.
- `.planning/STATE.md` — Active milestone state and ownership warnings.
- `.planning/research/SUMMARY.md` — v1.15 research synthesis and recommended Go ownership flow.

### Prior Phase Inputs

- `.planning/phases/096-boundary-baseline-and-go-ownership-contract/096-CONTEXT.md` — Lifecycle ownership labels, no-fallback defaults, rollback semantics, and manifest vocabulary.
- `.planning/phases/097-go-job-lifecycle-and-persistence-contracts/097-CONTEXT.md` — Go lifecycle ownership and no mixed DB-owning workers.
- `.planning/phases/098-runtime-execution-service-boundary/098-CONTEXT.md` — Execution-only TypeScript runtime service boundary.
- `.planning/phases/099-go-match-completion-and-chronicle-persistence/099-CONTEXT.md` — Go completion and Chronicle public/private safety.
- `.planning/phases/100-go-matchset-scoring-and-failure-classification/100-CONTEXT.md` — Go scoring and public standings safety.

### Primary Specs

- `AGENTS.md` — Non-negotiables for deterministic engine boundaries, hostile Strategy isolation, terminology, and public-output privacy.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical game terminology and rules vocabulary.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Architecture boundary guidance.

</canonical_refs>

<code_context>
## Existing Code Insights

### Existing Go-Owned Public/Product Surfaces

- `apps/go-backend/live_backend.go`: Live Go routes already include public strategy/player/ladder/MatchSet/replay metadata reads, auth/session/account revision routes, account forks, and `POST /matchsets` exhibition creation.
- `apps/web/lib/public-service-adapter.ts`: Existing public read selection and no-fallback patterns via `COWARDS_GO_PUBLIC_READS`, `COWARDS_GO_PUBLIC_STRATEGY_READS`, `COWARDS_GO_BACKEND_OWNER`, and `COWARDS_GO_BACKEND_URL`.
- `apps/web/lib/account-service-adapter.ts`: Existing account/auth/exhibition Go-selection helpers and fail-closed URL requirements.
- `apps/web/lib/go-backend-service-client.ts`: Existing Go client schema validation for auth/account/fork/exhibition calls.

### Current Direct Persistence Offenses To Address Or Label

- `apps/web/app/matches/server.ts`: Current persisted Chronicle replay read path imports `@cowards/persistence` directly.
- `apps/web/app/workshop/server.ts`: Workshop internals still import persistence directly and should be deferred unless explicitly selected.
- `apps/web/app/competitive/server.ts` and related admin/ladder/governance routes: Broad competitive mutation backend remains outside selected Phase 101 cutover unless explicitly scoped.
- `apps/web/app/api/test-support/run-worker-once/route.ts`: Test support worker process route should remain `test_only`.

### Existing Monitor Inputs

- `scripts/check-service-boundary-imports.ts`: Strict/report-only web direct persistence monitor.
- `scripts/check-boundary-monitors.ts`: Boundary monitor entry point and privacy checks.
- `.planning/artifacts/v1.14-route-ownership-manifest.json`: Prior route ownership and no-fallback vocabulary.

</code_context>

<specifics>
## Specific Ideas

The phase should avoid a "migrate everything" trap. A good implementation plan will choose a concrete public/product path, make the selected web calls Go-owned, label everything else honestly, and prove the public outputs stay private-data safe.

</specifics>

<deferred>
## Deferred Ideas

- Full workshop internals migration.
- Owner-debug replay projection migration.
- Ladder/admin/governance mutation migration.
- Test-support routes as normal product surfaces.
- Topology monitors, rollback drills, and promotion gate — Phase 102.
- Production sandbox replacement and final TypeScript runtime retirement — v1.16 or later.

</deferred>

---

*Phase: 101-Public Evidence Delivery and Web Cutover*
*Context gathered: 2026-05-24*
