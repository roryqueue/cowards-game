import { describe, expect, it } from "vitest"
import { MATCH_KERNEL } from "@cowards/engine"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot } from "./contracts.js"
import { runCanonicalLabMatch, type LabSupervisedProvider, type LabRuntimeEvidence } from "./runtime-bridge.js"

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
