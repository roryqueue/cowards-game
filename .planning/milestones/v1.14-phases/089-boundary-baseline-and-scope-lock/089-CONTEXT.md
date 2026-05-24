# Phase 89: Boundary Baseline and Scope Lock - Context

**Gathered:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Status:** Context gathered; ready for planning

## Phase Boundary

Phase 89 is a developer-facing baseline and scope-lock phase. It should produce a v1.14 ownership/boundary evidence bundle and explicit non-goals before implementation begins.

This phase should not implement the generic Strategy Artifact model, runtime ABI, generated manifests, JS adapter conformance changes, Go fork promotion, or final promotion gate. It should make those downstream responsibilities precise enough that Phases 90-95 can plan against stable boundaries.

## Approved Decisions

### D-01 Baseline Bundle

Produce a bundle, not a single artifact:

- Machine-readable v1.14 ownership/boundary manifest JSON.
- Human-readable ownership/boundary matrix or summary Markdown.
- Baseline evidence Markdown with references, gaps, and downstream phase ownership.

### D-02 Ownership Categories

The manifest should separate:

- Live Go routes.
- Fixture/parity routes.
- TypeScript oracle/reference surfaces.
- Worker-owned runtime surfaces.
- Deferred surfaces.
- Selected v1.14 promotion candidates.

### D-03 Drift Inventory

Include the full v1.14 drift inventory:

- Starter/Advanced fork deferral.
- Go lineage loss.
- Reduced Go validation.
- Runtime ABI shape drift.
- Adapter ID drift.
- Limit drift.
- Failure taxonomy drift.
- Privacy deny-list drift.
- Topology gaps.
- Replay board realism gaps.
- Report-only import baseline.

### D-04 Non-Goal Enforcement

Document non-goals and attach monitor/test hooks where practical. Phase 89 does not need to implement every enforcement hook, but it must state which later phase owns any enforcement gap.

Non-goals must include:

- Go/web/API Strategy execution.
- Node `vm` as a security boundary.
- Counted non-JS play by default.
- Production sandbox promotion.
- Go migrations/schema ownership.
- Full replay projection.
- Owner-debug replay migration.
- Workshop runtime ownership.
- Job claiming/completion migration.

### D-05 Evidence Shape

Use both machine-readable and human-readable evidence:

- JSON for route/runtime/artifact ownership and drift facts.
- Markdown for rationale, risks, and downstream planning notes.

### D-06 Boundary Monitor Baseline

Preserve the v1.13 boundary monitor baseline unless explicitly rebaselined:

- `strict_offenses=0`
- `report_only_offenses=29`

### D-07 Runtime Ownership

TypeScript service behavior remains a parity oracle/reference where needed, not the future backend path. TypeScript worker/runtime remains the Strategy execution owner in v1.14 unless a later phase creates explicit conformance evidence. Go, web, and API processes must not execute Strategy code or use Node `vm` as a security boundary.

## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/research/SUMMARY.md`
- `.planning/artifacts/v1.13-route-ownership-manifest.json`
- `.planning/artifacts/v1.13-route-ownership-matrix.md`
- `.planning/artifacts/v1.13-live-web-go-topology.json`
- `.planning/artifacts/v1.13-promotion-decision.md`
- `.planning/milestones/v1.13-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.13-phases/086-account-strategy-revision-source-and-write-ownership/086-CONTEXT.md`
- `.planning/milestones/v1.13-phases/088-multi-route-cutover-verification-and-rollback-gate/088-CONTEXT.md`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-service-boundary-imports.ts`
- `scripts/check-local-topology.ts`
- `apps/go-backend/live_backend.go`
- `packages/spec/src/runtime.ts`
- `packages/spec/src/schemas.ts`
- `packages/spec/src/service.ts`
- `packages/runtime-js/src/adapter.ts`
- `apps/worker/src/runner.ts`
- `apps/web/app/matches/replay-ready.ts`

## Codebase Context

Reusable assets:

- v1.13 route ownership manifest and matrix.
- Boundary monitor and service boundary import analyzer.
- Local topology checker.
- Go live backend privacy writer.
- Runtime ABI constants and schema surfaces.
- Replay board realism checker.

Patterns to preserve:

- Manifest plus human matrix for ownership evidence.
- Strict/report-only import baseline.
- TypeScript oracle/reference for parity.
- No-fallback selected Go ownership evidence.
- Privacy deny-list checks for public outputs.
- Worker-owned hostile Strategy runtime boundary.

Integration points:

- `.planning/artifacts` for generated milestone evidence.
- Boundary monitors and service import checks.
- Route ownership files.
- Go backend live route ownership.
- Spec runtime/schema packages.
- Worker runner/runtime adapter boundary.
- Replay-ready board realism checks.

## Downstream Ownership

- Phase 90 owns generic Strategy Artifact and compatible revision contracts.
- Phase 91 owns generated manifest production and stale-output checks.
- Phase 92 owns `strategy-runtime-abi-v1.14` schemas and failure taxonomy.
- Phase 93 owns JS runtime adapter conformance and hostile/determinism probes.
- Phase 94 owns Go artifact consumption and Starter/Advanced fork parity.
- Phase 95 owns final privacy, realism, topology, no-fallback, and promotion/defer evidence.

## Deferred Ideas

No additional deferred ideas were introduced during discussion. Existing milestone deferrals remain tracked in `.planning/STATE.md` and downstream phase ownership above.
