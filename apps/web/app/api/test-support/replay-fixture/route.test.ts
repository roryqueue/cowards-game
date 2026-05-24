import { describe, expect, it } from "vitest"
import {
  isReplayFixtureEnabled,
  replayFixtureMatchId,
} from "../../../matches/replay-fixture.js"
import { GET } from "./route.js"

describe("replay fixture test-support route", () => {
  it("is unavailable outside test/playwright or explicit fixture gates", async () => {
    expect(isReplayFixtureEnabled({ NODE_ENV: "development" })).toBe(false)
    expect(isReplayFixtureEnabled({ COWARDS_ENABLE_REPLAY_FIXTURES: "1" })).toBe(
      true,
    )

    const response = await GET(
      new Request("http://local.test/api/test-support/replay-fixture"),
      { env: {} },
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "Not found" })
  })

  it("returns a bounded fixture catalog only when explicitly enabled", async () => {
    const response = await GET(
      new Request("http://local.test/api/test-support/replay-fixture"),
      { env: { COWARDS_ENABLE_REPLAY_FIXTURES: "1" } },
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      matchId: replayFixtureMatchId,
      scenarioId: "compound-tour",
    })
    expect(JSON.stringify(body)).not.toContain("strategyMemory")
    expect(JSON.stringify(body)).not.toContain("soldierMemory")
    expect(JSON.stringify(body)).not.toContain("objectivePayload")
    expect(JSON.stringify(body)).not.toContain("ownerDebug")
  })
})
