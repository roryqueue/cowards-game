# Phase 106: TypeScript Worker and Persistence Quarantine - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 106 makes TypeScript DB-owning worker and persistence lifecycle code unreachable as the normal backend after the Phase 105 selected route cutover. It should delete, quarantine, or remove normal exports for TypeScript job claim, lease, retry, Match completion, Chronicle persistence, scoring refresh, and MatchSet creation paths that could compete with Go ownership.

This phase may preserve TypeScript worker/persistence paths only as explicit rollback, parity, fixture, or test infrastructure. It does not remove all TypeScript persistence code needed for deferred Workshop, parity fixtures, tests, or rollback references, and it does not move database migration/schema ownership to Go.

</domain>

<decisions>
## Implementation Decisions

### Worker Entrypoint
- **D-01:** `apps/worker` must be non-normal by default after v1.16.
- **D-02:** The worker may remain only as `rollback-only`, `parity-only`, or `test-only` infrastructure.
- **D-03:** The executable worker entrypoint should refuse to run unless an explicit non-normal purpose flag is set.

### Lifecycle Ownership
- **D-04:** Remove or quarantine the idea that `COWARDS_MATCH_JOB_LIFECYCLE_OWNER=typescript` makes the TypeScript worker a normal lifecycle owner.
- **D-05:** If a TypeScript lifecycle-owner path is retained, it must mean explicit rollback mode with rollback documentation and no concurrent Go owner.
- **D-06:** Normal local/product topology must not allow mixed Go and TypeScript DB job claim/completion owners.

### Persistence Lifecycle Exports
- **D-07:** TypeScript job claim, lease, retry, Match completion, Chronicle persistence, MatchSet scoring refresh, and MatchSet creation functions must be removed from normal package exports or explicitly quarantined.
- **D-08:** Selected normal runtime paths must not import quarantined lifecycle modules.
- **D-09:** Tests, parity fixtures, rollback scripts, or deferred paths may import quarantined modules only through explicit gates and labels.

### `@cowards/service`
- **D-10:** Treat `@cowards/service` only as parity oracle, fixture generator, rollback reference, or deferred support.
- **D-11:** `@cowards/service` must not be the selected normal backend for the Phase 105 route set.

### Rollback Clarity
- **D-12:** Preserve rollback clarity if rollback remains possible.
- **D-13:** Rollback documentation must describe single-owner procedure for queued jobs, running jobs, expired leases, retries, incomplete MatchSets, scoring/public evidence, and avoiding mixed Go+TypeScript completion owners.

### Test Policy
- **D-14:** Keep focused tests for quarantined paths where useful.
- **D-15:** Tests must assert guards block normal TypeScript job ownership and allow only explicit rollback, test, or parity purposes.

### the agent's Discretion
The agent may choose exact quarantine folder/module names, export boundaries, guard env vars, and rollback artifact format, provided normal runtime cannot reach TypeScript worker/persistence lifecycle ownership after this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-CONTEXT.md` - Strict taxonomy and deletion/quarantine/relabel policy.
- `.planning/phases/105-web-api-go-only-cutover-and-fallback-removal/105-CONTEXT.md` - Selected routes that must no longer use TypeScript fallback.
- `.planning/REQUIREMENTS.md` - QUAR-01 through QUAR-07.
- `.planning/ROADMAP.md` - Phase 106 boundary and success criteria.
- `.planning/research/v1.16-SUMMARY.md` - Worker and persistence retirement targets.

### Worker And Persistence Surfaces
- `apps/worker/src/index.ts` - Executable worker entrypoint that currently starts DB-owning worker loop.
- `apps/worker/src/runner.ts` - TypeScript job claim/completion runner and current guard logic.
- `apps/worker/src/runner.test.ts` - Existing worker guard and completion tests.
- `packages/persistence/src/jobs.ts` - TypeScript job claim, lease, retry, and failure lifecycle code.
- `packages/persistence/src/complete-match.ts` - TypeScript Match completion and Chronicle persistence handoff.
- `packages/persistence/src/matchset-status.ts` - TypeScript MatchSet status/scoring refresh logic.
- `packages/persistence/src/matchset-service.ts` - MatchSet creation service.
- `packages/persistence/src/competition.ts` - Exhibition/competition MatchSet creation and public result DTO logic.
- `packages/persistence/src/workshop.ts` - Workshop MatchSet creation and deferred Workshop paths.
- `packages/persistence/src/index.ts` - Normal package export boundary.
- `packages/service/src/index.ts` - `@cowards/service` parity/deferred/rollback surface.

### v1.15 Baseline
- `.planning/artifacts/v1.15-lifecycle-ownership-manifest.json` - Go lifecycle ownership baseline.
- `.planning/artifacts/v1.15-failure-drills.json` - Existing no-fallback/failure drill evidence.
- `.planning/artifacts/v1.15-promotion-decision.md` - Backend ownership decision after v1.15.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TypeScriptWorkerOwnershipError`, `createTypeScriptWorkerJobOwnershipConfig`, and `assertTypeScriptWorkerJobOwnershipAllowed` already provide a starting guard model.
- Worker tests already cover blocked normal ownership and explicit purpose allowances; Phase 106 should tighten the semantics.
- Boundary monitors already inspect TypeScript surface labels and fallback policies.

### Established Patterns
- v1.15 treats Go as the normal owner for Match job lifecycle, Match completion, Chronicle persistence handoff, and MatchSet scoring/status refresh.
- Existing worker guard still allows `lifecycleOwner === "typescript"` as normal; Phase 106 should retire or reinterpret that behavior.
- TypeScript persistence remains useful for tests, fixtures, rollback, and deferred Workshop/ladders/governance, but not as selected normal backend.

### Integration Points
- `packages/persistence/src/index.ts` is a key export boundary for normal import reachability.
- `apps/worker/src/index.ts` must be guarded separately from `runWorkerOnce` helpers because it is the process entrypoint.
- Phase 108 monitors should consume Phase 106 labels and fail if normal runtime imports quarantined lifecycle code.

</code_context>

<specifics>
## Specific Ideas

The user confirmed the recommended quarantine framing: `apps/worker` and TypeScript persistence lifecycle code can remain only under explicit rollback/test/parity gates, and TypeScript lifecycle owner must not be a normal runtime mode.

</specifics>

<deferred>
## Deferred Ideas

- Removing all TypeScript persistence code.
- Go-owned migrations/schema ownership.
- Migrating deferred Workshop/ladders/governance paths that still use persistence modules.

</deferred>

---

*Phase: 106-TypeScript Worker and Persistence Quarantine*
*Context gathered: 2026-05-24*
