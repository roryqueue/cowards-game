# Phase 201 Plan: v1.26 Recovery Baseline and Operations Gap Inventory

**Goal:** Lock the v1.26 baseline, v1.28 non-goals, and current execution recovery gaps before implementation.

## Tasks

1. Reconfirm v1.26 reliability proof and frozen app contract baseline.
2. Inventory execution surfaces across Go orchestration, Go job lifecycle, completion, public projection, runtime-service envelopes, persistence, fixtures, proof scripts, and monitors.
3. Classify each surface by ownership and stability: public contract, Go internal, runtime-service internal, persistence internal, private operator evidence, test-only, or intentionally unstable.
4. Identify current gaps for dead-letter/quarantine, deterministic requeue/rerun, stale leases, duplicate workers, interrupted MatchSets, private evidence, and live drill harnesses.
5. Record phase artifacts in `.planning/artifacts/v1.28-recovery-baseline-and-operations-gap-inventory.{md,json}`.
6. Update v1.28 requirements traceability and workstream state for Phase 201 completion.

## Verification

- Phase artifact includes all BASE requirements.
- Artifact explicitly states no app-facing contract change is planned.
- Artifact explicitly states v1.27 is not a baseline.
- Artifact preserves Go/runtime-service ownership split and public privacy constraints.
- Workstream state validates with `gsd-tools state validate`.

## Expected Outputs

- `CONTEXT.md`
- `PLAN.md`
- `SUMMARY.md`
- `.planning/artifacts/v1.28-recovery-baseline-and-operations-gap-inventory.md`
- `.planning/artifacts/v1.28-recovery-baseline-and-operations-gap-inventory.json`
