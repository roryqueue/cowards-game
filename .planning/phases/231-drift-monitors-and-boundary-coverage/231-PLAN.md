# Phase 231 Plan: Drift Monitors and Boundary Coverage

## Objective

Convert stale non-promotion monitors into positive four-language provider and boundary monitors, while preventing future direct product special-casing drift.

## Tasks

1. Convert active runtime monitor expectations.
   - Replace Python non-counted adapter assertions with provider-gated counted eligibility checks for all supported languages.
   - Update runtime broker artifact validation to require counted entries for JS/TS, Python, Rust, and Zig.
   - Update beta-era source markers to current provider proof markers.

2. Add direct product special-case monitor.
   - Scan active web app/lib source for branch conditions on `typescript`, `python`, `rust`, or `zig`.
   - Allow only approved provider/adapter/editor boundary files.
   - Add a unit test that proves an unapproved branch fails.

3. Strengthen import and public discovery boundaries.
   - Add `@cowards/runtime-wasm-wasi` and `packages/runtime-wasm-wasi` to service boundary import denylist.
   - Add the same WASM/WASI runtime markers to public discovery boundary checks.
   - Add a unit test for direct WASM/WASI runtime imports in strict web/API files.

4. Add provider completeness monitor.
   - Prove every supported language has a provider, contract version, runtime adapter, docs/examples references, limits, privacy rules, counted eligibility, and provider evidence.

5. Verify.
   - Run focused monitor tests.
   - Run public discovery and boundary monitor scripts.
   - Run spec tests covering runtime semantics.

## Non-Goals

- No new runtime execution capability.
- No ABI migration away from WASI Preview 1 stdin/stdout JSON.
- No broad sandbox certification claim.

