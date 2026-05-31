import { z } from "zod"
import type {
  PublicMatchEvidenceDto,
  PublicMatchSetResultDto,
} from "./competition.js"
import type { JsonValue, MatchId, MatchSetId } from "./types.js"
import {
  PublicMatchSetResultServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  PublicReplayEvidenceServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
} from "./schemas.js"
import {
  assertPublicServiceDtoLeakSafe,
  SERVICE_API_VERSION,
  type PublicMatchSetSummaryServiceDto,
  type PublicReplayEvidenceServiceDto,
  type PublicReplayMetadataServiceDto,
} from "./service.js"
import {
  publicMatchSetSummaryExample,
  publicReplayEvidenceExample,
  publicReplayMetadataExample,
} from "./service-fixtures.js"

export const MATCH_EXECUTION_APP_CONTRACT_VERSION =
  "match-execution-app-v1" as const

export const MATCH_EXECUTION_LIFECYCLE_STATES = [
  "queued",
  "accepted",
  "running",
  "complete",
  "failed",
  "degraded",
  "unavailable",
] as const

export const MATCH_EXECUTION_RETRY_DISPOSITIONS = [
  "retryable",
  "non_retryable",
  "not_applicable",
] as const

export const MATCH_EXECUTION_FAILURE_CATEGORIES = [
  "strategy_failure",
  "system_failure",
  "timeout",
  "runtime_unavailable",
  "malformed_runtime_result",
  "stale_artifact",
  "blocked",
  "missing_chronicle",
  "no_result",
] as const

export const MATCH_EXECUTION_RESULT_AVAILABILITY = [
  "none",
  "partial",
  "complete",
] as const

export const MATCH_EXECUTION_REPLAY_AVAILABILITY = [
  "none",
  "pending",
  "available",
  "stale",
  "missing",
] as const

export const MATCH_EXECUTION_PUBLIC_FIELDS_EXCLUDED = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "raw diagnostics",
  "host paths",
  "environment values",
  "tokens",
  "DB details",
  "package paths",
  "private runtime internals",
] as const

export const MatchExecutionLifecycleStateV1Schema = z.enum(
  MATCH_EXECUTION_LIFECYCLE_STATES,
)
export const MatchExecutionRetryDispositionV1Schema = z.enum(
  MATCH_EXECUTION_RETRY_DISPOSITIONS,
)
export const MatchExecutionFailureCategoryV1Schema = z.enum(
  MATCH_EXECUTION_FAILURE_CATEGORIES,
)
export const MatchExecutionResultAvailabilityV1Schema = z.enum(
  MATCH_EXECUTION_RESULT_AVAILABILITY,
)
export const MatchExecutionReplayAvailabilityV1Schema = z.enum(
  MATCH_EXECUTION_REPLAY_AVAILABILITY,
)

export const MatchExecutionLifecycleV1Schema = z.object({
  state: MatchExecutionLifecycleStateV1Schema,
  terminal: z.boolean(),
  retryDisposition: MatchExecutionRetryDispositionV1Schema,
  failureCategory: MatchExecutionFailureCategoryV1Schema.optional(),
  resultAvailability: MatchExecutionResultAvailabilityV1Schema,
  replayAvailability: MatchExecutionReplayAvailabilityV1Schema,
  publicMessageKey: z.string().min(1),
})

export const MatchExecutionRuntimeEvidenceV1Schema = z.object({
  runtimeLabels: z.array(z.string().min(1)),
  eligibility: z.object({
    countedStrategyPath: z.literal("javascript-typescript-python-rust-zig"),
    nonCountedExhibitionBeta: z.array(z.enum(["rust", "zig"])),
    activeWasmWasiAbi: z.literal("preview1-stdin-stdout-json"),
  }),
  ownership: z.object({
    orchestration: z.literal("go"),
    hostileStrategyExecution: z.literal("runtime-service"),
    appExecution: z.literal(false),
  }),
})

export const MatchExecutionFailureEvidenceV1Schema = z.object({
  category: MatchExecutionFailureCategoryV1Schema,
  retryDisposition: MatchExecutionRetryDispositionV1Schema,
  publicMessageKey: z.string().min(1),
})

export const MatchExecutionPrivacyV1Schema = z.object({
  public: z.literal(true),
  privateFieldsExcluded: z.array(z.string().min(1)),
  ownerOrTestOnlyFieldsExcluded: z.literal(true),
})

export const MatchExecutionMatchResultV1Schema = z.object({
  contractVersion: z.literal(MATCH_EXECUTION_APP_CONTRACT_VERSION),
  kind: z.literal("matchExecutionMatchResult"),
  matchId: z.string().min(1),
  entrants: z.object({
    bottom: z.string().min(1),
    top: z.string().min(1),
  }),
  lifecycle: MatchExecutionLifecycleV1Schema,
  replayAvailable: z.boolean(),
  chronicleHash: z.string().min(1).optional(),
  arenaVariantId: z.string().min(1).optional(),
  runtimeEvidence: MatchExecutionRuntimeEvidenceV1Schema,
  failureEvidence: MatchExecutionFailureEvidenceV1Schema.optional(),
})

export const MatchExecutionMatchSetSummaryV1Schema = z.object({
  contractVersion: z.literal(MATCH_EXECUTION_APP_CONTRACT_VERSION),
  kind: z.literal("matchExecutionMatchSetSummary"),
  matchSetId: z.string().min(1),
  lifecycle: MatchExecutionLifecycleV1Schema,
  result: PublicMatchSetResultServiceDtoSchema,
  matches: z.array(MatchExecutionMatchResultV1Schema),
  runtimeEvidence: MatchExecutionRuntimeEvidenceV1Schema,
  failureEvidence: z.array(MatchExecutionFailureEvidenceV1Schema),
  privacy: MatchExecutionPrivacyV1Schema,
})

export const MatchExecutionReplayMetadataV1Schema = z.object({
  contractVersion: z.literal(MATCH_EXECUTION_APP_CONTRACT_VERSION),
  kind: z.literal("matchExecutionReplayMetadata"),
  matchId: z.string().min(1),
  lifecycle: MatchExecutionLifecycleV1Schema,
  serviceDto: PublicReplayMetadataServiceDtoSchema,
  privacy: MatchExecutionPrivacyV1Schema,
})

export const MatchExecutionReplayEvidenceV1Schema = z.object({
  contractVersion: z.literal(MATCH_EXECUTION_APP_CONTRACT_VERSION),
  kind: z.literal("matchExecutionReplayEvidence"),
  matchId: z.string().min(1),
  lifecycle: MatchExecutionLifecycleV1Schema,
  serviceDto: PublicReplayEvidenceServiceDtoSchema,
  privacy: MatchExecutionPrivacyV1Schema,
})

export const MatchExecutionFixtureClassificationV1Schema = z.enum([
  "public",
  "owner-test-only",
  "execution-internal",
  "intentionally-unstable",
])

export const MatchExecutionContractFixtureV1Schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  classification: MatchExecutionFixtureClassificationV1Schema,
  service: z.object({
    matchSetSummary: PublicMatchSetSummaryServiceDtoSchema.optional(),
    replayMetadata: PublicReplayMetadataServiceDtoSchema.optional(),
    replayEvidence: PublicReplayEvidenceServiceDtoSchema.optional(),
  }),
  app: z.object({
    matchSetSummary: MatchExecutionMatchSetSummaryV1Schema.optional(),
    replayMetadata: MatchExecutionReplayMetadataV1Schema.optional(),
    replayEvidence: MatchExecutionReplayEvidenceV1Schema.optional(),
  }),
})

export type MatchExecutionLifecycleStateV1 = z.infer<
  typeof MatchExecutionLifecycleStateV1Schema
>
export type MatchExecutionRetryDispositionV1 = z.infer<
  typeof MatchExecutionRetryDispositionV1Schema
>
export type MatchExecutionFailureCategoryV1 = z.infer<
  typeof MatchExecutionFailureCategoryV1Schema
>
export type MatchExecutionReplayAvailabilityV1 = z.infer<
  typeof MatchExecutionReplayAvailabilityV1Schema
>
export type MatchExecutionLifecycleV1 = z.infer<
  typeof MatchExecutionLifecycleV1Schema
>
export type MatchExecutionRuntimeEvidenceV1 = z.infer<
  typeof MatchExecutionRuntimeEvidenceV1Schema
>
export type MatchExecutionFailureEvidenceV1 = z.infer<
  typeof MatchExecutionFailureEvidenceV1Schema
>
export type MatchExecutionMatchResultV1 = z.infer<
  typeof MatchExecutionMatchResultV1Schema
>
export type MatchExecutionMatchSetSummaryV1 = z.infer<
  typeof MatchExecutionMatchSetSummaryV1Schema
>
export type MatchExecutionReplayMetadataV1 = z.infer<
  typeof MatchExecutionReplayMetadataV1Schema
>
export type MatchExecutionReplayEvidenceV1 = z.infer<
  typeof MatchExecutionReplayEvidenceV1Schema
>
export type MatchExecutionContractFixtureV1 = z.infer<
  typeof MatchExecutionContractFixtureV1Schema
>

type LifecycleOverride = {
  state?: MatchExecutionLifecycleStateV1 | undefined
  failureCategory?: MatchExecutionFailureCategoryV1 | undefined
  retryDisposition?: MatchExecutionRetryDispositionV1 | undefined
  replayAvailability?: MatchExecutionReplayAvailabilityV1 | undefined
  publicMessageKey?: string | undefined
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const lifecycleOverrideFromMetadata = (
  metadata: JsonValue | undefined,
): LifecycleOverride => {
  if (!isRecord(metadata)) {
    return {}
  }
  const matchExecution = metadata.matchExecution
  if (!isRecord(matchExecution)) {
    return {}
  }
  const override: LifecycleOverride = {}
  const state = MatchExecutionLifecycleStateV1Schema.safeParse(
    matchExecution.state,
  )
  if (state.success) {
    override.state = state.data
  }
  const failureCategory = MatchExecutionFailureCategoryV1Schema.safeParse(
    matchExecution.failureCategory,
  )
  if (failureCategory.success) {
    override.failureCategory = failureCategory.data
  }
  const retryDisposition = MatchExecutionRetryDispositionV1Schema.safeParse(
    matchExecution.retryDisposition,
  )
  if (retryDisposition.success) {
    override.retryDisposition = retryDisposition.data
  }
  const replayAvailability = MatchExecutionReplayAvailabilityV1Schema.safeParse(
    matchExecution.replayAvailability,
  )
  if (replayAvailability.success) {
    override.replayAvailability = replayAvailability.data
  }
  if (
    typeof matchExecution.publicMessageKey === "string" &&
    matchExecution.publicMessageKey.length > 0
  ) {
    override.publicMessageKey = matchExecution.publicMessageKey
  }
  return override
}

const publicReasonToFailureCategory = (
  reason: PublicMatchEvidenceDto["publicReason"],
): MatchExecutionFailureCategoryV1 | undefined => {
  switch (reason) {
    case "strategy_failure":
      return "strategy_failure"
    case "system_failure":
      return "system_failure"
    case "invalid_result":
      return "malformed_runtime_result"
    case "no_result":
      return "no_result"
    default:
      return undefined
  }
}

const matchEvidenceFailureCategory = (
  match: PublicMatchEvidenceDto,
): MatchExecutionFailureCategoryV1 | undefined => {
  if (match.status === "blocked") {
    return "blocked"
  }
  return publicReasonToFailureCategory(match.publicReason)
}

const retryDispositionFor = (
  category: MatchExecutionFailureCategoryV1 | undefined,
  state: MatchExecutionLifecycleStateV1,
): MatchExecutionRetryDispositionV1 => {
  if (!category) {
    return state === "queued" || state === "accepted" || state === "running"
      ? "retryable"
      : "not_applicable"
  }
  switch (category) {
    case "system_failure":
    case "timeout":
    case "runtime_unavailable":
      return "retryable"
    case "strategy_failure":
    case "malformed_runtime_result":
    case "stale_artifact":
    case "blocked":
    case "missing_chronicle":
    case "no_result":
      return "non_retryable"
  }
}

const defaultPublicMessageKey = (
  state: MatchExecutionLifecycleStateV1,
  category?: MatchExecutionFailureCategoryV1,
): string =>
  category ? `match_execution.${category}` : `match_execution.${state}`

const terminalState = (state: MatchExecutionLifecycleStateV1): boolean =>
  state === "complete" ||
  state === "failed" ||
  state === "degraded" ||
  state === "unavailable"

const resultAvailabilityFor = (
  state: MatchExecutionLifecycleStateV1,
): MatchExecutionMatchSetSummaryV1["lifecycle"]["resultAvailability"] => {
  if (state === "complete") {
    return "complete"
  }
  if (state === "degraded") {
    return "partial"
  }
  return "none"
}

const replayAvailabilityFor = (
  matches: readonly Pick<
    PublicMatchEvidenceDto,
    "replayAvailable" | "status"
  >[],
  state: MatchExecutionLifecycleStateV1,
  category?: MatchExecutionFailureCategoryV1,
): MatchExecutionReplayAvailabilityV1 => {
  if (category === "stale_artifact") {
    return "stale"
  }
  if (category === "missing_chronicle") {
    return "missing"
  }
  if (matches.some((match) => match.replayAvailable)) {
    return "available"
  }
  if (state === "queued" || state === "accepted" || state === "running") {
    return "pending"
  }
  return "none"
}

const matchLifecycleState = (
  match: PublicMatchEvidenceDto,
  override?: LifecycleOverride,
): MatchExecutionLifecycleStateV1 => {
  if (override?.state) {
    return override.state
  }
  if (match.status === "pending") {
    return "queued"
  }
  if (match.status === "running") {
    return "running"
  }
  if (match.status === "complete") {
    return match.publicReason ? "degraded" : "complete"
  }
  return "failed"
}

export const createMatchExecutionRuntimeEvidenceV1 = (
  result?: PublicMatchSetResultDto,
): MatchExecutionRuntimeEvidenceV1 => {
  const storedNonCounted =
    result?.metadata &&
    typeof result.metadata === "object" &&
    !Array.isArray(result.metadata) &&
    "countedStatus" in result.metadata &&
    result.metadata.countedStatus === "non_counted"
  const historicalNonCounted = [
    ...(result?.entrants.some(
      (entrant) => entrant.runtime.language.id === "rust",
    )
      ? ["rust" as const]
      : []),
    ...(result?.entrants.some(
      (entrant) => entrant.runtime.language.id === "zig",
    )
      ? ["zig" as const]
      : []),
  ]
  return MatchExecutionRuntimeEvidenceV1Schema.parse({
    runtimeLabels:
      result?.entrants.map(
        (entrant) =>
          `${entrant.runtime.language.id}:${entrant.runtime.adapter.id}`,
      ) ?? [],
    eligibility: {
      countedStrategyPath: "javascript-typescript-python-rust-zig",
      nonCountedExhibitionBeta: storedNonCounted ? historicalNonCounted : [],
      activeWasmWasiAbi: "preview1-stdin-stdout-json",
    },
    ownership: {
      orchestration: "go",
      hostileStrategyExecution: "runtime-service",
      appExecution: false,
    },
  })
}

export const createMatchExecutionPrivacyV1 = () =>
  MatchExecutionPrivacyV1Schema.parse({
    public: true,
    privateFieldsExcluded: [...MATCH_EXECUTION_PUBLIC_FIELDS_EXCLUDED],
    ownerOrTestOnlyFieldsExcluded: true,
  })

const createFailureEvidence = (
  category: MatchExecutionFailureCategoryV1 | undefined,
  retryDisposition: MatchExecutionRetryDispositionV1,
  publicMessageKey: string,
): MatchExecutionFailureEvidenceV1 | undefined =>
  category
    ? MatchExecutionFailureEvidenceV1Schema.parse({
        category,
        retryDisposition,
        publicMessageKey,
      })
    : undefined

export const createMatchExecutionLifecycleV1 = (
  state: MatchExecutionLifecycleStateV1,
  options: {
    failureCategory?: MatchExecutionFailureCategoryV1 | undefined
    retryDisposition?: MatchExecutionRetryDispositionV1 | undefined
    replayAvailability?: MatchExecutionReplayAvailabilityV1 | undefined
    publicMessageKey?: string | undefined
    matches?: readonly Pick<
      PublicMatchEvidenceDto,
      "replayAvailable" | "status"
    >[]
  } = {},
): MatchExecutionLifecycleV1 => {
  const failureCategory = options.failureCategory
  const retryDisposition =
    options.retryDisposition ?? retryDispositionFor(failureCategory, state)
  return MatchExecutionLifecycleV1Schema.parse({
    state,
    terminal: terminalState(state),
    retryDisposition,
    failureCategory,
    resultAvailability: resultAvailabilityFor(state),
    replayAvailability:
      options.replayAvailability ??
      replayAvailabilityFor(options.matches ?? [], state, failureCategory),
    publicMessageKey:
      options.publicMessageKey ??
      defaultPublicMessageKey(state, failureCategory),
  })
}

export const toMatchExecutionMatchResultV1 = (
  match: PublicMatchEvidenceDto,
  result?: PublicMatchSetResultDto,
  override?: LifecycleOverride,
): MatchExecutionMatchResultV1 => {
  const state = matchLifecycleState(match, override)
  const failureCategory =
    override?.failureCategory ?? matchEvidenceFailureCategory(match)
  const retryDisposition =
    override?.retryDisposition ?? retryDispositionFor(failureCategory, state)
  const publicMessageKey =
    override?.publicMessageKey ??
    defaultPublicMessageKey(state, failureCategory)
  const failureEvidence = createFailureEvidence(
    failureCategory,
    retryDisposition,
    publicMessageKey,
  )
  return MatchExecutionMatchResultV1Schema.parse({
    contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
    kind: "matchExecutionMatchResult",
    matchId: match.matchId,
    entrants: match.entrants,
    lifecycle: createMatchExecutionLifecycleV1(state, {
      failureCategory,
      retryDisposition,
      replayAvailability:
        override?.replayAvailability ??
        replayAvailabilityFor([match], state, failureCategory),
      publicMessageKey,
      matches: [match],
    }),
    replayAvailable: match.replayAvailable,
    chronicleHash: match.chronicleHash,
    arenaVariantId: match.arenaVariantId,
    runtimeEvidence: createMatchExecutionRuntimeEvidenceV1(result),
    failureEvidence,
  })
}

export const toMatchExecutionMatchSetSummaryV1 = (
  serviceDto: PublicMatchSetSummaryServiceDto,
): MatchExecutionMatchSetSummaryV1 => {
  assertPublicServiceDtoLeakSafe(serviceDto)
  const override = lifecycleOverrideFromMetadata(serviceDto.result.metadata)
  const state = override.state ?? serviceDto.result.status
  const failureCategory =
    override.failureCategory ??
    serviceDto.result.matches
      .map((match) => matchEvidenceFailureCategory(match))
      .find((category): category is MatchExecutionFailureCategoryV1 =>
        Boolean(category),
      )
  const retryDisposition =
    override.retryDisposition ?? retryDispositionFor(failureCategory, state)
  const publicMessageKey =
    override.publicMessageKey ?? defaultPublicMessageKey(state, failureCategory)
  const runtimeEvidence = createMatchExecutionRuntimeEvidenceV1(
    serviceDto.result,
  )
  const matches = serviceDto.result.matches.map((match) =>
    toMatchExecutionMatchResultV1(match, serviceDto.result),
  )
  const failureEvidence = matches
    .map((match) => match.failureEvidence)
    .filter(
      (evidence): evidence is MatchExecutionFailureEvidenceV1 =>
        evidence !== undefined,
    )

  return MatchExecutionMatchSetSummaryV1Schema.parse({
    contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
    kind: "matchExecutionMatchSetSummary",
    matchSetId: serviceDto.matchSetId,
    lifecycle: createMatchExecutionLifecycleV1(state, {
      failureCategory,
      retryDisposition,
      replayAvailability: override.replayAvailability,
      publicMessageKey,
      matches: serviceDto.result.matches,
    }),
    result: serviceDto.result,
    matches,
    runtimeEvidence,
    failureEvidence,
    privacy: createMatchExecutionPrivacyV1(),
  })
}

export const toMatchExecutionReplayMetadataV1 = (
  serviceDto: PublicReplayMetadataServiceDto,
): MatchExecutionReplayMetadataV1 => {
  assertPublicServiceDtoLeakSafe(serviceDto)
  return MatchExecutionReplayMetadataV1Schema.parse({
    contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
    kind: "matchExecutionReplayMetadata",
    matchId: serviceDto.matchId,
    lifecycle: createMatchExecutionLifecycleV1("complete", {
      replayAvailability: "available",
    }),
    serviceDto,
    privacy: createMatchExecutionPrivacyV1(),
  })
}

export const toMatchExecutionReplayEvidenceV1 = (
  serviceDto: PublicReplayEvidenceServiceDto,
): MatchExecutionReplayEvidenceV1 => {
  assertPublicServiceDtoLeakSafe(serviceDto)
  return MatchExecutionReplayEvidenceV1Schema.parse({
    contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
    kind: "matchExecutionReplayEvidence",
    matchId: serviceDto.matchId,
    lifecycle: createMatchExecutionLifecycleV1("complete", {
      replayAvailability: "available",
    }),
    serviceDto,
    privacy: createMatchExecutionPrivacyV1(),
  })
}

const createScenarioSummary = (
  id: string,
  label: string,
  resultState: PublicMatchSetResultDto["status"],
  matchState: PublicMatchEvidenceDto["status"],
  override: LifecycleOverride = {},
  publicReason?: PublicMatchEvidenceDto["publicReason"],
  replayAvailable = false,
): PublicMatchSetSummaryServiceDto => {
  const summary = clone(
    publicMatchSetSummaryExample as PublicMatchSetSummaryServiceDto,
  )
  const matchId = `match:fixture:${id}` as MatchId
  const runtime: PublicMatchSetResultDto["entrants"][number]["runtime"] = {
    abiVersion: "strategy-runtime-abi-v1.14",
    language: { id: "typescript", version: "runtime-js-v1" },
    adapter: {
      id: "runtime-js-worker-thread",
      version: "runtime-js-v1",
    },
    package: { mode: "none", entrypoint: "default" },
    requiredCapabilities: [],
  }
  summary.matchSetId = `match-set:fixture:${id}` as MatchSetId
  summary.result.matchSetId = summary.matchSetId
  summary.result.status = resultState
  summary.result.preset = {
    ...summary.result.preset,
    label,
  }
  summary.result.entrants = [
    {
      entrantId: "entrant:fixture:bottom",
      entrantIndex: 0,
      strategyRevisionId: "strategy-revision:fixture:bottom",
      ownerUserId: "user:fixture:bottom",
      ownerHandle: "fixture-bottom",
      displayLabel: "@fixture-bottom / public fixture",
      sourceHash: "sourcehash-fixture-bottom",
      sourceBytes: 128,
      runtime,
      engineCompatibility: {
        spec: "cowards-rules-v1.4",
        engine: "engine-v1",
      },
      lockedAt: "2026-05-30T00:00:00.000Z",
    },
    {
      entrantId: "entrant:fixture:top",
      entrantIndex: 1,
      strategyRevisionId: "strategy-revision:fixture:top",
      ownerUserId: "user:fixture:top",
      ownerHandle: "fixture-top",
      displayLabel: "@fixture-top / public fixture",
      sourceHash: "sourcehash-fixture-top",
      sourceBytes: 128,
      runtime,
      engineCompatibility: {
        spec: "cowards-rules-v1.4",
        engine: "engine-v1",
      },
      lockedAt: "2026-05-30T00:00:00.000Z",
    },
  ]
  summary.result.matches = [
    {
      matchId,
      entrants: {
        bottom: "entrant:fixture:bottom",
        top: "entrant:fixture:top",
      },
      status: matchState,
      replayAvailable:
        replayAvailable &&
        matchState === "complete" &&
        publicReason === undefined,
      chronicleHash:
        replayAvailable &&
        matchState === "complete" &&
        publicReason === undefined
          ? `chroniclehash-fixture-${id}`
          : undefined,
      publicReason,
      arenaVariantId: "arena:standard",
    },
  ]
  summary.result.provenance = {
    ...summary.result.provenance,
    matchSetId: summary.matchSetId,
    chronicleHashes:
      replayAvailable && matchState === "complete" && publicReason === undefined
        ? [`chroniclehash-fixture-${id}`]
        : [],
  }
  summary.result.publication = {
    ...summary.result.publication,
    privateFieldsExcluded: [...MATCH_EXECUTION_PUBLIC_FIELDS_EXCLUDED],
  }
  const matchExecutionMetadata: Record<string, string> = {
    publicMessageKey:
      override.publicMessageKey ??
      `match_execution.fixture.${id.replaceAll("-", "_")}`,
  }
  if (override.state) {
    matchExecutionMetadata.state = override.state
  }
  if (override.failureCategory) {
    matchExecutionMetadata.failureCategory = override.failureCategory
  }
  if (override.retryDisposition) {
    matchExecutionMetadata.retryDisposition = override.retryDisposition
  }
  if (override.replayAvailability) {
    matchExecutionMetadata.replayAvailability = override.replayAvailability
  }
  summary.result.metadata = { matchExecution: matchExecutionMetadata }
  return PublicMatchSetSummaryServiceDtoSchema.parse(summary)
}

const completeSummary = createScenarioSummary(
  "complete",
  "Complete fixture",
  "complete",
  "complete",
)
const replayMetadata = PublicReplayMetadataServiceDtoSchema.parse({
  ...(publicReplayMetadataExample as PublicReplayMetadataServiceDto),
  matchId: "match:fixture:public-safe-replay",
  metadata: {
    ...(publicReplayMetadataExample as PublicReplayMetadataServiceDto).metadata,
    matchId: "match:fixture:public-safe-replay",
    arenaVariantId: "arena:fixture-public-safe",
  },
})
const replayEvidence = PublicReplayEvidenceServiceDtoSchema.parse({
  ...(publicReplayEvidenceExample as PublicReplayEvidenceServiceDto),
  matchId: "match:fixture:public-safe-replay",
  metadata: {
    ...(publicReplayEvidenceExample as PublicReplayEvidenceServiceDto).metadata,
    matchId: "match:fixture:public-safe-replay",
    arenaVariantId: "arena:fixture-public-safe",
  },
  projection: {
    ...(publicReplayEvidenceExample as PublicReplayEvidenceServiceDto)
      .projection,
    reproducibility: {
      ...(publicReplayEvidenceExample as PublicReplayEvidenceServiceDto)
        .projection.reproducibility,
      matchId: "match:fixture:public-safe-replay",
      arenaVariantId: "arena:fixture-public-safe",
    },
    snapshots: (
      publicReplayEvidenceExample as PublicReplayEvidenceServiceDto
    ).projection.snapshots.map((snapshot) => ({
      ...snapshot,
      board: {
        bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
        soldiers: [
          {
            id: "fixture-bottom-soldier-1",
            ownerPlayerId: "player:bottom",
            status: "ACTIVE",
            position: { x: 1, y: 3 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
          {
            id: "fixture-top-soldier-1",
            ownerPlayerId: "player:top",
            status: "ACTIVE",
            position: { x: 3, y: 1 },
            facing: "DOWN",
            lastSuccessfulMoveDirection: null,
          },
        ],
        terrainStones: [{ x: 2, y: 2 }],
      },
    })),
  },
}) as PublicReplayEvidenceServiceDto

export const MATCH_EXECUTION_CONTRACT_FIXTURES_V1 = [
  {
    id: "complete",
    label: "Complete public MatchSet",
    classification: "public",
    service: { matchSetSummary: completeSummary },
  },
  {
    id: "running",
    label: "Running MatchSet",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "running",
        "Running fixture",
        "running",
        "running",
      ),
    },
  },
  {
    id: "queued",
    label: "Queued MatchSet",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "queued",
        "Queued fixture",
        "queued",
        "pending",
      ),
    },
  },
  {
    id: "strategy-failure",
    label: "Strategy failure evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "strategy-failure",
        "Strategy failure fixture",
        "degraded",
        "complete",
        { failureCategory: "strategy_failure" },
        "strategy_failure",
      ),
    },
  },
  {
    id: "system-failure",
    label: "System failure evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "system-failure",
        "System failure fixture",
        "degraded",
        "failed_system",
        { failureCategory: "system_failure" },
        "system_failure",
      ),
    },
  },
  {
    id: "timeout",
    label: "Timeout evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "timeout",
        "Timeout fixture",
        "failed",
        "failed_system",
        { failureCategory: "timeout", retryDisposition: "retryable" },
        "system_failure",
      ),
    },
  },
  {
    id: "unavailable-runtime",
    label: "Unavailable runtime evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "unavailable-runtime",
        "Unavailable runtime fixture",
        "failed",
        "failed_system",
        {
          state: "unavailable",
          failureCategory: "runtime_unavailable",
          retryDisposition: "retryable",
        },
        "system_failure",
      ),
    },
  },
  {
    id: "malformed-runtime-result",
    label: "Malformed runtime result evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "malformed-runtime-result",
        "Malformed runtime result fixture",
        "failed",
        "failed_system",
        { failureCategory: "malformed_runtime_result" },
        "invalid_result",
      ),
    },
  },
  {
    id: "stale-artifact",
    label: "Stale artifact evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "stale-artifact",
        "Stale artifact fixture",
        "failed",
        "blocked",
        {
          failureCategory: "stale_artifact",
          replayAvailability: "stale",
        },
        "no_result",
      ),
    },
  },
  {
    id: "public-safe-replay",
    label: "Public-safe replay evidence",
    classification: "public",
    service: {
      matchSetSummary: createScenarioSummary(
        "public-safe-replay",
        "Public safe replay fixture",
        "complete",
        "complete",
        {},
        undefined,
        true,
      ),
      replayMetadata,
      replayEvidence,
    },
  },
].map((fixture) =>
  MatchExecutionContractFixtureV1Schema.parse({
    ...fixture,
    app: {
      matchSetSummary: fixture.service.matchSetSummary
        ? toMatchExecutionMatchSetSummaryV1(fixture.service.matchSetSummary)
        : undefined,
      replayMetadata: fixture.service.replayMetadata
        ? toMatchExecutionReplayMetadataV1(fixture.service.replayMetadata)
        : undefined,
      replayEvidence: fixture.service.replayEvidence
        ? toMatchExecutionReplayEvidenceV1(fixture.service.replayEvidence)
        : undefined,
    },
  }),
) satisfies readonly MatchExecutionContractFixtureV1[]

export const MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1 =
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1.map((fixture) => fixture.id)

export const getMatchExecutionContractFixtureByMatchSetId = (
  matchSetId: string,
): MatchExecutionContractFixtureV1 | undefined =>
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1.find(
    (fixture) => fixture.service.matchSetSummary?.matchSetId === matchSetId,
  )

export const getMatchExecutionContractFixtureByMatchId = (
  matchId: string,
): MatchExecutionContractFixtureV1 | undefined =>
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1.find(
    (fixture) =>
      fixture.service.replayMetadata?.matchId === matchId ||
      fixture.service.replayEvidence?.matchId === matchId ||
      fixture.service.matchSetSummary?.result.matches.some(
        (match) => match.matchId === matchId,
      ),
  )

for (const fixture of MATCH_EXECUTION_CONTRACT_FIXTURES_V1) {
  if (fixture.service.matchSetSummary) {
    assertPublicServiceDtoLeakSafe(fixture.service.matchSetSummary)
  }
  if (fixture.service.replayMetadata) {
    assertPublicServiceDtoLeakSafe(fixture.service.replayMetadata)
  }
  if (fixture.service.replayEvidence) {
    assertPublicServiceDtoLeakSafe(fixture.service.replayEvidence)
  }
}

if (SERVICE_API_VERSION !== "service-api-v1.8") {
  throw new Error("Match execution app contract must review service API drift")
}
