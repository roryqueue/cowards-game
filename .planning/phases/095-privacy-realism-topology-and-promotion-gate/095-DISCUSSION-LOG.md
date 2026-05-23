# Phase 95: Privacy, Realism, Topology, and Promotion Gate - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 95 - Privacy, Realism, Topology, and Promotion Gate

## Discussion Summary

Phase 95 discussion confirmed the final gate defaults. The user approved a centralized forbidden-field contract, strict public-output privacy, owner-private source as the only source-returning exception, repeatable web-through-Go topology evidence, expanded board realism checks, monitor drift failures, preserved offense baselines, and a final promotion/defer decision.

## Decisions

### 1. Forbidden Public Fields

Decision: centralize the forbidden public-field contract in spec and reuse it across service, Go, replay, analytics/export, OpenAPI, topology, monitor, and browser-visible checks.

Rationale: privacy drift should fail from one contract rather than from duplicated local deny lists.

### 2. Public Output Privacy

Decision: public/service/Go/topology/monitor outputs must omit Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, DB DSNs, and private runtime internals by default.

Rationale: v1.14 introduces more source and runtime metadata; public-output safety must remain a hard gate.

### 3. Source Exception

Decision: authenticated owner-private source retrieval remains the only source-returning exception, with ownership checks and private/no-store behavior.

Rationale: source is necessary for owner workflows but must not leak through public DTOs or generated evidence.

### 4. Topology Evidence

Decision: require repeatable live web-through-Go topology evidence that creates a Go-owned exhibition, runs the TypeScript worker, fetches replay metadata, and records privacy-safe output.

Rationale: final promotion should prove the actual cross-process path, not only static route metadata.

### 5. Board Realism

Decision: expand replay/match creation realism checks for valid bounds, canonical starting positions, in-bounds terrain, in-bounds visible Soldiers, and browser replay canvas nonblank/non-clipped behavior.

Rationale: backend ownership changes can create believable-looking but physically invalid replay states unless checked directly.

### 6. Monitor Drift

Decision: boundary monitors fail on ABI drift, artifact manifest drift, adapter metadata drift, privacy deny-list drift, unexpected Strategy execution, unsafe fallback, report-only offense increases, or runtime ownership creep.

Rationale: final evidence must keep future drift visible.

### 7. Offense Baseline

Decision: preserve `strict_offenses=0` and `report_only_offenses=29` unless explicitly rebaselined.

Rationale: v1.14 should not hide new broad web boundary drift while promoting selected Go surfaces.

### 8. Promotion Decision

Decision: end with a final v1.14 promotion decision covering artifact manifests, ABI conformance, Go fork routes, privacy gates, replay realism, topology/no-fallback evidence, and deferred surfaces.

Rationale: the milestone goal is not just implementation; it is a clear boundary decision for what is promoted versus deferred.

## Deferred Ideas

None.
