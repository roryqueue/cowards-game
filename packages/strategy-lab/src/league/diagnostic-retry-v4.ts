import { createHash, randomUUID } from "node:crypto"
import { closeSync, constants, fsyncSync, linkSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, createSetScenarioV137, validateCanonicalTransition, type CanonicalKernelSemanticTransition } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../contracts.js"
import { type runCanonicalLabMatch, type LabMatchExecution } from "../runtime-bridge.js"
import { runDiagnosticRetryV4CanonicalFromBridge, type DiagnosticRetryV4BridgePermit } from "./diagnostic-retry-v4-bridge.js"
import {
  DIAGNOSTIC_PILOT_BASES,
  DIAGNOSTIC_PILOT_GEOMETRY,
  DIAGNOSTIC_PILOT_STAGES,
  type DiagnosticPilotCause,
  type DiagnosticPilotOldEvidenceBaseline,
  type DiagnosticPilotStage,
} from "./diagnostic-pilot.js"

/** Distinct prospective v4 records never reuse the consumed v3 ledger. */
const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_RETRY_V4_${code}`) }
const ROOT = /^sha256:[0-9a-f]{64}$/u
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const encode = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength < 1 || admitted.canonicalByteLength > 262_144) return fail("CANONICAL_BYTES")
  return admitted.canonicalBytes
}
const parse = (bytes: Uint8Array): Record<string, unknown> => {
  const admitted = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!admitted.ok || admitted.value === null || typeof admitted.value !== "object" || Array.isArray(admitted.value)) return fail("CANONICAL_RECORD")
  return admitted.value as Record<string, unknown>
}
const same = (left: unknown, right: unknown): boolean => byteRoot(encode(left)) === byteRoot(encode(right))
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => exactLabKeys(value, keys)
const integer = (value: unknown, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max

export const DIAGNOSTIC_RETRY_V4_STORE = ".strategy-lab/league-265-retry-v4" as const
export const DIAGNOSTIC_RETRY_V4_SEED = "league-265-one-cell-diagnostic-v3-20260929-a" as const
export const DIAGNOSTIC_RETRY_V4_ALLOCATION_PATH = ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-allocation-v4.json" as const
export const DIAGNOSTIC_RETRY_V4_PREFLIGHT_ATTEMPT_PATH = ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-preflight-attempt-v4.json" as const
export const DIAGNOSTIC_RETRY_V4_PREFLIGHT_DISPOSITION_PATH = ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-preflight-disposition-v4.json" as const
export const DIAGNOSTIC_RETRY_V4_RESULT_PATH = ".planning/artifacts/v1.38-phase-265-one-cell-diagnostic-result-v4.json" as const
export const DIAGNOSTIC_RETRY_V4_STAGES = DIAGNOSTIC_PILOT_STAGES
export type DiagnosticRetryV4StageName = DiagnosticPilotStage
export type DiagnosticRetryV4Cause = DiagnosticPilotCause | "transition_chain" | "transition_schema" | "evidence_outcome" | "evidence_accounting" | "evidence_orphan" | "evidence_incomplete"
const SAFE_CAUSES: Readonly<Record<string, DiagnosticRetryV4Cause>> = Object.freeze({
  DIAGNOSTIC_RETRY_V4_EVIDENCE_TRANSITION_CHAIN: "transition_chain",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_TRANSITION: "transition_schema",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_OUTCOME: "evidence_outcome",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_ACCOUNTING: "evidence_accounting",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_ORPHAN: "evidence_orphan",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_INCOMPLETE_MATCH: "evidence_incomplete",
  DIAGNOSTIC_RETRY_V4_CLI_WORKER_CANDIDATE: "worker_candidate",
  DIAGNOSTIC_RETRY_V4_CLI_PILOT_REQUEST_BINDING: "pilot_request_binding",
  DIAGNOSTIC_RETRY_V4_CLI_PILOT_MATCH_BINDING: "pilot_match_binding",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_ROW_CAP: "evidence_row_cap",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_OUTCOME_CAP: "evidence_outcome_cap",
  DIAGNOSTIC_RETRY_V4_EVIDENCE_CAP: "evidence_cap",
  DIAGNOSTIC_RETRY_V4_CLI_WORKER_MISSING_EVIDENCE: "worker_missing_evidence",
  DIAGNOSTIC_RETRY_V4_CLI_WORKER_CELL_REOPEN: "worker_cell_reopen",
  DIAGNOSTIC_RETRY_V4_LEDGER_CAP: "ledger_cap",
  DIAGNOSTIC_RETRY_V4_LEDGER_OVERWRITE: "ledger_overwrite",
})
export const safeDiagnosticRetryV4Cause = (error: unknown): DiagnosticRetryV4Cause => error instanceof Error ? SAFE_CAUSES[error.message] ?? "unknown_internal" : "unknown_internal"

export const DIAGNOSTIC_RETRY_V4_CAPACITY = freezeLabValue({
  version: "diagnostic-retry-capacity-v4",
  maxBytes: 21_686_779_904,
  maxRecords: 2_218_528,
  maxInodes: 4_437_184,
  terminalReserveBytes: 524_288,
  terminalReserveInodes: 8,
  maxFailureBytes: 262_144,
})
const baselineKeys = ["oldAllocationV2", "oldAllocationUnversioned", "oldResult", "oldLeagueTree", "oldFactoryTree"] as const
const allocationKeys = ["attemptOrdinal", "envelopeRoot","schemaVersion", "root", "evidenceClass", "privacy", "phase", "seed", "scenarioId", "semanticGeometryHash", "candidateRoots", "candidateAdmissionRoots", "tupleRoot", "runtimeRoot", "image", "perMatchMilliseconds", "overallMilliseconds", "cleanupReserveMilliseconds", "retryCount", "cells", "sourceClosureRoot", "implementationRoot", "gateRoot", "oldEvidenceBaseline", "artifactCeiling", "leagueRequirementsEvidence", "freezeAuthorized", "formationAuthorized", "holdoutAuthorized", "counted", "public", "productionAuthorized", "store"] as const
const scenario = () => createSetScenarioV137({
  arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
  arenaSemanticGeometryHash: DIAGNOSTIC_PILOT_GEOMETRY,
  entrantA: { entrantKey: DIAGNOSTIC_PILOT_BASES[0].candidateRoot, playerId: `league-${DIAGNOSTIC_PILOT_BASES[0].candidateRoot.slice(7)}` },
  entrantB: { entrantKey: DIAGNOSTIC_PILOT_BASES[1].candidateRoot, playerId: `league-${DIAGNOSTIC_PILOT_BASES[1].candidateRoot.slice(7)}` },
  baseSeed: DIAGNOSTIC_RETRY_V4_SEED,
})
export interface DiagnosticRetryV4AllocationIdentity {
  readonly attemptOrdinal: number
  readonly envelopeRoot: LabRoot
  readonly sourceClosureRoot: LabRoot
  readonly implementationRoot: LabRoot
  readonly gateRoot: LabRoot
  readonly oldEvidenceBaseline: DiagnosticPilotOldEvidenceBaseline
}
export interface DiagnosticRetryV4Allocation {
  readonly attemptOrdinal: number
  readonly envelopeRoot: LabRoot
  readonly schemaVersion: "diagnostic-retry-allocation-v4"
  readonly root: LabRoot
  readonly evidenceClass: "diagnostic_only"
  readonly privacy: "private_offline"
  readonly phase: 265
  readonly seed: typeof DIAGNOSTIC_RETRY_V4_SEED
  readonly scenarioId: string
  readonly semanticGeometryHash: LabRoot
  readonly candidateRoots: readonly [LabRoot, LabRoot]
  readonly candidateAdmissionRoots: readonly [LabRoot, LabRoot]
  readonly tupleRoot: LabRoot
  readonly runtimeRoot: LabRoot
  readonly image: string
  readonly perMatchMilliseconds: 240000
  readonly overallMilliseconds: 600000
  readonly cleanupReserveMilliseconds: 30000
  readonly retryCount: 0
  readonly cells: readonly [Readonly<{ ordinal: 0; conditionId: string; requestIdentity: string; bottomCandidateRoot: LabRoot; topCandidateRoot: LabRoot; initialInitiativeCandidateRoot: LabRoot }>]
  readonly sourceClosureRoot: LabRoot
  readonly implementationRoot: LabRoot
  readonly gateRoot: LabRoot
  readonly oldEvidenceBaseline: DiagnosticPilotOldEvidenceBaseline
  readonly artifactCeiling: typeof DIAGNOSTIC_RETRY_V4_CAPACITY
  readonly leagueRequirementsEvidence: false
  readonly freezeAuthorized: false
  readonly formationAuthorized: false
  readonly holdoutAuthorized: false
  readonly counted: false
  readonly public: false
  readonly productionAuthorized: false
  readonly store: string
}
export const createDiagnosticRetryV4Allocation = (identity: DiagnosticRetryV4AllocationIdentity): Readonly<DiagnosticRetryV4Allocation> => {
  if (!exact(identity, ["attemptOrdinal", "envelopeRoot", "sourceClosureRoot", "implementationRoot", "gateRoot", "oldEvidenceBaseline"]) || !integer(identity.attemptOrdinal, 5) || identity.attemptOrdinal < 1 || !root(identity.envelopeRoot) || ![identity.sourceClosureRoot, identity.implementationRoot, identity.gateRoot].every(root) || !exact(identity.oldEvidenceBaseline, baselineKeys) || !Object.values(identity.oldEvidenceBaseline).every(root)) return fail("ALLOCATION_SOURCE")
  const source = scenario(), row = source.conditions[0]
  if (!row || row.suffix !== "a-bottom-a-first" || row.ordinal !== 0 || row.bottomEntrantKey !== DIAGNOSTIC_PILOT_BASES[0].candidateRoot || row.topEntrantKey !== DIAGNOSTIC_PILOT_BASES[1].candidateRoot || row.initialInitiativeEntrantKey !== DIAGNOSTIC_PILOT_BASES[0].candidateRoot) return fail("CANONICAL_CONDITION")
  const fields = { attemptOrdinal: identity.attemptOrdinal, envelopeRoot: identity.envelopeRoot, evidenceClass: "diagnostic_only" as const, privacy: "private_offline" as const, phase: 265 as const, seed: DIAGNOSTIC_RETRY_V4_SEED, scenarioId: source.scenarioId, semanticGeometryHash: DIAGNOSTIC_PILOT_GEOMETRY, candidateRoots: [DIAGNOSTIC_PILOT_BASES[0].candidateRoot, DIAGNOSTIC_PILOT_BASES[1].candidateRoot] as const, candidateAdmissionRoots: [DIAGNOSTIC_PILOT_BASES[0].admissionRoot, DIAGNOSTIC_PILOT_BASES[1].admissionRoot] as const, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image, perMatchMilliseconds: 240_000 as const, overallMilliseconds: 600_000 as const, cleanupReserveMilliseconds: 30_000 as const, retryCount: 0 as const, cells: [{ ordinal: 0 as const, conditionId: row.conditionId, requestIdentity: row.requestIdentity, bottomCandidateRoot: row.bottomEntrantKey as LabRoot, topCandidateRoot: row.topEntrantKey as LabRoot, initialInitiativeCandidateRoot: row.initialInitiativeEntrantKey as LabRoot }] as const, sourceClosureRoot: identity.sourceClosureRoot, implementationRoot: identity.implementationRoot, gateRoot: identity.gateRoot, oldEvidenceBaseline: identity.oldEvidenceBaseline, artifactCeiling: DIAGNOSTIC_RETRY_V4_CAPACITY, leagueRequirementsEvidence: false as const, freezeAuthorized: false as const, formationAuthorized: false as const, holdoutAuthorized: false as const, counted: false as const, public: false as const, productionAuthorized: false as const, store: `${DIAGNOSTIC_RETRY_V4_STORE}-${identity.attemptOrdinal}-${labRoot("diagnostic-retry-logical-task-v4", { seed: DIAGNOSTIC_RETRY_V4_SEED, candidates: DIAGNOSTIC_PILOT_BASES.map((entry) => entry.candidateRoot), geometry: DIAGNOSTIC_PILOT_GEOMETRY }).slice(7)}` }
  const base = { schemaVersion: "diagnostic-retry-allocation-v4" as const, ...fields }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-retry-allocation-v4", base) })
}
export const admitDiagnosticRetryV4Allocation = (value: unknown): Readonly<DiagnosticRetryV4Allocation> => {
  if (!exact(value, allocationKeys) || value.schemaVersion !== "diagnostic-retry-allocation-v4" || !root(value.root)) return fail("ALLOCATION_KEYS")
  const candidate = value as unknown as DiagnosticRetryV4Allocation
  const expected = createDiagnosticRetryV4Allocation({ attemptOrdinal: candidate.attemptOrdinal, envelopeRoot: candidate.envelopeRoot, sourceClosureRoot: candidate.sourceClosureRoot, implementationRoot: candidate.implementationRoot, gateRoot: candidate.gateRoot, oldEvidenceBaseline: candidate.oldEvidenceBaseline })
  if (!same(value, expected)) return fail("ALLOCATION_MISMATCH")
  return expected
}

export interface DiagnosticRetryV4Cell { readonly schemaVersion: "diagnostic-retry-cell-v4"; readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly ordinal: 0; readonly conditionId: string; readonly requestIdentity: string; readonly requestRoot: LabRoot; readonly bottomCandidateRoot: LabRoot; readonly topCandidateRoot: LabRoot; readonly initialInitiativeCandidateRoot: LabRoot; readonly semanticGeometryHash: LabRoot; readonly tupleRoot: LabRoot; readonly runtimeRoot: LabRoot }
export const createDiagnosticRetryV4Cell = (allocation: DiagnosticRetryV4Allocation, ordinal: number): Readonly<DiagnosticRetryV4Cell> => {
  const admitted = admitDiagnosticRetryV4Allocation(allocation)
  if (ordinal !== 0) return fail("CELL_ORDINAL")
  const row = admitted.cells[0]
  const base = { schemaVersion: "diagnostic-retry-cell-v4" as const, allocationRoot: admitted.root, ordinal: 0 as const, conditionId: row.conditionId, requestIdentity: row.requestIdentity, requestRoot: labRoot("diagnostic-retry-request-v4", { allocationRoot: admitted.root, ordinal: 0, requestIdentity: row.requestIdentity }), bottomCandidateRoot: row.bottomCandidateRoot, topCandidateRoot: row.topCandidateRoot, initialInitiativeCandidateRoot: row.initialInitiativeCandidateRoot, semanticGeometryHash: admitted.semanticGeometryHash, tupleRoot: admitted.tupleRoot, runtimeRoot: admitted.runtimeRoot }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-retry-cell-v4", base) })
}
export const admitDiagnosticRetryV4Cell = (allocation: DiagnosticRetryV4Allocation, value: unknown): Readonly<DiagnosticRetryV4Cell> => {
  if (!exact(value, ["schemaVersion", "root", "allocationRoot", "ordinal", "conditionId", "requestIdentity", "requestRoot", "bottomCandidateRoot", "topCandidateRoot", "initialInitiativeCandidateRoot", "semanticGeometryHash", "tupleRoot", "runtimeRoot"])) return fail("CELL_KEYS")
  const expected = createDiagnosticRetryV4Cell(allocation, value.ordinal as number)
  if (!same(value, expected)) return fail("CELL_MISMATCH")
  return expected
}
export interface DiagnosticRetryV4Start { readonly schemaVersion: "diagnostic-retry-start-v4"; readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly cellRoot: LabRoot; readonly ordinal: 0; readonly requestRoot: LabRoot }
export const createDiagnosticRetryV4Start = (allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell): Readonly<DiagnosticRetryV4Start> => {
  const admitted = admitDiagnosticRetryV4Cell(allocation, cell)
  const base = { schemaVersion: "diagnostic-retry-start-v4" as const, allocationRoot: admitted.allocationRoot, cellRoot: admitted.root, ordinal: 0 as const, requestRoot: admitted.requestRoot }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-retry-start-v4", base) })
}
export const admitDiagnosticRetryV4Start = (allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, value: unknown): Readonly<DiagnosticRetryV4Start> => {
  if (!exact(value, ["schemaVersion", "root", "allocationRoot", "cellRoot", "ordinal", "requestRoot"])) return fail("START_KEYS")
  const expected = createDiagnosticRetryV4Start(allocation, cell)
  if (!same(value, expected)) return fail("START_MISMATCH")
  return expected
}
export interface DiagnosticRetryV4Stage { readonly schemaVersion: "diagnostic-retry-stage-v4"; readonly root: LabRoot; readonly startRoot: LabRoot; readonly ordinal: number; readonly stage: DiagnosticRetryV4StageName }
export const createDiagnosticRetryV4Stage = (start: DiagnosticRetryV4Start, ordinal: number, stage: DiagnosticRetryV4StageName): Readonly<DiagnosticRetryV4Stage> => {
  if (!root(start.root) || !integer(ordinal, 5) || DIAGNOSTIC_RETRY_V4_STAGES[ordinal] !== stage) return fail("STAGE_ORDER")
  const base = { schemaVersion: "diagnostic-retry-stage-v4" as const, startRoot: start.root, ordinal, stage }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-retry-stage-v4", base) })
}
export const admitDiagnosticRetryV4Stage = (start: DiagnosticRetryV4Start, value: unknown, ordinal: number): Readonly<DiagnosticRetryV4Stage> => {
  if (!exact(value, ["schemaVersion", "root", "startRoot", "ordinal", "stage"])) return fail("STAGE_KEYS")
  const expected = createDiagnosticRetryV4Stage(start, ordinal, value.stage as DiagnosticRetryV4StageName)
  if (!same(value, expected)) return fail("STAGE_MISMATCH")
  return expected
}
export interface DiagnosticRetryV4Terminal { readonly schemaVersion: "diagnostic-retry-terminal-v4"; readonly root: LabRoot; readonly startRoot: LabRoot; readonly disposition: "success" | "system_failure" | "player_violation" | "timeout" | "uncertain"; readonly processValidity: "process_valid" | "process_invalid"; readonly evidenceRoot: LabRoot | null; readonly cleanupComplete: boolean; readonly elapsedMilliseconds: number; readonly artifactBytes: number; readonly artifactRecords: number; readonly code: "completed" | "system_failure" | "player_violation" | "cell_deadline" | "overall_deadline" | "cleanup_incomplete" | "publication_uncertain"; readonly lastEnteredStage: DiagnosticRetryV4StageName | "unknown"; readonly failureStage: DiagnosticRetryV4StageName | "unknown"; readonly cause: DiagnosticRetryV4Cause }
const causes = new Set<DiagnosticRetryV4Cause>([...Object.values(SAFE_CAUSES), "unknown_internal"])
export const createDiagnosticRetryV4Terminal = (start: DiagnosticRetryV4Start, fields: Omit<DiagnosticRetryV4Terminal, "schemaVersion" | "root" | "startRoot">): Readonly<DiagnosticRetryV4Terminal> => {
  if (!root(start.root) || !["success", "system_failure", "player_violation", "timeout", "uncertain"].includes(fields.disposition) || !["completed", "system_failure", "player_violation", "cell_deadline", "overall_deadline", "cleanup_incomplete", "publication_uncertain"].includes(fields.code) || !integer(fields.elapsedMilliseconds, 240_000) || !integer(fields.artifactBytes, DIAGNOSTIC_RETRY_V4_CAPACITY.maxBytes) || !integer(fields.artifactRecords, DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) || fields.evidenceRoot !== null && !root(fields.evidenceRoot) || typeof fields.cleanupComplete !== "boolean" || fields.lastEnteredStage !== "unknown" && !DIAGNOSTIC_RETRY_V4_STAGES.includes(fields.lastEnteredStage) || fields.failureStage !== "unknown" && !DIAGNOSTIC_RETRY_V4_STAGES.includes(fields.failureStage) || !causes.has(fields.cause)) return fail("TERMINAL_FIELDS")
  if (fields.disposition === "success" ? fields.processValidity !== "process_valid" || !fields.cleanupComplete || fields.evidenceRoot === null || fields.code !== "completed" || fields.lastEnteredStage !== "terminal_publication" || fields.failureStage !== "unknown" || fields.cause !== "unknown_internal" : fields.processValidity !== "process_invalid") return fail("TERMINAL_CLASSIFICATION")
  const base = { schemaVersion: "diagnostic-retry-terminal-v4" as const, startRoot: start.root, ...fields }
  return freezeLabValue({ ...base, root: labRoot("diagnostic-retry-terminal-v4", base) })
}
export const admitDiagnosticRetryV4Terminal = (start: DiagnosticRetryV4Start, value: unknown): Readonly<DiagnosticRetryV4Terminal> => {
  if (!exact(value, ["schemaVersion", "root", "startRoot", "disposition", "processValidity", "evidenceRoot", "cleanupComplete", "elapsedMilliseconds", "artifactBytes", "artifactRecords", "code", "lastEnteredStage", "failureStage", "cause"])) return fail("TERMINAL_KEYS")
  const candidate = value as unknown as DiagnosticRetryV4Terminal
  if (candidate.schemaVersion !== "diagnostic-retry-terminal-v4" || candidate.startRoot !== start.root) return fail("TERMINAL_START")
  const { root: _identity, startRoot: _start, schemaVersion: _version, ...fields } = candidate
  const expected = createDiagnosticRetryV4Terminal(start, fields)
  if (!same(value, expected)) return fail("TERMINAL_MISMATCH")
  return expected
}

/** Include atomic temp+link peaks and one terminal/diagnosis reserve; no refund. */
export const admitDiagnosticRetryV4ProspectiveCapacity = (input: { readonly retainedBytes: number; readonly retainedRecords: number; readonly retainedInodes: number; readonly incomingBytes: number; readonly completedStages: number }): true => {
  if (!integer(input.retainedBytes, DIAGNOSTIC_RETRY_V4_CAPACITY.maxBytes) || !integer(input.retainedRecords, DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) || !integer(input.retainedInodes, DIAGNOSTIC_RETRY_V4_CAPACITY.maxInodes) || !integer(input.incomingBytes, 131_072) || input.incomingBytes === 0 || !integer(input.completedStages, 6)) return fail("CAPACITY_INPUT")
  const remaining = 6 - input.completedStages
  const peakBytes = input.retainedBytes + 2 * input.incomingBytes + remaining * 512 + DIAGNOSTIC_RETRY_V4_CAPACITY.terminalReserveBytes + 65_536
  const peakInodes = input.retainedInodes + 2 + remaining * 2 + DIAGNOSTIC_RETRY_V4_CAPACITY.terminalReserveInodes + 2
  const peakRecords = input.retainedRecords + 1 + remaining + 2
  if (peakBytes > DIAGNOSTIC_RETRY_V4_CAPACITY.maxBytes || peakInodes > DIAGNOSTIC_RETRY_V4_CAPACITY.maxInodes || peakRecords > DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) return fail("CAPACITY_PEAK")
  return true
}

export interface DiagnosticRetryV4Ledger {
  readonly directory: string
  readonly hasUncertainPublication: () => boolean
  readonly writeStart: (start: DiagnosticRetryV4Start) => void
  readonly readStart: (root: LabRoot) => unknown | null
  readonly writeRunAttempt: (start: DiagnosticRetryV4Start) => DiagnosticRetryV4RunPermit
  readonly readRunAttempt: (root: LabRoot) => unknown | null
  readonly writeStage: (stage: DiagnosticRetryV4Stage) => void
  readonly readStage: (root: LabRoot, ordinal: number) => unknown | null
  readonly writeTerminal: (terminal: DiagnosticRetryV4Terminal) => void
  readonly readTerminal: (root: LabRoot) => unknown | null
  readonly writeEvidence: (root: LabRoot, bytes: Uint8Array) => LabRoot
  readonly readEvidence: (root: LabRoot, evidenceRoot: LabRoot) => Uint8Array
  readonly listNames: () => readonly string[]
}
const opened = new WeakSet<object>()
const runPermits = new WeakMap<object, { readonly startRoot: LabRoot; readonly ledger: DiagnosticRetryV4Ledger; consumed: boolean }>()
export interface DiagnosticRetryV4RunPermit { readonly schemaVersion: "diagnostic-retry-run-permit-v4"; readonly startRoot: LabRoot; toJSON(): never }
const FILE = /^diagnostic-retry-([a-f0-9]{64})\.(started|run-attempt|terminal|stage-[0-5])\.json$/u
const EVIDENCE = /^diagnostic-retry-([a-f0-9]{64})\.evidence-([a-f0-9]{64})\.bin$/u
const TEMP = /^diagnostic-retry-[a-f0-9]{64}\.(?:(?:started|run-attempt|terminal|stage-[0-5])\.json|evidence-[a-f0-9]{64}\.bin)\.tmp-[0-9a-f-]{36}$/u
export const openDiagnosticRetryV4Ledger = (directory: string, fault?: { readonly beforeDirectorySync: (kind: "record" | "evidence") => void }): DiagnosticRetryV4Ledger => {
  const path = resolve(directory), stat = lstatSync(path)
  if (!path.startsWith(`${resolve(".strategy-lab")}/`) || !/^league-265-retry-v4-[1-5]-[a-f0-9]{64}$/u.test(basename(path)) || realpathSync(path) !== path || !stat.isDirectory() || (stat.mode & 0o777) !== 0o700) return fail("LEDGER_DIRECTORY")
  let uncertain = false, bytes = 0, records = 0
  const names = readdirSync(path)
  for (const name of names) {
    if (name === "control") {
      const control = lstatSync(join(path, name))
      if (!control.isDirectory() || realpathSync(join(path, name)) !== join(path, name) || (control.mode & 0o777) !== 0o700) return fail("LEDGER_CONTROL")
      continue
    }
    if (!FILE.test(name) && !EVIDENCE.test(name) && !TEMP.test(name)) return fail("LEDGER_FOREIGN_FILE")
    const entry = lstatSync(join(path, name))
    if (!entry.isFile() || entry.nlink !== 1 || entry.size > 262_144 || (entry.mode & 0o777) !== 0o600) return fail("LEDGER_FILE")
    if (TEMP.test(name)) uncertain = true
    bytes += entry.size; records++
  }
  if (bytes > DIAGNOSTIC_RETRY_V4_CAPACITY.maxBytes || records > DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) return fail("LEDGER_CAP")
  const file = (kind: string, id: LabRoot) => join(path, `diagnostic-retry-${id.slice(7)}.${kind}.json`)
  const readFile = (target: string): Uint8Array | null => {
    let entry
    try { entry = lstatSync(target) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error }
    if (!entry.isFile() || entry.nlink !== 1 || entry.size < 1 || entry.size > 262_144 || (entry.mode & 0o777) !== 0o600) return fail("LEDGER_FILE")
    const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
    try { const observed = readFileSync(fd); if (observed.length !== entry.size) return fail("LEDGER_RACE"); return observed } finally { closeSync(fd) }
  }
  const read = (kind: string, id: LabRoot): unknown | null => { if (!root(id)) return fail("LEDGER_ROOT"); const value = readFile(file(kind, id)); return value === null ? null : parse(value) }
  const atomic = (target: string, data: Uint8Array, kind: "record" | "evidence"): void => {
    if (uncertain) return fail("LEDGER_UNCERTAIN")
    if (data.length < 1 || data.length > 131_072) return fail("LEDGER_BYTES")
    admitDiagnosticRetryV4ProspectiveCapacity({ retainedBytes: bytes, retainedRecords: records, retainedInodes: records, incomingBytes: data.length, completedStages: readdirSync(path).filter((name) => name.includes(".stage-") && !name.includes(".tmp-")).length })
    const temporary = `${target}.tmp-${randomUUID()}`
    let linked = false, synced = false, tmpExists = false
    try {
      const fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
      tmpExists = true
      try { let offset = 0; while (offset < data.length) offset += writeSync(fd, data, offset, data.length - offset); fsyncSync(fd) } finally { closeSync(fd) }
      linkSync(temporary, target); linked = true; bytes += data.length; records++
      unlinkSync(temporary); tmpExists = false
      fault?.beforeDirectorySync(kind)
      const parent = openSync(path, constants.O_RDONLY)
      try { fsyncSync(parent); synced = true } finally { closeSync(parent) }
    } catch (error) {
      if (linked && !synced) uncertain = true
      if (tmpExists) { try { unlinkSync(temporary) } catch { uncertain = true } }
      throw error
    }
  }
  const write = (kind: string, id: LabRoot, value: unknown): void => { if (read(kind, id) !== null) return fail("LEDGER_OVERWRITE"); atomic(file(kind, id), encode(value), "record") }
  const ledger: DiagnosticRetryV4Ledger = Object.freeze({
    directory: path,
    hasUncertainPublication: () => uncertain,
    writeStart(start: DiagnosticRetryV4Start) { if (start.schemaVersion !== "diagnostic-retry-start-v4" || start.ordinal !== 0) return fail("LEDGER_START"); write("started", start.root, start) },
    readStart(id: LabRoot) { return read("started", id) },
    writeRunAttempt(start: DiagnosticRetryV4Start) {
      if (!same(read("started", start.root), start) || read("terminal", start.root) !== null || read("run-attempt", start.root) !== null || read("stage-2", start.root) === null) return fail("LEDGER_RUN_ATTEMPT_PRECONDITION")
      const fields = { schemaVersion: "diagnostic-retry-run-attempt-v4" as const, startRoot: start.root, cellRoot: start.cellRoot, allocationRoot: start.allocationRoot, ordinal: 0 as const, consumed: true as const }
      write("run-attempt", start.root, { ...fields, root: labRoot("diagnostic-retry-run-attempt-v4", fields) })
      const permit = Object.freeze({ schemaVersion: "diagnostic-retry-run-permit-v4" as const, startRoot: start.root, toJSON(): never { return fail("RUN_PERMIT_NON_SERIALIZABLE") } })
      runPermits.set(permit, { startRoot: start.root, ledger, consumed: false })
      return permit
    },
    readRunAttempt(id: LabRoot) { return read("run-attempt", id) },
    writeStage(stage: DiagnosticRetryV4Stage) {
      if (!root(stage.startRoot) || !read("started", stage.startRoot) || read("terminal", stage.startRoot)) return fail("LEDGER_STAGE_PRECONDITION")
      const entered = DIAGNOSTIC_RETRY_V4_STAGES.flatMap((_, index) => read(`stage-${index}`, stage.startRoot) === null ? [] : [index])
      if (entered.some((index) => index >= stage.ordinal) || !same(stage, createDiagnosticRetryV4Stage({ root: stage.startRoot } as DiagnosticRetryV4Start, stage.ordinal, stage.stage))) return fail("LEDGER_STAGE_ORDER")
      write(`stage-${stage.ordinal}`, stage.startRoot, stage)
    },
    readStage(id: LabRoot, ordinal: number) { if (!integer(ordinal, 5)) return fail("LEDGER_STAGE_ORDINAL"); return read(`stage-${ordinal}`, id) },
    writeTerminal(terminal: DiagnosticRetryV4Terminal) { if (!read("started", terminal.startRoot) || read("stage-5", terminal.startRoot) === null) return fail("LEDGER_TERMINAL_PRECONDITION"); write("terminal", terminal.startRoot, terminal) },
    readTerminal(id: LabRoot) { return read("terminal", id) },
    writeEvidence(id: LabRoot, data: Uint8Array) { if (!root(id) || !read("started", id) || read("terminal", id) || !(data instanceof Uint8Array)) return fail("LEDGER_EVIDENCE_PRECONDITION"); const identity = byteRoot(data), target = join(path, `diagnostic-retry-${id.slice(7)}.evidence-${identity.slice(7)}.bin`); const prior = readFile(target); if (prior) { if (byteRoot(prior) !== identity) return fail("LEDGER_EVIDENCE_COLLISION"); return identity } atomic(target, data, "evidence"); return identity },
    readEvidence(id: LabRoot, identity: LabRoot) { if (!root(id) || !root(identity) || !read("started", id)) return fail("LEDGER_EVIDENCE_ROOT"); const value = readFile(join(path, `diagnostic-retry-${id.slice(7)}.evidence-${identity.slice(7)}.bin`)); if (value === null || byteRoot(value) !== identity) return fail("LEDGER_EVIDENCE_HASH"); return value },
    listNames() { return readdirSync(path).filter((name) => name !== "control").sort() },
  })
  opened.add(ledger)
  return ledger
}
export const verifyDiagnosticRetryV4Ledger = (ledger: Pick<DiagnosticRetryV4Ledger, "readStart" | "readTerminal">, allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, start: DiagnosticRetryV4Start): Readonly<DiagnosticRetryV4Start> => {
  if (!opened.has(ledger) || (ledger as DiagnosticRetryV4Ledger).directory !== resolve(allocation.store)) return fail("UNTRUSTED_LEDGER")
  const expected = admitDiagnosticRetryV4Start(allocation, cell, start)
  const names = (ledger as DiagnosticRetryV4Ledger).listNames()
  if (names.some((name) => { const match = FILE.exec(name) ?? EVIDENCE.exec(name); return match ? `sha256:${match[1]}` !== expected.root : true })) return fail("LEDGER_FOREIGN_INVENTORY")
  if (!same(ledger.readStart(expected.root), expected) || ledger.readTerminal(expected.root) !== null || (ledger as DiagnosticRetryV4Ledger).readRunAttempt(expected.root) === null || (ledger as DiagnosticRetryV4Ledger).hasUncertainPublication()) return fail("PRECHARGE_ABSENT_OR_TERMINAL")
  const fields = { schemaVersion: "diagnostic-retry-run-attempt-v4" as const, startRoot: expected.root, cellRoot: expected.cellRoot, allocationRoot: expected.allocationRoot, ordinal: 0 as const, consumed: true as const }
  if (!same((ledger as DiagnosticRetryV4Ledger).readRunAttempt(expected.root), { ...fields, root: labRoot("diagnostic-retry-run-attempt-v4", fields) })) return fail("LEDGER_RUN_ATTEMPT_MISMATCH")
  return expected
}
const lifetimeGrants = new WeakMap<object, { ledger: DiagnosticRetryV4Ledger; allocation: DiagnosticRetryV4Allocation; cell: DiagnosticRetryV4Cell; start: DiagnosticRetryV4Start }>()
export interface DiagnosticRetryV4LifetimeGrant {
  readonly schemaVersion: "diagnostic-retry-lifetime-grant-v4"
  readonly allocationRoot: LabRoot
  readonly cellRoot: LabRoot
  readonly startRoot: LabRoot
  readonly seat: "bottom" | "top"
  readonly containerName: string
  readonly ownershipLabel: string
  readonly ceilingMilliseconds: 240000
  toJSON(): never
}
export const diagnosticRetryV4ContainerIdentity = (allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, seat: "bottom" | "top") => {
  const admitted = admitDiagnosticRetryV4Cell(allocation, cell)
  if (seat !== "bottom" && seat !== "top") return fail("CONTAINER_SEAT")
  return freezeLabValue({ containerName: `cg-v138-retryv4-${admitted.root.slice(7, 27)}-${seat}`, ownershipLabel: `diagnostic-retry-${admitted.root.slice(7)}` })
}
export const issueDiagnosticRetryV4LifetimeGrant = (ledger: DiagnosticRetryV4Ledger, allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, start: DiagnosticRetryV4Start, seat: "bottom" | "top"): DiagnosticRetryV4LifetimeGrant => {
  const admitted = verifyDiagnosticRetryV4Ledger(ledger, allocation, cell, start), container = diagnosticRetryV4ContainerIdentity(allocation, cell, seat)
  const grant = Object.freeze({ schemaVersion: "diagnostic-retry-lifetime-grant-v4" as const, allocationRoot: allocation.root, cellRoot: cell.root, startRoot: admitted.root, seat, containerName: container.containerName, ownershipLabel: container.ownershipLabel, ceilingMilliseconds: 240_000 as const, toJSON(): never { return fail("GRANT_NON_SERIALIZABLE") } })
  lifetimeGrants.set(grant, { ledger, allocation, cell, start })
  return grant
}
export const requireDiagnosticRetryV4LifetimeGrant = (value: unknown, binding: { readonly allocationRoot: LabRoot; readonly cellRoot: LabRoot; readonly startRoot: LabRoot; readonly seat: "bottom" | "top"; readonly containerName: string; readonly ownershipLabel: string; readonly lifetimeMilliseconds: number }): DiagnosticRetryV4LifetimeGrant => {
  if (!value || typeof value !== "object" || !lifetimeGrants.has(value)) return fail("GRANT_UNISSUED")
  const retained = lifetimeGrants.get(value)!
  verifyDiagnosticRetryV4Ledger(retained.ledger, retained.allocation, retained.cell, retained.start)
  const grant = value as DiagnosticRetryV4LifetimeGrant
  if (grant.schemaVersion !== "diagnostic-retry-lifetime-grant-v4" || grant.allocationRoot !== binding.allocationRoot || grant.cellRoot !== binding.cellRoot || grant.startRoot !== binding.startRoot || grant.seat !== binding.seat || grant.containerName !== binding.containerName || grant.ownershipLabel !== binding.ownershipLabel || grant.ceilingMilliseconds !== 240_000 || !integer(binding.lifetimeMilliseconds, grant.ceilingMilliseconds) || binding.lifetimeMilliseconds === 0) return fail("GRANT_BINDING")
  return grant
}
export const reopenDiagnosticRetryV4Ledger = (ledger: DiagnosticRetryV4Ledger, allocation: DiagnosticRetryV4Allocation) => {
  if (!opened.has(ledger) || ledger.directory !== resolve(allocation.store)) return fail("UNTRUSTED_LEDGER")
  const admitted = admitDiagnosticRetryV4Allocation(allocation), cell = createDiagnosticRetryV4Cell(admitted, 0), start = createDiagnosticRetryV4Start(admitted, cell)
  const names = ledger.listNames()
  let uncertain = ledger.hasUncertainPublication()
  for (const name of names) {
    const match = FILE.exec(name) ?? EVIDENCE.exec(name)
    if (!match) { if (!TEMP.test(name)) return fail("LEDGER_FOREIGN_INVENTORY"); uncertain = true; continue }
    if (`sha256:${match[1]}` !== start.root) return fail("LEDGER_FOREIGN_INVENTORY")
  }
  const raw = ledger.readStart(start.root)
  if (raw === null) { if (names.length) return fail("LEDGER_ORPHAN"); return freezeLabValue({ retentionUncertain: uncertain, records: [] as readonly { start: DiagnosticRetryV4Start; terminal: DiagnosticRetryV4Terminal | null; processValidity: "process_valid" | "process_invalid" }[] }) }
  admitDiagnosticRetryV4Start(admitted, cell, raw)
  const attempt = ledger.readRunAttempt(start.root)
  if (attempt !== null) {
    const fields = { schemaVersion: "diagnostic-retry-run-attempt-v4" as const, startRoot: start.root, cellRoot: start.cellRoot, allocationRoot: start.allocationRoot, ordinal: 0 as const, consumed: true as const }
    if (!exact(attempt, ["schemaVersion", "startRoot", "cellRoot", "allocationRoot", "ordinal", "consumed", "root"]) || !same(attempt, { ...fields, root: labRoot("diagnostic-retry-run-attempt-v4", fields) })) return fail("LEDGER_RUN_ATTEMPT_MISMATCH")
  }
  const enteredStages: number[] = []
  for (let ordinal = 0; ordinal < 6; ordinal++) {
    const checkpoint = ledger.readStage(start.root, ordinal)
    if (checkpoint !== null) { admitDiagnosticRetryV4Stage(start, checkpoint, ordinal); enteredStages.push(ordinal) }
  }
  const terminalRaw = ledger.readTerminal(start.root)
  const terminal = terminalRaw === null ? null : admitDiagnosticRetryV4Terminal(start, terminalRaw)
  if (terminal) {
    if (enteredStages.at(-1) !== 5 || terminal.lastEnteredStage !== "unknown" && terminal.lastEnteredStage !== DIAGNOSTIC_RETRY_V4_STAGES[enteredStages.at(-1)!] || terminal.failureStage !== "unknown" && !enteredStages.some((ordinal) => DIAGNOSTIC_RETRY_V4_STAGES[ordinal] === terminal.failureStage) || terminal.disposition === "success" && enteredStages.length !== 6) return fail("LEDGER_TERMINAL_STAGE")
  }
  return freezeLabValue({ retentionUncertain: uncertain, records: [{ start, terminal, processValidity: uncertain || !terminal ? "process_invalid" as const : terminal.processValidity }] })
}

const CHUNK_BYTES = 131_072
const INDEX_PAGE = 1_000
const manifestKeys = ["schemaVersion", "allocationRoot", "cellRoot", "startRoot", "requestRoot", "tupleRoot", "runtimeRoot", "semanticGeometryHash", "executionKind", "transitionIndexRoots", "accountingIndexRoots", "transitionChunkCount", "accountingChunkCount", "outcomeRoots", "outcomeByteLength", "transitionCount", "accountingCount"] as const
/** Retains every canonical runner row; the manifest is published last. */
export const retainDiagnosticRetryV4Execution = (ledger: DiagnosticRetryV4Ledger, allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, start: DiagnosticRetryV4Start, execution: LabMatchExecution) => {
  admitDiagnosticRetryV4Start(allocation, cell, start)
  const reopened = reopenDiagnosticRetryV4Ledger(ledger, allocation)
  if (reopened.retentionUncertain || reopened.records.length !== 1 || reopened.records[0]!.start.root !== start.root || ledger.readRunAttempt(start.root) === null || ledger.readStage(start.root, 3) === null || ledger.readTerminal(start.root) !== null) return fail("EVIDENCE_PRECONDITION")
  if (execution.privacy !== "private_offline" || execution.transitions.length > 1_010_000 || execution.accounting.length > 49_600) return fail("EVIDENCE_EXECUTION")
  if (execution.kind === "completed") {
    const last = execution.transitions.at(-1)
    if (!last || execution.accounting.length < 1 || !last.terminalStatus || !execution.result.state.outcome || JSON.stringify(last.terminalStatus) !== JSON.stringify(execution.result.state.outcome) || JSON.stringify(execution.result.events) !== JSON.stringify(execution.transitions.flatMap((record) => record.events))) return fail("EVIDENCE_INCOMPLETE_MATCH")
    for (let index = 1; index < execution.transitions.length; index++) if (execution.transitions[index - 1]!.afterStateHash !== execution.transitions[index]!.beforeStateHash) return fail("EVIDENCE_TRANSITION_CHAIN")
  }
  let artifactBytes = 0, artifactRecords = 0
  const seen = new Set<LabRoot>()
  const write = (data: Uint8Array) => { const identity = ledger.writeEvidence(start.root, data); if (!seen.has(identity)) { seen.add(identity); artifactBytes += data.length; artifactRecords++ } return identity }
  const rows = (values: readonly unknown[], rowLimit: number): LabRoot[] => {
    const roots: LabRoot[] = []; let parts: Buffer[] = [], size = 0
    const flush = () => { if (size) { roots.push(write(Buffer.concat(parts, size))); parts = []; size = 0 } }
    const append = (data: Uint8Array) => { for (let offset = 0; offset < data.length;) { const length = Math.min(CHUNK_BYTES - size, data.length - offset); parts.push(Buffer.from(data.subarray(offset, offset + length))); size += length; offset += length; if (size === CHUNK_BYTES) flush() } }
    for (const value of values) { const line = Buffer.from(JSON.stringify(value), "utf8"); if (line.length < 1 || line.length > rowLimit) return fail("EVIDENCE_ROW_CAP"); append(line); append(Buffer.from("\n")) }
    flush(); return roots
  }
  // Lossless storage representation, not a larger physical-row allowance:
  // canonical state projections are separately rooted/deduplicated under the
  // unchanged 131072-byte blob and total byte/record/inode caps. Reopening
  // rehydrates the original transition before schema/event/state-chain checks.
  const stateReference = (state: unknown) => {
    const data = Buffer.from(JSON.stringify(state), "utf8")
    if (data.length < 1 || data.length > CHUNK_BYTES) return fail("EVIDENCE_ROW_CAP")
    return { schemaVersion: "diagnostic-retry-state-reference-v4", root: write(data) }
  }
  const storageTransitions = execution.transitions.map((transition) => ({
    ...transition, beforeState: stateReference(transition.beforeState), afterState: stateReference(transition.afterState),
  }))
  const transitions = rows(storageTransitions, 8_192), accounting = rows(execution.accounting, 270_336)
  const index = (roots: readonly LabRoot[]) => { const pages: LabRoot[] = []; for (let offset = 0; offset < roots.length; offset += INDEX_PAGE) pages.push(write(Buffer.from(JSON.stringify({ schemaVersion: "diagnostic-retry-evidence-index-v4", roots: roots.slice(offset, offset + INDEX_PAGE) }), "utf8"))); return pages }
  const transitionIndexRoots = index(transitions), accountingIndexRoots = index(accounting)
  const outcome = execution.kind === "completed" ? { kind: "completed", privacy: execution.privacy, state: execution.result.state, eventsRoot: labRoot("diagnostic-retry-result-events-v4", execution.result.events) } : { kind: "failure", privacy: execution.privacy, failure: execution.failure, unchangedState: execution.unchangedState }
  const outcomeBytes = Buffer.from(JSON.stringify(outcome), "utf8")
  if (outcomeBytes.length < 1 || outcomeBytes.length > (execution.kind === "failure" ? DIAGNOSTIC_RETRY_V4_CAPACITY.maxFailureBytes : 1_048_576)) return fail("EVIDENCE_OUTCOME_CAP")
  const outcomeRoots: LabRoot[] = []
  for (let offset = 0; offset < outcomeBytes.length; offset += CHUNK_BYTES) outcomeRoots.push(write(outcomeBytes.subarray(offset, offset + CHUNK_BYTES)))
  const manifest = { schemaVersion: "diagnostic-retry-execution-manifest-v4" as const, allocationRoot: allocation.root, cellRoot: cell.root, startRoot: start.root, requestRoot: cell.requestRoot, tupleRoot: cell.tupleRoot, runtimeRoot: cell.runtimeRoot, semanticGeometryHash: cell.semanticGeometryHash, executionKind: execution.kind, transitionIndexRoots, accountingIndexRoots, transitionChunkCount: transitions.length, accountingChunkCount: accounting.length, outcomeRoots, outcomeByteLength: outcomeBytes.length, transitionCount: execution.transitions.length, accountingCount: execution.accounting.length }
  const manifestBytes = Buffer.from(JSON.stringify(manifest), "utf8")
  if (manifestBytes.length > CHUNK_BYTES) return fail("EVIDENCE_MANIFEST_CAP")
  const evidenceRoot = write(manifestBytes)
  const retained = freezeLabValue({ evidenceRoot, artifactBytes, artifactRecords })
  verifyRetainedDiagnosticRetryV4Execution(ledger, allocation, cell, start, evidenceRoot)
  return retained
}
/** The only complete-manifest producer invokes the unchanged canonical Match
 * bridge in this function. A caller cannot retain an invented success object. */
export const runAndRetainCanonicalDiagnosticRetryV4 = async (input: {
  readonly ledger: DiagnosticRetryV4Ledger
  readonly allocation: DiagnosticRetryV4Allocation
  readonly cell: DiagnosticRetryV4Cell
  readonly start: DiagnosticRetryV4Start
  readonly runPermit: DiagnosticRetryV4RunPermit
  readonly bridgePermit: DiagnosticRetryV4BridgePermit
  readonly onKernelEntry: () => void
  readonly onEvidenceStart: () => void
}) => {
  const permit = runPermits.get(input.runPermit)
  if (!permit || permit.ledger !== input.ledger || permit.startRoot !== input.start.root || permit.consumed || input.ledger.readRunAttempt(input.start.root) === null) return fail("CANONICAL_RUN_PERMIT")
  permit.consumed = true
  input.onKernelEntry()
  const execution = await runDiagnosticRetryV4CanonicalFromBridge(input.bridgePermit)
  input.onEvidenceStart()
  const retained = retainDiagnosticRetryV4Execution(input.ledger, input.allocation, input.cell, input.start, execution)
  const disposition = execution.kind === "failure" || execution.accounting.some((entry) => !entry.result.ok && "systemFailure" in entry.result) ? "system_failure" as const : execution.accounting.some((entry) => !entry.result.ok) ? "player_violation" as const : "success" as const
  return Object.freeze({ executionKind: execution.kind, disposition, processValidity: disposition === "success" ? "process_valid" as const : "process_invalid" as const, cleanupComplete: execution.kind !== "failure" || execution.failure.code !== "LAB_CLEANUP_INCOMPLETE", transitionCount: execution.transitions.length, accountingCount: execution.accounting.length, ...retained })
}
/** Reopens all referenced bytes and requires an exact no-orphan execution graph. */
export const verifyRetainedDiagnosticRetryV4Execution = (ledger: DiagnosticRetryV4Ledger, allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, start: DiagnosticRetryV4Start, evidenceRoot: LabRoot) => {
  admitDiagnosticRetryV4Allocation(allocation); admitDiagnosticRetryV4Cell(allocation, cell); admitDiagnosticRetryV4Start(allocation, cell, start)
  if (!root(evidenceRoot)) return fail("EVIDENCE_ROOT")
  const seen = new Set<LabRoot>(); let artifactBytes = 0, artifactRecords = 0
  const read = (identity: LabRoot) => { if (!root(identity)) return fail("EVIDENCE_IDENTITY"); const bytes = ledger.readEvidence(start.root, identity); if (!seen.has(identity)) { seen.add(identity); artifactBytes += bytes.length; artifactRecords++ } if (artifactBytes > DIAGNOSTIC_RETRY_V4_CAPACITY.maxBytes || artifactRecords > DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) return fail("EVIDENCE_CAP"); return bytes }
  const decoded = (identity: LabRoot): unknown => JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(read(identity)))
  const manifest = decoded(evidenceRoot)
  if (!exact(manifest, manifestKeys) || manifest.schemaVersion !== "diagnostic-retry-execution-manifest-v4" || manifest.allocationRoot !== allocation.root || manifest.cellRoot !== cell.root || manifest.startRoot !== start.root || manifest.requestRoot !== cell.requestRoot || manifest.tupleRoot !== cell.tupleRoot || manifest.runtimeRoot !== cell.runtimeRoot || manifest.semanticGeometryHash !== cell.semanticGeometryHash || !["completed", "failure"].includes(manifest.executionKind as string) || !Array.isArray(manifest.transitionIndexRoots) || !Array.isArray(manifest.accountingIndexRoots) || !Array.isArray(manifest.outcomeRoots) || !integer(manifest.transitionChunkCount, DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) || !integer(manifest.accountingChunkCount, DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords) || !integer(manifest.transitionCount, 1_010_000) || !integer(manifest.accountingCount, 49_600) || !integer(manifest.outcomeByteLength, 1_048_576) || manifest.outcomeByteLength === 0 || manifest.outcomeRoots.length < 1 || manifest.outcomeRoots.length > 8) return fail("EVIDENCE_MANIFEST")
  const index = (pages: unknown, expected: number): LabRoot[] => {
    if (!Array.isArray(pages) || pages.length !== Math.ceil(expected / INDEX_PAGE) || !pages.every(root)) return fail("EVIDENCE_INDEX_COUNT")
    const roots: LabRoot[] = []
    for (const pageRoot of pages as LabRoot[]) { const page = decoded(pageRoot); if (!exact(page, ["schemaVersion", "roots"]) || page.schemaVersion !== "diagnostic-retry-evidence-index-v4" || !Array.isArray(page.roots) || page.roots.length < 1 || page.roots.length > INDEX_PAGE || !page.roots.every(root)) return fail("EVIDENCE_INDEX"); roots.push(...page.roots as LabRoot[]) }
    if (roots.length !== expected) return fail("EVIDENCE_INDEX_COUNT")
    return roots
  }
  let systemFailure = false, playerViolation = false, outputBytes = 0, previousStateHash: string | null = null, finalTerminalStatus: unknown = null
  const replayEvents: unknown[] = []
  const countRows = (roots: LabRoot[], accounting: boolean): number => {
    let count = 0, carry = Buffer.alloc(0)
    for (const identity of roots) {
      const bytes = Buffer.concat([carry, Buffer.from(read(identity))]); let offset = 0
      for (let at = bytes.indexOf(10); at >= 0; at = bytes.indexOf(10, offset)) {
        const line = bytes.subarray(offset, at)
        if (!line.length) return fail("EVIDENCE_ROW")
        const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(line)) as unknown
        if (!value || typeof value !== "object" || Array.isArray(value)) return fail("EVIDENCE_ROW")
        if (!accounting) {
          if (line.length > 8_192) return fail("EVIDENCE_ROW_CAP")
          const transition = value as Record<string, unknown>
          if (!exact(transition, ["transitionKind", "semanticTupleId", "semanticTuple", "coordinates", "classification", "events", "beforeState", "afterState", "beforeStateHash", "afterStateHash", "beforeMachineHash", "afterMachineHash", "terminalStatus", "failureStatus"]) || typeof transition.semanticTupleId !== "string" || !root(transition.beforeStateHash) || !root(transition.afterStateHash) || !root(transition.beforeMachineHash) || !root(transition.afterMachineHash) || !Array.isArray(transition.events) || transition.failureStatus !== null || previousStateHash !== null && transition.beforeStateHash !== previousStateHash || finalTerminalStatus !== null) return fail("EVIDENCE_TRANSITION")
          previousStateHash = transition.afterStateHash
          finalTerminalStatus = transition.terminalStatus
          for (const field of ["beforeState", "afterState"] as const) {
            const reference = transition[field]
            if (!exact(reference, ["schemaVersion", "root"]) || reference.schemaVersion !== "diagnostic-retry-state-reference-v4" || !root(reference.root)) return fail("EVIDENCE_STATE_REFERENCE")
            const stateBytes = read(reference.root)
            if (stateBytes.length < 1 || stateBytes.length > CHUNK_BYTES) return fail("EVIDENCE_ROW_CAP")
            const state = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(stateBytes)) as unknown
            if (!state || typeof state !== "object" || Array.isArray(state)) return fail("EVIDENCE_STATE_REFERENCE")
            transition[field] = state
          }
          if (!validateCanonicalTransition(transition as unknown as CanonicalKernelSemanticTransition).ok) return fail("EVIDENCE_TRANSITION")
          replayEvents.push(...transition.events)
        } else {
          const row = value as Record<string, unknown>
          if (row.charged !== true || row.completed !== true || !integer(row.outputBytes, 262_144) || !row.identity || typeof row.identity !== "object" || (row.identity as Record<string, unknown>).attemptRoot !== start.root || (row.identity as Record<string, unknown>).budgetRoot !== allocation.root || (row.identity as Record<string, unknown>).tupleRoot !== allocation.tupleRoot || (row.identity as Record<string, unknown>).runtimeLimitsRoot !== allocation.runtimeRoot || !row.result || typeof row.result !== "object" || typeof (row.result as Record<string, unknown>).ok !== "boolean") return fail("EVIDENCE_ACCOUNTING")
          outputBytes += row.outputBytes
          if ((row.result as Record<string, unknown>).ok === false) { if ("systemFailure" in (row.result as Record<string, unknown>)) systemFailure = true; else playerViolation = true }
        }
        count++; offset = at + 1
      }
      carry = bytes.subarray(offset)
      if (carry.length > 270_336) return fail("EVIDENCE_ROW_CAP")
    }
    if (carry.length) return fail("EVIDENCE_UNTERMINATED_ROW")
    return count
  }
  const transitionCount = countRows(index(manifest.transitionIndexRoots, manifest.transitionChunkCount as number), false)
  const accountingCount = countRows(index(manifest.accountingIndexRoots, manifest.accountingChunkCount as number), true)
  if (transitionCount !== manifest.transitionCount || accountingCount !== manifest.accountingCount) return fail("EVIDENCE_COUNTS")
  if (manifest.executionKind === "completed" && (transitionCount < 1 || accountingCount < 1 || finalTerminalStatus === null)) return fail("EVIDENCE_INCOMPLETE_MATCH")
  if (!manifest.outcomeRoots.every(root)) return fail("EVIDENCE_OUTCOME_ROOT")
  const outcomeBytes = Buffer.concat((manifest.outcomeRoots as LabRoot[]).map((identity) => Buffer.from(read(identity))))
  if (outcomeBytes.length !== manifest.outcomeByteLength) return fail("EVIDENCE_OUTCOME_BYTES")
  const outcome = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(outcomeBytes)) as unknown
  if (!exact(outcome, manifest.executionKind === "completed" ? ["kind", "privacy", "state", "eventsRoot"] : ["kind", "privacy", "failure", "unchangedState"]) || outcome.kind !== manifest.executionKind || outcome.privacy !== "private_offline" || manifest.executionKind === "completed" && (!root(outcome.eventsRoot) || !outcome.state || typeof outcome.state !== "object" || (outcome.state as Record<string, unknown>).outcome === undefined || JSON.stringify((outcome.state as Record<string, unknown>).outcome) !== JSON.stringify(finalTerminalStatus) || outcome.eventsRoot !== labRoot("diagnostic-retry-result-events-v4", replayEvents))) return fail("EVIDENCE_OUTCOME")
  const prefix = `diagnostic-retry-${start.root.slice(7)}.evidence-`
  const inventory = ledger.listNames().filter((name) => name.startsWith(prefix))
  if (inventory.length !== seen.size || inventory.some((name) => { const match = EVIDENCE.exec(name); return !match || !seen.has(`sha256:${match[2]}` as LabRoot) })) return fail("EVIDENCE_ORPHAN")
  return freezeLabValue({ artifactBytes, artifactRecords, transitionCount, accountingCount, outputBytes, disposition: manifest.executionKind === "failure" || systemFailure ? "system_failure" as const : playerViolation ? "player_violation" as const : "success" as const })
}

/** A failed write may leave already-published chunks. Root the exact surviving
 * inventory, never silently call it a complete Match or refund the charge. */
export const retainDiagnosticRetryV4PartialEvidence = (ledger: DiagnosticRetryV4Ledger, start: DiagnosticRetryV4Start) => {
  const prefix = `diagnostic-retry-${start.root.slice(7)}.evidence-`
  const entries = ledger.listNames().filter((name) => name.startsWith(prefix)).map((name) => {
    const match = EVIDENCE.exec(name)
    if (!match || `sha256:${match[1]}` !== start.root) return fail("PARTIAL_INVENTORY")
    const identity = `sha256:${match[2]}` as LabRoot, bytes = ledger.readEvidence(start.root, identity)
    return { root: identity, byteLength: bytes.length }
  })
  if (entries.length > DIAGNOSTIC_RETRY_V4_CAPACITY.maxRecords - 1) return fail("PARTIAL_CAP")
  const descriptor = { schemaVersion: "diagnostic-retry-partial-evidence-v4" as const, startRoot: start.root, entries }
  const data = encode(descriptor)
  const evidenceRoot = ledger.writeEvidence(start.root, data)
  if (entries.some((entry) => entry.root === evidenceRoot)) return fail("PARTIAL_SELF_REFERENCE")
  return freezeLabValue({ evidenceRoot, artifactBytes: entries.reduce((sum, entry) => sum + entry.byteLength, data.length), artifactRecords: entries.length + 1 })
}
export const verifyRetainedDiagnosticRetryV4PartialEvidence = (ledger: DiagnosticRetryV4Ledger, start: DiagnosticRetryV4Start, evidenceRoot: LabRoot) => {
  const data = ledger.readEvidence(start.root, evidenceRoot), descriptor = parse(data)
  if (!exact(descriptor, ["schemaVersion", "startRoot", "entries"]) || descriptor.schemaVersion !== "diagnostic-retry-partial-evidence-v4" || descriptor.startRoot !== start.root || !Array.isArray(descriptor.entries)) return fail("PARTIAL_SCHEMA")
  let artifactBytes = data.length
  const seen = new Set<LabRoot>([evidenceRoot])
  for (const entry of descriptor.entries) {
    if (!exact(entry, ["root", "byteLength"]) || !root(entry.root) || !integer(entry.byteLength, 131_072) || entry.byteLength < 1 || seen.has(entry.root)) return fail("PARTIAL_ENTRY")
    const bytes = ledger.readEvidence(start.root, entry.root)
    if (bytes.length !== entry.byteLength) return fail("PARTIAL_BYTES")
    seen.add(entry.root); artifactBytes += bytes.length
  }
  const prefix = `diagnostic-retry-${start.root.slice(7)}.evidence-`
  const names = ledger.listNames().filter((name) => name.startsWith(prefix))
  if (names.length !== seen.size || names.some((name) => { const match = EVIDENCE.exec(name); return !match || !seen.has(`sha256:${match[2]}` as LabRoot) })) return fail("PARTIAL_ORPHAN")
  return freezeLabValue({ artifactBytes, artifactRecords: seen.size, disposition: "system_failure" as const, complete: false as const })
}

export const createDiagnosticRetryV4Result = (allocation: DiagnosticRetryV4Allocation, ledger: DiagnosticRetryV4Ledger | null, elapsedMilliseconds: number, watchdogStatus: "process_valid" | "process_invalid" | "safe_no_start", containerAbsence: boolean) => {
  const admitted = admitDiagnosticRetryV4Allocation(allocation)
  if (!integer(elapsedMilliseconds, 600_000) || !["process_valid", "process_invalid", "safe_no_start"].includes(watchdogStatus) || typeof containerAbsence !== "boolean") return fail("RESULT_INPUT")
  const state = ledger === null ? null : reopenDiagnosticRetryV4Ledger(ledger, admitted)
  const entry = state?.records[0], terminal = entry?.terminal
  let manifest: ReturnType<typeof verifyRetainedDiagnosticRetryV4Execution> | ReturnType<typeof verifyRetainedDiagnosticRetryV4PartialEvidence> | null = null
  if (terminal?.evidenceRoot && ledger && entry) {
    const cell = createDiagnosticRetryV4Cell(admitted, 0)
    const header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(ledger.readEvidence(entry.start.root, terminal.evidenceRoot))) as Record<string, unknown>
    manifest = header.schemaVersion === "diagnostic-retry-execution-manifest-v4" ? verifyRetainedDiagnosticRetryV4Execution(ledger, admitted, cell, entry.start, terminal.evidenceRoot) : header.schemaVersion === "diagnostic-retry-partial-evidence-v4" ? verifyRetainedDiagnosticRetryV4PartialEvidence(ledger, entry.start, terminal.evidenceRoot) : fail("RESULT_EVIDENCE_SCHEMA")
    if (manifest.disposition !== terminal.disposition || manifest.artifactBytes !== terminal.artifactBytes || manifest.artifactRecords !== terminal.artifactRecords) return fail("RESULT_EVIDENCE_MISMATCH")
  }
  const cell = createDiagnosticRetryV4Cell(admitted, 0), start = createDiagnosticRetryV4Start(admitted, cell)
  const completeStages = !!ledger && DIAGNOSTIC_RETRY_V4_STAGES.every((_, ordinal) => ledger.readStage(start.root, ordinal) !== null)
  const processValid = watchdogStatus === "process_valid" && !!terminal && terminal.processValidity === "process_valid" && terminal.disposition === "success" && !!manifest && !("complete" in manifest) && manifest.disposition === "success" && terminal.cleanupComplete && containerAbsence && completeStages && !state?.retentionUncertain
  if (terminal?.processValidity === "process_valid" && !processValid) return fail("RESULT_FALSE_SUCCESS")
  const fields = { schemaVersion: "diagnostic-retry-result-v4" as const, privacy: "private_offline" as const, evidenceClass: "diagnostic_only" as const, allocationRoot: admitted.root, gateRoot: admitted.gateRoot, oldEvidenceBaseline: admitted.oldEvidenceBaseline, elapsedMilliseconds, watchdogStatus, chargedCount: entry ? 1 as const : 0 as const, startRoot: entry?.start.root ?? null, terminalRoot: terminal?.root ?? null, evidenceRoot: terminal?.evidenceRoot ?? null, containerAbsence, processValidity: processValid ? "process_valid" as const : "process_invalid" as const, leagueRequirementsEvidence: false as const, freezeAuthorized: false as const, formationAuthorized: false as const, holdoutAuthorized: false as const, counted: false as const, public: false as const, productionAuthorized: false as const }
  return freezeLabValue({ ...fields, root: labRoot("diagnostic-retry-result-v4", fields) })
}
