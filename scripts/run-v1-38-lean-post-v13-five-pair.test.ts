/** HOST source-only tests. Static public source construction, no provider/Match. */
import { afterEach, expect, it, vi } from "vitest"
import { EventEmitter } from "node:events"
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as correction from "./run-v1-38-lean-correction.js"
import * as parent from "./run-v1-38-lean-baseline.js"
import * as reuseAPI from "./lib/v1-38-lean-baseline-reuse.js"
import { createLeanOwnedReuseHostFixture, LEAN_OWNED_HOST_SOURCE } from "./lib/v1-38-lean-owned-reuse-host-fixture.js"

const host = vi.hoisted(() => ({ child: null as any, failSample: false, samples: 0 }))
vi.mock("node:child_process", async original => {
  const real = await original<typeof import("node:child_process")>()
  return { ...real, fork: () => host.child, execFileSync: (command: string, args: string[], options: unknown) => {
    if (command === "ps") { if (host.failSample && ++host.samples > 1) throw new Error("HOST_OS_SAMPLE_FAILED"); return "100" }
    return real.execFileSync(command, args, options as never)
  } }
})
const r = (n: number) => labRoot("v14-connected-host", n)
const allocation = (route: "diagnostic" | "baseline", reuse?: ReturnType<typeof createLeanOwnedReuseHostFixture>) => {
  const b = lean.LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION
  const p = { schemaVersion: "lean-correction-predecessor-v1", chargedMatches: route === "diagnostic" ? 35 : 36, elapsedUpperBoundMs: 148694388, allocatedDiskBytes: 22777856, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: r(1), survivors: Array.from({ length: 695 }, (_, n) => ({ identity: `.strategy-lab/host-unmaterialized-history-${n}`, allocatedBytes: 0 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: reuse ? LEAN_OWNED_HOST_SOURCE : r(2), reviewRoot: r(3), coldRoot: reuse?.grant.coldRoot ?? r(4), planRoot: b.planRoot, candidateRoots: [r(5), r(6)], requestRoots: Array.from({ length: route === "diagnostic" ? 1 : 36 }, (_, n) => r(10 + n)), seed: reuse?.grant.seed ?? "v14-connected-host", route, reuseGrantRoot: reuse?.grant.root ?? r(46), supervisorDecisionRoot: b.approvalRoot, acceptedCheckRoot: route === "diagnostic" ? null : r(47), requestBytesRoot: r(48), dataReviewRoot: r(49), setupAccountingRoot: r(50), predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: b, attemptOrdinal: 1, priorClosureRoot: route === "diagnostic" ? "sha256:b80d8ad678f6d2ee81c999905d46256c482a8665e9c9f6aa10b9f125ef726169" : r(51), continuationRoot: r(52), acceptedReaderCloseRoot: route === "diagnostic" ? null : r(53) }, 8)
}
afterEach(() => { vi.restoreAllMocks(); host.child = null; host.failSample = false; host.samples = 0 })

it("parses five exact CLI/child identities but refuses incomplete live custody before reservation", async () => {
  for (const n of [1, 2, 3, 4, 5] as const) for (const route of ["diagnostic", "baseline"] as const) {
    const mode = `v14-${n}` as const, path = lean.leanCorrectionRoutePaths(route, mode).request
    expect(correction.leanCorrectionChildSupervisor(correction.leanCorrectionChildMode(route, mode))).toBe(mode)
    for (const action of ["prepare", "run", "verify", "verify-terminal"]) {
      const args = [`${action}-supervisor-${route}-${mode}`, "--request", path]
      expect(correction.parseLeanCorrectionCommand(args)).toMatchObject({ route, supervisor: mode, request: path })
      await expect(correction.leanCorrectionMain(args)).rejects.toThrow("POST_V13_CUSTODY_UNAVAILABLE")
    }
    expect(() => correction.readLeanCorrectionRequest(path, route, mode)).toThrow("POST_V13_CUSTODY_UNAVAILABLE")
  }
  for (const mode of ["v14-0", "v14-6", "v14-01"]) expect(() => correction.parseLeanCorrectionCommand([`run-supervisor-diagnostic-${mode}`, "--request", ".strategy-lab/invalid"])).toThrow()
})

it("selects owned reuse only from a strictly admitted v14 baseline, never a flag or malformed root", () => {
  const baseline = allocation("baseline"), diagnostic = allocation("diagnostic")
  expect(correction.leanCorrectionUsesOwnedPipeline(baseline)).toBe(true)
  expect(correction.leanCorrectionUsesOwnedPipeline(diagnostic)).toBe(false)
  expect(() => correction.leanCorrectionUsesOwnedPipeline({ ...baseline, caps: { ...baseline.caps, scratchBytes: 2000000001 } })).toThrow()
  expect(() => correction.leanCorrectionUsesOwnedPipeline({ ...baseline, timeboxExtension: lean.LEAN_PREPARATION_CONTINUATION_V13_EXTENSION })).toThrow()
})

it.each([false, true])("actual parent publishes strict reason-v2 with legacy observation flag=%s", async flag => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "v14-parent-host-"))), before = process.cwd()
  const a = allocation("diagnostic"), paths = lean.leanCorrectionRoutePaths("diagnostic", "v14-1")
  try {
    process.chdir(directory)
    mkdirSync(".strategy-lab", { mode: 0o700 }); mkdirSync(".planning/artifacts", { recursive: true }); mkdirSync(paths.temp, { mode: 0o700 })
    writeFileSync(paths.request, "HOST inert request bytes", { mode: 0o600 }); writeFileSync(paths.allocation, lean.leanCanonicalBytes(a), { mode: 0o600 })
    execFileSync("git", ["init", "-q"], { stdio: "pipe" })
    execFileSync("git", ["add", paths.allocation], { stdio: "pipe" })
    execFileSync("git", ["-c", "user.name=HOST fixture", "-c", "user.email=host-fixture@example.invalid", "commit", "-qm", "HOST inert allocation"], { stdio: "pipe" })
    const ledger = lean.createLeanLedger(paths.store, a)
    const child = Object.assign(new EventEmitter(), { pid: process.pid + 10000, exitCode: null as number | null, signalCode: null as string | null, send: () => true, kill: () => true })
    host.child = child
    const running = parent.runLeanBoundedParent({ ledger, requestPath: paths.request, allocationPath: paths.allocation, store: join(directory, paths.store), sourceRoot: a.sourceRoot, manifestRoot: () => a.sourceRoot, childMode: "HOST-never-real-forked", ...(flag ? { supervisorObservation: true as const } : {}) })
    child.emit("message", { ready: child.pid })
    await Promise.resolve(); await Promise.resolve()
    child.exitCode = 0; child.emit("exit", 0, null)
    await running
    const bytes = readFileSync(join(paths.store, parent.LEAN_SUPERVISOR_REASON_FILE)), reason = parent.validateLeanSupervisorReasonBytesV2(bytes)
    expect(reason.schemaVersion).toBe("lean-parent-supervisor-reasons-v2")
    expect(reason.observations).toMatchObject({ resourceSamplingOperation: "none", resourceSamplingSequence: 0, resourceSamplingExitObserved: false })
    expect(() => parent.validateLeanSupervisorReasonBytes(bytes)).toThrow()
    expect(lean.readLeanLedger(ledger).charges.size).toBe(0)
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
}, 10000)

it("actual selected owned pipeline retains the same issued graph and closes on rejecting full custody", async () => {
  const reuse = reuseAPI.validateLeanColdReuse(createLeanOwnedReuseHostFixture(), LEAN_OWNED_HOST_SOURCE), a = allocation("baseline", reuse)
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "v14-owned-host-"))), before = process.cwd(), ledger = { directory, allocation: a } as lean.LeanExperimentLedger
  const owned = vi.spyOn(reuseAPI, "admitLeanOwnedReuse"), closed = vi.spyOn(reuseAPI, "closeLeanOwnedReuse"), retained: unknown[] = []
  try {
    process.chdir(directory)
    await expect(correction.executeLeanCorrectionBaselinePipeline({ ledger, reuse, checkpoint: () => {}, retainArtifact: (name, value) => { if (name === "cold-reuse.json") retained.push(value) }, dispatch: async () => { throw new Error("HOST_PROVIDER_FORBIDDEN") } })).rejects.toThrow()
    expect(owned).toHaveBeenCalledTimes(1); expect(owned.mock.calls[0]![0]).toBe(reuse)
    expect(retained).toEqual([reuse]); expect(retained[0]).toBe(reuse)
    expect(closed).toHaveBeenCalledTimes(1)
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
}, 45000)
