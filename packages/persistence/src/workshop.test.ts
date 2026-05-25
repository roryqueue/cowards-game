import { describe, expect, it } from "vitest"
import {
  runMatch,
  violation,
  type RuntimeResult,
  type StrategyRuntime,
} from "@cowards/engine"
import {
  transpileStrategySource,
  validateStrategySource,
} from "@cowards/runtime-js"
import {
  INITIAL_BOUNDS,
  type SoldierBrainResult,
  type StrategyResult,
  type StrategyRevision,
} from "@cowards/spec"
import {
  assertWorkshopRevisionCanBeTested,
  buildWorkshopRevision,
  GET_WORKSHOP_REVISION_SOURCE_SQL,
  getWorkshopTestSummary,
  LIST_WORKSHOP_REVISIONS_SQL,
  listWorkshopOpponents,
  listWorkshopPresets,
  listWorkshopSamples,
  listWorkshopTemplates,
  getWorkshopStaticSnapshot,
  WORKSHOP_STRATEGY_ID,
  WORKSHOP_MATCH_SET_PREFIX,
  WORKSHOP_OPPONENTS,
  workshopTemplateSource,
} from "./workshop.js"
import {
  buildAdvancedStrategyRevision,
  listAdvancedStrategies,
  type AdvancedStrategySummary,
} from "./advanced-strategies.js"
import {
  buildStarterStrategyRevision,
  listStarterStrategies,
  type StarterStrategySummary,
} from "./starter-strategies.js"
import { MATCH_SET_STATUSES } from "./schema.js"
import {
  LIST_MATCH_STATUSES_FOR_SET_SQL,
  mapMatchSetMatchSummaryRow,
} from "./matchset-status.js"

type StarterSmokeAdapter = {
  execute(request: {
    source: string
    methodName: "selectActivations" | "soldierBrain"
    input: unknown
  }): RuntimeResult<unknown>
}

const createStarterSmokeRuntime = (
  revision: StrategyRevision,
  adapter: StarterSmokeAdapter,
): StrategyRuntime => ({
  selectActivations(input) {
    return adapter.execute({
      source: revision.source,
      methodName: "selectActivations",
      input,
    }) as RuntimeResult<StrategyResult>
  },
  runSoldierBrain(input) {
    return adapter.execute({
      source: revision.source,
      methodName: "soldierBrain",
      input,
    }) as RuntimeResult<SoldierBrainResult>
  },
})

const createStarterSmokeAdapter = (): StarterSmokeAdapter => {
  const cache = new Map<string, Record<string, unknown>>()

  return {
    execute(request) {
      const cached = cache.get(request.source)
      const strategy =
        cached ??
        (() => {
          const transpiled = transpileStrategySource(request.source)
          if (!transpiled.ok) {
            throw new Error(transpiled.message)
          }
          const exports = {} as Record<string, unknown>
          const load = new Function(
            "exports",
            `${transpiled.code}; return exports.default`,
          )
          const loaded = load(exports) as Record<string, unknown>
          cache.set(request.source, loaded)
          return loaded
        })()
      const method = strategy[request.methodName]
      if (typeof method !== "function") {
        return {
          ok: false,
          violation: {
            type: "INVALID_OUTPUT",
            message: `Missing ${request.methodName}`,
          },
        }
      }
      return { ok: true, value: method(request.input) }
    },
  }
}

describe("Workshop service contracts", () => {
  it("ships valid built-in template and opponent sources", () => {
    expect(validateStrategySource(workshopTemplateSource).valid).toBe(true)

    for (const opponent of WORKSHOP_OPPONENTS) {
      expect(opponent.revisionId).toMatch(/^strategy-revision:/)
    }
  })

  it("summarizes presets without exposing Strategy source", () => {
    expect(listWorkshopPresets()).toEqual([
      expect.objectContaining({
        id: "smoke-v1",
        label: "Smoke",
        matchCount: 1,
      }),
      expect.objectContaining({
        id: "standard-v1",
        label: "Standard",
        matchCount: 8,
      }),
      expect.objectContaining({
        id: "stress-v1",
        label: "Stress",
        matchCount: 24,
      }),
    ])
  })

  it("summarizes opponents without source text", () => {
    expect(listWorkshopOpponents()).toEqual([
      {
        id: "opponent:cautious",
        label: "Cautious",
        revisionId: expect.stringMatching(/^strategy-revision:/),
      },
      {
        id: "opponent:reckless",
        label: "Reckless",
        revisionId: expect.stringMatching(/^strategy-revision:/),
      },
    ])
  })

  it("returns only valid starter templates", () => {
    expect(listWorkshopTemplates().map((template) => template.label)).toEqual([
      "Cautious",
      "Reckless",
      "Sentinel",
      "Python tactical starter",
    ])
    expect(
      listWorkshopTemplates().every((template) => template.validation.valid),
    ).toBe(true)
    expect(
      listWorkshopTemplates().find(
        (template) => template.sourceFormat === "python",
      ),
    ).toEqual(
      expect.objectContaining({
        experimental: true,
        countedPlayEligible: false,
      }),
    )
  })

  it("ships the full v1.4 Starter Strategy Library as distinct playable doctrines", () => {
    const starters = listStarterStrategies()

    expect(starters.map((starter) => starter.name)).toEqual([
      "Centerline Bully",
      "Corner Lurker",
      "Backstab Hunter",
      "Wall Press",
      "Ring Runner",
      "Mirror Breaker",
      "Center Turtle",
      "Aggro Chaser",
      "Escape Artist",
      "Trap Setter",
    ])
    expect(starters).toHaveLength(10)
    expect(starters.every((starter) => starter.validation.valid)).toBe(true)
    expect(starters.every((starter) => starter.version === "v1.4")).toBe(true)
    expect(starters.filter((starter) => starter.usesMemory)).toHaveLength(5)
    expect(new Set(starters.map((starter) => starter.sourceHash)).size).toBe(10)
  })

  it("runs every v1.4 Starter Strategy through an interleaved smoke gauntlet", () => {
    const starters = listStarterStrategies()
    const pairs = [
      [starters[0]!, starters[5]!],
      [starters[1]!, starters[6]!],
      [starters[2]!, starters[7]!],
      [starters[3]!, starters[8]!],
      [starters[4]!, starters[9]!],
    ] as const satisfies readonly (readonly [
      StarterStrategySummary,
      StarterStrategySummary,
    ])[]
    const playedStarterIds = new Set<string>()
    const eventTypes = new Set<string>()
    const adapter = createStarterSmokeAdapter()

    for (const [bottom, top] of pairs) {
      playedStarterIds.add(bottom.id)
      playedStarterIds.add(top.id)
      const bottomRuntime = createStarterSmokeRuntime(
        buildStarterStrategyRevision(bottom),
        adapter,
      )
      const topRuntime = createStarterSmokeRuntime(
        buildStarterStrategyRevision(top),
        adapter,
      )
      const runtime: StrategyRuntime = {
        selectActivations(input) {
          const playerId = input.mySoldiers[0]?.ownerPlayerId
          if (playerId === "player:bottom") {
            return bottomRuntime.selectActivations(input)
          }
          if (playerId === "player:top") {
            return topRuntime.selectActivations(input)
          }
          return violation("INVALID_OUTPUT", "Cannot resolve starter runtime")
        },
        runSoldierBrain(input) {
          return input.self.ownerPlayerId === "player:bottom"
            ? bottomRuntime.runSoldierBrain(input)
            : topRuntime.runSoldierBrain(input)
        },
      }

      const result = runMatch({
        matchId: `match:starter-gauntlet:${bottom.id}:${top.id}`,
        seed: `seed:starter-gauntlet:${bottom.id}:${top.id}`,
        arenaVariant: {
          id: "arena:starter-gauntlet:v1.4",
          name: "Starter Gauntlet",
          initialBounds: INITIAL_BOUNDS,
          terrainStones: [],
        },
        bottomPlayerId: "player:bottom",
        topPlayerId: "player:top",
        bottomStrategyRevisionId: `revision:${bottom.id}`,
        topStrategyRevisionId: `revision:${top.id}`,
        runtime,
        maxPhases: 100,
      })

      expect(result.state.outcome?.type).not.toBe("FAILED")
      expect(result.events.map((event) => event.type)).toContain(
        "CYCLE_STARTED",
      )
      expect(result.events.map((event) => event.type)).toContain(
        "ACTION_EMITTED",
      )
      for (const event of result.events) {
        eventTypes.add(event.type)
      }
    }

    expect(playedStarterIds.size).toBe(starters.length)
    expect(eventTypes.has("MOVE_ADVANCED")).toBe(true)
    expect(eventTypes.has("CONTRACTION_RESOLVED")).toBe(true)
  }, 90_000)

  it("keeps the serious Starter Library separate from generic samples", () => {
    const snapshot = getWorkshopStaticSnapshot()

    expect(snapshot.starters).toHaveLength(10)
    expect(snapshot.advancedStrategies).toHaveLength(10)
    expect(snapshot.samples.map((sample) => sample.id)).not.toContain(
      "starter:centerline-bully",
    )
  })

  it("ships a distinct v1.5 Advanced Strategy Library with archetype coverage", () => {
    const advanced = listAdvancedStrategies()
    const requiredArchetypes = [
      "pressure / contact",
      "anti-backstab positioning",
      "wall control",
      "center control",
      "contraction survival",
      "evasive mobility",
      "trap/control",
      "mirror-breaking/adaptive play",
      "late-cycle stabilization",
      "memory-based opponent response",
    ]

    expect(advanced).toHaveLength(10)
    expect(advanced.every((strategy) => strategy.version === "v1.5")).toBe(true)
    expect(advanced.every((strategy) => strategy.validation.valid)).toBe(true)
    expect(
      advanced.filter((strategy) => strategy.usesMemory).length,
    ).toBeGreaterThanOrEqual(5)
    expect(new Set(advanced.map((strategy) => strategy.sourceHash)).size).toBe(
      advanced.length,
    )
    expect(advanced.map((strategy) => strategy.primaryArchetype)).toEqual(
      requiredArchetypes,
    )
  })

  it("builds Advanced seed revisions with public-safe lineage metadata", () => {
    const advanced = listAdvancedStrategies()[0] as AdvancedStrategySummary
    const revision = buildAdvancedStrategyRevision(advanced)

    expect(revision.metadata.advancedLineage).toEqual({
      advancedId: advanced.id,
      advancedName: advanced.name,
      advancedVersion: "v1.5",
      archetype: advanced.primaryArchetype,
      sourceHash: advanced.sourceHash,
    })
    expect(revision.sourceHash).toBe(advanced.sourceHash)
    expect(revision.metadata).not.toHaveProperty("source")
  })

  it("runs every v1.5 Advanced Strategy against a v1.4 Starter smoke opponent", () => {
    const advancedStrategies = listAdvancedStrategies()
    const starters = listStarterStrategies()
    const adapter = createStarterSmokeAdapter()
    const eventTypes = new Set<string>()

    advancedStrategies.forEach((advanced, index) => {
      const starter = starters[index % starters.length]!
      const bottomRuntime = createStarterSmokeRuntime(
        buildAdvancedStrategyRevision(advanced),
        adapter,
      )
      const topRuntime = createStarterSmokeRuntime(
        buildStarterStrategyRevision(starter),
        adapter,
      )
      const runtime: StrategyRuntime = {
        selectActivations(input) {
          const playerId = input.mySoldiers[0]?.ownerPlayerId
          if (playerId === "player:advanced") {
            return bottomRuntime.selectActivations(input)
          }
          if (playerId === "player:starter") {
            return topRuntime.selectActivations(input)
          }
          return violation("INVALID_OUTPUT", "Cannot resolve gauntlet runtime")
        },
        runSoldierBrain(input) {
          return input.self.ownerPlayerId === "player:advanced"
            ? bottomRuntime.runSoldierBrain(input)
            : topRuntime.runSoldierBrain(input)
        },
      }

      const result = runMatch({
        matchId: `match:advanced-gauntlet:${advanced.id}:${starter.id}`,
        seed: `seed:advanced-gauntlet:${advanced.id}:${starter.id}`,
        arenaVariant: {
          id: "arena:advanced-gauntlet:v1.5",
          name: "Advanced Gauntlet",
          initialBounds: INITIAL_BOUNDS,
          terrainStones: [],
        },
        bottomPlayerId: "player:advanced",
        topPlayerId: "player:starter",
        bottomStrategyRevisionId: `revision:${advanced.id}`,
        topStrategyRevisionId: `revision:${starter.id}`,
        runtime,
        maxPhases: 100,
      })

      expect(result.state.outcome?.type).not.toBe("FAILED")
      expect(result.events.map((event) => event.type)).toContain(
        "CYCLE_STARTED",
      )
      expect(result.events.map((event) => event.type)).toContain(
        "ACTION_EMITTED",
      )
      for (const event of result.events) {
        eventTypes.add(event.type)
      }
    })

    expect(eventTypes.has("MOVE_ADVANCED")).toBe(true)
    expect(eventTypes.has("CONTRACTION_RESOLVED")).toBe(true)
  }, 240_000)

  it("returns sample Strategy metadata for every catalog entry", () => {
    for (const sample of listWorkshopSamples()) {
      expect(sample.id).toMatch(/^sample:/)
      expect(sample.label.length).toBeGreaterThan(0)
      expect(sample.description.length).toBeGreaterThan(0)
      expect(sample.description.length).toBeLessThanOrEqual(96)
      expect(sample.categories.length).toBeGreaterThan(0)
      expect(sample.source.length).toBeGreaterThan(0)
      expect(["starter", "failure-mode"]).toContain(sample.sampleKind)
    }
  })

  it("ships valid starter samples for common doctrine mechanics", () => {
    const starters = listWorkshopSamples().filter(
      (sample) => sample.sampleKind === "starter",
    )

    expect(starters.map((sample) => sample.id)).toEqual([
      "sample:basic-advance-turn",
      "sample:push-setup",
      "sample:backstab-setup",
      "sample:stoning-blocking",
      "sample:python-screen-and-stone",
      "sample:python-push-pressure",
      "sample:python-backstab-lane",
    ])
    expect(starters.map((sample) => sample.label)).toEqual([
      "Basic advance and turn",
      "Push setup",
      "Backstab setup",
      "Stone and blocking",
      "Python screen and stone",
      "Python push pressure",
      "Python backstab lane",
    ])
    expect(starters.map((sample) => sample.categories[0])).toEqual([
      "Movement",
      "Push",
      "Backstab",
      "Stone",
      "Python beta",
      "Python beta",
      "Python beta",
    ])
    expect(starters.every((sample) => sample.validation.valid)).toBe(true)
    expect(
      starters.every((sample) => sample.validation.errors.length === 0),
    ).toBe(true)
    expect(
      starters.every(
        (sample) =>
          sample.expectedValidationCode === undefined &&
          sample.expectedRuntimeViolationType === undefined,
      ),
    ).toBe(true)
    expect(
      starters
        .filter((sample) => sample.sourceFormat === "python")
        .map((sample) => sample.id),
    ).toEqual([
      "sample:python-screen-and-stone",
      "sample:python-push-pressure",
      "sample:python-backstab-lane",
    ])
  })

  it("ships intentional failure-mode samples with explicit expectations", () => {
    const failureModes = listWorkshopSamples().filter(
      (sample) => sample.sampleKind === "failure-mode",
    )

    expect(failureModes.map((sample) => sample.id)).toEqual([
      "sample:failure-forbidden-clock",
      "sample:failure-runtime-timeout",
      "sample:failure-invalid-output",
      "sample:failure-thrown-exception",
      "sample:failure-do-nothing",
    ])

    for (const sample of failureModes) {
      if (sample.expectedValidationCode) {
        expect(sample.validation.valid).toBe(false)
        expect(sample.validation.errors.map((error) => error.code)).toContain(
          sample.expectedValidationCode,
        )
      }

      if (sample.expectedRuntimeViolationType) {
        expect(sample.validation.valid).toBe(true)
      }
    }

    expect(
      failureModes.find((sample) => sample.id === "sample:failure-do-nothing")
        ?.validation.valid,
    ).toBe(true)
    expect(
      failureModes.find(
        (sample) => sample.id === "sample:failure-runtime-timeout",
      )?.expectedRuntimeViolationType,
    ).toBe("TIMEOUT")
  })

  it("documents runtime failure samples and advertised violation types", () => {
    const runtimeFailureSamples = listWorkshopSamples().filter(
      (sample) => sample.expectedRuntimeViolationType,
    )

    expect(runtimeFailureSamples.map((sample) => sample.id)).toEqual([
      "sample:failure-runtime-timeout",
      "sample:failure-invalid-output",
      "sample:failure-thrown-exception",
    ])

    for (const sample of runtimeFailureSamples) {
      expect(validateStrategySource(sample.source).valid).toBe(true)
      expect(sample.expectedRuntimeViolationType).toMatch(
        /^(TIMEOUT|INVALID_OUTPUT|THROWN_EXCEPTION)$/,
      )
    }
  })

  it("keeps revision history limited to local Workshop revisions", () => {
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain("strategy_id = $1")
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain("created_at desc")
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain(
      "bottom_strategy_revision_id = sr.id",
    )
    expect(LIST_WORKSHOP_REVISIONS_SQL).toContain(
      "top_strategy_revision_id = sr.id",
    )
    expect(GET_WORKSHOP_REVISION_SOURCE_SQL).toContain("strategy_id = $2")
  })

  it("defines safe Workshop test summary vocabulary", () => {
    expect(WORKSHOP_MATCH_SET_PREFIX).toBe("match-set:workshop:")
    expect(listWorkshopPresets()[0]).toMatchObject({
      id: "smoke-v1",
      matchCount: 1,
    })
    expect(MATCH_SET_STATUSES).toEqual([
      "pending",
      "running",
      "complete",
      "failed_system",
      "blocked",
      "degraded",
    ])
  })

  it("maps Match rows with outcome and replay availability", () => {
    expect(LIST_MATCH_STATUSES_FOR_SET_SQL).toContain("left join chronicles")
    expect(LIST_MATCH_STATUSES_FOR_SET_SQL).toContain("winner_player_id")
    expect(
      mapMatchSetMatchSummaryRow({
        match_id: "match:complete",
        status: "complete",
        bottom_player_id: "player:bottom",
        top_player_id: "player:top",
        outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
        winner_player_id: "player:bottom",
        chronicle_match_id: "match:complete",
      }),
    ).toEqual({
      matchId: "match:complete",
      status: "complete",
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
      winnerPlayerId: "player:bottom",
      hasReplay: true,
    })
    expect(
      mapMatchSetMatchSummaryRow({
        match_id: "match:missing-chronicle",
        status: "complete",
        bottom_player_id: "player:bottom",
        top_player_id: "player:top",
        outcome: { type: "DRAW" },
        winner_player_id: null,
        chronicle_match_id: null,
      }),
    ).toMatchObject({ hasReplay: false })
    expect(
      mapMatchSetMatchSummaryRow({
        match_id: "match:failed",
        status: "failed_system",
        bottom_player_id: "player:bottom",
        top_player_id: "player:top",
        outcome: null,
        winner_player_id: null,
        chronicle_match_id: "match:failed",
      }),
    ).toEqual({
      matchId: "match:failed",
      status: "failed_system",
      bottomPlayerId: "player:bottom",
      topPlayerId: "player:top",
      hasReplay: false,
    })
  })

  it("only allows valid local Workshop revisions into Workshop tests", () => {
    const localRevision = buildWorkshopRevision({
      source: workshopTemplateSource,
    })

    expect(
      assertWorkshopRevisionCanBeTested(localRevision, localRevision.id),
    ).toBe(localRevision)
    expect(() =>
      assertWorkshopRevisionCanBeTested(null, "strategy-revision:missing"),
    ).toThrow("Workshop revision not found")
    expect(() =>
      assertWorkshopRevisionCanBeTested(
        { ...localRevision, strategyId: "strategy:opponent" },
        localRevision.id,
      ),
    ).toThrow("local Workshop revision")
    expect(() =>
      assertWorkshopRevisionCanBeTested(
        {
          ...localRevision,
          strategyId: WORKSHOP_STRATEGY_ID,
          validation: { ...localRevision.validation, valid: false },
        },
        localRevision.id,
      ),
    ).toThrow("valid Strategy revision")
  })

  it("does not expose non-Workshop MatchSets through Workshop status lookup", async () => {
    const pool = {
      query: async () => {
        throw new Error("non-Workshop MatchSet should not be queried")
      },
    } as never

    await expect(
      getWorkshopTestSummary(pool, "match-set:ranked:secret"),
    ).resolves.toBeNull()
  })
})
