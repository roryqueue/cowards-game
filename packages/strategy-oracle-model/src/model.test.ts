import { createHash } from "node:crypto"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import { describe, expect, it } from "vitest"
import {
  admitFrozenModelBundle,
  assessFrozenModelIdentity,
  emitModelFactoryPacket,
} from "./index.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}` as const
const source = `export default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain(input) { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }; } };`
const sourceRoot = root(source)
const bundleInput = () => ({
  schemaVersion: "frozen-model-bundle-v1",
  privacy: "private_offline",
  root: root("placeholder"),
  provider: { providerId: "frozen-provider", modelId: "frozen-model", modelVersion: "2026-09", settingsRoot: root("settings"), promptRoot: root("prompt"), contextRoot: root("context") },
  request: { root: root("request"), byteLength: 101, encoding: "utf8" },
  response: { root: root("response"), format: "explicit-typescript-source", source },
  source: { root: sourceRoot, sha256: sourceRoot, byteLength: new TextEncoder().encode(source).byteLength, encoding: "utf8" },
  accounting: { inputTokens: 12, outputTokens: 34, tokenLimit: 128, elapsedMilliseconds: 55, resourceRoot: root("resources") },
  attempt: { attemptRoot: root("attempt"), budgetRoot: root("budget"), ordinal: 0 },
  nativeLane: { language: "typescript", providerId: "frozen-provider", runtimeAbi: "strategy-runtime-abi-v1.19", runtimeProfileRoot: root("runtime-profile"), translation: "none" },
  lineage: { predecessorRoot: root("parent"), correctionRoot: null, retryParentRoot: null },
})

const factoryRequest = () => ({ split: "development" as const, doctrineFamily: "frozen-synthesis", build: { buildRoot: root("build"), toolchainRoot: root("toolchain") }, lineage: { predecessorRoot: root("parent"), correctionRoot: null, retryParentRoot: null } })

describe("frozen model oracle", () => {
  it("admits complete canonical frozen provenance without any producer invocation", () => {
    const bundle = admitFrozenModelBundle(bundleInput())
    expect(bundle.root).toMatch(/^sha256:/)
    expect(Object.isFrozen(bundle)).toBe(true)
    expect(admitFrozenModelBundle(bundleInput()).root).toBe(bundle.root)
  })

  it("fails closed for missing accounting and retains charged unavailable or drifted identities", () => {
    const missing = bundleInput() as Record<string, unknown>
    delete missing.accounting
    expect(() => admitFrozenModelBundle(missing)).toThrow("MODEL_BUNDLE")
    const bundle = admitFrozenModelBundle(bundleInput())
    const expected = { ...bundle.provider, modelVersion: "other-version" }
    const drift = assessFrozenModelIdentity(bundle, expected)
    const unavailable = assessFrozenModelIdentity(null, bundle.provider, { attemptRoot: bundle.attempt.attemptRoot, budgetRoot: bundle.attempt.budgetRoot, ordinal: 1 })
    expect(drift).toMatchObject({ kind: "blocked", charged: true, reason: "identity_drift" })
    expect(unavailable).toMatchObject({ kind: "blocked", charged: true, reason: "provider_unavailable" })
    expect(drift.root).not.toBe(unavailable.root)
  })

  it("exports the exact data-only packet emitter with source and provenance roots", () => {
    expect(typeof emitModelFactoryPacket).toBe("function")
    const bundle = admitFrozenModelBundle(bundleInput())
    const packet = emitModelFactoryPacket(bundle, factoryRequest())
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(packet.source.root).toBe(sourceRoot)
    expect(packet.provider).toEqual(bundle.provider)
  })
})
