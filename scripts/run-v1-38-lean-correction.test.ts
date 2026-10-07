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
import * as correction from "./run-v1-38-lean-correction.js"
import * as retainedTwoPair from "./lib/v1-38-lean-correction-retained.js"

describe("v11 additive two-pair concrete public seams", () => {
  it("never refunds inherited v11 rows at preparation, terminal carry or pair2 inventory", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v11-no-refund-")))
    const survivor = join(directory, "historical-row"), fresh = join(directory, "new-row")
    try {
      writeFileSync(survivor, Buffer.alloc(65536))
      const rows = inventoryLeanSupervisorSurvivors([survivor]), prior = { survivors: rows, allocatedDiskBytes: rows[0]!.allocatedBytes + 4288512 }
      writeFileSync(fresh, Buffer.alloc(8192))
      const observed = correction.inventoryLeanTwoPairNoRefundV11(prior, [fresh])
      expect(observed.allocatedDiskBytes).toBe(prior.allocatedDiskBytes + inventoryLeanSupervisorSurvivors([fresh])[0]!.allocatedBytes)
      expect(observed.survivors.find(row => row.identity === survivor)).toEqual(rows[0])
      writeFileSync(survivor, "shrunk")
      expect(() => correction.inventoryLeanTwoPairNoRefundV11(prior, [fresh])).toThrow()
      rmSync(survivor)
      expect(() => correction.inventoryLeanTwoPairNoRefundV11(prior, [fresh])).toThrow()
      rmSync(fresh)
      expect(() => correction.inventoryLeanTwoPairNoRefundV11(observed, [])).toThrow()
    } finally { rmSync(directory, { recursive: true, force: true }) }
  })
  it("keeps sealed v11 preparation stable across charged report growth only", () => {
    const fixture = correctionAllocationFixture().predecessor, report = accounting.LEAN_TWO_PAIR_V11_REPORT_PATHS[0]!
    const seal = (body: Omit<typeof fixture, "root">) => ({ ...body, root: labRoot(body.schemaVersion, body) })
    const { root: _root, ...body } = fixture
    const prepared = seal({ ...body, survivors: [...body.survivors, { identity: report, allocatedBytes: 4096 }], allocatedDiskBytes: body.allocatedDiskBytes + 4096 })
    const inspected = seal({ ...body, survivors: [...body.survivors, { identity: report, allocatedBytes: 8192 }, { identity: accounting.LEAN_TWO_PAIR_V11_REPORT_PATHS[1]!, allocatedBytes: 4096 }], allocatedDiskBytes: body.allocatedDiskBytes + 12288 })
    expect(() => correction.assertLeanPreparedTwoPairPredecessorV11(prepared, inspected)).not.toThrow()
    expect(() => correction.assertLeanPreparedTwoPairPredecessorV11(prepared, seal({ ...body, survivors: [...body.survivors, { identity: report, allocatedBytes: 0 }], allocatedDiskBytes: prepared.allocatedDiskBytes }))).toThrow()
    expect(() => correction.assertLeanPreparedTwoPairPredecessorV11(prepared, seal({ ...inspected, chargedMatches: body.chargedMatches + 1 }))).toThrow()
    expect(() => correction.assertLeanPreparedTwoPairPredecessorV11(prepared, seal({ ...inspected, survivors: [...inspected.survivors, { identity: ".strategy-lab/unapproved-growth", allocatedBytes: 4096 }] }))).toThrow()
  })
  it("audits one actual accepted closure per consumer call, never a second full check or cached closure", () => {
    const r = (n: number) => labRoot("v11-synthetic-accepted", n), b = accounting.LEAN_TWO_PAIR_V11_EXTENSION
    const closure = { timeboxExtension: b, attemptOrdinal: 1, closureClass: "accepted", finalReaderClose: true, acceptedCheckAbsent: false, resultAbsent: false, currentCharges: 1, cumulativeCharged: 33, checkRoot: r(1), checkBytesRoot: r(2), allocationRoot: r(3), sourceRoot: r(4), requestBytesRoot: r(5), head: "a".repeat(40), readerCloseMs: b.startedAtMs + 10, root: r(6) }
    const audit = vi.spyOn(retainedTwoPair, "authenticateLeanRetryClosureV8").mockReturnValue(closure as never), duplicate = vi.spyOn(retainedTwoPair, "authenticateLeanSupervisorDiagnosticCheck").mockImplementation(() => { throw new Error("DUPLICATE_AUDIT") })
    try {
      expect(correction.authenticateLeanTwoPairAcceptedJoinV11("v11-1").accepted).toMatchObject({ root: closure.checkRoot, allocationRoot: closure.allocationRoot, attemptOrdinal: 1 })
      expect(audit).toHaveBeenCalledTimes(1); expect(duplicate).not.toHaveBeenCalled()
      expect(correction.authenticateLeanTwoPairAcceptedJoinV11("v11-1").closure).toBe(closure)
      expect(audit).toHaveBeenCalledTimes(2)
      expect(() => correction.authenticateLeanTwoPairAcceptedJoinV11("v11-2")).toThrow()
      for (const change of [{ finalReaderClose: false }, { closureClass: "absent" }, { checkBytesRoot: null }, { sourceRoot: null }, { timeboxExtension: accounting.LEAN_TWENTY_SIX_V10_EXTENSION }]) {
        audit.mockReturnValue({ ...closure, ...change } as never)
        expect(() => correction.authenticateLeanTwoPairAcceptedJoinV11("v11-1")).toThrow()
      }
      expect(duplicate).not.toHaveBeenCalled()
    } finally { audit.mockRestore(); duplicate.mockRestore() }
  })
  it("admitted v11 allocations preserve all limits and reject cap resets, cross-pair FINAL and unknown ordinal", () => {
    const old = correctionAllocationFixture(), r = (n: number) => labRoot("v11-allocation-synthetic", n), b = accounting.LEAN_TWO_PAIR_V11_EXTENSION
    for (const mode of ["v11-1", "v11-2"] as const) for (const route of ["diagnostic", "baseline"] as const) {
      const n = accounting.leanRetryOrdinal(mode), pb = { ...old.predecessor, chargedMatches: route === "baseline" ? 33 : 32, elapsedUpperBoundMs: b.priorElapsedMs + 1, allocatedDiskBytes: b.physicalFloorBytes, survivors: Array.from({ length: 517 }, (_, i) => ({ identity: `.strategy-lab/v11-synthetic-old-${i}`, allocatedBytes: 4096 })) }, { root: _p, ...body } = pb
      const input = { sourceRoot: r(1), reviewRoot: r(2), coldRoot: old.coldRoot, planRoot: b.planRoot, candidateRoots: old.candidateRoots, requestRoots: Array.from({ length: route === "diagnostic" ? 1 : 36 }, (_, i) => r(100 + i)), seed: old.seed, route, reuseGrantRoot: old.reuseGrantRoot, supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: route === "baseline" ? r(3) : null, requestBytesRoot: r(4), dataReviewRoot: r(5), setupAccountingRoot: r(6), predecessor: { ...body, root: labRoot(body.schemaVersion, body) }, startupPolicyRoot: accounting.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: n, priorClosureRoot: n === 1 ? null : r(7), continuationRoot: n === 1 ? null : r(8), acceptedReaderCloseRoot: route === "baseline" ? r(9) : null }
      const a = accounting.createLeanSupervisorCorrectionAllocation(input, 8)
      expect(accounting.leanSupervisorAllocationMode(accounting.admitLeanAllocation(a))).toBe(mode)
      expect(accounting.leanCapsForAllocation(a)).toEqual(accounting.LEAN_TWO_PAIR_V11_CAPS)
      expect(a.slots).toHaveLength(route === "diagnostic" ? 1 : 36)
      if (route === "baseline" || n === 2) {
        const report = { identity: accounting.LEAN_TWO_PAIR_V11_REPORT_PATHS[0]!, allocatedBytes: 4096 }
        const malformed: Array<Record<string, unknown>> = [
          { chargedMatches: 32.5 }, { chargedMatches: "33" },
          ...[-1, 0.5].map(allocatedBytes => ({ survivors: [...body.survivors, { ...report, allocatedBytes }] })),
          { survivors: [...body.survivors, report, report] },
          { survivors: [...body.survivors, { ...report, extra: true }] },
          { survivors: [...body.survivors, { ...report, allocatedBytes: b.physicalFloorBytes }] },
          ...[".strategy-lab/noncanonical/./row", ".strategy-lab/noncanonical\\row"].map(identity => ({ survivors: [...body.survivors, { identity, allocatedBytes: 4096 }] })),
        ]
        for (const mutation of malformed) {
          const changed = { ...body, ...mutation }, predecessor = { ...changed, root: labRoot(body.schemaVersion, changed) }
          expect(() => accounting.createLeanSupervisorCorrectionAllocation({ ...input, predecessor } as never, 8)).toThrow()
          const { root: _allocation, ...original } = a, changedAllocation = { ...original, predecessor }
          expect(() => accounting.admitLeanAllocation(JSON.parse(JSON.stringify({ ...changedAllocation, root: labRoot(a.schemaVersion, changedAllocation) })))).toThrow()
        }
      }
      expect(accounting.leanWritablePaths(a)).toContain(accounting.leanCorrectionRoutePaths(route, mode).allocation)
      for (const mutation of [{ attemptOrdinal: 3 as const }, { caps: accounting.LEAN_TWENTY_SIX_V10_CAPS }, { timeboxExtension: { ...b, charged: 0 } }]) expect(() => accounting.admitLeanAllocation({ ...a, ...mutation })).toThrow()
      const observations = { elapsedMs: b.priorElapsedMs + 1, charged: input.predecessor.chargedMatches, physicalBytes: b.physicalFloorBytes, childRss: 1, parentRss: 1, freeBytes: accounting.LEAN_CAPS.totalBytes, availableMemoryBytes: 2000000000 }
      expect(() => correction.assertLeanCorrectionResources(observations, a)).not.toThrow()
      expect(() => correction.assertLeanCorrectionResources({ ...observations, elapsedMs: b.elapsedMs - b.reserveMs }, a)).toThrow()
    }
  })
  it("fresh MAIN drafts and helper reviews have a non-circular data identity and a bounded continuation", () => {
    const r = (n: number) => labRoot("v11-draft-synthetic", n), input = { sourceRoot: r(1), reviewRoot: r(2), dataReviewRoot: r(3), helperReviewRoot: r(4), setupAccountingRoot: r(5), reuseGrantRoot: r(6), authorizationRoot: r(7), priorClosureRoot: null, continuationRoot: null, acceptedCheckRoot: null, acceptedReaderCloseRoot: null }
    const draft = correction.createLeanTwoPairRequestDraftV11("v11-1", "diagnostic", input)
    expect(draft.helperReviewPath).toBe(correction.leanTwoPairDocumentsV11("diagnostic", "v11-1").helperReview)
    expect(correction.leanCorrectionRequestDataRoot({ ...draft, helperReviewRoot: r(8), dataReviewRoot: r(9), authorizationRoot: r(10) })).toBe(correction.leanCorrectionRequestDataRoot(draft))
    const continuation = correction.createLeanTwoPairContinuationV11({ priorClosureRoot: r(11), sourceRoot: r(1), reviewRoot: r(2), cumulativeCharged: 32, cumulativeElapsedMs: 93601000, allocatedDiskBytes: 17272832 })
    expect(continuation).toMatchObject({ attemptOrdinal: 2, cumulativeCharged: 32, priorClosureRoot: r(11) })
    expect(() => correction.createLeanTwoPairContinuationV11({ ...continuation, cumulativeCharged: 0 } as never)).toThrow()
  })
  it("accepts every fixed v11 CLI route and rejects ordinal3 and cross-pair request paths", () => {
    for (const mode of ["v11-1", "v11-2"] as const) for (const route of ["diagnostic", "baseline"] as const) {
      const docs = correction.leanTwoPairDocumentsV11(route, mode), paths = accounting.leanCorrectionRoutePaths(route, mode)
      expect(docs.authorization).toContain(`${route}-${mode}`)
      expect(docs.continuation).toContain(mode)
      expect(docs.dataReview).toContain(`${route.toUpperCase()}-${mode.toUpperCase()}`)
      for (const verb of ["prepare", "run", "verify", "verify-terminal"]) {
        const command = `${verb}-supervisor-${route}-${mode}`
        expect(correction.parseLeanCorrectionCommand([command, "--request", paths.request]).supervisor).toBe(mode)
        expect(() => correction.parseLeanCorrectionCommand([command, "--request", accounting.leanCorrectionRoutePaths(route, mode === "v11-1" ? "v11-2" : "v11-1").request])).toThrow()
      }
      expect(correction.leanCorrectionChildSupervisor(`child-supervisor-${route}-${mode}`)).toBe(mode)
    }
    expect(() => correction.parseLeanCorrectionCommand(["run-supervisor-diagnostic-v11-3", "--request", "unused"])).toThrow()
    expect(correction.leanCorrectionChildSupervisor("child-supervisor-diagnostic-v11-3")).toBe(false)
    for (const name of ["readLeanTwoPairRequestV11", "inspectLeanTwoPairPredecessorV11", "authenticateLeanTwoPairAcceptedJoinV11"]) expect(typeof correction[name as keyof typeof correction]).toBe("function")
    for (const name of ["authenticateLeanTwoPairHistoricalCustodyV11", "authenticateLeanTwoPairClosedOutcomeV11", "verifyLeanTwoPairTerminalOnlyV11"]) expect(typeof retainedTwoPair[name as keyof typeof retainedTwoPair]).toBe("function")
  })
})

describe("private v3 verifier finite trusted diagnostics", () => {
  it("projects only branded static guard codes for the exact private v3 verify commands", () => {
    const args = ["verify-supervisor-diagnostic-v3", "--request", accounting.leanCorrectionRoutePaths("diagnostic", "v3").request]
    const error = correction.leanCorrectionTrustedGuardError("LEAN_CORRECTION_RETAINED_INVENTORY")
    expect(correction.leanCorrectionCliFailure(args, error)).toBe("LEAN_CORRECTION_RETAINED_INVENTORY\n")
    for (const unsafe of [new TypeError(error.message), new Error("/private/Strategy source"), { message: error.message }, correction.leanCorrectionTrustedGuardError("LEAN_CORRECTION_RETAINED_FUTURE_UNKNOWN")]) expect(correction.leanCorrectionCliFailure(args, unsafe)).toBe("LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n")
    for (const command of ["verify-diagnostic", "verify-supervisor-diagnostic-v2", "run-supervisor-diagnostic-v3"]) expect(correction.leanCorrectionCliFailure([command, "--request", args[2]!], error)).toBe("LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n")
    expect(correction.leanCorrectionCliFailure([...args, "unexpected"], error)).toBe("LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n")
    const hostile = new Proxy({}, { get: () => { throw new Error("PRIVATE_PAYLOAD") } })
    expect(correction.leanCorrectionCliFailure(args, hostile)).toBe("LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n")
    Object.defineProperty(error, "message", { get: () => { throw new Error("PRIVATE_PAYLOAD") } })
    expect(correction.leanCorrectionCliFailure(args, error)).toBe("LEAN_CORRECTION_FAILED_DETAILS_WITHHELD\n")
  })
})

describe("fresh v3 witnessed finite carry", () => {
  it("rejects refunded v3 predecessor time and disk while preserving v2", () => {
    const a = correctionAllocationFixture(), { root: _root, ...prior } = a.predecessor
    const p = { ...prior, chargedMatches: 11, elapsedUpperBoundMs: 10888046, allocatedDiskBytes: 2179072 }
    const input = { sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, coldRoot: a.coldRoot, planRoot: a.planRoot, candidateRoots: a.candidateRoots, requestRoots: a.requestRoots, seed: a.seed, route: a.route, reuseGrantRoot: a.reuseGrantRoot, supervisorDecisionRoot: labRoot("mock-new-decision", {}), acceptedCheckRoot: null, requestBytesRoot: labRoot("mock-bytes", {}), dataReviewRoot: labRoot("mock-review", {}), setupAccountingRoot: labRoot("mock-setup", {}), predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }
    expect(admitLeanAllocation(accounting.createLeanSupervisorCorrectionAllocation(input, 3)).schemaVersion).toBe("lean-correction-supervisor-diagnostic-allocation-v3")
    expect(leanWritablePaths(accounting.createLeanSupervisorCorrectionAllocation(input, 3))).toContain(accounting.LEAN_FRESH_SUPERVISOR_SETUP_PATH)
    for (const changed of [{ elapsedUpperBoundMs: 10888045 }, { allocatedDiskBytes: 2179071 }]) {
      const body = { ...p, ...changed }, stale = { ...input, predecessor: { ...body, root: labRoot(p.schemaVersion, body) } }
      expect(() => accounting.createLeanSupervisorCorrectionAllocation(stale, 3)).toThrow()
      expect(() => accounting.createLeanSupervisorCorrectionAllocation(stale)).not.toThrow()
    }
  })
  it("pins consumed accounting roots and admits no old acceptance", () => {
    const c = correction.LEAN_FRESH_SUPERVISOR_CARRY
    const observation = { allocationRoot: c.allocationRoot, rawRoots: { allocation: c.allocationBytesRoot, entry: c.entryBytesRoot, terminal: c.terminalBytesRoot, reason: c.reasonBytesRoot, failure: c.failureBytesRoot, time: c.timeBytesRoot }, charged: 11, currentCharges: 0, elapsedMs: 10230553, active: false, resultExists: false, terminalStatus: "child_failed", exitCode: 1, signal: null, verifierIds: ["correction-supervisor-diagnostic-v2-terminal-verifier"], readerCloseMs: 1791160625507 }
    expect(correction.validateLeanFreshSupervisorConsumedAccounting(observation)).toEqual({ charged: 11, elapsedUpperBoundMs: 10888046 })
    for (const changed of [{ elapsedMs: 10230552 }, { currentCharges: 1 }, { active: true }, { resultExists: true }, { readerCloseMs: 1791160625506 }, { verifierIds: ["correction-supervisor-diagnostic-v2-verifier"] }, { rawRoots: { ...observation.rawRoots, time: labRoot("forged-time", {}) } }]) expect(() => correction.validateLeanFreshSupervisorConsumedAccounting({ ...observation, ...changed })).toThrow()
  })
  it("binds witnessed wall setup and prior repair instead of human idle or fake monotonic time", () => {
    const c = correction.LEAN_FRESH_SUPERVISOR_CARRY, decisionRoot = labRoot("mock-fresh-decision", {}), custodyRoot = labRoot("mock-app-clock-custody", {})
    const body = { schemaVersion: "lean-supervisor-setup-witness-v3", startedAtMs: c.setupStartMs, observedAtMs: c.setupStartMs + 1000, source: "codex-app-read-thread", threadId: "019fa652-915a-7183-9af1-3b3c05868d86", turnId: "01a10be5-f9b9-72f0-860c-31b82fc9b1b7", previousTurnId: "01a10932-a9e2-77a3-9083-229b602e9d48", priorCompletionUpperMs: c.completionUpperMs, priorCheckCloseMs: c.readerCloseMs, priorRepairMs: 657493, consumedTimeBytesRoot: c.timeBytesRoot, decisionRoot, custodyRoot }
    const rooted = (body: object) => ({ ...body, root: labRoot("lean-supervisor-setup-witness-v3", body) })
    expect(correction.validateLeanFreshSupervisorSetupWitness(rooted(body), decisionRoot, custodyRoot).startedAtMs).toBe(1791200983000)
    for (const changed of [{ startedAtMs: 1791160625507 }, { priorRepairMs: 0 }, { observedAtMs: c.setupStartMs - 1 }, { monotonicStartNs: "1000" }, { consumedTimeBytesRoot: labRoot("forged", {}) }, { decisionRoot: labRoot("old-decision", {}) }]) expect(() => correction.validateLeanFreshSupervisorSetupWitness(rooted({ ...body, ...changed }), decisionRoot, custodyRoot)).toThrow()
  })
})

describe("supervisor v2 source-only admission", () => {
  it("uses explicit disjoint v3 commands and preserves true-v2 defaults", () => {
    for (const route of ["diagnostic", "baseline"] as const) {
      const request = `.strategy-lab/lean-correction-supervisor-${route}-request-20261005-v3.json`
      for (const mode of ["prepare", "run", "verify"] as const) expect(parseLeanCorrectionCommand([`${mode}-supervisor-${route}-v3`, "--request", request])).toMatchObject({ route, supervisor: "v3" })
      expect(() => parseLeanCorrectionCommand([`run-supervisor-${route}-v3`, "--request", accounting.LEAN_SUPERVISOR_CORRECTION_ROUTES[route].request])).toThrow()
      expect(accounting.leanCorrectionRoutePaths(route, true)).toEqual(accounting.LEAN_SUPERVISOR_CORRECTION_ROUTES[route])
      expect(accounting.leanCorrectionRoutePaths(route, "v3")).toMatchObject({ request, store: `.strategy-lab/lean-correction-supervisor-${route}-20261005-v3` })
    }
  })
  it("counts recursive mock TMP survivors once and refuses links/duplicates", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-recursive-mock-")))
    try {
      mkdirSync(join(directory, "tsx-501")); mkdirSync(join(directory, "nested")); writeFileSync(join(directory, "nested", "retained"), "mock", { mode: 0o600 })
      const currentWitness = join(directory, "new-v3-witness")
      writeFileSync(currentWitness, "source-only synthetic witness", { mode: 0o600 })
      // Owned witness is deliberately outside the predecessor roots. Real
      // recursive inventory counts only predecessor inodes, including TMP.
      const rows = inventoryLeanSupervisorSurvivors([join(directory, "nested"), join(directory, "nested", "retained"), join(directory, "tsx-501")])
      expect(rows.map(row => row.identity)).toEqual([join(directory, "nested"), join(directory, "nested", "retained"), join(directory, "tsx-501")])
      expect(rows.some(row => row.identity === currentWitness)).toBe(false)
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
    const input = { sourceRoot: old.sourceRoot, reviewRoot: old.reviewRoot, coldRoot: old.coldRoot, planRoot: old.planRoot, candidateRoots: old.candidateRoots, requestRoots: old.requestRoots, seed: old.seed, route: "diagnostic" as const, reuseGrantRoot: old.reuseGrantRoot, supervisorDecisionRoot: labRoot("mock-approved-decision", {}), acceptedCheckRoot: null, requestBytesRoot: labRoot("mock-request-bytes", {}), dataReviewRoot: labRoot("mock-data-review", {}), setupAccountingRoot: labRoot("mock-setup-witness", {}), predecessor: { ...predecessor, root: labRoot(p.schemaVersion, predecessor) } }
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
