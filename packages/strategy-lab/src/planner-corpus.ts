import type { StrategyInputV119, SoldierBrainInputV119 } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "./contracts.js"
import { MISSION_KINDS, createMission, fallbackMission, type MissionKind, type MissionObjective } from "./planner/missions.js"

export interface Case<T> { ordinal: number; mission: string; family: string; input: T; inputRoot: LabRoot; caseRoot: LabRoot }
interface Corpus { selectActivations: readonly Case<StrategyInputV119>[]; soldierBrain: readonly Case<SoldierBrainInputV119>[]; root: LabRoot }

/** Premeasurement mapping of canonical observations, never a timing-dependent
 * adaptation. Old fixture roots are retained as provenance, not empirical data. */
export const mapPlannerMissionCorpus = (corpus: Corpus) => {
  const selectActivations = corpus.selectActivations.map(c => structuredClone(c))
  const mappings: { ordinal: number; requested: string; realized: string; fallback: boolean }[] = []
  const soldierBrain = corpus.soldierBrain.map(c => {
    const planner = selectActivations.find(p => p.ordinal === c.ordinal)
    if (!planner || !MISSION_KINDS.includes(c.mission as MissionKind)) throw new TypeError("PLANNER_CORPUS_PAIR")
    const intended = createMission(c.mission as MissionKind, planner.input, c.input.self.id)
    const mission = intended ?? fallbackMission(planner.input, c.input.self.id)
    if (c.family === "stale") { mission.issuedPhase = 1; mission.expiresPhase = 2 }
    const missions: MissionObjective[] = [mission]
    if (c.family === "failure") {
      // Bind a previously issued enemy-target mission to the actual now-STONE
      // target in the canonical observation. Rehydrate only its issuance view.
      const issuance = structuredClone(planner.input)
      for (const soldier of [...issuance.enemySoldiers, ...issuance.board.soldiers]) {
        if (soldier.status === "STONE" && issuance.enemySoldiers.some(enemy => enemy.id === soldier.id)) soldier.status = "ACTIVE"
      }
      const failed = createMission("rear-entry", issuance, c.input.self.id)
      if (!failed) throw new TypeError("PLANNER_CORPUS_FAILED_MISSION")
      missions.push(failed)
    }
    const input = structuredClone(c.input)
    if (c.family !== "hostile-schema") {
      planner.input.strategyMemory = { fixtureContext: { ordinal: c.ordinal, family: c.family, mission: c.mission }, missions: c.family === "fallback" ? [] : missions }
      input.objective = c.family === "fallback" ? null : mission
      // Brain has no Phase field: exercise its actual local stale-target guard,
      // separately from the full-board planner's Phase-expiry guard.
      if (c.family === "stale" && mission.targetPosition && input.self.position) {
        const empty = input.awarenessGrid.cells.find(cell => cell.contents === "EMPTY")
        if (!empty) throw new TypeError("PLANNER_CORPUS_STALE_TARGET")
        input.objective = { ...mission, targetPosition: { x: input.self.position.x + empty.dx, y: input.self.position.y + empty.dy } }
      }
    }
    mappings.push({ ordinal: c.ordinal, requested: c.mission, realized: c.family === "hostile-schema" ? "invalid-objective" : c.family === "fallback" ? "absent-objective" : mission.kind, fallback: intended === null || c.family === "fallback" })
    const inputRoot = labRoot("timing-input", input)
    return { ...c, input, inputRoot, caseRoot: labRoot("timing-case", { method: "soldierBrain", ordinal: c.ordinal, mission: c.mission, family: c.family, inputRoot }) }
  })
  for (const c of selectActivations) {
    c.inputRoot = labRoot("timing-input", c.input)
    c.caseRoot = labRoot("timing-case", { method: "selectActivations", ordinal: c.ordinal, mission: c.mission, family: c.family, inputRoot: c.inputRoot })
  }
  const root = labRoot("timing-corpus", { selectActivations: selectActivations.map(c => c.caseRoot), soldierBrain: soldierBrain.map(c => c.caseRoot) })
  return freezeLabValue({ selectActivations, soldierBrain, root, mappingVersion: "fixture-to-mission-paths-v2", sourceCorpusRoot: corpus.root, mappings })
}
