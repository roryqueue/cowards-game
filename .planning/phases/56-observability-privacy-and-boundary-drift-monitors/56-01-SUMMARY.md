---
phase: 56
plan: 01
slug: observability-privacy-and-boundary-drift-monitors
status: complete
completed: 2026-05-22
---

# Phase 56-01 Summary — Boundary Drift Monitors

## Delivered

- Added `pnpm boundary:monitors`, composing contract stale checks, Redocly lint, web import boundary checks, Go parity, sandbox evaluation artifact checks, topology diagnostics, and the new cross-boundary monitor script.
- Added `scripts/check-boundary-monitors.ts` to validate public OpenAPI route coverage/privacy, public service examples, Go fixtures, web boundary drift baseline, runtime adapter/product semantics drift, Go route manifest metadata, and topology diagnostics.
- Strengthened `scripts/check-service-boundary-imports.ts` with non-enumerable normalized statement fingerprints so the monitor can fail new debt on already-baselined lines without changing existing report output.
- Added focused monitor tests for baseline drift, DTO leak detection, runtime metadata drift, and live repository monitor checks.

## Requirements Covered

- MON-01: Contract stale checks, Redocly lint, and OpenAPI route metadata checks fail contract drift.
- MON-02: Public service examples, OpenAPI public schemas, Go fixtures, topology diagnostics, and monitor outputs run through privacy checks.
- MON-03: Strict migrated web route guards fail direct Strategy runtime/worker imports in the service-migrated slice.
- MON-04: Broad web direct persistence/runtime debt is baseline-gated so unknown new offenses fail while known debt remains visible.
- MON-05: Runtime registry and executable adapter metadata are compared for ABI, versions, readiness, limits, and counted eligibility semantics.
- MON-06: Go parity and route manifest checks cover every v1.8 Go read-only endpoint.
- MON-07: The composed monitor chain includes the existing v1.8 regression checks for contract, Go, sandbox, topology, privacy, and boundary behavior.

## Validation

- `pnpm boundary:monitors`
- `pnpm exec vitest run scripts/check-service-boundary-imports.test.ts scripts/check-boundary-monitors.test.ts`
- `pnpm typecheck`
- `pnpm exec prettier --check <changed files>`

## Surprise

The existing broad web boundary scan is noisy by design. Baseline-gating gives the project a useful failure mode now: future work can reduce the known list over time, while new bypass imports fail immediately.
