/** Source-contract fixtures only: these synthetic rows are never Match evidence. */
import { describe, expect, it } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37, type StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, type LeanCurrentBaselineAllocation, type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { executeLeanCurrentPipeline, leanColdProcedureRoot, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"

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

describe("current-only staged baseline wiring (synthetic source tests)", () => {
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
          semanticRoot: labRoot("source-only-repeat", slot.ordinal >= 32 ? slot.ordinal - 24 : slot.ordinal), decisionRoot: labRoot("source-only-decision", slot.ordinal), diagnostic: null }
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
        brainInputs: [], strategyInputs: [], trainingHalfPoints: 0, semanticRoot: null, decisionRoot: labRoot("source-only-empty-decisions", 0), diagnostic: null }
    } })
    expect(calls).toBe(1)
    expect(result).toMatchObject({ status: "partial_or_failed_baseline", stage: "initial_training", training: null })
    expect(result.cells).toHaveLength(1)
    expect(result.root).toMatch(/^sha256:/)
  })
})
