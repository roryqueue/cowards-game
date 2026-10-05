import { describe, expect, it, vi } from "vitest"
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { EventEmitter } from "node:events"
import type { ChildProcess } from "node:child_process"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, createLeanCorrectionAllocation, admitLeanAllocation, leanWritablePaths, type LeanCorrectionPredecessor } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as accounting from "../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_CORRECTION_ROUTES, inventoryLeanSupervisorSurvivors, admitsLeanSupervisorReviewAgents, assertLeanCorrectionResources, parseLeanCorrectionCommand, validateLeanCorrectionDiagnosis, deriveLeanCorrectionRequestRoots, beginLeanCorrectionAdmission, closeLeanCorrectionAdmission, leanCorrectionAdmissionElapsed, assertLeanCorrectionAdmissionTime } from "./run-v1-38-lean-correction.js"
import { deriveLeanBaselineCandidateRoots, waitLeanBoundedChildReady } from "./run-v1-38-lean-baseline.js"
import { LEAN_COLD_REUSE_HISTORY } from "./lib/v1-38-lean-baseline-reuse.js"

describe("supervisor v2 source-only admission", () => {
  it("counts recursive mock TMP survivors once and refuses links/duplicates", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-recursive-mock-")))
    try {
      mkdirSync(join(directory, "tsx-501")); mkdirSync(join(directory, "nested")); writeFileSync(join(directory, "nested", "retained"), "mock", { mode: 0o600 })
      const rows = inventoryLeanSupervisorSurvivors([directory, join(directory, "nested")])
      expect(rows.map(row => row.identity)).toEqual([directory, join(directory, "nested"), join(directory, "nested", "retained"), join(directory, "tsx-501")])
      expect(() => inventoryLeanSupervisorSurvivors([directory, directory])).toThrow("SURVIVOR_DUPLICATE")
      symlinkSync(join(directory, "nested", "retained"), join(directory, "alias"))
      expect(() => inventoryLeanSupervisorSurvivors([directory])).toThrow("SURVIVOR")
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it("uses genuinely distinct root/child review roles only for the v2 path", () => {
    expect(admitsLeanSupervisorReviewAgents("/root/author", "/root")).toBe(true)
    expect(admitsLeanSupervisorReviewAgents("/root", "/root/reviewer")).toBe(true)
    expect(admitsLeanSupervisorReviewAgents("/root", "/root")).toBe(false)
    expect(admitsLeanSupervisorReviewAgents("fake-author", "/root")).toBe(false)
  })
  it("has disjoint explicit commands and preserves the v1 parser", () => {
    expect(parseLeanCorrectionCommand(["run-diagnostic", "--request", LEAN_CORRECTION_ROUTES.diagnostic.request]).route).toBe("diagnostic")
    const routes = accounting.LEAN_SUPERVISOR_CORRECTION_ROUTES
    for (const route of ["diagnostic", "baseline"] as const) {
      for (const mode of ["prepare", "run", "verify"] as const) expect(parseLeanCorrectionCommand([`${mode}-supervisor-${route}-v2`, "--request", routes[route].request])).toMatchObject({ route, supervisor: true })
      expect(() => parseLeanCorrectionCommand([`run-supervisor-${route}-v2`, "--request", LEAN_CORRECTION_ROUTES[route].request])).toThrow()
    }
  })
  it("admits the actual 11-charge carry, never the stale accounting prefix", () => {
    const old = correctionAllocationFixture(), { root: _r, ...p } = old.predecessor
    const predecessor = { ...p, chargedMatches: 11, elapsedUpperBoundMs: 5282046 }
    const input = { sourceRoot: old.sourceRoot, reviewRoot: old.reviewRoot, coldRoot: old.coldRoot, planRoot: old.planRoot, candidateRoots: old.candidateRoots, requestRoots: old.requestRoots, seed: old.seed, route: "diagnostic" as const, reuseGrantRoot: old.reuseGrantRoot, supervisorDecisionRoot: labRoot("mock-approved-decision", {}), acceptedCheckRoot: null, predecessor: { ...predecessor, root: labRoot(p.schemaVersion, predecessor) } }
    const allocation = accounting.createLeanSupervisorCorrectionAllocation(input)
    expect(admitLeanAllocation(allocation)).toEqual(allocation)
    expect(leanWritablePaths(allocation)).toContain(accounting.LEAN_SUPERVISOR_CORRECTION_ROUTES.diagnostic.request)
    for (const changed of [{ chargedMatches: 10 }, { elapsedUpperBoundMs: 4846168 }, { survivors: [...predecessor.survivors, ...predecessor.survivors] }]) {
      const body = { ...predecessor, ...changed }
      expect(() => accounting.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...body, root: labRoot(p.schemaVersion, body) } })).toThrow()
    }
  })
})

export const correctionAllocationFixture = (route: "diagnostic" | "baseline" = "diagnostic") => {
  const sourceRoot = labRoot("source-mock-only", {}), planRoot = labRoot("plan-mock-only", {})
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: route === "diagnostic" ? 10 : 11, elapsedUpperBoundMs: route === "diagnostic" ? 3319046 : 3400000, allocatedDiskBytes: 8192, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("history-mock-only", {}), survivors: [{ identity: ".strategy-lab/mock-survivor", allocatedBytes: 4096 }] }
  const predecessor: LeanCorrectionPredecessor = { ...body, root: labRoot(body.schemaVersion, body) }
  return createLeanCorrectionAllocation({ route, sourceRoot, reviewRoot: labRoot("review-mock-only", {}), planRoot, coldRoot: LEAN_COLD_REUSE_HISTORY.coldRoot, seed: LEAN_COLD_REUSE_HISTORY.seed, candidateRoots: deriveLeanBaselineCandidateRoots(LEAN_COLD_REUSE_HISTORY.coldRoot), requestRoots: deriveLeanCorrectionRequestRoots({ route, sourceRoot, planRoot, coldRoot: LEAN_COLD_REUSE_HISTORY.coldRoot, seed: LEAN_COLD_REUSE_HISTORY.seed }), reuseGrantRoot: labRoot("reuse-mock-only", {}), diagnosisRoot: route === "baseline" ? labRoot("diagnosis-mock-only", {}) : null, predecessor })
}

describe("bounded correction source admission", () => {
  it("admits only closed prospective setup cost identities before correction entry", () => {
    const time = { active: false, starts: new Map([["correction-preparation", 2000], ["correction-request-data", 1000]]), closed: new Set(["correction-preparation", "correction-request-data"]) }
    expect(accounting.admitsLeanPreEntryTime(true, time)).toBe(true)
    expect(accounting.admitsLeanPreEntryTime(false, time)).toBe(false)
    expect(accounting.admitsLeanPreEntryTime(true, { ...time, active: true })).toBe(false)
    expect(accounting.admitsLeanPreEntryTime(true, { ...time, closed: new Set(["correction-preparation"]) })).toBe(false)
    expect(accounting.admitsLeanPreEntryTime(true, { ...time, closed: new Set(["correction-preparation", "other"]) })).toBe(false)
    expect(accounting.admitsLeanPreEntryTime(true, { active: false, starts: new Map([["other", 1000]]), closed: new Set(["other"]) })).toBe(false)
    expect(accounting.admitsLeanPreEntryTime(false, { active: false, starts: new Map(), closed: new Set() })).toBe(true)
  })
  it("closes the actual mocked ready-timeout seam without launching a provider", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-child-ready-mock-")))
    vi.useFakeTimers()
    try {
      const carrier = beginLeanCorrectionAdmission("diagnostic", "run", directory, { wallStartMs: 1000, monotonicStartNs: "1000000000" })
      const child = Object.assign(new EventEmitter(), { pid: 123 }) as ChildProcess
      const failure = expect(waitLeanBoundedChildReady(child)).rejects.toThrow("CHILD_READY")
      await vi.advanceTimersByTimeAsync(30000)
      await failure
      expect(closeLeanCorrectionAdmission(carrier, null, { wallStartMs: 31000, monotonicStartNs: "31000000000" }).elapsedUpperBoundMs).toBe(30000)
    } finally { vi.useRealTimers(); rmSync(directory, { recursive: true, force: true }) }
  })
  it.each([0, 40000, 70000])("imports only the unaccounted tail after %dms mock entry cost", importedMs => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-transfer-mock-")))
    try {
      const carrier = beginLeanCorrectionAdmission("diagnostic", "run", directory, { wallStartMs: 1000, monotonicStartNs: "1000000000" })
      const time = { elapsedMs: 3319046 + importedMs, closedElapsedMs: 3319046 + importedMs, active: false, starts: new Map(importedMs ? [["pilot-entry", 1000]] : []), closed: new Set(importedMs ? ["pilot-entry"] : []), closes: new Map(importedMs ? [["pilot-entry", 1000 + importedMs]] : []) }
      vi.spyOn(accounting, "readLeanTimeAccounting").mockReturnValue(time)
      const begin = vi.spyOn(accounting, "beginLeanInterval").mockImplementation(() => {})
      const close = vi.spyOn(accounting, "closeLeanInterval").mockReturnValue(time)
      const ledger = { allocation: correctionAllocationFixture(), directory } as accounting.LeanExperimentLedger
      const receipt = closeLeanCorrectionAdmission(carrier, ledger, { wallStartMs: 71000, monotonicStartNs: "71000000000" })
      expect(receipt.elapsedUpperBoundMs).toBe(70000)
      expect(receipt.importedMs).toBe(importedMs)
      expect(begin).toHaveBeenCalledWith(ledger, "correction-run-finalization", 1000 + importedMs)
      expect(close).toHaveBeenCalledWith(ledger, "correction-run-finalization", 71000)
      expect(importedMs + (71000 - (1000 + importedMs))).toBe(70000)
    } finally { vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  })
  it("persists a ready-timeout cost before failed ledger import", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-ready-timeout-mock-")))
    try {
      const carrier = beginLeanCorrectionAdmission("diagnostic", "run", directory, { wallStartMs: 1000, monotonicStartNs: "1000000000" })
      vi.spyOn(accounting, "readLeanTimeAccounting").mockImplementation(() => { throw new TypeError("mock ledger unavailable after ready timeout") })
      const ledger = { allocation: correctionAllocationFixture(), directory } as accounting.LeanExperimentLedger
      expect(() => closeLeanCorrectionAdmission(carrier, ledger, { wallStartMs: 31000, monotonicStartNs: "31000000000" })).toThrow("mock ledger unavailable")
      expect(JSON.parse(readFileSync(join(directory, "admission-run-close.json"), "utf8"))).toMatchObject({ elapsedUpperBoundMs: 30000, allocationRoot: ledger.allocation.root, ledgerInterval: null })
    } finally { vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  })
  it.each(["prepare", "run"] as const)("retains slow failed %s admission before a ledger or child exists", mode => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-admission-mock-")))
    try {
      const start = { wallStartMs: 1000, monotonicStartNs: "1000000000" }
      const carrier = beginLeanCorrectionAdmission("diagnostic", mode, directory, start)
      expect(() => beginLeanCorrectionAdmission("diagnostic", mode, directory, start)).toThrow()
      expect(leanCorrectionAdmissionElapsed(carrier, { wallStartMs: 1001, monotonicStartNs: "41000000000" })).toBe(40000)
      const close = closeLeanCorrectionAdmission(carrier, null, { wallStartMs: 1001, monotonicStartNs: "41000000000" })
      expect(close.elapsedUpperBoundMs).toBe(40000)
      expect(close.ledgerInterval).toBeNull()
      expect(JSON.parse(readFileSync(join(directory, `admission-${mode}-close.json`), "utf8"))).toEqual(close)
      expect(() => closeLeanCorrectionAdmission(carrier, null)).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it("subtracts slow admission and unchanged reserves before releasing a mock ready child", () => {
    const carrier = { wallStartMs: 1000, monotonicStartNs: "1000000000" }
    expect(() => assertLeanCorrectionAdmissionTime(LEAN_CAPS.elapsedMs - 1_860_001, carrier, { wallStartMs: 31000, monotonicStartNs: "31000000000" })).toThrow("ADMISSION_TIME")
    expect(assertLeanCorrectionAdmissionTime(3319046, carrier, { wallStartMs: 31000, monotonicStartNs: "31000000000" })).toBe(3349046)
  })
  it("has two distinct fixed routes and never accepts a spent command", () => {
    expect(new Set(Object.values(LEAN_CORRECTION_ROUTES).flatMap(r => [r.store, r.request, r.allocation, r.check])).size).toBe(8)
    expect(parseLeanCorrectionCommand(["prepare-diagnostic", "--request", LEAN_CORRECTION_ROUTES.diagnostic.request]).route).toBe("diagnostic")
    expect(() => parseLeanCorrectionCommand(["run-current", "--request", ".strategy-lab/lean-baseline-request-20261004-v1.json"])).toThrow()
  })
  it("reserves cleanup, terminal and check time before charge", () => {
    const base = { elapsedMs: 3319046, charged: 10, physicalBytes: 1000, childRss: 1000, parentRss: 1000, freeBytes: LEAN_CAPS.totalBytes, availableMemoryBytes: 2 ** 31 }
    expect(assertLeanCorrectionResources(base)).toBeGreaterThan(0)
    expect(() => assertLeanCorrectionResources({ ...base, elapsedMs: LEAN_CAPS.elapsedMs - LEAN_CAPS.matchMs })).toThrow()
    expect(() => assertLeanCorrectionResources({ ...base, charged: 300 })).toThrow()
    expect(() => assertLeanCorrectionResources({ ...base, childRss: NaN })).toThrow()
  })
  it("unknown, unclean or merely synthetic signal denies baseline", () => {
    const root = labRoot("fixture", {})
    for (const cause of ["unknown", "broker_synthetic_sigkill", "observed_native_sigkill"]) expect(() => validateLeanCorrectionDiagnosis({ cause, cleanupComplete: true, diagnosticCheckRoot: root }, root)).toThrow()
  })
  it("keeps one diagnostic / 36 baseline slots, exact condition0 Smoke and carry", () => {
    const diagnostic = correctionAllocationFixture(), baseline = correctionAllocationFixture("baseline")
    expect(diagnostic.slots).toHaveLength(1); expect(baseline.slots).toHaveLength(36)
    expect(diagnostic.slots[0]!.arenaHash).toEqual(baseline.slots[0]!.arenaHash)
    expect(diagnostic.slots[0]!.requestRoot).not.toBe(baseline.slots[0]!.requestRoot)
    expect(diagnostic.slots[0]!.condition).toBe(0)
    expect(diagnostic.predecessor.chargedMatches).toBe(10)
    expect(baseline.predecessor.chargedMatches).toBe(11)
    expect(admitLeanAllocation(diagnostic)).toEqual(diagnostic)
    expect(leanWritablePaths(diagnostic)).toEqual([LEAN_CORRECTION_ROUTES.diagnostic.temp, LEAN_CORRECTION_ROUTES.diagnostic.allocation, LEAN_CORRECTION_ROUTES.diagnostic.request])
  })
  it.each(["caps", "slot", "carry", "schema", "grant"])("refuses changed %s before any provider", kind => {
    const fixture = structuredClone(correctionAllocationFixture())
    if (kind === "caps") (fixture.caps as { matches: number }).matches = 301
    if (kind === "slot") (fixture as unknown as { slots: unknown[] }).slots = []
    if (kind === "carry") fixture.predecessor.chargedMatches = 0
    if (kind === "schema") (fixture as { schemaVersion: string }).schemaVersion = "lean-current-baseline-allocation-v1"
    if (kind === "grant") (fixture as { reuseGrantRoot: string }).reuseGrantRoot = labRoot("forged", {})
    expect(() => admitLeanAllocation(fixture)).toThrow()
  })
  it("requires rooted independent actionable diagnosis and complete cleanup", () => {
    const checkRoot = labRoot("check-mock-only", {})
    const body = { schemaVersion: "lean-correction-diagnosis-v1" as const, diagnosticCheckRoot: checkRoot, originRoot: labRoot("origin-mock-only", {}), cause: "legacy_deadline_observed" as const, cleanupComplete: true as const, actionable: true as const, authorAgent: "/root", reviewerAgent: "/root/source_review", independentlyReviewed: true as const }
    const diagnosis = { ...body, root: labRoot(body.schemaVersion, body) }
    expect(validateLeanCorrectionDiagnosis(diagnosis, checkRoot)).toEqual(diagnosis)
    for (const mutation of [{ cleanupComplete: false }, { actionable: false }, { reviewerAgent: "/root" }, { diagnosticCheckRoot: labRoot("wrong", {}) }, { rawStack: "private" }]) expect(() => validateLeanCorrectionDiagnosis({ ...diagnosis, ...mutation }, checkRoot)).toThrow()
  })
})
