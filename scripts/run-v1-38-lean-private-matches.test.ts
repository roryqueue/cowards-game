import { describe, expect, it, vi } from "vitest"
it("one-Match v2 exposes only explicit versioned route commands", () => {
  expect(route.parseLeanPrivateMatchesArgsV2(["metadata-v2", "--source-store", authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1])).toEqual({ command: "metadata", sourceStore: authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1 })
  expect(() => route.parseLeanPrivateMatchesArgsV1(["metadata-v2", "--source-store", authority.LEAN_PRIVATE_MATCH_SOURCE_STORE_V1])).toThrow()
  expect(route.produceLeanPrivateMatchEvidenceV2).toBeTypeOf("function")
  expect(route.verifyLeanPrivateMatchesStoreV2).toBeTypeOf("function")
})
import * as route from "./run-v1-38-lean-private-matches.js"
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { CANONICAL_ARENA_CATALOG_V1_37, BOTTOM_STARTING_POSITIONS, TOP_STARTING_POSITIONS } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { deriveFactoryOrderedRecordDescriptor } from "../packages/strategy-lab/src/factory/admission.js"
import { leanCanonicalBytes, leanBytesRoot, LEAN_STARTUP_POLICY_V5 } from "../packages/strategy-lab/src/league/lean-experiment.js"
import type { LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { LeanPrivateMatchAllocationV1 } from "./lib/v1-38-lean-experiment-authority.js"
import { readLeanPrivateMatchGitV1 } from "./lib/v1-38-lean-container-match-session.js"
import { LEAN_PRIVATE_MATCH_WINDOW_V1 } from "./lib/v1-38-lean-experiment-authority.js"
import * as authority from "./lib/v1-38-lean-experiment-authority.js"
import * as composer from "./lib/v1-38-lean-baseline-match.js"
import * as source from "./lib/v1-38-lean-baseline-source.js"
import * as runtime from "./lib/v1-38-factory-supervised-runtime.js"
import * as bridge from "../packages/strategy-lab/src/runtime-bridge.js"
import * as admissions from "../packages/strategy-lab/src/factory/admission.js"
import * as revisions from "../packages/runtime-js/src/revision.js"
import * as lifetime from "./lib/v1-38-league-prospective-lifetime.js"
import { chmodSync } from "node:fs"
import { createHash } from "node:crypto"
import { buildLeanStartupWorkerHarnessV8 } from "./lib/v1-38-lean-container-match-session.js"

it.each([true, false] as const)("dormant startup receipt connects actual composer to finite producer, observed=%s", async observed => {
  const f = fixture(), executableSource = "SOURCE_PRIVATE_SENTINEL_INERT", request = { methodName: "selectActivations" as const, source: executableSource, input: { secret: "INPUT_MEMORY_OBJECTIVE_PRIVATE_SENTINEL" }, outputByteLimit: 262144, requestOrdinal: 1 }
  const executableRoot = `sha256:${createHash("sha256").update(executableSource).digest("hex")}` as const
  const prefix = { ...f.allocation.sourcePrefix, root: labRoot("lean-private-match-source-prefix-v2", f.allocation.sourcePrefix.rows) }
  const allocation = route.createLeanPrivateMatchAllocationV2({ sourceHead: f.allocation.sourceHead, sources: f.allocation.sources.map(s => ({ ...s, executableRoot })) as never, sourcePrefix: prefix, priorProbeCarry: f.allocation.priorProbeCarry, priorMatchCarry: authority.LEAN_PRIVATE_MATCH_CARRY_V2 })
  const providerIdentities = f.binding.providerIdentities.map(p => ({ ...p, executableRoot, budgetRoot: allocation.root, harnessRoot: allocation.harnessRoot })), binding = { ...f.binding, allocation, providerIdentities }
  const transport = composer.leanCorrectionInvocationTransportBinding(request, "v8")
  const evidence = { identity: providerIdentities[0]!, invocationRoot: r(50), requestId: `effect:v1.19:${"a".repeat(64)}`, method: request.methodName, inputRoot: transport.inputRoot, ordinal: 0, charged: true, completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false }, violation: { type: "INVALID_OUTPUT", message: "ERROR_STDIO_PRIVATE_SENTINEL" } } } as any
  const origin = { schemaVersion: "v1.38-lean-startup-origin-v8", allocationRoot: allocation.root, chargeRoot: binding.debitRoot, seat: "bottom", policyRoot: LEAN_STARTUP_POLICY_V5.root, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())), requestOrdinal: 1, requestRoot: transport.requestRoot, method: request.methodName, inputRoot: transport.inputRoot, sourceRoot: evidence.identity.sourceRoot, executableRoot, stage: "startup", branch: "lifecycle_failure", ready: false, go: false, wait: "changed", termination: "completed", unknown: true, constructorDurationBucket: "0_9ms", prefixMilestone: "not_entered", readyPublicationDurationBucket: "unknown", finalAtomicState: "state_0", lifecycleBeforeTermination: "exit_seen", deadlineOutcome: "unknown" } as any
  const snapshots = allocation.sources.map(s => ({ root: s.snapshotRoot, sourceRoot: s.sourceRoot, role: s.role, source: "NEVER_EXECUTED", packet: {}, proposal: {}, validation: {} }))
  let created = 0
  const mocks = [
    vi.spyOn(authority, "readLeanPrivateMatchContextV2").mockReturnValue({ allocation, slot: allocation.slots[0], debitRoot: binding.debitRoot, storePath: "INERT_NO_STORE" }),
    vi.spyOn(authority, "checkpointLeanPrivateMatchV2").mockImplementation(() => {}),
    vi.spyOn(authority, "issueLeanPrivateMatchRuntimeAuthorityV2").mockReturnValue({} as never),
    vi.spyOn(source, "validateLeanBaselineSource").mockImplementation(v => v as never),
    vi.spyOn(admissions, "admitFactory").mockReturnValue({} as never),
    vi.spyOn(admissions, "authorizeFactorySupervision").mockReturnValue({} as never),
    vi.spyOn(revisions, "buildStrategyRevision").mockReturnValue({ id: "inert-revision", validation: { valid: true }, metadata: { sourceArtifact: { bytesBase64: Buffer.from(executableSource).toString("base64"), hash: executableRoot.slice(7) } } } as never),
    vi.spyOn(lifetime, "prospectiveLeagueRuntimeBinding").mockReturnValue({} as never),
    vi.spyOn(runtime, "createFactorySupervisedRuntime").mockImplementation(options => ({ identity: providerIdentities[created++]!, async invoke() { if (observed) options.startupOriginObserver?.observe(origin); return evidence }, verify(e: unknown) { return e === evidence }, close() { return { cleanupComplete: true, orphanedChild: false } } }) as never),
    vi.spyOn(runtime, "getFactoryPrivateDiagnostic").mockImplementation((_p, e) => e === evidence ? { stage: "executor", reason: "unknown", identity: evidence.identity, invocationRoot: evidence.invocationRoot, requestId: evidence.requestId, inputRoot: evidence.inputRoot, method: evidence.method, ordinal: evidence.ordinal } as never : undefined),
    vi.spyOn(bridge, "runCanonicalLabMatch").mockImplementation(async options => { await Object.values(options.providers)[0]!.invoke({ kind: request.methodName, input: request.input } as never, {} as never); return { kind: "failure", privacy: "private_offline", transitions: [], accounting: [evidence], unchangedState: null, failure: { classification: "system_failure", code: "LAB_SUPERVISOR_FAILURE" } } as never }),
  ]
  try {
    const result = await composer.runLeanPrivateFeasibilityMatchV2({ admission: {} as never, debit: {} as never, bottom: snapshots[0] as never, top: snapshots[1] as never, register() {}, unregister() {} })
    const produce = (route as any).produceLeanPrivateStartupReceiptV1, verify = (route as any).verifyLeanPrivateStartupReceiptV1
    expect(produce).toBeTypeOf("function"); expect(verify).toBeTypeOf("function")
    const projected = produce({ result, binding, trustedRequest: request })
    expect(projected.schemaVersion).toBe("lean-private-startup-receipt-v1")
    expect(Object.keys(projected).sort()).toEqual(["schemaVersion", "availability", "identity", "origin", "invocationBinding"].sort())
    expect(projected.availability).toBe(observed ? "available" : "unavailable")
    expect(verify({ value: projected, binding, accounting: result.privateActual!.accounting, trustedRequest: request })).toEqual({ verified: true })
    expect(() => produce({ result: { ...result }, binding, trustedRequest: request })).toThrow()
    expect(JSON.stringify(projected)).not.toContain("PRIVATE_SENTINEL")
    expect(Object.keys(composer.readLeanPrivateMatchDiagnosticV2(result)!).sort()).toEqual(["availability", "originAvailability", "stage", "reason", "code", "identity", "invocationRoot", "requestId", "inputRoot", "method", "ordinal"].sort())
    if (!observed) { expect(projected).toEqual({ schemaVersion: "lean-private-startup-receipt-v1", availability: "unavailable", identity: null, origin: null, invocationBinding: null }); return }
    const run = (value: unknown, extra: Record<string, unknown> = {}) => verify({ value, binding, accounting: result.privateActual!.accounting, trustedRequest: request, ...extra })
    for (const key of ["sourceRoot", "executableRoot", "budgetRoot", "attemptRoot", "harnessRoot", "factoryPacketRoot", "factoryProposalRoot", "factoryValidationRoot", "tupleRoot", "runtimeLimitsRoot"]) expect(() => run({ ...projected, identity: { ...projected.identity, [key]: r(99) } })).toThrow()
    for (const key of ["allocationRoot", "chargeRoot", "harnessRoot", "sourceRoot", "executableRoot", "inputRoot", "requestRoot", "policyRoot"]) expect(() => run({ ...projected, origin: { ...projected.origin, [key]: r(99) } })).toThrow()
    for (const key of ["invocationRoot", "inputRoot", "sourceRoot", "executableRoot", "requestRoot", "payloadRoot"]) expect(() => run({ ...projected, invocationBinding: { ...projected.invocationBinding, [key]: r(99) } })).toThrow()
    for (const mutation of [{ seat: "top" }, { method: "soldierBrain" }, { ordinal: 1 }, { requestOrdinal: 2 }, { requestId: "invalid" }, { schemaVersion: "wrong" }, { extra: "PRIVATE_SENTINEL" }, { ordinal: Number.NaN }, { requestOrdinal: Number.MAX_SAFE_INTEGER + 1 }]) expect(() => run({ ...projected, invocationBinding: { ...projected.invocationBinding, ...mutation } })).toThrow()
    for (const mutation of [{ schemaVersion: "wrong" }, { extra: "PRIVATE_SENTINEL" }, { availability: "unknown" }, { identity: null }]) expect(() => run({ ...projected, ...mutation })).toThrow()
    expect(() => run(projected, { accounting: [evidence, evidence] })).toThrow()
    expect(() => run(projected, { binding: { ...binding, providerIdentities: [] } })).toThrow()
    expect(() => run(projected, { trustedRequest: { ...request, input: {} } })).toThrow()
    expect(() => run(projected, { trustedRequest: { ...request, source: "SUBSTITUTION" } })).toThrow()
    const otherTransport = composer.leanCorrectionInvocationTransportBinding({ ...request, outputByteLimit: 1 }, "v8")
    expect(() => run({ ...projected, origin: { ...projected.origin, requestRoot: otherTransport.requestRoot }, invocationBinding: { ...projected.invocationBinding, requestRoot: otherTransport.requestRoot, payloadRoot: otherTransport.payloadRoot } })).toThrow()
    expect(() => run({ ...projected, identity: { ...projected.identity, image: "é".repeat(4096) } })).toThrow()
    expect(() => run({ ...projected, origin: { ...projected.origin, constructorDurationBucket: "unknown-private-text" } })).toThrow()
  } finally { for (const mock of mocks) mock.mockRestore() }
})
const pathFixture = vi.hoisted(() => ({ store: "" }))
vi.mock("node:path", async importOriginal => {
  const actual = await importOriginal<typeof import("node:path")>()
  return { ...actual, resolve: (...parts: string[]) => pathFixture.store && parts[0] === ".strategy-lab/lean-private-matches-v2" ? pathFixture.store : actual.resolve(...parts) }
})
const gitCalls = vi.hoisted(() => ({ calls: [] as Array<{ program: string; args: string[]; options: Record<string, unknown> }>, responses: [] as Buffer[] }))
vi.mock("node:child_process", async importOriginal => {
  const actual = await importOriginal<typeof import("node:child_process")>()
  return { ...actual, execFileSync: (program: string, args: string[], options: Record<string, unknown>) => { gitCalls.calls.push({ program, args, options }); return gitCalls.responses.shift() ?? Buffer.from("INERT_METADATA_NOT_AUTHORITY") } }
})

const r = (n: number) => labRoot("inert-private-pair-fixture", n)
const fixture = () => {
  const sources = (["tactical-0", "cold-opponent"] as const).map((role, n) => ({ role, rawRoot: r(n + 1), snapshotRoot: r(n + 3), sourceRoot: r(n + 5), sourceBytes: 1, fileBytes: 1, structureRoot: r(n + 7), packetRoot: r(n + 9), proposalRoot: r(n + 11), validationRoot: r(n + 13), coldRoot: r(15), implementationRoot: r(16), executableRoot: r(n + 17) })) as unknown as LeanPrivateMatchAllocationV1["sources"]
  const rows = [{ name: "scripts/inert.ts", rawRoot: r(20), bytes: 1, allocatedBytes: 4096 }]
  const carryBody = { failedRoot: r(21), successRoot: r(22), retainedBytes: 65536 as const }
  const allocation = route.createLeanPrivateMatchAllocationV1({ sourceHead: "a".repeat(40), sources, sourcePrefix: { root: labRoot("lean-private-match-source-prefix-v1", rows), allocatedBytes: 4096, rows }, priorProbeCarry: { ...carryBody, root: labRoot("lean-private-match-probe-carry-v1", carryBody) } })
  const debitRoot = r(24), bottom = `lean-source-${sources[0].sourceRoot.slice(7)}`, top = `lean-source-${sources[1].sourceRoot.slice(7)}`
  const providerIdentities = sources.map(s => ({ revisionId: "inert-revision", sourceRoot: s.sourceRoot, executableRoot: s.executableRoot!, tupleId: allocation.tupleId, tupleRoot: allocation.tupleRoot, image: allocation.image, harnessRoot: allocation.harnessRoot, budgetRoot: allocation.root, attemptRoot: debitRoot, runtimeLimitsRoot: allocation.runtimeLimitsRoot, nativeLane: { language: "typescript", providerId: "lean-offline-mechanics", runtimeAbi: "strategy-runtime-abi-v1.19", runtimeProfileRoot: allocation.runtimeLimitsRoot, translation: "none" }, factoryPacketRoot: s.packetRoot, factoryProposalRoot: s.proposalRoot, factoryValidationRoot: s.validationRoot }))
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1")!
  const start = { matchId: `lean-${debitRoot.slice(7, 31)}`, phase: "ROUND", phaseNumber: 1, roundNumber: 1, activationCount: 1, initiativePlayerId: bottom, bounds: arena.initialBounds, soldiers: [...BOTTOM_STARTING_POSITIONS.map((position, n) => ({ id: `bottom-soldier-${n + 1}`, ownerPlayerId: bottom, status: "ACTIVE", position, facing: "UP", lastSuccessfulMoveDirection: null, soldierMemory: { secret: "PRIVATE_SENTINEL" } })), ...TOP_STARTING_POSITIONS.map((position, n) => ({ id: `top-soldier-${n + 1}`, ownerPlayerId: top, status: "ACTIVE", position, facing: "DOWN", lastSuccessfulMoveDirection: null, soldierMemory: { secret: "PRIVATE_SENTINEL" } }))], terrainStones: arena.terrainStones, outcome: null, players: [{ strategyMemory: "PRIVATE_SENTINEL" }], input: "PRIVATE_SENTINEL" }
  const final = { ...start, phase: "COMPLETE", outcome: { type: "DRAW", reason: "PRIVATE_SENTINEL" } }
  const accounting = providerIdentities.map((identity, n) => ({ identity, invocationRoot: r(30 + n), requestId: `effect:v1.19:${String(n + 1).repeat(64)}`, method: "selectActivations", inputRoot: r(32 + n), ordinal: 0, charged: true, completed: true, outputBytes: 1, result: { ok: true, value: { input: "PRIVATE_SENTINEL" } } }))
  const descriptor = accounting.map(a => ({ identity: a.identity, invocationRoot: a.invocationRoot, requestId: a.requestId, method: a.method, inputRoot: a.inputRoot, ordinal: a.ordinal, charged: a.charged, completed: a.completed, outputBytes: a.outputBytes, classification: "success" }))
  const compact = { classification: "success" as const, code: "OK" as const, outcome: "DRAW" as const, elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", descriptor)), executionRoot: r(40), telemetry: { transitions: 1, events: 0 } }
  const actual = { kind: "completed", privacy: "private_offline", transitions: [{ beforeState: start, afterState: final, events: [{ payload: "PRIVATE_SENTINEL" }] }], result: { state: final, events: [] }, accounting } as unknown as LabMatchExecution
  return { allocation, binding: { allocation, ordinal: 0 as const, debitRoot, providerIdentities }, actual, compact }
}

it.each([false, true, "unavailable", "duplicate", "invalid-code", "bad-origin", "close-throws", "publication-throws"] as const)("real composer return→producer→actual retained reader keeps finite diagnostics, origin=%s", async origin => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-one-match-connected-"))); chmodSync(directory, 0o700)
  const canonical = (v: unknown) => Buffer.from(leanCanonicalBytes(v)), rooted = (b: { schemaVersion: string; [key: string]: unknown }) => ({ ...b, root: labRoot(b.schemaVersion, b) })
  const f = fixture(), prefix = { ...f.allocation.sourcePrefix, root: labRoot("lean-private-match-source-prefix-v2", f.allocation.sourcePrefix.rows) }
  const allocation = route.createLeanPrivateMatchAllocationV2({ sourceHead: f.allocation.sourceHead, sources: f.allocation.sources, sourcePrefix: prefix, priorProbeCarry: f.allocation.priorProbeCarry, priorMatchCarry: authority.LEAN_PRIVATE_MATCH_CARRY_V2 })
  const resources = { windowRoot: authority.LEAN_PRIVATE_MATCH_WINDOW_V2.root, allocationRoot: allocation.root, wallAtMs: 1791738781000, cumulativeElapsedMs: 390839903, remainingSlots: 1, historicalCharged: 41, historicalAllocatedBytes: 29970432, priorProbeBytes: 65536, priorMatchBytes: 360448, sourceAllocatedBytes: prefix.allocatedBytes, newAllocatedBytes: 4096, retainedBytesUpperBound: 29970432 + 65536 + 360448 + prefix.allocatedBytes + 4096 + 67108864 + 16777216 + 262144, parentRssBytes: 100000000, aggregateMemoryUpperBound: 100000000 + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: 2000000000 }
  const allocationCommit = "b".repeat(40), emptyRoot = leanBytesRoot(Buffer.alloc(0)), slot = allocation.slots[0]
  const pair = rooted({ schemaVersion: "lean-private-match-pair-v2", allocationRoot: allocation.root, slotRoot: slot.root, ordinal: 0, requestRoot: slot.requestRoot, sources: allocation.sources, priorLedgerBytesRoot: emptyRoot, priorLedgerByteLength: 0 })
  const debit = rooted({ schemaVersion: "lean-private-match-debit-v2", allocationRoot: allocation.root, slotRoot: slot.root, ordinal: 0, requestRoot: slot.requestRoot, pairRoot: pair.root, cumulativeCharged: 42, priorLedgerBytesRoot: emptyRoot, priorLedgerByteLength: 0, resources })
  const providerIdentities = f.binding.providerIdentities.map(p => ({ ...p, budgetRoot: allocation.root, attemptRoot: debit.root })), binding = { ...f.binding, allocation, debitRoot: debit.root, providerIdentities }
  const evidence = { identity: providerIdentities[0]!, invocationRoot: r(50), requestId: `effect:v1.19:${"a".repeat(64)}`, method: "soldierBrain", inputRoot: r(51), ordinal: 0, charged: true, completed: false, outputBytes: 0, result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false }, violation: { type: "INVALID_OUTPUT", message: "PRIVATE_SENTINEL" } } }
  if (origin === "invalid-code") evidence.result.systemFailure.code = "PRIVATE_SENTINEL"
  const actual = { kind: "failure", privacy: "private_offline", transitions: [], accounting: origin === "unavailable" ? [] : origin === "duplicate" ? [evidence, evidence] : [evidence], unchangedState: null, failure: { classification: "system_failure", code: "LAB_SUPERVISOR_FAILURE" } } as unknown as LabMatchExecution
  const snapshots = providerIdentities.map((p, n) => ({ role: n === 0 ? "tactical-0" : "cold-opponent", sourceRoot: p.sourceRoot, root: allocation.sources[n]!.snapshotRoot, source: "INERT_NEVER_EXECUTED", packet: {}, proposal: {}, validation: {} }))
  let created = 0
  const mocks: Array<{ mockRestore(): void }> = [
    vi.spyOn(authority, "readLeanPrivateMatchContextV2").mockReturnValue({ allocation, slot: allocation.slots[0], debitRoot: binding.debitRoot, storePath: directory }),
    vi.spyOn(authority, "checkpointLeanPrivateMatchV2").mockImplementation(() => {}),
    vi.spyOn(authority, "issueLeanPrivateMatchRuntimeAuthorityV2").mockReturnValue({} as never),
    vi.spyOn(source, "validateLeanBaselineSource").mockImplementation(v => v as never),
    vi.spyOn(admissions, "admitFactory").mockReturnValue({} as never),
    vi.spyOn(admissions, "authorizeFactorySupervision").mockReturnValue({} as never),
    vi.spyOn(revisions, "buildStrategyRevision").mockReturnValue({ id: "inert-revision", validation: { valid: true }, metadata: { sourceArtifact: { bytesBase64: "", hash: "a".repeat(64) } } } as never),
    vi.spyOn(lifetime, "prospectiveLeagueRuntimeBinding").mockReturnValue({} as never),
    vi.spyOn(runtime, "createFactorySupervisedRuntime").mockImplementation(() => ({ identity: providerIdentities[created++]!, invoke() { throw new Error("NO_RUNTIME_ALLOWED") }, verify(e: unknown) { return e === evidence }, close() { return { cleanupComplete: true, orphanedChild: false } } }) as never),
    vi.spyOn(runtime, "getFactoryPrivateDiagnostic").mockImplementation((_provider, e) => (origin === true || origin === "bad-origin") && e === evidence ? { stage: "stream_exchange", reason: "wait_timeout", identity: evidence.identity, invocationRoot: origin === "bad-origin" ? r(99) : evidence.invocationRoot, requestId: evidence.requestId, inputRoot: evidence.inputRoot, method: evidence.method, ordinal: evidence.ordinal } as never : undefined),
    vi.spyOn(bridge, "runCanonicalLabMatch").mockResolvedValue(actual),
    vi.spyOn(authority, "authenticateLeanPrivateMatchCommitV2").mockImplementation(() => {}),
    vi.spyOn(authority, "authenticateLeanPrivateMatchCarryV2").mockReturnValue(allocation.priorMatchCarry),
    vi.spyOn(authority, "authenticateLeanPrivateMatchProbeCarryV1").mockReturnValue(allocation.priorProbeCarry),
    vi.spyOn(authority, "inspectLeanPrivateMatchPrefixV2").mockReturnValue(prefix),
    vi.spyOn(authority, "inspectLeanPrivateMatchSourceV1").mockImplementation((_d, role) => ({ ...allocation.sources.find(s => s.role === role)!, executableRoot: null })),
  ]
  pathFixture.store = directory
  const clock = vi.spyOn(Date, "now").mockReturnValue(1791738781000)

  const write = (name: string, v: unknown) => writeFileSync(join(directory, name), canonical(v), { mode: 0o600 })
  try {
    if (origin === "close-throws" || origin === "publication-throws") {
      write("allocation.json", allocation)
      let debits = 0, terminalBeforeClose: Buffer | undefined
      mocks.push(
        vi.spyOn(authority, "observeLeanPrivateMatchCapacityV2").mockReturnValue({} as never),
        vi.spyOn(authority, "openLeanPrivateMatchAdmissionV2").mockImplementation(() => {
          write("entry.json", rooted({ schemaVersion: "lean-private-match-entry-v2", allocationRoot: allocation.root, allocationDigest: leanBytesRoot(canonical(allocation)), allocationCommit, sourceHead: allocation.sourceHead, resources }))
          writeFileSync(join(directory, "ledger.ndjson"), "", { mode: 0o600 }); return {} as never
        }),
        vi.spyOn(authority, "recordLeanPrivateMatchDebitV2").mockImplementation(() => {
          debits++; write("pair-0.json", pair); write("debit-0.json", debit)
          writeFileSync(join(directory, "ledger.ndjson"), Buffer.concat([canonical(debit), Buffer.from("\n")]), { mode: 0o600 }); return {} as never
        }),
        vi.spyOn(authority, "observeLeanPrivateMatchResourcesV2").mockReturnValue({ ...resources, priorProbeBytes: 65536, historicalCharged: 41, priorMatchBytes: 360448, remainingSlots: 0 }),
        vi.spyOn(authority, "closeLeanPrivateMatchDebitV2").mockImplementation(() => { terminalBeforeClose = readFileSync(join(directory, "terminal-0.json")); throw new Error("PRIVATE_SENTINEL") }),
        vi.spyOn(source, "readLeanBaselineSource").mockImplementation((_store, role) => snapshots.find(s => s.role === role) as never),
      )
      if (origin === "publication-throws") {
        const originalWrite = authority.writeLeanPrivateMatchFileV1
        let terminalWrites = 0
        mocks.push(vi.spyOn(authority, "writeLeanPrivateMatchFileV1").mockImplementation((path, bytes, maximum) => {
          originalWrite(path, bytes, maximum)
          if (path === join(directory, "terminal-0.json")) { terminalWrites++; terminalBeforeClose = readFileSync(path); throw new Error("INERT_UNCERTAIN_PUBLICATION") }
        }))
        await expect(route.enterLeanPrivateMatchesV2({ command: "entry", store: directory, allocationCommit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2 })).rejects.toThrow("LEAN_PRIVATE_MATCH_ROUTE")
        expect(terminalWrites).toBe(1); expect(debits).toBe(1); expect(created).toBe(2)
        expect(readFileSync(join(directory, "terminal-0.json"))).toEqual(terminalBeforeClose)
        expect(readdirSync(directory)).not.toContain("result.json")
        expect(authority.closeLeanPrivateMatchDebitV2).not.toHaveBeenCalled()
        return
      }
      await expect(route.enterLeanPrivateMatchesV2({ command: "entry", store: directory, allocationCommit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2 })).resolves.toMatchObject({ attemptedCount: 1 })
      expect(debits).toBe(1); expect(created).toBe(2); expect(bridge.runCanonicalLabMatch).toHaveBeenCalledTimes(1)
      expect(readFileSync(join(directory, "terminal-0.json"))).toEqual(terminalBeforeClose)
      expect(readFileSync(join(directory, "ledger.ndjson"), "utf8").trim().split("\n")).toHaveLength(1)
      expect(readdirSync(directory).filter(n => n.startsWith("terminal-"))).toEqual(["terminal-0.json"])
      expect(route.verifyLeanPrivateMatchesStoreV2({ command: "verify", store: directory, allocationCommit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2 })).toMatchObject({ verified: true, stopCode: "CLEANUP_STOP", attemptedCount: 1, feasibilityEstablished: false })
      expect(readFileSync(join(directory, "result.json"), "utf8")).not.toContain("PRIVATE_SENTINEL")
      return
    }
    if (origin === "duplicate" || origin === "invalid-code" || origin === "bad-origin") {
      await expect(composer.runLeanPrivateFeasibilityMatchV2({ admission: { schemaVersion: "lean-private-match-admission-v2" } as never, debit: {} as never, bottom: snapshots[0] as never, top: snapshots[1] as never, register() {}, unregister() {} })).rejects.toThrow()
      return
    }
    const result = await composer.runLeanPrivateFeasibilityMatchV2({ admission: { schemaVersion: "lean-private-match-admission-v2" } as never, debit: {} as never, bottom: snapshots[0] as never, top: snapshots[1] as never, register() {}, unregister() {} })
    expect(created).toBe(2)
    const streamPath = join(directory, "replay-0.ndjson"), produced = route.produceLeanPrivateMatchEvidenceV2({ binding, result, streamPath, guard() {} })
    expect(produced.diagnostic).toMatchObject(origin === "unavailable" ? { availability: "unavailable", code: "UNKNOWN", identity: null } : { availability: "available", originAvailability: origin ? "available" : "unavailable", code: "SUBPROCESS_SIGNAL", stage: origin ? "stream_exchange" : "unknown", reason: origin ? "wait_timeout" : "unknown" })
    const actualBinding = { ...binding, debitRoot: r(24) }
    // Fixed inert debit must already join the issued providers and diagnostic.
    expect(() => route.verifyLeanPrivateMatchEvidenceV2({ binding: actualBinding, evidence: produced, streamPath })).toThrow()
    const terminal = rooted({ schemaVersion: "lean-private-match-terminal-v2", allocationRoot: allocation.root, debitRoot: binding.debitRoot, slotRoot: slot.root, ordinal: 0, elapsedMs: 1, resources: { ...resources, remainingSlots: 0 }, providerIdentities, evidence: produced })
    const anchor = { ordinal: 0, root: terminal.root, rawRoot: leanBytesRoot(canonical(terminal)), streamRawRoot: produced.streamRawRoot, rowCount: produced.rowCount, streamBytes: produced.streamBytes }
    expect(route.verifyLeanPrivateMatchTerminalV2({ binding, terminal, resultAnchor: anchor, streamPath }).verified).toBe(true)
    for (const mutate of [ { code: "PRIVATE_SENTINEL" }, { ordinal: 1 }, { requestId: "wrong" }, { inputRoot: r(99) }, { invocationRoot: r(99) }, { method: "selectActivations" }, { extra: "PRIVATE_SENTINEL" }, { schemaVersion: "wrong" } ]) {
      const modified = { ...produced, diagnostic: { ...produced.diagnostic, ...mutate } }
      expect(() => route.verifyLeanPrivateMatchEvidenceV2({ binding, evidence: modified, streamPath })).toThrow()
    }
    const tampered = { ...terminal, evidence: { ...produced, diagnostic: { ...produced.diagnostic, code: "MALFORMED_IPC" } } }; delete (tampered as Partial<typeof terminal>).root
    const rerooted = rooted(tampered)
    expect(() => route.verifyLeanPrivateMatchTerminalV2({ binding, terminal: rerooted, resultAnchor: anchor, streamPath })).toThrow()
    expect(JSON.stringify(produced)).not.toContain("PRIVATE_SENTINEL")
    write("allocation.json", allocation); write("entry.json", rooted({ schemaVersion: "lean-private-match-entry-v2", allocationRoot: allocation.root, allocationDigest: leanBytesRoot(canonical(allocation)), allocationCommit, sourceHead: allocation.sourceHead, resources })); write("pair-0.json", pair); write("debit-0.json", debit)
    writeFileSync(join(directory, "ledger.ndjson"), Buffer.concat([canonical(debit), Buffer.from("\n")]), { mode: 0o600 }); write("terminal-0.json", terminal)
    write("result.json", rooted({ schemaVersion: "lean-private-match-result-v2", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, allocationCommit, matchCount: 1, attemptedOrdinals: [0], unattemptedOrdinals: [], cumulativeCharged: 42, terminals: [anchor], stopCode: "CLEANUP_STOP", fullChronicleVerified: false }))
    const before = readdirSync(directory).map(name => readFileSync(join(directory, name)))
    expect(route.verifyLeanPrivateMatchesStoreV2({ command: "verify", store: directory, allocationCommit, allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V2 })).toMatchObject({ verified: true, feasibilityEstablished: false, attemptedCount: 1 })
    expect(readdirSync(directory).map(name => readFileSync(join(directory, name)))).toEqual(before)
  } finally { pathFixture.store = ""; clock.mockRestore(); for (const mock of mocks.reverse()) mock.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
})

describe("dedicated private two-Match HOST route", () => {
  it.each(["composer", "guard", "cap", "terminal-observer", "second-capacity"])("retains charged/partial evidence after inert %s refusal", async fault => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-stop-"))), f = fixture()
    const resources = { windowRoot: LEAN_PRIVATE_MATCH_WINDOW_V1.root, allocationRoot: f.allocation.root, wallAtMs: 1791669996000, cumulativeElapsedMs: 322054903, remainingSlots: 2, historicalCharged: 40, historicalAllocatedBytes: 29970432, priorProbeBytes: 65536, sourceAllocatedBytes: 4096, newAllocatedBytes: 4096, retainedBytesUpperBound: 29970432 + 65536 + 4096 + 4096 + 2 * (67108864 + 16777216) + 262144, parentRssBytes: 100000000, aggregateMemoryUpperBound: 100000000 + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: 2000000000 }
    const write = (name: string, value: unknown) => writeFileSync(join(directory, name), leanCanonicalBytes(value), { mode: 0o600 })
    write("allocation.json", f.allocation)
    const clock = vi.spyOn(Date, "now").mockReturnValue(1791669996000)
    const open = vi.spyOn(authority, "openLeanPrivateMatchAdmissionV1").mockImplementation(() => {
      write("entry.json", { resources }); writeFileSync(join(directory, "ledger.ndjson"), "", { mode: 0o600 }); return {} as ReturnType<typeof authority.openLeanPrivateMatchAdmissionV1>
    })
    let capacities = 0, debits = 0
    const capacity = vi.spyOn(authority, "observeLeanPrivateMatchCapacityV1").mockImplementation(() => {
      if (++capacities === 3 && fault === "second-capacity") throw new Error("PRIVATE_SENTINEL")
      return {} as ReturnType<typeof authority.observeLeanPrivateMatchCapacityV1>
    })
    const debit = vi.spyOn(authority, "recordLeanPrivateMatchDebitV1").mockImplementation(() => {
      debits++; const row = { ordinal: 0, root: f.binding.debitRoot, resources }
      write("debit-0.json", row); write("pair-0.json", {}); writeFileSync(join(directory, "ledger.ndjson"), Buffer.concat([Buffer.from(leanCanonicalBytes(row)), Buffer.from("\n")]), { mode: 0o600 })
      return {} as ReturnType<typeof authority.recordLeanPrivateMatchDebitV1>
    })
    const context = vi.spyOn(authority, "readLeanPrivateMatchContextV1").mockReturnValue({ allocation: f.allocation, slot: f.allocation.slots[0], debitRoot: f.binding.debitRoot, storePath: directory })
    const sourceRead = vi.spyOn(source, "readLeanBaselineSource").mockReturnValue({} as ReturnType<typeof source.readLeanBaselineSource>)
    const run = vi.spyOn(composer, "runLeanPrivateFeasibilityMatch").mockImplementation(async () => {
      if (fault === "composer") throw new Error("PRIVATE_SENTINEL")
      const actual = fault === "cap" ? { ...f.actual, transitions: Array.from({ length: 65537 }, () => f.actual.transitions[0]!) } : f.actual
      const compact = fault === "cap" ? { ...f.compact, telemetry: { transitions: 65537, events: 0 } } : f.compact
      return { compact, privateActual: actual, privateProviderIdentities: f.binding.providerIdentities, semanticRoot: r(41) } as unknown as Awaited<ReturnType<typeof composer.runLeanPrivateFeasibilityMatch>>
    })
    let checkpoints = 0
    const checkpoint = vi.spyOn(authority, "checkpointLeanPrivateMatchV1").mockImplementation(() => { if (fault === "guard" && ++checkpoints === 2) throw new Error("PRIVATE_SENTINEL") })
    const observe = vi.spyOn(authority, "observeLeanPrivateMatchResourcesV1").mockImplementation(() => {
      if (fault === "terminal-observer") throw new Error("PRIVATE_SENTINEL")
      return { ...resources, remainingSlots: 1, historicalCharged: 40, priorProbeBytes: 65536 }
    })
    const close = vi.spyOn(authority, "closeLeanPrivateMatchDebitV1").mockReturnValue(true)
    try {
      const result = await route.enterLeanPrivateMatchesV1({ command: "entry", store: directory, allocationCommit: "b".repeat(40), allocationPath: authority.LEAN_PRIVATE_MATCH_ARTIFACT_V1 })
      expect(result.attemptedCount).toBe(1); expect(debits).toBe(1); expect(run).toHaveBeenCalledTimes(1)
      const terminal = JSON.parse(readFileSync(join(directory, "terminal-0.json"), "utf8")), aggregate = JSON.parse(readFileSync(join(directory, "result.json"), "utf8"))
      expect(aggregate.cumulativeCharged).toBe(41); expect(aggregate.unattemptedOrdinals).toEqual([1])
      expect(aggregate.stopCode).toBe(fault === "second-capacity" ? "ADMISSION_STOP" : "CHARGED_ATTEMPT_STOP")
      expect(JSON.stringify(terminal)).not.toContain("PRIVATE_SENTINEL")
      if (fault !== "second-capacity") {
        expect(terminal.evidence).toMatchObject({ classification: "system_failure", boardEvidenceAvailable: false, rowCount: 0 })
        expect(terminal.evidence.cleanupComplete).toBe(fault === "composer" ? null : true)
        expect(terminal.providerIdentities).toHaveLength(fault === "composer" ? 0 : 2)
        if (fault === "guard") { expect(terminal.evidence.observed.executionRoot).toBe(f.compact.executionRoot); expect(terminal.evidence.partialStream.bytes).toBeGreaterThan(0) }
      } else expect(terminal.evidence.classification).toBe("success")
      expect(route.verifyLeanPrivateMatchTerminalV1({ binding: { ...f.binding, providerIdentities: terminal.providerIdentities }, terminal, resultAnchor: aggregate.terminals[0], streamPath: join(directory, "replay-0.ndjson") }).verified).toBe(true)
      if (fault === "guard") {
        const before = readFileSync(join(directory, "replay-0.ndjson")); writeFileSync(join(directory, "replay-0.ndjson"), Buffer.concat([before, Buffer.from("x")]))
        expect(() => route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal, resultAnchor: aggregate.terminals[0], streamPath: join(directory, "replay-0.ndjson") })).toThrow()
      }
      expect(close).toHaveBeenCalledTimes(fault === "second-capacity" ? 1 : 0)
    } finally {
      for (const mock of [clock, open, capacity, debit, context, sourceRead, run, checkpoint, observe, close]) mock.mockRestore()
      rmSync(directory, { recursive: true, force: true })
    }
  })
  it("uses only finite Git metadata commands with safe argv/timeout/output caps", () => {
    const commit = "a".repeat(40)
    gitCalls.calls.length = 0
    for (const args of [["rev-parse", "HEAD"], ["rev-list", "--parents", "-n", "1", commit], ["show", `${commit}:.planning/artifacts/v1.38-phase-265-private-match-allocation-v1.json`], ["diff", "--name-only", "dd67460e6628aebff6bc35c253adaa2cdfea284e", commit], ["show", `${commit}:scripts/inert.ts`], ["diff", "--name-only", "HEAD", "--", "scripts/run-v1-38-lean-private-matches.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-container-match-session.ts"]]) readLeanPrivateMatchGitV1(args)
    expect(gitCalls.calls.map(c => c.options.maxBuffer)).toEqual([128, 256, 65537, 32768, 4194305, 4096])
    expect(gitCalls.calls.every(c => c.program === "git" && c.options.timeout === 1500 && JSON.stringify(c.options.stdio) === '["ignore","pipe","ignore"]')).toBe(true)
    const count = gitCalls.calls.length
    for (const args of [["status"], ["show", `${commit}:scripts/../secret`], ["show", `${commit}:scripts/a\nb`], ["show", `${commit}:scripts/a:b`], ["show", `${commit}:scripts//a`], ["show", `${commit}:(glob)scripts/*`], ["diff", "--name-only", "HEAD", "--", "scripts/inert.ts"], ["show", "HEAD:scripts/inert.ts"], ["show", `${commit}:scripts/inert.ts`, "--"]]) expect(() => readLeanPrivateMatchGitV1(args)).toThrow("LEAN_PRIVATE_MATCH_GIT_METADATA")
    expect(gitCalls.calls).toHaveLength(count)
  })
  it("requires an explicit command and refuses default execution", () => {
    expect(() => route.parseLeanPrivateMatchesArgsV1([])).toThrow()
    expect(() => route.parseLeanPrivateMatchesArgsV1(["run"])).toThrow()
    expect(() => route.parseLeanPrivateMatchesArgsV1(["metadata", "--source-store", "elsewhere"])).toThrow()
  })
  it("refuses a dirty fourth production Git-owner file before source compilation or allocation", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1791669996000)
    gitCalls.responses.push(Buffer.from("a".repeat(40) + "\n"), Buffer.from("scripts/lib/v1-38-lean-container-match-session.ts\n"))
    try {
      expect(() => route.prepareLeanPrivateMatchesV1({ command: "prepare", sourceStore: ".strategy-lab/lean-correction-supervisor-baseline-20261006-v6", sourceHead: "a".repeat(40), candidateRawRoot: r(1), opponentRawRoot: r(2) })).toThrow("LEAN_PRIVATE_MATCH_ROUTE")
      expect(gitCalls.calls.at(-1)?.args).toEqual(["diff", "--name-only", "HEAD", "--", "scripts/run-v1-38-lean-private-matches.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-container-match-session.ts"])
    } finally { clock.mockRestore(); gitCalls.responses.length = 0 }
  })
  it("exports concrete public-board producer and independent compact reader", () => {
    expect(route.projectLeanPrivateBoardV1).toBeTypeOf("function")
    expect(route.produceLeanPrivateMatchEvidenceV1).toBeTypeOf("function")
    expect(route.verifyLeanPrivateMatchEvidenceV1).toBeTypeOf("function")
  })
  it("freezes same seed/arena, distinct slots and absolute-bottom side reversal", () => {
    const { allocation } = fixture()
    expect(allocation.slots.map(s => [s.ordinal, s.condition, s.bottomRole, s.topRole])).toEqual([[0, 0, "tactical-0", "cold-opponent"], [1, 2, "cold-opponent", "tactical-0"]])
    expect(allocation.slots[0].root).not.toBe(allocation.slots[1].root)
    expect(allocation.seed).toBe("phase265-private-two-match-20261010")
  })
  it("connects actual safe producer to O_RDONLY reader without private material or writes", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-evidence-"))), streamPath = join(directory, "board.ndjson"), f = fixture()
    try {
      const evidence = route.produceLeanPrivateMatchEvidenceV1({ ...f, semanticRoot: r(41), streamPath, guard() {} })
      const before = readFileSync(streamPath), inventory = readdirSync(directory)
      expect(before.toString("utf8")).not.toMatch(/PRIVATE_SENTINEL|soldierMemory|strategyMemory|payload|players/)
      expect(evidence.fullChronicleVerified).toBe(false)
      expect(route.verifyLeanPrivateMatchEvidenceV1({ binding: f.binding, evidence, streamPath })).toMatchObject({ verified: true, fullChronicleVerified: false })
      expect(readFileSync(streamPath)).toEqual(before); expect(readdirSync(directory)).toEqual(inventory)
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it.each(["facing", "coordinate", "drop", "debit", "accounting", "recomputed-frame", "provider"])("rejects %s compact evidence tamper", mutation => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-tamper-"))), streamPath = join(directory, "board.ndjson"), f = fixture()
    try {
      const evidence = route.produceLeanPrivateMatchEvidenceV1({ ...f, semanticRoot: r(41), streamPath, guard() {} })
      const rows = readFileSync(streamPath, "utf8").trim().split("\n").map(line => JSON.parse(line))
      const changed = structuredClone(evidence)
      if (mutation === "facing") delete rows[0].after.soldiers[0].facing
      if (mutation === "coordinate") rows[0].after.soldiers[0].position.x = 100
      if (mutation === "drop") rows.splice(1, 1)
      if (mutation === "debit") rows[0].debitRoot = r(50)
      if (mutation === "accounting") changed.accountingRows[0]!.completed = false
      if (mutation === "provider") changed.accountingRows[0]!.identity.sourceRoot = r(51)
      if (mutation === "recomputed-frame") { rows[1].after.soldiers[0].position.x = 1; rows[1].afterRoot = labRoot("lean-private-board-state-v1", rows[1].after); const { frameRoot: _root, ...body } = rows[1]; rows[1].frameRoot = labRoot("lean-private-board-row-v1", body) }
      writeFileSync(streamPath, Buffer.concat(rows.map(row => Buffer.concat([Buffer.from(leanCanonicalBytes(row)), Buffer.from("\n")]))))
      expect(() => route.verifyLeanPrivateMatchEvidenceV1({ binding: f.binding, evidence: changed, streamPath })).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it("anchors actual producer stream to terminal and result; recomputed terminal with stale result refuses", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "inert-two-match-anchor-"))), streamPath = join(directory, "board.ndjson"), f = fixture()
    try {
      const evidence = route.produceLeanPrivateMatchEvidenceV1({ ...f, semanticRoot: r(41), streamPath, guard() {} })
      const resources = { windowRoot: LEAN_PRIVATE_MATCH_WINDOW_V1.root, allocationRoot: f.allocation.root, wallAtMs: 1791669996000, cumulativeElapsedMs: 322054903, remainingSlots: 1, historicalCharged: 40, historicalAllocatedBytes: 29970432, priorProbeBytes: 65536, sourceAllocatedBytes: 4096, newAllocatedBytes: 4096, retainedBytesUpperBound: 29970432 + 65536 + 4096 + 4096 + 2 * (67108864 + 16777216) + 262144, parentRssBytes: 100000000, aggregateMemoryUpperBound: 100000000 + 2 * 268435456 + 512000000 + 335544320, availableDiskBytes: 2000000000 }
      const body = { schemaVersion: "lean-private-match-terminal-v1", allocationRoot: f.allocation.root, debitRoot: f.binding.debitRoot, slotRoot: f.allocation.slots[0].root, ordinal: 0, elapsedMs: 1, resources, providerIdentities: f.binding.providerIdentities, evidence }
      const terminal = { ...body, root: labRoot(body.schemaVersion, body) }
      const resultAnchor = { ordinal: 0, root: terminal.root, rawRoot: leanBytesRoot(leanCanonicalBytes(terminal)), streamRawRoot: evidence.streamRawRoot, rowCount: evidence.rowCount, streamBytes: evidence.streamBytes }
      expect(route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal, resultAnchor, streamPath }).verified).toBe(true)
      const changedBody = { ...body, elapsedMs: 2 }, changed = { ...changedBody, root: labRoot(body.schemaVersion, changedBody) }
      expect(() => route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal: changed, resultAnchor, streamPath })).toThrow()
      expect(() => route.verifyLeanPrivateMatchTerminalV1({ binding: f.binding, terminal, resultAnchor: { ...resultAnchor, streamBytes: resultAnchor.streamBytes - 1 }, streamPath })).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
})
