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

const retained = vi.hoisted(() => ({ state: {} as unknown }))
vi.mock("../../packages/strategy-lab/src/league/lean-experiment.js", async importOriginal => ({ ...await importOriginal<object>(), readLeanLedger: () => retained.state }))
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
describe("distinct baseline runtime authority", () => {
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
