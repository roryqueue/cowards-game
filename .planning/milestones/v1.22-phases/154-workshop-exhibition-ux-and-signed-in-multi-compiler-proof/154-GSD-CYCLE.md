# Phase 154 GSD Cycle

## Discuss

Expose Zig only after proof passes, and keep labels clear that Zig and Rust are non-counted exhibition alpha.

## Plan

Add Zig Workshop source format, template, validation/save routing through runtime-service, account save support, result/replay evidence copy, and signed-in proof artifacts where local services allow.

## Execute

Added Zig Workshop UI selection, no-std Zig starter/template/sample, Zig runtime-service validation for Workshop and account revision saves, and public non-counted labels.

## Validate

`pnpm --filter @cowards/persistence test -- workshop --runInBand`, `pnpm lint`, and `pnpm typecheck` pass.

## Verify

Workshop can surface Zig as non-counted alpha after the local proof gate. Signed-in browser proof remains represented by the v1.22 artifact gate unless full local services are run.

