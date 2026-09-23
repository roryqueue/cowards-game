import { readFileSync, realpathSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { createLeagueProspectiveAmendment, createProspectiveLeagueExecutionAllocation, LEAGUE_APPROVED_PROSPECTIVE_POLICY, type LeagueProspectiveAmendmentInput, type ProspectiveLeagueExecutionAllocationInput } from "../../packages/strategy-lab/src/league/allocation.js"
import { RED_TEAM_CHANNELS } from "../../packages/strategy-lab/src/league/red-team.js"
import { createFactoryRepository, readFactoryArtifact, type FactoryRepository } from "../../packages/strategy-lab/src/factory/repository.js"
import { preflightLeagueAuthoring } from "../../scripts/lib/v1-38-league-authoring.js"
import { factoryAssessmentImplementationManifest } from "../../scripts/v1-38-factory-implementation.js"
import { readLeagueInitialCandidates, type LeagueCandidateInput, type LeagueInitialCandidateSelection } from "../../scripts/run-v1-38-serious-league.js"
import { writePhase265PacketSummaryExclusive } from "./prepare-phase-265-packets.js"

const fail = (code: string): never => { throw new TypeError(`PHASE265_ALLOCATION_BUILDER_${code}`) }
const ROOT = /^sha256:[0-9a-f]{64}$/u
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort(), expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const knownAssessment = Object.freeze({
  artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8",
  assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1",
  thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72",
  producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b",
  assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c",
} as const)
const resourceKeys = ["matches", "modelTokens", "effortMilliseconds", "reviewMilliseconds", "searchNodes", "teacherNodes", "distillationUnits"] as const
const zeroResources = () => Object.fromEntries(resourceKeys.map((key) => [key, 0])) as Record<typeof resourceKeys[number], number>
const canonicalRead = (path: string): unknown => {
  const parsed = admitCanonicalJsonBytes(readFileSync(resolve(path)), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("INPUT_NOT_CANONICAL")
  return parsed.value
}

export interface Phase265VerifiedBaseManifest {
  readonly schemaVersion: "phase265-verified-bases-v1"
  readonly historicalAssessment: typeof knownAssessment
  readonly bases: readonly Readonly<{ sourceSlot: "S01" | "S03" | "S05"; publicationArtifactRoot: LabRoot; candidateAdmissionRoot: LabRoot; sourceRoot: LabRoot; supervisionArtifactRoot: LabRoot }>[]
}
export interface Phase265PacketSummary {
  readonly jobs: readonly Readonly<{ id: string; producerRequestArtifactRoot: LabRoot; disclosureArtifactRoot: LabRoot; provenanceArtifactRoot: LabRoot; reviewArtifactRoot: LabRoot; participantId: string; reviewerId: string }>[]
}
export interface Phase265ParticipantRole {
  readonly jobId: string
  readonly producer: "tactical" | "teacher" | "model"
  readonly authorAgentId: string
  readonly reviewerAgentId: string
}
export interface BuildPhase265AllocationInput {
  readonly baseManifest: unknown
  readonly packetSummary: unknown
  readonly participantRoles: unknown
  readonly leagueDirectory: string
  readonly responseFactoryDirectory: string
}

type InitialCandidateReader = (repository: FactoryRepository, allocation: LeagueInitialCandidateSelection) => readonly LeagueCandidateInput[]

/**
 * Match each manifest row to an authenticated data-only historical import.
 * The injectable variant exists only for isolated tests; the CLI always calls
 * this function with the production reader and an explicit historical repo.
 */
const verifyHistoricalBasesWithReader = (manifest: unknown, historicalRepository: FactoryRepository, reader: InitialCandidateReader): void => {
  const assessment = manifest && typeof manifest === "object" && !Array.isArray(manifest) ? (manifest as Record<string, unknown>).historicalAssessment : undefined
  if (!exact(manifest, ["schemaVersion", "historicalAssessment", "bases"]) || manifest.schemaVersion !== "phase265-verified-bases-v1" ||
      !exact(assessment, Object.keys(knownAssessment)) || Object.keys(knownAssessment).some((key) => assessment[key] !== knownAssessment[key as keyof typeof knownAssessment]) || !Array.isArray(manifest.bases) || manifest.bases.length !== 3) return fail("BASE_MANIFEST")
  const bases = manifest.bases as Phase265VerifiedBaseManifest["bases"]
  const selection: LeagueInitialCandidateSelection = {
    initialCandidatePublicationRoots: bases.map((base) => base.publicationArtifactRoot).sort(),
    factoryAssessmentArtifactRoots: [knownAssessment.artifactRoot],
    operations: { maxArtifactBytes: LEAGUE_APPROVED_PROSPECTIVE_POLICY.operations.maxArtifactBytes, maxArtifactRecords: LEAGUE_APPROVED_PROSPECTIVE_POLICY.operations.maxArtifactRecords },
  }
  const imports = reader(historicalRepository, selection)
  if (imports.length !== 3) return fail("HISTORICAL_BASE_COUNT")
  for (const base of bases) {
    const imported = imports.find((row) => row.publicationRoot === base.publicationArtifactRoot), evidence = imported?.admission.importEvidence
    if (!imported || !evidence || imported.admission.root !== base.candidateAdmissionRoot || imported.admission.candidate.proposal.source.root !== base.sourceRoot ||
        evidence.sourcePhase !== 264 || evidence.publicationArtifactRoot !== base.publicationArtifactRoot || evidence.supervisionArtifactRoot !== base.supervisionArtifactRoot ||
        evidence.assessmentArtifactRoot !== knownAssessment.artifactRoot || evidence.assessmentRoot !== knownAssessment.assessmentRoot || evidence.thresholdArtifactRoot !== knownAssessment.thresholdArtifactRoot ||
        evidence.sourceSlot !== base.sourceSlot || evidence.qualification !== "base_distinct") return fail("HISTORICAL_BASE_IDENTITY")
  }
}
/** Isolated test seam; the CLI cannot supply or select a reader. */
export const verifyPhase265HistoricalBasesWithReaderForTest = (manifest: unknown, historicalRepository: FactoryRepository, reader: InitialCandidateReader): void => verifyHistoricalBasesWithReader(manifest, historicalRepository, reader)
const verifyPhase265HistoricalBases = (manifest: unknown, repository: FactoryRepository) => verifyHistoricalBasesWithReader(manifest, repository, readLeagueInitialCandidates)

const currentIdentity = () => {
  const manifest = factoryAssessmentImplementationManifest()
  return { implementationRoot: manifest.root, sourceRoot: labRoot("league-reviewed-source-bytes-v1", manifest.entries) }
}

/**
 * Build the approved empirical allocation from explicitly authenticated upstream
 * records. This in-memory builder does not authenticate historical bases itself;
 * the CLI invokes the real data-only historical reader before calling it, and
 * the separate prepare-prospective/run gates verify them again.
 */
export const buildPhase265Allocation = (input: BuildPhase265AllocationInput, repository: FactoryRepository) => {
  if (!exact(input, ["baseManifest", "packetSummary", "participantRoles", "leagueDirectory", "responseFactoryDirectory"])) return fail("INPUT_FIELDS")
  if (!isAbsolute(input.leagueDirectory) || !isAbsolute(input.responseFactoryDirectory)) return fail("OUTPUT_PATHS")
  let leagueDirectory: string, responseFactoryDirectory: string
  try { leagueDirectory = realpathSync(input.leagueDirectory); responseFactoryDirectory = realpathSync(input.responseFactoryDirectory) } catch { return fail("OUTPUT_PATHS") }
  if (repository.directory !== responseFactoryDirectory) return fail("REPOSITORY_MISMATCH")

  const baseManifest = input.baseManifest
  const assessment = baseManifest && typeof baseManifest === "object" && !Array.isArray(baseManifest) ? (baseManifest as Record<string, unknown>).historicalAssessment : undefined
  if (!exact(baseManifest, ["schemaVersion", "historicalAssessment", "bases"]) || baseManifest.schemaVersion !== "phase265-verified-bases-v1" ||
      !exact(assessment, Object.keys(knownAssessment)) || Object.keys(knownAssessment).some((key) => assessment[key] !== knownAssessment[key as keyof typeof knownAssessment]) || !Array.isArray(baseManifest.bases) || baseManifest.bases.length !== 3) return fail("BASE_MANIFEST")
  const bases = baseManifest.bases as Phase265VerifiedBaseManifest["bases"]
  for (const [index, base] of bases.entries()) {
    if (!exact(base, ["sourceSlot", "publicationArtifactRoot", "candidateAdmissionRoot", "sourceRoot", "supervisionArtifactRoot"]) ||
        base.sourceSlot !== (["S01", "S03", "S05"] as const)[index] || ![base.publicationArtifactRoot, base.candidateAdmissionRoot, base.sourceRoot, base.supervisionArtifactRoot].every(isRoot)) return fail("BASES")
  }
  for (const key of ["publicationArtifactRoot", "candidateAdmissionRoot", "sourceRoot", "supervisionArtifactRoot"] as const) if (new Set(bases.map((base) => base[key])).size !== 3) return fail("DUPLICATE_BASES")

  if (!exact(input.packetSummary, ["jobs"]) || !Array.isArray(input.packetSummary.jobs) || input.packetSummary.jobs.length !== 11 || !Array.isArray(input.participantRoles) || input.participantRoles.length !== 11) return fail("PACKET_OR_ROLE_COUNT")
  const packetJobs = input.packetSummary.jobs as Phase265PacketSummary["jobs"], roles = input.participantRoles as Phase265ParticipantRole[]
  const schedule = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat(), policy = LEAGUE_APPROVED_PROSPECTIVE_POLICY
  const seenIds = new Set<string>(), authorAgents = new Set<string>(), reviewerAgents = new Set<string>()
  for (const [index, raw] of packetJobs.entries()) {
    if (!exact(raw, ["id", "producerRequestArtifactRoot", "disclosureArtifactRoot", "provenanceArtifactRoot", "reviewArtifactRoot", "participantId", "reviewerId"])) return fail("PACKET_FIELDS")
    const row = raw as Phase265PacketSummary["jobs"][number]
    if (!/^[a-z][a-z0-9-]{0,63}$/u.test(row.id) || seenIds.has(row.id) || ![row.producerRequestArtifactRoot, row.disclosureArtifactRoot, row.provenanceArtifactRoot, row.reviewArtifactRoot].every(isRoot)) return fail("PACKET_ID_OR_ROOT")
    seenIds.add(row.id)
    if (row.participantId !== `${row.id}-author` || row.reviewerId !== `${row.id}-reviewer`) return fail("PACKET_PARTICIPANT_IDS")
    const role = roles[index]
    if (!exact(role, ["jobId", "producer", "authorAgentId", "reviewerAgentId"]) || role.jobId !== row.id || role.producer !== schedule[index] ||
        !/^[a-z][a-z0-9._:-]{0,95}$/u.test(role.authorAgentId) || !/^[a-z][a-z0-9._:-]{0,95}$/u.test(role.reviewerAgentId) || role.authorAgentId === role.reviewerAgentId) return fail("ROLE_FIELDS")
    authorAgents.add(role.authorAgentId); reviewerAgents.add(role.reviewerAgentId)
    for (const artifactRoot of [row.producerRequestArtifactRoot, row.disclosureArtifactRoot, row.provenanceArtifactRoot, row.reviewArtifactRoot]) readFactoryArtifact(repository, artifactRoot)
    const request = admitCanonicalJsonBytes(readFactoryArtifact(repository, row.producerRequestArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    const expectedIdentity = { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[role.producer]
    const expectedOrigin = { tactical: "tactical-oracle", teacher: "teacher-oracle", model: "model-oracle" }[role.producer]
    if (!request.ok || !exact(request.value, ["producerIdentity", "origin", "evidenceClass", "producerInput"]) || request.value.producerIdentity !== expectedIdentity || request.value.origin !== expectedOrigin || request.value.evidenceClass !== "real_producer") return fail("PACKET_SCHEDULE")
  }
  if ([...authorAgents].some((agentId) => reviewerAgents.has(agentId))) return fail("ROLE_CROSS_CONFLICT")

  const identity = currentIdentity()
  const amendmentInput: LeagueProspectiveAmendmentInput = {
    phase: 265, privacy: "private_offline", evidenceClass: "empirical", approvalCommit: "06cdb050",
    implementationRoot: identity.implementationRoot, sourceRoot: identity.sourceRoot,
    historicalAssessment: knownAssessment,
    bases: bases as unknown as LeagueProspectiveAmendmentInput["bases"], controls: "comparison-only-excluded", policy,
  }
  const amendment = createLeagueProspectiveAmendment(amendmentInput)
  const roots = bases.map((base) => base.publicationArtifactRoot).sort()
  const opportunities = policy.opportunities, operations = policy.operations
  const rounds = policy.schedule.map((producers, ordinal) => ({
    ordinal, acceptedSlots: policy.acceptedSlots[ordinal]!,
    jobs: producers.map((producer, jobIndex) => {
      const flatIndex = policy.schedule.slice(0, ordinal).reduce((sum, row) => sum + row.length, 0) + jobIndex
      const packet = packetJobs[flatIndex]!, role = roles[flatIndex]!, id = packet.id
      const reservation = { matches: 288, modelTokens: producer === "model" ? 48000 : 0, effortMilliseconds: 64800000, reviewMilliseconds: 900000, searchNodes: producer === "tactical" ? 100 : 0, teacherNodes: producer === "teacher" ? 100 : 0, distillationUnits: producer === "teacher" ? 2 : 0 }
      return { id, channel: producer === "model" ? "model" as const : "automated" as const, operation: "produce" as const,
        evaluationRole: ordinal < 3 ? "development_response" as const : producer === "teacher" ? "validation_opponent" as const : "independent_probe_opponent" as const,
        producerRequestArtifactRoot: packet.producerRequestArtifactRoot, disclosureArtifactRoot: packet.disclosureArtifactRoot,
        provenanceArtifactRoot: packet.provenanceArtifactRoot, reviewArtifactRoot: packet.reviewArtifactRoot,
        participantId: packet.participantId, reviewerId: packet.reviewerId, reservation, retryParentJobId: null }
    }),
  }))
  const jobs = rounds.flatMap((round) => round.jobs)
  const channels = RED_TEAM_CHANNELS.map((channel) => {
    const selected = jobs.filter((job) => job.channel === channel), ceilings = zeroResources(), perAttempt = zeroResources()
    for (const job of selected) for (const key of resourceKeys) { ceilings[key] += job.reservation[key]; perAttempt[key] = Math.max(perAttempt[key], job.reservation[key]) }
    return { channel, disposition: selected.length ? "allocated" as const : "authorized_zero" as const, opportunities: selected.length, ceilings, perAttempt, retryLimit: 0,
      participants: selected.map((job) => job.participantId).sort(), reviewers: selected.map((job) => job.reviewerId).sort(),
      disclosure: "complete-source-build-and-dependencies" as const, conflicts: "distinct-reviewer" as const, provenance: "explicit-deterministic-data-only" as const, burn: "reserve-full-no-refund" as const }
  })
  const allocationInput: ProspectiveLeagueExecutionAllocationInput = {
    phase: 265, privacy: "private_offline", evidenceClass: "empirical", operatorDecision: "approved-prospective-league-06cdb050",
    studyPolicyRoot: LAB_ADMITTED_ROOTS.studyPolicyRoot, measurementPolicyRoot: LAB_ADMITTED_ROOTS.measurementPolicyRoot,
    tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, implementationRoot: identity.implementationRoot,
    initialCandidatePublicationRoots: roots, factoryAssessmentArtifactRoots: [knownAssessment.artifactRoot], independenceReferencePublicationRoot: bases[0]!.publicationArtifactRoot,
    seedBlocks: ["league-265-approved-seed-block-1"], outputDirectories: { league: leagueDirectory, responseFactory: responseFactoryDirectory },
    opportunities, operations, retryBurn: { allStartsCharged: true, unknownUsage: "full-reservation", onIntegrityFailure: "stop", unusedSlots: "retain-no-refund", retryCeiling: 0 },
    channels, probes: policy.probes, rounds,
    participantPolicy: { disclosure: "complete-source-build-and-dependencies", review: "distinct-reviewer", priorExposure: "declared", conflicts: "reject", unfilled: "retain", modelInternalSnapshot: "record-unavailable-no-substitute" },
    amendment, participantRoles: roles,
  }
  const allocation = createProspectiveLeagueExecutionAllocation(allocationInput)
  for (const job of jobs) preflightLeagueAuthoring({ allocation, jobId: job.id, repository })
  return allocation
}

const main = () => {
  const arg = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1] }
  const basesPath = arg("--bases"), packetsPath = arg("--packets"), rolesPath = arg("--roles"), leagueDirectory = arg("--league-directory"), responseFactoryDirectory = arg("--response-factory-directory"), historicalFactoryDirectory = arg("--historical-factory-directory"), outputPath = arg("--output")
  if (!basesPath || !packetsPath || !rolesPath || !leagueDirectory || !responseFactoryDirectory || !historicalFactoryDirectory || !outputPath) return fail("USAGE: --bases <canonical-json> --packets <canonical-json> --roles <canonical-json> --league-directory <existing-absolute-path> --response-factory-directory <existing-absolute-path> --historical-factory-directory <existing-factory-directory> --output <new-path>")
  const baseManifest = canonicalRead(basesPath), historicalRepository = createFactoryRepository(resolve(historicalFactoryDirectory))
  verifyPhase265HistoricalBases(baseManifest, historicalRepository)
  const repository = createFactoryRepository(resolve(responseFactoryDirectory))
  const allocation = buildPhase265Allocation({ baseManifest, packetSummary: canonicalRead(packetsPath), participantRoles: canonicalRead(rolesPath), leagueDirectory, responseFactoryDirectory }, repository)
  writePhase265PacketSummaryExclusive(outputPath, allocation)
  process.stdout.write(`${JSON.stringify({ root: allocation.root, schemaVersion: allocation.schemaVersion, outputPath: resolve(outputPath) })}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
