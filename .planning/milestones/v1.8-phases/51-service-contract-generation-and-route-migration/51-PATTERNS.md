# Phase 51: Service Contract Generation and Route Migration - Pattern Map

**Mapped:** 2026-05-22
**Files analyzed:** 17 likely new/modified files
**Analogs found:** 15 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/spec/src/service.ts` | config/model | request-response | `packages/spec/src/service.ts` | exact |
| `packages/spec/src/schemas.ts` | model | transform | `packages/spec/src/schemas.ts` | exact |
| `packages/spec/src/service-fixtures.ts` | test fixture/config | transform | `packages/spec/src/spec.test.ts` | role-match |
| `packages/spec/scripts/generate-service-openapi.ts` | utility | file-I/O/transform | `scripts/preflight.ts` | partial |
| `packages/spec/artifacts/service-api-v1.8.openapi.json` | config/artifact | transform | none | no analog |
| `packages/spec/src/spec.test.ts` or `packages/spec/src/service-contract.test.ts` | test | transform/request-response | `packages/spec/src/spec.test.ts` | exact |
| `packages/spec/package.json` | config | batch | `packages/spec/package.json` | exact |
| `package.json` | config | batch | `package.json` | exact |
| `pnpm-lock.yaml` | config | batch | existing lockfile | exact |
| `packages/service/src/index.ts` | service | request-response/CRUD-read | `packages/service/src/index.ts` | exact |
| `packages/service/src/service.test.ts` | test | request-response | `packages/service/src/service.test.ts` | exact |
| `apps/web/app/api/service/health/route.ts` | route | request-response | `apps/web/app/api/service/health/route.ts` | exact |
| `apps/web/app/api/matchsets/[matchSetId]/route.ts` | route | request-response | `apps/web/app/api/matchsets/[matchSetId]/route.ts` | exact |
| `apps/web/app/matchsets/[matchSetId]/page.tsx` | component/server page | request-response | `apps/web/app/matchsets/[matchSetId]/page.tsx` | exact |
| `apps/web/app/strategies/[strategyId]/page.tsx` | component/server page | request-response | `apps/web/app/strategies/[strategyId]/page.tsx` | exact |
| `apps/web/app/competitive/server.ts` | service/facade | request-response/CRUD-read | `apps/web/app/competitive/server.ts` | exact |
| `scripts/check-service-boundary-imports.ts` | utility/test | batch/static-analysis | `packages/runtime-js/src/isolation-boundary.test.ts` | role-match |

## Pattern Assignments

### `packages/spec/src/service.ts` (config/model, request-response)

**Analog:** `packages/spec/src/service.ts`

**Imports pattern** (lines 1-10):
```typescript
import type {
  JsonValue,
  MatchId,
  MatchSetId,
  StrategyId,
  StrategyRevisionId,
  UserId,
} from "./types.js"
import type { PublicMatchSetResultDto } from "./competition.js"
import type { StrategyRuntimeMetadata } from "./runtime.js"
```

**Route registry pattern** (lines 12-35):
```typescript
export const SERVICE_API_VERSION = "service-api-v1.7"

export const SERVICE_API_ROUTES = {
  health: "GET /health",
  authSession: "GET /auth/session",
  createSession: "POST /auth/session",
  getPublicMatchSetSummary: "GET /public/matchsets/{matchSetId}/summary",
  getPublicReplayMetadata: "GET /public/replays/{matchId}/metadata",
  getPublicStrategyPage: "GET /public/strategies/{strategyId}",
} as const

export type ServiceApiRouteId = keyof typeof SERVICE_API_ROUTES
```

Phase 51 should enrich this object in place into metadata objects. Preserve `ServiceApiRouteId = keyof typeof SERVICE_API_ROUTES`; do not add a parallel OpenAPI route registry.

**DTO interface pattern** (lines 49-150):
```typescript
export interface ServiceErrorDto {
  code: ServiceErrorCode
  message: string
  status: number
  publicSafe: true
  details?: JsonValue | undefined
}

export interface PublicPageServiceDto {
  apiVersion: typeof SERVICE_API_VERSION
  kind: "publicPage"
  page: "player" | "strategy" | "matchSet" | "replay" | "ladder"
  canonicalHref: string
  payload: JsonValue
}
```

**Privacy guard pattern** (lines 152-194):
```typescript
export const assertPublicServiceDtoLeakSafe = (value: unknown): void => {
  const forbidden = new Set([
    "source",
    "strategySource",
    "strategyMemory",
    "soldierMemory",
    "objective",
    "objectivePayload",
    "ownerDebug",
    "exactAwarenessGrid",
    "awarenessGrid",
    "rawRuntimeDetails",
    "privateRuntime",
    "privateDiagnostics",
    "stack",
    "stackTrace",
    "stderr",
    "password",
    "passwordHash",
    "token",
    "session",
  ])
  const visit = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (node === null || typeof node !== "object") {
      return
    }
    for (const [key, entryValue] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (forbidden.has(key)) {
        throw new Error(
          `Public service DTO leaks private field: ${path}.${key}`,
        )
      }
      visit(entryValue, `${path}.${key}`)
    }
  }
  visit(value, "$")
}
```

### `packages/spec/src/schemas.ts` (model, transform)

**Analog:** `packages/spec/src/schemas.ts`

**Imports and schema dependency pattern** (lines 1-28):
```typescript
import { z } from "zod"
import {
  SERVICE_API_ROUTES,
  SERVICE_API_VERSION,
  SERVICE_ERROR_CODES,
} from "./service.js"
```

**Recursive JSON schema pattern** (lines 39-47):
```typescript
export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
)
```

**Service schema pattern** (lines 646-690):
```typescript
export const ServiceErrorDtoSchema = z.object({
  code: z.enum(SERVICE_ERROR_CODES),
  message: z.string().min(1),
  status: z.number().int().min(400).max(599),
  publicSafe: z.literal(true),
  details: JsonValueSchema.optional(),
})

export const ServiceHealthDtoSchema = z.object({
  ok: z.literal(true),
  service: z.literal("cowards-service"),
  version: z.literal(SERVICE_API_VERSION),
})

export const ServiceApiRouteIdSchema = z.enum(
  Object.keys(SERVICE_API_ROUTES) as [
    keyof typeof SERVICE_API_ROUTES,
    ...(keyof typeof SERVICE_API_ROUTES)[],
  ],
)
```

**Runtime nested DTO pattern** (lines 473-488):
```typescript
export const StrategyRuntimeMetadataSchema = z.object({
  abiVersion: z.literal(STRATEGY_RUNTIME_ABI_VERSION),
  language: z.object({
    id: StrategyLanguageIdSchema,
    version: z.string().min(1),
  }),
  adapter: z.object({
    id: StrategyRuntimeAdapterIdSchema,
    version: z.string().min(1),
  }),
  package: StrategyPackageMetadataSchema,
  requiredCapabilities: z.array(z.string().min(1)),
  limits: StrategyRuntimeLimitsSchema,
})
```

Add generation-ready schemas beside existing service schemas. For the public Strategy page, copy the explicit-object style from `StrategyRuntimeMetadataSchema` and the interface shape from `packages/spec/src/competition.ts` lines 139-169.

### `packages/spec/src/service-fixtures.ts` (test fixture/config, transform)

**Analog:** `packages/spec/src/spec.test.ts`

**Fixture object pattern** (lines 575-704):
```typescript
const summary = {
  summarySchemaVersion: ANALYTICS_SUMMARY_SCHEMA_VERSION,
  profileId: "analytics-profile:demo",
  runId: "analytics-run:demo:2",
  ownerUserId: "user:local",
  lifecycleStatus: "complete",
  compatibility: {
    hash: "compat-hash",
    equivalent: true,
    mismatches: [],
    key: {
      profileSchemaVersion: ANALYTICS_PROFILE_SCHEMA_VERSION,
      candidateRevisionIds: ["revision:sentinel"],
      opponentRevisionIds: ["revision:opponent"],
      presetId: "standard-v1",
      seeds: ["seed:001"],
      mirrorSides: true,
      scoringPolicyVersion: "matchset-scoring-v1",
      ruleVersion: "rules-v1.6",
      chronicleVersion: "chronicle-v1.4",
      runtimeAdapter: "runtime-js",
      runtimeVersion: "runtime-js-v1",
      matrixOrder: ["revision:sentinel|revision:opponent|seed:001"],
    },
  },
} satisfies AnalyticsGauntletRunSummary
```

Use `satisfies` with concrete public DTO types so examples stay type-checked. Run `assertPublicServiceDtoLeakSafe` on every public fixture.

### `packages/spec/scripts/generate-service-openapi.ts` (utility, file-I/O/transform)

**Analog:** `scripts/preflight.ts`

**Script entry and option parsing pattern** (lines 1-3, 40-80, 150):
```typescript
#!/usr/bin/env -S pnpm exec tsx
import net from "node:net"

const parseOptions = (argv: string[]): Options => {
  const options: Options = {
    requireRedis: true,
    requireWeb: process.env.COWARDS_WEB_URL !== undefined,
    webUrl: process.env.COWARDS_WEB_URL,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case "--skip-redis":
        options.requireRedis = false
        break
      default:
        throw new Error(`Unknown preflight option: ${arg}`)
    }
  }

  return options
}

const options = parseOptions(process.argv.slice(2))
```

**Error handling pattern** (lines 88-101, 318-326):
```typescript
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

run()
  .then((exitCode) => {
    process.exitCode = exitCode
  })
  .catch((error: unknown) => {
    console.error(
      `[FAIL] [service_startup] preflight crashed: ${errorMessage(error)}`,
    )
    process.exitCode = 1
  })
```

For the generator, use the same `tsx` script shape, but replace preflight options with `--check`. Compose OpenAPI from `SERVICE_API_ROUTES`, convert Zod schemas with `z.toJSONSchema()`, stable-sort keys, and compare output in check mode.

### `packages/spec/artifacts/service-api-v1.8.openapi.json` (config/artifact, transform)

**Analog:** none.

No existing committed generated contract artifact exists. Planner should use RESEARCH.md guidance: artifact is generated, deterministic, committed, and checked stale by `packages/spec/scripts/generate-service-openapi.ts --check`.

### `packages/spec/src/spec.test.ts` or `packages/spec/src/service-contract.test.ts` (test, transform/request-response)

**Analog:** `packages/spec/src/spec.test.ts`

**Imports pattern** (lines 1-24):
```typescript
import { describe, expect, it } from "vitest"
import {
  assertPublicMatchSetResultLeakSafe,
  COMPETITION_PRESET_IDS,
  getCompetitionPreset,
} from "./competition.js"
import {
  ActionSchema,
  AnalyticsGauntletRunSummarySchema,
  ChronicleSchema,
  StrategyRevisionSchema,
} from "./schemas.js"
```

**Schema acceptance/rejection pattern** (lines 109-144):
```typescript
expect(SoldierInactivityExplanationDtoSchema.parse(explanation)).toEqual(
  explanation,
)

for (const field of [
  "soldierId",
  "sequence",
  "cause",
  "label",
  "remediation",
] as const) {
  const withoutField = { ...explanation }
  delete withoutField[field]

  expect(
    SoldierInactivityExplanationDtoSchema.safeParse(withoutField).success,
  ).toBe(false)
}
```

**Privacy test pattern** (lines 547-563, 704-713):
```typescript
expect(() =>
  assertPublicMatchSetResultLeakSafe({
    matchSetId: "match-set:public",
    sourceHash: "public-hash",
  }),
).not.toThrow()
expect(() =>
  assertPublicMatchSetResultLeakSafe({
    entrants: [{ source: "private strategy code" }],
  }),
).toThrow(/private field/)
```

Contract tests should assert all route metadata entries have id, operationId, method, path, authScope, privacyClass, schemas, examples, fixture refs, and public examples pass the public leak scanner.

### `packages/spec/package.json`, `package.json`, `pnpm-lock.yaml` (config, batch)

**Analogs:** `packages/spec/package.json`, `package.json`, `turbo.json`

**Package script pattern** (`packages/spec/package.json` lines 11-15):
```json
"scripts": {
  "build": "tsc -b",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run spec.test.ts"
}
```

**Root script pattern** (`package.json` lines 7-24):
```json
"scripts": {
  "dev": "turbo dev --filter='./apps/*' --filter='./packages/*'",
  "preflight": "pnpm exec tsx scripts/preflight.ts",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck",
  "test": "turbo test",
  "test:fast": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test"
}
```

Add package-local `contract:generate` and `contract:check`; add root `contract:lint` and a root import-boundary script. If adding `@redocly/cli`, update `pnpm-lock.yaml` through package manager install.

### `packages/service/src/index.ts` (service, request-response/CRUD-read)

**Analog:** `packages/service/src/index.ts`

**Imports pattern** (lines 1-18):
```typescript
import type { Pool } from "pg"
import { createPostgresChronicleStore } from "@cowards/persistence/chronicle-store"
import { buildPublicMatchSetResultDto } from "@cowards/persistence/competition"
import {
  assertPublicServiceDtoLeakSafe,
  SERVICE_API_VERSION,
  type MatchId,
  type MatchSetId,
  type PublicMatchSetSummaryServiceDto,
  type PublicReplayMetadataServiceDto,
  type ServiceErrorDto,
  type ServiceHealthDto,
} from "@cowards/spec"
```

**Service interface pattern** (lines 32-47):
```typescript
export interface CowardsService {
  health(): ServiceHealthDto
  getPublicMatchSetSummary(
    matchSetId: MatchSetId,
  ): Promise<PublicMatchSetSummaryServiceDto | null>
  getPublicReplayMetadata(
    matchId: MatchId,
  ): Promise<PublicReplayMetadataServiceDto | null>
}

export interface CreateCowardsLocalServiceOptions {
  withPool: WithPool
  createChronicleStore?: ((pool: ServicePool) => ChronicleStore) | undefined
  buildPublicMatchSetResult?: typeof buildPublicMatchSetResultDto | undefined
}
```

**Service method pattern** (lines 73-110):
```typescript
export const createCowardsLocalService = (
  options: CreateCowardsLocalServiceOptions,
): CowardsService => {
  const createChronicleStore =
    options.createChronicleStore ?? createPostgresChronicleStore
  const buildPublicMatchSetResult =
    options.buildPublicMatchSetResult ?? buildPublicMatchSetResultDto

  return {
    health: () => healthDto,

    async getPublicMatchSetSummary(matchSetId) {
      return options.withPool(async (pool) => {
        const result = await buildPublicMatchSetResult(pool, matchSetId)
        if (!result) {
          return null
        }
        const dto: PublicMatchSetSummaryServiceDto = {
          apiVersion: SERVICE_API_VERSION,
          kind: "publicMatchSetSummary",
          matchSetId,
          result,
        }
        assertPublicServiceDtoLeakSafe(dto)
        return dto
      })
    },
  }
}
```

For `getPublicStrategyPage` or `getPublicStrategyCard`, follow the injectable persistence helper pattern, return `null` on missing records, wrap in a service DTO, parse with canonical Zod schema if added, and run `assertPublicServiceDtoLeakSafe`.

### `packages/service/src/service.test.ts` (test, request-response)

**Analog:** `packages/service/src/service.test.ts`

**Fixture and service injection pattern** (lines 1-33, 35-62):
```typescript
import { describe, expect, it } from "vitest"
import {
  EXHIBITION_SCORING_POLICY_V1,
  type PublicMatchSetResultDto,
} from "@cowards/spec"
import { createCowardsLocalService } from "./index.js"

const publicResult = {
  matchSetId: "match-set:demo",
  preset: {
    id: "smoke-exhibition-v1",
    version: "v1",
    label: "Smoke exhibition",
  },
  status: "complete",
  visibility: "public",
  scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
  entrants: [],
  standings: [],
  matches: [],
} satisfies PublicMatchSetResultDto
```

```typescript
const service = createCowardsLocalService({
  withPool: async (fn) => fn({} as never),
  buildPublicMatchSetResult: async (_pool, _matchSetId) => publicResult,
})

await expect(
  service.getPublicMatchSetSummary("match-set:demo"),
).resolves.toEqual({
  apiVersion: "service-api-v1.7",
  kind: "publicMatchSetSummary",
  matchSetId: "match-set:demo",
  result: publicResult,
})
```

Add tests for replay metadata and the public Strategy page/service method, including `null` returns and privacy leak rejection.

### `apps/web/app/api/service/health/route.ts` (route, request-response)

**Analog:** `apps/web/app/api/service/health/route.ts`

**Service-backed route pattern** (lines 1-11):
```typescript
import { createCowardsLocalService } from "@cowards/service"

export async function GET(): Promise<Response> {
  const service = createCowardsLocalService({
    withPool: async () => {
      throw new Error("Health check does not require persistence.")
    },
  })

  return Response.json(service.health())
}
```

Keep health persistence-free and service-backed. Update version expectations through `SERVICE_API_VERSION`, not hard-coded route JSON.

### `apps/web/app/api/matchsets/[matchSetId]/route.ts` (route, request-response)

**Analog:** `apps/web/app/api/matchsets/[matchSetId]/route.ts`

**Next App Router pattern** (lines 1-25):
```typescript
import type { MatchSetId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchSetId: string }> | { matchSetId: string } },
): Promise<Response> {
  try {
    const params = await context.params
    const result = await competitiveServer.getMatchSetResult(
      decodeURIComponent(params.matchSetId) as MatchSetId,
      await getCurrentCompetitiveUser(),
    )
    if (!result) {
      return Response.json({ error: "MatchSet not found." }, { status: 404 })
    }
    return Response.json(result)
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
```

Keep decoded params and `competitiveErrorResponse`. The migrated route must not directly import persistence, migrations, worker entrypoints, runtime adapters, or Strategy execution modules.

### `apps/web/app/matchsets/[matchSetId]/page.tsx` (component/server page, request-response)

**Analog:** `apps/web/app/matchsets/[matchSetId]/page.tsx`

**Server page load pattern** (lines 1-31):
```typescript
import type { MatchSetId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../competitive/server.js"

export const dynamic = "force-dynamic"

export default async function MatchSetResultPage({
  params,
}: {
  params: Promise<{ matchSetId: string }> | { matchSetId: string }
}) {
  const resolvedParams = await params
  const matchSetId = decodeURIComponent(resolvedParams.matchSetId) as MatchSetId
  const user = await getCurrentCompetitiveUser()
  const result = await competitiveServer.getMatchSetResult(matchSetId, user)
```

Use this for page-level params and current-user enrichment. Keep game rules out of React and keep service/persistence reads in server helpers.

### `apps/web/app/strategies/[strategyId]/page.tsx` (component/server page, request-response)

**Analog:** `apps/web/app/strategies/[strategyId]/page.tsx`

**Public Strategy page pattern** (lines 1-22):
```typescript
import { competitiveServer } from "../../competitive/server.js"

export const dynamic = "force-dynamic"

export default async function StrategyCardPage({
  params,
}: {
  params: Promise<{ strategyId: string }> | { strategyId: string }
}) {
  const { strategyId } = await params
  const strategy = await competitiveServer.getPublicStrategyCard(
    decodeURIComponent(strategyId),
  )
  if (!strategy) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <h1>Strategy not found</h1>
        </section>
      </main>
    )
  }
```

Phase 51 should keep the UI behavior but route `getPublicStrategyCard` through `@cowards/service` in `competitive/server.ts`, or call a new service-backed helper directly if planner splits it.

### `apps/web/app/competitive/server.ts` (service/facade, request-response/CRUD-read)

**Analog:** `apps/web/app/competitive/server.ts`

**Mixed facade and service injection pattern** (lines 27, 44-45, 274):
```typescript
import { createCowardsLocalService } from "@cowards/service"
import {
  buildPublicPlayerProfileDto,
  buildPublicStrategyCardDto,
} from "@cowards/persistence/profiles"

const cowardsService = createCowardsLocalService({ withPool })
```

**Persistence error mapping pattern** (lines 177-216):
```typescript
const mapPersistenceError = (error: unknown): never => {
  if (error instanceof CompetitiveInputError) {
    throw error
  }
  if (
    error instanceof Error &&
    ((error as { code?: string }).code === "42P01" ||
      /does not exist/i.test(error.message))
  ) {
    throw new CompetitiveInputError(
      "Competitive storage is not installed yet; run database migrations and retry.",
      { status: 503 },
    )
  }
  throw error
}
```

**Existing migrated MatchSet read pattern** (lines 684-694):
```typescript
async getMatchSetResult(
  matchSetId: MatchSetId,
  currentUser: CompetitiveUser | null,
): Promise<MatchSetResultDto | null> {
  try {
    const summary =
      await cowardsService.getPublicMatchSetSummary(matchSetId)
    return summary ? toMatchSetResultDto(summary.result, currentUser) : null
  } catch (error) {
    return mapPersistenceError(error)
  }
}
```

**Current public Strategy direct-persistence pattern to replace** (lines 672-681):
```typescript
async getPublicStrategyCard(
  strategyId: string,
): Promise<StrategyCardDto | null> {
  try {
    return await withPool((pool) =>
      buildPublicStrategyCardDto(pool, strategyId),
    )
  } catch (error) {
    return mapPersistenceError(error)
  }
}
```

Copy the `getMatchSetResult` pattern for public Strategy migration. The post-migration method should call `cowardsService.getPublicStrategyPage` or `cowardsService.getPublicStrategyCard`, then adapt the DTO for the page without direct profile persistence imports in the migrated path.

### `scripts/check-service-boundary-imports.ts` (utility/test, batch/static-analysis)

**Analog:** `packages/runtime-js/src/isolation-boundary.test.ts`

**Source walk pattern** (lines 1-67):
```typescript
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const testDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(testDir, "../../..")

const sourceExtensions = new Set([".ts", ".tsx"])
const excludedDirectories = new Set([
  ".git",
  ".next",
  ".planning",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
])

const walkSourceFiles = (rootRelativePath: string): readonly string[] => {
  const root = path.join(repoRoot, rootRelativePath)
  if (!existsSync(root)) {
    return []
  }
  // recursive visit, sorted output
}
```

**Offense collection pattern** (lines 72-95):
```typescript
const findOffenses = (
  files: readonly string[],
  pattern: string,
  matches: (line: string) => boolean,
): readonly Offense[] =>
  files.flatMap((file) =>
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line, index) =>
        matches(line)
          ? [{ path: toRepoPath(file), line: index + 1, pattern }]
          : [],
      ),
  )

const formatOffenses = (offenses: readonly Offense[]): string =>
  offenses
    .map(
      (offense) => `${offense.path}:${offense.line} matches ${offense.pattern}`,
    )
    .join("\n")
```

For Phase 51, prefer TypeScript import parsing if practical. If using this line scanner, limit matching to import lines to avoid comment/string false positives. Strictly fail named migrated files and print report-only offenses for the broader `apps/web/app` scan.

## Shared Patterns

### Public DTO Privacy

**Source:** `packages/spec/src/service.ts` lines 152-194 and `packages/spec/src/competition.ts` lines 352-380  
**Apply to:** public service DTOs, service fixtures, OpenAPI examples, generated public schema property scans.

```typescript
if (forbidden.has(key)) {
  throw new Error(
    `Public service DTO leaks private field: ${path}.${key}`,
  )
}
visit(entryValue, `${path}.${key}`)
```

### Service Boundary Reads

**Source:** `packages/service/src/index.ts` lines 73-110  
**Apply to:** `getPublicMatchSetSummary`, `getPublicReplayMetadata`, new public Strategy read.

```typescript
return options.withPool(async (pool) => {
  const result = await buildPublicMatchSetResult(pool, matchSetId)
  if (!result) {
    return null
  }
  const dto: PublicMatchSetSummaryServiceDto = {
    apiVersion: SERVICE_API_VERSION,
    kind: "publicMatchSetSummary",
    matchSetId,
    result,
  }
  assertPublicServiceDtoLeakSafe(dto)
  return dto
})
```

### Web Route Error Shape

**Source:** `apps/web/app/competitive/http.ts` lines 18-35  
**Apply to:** migrated API routes that still use `competitiveServer`.

```typescript
export const competitiveErrorResponse = (error: unknown): Response => {
  if (error instanceof CompetitiveInputError) {
    const headers =
      error.retryAfterSeconds === undefined
        ? undefined
        : { "Retry-After": String(error.retryAfterSeconds) }
    return Response.json(
      { error: error.message },
      headers === undefined
        ? { status: error.status }
        : { status: error.status, headers },
    )
  }
  return Response.json(
    { error: "Competitive service is unavailable." },
    { status: 503 },
  )
}
```

### Static Boundary Scanning

**Source:** `packages/runtime-js/src/isolation-boundary.test.ts` lines 39-95  
**Apply to:** `scripts/check-service-boundary-imports.ts`.

```typescript
const expectNoOffenses = (offenses: readonly Offense[]) => {
  expect(offenses, formatOffenses(offenses)).toEqual([])
}
```

Script variant should set `process.exitCode = 1` for strict named-slice offenses and `0` for report-only broad scan findings.

### Package Script Conventions

**Source:** `package.json` lines 7-24 and `packages/spec/package.json` lines 11-15  
**Apply to:** contract generation, contract check, Redocly lint, import guard command.

```json
"test:fast": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test"
```

Keep package-local commands in the owning package and root commands as orchestration shortcuts.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `packages/spec/artifacts/service-api-v1.8.openapi.json` | config/artifact | transform | No committed OpenAPI/contract artifact exists yet. Generate from spec metadata and commit output. |
| OpenAPI component composition inside `packages/spec/scripts/generate-service-openapi.ts` | utility | transform | Existing scripts show CLI/error/file patterns, but there is no OpenAPI generator analog. Use RESEARCH.md Zod 4 `z.toJSONSchema()` guidance. |

## Metadata

**Analog search scope:** `packages/spec`, `packages/service`, `apps/web/app`, `packages/persistence`, `scripts`, `packages/runtime-js`  
**Files scanned:** 70+ source/test/script candidates via `rg --files` and targeted `rg -n` searches  
**Pattern extraction date:** 2026-05-22
