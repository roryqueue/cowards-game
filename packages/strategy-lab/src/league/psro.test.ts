import { admitCanonicalJsonValue } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { createCompletePayoffSnapshot, createLeagueCandidateAdmission } from "./contracts.js"
import { admitLeagueResponse, advanceLeagueRound, declareLeagueRound } from "./psro.js"
import { solveLeagueSnapshot } from "./solver.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const canonical = (value: unknown): Uint8Array => {
  const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!result.ok) throw new TypeError("TEST_CANONICAL")
  return result.canonicalBytes
}

const solver = () => {
  const projections = Array.from({ length: 8 }, (_, ordinal) => ({ entrantCandidateRoot: root("a"), opponentCandidateRoot: root("b"), projectionRoot: root("0123456789abcdef"[ordinal]!), halfPoints: 2 }))
  const snapshot = createCompletePayoffSnapshot({ populationRoot: root("c"), cellChunkRoots: [root("d")], solverPayoffRoot: labRoot("league-solver-payoffs-v1", projections), expectedCellCount: 8, completedCellCount: 8 })
  const result = solveLeagueSnapshot({ snapshot, solverPayoffBytes: canonical(projections) })
  if (result.status !== "solved") throw new TypeError("TEST_SOLVER")
  return { snapshot, result }
}

const candidateAdmission = () => {
  const proposal = factoryProposalFromPacket(factoryOraclePacketFixture())
  const candidate = factoryCandidateFixture(proposal, factoryValidationFixture(proposal), root("e"))
  const start = createFactoryAttemptStart({ taskRoot: root("f"), budgetRoot: root("0"), candidateRoot: candidate.root, authoringMechanism: "automated-oracle", inputRoot: root("1"), resourceAccountingRoot: root("2"), retryParentRoot: null })
  return createLeagueCandidateAdmission({ candidate, supervisionReceiptRoot: candidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", candidate.lineage), tupleRoot: candidate.proposal.build.compatibilityTupleRoot, runtimeRoot: candidate.proposal.nativeLane.runtimeProfileRoot, provenanceRoot: root("3"), attemptStart: start, attemptTerminal: createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: root("4"), validationRoot: root("5"), duplicateEvidenceRoot: root("6"), finalEvidenceRoot: root("7") }) })
}

const declared = () => {
  const { snapshot, result } = solver()
  return declareLeagueRound({ snapshot, solver: result, responseAllocationRoot: root("8"), roundOrdinal: 0, maximumRounds: 2, closureRule: "bounded-no-accepted-counter-v1" })
}

describe("immutable PSRO response lifecycle", () => {
  it("roots a frozen mixture plus strongest and vulnerable pure targets and charges before response work", () => {
    const round = declared()
    expect(round.round.priorSnapshotRoot).toBe(round.snapshotRoot)
    expect(round.target.mixtureRoot).toMatch(/^sha256:/)
    expect(round.target.strongestPureCandidateRoot).toMatch(/^sha256:/)
    expect(round.target.vulnerablePureCandidateRoot).toMatch(/^sha256:/)
    expect(round.charge.startRoot).toMatch(/^sha256:/)
  })

  it("retains every failed, weak, duplicate, retry, and unfilled disposition as charged terminal evidence", () => {
    const round = declared(), candidate = candidateAdmission()
    const dispositions = ["invalid", "duplicate", "legal_but_weak", "retried", "unfilled", "unused"] as const
    const rows = dispositions.map((disposition, ordinal) => admitLeagueResponse({ round, candidateAdmission: candidate, ordinal, terminal: { disposition, legal: disposition === "invalid" ? "invalid" : "verified", runtime: "accepted", provenance: "verified", independence: disposition === "duplicate" ? "clone" : "independent", novelty: disposition === "duplicate" ? "duplicate" : disposition === "legal_but_weak" ? "weak" : "novel", positive: disposition === "legal_but_weak" ? "weak" : "positive", evidenceRoot: root("0123456789abcdef"[ordinal]!) } }))
    expect(rows.map((row) => row.disposition)).toEqual(dispositions)
    expect(rows.every((row) => row.chargeStartRoot !== null && row.terminalRoot !== null)).toBe(true)
  })

  it("requires receipt-derived legal/runtime/provenance/independence/novelty/positive evidence and sends an accepted late counter to a fresh snapshot", () => {
    const round = declared(), candidate = candidateAdmission()
    const accepted = admitLeagueResponse({ round, candidateAdmission: candidate, ordinal: 0, terminal: { disposition: "success", legal: "verified", runtime: "accepted", provenance: "verified", independence: "independent", novelty: "novel", positive: "positive", evidenceRoot: root("9") } })
    expect(accepted.disposition).toBe("success")
    expect(() => advanceLeagueRound({ round, admissions: [accepted], requestClosure: true })).toThrow("LEAGUE_PSRO_EARLY_CLOSURE")
    const advanced = advanceLeagueRound({ round, admissions: [accepted], requestClosure: false, nextPopulationRoot: root("a"), nextSnapshotRoot: root("b") })
    expect(advanced.kind).toBe("fresh_snapshot_required")
    if (advanced.kind === "fresh_snapshot_required") {
      expect(advanced.acceptedCandidateAdmissionRoots).toEqual([candidate.root])
      expect(advanced.nextSnapshotRoot).toBe(root("b"))
    }
  })
})
