import { describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS, labRoot } from "../contracts.js"
import { createLeagueExecutionAllocation, admitLeagueExecutionAllocation, type LeagueExecutionAllocationInput } from "./allocation.js"
import { RED_TEAM_CHANNELS, LEAGUE_PROBES } from "./red-team.js"

const root = (text: string) => labRoot("allocation-test", text)
const zero = { matches: 0, modelTokens: 0, effortMilliseconds: 0, reviewMilliseconds: 0, searchNodes: 0, teacherNodes: 0, distillationUnits: 0 }
export const allocationFixture = (): LeagueExecutionAllocationInput => ({
  phase: 265, privacy: "private_offline", evidenceClass: "injected_fixture", operatorDecision: "source-only-test", studyPolicyRoot: LAB_ADMITTED_ROOTS.studyPolicyRoot, measurementPolicyRoot: LAB_ADMITTED_ROOTS.measurementPolicyRoot, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, implementationRoot: root("implementation"),
  initialCandidatePublicationRoots: [root("one"), root("two")].sort(), seedBlocks: ["league-test"],
  opportunities: { attemptedCandidates: 0, acceptedResponseSlots: 0, responseRounds: 2, searchEvaluations: 0, teacherNodes: 0, distillationWorkUnits: 0, matches: 160, modelAttempts: 0, modelTokens: 0, humanEffortMinutes: 0, humanSubmissions: 0, externalEffortMinutes: 0, externalSubmissions: 0, replayReviewMinutes: 0, retryAttempts: 0 },
  operations: { wallClockMilliseconds: 10000, perMatchMilliseconds: 1000, perProviderInvocations: 128, perAttemptMilliseconds: 1000, maxArtifactBytes: 20000000, maxArtifactRecords: 10000, maxPopulation: 2, cachePolicy: "disabled", hardwareClass: "2cpu-256m", image: LAB_ADMITTED_ROOTS.image, sourceLimitBytes: 65536, objectiveLimitBytes: 1024, strategyMemoryLimitBytes: 32768, soldierMemoryLimitBytes: 2048, outputLimitBytes: 262144 },
  retryBurn: { allStartsCharged: true, unknownUsage: "full-reservation", onIntegrityFailure: "stop", unusedSlots: "retain-no-refund", retryCeiling: 0 },
  channels: RED_TEAM_CHANNELS.map((channel) => ({ channel, disposition: "authorized_zero", opportunities: 0, ceilings: zero, perAttempt: zero, retryLimit: 0, participants: [], reviewers: [], disclosure: "complete-source-build-and-dependencies", conflicts: "distinct-reviewer", provenance: "explicit-deterministic-data-only", burn: "reserve-full-no-refund" })),
  probes: LEAGUE_PROBES.map((family) => ({ family, pairs: 1, maximumAbsoluteMeanDelta: ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(family) ? null : { numerator: 1, denominator: 4 } })),
  rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: [] }, { ordinal: 1, acceptedSlots: 0, jobs: [] }],
  participantPolicy: { disclosure: "complete-source-build-and-dependencies", review: "distinct-reviewer", priorExposure: "declared", conflicts: "reject", unfilled: "retain", modelInternalSnapshot: "record-unavailable-no-substitute" },
})
describe("prospective complete Phase 265 execution allocation", () => {
  it("roots and re-admits the exact whole vector without authorizing an injected fixture", () => {
    const allocation = createLeagueExecutionAllocation(allocationFixture())
    expect(admitLeagueExecutionAllocation(allocation)).toEqual(allocation)
    expect(() => admitLeagueExecutionAllocation(allocation, "empirical")).toThrow()
  })
  it("rejects each missing opportunity and operational dimension, stale pins, inherited allocation, and missing channels", () => {
    for (const section of ["opportunities", "operations", "retryBurn", "participantPolicy"] as const) {
      for (const field of Object.keys(allocationFixture()[section])) {
        const value = structuredClone(allocationFixture()) as unknown as Record<string, Record<string, unknown>>
        delete value[section]![field]
        expect(() => createLeagueExecutionAllocation(value as never), `${section}.${field}`).toThrow()
      }
    }
    for (const field of ["studyPolicyRoot", "measurementPolicyRoot", "tupleRoot", "runtimeRoot"] as const) expect(() => createLeagueExecutionAllocation({ ...allocationFixture(), [field]: root("stale") })).toThrow()
    expect(() => createLeagueExecutionAllocation({ ...allocationFixture(), phase: 264 } as never)).toThrow()
    expect(() => createLeagueExecutionAllocation({ ...allocationFixture(), channels: [] })).toThrow()
  })
  it("cannot disguise small fixtures as empirical or invent an unbounded model job", () => {
    expect(() => createLeagueExecutionAllocation({ ...allocationFixture(), evidenceClass: "empirical" })).toThrow()
    const input = allocationFixture()
    expect(() => createLeagueExecutionAllocation({ ...input, rounds: [{ ...input.rounds[0]!, jobs: [{ channel: "model", inputArtifactRoot: root("job") }] as never }, input.rounds[1]!] })).toThrow()
  })
})
