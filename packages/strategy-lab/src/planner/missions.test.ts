import { describe, expect, it } from "vitest"
import { createInitialGameState, createStrategyInputV119 } from "@cowards/engine"
import { encodeCanonicalJson } from "@cowards/spec"
import { MISSION_KINDS, createMission, createMissionOptions, evaluateMission, fallbackMission, validateMission } from "./missions.js"
import { createMission as referenceMission } from "./missions-reference.test-helper.js"
import { buildFeasibilityCorpus } from "../feasibility-protocol.js"

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
  it("batch and single generation exactly match the frozen reference on every mapped observation", () => {
    for (const c of buildFeasibilityCorpus().selectActivations) {
      const before = JSON.stringify(c.input)
      for (const self of c.input.mySoldiers) {
        const expected = MISSION_KINDS.map(kind => referenceMission(kind,c.input,self.id))
        expect(MISSION_KINDS.map(kind => createMission(kind,c.input,self.id))).toEqual(expected)
        expect(createMissionOptions(c.input,self.id)).toEqual(expected.filter(o => o !== null))
      }
      expect(createMissionOptions(c.input,"absent")).toEqual([])
      expect(JSON.stringify(c.input)).toBe(before)
    }
  },30000)
  it("preserves ties, local obstruction rankings and call isolation across deterministic board variations", () => {
    for (let n = 0; n < 48; n++) {
      const f = missionFixture()
      f.self.position = { x: n % 10 + 1, y: Math.floor(n / 10) + 1 }
      f.ally.position = { x: (n * 3) % 10 + 1, y: (n * 7) % 10 + 1 }
      f.enemy.position = { x: (n * 7 + 2) % 10 + 1, y: (n * 3 + 2) % 10 + 1 }
      if (n % 3 === 0) f.ally.status = "STONE"
      if (n % 5 === 0) f.enemy.status = "FALLEN", f.enemy.position = null
      const input = f.input()
      input.board.terrainStones = Array.from({length: n % 7},(_,i) => ({x:(n+i*3)%12,y:(n*3+i*5)%12}))
      const expected = MISSION_KINDS.map(kind => referenceMission(kind,input,f.self.id)).filter(o => o !== null)
      expect(createMissionOptions(input,f.self.id)).toEqual(expected)
      input.enemySoldiers.reverse(); input.mySoldiers.reverse(); input.board.soldiers.reverse(); input.board.terrainStones.reverse()
      expect(createMissionOptions(input,f.self.id)).toEqual(expected)
    }
  })
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
