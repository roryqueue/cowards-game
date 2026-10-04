import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, leanBytesRoot, leanCanonicalBytes, type LeanCurrentBaselineAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanColdProcedureRoot, compactLeanBaselineCell, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { auditLeanCurrentBaselineRetained, type LeanBaselineRetainedSnapshot } from "./v1-38-lean-baseline-retained.js"

const root = (name: string): LabRoot => labRoot("lean-retained-test-v1", name)
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
  const cell = { ordinal: 0, slotRoot: slots[0]!.root, bottomRoot: bottom.sourceRoot, topRoot: top.sourceRoot, compact, brainInputs: [{}], strategyInputs: [], trainingHalfPoints: 2, semanticRoot: root("semantic"), decisionRoot: root("decision"), diagnostic: null } as unknown as LeanBaselineObservedCell
  const pairBody = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: 0, slotRoot: slots[0]!.root, requestRoot: slots[0]!.requestRoot, priorLedgerBytesRoot: leanBytesRoot(new Uint8Array()), priorLedgerByteLength: 0, priorCharged: 9, bottomRole: bottom.role, bottomSourceRoot: bottom.sourceRoot, bottomSnapshotRoot: bottom.root, topRole: top.role, topSourceRoot: top.sourceRoot, topSnapshotRoot: top.root }
  const pair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }
  const observationBody = { schemaVersion: "lean-baseline-observation-v1" as const, pairRoot: pair.root, cell }
  const observation = { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }
  const pipelineBody = { status: "partial_or_failed_baseline", stage: "initial_training", training: null, cells: [compactLeanBaselineCell(cell)], sources: sources.map(s => ({ role: s.role, sourceRoot: s.sourceRoot, snapshotRoot: s.root })), holdoutOpened: false, formationMaterialized: false }
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

describe("new current-baseline retained audit (synthetic source-only)", () => {
  it("retains an honest incomplete first-cell result without granting completion", () => {
    expect(auditLeanCurrentBaselineRetained(fixture())).toMatchObject({ complete: false, currentCharged: 1, successful: 1, claim: "no_robust_pure_claimed" })
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
})
