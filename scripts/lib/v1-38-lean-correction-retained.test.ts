import { describe, expect, it, vi } from "vitest"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { CANONICAL_ARENA_CATALOG_V1_37, type StrategyInputV119 } from "@cowards/spec"
import * as planner from "../../packages/strategy-lab/src/planner/assign.js"
import * as coldBuilder from "./v1-38-lean-cold-corpus.js"
import * as proposalBuilder from "./v1-38-lean-training-adapter.js"
import { executeLeanReusedCurrentPipeline, compactLeanBaselineCell, leanBaselineMetricCoverage, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { buildLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { auditLeanCorrectionRetained, type LeanCorrectionRetainedSnapshot } from "./v1-38-lean-correction-retained.js"
import { existsSync } from "node:fs"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_BASELINE_STORE, createLeanCorrectionAllocation, leanCanonicalBytes, leanBytesRoot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { authenticateLeanColdReuse, LEAN_COLD_REUSE_HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { correctionAllocationFixture } from "../run-v1-38-lean-correction.test.js"

const reuseDirectory = process.env.LEAN_COLD_REUSE_FIXTURE_DIR ?? LEAN_BASELINE_STORE
const fixture = () => {
  const allocationFixture = correctionAllocationFixture()
  const reuse = authenticateLeanColdReuse({ directory: reuseDirectory, newSourceRoot: allocationFixture.sourceRoot, amendmentRoot: LEAN_COLD_REUSE_HISTORY.amendmentRoot })
  const a = createLeanCorrectionAllocation({ sourceRoot: allocationFixture.sourceRoot, reviewRoot: allocationFixture.reviewRoot, coldRoot: allocationFixture.coldRoot, planRoot: allocationFixture.planRoot, candidateRoots: allocationFixture.candidateRoots, requestRoots: allocationFixture.requestRoots, seed: allocationFixture.seed, route: "diagnostic", reuseGrantRoot: reuse.grant.root, diagnosisRoot: null, predecessor: allocationFixture.predecessor })
  const bottom = reuse.sources.find(s => s.role === "tactical-0")!, top = reuse.sources.find(s => s.role === "cold-opponent")!, slot = a.slots[0]!
  const request = { schemaVersion: "lean-correction-request-v1", route: "diagnostic", sourceRoot: a.sourceRoot, planRoot: a.planRoot, amendmentRoot: reuse.grant.amendmentRoot, reviewPath: "mock", reviewRoot: a.reviewRoot, dataReviewPath: "mock", dataReviewRoot: a.reviewRoot, coldRoot: a.coldRoot, seed: a.seed, reuseGrantRoot: reuse.grant.root, candidateRoots: a.candidateRoots, requestRoots: a.requestRoots, diagnosis: null }
  const chargeBody = { schemaVersion: "lean-slot-charge-v1", allocationRoot: a.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
  const compact = { classification: "system_failure", code: "SUPERVISOR_FAILURE", outcome: null, elapsedMs: 5000, cleanupComplete: true, invocationCount: 1, accountingRoot: labRoot("mock-accounting", {}), executionRoot: labRoot("mock-execution", {}), telemetry: { transitions: 0, events: 0 } }
  const events = [{ kind: "charge", charge }, { kind: "terminal", chargeRoot: charge.root, record: compact, replay: null }, { kind: "stop", reason: "failure" }]
  const records = [{ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal: events[1], status: "system_failure" }]
  const evidence = { records, charged: 11, elapsedMs: 3324046, physicalHighWaterBytes: 16384, scratchHighWaterBytes: 1024, root: labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records }) }
  const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: 10, bottomRole: bottom.role, bottomSourceRoot: bottom.sourceRoot, bottomSnapshotRoot: bottom.root, topRole: top.role, topSourceRoot: top.sourceRoot, topSnapshotRoot: top.root }, pair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }
  const metricBody = { executionRoot: compact.executionRoot, formationComparison: "inconclusive" }, metrics = { ...metricBody, root: labRoot("lean-baseline-match-metrics-v1", metricBody) }
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: bottom.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  const transport = { method: "selectActivations", requestOrdinal: 1, requestRoot: labRoot("mock-request", {}), payloadRoot: labRoot("mock-payload", {}), inputRoot: labRoot("mock-input", {}), executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}` }
  const invocationBinding = { schemaVersion: "v1.38-lean-correction-invocation-binding-v1", ...transport, sourceRoot: bottom.sourceRoot, seat: "bottom", requestId: "synthetic-request", ordinal: 0, invocationRoot: labRoot("mock-invocation", {}) }
  const cell = { ordinal: 0, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [], strategyInputs: [], trainingHalfPoints: null, semanticRoot: null, metrics, decisionRoot: labRoot("mock-decision", {}), diagnostic: { schemaVersion: "lean-supervisor-diagnostic-v1", chargeRoot: charge.root, stage: "native_response", reason: "executor", code: "SUBPROCESS_SIGNAL", method: "selectActivations", ordinal: 0, invocationBinding } }
  const observationBody = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }, observation = { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }
  const head = "a".repeat(40), entry = { allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), head }
  const terminal = { entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), allocationRoot: a.root, sourceRoot: a.sourceRoot, head, status: "child_exited", exitCode: 0, signal: null }
  const metadata = { schemaVersion: "v1.38-lean-correction-origin-v1", requestOrdinal: 1, requestRoot: labRoot("mock-request", {}), transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline", signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown", transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown" }
  const originBody = { schemaVersion: "lean-correction-origin-envelope-v1", allocationRoot: a.root, sourceRoot: a.sourceRoot, pairRoot: pair.root, chargeRoot: charge.root, origins: [{ metadata, sourceRoot: bottom.sourceRoot, seat: "bottom", binding: transport }] }, origin = { ...originBody, root: labRoot("lean-correction-origin-envelope-v1", originBody) }
  const pipeline = { status: "diagnostic_only", cells: [{ ordinal: cell.ordinal, slotRoot: cell.slotRoot, compact: cell.compact }], training: null, holdoutOpened: false, formationMaterialized: false }
  const resultBody = { schemaVersion: "lean-correction-result-v1", privacy: "private_offline", issued: false, route: "diagnostic", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head, reuseGrantRoot: reuse.grant.root, pipeline, evidenceRoot: evidence.root, cumulativeCharged: 11, holdoutOpened: false, formationMaterialized: false, phaseComplete: false }
  return { schemaVersion: "lean-correction-retained-snapshot-v1", allocation: a, request, entry, terminal, evidence, time: { active: false, elapsedMs: 3324046, closed: new Set(["pilot-entry"]) }, result: { ...resultBody, root: labRoot("lean-correction-result-v1", resultBody) }, reuse, pairs: [pair], observations: [observation], sources: [bottom, top], artifacts: {}, origin, journalBytes: Buffer.concat(events.map(e => Buffer.concat([leanCanonicalBytes(e), Buffer.from("\n")]))) }
}

describe("new correction retained admission", () => {
  it.skipIf(!existsSync(reuseDirectory))("closes successful diagnostic wins and draw without claiming training or a known cause", () => {
    const original = fixture()
    for (const outcome of ["bottom", "top", "DRAW"] as const) {
      const s = structuredClone(original) as unknown as {
        observations: Array<{ cell: LeanBaselineObservedCell; root: string; schemaVersion: string; pairRoot: string }>;
        evidence: { records: Array<{ status: string; terminal: { record: LeanBaselineObservedCell["compact"] } }>; root: string };
        journalBytes: Uint8Array; allocation: { root: string }; result: Record<string, unknown>;
        origin: { origins: unknown[]; root: string }
      }
      const cell = s.observations[0]!.cell
      const changed = { ...cell, compact: { ...cell.compact, classification: "success" as const, code: "OK" as const, outcome }, trainingHalfPoints: outcome === "DRAW" ? 1 as const : 0 as const, semanticRoot: labRoot("mock-success-semantic", outcome), diagnostic: null }
      s.observations[0]!.cell = changed
      s.evidence.records[0]!.status = "success"
      s.evidence.records[0]!.terminal!.record = changed.compact
      const events = Buffer.from(s.journalBytes).toString("utf8").trim().split("\n").map(line => JSON.parse(line))
      events[1].record = changed.compact
      s.journalBytes = Buffer.concat(events.map(event => Buffer.concat([leanCanonicalBytes(event), Buffer.from("\n")])))
      s.evidence.root = labRoot("lean-evidence-v1", { allocationRoot: s.allocation.root, events, records: s.evidence.records })
      s.result.evidenceRoot = s.evidence.root
      s.result.pipeline = { ...(s.result.pipeline as Record<string, unknown>), cells: [{ ordinal: changed.ordinal, slotRoot: changed.slotRoot, compact: changed.compact }] }
      const { root: _observationRoot, ...observationBody } = s.observations[0]!
      s.observations[0]!.root = labRoot("lean-baseline-observation-v1", observationBody)
      s.origin.origins = []
      const { root: _originRoot, ...originBody } = s.origin
      s.origin.root = labRoot("lean-correction-origin-envelope-v1", originBody)
      const { root: _resultRoot, ...resultBody } = s.result
      s.result.root = labRoot("lean-correction-result-v1", resultBody)
      expect(auditLeanCorrectionRetained(s)).toMatchObject({ successful: 1, observedOrigin: "unknown", complete: false, phaseComplete: false, freezeAdmitted: false })
    }
  }, 20000)
  it("rejects absent actual result and unknown custody without cold recomputation", () => {
    expect(() => auditLeanCorrectionRetained({})).toThrow()
    expect(() => auditLeanCorrectionRetained({ schemaVersion: "lean-current-baseline-result-v1" })).toThrow()
  })
  it.skipIf(!existsSync(reuseDirectory))("authenticates a synthetic charged prefix, keeps native cause unknown, rejects changed custody", () => {
    const s = fixture(), report = auditLeanCorrectionRetained(s)
    expect(report.cumulativeCharged).toBe(11)
    expect(report.observedOrigin).toBe("legacy_deadline")
    expect(report.initiatingNativeCause).toBe("unknown")
    expect(report.complete).toBe(false)
    const changedInvocation = structuredClone(s)
    changedInvocation.origin.origins[0]!.metadata.requestOrdinal = 2
    const { root: _oldOriginRoot, ...changedOriginBody } = changedInvocation.origin
    changedInvocation.origin.root = labRoot("lean-correction-origin-envelope-v1", changedOriginBody)
    expect(() => auditLeanCorrectionRetained(changedInvocation)).toThrow("ORIGIN_INVOCATION")
    for (const changed of [{ entry: { ...s.entry, head: "b".repeat(40) } }, { origin: null }, { observations: [] }, { evidence: { ...s.evidence, charged: 0 } }, { result: { ...s.result, phaseComplete: true } }, { reuse: { ...s.reuse, grant: { ...s.reuse.grant, opportunity: { ...s.reuse.grant.opportunity, prospectiveResponseNodes: 129 } } } }]) expect(() => auditLeanCorrectionRetained({ ...s, ...changed })).toThrow()
  }, 20000)
})

/** Synthetic source fixture only: no broker, runtime or empirical Match. The
 * private cold bytes are authenticated unchanged; all new observations/search
 * outputs are mocks and carry zero empirical credit. */
const completeFixture = async () => {
  const base = fixture(), seed = base.reuse.grant.seed, original = correctionAllocationFixture("baseline")
  const a = createLeanCorrectionAllocation({ ...Object.fromEntries(Object.entries(original).filter(([key]) => ["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "route", "diagnosisRoot", "predecessor"].includes(key))), reuseGrantRoot: base.reuse.grant.root } as Parameters<typeof createLeanCorrectionAllocation>[0])
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(row => row.status === "active")!
  let machine = MATCH_KERNEL.createMachineV119({ matchId: "synthetic-source-only", seed, arenaVariant: arena, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-revision", topStrategyRevisionId: "top-revision", initialInitiativePlayerId: "bottom" })
  let strategyInput: StrategyInputV119 | undefined
  for (let i = 0; i < 100; i++) {
    const next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (next.kind === "effect" && next.request.kind === "selectActivations") { strategyInput = next.request.input as StrategyInputV119; break }
    if (next.kind !== "transition") throw new Error("SOURCE_FIXTURE_INPUT")
    machine = next.machine
  }
  if (!strategyInput) throw new Error("SOURCE_FIXTURE_INPUT")
  const sources: LeanBaselineSource[] = [], cells: LeanBaselineObservedCell[] = [], artifacts: Record<string, unknown> = {}
  dispatchedSources.length = 0
  const cold = vi.spyOn(coldBuilder, "buildLeanColdCorpus").mockImplementation(() => { throw new Error("FORBIDDEN_COLD_WORK") })
  const proposals = vi.spyOn(proposalBuilder, "buildLeanInitialProposals").mockImplementation(() => { throw new Error("FORBIDDEN_COLD_WORK") })
  const search = vi.spyOn(planner, "selectPlannerActivations").mockImplementation((_input, options) => ({ activationOrders: [], strategyMemory: { planner: { expansions: options!.maxExpansions } } }))
  let pipeline: Awaited<ReturnType<typeof executeLeanReusedCurrentPipeline>>
  try {
    pipeline = await executeLeanReusedCurrentPipeline({ allocation: a, reuse: base.reuse, freezeSource: source => sources.push(source), retainArtifact: (name, value) => { artifacts[name] = value }, checkpoint() {}, async dispatch(slot, bottom, top) {
      dispatchedSources.push({ bottom, top })
      const executionRoot = labRoot("synthetic-nonlexical-execution", slot.ordinal)
      const compact = { classification: "success" as const, code: "OK" as const, outcome: "DRAW" as const, elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: labRoot("synthetic-accounting", slot.ordinal), executionRoot, telemetry: { transitions: 1, events: 1 } }
      const metricBody = { schemaVersion: "v1.38-lean-baseline-match-metrics-v1" as const, source: "unavailable" as const, executionRoot, measurements: { terminalLength: null, terminalActivationCount: null, cycleCount: null, contractionCount: null, activeSurvival: null, firstEnemyAwarenessActivation: null, firstContactActivation: null, firstBackstabActivation: null, firstPushActivation: null, firstStoneActivation: null, firstDecisiveActivation: null, contractionFallCount: null, advances: null, stones: null, pushes: null, moveBlocks: null, pushBlocks: null, openingCluster: null }, missing: [], formationComparison: "inconclusive" as const }
      const cell = { ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [base.reuse.corpus.tacticalInputs[0]!], strategyInputs: [strategyInput!], trainingHalfPoints: 1 as const, semanticRoot: labRoot("synthetic-repeat", slot.ordinal >= 32 ? slot.ordinal - 24 : slot.ordinal), metrics: { ...metricBody, root: labRoot("lean-baseline-match-metrics-v1", metricBody) }, decisionRoot: labRoot("synthetic-decision", slot.ordinal), diagnostic: null } as LeanBaselineObservedCell
      cells.push(cell); return cell
    } })
    expect(cold).not.toHaveBeenCalled(); expect(proposals).not.toHaveBeenCalled(); expect(search).toHaveBeenCalledTimes(8)
  } finally { vi.restoreAllMocks() }
  const events: unknown[] = [], pairs: unknown[] = [], observations: unknown[] = [], records = cells.map((cell, ordinal) => {
    const slot = a.slots[ordinal]!, bottom = sources.find(source => source.sourceRoot === cell.bottomRoot && (ordinal >= 8 ? !/^(tactical|teacher)-\d/u.test(source.role) : true))!, top = sources.find(source => source.sourceRoot === cell.topRoot && (ordinal >= 8 ? !/^(tactical|teacher)-\d/u.test(source.role) : true))!
    // Roles are taken from the producer's exact source schedule, not inferred
    // from source hashes (draft/probe may intentionally share source bytes).
    const pairSources = dispatchedSources[ordinal]!
    const prefix = Buffer.concat(events.map(event => Buffer.concat([leanCanonicalBytes(event), Buffer.from("\n")])))
    const body = { schemaVersion: "lean-baseline-pair-v1", ordinal, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: leanBytesRoot(prefix), priorLedgerByteLength: prefix.length, priorCharged: a.predecessor.chargedMatches + ordinal, bottomRole: pairSources.bottom.role, bottomSourceRoot: cell.bottomRoot, bottomSnapshotRoot: pairSources.bottom.root, topRole: pairSources.top.role, topSourceRoot: cell.topRoot, topSnapshotRoot: pairSources.top.root }
    void bottom; void top
    const pair = { ...body, root: labRoot("lean-baseline-pair-v1", body) }; pairs.push(pair)
    const observationBody = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }; observations.push({ ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) })
    const chargeBody = { schemaVersion: "lean-slot-charge-v1", allocationRoot: a.root, slotRoot: slot.root, ordinal }, charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
    const terminal = { kind: "terminal", chargeRoot: charge.root, record: cell.compact, replay: null }; events.push({ kind: "charge", charge }, terminal)
    return { slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal, status: "success" }
  })
  events.push({ kind: "stop", reason: "complete" })
  const evidence = { ...base.evidence, records, charged: a.predecessor.chargedMatches + 36, root: labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records }) }
  const request = { ...base.request, route: "baseline", requestRoots: a.requestRoots, diagnosis: { root: a.diagnosisRoot } }, entry = { ...base.entry, allocationRoot: a.root, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)) }, terminal = { ...base.terminal, allocationRoot: a.root, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)) }
  const resultBody = { ...base.result, route: "baseline", allocationRoot: a.root, requestBytesRoot: entry.requestBytesRoot, pipeline, evidenceRoot: evidence.root, cumulativeCharged: evidence.charged }; const { root: _root, ...body } = resultBody
  return { ...base, allocation: a, request, entry, terminal, evidence, time: { ...base.time, elapsedMs: 3500000 }, result: { ...body, root: labRoot("lean-correction-result-v1", body) }, pairs, observations, sources, artifacts, origin: null, journalBytes: Buffer.concat(events.map(event => Buffer.concat([leanCanonicalBytes(event), Buffer.from("\n")]))) }
}
const dispatchedSources: Array<{ bottom: LeanBaselineSource; top: LeanBaselineSource }> = []

describe("synthetic complete retained correction (no empirical credit)", () => {
  it.skipIf(!existsSync(reuseDirectory))("joins all 36 cells and exact unrooted response work", async () => {
    const s = await completeFixture()
    const roots = (s.artifacts["initial-training.json"] as { candidates: Array<{ trainingMatchRoots: string[] }> }).candidates[0]!.trainingMatchRoots
    expect(roots).not.toEqual(s.observations.slice(0, 4).map(row => (row as { cell: LeanBaselineObservedCell }).cell.compact.executionRoot))
    expect(() => auditLeanCorrectionRetained(s)).not.toThrow()
    expect(auditLeanCorrectionRetained(s)).toMatchObject({ complete: true, phaseComplete: false, freezeAdmitted: false })
  }, 20000)
  it.skipIf(!existsSync(reuseDirectory))("rejects independently re-rooted work/source/node/counter mutations without search", async () => {
    const original = await completeFixture()
    const mutations: Array<(s: LeanCorrectionRetainedSnapshot) => void> = [
      s => { (s.artifacts["response-work.json"] as { targetRoots: { mixture: string } }).targetRoots.mixture = labRoot("wrong-mixture", {}) },
      s => { (s.artifacts["response-work.json"] as { targetRoots: { strongestPure: string } }).targetRoots.strongestPure = labRoot("wrong-strongest", {}) },
      s => { (s.artifacts["response-work.json"] as { commonSourceRoot: string }).commonSourceRoot = labRoot("wrong-common", {}) },
      s => { (s.artifacts["response-work.json"] as { actualAssignmentNodes: number }).actualAssignmentNodes-- },
      s => { (s.artifacts["response-work.json"] as { selectedPlannerBudget: number }).selectedPlannerBudget++ },
      s => { (s.artifacts["response-work.json"] as { realizedTrainingHalfPoints: number }).realizedTrainingHalfPoints++ },
      s => { (s.artifacts["response-work.json"] as { matchOutcomes: Array<{ halfPoints: number }> }).matchOutcomes[0]!.halfPoints++ },
      s => { (s.artifacts["response-work.json"] as { matchOutcomes: Array<{ assignedNodes: number }> }).matchOutcomes[0]!.assignedNodes++ },
      s => { (s.artifacts["response-work.json"] as { plannerNodeRoots: string[] }).plannerNodeRoots[0] = labRoot("wrong-node", {}) },
      s => { (s.artifacts["response-node-receipts.json"] as Array<{ inputRoot: string }>)[0]!.inputRoot = labRoot("wrong-input", {}) },
      s => { (s.artifacts["response-node-receipts.json"] as Array<{ actualNodes: number }>)[0]!.actualNodes-- },
      s => {
        const manifest = s.artifacts["response-training.json"] as { candidates: Array<{ mechanism: string; source: string; sourceRoot: string; structureRoot: string }> }
        const candidate = manifest.candidates.find(row => row.mechanism === "response")!, other = s.sources.find(row => row.role === "initial-teacher")!
        candidate.source = other.source; candidate.sourceRoot = other.sourceRoot; candidate.structureRoot = other.structureRoot
      },
    ]
    const search = vi.spyOn(planner, "selectPlannerActivations").mockImplementation(() => { throw new Error("READER_SEARCH_FORBIDDEN") })
    const reroot = (value: Record<string, unknown>, domain: string) => { const { root: _root, ...body } = value; value.root = labRoot(domain, body) }
    try {
      for (const mutate of mutations) {
        const s = structuredClone(original) as unknown as LeanCorrectionRetainedSnapshot
        mutate(s)
        const manifest = s.artifacts["response-training.json"] as Record<string, unknown>
        const candidate = (manifest.candidates as Array<Record<string, unknown>>).find(row => row.mechanism === "response")!
        candidate.decisionRoot = labRoot("lean-training-decision-v1", s.artifacts["response-work.json"])
        reroot(manifest, "lean-cold-training-manifest-v1")
        const pipeline = s.result.pipeline as Record<string, unknown>; pipeline.training = manifest
        reroot(pipeline, "lean-current-baseline-pipeline-v1"); reroot(s.result, "lean-correction-result-v1")
        expect(() => auditLeanCorrectionRetained(s)).toThrow()
      }
      expect(search).not.toHaveBeenCalled()
    } finally { vi.restoreAllMocks() }
  }, 60000)
  it.skipIf(!existsSync(reuseDirectory))("rejects charged wrong response/probe opponents even in partial prefixes", async () => {
    const original = await completeFixture()
    const reroot = (value: Record<string, unknown>, domain: string) => { const { root: _root, ...body } = value; value.root = labRoot(domain, body) }
    for (const ordinal of [12, 16, 28]) for (const partial of [false, true]) {
      const s = structuredClone(original) as unknown as LeanCorrectionRetainedSnapshot
      const pair = s.pairs[ordinal]! as unknown as Record<string, unknown>, cell = s.observations[ordinal]!.cell as unknown as Record<string, unknown>
      const seat = s.allocation.slots[ordinal]!.condition < 2 ? ordinal < 20 ? "top" : "bottom" : ordinal < 20 ? "bottom" : "top"
      const wrong = s.sources.find(row => row.role === "cold-opponent")!
      pair[`${seat}Role`] = wrong.role; pair[`${seat}SourceRoot`] = wrong.sourceRoot; pair[`${seat}SnapshotRoot`] = wrong.root; cell[`${seat}Root`] = wrong.sourceRoot
      reroot(pair, "lean-baseline-pair-v1")
      const observation = s.observations[ordinal]! as unknown as Record<string, unknown>; observation.pairRoot = pair.root; reroot(observation, "lean-baseline-observation-v1")
      const pipeline = s.result.pipeline as Record<string, unknown>
      if (partial) {
        const count = ordinal + 1, records = s.evidence.records.slice(0, count), events = Buffer.from(s.journalBytes).toString("utf8").trim().split("\n").slice(0, count * 2).map(row => JSON.parse(row) as unknown)
        events.push({ kind: "stop", reason: "partial" })
        Object.assign(s, { pairs: s.pairs.slice(0, count), observations: s.observations.slice(0, count), journalBytes: Buffer.concat(events.map(event => Buffer.concat([leanCanonicalBytes(event), Buffer.from("\n")]))), evidence: { ...s.evidence, records, charged: s.allocation.predecessor.chargedMatches + count, root: labRoot("lean-evidence-v1", { allocationRoot: s.allocation.root, events, records }) } })
        pipeline.status = "partial_or_failed_baseline"; pipeline.stage = "synthetic_failure"
        s.result.evidenceRoot = s.evidence.root; s.result.cumulativeCharged = s.evidence.charged
      }
      pipeline.cells = s.observations.map(row => compactLeanBaselineCell(row.cell)); pipeline.measurement = leanBaselineMetricCoverage(s.observations.map(row => row.cell))
      reroot(pipeline, "lean-current-baseline-pipeline-v1"); reroot(s.result, "lean-correction-result-v1")
      expect(() => auditLeanCorrectionRetained(s)).toThrow(/(?:RESPONSE|PROBE)_SCHEDULE/u)
    }
  }, 60000)
})
