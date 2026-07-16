# Verification

## v1.37 runtime ABI activation

Phase 258 activates the v1.17 runtime tuple only after the exact manifest passes. The durable receipt contains command IDs, owned test files, aggregate PASS counts, zero skipped counts, and database-presence booleans. It never contains commands, environment values, connection strings, raw output, durations, diagnostics, source, artifacts, memory, objectives, or host paths.

Run the post-activation proof from the repository root with the required database environment variables already configured:

```sh
pnpm exec tsx scripts/run-v1-37-runtime-abi-test-manifest.ts --stage postactivation --require-all --write-receipt
pnpm exec tsx scripts/check-v1-37-runtime-abi-manifest-closure.ts --write-final --check
pnpm exec tsx scripts/evaluate-v1-37-runtime-abi.ts --write --check
pnpm exec tsx scripts/prove-v1-37-atomic-activation.ts --write --check
pnpm contract:check
pnpm contract:lint
pnpm boundary:imports
pnpm public-discovery:check
pnpm boundary:monitors
pnpm lint
pnpm typecheck
pnpm build
```

The evaluator fails closed if the activation manifest, exact test receipt, canonical JSON corpus, runtime budget artifact, source-normalization identity, signed managed evidence roots, immutable v1.16 evidence, or TypeScript/Go wire parity drifts.

Passing Phase 258 does not certify a counted runtime lane. Production trusted producers and counted-eligible lanes remain empty until Phase 259 supplies executable full-state, event, memory, objective, and failure-trace conformance for every supported language.
