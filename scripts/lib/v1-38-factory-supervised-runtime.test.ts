import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../../packages/strategy-lab/src/factory/identity.js"
import { DIAGNOSTIC_ONE_CELL_STORE, createDiagnosticOneCellAllocation, createDiagnosticOneCellCell, createDiagnosticOneCellStart, createDiagnosticOneCellLifetimeGrant, diagnosticOneCellContainerIdentity, openDiagnosticOneCellLedger } from "../../packages/strategy-lab/src/league/diagnostic-one-cell.js"
import { admitFactorySupervisorLifetime, createFactorySupervisedRuntime } from "./v1-38-factory-supervised-runtime.js"
import { admitPlannerSupervisorLifetime, createPlannerSupervisedRuntime } from "./v1-38-planner-supervised-runtime.js"
import { createDiagnosticRetryV4Allocation, createDiagnosticRetryV4Cell, createDiagnosticRetryV4Start, openDiagnosticRetryV4Ledger } from "./v1-38-diagnostic-retry-v4.js"
import { issueDiagnosticRetryV4ProviderFromFactoryCandidate, closeDiagnosticRetryV4IssuedProvider } from "./v1-38-diagnostic-retry-v4-bridge.js"
// Only module-level unit injection; no caller constructor override is supplied
// to v4 and no guest/container or real assessment operation is performed.
vi.mock("./v1-38-planner-supervised-runtime.js", async (original) => ({ ...await original<typeof import("./v1-38-planner-supervised-runtime.js")>(), createPlannerSupervisedRuntime: vi.fn(() => { throw Error("unit container construction forbidden") }) }))
vi.mock("../../packages/strategy-lab/src/league/connected-runner.js", () => ({ readCandidateClosure: (value: unknown) => value }))
vi.mock("../../packages/strategy-lab/src/league/diagnostic-pilot.js", async (original) => ({ ...await original<typeof import("../../packages/strategy-lab/src/league/diagnostic-pilot.js")>(), requireDiagnosticPilotAssessedCandidate: (value: unknown) => value }))

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
  it("rejects fabricated or mixed v4 construction grants before runtime creation", () => {
    const binding = { budgetRoot: root("1"), attemptRoot: root("2"), containerName: "fake", ownershipLabel: "fake" }
    expect(() => admitFactorySupervisorLifetime({ ...binding, factoryLifetimeMs: 240000, retryV4LifetimeGrant: {} as never })).toThrow()
    expect(() => admitFactorySupervisorLifetime({ ...binding, factoryLifetimeMs: 240001, retryV4LifetimeGrant: {} as never })).toThrow("LIFETIME")
    expect(() => admitFactorySupervisorLifetime({ ...binding, retryV4LifetimeGrant: {} as never, oneCellLifetimeGrant: {} as never })).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(() => createFactorySupervisedRuntime({ ...binding, admission: admitted().admission, sourceBytes, retryV4LifetimeGrant: {} as never, createRuntime: vi.fn() })).toThrow("RETRY_V4_CONSTRUCTOR_OVERRIDE")
  })
  it("never treats an unissued v3 object as 240-second authority", () => {
    expect(() => admitFactorySupervisorLifetime({ factoryLifetimeMs: 240_000, budgetRoot: root("5"), attemptRoot: root("4"), containerName: "fake", ownershipLabel: "fake", oneCellLifetimeGrant: { schemaVersion: "diagnostic-one-cell-lifetime-grant-v3", cellRoot: root("6") } as never })).toThrow()
    expect(() => admitFactorySupervisorLifetime({ factoryLifetimeMs: 240_000, budgetRoot: root("5"), attemptRoot: root("4"), containerName: "fake", ownershipLabel: "fake" })).toThrow()
    expect(admitFactorySupervisorLifetime({ factoryLifetimeMs: 120_000, budgetRoot: root("5"), attemptRoot: root("4"), containerName: "ordinary", ownershipLabel: "ordinary" })).toBe(120_000)
  })
  it("denies genuinely issued precharge v3 grants and their reuse before factory callbacks", () => {
    const { allocation, start, grant, binding } = validOneCellGrant()
    const options = { factoryLifetimeMs: 240_000, budgetRoot: allocation.root, attemptRoot: start.root, ...binding, oneCellLifetimeGrant: grant }
    const { admission } = admitted()
    const createRuntime = vi.fn()
    for (let attempt = 0; attempt < 2; attempt++) {
      expect(() => admitFactorySupervisorLifetime(options)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
      expect(() => createFactorySupervisedRuntime({ ...options, admission, sourceBytes, matchId: "retired-unit-only", createRuntime })).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    }
    expect(createRuntime).not.toHaveBeenCalled()
  })
  it.each(["pilotLifetimeGrant", "pilotLifetimeMs", "oneCellLifetimeGrant", "oneCellLifetimeMs"])("denies presence of retired %s before reading any source, lifetime or token", (key) => {
    const touched = vi.fn(() => { throw Error("must not read") }), createRuntime = vi.fn()
    for (const value of [undefined, null, {}, 240000]) {
      const options = Object.defineProperties({ [key]: value, createRuntime, retryV4LifetimeGrant: {} }, { admission: { get: touched }, sourceBytes: { get: touched }, factoryLifetimeMs: { get: touched } })
      expect(() => admitFactorySupervisorLifetime(options as never)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
      expect(() => createFactorySupervisedRuntime(options as never)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    }
    const inherited = Object.create({ [key]: undefined })
    expect(() => admitFactorySupervisorLifetime(inherited)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(() => createFactorySupervisedRuntime(inherited)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    const accessor = Object.defineProperty({}, key, { get: touched })
    expect(() => createFactorySupervisedRuntime(accessor as never)).toThrow("RETIRED_DIAGNOSTIC_LIFETIME")
    expect(touched).not.toHaveBeenCalled(); expect(createRuntime).not.toHaveBeenCalled()
  })
  it("preserves genuine single-use v4 240-second construction via the real factory wrapper", async () => {
    const path = realpathSync(mkdtempSync(join(tmpdir(), "retirement-v4-unit-")))
    temporaryRoots.push(path); process.chdir(path); mkdirSync(".strategy-lab", { mode: 0o700 })
    const oldEvidenceBaseline = { oldAllocationV2: root("1"), oldAllocationUnversioned: root("2"), oldResult: root("3"), oldLeagueTree: root("4"), oldFactoryTree: root("5") }
    const allocation = createDiagnosticRetryV4Allocation({ attemptOrdinal: 1, envelopeRoot: root("6"), sourceClosureRoot: root("7"), implementationRoot: root("8"), gateRoot: root("9"), oldEvidenceBaseline })
    mkdirSync(allocation.store, { mode: 0o700 })
    const cell = createDiagnosticRetryV4Cell(allocation, 0), start = createDiagnosticRetryV4Start(allocation, cell), ledger = openDiagnosticRetryV4Ledger(allocation.store)
    ledger.writeStart(start); ledger.writeRunAttempt(start)
    const { packet, proposal, validation } = admitted()
    const candidate = { root: cell.bottomCandidateRoot, supervisionReceiptRoot: root("a"), proposal }
    const assessed = { candidate, admission: { root: allocation.candidateAdmissionRoots[0], candidate, tupleRoot: cell.tupleRoot, runtimeRoot: cell.runtimeRoot }, closure: { candidate, sourceBytes, packet, proposal, validation } }
    vi.mocked(createPlannerSupervisedRuntime).mockImplementation((options) => {
      expect(admitPlannerSupervisorLifetime(options, 24800)).toBe(240000)
      const identity = { revisionId: options.revision.id, sourceRoot, executableRoot: `sha256:${options.revision.metadata.sourceArtifact!.hash}` as LabRoot, tupleId: options.retryV4LifetimeGrant!.runtime.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: options.image, harnessRoot: root("b"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
      return { identity, invoke: () => ({ identity } as never), verify: () => true, close: () => ({ cleanupComplete: true, orphanedChild: false }), accounting: [], timing: () => undefined, verifyTiming: () => false }
    })
    const input = { factoryRepository: {} as never, allocation, cell, start, ledger, requestRoot: cell.requestRoot, assessed: assessed as never }
    const provider = await issueDiagnosticRetryV4ProviderFromFactoryCandidate(input)
    expect(provider.identity.sourceRoot).toBe(sourceRoot)
    await expect(issueDiagnosticRetryV4ProviderFromFactoryCandidate(input)).rejects.toThrow("SEAT_ALREADY_ISSUED")
    expect(closeDiagnosticRetryV4IssuedProvider(provider)).toBe(true)
  })
  it("builds the exact authored TypeScript revision and wraps selected adapter identity", () => {
    const { admission } = admitted()
    const createRuntime = vi.fn((options: any) => ({ identity: { revisionId: options.revision.id, sourceRoot, executableRoot: root("1"), tupleId: "tuple", tupleRoot: root("2"), image: options.image, harnessRoot: root("3"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot }, invoke() { throw new Error("not invoked") }, verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } } }))
    const runtime = createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot: root("4"), budgetRoot: root("5"), createRuntime })
    expect(createRuntime).toHaveBeenCalledOnce()
    expect(runtime.identity.nativeLane).toEqual(admission.nativeLane)
    expect(runtime.identity.factoryPacketRoot).toBe(admission.packetRoot)
    expect(createRuntime.mock.calls[0]![0].revision.runtime.adapter.id).toBe("runtime-js-container-subprocess")
    expect(admitFactorySupervisorLifetime({ budgetRoot: root("5"), attemptRoot: root("4"), containerName: "ordinary", ownershipLabel: "ordinary" })).toBe(120000)
    expect(createRuntime.mock.calls[0]![0]).not.toHaveProperty("pilotLifetimeMs")
    expect(createRuntime.mock.calls[0]![0]).not.toHaveProperty("oneCellLifetimeMs")
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
