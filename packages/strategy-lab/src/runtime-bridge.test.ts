import { describe, expect, it, vi } from "vitest"
import { MATCH_KERNEL } from "@cowards/engine"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot } from "./contracts.js"
import { runCanonicalLabMatch, type LabSupervisedProvider, type LabRuntimeEvidence } from "./runtime-bridge.js"
import * as bridge from "./runtime-bridge.js"

vi.mock("@cowards/engine", async importOriginal => {
  const actual = await importOriginal<typeof import("@cowards/engine")>()
  return { ...actual, MATCH_KERNEL: { ...actual.MATCH_KERNEL } }
})

const root = labRoot("synthetic-test", "identity")
const match = { matchId: "lab-synthetic", seed: "lab-fixed", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "revision-bottom", topStrategyRevisionId: "revision-top", initialInitiativePlayerId: "bottom", maxPhases: 1 }
const value = { activationOrders: [], strategyMemory: null }
const synthetic = (side: string, alter?: (e: LabRuntimeEvidence) => LabRuntimeEvidence): LabSupervisedProvider => {
  let ordinal = 0
  const identity = { revisionId: `revision-${side}`, sourceRoot: root, executableRoot: root, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: root, budgetRoot: root, attemptRoot: root, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
  const issued = new WeakSet<object>()
  return { identity, invoke(request) {
    const evidence: LabRuntimeEvidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: ordinal++, invocationRoot: labRoot("synthetic-call", request.requestId), charged: true, completed: true, outputBytes: 70, result: { ok: true, value } }
    const output = alter ? alter(evidence) : evidence
    issued.add(output)
    return output
  }, verify(e) { return issued.has(e) }, close() { return { cleanupComplete: true, orphanedChild: false } } }
}

describe("policy cache host attribution inert host leaves", () => {
  const binding = { allocationRoot: root, chargeRoot: labRoot("inert-charge", 1), slotRoot: labRoot("inert-slot", 1) }
  const machine = { initialState: {}, semanticTuple: { tupleId: MATCH_KERNEL.tupleId }, state: {} } as any
  const complete = () => ({ kind: "completed", machine, record: { events: [] } } as any)
  const effect = () => ({ kind: "effect", machine, request: { requestId: "inert-request", kind: "selectActivations", input: {}, coordinates: { actingPlayerId: "bottom" } } } as any)
  it.each(["missing", "throwing", "backward", "nonfinite", "negative", "unsafe", "unsafe_sum"] as const)("policy cache host attribution %s clock zeroes totals without erasing first failure or cleanup binding", async fault => {
    let inspections = 0, tick = 0
    const hostile = new Proxy({}, { get() { inspections++; throw null }, ownKeys() { inspections++; throw null } })
    const hostClockV15 = vi.fn(() => {
      tick++
      if (fault === "throwing") throw hostile
      if (fault === "nonfinite") return Infinity
      if (fault === "negative") return -1
      if (fault === "unsafe") return Number.MAX_SAFE_INTEGER + 1
      if (fault === "unsafe_sum") return [0, 0.25, 0.5, Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER][tick - 1]!
      return 10 - tick
    })
    const create = vi.spyOn(MATCH_KERNEL, "createMachineV119").mockImplementation(() => machine)
    const step = vi.spyOn(MATCH_KERNEL, "stepMatch").mockImplementation(() => { throw hostile })
    const bottom = synthetic("bottom"), top = synthetic("top")
    bottom.close = vi.fn(() => { throw hostile }); top.close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false }))
    try {
      const execution = await runCanonicalLabMatch({ match, providers: { bottom, top }, hostBindingV15: binding, ...(fault === "missing" ? {} : { hostClockV15 }) })
      const issued = bridge.readLabHostFailureV15(execution, binding)
      expect(execution).toMatchObject({ kind: "failure", failure: { code: "LAB_CLEANUP_INCOMPLETE" } })
      expect(issued).toMatchObject({ ...binding, phase: "kernel_step", code: "HOST_THROW" })
      expect(issued.phaseTotalsMs).toEqual(Object.fromEntries(bridge.LAB_HOST_PHASES_V15.map(key => [key, 0])))
      expect(bottom.close).toHaveBeenCalledOnce(); expect(top.close).toHaveBeenCalledOnce()
      expect(bridge.readLabHostFailureV15({ ...execution }, binding).phase).toBe("unknown")
      expect(bridge.readLabHostFailureV15(execution, { ...binding, chargeRoot: root }).phase).toBe("unknown")
      expect(inspections).toBe(0)
    } finally { create.mockRestore(); step.mockRestore() }
  })
  it("policy cache host attribution missing clock preserves host refusal", async () => {
    const create = vi.spyOn(MATCH_KERNEL, "createMachineV119").mockImplementation(() => machine)
    const bottom = synthetic("bottom"); bottom.identity.revisionId = "inert-wrong-revision"
    try {
      const execution = await runCanonicalLabMatch({ match, providers: { bottom, top: synthetic("top") }, hostBindingV15: binding })
      expect(bridge.readLabHostFailureV15(execution, binding)).toMatchObject({ phase: "provider_binding", code: "HOST_REFUSAL" })
    } finally { create.mockRestore() }
  })
  it("policy cache host attribution finite supplied clock records safe positive totals and legacy never calls clock", async () => {
    let tick = 0
    const hostClockV15 = vi.fn(() => tick++)
    const create = vi.spyOn(MATCH_KERNEL, "createMachineV119").mockImplementation(() => machine)
    const step = vi.spyOn(MATCH_KERNEL, "stepMatch").mockImplementation(() => { throw null })
    try {
      const providers = { bottom: synthetic("bottom"), top: synthetic("top") }
      const execution = await runCanonicalLabMatch({ match, providers, hostBindingV15: binding, hostClockV15 })
      const totals = bridge.readLabHostFailureV15(execution, binding).phaseTotalsMs
      expect(totals).toEqual({ machine_construction: 1, provider_binding: 1, kernel_step: 1, provider_invoke: 0, evidence_verification: 0, result_projection: 0, cleanup: 1 })
      expect(hostClockV15).toHaveBeenCalledTimes(5)
      hostClockV15.mockClear()
      const legacy = await runCanonicalLabMatch({ match, providers, hostClockV15 })
      expect(hostClockV15).not.toHaveBeenCalled()
      expect(bridge.readLabHostFailureV15(legacy, binding).phase).toBe("unknown")
    } finally { create.mockRestore(); step.mockRestore() }
  })
  it.each(["machine_construction", "provider_binding", "kernel_step", "provider_invoke", "evidence_verification", "result_projection", "cleanup"] as const)("policy cache host attribution records %s without inspecting thrown payload", async phase => {
    expect(typeof bridge.readLabHostFailureV15).toBe("function")
    let inspections = 0
    const hostile = new Proxy({}, { get() { inspections++; throw Error("must-not-read") }, ownKeys() { inspections++; throw Error("must-not-enumerate") } })
    const create = vi.spyOn(MATCH_KERNEL, "createMachineV119").mockImplementation(() => { if (phase === "machine_construction") throw hostile; return machine })
    const step = vi.spyOn(MATCH_KERNEL, "stepMatch").mockImplementation(() => { if (phase === "kernel_step") throw hostile; if (["provider_invoke", "evidence_verification"].includes(phase)) return effect(); const v = complete(); if (phase === "result_projection") Object.defineProperty(v.record, "events", { get() { throw hostile } }); return v })
    const bottom = synthetic("bottom"), top = synthetic("top")
    if (phase === "provider_binding") Object.defineProperty(bottom, "identity", { get() { throw hostile } })
    if (phase === "provider_invoke") bottom.invoke = () => { throw hostile }
    if (phase === "evidence_verification") bottom.verify = () => { throw hostile }
    if (phase === "cleanup") bottom.close = () => { throw hostile }
    try {
      const execution = await runCanonicalLabMatch({ match, providers: { bottom, top }, hostBindingV15: binding })
      expect(execution.kind).toBe("failure")
      const attributed = bridge.readLabHostFailureV15(execution, binding)
      expect(attributed).toMatchObject({ schemaVersion: "lean-private-host-failure-v15-4-v1", ...binding, phase, code: phase === "cleanup" ? "CLEANUP_INCOMPLETE" : "HOST_THROW" })
      expect(Object.keys(attributed.phaseTotalsMs)).toHaveLength(7)
      expect(Object.values(attributed.phaseTotalsMs).every(n => Number.isSafeInteger(n) && n >= 0)).toBe(true)
      expect(bridge.readLabHostFailureV15({ ...execution }, binding).phase).toBe("unknown")
      expect(bridge.readLabHostFailureV15(execution, { ...binding, slotRoot: root }).phase).toBe("unknown")
      expect(inspections).toBe(0)
      expect(execution).not.toHaveProperty("hostFailureV15")
    } finally { create.mockRestore(); step.mockRestore() }
  })
  it("policy cache host attribution preserves first failure on cleanup replacement and leaves default shape inert", async () => {
    expect(typeof bridge.readLabHostFailureV15).toBe("function")
    const create = vi.spyOn(MATCH_KERNEL, "createMachineV119").mockImplementation(() => { throw null })
    const bottom = synthetic("bottom"); bottom.close = () => ({ cleanupComplete: false, orphanedChild: true })
    try {
      const execution = await runCanonicalLabMatch({ match, providers: { bottom, top: synthetic("top") }, hostBindingV15: binding })
      expect(execution).toMatchObject({ kind: "failure", failure: { code: "LAB_CLEANUP_INCOMPLETE" } })
      expect(bridge.readLabHostFailureV15(execution, binding).phase).toBe("machine_construction")
      const defaultExecution = await runCanonicalLabMatch({ match, providers: { bottom, top: synthetic("top") } })
      expect(bridge.readLabHostFailureV15(defaultExecution, binding).phase).toBe("unknown")
      expect(Object.keys(defaultExecution).sort()).toEqual(["accounting", "failure", "kind", "privacy", "transitions", "unchangedState"])
    } finally { create.mockRestore() }
  })
})

describe("private canonical effect pump (synthetic effects, no source execution)", () => {
  it("matches canonical final state, ordered transitions and events", async () => {
    const canonical = MATCH_KERNEL.runMatchV119({ ...match, runtime: { selectActivations: () => ({ ok: true, value }), runSoldierBrain: () => { throw Error("unreachable") } } })
    const actual = await runCanonicalLabMatch({ match, providers: { bottom: synthetic("bottom"), top: synthetic("top") } })
    expect(canonical.kind).toBe("completed")
    expect(actual.kind).toBe("completed")
    if (canonical.kind === "completed" && actual.kind === "completed") {
      expect(actual.result).toEqual(canonical.result)
      expect(actual.transitions).toEqual(canonical.transitions)
      expect(actual.privacy).toBe("private_offline")
    }
  })
  it.each(["request", "method", "input", "identity", "charge", "completion", "ordinal", "unverified"])("rolls back bad %s binding without a score", async (fault) => {
    const p = synthetic("bottom", (e) => ({ ...e,
      ...(fault === "request" ? { requestId: "other" } : {}), ...(fault === "method" ? { method: "soldierBrain" as const } : {}),
      ...(fault === "input" ? { inputRoot: labRoot("wrong", 1) } : {}), ...(fault === "identity" ? { identity: { ...e.identity, image: "wrong" } } : {}),
      ...(fault === "charge" ? { charged: false } : {}), ...(fault === "completion" ? { completed: false } : {}), ...(fault === "ordinal" ? { ordinal: 8 } : {}),
    }))
    if (fault === "unverified") p.verify = () => false
    const actual = await runCanonicalLabMatch({ match, providers: { bottom: p, top: synthetic("top") } })
    expect(actual).toMatchObject({ kind: "failure", transitions: [], unchangedState: MATCH_KERNEL.createMachineV119(match).initialState })
    expect(actual).not.toHaveProperty("result")
  })
  it("keeps player violations distinct and rejects cleanup uncertainty", async () => {
    const p = synthetic("bottom", (e) => ({ ...e, result: { ok: false, violation: { type: "INVALID_OUTPUT", message: "synthetic" } } }))
    expect((await runCanonicalLabMatch({ match, providers: { bottom: p, top: synthetic("top") } })).kind).toBe("completed")
    const bad = synthetic("bottom"); bad.close = () => ({ cleanupComplete: false, orphanedChild: true })
    expect(await runCanonicalLabMatch({ match, providers: { bottom: bad, top: synthetic("top") } })).toMatchObject({ kind: "failure", transitions: [] })
  })
  it("admits canonical full starts in both geometries", () => {
    const geometries = new Set<string>()
    for (const arena of CANONICAL_ARENA_CATALOG_V1_37.arenas.filter((a) => a.schedulable)) {
      const state = MATCH_KERNEL.createMachineV119({ ...match, arenaVariant: arena }).state
      geometries.add(arena.semanticGeometryHash)
      expect(state.soldiers).toHaveLength(16)
      for (const position of [...state.soldiers.map((s) => s.position), ...state.terrainStones]) {
        if (!position) throw new Error("canonical start must not contain a missing position")
        expect(position.x).toBeGreaterThanOrEqual(arena.initialBounds.minX); expect(position.x).toBeLessThanOrEqual(arena.initialBounds.maxX)
        expect(position.y).toBeGreaterThanOrEqual(arena.initialBounds.minY); expect(position.y).toBeLessThanOrEqual(arena.initialBounds.maxY)
      }
    }
    expect(geometries.size).toBe(2)
  })
})
