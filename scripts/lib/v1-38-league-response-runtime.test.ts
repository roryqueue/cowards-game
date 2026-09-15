import { describe, expect, it } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import { wrapLeagueProbeProvider } from "./v1-38-league-response-runtime.js"

const root = labRoot("probe-test", "identity")
const soldiers = [1, 2].map((x) => ({ id: `soldier-${x}`, ownerPlayerId: "player", status: "ACTIVE", position: { x, y: 1 }, facing: "LEFT", lastSuccessfulMoveDirection: "LEFT" }))
const request = { kind: "selectActivations", requestId: "request", semanticTupleId: "tuple", coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0, actingPlayerId: "player" }, input: { phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers, terrainStones: [] }, mySoldiers: soldiers, enemySoldiers: [], strategyMemory: { x: 9, id: "opaque-memory" }, initialInitiativePlayerId: "player", hasInitialInitiative: true, roundInitiativePlayerId: "player", hasRoundInitiative: true } } as const
const fixture = () => {
  const identities = new WeakSet<object>(), seen: unknown[] = []
  const identity = { revisionId: "fixture", sourceRoot: root, executableRoot: root, tupleId: "tuple", tupleRoot: root, image: "fixture", harnessRoot: root, budgetRoot: root, attemptRoot: root, runtimeLimitsRoot: root } as FactorySupervisionProvider["identity"]
  const provider: FactorySupervisionProvider = { identity, invoke(input) { seen.push(input); const evidence = { identity, requestId: input.requestId, method: input.kind, inputRoot: labRoot("runtime-input", input.input), ordinal: 0, invocationRoot: root, charged: true, completed: true, outputBytes: 2, result: { ok: true as const, value: { activationOrders: [], strategyMemory: input.input.strategyMemory } } }; identities.add(evidence); return evidence }, verify(value) { return identities.has(value) }, close() { return { cleanupComplete: true, orphanedChild: false } } }
  return { provider, seen }
}
describe("host-bound league behavioral probes", () => {
  it("reflects public geometry and facing while preserving opaque Strategy state and original evidence", async () => {
    const { provider, seen } = fixture(), retained: any[] = [], wrapper = wrapLeagueProbeProvider(provider, "horizontal_symmetry", { minX: 0, maxX: 11 }, (value) => retained.push(value))
    const evidence = await wrapper.invoke(request as never, provider.identity)
    expect((seen[0] as any).input.mySoldiers[0]).toMatchObject({ position: { x: 10, y: 1 }, facing: "RIGHT", lastSuccessfulMoveDirection: "RIGHT" })
    expect((seen[0] as any).input.strategyMemory).toEqual(request.input.strategyMemory)
    expect(wrapper.verify(evidence)).toBe(true); expect(wrapper.verify({ ...evidence })).toBe(false)
    expect(retained[0].request).toEqual(request); expect(retained[0].originalEvidence).not.toBe(evidence)
    expect(evidence.inputRoot).toBe(labRoot("runtime-input", request.input))
  })
  it("changes opaque identifiers and Soldier enumeration through the actual issued invocation path", async () => {
    for (const family of ["opaque_ids", "soldier_order"] as const) {
      const { provider, seen } = fixture(), wrapper = wrapLeagueProbeProvider(provider, family, { minX: 0, maxX: 11 }, () => {})
      await wrapper.invoke(request as never, provider.identity)
      const observed = (seen[0] as any).input
      if (family === "opaque_ids") { expect(observed.mySoldiers[0].id).not.toBe("soldier-1"); expect(observed.mySoldiers[0].ownerPlayerId).toBe(observed.initialInitiativePlayerId) }
      else expect(observed.mySoldiers[0].id).toBe("soldier-2")
      expect(observed.strategyMemory).toEqual(request.input.strategyMemory)
    }
  })
})
