import { describe, expect, it } from "vitest"
import { labRoot } from "../contracts.js"
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
      expect(terminal.terminals[0]!.charge).toEqual(resources(10))
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
    expect(ledger.probes).toHaveLength(9)
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
})
