import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { emitTacticalFactoryPacket, emitTacticalSource, type TacticalFactoryRequest } from "../packages/strategy-oracle-tactical/src/emit.js"
import { emitTeacherFactoryPacket, emitTeacherSource, type TeacherFactoryRequest } from "../packages/strategy-oracle-teacher/src/emit.js"
import type { DistilledLegalStudent } from "../packages/strategy-oracle-teacher/src/distill.js"
import { admitFrozenModelBundle, type FrozenModelBundle } from "../packages/strategy-oracle-model/src/bundle.js"
import { emitModelFactoryPacket, getIssuedModelFactoryPacketProvenance, requireIssuedModelFactoryPacketProvenance, type ModelFactoryPacketProvenance, type ModelFactoryRequest } from "../packages/strategy-oracle-model/src/emit.js"
import { freezeLabValue, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { FactoryOraclePacketSchema, factoryProposalFromPacket, type FactoryNativeLane, type FactoryOraclePacket } from "../packages/strategy-lab/src/factory/contracts.js"
import { admitQuarantinedIntakePacket, reopenAcceptedQuarantinedIntakePacket, type QuarantinedIntakePacket, type QuarantinedIntakeResult } from "../packages/strategy-lab/src/factory/intake.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"

const fail = (code: string): never => { throw new TypeError(`FACTORY_INGEST_${code}`) }
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const producerOrigins = {
  emitTacticalFactoryPacket: "tactical-oracle",
  emitTeacherFactoryPacket: "teacher-oracle",
  emitModelFactoryPacket: "model-oracle",
  admitQuarantinedIntakePacket: "human-external-intake",
} as const
export type NamedFactoryProducer = keyof typeof producerOrigins
export type NamedFactoryOrigin = typeof producerOrigins[NamedFactoryProducer]

export interface FactoryIngestionRequest {
  readonly producerIdentity: NamedFactoryProducer
  readonly origin: NamedFactoryOrigin
  readonly evidenceClass: "real_producer"
  readonly producerInput: unknown
}
export interface FactoryIngestionRecord {
  readonly schemaVersion: "factory-ingestion-v1"; readonly privacy: "private_offline"; readonly root: LabRoot
  readonly producerIdentity: NamedFactoryProducer; readonly origin: NamedFactoryOrigin; readonly evidenceClass: "real_producer"
  readonly packetRoot: LabRoot; readonly sourceRoot: LabRoot; readonly runtimeProfileRoot: LabRoot; readonly nativeLane: FactoryNativeLane
  readonly packet: FactoryOraclePacket; readonly sourceUtf8: string; readonly producerInput: unknown
  readonly modelCompanion: ModelFactoryPacketProvenance | null
}
export type FactoryIngestionResult = Readonly<{ disposition: "accepted"; artifactRoot: LabRoot; packetRoot: LabRoot; sourceRoot: LabRoot; record: FactoryIngestionRecord }> |
  Readonly<{ disposition: "blocked_configuration"; artifactRoot: LabRoot; attemptRoot: null; configurationRoot: LabRoot; authorized: false; allocation: "none" }>
const issued = new WeakSet<object>()

const encode = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262_144) return fail("RECORD_SIZE")
  return admitted.canonicalBytes
}
const artifactPath = (repository: FactoryRepository, root: LabRoot) => resolve(repository.directory, `factory-artifact-${root.slice(7)}.bin`)
const publishOnce = (repository: FactoryRepository, bytes: Uint8Array): LabRoot => {
  const expected = byteRoot(bytes)
  if (existsSync(artifactPath(repository, expected))) return fail("DUPLICATE")
  const actual = publishFactoryArtifact(repository, bytes)
  if (actual !== expected) return fail("PUBLICATION")
  return actual
}
const recordRoot = (record: Omit<FactoryIngestionRecord, "root">): LabRoot => labRoot("factory-ingestion-v1", record)
const sourceBytes = (source: string): Uint8Array => new TextEncoder().encode(source)

type MaterializedPacket = { packet: FactoryOraclePacket; source: string; companion: ModelFactoryPacketProvenance | null; storedInput?: unknown }
const materialize = async (request: FactoryIngestionRequest, repository: FactoryRepository): Promise<MaterializedPacket | Extract<QuarantinedIntakeResult, { disposition: "blocked_configuration" }>> => {
  switch (request.producerIdentity) {
    case "emitTacticalFactoryPacket": {
      const input = request.producerInput as TacticalFactoryRequest
      return { packet: emitTacticalFactoryPacket(input), source: emitTacticalSource(), companion: null }
    }
    case "emitTeacherFactoryPacket": {
      const input = request.producerInput as { student: DistilledLegalStudent; request: TeacherFactoryRequest }
      return { packet: emitTeacherFactoryPacket(input.student, input.request), source: emitTeacherSource(input.student), companion: null }
    }
    case "emitModelFactoryPacket": {
      const input = request.producerInput as { bundle: FrozenModelBundle; request: ModelFactoryRequest }
      const bundle = admitFrozenModelBundle(input.bundle)
      const packet = emitModelFactoryPacket(bundle, input.request)
      const companion = getIssuedModelFactoryPacketProvenance(packet)
      requireIssuedModelFactoryPacketProvenance(packet, companion)
      return { packet, source: bundle.response.source, companion, storedInput: { request: input.request } }
    }
    case "admitQuarantinedIntakePacket": {
      const input = request.producerInput as QuarantinedIntakePacket
      const result = admitQuarantinedIntakePacket(input, repository)
      if (result.disposition === "blocked_configuration") return result
      if (result.disposition !== "accepted") return fail("INTAKE_NOT_ACCEPTED")
      const { sourceBytes: _sourceBytes, ...storedInput } = input
      return { packet: input.packet, source: new TextDecoder("utf-8", { fatal: true }).decode(input.sourceBytes), companion: null, storedInput }
    }
  }
}
const issue = (record: FactoryIngestionRecord): Readonly<FactoryIngestionRecord> => { const frozen = freezeLabValue(record); issued.add(frozen); return frozen }
export const requireIssuedFactoryIngestion = (record: FactoryIngestionRecord): Readonly<FactoryIngestionRecord> => {
  if (!issued.has(record)) return fail("UNISSUED")
  const { root, ...withoutRoot } = record
  if (root !== recordRoot(withoutRoot)) return fail("ROOT")
  return record
}

export const ingestNamedFactoryPacket = async (request: FactoryIngestionRequest, repository: FactoryRepository): Promise<FactoryIngestionResult> => {
  if (!Object.hasOwn(producerOrigins, request?.producerIdentity) || request.origin !== producerOrigins[request.producerIdentity] || request.evidenceClass !== "real_producer") return fail("PRODUCER")
  const materialized = await materialize(request, repository)
  if ("disposition" in materialized) {
    if (materialized.disposition !== "blocked_configuration") return fail("INTAKE_NOT_ACCEPTED")
    return freezeLabValue(materialized)
  }
  if (request.producerIdentity === "emitModelFactoryPacket") {
    if (!materialized.companion) return fail("MODEL_COMPANION")
    requireIssuedModelFactoryPacketProvenance(materialized.packet, materialized.companion)
  } else if (materialized.companion !== null) return fail("COMPANION")
  const packet = FactoryOraclePacketSchema.parse(materialized.packet)
  const bytes = sourceBytes(materialized.source)
  if (packet.oracleFamily !== request.origin || packet.provider.providerId !== packet.nativeLane.providerId || packet.source.root !== byteRoot(bytes) || packet.source.sha256 !== packet.source.root || packet.source.byteLength !== bytes.byteLength || packet.nativeLane.runtimeProfileRoot !== packet.inheritedAuthority.runtimeProfileRoot) return fail("BINDING")
  const value: Omit<FactoryIngestionRecord, "root"> = {
    schemaVersion: "factory-ingestion-v1", privacy: "private_offline", producerIdentity: request.producerIdentity, origin: request.origin,
    evidenceClass: request.evidenceClass, packetRoot: packet.root, sourceRoot: packet.source.root, runtimeProfileRoot: packet.nativeLane.runtimeProfileRoot,
    nativeLane: packet.nativeLane, packet, sourceUtf8: materialized.source, producerInput: materialized.storedInput ?? request.producerInput, modelCompanion: materialized.companion,
  }
  const record = issue({ ...value, root: recordRoot(value) })
  const artifactRoot = publishOnce(repository, encode(record))
  return freezeLabValue({ disposition: "accepted", artifactRoot, packetRoot: packet.root, sourceRoot: packet.source.root, record })
}

/** Reload replays the named data-only producer; model companions are re-admitted before emission. */
export const readFactoryIngestion = (repository: FactoryRepository, artifactRoot: LabRoot): Readonly<FactoryIngestionRecord> => {
  const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return fail("RELOAD")
  const stored = parsed.value as unknown as FactoryIngestionRecord
  if (!Object.hasOwn(producerOrigins, stored.producerIdentity) || stored.origin !== producerOrigins[stored.producerIdentity] || stored.evidenceClass !== "real_producer") return fail("RELOAD_PRODUCER")
  const packet = FactoryOraclePacketSchema.parse(stored.packet), bytes = sourceBytes(stored.sourceUtf8)
  if (stored.packetRoot !== packet.root || stored.sourceRoot !== packet.source.root || byteRoot(bytes) !== stored.sourceRoot || stored.nativeLane.runtimeProfileRoot !== stored.runtimeProfileRoot) return fail("RELOAD_BINDING")
  if (stored.producerIdentity === "emitModelFactoryPacket") {
    const input = stored.producerInput as { request: ModelFactoryRequest }
    if (!stored.modelCompanion) return fail("RELOAD_MODEL")
    const bundle = admitFrozenModelBundle(stored.modelCompanion.bundle), replayed = emitModelFactoryPacket(bundle, input.request), companion = getIssuedModelFactoryPacketProvenance(replayed)
    if (replayed.root !== packet.root || stored.modelCompanion === null || labRoot("factory-model-companion-compare-v1", companion) !== labRoot("factory-model-companion-compare-v1", stored.modelCompanion)) return fail("RELOAD_MODEL")
  } else if (stored.producerIdentity === "emitTacticalFactoryPacket") {
    if (emitTacticalFactoryPacket(stored.producerInput as TacticalFactoryRequest).root !== packet.root || emitTacticalSource() !== stored.sourceUtf8) return fail("RELOAD_TACTICAL")
  } else if (stored.producerIdentity === "emitTeacherFactoryPacket") {
    const input = stored.producerInput as { student: DistilledLegalStudent; request: TeacherFactoryRequest }
    if (emitTeacherFactoryPacket(input.student, input.request).root !== packet.root || emitTeacherSource(input.student) !== stored.sourceUtf8) return fail("RELOAD_TEACHER")
  } else if (stored.producerIdentity === "admitQuarantinedIntakePacket") {
    const input = stored.producerInput as Omit<QuarantinedIntakePacket, "sourceBytes">
    const admission = reopenAcceptedQuarantinedIntakePacket({ ...input, packet, sourceBytes: bytes }, repository)
    if (admission.packetRoot !== packet.root || admission.sourceRoot !== stored.sourceRoot || admission.proposalRoot !== factoryProposalFromPacket(packet).root) return fail("RELOAD_INTAKE")
  } else return fail("RELOAD_PRODUCER")
  const { root, ...withoutRoot } = stored
  if (root !== recordRoot(withoutRoot)) return fail("RELOAD_ROOT")
  return issue(stored)
}

const help = `Usage: ingest-v1-38-factory-packet --repository <factory-directory> --request <canonical-json-file>\nNamed producers only; emitted source remains inert data.`
const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined }
const main = async () => {
  if (process.argv.includes("--help")) { process.stdout.write(`${help}\n`); return }
  const directory = argument("--repository"), requestPath = argument("--request")
  if (!directory || !requestPath) return fail("ARGUMENTS")
  const parsed = admitCanonicalJsonBytes(readFileSync(resolve(requestPath)), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("REQUEST_BYTES")
  let request = parsed.value as unknown as FactoryIngestionRequest
  if (request.producerIdentity === "admitQuarantinedIntakePacket" && request.producerInput && typeof request.producerInput === "object" && !Array.isArray(request.producerInput)) {
    const { sourceUtf8, ...input } = request.producerInput as Record<string, unknown>
    if (typeof sourceUtf8 !== "string") return fail("INTAKE_SOURCE")
    request = { ...request, producerInput: { ...input, sourceBytes: new TextEncoder().encode(sourceUtf8) } }
  }
  const result = await ingestNamedFactoryPacket(request, createFactoryRepository(resolve(directory)))
  process.stdout.write(`${JSON.stringify(result.disposition === "accepted" ? { disposition: result.disposition, artifactRoot: result.artifactRoot, packetRoot: result.packetRoot, sourceRoot: result.sourceRoot } : result)}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 })
