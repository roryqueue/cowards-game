import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitFactoryCalibrationWorkload, createFactoryCalibrationManifest, createFactoryCalibrationWorkload, type FactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"
import { admitFactoryAuthoringAllocation, FACTORY_SOURCE_RECIPES, type FactoryAuthoringAllocation, type FactorySourceSlot } from "./author-v1-38-factory-model-source.js"
import { FACTORY_CONTROL_BASES, type FactoryControlSlot } from "./v1-38-factory-controls.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_PREPARE_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
export interface FreshFactoryCalibrationCell {
  readonly root: LabRoot; readonly slot: FactorySourceSlot; readonly block: "A" | "B"; readonly arenaId: "arena:smoke:v1" | "arena:standard-cross:v1"
  readonly candidateSide: "bottom" | "top"; readonly initialInitiative: "candidate" | "opponent"; readonly seed: "factory-264-control-v1"; readonly maxPhases: 1
}
/** Source-only declaration. These are not runtime invocations or Match records. */
export const createFreshFactoryCalibrationCells = (): readonly FreshFactoryCalibrationCell[] => Object.freeze(
  (Object.keys(FACTORY_SOURCE_RECIPES) as FactorySourceSlot[]).flatMap((slot, slotIndex) => [
    ["A", "arena:smoke:v1", "bottom"], ["A", "arena:smoke:v1", "bottom"], ["B", "arena:standard-cross:v1", "top"], ["B", "arena:standard-cross:v1", "top"],
  ].map(([block, arenaId, candidateSide], conditionIndex) => {
    const initialInitiative = conditionIndex % 2 === 0 ? "candidate" as const : "opponent" as const
    const value = { slot, block: block as "A" | "B", arenaId: arenaId as FreshFactoryCalibrationCell["arenaId"], candidateSide: candidateSide as "bottom" | "top", initialInitiative, seed: "factory-264-control-v1" as const, maxPhases: 1 as const, ordinal: slotIndex * 4 + conditionIndex }
    return Object.freeze({ ...value, root: labRoot("factory-calibration-cell-v1", value) })
  })),
)

export interface FreshFactoryCalibrationInput {
  readonly allocation: FactoryAuthoringAllocation
  readonly slotIngestionArtifactRoots: Readonly<Record<FactorySourceSlot, LabRoot>>
  readonly protocolRoot: LabRoot; readonly protocolArtifactRoot: LabRoot
  readonly studyPolicyRoot: LabRoot; readonly measurementPolicyRoot: LabRoot
  readonly opponentIdentityRoot: LabRoot
  readonly supervision: FactoryCalibrationManifest["supervision"]
}
/**
 * Plan-07-only preparation path. Unlike the historical generic preparer below,
 * it derives, publishes, and binds the complete approved 12-slot/48-cell set.
 * Ingestions reopen to their named base emitter or exact prescribed
 * calibration-only transformation. Observations remain a separate run gate.
 */
export const prepareFreshFactoryCalibration = (input: FreshFactoryCalibrationInput, repository: FactoryRepository): Readonly<{ manifest: FactoryCalibrationManifest; artifactRoot: LabRoot; cellRoots: readonly LabRoot[] }> => {
  const allocation = admitFactoryAuthoringAllocation(input.allocation), cells = createFreshFactoryCalibrationCells()
  const suppliedSlots = Object.keys(input.slotIngestionArtifactRoots).sort()
  if (suppliedSlots.join("\0") !== (Object.keys(FACTORY_SOURCE_RECIPES) as FactorySourceSlot[]).sort().join("\0") || cells.length !== allocation.workloadCount || allocation.maxInvocations !== 256 || allocation.maxLifetimeMs !== 120_000) return fail("FRESH_ALLOCATION")
  const suppliedRoots = suppliedSlots.map((slot) => input.slotIngestionArtifactRoots[slot as FactorySourceSlot])
  if (!suppliedRoots.every(root) || new Set(suppliedRoots).size !== 12 || ![input.protocolRoot, input.protocolArtifactRoot, input.studyPolicyRoot, input.measurementPolicyRoot, input.opponentIdentityRoot].every(root)) return fail("FRESH_SLOTS")
  const records = suppliedRoots.map((artifactRoot) => readFactoryIngestion(repository, artifactRoot))
  const bases = { S01: "emitTacticalFactoryPacket", S03: "emitTeacherFactoryPacket", S05: "emitModelFactoryPacket" } as const
  for (const [index, slot] of suppliedSlots.entries()) {
    const record = records[index]!
    if (record.packet.split !== "development") return fail("FRESH_SPLIT")
    if (Object.hasOwn(bases, slot)) {
      if (record.producerIdentity !== bases[slot as keyof typeof bases] || record.evidenceClass !== "real_producer") return fail("FRESH_BASE_MECHANISM")
    } else {
      const input = record.producerInput as { slot?: unknown; baseIngestionArtifactRoot?: unknown }
      if (record.producerIdentity !== "materializeFactoryCalibrationControl" || record.evidenceClass !== "calibration_only" || input.slot !== slot || input.baseIngestionArtifactRoot !== inputRootForBase(slot as FactoryControlSlot)) return fail("FRESH_CONTROL_PROVENANCE")
    }
  }
  function inputRootForBase(slot: FactoryControlSlot) { return input.slotIngestionArtifactRoots[FACTORY_CONTROL_BASES[slot]] }
  const protocol = admitCanonicalJsonBytes(readFactoryArtifact(repository, input.protocolArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!protocol.ok || !exact(protocol.value, ["schemaVersion", "root", "phase", "purpose", "split"])) return fail("FRESH_PROTOCOL")
  const protocolRecord = protocol.value as Record<string, unknown>, { root: protocolRoot, ...protocolValue } = protocolRecord
  if (protocolRecord.schemaVersion !== "factory-calibration-protocol-v1" || protocolRecord.phase !== "264" || protocolRecord.purpose !== "development-independence-calibration" || protocolRecord.split !== "development" || protocolRoot !== input.protocolRoot || protocolRoot !== labRoot("factory-calibration-protocol-v1", protocolValue)) return fail("FRESH_PROTOCOL")
  const ingestions = suppliedRoots.map((artifactRoot, index) => {
    const record = records[index]!
    return { artifactRoot, packetRoot: record.packetRoot, sourceRoot: record.sourceRoot, producerIdentity: record.producerIdentity, origin: record.origin, evidenceClass: record.evidenceClass }
  })
  const workloadArtifactRoots = cells.map((cell) => {
    const ingestionArtifactRoot = input.slotIngestionArtifactRoots[cell.slot]
    const workload = createFactoryCalibrationWorkload({
      candidateIngestionArtifactRoot: ingestionArtifactRoot, pairGroup: `${cell.slot.toLowerCase()}-${cell.block.toLowerCase()}`, pairAxis: "initialInitiative",
      condition: { arenaId: cell.arenaId, seed: cell.seed, candidateSide: cell.candidateSide, initialInitiative: cell.initialInitiative, maxPhases: cell.maxPhases },
      opponent: { kind: "fixed_mechanics", opponentId: "factory-fixed-mechanics-v1", identityRoot: input.opponentIdentityRoot }, budget: { maxInvocations: 256, maxLifetimeMs: 120_000 },
      lineageManifestArtifactRoot: null, dependencyManifestArtifactRoot: null,
    })
    return { workload, artifactRoot: publishFactoryArtifact(repository, (() => { const encoded = admitCanonicalJsonValue(workload, { profile: "canonical-manifest" }); if (!encoded.ok) return fail("FRESH_WORKLOAD"); return encoded.canonicalBytes })()) }
  })
  if (workloadArtifactRoots.length !== 48 || new Set(workloadArtifactRoots.map((entry) => entry.artifactRoot)).size !== 48) return fail("FRESH_WORKLOADS")
  const allocationEncoded = admitCanonicalJsonValue(allocation, { profile: "canonical-manifest" }); if (!allocationEncoded.ok) return fail("FRESH_ALLOCATION_BYTES")
  const allocationArtifactRoot = publishFactoryArtifact(repository, allocationEncoded.canonicalBytes)
  const authorizationValue = { schemaVersion: "factory-calibration-authorization-v2" as const, status: "authorized" as const, allocationRoot: allocation.root, sourceSlots: allocation.sourceSlots, slotIngestionArtifactRoots: input.slotIngestionArtifactRoots, cellRoots: cells.map((cell) => cell.root), workloadArtifactRoots: workloadArtifactRoots.map((entry) => entry.artifactRoot), geometryDesign: "two_geometry_side_confounded_pilot" as const, competitiveClaim: "none" as const }
  const authorization = { ...authorizationValue, root: labRoot("factory-calibration-authorization-v2", authorizationValue) }
  const authorizationEncoded = admitCanonicalJsonValue(authorization, { profile: "canonical-manifest" }); if (!authorizationEncoded.ok) return fail("FRESH_AUTHORIZATION")
  const authorizationArtifactRoot = publishFactoryArtifact(repository, authorizationEncoded.canonicalBytes)
  const manifest = createFactoryCalibrationManifest({ authorizationRoot: authorization.root, authorizationArtifactRoot, protocolRoot: input.protocolRoot, protocolArtifactRoot: input.protocolArtifactRoot, allocationRoot: allocation.root, allocationArtifactRoot, studyPolicyRoot: input.studyPolicyRoot, measurementPolicyRoot: input.measurementPolicyRoot, maxAttempts: 48, maxInvocationsPerAttempt: 256, maxLifetimeMs: 120_000, supervision: input.supervision, ingestions, workloads: workloadArtifactRoots.map(({ workload, artifactRoot }) => ({ artifactRoot, root: workload.root, candidateIngestionArtifactRoot: workload.candidateIngestionArtifactRoot, pairGroup: workload.pairGroup })) })
  const encoded = admitCanonicalJsonValue(manifest, { profile: "canonical-manifest" }); if (!encoded.ok) return fail("FRESH_MANIFEST")
  return Object.freeze({ manifest, artifactRoot: publishFactoryArtifact(repository, encoded.canonicalBytes), cellRoots: Object.freeze(cells.map((cell) => cell.root)) })
}
export interface FactoryCalibrationAuthorization {
  readonly schemaVersion: "factory-calibration-authorization-v1"; readonly root: LabRoot; readonly status: "authorized"
  readonly protocolArtifactRoot: LabRoot; readonly allocationArtifactRoot: LabRoot
  readonly studyPolicyRoot: LabRoot; readonly measurementPolicyRoot: LabRoot
  readonly maxAttempts: number; readonly maxInvocationsPerAttempt: number; readonly maxLifetimeMs: number
  readonly supervision: FactoryCalibrationManifest["supervision"]
  readonly ingestionArtifactRoots: readonly LabRoot[]
  /** Predeclared canonical attempt records, never a runner-generated schedule. */
  readonly workloadArtifactRoots: readonly LabRoot[]
}
const authorizationRoot = (value: Omit<FactoryCalibrationAuthorization, "root">) => labRoot("factory-calibration-authorization-v1", value)
export const extractFactoryCalibrationAuthorization = (markdown: string): Readonly<FactoryCalibrationAuthorization> => {
  if (typeof markdown !== "string" || markdown.length > 1_048_576) return fail("MARKDOWN")
  const blocks = [...markdown.matchAll(/```json\n([^]*?)\n```/gu)]
  if (blocks.length !== 1) return fail("AUTHORIZATION_RECORD_COUNT")
  const bytes = new TextEncoder().encode(blocks[0]![1]!)
  const admitted = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!admitted.ok || !exact(admitted.value, ["schemaVersion", "root", "status", "protocolArtifactRoot", "allocationArtifactRoot", "studyPolicyRoot", "measurementPolicyRoot", "maxAttempts", "maxInvocationsPerAttempt", "maxLifetimeMs", "supervision", "ingestionArtifactRoots", "workloadArtifactRoots"])) return fail("AUTHORIZATION")
  const record = admitted.value as unknown as FactoryCalibrationAuthorization
  if (record.schemaVersion !== "factory-calibration-authorization-v1" || record.status !== "authorized" || ![record.root, record.protocolArtifactRoot, record.allocationArtifactRoot, record.studyPolicyRoot, record.measurementPolicyRoot].every(root) || !Array.isArray(record.ingestionArtifactRoots) || record.ingestionArtifactRoots.length < 1 || !record.ingestionArtifactRoots.every(root) || !Array.isArray(record.workloadArtifactRoots) || record.workloadArtifactRoots.length < 1 || !record.workloadArtifactRoots.every(root)) return fail("AUTHORIZATION")
  for (const bound of [record.maxAttempts, record.maxInvocationsPerAttempt, record.maxLifetimeMs]) if (!Number.isSafeInteger(bound) || bound < 1 || bound > 1_000_000) return fail("BOUND")
  const { root: _root, ...withoutRoot } = record
  if (record.root !== authorizationRoot(withoutRoot)) return fail("AUTHORIZATION_ROOT")
  return Object.freeze(record)
}
/** Historical mechanics fixture reader; never the fresh Plan07 route or CLI. */
export const prepareHistoricalFactoryCalibration = (markdown: string, repository: FactoryRepository): Readonly<{ manifest: FactoryCalibrationManifest; artifactRoot: LabRoot }> => {
  const authorization = extractFactoryCalibrationAuthorization(markdown)
  const readRecord = (artifactRoot: LabRoot) => {
    const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return fail("FACT_ARTIFACT")
    return parsed.value as Record<string, unknown>
  }
  const protocol = readRecord(authorization.protocolArtifactRoot)
  if (!exact(protocol, ["schemaVersion", "root", "phase", "purpose", "split"]) || protocol.schemaVersion !== "factory-calibration-protocol-v1" || protocol.phase !== "264" || protocol.purpose !== "development-independence-calibration" || protocol.split !== "development" || !root(protocol.root)) return fail("PROTOCOL")
  const { root: _protocolRoot, ...protocolValue } = protocol
  if (protocol.root !== labRoot("factory-calibration-protocol-v1", protocolValue)) return fail("PROTOCOL_ROOT")
  const allocation = readRecord(authorization.allocationArtifactRoot)
  if (!exact(allocation, ["schemaVersion", "root", "protocolRoot", "phase", "maxAttempts", "maxInvocationsPerAttempt", "maxLifetimeMs"]) || allocation.schemaVersion !== "factory-calibration-allocation-v1" || allocation.phase !== "264" || allocation.protocolRoot !== protocol.root || !root(allocation.root) || allocation.maxAttempts !== authorization.maxAttempts || allocation.maxInvocationsPerAttempt !== authorization.maxInvocationsPerAttempt || allocation.maxLifetimeMs !== authorization.maxLifetimeMs) return fail("ALLOCATION")
  const { root: _allocationRoot, ...allocationValue } = allocation
  if (allocation.root !== labRoot("factory-calibration-allocation-v1", allocationValue)) return fail("ALLOCATION_ROOT")
  const policy = (relative: string, expected: LabRoot, expectedByteRoot: string) => {
    const bytes = readFileSync(new URL(relative, import.meta.url))
    if (`sha256:${createHash("sha256").update(bytes).digest("hex")}` !== expectedByteRoot) return fail("POLICY_BYTES")
    let value: unknown
    try { value = JSON.parse(bytes.toString("utf8")) } catch { return fail("POLICY") }
    const parsed = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
    if (!parsed.ok || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value) || (parsed.value as Record<string, unknown>).policyRoot !== expected) return fail("POLICY")
  }
  policy("../.planning/artifacts/v1.38-pre-search-study-policy.json", authorization.studyPolicyRoot, "sha256:d1354b1df6e5e2ae615e6423450a32075e8dddf028931192db18d6f5ac9e648b")
  policy("../.planning/artifacts/v1.38-pre-search-measurement-policy.json", authorization.measurementPolicyRoot, "sha256:916d25df839213526a5e5cdc102ec890bf18c6e5ea7477f54f673e82d970227d")
  const ingestions = authorization.ingestionArtifactRoots.map((artifactRoot) => {
    const record = readFactoryIngestion(repository, artifactRoot)
    return { artifactRoot, packetRoot: record.packetRoot, sourceRoot: record.sourceRoot, producerIdentity: record.producerIdentity, origin: record.origin, evidenceClass: record.evidenceClass }
  })
  const ingestionRoots = new Set(ingestions.map((entry) => entry.artifactRoot))
  if (new Set(authorization.workloadArtifactRoots).size !== authorization.workloadArtifactRoots.length || authorization.workloadArtifactRoots.length > authorization.maxAttempts) return fail("WORKLOADS")
  const workloads = authorization.workloadArtifactRoots.map((artifactRoot) => {
    const workload = admitFactoryCalibrationWorkload(readRecord(artifactRoot))
    if (!ingestionRoots.has(workload.candidateIngestionArtifactRoot) || workload.budget.maxInvocations > authorization.maxInvocationsPerAttempt || workload.budget.maxLifetimeMs > authorization.maxLifetimeMs) return fail("WORKLOAD_BINDING")
    return { artifactRoot, root: workload.root, candidateIngestionArtifactRoot: workload.candidateIngestionArtifactRoot, pairGroup: workload.pairGroup }
  })
  const authorizationArtifactRoot = publishFactoryArtifact(repository, (() => { const encoded = admitCanonicalJsonValue(authorization, { profile: "canonical-manifest" }); if (!encoded.ok) return fail("AUTHORIZATION_ARTIFACT"); return encoded.canonicalBytes })())
  const manifest = createFactoryCalibrationManifest({
    authorizationRoot: authorization.root, authorizationArtifactRoot,
    protocolRoot: protocol.root as LabRoot, protocolArtifactRoot: authorization.protocolArtifactRoot,
    allocationRoot: allocation.root as LabRoot, allocationArtifactRoot: authorization.allocationArtifactRoot,
    studyPolicyRoot: authorization.studyPolicyRoot, measurementPolicyRoot: authorization.measurementPolicyRoot,
    maxAttempts: authorization.maxAttempts, maxInvocationsPerAttempt: authorization.maxInvocationsPerAttempt, maxLifetimeMs: authorization.maxLifetimeMs,
    supervision: authorization.supervision, ingestions, workloads,
  })
  const encoded = admitCanonicalJsonValue(manifest, { profile: "canonical-manifest" })
  if (!encoded.ok) return fail("MANIFEST")
  return Object.freeze({ manifest, artifactRoot: publishFactoryArtifact(repository, encoded.canonicalBytes) })
}

/** Actual Plan07 entrypoint accepts only the complete fresh canonical input. */
export const prepareFactoryCalibration = (bytes: Uint8Array, repository: FactoryRepository) => {
  const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !exact(parsed.value, ["allocation", "slotIngestionArtifactRoots", "protocolRoot", "protocolArtifactRoot", "studyPolicyRoot", "measurementPolicyRoot", "opponentIdentityRoot", "supervision"])) return fail("FRESH_INPUT")
  return prepareFreshFactoryCalibration(parsed.value as unknown as FreshFactoryCalibrationInput, repository)
}
const help = "Usage: prepare-v1-38-factory-calibration --repository <factory-directory> --fresh-input <canonical-json-file>"
const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined }
const main = () => {
  if (process.argv.includes("--help")) { process.stdout.write(`${help}\n`); return }
  const directory = argument("--repository"), freshInput = argument("--fresh-input")
  if (!directory || !freshInput || process.argv.includes("--decision")) return fail("ARGUMENTS")
  const result = prepareFactoryCalibration(readFileSync(resolve(freshInput)), createFactoryRepository(resolve(directory)))
  process.stdout.write(`${JSON.stringify({ manifestRoot: result.manifest.root, artifactRoot: result.artifactRoot })}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 } }
