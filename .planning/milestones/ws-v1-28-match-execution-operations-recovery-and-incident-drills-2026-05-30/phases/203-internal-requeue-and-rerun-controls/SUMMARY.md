---
phase: 203
name: Internal Requeue and Rerun Controls
status: complete
milestone: v1.28
completed: 2026-05-30
---

# Phase 203 Summary

Phase 203 added internal Go-owned recovery controls for eligible quarantined execution jobs.

## Delivered

- Private operator action persistence with idempotency keys.
- Go recovery service with active-quarantine, terminal-state, no-Chronicle, and failure-category guards.
- Internal-token endpoints for requeue and rerun.
- One-additional-attempt semantics without resetting attempts.
- Tests for applied recovery, duplicate idempotency, stale-artifact rejection, and operator action persistence.
- Proof artifacts in `.planning/artifacts/v1.28-internal-requeue-rerun-controls.{md,json}`.

## Verification

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` - passed
- `pnpm --filter @cowards/persistence test` - passed

## Next

Phase 204 should build the live failure-drill harness around these controls and the local topology.
