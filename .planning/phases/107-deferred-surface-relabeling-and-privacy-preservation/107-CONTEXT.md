# Phase 107: Deferred Surface Relabeling and Privacy Preservation - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 107 labels and hardens every remaining TypeScript backend-like surface that was not removed, quarantined, or cut over in Phases 105 and 106. It should make deferred Workshop, ladder, governance, owner-debug, test-support, fixture, parity, rollback, and private-source paths explicit and privacy-safe rather than letting them look like accidental backend ownership.

This phase does not expand scope into migrating Workshop, governance, broader ladder mutation, or owner-debug replay unless a route was already selected by Phase 105. Its primary deliverable is clear labeling, gating, monitor readiness, and public-output privacy preservation.

</domain>

<decisions>
## Implementation Decisions

### Final Surface Label Artifact
- **D-01:** Produce or update a final TypeScript surface label artifact covering every remaining backend-like TypeScript path.
- **D-02:** Every entry must use the strict Phase 103 taxonomy and include owner, reason, risk, privacy class, gate, future migration note, and monitor status.
- **D-03:** The label artifact should be suitable for Phase 108 monitor enforcement.

### Deferred Product Surfaces
- **D-04:** Workshop validation, submission, save/source/test, analytics rerun/profile/export/runtime flows may remain only as explicit `deferred` surfaces unless migrated earlier.
- **D-05:** Broader ladder/admin/governance mutations may remain only as explicit `deferred` surfaces unless migrated earlier.
- **D-06:** Account source/private-source endpoints may remain only with explicit private/deferred labeling and authorization gates.

### Owner-Debug Replay
- **D-07:** Owner-debug replay may remain only as explicit private/deferred behavior with enablement and authorization gates.
- **D-08:** Owner-debug replay must not act as public evidence fallback.
- **D-09:** Public replay metadata/evidence must remain Go-owned when selected.

### Test-Support And Fixtures
- **D-10:** Test-support routes and fixture generators may remain only under `test-only` or `fixture-only` gates.
- **D-11:** Tests or monitors should assert these paths cannot serve normal product traffic.

### Privacy Guard Floor
- **D-12:** All remaining deferred, rollback, parity, test, and fixture surfaces must preserve public-output privacy by default.
- **D-13:** Public/default output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw Awareness Grid, stack/stderr, session/token, DB DSN, host path, or private runtime internals.

### Scope Control
- **D-14:** Phase 107 should label and harden what remains.
- **D-15:** It should not migrate Workshop, governance, broader ladder mutation, or owner-debug replay by accident unless those paths were already selected by Phase 105.

### the agent's Discretion
The agent may choose exact artifact filename, label grouping, scanner source, and whether route/file comments are useful, provided every remaining backend-like TypeScript surface is covered and public-output privacy is enforceable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md` - Strict taxonomy and artifact requirements.
- `.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md` - Selected Go-only route set and explicit deferred surfaces.
- `.planning/phases/106-typescript-worker-and-persistence-quarantine/106-CONTEXT.md` - Worker/persistence quarantine boundaries.
- `.planning/REQUIREMENTS.md` - DEF-01 through DEF-06.
- `.planning/ROADMAP.md` - Phase 107 boundary and success criteria.
- `.planning/research/v1.16-SUMMARY.md` - Deferred surface and privacy findings.

### Deferred And Private Surfaces
- `apps/web/app/workshop/server.ts` - Workshop validation, source, test, analytics, export, and profile flows.
- `apps/web/app/competitive/server.ts` - Broader ladder, governance/admin, private account source, and remaining direct persistence surfaces.
- `apps/web/app/matches/server.ts` - Public replay evidence and private owner-debug replay split.
- `apps/web/app/matches/[matchId]/replay/owner-debug.ts` - Owner-debug enablement gate.
- `apps/web/app/api/test-support/**/route.ts` - Test-support routes.
- `apps/web/app/api/workshop/**/route.ts` - Workshop API surfaces.
- `apps/web/app/api/ladder/**/route.ts` - Ladder mutation/read surfaces.
- `apps/web/app/api/admin/**/route.ts` - Governance/admin surfaces.

### Privacy And Public Output
- `packages/spec/src/public-output-privacy.ts` - Public-output privacy scanner/spec helpers.
- `packages/replay/src/project.ts` - Public and owner Chronicle projection behavior.
- `apps/web/app/matches/replay-ready.ts` - Replay page projection and public/private replay construction.
- `scripts/check-boundary-monitors.ts` - Existing privacy and TypeScript surface label monitor checks.
- `.planning/artifacts/v1.15-typescript-surface-labels.json` - Prior surface label baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isOwnerDebugReplayEnabled` already gates owner-debug replay behind test/env enablement.
- Existing replay server splits Go public evidence from owner-debug/private Chronicle paths.
- Existing boundary monitors already scan public-output leak terms and surface labels.

### Established Patterns
- v1.15 emitted `.planning/artifacts/v1.15-typescript-surface-labels.json`; Phase 107 should replace or extend that with v1.16 labels.
- Deferred surfaces should be explicit enough that Phase 108 can fail on drift rather than relying on prose.
- Public replay evidence and public DTOs must be source-safe and memory-safe by default.

### Integration Points
- Phase 107 artifact should become an input to `scripts/check-boundary-monitors.ts`.
- Route manifests and surface labels must stay synchronized when routes are added, deleted, or relabeled.
- Test-support and fixture-only paths need environment gates that monitors can identify.

</code_context>

<specifics>
## Specific Ideas

The user confirmed Phase 107 should be a labeling/privacy hardening sweep, not accidental migration of deferred product surfaces.

</specifics>

<deferred>
## Deferred Ideas

- Migrating Workshop to Go.
- Migrating broader ladder/admin/governance mutation paths to Go.
- Migrating full owner-debug replay/private Chronicle projection to Go.

</deferred>

---

*Phase: 107-Deferred Surface Relabeling and Privacy Preservation*
*Context gathered: 2026-05-24*
