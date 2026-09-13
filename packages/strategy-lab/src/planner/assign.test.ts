import { describe, expect, it } from "vitest"
import { StrategyResultSchema } from "@cowards/spec"
import { createInitialGameState, createStrategyInputV119 } from "@cowards/engine"
import type { StrategyInputV119 } from "@cowards/spec"
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

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
  }
  return value
}

const compareFrozen = (input: StrategyInputV119, maxExpansions: number) => {
  const before = JSON.stringify(input)
  const actualInput = deepFreeze(structuredClone(input))
  const referenceInput = deepFreeze(structuredClone(input))
  expect(selectPlannerActivations(actualInput, { maxExpansions })).toEqual(referenceSelect(referenceInput, { maxExpansions }))
  expect(JSON.stringify(actualInput)).toBe(before)
  expect(JSON.stringify(referenceInput)).toBe(before)
}

const syncBoardSoldiers = (input: StrategyInputV119) => {
  for (const observed of [...input.mySoldiers, ...input.enemySoldiers]) {
    const boardSoldier = input.board.soldiers.find(s => s.id === observed.id)
    if (boardSoldier) Object.assign(boardSoldier, { status: observed.status, position: observed.position && { ...observed.position }, facing: observed.facing, lastSuccessfulMoveDirection: observed.lastSuccessfulMoveDirection })
  }
}

describe("ordered dual-initiative beam", () => {
  it("matches the frozen pure selector across all mapped cases and budget boundaries", () => {
    for (const c of buildFeasibilityCorpus().selectActivations) for (const maxExpansions of [0,1,75,76,255,256]) {
      const before=JSON.stringify(c.input)
      expect(selectPlannerActivations(c.input,{maxExpansions})).toEqual(referenceSelect(c.input,{maxExpansions}))
      expect(JSON.stringify(c.input)).toBe(before)
    }
  },60000)
  it("matches frozen reference on varied canonical boards, memory ages and budget boundaries", () => {
    const corpus = buildFeasibilityCorpus().selectActivations
    const bases = ["positive", "tactic", "defense", "boundary", "stale", "memory"].map(family => corpus.find(c => c.family === family)!.input)
    for (const [index, original] of bases.entries()) {
      for (const activationCount of [1, 2, 3, 4] as const) {
        const input = structuredClone(original)
        input.activationCount = activationCount
        input.roundNumber = activationCount
        input.phaseNumber = index + 1
        input.roundInitiativePlayerId = index % 2 === 0 ? "bottom" : "top"
        const self = input.mySoldiers.find(s => s.status === "ACTIVE")!
        const enemy = input.enemySoldiers.find(s => s.status === "ACTIVE")!
        self.position = { x: input.board.bounds.minX + (activationCount === 4 ? 0 : 2), y: input.board.bounds.minY + 2 }
        enemy.position = { x: self.position.x + 1, y: self.position.y }
        syncBoardSoldiers(input)
        const mission = createMission("pincer", input, self.id)
        const memoryVariants = [
          { missions: mission ? [mission] : [] },
          { stalePhase: 1, missions: mission ? [{ ...mission, issuedPhase: 1, expiresPhase: 2 }] : [] },
          { stalePhase: 1, missions: [] },
        ]
        for (const memory of memoryVariants) for (const maxExpansions of [0, 1, 75, 76, 255, 256]) {
          const varied = structuredClone(input)
          varied.phaseNumber = memory.stalePhase ? 4 : input.phaseNumber
          varied.strategyMemory = memory
          compareFrozen(varied, maxExpansions)
          const reversed = structuredClone(varied)
          reversed.mySoldiers.reverse(); reversed.enemySoldiers.reverse(); reversed.board.soldiers.reverse(); reversed.board.terrainStones.reverse()
          compareFrozen(reversed, maxExpansions)
        }
      }
    }
  }, 60000)
  it("matches frozen reference for partner omissions, equal goals and higher-id fallback insertion", () => {
    const source = structuredClone(buildFeasibilityCorpus().selectActivations.find(c => c.family === "positive")!.input)
    source.activationCount = 4
    source.roundNumber = 4
    source.phaseNumber = 4
    const active = source.mySoldiers.filter(s => s.status === "ACTIVE" && s.position)
    const first = active[0]!, second = active[1]!
    const pincer = createMission("pincer", source, first.id)
    const bait = createMission("bait", source, second.id)
    expect(pincer).not.toBeNull(); expect(bait).not.toBeNull()
    const variants = [
      { missions: pincer ? [pincer] : [], activationCount: 1 as const, validPartnerOmitted: true },
      { missions: pincer ? [{ ...pincer, partnerId: "omitted-partner" }] : [], activationCount: 4 as const },
      { missions: pincer && bait ? [{ ...pincer, goal: { x: 5, y: 5 } }, { ...bait, goal: { x: 5, y: 5 } }] : [], activationCount: 4 as const },
      { missions: [], activationCount: 4 as const },
    ]
    for (const variant of variants) {
      const input = structuredClone(source)
      input.activationCount = variant.activationCount ?? 4
      input.strategyMemory = { missions: variant.missions }
      for (const maxExpansions of [0, 1, 75, 76, 255, 256]) {
        compareFrozen(input, maxExpansions)
        if (variant.validPartnerOmitted) {
          const result = selectPlannerActivations(input, { maxExpansions })
          expect(result.activationOrders).toHaveLength(1)
          expect(result.activationOrders[0]?.soldierId).not.toBe(second.id)
        }
      }
    }
  }, 60000)
  it("matches frozen reference across every partial-beam budget on fixed complex observations", () => {
    const corpus = buildFeasibilityCorpus().selectActivations
    const observations = [
      corpus.find(c => c.family === "positive")!.input,
      corpus.find(c => c.family === "memory")!.input,
    ]
    for (const original of observations) {
      const input = structuredClone(original)
      input.activationCount = 4
      input.strategyMemory = structuredClone(input.strategyMemory)
      for (let maxExpansions = 0; maxExpansions <= 256; maxExpansions++) compareFrozen(input, maxExpansions)
    }
  }, 60000)
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
