# Phase 153 GSD Cycle

## Discuss

Compare current Preview 1 stdin/stdout JSON against direct exports and component model/WIT without destabilizing Rust or Zig.

## Plan

Produce a decision record; skip any runtime-path change unless it is tiny, isolated, and non-promotional.

## Execute

Created `.planning/artifacts/v1.22-abi-evolution-decision.md`.

## Validate

The decision record recommends keeping Preview 1 stdin/stdout JSON as the only v1.22 execution ABI and deferring direct exports/component model to v1.23+.

## Verify

No alternate ABI path was added to runtime execution.

