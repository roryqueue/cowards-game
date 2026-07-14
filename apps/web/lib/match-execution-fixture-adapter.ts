import {
  MatchExecutionContractFixtureV1Schema,
  PublicReplayEvidenceServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  classifyCompetitionCountedState,
  getMatchExecutionContractFixtureByMatchId,
  getMatchExecutionContractFixtureByMatchSetId,
  projectPublicCompetitionGovernance,
  toMatchExecutionMatchSetSummaryV1,
  type MatchExecutionContractFixtureV1,
  type MatchExecutionFailureCategoryV1,
  type MatchExecutionLifecycleV1,
  type MatchExecutionLifecycleStateV1,
  type MatchExecutionReplayAvailabilityV1,
  type MatchExecutionRetryDispositionV1,
  type JsonValue,
  type MatchId,
  type PublicMatchEvidenceDto,
  type PublicMatchSetResultDto,
  type MatchSetId,
  type PublicMatchSetSummaryServiceDto,
  type PublicReplayEvidenceServiceDto,
  type PublicReplayMetadataServiceDto,
  type StrategyRuntimeProductSemantics,
  type StrategyRuntimeProductValidationCode,
} from "@cowards/spec"

export interface MatchExecutionFixtureEnv extends Record<
  string,
  string | undefined
> {
  PLAYWRIGHT_TEST?: string | undefined
  NODE_ENV?: string | undefined
  COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES?: string | undefined
}

export interface MatchExecutionFixturePublicReadClient {
  getPublicMatchSetSummary(
    matchSetId: MatchSetId,
  ): Promise<PublicMatchSetSummaryServiceDto | null>
  getPublicReplayMetadata(
    matchId: MatchId,
  ): Promise<PublicReplayMetadataServiceDto | null>
  getPublicReplayEvidence(
    matchId: MatchId,
  ): Promise<PublicReplayEvidenceServiceDto | null>
  getPublicReplayCompetitionContext(
    matchId: MatchId,
  ): Promise<
    | (Pick<PublicMatchSetResultDto, "matchSetId"> &
        NonNullable<PublicMatchSetResultDto["competition"]>)
    | null
  >
  getPublicReplayState(matchId: MatchId): Promise<{
    label: string
    lifecycle: MatchExecutionLifecycleV1
  } | null>
}

export const isMatchExecutionFixtureEnabled = (
  env: MatchExecutionFixtureEnv = process.env,
): boolean =>
  env.NODE_ENV !== "production" &&
  (env.PLAYWRIGHT_TEST === "1" ||
    env.NODE_ENV === "test" ||
    env.COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES === "1")

const safeDecodeURIComponent = <T extends string>(value: T): T => {
  try {
    return decodeURIComponent(value) as T
  } catch {
    return value
  }
}

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const fixtureRuntimeReadiness = (
  value: string,
): StrategyRuntimeProductSemantics["readiness"] => {
  switch (value) {
    case "production-candidate":
    case "prototype":
    case "local-dev-fallback":
    case "experimental":
    case "unknown":
      return value
    default:
      throw new Error(`invalid fixture runtime readiness: ${value}`)
  }
}

const fixtureRuntimeValidationCode = (
  value: string,
): StrategyRuntimeProductValidationCode => {
  switch (value) {
    case "UNSUPPORTED_LANGUAGE":
    case "UNSUPPORTED_PACKAGE_METADATA":
    case "INCOMPATIBLE_ADAPTER":
    case "ABI_MISMATCH":
    case "SOURCE_TOO_LARGE":
    case "MEMORY_LIMIT_EXCEEDED":
    case "TIMEOUT":
    case "FORBIDDEN_CAPABILITY":
    case "NON_COUNTED_RUNTIME":
      return value
    default:
      throw new Error(`invalid fixture runtime validation code: ${value}`)
  }
}

export const toPublicMatchSetSummaryFixture = (
  summary: NonNullable<
    MatchExecutionContractFixtureV1["service"]["matchSetSummary"]
  >,
): PublicMatchSetSummaryServiceDto => ({
  ...summary,
  result: {
    ...summary.result,
    entrants: summary.result.entrants.map((entrant) => ({
      ...entrant,
      runtimeSemantics: {
        ...entrant.runtimeSemantics,
        readiness: fixtureRuntimeReadiness(entrant.runtimeSemantics.readiness),
        validationIssueCodes: entrant.runtimeSemantics.validationIssueCodes.map(
          fixtureRuntimeValidationCode,
        ),
      },
    })),
  },
})

const requiredBaseSummary = (): PublicMatchSetSummaryServiceDto => {
  const base = getMatchExecutionContractFixtureByMatchSetId(
    "match-set:fixture:stale-artifact",
  )?.service.matchSetSummary
  if (!base) {
    throw new Error("missing stale-artifact fixture summary")
  }
  return toPublicMatchSetSummaryFixture(
    PublicMatchSetSummaryServiceDtoSchema.parse(base),
  )
}

const createAppOnlyMatchSetFixture = (
  id: "missing-chronicle" | "no-result",
  label: string,
  displayName: string,
  status: PublicMatchSetResultDto["status"],
  matchStatus: PublicMatchEvidenceDto["status"],
  lifecycle: {
    state?: MatchExecutionLifecycleStateV1 | undefined
    failureCategory?: MatchExecutionFailureCategoryV1 | undefined
    retryDisposition?: MatchExecutionRetryDispositionV1 | undefined
    replayAvailability?: MatchExecutionReplayAvailabilityV1 | undefined
  },
  publicReason: PublicMatchEvidenceDto["publicReason"],
): MatchExecutionContractFixtureV1 => {
  const summary = cloneJson(requiredBaseSummary())
  const matchSetId = `match-set:fixture:${id}` as MatchSetId
  const matchId = `match:fixture:${id}` as MatchId
  const matchExecutionMetadata: Record<string, string> = {
    publicMessageKey: `match_execution.fixture.${id.replaceAll("-", "_")}`,
  }
  if (lifecycle.state) {
    matchExecutionMetadata.state = lifecycle.state
  }
  if (lifecycle.failureCategory) {
    matchExecutionMetadata.failureCategory = lifecycle.failureCategory
  }
  if (lifecycle.retryDisposition) {
    matchExecutionMetadata.retryDisposition = lifecycle.retryDisposition
  }
  if (lifecycle.replayAvailability) {
    matchExecutionMetadata.replayAvailability = lifecycle.replayAvailability
  }
  summary.matchSetId = matchSetId
  summary.result = {
    ...summary.result,
    matchSetId,
    preset: {
      ...summary.result.preset,
      label: displayName,
    },
    status,
    metadata: {
      matchExecution: matchExecutionMetadata,
    } as JsonValue,
    matches: summary.result.matches.map((match) => ({
      ...match,
      matchId,
      status: matchStatus,
      replayAvailable: false,
      chronicleHash: undefined,
      publicReason,
    })),
    provenance: {
      ...summary.result.provenance,
      matchSetId,
      chronicleHashes: [],
    },
  }
  const serviceSummary = toPublicMatchSetSummaryFixture(
    PublicMatchSetSummaryServiceDtoSchema.parse(summary),
  )
  return MatchExecutionContractFixtureV1Schema.parse({
    id,
    label,
    classification: "public",
    service: { matchSetSummary: serviceSummary },
    app: { matchSetSummary: toMatchExecutionMatchSetSummaryV1(serviceSummary) },
  })
}

const appOnlyReplayTrustFixtures = [
  createAppOnlyMatchSetFixture(
    "missing-chronicle",
    "Missing Chronicle evidence",
    "Missing Chronicle fixture",
    "failed",
    "failed_system",
    {
      failureCategory: "missing_chronicle",
      replayAvailability: "missing",
    },
    "no_result",
  ),
  createAppOnlyMatchSetFixture(
    "no-result",
    "No result evidence",
    "No result fixture",
    "degraded",
    "failed_system",
    {
      failureCategory: "no_result",
      replayAvailability: "none",
    },
    "no_result",
  ),
] as const

const getFixtureByMatchSetId = (
  matchSetId: MatchSetId,
): MatchExecutionContractFixtureV1 | undefined =>
  getMatchExecutionContractFixtureByMatchSetId(matchSetId) ??
  appOnlyReplayTrustFixtures.find(
    (fixture) => fixture.service.matchSetSummary?.matchSetId === matchSetId,
  )

const legacyPublicSafeReplayMatchId =
  "match:fixture:public-safe-replay" as MatchId
const canonicalPublicSafeReplayMatchId =
  "match:runtime-service:golden" as MatchId

const resolveFixtureMatchId = (matchId: MatchId): MatchId =>
  matchId === legacyPublicSafeReplayMatchId
    ? canonicalPublicSafeReplayMatchId
    : matchId

const getFixtureByMatchId = (
  matchId: MatchId,
): MatchExecutionContractFixtureV1 | undefined => {
  const resolvedMatchId = resolveFixtureMatchId(matchId)
  return (
    getMatchExecutionContractFixtureByMatchId(resolvedMatchId) ??
    appOnlyReplayTrustFixtures.find((fixture) =>
      fixture.service.matchSetSummary?.result.matches.some(
        (match) => match.matchId === resolvedMatchId,
      ),
    )
  )
}

export const createMatchExecutionFixturePublicReadClient = (
  env: MatchExecutionFixtureEnv = process.env,
): MatchExecutionFixturePublicReadClient | null => {
  if (!isMatchExecutionFixtureEnabled(env)) {
    return null
  }

  return {
    async getPublicMatchSetSummary(matchSetId) {
      const summary = getFixtureByMatchSetId(safeDecodeURIComponent(matchSetId))
        ?.service.matchSetSummary
      return summary
        ? toPublicMatchSetSummaryFixture(
            PublicMatchSetSummaryServiceDtoSchema.parse(summary),
          )
        : null
    },
    async getPublicReplayMetadata(matchId) {
      const metadata = getFixtureByMatchId(safeDecodeURIComponent(matchId))
        ?.service.replayMetadata
      return metadata
        ? (PublicReplayMetadataServiceDtoSchema.parse(
            metadata,
          ) as PublicReplayMetadataServiceDto)
        : null
    },
    async getPublicReplayEvidence(matchId) {
      const evidence = getFixtureByMatchId(safeDecodeURIComponent(matchId))
        ?.service.replayEvidence
      return evidence
        ? (PublicReplayEvidenceServiceDtoSchema.parse(
            evidence,
          ) as PublicReplayEvidenceServiceDto)
        : null
    },
    async getPublicReplayCompetitionContext(matchId) {
      const summary = getFixtureByMatchId(safeDecodeURIComponent(matchId))
        ?.service.matchSetSummary
      if (!summary) {
        return null
      }
      const result = toPublicMatchSetSummaryFixture(
        PublicMatchSetSummaryServiceDtoSchema.parse(summary),
      ).result
      if (result.competition) {
        return { matchSetId: result.matchSetId, ...result.competition }
      }
      const countedState = classifyCompetitionCountedState({
        executionStatus: result.status,
        origin: "non_competitive",
        expectedMatchCount: result.matches.length,
        chronicleMatchCount: result.matches.filter(
          (match) => match.replayAvailable,
        ).length,
        scoringAvailable: result.standings.length > 0,
      })
      return {
        matchSetId: result.matchSetId,
        countedState,
        governance: projectPublicCompetitionGovernance({
          countedState,
          replayAvailable: result.matches.some(
            (match) => match.replayAvailable,
          ),
        }),
      }
    },
    async getPublicReplayState(matchId) {
      const fixture = getFixtureByMatchId(safeDecodeURIComponent(matchId))
      if (!fixture) {
        return null
      }
      const lifecycle =
        fixture.app.replayEvidence?.lifecycle ??
        fixture.app.replayMetadata?.lifecycle ??
        fixture.app.matchSetSummary?.lifecycle
      return lifecycle
        ? {
            label: fixture.label,
            lifecycle,
          }
        : null
    },
  }
}
