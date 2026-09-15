import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { createCompletePayoffSnapshot, createLeagueMixture, createLeaguePortfolio, createLeagueSolverManifest, createLeagueSolverOutput } from "./contracts.js"
import { createLeagueRepository } from "./repository.js"
import { publishLeagueReport, reopenLeagueReport } from "./report.js"

const directories: string[] = []
const root = (label: string): LabRoot => labRoot("report-test-root-v1", { label })
const repository = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-report-test-")))
  directories.push(directory)
  return createLeagueRepository(directory)
}
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const reportInput = (repo = repository(), unsafe: Record<string, unknown> = {}) => {
  const snapshot = createCompletePayoffSnapshot({ populationRoot: root("population"), cellChunkRoots: [root("cells")], solverPayoffRoot: root("payoffs"), expectedCellCount: 1, completedCellCount: 1 })
  const manifest = createLeagueSolverManifest({ snapshotRoot: snapshot.root, algorithmRoot: root("algorithm"), numericPolicyRoot: root("numeric"), resourcePolicyRoot: root("resource") })
  const solver = createLeagueSolverOutput({ manifestRoot: manifest.root, snapshotRoot: snapshot.root, distributionRoot: root("distribution"), diagnosticsRoot: root("solver-diagnostics") })
  const mixture = createLeagueMixture({ solverOutputRoot: solver.root, weightRoot: root("weights"), snapshotRoot: snapshot.root })
  const portfolio = createLeaguePortfolio({ candidateAdmissionRoots: [root("candidate")], diversityReceiptRoot: root("diversity"), mixtureRoot: mixture.root })
  return {
    repository: repo, snapshot, solverManifest: manifest, solver, mixture, portfolio,
    redTeamRoot: root("red-team"), finalistDispositionRoot: root("finalist"),
    reopen: { issued: false as const, records: [{ terminalProvenance: "persisted" as const, start: { root: root("start"), cellRoot: root("cell"), allocationRoot: root("allocation") }, terminal: { disposition: "success", processValidity: "process_valid", cellRoot: root("cell") } }], remnants: [] },
    projection: {
      population: { root: root("population") }, conditions: [{ root: root("condition") }], semanticArenas: [{ root: root("arena") }], oracleFamilies: [{ root: root("oracle") }],
      policyRoots: [root("policy")], tupleRoot: root("tuple"), runtimeRoot: root("runtime"), allocationLedger: [{ root: root("allocation") }], iterationCurves: [{ root: root("curve") }], payoffMatrix: [{ root: root("matrix") }], distributions: [{ root: root("distribution") }], bestResponseGraph: [{ root: root("graph") }], pureWorstCases: [{ root: root("worst") }], responseGaps: [{ root: root("gap") }], attempts: [{ root: root("attempt") }], ...unsafe,
    },
  }
}

describe("private complete league reports", () => {
  it("publishes one rooted complete private projection and reopens bounded immutable chunks as data only", () => {
    const input = reportInput(), published = publishLeagueReport(input)
    expect(published.descriptor.snapshotRoot).toBe(input.snapshot.root)
    expect(published.descriptor.reportChunkRoots).toHaveLength(1)
    const reopened = reopenLeagueReport({ repository: input.repository, descriptor: published.descriptor, maxBytes: 64 * 1024, maxRecords: 2 })
    expect(reopened.issued).toBe(false)
    expect(reopened.chunks).toHaveLength(1)
    expect(JSON.stringify(reopened)).not.toMatch(/source|memory|objective|holdout|formation|deploy/u)
  })

  it("fails closed for stale/incomplete repository state, unsupported claims, and sensitive projection fields", () => {
    const derived = reportInput()
    expect(() => publishLeagueReport({ ...derived, reopen: { ...derived.reopen, records: [{ ...derived.reopen.records[0]!, terminalProvenance: "derived_unterminated_start" as const }] } })).toThrow("LEAGUE_REPORT_REOPEN_INCOMPLETE")
    expect(() => publishLeagueReport(reportInput(undefined, { claim: "Nash optimal solved permanent balance" }))).toThrow("LEAGUE_REPORT_CLAIM")
    expect(() => publishLeagueReport(reportInput(undefined, { strategyMemory: { secret: true } }))).toThrow("LEAGUE_REPORT_PROJECTION_DENIED")
  })
})
