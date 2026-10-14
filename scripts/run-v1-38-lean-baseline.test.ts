import { afterEach, describe, expect, it, vi } from "vitest"
import { EventEmitter } from "node:events"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { currentBaselineSlotKind, createLeanCorrectionAllocation, createLeanCurrentBaselineAllocation, leanCanonicalBytes, leanBytesRoot, LEAN_CAPS, LEAN_CLOSED_V7, type LeanExperimentLedger } from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as lean from "../packages/strategy-lab/src/league/lean-experiment.js"
import * as parentApi from "./run-v1-38-lean-baseline.js"
import { admitsLeanBaselineReviewAgents, assertLeanBaselineWritableScope, deriveLeanBaselineCandidateRoots, deriveLeanBaselineRequestRoots, leanBaselinePair, leanBaselineSourceManifest, parseLeanBaselineCommand } from "./run-v1-38-lean-baseline.js"
import { leanBaselineMatchSeed } from "./lib/v1-38-lean-baseline-match.js"
import { validateLeanPreparationContinuationReasonJoinV13 } from "./lib/v1-38-lean-correction-retained.js"
import { assertLeanSupervisorReasonCustodyV2 } from "./lib/v1-38-lean-baseline-retained.js"
import * as continuationRetainedReader from "./lib/v1-38-lean-baseline-retained.js"

const root = (name: string) => labRoot("baseline-cli-test", name)
import * as continuationGit from "./lib/v1-38-lean-container-match-session.js"
import * as fs from "node:fs"
import * as childProcess from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as leagueHost from "./run-v1-38-serious-league.js"
import * as continuationHelper from "./lib/v1-38-lean-baseline-continuation.js"
import * as factoryImplementation from "./v1-38-factory-implementation.js"
import * as contracts from "../packages/strategy-lab/src/contracts.js"
import * as continuationAuthority from "./lib/v1-38-lean-experiment-authority.js"
import * as continuationSource from "./lib/v1-38-lean-baseline-source.js"
import { leanColdProcedureRoot } from "./lib/v1-38-lean-baseline-pipeline.js"
import { checkFactoryBoundaries } from "./check-v1-38-factory-boundaries.js"
it("[continuation-remaining-overhead] [VF-REM-BUILTIN-01] preserves the actual audited factory reachability boundary without direct consumer util imports", () => {
  const result = checkFactoryBoundaries()
  expect(result).toMatchObject({ ok: true, violations: [] }); expect(result.scannedFiles).toBeGreaterThan(1000)
  for (const path of ["scripts/lib/v1-38-lean-baseline-continuation.ts", "scripts/run-v1-38-lean-baseline.ts"]) expect(fs.readFileSync(resolve(path), "utf8")).not.toMatch(/from ["']node:util["']/u)
  const trap = vi.fn(() => { throw new Error("HOSTILE_INSPECTION") }), proxy = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap }), revoked = Proxy.revocable({}, {})
  revoked.revoke()
  expect(lean.leanHostIsProxy(proxy)).toBe(true); expect(lean.leanHostIsProxy(revoked.proxy)).toBe(true); expect(lean.leanHostIsProxy({})).toBe(false)
  expect(lean.leanHostIsNativeError(new Error("inert"))).toBe(true); expect(lean.leanHostIsNativeError(proxy)).toBe(false); expect(lean.leanHostIsNativeError(revoked.proxy)).toBe(false)
  expect(trap).not.toHaveBeenCalled()
  process.stdout.write(`AUDITED_FACTORY_BOUNDARY_REGRESSION ${JSON.stringify(result)}\n`)
}, 30000)
describe("[continuation-overhead] actual V2 context complete guard", () => {
  const constructionCensored = Symbol("bounded-construction-censor")
  const cadenceCounts = () => ({ fullVisits: 0, liveVisits: 0, fullPasses: 0, livePasses: 0, rawHashes: 0, windowRawHashes: 0, journalBytesRawHashes: 0, sourceRawHashes: 0, domainHashes: 0, windowDomainHashes: 0, physicalSamples: 0, chunks: 0, headChecks: 0, descriptorReads: 0, reservations: 0, memberships: 0 })
  const invokeRun = async (request: string) => {
    const send = Object.getOwnPropertyDescriptor(process, "send")
    Object.defineProperty(process, "send", { value: undefined, configurable: true, writable: true })
    try { return await parentApi.runLeanBaselineContinuationV2(request) }
    finally { if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send") }
  }
  it.each([{ n: 26, u: 128 }, { n: 2280, u: 2352 }])("[continuation-stage-cadence-scale] bounded actual V6 visitor N$n/U$u with TWO full barrier passes or construction censor", async ({ n, u }) => {
    const totalStart = performance.now()
    let report: Record<string, any> = {}
    try { await fixture((c, f) => {
      const setupMs = performance.now() - f.fixtureStartMs, stopAt = totalStart + 8000, censored = Symbol("bounded-source-assay")
      let callbacks = 0, rowsCompleted = 0, maximumGuardMs = 0, status: "COMPLETE" | "CENSORED" = "COMPLETE", guardMs = 0
      f.clearObservations(); f.hashes.mockClear()
      const callback = () => {
        if (performance.now() + Math.max(800, maximumGuardMs * 3) >= stopAt) throw censored
        const began = performance.now(); c.guard(); const elapsed = performance.now() - began
        guardMs += elapsed; maximumGuardMs = Math.max(maximumGuardMs, elapsed); callbacks++
      }
      c.stage("archive", () => {
        try {
          // Exercise a real source chunk owner with the same active caller,
          // followed by the ACTUAL selected-V6 inventory visitor, not a loop.
          const source = c.manifest.implementationEntries[0]!
          const sourceBytes = continuationHelper.readLeanContinuationBoundedBytesV2(source.path, 4194304, 0o644, callback)
          lean.leanBytesRoot(sourceBytes)
          f.visitor.active = true
          const rows = continuationHelper.inventoryLeanContinuationSurvivorsV2(f.assayRows, [], () => { throw new Error("NO_GIT_FOR_SYNTHETIC_CLOSED_ROWS") }, callback, c.window)
          rowsCompleted = rows.length; expect(rows).toHaveLength(n)
        } catch (error) { if (error !== censored) throw error; status = "CENSORED" }
        finally { f.visitor.active = false }
      })
      const counts = { ...f.cadence }
      if (n === 26) { expect(status).toBe("COMPLETE"); expect(f.visitor.completed).toBe(n); expect(rowsCompleted).toBe(n) }
      expect(counts.fullPasses).toBe(2); expect(counts.fullVisits).toBe(2 * u)
      expect(counts.livePasses).toBeGreaterThan(0); expect(counts.liveVisits).toBeGreaterThan(0)
      for (const key of ["rawHashes", "windowRawHashes", "journalBytesRawHashes", "sourceRawHashes", "physicalSamples", "chunks", "headChecks", "descriptorReads", "reservations", "memberships"] as const) expect(counts[key], key).toBeGreaterThan(0)
      expect(performance.now() - totalStart).toBeLessThan(8000)
      report = { n, u, status, rowsCompleted: f.visitor.completed, callbacks, counts, setupMs: Math.ceil(setupMs), sampleMs: Math.ceil(performance.now() - f.fixtureStartMs - setupMs), guardMs: Math.ceil(guardMs), overlappingControllerMs: Math.ceil(f.timing.identityMs), overlappingPhysicalMs: Math.ceil(f.timing.physicalMs), overlappingReadMs: Math.ceil(f.timing.readMs), timingsOverlap: true, addedFixtureBytesBound: f.fixtureExtraBound, contextAuthenticated: false, sourceAndCustodyInputsMocked: true, resourceInputsMocked: true, sourceManifestProjected: false, legacyInventoryOnlyFullVisitAlgebra: 2 * u * (2 * n + 1), assuranceEquivalent: false, staticEditAndRestoreBetweenBarriersMayEvade: true, runtimeFitEstablished: false }
    }, "20261014-v6", { n, u, constructionStopAt: totalStart + 6500, onConstructionCensor: (counts, setupMs) => { report = { n, u, status: "CENSORED-before-visitor", rowsCompleted: 0, callbacks: 0, counts, setupMs: Math.ceil(setupMs), sampleMs: 0, inventoryCoverage: 0, fullBarrierCoverage: 0, addedFixtureBytesBound: u * 16384 + n * 1024, contextAuthenticated: false, sourceAndCustodyInputsMocked: true, resourceInputsMocked: true, sourceManifestProjected: false, runtimeFitEstablished: false, assuranceEquivalent: false, staticEditAndRestoreBetweenBarriersMayEvade: true } } }) }
    catch (error) { if (error !== constructionCensored) throw error }
    report.totalMs = Math.ceil(performance.now() - totalStart); report.cleanupIncluded = true
    report.cleanupMs = Math.max(0, report.totalMs - report.setupMs - report.sampleMs)
    report.pureWindowDomainHashInputsMocked = true
    report.journalRawCategoryIncludesEmptySyntheticBuffers = true
    report.addedFixtureBytesBound = u * 16384 + n * 1024 + 3 * 1024 * 1024
    expect(report.totalMs).toBeLessThan(8000); expect(report.addedFixtureBytesBound).toBeLessThanOrEqual(67108864)
    process.stdout.write(`FINITE_SYNTHETIC_STAGE_CADENCE_ASSAY ${JSON.stringify(report)}\n`)
  }, 15000)
  const fixture = async (run: (c: ReturnType<typeof parentApi.openLeanBaselineContinuationContextV2>, f: { passes: string[][]; reservations: number[]; hashes: { mockClear: () => unknown; mock: { calls: Parameters<typeof contracts.labRoot>[] } }; head: { value: string }; w: lean.LeanBaselineContinuationWindowV2; clearObservations: () => void; observationCounts: () => { physical: number; chunks: number }; timing: { identityMs: number; physicalMs: number; readMs: number; realpathMs: number }; assayRows: continuationHelper.LeanContinuationInventoryRowV2[]; fixtureStartMs: number; fixtureExtraBound: number; authBoundary: { guard?: (additional?: number) => continuationHelper.LeanContinuationFrontier; error?: unknown; attempts: number; completed: number }; realpaths: ReturnType<typeof vi.spyOn>; cadence: ReturnType<typeof cadenceCounts>; visitor: { active: boolean; completed: number } }) => void | Promise<void>, namespace: lean.LeanBaselineContinuationWindowV2["routeNamespace"] = "20261012-v3", assay?: { n: number; u: number; constructionStopAt?: number; onConstructionCensor?: (counts: ReturnType<typeof cadenceCounts>, setupMs: number) => void }) => {
    const fixtureStartMs = performance.now()
    const cadence = cadenceCounts()
    const constructionDeadline = () => { if (assay?.constructionStopAt !== undefined && performance.now() >= assay.constructionStopAt) { assay.onConstructionCensor?.({ ...cadence }, performance.now() - fixtureStartMs); throw constructionCensored } }
    const frames: { mode: "full" | "live"; body: boolean; current: boolean }[] = []
    const visitor = { active: false, completed: 0, observations: new Map<string, number>(), terminalObservation: new Map<string, number>() }
    // Bounded SOURCE fixture only: no statfs/capacity probe before construction.
    const fixtureExtraBound = assay ? assay.u * 16384 + assay.n * 1024 + 3 * 1024 * 1024 : 0
    expect(fixtureExtraBound).toBeLessThanOrEqual(64 * 1024 * 1024)
    expect(process.memoryUsage().heapUsed + fixtureExtraBound).toBeLessThan(768 * 1024 * 1024)
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-context-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), p = namespace === "20261014-v6" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V6 : namespace === "20261013-v5" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V5 : lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, head = { value: "c".repeat(40) }, sourceHead = "b".repeat(40), reviewedHead = "a".repeat(40)
    const sourcePaths = [...parentApi.LEAN_BASELINE_CONTINUATION_OWNED_PATHS, "scripts/run-v1-38-lean-baseline.sh", "scripts/lib/v1-38-lean-baseline-analysis.ts", "scripts/lib/v1-38-lean-baseline-metrics.ts", "scripts/lib/v1-38-lean-cold-corpus.ts", "scripts/lib/v1-38-lean-seal-metadata.ts", "scripts/lib/v1-38-lean-training-adapter.ts", "scripts/lib/v1-38-lean-baseline.ts", "packages/strategy-lab/src/league/lean-training.ts", "scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-lean-child-cli-terminal.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts", "packages/strategy-lab/src/league/lean-training.test.ts", "scripts/lib/v1-38-lean-baseline-analysis.test.ts", "scripts/lib/v1-38-lean-baseline-source.test.ts", "scripts/lib/v1-38-lean-startup-supervisor-v8.mjs", "AGENTS.md"]
    const write = (path: string, bytes: string | Uint8Array, mode = 0o644) => { const absolute = resolve(path); fs.mkdirSync(resolve(absolute, ".."), { recursive: true }); fs.writeFileSync(absolute, bytes, { mode }); fs.chmodSync(absolute, mode) }
    const actualStat = fs.lstatSync, actualExists = fs.existsSync, stat = vi.spyOn(fs, "lstatSync").mockImplementation(((path: string, ...args: unknown[]) => { const frame = frames.at(-1), absolute = resolve(String(path)); if (frame && !frame.body && !frame.current) cadence[frame.mode === "full" ? "fullVisits" : "liveVisits"]++; const result = (actualStat as any)(absolute, ...args); if (visitor.active && frame?.mode === "full" && frame.body && !frame.current && visitor.terminalObservation.has(absolute)) { const count = (visitor.observations.get(absolute) ?? 0) + 1; visitor.observations.set(absolute, count); if (count === visitor.terminalObservation.get(absolute)) visitor.completed++ } return result }) as typeof fs.lstatSync), exists = vi.spyOn(fs, "existsSync").mockImplementation(path => actualExists(resolve(String(path))))
    const factory = vi.spyOn(factoryImplementation, "factoryAssessmentImplementationManifest").mockReturnValue({ entries: [], root: root("bounded-factory") })
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never), usage = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 }), available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
    const timing = { identityMs: 0, physicalMs: 0, readMs: 0, realpathMs: 0 }
    const actualPhysical = lean.cumulativeLeanPhysicalBytes, actualRead = fs.readSync, actualRealpath = fs.realpathSync
    const physical = vi.spyOn(lean, "cumulativeLeanPhysicalBytes").mockImplementation(l => { cadence.physicalSamples++; const at = performance.now(); try { return namespace === "20261014-v6" ? 88924160 : actualPhysical(l) } finally { timing.physicalMs += performance.now() - at } })
    const scratch = namespace === "20261014-v6" && assay ? vi.spyOn(lean, "measureLeanPhysicalBytes").mockReturnValue(0) : undefined
    let compactV6Spies = () => {}
    const chunks = vi.spyOn(fs, "readSync").mockImplementation(((...args: any[]) => { cadence.chunks++; const at = performance.now(); try { return Reflect.apply(actualRead, fs, args) } finally { timing.readMs += performance.now() - at; compactV6Spies() } }) as typeof fs.readSync)
    const realpaths = vi.spyOn(fs, "realpathSync").mockImplementation(((...args: any[]) => { const at = performance.now(); try { return Reflect.apply(actualRealpath, fs, args) } finally { timing.realpathMs += performance.now() - at } }) as typeof fs.realpathSync)
    const core = vi.spyOn(childProcess, "execFileSync").mockImplementation(((command: string) => command === "ps" ? "100\n" : "0\n") as typeof childProcess.execFileSync), originalArgs = process.execArgv, connected = Object.getOwnPropertyDescriptor(process, "connected")
    Object.defineProperty(process, "connected", { value: false, writable: true, configurable: true })
    const passes: string[][] = [], reservations: number[] = [], actualIdentity = continuationHelper.createLeanContinuationIdentityGuardV2, identity = vi.spyOn(continuationHelper, "createLeanContinuationIdentityGuardV2")
    identity.mockImplementation((pins, rows) => { const guard = actualIdentity(pins, rows); return () => { const before = stat.mock.calls.length, at = performance.now(); try { guard(); passes.push(stat.mock.calls.slice(before).map(([path]) => String(path))) } finally { timing.identityMs += performance.now() - at } } })
    let carried: any
    const authBoundary: { guard?: (additional?: number) => continuationHelper.LeanContinuationFrontier; error?: unknown; attempts: number; completed: number } = { attempts: 0, completed: 0 }
    const actualCarry = continuationHelper.authenticateLeanBaselineContinuationCarryV2
    const carry = vi.spyOn(continuationHelper, "authenticateLeanBaselineContinuationCarryV2").mockImplementation((git, rows, guard, window) => {
      if (assay && namespace !== "20261014-v6") {
        authBoundary.guard = guard as (additional?: number) => continuationHelper.LeanContinuationFrontier; authBoundary.attempts++
        // Execute the REAL authenticator, denying at an absent old descriptor
        // resolved inside this fixture. No historical content is read, and no
        // context/authentication is represented as completed or admitted.
        expect(fs.existsSync(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS.allocation))).toBe(false)
        try { const result = actualCarry(git, rows, guard, window); authBoundary.completed++; return result } catch (error) { authBoundary.error = error; throw error }
      }
      // Older isolated context unit fixture: mocked closed-history seam only.
      for (const additional of [0, 65536, 0]) { reservations.push(additional); guard(additional) }; return carried
    })
    const actualDomain = contracts.labRoot
    const hashes = vi.spyOn(contracts, "labRoot"), git = vi.spyOn(continuationGit, "readLeanBaselineContinuationGitV2").mockImplementation(args => {
      if (args[0] === "rev-parse" && args[1] === "HEAD") cadence.headChecks++
      if (args[0] === "rev-parse") return Buffer.from(`${head.value}\n`)
      if (args[0] === "merge-base") return Buffer.alloc(0)
      if (args[0] === "rev-list") return Buffer.from(`${head.value} ${sourceHead}\n`)
      if (args[0] === "diff") return Buffer.from(`${p.allocation}\n`)
      if (args[0] === "show") { const colon = args[1]!.indexOf(":"); expect([reviewedHead, sourceHead, head.value]).toContain(args[1]!.slice(0, colon)); return fs.readFileSync(resolve(args[1]!.slice(colon + 1))) }
      throw new Error("unexpected inert Git operation")
    })
    // Capture only finite counters; clearing Vitest call history cannot erase
    // the measured visits/hashes/resources. No production hooks are suppressed.
    const originalDomain = hashes.getMockImplementation() ?? actualDomain
    const fixtureWindowDomainRoots = new Map<string, ReturnType<typeof contracts.labRoot>>()
    hashes.mockImplementation((domain, value) => { cadence.domainHashes++; if (domain === "lean-baseline-continuation-window-v2") { cadence.windowDomainHashes++; if (assay && namespace === "20261014-v6") { const key = JSON.stringify(value), previous = fixtureWindowDomainRoots.get(key); if (previous) return previous; const result = originalDomain(domain, value); if (fixtureWindowDomainRoots.size < 8) fixtureWindowDomainRoots.set(key, result); return result } } return originalDomain(domain, value) })
    const rawOwners = new WeakMap<Uint8Array, string>()
    const actualRaw = lean.leanBytesRoot, mappedRoots = new Map<string, `sha256:${string}`>(), raw = namespace === "20261014-v6" ? vi.spyOn(lean, "leanBytesRoot").mockImplementation(bytes => { cadence.rawHashes++; const owner = rawOwners.get(bytes); if (owner === p.window) cadence.windowRawHashes++; if (owner?.endsWith("/ledger.ndjson") || owner?.endsWith("/time.ndjson") || bytes.byteLength === 0) cadence.journalBytesRawHashes++; if (owner && sourcePaths.includes(owner)) cadence.sourceRawHashes++; const digest = actualRaw(bytes); return mappedRoots.get(digest) ?? digest }) : undefined
    const actualController = continuationHelper.createLeanContinuationStageControllerV6, controllers = namespace === "20261014-v6" ? vi.spyOn(continuationHelper, "createLeanContinuationStageControllerV6").mockImplementation((pins, rows, roles, binding, current, policy) => {
      const c = actualController(pins, rows, roles, binding, () => { constructionDeadline(); const frame = frames.at(-1); if (frame) frame.current = true; try { current() } finally { if (frame) frame.current = false } }, policy)
      return Object.freeze({ ...c,
        live<T>(context: object, body: () => T): T { const frame = { mode: "live" as const, body: false, current: false }; frames.push(frame); const at = performance.now(); try { const result = c.live(context, () => { frame.body = true; try { return body() } finally { frame.body = false } }); cadence.livePasses += 2; return result } finally { frames.pop(); timing.identityMs += performance.now() - at } },
        withStage<T>(context: object, kind: continuationHelper.LeanContinuationStageV6, body: () => T): T { const frame = { mode: "full" as const, body: false, current: false }; frames.push(frame); const at = performance.now(); try { const result = c.withStage(context, kind, () => { frame.body = true; try { return body() } finally { frame.body = false } }); cadence.fullPasses += 2; return result } finally { frames.pop(); timing.identityMs += performance.now() - at } },
      })
    }) : undefined
    const actualDescriptor = continuationHelper.readLeanContinuationBoundedBytesV2, descriptors = namespace === "20261014-v6" ? vi.spyOn(continuationHelper, "readLeanContinuationBoundedBytesV2").mockImplementation((path, maximum, mode, guard) => { cadence.descriptorReads++; const bytes = actualDescriptor(path, maximum, mode, bytes => { cadence.reservations++; guard(bytes) }); rawOwners.set(bytes, path); return bytes }) : undefined
    const actualMembers = fs.readdirSync, members = namespace === "20261014-v6" ? vi.spyOn(fs, "readdirSync").mockImplementation(((...args: any[]) => { cadence.memberships++; return Reflect.apply(actualMembers, fs, args) }) as typeof fs.readdirSync) : undefined
    // V6 does more always-fresh raw checks, not fewer. Bound mock call custody
    // rather than retaining every large resource/root argument during setup.
    compactV6Spies = () => { if (namespace === "20261014-v6") { stat.mockClear(); realpaths.mockClear(); physical.mockClear(); chunks.mockClear(); hashes.mockClear(); usage.mockClear(); disk.mockClear(); available.mockClear(); core.mockClear(); git.mockClear(); raw?.mockClear(); descriptors?.mockClear(); members?.mockClear(); controllers?.mockClear() } }
    let clock: ReturnType<typeof vi.spyOn> | undefined
    try {
      for (const path of new Set([...sourcePaths, ...parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS])) write(path, assay && namespace === "20261014-v6" && sourcePaths.includes(path) && path !== "AGENTS.md" && !parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS.includes(path) ? "" : "synthetic public fixture", path.endsWith(".sh") ? 0o755 : 0o644)
      const base = parentApi.leanBaselineContinuationSourceManifestV2(), planRoot = base.planningEntries.find(row => row.path.endsWith("265-16-BASELINE-CONTINUATION-PLAN-20261012.md"))!.root
      const sg: parentApi.LeanContinuationSourceGateV2 = { schemaVersion: "lean-baseline-continuation-source-gate-v2", plan_check: "passed", source_review: "passed", root_validation: "passed", source_verification: "passed", commands_closed: true, reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceAuthor: "inert-author", sourceReviewer: "inert-reviewer", sourceVerifier: "inert-verifier" }
      const wb = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-overhead", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1791840227000, anchorMs: 1791840227000, carryMs: 492285903, capMs: 521085903, deadlineMs: 1791869027000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: namespace, ...(namespace === "20261014-v6" ? { approvedAtMs: 1791978643000, anchorMs: 1791978643000, carryMs: 630701903, capMs: 659501903, deadlineMs: 1792007443000 } : {}), reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceGateRoot: labRoot(sg.schemaVersion, sg), planRoot, runOperator: "inert-runner", readerOperator: "inert-reader" }, w = { ...wb, root: labRoot(wb.schemaVersion, wb) }
      const dg: parentApi.LeanContinuationDataGateV2 = { schemaVersion: "lean-baseline-continuation-data-gate-v2", status: "passed", grantId: w.grantId, windowRoot: w.root, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(w)), reviewedSourceHead: reviewedHead, sourceRoot: base.root, sourceGateRoot: w.sourceGateRoot, planRoot, approvalEvidence: w.approvalEvidence, runOperator: w.runOperator, readerOperator: w.readerOperator, dataReviewer: "inert-data-reviewer", commands_closed: true }
      write(p.gates, `\`\`\`json\n${Buffer.from(leanCanonicalBytes(sg))}\n\`\`\`\n\`\`\`json\n${Buffer.from(leanCanonicalBytes(dg))}\n\`\`\`\n`); write(p.window, leanCanonicalBytes(w), 0o600)
      clock = vi.spyOn(Date, "now").mockReturnValue(w.anchorMs); process.execArgv = ["--import", "tsx"]
      vi.stubEnv("TSX_DISABLE_CACHE", "1"); vi.stubEnv("NODE_DISABLE_COMPILE_CACHE", "1"); vi.stubEnv("TMPDIR", resolve(p.temp)); for (const key of ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"]) vi.stubEnv(key, undefined)
      const manifest = parentApi.leanBaselineContinuationDataManifestV2(w, parentApi.leanBaselineContinuationSourceManifestV2()), seed = "inert-overhead", coldRoot = leanColdProcedureRoot(seed)
      const request: parentApi.LeanBaselineContinuationRequestV2 = { schemaVersion: "lean-baseline-continuation-request-v2", seed, sourceHead, sourceRoot: base.root, planningRoot: manifest.planningRoot, planRoot, reviewRoot: w.sourceGateRoot, coldRoot, candidateRoots: parentApi.deriveLeanBaselineCandidateRoots(coldRoot), requestRoots: parentApi.deriveLeanBaselineRequestRoots({ seed, coldRoot, planRoot, sourceRoot: base.root }), offlineOverheadMs: w.offlineOverheadMs, sourceAuthor: sg.sourceAuthor, runOperator: w.runOperator, readerOperator: w.readerOperator, windowRoot: w.root, windowBytesRoot: manifest.windowBytesRoot, sourceGateRoot: w.sourceGateRoot, dataReviewRoot: manifest.dataReviewRoot, manifestRoot: manifest.manifestRoot }
      write(p.request, leanCanonicalBytes(request), 0o600); fs.mkdirSync(resolve(p.temp), { mode: 0o700 })
      const spentNames: string[] = [], spentRoots = new Map<string, `sha256:${string}`>()
      if (assay && namespace === "20261014-v6") {
        // Public synthetic opaque bytes, digest-mapped ONLY in this fixture.
        // G independently tests preservation; this measures real visitor cadence,
        // never authenticates private history or supplies real custody.
        const v3 = lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, v4 = lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, v5 = lean.LEAN_BASELINE_CONTINUATION_PATHS_V5
        const opaque: [string, number, number, string][] = [
          [v3.request, 4041, 0o600, "900e97e973ac31c596d1f5f1b8b89e1b8e532310e0b2d6e67053fbe9a8321065"], [v3.window, 935, 0o600, "2c0c2905fea2e4a264aac99df251e5aa89d0b2c44588453d3c41586f4b3a881d"],
          [v4.window, 935, 0o600, "98b0cd906323554e3c0cefb96700c317a9bd2e346135c7560d715b87eb303ba6"], [v4.request, 4056, 0o600, "bd17509fee8d2138b89b4a114224f1ee1ee009217475e924d6dd7cdfd90466c7"],
          [v4.allocation, 17366, 0o644, "19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f"], [join(v4.store, "allocation.json"), 17366, 0o600, "19aeee9f9416849b4e7bb214afa7d470349f36e302b09bda700c7a50e717938f"],
          [join(v4.store, "carry.json"), 746080, 0o600, "7bb1e101e0938ab8497311444e81ad30578f41d372a3c7999e61dfddad90f5a7"], [join(v4.store, "source-manifest.json"), 208491, 0o600, "35c507b2a0fd12b3d131671ba6596f8e4dcfcafa62676fcfa703c672d9dee508"], [join(v4.store, "source-hold.json"), 146345, 0o600, "744be76efaaaeca29076208f2da70a5f755569b93c6a47d0622b3aa1f4525911"], [v4.claim, 1002, 0o600, "14cc57d66661a98c8f9150842b441310c8a70d29fef5186b5c58a49e62c9e45c"],
          [v5.window, 929, 0o600, "989dc4984483ac4ebcecb154e2c8b9256657d0cbb21258b50fb4cdaa99481faa"], [v5.request, 4051, 0o600, "386e72a26e326d7f09c9c93a6f087c481a7ff0117be284fcb72aeb0aa692e6b1"], [v5.allocation, 17360, 0o644, "439ff997177d812aebc8194b77dd6dcc30353541b0f5061f3eea036f32c7c7c6"], [join(v5.store, "allocation.json"), 17360, 0o600, "439ff997177d812aebc8194b77dd6dcc30353541b0f5061f3eea036f32c7c7c6"],
          [join(v5.store, "carry.json"), 749813, 0o600, "a6168503f6bee69d22688a003c7acb1c0d850647cdc447f81d10747150eca348"], [join(v5.store, "source-manifest.json"), 208495, 0o600, "e01c2cc7f6fd49185f92ded151ddc0b4bc6c26347cd3e3b597a76b099943388a"], [join(v5.store, "source-hold.json"), 146600, 0o600, "e0ff6a1879e9cfb90f5303097a2a1e20a130be0ada3f3b42bfe63949ec79cb55"], [v5.claim, 1011, 0o600, "e2e94f1a122f3c994a09c4ccfb028d630fae52abb0c0aaacce733e4dd57cb13c"],
          ...[v4, v5].flatMap(paths => ["ledger.ndjson", "time.ndjson"].map(name => [join(paths.store, name), 0, 0o600, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"] as [string, number, number, string])),
        ]
        for (const paths of [v4, v5]) for (const path of [paths.store, paths.temp]) { fs.mkdirSync(resolve(path), { recursive: true, mode: 0o700 }); fs.chmodSync(resolve(path), 0o700); spentNames.push(path) }
        opaque.forEach(([path, size, mode, expected], i) => { const bytes = Buffer.alloc(size, 65 + i); write(path, bytes, mode); const root = `sha256:${expected}` as const; mappedRoots.set(actualRaw(bytes), root); spentRoots.set(path, root); spentNames.push(path) })
      }
      const row = (path: string): continuationHelper.LeanContinuationInventoryRowV2 => { const s = fs.lstatSync(resolve(path)); return { path, kind: s.isDirectory() ? "directory" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o7777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot: spentRoots.get(path) ?? null, ...(s.isDirectory() ? { members: fs.readdirSync(resolve(path)).sort() } : {}) } }
      const watched = sourcePaths[0]!, inventory: continuationHelper.LeanContinuationInventoryRowV2[] = [row(watched)], assayRows: continuationHelper.LeanContinuationInventoryRowV2[] = [], custody = { synthetic: true }
      if (namespace === "20261014-v6") { write("scripts/closed-cost.txt", "closed history"); inventory.push(row("scripts/closed-cost.txt")) }
      if (assay) {
        const pinnedPaths = new Set([...manifest.entries.map(row => row.path), p.request, p.claim, p.allocation, ...["allocation.json", "carry.json", "source-manifest.json", "source-hold.json"].map(name => join(resolve(p.store), name))].map(path => resolve(path)))
        const available = [...new Set([...spentNames, ...sourcePaths])].slice(0, assay.n)
        while (available.length < assay.n) { const path = `scripts/sensitivity-row-${available.length}.txt`; write(path, "x"); available.push(path) }
        assayRows.push(...available.map(row))
        // Each unchanged ordinary/directory row ends at its second outer stat.
        // Opaque spent files additionally execute the real bounded descriptor's
        // initial stat + hold + TWO per chunk + final hold before the outer close.
        for (const row of assayRows) visitor.terminalObservation.set(resolve(row.path), spentRoots.has(row.path) ? 5 + 2 * Math.ceil(row.bytes / 65536) : 2)
        inventory.splice(0, inventory.length, ...assayRows)
        for (const item of inventory) pinnedPaths.add(resolve(item.path))
        for (let i = 0; pinnedPaths.size < assay.u; i++) { const path = `scripts/sensitivity-identity-${i}.txt`; write(path, "x"); inventory.push(row(path)); pinnedPaths.add(resolve(path)) }
        expect(pinnedPaths.size).toBe(assay.u)
      }
      const pb = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: 465187899, allocatedDiskBytes: 88924160, residualDiskBytes: 4096, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: root("old-cost"), closedCapsuleRoot: labRoot("lean-baseline-continuation-closed-capsule-v2", custody), custodyRoot: labRoot("lean-baseline-continuation-custody-v2", custody), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v2", inventory), qualifiedReaderAuthority: "cost_only" as const }, predecessor = { ...pb, root: labRoot(pb.schemaVersion, pb) }
      carried = { carry: predecessor, inventory, custody }
      const allocation = lean.createLeanBaselineContinuationAllocationV2({ ...Object.fromEntries(["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "sourceHead", "planningRoot", "manifestRoot", "sourceGateRoot", "dataReviewRoot", "windowBytesRoot"].map(key => [key, (request as any)[key]])) as lean.LeanBaselineContinuationInputV2, requestBytesRoot: leanBytesRoot(leanCanonicalBytes(request)), predecessor, window: w })
      const l = lean.createLeanLedger(resolve(p.store), allocation)
      write(p.allocation, leanCanonicalBytes(allocation)); write(join(p.store, "carry.json"), leanCanonicalBytes(carried), 0o600); write(join(p.store, "source-manifest.json"), leanCanonicalBytes(manifest), 0o600)
      const cb = { schemaVersion: "lean-baseline-continuation-window-claim-v2", grantId: w.grantId, routeNamespace: w.routeNamespace, windowRoot: w.root, windowBytesRoot: request.windowBytesRoot, requestBytesRoot: allocation.requestBytesRoot, sourceHead, sourceRoot: request.sourceRoot, sourceGateRoot: request.sourceGateRoot, dataReviewRoot: request.dataReviewRoot, planningRoot: request.planningRoot, manifestRoot: request.manifestRoot }, claim = { ...cb, root: labRoot(cb.schemaVersion, cb) }
      write(p.claim, leanCanonicalBytes(claim), 0o600)
      const hb = { schemaVersion: "lean-baseline-continuation-source-hold-v2", allocationRoot: allocation.root, sourceHead, manifestRoot: allocation.manifestRoot, claimRoot: claim.root, rows: assay || namespace === "20261014-v6" ? inventory.slice(0, 1) : inventory }, hold = { ...hb, root: labRoot(hb.schemaVersion, hb) }
      write(join(l.directory, "source-hold.json"), leanCanonicalBytes(hold), 0o600)
      let c: ReturnType<typeof parentApi.openLeanBaselineContinuationContextV2>
      if (assay && namespace !== "20261014-v6") {
        expect(() => parentApi.openLeanBaselineContinuationContextV2(p.request)).toThrow(/ENOENT/)
        expect(authBoundary.completed).toBe(0); expect(authBoundary.guard).toBeTypeOf("function")
        // Test handle to the actual production guard captured at denial; NOT a
        // successfully opened/authenticated context or a reusable capability.
        c = { paths: p, window: w, ledger: l, allocation, manifest, fixedHead: head.value, guard: authBoundary.guard! } as typeof c
      } else c = parentApi.openLeanBaselineContinuationContextV2(p.request)
      // Construction censoring ends once the independently opened context is
      // available; the sample owns its separate remaining-budget censor.
      if (assay) delete assay.constructionStopAt
      await run(c, { passes, reservations, hashes, head, w, timing, assayRows, fixtureStartMs, fixtureExtraBound, authBoundary, realpaths, cadence, visitor, clearObservations: () => { physical.mockClear(); chunks.mockClear(); realpaths.mockClear(); stat.mockClear(); for (const key of Object.keys(cadence) as (keyof typeof cadence)[]) cadence[key] = 0; for (const key of Object.keys(timing) as (keyof typeof timing)[]) timing[key] = 0 }, observationCounts: () => ({ physical: physical.mock.calls.length, chunks: chunks.mock.calls.length }) })
    } finally { if (connected) Object.defineProperty(process, "connected", connected); else Reflect.deleteProperty(process, "connected"); clock?.mockRestore(); scratch?.mockRestore(); controllers?.mockRestore(); descriptors?.mockRestore(); members?.mockRestore(); raw?.mockRestore(); git.mockRestore(); hashes.mockRestore(); carry.mockRestore(); identity.mockRestore(); realpaths.mockRestore(); chunks.mockRestore(); physical.mockRestore(); process.execArgv = originalArgs; vi.unstubAllEnvs(); core.mockRestore(); available.mockRestore(); usage.mockRestore(); disk.mockRestore(); factory.mockRestore(); exists.mockRestore(); stat.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  }
  it("[continuation-stage-cadence-H] actual V6 context observes live callbacks and full source/history stage barriers", () => fixture((c, f) => {
    expect(c.paths).toBe(lean.LEAN_BASELINE_CONTINUATION_PATHS_V6)
    c.stage("source", () => c.guard())
    fs.writeFileSync(resolve("scripts/closed-cost.txt"), "changed history")
    c.guard() // Closed history is checked at barriers, not at every callback.
    expect(() => c.stage("charge", () => {})).toThrow()
    expect(() => c.guard()).toThrow() // Denial permanently invalidates invocation.
    expect(f.reservations).toEqual([0, 65536, 0])
  }, "20261014-v6"), 30000)
  it.each(["closing", "planning", "request", "head", "capacity"] as const)("[continuation-stage-cadence-H] actual V6 refuses %s before dependent effects", mode => fixture((c, f) => {
    const effect = vi.fn()
    if (mode === "closing") expect(() => c.stage("archive", () => fs.writeFileSync(resolve("scripts/closed-cost.txt"), "changed history"))).toThrow()
    if (mode === "planning") fs.writeFileSync(resolve(c.paths.gates), "changed")
    if (mode === "request") fs.writeFileSync(resolve(c.paths.request), "changed", { mode: 0o600 })
    if (mode === "head") f.head.value = "d".repeat(40)
    if (mode === "capacity") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000001 })
    expect(() => c.stage("charge", effect)).toThrow(); expect(effect).not.toHaveBeenCalled()
    expect(() => c.guard()).toThrow()
  }, "20261014-v6"), 30000)
  it("[continuation-stage-cadence-H] CLI selects V6 explicitly and rejects nonfinite variants", () => {
    for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parentApi.parseLeanBaselineCommand([mode, "--request", lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request])).toEqual({ mode, request: lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request })
    expect(() => parentApi.parseLeanBaselineCommand(["run-continuation-v2", "--request", lean.LEAN_BASELINE_CONTINUATION_PATHS_V6.request + "/extra"])).toThrow()
  })
  it.each(["live", "final", "resource", "claim", "claim-resource"] as const)("[CR-CAD-01-R2] [CR-CAD-01] actual V6 parent preserves spent charges and closes failed pilot after %s source denial", mode => fixture(async (c, f) => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] })
    lean.beginLeanInterval(c.ledger, "continuation-run-admission"); lean.closeLeanInterval(c.ledger, "continuation-run-admission")
    vi.mocked(Date.now).mockReturnValue(c.window.anchorMs + 1000)
    // The Vitest worker's IPC remains connected across asynchronous yields.
    // Only synchronous host observations simulate a top-level operator process.
    Object.defineProperty(process, "connected", { value: true, configurable: true, writable: true })
    const hostObservation = <T>(body: () => T): T => { Object.defineProperty(process, "connected", { value: false, configurable: true, writable: true }); try { return body() } finally { Object.defineProperty(process, "connected", { value: true, configurable: true, writable: true }) } }
    const child = Object.assign(new EventEmitter(), { pid: process.pid + 1000, exitCode: null as number | null, signalCode: null as NodeJS.Signals | null,
      kill: vi.fn((signal: NodeJS.Signals) => { queueMicrotask(() => { if (mode === "resource" || mode === "claim-resource") vi.mocked(process.memoryUsage).mockReturnValue({ ...process.memoryUsage(), rss: 3000000001 }); child.signalCode = signal; child.emit("exit", null, signal) }); return true }),
      send: () => { const slot = c.allocation.slots[0]!, body = { schemaVersion: "lean-slot-charge-v1", allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: slot.ordinal }; fs.appendFileSync(join(c.ledger.directory, "ledger.ndjson"), Buffer.concat([leanCanonicalBytes({ kind: "charge", charge: { ...body, root: labRoot(body.schemaVersion, body) } }), Buffer.from("\n")])); if (mode === "claim" || mode === "claim-resource") f.head.value = "d".repeat(40); return true },
    })
    const fork = vi.spyOn(childProcess, "fork").mockReturnValue(child as never), core = vi.spyOn(childProcess, "execFileSync").mockImplementation(((command: string, args: string[]) => command === "ps" ? "100\n" : args[0] === "show" ? leanCanonicalBytes(c.allocation) : `${c.fixedHead}\n`) as typeof childProcess.execFileSync)
    let manifests = 0
    const action = parentApi.runLeanBoundedParent({ ledger: c.ledger, requestPath: c.paths.request, allocationPath: c.paths.allocation, store: c.ledger.directory, sourceRoot: c.allocation.sourceRoot, manifestRoot: () => ++manifests === 1 ? c.allocation.sourceRoot : hostObservation(c.authenticateSource), childMode: "inert", prospectiveStart: { wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }, beforeRelease: () => hostObservation(c.guard), stage: (kind, body) => hostObservation(() => c.stage(kind, body)), beforeTerminal: c.closeRun, supervisorObservation: true })
    const settled = action.then(value => ({ value, error: null }), error => ({ value: null, error }))
    try {
      child.emit("message", { ready: child.pid }); await vi.advanceTimersByTimeAsync(0)
      if (lean.readLeanLedger(c.ledger).charged === 50) throw (await settled).error ?? new Error("INERT_PARENT_DID_NOT_ENTER")
      const charged = fs.readFileSync(join(c.ledger.directory, "ledger.ndjson"))
      expect(lean.readLeanLedger(c.ledger).charged).toBe(51)
      if (mode !== "final") { f.head.value = "d".repeat(40); await vi.advanceTimersByTimeAsync(250); expect(child.kill).toHaveBeenCalledWith("SIGKILL") }
      else { fs.writeFileSync(resolve("scripts/closed-cost.txt"), "changed history"); child.exitCode = 0; child.emit("exit", 0, null) }
      expect((await settled).value).toBeNull()
      expect(fs.readFileSync(join(c.ledger.directory, "ledger.ndjson"))).toEqual(charged)
      if (mode === "resource" || mode === "claim-resource") { expect(fs.existsSync(join(c.ledger.directory, "child-terminal.json"))).toBe(false); expect(lean.readLeanTimeAccounting(c.ledger).active).toBe(true); return }
      expect(lean.readLeanChildTerminal(c.ledger).status).toBe("child_failed")
      expect(parentApi.validateLeanSupervisorReasonBytes(fs.readFileSync(join(c.ledger.directory, "parent-supervisor-reasons.json")))).toMatchObject({ uncertain: true, observations: { finalIdentity: "exception", cleanup: "child_exit_observed" } })
      const time = lean.readLeanTimeAccounting(c.ledger); expect(time.active).toBe(false); expect(time.closed.has("pilot-entry")).toBe(true)
      expect(() => hostObservation(c.guard)).toThrow()
    } finally { fork.mockRestore(); core.mockRestore(); vi.useRealTimers() }
  }, "20261014-v6"), 30000)
  it("[continuation-stage-cadence-H] denies unselected finite allocation Git reads even if caller includes them", () => {
    const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-v6", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1791978643000, anchorMs: 1791978643000, carryMs: 630701903, capMs: 659501903, deadlineMs: 1792007443000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: "20261014-v6" as const, reviewedSourceHead: "a".repeat(40), sourceRoot: root("source"), sourceGateRoot: root("gate"), planRoot: root("plan"), runOperator: "inert-runner", readerOperator: "inert-reader" }, w = { ...body, root: labRoot(body.schemaVersion, body) }
    for (const p of [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5]) expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${w.reviewedSourceHead}:${p.allocation}`], [{ path: p.allocation, root: root("inert") }], w)).toThrow(/GIT_V2_METADATA/)
  })
  it.each(["pass", "closing", "after-charge"] as const)("[continuation-stage-cadence-H] connected durable charge-before-provider with spent %s failure", mode => fixture(async c => {
    const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.requestBytesRoot, head: c.fixedHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("inert-handshake"), wallStartMs: c.window.anchorMs, monotonicStartNs: process.hrtime.bigint().toString() }
    fs.writeFileSync(join(c.ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 })
    lean.beginLeanInterval(c.ledger, "pilot-entry", c.window.anchorMs)
    const slot = c.allocation.slots[0]!, order: string[] = [], provider = vi.fn(async charge => { expect(lean.readLeanLedger(c.ledger).charges.get(slot.root)?.root).toBe(charge.root); order.push("provider"); return "inert" })
    const charge = () => {
      const value = lean.chargeLeanSlot(c.ledger, slot, { freeBytes: 100000000000, availableMemoryBytes: 4000000000 }); order.push("durable-charge")
      if (mode === "closing") fs.writeFileSync(resolve("scripts/closed-cost.txt"), "drift")
      return value
    }
    const start = () => { c.startCell(); if (mode === "after-charge") fs.writeFileSync(resolve("scripts/closed-cost.txt"), "drift") }
    const action = parentApi.dispatchLeanContinuationChargedCellV6(c.stage, charge, start, provider)
    if (mode === "pass") { await expect(action).resolves.toMatchObject({ execution: "inert" }); expect(order).toEqual(["durable-charge", "provider"]) }
    else { await expect(action).rejects.toThrow(); expect(provider).not.toHaveBeenCalled(); expect(order).toEqual(["durable-charge"]) }
    expect(lean.readLeanLedger(c.ledger).charges.size).toBe(1); expect(lean.readLeanLedger(c.ledger).charged).toBe(51)
  }, "20261014-v6"), 30000)
  it("[continuation-remaining-overhead] actual complete guard removes pure window hashes but retains all live work", () => fixture((c, f) => {
    f.hashes.mockClear(); f.clearObservations(); f.passes.length = 0
    c.guard(1234)
    expect(f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2")).toHaveLength(0)
    expect(f.observationCounts()).toEqual({ physical: 21, chunks: 2 }); expect(f.passes).toHaveLength(2)
    expect(f.passes[0]).toEqual(f.passes[1]); expect(f.realpaths.mock.calls.length).toBeGreaterThanOrEqual(2 * f.passes[0]!.length)
  }))
  it("[continuation-run-diagnostics] binds real denied carry to finite private invocation provenance without admission", () => fixture(async (c, f) => {
    await expect(invokeRun(c.paths.request)).rejects.toThrow(/ENOENT/)
    const formatted = parentApi.leanBaselineContinuationRunFailureV2(f.authBoundary.error)
    expect(formatted).toContain("stage=CARRY_REAUTHENTICATION"); expect(formatted).toContain("completed=false"); expect(formatted).toContain("code=DETAILS_WITHHELD")
    expect(formatted).toMatch(/guards_completed=[1-9][0-9]*/); expect(formatted).toMatch(/opening_completed=[1-9][0-9]*/); expect(formatted).toMatch(/closing_completed=[1-9][0-9]*/)
    for (const text of [process.cwd(), "ENOENT", "allocation.json", "stack", "sourceRoot"]) expect(formatted).not.toContain(text)
    expect(f.authBoundary.completed).toBe(0)
    for (const name of ["run-claim.json", "entry.json", "result.json", "reader-claim.json"]) expect(fs.existsSync(join(c.ledger.directory, name))).toBe(false)
  }, "20261012-v3", { n: 32, u: 64 }))
  it("[continuation-run-diagnostics] does not attribute hostile, forged or cross-invocation error objects", () => fixture(async c => {
    const error = new Error("PRIVATE raw message"), getter = new Error(), trap = vi.fn(() => { throw error }); Object.defineProperty(getter, "message", { get: trap })
    const revoked = Proxy.revocable({}, {}); revoked.revoke()
    for (const unknown of [null, "PRIVATE", 1, error, getter, { stage: "FULL_GUARD", guards_completed: 999 }, new Proxy(error, { get: trap, ownKeys: trap }), revoked.proxy]) expect(parentApi.leanBaselineContinuationRunFailureV2(unknown)).toBe("LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n")
    const memory = vi.mocked(process.memoryUsage), actual = memory.getMockImplementation()!
    try {
      memory.mockImplementation(() => { throw error })
      await expect(invokeRun(c.paths.request)).rejects.toBe(error)
      expect(parentApi.leanBaselineContinuationRunFailureV2(error)).toContain("stage=PREFLIGHT")
      await expect(invokeRun(c.paths.request)).rejects.toBe(error)
      expect(parentApi.leanBaselineContinuationRunFailureV2(error)).toBe("LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n")
      memory.mockImplementation(() => { throw getter })
      await expect(invokeRun(c.paths.request)).rejects.toBe(getter)
      expect(parentApi.leanBaselineContinuationRunFailureV2(getter)).toBe("LEAN_BASELINE_RUN_PREENTRY stage=UNKNOWN code=DETAILS_WITHHELD\n")
      expect(trap).not.toHaveBeenCalled()
    } finally { memory.mockImplementation(actual) }
  }))
  it("[continuation-run-diagnostics] records closing identity began, never completed, when bytes mutate between passes", () => fixture(async c => {
    const identity = vi.mocked(continuationHelper.createLeanContinuationIdentityGuardV2), original = identity.getMockImplementation()!
    identity.mockImplementation((pins, rows) => { const guard = original(pins, rows); let passes = 0; return () => { if (++passes === 2) fs.chmodSync(resolve(c.manifest.implementationEntries[0]!.path), 0o600); guard() } })
    let error: unknown
    try { await invokeRun(c.paths.request) } catch (caught) { error = caught }
    const formatted = parentApi.leanBaselineContinuationRunFailureV2(error)
    expect(formatted).toContain("stage=FULL_GUARD completed=false"); expect(formatted).toContain("guards_began=1 guards_completed=0"); expect(formatted).toContain("opening_began=1 opening_completed=1 closing_began=1 closing_completed=0")
    expect(fs.existsSync(join(c.ledger.directory, "run-claim.json"))).toBe(false)
  }, "20261012-v3", { n: 32, u: 64 }))
  it.each([[32, 64], [128, 256], [512, 1024], [2280, 2352]] as const)("[continuation-guard-sensitivity] bounded actual guard/inventory N=%i U=%i (mock resource inputs, no admitted context)", async (n, u) => {
    const assayStart = performance.now()
    let report: Record<string, number | string | boolean> = {}
    await fixture((c, f) => {
    const start = f.fixtureStartMs, setupMs = performance.now() - start, stopAt = start + 8000, censored = new Error("FINITE_ASSAY_STOP")
    let callbacksBegan = 0, callbacksCompleted = 0, guards = 0, identityPasses = 0, identityRows = 0, physical = 0, chunks = 0, realpaths = 0, windowHashes = 0, maxGuardMs = 0, guardMs = 0, identityMs = 0, physicalMs = 0, readMs = 0, realpathMs = 0
    const clear = () => { f.clearObservations(); f.hashes.mockClear(); f.passes.length = 0 }
    // Pure timing is local work only; never a whole-run throughput forecast.
    clear(); const strictStart = performance.now()
    for (let i = 0; i < 16; i++) lean.leanBaselineContinuationElapsedFloorV2(c.window, c.window.anchorMs)
    const strictMs = performance.now() - strictStart, strictHashes = f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length
    clear(); const admittedStart = performance.now()
    for (let i = 0; i < 16; i++) lean.leanAdmittedContinuationElapsedFloorV2(c.ledger, c.window.anchorMs)
    const admittedMs = performance.now() - admittedStart, admittedHashes = f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length
    expect(strictHashes).toBe(16); expect(admittedHashes).toBe(0)
    const callback = () => {
      // Reserve a generous finite stop margin BEFORE a callback/guard begins.
      if (performance.now() + Math.max(500, maxGuardMs * 3) >= stopAt) throw censored
      callbacksBegan++; clear(); const at = performance.now(); c.guard(); const elapsed = performance.now() - at
      maxGuardMs = Math.max(maxGuardMs, elapsed); guardMs += elapsed; guards++; callbacksCompleted++
      expect(f.passes).toHaveLength(2); expect(f.passes.map(pass => pass.length)).toEqual([u, u])
      identityPasses += f.passes.length; identityRows += f.passes.reduce((sum, pass) => sum + pass.length, 0)
      const observations = f.observationCounts(); physical += observations.physical; chunks += observations.chunks; realpaths += f.realpaths.mock.calls.length
      windowHashes += f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-window-v2").length
      identityMs += f.timing.identityMs; physicalMs += f.timing.physicalMs; readMs += f.timing.readMs; realpathMs += f.timing.realpathMs
      clear()
    }
    let status: "completed" | "censored" = "completed", rowsCompleted = 0
    try { const rows = continuationHelper.inventoryLeanContinuationSurvivorsV2(f.assayRows, [], () => { throw new Error("NO_GIT_FOR_IMMUTABLE_SYNTHETIC_ROWS") }, callback); rowsCompleted = rows.length; expect(rows).toHaveLength(n) }
    catch (error) { if (error !== censored) throw error; status = "censored"; rowsCompleted = Math.min(n, Math.floor(callbacksCompleted / 2)) }
    const durationMs = performance.now() - start
    expect(durationMs).toBeLessThan(8000); expect(f.fixtureExtraBound).toBeLessThanOrEqual(64 * 1024 * 1024)
    expect(guards).toBe(callbacksCompleted); expect(identityPasses).toBe(2 * guards); expect(identityRows).toBe(2 * u * guards); expect(physical).toBe(21 * guards); expect(chunks).toBe(2 * guards); expect(realpaths).toBeGreaterThanOrEqual(identityRows); expect(windowHashes).toBe(0)
    if (status === "completed") expect(callbacksCompleted).toBe(2 * n + 1)
    else { expect(callbacksCompleted).toBeLessThan(2 * n + 1); expect(rowsCompleted).toBeLessThan(n) }
    expect(f.authBoundary.completed).toBe(0)
    report = { n, u, status, rowsCompleted, callbacksBegan, callbacksCompleted, guards, identityPasses, identityRows, physical, chunks, realpaths, windowHashes, strictHashes, admittedHashes, strictMs: Math.ceil(strictMs), admittedMs: Math.ceil(admittedMs), setupMs: Math.ceil(setupMs), guardMs: Math.ceil(guardMs), identityMs: Math.ceil(identityMs), physicalMs: Math.ceil(physicalMs), readMs: Math.ceil(readMs), realpathMs: Math.ceil(realpathMs), timingsOverlap: true, durationMs: Math.ceil(durationMs), extraBytesBound: f.fixtureExtraBound, sampleLimitMs: 8000, contextAuthenticated: false, resourceInputsMocked: true }
    }, "20261012-v3", { n, u })
    report.totalDurationMs = Math.ceil(performance.now() - assayStart); expect(report.totalDurationMs).toBeLessThan(8000)
    process.stdout.write(`FINITE_SYNTHETIC_GUARD_ASSAY ${JSON.stringify(report)}\n`)
  }, 15000)
  it("uses the opened ledger exact allocation and fresh opening/closing passes for every callback", () => fixture((c, f) => {
    expect(c.allocation).toBe(c.ledger.allocation); expect(lean.readLeanAdmittedContinuationAllocationV2(c.ledger)).toBe(c.allocation)
    expect(f.reservations).toEqual([0, 65536, 0]); expect(f.passes).toHaveLength(10)
    for (const pass of f.passes) expect(new Set(pass).size).toBe(pass.length)
    f.hashes.mockClear(); f.clearObservations(); const before = f.passes.length; c.guard(1234)
    expect(f.observationCounts()).toEqual({ physical: 21, chunks: 2 }); c.guard(5678)
    expect(f.observationCounts()).toEqual({ physical: 42, chunks: 4 })
    expect(f.passes.length - before).toBe(4)
    expect(f.hashes.mock.calls.filter(([domain]) => domain === "lean-slot-v1" || domain === "lean-baseline-continuation-admission-v2" || domain === "lean-baseline-continuation-allocation-v2")).toHaveLength(0)
    // Empty synthetic journals require no remaining domain hashes after the
    // admitted pure-window reuse; live bytes/42 physical samples still run.
    expect(f.hashes.mock.calls).toHaveLength(0)
  }))
  it("denies live HEAD, resource and allocation-byte drift through the actual complete guard", () => fixture((c, f) => {
    c.guard(); f.head.value = "d".repeat(40); expect(() => c.guard()).toThrow(/HOLD/); f.head.value = c.fixedHead
    for (const additional of [-1, NaN, Number.MAX_SAFE_INTEGER, LEAN_CAPS.scratchBytes]) expect(() => c.guard(additional)).toThrow()
    const p = c.paths.allocation, bytes = fs.readFileSync(resolve(p)); fs.writeFileSync(resolve(p), "not canonical"); expect(() => c.guard()).toThrow(); fs.writeFileSync(resolve(p), bytes); expect(() => c.guard()).toThrow()
  }))
  it.each(["source", "planning", "request", "window", "store-allocation"] as const)("reobserves %s bytes and rejects replacement/restore on the next actual callback", kind => fixture(c => {
    const path = kind === "source" ? c.manifest.implementationEntries[0]!.path : kind === "planning" ? ".planning/STATE.md" : kind === "request" ? c.paths.request : kind === "window" ? c.paths.window : join(c.ledger.directory, "allocation.json")
    const absolute = resolve(path), original = fs.readFileSync(absolute)
    fs.renameSync(absolute, `${absolute}.old`); fs.writeFileSync(absolute, original, { mode: kind === "source" || kind === "planning" ? 0o644 : 0o600 })
    expect(() => c.guard()).toThrow(); fs.unlinkSync(absolute); fs.renameSync(`${absolute}.old`, absolute); expect(() => c.guard()).toThrow()
  }))
  it("uses fresh availableRAM/freebytes/RSS/arrayBuffers and rejects deadline/monotonic drift before use", () => fixture((c, f) => {
    const usage = process.memoryUsage(), disk = fs.statfsSync(resolve("."), { bigint: true })
    for (const change of [{ rss: 3000000000 }, { arrayBuffers: LEAN_CAPS.scratchBytes + 1 }]) { vi.mocked(process.memoryUsage).mockReturnValue({ ...usage, ...change }); expect(() => c.guard()).toThrow(/CAPACITY/); vi.mocked(process.memoryUsage).mockReturnValue(usage) }
    vi.mocked(leagueHost.observeLeagueAvailableMemoryBytes).mockReturnValue(0); expect(() => c.guard()).toThrow(/CAPACITY/); vi.mocked(leagueHost.observeLeagueAvailableMemoryBytes).mockReturnValue(4000000000)
    vi.mocked(fs.statfsSync).mockReturnValue({ bavail: 0n, bsize: 1n } as never); expect(() => c.guard()).toThrow(/CAPACITY/); vi.mocked(fs.statfsSync).mockReturnValue(disk as never)
    const mono = vi.spyOn(process.hrtime, "bigint").mockReturnValue(0n); try { expect(() => c.guard()).toThrow(/LIVENESS/) } finally { mono.mockRestore() }
    vi.mocked(Date.now).mockReturnValue(f.w.deadlineMs - 36 * LEAN_CAPS.matchMs - f.w.closureMs - f.w.offlineOverheadMs + 1); expect(() => c.guard()).toThrow(/CAPACITY/)
    vi.mocked(Date.now).mockReturnValue(f.w.anchorMs - 1); expect(() => c.guard()).toThrow(/HOLD/)
  }))
  it("retains actual journal-prefix binding, active-cell reserve and fresh membership refusal", () => fixture((c, f) => {
    const slot = c.allocation.slots[0]!, cb = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...cb, root: labRoot(cb.schemaVersion, cb) }, path = join(c.ledger.directory, "ledger.ndjson")
    fs.writeFileSync(path, Buffer.concat([leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")]))
    c.startCell(); expect(c.guard().remainingSlots).toBe(36); expect(c.guard().charged).toBe(51)
    const before = fs.readFileSync(path), resource = { kind: "resource", elapsedMs: f.w.carryMs + 1, physicalBytes: 4096, bufferBytes: 0, scratchBytes: 0 }
    fs.writeFileSync(path, Buffer.concat([before, leanCanonicalBytes(resource), Buffer.from("\n")])); expect(() => c.guard()).toThrow(/LEDGER_CHANGED/); fs.writeFileSync(path, before); expect(c.guard().charged).toBe(51)
    c.finishCell(); expect(c.guard().remainingSlots).toBe(35); c.closeRun(); expect(c.guard().remainingSlots).toBe(0)
    fs.writeFileSync(join(c.ledger.directory, "unknown.json"), "{}", { mode: 0o600 }); expect(() => c.guard()).toThrow(/STORE_MEMBERS/)
    expect(f.passes.every(pass => pass.length === new Set(pass).size)).toBe(true)
  }))
  it("keeps optional descriptor chunks and denies loss of child liveness in the actual frontier caller", () => fixture((c, f) => {
    const entry = { schemaVersion: "lean-child-entry-v2", allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead, parentPid: process.ppid, childPid: process.pid, handshakeRoot: root("inert-handshake"), wallStartMs: c.window.anchorMs, monotonicStartNs: process.hrtime.bigint().toString() }
    fs.writeFileSync(join(c.ledger.directory, "entry.json"), leanCanonicalBytes(entry), { mode: 0o600 })
    Object.defineProperty(process, "connected", { value: true, writable: true, configurable: true })
    const actualRead = lean.readLeanChildEntry, read = vi.spyOn(lean, "readLeanChildEntry").mockImplementation(l => { const result = actualRead(l); Object.defineProperty(process, "connected", { value: false, writable: true, configurable: true }); return result })
    try { f.clearObservations(); expect(() => c.guard()).toThrow(/V2_FRONTIER/); expect(read).toHaveBeenCalledOnce(); expect(f.observationCounts()).toEqual({ physical: 26, chunks: 3 }) } finally { read.mockRestore() }
  }))
  it("[continuation-v5] opens the selected V5 context with both fresh identity passes and bounded reservations", () => fixture((c, f) => {
    expect(c.paths).toEqual(lean.LEAN_BASELINE_CONTINUATION_PATHS_V5)
    expect(c.claim.routeNamespace).toBe("20261013-v5")
    expect(c.allocation.window).toEqual(c.window)
    f.clearObservations(); f.passes.length = 0; f.hashes.mockClear(); c.guard()
    expect(f.passes).toHaveLength(2)
    expect(f.observationCounts()).toEqual({ physical: 21, chunks: 2 })
    expect(f.hashes.mock.calls.filter(([domain]) => domain === "lean-baseline-continuation-allocation-v2")).toHaveLength(0)
  }, "20261013-v5"))
  it.each(["valid", "claim", "entry", "pair", "journal"] as const)("[continuation-v5] real issuer joins through pair/journal before inert source sentinel: %s", mode => fixture((c) => {
    // Real admitted context, full guards and synthetic ledger/pair descriptors;
    // the external source boundary throws before any capability is issued.
    const slot = c.allocation.slots[0]!, body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...body, root: labRoot(body.schemaVersion, body) }
    const journal = Buffer.concat([leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")])
    fs.writeFileSync(join(c.ledger.directory, "ledger.ndjson"), journal)
    const entry = { allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: mode === "entry" ? root("crossed-request") : c.allocation.requestBytesRoot, head: c.fixedHead }
    const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: mode === "pair" ? root("crossed-pair") : slot.requestRoot, priorCharged: 50, priorLedgerByteLength: 0, priorLedgerBytesRoot: mode === "journal" ? root("crossed-journal-prefix") : leanBytesRoot(Buffer.alloc(0)), bottomRole: "final-response", topRole: "final-response", bottomSourceRoot: root("source"), topSourceRoot: root("source"), bottomSnapshotRoot: root("snapshot"), topSnapshotRoot: root("snapshot") }
    fs.writeFileSync(join(c.ledger.directory, "pair-0.json"), leanCanonicalBytes({ ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }), { mode: 0o600 })
    fs.writeFileSync(join(c.ledger.directory, "source-final-response.json"), "{}", { mode: 0o600 })
    const receipt = vi.spyOn(lean, "readLeanChildEntry").mockReturnValue(entry as never)
    const actualRead = continuationHelper.readLeanContinuationJsonV2, claimRead = vi.spyOn(continuationHelper, "readLeanContinuationJsonV2").mockImplementation((path, cap, permissions, guard) => {
      const value = actualRead(path, cap, permissions, guard)
      return path === c.paths.claim && mode === "claim" ? { ...value, routeNamespace: "20261012-v4" } : value
    })
    const sentinel = new Error("INERT_EXTERNAL_SOURCE_BOUNDARY"), source = vi.spyOn(continuationSource, "validateLeanBaselineSource").mockImplementation(() => { throw sentinel }), provider = vi.spyOn(childProcess, "fork")
    try {
      const invoke = () => continuationAuthority.issueLeanBaselineContinuationRuntimeAuthorityV2(c.ledger, charge, {} as never, { budgetRoot: c.allocation.root, seat: "bottom" } as never, c.guard)
      if (mode === "valid") { expect(invoke).toThrow(sentinel); expect(source).toHaveBeenCalledOnce() }
      else { expect(invoke).toThrow(); expect(source).not.toHaveBeenCalled() }
      expect(claimRead.mock.calls.some(([path]) => path === c.paths.claim)).toBe(mode !== "entry")
      expect(claimRead.mock.calls.some(([path]) => path === lean.LEAN_BASELINE_CONTINUATION_PATHS_V4.claim)).toBe(false)
      expect(provider).not.toHaveBeenCalled()
    } finally { provider.mockRestore(); source.mockRestore(); claimRead.mockRestore(); receipt.mockRestore() }
  }, "20261013-v5"), 15000)
  it.each(["valid", "claim"] as const)("[continuation-stage-cadence-H] V6 real issuer joins through pair/journal before inert source sentinel: %s", mode => fixture((c) => {
    // Real admitted context, full guards and synthetic ledger/pair descriptors;
    // the external source boundary throws before any capability is issued.
    const slot = c.allocation.slots[0]!, body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: c.allocation.root, slotRoot: slot.root, ordinal: 0 }, charge = { ...body, root: labRoot(body.schemaVersion, body) }
    const journal = Buffer.concat([leanCanonicalBytes({ kind: "charge", charge }), Buffer.from("\n")])
    fs.writeFileSync(join(c.ledger.directory, "ledger.ndjson"), journal)
    const entry = { allocationRoot: c.allocation.root, sourceRoot: c.allocation.sourceRoot, requestBytesRoot: c.allocation.requestBytesRoot, head: c.fixedHead }
    const pairBody = { schemaVersion: "lean-baseline-pair-v1", ordinal: 0, slotRoot: slot.root, requestRoot: slot.requestRoot, priorCharged: 50, priorLedgerByteLength: 0, priorLedgerBytesRoot: leanBytesRoot(Buffer.alloc(0)), bottomRole: "final-response", topRole: "final-response", bottomSourceRoot: root("source"), topSourceRoot: root("source"), bottomSnapshotRoot: root("snapshot"), topSnapshotRoot: root("snapshot") }
    fs.writeFileSync(join(c.ledger.directory, "pair-0.json"), leanCanonicalBytes({ ...pairBody, root: labRoot("lean-baseline-pair-v1", pairBody) }), { mode: 0o600 })
    fs.writeFileSync(join(c.ledger.directory, "source-final-response.json"), "{}", { mode: 0o600 })
    const receipt = vi.spyOn(lean, "readLeanChildEntry").mockReturnValue(entry as never)
    const actualRead = continuationHelper.readLeanContinuationJsonV2, claimRead = vi.spyOn(continuationHelper, "readLeanContinuationJsonV2").mockImplementation((path, cap, permissions, guard) => {
      const value = actualRead(path, cap, permissions, guard)
      return path === c.paths.claim && mode === "claim" ? { ...value, routeNamespace: "20261012-v4" } : value
    })
    const sentinel = new Error("INERT_EXTERNAL_SOURCE_BOUNDARY"), source = vi.spyOn(continuationSource, "validateLeanBaselineSource").mockImplementation(() => { throw sentinel }), provider = vi.spyOn(childProcess, "fork")
    try {
      const invoke = () => continuationAuthority.issueLeanBaselineContinuationRuntimeAuthorityV2(c.ledger, charge, {} as never, { budgetRoot: c.allocation.root, seat: "bottom" } as never, c.guard)
      if (mode === "valid") { expect(invoke).toThrow(sentinel); expect(source).toHaveBeenCalledOnce() }
      else { expect(invoke).toThrow(); expect(source).not.toHaveBeenCalled() }
      expect(claimRead.mock.calls.some(([path]) => path === c.paths.claim)).toBe(true)
      expect(claimRead.mock.calls.some(([path]) => path === lean.LEAN_BASELINE_CONTINUATION_PATHS_V4.claim)).toBe(false)
      expect(provider).not.toHaveBeenCalled()
    } finally { provider.mockRestore(); source.mockRestore(); claimRead.mockRestore(); receipt.mockRestore() }
  }, "20261014-v6"), 30000)
  it.each(["valid", "window", "context-paths", "context-window", "context-allocation", "context-ledger"] as const)("[continuation-v5] real retained scope before inert publication boundary: %s", mode => fixture((c) => {
    // Direct inert consumer invocation, not an ordinary reader process. External
    // receipt/context/time hooks are mocked; scope joins and c.guard stay real.
    // Claim and interval-close sentinels prevent all journal/publication writes.
    const send = Object.getOwnPropertyDescriptor(process, "send"); Object.defineProperty(process, "send", { value: undefined, configurable: true, writable: true })
    const before = { ...lean.readLeanTimeAccounting(c.ledger), active: false, closed: new Set(["continuation-run-admission", "pilot-entry"]), closes: new Map([["pilot-entry", c.window.anchorMs]]) }
    const time = vi.spyOn(lean, "readLeanTimeAccounting").mockReturnValue(before), terminal = vi.spyOn(lean, "readLeanChildTerminal").mockReturnValue({} as never), entry = vi.spyOn(lean, "readLeanChildEntry").mockReturnValue({ parentPid: 999991, childPid: 999992 } as never)
    const start = vi.spyOn(lean, "beginLeanInterval").mockImplementation(() => undefined as never), close = vi.spyOn(lean, "closeLeanInterval").mockImplementation(() => { throw new Error("INERT_NO_PUBLICATION") })
    const metadata = vi.spyOn(parentApi, "withLeanContinuationReaderMetadataV2").mockImplementation((_w, parse) => parse())
    const { root: _windowRoot, ...crossedWindowBody } = { ...c.window, routeNamespace: "20261012-v4" as const }, crossedWindow = { ...crossedWindowBody, root: labRoot(crossedWindowBody.schemaVersion, crossedWindowBody) }
    const window = vi.spyOn(parentApi, "readLeanBaselineContinuationWindowV2").mockReturnValue(mode === "window" ? crossedWindow : c.window)
    const context = vi.spyOn(parentApi, "openLeanBaselineContinuationContextV2").mockReturnValue({ ...c, ...(mode === "context-paths" ? { paths: lean.LEAN_BASELINE_CONTINUATION_PATHS_V4 } : {}), ...(mode === "context-window" ? { window: { ...c.window, root: root("crossed-window") } } : {}), ...(mode === "context-allocation" ? { allocation: { ...c.allocation, root: root("crossed-allocation") } } : {}), ...(mode === "context-ledger" ? { ledger: { ...c.ledger, directory: "/inert-crossed-ledger" } } : {}) } as never)
    const kill = vi.spyOn(process, "kill").mockImplementation(() => { throw Object.assign(new Error("inert absent pid"), { code: "ESRCH" }) })
    const publication = vi.spyOn(parentApi, "writeLeanContinuationArtifact").mockImplementation(() => { throw new Error("INERT_CLAIM_BOUNDARY") }), dispatch = vi.spyOn(childProcess, "fork")
    try {
      expect(() => continuationRetainedReader.verifyLeanBaselineContinuationRetainedV2(c.paths.request)).toThrow(mode === "window" ? /V2_READER_WINDOW_BINDING/ : /V2_TERMINAL_REFUSAL/)
      if (mode === "valid") { expect(start, "reader interval admitted").toHaveBeenCalledOnce(); expect(context, "context join reached").toHaveBeenCalledWith(c.paths.request, true); expect(publication).toHaveBeenCalledOnce(); expect(publication.mock.calls[0]?.[1]).toBe("reader-claim.json") }
      else expect(publication).not.toHaveBeenCalled()
      expect(publication.mock.calls.some(([, name]) => name === "retained-check.json")).toBe(false); expect(dispatch).not.toHaveBeenCalled()
    } finally { if (send) Object.defineProperty(process, "send", send); else Reflect.deleteProperty(process, "send"); dispatch.mockRestore(); publication.mockRestore(); kill.mockRestore(); context.mockRestore(); window.mockRestore(); metadata.mockRestore(); close.mockRestore(); start.mockRestore(); entry.mockRestore(); terminal.mockRestore(); time.mockRestore() }
  }, "20261013-v5"))
})
describe.each(["20261012-v4", "20261013-v5"] as const)("[continuation-v4] [continuation-v5] real driver namespace and mutation-free refusal %s", selectedNamespace => {
  const selected = selectedNamespace === "20261013-v5" ? lean.LEAN_BASELINE_CONTINUATION_PATHS_V5 : lean.LEAN_BASELINE_CONTINUATION_PATHS_V4
  it.each(["revoked", "throwing-prototype"] as const)("withholds hostile Proxy classifier details: %s", kind => {
    const privateDetail = "PRIVATE prototype payload /private/source"
    const prototype = vi.fn(() => { throw new Error(privateDetail) })
    const revocable = Proxy.revocable({}, {})
    const error = kind === "revoked" ? revocable.proxy : new Proxy({}, { getPrototypeOf: prototype })
    if (kind === "revoked") revocable.revoke()
    // Assert only finite results, never ask the test reporter to inspect the Proxy.
    expect(parentApi.leanContinuationPreparationCodeV4(error)).toBe("DETAILS_WITHHELD")
    const formatted = parentApi.leanBaselineContinuationPreparationFailureV4(error)
    expect(formatted).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n")
    expect(formatted).not.toContain(privateDetail)
    if (kind === "throwing-prototype") expect(prototype).toHaveBeenCalledTimes(1)
  })
  const window = (namespace: "20261012-v3" | "20261012-v4" | "20261013-v5" = selectedNamespace) => {
    const body = { schemaVersion: "lean-baseline-continuation-window-v2" as const, status: "approved" as const, grantId: "inert-v4", approvalEvidence: { humanDecisionId: "inert-human", recordedBy: "inert-root" }, approvedAtMs: 1791840227000, anchorMs: 1791840227000, carryMs: 492285903, capMs: 521085903, deadlineMs: 1791869027000, durationMs: 28800000, closureMs: 1860000, offlineOverheadMs: 600000, routeNamespace: namespace, reviewedSourceHead: "a".repeat(40), sourceRoot: root("source"), sourceGateRoot: root("source-gate"), planRoot: root("plan"), runOperator: "inert-runner", readerOperator: "inert-reader" }
    return { ...body, root: labRoot(body.schemaVersion, body) }
  }
  const fixture = (run: (dir: string, w: lean.LeanBaselineContinuationWindowV2) => void, namespace: "20261012-v3" | "20261012-v4" | "20261013-v5" = selectedNamespace) => {
    const dir = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "continuation-v4-driver-"))), cwd = vi.spyOn(process, "cwd").mockReturnValue(dir), w = window(namespace)
    const clock = vi.spyOn(Date, "now").mockReturnValue(w.anchorMs), actualExists = fs.existsSync
    const exists = vi.spyOn(fs, "existsSync").mockImplementation(path => actualExists(resolve(String(path))))
    try {
      fs.mkdirSync(resolve(".strategy-lab")); fs.mkdirSync(resolve(".planning/artifacts"), { recursive: true })
      fs.writeFileSync(resolve(selected.window), leanCanonicalBytes(w), { mode: 0o600 })
      run(dir, w)
    } finally { exists.mockRestore(); clock.mockRestore(); cwd.mockRestore(); fs.rmSync(dir, { recursive: true }) }
  }
  const absent = () => {
    const p = selected
    for (const path of [p.claim, p.store, p.allocation, p.temp]) expect(fs.existsSync(resolve(path))).toBe(false)
  }
  it("denies every unselected finite allocation even if advertised by the manifest, keeping selected metadata bounded", () => {
    const paths = [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5], head = "a".repeat(40), manifest = paths.map(p => ({ path: p.allocation, root: root(p.allocation) }))
    const git = vi.spyOn(childProcess, "execFileSync").mockReturnValue(Buffer.from("{}"))
    try {
      expect(continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${selected.allocation}`], manifest, window())).toEqual(Buffer.from("{}"))
      expect(git.mock.calls[0]?.[2]).toMatchObject({ maxBuffer: 262144, timeout: 1500, stdio: ["ignore", "pipe", "ignore"] })
      expect(continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation}`], manifest)).toEqual(Buffer.from("{}"))
      git.mockClear()
      for (const p of paths.filter(p => p !== selected)) for (const operation of ["show", "rev-parse"]) expect(() => continuationGit.readLeanBaselineContinuationGitV2([operation, `${head}:${p.allocation}`], manifest, window())).toThrow(/GIT_V2_METADATA/)
      expect(() => continuationGit.readLeanBaselineContinuationGitV2(["show", `${head}:${lean.LEAN_BASELINE_CONTINUATION_PATHS_V5.allocation}`], manifest)).toThrow(/GIT_V2_METADATA/)
      expect(git).not.toHaveBeenCalled()
      for (const request of [selected.request.replace("-v", "-unknown-v"), `${selected.request}/extra`, selected.request.replace("202610", "202611")]) expect(() => parseLeanBaselineCommand(["prepare-continuation-v2", "--request", request])).toThrow()
    } finally { git.mockRestore() }
  })
  it("accepts only both exact public request strings, keeping hidden child syntax private", () => {
    for (const request of [lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.request, lean.LEAN_BASELINE_CONTINUATION_PATHS_V4.request, lean.LEAN_BASELINE_CONTINUATION_PATHS_V5.request]) for (const mode of ["prepare-continuation-v2", "run-continuation-v2", "verify-continuation-v2"]) expect(parseLeanBaselineCommand([mode, "--request", request])).toEqual({ mode, request })
    expect(() => parseLeanBaselineCommand(["child-continuation-v2", "--request", selected.request])).toThrow()
  })
  it("reads the selected real bounded window first and denies crossed namespace before mutation", () => {
    fixture((_dir, w) => { expect(parentApi.readLeanBaselineContinuationWindowV2(selected.request)).toEqual(w); absent() })
    fixture(() => { expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/WINDOW_NAMESPACE/); absent() }, "20261012-v3")
  })
  it("refuses missing window, consumed claim and missed full36 frontier with setup absent", () => {
    fixture((_dir, w) => {
      vi.mocked(Date.now).mockReturnValue(w.deadlineMs - 36 * LEAN_CAPS.matchMs - w.closureMs - w.offlineOverheadMs + 1)
      expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/WINDOW_EXPIRED/); absent()
      fs.unlinkSync(resolve(selected.window)); expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(); absent()
    })
    fixture(() => {
      fs.mkdirSync(resolve(selected.temp), { mode: 0o700 })
      expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/GRANT_CLAIMED/)
      for (const path of [selected.claim, selected.store, selected.allocation]) expect(fs.existsSync(resolve(path))).toBe(false)
    })
  })
  it("selects setup ancestor membership without accepting V3 additions under V4", () => {
    const row = { path: ".strategy-lab", kind: "directory" as const, bytes: 1, allocatedBytes: 4096, dev: 1, ino: 2, mode: 0o755, mtimeMs: 1, ctimeMs: 1, rawRoot: null, members: [] }
    const additions = (p: typeof lean.LEAN_BASELINE_CONTINUATION_PATHS_V2 | typeof lean.LEAN_BASELINE_CONTINUATION_PATHS_V4 | typeof lean.LEAN_BASELINE_CONTINUATION_PATHS_V5) => [p.store, p.temp].map(path => path.split("/").at(-1)!).sort()
    expect(() => parentApi.validateLeanContinuationSetupDirectoriesV2([row], [{ ...row, members: additions(selected) }], window())).not.toThrow()
    expect(() => parentApi.validateLeanContinuationSetupDirectoriesV2([row], [{ ...row, members: additions(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2) }], window())).toThrow(/SETUP_DIRECTORIES/)
  })
  it("rejects crossed TMPDIR and capacity before source/carry/setup, with no provider", () => fixture((_dir, w) => {
    const originalArgs = process.execArgv, core = vi.spyOn(childProcess, "execFileSync").mockImplementation((command => (command === "ps" ? "100\n" : "0\n") as never) as typeof childProcess.execFileSync), fork = vi.spyOn(childProcess, "fork")
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never)
    try {
      process.execArgv = ["--import", "tsx"]
      vi.stubEnv("TSX_DISABLE_CACHE", "1"); vi.stubEnv("NODE_DISABLE_COMPILE_CACHE", "1")
      for (const key of ["NODE_OPTIONS", "NODE_COMPILE_CACHE", "NODE_REDIRECT_WARNINGS", "NODE_V8_COVERAGE"]) vi.stubEnv(key, undefined)
      vi.stubEnv("TMPDIR", resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.temp))
      expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/SCOPE/); absent()
      vi.stubEnv("TMPDIR", resolve(selected.temp))
      expect(() => parentApi.assertLeanBaselineContinuationScopeV2(true, w)).not.toThrow()
      const usage = process.memoryUsage(), memory = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...usage, rss: 4000000000 })
      try {
        expect(() => parentApi.prepareLeanBaselineContinuationV2(selected.request)).toThrow(/CAPACITY/); absent(); expect(fork).not.toHaveBeenCalled()
        const error = new TypeError(), getter = vi.fn(() => { throw new Error("PRIVATE getter") }); Object.defineProperty(error, "stack", { value: "PRIVATE static stack" }); Object.defineProperty(error, "message", { get: getter })
        expect(parentApi.leanContinuationPreparationCodeV4(error)).toBe("DETAILS_WITHHELD")
        expect(parentApi.leanBaselineContinuationPreparationFailureV4(error)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n"); expect(getter).not.toHaveBeenCalled(); absent()
      } finally { memory.mockRestore() }
    } finally { process.execArgv = originalArgs; vi.unstubAllEnvs(); core.mockRestore(); fork.mockRestore(); disk.mockRestore() }
  }))
  it("refuses malformed source/data joins before reading a window or private request", () => fixture((_dir, w) => {
    expect(() => parentApi.leanBaselineContinuationDataManifestV2(w, { sourceGate: null } as never)).toThrow(/SOURCE_GATE/)
    expect(() => parentApi.validateLeanBaselineContinuationRequestV2({ schemaVersion: "lean-baseline-continuation-request-v2", raw: "PRIVATE" }, w, {} as never)).toThrow(/REQUEST/)
    absent()
  }))
  it("builds the real selected manifest from canonical synthetic gates and denies crossed grant roots", () => fixture((_dir, originalWindow) => {
    const p = selected, implementationEntries = [{ path: "scripts/inert.ts", root: leanBytesRoot(Buffer.from("inert source")) }]
    const sourceRoot = labRoot("lean-baseline-continuation-implementation-v2", implementationEntries), planPath = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-BASELINE-CONTINUATION-PLAN-20261012.md", planRoot = leanBytesRoot(Buffer.from("inert plan"))
    const sourceGate: parentApi.LeanContinuationSourceGateV2 = { schemaVersion: "lean-baseline-continuation-source-gate-v2", plan_check: "passed", source_review: "passed", root_validation: "passed", source_verification: "passed", commands_closed: true, reviewedSourceHead: originalWindow.reviewedSourceHead, sourceRoot, sourceAuthor: "inert-author", sourceReviewer: "inert-reviewer", sourceVerifier: "inert-verifier" }
    const { root: _, ...windowBody } = { ...originalWindow, sourceRoot, planRoot, sourceGateRoot: labRoot(sourceGate.schemaVersion, sourceGate) }, w = { ...windowBody, root: labRoot(windowBody.schemaVersion, windowBody) }
    const dataGate: parentApi.LeanContinuationDataGateV2 = { schemaVersion: "lean-baseline-continuation-data-gate-v2", status: "passed", grantId: w.grantId, windowRoot: w.root, windowBytesRoot: leanBytesRoot(leanCanonicalBytes(w)), reviewedSourceHead: w.reviewedSourceHead, sourceRoot: w.sourceRoot, sourceGateRoot: w.sourceGateRoot, planRoot: w.planRoot, approvalEvidence: w.approvalEvidence, runOperator: w.runOperator, readerOperator: w.readerOperator, dataReviewer: "inert-data-reviewer", commands_closed: true }
    const gateBytes = Buffer.from(`\`\`\`json\n${Buffer.from(leanCanonicalBytes(sourceGate)).toString()}\n\`\`\`\n\`\`\`json\n${Buffer.from(leanCanonicalBytes(dataGate)).toString()}\n\`\`\`\n`)
    fs.mkdirSync(resolve("scripts")); fs.mkdirSync(resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team"), { recursive: true })
    fs.writeFileSync(resolve(implementationEntries[0]!.path), "inert source", { mode: 0o644 }); fs.writeFileSync(resolve(planPath), "inert plan", { mode: 0o644 })
    fs.writeFileSync(resolve(p.gates), gateBytes, { mode: 0o644 }); fs.writeFileSync(resolve(p.window), leanCanonicalBytes(w))
    const planningEntries = [{ path: planPath, root: planRoot }, { path: p.gates, root: leanBytesRoot(gateBytes) }].sort((a, b) => a.path.localeCompare(b.path)), entries = [...implementationEntries, ...planningEntries].sort((a, b) => a.path.localeCompare(b.path))
    const source = { implementationEntries, planningEntries, entries, schemaVersion: "lean-baseline-continuation-source-manifest-v2" as const, admitting: false as const, root: sourceRoot, planningRoot: labRoot("lean-baseline-continuation-planning-source-v2", planningEntries), manifestRoot: labRoot("lean-baseline-continuation-source-manifest-v2", entries), sourceGate: { ...sourceGate }, sourceGateRoot: w.sourceGateRoot }
    const manifest = parentApi.leanBaselineContinuationDataManifestV2(w, source)
    expect(manifest.planningEntries.find(row => row.path === p.window)?.root).toBe(dataGate.windowBytesRoot)
    expect(manifest.planningEntries.some(row => row.path === lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.window)).toBe(false)
    expect(parentApi.validateLeanContinuationDataGateV2(dataGate, w, sourceGate)).toEqual(dataGate)
    const { root: _v3, ...crossedBody } = { ...w, routeNamespace: "20261012-v3" as const }, crossed = { ...crossedBody, root: labRoot(crossedBody.schemaVersion, crossedBody) }
    expect(() => parentApi.validateLeanContinuationDataGateV2(dataGate, crossed, sourceGate)).toThrow(/DATA_GATE/)
    expect(() => parentApi.validateLeanContinuationDataGateV2({ ...dataGate, grantId: "spent-grant" }, w, sourceGate)).toThrow(/DATA_GATE/)
    absent()
  }))
  it("reads only selected V4 descriptor metadata with reservations before the inert parser", () => fixture((_dir, w) => {
    const p = selected
    fs.mkdirSync(resolve(p.temp), { mode: 0o700 }); fs.mkdirSync(resolve(p.store), { mode: 0o700 })
    fs.writeFileSync(resolve(p.allocation), "{}", { mode: 0o644 })
    for (const name of ["allocation.json", "ledger.ndjson", "time.ndjson"]) fs.writeFileSync(resolve(join(p.store, name)), "{}", { mode: 0o600 })
    const actualStat = fs.lstatSync, stat = vi.spyOn(fs, "lstatSync").mockImplementation(actualStat)
    const disk = vi.spyOn(fs, "statfsSync").mockReturnValue({ bavail: 100000000000n, bsize: 1n } as never)
    const memory = vi.spyOn(process, "memoryUsage").mockReturnValue({ ...process.memoryUsage(), rss: 100000000, arrayBuffers: 0 })
    const available = vi.spyOn(leagueHost, "observeLeagueAvailableMemoryBytes").mockReturnValue(4000000000)
    const ps = vi.spyOn(childProcess, "execFileSync").mockReturnValue("100\n" as never), parse = vi.fn(() => "inert-parsed")
    try {
      expect(parentApi.withLeanContinuationStoreMetadataV2(w, parse, 123)).toBe("inert-parsed")
      expect(parse).toHaveBeenCalledTimes(1)
      expect(stat.mock.calls.map(call => String(call[0]))).toContain(resolve(p.allocation))
      expect(stat.mock.calls.map(call => String(call[0]))).not.toContain(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation))
      memory.mockReturnValue({ ...process.memoryUsage(), rss: 4000000000 }); parse.mockClear()
      expect(() => parentApi.withLeanContinuationStoreMetadataV2(w, parse)).toThrow(/CAPACITY/); expect(parse).not.toHaveBeenCalled()
    } finally { stat.mockRestore(); disk.mockRestore(); memory.mockRestore(); available.mockRestore(); ps.mockRestore() }
  }))
  it("withholds raw private failure details and reports only finite V4 prepare stage/code", () => fixture((_dir, w) => {
    vi.mocked(Date.now).mockReturnValue(w.deadlineMs)
    let error: unknown
    try { parentApi.prepareLeanBaselineContinuationV2(selected.request) } catch (caught) { error = caught }
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(error)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=WINDOW code=WINDOW_EXPIRED\n")
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(new Error("PRIVATE path source stack"))).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n")
    const { root: _root, ...body } = { ...w, routeNamespace: "20261012-v3" as const }, v3 = { ...body, root: labRoot(body.schemaVersion, body) }
    fs.writeFileSync(resolve(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.window), leanCanonicalBytes(v3), { mode: 0o600 })
    let legacyError: unknown
    try { parentApi.prepareLeanBaselineContinuationV2(lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.request) } catch (caught) { legacyError = caught }
    expect(parentApi.leanBaselineContinuationPreparationFailureV4(legacyError)).toBe("LEAN_BASELINE_PREPARATION_V4 stage=UNKNOWN code=DETAILS_WITHHELD\n")
    absent()
  }))
})
describe("continuation CLI and narrow metadata", () => {
  it("[continuation-v2] dispatches the exact verify request to the distinct retained reader", async () => {
    const request = lean.LEAN_BASELINE_CONTINUATION_PATHS_V2.request
    const reader = vi.spyOn(continuationRetainedReader, "verifyLeanBaselineContinuationRetainedV2").mockReturnValue({ root: root("inert-check") } as never)
    try {
      expect(parseLeanBaselineCommand(["verify-continuation-v2", "--request", request])).toEqual({ mode: "verify-continuation-v2", request })
      await parentApi.leanBaselineMain(["verify-continuation-v2", "--request", request])
      expect(reader).toHaveBeenCalledTimes(1)
      expect(reader).toHaveBeenCalledWith(request)
      expect(() => parseLeanBaselineCommand(["verify-continuation-v2", "--request", lean.LEAN_BASELINE_CONTINUATION_PATHS.request])).toThrow()
    } finally { reader.mockRestore() }
  })
  it("observes one fresh complete parent manifest per callback and pins only the reviewed debug document", () => {
    const observe = vi.fn(() => ({ root: root("source"), planningRoot: root("planning") }))
    expect(parentApi.readLeanBaselineContinuationManifestRoot(root("planning"), observe)).toBe(root("source"))
    expect(observe).toHaveBeenCalledTimes(1)
    observe.mockReturnValue({ root: root("source"), planningRoot: root("changed") })
    expect(() => parentApi.readLeanBaselineContinuationManifestRoot(root("planning"), observe)).toThrow(/PLANNING_HOLD/)
    expect(observe).toHaveBeenCalledTimes(2)
    expect(parentApi.LEAN_BASELINE_CONTINUATION_PLANNING_PATHS.filter(p => p.startsWith(".planning/debug/"))).toEqual([".planning/debug/265-native-exit-reader-cost.md"])
  })
  it("accepts only the new exact request and keeps hidden child mode out of public dispatch", () => {
    const request = lean.LEAN_BASELINE_CONTINUATION_PATHS.request
    for (const mode of ["prepare-continuation", "run-continuation", "verify-continuation"]) {
      expect(parseLeanBaselineCommand([mode, "--request", request])).toEqual({ mode, request })
      expect(() => parseLeanBaselineCommand([mode, "--request", "/tmp/override.json"])).toThrow()
    }
    expect(() => parseLeanBaselineCommand(["child-continuation", "--request", request])).toThrow()
  })
  it("denies arbitrary programs, refs, paths and writes before any metadata process", () => {
    for (const args of [["status"], ["show", "HEAD:package.json"], ["show", `${"a".repeat(40)}:/etc/passwd`], ["show", `${"a".repeat(40)}:.strategy-lab/holdout/PREIMAGE`], ["rev-parse", "HEAD~1"], ["checkout", "main"], ["sh", "-c", "true"]]) expect(() => continuationGit.readLeanBaselineContinuationGit(args)).toThrow("LEAN_BASELINE_CONTINUATION_GIT_METADATA")
  })
})

describe("additive finite supervisor reason-v2 contract", () => {
  const fixture = (): parentApi.LeanSupervisorReasonEnvelopeV2 => {
    const body: Omit<parentApi.LeanSupervisorReasonEnvelopeV2, "root"> = { schemaVersion: "lean-parent-supervisor-reasons-v2", allocationRoot: root("allocation"), sourceRoot: root("source"), requestBytesRoot: root("request"), entryBytesRoot: root("entry"), head: "a".repeat(40), parentPid: 100, childPid: 101, exitCode: 0, signal: null, uncertain: false, reasons: [], observations: { entry: "published", childReady: "observed", resourceSampling: "observed", finalIdentity: "matched", failureReceipt: "absent", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown", resourceSamplingOperation: "none", resourceSamplingSequence: 0, resourceSamplingExitObserved: false } }
    return { ...body, root: labRoot("lean-parent-supervisor-reasons-v2", body) }
  }
  const reroot = (value: any) => { const { root: _ignored, ...body } = value; return { ...body, root: labRoot("lean-parent-supervisor-reasons-v2", body) } }
  it("accepts only separately rooted exact canonical v2 bytes", () => {
    const v = fixture(), bytes = leanCanonicalBytes(v)
    expect(parentApi.validateLeanSupervisorReasonBytesV2(bytes)).toEqual(v)
    expect(parentApi.leanSupervisorReasonRootV2(v)).toBe(v.root)
    expect(parentApi.isLeanSupervisorReasonEnvelope(v)).toBe(false)
    expect(() => parentApi.validateLeanSupervisorReasonBytes(bytes)).toThrow()
    for (const mutated of [Buffer.concat([Buffer.from(" "), bytes]), Buffer.alloc(4097), Buffer.from("{broken")]) expect(() => parentApi.validateLeanSupervisorReasonBytesV2(mutated)).toThrow()
  })
  it("requires finite first-exception attribution and rejects raw or contradictory fields", () => {
    const clean = fixture()
    const exception = reroot({ ...clean, uncertain: true, reasons: ["resource_sampling_exception"], observations: { ...clean.observations, resourceSampling: "exception", resourceSamplingOperation: "unknown", resourceSamplingSequence: 2147483647, resourceSamplingExitObserved: true } })
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2(exception)).toBe(true)
    for (const patch of [{ resourceSamplingOperation: "none" }, { resourceSamplingOperation: "raw_error" }, { resourceSamplingSequence: 0 }, { resourceSamplingSequence: -1 }, { resourceSamplingSequence: 2147483648 }, { resourceSamplingSequence: 1.5 }, { resourceSamplingExitObserved: "false" }, { rawError: "PRIVATE" }]) expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...exception, observations: { ...exception.observations, ...patch } }))).toBe(false)
    for (const patch of [{ resourceSamplingOperation: "child_rss" }, { resourceSamplingSequence: 1 }, { resourceSamplingExitObserved: true }]) expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...clean, observations: { ...clean.observations, ...patch } }))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...exception, uncertain: false }))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2(reroot({ ...exception, rawError: "PRIVATE" }))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelopeV2({ ...exception, root: root("wrong") })).toBe(false)
  })
  it("saturates operation order without wrapping or accepting invalid counters", () => {
    expect(parentApi.nextLeanSupervisorSamplingSequenceV2(0)).toBe(1)
    expect(parentApi.nextLeanSupervisorSamplingSequenceV2(2147483646)).toBe(2147483647)
    expect(parentApi.nextLeanSupervisorSamplingSequenceV2(2147483647)).toBe(2147483647)
    for (const invalid of [-1, 0.5, 2147483648, NaN, Infinity]) expect(() => parentApi.nextLeanSupervisorSamplingSequenceV2(invalid)).toThrow()
  })
})

const host = vi.hoisted(() => ({ active: false, child: null as any, files: new Map<string, Uint8Array>(), order: [] as string[], entry: null as any, terminal: null as any, allocation: null as any, headCalls: 0, finalDrift: false, finalThrow: false, sampleThrow: false, resourceHigh: false, elapsed: 0, publishFailure: "", terminalFailure: false, capacityFailure: false }))
vi.mock("node:child_process", async original => {
  const actual = await original<typeof import("node:child_process")>()
  return { ...actual, fork: (...args: any[]) => host.active ? host.child : (actual.fork as any)(...args), execFileSync: (...args: any[]) => {
    if (!host.active) return (actual.execFileSync as any)(...args)
    if (args[0] === "ps") { if (host.sampleThrow) throw new Error("PRIVATE sample details"); return host.resourceHigh ? String(Math.ceil(LEAN_CAPS.scratchBytes / 1024)) : "100" }
    if (args[1][0] === "show") return leanCanonicalBytes(host.allocation)
    if (++host.headCalls > 1 && host.finalThrow) throw new Error("PRIVATE identity details")
    return (host.finalDrift && host.headCalls > 1 ? "b" : "a").repeat(40)
  } }
})
vi.mock("node:fs", async original => {
  const actual = await original<typeof import("node:fs")>()
  return { ...actual, readdirSync: (...args: any[]) => host.active ? [] : (actual.readdirSync as any)(...args), statfsSync: (...args: any[]) => host.active ? { bavail: host.capacityFailure ? 0n : 100000000000n, bsize: 1n } : (actual.statfsSync as any)(...args), openSync: (...args: any[]) => {
    if (!host.active) return (actual.openSync as any)(...args)
    const name = args[0].split("/").at(-1)
    host.order.push(name)
    if (name === host.publishFailure) throw new Error("PRIVATE publication details")
    host.files.set(name, new Uint8Array())
    return name
  }, fsyncSync: (...args: any[]) => host.active ? undefined : (actual.fsyncSync as any)(...args), closeSync: (...args: any[]) => host.active ? undefined : (actual.closeSync as any)(...args) }
})
vi.mock("./run-v1-38-lean-experiment.js", async original => {
  const actual = await original<typeof import("./run-v1-38-lean-experiment.js")>()
  return { ...actual, readLeanSafeFile: (...args: any[]) => host.active ? (args[0].endsWith("allocation.json") ? leanCanonicalBytes(host.allocation) : args[0].endsWith("entry.json") ? leanCanonicalBytes(host.entry) : Buffer.from("request")) : (actual.readLeanSafeFile as any)(...args) }
})
vi.mock("../packages/strategy-lab/src/league/lean-experiment.js", async original => {
  const actual = await original<typeof import("../packages/strategy-lab/src/league/lean-experiment.js")>()
  const call = (fn: (...args: any[]) => any, mock: (...args: any[]) => any) => (...args: any[]) => host.active ? mock(...args) : fn(...args)
  return { ...actual, readLeanLedger: call(actual.readLeanLedger, () => ({ events: [] })), readLeanTimeAccounting: call(actual.readLeanTimeAccounting, () => ({ active: false, starts: new Map() })), cumulativeLeanPhysicalBytes: call(actual.cumulativeLeanPhysicalBytes, () => 100), currentLeanElapsedMs: call(actual.currentLeanElapsedMs, () => host.elapsed), assertLeanPublicationCapacity: call(actual.assertLeanPublicationCapacity, (_ledger, bytes) => { host.order.push(`capacity:${bytes}`) }), writeLeanAll: call(actual.writeLeanAll, (fd, bytes) => host.files.set(fd, bytes)), publishLeanChildEntry: call(actual.publishLeanChildEntry, (_ledger, entry) => { host.entry = entry; host.order.push("entry") }), beginLeanInterval: call(actual.beginLeanInterval, () => host.order.push("interval")), deriveLeanChildTerminal: call(actual.deriveLeanChildTerminal, (_ledger, _entry, observation) => { host.order.push("derive-terminal"); return observation }), publishLeanChildTerminal: call(actual.publishLeanChildTerminal, (_ledger, terminal) => { host.order.push("terminal"); host.terminal = terminal; if (host.terminalFailure) throw new Error("PRIVATE terminal details") }) }
})

afterEach(() => { host.active = false; vi.useRealTimers() })
const beginParent = (enabled: boolean, configure?: () => void) => {
  vi.useFakeTimers()
  const input = { seed: "inert-parent-fixture", sourceRoot: root("source"), planRoot: root("plan"), coldRoot: root("cold") }
  const prior = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 11, elapsedUpperBoundMs: 3_319_046, allocatedDiskBytes: 0, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: [{ identity: ".strategy-lab/inert-parent-survivor", allocatedBytes: 0 }] }
  const allocation = createLeanCorrectionAllocation({ ...input, reviewRoot: root("review"), candidateRoots: deriveLeanBaselineCandidateRoots(input.coldRoot), requestRoots: deriveLeanBaselineRequestRoots(input), route: "baseline", reuseGrantRoot: root("reuse"), diagnosisRoot: root("diagnosis"), predecessor: { ...prior, root: labRoot(prior.schemaVersion, prior) } })
  Object.assign(host, { active: true, files: new Map(), order: [], entry: null, terminal: null, allocation, headCalls: 0, finalDrift: false, finalThrow: false, sampleThrow: false, resourceHigh: false, elapsed: 0, publishFailure: "", terminalFailure: false, capacityFailure: false })
  const child = Object.assign(new EventEmitter(), { pid: process.pid + 1000, exitCode: null as number | null, signalCode: null as string | null, kills: [] as string[], kill(signal: string) { this.kills.push(signal); return true }, send: () => true })
  host.child = child
  configure?.()
  const action = parentApi.runLeanBoundedParent({ ledger: { allocation: host.allocation } as LeanExperimentLedger, store: "/mock", requestPath: "/mock/request.json", allocationPath: "/mock/allocation.json", sourceRoot: root("source"), manifestRoot: () => root("source"), childMode: "mock-inert", ...(enabled ? { supervisorObservation: true } : {}) })
  const settled = action.then(value => ({ value, error: null }), error => ({ value: null, error }))
  return { child, settled }
}
const readyParent = async (child: ReturnType<typeof beginParent>["child"]) => { child.emit("message", { ready: child.pid }); await Promise.resolve(); await Promise.resolve() }
const exitParent = (child: ReturnType<typeof beginParent>["child"]) => { child.exitCode = 0; child.emit("exit", 0, null) }

const preparationParentAllocation = (mode: "v12-1" | "v13-1") => {
  const extension = mode === "v13-1" ? lean.LEAN_PREPARATION_CONTINUATION_V13_EXTENSION : lean.LEAN_SUPERVISOR_RETEST_V12_EXTENSION
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: 34, elapsedUpperBoundMs: extension.priorElapsedMs, allocatedDiskBytes: extension.physicalFloorBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: Array.from({ length: 695 }, (_, ordinal) => ({ identity: `.strategy-lab/inert-parent-survivor-${ordinal}`, allocatedBytes: 4096 })) }
  return lean.createLeanSupervisorCorrectionAllocation({ sourceRoot: root("source"), reviewRoot: root("review"), coldRoot: root("cold"), planRoot: extension.planRoot, seed: "inert-preparation-parent", candidateRoots: [root("a"), root("b")], requestRoots: [root("request")], route: "diagnostic", reuseGrantRoot: root("reuse"), supervisorDecisionRoot: extension.approvalRoot, acceptedCheckRoot: null, acceptedReaderCloseRoot: null, requestBytesRoot: root("request"), dataReviewRoot: root("data"), setupAccountingRoot: root("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, timeboxExtension: extension, attemptOrdinal: 1, priorClosureRoot: root("old-carry"), continuationRoot: root("continuation"), predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }, 8)
}
describe("actual authenticated preparation parent reason publication", () => {
  it.each([false, true])("publishes actual v13 reason-v2 accepted by both strict consumers (legacy opt-in %s)", async enabled => {
    const { child, settled } = beginParent(enabled, () => { host.allocation = preparationParentAllocation("v13-1") })
    await readyParent(child); exitParent(child)
    expect((await settled).error).toBeNull()
    const bytes = host.files.get("parent-supervisor-reasons.json")!
    expect(bytes).toBeDefined()
    const reason = parentApi.validateLeanSupervisorReasonBytesV2(bytes)
    const entry = host.entry, terminal = host.terminal
    expect(assertLeanSupervisorReasonCustodyV2(bytes, { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid, exitCode: terminal.exitCode, signal: terminal.signal, status: terminal.status })).toEqual(reason)
    expect(validateLeanPreparationContinuationReasonJoinV13(bytes, entry, terminal)).toEqual(reason)
    expect(host.order.indexOf("parent-supervisor-reasons.json")).toBeLessThan(host.order.indexOf("derive-terminal"))
    expect(reason.observations.initiatingCause).toBe("unknown")
  })
  it("keeps the strict v12 predicate narrow and its actual no-opt-in reason-v2 publication unchanged", async () => {
    expect(lean.isLeanSupervisorRetestMode("v13-1")).toBe(false)
    const { child, settled } = beginParent(false, () => { host.allocation = preparationParentAllocation("v12-1") })
    await readyParent(child); exitParent(child)
    expect((await settled).error).toBeNull()
    expect(parentApi.validateLeanSupervisorReasonBytesV2(host.files.get("parent-supervisor-reasons.json")!).schemaVersion).toBe("lean-parent-supervisor-reasons-v2")
  })
})

const timeboxBaseline = (extended: boolean, bookkeeping = false) => {
  const extension = bookkeeping ? lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION : lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: bookkeeping ? 31 : 30, elapsedUpperBoundMs: extended ? extension.priorElapsedMs : lean.LEAN_RETRY_V8_CARRY.priorElapsedMs, allocatedDiskBytes: 13_000_000, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: root("history"), survivors: [{ identity: ".strategy-lab/inert-parent-survivor", allocatedBytes: 4096 }] }
  return lean.createLeanSupervisorCorrectionAllocation({ ...(extended ? { timeboxExtension: extension } : {}), sourceRoot: root("source"), reviewRoot: root("review"), coldRoot: root("cold"), planRoot: lean.LEAN_RETRY_V8_PLAN_ROOT, seed: "inert-timebox-baseline", candidateRoots: [root("a"), root("b")], requestRoots: Array.from({ length: 36 }, (_, n) => root(`request-${n}`)), route: "baseline", reuseGrantRoot: root("reuse"), supervisorDecisionRoot: lean.LEAN_RETRY_V8_APPROVAL_ROOT, acceptedCheckRoot: root("actual-check-fixture"), acceptedReaderCloseRoot: root("actual-final-fixture"), requestBytesRoot: root("request"), dataReviewRoot: root("data"), setupAccountingRoot: root("setup"), startupPolicyRoot: lean.LEAN_STARTUP_POLICY_V5.root, attemptOrdinal: bookkeeping ? 2 : 1, priorClosureRoot: bookkeeping ? lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION.diagnosticClosureRoot : null, continuationRoot: bookkeeping ? root("fresh-continuation") : null, predecessor: { ...p, root: labRoot(p.schemaVersion, p) } }, 8)
}
describe("actual conditional baseline parent timebox consumer", () => {
  it("consumes the new ordinal2 carry continuously with the same parent reserve", async () => {
    const b = lean.LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION
    const { child, settled } = beginParent(true, () => { host.allocation = timeboxBaseline(true, true); host.elapsed = lean.leanRetryRootElapsedFloorV8(b.startedAtMs + 100, b) })
    expect(parentApi.leanBoundedParentTimeBudget({ allocation: host.allocation } as LeanExperimentLedger, 1_260_000)).toEqual({ elapsedMs: 62_024_183, capMs: 72_000_000, timeoutMs: 8_715_817 })
    await readyParent(child)
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toHaveLength(0)
    host.elapsed = 70_140_000
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toContain("SIGKILL")
    exitParent(child); expect((await settled).error).toBeInstanceOf(TypeError)
  })
  it("uses the approved carry/start, cap and child timeout after legacy expiry", async () => {
    const extension = lean.LEAN_RETRY_V8_TIMEBOX_EXTENSION
    const { child, settled } = beginParent(true, () => { host.allocation = timeboxBaseline(true); host.elapsed = lean.leanRetryRootElapsedFloorV8(extension.startedAtMs + 3_999_083, extension) })
    const timers = vi.spyOn(globalThis, "setTimeout")
    expect(host.elapsed).toBe(60_000_000)
    expect(parentApi.leanBoundedParentTimeBudget({ allocation: host.allocation } as LeanExperimentLedger, 1_260_000)).toEqual({ elapsedMs: 60_000_000, capMs: 72_000_000, timeoutMs: 10_740_000 })
    await readyParent(child)
    expect(timers.mock.calls.some(call => call[1] === 12_000_000)).toBe(true)
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toHaveLength(0)
    host.elapsed = 70_140_000
    await vi.advanceTimersByTimeAsync(250)
    expect(child.kills).toContain("SIGKILL")
    exitParent(child); expect((await settled).error).toBeInstanceOf(TypeError)
    timers.mockRestore()
  })
  it.each(["legacy", "missing", "stale", "cross-root"] as const)("%s cannot extend admission or create a child", async variant => {
    const { child, settled } = beginParent(true, () => {
      const allocation = timeboxBaseline(variant !== "legacy")
      if (variant === "missing") { const { timeboxExtension: _extension, ...missing } = allocation; host.allocation = missing }
      else host.allocation = variant === "legacy" ? allocation : { ...allocation, timeboxExtension: { ...allocation.timeboxExtension!, ...(variant === "stale" ? { startedAtMs: 0 } : { root: root("cross-root") }) } }
      host.elapsed = 60_000_000
    })
    expect((await settled).error).toBeInstanceOf(TypeError)
    expect(host.entry).toBeNull(); expect(child.kills).toHaveLength(0)
    expect(() => parentApi.leanBoundedParentTimeBudget({ allocation: host.allocation } as LeanExperimentLedger)).toThrow()
  })
  it("keeps memory and disk refusal ahead of parent release", async () => {
    const { child, settled } = beginParent(true, () => { host.allocation = timeboxBaseline(true); host.elapsed = 60_000_000; host.capacityFailure = true })
    await readyParent(child)
    expect((await settled).error).toBeInstanceOf(TypeError)
    expect(host.entry).toBeNull()
  })
})

describe("opt-in finite parent supervisor observations", () => {
  it("publishes actual custody before terminal without adding default artifacts", async () => {
    for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled)
      await readyParent(child); exitParent(child)
      expect((await settled).error).toBeNull()
      const bytes = host.files.get("parent-supervisor-reasons.json")
      if (!enabled) { expect(bytes).toBeUndefined(); continue }
      const reason = parentApi.validateLeanSupervisorReasonBytes(bytes!)
      expect(reason).toMatchObject({ allocationRoot: host.allocation.root, sourceRoot: root("source"), requestBytesRoot: leanBytesRoot(Buffer.from("request")), entryBytesRoot: leanBytesRoot(leanCanonicalBytes(host.entry)), head: "a".repeat(40), parentPid: process.pid, childPid: child.pid, exitCode: 0, signal: null, uncertain: false, reasons: [] })
      expect(reason.observations).toMatchObject({ entry: "published", cleanup: "child_exit_observed", terminalization: "unobserved", initiatingCause: "unknown" })
      expect(host.order.indexOf("parent-supervisor-reasons.json")).toBeLessThan(host.order.indexOf("derive-terminal"))
      expect(bytes!.length).toBeLessThanOrEqual(4096)
      expect(host.order.some(item => item === `capacity:${bytes!.length}`)).toBe(true)
    }
  })

  it.each(["child_error", "malformed_ipc", "duplicate_failure_receipt", "resource_threshold", "resource_sampling_exception", "deadline_timeout", "final_identity_mismatch", "final_identity_exception", "failure_receipt_publication_uncertain"])("retains %s at its actual unchanged setter", async code => {
    const runs: any[] = []
    for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled, () => { if (code === "deadline_timeout") host.elapsed = LEAN_CAPS.elapsedMs - 1 })
      await readyParent(child)
      const receipt = { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "UNKNOWN_INTERNAL_FAILURE", stage: "unknown" }
      if (code === "child_error") { child.emit("error", new Error("PRIVATE ERROR")); child.emit("error", new Error("PRIVATE ERROR")) }
      if (code === "malformed_ipc") child.emit("message", { private: "PRIVATE INPUT" })
      if (code === "duplicate_failure_receipt") { child.emit("message", receipt); child.emit("message", receipt) }
      if (code === "resource_threshold") { host.resourceHigh = true; await vi.advanceTimersByTimeAsync(250) }
      if (code === "resource_sampling_exception") { host.sampleThrow = true; await vi.advanceTimersByTimeAsync(250) }
      if (code === "deadline_timeout") await vi.advanceTimersByTimeAsync(1)
      if (code === "final_identity_mismatch") host.finalDrift = true
      if (code === "final_identity_exception") host.finalThrow = true
      if (code === "failure_receipt_publication_uncertain") { child.emit("message", receipt); host.publishFailure = "entry-failure.json" }
      exitParent(child)
      expect((await settled).error).toBeInstanceOf(TypeError)
      expect(host.terminal.status).toBe("child_failed")
      runs.push({ kills: [...child.kills], status: host.terminal.status, checks: host.order.filter(item => !item.startsWith("capacity:") && item !== "parent-supervisor-reasons.json") })
      if (enabled) {
        const bytes = host.files.get("parent-supervisor-reasons.json")!
        const value = parentApi.validateLeanSupervisorReasonBytes(bytes)
        expect(value.reasons).toContain(code)
        expect(value.reasons.filter(reason => reason === code)).toHaveLength(1)
        expect(value.uncertain).toBe(true)
        expect(Buffer.from(bytes).toString()).not.toContain("PRIVATE")
      }
    }
    expect(runs[1]).toEqual(runs[0])
  })

  it("keeps simultaneous reasons and still fails when reason publication fails", async () => {
    const { child, settled } = beginParent(true)
    await readyParent(child)
    child.emit("error", new Error("PRIVATE")); child.emit("message", null)
    exitParent(child); await settled
    expect(parentApi.validateLeanSupervisorReasonBytes(host.files.get("parent-supervisor-reasons.json")!).reasons).toEqual(["child_error", "malformed_ipc"])
    const second = beginParent(true, () => { host.publishFailure = "parent-supervisor-reasons.json" })
    await readyParent(second.child); exitParent(second.child)
    expect((await second.settled).error).toBeInstanceOf(TypeError)
    expect(host.terminal.status).toBe("child_failed")
    expect(host.order).toContain("terminal")
  })

  it("does not invent a terminal write or future cleanup observation", async () => {
    const { child, settled } = beginParent(true, () => { host.terminalFailure = true })
    await readyParent(child); exitParent(child)
    expect((await settled).error).toBeInstanceOf(Error)
    const value = parentApi.validateLeanSupervisorReasonBytes(host.files.get("parent-supervisor-reasons.json")!)
    expect(value.observations.terminalization).toBe("unobserved")
    expect(value.observations.cleanup).toBe("child_exit_observed")
  })

  it("publishes the failure receipt first without copying its asserted stage or code", async () => {
    const { child, settled } = beginParent(true)
    await readyParent(child)
    child.emit("message", { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "SOURCE_HOLD", stage: "match" })
    exitParent(child)
    expect((await settled).error).toBeInstanceOf(TypeError)
    const bytes = host.files.get("parent-supervisor-reasons.json")!
    const value = parentApi.validateLeanSupervisorReasonBytes(bytes)
    expect(value.uncertain).toBe(false)
    expect(value.reasons).toEqual([])
    expect(value.observations.failureReceipt).toBe("published")
    expect(Buffer.from(bytes).toString()).not.toMatch(/SOURCE_HOLD|"match"/u)
    expect(host.order.indexOf("entry-failure.json")).toBeLessThan(host.order.indexOf("parent-supervisor-reasons.json"))
    expect(host.terminal.status).toBe("child_failed")
  })

  it("keeps malformed ready and ready-timeout cleanup unchanged without inventing entry custody", async () => {
    for (const mode of ["malformed", "timeout"]) for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled)
      if (mode === "malformed") child.emit("message", { ready: -1 })
      else await vi.advanceTimersByTimeAsync(30_000)
      expect((await settled).error).toBeInstanceOf(TypeError)
      expect(child.kills).toEqual(["SIGKILL"])
      expect(host.entry).toBeNull()
      expect(host.files.size).toBe(0)
    }
  })

  it("keeps pre-entry capacity refusal artifact-free and performs unchanged cleanup", async () => {
    for (const enabled of [false, true]) {
      const { child, settled } = beginParent(enabled, () => { host.capacityFailure = true })
      await readyParent(child)
      expect((await settled).error).toBeInstanceOf(TypeError)
      expect(child.kills).toEqual(["SIGKILL"])
      expect(host.files.size).toBe(0)
    }
  })

  it("rejects extra/raw keys, arbitrary enums, malformed roots, nonfinite numbers, duplicate reasons and noncanonical/oversized bytes", async () => {
    const { child, settled } = beginParent(true)
    await readyParent(child); exitParent(child); await settled
    const valid = parentApi.validateLeanSupervisorReasonBytes(host.files.get("parent-supervisor-reasons.json")!)
    const mutate = (change: Record<string, unknown>) => { const { root: _root, ...body } = { ...valid, ...change }; let mutatedRoot = root("invalid"); try { mutatedRoot = labRoot("lean-parent-supervisor-reasons-v1", body) } catch { /* Deliberately noncanonical mutation. */ }; return { ...body, root: mutatedRoot } }
    for (const change of [{ rawError: "PRIVATE" }, { reasons: ["arbitrary"] }, { sourceRoot: "bad" }, { exitCode: Infinity }, { parentPid: NaN }, { parentPid: 0 }, { signal: "PRIVATE" }, { reasons: ["child_error", "child_error"] }, { observations: { ...valid.observations, terminalization: "success" } }, { head: "a".repeat(5000) }]) expect(parentApi.isLeanSupervisorReasonEnvelope(mutate(change))).toBe(false)
    expect(parentApi.isLeanSupervisorReasonEnvelope({ ...valid, root: root("wrong") })).toBe(false)
    expect(() => parentApi.validateLeanSupervisorReasonBytes(Buffer.from(` ${Buffer.from(host.files.get("parent-supervisor-reasons.json")!).toString()}`))).toThrow()
    expect(() => parentApi.validateLeanSupervisorReasonBytes(Buffer.alloc(4097, 32))).toThrow()
  })
})

describe("current-only baseline CLI source contracts", () => {
  it("allows the real root author only with a distinct subagent reviewer", () => {
    expect(admitsLeanBaselineReviewAgents("/root", "/root/review_265_lean_baseline")).toBe(true)
    expect(admitsLeanBaselineReviewAgents("/root/entry", "/root/review_265_lean_baseline")).toBe(true)
    expect(admitsLeanBaselineReviewAgents("/root", "/root")).toBe(false)
    expect(admitsLeanBaselineReviewAgents("/root/review_265_lean_baseline", "/root/review_265_lean_baseline")).toBe(false)
    expect(admitsLeanBaselineReviewAgents("someone-else", "/root/review_265_lean_baseline")).toBe(false)
  })

  it("admits only the prospective prepare/run/retained-reader surface", () => {
    expect(parseLeanBaselineCommand(["prepare-current", "--request", "a"]).mode).toBe("prepare-current")
    expect(parseLeanBaselineCommand(["run-current", "--request", "a"]).mode).toBe("run-current")
    expect(parseLeanBaselineCommand(["verify-retained", "--request", "a"]).mode).toBe("verify-retained")
    for (const command of ["prepare-pilot", "run-pilot", "child-current", "run-current", "verify-retained"]) {
      expect(() => parseLeanBaselineCommand([command, "a"])).toThrow(/LEAN_BASELINE_ARGUMENTS/u)
    }
    expect(() => parseLeanBaselineCommand(["run-current", "--request", "--unsafe"])).toThrow(/LEAN_BASELINE_ARGUMENTS/u)
  })

  it("freezes 36 distinct current intents, not post-training source roots", () => {
    const input = { seed: "baseline-test", coldRoot: root("cold"), planRoot: root("plan"), sourceRoot: root("source") }
    const requestRoots = deriveLeanBaselineRequestRoots(input)
    expect(requestRoots).toHaveLength(36)
    expect(new Set(requestRoots).size).toBe(36)
    expect(deriveLeanBaselineRequestRoots(input)).toEqual(requestRoots)
    expect(deriveLeanBaselineRequestRoots({ ...input, seed: "other" })).not.toEqual(requestRoots)
    expect(deriveLeanBaselineCandidateRoots(input.coldRoot)).toHaveLength(2)
    expect(new Set(deriveLeanBaselineCandidateRoots(input.coldRoot)).size).toBe(2)
    for (let ordinal = 0; ordinal < 36; ordinal++) expect(currentBaselineSlotKind(ordinal).condition).toBe((ordinal < 8 ? ordinal : ordinal < 12 ? ordinal - 8 : ordinal < 20 ? ordinal - 12 : ordinal < 28 ? ordinal - 20 : ordinal < 32 ? ordinal - 28 : ordinal - 32) % 4)

    const activeArenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active" && a.schedulable).sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
    const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.id === "arena:smoke:v1" && a.name === "Smoke" && a.status === "active" && a.schedulable)!
    const predecessor = { schemaVersion: "lean-closed-v7-predecessor-v1", closed: { allocationRoot: LEAN_CLOSED_V7.allocationRoot }, elapsedUpperBoundMs: LEAN_CLOSED_V7.elapsedUpperBoundMs, chargedMatches: LEAN_CLOSED_V7.chargedMatches, allocatedDiskBytes: 0 } as never
    const allocation = createLeanCurrentBaselineAllocation({ ...input, reviewRoot: root("review"), planRoot: input.planRoot, candidateRoots: deriveLeanBaselineCandidateRoots(input.coldRoot), requestRoots, seed: input.seed }, predecessor)
    expect(allocation.slots).toHaveLength(36)
    expect(allocation.slots.every((slot, ordinal) => slot.arenaHash === smoke.semanticGeometryHash && slot.arenaHash === activeArenas[currentBaselineSlotKind(ordinal).arenaIndex]!.semanticGeometryHash && slot.requestRoot === requestRoots[ordinal])).toBe(true)
    for (let start = 0; start < 36; start += 4) {
      const conditions = allocation.slots.slice(start, start + 4).map(slot => slot.condition)
      expect(conditions).toEqual([0, 1, 2, 3])
      expect(new Set(conditions.map(condition => condition < 2 ? "entrant-bottom" : "entrant-top"))).toEqual(new Set(["entrant-bottom", "entrant-top"]))
      expect(new Set(conditions.map(condition => condition % 2 === 0 ? "bottom-initiative" : "top-initiative"))).toEqual(new Set(["bottom-initiative", "top-initiative"]))
    }
    for (let offset = 0; offset < 4; offset++) {
      expect(allocation.slots[32 + offset]).toMatchObject({ arenaHash: allocation.slots[8 + offset]!.arenaHash, condition: allocation.slots[8 + offset]!.condition })
      expect(leanBaselineMatchSeed(input.seed, 32 + offset)).toBe(leanBaselineMatchSeed(input.seed, 8 + offset))
    }
  })

  it("roots the pre-charge byte prefix and frozen pair to each intended slot", () => {
    const slot = { ordinal: 0, condition: 0, arenaHash: root("arena"), requestRoot: root("request"), root: root("slot") }
    const input = { ordinal: 0, slot, priorLedgerBytesRoot: root("ledger"), priorLedgerByteLength: 140, priorCharged: 9, bottom: { role: "initial-tactical", sourceRoot: root("bottom-source"), root: root("bottom-snapshot") }, top: { role: "cold-opponent", sourceRoot: root("top-source"), root: root("top-snapshot") } }
    const pair = leanBaselinePair(input)
    expect(pair.priorCharged).toBe(9)
    expect(pair.priorLedgerByteLength).toBe(140)
    expect(leanBaselinePair(input)).toEqual(pair)
    expect(leanBaselinePair({ ...input, priorLedgerBytesRoot: root("different-prefix") }).root).not.toBe(pair.root)
    expect(leanBaselinePair({ ...input, bottom: { ...input.bottom, sourceRoot: root("different-source") } }).root).not.toBe(pair.root)
  })

  it("binds every new runtime, reader and shell source without mutating the legacy factory manifest", () => {
    const manifest = leanBaselineSourceManifest()
    const paths = new Set(manifest.entries.map(entry => entry.path))
    for (const path of ["scripts/run-v1-38-lean-baseline.ts", "scripts/run-v1-38-lean-baseline.sh", "scripts/lib/v1-38-lean-baseline-pipeline.ts", "scripts/lib/v1-38-lean-baseline-retained.ts", "scripts/lib/v1-38-lean-baseline-match.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "packages/strategy-lab/src/league/lean-training.ts", "packages/strategy-lab/src/league/lean-experiment.ts"]) expect(paths.has(path)).toBe(true)
    expect(manifest.entries).toEqual([...manifest.entries].sort((a, b) => a.path.localeCompare(b.path)))
  })

  it("requires inherited pre-loader write controls and core suppression", () => {
    const scope = { cacheDisabled: "1", compileDisabled: "1", tempDirectory: resolve(".strategy-lab/lean-baseline-20261004-v1-tmp") }
    expect(() => assertLeanBaselineWritableScope(scope, "0\n")).not.toThrow()
    expect(() => assertLeanBaselineWritableScope({ ...scope, coverage: "/tmp/leak" }, "0")).toThrow(/WRITABLE_SCOPE/u)
    expect(() => assertLeanBaselineWritableScope(scope, "unlimited")).toThrow(/WRITABLE_SCOPE/u)
  })

  // This legacy integration probe creates the canonical actual scratch path.
  // Source-only suites must never consume that path.
  it.skip("wrapper reports safe inherited scope without entering preparation or Matches", () => {
    const output = execFileSync("sh", ["scripts/run-v1-38-lean-baseline.sh", "--probe-launch-scope"], { cwd: resolve("."), env: { ...process.env, LEAN_BASELINE_LAUNCH_PROBE: "1", NODE_OPTIONS: "--trace-warnings", NODE_COMPILE_CACHE: "/tmp/leak", NODE_REDIRECT_WARNINGS: "/tmp/leak", NODE_V8_COVERAGE: "/tmp/leak" }, encoding: "utf8", timeout: 10_000 })
    expect(output).toContain("cache=1 compile=1")
    expect(output).toContain("node_options=unset compile_cache=unset warnings=unset coverage=unset core=0")
    expect(output).toContain("lean-baseline-20261004-v1-tmp")
  })
})
