/** Source-contract fixtures only: these synthetic rows are never Match evidence. */
import { describe, expect, it, vi } from "vitest"
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
import { createLeanBaselineContinuationAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as pipelineModule from "./v1-38-lean-baseline-pipeline.js"
import * as continuationLedger from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as continuationMain from "../run-v1-38-lean-baseline.js"
import * as continuationFiles from "./v1-38-lean-baseline-continuation.js"
import * as fixtureFs from "node:fs"
import * as implementationManifest from "../v1-38-factory-implementation.js"
import * as continuationSource from "./v1-38-lean-baseline-source.js"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
vi.mock("node:fs", async original => { const fs = await original<typeof import("node:fs")>(); return { ...fs, mkdirSync: vi.fn(fs.mkdirSync), openSync: vi.fn(fs.openSync) } })
vi.mock("./v1-38-lean-seal-metadata.js", () => ({ inspectLeanSealMetadata: () => ({ schemaVersion: "inert-seal-metadata", holdoutOpened: false }) }))

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
  it("[continuation-v2] refuses metadata reservation before legacy journal/time parsing", () => {
    const ledgerRead = vi.fn(), timeRead = vi.fn(), reserve = vi.fn((bytes: number) => { if (bytes > 0) throw new Error("RESERVATION_REFUSED") })
    expect(() => continuationMain.withLeanContinuationMetadataReservationV2(4096, reserve, () => { ledgerRead(); timeRead() })).toThrow("RESERVATION_REFUSED")
    expect(reserve).toHaveBeenCalledWith(4096 + 7 * 4194304 + 262144)
    expect(ledgerRead).not.toHaveBeenCalled(); expect(timeRead).not.toHaveBeenCalled()
  })
  // This legacy integration case consumes a canonical historical store. Source
  // execution is explicitly forbidden from opening it; keep it out of this suite.
  it.skip("reuses all seven frozen old packets with zero cold builders and rejects forged authority before dispatch", async () => {
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

describe("fresh continuation only", () => {
  it("[continuation-v2] publication binds window, source, request and held HEAD with guarded exclusive writes", () => {
    const r = (s: string) => labRoot("inert-v2-publication", s), directory = fixtureFs.realpathSync(fixtureFs.mkdtempSync(join(tmpdir(), "inert-v2-publication-")))
    const source = continuationSource.buildLeanBaselineSource({ source: buildPlannerCandidate().source, role: "probe", coldRoot: r("cold"), implementationRoot: r("source") })
    const a = { schemaVersion: "lean-baseline-continuation-allocation-v2", root: r("allocation"), sourceRoot: source.implementationRoot, coldRoot: source.coldRoot, sourceHead: "a".repeat(40), requestBytesRoot: r("request"), window: { root: r("window") }, windowBytesRoot: r("window-bytes"), dataReviewRoot: r("data-review") }
    const validate = vi.spyOn(continuationLedger, "validateLeanBaselineContinuationAllocationV2").mockReturnValue(a as never)
    const entry = vi.spyOn(continuationLedger, "readLeanChildEntry").mockReturnValue({ head: "b".repeat(40), sourceRoot: a.sourceRoot, allocationRoot: a.root, requestBytesRoot: a.requestBytesRoot } as never)
    const capacity = vi.spyOn(continuationLedger, "assertLeanPublicationCapacity").mockImplementation(() => {})
    const ledger = { directory, allocation: a } as never, guard = vi.fn()
    try {
      expect(() => continuationSource.publishLeanBaselineContinuationSourceV2(ledger, source, () => { throw new Error("INERT_RESERVATION_DENIED") })).toThrow("INERT_RESERVATION_DENIED")
      expect(fixtureFs.readdirSync(directory)).toEqual([])
      continuationSource.publishLeanBaselineContinuationSourceV2(ledger, source, guard)
      const publication = JSON.parse(fixtureFs.readFileSync(join(directory, "publication-probe-continuation-v2.json"), "utf8"))
      expect(publication).toMatchObject({ schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: a.root, requestBytesRoot: a.requestBytesRoot, sourceHead: a.sourceHead, head: "b".repeat(40), windowRoot: a.window.root, dataReviewRoot: a.dataReviewRoot, snapshotRoot: source.root })
      expect(guard.mock.calls.length).toBeGreaterThanOrEqual(6)
      expect(() => continuationSource.publishLeanBaselineContinuationSourceV2(ledger, source, guard)).toThrow()
    } finally { validate.mockRestore(); entry.mockRestore(); capacity.mockRestore(); fixtureFs.rmSync(directory, { recursive: true }) }
  })
  it("[continuation-v2] setup permits only exact registered directory additions and preserves blocks", () => {
    const before = { path: ".strategy-lab", kind: "directory" as const, dev: 1, ino: 1, mode: 0o755, bytes: 100, allocatedBytes: 4096, mtimeMs: 1, ctimeMs: 1, rawRoot: null, members: ["existing"] }
    const members = ["existing", "lean-baseline-continuation-20261012-v3", "lean-baseline-continuation-20261012-v3-tmp"].sort(), after = { ...before, members, bytes: 200, mtimeMs: 2, ctimeMs: 2 }
    expect(() => continuationMain.validateLeanContinuationSetupDirectoriesV2([before], [after])).not.toThrow()
    for (const changed of [{ ...after, members: [...members, "unknown"] }, { ...after, ino: 2 }, { ...after, allocatedBytes: 0 }, { ...after, members: members.slice(1) }]) expect(() => continuationMain.validateLeanContinuationSetupDirectoriesV2([before], [changed])).toThrow()
  })
  it("[continuation-v2] source metadata is grant-independent and cannot stand in for an admitting manifest", () => {
    const r = (s: string) => labRoot("inert-source-metadata", s)
    const manifest = vi.spyOn(implementationManifest, "factoryAssessmentImplementationManifest").mockReturnValue({ entries: [], root: r("base") } as never)
    const source = vi.spyOn(fixtureFs, "readFileSync").mockReturnValue(Buffer.from("inert-reviewed-source"))
    const oldRead = vi.spyOn(continuationFiles, "readLeanContinuationBytes").mockReturnValue(Buffer.from("inert-source-gate-not-passed"))
    const privateRead = vi.spyOn(continuationFiles, "readLeanContinuationBoundedBytesV2").mockImplementation(() => { throw new Error("GRANT_READ_FORBIDDEN") })
    try {
      const metadata = continuationMain.leanBaselineContinuationSourceManifestV2()
      expect(metadata).toMatchObject({ admitting: false, schemaVersion: "lean-baseline-continuation-source-manifest-v2", sourceGate: null, sourceGateRoot: null })
      expect(metadata.root).toBe(labRoot("lean-baseline-continuation-implementation-v2", metadata.implementationEntries))
      expect(privateRead).not.toHaveBeenCalled()
      expect(() => continuationMain.leanBaselineContinuationDataManifestV2(undefined as never, metadata)).toThrow()
      expect(privateRead).not.toHaveBeenCalled()
    } finally { manifest.mockRestore(); source.mockRestore(); oldRead.mockRestore(); privateRead.mockRestore() }
  })
  it("[continuation-v2] exact source/data projections reject reused status, duplicate JSON and extra fields", () => {
    const r = (s: string) => labRoot("inert-v2-gates", s)
    const sourceGate = { schemaVersion: "lean-baseline-continuation-source-gate-v2" as const, plan_check: "passed" as const, source_review: "passed" as const, root_validation: "passed" as const, source_verification: "passed" as const, commands_closed: true as const, reviewedSourceHead: "a".repeat(40), sourceRoot: r("source"), sourceAuthor: "author", sourceReviewer: "reviewer", sourceVerifier: "verifier" }
    const raw = Buffer.from(continuationLedger.leanCanonicalBytes(sourceGate)).toString(), fence = `\`\`\`json\n${raw}\n\`\`\``
    expect(continuationMain.readLeanContinuationGateProjectionV2(fence, sourceGate.schemaVersion)).toEqual(sourceGate)
    expect(continuationMain.validateLeanContinuationSourceGateV2(sourceGate)).toEqual(sourceGate)
    expect(() => continuationMain.readLeanContinuationGateProjectionV2(`${fence}\n${fence}`, sourceGate.schemaVersion)).toThrow(/DUPLICATE/)
    expect(() => continuationMain.readLeanContinuationGateProjectionV2(fence.replace('"commands_closed":true', '"commands_closed":false,"commands_closed":true'), sourceGate.schemaVersion)).toThrow(/CANONICAL/)
    for (const patch of [{ source_verification: "pending" }, { sourceReviewer: "author" }, { extra: true }, { schemaVersion: "old-gate" }, { commands_closed: false }]) expect(() => continuationMain.validateLeanContinuationSourceGateV2({ ...sourceGate, ...patch })).toThrow()
  })
  it("[continuation-v2] missing window refuses real preparation before all writes and allocation", () => {
    const read = vi.spyOn(continuationFiles, "readLeanContinuationBoundedBytesV2").mockImplementation(() => { throw new Error("INERT_MISSING_WINDOW") })
    const mkdir = vi.spyOn(fixtureFs, "mkdirSync").mockImplementation(() => { throw new Error("MUTATION_FORBIDDEN") })
    const open = vi.spyOn(fixtureFs, "openSync").mockImplementation(() => { throw new Error("MUTATION_FORBIDDEN") })
    const allocate = vi.spyOn(continuationLedger, "createLeanBaselineContinuationAllocationV2")
    // The module's fs mock is shared with earlier inert publication fixtures.
    // Observe only this denied preparation, not the fixture setup above.
    mkdir.mockClear(); open.mockClear(); allocate.mockClear()
    try {
      expect(() => continuationMain.prepareLeanBaselineContinuationV2(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toThrow("INERT_MISSING_WINDOW")
      expect(mkdir).not.toHaveBeenCalled(); expect(open).not.toHaveBeenCalled(); expect(allocate).not.toHaveBeenCalled()
    } finally { read.mockRestore(); mkdir.mockRestore(); open.mockRestore(); allocate.mockRestore() }
  })
  it.each(([0, 1] as const).flatMap(points => (["v1", "v2"] as const).map(version => ({ points, version, label: version === "v2" ? "[continuation-v2]" : "legacy" }))))("$label preserves response score $points, actual receipts and all 36 scheduled cells", async ({ points, version }) => {
    const r = (v: unknown) => labRoot("inert-continuation-pipeline", v), coldRoot = leanColdProcedureRoot(seed)
    const p = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 459375903 as const, allocatedDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
    const old = createLeanBaselineContinuationAllocation({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot, planRoot: r("plan"), candidateRoots: [r("a"), r("b")], requestRoots: Array.from({ length: 36 }, (_, n) => r(n)), seed, sourceHead: "a".repeat(40), planningRoot: r("planning"), requestBytesRoot: r("request"), offlineOverheadMs: 60000, predecessor: { ...p, root: labRoot(p.schemaVersion, p) } })
    const wb = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "synthetic-pipeline", approvalEvidence: { humanDecisionId: "synthetic-decision", recordedBy: "synthetic-root" }, approvedAtMs: 1791820000000, anchorMs: 1791820000000, deadlineMs: 1791848800000, carryMs: 472058903, capMs: 500858903, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261012-v3" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: r("source"), sourceGateRoot: r("source-gate"), planRoot: r("plan"), runOperator: "synthetic-runner", readerOperator: "synthetic-reader" }, window = { ...wb, root: labRoot(wb.schemaVersion, wb) }
    const pb = { ...p, schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, originalCarryRoot: r("original"), closedCapsuleRoot: r("closed") }
    const a = version === "v1" ? old : continuationLedger.createLeanBaselineContinuationAllocationV2({ sourceRoot: old.sourceRoot, reviewRoot: old.reviewRoot, coldRoot, planRoot: old.planRoot, candidateRoots: old.candidateRoots, requestRoots: old.requestRoots, seed, sourceHead: "b".repeat(40), planningRoot: old.planningRoot, manifestRoot: r("manifest"), requestBytesRoot: old.requestBytesRoot, window, windowBytesRoot: continuationLedger.leanBytesRoot(continuationLedger.leanCanonicalBytes(window)), sourceGateRoot: window.sourceGateRoot, dataReviewRoot: r("data-review"), predecessor: { ...pb, root: labRoot(pb.schemaVersion, pb) } })
    const corpus = buildLeanColdCorpus(seed), input = initialStrategyInput(), artifacts: Record<string, any> = {}, ordinals: number[] = []
    const execute = (input: Omit<Parameters<typeof pipelineModule.executeLeanBaselineContinuationPipeline>[0], "allocation"> & { allocation: typeof a; heldHead: string }) => version === "v2" ? pipelineModule.executeLeanBaselineContinuationPipelineV2(input as Parameters<typeof pipelineModule.executeLeanBaselineContinuationPipelineV2>[0]) : pipelineModule.executeLeanBaselineContinuationPipeline(input as Parameters<typeof pipelineModule.executeLeanBaselineContinuationPipeline>[0])
    const result = await execute({ allocation: a, heldHead: "c".repeat(40), checkpoint() {}, freezeSource() {}, retainArtifact(name, value) { artifacts[name] = value }, async dispatch(slot, bottom, top) {
      ordinals.push(slot.ordinal)
      return { ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact: { classification: "success", code: "OK", outcome: "DRAW", elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: r(`accounting-${slot.ordinal}`), executionRoot: r(`execution-${slot.ordinal}`), telemetry: { transitions: 1, events: 1 } }, brainInputs: [corpus.tacticalInputs[0]!], strategyInputs: [input], trainingHalfPoints: slot.ordinal >= 12 && slot.ordinal < 20 ? points : 1, semanticRoot: r(`semantic-${slot.ordinal >= 32 ? slot.ordinal - 24 : slot.ordinal}`), decisionRoot: r(`decision-${slot.ordinal}`), diagnostic: null, metrics: syntheticMetrics(r(`execution-${slot.ordinal}`), true) } as LeanBaselineObservedCell
    } })
    expect(ordinals).toEqual(Array.from({ length: 36 }, (_, n) => n))
    if (version === "v2") { expect(a.predecessor.chargedMatches + ordinals.length).toBe(86); expect(result).toMatchObject({ schemaVersion: "lean-baseline-continuation-pipeline-v2", allocationRoot: a.root }) }
    expect(result).toMatchObject({ status: "current_baseline_complete", response: { admitted: false }, unusedOrdinals: [], holdoutOpened: false })
    expect(result.holdoutReservations).toEqual(a.holdoutReservations)
    expect(artifacts["response-node-receipts.json"]).toHaveLength(8)
    const receipts = artifacts["response-node-receipts.json"] as Array<{ allocation: number; actualNodes: number }>, work = artifacts["work-accounting.json"]
    const actual = receipts.reduce((sum, row) => sum + row.actualNodes, 0)
    expect(receipts.reduce((sum, row) => sum + row.allocation, 0)).toBe(128)
    expect(work).toMatchObject({ allocated: { tacticalEvaluations: 64, teacherNodes: 64, distillationExamples: 64, responseNodes: 128, total: 320 }, actual: { responseNodes: actual, total: 192 + actual }, unused: { responseNodes: 128 - actual, total: 128 - actual } })
    expect(work.actual.responseNodes).toBe(artifacts["response-work.json"].actualAssignmentNodes)
  }, 30000)
})
