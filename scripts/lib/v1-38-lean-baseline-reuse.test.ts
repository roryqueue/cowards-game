/** Bounded historical-byte admission tests; no historical empirical reader. */
import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as corpusBuilder from "./v1-38-lean-cold-corpus.js"
import * as proposalBuilder from "./v1-38-lean-training-adapter.js"
import { publishLeanBaselineSource, validateLeanReusedBaselineSource } from "./v1-38-lean-baseline-source.js"
import type { LeanExperimentLedger } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { authenticateLeanColdReuse, authenticateLeanColdReuseArtifacts, LEAN_COLD_REUSE_HISTORY, LEAN_COLD_REUSE_FILES, validateLeanColdReuse } from "./v1-38-lean-baseline-reuse.js"

const directory = ".strategy-lab/lean-baseline-20261004-v1"
const newSourceRoot = labRoot("source-only-reuse-supervisor", 1)
const authority = () => ({ newSourceRoot, amendmentRoot: LEAN_COLD_REUSE_HISTORY.amendmentRoot })
const artifacts = () => Object.fromEntries(LEAN_COLD_REUSE_FILES.map(name => [name, readFileSync(`${directory}/${name}`)]))

describe("cold reuse fails closed without custody", () => {
  it("rejects missing files and forged authority", () => {
    expect(() => authenticateLeanColdReuseArtifacts({ ...authority(), artifacts: {} })).toThrow()
    expect(() => authenticateLeanColdReuse({ ...authority(), directory: `${directory}/missing` })).toThrow()
  })
})

describe.skipIf(!existsSync(`${directory}/cold-corpus.json`))("exact historical pre-training byte admission (local private fixture)", () => {
  it("preserves all original nested provenance without builders", () => {
    const cold = vi.spyOn(corpusBuilder, "buildLeanColdCorpus").mockImplementation(() => { throw new Error("FORBIDDEN_COLD_WORK") })
    const proposals = vi.spyOn(proposalBuilder, "buildLeanInitialProposals").mockImplementation(() => { throw new Error("FORBIDDEN_PROPOSAL_WORK") })
    try {
      const reuse = authenticateLeanColdReuse({ ...authority(), directory })
      expect(validateLeanColdReuse(reuse, newSourceRoot)).toEqual(reuse)
      expect(reuse.grant.predecessor).toMatchObject({ chargedMatches: 10, elapsedMs: 3319046, verificationRoot: LEAN_COLD_REUSE_HISTORY.verificationRoot })
      expect(reuse.grant.opportunity).toEqual({ tacticalEvaluations: 64, teacherSearchNodes: 64, distillationExamples: 64, responseNodes: 128, totalChannelOperations: 320, spentColdOperations: 192, prospectiveResponseNodes: 128 })
      expect(reuse.sources).toHaveLength(7)
      for (const source of reuse.sources) {
        expect(Buffer.from(leanCanonicalBytes(source)).equals(readFileSync(`${directory}/source-${source.role}.json`))).toBe(true)
        expect(source.implementationRoot).toBe(LEAN_COLD_REUSE_HISTORY.sourceRoot)
        expect(source.packet.build.buildRoot).toBe(LEAN_COLD_REUSE_HISTORY.sourceRoot)
      }
      expect(cold).not.toHaveBeenCalled(); expect(proposals).not.toHaveBeenCalled()
    } finally { vi.restoreAllMocks() }
  })
  it.each(["cold-corpus.json", "initial-proposals.json", "source-cold-opponent.json", "source-probe.json", "source-tactical-0.json", "source-tactical-1.json", "source-tactical-2.json", "source-tactical-3.json", "source-teacher-0.json", "allocation.json", "result.json", "child-terminal.json", "ledger.ndjson", "time.ndjson"])("rejects changed or missing %s", name => {
    const bytes = artifacts()
    bytes[name] = Buffer.concat([bytes[name]!, Buffer.from(" ")])
    expect(() => authenticateLeanColdReuseArtifacts({ ...authority(), artifacts: bytes })).toThrow()
    delete bytes[name]
    expect(() => authenticateLeanColdReuseArtifacts({ ...authority(), artifacts: bytes })).toThrow()
  })
  it.each(["seed", "procedure", "operations", "packet", "teacher", "grant"])("rejects forged %s before admission", mutation => {
    const reuse = structuredClone(authenticateLeanColdReuse({ ...authority(), directory }))
    if (mutation === "seed") Reflect.set(reuse.corpus, "seed", "forged")
    if (mutation === "procedure") Reflect.set(reuse.grant, "coldRoot", labRoot("forged", 1))
    if (mutation === "operations") Reflect.set(reuse.proposals.operations, "tacticalEvaluations", 63)
    if (mutation === "packet") Reflect.set(reuse.sources[0]!.packet.build, "buildRoot", newSourceRoot)
    if (mutation === "teacher") Reflect.set(reuse.corpus, "teacherSearchReceipts", [])
    if (mutation === "grant") Reflect.set(reuse.grant, "newSourceRoot", labRoot("forged", 2))
    expect(() => validateLeanColdReuse(reuse, newSourceRoot)).toThrow()
  })
  it("admits an original snapshot only via its outer grant and preserves default rejection", () => {
    const reuse = authenticateLeanColdReuse({ ...authority(), directory }), source = reuse.sources[0]!
    expect(validateLeanReusedBaselineSource(source, reuse, newSourceRoot).root).toBe(source.root)
    expect(() => validateLeanReusedBaselineSource({ ...source, root: newSourceRoot }, reuse, newSourceRoot)).toThrow()
    const ledger = { allocation: { schemaVersion: "lean-current-baseline-allocation-v1", sourceRoot: newSourceRoot, coldRoot: reuse.grant.coldRoot } } as unknown as LeanExperimentLedger
    expect(() => publishLeanBaselineSource(ledger, source)).toThrow("LEAN_BASELINE_SOURCE")
  }, 20000)
})
