# Phase 159 Plan

1. Generate `.planning/artifacts/v1.23-abi-readiness-evidence.json`.
2. Generate `.planning/artifacts/v1.23-abi-readiness-decision.md`.
3. Keep Preview 1 stdin/stdout JSON as the only active Match execution ABI.
4. Record direct-export and component model/WIT as not promoted, with required future gates.
5. Validate via the ABI mismatch probe in `pnpm wasm-wasi:beta-evaluate:check`.
