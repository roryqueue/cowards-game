/** Native authority source tests; no provider or empirical Match is launched. */
import { mkdtempSync, writeFileSync, rmSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { leanBytesRoot, leanCanonicalBytes, type LeanCharge, type LeanExperimentLedger } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { claimLeanRuntimeAuthority, issueLeanBaselineRuntimeAuthority, issueLeanCorrectionRuntimeAuthority, isLeanCorrectionRuntimeAuthority, type LeanBaselinePair } from "./v1-38-lean-experiment-authority.js"
import * as reuseIO from "./v1-38-lean-baseline-reuse.js"
import type { LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import * as authorityIO from "./v1-38-lean-experiment-authority.js"
import * as leanIO from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as sourceIO from "./v1-38-lean-baseline-source.js"
import { buildLeanStartupWorkerHarnessV8 } from "./v1-38-lean-container-match-session.js"
import * as continuationIO from "./v1-38-lean-baseline-continuation.js"
import * as fs from "node:fs"
import { resolve, dirname } from "node:path"

const retained = vi.hoisted(() => ({ state: {} as unknown, real: false }))
vi.mock("../../packages/strategy-lab/src/league/lean-experiment.js", async importOriginal => { const original = await importOriginal<typeof import("../../packages/strategy-lab/src/league/lean-experiment.js")>(); return { ...original, readLeanLedger: (ledger: leanIO.LeanExperimentLedger) => retained.real ? original.readLeanLedger(ledger) : retained.state } })
const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach(directory => rmSync(directory, { recursive: true, force: true })))
let index = 0
const fixture = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-authority-source-test-"))); dirs.push(directory)
  const coldRoot = labRoot("source-only-cold", 1), implementationRoot = labRoot("source-only-code", 1)
  const source = buildLeanBaselineSource({ coldRoot, implementationRoot, role: "final-response", source: buildPlannerCandidate().source })
  writeFileSync(join(directory, `source-${source.role}.json`), leanCanonicalBytes(source), { mode: 0o600, flag: "wx" })
  const allocationRoot = labRoot("source-only-allocation", index++)
  const slot = { ordinal: 0, root: labRoot("source-only-slot", allocationRoot), requestRoot: labRoot("source-only-request", allocationRoot) }
  const ledger = { directory, allocation: { schemaVersion: "lean-current-baseline-allocation-v1", root: allocationRoot, coldRoot, sourceRoot: implementationRoot, predecessor: { chargedMatches: 9 }, slots: [slot] } } as unknown as LeanExperimentLedger
  const charge = { ordinal: 0, slotRoot: slot.root, root: labRoot("source-only-charge", allocationRoot) } as LeanCharge
  const journal = Buffer.from(`${JSON.stringify({ kind: "charge", charge })}\n`)
  writeFileSync(join(directory, "ledger.ndjson"), journal, { mode: 0o600, flag: "wx" })
  retained.state = { charges: new Map([[charge.slotRoot, charge]]), terminals: new Map(), stopped: false }
  const pairBody = { schemaVersion: "lean-baseline-pair-v1" as const, ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorLedgerBytesRoot: leanBytesRoot(Buffer.alloc(0)), priorLedgerByteLength: 0, priorCharged: 9,
    bottomRole: source.role, bottomSourceRoot: source.sourceRoot, bottomSnapshotRoot: source.root, topRole: source.role, topSourceRoot: source.sourceRoot, topSnapshotRoot: source.root }
  const pair: LeanBaselinePair = { ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }
  const pairPath = join(directory, "pair-0.json")
  writeFileSync(pairPath, leanCanonicalBytes(pair), { mode: 0o600, flag: "wx" })
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes: new TextEncoder().encode(source.source) }), validation: source.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact!.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  const binding = { budgetRoot: allocationRoot, attemptRoot: charge.root, matchId: `lean-${charge.root.slice(7, 31)}`, containerName: `lean-${charge.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${allocationRoot.slice(7, 25)}`, seat: "bottom" as const, runtime }
  return { ledger, charge, source, pair, pairPath, journal, binding }
}
const authorityWindow = (a: { sourceRoot: leanIO.LeanBaselineContinuationWindowV2["sourceRoot"]; planRoot?: leanIO.LeanBaselineContinuationWindowV2["planRoot"]; sourceGateRoot?: leanIO.LeanBaselineContinuationWindowV2["sourceGateRoot"] }, routeNamespace: "20261012-v3" | "20261012-v4" | "20261017-v9" = "20261012-v3") => {
  const r = (s: string) => labRoot("inert-authority-window", s)
  const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-grant", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1791840227000, anchorMs: 1791840227000, carryMs: 492285903, capMs: 521085903, deadlineMs: 1791869027000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace, reviewedSourceHead: "a".repeat(40), sourceRoot: a.sourceRoot, sourceGateRoot: a.sourceGateRoot ?? r("source-gate"), planRoot: a.planRoot ?? r("plan"), runOperator: "inert-runner", readerOperator: "inert-reader" }
  const selected = routeNamespace === "20261017-v9" ? { ...body, approvedAtMs: 1792198286000, anchorMs: 1792198286001, carryMs: leanIO.leanContinuationGlobalFloorV2(1792198286001), capMs: leanIO.leanContinuationGlobalFloorV2(1792198286001) + 28800000, deadlineMs: 1792198286001 + 28800000, approvalEvidence: { ...body.approvalEvidence, humanDecisionId: "human-approval-observed-20261017T005126Z" } } : body
  return { ...selected, root: labRoot(selected.schemaVersion, selected) }
}
describe("[continuation-v4] connected opaque issuer with actual descriptors", () => {
  const connected = (namespace: "20261012-v3" | "20261012-v4" | "20261017-v9", run: (f: ReturnType<typeof fixture>, a: leanIO.LeanBaselineContinuationAllocationV2, claimPath: string, guard: () => void) => void) => {
    const f = fixture(), cwd = vi.spyOn(process, "cwd").mockReturnValue(f.ledger.directory)
    try {
      const r = (s: unknown) => labRoot("inert-connected-authority", [f.charge.root, s]), w = authorityWindow(f.ledger.allocation, namespace)
      const predecessorBody = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: r("original"), closedCapsuleRoot: r("closed"), custodyRoot: r("custody"), inventoryRoot: r("inventory"), qualifiedReaderAuthority: "cost_only" as const }
      const a = leanIO.createLeanBaselineContinuationAllocationV2({ sourceRoot: f.ledger.allocation.sourceRoot, reviewRoot: r("review"), coldRoot: (f.ledger.allocation as any).coldRoot, planRoot: w.planRoot, candidateRoots: [r("candidate-a"), r("candidate-b")], requestRoots: Array.from({ length: 36 }, (_, i) => r(i)), seed: "inert-authority-route", sourceHead: "b".repeat(40), planningRoot: r("planning"), manifestRoot: r("manifest"), requestBytesRoot: r("request"), window: w, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(w)), sourceGateRoot: w.sourceGateRoot, dataReviewRoot: r("data"), predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) } })
      f.ledger.allocation = a
      if (namespace === "20261017-v9") { retained.real = true; writeFileSync(join(f.ledger.directory, "allocation.json"), leanCanonicalBytes(a), { mode: 0o600 }) }
      const slot = a.slots[0]!, chargeBody = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: a.root, slotRoot: slot.root, ordinal: 0 }
      f.charge = { ...chargeBody, root: labRoot(chargeBody.schemaVersion, chargeBody) }
      f.binding = { ...f.binding, budgetRoot: a.root, attemptRoot: f.charge.root, matchId: `lean-${f.charge.root.slice(7, 31)}`, containerName: `lean-${f.charge.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${a.root.slice(7, 25)}` }
      retained.state = { charges: new Map([[slot.root, f.charge]]), terminals: new Map(), stopped: false }
      writeFileSync(join(f.ledger.directory, "ledger.ndjson"), Buffer.concat([leanCanonicalBytes({ kind: "charge", charge: f.charge }), Buffer.from("\n")]))
      const { root: _, ...pairBody } = { ...f.pair, slotRoot: slot.root, requestRoot: slot.requestRoot, priorCharged: 50 }
      writeFileSync(f.pairPath, leanCanonicalBytes({ ...pairBody, root: labRoot(pairBody.schemaVersion, pairBody) }))
      const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot, head: "c".repeat(40), parentPid: 1, childPid: 2, handshakeRoot: r("handshake"), wallStartMs: w.anchorMs, monotonicStartNs: "1" }
      writeFileSync(join(f.ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 })
      const publication = { schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: a.root, sourceHead: a.sourceHead, head: entry.head, implementationRoot: a.sourceRoot, coldRoot: a.coldRoot, role: f.source.role, snapshotRoot: f.source.root, sourceRoot: f.source.sourceRoot, windowRoot: w.root, windowBytesRoot: a.windowBytesRoot, requestBytesRoot: a.requestBytesRoot, dataReviewRoot: a.dataReviewRoot }
      writeFileSync(join(f.ledger.directory, `publication-${f.source.role}-continuation-v2.json`), leanCanonicalBytes({ ...publication, root: labRoot(publication.schemaVersion, publication) }), { mode: 0o600 })
      const p = leanIO.leanBaselineContinuationPathsForWindowV2(w), claimPath = resolve(p.claim)
      fs.mkdirSync(dirname(claimPath), { recursive: true, mode: 0o700 })
      const body = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: w.grantId, routeNamespace: w.routeNamespace, windowRoot: w.root, windowBytesRoot: a.windowBytesRoot, requestBytesRoot: a.requestBytesRoot, sourceHead: a.sourceHead, sourceRoot: a.sourceRoot, sourceGateRoot: a.sourceGateRoot, dataReviewRoot: a.dataReviewRoot, planningRoot: a.planningRoot, manifestRoot: a.manifestRoot }
      writeFileSync(claimPath, leanCanonicalBytes({ ...body, root: labRoot(body.schemaVersion, body) }), { mode: 0o600 })
      const guard = vi.fn()
      run(f, a, claimPath, guard)
    } finally { retained.real = false; cwd.mockRestore() }
  }
  it.each(["valid", "legacy", "factory", "planner", "session"] as const)("continuation-route-v9-authority real descriptors/ledger wireV8 and per-layer irreversible burn: %s", mode => connected("20261017-v9", (f, a, path, guard) => {
    expect(a.window.routeNamespace).toBe("20261017-v9")
    if (mode === "legacy") {
      const old = resolve(leanIO.LEAN_BASELINE_CONTINUATION_PATHS_V8.claim); fs.mkdirSync(dirname(old), { recursive: true, mode: 0o700 }); fs.renameSync(path, old)
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
      fs.renameSync(old, path); expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow(); return
    }
    const auth = authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)
    expect(() => JSON.stringify(auth)).toThrow(); expect(() => authorityIO.claimLeanStartupAuthorityV8({ ...auth }, f.binding, "factory")).toThrow()
    for (const layer of ["factory", "planner", "session"] as const) {
      if (mode === layer) {
        vi.mocked(guard).mockImplementationOnce(() => { throw new Error("fresh resource denial") })
        expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, layer)).toThrow("fresh resource denial")
        expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, layer)).toThrow(); break
      }
      const grant = authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, layer)
      expect(grant.startup).toMatchObject({ version: 8, allocationRoot: a.root, chargeRoot: f.charge.root })
    }
  }))
  it.each(["20261012-v3", "20261012-v4"] as const)("issues only the actual %s claim and reobserves every ordered opaque seat", namespace => connected(namespace, (f, _a, _path, guard) => {
    const auth = authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)
    expect(() => JSON.stringify(auth)).toThrow()
    expect(() => authorityIO.claimLeanStartupAuthorityV8({ ...auth }, f.binding, "factory")).toThrow()
    expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "session")).toThrow()
    for (const layer of ["factory", "planner", "session"] as const) { const before = vi.mocked(guard).mock.calls.length; authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, layer); expect(vi.mocked(guard).mock.calls.length).toBeGreaterThan(before) }
    expect(guard).toHaveBeenCalled(); expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "session")).toThrow()
    expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
  }))
  it.each(["routeNamespace", "windowRoot", "grantId", "sourceRoot", "requestBytesRoot", "root"] as const)("denies mutated %s claim and burns issuance without refund", field => connected("20261012-v4", (f, _a, path, guard) => {
    const claim = JSON.parse(fs.readFileSync(path, "utf8")) as Record<string, unknown>, { root: _, ...body } = { ...claim, [field]: field === "routeNamespace" ? "20261012-v3" : field === "grantId" ? "spent-grant" : labRoot("wrong", field) }
    writeFileSync(path, leanCanonicalBytes({ ...body, root: field === "root" ? labRoot("wrong", field) : labRoot(String(body.schemaVersion), body) }))
    expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
    expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
  }))
  it("never falls back to a V3 claim and burns a changed survivor claim", () => {
    connected("20261012-v4", (f, _a, path, guard) => {
      const oldPath = resolve(leanIO.LEAN_BASELINE_CONTINUATION_PATHS_V2.claim); fs.mkdirSync(dirname(oldPath), { recursive: true, mode: 0o700 }); fs.renameSync(path, oldPath)
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
    })
    connected("20261012-v4", (f, _a, path, guard) => {
      const auth = authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)
      authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "factory")
      fs.chmodSync(path, 0o644); expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")).toThrow()
      fs.chmodSync(path, 0o600); expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")).toThrow()
    })
  })
  it("keeps the unchanged full36 deadline refusal and spent seat after a resource denial", () => connected("20261012-v4", (f, a) => {
    const w = a.window, nowMs = w.deadlineMs - 36 * leanIO.LEAN_CAPS.matchMs - w.closureMs - w.offlineOverheadMs + 1
    const guard = () => continuationIO.assertLeanBaselineContinuationFrontierV2(a, { nowMs, monotonicElapsedMs: nowMs - w.anchorMs, remainingSlots: 36, charged: 51, retainedBytes: a.predecessor.allocatedDiskBytes, scratchBytes: 0, parentRssBytes: 0, childRssBytes: 0, arrayBuffersBytes: 0, availableMemoryBytes: 4000000000, freeBytes: 16000000000, live: true })
    expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow(/CAPACITY/)
    expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, () => {})).toThrow()
  }))
})
describe("distinct baseline runtime authority", () => {
  it("[continuation-v2] burns refused issuance and rejects a V1 allocation", () => {
    const f = fixture(), a = f.ledger.allocation as any
    expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, () => {})).toThrow()
    a.schemaVersion = "lean-baseline-continuation-allocation-v2"
    const validate = vi.spyOn(leanIO, "validateLeanBaselineContinuationAllocationV2").mockReturnValue(a)
    const guard = vi.fn(() => { throw new Error("INERT_FULL_GUARD_DENIED") })
    try {
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow("INERT_FULL_GUARD_DENIED")
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, () => {})).toThrow()
    } finally { validate.mockRestore() }
  })
  it.each(["valid", "wrong-request", "wrong-grant", "wrong-publication", "wrong-source", "wrong-seat"] as const)("[continuation-v2] opaque V8 issuance and exact joins: %s", mode => {
    const f = fixture(), a = f.ledger.allocation as any, root = (s: string) => labRoot("inert-v2-authority", s)
    Object.assign(a, { schemaVersion: "lean-baseline-continuation-allocation-v2", sourceHead: "b".repeat(40), requestBytesRoot: root("request"), planningRoot: root("planning"), manifestRoot: root("manifest"), sourceGateRoot: root("source-gate"), dataReviewRoot: root("data-review"), windowBytesRoot: root("window-bytes"), window: { root: root("window"), grantId: "inert-grant", routeNamespace: "20261012-v3" }, predecessor: { chargedMatches: 50 } })
    a.window = authorityWindow(a)
    const pairBody = { ...f.pair, priorCharged: 50 }; const { root: _, ...pb } = pairBody, pair = { ...pb, root: labRoot("lean-baseline-pair-v1", pb) }
    writeFileSync(f.pairPath, leanCanonicalBytes(pair))
    const claimBody = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: a.window.grantId, routeNamespace: a.window.routeNamespace, windowRoot: a.window.root, windowBytesRoot: a.windowBytesRoot, requestBytesRoot: a.requestBytesRoot, sourceHead: a.sourceHead, sourceRoot: a.sourceRoot, sourceGateRoot: a.sourceGateRoot, dataReviewRoot: a.dataReviewRoot, planningRoot: a.planningRoot, manifestRoot: a.manifestRoot }
    const claim = { ...claimBody, root: labRoot(claimBody.schemaVersion, claimBody) }
    const validate = vi.spyOn(leanIO, "validateLeanBaselineContinuationAllocationV2").mockReturnValue(a)
    const entry = vi.spyOn(leanIO, "readLeanChildEntry").mockReturnValue({ head: "a".repeat(40), sourceRoot: a.sourceRoot, allocationRoot: a.root, requestBytesRoot: a.requestBytesRoot } as any)
    const read = vi.spyOn(continuationIO, "readLeanContinuationJsonV2").mockImplementation((path, _maximum, _mode, guard) => {
      guard?.(2)
      if (path === leanIO.LEAN_BASELINE_CONTINUATION_PATHS_V2.claim) {
        if (mode === "wrong-request" || mode === "wrong-grant") { const { root: _, ...body } = { ...claim, ...(mode === "wrong-request" ? { requestBytesRoot: root("other-request") } : { grantId: "other-grant" }) }; return { ...body, root: labRoot(body.schemaVersion, body) } }
        return claim
      }
      if (path === f.pairPath) return pair
      if (path.endsWith(`source-${f.source.role}.json`)) return f.source as any
      const body = { schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: a.root, sourceHead: a.sourceHead, head: "a".repeat(40), implementationRoot: a.sourceRoot, coldRoot: a.coldRoot, role: f.source.role, snapshotRoot: f.source.root, sourceRoot: f.source.sourceRoot, windowRoot: a.window.root, windowBytesRoot: a.windowBytesRoot, requestBytesRoot: a.requestBytesRoot, dataReviewRoot: a.dataReviewRoot }
      if (mode === "wrong-publication") body.windowRoot = root("other-window")
      if (mode === "wrong-source") body.sourceRoot = root("other-source")
      return { ...body, root: labRoot(body.schemaVersion, body) }
    })
    const guard = vi.fn()
    try {
      if (mode === "wrong-seat") f.binding.seat = "foreign" as never
      if (mode !== "valid") { expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow(); return }
      const auth = authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)
      expect(guard.mock.calls.some(([bytes]) => Number(bytes) > 0)).toBe(true)
      expect(authorityIO.leanStartupAuthorityDescriptorV8(auth)?.version).toBe(8)
      expect(() => authorityIO.claimLeanStartupAuthorityV8({ ...auth }, f.binding, "factory")).toThrow()
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "session")).toThrow()
      const before = guard.mock.calls.length
      authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "factory")
      authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")
      expect(guard.mock.calls.length).toBeGreaterThanOrEqual(before + 2)
      guard.mockImplementation(() => { throw new Error("INERT_SURVIVOR_GROWTH") })
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "session")).toThrow("INERT_SURVIVOR_GROWTH")
      guard.mockImplementation(() => {})
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "session")).toThrow()
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
    } finally { validate.mockRestore(); entry.mockRestore(); read.mockRestore() }
  })
  it.each(["stopped", "terminal"] as const)("[continuation-v2] burns every ordered claim after a fresh %s ledger observation", status => {
    const f = fixture(), a = f.ledger.allocation as any, root = (s: string) => labRoot("inert-v2-stale", s)
    Object.assign(a, { schemaVersion: "lean-baseline-continuation-allocation-v2", sourceHead: "b".repeat(40), requestBytesRoot: root("request"), planningRoot: root("planning"), manifestRoot: root("manifest"), sourceGateRoot: root("source-gate"), dataReviewRoot: root("data-review"), windowBytesRoot: root("window-bytes"), window: { root: root("window"), grantId: "inert-grant", routeNamespace: "20261012-v3" }, predecessor: { chargedMatches: 50 } })
    a.window = authorityWindow(a)
    const pairBody = { ...f.pair, priorCharged: 50 }; const { root: _, ...pb } = pairBody, pair = { ...pb, root: labRoot("lean-baseline-pair-v1", pb) }
    writeFileSync(f.pairPath, leanCanonicalBytes(pair))
    const claimBody = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: a.window.grantId, routeNamespace: a.window.routeNamespace, windowRoot: a.window.root, windowBytesRoot: a.windowBytesRoot, requestBytesRoot: a.requestBytesRoot, sourceHead: a.sourceHead, sourceRoot: a.sourceRoot, sourceGateRoot: a.sourceGateRoot, dataReviewRoot: a.dataReviewRoot, planningRoot: a.planningRoot, manifestRoot: a.manifestRoot }
    const claim = { ...claimBody, root: labRoot(claimBody.schemaVersion, claimBody) }
    const validate = vi.spyOn(leanIO, "validateLeanBaselineContinuationAllocationV2").mockReturnValue(a)
    const entry = vi.spyOn(leanIO, "readLeanChildEntry").mockReturnValue({ head: "a".repeat(40), sourceRoot: a.sourceRoot, allocationRoot: a.root, requestBytesRoot: a.requestBytesRoot } as any)
    const read = vi.spyOn(continuationIO, "readLeanContinuationJsonV2").mockImplementation(path => {
      if (path === leanIO.LEAN_BASELINE_CONTINUATION_PATHS_V2.claim) return claim
      if (path === f.pairPath) return pair
      if (path.endsWith(`source-${f.source.role}.json`)) return f.source as any
      const body = { schemaVersion: "lean-baseline-continuation-source-publication-v2", allocationRoot: a.root, sourceHead: a.sourceHead, head: "a".repeat(40), implementationRoot: a.sourceRoot, coldRoot: a.coldRoot, role: f.source.role, snapshotRoot: f.source.root, sourceRoot: f.source.sourceRoot, windowRoot: a.window.root, windowBytesRoot: a.windowBytesRoot, requestBytesRoot: a.requestBytesRoot, dataReviewRoot: a.dataReviewRoot }
      return { ...body, root: labRoot(body.schemaVersion, body) }
    })
    try {
      const auth = authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, () => {})
      retained.state = { charges: new Map([[f.charge.slotRoot, f.charge]]), terminals: status === "terminal" ? new Map([[f.charge.root, { root: root("terminal") }]]) : new Map(), stopped: status === "stopped" }
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "factory")).toThrow()
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")).toThrow()
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "session")).toThrow()
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, () => {})).toThrow()
    } finally { validate.mockRestore(); entry.mockRestore(); read.mockRestore() }
  })
  it("[continuation-v2] forwards positive allocation reservations before use and burns denied issuance", () => {
    const f = fixture(), a = f.ledger.allocation as any
    Object.assign(a, { schemaVersion: "lean-baseline-continuation-allocation-v2", sourceHead: "b".repeat(40), predecessor: { chargedMatches: 50 }, window: { root: labRoot("window", 1), grantId: "inert-grant", routeNamespace: "20261012-v3" } })
    const validate = vi.spyOn(leanIO, "validateLeanBaselineContinuationAllocationV2").mockReturnValue(a)
    const guard = vi.fn((bytes = 0) => { if (bytes > 0) throw new Error("INERT_BUFFER_RESERVATION_DENIED") })
    try {
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow("INERT_BUFFER_RESERVATION_DENIED")
      expect(guard.mock.calls.some(([bytes]) => Number(bytes) > 0)).toBe(true)
      guard.mockImplementation(() => {})
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthorityV2(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
    } finally { validate.mockRestore() }
  })
  it("continuation V8 guards issuance and every ordered construction claim without refunding a failed seat", () => {
    const f = fixture(), a = f.ledger.allocation as any
    Object.assign(a, { schemaVersion: "lean-baseline-continuation-allocation-v1", sourceHead: "b".repeat(40) })
    const validate = vi.spyOn(leanIO, "validateLeanBaselineContinuationAllocation").mockReturnValue(a)
    const entry = vi.spyOn(leanIO, "readLeanChildEntry").mockReturnValue({ head: "a".repeat(40), sourceRoot: a.sourceRoot, allocationRoot: a.root } as any)
    const guard = vi.fn()
    const proof = (role: string) => { const body = { schemaVersion: "lean-baseline-continuation-source-publication-v1", allocationRoot: a.root, sourceHead: a.sourceHead, head: "a".repeat(40), implementationRoot: a.sourceRoot, coldRoot: a.coldRoot, role, snapshotRoot: f.source.root, sourceRoot: f.source.sourceRoot }; return { ...body, root: labRoot(body.schemaVersion, body) } }
    writeFileSync(join(f.ledger.directory, `publication-${f.source.role}-continuation-v1.json`), leanCanonicalBytes(proof(f.source.role)), { mode: 0o600, flag: "wx" })
    try {
      const auth = authorityIO.issueLeanBaselineContinuationRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, guard)
      expect(guard.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(authorityIO.leanStartupAuthorityDescriptorV8(auth)?.version).toBe(8)
      expect(() => JSON.stringify(auth)).toThrow()
      expect(() => authorityIO.claimLeanStartupAuthorityV8({ ...auth }, f.binding, "factory")).toThrow()
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")).toThrow()
      authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "factory")
      guard.mockImplementation(() => { throw new Error("INERT_FRONTIER_CROSSED") })
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")).toThrow("INERT_FRONTIER_CROSSED")
      guard.mockImplementation(() => {})
      expect(() => authorityIO.claimLeanStartupAuthorityV8(auth, f.binding, "planner")).toThrow()
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
    } finally { validate.mockRestore(); entry.mockRestore() }
  })
  it("continuation rejects at its admission guard and cannot issue that spent seat again", () => {
    const f = fixture(), a = f.ledger.allocation as any
    Object.assign(a, { schemaVersion: "lean-baseline-continuation-allocation-v1", sourceHead: "b".repeat(40) })
    const validate = vi.spyOn(leanIO, "validateLeanBaselineContinuationAllocation").mockReturnValue(a)
    const guard = vi.fn<() => void>(() => { throw new Error("INERT_NO_CAPACITY") })
    try {
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, guard)).toThrow("INERT_NO_CAPACITY")
      guard.mockImplementation(() => {})
      expect(() => authorityIO.issueLeanBaselineContinuationRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, guard)).toThrow()
    } finally { validate.mockRestore() }
  })
  it("[startup-origin-v8] host-issued ordinal5 descriptor is nonserializable and single-use; forged/default claims fail", () => {
    const f = fixture(), grantRoot = labRoot("NON_AUTHORIZING-startup-grant", f.charge.root)
    const reuse = { grant: { root: grantRoot }, sources: [f.source] } as unknown as LeanColdReuse
    const validation = vi.spyOn(reuseIO, "validateLeanColdReuse").mockReturnValue(reuse)
    const a = f.ledger.allocation as any
    Object.assign(a, { schemaVersion: "lean-correction-supervisor-diagnostic-allocation-v8", attemptOrdinal: 5, reuseGrantRoot: grantRoot, startupPolicyRoot: leanIO.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: (leanIO as any).LEAN_RESOURCE_WINDOW_V15_STARTUP_ATTRIBUTION_POLICY })
    const mode = vi.spyOn(leanIO, "leanSupervisorAllocationMode").mockReturnValue("v15-5")
    const caps = vi.spyOn(leanIO, "leanCapsForAllocation").mockReturnValue(leanIO.LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_CAPS)
    const admission = vi.spyOn(leanIO, "admitLeanAllocation").mockReturnValue(a)
    const entry = vi.spyOn(leanIO, "readLeanChildEntry").mockReturnValue({ head: "a".repeat(40) } as any)
    const source = vi.spyOn(sourceIO, "readLeanBaselineSource").mockReturnValue(f.source)
    try {
      const auth = issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, reuse)
      const descriptor = (authorityIO as any).leanStartupAuthorityDescriptorV8(auth)
      expect(descriptor).toMatchObject({ version: 8, allocationRoot: a.root, chargeRoot: f.charge.root, seat: "bottom", harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())) })
      expect(() => JSON.stringify(auth)).toThrow()
      expect((authorityIO as any).leanStartupAuthorityDescriptorV8({ ...auth })).toBeUndefined()
      expect(() => claimLeanRuntimeAuthority({ ...auth }, f.binding, "factory")).toThrow()
      expect(() => issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, reuse)).toThrow()
      expect(() => (authorityIO as any).claimLeanStartupAuthorityV8(auth, { ...f.binding, attemptRoot: labRoot("wrong", 1) }, "factory")).toThrow()
      expect((authorityIO as any).claimLeanStartupAuthorityV8(auth, f.binding, "factory").startup).toBe(descriptor)
      expect(() => (authorityIO as any).claimLeanStartupAuthorityV8(auth, f.binding, "factory")).toThrow()
      expect(() => claimLeanRuntimeAuthority(auth, f.binding, "planner")).toThrow()
    } finally { validation.mockRestore(); mode.mockRestore(); caps.mockRestore(); admission.mockRestore(); entry.mockRestore(); source.mockRestore() }
  })
  it("[startup-origin-v8] never upgrades a default authority or caller JSON to V8", () => {
    const f = fixture(), auth = issueLeanBaselineRuntimeAuthority(f.ledger, f.charge, f.source, f.binding)
    expect((authorityIO as any).leanStartupAuthorityDescriptorV8(auth)).toBeUndefined()
    expect(() => (authorityIO as any).claimLeanStartupAuthorityV8(auth, f.binding, "factory")).toThrow()
    expect(() => (authorityIO as any).claimLeanStartupAuthorityV8(JSON.parse('{"version":8,"attemptOrdinal":5}'), f.binding, "factory")).toThrow()
  })
  it.each(["lean-correction-supervisor-diagnostic-allocation-v2", "lean-correction-supervisor-baseline-allocation-v2", "lean-correction-supervisor-diagnostic-allocation-v3", "lean-correction-supervisor-baseline-allocation-v3", "lean-correction-supervisor-diagnostic-allocation-v4", "lean-correction-supervisor-baseline-allocation-v4"])("joins the real %s issuer to exact mock pair/source/charge custody", schemaVersion => {
    const f = fixture(), grantRoot = labRoot("mock-reuse-grant", f.charge.root)
    const reuse = { grant: { root: grantRoot }, sources: [f.source] } as unknown as LeanColdReuse
    const validation = vi.spyOn(reuseIO, "validateLeanColdReuse").mockReturnValue(reuse)
    Object.assign(f.ledger.allocation, { schemaVersion, sourceRoot: labRoot("mock-successor-code", f.charge.root), reuseGrantRoot: grantRoot })
    try {
      const authority = issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, reuse)
      expect(isLeanCorrectionRuntimeAuthority(authority)).toBe(true)
      for (const layer of ["factory", "planner", "session"] as const) expect(claimLeanRuntimeAuthority(authority, f.binding, layer)).toEqual({ lifetimeMs: 600000, receiptMs: 5000 })
      expect(() => issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, reuse)).toThrow()
      Object.assign(f.ledger.allocation, { reuseGrantRoot: labRoot("forged-grant", 1) })
      expect(() => issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, reuse)).toThrow()
      Object.assign(f.ledger.allocation, { reuseGrantRoot: grantRoot, schemaVersion: "unapproved-v3" })
      expect(() => issueLeanCorrectionRuntimeAuthority(f.ledger, f.charge, f.source, f.binding, reuse)).toThrow()
    } finally { validation.mockRestore() }
  }, 20000)
  it("binds cumulative predecessor costs, precharge pair prefix and exact source/snapshot roots", () => {
    const f = fixture(), authority = issueLeanBaselineRuntimeAuthority(f.ledger, f.charge, f.source, f.binding)
    expect(() => claimLeanRuntimeAuthority(authority, f.binding, "planner")).toThrow()
    expect(claimLeanRuntimeAuthority(authority, f.binding, "factory")).toEqual({ lifetimeMs: 600000, receiptMs: 5000 })
    expect(claimLeanRuntimeAuthority(authority, f.binding, "planner")).toEqual({ lifetimeMs: 600000, receiptMs: 5000 })
    expect(claimLeanRuntimeAuthority(authority, f.binding, "session")).toEqual({ lifetimeMs: 600000, receiptMs: 5000 })
    expect(() => claimLeanRuntimeAuthority(authority, f.binding, "session")).toThrow()
    expect(() => issueLeanBaselineRuntimeAuthority(f.ledger, f.charge, f.source, f.binding)).toThrow()
    expect(() => JSON.stringify(authority)).toThrow()
  }, 20000)
  it("refuses zeroed cumulative charge, postcharge prefix, edited snapshot and completed slot", () => {
    for (const kind of ["reset", "postcharge", "snapshot", "terminal"] as const) {
      const f = fixture(), { root: _root, ...body } = f.pair
      if (kind === "reset") body.priorCharged = 0
      if (kind === "postcharge") { body.priorLedgerByteLength = f.journal.length; body.priorLedgerBytesRoot = leanBytesRoot(f.journal) }
      if (kind === "snapshot") body.bottomSnapshotRoot = f.source.sourceRoot
      writeFileSync(f.pairPath, leanCanonicalBytes({ ...body, root: labRoot("lean-baseline-pair-v1", body) }))
      if (kind === "terminal") retained.state = { charges: new Map([[f.charge.slotRoot, f.charge]]), terminals: new Map([[f.charge.root, {}]]), stopped: false }
      expect(() => issueLeanBaselineRuntimeAuthority(f.ledger, f.charge, f.source, f.binding)).toThrow()
    }
  }, 20000)
})
