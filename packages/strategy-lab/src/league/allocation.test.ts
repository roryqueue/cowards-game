import { describe, expect, it } from "vitest"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { LAB_ADMITTED_ROOTS, labRoot } from "../contracts.js"
import { createLeagueExecutionAllocation, admitLeagueExecutionAllocation, type LeagueExecutionAllocationInput } from "./allocation.js"
import { RED_TEAM_CHANNELS, LEAGUE_PROBES } from "./red-team.js"
import { createLeagueProspectiveAmendment, admitLeagueProspectiveAmendment, createProspectiveLeagueExecutionAllocation, admitProspectiveLeagueExecutionAllocation, createLeagueCapacityReceipt, admitLeagueCapacityReceipt, assertProspectiveLeagueProducerRequest, LEAGUE_APPROVED_PROSPECTIVE_POLICY, type LeagueProspectiveAmendmentInput, type ProspectiveLeagueExecutionAllocationInput, type LeagueCapacityReceiptInput } from "./allocation.js"

const root = (text: string) => labRoot("allocation-test", text)
const zero = { matches: 0, modelTokens: 0, effortMilliseconds: 0, reviewMilliseconds: 0, searchNodes: 0, teacherNodes: 0, distillationUnits: 0 }
export const allocationFixture = (): LeagueExecutionAllocationInput => ({
  phase: 265, privacy: "private_offline", evidenceClass: "injected_fixture", operatorDecision: "source-only-test", studyPolicyRoot: LAB_ADMITTED_ROOTS.studyPolicyRoot, measurementPolicyRoot: LAB_ADMITTED_ROOTS.measurementPolicyRoot, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, implementationRoot: root("implementation"),
  initialCandidatePublicationRoots: [root("one"), root("two")].sort(), factoryAssessmentArtifactRoots: [root("historical-measurement-only")], independenceReferencePublicationRoot: root("one"), seedBlocks: ["league-test"],
  outputDirectories: { league: "/fixture/league-output", responseFactory: null },
  opportunities: { attemptedCandidates: 0, acceptedResponseSlots: 0, responseRounds: 2, searchEvaluations: 0, teacherNodes: 0, distillationWorkUnits: 0, matches: 160, modelAttempts: 0, modelTokens: 0, humanEffortMinutes: 0, humanSubmissions: 0, externalEffortMinutes: 0, externalSubmissions: 0, replayReviewMinutes: 0, retryAttempts: 0 },
  operations: { wallClockMilliseconds: 10000, perMatchMilliseconds: 1000, perProviderInvocations: 128, perAttemptMilliseconds: 1000, maxArtifactBytes: 20000000, maxArtifactRecords: 10000, terminalReserveBytes: 2000000, terminalReserveRecords: 2000, maxPopulation: 2, cachePolicy: "disabled", hardwareClass: "2cpu-256m", image: LAB_ADMITTED_ROOTS.image, sourceLimitBytes: 65536, objectiveLimitBytes: 1024, strategyMemoryLimitBytes: 32768, soldierMemoryLimitBytes: 2048, outputLimitBytes: 262144 },
  retryBurn: { allStartsCharged: true, unknownUsage: "full-reservation", onIntegrityFailure: "stop", unusedSlots: "retain-no-refund", retryCeiling: 0 },
  channels: RED_TEAM_CHANNELS.map((channel) => ({ channel, disposition: "authorized_zero", opportunities: 0, ceilings: zero, perAttempt: zero, retryLimit: 0, participants: [], reviewers: [], disclosure: "complete-source-build-and-dependencies", conflicts: "distinct-reviewer", provenance: "explicit-deterministic-data-only", burn: "reserve-full-no-refund" })),
  probes: LEAGUE_PROBES.map((family) => ({ family, pairs: 1, maximumAbsoluteMeanDelta: ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(family) ? null : { numerator: 1, denominator: 4 } })),
  rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: [] }, { ordinal: 1, acceptedSlots: 0, jobs: [] }],
  participantPolicy: { disclosure: "complete-source-build-and-dependencies", review: "distinct-reviewer", priorExposure: "declared", conflicts: "reject", unfilled: "retain", modelInternalSnapshot: "record-unavailable-no-substitute" },
})

export const prospectiveFixture = (): ProspectiveLeagueExecutionAllocationInput => {
  const base = allocationFixture(), policy = structuredClone(LEAGUE_APPROVED_PROSPECTIVE_POLICY)
  const historicalAssessment = { artifactRoot: root("assessment-artifact"), assessmentRoot: root("assessment"), thresholdArtifactRoot: root("threshold"), producerImplementationRoot: root("historical-producer"), assessmentImplementationRoot: root("historical-assessor") }
  const amendmentInput: LeagueProspectiveAmendmentInput = {
    phase: 265, privacy: "private_offline", evidenceClass: "injected_fixture", approvalCommit: "06cdb050", implementationRoot: base.implementationRoot, sourceRoot: root("source"), historicalAssessment,
    bases: ["S01", "S03", "S05"].map((sourceSlot) => ({ sourceSlot: sourceSlot as "S01" | "S03" | "S05", publicationArtifactRoot: root(sourceSlot), candidateAdmissionRoot: root(`admission-${sourceSlot}`), sourceRoot: root(`source-${sourceSlot}`), supervisionArtifactRoot: root(`supervision-${sourceSlot}`) })),
    controls: "comparison-only-excluded", policy,
  }
  const amendment = createLeagueProspectiveAmendment(amendmentInput)
  const rounds = policy.schedule.map((producers, ordinal) => ({ ordinal, acceptedSlots: policy.acceptedSlots[ordinal]!, jobs: producers.map((producer, index) => {
    const id = `round-${ordinal}-${producer}-${index}`
    return { id, channel: producer === "model" ? "model" as const : "automated" as const, operation: "produce" as const, evaluationRole: ordinal < 3 ? "development_response" as const : producer === "teacher" ? "validation_opponent" as const : "independent_probe_opponent" as const, producerRequestArtifactRoot: root(`${id}-request`), disclosureArtifactRoot: root(`${id}-disclosure`), provenanceArtifactRoot: root(`${id}-provenance`), reviewArtifactRoot: root(`${id}-review`), participantId: `${id}-author`, reviewerId: `${id}-reviewer`, reservation: { matches: 288, modelTokens: producer === "model" ? 48000 : 0, effortMilliseconds: 64800000, reviewMilliseconds: 900000, searchNodes: producer === "tactical" ? 100 : 0, teacherNodes: producer === "teacher" ? 100 : 0, distillationUnits: producer === "teacher" ? 2 : 0 }, retryParentJobId: null }
  }) }))
  const jobs = rounds.flatMap((round) => round.jobs)
  return { ...base, initialCandidatePublicationRoots: amendment.bases.map((row) => row.publicationArtifactRoot).sort(), independenceReferencePublicationRoot: amendment.bases[0]!.publicationArtifactRoot, factoryAssessmentArtifactRoots: [historicalAssessment.artifactRoot], seedBlocks: ["prospective-test"], outputDirectories: { league: "/fixture/league-prospective", responseFactory: "/fixture/factory-prospective" }, opportunities: policy.opportunities, operations: policy.operations, probes: policy.probes, rounds, amendment,
    participantRoles: jobs.map((job, index) => ({ jobId: job.id, producer: policy.schedule.flat()[index]!, authorAgentId: `injected-author-${index}`, reviewerAgentId: `injected-reviewer-${index}` })),
    channels: base.channels.map((channel) => {
      const rows = jobs.filter((job) => job.channel === channel.channel)
      return rows.length ? { ...channel, disposition: "allocated", opportunities: rows.length, participants: rows.map((job) => job.participantId).sort(), reviewers: rows.map((job) => job.reviewerId).sort(), perAttempt: Object.fromEntries(Object.keys(zero).map((key) => [key, Math.max(...rows.map((job) => job.reservation[key as keyof typeof zero]))])) as typeof zero, ceilings: Object.fromEntries(Object.keys(zero).map((key) => [key, rows.reduce((sum, job) => sum + job.reservation[key as keyof typeof zero], 0)])) as typeof zero } : channel
    }),
  }
}
export const capacityFixture = (allocation = createProspectiveLeagueExecutionAllocation(prospectiveFixture())): LeagueCapacityReceiptInput => ({
  allocationRoot: allocation.root, amendmentRoot: allocation.amendment.root, implementationRoot: allocation.implementationRoot, sourceRoot: allocation.amendment.sourceRoot, historicalAssessmentRoot: allocation.amendment.historicalAssessment.assessmentRoot,
  measuredAtMilliseconds: 1000, expiresAtMilliseconds: 301000, filesystemDevice: "fixture-device", freeFilesystemBytes: 210 * 2 ** 30, availableMemoryBytes: 4 * 2 ** 30, processHeadroomBytes: 2 ** 30,
  scale: { matrixMatches: 960, probeMatches: 1800, responseMatches: 1872, responseExecutionCopies: 2 },
  costs: ["invocation", "execution", "factory_supervision", "descriptor", "journal", "filesystem"].map((category, index) => {
    const units = [4632, 4632, 3744, 1, 1, 1][index]!, measurement = { sourceRoot: allocation.amendment.sourceRoot, witnessRoots: [root(`witness-${category}`)], sampleUnits: units, measuredBytes: 10 * 2 ** 30, measuredRecords: category === "filesystem" ? 0 : 1000000, projectedUnits: units }
    return { category: category as LeagueCapacityReceiptInput["costs"][number]["category"], projectedBytes: measurement.measuredBytes, projectedRecords: measurement.measuredRecords, measurement, measurementRoot: labRoot("league-data-only-capacity-measurement-v1", { category, ...measurement }) }
  }),
  assumptions: ["Injected format measurements only; not future worst-case proof."],
})
describe("approved prospective three-base admission", () => {
  it.each(["red-team", "allocation"])("initializes both policy APIs from a fresh %s-first process", (first) => {
    const second = first === "red-team" ? "allocation" : "red-team"
    const moduleUrl = (name: string) => new URL(`./${name}.ts`, import.meta.url).href
    const output = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
      await import(${JSON.stringify(moduleUrl(first))});
      await import(${JSON.stringify(moduleUrl(second))});
      const { LEAGUE_PROBES } = await import(${JSON.stringify(moduleUrl("red-team"))});
      const { LEAGUE_APPROVED_PROSPECTIVE_POLICY } = await import(${JSON.stringify(moduleUrl("allocation"))});
      console.log(JSON.stringify({ probes: LEAGUE_PROBES, policy: LEAGUE_APPROVED_PROSPECTIVE_POLICY.probes }));
    `], { cwd: fileURLToPath(new URL("../../../../", import.meta.url)), encoding: "utf8", timeout: 20000 })
    expect(JSON.parse(output)).toEqual({ probes: LEAGUE_PROBES, policy: LEAGUE_APPROVED_PROSPECTIVE_POLICY.probes })
  })
  it("roots a distinct amendment/allocation DAG without changing legacy v1 or its twelve-import guard", () => {
    const input = prospectiveFixture(), allocation = createProspectiveLeagueExecutionAllocation(input)
    expect(admitProspectiveLeagueExecutionAllocation(allocation)).toEqual(allocation)
    expect(admitLeagueProspectiveAmendment(input.amendment)).toEqual(input.amendment)
    expect(allocation.schemaVersion).toBe("league-prospective-execution-allocation-v1")
    expect(() => admitLeagueExecutionAllocation(allocation)).toThrow()
    const { amendment, participantRoles, ...legacy } = input
    expect(() => createLeagueExecutionAllocation({ ...legacy, evidenceClass: "empirical" })).toThrow("POPULATION_SEEDS")
    expect(createLeagueExecutionAllocation(allocationFixture()).root).toBe(labRoot("league-execution-allocation-v1", { schemaVersion: "league-execution-allocation-v1", ...allocationFixture() }))
    expect(() => createLeagueProspectiveAmendment({ ...amendment, capacityReceiptRoot: root("cycle") } as never)).toThrow()
    expect(participantRoles).toHaveLength(11)
  })
  it("rejects every missing or changed approved bound, control, substitute, role, probe and channel", () => {
    for (const section of ["opportunities", "operations"] as const) for (const key of Object.keys(prospectiveFixture()[section])) {
      const input = structuredClone(prospectiveFixture()) as any
      delete input[section][key]
      expect(() => createProspectiveLeagueExecutionAllocation(input), `${section}.${key} missing`).toThrow()
      const changed = structuredClone(prospectiveFixture()) as any
      changed[section][key] = typeof changed[section][key] === "number" ? changed[section][key] + 1 : "changed"
      expect(() => createProspectiveLeagueExecutionAllocation(changed), `${section}.${key} changed`).toThrow()
    }
    const mutations = [
      (v: any) => v.initialCandidatePublicationRoots[0] = root("control"),
      (v: any) => v.initialCandidatePublicationRoots[1] = v.initialCandidatePublicationRoots[0],
      (v: any) => v.participantRoles[0].reviewerAgentId = v.participantRoles[0].authorAgentId,
      (v: any) => v.participantRoles.pop(),
      (v: any) => v.probes[0].pairs = 3,
      (v: any) => v.channels[0].ceilings.matches--,
      (v: any) => v.rounds[0].jobs[0].reservation.searchNodes = 99,
      (v: any) => v.rounds[3].jobs[0].evaluationRole = "development_response",
      (v: any) => v.factoryAssessmentArtifactRoots = [root("substitute")],
    ]
    for (const mutate of mutations) { const value = structuredClone(prospectiveFixture()); mutate(value); expect(() => createProspectiveLeagueExecutionAllocation(value)).toThrow() }
    const { root: _root, schemaVersion: _schema, ...body } = prospectiveFixture().amendment
    for (const mutate of [(v: any) => v.bases[1].sourceSlot = "S02", (v: any) => v.approvalCommit = "old", (v: any) => v.policy.finalGates.independentCores = 4]) { const value = structuredClone(body); mutate(value); expect(() => createLeagueProspectiveAmendment(value)).toThrow() }
  })
  it("requires all six capacity categories and exact byte, record, filesystem and freshness margins", () => {
    const allocation = createProspectiveLeagueExecutionAllocation(prospectiveFixture()), input = capacityFixture(allocation)
    const receipt = createLeagueCapacityReceipt(input, allocation)
    const context = { nowMilliseconds: 1001, implementationRoot: allocation.implementationRoot, sourceRoot: allocation.amendment.sourceRoot, filesystemDevice: input.filesystemDevice, freeFilesystemBytes: input.freeFilesystemBytes, availableMemoryBytes: input.availableMemoryBytes }
    expect(admitLeagueCapacityReceipt(receipt, allocation, context)).toEqual(receipt)
    expect(() => admitLeagueCapacityReceipt(undefined, allocation, context)).toThrow()
    for (const category of input.costs) expect(() => createLeagueCapacityReceipt({ ...input, costs: input.costs.filter((row) => row !== category) }, allocation)).toThrow()
    for (const field of ["allocationRoot", "amendmentRoot", "implementationRoot", "sourceRoot", "historicalAssessmentRoot"] as const) expect(() => createLeagueCapacityReceipt({ ...input, [field]: root("wrong") }, allocation)).toThrow()
    for (const [field, value] of [["projectedBytes", 120 * 2 ** 30 + 1 - 40 * 2 ** 30], ["projectedRecords", 8300001 - 4000000]] as const) {
      const costs = input.costs.map((row, index) => { if (index) return row; const measurement = { ...row.measurement, [field === "projectedBytes" ? "measuredBytes" : "measuredRecords"]: value }; return { ...row, [field]: value, measurement, measurementRoot: labRoot("league-data-only-capacity-measurement-v1", { category: row.category, ...measurement }) } })
      expect(() => createLeagueCapacityReceipt({ ...input, costs }, allocation)).toThrow("CAPACITY_MARGIN")
    }
    const incomplete = structuredClone(input) as any
    delete incomplete.costs[0].measurement
    expect(() => createLeagueCapacityReceipt(incomplete, allocation)).toThrow("CAPACITY_CATEGORIES")
    expect(() => createLeagueCapacityReceipt({ ...input, costs: input.costs.map((row, index) => index ? row : { ...row, projectedBytes: row.projectedBytes + 1 }) }, allocation)).toThrow("CAPACITY_ESTIMATE")
    expect(() => createLeagueCapacityReceipt({ ...input, freeFilesystemBytes: 100 * 2 ** 30 - 1 }, allocation)).toThrow()
    expect(() => admitLeagueCapacityReceipt(receipt, allocation, { ...context, nowMilliseconds: input.expiresAtMilliseconds + 1 })).toThrow()
    expect(() => admitLeagueCapacityReceipt(receipt, allocation, { ...context, freeFilesystemBytes: 1 })).toThrow()
    expect(() => admitLeagueCapacityReceipt(receipt, allocation, { ...context, availableMemoryBytes: 1 })).toThrow()
    expect(() => admitLeagueCapacityReceipt(receipt, allocation, { ...context, sourceRoot: root("stale") })).toThrow()
  })
  it("separates logical artifact margins from physical filesystem slack without raising either ceiling", () => {
    const allocation = createProspectiveLeagueExecutionAllocation(prospectiveFixture()), base = capacityFixture(allocation), GiB = 2 ** 30
    const cost = (row: LeagueCapacityReceiptInput["costs"][number], bytes: number, records: number) => {
      const measurement = { ...row.measurement, measuredBytes: bytes, measuredRecords: records }
      return { ...row, projectedBytes: bytes, projectedRecords: records, measurement, measurementRoot: labRoot("league-data-only-capacity-measurement-v1", { category: row.category, ...measurement }) }
    }
    // Injected representative arithmetic only, not measured capacity evidence.
    const logicalBytes = Math.ceil(114632 * GiB / 1000), filesystemBytes = Math.ceil(1234 * GiB / 100)
    const costs = base.costs.map((row, index) => cost(row, index < 4 ? 20 * GiB : index === 4 ? logicalBytes - 80 * GiB : filesystemBytes, index < 4 ? 1000000 : index === 4 ? 3156000 : 0))
    const physicalBytes = logicalBytes + filesystemBytes
    expect(logicalBytes).toBeLessThan(120 * GiB)
    expect(physicalBytes).toBeGreaterThan(120 * GiB)
    const input = { ...base, costs, freeFilesystemBytes: physicalBytes + 40 * GiB }, receipt = createLeagueCapacityReceipt(input, allocation)
    const context = { nowMilliseconds: 1001, implementationRoot: allocation.implementationRoot, sourceRoot: allocation.amendment.sourceRoot, filesystemDevice: input.filesystemDevice, freeFilesystemBytes: input.freeFilesystemBytes, availableMemoryBytes: input.availableMemoryBytes }
    expect(admitLeagueCapacityReceipt(receipt, allocation, context)).toEqual(receipt)
    expect(costs.slice(0, 5).reduce((sum, row) => sum + row.projectedRecords, 0)).toBe(7156000)
    for (const [bytes, records] of [[120 * GiB, 8300000], [120 * GiB + 1, 8300000], [120 * GiB, 8300001]] as const) {
      const edge = { ...base, costs: costs.map((row, index) => index === 4 ? cost(row, bytes - 80 * GiB, records - 4000000) : row) }
      if (bytes === 120 * GiB && records === 8300000) expect(() => createLeagueCapacityReceipt(edge, allocation)).not.toThrow()
      else expect(() => createLeagueCapacityReceipt(edge, allocation)).toThrow("CAPACITY_MARGIN")
    }
    expect(() => createLeagueCapacityReceipt({ ...input, freeFilesystemBytes: input.freeFilesystemBytes - 1 }, allocation)).toThrow("CAPACITY_MARGIN")
    expect(() => admitLeagueCapacityReceipt(receipt, allocation, { ...context, freeFilesystemBytes: context.freeFilesystemBytes - 1 })).toThrow("CAPACITY_STALE")
    expect(() => createLeagueCapacityReceipt({ ...input, costs: costs.map((row) => row.category === "filesystem" ? cost(row, filesystemBytes + 1, 0) : row) }, allocation)).toThrow("CAPACITY_MARGIN")
    for (const records of [1, -1, 0.5]) expect(() => createLeagueCapacityReceipt({ ...base, costs: costs.map((row) => row.category === "filesystem" ? cost(row, filesystemBytes, records) : row) }, allocation)).toThrow("CAPACITY_CATEGORIES")
    const filesystem = costs[5]!, measuredRecords = { ...filesystem.measurement, measuredRecords: 1 }
    expect(() => createLeagueCapacityReceipt({ ...base, costs: [...costs.slice(0, 5), { ...filesystem, measurement: measuredRecords, measurementRoot: labRoot("league-data-only-capacity-measurement-v1", { category: "filesystem", ...measuredRecords }) }] }, allocation)).toThrow("CAPACITY_MEASUREMENT")
    for (const category of costs.slice(0, 5)) expect(() => createLeagueCapacityReceipt({ ...base, costs: costs.map((row) => row === category ? cost(row, row.projectedBytes, 0) : row) }, allocation)).toThrow("CAPACITY_CATEGORIES")
    expect(() => createLeagueCapacityReceipt({ ...base, costs: [...costs.slice(0, 5), cost(filesystem, 0, 0)] }, allocation)).toThrow("CAPACITY_CATEGORIES")
    expect(() => createLeagueCapacityReceipt({ ...base, costs: [...costs.slice(0, 5), { ...filesystem, measurement: { ...filesystem.measurement, witnessRoots: [] } }] }, allocation)).toThrow("CAPACITY_MEASUREMENT")
  })
  it("binds each downstream producer and exact Sol model before authoring or retained interpretation", () => {
    const allocation = createProspectiveLeagueExecutionAllocation(prospectiveFixture()), jobs = allocation.rounds.flatMap((round) => round.jobs)
    for (const role of allocation.participantRoles) {
      const job = jobs.find((job) => job.id === role.jobId)!, request = { producerIdentity: { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[role.producer], producerInput: role.producer === "model" ? { authoring: { requestedModel: "gpt-5.6-sol" } } : {} }
      expect(() => assertProspectiveLeagueProducerRequest(allocation, job, request)).not.toThrow()
      expect(() => assertProspectiveLeagueProducerRequest(allocation, job, { ...request, producerIdentity: "substitute" })).toThrow("PROSPECTIVE_PRODUCER")
      if (role.producer === "model") expect(() => assertProspectiveLeagueProducerRequest(allocation, job, { ...request, producerInput: { authoring: { requestedModel: "cheaper-substitute" } } })).toThrow("PROSPECTIVE_MODEL")
    }
  })
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
  it("reserves score and both common-reference arms before any producing job", () => {
    const input = allocationFixture(), reservation = { ...zero, matches: 48, effortMilliseconds: 1000 }
    const job = { id: "counter", channel: "automated" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot: root("request"), disclosureArtifactRoot: root("disclosure"), provenanceArtifactRoot: root("provenance"), reviewArtifactRoot: root("review"), participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    const value = { ...input, outputDirectories: { ...input.outputDirectories, responseFactory: "/fixture/factory-response" }, opportunities: { ...input.opportunities, attemptedCandidates: 1 }, channels: input.channels.map((channel) => channel.channel === "automated" ? { ...channel, disposition: "allocated" as const, opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: [job] }, input.rounds[1]!] }
    expect(createLeagueExecutionAllocation(value)).toBeDefined()
    expect(() => createLeagueExecutionAllocation({ ...value, rounds: [{ ...value.rounds[0]!, jobs: [{ ...job, reservation: { ...reservation, matches: 47 } }] }, value.rounds[1]!] })).toThrow("RESPONSE_MATCH_BUDGET")
    expect(() => createLeagueExecutionAllocation({ ...value, independenceReferencePublicationRoot: root("foreign") })).toThrow("INDEPENDENCE_REFERENCE")
    const independent = { ...job, evaluationRole: "independent_probe_opponent" as const }
    expect(() => createLeagueExecutionAllocation({ ...value, rounds: [{ ...value.rounds[0]!, jobs: [independent] }, value.rounds[1]!] })).toThrow("EVALUATION_ORDER")
    expect(createLeagueExecutionAllocation({ ...value, rounds: [{ ...value.rounds[0]!, jobs: [] }, { ...value.rounds[1]!, jobs: [independent] }] })).toBeDefined()
  })
})
