# Research Summary: v1.8 Production Boundary Hardening

**Date:** 2026-05-22
**Milestone:** v1.8 Production Boundary Hardening

## Summary

v1.8 is a boundary-hardening milestone, not a product expansion or rewrite. Coward's Game should keep the TypeScript service, persistence workflows, worker, runtime adapters, engine, Chronicle, replay, and analytics as the authoritative execution path while making the v1.7 service/runtime/backend contracts harder to bypass, easier to verify, and more useful for future migration.

The recommended approach is contract-first and parity-first. `@cowards/spec` should remain the source of truth for service route metadata, DTO schemas, privacy classes, runtime ABI metadata, adapter compatibility, and counted-play eligibility. Generated artifacts, Go parity fixtures, local topology smoke checks, and drift monitors should flow outward from that source rather than becoming independent sources of truth.

The main risks are scope creep and false confidence: Go becoming a backend rewrite, sandbox prototypes being mistaken for production isolation, non-JS support implying counted-play readiness, generated contracts drifting from TypeScript schemas, and public DTOs leaking private Strategy data. Mitigate these with fail-closed checks, real fixtures, import guards, hostile-runtime probes, privacy scanners, and explicit anti-scope in requirements.

## Stack Additions

- Add generation-ready Zod service schemas in `@cowards/spec` for public/owner/internal DTOs that need artifact output; do not generate contracts from TypeScript interfaces alone.
- Add a small OpenAPI/JSON Schema generation path from the `@cowards/spec` route registry, targeting OpenAPI 3.1.x for current tool compatibility.
- Add `@redocly/cli` as the only default new third-party dev dependency to lint generated OpenAPI artifacts.
- Defer `openapi-typescript`, `@asteasolutions/zod-to-openapi`, TypeSpec, protobuf/gRPC, GraphQL, Kubernetes, service mesh, and production observability stacks unless a later phase proves they are needed.
- Keep Go on the standard library first: `net/http`, `encoding/json`, `testing/httptest`, and `embed` for fixture-backed read-only parity. Add `pgx/v5` only if an explicitly scoped local read-only Postgres phase needs it.
- Extend existing pnpm/turbo/Compose scripts into boundary harness commands such as `pnpm boundary:dev`, `pnpm boundary:smoke`, or `pnpm boundary:check`; do not introduce a process manager or deployment platform.
- Treat Docker container subprocess, gVisor/runsc, Firecracker, Wasmtime/WASI, Deno permissions, worker thread, and host subprocess as sandbox evaluation candidates only. Do not use Node `vm` or `vm2` as a security boundary.

## Feature Table Stakes

- Deterministic service contract artifact generation from canonical schemas, with stale-output detection and linting.
- Explicit service route registry binding route id, method, path, auth scope, privacy class, request/response schemas, shared error schema, operation id, examples, and fixture ids.
- Migrated Next route handlers and server loaders call `@cowards/service`; migrated web/API paths must not import persistence roots, migrations, worker entrypoints, runtime adapters, or Strategy execution modules directly.
- Public DTOs stay private-safe by default and must reject Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals.
- Go read-only parity covers health, public MatchSet summary, replay metadata, and one selected analytics summary using real golden fixtures or safe local persisted data.
- Go must not own writes, auth mutation, Strategy submission, MatchSet creation, Match orchestration, job claiming, migrations, Strategy source retrieval, or Strategy execution.
- Sandbox hardening produces a harness, hostile fixture matrix, threat comparison, resource-limit notes, startup/operability findings, and failure taxonomy evidence; it does not promote a production sandbox.
- Runtime failures keep Strategy violations separate from system failures, and public failure output remains privacy-safe.
- Non-JS Strategy semantics expose language/runtime/package metadata, experimental labels, compatibility warnings, validation codes, docs/examples hooks, and counted-play ineligibility.
- JS/TS remains the only fully enabled counted runtime in v1.8. Python and any other non-JS runtimes remain experimental unless promotion criteria are explicitly proven in a later milestone.
- A repeatable local cross-process topology starts or verifies web, TypeScript service path, worker/runtime adapter, Go read-only service, fixtures, health checks, smoke requests, and privacy-safe diagnostics.
- Boundary monitors fail on service contract drift, DTO privacy leaks, web/API runtime execution bypasses, migrated-route persistence imports, adapter compatibility drift, and Go/TypeScript parity drift.

## Architecture Direction

Keep the architecture centered on a single authoritative contract path:

```txt
@cowards/spec route/runtime schemas
  -> generated service artifacts and golden fixtures
  -> @cowards/service TypeScript implementation
  -> Next route/page callers and TS reference responses
  -> apps/go-backend read-only parity responses
  -> drift monitors for schemas, privacy, imports, adapters, and Go/TS outputs
```

`@cowards/service` should expand from a narrow read facade into the typed boundary for migrated routes. Persistence remains an implementation detail behind service methods. Next app server modules may handle cookies, forms, session normalization, and UX mapping, but game rules and persistence workflow access should not live in React components or migrated route handlers.

Go should be fixture-backed first, with an optional local read-only Postgres mode only after fixture parity passes. Its route surface must be allowlisted, GET-only except health, and contract-shaped from TypeScript-produced DTO evidence. Compare parsed canonical values rather than raw JSON bytes except where serialization or hashes are explicitly the contract.

Strategy execution remains behind worker/runtime adapter boundaries. The sandbox harness should reuse the existing ABI envelope, limits, timeout semantics, output caps, and failure taxonomy, but it must stay separate from live counted Match execution. Runtime metadata and readiness belong in `@cowards/spec`, with executable adapter drift checks proving the registry and implementation agree.

Non-JS product semantics should be registry-driven. Strategy Revisions can carry immutable language id/version, ABI version, adapter id/version, source/package metadata, capability limits, readiness, compatibility keys, and counted-play eligibility, but the product must fail closed for non-JS counted MatchSets, ladders, and gauntlets.

## Watch Outs

- Do not turn generated OpenAPI, generated clients, Go DTOs, or hand-authored fixtures into competing schema sources.
- Do not call a route migrated because the page still renders; require service-layer equivalence, privacy checks, and import-boundary proof.
- Do not expose private Strategy or runtime data through public contracts, examples, Go responses, diagnostics, logs, exports, analytics, or replay metadata.
- Do not promote Go beyond read-only parity. No Go mutations, orchestration, jobs, Match execution, Strategy execution, auth mutation, or migrations in v1.8.
- Do not let sandbox evaluation alter runtime defaults, counted-play eligibility, or player outcomes.
- Do not optimize sandbox candidates for local ergonomics while ignoring filesystem, network, environment, shell, time, randomness, memory, stdout/stderr, malformed IPC, and timeout probes.
- Do not let local topology silently fall back to in-process paths when a boundary process is unavailable.
- Do not make monitors warning-only or snapshot-only; they should fail locally/CI with actionable diagnostics.
- Do not broaden v1.8 into durable ratings, public tournaments, package registries, official non-JS language launch, production sandbox replacement, or wholesale backend migration.

## Recommended Phase Shape

1. **Generated Contracts and Route Boundary Migration**  
   Build the `@cowards/spec` route contract registry, generation-ready schemas, OpenAPI/JSON Schema artifact path, Redocly lint, and initial migrated-route import guards. Migrate only low-risk public reads first. This phase should prove stale contract detection, DTO privacy assertions, and service equivalence.

2. **Go Read-Only Parity Against Real Fixtures**  
   Promote `apps/go-backend` from static spike to fixture-backed read-only service for health, public MatchSet summary, replay metadata, and one selected analytics summary. Exit only when Go/TS parsed DTO parity, deterministic ordering, public error shape, privacy redaction, and route allowlist tests pass.

3. **Sandbox Prototype Evaluation**  
   Build a separate harness that runs the shared ABI and hostile Strategy matrix across practical candidates: worker, host subprocess, container subprocess, Deno, WASI/Wasmtime, gVisor where available, and Firecracker as an operational comparison if feasible. Output an evaluation report and explicit non-promotion decision.

4. **Non-JS Product Semantics**  
   Define registry-driven language labels, source/package metadata, compatibility warnings, validation messages, docs/examples hooks, and counted-play eligibility behavior. Keep Python and any other non-JS runtime experimental, blocked from counted play, and clearly labeled wherever surfaced.

5. **Cross-Process Local Topology**  
   Add a repeatable local boundary command or documented script that starts/checks web, TypeScript service path, worker/runtime adapter, Go read-only backend, fixtures, health endpoints, and smoke requests. Diagnostics should identify the serving process, contract version, fixture id, component, endpoint, and mismatch path without leaking private data.

6. **Drift, Privacy, and Bypass Monitors**  
   Compose the milestone release gate: generated contract drift, public DTO leak scanning, migrated-route persistence import checks, web/API runtime execution bypass checks, adapter registry drift snapshots, Go/TS parity checks, and boundary topology smokes. This phase should harden checks added earlier, not discover all issues for the first time.

## Open Decisions

- Which routes are in the first v1.8 migration slice after public MatchSet summary and replay metadata: public profile, public Strategy card, ladder reads, analytics summaries, or another low-risk read family.
- Whether generated service artifacts are committed as reviewable files or generated in CI and compared against a checked fixture hash.
- Exact OpenAPI artifact location and version naming, likely `service-api-v1.8` under `packages/spec` or `artifacts/`.
- Whether Go v1.8 stops at embedded golden fixtures or includes an explicitly scoped local read-only Postgres mode.
- Which analytics summary endpoint is selected for Go parity, and which real fixture covers degraded/system-failed evidence states.
- Which sandbox candidates are feasible in local/CI for v1.8 versus documented only as operational comparisons.
- How visible experimental non-JS metadata should be in Workshop without creating a public language picker that implies support parity.
- What promotion criteria a future milestone would require before any non-JS runtime or sandbox candidate can become counted-play eligible.
- Which monitors enter `pnpm test:fast` immediately versus a separate `pnpm boundary:check` until runtime and topology costs are stable.
