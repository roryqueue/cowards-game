import { describe, expect, it } from "vitest"
import { createInitialGameState, createSoldierBrainInputV119, MATCH_KERNEL } from "@cowards/engine"
import { SoldierBrainResultSchema, type Action, type Direction } from "@cowards/spec"
import { enumerateConcreteActions, reserveBrainFallback, runPlannerSoldierBrain } from "./brain.js"
import { createMission } from "./missions.js"
import { createStrategyInputV119 } from "@cowards/engine"
import { buildFeasibilityCorpus } from "../feasibility-protocol.js"

const fixture = () => {
  const state = createInitialGameState({ matchId: "brain", seed: "brain", arenaVariant: { id: "fixture", name: "fixture", initialBounds: { minX: 0,minY: 0,maxX: 11,maxY: 11 }, terrainStones: [] }, bottomPlayerId: "bottom",topPlayerId: "top",bottomStrategyRevisionId: "b",topStrategyRevisionId: "t" })
  state.soldiers.forEach(s => { s.status = "FALLEN"; s.position = null })
  const self = state.soldiers[0]!, enemy = state.soldiers.find(s => s.ownerPlayerId === "top")!
  Object.assign(self,{ status: "ACTIVE",position: { x: 5,y: 5 },facing: "UP" })
  Object.assign(enemy,{ status: "ACTIVE",position: { x: 9,y: 9 },facing: "UP" })
  return { state,self,enemy,input: (advanced = false, cycle = 0, objective?: ReturnType<typeof createMission>) => createSoldierBrainInputV119(state,self.id,cycle,advanced,objective ?? undefined) }
}
const adjudicate = (f: ReturnType<typeof fixture>, action: Action) => {
  let calls = 0
  return MATCH_KERNEL.runActivationFromStateV119({ state: f.state,soldierId: f.self.id,runtime: {
    selectActivations() { throw new Error("not used") },
    runSoldierBrain() { return { ok: true as const,value: { action: calls++ === 0 ? action : { type: "TURN_TO_STONE" as const },soldierMemory: {} } } },
  } })
}

describe("nine-Action local planner", () => {
  it("enumerates all concrete Actions and reserves exactly nine evaluations at zero budget", () => {
    const f = fixture(), actions = enumerateConcreteActions()
    expect(actions).toHaveLength(9)
    expect(new Set(actions.map(a => JSON.stringify(a))).size).toBe(9)
    const result = runPlannerSoldierBrain(f.input(),{ maxEvaluations: 0 })
    expect(result.action).toEqual(reserveBrainFallback(f.input()).action)
    expect(result.soldierMemory).toMatchObject({ planner: { reservedEvaluations: 9,optionalEvaluations: 0 } })
    expect(SoldierBrainResultSchema.safeParse(result).success).toBe(true)
  })
  it("uses authoritative Advance, not forged SoldierMemory, at final Cycle", () => {
    const f = fixture(), mission = createMission("reserve",createStrategyInputV119(f.state,"bottom"),f.self.id)
    f.self.soldierMemory = { hasAdvancedThisActivation: true,teacher: "ignored" }
    expect(runPlannerSoldierBrain(f.input(false,11,mission)).action.type).toBe("MOVE")
    expect(runPlannerSoldierBrain(f.input(true,11,mission)).action.type).toBe("TURN")
  })
  for (const direction of ["UP","RIGHT","DOWN","LEFT"] as const) it(`canonical forced edge push ${direction}`, () => {
    const f = fixture(), v = direction === "UP" ? { x: 0,y: -1 } : direction === "DOWN" ? { x: 0,y: 1 } : direction === "LEFT" ? { x: -1,y: 0 } : { x: 1,y: 0 }
    f.enemy.position = { x: 5 + v.x * (v.x < 0 ? 5 : 6),y: 5 + v.y * (v.y < 0 ? 5 : 6) }
    f.self.position = { x: f.enemy.position.x-v.x,y: f.enemy.position.y-v.y }
    f.enemy.facing = v.x ? "UP" : "RIGHT"; f.self.facing = direction
    const action = runPlannerSoldierBrain(f.input()).action
    expect(action).toEqual({ type: "MOVE",direction })
    const result = adjudicate(f,action)
    expect(result.kind).toBe("completed")
    expect(result.recorderMaterial?.events.some(e => e.type === "PUSH_RESOLVED" && e.payload.pushedOffBoard === true)).toBe(true)
  })
  it("canonical rear-entry Backstab and safe facing avoid mutual loss", () => {
    const f = fixture()
    f.self.position = { x: 4,y: 5 }; f.enemy.position = { x: 5,y: 4 }; f.enemy.facing = "UP"
    const action = runPlannerSoldierBrain(f.input()).action
    expect(action).toEqual({ type: "MOVE",direction: "RIGHT" })
    expect(adjudicate(f,action).recorderMaterial?.events.some(e => e.type === "BACKSTAB_RESOLVED")).toBe(true)
  })
  it("rejects reversal, walls, terrain and immobile occupants; canonical no-Advance remains true after blockage", () => {
    const f = fixture(); f.self.position = { x: 0,y: 0 }; f.self.lastSuccessfulMoveDirection = "LEFT"
    f.state.terrainStones = [{ x: 0,y: 1 }]
    const action = runPlannerSoldierBrain(f.input()).action
    expect(action.type).toBe("TURN")
    const result = adjudicate(f,{ type: "MOVE",direction: "DOWN" })
    expect(result.recorderMaterial?.events.some(e => e.type === "MOVE_BLOCKED")).toBe(true)
    expect(result.recorderMaterial?.events.some(e => e.type === "MOVE_ADVANCED")).toBe(false)
  })
  it("stale target disappearance and forged packets fall back; graph-cut goal can intentionally STONE", () => {
    const f = fixture(); f.enemy.position = { x: 5,y: 3 }
    const mission = createMission("rear-entry",createStrategyInputV119(f.state,"bottom"),f.self.id)!
    f.enemy.status = "FALLEN"; f.enemy.position = null
    expect(runPlannerSoldierBrain(f.input(true,0,mission)).soldierMemory).toMatchObject({ planner: { missionStatus: "stale" } })
    const forged = { ...mission,teacher: "secret" }
    expect(runPlannerSoldierBrain(createSoldierBrainInputV119(f.state,f.self.id,0,true,forged)).soldierMemory).toMatchObject({ planner: { missionStatus: "invalid" } })
    const graph = createMission("graph-cut-stone",createStrategyInputV119(f.state,"bottom"),f.self.id)!
    graph.goal = { ...f.self.position! }
    expect(runPlannerSoldierBrain(f.input(true,0,graph)).action).toEqual({ type: "TURN_TO_STONE" })
  })
  it("canonical corpus and reversed cell order give bounded deterministic results", () => {
    for (const c of buildFeasibilityCorpus().soldierBrain) {
      const result = runPlannerSoldierBrain(c.input)
      expect(SoldierBrainResultSchema.safeParse(result).success).toBe(true)
      const reversed = { ...c.input,awarenessGrid: { cells: [...c.input.awarenessGrid.cells].reverse() } }
      expect(runPlannerSoldierBrain(reversed)).toEqual(result)
    }
  })
})
