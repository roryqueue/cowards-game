import {
  COMPATIBILITY_VERSIONS,
  SERVICE_API_VERSION,
  getMatchExecutionContractFixtureByMatchId,
  type Chronicle,
  type PublicReplayEvidenceServiceDto,
} from "@cowards/spec"
import {
  createChronicleMetadata,
  type StoredChronicle,
} from "@cowards/persistence/quarantine-lifecycle"
import { projectPublicChronicle } from "@cowards/replay"
import { describe, expect, it, vi } from "vitest"
import { isReplayFixtureMatch, replayFixtureMatchId } from "./replay-fixture.js"
import { createMatchReplayServer } from "./server.js"

const board = {
  bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
  soldiers: [
    {
      id: "soldier:bottom:1",
      ownerPlayerId: "player:bottom",
      status: "ACTIVE",
      position: { x: 1, y: 10 },
      facing: "UP",
      lastSuccessfulMoveDirection: null,
    },
  ],
  terrainStones: [],
} satisfies Chronicle["snapshots"][number]["board"]

const activationContext = {
  roundNumber: 1,
  activationIndex: 0,
  activationId: "activation:1",
  actingPlayerId: "player:bottom",
  soldierId: "soldier:bottom:1",
} satisfies Chronicle["events"][number]["context"]

const createChronicle = (): Chronicle => ({
  schemaVersion: "chronicle-v1.4",
  reproducibility: {
    matchId: "match:replay-test",
    seed: "seed:replay-test",
    arenaVariantId: "arena:replay-test",
    arenaVariantVersion: COMPATIBILITY_VERSIONS.arenaVariant,
    strategyRevisionIds: ["revision:bottom", "revision:top"],
    versions: COMPATIBILITY_VERSIONS,
  },
  events: [
    {
      type: "MATCH_STARTED",
      sequence: 0,
      context: {},
      privacy: "public",
      payload: { matchId: "match:replay-test" },
    },
    {
      type: "ROUND_STARTED",
      sequence: 1,
      context: { roundNumber: 1 },
      privacy: "public",
      payload: { roundNumber: 1 },
    },
    {
      type: "STRATEGY_EVALUATED",
      sequence: 2,
      context: { roundNumber: 1, actingPlayerId: "player:bottom" },
      privacy: "owner",
      payload: {
        playerId: "player:bottom",
        strategyMemory: "PRIVATE_STRATEGY_MEMORY",
      },
    },
    {
      type: "ACTIVATION_STARTED",
      sequence: 3,
      context: activationContext,
      privacy: "public",
      payload: { soldierId: "soldier:bottom:1" },
    },
    {
      type: "AWARENESS_GRID_OBSERVED",
      sequence: 4,
      context: {
        ...activationContext,
        cycleIndex: 0,
      },
      privacy: "owner",
      payload: {
        soldierId: "soldier:bottom:1",
        cycleIndex: 0,
        awarenessGrid: "PRIVATE_AWARENESS_GRID",
        objectivePayload: "PRIVATE_OBJECTIVE",
      },
    },
    {
      type: "ACTION_EMITTED",
      sequence: 5,
      context: {
        ...activationContext,
        cycleIndex: 0,
      },
      privacy: "owner",
      payload: {
        soldierId: "soldier:bottom:1",
        action: { type: "TURN_TO_STONE" },
        soldierMemory: "PRIVATE_SOLDIER_MEMORY",
      },
    },
    {
      type: "MATCH_ENDED",
      sequence: 6,
      context: {},
      privacy: "public",
      payload: { type: "WIN", winnerPlayerId: "player:bottom" },
    },
  ],
  snapshots: [
    { kind: "MATCH_START", sequence: 0, context: {}, board },
    {
      kind: "ROUND_START",
      sequence: 1,
      context: { roundNumber: 1 },
      board,
    },
    {
      kind: "ACTIVATION_START",
      sequence: 3,
      context: activationContext,
      board,
    },
    {
      kind: "ACTIVATION_END",
      sequence: 5,
      context: activationContext,
      board,
    },
    {
      kind: "ROUND_END",
      sequence: 5,
      context: { roundNumber: 1 },
      board,
    },
    {
      kind: "TERMINAL",
      sequence: 6,
      context: {},
      board,
      outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
    },
    {
      kind: "MATCH_END",
      sequence: 6,
      context: {},
      board,
      outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
    },
  ],
  private: {
    byPlayerId: {
      "player:bottom": {
        strategyMemory: "PRIVATE_STRATEGY_MEMORY",
        soldierMemory: "PRIVATE_SOLDIER_MEMORY",
        objectivePayload: "PRIVATE_OBJECTIVE",
        awarenessGrid: "PRIVATE_AWARENESS_GRID",
        strategySource: "PRIVATE_STRATEGY_SOURCE",
        rawRuntimeDetails: "PRIVATE_RUNTIME_DETAILS",
        ownerDebug: {
          soldierInactivityExplanations: [
            {
              soldierId: "soldier:bottom:1",
              label: "PRIVATE_OWNER_DEBUG_EXPLANATION",
              remediation: "PRIVATE_OWNER_DEBUG_REMEDIATION",
            },
          ],
        },
      },
      "player:top": {
        ownerDebug: {
          soldierInactivityExplanations: [
            {
              soldierId: "soldier:top:1",
              label: "PRIVATE_TOP_OWNER_DEBUG_EXPLANATION",
            },
          ],
        },
      },
    },
  },
})

const createStoredChronicle = (): StoredChronicle => {
  const artifact = createChronicle()
  return { artifact, metadata: createChronicleMetadata(artifact) }
}

const createStoredChronicleForBottomOwner = (
  ownerPlayerId: string,
): StoredChronicle => {
  const artifact = JSON.parse(
    JSON.stringify(createChronicle()).replaceAll(
      "player:bottom",
      ownerPlayerId,
    ),
  ) as Chronicle
  return { artifact, metadata: createChronicleMetadata(artifact) }
}

const createMatchOwnerPool = (rows: Array<{ authorized: true }>) =>
  ({
    query: vi.fn(async () => ({ rows })),
  }) as never

describe("Match replay server facade", () => {
  it("ignores malformed encoded fixture ids instead of throwing", () => {
    expect(isReplayFixtureMatch("%E0%A4%A")).toBe(false)
    expect(isReplayFixtureMatch(encodeURIComponent(replayFixtureMatchId))).toBe(
      true,
    )
  })

  it("returns unavailable when no Chronicle is stored", async () => {
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => null,
      }),
    })

    await expect(server.getMatchReplay("match:missing")).resolves.toEqual({
      status: "unavailable",
      matchId: "match:missing",
      reason: "missing-chronicle",
      message: "Replay unavailable: no Chronicle is stored for this Match.",
    })
  })

  it("returns validation diagnostics for invalid Chronicles", async () => {
    const stored = createStoredChronicle()
    stored.artifact.events = stored.artifact.events
      .slice(1)
      .map((event, index) => ({
        ...event,
        sequence: index,
      }))
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test")

    expect(response.status).toBe("unavailable")
    if (response.status !== "unavailable") {
      return
    }
    expect(response.matchId).toBe("match:replay-test")
    expect(response.reason).toBe("invalid-chronicle")
    expect(response.message).toContain("[validation]")
    expect(response.message).toContain("EVENT_ORDER_INVALID")
  })

  it("returns validation diagnostics before rendering incompatible Chronicles", async () => {
    const stored = createStoredChronicle()
    stored.artifact = {
      ...stored.artifact,
      reproducibility: {
        ...stored.artifact.reproducibility,
        versions: {
          ...stored.artifact.reproducibility.versions,
          engine: "999.0.0",
        },
      },
    }
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test")

    expect(response.status).toBe("unavailable")
    if (response.status !== "unavailable") {
      return
    }
    expect(response.matchId).toBe("match:replay-test")
    expect(response.reason).toBe("invalid-chronicle")
    expect(response.message).toContain("[validation]")
    expect(response.message).toContain("VERSION_INCOMPATIBLE")
    expect(response.message).toContain("engine")
    expect(JSON.stringify(response)).not.toContain("PRIVATE_STRATEGY_MEMORY")
  })

  it("rejects replay boards with visible pieces outside declared bounds", async () => {
    const stored = createStoredChronicle()
    stored.artifact.snapshots = stored.artifact.snapshots.map((snapshot) => ({
      ...snapshot,
      board: {
        ...snapshot.board,
        bounds: { minX: 0, maxX: 4, minY: 0, maxY: 4 },
      },
    }))
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test")

    expect(response.status).toBe("unavailable")
    if (response.status !== "unavailable") {
      return
    }
    expect(response.reason).toBe("invalid-chronicle")
    expect(response.message).toContain("[validation]")
    expect(response.message).toContain("out-of-bounds Soldier")
  })

  it("rejects replay boards with invalid bounds and overlapping visible pieces", async () => {
    const cases = [
      {
        name: "invalid bounds",
        expected: "invalid bounds",
        mutate: (stored: StoredChronicle) => {
          stored.artifact.snapshots = stored.artifact.snapshots.map(
            (snapshot) => ({
              ...snapshot,
              board: {
                ...snapshot.board,
                bounds: { minX: 5, maxX: 4, minY: 0, maxY: 4 },
              },
            }),
          )
        },
      },
      {
        name: "overlapping terrain and Soldier",
        expected: "overlapping terrain and Soldier",
        mutate: (stored: StoredChronicle) => {
          stored.artifact.snapshots = stored.artifact.snapshots.map(
            (snapshot) => ({
              ...snapshot,
              board: {
                ...snapshot.board,
                terrainStones: [{ x: 1, y: 10 }],
              },
            }),
          )
        },
      },
      {
        name: "active Soldier without position",
        expected: "visible Soldier without a position",
        mutate: (stored: StoredChronicle) => {
          stored.artifact.snapshots = stored.artifact.snapshots.map(
            (snapshot) => ({
              ...snapshot,
              board: {
                ...snapshot.board,
                soldiers: snapshot.board.soldiers.map((soldier) => ({
                  ...soldier,
                  position: null,
                })),
              },
            }),
          )
        },
      },
    ]

    for (const testCase of cases) {
      const stored = createStoredChronicle()
      testCase.mutate(stored)
      const server = createMatchReplayServer({
        withPool: async (fn) => fn({} as never),
        createChronicleStore: () => ({
          getByMatchId: async () => stored,
        }),
      })

      const response = await server.getMatchReplay(
        `match:replay-test:${testCase.name}`,
      )

      expect(response.status).toBe("unavailable")
      if (response.status !== "unavailable") {
        continue
      }
      expect(response.reason).toBe("invalid-chronicle")
      expect(response.message).toContain(testCase.expected)
    }
  })

  it("rejects canonical arena replays without canonical starting Soldiers", async () => {
    const stored = createStoredChronicle()
    stored.artifact.reproducibility = {
      ...stored.artifact.reproducibility,
      arenaVariantId: "arena:smoke:v1",
    }
    stored.metadata = {
      ...stored.metadata,
      arenaVariantId: "arena:smoke:v1",
    }
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:canonical-start")

    expect(response.status).toBe("unavailable")
    if (response.status !== "unavailable") {
      return
    }
    expect(response.reason).toBe("invalid-chronicle")
    expect(response.message).toContain("canonical Match start")
  })

  it("decodes URL-encoded persisted Match ids before Chronicle lookup", async () => {
    const stored = createStoredChronicle()
    const seen: string[] = []
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async (matchId) => {
          seen.push(matchId)
          return stored
        },
      }),
    })

    const response = await server.getMatchReplay(
      encodeURIComponent("match:replay-test"),
    )

    expect(response.status).toBe("ready")
    expect(seen).toEqual(["match:replay-test"])
  })

  it("returns public replay metadata through the service boundary", async () => {
    const stored = createStoredChronicle()
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    await expect(
      server.getPublicReplayMetadata("match:replay-test"),
    ).resolves.toEqual({
      apiVersion: SERVICE_API_VERSION,
      kind: "publicReplayMetadata",
      matchId: "match:replay-test",
      metadata: {
        matchId: "match:replay-test",
        chronicleId: stored.metadata.id,
        hash: stored.metadata.hash,
        schemaVersion: "chronicle-v1.4",
        eventCount: stored.artifact.events.length,
        snapshotCount: stored.artifact.snapshots.length,
        bottomPlayerId: "player:bottom",
        topPlayerId: "player:top",
        arenaVariantId: "arena:replay-test",
      },
    })
  })

  it("uses Go public replay metadata when selected without direct Chronicle reads", async () => {
    const stored = createStoredChronicle()
    const getByMatchId = vi.fn(async () => {
      throw new Error("direct Chronicle store should not be used")
    })
    const server = createMatchReplayServer({
      env: {
        COWARDS_GO_PUBLIC_READS: "1",
        COWARDS_GO_BACKEND_URL: "http://go.test",
      },
      fetchImpl: vi.fn(async (url) => {
        expect(String(url)).toBe(
          "http://go.test/public/replays/match%3Areplay-test/metadata",
        )
        return Response.json({
          apiVersion: SERVICE_API_VERSION,
          kind: "publicReplayMetadata",
          matchId: "match:replay-test",
          metadata: {
            matchId: "match:replay-test",
            chronicleId: stored.metadata.id,
            hash: stored.metadata.hash,
            schemaVersion: stored.metadata.schemaVersion,
            eventCount: stored.metadata.eventCount,
            snapshotCount: stored.metadata.snapshotCount,
            outcome: stored.metadata.outcome,
            bottomPlayerId: stored.metadata.bottomPlayerId,
            topPlayerId: stored.metadata.topPlayerId,
            arenaVariantId: stored.metadata.arenaVariantId,
          },
        })
      }) as never,
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({ getByMatchId }),
    })

    await expect(
      server.getPublicReplayMetadata("match:replay-test"),
    ).resolves.toMatchObject({
      kind: "publicReplayMetadata",
      matchId: "match:replay-test",
    })
    expect(getByMatchId).not.toHaveBeenCalled()
  })

  it("decodes URL-encoded Match ids for public replay metadata", async () => {
    const stored = createStoredChronicle()
    const seen: string[] = []
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async (matchId) => {
          seen.push(matchId)
          return stored
        },
      }),
    })

    await expect(
      server.getPublicReplayMetadata(encodeURIComponent("match:replay-test")),
    ).resolves.toMatchObject({
      kind: "publicReplayMetadata",
      matchId: "match:replay-test",
    })
    expect(seen).toEqual(["match:replay-test"])
  })

  it("returns null when public replay metadata has no Chronicle", async () => {
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => null,
      }),
    })

    await expect(
      server.getPublicReplayMetadata("match:missing"),
    ).resolves.toBeNull()
  })

  it("serves Match execution replay fixtures through the public adapter gate", async () => {
    const server = createMatchReplayServer({
      env: { COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES: "1" },
    })
    const fixture = getMatchExecutionContractFixtureByMatchId(
      "match:fixture:public-safe-replay",
    )

    await expect(
      server.getPublicReplayMetadata("match%3Afixture%3Apublic-safe-replay"),
    ).resolves.toEqual(fixture?.service.replayMetadata)

    const replay = await server.getMatchReplay(
      "match%3Afixture%3Apublic-safe-replay",
    )
    expect(replay.status).toBe("ready")
    if (replay.status === "ready") {
      expect(replay.metadata.matchId).toBe("match:fixture:public-safe-replay")
      expect(replay.projection.viewer.access).toBe("public")
      expect(replay.states[0]?.board.soldiers.length).toBe(2)
    }
  })

  it("does not expose private Chronicle fields in public replay metadata", async () => {
    const stored = createStoredChronicle()
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const metadata = await server.getPublicReplayMetadata("match:replay-test")
    const serialized = JSON.stringify(metadata)

    expect(serialized).not.toContain("strategyMemory")
    expect(serialized).not.toContain("soldierMemory")
    expect(serialized).not.toContain("objectivePayload")
    expect(serialized).not.toContain("awarenessGrid")
    expect(serialized).not.toContain("strategySource")
    expect(serialized).not.toContain("rawRuntimeDetails")
    expect(serialized).not.toContain("ownerDebug")
    expect(serialized).not.toContain("PRIVATE_STRATEGY_MEMORY")
    expect(serialized).not.toContain("PRIVATE_AWARENESS_GRID")
    expect(serialized).not.toContain("PRIVATE_OWNER_DEBUG_EXPLANATION")
  })

  it("returns public replay data by default without private markers", async () => {
    const stored = createStoredChronicle()
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test")

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.projection.viewer).toEqual({ access: "public" })
    expect(response.initialSequence).toBe(0)
    expect(response.timeline[0]).toMatchObject({
      sequence: 0,
      label: "Match start",
    })

    const serialized = JSON.stringify(response)
    expect(serialized).not.toContain("strategyMemory")
    expect(serialized).not.toContain("soldierMemory")
    expect(serialized).not.toContain("objectivePayload")
    expect(serialized).not.toContain("awarenessGrid")
    expect(serialized).not.toContain("strategySource")
    expect(serialized).not.toContain("rawRuntimeDetails")
    expect(serialized).not.toContain("ownerDebug")
    expect(serialized).not.toContain("soldierInactivity")
    expect(serialized).not.toContain("PRIVATE_STRATEGY_MEMORY")
    expect(serialized).not.toContain("PRIVATE_AWARENESS_GRID")
    expect(serialized).not.toContain("PRIVATE_OWNER_DEBUG_EXPLANATION")
  })

  it("uses Go public replay evidence when selected without direct Chronicle reads", async () => {
    const stored = createStoredChronicle()
    const getByMatchId = vi.fn(async () => {
      throw new Error("direct Chronicle store should not be used")
    })
    const { ownerPrivate: _ownerPrivate, ...projectedPublicChronicle } =
      projectPublicChronicle(stored.artifact)
    const evidence: PublicReplayEvidenceServiceDto = {
      apiVersion: SERVICE_API_VERSION as typeof SERVICE_API_VERSION,
      kind: "publicReplayEvidence",
      matchId: "match:replay-test",
      metadata: {
        matchId: "match:replay-test",
        chronicleId: stored.metadata.id,
        hash: stored.metadata.hash,
        schemaVersion: stored.metadata.schemaVersion,
        eventCount: stored.metadata.eventCount,
        snapshotCount: stored.metadata.snapshotCount,
        outcome: stored.metadata.outcome,
        bottomPlayerId: stored.metadata.bottomPlayerId,
        topPlayerId: stored.metadata.topPlayerId,
        arenaVariantId: stored.metadata.arenaVariantId,
      },
      projection: {
        ...projectedPublicChronicle,
        viewer: { access: "public" },
      },
    }
    const evidenceClient = {
      getPublicReplayEvidence: vi.fn(async () => evidence),
    }
    const server = createMatchReplayServer({
      env: {
        COWARDS_GO_PUBLIC_READS: "1",
        COWARDS_GO_BACKEND_URL: "http://go.test",
      },
      publicReplayEvidenceClient: evidenceClient,
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({ getByMatchId }),
    })

    const response = await server.getMatchReplay("match:replay-test")

    expect(response.status).toBe("ready")
    expect(evidenceClient.getPublicReplayEvidence).toHaveBeenCalledWith(
      "match:replay-test",
    )
    expect(getByMatchId).not.toHaveBeenCalled()
    expect(JSON.stringify(response)).not.toContain("PRIVATE_STRATEGY_MEMORY")
  })

  it("fails closed when Go replay evidence is selected without a Go URL", async () => {
    const server = createMatchReplayServer({
      env: { COWARDS_GO_PUBLIC_READS: "1" },
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => createStoredChronicle(),
      }),
    })

    await expect(server.getMatchReplay("match:replay-test")).rejects.toThrow(
      "getPublicReplayEvidence Go ownership requires COWARDS_GO_BACKEND_URL",
    )
  })

  it("does not let ungated owner-debug options bypass selected Go public replay evidence", async () => {
    const getByMatchId = vi.fn(async () => createStoredChronicle())
    const server = createMatchReplayServer({
      env: { COWARDS_GO_PUBLIC_READS: "1" },
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({ getByMatchId }),
    })

    await expect(
      server.getMatchReplay("match:replay-test", {
        allowOwnerDebug: true,
        requestedOwnerPlayerId: "player:bottom",
      }),
    ).rejects.toThrow(
      "getPublicReplayEvidence Go ownership requires COWARDS_GO_BACKEND_URL",
    )
    expect(getByMatchId).not.toHaveBeenCalled()
  })

  it("fails closed in no-TypeScript-backend mode instead of reading persisted Chronicles", async () => {
    const getByMatchId = vi.fn(async () => createStoredChronicle())
    const server = createMatchReplayServer({
      env: { COWARDS_NO_TYPESCRIPT_BACKEND: "1" },
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({ getByMatchId }),
    })

    await expect(server.getMatchReplay("match:replay-test")).rejects.toThrow(
      "getPublicReplayEvidence Go ownership requires COWARDS_GO_BACKEND_URL",
    )
    expect(getByMatchId).not.toHaveBeenCalled()
  })

  it("keeps owner replay data unavailable unless trusted server code allows it", async () => {
    const stored = createStoredChronicle()
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test", {
      mode: "owner",
      ownerPlayerId: "player:bottom",
    })

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response.projection.viewer).toEqual({ access: "public" })
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
    expect(JSON.stringify(response)).not.toContain("PRIVATE_AWARENESS_GRID")
    expect(JSON.stringify(response)).not.toContain(
      "PRIVATE_OWNER_DEBUG_EXPLANATION",
    )
  })

  it("keeps query-requested owner ids public when persisted Match ownership rejects them", async () => {
    const stored = createStoredChronicle()
    const pool = createMatchOwnerPool([])
    const server = createMatchReplayServer({
      withPool: async (fn) => fn(pool),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:top",
      currentRequesterPlayerId: "player:top",
    })

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response.projection.viewer).toEqual({ access: "public" })
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
    expect(JSON.stringify(response)).not.toContain(
      "PRIVATE_TOP_OWNER_DEBUG_EXPLANATION",
    )
  })

  it("keeps owner-debug public when requester identity is missing", async () => {
    const stored = createStoredChronicleForBottomOwner("player:workshop-local")
    const pool = createMatchOwnerPool([{ authorized: true }])
    const server = createMatchReplayServer({
      withPool: async (fn) => fn(pool),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:workshop-local",
    })

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
  })

  it("keeps owner-debug public when requested owner differs from requester", async () => {
    const stored = createStoredChronicle()
    const resolver = vi.fn(async () => ["player:bottom"] as const)
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
      resolveAuthorizedReplayOwners: resolver,
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:bottom",
      currentRequesterPlayerId: "player:intruder",
    })

    expect(resolver).not.toHaveBeenCalled()
    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
  })

  it("uses persisted Match participant data to authorize requested owner replay", async () => {
    const stored = createStoredChronicleForBottomOwner("player:workshop-local")
    const pool = createMatchOwnerPool([{ authorized: true }])
    const server = createMatchReplayServer({
      withPool: async (fn) => fn(pool),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:workshop-local",
      currentRequesterPlayerId: "player:workshop-local",
    })

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("owner")
    expect(response.ownerPlayerId).toBe("player:workshop-local")
    expect(response.projection.viewer).toEqual({
      access: "owner",
      playerId: "player:workshop-local",
    })
    expect(
      response.ownerDebug?.soldierInactivityExplanations.length,
    ).toBeGreaterThan(0)
  })

  it("upgrades an authorized requested owner through the server resolver", async () => {
    const stored = createStoredChronicle()
    const resolver = vi.fn(async () => ["player:bottom"] as const)
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
      resolveAuthorizedReplayOwners: resolver,
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:bottom",
      currentRequesterPlayerId: "player:bottom",
    })

    expect(resolver).toHaveBeenCalledWith({
      pool: {},
      matchId: "match:replay-test",
      requestedOwnerPlayerId: "player:bottom",
      currentPlayerId: "player:bottom",
    })
    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("owner")
    expect(response.ownerPlayerId).toBe("player:bottom")
    expect(response.projection.viewer).toEqual({
      access: "owner",
      playerId: "player:bottom",
    })
    expect(
      response.ownerDebug?.soldierInactivityExplanations.length,
    ).toBeGreaterThan(0)
    expect(JSON.stringify(response)).toContain("PRIVATE_AWARENESS_GRID")
    expect(JSON.stringify(response.projection.ownerPrivate)).toContain(
      "PRIVATE_OWNER_DEBUG_EXPLANATION",
    )
    expect(JSON.stringify(response.projection.ownerPrivate)).not.toContain(
      "PRIVATE_TOP_OWNER_DEBUG_EXPLANATION",
    )
  })

  it("keeps an authorized nonparticipant request public", async () => {
    const stored = createStoredChronicle()
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
      resolveAuthorizedReplayOwners: async () => ["player:intruder"],
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      requestedOwnerPlayerId: "player:intruder",
      currentRequesterPlayerId: "player:intruder",
    })

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response.projection.viewer).toEqual({ access: "public" })
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
    expect(JSON.stringify(response)).not.toContain("PRIVATE_AWARENESS_GRID")
    expect(JSON.stringify(response)).not.toContain(
      "PRIVATE_OWNER_DEBUG_EXPLANATION",
    )
  })

  it("keeps owner debug requests without a requested owner public", async () => {
    const stored = createStoredChronicle()
    const resolver = vi.fn(async () => ["player:bottom"] as const)
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
      resolveAuthorizedReplayOwners: resolver,
    })

    const response = await server.getMatchReplay("match:replay-test", {
      allowOwnerDebug: true,
      currentRequesterPlayerId: "player:bottom",
    })

    expect(resolver).not.toHaveBeenCalled()
    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response.projection.viewer).toEqual({ access: "public" })
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
  })

  it("keeps explicit owner mode public unless authorization supplied that owner", async () => {
    const stored = createStoredChronicle()
    const server = createMatchReplayServer({
      withPool: async (fn) => fn({} as never),
      createChronicleStore: () => ({
        getByMatchId: async () => stored,
      }),
    })

    const response = await server.getMatchReplay("match:replay-test", {
      mode: "owner",
      ownerPlayerId: "player:bottom",
      allowOwnerDebug: true,
      currentRequesterPlayerId: "player:bottom",
    })

    expect(response.status).toBe("ready")
    if (response.status !== "ready") {
      return
    }
    expect(response.mode).toBe("public")
    expect(response.projection.viewer).toEqual({ access: "public" })
    expect(response).not.toHaveProperty("ownerPlayerId")
    expect(response).not.toHaveProperty("ownerDebug")
  })
})
