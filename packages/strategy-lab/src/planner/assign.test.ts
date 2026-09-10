import { describe, expect, it } from "vitest"
import { StrategyResultSchema } from "@cowards/spec"
import { createInitialGameState, createStrategyInputV119 } from "@cowards/engine"
import { compareAssignmentCandidates, selectPlannerActivations } from "./assign.js"
import { buildFeasibilityCorpus } from "../feasibility-protocol.js"
import { selectPlannerActivations as referenceSelect, scoreAssignment as referenceScore } from "./assign-reference.test-helper.js"
import { scoreAssignment } from "./assign.js"
import { createMission } from "./missions.js"

const missionFixture = () => {
  const state = createInitialGameState({ matchId: "assign", seed: "assign", arenaVariant: { id: "fixture", name: "fixture", initialBounds: { minX: 0, minY: 0, maxX: 11, maxY: 11 }, terrainStones: [] }, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "b", topStrategyRevisionId: "t" })
  state.soldiers.forEach(s => { s.status = "FALLEN"; s.position = null })
  const self = state.soldiers[0]!, ally = state.soldiers[1]!, enemy = state.soldiers.find(s => s.ownerPlayerId === "top")!
  Object.assign(self, { status: "ACTIVE", position: { x: 4,y: 4 }, facing: "UP" })
  Object.assign(ally, { status: "ACTIVE", position: { x: 6,y: 4 }, facing: "UP" })
  Object.assign(enemy, { status: "ACTIVE", position: { x: 5,y: 2 }, facing: "UP" })
  return { state,self,input: () => createStrategyInputV119(state,"bottom") }
}

describe("ordered dual-initiative beam", () => {
  it("matches the frozen pure selector across all mapped cases and budget boundaries", () => {
    for (const c of buildFeasibilityCorpus().selectActivations) for (const maxExpansions of [0,1,75,76,255,256]) {
      const before=JSON.stringify(c.input)
      expect(selectPlannerActivations(c.input,{maxExpansions})).toEqual(referenceSelect(c.input,{maxExpansions}))
      expect(JSON.stringify(c.input)).toBe(before)
    }
  },60000)
  it("does not alias objectives sharing an abbreviated key or leak facts between calls", () => {
    const f=missionFixture(),input=f.input()
    const a=createMission("recovery",input,f.self.id)!,b={...a,goalFacing:"LEFT" as const}
    for (const orders of [[a],[b],[a,b],[b,a]]) for (const first of [true,false]) expect(scoreAssignment(orders,input,first)).toEqual(referenceScore(orders,input,first))
    input.strategyMemory={missions:[a,b]}
    for(const maxExpansions of [0,1,16,256]) expect(selectPlannerActivations(input,{maxExpansions})).toEqual(referenceSelect(input,{maxExpansions}))
    f.self.facing="LEFT"
    const changed=f.input(); changed.strategyMemory={missions:[a,b]}
    expect(selectPlannerActivations(changed)).toEqual(referenceSelect(changed))
    expect(selectPlannerActivations(input)).toEqual(referenceSelect(input))
  })
  it("hard failures cannot be compensated by any soft reward", () => {
    expect(compareAssignmentCandidates({ hard: [0,0,0,0], soft: -999999, key: "b" }, { hard: [0,-1,0,0], soft: 999999, key: "a" })).toBeLessThan(0)
  })
  for (const count of [1,2,3,4] as const) it(`reserves distinct ACTIVE assignments at count ${count}, both initiatives`, () => {
    const f = missionFixture()
    f.state.activationCount = count; f.state.roundNumber = count
    for (const initiative of ["top","bottom"]) {
      f.state.initiativePlayerId = initiative
      const result = selectPlannerActivations(f.input(), { maxExpansions: 0 })
      expect(StrategyResultSchema.safeParse(result).success).toBe(true)
      expect(result.activationOrders).toHaveLength(Math.min(count,2))
      expect(new Set(result.activationOrders.map(a => a.soldierId)).size).toBe(result.activationOrders.length)
      expect(result.strategyMemory).toMatchObject({ planner: { expansions: 0, reserved: Math.min(count,2), hypotheses: ["entrant-first","entrant-second"] } })
    }
  })
  it("is invariant to visible-array order, bounded, and ignores fixture context", () => {
    const f = missionFixture(), input = f.input()
    const expected = selectPlannerActivations(input)
    input.mySoldiers.reverse(); input.enemySoldiers.reverse(); input.board.soldiers.reverse(); input.board.terrainStones.reverse()
    input.strategyMemory = { fixtureContext: { mission: "bait", teacher: "private" } }
    expect(selectPlannerActivations(input)).toEqual(expected)
    const memory = expected.strategyMemory as { planner: { expansions: number } }
    expect(memory.planner.expansions).toBeLessThanOrEqual(256)
  })
  it("visible danger changes mission and ordering; expired memory does not survive", () => {
    const f = missionFixture(), calm = selectPlannerActivations(f.input())
    f.self.position = { x: 0,y: 4 }; f.state.roundNumber = 4
    const danger = selectPlannerActivations(f.input())
    expect(danger.activationOrders).not.toEqual(calm.activationOrders)
    expect(danger.activationOrders[0]?.objective).toMatchObject({ kind: "evacuation" })
    f.state.players[0].strategyMemory = calm.strategyMemory
    f.state.phaseNumber = 9
    expect(selectPlannerActivations(f.input()).activationOrders[0]?.objective).toMatchObject({ issuedPhase: 9 })
  })
  it("all canonical corpus inputs produce schema-valid bounded output", () => {
    for (const c of buildFeasibilityCorpus().selectActivations) expect(StrategyResultSchema.safeParse(selectPlannerActivations(c.input)).success).toBe(true)
  })
})
