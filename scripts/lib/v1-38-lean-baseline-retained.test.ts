import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, leanBytesRoot, leanCanonicalBytes, type LeanCurrentBaselineAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanColdProcedureRoot, compactLeanBaselineCell, executeLeanCurrentPipeline, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { auditLeanCurrentBaselineRetained, assertLeanRetryBaselineJoinV8, verifyLeanRetryBaselineRetainedV8, type LeanBaselineRetainedSnapshot } from "./v1-38-lean-baseline-retained.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { CANONICAL_ARENA_CATALOG_V1_37, type StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { LEAN_BASELINE_REQUIRED_METRICS, type LeanBaselineMetricReceipt } from "./v1-38-lean-baseline-metrics.js"

const root = (name: string): LabRoot => labRoot("lean-retained-test-v1", name)
describe("selected retry baseline authority owner", () => {
  it("refuses a caller-selected path before opening a store", async () => {
    await expect(verifyLeanRetryBaselineRetainedV8("caller-selected.json", "v8-1")).rejects.toThrow("RETRY_ACCEPTED_FINAL_JOIN")
  })
  it("requires selected ordinal, actual accepted-check identity and FINAL close together", () => {
    // Actual finite reader acceptance is exercised in the connected v8 suite;
    // this owner regression covers every join independently of route dispatch.
    const check = { root: root("check"), allocationRoot: root("diagnostic"), readerCloseMs: 100 }
    const closure = { attemptOrdinal: 2, closureClass: "accepted", checkRoot: check.root, allocationRoot: check.allocationRoot, root: root("final-close"), readerCloseMs: 100, finalReaderClose: true, acceptedCheckAbsent: false, sourceRoot: root("source"), head: "a".repeat(40) }
    const allocation = { schemaVersion: "lean-correction-supervisor-baseline-allocation-v8", attemptOrdinal: 2, acceptedCheckRoot: check.root, acceptedReaderCloseRoot: closure.root, sourceRoot: closure.sourceRoot } as Parameters<typeof assertLeanRetryBaselineJoinV8>[0]
    expect(() => assertLeanRetryBaselineJoinV8(allocation, check, closure, "b".repeat(40))).not.toThrow()
    for (const patch of [{ attemptOrdinal: 1 }, { checkRoot: null }, { finalReaderClose: false }, { acceptedCheckAbsent: true }, { closureClass: "refused" }, { closureClass: "absent" }]) expect(() => assertLeanRetryBaselineJoinV8(allocation, check, { ...closure, ...patch }, closure.head)).toThrow()
  })
})
const syntheticMetrics = (executionRoot: LabRoot, success = true): LeanBaselineMetricReceipt => {
  const body = { schemaVersion: "v1.38-lean-baseline-match-metrics-v1" as const, source: success ? "actual_canonical_trace" as const : "unavailable" as const,
    executionRoot, measurements: { terminalLength: null, terminalActivationCount: null, cycleCount: null, contractionCount: null, activeSurvival: null, firstEnemyAwarenessActivation: null, firstContactActivation: null, firstBackstabActivation: null, firstPushActivation: null, firstStoneActivation: null, firstDecisiveActivation: null, contractionFallCount: null, advances: null, stones: null, pushes: null, moveBlocks: null, pushBlocks: null, openingCluster: null }, missing: [...LEAN_BASELINE_REQUIRED_METRICS], formationComparison: "inconclusive" as const }
  return { ...body, root: labRoot("lean-baseline-match-metrics-v1", body) }
}
const fixture = (): LeanBaselineRetainedSnapshot => {
  const seed = "source-only-fixture", coldRoot = leanColdProcedureRoot(seed), sourceRoot = root("source")
  const requestRoots = Array.from({ length: 36 }, (_, i) => root(`request-${i}`))
  const slots = requestRoots.map((requestRoot, ordinal) => {
    const body = { ordinal, condition: currentBaselineSlotKind(ordinal).condition, arenaHash: root(`arena-${currentBaselineSlotKind(ordinal).arenaIndex}`), requestRoot }
    return { ...body, root: labRoot("lean-slot-v1", body) }
  })
  const allocation = { schemaVersion: "lean-current-baseline-allocation-v1", root: root("allocation"), sourceRoot, reviewRoot: root("review"), coldRoot, planRoot: root("plan"), seed, candidateRoots: [root("tactical"), root("teacher")].sort(), requestRoots, slots, predecessor: { chargedMatches: 9, elapsedUpperBoundMs: 3_305_606 } } as unknown as LeanCurrentBaselineAllocation
  const request = { schemaVersion: "lean-current-baseline-request-v1", seed, reviewPath: "review.md", reviewRoot: allocation.reviewRoot, sourceRoot, planRoot: allocation.planRoot, coldRoot, candidateRoots: allocation.candidateRoots, requestRoots }
  const source = (role: string) => ({ role, coldRoot, implementationRoot: sourceRoot, sourceRoot: root(`source-${role}`), root: root(`snapshot-${role}`) })
  const bottom = source("tactical-0"), top = source("cold-opponent"), sources = [top, bottom]
  const compact = { classification: "success", code: "OK", outcome: "bottom", elapsedMs: 100, cleanupComplete: true, invocationCount: 2, accountingRoot: root("accounting"), executionRoot: root("execution"), telemetry: { transitions: 1, events: 1 } } as const
  const cell = { ordinal: 0, slotRoot: slots[0]!.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [{}], strategyInputs: [], trainingHalfPoints: 2, semanticRoot: root("semantic"), metrics: syntheticMetrics(compact.executionRoot), decisionRoot: root("decision"), diagnostic: null } as unknown as LeanBaselineObservedCell
  const pairBody = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: 0, slotRoot: slots[0]!.root, requestRoot: slots[0]!.requestRoot, priorLedgerBytesRoot: leanBytesRoot(new Uint8Array()), priorLedgerByteLength: 0, priorCharged: 9, bottomRole: bottom.role, bottomSourceRoot: bottom.sourceRoot, bottomSnapshotRoot: bottom.root, topRole: top.role, topSourceRoot: top.sourceRoot, topSnapshotRoot: top.root }
  const pair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }
  const observationBody = { schemaVersion: "lean-baseline-observation-v1" as const, pairRoot: pair.root, cell }
  const observation = { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }
  const pipelineBody = { status: "partial_or_failed_baseline", stage: "initial_training", training: null, cells: [compactLeanBaselineCell(cell)], measurement: { cells: 1, missingByCell: [{ ordinal: 0, missing: cell.metrics.missing }], formationComparison: "inconclusive" }, sources: sources.map(s => ({ role: s.role, sourceRoot: s.sourceRoot, snapshotRoot: s.root })), holdoutOpened: false, formationMaterialized: false }
  const pipeline = { ...pipelineBody, root: labRoot("lean-current-baseline-pipeline-v1", pipelineBody) }
  const chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: allocation.root, slotRoot: slots[0]!.root, ordinal: 0 }
  const charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
  const ledgerEvents = [{ kind: "charge", charge }, { kind: "terminal", chargeRoot: charge.root, record: compact, replay: null }, { kind: "stop", reason: "failure" }] as LeanBaselineRetainedSnapshot["ledgerEvents"]
  const evidence = { root: root("evidence"), charged: 10, elapsedMs: 3_305_706, physicalHighWaterBytes: 1_000_000, scratchHighWaterBytes: 0, records: slots.map((slot, i) => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: i === 0 ? charge.root : null, terminal: i === 0 ? { kind: "terminal", chargeRoot: charge.root, record: compact, replay: null } : null, status: i === 0 ? "success" : "unused" })) } as unknown as LeanBaselineRetainedSnapshot["evidence"]
  const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), head: "a".repeat(40), parentPid: 1, childPid: 2, handshakeRoot: root("handshake"), wallStartMs: 100, monotonicStartNs: "1000000" } as LeanBaselineRetainedSnapshot["entry"]
  const terminal = { schemaVersion: "lean-child-terminal-v2", entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), allocationRoot: allocation.root, sourceRoot, head: entry.head, parentPid: 1, childPid: 2, status: "child_exited", exitCode: 0, signal: null, elapsedUpperBoundMs: 1000, wallObservedMs: 1100, monotonicObservedNs: "1001000000", parentRssBytes: 100, childRssObservedBytes: 100, physicalBytes: 1_000_000, freeBytes: 20_000_000_000 } as LeanBaselineRetainedSnapshot["terminal"]
  const result = { schemaVersion: "lean-current-baseline-result-v1", issued: false, evidenceClass: "exploratory_current_only", allocationRoot: allocation.root, sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, evidenceRoot: evidence.root, pipeline, charged: 10, successful: 1, status: "partial_or_failed_baseline", elapsedMs: 3_305_706, physicalHighWaterBytes: 1_000_000, scratchHighWaterBytes: 0, holdoutOpened: false, formationMaterialized: false }
  const time = { elapsedMs: 3_306_706, closedElapsedMs: 3_306_706, active: false, starts: new Map([["pilot-entry", 100], ["baseline-retained-verifier", 1200]]), closes: new Map([["pilot-entry", 1100], ["baseline-retained-verifier", 1300]]), closed: new Set(["pilot-entry", "baseline-retained-verifier"]) }
  const sealBody = { schemaVersion: "lean-seal-metadata-inventory-v1", protocol: { present: false, bytesRoot: null }, originalPublicReference: { present: false, bytesRoot: null }, checkoutDirty: true, originalCompatibleUnopenedSealVerified: false, privateStoreOrPreimageRead: false, newExploratorySealCreated: false, reservedHoldoutPerProfile: 4, disposition: "holdout_claim_deferred_no_verified_compatible_seal", reason: "existing_clean_checkout_seal_prerequisite_not_met", claims: { absenceOfAllExternalSealsProved: false, originalCommitmentSatisfied: false, holdoutOpened: false } }
  const seal = { ...sealBody, root: labRoot("lean-seal-metadata-inventory-v1", sealBody) }
  return { allocation, request, requestBytesRoot: entry.requestBytesRoot, head: entry.head, entry, terminal, evidence, ledgerEvents, time, result, pairs: [pair], observations: [observation], sources: sources as unknown as LeanBaselineRetainedSnapshot["sources"], artifacts: { "seal-metadata.json": seal } }
}
const changed = (edit: (copy: LeanBaselineRetainedSnapshot) => void) => { const copy = structuredClone(fixture()); edit(copy); return copy }
const failedFirstCell = (classification: "player_violation" | "system_failure", code: "PLAYER_VIOLATION" | "SUPERVISOR_FAILURE" | "CLEANUP", outcome: "bottom" | null, cleanupComplete: boolean): LeanBaselineRetainedSnapshot => {
  const s = structuredClone(fixture())
  const receipt = s.observations[0]! as unknown as Record<string, unknown>, cell = receipt.cell as Record<string, unknown>
  const compact: Record<string, unknown> = { ...(cell.compact as Record<string, unknown>), classification, code, outcome, cleanupComplete }
  cell.compact = compact; cell.trainingHalfPoints = null; cell.semanticRoot = null; cell.metrics = syntheticMetrics(compact.executionRoot as LabRoot, false)
  receipt.root = labRoot("lean-baseline-observation-v1", { schemaVersion: receipt.schemaVersion, pairRoot: receipt.pairRoot, cell })
  const terminal = (s.ledgerEvents[1] as unknown as Record<string, unknown>); terminal.record = compact
  const evidenceRecord = s.evidence.records[0] as unknown as Record<string, unknown>
  evidenceRecord.terminal = { ...(evidenceRecord.terminal as Record<string, unknown>), record: compact }
  evidenceRecord.status = classification
  const pipeline = s.result.pipeline as Record<string, unknown>
  pipeline.cells = [compactLeanBaselineCell(cell as unknown as LeanBaselineObservedCell)]
  pipeline.measurement = { cells: 1, missingByCell: [{ ordinal: 0, missing: (cell.metrics as LeanBaselineMetricReceipt).missing }], formationComparison: "inconclusive" }
  const { root: _ignored, ...pipelineBody } = pipeline
  pipeline.root = labRoot("lean-current-baseline-pipeline-v1", pipelineBody)
  s.result.successful = 0
  return s
}
const completeFixture = async (outcomeForSlot: (ordinal: number, entrantSeat: "bottom" | "top") => "bottom" | "top" | "DRAW" = () => "DRAW"): Promise<LeanBaselineRetainedSnapshot> => {
  const base = fixture(), allocation = base.allocation, corpus = buildLeanColdCorpus(allocation.seed)
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(item => item.status === "active")!
  let machine = MATCH_KERNEL.createMachineV119({ matchId: "retained-source-only", seed: allocation.seed, arenaVariant: arena, bottomPlayerId: "fixture-bottom", topPlayerId: "fixture-top", bottomStrategyRevisionId: "fixture-bottom-revision", topStrategyRevisionId: "fixture-top-revision", initialInitiativePlayerId: "fixture-bottom" })
  let strategyInput: StrategyInputV119 | null = null
  for (let step = 0; step < 100 && !strategyInput; step++) {
    const next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (next.kind === "effect" && next.request.kind === "selectActivations") strategyInput = next.request.input as StrategyInputV119
    else if (next.kind === "transition") machine = next.machine
    else throw new Error("SOURCE_FIXTURE_INPUT")
  }
  if (!strategyInput) throw new Error("SOURCE_FIXTURE_INPUT")
  const sources: LeanBaselineRetainedSnapshot["sources"] extends readonly (infer T)[] ? T[] : never = []
  const artifacts: Record<string, unknown> = {}
  const ledgerEvents: Array<Record<string, unknown>> = []
  const pairs: unknown[] = [], observations: unknown[] = []
  const records = allocation.slots.map(slot => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: null as LabRoot | null, terminal: null as Record<string, unknown> | null, status: "unused" }))
  const pipeline = await executeLeanCurrentPipeline({ allocation, freezeSource: source => { sources.push(source) }, retainArtifact: (name, value) => { artifacts[name] = value }, checkpoint() {}, async dispatch(slot, bottom, top) {
    const prior = Buffer.from(ledgerEvents.map(event => Buffer.from(leanCanonicalBytes(event)).toString("utf8") + "\n").join(""))
    const pairBody = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: slot.ordinal, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: leanBytesRoot(prior), priorLedgerByteLength: prior.length, priorCharged: 9 + slot.ordinal, bottomRole: bottom.role, bottomSourceRoot: bottom.sourceRoot, bottomSnapshotRoot: bottom.root, topRole: top.role, topSourceRoot: top.sourceRoot, topSnapshotRoot: top.root }
    const pair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }; pairs.push(pair)
    const chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: allocation.root, slotRoot: slot.root, ordinal: slot.ordinal }
    const charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
    ledgerEvents.push({ kind: "charge", charge })
    const compact = { classification: "success" as const, code: "OK" as const, outcome: outcomeForSlot(slot.ordinal, slot.condition < 2 ? "bottom" : "top"), elapsedMs: 1, cleanupComplete: true, invocationCount: 2, accountingRoot: root(`accounting-${slot.ordinal}`), executionRoot: root(`execution-${slot.ordinal}`), telemetry: { transitions: 1, events: 1 } }
    const terminal = { kind: "terminal", chargeRoot: charge.root, record: compact, replay: null }
    ledgerEvents.push(terminal)
    records[slot.ordinal] = { slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal, status: "success" }
    const cell = { ordinal: slot.ordinal, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [corpus.tacticalInputs[0]!], strategyInputs: [strategyInput!], trainingHalfPoints: (compact.outcome === "DRAW" ? 1 : 0) as 0 | 1, semanticRoot: root(`repeat-${slot.ordinal >= 32 ? slot.ordinal - 24 : slot.ordinal}`), metrics: syntheticMetrics(compact.executionRoot), decisionRoot: root(`decision-${slot.ordinal}`), diagnostic: null }
    const observationBody = { schemaVersion: "lean-baseline-observation-v1" as const, pairRoot: pair.root, cell }
    observations.push({ ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) })
    return cell
  } })
  ledgerEvents.push({ kind: "stop", reason: "complete" })
  const evidence = { ...base.evidence, records, charged: 45, elapsedMs: 3_305_706, root: root("complete-evidence") }
  const result = { ...base.result, pipeline, evidenceRoot: evidence.root, charged: 45, successful: 36, status: "pending_independent_verification" }
  return { ...base, sources, artifacts, pairs: pairs as LeanBaselineRetainedSnapshot["pairs"], observations: observations as LeanBaselineRetainedSnapshot["observations"], ledgerEvents: ledgerEvents as LeanBaselineRetainedSnapshot["ledgerEvents"], evidence: evidence as LeanBaselineRetainedSnapshot["evidence"], result }
}

describe("new current-baseline retained audit (synthetic source-only)", () => {
  it("retains an honest incomplete first-cell result without granting completion", () => {
    expect(auditLeanCurrentBaselineRetained(fixture())).toMatchObject({ complete: false, currentCharged: 1, successful: 1, claim: "no_robust_pure_claimed" })
  })
  it("retains completed player violation, system failure, and cleanup failure as charged partials", () => {
    for (const row of [
      ["player_violation", "PLAYER_VIOLATION", "bottom", true],
      ["system_failure", "SUPERVISOR_FAILURE", null, true],
      ["system_failure", "CLEANUP", "bottom", false],
    ] as const) {
      const snapshot = failedFirstCell(row[0], row[1], row[2], row[3])
      expect(auditLeanCurrentBaselineRetained(snapshot)).toMatchObject({ complete: false, currentCharged: 1, successful: 0, formationMaterialized: false })
      expect(snapshot.evidence.records.slice(1).every(record => record.status === "unused")).toBe(true)
      expect(snapshot.observations[0]!.cell.trainingHalfPoints).toBeNull()
      expect(snapshot.observations[0]!.cell.semanticRoot).toBeNull()
    }
  })
  it("rejects missing observations and extra result keys", () => {
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { (s as unknown as { observations: unknown[] }).observations = [] }))).toThrow(/PAIR_COUNT|ACCOUNTING/)
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { (s.result as Record<string, unknown>).source = "private" }))).toThrow("LEAN_BASELINE_RETAINED_RESULT")
  })
  it("rejects cross-formation sources and altered pre-charge chronology", () => {
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { (s.pairs[0] as { bottomRole: string }).bottomRole = "inward-profile" }))).toThrow("LEAN_BASELINE_RETAINED_PAIR_BINDING")
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { (s.pairs[0] as { priorLedgerBytesRoot: LabRoot }).priorLedgerBytesRoot = root("later-prefix") }))).toThrow(/PAIR_CHRONOLOGY|PAIR_ROOT/)
  })
  it("rejects premature completeness, holdout, formation, and noncurrent claims", () => {
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { (s.result.pipeline as Record<string, unknown>).status = "current_baseline_complete" }))).toThrow("LEAN_BASELINE_RETAINED_PIPELINE_ROOT")
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { s.result.holdoutOpened = true }))).toThrow("LEAN_BASELINE_RETAINED_RESULT")
    expect(() => auditLeanCurrentBaselineRetained(changed(s => { s.result.formationMaterialized = true }))).toThrow("LEAN_BASELINE_RETAINED_RESULT")
  })
  it("audits during the unique charged reader interval and enforces its elapsed cap", () => {
    const active = changed(s => { s.time.active = true; s.time.closed.delete("baseline-retained-verifier"); s.time.closes.delete("baseline-retained-verifier") })
    expect(auditLeanCurrentBaselineRetained(active)).toMatchObject({ complete: false, cumulativeElapsedMs: 3_306_706 })
    active.time.elapsedMs = 28_800_001
    expect(() => auditLeanCurrentBaselineRetained(active)).toThrow("LEAN_BASELINE_RETAINED_ENTRY_TERMINAL")
  })
  it("accepts a complete 36-cell synthetic source-only round with exact rebuilt training and solver", async () => {
    const complete = await completeFixture()
    expect(auditLeanCurrentBaselineRetained(complete)).toMatchObject({ complete: true, currentCharged: 36, successful: 36, claim: "no_robust_pure_claimed" })
  }, 30000)
  it("recomputes frozen-mixture admission and rejects the eight-pairing security-gap counterexample", async () => {
    const counterexample = await completeFixture((ordinal, entrantSeat) => {
      if (ordinal === 8 || ordinal === 9) return entrantSeat
      if (ordinal === 10 || ordinal >= 20 && ordinal < 24) return "DRAW"
      if (ordinal === 11) return entrantSeat === "bottom" ? "top" : "bottom"
      if (ordinal >= 24 && ordinal < 28) return entrantSeat
      return "DRAW"
    })
    const pipeline = counterexample.result.pipeline as Record<string, unknown>
    expect((pipeline.cells as unknown[]).slice(20, 28)).toHaveLength(8)
    expect(pipeline.eligiblePureRoots).toHaveLength(2)
    expect(pipeline.response).toMatchObject({ unweightedSecurityDiagnostic: { gapHalfPoints: 0.25 }, frozenMixtureNormalizedScore: { numerator: "1", denominator: "2", passed: false }, strongestPureFreshComparator: { status: "unsupported" }, admitted: false })
    expect(auditLeanCurrentBaselineRetained(counterexample)).toMatchObject({ complete: true, currentCharged: 36, measurement: { formationComparison: "inconclusive" } })
    const forged = structuredClone(counterexample)
    const forgedPipeline = forged.result.pipeline as Record<string, unknown>
    ;(forgedPipeline.response as Record<string, unknown>).admitted = true
    const { root: _ignored, ...body } = forgedPipeline
    forgedPipeline.root = labRoot("lean-current-baseline-pipeline-v1", body)
    expect(() => auditLeanCurrentBaselineRetained(forged)).toThrow("LEAN_BASELINE_RETAINED_CLAIM")
  }, 30000)
  it("independently excludes an above-threshold response when exact strongest-pure comparison is unsupported", async () => {
    const snapshot = await completeFixture((ordinal, entrantSeat) => {
      if (ordinal === 8 || ordinal === 9 || ordinal >= 20 && ordinal < 23 || ordinal >= 24 && ordinal < 28) return entrantSeat
      if (ordinal === 11) return entrantSeat === "bottom" ? "top" : "bottom"
      return "DRAW"
    })
    const pipeline = snapshot.result.pipeline as Record<string, unknown>
    expect((pipeline.cells as unknown[]).slice(20, 28)).toHaveLength(8)
    expect(pipeline.eligiblePureRoots).toHaveLength(2)
    expect(pipeline.response).toMatchObject({ frozenMixtureNormalizedScore: { numerator: "7", denominator: "8", passed: true }, strongestPureFreshComparator: { status: "unsupported", reason: "strongest_pure_self_pair_not_allocated" }, admitted: false, disposition: "fresh_strongest_pure_comparator_unsupported" })
    expect(auditLeanCurrentBaselineRetained(snapshot)).toMatchObject({ complete: true, currentCharged: 36 })
  }, 30000)
})
