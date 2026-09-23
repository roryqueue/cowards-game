import { closeSync, constants, fsyncSync, linkSync, openSync, readFileSync, realpathSync, unlinkSync, writeSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { createHash, randomUUID } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, ArenaVariantSchema, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "../../packages/strategy-lab/src/factory/repository.js"

const fail = (code: string): never => { throw new TypeError(`PHASE265_PACKET_COMPILER_${code}`) }
const rootPattern = /^sha256:[0-9a-f]{64}$/u
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const actual = Object.keys(value).sort(), expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && rootPattern.test(value)
const isText = (value: unknown, max = 32768): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max
const canonical = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262144) return fail("CANONICAL_ARTIFACT")
  return admitted.canonicalBytes
}
/** Atomic no-overwrite publication for the operator's rooted summary. */
export const writePhase265PacketSummaryExclusive = (path: string, summary: unknown): void => {
  const target = resolve(path), directory = dirname(target), temporary = join(directory, `.${basename(target)}.tmp-${randomUUID()}`), bytes = canonical(summary)
  let descriptor: number | undefined
  try {
    descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
    let offset = 0
    while (offset < bytes.byteLength) offset += writeSync(descriptor, bytes, offset, bytes.byteLength - offset)
    fsyncSync(descriptor)
    closeSync(descriptor); descriptor = undefined
    linkSync(temporary, target)
    unlinkSync(temporary)
    const directoryFd = openSync(directory, constants.O_RDONLY)
    try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor)
    try { unlinkSync(temporary) } catch { /* no temporary was created or already removed */ }
    throw error
  }
}

const producers: Readonly<Record<string, string>> = Object.freeze({
  emitTacticalFactoryPacket: "tactical-oracle",
  emitTeacherFactoryPacket: "teacher-oracle",
  emitModelFactoryPacket: "model-oracle",
})
const producerIdentityFor = { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" } as const
const namePattern = /^[a-z][a-z0-9-]{0,95}$/u
const optionalRoot = (value: unknown) => value === null || isRoot(value)
const validFactoryRequest = (value: unknown, split: string, withProvider: boolean): boolean => {
  if (!exact(value, withProvider ? ["split", "doctrineFamily", "provider", "build", "lineage"] : ["split", "doctrineFamily", "build", "lineage"])) return false
  if (value.split !== split || typeof value.doctrineFamily !== "string" || !namePattern.test(value.doctrineFamily)) return false
  if (!exact(value.build, ["buildRoot", "toolchainRoot"]) || !Object.values(value.build).every(isRoot)) return false
  if (!exact(value.lineage, ["predecessorRoot", "correctionRoot", "retryParentRoot"]) || !isRoot(value.lineage.predecessorRoot) || !optionalRoot(value.lineage.correctionRoot) || value.lineage.retryParentRoot !== null) return false
  if (withProvider) {
    const provider = value.provider
    if (!exact(provider, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot"]) || !["providerId", "modelId", "modelVersion"].every((key) => isText(provider[key], 256)) || !["settingsRoot", "promptRoot", "contextRoot"].every((key) => isRoot(provider[key]))) return false
  }
  return true
}
const validProducerInput = (identity: string, value: unknown, split: string, dependencyArtifactRoots: readonly LabRoot[]): boolean => {
  if (identity === "emitTacticalFactoryPacket") return validFactoryRequest(value, split, true)
  if (identity === "emitTeacherFactoryPacket") {
    if (!exact(value, ["searches", "request"]) || !validFactoryRequest(value.request, split, true) || !Array.isArray(value.searches) || value.searches.length < 1 || value.searches.length > 2) return false
    let nodes = 0
    for (const search of value.searches) {
      if (!exact(search, ["canonicalMatch", "studentPlayerId", "counterfactual", "maxDepth", "maxNodes"]) || !exact(search.counterfactual, ["opponentHypothesis"]) || !["cautious", "aggressive"].includes(search.counterfactual.opponentHypothesis as string) || !isText(search.studentPlayerId, 256) || !Number.isSafeInteger(search.maxDepth) || Number(search.maxDepth) < 1 || Number(search.maxDepth) > 6 || !Number.isSafeInteger(search.maxNodes) || Number(search.maxNodes) < 2 || Number(search.maxNodes) > 256 || !exact(search.canonicalMatch, ["matchId", "seed", "arenaVariant", "bottomPlayerId", "topPlayerId", "bottomStrategyRevisionId", "topStrategyRevisionId", "initialInitiativePlayerId"])) return false
      const match = search.canonicalMatch
      if (![match.matchId, match.seed, match.bottomPlayerId, match.topPlayerId, match.bottomStrategyRevisionId, match.topStrategyRevisionId, match.initialInitiativePlayerId].every((field) => isText(field, 256)) || match.bottomPlayerId === match.topPlayerId || ![match.bottomPlayerId, match.topPlayerId].includes(match.initialInitiativePlayerId) || ![match.bottomPlayerId, match.topPlayerId].includes(search.studentPlayerId) || !ArenaVariantSchema.safeParse(match.arenaVariant).success) return false
      const active = CANONICAL_ARENA_CATALOG_V1_37.arenas.some((arena) => arena.status === "active" && arena.schedulable && labRoot("phase265-teacher-arena-v1", match.arenaVariant) === labRoot("phase265-teacher-arena-v1", { id: arena.id, name: arena.name, initialBounds: arena.initialBounds, terrainStones: arena.terrainStones }))
      if (!active) return false
      nodes += Number(search.maxNodes)
    }
    return nodes <= 100
  }
  if (identity === "emitModelFactoryPacket") {
    if (!exact(value, ["authoring", "request"]) || !validFactoryRequest(value.request, split, false) || !exact(value.authoring, ["sourceMessage", "codexExecutable", "clientVersion", "stateDirectory", "disclosedDirectory", "existingAuthFile", "requestedModel", "requestedProvider", "path", "settingsRoot", "promptRoot", "contextRoot"])) return false
    const a = value.authoring
    if (!["sourceMessage", "codexExecutable", "clientVersion", "stateDirectory", "disclosedDirectory", "existingAuthFile", "requestedProvider", "path"].every((key) => isText(a[key])) || a.requestedModel !== LEAGUE_APPROVED_PROSPECTIVE_POLICY.model || !["settingsRoot", "promptRoot", "contextRoot"].every((key) => isRoot(a[key]))) return false
    const promptRoot = `sha256:${createHash("sha256").update(a.sourceMessage as string, "utf8").digest("hex")}`
    return a.promptRoot === promptRoot && a.contextRoot === labRoot("league-disclosed-context-v1", { dependencyArtifactRoots })
  }
  return false
}

export interface Phase265PacketInput {
  readonly schemaVersion: "phase265-response-packets-v1"
  readonly repositoryDirectory: string
  readonly jobs: readonly Readonly<{
    id: string
    producerRequest: Readonly<{ producerIdentity: string; origin: string; evidenceClass: "real_producer"; producerInput: unknown }>
    participantId: string
    reviewerId: string
    disclosure: Readonly<{ sourceAndBuildDisclosed: true; dependencyArtifactRoots: readonly LabRoot[] }>
    provenance: Readonly<{ priorExposure: string; conflicts: "none"; deterministicDataOnly: true }>
    review: Readonly<{ disposition: "accepted"; reviewMilliseconds: number }>
  }>[]
}

/**
 * Compile only operator-supplied request/review/provenance data. No producer,
 * Match, identity, attestation, or acceptance is synthesized here.
 */
export const preparePhase265Packets = (input: unknown, repository: FactoryRepository): Readonly<{ jobs: readonly unknown[] }> => {
  if (!exact(input, ["schemaVersion", "repositoryDirectory", "jobs"])) return fail("INPUT_FIELDS")
  if (input.schemaVersion !== "phase265-response-packets-v1" || typeof input.repositoryDirectory !== "string" || !Array.isArray(input.jobs) || input.jobs.length !== 11) return fail("INPUT_SHAPE")
  let expectedDirectory: string
  try { expectedDirectory = realpathSync(resolve(input.repositoryDirectory)) } catch { return fail("REPOSITORY_PATH") }
  if (repository.directory !== expectedDirectory) return fail("REPOSITORY_MISMATCH")

  const ids = new Set<string>(), schedule = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat()
  const validated = input.jobs.map((raw, index) => {
    if (!exact(raw, ["id", "producerRequest", "participantId", "reviewerId", "disclosure", "provenance", "review"])) return fail("JOB_FIELDS")
    const job = raw as unknown as Phase265PacketInput["jobs"][number]
    if (!/^[a-z][a-z0-9-]{0,63}$/u.test(job.id) || ids.has(job.id)) return fail("JOB_ID")
    ids.add(job.id)
    if (!exact(job.producerRequest, ["producerIdentity", "origin", "evidenceClass", "producerInput"])) return fail("REQUEST_FIELDS")
    const expectedOrigin = producers[job.producerRequest.producerIdentity]
    if (!expectedOrigin || job.producerRequest.producerIdentity !== producerIdentityFor[schedule[index]!] || job.producerRequest.origin !== expectedOrigin || job.producerRequest.evidenceClass !== "real_producer") return fail("REQUEST_NOT_CANONICAL_PRODUCER")
    // Producer input is deliberately opaque data: require it to be representable
    // in the strict canonical manifest profile, but never interpret or produce it.
    canonical(job.producerRequest)
    if (job.participantId !== `${job.id}-author` || job.reviewerId !== `${job.id}-reviewer` || !isText(job.participantId, 96) || !isText(job.reviewerId, 96) || job.participantId === job.reviewerId) return fail("IDENTITY_CONFLICT")
    if (!exact(job.disclosure, ["sourceAndBuildDisclosed", "dependencyArtifactRoots"]) || job.disclosure.sourceAndBuildDisclosed !== true ||
        !Array.isArray(job.disclosure.dependencyArtifactRoots) || !job.disclosure.dependencyArtifactRoots.length || !job.disclosure.dependencyArtifactRoots.every(isRoot) || new Set(job.disclosure.dependencyArtifactRoots).size !== job.disclosure.dependencyArtifactRoots.length) return fail("DISCLOSURE_ROOTS")
    if (!exact(job.provenance, ["priorExposure", "conflicts", "deterministicDataOnly"]) || !isText(job.provenance.priorExposure) || job.provenance.conflicts !== "none" || job.provenance.deterministicDataOnly !== true) return fail("PROVENANCE")
    if (!exact(job.review, ["disposition", "reviewMilliseconds"]) || job.review.disposition !== "accepted" || !Number.isSafeInteger(job.review.reviewMilliseconds) || job.review.reviewMilliseconds < 0 || job.review.reviewMilliseconds > 900000) return fail("REVIEW_NOT_ACCEPTED")
    if (!validProducerInput(job.producerRequest.producerIdentity, job.producerRequest.producerInput, index < 9 ? "development" : index === 9 ? "validation" : "probe", job.disclosure.dependencyArtifactRoots)) return fail("REQUEST_CONFIGURATION")
    // All roots are verified before the first write; missing dependency bytes fail closed.
    for (const dependencyRoot of job.disclosure.dependencyArtifactRoots) readFactoryArtifact(repository, dependencyRoot)
    return job
  })
  const authors = new Set(validated.map((job) => job.participantId))
  if (validated.some((job) => authors.has(job.reviewerId))) return fail("REVIEWER_AUTHOR_CONFLICT")

  const output = validated.map((job) => {
    const producerRequestArtifactRoot = publishFactoryArtifact(repository, canonical(job.producerRequest))
    const disclosureArtifactRoot = publishFactoryArtifact(repository, canonical({ participantId: job.participantId, requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: job.disclosure.sourceAndBuildDisclosed, dependencyArtifactRoots: job.disclosure.dependencyArtifactRoots }))
    const provenanceArtifactRoot = publishFactoryArtifact(repository, canonical({ participantId: job.participantId, priorExposure: job.provenance.priorExposure, conflicts: job.provenance.conflicts, origin: job.producerRequest.origin, deterministicDataOnly: job.provenance.deterministicDataOnly }))
    const reviewArtifactRoot = publishFactoryArtifact(repository, canonical({ reviewerId: job.reviewerId, participantId: job.participantId, disclosureArtifactRoot, provenanceArtifactRoot, disposition: job.review.disposition, reviewMilliseconds: job.review.reviewMilliseconds }))
    return Object.freeze({ id: job.id, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: job.participantId, reviewerId: job.reviewerId })
  })
  return Object.freeze({ jobs: Object.freeze(output) })
}

const main = () => {
  const arg = (name: string) => { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1] }
  const inputPath = arg("--input"), repositoryPath = arg("--repository"), outputPath = arg("--output")
  if (!inputPath || !repositoryPath || process.argv.includes("--help")) return fail("USAGE: --input <canonical-json> --repository <factory-directory>")
  const parsed = admitCanonicalJsonBytes(readFileSync(resolve(inputPath)), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("INPUT_NOT_CANONICAL")
  const result = preparePhase265Packets(parsed.value, createFactoryRepository(resolve(repositoryPath)))
  if (outputPath) writePhase265PacketSummaryExclusive(outputPath, result)
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
