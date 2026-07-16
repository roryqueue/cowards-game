import { describe, expect, it } from "vitest"
import {
  runMatch,
  violation,
  type RuntimeResult,
  type StrategyRuntime,
} from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import {
  buildStrategyRevisionV117,
  transpileStrategySource,
  validateStrategySource,
} from "@cowards/runtime-js"
import {
  buildPythonStrategyRevision,
  buildPythonStrategyRevisionV117,
  createPythonRuntimeFromRevision,
} from "@cowards/runtime-python"
import {
  buildRustStrategyRevisionV117,
  buildZigStrategyRevisionV117,
} from "@cowards/runtime-wasm-wasi"
import {
  INITIAL_BOUNDS,
  STRATEGY_RUNTIME_ABI_VERSION,
  type SoldierBrainResult,
  type StrategyInput,
  type StrategyResult,
  type StrategyRevision,
} from "@cowards/spec"
import {
  assertWorkshopRevisionCanBeTested,
  buildWorkshopRevision,
  createWorkshopTestMatchSet,
  GET_WORKSHOP_REVISION_SOURCE_SQL,
  getWorkshopTestSummary,
  insertWorkshopRevision,
  LIST_WORKSHOP_REVISIONS_SQL,
  listWorkshopOpponents,
  listWorkshopPresets,
  listWorkshopSamples,
  listWorkshopTemplates,
  publicWorkshopRevisionMetadata,
  rustWasiTacticalStarterSource,
  pythonTacticalStarterSource,
  zigWasiTacticalStarterSource,
  getWorkshopStaticSnapshot,
  WORKSHOP_STRATEGY_ID,
  WORKSHOP_MATCH_SET_PREFIX,
  WORKSHOP_OPPONENTS,
  workshopTemplateSource,
  workshopRuntimeSemantics,
} from "./workshop.js"
import type { Pool } from "pg"
import type { MatchSetExecutionEvidenceResolver } from "./matchset-service.js"
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
  it("fails closed on empty production authority before seeding Workshop rows", async () => {
    let calls = 0
    const pool = {
      async query() {
        calls += 1
        throw new Error("database must not be reached")
      },
    } as unknown as Pool

    await expect(
      createWorkshopTestMatchSet(pool, {
        revisionId: "strategy-revision:workshop:test",
        opponentId: "opponent:cautious",
        presetId: "smoke-v1",
        matchSetId: "match-set:workshop:test",
      }),
    ).rejects.toThrow(/containment.*unavailable|production.*empty/iu)
    expect(calls).toBe(0)
  })

  it("resolves Workshop revision and opponent as independent entrants", async () => {
    let captured: readonly {
      entrantKey: string
      strategyRevisionId: string
    }[] = []
    const resolver: MatchSetExecutionEvidenceResolver = {
      trustDomain: "fixture",
      async resolve(input) {
        captured = input.entrants
        throw new Error("captured fixture resolution")
      },
    }
    const pool = {
      async query() {
        throw new Error("unreachable")
      },
    } as unknown as Pool
    await expect(
      createWorkshopTestMatchSet(pool, {
        revisionId: "strategy-revision:workshop:test",
        opponentId: "opponent:cautious",
        presetId: "smoke-v1",
        evidenceResolver: resolver,
      }),
    ).rejects.toThrow("captured fixture resolution")
    expect(captured).toEqual([
      {
        entrantKey: "strategy-revision:workshop:test",
        strategyRevisionId: "strategy-revision:workshop:test",
      },
      {
        entrantKey: WORKSHOP_OPPONENTS[0].revisionId,
        strategyRevisionId: WORKSHOP_OPPONENTS[0].revisionId,
      },
    ])
  })

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
      "Rust WASI tactical starter",
      "Zig WASI tactical starter",
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
        experimental: false,
        countedPlayEligible: false,
      }),
    )
    expect(
      listWorkshopTemplates().some(
        (template) => template.countedPlayEligible === true,
      ),
    ).toBe(false)
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
        runtime: adaptRuntimeForCurrentKernel(runtime),
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
        runtime: adaptRuntimeForCurrentKernel(runtime),
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
      "sample:rust-wasi-stone",
      "sample:zig-wasi-stone",
    ])
    expect(starters.map((sample) => sample.label)).toEqual([
      "Basic advance and turn",
      "Push setup",
      "Backstab setup",
      "Stone and blocking",
      "Python screen and stone",
      "Python push pressure",
      "Python backstab lane",
      "Rust WASI stone",
      "Zig WASI stone",
    ])
    expect(starters.map((sample) => sample.categories[0])).toEqual([
      "Movement",
      "Push",
      "Backstab",
      "Stone",
      "Python",
      "Python",
      "Python",
      "Rust",
      "Zig",
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
    expect(
      starters
        .filter((sample) => sample.sourceFormat === "rust")
        .map((sample) => sample.id),
    ).toEqual(["sample:rust-wasi-stone"])
  })

  it("validates bundled Python starter identities while the retired public runtime fails closed", () => {
    const pythonSamples = listWorkshopSamples().filter(
      (sample) => sample.sourceFormat === "python",
    )

    for (const sample of pythonSamples) {
      const legacyShapeRevision = buildPythonStrategyRevision({
        source: sample.source,
        strategyId: WORKSHOP_STRATEGY_ID,
      })
      const revision = buildPythonStrategyRevisionV117({
        source: sample.source,
        strategyId: WORKSHOP_STRATEGY_ID,
      })
      const artifact = revision.metadata.sourceArtifact
      expect(sample.validation.valid, sample.id).toBe(true)
      expect(revision.validation.valid, sample.id).toBe(true)
      expect(revision.runtime.abiVersion, sample.id).toBe(
        "strategy-runtime-abi-v1.17",
      )
      expect(artifact, sample.id).toMatchObject({
        abiVersion: "strategy-runtime-abi-v1.17",
        format: "python-source-bundle",
        sourceHash: revision.sourceHash,
        sourceBytes: revision.sourceBytes,
        validationStatus: "valid",
        sourceIdentity: {
          identityVersion: "strategy-source-identity-v2",
          normalizationPolicy: "source-line-endings-lf-v1.17",
        },
      })
      const activationInput: StrategyInput = {
        phaseNumber: 1,
        roundNumber: 1,
        activationCount: 1,
        board: {
          bounds: INITIAL_BOUNDS,
          soldiers: [],
          terrainStones: [],
        },
        mySoldiers: [
          {
            id: "soldier:sample",
            ownerPlayerId: "player:workshop-local",
            status: "ACTIVE",
            position: { x: 0, y: 0 },
            facing: "UP",
            lastSuccessfulMoveDirection: null,
          },
        ],
        enemySoldiers: [],
        strategyMemory: {},
      }

      expect(STRATEGY_RUNTIME_ABI_VERSION).toBe("strategy-runtime-abi-v1.17")
      const selectedResult = createPythonRuntimeFromRevision(
        legacyShapeRevision,
      ).selectActivations(activationInput)
      expect(selectedResult).toMatchObject({
        ok: false,
        systemFailure: { code: "MALFORMED_IPC", retryable: true },
      })
      expect(selectedResult).not.toHaveProperty("value")
    }
  }, 15_000)

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

  it("admits only exact selected runtime-service revisions with collision-safe identity", () => {
    const candidates = [
      {
        sourceFormat: "typescript" as const,
        revision: buildStrategyRevisionV117({ source: workshopTemplateSource }),
      },
      {
        sourceFormat: "python" as const,
        revision: buildPythonStrategyRevisionV117({
          source: pythonTacticalStarterSource,
        }),
      },
      {
        sourceFormat: "rust" as const,
        revision: buildRustStrategyRevisionV117({
          source: rustWasiTacticalStarterSource,
        }),
      },
      {
        sourceFormat: "zig" as const,
        revision: buildZigStrategyRevisionV117({
          source: zigWasiTacticalStarterSource,
        }),
      },
    ]
    const admit = (candidate: (typeof candidates)[number]) =>
      buildWorkshopRevision({
        source: candidate.revision.source,
        sourceFormat: candidate.sourceFormat,
        runtime: candidate.revision.runtime,
        validation: candidate.revision.validation,
        engineCompatibility: candidate.revision.engineCompatibility,
        metadata: candidate.revision.metadata,
        runtimeServiceValidated: true,
      })

    if (String(STRATEGY_RUNTIME_ABI_VERSION) !== "strategy-runtime-abi-v1.17") {
      for (const candidate of candidates) {
        expect(() => admit(candidate)).toThrow(
          "runtime-service provider validation",
        )
      }
      return
    }

    const admitted = candidates.map(admit)
    for (const [index, revision] of admitted.entries()) {
      expect(admit(candidates[index]!)).toEqual(revision)
      expect(revision.id).toMatch(
        /^strategy-revision:workshop:(typescript|python|rust|zig):sha256:[0-9a-f]{64}$/u,
      )
      expect(workshopRuntimeSemantics(revision)).toMatchObject({
        countedPlayEligible: false,
        countedPlayLabel: "Not counted",
      })
      const publicMetadata = publicWorkshopRevisionMetadata(revision.metadata)
      expect(JSON.stringify(publicMetadata)).not.toContain("bytesBase64")
      expect(JSON.stringify(publicMetadata)).not.toContain("sourceIdentity")
    }

    const proofDrift = globalThis.structuredClone(candidates[0]!)
    proofDrift.revision.metadata.providerValidation.proof = `sha256:${"0".repeat(64)}`
    expect(() => admit(proofDrift)).toThrow(
      "runtime-service provider validation",
    )

    const historicalProof = globalThis.structuredClone(candidates[0]!)
    historicalProof.revision.metadata.providerValidation.contractVersion =
      "strategy-language-provider-contract-v1.33"
    historicalProof.revision.metadata.providerValidation.proof = `hmac-sha256:${"0".repeat(64)}`
    expect(() => admit(historicalProof)).toThrow(
      "runtime-service provider validation",
    )

    const identityDrift = globalThis.structuredClone(candidates[0]!)
    const identityArtifact = identityDrift.revision.metadata.sourceArtifact
    if (identityArtifact?.sourceIdentity === undefined) {
      throw new Error("TypeScript v1.17 fixture is missing source identity.")
    }
    identityArtifact.sourceIdentity.lineEndings = {
      kind: "crlf",
      lf: 0,
      crlf: 1,
      cr: 0,
    }
    expect(() => admit(identityDrift)).toThrow(
      "runtime-service provider validation",
    )

    const distinctToolchain = globalThis.structuredClone(candidates[0]!)
    const distinctArtifact = distinctToolchain.revision.metadata.sourceArtifact
    if (distinctArtifact === undefined) {
      throw new Error("TypeScript v1.17 fixture is missing its artifact.")
    }
    distinctArtifact.toolchain.commandSummary = `${distinctArtifact.toolchain.commandSummary} exact-distinct-toolchain`
    const distinctAdmission = admit(distinctToolchain)
    expect(distinctAdmission.sourceHash).toBe(admitted[0]!.sourceHash)
    expect(distinctAdmission.id).not.toBe(admitted[0]!.id)
  }, 30_000)

  it("persists Workshop source identity as an all-or-none v2 record", async () => {
    const revision = buildWorkshopRevision({ source: workshopTemplateSource })
    const calls: { text: string; values?: readonly unknown[] | undefined }[] =
      []
    const query = async (text: string, values?: readonly unknown[]) => {
      calls.push({ text, values })
      return { rows: [], rowCount: 0 }
    }
    const client = { query, release: () => undefined }
    const pool = {
      query,
      connect: async () => client,
    } as unknown as Pool

    await insertWorkshopRevision(pool, revision)

    const insert = calls.find(
      ({ text, values }) =>
        text.includes("insert into strategy_revisions") &&
        values?.[0] === revision.id,
    )
    expect(insert?.values?.slice(10, 18)).toEqual([
      "strategy-source-identity-v2",
      expect.stringMatching(/^[0-9a-f]{64}$/u),
      revision.sourceBytes,
      expect.stringMatching(/^[0-9a-f]{64}$/u),
      revision.sourceBytes,
      "source-line-endings-lf-v1.17",
      expect.objectContaining({ kind: expect.any(String) }),
      false,
    ])
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
