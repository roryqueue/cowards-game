import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryCalibrationManifest, type FactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_PREPARE_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
export interface FactoryCalibrationAuthorization {
  readonly schemaVersion: "factory-calibration-authorization-v1"; readonly root: LabRoot; readonly status: "authorized"
  readonly protocolArtifactRoot: LabRoot; readonly allocationArtifactRoot: LabRoot
  readonly studyPolicyRoot: LabRoot; readonly measurementPolicyRoot: LabRoot
  readonly maxAttempts: number; readonly maxInvocationsPerAttempt: number; readonly maxLifetimeMs: number
  readonly supervision: FactoryCalibrationManifest["supervision"]
  readonly ingestionArtifactRoots: readonly LabRoot[]
}
const authorizationRoot = (value: Omit<FactoryCalibrationAuthorization, "root">) => labRoot("factory-calibration-authorization-v1", value)
export const extractFactoryCalibrationAuthorization = (markdown: string): Readonly<FactoryCalibrationAuthorization> => {
  if (typeof markdown !== "string" || markdown.length > 1_048_576) return fail("MARKDOWN")
  const blocks = [...markdown.matchAll(/```json\n([^]*?)\n```/gu)]
  if (blocks.length !== 1) return fail("AUTHORIZATION_RECORD_COUNT")
  const bytes = new TextEncoder().encode(blocks[0]![1]!)
  const admitted = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!admitted.ok || !exact(admitted.value, ["schemaVersion", "root", "status", "protocolArtifactRoot", "allocationArtifactRoot", "studyPolicyRoot", "measurementPolicyRoot", "maxAttempts", "maxInvocationsPerAttempt", "maxLifetimeMs", "supervision", "ingestionArtifactRoots"])) return fail("AUTHORIZATION")
  const record = admitted.value as unknown as FactoryCalibrationAuthorization
  if (record.schemaVersion !== "factory-calibration-authorization-v1" || record.status !== "authorized" || ![record.root, record.protocolArtifactRoot, record.allocationArtifactRoot, record.studyPolicyRoot, record.measurementPolicyRoot].every(root) || !Array.isArray(record.ingestionArtifactRoots) || record.ingestionArtifactRoots.length < 1 || !record.ingestionArtifactRoots.every(root)) return fail("AUTHORIZATION")
  for (const bound of [record.maxAttempts, record.maxInvocationsPerAttempt, record.maxLifetimeMs]) if (!Number.isSafeInteger(bound) || bound < 1 || bound > 1_000_000) return fail("BOUND")
  const { root: _root, ...withoutRoot } = record
  if (record.root !== authorizationRoot(withoutRoot)) return fail("AUTHORIZATION_ROOT")
  return Object.freeze(record)
}
export const prepareFactoryCalibration = (markdown: string, repository: FactoryRepository): Readonly<{ manifest: FactoryCalibrationManifest; artifactRoot: LabRoot }> => {
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
  const authorizationArtifactRoot = publishFactoryArtifact(repository, (() => { const encoded = admitCanonicalJsonValue(authorization, { profile: "canonical-manifest" }); if (!encoded.ok) return fail("AUTHORIZATION_ARTIFACT"); return encoded.canonicalBytes })())
  const manifest = createFactoryCalibrationManifest({
    authorizationRoot: authorization.root, authorizationArtifactRoot,
    protocolRoot: protocol.root as LabRoot, protocolArtifactRoot: authorization.protocolArtifactRoot,
    allocationRoot: allocation.root as LabRoot, allocationArtifactRoot: authorization.allocationArtifactRoot,
    studyPolicyRoot: authorization.studyPolicyRoot, measurementPolicyRoot: authorization.measurementPolicyRoot,
    maxAttempts: authorization.maxAttempts, maxInvocationsPerAttempt: authorization.maxInvocationsPerAttempt, maxLifetimeMs: authorization.maxLifetimeMs,
    supervision: authorization.supervision, ingestions,
  })
  const encoded = admitCanonicalJsonValue(manifest, { profile: "canonical-manifest" })
  if (!encoded.ok) return fail("MANIFEST")
  return Object.freeze({ manifest, artifactRoot: publishFactoryArtifact(repository, encoded.canonicalBytes) })
}

const help = "Usage: prepare-v1-38-factory-calibration --repository <factory-directory> --decision <plan07-markdown>"
const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined }
const main = () => {
  if (process.argv.includes("--help")) { process.stdout.write(`${help}\n`); return }
  const directory = argument("--repository"), decision = argument("--decision")
  if (!directory || !decision) return fail("ARGUMENTS")
  const result = prepareFactoryCalibration(readFileSync(resolve(decision), "utf8"), createFactoryRepository(resolve(directory)))
  process.stdout.write(`${JSON.stringify({ manifestRoot: result.manifest.root, artifactRoot: result.artifactRoot })}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 } }
