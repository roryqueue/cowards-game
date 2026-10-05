/** Private, prospective source snapshots. Static validation never executes authored code. */
import { constants, openSync, closeSync, readFileSync, fsyncSync, lstatSync, realpathSync, fstatSync } from "node:fs"
import { join, resolve } from "node:path"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, exactLabKeys, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { factoryProposalFromPacket, FactoryOraclePacketSchema, FactoryValidationEvidenceSchema, type FactoryOraclePacket, type FactoryProposal, type FactoryValidationEvidence } from "../../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot, deriveFactoryValidationRoot } from "../../packages/strategy-lab/src/factory/identity.js"
import { deriveFactorySourceStructureRoot } from "../../packages/strategy-lab/src/factory/fingerprint.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { leanBytesRoot, leanCanonicalBytes, writeLeanAll, assertLeanPublicationCapacity, type LeanExperimentLedger } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { validateLeanColdReuse, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"

const fail = (): never => { throw new TypeError("LEAN_BASELINE_SOURCE") }
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const role = (v: unknown): v is string => typeof v === "string" && /^(?:cold-opponent|probe|tactical-[0-3]|teacher-[0-3]|response-[0-3]|initial-tactical|initial-teacher|final-response)$/u.test(v)
export interface LeanBaselineSource {
  readonly schemaVersion: "lean-baseline-source-v1"
  readonly role: string
  readonly coldRoot: LabRoot
  readonly implementationRoot: LabRoot
  readonly source: string
  readonly sourceRoot: LabRoot
  readonly structureRoot: LabRoot
  readonly packet: FactoryOraclePacket
  readonly proposal: FactoryProposal
  readonly validation: FactoryValidationEvidence
  readonly root: LabRoot
}

export const buildLeanBaselineSource = (input: { role: string; source: string; coldRoot: LabRoot; implementationRoot: LabRoot }): LeanBaselineSource => {
  if (!exactLabKeys(input, ["role", "source", "coldRoot", "implementationRoot"]) || !role(input.role) || !root(input.coldRoot) || !root(input.implementationRoot) || typeof input.source !== "string") return fail()
  const bytes = new TextEncoder().encode(input.source), sourceRoot = leanBytesRoot(bytes)
  if (!bytes.length || bytes.length > 65536) return fail()
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: input.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || `sha256:${revision.sourceHash}` !== sourceRoot) return fail()
  const provenance = labRoot("lean-baseline-nonmodel-provenance-v1", { coldRoot: input.coldRoot, implementationRoot: input.implementationRoot, role: input.role })
  const body = {
    schemaVersion: "factory-oracle-packet-v1" as const, privacy: "private_offline" as const,
    oracleFamily: input.role.startsWith("teacher") || input.role === "initial-teacher" ? "lean-teacher" : input.role.includes("response") ? "lean-legal-planner" : "lean-tactical",
    doctrineFamily: "lean-cold-current", source: { root: sourceRoot, sha256: sourceRoot, byteLength: bytes.length, encoding: "utf8" as const },
    provider: { providerId: "lean-offline-mechanics", modelId: "no-model", modelVersion: "none", settingsRoot: provenance, promptRoot: provenance, contextRoot: input.coldRoot },
    inheritedAuthority: { admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot, sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, runtimeAbi: LAB_VERSIONS.runtimeAbi, labSchema: LAB_VERSIONS.schema },
    build: { buildRoot: input.implementationRoot, toolchainRoot: labRoot("lean-baseline-toolchain-v1", revision.metadata.sourceArtifact), compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot },
    versions: { factory: "factory-v1" as const, algorithm: "lean-cold-training-v1", schema: "factory-schema-v1" as const },
    nativeLane: { language: "typescript" as const, providerId: "lean-offline-mechanics", runtimeAbi: LAB_VERSIONS.runtimeAbi, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const },
    lineage: { predecessorRoot: input.coldRoot, correctionRoot: null, retryParentRoot: null }, split: "development" as const,
  }
  const packet = FactoryOraclePacketSchema.parse({ ...body, root: deriveFactoryOraclePacketRoot(body) })
  const proposal = factoryProposalFromPacket(packet)
  const binding = { proposalRoot: proposal.root, sourceRoot, revisionId: revision.id, validation: revision.validation, exactNativeLane: proposal.nativeLane }
  const validationBody = { schemaVersion: "factory-validation-evidence-v1" as const, privacy: "private_offline" as const, proposalRoot: proposal.root, validationRoot: labRoot("factory-selected-source-validation-v1", binding), status: "valid" as const, exactNativeLane: proposal.nativeLane, evidenceRoot: labRoot("factory-selected-source-validation-evidence-v1", binding) }
  const validation = FactoryValidationEvidenceSchema.parse({ ...validationBody, root: deriveFactoryValidationRoot(validationBody) })
  authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: bytes }), validation })
  const value = { schemaVersion: "lean-baseline-source-v1" as const, ...input, sourceRoot, structureRoot: deriveFactorySourceStructureRoot(bytes), packet, proposal, validation }
  return Object.freeze({ ...value, root: labRoot("lean-baseline-source-v1", value) })
}

export const validateLeanBaselineSource = (value: unknown): LeanBaselineSource => {
  if (!exactLabKeys(value, ["schemaVersion", "role", "source", "coldRoot", "implementationRoot", "sourceRoot", "structureRoot", "packet", "proposal", "validation", "root"])) return fail()
  const v = value as unknown as LeanBaselineSource
  const expected = buildLeanBaselineSource({ role: v.role, source: v.source, coldRoot: v.coldRoot, implementationRoot: v.implementationRoot })
  if (labRoot("lean-baseline-source-admission-v1", value) !== labRoot("lean-baseline-source-admission-v1", expected)) return fail()
  return expected
}

export const publishLeanBaselineSource = (ledger: LeanExperimentLedger, value: LeanBaselineSource): void => {
  const v = validateLeanBaselineSource(value), bytes = leanCanonicalBytes(v)
  const allocation = ledger.allocation as unknown as { schemaVersion: string; coldRoot?: LabRoot; sourceRoot: LabRoot }
  if (!["lean-current-baseline-allocation-v1", "lean-correction-baseline-allocation-v1", "lean-correction-supervisor-baseline-allocation-v2", "lean-correction-supervisor-baseline-allocation-v3", "lean-correction-supervisor-baseline-allocation-v4"].includes(allocation.schemaVersion) || v.coldRoot !== allocation.coldRoot || v.implementationRoot !== allocation.sourceRoot) return fail()
  publishSourceBytes(ledger, v, bytes)
}

/** A checked outer grant, never a relabelled packet, admits only its exact seven
 * original snapshots. Default publication above still requires current provenance. */
export const publishLeanReusedBaselineSource = (ledger: LeanExperimentLedger, value: LeanBaselineSource, reuse: LeanColdReuse): void => {
  const allocation = ledger.allocation as unknown as { schemaVersion: string; coldRoot?: LabRoot; sourceRoot: LabRoot; seed?: string }
  const admitted = validateLeanColdReuse(reuse, allocation.sourceRoot), v = validateLeanBaselineSource(value)
  if (!["lean-current-baseline-allocation-v1", "lean-correction-baseline-allocation-v1", "lean-correction-diagnostic-allocation-v1", "lean-correction-supervisor-diagnostic-allocation-v2", "lean-correction-supervisor-diagnostic-allocation-v3", "lean-correction-supervisor-baseline-allocation-v2", "lean-correction-supervisor-baseline-allocation-v3", "lean-correction-supervisor-diagnostic-allocation-v4", "lean-correction-supervisor-baseline-allocation-v4"].includes(allocation.schemaVersion) || allocation.coldRoot !== admitted.grant.coldRoot || allocation.seed !== admitted.grant.seed || !admitted.sources.some(original => original.root === v.root && original.role === v.role)) return fail()
  publishSourceBytes(ledger, v, leanCanonicalBytes(v))
}

/** Pure current-admission seam for a correction dispatcher/reader. This returns
 * the original snapshot, not a newly authored packet or a runtime capability. */
export const validateLeanReusedBaselineSource = (value: unknown, reuse: LeanColdReuse, newSourceRoot: LabRoot): LeanBaselineSource => {
  const admitted = validateLeanColdReuse(reuse, newSourceRoot), source = validateLeanBaselineSource(value)
  const original = admitted.sources.find(snapshot => snapshot.root === source.root && snapshot.role === source.role)
  if (!original) return fail()
  return original
}

const publishSourceBytes = (ledger: LeanExperimentLedger, v: LeanBaselineSource, bytes: Uint8Array): void => {
  assertLeanPublicationCapacity(ledger, bytes.length)
  const fd = openSync(join(ledger.directory, `source-${v.role}.json`), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
  const parent = openSync(ledger.directory, constants.O_RDONLY)
  try { fsyncSync(parent) } finally { closeSync(parent) }
}

export const readLeanBaselineSource = (directory: string, name: string): LeanBaselineSource => {
  if (!role(name)) return fail()
  const path = resolve(directory, `source-${name}.json`), s = lstatSync(path)
  if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || (s.mode & 0o777) !== 0o600 || s.size > 262144 || realpathSync(path) !== path) return fail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = fstatSync(fd)
    if (!before.isFile() || before.dev !== s.dev || before.ino !== s.ino || before.nlink !== 1 || (before.mode & 0o777) !== 0o600 || before.size !== s.size) return fail()
    const bytes = readFileSync(fd)
    const after = fstatSync(fd)
    if (bytes.length !== before.size || bytes.length > 262144 || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs || after.nlink !== 1) return fail()
    const value: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"))
    if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(value))) return fail()
    return validateLeanBaselineSource(value)
  } finally { closeSync(fd) }
}
