# Phase 231 Code Review: Drift Monitors and Boundary Coverage

## Review Scope

- `scripts/check-boundary-monitors.ts`
- `scripts/check-boundary-monitors.test.ts`
- `scripts/check-service-boundary-imports.ts`
- `scripts/check-service-boundary-imports.test.ts`
- `scripts/check-public-discovery-boundary.ts`
- `.planning/artifacts/v1.17-runtime-broker-registry.json`

## Findings

No open local findings.

## External Review Findings Addressed

- Converted stale Python non-counted runtime adapter and broker registry assertions into positive supported-provider checks.
- Converted stale public picker disabled assertion into a provider-backed public picker check.
- Replaced beta-era source markers with current provider proof markers.
- Added direct product language-special-case monitor coverage with a narrow allowlist.
- Added WASM/WASI runtime package denylist coverage to service and public discovery boundary checks.

## Residual Risk

The direct-special-case monitor intentionally allows a small set of Workshop/API/editor boundary files. Future phases should keep reducing those approved boundaries as provider helper APIs become more expressive.

