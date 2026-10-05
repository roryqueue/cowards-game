import { afterEach, describe, expect, it, vi } from "vitest"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import { parseLeanCorrectionCommand, assertLeanCorrectionResources } from "./run-v1-38-lean-correction.js"
import { assessLeanPrefixCapacity } from "./run-v1-38-lean-experiment.js"
import * as session from "./lib/v1-38-lean-container-match-session.js"

const native = vi.hoisted(() => ({ deny: () => { throw new Error("NO_NATIVE_STARTUP_V5_FIXTURE") } }))
vi.mock("node:worker_threads", async original => ({ ...await original<typeof import("node:worker_threads")>(), Worker: native.deny }))
vi.mock("node:child_process", async original => ({ ...await original<typeof import("node:child_process")>(), Worker: native.deny, fork: native.deny, spawn: native.deny, spawnSync: native.deny, execFile: native.deny, execFileSync: native.deny, exec: native.deny, execSync: native.deny }))
const r = (name: string) => labRoot("startup-v5-test", name)
const predecessor = (elapsedUpperBoundMs = 28_800_001, chargedMatches = 23) => {
  const body = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches, elapsedUpperBoundMs, allocatedDiskBytes: 9_617_408, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r("history"), survivors: [{ identity: ".strategy-lab/synthetic-history", allocatedBytes: 4096 }] }
  return { ...body, root: labRoot(body.schemaVersion, body) }
}
const input = () => ({ sourceRoot: r("source"), reviewRoot: r("review"), coldRoot: r("cold"), planRoot: lean.LEAN_STARTUP_SUPPLEMENT_ROOT, candidateRoots: [r("a"), r("b")], requestRoots: [r("request")], seed: "synthetic-v5", route: "diagnostic" as const, reuseGrantRoot: r("reuse"), supervisorDecisionRoot: lean.LEAN_STARTUP_APPROVAL_ROOT, acceptedCheckRoot: null, requestBytesRoot: r("bytes"), dataReviewRoot: r("data"), setupAccountingRoot: r("setup"), predecessor: predecessor(), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root })
afterEach(() => vi.restoreAllMocks())
describe("contracts", () => {
  it("selects twelve hours only for strictly admitted prospective v5", () => {
    expect(lean.LEAN_CAPS.elapsedMs).toBe(28_800_000)
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 5)
    expect(lean.leanCapsForAllocation(a).elapsedMs).toBe(43_200_000)
    expect(lean.admitLeanAllocation(a).root).toBe(a.root)
    expect(() => lean.leanCapsForAllocation({ ...a, caps: lean.LEAN_CAPS })).toThrow()
    expect(() => lean.leanCapsForAllocation({ ...a, schemaVersion: "unknown" })).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), supervisorDecisionRoot: r("foreign") }, 5)).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), predecessor: predecessor(43_200_000) }, 5)).toThrow()
    expect(() => lean.createLeanSupervisorCorrectionAllocation({ ...input(), predecessor: predecessor(28_800_001, 22) }, 5)).toThrow()
  })
  it("keeps v5 paths and CLI explicit and separate from consumed versions", () => {
    const p = lean.leanCorrectionRoutePaths("diagnostic", "v5")
    expect(p.store).toContain("-v5")
    expect(p.store).not.toBe(lean.leanCorrectionRoutePaths("diagnostic", "v4").store)
    expect(parseLeanCorrectionCommand(["run-supervisor-diagnostic-v5", "--request", p.request]).supervisor).toBe("v5")
    expect(() => parseLeanCorrectionCommand(["run-supervisor-diagnostic-v5", "--request", lean.leanCorrectionRoutePaths("diagnostic", "v4").request])).toThrow()
  })
  it("actual resource predicates use admitted caps without widening old defaults", () => {
    const a = lean.createLeanSupervisorCorrectionAllocation(input(), 5)
    const m = { childRss: 1000, parentRss: 1000, freeBytes: 20_000_000_000, allocatedBytes: 1000, elapsedMs: 28_800_001 }
    expect(() => assessLeanPrefixCapacity(m)).toThrow()
    expect(assessLeanPrefixCapacity(m, undefined, a)).toBe(2000)
    const c = { elapsedMs: m.elapsedMs, charged: 23, physicalBytes: 1000, childRss: 1000, parentRss: 1000, freeBytes: m.freeBytes, availableMemoryBytes: 2_000_000_000 }
    expect(() => assertLeanCorrectionResources(c)).toThrow()
    expect(assertLeanCorrectionResources(c, a)).toBeGreaterThan(0)
    expect(() => assessLeanPrefixCapacity({ ...m, elapsedMs: 43_200_000 }, undefined, a)).toThrow()
  })
})
describe("runtime", () => {
  it("denies native execution by default", () => expect(native.deny).toThrow("NO_NATIVE"))
  it("gates original hostile evaluation behind trusted READY and GO", () => {
    const source = session.buildLeanStartupWorkerHarnessV5()
    expect(source.indexOf("trustedPublishReadyV5()")).toBeLessThan(source.indexOf("const runStrategy ="))
    expect(source.indexOf("trustedWaitGoV5()")).toBeLessThan(source.indexOf("const runStrategy ="))
    expect(session.buildLeanContainerBrokerSourceV5()).toContain("superviseLeanStartupV5")
  })
})
describe("closure", () => { it("never treats source tests as empirical authority", () => expect(lean.LEAN_CAPS.matches).toBe(300)) })
