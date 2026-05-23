# Phase 64: Boundary Debt Triage and Scope Lock - Context

**Gathered:** 2026-05-23  
**Status:** Ready for planning  
**Source:** v1.10 milestone research and user-approved scope

<domain>
## Phase Boundary

Phase 64 is an evidence and scope-lock phase. It does not migrate code paths. It must capture the current boundary baseline, classify all remaining report-only import offenses, select the exact v1.10 migration candidates, and record non-goals before Phase 65 begins.

</domain>

<decisions>
## Implementation Decisions

### Selected v1.10 Slices
- Account Strategy Revision list read is selected for Phase 65, but save, fork, source retrieval, validation, submission, and MatchSet creation are not selected.
- Workshop analytics/Evidence Explorer reads are selected for Phase 66, but Workshop source/save/test/runtime, analytics rerun mutations, and exports are not selected.
- Go read-model expansion is selected for exactly one route in Phase 67: public `GET /public/strategies/{strategyId}` via `getPublicStrategyPage`.

### Boundary Enforcement
- The starting baseline is `strict_offenses=0 report_only_offenses=34`.
- v1.10 must reduce report-only offenses below 34 by removing migrated fingerprints, not by hiding them behind path-only masking.
- Migrated slices should become strict only after service ownership, spec DTOs, privacy checks, tests, and dependency closure are proven.

### Non-Goals
- Go writes, backend rewrite, production sandbox promotion, counted non-JS play, full replay projection, owner-debug replay migration, Strategy source retrieval, Workshop runtime execution, jobs, migrations, and rule/Chronicle/scoring changes are out of scope.
- Runtime isolation and non-JS remain evidence-only/non-counted.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` - active v1.10 milestone goal and constraints.
- `.planning/REQUIREMENTS.md` - active v1.10 requirements and out-of-scope boundaries.
- `.planning/ROADMAP.md` - Phase 64-69 structure and requirement mapping.
- `.planning/research/SUMMARY.md` - v1.10 research recommendation and risk summary.

### Boundary Evidence
- `.planning/artifacts/v1.10-baseline-boundary-evidence.md` - current command evidence.
- `.planning/artifacts/v1.10-boundary-offense-classification.md` - all 34 report-only offenses classified.
- `.planning/artifacts/v1.10-ownership-boundary-matrix.md` - selected ownership boundaries and deferrals.

### Code Anchors
- `scripts/check-service-boundary-imports.ts` - strict/report-only boundary enforcement.
- `scripts/check-boundary-monitors.ts` - drift monitor composition.
- `scripts/check-local-topology.ts` - topology diagnostics and Go route count.
- `packages/spec/src/service.ts` - canonical service route metadata.
- `packages/service/src/index.ts` - TypeScript service implementation.
- `scripts/generate-go-parity-fixtures.ts` - TypeScript-service-backed Go fixture generation.
- `apps/go-backend/main.go` - Go route inventory and fixture-backed handlers.

</canonical_refs>

<specifics>
## Specific Ideas

- Treat account revision-list GET as a route/dependency closure problem, not a reason to migrate POST save.
- Treat Workshop analytics reads as a narrow read DTO carveout from `workshop/server.ts`, not a Workshop runtime migration.
- Treat public Strategy Go read as parity proof; web traffic stays TypeScript-service-backed unless later rollback mechanics are explicit.
</specifics>

<deferred>
## Deferred Ideas

- Auth command service migration.
- Exhibition/ladder/governance command service migration.
- Full replay service migration.
- Additional Go read-model routes after public Strategy page proves stable.
- Production sandbox promotion and counted non-JS runtime support.
</deferred>

---

*Phase: 64-boundary-debt-triage-and-scope-lock*  
*Context gathered: 2026-05-23*

