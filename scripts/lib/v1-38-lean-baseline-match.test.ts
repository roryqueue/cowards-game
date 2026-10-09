import { describe, it, expect, vi } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { bindLeanCorrectionInvocation, leanBaselineMatchSeed, leanBaselineScenario, leanBaselineSemanticRoot, leanCorrectionInvocationTransportBinding, runLeanBaselineMatch } from "./v1-38-lean-baseline-match.js"
import type { LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"
import * as lean from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as sourceModule from "./v1-38-lean-baseline-source.js"
import * as admissionModule from "../../packages/strategy-lab/src/factory/admission.js"
import * as revisionModule from "../../packages/runtime-js/src/revision.js"
import * as runtimeModule from "./v1-38-factory-supervised-runtime.js"
import * as authorityModule from "./v1-38-lean-experiment-authority.js"
import * as lifetimeModule from "./v1-38-league-prospective-lifetime.js"
import { LAB_ADMITTED_ROOTS } from "../../packages/strategy-lab/src/contracts.js"

const observedBridgeOptions = vi.hoisted(() => vi.fn())
vi.mock("../../packages/strategy-lab/src/runtime-bridge.js", async importOriginal => {
  const actual = await importOriginal<typeof import("../../packages/strategy-lab/src/runtime-bridge.js")>()
  // Fault at construction input before any machine/state or Match can exist;
  // use the actual bridge catch and actual host-issued reader, not a fake brand.
  return { ...actual, runCanonicalLabMatch: (options: Parameters<typeof actual.runCanonicalLabMatch>[0]) => { observedBridgeOptions(options); return actual.runCanonicalLabMatch({ ...options, match: new Proxy(options.match, { get() { throw null }, ownKeys() { throw null } }) }) } }
})

it.each(["v15-3", "v15-4"] as const)("policy cache host attribution actual wrapper opts in only admitted %s", async mode => {
  const r = (n: number) => labRoot("non-authorizing-host-wrapper", n), b = lean.leanResourceWindowPolicyForModeV15(mode)
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: b.charged, elapsedUpperBoundMs: 228267940, allocatedDiskBytes: 27303936, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 970 }, (_, n) => ({ identity: `.strategy-lab/inert-wrapper-${n}`, allocatedBytes: 0 })) }
  const allocation = lean.admitLeanAllocation(lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: r(2), reviewRoot: r(3), coldRoot: r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: [r(7)], seed: "non-authorizing-wrapper", route: "diagnostic", reuseGrantRoot: r(8), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: r(9), dataReviewRoot: r(10), setupAccountingRoot: r(11), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: Number(mode.slice(-1)) as 3 | 4, priorClosureRoot: r(12), continuationRoot: r(13), acceptedReaderCloseRoot: null }, 8))
  const bottom = { sourceRoot: r(5), role: "initial-tactical", source: "inert-no-source-execution", packet: {}, proposal: {}, validation: {} } as any
  const top = { ...bottom, sourceRoot: r(6), role: "initial-teacher" }
  const mocks = [
    vi.spyOn(sourceModule, "validateLeanBaselineSource").mockImplementation(v => v as any),
    vi.spyOn(admissionModule, "admitFactory").mockReturnValue({} as any),
    vi.spyOn(admissionModule, "authorizeFactorySupervision").mockReturnValue({} as any),
    vi.spyOn(revisionModule, "buildStrategyRevision").mockReturnValue({ id: "inert-revision", validation: { valid: true }, metadata: { sourceArtifact: { bytesBase64: "", hash: "a".repeat(64) } } } as any),
    vi.spyOn(lifetimeModule, "prospectiveLeagueRuntimeBinding").mockReturnValue({} as any),
    vi.spyOn(authorityModule, "issueLeanCorrectionRuntimeAuthority").mockReturnValue({} as any),
    vi.spyOn(runtimeModule, "createFactorySupervisedRuntime").mockReturnValue({ identity: { revisionId: "inert-revision", tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image }, close: () => ({ cleanupComplete: true, orphanedChild: false }), invoke: () => { throw Error("inert-no-invoke") }, verify: () => false } as any),
  ]
  try {
    observedBridgeOptions.mockClear()
    const charge = { root: r(20) } as any, slot = allocation.slots[0]!
    const result = await runLeanBaselineMatch({ ledger: { allocation } as any, charge, slot, seed: "non-authorizing-wrapper", bottom, top, correction: { reuse: {} as any }, checkpoint: vi.fn(), register: vi.fn(), unregister: vi.fn() })
    expect(result.compact.classification).toBe("system_failure")
    const bridgeOptions = observedBridgeOptions.mock.calls[0]?.[0] as Parameters<typeof import("../../packages/strategy-lab/src/runtime-bridge.js").runCanonicalLabMatch>[0]
    if (mode === "v15-4") {
      expect(result).toHaveProperty("hostFailureV15", expect.objectContaining({ phase: "machine_construction", code: "HOST_THROW", allocationRoot: allocation.root, chargeRoot: charge.root, slotRoot: slot.root }))
      expect(typeof bridgeOptions.hostClockV15).toBe("function")
      expect(Number.isFinite(bridgeOptions.hostClockV15?.())).toBe(true)
    } else {
      expect(result).not.toHaveProperty("hostFailureV15")
      expect(bridgeOptions).not.toHaveProperty("hostBindingV15")
      expect(bridgeOptions).not.toHaveProperty("hostClockV15")
    }
  } finally { for (const mock of mocks) mock.mockRestore() }
})

describe("current canonical baseline scenario, without provider execution", () => {
  it("preserves arena, source side, initiative and seed in the four exact repeats", () => {
    const input = { coldRoot: labRoot("cold-source-fixture", 1), implementationRoot: labRoot("source-fixture", 1) }
    const bottom = buildLeanBaselineSource({ ...input, role: "initial-tactical", source: emitTacticalSource() })
    const top = buildLeanBaselineSource({ ...input, role: "initial-teacher", source: buildPlannerCandidate().source })
    const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
    for (let condition = 0; condition < 4; condition++) {
      const slot: LeanSlot = { ordinal: 8 + condition, condition: condition as 0 | 1 | 2 | 3, arenaHash: arenas[condition < 2 ? 0 : 1]!.semanticGeometryHash, requestRoot: labRoot("source-fixture-request", condition), root: labRoot("source-fixture-slot", condition) }
      const first = leanBaselineScenario({ seed: "source-fixture", slot, bottom, top })
      const repeated = leanBaselineScenario({ seed: "source-fixture", slot: { ...slot, ordinal: 32 + condition }, bottom, top })
      expect(first).toEqual(repeated)
      expect(first.bottomPlayerId).toContain(bottom.sourceRoot.slice(7))
      expect(first.initialInitiativePlayerId).toBe(condition % 2 === 0 ? first.bottomPlayerId : first.topPlayerId)
      const machine = MATCH_KERNEL.createMachineV119({ matchId: "source-only-realism", seed: first.seed, arenaVariant: first.arena, bottomPlayerId: first.bottomPlayerId, topPlayerId: first.topPlayerId, bottomStrategyRevisionId: "source-bottom", topStrategyRevisionId: "source-top", initialInitiativePlayerId: first.initialInitiativePlayerId })
      expect(machine.state.soldiers).toHaveLength(16)
      expect(machine.state.soldiers.every(s => s.position.x >= 0 && s.position.x < 12 && s.position.y >= 0 && s.position.y < 12)).toBe(true)
      expect(new Set(machine.state.soldiers.map(s => s.position.y))).toEqual(new Set([0, 11]))
    }
    expect(leanBaselineMatchSeed("source-fixture", 32)).toBe(leanBaselineMatchSeed("source-fixture", 8))
  })
  it("normalizes actual identity-dependent engine hashes but preserves private memory keys", () => {
    const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active")!
    const prefix = (matchId: string): LabMatchExecution => {
      const machine = MATCH_KERNEL.createMachineV119({ matchId, seed: "source-only-seed", arenaVariant: arena, bottomPlayerId: "source-bottom", topPlayerId: "source-top", bottomStrategyRevisionId: "source-bottom-revision", topStrategyRevisionId: "source-top-revision", initialInitiativePlayerId: "source-bottom" })
      const step = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (step.kind !== "transition") throw new Error("SOURCE_ONLY_PREFIX")
      // A prefix fixture for hashing, not a completed empirical Match.
      return { kind: "completed", privacy: "private_offline", result: { state: step.machine.state, events: [...step.record.events] }, transitions: [step.record], accounting: [] }
    }
    const one = prefix("source-only-first"), two = prefix("source-only-repeat")
    expect(one.transitions[0]?.beforeMachineHash).not.toBe(two.transitions[0]?.beforeMachineHash)
    expect(leanBaselineSemanticRoot(one)).toBe(leanBaselineSemanticRoot(two))
    const changed = structuredClone(two)
    if (changed.kind !== "completed") throw new Error("SOURCE_ONLY_PREFIX")
    changed.result.state.players[0]!.strategyMemory = { matchId: "private-user-key-preserved" }
    expect(leanBaselineSemanticRoot(changed)).not.toBe(leanBaselineSemanticRoot(one))
  })
})

describe("finite correction diagnostic invocation binding", () => {
  it("joins origin to the actual failed invocation and rejects a re-rooted different invocation", () => {
    const root = (letter: string) => `sha256:${letter.repeat(64)}` as const
    const source = "export function selectActivations(){ return [] }"
    const input = { observation: { tick: 7 } }
    const transport = leanCorrectionInvocationTransportBinding({ methodName: "selectActivations", source, input, requestOrdinal: 3 })
    const evidence = {
      identity: { sourceRoot: root("a"), executableRoot: transport.executableRoot },
      requestId: "request-3", method: "selectActivations", inputRoot: transport.inputRoot,
      ordinal: 2, invocationRoot: root("b"), result: { ok: false, systemFailure: { code: "SUBPROCESS_SIGNAL", retryable: false } },
    } as any
    const privateDiagnostic = { stage: "stream_exchange", reason: "wait_timeout", ...evidence } as any
    const origin = {
      schemaVersion: "v1.38-lean-correction-origin-v1", requestOrdinal: 3, requestRoot: transport.requestRoot,
      transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline",
      signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown",
      transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown",
    } as const
    expect(bindLeanCorrectionInvocation(origin, transport, evidence, privateDiagnostic, "bottom")).toMatchObject({
      requestOrdinal: 3, ordinal: 2, method: "selectActivations", requestRoot: transport.requestRoot,
      payloadRoot: transport.payloadRoot, inputRoot: transport.inputRoot, seat: "bottom", invocationRoot: evidence.invocationRoot,
    })
    expect(() => bindLeanCorrectionInvocation({ ...origin, requestRoot: root("c") }, transport, evidence, privateDiagnostic, "bottom")).toThrow("LEAN_CORRECTION_INVOCATION_JOIN")
    expect(() => bindLeanCorrectionInvocation(origin, { ...transport, method: "soldierBrain" }, evidence, privateDiagnostic, "bottom")).toThrow("LEAN_CORRECTION_INVOCATION_JOIN")
  })
})
