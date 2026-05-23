# v1.14 Stack Research

**Milestone:** Generic Strategy Artifact and Runtime Boundary Contract
**Date:** 2026-05-23

## Keep

- TypeScript monorepo and `@cowards/spec` as the canonical type/schema source.
- `@cowards/service` and TypeScript service behavior as parity oracle/reference where needed.
- Go backend for selected live API ownership and future artifact consumption.
- TypeScript worker/runtime for hostile Strategy execution and Match completion.
- Existing PostgreSQL schema unless a phase proves an additive artifact metadata migration is required.

## Add Or Extend

- Spec-owned Strategy Artifact schemas/types and fixtures.
- Generated Strategy artifact manifests for Starter, Advanced, and Workshop template/source registries.
- Stale-output and checksum gates for generated artifacts.
- Go manifest loader and parity tests that consume generated JSON data only.
- `strategy-runtime-abi-v1.14` schemas, fixtures, conformance helpers, and adapter bridge metadata.
- Shared public forbidden-field contract exported from spec and consumed by service, replay, analytics, Go tests, topology, and monitors.
- Repeatable live topology/replay realism evidence command or script.

## Do Not Add

- Go Strategy execution.
- Web/API Strategy execution.
- Node `vm` as a security boundary.
- Production sandbox promotion.
- Counted non-JS public play.
- Broad ORM/migration rewrite.
- New cloud, service mesh, Kubernetes, or observability stack.
