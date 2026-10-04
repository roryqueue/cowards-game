/** Source-contract fixtures only: these synthetic rows are never Match evidence. */
import { describe, expect, it, vi } from "vitest"
import { existsSync } from "node:fs"
import * as coldBuilder from "./v1-38-lean-cold-corpus.js"
import * as proposalBuilder from "./v1-38-lean-training-adapter.js"
import { authenticateLeanColdReuse, LEAN_COLD_REUSE_HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { CANONICAL_ARENA_CATALOG_V1_37, type StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, type LeanCurrentBaselineAllocation, type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { executeLeanCurrentPipeline, executeLeanReusedCurrentPipeline, leanColdProcedureRoot, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { LEAN_BASELINE_REQUIRED_METRICS, type LeanBaselineMetricReceipt } from "./v1-38-lean-baseline-metrics.js"

const seed = "lean-source-fixture-only"
const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
const initialStrategyInput = (): StrategyInputV119 => {
  let machine = MATCH_KERNEL.createMachineV119({ matchId: "source-only-observation", seed, arenaVariant: arenas[0]!, bottomPlayerId: "fixture-bottom", topPlayerId: "fixture-top", bottomStrategyRevisionId: "fixture-bottom-revision", topStrategyRevisionId: "fixture-top-revision", initialInitiativePlayerId: "fixture-bottom" })
  for (let step = 0; step < 100; step++) {
    const next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (next.kind === "effect" && next.request.kind === "selectActivations") return next.request.input as StrategyInputV119
    if (next.kind !== "transition") throw new Error("SOURCE_FIXTURE_INPUT")
    machine = next.machine
  }
  throw new Error("SOURCE_FIXTURE_INPUT")
}
const allocation = (): LeanCurrentBaselineAllocation => ({
  schemaVersion: "lean-current-baseline-allocation-v1", seed, coldRoot: leanColdProcedureRoot(seed), sourceRoot: labRoot("source-only-reviewed-fixture", 1),
  slots: Array.from({ length: 36 }, (_, ordinal): LeanSlot => {
    const kind = currentBaselineSlotKind(ordinal)
    return { ordinal, condition: kind.condition, arenaHash: arenas[kind.arenaIndex]!.semanticGeometryHash, requestRoot: labRoot("source-only-request", ordinal), root: labRoot("source-only-slot", ordinal) }
  }),
} as unknown as LeanCurrentBaselineAllocation)
const syntheticMetrics = (executionRoot: string, success: boolean): LeanBaselineMetricReceipt => {
  const body = { schemaVersion: "v1.38-lean-baseline-match-metrics-v1" as const, source: success ? "actual_canonical_trace" as const : "unavailable" as const,
    executionRoot: executionRoot as `sha256:${string}`, measurements: { terminalLength: null, terminalActivationCount: null, cycleCount: null, contractionCount: null, activeSurvival: null, firstEnemyAwarenessActivation: null, firstContactActivation: null, firstBackstabActivation: null, firstPushActivation: null, firstStoneActivation: null, firstDecisiveActivation: null, contractionFallCount: null, advances: null, stones: null, pushes: null, moveBlocks: null, pushBlocks: null, openingCluster: null }, missing: [...LEAN_BASELINE_REQUIRED_METRICS], formationComparison: "inconclusive" as const }
  return { ...body, root: labRoot("lean-baseline-match-metrics-v1", body) }
}

describe("current-only staged baseline wiring (synthetic source tests)", () => {
  it.skipIf(!existsSync(".strategy-lab/lean-baseline-20261004-v1/cold-corpus.json"))("reuses all seven frozen old packets with zero cold builders and rejects forged authority before dispatch", async () => {
    const current = { ...allocation(), seed: LEAN_COLD_REUSE_HISTORY.seed, coldRoot: LEAN_COLD_REUSE_HISTORY.coldRoot }
    const reuse = authenticateLeanColdReuse({ directory: ".strategy-lab/lean-baseline-20261004-v1", newSourceRoot: current.sourceRoot, amendmentRoot: LEAN_COLD_REUSE_HISTORY.amendmentRoot })
    const cold = vi.spyOn(coldBuilder, "buildLeanColdCorpus").mockImplementation(() => { throw new Error("FORBIDDEN_COLD_BUILDER") })
    const proposals = vi.spyOn(proposalBuilder, "buildLeanInitialProposals").mockImplementation(() => { throw new Error("FORBIDDEN_PROPOSAL_BUILDER") })
    const frozen: unknown[] = [], dispatch = vi.fn(async () => { throw new Error("FIRST_INITIAL_TRAINING_DISPATCH") })
    try {
      const input = { allocation: current, reuse, freezeSource: (source: unknown) => frozen.push(source), retainArtifact() {}, checkpoint() {}, dispatch }
      await expect(executeLeanReusedCurrentPipeline(input)).rejects.toThrow("FIRST_INITIAL_TRAINING_DISPATCH")
      expect(dispatch).toHaveBeenCalledOnce()
      expect(frozen).toEqual(reuse.sources)
      expect(cold).not.toHaveBeenCalled(); expect(proposals).not.toHaveBeenCalled()
      dispatch.mockClear()
      await expect(executeLeanReusedCurrentPipeline({ ...input, allocation: { ...current, seed: "forged" } })).rejects.toThrow()
      await expect(executeLeanReusedCurrentPipeline({ ...input, reuse: { ...reuse, grant: { ...reuse.grant, newSourceRoot: labRoot("forged", 1) } } })).rejects.toThrow()
      expect(dispatch).not.toHaveBeenCalled()
    } finally { vi.restoreAllMocks() }
  }, 20000)
  it("finishes exactly 36 calls, freezes sources at stages, and retains compact observation joins", async () => {
    const corpus = buildLeanColdCorpus(seed), strategyInput = initialStrategyInput()
    const frozen: Array<{ role: string; callsBeforeFreeze: number }> = [], names: string[] = []
    let calls = 0
    const result = await executeLeanCurrentPipeline({ allocation: allocation(),
      freezeSource: source => frozen.push({ role: source.role, callsBeforeFreeze: calls }),
      retainArtifact: name => names.push(name), checkpoint() {},
      async dispatch(slot, bottom, top): Promise<LeanBaselineObservedCell> {
        calls++
        return { ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot,
          compact: { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: labRoot("source-only-accounting", slot.ordinal), executionRoot: labRoot("source-only-execution", slot.ordinal), telemetry: { transitions: 1, events: 1 } },
          brainInputs: [corpus.tacticalInputs[0]!], strategyInputs: [strategyInput], trainingHalfPoints: 1,
          semanticRoot: labRoot("source-only-repeat", slot.ordinal >= 32 ? slot.ordinal - 24 : slot.ordinal), metrics: syntheticMetrics(labRoot("source-only-execution", slot.ordinal), true), decisionRoot: labRoot("source-only-decision", slot.ordinal), diagnostic: null }
      },
    })
    expect(calls).toBe(36)
    expect(result.status).toBe("current_baseline_complete")
    expect(result.cells).toHaveLength(36)
    expect(result.cells.every(cell => !("brainInputs" in cell) && cell.brainInputCount === 1 && /^sha256:/.test(cell.observationRoot))).toBe(true)
    expect(frozen.find(s => s.role === "cold-opponent")?.callsBeforeFreeze).toBe(0)
    expect(frozen.find(s => s.role === "probe")?.callsBeforeFreeze).toBe(0)
    expect(frozen.find(s => s.role === "initial-tactical")?.callsBeforeFreeze).toBe(8)
    expect(frozen.find(s => s.role === "final-response")?.callsBeforeFreeze).toBe(20)
    expect(frozen.some(s => /inward|bracket|holdout/.test(s.role))).toBe(false)
    expect(names).toContain("response-work.json")
    expect(result).toMatchObject({ holdoutOpened: false, formationMaterialized: false })
    expect(result.root).toMatch(/^sha256:/)
  }, 20000)
  it("preserves the first failed cell and leaves every later slot unlaunched", async () => {
    let calls = 0
    const result = await executeLeanCurrentPipeline({ allocation: allocation(), freezeSource() {}, retainArtifact() {}, checkpoint() {}, async dispatch(slot, bottom, top) {
      calls++
      return { ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot,
        compact: { classification: "system_failure", code: "SUPERVISOR_FAILURE", outcome: null, elapsedMs: 1, cleanupComplete: true, invocationCount: 0, accountingRoot: labRoot("source-only-failed-accounting", 0), executionRoot: labRoot("source-only-failed-execution", 0), telemetry: { transitions: 0, events: 0 } },
        brainInputs: [], strategyInputs: [], trainingHalfPoints: null, semanticRoot: null, metrics: syntheticMetrics(labRoot("source-only-failed-execution", 0), false), decisionRoot: labRoot("source-only-empty-decisions", 0), diagnostic: null }
    } })
    expect(calls).toBe(1)
    expect(result).toMatchObject({ status: "partial_or_failed_baseline", stage: "initial_training", training: null })
    expect(result.cells).toHaveLength(1)
    expect(result.root).toMatch(/^sha256:/)
  })
  it("keeps all eight fresh response pairings below and above mixture threshold without unsupported admission", async () => {
    const corpus = buildLeanColdCorpus(seed), strategyInput = initialStrategyInput()
    for (const variant of ["security_gap_counterexample", "above_mixture_threshold"] as const) {
    let calls = 0
    const result = await executeLeanCurrentPipeline({ allocation: allocation(), freezeSource() {}, retainArtifact() {}, checkpoint() {}, async dispatch(slot, bottom, top): Promise<LeanBaselineObservedCell> {
      calls++
      const entrantSeat = slot.condition < 2 ? "bottom" : "top"
      const initialOutcome = slot.ordinal === 8 || slot.ordinal === 9 ? entrantSeat : slot.ordinal === 10 ? "DRAW" : entrantSeat === "bottom" ? "top" : "bottom"
      const responseVsStrongest = variant === "above_mixture_threshold" && slot.ordinal < 23 ? entrantSeat : "DRAW"
      const outcome = slot.ordinal >= 8 && slot.ordinal < 12 ? initialOutcome : slot.ordinal >= 20 && slot.ordinal < 24 ? responseVsStrongest : slot.ordinal >= 24 && slot.ordinal < 28 ? entrantSeat : "DRAW"
      return { ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot,
        compact: { classification: "success", code: "OK", outcome, elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: labRoot("response-test-accounting", slot.ordinal), executionRoot: labRoot("response-test-execution", slot.ordinal), telemetry: { transitions: 1, events: 1 } },
        brainInputs: [corpus.tacticalInputs[0]!], strategyInputs: [strategyInput], trainingHalfPoints: outcome === "DRAW" ? 1 : 0,
        semanticRoot: labRoot("response-test-repeat", slot.ordinal >= 32 ? slot.ordinal - 24 : slot.ordinal), metrics: syntheticMetrics(labRoot("response-test-execution", slot.ordinal), true), decisionRoot: labRoot("response-test-decision", slot.ordinal), diagnostic: null }
    } })
    expect(calls).toBe(36)
    expect(result.status).toBe("current_baseline_complete")
    if (!("response" in result)) throw new Error("SOURCE_ONLY_RESPONSE_NOT_REACHED")
    expect(result.cells.slice(20, 28)).toHaveLength(8)
    expect(result.eligiblePureRoots).toHaveLength(2)
    if (variant === "security_gap_counterexample") {
      expect(result.response.unweightedSecurityDiagnostic.gapHalfPoints).toBe(0.25)
      expect(result.response.frozenMixtureNormalizedScore).toMatchObject({ numerator: "1", denominator: "2", passed: false })
      expect(result.response.disposition).toBe("frozen_mixture_threshold_not_met")
    } else {
      expect(result.response.frozenMixtureNormalizedScore).toMatchObject({ numerator: "7", denominator: "8", passed: true })
      expect(result.response.disposition).toBe("fresh_strongest_pure_comparator_unsupported")
    }
    expect(result.response).toMatchObject({ admitted: false, strongestPureFreshComparator: { status: "unsupported", reason: "strongest_pure_self_pair_not_allocated" } })
    }
  }, 45000)
})
