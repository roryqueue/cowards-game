import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { admitLeagueCandidate, projectCanonicalKernelOutcomeToEntrantHalfPoints } from "./contracts.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const candidate = () => {
  const proposal = factoryProposalFromPacket(factoryOraclePacketFixture())
  return factoryCandidateFixture(proposal, factoryValidationFixture(proposal))
}
const admission = () => {
  const value = candidate()
  const start = createFactoryAttemptStart({ taskRoot: root("1"), budgetRoot: root("2"), candidateRoot: value.root, authoringMechanism: "automated-oracle", inputRoot: root("3"), resourceAccountingRoot: root("4"), retryParentRoot: null })
  const terminal = createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: root("5"), validationRoot: root("6"), duplicateEvidenceRoot: root("7"), finalEvidenceRoot: root("8") })
  return { candidate: value, start, terminal }
}
const completed = (winner: "bottom" | "top" | "DRAW") => {
  const outcome = winner === "DRAW" ? { type: "DRAW" as const } : { type: "WIN" as const, winnerPlayerId: winner }
  const events = [{ type: "MATCH_ENDED", payload: outcome }]
  return { execution: { kind: "completed", privacy: "private_offline", result: { state: { outcome }, events }, transitions: [], accounting: [] } as never, resultEventRoot: labRoot("league-result-events-v1", events) }
}
const projection = (winner: "bottom" | "top" | "DRAW", entrant: "bottom" | "top") => {
  const result = completed(winner)
  return projectCanonicalKernelOutcomeToEntrantHalfPoints({
    execution: result.execution, entrantCandidateRoot: entrant === "bottom" ? root("a") : root("b"), bottomCandidateRoot: root("a"), topCandidateRoot: root("b"),
    bottomPlayerId: "bottom", topPlayerId: "top", cellRoot: root("c"), conditionRoot: root("d"), semanticGeometryHash: root("e"), resultEventRoot: result.resultEventRoot,
  })
}

describe("private league contracts", () => {
  it("admits a factory candidate only through revalidated issued evidence, never a claimed boolean", () => {
    const evidence = admission()
    const issuer = { verifyCandidate: (value: typeof evidence.candidate) => value.root === evidence.candidate.root }
    expect(admitLeagueCandidate(issuer, { ...evidence, issued: true })).toMatchObject({ candidate: { root: evidence.candidate.root } })
    expect(() => admitLeagueCandidate({ verifyCandidate: () => false }, evidence)).toThrow()
    expect(() => admitLeagueCandidate(issuer, { candidate: evidence.candidate, issued: true })).toThrow()
  })

  it("projects one completed canonical outcome by entrant, not by bottom/top score", () => {
    expect(projection("bottom", "bottom").halfPoints).toBe(2)
    expect(projection("bottom", "top").halfPoints).toBe(0)
    expect(projection("top", "bottom").halfPoints).toBe(0)
    expect(projection("top", "top").halfPoints).toBe(2)
    expect(projection("DRAW", "bottom").halfPoints).toBe(1)
    expect(projection("DRAW", "top").halfPoints).toBe(1)
  })

  it("rejects a caller-selected event root or a nonterminal execution", () => {
    const result = completed("bottom")
    expect(() => projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution: result.execution, entrantCandidateRoot: root("a"), bottomCandidateRoot: root("a"), topCandidateRoot: root("b"), bottomPlayerId: "bottom", topPlayerId: "top", cellRoot: root("c"), conditionRoot: root("d"), semanticGeometryHash: root("e"), resultEventRoot: root("f") })).toThrow()
    expect(() => projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution: { kind: "failure" } as never, entrantCandidateRoot: root("a"), bottomCandidateRoot: root("a"), topCandidateRoot: root("b"), bottomPlayerId: "bottom", topPlayerId: "top", cellRoot: root("c"), conditionRoot: root("d"), semanticGeometryHash: root("e"), resultEventRoot: root("f") })).toThrow()
  })
})
