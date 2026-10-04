/** Nonlearned canonical prefix observations, never execution of authored source. */
import { CANONICAL_ARENA_CATALOG_V1_37, type SoldierBrainInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { searchCanonicalCounterfactual } from "../../packages/strategy-oracle-teacher/src/teacher.js"
import { deriveLeanColdCorpusRoot } from "../../packages/strategy-lab/src/league/lean-training.js"

const fail = (): never => { throw new TypeError("LEAN_COLD_CORPUS") }
export const buildLeanColdCorpus = (seed: string) => {
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
  if (arenas.length !== 2) return fail()
  const inputs: SoldierBrainInputV119[] = []
  // Two fixed canonical prefixes with a declared hand-coded protocol policy.
  // They terminate at 32 legal brain observations, not at a Match result, and
  // use neither a candidate nor competitive feedback nor a source evaluator.
  for (const [ordinal, arena] of arenas.entries()) {
    const match = { matchId: `lean-cold-prefix-${ordinal}`, seed: `${seed}-corpus-${ordinal}`, arenaVariant: arena, bottomPlayerId: "cold-bottom", topPlayerId: "cold-top", bottomStrategyRevisionId: "nonlearned-prefix-bottom", topStrategyRevisionId: "nonlearned-prefix-top", initialInitiativePlayerId: ordinal === 0 ? "cold-bottom" : "cold-top" }
    let machine = MATCH_KERNEL.createMachineV119(match), count = 0
    for (let steps = 0; steps < 10000 && count < 32; steps++) {
      const next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (next.kind === "failure" || next.kind === "completed") return fail()
      if (next.kind === "transition") { machine = next.machine; continue }
      const request = next.request
      let value: unknown
      if (request.kind === "soldierBrain") {
        const input = request.input as SoldierBrainInputV119
        inputs.push(structuredClone(input)); count++
        value = { action: { type: "TURN", direction: count % 2 === 0 ? "RIGHT" : "LEFT" }, soldierMemory: {} }
      } else {
        const input = request.input
        value = { activationOrders: [...input.mySoldiers].filter(s => s.status === "ACTIVE").sort((a, b) => a.id.localeCompare(b.id)).slice(0, input.activationCount).map(s => ({ soldierId: s.id, objective: null })), strategyMemory: {} }
      }
      const resumed = MATCH_KERNEL.stepMatch(next.machine, { kind: "runtime_resume", requestId: request.requestId, effectKind: request.kind, classification: "success", value })
      if (resumed.kind === "failure" || resumed.kind === "effect" || resumed.kind === "completed") return fail()
      machine = resumed.machine
    }
    if (count !== 32) return fail()
  }
  const corpusRoot = deriveLeanColdCorpusRoot(inputs)
  const teacher = searchCanonicalCounterfactual({ canonicalMatch: { matchId: "lean-cold-teacher", seed: `${seed}-teacher`, arenaVariant: arenas[0]!, bottomPlayerId: "teacher-bottom", topPlayerId: "teacher-top", bottomStrategyRevisionId: "nonlearned-teacher-bottom", topStrategyRevisionId: "nonlearned-teacher-top", initialInitiativePlayerId: "teacher-bottom" }, studentPlayerId: "teacher-bottom", counterfactual: { opponentHypothesis: "aggressive" }, maxDepth: 6, maxNodes: 64 })
  if (teacher.nodesVisited !== 64 || !teacher.selectedLegalTargets.length) return fail()
  return { schemaVersion: "lean-nonlearned-cold-corpus-v1" as const, seed, policy: "canonical-prefix-turn-left-right-v1" as const, prefixObservationCounts: [32, 32] as const, distinctTacticalInputCount: new Set(inputs.map(input => labRoot("runtime-input", input))).size, tacticalInputs: inputs, corpusRoot, teacherSearchReceipts: [teacher] }
}
