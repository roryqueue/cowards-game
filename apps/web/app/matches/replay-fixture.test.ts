import {
  getCanonicalReplayScenario,
  type CanonicalReplayScenarioId,
} from "@cowards/test-utils"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  projectMatchExecutionPublicResultV119,
} from "@cowards/spec"
import {
  createReplay,
  projectOwnerChronicle,
  projectPublicChronicle,
} from "@cowards/replay"
import { describe, expect, it } from "vitest"
import { GET as getReplayFixture } from "../api/test-support/replay-fixture/route.js"
import {
  createCandidateReplayFixtureReadiness,
  createReplayFixtureCatalog,
  createReplayFixtureData,
  defaultReplayFixtureScenarioId,
  getReplayFixtureMatchId,
  getReplayFixtureScenarioId,
  isReplayFixtureMatch,
  replayFixtureMatchId,
} from "./replay-fixture.js"
import { resolveReplayArenaAuthority } from "./replay-ready.js"
import type { ReplayReadyDto } from "./types.js"

const projectionScenarioIds = [
  "push",
  "legal-backstab",
  "contraction",
  "runtime-failure",
  defaultReplayFixtureScenarioId,
] satisfies CanonicalReplayScenarioId[]

const privateProjectionKeyNames = [
  "source",
  "strategySource",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
  "awarenessGrid",
  "exactAwarenessGrid",
  "runtimeDetails",
  "rawRuntimeDetails",
  "violation",
  "privateRef",
  "private",
  "byPlayerId",
  "debug",
  "storageMetadata",
] as const

const expectReady = (data: ReturnType<typeof createReplayFixtureData>) => {
  expect(data.status, "[projection] fixture data should be ready").toBe("ready")
  return data as ReplayReadyDto
}

const candidatePublicResult = () => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    (candidate) => candidate.id === "arena:smoke:v1",
  )
  if (!arena) {
    throw new Error("Missing canonical Smoke arena")
  }
  return projectMatchExecutionPublicResultV119({
    matchSetId: "match-set:replay-candidate",
    matchId: "match:replay-candidate:a-bottom-a-first",
    publicationStatus: "countable",
    counted: true,
    arena: {
      variantId: arena.id,
      catalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
      catalogStatus: arena.status,
      semanticGeometryHash: arena.semanticGeometryHash,
    },
    condition: {
      scenarioId: `set-scenario:sha256:${"1".repeat(64)}`,
      conditionId: `set-condition:sha256:${"2".repeat(64)}`,
      ordinal: 0,
      label: "a-bottom-a-first",
      sides: {
        bottomEntrantKey: "entrant:a",
        topEntrantKey: "entrant:b",
      },
      initialInitiativeEntrantKey: "entrant:a",
    },
  })
}

describe("replay fixture projection", () => {
  it("stages exact candidate replay authority without selecting it as current", () => {
    const result = candidatePublicResult()

    expect(createCandidateReplayFixtureReadiness(result)).toEqual({
      status: "candidate",
      profile: "runtime-v1.19-candidate",
      candidate: true,
      current: false,
      publishable: false,
      matchSetId: result.matchSetId,
      matchId: result.matchId,
      arena: {
        variantId: result.arena.variantId,
        catalogVersion: result.arena.catalogVersion,
        catalogStatus: result.arena.catalogStatus,
      },
      condition: {
        scenarioId: result.condition.scenarioId,
        conditionId: result.condition.conditionId,
        ordinal: result.condition.ordinal,
        label: result.condition.label,
      },
    })
  })

  it.each([
    ["missing", undefined],
    [
      "unknown arena",
      {
        ...candidatePublicResult(),
        arena: {
          ...candidatePublicResult().arena,
          variantId: "arena:unknown:v1",
        },
      },
    ],
    [
      "historical alias",
      {
        ...candidatePublicResult(),
        arena: {
          ...candidatePublicResult().arena,
          variantId: "arena:open-field:v1",
        },
      },
    ],
    [
      "mixed version",
      {
        ...candidatePublicResult(),
        contractVersion: "match-execution-app-v1",
      },
    ],
  ])("keeps %s candidate replay data unavailable", (_label, result) => {
    expect(createCandidateReplayFixtureReadiness(result)).toEqual({
      status: "unavailable",
      profile: "runtime-v1.19-candidate",
      candidate: true,
      current: false,
      publishable: false,
      reason: "candidate-data-unavailable",
    })
  })

  it("keeps Phase-259 arena literals in the exact legacy dispatch", () => {
    expect(
      resolveReplayArenaAuthority({
        profile: "phase-259-current",
        arenaVariantId: "arena:open-field:v1",
      }),
    ).toEqual({
      status: "current",
      profile: "phase-259-current",
      arenaVariantId: "arena:open-field:v1",
      canonicalStartRequired: true,
    })
    expect(
      resolveReplayArenaAuthority({
        profile: "phase-259-current",
        arenaVariantId: "arena:custom:v1",
      }),
    ).toEqual({
      status: "current",
      profile: "phase-259-current",
      arenaVariantId: "arena:custom:v1",
      canonicalStartRequired: false,
    })
  })

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

  it("[projection] replay deep links focus exact sequences and moment fallbacks", () => {
    const momentOnly = expectReady(
      createReplayFixtureData({
        scenarioId: "legal-backstab",
        focus: { moment: "BACKSTAB" },
      }),
    )
    const exact = expectReady(
      createReplayFixtureData({
        scenarioId: "legal-backstab",
        focus: {
          moment: "BACKSTAB",
          sequence: momentOnly.initialSequence,
        },
      }),
    )
    const unavailable = expectReady(
      createReplayFixtureData({
        scenarioId: "push",
        focus: { sequence: 9999 },
      }),
    )

    expect(exact.initialSequence).toBe(momentOnly.initialSequence)
    expect(exact.focus).toMatchObject({
      requestedMoment: "BACKSTAB",
      requestedSequence: momentOnly.initialSequence,
      resolvedSequence: momentOnly.initialSequence,
      fallback: "none",
    })
    expect(
      momentOnly.timeline.find(
        (entry) => entry.sequence === momentOnly.initialSequence,
      )?.type,
    ).toBe("BACKSTAB_RESOLVED")
    expect(unavailable.initialSequence).toBe(0)
    expect(unavailable.focus).toMatchObject({
      requestedSequence: 9999,
      fallback: "match_start",
    })
    expect(JSON.stringify(exact)).not.toContain("ownerDebug")
  })

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

  it("[privacy] public fixture output excludes private replay markers through shared projection", () => {
    const data = expectReady(
      createReplayFixtureData({ scenarioId: "runtime-failure" }),
    )
    const scenario = getCanonicalReplayScenario("runtime-failure")
    const projection = projectPublicChronicle(scenario.chronicle)
    const serialized = JSON.stringify(data)
    const serializedProjection = JSON.stringify(projection)

    expect(data.mode).toBe("public")
    expect(data.projection.viewer).toEqual({ access: "public" })
    expect(data.projection).toEqual(projection)
    expect(data.projection).not.toHaveProperty("ownerPrivate")
    for (const key of privateProjectionKeyNames) {
      expect(
        serialized,
        `[privacy] public DTO leaked key ${key}`,
      ).not.toContain(`"${key}"`)
      expect(
        serializedProjection,
        `[privacy] shared projection leaked key ${key}`,
      ).not.toContain(`"${key}"`)
    }
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
    const untrustedRequestedOwner = expectReady(
      createReplayFixtureData({
        scenarioId: "push",
        allowOwnerDebug: true,
        requestedOwnerPlayerId: "top",
      }),
    )
    const scenario = getCanonicalReplayScenario("push")

    expect(requestedOwner.mode).toBe("public")
    expect(requestedOwner.projection.viewer).toEqual({ access: "public" })
    expect(requestedOwner).not.toHaveProperty("ownerPlayerId")
    expect(requestedOwner.projection).not.toHaveProperty("ownerPrivate")
    expect(untrustedRequestedOwner.mode).toBe("public")
    expect(untrustedRequestedOwner.projection.viewer).toEqual({
      access: "public",
    })
    expect(untrustedRequestedOwner).not.toHaveProperty("ownerPlayerId")
    expect(untrustedRequestedOwner.projection).not.toHaveProperty(
      "ownerPrivate",
    )

    expect(owner.mode).toBe("owner")
    expect(owner.ownerPlayerId).toBe("bottom")
    expect(owner.projection).toEqual(
      projectOwnerChronicle(scenario.chronicle, "bottom"),
    )
    expect(owner.projection).toHaveProperty("ownerPrivate")
  })
})
