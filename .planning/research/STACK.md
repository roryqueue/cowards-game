# Stack Research: v1.7 Runtime and Backend Boundary Stabilization

**Date:** 2026-05-22
**Milestone:** v1.7 Runtime and Backend Boundary Stabilization

## Existing Stack To Preserve

- TypeScript pnpm monorepo with `apps/web`, `apps/worker`, and shared packages.
- `@cowards/spec` owns shared DTOs, zod schemas, compatibility versions, analytics contracts, privacy checks, competition contracts, and canonical game types.
- `@cowards/engine` remains pure and deterministic; it consumes runtime results and must not learn about web, persistence, process, or language details.
- `@cowards/replay` owns Chronicle validation, hashing, projection, reconstruction, and replay privacy.
- `@cowards/runtime-js` owns current JS/TS Strategy validation, immutable revision building, worker-thread, Node subprocess, and container-subprocess adapters.
- `@cowards/persistence` owns PostgreSQL-backed orchestration, MatchSet, Workshop, auth, analytics, ladder, profile, and governance services.
- `apps/web` Next route handlers currently call persistence-facing server modules directly.

## Stack Additions Recommended

### Contract Package Surface

Add explicit service/API and runtime ABI contracts to the existing package layout rather than creating a separate contract repo in v1.7.

Recommended shape:

- Extend `packages/spec` with API DTO schemas, runtime ABI schemas, language/runtime adapter metadata, compatibility keys, and public privacy assertions.
- Add contract fixtures under either `packages/spec/src/fixtures` or a new `packages/test-utils/src/golden` module.
- Keep OpenAPI optional but useful: generate or hand-maintain a minimal OpenAPI document from the schema-owned DTOs once endpoints stabilize.

Primary source note: OpenAPI publishes versioned specs including v3.1.x and v3.2.0; its own site warns schemas help catch many errors but the prose spec is authoritative when schema and text disagree. This supports using OpenAPI as a boundary artifact, not the only source of truth. Source: https://spec.openapis.org/oas/

### Go Spike Stack

Use standard Go first:

- `net/http` for the minimal read-only service.
- `encoding/json` for DTO decode/encode.
- `database/sql` plus the existing PostgreSQL driver selected during implementation, only if the spike reads the database directly.
- Golden JSON fixtures from TypeScript tests as the parity source.

Primary source notes:

- Go's module system is the official dependency management path; `pkg.go.dev` lists module metadata and standard package docs.
- `encoding/json` `Encoder.Encode` emits JSON plus a trailing newline and the package has compatibility behavior around UTF-8 replacement and HTML escaping defaults. Golden tests should compare parsed canonical JSON or controlled normalized output, not raw strings by accident.
- `net/http/httptest` is available for HTTP tests.

Sources: https://pkg.go.dev/encoding/json and https://pkg.go.dev/net/http

### Non-JS Runtime Spike Stack

Python is the best user-reach spike for v1.7 unless the user later chooses backend/runtime symmetry over reach. Keep it deliberately tiny:

- A Python executable or module launched by the existing subprocess/container-style host.
- JSON over stdin/stdout with no shell invocation.
- No package installation in the first spike unless metadata and lockfile handling are explicitly scoped.
- Fixture coverage for valid action, invalid output, timeout, thrown exception, stdout/stderr cap, and memory limit violations.

Primary source note: Python subprocess docs recommend fully qualified executable paths for reliability, warn to read security considerations before `shell=True`, and state that subprocess does not implicitly choose a shell. This matches the no-shell ABI direction. Source: https://docs.python.org/3/library/subprocess.html

## Stack Additions To Avoid In v1.7

- Do not move orchestration to Go yet.
- Do not make Go the sole source of DTO truth yet.
- Do not introduce gRPC before the JSON API boundary is proven.
- Do not add broad package management for non-JS Strategies until the ABI and metadata model are locked.
- Do not treat Python subprocess execution as production hostile-code isolation; it is a parity spike behind the same boundary vocabulary.

## Versioning Implications

- Add explicit API contract version, runtime ABI version, runtime adapter id/version, and language id/version fields.
- Keep `runtime-js` compatibility intact while broadening `StrategyRuntimeName` beyond the current `"runtime-js"` literal.
- Include adapter version in MatchSet/analytics compatibility keys so comparisons fail closed when runtime behavior may differ.
