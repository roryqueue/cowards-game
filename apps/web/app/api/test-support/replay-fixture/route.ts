import {
  createReplayFixtureCatalog,
  defaultReplayFixtureScenarioId,
  getReplayFixtureMatchId,
  isReplayFixtureEnabled,
  type ReplayFixtureScenarioCatalogEntry,
} from "../../../matches/replay-fixture.js"

const readScenario = (
  request: Request,
  scenarios: ReplayFixtureScenarioCatalogEntry[],
): ReplayFixtureScenarioCatalogEntry["id"] | null => {
  const scenario = new URL(request.url).searchParams.get("scenario")
  if (scenario === null) {
    return defaultReplayFixtureScenarioId
  }
  return scenarios.find((candidate) => candidate.id === scenario)?.id ?? null
}

export async function GET(request: Request): Promise<Response> {
  if (!isReplayFixtureEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const scenarios = createReplayFixtureCatalog()
  const scenarioId = readScenario(request, scenarios)
  if (scenarioId === null) {
    return Response.json(
      { error: "Unknown replay fixture scenario" },
      { status: 404 },
    )
  }

  const matchId = getReplayFixtureMatchId(scenarioId)
  return Response.json({
    matchId,
    replayHref: `/matches/${encodeURIComponent(matchId)}/replay`,
    scenarioId,
    scenarios,
  })
}
