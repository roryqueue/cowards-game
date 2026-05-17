import {
  isReplayFixtureEnabled,
  replayFixtureMatchId,
} from "../../../matches/replay-fixture.js"

export async function GET(): Promise<Response> {
  if (!isReplayFixtureEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({
    matchId: replayFixtureMatchId,
    replayHref: `/matches/${encodeURIComponent(replayFixtureMatchId)}/replay`,
  })
}
