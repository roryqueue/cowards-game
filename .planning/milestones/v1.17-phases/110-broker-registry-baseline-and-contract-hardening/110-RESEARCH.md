# Phase 110 Research: Broker Registry Baseline and Contract Hardening

**Date:** 2026-05-25
**Status:** Complete

## Findings

- `packages/spec/src/runtime.ts` already contains language and adapter registries for JS/TS and `runtime-python-subprocess-experimental`, but there is no monitor-readable v1.17 runtime registry artifact and runtime-service selection still hardcodes JS/TS.
- `packages/spec/src/runtime-execution-service.ts` already names the public boundary as "Strategy Execution Service / Runtime Broker"; Phase 110 should harden that naming into a registry/selection contract without introducing a new service.
- `apps/runtime-service/src/execute-match.ts` is the correct broker insertion point because Go already calls only `POST /execute-match` and receives schema-validated envelopes.
- `apps/go-backend/runtime_service_client.go` validates ABI/source/metadata but does not yet verify exact adapter/language registry membership beyond shape.
- `scripts/check-boundary-monitors.ts` and `scripts/check-local-topology.ts` are the existing enforcement paths and should consume new v1.17 artifacts in Phase 116.

## Risks

- A Python path bolted directly into Go/web/API would violate v1.16 backend-retirement.
- Lenient registry matching would mask runtime drift.
- Updating registry wording without runtime-service tests would leave the broker contract decorative.

## Recommended Tests

- Spec tests for exact registry entries and v1.17 artifact contents.
- Runtime-service tests for unknown language/adapter fail-closed behavior.
- Go client tests for runtime metadata contract acceptance/rejection.

