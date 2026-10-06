/** Source-only retry envelope fixtures. Native dispatch is forbidden. */
import { describe, it, expect, vi } from "vitest"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "./run-v1-38-lean-correction.js"
import * as retained from "./lib/v1-38-lean-correction-retained.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), spawn: () => { throw new Error("SOURCE_ONLY") }, fork: () => { throw new Error("SOURCE_ONLY") }, execFileSync: () => { throw new Error("SOURCE_ONLY") } }))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: function() { throw new Error("SOURCE_ONLY") } }))
const r = (name: string) => labRoot("retry-v8-fixture", name)
describe("v8 connected route admission", () => {
  it("selects three physically distinct authenticated CLI routes without changing v7", () => {
    const paths = [1, 2, 3].map(n => lean.leanCorrectionRoutePaths("diagnostic", `v8-${n}` as never))
    expect(new Set(paths.map(p => p.store)).size).toBe(3)
    for (const [index, path] of paths.entries()) {
      const n = index + 1
      expect(correction.parseLeanCorrectionCommand([`run-supervisor-diagnostic-v8-${n}`, "--request", path.request]).supervisor).toBe(`v8-${n}`)
      expect(() => correction.parseLeanCorrectionCommand([`run-supervisor-diagnostic-v8-${n}`, "--request", paths[(index + 1) % 3]!.request])).toThrow()
    }
    expect(() => correction.parseLeanCorrectionCommand(["run-supervisor-diagnostic-v8-4", "--request", paths[0]!.request])).toThrow()
    expect(lean.leanSupervisorVersion("v7")).toBe(7)
  })
  it("binds ordinal at actual allocation admission, caps and writable identities", () => {
    const predecessorBody = { schemaVersion: "lean-correction-predecessor-v1", chargedMatches: 29, elapsedUpperBoundMs: 49150573, allocatedDiskBytes: 15000000, historicalPeakDiskBytes: "unknown", historicalPeakRssBytes: "unknown", historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
    const input = { sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v8", route: "diagnostic", reuseGrantRoot: r("reuse"), supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("request-bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, predecessor: { ...predecessorBody, root: labRoot(predecessorBody.schemaVersion, predecessorBody) }, attemptOrdinal: 1, priorClosureRoot: null, continuationRoot: null, acceptedReaderCloseRoot: null }
    const allocation = lean.createLeanSupervisorCorrectionAllocation(input as never, 8 as never)
    expect(lean.admitLeanAllocation(allocation)).toEqual(allocation)
    expect(lean.leanSupervisorAllocationMode(allocation)).toBe("v8-1")
    expect(lean.leanCapsForAllocation(allocation)).toEqual(lean.LEAN_REPLAY_V7_CAPS)
    expect(lean.leanWritablePaths(allocation)).toContain(lean.leanCorrectionRoutePaths("diagnostic", "v8-1" as never).request)
    for (const attemptOrdinal of [undefined, 0, 2, 4]) expect(() => lean.admitLeanAllocation({ ...allocation, attemptOrdinal })).toThrow()
  })
  it("provides separate result-present refusal and result-absent terminal validators", () => {
    expect(typeof retained.authenticateLeanRetryClosureV8).toBe("function")
    expect(typeof retained.verifyLeanRetryTerminalOnlyV8).toBe("function")
  })
})
