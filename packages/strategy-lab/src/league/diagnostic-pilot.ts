import { createHash, randomUUID } from "node:crypto"
import { closeSync, constants, fsyncSync, linkSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, createSetScenarioV137 } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../contracts.js"
import { FactoryCandidateSchema, FactoryOraclePacketSchema, FactoryProposalSchema, FactoryValidationEvidenceSchema, type FactoryCandidate } from "../factory/contracts.js"
import { validateFactoryAttemptLedger, validateFactoryAttemptStart, validateFactoryAttemptTerminal } from "../factory/ledger.js"
import { readFactoryArtifact, type FactoryRepository } from "../factory/repository.js"
import { readFactorySupervisionArtifactRecords } from "../factory/supervision-artifacts.js"
import { classifyNumericComparison, freezeNumericCalibrationThreshold, type NumericComparison, type NumericControlTable } from "../factory/numeric-calibration.js"
import { LeagueCandidateAdmissionSchema, type LeagueCandidateAdmission } from "./contracts.js"
import { leaguePlayerId } from "./matrix.js"
import type { FactoryCandidateClosure } from "./connected-runner.js"

const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_PILOT_${code}`) }
const ROOT = /^sha256:[0-9a-f]{64}$/u
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength < 1 || admitted.canonicalByteLength > 262_144) return fail("CANONICAL_BYTES")
  return admitted.canonicalBytes
}
const parse = (bytes: Uint8Array): Record<string, unknown> => {
  const admitted = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!admitted.ok || admitted.value === null || typeof admitted.value !== "object" || Array.isArray(admitted.value)) return fail("CANONICAL_RECORD")
  return admitted.value as Record<string, unknown>
}
const record = (domain: string, value: Record<string, unknown>, keys: readonly string[]) => {
  if (!exactLabKeys(value, [...keys, "schemaVersion", "root"]) || value.schemaVersion !== domain || !root(value.root)) return fail("RECORD_SCHEMA")
  const { root: identity, ...fields } = value
  if (identity !== labRoot(domain, fields)) return fail("RECORD_ROOT")
  return value
}

export const DIAGNOSTIC_PILOT_STORE = ".strategy-lab/league-265-diagnostic-pilot-20260923-a" as const
export const DIAGNOSTIC_PILOT_RESULT = ".planning/artifacts/v1.38-phase-265-diagnostic-pilot-result.json" as const
export const DIAGNOSTIC_PILOT_SEED = "league-265-postfailure-pilot-20260923-a" as const
export const DIAGNOSTIC_PILOT_GEOMETRY = "sha256:39aecc22c184660c1c08ab810fbfa3066da1a650b20e91d72a838ed7fb70a0e1" as LabRoot
export const DIAGNOSTIC_PILOT_PHASE264_STORE = ".strategy-lab/factory-264-fresh-20260914-approved-two" as const
export const DIAGNOSTIC_PILOT_ASSESSMENT = freezeLabValue({
  artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8" as LabRoot,
  assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1" as LabRoot,
  thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72" as LabRoot,
  producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b" as LabRoot,
  assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c" as LabRoot,
  executionArtifactRoot: "sha256:5cc42a1a59fe81a49824cca263ed92cb4619b0de816ee341927cbb1d297ad989" as LabRoot,
  producerReviewArtifactRoot: "sha256:cf5caeeff3154a16f901b262815892e0fdbf40ec3d60f693407b37323814decd" as LabRoot,
  assessorReviewArtifactRoot: "sha256:cfda2e1901a0e7ff94a86e3ea167718c73f2baf4f10a0133903426fdf7209735" as LabRoot,
  correctionArtifactRoot: "sha256:380308f4b8c2aee5a3920466daa5327bf81d5d4159de65661f990ad002a3d807" as LabRoot,
})
export const DIAGNOSTIC_PILOT_BASES = freezeLabValue([
  { slot: "S01", candidateRoot: "sha256:58a001abf66ad174ab43804cde6b051591b110509b3f0835ec2a4fa61e481def", admissionRoot: "sha256:850d8c03d00b6dd8791a68403801e55c37fcaf6f6f2f9c31105b782cbf9f26f5", publication: "sha256:248a48e285a6f15da53ade90b1d8a66200fd35a33c46ce716017209eefd0ea9b", source: "sha256:3a49f15d3b0164e25106e44bd27f1e33c11a13bf0bfd6410c85e494dead823e2", supervision: "sha256:80d17a2c7beebb758bb14eacd2dc9318d7d7b884363754e67510823bdda9ecf7", supervisionBytes: 3_701_815, supervisionRecords: 1_155, packet: "sha256:ec8efeae5c37bfe5faf426dc02f04804a7f793148ddd55c45071f9edc74b6aa2", proposal: "sha256:1457f102aa1c0c724ff095397d11e7d566aed85e0b49dff8d87407b4afbde305", validation: "sha256:5f3d9d3868ffe17dd0cc75fe9ac132bb9b9ff608d508ffaf10211806f02a341c", start: "sha256:3fd1884a7c9a06f60cfce5d650890d97fcadcc502581cab2abf2b506cba98cb5", terminal: "sha256:d05e72e01e96c050d346042b234f8b2b8c77b54ba09d69a80a359c4d438667a1" },
  { slot: "S03", candidateRoot: "sha256:b0f982dbf499b9c76d14b47de35d17b1698999b366571f48a04655d139639289", admissionRoot: "sha256:f5cd002a1cece02fb4f9a63ea1d952354dd57558307be2304326cd806274a774", publication: "sha256:b53b00a5e92f0f696f40b20453a2821596f65be6fdc561d2b8bc44f351cf8de8", source: "sha256:19126911caf193808c53de111576986e80b26d9c2109dcb3d04edd3344b5e39f", supervision: "sha256:de70fc054600a04d26f7278811f8996d666d36a0b51233b19d7535137198abd6", supervisionBytes: 3_997_990, supervisionRecords: 1_276, packet: "sha256:0fd00718595ddd325aa622a02ad5cc0a28d59735b9e8e0f9fc1f2ef78b6a760e", proposal: "sha256:d749328e2d42c9020725d5d0af191dead719a2c03e10371080bfc06eaf210513", validation: "sha256:4b89fea76498adafd18b1cf032099d94879dfdce371803bddda6c032f03b8c9a", start: "sha256:eab3be22248697ea9ad5721184289fc2bb8ed8ff63fe51a1e8e323c14f88be22", terminal: "sha256:72b7d680827447a4ec3f761980dc7714976cdda0751df234510d66a5b0a9c5e6" },
] as const)

const scenario = () => createSetScenarioV137({
  arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
  arenaSemanticGeometryHash: DIAGNOSTIC_PILOT_GEOMETRY,
  entrantA: { entrantKey: DIAGNOSTIC_PILOT_BASES[0].candidateRoot, playerId: leaguePlayerId(DIAGNOSTIC_PILOT_BASES[0].candidateRoot) },
  entrantB: { entrantKey: DIAGNOSTIC_PILOT_BASES[1].candidateRoot, playerId: leaguePlayerId(DIAGNOSTIC_PILOT_BASES[1].candidateRoot) },
  baseSeed: DIAGNOSTIC_PILOT_SEED,
})
const CONDITION_IDS = [
  "set-condition:sha256:8c78a3488ff1b3bfe21231e8183fabdfb1428b3c40e8be0466cca17e51036bad",
  "set-condition:sha256:51ded4d1bb28d7de00b00059b3fc0b66598785037ac907bb772f6aeecaf49aa5",
  "set-condition:sha256:6da20d83323911acf4891eb6736ebd372138364762905268e340852f364cbf68",
  "set-condition:sha256:bbec91404c09ac50622b0bc25b09fd8d20dbcd037d62e2fdd2c07f7ff17be7af",
] as const
const allocationFields = ["evidenceClass", "privacy", "phase", "seed", "scenarioId", "semanticGeometryHash", "candidateRoots", "candidateAdmissionRoots", "tupleRoot", "runtimeRoot", "image", "perMatchMilliseconds", "overallMilliseconds", "retryCount", "cells", "sourceClosureRoot", "implementationRoot", "gateRoot", "oldEvidenceBaseline", "artifactCeiling", "leagueRequirementsEvidence", "formationAuthorized", "counted", "public"] as const

export interface DiagnosticPilotOldEvidenceBaseline {
  readonly oldAllocationV2: LabRoot
  readonly oldAllocationUnversioned: LabRoot
  readonly oldResult: LabRoot
  readonly oldLeagueTree: LabRoot
  readonly oldFactoryTree: LabRoot
}
const baselineKeys = ["oldAllocationV2", "oldAllocationUnversioned", "oldResult", "oldLeagueTree", "oldFactoryTree"] as const

export interface DiagnosticPilotAllocation {
  readonly schemaVersion: "diagnostic-pilot-allocation-v1"; readonly root: LabRoot; readonly evidenceClass: "diagnostic_only"; readonly privacy: "private_offline"; readonly phase: 265
  readonly seed: typeof DIAGNOSTIC_PILOT_SEED; readonly scenarioId: string; readonly semanticGeometryHash: LabRoot
  readonly candidateRoots: readonly [LabRoot, LabRoot]; readonly candidateAdmissionRoots: readonly [LabRoot, LabRoot]
  readonly tupleRoot: LabRoot; readonly runtimeRoot: LabRoot; readonly image: string; readonly perMatchMilliseconds: 240000; readonly overallMilliseconds: 1800000; readonly retryCount: 0
  readonly cells: readonly Readonly<{ ordinal: number; conditionId: string; requestIdentity: string; bottomCandidateRoot: LabRoot; topCandidateRoot: LabRoot; initialInitiativeCandidateRoot: LabRoot }>[]
  readonly sourceClosureRoot: LabRoot; readonly implementationRoot: LabRoot; readonly gateRoot: LabRoot
  readonly oldEvidenceBaseline: DiagnosticPilotOldEvidenceBaseline; readonly artifactCeiling: typeof DIAGNOSTIC_PILOT_ARTIFACT_CEILING
  readonly leagueRequirementsEvidence: false; readonly formationAuthorized: false; readonly counted: false; readonly public: false
}
export const createDiagnosticPilotAllocation = (identity: { readonly sourceClosureRoot: LabRoot; readonly implementationRoot: LabRoot; readonly gateRoot: LabRoot; readonly oldEvidenceBaseline: DiagnosticPilotOldEvidenceBaseline }): Readonly<DiagnosticPilotAllocation> => {
  if (!exactLabKeys(identity, ["sourceClosureRoot", "implementationRoot", "gateRoot", "oldEvidenceBaseline"]) || ![identity.sourceClosureRoot, identity.implementationRoot, identity.gateRoot].every(root) || !exactLabKeys(identity.oldEvidenceBaseline, baselineKeys) || !Object.values(identity.oldEvidenceBaseline).every(root)) return fail("ALLOCATION_SOURCE")
  const source = scenario()
  if (source.scenarioId !== "set-scenario:sha256:e0f70e74ccd4229ba6c78ddca08079dcf23a8c3d970acab1f001007fb7f842f1" || source.conditions.some((row, index) => row.conditionId !== CONDITION_IDS[index])) return fail("CANONICAL_CONDITIONS")
  const fields = { evidenceClass: "diagnostic_only" as const, privacy: "private_offline" as const, phase: 265 as const, seed: DIAGNOSTIC_PILOT_SEED, scenarioId: source.scenarioId, semanticGeometryHash: DIAGNOSTIC_PILOT_GEOMETRY, candidateRoots: [DIAGNOSTIC_PILOT_BASES[0].candidateRoot, DIAGNOSTIC_PILOT_BASES[1].candidateRoot] as const, candidateAdmissionRoots: [DIAGNOSTIC_PILOT_BASES[0].admissionRoot, DIAGNOSTIC_PILOT_BASES[1].admissionRoot] as const, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image, perMatchMilliseconds: 240_000 as const, overallMilliseconds: 1_800_000 as const, retryCount: 0 as const, cells: source.conditions.map((condition) => ({ ordinal: condition.ordinal, conditionId: condition.conditionId, requestIdentity: condition.requestIdentity, bottomCandidateRoot: condition.bottomEntrantKey as LabRoot, topCandidateRoot: condition.topEntrantKey as LabRoot, initialInitiativeCandidateRoot: condition.initialInitiativeEntrantKey as LabRoot })), sourceClosureRoot: identity.sourceClosureRoot, implementationRoot: identity.implementationRoot, gateRoot: identity.gateRoot, oldEvidenceBaseline: identity.oldEvidenceBaseline, artifactCeiling: DIAGNOSTIC_PILOT_ARTIFACT_CEILING, leagueRequirementsEvidence: false as const, formationAuthorized: false as const, counted: false as const, public: false as const }
  const value = { schemaVersion: "diagnostic-pilot-allocation-v1" as const, ...fields, root: labRoot("diagnostic-pilot-allocation-v1", { schemaVersion: "diagnostic-pilot-allocation-v1", ...fields }) }
  return freezeLabValue(value) as DiagnosticPilotAllocation
}
export const admitDiagnosticPilotAllocation = (value: unknown): Readonly<DiagnosticPilotAllocation> => {
  if (!exactLabKeys(value, [...allocationFields, "schemaVersion", "root"])) return fail("ALLOCATION_KEYS")
  const candidate = value as unknown as DiagnosticPilotAllocation
  if (candidate.schemaVersion !== "diagnostic-pilot-allocation-v1" || !root(candidate.root) || ![candidate.sourceClosureRoot, candidate.implementationRoot, candidate.gateRoot].every(root)) return fail("ALLOCATION_IDENTITY")
  const expected = createDiagnosticPilotAllocation({ sourceClosureRoot: candidate.sourceClosureRoot, implementationRoot: candidate.implementationRoot, gateRoot: candidate.gateRoot, oldEvidenceBaseline: candidate.oldEvidenceBaseline })
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("ALLOCATION_MISMATCH")
  return expected
}

export interface DiagnosticPilotCell { readonly schemaVersion: "diagnostic-pilot-cell-v1"; readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly ordinal: number; readonly conditionId: string; readonly requestIdentity: string; readonly requestRoot: LabRoot; readonly bottomCandidateRoot: LabRoot; readonly topCandidateRoot: LabRoot; readonly initialInitiativeCandidateRoot: LabRoot; readonly semanticGeometryHash: LabRoot; readonly tupleRoot: LabRoot; readonly runtimeRoot: LabRoot }
export const createDiagnosticPilotCell = (allocation: DiagnosticPilotAllocation, ordinal: number): Readonly<DiagnosticPilotCell> => {
  const admitted = admitDiagnosticPilotAllocation(allocation), condition = admitted.cells[ordinal]
  if (!Number.isSafeInteger(ordinal) || !condition || condition.ordinal !== ordinal) return fail("CELL_ORDINAL")
  const fields = { allocationRoot: admitted.root, ordinal, conditionId: condition.conditionId, requestIdentity: condition.requestIdentity, requestRoot: labRoot("diagnostic-pilot-request-v1", { allocationRoot: admitted.root, ordinal, requestIdentity: condition.requestIdentity }), bottomCandidateRoot: condition.bottomCandidateRoot, topCandidateRoot: condition.topCandidateRoot, initialInitiativeCandidateRoot: condition.initialInitiativeCandidateRoot, semanticGeometryHash: admitted.semanticGeometryHash, tupleRoot: admitted.tupleRoot, runtimeRoot: admitted.runtimeRoot }
  const base = { schemaVersion: "diagnostic-pilot-cell-v1" as const, ...fields }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-pilot-cell-v1", base) })
}
export const admitDiagnosticPilotCell = (allocation: DiagnosticPilotAllocation, value: unknown): Readonly<DiagnosticPilotCell> => {
  if (!exactLabKeys(value, ["schemaVersion", "root", "allocationRoot", "ordinal", "conditionId", "requestIdentity", "requestRoot", "bottomCandidateRoot", "topCandidateRoot", "initialInitiativeCandidateRoot", "semanticGeometryHash", "tupleRoot", "runtimeRoot"])) return fail("CELL_KEYS")
  const expected = createDiagnosticPilotCell(allocation, (value as unknown as DiagnosticPilotCell).ordinal)
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("CELL_MISMATCH")
  return expected
}
export const diagnosticPilotContainerIdentity = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, seat: "bottom" | "top") => {
  const admitted = admitDiagnosticPilotCell(allocation, cell)
  if (!["bottom", "top"].includes(seat)) return fail("CONTAINER_IDENTITY")
  const suffix = admitted.root.slice(7, 27)
  return freezeLabValue({ containerName: `cg-v138-pilot-${suffix}-${seat}`, ownershipLabel: `diagnostic-pilot-${admitted.root.slice(7)}` })
}

export interface DiagnosticPilotStart { readonly schemaVersion: "diagnostic-pilot-start-v1"; readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly cellRoot: LabRoot; readonly ordinal: number; readonly requestRoot: LabRoot }
export const createDiagnosticPilotStart = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell): Readonly<DiagnosticPilotStart> => {
  const admitted = admitDiagnosticPilotCell(allocation, cell)
  const base = { schemaVersion: "diagnostic-pilot-start-v1" as const, allocationRoot: admitted.allocationRoot, cellRoot: admitted.root, ordinal: admitted.ordinal, requestRoot: admitted.requestRoot }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-pilot-start-v1", base) })
}
export const admitDiagnosticPilotStart = (allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, value: unknown): Readonly<DiagnosticPilotStart> => {
  if (!exactLabKeys(value, ["schemaVersion", "root", "allocationRoot", "cellRoot", "ordinal", "requestRoot"])) return fail("START_KEYS")
  const expected = createDiagnosticPilotStart(allocation, cell)
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("START_MISMATCH")
  return expected
}
export type DiagnosticPilotDisposition = "success" | "system_failure" | "player_violation" | "timeout" | "uncertain"
export interface DiagnosticPilotTerminal { readonly schemaVersion: "diagnostic-pilot-terminal-v1"; readonly root: LabRoot; readonly startRoot: LabRoot; readonly disposition: DiagnosticPilotDisposition; readonly processValidity: "process_valid" | "process_invalid"; readonly evidenceRoot: LabRoot | null; readonly cleanupComplete: boolean; readonly elapsedMilliseconds: number; readonly artifactBytes: number; readonly artifactRecords: number; readonly code: "completed" | "system_failure" | "player_violation" | "cell_deadline" | "overall_deadline" | "cleanup_incomplete" | "publication_uncertain" }
export const createDiagnosticPilotTerminal = (start: DiagnosticPilotStart, fields: Omit<DiagnosticPilotTerminal, "schemaVersion" | "root" | "startRoot">): Readonly<DiagnosticPilotTerminal> => {
  const valid = ["success", "system_failure", "player_violation", "timeout", "uncertain"].includes(fields.disposition) && ["completed", "system_failure", "player_violation", "cell_deadline", "overall_deadline", "cleanup_incomplete", "publication_uncertain"].includes(fields.code) && [fields.elapsedMilliseconds, fields.artifactBytes, fields.artifactRecords].every((n) => Number.isSafeInteger(n) && n >= 0) && fields.elapsedMilliseconds <= 240_000 && fields.artifactBytes <= DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes && fields.artifactRecords <= DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords && (fields.evidenceRoot === null || root(fields.evidenceRoot)) && (fields.disposition === "success" ? fields.processValidity === "process_valid" && fields.cleanupComplete && fields.evidenceRoot !== null && fields.code === "completed" : fields.processValidity === "process_invalid")
  if (!valid || !root(start.root)) return fail("TERMINAL_FIELDS")
  const base = { schemaVersion: "diagnostic-pilot-terminal-v1" as const, startRoot: start.root, ...fields }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-pilot-terminal-v1", base) })
}
export const admitDiagnosticPilotTerminal = (start: DiagnosticPilotStart, value: unknown): Readonly<DiagnosticPilotTerminal> => {
  if (!exactLabKeys(value, ["schemaVersion", "root", "startRoot", "disposition", "processValidity", "evidenceRoot", "cleanupComplete", "elapsedMilliseconds", "artifactBytes", "artifactRecords", "code"])) return fail("TERMINAL_KEYS")
  const terminal = value as unknown as DiagnosticPilotTerminal
  if (terminal.schemaVersion !== "diagnostic-pilot-terminal-v1" || terminal.startRoot !== start.root) return fail("TERMINAL_START")
  const { root: identity, schemaVersion: _schema, startRoot: _start, ...fields } = terminal
  const expected = createDiagnosticPilotTerminal(start, fields)
  if (identity !== expected.root) return fail("TERMINAL_MISMATCH")
  return expected
}

/** Prospective-only diagnostics. These domains deliberately cannot be admitted
 * as v1 terminals or retroactively added to the consumed Plan 09 result. */
export const DIAGNOSTIC_PILOT_STAGES = Object.freeze(["bottom_issuance", "top_issuance", "pre_kernel_binding", "kernel_or_callback", "first_evidence_write", "terminal_publication"] as const)
export type DiagnosticPilotStage = typeof DIAGNOSTIC_PILOT_STAGES[number]
export type DiagnosticPilotCause = "worker_candidate" | "pilot_request_binding" | "pilot_match_binding" | "evidence_row_cap" | "evidence_outcome_cap" | "evidence_cap" | "worker_missing_evidence" | "worker_cell_reopen" | "ledger_cap" | "ledger_overwrite" | "unknown_internal"
const SAFE_CAUSES: Readonly<Record<string, DiagnosticPilotCause>> = Object.freeze({
  DIAGNOSTIC_PILOT_CLI_WORKER_CANDIDATE: "worker_candidate",
  DIAGNOSTIC_PILOT_PILOT_REQUEST_BINDING: "pilot_request_binding",
  DIAGNOSTIC_PILOT_PILOT_MATCH_BINDING: "pilot_match_binding",
  DIAGNOSTIC_PILOT_CLI_EVIDENCE_ROW_CAP: "evidence_row_cap",
  DIAGNOSTIC_PILOT_CLI_EVIDENCE_OUTCOME_CAP: "evidence_outcome_cap",
  DIAGNOSTIC_PILOT_EVIDENCE_CAP: "evidence_cap",
  DIAGNOSTIC_PILOT_CLI_WORKER_MISSING_EVIDENCE: "worker_missing_evidence",
  DIAGNOSTIC_PILOT_CLI_WORKER_CELL_REOPEN: "worker_cell_reopen",
  DIAGNOSTIC_PILOT_LEDGER_CAP: "ledger_cap",
  DIAGNOSTIC_PILOT_LEDGER_OVERWRITE: "ledger_overwrite",
})
const causeValues = new Set<DiagnosticPilotCause>([...Object.values(SAFE_CAUSES), "unknown_internal"])
export const safeDiagnosticPilotCause = (error: unknown): DiagnosticPilotCause => error instanceof Error ? SAFE_CAUSES[error.message] ?? "unknown_internal" : "unknown_internal"
export interface DiagnosticPilotStageCheckpoint { readonly schemaVersion: "diagnostic-pilot-stage-checkpoint-v1"; readonly startRoot: LabRoot; readonly ordinal: number; readonly stage: DiagnosticPilotStage; readonly root: LabRoot }
export const createDiagnosticPilotStageCheckpoint = (start: DiagnosticPilotStart, ordinal: number, stage: DiagnosticPilotStage): Readonly<DiagnosticPilotStageCheckpoint> => {
  if (!root(start.root) || !Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= DIAGNOSTIC_PILOT_STAGES.length || DIAGNOSTIC_PILOT_STAGES[ordinal] !== stage) return fail("STAGE_ORDER")
  const base = { schemaVersion: "diagnostic-pilot-stage-checkpoint-v1" as const, startRoot: start.root, ordinal, stage }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-pilot-stage-checkpoint-v1", base) })
}
export const admitDiagnosticPilotStageCheckpoint = (start: DiagnosticPilotStart, value: unknown, ordinal: number): Readonly<DiagnosticPilotStageCheckpoint> => {
  if (!exactLabKeys(value, ["schemaVersion", "startRoot", "ordinal", "stage", "root"])) return fail("STAGE_KEYS")
  const expected = createDiagnosticPilotStageCheckpoint(start, ordinal, (value as unknown as DiagnosticPilotStageCheckpoint).stage)
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("STAGE_MISMATCH")
  return expected
}
export interface DiagnosticPilotTerminalV2 extends Omit<DiagnosticPilotTerminal, "schemaVersion"> { readonly schemaVersion: "diagnostic-pilot-terminal-v2"; readonly lastEnteredStage: DiagnosticPilotStage | "unknown"; readonly failureStage: DiagnosticPilotStage | "unknown"; readonly cause: DiagnosticPilotCause }
export const createDiagnosticPilotTerminalV2 = (start: DiagnosticPilotStart, fields: Omit<DiagnosticPilotTerminalV2, "schemaVersion" | "root" | "startRoot">): Readonly<DiagnosticPilotTerminalV2> => {
  if (fields.lastEnteredStage !== "unknown" && !DIAGNOSTIC_PILOT_STAGES.includes(fields.lastEnteredStage) || fields.failureStage !== "unknown" && !DIAGNOSTIC_PILOT_STAGES.includes(fields.failureStage) || !causeValues.has(fields.cause)) return fail("TERMINAL_V2_FIELDS")
  const { lastEnteredStage, failureStage, cause, ...legacyFields } = fields
  createDiagnosticPilotTerminal(start, legacyFields)
  const base = { schemaVersion: "diagnostic-pilot-terminal-v2" as const, startRoot: start.root, ...legacyFields, lastEnteredStage, failureStage, cause }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-pilot-terminal-v2", base) })
}
export const admitDiagnosticPilotTerminalV2 = (start: DiagnosticPilotStart, value: unknown): Readonly<DiagnosticPilotTerminalV2> => {
  if (!exactLabKeys(value, ["schemaVersion", "root", "startRoot", "disposition", "processValidity", "evidenceRoot", "cleanupComplete", "elapsedMilliseconds", "artifactBytes", "artifactRecords", "code", "lastEnteredStage", "failureStage", "cause"])) return fail("TERMINAL_V2_KEYS")
  const candidate = value as unknown as DiagnosticPilotTerminalV2
  if (candidate.schemaVersion !== "diagnostic-pilot-terminal-v2" || candidate.startRoot !== start.root) return fail("TERMINAL_V2_START")
  const { root: _root, schemaVersion: _schema, startRoot: _start, ...fields } = candidate
  const expected = createDiagnosticPilotTerminalV2(start, fields)
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("TERMINAL_V2_MISMATCH")
  return expected
}

/** Peak accounting includes the incoming atomic temp+link, all as-yet-absent
 * immutable markers, one emergency terminal and one bounded diagnosis. */
export const admitDiagnosticPilotProspectiveCapacity = (input: { readonly retainedBytes: number; readonly retainedRecords: number; readonly retainedInodes: number; readonly incomingBytes: number; readonly completedStages: number; readonly maxBytes: number; readonly maxRecords: number; readonly maxInodes: number }): true => {
  if (Object.values(input).some((value) => !Number.isSafeInteger(value) || value < 0) || input.completedStages > 6 || input.incomingBytes < 1 || input.incomingBytes > 131_072) return fail("PROSPECTIVE_CAP_INPUT")
  const remaining = 6 - input.completedStages
  const peakBytes = input.retainedBytes + 2 * input.incomingBytes + remaining * 512 + 262_144 + 65_536
  const peakInodes = input.retainedInodes + 2 + remaining * 2 + 2 + 2
  const peakRecords = input.retainedRecords + 1 + remaining + 2
  if (peakBytes > input.maxBytes || peakInodes > input.maxInodes || peakRecords > input.maxRecords) return fail("PROSPECTIVE_CAP")
  return true
}
export interface DiagnosticPilotFailureDiagnosis { readonly schemaVersion: "diagnostic-pilot-failed-terminal-diagnosis-v1"; readonly startRoot: LabRoot; readonly lastEnteredStage: "terminal_publication"; readonly failureStage: "terminal_publication"; readonly cause: DiagnosticPilotCause; readonly root: LabRoot }
export const createDiagnosticPilotFailureDiagnosis = (start: DiagnosticPilotStart, cause: DiagnosticPilotCause): Readonly<DiagnosticPilotFailureDiagnosis> => {
  if (!root(start.root) || !causeValues.has(cause)) return fail("DIAGNOSIS_CAUSE")
  const base = { schemaVersion: "diagnostic-pilot-failed-terminal-diagnosis-v1" as const, startRoot: start.root, lastEnteredStage: "terminal_publication" as const, failureStage: "terminal_publication" as const, cause }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-pilot-failed-terminal-diagnosis-v1", base) })
}
export const admitDiagnosticPilotFailureDiagnosis = (start: DiagnosticPilotStart, value: unknown): Readonly<DiagnosticPilotFailureDiagnosis> => {
  if (!exactLabKeys(value, ["schemaVersion", "startRoot", "lastEnteredStage", "failureStage", "cause", "root"])) return fail("DIAGNOSIS_KEYS")
  const candidate = value as unknown as DiagnosticPilotFailureDiagnosis
  if (candidate.schemaVersion !== "diagnostic-pilot-failed-terminal-diagnosis-v1" || candidate.startRoot !== start.root || candidate.lastEnteredStage !== "terminal_publication" || candidate.failureStage !== "terminal_publication") return fail("DIAGNOSIS_FIELDS")
  const expected = createDiagnosticPilotFailureDiagnosis(start, candidate.cause)
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("DIAGNOSIS_ROOT")
  return expected
}

/** Per provider: 24,800 output envelopes of <=262,144 bytes; two providers,
 * canonical transition/descriptor overhead and atomic temporary files are
 * separately reserved. A local failure cap prevents an unbounded diagnostic. */
export const DIAGNOSTIC_PILOT_ARTIFACT_CEILING = freezeLabValue({
  version: "diagnostic-pilot-capacity-v1",
  maxBytes: 2 * 24_800 * (262_144 + 8_192) + 1_010_000 * 8_192 + 16 * 262_144,
  maxRecords: 2 * 24_800 * 4 + 1_010_000 * 2 + 128,
  maxInodes: 2 * (2 * 24_800 * 4 + 1_010_000 * 2 + 128) + 128,
  terminalReserveBytes: 2 * 262_144,
  terminalReserveInodes: 8,
  maxFailureBytes: 262_144,
})

export interface DiagnosticPilotLedger {
  readonly directory: string
  readonly writeStart: (start: DiagnosticPilotStart) => void
  readonly readStart: (startRoot: LabRoot) => unknown | null
  readonly writeTerminal: (terminal: DiagnosticPilotTerminal) => void
  readonly readTerminal: (startRoot: LabRoot) => unknown | null
  readonly listNames: () => readonly string[]
  readonly writeEvidence?: (startRoot: LabRoot, bytes: Uint8Array) => LabRoot
  readonly readEvidence?: (startRoot: LabRoot, evidenceRoot: LabRoot) => Uint8Array
  readonly writeStageCheckpoint?: (checkpoint: DiagnosticPilotStageCheckpoint) => void
  readonly readStageCheckpoint?: (startRoot: LabRoot, ordinal: number) => unknown | null
  readonly writeTerminalV2?: (terminal: DiagnosticPilotTerminalV2) => void
  readonly readTerminalV2?: (startRoot: LabRoot) => unknown | null
  readonly writeFailureDiagnosis?: (diagnosis: DiagnosticPilotFailureDiagnosis) => void
  readonly readFailureDiagnosis?: (startRoot: LabRoot) => unknown | null
}
const openedLedgers = new WeakSet<object>()
const TEMPORARY = /^diagnostic-pilot-([a-f0-9]{64})\.(?:(?:started|terminal|terminal-v2|failed-terminal-diagnosis|stage-[0-5])\.json|evidence-[a-f0-9]{64}\.bin)\.tmp-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u
const inspectDiagnosticPilotInventory = (ledger: DiagnosticPilotLedger, allocation: DiagnosticPilotAllocation, allowTemporary = false, prospective = false): boolean => {
  const allowed = allocation.cells.map((_, ordinal) => createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, ordinal)).root)
  const names = ledger.listNames()
  if (names.length > 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxInodes || new Set(names).size !== names.length) return fail("LEDGER_INVENTORY")
  const present: number[] = []
  let uncertain = false
  for (const name of names) {
    const temporary = TEMPORARY.exec(name)
    if (temporary) {
      if (!allowed.includes(`sha256:${temporary[1]}` as LabRoot)) return fail("LEDGER_FOREIGN_TEMPORARY")
      if (!allowTemporary) return fail("LEDGER_UNCERTAIN_TEMPORARY")
      uncertain = true
      continue
    }
    const stage = /^diagnostic-pilot-([a-f0-9]{64})\.stage-([0-5])\.json$/u.exec(name)
    if (stage) {
      if (!prospective || !ledger.readStageCheckpoint) return fail("LEDGER_VERSION_MIX")
      const ordinal = allowed.indexOf(`sha256:${stage[1]}` as LabRoot), sequence = Number(stage[2])
      if (ordinal < 0 || !ledger.readStart(allowed[ordinal]!)) return fail("LEDGER_FOREIGN_STAGE")
      const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, ordinal))
      admitDiagnosticPilotStageCheckpoint(start, ledger.readStageCheckpoint(start.root, sequence), sequence)
      continue
    }
    const prospectiveTerminal = /^diagnostic-pilot-([a-f0-9]{64})\.(terminal-v2|failed-terminal-diagnosis)\.json$/u.exec(name)
    if (prospectiveTerminal) {
      if (!prospective) return fail("LEDGER_VERSION_MIX")
      const ordinal = allowed.indexOf(`sha256:${prospectiveTerminal[1]}` as LabRoot)
      if (ordinal < 0 || !ledger.readStart(allowed[ordinal]!)) return fail("LEDGER_FOREIGN_TERMINAL")
      const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, ordinal))
      if (!ledger.readStageCheckpoint?.(start.root, 5)) return fail("LEDGER_TERMINAL_STAGE")
      if (prospectiveTerminal[2] === "terminal-v2") {
        if (!ledger.readTerminalV2) return fail("LEDGER_V2_READER")
        admitDiagnosticPilotTerminalV2(start, ledger.readTerminalV2(start.root))
      } else {
        if (!ledger.readFailureDiagnosis) return fail("LEDGER_DIAGNOSIS_READER")
        admitDiagnosticPilotFailureDiagnosis(start, ledger.readFailureDiagnosis(start.root))
      }
      continue
    }
    const evidence = /^diagnostic-pilot-([a-f0-9]{64})\.evidence-([a-f0-9]{64})\.bin$/u.exec(name)
    if (evidence) {
      if (!allowed.includes(`sha256:${evidence[1]}` as LabRoot) || !ledger.readStart(`sha256:${evidence[1]}` as LabRoot) || !ledger.readEvidence) return fail("LEDGER_FOREIGN_EVIDENCE")
      ledger.readEvidence(`sha256:${evidence[1]}` as LabRoot, `sha256:${evidence[2]}` as LabRoot)
      continue
    }
    const match = /^diagnostic-pilot-([a-f0-9]{64})\.(started|terminal)\.json$/u.exec(name)
    if (!match) return fail("LEDGER_UNKNOWN_FILE")
    const ordinal = allowed.indexOf(`sha256:${match[1]}` as LabRoot)
    if (ordinal < 0) return fail("LEDGER_FOREIGN_START")
    const id = allowed[ordinal]!
    if (match[2] === "started") { present.push(ordinal); continue }
    if (!ledger.readStart(id)) return fail("LEDGER_UNCHARGED_TERMINAL")
  }
  present.sort((left, right) => left - right)
  if (present.some((ordinal, index) => ordinal !== index)) return fail("LEDGER_NONPREFIX")
  for (const ordinal of present.slice(0, -1)) {
    const cell = createDiagnosticPilotCell(allocation, ordinal), start = createDiagnosticPilotStart(allocation, cell)
    const old = ledger.readTerminal(start.root), next = prospective ? ledger.readTerminalV2?.(start.root) ?? null : null
    if (old !== null && next !== null) return fail("LEDGER_VERSION_MIX")
    const terminal = old !== null ? admitDiagnosticPilotTerminal(start, old) : next !== null ? admitDiagnosticPilotTerminalV2(start, next) : null
    if (!terminal || terminal.disposition !== "success" || terminal.processValidity !== "process_valid") return fail("LEDGER_PRIOR_NONPASS")
  }
  return uncertain
}
export const verifyDiagnosticPilotLedger = (ledger: Pick<DiagnosticPilotLedger, "readStart" | "readTerminal">, allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, start: DiagnosticPilotStart): Readonly<DiagnosticPilotStart> => {
  if (!openedLedgers.has(ledger) || (ledger as DiagnosticPilotLedger).directory !== resolve(DIAGNOSTIC_PILOT_STORE)) return fail("UNTRUSTED_LEDGER")
  inspectDiagnosticPilotInventory(ledger as DiagnosticPilotLedger, admitDiagnosticPilotAllocation(allocation), false, true)
  const expected = admitDiagnosticPilotStart(allocation, cell, start)
  const persisted = ledger.readStart(expected.root)
  if (!persisted) return fail("PRECHARGE_ABSENT")
  admitDiagnosticPilotStart(allocation, cell, persisted)
  if (ledger.readTerminal(expected.root) !== null || (ledger as DiagnosticPilotLedger).readTerminalV2?.(expected.root) != null) return fail("PRECHARGE_ALREADY_TERMINAL")
  return expected
}
const lifetimeGrants = new WeakSet<object>()
export interface DiagnosticPilotLifetimeGrant {
  readonly allocationRoot: LabRoot
  readonly cellRoot: LabRoot
  readonly startRoot: LabRoot
  readonly seat: "bottom" | "top"
  readonly containerName: string
  readonly ownershipLabel: string
  readonly ceilingMilliseconds: 240000
  toJSON(): never
}
export const createDiagnosticPilotLifetimeGrant = (ledger: DiagnosticPilotLedger, allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, start: DiagnosticPilotStart, seat: "bottom" | "top"): DiagnosticPilotLifetimeGrant => {
  const admitted = verifyDiagnosticPilotLedger(ledger, allocation, cell, start)
  const container = diagnosticPilotContainerIdentity(allocation, cell, seat)
  const grant = Object.freeze({ allocationRoot: allocation.root, cellRoot: cell.root, startRoot: admitted.root, seat, containerName: container.containerName, ownershipLabel: container.ownershipLabel, ceilingMilliseconds: 240_000 as const, toJSON(): never { return fail("GRANT_NON_SERIALIZABLE") } })
  lifetimeGrants.add(grant)
  return grant
}
export const requireDiagnosticPilotLifetimeGrant = (value: unknown, binding: { readonly allocationRoot: LabRoot; readonly cellRoot: LabRoot; readonly startRoot: LabRoot; readonly seat: "bottom" | "top"; readonly containerName: string; readonly ownershipLabel: string; readonly lifetimeMilliseconds: number }): DiagnosticPilotLifetimeGrant => {
  if (!value || typeof value !== "object" || !lifetimeGrants.has(value)) return fail("GRANT_UNISSUED")
  const grant = value as DiagnosticPilotLifetimeGrant
  if (grant.allocationRoot !== binding.allocationRoot || grant.cellRoot !== binding.cellRoot || grant.startRoot !== binding.startRoot || grant.seat !== binding.seat || grant.containerName !== binding.containerName || grant.ownershipLabel !== binding.ownershipLabel || grant.ceilingMilliseconds !== 240_000 || !Number.isSafeInteger(binding.lifetimeMilliseconds) || binding.lifetimeMilliseconds < 1 || binding.lifetimeMilliseconds > grant.ceilingMilliseconds) return fail("GRANT_BINDING")
  return grant
}
export const reopenDiagnosticPilotLedger = (ledger: Pick<DiagnosticPilotLedger, "readStart" | "readTerminal">, allocation: DiagnosticPilotAllocation): Readonly<{ issued: false; retentionUncertain: boolean; records: readonly { start: DiagnosticPilotStart; terminal: DiagnosticPilotTerminal | null; processValidity: "process_invalid" | "process_valid" }[] }> => {
  if (!openedLedgers.has(ledger) || (ledger as DiagnosticPilotLedger).directory !== resolve(DIAGNOSTIC_PILOT_STORE)) return fail("UNTRUSTED_LEDGER")
  const retentionUncertain = inspectDiagnosticPilotInventory(ledger as DiagnosticPilotLedger, admitDiagnosticPilotAllocation(allocation), true)
  const records = allocation.cells.map((_, ordinal) => {
    const cell = createDiagnosticPilotCell(allocation, ordinal), start = createDiagnosticPilotStart(allocation, cell), raw = ledger.readStart(start.root)
    if (!raw) return null
    admitDiagnosticPilotStart(allocation, cell, raw)
    const terminalRaw = ledger.readTerminal(start.root)
    if (terminalRaw === null) return { start, terminal: null, processValidity: "process_invalid" as const }
    const terminal = admitDiagnosticPilotTerminal(start, terminalRaw)
    if (terminal.evidenceRoot !== null) {
      const reader = (ledger as DiagnosticPilotLedger).readEvidence
      if (!reader) return fail("EVIDENCE_READER")
      reader(start.root, terminal.evidenceRoot)
    }
    return { start, terminal, processValidity: retentionUncertain ? "process_invalid" as const : terminal.processValidity }
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  if (records.some((entry, index) => entry.start.ordinal !== index)) return fail("NONPREFIX_LEDGER")
  return freezeLabValue({ issued: false as const, retentionUncertain, records })
}

export const reopenProspectiveDiagnosticPilotLedger = (ledger: DiagnosticPilotLedger, allocation: DiagnosticPilotAllocation) => {
  if (!openedLedgers.has(ledger) || ledger.directory !== resolve(DIAGNOSTIC_PILOT_STORE) || !ledger.readStageCheckpoint || !ledger.readTerminalV2 || !ledger.readFailureDiagnosis) return fail("UNTRUSTED_PROSPECTIVE_LEDGER")
  const uncertain = inspectDiagnosticPilotInventory(ledger, admitDiagnosticPilotAllocation(allocation), true, true)
  const records = allocation.cells.map((_, ordinal) => {
    const start = createDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, ordinal))
    if (!ledger.readStart(start.root)) return null
    admitDiagnosticPilotStart(allocation, createDiagnosticPilotCell(allocation, ordinal), ledger.readStart(start.root))
    if (ledger.readTerminal(start.root) !== null) return fail("PROSPECTIVE_LEGACY_TERMINAL")
    const stages: DiagnosticPilotStageCheckpoint[] = []
    for (let sequence = 0; sequence < 6; sequence++) {
      const raw = ledger.readStageCheckpoint!(start.root, sequence)
      if (raw === null) continue
      stages.push(admitDiagnosticPilotStageCheckpoint(start, raw, sequence))
    }
    const terminalRaw = ledger.readTerminalV2!(start.root)
    const terminal = terminalRaw === null ? null : admitDiagnosticPilotTerminalV2(start, terminalRaw)
    const diagnosisRaw = ledger.readFailureDiagnosis!(start.root)
    const diagnosis = diagnosisRaw === null ? null : admitDiagnosticPilotFailureDiagnosis(start, diagnosisRaw)
    const lastEnteredStage = stages.at(-1)?.stage ?? "unknown"
    if (terminal && (terminal.lastEnteredStage !== lastEnteredStage || terminal.failureStage !== "unknown" && !stages.some((checkpoint) => checkpoint.stage === terminal.failureStage) || terminal.cause !== "unknown_internal" && terminal.disposition === "success")) return fail("PROSPECTIVE_TERMINAL_STAGE")
    if (diagnosis && lastEnteredStage !== "terminal_publication") return fail("PROSPECTIVE_DIAGNOSIS_STAGE")
    return { start, stages, lastEnteredStage, cause: terminal?.cause ?? diagnosis?.cause ?? "unknown_internal", terminal, diagnosis, processValidity: uncertain || diagnosis || !terminal ? "process_invalid" as const : terminal.processValidity }
  }).filter((value): value is NonNullable<typeof value> => value !== null)
  if (records.some((entry, ordinal) => entry.start.ordinal !== ordinal)) return fail("PROSPECTIVE_NONPREFIX")
  return freezeLabValue({ retentionUncertain: uncertain, records })
}

export const createDiagnosticPilotProspectiveResult = (allocation: DiagnosticPilotAllocation, ledger: DiagnosticPilotLedger) => {
  const reopened = reopenProspectiveDiagnosticPilotLedger(ledger, allocation)
  const allSuccess = !reopened.retentionUncertain && reopened.records.length === allocation.cells.length && reopened.records.every((row) => row.terminal?.disposition === "success" && row.terminal.processValidity === "process_valid" && row.terminal.cleanupComplete && row.terminal.evidenceRoot !== null && row.diagnosis === null)
  const fields = { schemaVersion: "diagnostic-pilot-result-v2" as const, allocationRoot: allocation.root, legacyGateRoot: allocation.gateRoot, processValidity: allSuccess ? "process_valid" as const : "process_invalid" as const, chargedCount: reopened.records.length, slots: allocation.cells.map((_, ordinal) => { const row = reopened.records[ordinal]; return row ? { ordinal, status: row.terminal?.disposition ?? "start_only", lastEnteredStage: row.lastEnteredStage, failureStage: row.terminal?.failureStage ?? row.diagnosis?.failureStage ?? "unknown", cause: row.cause, terminalRoot: row.terminal?.root ?? null, diagnosisRoot: row.diagnosis?.root ?? null } : { ordinal, status: "unused", lastEnteredStage: "unknown", failureStage: "unknown", cause: "unknown_internal", terminalRoot: null, diagnosisRoot: null } }), empiricalAuthority: false as const, runAllowed: false as const, leagueRequirementsEvidence: false as const, formationAuthorized: false as const, holdoutAuthorized: false as const, counted: false as const, public: false as const, productionAuthorized: false as const }
  return freezeLabValue({ ...fields, root: labRoot("diagnostic-pilot-result-v2", fields) })
}
export const admitDiagnosticPilotProspectiveResult = (allocation: DiagnosticPilotAllocation, ledger: DiagnosticPilotLedger, value: unknown) => {
  if (!exactLabKeys(value, ["schemaVersion", "allocationRoot", "legacyGateRoot", "processValidity", "chargedCount", "slots", "empiricalAuthority", "runAllowed", "leagueRequirementsEvidence", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "root"]) || value.schemaVersion !== "diagnostic-pilot-result-v2") return fail("PROSPECTIVE_RESULT_KEYS")
  const expected = createDiagnosticPilotProspectiveResult(allocation, ledger)
  if (byteRoot(canonicalBytes(value)) !== byteRoot(canonicalBytes(expected))) return fail("PROSPECTIVE_RESULT_MISMATCH")
  return expected
}

/** Real repository adapter is defined here, but Plan 08 never creates or opens
 * the reserved pilot directory. Tests inject DiagnosticPilotLedger fakes. */
export const openDiagnosticPilotLedger = (directory: string): DiagnosticPilotLedger => {
  const path = resolve(directory), stat = lstatSync(path)
  if (path !== resolve(DIAGNOSTIC_PILOT_STORE) || basename(path) !== "league-265-diagnostic-pilot-20260923-a" || realpathSync(path) !== path || !stat.isDirectory() || (stat.mode & 0o777) !== 0o700) return fail("LEDGER_DIRECTORY")
  const filename = (kind: string, id: LabRoot) => join(path, `diagnostic-pilot-${id.slice(7)}.${kind}.json`)
  const read = (kind: string, id: LabRoot) => {
    if (!root(id)) return fail("LEDGER_ROOT")
    const file = filename(kind, id)
    let stat
    try { stat = lstatSync(file) } catch { return null }
    if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > 262_144) return fail("LEDGER_FILE")
    return parse(readFileSync(file))
  }
  const write = (kind: string, id: LabRoot, value: unknown) => {
    const data = canonicalBytes(value), target = filename(kind, id)
    if (read(kind, id) !== null) return fail("LEDGER_OVERWRITE")
    const temporary = `${target}.tmp-${randomUUID()}`
    const fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
    try { let written = 0; while (written < data.length) written += writeSync(fd, data, written, data.length - written); fsyncSync(fd) } finally { closeSync(fd) }
    try { linkSync(temporary, target) } finally { unlinkSync(temporary) }
    const dirFd = openSync(path, constants.O_RDONLY); try { fsyncSync(dirFd) } finally { closeSync(dirFd) }
    retainedBytes += data.length; retainedRecords++
    const spent = perStart.get(id) ?? { bytes: 0, records: 0 }
    spent.bytes += data.length; spent.records++; perStart.set(id, spent)
  }
  let retainedBytes = 0, retainedRecords = 0
  const perStart = new Map<LabRoot, { bytes: number; records: number }>()
  for (const name of readdirSync(path)) {
    const temporary = TEMPORARY.test(name)
    if (!temporary && !/^diagnostic-pilot-[a-f0-9]{64}\.(?:started|terminal|terminal-v2|failed-terminal-diagnosis|stage-[0-5])\.json$/u.test(name) && !/^diagnostic-pilot-[a-f0-9]{64}\.evidence-[a-f0-9]{64}\.bin$/u.test(name)) return fail("LEDGER_UNKNOWN_FILE")
    const entry = lstatSync(join(path, name))
    if (!entry.isFile() || entry.nlink !== 1 || (!temporary && entry.size < 1) || entry.size > 262_144 || (temporary && (entry.mode & 0o777) !== 0o600)) return fail("LEDGER_FILE")
    retainedBytes += entry.size; retainedRecords++
    const owned = /^diagnostic-pilot-([a-f0-9]{64})\./u.exec(name)
    if (owned) { const id = `sha256:${owned[1]}` as LabRoot, prior = perStart.get(id) ?? { bytes: 0, records: 0 }; prior.bytes += entry.size; prior.records++; perStart.set(id, prior) }
  }
  if (retainedBytes > 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes || retainedRecords > 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords || [...perStart.values()].some((entry) => entry.bytes > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes || entry.records > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords)) return fail("LEDGER_CAP")
  const prospectiveCapacity = (id: LabRoot, bytes: number, completedStages: number) => {
    const spent = perStart.get(id) ?? { bytes: 0, records: 0 }
    admitDiagnosticPilotProspectiveCapacity({ retainedBytes: spent.bytes, retainedRecords: spent.records, retainedInodes: spent.records, incomingBytes: bytes, completedStages, maxBytes: DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes, maxRecords: DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords, maxInodes: DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxInodes })
    admitDiagnosticPilotProspectiveCapacity({ retainedBytes, retainedRecords, retainedInodes: retainedRecords, incomingBytes: bytes, completedStages, maxBytes: 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes, maxRecords: 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords, maxInodes: 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxInodes })
  }
  const ledger = Object.freeze({ directory: path, writeStart(start: DiagnosticPilotStart) { write("started", start.root, start) }, readStart(id: LabRoot) { return read("started", id) }, writeTerminal(terminal: DiagnosticPilotTerminal) { if (!read("started", terminal.startRoot)) return fail("TERMINAL_UNCHARGED"); write("terminal", terminal.startRoot, terminal) }, readTerminal(id: LabRoot) { return read("terminal", id) }, listNames() { return readdirSync(path).sort() },
    writeStageCheckpoint(checkpoint: DiagnosticPilotStageCheckpoint) {
      if (!read("started", checkpoint.startRoot) || read("terminal", checkpoint.startRoot) || read("terminal-v2", checkpoint.startRoot)) return fail("STAGE_UNCHARGED_OR_TERMINAL")
      const admitted = createDiagnosticPilotStageCheckpoint({ root: checkpoint.startRoot } as DiagnosticPilotStart, checkpoint.ordinal, checkpoint.stage)
      if (checkpoint.root !== admitted.root) return fail("STAGE_ORDER")
      const existingStages = DIAGNOSTIC_PILOT_STAGES.flatMap((_, ordinal) => read(`stage-${ordinal}`, checkpoint.startRoot) === null ? [] : [ordinal])
      if (existingStages.some((ordinal) => ordinal >= checkpoint.ordinal)) return fail("STAGE_ORDER")
      prospectiveCapacity(checkpoint.startRoot, canonicalBytes(checkpoint).length, existingStages.length)
      write(`stage-${checkpoint.ordinal}`, checkpoint.startRoot, checkpoint)
    },
    readStageCheckpoint(id: LabRoot, ordinal: number) { if (!Number.isSafeInteger(ordinal) || ordinal < 0 || ordinal >= 6) return fail("STAGE_ORDINAL"); return read(`stage-${ordinal}`, id) },
    writeTerminalV2(terminal: DiagnosticPilotTerminalV2) {
      if (!read("started", terminal.startRoot) || !read("stage-5", terminal.startRoot) || read("terminal", terminal.startRoot) || read("terminal-v2", terminal.startRoot)) return fail("TERMINAL_V2_PRECONDITION")
      admitDiagnosticPilotTerminalV2({ root: terminal.startRoot } as DiagnosticPilotStart, terminal)
      write("terminal-v2", terminal.startRoot, terminal)
    },
    readTerminalV2(id: LabRoot) { return read("terminal-v2", id) },
    writeFailureDiagnosis(diagnosis: DiagnosticPilotFailureDiagnosis) {
      if (!read("started", diagnosis.startRoot) || !read("stage-5", diagnosis.startRoot)) return fail("DIAGNOSIS_PRECONDITION")
      admitDiagnosticPilotFailureDiagnosis({ root: diagnosis.startRoot } as DiagnosticPilotStart, diagnosis)
      prospectiveCapacity(diagnosis.startRoot, canonicalBytes(diagnosis).length, 6)
      write("failed-terminal-diagnosis", diagnosis.startRoot, diagnosis)
    },
    readFailureDiagnosis(id: LabRoot) { return read("failed-terminal-diagnosis", id) },
    writeEvidence(startRoot: LabRoot, bytes: Uint8Array): LabRoot {
      if (!root(startRoot) || !(bytes instanceof Uint8Array) || bytes.length < 1 || bytes.length > 131_072 || !read("started", startRoot)) return fail("EVIDENCE_INPUT")
      const completedStages = DIAGNOSTIC_PILOT_STAGES.filter((_, ordinal) => read(`stage-${ordinal}`, startRoot) !== null).length
      if (completedStages) prospectiveCapacity(startRoot, bytes.length, completedStages)
      const identity = byteRoot(bytes), target = join(path, `diagnostic-pilot-${startRoot.slice(7)}.evidence-${identity.slice(7)}.bin`)
      const spent = perStart.get(startRoot) ?? { bytes: 0, records: 0 }
      if (spent.records + 2 > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords || spent.records + 2 > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxInodes || spent.bytes + bytes.length + DIAGNOSTIC_PILOT_ARTIFACT_CEILING.terminalReserveBytes > DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes || retainedRecords + 2 > 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxRecords || retainedBytes + bytes.length + DIAGNOSTIC_PILOT_ARTIFACT_CEILING.terminalReserveBytes > 4 * DIAGNOSTIC_PILOT_ARTIFACT_CEILING.maxBytes) return fail("EVIDENCE_CAP")
      try { const prior = lstatSync(target); if (prior.isFile() && prior.nlink === 1 && prior.size === bytes.length && byteRoot(readFileSync(target)) === identity) return identity; return fail("EVIDENCE_COLLISION") } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error }
      const temporary = `${target}.tmp-${randomUUID()}`
      const fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
      try { let offset = 0; while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset); fsyncSync(fd) } finally { closeSync(fd) }
      try { linkSync(temporary, target) } finally { unlinkSync(temporary) }
      const dirFd = openSync(path, constants.O_RDONLY); try { fsyncSync(dirFd) } finally { closeSync(dirFd) }
      retainedBytes += bytes.length; retainedRecords++
      spent.bytes += bytes.length; spent.records++; perStart.set(startRoot, spent)
      return identity
    },
    readEvidence(startRoot: LabRoot, evidenceRoot: LabRoot): Uint8Array {
      if (!root(startRoot) || !root(evidenceRoot) || !read("started", startRoot)) return fail("EVIDENCE_ROOT")
      const file = join(path, `diagnostic-pilot-${startRoot.slice(7)}.evidence-${evidenceRoot.slice(7)}.bin`), stat = lstatSync(file)
      if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > 131_072) return fail("EVIDENCE_FILE")
      const bytes = readFileSync(file)
      if (byteRoot(bytes) !== evidenceRoot) return fail("EVIDENCE_HASH")
      return bytes
    },
  })
  openedLedgers.add(ledger)
  return ledger
}

export interface DiagnosticPilotAssessedCandidate { readonly slot: "S01" | "S03"; readonly candidate: FactoryCandidate; readonly admission: LeagueCandidateAdmission; readonly closure: FactoryCandidateClosure; readonly historicalStore: string }
const assessed = new WeakSet<object>()
export const requireDiagnosticPilotAssessedCandidate = (value: DiagnosticPilotAssessedCandidate, repository: FactoryRepository): DiagnosticPilotAssessedCandidate => {
  const pin = DIAGNOSTIC_PILOT_BASES.find((row) => row.slot === value?.slot)
  if (!pin || !assessed.has(value) || value.historicalStore !== repository.directory || value.candidate.root !== pin.candidateRoot || value.admission.root !== pin.admissionRoot || value.closure.factoryRepository.directory !== repository.directory) return fail("UNAUTHENTICATED_CLOSURE")
  return value
}
const readAttempt = (repository: FactoryRepository, id: LabRoot, kind: "started" | "terminal") => {
  const path = join(repository.directory, `factory-attempt-${id.slice(7)}.${kind}.json`), stat = lstatSync(path)
  if (!stat.isFile() || stat.nlink !== 1 || stat.size < 1 || stat.size > 262_144) return fail("HISTORICAL_ATTEMPT_FILE")
  return parse(readFileSync(path))
}
const readArtifactRecord = (repository: FactoryRepository, artifactRoot: LabRoot, domain: string, keys: readonly string[]) => record(domain, parse(readFactoryArtifact(repository, artifactRoot)), keys)

/** Exact-root historical reopening. No indexFactory, whole-store ledger or
 * 48-workload assessment replay occurs, and no execution capability is issued. */
export const readDiagnosticPilotAssessedPair = (repository: FactoryRepository): readonly [DiagnosticPilotAssessedCandidate, DiagnosticPilotAssessedCandidate] => {
  if (basename(repository.directory) !== "factory-264-fresh-20260914-approved-two") return fail("HISTORICAL_STORE")
  const pin = DIAGNOSTIC_PILOT_ASSESSMENT
  const assessment = readArtifactRecord(repository, pin.artifactRoot, "factory-independence-assessment-v2", ["privacy", "input", "manifestRoot", "allocationRoot", "implementationRoot", "executionEvidenceRoot", "status", "reasons", "thresholdArtifactRoot", "controls", "baseEdges", "strategicSharingViolations", "completedCells", "completePairs", "scope", "competitiveClaim", "publicAuthority", "holdoutOpened", "formationMaterialized", "correctionArtifactRoot"])
  if (assessment.root !== pin.assessmentRoot || assessment.privacy !== "private_offline" || assessment.status !== "affirmed" || !Array.isArray(assessment.reasons) || assessment.reasons.length !== 0 || assessment.thresholdArtifactRoot !== pin.thresholdArtifactRoot || assessment.implementationRoot !== pin.assessmentImplementationRoot || assessment.correctionArtifactRoot !== pin.correctionArtifactRoot || assessment.competitiveClaim !== "none" || assessment.publicAuthority !== false || assessment.holdoutOpened !== false || assessment.formationMaterialized !== false) return fail("ASSESSMENT")
  const input = assessment.input as Record<string, unknown>
  if (!input || input.executionEvidenceArtifactRoot !== pin.executionArtifactRoot || !Array.isArray(input.candidateArtifactRoots) || !Array.isArray(input.supervisionArtifactRoots) || !Array.isArray(input.terminalRoots) || input.candidateArtifactRoots.length !== 48 || input.supervisionArtifactRoots.length !== 48 || input.terminalRoots.length !== 48) return fail("ASSESSMENT_INPUT")
  const threshold = readArtifactRecord(repository, pin.thresholdArtifactRoot, "factory-numeric-threshold-v2", ["allocationRoot", "controls", "correctionArtifactRoot", "implementationRoot", "manifestRoot", "measurementPolicyRoot", "receiptRoots", "sourceRoots", "studyPolicyRoot", "threshold"])
  if (threshold.manifestRoot !== assessment.manifestRoot || threshold.allocationRoot !== assessment.allocationRoot || threshold.correctionArtifactRoot !== pin.correctionArtifactRoot || threshold.implementationRoot !== pin.assessmentImplementationRoot || !Array.isArray(threshold.sourceRoots) || threshold.sourceRoots.length !== 12) return fail("THRESHOLD")
  const fit = freezeNumericCalibrationThreshold(threshold.controls as NumericControlTable)
  if (fit.status !== "frozen" || labRoot("league-threshold-compare-v1", fit.threshold) !== labRoot("league-threshold-compare-v1", threshold.threshold)) return fail("THRESHOLD_NUMERIC")
  const execution = readArtifactRecord(repository, pin.executionArtifactRoot, "factory-calibration-execution-evidence-v1", ["authoring", "manifestRoot", "negativeWitnessArtifactRoots", "sharedHelperAuditArtifactRoot", "sourceCommit", "sourceReviewArtifactRoot", "teacherSearchArtifactRoot", "teacherTrainingArtifactRoot"])
  const producerReview = readArtifactRecord(repository, pin.producerReviewArtifactRoot, "factory-source-review-v1", ["authorIds", "implementationRoot", "reviewerId", "sourceCommit", "status", "unresolvedFindings", "reportArtifactRoot"])
  const assessorReview = readArtifactRecord(repository, pin.assessorReviewArtifactRoot, "factory-source-review-v1", ["authorIds", "implementationRoot", "reviewerId", "sourceCommit", "status", "unresolvedFindings", "reportArtifactRoot"])
  const correction = readArtifactRecord(repository, pin.correctionArtifactRoot, "factory-assessment-correction-v1", ["reason", "executionEvidenceArtifactRoot", "historicalManifestArtifactRoot", "assessorReviewArtifactRoot", "failureArtifactRoot", "inputRoot", "priorCorrectionFailureArtifactRoot"])
  if (execution.sourceReviewArtifactRoot !== pin.producerReviewArtifactRoot || execution.sourceCommit !== producerReview.sourceCommit || producerReview.implementationRoot !== pin.producerImplementationRoot || producerReview.status !== "passed" || producerReview.unresolvedFindings !== 0 || assessorReview.implementationRoot !== pin.assessmentImplementationRoot || assessorReview.status !== "passed" || assessorReview.unresolvedFindings !== 0 || correction.executionEvidenceArtifactRoot !== pin.executionArtifactRoot || correction.assessorReviewArtifactRoot !== pin.assessorReviewArtifactRoot || correction.inputRoot !== labRoot("factory-assessment-correction-input-v1", input)) return fail("HISTORICAL_LINEAGE")
  const entries = DIAGNOSTIC_PILOT_BASES.map((base, index): DiagnosticPilotAssessedCandidate => {
    const publication = readArtifactRecord(repository, base.publication as LabRoot, "factory-candidate-publication-v1", ["privacy", "candidate", "independenceReceipt", "supervisionReceiptRoot", "independenceStatus"])
    const candidate = FactoryCandidateSchema.parse(publication.candidate)
    if (publication.privacy !== "private_offline" || candidate.root !== base.candidateRoot || candidate.supervisionReceiptRoot !== publication.supervisionReceiptRoot || candidate.proposal.source.root !== base.source || !(input.candidateArtifactRoots as unknown[]).includes(base.publication) || !(input.supervisionArtifactRoots as unknown[]).includes(base.supervision) || !(input.terminalRoots as unknown[]).includes(base.terminal)) return fail("PUBLICATION_MEMBERSHIP")
    if ((threshold.sourceRoots as unknown[])[index === 0 ? 0 : 2] !== base.source || (threshold.sourceRoots as unknown[]).filter((value: unknown) => value === base.source).length !== 1) return fail("THRESHOLD_SLOT")
    const edges = assessment.baseEdges as Record<string, NumericComparison>
    const required = index === 0 ? ["S01/S03", "S01/S05"] : ["S01/S03", "S03/S05"]
    if (required.some((edge) => !edges[edge] || classifyNumericComparison(edges[edge], fit.threshold) !== "distinct")) return fail("ASSESSMENT_DISTINCT")
    const start = validateFactoryAttemptStart(readAttempt(repository, base.start as LabRoot, "started"))
    const terminal = validateFactoryAttemptLedger(start, validateFactoryAttemptTerminal(readAttempt(repository, base.start as LabRoot, "terminal")))
    if (start.root !== base.start || start.candidateRoot !== candidate.proposal.packetRoot || terminal.root !== base.terminal || terminal.outputRoot !== base.supervision || terminal.disposition !== "unresolved") return fail("ATTEMPT_JOIN")
    const retained = readFactorySupervisionArtifactRecords(repository, base.supervision as LabRoot, { maxBytes: base.supervisionBytes, maxRecords: base.supervisionRecords })
    if (retained.descriptor.byteLength !== base.supervisionBytes || retained.descriptor.recordCount !== base.supervisionRecords || retained.descriptor.receiptRoot !== candidate.supervisionReceiptRoot) return fail("SUPERVISION_DESCRIPTOR")
    const receipt = retained.records.find((entry) => entry.kind === "receipt")?.value as Record<string, unknown> | undefined
    const identity = receipt?.candidateIdentity as Record<string, unknown> | undefined, admission = receipt?.admission as Record<string, unknown> | undefined
    if (!identity || !admission || identity.sourceRoot !== base.source || identity.attemptRoot !== start.root || identity.budgetRoot !== start.budgetRoot || admission.sourceRoot !== base.source || admission.packetRoot !== candidate.proposal.packetRoot || admission.proposalRoot !== candidate.proposal.root || admission.validationRoot !== candidate.validation.root || retained.records.find((entry) => entry.kind === "execution")?.value && (retained.records.find((entry) => entry.kind === "execution")!.value as Record<string, unknown>).kind !== "completed") return fail("SUPERVISION_JOIN")
    const packet = FactoryOraclePacketSchema.parse(parse(readFactoryArtifact(repository, base.packet as LabRoot)))
    const proposal = FactoryProposalSchema.parse(parse(readFactoryArtifact(repository, base.proposal as LabRoot)))
    const validation = FactoryValidationEvidenceSchema.parse(parse(readFactoryArtifact(repository, base.validation as LabRoot)))
    const source = readFactoryArtifact(repository, base.source as LabRoot)
    if (packet.root !== candidate.proposal.packetRoot || proposal.root !== candidate.proposal.root || validation.root !== candidate.validation.root || packet.source.root !== base.source || proposal.source.root !== base.source || byteRoot(source) !== base.source || source.byteLength !== candidate.proposal.source.byteLength) return fail("CLOSURE_JOIN")
    const importEvidence = { sourcePhase: 264 as const, publicationArtifactRoot: base.publication, supervisionArtifactRoot: base.supervision, assessmentArtifactRoot: pin.artifactRoot, assessmentRoot: pin.assessmentRoot, thresholdArtifactRoot: pin.thresholdArtifactRoot, sourceSlot: base.slot, qualification: "base_distinct" as const }
    const admissionFields = { schemaVersion: "league-candidate-import-v1" as const, privacy: "private_offline" as const, candidate, supervisionReceiptRoot: candidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", candidate.lineage), tupleRoot: candidate.proposal.build.compatibilityTupleRoot, runtimeRoot: candidate.proposal.nativeLane.runtimeProfileRoot, provenanceRoot: labRoot("league-import-provenance-v1", importEvidence), attemptStart: start, attemptTerminal: terminal, importEvidence }
    const admitted = LeagueCandidateAdmissionSchema.parse({ ...admissionFields, root: labRoot("league-candidate-import-v1", admissionFields) })
    if (admitted.root !== base.admissionRoot) return fail("ADMISSION_ROOT")
    const closure: FactoryCandidateClosure = { factoryRepository: repository, candidatePublicationArtifactRoot: base.publication as LabRoot, sourceArtifactRoot: base.source as LabRoot, packetArtifactRoot: base.packet as LabRoot, proposalArtifactRoot: base.proposal as LabRoot, validationArtifactRoot: base.validation as LabRoot }
    const result = Object.freeze({ slot: base.slot, candidate, admission: admitted, closure: Object.freeze(closure), historicalStore: repository.directory }) as DiagnosticPilotAssessedCandidate
    assessed.add(result)
    return result
  })
  return Object.freeze(entries) as unknown as readonly [DiagnosticPilotAssessedCandidate, DiagnosticPilotAssessedCandidate]
}
