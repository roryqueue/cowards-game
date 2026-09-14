import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { requireIssuedFactoryCalibrationObservations, type FactoryCalibrationObservation } from "./calibration-corpus.js"
import type { FactoryFingerprintEvidence } from "./fingerprint.js"

export { FACTORY_CALIBRATION_CORPUS, evaluateFactoryCalibrationCorpus, requireIssuedFactoryCalibrationObservations } from "./calibration-corpus.js"
export type { FactoryCalibrationCase, FactoryCalibrationCaseKind, FactoryCalibrationObservation } from "./calibration-corpus.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-zA-Z0-9._:-]{0,127}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_CALIBRATION_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]) => exactLabKeys(value, keys)
const canonical = <T>(value: unknown, validate: (record: Record<string, unknown>) => T): Readonly<T> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 262_144 || !admitted.value || typeof admitted.value !== "object" || Array.isArray(admitted.value)) return fail("CANONICAL")
  return freezeLabValue(validate(admitted.value as Record<string, unknown>))
}

export interface FactoryCalibrationReport {
  readonly schemaVersion: "factory-calibration-report-v1"
  readonly privacy: "private_offline"
  readonly root: LabRoot
  readonly corpusRoot: LabRoot
  readonly observationCount: number
  readonly observationsRoot: LabRoot
  readonly thresholds: null
  readonly readiness: "authorization_required"
}
export const createFactoryCalibrationReport = (observations: readonly FactoryCalibrationObservation[]): Readonly<FactoryCalibrationReport> => {
  const issued = requireIssuedFactoryCalibrationObservations(observations)
  const value = {
    schemaVersion: "factory-calibration-report-v1" as const,
    privacy: "private_offline" as const,
    corpusRoot: labRoot("factory-calibration-corpus-v1", issued.map((entry) => entry.caseRoot)),
    observationCount: issued.length,
    observationsRoot: labRoot("factory-calibration-observations-v1", issued.map((entry) => entry.root)),
    thresholds: null,
    readiness: "authorization_required" as const,
  }
  return freezeLabValue({ ...value, root: labRoot("factory-calibration-report-v1", value) })
}

export type FactoryIngestionOrigin = FactoryFingerprintEvidence["origin"]
export type FactoryProducerIdentity = FactoryFingerprintEvidence["producerIdentity"]
export interface FactoryCalibrationIngestion {
  readonly artifactRoot: LabRoot; readonly packetRoot: LabRoot; readonly sourceRoot: LabRoot
  readonly producerIdentity: FactoryProducerIdentity; readonly origin: FactoryIngestionOrigin; readonly evidenceClass: "real_producer"
}
export interface FactoryCalibrationWorkload {
  readonly schemaVersion: "factory-calibration-workload-v1"; readonly privacy: "private_offline"; readonly root: LabRoot
  readonly candidateIngestionArtifactRoot: LabRoot; readonly pairGroup: string; readonly pairAxis: "initialInitiative"
  readonly condition: Readonly<{ arenaId: string; seed: string; candidateSide: "bottom" | "top"; initialInitiative: "candidate" | "opponent"; maxPhases: 1 }>
  readonly opponent: Readonly<{ kind: "fixed_mechanics"; opponentId: "factory-fixed-mechanics-v1"; identityRoot: LabRoot }>
  readonly budget: Readonly<{ maxInvocations: number; maxLifetimeMs: number }>
  readonly lineageManifestArtifactRoot: LabRoot | null; readonly dependencyManifestArtifactRoot: LabRoot | null
}
export interface FactoryCalibrationWorkloadRef { readonly artifactRoot: LabRoot; readonly root: LabRoot; readonly candidateIngestionArtifactRoot: LabRoot; readonly pairGroup: string }
const workloadKeys = ["schemaVersion", "privacy", "root", "candidateIngestionArtifactRoot", "pairGroup", "pairAxis", "condition", "opponent", "budget", "lineageManifestArtifactRoot", "dependencyManifestArtifactRoot"] as const
const deriveWorkloadRoot = (value: Omit<FactoryCalibrationWorkload, "root">) => labRoot("factory-calibration-workload-v1", value)
export const admitFactoryCalibrationWorkload = (value: unknown): Readonly<FactoryCalibrationWorkload> => canonical(value, (record) => {
  if (!exact(record, workloadKeys) || record.schemaVersion !== "factory-calibration-workload-v1" || record.privacy !== "private_offline" || !root(record.root) || !root(record.candidateIngestionArtifactRoot) || typeof record.pairGroup !== "string" || !NAME.test(record.pairGroup) || record.pairAxis !== "initialInitiative" || !exact(record.condition, ["arenaId", "seed", "candidateSide", "initialInitiative", "maxPhases"]) || !exact(record.opponent, ["kind", "opponentId", "identityRoot"]) || !exact(record.budget, ["maxInvocations", "maxLifetimeMs"]) || !(record.lineageManifestArtifactRoot === null || root(record.lineageManifestArtifactRoot)) || !(record.dependencyManifestArtifactRoot === null || root(record.dependencyManifestArtifactRoot))) return fail("WORKLOAD")
  const condition = record.condition as Record<string, unknown>, opponent = record.opponent as Record<string, unknown>, budget = record.budget as Record<string, unknown>
  if (typeof condition.arenaId !== "string" || !CANONICAL_ARENA_CATALOG_V1_37.arenas.some((arena) => arena.id === condition.arenaId) || typeof condition.seed !== "string" || condition.seed.length < 1 || condition.seed.length > 128 || !["bottom", "top"].includes(String(condition.candidateSide)) || !["candidate", "opponent"].includes(String(condition.initialInitiative)) || condition.maxPhases !== 1 || opponent.kind !== "fixed_mechanics" || opponent.opponentId !== "factory-fixed-mechanics-v1" || !root(opponent.identityRoot) || !Number.isSafeInteger(budget.maxInvocations) || Number(budget.maxInvocations) < 1 || !Number.isSafeInteger(budget.maxLifetimeMs) || Number(budget.maxLifetimeMs) < 1) return fail("WORKLOAD")
  const typed = record as unknown as FactoryCalibrationWorkload, { root: _root, ...withoutRoot } = typed
  if (typed.root !== deriveWorkloadRoot(withoutRoot)) return fail("WORKLOAD_ROOT")
  return typed
})
export const createFactoryCalibrationWorkload = (value: Omit<FactoryCalibrationWorkload, "schemaVersion" | "privacy" | "root">): Readonly<FactoryCalibrationWorkload> => {
  const draft = { schemaVersion: "factory-calibration-workload-v1" as const, privacy: "private_offline" as const, ...value }
  return admitFactoryCalibrationWorkload({ ...draft, root: deriveWorkloadRoot(draft) })
}
export interface FactoryCalibrationManifest {
  readonly schemaVersion: "factory-calibration-manifest-v1"; readonly privacy: "private_offline"; readonly root: LabRoot
  readonly authorizationRoot: LabRoot; readonly authorizationArtifactRoot: LabRoot
  readonly protocolRoot: LabRoot; readonly protocolArtifactRoot: LabRoot
  readonly allocationRoot: LabRoot; readonly allocationArtifactRoot: LabRoot
  readonly studyPolicyRoot: LabRoot; readonly measurementPolicyRoot: LabRoot
  readonly maxAttempts: number; readonly maxInvocationsPerAttempt: number; readonly maxLifetimeMs: number
  readonly supervision: Readonly<{ adapterId: "runtime-js-container-subprocess"; runtimeAbi: "strategy-runtime-abi-v1.19"; image: string; runtimeProfileRoot: LabRoot }>
  readonly ingestions: readonly FactoryCalibrationIngestion[]
  readonly workloads: readonly FactoryCalibrationWorkloadRef[]
}
const manifestKeys = ["schemaVersion", "privacy", "root", "authorizationRoot", "authorizationArtifactRoot", "protocolRoot", "protocolArtifactRoot", "allocationRoot", "allocationArtifactRoot", "studyPolicyRoot", "measurementPolicyRoot", "maxAttempts", "maxInvocationsPerAttempt", "maxLifetimeMs", "supervision", "ingestions", "workloads"] as const
const deriveManifestRoot = (value: Omit<FactoryCalibrationManifest, "root">): LabRoot => labRoot("factory-calibration-manifest-v1", value)
export const admitFactoryCalibrationManifest = (value: unknown): Readonly<FactoryCalibrationManifest> => canonical(value, (record) => {
  if (!exact(record, manifestKeys) || record.schemaVersion !== "factory-calibration-manifest-v1" || record.privacy !== "private_offline" || ![record.root, record.authorizationRoot, record.authorizationArtifactRoot, record.protocolRoot, record.protocolArtifactRoot, record.allocationRoot, record.allocationArtifactRoot, record.studyPolicyRoot, record.measurementPolicyRoot].every(root)) return fail("MANIFEST")
  if (record.studyPolicyRoot !== "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17" || record.measurementPolicyRoot !== "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95") return fail("POLICY_ROOT")
  if (!Number.isSafeInteger(record.maxAttempts) || Number(record.maxAttempts) < 1 || Number(record.maxAttempts) > 1024 ||
      !Number.isSafeInteger(record.maxInvocationsPerAttempt) || Number(record.maxInvocationsPerAttempt) < 1 || Number(record.maxInvocationsPerAttempt) > 24_800 ||
      !Number.isSafeInteger(record.maxLifetimeMs) || Number(record.maxLifetimeMs) < 1 || Number(record.maxLifetimeMs) > 120_000) return fail("BOUND")
  if (!exact(record.supervision, ["adapterId", "runtimeAbi", "image", "runtimeProfileRoot"])) return fail("SUPERVISION")
  const supervision = record.supervision as Record<string, unknown>
  if (supervision.adapterId !== "runtime-js-container-subprocess" || supervision.runtimeAbi !== LAB_VERSIONS.runtimeAbi || supervision.image !== LAB_ADMITTED_ROOTS.image || supervision.runtimeProfileRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) return fail("SUPERVISION")
  if (!Array.isArray(record.ingestions) || record.ingestions.length < 1 || record.ingestions.length > Number(record.maxAttempts)) return fail("INGESTIONS")
  const seen = new Set<string>()
  for (const item of record.ingestions) {
    if (!exact(item, ["artifactRoot", "packetRoot", "sourceRoot", "producerIdentity", "origin", "evidenceClass"]) || ![item.artifactRoot, item.packetRoot, item.sourceRoot].every(root) || !["emitTacticalFactoryPacket", "emitTeacherFactoryPacket", "emitModelFactoryPacket", "admitQuarantinedIntakePacket"].includes(String(item.producerIdentity)) || !["tactical-oracle", "teacher-oracle", "model-oracle", "human-external-intake"].includes(String(item.origin)) || item.evidenceClass !== "real_producer" || seen.has(String(item.artifactRoot))) return fail("INGESTION")
    seen.add(String(item.artifactRoot))
  }
  if (!Array.isArray(record.workloads) || record.workloads.length < 1 || record.workloads.length > Number(record.maxAttempts)) return fail("WORKLOADS")
  const workloadRoots = new Set<string>()
  for (const item of record.workloads) {
    if (!exact(item, ["artifactRoot", "root", "candidateIngestionArtifactRoot", "pairGroup"]) || !root(item.artifactRoot) || !root(item.root) || !root(item.candidateIngestionArtifactRoot) || typeof item.pairGroup !== "string" || !NAME.test(item.pairGroup) || !seen.has(item.candidateIngestionArtifactRoot) || workloadRoots.has(item.artifactRoot)) return fail("WORKLOAD_REF")
    workloadRoots.add(item.artifactRoot)
  }
  const typed = record as unknown as FactoryCalibrationManifest
  const { root: _root, ...withoutRoot } = typed
  if (typed.root !== deriveManifestRoot(withoutRoot)) return fail("MANIFEST_ROOT")
  return typed
})
export const createFactoryCalibrationManifest = (value: Omit<FactoryCalibrationManifest, "schemaVersion" | "privacy" | "root">): Readonly<FactoryCalibrationManifest> => {
  const draft = { schemaVersion: "factory-calibration-manifest-v1" as const, privacy: "private_offline" as const, ...value }
  return admitFactoryCalibrationManifest({ ...draft, root: deriveManifestRoot(draft) })
}
