/** HOST SOURCE ONLY: canonical offline observations/static compilation, never
 * authored Strategy execution, private history, allocation or provider admission. */
import { describe, expect, it, vi } from "vitest"
import { mkdtempSync, readFileSync, realpathSync, rmSync, readdirSync, lstatSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as reuseAPI from "./v1-38-lean-baseline-reuse.js"
import * as revisionAPI from "../../packages/runtime-js/src/revision.js"
import * as factoryAPI from "../../packages/strategy-lab/src/factory/admission.js"
import * as correctionAPI from "../run-v1-38-lean-correction.js"
import * as sourceAPI from "./v1-38-lean-baseline-source.js"
import * as retainedAPI from "./v1-38-lean-baseline-retained.js"
import * as leanAPI from "../../packages/strategy-lab/src/league/lean-experiment.js"
import type { LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import type { LeanExperimentLedger, LeanCorrectionAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanInitialProposals } from "./v1-38-lean-training-adapter.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { LEAN_COLD_REUSE_HISTORY as HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { leanBytesRoot, leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"

// Block any historical private-path syscall before it reaches the real FS.
// This is a rejecting custody seam, never a successful authentication stub.
vi.mock("node:fs", async original => {
  const real = await original<typeof import("node:fs")>()
  const blockPrivate = (path: unknown) => { if (String(path).includes(".strategy-lab/")) throw new Error("HOST_PRIVATE_CUSTODY_ABSENT") }
  return { ...real,
    lstatSync: (...args: Parameters<typeof real.lstatSync>) => { blockPrivate(args[0]); return real.lstatSync(...args) },
    readFileSync: (...args: Parameters<typeof real.readFileSync>) => { blockPrivate(args[0]); return real.readFileSync(...args) },
    openSync: (...args: Parameters<typeof real.openSync>) => { blockPrivate(args[0]); return real.openSync(...args) },
  }
})

// Only the measured physical-byte input is synthetic. The real capacity
// arithmetic/rejection runs; do not inspect any retained private destinations.
vi.mock("../../packages/strategy-lab/src/league/lean-experiment.js", async original => {
  const real = await original<typeof import("../../packages/strategy-lab/src/league/lean-experiment.js")>()
  return { ...real, assertLeanPublicationCapacity: (ledger: LeanExperimentLedger, bytes: number) => real.assertLeanPublicationCapacity(ledger, bytes, lstatSync(ledger.directory).blocks * 512 + readdirSync(ledger.directory).reduce((sum, name) => sum + lstatSync(join(ledger.directory, name)).blocks * 512, 0)) }
})

const currentSource = labRoot("precharge-host-source-fixture", 1)
const fixture = (): LeanColdReuse => {
  const corpus = buildLeanColdCorpus(HISTORY.seed)
  const proposals = buildLeanInitialProposals({ commonSourceRoot: HISTORY.coldRoot, tacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts })
  const sources = [emitTacticalSource(), buildPlannerCandidate().source, ...proposals.tactical.map(p => p.source), proposals.teacher.source].map((source, ordinal) => buildLeanBaselineSource({ role: ["cold-opponent", "probe", "tactical-0", "tactical-1", "tactical-2", "tactical-3", "teacher-0"][ordinal]!, source, coldRoot: HISTORY.coldRoot, implementationRoot: HISTORY.sourceRoot }))
  // PUBLIC source constants, not private artifacts, are the literal grant pins.
  const publicModule = readFileSync(new URL("./v1-38-lean-baseline-reuse.ts", import.meta.url), "utf8")
  const raw = publicModule.slice(publicModule.indexOf("const RAW ="), publicModule.indexOf("export const LEAN_COLD_REUSE_FILES"))
  const artifactRoots = Object.fromEntries([...raw.matchAll(/"([^"]+)": "(sha256:[0-9a-f]{64})"/gu)].map(match => [match[1]!, match[2] as LabRoot]))
  expect(Object.keys(artifactRoots)).toHaveLength(14)
  for (const [name, value] of [["cold-corpus.json", corpus], ["initial-proposals.json", proposals], ...sources.map(s => [`source-${s.role}.json`, s])] as const) expect(leanBytesRoot(leanCanonicalBytes(value))).toBe(artifactRoots[name as string])
  const body = { schemaVersion: "lean-cold-reuse-grant-v1" as const, privacy: "private_offline" as const, amendmentRoot: HISTORY.amendmentRoot, newSourceRoot: currentSource, seed: HISTORY.seed, coldRoot: HISTORY.coldRoot, corpusRoot: corpus.corpusRoot, proposalSetRoot: proposals.root, artifactRoots,
    sourceBindings: sources.map(s => ({ role: s.role, snapshotRoot: s.root, packetRoot: s.packet.root, proposalRoot: s.proposal.root, validationRoot: s.validation.root, sourceRoot: s.sourceRoot })),
    predecessor: { sourceRoot: HISTORY.sourceRoot, allocationRoot: HISTORY.allocationRoot, resultBytesRoot: artifactRoots["result.json"]!, terminalBytesRoot: artifactRoots["child-terminal.json"]!, chargeBytesRoot: artifactRoots["ledger.ndjson"]!, timeBytesRoot: artifactRoots["time.ndjson"]!, verificationRoot: HISTORY.verificationRoot, chargedMatches: 10 as const, elapsedMs: 3319046 as const, historicalPeakDiskKnown: false as const, historicalPeakRssKnown: false as const },
    opportunity: { tacticalEvaluations: 64 as const, teacherSearchNodes: 64 as const, distillationExamples: 64 as const, responseNodes: 128 as const, totalChannelOperations: 320 as const, spentColdOperations: 192 as const, prospectiveResponseNodes: 128 as const } }
  return { corpus, proposals, sources, grant: { ...body, root: labRoot("lean-cold-reuse-grant-v1", body) } }
}

const scopeFor = (reuse: LeanColdReuse, owner = {}) => ({ invocation: owner, sourceRoot: currentSource, allocationRoot: labRoot("precharge-host-allocation", 1), coldRoot: HISTORY.coldRoot, seed: HISTORY.seed, grantRoot: reuse.grant.root })
const ledgerFor = (directory: string, reuse: LeanColdReuse): LeanExperimentLedger => ({ directory, allocation: { schemaVersion: "lean-correction-baseline-allocation-v1", sourceRoot: currentSource, root: labRoot("precharge-host-allocation", 1), coldRoot: HISTORY.coldRoot, seed: HISTORY.seed, reuseGrantRoot: reuse.grant.root, predecessor: { allocatedDiskBytes: 0 }, slots: Array.from({ length: 36 }, (_, ordinal) => ({ ordinal, condition: ordinal % 4, root: labRoot("precharge-host-slot", ordinal) })) } as unknown as LeanCorrectionAllocation })
const supervisedAllocation = (reuse: LeanColdReuse, version: 6 | 8, disk?: number) => {
  const p = { schemaVersion: "lean-correction-predecessor-v1" as const, chargedMatches: version === 6 ? 25 : 30, elapsedUpperBoundMs: version === 6 ? 36151532 : leanAPI.LEAN_RETRY_V8_CARRY.priorElapsedMs, allocatedDiskBytes: disk ?? (version === 6 ? 10432512 : leanAPI.LEAN_REPLAY_V7_CARRY.physicalFloorBytes), historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, historyRoot: labRoot("precharge-host-history", version), survivors: [{ identity: ".strategy-lab/host-source-fixture-only", allocatedBytes: 0 }] }
  return leanAPI.createLeanSupervisorCorrectionAllocation({ sourceRoot: currentSource, reviewRoot: labRoot("precharge-host-review", 1), coldRoot: HISTORY.coldRoot,
    planRoot: version === 6 ? leanAPI.LEAN_REPLAY_V6_SUPPLEMENT_ROOT : leanAPI.LEAN_RETRY_V8_PLAN_ROOT, candidateRoots: [labRoot("precharge-host-candidate", 0), labRoot("precharge-host-candidate", 1)], requestRoots: Array.from({ length: 36 }, (_, n) => labRoot("precharge-host-request", n)), seed: HISTORY.seed, route: "baseline", reuseGrantRoot: reuse.grant.root,
    supervisorDecisionRoot: version === 6 ? leanAPI.LEAN_REPLAY_V6_APPROVAL_ROOT : leanAPI.LEAN_RETRY_V8_APPROVAL_ROOT, acceptedCheckRoot: labRoot("precharge-host-UNAUTHENTICATED-check", 1), requestBytesRoot: labRoot("precharge-host-request-bytes", 1), dataReviewRoot: labRoot("precharge-host-data", 1), setupAccountingRoot: labRoot("precharge-host-setup", 1), startupPolicyRoot: leanAPI.LEAN_STARTUP_POLICY_V5.root,
    predecessor: { ...p, root: labRoot(p.schemaVersion, p) }, ...(version === 8 ? { attemptOrdinal: 1 as const, priorClosureRoot: null, continuationRoot: null, acceptedReaderCloseRoot: labRoot("precharge-host-UNAUTHENTICATED-close", 1) } : {}),
  }, version)
}
const writeEntry = (ledger: LeanExperimentLedger, head = "a".repeat(40)) => {
  writeFileSync(join(ledger.directory, "entry.json"), leanCanonicalBytes({ schemaVersion: "lean-child-entry-v2", allocationRoot: ledger.allocation.root, sourceRoot: ledger.allocation.sourceRoot, requestBytesRoot: labRoot("precharge-host-request-bytes", 1), head, parentPid: 101, childPid: 102, handshakeRoot: labRoot("precharge-host-handshake", 1), wallStartMs: 0, monotonicStartNs: "0" }), { mode: 0o600 })
}

describe("precharge owned reuse", () => {
  it("reconstructs literal historical pins before any owned-admission measurement", () => {
    const corpus = buildLeanColdCorpus(HISTORY.seed)
    expect(leanBytesRoot(leanCanonicalBytes(corpus))).toBe("sha256:4a4260e20acf4048e60291b90439ac589ed3c8faabd50d6f601b496e797fe383")
    const proposals = buildLeanInitialProposals({ commonSourceRoot: HISTORY.coldRoot, tacticalInputs: corpus.tacticalInputs, teacherSearchReceipts: corpus.teacherSearchReceipts })
    expect(leanBytesRoot(leanCanonicalBytes(proposals))).toBe("sha256:3811daff3d14f4f30bdad895630146208d56e7e50c5ada0b08397af35d3779cf")
    const definitions = [
      ["cold-opponent", emitTacticalSource(), "sha256:1086a24213ddb18ed209f760ea3f3eacf7c0a7f06e8dc213d4f7ab1123f70f21"],
      ["probe", buildPlannerCandidate().source, "sha256:8425b7eedf2aa93c879791741bd3915e778f7ab12a9a43130ca3c2b864320f3a"],
      ["tactical-0", proposals.tactical[0]!.source, "sha256:5ac15a0c06866c53129e8cc89b7f3766fc45ac57c64aeaa59d56ac07e52b1d98"],
      ["tactical-1", proposals.tactical[1]!.source, "sha256:d474eb5ba66320adf7467a9d3bb04f3b283580759646598106b5d2ae82360e77"],
      ["tactical-2", proposals.tactical[2]!.source, "sha256:0efb2c5efb04b0697473a9b30656d7d12112e711bec6e64f8fc36ab031fa4834"],
      ["tactical-3", proposals.tactical[3]!.source, "sha256:57968aa33e67dbaba4db2aa41548660b14fd4b14fe568a1cd5fcd20c5e15223d"],
      ["teacher-0", proposals.teacher.source, "sha256:13e46f39b8d8675cd67addb01e5ea5ff22181afe0e5eadf5008f02cd429be51e"],
    ] as const
    for (const [role, source, pin] of definitions) {
      const snapshot = buildLeanBaselineSource({ role, source, coldRoot: HISTORY.coldRoot, implementationRoot: HISTORY.sourceRoot })
      expect(leanBytesRoot(leanCanonicalBytes(snapshot)), role).toBe(pin)
    }
  }, 45000)
  it("uses real validation and one immutable graph in the outer publisher and pipeline, closing finally", async () => {
    const raw = fixture(), directory = realpathSync(mkdtempSync(join(tmpdir(), "precharge-host-")))
    const revision = vi.spyOn(revisionAPI, "buildStrategyRevision"), factory = vi.spyOn(factoryAPI, "admitFactory"), supervision = vi.spyOn(factoryAPI, "authorizeFactorySupervision")
    const admission = vi.spyOn(reuseAPI, "admitLeanOwnedReuse"), closed = vi.spyOn(reuseAPI, "closeLeanOwnedReuse"), capacity = vi.spyOn(leanAPI, "assertLeanPublicationCapacity")
    try {
      const admitted = reuseAPI.validateLeanColdReuse(raw, currentSource)
      expect(revision).toHaveBeenCalledTimes(7); expect(factory).toHaveBeenCalledTimes(7); expect(supervision).toHaveBeenCalledTimes(7)
      const scope = scopeFor(admitted), handle = reuseAPI.admitLeanOwnedReuse(admitted, scope)
      expect(reuseAPI.readLeanOwnedReuse(handle, scope)).toBe(admitted)
      Reflect.set(raw.sources[0]!.packet.build, "buildRoot", currentSource)
      expect(admitted.sources[0]!.packet.build.buildRoot).toBe(HISTORY.sourceRoot)
      expect(Reflect.defineProperty(admitted.sources[0]!.packet.build, "buildRoot", { value: currentSource })).toBe(false)
      expect(Object.isFrozen(admitted.proposals.tactical[0]!.inputRoots)).toBe(true)
      expect(Object.isFrozen(admitted.corpus.tacticalInputs[0]!.awarenessGrid.cells)).toBe(true)
      reuseAPI.closeLeanOwnedReuse(handle)
      expect(() => reuseAPI.readLeanOwnedReuse(handle, scope)).toThrow()
      let shared: LeanColdReuse | undefined, selected: readonly sourceAPI.LeanBaselineSource[] | undefined
      const sentinel = new Error("HOST_FIRST_DISPATCH_STOP")
      await expect(correctionAPI.executeLeanOwnedCorrectionPipeline({ ledger: ledgerFor(directory, admitted), reuse: admitted,
        checkpoint: () => {}, retainArtifact: (name, value) => { if (name === "cold-reuse.json") shared = value as LeanColdReuse; if (name === "cold-corpus.json") expect(value).toBe(admitted.corpus); if (name === "initial-proposals.json") expect(value).toBe(admitted.proposals); if (name === "cold-reuse-grant.json") expect(value).toBe(admitted.grant) },
        dispatch: async (_slot, bottom, top) => { selected = [bottom, top]; throw sentinel },
      })).rejects.toBe(sentinel)
      expect(shared).toBe(admitted); expect(selected?.[0]).toBe(admitted.sources[2]); expect(selected?.[1]).toBe(admitted.sources[0])
      for (const source of admitted.sources) expect(readFileSync(join(directory, `source-${source.role}.json`))).toEqual(Buffer.from(leanCanonicalBytes(source)))
      expect(revision).toHaveBeenCalledTimes(7); expect(factory).toHaveBeenCalledTimes(7); expect(supervision).toHaveBeenCalledTimes(7)
      expect(capacity).toHaveBeenCalledTimes(7)
      expect(closed).toHaveBeenCalledTimes(2)
      const lastHandle = admission.mock.results[1]!.value as reuseAPI.LeanOwnedReuseAdmission, lastScope = admission.mock.calls[1]![1]
      expect(() => reuseAPI.readLeanOwnedReuse(lastHandle, lastScope)).toThrow()
    } finally { vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  }, 45000)
  it("rejects copied, foreign, changed-scope and closed handles before writing; defaults revalidate", () => {
    const raw = fixture(), admitted = reuseAPI.validateLeanColdReuse(raw, currentSource), scope = scopeFor(admitted)
    const handle = reuseAPI.admitLeanOwnedReuse(admitted, scope), source = admitted.sources[0]!
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "precharge-host-reject-"))), ledger = ledgerFor(directory, admitted)
    try {
      for (const field of ["sourceRoot", "allocationRoot", "coldRoot", "seed", "grantRoot", "invocation"] as const) {
        const changed = { ...scope, [field]: field === "invocation" ? {} : field === "seed" ? "forged" : labRoot("forged", field) }
        expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, handle, changed)).toThrow()
      }
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, { ...handle }, scope)).toThrow()
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, structuredClone(source), handle, scope)).toThrow()
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, { ...source, role: "probe" }, handle, scope)).toThrow()
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource({ ...ledger, allocation: { ...ledger.allocation, schemaVersion: "unapproved" } } as unknown as LeanExperimentLedger, source, handle, scope)).toThrow()
      const secondScope = scopeFor(admitted), second = reuseAPI.admitLeanOwnedReuse(structuredClone(admitted), secondScope)
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, second, secondScope)).toThrow()
      reuseAPI.closeLeanOwnedReuse(second)
      expect(() => reuseAPI.admitLeanOwnedReuse(Object.freeze({ ...raw, grant: { ...raw.grant, newSourceRoot: labRoot("forged-frozen-unknown", 1) } }), scope)).toThrow()
      const revisions = vi.spyOn(revisionAPI, "buildStrategyRevision")
      expect(() => sourceAPI.publishLeanBaselineSource(ledger, source)).toThrow("LEAN_BASELINE_SOURCE")
      expect(revisions).toHaveBeenCalledTimes(1)
      revisions.mockClear()
      reuseAPI.validateLeanColdReuse(admitted, currentSource)
      expect(revisions).toHaveBeenCalledTimes(7)
      expect(readdirSync(directory)).toEqual([])
      revisions.mockClear()
      sourceAPI.publishLeanReusedBaselineSource(ledger, structuredClone(source), structuredClone(admitted))
      expect(revisions).toHaveBeenCalledTimes(8)
      expect(readFileSync(join(directory, "source-cold-opponent.json"))).toEqual(Buffer.from(leanCanonicalBytes(source)))
      reuseAPI.closeLeanOwnedReuse(handle)
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, admitted.sources[1]!, handle, scope)).toThrow()
      expect(readdirSync(directory)).not.toContain("source-probe.json")
    } finally { reuseAPI.closeLeanOwnedReuse(handle); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  }, 45000)
  it("retains real fresh entry/capacity guards and invokes strict baseline authority for every attempted publication", () => {
    const reuse = reuseAPI.validateLeanColdReuse(fixture(), currentSource), directory = realpathSync(mkdtempSync(join(tmpdir(), "precharge-host-guards-")))
    const capacity = vi.spyOn(leanAPI, "assertLeanPublicationCapacity"), entry = vi.spyOn(leanAPI, "readLeanChildEntry"), audit = vi.spyOn(retainedAPI, "authenticateLeanRetryBaselineAuthorityV8")
    try {
      const allocation = supervisedAllocation(reuse, 6), ledger = { directory, allocation }, scope = { ...scopeFor(reuse), allocationRoot: allocation.root }, handle = reuseAPI.admitLeanOwnedReuse(reuse, scope)
      try {
        writeEntry(ledger)
        sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, reuse.sources[0]!, handle, scope)
        expect(entry).toHaveBeenCalledTimes(1); expect(capacity).toHaveBeenCalledTimes(1)
        expect(lstatSync(join(directory, "source-cold-opponent.json")).mode & 0o777).toBe(0o600)
        writeEntry(ledger, "tampered-head")
        expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, reuse.sources[1]!, handle, scope)).toThrow()
        expect(readdirSync(directory)).not.toContain("source-probe.json")
        writeEntry(ledger)
        const boundEntry = JSON.parse(readFileSync(join(directory, "entry.json"), "utf8")) as Record<string, unknown>
        writeFileSync(join(directory, "entry.json"), leanCanonicalBytes({ ...boundEntry, sourceRoot: labRoot("precharge-host-tampered-source", 1) }))
        expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, reuse.sources[1]!, handle, scope)).toThrow("ENTRY")
        writeEntry(ledger)
        writeFileSync(join(directory, "entry.json"), Buffer.concat([readFileSync(join(directory, "entry.json")), Buffer.from(" ")]))
        expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, reuse.sources[1]!, handle, scope)).toThrow("CANONICAL")
        expect(readdirSync(directory)).not.toContain("source-probe.json")
      } finally { reuseAPI.closeLeanOwnedReuse(handle) }
      const full = supervisedAllocation(reuse, 6, leanAPI.LEAN_CAPS.retainedBytes), fullLedger = { directory, allocation: full }, fullScope = { ...scopeFor(reuse), allocationRoot: full.root }, fullHandle = reuseAPI.admitLeanOwnedReuse(reuse, fullScope)
      try { writeEntry(fullLedger); expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(fullLedger, reuse.sources[1]!, fullHandle, fullScope)).toThrow("RESOURCE"); expect(readdirSync(directory)).not.toContain("source-probe.json") } finally { reuseAPI.closeLeanOwnedReuse(fullHandle) }
      const retry = supervisedAllocation(reuse, 8), retryLedger = { directory, allocation: retry }, retryScope = { ...scopeFor(reuse), allocationRoot: retry.root }, retryHandle = reuseAPI.admitLeanOwnedReuse(reuse, retryScope)
      try {
        writeEntry(retryLedger)
        for (const source of reuse.sources) expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(retryLedger, source, retryHandle, retryScope)).toThrow("HOST_PRIVATE_CUSTODY_ABSENT")
        expect(audit).toHaveBeenCalledTimes(7)
        expect(readdirSync(directory)).not.toContain("source-probe.json")
      } finally { reuseAPI.closeLeanOwnedReuse(retryHandle) }
    } finally { vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  }, 45000)
})
