# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract
**Domain:** Generic Strategy artifacts, runtime ABI, Go artifact consumption, fork parity, privacy-safe outputs, replay board realism
**Researched:** 2026-05-23
**Confidence:** HIGH for repo-local artifact, runtime, Go route, privacy, and replay realism findings; MEDIUM for exact implementation sequencing until Phase 89 audits current drift in detail.

## Executive Summary

v1.14 should define the public contract around Strategy source and runtime execution before moving more backend/runtime ownership. v1.13 successfully promoted selected Go API routes but accepted Starter/Advanced fork deferral because Go cannot read library sources with parity. At the same time, the existing `strategy-runtime-abi-v1.7` is stricter on paper than the counted JS runtime path actually executes, and privacy deny lists are duplicated across service, replay, Go, analytics, topology, and monitor code.

The recommended milestone direction is to build a generic Strategy Artifact / Revision model, generate parity-safe manifests from TypeScript-owned source registries, freeze `strategy-runtime-abi-v1.14`, then let Go consume artifacts for Starter/Advanced forks without executing Strategy code. TypeScript service behavior remains the parity oracle where needed, but not the long-term backend path. TypeScript worker/runtime remains the execution owner unless a later milestone explicitly promotes a stronger hostile-code boundary.

## Stack Findings

- Preserve TypeScript web UI, `@cowards/spec`, `@cowards/service`, TypeScript worker/runtime, and PostgreSQL-backed Go API ownership.
- Add spec-owned Strategy artifact schemas and fixtures alongside existing StrategyRevision and runtime schemas.
- Generate JSON artifacts/manifests from TypeScript-owned Starter, Advanced, and Workshop template sources rather than hand-maintaining Go copies.
- Use Go manifest loading and checksum/stale gates similar to existing service fixture checks.
- Keep Go persistence/orchestration contracts practical, but keep Strategy execution outside Go/web/API processes.

## Feature Table Stakes

### Generic Strategy Artifacts

- Represent user-submitted revisions, server-native templates, Starter library entries, Advanced library entries, and future source-bearing examples through one contract.
- Include artifact kind, source hash, source bytes, validation report/status, runtime/language metadata, package metadata, source visibility, fork eligibility, lineage/derived-from fields, public metadata, and immutable Match eligibility.
- Preserve backward compatibility with current StrategyRevision IDs, account revision summaries, Starter/Advanced lineage, public cards, and owner-private source routes.

### Runtime ABI

- Define `strategy-runtime-abi-v1.14` as the strict public boundary between deterministic server/native orchestration and hostile runtime code.
- Require method-specific request/response schemas for `selectActivations` and `soldierBrain`.
- Enforce source hash, source bytes, byte caps, runtime metadata, adapter id/version, language id/version, package mode, required capabilities, and effective limits at the ABI boundary.
- Normalize failure taxonomy so runtime violations and system failures are consistently represented before persistence and public projection.

### Go Artifact Consumption

- Load generated Strategy artifact manifests in Go without executing source.
- Replace Go fork 501 stubs with manifest-backed Starter/Advanced fork writes only after parity passes.
- Preserve lineage on Go account saves when a submitted library/template source hash matches a manifest entry.
- Keep TypeScript service/reference behavior as the parity oracle, not silent fallback.

### Privacy And Replay Realism

- Centralize forbidden public fields for service, Go, replay, analytics, topology, monitors, OpenAPI artifacts, and browser-visible public replay text.
- Keep owner-private source retrieval as the only intentional public-contract exception, authenticated and `private, no-store`.
- Add repeatable live web-through-Go evidence that creates an exhibition, runs the TypeScript worker, checks replay metadata, and verifies board bounds plus visible piece sanity.

## Architecture Findings

- `StrategyRevision` is still source-bearing and hard-codes Starter/Advanced lineage. It is not yet a generic artifact model.
- Starter and Advanced libraries are TypeScript-only source registries. Hashes and validation are computed at runtime, not generated into a Go-readable manifest.
- Go fork routes are intentionally unavailable because library source manifests do not exist.
- Go create/save revision currently uses reduced source metadata validation and can lose Starter/Advanced lineage on saves that include `starterId` or `advancedId`.
- The runtime ABI exists in spec, but the counted JS runtime adapter path still uses a smaller `{ source, methodName, input, timeoutMs, outputByteLimit }` shape.
- Runtime limits and failure taxonomy can drift across spec defaults, runtime-js guards, worker config, sandbox probes, and adapter metadata.
- Privacy checks exist in multiple layers but use separate deny lists that can drift.
- Replay board realism has server-side and browser-side checks, but live Go-created Match/replay board validation is not yet a repeatable command.

## Watch Out For

- Do not make Go execute Strategy code, validate hostile code by running it, claim jobs, complete Matches, build Chronicles, classify runtime failures, or expose private replay internals.
- Do not treat Node `vm`, worker threads, or host subprocesses as production hostile-code security boundaries.
- Do not promote counted non-JS play, public language picker support, production sandbox promotion, Go migrations, full replay projection, owner-debug replay, or Workshop runtime/test/rerun ownership in this milestone.
- Do not leak Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, or private runtime internals in public/service/Go/topology/monitor outputs.
- Do not allow Go and TypeScript revision IDs, validation reports, source hashes, runtime metadata, lineage, or eligibility to diverge silently.

## Proposed Phase Structure

1. Phase 89: Boundary Baseline and Scope Lock.
2. Phase 90: Generic Strategy Artifact Contract.
3. Phase 91: Generated Strategy Artifact Manifest.
4. Phase 92: Runtime ABI v1.14 Contract.
5. Phase 93: JS Runtime Adapter Conformance.
6. Phase 94: Go Artifact Consumption and Fork Parity.
7. Phase 95: Privacy, Realism, Topology, and Promotion Gate.
