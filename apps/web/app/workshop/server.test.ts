import { describe, expect, it } from "vitest"
import { createHash, createHmac } from "node:crypto"
import { createWorkshopServer, isStorageUnavailableError } from "./server.js"
import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
  type StrategyRevision,
  type StrategyRevisionMetadata,
} from "@cowards/spec"

const TEST_PROVIDER_VALIDATION_SECRET =
  "cowards-provider-validation-test-secret-v1.32"

process.env.COWARDS_PROVIDER_VALIDATION_SECRET = TEST_PROVIDER_VALIDATION_SECRET

const validSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory }
  }
}
`.trim()

const pythonProviderValidationProof = (input: {
  sourceHash: string
  sourceBytes: number
}): string =>
  `hmac-sha256:${createHmac(
    "sha256",
    TEST_PROVIDER_VALIDATION_SECRET,
  )
    .update(
      [
        "strategy-language-provider-python",
        STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
        input.sourceHash,
        String(input.sourceBytes),
        "",
        "",
      ].join("\n"),
    )
    .digest("hex")}`

const pythonProviderMetadata = (
  source: string,
): Pick<
  StrategyRevision,
  "runtime" | "validation" | "engineCompatibility" | "metadata" | "sourceHash"
> => {
  const sourceBytes = new TextEncoder().encode(source).length
  const sourceHash = createHash("sha256").update(source).digest("hex")
  const runtime: StrategyRevision["runtime"] = {
    abiVersion: "strategy-runtime-abi-v1.14",
    language: { id: "python", version: "3.9" },
    adapter: {
      id: "runtime-python-subprocess-experimental",
      version: "0.1.0-experimental",
    },
    package: { mode: "none", entrypoint: "module" },
    requiredCapabilities: [],
    limits: {
      timeoutMs: 1000,
      stdoutBytes: 262144,
      stderrBytes: 65536,
      sourceBytes: 65536,
      strategyMemoryBytes: 32768,
      soldierMemoryBytes: 2048,
      objectivePayloadBytes: 1024,
      environment: "minimal",
      filesystem: "none",
      network: "disabled",
      shell: "disabled",
      packagePolicy: "none",
    },
  }
  const metadata: StrategyRevisionMetadata = {
    tags: ["python", "counted", "provider"],
    providerValidation: {
      providerId: "strategy-language-provider-python",
      contractVersion: STRATEGY_LANGUAGE_PROVIDER_CONTRACT_VERSION,
      sourceHash,
      sourceBytes,
      proof: pythonProviderValidationProof({ sourceHash, sourceBytes }),
    },
  }
  return {
    sourceHash,
    runtime,
    validation: {
      valid: true,
      errors: [],
      warnings: [],
      sourceBytes,
      forbiddenPatterns: [],
      sourceHash,
      runtimeVersion: runtime.adapter.version,
      engineCompatibility: {
        spec: COMPATIBILITY_VERSIONS.spec,
        engine: COMPATIBILITY_VERSIONS.engine,
      },
    },
    engineCompatibility: {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
    metadata,
  }
}

describe("Workshop server facade", () => {
  it("returns validation errors without inserting invalid source", async () => {
    let inserted = false
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async () => {
        inserted = true
        throw new Error("should not insert invalid source")
      },
    })

    const response = await server.submitSource({ source: "export default {}" })

    expect(response.ok).toBe(false)
    expect(response.validation.valid).toBe(false)
    expect(inserted).toBe(false)
  })

  it("builds and inserts Workshop revisions without returning source text", async () => {
    const insertedIds: string[] = []
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async (_pool, revision) => {
        insertedIds.push(revision.id)
        return revision
      },
    })

    const response = await server.submitSource({
      source: validSource,
      label: "Local test",
      notes: "Workshop note",
    })

    expect(response.ok).toBe(true)
    if (response.ok) {
      expect(insertedIds).toEqual([response.revision.id])
      expect(response.revision.metadata).toMatchObject({
        createdBy: "user:local",
        label: "Local test",
        notes: "Workshop note",
      })
      expect(response.revision).not.toHaveProperty("source")
    }
  })

  it("requires runtime-service provenance for submitted Python Workshop revisions", async () => {
    const pythonSource = `
def select_activations(input):
    return {"activationOrders": [], "strategyMemory": input["strategyMemory"]}

def soldier_brain(input):
    return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
`
    const providerRevision = pythonProviderMetadata(pythonSource)
    const insertedIds: string[] = []
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async (_pool, revision) => {
        insertedIds.push(revision.id)
        return revision
      },
    })

    await expect(
      server.submitSource({
        source: pythonSource,
        sourceFormat: "python",
        runtime: providerRevision.runtime,
        validation: providerRevision.validation,
        engineCompatibility: providerRevision.engineCompatibility,
        metadata: providerRevision.metadata,
      }),
    ).rejects.toThrow("runtime-service provider validation")

    await expect(
      server.submitSource({
        source: `${pythonSource}\n# changed after provider validation\n`,
        sourceFormat: "python",
        runtime: providerRevision.runtime,
        validation: providerRevision.validation,
        engineCompatibility: providerRevision.engineCompatibility,
        metadata: providerRevision.metadata,
        runtimeServiceValidated: true,
      }),
    ).rejects.toThrow("runtime-service provider validation")

    const response = await server.submitSource({
      source: pythonSource,
      sourceFormat: "python",
      runtime: providerRevision.runtime,
      validation: providerRevision.validation,
      engineCompatibility: providerRevision.engineCompatibility,
      metadata: providerRevision.metadata,
      runtimeServiceValidated: true,
    })

    expect(response.ok).toBe(true)
    expect(insertedIds).toHaveLength(1)
    if (response.ok) {
      expect(response.revision.metadata.providerValidation).toMatchObject({
        providerId: "strategy-language-provider-python",
        sourceHash: providerRevision.sourceHash,
      })
    }
  })

  it("delegates source, launch, and status lookups through injected services", async () => {
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      getSource: async (_pool, revisionId) => `source:${revisionId}`,
      createTestMatchSet: async (_pool, input) => ({
        matchSetId: `match-set:${input.revisionId}`,
        status: "pending",
        matchIds: ["match:1"],
        matchCount: 1,
        matches: [
          {
            matchId: "match:1",
            status: "pending",
            bottomPlayerId: "player:workshop-local",
            topPlayerId: "player:opponent",
            hasReplay: false,
          },
        ],
        scoring: { complete: false, degraded: false, rankings: [] },
      }),
      getTestSummary: async (_pool, matchSetId) => ({
        matchSetId,
        status: "pending",
        matchCount: 1,
        matches: [
          {
            matchId: "match:1",
            status: "pending",
            bottomPlayerId: "player:workshop-local",
            topPlayerId: "player:opponent",
            hasReplay: false,
          },
        ],
        scoring: { complete: false, degraded: false, rankings: [] },
      }),
    })

    await expect(server.getRevisionSource("strategy-revision:1")).resolves.toBe(
      "source:strategy-revision:1",
    )
    await expect(
      server.launchTest({
        revisionId: "strategy-revision:1",
        opponentId: "opponent:cautious",
        presetId: "smoke-v1",
      }),
    ).resolves.toEqual({
      matchSetId: "match-set:strategy-revision:1",
      status: "pending",
      matchIds: ["match:1"],
      matchCount: 1,
      matches: [
        {
          matchId: "match:1",
          status: "pending",
          bottomPlayerId: "player:workshop-local",
          topPlayerId: "player:opponent",
          hasReplay: false,
        },
      ],
      scoring: { complete: false, degraded: false, rankings: [] },
    })
    await expect(server.getTestSummary("match-set:1")).resolves.toMatchObject({
      status: "pending",
      matchCount: 1,
    })
  })

  it("falls back to static Workshop data only for storage-unavailable errors", async () => {
    const server = createWorkshopServer({
      withPool: async () => {
        throw Object.assign(new Error("database is unavailable"), {
          code: "ECONNREFUSED",
        })
      },
    })

    await expect(server.getInitialData()).resolves.toMatchObject({
      revisions: [],
      opponents: expect.any(Array),
      presets: expect.any(Array),
      templates: expect.any(Array),
    })

    const unexpected = createWorkshopServer({
      withPool: async () => {
        throw Object.assign(new Error("schema drift"), { code: "42P01" })
      },
    })

    await expect(unexpected.getInitialData()).rejects.toThrow("schema drift")
  })

  it("recognizes storage errors through nested causes", () => {
    expect(
      isStorageUnavailableError({
        cause: Object.assign(new Error("refused"), { code: "ECONNREFUSED" }),
      }),
    ).toBe(true)
    expect(isStorageUnavailableError({ code: "42P01" })).toBe(false)
  })
})
