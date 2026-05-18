import {
  getCanonicalReplayScenario,
  type CanonicalReplayScenarioId,
} from "@cowards/test-utils"
import {
  createReplay,
  projectOwnerChronicle,
  projectPublicChronicle,
} from "@cowards/replay"
import { describe, expect, it } from "vitest"
import { GET as getReplayFixture } from "../api/test-support/replay-fixture/route.js"
import {
  createReplayFixtureCatalog,
  createReplayFixtureData,
  defaultReplayFixtureScenarioId,
  getReplayFixtureMatchId,
  getReplayFixtureScenarioId,
  isReplayFixtureMatch,
  replayFixtureMatchId,
} from "./replay-fixture.js"
import type { ReplayReadyDto } from "./types.js"

const projectionScenarioIds = [
  "push",
  "legal-backstab",
  "contraction",
  "runtime-failure",
  defaultReplayFixtureScenarioId,
] satisfies CanonicalReplayScenarioId[]

const expectReady = (data: ReturnType<typeof createReplayFixtureData>) => {
  expect(data.status, "[projection] fixture data should be ready").toBe("ready")
  return data as ReplayReadyDto
}

describe("replay fixture projection", () => {
  it("matches encoded default and scenario-specific fixture Match ids", () => {
    expect(isReplayFixtureMatch("%E0%A4%A")).toBe(false)
    expect(isReplayFixtureMatch(encodeURIComponent(replayFixtureMatchId))).toBe(
      true,
    )
    expect(
      isReplayFixtureMatch(
        encodeURIComponent(getReplayFixtureMatchId("legal-backstab")),
      ),
    ).toBe(true)
    expect(getReplayFixtureScenarioId(replayFixtureMatchId)).toBe(
      defaultReplayFixtureScenarioId,
    )
    expect(
      getReplayFixtureScenarioId(getReplayFixtureMatchId("runtime-failure")),
    ).toBe("runtime-failure")
    expect(getReplayFixtureScenarioId(`${replayFixtureMatchId}:unknown`)).toBe(
      null,
    )
  })

  it("returns a route catalog with scenario-specific replay hrefs", async () => {
    const response = await getReplayFixture(
      new Request("http://cowards.test/api/test-support/replay-fixture"),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      matchId: replayFixtureMatchId,
      replayHref: `/matches/${encodeURIComponent(replayFixtureMatchId)}/replay`,
      scenarioId: defaultReplayFixtureScenarioId,
    })
    expect(body.scenarios).toEqual(createReplayFixtureCatalog())
    expect(
      body.scenarios.map((scenario: { id: string }) => scenario.id),
    ).toEqual(expect.arrayContaining(projectionScenarioIds))
  })

  it("returns scenario-specific route data when requested", async () => {
    const response = await getReplayFixture(
      new Request(
        "http://cowards.test/api/test-support/replay-fixture?scenario=push",
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      matchId: getReplayFixtureMatchId("push"),
      replayHref: `/matches/${encodeURIComponent(
        getReplayFixtureMatchId("push"),
      )}/replay`,
      scenarioId: "push",
    })
  })

  it("rejects unknown scenario-specific route data", async () => {
    const response = await getReplayFixture(
      new Request(
        "http://cowards.test/api/test-support/replay-fixture?scenario=unknown",
      ),
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: "Unknown replay fixture scenario",
    })
  })

  it.each(projectionScenarioIds)(
    "[projection] %s fixture uses populated public projection events and snapshots",
    (scenarioId) => {
      const data = expectReady(createReplayFixtureData({ scenarioId }))
      const scenario = getCanonicalReplayScenario(scenarioId)
      const projection = projectPublicChronicle(scenario.chronicle)

      expect(data.metadata.matchId).toBe(getReplayFixtureMatchId(scenarioId))
      expect(
        data.projection.events.length,
        "[projection] fixture projection events should be populated",
      ).toBeGreaterThan(0)
      expect(
        data.projection.snapshots.length,
        "[projection] fixture projection snapshots should be populated",
      ).toBeGreaterThan(0)
      expect(data.projection).toEqual(projection)
    },
  )

  it.each(projectionScenarioIds)(
    "[projection] %s fixture timeline length matches projected event count",
    (scenarioId) => {
      const data = expectReady(createReplayFixtureData({ scenarioId }))

      expect(data.timeline).toHaveLength(data.projection.events.length)
      expect(data.timeline.map((entry) => entry.sequence)).toEqual(
        data.projection.events.map((event) => event.sequence),
      )
    },
  )

  it.each(projectionScenarioIds)(
    "[projection] %s fixture states length matches replay iteration count",
    (scenarioId) => {
      const data = expectReady(createReplayFixtureData({ scenarioId }))
      const scenario = getCanonicalReplayScenario(scenarioId)
      const replay = createReplay(scenario.chronicle)

      expect(replay.ok).toBe(true)
      if (!replay.ok) {
        return
      }
      expect(data.states).toHaveLength(
        [...replay.replay.iterateReplay()].length,
      )
    },
  )

  it("[projection] public fixture output excludes private replay markers", () => {
    const data = expectReady(
      createReplayFixtureData({ scenarioId: "runtime-failure" }),
    )
    const serialized = JSON.stringify(data)

    expect(data.mode).toBe("public")
    expect(data.projection.viewer).toEqual({ access: "public" })
    expect(data.projection).not.toHaveProperty("ownerPrivate")
    expect(serialized).not.toContain("Strategy source")
    expect(serialized).not.toContain("strategySource")
    expect(serialized).not.toContain("strategyMemory")
    expect(serialized).not.toContain("soldierMemory")
    expect(serialized).not.toContain("objectivePayload")
    expect(serialized).not.toContain("actionPlanId")
    expect(serialized).not.toContain("awarenessGrid")
    expect(serialized).not.toContain("private:event")
    expect(serialized).not.toContain("rawRuntimeDetails")
    expect(serialized).not.toContain(
      "Deterministic replay scenario runtime violation",
    )
  })

  it("[projection] owner fixture output is gated by owner mode and trusted debug allowance", () => {
    const requestedOwner = expectReady(
      createReplayFixtureData({
        scenarioId: "push",
        mode: "owner",
        ownerPlayerId: "bottom",
      }),
    )
    const owner = expectReady(
      createReplayFixtureData({
        scenarioId: "push",
        mode: "owner",
        ownerPlayerId: "bottom",
        allowOwnerDebug: true,
      }),
    )
    const scenario = getCanonicalReplayScenario("push")

    expect(requestedOwner.mode).toBe("public")
    expect(requestedOwner.projection.viewer).toEqual({ access: "public" })
    expect(requestedOwner).not.toHaveProperty("ownerPlayerId")
    expect(requestedOwner.projection).not.toHaveProperty("ownerPrivate")

    expect(owner.mode).toBe("owner")
    expect(owner.ownerPlayerId).toBe("bottom")
    expect(owner.projection).toEqual(
      projectOwnerChronicle(scenario.chronicle, "bottom"),
    )
    expect(owner.projection).toHaveProperty("ownerPrivate")
  })
})
