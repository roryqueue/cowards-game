# Phase 70: Boundary Debt Rebaseline and v1.11 Scope Lock - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 70 captures the v1.11 scope lock before implementation. It must re-baseline the 30 remaining broad web report-only offenses, classify selected versus deferred surfaces, record live baseline evidence, and define rollback/defer criteria for the v1.11 Workshop read slices and live Go evidence lane.

This phase does not migrate code, add DTOs, update strict import lists, or run the final live Go evidence gate. It prepares the evidence and decision artifacts that Phases 71-75 will use.

</domain>

<decisions>
## Implementation Decisions

### Classification Granularity

- **D-01:** Use a surface-first ownership matrix with exact offense details underneath each surface. The matrix should be readable by humans while preserving every `pnpm boundary:imports` offense line needed for count-level proof.
- **D-02:** Classify each mixed surface with one primary class plus sub-flags. Use flags such as `write`, `source-bearing`, `owner-debug`, `runtime`, `cleanup-only`, and `selected-read` so planners do not miss mixed ownership risk.
- **D-03:** Use the exact import fingerprint as the canonical baseline identifier: path, line, forbidden pattern, and normalized import statement. This matches current boundary monitor behavior and proves removal rather than masking.
- **D-04:** Mark selected and deferred surfaces with decision status plus a short reason. Use statuses such as `selected`, `deferred`, `cleanup-tied`, or `watch-only`, and name the likely future boundary when a surface is deferred.

### Evidence Freshness

- **D-05:** Phase 70 should freshly rerun the core boundary and monitor baseline: `pnpm boundary:imports`, `pnpm boundary:monitors`, and `pnpm topology:check`. Cite v1.10 archives for historical context instead of rerunning a full milestone verification set.
- **D-06:** Treat live Go smoke in Phase 70 as optional if the Go backend is already available. Required live Go evidence belongs to Phase 74, where `pnpm topology:check -- --require-go --json` becomes a validation gate.
- **D-07:** If baseline counts drift, do not proceed blindly and do not stop before understanding the change. First classify the new baseline, then decide whether drift is benign, requires requirement/roadmap adjustment, or blocks the phase.
- **D-08:** Store durable baseline evidence in `.planning/artifacts/v1.11-baseline-boundary-evidence.md` and summarize it in `70-CONTEXT.md`. Carry this pattern forward for later durable evidence: dedicated artifact plus context or validation summary.

### Candidate and Defer Threshold

- **D-09:** A selected migration candidate must be read-only, source-free, runtime-free, write-separated, and schema-validatable through `@cowards/spec`.
- **D-10:** Cleanup-only changes are allowed only when tied to a selected read boundary and when they remove real report-only fingerprints.
- **D-11:** Source-bearing reads stay deferred even if owner-scoped and GET-shaped.
- **D-12:** Replay owner-debug/private Chronicle surfaces stay deferred unless a future phase explicitly separates public replay projection from owner-debug/private Chronicle assembly.
- **D-13:** Workshop source/save/validation/test-launch/rerun/export/runtime flows stay deferred even when adjacent to selected Workshop reads.
- **D-14:** Legacy broad facades are not considered fixed unless exact report-only fingerprints disappear from the baseline.

### Rollback and Deferred Surface Shape

- **D-15:** Use route-level rollback criteria for the selected v1.11 Workshop reads. Phase 71 and Phase 72 should each be reversible without backing out the entire milestone.
- **D-16:** Keep service methods and DTOs small enough that rolling back one selected route does not disturb the other selected read path.
- **D-17:** Record deferred surfaces with trigger criteria, not just as a simple list. Each deferred class should name what would need to be true before a later milestone reconsiders it, such as source-free projection, write ownership, or public/private replay split.

### the agent's Discretion

- The planner may choose the exact matrix table layout and artifact section names as long as D-01 through D-04 are satisfied.
- The planner may include additional supporting commands in the baseline artifact if they are fast and directly clarify v1.11 scope, but should not turn Phase 70 into a full milestone verification pass.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Scope

- `.planning/PROJECT.md` - Current v1.11 milestone goal, target features, project constraints, and key decisions.
- `.planning/REQUIREMENTS.md` - Active v1.11 requirements and out-of-scope boundaries.
- `.planning/ROADMAP.md` - Phase 70 goal, success criteria, and dependency context.
- `.planning/STATE.md` - Current milestone state and deferred items.
- `.planning/research/v1.11-SUMMARY.md` - v1.11 research recommendation and selected scope.

### Prior Boundary Evidence

- `.planning/milestones/v1.10-MILESTONE-AUDIT.md` - Latest shipped milestone audit and final boundary state.
- `.planning/artifacts/v1.10-boundary-offense-classification.md` - Previous 34-offense classification and v1.10 selected/deferred categories.
- `.planning/artifacts/v1.10-baseline-boundary-evidence.md` - v1.10 starting evidence pattern to mirror for v1.11.
- `.planning/milestones/v1.10-phases/68-boundary-enforcement-and-promotion-guardrails/68-CONTEXT.md` - Prior strict/report-only enforcement and non-promotion context.
- `.planning/milestones/v1.10-phases/69-milestone-verification-and-regression-gate/69-CONTEXT.md` - Prior verification gate scope.

### Boundary and Topology Code

- `scripts/check-service-boundary-imports.ts` - Source of strict migrated files, forbidden patterns, and report-only offense formatting.
- `scripts/check-boundary-monitors.ts` - Known report-only fingerprint baseline and drift checks.
- `scripts/check-local-topology.ts` - Static and optional/required live topology checks, including Go smoke behavior.
- `scripts/generate-go-parity-fixtures.ts` - Go parity fixture generation source of truth.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `scripts/check-service-boundary-imports.ts` exposes `analyzeServiceBoundaryImports()` and formats exact report-only offense fingerprints.
- `scripts/check-boundary-monitors.ts` contains `knownReportOnlyBoundaryOffenses`, `findUnknownReportOnlyOffenses()`, and Go route/fixture/privacy monitor checks.
- `scripts/check-local-topology.ts` already distinguishes optional Go live smoke from required Go checks with `--require-go`.
- `.planning/artifacts/v1.10-*` files provide the artifact pattern for baseline evidence and ownership matrices.

### Established Patterns

- Migrated surfaces become strict only after their safe dependency closures no longer import persistence roots, runtime packages, workers, migrations, or broad server facades.
- Report-only debt reduction is counted by removing exact known fingerprints, not by hiding persistence behind another web facade.
- Go evidence remains read-only and fixture-backed until a future milestone explicitly proves promotion criteria.

### Integration Points

- Phase 70 should produce `.planning/artifacts/v1.11-baseline-boundary-evidence.md`.
- Phase 70 should produce an ownership matrix artifact, likely `.planning/artifacts/v1.11-boundary-offense-classification.md`, unless the planner selects an equivalent clear name.
- Later phases should cite the Phase 70 artifacts when proving selected fingerprint removal and preserving deferred boundaries.

</code_context>

<specifics>
## Specific Ideas

- User confirmed the recommended options throughout Phase 70 and said similar evidence/durable-artifact decisions can be auto-confirmed when they match the same spirit.
- Future similar decisions should prefer durable evidence artifacts plus concise phase summaries when the evidence will be reused across later phases.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 70-Boundary Debt Rebaseline and v1.11 Scope Lock*
*Context gathered: 2026-05-23*
