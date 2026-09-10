import { describe, expect, it } from "vitest"
import { createInitialGameState, createStrategyInputV119 } from "@cowards/engine"
import { encodeCanonicalJson } from "@cowards/spec"
import { MISSION_KINDS, createMission, evaluateMission, fallbackMission, validateMission } from "./missions.js"

export const missionFixture = () => {
  const state = createInitialGameState({ matchId: "missions", seed: "missions", arenaVariant: { id: "fixture", name: "fixture", initialBounds: { minX: 0, minY: 0, maxX: 11, maxY: 11 }, terrainStones: [] }, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "b", topStrategyRevisionId: "t" })
  state.soldiers.forEach((s, i) => { s.status = "FALLEN"; s.position = null })
  const self = state.soldiers[0]!, ally = state.soldiers[1]!, enemy = state.soldiers.find(s => s.ownerPlayerId === "top")!
  Object.assign(self, { status: "ACTIVE", position: { x: 4, y: 4 }, facing: "UP" })
  Object.assign(ally, { status: "ACTIVE", position: { x: 6, y: 4 }, facing: "UP" })
  Object.assign(enemy, { status: "ACTIVE", position: { x: 5, y: 2 }, facing: "UP" })
  return { state, self, ally, enemy, input: () => createStrategyInputV119(state, "bottom") }
}

describe("ten observable mission lifecycles", () => {
  for (const kind of MISSION_KINDS) it(`${kind}: active, complete, stale, failed and fallback`, () => {
    const f = missionFixture()
    if (kind === "recovery") f.self.facing = "DOWN"
    const objective = createMission(kind, f.input(), f.self.id)!
    expect(objective).toBeTruthy()
    expect(evaluateMission(objective, f.input()).status).toBe("active")
    const encoded = encodeCanonicalJson(objective, { context: "canonical-manifest" })
    expect(encoded.ok && encoded.bytes.length <= 1024).toBe(true)
    f.state.phaseNumber += 2
    expect(evaluateMission(objective, f.input()).status).toBe("stale")
    f.state.phaseNumber -= 2
    f.self.status = "FALLEN"; f.self.position = null
    expect(evaluateMission(objective, f.input()).status).toBe("failed")
    f.self.status = "ACTIVE"; f.self.position = { ...objective.goal }
    if (kind === "graph-cut-stone") f.self.status = "STONE"
    if (kind === "reserve") f.state.roundNumber = 2
    if (kind === "recovery") f.self.facing = objective.goalFacing
    expect(evaluateMission(objective, f.input()).status).toBe("complete")
    f.self.status = "ACTIVE"
    expect(validateMission(fallbackMission(f.input(), f.self.id), f.input())).toBe(true)
  })
  it("rejects unknown fields, invalid coordinates, private references and target drift", () => {
    const f = missionFixture(), objective = createMission("rear-entry", f.input(), f.self.id)!
    expect(validateMission({ ...objective, teacher: "secret" }, f.input())).toBe(false)
    expect(validateMission({ ...objective, goal: { x: 999, y: 0 } }, f.input())).toBe(false)
    expect(validateMission({ ...objective, targetId: "hidden" }, f.input())).toBe(false)
    expect(validateMission({ ...objective, targetId: f.ally.id, targetPosition: f.ally.position }, f.input())).toBe(false)
    expect(validateMission({ ...objective, kind: "reserve" }, f.input())).toBe(false)
    f.enemy.position = { x: 8, y: 2 }
    expect(evaluateMission(objective, f.input()).status).toBe("stale")
  })
  it("mission goals are materially different and graph cut measures visible connectivity", () => {
    const f = missionFixture()
    const goals = MISSION_KINDS.map(kind => createMission(kind, f.input(), f.self.id)!)
    expect(new Set(goals.map(o => JSON.stringify([o.goal, o.goalFacing, o.targetId, o.partnerId]))).size).toBeGreaterThanOrEqual(6)
    expect(goals.find(o => o.kind === "pincer")!.partnerId).toBe(f.ally.id)
    expect(goals.find(o => o.kind === "screen")!.targetId).toBe(f.ally.id)
  })
})
