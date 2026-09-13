import type { SoldierBrainInputV119, SoldierBrainResult, StrategyInputV119, StrategyResult } from "@cowards/spec"
import { compareTacticalRanks, scoreTacticalAction, tacticalActionChoices, type TacticalMission } from "./scoring.js"
import { selectTacticalSearchNode } from "./search.js"

const isTacticalMission = (value: unknown): value is TacticalMission => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const mission = value as Record<string, unknown>
  return mission.schemaVersion === "tactical-mission-v1" && typeof mission.soldierId === "string" &&
    (typeof mission.targetId === "string" || mission.targetId === null)
}

const readableMission = (input: SoldierBrainInputV119): TacticalMission | null => {
  if (!isTacticalMission(input.objective)) return null
  const mission = input.objective as TacticalMission
  if (mission.soldierId !== input.self.id || !mission.goal || typeof mission.goal !== "object" || !["UP", "RIGHT", "DOWN", "LEFT"].includes(mission.goalFacing)) return null
  return mission
}

/** Ordered response generation from the leaf's bounded board search. */
export const selectTacticalActivations = (input: StrategyInputV119): StrategyResult => {
  const selected = selectTacticalSearchNode(input).selected
  return {
    activationOrders: selected.map((mission) => ({ soldierId: mission.soldierId, objective: mission })),
    strategyMemory: { tactical: { schemaVersion: "tactical-memory-v1", algorithm: "tactical-beam-v1", selected: selected.map((mission) => mission.soldierId) } },
  }
}

/** Local tactical Action response; it consumes no planner board data or hidden state. */
export const runTacticalSoldierBrain = (input: SoldierBrainInputV119): SoldierBrainResult => {
  const mission = readableMission(input)
  const action = tacticalActionChoices()
    .map((candidate, ordinal) => ({ action: candidate, rank: scoreTacticalAction(input, candidate, mission, ordinal) }))
    .sort((left, right) => compareTacticalRanks(left.rank, right.rank))[0]!.action
  return {
    action,
    soldierMemory: { tactical: { schemaVersion: "tactical-brain-v1", posture: mission?.posture ?? "screen", cycle: input.cycleIndex } },
  }
}
