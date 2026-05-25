# Phase 152 GSD Cycle

## Discuss

Artifact execution must fail closed on missing bytes, stale hash, unsupported metadata, or language/target mismatch.

## Plan

Make target triple validation language-aware, preserve hash/byte checks, and document rollback/compatibility evidence.

## Execute

Updated spec schemas, runtime adapter checks, runtime-service checks, and Go artifact validation to distinguish Rust `wasm32-wasip1` from Zig `wasm32-wasi`.

## Validate

Runtime and Go tests pass; v1.22 hardening evidence includes stale hash refusal.

## Verify

No source fallback is introduced. Artifact metadata remains the execution contract.

