# Phase 51: Service Contract Generation and Route Migration - Research

**Researched:** 2026-05-22 [VERIFIED: system date]
**Domain:** TypeScript/Zod service contracts, OpenAPI 3.1 artifact generation, Next App Router route migration, import-boundary checks [VERIFIED: .planning/phases/51-service-contract-generation-and-route-migration/51-CONTEXT.md]
**Confidence:** HIGH for repository shape and current package versions; MEDIUM for exact implementation effort because several service DTOs currently exist as TypeScript interfaces without matching Zod schemas [VERIFIED: repo inspection]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Contract Artifact Policy
- **D-01:** Commit the generated v1.8 service contract artifact, expected to be `service-api-v1.8.openapi.json` or equivalent, so diffs are reviewable and downstream Go/parity work has a stable checked artifact.
- **D-02:** Add deterministic generation plus lint/stale checks. The generated artifact should be reproducible locally and CI should fail when checked output is stale.
- **D-03:** Prefer OpenAPI/JSON Schema generated from canonical Zod schemas in `@cowards/spec`; do not introduce a separate schema DSL or make generated artifacts the source of truth.

### First Route Migration Slice
- **D-04:** Keep the first migration slice tight: service health, public MatchSet summary, public replay metadata, and one additional public read that is already close to service shape.
- **D-05:** Do not include auth mutation, Strategy source retrieval, MatchSet creation, ladder mutations, Workshop execution, worker test-support routes, or analytics write/export routes in Phase 51 migration.
- **D-06:** The extra public read should be chosen for low migration risk and high boundary value. Good candidates are public player page, public Strategy page, or public ladder season read; analytics should wait unless planning proves a specific summary path is already schema-ready.

### Route Registry Shape
- **D-07:** Enrich the existing `SERVICE_API_ROUTES` source in `@cowards/spec` into metadata objects rather than adding a parallel generation registry.
- **D-08:** Route metadata should include stable route id, operation id, method, path, auth scope, privacy class, request schema, response schema, shared error schema, examples, and fixture references.
- **D-09:** Keep `@cowards/spec` the authoritative contract source; `@cowards/service`, generated OpenAPI, Go fixtures, and import guards should consume or validate against it.

### Import Guard Strictness
- **D-10:** Apply strict failing import guards to the named migrated route slice in Phase 51.
- **D-11:** Add a broader report-only scan over `apps/web/app` server modules to reveal remaining direct persistence/runtime imports without blocking Phase 51.
- **D-12:** The strict guard must fail if migrated web/API routes import persistence roots, migration code, worker entrypoints, runtime adapters, or Strategy execution modules directly.

### the agent's Discretion
- The planner may decide the exact additional public read in the first slice after inspecting code and tests, as long as it stays low-risk, public-safe, read-only, and already close to service shape.
- The planner may choose the artifact directory/name, but it should be versioned, deterministic, and easy for Phase 52 Go parity to consume.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Broad strict import enforcement across all `apps/web/app` server modules is deferred until after the named migrated-route guard is proven.
- Analytics route migration may happen in Phase 51 only if planning finds one public summary read already schema-ready; otherwise it is better left to later parity/monitoring work.
- Generated TypeScript clients, production API docs UX, GraphQL/gRPC/TypeSpec, and OpenAPI-first rewrites are out of scope for Phase 51.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEN-01 | Developer can regenerate a deterministic service contract artifact from canonical `@cowards/spec` route and DTO schemas. | Use a `packages/spec` generator fed by enriched `SERVICE_API_ROUTES`, Zod DTO schemas, and stable JSON output. [VERIFIED: packages/spec/src/service.ts, packages/spec/src/schemas.ts, Context7 Zod docs] |
| GEN-02 | Generated or generation-ready service artifacts include stable route ids, operation ids, methods, paths, auth scopes, privacy classes, request/response schemas, shared error schemas, examples, and fixture references for the v1.8 route surface. | Enrich each `SERVICE_API_ROUTES` entry into metadata objects with schema references and generation metadata. [VERIFIED: 51-CONTEXT.md D-07/D-08] |
| GEN-03 | Contract linting and stale-output checks fail when generated service artifacts drift from canonical schemas. | Add `contract:generate`, `contract:check`, and `contract:lint` scripts; Redocly CLI lint is the recommended validator. [VERIFIED: npm registry; CITED: https://github.com/redocly/redocly-cli/blob/main/docs/@v2/quickstart.md] |
| GEN-04 | Public, owner-authorized, and internal DTO schemas remain separated so public contract output excludes private persistence/runtime records by default. | Add privacy class metadata and public DTO leak tests over public examples/artifacts. [VERIFIED: packages/spec/src/service.ts; VERIFIED: .planning/research/PITFALLS.md] |
| GEN-05 | A named set of low-risk Next route handlers or server loaders moves from direct persistence workflow imports to the typed `@cowards/service` boundary. | Migrate health, public MatchSet summary, public replay metadata, and public Strategy page read through service methods. [VERIFIED: apps/web/app/api/service/health/route.ts; VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: apps/web/app/strategies/[strategyId]/page.tsx] |
| GEN-06 | Migrated routes preserve existing DTO behavior, deterministic ordering, compatibility fields, public error shapes, and privacy redaction. | Add equivalence tests around service DTOs and route/page helpers using current fixture patterns. [VERIFIED: packages/service/src/service.test.ts; VERIFIED: apps/web/app/matches/server.test.ts] |
| GEN-07 | Import-boundary checks fail if migrated web/API routes import persistence roots, migration code, worker entrypoints, runtime adapters, or Strategy execution modules directly. | Add strict direct-import guard for named files and a report-only wider scanner for `apps/web/app`. [VERIFIED: 51-CONTEXT.md D-10/D-12; VERIFIED: eslint.config.mjs] |
</phase_requirements>

## Summary

Phase 51 should make `@cowards/spec` the single source for service route metadata and generated service artifacts, then prove a small service-boundary migration slice without moving orchestration, writes, jobs, migrations, Strategy execution, or Go ownership. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/phases/51-service-contract-generation-and-route-migration/51-CONTEXT.md]

The current code has `SERVICE_API_VERSION = "service-api-v1.7"` and string-only `SERVICE_API_ROUTES`; `packages/spec/src/schemas.ts` has Zod schemas for service errors, health, auth session, and Strategy revision summaries, but not yet for public MatchSet summary, replay metadata, public page envelopes, player profile, Strategy card, or ladder season DTOs. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts]

**Primary recommendation:** Enrich `SERVICE_API_ROUTES` in `packages/spec/src/service.ts`, add generation-ready Zod schemas for the Phase 51 public read slice, emit committed `packages/spec/artifacts/service-api-v1.8.openapi.json`, lint it with `@redocly/cli`, and migrate the public Strategy page as the fourth read. [VERIFIED: repo inspection; VERIFIED: npm registry; CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Planning docs should be committed when updated. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Canonical route metadata | `@cowards/spec` package | `@cowards/service` consumes it | `SERVICE_API_ROUTES`, service DTO types, version constants, Zod schemas, and privacy guard already live in `packages/spec`. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts] |
| OpenAPI artifact generation | `@cowards/spec` package tooling | Root scripts for CI convenience | The artifact should derive from canonical spec schemas and be committed for reviewability. [VERIFIED: 51-CONTEXT.md D-01/D-03] |
| Redocly lint/staleness checks | Root/package scripts | CI/test gate | The repo already uses pnpm/turbo scripts for local gates. [VERIFIED: package.json; VERIFIED: turbo.json] |
| Public read service behavior | `@cowards/service` | `packages/persistence` behind service only | `@cowards/service` already imports persistence and exposes health, public MatchSet summary, and replay metadata methods. [VERIFIED: packages/service/src/index.ts] |
| Next route/page migration | Frontend server (`apps/web/app`) | `@cowards/service` | Migrated route handlers and server loaders should call service methods while React components stay rule-free. [VERIFIED: AGENTS.md; VERIFIED: apps/web/app/api/service/health/route.ts] |
| Import-boundary enforcement | Test/script layer | ESLint as existing baseline | Existing ESLint blocks runtime imports in web broadly, but Phase 51 needs stricter migrated-route persistence/migration/worker checks. [VERIFIED: eslint.config.mjs; VERIFIED: 51-CONTEXT.md D-10/D-12] |
| Future Go consumption | `apps/go-backend` read-only consumer | OpenAPI/artifacts from spec | The Go spike currently hand-shapes v1.7 health, MatchSet summary, and replay metadata DTOs, so Phase 51 artifact should be easy for Phase 52 parity to consume. [VERIFIED: apps/go-backend/main.go; VERIFIED: apps/go-backend/README.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | 4.4.3 current and installed | Canonical runtime schemas and JSON Schema conversion | Zod 4 exposes `z.toJSONSchema()`, and the repo already depends on Zod in `@cowards/spec`. [VERIFIED: npm registry; VERIFIED: pnpm list; CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx] |
| `@redocly/cli` | 2.31.4 current, not installed | Lint generated OpenAPI descriptions | Redocly CLI provides `redocly lint` for OpenAPI/API descriptions and supports built-in rulesets such as `recommended`. [VERIFIED: npm registry; CITED: https://github.com/redocly/redocly-cli/blob/main/docs/@v2/quickstart.md] |
| `typescript` | 6.0.3 installed | Typechecking and import parsing if a script uses the compiler API | Root dev dependencies include TypeScript 6.0.3. [VERIFIED: package.json] |
| `vitest` | 4.1.6 installed | Contract, staleness, privacy, and import guard tests | Package tests use Vitest across spec/service/web packages. [VERIFIED: package.json; VERIFIED: packages/spec/package.json; VERIFIED: packages/service/package.json] |
| `tsx` | 4.22.0 locally available via workspace dependency graph | Run TypeScript generator/check scripts | `pnpm exec tsx` works locally and `pnpm why tsx` shows it is available through the workspace. [VERIFIED: local command] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `openapi3-ts` | 4.5.0 current | Optional OpenAPI typing helpers | Defer unless manual object typing becomes noisy; not needed for first generator. [VERIFIED: npm registry; VERIFIED: .planning/research/STACK.md] |
| `@asteasolutions/zod-to-openapi` | Not installed; prior research recommends defer | Optional Zod/OpenAPI helper | Defer because Zod 4 JSON Schema conversion is sufficient for the first artifact. [VERIFIED: .planning/research/STACK.md; CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod 4 `z.toJSONSchema()` plus small OpenAPI composer | `@asteasolutions/zod-to-openapi` | Helper may reduce OpenAPI boilerplate later but adds a second annotation layer now. [VERIFIED: .planning/research/STACK.md] |
| Committed OpenAPI JSON artifact | CI-only generated artifact | Locked decision requires committed artifact for reviewable diffs and Phase 52 Go/parity stability. [VERIFIED: 51-CONTEXT.md D-01] |
| Direct-import guard script/test | Full dependency graph analyzer | Direct checks match D-12 wording and are low-risk; transitive checks would currently flag broad legacy facade files such as `apps/web/app/competitive/server.ts`. [VERIFIED: 51-CONTEXT.md D-12; VERIFIED: apps/web/app/competitive/server.ts] |

**Installation:**

```bash
pnpm add -D -w @redocly/cli@2.31.4
```

**Version verification:** `npm view zod version` returned `4.4.3`; `npm view @redocly/cli version` returned `2.31.4`; `npm view tsx version` returned `4.22.3`; local `pnpm exec tsx --version` returned `4.22.0`. [VERIFIED: npm registry; VERIFIED: local command]

## Architecture Patterns

### System Architecture Diagram

```txt
Developer edits @cowards/spec schemas and SERVICE_API_ROUTES
  -> packages/spec scripts/generate-service-openapi.ts
     -> Zod 4 z.toJSONSchema() component schemas
     -> OpenAPI 3.1 paths/operations from route metadata
     -> stable JSON serialization
  -> packages/spec/artifacts/service-api-v1.8.openapi.json
     -> Redocly lint
     -> stale-output check
     -> Phase 52 Go fixture/parity consumer

Next route/page request
  -> migrated route/page/server loader
  -> @cowards/service method
  -> packages/persistence read helper
  -> @cowards/spec Zod parse + public DTO leak guard
  -> Response/page DTO preserving existing behavior
```

All generated service artifacts must flow outward from `@cowards/spec`; OpenAPI must not become a hand-edited source of truth. [VERIFIED: 51-CONTEXT.md D-03/D-09]

### Recommended Project Structure

```txt
packages/spec/
├── artifacts/
│   └── service-api-v1.8.openapi.json      # committed generated artifact
├── scripts/
│   └── generate-service-openapi.ts        # generator with --check mode
└── src/
    ├── service.ts                         # enriched SERVICE_API_VERSION and SERVICE_API_ROUTES metadata
    ├── service-fixtures.ts                # small DTO examples and fixture refs for generated docs/tests
    └── schemas.ts                         # generation-ready Zod service DTO schemas

packages/service/src/
├── index.ts                               # add service methods for chosen read slice
└── service.test.ts                        # DTO equivalence and privacy tests

apps/web/app/
├── api/service/health/route.ts            # already service-backed
├── api/matchsets/[matchSetId]/route.ts    # named migrated route
├── matchsets/[matchSetId]/page.tsx        # named migrated server loader
└── strategies/[strategyId]/page.tsx       # recommended fourth read

scripts/
└── check-service-boundary-imports.ts      # strict slice check plus report-only app scan
```

The artifact location should be `packages/spec/artifacts/service-api-v1.8.openapi.json` because `packages/spec` owns the canonical route metadata and this path is easy for Phase 52 Go parity tooling to read without making Go canonical. [VERIFIED: packages/spec/src/service.ts; VERIFIED: .planning/research/STACK.md; VERIFIED: apps/go-backend/main.go]

### Pattern 1: Enrich `SERVICE_API_ROUTES` In Place

**What:** Replace each string route value with a metadata object while preserving `ServiceApiRouteId = keyof typeof SERVICE_API_ROUTES`. [VERIFIED: packages/spec/src/service.ts]

**When to use:** Use this for every existing service route id; do not add a second generator registry. [VERIFIED: 51-CONTEXT.md D-07]

**Example:**

```typescript
// Source: repo pattern + Phase 51 locked decision
export const SERVICE_API_ROUTES = {
  getPublicStrategyPage: {
    id: "getPublicStrategyPage",
    operationId: "getPublicStrategyPage",
    method: "GET",
    path: "/public/strategies/{strategyId}",
    authScope: "public",
    privacyClass: "public",
    request: {
      params: PublicStrategyPageParamsSchema,
      query: EmptyQuerySchema,
    },
    response: PublicPageServiceDtoSchema,
    error: ServiceErrorDtoSchema,
    examples: [publicStrategyPageExample],
    fixtureRefs: ["service:public-strategy-page:demo"],
  },
} as const
```

Planner should keep route ids stable and derive operation ids from metadata rather than parsing method/path strings. [VERIFIED: 51-CONTEXT.md D-08]

### Pattern 2: Zod 4 JSON Schema To OpenAPI 3.1

**What:** Convert Zod schemas to JSON Schema with `z.toJSONSchema()`, then assemble OpenAPI `openapi`, `info`, `paths`, `components.schemas`, and route responses. [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx]

**When to use:** Use for canonical DTO and params/query/body schemas that have no transforms or unrepresentable types. [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx]

**Example:**

```typescript
// Source: Zod JSON Schema docs + local verification
const schema = z.toJSONSchema(ServiceHealthDtoSchema)
```

Zod docs list `target`, `metadata`, `unrepresentable`, `cycles`, `reused`, and `uri` options; unrepresentable Zod constructs throw by default, which is useful for contract generation. [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx]

### Pattern 3: Deterministic Artifact Check

**What:** The generator should support a write mode and a `--check` mode that compares stable generated JSON with the committed artifact. [VERIFIED: 51-CONTEXT.md D-02]

**When to use:** Run `--check` in tests/CI and write mode during intentional contract updates. [VERIFIED: .planning/REQUIREMENTS.md GEN-03]

**Example:**

```typescript
// Source: repo script style + deterministic artifact requirement
const output = stableStringify(openapi) + "\n"
if (checkMode && existing !== output) {
  throw new Error("service-api-v1.8.openapi.json is stale; run pnpm --filter @cowards/spec contract:generate")
}
```

Use a stable key-sorting serializer for generated JSON so object construction order cannot create noisy diffs. [VERIFIED: 51-CONTEXT.md D-02]

### Pattern 4: Strict Named Slice Import Guard

**What:** Parse direct imports in named migrated files and fail on forbidden roots. [VERIFIED: 51-CONTEXT.md D-10/D-12]

**When to use:** Apply strictly to the Phase 51 route/page files; apply report-only to wider `apps/web/app` until later phases. [VERIFIED: 51-CONTEXT.md D-10/D-11]

**Example:**

```typescript
// Source: Phase 51 import guard decision
const forbidden = [
  "@cowards/persistence",
  "@cowards/persistence/",
  "packages/persistence/",
  "@cowards/worker",
  "@cowards/runtime-js/worker",
  "@cowards/runtime-js",
  "packages/runtime-js/",
]
```

Use TypeScript's parser or a small import-declaration scanner over static and dynamic import specifiers; direct regex over whole files is more likely to produce false positives from comments or strings. [VERIFIED: package.json TypeScript dependency; ASSUMED]

### Anti-Patterns to Avoid

- **Parallel route registry:** Do not add `SERVICE_OPENAPI_ROUTES` beside `SERVICE_API_ROUTES`; it would split route truth. [VERIFIED: 51-CONTEXT.md D-07]
- **Generating from TypeScript interfaces alone:** TypeScript interfaces are erased at runtime and cannot drive runtime DTO validation. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts]
- **Migrating through a legacy facade only:** If a server loader still calls a method implemented with persistence directly, the page rendering does not prove service-boundary migration. [VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: .planning/research/PITFALLS.md]
- **Broad strict web scan in Phase 51:** `apps/web/app/competitive/server.ts`, `apps/web/app/matches/server.ts`, and `apps/web/app/workshop/server.ts` still legitimately contain legacy direct persistence imports, so broad strict enforcement would fail unrelated scope. [VERIFIED: local rg scan]

## Recommended Route Slice

| Route/read | Current location | Phase 51 action | Confidence |
|------------|------------------|-----------------|------------|
| Service health | `apps/web/app/api/service/health/route.ts` | Keep service-backed; update version expectation to v1.8 and include in artifact. [VERIFIED: route file] | HIGH |
| Public MatchSet summary | `apps/web/app/api/matchsets/[matchSetId]/route.ts`, `apps/web/app/matchsets/[matchSetId]/page.tsx`, `competitiveServer.getMatchSetResult` | Keep behavior, ensure service-backed DTO path is covered by tests and contract metadata. [VERIFIED: route/page/server files] | HIGH |
| Public replay metadata | `packages/service/src/index.ts`; full replay server still loads Chronicle in `apps/web/app/matches/server.ts` | Add/cover service route contract and service tests; do not migrate full replay rendering in Phase 51. [VERIFIED: packages/service/src/index.ts; VERIFIED: apps/web/app/matches/server.ts] | HIGH |
| Public Strategy page | `apps/web/app/strategies/[strategyId]/page.tsx`, `competitiveServer.getPublicStrategyCard`, `buildPublicStrategyCardDto` | Recommended fourth read: add `getPublicStrategyPage`/`getPublicStrategyCard` service method and route page through it. [VERIFIED: route/page/server/persistence files] | HIGH |

Public Strategy page is the best fourth read because it is public, read-only, has an existing route id, does not require current-user cookies, and maps to one persistence helper returning one DTO. [VERIFIED: packages/spec/src/service.ts; VERIFIED: apps/web/app/strategies/[strategyId]/page.tsx; VERIFIED: packages/persistence/src/profiles.ts]

Public player page is lower priority because its DTO aggregates strategy cards, ladder history, and recent MatchSet results; public ladder season is lower priority because it has more stateful ordering/status behavior and the page also checks current user for display. [VERIFIED: packages/persistence/src/profiles.ts; VERIFIED: packages/persistence/src/ladder.ts; VERIFIED: apps/web/app/players/[handle]/page.tsx; VERIFIED: apps/web/app/ladder/[seasonId]/page.tsx]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime schema to JSON Schema conversion | Custom TypeScript-interface parser | Zod 4 `z.toJSONSchema()` | Zod is already installed and officially supports JSON Schema conversion. [VERIFIED: pnpm list; CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx] |
| OpenAPI validation | Custom OpenAPI validator | `@redocly/cli lint` | Redocly CLI is built for linting API/OpenAPI descriptions. [VERIFIED: npm registry; CITED: https://github.com/redocly/redocly-cli/blob/main/docs/@v2/quickstart.md] |
| Public DTO privacy review | Manual field review only | Existing `assertPublicServiceDtoLeakSafe` plus generated-example/schema-key checks | The repo already has recursive forbidden-key scanning for public service DTO values. [VERIFIED: packages/spec/src/service.ts] |
| Import-boundary enforcement | Manual code review only | Static import guard script/test | Phase 51 explicitly requires failing import-boundary checks for migrated route files. [VERIFIED: .planning/REQUIREMENTS.md GEN-07] |
| Service route list | New OpenAPI-first route source | Enriched `SERVICE_API_ROUTES` | Locked decision says to enrich the existing source. [VERIFIED: 51-CONTEXT.md D-07] |

**Key insight:** The generator should be boring glue from existing Zod/spec metadata to OpenAPI; the hard part is preventing schema, privacy, and route-boundary drift. [VERIFIED: .planning/research/PITFALLS.md]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None; Phase 51 changes service contract metadata and route call paths, not stored identifiers or database schema. [VERIFIED: 51-CONTEXT.md; VERIFIED: packages/persistence/migrations scan] | No data migration. |
| Live service config | None found in repo-owned config for Phase 51; existing env config is `DATABASE_URL`, `REDIS_URL`, and `NODE_ENV`. [VERIFIED: .env.example] | No live service config migration. |
| OS-registered state | None found; no launchd/systemd/pm2/task registration files are in scope. [VERIFIED: repo file scan] | No OS re-registration. |
| Secrets/env vars | Existing `COWARDS_*` variables cover local services, preflight, worker, and Go spike; none encode `service-api-v1.7` as an env var name. [VERIFIED: local rg scan] | No secret rename; Phase 52 may add Go artifact consumption later. |
| Build artifacts | Existing `dist/`, `.turbo/`, and `tsconfig.tsbuildinfo` artifacts contain stale compiled outputs after version changes. [VERIFIED: build artifact scan] | Run typecheck/test scripts after edits; do not treat generated OpenAPI as a build artifact because it is intentionally committed. |

## Common Pitfalls

### Pitfall 1: Generated Artifact Becomes A Second Source

**What goes wrong:** Developers edit OpenAPI JSON instead of `@cowards/spec` schemas and route metadata. [VERIFIED: .planning/research/PITFALLS.md]
**Why it happens:** Generated artifacts are committed for reviewability, which makes them visible and tempting to patch. [VERIFIED: 51-CONTEXT.md D-01]
**How to avoid:** Make `contract:check` fail on stale output and document that generated JSON is never hand-edited. [VERIFIED: 51-CONTEXT.md D-02]
**Warning signs:** Artifact diffs without `packages/spec/src/service.ts` or schema diffs. [VERIFIED: .planning/research/PITFALLS.md]

### Pitfall 2: DTO Schemas Lag Behind Interfaces

**What goes wrong:** Service interfaces change while OpenAPI still reflects older or partial Zod schemas. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts]
**Why it happens:** Several service DTOs currently exist as TypeScript interfaces without matching exported Zod schemas. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts]
**How to avoid:** Add tests that every route response schema exists and parses representative examples. [VERIFIED: .planning/REQUIREMENTS.md GEN-02/GEN-06]
**Warning signs:** `responseSchema` is `JsonValueSchema`, `z.any`, or missing for public routes. [VERIFIED: .planning/research/PITFALLS.md]

### Pitfall 3: False Route Migration

**What goes wrong:** A page calls a server facade that still implements the read directly against persistence, so the route appears migrated but bypasses `@cowards/service`. [VERIFIED: apps/web/app/competitive/server.ts]
**Why it happens:** `competitiveServer` currently mixes auth, mutations, governance, ladder, profiles, and service-backed MatchSet summary in one module. [VERIFIED: apps/web/app/competitive/server.ts]
**How to avoid:** Add focused service methods and tests for each named read, then ensure named route/page files call those methods through a known service path. [VERIFIED: packages/service/src/index.ts; VERIFIED: packages/service/src/service.test.ts]
**Warning signs:** New Phase 51 read still calls `buildPublicStrategyCardDto`, `buildPublicPlayerProfileDto`, or `buildTrialLadderSeasonDto` outside `@cowards/service`. [VERIFIED: apps/web/app/competitive/server.ts; VERIFIED: packages/persistence/src/profiles.ts; VERIFIED: packages/persistence/src/ladder.ts]

### Pitfall 4: Privacy Leaks In Examples Or Public Schemas

**What goes wrong:** Public examples or generated schemas expose Strategy source, memories, objective payloads, owner debug, stack traces, stderr, sessions, or runtime internals. [VERIFIED: AGENTS.md; VERIFIED: .planning/research/PITFALLS.md]
**Why it happens:** Examples are often copied from internal records or owner debug fixtures. [VERIFIED: .planning/research/PITFALLS.md]
**How to avoid:** Run `assertPublicServiceDtoLeakSafe` on public examples and scan public schema property names for the same forbidden keys. [VERIFIED: packages/spec/src/service.ts]
**Warning signs:** Public schema or example fields named `source`, `strategyMemory`, `soldierMemory`, `objective`, `ownerDebug`, `awarenessGrid`, `stderr`, `stack`, `session`, or `token`. [VERIFIED: packages/spec/src/service.ts]

## Code Examples

### Zod To JSON Schema Conversion

```typescript
// Source: Zod docs; verified locally with zod 4.4.3
import { z } from "zod"

const schema = z.toJSONSchema(
  z.object({
    ok: z.literal(true),
  }),
)
```

Local verification returned a Draft 2020-12 JSON Schema object with `type`, `properties`, `required`, and `additionalProperties: false`. [VERIFIED: local command]

### Redocly Lint Script

```json
{
  "scripts": {
    "contract:lint": "redocly lint --extends recommended packages/spec/artifacts/service-api-v1.8.openapi.json"
  }
}
```

Redocly CLI docs show `redocly lint --extends recommended openapi.yaml` as a supported pattern. [CITED: https://github.com/redocly/redocly-cli/blob/main/docs/@v2/guides/configure-rules.md]

### Service Method Shape For Public Strategy Page

```typescript
// Source: existing @cowards/service style
async getPublicStrategyPage(strategyId) {
  return options.withPool(async (pool) => {
    const strategy = await buildPublicStrategyCard(pool, strategyId)
    if (!strategy) return null
    const dto = {
      apiVersion: SERVICE_API_VERSION,
      kind: "publicPage",
      page: "strategy",
      canonicalHref: `/strategies/${encodeURIComponent(strategyId)}`,
      payload: strategy,
    }
    assertPublicServiceDtoLeakSafe(dto)
    return PublicPageServiceDtoSchema.parse(dto)
  })
}
```

This example follows the existing service pattern of wrapping persistence output, running the public leak scanner, and returning `null` for not found. [VERIFIED: packages/service/src/index.ts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Service routes as strings | Metadata objects with schemas, auth scope, privacy class, examples, and fixture refs | Phase 51 target | Enables generation and import guard ownership. [VERIFIED: 51-CONTEXT.md D-07/D-08] |
| TypeScript interfaces only for service DTOs | Zod schemas for generated DTO contracts | Phase 51 target | Required because OpenAPI generation needs runtime schema values. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts] |
| Hand-shaped Go DTO spike | Go reads/parity-checks canonical artifact/fixtures later | Phase 52 target | Phase 51 artifact must be stable and checked in. [VERIFIED: apps/go-backend/main.go; VERIFIED: .planning/ROADMAP.md] |
| Warning-only broad scans | Strict named-slice guard plus report-only broad scan | Phase 51 target | Avoids blocking on existing legacy imports while enforcing migrated reads. [VERIFIED: 51-CONTEXT.md D-10/D-11] |

**Deprecated/outdated:**

- Treating `SERVICE_API_ROUTES` string values as enough contract metadata is outdated for v1.8 because GEN-02 requires schemas, auth scope, privacy class, examples, and fixture refs. [VERIFIED: packages/spec/src/service.ts; VERIFIED: .planning/REQUIREMENTS.md GEN-02]
- Treating Go DTO structs as contract truth is out of scope because Go remains a future read-only consumer and parity target. [VERIFIED: .planning/PROJECT.md; VERIFIED: apps/go-backend/README.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TypeScript compiler parsing is preferable to whole-file regex for import guard implementation. | Architecture Patterns | If overkill, planner can implement a simpler direct import scanner, but must avoid comment/string false positives. |
| A2 | Planner may want stronger transitive import protection later, but Phase 51 should stay direct-only unless clarified. | Open Questions | If transitive checks are required now, planner must first split legacy mixed server facades or accept broader refactor scope. |
| A3 | Research validity estimate is 30 days for repo architecture and 7 days for npm package versions. | Metadata | If package versions move sooner, planner should re-run `npm view` before implementation. |

## Open Questions (RESOLVED)

1. **Should service response schemas use specific public DTO schemas or `PublicPageServiceDto` with `JsonValue` payload for public pages?** [VERIFIED: packages/spec/src/service.ts]
   - What we know: `PublicPageServiceDto` already exists with generic `payload: JsonValue`, and `PublicStrategyCardDto` exists as an interface. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/competition.ts]
   - What's unclear: Whether Phase 51 should spend effort adding full Zod schemas for public Strategy card/profile/ladder DTOs or keep the page envelope generic for the first slice. [VERIFIED: packages/spec/src/schemas.ts]
   - Recommendation: Add a specific `PublicStrategyCardDtoSchema` for the chosen public Strategy page if planner has budget; otherwise use `PublicPageServiceDtoSchema` only as a temporary generation-ready envelope and flag specific public page payload schemas for Phase 52/56. [VERIFIED: repo inspection]
   - **RESOLVED:** Phase 51 will add a specific public Strategy page payload schema for the selected public Strategy page slice. Other public page payload schemas may remain generic or deferred unless needed for the committed v1.8 artifact.

2. **Should strict import guards be direct-only or transitive for Phase 51?** [VERIFIED: 51-CONTEXT.md D-12]
   - What we know: D-12 says direct imports, and current broad server facades still import persistence for non-migrated methods. [VERIFIED: 51-CONTEXT.md; VERIFIED: apps/web/app/competitive/server.ts]
   - What's unclear: Whether planner wants stronger transitive protection immediately. [ASSUMED]
   - Recommendation: Make Phase 51 strict guard direct-only for named route/page files, and report transitive/legacy facade debt separately. [VERIFIED: 51-CONTEXT.md D-10/D-11]
   - **RESOLVED:** Phase 51 strict guards are direct-only for named migrated route/page files. Broader and transitive findings are report-only debt signals unless a later phase explicitly ratchets them into failing checks.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | pnpm scripts, generator, tests | yes | v24.15.0 | None needed. [VERIFIED: local command] |
| pnpm | Workspace scripts | yes | 11.1.2 configured; local command also reports 11.1.2 | None needed. [VERIFIED: package.json; VERIFIED: local command] |
| npm/npx | Version verification and CLI fallback | yes | npm/npx 11.12.1 | Use pnpm after dependencies are installed. [VERIFIED: local command] |
| `tsx` | TypeScript generator scripts | yes | 4.22.0 local | Use compiled JS if planner avoids TS scripts. [VERIFIED: local command; VERIFIED: pnpm why] |
| `@redocly/cli` | OpenAPI lint | no | 2.31.4 current in npm | Install as root dev dependency; temporary fallback is `npx redocly lint`. [VERIFIED: pnpm list; VERIFIED: npm registry] |
| jq | Optional artifact inspection | yes | jq-1.7.1-apple | Use Node JSON parsing. [VERIFIED: local command] |
| Docker | Not required for Phase 51 | yes | 29.4.3 | Skip for Phase 51. [VERIFIED: local command] |
| Go | Future Phase 52 consumer, not required for Phase 51 | no | unavailable | Phase 51 should only emit artifact; Phase 52 must handle Go installation or skip Go tests locally. [VERIFIED: local command] |

**Missing dependencies with no fallback:**
- None for Phase 51 after adding `@redocly/cli` as a dev dependency. [VERIFIED: local environment audit]

**Missing dependencies with fallback:**
- `@redocly/cli` is not installed but can be added as a dev dependency or run via npx during research; the plan should install it. [VERIFIED: pnpm list; VERIFIED: npm registry]
- Go is unavailable locally, but Phase 51 only prepares the artifact for Phase 52 and should not require Go tests. [VERIFIED: local command; VERIFIED: .planning/ROADMAP.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 for TS packages; Redocly CLI 2.31.4 for OpenAPI lint after install. [VERIFIED: package.json; VERIFIED: npm registry] |
| Config file | Root `vitest.config.ts` and `apps/web/vitest.config.ts`; no package-specific spec config found. [VERIFIED: file scan] |
| Quick run command | `pnpm --filter @cowards/spec test && pnpm --filter @cowards/service test` [VERIFIED: packages/spec/package.json; VERIFIED: packages/service/package.json] |
| Full suite command | `pnpm test:fast` [VERIFIED: package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| GEN-01 | Generator emits deterministic OpenAPI artifact | unit/script | `pnpm --filter @cowards/spec contract:check` | No, Wave 0. [VERIFIED: packages/spec/package.json] |
| GEN-02 | Route metadata has ids, operation ids, methods, paths, auth/privacy, schemas, examples, fixture refs | unit | `pnpm --filter @cowards/spec test` | Partial, Wave 0 for new tests. [VERIFIED: packages/spec/src/spec.test.ts] |
| GEN-03 | Redocly lint and stale-output check fail on drift | script | `pnpm contract:lint && pnpm --filter @cowards/spec contract:check` | No, Wave 0. [VERIFIED: package.json] |
| GEN-04 | Public schemas/examples do not expose private fields | unit | `pnpm --filter @cowards/spec test` | Partial leak scanner exists; new artifact/example tests needed. [VERIFIED: packages/spec/src/service.ts] |
| GEN-05 | Named web reads call service boundary | unit/import guard | `pnpm --filter @cowards/web test` and import guard command | Partial for existing health/MatchSet; new public Strategy read test needed. [VERIFIED: apps/web/package.json] |
| GEN-06 | Migrated routes preserve DTO behavior, ordering, errors, privacy | unit/integration | `pnpm --filter @cowards/service test && pnpm --filter @cowards/web test` | Partial, expand service tests. [VERIFIED: packages/service/src/service.test.ts] |
| GEN-07 | Strict migrated-route import guard fails on forbidden direct imports | script/unit | `pnpm boundary:imports` or equivalent | No, Wave 0. [VERIFIED: package.json] |

### Sampling Rate

- **Per task commit:** `pnpm --filter @cowards/spec test` or the package touched by the task. [VERIFIED: package scripts]
- **Per wave merge:** `pnpm --filter @cowards/spec test && pnpm --filter @cowards/service test && pnpm --filter @cowards/web test && pnpm contract:lint`. [VERIFIED: package scripts; VERIFIED: Redocly docs]
- **Phase gate:** `pnpm test:fast` plus `pnpm --filter @cowards/spec contract:check` and import guard command. [VERIFIED: package.json; VERIFIED: .planning/REQUIREMENTS.md GEN-03/GEN-07]

### Wave 0 Gaps

- [ ] `packages/spec/scripts/generate-service-openapi.ts` - deterministic generator and `--check` mode. [VERIFIED: packages/spec file scan]
- [ ] `packages/spec/src/service-fixtures.ts` - route examples/fixture refs for generated artifact. [VERIFIED: packages/spec file scan]
- [ ] `packages/spec/src/service-contract.test.ts` or extend `spec.test.ts` - metadata completeness, schema conversion, public leak checks. [VERIFIED: packages/spec/src/spec.test.ts]
- [ ] `scripts/check-service-boundary-imports.ts` - strict named-slice and report-only broad scan. [VERIFIED: scripts file scan]
- [ ] `package.json` / `packages/spec/package.json` scripts for `contract:generate`, `contract:check`, `contract:lint`, and import guard command. [VERIFIED: package.json; VERIFIED: packages/spec/package.json]
- [ ] `@redocly/cli` root dev dependency. [VERIFIED: package.json; VERIFIED: pnpm list]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Yes for route metadata but no auth mutation migration | Preserve auth scope metadata; do not migrate auth mutation routes in Phase 51. [VERIFIED: 51-CONTEXT.md D-05/D-08] |
| V3 Session Management | No direct implementation change | Existing session/cookie flows remain in `competitiveServer`; Phase 51 public reads should not add session state. [VERIFIED: apps/web/app/competitive/server.ts] |
| V4 Access Control | Yes | Route metadata must distinguish public, owner-authorized, admin, and internal scopes. [VERIFIED: 51-CONTEXT.md D-08] |
| V5 Input Validation | Yes | Use Zod schemas for params/query/body and DTOs. [VERIFIED: packages/spec/src/schemas.ts; CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx] |
| V6 Cryptography | No new crypto | Do not change hashing/source integrity behavior in Phase 51. [VERIFIED: 51-CONTEXT.md D-05] |
| V8 Data Protection | Yes | Public DTO/schema/example checks must exclude Strategy source, memories, objective payloads, owner debug, stack traces, stderr, sessions, tokens, and runtime internals. [VERIFIED: AGENTS.md; VERIFIED: packages/spec/src/service.ts] |

### Known Threat Patterns For This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Public DTO private-field leak | Information Disclosure | `assertPublicServiceDtoLeakSafe` on examples/DTOs plus schema property scans for public routes. [VERIFIED: packages/spec/src/service.ts] |
| Route boundary bypass to persistence/runtime | Tampering / Elevation of Privilege | Strict direct-import guard for named migrated files and report-only broad scan. [VERIFIED: 51-CONTEXT.md D-10/D-12] |
| Contract drift | Tampering | Deterministic `contract:check` plus committed artifact diff. [VERIFIED: 51-CONTEXT.md D-01/D-02] |
| Unvalidated route params | Tampering | Zod param schemas in route metadata; service methods parse or type-check before persistence. [VERIFIED: packages/spec/src/schemas.ts] |
| Strategy execution from web/API | Elevation of Privilege | Do not migrate test-support worker route or runtime adapter paths; existing ESLint already restricts web runtime imports. [VERIFIED: AGENTS.md; VERIFIED: eslint.config.mjs; VERIFIED: 51-CONTEXT.md D-05] |

## Sources

### Primary (HIGH Confidence)

- `AGENTS.md` - project non-negotiables and testing expectations. [VERIFIED: local file]
- `.planning/phases/51-service-contract-generation-and-route-migration/51-CONTEXT.md` - locked Phase 51 decisions. [VERIFIED: local file]
- `.planning/REQUIREMENTS.md` - GEN-01 through GEN-07. [VERIFIED: local file]
- `.planning/ROADMAP.md` - Phase 51 success criteria and v1.8 sequence. [VERIFIED: local file]
- `packages/spec/src/service.ts` - current service API version, route ids, DTO interfaces, public leak scanner. [VERIFIED: local file]
- `packages/spec/src/schemas.ts` - current Zod schemas and service schema gaps. [VERIFIED: local file]
- `packages/service/src/index.ts` and `packages/service/src/service.test.ts` - current service boundary methods and tests. [VERIFIED: local file]
- Zod docs via Context7 CLI - `z.toJSONSchema()` behavior and options. [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/json-schema.mdx]
- Redocly CLI docs via Context7 CLI - `redocly lint` and rulesets. [CITED: https://github.com/redocly/redocly-cli/blob/main/docs/@v2/quickstart.md]
- npm registry - current versions for `zod`, `@redocly/cli`, `tsx`, and `openapi3-ts`. [VERIFIED: npm registry]

### Secondary (MEDIUM Confidence)

- `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` - milestone-level research recommendations and warnings. [VERIFIED: local planning research]
- `apps/go-backend/main.go`, `apps/go-backend/README.md` - future read-only consumer shape and v1.7 Go spike gaps. [VERIFIED: local file]

### Tertiary (LOW Confidence)

- None. No unverified web-search-only findings were used. [VERIFIED: source log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified from npm registry and local package files. [VERIFIED: npm registry; VERIFIED: package.json]
- Architecture: HIGH - constrained by existing repo ownership and locked decisions. [VERIFIED: local repo; VERIFIED: 51-CONTEXT.md]
- Route migration candidate: HIGH - public Strategy page is the lowest-risk fourth read based on local code shape. [VERIFIED: apps/web/app/strategies/[strategyId]/page.tsx; VERIFIED: packages/persistence/src/profiles.ts]
- Pitfalls: HIGH - grounded in local milestone research and current facade imports. [VERIFIED: .planning/research/PITFALLS.md; VERIFIED: apps/web/app/competitive/server.ts]
- Exact implementation effort: MEDIUM - public DTO Zod schema coverage is incomplete and may take more than one task. [VERIFIED: packages/spec/src/service.ts; VERIFIED: packages/spec/src/schemas.ts]

**Research date:** 2026-05-22 [VERIFIED: system date]
**Valid until:** 2026-06-21 for repo architecture; 2026-05-29 for npm package versions. [ASSUMED]
