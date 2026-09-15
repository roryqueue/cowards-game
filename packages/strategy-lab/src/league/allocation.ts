import { admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { declareRedTeamAllocation, type RedTeamAllocationInput, type RedTeamChannel, type RedTeamResources } from "./red-team.js"

export interface LeagueResponseJob {
  readonly id: string; readonly channel: RedTeamChannel; readonly operation: "produce" | "unfilled" | "unused"
  readonly producerRequestArtifactRoot: LabRoot; readonly disclosureArtifactRoot: LabRoot; readonly provenanceArtifactRoot: LabRoot; readonly reviewArtifactRoot: LabRoot
  readonly participantId: string; readonly reviewerId: string; readonly reservation: RedTeamResources; readonly retryParentJobId: string | null
}
export interface LeagueExecutionAllocationInput {
  readonly phase: 265; readonly privacy: "private_offline"; readonly evidenceClass: "empirical" | "injected_fixture"; readonly operatorDecision: string
  readonly studyPolicyRoot: LabRoot; readonly measurementPolicyRoot: LabRoot; readonly tupleRoot: LabRoot; readonly runtimeRoot: LabRoot; readonly implementationRoot: LabRoot
  readonly initialCandidatePublicationRoots: readonly LabRoot[]; readonly seedBlocks: readonly string[]
  readonly opportunities: Readonly<{ attemptedCandidates: number; acceptedResponseSlots: number; responseRounds: number; searchEvaluations: number; teacherNodes: number; distillationWorkUnits: number; matches: number; modelAttempts: number; modelTokens: number; humanEffortMinutes: number; humanSubmissions: number; externalEffortMinutes: number; externalSubmissions: number; replayReviewMinutes: number; retryAttempts: number }>
  readonly operations: Readonly<{ wallClockMilliseconds: number; perMatchMilliseconds: number; perProviderInvocations: number; perAttemptMilliseconds: number; maxArtifactBytes: number; maxArtifactRecords: number; maxPopulation: number; cachePolicy: "disabled"; hardwareClass: "2cpu-256m"; image: string; sourceLimitBytes: number; objectiveLimitBytes: number; strategyMemoryLimitBytes: number; soldierMemoryLimitBytes: number; outputLimitBytes: number }>
  readonly retryBurn: Readonly<{ allStartsCharged: true; unknownUsage: "full-reservation"; onIntegrityFailure: "stop"; unusedSlots: "retain-no-refund"; retryCeiling: number }>
  readonly channels: RedTeamAllocationInput["channels"]; readonly probes: RedTeamAllocationInput["probes"]
  readonly rounds: readonly Readonly<{ ordinal: number; acceptedSlots: number; jobs: readonly LeagueResponseJob[] }>[]
  readonly participantPolicy: Readonly<{ disclosure: "complete-source-build-and-dependencies"; review: "distinct-reviewer"; priorExposure: "declared"; conflicts: "reject"; unfilled: "retain"; modelInternalSnapshot: "record-unavailable-no-substitute" }>
}
export type LeagueExecutionAllocation = Readonly<LeagueExecutionAllocationInput & { schemaVersion: "league-execution-allocation-v1"; root: LabRoot }>
const isRoot = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const int = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
const exact = (value: unknown, keys: readonly string[]): boolean => exactLabKeys(value, keys)
function fail(code: string): never { throw new TypeError(`LEAGUE_ALLOCATION_${code}`) }
const opportunityKeys = ["attemptedCandidates", "acceptedResponseSlots", "responseRounds", "searchEvaluations", "teacherNodes", "distillationWorkUnits", "matches", "modelAttempts", "modelTokens", "humanEffortMinutes", "humanSubmissions", "externalEffortMinutes", "externalSubmissions", "replayReviewMinutes", "retryAttempts"] as const
const operationNumbers = ["wallClockMilliseconds", "perMatchMilliseconds", "perProviderInvocations", "perAttemptMilliseconds", "maxArtifactBytes", "maxArtifactRecords", "maxPopulation", "sourceLimitBytes", "objectiveLimitBytes", "strategyMemoryLimitBytes", "soldierMemoryLimitBytes", "outputLimitBytes"] as const
const keys = ["phase", "privacy", "evidenceClass", "operatorDecision", "studyPolicyRoot", "measurementPolicyRoot", "tupleRoot", "runtimeRoot", "implementationRoot", "initialCandidatePublicationRoots", "seedBlocks", "opportunities", "operations", "retryBurn", "channels", "probes", "rounds", "participantPolicy"] as const
const resources = ["matches", "modelTokens", "effortMilliseconds", "reviewMilliseconds", "searchNodes", "teacherNodes", "distillationUnits"] as const

/** Shared dispatch gate: no provider, producer, intake, or directory mutation precedes this validation. */
export const createLeagueExecutionAllocation = (input: LeagueExecutionAllocationInput): Readonly<LeagueExecutionAllocation> => {
  const admitted = admitCanonicalJsonValue(input, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262144 || !exact(input, keys)) fail("DOCUMENT")
  if (input.phase !== 265 || input.privacy !== "private_offline" || !["empirical", "injected_fixture"].includes(input.evidenceClass) || typeof input.operatorDecision !== "string" || !input.operatorDecision.length || input.operatorDecision.length > 1024 || !isRoot(input.implementationRoot) || input.studyPolicyRoot !== LAB_ADMITTED_ROOTS.studyPolicyRoot || input.measurementPolicyRoot !== LAB_ADMITTED_ROOTS.measurementPolicyRoot || input.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || input.runtimeRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) fail("POLICY_BINDING")
  if (!Array.isArray(input.initialCandidatePublicationRoots) || input.initialCandidatePublicationRoots.length < (input.evidenceClass === "empirical" ? 12 : 2) || !input.initialCandidatePublicationRoots.every(isRoot) || new Set(input.initialCandidatePublicationRoots).size !== input.initialCandidatePublicationRoots.length || input.initialCandidatePublicationRoots.join() !== [...input.initialCandidatePublicationRoots].sort().join() || !Array.isArray(input.seedBlocks) || !input.seedBlocks.length || new Set(input.seedBlocks).size !== input.seedBlocks.length || input.seedBlocks.some((value: string) => typeof value !== "string" || !value.length || value.length > 128)) fail("POPULATION_SEEDS")
  const opportunity = input.opportunities, operation = input.operations, burn = input.retryBurn
  if (!exact(opportunity, opportunityKeys) || !opportunityKeys.every((key) => int(opportunity[key])) || opportunity.responseRounds < 2 || !exact(operation, [...operationNumbers, "cachePolicy", "hardwareClass", "image"]) || !operationNumbers.every((key) => int(operation[key]) && operation[key] > 0) || operation.cachePolicy !== "disabled" || operation.hardwareClass !== "2cpu-256m" || operation.image !== LAB_ADMITTED_ROOTS.image || operation.maxPopulation < input.initialCandidatePublicationRoots.length || operation.perMatchMilliseconds > 120000 || operation.perProviderInvocations > 24800 || operation.sourceLimitBytes > 65536 || operation.outputLimitBytes > 262144) fail("DIMENSIONS")
  if (!exact(burn, ["allStartsCharged", "unknownUsage", "onIntegrityFailure", "unusedSlots", "retryCeiling"]) || burn.allStartsCharged !== true || burn.unknownUsage !== "full-reservation" || burn.onIntegrityFailure !== "stop" || burn.unusedSlots !== "retain-no-refund" || !int(burn.retryCeiling) || burn.retryCeiling !== opportunity.retryAttempts) fail("RETRY_BURN")
  const participant = input.participantPolicy
  if (!exact(participant, ["disclosure", "review", "priorExposure", "conflicts", "unfilled", "modelInternalSnapshot"]) || participant.disclosure !== "complete-source-build-and-dependencies" || participant.review !== "distinct-reviewer" || participant.priorExposure !== "declared" || participant.conflicts !== "reject" || participant.unfilled !== "retain" || participant.modelInternalSnapshot !== "record-unavailable-no-substitute") fail("PARTICIPANT_POLICY")
  const redTeam = declareRedTeamAllocation({ phase: 265, evidenceClass: input.evidenceClass, authorityRoot: labRoot("league-prospective-decision-v1", { operatorDecision: input.operatorDecision, implementationRoot: input.implementationRoot }), channels: input.channels, probes: input.probes })
  if (!Array.isArray(input.rounds) || input.rounds.length !== opportunity.responseRounds || input.rounds.some((round, ordinal) => !exact(round, ["ordinal", "acceptedSlots", "jobs"]) || round.ordinal !== ordinal || !int(round.acceptedSlots) || !Array.isArray(round.jobs))) fail("ROUND_SCHEDULE")
  const jobs = input.rounds.flatMap((round) => round.jobs), ids = new Set<string>()
  for (const job of jobs) {
    if (!exact(job, ["id", "channel", "operation", "producerRequestArtifactRoot", "disclosureArtifactRoot", "provenanceArtifactRoot", "reviewArtifactRoot", "participantId", "reviewerId", "reservation", "retryParentJobId"]) || typeof job.id !== "string" || !/^[a-z][a-z0-9-]{0,95}$/u.test(job.id) || ids.has(job.id) || !["produce", "unfilled", "unused"].includes(job.operation) || ![job.producerRequestArtifactRoot, job.disclosureArtifactRoot, job.provenanceArtifactRoot, job.reviewArtifactRoot].every(isRoot) || !exact(job.reservation, resources) || !resources.every((key) => int(job.reservation[key])) || (job.retryParentJobId !== null && !ids.has(job.retryParentJobId))) fail("JOB")
    const channel = redTeam.allocation.channels.find((row) => row.channel === job.channel)
    if (!channel || channel.disposition !== "allocated" || !channel.participants.includes(job.participantId) || !channel.reviewers.includes(job.reviewerId) || job.participantId === job.reviewerId || resources.some((key) => job.reservation[key] > channel.perAttempt[key]) || job.reservation.effortMilliseconds > operation.perAttemptMilliseconds) fail("JOB_POLICY")
    ids.add(job.id)
  }
  for (const channel of redTeam.allocation.channels) {
    const selected = jobs.filter((job) => job.channel === channel.channel)
    if (selected.length !== channel.opportunities || selected.filter((job) => job.retryParentJobId !== null).length > channel.retryLimit || resources.some((key) => selected.reduce((sum, job) => sum + job.reservation[key], 0) > channel.ceilings[key])) fail("CHANNEL_SCHEDULE")
  }
  const produced = jobs.filter((job) => job.operation === "produce"), total = (key: keyof RedTeamResources) => jobs.reduce((sum, job) => sum + job.reservation[key], 0)
  if (produced.length > opportunity.attemptedCandidates || input.rounds.reduce((sum, round) => sum + round.acceptedSlots, 0) !== opportunity.acceptedResponseSlots || input.initialCandidatePublicationRoots.length + opportunity.acceptedResponseSlots > operation.maxPopulation || jobs.filter((job) => job.channel === "model" && job.operation === "produce").length > opportunity.modelAttempts || total("modelTokens") > opportunity.modelTokens || total("searchNodes") > opportunity.searchEvaluations || total("teacherNodes") > opportunity.teacherNodes || total("distillationUnits") > opportunity.distillationWorkUnits || total("reviewMilliseconds") > opportunity.replayReviewMinutes * 60000 || jobs.filter((job) => job.retryParentJobId !== null).length > opportunity.retryAttempts) fail("TOTAL_BUDGET")
  for (const channel of ["human", "external"] as const) {
    const rows = jobs.filter((job) => job.channel === channel)
    if (rows.filter((job) => job.operation === "produce").length > opportunity[channel === "human" ? "humanSubmissions" : "externalSubmissions"] || rows.reduce((sum, job) => sum + job.reservation.effortMilliseconds, 0) > opportunity[channel === "human" ? "humanEffortMinutes" : "externalEffortMinutes"] * 60000) fail("PARTICIPANT_BUDGET")
  }
  const population = operation.maxPopulation, matrixCells = 8 * population * (population - 1) / 2, probeMatches = population * input.probes.reduce((sum, probe) => sum + probe.pairs * 2, 0)
  if (opportunity.matches < input.seedBlocks.length * (matrixCells * (opportunity.acceptedResponseSlots + 1) + probeMatches * opportunity.responseRounds) + total("matches")) fail("MATCH_COVERAGE_BUDGET")
  const value = { schemaVersion: "league-execution-allocation-v1" as const, ...input }
  return freezeLabValue({ ...value, root: labRoot("league-execution-allocation-v1", value) })
}

export const admitLeagueExecutionAllocation = (value: unknown, evidenceClass?: "empirical" | "injected_fixture"): Readonly<LeagueExecutionAllocation> => {
  if (!exact(value, ["schemaVersion", "root", ...keys])) fail("ENVELOPE")
  const { root, schemaVersion, ...body } = value as LeagueExecutionAllocation
  const admitted = createLeagueExecutionAllocation(body)
  if (root !== admitted.root || schemaVersion !== admitted.schemaVersion || (evidenceClass !== undefined && admitted.evidenceClass !== evidenceClass)) fail("IDENTITY")
  return admitted
}
