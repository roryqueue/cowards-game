import { admitCanonicalJsonValue, DEFAULT_RUNTIME_LIMITS } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { declareRedTeamAllocation, type RedTeamAllocationInput, type RedTeamChannel, type RedTeamResources } from "./red-team.js"
import { LEAGUE_PROBES } from "./probes.js"

export interface LeagueResponseJob {
  readonly id: string; readonly channel: RedTeamChannel; readonly operation: "produce" | "unfilled" | "unused"
  readonly evaluationRole: "development_response" | "validation_opponent" | "independent_probe_opponent"
  readonly producerRequestArtifactRoot: LabRoot; readonly disclosureArtifactRoot: LabRoot; readonly provenanceArtifactRoot: LabRoot; readonly reviewArtifactRoot: LabRoot
  readonly participantId: string; readonly reviewerId: string; readonly reservation: RedTeamResources; readonly retryParentJobId: string | null
}
export interface LeagueExecutionAllocationInput {
  readonly phase: 265; readonly privacy: "private_offline"; readonly evidenceClass: "empirical" | "injected_fixture"; readonly operatorDecision: string
  readonly studyPolicyRoot: LabRoot; readonly measurementPolicyRoot: LabRoot; readonly tupleRoot: LabRoot; readonly runtimeRoot: LabRoot; readonly implementationRoot: LabRoot
  readonly initialCandidatePublicationRoots: readonly LabRoot[]; readonly factoryAssessmentArtifactRoots: readonly LabRoot[]; readonly independenceReferencePublicationRoot: LabRoot; readonly seedBlocks: readonly string[]
  readonly outputDirectories: Readonly<{ league: string; responseFactory: string | null }>
  readonly opportunities: Readonly<{ attemptedCandidates: number; acceptedResponseSlots: number; responseRounds: number; searchEvaluations: number; teacherNodes: number; distillationWorkUnits: number; matches: number; modelAttempts: number; modelTokens: number; humanEffortMinutes: number; humanSubmissions: number; externalEffortMinutes: number; externalSubmissions: number; replayReviewMinutes: number; retryAttempts: number }>
  readonly operations: Readonly<{ wallClockMilliseconds: number; perMatchMilliseconds: number; perProviderInvocations: number; perAttemptMilliseconds: number; maxArtifactBytes: number; maxArtifactRecords: number; terminalReserveBytes: number; terminalReserveRecords: number; maxPopulation: number; cachePolicy: "disabled"; hardwareClass: "2cpu-256m"; image: string; sourceLimitBytes: number; objectiveLimitBytes: number; strategyMemoryLimitBytes: number; soldierMemoryLimitBytes: number; outputLimitBytes: number }>
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
const operationNumbers = ["wallClockMilliseconds", "perMatchMilliseconds", "perProviderInvocations", "perAttemptMilliseconds", "maxArtifactBytes", "maxArtifactRecords", "terminalReserveBytes", "terminalReserveRecords", "maxPopulation", "sourceLimitBytes", "objectiveLimitBytes", "strategyMemoryLimitBytes", "soldierMemoryLimitBytes", "outputLimitBytes"] as const
const keys = ["phase", "privacy", "evidenceClass", "operatorDecision", "studyPolicyRoot", "measurementPolicyRoot", "tupleRoot", "runtimeRoot", "implementationRoot", "initialCandidatePublicationRoots", "factoryAssessmentArtifactRoots", "independenceReferencePublicationRoot", "seedBlocks", "outputDirectories", "opportunities", "operations", "retryBurn", "channels", "probes", "rounds", "participantPolicy"] as const
const resources = ["matches", "modelTokens", "effortMilliseconds", "reviewMilliseconds", "searchNodes", "teacherNodes", "distillationUnits"] as const

/** Shared dispatch gate: no provider, producer, intake, or directory mutation precedes this validation. */
const createAllocationV1Shape = (input: LeagueExecutionAllocationInput, empiricalMinimum = 12): Readonly<LeagueExecutionAllocation> => {
  const admitted = admitCanonicalJsonValue(input, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262144 || !exact(input, keys)) fail("DOCUMENT")
  if (input.phase !== 265 || input.privacy !== "private_offline" || !["empirical", "injected_fixture"].includes(input.evidenceClass) || typeof input.operatorDecision !== "string" || !input.operatorDecision.length || input.operatorDecision.length > 1024 || !isRoot(input.implementationRoot) || input.studyPolicyRoot !== LAB_ADMITTED_ROOTS.studyPolicyRoot || input.measurementPolicyRoot !== LAB_ADMITTED_ROOTS.measurementPolicyRoot || input.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || input.runtimeRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) fail("POLICY_BINDING")
  if (!Array.isArray(input.factoryAssessmentArtifactRoots) || !input.factoryAssessmentArtifactRoots.length || !input.factoryAssessmentArtifactRoots.every(isRoot) || new Set(input.factoryAssessmentArtifactRoots).size !== input.factoryAssessmentArtifactRoots.length || input.factoryAssessmentArtifactRoots.join() !== [...input.factoryAssessmentArtifactRoots].sort().join()) fail("MEASUREMENT_IMPORT_ROOTS")
  if (!Array.isArray(input.initialCandidatePublicationRoots) || input.initialCandidatePublicationRoots.length < (input.evidenceClass === "empirical" ? empiricalMinimum : 2) || !input.initialCandidatePublicationRoots.every(isRoot) || new Set(input.initialCandidatePublicationRoots).size !== input.initialCandidatePublicationRoots.length || input.initialCandidatePublicationRoots.join() !== [...input.initialCandidatePublicationRoots].sort().join() || !Array.isArray(input.seedBlocks) || !input.seedBlocks.length || new Set(input.seedBlocks).size !== input.seedBlocks.length || input.seedBlocks.some((value: string) => typeof value !== "string" || !value.length || value.length > 128)) fail("POPULATION_SEEDS")
  const opportunity = input.opportunities, operation = input.operations, burn = input.retryBurn
  if (!isRoot(input.independenceReferencePublicationRoot) || !input.initialCandidatePublicationRoots.includes(input.independenceReferencePublicationRoot)) fail("INDEPENDENCE_REFERENCE")
  if (!exact(opportunity, opportunityKeys) || !opportunityKeys.every((key) => int(opportunity[key])) || opportunity.responseRounds < 2 || !exact(operation, [...operationNumbers, "cachePolicy", "hardwareClass", "image"]) || !operationNumbers.every((key) => int(operation[key]) && operation[key] > 0) || operation.cachePolicy !== "disabled" || operation.hardwareClass !== "2cpu-256m" || operation.image !== LAB_ADMITTED_ROOTS.image || operation.maxPopulation < input.initialCandidatePublicationRoots.length || operation.perMatchMilliseconds > 120000 || operation.perProviderInvocations > 24800 || operation.sourceLimitBytes > 65536 || operation.outputLimitBytes > 262144) fail("DIMENSIONS")
  if (operation.sourceLimitBytes !== DEFAULT_RUNTIME_LIMITS.sourceBytes || operation.objectiveLimitBytes !== DEFAULT_RUNTIME_LIMITS.objectivePayloadBytes || operation.strategyMemoryLimitBytes !== DEFAULT_RUNTIME_LIMITS.strategyMemoryBytes || operation.soldierMemoryLimitBytes !== DEFAULT_RUNTIME_LIMITS.soldierMemoryBytes || operation.outputLimitBytes !== DEFAULT_RUNTIME_LIMITS.stdoutBytes) fail("RUNTIME_LIMIT_DRIFT")
  // Six bounded failure/cleanup envelopes and their chunk/descriptor records
  // must remain available before any charged dispatch.
  if (operation.terminalReserveBytes < 6 * 262144 || operation.terminalReserveRecords < 24 || operation.terminalReserveBytes >= operation.maxArtifactBytes || operation.terminalReserveRecords >= operation.maxArtifactRecords) fail("TERMINAL_RESERVE")
  if (!exact(burn, ["allStartsCharged", "unknownUsage", "onIntegrityFailure", "unusedSlots", "retryCeiling"]) || burn.allStartsCharged !== true || burn.unknownUsage !== "full-reservation" || burn.onIntegrityFailure !== "stop" || burn.unusedSlots !== "retain-no-refund" || !int(burn.retryCeiling) || burn.retryCeiling !== opportunity.retryAttempts) fail("RETRY_BURN")
  const participant = input.participantPolicy
  if (!exact(participant, ["disclosure", "review", "priorExposure", "conflicts", "unfilled", "modelInternalSnapshot"]) || participant.disclosure !== "complete-source-build-and-dependencies" || participant.review !== "distinct-reviewer" || participant.priorExposure !== "declared" || participant.conflicts !== "reject" || participant.unfilled !== "retain" || participant.modelInternalSnapshot !== "record-unavailable-no-substitute") fail("PARTICIPANT_POLICY")
  const redTeam = declareRedTeamAllocation({ phase: 265, evidenceClass: input.evidenceClass, authorityRoot: labRoot("league-prospective-decision-v1", { operatorDecision: input.operatorDecision, implementationRoot: input.implementationRoot }), channels: input.channels, probes: input.probes })
  if (!Array.isArray(input.rounds) || input.rounds.length !== opportunity.responseRounds || input.rounds.some((round, ordinal) => !exact(round, ["ordinal", "acceptedSlots", "jobs"]) || round.ordinal !== ordinal || !int(round.acceptedSlots) || !Array.isArray(round.jobs))) fail("ROUND_SCHEDULE")
  const jobs = input.rounds.flatMap((round) => round.jobs), ids = new Set<string>()
  const directory = (value: unknown, prefix: string) => typeof value === "string" && value.startsWith("/") && !value.includes("\0") && value.length < 4096 && value.split("/").slice(1).every((part) => part !== "" && part !== "." && part !== "..") && value.split("/").at(-1)!.startsWith(prefix)
  if (!exact(input.outputDirectories, ["league", "responseFactory"]) || !directory(input.outputDirectories.league, "league-") || (jobs.length ? !directory(input.outputDirectories.responseFactory, "factory-") : input.outputDirectories.responseFactory !== null)) fail("OUTPUT_BINDING")
  for (const job of jobs) {
    if (!exact(job, ["id", "channel", "operation", "evaluationRole", "producerRequestArtifactRoot", "disclosureArtifactRoot", "provenanceArtifactRoot", "reviewArtifactRoot", "participantId", "reviewerId", "reservation", "retryParentJobId"]) || typeof job.id !== "string" || !/^[a-z][a-z0-9-]{0,95}$/u.test(job.id) || ids.has(job.id) || !["produce", "unfilled", "unused"].includes(job.operation) || !["development_response", "validation_opponent", "independent_probe_opponent"].includes(job.evaluationRole) || ![job.producerRequestArtifactRoot, job.disclosureArtifactRoot, job.provenanceArtifactRoot, job.reviewArtifactRoot].every(isRoot) || !exact(job.reservation, resources) || !resources.every((key) => int(job.reservation[key])) || (job.retryParentJobId !== null && !ids.has(job.retryParentJobId))) fail("JOB")
    const channel = redTeam.allocation.channels.find((row) => row.channel === job.channel)
    if (!channel || channel.disposition !== "allocated" || !channel.participants.includes(job.participantId) || !channel.reviewers.includes(job.reviewerId) || job.participantId === job.reviewerId || resources.some((key) => job.reservation[key] > channel.perAttempt[key]) || job.reservation.effortMilliseconds > operation.perAttemptMilliseconds) fail("JOB_POLICY")
    // Eight score cells and two eight-cell common-reference arms per opponent
    // and seed. This reservation is required before authoring, not inferred
    // from whichever population happens to exist when the job is dispatched.
    if (job.operation === "produce" && job.reservation.matches < 24 * operation.maxPopulation * input.seedBlocks.length) fail("RESPONSE_MATCH_BUDGET")
    ids.add(job.id)
  }
  for (const round of input.rounds) {
    let evaluation = false
    for (const job of round.jobs) { if (job.evaluationRole !== "development_response") { evaluation = true; if (round.ordinal !== input.rounds.length - 1) fail("EVALUATION_ORDER") } else if (evaluation) fail("EVALUATION_ORDER") }
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

/** Historical exact-key V1 and its twelve-import empirical guard are unchanged. */
export const createLeagueExecutionAllocation = (input: LeagueExecutionAllocationInput): Readonly<LeagueExecutionAllocation> => createAllocationV1Shape(input)

export const admitLeagueExecutionAllocation = (value: unknown, evidenceClass?: "empirical" | "injected_fixture"): Readonly<LeagueExecutionAllocation> => {
  if (!exact(value, ["schemaVersion", "root", ...keys])) fail("ENVELOPE")
  const { root, schemaVersion, ...body } = value as LeagueExecutionAllocation
  const admitted = createLeagueExecutionAllocation(body)
  if (root !== admitted.root || schemaVersion !== admitted.schemaVersion || (evidenceClass !== undefined && admitted.evidenceClass !== evidenceClass)) fail("IDENTITY")
  return admitted
}

const GiB = 2 ** 30
const equal = (a: unknown, b: unknown) => labRoot("league-allocation-comparison-v1", a) === labRoot("league-allocation-comparison-v1", b)
const boundedDocument = (input: unknown, fields: readonly string[]) => {
  const admitted = admitCanonicalJsonValue(input, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262144 || !exact(input, fields)) fail("PROSPECTIVE_DOCUMENT")
}
/** These are constraints, never input defaults. Every value must be supplied. */
export const LEAGUE_APPROVED_PROSPECTIVE_POLICY = freezeLabValue({
  initialPopulation: 3, seedBlocks: 1, acceptedSlots: [3, 3, 3, 0],
  schedule: [["tactical", "teacher", "model"], ["tactical", "model", "model"], ["tactical", "teacher", "model"], ["teacher", "model"]] as readonly (readonly ("tactical" | "teacher" | "model")[])[],
  model: "gpt-5.6-sol", modelTokensPerAttempt: 48000,
  opportunities: { attemptedCandidates: 11, acceptedResponseSlots: 9, responseRounds: 4, searchEvaluations: 300, teacherNodes: 300, distillationWorkUnits: 6, matches: 11328, modelAttempts: 5, modelTokens: 240000, humanEffortMinutes: 0, humanSubmissions: 0, externalEffortMinutes: 0, externalSubmissions: 0, replayReviewMinutes: 165, retryAttempts: 0 },
  operations: { wallClockMilliseconds: 96 * 3600000, perMatchMilliseconds: 120000, perProviderInvocations: 24800, perAttemptMilliseconds: 18 * 3600000, maxArtifactBytes: 150 * GiB, maxArtifactRecords: 9000000, terminalReserveBytes: 20 * GiB, terminalReserveRecords: 200000, maxPopulation: 12, cachePolicy: "disabled" as const, hardwareClass: "2cpu-256m" as const, image: LAB_ADMITTED_ROOTS.image, sourceLimitBytes: DEFAULT_RUNTIME_LIMITS.sourceBytes, objectiveLimitBytes: DEFAULT_RUNTIME_LIMITS.objectivePayloadBytes, strategyMemoryLimitBytes: DEFAULT_RUNTIME_LIMITS.strategyMemoryBytes, soldierMemoryLimitBytes: DEFAULT_RUNTIME_LIMITS.soldierMemoryBytes, outputLimitBytes: DEFAULT_RUNTIME_LIMITS.stdoutBytes },
  probes: LEAGUE_PROBES.map((family) => ({ family, pairs: ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(family) ? 2 : 4, maximumAbsoluteMeanDelta: ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(family) ? null : { numerator: 1, denominator: 8 } })),
  finalGates: { population: 12, behavioralFamilies: 6, independentCores: 5, finalists: 3, completeMatrices: true, responseStrength: "unchanged", invariance: "unchanged", noFinalist: "retain", fullKernel: true, allStartsCharged: true, privateOnly: true, formation: false, holdout: false, public: false, counted: false, production: false },
  capacity: { schemaVersion: "league-capacity-receipt-v1", formula: "six-category-scale-plus-terminal-reserve-v1", ordinaryMarginBytes: 10 * GiB, ordinaryMarginRecords: 500000, freeFilesystemMarginBytes: 20 * GiB, maximumReceiptAgeMilliseconds: 300000 },
})
export interface LeagueProspectiveAmendmentInput {
  readonly phase: 265; readonly privacy: "private_offline"; readonly evidenceClass: "empirical" | "injected_fixture"; readonly approvalCommit: "06cdb050"
  readonly implementationRoot: LabRoot; readonly sourceRoot: LabRoot
  readonly historicalAssessment: Readonly<{ artifactRoot: LabRoot; assessmentRoot: LabRoot; thresholdArtifactRoot: LabRoot; producerImplementationRoot: LabRoot; assessmentImplementationRoot: LabRoot }>
  readonly bases: readonly Readonly<{ sourceSlot: "S01" | "S03" | "S05"; publicationArtifactRoot: LabRoot; candidateAdmissionRoot: LabRoot; sourceRoot: LabRoot; supervisionArtifactRoot: LabRoot }>[]
  readonly controls: "comparison-only-excluded"; readonly policy: typeof LEAGUE_APPROVED_PROSPECTIVE_POLICY
}
export type LeagueProspectiveAmendment = Readonly<LeagueProspectiveAmendmentInput & { schemaVersion: "league-prospective-measurement-amendment-v1"; root: LabRoot }>
const amendmentKeys = ["phase", "privacy", "evidenceClass", "approvalCommit", "implementationRoot", "sourceRoot", "historicalAssessment", "bases", "controls", "policy"] as const
export const createLeagueProspectiveAmendment = (input: LeagueProspectiveAmendmentInput): LeagueProspectiveAmendment => {
  boundedDocument(input, amendmentKeys)
  if (input.phase !== 265 || input.privacy !== "private_offline" || !["empirical", "injected_fixture"].includes(input.evidenceClass) || input.approvalCommit !== "06cdb050" || !isRoot(input.implementationRoot) || !isRoot(input.sourceRoot) || input.controls !== "comparison-only-excluded" || !equal(input.policy, LEAGUE_APPROVED_PROSPECTIVE_POLICY)) fail("PROSPECTIVE_POLICY")
  const historical = input.historicalAssessment
  if (!exact(historical, ["artifactRoot", "assessmentRoot", "thresholdArtifactRoot", "producerImplementationRoot", "assessmentImplementationRoot"]) || !Object.values(historical).every(isRoot)) fail("PROSPECTIVE_HISTORY")
  // Exact approved retained assessment, not a similarly labelled substitute.
  if (input.evidenceClass === "empirical" && !equal(historical, {
    artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8", assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1", thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72", producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b", assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c",
  })) fail("PROSPECTIVE_HISTORY")
  if (!Array.isArray(input.bases) || input.bases.length !== 3 || input.bases.some((base, index) => !exact(base, ["sourceSlot", "publicationArtifactRoot", "candidateAdmissionRoot", "sourceRoot", "supervisionArtifactRoot"]) || base.sourceSlot !== ["S01", "S03", "S05"][index] || ![base.publicationArtifactRoot, base.candidateAdmissionRoot, base.sourceRoot, base.supervisionArtifactRoot].every(isRoot)) || ["publicationArtifactRoot", "candidateAdmissionRoot", "sourceRoot", "supervisionArtifactRoot"].some((key) => new Set(input.bases.map((base) => base[key as keyof typeof base])).size !== 3)) fail("PROSPECTIVE_BASES")
  const value = { schemaVersion: "league-prospective-measurement-amendment-v1" as const, ...input }
  return freezeLabValue({ ...value, root: labRoot(value.schemaVersion, value) })
}
export const admitLeagueProspectiveAmendment = (value: unknown): LeagueProspectiveAmendment => {
  boundedDocument(value, ["schemaVersion", "root", ...amendmentKeys])
  const { root, schemaVersion, ...input } = value as LeagueProspectiveAmendment, admitted = createLeagueProspectiveAmendment(input)
  if (root !== admitted.root || schemaVersion !== admitted.schemaVersion) fail("PROSPECTIVE_IDENTITY")
  return admitted
}
export interface ProspectiveLeagueExecutionAllocationInput extends LeagueExecutionAllocationInput {
  readonly amendment: LeagueProspectiveAmendment
  readonly participantRoles: readonly Readonly<{ jobId: string; producer: "tactical" | "teacher" | "model"; authorAgentId: string; reviewerAgentId: string }>[]
}
export type ProspectiveLeagueExecutionAllocation = Readonly<ProspectiveLeagueExecutionAllocationInput & { schemaVersion: "league-prospective-execution-allocation-v1"; root: LabRoot }>
export type AdmittedLeagueExecutionAllocation = LeagueExecutionAllocation | ProspectiveLeagueExecutionAllocation
export const createProspectiveLeagueExecutionAllocation = (input: ProspectiveLeagueExecutionAllocationInput): ProspectiveLeagueExecutionAllocation => {
  boundedDocument(input, [...keys, "amendment", "participantRoles"])
  const amendment = admitLeagueProspectiveAmendment(input.amendment), { amendment: _amendment, participantRoles, ...legacyShape } = input
  createAllocationV1Shape(legacyShape, 3)
  const policy = amendment.policy, jobs = input.rounds.flatMap((round) => round.jobs), producers = policy.schedule.flat()
  if (amendment.evidenceClass !== input.evidenceClass || amendment.implementationRoot !== input.implementationRoot || !equal(input.initialCandidatePublicationRoots, amendment.bases.map((base) => base.publicationArtifactRoot).sort()) || !equal(input.factoryAssessmentArtifactRoots, [amendment.historicalAssessment.artifactRoot]) || input.seedBlocks.length !== 1 || !equal(input.opportunities, policy.opportunities) || !equal(input.operations, policy.operations) || !equal(input.probes, policy.probes) || !equal(input.rounds.map((round) => round.acceptedSlots), policy.acceptedSlots) || !equal(input.rounds.map((round) => round.jobs.length), policy.schedule.map((row) => row.length))) fail("PROSPECTIVE_VECTOR")
  if (!Array.isArray(participantRoles) || participantRoles.length !== 11) fail("PROSPECTIVE_ROLES")
  const identity = (value: unknown) => typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 256
  for (const [index, job] of jobs.entries()) {
    const producer = producers[index]!, role = participantRoles[index]!, expected = { matches: 288, modelTokens: producer === "model" ? 48000 : 0, effortMilliseconds: 64800000, reviewMilliseconds: 900000, searchNodes: producer === "tactical" ? 100 : 0, teacherNodes: producer === "teacher" ? 100 : 0, distillationUnits: producer === "teacher" ? 2 : 0 }
    if (!exact(role, ["jobId", "producer", "authorAgentId", "reviewerAgentId"]) || role.jobId !== job.id || role.producer !== producer || !identity(role.authorAgentId) || !identity(role.reviewerAgentId) || role.authorAgentId === role.reviewerAgentId || job.participantId !== `${job.id}-author` || job.reviewerId !== `${job.id}-reviewer` || job.operation !== "produce" || job.retryParentJobId !== null || job.channel !== (producer === "model" ? "model" : "automated") || job.evaluationRole !== (index < 9 ? "development_response" : producer === "teacher" ? "validation_opponent" : "independent_probe_opponent") || !equal(job.reservation, expected)) fail("PROSPECTIVE_JOB")
  }
  if (participantRoles.some((role) => participantRoles.some((other) => role.authorAgentId === other.reviewerAgentId))) fail("PROSPECTIVE_ROLE_CONFLICT")
  for (const channel of input.channels) {
    const selected = jobs.filter((job) => job.channel === channel.channel), sum = Object.fromEntries(resources.map((key) => [key, selected.reduce((total, job) => total + job.reservation[key], 0)])), perAttempt = Object.fromEntries(resources.map((key) => [key, Math.max(0, ...selected.map((job) => job.reservation[key]))]))
    if (channel.disposition !== (selected.length ? "allocated" : "authorized_zero") || channel.retryLimit !== 0 || channel.opportunities !== selected.length || !equal(channel.ceilings, sum) || !equal(channel.perAttempt, perAttempt) || !equal(channel.participants, selected.map((job) => job.participantId).sort()) || !equal(channel.reviewers, selected.map((job) => job.reviewerId).sort())) fail("PROSPECTIVE_CHANNEL")
  }
  const value = { schemaVersion: "league-prospective-execution-allocation-v1" as const, ...input }
  return freezeLabValue({ ...value, root: labRoot(value.schemaVersion, value) })
}
export const admitProspectiveLeagueExecutionAllocation = (value: unknown): ProspectiveLeagueExecutionAllocation => {
  boundedDocument(value, ["schemaVersion", "root", ...keys, "amendment", "participantRoles"])
  const { root, schemaVersion, ...body } = value as ProspectiveLeagueExecutionAllocation, admitted = createProspectiveLeagueExecutionAllocation(body)
  if (root !== admitted.root || schemaVersion !== admitted.schemaVersion) fail("PROSPECTIVE_IDENTITY")
  return admitted
}
/** Union reader for private consumers; the legacy exported admission stays V1-only. */
export const admitAnyLeagueExecutionAllocation = (value: unknown): AdmittedLeagueExecutionAllocation => value && typeof value === "object" && "schemaVersion" in value && value.schemaVersion === "league-prospective-execution-allocation-v1" ? admitProspectiveLeagueExecutionAllocation(value) : admitLeagueExecutionAllocation(value)

/** Reused by preflight and retained producer readers; no source or provider is executed. */
export const assertProspectiveLeagueProducerRequest = (allocation: AdmittedLeagueExecutionAllocation, job: LeagueResponseJob, request: { producerIdentity?: unknown; producerInput?: unknown }) => {
  if (allocation.schemaVersion !== "league-prospective-execution-allocation-v1") return
  const role = allocation.participantRoles.find((role) => role.jobId === job.id) ?? fail("PROSPECTIVE_JOB")
  if (request.producerIdentity !== { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[role.producer]) fail("PROSPECTIVE_PRODUCER")
  if (role.producer === "model" && (request.producerInput as { authoring?: { requestedModel?: unknown } } | undefined)?.authoring?.requestedModel !== allocation.amendment.policy.model) fail("PROSPECTIVE_MODEL")
}

export const LEAGUE_CAPACITY_CATEGORIES = ["invocation", "execution", "factory_supervision", "descriptor", "journal", "filesystem"] as const
export interface LeagueCapacityReceiptInput {
  readonly allocationRoot: LabRoot; readonly amendmentRoot: LabRoot; readonly implementationRoot: LabRoot; readonly sourceRoot: LabRoot; readonly historicalAssessmentRoot: LabRoot
  readonly measuredAtMilliseconds: number; readonly expiresAtMilliseconds: number; readonly filesystemDevice: string; readonly freeFilesystemBytes: number; readonly availableMemoryBytes: number; readonly processHeadroomBytes: number
  readonly scale: Readonly<{ matrixMatches: 960; probeMatches: 1800; responseMatches: 1872; responseExecutionCopies: 2 }>
  readonly costs: readonly Readonly<{ category: typeof LEAGUE_CAPACITY_CATEGORIES[number]; projectedBytes: number; projectedRecords: number; measurementRoot: LabRoot; measurement: Readonly<{ sourceRoot: LabRoot; witnessRoots: readonly LabRoot[]; sampleUnits: number; measuredBytes: number; measuredRecords: number; projectedUnits: number }> }>[]
  readonly assumptions: readonly string[]
}
export type LeagueCapacityReceipt = Readonly<LeagueCapacityReceiptInput & { schemaVersion: "league-capacity-receipt-v1"; root: LabRoot }>
export interface LeagueCapacityContext { readonly nowMilliseconds: number; readonly implementationRoot: LabRoot; readonly sourceRoot: LabRoot; readonly filesystemDevice: string; readonly freeFilesystemBytes: number; readonly availableMemoryBytes: number }
const capacityKeys = ["allocationRoot", "amendmentRoot", "implementationRoot", "sourceRoot", "historicalAssessmentRoot", "measuredAtMilliseconds", "expiresAtMilliseconds", "filesystemDevice", "freeFilesystemBytes", "availableMemoryBytes", "processHeadroomBytes", "scale", "costs", "assumptions"] as const
export const createLeagueCapacityReceipt = (input: LeagueCapacityReceiptInput, value: ProspectiveLeagueExecutionAllocation): LeagueCapacityReceipt => {
  const allocation = admitProspectiveLeagueExecutionAllocation(value), amendment = allocation.amendment
  boundedDocument(input, capacityKeys)
  if (input.allocationRoot !== allocation.root || input.amendmentRoot !== amendment.root || input.implementationRoot !== allocation.implementationRoot || input.sourceRoot !== amendment.sourceRoot || input.historicalAssessmentRoot !== amendment.historicalAssessment.assessmentRoot) fail("CAPACITY_BINDING")
  if (![input.measuredAtMilliseconds, input.expiresAtMilliseconds, input.freeFilesystemBytes, input.availableMemoryBytes, input.processHeadroomBytes].every(int) || input.processHeadroomBytes < 1 || input.processHeadroomBytes > input.availableMemoryBytes || input.expiresAtMilliseconds <= input.measuredAtMilliseconds || input.expiresAtMilliseconds - input.measuredAtMilliseconds > amendment.policy.capacity.maximumReceiptAgeMilliseconds || typeof input.filesystemDevice !== "string" || !input.filesystemDevice.length || input.filesystemDevice.length > 256) fail("CAPACITY_OBSERVATION")
  if (!equal(input.scale, { matrixMatches: 960, probeMatches: 1800, responseMatches: 1872, responseExecutionCopies: 2 }) || !Array.isArray(input.assumptions) || !input.assumptions.length || input.assumptions.some((row) => typeof row !== "string" || !row.trim().length || row.length > 4096)) fail("CAPACITY_SCALE")
  if (!Array.isArray(input.costs) || input.costs.length !== 6 || input.costs.some((row, index) => !exact(row, ["category", "projectedBytes", "projectedRecords", "measurementRoot", "measurement"]) || row.category !== LEAGUE_CAPACITY_CATEGORIES[index] || !int(row.projectedBytes) || row.projectedBytes < 1 || !int(row.projectedRecords) || row.projectedRecords < 1 || !isRoot(row.measurementRoot))) fail("CAPACITY_CATEGORIES")
  for (const [index, row] of input.costs.entries()) {
    const m = row.measurement
    // First two samples are per Match; factory retention has two copies per
    // response Match. Descriptor/journal/filesystem estimates cover the run.
    const projectedUnits = [4632, 4632, 3744, 1, 1, 1][index]
    if (!exact(m, ["sourceRoot", "witnessRoots", "sampleUnits", "measuredBytes", "measuredRecords", "projectedUnits"]) || m.sourceRoot !== input.sourceRoot || !Array.isArray(m.witnessRoots) || !m.witnessRoots.length || !m.witnessRoots.every(isRoot) || new Set(m.witnessRoots).size !== m.witnessRoots.length || ![m.sampleUnits, m.measuredBytes, m.measuredRecords, m.projectedUnits].every((v) => int(v) && v > 0) || m.projectedUnits !== projectedUnits || row.measurementRoot !== labRoot("league-data-only-capacity-measurement-v1", { category: row.category, ...m })) fail("CAPACITY_MEASUREMENT")
    const scaled = (value: number) => (BigInt(value) * BigInt(m.projectedUnits) + BigInt(m.sampleUnits) - 1n) / BigInt(m.sampleUnits)
    if (BigInt(row.projectedBytes) !== scaled(m.measuredBytes) || BigInt(row.projectedRecords) !== scaled(m.measuredRecords)) fail("CAPACITY_ESTIMATE")
  }
  const bytes = input.costs.reduce((sum, row) => sum + row.projectedBytes, 0), records = input.costs.reduce((sum, row) => sum + row.projectedRecords, 0), limits = allocation.operations, margins = amendment.policy.capacity
  if (!int(bytes) || !int(records) || bytes + margins.ordinaryMarginBytes > limits.maxArtifactBytes - limits.terminalReserveBytes || records + margins.ordinaryMarginRecords > limits.maxArtifactRecords - limits.terminalReserveRecords || input.freeFilesystemBytes - bytes - limits.terminalReserveBytes < margins.freeFilesystemMarginBytes) fail("CAPACITY_MARGIN")
  const body = { schemaVersion: "league-capacity-receipt-v1" as const, ...input }
  return freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
}
export const admitLeagueCapacityReceipt = (value: unknown, allocation: ProspectiveLeagueExecutionAllocation, current: LeagueCapacityContext): LeagueCapacityReceipt => {
  boundedDocument(value, ["schemaVersion", "root", ...capacityKeys])
  const { root, schemaVersion, ...body } = value as LeagueCapacityReceipt, receipt = createLeagueCapacityReceipt(body, allocation)
  if (receipt.root !== root || receipt.schemaVersion !== schemaVersion) fail("CAPACITY_IDENTITY")
  if (!exact(current, ["nowMilliseconds", "implementationRoot", "sourceRoot", "filesystemDevice", "freeFilesystemBytes", "availableMemoryBytes"]) || !int(current.nowMilliseconds) || current.nowMilliseconds < receipt.measuredAtMilliseconds || current.nowMilliseconds > receipt.expiresAtMilliseconds || current.implementationRoot !== receipt.implementationRoot || current.sourceRoot !== receipt.sourceRoot || current.filesystemDevice !== receipt.filesystemDevice || !int(current.freeFilesystemBytes) || current.freeFilesystemBytes - receipt.costs.reduce((sum, row) => sum + row.projectedBytes, 0) - allocation.operations.terminalReserveBytes < allocation.amendment.policy.capacity.freeFilesystemMarginBytes || !int(current.availableMemoryBytes) || current.availableMemoryBytes < receipt.processHeadroomBytes) fail("CAPACITY_STALE")
  return receipt
}
