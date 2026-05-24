import { SERVICE_API_ROUTES } from "./service.js"

const firstExampleFor = <TRoute extends keyof typeof SERVICE_API_ROUTES>(
  routeId: TRoute,
) => {
  const example = SERVICE_API_ROUTES[routeId].examples[0]
  if (example === undefined) {
    throw new Error(`Missing service API fixture example for ${routeId}`)
  }
  return SERVICE_API_ROUTES[routeId].response.parse(example)
}

export const serviceHealthExample = firstExampleFor("health")
export const authSessionExample = firstExampleFor("authSession")
export const createSessionExample = firstExampleFor("createSession")
export const revokeSessionExample = firstExampleFor("revokeSession")
export const listStrategyRevisionsExample = firstExampleFor(
  "listStrategyRevisions",
)
export const createStrategyRevisionExample = firstExampleFor(
  "createStrategyRevision",
)
export const getStrategyRevisionSourceExample = firstExampleFor(
  "getStrategyRevisionSource",
)
export const createMatchSetExample = firstExampleFor("createMatchSet")
export const publicMatchSetSummaryExample = firstExampleFor(
  "getPublicMatchSetSummary",
)
export const publicReplayMetadataExample = firstExampleFor(
  "getPublicReplayMetadata",
)
export const publicReplayEvidenceExample = firstExampleFor(
  "getPublicReplayEvidence",
)
export const listAnalyticsProfilesExample = firstExampleFor(
  "listAnalyticsProfiles",
)
export const createAnalyticsRunExample = firstExampleFor("createAnalyticsRun")
export const analyticsRunSummaryExample = firstExampleFor(
  "getAnalyticsRunSummary",
)
export const exportAnalyticsRunExample = firstExampleFor("exportAnalyticsRun")
export const listLadderSeasonsExample = firstExampleFor("listLadderSeasons")
export const enterLadderSeasonExample = firstExampleFor("enterLadderSeason")
export const publicPlayerPageExample = firstExampleFor("getPublicPlayerPage")
export const publicLadderPageExample = firstExampleFor("getPublicLadderSeason")
export const publicStrategyPageExample = firstExampleFor(
  "getPublicStrategyPage",
)

export const SERVICE_API_FIXTURES = {
  serviceHealthExample,
  authSessionExample,
  createSessionExample,
  revokeSessionExample,
  listStrategyRevisionsExample,
  createStrategyRevisionExample,
  getStrategyRevisionSourceExample,
  createMatchSetExample,
  publicMatchSetSummaryExample,
  publicReplayMetadataExample,
  publicReplayEvidenceExample,
  listAnalyticsProfilesExample,
  createAnalyticsRunExample,
  analyticsRunSummaryExample,
  exportAnalyticsRunExample,
  listLadderSeasonsExample,
  enterLadderSeasonExample,
  publicPlayerPageExample,
  publicLadderPageExample,
  publicStrategyPageExample,
} as const
