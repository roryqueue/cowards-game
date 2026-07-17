# Phase 260 Plan 22 Review Fix — Activation Inventory Supersession

## Finding

The first Plan-14 execution attempt failed closed before mutation. Its nine-file model was not executable:

- `versions.ts` and `integrity-authority.ts` still owned separate v1.17 current pointers;
- the arena/Set generator hashed `currentSelection` into all three Go outputs;
- TypeScript and Go default consumers still contained Phase-259-only guards;
- no writable successor database selection head existed;
- `.planning/artifacts/v1.37-integrity-authority.json` does not exist; the real integrity artifacts are current-independent files under `packages/spec/artifacts/`;
- the activation proof could not be both a rollback preimage member and its own output.

No selector, generated file, database row, protected file, gameplay behavior, or historical evidence changed.

## Approved behavior-preserving correction

Plans 260-27 through 260-33 supersede the invalid inventory:

1. invert TypeScript authority ownership and decouple candidate/current Go generation;
2. add one complete durable pending-to-active database selection head;
3. delegate DB-free runtime and static/DB-backed Workshop defaults;
4. enforce the head and frozen selection across TypeScript scheduling/jobs;
5. delegate Go scheduling/persistence boundaries;
6. build the real activation/recovery/compensation coordinator and postactivation proof;
7. run an isolated zero-finding seam audit and regenerate readiness.

The corrected final transaction owns five rollback selector files:

1. `packages/spec/src/current-semantic-authority-source.ts`;
2. `apps/go-backend/current_semantic_authority_generated.go`;
3. `packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json`;
4. `packages/golden/src/v1-37-conformance-corpus-pin.ts`;
5. `packages/golden/src/fixtures/v1-37-conformance-traces/registry.json`.

It writes `.planning/artifacts/v1.37-observation-v1.19-activation-transaction-proof.json` as an output receipt, not a preimage member. A tested coordinator uses short prepare/finalize transactions: the head retains v1.17 active while a durable exact v1.19 intent is pending, the success-path Git commit lands, and finalization binds its actual commit/tree plus the proof digest. Mixed or interrupted state remains non-counted and recoverable.

## Compatibility disposition

This is an authority/dependency correction only. Live current remains exact Phase 259 through Plans 27-33. No valid Match state, Action legality, event order, outcome, Strategy observation, arena geometry, Set result, Chronicle, public payload, or historical evidence may change. Any such delta remains an explicit-approval blocker.
