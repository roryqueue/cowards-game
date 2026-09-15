import { describe, expect, it } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { labRoot, type LabRoot } from "../contracts.js"
import {
  createFactoryAttemptStart,
  createFactoryAttemptTerminal,
} from "../factory/ledger.js"
import {
  factoryCandidateFixture,
  factoryOraclePacketFixture,
  factoryProposalFromPacket,
  factoryValidationFixture,
} from "../factory/contracts.js"
import {
  createLeagueCandidateAdmission,
  createLeagueCellTerminal,
  createLeaguePopulation,
  projectCanonicalKernelOutcomeToEntrantHalfPoints,
} from "./contracts.js"
import {
  admitCompletePayoffSnapshot,
  describeLeagueCellStream,
  enumerateLeagueCells,
  leaguePlayerId,
} from "./matrix.js"
import { solveLeagueSnapshot } from "./solver.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const hex = (ordinal: number): string => "0123456789abcdef"[ordinal]!

const admission = (ordinal: number) => {
  const proposal = factoryProposalFromPacket(factoryOraclePacketFixture())
  const candidate = factoryCandidateFixture(proposal, factoryValidationFixture(proposal), root(hex(ordinal)))
  const start = createFactoryAttemptStart({
    taskRoot: root(hex(ordinal + 1)),
    budgetRoot: root("b"),
    candidateRoot: candidate.root,
    authoringMechanism: "automated-oracle",
    inputRoot: root("c"),
    resourceAccountingRoot: root("d"),
    retryParentRoot: null,
  })
  const terminal = createFactoryAttemptTerminal({
    startRoot: start.root,
    disposition: "accepted",
    outputRoot: root("e"),
    validationRoot: root("f"),
    duplicateEvidenceRoot: root("0"),
    finalEvidenceRoot: root("1"),
  })
  return createLeagueCandidateAdmission({
    candidate,
    supervisionReceiptRoot: candidate.supervisionReceiptRoot,
    fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints),
    lineageRoot: labRoot("factory-lineage-v1", candidate.lineage),
    tupleRoot: candidate.proposal.build.compatibilityTupleRoot,
    runtimeRoot: candidate.proposal.nativeLane.runtimeProfileRoot,
    provenanceRoot: root("2"),
    attemptStart: start,
    attemptTerminal: terminal,
  })
}

const input = (count = 3) => {
  const candidates = Array.from({ length: count }, (_, ordinal) => admission(ordinal + 2))
  const population = createLeaguePopulation({
    candidateAdmissionRoots: candidates.map((candidate) => candidate.root).sort() as LabRoot[],
    studyPolicyRoot: root("3"),
    measurementPolicyRoot: root("4"),
  })
  return {
    population,
    candidateAdmissions: candidates,
    tupleRoot: candidates[0]!.tupleRoot,
    runtimeRoot: candidates[0]!.runtimeRoot,
    baseSeed: "league-matrix-v1",
  }
}

const execution = (winner: string | "DRAW") => {
  const outcome = winner === "DRAW" ? { type: "DRAW" as const } : { type: "WIN" as const, winnerPlayerId: winner }
  const events = [{ type: "MATCH_ENDED", payload: outcome }]
  return {
    execution: {
      kind: "completed",
      privacy: "private_offline",
      result: { state: { outcome }, events },
      transitions: [],
      accounting: [],
    } as never,
    resultEventRoot: labRoot("league-result-events-v1", events),
  }
}

const successTerminal = (
  expected: ReturnType<typeof enumerateLeagueCells>["cells"][number],
  winner: "entrant" | "opponent" | "DRAW" = "entrant",
) => {
  const winnerPlayerId = winner === "entrant"
    ? leaguePlayerId(expected.cell.entrantCandidateRoot)
    : winner === "opponent"
      ? leaguePlayerId(expected.cell.opponentCandidateRoot)
      : "DRAW"
  const result = execution(winnerPlayerId)
  const projection = projectCanonicalKernelOutcomeToEntrantHalfPoints({
    execution: result.execution,
    entrantCandidateRoot: expected.cell.entrantCandidateRoot,
    bottomCandidateRoot: expected.bottomCandidateRoot,
    topCandidateRoot: expected.topCandidateRoot,
    bottomPlayerId: leaguePlayerId(expected.bottomCandidateRoot),
    topPlayerId: leaguePlayerId(expected.topCandidateRoot),
    cellRoot: expected.cell.root,
    conditionRoot: expected.cell.conditionRoot,
    semanticGeometryHash: expected.cell.semanticGeometryHash,
    resultEventRoot: result.resultEventRoot,
  })
  return createLeagueCellTerminal({
    cellRoot: expected.cell.root,
    disposition: "success",
    processValidity: "process_valid",
    evidenceRoot: root("5"),
    projection,
  })
}

describe("complete semantic empirical-game matrix", () => {
  it("feeds a complete multi-entrant snapshot directly into the solver across reversed completion layouts", () => {
    const matrix = enumerateLeagueCells(input(3))
    const terminals = matrix.cells.map((cell) => successTerminal(cell, "DRAW"))
    const forward = admitCompletePayoffSnapshot(matrix, terminals), reverse = admitCompletePayoffSnapshot(matrix, [...terminals].reverse())
    expect(forward.kind).toBe("complete"); expect(reverse.kind).toBe("complete")
    if (forward.kind !== "complete" || reverse.kind !== "complete") throw Error("fixture matrix")
    const solved = solveLeagueSnapshot({ snapshot: forward.snapshot, solverPayoffBytes: forward.solverPayoffBytes })
    expect(solved.status).toBe("solved")
    expect(solveLeagueSnapshot({ snapshot: reverse.snapshot, solverPayoffBytes: reverse.solverPayoffBytes })).toEqual(solved)
    expect(reverse.cellStream).toEqual(forward.cellStream)
  })
  it("enumerates exactly eight cells per unordered immutable candidate pair in stable semantic order", () => {
    const matrix = enumerateLeagueCells(input())
    expect(matrix.cells).toHaveLength(8 * 3)
    expect(matrix.expectedCellCount).toBe(8 * 3)
    expect(new Set(matrix.cells.map((entry) => entry.cell.root)).size).toBe(24)
    expect(matrix.cells.map((entry) => entry.ordinal)).toEqual(Array.from({ length: 24 }, (_, ordinal) => ordinal))
    expect(matrix.semanticGeometryHashes).toHaveLength(2)
    expect(matrix.semanticGeometryHashes).toEqual([...matrix.semanticGeometryHashes].sort())
  })

  it("collapses Smoke/Open Field to one semantic geometry and refuses a duplicate active semantic geometry", () => {
    const matrix = enumerateLeagueCells(input(2))
    expect(matrix.semanticGeometryHashes).toHaveLength(2)
    const duplicate = structuredClone(CANONICAL_ARENA_CATALOG_V1_37)
    duplicate.arenas[2]!.status = "active"
    duplicate.arenas[2]!.schedulable = true
    expect(() => enumerateLeagueCells({ ...input(2), arenaCatalog: duplicate })).toThrow("ACTIVE_SEMANTIC_GEOMETRY_DUPLICATE")
  })

  it("blocks every gap, duplicate, identity mismatch, invalid disposition, and system failure while retaining process evidence", () => {
    const matrix = enumerateLeagueCells(input(2))
    const complete = matrix.cells.map((expected) => successTerminal(expected))
    const variations = [
      complete.slice(1),
      [...complete, complete[0]!],
      [...complete, { ...complete[0]!, evidenceRoot: root("6") }],
      [...complete.slice(0, -1), createLeagueCellTerminal({ cellRoot: complete.at(-1)!.cellRoot, disposition: "invalid", processValidity: "process_invalid", evidenceRoot: root("7"), projection: null })],
      [...complete.slice(0, -1), createLeagueCellTerminal({ cellRoot: complete.at(-1)!.cellRoot, disposition: "player_violation", processValidity: "process_invalid", evidenceRoot: root("8"), projection: null })],
      [...complete.slice(0, -1), createLeagueCellTerminal({ cellRoot: complete.at(-1)!.cellRoot, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: root("9"), projection: null })],
      [...complete.slice(0, -1), { ...complete.at(-1)!, cellRoot: root("a") }],
    ]
    for (const terminals of variations) {
      const admitted = admitCompletePayoffSnapshot(matrix, terminals)
      expect(admitted.kind, "league-eval:matrix-fault-families").toBe("blocked")
      if (terminals.some((terminal) => terminal.processValidity === "process_invalid")) expect(admitted.kind, "league-eval:invalid-and-system-terminals").toBe("blocked")
      expect(admitted.processEvidence).toHaveLength(terminals.length)
    }
  })

  it("keeps canonical entrant half-points across mirrored sides and initiatives, including draws", () => {
    const matrix = enumerateLeagueCells(input(2))
    const decisive = matrix.cells.map((entry, ordinal) =>
      successTerminal(entry, ordinal % 2 === 0 ? "entrant" : "opponent"),
    )
    const draws = matrix.cells.map((entry) => successTerminal(entry, "DRAW"))
    const winners = admitCompletePayoffSnapshot(matrix, decisive)
    expect(winners.kind).toBe("complete")
    if (winners.kind === "complete") expect([...winners.halfPoints]).toEqual(expect.arrayContaining([2, 0]))
    const drawn = admitCompletePayoffSnapshot(matrix, draws)
    expect(drawn.kind).toBe("complete")
    if (drawn.kind === "complete") {
      expect(drawn.halfPoints).toEqual(Array(8).fill(1))
      expect(new TextDecoder().decode(drawn.solverPayoffBytes)).toMatch(/halfPoints/)
      expect(new TextDecoder().decode(drawn.solverPayoffBytes)).not.toMatch(/bottomScore|topScore|seed|winnerPlayerId/)
    }
  })

  it("reduces reorders and operational layouts to identical semantic payoff bytes and roots", () => {
    const matrix = enumerateLeagueCells(input(2))
    const terminals = matrix.cells.map((entry) => successTerminal(entry, "DRAW"))
    const forward = admitCompletePayoffSnapshot(matrix, terminals)
    const reverse = admitCompletePayoffSnapshot(matrix, [...terminals].reverse())
    expect(forward.kind).toBe("complete")
    expect(reverse.kind).toBe("complete")
    if (forward.kind === "complete" && reverse.kind === "complete") {
      expect(reverse.snapshot.root).toBe(forward.snapshot.root)
      expect(reverse.solverPayoffBytes, "league-eval:repeat-layout-and-replay").toEqual(forward.solverPayoffBytes)
    }
  })

  it("covers the full 528-cell population while retaining only bounded stream descriptors at the 262144-byte limit", () => {
    const matrix = enumerateLeagueCells(input(12))
    expect(matrix.expectedCellCount).toBe(8 * ((12 * 11) / 2))
    const payload = new Uint8Array(262144)
    const stream = describeLeagueCellStream([payload])
    expect(stream.byteLength).toBe(262144)
    expect(stream.chunks).toHaveLength(1)
    expect(stream.chunks[0]!.byteLength).toBe(262144)
    expect(stream.chunks[0]!.previousRoot).toBeNull()
    expect(stream).not.toHaveProperty("cells")
  })
})
