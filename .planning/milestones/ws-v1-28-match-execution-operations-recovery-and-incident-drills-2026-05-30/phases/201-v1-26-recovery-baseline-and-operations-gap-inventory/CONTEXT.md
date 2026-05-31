# Phase 201 Context: v1.26 Recovery Baseline and Operations Gap Inventory

**Milestone:** v1.28 Match Execution Operations, Recovery, and Incident Drills
**Phase:** 201
**Status:** Context captured
**Date:** 2026-05-30

## Decisions

- Use v1.26 as the only implementation baseline. Do not assume v1.27 artifacts or code from the parallel checkout.
- Treat `match-execution-app-v1` as frozen. Phase 201 default decision is no public DTO change.
- Scope v1.28 to internal Go-owned execution operations and recovery behind the frozen app contract.
- Model operational recovery as private/operator state and evidence, not public result/replay lifecycle expansion.
- Keep Strategy execution out of web/API/Go. Go may orchestrate recovery and invoke runtime-service, but runtime-service remains the hostile Strategy execution boundary.
- Preserve JS/TS counted play, Python/Rust/Zig non-counted exhibition beta, and Preview 1 stdin/stdout JSON as the active WASM/WASI ABI.

## Open Questions Resolved For Planning

- **Quarantine shape:** Phase 201 should identify the likely private storage seam, but Phase 202 chooses the concrete table/metadata shape.
- **Rerun shape:** Phase 203 should support same-Match recovery only for eligible no-Chronicle/failed/quarantined cases. Replacement Match/MatchSet semantics stay future work.
- **Drill strategy:** Prefer deterministic local scripts and fake runtime-service endpoints before adding production failure-injection hooks.
- **Public contract:** No public addition is planned unless Phase 207 proves one necessary.

## Inputs

- `.planning/PROJECT.md`
- `.planning/research/v1.28-SUMMARY.md`
- `.planning/workstreams/v1-28-match-execution-operations-recovery-and-incident-drills/REQUIREMENTS.md`
- `.planning/workstreams/v1-28-match-execution-operations-recovery-and-incident-drills/ROADMAP.md`
- `.planning/milestones/v1.26-REQUIREMENTS.md`
- `.planning/milestones/v1.26-ROADMAP.md`
- `.planning/milestones/v1.26-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.26-VERIFY-WORK.md`
- `.planning/milestones/v1.26-CODE-REVIEW.md`
- `.planning/milestones/v1.26-AUDIT-FIX.md`
- `.planning/artifacts/v1.26-match-execution-reliability-proof.md`
- `.planning/artifacts/v1.26-match-execution-reliability-proof.json`
- `apps/go-backend/orchestrator.go`
- `apps/go-backend/job_lifecycle.go`
- `apps/go-backend/completion.go`
- `apps/go-backend/retry_policy.go`
- `apps/go-backend/runtime_service_client.go`
- `apps/go-backend/live_backend.go`
- `apps/runtime-service/src/server.ts`
- `apps/runtime-service/src/execute-match.ts`
- `apps/runtime-service/src/redaction.ts`
- `scripts/evaluate-v1-26-match-execution-reliability.ts`
- `scripts/check-boundary-monitors.ts`
- `packages/spec/src/match-execution-contract.ts`

## Downstream Guidance

Phase 202 should start by choosing a private quarantine persistence model that can be queried by operators and joined to existing Match job state, while proving public projection remains unchanged.

Phase 203 should implement operator controls through Go lifecycle transactions, not direct SQL scripts or TypeScript lifecycle fallback.
