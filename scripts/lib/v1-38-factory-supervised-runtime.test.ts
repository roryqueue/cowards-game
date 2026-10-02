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
import * as factoryApi from "./v1-38-factory-supervised-runtime.js"
import { admitPlannerSupervisorLifetime, createPlannerSupervisedRuntime } from "./v1-38-planner-supervised-runtime.js"
import { createDiagnosticRetryV4Allocation, createDiagnosticRetryV4Cell, createDiagnosticRetryV4Start, openDiagnosticRetryV4Ledger } from "./v1-38-diagnostic-retry-v4.js"
import { issueDiagnosticRetryV4ProviderFromFactoryCandidate, closeDiagnosticRetryV4IssuedProvider } from "./v1-38-diagnostic-retry-v4-bridge.js"
import { prospectiveLifetimeFixture } from "../../packages/strategy-lab/src/league/allocation.test.js"
import { createProspectiveLeagueExecutionAllocationV2 } from "../../packages/strategy-lab/src/league/allocation.js"
import * as allocationApi from "../../packages/strategy-lab/src/league/allocation.js"
import { issueProspectiveLeagueLifetimeAuthority, claimProspectiveLeagueLifetimeAuthority, prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { defaultRuntimeMetadata, StrategyInputV119Schema } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { wrapLeagueProbeProvider } from "./v1-38-league-response-runtime.js"
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
describe("private IPC diagnostics injected factory", () => {
  // This unit checks private failure plumbing, not the mission corpus. Keep
  // its valid snapshot local so the strict script gate has no new planner seam.
  const diagnosticSoldiers = [{ id: "diagnostic-soldier", ownerPlayerId: "bottom", status: "ACTIVE", position: { x: 2, y: 11 }, facing: "UP", lastSuccessfulMoveDirection: null }]
  const diagnosticInput = StrategyInputV119Schema.parse({ phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers: diagnosticSoldiers, terrainStones: [] }, mySoldiers: diagnosticSoldiers, enemySoldiers: [], strategyMemory: {}, initialInitiativePlayerId: "bottom", hasInitialInitiative: true, roundInitiativePlayerId: "bottom", hasRoundInitiative: true })
  const injected = async (fault = true) => {
    const actual = await vi.importActual<typeof import("./v1-38-planner-supervised-runtime.js")>("./v1-38-planner-supervised-runtime.js")
    const { admission } = admitted(); let exists = false, calls = 0
    const createRuntime = (opts: any) => actual.createPlannerSupervisedRuntime({ ...opts,
      transport(_command: string, args: string[]) {
        if (args[0] === "inspect") return { status: exists ? 0 : 1, signal: null, stdout: Buffer.from(exists ? "owner:diag-factory\n" : ""), stderr: Buffer.from(exists ? "" : "Error: No such object: diag-factory\n") }
        if (args[0] === "create") exists = true
        if (args[0] === "rm") exists = false
        return { status: 0, signal: null, stdout: Buffer.from(args[0] === "create" ? "id\n" : ""), stderr: Buffer.alloc(0) }
      }, streamFactory: () => ({ exchange(frame: string) { calls++; const q = JSON.parse(frame), input = JSON.parse(Buffer.from(q.payloadBase64, "base64").toString()).input; return Buffer.from(JSON.stringify({ requestId: fault ? 99 : q.requestId, status: 0, signal: null, stdoutBase64: Buffer.from(JSON.stringify({ ok: true, value: { activationOrders: [], strategyMemory: input.strategyMemory } })).toString("base64"), stderrBase64: "" }) + "\n") }, close() { return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) } } }) })
    const host = createFactorySupervisedRuntime({ admission, sourceBytes, budgetRoot: root("a"), attemptRoot: root("b"), matchId: "diag-factory", containerName: "diag-factory", ownershipLabel: "owner:diag-factory", createRuntime })
    const req = { kind: "selectActivations", requestId: "diagnostic", semanticTupleId: host.identity.tupleId, coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0 }, input: structuredClone(diagnosticInput) } as never
    return { host, req, calls: () => calls }
  }
  it("joins exact selected evidence and refuses clones, another provider and structural capabilities", async () => {
    const first = await injected(), second = await injected(), e = await first.host.invoke(first.req, first.host.identity), other = await second.host.invoke(second.req, second.host.identity)
    const api = factoryApi as any, d = api.getFactoryPrivateDiagnostic?.(first.host, e)
    expect(d).toEqual({ stage: "outer_frame", reason: "correlation_invalid", identity: e.identity, invocationRoot: e.invocationRoot, requestId: e.requestId, method: e.method, inputRoot: e.inputRoot, ordinal: e.ordinal })
    expect(Object.isFrozen(d)).toBe(true); expect(api.verifyFactoryPrivateDiagnostic?.(first.host, e, d)).toBe(true)
    expect(api.verifyFactoryPrivateDiagnostic?.(first.host, e, structuredClone(d))).toBe(false)
    expect(api.verifyFactoryPrivateDiagnostic?.(second.host, other, d)).toBe(false)
    expect(api.getFactoryPrivateDiagnostic?.(first.host, structuredClone(e))).toBeUndefined()
    expect(api.getFactoryPrivateDiagnostic?.({ ...first.host, privateDiagnostic: () => d }, e)).toBeUndefined()
    expect(e).toMatchObject({ charged: true, completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "MALFORMED_IPC", retryable: false } } })
    expect(e).not.toHaveProperty("privateDiagnostic"); expect(first.host.verify(e)).toBe(true)
    await expect(Promise.resolve().then(() => first.host.invoke(first.req, first.host.identity))).rejects.toThrow("LAB_RUNTIME_STOPPED")
    expect(first.calls()).toBe(1); expect(first.host.close()).toEqual({ cleanupComplete: true, orphanedChild: false })
  })
  it("does not decorate a successful constructor-issued result", async () => {
    const { host, req } = await injected(false), e = await host.invoke(req, host.identity)
    expect(e.result.ok).toBe(true); expect((factoryApi as any).getFactoryPrivateDiagnostic?.(host, e)).toBeUndefined()
    expect(e).not.toHaveProperty("privateDiagnostic"); host.close()
  })
  it("ignores optional-looking metadata on historical injected providers", () => {
    const { admission } = admitted(), close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false }))
    const createRuntime = (opts: any) => {
      const identity = { revisionId: opts.revision.id, sourceRoot, executableRoot: root("a"), tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: opts.image, harnessRoot: root("a"), budgetRoot: opts.budgetRoot, attemptRoot: opts.attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
      return { identity, close, accounting: [], timing() {}, verifyTiming() { return false }, verify() { return true }, privateDiagnostic() { return { stage: "stream_exchange", reason: "wait_timeout", source: "PRIVATE_CANARY" } }, invoke(req: any) { return { identity, requestId: req.requestId, method: req.kind, inputRoot: root("a"), invocationRoot: root("b"), ordinal: 0, charged: true, completed: false, outputBytes: 0, result: { ok: false, violation: { type: "INVALID_OUTPUT", message: "Runtime system failure" }, systemFailure: { code: "MALFORMED_IPC", retryable: false } } } } } as never
    }
    const host = createFactorySupervisedRuntime({ admission, sourceBytes, budgetRoot: root("a"), attemptRoot: root("b"), matchId: "diag-factory", containerName: "diag-factory", ownershipLabel: "owner:diag-factory", createRuntime })
    const e = host.invoke({ kind: "selectActivations", requestId: "legacy" } as never, host.identity)
    expect((factoryApi as any).getFactoryPrivateDiagnostic?.(host, e)).toBeUndefined(); host.close()
  })
})
let prospectiveOrdinal = 0
const lifetimeGrant = () => {
  const allocation = createProspectiveLeagueExecutionAllocationV2(prospectiveLifetimeFixture()), { admission } = admitted(), defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  const value = { cellRoot: labRoot("lifetime-unit-cell", prospectiveOrdinal++), allocationRoot: allocation.root }, start = { ...value, root: labRoot("league-cell-start-v1", value) }
  const binding = { budgetRoot: allocation.root, attemptRoot: start.root, matchId: `league-${start.root.slice(7, 31)}`, seat: "bottom" as const, containerName: `unit-${prospectiveOrdinal}`, ownershipLabel: "unit-private", runtime: prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}` as LabRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: allocation.tupleRoot, runtimeLimitsRoot: allocation.runtimeRoot, image: allocation.operations.image }) }
  const charge = { kind: "cell-start" as const, root: labRoot("lifetime-unit-retained", start), value: start }
  return { allocation, admission, binding, charge, authority: issueProspectiveLeagueLifetimeAuthority(allocation, charge, binding) }
}
describe("prospective lifetime issued factory authority", () => {
  it.each(["function", "undefined", "accessor"])("prospective lifetime empirical authority rejects inherited constructor %s before source, accessor, construction or claims", (kind) => {
    // Admission is mocked ONLY while issuing a test-only empirical handle.
    // Real WeakMap issuance and both once-only claims remain under test.
    const admit = allocationApi.admitProspectiveLeagueExecutionAllocationV2
    const admissionMock = vi.spyOn(allocationApi, "admitProspectiveLeagueExecutionAllocationV2").mockImplementation((value) => ({ ...admit(value), evidenceClass: "empirical" }))
    const { authority, admission, binding } = lifetimeGrant()
    admissionMock.mockRestore()
    const touched = vi.fn(() => { throw Error("forbidden getter") }), injected = vi.fn(), planner = vi.mocked(createPlannerSupervisedRuntime)
    planner.mockClear()
    const prototype = kind === "accessor" ? Object.defineProperty({}, "createRuntime", { get: touched }) : { createRuntime: kind === "function" ? injected : undefined }
    const options = Object.assign(Object.create(prototype), { admission, ...binding, prospectiveLifetimeAuthority: authority, prospectiveLifetimeMs: 600000 })
    Object.defineProperty(options, "sourceBytes", { get: touched })
    expect(() => createFactorySupervisedRuntime(options)).toThrow("PROSPECTIVE_CONSTRUCTOR_OVERRIDE")
    expect(touched).not.toHaveBeenCalled(); expect(injected).not.toHaveBeenCalled(); expect(planner).not.toHaveBeenCalled()
    expect(claimProspectiveLeagueLifetimeAuthority(authority, binding, 600000, "factory")).toBe(600000)
    expect(claimProspectiveLeagueLifetimeAuthority(authority, binding, 600000, "planner")).toBe(600000)
  })
  it("rejects forged, copied, crossed and reused nested layer claims", () => {
    const { authority, binding } = lifetimeGrant()
    const claim = (handle: any, changed = binding, layer: "factory" | "planner" = "factory") => claimProspectiveLeagueLifetimeAuthority(handle, changed, 600000, layer)
    expect(() => claim({ ...authority })).toThrow("CLAIM_BINDING")
    expect(() => claim(authority, binding, "planner")).toThrow("CLAIM_REUSED")
    for (const field of ["budgetRoot", "attemptRoot", "matchId", "containerName", "ownershipLabel", "seat"] as const) expect(() => claim(authority, { ...binding, [field]: "crossed" } as never)).toThrow()
    for (const key of Object.keys(binding.runtime)) expect(() => claim(authority, { ...binding, runtime: { ...binding.runtime, [key]: "crossed" } })).toThrow("CLAIM_BINDING")
    expect(claim(authority)).toBe(600000)
    expect(() => claim(authority)).toThrow("CLAIM_REUSED")
    expect(claim(authority, binding, "planner")).toBe(600000)
    expect(() => claim(authority, binding, "planner")).toThrow("CLAIM_REUSED")
  })
  it("threads both claims and counts setup plus awaited retention toward exact expiry", async () => {
    const { authority, admission, binding } = lifetimeGrant(), close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false }))
    let now = 0, calls = 0
    vi.spyOn(performance, "now").mockImplementation(() => now)
    const creator = vi.fn((options: any) => {
      expect(admitPlannerSupervisorLifetime({ ...options, prospectiveRuntimeBinding: binding.runtime }, 24800)).toBe(600000)
      now = 100000 // Nested setup belongs to the enclosing lifetime.
      const identity = { ...binding.runtime, harnessRoot: root("a"), budgetRoot: binding.budgetRoot, attemptRoot: binding.attemptRoot }
      return { identity, invoke(request: any) { calls++; return { identity, requestId: request.requestId, inputRoot: labRoot("runtime-input", request.input), invocationRoot: root("b"), method: request.kind, ordinal: 0, charged: true, completed: true, outputBytes: 2, result: { ok: true, value: { activationOrders: [], strategyMemory: {} } } } as never }, verify() { return true }, close, accounting: [], timing() { return undefined }, verifyTiming() { return false } }
    })
    const options = { admission, sourceBytes, ...binding, prospectiveLifetimeAuthority: authority, prospectiveLifetimeMs: 600000, factoryLifetimeMs: 600000, createRuntime: creator }
    const runtime = createFactorySupervisedRuntime(options)
    expect(() => createFactorySupervisedRuntime(options)).toThrow("CLAIM_REUSED"); expect(creator).toHaveBeenCalledOnce()
    const wrapper = wrapLeagueProbeProvider(runtime, undefined, { minX: 0, maxX: 11 }, async () => { now = 600000 })
    now = 599999
    const soldiers = [{ id: "lifetime-soldier", ownerPlayerId: "bottom", status: "ACTIVE", position: { x: 2, y: 11 }, facing: "UP", lastSuccessfulMoveDirection: null }]
    const input = StrategyInputV119Schema.parse({ phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers, terrainStones: [] }, mySoldiers: soldiers, enemySoldiers: [], strategyMemory: {}, initialInitiativePlayerId: "bottom", hasInitialInitiative: true, roundInitiativePlayerId: "bottom", hasRoundInitiative: true })
    await wrapper.invoke({ kind: "selectActivations", requestId: "unit", input } as never, runtime.identity)
    await expect(wrapper.invoke({ kind: "selectActivations", requestId: "next", input } as never, runtime.identity)).rejects.toThrow("LIFETIME_EXHAUSTED")
    expect(calls).toBe(1); expect(close).toHaveBeenCalledOnce()
  })
  it("counts setup and post-invoke elapsed time and closes at the boundary", () => {
    for (const stage of ["setup", "invoke"] as const) {
      const { authority, admission, binding } = lifetimeGrant(), close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false })); let now = 0, calls = 0
      vi.spyOn(performance, "now").mockImplementation(() => now)
      const creator = (options: any) => {
        admitPlannerSupervisorLifetime({ ...options, prospectiveRuntimeBinding: binding.runtime }, 24800)
        if (stage === "setup") now = 600000
        const identity = { ...binding.runtime, harnessRoot: root("a"), budgetRoot: binding.budgetRoot, attemptRoot: binding.attemptRoot }
        return { identity, invoke() { calls++; now = 600000; return { identity } as never }, verify() { return true }, close, accounting: [], timing() { return undefined }, verifyTiming() { return false } }
      }
      const runtime = createFactorySupervisedRuntime({ admission, sourceBytes, ...binding, prospectiveLifetimeAuthority: authority, prospectiveLifetimeMs: 600000, createRuntime: creator })
      expect(() => runtime.invoke({} as never, runtime.identity)).toThrow("LIFETIME_EXHAUSTED")
      expect(calls).toBe(stage === "setup" ? 0 : 1); expect(close).toHaveBeenCalledOnce()
      vi.restoreAllMocks()
    }
  })
})

describe("selected factory supervised runtime adapter", () => {
  it("prospective lifetime rejects scalar and forged handle before runtime construction", () => {
    const { admission } = admitted(), createRuntime = vi.fn()
    const base = { admission, sourceBytes, budgetRoot: root("5"), attemptRoot: root("4"), matchId: "unit", containerName: "unit", ownershipLabel: "unit", createRuntime }
    expect(() => createFactorySupervisedRuntime({ ...base, factoryLifetimeMs: 600000 })).toThrow()
    expect(() => createFactorySupervisedRuntime({ ...base, prospectiveLifetimeAuthority: {}, prospectiveLifetimeMs: 600000 } as never)).toThrow()
    expect(createRuntime).not.toHaveBeenCalled()
  })
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
