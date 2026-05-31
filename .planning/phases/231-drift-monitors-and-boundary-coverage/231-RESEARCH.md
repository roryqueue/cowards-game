# Phase 231 Research: Drift Monitors and Boundary Coverage

## Inputs Reviewed

- `.planning/REQUIREMENTS.md` MON-01..MON-05.
- `.planning/phases/231-drift-monitors-and-boundary-coverage/231-CONTEXT.md`.
- `scripts/check-boundary-monitors.ts` and tests.
- `scripts/check-service-boundary-imports.ts` and tests.
- `scripts/check-public-discovery-boundary.ts`.
- `packages/spec/src/runtime.ts`.
- `apps/web/lib/runtime-labels.ts`.

## Findings

- The main boundary monitor still contained active "Python must remain non-counted" assertions even after Phase 225 promoted Python through provider proof.
- The runtime broker registry artifact still recorded Python/Rust/Zig entries as experimental/non-counted.
- Older runtime isolation source checks still searched for beta-era markers like `NON_COUNTED_RUNTIME` and non-counted Workshop labels.
- The suite had import-boundary coverage for JS/Python runtime packages but not the WASM/WASI runtime package.
- There was no dedicated direct-language-special-case monitor for active product branches on `typescript`, `python`, `rust`, or `zig`.

## Implementation Direction

- Preserve historical artifacts, but convert active monitors to assert current v1.32 provider-gated counted support.
- Add a narrow, documented allowlist for product language-special-case boundaries.
- Keep service/public discovery import monitors strict for runtime implementation packages.
- Add tests proving the new direct-special-case and WASM/WASI import monitors fail when they should.

