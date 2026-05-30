import {
  getMatchExecutionContractFixtureByMatchId,
  getMatchExecutionContractFixtureByMatchSetId,
  type MatchId,
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

export const createMatchExecutionFixturePublicReadClient = (
  env: MatchExecutionFixtureEnv = process.env,
): MatchExecutionFixturePublicReadClient | null => {
  if (!isMatchExecutionFixtureEnabled(env)) {
    return null
  }

  return {
    async getPublicMatchSetSummary(matchSetId) {
      const summary = getMatchExecutionContractFixtureByMatchSetId(
        safeDecodeURIComponent(matchSetId),
      )?.service.matchSetSummary
      return (summary as PublicMatchSetSummaryServiceDto | undefined) ?? null
    },
    async getPublicReplayMetadata(matchId) {
      const metadata = getMatchExecutionContractFixtureByMatchId(
        safeDecodeURIComponent(matchId),
      )?.service.replayMetadata
      return (metadata as PublicReplayMetadataServiceDto | undefined) ?? null
    },
    async getPublicReplayEvidence(matchId) {
      const evidence = getMatchExecutionContractFixtureByMatchId(
        safeDecodeURIComponent(matchId),
      )?.service.replayEvidence
      return (evidence as PublicReplayEvidenceServiceDto | undefined) ?? null
    },
  }
}
