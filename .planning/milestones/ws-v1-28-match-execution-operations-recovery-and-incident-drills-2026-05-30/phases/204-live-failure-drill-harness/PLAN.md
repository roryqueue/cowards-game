# Phase 204 Plan: Live Failure-Drill Harness

**Goal:** Build repeatable local drills across Postgres, Go backend, runtime-service/fakes, and browser proof.

## Tasks

1. Add `scripts/evaluate-v1-28-match-execution-operations.ts`.
2. Add `pnpm match-execution:operations` and `pnpm match-execution:operations:check`.
3. Validate quarantine, recovery, internal endpoint, and migration source markers.
4. Validate frozen `match-execution-app-v1` fixtures and private-marker safety.
5. Emit `.planning/artifacts/v1.28-match-execution-operations-proof.{json,md}`.
6. Update v1.28 traceability and state.

## Verification

- `pnpm match-execution:operations:check`
