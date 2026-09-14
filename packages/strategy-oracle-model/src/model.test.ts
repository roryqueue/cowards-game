import { createHash } from "node:crypto"
import { FactoryOraclePacketSchema } from "../../strategy-lab/src/factory/index.js"
import { LAB_ADMITTED_ROOTS } from "../../strategy-lab/src/contracts.js"
import { describe, expect, it } from "vitest"
import {
  admitFrozenModelBundle,
  assessFrozenModelIdentity,
  assertModelSourceClosure,
  deriveFrozenModelBundleRoot,
  deriveFrozenModelRawResponseRecordRoot,
  deriveFrozenModelRequestRecordRoot,
  deriveFrozenModelResponseRoot,
  getIssuedModelFactoryPacketProvenance,
  emitModelFactoryPacket,
  requireIssuedModelFactoryPacketProvenance,
} from "./index.js"
import { decodeFrozenModelRawResponse } from "./bundle.js"

const root = (value: string) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}` as const
const source = `export default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain(input) { return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }; } };`
const sourceRoot = root(source)
const v2Records = (sourceValue = source, userEcho = false, echoText = "author disclosed packet", duplicateEcho = false) => {
  const requestValue = { byteLength: new TextEncoder().encode(echoText).byteLength, encoding: "utf8" as const, bodyUtf8: echoText }
  const rawResponseValue = { format: "codex-exec-json" as const, bodyUtf8: [
    { jsonrpc: "2.0", id: 2, result: { data: [{ id: "frozen-model", model: "frozen-model" }], nextCursor: null } },
    { jsonrpc: "2.0", id: 3, result: { thread: { id: "thread-1" }, model: "frozen-model", modelProvider: "frozen-provider", cwd: "/disclosed", sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "never", instructionSources: [] } },
    { jsonrpc: "2.0", id: 4, result: { turn: { id: "turn-1" } } },
    ...(userEcho ? [
      { jsonrpc: "2.0", method: "item/started", params: { threadId: "thread-1", turnId: "turn-1", item: { id: "user-1", type: "userMessage", content: [{ type: "text", text: echoText }] } } },
      { jsonrpc: "2.0", method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", item: { id: "user-1", type: "userMessage", content: [{ type: "text", text: echoText }] } } },
      ...(duplicateEcho ? [{ jsonrpc: "2.0", method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", item: { id: "user-2", type: "userMessage", content: [{ type: "text", text: echoText }] } } }] : []),
    ] : []),
    { jsonrpc: "2.0", method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", item: { id: "item-1", type: "agentMessage", text: JSON.stringify({ source: sourceValue }) } } },
    { jsonrpc: "2.0", method: "thread/tokenUsage/updated", params: { threadId: "thread-1", turnId: "turn-1", tokenUsage: { total: { inputTokens: 12, cachedInputTokens: 0, outputTokens: 34, reasoningOutputTokens: 2, totalTokens: 46 }, last: { inputTokens: 12, cachedInputTokens: 0, outputTokens: 34, reasoningOutputTokens: 2, totalTokens: 46 } } } },
    { jsonrpc: "2.0", method: "turn/completed", params: { threadId: "thread-1", turn: { id: "turn-1", status: "completed" } } },
  ].map((event) => JSON.stringify(event)).join("\n") + "\n" }
  return {
    requestRecord: { ...requestValue, root: deriveFrozenModelRequestRecordRoot(requestValue) },
    rawResponseRecord: { ...rawResponseValue, root: deriveFrozenModelRawResponseRecordRoot(rawResponseValue) },
  }
}
const bundleInput = () => {
  const response = { root: root("unused-response-root"), format: "explicit-typescript-source" as const, source }
  const value = {
    schemaVersion: "frozen-model-bundle-v1" as const,
    privacy: "private_offline" as const,
    root: root("unused-bundle-root"),
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
  it("accepts an exact user-message echo lifecycle and rejects substitutions", () => {
    const retained = v2Records(source, true), prompt = "author disclosed packet"
    expect(decodeFrozenModelRawResponse(retained.rawResponseRecord.bodyUtf8, prompt).source).toBe(source)
    const substituted = retained.rawResponseRecord.bodyUtf8.replace(prompt, "different prompt")
    expect(() => decodeFrozenModelRawResponse(substituted, prompt)).toThrow("MODEL_RAW_RESPONSE")
    expect(() => decodeFrozenModelRawResponse(v2Records(source, true, prompt, true).rawResponseRecord.bodyUtf8, prompt)).toThrow("MODEL_RAW_RESPONSE")
  })
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

  it("requires a truthful v2 request/response/usage companion and an explicitly unavailable serving snapshot", () => {
    const v1 = bundleInput()
    const retained = v2Records()
    const value = {
      ...v1,
      schemaVersion: "frozen-model-bundle-v2" as const,
      provider: { ...v1.provider, modelVersion: null, servingSnapshot: { availability: "unavailable" as const } },
      request: { ...v1.request, root: retained.requestRecord.root, byteLength: retained.requestRecord.byteLength },
      provenance: {
        requestedModelId: v1.provider.modelId, reportedModelId: v1.provider.modelId,
        client: { version: "codex-cli-test", settingsRoot: v1.provider.settingsRoot },
        servingSnapshot: { availability: "unavailable" as const },
        requestRecordRoot: retained.requestRecord.root, responseRecordRoot: retained.rawResponseRecord.root,
        requestRecord: retained.requestRecord, rawResponseRecord: retained.rawResponseRecord,
        actualUsage: { inputTokens: v1.accounting.inputTokens, outputTokens: v1.accounting.outputTokens, cachedInputTokens: 0, totalTokens: v1.accounting.inputTokens + v1.accounting.outputTokens },
      },
    }
    const admitted = admitFrozenModelBundle({ ...value, root: deriveFrozenModelBundleRoot(value) })
    expect(admitted.schemaVersion).toBe("frozen-model-bundle-v2")
    expect(() => admitFrozenModelBundle({ ...value, provenance: { ...value.provenance, servingSnapshot: { availability: "available" } }, root: deriveFrozenModelBundleRoot({ ...value, provenance: { ...value.provenance, servingSnapshot: { availability: "available" } } }) })).toThrow("MODEL_PROVENANCE")
    expect(() => admitFrozenModelBundle({ ...value, provider: { ...value.provider, modelVersion: "server-build-42" }, root: deriveFrozenModelBundleRoot({ ...value, provider: { ...value.provider, modelVersion: "server-build-42" } }) })).toThrow("MODEL_PROVENANCE")
    expect(() => admitFrozenModelBundle({ ...value, provenance: { ...value.provenance, requestRecord: { ...value.provenance.requestRecord, bodyUtf8: "changed" } }, root: deriveFrozenModelBundleRoot({ ...value, provenance: { ...value.provenance, requestRecord: { ...value.provenance.requestRecord, bodyUtf8: "changed" } } }) })).toThrow("MODEL_PROVENANCE")
    expect(() => admitFrozenModelBundle({ ...value, provenance: { ...value.provenance, rawResponseRecord: { ...value.provenance.rawResponseRecord, bodyUtf8: "{\"changed\":true}" } }, root: deriveFrozenModelBundleRoot({ ...value, provenance: { ...value.provenance, rawResponseRecord: { ...value.provenance.rawResponseRecord, bodyUtf8: "{\"changed\":true}" } } }) })).toThrow("MODEL_RAW_RESPONSE")

    const substituted = v2Records(`${source}\n`)
    const changedSource = `${source}\n`
    const changedResponse = { format: "explicit-typescript-source" as const, source: changedSource }
    const coherentSubstitution = {
      ...value,
      response: { ...changedResponse, root: deriveFrozenModelResponseRoot(changedResponse) },
      source: { root: root(changedSource), sha256: root(changedSource), byteLength: new TextEncoder().encode(changedSource).byteLength, encoding: "utf8" as const },
      provenance: { ...value.provenance, responseRecordRoot: substituted.rawResponseRecord.root, rawResponseRecord: substituted.rawResponseRecord },
    }
    expect(() => admitFrozenModelBundle({ ...coherentSubstitution, response: value.response, source: value.source, root: deriveFrozenModelBundleRoot({ ...coherentSubstitution, response: value.response, source: value.source }) })).toThrow("MODEL_PROVENANCE")

    const usageLines = retained.rawResponseRecord.bodyUtf8.replace('"inputTokens":12', '"inputTokens":13').replace('"totalTokens":46', '"totalTokens":47')
    const changedRawValue = { format: "codex-exec-json" as const, bodyUtf8: usageLines }
    const changedRaw = { ...changedRawValue, root: deriveFrozenModelRawResponseRecordRoot(changedRawValue) }
    const coherentUsageSubstitution = { ...value, provenance: { ...value.provenance, responseRecordRoot: changedRaw.root, rawResponseRecord: changedRaw } }
    expect(() => admitFrozenModelBundle({ ...coherentUsageSubstitution, root: deriveFrozenModelBundleRoot(coherentUsageSubstitution) })).toThrow("MODEL_PROVENANCE")

    const providerLines = retained.rawResponseRecord.bodyUtf8.replace('"modelProvider":"frozen-provider"', '"modelProvider":"substituted-provider"')
    const providerRawValue = { format: "codex-exec-json" as const, bodyUtf8: providerLines }
    const providerRaw = { ...providerRawValue, root: deriveFrozenModelRawResponseRecordRoot(providerRawValue) }
    const coherentProviderSubstitution = { ...value, provenance: { ...value.provenance, responseRecordRoot: providerRaw.root, rawResponseRecord: providerRaw } }
    expect(() => admitFrozenModelBundle({ ...coherentProviderSubstitution, root: deriveFrozenModelBundleRoot(coherentProviderSubstitution) })).toThrow("MODEL_PROVENANCE")
  })

  it("treats separately constructed equal v2 identities as equal and primitive changes as drift", () => {
    const v1 = bundleInput(), retained = v2Records()
    const value = { ...v1, schemaVersion: "frozen-model-bundle-v2" as const, provider: { ...v1.provider, modelVersion: null, servingSnapshot: { availability: "unavailable" as const } }, request: { ...v1.request, root: retained.requestRecord.root, byteLength: retained.requestRecord.byteLength }, provenance: { requestedModelId: v1.provider.modelId, reportedModelId: v1.provider.modelId, client: { version: "codex-cli-test", settingsRoot: v1.provider.settingsRoot }, servingSnapshot: { availability: "unavailable" as const }, requestRecordRoot: retained.requestRecord.root, responseRecordRoot: retained.rawResponseRecord.root, requestRecord: retained.requestRecord, rawResponseRecord: retained.rawResponseRecord, actualUsage: { inputTokens: 12, outputTokens: 34, cachedInputTokens: 0, totalTokens: 46 } } }
    const bundle = admitFrozenModelBundle({ ...value, root: deriveFrozenModelBundleRoot(value) })
    const equal = structuredClone(bundle.provider)
    expect(assessFrozenModelIdentity(bundle, equal)).toMatchObject({ kind: "available" })
    expect(assessFrozenModelIdentity(bundle, { ...equal, modelId: "different-model" })).toMatchObject({ kind: "blocked", reason: "identity_drift", charged: true })
  })

  it("rejects a failed admitted turn even when valid source, usage, and completion follow", () => {
    const v1 = bundleInput(), retained = v2Records()
    const failedBody = retained.rawResponseRecord.bodyUtf8.replace(
      '{"jsonrpc":"2.0","method":"item/completed"',
      '{"jsonrpc":"2.0","method":"turn/failed","params":{"turnId":"other-turn","turn":{"id":"other-turn","status":"failed"}}}\n{"jsonrpc":"2.0","method":"item/completed"',
    )
    const rawValue = { format: "codex-exec-json" as const, bodyUtf8: failedBody }
    const raw = { ...rawValue, root: deriveFrozenModelRawResponseRecordRoot(rawValue) }
    const value = { ...v1, schemaVersion: "frozen-model-bundle-v2" as const, provider: { ...v1.provider, modelVersion: null, servingSnapshot: { availability: "unavailable" as const } }, request: { ...v1.request, root: retained.requestRecord.root, byteLength: retained.requestRecord.byteLength }, provenance: { requestedModelId: v1.provider.modelId, reportedModelId: v1.provider.modelId, client: { version: "codex-cli-test", settingsRoot: v1.provider.settingsRoot }, servingSnapshot: { availability: "unavailable" as const }, requestRecordRoot: retained.requestRecord.root, responseRecordRoot: raw.root, requestRecord: retained.requestRecord, rawResponseRecord: raw, actualUsage: { inputTokens: 12, outputTokens: 34, cachedInputTokens: 0, totalTokens: 46 } } }
    expect(() => admitFrozenModelBundle({ ...value, root: deriveFrozenModelBundleRoot(value) })).toThrow("MODEL_RAW_RESPONSE_TURN_FAILURE")
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

  it("retains an issued full frozen-bundle companion and rejects clones or lineage overrides", () => {
    const bundle = admitFrozenModelBundle(bundleInput())
    const packet = emitModelFactoryPacket(bundle, factoryRequest())
    const provenance = getIssuedModelFactoryPacketProvenance(packet)
    expect(provenance.bundle).toBe(bundle)
    expect(provenance.bundleRoot).toBe(bundle.root)
    expect(provenance.packetRoot).toBe(packet.root)
    expect(requireIssuedModelFactoryPacketProvenance(packet, provenance)).toBe(provenance)
    expect(() => requireIssuedModelFactoryPacketProvenance(packet, structuredClone(provenance))).toThrow("MODEL_UNISSUED_PROVENANCE")
    expect(() => getIssuedModelFactoryPacketProvenance({ ...packet })).toThrow("MODEL_UNISSUED_PACKET")
    const request = factoryRequest()
    expect(() => emitModelFactoryPacket(bundle, { ...request, lineage: { ...request.lineage, correctionRoot: root("lineage-override") } }))
      .toThrow("MODEL_LINEAGE")
  })

  it("changes the provenance companion root when retained frozen request, response, accounting, or attempt changes", () => {
    const baseline = admitFrozenModelBundle(bundleInput())
    const baselineRoot = getIssuedModelFactoryPacketProvenance(emitModelFactoryPacket(baseline, factoryRequest())).root
    const requestInput = bundleInput()
    const changedRequest = { ...requestInput, request: { ...requestInput.request, byteLength: requestInput.request.byteLength + 1 } }
    const accountingInput = bundleInput()
    const changedAccounting = { ...accountingInput, accounting: { ...accountingInput.accounting, inputTokens: accountingInput.accounting.inputTokens + 1 } }
    const attemptInput = bundleInput()
    const changedAttempt = { ...attemptInput, attempt: { ...attemptInput.attempt, ordinal: attemptInput.attempt.ordinal + 1 } }
    const responseInput = bundleInput(), changedSource = `${source}\n`
    const response = { format: "explicit-typescript-source" as const, source: changedSource }
    const changedResponse = {
      ...responseInput,
      response: { ...response, root: deriveFrozenModelResponseRoot(response) },
      source: { root: root(changedSource), sha256: root(changedSource), byteLength: new TextEncoder().encode(changedSource).byteLength, encoding: "utf8" as const },
    }
    for (const changed of [changedRequest, changedAccounting, changedAttempt, changedResponse]) {
      const bundle = admitFrozenModelBundle({ ...changed, root: deriveFrozenModelBundleRoot(changed) })
      const companion = getIssuedModelFactoryPacketProvenance(emitModelFactoryPacket(bundle, factoryRequest()))
      expect(companion.root).not.toBe(baselineRoot)
    }
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
