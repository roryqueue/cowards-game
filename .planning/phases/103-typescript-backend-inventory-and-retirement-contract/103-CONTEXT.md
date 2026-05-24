# Phase 103: TypeScript Backend Inventory and Retirement Contract - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 103 creates the v1.16 baseline for every remaining TypeScript backend-like surface before deletion, quarantine, relabeling, and monitor enforcement begins. It must produce a complete inventory and retirement contract covering Next.js API routes, TypeScript server modules, direct persistence imports, `@cowards/service` use, worker/job lifecycle paths, replay/public evidence paths, runtime service paths, frontend-only paths, test/parity/fixture/rollback paths, and deferred surfaces.

This phase does not migrate runtime execution, remove all retired paths, or implement strict topology gates. It defines the contract and source-of-truth artifacts that later phases will enforce.

</domain>

<decisions>
## Implementation Decisions

### Inventory Artifacts
- **D-01:** Produce both a machine-readable JSON manifest and a human-readable markdown matrix for the v1.16 TypeScript backend retirement inventory.
- **D-02:** Treat the JSON manifest as the future monitor/topology input surface; treat the markdown matrix as the human audit and planning review surface.
- **D-03:** Inventory coverage must include Next.js API routes, TypeScript server modules, direct persistence imports, `@cowards/service` normal runtime uses, worker/job lifecycle code, replay/public evidence code, test-support/parity-only paths, rollback-only paths, runtime-service paths, and frontend-only paths.

### Allowed TypeScript Roles
- **D-04:** Use a strict role taxonomy only: `frontend-only`, `runtime-service`, `runtime-adapter`, `parity-only`, `fixture-only`, `test-only`, `rollback-only`, `deferred`, `quarantined`, or `deleted`.
- **D-05:** Do not permit `typescript-backend`, vague `legacy`, or normal backend owner labels after v1.15.
- **D-06:** Every `deferred` and `rollback-only` entry must include an owner, reason, gate, risk, and future migration note.

### Retirement Action Policy
- **D-07:** Default to deleting unused TypeScript backend-like code when nothing in the milestone needs it.
- **D-08:** Quarantine code when it is still needed for rollback, parity, fixtures, or tests, and make the gate explicit.
- **D-09:** Relabel product surfaces only when they are intentionally deferred; avoid a generic keep-for-maybe category.

### Monitor Coupling
- **D-10:** Shape Phase 103 manifest fields so Phase 108 can consume them directly for `pnpm boundary:monitors` and `pnpm topology:check` no-TypeScript-backend enforcement.
- **D-11:** Phase 103 does not need to make every monitor strict yet, but it must design fields for ownership, allowed role, fallback policy, privacy risk, route/runtime linkage, and enforcement status.

### the agent's Discretion
The agent may choose the exact JSON schema field names, markdown grouping, scanner implementation, and artifact filenames, provided the artifacts are deterministic, reviewable, and easy for later monitor scripts to consume.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project And Milestone Baseline
- `.planning/PROJECT.md` - Active project state and v1.16 milestone goal.
- `.planning/REQUIREMENTS.md` - v1.16 requirements, especially BASE-01 through BASE-06.
- `.planning/ROADMAP.md` - Phase 103 boundary, dependencies, and success criteria.
- `.planning/STATE.md` - Current workflow state and v1.15/v1.16 continuity notes.
- `.planning/research/v1.16-SUMMARY.md` - Research inventory and recommended v1.16 phase structure.

### v1.15 Backend Ownership Baseline
- `.planning/milestones/v1.15-MILESTONE-AUDIT.md` - Completion audit for Go backend ownership baseline.
- `.planning/milestones/v1.15-ROADMAP.md` - Prior milestone scope and completed phase sequence.
- `.planning/milestones/v1.15-REQUIREMENTS.md` - Prior ownership and topology requirements.
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - Go lifecycle ownership baseline.
- `.planning/artifacts/v1.15-typescript-surface-labels.json` - Existing TypeScript surface label baseline.
- `.planning/artifacts/v1.15-live-web-go-runtime-topology.json` - v1.15 topology evidence.
- `.planning/artifacts/v1.15-failure-drills.json` - Fail-closed and no-fallback evidence.
- `.planning/artifacts/v1.15-promotion-decision.md` - Backend promotion state after v1.15.
- `.planning/artifacts/v1.15-boundary-baseline.md` - Boundary monitor baseline.

### Source Specs And Non-Negotiables
- `AGENTS.md` - Project non-negotiables for deterministic engine, hostile Strategy isolation, schema validation, privacy, and no Node `vm` security boundary.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical game terminology and deterministic rules.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - Architecture constraints and runtime/backend separation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-boundary-monitors.ts`: Existing boundary monitor implementation with v1.15 route, fallback, surface label, runtime ABI, topology, and privacy checks.
- `scripts/check-local-topology.ts`: Existing topology checker with strict v1.15 lifecycle checks and representative page-load smoke.
- `.planning/artifacts/v1.15-typescript-surface-labels.json`: Useful seed for the v1.16 inventory manifest, but must be updated to remove any normal TypeScript backend role.

### Established Patterns
- Existing artifacts use JSON for monitor-readable evidence and markdown for promotion/audit decisions.
- v1.15 already treats Go as owner for Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status refresh, selected exhibition creation, public MatchSet summary, public replay metadata, and selected public replay evidence.
- Runtime execution is already separated through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`; Phase 103 should classify this as runtime infrastructure, not backend ownership.

### Integration Points
- `apps/web/app/api/**/route.ts`, `apps/web/app/competitive/server.ts`, `apps/web/app/matches/server.ts`, and `apps/web/app/workshop/server.ts` are key web/API and server inventory roots.
- `packages/persistence/src/**`, `packages/service/src/index.ts`, and `apps/worker/src/**` are key TypeScript backend retirement roots.
- `apps/runtime-service/src/**` and `packages/runtime-js/src/**` are allowed runtime-service/runtime-adapter roots if they remain DB/job/API-free.

</code_context>

<specifics>
## Specific Ideas

The user confirmed that Phase 103 should lock the strict manifest-plus-matrix approach, strict TypeScript role taxonomy, delete/quarantine/relabel retirement defaults, and monitor-ready manifest fields. Similar future decisions can be assumed when they match this policy and the agent recommends the same path.

</specifics>

<deferred>
## Deferred Ideas

Implementing the future language-neutral Strategy Execution Service / Runtime Broker is out of scope for Phase 103 and v1.16, but the inventory should use names and fields that keep that future abstraction clear.

</deferred>

---

*Phase: 103-TypeScript Backend Inventory and Retirement Contract*
*Context gathered: 2026-05-24*
