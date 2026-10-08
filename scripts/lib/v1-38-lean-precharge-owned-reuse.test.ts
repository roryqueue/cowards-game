/** HOST SOURCE ONLY: canonical offline observations/static compilation, never
 * authored Strategy execution, private history, allocation or provider admission. */
import { describe, expect, it, vi } from "vitest"
import { mkdtempSync, readFileSync, realpathSync, rmSync, readdirSync, lstatSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as reuseAPI from "./v1-38-lean-baseline-reuse.js"
import * as revisionAPI from "../../packages/runtime-js/src/revision.js"
import * as factoryAPI from "../../packages/strategy-lab/src/factory/admission.js"
import * as correctionAPI from "../run-v1-38-lean-correction.js"
import * as sourceAPI from "./v1-38-lean-baseline-source.js"
import type { LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import type { LeanExperimentLedger, LeanCorrectionAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
import { buildLeanInitialProposals } from "./v1-38-lean-training-adapter.js"
import { buildLeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { LEAN_COLD_REUSE_HISTORY as HISTORY } from "./v1-38-lean-baseline-reuse.js"
import { leanBytesRoot, leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { emitTacticalSource } from "../../packages/strategy-oracle-tactical/src/emit.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"

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
    try {
      const admitted = reuseAPI.validateLeanColdReuse(raw, currentSource)
      expect(revision).toHaveBeenCalledTimes(7); expect(factory).toHaveBeenCalledTimes(7); expect(supervision).toHaveBeenCalledTimes(7)
      const scope = scopeFor(admitted), handle = reuseAPI.admitLeanOwnedReuse(admitted, scope)
      expect(reuseAPI.readLeanOwnedReuse(handle, scope)).toBe(admitted)
      Reflect.set(raw.sources[0]!.packet.build, "buildRoot", currentSource)
      expect(admitted.sources[0]!.packet.build.buildRoot).toBe(HISTORY.sourceRoot)
      expect(() => Reflect.defineProperty(admitted.sources[0]!.packet.build, "buildRoot", { value: currentSource })).toThrow()
      expect(Object.isFrozen(admitted.proposals.tactical[0]!.inputRoots)).toBe(true)
      expect(Object.isFrozen(admitted.corpus.tacticalInputs[0]!.awarenessGrid.cells)).toBe(true)
      reuseAPI.closeLeanOwnedReuse(handle)
      expect(() => reuseAPI.readLeanOwnedReuse(handle, scope)).toThrow()
      let shared: LeanColdReuse | undefined, selected: readonly sourceAPI.LeanBaselineSource[] | undefined
      const sentinel = new Error("HOST_FIRST_DISPATCH_STOP")
      await expect(correctionAPI.executeLeanOwnedCorrectionPipeline({ ledger: ledgerFor(directory, admitted), reuse: admitted,
        checkpoint: () => {}, retainArtifact: (name, value) => { if (name === "cold-reuse.json") shared = value as LeanColdReuse; if (name === "cold-corpus.json") expect(value).toBe(admitted.corpus) },
        dispatch: async (_slot, bottom, top) => { selected = [bottom, top]; throw sentinel },
      })).rejects.toBe(sentinel)
      expect(shared).toBe(admitted); expect(selected?.[0]).toBe(admitted.sources[2]); expect(selected?.[1]).toBe(admitted.sources[0])
      for (const source of admitted.sources) expect(readFileSync(join(directory, `source-${source.role}.json`))).toEqual(Buffer.from(leanCanonicalBytes(source)))
      expect(revision).toHaveBeenCalledTimes(7); expect(factory).toHaveBeenCalledTimes(7); expect(supervision).toHaveBeenCalledTimes(7)
    } finally { vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  }, 45000)
  it("rejects copied, foreign, changed-scope and closed handles before writing; defaults revalidate", () => {
    const raw = fixture(), admitted = reuseAPI.validateLeanColdReuse(raw, currentSource), scope = scopeFor(admitted)
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "precharge-host-reject-"))), ledger = ledgerFor(directory, admitted)
    const handle = reuseAPI.admitLeanOwnedReuse(admitted, scope), source = admitted.sources[0]!
    try {
      for (const field of ["sourceRoot", "allocationRoot", "coldRoot", "seed", "grantRoot", "invocation"] as const) {
        const changed = { ...scope, [field]: field === "invocation" ? {} : field === "seed" ? "forged" : labRoot("forged", field) }
        expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, handle, changed)).toThrow()
      }
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, { ...handle }, scope)).toThrow()
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, structuredClone(source), handle, scope)).toThrow()
      const secondScope = scopeFor(admitted), second = reuseAPI.admitLeanOwnedReuse(structuredClone(admitted), secondScope)
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, second, secondScope)).toThrow()
      reuseAPI.closeLeanOwnedReuse(second)
      const revisions = vi.spyOn(revisionAPI, "buildStrategyRevision")
      expect(() => sourceAPI.publishLeanBaselineSource(ledger, source)).toThrow("LEAN_BASELINE_SOURCE")
      expect(revisions).toHaveBeenCalledTimes(1)
      revisions.mockClear()
      reuseAPI.validateLeanColdReuse(admitted, currentSource)
      expect(revisions).toHaveBeenCalledTimes(7)
      expect(readdirSync(directory)).toEqual([])
      reuseAPI.closeLeanOwnedReuse(handle)
      expect(() => sourceAPI.publishLeanOwnedReusedBaselineSource(ledger, source, handle, scope)).toThrow()
    } finally { reuseAPI.closeLeanOwnedReuse(handle); vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }) }
  }, 45000)
})
