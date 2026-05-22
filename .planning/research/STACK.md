# Stack Research: v1.8 Production Boundary Hardening

**Date:** 2026-05-22
**Milestone:** v1.8 Production Boundary Hardening
**Scope:** Stack additions/changes only. Preserve the v1.7 TypeScript service/runtime contracts, deterministic engine, Chronicle privacy model, experimental Python ABI spike, and read-only Go backend spike.

## Summary

v1.8 should add boundary artifacts, drift checks, and local orchestration around the existing stack, not replace the stack. Keep `@cowards/spec` as the contract source of truth, generate OpenAPI/JSON Schema from it, keep Next routes migrating toward `@cowards/service`, keep Go read-only, and evaluate hostile Strategy isolation through prototypes that report evidence rather than claiming production readiness.

The only default third-party stack addition recommended for v1.8 is `@redocly/cli` as a dev dependency to lint generated OpenAPI. Zod 4.4.3 already provides first-party JSON Schema conversion, so start with a small generator in `@cowards/spec` instead of adding a new schema DSL. Add `openapi-typescript` or `@asteasolutions/zod-to-openapi` only if the first generator becomes materially painful.

Runtime hardening should compare Docker container subprocess, gVisor/runsc, Firecracker microVM, Wasmtime/WASI, Deno permissions, and plain subprocess/worker baselines, but the implementation output should be a prototype harness, threat matrix, and tests. Do not promote any non-JS runtime to counted play or use Node `vm` as a security boundary.

## Recommended Stack Moves

### Contract Artifact Generation

- Add `packages/spec/src/service-schemas.ts` or equivalent Zod schema exports for every v1.8 service DTO that needs public artifact output. Do not generate from TypeScript interfaces alone; runtime schemas are the durable source.
- Add a script such as `packages/spec/scripts/generate-service-openapi.ts` that emits `artifacts/service-api-v1.8.openapi.json` from `SERVICE_API_ROUTES`, service DTO schemas, and shared error schemas.
- Target OpenAPI 3.1.x for v1.8 even though OpenAPI 3.2.0 is current. OpenAPI 3.1 aligns well with JSON Schema 2020-12 and has broader tool compatibility for current TypeScript generators.
- Add `@redocly/cli@2.31.4` as a dev dependency and a script such as `pnpm contract:lint` to validate the generated artifact.
- Keep generated artifacts committed only if roadmap phases need stable review diffs; otherwise generate during CI and compare against a checked fixture hash.

Integration points:

- `packages/spec` owns schemas, route ids, version constants, privacy guards, and artifact generation.
- `packages/service` uses the same schemas to validate outgoing DTOs on representative endpoints.
- `apps/go-backend` consumes the generated OpenAPI/JSON fixtures as parity input, not as canonical source.

### Next/Web Route Migration

- Continue using Next App Router Route Handlers and server loaders, but route all migrated reads through `@cowards/service`.
- Add import-boundary checks that fail if migrated `apps/web/app/**` paths import `@cowards/persistence` directly instead of `@cowards/service`.
- Use Next's `RouteContext` helper for typed dynamic route params where route handlers expose HTTP service paths; do not build a separate HTTP client for same-process web reads yet.

Integration points:

- `apps/web/app/**/server.ts` should call typed service functions.
- `@cowards/service` remains the seam between web and persistence.
- `eslint-plugin-boundaries` plus a focused `rg`/AST smoke script can enforce migration without introducing a framework.

### Go Read-Only Parity

- Keep `apps/go-backend` on the Go standard library for now: `net/http`, `encoding/json`, `testing/httptest`, and `embed` for committed fixtures.
- Extend the Go spike from static maps to fixture-backed read-only endpoints for health, public MatchSet summary, replay metadata, and selected analytics summaries.
- If a phase requires reading safe local PostgreSQL data directly, add `github.com/jackc/pgx/v5` then, but do not add it before fixture-backed parity is exhausted.
- Keep Go DTOs generated or checked against fixtures/OpenAPI; do not hand-maintain independent DTO truth.

Integration points:

- `packages/golden` or `packages/spec` should emit Go-readable JSON fixtures.
- `apps/go-backend` tests should compare parsed canonical values and privacy markers, not raw JSON bytes.
- Web integration should remain opt-in through local env/config for narrow read-only routes.

### Sandbox Hardening Prototype

- Build a local sandbox comparison harness around the existing runtime ABI: same Strategy source, same ABI envelope, same timeout/output caps, same public failure taxonomy.
- Compare these candidates:
  - Existing worker thread: dev fallback only, not hostile isolation.
  - Existing Node subprocess: useful baseline, shell disabled, still not production hostile isolation.
  - Docker container subprocess: keep `--network none`, `--read-only`, tmpfs scratch, memory/CPU/PID limits, dropped capabilities, and no shell.
  - gVisor/runsc: evaluate as an OCI-compatible stronger container runtime where available.
  - Firecracker: evaluate isolation and operational cost; expect high setup complexity around jailer, cgroups, rootfs, kernel, networking, cleanup.
  - Wasmtime/WASI: promising for capability-style host calls, but only for languages/toolchains that can compile to the accepted ABI.
  - Deno permissioned runtime: useful comparison for JS/TS semantics, but not enough by itself because some default module/cache behavior and subprocess/FFI permissions need careful closure.
- Produce evidence: attack matrix, bypass attempts, startup latency, timeout behavior, memory pressure behavior, stdout/stderr cap behavior, host filesystem/network probes, and failure classification.

Integration points:

- Keep all candidates behind `StrategyExecutionAdapter`.
- Keep runtime metadata in `@cowards/spec` with readiness and counted-play eligibility.
- Add no production sandbox dependency to counted play in v1.8.

### Non-JS Strategy Product Semantics

- Use existing registry metadata; add no new editor/runtime stack for production language support.
- Define product-level semantics in spec/docs: language labels, experimental badges, compatibility warnings, source/package metadata display, validation wording, docs/examples, and counted-play ineligibility.
- Keep Python runtime dev/test only. Do not add package installation, lockfile resolution, or public Workshop language switching for counted play.

Integration points:

- `@cowards/spec` language and adapter registry records drive UI labels and compatibility messages.
- Workshop can display experimental metadata only where explicitly scoped; submission should continue to fail closed for counted play.

### Cross-Process Local Harness

- Extend existing `pnpm services:up`, `preflight`, `turbo`, and Go smoke scripts into a v1.8 boundary harness such as `pnpm boundary:dev` and `pnpm boundary:smoke`.
- Prefer a TypeScript script plus shell wrappers over a new process manager. It should start or validate web, worker/runtime adapter, TypeScript service, Go read-only service, Postgres, Redis, fixture loading, and smoke requests.
- If containerizing the local topology, use Compose healthchecks and `depends_on: condition: service_healthy`; do not introduce Kubernetes, Tilt, or production deployment tooling.

Integration points:

- `compose.yaml` already defines Postgres 18 and Redis 8 healthchecks.
- Add Go service health and contract smoke endpoints to the harness.
- Smoke requests should cover TS service health, Go health, public MatchSet summary, replay metadata, analytics summary, runtime adapter metadata, and privacy-marker absence.

### Lightweight Monitors

- Add test/script monitors, not a full observability stack:
  - Contract drift: generated OpenAPI/schema diff plus Redocly lint.
  - Privacy drift: public DTO recursive leak scanner reused across service, replay, analytics, exports, and Go responses.
  - Runtime bypass: import-boundary checks proving web/API paths do not import or execute Strategy runtime entrypoints.
  - Adapter drift: registry compatibility snapshot comparing ABI version, adapter id/version, language id/version, limits, and counted-play eligibility.
  - Go/TS parity: fixture-backed canonical JSON comparison for each Go read-only endpoint.
- Keep monitors in `pnpm test:fast` or a v1.8 `pnpm boundary:check` script so they are cheap enough to run locally.

## Options Compared

| Decision | Recommended | Why | Do Not Choose Yet |
| --- | --- | --- | --- |
| Contract artifact generation | Zod 4 schemas in `@cowards/spec` plus `z.toJSONSchema()` and small OpenAPI composer | Uses existing Zod 4.4.3 and keeps schema truth in the current package | OpenAPI-first rewrite, TypeSpec migration, gRPC/protobuf |
| OpenAPI version | OpenAPI 3.1.x for emitted artifact | Strong JSON Schema fit and broad current tooling support | OpenAPI 3.2.0 as default before all chosen tools support it cleanly |
| OpenAPI validation | `@redocly/cli@2.31.4` dev dependency | Purpose-built linting with minimal runtime impact | Swagger UI/docs portal as milestone scope |
| TS client generation | Defer `openapi-typescript@7.13.0` | TS already owns source schemas; generated TS would mostly round-trip itself | Generated client as required architecture |
| Zod/OpenAPI helper | Defer `@asteasolutions/zod-to-openapi@8.5.0` unless metadata composition hurts | Built-in Zod JSON Schema is enough for the first artifact | Adding a second schema annotation layer immediately |
| Go parity | Standard library plus embedded fixtures first | Proves contract compatibility without DB ownership creep | Full Go backend rewrite, Go mutations, job claiming |
| Go DB access | Add `pgx/v5` only for an explicitly scoped read-only DB phase | Good driver, but not needed for fixture-backed parity | Premature data-access layer in Go |
| Sandbox path | Comparative prototype harness | Turns sandbox options into evidence under the same ABI | Declaring Docker, Deno, WASM, or Firecracker production-ready in v1.8 |
| Local topology | Existing pnpm/turbo/scripts plus Compose healthchecks | Matches repo workflow and keeps operations lightweight | Kubernetes, Helm, Terraform, cloud deploy stack |
| Monitoring | Fast contract/privacy/bypass/parity scripts | Catches v1.8 boundary regressions where they occur | Prometheus, OpenTelemetry, SIEM, dashboard stack |

## What Not To Add

- Do not recommend a full backend rewrite or move orchestration, writes, job claiming, Match execution, or Strategy execution to Go.
- Do not make Go structs, OpenAPI, or generated clients the canonical contract source.
- Do not add production non-JS Strategy support, package dependency management, public language switching for counted play, or non-JS ladder eligibility.
- Do not use Node `vm`, `vm2`, or same-process JavaScript contexts as a hostile-code security boundary.
- Do not treat Deno permissions, Docker flags, WASI, gVisor, or Firecracker as sufficient without hostile tests and operational evidence.
- Do not add gRPC/protobuf, GraphQL, TypeSpec, Kubernetes, service mesh, Prometheus/OpenTelemetry, or cloud deployment infrastructure in v1.8.
- Do not add broad API docs UX. A generated artifact and lint/check scripts are enough for this milestone.

## Implementation Notes

- Version constants should move to v1.8 deliberately: `SERVICE_API_VERSION`, generated artifact filenames, runtime adapter compatibility snapshots where behavior changes, and Go response checks.
- Schema generation must avoid unrepresentable Zod constructs in public artifact schemas. Keep transforms out of DTO artifact schemas or use type-preserving `.overwrite()` where needed.
- Public DTO artifact tests should fail on Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, and private runtime diagnostics.
- OpenAPI generation should include stable `operationId`s from `SERVICE_API_ROUTES`, shared `ServiceErrorDto`, and explicit public/owner/internal separation. Internal records should not appear in public artifacts.
- Cross-process smoke should use absolute service base URLs from env with safe localhost defaults, short timeouts, and clear diagnostics for unavailable optional Go/sandbox candidates.
- Sandbox prototype output should classify failures as Strategy violations vs system failures using the existing ABI taxonomy; container/runtime launch failures must not become player losses.
- Go fixture parity should decode JSON into structs/maps and compare canonical parsed values. Raw byte/hash comparison belongs only where serialization is explicitly the contract.

## Sources

- Zod 4.4.3 in repo and npm; official docs show first-party `z.toJSONSchema()` and note unrepresentable schema types. HIGH confidence. https://zod.dev/json-schema
- OpenAPI Specification v3.1.2 and v3.2.0 are current published specs; use 3.1.x in v1.8 for tooling compatibility. HIGH confidence. https://spec.openapis.org/oas/v3.1.2.html and https://spec.openapis.org/oas/v3.2.0.html
- Redocly CLI 2.31.4 current npm version; official docs support `redocly lint` for OpenAPI descriptions. HIGH confidence. https://redocly.com/docs/cli/commands/lint/
- Next.js Route Handlers docs, last updated 2026-03-31, describe App Router route handlers and typed `RouteContext`. HIGH confidence. https://nextjs.org/docs/app/getting-started/route-handlers
- Go `net/http` docs support method/path patterns and `Request.PathValue`; Go `embed` supports compile-time fixture embedding. HIGH confidence. https://pkg.go.dev/net/http and https://pkg.go.dev/embed
- Docker `run` docs cover `--read-only`, `--tmpfs`, resource flags, networking, and published-port caveats; Compose docs cover healthcheck-gated `depends_on`. HIGH confidence. https://docs.docker.com/reference/cli/docker/container/run/ and https://docs.docker.com/compose/how-tos/startup-order/
- Node.js docs explicitly state `node:vm` is not a security mechanism. HIGH confidence. https://nodejs.org/api/vm.html
- Wasmtime security docs describe import/export-only host interaction and WASI capability-based filesystem access. MEDIUM confidence for future sandbox evaluation, not production selection. https://docs.wasmtime.dev/security.html
- gVisor docs describe OCI runtime isolation boundaries and limitations such as higher-level runtime attacks and CPU side channels. MEDIUM confidence for future sandbox evaluation. https://gvisor.dev/docs/architecture_guide/intro/
- Firecracker jailer docs show cgroup, network namespace, chroot/pivot_root, uid/gid, and cleanup responsibilities. MEDIUM confidence for future sandbox evaluation. https://github.com/firecracker-microvm/firecracker/blob/main/docs/jailer.md
- Deno security docs show deny-by-default permissions but also caveats around module/cache behavior, subprocesses, and FFI. MEDIUM confidence for future sandbox evaluation. https://docs.deno.com/runtime/fundamentals/security/
- pgx v5 is the latest stable major PostgreSQL driver/toolkit for Go, but should be added only if v1.8 explicitly needs direct DB reads. MEDIUM confidence. https://github.com/jackc/pgx
