# Phase 236 Plan: TinyGo WASM/WASI Spike

## Tasks

1. Add `tinygo-wasi:spike` and `tinygo-wasi:spike:check` scripts.
2. Generate JSON and Markdown evidence under `.planning/artifacts`.
3. Attempt TinyGo WASI compile when the local toolchain exists.
4. Record toolchain-unavailable or compile-failed as public-safe failure evidence.
5. Keep TinyGo absent from supported language registries and production pickers.

## Verification

- `pnpm tinygo-wasi:spike`
- `pnpm tinygo-wasi:spike:check`
- Registry/UI assertions that TinyGo remains spike-only.
