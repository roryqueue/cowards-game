import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import * as fs from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { LEAN_TWO_PAIR_V11_EXTENSION } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, leanBytesRoot, leanCanonicalBytes, type LeanCurrentBaselineAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanColdProcedureRoot, compactLeanBaselineCell, executeLeanCurrentPipeline, type LeanBaselineObservedCell } from "./v1-38-lean-baseline-pipeline.js"
import { auditLeanCurrentBaselineRetained, assertLeanRetryBaselineJoinV8, verifyLeanRetryBaselineRetainedV8, assertLeanSupervisorReasonCustodyV2, type LeanBaselineRetainedSnapshot } from "./v1-38-lean-baseline-retained.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { CANONICAL_ARENA_CATALOG_V1_37, type StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { LEAN_BASELINE_REQUIRED_METRICS, type LeanBaselineMetricReceipt } from "./v1-38-lean-baseline-metrics.js"
import * as continuationReader from "./v1-38-lean-baseline-retained.js"
import * as continuationEntry from "../run-v1-38-lean-baseline.js"
import * as continuationLedger from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as continuationFiles from "./v1-38-lean-baseline-continuation.js"
import * as leagueHost from "../run-v1-38-serious-league.js"
vi.mock("node:fs", async original => ({ ...await original<typeof import("node:fs")>(), readSync: vi.fn((await original<typeof import("node:fs")>()).readSync) }))
vi.mock("./v1-38-lean-seal-metadata.js", () => ({ inspectLeanSealMetadata: () => {
  const body = { schemaVersion: "lean-seal-metadata-inventory-v1", protocol: { present: false, bytesRoot: null }, originalPublicReference: { present: false, bytesRoot: null }, checkoutDirty: true, originalCompatibleUnopenedSealVerified: false, privateStoreOrPreimageRead: false, newExploratorySealCreated: false, reservedHoldoutPerProfile: 4, disposition: "holdout_claim_deferred_no_verified_compatible_seal", reason: "existing_clean_checkout_seal_prerequisite_not_met", claims: { absenceOfAllExternalSealsProved: false, originalCommitmentSatisfied: false, holdoutOpened: false } }
  return { ...body, root: labRoot("lean-seal-metadata-inventory-v1", body) }
} }))

const root = (name: string): LabRoot => labRoot("lean-retained-test-v1", name)
describe("continuation compressed read admission", () => {
  it("connects bounded reads to shared verification without changing legacy evidence roots or inflation reservations", () => {
    const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-evidence-")))
    const allocation = continuationFixtureBase().allocation
    const slot = allocation.slots[0]!
    const chargeBody = { schemaVersion: "lean-slot-charge-v1", allocationRoot: allocation.root, slotRoot: slot.root, ordinal: 0 }
    const charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
    const replay = continuationLedger.encodeLeanReplay([{ kind: "failure", code: "SUPERVISOR_FAILURE" }])
    const record = { classification: "system_failure", code: "SUPERVISOR_FAILURE", outcome: null, elapsedMs: 1, cleanupComplete: true, invocationCount: 1, accountingRoot: root("accounting"), executionRoot: root("execution"), telemetry: { transitions: 0, events: 0 } }
    try {
      fs.writeFileSync(join(directory, "allocation.json"), leanCanonicalBytes(allocation), { mode: 0o600 })
      fs.writeFileSync(join(directory, "ledger.ndjson"), [{ kind: "charge", charge }, { kind: "terminal", chargeRoot: charge.root, record, replay: replay.container }].map(e => Buffer.from(leanCanonicalBytes(e)).toString() + "\n").join(""), { mode: 0o600 })
      fs.writeFileSync(join(directory, `${charge.root.slice(7)}.gz`), replay.bytes, { mode: 0o600 })
      const ledger = { directory, allocation }, legacyGuard = vi.fn(), guard = vi.fn()
      const legacy = continuationLedger.verifyLeanEvidence(ledger, legacyGuard)
      const bounded = continuationReader.verifyLeanContinuationEvidence(ledger, guard)
      expect(bounded).toEqual(legacy)
      expect(guard.mock.calls.filter(c => c[0] !== undefined)).toEqual([[replay.bytes.length * 2], [replay.container.uncompressedBytes * 4]])
      expect(legacyGuard.mock.calls.filter(c => c[0] !== undefined)).toEqual([[replay.container.uncompressedBytes * 4]])
      expect(() => continuationReader.verifyLeanContinuationEvidence(ledger, bytes => { if (bytes === replay.bytes.length * 2) throw new Error("RESERVATION_DENIED") })).toThrow("RESERVATION_DENIED")
      expect(() => continuationReader.verifyLeanContinuationEvidence(ledger, bytes => { if (bytes === replay.container.uncompressedBytes * 4) throw new Error("INFLATION_DENIED") })).toThrow("INFLATION_DENIED")
    } finally { fs.rmSync(directory, { recursive: true }) }
  })
  it("forwards optional reservations unchanged through the ordinary-reader evidence hook", () => {
    const guard = vi.fn(), ledger = { directory: "inert", allocation: continuationFixtureBase().allocation } as continuationLedger.LeanExperimentLedger
    const verify = vi.spyOn(continuationLedger, "verifyLeanEvidence").mockImplementation((_ledger, check, policy) => { expect(policy).toBe("continuation-descriptor-v1"); check?.(123456); check?.(); return { root: root("evidence") } as never })
    try { continuationReader.verifyLeanContinuationEvidence(ledger, guard); expect(guard.mock.calls).toEqual([[123456], []]) }
    finally { verify.mockRestore() }
  })
  it("reserves before allocation/read, checks each chunk and detects fd/path changes and unrelated growth", () => {
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-replay-"))), path = join(dir, "replay.gz"), original = Buffer.alloc(131073, 97)
    fs.writeFileSync(path, original, { mode: 0o600 })
    const alloc = vi.spyOn(Buffer, "alloc"), read = vi.spyOn(fs, "readSync").mockClear()
    try {
      const deny = vi.fn(() => { throw new Error("CAPACITY") })
      expect(() => continuationLedger.readLeanContinuationCompressedReplay(path, original.length, deny)).toThrow("CAPACITY")
      expect(alloc).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled()
      const reservations: (number | undefined)[] = []
      expect(continuationLedger.readLeanContinuationCompressedReplay(path, original.length, n => { reservations.push(n) })).toEqual(original)
      expect(reservations[0]).toBe(original.length * 2)
      expect(reservations.length).toBeGreaterThanOrEqual(8)
      for (const mutation of ["growth", "restore", "replace", "alias", "unrelated"] as const) {
        fs.rmSync(path, { force: true }); fs.writeFileSync(path, original, { mode: 0o600 })
        let checks = 0
        expect(() => continuationLedger.readLeanContinuationCompressedReplay(path, original.length, () => {
          if (++checks !== 3) return
          if (mutation === "growth") fs.appendFileSync(path, "x")
          if (mutation === "restore") { fs.writeFileSync(path, Buffer.alloc(original.length, 98)); fs.writeFileSync(path, original) }
          if (mutation === "replace") { fs.renameSync(path, join(dir, "old")); fs.writeFileSync(path, original, { mode: 0o600 }) }
          if (mutation === "alias") fs.linkSync(path, join(dir, "alias"))
          if (mutation === "unrelated") throw new Error("SURVIVOR_CHANGED")
        })).toThrow(mutation === "unrelated" ? /SURVIVOR_CHANGED/ : /REPLAY_FILE_CHANGED/)
      }
    } finally { alloc.mockRestore(); read.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  })
})
describe("continuation executor retained joins", () => {
  const fixture = () => {
    const body = { schemaVersion: "lean-continuation-executor-diagnostic-v1", availability: "available", originAvailability: "available", allocationRoot: root("allocation"), chargeRoot: root("charge"), accountingRoot: root("accounting"), executionRoot: root("execution"), sourceRoot: root("source"), executableRoot: root("executable"), invocationRoot: root("invocation"), requestIdRoot: root("request"), inputRoot: root("input"), method: "selectActivations", ordinal: 0, stage: "executor", reason: "response_status_null", code: "SUBPROCESS_EXIT", initiatingCause: "unknown" }
    return { value: { ...body, root: labRoot(body.schemaVersion, body) }, expected: { allocationRoot: body.allocationRoot, chargeRoot: body.chargeRoot, accountingRoot: body.accountingRoot, executionRoot: body.executionRoot, sourceRoots: [body.sourceRoot], method: body.method, ordinal: body.ordinal, code: body.code } }
  }
  it("denies cross-charge/call/source joins, extra keys, unlisted reasons, speculative causes and stale roots", () => {
    const { value, expected } = fixture(), validate = (v: unknown) => continuationReader.validateLeanContinuationExecutorDiagnostic(v, expected)
    expect(validate(value)).toEqual(value)
    for (const patch of [{ allocationRoot: root("other") }, { chargeRoot: root("other") }, { accountingRoot: root("other") }, { executionRoot: root("other") }, { sourceRoot: root("other") }, { method: "soldierBrain" }, { ordinal: 1 }, { ordinal: -1 }, { ordinal: 24800 }, { inputRoot: "raw input" }, { reason: "oom" }, { reason: "exit_17" }, { initiatingCause: "timeout" }, { stage: "guest" }, { rawError: "PRIVATE" }, { stdout: "PRIVATE" }, { originAvailability: "unavailable" }]) {
      const { root: _root, ...body } = { ...value, ...patch }
      expect(() => validate({ ...body, root: labRoot(body.schemaVersion, body) })).toThrow(/CONTINUATION_EXECUTOR/)
    }
    expect(() => validate({ ...value, invocationRoot: root("another-call") })).toThrow(/CONTINUATION_EXECUTOR/)
    expect(() => validate({ ...value, root: root("wrong") })).toThrow(/CONTINUATION_EXECUTOR/)
    const { root: _root, ...unknown } = { ...value, originAvailability: "unavailable", stage: "unknown", reason: "unknown" }
    expect(validate({ ...unknown, root: labRoot(unknown.schemaVersion, unknown) })).toMatchObject({ initiatingCause: "unknown", originAvailability: "unavailable" })
  })
})
describe("distinct continuation reader admission", () => {
  it("refuses old nine-charge snapshots and a spoofed 43-charge retag", () => {
    expect(typeof continuationReader.auditLeanBaselineContinuationRetained).toBe("function")
    const s = fixture()
    expect(() => continuationReader.auditLeanBaselineContinuationRetained(s as never)).toThrow()
    const forged = structuredClone(s) as any
    forged.allocation.schemaVersion = "lean-baseline-continuation-allocation-v1"
    forged.allocation.predecessor.chargedMatches = 43
    expect(() => continuationReader.auditLeanBaselineContinuationRetained(forged)).toThrow()
  })
})

describe("continuation-v2 retained audit (inert schema fixtures only)", () => {
  const v2Allocation = (routeNamespace: "20261012-v3" | "20261012-v4" | "20261014-v6" = "20261012-v3") => {
    const old = continuationFixtureBase().allocation
    const policy = continuationLedger.LEAN_BASELINE_CONTINUATION_POLICY_V2
    const anchorMs = policy.globalAnchorMs, carryMs = Math.max(policy.oldCheckElapsedMs, continuationLedger.leanContinuationGlobalFloorV2(anchorMs))
    const windowBody = {
      schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const,
      grantId: "synthetic-no-authority", approvalEvidence: { humanDecisionId: "synthetic-only", recordedBy: "/root/cowards-game/reviewers/human" },
      approvedAtMs: anchorMs, anchorMs, deadlineMs: anchorMs + policy.durationMs, carryMs, capMs: carryMs + policy.durationMs,
      durationMs: policy.durationMs, closureMs: policy.closureMs, offlineOverheadMs: policy.offlineOverheadMs,
      routeNamespace, ...(routeNamespace === "20261014-v6" ? { approvedAtMs: 1791978643000, anchorMs: 1791978643000, carryMs: 630701903, capMs: 659501903, deadlineMs: 1792007443000 } : {}), reviewedSourceHead: "c".repeat(40), sourceRoot: old.sourceRoot,
      sourceGateRoot: root("source-gate"), planRoot: old.planRoot, runOperator: "/root/cowards-game/operators/runner", readerOperator: "/root/cowards-game/operators/retained-reader",
    }
    const window = { ...windowBody, root: labRoot(windowBody.schemaVersion, windowBody) }
    const carryBody = {
      schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const,
      elapsedUpperBoundMs: policy.oldCheckElapsedMs, allocatedDiskBytes: policy.physicalFloorBytes, residualDiskBytes: 0,
      historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const,
      originalCarryRoot: root("original-carry"), closedCapsuleRoot: labRoot("lean-baseline-continuation-closed-capsule-v2", []), custodyRoot: labRoot("lean-baseline-continuation-custody-v2", []), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v2", []), qualifiedReaderAuthority: "cost_only" as const,
    }
    const predecessor = { ...carryBody, root: labRoot(carryBody.schemaVersion, carryBody) }
    const input = {
      sourceRoot: old.sourceRoot, reviewRoot: root("review-v2"), coldRoot: old.coldRoot, planRoot: old.planRoot,
      candidateRoots: continuationEntry.deriveLeanBaselineCandidateRoots(old.coldRoot),
      requestRoots: continuationEntry.deriveLeanBaselineRequestRoots({ seed: old.seed, coldRoot: old.coldRoot, planRoot: old.planRoot, sourceRoot: old.sourceRoot }),
      seed: old.seed, sourceHead: window.reviewedSourceHead, planningRoot: root("planning-v2"), manifestRoot: root("manifest-v2"),
      requestBytesRoot: root("request-placeholder"), window, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(window)),
      sourceGateRoot: window.sourceGateRoot, dataReviewRoot: root("data-review"), predecessor,
    }
    const request = {
      schemaVersion: "lean-baseline-continuation-request-v2", seed: input.seed, sourceHead: input.sourceHead,
      sourceRoot: input.sourceRoot, planningRoot: input.planningRoot, planRoot: input.planRoot, reviewRoot: input.reviewRoot,
      coldRoot: input.coldRoot, candidateRoots: input.candidateRoots, requestRoots: input.requestRoots,
      offlineOverheadMs: policy.offlineOverheadMs, sourceAuthor: "/root/cowards-game/authors/source-owner", runOperator: window.runOperator, readerOperator: window.readerOperator,
      windowRoot: window.root, windowBytesRoot: input.windowBytesRoot, sourceGateRoot: input.sourceGateRoot, dataReviewRoot: input.dataReviewRoot, manifestRoot: input.manifestRoot,
    }
    const allocation = continuationLedger.createLeanBaselineContinuationAllocationV2({ ...input, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)) })
    return { allocation, request }
  }
  const partialV2Snapshot = (routeNamespace: "20261012-v3" | "20261012-v4" | "20261014-v6" = "20261012-v3") => {
    const old = fixture(), { allocation, request } = v2Allocation(routeNamespace), slot = allocation.slots[0]!, oldPair = old.pairs[0]!, sources = [buildLeanBaselineSource({ role: "cold-opponent", source: emitTacticalSource(), coldRoot: allocation.coldRoot, implementationRoot: allocation.sourceRoot }), buildLeanBaselineSource({ role: "tactical-0", source: emitTacticalSource(), coldRoot: allocation.coldRoot, implementationRoot: allocation.sourceRoot })], sourceByRole = new Map(sources.map(source => [source.role, source]))
    const pairBody = { ...oldPair, slotRoot: slot.root, requestRoot: slot.requestRoot, topSourceRoot: sourceByRole.get(oldPair.topRole)!.sourceRoot, topSnapshotRoot: sourceByRole.get(oldPair.topRole)!.root, bottomSourceRoot: sourceByRole.get(oldPair.bottomRole)!.sourceRoot, bottomSnapshotRoot: sourceByRole.get(oldPair.bottomRole)!.root, priorLedgerBytesRoot: leanBytesRoot(new Uint8Array()), priorLedgerByteLength: 0, priorCharged: 50 }
    const pair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", Object.fromEntries(Object.entries(pairBody).filter(([key]) => key !== "root"))) }
    const cell = { ...old.observations[0]!.cell, slotRoot: slot.root, topRoot: pairBody.topSourceRoot, bottomRoot: pairBody.bottomSourceRoot }
    const observationBody = { schemaVersion: "lean-baseline-observation-v1" as const, pairRoot: pair.root, cell }
    const observation = { ...observationBody, root: labRoot("lean-baseline-observation-v1", observationBody) }
    const chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: allocation.root, slotRoot: slot.root, ordinal: 0 }
    const charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
    const record = { slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charge.root, terminal: { kind: "terminal", chargeRoot: charge.root, record: cell.compact, replay: null }, status: "success" }
    const records = allocation.slots.map((s, i) => i === 0 ? record : ({ slotRoot: s.root, requestRoot: s.requestRoot, chargeRoot: null, terminal: null, status: "unused" }))
    const evidence = { root: labRoot("lean-evidence-v2-fixture", records), charged: 51, elapsedMs: allocation.predecessor.elapsedUpperBoundMs + 1000, physicalHighWaterBytes: 1000000, scratchHighWaterBytes: 0, records }
    const prior = [{ kind: "charge", charge }, { kind: "terminal", chargeRoot: charge.root, record: cell.compact, replay: null }]
    const ledgerEvents = [...prior, { kind: "stop", reason: "failure" }]
    const head = "a".repeat(40), start = allocation.window.anchorMs + 100
    const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head, parentPid: 100, childPid: 101, handshakeRoot: root("v2-handshake"), wallStartMs: start, monotonicStartNs: "1000000" }
    const terminal = { schemaVersion: "lean-child-terminal-v2", entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, head, parentPid: 100, childPid: 101, status: "child_exited", exitCode: 0, signal: null, elapsedUpperBoundMs: 1000, wallObservedMs: start + 1000, monotonicObservedNs: "1001000000", parentRssBytes: 100000000, childRssObservedBytes: 100000000, physicalBytes: 1000000, freeBytes: 16000000000 }
    const basePipeline = old.result.pipeline as Record<string, any>
    const unusedOrdinals = allocation.slots.slice(1).map(s => s.ordinal)
    const pipelineBody = { ...Object.fromEntries(Object.entries(basePipeline).filter(([key]) => key !== "root")), status: "partial_or_failed_baseline", stage: "initial_training", cells: [compactLeanBaselineCell(cell as never)], sources: sources.map(s => ({ role: s.role, sourceRoot: s.sourceRoot, snapshotRoot: s.root })), unusedOrdinals, holdoutReservations: allocation.holdoutReservations, schemaVersion: "lean-baseline-continuation-pipeline-v2", allocationRoot: allocation.root, windowRoot: allocation.window.root, requestBytesRoot: allocation.requestBytesRoot, implementationRoot: allocation.sourceRoot, coldRoot: allocation.coldRoot, sourceHead: allocation.sourceHead, head }
    const pipeline = { ...pipelineBody, root: labRoot("lean-baseline-continuation-pipeline-v2", pipelineBody) }
    const anchor = allocation.window.anchorMs
    const frontier = (ordinal: number, after: boolean) => ({ nowMs: anchor + 200 + ordinal * 2 + Number(after), monotonicElapsedMs: 200 + ordinal * 2 + Number(after), remainingSlots: 36 - ordinal - Number(after), charged: 50 + ordinal + Number(after), retainedBytes: 100000000, scratchBytes: 1000, parentRssBytes: 100000000, childRssBytes: 100000000, arrayBuffersBytes: 1000, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true })
    const resourceReceipts = [{ ordinal: 0, chargeRoot: charge.root, before: frontier(0, false), after: frontier(0, true) }]
    const result = { schemaVersion: "lean-baseline-continuation-result-v2", issued: false, evidenceClass: "exploratory_current_only", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head, evidenceRoot: evidence.root, pipeline, charged: 51, successful: 1, status: "partial_or_failed_baseline", elapsedMs: evidence.elapsedMs, physicalHighWaterBytes: 1000000, scratchHighWaterBytes: 0, holdoutOpened: false, formationMaterialized: false, planningRoot: allocation.planningRoot, unusedOrdinals, holdoutReservations: allocation.holdoutReservations, failure: null, sourceAuthor: request.sourceAuthor, runOperator: request.runOperator, resourceReceipts, sourceHead: allocation.sourceHead, windowRoot: allocation.window.root, windowBytesRoot: allocation.windowBytesRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, manifestRoot: allocation.manifestRoot }
    const carry = { carry: allocation.predecessor, custody: [], inventory: [] }
    const claimBody = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: allocation.window.grantId, routeNamespace: allocation.window.routeNamespace, windowRoot: allocation.window.root, windowBytesRoot: allocation.windowBytesRoot, requestBytesRoot: allocation.requestBytesRoot, sourceHead: allocation.sourceHead, sourceRoot: allocation.sourceRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, planningRoot: allocation.planningRoot, manifestRoot: allocation.manifestRoot }
    const claim = { ...claimBody, root: labRoot(claimBody.schemaVersion, claimBody) }
    const sourceHoldBody = { schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows: [] }
    const sourceHold = { ...sourceHoldBody, root: labRoot(sourceHoldBody.schemaVersion, sourceHoldBody) }
    const time = { elapsedMs: evidence.elapsedMs, active: false, starts: new Map([["continuation-run-admission", start - 10], ["pilot-entry", start], ["continuation-retained-verifier-v2", start + 1100]]), closes: new Map([["continuation-run-admission", start - 1], ["pilot-entry", start + 1000], ["continuation-retained-verifier-v2", start + 1900]]), closed: new Set(["continuation-run-admission", "pilot-entry", "continuation-retained-verifier-v2"]) }
    const snapshot = { ...old, allocation, request, requestBytesRoot: allocation.requestBytesRoot, head, entry, terminal, evidence, ledgerEvents, time, result, sources, pairs: [pair], observations: [observation], window: allocation.window, windowBytesRoot: allocation.windowBytesRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, manifestRoot: allocation.manifestRoot, claim, carry, sourceHold }
    return snapshot as unknown as continuationReader.LeanBaselineContinuationRetainedSnapshotV2
  }

  it("[continuation-v4] reads an actual selected window before scope/metadata and denies crossed request/window", () => {
    const { allocation } = v2Allocation("20261012-v4"), p = continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V4
    const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-v4-reader-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(directory)
    const ipc = { connected: Object.getOwnPropertyDescriptor(process, "connected"), send: Object.getOwnPropertyDescriptor(process, "send") }
    Object.defineProperty(process, "connected", { configurable: true, value: false }); Object.defineProperty(process, "send", { configurable: true, value: undefined })
    const clock = vi.spyOn(Date, "now").mockReturnValue(allocation.window.anchorMs + 1000), scope = vi.spyOn(continuationEntry, "assertLeanBaselineContinuationScopeV2").mockImplementation((_preparing, window) => { expect(window).toEqual(allocation.window); throw new Error("INERT_SCOPE_STOP") })
    const metadata = vi.spyOn(continuationEntry, "withLeanContinuationReaderMetadataV2"), open = vi.spyOn(continuationLedger, "openLeanLedger"), begin = vi.spyOn(continuationLedger, "beginLeanInterval"), write = vi.spyOn(continuationEntry, "writeLeanContinuationArtifact")
    try {
      fs.mkdirSync(resolve(".strategy-lab")); fs.writeFileSync(resolve(p.window), leanCanonicalBytes(allocation.window), { mode: 0o600 })
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(p.request)).toThrow("INERT_SCOPE_STOP")
      expect(scope).toHaveBeenCalledWith(false, allocation.window); expect(metadata).not.toHaveBeenCalled(); expect(open).not.toHaveBeenCalled(); expect(begin).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled()
      const { root: _, ...body } = { ...allocation.window, routeNamespace: "20261012-v3" as const }; fs.writeFileSync(resolve(p.window), leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) }))
      scope.mockClear(); expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(p.request)).toThrow(/WINDOW_NAMESPACE/); expect(scope).not.toHaveBeenCalled()
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(`${p.request}/extra`)).toThrow(); expect(metadata).not.toHaveBeenCalled(); expect(begin).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled()
      for (const path of [p.store, p.claim, p.allocation, p.temp]) expect(fs.existsSync(resolve(path))).toBe(false)
    } finally { for (const spy of [scope, metadata, open, begin, write, clock]) spy.mockRestore(); cwd.mockRestore(); for (const [key, descriptor] of Object.entries(ipc)) { if (descriptor) Object.defineProperty(process, key, descriptor); else Reflect.deleteProperty(process, key) }; fs.rmSync(directory, { recursive: true }) }
  })
  it("[continuation-v4] audits an actual constructed partial51 snapshot and rejects crossed claim, head and carried inventory", () => {
    const snapshot = partialV2Snapshot("20261012-v4")
    expect(continuationReader.auditLeanBaselineContinuationRetainedV2(snapshot)).toMatchObject({ count: { cumulative: 51, current: 1, unused: 35, complete: false } })
    for (const change of [(s: any) => { s.window = { ...s.window, routeNamespace: "20261012-v3" } }, (s: any) => { s.claim.routeNamespace = "20261012-v3" }, (s: any) => { s.window.root = root("wrong-window") }, (s: any) => { s.head = "b".repeat(40) }, (s: any) => { s.carry.inventory.push({ path: continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.window, rawRoot: root("mutated-spent-cost") }) }]) { const changed = structuredClone(snapshot); change(changed); expect(() => continuationReader.auditLeanBaselineContinuationRetainedV2(changed)).toThrow() }
  })
  it("[continuation-v4] denies a crossed allocation from real selected metadata and a spent one-use reader before publication", () => {
    const { allocation } = v2Allocation("20261012-v4"), { allocation: crossed } = v2Allocation(), p = continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V4
    const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-v4-reader-metadata-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(directory), actualExists = fs.existsSync
    const ipc = { connected: Object.getOwnPropertyDescriptor(process, "connected"), send: Object.getOwnPropertyDescriptor(process, "send") }
    Object.defineProperty(process, "connected", { configurable: true, value: false }); Object.defineProperty(process, "send", { configurable: true, value: undefined })
    const clock = vi.spyOn(Date, "now").mockReturnValue(allocation.window.anchorMs + 1000), scope = vi.spyOn(continuationEntry, "assertLeanBaselineContinuationScopeV2").mockImplementation(() => {})
    const memory = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
    const exists = vi.spyOn(fs, "existsSync").mockImplementation(path => actualExists(resolve(String(path)))), begin = vi.spyOn(continuationLedger, "beginLeanInterval"), write = vi.spyOn(continuationEntry, "writeLeanContinuationArtifact")
    try {
      fs.mkdirSync(resolve(p.temp), { recursive: true, mode: 0o700 }); fs.mkdirSync(resolve(p.store), { mode: 0o700 }); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
      fs.writeFileSync(resolve(p.window), leanCanonicalBytes(allocation.window), { mode: 0o600 }); fs.writeFileSync(resolve(p.allocation), leanCanonicalBytes(crossed), { mode: 0o644 }); fs.writeFileSync(resolve(join(p.store, "allocation.json")), leanCanonicalBytes(crossed), { mode: 0o600 })
      for (const name of ["time.ndjson", "ledger.ndjson"]) fs.writeFileSync(resolve(join(p.store, name)), "", { mode: 0o600 })
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(p.request)).toThrow(/WINDOW_BINDING/)
      fs.writeFileSync(resolve(p.allocation), leanCanonicalBytes(allocation)); fs.writeFileSync(resolve(join(p.store, "allocation.json")), leanCanonicalBytes(allocation))
      const events = ["continuation-run-admission", "pilot-entry"].flatMap((id, i) => [{ kind: "start", id, atMs: allocation.window.anchorMs + i * 2 }, { kind: "close", id, atMs: allocation.window.anchorMs + i * 2 + 1 }])
      fs.writeFileSync(resolve(join(p.store, "time.ndjson")), events.map(event => Buffer.from(leanCanonicalBytes(event)).toString() + "\n").join(""))
      fs.writeFileSync(resolve(join(p.store, "reader-claim.json")), "{}", { mode: 0o600 })
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(p.request)).toThrow(/READER_USED/)
      expect(begin).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); expect(fs.existsSync(resolve(join(p.store, "retained-check.json")))).toBe(false)
    } finally { for (const spy of [scope, memory, disk, available, exists, begin, write, clock]) spy.mockRestore(); cwd.mockRestore(); for (const [key, descriptor] of Object.entries(ipc)) { if (descriptor) Object.defineProperty(process, key, descriptor); else Reflect.deleteProperty(process, key) }; fs.rmSync(directory, { recursive: true }) }
  })
  it("[continuation-v2] uses the separate schema and preserves the exact 50 + n ledger arithmetic and 36 cold slots", () => {
    const { allocation } = v2Allocation()
    expect(continuationLedger.validateLeanBaselineContinuationAllocationV2(allocation)).toEqual(allocation)
    expect(allocation.predecessor.chargedMatches).toBe(50)
    expect(allocation.slots).toHaveLength(36)
    expect(continuationLedger.leanContinuationIdentityV2("/root/cowards-game/authors/source-owner")).toBe(true)
    expect(continuationLedger.leanContinuationIdentityV2("/root/cowards-game/reviewer/primary")).toBe(true)
    expect(continuationLedger.leanContinuationIdentityV2("/root/cowards-game/verifier/independent")).toBe(true)
    expect(continuationLedger.leanContinuationIdentityV2("/root/cowards-game/operators/runner")).toBe(true)
    expect(continuationLedger.leanContinuationIdentityV2("/root/cowards-game/operators/retained-reader")).toBe(true)
    expect(continuationLedger.leanContinuationIdentityV2("/root/with spaces")).toBe(false)
    expect(continuationLedger.leanContinuationIdentityV2("x".repeat(121))).toBe(false)
    expect(allocation.holdoutReservations).toHaveLength(4)
    expect(continuationReader.assertLeanBaselineContinuationV2ClosedCount(50, 0)).toEqual({ cumulative: 50, current: 0, unused: 36, complete: false })
    expect(continuationReader.assertLeanBaselineContinuationV2ClosedCount(51, 1)).toEqual({ cumulative: 51, current: 1, unused: 35, complete: false })
    expect(continuationReader.assertLeanBaselineContinuationV2ClosedCount(86, 36)).toEqual({ cumulative: 86, current: 36, unused: 0, complete: true })
    for (const [cumulative, current] of [[43, 0], [49, 0], [51, 0], [86, 35], [87, 37]] as const) expect(() => continuationReader.assertLeanBaselineContinuationV2ClosedCount(cumulative, current)).toThrow(/V2_CHARGE_COUNT/)
    const frontier = { nowMs: 1, monotonicElapsedMs: 1, remainingSlots: 36, charged: 50, retainedBytes: 1, scratchBytes: 1, parentRssBytes: 1, childRssBytes: 1, arrayBuffersBytes: 1, availableMemoryBytes: 1, freeBytes: 1, live: true }
    expect(() => continuationReader.assertLeanBaselineContinuationResourceReceiptShapeV2(frontier)).not.toThrow()
    const { availableMemoryBytes: _removed, ...incomplete } = frontier
    expect(() => continuationReader.assertLeanBaselineContinuationResourceReceiptShapeV2(incomplete as never)).toThrow(/V2_RESOURCE_SHAPE/)
  })

  it("[continuation-v2] rejects V1-retagged or incomplete V2 snapshots before any reader capability exists", () => {
    const { allocation, request } = v2Allocation()
    const snapshot = { allocation, request, requestBytesRoot: root("wrong-request-bytes"), head: allocation.sourceHead, window: allocation.window, windowBytesRoot: allocation.windowBytesRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, manifestRoot: allocation.manifestRoot } as unknown as continuationReader.LeanBaselineContinuationRetainedSnapshotV2
    expect(() => continuationReader.auditLeanBaselineContinuationRetainedV2(snapshot)).toThrow(/V2_REQUEST/)
    expect(() => continuationReader.auditLeanBaselineContinuationRetainedV2({ ...snapshot, allocation: { ...allocation, schemaVersion: "lean-baseline-continuation-allocation-v1" } as never })).toThrow()
    expect(continuationReader.verifyLeanContinuationEvidence).toBeDefined()
  })
  it("[continuation-v2] accepts an independently rebuilt partial 50 + 1 synthetic audit snapshot", () => {
    const snapshot = partialV2Snapshot()
    expect(continuationReader.auditLeanBaselineContinuationRetainedV2(snapshot)).toMatchObject({ count: { cumulative: 51, current: 1, unused: 35, complete: false } })
    const identity = structuredClone(snapshot) as any
    identity.request.sourceAuthor = "changed-author"
    expect(() => continuationReader.auditLeanBaselineContinuationRetainedV2(identity)).toThrow(/V2_REQUEST/)
    const resource = structuredClone(snapshot) as any
    delete resource.result.resourceReceipts[0].after.availableMemoryBytes
    expect(() => continuationReader.auditLeanBaselineContinuationRetainedV2(resource)).toThrow(/V2_RESOURCE_SHAPE/)
    const grant = structuredClone(snapshot) as any
    grant.claim.grantId = "changed-grant"
    expect(() => continuationReader.auditLeanBaselineContinuationRetainedV2(grant)).toThrow(/V2_CLAIM/)
  })
  it.each(["20261012-v3", "20261012-v4"] as const)("[continuation-v2] [continuation-v4] accepts a synthetic full 86-charge V2 pipeline snapshot: %s", async routeNamespace => {
    const { allocation, request } = v2Allocation(routeNamespace)
    const full = await completeFixture(() => "DRAW", true, allocation)
    const inventory: unknown[] = [], custody: unknown[] = [], carry = { carry: allocation.predecessor, custody, inventory }
    const claimBody = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: allocation.window.grantId, routeNamespace: allocation.window.routeNamespace, windowRoot: allocation.window.root, windowBytesRoot: allocation.windowBytesRoot, requestBytesRoot: allocation.requestBytesRoot, sourceHead: allocation.sourceHead, sourceRoot: allocation.sourceRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, planningRoot: allocation.planningRoot, manifestRoot: allocation.manifestRoot }
    const claim = { ...claimBody, root: labRoot(claimBody.schemaVersion, claimBody) }
    const sourceHoldBody = { schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead: allocation.sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows: [] }
    const sourceHold = { ...sourceHoldBody, root: labRoot(sourceHoldBody.schemaVersion, sourceHoldBody) }
    const snapshot = { ...full, request, allocation, window: allocation.window, windowBytesRoot: allocation.windowBytesRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, manifestRoot: allocation.manifestRoot, carry, claim, sourceHold } as unknown as continuationReader.LeanBaselineContinuationRetainedSnapshotV2
    expect(Object.keys(snapshot.result).sort()).toEqual(["schemaVersion", "issued", "evidenceClass", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "evidenceRoot", "charged", "successful", "status", "pipeline", "elapsedMs", "physicalHighWaterBytes", "scratchHighWaterBytes", "holdoutOpened", "formationMaterialized", "planningRoot", "unusedOrdinals", "holdoutReservations", "failure", "sourceAuthor", "runOperator", "resourceReceipts", "sourceHead", "windowRoot", "windowBytesRoot", "sourceGateRoot", "dataReviewRoot", "manifestRoot"].sort())
    expect((snapshot.result.resourceReceipts as any[]).map(row => [row.ordinal, row.chargeRoot, row.before.charged, row.after.charged, row.before.remainingSlots, row.after.remainingSlots])).toEqual(Array.from({ length: 36 }, (_, ordinal) => [ordinal, snapshot.evidence.records[ordinal]?.chargeRoot, 50 + ordinal, 51 + ordinal, 36 - ordinal, 35 - ordinal]))
    expect(continuationReader.auditLeanBaselineContinuationRetainedV2(snapshot)).toMatchObject({ count: { cumulative: 86, current: 36, unused: 0, complete: true } })
  }, 30000)
  it("[continuation-v2] accepts only an authentic legacy parent envelope joined to the exact reader terminal", () => {
    const actual = { allocationRoot: root("allocation"), sourceRoot: root("source"), requestBytesRoot: root("request"), entryBytesRoot: root("entry"), head: "a".repeat(40), parentPid: 100, childPid: 101, exitCode: 0, signal: null, status: "child_exited" as const }
    const body = { schemaVersion: "lean-parent-supervisor-reasons-v1" as const, allocationRoot: actual.allocationRoot, sourceRoot: actual.sourceRoot, requestBytesRoot: actual.requestBytesRoot, entryBytesRoot: actual.entryBytesRoot, head: actual.head, parentPid: actual.parentPid, childPid: actual.childPid, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published" as const, childReady: "observed" as const, resourceSampling: "observed" as const, finalIdentity: "matched" as const, failureReceipt: "absent" as const, cleanup: "child_exit_observed" as const, terminalization: "unobserved" as const, initiatingCause: "unknown" as const } }
    const bytes = leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) })
    expect(continuationReader.assertLeanContinuationSupervisorCustodyV2(bytes, actual)).toMatchObject({ schemaVersion: "lean-parent-supervisor-reasons-v1" })
    expect(continuationReader.assertLeanContinuationSupervisorCustodyV1ForV2(bytes, actual)).toMatchObject({ schemaVersion: "lean-parent-supervisor-reasons-v1" })
    expect(() => continuationReader.assertLeanContinuationSupervisorCustodyV2(bytes, { ...actual, head: "b".repeat(40) })).toThrow(/SUPERVISOR_CUSTODY_V2/)
    const { root: _root, ...v2Body } = { ...body, schemaVersion: "lean-parent-supervisor-reasons-v2", root: "placeholder" }
    expect(() => continuationReader.assertLeanContinuationSupervisorCustodyV1ForV2(leanCanonicalBytes({ ...v2Body, root: labRoot(v2Body.schemaVersion, v2Body) }), actual)).toThrow()
  })
  it("[continuation-v2] reserves publication construction before body/root allocation", () => {
    const { allocation } = v2Allocation(), ledger = { directory: "inert", allocation } as continuationLedger.LeanExperimentLedger
    const guard = vi.fn((bytes?: number) => { if (bytes) throw new Error("RESERVATION_DENIED") }), publish = vi.fn()
    expect(() => continuationReader.publishLeanContinuationRetainedCheckV2(ledger, undefined, null, guard, publish as never)).toThrow(/V2_TERMINAL_REFUSAL/)
    expect(guard).toHaveBeenCalledWith(16 * 1024 * 1024)
    expect(publish).not.toHaveBeenCalled()
  })
  it.each(["pass", "closing", "uncertain", "foreign"] as const)("[continuation-stage-cadence-I] actual V6 publisher closes full acceptance and never writes issued credit: %s", mode => {
    const { allocation } = v2Allocation("20261014-v6"), ledger = { directory: "inert", allocation } as continuationLedger.LeanExperimentLedger
    const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "cadence-publish-"))), path = join(directory, "closed-source"), context = {}
    fs.writeFileSync(path, "fixed source")
    const controller = continuationFiles.createLeanContinuationStageControllerV6([{ path, stat: fs.lstatSync(path) }], [], [{ path, role: "closed_history" }], context, () => {})
    const stage = <T>(body: () => T) => controller.withStage(mode === "foreign" ? { ...context } : context, "publication", body)
    const time = vi.spyOn(continuationLedger, "readLeanTimeAccounting").mockReturnValue({ active: false, starts: new Map([["continuation-retained-verifier-v2", allocation.window.anchorMs]]), closed: new Set(["continuation-retained-verifier-v2"]) } as never)
    const state = vi.spyOn(continuationLedger, "readLeanLedger").mockReturnValue({ charged: 51, charges: new Map() } as never), elapsed = vi.spyOn(continuationLedger, "currentLeanElapsedMs").mockReturnValue(allocation.window.carryMs), physical = vi.spyOn(continuationLedger, "cumulativeLeanPhysicalBytes").mockReturnValue(100000000), clock = vi.spyOn(Date, "now").mockReturnValue(allocation.window.anchorMs + 1000)
    const written: Record<string, any>[] = [], publish = vi.fn((_ledger, _name, value) => { written.push(value); if (mode === "closing") fs.writeFileSync(path, "drift"); if (mode === "uncertain") throw new Error("PRIVATE_UNCERTAINTY") })
    const run = () => continuationReader.publishLeanContinuationRetainedCheckV2(ledger, { complete: true } as never, null, () => {}, publish as never, stage)
    try {
      if (mode === "pass") expect(run()).toMatchObject({ disposition: "passed", issued: false })
      else expect(run).toThrow(/V2_TERMINAL_REFUSAL/)
      if (mode === "foreign") expect(written).toHaveLength(0)
      for (const value of written) expect(value.issued).toBe(false)
      if (mode !== "pass") expect(() => controller.live(context, () => {})).toThrow()
    } finally { for (const spy of [time, state, elapsed, physical, clock]) spy.mockRestore(); fs.rmSync(directory, { recursive: true }) }
  })
  it("[continuation-v2] rejects wrong scope and expired window before interval or claim/check writes", () => {
    const { allocation } = v2Allocation(), begin = vi.spyOn(continuationLedger, "beginLeanInterval"), write = vi.spyOn(continuationEntry, "writeLeanContinuationArtifact")
    const connected = Object.getOwnPropertyDescriptor(process, "connected")
    const send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "connected", { configurable: true, value: false })
    Object.defineProperty(process, "send", { configurable: true, value: undefined })
    const scope = vi.spyOn(continuationEntry, "assertLeanBaselineContinuationScopeV2").mockImplementation(() => { throw new Error("WRONG_SCOPE") })
    const window = vi.spyOn(continuationEntry, "readLeanBaselineContinuationWindowV2").mockReturnValue(allocation.window)
    const clock = vi.spyOn(Date, "now").mockReturnValue(allocation.window.anchorMs + 1000)
    const open = vi.spyOn(continuationLedger, "openLeanLedger")
    const preflight = vi.spyOn(continuationEntry, "withLeanContinuationReaderMetadataV2").mockImplementation((_window, parse) => parse())
    try {
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toThrow("WRONG_SCOPE")
      expect(begin).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); expect(window).toHaveBeenCalledWith(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)
      scope.mockImplementation(() => {})
      clock.mockReturnValue(allocation.window.deadlineMs + 1)
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toThrow(/V2_READER_WINDOW/)
      expect(begin).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled()
      expect(open).not.toHaveBeenCalled(); expect(preflight).not.toHaveBeenCalled()
      window.mockReturnValue(allocation.window as never)
      clock.mockReturnValue(allocation.window.anchorMs + 1000)
      preflight.mockImplementation(() => { throw new Error("OVERSIZED_STORE_METADATA") })
      expect(() => continuationReader.verifyLeanBaselineContinuationRetainedV2(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)).toThrow("OVERSIZED_STORE_METADATA")
      expect(open).not.toHaveBeenCalled(); expect(begin).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled()
    } finally { scope.mockRestore(); window.mockRestore(); clock.mockRestore(); preflight.mockRestore(); open.mockRestore(); begin.mockRestore(); write.mockRestore(); if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected"); if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  })
  it("[continuation-v2] admits a delayed reader using remaining closure, bounded source reads and authentic reason-v1 custody", () => {
    const snapshot = partialV2Snapshot(), ledger = { directory: "synthetic-only", allocation: snapshot.allocation } as continuationLedger.LeanExperimentLedger
    const interval = "continuation-retained-verifier-v2", starts = new Map([["continuation-run-admission", snapshot.entry.wallStartMs - 10], ["pilot-entry", snapshot.entry.wallStartMs], [interval, snapshot.terminal.wallObservedMs + 1]]), closes = new Map([["continuation-run-admission", snapshot.entry.wallStartMs - 1], ["pilot-entry", snapshot.entry.wallStartMs + snapshot.terminal.elapsedUpperBoundMs], [interval, snapshot.terminal.wallObservedMs + 20]])
    let timeReads = 0
    const timeFixture = () => ({ ...snapshot.time, active: false, starts: timeReads++ === 0 ? new Map([...starts].filter(([key]) => key !== interval)) : starts, closes, closed: new Set(timeReads === 1 ? ["continuation-run-admission", "pilot-entry"] : ["continuation-run-admission", "pilot-entry", interval]) })
    const state = { allocation: snapshot.allocation, events: snapshot.ledgerEvents, charged: 51, charges: new Map(snapshot.evidence.records.filter(r => r.chargeRoot).map(r => [r.chargeRoot, r])) } as unknown as ReturnType<typeof continuationLedger.readLeanLedger>
    const ctx = { ...snapshot, ledger, paths: continuationLedger.leanBaselineContinuationPathsForWindowV2(snapshot.window), fixedHead: snapshot.head, manifest: { schemaVersion: "lean-baseline-continuation-data-manifest-v2", admitting: true, implementationEntries: [], planningEntries: [], entries: [], root: snapshot.allocation.sourceRoot, planningRoot: snapshot.allocation.planningRoot, manifestRoot: snapshot.manifestRoot, windowRoot: snapshot.allocation.window.root, windowBytesRoot: snapshot.windowBytesRoot, sourceGateRoot: snapshot.sourceGateRoot, dataReviewRoot: snapshot.dataReviewRoot, sourceGate: null, dataGate: null }, guard: vi.fn() }
    // Ten minutes into the approved window leaves 26 minutes. The closed pilot
    // interval is already over five minutes old, so only its remaining closure
    // reserve fits; the original full closure+offline reserve would not.
    const fixtureClock = vi.spyOn(Date, "now").mockReturnValue(snapshot.allocation.window.deadlineMs - 26 * 60_000)
    const connected = Object.getOwnPropertyDescriptor(process, "connected"), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "connected", { configurable: true, value: false }); Object.defineProperty(process, "send", { configurable: true, value: undefined })
    const scope = vi.spyOn(continuationEntry, "assertLeanBaselineContinuationScopeV2").mockImplementation(() => {})
    const window = vi.spyOn(continuationEntry, "readLeanBaselineContinuationWindowV2").mockReturnValue(snapshot.allocation.window)
    const sequence: string[] = []
    const open = vi.spyOn(continuationLedger, "openLeanLedger").mockImplementation(() => { sequence.push("open"); return ledger })
    const preflight = vi.spyOn(continuationEntry, "withLeanContinuationReaderMetadataV2").mockImplementation((_window, parse) => { sequence.push("preflight"); return parse() })
    const time = vi.spyOn(continuationLedger, "readLeanTimeAccounting").mockImplementation(timeFixture as never)
    const elapsed = vi.spyOn(continuationLedger, "currentLeanElapsedMs").mockReturnValue(snapshot.allocation.predecessor.elapsedUpperBoundMs + 5000)
    const begin = vi.spyOn(continuationLedger, "beginLeanInterval").mockImplementation(() => {})
    const close = vi.spyOn(continuationLedger, "closeLeanInterval").mockImplementation(() => timeFixture() as never)
    const terminal = vi.spyOn(continuationLedger, "readLeanChildTerminal").mockReturnValue(snapshot.terminal as never)
    const entry = vi.spyOn(continuationLedger, "readLeanChildEntry").mockReturnValue(snapshot.entry as never)
    const readLedger = vi.spyOn(continuationLedger, "readLeanLedger").mockReturnValue(state)
    const evidence = vi.spyOn(continuationLedger, "verifyLeanEvidence").mockReturnValue(snapshot.evidence as never)
    const physical = vi.spyOn(continuationLedger, "cumulativeLeanPhysicalBytes").mockReturnValue(100000000)
    const context = vi.spyOn(continuationEntry, "openLeanBaselineContinuationContextV2").mockReturnValue(ctx as never)
    const write = vi.spyOn(continuationEntry, "writeLeanContinuationArtifact").mockImplementation(() => undefined as never)
    const reads = vi.spyOn(continuationFiles, "readLeanContinuationJsonV2").mockImplementation((path: string) => {
      const name = path.split("/").at(-1)
      if (name === "result.json") return snapshot.result as never
      if (name === "pair-0.json") return snapshot.pairs[0] as never
      if (name === "observation-0.json") return snapshot.observations[0] as never
      if (name === "carry.json") return snapshot.carry as never
      if (name === "source-hold.json") return snapshot.sourceHold as never
      if (name === "source-manifest.json") return ctx.manifest as never
      if (name?.startsWith("source-") && name.endsWith(".json")) return snapshot.sources.find(source => name === `source-${source.role}.json`) as never
      if (name === "seal-metadata.json") return snapshot.artifacts["seal-metadata.json"] as never
      if (name === "parent-supervisor-reasons.json") {
        const body = { schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: snapshot.allocation.root, sourceRoot: snapshot.allocation.sourceRoot, requestBytesRoot: snapshot.allocation.requestBytesRoot, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(snapshot.entry)), head: snapshot.head, parentPid: snapshot.entry.parentPid, childPid: snapshot.entry.childPid, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
        return { ...body, root: labRoot(body.schemaVersion, body) } as never
      }
      if (name?.startsWith("publication-")) {
        const source = snapshot.sources.find(s => name === `publication-${s.role}-continuation-v2.json`)!
        const body = { schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: snapshot.allocation.root, sourceHead: snapshot.allocation.sourceHead, head: snapshot.head, implementationRoot: snapshot.allocation.sourceRoot, coldRoot: snapshot.allocation.coldRoot, role: source.role, snapshotRoot: source.root, sourceRoot: source.sourceRoot, windowRoot: snapshot.allocation.window.root, windowBytesRoot: snapshot.allocation.windowBytesRoot, requestBytesRoot: snapshot.allocation.requestBytesRoot, dataReviewRoot: snapshot.allocation.dataReviewRoot }
        return { ...body, root: labRoot(body.schemaVersion, body) } as never
      }
      throw new Error(`UNEXPECTED_SYNTHETIC_READ:${name}`)
    })
    const names = ["allocation.json", "ledger.ndjson", "time.ndjson", "carry.json", "source-manifest.json", "source-hold.json", "run-claim.json", "reader-claim.json", "entry.json", "child-terminal.json", "parent-supervisor-reasons.json", "result.json", "seal-metadata.json", "pair-0.json", "observation-0.json", ...snapshot.sources.flatMap(s => [`source-${s.role}.json`, `publication-${s.role}-continuation-v2.json`])]
    let directoryReads = 0
    const readdir = vi.spyOn(fs, "readdirSync").mockImplementation(() => (directoryReads++ === 0 ? names.filter(name => name !== "reader-claim.json") : names) as never)
    const kill = vi.spyOn(process, "kill").mockImplementation(() => { throw Object.assign(new Error("gone"), { code: "ESRCH" }) })
    try {
      const report = continuationReader.verifyLeanBaselineContinuationRetainedV2(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V2.request)
      expect((report as any).failure).toBeNull()
      expect(report).toMatchObject({ schemaVersion: "lean-baseline-continuation-retained-check-v2", disposition: "gaps_found", charged: 51 })
      expect(reads.mock.calls.some(call => call[1] === 4194304)).toBe(true)
      expect(begin).toHaveBeenCalledTimes(1); expect(close).toHaveBeenCalledTimes(1); expect(ctx.guard).toHaveBeenCalledWith(65536)
      expect(sequence.slice(0, 2)).toEqual(["preflight", "open"])
      expect(write.mock.calls.map(call => call[1])).toContain("reader-claim.json")
      expect(reads.mock.calls.some(call => String(call[0]).includes("/source-") && call[1] === 262144)).toBe(true)
    } finally {
      for (const spy of [scope, window, open, preflight, time, elapsed, begin, close, terminal, entry, readLedger, evidence, physical, context, write, reads, readdir, kill, fixtureClock]) spy.mockRestore()
      if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected")
      if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send")
    }
  }, 30000)
  it.each(["pass", "history", "result", "publication"] as const)("[continuation-stage-cadence-I] actual V6 reader opening/audit/terminal/publication: %s (mock context/resources)", mode => {
    const snapshot = partialV2Snapshot("20261014-v6"), ledger = { directory: "synthetic-only", allocation: snapshot.allocation } as continuationLedger.LeanExperimentLedger
    const interval = "continuation-retained-verifier-v2", starts = new Map([["continuation-run-admission", snapshot.entry.wallStartMs - 10], ["pilot-entry", snapshot.entry.wallStartMs], [interval, snapshot.terminal.wallObservedMs + 1]]), closes = new Map([["continuation-run-admission", snapshot.entry.wallStartMs - 1], ["pilot-entry", snapshot.entry.wallStartMs + snapshot.terminal.elapsedUpperBoundMs], [interval, snapshot.terminal.wallObservedMs + 20]])
    let timeReads = 0
    const timeFixture = () => ({ ...snapshot.time, active: false, starts: timeReads++ === 0 ? new Map([...starts].filter(([key]) => key !== interval)) : starts, closes, closed: new Set(timeReads === 1 ? ["continuation-run-admission", "pilot-entry"] : ["continuation-run-admission", "pilot-entry", interval]) })
    const state = { allocation: snapshot.allocation, events: snapshot.ledgerEvents, charged: 51, charges: new Map(snapshot.evidence.records.filter(r => r.chargeRoot).map(r => [r.chargeRoot, r])) } as unknown as ReturnType<typeof continuationLedger.readLeanLedger>
    const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "cadence-reader-"))), closedPath = join(directory, "history"), resultPath = join(directory, "active-result"), marker = {}, stages: string[] = []
    fs.writeFileSync(closedPath, "closed"); fs.writeFileSync(resultPath, "result")
    const controller = continuationFiles.createLeanContinuationStageControllerV6([closedPath, resultPath].map(path => ({ path, stat: fs.lstatSync(path) })), [], [{ path: closedPath, role: "closed_history" }, { path: resultPath, role: "active_input" }], marker, () => {})
    const stage = <T>(kind: import("./v1-38-lean-baseline-continuation.js").LeanContinuationStageV6, body: () => T): T => { stages.push(kind); return controller.withStage(marker, kind, () => { const value = body(); if (mode === "history" && kind === "reader" && stages.filter(s => s === "reader").length === 2) fs.writeFileSync(closedPath, "changed"); return value }) }
    const ctx = { ...snapshot, ledger, paths: continuationLedger.leanBaselineContinuationPathsForWindowV2(snapshot.window), fixedHead: snapshot.head, manifest: { schemaVersion: "lean-baseline-continuation-data-manifest-v2", admitting: true, implementationEntries: [], planningEntries: [], entries: [], root: snapshot.allocation.sourceRoot, planningRoot: snapshot.allocation.planningRoot, manifestRoot: snapshot.manifestRoot, windowRoot: snapshot.allocation.window.root, windowBytesRoot: snapshot.windowBytesRoot, sourceGateRoot: snapshot.sourceGateRoot, dataReviewRoot: snapshot.dataReviewRoot, sourceGate: null, dataGate: null }, guard: vi.fn((_additional?: number) => controller.live(marker, () => {})), stage, invalidate: () => controller.invalidate() }
    // Ten minutes into the approved window leaves 26 minutes. The closed pilot
    // interval is already over five minutes old, so only its remaining closure
    // reserve fits; the original full closure+offline reserve would not.
    const fixtureClock = vi.spyOn(Date, "now").mockReturnValue(snapshot.allocation.window.deadlineMs - 26 * 60_000)
    const connected = Object.getOwnPropertyDescriptor(process, "connected"), send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "connected", { configurable: true, value: false }); Object.defineProperty(process, "send", { configurable: true, value: undefined })
    const scope = vi.spyOn(continuationEntry, "assertLeanBaselineContinuationScopeV2").mockImplementation(() => {})
    const window = vi.spyOn(continuationEntry, "readLeanBaselineContinuationWindowV2").mockReturnValue(snapshot.allocation.window)
    const sequence: string[] = []
    const open = vi.spyOn(continuationLedger, "openLeanLedger").mockImplementation(() => { sequence.push("open"); return ledger })
    const preflight = vi.spyOn(continuationEntry, "withLeanContinuationReaderMetadataV2").mockImplementation((_window, parse) => { sequence.push("preflight"); return parse() })
    const time = vi.spyOn(continuationLedger, "readLeanTimeAccounting").mockImplementation(timeFixture as never)
    const elapsed = vi.spyOn(continuationLedger, "currentLeanElapsedMs").mockReturnValue(snapshot.allocation.predecessor.elapsedUpperBoundMs + 5000)
    const begin = vi.spyOn(continuationLedger, "beginLeanInterval").mockImplementation(() => {})
    const close = vi.spyOn(continuationLedger, "closeLeanInterval").mockImplementation(() => timeFixture() as never)
    const terminal = vi.spyOn(continuationLedger, "readLeanChildTerminal").mockReturnValue(snapshot.terminal as never)
    const entry = vi.spyOn(continuationLedger, "readLeanChildEntry").mockReturnValue(snapshot.entry as never)
    const readLedger = vi.spyOn(continuationLedger, "readLeanLedger").mockReturnValue(state)
    const evidence = vi.spyOn(continuationLedger, "verifyLeanEvidence").mockReturnValue(snapshot.evidence as never)
    const physical = vi.spyOn(continuationLedger, "cumulativeLeanPhysicalBytes").mockReturnValue(100000000)
    const context = vi.spyOn(continuationEntry, "openLeanBaselineContinuationContextV2").mockReturnValue(ctx as never)
    const write = vi.spyOn(continuationEntry, "writeLeanContinuationArtifact").mockImplementation((_ledger, name) => { if (mode === "publication" && name === "retained-check.json") fs.writeFileSync(closedPath, "changed"); return undefined as never })
    const reads = vi.spyOn(continuationFiles, "readLeanContinuationJsonV2").mockImplementation((path: string) => {
      const name = path.split("/").at(-1)
      if (name === "result.json") { if (mode === "result") fs.writeFileSync(resultPath, "changed"); return snapshot.result as never }
      if (name === "pair-0.json") return snapshot.pairs[0] as never
      if (name === "observation-0.json") return snapshot.observations[0] as never
      if (name === "carry.json") return snapshot.carry as never
      if (name === "source-hold.json") return snapshot.sourceHold as never
      if (name === "source-manifest.json") return ctx.manifest as never
      if (name?.startsWith("source-") && name.endsWith(".json")) return snapshot.sources.find(source => name === `source-${source.role}.json`) as never
      if (name === "seal-metadata.json") return snapshot.artifacts["seal-metadata.json"] as never
      if (name === "parent-supervisor-reasons.json") {
        const body = { schemaVersion: "lean-parent-supervisor-reasons-v1", allocationRoot: snapshot.allocation.root, sourceRoot: snapshot.allocation.sourceRoot, requestBytesRoot: snapshot.allocation.requestBytesRoot, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(snapshot.entry)), head: snapshot.head, parentPid: snapshot.entry.parentPid, childPid: snapshot.entry.childPid, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
        return { ...body, root: labRoot(body.schemaVersion, body) } as never
      }
      if (name?.startsWith("publication-")) {
        const source = snapshot.sources.find(s => name === `publication-${s.role}-continuation-v2.json`)!
        const body = { schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: snapshot.allocation.root, sourceHead: snapshot.allocation.sourceHead, head: snapshot.head, implementationRoot: snapshot.allocation.sourceRoot, coldRoot: snapshot.allocation.coldRoot, role: source.role, snapshotRoot: source.root, sourceRoot: source.sourceRoot, windowRoot: snapshot.allocation.window.root, windowBytesRoot: snapshot.allocation.windowBytesRoot, requestBytesRoot: snapshot.allocation.requestBytesRoot, dataReviewRoot: snapshot.allocation.dataReviewRoot }
        return { ...body, root: labRoot(body.schemaVersion, body) } as never
      }
      throw new Error(`UNEXPECTED_SYNTHETIC_READ:${name}`)
    })
    const names = ["allocation.json", "ledger.ndjson", "time.ndjson", "carry.json", "source-manifest.json", "source-hold.json", "run-claim.json", "reader-claim.json", "entry.json", "child-terminal.json", "parent-supervisor-reasons.json", "result.json", "seal-metadata.json", "pair-0.json", "observation-0.json", ...snapshot.sources.flatMap(s => [`source-${s.role}.json`, `publication-${s.role}-continuation-v2.json`])]
    let directoryReads = 0
    const readdir = vi.spyOn(fs, "readdirSync").mockImplementation(() => (directoryReads++ === 0 ? names.filter(name => name !== "reader-claim.json") : names) as never)
    const kill = vi.spyOn(process, "kill").mockImplementation(() => { throw Object.assign(new Error("gone"), { code: "ESRCH" }) })
    try {
      const invoke = () => continuationReader.verifyLeanBaselineContinuationRetainedV2(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS_V6.request)
      if (mode !== "pass") { expect(invoke).toThrow(/V2_TERMINAL_REFUSAL/); expect(() => ctx.guard()).toThrow(); expect(state.charged).toBe(51); if (mode === "publication") expect(write.mock.calls.some(call => call[1] === "retained-check.json" && (call[2] as any).issued === false)).toBe(true); return }
      const report = invoke()
      expect((report as any).failure).toBeNull()
      expect(report).toMatchObject({ schemaVersion: "lean-baseline-continuation-retained-check-v2", disposition: "gaps_found", charged: 51 })
      expect(reads.mock.calls.some(call => call[1] === 4194304)).toBe(true)
      expect(stages).toEqual(["reader", "claim", "reader", "terminal", "publication"])
      expect(report).toMatchObject({ issued: false })
      expect(begin).toHaveBeenCalledTimes(1); expect(close).toHaveBeenCalledTimes(1); expect(ctx.guard).toHaveBeenCalledWith(65536)
      expect(sequence.slice(0, 2)).toEqual(["preflight", "open"])
      expect(write.mock.calls.map(call => call[1])).toContain("reader-claim.json")
      expect(reads.mock.calls.some(call => String(call[0]).includes("/source-") && call[1] === 262144)).toBe(true)
    } finally {
      for (const spy of [scope, window, open, preflight, time, elapsed, begin, close, terminal, entry, readLedger, evidence, physical, context, write, reads, readdir, kill, fixtureClock]) spy.mockRestore()
      if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected")
      if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send")
      fs.rmSync(directory, { recursive: true })
    }
  }, 30000)
})
describe("strict v12 finite attribution custody join", () => {
  const fixture = () => {
    const actual = { allocationRoot: root("allocation"), sourceRoot: root("source"), requestBytesRoot: root("request"), entryBytesRoot: root("entry"), head: "a".repeat(40), parentPid: 100, childPid: 101, exitCode: 0, signal: null, status: "child_failed" as const }
    const { status: _status, ...identity } = actual
    const body = { schemaVersion: "lean-parent-supervisor-reasons-v2", ...identity, uncertain: true, reasons: ["resource_sampling_exception"], observations: { entry: "published", childReady: "observed", resourceSampling: "exception", resourceSamplingOperation: "child_rss", resourceSamplingSequence: 1, resourceSamplingExitObserved: false, finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
    return { actual, bytes: leanCanonicalBytes({ ...body, root: labRoot("lean-parent-supervisor-reasons-v2", body) }) }
  }
  it("joins authentic finite failed evidence but rejects forged clean terminal and every identity mutation", () => {
    const { actual, bytes } = fixture()
    expect(assertLeanSupervisorReasonCustodyV2(bytes, actual)).toMatchObject({ uncertain: true })
    for (const patch of [{ allocationRoot: root("cross") }, { sourceRoot: root("cross") }, { requestBytesRoot: root("cross") }, { entryBytesRoot: root("cross") }, { head: "b".repeat(40) }, { parentPid: 102 }, { childPid: 102 }, { exitCode: 1 }, { signal: "SIGKILL" }, { status: "child_exited" }, { rawError: "PRIVATE" }]) expect(() => assertLeanSupervisorReasonCustodyV2(bytes, { ...actual, ...patch } as never)).toThrow()
  })
  it("rejects reason-v1 even when every actual terminal identity matches", () => {
    const { actual, bytes } = fixture(), v = JSON.parse(Buffer.from(bytes).toString())
    const { resourceSamplingOperation: _operation, resourceSamplingSequence: _sequence, resourceSamplingExitObserved: _exit, ...observations } = v.observations
    const { root: _root, ...body } = { ...v, schemaVersion: "lean-parent-supervisor-reasons-v1", observations }
    expect(() => assertLeanSupervisorReasonCustodyV2(leanCanonicalBytes({ ...body, root: labRoot("lean-parent-supervisor-reasons-v1", body) }), actual)).toThrow()
  })
})
describe("selected retry baseline authority owner", () => {
  it("v11 source publication authority uses one audited closure and rejects cross-pair FINAL", () => {
    const b = LEAN_TWO_PAIR_V11_EXTENSION, check = { root: root("v11-check"), allocationRoot: root("v11-diag"), readerCloseMs: b.startedAtMs + 1 }
    const closure = { timeboxExtension: b, attemptOrdinal: 1, closureClass: "accepted", checkRoot: check.root, allocationRoot: check.allocationRoot, root: root("v11-FINAL"), readerCloseMs: check.readerCloseMs, finalReaderClose: true, acceptedCheckAbsent: false, sourceRoot: root("v11-source"), head: "a".repeat(40) }
    const allocation = { timeboxExtension: b, schemaVersion: "lean-correction-supervisor-baseline-allocation-v8", attemptOrdinal: 1, acceptedCheckRoot: check.root, acceptedReaderCloseRoot: closure.root, sourceRoot: closure.sourceRoot } as Parameters<typeof assertLeanRetryBaselineJoinV8>[0]
    expect(() => assertLeanRetryBaselineJoinV8(allocation, check, closure, "b".repeat(40))).not.toThrow()
    for (const change of [{ attemptOrdinal: 2 }, { timeboxExtension: { ...b, startedAtMs: b.startedAtMs + 1 } }, { finalReaderClose: false }, { checkRoot: root("other-pair") }]) expect(() => assertLeanRetryBaselineJoinV8(allocation, check, { ...closure, ...change } as never, "b".repeat(40))).toThrow()
    const source = readFileSync("scripts/lib/v1-38-lean-baseline-retained.ts", "utf8")
    expect(source).toContain("isLeanTwoPairMode(mode) ? authenticateLeanTwoPairAcceptedJoinV11(mode)")
    expect(source).toContain("assertLeanRetryBaselineJoinV8(allocation, check, closure, head)")
  })
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
const completeFixture = async (outcomeForSlot: (ordinal: number, entrantSeat: "bottom" | "top") => "bottom" | "top" | "DRAW" = () => "DRAW", continuation = false, allocationOverride?: any): Promise<LeanBaselineRetainedSnapshot> => {
  const base = continuation ? continuationFixtureBase() : fixture(), allocation = allocationOverride ?? base.allocation, corpus = buildLeanColdCorpus(allocation.seed)
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
  const records = allocation.slots.map((slot: import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanSlot) => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: null as LabRoot | null, terminal: null as Record<string, unknown> | null, status: "unused" }))
  const pipelineModule = await import("./v1-38-lean-baseline-pipeline.js")
  const execute: (input: any) => Promise<any> = allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" ? pipelineModule.executeLeanBaselineContinuationPipelineV2 : continuation ? pipelineModule.executeLeanBaselineContinuationPipeline : executeLeanCurrentPipeline
  const pipeline = await execute({ allocation: allocation as never, ...(allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" ? { heldHead: "a".repeat(40) } : {}), freezeSource: (source: LeanBaselineSource) => { sources.push(source) }, retainArtifact: (name: string, value: unknown) => { artifacts[name] = value }, checkpoint() {}, async dispatch(slot: import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanSlot, bottom: LeanBaselineSource, top: LeanBaselineSource) {
    const prior = Buffer.from(ledgerEvents.map(event => Buffer.from(leanCanonicalBytes(event)).toString("utf8") + "\n").join(""))
    const pairBody = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: slot.ordinal, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: leanBytesRoot(prior), priorLedgerByteLength: prior.length, priorCharged: allocation.predecessor.chargedMatches + slot.ordinal, bottomRole: bottom.role, bottomSourceRoot: bottom.sourceRoot, bottomSnapshotRoot: bottom.root, topRole: top.role, topSourceRoot: top.sourceRoot, topSnapshotRoot: top.root }
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
  const evidence = { ...base.evidence, records, charged: allocation.predecessor.chargedMatches + 36, elapsedMs: allocation.predecessor.elapsedUpperBoundMs + 100, root: root("complete-evidence") }
  const frontier = (ordinal: number, after: boolean) => {
    const remainingSlots = 36 - ordinal - Number(after), anchor = "window" in allocation ? allocation.window.anchorMs : continuationLedger.LEAN_BASELINE_CONTINUATION_WINDOW.anchorMs, body = { nowMs: anchor + 200 + ordinal * 2 + Number(after), monotonicElapsedMs: 200 + ordinal * 2 + Number(after), remainingSlots, charged: allocation.predecessor.chargedMatches + ordinal + Number(after), retainedBytes: allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" ? 100000000 : 1000000, scratchBytes: 1000, parentRssBytes: 100000000, childRssBytes: 100000000, arrayBuffersBytes: 1000, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true }
    return allocation.schemaVersion === "lean-baseline-continuation-allocation-v2" && remainingSlots === 0 ? { ...body, remainingClosureMs: 0, remainingOfflineMs: 0 } : body
  }
  const resourceReceipts = (records as Array<{ chargeRoot: LabRoot | null }>).map((row, ordinal) => ({ ordinal, chargeRoot: row.chargeRoot, before: frontier(ordinal, false), after: frontier(ordinal, true) }))
  const v2 = allocation.schemaVersion === "lean-baseline-continuation-allocation-v2"
  const result = { ...base.result, ...(v2 ? { schemaVersion: "lean-baseline-continuation-result-v2", allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, sourceHead: allocation.sourceHead, windowRoot: allocation.window.root, windowBytesRoot: allocation.windowBytesRoot, sourceGateRoot: allocation.sourceGateRoot, dataReviewRoot: allocation.dataReviewRoot, manifestRoot: allocation.manifestRoot, elapsedMs: evidence.elapsedMs } : {}), pipeline, evidenceRoot: evidence.root, charged: evidence.charged, successful: 36, status: "pending_independent_verification", ...(continuation || v2 ? { unusedOrdinals: [], resourceReceipts, planningRoot: allocation.planningRoot, holdoutReservations: allocation.holdoutReservations, failure: null, sourceAuthor: v2 ? "/root/cowards-game/authors/source-owner" : base.request.sourceAuthor, runOperator: v2 ? "/root/cowards-game/operators/runner" : base.request.runOperator } : {}) }
  const time = v2 ? { elapsedMs: allocation.predecessor.elapsedUpperBoundMs + 2000, active: false, starts: new Map([["continuation-run-admission", allocation.window.anchorMs + 50], ["pilot-entry", allocation.window.anchorMs + 100], ["continuation-retained-verifier-v2", allocation.window.anchorMs + 1200]]), closes: new Map([["continuation-run-admission", allocation.window.anchorMs + 99], ["pilot-entry", allocation.window.anchorMs + 1100], ["continuation-retained-verifier-v2", allocation.window.anchorMs + 2000]]), closed: new Set(["continuation-run-admission", "pilot-entry", "continuation-retained-verifier-v2"]) } : base.time
  const entry = v2 ? { ...base.entry, allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, requestBytesRoot: allocation.requestBytesRoot, head: "a".repeat(40), wallStartMs: allocation.window.anchorMs + 100 } : base.entry
  const terminal = v2 ? { ...base.terminal, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, head: "a".repeat(40), wallObservedMs: allocation.window.anchorMs + 1100 } : base.terminal
  return { ...base, ...(v2 ? { allocation, requestBytesRoot: allocation.requestBytesRoot, head: "a".repeat(40), entry, terminal, time } : {}), sources, artifacts, pairs: pairs as LeanBaselineRetainedSnapshot["pairs"], observations: observations as LeanBaselineRetainedSnapshot["observations"], ledgerEvents: ledgerEvents as LeanBaselineRetainedSnapshot["ledgerEvents"], evidence: evidence as LeanBaselineRetainedSnapshot["evidence"], result } as unknown as LeanBaselineRetainedSnapshot
}

/** All objects remain inert, in-memory fixture data. */
const continuationFixtureBase = (): LeanBaselineRetainedSnapshot => {
  const base = structuredClone(fixture()) as any, old = base.allocation
  const carry = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 459375903 as const, allocatedDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: root("custody"), inventoryRoot: root("inventory"), qualifiedReaderAuthority: "cost_only" as const }
  const request = { schemaVersion: "lean-baseline-continuation-request-v1", seed: old.seed, sourceHead: "b".repeat(40), sourceRoot: old.sourceRoot, planningRoot: root("planning"), planRoot: old.planRoot, reviewRoot: old.reviewRoot, coldRoot: old.coldRoot, candidateRoots: old.candidateRoots, requestRoots: old.requestRoots, offlineOverheadMs: 60000, sourceAuthor: "fixture-author", runOperator: "fixture-run", readerOperator: "fixture-reader" }
  const { schemaVersion: _schema, sourceAuthor: _author, runOperator: _operator, readerOperator: _reader, ...allocationInput } = request
  request.candidateRoots = [...request.candidateRoots].sort().reverse()
  const a = continuationLedger.createLeanBaselineContinuationAllocation({ ...allocationInput, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), predecessor: { ...carry, root: labRoot(carry.schemaVersion, carry) } })
  base.allocation = a; base.request = request; base.requestBytesRoot = a.requestBytesRoot
  const start = a.window.anchorMs + 100
  base.entry = { ...base.entry, allocationRoot: a.root, requestBytesRoot: a.requestBytesRoot, wallStartMs: start }
  base.terminal = { ...base.terminal, allocationRoot: a.root, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(base.entry)), wallObservedMs: start + 1000 }
  base.time = { elapsedMs: a.predecessor.elapsedUpperBoundMs + 2000, closedElapsedMs: a.predecessor.elapsedUpperBoundMs + 2000, active: false, starts: new Map([["continuation-run-admission", start - 100], ["pilot-entry", start], ["continuation-retained-verifier", start + 1100]]), closes: new Map([["continuation-run-admission", start - 1], ["pilot-entry", start + 1000], ["continuation-retained-verifier", start + 1900]]), closed: new Set(["continuation-run-admission", "pilot-entry", "continuation-retained-verifier"]) }
  base.result = { ...base.result, schemaVersion: "lean-baseline-continuation-result-v1", allocationRoot: a.root, requestBytesRoot: a.requestBytesRoot, elapsedMs: a.predecessor.elapsedUpperBoundMs + 100, planningRoot: a.planningRoot, unusedOrdinals: [], holdoutReservations: a.holdoutReservations, failure: null, sourceAuthor: request.sourceAuthor, runOperator: request.runOperator }
  return base
}

describe("continuation full retained reconstruction", () => {
  it("binds recomputed surrounding roots to the frozen charged terminal and refuses legacy fallback", () => {
    const s = { ...continuationFixtureBase() }, a = s.allocation as unknown as continuationLedger.LeanBaselineContinuationAllocation
    const failed = failedFirstCell("system_failure", "SUPERVISOR_FAILURE", null, true)
    const oldPair = s.pairs[0]!, slot = a.slots[0]!
    const { root: _pairRoot, ...pairBody } = { ...oldPair, slotRoot: slot.root, requestRoot: slot.requestRoot, priorCharged: 43 }
    const pair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }
    const chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: a.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...chargeBody, root: labRoot("lean-slot-charge-v1", chargeBody) }
    const canonicalCompact = failed.observations[0]!.cell.compact
    const seven = { schemaVersion: "lean-supervisor-diagnostic-v1", chargeRoot: charge.root, stage: "native_response", reason: "executor", code: "SUBPROCESS_EXIT", method: "selectActivations", ordinal: 0 }
    const extensionBody = { schemaVersion: "lean-continuation-executor-diagnostic-v1", availability: "available", originAvailability: "available", allocationRoot: a.root, chargeRoot: charge.root, accountingRoot: canonicalCompact.accountingRoot, executionRoot: canonicalCompact.executionRoot, sourceRoot: pair.bottomSourceRoot, executableRoot: root("executable"), invocationRoot: root("invocation"), requestIdRoot: root("request"), inputRoot: root("input"), method: seven.method, ordinal: seven.ordinal, stage: "executor", reason: "response_status_null", code: seven.code, initiatingCause: "unknown" }
    const extension = { ...extensionBody, root: labRoot(extensionBody.schemaVersion, extensionBody) }
    const commit = (diagnostic: Record<string, unknown>) => {
      const body = { schemaVersion: "lean-continuation-failure-accounting-v1", canonicalAccountingRoot: canonicalCompact.accountingRoot, executionRoot: canonicalCompact.executionRoot, diagnosticRoot: labRoot("lean-continuation-failure-diagnostic-v1", diagnostic) }
      return { ...diagnostic, failureAccounting: { ...body, root: labRoot(body.schemaVersion, body) } }
    }
    const genuine = commit({ ...seven, continuationExecutor: extension })
    const compact = Object.freeze({ ...canonicalCompact, accountingRoot: genuine.failureAccounting.root })
    const terminal = { kind: "terminal" as const, chargeRoot: charge.root, record: compact, replay: null }
    const unused = Array.from({ length: 35 }, (_, i) => i + 1)
    s.pairs = [pair]
    s.ledgerEvents = [{ kind: "charge", charge }, terminal, { kind: "stop", reason: "failure" }]
    s.evidence = { ...s.evidence, charged: 44, elapsedMs: a.predecessor.elapsedUpperBoundMs + 100, records: a.slots.map((slot, i) => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: i === 0 ? charge.root : null, terminal: i === 0 ? terminal : null, status: i === 0 ? "system_failure" : "unused" })) }
    const before = { nowMs: a.window.anchorMs + 200, monotonicElapsedMs: 200, remainingSlots: 36, charged: 43, retainedBytes: 1000000, scratchBytes: 0, parentRssBytes: 100000000, childRssBytes: 100000000, arrayBuffersBytes: 1000, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true }
    s.result = { ...s.result, charged: 44, successful: 0, unusedOrdinals: unused, resourceReceipts: [{ ordinal: 0, chargeRoot: charge.root, before, after: { ...before, nowMs: before.nowMs + 1, monotonicElapsedMs: 201, remainingSlots: 35, charged: 44 } }] }
    const reroot = (diagnostic: unknown) => {
      const cell = { ...failed.observations[0]!.cell, compact, slotRoot: slot.root, diagnostic } as LeanBaselineObservedCell
      const receiptBody = { schemaVersion: "lean-baseline-observation-v1" as const, pairRoot: pair.root, cell }
      s.observations = [{ ...receiptBody, root: labRoot(receiptBody.schemaVersion, receiptBody) }]
      const { root: _pipelineRoot, ...pipeline } = failed.result.pipeline as Record<string, unknown>
      const body = { ...pipeline, cells: [compactLeanBaselineCell(cell)], unusedOrdinals: unused, holdoutReservations: a.holdoutReservations }
      s.result.pipeline = { ...body, root: labRoot("lean-baseline-continuation-pipeline-v1", body) }
      return s as unknown as continuationReader.LeanBaselineContinuationRetainedSnapshot
    }
    expect(continuationReader.auditLeanBaselineContinuationRetained(reroot(genuine))).toMatchObject({ complete: false, disposition: "gaps_found" })
    for (const removed of [null, seven, { ...seven, continuationExecutor: extension }, commit(seven), commit({ ...seven, code: null, method: null, ordinal: null, stage: "unknown", reason: "unknown" })]) {
      expect(() => continuationReader.auditLeanBaselineContinuationRetained(reroot(removed))).toThrow(/CONTINUATION_EXECUTOR/)
    }
    for (const patch of [{ invocationRoot: root("cross-call") }, { requestIdRoot: root("cross-request") }, { inputRoot: root("cross-input") }, { executableRoot: root("cross-executable") }, { sourceRoot: pair.topSourceRoot }, { method: "soldierBrain" }, { ordinal: 1 }, { reason: "response_status_nonzero" }, { chargeRoot: root("cross-call") }, { sourceRoot: root("foreign-source") }, { rawError: "PRIVATE" }]) {
      const { root: _root, ...body } = { ...extension, ...patch }
      // Recompute every mutable surrounding root and coordinate adjacent fields;
      // the independently charged terminal's accounting/execution roots stay fixed.
      expect(() => continuationReader.auditLeanBaselineContinuationRetained(reroot(commit({ ...seven, method: body.method, ordinal: body.ordinal, continuationExecutor: { ...body, root: labRoot(body.schemaVersion, body) } })))).toThrow(/CONTINUATION_EXECUTOR/)
    }
    for (const patch of [{ code: "SUBPROCESS_SIGNAL" }, { stage: "unknown", reason: "unknown" }, { reason: "system_failure" }]) expect(() => continuationReader.auditLeanBaselineContinuationRetained(reroot(commit({ ...seven, ...patch, continuationExecutor: extension })))).toThrow(/CONTINUATION_EXECUTOR/)
    expect(compact.accountingRoot).toBe(genuine.failureAccounting.root)
    expect(compact.executionRoot).toBe(canonicalCompact.executionRoot)
  })
  it("publishes one honest failure after persistent planning drift, or finitely refuses unsafe publication", () => {
    const allocation = continuationFixtureBase().allocation
    const fakeLedger = { allocation, directory: "inert-only" } as never
    const guard = () => { throw new TypeError("LEAN_BASELINE_CONTINUATION_PIN_CHANGED") }
    const state = vi.spyOn(continuationLedger, "readLeanLedger").mockReturnValue({ charged: 43, charges: new Map() } as never)
    const elapsed = vi.spyOn(continuationLedger, "currentLeanElapsedMs").mockReturnValue(459376903)
    const physical = vi.spyOn(continuationLedger, "cumulativeLeanPhysicalBytes").mockReturnValue(4096)
    const clock = vi.spyOn(Date, "now").mockReturnValue(continuationLedger.LEAN_BASELINE_CONTINUATION_WINDOW.anchorMs + 1000)
    const time = vi.spyOn(continuationLedger, "readLeanTimeAccounting").mockReturnValue({ active: false, starts: new Map([["continuation-retained-verifier", 1]]), closed: new Set(["continuation-retained-verifier"]) } as never)
    let record: any
    const publish = vi.fn((_ledger: unknown, _name: string, value: unknown) => { if (record) throw new Error("EEXIST"); record = value })
    try {
      const safe = vi.fn()
      const result = continuationReader.publishLeanContinuationRetainedCheck(fakeLedger, undefined, null, guard, safe, publish)
      expect(result).toMatchObject({ disposition: "gaps_found", failure: "LEAN_BASELINE_CONTINUATION_PIN_CHANGED", sourceHoldFailure: "LEAN_BASELINE_CONTINUATION_PIN_CHANGED", report: null, currentCharged: 0, unusedOrdinals: Array.from({ length: 36 }, (_, n) => n) })
      expect(safe).toHaveBeenCalledTimes(2)
      expect(() => continuationReader.publishLeanContinuationRetainedCheck(fakeLedger, undefined, null, guard, safe, publish)).toThrow(/TERMINAL_REFUSAL/)
      const forbiddenWrite = vi.fn()
      expect(() => continuationReader.publishLeanContinuationRetainedCheck(fakeLedger, undefined, null, guard, () => { throw new Error("CAPACITY") }, forbiddenWrite)).toThrow(/TERMINAL_REFUSAL/)
      expect(forbiddenWrite).not.toHaveBeenCalled()
      const scope = vi.spyOn(continuationEntry, "assertLeanBaselineContinuationScope").mockImplementation(() => {})
      const open = vi.spyOn(continuationLedger, "openLeanLedger").mockReturnValue(fakeLedger)
      const ipc = Object.fromEntries(["send", "connected"].map(key => [key, Object.getOwnPropertyDescriptor(process, key)!]))
      Object.defineProperties(process, { send: { value: undefined, configurable: true }, connected: { value: false, configurable: true } })
      try { expect(() => continuationReader.verifyLeanBaselineContinuationRetained(continuationLedger.LEAN_BASELINE_CONTINUATION_PATHS.request)).toThrow(/CONTINUATION_READER_USED/) }
      finally { Object.defineProperties(process, ipc); scope.mockRestore(); open.mockRestore() }
    } finally { state.mockRestore(); elapsed.mockRestore(); physical.mockRestore(); clock.mockRestore(); time.mockRestore() }
  })
  it("rebuilds all 36 cells and real work, and denies mutated roots, grants, receipts and reader identities", async () => {
    const s = await completeFixture(() => "DRAW", true)
    expect(s.result.sourceAuthor).toBe(s.request.sourceAuthor)
    expect(s.result.runOperator).toBe(s.request.runOperator)
    const audit = (v: unknown) => continuationReader.auditLeanBaselineContinuationRetained(v as never)
    expect(audit(s)).toMatchObject({ complete: true, charged: 79, currentCharged: 36, disposition: "passed", unusedOrdinals: [], historicalMemoryPeaks: "unknown" })
    const mutations: Array<(v: any) => void> = [
      v => { v.pairs[0].priorLedgerBytesRoot = root("changed") },
      v => { v.observations[4].cell.decisionRoot = root("changed") },
      v => { v.artifacts["response-node-receipts.json"].pop() },
      v => { v.artifacts["work-accounting.json"].actual.responseNodes += 1; v.artifacts["work-accounting.json"].actual.total = 320 },
      v => { v.result.planningRoot = root("changed") },
      v => { v.request.readerOperator = v.request.runOperator },
      v => { v.time.starts.delete("continuation-retained-verifier") },
      v => { v.time.closed.delete("continuation-run-admission") },
      v => { v.time.closes.set("continuation-retained-verifier", v.allocation.window.deadlineMs + 1) },
      v => { v.allocation.slots.push(v.allocation.slots[0]) },
      v => { v.result.pipeline.response.admitted = true },
      v => { v.result.resourceReceipts.pop() },
      v => { v.result.resourceReceipts[0].after.childRssBytes = 3000000000 },
      v => { v.sources[0].source = "forged" },
    ]
    for (const [index, mutate] of mutations.entries()) { const v = structuredClone(s); mutate(v); expect(() => audit(v), `mutation ${index}`).toThrow() }
  }, 60000)
})

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
