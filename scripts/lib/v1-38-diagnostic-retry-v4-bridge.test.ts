import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { factoryOraclePacketFixture } from "../../packages/strategy-lab/src/factory/contracts.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { runCanonicalLabMatch } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { DiagnosticPilotAssessedCandidate } from "../../packages/strategy-lab/src/league/diagnostic-pilot.js"
import {
  createDiagnosticRetryV4Allocation, createDiagnosticRetryV4Cell,
  createDiagnosticRetryV4Start, createDiagnosticRetryV4Stage,
  openDiagnosticRetryV4Ledger,
  verifyRetainedDiagnosticRetryV4Execution,
} from "./v1-38-diagnostic-retry-v4.js"
import {
  issueDiagnosticRetryV4ProviderFromFactoryCandidate,
  runAuthorizedDiagnosticRetryV4, runDiagnosticRetryV4CanonicalFromBridge,
  closeDiagnosticRetryV4IssuedProvider,
  requireDiagnosticRetryV4LifetimeGrant,
} from "./v1-38-diagnostic-retry-v4-bridge.js"

// These are boundary-unit injections, not genuine candidate-assessment evidence.
// The real ledger/grant/opaque-handle issuer and adapter remain under test. The
// canonical runner is spied, never a provider or guest-source execution path.
vi.mock("../../packages/strategy-lab/src/runtime-bridge.js", () => ({ runCanonicalLabMatch: vi.fn(async () => ({ kind: "failure", privacy: "private_offline", transitions: [], accounting: [], unchangedState: null, failure: { classification: "system_failure", code: "LAB_UNIT_INJECTED_FAILURE" } })) }))
vi.mock("../../packages/strategy-lab/src/league/connected-runner.js", () => ({ readCandidateClosure: (value: unknown) => value }))
vi.mock("../../packages/strategy-lab/src/league/diagnostic-pilot.js", async (original) => ({ ...await original<typeof import("../../packages/strategy-lab/src/league/diagnostic-pilot.js")>(), requireDiagnosticPilotAssessedCandidate: (value: unknown) => value }))
vi.mock("../../packages/strategy-lab/src/factory/admission.js", () => ({ admitFactory: (input: { packet: unknown }) => input.packet, authorizeFactorySupervision: (input: { sourceAdmission: unknown }) => input.sourceAdmission }))
vi.mock("../../packages/runtime-js/src/revision.js", () => ({ buildStrategyRevision: vi.fn((input: { source: string }) => ({ id: `unit-revision-${input.source}`, validation: { valid: true }, sourceHash: hash(`source-${input.source}`).slice(7), metadata: { sourceArtifact: { hash: hash(`executable-${input.source}`).slice(7) } } })) }))
vi.mock("./v1-38-factory-supervised-runtime.js", async (original) => ({ ...await original<Record<string, unknown>>(), createFactorySupervisedRuntime: vi.fn() }))
vi.mock("./v1-38-planner-supervised-runtime.js", async (original) => ({ ...await original<Record<string, unknown>>(), createPlannerSupervisedRuntime: vi.fn() }))

const hash = (value: string): LabRoot => labRoot("retry-v4-bridge-unit", value)
const factoryScript = "./v1-38-factory-supervised-runtime.js", plannerScript = "./v1-38-planner-supervised-runtime.js"
const { admitFactorySupervisorLifetime, createFactorySupervisedRuntime } = await import(factoryScript)
const { admitPlannerSupervisorLifetime, createPlannerSupervisedRuntime } = await import(plannerScript)
const realFactorySupervisor = (await vi.importActual<Record<string, any>>(factoryScript)).createFactorySupervisedRuntime
type TestConstructor = { createFactorySupervisedRuntime(input: any): FactorySupervisionProvider }
const revisionScript = "../../packages/runtime-js/src/revision.js"
const realRevision = (await vi.importActual<Record<string, any>>(revisionScript)).buildStrategyRevision
const originalCwd = process.cwd(), directories: string[] = []
beforeEach(() => vi.clearAllMocks())
afterEach(() => { process.chdir(originalCwd); for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }) })
const setup = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "retry-v4-bridge-unit-")))
  directories.push(directory); process.chdir(directory); mkdirSync(".strategy-lab", { mode: 0o700 })
  const allocation = createDiagnosticRetryV4Allocation({ attemptOrdinal: 1, envelopeRoot: hash(directory), sourceClosureRoot: hash("closure"), implementationRoot: hash("implementation"), gateRoot: hash("review"), oldEvidenceBaseline: { oldAllocationV2: hash("v2"), oldAllocationUnversioned: hash("v1"), oldResult: hash("result"), oldLeagueTree: hash("league"), oldFactoryTree: hash("factory") } })
  mkdirSync(allocation.store, { mode: 0o700 })
  const cell = createDiagnosticRetryV4Cell(allocation, 0), start = createDiagnosticRetryV4Start(allocation, cell), ledger = openDiagnosticRetryV4Ledger(allocation.store)
  const begin = () => { ledger.writeStart(start); for (let ordinal = 0; ordinal < 3; ordinal++) ledger.writeStage(createDiagnosticRetryV4Stage(start, ordinal, ["bottom_issuance", "top_issuance", "pre_kernel_binding"][ordinal] as never)); return ledger.writeRunAttempt(start) }
  const assessed = (seat: "bottom" | "top") => {
    const index = seat === "bottom" ? 0 : 1
    const candidate = { root: allocation.candidateRoots[index], supervisionReceiptRoot: hash(`receipt-${seat}`), proposal: { build: { compatibilityTupleRoot: allocation.tupleRoot, buildRoot: hash(`build-${seat}`) }, nativeLane: { runtimeProfileRoot: allocation.runtimeRoot } } }
    const admission = { authorizationRoot: hash(`authorization-${seat}`), sourceRoot: hash(`source-${seat}`), packetRoot: hash(`packet-${seat}`), proposalRoot: hash(`proposal-${seat}`), validationRoot: hash(`validation-${seat}`) }
    return { candidate, admission: { root: allocation.candidateAdmissionRoots[index], candidate, tupleRoot: cell.tupleRoot, runtimeRoot: cell.runtimeRoot }, closure: { candidate, sourceBytes: new TextEncoder().encode(seat), packet: admission, proposal: candidate.proposal, validation: {} } } as unknown as DiagnosticPilotAssessedCandidate
  }
  const hostCalls = vi.fn()
  const host: TestConstructor = { createFactorySupervisedRuntime(input) {
    hostCalls(input)
    const grant = input.retryV4LifetimeGrant
    const options = { budgetRoot: input.budgetRoot, attemptRoot: input.attemptRoot, containerName: grant.containerName, ownershipLabel: grant.ownershipLabel, retryV4LifetimeGrant: grant, retryV4RuntimeBinding: grant.runtime }
    expect(admitFactorySupervisorLifetime({ ...options, factoryLifetimeMs: 240000 })).toBe(240000)
    expect(admitPlannerSupervisorLifetime({ ...options, retryV4LifetimeMs: 240000 }, 1000)).toBe(240000)
    const seat = new TextDecoder().decode(input.sourceBytes)
    return { identity: { revisionId: `unit-revision-${seat}`, sourceRoot: input.admission.sourceRoot, executableRoot: grant.runtime.executableRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: allocation.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: hash("harness"), budgetRoot: input.budgetRoot, attemptRoot: input.attemptRoot, runtimeLimitsRoot: allocation.runtimeRoot, nativeLane: {} as never, factoryPacketRoot: input.admission.packetRoot, factoryProposalRoot: input.admission.proposalRoot, factoryValidationRoot: input.admission.validationRoot }, invoke() { throw Error("unit provider must never invoke guest source") }, verify: () => false, close: () => ({ cleanupComplete: true, orphanedChild: false }) } satisfies FactorySupervisionProvider
  } }
  const input = (seat: "bottom" | "top", selected = assessed(seat)) => ({ factoryRepository: {} as never, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed: selected })
  // Replacement occurs only in this Vitest module, never in issuer arguments.
  const issue = (seat: "bottom" | "top", selectedHost = host, selected = assessed(seat)) => { vi.mocked(createFactorySupervisedRuntime).mockImplementation(selectedHost.createFactorySupervisedRuntime); return issueDiagnosticRetryV4ProviderFromFactoryCandidate(input(seat, selected)) }
  return { allocation, cell, start, ledger, begin, assessed, host, hostCalls, issue, input }
}
const request = (f: ReturnType<typeof setup>, runPermit: ReturnType<ReturnType<typeof setup>["begin"]>, bottom: Awaited<ReturnType<ReturnType<typeof setup>["issue"]>>, top: Awaited<ReturnType<ReturnType<typeof setup>["issue"]>>) => ({ ledger: f.ledger, allocation: f.allocation, cell: f.cell, start: f.start, requestRoot: f.cell.requestRoot, runPermit, bottom, top, match: { matchId: `retry-v4-${f.cell.requestRoot.slice(7)}`, seed: f.allocation.seed, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!, bottomPlayerId: `league-${f.cell.bottomCandidateRoot.slice(7)}`, topPlayerId: `league-${f.cell.topCandidateRoot.slice(7)}`, initialInitiativePlayerId: `league-${f.cell.initialInitiativeCandidateRoot.slice(7)}`, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, onKernelEntry: () => f.ledger.writeStage(createDiagnosticRetryV4Stage(f.start, 3, "kernel_or_callback")), onEvidenceStart: () => f.ledger.writeStage(createDiagnosticRetryV4Stage(f.start, 4, "first_evidence_write")) })

describe("v4 adapter boundary (explicit dependency injections; no empirical credit)", () => {
  it("rejects a caller host that would claim both layers and return an expected-identity fake provider", async () => {
    const f = setup(); f.begin()
    const invoke = vi.fn(), malicious = vi.fn((input: any) => ({ ...f.host.createFactorySupervisedRuntime(input), invoke }))
    await expect(issueDiagnosticRetryV4ProviderFromFactoryCandidate({ ...f.input("bottom"), host: { createFactorySupervisedRuntime: malicious } } as never)).rejects.toThrow("ISSUER_OPTIONS")
    expect(malicious).not.toHaveBeenCalled(); expect(invoke).not.toHaveBeenCalled()
    expect(createFactorySupervisedRuntime).not.toHaveBeenCalled()
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
    expect(f.ledger.listNames().some((name) => name.includes(".evidence-"))).toBe(false)
  })
  it.each(["createRuntime", "invoke", "provider"])("rejects caller-controlled %s before construction", async (key) => {
    const f = setup(); f.begin()
    await expect(issueDiagnosticRetryV4ProviderFromFactoryCandidate({ ...f.input("bottom"), [key]: vi.fn() } as never)).rejects.toThrow("ISSUER_OPTIONS")
    expect(createFactorySupervisedRuntime).not.toHaveBeenCalled(); expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })
  it("constructs and invokes the real factory wrapper with the exact v4 revision and nested planner claim", async () => {
    const f = setup(); f.begin()
    const source = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}"
    const sourceBytes = new TextEncoder().encode(source)
    const sourceRoot = `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}` as LabRoot
    const assessed = f.assessed("bottom") as unknown as { closure: { sourceBytes: Uint8Array; packet: Record<string, unknown> } }
    assessed.closure.sourceBytes = sourceBytes
    assessed.closure.packet = { ...assessed.closure.packet, sourceRoot, nativeLane: factoryOraclePacketFixture().nativeLane }
    vi.mocked(buildStrategyRevision).mockImplementationOnce(realRevision).mockImplementationOnce(realRevision)
    let created: FactorySupervisionProvider | undefined
    const host: TestConstructor = { createFactorySupervisedRuntime(input) {
      const g = input.retryV4LifetimeGrant
      vi.mocked(createPlannerSupervisedRuntime).mockImplementation((options: any) => {
          expect(admitPlannerSupervisorLifetime(options, 1000)).toBe(240000)
          const identity = { revisionId: options.revision.id, sourceRoot, executableRoot: g.runtime.executableRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: f.allocation.tupleRoot, image: options.image, harnessRoot: hash("inert-harness"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: f.allocation.runtimeRoot }
          return { identity, invoke: () => ({ identity } as never), verify: () => true, close: () => ({ cleanupComplete: true, orphanedChild: false }), accounting: [] } as never
      })
      created = realFactorySupervisor(input)
      return created!
    } }
    const issued = await f.issue("bottom", host, assessed as never)
    expect(issued.identity.sourceRoot).toBe(sourceRoot)
    expect(created!.verify(await created!.invoke({} as never, created!.identity))).toBe(true)
    expect(created!.close().cleanupComplete).toBe(true)
  })
  it.each(["sourceRoot", "executableRoot", "runtimeLimitsRoot", "candidateRoot", "admissionRoot", "revisionId", "tupleId", "image"])("denies a wrong %s during genuine single construction", async (field) => {
    const f = setup(); f.begin()
    const host: TestConstructor = { createFactorySupervisedRuntime(input) {
      const g = input.retryV4LifetimeGrant
      admitFactorySupervisorLifetime({ budgetRoot: input.budgetRoot, attemptRoot: input.attemptRoot, containerName: g.containerName, ownershipLabel: g.ownershipLabel, factoryLifetimeMs: 240000, retryV4LifetimeGrant: g, retryV4RuntimeBinding: { ...g.runtime, [field]: field.endsWith("Root") ? hash("wrong") : "wrong" } })
      throw Error("unreachable")
    } }
    await expect(f.issue("bottom", host)).rejects.toThrow("GRANT_BINDING")
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })
  it("expires a captured grant after success and failure, and rejects a second construction claim", async () => {
    const f = setup(); f.begin(); await f.issue("bottom")
    const input = f.hostCalls.mock.calls[0]![0], g = input.retryV4LifetimeGrant
    const options = { budgetRoot: input.budgetRoot, attemptRoot: input.attemptRoot, containerName: g.containerName, ownershipLabel: g.ownershipLabel, factoryLifetimeMs: 240000, retryV4LifetimeGrant: g, retryV4RuntimeBinding: g.runtime }
    expect(() => admitFactorySupervisorLifetime(options)).toThrow("GRANT_INACTIVE")
    let failedGrant: typeof g | undefined
    const badHost: TestConstructor = { createFactorySupervisedRuntime(next) {
      failedGrant = next.retryV4LifetimeGrant
      const provider = f.host.createFactorySupervisedRuntime(next)
      const grant = next.retryV4LifetimeGrant
      expect(() => admitPlannerSupervisorLifetime({ budgetRoot: next.budgetRoot, attemptRoot: next.attemptRoot, containerName: grant.containerName, ownershipLabel: grant.ownershipLabel, retryV4LifetimeMs: 240000, retryV4LifetimeGrant: grant, retryV4RuntimeBinding: grant.runtime }, 1000)).toThrow("GRANT_PLANNER_REUSED")
      admitFactorySupervisorLifetime({ ...options, attemptRoot: next.attemptRoot, retryV4LifetimeGrant: grant, containerName: grant.containerName, ownershipLabel: grant.ownershipLabel, retryV4RuntimeBinding: grant.runtime })
      return provider
    } }
    await expect(f.issue("top", badHost)).rejects.toThrow("GRANT_FACTORY_REUSED")
    const grant = failedGrant!
    expect(() => requireDiagnosticRetryV4LifetimeGrant(grant, { allocationRoot: grant.allocationRoot, cellRoot: grant.cellRoot, startRoot: grant.startRoot, seat: grant.seat, containerName: grant.containerName, ownershipLabel: grant.ownershipLabel, lifetimeMilliseconds: 240000, runtime: grant.runtime })).toThrow("GRANT_INACTIVE")
  })
  it("rejects cross-seat binding while a private grant is active", async () => {
    const f = setup(); f.begin()
    const host: TestConstructor = { createFactorySupervisedRuntime(input) {
      const g = input.retryV4LifetimeGrant
      requireDiagnosticRetryV4LifetimeGrant(g, { allocationRoot: g.allocationRoot, cellRoot: g.cellRoot, startRoot: g.startRoot, seat: "top", containerName: g.containerName, ownershipLabel: g.ownershipLabel, lifetimeMilliseconds: 240000, runtime: g.runtime })
      throw Error("unreachable")
    } }
    await expect(f.issue("bottom", host)).rejects.toThrow("GRANT_BINDING")
  })
  it("reaches only the unchanged generic runner via genuinely issued v4 ledger/grants/opaque handles", async () => {
    const f = setup(), permit = f.begin(), bottom = await f.issue("bottom"), top = await f.issue("top")
    const input = request(f, permit, bottom, top), retained = await runAuthorizedDiagnosticRetryV4(input)
    expect(f.hostCalls).toHaveBeenCalledTimes(2)
    expect(f.hostCalls.mock.calls[0]![0].retryV4LifetimeGrant.schemaVersion).toBe("diagnostic-retry-lifetime-grant-v4")
    expect(runCanonicalLabMatch).toHaveBeenCalledTimes(1)
    const call = vi.mocked(runCanonicalLabMatch).mock.calls[0]![0]
    expect(call.match).toEqual(input.match)
    expect(Object.isFrozen(call.match)).toBe(true)
    expect(Object.isFrozen(call.match.arenaVariant)).toBe(true)
    expect(retained).toMatchObject({ disposition: "system_failure", processValidity: "process_invalid" })
    expect(verifyRetainedDiagnosticRetryV4Execution(f.ledger, f.allocation, f.cell, f.start, retained.evidenceRoot).disposition).toBe("system_failure")
    await expect(runAuthorizedDiagnosticRetryV4(input)).rejects.toThrow("CANONICAL_RUN_PERMIT")
    expect(runCanonicalLabMatch).toHaveBeenCalledTimes(1)
  })

  it("rejects missing charges and forged candidate/runtime identities before canonical entry", async () => {
    const f = setup()
    await expect(f.issue("bottom")).rejects.toThrow("PRECHARGE_ABSENT_OR_TERMINAL")
    expect(f.hostCalls).not.toHaveBeenCalled()
    f.begin()
    const wrong = { ...f.assessed("bottom"), candidate: { ...(f.assessed("bottom") as unknown as { candidate: object }).candidate, root: hash("wrong-candidate") } }
    await expect(f.issue("bottom", f.host, wrong as never)).rejects.toThrow("CANDIDATE_BINDING")
    const badHost: TestConstructor = { createFactorySupervisedRuntime(input) { const value = f.host.createFactorySupervisedRuntime(input); return { ...value, identity: { ...value.identity, runtimeLimitsRoot: hash("wrong-runtime") } } } }
    await expect(f.issue("bottom", badHost)).rejects.toThrow("PROVIDER_IDENTITY")
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })

  it.each(["copied-provider", "wrong-seat", "wrong-seed", "wrong-namespace", "copied-permit"])("rejects %s before generic entry", async (fault) => {
    const f = setup(), permit = f.begin(), bottom = await f.issue("bottom"), top = await f.issue("top"), input = request(f, permit, bottom, top)
    const altered = { ...input, ...(fault === "copied-provider" ? { bottom: { ...bottom } } : {}), ...(fault === "wrong-seat" ? { bottom: top } : {}), ...(fault === "wrong-seed" ? { match: { ...input.match, seed: "other-seed" } } : {}), ...(fault === "wrong-namespace" ? { match: { ...input.match, matchId: "legacy-v3" } } : {}), ...(fault === "copied-permit" ? { runPermit: { ...permit } } : {}) }
    await expect(runAuthorizedDiagnosticRetryV4(altered as never)).rejects.toThrow()
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })

  it("rejects raw/fabricated bridge permits and serializations; cannot issue a seat twice", async () => {
    await expect(runDiagnosticRetryV4CanonicalFromBridge({ schemaVersion: "diagnostic-retry-bridge-permit-v4" } as never)).rejects.toThrow("BRIDGE_PERMIT")
    const f = setup(); f.begin(); const bottom = await f.issue("bottom")
    await expect(f.issue("bottom")).rejects.toThrow("SEAT_ALREADY_ISSUED")
    expect(() => JSON.stringify(bottom)).toThrow("NON_SERIALIZABLE")
    expect(closeDiagnosticRetryV4IssuedProvider(bottom)).toBe(true)
    expect(() => closeDiagnosticRetryV4IssuedProvider({ ...bottom } as never)).toThrow("UNISSUED_PROVIDER")
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })
})
