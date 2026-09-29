import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../../packages/strategy-lab/src/factory/identity.js"
import { DIAGNOSTIC_ONE_CELL_STORE, createDiagnosticOneCellAllocation, createDiagnosticOneCellCell, createDiagnosticOneCellStart, createDiagnosticOneCellLifetimeGrant, diagnosticOneCellContainerIdentity, openDiagnosticOneCellLedger } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { admitFactorySupervisorLifetime, createFactorySupervisedRuntime } from "./v1-38-factory-supervised-runtime.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const originalCwd = process.cwd()
const temporaryRoots: string[] = []
afterEach(() => { process.chdir(originalCwd); for (const path of temporaryRoots.splice(0)) rmSync(path, { recursive: true, force: true }); vi.restoreAllMocks() })
const validOneCellGrant = () => {
  const path = realpathSync(mkdtempSync(join(tmpdir(), "one-cell-lifetime-test-")))
  temporaryRoots.push(path); mkdirSync(join(path, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(path, DIAGNOSTIC_ONE_CELL_STORE), { mode: 0o700 }); process.chdir(path)
  const oldEvidenceBaseline = { oldAllocationV2: root("1"), oldAllocationUnversioned: root("2"), oldResult: root("3"), oldLeagueTree: root("4"), oldFactoryTree: root("5") }
  const allocation = createDiagnosticOneCellAllocation({ sourceClosureRoot: root("6"), implementationRoot: root("7"), gateRoot: root("8"), oldEvidenceBaseline })
  const cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
  ledger.writeStart(start)
  const binding = diagnosticOneCellContainerIdentity(allocation, cell, "bottom")
  const grant = createDiagnosticOneCellLifetimeGrant(ledger, allocation, cell, start, "bottom")
  return { allocation, cell, start, grant, binding }
}
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
  it("never treats an unissued v3 object as 240-second authority", () => {
    expect(() => admitFactorySupervisorLifetime({ factoryLifetimeMs: 240_000, budgetRoot: root("5"), attemptRoot: root("4"), containerName: "fake", ownershipLabel: "fake", oneCellLifetimeGrant: { schemaVersion: "diagnostic-one-cell-lifetime-grant-v3", cellRoot: root("6") } as never })).toThrow()
    expect(() => admitFactorySupervisorLifetime({ factoryLifetimeMs: 240_000, budgetRoot: root("5"), attemptRoot: root("4"), containerName: "fake", ownershipLabel: "fake" })).toThrow()
    expect(admitFactorySupervisorLifetime({ factoryLifetimeMs: 120_000, budgetRoot: root("5"), attemptRoot: root("4"), containerName: "ordinary", ownershipLabel: "ordinary" })).toBe(120_000)
  })
  it("admits only the issued v3 charge-bound 240-second grant", () => {
    const { allocation, start, grant, binding } = validOneCellGrant()
    expect(admitFactorySupervisorLifetime({ factoryLifetimeMs: 240_000, budgetRoot: allocation.root, attemptRoot: start.root, ...binding, oneCellLifetimeGrant: grant })).toBe(240_000)
    expect(() => admitFactorySupervisorLifetime({ factoryLifetimeMs: 240_000, budgetRoot: root("9"), attemptRoot: start.root, ...binding, oneCellLifetimeGrant: grant })).toThrow()
  })
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
