# Architecture Research: v1.17 Python Strategy Runtime Pilot

**Project:** Coward's Game
**Milestone:** v1.17 Python Strategy Runtime Pilot and Broker Contract Hardening
**Researched:** 2026-05-24

## Existing Baseline

v1.16 promoted the normal topology:

```text
web frontend -> Go backend -> isolated JS/TS Strategy runtime service
```

TypeScript remains accepted only as frontend, isolated JS/TS runtime service, runtime adapter support, parity/test/fixture/rollback support, quarantined lifecycle code, or explicitly deferred product surfaces. Go owns normal backend orchestration, persistence-facing API behavior, Match lifecycle, Chronicle persistence handoff, MatchSet scoring/status refresh, and selected public evidence delivery.

## Target v1.17 Shape

```text
web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation
                                                              |-> JS/TS runtime implementation
                                                              |-> Python experimental implementation
```

The Runtime Broker may still be implemented inside the existing runtime service process during v1.17, but the contract should be concrete enough that a future broker can front or replace it without changing Go orchestration, persistence, scoring, or public evidence semantics.

## New Or Modified Components

- Runtime registry artifact: machine-readable registry for JS/TS and Python implementations.
- Broker contract metadata: interface, health, selection, versioning, authority, package policy, and failure taxonomy.
- Strategy artifact schemas: source format expands beyond JS/TS and includes Python compile/package/eligibility metadata.
- Python validation path: parse/compile/policy checks with public-safe diagnostics.
- Python runtime implementation: hardened experimental subprocess host behind the runtime ABI.
- Runtime service selector: chooses JS/TS or Python implementation from runtime metadata and registry.
- Go client hardening: accepts Python metadata only through schemas and rejects counted/ranked eligibility.
- Workshop proof path: Python Starter Strategy and non-counted MatchSet/replay proof.
- Monitors/topology: fail on registry drift, ABI drift, Python execution outside runtime boundary, backend ownership creep, leaks, and premature counted eligibility.

## Build Order

1. Baseline and broker/registry contract.
2. Artifact metadata and eligibility.
3. Python submission validation.
4. Python runtime execution behind ABI.
5. Go non-counted orchestration and eligibility.
6. Workshop Starter Strategy and replay proof.
7. Final monitors, topology, privacy, and promotion gate.

## Boundary Rules

- Runtime implementation may execute Strategy code only behind the runtime ABI.
- Go may orchestrate and validate metadata, but not execute Strategy source.
- Web/API may author, submit, and display safe metadata, but not execute Strategy source.
- Public outputs must be projections, not runtime internals.
- Python failures must be visible as classified runtime/system failures, not masked by fallback.
