import { mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { createLeagueCandidateAdmission, createLeagueCellTerminal, createLeaguePopulation, projectCanonicalKernelOutcomeToEntrantHalfPoints } from "./contracts.js"
import { admitCompletePayoffSnapshot, enumerateLeagueCells, leaguePlayerId } from "./matrix.js"
import { createLeagueRepository, publishLeagueCellTerminal, recordLeagueCellStart, reopenLeagueEvidence } from "./repository.js"
import { solveLeagueSnapshot } from "./solver.js"

const directories: string[] = []
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })))
const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot

const admission = (ordinal: number) => {
  const proposal = factoryProposalFromPacket(factoryOraclePacketFixture())
  const candidate = factoryCandidateFixture(proposal, factoryValidationFixture(proposal), root("0123456789abcdef"[ordinal]!))
  const start = createFactoryAttemptStart({ taskRoot: root("a"), budgetRoot: root("b"), candidateRoot: candidate.root, authoringMechanism: "automated-oracle", inputRoot: root("c"), resourceAccountingRoot: root("d"), retryParentRoot: null })
  return createLeagueCandidateAdmission({ candidate, supervisionReceiptRoot: candidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", candidate.lineage), tupleRoot: candidate.proposal.build.compatibilityTupleRoot, runtimeRoot: candidate.proposal.nativeLane.runtimeProfileRoot, provenanceRoot: root("e"), attemptStart: start, attemptTerminal: createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: root("f"), validationRoot: root("0"), duplicateEvidenceRoot: root("1"), finalEvidenceRoot: root("2") }) })
}

const successTerminal = (entry: ReturnType<typeof enumerateLeagueCells>["cells"][number]) => {
  const events = [{ type: "MATCH_ENDED", payload: { type: "DRAW" as const } }]
  const projection = projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution: { kind: "completed", privacy: "private_offline", result: { state: { outcome: { type: "DRAW" } }, events }, transitions: [], accounting: [] } as never, entrantCandidateRoot: entry.cell.entrantCandidateRoot, bottomCandidateRoot: entry.bottomCandidateRoot, topCandidateRoot: entry.topCandidateRoot, bottomPlayerId: leaguePlayerId(entry.bottomCandidateRoot), topPlayerId: leaguePlayerId(entry.topCandidateRoot), cellRoot: entry.cell.root, conditionRoot: entry.cell.conditionRoot, semanticGeometryHash: entry.cell.semanticGeometryHash, resultEventRoot: labRoot("phase-265-injected-result-events", events) })
  return createLeagueCellTerminal({ cellRoot: entry.cell.root, disposition: "success", processValidity: "process_valid", evidenceRoot: root("3"), projection })
}

describe("injected league integration boundary", () => {
  it("joins an eight-cell matrix to the actual solver, durable terminals, and issued-false nonempty reopening", () => {
    const candidates = [admission(3), admission(4)]
    const matrix = enumerateLeagueCells({ population: createLeaguePopulation({ candidateAdmissionRoots: candidates.map((candidate) => candidate.root).sort(), studyPolicyRoot: root("4"), measurementPolicyRoot: root("5") }), candidateAdmissions: candidates, tupleRoot: candidates[0]!.tupleRoot, runtimeRoot: candidates[0]!.runtimeRoot, baseSeed: "phase-265-injected-integration" })
    expect(matrix.cells).toHaveLength(8)
    const terminals = matrix.cells.map(successTerminal)
    const complete = admitCompletePayoffSnapshot(matrix, terminals)
    expect(complete.kind).toBe("complete")
    if (complete.kind !== "complete") throw new Error("injected matrix unexpectedly blocked")
    expect(solveLeagueSnapshot({ snapshot: complete.snapshot, solverPayoffBytes: complete.solverPayoffBytes })).toMatchObject({ status: "solved" })

    const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-integration-source-only-")))
    directories.push(directory)
    const repository = createLeagueRepository(directory)
    for (const terminal of terminals) {
      const body = { cellRoot: terminal.cellRoot, allocationRoot: root("6") }
      const start = { ...body, root: labRoot("league-cell-start-v1", body) }
      recordLeagueCellStart(repository, start)
      publishLeagueCellTerminal(repository, start, terminal)
    }
    const before = readdirSync(directory).sort()
    const reopened = reopenLeagueEvidence(repository, { maxBytes: 64 * 1024, maxRecords: 8 })
    expect(reopened).toMatchObject({ issued: false, remnants: [] })
    expect(reopened.records).toHaveLength(8)
    expect(reopened.records.every((record) => record.terminalProvenance === "persisted" && record.terminal.disposition === "success")).toBe(true)
    expect(readdirSync(directory).sort()).toEqual(before)
  })
})
