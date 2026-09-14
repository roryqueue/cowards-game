import { createHash } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../../packages/strategy-lab/src/factory/identity.js"
import { createFactorySupervisedRuntime } from "./v1-38-factory-supervised-runtime.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const sourceBytes = new TextEncoder().encode("export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}")
const sourceRoot = `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}` as LabRoot
const admitted = () => {
  const fixture = factoryOraclePacketFixture()
  const value = { ...fixture, source: { root: sourceRoot, sha256: sourceRoot, byteLength: sourceBytes.byteLength, encoding: "utf8" as const } }
  const packet = { ...value, root: deriveFactoryOraclePacketRoot(value) }
  const proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  return { packet, proposal, validation, admission: authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes }), validation }) }
}

describe("selected factory supervised runtime adapter", () => {
  it("builds the exact authored TypeScript revision and wraps selected adapter identity", () => {
    const { admission } = admitted()
    const createRuntime = vi.fn((options: any) => ({ identity: { revisionId: options.revision.id, sourceRoot, executableRoot: root("1"), tupleId: "tuple", tupleRoot: root("2"), image: options.image, harnessRoot: root("3"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot }, invoke() { throw new Error("not invoked") }, verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } } }))
    const runtime = createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), createRuntime })
    expect(createRuntime).toHaveBeenCalledOnce()
    expect(runtime.identity.nativeLane).toEqual(admission.nativeLane)
    expect(runtime.identity.factoryPacketRoot).toBe(admission.packetRoot)
    expect(createRuntime.mock.calls[0]![0].revision.runtime.adapter.id).toBe("runtime-js-container-subprocess")
  })

  it("blocks unsupported lanes and identity drift before creating a runtime", () => {
    const { admission } = admitted(), createRuntime = vi.fn()
    expect(() => createFactorySupervisedRuntime({ admission: { ...admission, nativeLane: { ...admission.nativeLane, language: "python" } } as never, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), createRuntime })).toThrow("FACTORY_RUNTIME_UNSUPPORTED_NATIVE_LANE")
    expect(createRuntime).not.toHaveBeenCalled()
    const close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false }))
    const drifted = vi.fn((options: any) => ({ identity: { revisionId: options.revision.id, sourceRoot: root("9"), executableRoot: root("1"), tupleId: "tuple", tupleRoot: root("2"), image: options.image, harnessRoot: root("3"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot }, invoke() { throw new Error("not invoked") }, verify() { return true }, close }))
    expect(() => createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), createRuntime: drifted })).toThrow("FACTORY_RUNTIME_SELECTED_IDENTITY")
    expect(close).toHaveBeenCalledOnce()
    expect(() => createFactorySupervisedRuntime({ admission, sourceBytes: new TextEncoder().encode("drift"), attemptRoot: root("4"), budgetRoot: root("5"), createRuntime })).toThrow("FACTORY_RUNTIME_SOURCE_BINDING")
    for (const forbidden of [{ benchmarkLifetimeMs: 1 }, { observerHarness: {} }, { transport: () => ({}) }, { streamFactory: () => ({}) }]) {
      expect(() => createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), createRuntime, ...forbidden } as never)).toThrow("FACTORY_RUNTIME_UNSUPPORTED_OPTION")
    }
  })

  it("closes the selected runtime on wrapper identity failures and returns cleanup proof", () => {
    const { admission } = admitted(), close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false }))
    const baseIdentity = { revisionId: "revision", sourceRoot, executableRoot: root("1"), tupleId: "tuple", tupleRoot: root("2"), image: "image", harnessRoot: root("3"), budgetRoot: root("5"), attemptRoot: root("4"), runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot }
    const creator = vi.fn(() => ({ identity: baseIdentity, invoke() { return { identity: { ...baseIdentity, sourceRoot: root("9") } } as never }, verify() { return true }, close }))
    const runtime = createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), image: "image", createRuntime: creator })
    expect(() => runtime.invoke({} as never, { ...runtime.identity, sourceRoot: root("8") })).toThrow("FACTORY_RUNTIME_REQUEST_IDENTITY")
    expect(close).toHaveBeenCalledOnce()
    const runtime2 = createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), image: "image", createRuntime: creator })
    expect(() => runtime2.invoke({} as never, runtime2.identity)).toThrow("FACTORY_RUNTIME_EVIDENCE_IDENTITY")
    expect(close).toHaveBeenCalledTimes(2)
    expect(runtime2.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
  })

  it("enforces the factory allocation lifetime without using benchmark authority", () => {
    const { admission } = admitted(), close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false })), invoke = vi.fn()
    let now = 0
    vi.spyOn(performance, "now").mockImplementation(() => now)
    const creator = vi.fn((options: any) => ({
      identity: { revisionId: options.revision.id, sourceRoot, executableRoot: root("1"), tupleId: "tuple", tupleRoot: root("2"), image: options.image, harnessRoot: root("3"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot },
      invoke, verify() { return true }, close,
    }))
    const runtime = createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), factoryLifetimeMs: 1, createRuntime: creator })
    now = 1
    expect(() => runtime.invoke({} as never, runtime.identity)).toThrow("FACTORY_RUNTIME_LIFETIME_EXHAUSTED")
    expect(invoke).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledOnce()
  })
})
