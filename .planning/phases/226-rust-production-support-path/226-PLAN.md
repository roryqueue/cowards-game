# Phase 226 Plan: Rust Production Support Path

## Objective

Promote Rust from non-counted WASM/WASI exhibition beta to counted provider support through immutable artifact evidence, runtime-service validation/build ownership, provenance-gated counted entry, product surfaces, and verification.

## Tasks

1. Promote Rust in shared provider semantics.
   - Mark Rust counted eligible and normal-play enabled in the supported-language registry.
   - Keep Zig non-counted exhibition beta.
   - Keep WASI Preview 1 stdin/stdout JSON as the active Rust ABI.

2. Harden Rust provider provenance.
   - Require runtime-service to produce Rust provider validation metadata.
   - Bind provenance to source hash, source byte count, artifact hash, and artifact byte count.
   - Fail closed without configured provider-validation signing secret.
   - Do not let local builders mint counted provider provenance.

3. Promote Rust validation/build metadata.
   - Remove Rust `NON_COUNTED_RUNTIME` validation warnings.
   - Emit immutable artifact metadata with toolchain, target triple, WASI profile, ABI envelope/version, source hash, artifact hash/bytes, validation status, and compatibility data.
   - Keep artifact bytes private by default in public output.

4. Update entry and persistence gates.
   - Allow counted Rust only with exact runtime metadata, artifact metadata, and matching provider proof.
   - Reject stale, missing, mismatched, mutable-source, and local-builder Rust paths.
   - Preserve Zig non-counted exhibition beta behavior.

5. Update product surfaces and docs.
   - Show Rust as counted eligible where provider proof exists.
   - Keep Zig beta labels and unranked copy.
   - Preserve historical non-counted governance on old MatchSets.

6. Review and verify.
   - Run focused code review and fix findings.
   - Run spec, runtime-wasm-wasi, runtime-service, persistence, web, and Go verification.

## Non-Goals

- Do not promote Zig.
- Do not migrate away from WASI Preview 1 stdin/stdout JSON.
- Do not execute Rust source directly in web/API/Go.
- Do not execute mutable source during Match execution.
- Do not claim broad production sandbox certification for arbitrary WASM/WASI programs.

## Verification

- `pnpm --filter @cowards/spec typecheck`
- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/runtime-wasm-wasi typecheck`
- `pnpm --filter @cowards/runtime-wasm-wasi test`
- `pnpm --filter @cowards/runtime-service typecheck`
- `pnpm --filter @cowards/runtime-service test -- server execute-match`
- `pnpm --filter @cowards/persistence typecheck`
- `pnpm --filter @cowards/persistence test -- workshop ladder competition`
- `pnpm --filter @cowards/web typecheck`
- `pnpm --filter @cowards/web test -- workshop/server runtime-labels evidence-copy result-view-model`
- `PATH=/usr/local/go/bin:$PATH go test ./...` from `apps/go-backend`
