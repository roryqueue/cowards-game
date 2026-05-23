# Phase 73: Boundary Enforcement and Source-Free Type Cleanup - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 73 promotes the proven Phase 71 and Phase 72 Workshop read migrations into enforcement evidence. It must strict-gate the selected migrated route files plus their safe local dependency closures, remove real report-only fingerprints from the known baseline, and keep the final `pnpm boundary:imports` result at `strict_offenses=0` with `report_only_offenses` below the v1.11 baseline of 30.

This phase must not broaden into Workshop source retrieval, source save, validation, test launch, analytics rerun, profile save, export, runtime behavior, Strategy execution, replay owner-debug/private Chronicle assembly, Go routing, writes, jobs, migrations, or production sandbox promotion.

</domain>

<decisions>
## Implementation Decisions

### Strict Enforcement Granularity

- **D-01:** Strict-gate the Phase 71 and Phase 72 migrated route files plus their safe local dependency closures.
- **D-02:** Do not strict-gate the whole Workshop app/API area.
- **D-03:** If a selected route imports a local helper, that helper must be safe under strict enforcement. The planner may rely on the analyzer's local-import closure walk and/or add explicit helper entries where doing so improves clarity.
- **D-04:** Do not bypass closure failures with broad allowlists, path-only masking, or new facades that hide direct persistence/runtime/write imports.
- **D-05:** Do not strict-gate broad Workshop source/runtime/write/replay/private surfaces in this phase.

### Source-Free Type Cleanup Scope

- **D-06:** Cleanup only source-free type imports directly tied to the Phase 71/72 DTO ownership.
- **D-07:** Do not opportunistically replace the whole Workshop types module.
- **D-08:** Do not spec-promote source-bearing Workshop templates, samples, private source payloads, runtime internals, owner-debug payloads, or Strategy execution data into public/service outputs.
- **D-09:** Cleanup-only changes must remove real report-only fingerprints and must remain tied to selected read boundary ownership.

### Baseline Proof Standard

- **D-10:** Phase 73 succeeds only if `pnpm boundary:imports` reports `strict_offenses=0` and `report_only_offenses` below the v1.11 starting baseline of 30.
- **D-11:** Migrated report-only fingerprints must be removed from the known baseline by exact fingerprint, including path, line, forbidden pattern, and normalized import statement.
- **D-12:** Do not count success if the report-only count remains 30, even if strict enforcement passes.
- **D-13:** If the count does not drop after implementation, the planner/executor should classify why and either perform tied source-free cleanup that removes real fingerprints or stop for replanning. Do not paper over the miss with an evidence-only note.

### Rollback and Isolation

- **D-14:** Rollback is per selected route slice. If a strict target is too broad but the migrated service route remains safe, remove or narrow only the failing strict entry. If route migration pulls unsafe persistence/runtime/write dependencies, rollback that route to the prior web server facade as documented in Phase 71 or Phase 72.
- **D-15:** Keep Phase 71 and Phase 72 strict targets and DTO/service tests isolated enough that one slice can be reverted without disturbing the other.

### the agent's Discretion

- The planner may choose the exact strict file entries after confirming the migrated route paths and helper paths from Phase 71 and Phase 72.
- The planner may choose where to record the final count evidence, but it must be durable and referenced by Phase 75 verification.
- The planner may choose whether a source-free type cleanup belongs in this phase or in the preceding migration plan, provided Phase 73 is where final strict/baseline proof is recorded.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and Prior Phase Context

- `.planning/PROJECT.md` - Current v1.11 milestone goal and boundary constraints.
- `.planning/REQUIREMENTS.md` - BOUND requirements and v1.11 out-of-scope boundaries.
- `.planning/ROADMAP.md` - Phase 73 goal and success criteria.
- `.planning/phases/70-boundary-debt-rebaseline-and-v1-11-scope-lock/70-CONTEXT.md` - Baseline/fingerprint/defer policy and selected candidate criteria.
- `.planning/phases/71-workshop-test-summary-read-boundary/71-CONTEXT.md` - Phase 71 route/service/DTO ownership and rollback expectations.
- `.planning/phases/72-workshop-analytics-compare-read-boundary/72-CONTEXT.md` - Phase 72 route/service/DTO ownership and rollback expectations.

### Boundary Enforcement Code

- `scripts/check-service-boundary-imports.ts` - Strict file list, dependency-closure walk, forbidden patterns, and report-only offense formatting.
- `scripts/check-boundary-monitors.ts` - Known report-only fingerprint baseline and monitor checks.
- `package.json` - `pnpm boundary:imports` and boundary monitor script commands.

### Likely Migrated Code Targets

- `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` - Phase 71 route expected to be strict-gated after migration.
- `apps/web/app/api/workshop/analytics/profiles/[profileId]/compare/route.ts` - Phase 72 route expected to be strict-gated after migration.
- `apps/web/app/workshop/types.ts` - Existing source of broad Workshop type imports; cleanup only where tied to selected source-free DTO ownership.
- `apps/web/lib/workshop-analytics-service-boundary.ts` - Existing strict Workshop analytics boundary pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `scripts/check-service-boundary-imports.ts` exposes `strictMigratedFiles`, `strictAllowedForbiddenImports`, `analyzeServiceBoundaryImports()`, and exact offense formatting.
- The strict analyzer collects local dependency closure from each strict entry, so route strict entries can still prove imported local helpers.
- `scripts/check-boundary-monitors.ts` stores the known report-only baseline as exact strings that include normalized import statements.

### Established Patterns

- Prior milestones promoted migrated read surfaces by adding narrow strict entries and keeping adapter allowlists limited to service adapter files.
- Baseline reduction is measured by exact report-only fingerprint removal, not by masking path classes.
- Broad server facades remain report-only debt until exact persistence/runtime imports disappear from the baseline.

### Integration Points

- The likely strict list change is in `scripts/check-service-boundary-imports.ts`.
- The likely known baseline change is in `scripts/check-boundary-monitors.ts`.
- Final evidence should include the command output from `pnpm boundary:imports` after Phase 71/72 migrations and Phase 73 enforcement changes.

</code_context>

<specifics>
## Specific Ideas

- Prefer narrow strict entries for Phase 71 and Phase 72 routes and any safe local helpers that make the dependency closure explicit.
- Treat any count drop as invalid unless the exact migrated fingerprints are absent from the known baseline and from fresh `pnpm boundary:imports` output.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 73-Boundary Enforcement and Source-Free Type Cleanup*
*Context gathered: 2026-05-23*
