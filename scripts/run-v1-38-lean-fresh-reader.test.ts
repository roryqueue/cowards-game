/** Prospective v4 source-only regressions. No historical private files/provider. */
import { describe, expect, it } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as accounting from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "./run-v1-38-lean-correction.js"
import { correctionAllocationFixture } from "./run-v1-38-lean-correction.test.js"
import { mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as retained from "./lib/v1-38-lean-correction-retained.js"

describe("fresh repaired-reader v4 route", () => {
  it("admits only exact distinct v4 selectors, preserving old identities", () => {
    for (const route of ["diagnostic", "baseline"] as const) {
      const request = `.strategy-lab/lean-correction-supervisor-${route}-request-20261005-v4.json`
      for (const mode of ["prepare", "run", "verify"] as const) expect(correction.parseLeanCorrectionCommand([`${mode}-supervisor-${route}-v4`, "--request", request])).toMatchObject({ route, supervisor: "v4" })
      for (const older of [false, true, "v3"] as const) expect(() => correction.parseLeanCorrectionCommand([`run-supervisor-${route}-v4`, "--request", accounting.leanCorrectionRoutePaths(route, older).request])).toThrow()
      expect(accounting.leanCorrectionRoutePaths(route, "v4" as never).request).toBe(request)
      expect(accounting.leanSupervisorVersion("v4" as never)).toBe(4)
    }
  })
  it("pins old refused v3 accounting only, denying mutation or invented acceptance", () => {
    const c = correction.LEAN_REPAIRED_READER_CARRY
    const rawRoots = { allocation: c.allocationBytesRoot, request: c.requestBytesRoot, time: c.timeBytesRoot, entry: c.entryBytesRoot, terminal: c.terminalBytesRoot, result: c.resultBytesRoot, reason: c.reasonBytesRoot, ledger: c.ledgerBytesRoot, runClose: c.runCloseBytesRoot }
    const v = { allocationRoot: c.allocationRoot, rawRoots, charged: 12, currentCharges: 1, elapsedMs: 14939187, active: false, terminalStatus: "child_exited", exitCode: 0, signal: null, verifierIds: ["correction-supervisor-diagnostic-v3-verifier"], checkExists: false, failureExists: false }
    expect(correction.validateLeanRepairedReaderConsumedAccounting(v)).toEqual({ charged: 12, elapsedUpperBoundMs: 20471046 })
    for (const key of Object.keys(rawRoots)) expect(() => correction.validateLeanRepairedReaderConsumedAccounting({ ...v, rawRoots: { ...rawRoots, [key]: labRoot("changed", key) } })).toThrow()
    for (const changed of [{ checkExists: true }, { active: true }, { charged: 11 }, { currentCharges: 0 }, { elapsedMs: 14939186 }, { accepted: true }, { verifierIds: ["second-reader"] }]) expect(() => correction.validateLeanRepairedReaderConsumedAccounting({ ...v, ...changed })).toThrow()
  })
  it("carries witnessed prior costs and active setup without human idle or old journal edits", () => {
    const c = correction.LEAN_REPAIRED_READER_CARRY, decisionRoot = labRoot("mock-actual-approval", {})
    const body = { schemaVersion: "lean-supervisor-setup-witness-v4", startedAtMs: c.setupStartMs, observedAtMs: c.setupStartMs + 1000, source: "codex-app-read-thread", threadId: "019fa652-915a-7183-9af1-3b3c05868d86", turnId: "01a10d57-49be-78f0-9475-836f26e7ff9c", previousTurnId: "01a10cbd-cb18-7991-8426-5c82c2e8b1fe", priorElapsedMs: 20471046, consumedTimeBytesRoot: c.timeBytesRoot, decisionRoot, custodyRoot: decisionRoot }
    const rooted = (b: object) => ({ ...b, root: labRoot(body.schemaVersion, b) })
    expect(correction.validateLeanRepairedReaderSetupWitness(rooted(body), decisionRoot).priorElapsedMs).toBe(20471046)
    expect(c.priorElapsedMs + body.observedAtMs - body.startedAtMs).toBe(20472046)
    for (const changed of [{ priorElapsedMs: 14939187 }, { startedAtMs: c.setupStartMs - 1 }, { observedAtMs: c.setupStartMs - 1 }, { custodyRoot: labRoot("old", {}) }, { turnId: body.previousTurnId }, { monotonicStartNs: "invented" }]) expect(() => correction.validateLeanRepairedReaderSetupWitness(rooted({ ...body, ...changed }), decisionRoot)).toThrow()
  })
  it("real v4 producer and reader-gap custody append once without touching historical files", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v4-reader-source-only-")))
    const ledger = { directory, allocation: correctionAllocationFixture() }
    try {
      writeFileSync(join(directory, "time.ndjson"), "", { mode: 0o600 })
      const run = correction.beginLeanCorrectionAdmission("diagnostic", "run", directory, { wallStartMs: 1000, monotonicStartNs: "1000000000" }, "v4")
      accounting.beginLeanInterval(ledger, "pilot-entry", 1000); accounting.closeLeanInterval(ledger, "pilot-entry", 1100)
      correction.closeLeanCorrectionAdmission(run, ledger, { wallStartMs: 1110, monotonicStartNs: "1100000000" })
      const before = readFileSync(join(directory, "time.ndjson"), "utf8")
      accounting.beginLeanInterval(ledger, "correction-supervisor-diagnostic-v4-verifier", 1200)
      const gap = retained.readLeanFreshSupervisorReaderGap(ledger, "diagnostic", 1200, directory, 4)
      expect(gap).toEqual({ runCloseMs: 1110, readerStartMs: 1200, gapMs: 90 })
      expect(() => retained.readLeanFreshSupervisorReaderGap(ledger, "diagnostic", 1200, directory, 3)).toThrow()
      let tick = 0
      retained.closeLeanFreshSupervisorReader(ledger, "diagnostic", gap, () => [1250, 1255][tick++]!, 4)
      const time = accounting.readLeanTimeAccounting(ledger)
      expect(time.elapsedMs - ledger.allocation.predecessor.elapsedUpperBoundMs).toBe(255)
      expect(time.closed.has("correction-supervisor-diagnostic-v4-reader-gap")).toBe(true)
      expect(time.closed.has("correction-supervisor-diagnostic-v4-reader-close")).toBe(true)
      expect(time.active).toBe(false)
      expect(readFileSync(join(directory, "time.ndjson"), "utf8").startsWith(before)).toBe(true)
      expect(() => retained.closeLeanFreshSupervisorReader(ledger, "diagnostic", gap, Date.now, 4)).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it.each(["diagnostic", "baseline"] as const)("binds v4 %s to 12/13 charges and exact cumulative floor", route => {
    const old = correctionAllocationFixture(route), { root: _r, ...p } = old.predecessor
    const body = { ...p, chargedMatches: route === "diagnostic" ? 12 : 13, elapsedUpperBoundMs: 20471046, allocatedDiskBytes: 4231168 }
    const input = { sourceRoot: old.sourceRoot, reviewRoot: old.reviewRoot, coldRoot: old.coldRoot, planRoot: old.planRoot, candidateRoots: old.candidateRoots, requestRoots: old.requestRoots, seed: old.seed, route, reuseGrantRoot: old.reuseGrantRoot, supervisorDecisionRoot: labRoot("mock-approved-v4", {}), acceptedCheckRoot: route === "diagnostic" ? null : labRoot("mock-accepted-v4", {}), requestBytesRoot: labRoot("mock-request-v4", {}), dataReviewRoot: labRoot("mock-review-v4", {}), setupAccountingRoot: labRoot("mock-setup-v4", {}), predecessor: { ...body, root: labRoot(p.schemaVersion, body) } }
    const allocation = accounting.createLeanSupervisorCorrectionAllocation(input, 4 as never)
    expect(accounting.admitLeanAllocation(allocation)).toEqual(allocation)
    expect(allocation.schemaVersion).toBe(`lean-correction-supervisor-${route}-allocation-v4`)
    expect(accounting.leanWritablePaths(allocation)).toContain(".strategy-lab/lean-correction-supervisor-setup-20261005-v4.json")
    for (const changed of [{ chargedMatches: body.chargedMatches - 1 }, { elapsedUpperBoundMs: 20471045 }, { allocatedDiskBytes: 4231167 }]) {
      const invalid = { ...body, ...changed }
      expect(() => accounting.createLeanSupervisorCorrectionAllocation({ ...input, predecessor: { ...invalid, root: labRoot(p.schemaVersion, invalid) } }, 4 as never)).toThrow()
    }
    expect(() => accounting.createLeanSupervisorCorrectionAllocation(input, 5 as never)).toThrow()
  })
})
