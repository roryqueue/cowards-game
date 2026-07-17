import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import {
  buildRevisionRevalidationArtifactV119,
  executeTypeScriptRevisionCandidateV119,
  freezePreV119StrategyRevisionInventory,
  type StrategyRevisionInventoryDatabaseRowV119,
} from "./revalidate-v1-37-strategy-revisions-v1-19.js"

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const source = `export default {
  selectActivations(input) {
    return { activationOrders: input.mySoldiers.slice(0, 1).map((soldier) => ({ soldierId: soldier.id })), strategyMemory: null }
  },
  soldierBrain(input) {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory }
  }
}`
const artifact = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
  selectActivations(input) {
    return { activationOrders: input.mySoldiers.slice(0, 1).map((soldier) => ({ soldierId: soldier.id })), strategyMemory: null };
  },
  soldierBrain(input) {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: input.soldierMemory };
  }
};`

const row = (
  id: string,
  options: { locked?: boolean; sourceText?: string } = {},
): StrategyRevisionInventoryDatabaseRowV119 => {
  const sourceText = options.sourceText ?? source
  const artifactBytes = Buffer.from(artifact, "utf8")
  const sourceHash = createHash("sha256").update(sourceText).digest("hex")
  const artifactHash = createHash("sha256").update(artifactBytes).digest("hex")
  return {
    id,
    source: sourceText,
    source_hash: sourceHash,
    source_bytes: Buffer.byteLength(sourceText),
    runtime: {
      abiVersion: "strategy-runtime-abi-v1.17",
      language: { id: "typescript", version: "0.1.0" },
    },
    metadata: {
      providerValidation: {
        providerId: "strategy-language-provider-js-ts",
        contractVersion: "strategy-language-provider-contract-v1.33",
        sourceHash,
        sourceBytes: Buffer.byteLength(sourceText),
        artifactHash,
        artifactBytes: artifactBytes.byteLength,
        proof: `hmac-sha256:${"a".repeat(64)}`,
      },
      sourceArtifact: {
        hash: artifactHash,
        bytes: artifactBytes.byteLength,
        bytesBase64: artifactBytes.toString("base64"),
      },
    },
    compiled_artifact: null,
    locked_at: options.locked === false ? null : "2026-07-17T00:00:00.000Z",
    created_at: "2026-07-16T00:00:00.000Z",
  }
}

describe("frozen pre-v1.19 Strategy Revision inventory", () => {
  it("sorts and binds every persisted pre-v1.19 revision without exposing source or artifact bytes", () => {
    const inventory = freezePreV119StrategyRevisionInventory([
      row("revision:b", { locked: false }),
      row("revision:a"),
    ])

    expect(inventory.count).toBe(2)
    expect(inventory.rows.map((entry) => entry.strategyRevisionId)).toEqual([
      "revision:a",
      "revision:b",
    ])
    expect(inventory.rows[0]).toMatchObject({
      immutable: true,
      languageId: "typescript",
      providerId: "strategy-language-provider-js-ts",
      laneId: "lane:typescript:v1.19",
    })
    expect(inventory.rows[1]).toMatchObject({ immutable: false })
    expect(inventory.rootSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    const serialized = JSON.stringify(inventory)
    expect(serialized).not.toContain(source)
    expect(serialized).not.toContain(artifactBytesBase64())
  })

  it("changes the frozen root for source, lock, artifact, language, or row drift", () => {
    const original = freezePreV119StrategyRevisionInventory([row("revision:a")])
    const mutations = [
      row("revision:a", { sourceText: `${source}\n` }),
      row("revision:a", { locked: false }),
      { ...row("revision:a"), id: "revision:sibling" },
      {
        ...row("revision:a"),
        runtime: {
          abiVersion: "strategy-runtime-abi-v1.17",
          language: { id: "python", version: "3.13" },
        },
        metadata: {
          ...row("revision:a").metadata,
          providerValidation: {
            ...(
              row("revision:a").metadata as {
                providerValidation: Record<string, unknown>
              }
            ).providerValidation,
            providerId: "strategy-language-provider-python",
          },
        },
      },
    ]
    for (const mutation of mutations) {
      expect(
        freezePreV119StrategyRevisionInventory([mutation]).rootSha256,
      ).not.toBe(original.rootSha256)
    }
  })
})

describe("revision-specific candidate execution and disposition", () => {
  it("executes all six v1.19 observations in a real guest worker", () => {
    const inventory = freezePreV119StrategyRevisionInventory([
      row("revision:real"),
    ])
    const result = executeTypeScriptRevisionCandidateV119(
      inventory.rows[0]!,
      row("revision:real"),
    )

    expect(result.kind).toBe("success")
    if (result.kind !== "success") throw new Error("expected success")
    expect(result.receipt).toMatchObject({
      strategyRevisionId: "revision:real",
      probeCount: 6,
      executionKind: "real_service_execution",
      syntheticEvidence: false,
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    })
  })

  it("records unlocked and unsupported rows as explicit non-counted dispositions", async () => {
    const rows = [
      row("revision:locked"),
      row("revision:unlocked", { locked: false }),
      {
        ...row("revision:unsupported"),
        runtime: {
          abiVersion: "strategy-runtime-abi-v1.17",
          language: { id: "python", version: "3.13" },
        },
        metadata: {
          ...row("revision:unsupported").metadata,
          providerValidation: {
            ...(
              row("revision:unsupported").metadata as {
                providerValidation: Record<string, unknown>
              }
            ).providerValidation,
            providerId: "strategy-language-provider-python",
          },
        },
      },
    ]
    const append = vi.fn(async () => undefined)
    const artifactValue = await buildRevisionRevalidationArtifactV119({
      databaseRows: rows,
      appendSuccess: append,
    })

    expect(artifactValue.inventory.count).toBe(3)
    expect(artifactValue.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          strategyRevisionId: "revision:locked",
          outcome: "revalidated",
        }),
        expect.objectContaining({
          strategyRevisionId: "revision:unlocked",
          outcome: "non_counted",
          dispositionCode: "REVISION_NOT_IMMUTABLE",
        }),
        expect.objectContaining({
          strategyRevisionId: "revision:unsupported",
          outcome: "non_counted",
          dispositionCode: "REAL_CANDIDATE_LANE_UNAVAILABLE",
        }),
      ]),
    )
    expect(append).toHaveBeenCalledTimes(1)
    expect(
      new Set(artifactValue.records.map((entry) => entry.strategyRevisionId))
        .size,
    ).toBe(3)
    expect(JSON.stringify(artifactValue)).not.toContain("bytesBase64")
  })

  it("rejects copied sibling receipts instead of inferring compatibility", async () => {
    const copiedRoot = sha256("copied")
    await expect(
      buildRevisionRevalidationArtifactV119({
        databaseRows: [row("revision:a"), row("revision:b")],
        executeRevision: (_inventoryRow) => ({
          kind: "success",
          receipt: {
            strategyRevisionId: "revision:a",
            executionReceiptRoot: copiedRoot,
          },
        }),
        appendSuccess: async () => undefined,
      }),
    ).rejects.toThrow(/revision-specific|sibling|receipt/iu)
  })
})

const artifactBytesBase64 = (): string =>
  Buffer.from(artifact, "utf8").toString("base64")
