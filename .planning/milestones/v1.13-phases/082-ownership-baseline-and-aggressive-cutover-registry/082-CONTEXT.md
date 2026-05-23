# Phase 82: Ownership Baseline and Aggressive Cutover Registry - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 82 locks the v1.13 ownership baseline before implementation. It must produce the canonical route ownership registry, human-readable ownership matrix, baseline evidence bundle, and explicit non-goals that Phases 83-88 consume. It does not add Go DB access, change web routing, promote live routes, or move any runtime/job/replay-private behavior.

</domain>

<decisions>
## Implementation Decisions

### Registry Shape

- **D-01:** Use one canonical structured ownership manifest for all selected route families rather than separate public, owner, mutation, and worker manifests.
- **D-02:** The manifest should include a `routeFamily` or `surface` discriminator for `public_read`, `session`, `account_revision`, `mutation`, `worker_runtime`, and `deferred` surfaces.
- **D-03:** Produce a human-readable matrix from the same facts as the structured manifest so humans can audit ownership without creating a second source of truth.
- **D-04:** The registry should preserve v1.12 fields where useful: route id, method, path, current owner, selected owner, auth scope, privacy class, fallback policy, rollback owner, diagnostics class, status, blocked reasons, evidence requirements, and disallowed scopes.

### Promotion States

- **D-05:** Use explicit route states: `go_primary`, `typescript_primary`, `typescript_reference`, `worker_owned`, `deferred`, `blocked`, `rolled_back`, and `evidence_only`.
- **D-06:** Selected API routes should start as `typescript_primary` or `blocked` in Phase 82 and move to `go_primary` only in later phases after their route-family evidence passes.
- **D-07:** TypeScript service behavior should be represented as `typescript_reference` for selected Go-owned routes once promoted, not as silent per-request fallback.
- **D-08:** Worker/runtime surfaces should be marked `worker_owned`, not merely `deferred`, because v1.13 may create jobs while TypeScript remains the explicit execution owner.

### Baseline Evidence

- **D-09:** Phase 82 should collect fresh static/local baseline evidence before implementation.
- **D-10:** Required baseline evidence includes `pnpm boundary:imports`, `pnpm boundary:monitors`, the current Go route manifest snapshot, v1.12 blocker summary, current report-only offense list, and current selected route map.
- **D-11:** Live topology drills belong in later route implementation and verification phases. Phase 82 may capture live topology only as supplemental evidence if Go is already running and doing so is cheap.
- **D-12:** Preserve the v1.13 aggressive cutover decision as a cited artifact and explicitly distinguish it from v1.12 `promote-none-yet`.

### the agent's Discretion

Downstream agents may choose exact filenames and JSON field ordering, but the manifest must remain the canonical source of truth and monitorable by later phases.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` - Current v1.13 milestone goal, hard boundaries, and project decisions.
- `.planning/REQUIREMENTS.md` - OWN-01 through OWN-06 and milestone-wide privacy/runtime constraints.
- `.planning/ROADMAP.md` - Phase 82 goal, success criteria, and dependency ordering.
- `.planning/artifacts/v1.13-cutover-scope-decision.md` - Aggressive cutover decision and selected/deferred route families.
- `.planning/research/SUMMARY.md` - v1.13 research summary and proposed route-family build order.

### v1.12 Baseline and Prior Decisions

- `.planning/artifacts/v1.12-route-ownership-manifest.json` - Existing v1.12 structured ownership manifest to evolve from.
- `.planning/artifacts/v1.12-promotion-decision.md` - Final `promote-none-yet` rationale and live data blocker.
- `.planning/artifacts/v1.12-live-web-go-topology.json` - Prior topology proof for one route and evidence format.
- `.planning/milestones/v1.12-MILESTONE-AUDIT.md` - Audit-fixed readiness evidence and residual risk.
- `.planning/milestones/v1.12-ROADMAP.md` - Prior route ownership and promotion criteria phase structure.

### Code and Monitors

- `scripts/check-boundary-monitors.ts` - Current monitor shape, known report-only baseline, Go route manifest checks, and v1.12 ownership manifest gate.
- `scripts/check-service-boundary-imports.ts` - `strict_offenses` / `report_only_offenses` source.
- `scripts/check-local-topology.ts` - Current Go/web topology evaluation and route smoke patterns.
- `apps/go-backend/main.go` - Current fixture-backed route inventory and Go privacy validation patterns.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json` - Current five-route Go fixture manifest.
- `apps/web/lib/public-service-adapter.ts` - Existing single-route selected owner switch and no-fallback policy.
- `apps/web/lib/account-service-adapter.ts` - Existing account read adapter pattern.
- `packages/spec/src/service.ts` - Canonical service route metadata, DTO schemas, service error shape, and public privacy guard.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `scripts/check-boundary-monitors.ts`: Already validates Go route manifests, v1.12 ownership manifest, public-safe monitor payloads, and report-only baseline drift. Phase 82 should extend this pattern rather than invent a separate monitor lane.
- `.planning/artifacts/v1.12-route-ownership-manifest.json`: Good starting structure but too read-only and single-route-focused for v1.13.
- `apps/web/lib/public-service-adapter.ts`: Existing selected-owner/fail-closed switch proves the route owner concept but is hard-coded to `getPublicStrategyPage`.
- `apps/go-backend/testdata/service-fixtures/route-manifest.json`: Current fixture manifest should be captured as baseline, not treated as the future selected route list.

### Established Patterns

- Boundary evidence records exact `strict_offenses=0 report_only_offenses=29` output and known offense fingerprints.
- Go promotion artifacts should be privacy-safe and monitor-readable.
- TypeScript service/spec remains the canonical schema and parity reference.
- Route promotion should fail closed in selected-Go mode; rollback is an explicit owner/config/code change, not silent fallback.

### Integration Points

- New v1.13 ownership manifest should feed boundary monitors.
- Human-readable matrix should live under `.planning/artifacts/`.
- Baseline evidence should cite command output and current route inventories.
- Later phases should update the same canonical manifest rather than replacing it with phase-local route lists.

</code_context>

<specifics>
## Specific Ideas

Use a unified manifest plus generated/readable matrix. Use states `go_primary`, `typescript_primary`, `typescript_reference`, `worker_owned`, `deferred`, `blocked`, `rolled_back`, and `evidence_only`. Mark worker/runtime surfaces as `worker_owned` to prevent accidental interpretation as normal backend backlog.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 82-Ownership Baseline and Aggressive Cutover Registry*
*Context gathered: 2026-05-23*
