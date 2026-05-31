import {
  MatchExecutionContractFixtureV1Schema,
  PublicReplayEvidenceServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicMatchSetSummaryServiceDtoSchema,
  getMatchExecutionContractFixtureByMatchId,
  getMatchExecutionContractFixtureByMatchSetId,
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

const requiredBaseSummary = (): PublicMatchSetSummaryServiceDto => {
  const base = getMatchExecutionContractFixtureByMatchSetId(
    "match-set:fixture:stale-artifact",
  )?.service.matchSetSummary
  if (!base) {
    throw new Error("missing stale-artifact fixture summary")
  }
  return base as PublicMatchSetSummaryServiceDto
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
  const serviceSummary = PublicMatchSetSummaryServiceDtoSchema.parse(summary)
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

const getFixtureByMatchId = (
  matchId: MatchId,
): MatchExecutionContractFixtureV1 | undefined =>
  getMatchExecutionContractFixtureByMatchId(matchId) ??
  appOnlyReplayTrustFixtures.find((fixture) =>
    fixture.service.matchSetSummary?.result.matches.some(
      (match) => match.matchId === matchId,
    ),
  )

const playableReplayMatchId = "match:fixture:public-safe-replay" as MatchId

const createPlayableReplayEvidence = (
  evidence: PublicReplayEvidenceServiceDto,
): PublicReplayEvidenceServiceDto => {
  if (evidence.matchId !== playableReplayMatchId) {
    return evidence
  }
  const baseSnapshot = evidence.projection.snapshots[0]
  if (!baseSnapshot) {
    return evidence
  }
  const boardAt = (
    bottomPosition: { x: number; y: number },
    topPosition: { x: number; y: number },
  ) => ({
    ...baseSnapshot.board,
    soldiers: baseSnapshot.board.soldiers.map((soldier) =>
      soldier.id === "fixture-bottom-soldier-1"
        ? {
            ...soldier,
            position: bottomPosition,
            lastSuccessfulMoveDirection: "UP" as const,
          }
        : soldier.id === "fixture-top-soldier-1"
          ? {
              ...soldier,
              position: topPosition,
              lastSuccessfulMoveDirection: "DOWN" as const,
            }
          : soldier,
    ),
  })
  const snapshots = [
    {
      ...baseSnapshot,
      kind: "MATCH_START" as const,
      sequence: 0,
      context: {},
      board: boardAt({ x: 1, y: 3 }, { x: 3, y: 1 }),
      outcome: undefined,
    },
    {
      ...baseSnapshot,
      kind: "ROUND_START" as const,
      sequence: 1,
      context: { roundNumber: 1 },
      board: boardAt({ x: 1, y: 3 }, { x: 3, y: 1 }),
      outcome: undefined,
    },
    {
      ...baseSnapshot,
      kind: "ACTIVATION_END" as const,
      sequence: 2,
      context: {
        roundNumber: 1,
        activationIndex: 0,
        activationId: "activation:fixture:1",
        actingPlayerId: "player:bottom",
        soldierId: "fixture-bottom-soldier-1",
        cycleIndex: 0,
      },
      board: boardAt({ x: 1, y: 2 }, { x: 3, y: 1 }),
      outcome: undefined,
    },
    {
      ...baseSnapshot,
      kind: "MATCH_END" as const,
      sequence: 3,
      context: {},
      board: boardAt({ x: 1, y: 2 }, { x: 3, y: 1 }),
      outcome: { type: "DRAW" as const },
    },
  ]
  const events = [
    {
      type: "MATCH_STARTED" as const,
      sequence: 0,
      context: {},
      payload: { matchId: playableReplayMatchId },
    },
    {
      type: "ROUND_STARTED" as const,
      sequence: 1,
      context: { roundNumber: 1 },
      payload: { roundNumber: 1 },
    },
    {
      type: "MOVE_ADVANCED" as const,
      sequence: 2,
      context: {
        roundNumber: 1,
        activationIndex: 0,
        activationId: "activation:fixture:1",
        actingPlayerId: "player:bottom",
        soldierId: "fixture-bottom-soldier-1",
        cycleIndex: 0,
      },
      payload: {
        soldierId: "fixture-bottom-soldier-1",
        from: { x: 1, y: 3 },
        to: { x: 1, y: 2 },
      },
    },
    {
      type: "MATCH_ENDED" as const,
      sequence: 3,
      context: {},
      payload: { type: "DRAW" },
    },
  ]
  return PublicReplayEvidenceServiceDtoSchema.parse({
    ...evidence,
    metadata: {
      ...evidence.metadata,
      eventCount: events.length,
      snapshotCount: snapshots.length,
      outcome: { type: "DRAW" },
    },
    projection: {
      ...evidence.projection,
      events,
      snapshots,
    },
  }) as PublicReplayEvidenceServiceDto
}

const createPlayableReplayMetadata = (
  metadata: PublicReplayMetadataServiceDto,
): PublicReplayMetadataServiceDto =>
  metadata.matchId === playableReplayMatchId
    ? (PublicReplayMetadataServiceDtoSchema.parse({
        ...metadata,
        metadata: {
          ...metadata.metadata,
          eventCount: 4,
          snapshotCount: 4,
        },
      }) as PublicReplayMetadataServiceDto)
    : metadata

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
      return (summary as PublicMatchSetSummaryServiceDto | undefined) ?? null
    },
    async getPublicReplayMetadata(matchId) {
      const metadata = getFixtureByMatchId(safeDecodeURIComponent(matchId))
        ?.service.replayMetadata
      return metadata
        ? createPlayableReplayMetadata(
            metadata as PublicReplayMetadataServiceDto,
          )
        : null
    },
    async getPublicReplayEvidence(matchId) {
      const evidence = getFixtureByMatchId(safeDecodeURIComponent(matchId))
        ?.service.replayEvidence
      return evidence
        ? createPlayableReplayEvidence(
            evidence as PublicReplayEvidenceServiceDto,
          )
        : null
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
