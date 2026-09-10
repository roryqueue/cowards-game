import { describe, expect, it } from "vitest"
import { StrategyResultSchema } from "@cowards/spec"
import { missionFixture } from "./missions.test.js"
import { compareAssignmentCandidates, selectPlannerActivations } from "./assign.js"
import { buildFeasibilityCorpus } from "../feasibility-protocol.js"

describe("ordered dual-initiative beam", () => {
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
