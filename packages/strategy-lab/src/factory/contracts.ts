import { admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import {
  deriveFactoryCandidateRoot,
  deriveFactoryOraclePacketRoot,
  deriveFactoryProposalRoot,
  deriveFactoryValidationRoot,
} from "./identity.js"

type RecordValue = Record<string, unknown>
const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const fail = (code = "ENVELOPE_INVALID"): never => { throw new TypeError(`FACTORY_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const name = (value: unknown) => typeof value === "string" && NAME.test(value)
const exact = (value: unknown, keys: readonly string[]): value is RecordValue => exactLabKeys(value, keys)
const text = (value: unknown, max = 128) => typeof value === "string" && value.length > 0 && value.length <= max
const bound = <T>(validator: (value: unknown) => T) => Object.freeze({
  parse(value: unknown): Readonly<T> {
    const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
    if (!admitted.ok || admitted.canonicalByteLength > 262144) return fail("CANONICAL_VALUE")
    return freezeLabValue(validator(admitted.value))
  },
  safeParse(value: unknown) {
    try { return { success: true as const, data: this.parse(value) } }
    catch { return { success: false as const, error: new TypeError("FACTORY_ENVELOPE_INVALID") } }
  },
})

export type FactorySplit = "development" | "validation" | "probe"
export type FactoryDisposition = "accepted" | "rejected" | "invalid" | "duplicate" | "legal_but_weak" | "retried" | "unresolved" | "player_violation" | "system_failure"
export interface FactorySourceIdentity { root: LabRoot; sha256: LabRoot; byteLength: number; encoding: "utf8" }
export interface FactoryBuildIdentity { buildRoot: LabRoot; toolchainRoot: LabRoot; compatibilityTupleRoot: LabRoot }
export type FactoryProviderIdentity =
  | { providerId: string; modelId: string; modelVersion: string; settingsRoot: LabRoot; promptRoot: LabRoot; contextRoot: LabRoot }
  | { providerId: string; modelId: string; modelVersion: null; settingsRoot: LabRoot; promptRoot: LabRoot; contextRoot: LabRoot; servingSnapshot: { availability: "unavailable" } }
/**
 * Pins inherited execution authority. These fields intentionally do not
 * describe an oracle's strategic algorithm: a new oracle may have new
 * strategy metadata, but it may not silently change the admitted engine,
 * runtime, or source-closure contract.
 */
export interface FactoryInheritedAuthority {
  admittedRoot: LabRoot; sourceClosureRoot: LabRoot; compatibilityTupleRoot: LabRoot;
  runtimeProfileRoot: LabRoot; runtimeAbi: typeof LAB_VERSIONS.runtimeAbi; labSchema: typeof LAB_VERSIONS.schema;
}
export interface FactoryVersions { factory: "factory-v1"; algorithm: string; schema: "factory-schema-v1" }
export interface FactoryNativeLane { language: "javascript" | "typescript" | "python" | "rust" | "zig"; providerId: string; runtimeAbi: string; runtimeProfileRoot: LabRoot; translation: "none" }
export interface FactoryLineage { predecessorRoot: LabRoot; correctionRoot: LabRoot | null; retryParentRoot: LabRoot | null }
export interface FactoryFingerprintRoots { sourceStructureRoot: LabRoot; lineageRoot: LabRoot; dependencyRoot: LabRoot; legalInputDecisionRoot: LabRoot; chronicleBehaviorRoot: LabRoot; matchupResponseRoot: LabRoot }

const source = (value: unknown): FactorySourceIdentity => {
  if (!exact(value, ["root", "sha256", "byteLength", "encoding"]) || !root(value.root) || value.root !== value.sha256 || !Number.isSafeInteger(value.byteLength) || Number(value.byteLength) < 1 || Number(value.byteLength) > 65536 || value.encoding !== "utf8") return fail("SOURCE_IDENTITY")
  return value as unknown as FactorySourceIdentity
}
const build = (value: unknown): FactoryBuildIdentity => {
  if (!exact(value, ["buildRoot", "toolchainRoot", "compatibilityTupleRoot"]) || ![value.buildRoot, value.toolchainRoot, value.compatibilityTupleRoot].every(root)) return fail("BUILD_IDENTITY")
  return value as unknown as FactoryBuildIdentity
}
const inheritedAuthority = (value: unknown): FactoryInheritedAuthority => {
  const expected: FactoryInheritedAuthority = {
    admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot,
    sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot,
    compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
    runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
    runtimeAbi: LAB_VERSIONS.runtimeAbi,
    labSchema: LAB_VERSIONS.schema,
  }
  if (!exact(value, Object.keys(expected)) ||
      Object.entries(expected).some(([key, expectedValue]) => (value as RecordValue)[key] !== expectedValue)) return fail("INHERITED_AUTHORITY")
  return value as unknown as FactoryInheritedAuthority
}
const versions = (value: unknown): FactoryVersions => {
  if (!exact(value, ["factory", "algorithm", "schema"]) || value.factory !== "factory-v1" || value.schema !== "factory-schema-v1" || !name(value.algorithm)) return fail("VERSIONS")
  return value as unknown as FactoryVersions
}
const lane = (value: unknown): FactoryNativeLane => {
  if (!exact(value, ["language", "providerId", "runtimeAbi", "runtimeProfileRoot", "translation"]) || !["javascript", "typescript", "python", "rust", "zig"].includes(String(value.language)) || !name(value.providerId) || !text(value.runtimeAbi) || !root(value.runtimeProfileRoot) || value.translation !== "none") return fail("NATIVE_LANE")
  return value as unknown as FactoryNativeLane
}
const lineage = (value: unknown): FactoryLineage => {
  if (!exact(value, ["predecessorRoot", "correctionRoot", "retryParentRoot"]) || !root(value.predecessorRoot) || ![value.correctionRoot, value.retryParentRoot].every((entry) => entry === null || root(entry))) return fail("LINEAGE")
  return value as unknown as FactoryLineage
}
const fingerprints = (value: unknown): FactoryFingerprintRoots => {
  const keys = ["sourceStructureRoot", "lineageRoot", "dependencyRoot", "legalInputDecisionRoot", "chronicleBehaviorRoot", "matchupResponseRoot"] as const
  if (!exact(value, keys) || !keys.every((key) => root(value[key]))) return fail("FINGERPRINTS")
  return value as unknown as FactoryFingerprintRoots
}

export interface FactoryOraclePacket {
  schemaVersion: "factory-oracle-packet-v1"; privacy: "private_offline"; root: LabRoot; oracleFamily: string; doctrineFamily: string;
  source: FactorySourceIdentity; provider: FactoryProviderIdentity;
  inheritedAuthority: FactoryInheritedAuthority; build: FactoryBuildIdentity; versions: FactoryVersions; nativeLane: FactoryNativeLane; lineage: FactoryLineage; split: FactorySplit;
}
export const FactoryOraclePacketSchema = bound<FactoryOraclePacket>((value) => {
  const keys = ["schemaVersion", "privacy", "root", "oracleFamily", "doctrineFamily", "source", "provider", "inheritedAuthority", "build", "versions", "nativeLane", "lineage", "split"] as const
  if (!exact(value, keys) || value.schemaVersion !== "factory-oracle-packet-v1" || value.privacy !== "private_offline" || !root(value.root) || !name(value.oracleFamily) || !name(value.doctrineFamily) || !["development", "validation", "probe"].includes(String(value.split))) return fail("PACKET")
  source(value.source); const authority = inheritedAuthority(value.inheritedAuthority); const buildIdentity = build(value.build); versions(value.versions); const nativeLane = lane(value.nativeLane); lineage(value.lineage)
  const providerKeys = exact(value.provider, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot"])
    ? "v1"
    : exact(value.provider, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot", "servingSnapshot"])
      ? "v2-unavailable"
      : "invalid"
  const providerIdentity = value.provider as FactoryProviderIdentity
  if (providerKeys === "invalid" || !name(providerIdentity.providerId) || !text(providerIdentity.modelId) ||
      (providerKeys === "v1" ? !text(providerIdentity.modelVersion) : providerIdentity.modelVersion !== null || !exact(providerIdentity.servingSnapshot, ["availability"]) || providerIdentity.servingSnapshot.availability !== "unavailable") ||
      ![providerIdentity.settingsRoot, providerIdentity.promptRoot, providerIdentity.contextRoot].every(root) || nativeLane.providerId !== providerIdentity.providerId ||
      buildIdentity.compatibilityTupleRoot !== authority.compatibilityTupleRoot || nativeLane.runtimeProfileRoot !== authority.runtimeProfileRoot || nativeLane.runtimeAbi !== authority.runtimeAbi || value.root !== deriveFactoryOraclePacketRoot(value)) return fail("PACKET")
  return value as unknown as FactoryOraclePacket
})

export interface FactoryProposal {
  schemaVersion: "factory-proposal-v1"; privacy: "private_offline"; root: LabRoot; packetRoot: LabRoot; oracleFamily: string; doctrineFamily: string; source: FactorySourceIdentity; build: FactoryBuildIdentity; versions: FactoryVersions; nativeLane: FactoryNativeLane; lineage: FactoryLineage; split: FactorySplit;
}
/** A proposal is a complete non-authoritative projection of one parsed packet. */
export const factoryProposalFromPacket = (packet: FactoryOraclePacket): FactoryProposal => {
  const parsed = FactoryOraclePacketSchema.parse(packet)
  const value = {
    schemaVersion: "factory-proposal-v1" as const, privacy: "private_offline" as const, root: fixtureRoot("0"),
    packetRoot: parsed.root, oracleFamily: parsed.oracleFamily, doctrineFamily: parsed.doctrineFamily,
    source: parsed.source, build: parsed.build, versions: parsed.versions, nativeLane: parsed.nativeLane,
    lineage: parsed.lineage, split: parsed.split,
  }
  return FactoryProposalSchema.parse({ ...value, root: deriveFactoryProposalRoot(value) })
}
export const FactoryProposalSchema = bound<FactoryProposal>((value) => {
  const keys = ["schemaVersion", "privacy", "root", "packetRoot", "oracleFamily", "doctrineFamily", "source", "build", "versions", "nativeLane", "lineage", "split"] as const
  if (!exact(value, keys) || value.schemaVersion !== "factory-proposal-v1" || value.privacy !== "private_offline" || !root(value.root) || !root(value.packetRoot) || !name(value.oracleFamily) || !name(value.doctrineFamily) || !["development", "validation", "probe"].includes(String(value.split))) return fail("PROPOSAL")
  source(value.source); build(value.build); versions(value.versions); lane(value.nativeLane); lineage(value.lineage)
  if (value.root !== deriveFactoryProposalRoot(value)) return fail("PROPOSAL_ROOT")
  return value as unknown as FactoryProposal
})

export interface FactoryValidationEvidence { schemaVersion: "factory-validation-evidence-v1"; privacy: "private_offline"; root: LabRoot; proposalRoot: LabRoot; validationRoot: LabRoot; status: "valid" | "invalid" | "blocked"; exactNativeLane: FactoryNativeLane; evidenceRoot: LabRoot }
export const FactoryValidationEvidenceSchema = bound<FactoryValidationEvidence>((value) => {
  const keys = ["schemaVersion", "privacy", "root", "proposalRoot", "validationRoot", "status", "exactNativeLane", "evidenceRoot"] as const
  if (!exact(value, keys) || value.schemaVersion !== "factory-validation-evidence-v1" || value.privacy !== "private_offline" || ![value.root, value.proposalRoot, value.validationRoot, value.evidenceRoot].every(root) || !["valid", "invalid", "blocked"].includes(String(value.status))) return fail("VALIDATION")
  lane(value.exactNativeLane)
  if (value.root !== deriveFactoryValidationRoot(value)) return fail("VALIDATION_ROOT")
  return value as unknown as FactoryValidationEvidence
})

export interface FactoryCandidate { schemaVersion: "factory-candidate-v1"; privacy: "private_offline"; root: LabRoot; proposal: FactoryProposal; validation: FactoryValidationEvidence; supervisionReceiptRoot: LabRoot; fingerprints: FactoryFingerprintRoots; lineage: FactoryLineage }
export const FactoryCandidateSchema = bound<FactoryCandidate>((value) => {
  const keys = ["schemaVersion", "privacy", "root", "proposal", "validation", "supervisionReceiptRoot", "fingerprints", "lineage"] as const
  if (!exact(value, keys) || value.schemaVersion !== "factory-candidate-v1" || value.privacy !== "private_offline" || !root(value.root) || !root(value.supervisionReceiptRoot)) return fail("CANDIDATE")
  const proposal = FactoryProposalSchema.parse(value.proposal), validation = FactoryValidationEvidenceSchema.parse(value.validation)
  if (validation.proposalRoot !== proposal.root || validation.status !== "valid" ||
      labRoot("factory-native-lane-v1", validation.exactNativeLane) !== labRoot("factory-native-lane-v1", proposal.nativeLane) ||
      labRoot("factory-lineage-v1", value.lineage) !== labRoot("factory-lineage-v1", proposal.lineage)) return fail("CANDIDATE_VALIDATION")
  fingerprints(value.fingerprints); lineage(value.lineage)
  if (value.root !== deriveFactoryCandidateRoot(value)) return fail("CANDIDATE_ROOT")
  return value as unknown as FactoryCandidate
})

const fixtureRoot = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
export const factoryOraclePacketFixture = (): FactoryOraclePacket => {
  const value = { schemaVersion: "factory-oracle-packet-v1" as const, privacy: "private_offline" as const, root: fixtureRoot("a"), oracleFamily: "fixture-oracle", doctrineFamily: "fixture-doctrine", source: { root: fixtureRoot("b"), sha256: fixtureRoot("b"), byteLength: 1, encoding: "utf8" as const }, provider: { providerId: "fixture-provider", modelId: "fixture-model", modelVersion: "v1", settingsRoot: fixtureRoot("c"), promptRoot: fixtureRoot("d"), contextRoot: fixtureRoot("e") }, inheritedAuthority: { admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot, sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, runtimeAbi: LAB_VERSIONS.runtimeAbi, labSchema: LAB_VERSIONS.schema }, build: { buildRoot: fixtureRoot("f"), toolchainRoot: fixtureRoot("1"), compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot }, versions: { factory: "factory-v1" as const, algorithm: LAB_VERSIONS.algorithm, schema: "factory-schema-v1" as const }, nativeLane: { language: "typescript" as const, providerId: "fixture-provider", runtimeAbi: LAB_VERSIONS.runtimeAbi, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null }, split: "development" as const }
  return { ...value, root: deriveFactoryOraclePacketRoot(value) }
}
export const factoryProposalFixture = (packet: FactoryOraclePacket): FactoryProposal => {
  const { root: packetRoot, oracleFamily, doctrineFamily, source: sourceIdentity, build: buildIdentity, versions: versionIdentity, nativeLane, lineage: lineageIdentity, split } = packet
  const value = { schemaVersion: "factory-proposal-v1" as const, privacy: "private_offline" as const, root: fixtureRoot("2"), packetRoot, oracleFamily, doctrineFamily, source: sourceIdentity, build: buildIdentity, versions: versionIdentity, nativeLane, lineage: lineageIdentity, split }
  return { ...value, root: deriveFactoryProposalRoot(value) }
}
export const factoryValidationFixture = (proposal: FactoryProposal): FactoryValidationEvidence => {
  const value = { schemaVersion: "factory-validation-evidence-v1" as const, privacy: "private_offline" as const, root: fixtureRoot("3"), proposalRoot: proposal.root, validationRoot: fixtureRoot("4"), status: "valid" as const, exactNativeLane: proposal.nativeLane, evidenceRoot: fixtureRoot("5") }
  return { ...value, root: deriveFactoryValidationRoot(value) }
}
export const factoryCandidateFixture = (proposal: FactoryProposal, validation: FactoryValidationEvidence, supervisionReceiptRoot = fixtureRoot("6")): FactoryCandidate => {
  const value = { schemaVersion: "factory-candidate-v1" as const, privacy: "private_offline" as const, root: fixtureRoot("6"), proposal, validation, supervisionReceiptRoot, fingerprints: { sourceStructureRoot: fixtureRoot("7"), lineageRoot: fixtureRoot("8"), dependencyRoot: fixtureRoot("9"), legalInputDecisionRoot: fixtureRoot("0"), chronicleBehaviorRoot: fixtureRoot("a"), matchupResponseRoot: fixtureRoot("b") }, lineage: proposal.lineage }
  return { ...value, root: deriveFactoryCandidateRoot(value) }
}
