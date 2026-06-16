# Phase 250: Counted Entry and One-Active-Revision Enforcement - Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 20
**Analogs found:** 20 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/spec/src/competition-entry-eligibility.ts` | model / utility contract | transform | `packages/spec/src/competition-policy-v1-36.ts` | exact |
| `packages/spec/src/index.ts` | config / barrel export | transform | `packages/spec/src/index.ts` | exact |
| `packages/spec/src/public-discovery.ts` | model / DTO schema | request-response | `packages/spec/src/public-discovery.ts` | exact |
| `packages/spec/src/competition-entry-eligibility.test.ts` | test | transform | `packages/spec/src/spec.test.ts` | role-match |
| `packages/persistence/src/ladder.ts` | service | CRUD / request-response | `packages/persistence/src/ladder.ts` | exact |
| `packages/persistence/src/ladder.test.ts` | test | transform / CRUD | `packages/persistence/src/ladder.test.ts` | exact |
| `packages/persistence/migrations/000X_counted_entry_owner_invariant.sql` | migration | batch | `packages/persistence/migrations/0004_competition_trust_beta.sql` | exact |
| `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts` | route | request-response | `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts` | exact |
| `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` | test | request-response | `apps/web/app/api/workshop/validate/route.test.ts` | role-match |
| `apps/web/app/competitive/server.ts` | service / adapter | request-response | `apps/web/app/competitive/server.ts` | exact |
| `apps/web/app/competitive/http.ts` | utility | request-response | `apps/web/app/competitive/http.ts` | exact |
| `apps/web/lib/competitive-errors.ts` | utility | request-response | `apps/web/lib/competitive-errors.ts` | exact |
| `apps/web/lib/public-discovery-service.ts` | service / projection | request-response | `apps/web/lib/public-discovery-service.ts` | exact |
| `apps/web/lib/public-discovery-service.test.ts` | test | request-response | `apps/web/lib/public-discovery-service.test.ts` | exact |
| `apps/web/app/competitions/[competitionId]/enter/page.tsx` | component / page | request-response | `apps/web/app/competitions/[competitionId]/enter/page.tsx` | exact |
| `apps/web/app/exhibitions/new/exhibition-client.tsx` | component | event-driven / request-response | `apps/web/app/exhibitions/new/exhibition-client.tsx` | exact |
| `apps/web/app/api/exhibitions/route.ts` | route | request-response | `apps/web/app/api/exhibitions/route.ts` | exact |
| `apps/go-backend/provider_readiness.go` | service / classifier | transform | `apps/go-backend/provider_readiness.go` | exact |
| `apps/go-backend/provider_readiness_test.go` | test | transform | `apps/go-backend/provider_readiness_test.go` | exact |
| `packages/persistence/src/competition.test.ts` | test | event-driven / transform | `packages/persistence/src/competition.test.ts` | exact |

## Pattern Assignments

### `packages/spec/src/competition-entry-eligibility.ts` (model / utility contract, transform)

**Analog:** `packages/spec/src/competition-policy-v1-36.ts`

**Imports pattern** (lines 1-3):
```typescript
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const COMPETITION_POLICY_V1_36_ID = "competition-policy-v1.36" as const
```

**Contract constants and public vocabulary pattern** (lines 5-13, 36-49):
```typescript
export const COMPETITION_POLICY_V1_36_POSTURE = {
  publicLabel: "public beta trial competition",
  standingsScope: "resettable Season-scoped standings",
  durableRatingPromise: "no durable permanent rating promise",
} as const

export type CompetitionPolicyV136CountedStatePublicProjection =
  | "pending"
  | "counted"
  | "retrying"
  | "degraded_system_failure"
```

**Privacy exclusions pattern** (lines 120-136):
```typescript
export const COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS = [
  "Strategy source",
  "artifact bytes",
  "raw diagnostics",
  "host paths",
  "env values",
  "package paths",
  "tokens",
  "DB details",
  "private runtime internals",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
] as const
```

**Apply to Phase 250:** Define `CountedEntryEligibilityCategory` and public remediation records as `as const` data. Include categories for `eligible`, `season_not_open`, `owner_mismatch`, `invalid_strategy_revision`, `mutable_draft`, `unsupported_source_format`, `hidden_unsupported_provider`, `incompatible_runtime_metadata`, `package_policy_violation`, `provider_proof_missing`, `provider_proof_mismatched`, `runtime_service_unavailable`, and `already_entered_season`. Keep copy remediation-oriented and public-safe.

---

### `packages/spec/src/index.ts` (config / barrel export, transform)

**Analog:** `packages/spec/src/index.ts`

**Barrel export pattern** (lines 1-16):
```typescript
export * from "./constants.js"
export * from "./analytics.js"
export * from "./competition.js"
export * from "./competition-policy-v1-36.js"
export * from "./public-discovery.js"
export * from "./runtime.js"
export * from "./service.js"
```

**Apply to Phase 250:** Export the new `competition-entry-eligibility.js` contract from this barrel so persistence, web, tests, and future Go parity generators can import one spec-owned category source.

---

### `packages/spec/src/public-discovery.ts` (model / DTO schema, request-response)

**Analog:** `packages/spec/src/public-discovery.ts`

**Zod schema and privacy boundary imports** (lines 1-28):
```typescript
import { z } from "zod"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const PUBLIC_DISCOVERY_PRIVATE_FIELDS_EXCLUDED = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "raw diagnostics",
  "host paths",
  "env values",
  "tokens",
  "DB details",
  "package paths",
  "private runtime internals",
] as const
```

**Signed-in dashboard schema pattern** (lines 178-219):
```typescript
export const SignedInCompetitionEntryDashboardDtoSchema = z.object({
  kind: z.literal("signedInCompetitionEntryDashboard"),
  boundary: PublicDiscoveryBoundarySchema,
  competition: PublicDiscoveryCompetitionCardSchema,
  signedIn: z.boolean(),
  accountUnavailable: z.boolean(),
  revisionsUnavailable: z.boolean(),
  eligibleRevisions: z.array(
    z.object({
      strategyRevisionId: z.string().min(1),
      strategyId: z.string().min(1),
      label: z.string().min(1),
      publicStrategyHref: PublicDiscoveryHrefSchema,
      sourceHash: z.string().min(1),
      sourceBytes: z.number().int().nonnegative(),
      runtimeLabel: z.string().min(1),
      countedPlayEligible: z.boolean(),
      countedPlayReason: z.string().min(1).nullable(),
      createdAt: z.string().min(1),
    }),
  ),
  entryMode: z.enum(["exhibition-preset", "unavailable"]),
  entryHref: PublicDiscoveryHrefSchema.optional(),
})
```

**Leak-safety helper pattern** (lines 251-259):
```typescript
export const publicDiscoveryBoundary = (): PublicDiscoveryBoundary => ({
  apiVersion: PUBLIC_DISCOVERY_API_VERSION,
  apiNamespace: "public-discovery",
  executionContract: "not-match-execution-app-v1",
  privateFieldsExcluded: [...PUBLIC_DISCOVERY_PRIVATE_FIELDS_EXCLUDED],
})

export const assertPublicDiscoveryDtoLeakSafe = (value: unknown): void =>
  assertPublicOutputLeakSafe(value, "Public discovery DTO")
```

**Apply to Phase 250:** Extend dashboard schema with a ladder entry mode such as `"counted-ladder-season"`, an `entryHref` pointing to `/api/ladder/seasons/{seasonId}/entries`, and per-revision public eligibility category/remediation fields. Do not add Strategy source, artifact bytes, raw diagnostics, provider proof strings, or private runtime internals.

---

### `packages/spec/src/competition-entry-eligibility.test.ts` (test, transform)

**Analog:** `packages/spec/src/spec.test.ts`

**Grouped contract test imports** (lines 16-27):
```typescript
import {
  assertCompetitionPolicyV136PublicLeakSafe,
  COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS,
  COMPETITION_POLICY_V1_36_COUNTED_STATE_PUBLIC_PROJECTIONS,
  COMPETITION_POLICY_V1_36_ID,
  COMPETITION_POLICY_V1_36_POSTURE,
  COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS,
} from "./competition-policy-v1-36.js"
```

**Vocabulary assertion pattern** (lines 134-164):
```typescript
it("POST-03/D-11 defines counted-state public projection vocabulary only", () => {
  expect(
    COMPETITION_POLICY_V1_36_COUNTED_STATE_PUBLIC_PROJECTIONS.map(
      (projection) => projection.state,
    ),
  ).toEqual([
    "pending",
    "counted",
    "retrying",
    "degraded_system_failure",
    "non_counted",
    "non_competitive",
    "under_review",
    "disputed",
    "invalid",
    "invalidated",
  ])
})
```

**Leak-safety assertion pattern** (lines 228-274):
```typescript
expect(COMPETITION_POLICY_V1_36_PRIVACY_EXCLUSIONS).toEqual(
  expect.arrayContaining([
    "Strategy source",
    "StrategyMemory",
    "artifact bytes",
    "raw diagnostics",
    "DB details",
    "private runtime internals",
  ]),
)
expect(() =>
  assertCompetitionPolicyV136PublicLeakSafe(COMPETITION_POLICY_V1_36_PUBLIC_PAYLOAD),
).not.toThrow()
```

**Apply to Phase 250:** Assert exact category list, public message/remediation presence, no private markers, and parity with the Go category names where applicable.

---

### `packages/persistence/src/ladder.ts` (service, CRUD / request-response)

**Analog:** `packages/persistence/src/ladder.ts`

**Imports and local error pattern** (lines 1-40):
```typescript
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import {
  evaluateStrategyRuntimeCountedEligibility,
  normalizeStrategyRuntimeMetadata,
  STRATEGY_RUNTIME_ABI_VERSION,
  type TrialLadderEntrySnapshot,
} from "@cowards/spec"
import type { Pool } from "pg"

export class LadderInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LadderInputError"
  }
}
```

**Runtime eligibility and provider-proof gate pattern** (lines 42-101):
```typescript
export const assertLadderEligibleRuntime = (
  runtime: unknown,
  provenance: { metadata?: unknown; sourceHash?: string; sourceBytes?: number } = {},
): CompetitionEntrantSnapshot["runtime"] => {
  const eligibility = evaluateStrategyRuntimeCountedEligibility(runtime)
  if (!eligibility.ok) {
    throw new LadderInputError(
      eligibility.publicMessage ??
        "Strategy Revision runtime is not eligible for trial ladder entry.",
    )
  }
  const normalized = normalizeStrategyRuntimeMetadata(runtime)
  if (
    normalized.language.id === "typescript" &&
    !sourceArtifactProviderValidationMatches(
      provenance.metadata,
      provenance.sourceHash,
      provenance.sourceBytes,
      "strategy-language-provider-js-ts",
      "typescript",
    )
  ) {
    throw new LadderInputError(
      "TypeScript trial ladder entry requires provider-validated artifact provenance.",
    )
  }
  return normalized
}
```

**Provider proof matching pattern** (lines 103-171):
```typescript
const sourceArtifactProviderValidationMatches = (
  metadata: unknown,
  sourceHash: string | undefined,
  sourceBytes: number | undefined,
  providerId: string,
  language: "typescript" | "python",
): boolean => {
  if (!sourceHash || sourceBytes === undefined || metadata === null || typeof metadata !== "object") {
    return false
  }
  const providerValidation = (metadata as { providerValidation?: unknown })
    .providerValidation
  const sourceArtifact = (metadata as { sourceArtifact?: unknown })
    .sourceArtifact
  if (sourceArtifact === null || typeof sourceArtifact !== "object") {
    return false
  }
  const artifact = sourceArtifact as Record<string, unknown>
  if (
    typeof artifact.hash !== "string" ||
    typeof artifact.bytes !== "number" ||
    typeof artifact.bytesBase64 !== "string" ||
    artifact.sourceHash !== sourceHash ||
    artifact.sourceBytes !== sourceBytes ||
    artifact.validationStatus !== "valid"
  ) {
    return false
  }
  return expected !== null && safeEqual(validation.proof, expected)
}
```

**Entry mutation pattern** (lines 444-558):
```typescript
export const enterTrialLadderSeason = async (
  pool: Pool,
  input: { seasonId: string; userId: UserId; revisionId: StrategyRevisionId },
): Promise<string> => {
  const season = await pool.query<{ status: TrialLadderSeasonStatus }>(
    "select status from trial_ladder_seasons where id = $1",
    [input.seasonId],
  )
  if (season.rows[0]?.status !== "open") {
    throw new LadderInputError("Trial ladder season is not open for entries.")
  }
  const rowResult = await pool.query(/* account-owned revision join */, [
    input.revisionId,
    input.userId,
  ])
  if (!row) {
    throw new LadderInputError("Strategy Revision is not owned by this user.")
  }
  if (!row.validation.valid) {
    throw new LadderInputError(
      "Strategy Revision is not eligible for trial ladder entry.",
    )
  }
  const runtime = assertLadderEligibleRuntime(row.runtime, {
    metadata: row.metadata,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
  })
  await pool.query(`insert into trial_ladder_entries (...) values (...)`, [...])
  await createRepositories(pool).lockStrategyRevision(input.revisionId)
  return entryId
}
```

**Withdraw pattern** (lines 561-573):
```typescript
export const withdrawTrialLadderEntry = async (
  pool: Pool,
  input: { seasonId: string; userId: UserId },
): Promise<void> => {
  await pool.query(
    `
      update trial_ladder_entries
      set status = 'withdrawn', withdrawn_at = coalesce(withdrawn_at, now())
      where season_id = $1 and owner_user_id = $2 and status = 'active'
    `,
    [input.seasonId, input.userId],
  )
}
```

**Apply to Phase 250:** Split the current throw-only path into a persistence-owned evaluator returning `{ ok, category, publicMessage, remediation }` before insert. Keep the existing provider proof helpers, but classify false returns as missing vs mismatched where possible. Add a pre-insert owner/season query for any historical entry and still catch PostgreSQL `23505` as a race fallback.

---

### `packages/persistence/src/ladder.test.ts` (test, transform / CRUD)

**Analog:** `packages/persistence/src/ladder.test.ts`

**Provider proof fixture pattern** (lines 1-15, 17-34):
```typescript
import { describe, expect, it } from "vitest"
import { Buffer } from "node:buffer"
import { createHash, createHmac } from "node:crypto"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { assertLadderEligibleRuntime } from "./ladder.js"

const TEST_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.33"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET = TEST_PROVIDER_VALIDATION_SECRET
```

**Positive and negative provider proof pattern** (lines 71-135):
```typescript
it("requires artifact provenance before counted Zig trial ladder entry", () => {
  const sourceHash = "zig-source-hash"
  const sourceBytes = 192

  expect(() =>
    assertLadderEligibleRuntime({
      ...defaultRuntimeMetadata(),
      language: { id: "zig", version: "0.16.0-wasm32-wasi" },
      adapter: { id: "runtime-wasm-wasi-wasmtime-preview1", version: "0.1.0-alpha" },
    }),
  ).toThrow("provider-validated artifact provenance")

  expect(
    assertLadderEligibleRuntime(runtime, {
      sourceHash,
      sourceBytes,
      metadata: { compiledArtifact, providerValidation },
    }).language.id,
  ).toBe("zig")
})
```

**Private artifact bytes requirement pattern** (lines 204-280):
```typescript
const { bytesBase64: _redactedBytesBase64, ...publicSourceArtifact } =
  sourceArtifact

expect(
  assertLadderEligibleRuntime(runtime, {
    sourceHash,
    sourceBytes,
    metadata: { sourceArtifact, providerValidation },
  }).language.id,
).toBe("typescript")
expect(() =>
  assertLadderEligibleRuntime(runtime, {
    sourceHash,
    sourceBytes,
    metadata: { sourceArtifact: publicSourceArtifact, providerValidation },
  }),
).toThrow("provider-validated artifact provenance")
```

**Apply to Phase 250:** Extend this matrix to assert category results for valid TypeScript/Python/Rust/Zig, missing proof, mismatched/stale proof, TinyGo, unsupported source format, package mode, required capabilities, invalid revision, owner mismatch, mutable draft, duplicate owner Season entry, `23505` fallback, and withdrawn replacement attempt.

---

### `packages/persistence/migrations/000X_counted_entry_owner_invariant.sql` (migration, batch)

**Analog:** `packages/persistence/migrations/0004_competition_trust_beta.sql`

**Season policy and entry uniqueness pattern** (lines 28-40, 53-78):
```sql
create table if not exists trial_ladder_seasons (
  id text primary key,
  status text not null,
  replacement_policy text not null default 'next-season-only',
  stale_revision_policy text not null default 'locked snapshot remains active for current season',
  created_at timestamptz not null default now()
);

create table if not exists trial_ladder_entries (
  id text primary key,
  season_id text not null references trial_ladder_seasons(id) on delete cascade,
  owner_user_id text not null references users(id),
  strategy_revision_id text not null references strategy_revisions(id),
  status text not null default 'active',
  snapshot jsonb not null,
  entry_index integer not null,
  withdrawn_at timestamptz,
  invalidated_at timestamptz,
  unique(season_id, owner_user_id),
  unique(season_id, strategy_revision_id),
  unique(season_id, entry_index)
);
```

**Apply to Phase 250:** The existing full `unique(season_id, owner_user_id)` already blocks mid-season replacement, including withdrawn historical rows. If a migration is added, preserve full historical uniqueness; do not replace it with a partial active-only unique index unless a separate historical no-replacement constraint is also present.

---

### `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts` (route, request-response)

**Analog:** `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.ts`

**Thin route pattern** (lines 1-25):
```typescript
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> | { seasonId: string } },
): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const { seasonId } = await params
    const body = (await request.json()) as Record<string, unknown>
    const result = await competitiveServer.enterTrialLadderSeason(user, {
      seasonId,
      revisionId: body.revisionId,
    })
    return Response.json(result, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
```

**Apply to Phase 250:** Keep route logic thin. Return success as `{ entryId }` or a stable `ok: true` shape. Rejections should come from `competitiveErrorResponse` as category-bearing public objects, not raw persistence messages.

---

### `apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts` (test, request-response)

**Analog:** `apps/web/app/api/workshop/validate/route.test.ts`

**Request helper and route import pattern** (lines 1-28):
```typescript
import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route.js"

const request = (body: unknown): Request =>
  new Request("http://test.local/api/workshop/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
```

**Public-safe response assertion pattern** (lines 90-95, 112-125):
```typescript
expect(body.checker.status).toBe("ready")
expect(JSON.stringify(body.checker)).not.toContain("SHOULD_NOT_LEAK")
expect(JSON.stringify(body.checker)).not.toContain("hmac-sha256")

expect(body.checker.status).toBe("system_unavailable")
expect(body.checker.diagnostics[0].category).toBe("system_unavailable")
```

**Apply to Phase 250:** Add tests for unauthenticated 401, success 201, category response for ineligible revisions, public-safe redaction, and route delegation to `competitiveServer.enterTrialLadderSeason`. Mock only service boundaries; do not execute Strategy code.

---

### `apps/web/app/competitive/server.ts` (service / adapter, request-response)

**Analog:** `apps/web/app/competitive/server.ts`

**Imports and server dependency pattern** (lines 1-56):
```typescript
import { cookies } from "next/headers.js"
import { createDatabasePool } from "@cowards/persistence/db"
import {
  enterTrialLadderSeason,
  LadderInputError,
  withdrawTrialLadderEntry,
} from "@cowards/persistence/ladder"
import { CompetitiveInputError } from "../../lib/competitive-errors.js"
```

**Persistence error mapping pattern** (lines 152-190):
```typescript
const mapPersistenceError = (error: unknown): never => {
  if (error instanceof CompetitiveInputError) {
    throw error
  }
  if (
    error instanceof AuthInputError ||
    error instanceof AccountRevisionError ||
    error instanceof CompetitionInputError ||
    error instanceof LadderInputError ||
    error instanceof GovernanceInputError
  ) {
    throw new CompetitiveInputError(error.message, { status: 400 })
  }
  if (error instanceof Error && (error as { code?: string }).code === "23505") {
    throw new CompetitiveInputError(
      "That username, handle, or active exhibition already exists.",
      { status: 409 },
    )
  }
  throw error
}
```

**Server method wrapper pattern** (lines 539-553):
```typescript
async enterTrialLadderSeason(
  user: CompetitiveUser,
  input: { seasonId: unknown; revisionId: unknown },
): Promise<{ entryId: string }> {
  try {
    return await withPool(async (pool) => ({
      entryId: await enterTrialLadderSeason(pool, {
        seasonId: normalizeText(input.seasonId),
        userId: user.id,
        revisionId: normalizeText(input.revisionId) as StrategyRevisionId,
      }),
    }))
  } catch (error) {
    return mapPersistenceError(error)
  }
}
```

**Apply to Phase 250:** Add a category-bearing persistence error type or result mapper. Map `already_entered_season` to 409, auth/owner mismatch to 403 or 404/400 per chosen policy, and validation/provider/runtime categories to 400/422. Preserve storage-unavailable mapping to 503.

---

### `apps/web/app/competitive/http.ts` (utility, request-response)

**Analog:** `apps/web/app/competitive/http.ts`

**Error response pattern** (lines 18-35):
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

**Apply to Phase 250:** Keep the centralized response helper. For category-bearing `CompetitiveInputError`, return `{ ok: false, error, category, publicMessage, remediation }` or the chosen stable shape. Never include raw DB constraint text, provider proof strings, artifact bytes, host paths, env values, or source.

---

### `apps/web/lib/competitive-errors.ts` (utility, request-response)

**Analog:** `apps/web/lib/competitive-errors.ts`

**Typed app error pattern** (lines 1-13):
```typescript
export class CompetitiveInputError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number | undefined

  constructor(
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message)
    this.name = "CompetitiveInputError"
    this.status = options.status ?? 400
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}
```

**Apply to Phase 250:** Add optional `category`, `publicMessage`, and `remediation` fields here rather than inventing per-route error wrappers.

---

### `apps/web/lib/public-discovery-service.ts` (service / projection, request-response)

**Analog:** `apps/web/lib/public-discovery-service.ts`

**Spec schema import and leak-safe projection pattern** (lines 1-19):
```typescript
import {
  SignedInCompetitionEntryDashboardDtoSchema,
  assertPublicDiscoveryDtoLeakSafe,
  publicDiscoveryBoundary,
  type SignedInCompetitionEntryDashboardDto,
} from "@cowards/spec"
```

**Signed-in dashboard projection pattern** (lines 456-540):
```typescript
const getSignedInCompetitionEntryDashboard = async (
  competitionId: string,
): Promise<SignedInCompetitionEntryDashboardDto | null> => {
  const detail = await getPublicCompetitionDetail(competitionId)
  if (!detail) {
    return null
  }
  let accountUnavailable = false
  let revisionsUnavailable = false
  let user: AccountReadUser | null = null
  let revisions: AccountReadRevisionSummary[] = []
  try {
    user = await deps.getCurrentUser()
  } catch (error) {
    if (isGoBackendServiceUnavailableError(error)) {
      accountUnavailable = true
    } else {
      throw error
    }
  }
  const validRevisions = revisions.filter((revision) => revision.valid)
  const entryMode =
    parseCompetitionId(competitionId)?.kind === "exhibition"
      ? "exhibition-preset"
      : "unavailable"
  const dto = SignedInCompetitionEntryDashboardDtoSchema.parse({
    kind: "signedInCompetitionEntryDashboard",
    boundary: publicDiscoveryBoundary(),
    competition: detail.competition,
    eligibleRevisions: validRevisions.map((revision) => ({
      strategyRevisionId: revision.id,
      sourceHash: revision.sourceHash,
      sourceBytes: revision.sourceBytes,
      countedPlayEligible:
        revision.runtimeSemantics.countedPlayEligible === true,
      countedPlayReason: revision.runtimeSemantics.countedPlayReason,
    })),
    entryMode,
    ...(entryMode === "exhibition-preset" ? { entryHref: "/api/exhibitions" } : {}),
  })
  return assertDiscovery(dto)
}
```

**Apply to Phase 250:** For `ladder:{seasonId}`, produce a counted ladder entry mode with `entryHref`. Use the spec/persistence category contract to project per-revision eligibility and remediation. Keep account/revision read failures fail-closed and source-free.

---

### `apps/web/lib/public-discovery-service.test.ts` (test, request-response)

**Analog:** `apps/web/lib/public-discovery-service.test.ts`

**Ladder policy fixture pattern** (lines 42-89):
```typescript
const service = createPublicDiscoveryService({
  env: {
    COWARDS_PUBLIC_DISCOVERY_LADDER_SEASON_IDS:
      "ladder-season:good,ladder-season:broken",
  },
  getLadderSeason: async (seasonId) => ({
    seasonId,
    status: "active",
    policy: {
      oneEntryPerUser: true,
      replacementPolicy: "next-season-only",
      staleRevisionPolicy: "latest valid revision only",
      standingsReset: true,
      noPermanentRatings: true,
      minimumEntries: 2,
      targetPodSize: 4,
    },
    entries: [],
    standings: [],
    matchSets: [],
    publication: { publicEntries: true, publicStandings: true, publicReplayEvidence: true, privateFieldsExcluded: [] },
  } as any),
})
```

**Source-free dashboard assertion pattern** (lines 141-192):
```typescript
const dashboard = await service.getSignedInCompetitionEntryDashboard(
  "exhibition:standard-exhibition-v1",
)

expect(dashboard?.eligibleRevisions).toHaveLength(1)
expect(JSON.stringify(dashboard)).not.toContain("source:")
expect(JSON.stringify(dashboard?.eligibleRevisions)).not.toContain(
  "StrategyMemory",
)
```

**Apply to Phase 250:** Add ladder dashboard tests asserting `entryMode` and `entryHref`, eligible/ineligible category projection, remediation copy, account/revision fail-closed states, and no private markers.

---

### `apps/web/app/competitions/[competitionId]/enter/page.tsx` (component / page, request-response)

**Analog:** `apps/web/app/competitions/[competitionId]/enter/page.tsx`

**Server page dashboard gate pattern** (lines 15-68):
```tsx
export default async function CompetitionEnterPage({ params }: Props) {
  const { competitionId } = await params
  const dashboard = await getSignedInCompetitionEntryDashboard(competitionId)

  if (!dashboard) {
    return <main className="app-page">...</main>
  }

  if (!dashboard.signedIn) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <h1>Sign in required</h1>
          <p>
            Entry requires a session-backed account so saved Strategy Revision
            ownership can be checked before competition creation.
          </p>
        </section>
      </main>
    )
  }

  if (dashboard.entryMode !== "exhibition-preset") {
    return <main className="app-page">Entry unavailable</main>
  }
}
```

**Projection-to-client mapping pattern** (lines 104-119):
```tsx
const revisions = dashboard.eligibleRevisions.map((revision) => ({
  id: revision.strategyRevisionId,
  strategyId: revision.strategyId,
  label: revision.label,
  sourceHash: revision.sourceHash,
  sourceBytes: revision.sourceBytes,
  valid: true,
  runtimeSemantics: {
    languageId: revision.languageId,
    languageLabel: revision.languageLabel,
    countedPlayLabel: revision.countedPlayLabel,
    countedPlayEligible: revision.countedPlayEligible,
    countedPlayReason: revision.countedPlayReason,
  },
  createdAt: revision.createdAt,
}))
```

**Apply to Phase 250:** Add a counted ladder entry branch instead of returning “Entry unavailable” for ladder competitions. Render authoritative category/remediation data; do not infer eligibility from runtime labels alone.

---

### `apps/web/app/exhibitions/new/exhibition-client.tsx` (component, event-driven / request-response)

**Analog:** `apps/web/app/exhibitions/new/exhibition-client.tsx`

**Client state and counted toggle pattern** (lines 38-68):
```tsx
export function ExhibitionClient({ presets, revisions }: ExhibitionClientProps) {
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "")
  const [selectedRevisionIds, setSelectedRevisionIds] = useState<string[]>([])
  const [counted, setCounted] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const validRevisions = revisions.filter((revision) => revision.valid)
  const selectableRevisionIds = new Set(
    validRevisions
      .filter((revision) =>
        counted ? revision.runtimeSemantics.countedPlayEligible : true,
      )
      .map((revision) => revision.id),
  )
}
```

**Submit route pattern** (lines 80-109):
```tsx
const submit = async () => {
  setSubmitting(true)
  setError("")
  try {
    const response = await fetch("/api/exhibitions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        presetId,
        revisionIds: selectedRevisionIds,
        counted,
      }),
    })
    const body = (await response.json()) as { matchSetId?: string; error?: string }
    if (!response.ok || !body.matchSetId) {
      setError(body.error ?? "Exhibition could not be created.")
      return
    }
    window.location.assign(`/matchsets/${encodeURIComponent(body.matchSetId)}`)
  } finally {
    setSubmitting(false)
  }
}
```

**Non-counted exhibition copy pattern** (lines 147-179):
```tsx
<div className="segmented-control" aria-label="Exhibition counting">
  <button className={counted ? "active" : ""} type="button">
    Counted
  </button>
  <button className={!counted ? "active" : ""} type="button">
    Unranked
  </button>
</div>
{!counted ? (
  <p className="workshop-muted">
    Unranked exhibitions may include any valid revision, including historical
    non-counted provider evidence.
  </p>
) : null}
```

**Apply to Phase 250:** Keep exhibition workflow separate from ladder entry. Update labels/copy so “counted” here cannot be confused with counted trial ladder standings, or rename it to a clearer exhibition-only mode if planner chooses.

---

### `apps/web/app/api/exhibitions/route.ts` (route, request-response)

**Analog:** `apps/web/app/api/exhibitions/route.ts`

**Selected Go backend exhibition route pattern** (lines 1-35):
```typescript
import type { StrategyRevisionId } from "@cowards/spec"
import { competitiveErrorResponse } from "../../competitive/http.js"
import {
  getAccountSessionId,
  requireSelectedGoBackendClient,
} from "../../../lib/account-service-adapter.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const revisionIds = Array.isArray(body.revisionIds)
      ? body.revisionIds.filter(
          (revisionId): revisionId is StrategyRevisionId =>
            typeof revisionId === "string",
        )
      : []
    const result = await requireSelectedGoBackendClient(
      "exhibitions",
    ).createMatchSet(await getAccountSessionId(), {
      presetId: body.presetId,
      revisionIds,
      ...(body.counted === false ? { counted: false } : {}),
    })
    return Response.json({ matchSetId: result.matchSetId, status: "queued" }, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
```

**Apply to Phase 250:** Do not route exhibition creation through counted ladder entry. Preserve same-user/multi-revision exhibition permissiveness and keep standings isolation explicit in copy/tests.

---

### `apps/go-backend/provider_readiness.go` (service / classifier, transform)

**Analog:** `apps/go-backend/provider_readiness.go`

**Category result structure** (lines 3-17):
```go
type revisionReadinessState string

const (
	revisionReadinessExecutionReady    revisionReadinessState = "execution_ready"
	revisionReadinessNonExecutionDraft revisionReadinessState = "non_execution_draft"
	revisionReadinessInvalid           revisionReadinessState = "invalid"
	revisionReadinessUnavailable       revisionReadinessState = "runtime_service_unavailable"
)

type revisionReadinessResult struct {
	State           revisionReadinessState
	PublicCategory  string
	EntryEligible   bool
	CountedEligible bool
}
```

**Classifier category ladder pattern** (lines 29-98):
```go
func classifyRevisionReadiness(input revisionReadinessInput) revisionReadinessResult {
	if input.Failure != nil {
		return revisionReadinessResult{
			State:          revisionReadinessUnavailable,
			PublicCategory: "runtime_service_unavailable",
		}
	}
	runtime := input.Runtime
	languageID := stringValue(mapValue(runtime, "language"), "id")
	if input.SourceFormat == "tinygo" || languageID == "tinygo" {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "hidden_unsupported_provider",
		}
	}
	if !isProviderSourceFormat(input.SourceFormat) || !isProviderSourceFormat(languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "unsupported_source_format",
		}
	}
	if validationStatus(input.Validation) != "valid" {
		return revisionReadinessResult{
			State:          revisionReadinessNonExecutionDraft,
			PublicCategory: "invalid_strategy_revision",
		}
	}
	if stringValue(mapValue(runtime, "package"), "mode") != "none" {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "package_policy_violation",
		}
	}
	if !providerProofPresent(input.Metadata, languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "provider_proof_missing",
		}
	}
	if !providerProofMatches(input.Metadata, input.SourceHash, input.SourceBytes, languageID) {
		return revisionReadinessResult{
			State:          revisionReadinessInvalid,
			PublicCategory: "provider_proof_mismatched",
		}
	}
	return revisionReadinessResult{
		State:           revisionReadinessExecutionReady,
		PublicCategory:  "provider_validated",
		EntryEligible:   true,
		CountedEligible: true,
	}
}
```

**Provider language set pattern** (lines 100-102):
```go
func isProviderSourceFormat(value string) bool {
	return value == "typescript" || value == "python" || value == "rust" || value == "zig"
}
```

**Apply to Phase 250:** Keep Go public categories aligned with the spec-owned category contract. Add only Phase 250 parity categories that Go can truthfully classify; ownership/season duplicate categories may remain TypeScript persistence/API-owned unless Go owns that mutation.

---

### `apps/go-backend/provider_readiness_test.go` (test, transform)

**Analog:** `apps/go-backend/provider_readiness_test.go`

**Table-driven category matrix pattern** (lines 10-31, 32-45):
```go
func TestProviderReadinessClassifiesPhase244StatesD02D03D04D09D10D11(t *testing.T) {
	t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
	source := "export default { selectActivations() { return []; } }"
	sourceHash := hashString(source)
	sourceBytes := len([]byte(source))
	validRuntime := defaultRuntimeMetadata()
	validValidation := map[string]any{
		"valid":       true,
		"errors":      []any{},
		"warnings":    []any{},
		"sourceHash":  sourceHash,
		"sourceBytes": sourceBytes,
	}

	tests := []struct {
		name          string
		input         revisionReadinessInput
		state         revisionReadinessState
		category      string
		entryEligible bool
	}{...}
}
```

**Negative category assertions pattern** (lines 59-143):
```go
{
	name: "D-04 missing provider proof is not eligible",
	input: revisionReadinessInput{SourceFormat: "typescript", Runtime: validRuntime},
	state:    revisionReadinessInvalid,
	category: "provider_proof_missing",
},
{
	name: "D-11 package mode other than none is rejected",
	input: revisionReadinessInput{SourceFormat: "typescript", Runtime: packageRuntime},
	state:    revisionReadinessInvalid,
	category: "package_policy_violation",
},
{
	name: "D-11 TinyGo stays hidden unsupported provider",
	input: revisionReadinessInput{SourceFormat: "tinygo", Runtime: wasmWasiRuntimeMetadata("tinygo")},
	state:    revisionReadinessInvalid,
	category: "hidden_unsupported_provider",
},
```

**Readiness metadata persistence pattern** (lines 184-200):
```go
if input.Metadata["readinessState"] != string(revisionReadinessExecutionReady) ||
	input.Metadata["readinessCategory"] != "provider_validated" ||
	input.Metadata["entryEligible"] != true ||
	input.Metadata["countedEligible"] != true {
	t.Fatalf("save assembly omitted readiness labels: %+v", input.Metadata)
}
```

**Apply to Phase 250:** Add parity tests for any renamed category contract and ensure TinyGo/unsupported format/package/proof mismatch remain coarse and public-safe.

---

### `packages/persistence/src/competition.test.ts` (test, event-driven / transform)

**Analog:** `packages/persistence/src/competition.test.ts`

**Exhibition same-user matrix pattern** (lines 58-98, 186-207):
```typescript
const entrants = [
  {
    entrantId: "entrant:0",
    strategyRevisionId: "strategy-revision:a",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
  },
  {
    entrantId: "entrant:1",
    strategyRevisionId: "strategy-revision:b",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
  },
]

it("generates mirrored pairwise Match matrices without collapsing same-user entrants", () => {
  const matches = generateCompetitionPairwiseMatrix({
    matchSetId: "match-set:exhibition:test",
    presetId: "smoke-exhibition-v1",
    entrants,
  })

  expect(matches).toHaveLength(6)
  expect(matches.map((match) => [
    match.bottomStrategyRevisionId,
    match.topStrategyRevisionId,
  ])).toEqual([
    ["strategy-revision:a", "strategy-revision:b"],
    ["strategy-revision:b", "strategy-revision:a"],
  ])
})
```

**TypeScript competition quarantine pattern** (lines 130-150):
```typescript
it("labels TypeScript competition MatchSet creation and public DTO refresh as non-normal support", () => {
  expect(TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.normalBackend).toBe(false)
  expect(TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.selectedNormalBackend).toBe(false)
  expect(TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE.allowedRoles).toEqual([
    "rollback",
    "test",
    "parity",
    "fixture",
    "deferred",
  ])
})
```

**Apply to Phase 250:** Keep exhibition tests explicitly permissive for same-user/multi-revision workflows. Add complementary counted ladder tests in `ladder.test.ts` proving the same owner cannot create multiple counted Season entries.

## Shared Patterns

### Spec-Owned Public Categories

**Source:** `packages/spec/src/competition-policy-v1-36.ts` lines 36-49 and `apps/go-backend/provider_readiness.go` lines 29-98

**Apply to:** spec contract, persistence eligibility evaluator, API responses, public discovery dashboard, Go readiness parity, tests.

Use `as const` category records in spec and table-driven parity tests. Public categories should be stable and coarse. Remediation copy belongs in spec or a spec-adjacent helper, not React components.

### Provider-Proof Validation

**Source:** `packages/persistence/src/ladder.ts` lines 42-245 and `packages/persistence/src/competition.ts` lines 51-256

**Apply to:** counted entry evaluator and tests.

Do not bypass these helpers. They validate source hash/bytes, artifact hash/bytes, private artifact bytes, ABI, target triple, provider id, contract version, and HMAC proof. Phase 250 should normalize their failure into public categories instead of returning raw helper details.

### One-Owner-Per-Season Invariant

**Source:** `packages/persistence/migrations/0004_competition_trust_beta.sql` lines 53-78

**Apply to:** persistence preflight, migration review, API error mapping, duplicate-entry tests.

The existing `unique(season_id, owner_user_id)` is stronger than “one active” and matches the no mid-season replacement decision. Preserve it and add a friendly preflight category before insert; catch `23505` as race fallback.

### Immutable Revision Boundary

**Source:** `packages/persistence/src/repositories.ts` lines 14-41 and 150-159; `packages/persistence/migrations/0001_initial.sql` lines 41-80

**Apply to:** counted entry evaluator and mutable-draft rejection.

Existing insertion locks revisions after entry. Phase 250 requires counted entry to treat mutable drafts as ineligible before entry succeeds, so read `locked_at` or equivalent immutable state in the preflight query and classify mutable rows before mutation.

### Web/API Error Mapping

**Source:** `apps/web/app/competitive/server.ts` lines 152-190, `apps/web/app/competitive/http.ts` lines 18-35, `apps/web/lib/competitive-errors.ts` lines 1-13

**Apply to:** ladder entry route and route tests.

Keep route handlers thin and centralized. Add category fields to the shared error class/response helper so API output is stable and public-safe.

### Public Discovery Privacy

**Source:** `packages/spec/src/public-discovery.ts` lines 6-21 and 251-259; `apps/web/lib/public-discovery-service.test.ts` lines 187-192

**Apply to:** signed-in entry dashboard, public discovery schema, tests.

Every dashboard projection should parse through a spec schema and run leak-safety assertions. Tests should assert absence of Strategy source, memory, artifact bytes, raw diagnostics, provider proof strings, DB details, and private runtime internals.

### Exhibition Separation

**Source:** `apps/web/app/api/exhibitions/route.ts` lines 8-35, `apps/web/app/exhibitions/new/exhibition-client.tsx` lines 147-179, `packages/persistence/src/competition.test.ts` lines 186-207

**Apply to:** entry page, dashboard copy/tests, exhibition route/client tests.

Exhibition workflows remain separate and permissive. Do not reuse counted ladder entry mutation for exhibitions. Do not use exhibition same-user/multi-revision behavior as proof for counted standings eligibility.

## No Analog Found

No files lacked a usable analog. The main gap is not missing structure; it is category normalization around existing eligibility/proof code.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | All Phase 250 target roles have exact or role-match analogs. |

## Metadata

**Analog search scope:** `packages/spec/src`, `packages/persistence/src`, `packages/persistence/migrations`, `apps/web/app/api`, `apps/web/app/competitive`, `apps/web/lib`, `apps/go-backend`

**Files scanned:** 45+ targeted files from `rg --files` plus phase/project context.

**Pattern extraction date:** 2026-06-16

