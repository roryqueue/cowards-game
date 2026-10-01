import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../contracts.js"
import { runCanonicalLabMatch } from "../runtime-bridge.js"
import type { FactorySupervisionProvider } from "../factory/admission.js"
import type { DiagnosticPilotAssessedCandidate } from "./diagnostic-pilot.js"
import {
  createDiagnosticRetryV4Allocation, createDiagnosticRetryV4Cell,
  createDiagnosticRetryV4Start, createDiagnosticRetryV4Stage,
  openDiagnosticRetryV4Ledger, issueDiagnosticRetryV4LifetimeGrant,
  verifyRetainedDiagnosticRetryV4Execution,
} from "./diagnostic-retry-v4.js"
import {
  issueDiagnosticRetryV4ProviderFromFactoryCandidate,
  runAuthorizedDiagnosticRetryV4, runDiagnosticRetryV4CanonicalFromBridge,
  closeDiagnosticRetryV4IssuedProvider,
  type DiagnosticRetryV4RuntimeHost,
} from "./diagnostic-retry-v4-bridge.js"

// These are boundary-unit injections, not genuine candidate-assessment evidence.
// The real ledger/grant/opaque-handle issuer and adapter remain under test. The
// canonical runner is spied, never a provider or guest-source execution path.
vi.mock("../runtime-bridge.js", () => ({ runCanonicalLabMatch: vi.fn(async () => ({ kind: "failure", privacy: "private_offline", transitions: [], accounting: [], unchangedState: null, failure: { classification: "system_failure", code: "LAB_UNIT_INJECTED_FAILURE" } })) }))
vi.mock("./connected-runner.js", () => ({ readCandidateClosure: (value: unknown) => value }))
vi.mock("./diagnostic-pilot.js", async (original) => ({ ...await original<typeof import("./diagnostic-pilot.js")>(), requireDiagnosticPilotAssessedCandidate: (value: unknown) => value }))
vi.mock("../factory/admission.js", () => ({ admitFactory: (input: { packet: unknown }) => input.packet, authorizeFactorySupervision: (input: { sourceAdmission: unknown }) => input.sourceAdmission }))
vi.mock("@cowards/runtime-js", () => ({ buildStrategyRevision: (input: { source: string }) => ({ id: `unit-revision-${input.source}`, validation: { valid: true }, sourceHash: hash(`source-${input.source}`).slice(7), metadata: { sourceArtifact: { hash: hash(`executable-${input.source}`).slice(7) } } }) }))

const hash = (value: string): LabRoot => labRoot("retry-v4-bridge-unit", value)
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
    const admission = { sourceRoot: hash(`source-${seat}`), packetRoot: hash(`packet-${seat}`), proposalRoot: hash(`proposal-${seat}`), validationRoot: hash(`validation-${seat}`) }
    return { candidate, admission: { root: allocation.candidateAdmissionRoots[index], candidate, tupleRoot: cell.tupleRoot, runtimeRoot: cell.runtimeRoot }, closure: { candidate, sourceBytes: new TextEncoder().encode(seat), packet: admission, proposal: candidate.proposal, validation: {} } } as unknown as DiagnosticPilotAssessedCandidate
  }
  const hostCalls = vi.fn()
  const host: DiagnosticRetryV4RuntimeHost = { createFactorySupervisedRuntime(input) {
    hostCalls(input)
    const seat = new TextDecoder().decode(input.sourceBytes)
    return { identity: { revisionId: `unit-revision-${seat}`, sourceRoot: input.admission.sourceRoot, executableRoot: input.executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: allocation.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: hash("harness"), budgetRoot: input.budgetRoot, attemptRoot: input.attemptRoot, runtimeLimitsRoot: allocation.runtimeRoot, nativeLane: {} as never, factoryPacketRoot: input.admission.packetRoot, factoryProposalRoot: input.admission.proposalRoot, factoryValidationRoot: input.admission.validationRoot }, invoke() { throw Error("unit provider must never invoke guest source") }, verify: () => false, close: () => ({ cleanupComplete: true, orphanedChild: false }) } satisfies FactorySupervisionProvider
  } }
  const issue = (seat: "bottom" | "top", selectedHost = host, selected = assessed(seat)) => issueDiagnosticRetryV4ProviderFromFactoryCandidate({ host: selectedHost, factoryRepository: {} as never, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed: selected, retryV4LifetimeGrant: issueDiagnosticRetryV4LifetimeGrant(ledger, allocation, cell, start, seat) })
  return { allocation, cell, start, ledger, begin, assessed, host, hostCalls, issue }
}
const request = (f: ReturnType<typeof setup>, runPermit: ReturnType<ReturnType<typeof setup>["begin"]>, bottom: ReturnType<ReturnType<typeof setup>["issue"]>, top: ReturnType<ReturnType<typeof setup>["issue"]>) => ({ ledger: f.ledger, allocation: f.allocation, cell: f.cell, start: f.start, requestRoot: f.cell.requestRoot, runPermit, bottom, top, match: { matchId: `retry-v4-${f.cell.requestRoot.slice(7)}`, seed: f.allocation.seed, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!, bottomPlayerId: `league-${f.cell.bottomCandidateRoot.slice(7)}`, topPlayerId: `league-${f.cell.topCandidateRoot.slice(7)}`, initialInitiativePlayerId: `league-${f.cell.initialInitiativeCandidateRoot.slice(7)}`, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, onKernelEntry: () => f.ledger.writeStage(createDiagnosticRetryV4Stage(f.start, 3, "kernel_or_callback")), onEvidenceStart: () => f.ledger.writeStage(createDiagnosticRetryV4Stage(f.start, 4, "first_evidence_write")) })

describe("v4 adapter boundary (explicit dependency injections; no empirical credit)", () => {
  it("reaches only the unchanged generic runner via genuinely issued v4 ledger/grants/opaque handles", async () => {
    const f = setup(), permit = f.begin(), bottom = f.issue("bottom"), top = f.issue("top")
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

  it("rejects missing charges and forged candidate/runtime identities before canonical entry", () => {
    const f = setup()
    expect(() => f.issue("bottom")).toThrow("PRECHARGE_ABSENT_OR_TERMINAL")
    expect(f.hostCalls).not.toHaveBeenCalled()
    f.begin()
    const wrong = { ...f.assessed("bottom"), candidate: { ...(f.assessed("bottom") as unknown as { candidate: object }).candidate, root: hash("wrong-candidate") } }
    expect(() => f.issue("bottom", f.host, wrong as never)).toThrow("CANDIDATE_BINDING")
    const badHost: DiagnosticRetryV4RuntimeHost = { createFactorySupervisedRuntime(input) { const value = f.host.createFactorySupervisedRuntime(input); return { ...value, identity: { ...value.identity, runtimeLimitsRoot: hash("wrong-runtime") } } } }
    expect(() => f.issue("bottom", badHost)).toThrow("PROVIDER_IDENTITY")
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })

  it.each(["copied-provider", "wrong-seat", "wrong-seed", "wrong-namespace", "copied-permit"])("rejects %s before generic entry", async (fault) => {
    const f = setup(), permit = f.begin(), bottom = f.issue("bottom"), top = f.issue("top"), input = request(f, permit, bottom, top)
    const altered = { ...input, ...(fault === "copied-provider" ? { bottom: { ...bottom } } : {}), ...(fault === "wrong-seat" ? { bottom: top } : {}), ...(fault === "wrong-seed" ? { match: { ...input.match, seed: "other-seed" } } : {}), ...(fault === "wrong-namespace" ? { match: { ...input.match, matchId: "legacy-v3" } } : {}), ...(fault === "copied-permit" ? { runPermit: { ...permit } } : {}) }
    await expect(runAuthorizedDiagnosticRetryV4(altered as never)).rejects.toThrow()
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })

  it("rejects raw/fabricated bridge permits and serializations; cannot issue a seat twice", async () => {
    await expect(runDiagnosticRetryV4CanonicalFromBridge({ schemaVersion: "diagnostic-retry-bridge-permit-v4" } as never)).rejects.toThrow("BRIDGE_PERMIT")
    const f = setup(); f.begin(); const bottom = f.issue("bottom")
    expect(() => f.issue("bottom")).toThrow("SEAT_ALREADY_ISSUED")
    expect(() => JSON.stringify(bottom)).toThrow("NON_SERIALIZABLE")
    expect(closeDiagnosticRetryV4IssuedProvider(bottom)).toBe(true)
    expect(() => closeDiagnosticRetryV4IssuedProvider({ ...bottom } as never)).toThrow("UNISSUED_PROVIDER")
    expect(runCanonicalLabMatch).not.toHaveBeenCalled()
  })
})
