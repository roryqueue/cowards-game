import { describe, expect, it } from "vitest"
import { auditLeanCorrectionRetained } from "./v1-38-lean-correction-retained.js"
import { existsSync } from "node:fs"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_BASELINE_STORE, createLeanCorrectionAllocation, leanCanonicalBytes, leanBytesRoot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { authenticateLeanColdReuse, LEAN_COLD_REUSE_HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { correctionAllocationFixture } from "../run-v1-38-lean-correction.test.js"

const fixture = () => {
  const allocationFixture = correctionAllocationFixture()
  const reuse = authenticateLeanColdReuse({ directory: LEAN_BASELINE_STORE, newSourceRoot: allocationFixture.sourceRoot, amendmentRoot: LEAN_COLD_REUSE_HISTORY.amendmentRoot })
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
  const cell = { ordinal: 0, slotRoot: slot.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [], strategyInputs: [], trainingHalfPoints: null, semanticRoot: null, metrics, decisionRoot: labRoot("mock-decision", {}), diagnostic: null }
  const observationBody = { schemaVersion: "lean-baseline-observation-v1", pairRoot: pair.root, cell }, observation = { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }
  const head = "a".repeat(40), entry = { allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), head }
  const terminal = { entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), allocationRoot: a.root, sourceRoot: a.sourceRoot, head, status: "child_exited", exitCode: 0, signal: null }
  const metadata = { schemaVersion: "v1.38-lean-correction-origin-v1", requestOrdinal: 1, requestRoot: labRoot("mock-request", {}), transportMethod: "docker_exec_stream", brokerMode: "legacy", brokerBranch: "legacy_deadline", signalBufferState: "not_done", waitDisposition: "timed_out", workerLifecycle: "unknown", transportSignal: "broker_synthetic_sigkill", terminationDisposition: "worker_terminate_completed", elapsedBucket: "unknown" }
  const originBody = { schemaVersion: "lean-correction-origin-envelope-v1", allocationRoot: a.root, sourceRoot: a.sourceRoot, pairRoot: pair.root, chargeRoot: charge.root, origins: [{ metadata, sourceRoot: bottom.sourceRoot, seat: "bottom" }] }, origin = { ...originBody, root: labRoot("lean-correction-origin-envelope-v1", originBody) }
  const pipeline = { status: "diagnostic_only", cells: [cell], training: null, holdoutOpened: false, formationMaterialized: false }
  const resultBody = { schemaVersion: "lean-correction-result-v1", privacy: "private_offline", issued: false, route: "diagnostic", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head, reuseGrantRoot: reuse.grant.root, pipeline, evidenceRoot: evidence.root, cumulativeCharged: 11, holdoutOpened: false, formationMaterialized: false, phaseComplete: false }
  return { schemaVersion: "lean-correction-retained-snapshot-v1", allocation: a, request, entry, terminal, evidence, time: { active: false, elapsedMs: 3324046, closed: new Set(["pilot-entry"]) }, result: { ...resultBody, root: labRoot("lean-correction-result-v1", resultBody) }, reuse, pairs: [pair], observations: [observation], sources: [bottom, top], artifacts: {}, origin, journalBytes: Buffer.concat(events.map(e => Buffer.concat([leanCanonicalBytes(e), Buffer.from("\n")]))) }
}

describe("new correction retained admission", () => {
  it("rejects absent actual result and unknown custody without cold recomputation", () => {
    expect(() => auditLeanCorrectionRetained({})).toThrow()
    expect(() => auditLeanCorrectionRetained({ schemaVersion: "lean-current-baseline-result-v1" })).toThrow()
  })
  it.skipIf(!existsSync(LEAN_BASELINE_STORE))("authenticates a synthetic charged prefix, keeps native cause unknown, rejects changed custody", () => {
    const s = fixture(), report = auditLeanCorrectionRetained(s)
    expect(report.cumulativeCharged).toBe(11)
    expect(report.observedOrigin).toBe("legacy_deadline")
    expect(report.initiatingNativeCause).toBe("unknown")
    expect(report.complete).toBe(false)
    for (const changed of [{ entry: { ...s.entry, head: "b".repeat(40) } }, { origin: null }, { observations: [] }, { evidence: { ...s.evidence, charged: 0 } }, { result: { ...s.result, phaseComplete: true } }, { reuse: { ...s.reuse, grant: { ...s.reuse.grant, opportunity: { ...s.reuse.grant.opportunity, prospectiveResponseNodes: 129 } } } }]) expect(() => auditLeanCorrectionRetained({ ...s, ...changed })).toThrow()
  }, 20000)
})
