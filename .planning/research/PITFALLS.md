# v1.14 Pitfalls Research

**Milestone:** Generic Strategy Artifact and Runtime Boundary Contract
**Date:** 2026-05-23

## Artifact Pitfalls

- **Duplicating source in Go:** Hand-maintained Go copies of Starter/Advanced source will drift. Use generated manifests.
- **Losing lineage on saves:** Go already accepts `starterId`/`advancedId` but can drop lineage. Require source-hash matched artifact metadata.
- **Confusing public built-in source with owner-private source:** Built-in forkable source can be in manifests; account source remains owner-private by default.
- **Breaking StrategyRevision compatibility:** Add generic artifact metadata without invalidating existing public cards, account lists, and replay provenance.

## Runtime ABI Pitfalls

- **Paper ABI differs from actual execution:** Existing counted JS adapters use a smaller request shape. Phase 93 must close or explicitly bridge this.
- **Limit drift:** Timeout/source/memory/output limits appear in spec, runtime guards, worker config, and adapters. Centralize and test effective limits.
- **Failure taxonomy collapse:** Runtime violation, validation failure, and system failure must not become one public error bucket.
- **Private diagnostics leak:** Stack traces, stderr, host paths, source, and runtime internals must stay private and redacted by default.

## Go Ownership Pitfalls

- **Go executes Strategy source to validate parity:** Do not do this. Consume canonical validation metadata from generated artifacts and keep hostile execution worker-owned.
- **Silent TypeScript fallback:** Go-selected fork routes must fail closed on manifest/schema/privacy/topology failures.
- **Runtime ownership creep:** Go can create jobs only in scoped flows; it must not claim jobs, execute Matches, build Chronicles, or classify runtime failures.

## Privacy And Replay Pitfalls

- **Deny-list drift:** Service, replay, Go, analytics, topology, and monitor guards currently duplicate forbidden fields. Export one spec-owned contract.
- **Owner-private source exception broadens accidentally:** Source should return only on authenticated owner source routes with private/no-store behavior.
- **Replay realism evidence stays manual:** Go-created Match/replay changes need repeatable board bounds, visible piece, terrain, and browser canvas checks.
- **Artifacts expose private runtime internals in diagnostics:** Manifest, topology, and monitor outputs should carry provenance and public messages, not raw diagnostics.
