import { CANONICAL_ARENA_CATALOG_V1_37, DEFAULT_RUNTIME_LIMITS, type StrategyInputV119, type SoldierBrainInputV119 } from "@cowards/spec"
import { createInitialGameState, createStrategyInputV119, createSoldierBrainInputV119 } from "@cowards/engine"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "./contracts.js"

export const FEASIBILITY_MISSIONS = ["evacuation", "rear-entry", "edge-push", "screen", "anchor", "graph-cut-stone", "reserve", "recovery", "bait", "pincer"] as const
export const FEASIBILITY_FAMILIES = ["positive", "stale", "failure", "fallback", "tactic", "defense", "boundary", "Advance", "memory", "hostile-schema"] as const
export interface FeasibilityCase<T> { ordinal: number; mission: string; family: string; input: T; inputRoot: LabRoot; caseRoot: LabRoot }

/** Synthetic legal observation fixtures only: no Strategy code or Match execution.
 * Family labels are scenario descriptions, not claims that a deployed mission passes.
 * The hostile-schema timing family is VALID boundary-sized input. Invalid inputs
 * belong exclusively to Plan06's separately frozen256 invocation inventory.
 */
export const buildFeasibilityCorpus = () => {
  const selectActivations: FeasibilityCase<StrategyInputV119>[] = []
  const soldierBrain: FeasibilityCase<SoldierBrainInputV119>[] = []
  for (const [missionIndex, mission] of FEASIBILITY_MISSIONS.entries()) {
    for (const [familyIndex, family] of FEASIBILITY_FAMILIES.entries()) {
      const ordinal = missionIndex * 10 + familyIndex
      const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((a) => a.id === "arena:smoke:v1")!
      const state = createInitialGameState({
        matchId: `lab-corpus-${ordinal}`, seed: `lab-corpus-${ordinal}`,
        arenaVariant: arena, bottomPlayerId: "bottom", topPlayerId: "top",
        bottomStrategyRevisionId: "lab-candidate", topStrategyRevisionId: "lab-fixture",
      })
      // Canonical state construction/observation owns all rules and projection.
      // We vary static test positions, not transitions or an alternate game loop.
      const self = state.soldiers[0]!
      const enemy = state.soldiers.find((s) => s.ownerPlayerId === "top")!
      const x = 2 + missionIndex % 8
      const y = family === "boundary" ? 10 : 4 + missionIndex % 3
      self.position = { x, y }
      self.facing = ["UP", "RIGHT", "DOWN", "LEFT"][missionIndex % 4] as "UP" | "RIGHT" | "DOWN" | "LEFT"
      self.lastSuccessfulMoveDirection = family === "fallback" ? "DOWN" : null
      enemy.position = { x: family === "defense" ? x - 1 : x, y: y - (family === "tactic" ? 1 : 2) }
      enemy.facing = family === "defense" ? "RIGHT" : family === "tactic" ? "UP" : "DOWN"
      if (family === "failure") enemy.status = "STONE"
      if (family === "fallback") state.terrainStones = [{ x: x + 1, y }]
      state.roundNumber = (1 + missionIndex % 4) as 1 | 2 | 3 | 4
      state.activationCount = state.roundNumber
      state.phaseNumber = family === "stale" ? 3 : 1
      state.initiativePlayerId = missionIndex % 2 === 0 ? "bottom" : "top"
      const context = { mission, family, ordinal }
      state.players[0].strategyMemory = family === "hostile-schema"
        ? { boundary: "x".repeat(32700) } : { fixtureContext: context, stalePhase: family === "stale" ? 1 : state.phaseNumber }
      self.soldierMemory = family === "hostile-schema"
        ? { boundary: "x".repeat(2000) } : { fixtureContext: context, previous: family === "memory" ? "RIGHT" : "UP" }
      // This packet is explicitly fixture context, not the eventual mission ABI.
      const objective = family === "hostile-schema" ? { boundary: "x".repeat(980) } : { fixtureContext: context, target: enemy.position, issuedPhase: family === "stale" ? 1 : state.phaseNumber }
      const strategyInput = createStrategyInputV119(state, "bottom")
      const brainInput = createSoldierBrainInputV119(state, self.id, family === "fallback" ? 11 : familyIndex % 12, family === "Advance", objective)
      const add = <T>(method: string, input: T): FeasibilityCase<T> => {
        const inputRoot = labRoot("timing-input", input)
        return { ordinal, mission, family, input, inputRoot, caseRoot: labRoot("timing-case", { method, ordinal, mission, family, inputRoot }) }
      }
      selectActivations.push(add("selectActivations", strategyInput))
      soldierBrain.push(add("soldierBrain", brainInput))
    }
  }
  // Root only the ordered exact case hashes; large legal inputs stay bounded individually.
  const root = labRoot("timing-corpus", { selectActivations: selectActivations.map((c) => c.caseRoot), soldierBrain: soldierBrain.map((c) => c.caseRoot) })
  return freezeLabValue({ selectActivations, soldierBrain, root })
}

const benchmark = {
  identity: "v1.38-direct-execution-benchmark-v1", hardwareClass: "profile-neutral-fixed-hardware-class-v1",
  inheritedImplementationRoot: "sha256:5f5de6c918c712df428880d3aae2c57b65fbed800adb931b1ff501c05e32d50d",
  warmupsPerMethod: 100, samplesPerMethod: 1000, totalInvocations: 2200,
  order: "selectActivations-warmup-then-measured; soldierBrain-warmup-then-measured",
  traversal: "mission-major-family-minor; sample-index-modulo-100",
  inputReset: "fresh-input-and-memory-every-call", observer: "trusted-direct-method-inside-supervision",
  percentile: "nearest-rank", rank: 990, thresholdMs: 5, comparator: "less_than",
  transportTimingEligible: false, hardwareSubstitutionAfterResults: false,
} as const
const budget = {
  candidateCount: 1, matches: 24, maxPhases: 100, matchDeadlineMs: 120000, overallDeadlineMs: 3600000,
  overallIncludes: ["emitted-build", "validation", "benchmark", "startup", "matches", "cleanup"],
  developmentBeforeTimebox: true, commandWalltimeIsOperationalOnly: true,
  retries: 0, validationInvocations: 256, validationInventoryOwner: "263-06",
  matchMethodCallCeiling: 24800, allMatchMethodCallCeiling: 595200, totalInvocationCeiling: 597656,
  beam: 4, assignmentExpansions: 256, optionalBrainEvaluations: 64, fallbackActionReservation: 9,
  fallbackChargedSeparately: true, sourceHardCapBytes: 65536, sourcePreferredBelowBytes: 49152,
  stopOnExhaustion: true, recordUnusedAllocations: true,
} as const
export const PLANNER_FEASIBILITY_PROTOCOL = freezeLabValue({
  schemaVersion: "planner-feasibility-protocol-v1", admitted: LAB_ADMITTED_ROOTS,
  benchmark, budget, runtimeLimits: structuredClone(DEFAULT_RUNTIME_LIMITS),
  corpusRoot: buildFeasibilityCorpus().root,
  harnessRoot: labRoot("benchmark-harness-spec", benchmark), budgetRoot: labRoot("structural-budget", budget),
  passes: [{ id: "baseline", workers: 1, shardSize: 1, order: "forward" }, { id: "variant", workers: 2, shardSize: 3, order: "reversed" }],
  tracePolicy: { retain: "all", reviewGeometryCells: 8, reviewAllFailures: true },
  scientificCells: 8, labelTasks: 12, candidate: "hierarchical-planner-v1", opponent: "advanced:vanguard-pressure",
  startingProfile: "current-canonical-only", machineIdentityRequiredBeforeExecution: true,
} as const)

export const validateFeasibilityProtocol = (input: unknown) => {
  if (labRoot("protocol", input) !== labRoot("protocol", PLANNER_FEASIBILITY_PROTOCOL)) throw new TypeError("LAB_PROTOCOL_DRIFT")
  return PLANNER_FEASIBILITY_PROTOCOL
}

export const buildFeasibilityAllocation = () => {
  const base = CANONICAL_ARENA_CATALOG_V1_37.arenas.flatMap((arena) => {
    const execution = arena.aliasOf === undefined ? arena : CANONICAL_ARENA_CATALOG_V1_37.arenas.find((a) => a.id === arena.aliasOf)
    if (!execution || !execution.schedulable || execution.status !== "active" || execution.semanticGeometryHash !== arena.semanticGeometryHash) throw new TypeError("LAB_ARENA_IDENTITY")
    return (["bottom", "top"] as const).flatMap((candidateSide) => (["bottom", "top"] as const).map((initiativeSide) => {
      const identity = { geometry: arena.semanticGeometryHash, candidateSide, initiativeSide, split: "feasibility", opponent: LAB_ADMITTED_ROOTS.fixture.id, seedBlock: "lab-feasibility-root-seed-v1", start: LAB_ADMITTED_ROOTS.currentStartRoot }
      return { arenaId: arena.id, executionArenaId: execution.id, candidateSide, initiativeSide,
        geometryCellRoot: labRoot("geometry-cell", identity), taskRoot: labRoot("label-task", { ...identity, arenaId: arena.id }),
        aliasCompatibility: arena.status === "historical_alias" }
    }))
  })
  const seen = new Set<LabRoot>()
  const result = (["baseline", "variant"] as const).flatMap((pass, passIndex) => base.map((cell, index) => {
    const scientificEligible = passIndex === 0 && !seen.has(cell.geometryCellRoot)
    seen.add(cell.geometryCellRoot)
    const ordinal = passIndex * base.length + index
    return { ...cell, ordinal, pass, retry: 0, scientificEligible, reviewed: scientificEligible,
      attemptRoot: labRoot("allocated-attempt", { taskRoot: cell.taskRoot, ordinal, pass }) }
  }))
  if (result.length !== 24 || seen.size !== 8) throw new TypeError("LAB_ALLOCATION_CATALOG_DRIFT")
  return freezeLabValue(result)
}
export const validateFeasibilityAllocation = (input: unknown) => {
  const expected = buildFeasibilityAllocation()
  if (labRoot("allocation", input) !== labRoot("allocation", expected)) throw new TypeError("LAB_ALLOCATION_DRIFT")
  return expected
}

/** Pure calculation only. The bridge must authenticate the observer/sample binding. */
export const evaluateFeasibilityTiming = (samples: { selectActivations: readonly number[]; soldierBrain: readonly number[] }) => {
  const p99 = (values: readonly number[]) => {
    if (values.length !== 1000 || values.some((v) => !Number.isFinite(v) || v < 0)) throw new TypeError("LAB_TIMING_SAMPLES")
    return [...values].sort((a, b) => a - b)[989]!
  }
  const selectActivationsP99Ms = p99(samples.selectActivations)
  const soldierBrainP99Ms = p99(samples.soldierBrain)
  return freezeLabValue({ selectActivationsP99Ms, soldierBrainP99Ms, passed: selectActivationsP99Ms < 5 && soldierBrainP99Ms < 5 })
}
