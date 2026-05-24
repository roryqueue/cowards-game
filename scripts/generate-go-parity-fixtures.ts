#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildChronicleFromMatch } from "../packages/replay/src/build.ts"
import { createChronicleMetadata } from "../packages/persistence/src/chronicle-store.ts"
import { createWorkshopAnalyticsDemoSnapshot } from "../packages/persistence/src/workshop-analytics.ts"
import { createCowardsLocalService } from "../packages/service/src/index.ts"
import { createGoldenMatchInput } from "../packages/golden/src/index.ts"
import {
  AnalyticsRunSummaryServiceDtoSchema,
  EXHIBITION_SCORING_POLICY_V1,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  SERVICE_API_ROUTES,
  ServiceErrorDtoSchema,
  ServiceHealthDtoSchema,
  assertAnalyticsPublicSummaryLeakSafe,
  assertPublicServiceDtoLeakSafe,
  serviceHealthExample,
  SERVICE_API_VERSION,
  type AnalyticsRunSummaryServiceDto,
  type PublicMatchSetResultDto,
  type PublicStrategyCardDto,
  type PublicStrategyPageServiceDto,
  type ServiceErrorDto,
} from "../packages/spec/src/index.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const fixtureDir = path.join(
  repoRoot,
  "apps/go-backend/testdata/service-fixtures",
)
const goChecksumSourcePath = path.join(
  repoRoot,
  "apps/go-backend/fixture_checksums_gen.go",
)
const staleMessage = "Go parity fixtures are stale; run pnpm go:parity:generate"

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue)
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entryValue]) => [key, stableValue(entryValue)]),
    )
  }
  return value
}

const withTrailingNewline = (value: unknown): string =>
  `${JSON.stringify(stableValue(value), null, 2)}\n`

const runtime = {
  abiVersion: "strategy-runtime-abi-v1.14",
  language: { id: "typescript", version: "runtime-js-v1" },
  adapter: {
    id: "runtime-js-worker-thread",
    version: "runtime-js-v1",
  },
  package: { mode: "none", entrypoint: "default" },
  requiredCapabilities: [],
} as const

const PUBLIC_STRATEGY_ID = "strategy:go-parity:sentinel"

const createPublicStrategyCard = (): PublicStrategyCardDto => ({
  strategyId: PUBLIC_STRATEGY_ID,
  strategyRevisionId: "strategy-revision:go-parity:sentinel",
  name: "Go Parity Sentinel",
  description:
    "Public Strategy page fixture generated through @cowards/service.",
  tags: ["parity", "read-only"],
  authorHandle: "go-parity",
  sourceHash: "sha256:go-parity-sentinel",
  sourceBytes: 192,
  runtime,
  engineCompatibility: {
    spec: "cowards-rules-v1.4",
    engine: "engine-v1",
  },
  validationStatus: "valid",
  record: {
    wins: 4,
    losses: 2,
    draws: 1,
    points: 13,
  },
  resultLinks: ["/matchsets/match-set:go-parity:golden"],
  replayLinks: ["/matches/golden%3Av1-7%3Amatch/replay"],
})

const createGoldenMatchSetResult = (): PublicMatchSetResultDto => {
  const { chronicle } = buildChronicleFromMatch(createGoldenMatchInput())
  const metadata = createChronicleMetadata(chronicle)
  return {
    matchSetId: "match-set:go-parity:golden",
    preset: {
      id: "smoke-exhibition-v1",
      version: "v1",
      label: "Smoke exhibition",
    },
    status: "complete",
    visibility: "public",
    scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
    entrants: [
      {
        entrantId: "entrant:bottom",
        entrantIndex: 0,
        strategyRevisionId: "strategy-revision:golden-bottom",
        ownerUserId: "user:bottom",
        ownerHandle: "bottom",
        displayLabel: "@bottom / golden fixture",
        sourceHash: "sourcehash-bottom",
        sourceBytes: 128,
        runtime,
        engineCompatibility: {
          spec: "cowards-rules-v1.4",
          engine: "engine-v1",
        },
        lockedAt: "2026-05-22T00:00:00.000Z",
      },
      {
        entrantId: "entrant:top",
        entrantIndex: 1,
        strategyRevisionId: "strategy-revision:golden-top",
        ownerUserId: "user:top",
        ownerHandle: "top",
        displayLabel: "@top / golden fixture",
        sourceHash: "sourcehash-top",
        sourceBytes: 128,
        runtime,
        engineCompatibility: {
          spec: "cowards-rules-v1.4",
          engine: "engine-v1",
        },
        lockedAt: "2026-05-22T00:00:00.000Z",
      },
    ],
    standings: [],
    matches: [
      {
        matchId: metadata.matchId,
        entrants: { bottom: "entrant:bottom", top: "entrant:top" },
        status: "complete",
        replayAvailable: true,
        chronicleHash: metadata.hash,
        arenaVariantId: metadata.arenaVariantId,
      },
    ],
    provenance: {
      matchSetId: "match-set:go-parity:golden",
      presetId: "smoke-exhibition-v1",
      scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
      entrantSnapshotIds: ["entrant:bottom", "entrant:top"],
      chronicleHashes: [metadata.hash],
    },
    publication: {
      publicResults: true,
      publicReplayEvidence: true,
      privateFieldsExcluded: [
        "Strategy source",
        "StrategyMemory",
        "SoldierMemory",
        "objective payloads",
      ],
    },
  }
}

const createDegradedMatchSetResult = (): PublicMatchSetResultDto => ({
  ...createGoldenMatchSetResult(),
  matchSetId: "match-set:go-parity:degraded",
  status: "degraded",
  matches: [
    {
      matchId: "match:go-parity:system-failed",
      entrants: { bottom: "entrant:bottom", top: "entrant:top" },
      status: "failed_system",
      replayAvailable: false,
      publicReason: "system_failure",
      arenaVariantId: "arena:standard",
    },
  ],
  provenance: {
    matchSetId: "match-set:go-parity:degraded",
    presetId: "smoke-exhibition-v1",
    scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
    entrantSnapshotIds: ["entrant:bottom", "entrant:top"],
    chronicleHashes: [],
  },
  metadata: {
    counted: false,
    publicReason: "system_failure",
  },
})

const createParityService = () => {
  const { chronicle } = buildChronicleFromMatch(createGoldenMatchInput())
  const stored = {
    artifact: chronicle,
    metadata: createChronicleMetadata(chronicle),
  }
  const analyticsSnapshot = createWorkshopAnalyticsDemoSnapshot()

  return {
    service: createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicMatchSetResult: async (_pool, matchSetId) => {
        if (matchSetId === "match-set:go-parity:golden") {
          return createGoldenMatchSetResult()
        }
        if (matchSetId === "match-set:go-parity:degraded") {
          return createDegradedMatchSetResult()
        }
        return null
      },
      createChronicleStore: () => ({
        getByMatchId: async (matchId) =>
          matchId === stored.metadata.matchId ? stored : null,
        put: async () => stored,
      }),
      buildPublicStrategyCard: async (_pool, strategyId) =>
        strategyId === PUBLIC_STRATEGY_ID ? createPublicStrategyCard() : null,
      getAnalyticsSnapshot: async () => analyticsSnapshot,
    }),
    analyticsSnapshot,
    replayMatchId: stored.metadata.matchId,
  }
}

const createServiceFixtures = async () => {
  const { service, analyticsSnapshot, replayMatchId } = createParityService()
  const analyticsRun =
    analyticsSnapshot.runs.find(
      (candidate) => candidate.id === analyticsSnapshot.selectedRunId,
    ) ?? analyticsSnapshot.runs.at(-1)
  if (!analyticsRun) {
    throw new Error("Workshop analytics demo snapshot did not produce a run")
  }

  const publicMatchSetSummary = await service.getPublicMatchSetSummary(
    "match-set:go-parity:golden",
  )
  const degradedMatchSetSummary = await service.getPublicMatchSetSummary(
    "match-set:go-parity:degraded",
  )
  const publicReplayMetadata =
    await service.getPublicReplayMetadata(replayMatchId)
  const publicStrategyPage =
    await service.getPublicStrategyPage(PUBLIC_STRATEGY_ID)
  const analyticsRunSummary = await service.getAnalyticsRunSummary(
    analyticsRun.ownerUserId,
    analyticsRun.id,
  )

  if (
    !publicMatchSetSummary ||
    !degradedMatchSetSummary ||
    !publicReplayMetadata ||
    !publicStrategyPage ||
    !analyticsRunSummary
  ) {
    throw new Error("TypeScript service did not produce all parity fixtures")
  }
  assertAnalyticsPublicSummaryLeakSafe(analyticsRunSummary.summary)
  return {
    publicMatchSetSummary,
    degradedMatchSetSummary,
    publicReplayMetadata,
    publicStrategyPage: PublicStrategyPageServiceDtoSchema.parse(
      publicStrategyPage,
    ) as PublicStrategyPageServiceDto,
    analyticsRunSummary: AnalyticsRunSummaryServiceDtoSchema.parse(
      analyticsRunSummary,
    ) as AnalyticsRunSummaryServiceDto,
  }
}

const routeManifest = [
  {
    id: SERVICE_API_ROUTES.health.id,
    method: SERVICE_API_ROUTES.health.method,
    path: SERVICE_API_ROUTES.health.path,
    authScope: SERVICE_API_ROUTES.health.authScope,
    privacyClass: SERVICE_API_ROUTES.health.privacyClass,
    samplePath: "/health",
  },
  {
    id: SERVICE_API_ROUTES.getPublicMatchSetSummary.id,
    method: SERVICE_API_ROUTES.getPublicMatchSetSummary.method,
    path: SERVICE_API_ROUTES.getPublicMatchSetSummary.path,
    authScope: SERVICE_API_ROUTES.getPublicMatchSetSummary.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicMatchSetSummary.privacyClass,
    samplePath: "/public/matchsets/match-set%3Ago-parity%3Agolden/summary",
  },
  {
    id: SERVICE_API_ROUTES.getPublicReplayMetadata.id,
    method: SERVICE_API_ROUTES.getPublicReplayMetadata.method,
    path: SERVICE_API_ROUTES.getPublicReplayMetadata.path,
    authScope: SERVICE_API_ROUTES.getPublicReplayMetadata.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicReplayMetadata.privacyClass,
    samplePath: "/public/replays/golden%3Av1-7%3Amatch/metadata",
  },
  {
    id: SERVICE_API_ROUTES.getPublicStrategyPage.id,
    method: SERVICE_API_ROUTES.getPublicStrategyPage.method,
    path: SERVICE_API_ROUTES.getPublicStrategyPage.path,
    authScope: SERVICE_API_ROUTES.getPublicStrategyPage.authScope,
    privacyClass: SERVICE_API_ROUTES.getPublicStrategyPage.privacyClass,
    samplePath: "/public/strategies/strategy%3Ago-parity%3Asentinel",
  },
  {
    id: SERVICE_API_ROUTES.getAnalyticsRunSummary.id,
    method: SERVICE_API_ROUTES.getAnalyticsRunSummary.method,
    path: SERVICE_API_ROUTES.getAnalyticsRunSummary.path,
    authScope: SERVICE_API_ROUTES.getAnalyticsRunSummary.authScope,
    privacyClass: SERVICE_API_ROUTES.getAnalyticsRunSummary.privacyClass,
    samplePath:
      "/analytics/runs/analytics-run%3Aworkshop-v1.6-demo%3A2/summary",
    requiresBearerToken: true,
  },
] as const

const notFoundError: ServiceErrorDto = {
  code: "NOT_FOUND",
  message: "Resource not found.",
  status: 404,
  publicSafe: true,
}

const forbiddenError: ServiceErrorDto = {
  code: "FORBIDDEN",
  message: "Owner authorization required.",
  status: 403,
  publicSafe: true,
}

const serviceFixtures = await createServiceFixtures()
const serviceFixturePayloads = {
  "health.json": ServiceHealthDtoSchema.parse(serviceHealthExample),
  "public-match-set-summary.json": PublicMatchSetSummaryServiceDtoSchema.parse(
    serviceFixtures.publicMatchSetSummary,
  ),
  "degraded-match-set-summary.json":
    PublicMatchSetSummaryServiceDtoSchema.parse(
      serviceFixtures.degradedMatchSetSummary,
    ),
  "public-replay-metadata.json": PublicReplayMetadataServiceDtoSchema.parse(
    serviceFixtures.publicReplayMetadata,
  ),
  "public-strategy-page.json": serviceFixtures.publicStrategyPage,
  "analytics-run-summary.json": serviceFixtures.analyticsRunSummary,
  "not-found-error.json": ServiceErrorDtoSchema.parse(notFoundError),
  "forbidden-error.json": ServiceErrorDtoSchema.parse(forbiddenError),
  "route-manifest.json": routeManifest,
} as const

const hashFixture = (value: unknown): string =>
  `sha256:${createHash("sha256").update(withTrailingNewline(value)).digest("hex")}`

const fixtureManifest = {
  schemaVersion: "go-parity-fixtures-v1.8",
  files: Object.fromEntries(
    Object.entries(serviceFixturePayloads)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fileName, value]) => [fileName, hashFixture(value)]),
  ),
} as const

const goChecksumEntries = Object.entries(fixtureManifest.files)
const goChecksumKeyWidth = Math.max(
  ...goChecksumEntries.map(([fileName]) => JSON.stringify(fileName).length),
)
const goChecksumSource = `${[
  "// Code generated by scripts/generate-go-parity-fixtures.ts; DO NOT EDIT.",
  "package main",
  "",
  "var expectedFixtureChecksumManifest = fixtureChecksumManifest{",
  `\tSchemaVersion: ${JSON.stringify(fixtureManifest.schemaVersion)},`,
  "\tFiles: map[string]string{",
  ...goChecksumEntries.map(
    ([fileName, checksum]) =>
      `\t\t${JSON.stringify(fileName).padEnd(goChecksumKeyWidth)}: ${JSON.stringify(checksum)},`,
  ),
  "\t},",
  "}",
].join("\n")}\n`

const fixtures = {
  ...serviceFixturePayloads,
  "fixture-manifest.json": fixtureManifest,
} as const

for (const [fileName, value] of Object.entries(fixtures)) {
  if (
    fileName === "route-manifest.json" ||
    fileName === "fixture-manifest.json"
  ) {
    continue
  }
  assertPublicServiceDtoLeakSafe(value)
}

const checkMode = process.argv.includes("--check")
mkdirSync(fixtureDir, { recursive: true })

let stale = false
for (const [fileName, value] of Object.entries(fixtures)) {
  const target = path.join(fixtureDir, fileName)
  const next = withTrailingNewline(value)
  if (checkMode) {
    let current = ""
    try {
      current = readFileSync(target, "utf8")
    } catch {
      stale = true
      continue
    }
    if (current !== next) {
      stale = true
    }
    continue
  }
  writeFileSync(target, next)
}

if (checkMode) {
  let current = ""
  try {
    current = readFileSync(goChecksumSourcePath, "utf8")
  } catch {
    stale = true
  }
  if (current !== goChecksumSource) {
    stale = true
  }
} else {
  writeFileSync(goChecksumSourcePath, goChecksumSource)
}

if (stale) {
  throw new Error(staleMessage)
}
