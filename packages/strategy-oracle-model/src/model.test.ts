import { createHash } from "node:crypto"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import { LAB_ADMITTED_ROOTS } from "../../strategy-lab/src/contracts.js"
import { describe, expect, it } from "vitest"
import {
  admitFrozenModelBundle,
  assessFrozenModelIdentity,
  assertModelSourceClosure,
  deriveFrozenModelBundleRoot,
  deriveFrozenModelResponseRoot,
  emitModelFactoryPacket,
} from "./index.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}` as const
const source = `export default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain(input) { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }; } };`
const sourceRoot = root(source)
const bundleInput = () => {
  const response = { root: root("placeholder"), format: "explicit-typescript-source" as const, source }
  const value = {
    schemaVersion: "frozen-model-bundle-v1" as const,
    privacy: "private_offline" as const,
    root: root("placeholder"),
    provider: { providerId: "frozen-provider", modelId: "frozen-model", modelVersion: "2026-09", settingsRoot: root("settings"), promptRoot: root("prompt"), contextRoot: root("context") },
    request: { root: root("request"), byteLength: 101, encoding: "utf8" as const },
    response: { ...response, root: deriveFrozenModelResponseRoot(response) },
    source: { root: sourceRoot, sha256: sourceRoot, byteLength: new TextEncoder().encode(source).byteLength, encoding: "utf8" as const },
    accounting: { inputTokens: 12, outputTokens: 34, tokenLimit: 128, elapsedMilliseconds: 55, resourceRoot: root("resources") },
    attempt: { attemptRoot: root("attempt"), budgetRoot: root("budget"), ordinal: 0 },
    nativeLane: { language: "typescript" as const, providerId: "frozen-provider", runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const },
    lineage: { predecessorRoot: root("parent"), correctionRoot: null, retryParentRoot: null },
  }
  return { ...value, root: deriveFrozenModelBundleRoot(value) }
}

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
    if (drift.kind !== "blocked" || unavailable.kind !== "blocked") throw new Error("expected blocked fixture result")
    expect(drift.root).not.toBe(unavailable.root)
  })

  it("rejects unknown or malformed provenance fields before root conversion", () => {
    const unknown = { ...bundleInput(), extra: true }
    const negativeAccounting = { ...bundleInput(), accounting: { ...bundleInput().accounting, inputTokens: -1 } }
    const mismatchedResponse = { ...bundleInput(), response: { ...bundleInput().response, root: root("wrong-response") } }
    const mismatchedSource = { ...bundleInput(), source: { ...bundleInput().source, root: root("wrong-source") } }
    expect(() => admitFrozenModelBundle(unknown)).toThrow("MODEL_BUNDLE")
    expect(() => admitFrozenModelBundle(negativeAccounting)).toThrow("MODEL_ACCOUNTING")
    expect(() => admitFrozenModelBundle(mismatchedResponse)).toThrow("MODEL_RESPONSE")
    expect(() => admitFrozenModelBundle(mismatchedSource)).toThrow("MODEL_SOURCE")
  })

  it("exports the exact data-only packet emitter with source and provenance roots", () => {
    expect(typeof emitModelFactoryPacket).toBe("function")
    const bundle = admitFrozenModelBundle(bundleInput())
    const packet = emitModelFactoryPacket(bundle, factoryRequest())
    expect(FactoryOraclePacketSchema.parse(packet)).toEqual(packet)
    expect(packet.source.root).toBe(sourceRoot)
    expect(packet.provider).toEqual(bundle.provider)
  })

  it("rejects structural clones and source with an unbound capability or wrong export shape", () => {
    const bundle = admitFrozenModelBundle(bundleInput())
    expect(() => emitModelFactoryPacket({ ...bundle }, factoryRequest())).toThrow("MODEL_UNADMITTED_BUNDLE")
    expect(() => assertModelSourceClosure(source.replace("return { activationOrders", "const retained = outside; return { activationOrders")))
      .toThrow("MODEL_SOURCE_FREE_IDENTIFIER")
    expect(() => assertModelSourceClosure(source.replace("export default", "export const candidate =")))
      .toThrow("MODEL_SOURCE_DEFAULT_EXPORT")
    expect(() => assertModelSourceClosure("export default { selectActivations: 1, soldierBrain(input) { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: {} }; } };"))
      .toThrow("MODEL_SOURCE_METHODS")
    expect(() => assertModelSourceClosure(source.replace("return { activationOrders", "Object[\"con\" + \"structor\"]; return { activationOrders")))
      .toThrow("MODEL_SOURCE_CAPABILITY")
    expect(() => assertModelSourceClosure(source.replace("return { activationOrders", "const key = \"constructor\"; const objectAlias = Object; objectAlias[key]; return { activationOrders")))
      .toThrow("MODEL_SOURCE_CAPABILITY")
  })
})
