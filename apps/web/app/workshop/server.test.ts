import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { createWorkshopServer, isStorageUnavailableError } from "./server.js"
import {
  COMPATIBILITY_VERSIONS,
  defaultRuntimeMetadata,
  type StrategyRevision,
} from "@cowards/spec"

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

const stubProviderRevision = (source: string): StrategyRevision => {
  const sourceHash = createHash("sha256").update(source).digest("hex")
  const sourceBytes = new TextEncoder().encode(source).length
  const runtime = defaultRuntimeMetadata("typescript")
  const validation = {
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
  }
  return {
    id: `strategy-revision:stub:${sourceHash}`,
    strategyId: "strategy:local-workshop",
    source,
    sourceHash,
    sourceBytes,
    runtime,
    engineCompatibility: validation.engineCompatibility,
    validation,
    metadata: {
      createdBy: "user:local",
      providerValidation: {
        providerId: "strategy-language-provider-js-ts",
        contractVersion: "runtime-provider-validation-test",
        sourceHash,
        sourceBytes,
        artifactHash: "artifact-hash",
        artifactBytes: 7,
        proof: "sha256:provider-proof",
      },
      sourceArtifact: {
        format: "transpiled-javascript",
        hash: "artifact-hash",
        bytes: 7,
        bytesBase64: "cHJpdmF0ZQ==",
        sourceHash,
        sourceBytes,
        abiVersion: runtime.abiVersion,
        validationStatus: "valid",
        sourceIdentity: {
          identityVersion: "strategy-source-identity-v2",
          normalizationPolicy: "source-line-endings-lf-v1.17",
          originalSourceSha256: `sha256:${"a".repeat(64)}`,
          originalSourceBytes: sourceBytes,
          normalizedSourceSha256: `sha256:${"b".repeat(64)}`,
          normalizedSourceBytes: sourceBytes,
          lineEndings: { kind: "none", lf: 0, crlf: 0, cr: 0 },
          hasFinalNewline: false,
        },
        createdAt: "test",
        toolchain: {
          language: "typescript",
          runtime: "test",
          runtimeVersion: "test",
          commandSummary: "test",
          validationPolicy: "test",
        },
        publicEvidence: {
          label: "test",
          nonCounted: false,
          sandboxClaim: "provenance-only",
        },
      },
    },
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
    const providerRevision = stubProviderRevision(validSource)
    const insertedIds: string[] = []
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async (_pool, revision) => {
        insertedIds.push(revision.id)
        return revision
      },
      buildRevision: (input) => ({
        ...providerRevision,
        metadata: {
          ...providerRevision.metadata,
          label: input.label,
          notes: input.notes,
        },
      }),
    })

    const response = await server.submitSource({
      source: validSource,
      runtime: providerRevision.runtime,
      validation: providerRevision.validation,
      engineCompatibility: providerRevision.engineCompatibility,
      metadata: providerRevision.metadata,
      runtimeServiceValidated: true,
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
      expect(JSON.stringify(response)).not.toContain("bytesBase64")
      expect(JSON.stringify(response)).not.toContain("sourceIdentity")
      expect(JSON.stringify(response)).not.toContain(validSource)
    }
  })

  it("fails closed for proofless default TypeScript submissions", async () => {
    let inserted = false
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async () => {
        inserted = true
        throw new Error("proofless source must not be inserted")
      },
    })

    await expect(server.submitSource({ source: validSource })).rejects.toThrow(
      "runtime-service provider validation",
    )
    expect(inserted).toBe(false)
  })

  it("requires exact runtime-service provenance for submitted Workshop revisions", async () => {
    const providerRevision = stubProviderRevision(validSource)
    const insertedIds: string[] = []
    const server = createWorkshopServer({
      withPool: async (fn) => fn({} as never),
      insertRevision: async (_pool, revision) => {
        insertedIds.push(revision.id)
        return revision
      },
      buildRevision: (input) => {
        if (input.source !== validSource) {
          throw new Error(
            "TypeScript Workshop revisions require runtime-service provider validation.",
          )
        }
        return providerRevision
      },
    })

    await expect(
      server.submitSource({
        source: validSource,
        sourceFormat: "typescript",
        runtime: providerRevision.runtime,
        validation: providerRevision.validation,
        engineCompatibility: providerRevision.engineCompatibility,
        metadata: providerRevision.metadata,
      }),
    ).rejects.toThrow("runtime-service provider validation")

    await expect(
      server.submitSource({
        source: `${validSource}\n// changed after provider validation\n`,
        sourceFormat: "typescript",
        runtime: providerRevision.runtime,
        validation: providerRevision.validation,
        engineCompatibility: providerRevision.engineCompatibility,
        metadata: providerRevision.metadata,
        runtimeServiceValidated: true,
      }),
    ).rejects.toThrow("runtime-service provider validation")

    const response = await server.submitSource({
      source: validSource,
      sourceFormat: "typescript",
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
        providerId: "strategy-language-provider-js-ts",
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
