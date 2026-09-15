import { describe, expect, it } from "vitest"
import { labRoot } from "../contracts.js"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { createCompletePayoffSnapshot, createLeagueCandidateAdmission } from "./contracts.js"
import { declareLeagueRound, advanceLeagueRound } from "./psro.js"
import { solveLeagueSnapshot } from "./solver.js"
import { RED_TEAM_CHANNELS, LEAGUE_PROBES, declareRedTeamAllocation, startRedTeamAttempt, terminalizeRedTeamAttempt, recordLeagueProbe, closeRedTeamLedger, reenterAcceptedCounter, type RedTeamAllocationInput, type RedTeamLedger } from "./red-team.js"

const root = (value: string) => labRoot("red-team-test", value)
const resources = (value: number) => ({ matches: value, modelTokens: value, effortMilliseconds: value, reviewMilliseconds: value, searchNodes: value, teacherNodes: value, distillationUnits: value })
export const redTeamAllocationFixture = (): RedTeamAllocationInput => ({
  phase: 265, evidenceClass: "injected_fixture", authorityRoot: root("fresh-authority"),
  channels: RED_TEAM_CHANNELS.map((channel) => ({ channel, disposition: "allocated", opportunities: 2, ceilings: resources(20), perAttempt: resources(10), retryLimit: 1,
    participants: ["attacker"], reviewers: ["reviewer"], disclosure: "complete-source-build-and-dependencies", conflicts: "distinct-reviewer", provenance: "explicit-deterministic-data-only", burn: "reserve-full-no-refund" })),
  probes: LEAGUE_PROBES.map((family) => ({ family, pairs: 1, maximumAbsoluteMeanDelta: ["repeat_restart", "worker_shard_completion", "semantic_arena_identity"].includes(family) ? null : { numerator: 1, denominator: 4 } })),
})
const target = { roundRoot: root("round"), candidateRoot: root("leader"), participantId: "attacker", reviewerId: "reviewer", disclosureRoot: root("disclosure"), provenanceRoot: root("provenance"), inputRoot: root("input"), retryParentRoot: null }
const start = (ledger: RedTeamLedger, channel = "automated" as const) => startRedTeamAttempt({ ledger, channel, ...target, reservation: resources(10) })
const finish = (ledger: RedTeamLedger, disposition = "legal_but_weak" as const) => terminalizeRedTeamAttempt({ ledger, startRoot: ledger.starts.at(-1)!.root, disposition, usage: resources(1), evidenceRoots: [root("raw-evidence")], candidateAdmissionRoot: null })

describe("all-channel development red team", () => {
  it("retains a full twelve-candidate multi-round ledger beyond one artifact envelope", () => {
    const allocation = redTeamAllocationFixture(); let ledger = declareRedTeamAllocation({ ...allocation, probes: allocation.probes.map((row) => ({ ...row, pairs: 2 })) })
    const targets = []
    for (let round = 0; round < 2; round++) for (let candidate = 0; candidate < 12; candidate++) {
      const target = { roundRoot: root(`round-${round}`), candidateRoot: root(`candidate-${candidate}`) }; targets.push(target)
      for (const family of LEAGUE_PROBES) { const identity = ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(family); ledger = recordLeagueProbe({ ledger, ...target, family, pairs: [0, 1].map((pair) => ({ left: { canonicalBytes: "same", halfPoints: 1, conditionRoot: root(`left-${pair}`), evidenceRoot: root(`e-left-${pair}`) }, right: { canonicalBytes: "same", halfPoints: 1, conditionRoot: root(`${identity ? "left" : "right"}-${pair}`), evidenceRoot: root(`e-right-${pair}`) } })) }) }
    }
    const encoded = admitCanonicalJsonValue(ledger, { profile: "canonical-manifest" })
    expect(encoded.ok && encoded.canonicalByteLength).toBeGreaterThan(262144)
    expect(closeRedTeamLedger({ ledger, requiredTargets: targets, reentries: [] }).processValidity).toBe("process_valid")
  }, 60000)
  it("requires all four explicitly allocated channels and never inherits an absent or zero row", () => {
    const input = redTeamAllocationFixture()
    expect(declareRedTeamAllocation(input).allocation.channels.map((row) => row.channel)).toEqual(RED_TEAM_CHANNELS)
    expect(() => declareRedTeamAllocation({ ...input, channels: input.channels.slice(1) })).toThrow()
    expect(() => declareRedTeamAllocation({ ...input, phase: 264 } as never)).toThrow()
    expect(() => declareRedTeamAllocation({ ...input, channels: input.channels.map((row) => ({ ...row, opportunities: 0 })) })).toThrow()
    const zero = { ...input.channels[0]!, disposition: "authorized_zero" as const, opportunities: 0, ceilings: resources(0), perAttempt: resources(0), retryLimit: 0, participants: [], reviewers: [] }
    expect(() => declareRedTeamAllocation({ ...input, channels: [zero, ...input.channels.slice(1)] })).not.toThrow()
    expect(() => start(declareRedTeamAllocation({ ...input, channels: [zero, ...input.channels.slice(1)] }))).toThrow()
  })

  it("starts before work, burns reservations, retains every terminal and refuses capacity refunds", () => {
    const dispositions = ["success", "rejected", "legal_but_weak", "invalid", "duplicate", "player_violation", "system_failure", "retried", "unfilled", "unused"] as const
    for (const disposition of dispositions) {
      const initial = declareRedTeamAllocation(redTeamAllocationFixture()), charged = start(initial)
      expect(initial.starts).toHaveLength(0)
      expect(charged.starts).toHaveLength(1)
      expect(() => terminalizeRedTeamAttempt({ ledger: initial, startRoot: charged.starts[0]!.root, disposition, usage: resources(0), evidenceRoots: [root("raw")], candidateAdmissionRoot: null })).toThrow()
      const terminal = terminalizeRedTeamAttempt({ ledger: charged, startRoot: charged.starts[0]!.root, disposition, usage: disposition === "system_failure" ? null : resources(0), evidenceRoots: [root("raw")], candidateAdmissionRoot: disposition === "success" ? root("counter") : null })
      expect(terminal.terminals[0]!.charge, "league-eval:charged-outcomes").toEqual(resources(10))
      expect(terminal.terminals[0]!.processValidity).toBe(["system_failure", "player_violation", "invalid"].includes(disposition) ? "process_invalid" : "process_valid")
      expect(() => terminalizeRedTeamAttempt({ ledger: terminal, startRoot: charged.starts[0]!.root, disposition, usage: resources(0), evidenceRoots: [root("raw")], candidateAdmissionRoot: null })).toThrow()
      const twice = finish(start(terminal))
      expect(() => start(twice)).toThrow()
      expect(twice.terminals.map((row) => row.disposition)).toEqual([disposition, "legal_but_weak"])
    }
  })

  it("binds participant, reviewer, retry parent, target, and bounded measured usage", () => {
    const initial = declareRedTeamAllocation(redTeamAllocationFixture())
    expect(() => startRedTeamAttempt({ ledger: initial, channel: "human", ...target, reviewerId: "attacker", reservation: resources(1) })).toThrow()
    expect(() => startRedTeamAttempt({ ledger: initial, channel: "external", ...target, participantId: "unknown", reservation: resources(1) })).toThrow()
    expect(() => startRedTeamAttempt({ ledger: initial, channel: "model", ...target, retryParentRoot: root("invented"), reservation: resources(1) })).toThrow()
    const charged = start(initial), done = finish(charged)
    expect(() => terminalizeRedTeamAttempt({ ledger: charged, startRoot: charged.starts[0]!.root, disposition: "invalid", usage: resources(11), evidenceRoots: [root("raw")], candidateAdmissionRoot: null })).toThrow()
    expect(startRedTeamAttempt({ ledger: done, channel: "automated", ...target, retryParentRoot: done.starts[0]!.root, reservation: resources(10) }).starts[1]!.retryParentRoot).toBe(done.starts[0]!.root)
    expect(() => start({ ...done, terminals: [] } as RedTeamLedger)).toThrow()
  })

  it("records all nine probes with exact identity versus bounded valid-condition contrasts", () => {
    let ledger = declareRedTeamAllocation(redTeamAllocationFixture())
    for (const family of LEAGUE_PROBES) {
      const exact = ["repeat_restart", "worker_shard_completion", "semantic_arena_identity"].includes(family)
      ledger = recordLeagueProbe({ ledger, family, ...target, pairs: [{ left: { canonicalBytes: "same", halfPoints: 2, conditionRoot: root("condition-left"), evidenceRoot: root("left") }, right: { canonicalBytes: exact ? "same" : "different-valid-condition", halfPoints: 2, conditionRoot: exact ? root("condition-left") : root("condition-right"), evidenceRoot: root("right") } }] })
    }
    expect(ledger.probes, "league-eval:nine-probes").toHaveLength(9)
    expect(ledger.probes.every((row) => row.passed)).toBe(true)
    const unequal = recordLeagueProbe({ ledger: declareRedTeamAllocation(redTeamAllocationFixture()), family: "repeat_restart", ...target, pairs: [{ left: { canonicalBytes: "x", halfPoints: 2, conditionRoot: root("c"), evidenceRoot: root("l") }, right: { canonicalBytes: "y", halfPoints: 2, conditionRoot: root("c"), evidenceRoot: root("r") } }] })
    expect(unequal.probes[0]).toMatchObject({ passed: false, processValidity: "process_invalid" })
    const material = recordLeagueProbe({ ledger: declareRedTeamAllocation(redTeamAllocationFixture()), family: "side", ...target, pairs: [{ left: { canonicalBytes: "x", halfPoints: 2, conditionRoot: root("c1"), evidenceRoot: root("l") }, right: { canonicalBytes: "y", halfPoints: 0, conditionRoot: root("c2"), evidenceRoot: root("r") } }] })
    expect(material.probes[0]).toMatchObject({ passed: false, processValidity: "process_valid" })
  })

  it("requires allocation-supplied contrast bounds and complete probe/attempt coverage at closure", () => {
    const input = redTeamAllocationFixture()
    expect(() => declareRedTeamAllocation({ ...input, probes: input.probes.map((probe) => ({ ...probe, maximumAbsoluteMeanDelta: null })) })).toThrow()
    expect(() => closeRedTeamLedger({ ledger: declareRedTeamAllocation(input), requiredTargets: [target], reentries: [] })).toThrow()
    expect(() => reenterAcceptedCounter({ ledger: finish(start(declareRedTeamAllocation(input))), startRoot: root("missing"), round: {} as never, candidateAdmission: {} as never, assessment: {} as never })).toThrow()
  })

  it("returns a positive counter to actual PSRO and cannot close while that counter is omitted", () => {
    const [entrantCandidateRoot, opponentCandidateRoot] = [root("a"), root("b")].sort()
    const projections = Array.from({ length: 8 }, (_, ordinal) => ({ entrantCandidateRoot, opponentCandidateRoot, projectionRoot: root(String(ordinal)), halfPoints: 1 })).sort((left, right) => left.projectionRoot.localeCompare(right.projectionRoot))
    const snapshot = createCompletePayoffSnapshot({ populationRoot: root("population"), cellChunkRoots: [root("chunk")], solverPayoffRoot: labRoot("league-solver-payoffs-v1", projections), expectedCellCount: 8, completedCellCount: 8 })
    const encoded = admitCanonicalJsonValue(projections, { profile: "canonical-manifest" }); if (!encoded.ok) throw Error("fixture")
    const solver = solveLeagueSnapshot({ snapshot, solverPayoffBytes: encoded.canonicalBytes })
    const round = declareLeagueRound({ snapshot, solver, responseAllocationRoot: root("response-allocation"), roundOrdinal: 0, maximumRounds: 2, closureRule: "bounded-no-accepted-counter-v1" })
    const proposal = factoryProposalFromPacket(factoryOraclePacketFixture()), candidate = factoryCandidateFixture(proposal, factoryValidationFixture(proposal), root("receipt"))
    const factoryStart = createFactoryAttemptStart({ taskRoot: root("t"), budgetRoot: root("b"), candidateRoot: candidate.root, authoringMechanism: "automated-oracle", inputRoot: root("i"), resourceAccountingRoot: root("r"), retryParentRoot: null })
    const admission = createLeagueCandidateAdmission({ candidate, supervisionReceiptRoot: candidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", candidate.lineage), tupleRoot: candidate.proposal.build.compatibilityTupleRoot, runtimeRoot: candidate.proposal.nativeLane.runtimeProfileRoot, provenanceRoot: root("p"), attemptStart: factoryStart, attemptTerminal: createFactoryAttemptTerminal({ startRoot: factoryStart.root, disposition: "accepted", outputRoot: root("o"), validationRoot: root("v"), duplicateEvidenceRoot: root("d"), finalEvidenceRoot: root("f") }) })
    const charged = startRedTeamAttempt({ ledger: declareRedTeamAllocation(redTeamAllocationFixture()), channel: "automated", ...target, roundRoot: round.round.root, reservation: resources(10) })
    const done = terminalizeRedTeamAttempt({ ledger: charged, startRoot: charged.starts[0]!.root, disposition: "success", usage: resources(1), evidenceRoots: [root("result")], candidateAdmissionRoot: admission.root })
    const assessment = { targetRoot: round.target.root, fingerprintEvidenceRoot: root("fingerprint"), independentCounterfactualRelations: ["distinct" as const], existingCandidateRoots: [root("a"), root("b")], completeTargetScores: [...new Set([round.target.mixtureRoot, round.target.strongestPureCandidateRoot, round.target.vulnerablePureCandidateRoot])].map((targetRoot) => ({ targetRoot, numerator: 3, denominator: 4, evidenceRoot: root("set") })) }
    const reentry = reenterAcceptedCounter({ ledger: done, startRoot: charged.starts[0]!.root, round, candidateAdmission: admission, assessment })
    expect(reentry).toMatchObject({ disposition: "success", roundRoot: round.round.root, candidateAdmissionRoot: admission.root })
    expect(() => advanceLeagueRound({ round, admissions: [reentry], requestClosure: true }), "league-eval:accepted-counter-reentry").toThrow("EARLY_CLOSURE")
    expect(() => reenterAcceptedCounter({ ledger: done, startRoot: charged.starts[0]!.root, round, candidateAdmission: admission, assessment: { ...assessment, completeTargetScores: assessment.completeTargetScores.slice(1) } })).toThrow("TARGET_COVERAGE")
  })
})
