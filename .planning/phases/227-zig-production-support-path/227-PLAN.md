# Phase 227 Plan: Zig Production Support Path

## Objective

Promote Zig from non-counted WASM/WASI exhibition beta to counted provider support through explicit no-std/import policy, immutable artifact evidence, runtime-service validation/build ownership, provenance-gated counted entry, product surfaces, and verification.

## Tasks

1. Promote Zig in shared provider semantics.
   - Mark Zig counted eligible and normal-play enabled.
   - Keep WASI Preview 1 stdin/stdout JSON as the active Zig ABI.
   - Preserve no-std/import-audited language constraints.

2. Harden Zig provider provenance.
   - Runtime-service must produce Zig provider-validation metadata.
   - Bind provenance to source hash/bytes and artifact hash/bytes.
   - Fail closed without configured provider-validation signing secret.
   - Do not let local builders mint provider provenance.

3. Promote Zig validation/build metadata.
   - Remove Zig `NON_COUNTED_RUNTIME` validation warnings.
   - Keep `@import("std")`, filesystem, network, time, random, process, env, and embed-file rejections.
   - Emit immutable artifact metadata with toolchain, target, WASI profile, ABI, source/artifact hashes, validation status, and compatibility data.

4. Update entry and persistence gates.
   - Allow counted Zig only with exact runtime metadata, artifact metadata, decoded artifact bytes, and matching provider proof.
   - Reject stale, missing, mismatched, mutable-source, and local-builder Zig paths.

5. Update product surfaces and docs.
   - Show Zig as counted eligible where provider proof exists.
   - Preserve historical non-counted governance on old MatchSets.

6. Review and verify.
   - Run focused code review and fix findings.
   - Run spec, runtime-wasm-wasi, runtime-service, persistence, web, and Go verification.

## Non-Goals

- Do not add broad Zig std/package ergonomics.
- Do not migrate away from WASI Preview 1 stdin/stdout JSON.
- Do not execute Zig source directly in web/API/Go.
- Do not claim broad production sandbox certification for arbitrary WASM/WASI programs.
