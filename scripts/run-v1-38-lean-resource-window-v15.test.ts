/** Portable NON-AUTHORIZING host fixtures. Never Strategy/Match/provider work. */
import { expect, it, vi } from "vitest"
import { mkdtempSync, mkdirSync, realpathSync, readdirSync, rmSync, readFileSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as correction from "./run-v1-38-lean-correction.js"
import { assessLeanPrefixCapacity, compactExecution } from "./run-v1-38-lean-experiment.js"
import { leanResourceWindowDocumentsV15, authenticateLeanResourceWindowPriorPairV15, authenticateLeanResourceWindowAcceptedJoinV15 } from "./lib/v1-38-lean-resource-window-v15.js"
import { auditLeanCorrectionRetained, assertLeanResourceWindowReaderV15, validateLeanSupervisorRetestReasonJoinV12 } from "./lib/v1-38-lean-correction-retained.js"
import * as baseline from "./run-v1-38-lean-baseline.js"

const r = (n: number) => labRoot("NON_AUTHORIZING_v15_HOST", n)
const allocation = () => {
  const b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 36, elapsedUpperBoundMs: 208771903, allocatedDiskBytes: 24780800, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 854 }, (_, n) => ({ identity: `.strategy-lab/NON_AUTHORIZING-history-${n}`, allocatedBytes: 0 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: r(2), reviewRoot: r(3), coldRoot: r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: [r(7)], seed: "non-authorizing-host", route: "diagnostic", reuseGrantRoot: r(8), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: null, requestBytesRoot: r(9), dataReviewRoot: r(10), setupAccountingRoot: r(11), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: 2, priorClosureRoot: r(12), continuationRoot: r(13), acceptedReaderCloseRoot: null }, 8)
}
it("actual compaction forwards live projected guards, permits v15 RAM, and preserves independent disk and legacy refusal", () => {
  const a = allocation(), policy = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  const execution = { kind: "failure", failure: { code: "NON_AUTHORIZING" }, unchangedState: {}, transitions: [], accounting: [] } as unknown as Parameters<typeof compactExecution>[0]
  const usage = process.memoryUsage(), spy = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...usage, rss: 2100000000, arrayBuffers: 4096 })
  let projected = 0, parent = 40000000
  const guard = (additional = 0) => { projected = additional; lean.assertLeanAggregateMemoryV15({ parentRssBytes: parent, childRssBytes: process.memoryUsage().rss + additional }, policy) }
  try {
    expect(compactExecution(execution, 1, true, "bottom", a, guard).classification).toBe("system_failure")
    expect(projected).toBeGreaterThan(0)
    parent = policy.memoryBytes - policy.externalReserveBytes - policy.guardBytes - 2100000000 - projected
    expect(() => compactExecution(execution, 1, true, "bottom", a, guard)).not.toThrow()
    parent++
    expect(() => compactExecution(execution, 1, true, "bottom", a, guard)).toThrow("MEMORY_CAP")
    expect(() => compactExecution(execution, 1, true, "bottom", a)).toThrow("RESOURCE_GUARD")
    expect(() => compactExecution(execution, 1, true, "bottom")).toThrow("BUFFER_CAP")
    parent = 0
    spy.mockReturnValue({ ...usage, rss: 2100000000, arrayBuffers: lean.LEAN_CAPS.scratchBytes - projected })
    expect(() => compactExecution(execution, 1, true, "bottom", a, guard)).not.toThrow()
    spy.mockReturnValue({ ...usage, rss: 2100000000, arrayBuffers: lean.LEAN_CAPS.scratchBytes - projected + 1 })
    expect(() => compactExecution(execution, 1, true, "bottom", a, guard)).toThrow("BUFFER_CAP")
  } finally { spy.mockRestore() }
})
it("actual parent producer emits v15 canonical v2 accepted only by matching strict retained joins", () => {
  const a = allocation(), entry = { allocationRoot: a.root, sourceRoot: a.sourceRoot, requestBytesRoot: a.requestBytesRoot!, head: "a".repeat(40), parentPid: 101, childPid: 102 }
  const terminal = { exitCode: 0, signal: null, status: "child_exited" }
  const body: Omit<baseline.LeanSupervisorReasonEnvelope, "root"> = { ...entry, schemaVersion: "lean-parent-supervisor-reasons-v1", entryBytesRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(entry)), exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" } }
  const reason = baseline.deriveLeanParentSupervisorReason(a, body), bytes = lean.leanCanonicalBytes(reason)
  expect(reason).toMatchObject({ schemaVersion: "lean-parent-supervisor-reasons-v2", observations: { resourceSamplingOperation: "none", resourceSamplingSequence: 0, resourceSamplingExitObserved: false } })
  const join = (e = entry, t = terminal, b = bytes) => validateLeanSupervisorRetestReasonJoinV12(b, e as never, t as never)
  expect(join()).toEqual(reason)
  for (const patch of [{ allocationRoot: r(99) }, { sourceRoot: r(99) }, { requestBytesRoot: r(99) }, { head: "b".repeat(40) }, { parentPid: 103 }, { childPid: 103 }, { extra: "altered-entry-bytes" }]) expect(() => join({ ...entry, ...patch })).toThrow()
  for (const patch of [{ exitCode: 1 }, { signal: "SIGKILL" }, { status: "child_failed" }]) expect(() => join(entry, { ...terminal, ...patch } as typeof terminal)).toThrow()
  const legacy = lean.createLeanAllocation({ seed: "non-authorizing", sourceRoot: r(2), reviewRoot: r(3), candidateRoots: [r(5), r(6)] })
  const legacyReason = baseline.deriveLeanParentSupervisorReason(legacy, { ...body, allocationRoot: legacy.root })
  expect(legacyReason.schemaVersion).toBe("lean-parent-supervisor-reasons-v1")
  expect(baseline.isLeanSupervisorReasonEnvelope(legacyReason)).toBe(true)
  expect(() => baseline.validateLeanSupervisorReasonBytesV2(lean.leanCanonicalBytes(legacyReason))).toThrow()
  expect(() => baseline.deriveLeanParentSupervisorReason({ ...a, sourceRoot: r(99) }, body)).toThrow()
})
it("finite documents and missing or forged predecessor/own FINAL never authorize", () => {
  expect(leanResourceWindowDocumentsV15("diagnostic", "v15-2").helper).toBe(".strategy-lab/lean-resource-window-diagnostic-v15-2-helper.mts")
  expect(leanResourceWindowDocumentsV15("baseline", "v15-2").dataReview).toContain("RESOURCE-WINDOW-baseline-v15-2-DATA-REVIEW-v1.md")
  expect(() => authenticateLeanResourceWindowPriorPairV15(new Map())).toThrow()
  expect(() => authenticateLeanResourceWindowAcceptedJoinV15("v15-2", {}, {} as never)).toThrow()
})
it("selects only the exact fresh v2 source review without accepting the immutable issues-found v1", () => {
  const phase = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
  for (const n of [2, 3, 4, 5] as const) for (const route of ["diagnostic", "baseline"] as const) {
    const docs = leanResourceWindowDocumentsV15(route, `v15-${n}`)
    expect(docs.review).toBe(`${phase}265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v2.md`)
    expect(correction.leanPreparationProtocolDocuments(route, `v15-${n}`).review).toBe(docs.review)
    const request = { reviewPath: `${phase}265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v1.md` } as Parameters<typeof correction.authenticateLeanPreparationContinuationSourceReviewV13>[0]
    expect(() => correction.authenticateLeanPreparationContinuationSourceReviewV13(request, route, `v15-${n}`)).toThrow("SUPERVISOR_REQUEST")
  }
  // No fake clean review or successful source gate is produced here.
  const legacy = correction.leanPreparationProtocolDocuments("diagnostic", "v14-1")
  expect(legacy.review).toBe(`${phase}265-16-POST-V13-FIVE-PAIR-SOURCE-REVIEW-v2.md`)
})

it("ROOT authority frontier: finite selected dispatcher refuses absent authentic custody without writes", async () => {
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-v15-inert-")))
  try {
    process.chdir(directory)
    for (const n of [2, 3, 4, 5] as const) for (const route of ["diagnostic", "baseline"] as const) {
      const mode = `v15-${n}` as const, paths = lean.leanCorrectionRoutePaths(route, mode)
      expect(correction.leanCorrectionChildSupervisor(correction.leanCorrectionChildMode(route, mode))).toBe(mode)
      for (const action of ["prepare", "run", "verify", "verify-terminal"]) {
        const args = [`${action}-supervisor-${route}-${mode}`, "--request", paths.request]
        expect(correction.parseLeanCorrectionCommand(args)).toMatchObject({ supervisor: mode, route })
        await expect(correction.leanCorrectionMain(args)).rejects.toThrow()
      }
    }
    expect(readdirSync(directory)).toEqual([])
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
})

it("actual prefix guard accepts approved RAM independently, preserves old ceiling and refuses disk excess", () => {
  const a = allocation(), m = { parentRss: 1000000000, childRss: 1152455680, freeBytes: 15000000000, allocatedBytes: 24780800, elapsedMs: 208771903 }
  expect(assessLeanPrefixCapacity(m, 335544320, a)).toBe(2152455680)
  expect(() => assessLeanPrefixCapacity({ ...m, childRss: m.childRss + 1 }, 335544320, a)).toThrow()
  expect(() => assessLeanPrefixCapacity(m)).toThrow()
  expect(() => assessLeanPrefixCapacity({ ...m, allocatedBytes: 15000000001 }, 335544320, a)).toThrow()
  expect(() => assessLeanPrefixCapacity(m, 0, a)).toThrow()
})

it("finite documents remain route-specific with no caller-chosen helper or report wildcard", () => {
  expect(leanResourceWindowDocumentsV15("baseline", "v15-5").authorization).toContain("RESOURCE-WINDOW-baseline-v15-5-AUTHORIZATION-v1.json")
  const shell = readFileSync("scripts/run-v1-38-lean-correction.sh", "utf8")
  expect(shell).toContain("prepare-supervisor-diagnostic-v15-[2-5]")
  expect(shell).toContain("lean-correction-supervisor-baseline-20261009-v${1##*-v}-tmp")
})
it("executes only the finite shell selectors with an inert loader and unchanged pre-loader controls", () => {
  const wrapper = resolve("scripts/run-v1-38-lean-correction.sh"), directory = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-v15-shell-")))
  try {
    mkdirSync(join(directory, ".strategy-lab"), { mode: 0o700 }); mkdirSync(join(directory, "bin"), { mode: 0o700 })
    writeFileSync(join(directory, "bin/node"), '#!/bin/sh\nprintf "%s\\n" "$TMPDIR" "${NODE_OPTIONS-unset}" "$TSX_DISABLE_CACHE" "$NODE_DISABLE_COMPILE_CACHE" "$@"\n', { mode: 0o700 })
    const env = { ...process.env, PATH: `${join(directory, "bin")}:/usr/bin:/bin`, NODE_OPTIONS: "NON_AUTHORIZING-hostile-options" }
    for (const n of [2, 3, 4, 5]) for (const route of ["diagnostic", "baseline"]) for (const action of ["prepare", "run", "verify", "verify-terminal"]) {
      const command = `${action}-supervisor-${route}-v15-${n}`, lines = execFileSync("/bin/sh", [wrapper, command], { cwd: directory, env, encoding: "utf8" }).trim().split("\n")
      expect(lines).toEqual([join(directory, `.strategy-lab/lean-correction-supervisor-${route}-20261009-v15-${n}-tmp`), "unset", "1", "1", "--max-old-space-size=768", "--import", "tsx", "scripts/run-v1-38-lean-correction.ts", command])
    }
    const before = readdirSync(join(directory, ".strategy-lab"))
    for (const command of ["run-supervisor-diagnostic-v15-1", "run-supervisor-baseline-v15-6", "run-supervisor-diagnostic-v15-20", "run-supervisor-diagnostic-v15-2-extra"]) expect(() => execFileSync("/bin/sh", [wrapper, command], { cwd: directory, env, stdio: "pipe" })).toThrow()
    expect(readdirSync(join(directory, ".strategy-lab"))).toEqual(before)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
it("uses the same strict policy for the actual child guard without charging RSS to disk", () => {
  const a = allocation(), m = { elapsedMs: 208771903, charged: 36, physicalBytes: 24780800, parentRss: 1000000000, childRss: 1152455680, freeBytes: 15000000000, availableMemoryBytes: 2000000000 }
  expect(correction.assertLeanCorrectionResources(m, a)).toBe(3000000000)
  expect(() => correction.assertLeanCorrectionResources({ ...m, childRss: m.childRss + 1 }, a)).toThrow("MEMORY_CAP")
  expect(() => correction.assertLeanCorrectionResources(m)).toThrow("CAPACITY")
  expect(() => correction.assertLeanCorrectionResources({ ...m, charged: 35 }, a)).toThrow("CAPACITY")
  expect(() => correction.assertLeanCorrectionResources({ ...m, physicalBytes: 12000000001 }, a)).toThrow("CAPACITY")
  expect(() => correction.assertLeanCorrectionResources({ ...m, elapsedMs: 223171903 - 1860000 - 600000 }, a)).toThrow("CAPACITY")
  expect(() => correction.assertLeanCorrectionResources(m, { ...a, caps: { ...a.caps, scratchBytes: 3000000000 } } as unknown as typeof a)).toThrow()
})
it("requires the selected full-audit callback rather than accepting an omitted guard", () => {
  // Shape-only rejection fixture: no fabricated accepted result or FINAL.
  const snapshot = { schemaVersion: "lean-correction-supervisor-retained-snapshot-v8", allocation: allocation(), request: {}, entry: {}, terminal: {}, evidence: {}, time: {}, result: {}, reuse: {}, pairs: [], observations: [], sources: [], artifacts: {}, origin: null, journalBytes: new Uint8Array(), supervisorReasonBytes: new Uint8Array() }
  expect(() => auditLeanCorrectionRetained(snapshot)).toThrow("RESOURCE_GUARD")
  expect(() => auditLeanCorrectionRetained(snapshot, () => { throw new Error("NON_AUTHORIZING_CALLBACK_OBSERVED") })).toThrow("NON_AUTHORIZING_CALLBACK_OBSERVED")
})
it("measures an independent retained-reader process and real temp disk under the same envelope", () => {
  const before = process.cwd(), directory = realpathSync(mkdtempSync(join(tmpdir(), "NON_AUTHORIZING-v15-reader-"))), usage = process.memoryUsage(), spy = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...usage, rss: 2152455680, arrayBuffers: 4096 })
  try {
    process.chdir(directory); mkdirSync(".strategy-lab", { mode: 0o700 })
    const a = allocation(), paths = lean.leanCorrectionRoutePaths("diagnostic", "v15-2")
    mkdirSync(paths.temp, { mode: 0o700 })
    const ledger = lean.createLeanLedger(paths.store, a), observed = assertLeanResourceWindowReaderV15(ledger)
    expect(observed.memoryBytes).toBe(3000000000)
    expect(observed.scratchBytes).toBe(4096 + lean.measureLeanPhysicalBytes(paths.temp))
    expect(observed.scratchBytes).toBeLessThan(2000000000)
    expect(() => assertLeanResourceWindowReaderV15(ledger, 1)).toThrow("MEMORY_CAP")
    spy.mockReturnValue({ ...usage, rss: 2100000000, arrayBuffers: 2000000001 })
    expect(() => assertLeanResourceWindowReaderV15(ledger)).toThrow("HOLD_OR_CAPACITY")
  } finally { spy.mockRestore(); process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
})
it("roots setup and continuation in the original continuous window and leaves later paths dormant", () => {
  const b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, setup = correction.createLeanResourceWindowSetupV15("v15-2", b.actualResumeMs)
  expect(setup).toMatchObject({ startedAtMs: 1791455941097, priorElapsedMs: 108000000, memoryApprovalRoot: b.memoryApprovalRoot, attemptOrdinal: 2 })
  expect(() => correction.createLeanResourceWindowSetupV15("v15-1" as never, b.actualResumeMs)).toThrow()
  expect(() => correction.createLeanResourceWindowSetupV15("v15-2", b.absoluteDeadlineMs - b.reserveMs - 600000)).toThrow()
  const input = { priorClosureRoot: r(1), sourceRoot: r(2), reviewRoot: r(3), cumulativeCharged: 36, cumulativeElapsedMs: 208771903, allocatedDiskBytes: 24780800, distinction: { kind: "approved_prospective_memory_policy" as const, evidenceRoot: b.memoryApprovalRoot, reviewRoot: r(4) } }
  expect(correction.createLeanResourceWindowContinuationV15("v15-2", input)).toMatchObject({ attemptOrdinal: 2, timeboxExtension: b })
  expect(() => correction.createLeanResourceWindowContinuationV15("v15-2", { ...input, cumulativeCharged: 35 })).toThrow()
  expect(() => correction.createLeanResourceWindowContinuationV15("v15-2", { ...input, distinction: { ...input.distinction, evidenceRoot: r(99) } })).toThrow()
  for (const mode of ["v15-3", "v15-4", "v15-5"] as const) expect(() => correction.validateLeanResourceWindowContinuationV15({}, {} as never, "diagnostic", mode, {} as never)).toThrow("DIAGNOSTIC_CUSTODY")
  expect(() => correction.validateLeanPostV13ContinuationV14({}, {} as never, "diagnostic", "v14-2", {} as never)).toThrow("DIAGNOSTIC_CUSTODY")
})
it("accepts only source-bound ROOT and distinct-reviewer authorization shape, never source-executor roles", () => {
  const b = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, docs = leanResourceWindowDocumentsV15("diagnostic", "v15-2")
  const draft = correction.createLeanResourceWindowRequestDraftV15("v15-2", "diagnostic", { sourceRoot: r(1), reviewRoot: r(2), dataReviewRoot: r(3), setupAccountingRoot: r(4), reuseGrantRoot: r(5), authorizationRoot: r(6), priorClosureRoot: r(7), continuationRoot: r(8), acceptedCheckRoot: null, acceptedReaderCloseRoot: null, helperReviewRoot: r(9), helperPath: docs.helper, helperBytesRoot: r(10) })
  const base = { schemaVersion: "lean-resource-window-execution-authorization-v15", timeboxExtension: b, approved: true, executionAuthorized: true, route: "diagnostic", attemptOrdinal: 2, sourceRoot: draft.sourceRoot, approvalRoot: b.approvalRoot, planRoot: b.planRoot, policyRoot: b.root, requestDataRoot: correction.leanCorrectionRequestDataRoot(draft), helperPath: draft.helperPath, helperBytesRoot: draft.helperBytesRoot, helperReviewRoot: draft.helperReviewRoot, authorAgent: "/root", reviewerAgent: "/root/non_authorizing_fixture_reviewer" }
  const bind = (body: typeof base) => { const authorization = { ...body, root: labRoot(body.schemaVersion, body) }; return { authorization, request: { ...draft, authorizationRoot: lean.leanBytesRoot(lean.leanCanonicalBytes(authorization)) } } }
  // In-memory actor contract only; no actual gate, accepted diagnostic, helper,
  // immutable allocation or execution authority is published by this fixture.
  const valid = bind(base)
  expect(() => correction.validateLeanPreparationContinuationAuthorizationV13(valid.authorization, valid.request, "diagnostic")).not.toThrow()
  for (const fields of [{ authorAgent: "/root/source_executor" }, { reviewerAgent: "/root" }, { policyRoot: r(99) }, { helperBytesRoot: r(99) }, { attemptOrdinal: 3 }, { approved: false }, { timeboxExtension: { ...b, memoryBytes: 9000000000 } }]) {
    const fixture = bind({ ...base, ...fields } as typeof base)
    expect(() => correction.validateLeanPreparationContinuationAuthorizationV13(fixture.authorization, fixture.request, "diagnostic")).toThrow()
  }
})
