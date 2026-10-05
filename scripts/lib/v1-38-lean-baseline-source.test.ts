import { describe, it, expect, vi } from "vitest"
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { LeanExperimentLedger } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanCanonicalBytes } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import * as reuseIO from "./v1-38-lean-baseline-reuse.js"
import type { LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { buildPlannerCandidate } from "../../packages/strategy-lab/src/planner/emit.js"
import { buildLeanBaselineSource, validateLeanBaselineSource, publishLeanBaselineSource, publishLeanReusedBaselineSource } from "./v1-38-lean-baseline-source.js"

// Resource accounting is synthetic; the real publisher/descriptor/write/schema
// path is NOT mocked. Never touch an actual prospective route or provider.
vi.mock("../../packages/strategy-lab/src/league/lean-experiment.js", async importOriginal => ({ ...await importOriginal<object>(), assertLeanPublicationCapacity: () => {} }))

const input = () => ({ role: "final-response", source: buildPlannerCandidate().source, coldRoot: labRoot("cold", "nonlearned"), implementationRoot: labRoot("implementation", "reviewed") })
describe("prospective private baseline source snapshots", () => {
  it.each(["lean-correction-supervisor-diagnostic-allocation-v2", "lean-correction-supervisor-baseline-allocation-v2", "lean-correction-supervisor-diagnostic-allocation-v3", "lean-correction-supervisor-baseline-allocation-v3", "lean-correction-supervisor-diagnostic-allocation-v4", "lean-correction-supervisor-baseline-allocation-v4"])("publishes exact frozen mock bytes through the real %s consumer", schemaVersion => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-publisher-source-test-")))
    const source = buildLeanBaselineSource(input()), newRoot = labRoot("mock-new-code", schemaVersion)
    const reuse = { grant: { coldRoot: source.coldRoot, seed: "mock-only", root: labRoot("mock-grant", schemaVersion) }, sources: [source] } as unknown as LeanColdReuse
    const validation = vi.spyOn(reuseIO, "validateLeanColdReuse").mockReturnValue(reuse)
    try {
      const ledger = { directory, allocation: { schemaVersion, sourceRoot: newRoot, coldRoot: source.coldRoot, seed: "mock-only" } } as unknown as LeanExperimentLedger
      publishLeanReusedBaselineSource(ledger, source, reuse)
      expect(readFileSync(join(directory, `source-${source.role}.json`))).toEqual(Buffer.from(leanCanonicalBytes(source)))
      expect(validation).toHaveBeenCalledWith(reuse, newRoot)
      expect(() => publishLeanBaselineSource(ledger, source)).toThrow("LEAN_BASELINE_SOURCE")
      expect(() => publishLeanReusedBaselineSource({ ...ledger, allocation: { ...ledger.allocation, schemaVersion: "unapproved-v3" } } as unknown as LeanExperimentLedger, source, reuse)).toThrow("LEAN_BASELINE_SOURCE")
    } finally { validation.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
  }, 20000)
  it.each([2, 3, 4])("publishes a current response only for supervisor baseline v%d, never diagnostic", version => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-current-publisher-test-")))
    const source = buildLeanBaselineSource(input())
    try {
      const ledger = { directory, allocation: { schemaVersion: `lean-correction-supervisor-baseline-allocation-v${version}`, sourceRoot: source.implementationRoot, coldRoot: source.coldRoot } } as unknown as LeanExperimentLedger
      publishLeanBaselineSource(ledger, source)
      expect(readFileSync(join(directory, `source-${source.role}.json`))).toEqual(Buffer.from(leanCanonicalBytes(source)))
      expect(() => publishLeanBaselineSource({ ...ledger, allocation: { ...ledger.allocation, schemaVersion: `lean-correction-supervisor-diagnostic-allocation-v${version}` } } as unknown as LeanExperimentLedger, source)).toThrow("LEAN_BASELINE_SOURCE")
    } finally { rmSync(directory, { recursive: true, force: true }) }
  }, 20000)
  it("binds static validation and exact authored source without native execution", () => {
    const source = buildLeanBaselineSource(input())
    expect(validateLeanBaselineSource(source)).toEqual(source)
    expect(buildLeanBaselineSource(input()).root).toBe(source.root)
    expect(source.validation.status).toBe("valid")
    expect(source.packet.provider.modelId).toBe("no-model")
    expect(source.packet.lineage.predecessorRoot).toBe(source.coldRoot)
  })
  it("rejects edited source, forged validation and extra payload fields", () => {
    const source = buildLeanBaselineSource(input())
    expect(() => validateLeanBaselineSource({ ...source, source: `${source.source}\n// changed` })).toThrow()
    expect(() => validateLeanBaselineSource({ ...source, validation: { ...source.validation, evidenceRoot: labRoot("forged", 1) } })).toThrow()
    expect(() => validateLeanBaselineSource({ ...source, authority: true })).toThrow()
    expect(() => buildLeanBaselineSource({ ...input(), role: "bracket" })).toThrow()
    expect(() => buildLeanBaselineSource({ ...input(), source: "import fs from 'node:fs'; export default fs;" })).toThrow()
  })
})
