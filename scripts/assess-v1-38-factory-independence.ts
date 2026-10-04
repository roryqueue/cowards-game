import { opendirSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryAttemptStart, readFactoryAttemptTerminal, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { admitFactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
import { FactoryCandidateSchema } from "../packages/strategy-lab/src/factory/contracts.js"
import { readFactorySupervisionArtifactRecords, readFactorySupervisionArtifactRecordsBounded } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { compareNumericEvidence, freezeNumericCalibrationThreshold, classifyNumericComparison, type NumericCalibrationEvidence, type NumericComparison, type NumericControlTable, type NumericControlId } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
import { readFactoryCanonicalRecord, readFreshFactoryCalibration, requireFactoryRecordRoot, remainingFreshWorkloadLifetime } from "./v1-38-factory-fresh-evidence.js"
import { deriveFactorySharedHelperAudit, factoryEvidenceByteRoot, readFactoryExecutionEvidence, readHistoricalFactoryExecutionEvidence } from "./v1-38-factory-execution-evidence.js"
import { createNumericObservationFromVerifiedCell, type VerifiedFactoryCellObservation, type VerifiedFactoryCellObservationInput } from "./v1-38-factory-observations.js"
import { auditFactorySource } from "./v1-38-factory-source-audit.js"
import { FACTORY_CONTROL_BASES, type FactoryControlSlot } from "./v1-38-factory-controls.js"
import type { FactorySourceSlot } from "./v1-38-factory-allocation.js"
import { factoryAssessmentImplementationRoot as implementationRoot } from "./v1-38-factory-implementation.js"
import { equalFactoryObservationMaps } from "./v1-38-factory-observation-equality.js"
import { readFactoryAssessmentCorrection, readFactoryHistoricalImportContext, requireFactoryHistoricalImportContext, type FactoryHistoricalImportContext } from "./v1-38-factory-assessment-correction.js"

const BASE_EDGES = ["S01/S03", "S01/S05", "S03/S05"] as const
const CONTROL_IDS: readonly NumericControlId[] = ["S01/S02", "S03/S04", "S05/S06", "S01/S07", "S01/S08", "S11/S12"]
const fail = (code: string): never => { throw new TypeError(`FACTORY_ASSESSMENT_${code}`) }
const encode = (value: unknown) => { const result = admitCanonicalJsonValue(value, {profile:"canonical-manifest"}); return result.ok ? result.canonicalBytes : fail("CANONICAL") }
const same = (left: unknown, right: unknown) => labRoot("factory-assessment-equality-v1",left) === labRoot("factory-assessment-equality-v1",right)
const record = (value: unknown): Record<string,unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : fail("RECORD")
export const factoryWorkloadResourceViolations = (started:number,completed:number,invocations:number,lifetime:number):readonly string[] => {
  if (![started,completed,invocations,lifetime].every(Number.isSafeInteger) || started<0 || completed<started || invocations<0 || lifetime<1 || lifetime>120000) return ["invalid_resource_measurement"]
  return [...(completed-started>lifetime?["lifetime_exceeded"]:[]),...(invocations>256?["invocations_exceeded"]:[])]
}

/** Pure decision helper; only the retained-evidence entrypoint can publish readiness. */
export const decideFactoryIndependence = (controls: NumericControlTable, baseEdges: Record<string,NumericComparison>, priorReasons: readonly string[], sharing: number): {status:"affirmed"|"unresolved";reasons:readonly string[]} => {
  const reasons = [...priorReasons], fit = freezeNumericCalibrationThreshold(controls)
  if (fit.status !== "frozen") reasons.push(...fit.reasons.map((reason) => `controls:${reason}`))
  if (!Number.isSafeInteger(sharing) || sharing !== 0) reasons.push("strategic_sharing")
  if (!same(Object.keys(baseEdges).sort(), [...BASE_EDGES].sort())) reasons.push("missing_base_edges")
  if (fit.status === "frozen") for (const edge of BASE_EDGES) if (!baseEdges[edge] || classifyNumericComparison(baseEdges[edge],fit.threshold) !== "distinct") reasons.push(`base_not_distinct:${edge}`)
  return {status:reasons.length === 0 ? "affirmed" : "unresolved",reasons:[...new Set(reasons)]}
}

/** No recovery or writes: uncertain starts fail instead of being repaired by verification. */
/** Lean-only filename preflight. The iterator stops before an oversized
 * directory can be sorted or any attempt body can be parsed. Legacy readers
 * retain their original inventory and root semantics. */
export const readLeanFactoryInventoryNames = (repository: FactoryRepository, maxArtifactRecords: number, beforeAllocation?: (reserveBytes: number) => void): readonly string[] => {
  if (!Number.isSafeInteger(maxArtifactRecords) || maxArtifactRecords < 1 || maxArtifactRecords > 200_000) return fail("IMPORT_INVENTORY_LIMIT")
  const maximumNames = maxArtifactRecords + 96
  beforeAllocation?.(maximumNames * 512 + 64 * 1024 * 1024)
  const directory = opendirSync(repository.directory), names: string[] = []
  let starts = 0, terminals = 0, artifacts = 0
  try {
    for (let entry = directory.readSync(); entry !== null; entry = directory.readSync()) {
      const name = entry.name
      if (++artifacts > maximumNames || !entry.isFile()) return fail("IMPORT_INVENTORY_LIMIT")
      if (/^factory-attempt-[a-f0-9]{64}\.started\.json$/u.test(name)) starts++
      else if (/^factory-attempt-[a-f0-9]{64}\.terminal\.json$/u.test(name)) terminals++
      else if (!/^factory-artifact-[a-f0-9]{64}\.bin$/u.test(name)) return fail("LEDGER_INVENTORY")
      if (starts > 48 || terminals > 48) return fail("EXTRA_ATTEMPTS")
      names.push(name)
    }
  } finally { directory.closeSync() }
  if (starts !== 48 || terminals !== 48) return fail("IMPORT_ATTEMPT_COUNT")
  const listed = new Set(names)
  for (const name of names) if (name.endsWith(".started.json") && !listed.has(name.replace(".started.json", ".terminal.json"))) return fail("UNCERTAIN_START")
  return names.sort()
}
export const readRetainedFactoryLedger = (repository: FactoryRepository, leanNames?: readonly string[]) => {
  const names = leanNames ?? readdirSync(repository.directory).sort()
  const entries = names.filter((name) => /^factory-attempt-[a-f0-9]{64}\.started\.json$/u.test(name)).map((name) => {
    const start = readFactoryAttemptStart(repository, `sha256:${name.slice("factory-attempt-".length, -".started.json".length)}` as LabRoot)
    if (name !== `factory-attempt-${start.root.slice(7)}.started.json`) return fail("LEDGER_NAME")
    const terminalName = name.replace(".started.json",".terminal.json")
    if (!names.includes(terminalName)) return fail("UNCERTAIN_START")
    return {start,terminal:readFactoryAttemptTerminal(repository,start)}
  })
  if (names.some((name) => !/^factory-artifact-[a-f0-9]{64}\.bin$/u.test(name) && !/^factory-attempt-[a-f0-9]{64}\.(started|terminal)\.json$/u.test(name)) || names.filter((name) => name.endsWith(".terminal.json")).length !== entries.length) return fail("LEDGER_INVENTORY")
  const roots = entries.map((entry) => entry.start.root)
  return {entries,ledgerRoot:factoryEvidenceByteRoot(encode({started:roots,completed:roots}))}
}
export interface FactoryAssessmentInput {
  readonly manifestArtifactRoot: LabRoot; readonly executionEvidenceArtifactRoot: LabRoot
  readonly ledgerRoot: LabRoot; readonly terminalRoots: readonly LabRoot[]
  readonly supervisionArtifactRoots: readonly LabRoot[]; readonly pairingArtifactRoots: readonly LabRoot[]
  readonly candidateArtifactRoots: readonly LabRoot[]
  readonly windowTerminalArtifactRoot?: LabRoot | null
}
export interface FactoryAssessmentResult {
  readonly status: "affirmed" | "unresolved"; readonly reasons: readonly string[]
  readonly assessmentRoot: LabRoot; readonly assessmentArtifactRoot: LabRoot | null
  readonly thresholdArtifactRoot: LabRoot | null; readonly manifestRoot: LabRoot; readonly allocationRoot: LabRoot
}
const rooted = (schemaVersion:string, value:Record<string,unknown>) => { const body = {schemaVersion,...value}; return {...body,root:labRoot(schemaVersion,body)} }
const artifactIdentity = (value:unknown) => factoryEvidenceByteRoot(encode(value))

/** Conservative in-process ceiling for 48 retained numeric projections. Each
 * primitive character is charged eight bytes plus object/array overhead; raw
 * records and chunks are not retained between cells. This is a fail-closed
 * import limit, not an assertion about historical peak RSS. */
export const LEAN_FACTORY_PROJECTION_CEILING_BYTES = 256 * 1024 * 1024
export const boundedFactoryProjectionCharge = (value: unknown, ceiling = LEAN_FACTORY_PROJECTION_CEILING_BYTES): number => {
  let charged = 0
  const visit = (item: unknown): void => {
    charged += 64
    if (charged > ceiling) return fail("IMPORT_PROJECTION_LIMIT")
    if (typeof item === "string") charged += item.length * 8
    else if (Array.isArray(item)) for (const member of item) visit(member)
    else if (item && typeof item === "object") for (const [key, member] of Object.entries(item)) { charged += key.length * 8; visit(member) }
    if (charged > ceiling) return fail("IMPORT_PROJECTION_LIMIT")
  }
  visit(value)
  return charged
}

/** Lean-only retained representation. Equal strings are returned from one
 * canonical pool; token contents/order and comparison semantics do not change.
 * Conservatively charge every reference, container/property slot and pool
 * entry, plus eight bytes per character of each actual shared payload. The
 * separate per-cell emission limit still charges every generated token. */
export const createBoundedFactoryProjectionPool = (ceiling = LEAN_FACTORY_PROJECTION_CEILING_BYTES) => {
  if (!Number.isSafeInteger(ceiling) || ceiling < 1 || ceiling > LEAN_FACTORY_PROJECTION_CEILING_BYTES) return fail("IMPORT_PROJECTION_LIMIT")
  let charged = 0, failed = false
  const reserve = (bytes: number): void => {
    if (failed || !Number.isSafeInteger(bytes) || bytes < 0 || bytes > ceiling - charged) { failed = true; return fail("IMPORT_PROJECTION_LIMIT") }
    charged += bytes
  }
  reserve(512) // Empty pool, bookkeeping and returned API, before construction.
  const strings = new Map<string, string>()
  const projected = new WeakSet<object>()
  const intern = (text: string): string => {
    const shared = strings.get(text)
    if (shared !== undefined) return shared
    // Includes string/header, map node, key/value references and pool index.
    reserve(256 + text.length * 8)
    strings.set(text, text)
    return text
  }
  const project = <T>(value: T): T => {
    if (failed) return fail("IMPORT_PROJECTION_LIMIT")
    reserve(128) // Per-call active-set/visitor bookkeeping before construction.
    const active = new WeakSet<object>()
    const visit = (item: unknown, depth: number): unknown => {
      if (depth > 128) { failed = true; return fail("IMPORT_PROJECTION_LIMIT") }
      reserve(64) // Every occurrence/reference, including shared strings.
      if (typeof item === "string") return intern(item)
      if (item === null || typeof item !== "object") return item
      // Reuse only this pool's actual recursively frozen outputs, never an
      // equal-but-unshared caller object. Every alias was charged above.
      if (projected.has(item)) return item
      if (active.has(item)) { failed = true; return fail("IMPORT_PROJECTION_LIMIT") }
      if (Array.isArray(item)) {
        reserve(192 + item.length * 16) // Container, both set entries and slots.
        active.add(item)
        const output = item.map(member => visit(member, depth + 1))
        active.delete(item)
        Object.freeze(output); projected.add(output)
        return output
      }
      let keyCount = 0
      for (const key in item) if (Object.hasOwn(item, key)) keyCount++
      // Reserve the key-list header/slots before constructing Object.keys.
      reserve(256 + keyCount * 48)
      const keys = Object.keys(item)
      active.add(item)
      const output: Record<string, unknown> = {}
      for (const key of keys) {
        reserve(64) // Property-name reference, even when its payload is shared.
        const name = intern(key)
        Object.defineProperty(output, name, { value: visit((item as Record<string, unknown>)[key], depth + 1), enumerable: true, configurable: false, writable: false })
      }
      active.delete(item)
      Object.freeze(output); projected.add(output)
      return output
    }
    return visit(value, 0) as T
  }
  return Object.freeze({ project, chargedBytes: () => charged })
}
const assessBoundFactoryIndependence = (repository: FactoryRepository, input: FactoryAssessmentInput, options: {persist?: boolean; correctionArtifactRoot?: LabRoot; boundedImport?: boolean; beforeCell?: (ordinal: number) => void; beforeAllocation?: (reserveBytes: number) => void} = {}, historicalImport?: FactoryHistoricalImportContext): FactoryAssessmentResult => {
  const persist = options.persist !== false, reasons:string[] = []
  if (historicalImport && persist) return fail("IMPORT_READ_ONLY")
  const measurementImplementationRoot = historicalImport ? requireFactoryHistoricalImportContext(historicalImport, repository, input.executionEvidenceArtifactRoot).historicalAssessmentImplementationRoot : implementationRoot()
  const manifest = admitFactoryCalibrationManifest(readFactoryCanonicalRecord(repository,input.manifestArtifactRoot))
  const opponentIdentityRoot = labRoot("factory-fixed-mechanics-opponent-identity-v1",{opponentId:"factory-fixed-mechanics-v1",tupleId:MATCH_KERNEL.tupleId,tupleRoot:LAB_ADMITTED_ROOTS.tupleRoot,image:LAB_ADMITTED_ROOTS.image,runtimeLimitsRoot:LAB_ADMITTED_ROOTS.runtimeLimitsRoot})
  const fresh = readFreshFactoryCalibration(repository,manifest,opponentIdentityRoot)
  const correction = options.correctionArtifactRoot && !historicalImport ? readFactoryAssessmentCorrection(repository,options.correctionArtifactRoot,{...input,windowTerminalArtifactRoot:input.windowTerminalArtifactRoot??null}) : undefined
  const evidence = historicalImport ? readHistoricalFactoryExecutionEvidence(repository,input.executionEvidenceArtifactRoot,fresh,historicalImport).evidence : readFactoryExecutionEvidence(repository,input.executionEvidenceArtifactRoot,fresh,correction)
  const correctionBinding = options.correctionArtifactRoot ? {correctionArtifactRoot:options.correctionArtifactRoot} : {}
  const ledger = options.boundedImport ? readRetainedFactoryLedger(repository, readLeanFactoryInventoryNames(repository, 200_000, options.beforeAllocation)) : readRetainedFactoryLedger(repository)
  if (ledger.ledgerRoot !== input.ledgerRoot) return fail("LEDGER_ROOT")
  if (ledger.entries.length > 48) return fail("EXTRA_ATTEMPTS")
  if (ledger.entries.length !== 48) reasons.push("incomplete_48_cells")
  const ordered = ledger.entries.map((entry) => ({...entry,accounting:readFactoryCanonicalRecord(repository,entry.start.resourceAccountingRoot)})).sort((left,right) => Number(left.accounting.ordinal)-Number(right.accounting.ordinal))
  if (!same(input.terminalRoots,ordered.map((entry) => entry.terminal.root))) return fail("TERMINAL_ROOTS")
  const observations = {} as Record<FactorySourceSlot,VerifiedFactoryCellObservation[]>
  type Reload = { root: LabRoot; receiptRoot: LabRoot; input: Omit<VerifiedFactoryCellObservationInput,"records"|"maxTokenChargeBytes">; facts: Pick<VerifiedFactoryCellObservation["facts"],"allSoldierBrainActionsStone"|"nonStoneToStoneCount"> }
  const reloads = {} as Record<FactorySourceSlot, Reload[]>
  let metadataBytes = 0
  const receiptByWorkload = new Map<LabRoot,LabRoot>(), observedSupervision:LabRoot[] = []
  let firstStart:number|null = null, previousStartedAtMs = -1
  for (const [ordinal,entry] of ordered.entries()) {
    if (options.boundedImport) options.beforeCell?.(ordinal)
    const {start,terminal,accounting} = entry, cell = fresh.cells[ordinal]!, workload = fresh.workloads[ordinal]!, ingestion = fresh.ingestions[cell.slot]
    if (accounting.schemaVersion !== "factory-calibration-accounting-v1" || accounting.ordinal !== ordinal || accounting.manifestRoot !== manifest.root || accounting.allocationRoot !== manifest.allocationRoot || accounting.workloadArtifactRoot !== manifest.workloads[ordinal]!.artifactRoot || accounting.maxInvocations !== 256 || !Number.isSafeInteger(accounting.maxLifetimeMs) || Number(accounting.maxLifetimeMs) < 1 || Number(accounting.maxLifetimeMs) > 120000 || start.inputRoot !== manifest.workloads[ordinal]!.artifactRoot || start.taskRoot !== manifest.protocolRoot || start.candidateRoot !== ingestion.packetRoot || start.retryParentRoot !== null || start.authoringMechanism !== "automated-oracle" || start.budgetRoot !== labRoot("factory-calibration-attempt-budget-v1",{allocationRoot:manifest.allocationRoot,ordinal})) return fail("WORKLOAD_CHARGE")
    if (!Number.isSafeInteger(accounting.firstWorkloadStartedAtMs) || Number(accounting.firstWorkloadStartedAtMs) < 0) return fail("WINDOW_CLOCK")
    firstStart ??= Number(accounting.firstWorkloadStartedAtMs)
    if (accounting.firstWorkloadStartedAtMs !== firstStart) return fail("WINDOW_RESET")
    const startedAtMs = Number(accounting.startedAtMs)
    if (!Number.isSafeInteger(startedAtMs) || startedAtMs < previousStartedAtMs || startedAtMs < firstStart || remainingFreshWorkloadLifetime(firstStart,startedAtMs) !== accounting.maxLifetimeMs) return fail("WINDOW_START")
    previousStartedAtMs = startedAtMs
    const final = readFactoryCanonicalRecord(repository,terminal.finalEvidenceRoot)
    if (final.startRoot !== start.root) return fail("TERMINAL_EVIDENCE")
    const supervisionRoot = final.supervisionArtifactRoot as LabRoot | undefined
    if (supervisionRoot) observedSupervision.push(supervisionRoot)
    if (terminal.disposition !== "unresolved" && terminal.disposition !== "accepted") {
      if (final.schemaVersion === "factory-calibration-error-v1" && (final.startedAtMs !== startedAtMs || !Number.isSafeInteger(final.completedAtMs) || Number(final.completedAtMs) < startedAtMs)) return fail("WINDOW_FAILURE")
      reasons.push(`cell:${ordinal}:${terminal.disposition}`); continue
    }
    if (!supervisionRoot || terminal.outputRoot !== supervisionRoot) return fail("RECEIPT_MISSING")
    const retained = (options.boundedImport ? readFactorySupervisionArtifactRecordsBounded : readFactorySupervisionArtifactRecords)(repository,supervisionRoot,{maxBytes:64*1024*1024,maxRecords:50000,...(options.boundedImport ? {beforeAllocation: options.beforeAllocation} : {})})
    const metadata = record(retained.records.find((item) => item.kind === "receipt")?.value), admission = record(metadata.admission), identity = record(metadata.candidateIdentity), matchup = record(metadata.matchup)
    const revisionId = String(identity.revisionId), arenaVariant = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === workload.condition.arenaId)
    if (!arenaVariant) return fail("ARENA")
    const candidateIsBottom = cell.candidateSide === "bottom"
    const match = {matchId:`factory-calibration-${workload.root.slice(7,23)}-${start.root.slice(7,15)}`,seed:cell.seed,arenaVariant,bottomPlayerId:candidateIsBottom?"factory-candidate":"factory-fixed-mechanics-v1",topPlayerId:candidateIsBottom?"factory-fixed-mechanics-v1":"factory-candidate",bottomStrategyRevisionId:candidateIsBottom?revisionId:"factory-fixed-mechanics-v1",topStrategyRevisionId:candidateIsBottom?"factory-fixed-mechanics-v1":revisionId,initialInitiativePlayerId:cell.initialInitiative === "candidate"?"factory-candidate":"factory-fixed-mechanics-v1",maxPhases:1}
    if (metadata.candidatePlayerId !== "factory-candidate" || admission.sourceRoot !== ingestion.sourceRoot || admission.packetRoot !== ingestion.packetRoot || identity.sourceRoot !== ingestion.sourceRoot || identity.attemptRoot !== start.root || identity.budgetRoot !== start.budgetRoot || identity.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || identity.image !== LAB_ADMITTED_ROOTS.image || matchup.status !== "verified" || matchup.side !== cell.candidateSide || matchup.initialInitiative !== (cell.initialInitiative === "candidate") || matchup.conditionRoot !== labRoot("factory-supervision-match-condition-v1",match)) return fail("RECEIPT_BINDING")
    const usage = readFactoryCanonicalRecord(repository,final.actualUsageRoot as LabRoot)
    const accountingRecords = retained.records.filter((item) => item.kind === "accounting"), traces = retained.records.filter((item) => item.kind === "trace")
    if (usage.schemaVersion !== "factory-calibration-actual-usage-v1" || usage.startRoot !== start.root || usage.receiptRoot !== retained.descriptor.receiptRoot || usage.supervisionArtifactRoot !== supervisionRoot || usage.totalInvocations !== accountingRecords.length || usage.candidateInvocations !== traces.length || traces.length < 1 || traces.length > 256) return fail("USAGE")
    if (usage.startedAtMs !== startedAtMs || !Number.isSafeInteger(usage.completedAtMs) || Number(usage.completedAtMs) < startedAtMs) return fail("WINDOW_COMPLETION")
    const resourceViolations=factoryWorkloadResourceViolations(startedAtMs,Number(usage.completedAtMs),accountingRecords.length,Number(accounting.maxLifetimeMs))
    if(resourceViolations.length){reasons.push(...resourceViolations.map(reason=>`cell:${ordinal}:${reason}`));continue}
    if (Number(usage.completedAtMs) - firstStart > 5400000) reasons.push(`cell:${ordinal}:window_overrun`)
    if (usage.retainedRecordCount !== retained.descriptor.recordCount || usage.retainedByteLength !== retained.descriptor.byteLength || usage.outputBytes !== accountingRecords.reduce((sum,item) => sum+Number(record(item.value).outputBytes),0)) return fail("USAGE_TOTALS")
    if (accountingRecords.some((item) => record(record(item.value).result).ok !== true) || traces.some((item) => record(item.value).classification !== "success")) { reasons.push(`cell:${ordinal}:runtime_failure`); continue }
    const sourceAudit = auditFactorySource(ingestion.sourceUtf8)
    const baseSlot = Object.hasOwn(FACTORY_CONTROL_BASES,cell.slot) ? FACTORY_CONTROL_BASES[cell.slot as FactoryControlSlot] : cell.slot
    const lineageEdges = [{label:"emitted-by",from:"strategy",to:fresh.ingestions[baseSlot].producerIdentity},...(baseSlot === cell.slot ? [] : [{label:"derived-from",from:"control",to:"strategy"}])]
    if (options.boundedImport) options.beforeAllocation?.(4 * 64 * 1024 * 1024)
    const projectionInput: Omit<VerifiedFactoryCellObservationInput,"records"|"maxTokenChargeBytes"> = {sourceUtf8:ingestion.sourceUtf8,cell:{key:`${cell.slot}:${cell.block}:${cell.initialInitiative}`,block:cell.block === "A"?"block-a":"block-b",candidateSide:cell.candidateSide,initialInitiative:cell.initialInitiative},lineageEdges,dependencyEdges:sourceAudit.dependencyEdges}
    const observation = createNumericObservationFromVerifiedCell({...projectionInput,records:retained.records,...(options.boundedImport ? { maxTokenChargeBytes: 64 * 1024 * 1024 } : {})})
    if (options.boundedImport) {
      const descriptor: Reload = { root: supervisionRoot, receiptRoot: retained.descriptor.receiptRoot, input: projectionInput, facts: { allSoldierBrainActionsStone: observation.facts.allSoldierBrainActionsStone, nonStoneToStoneCount: observation.facts.nonStoneToStoneCount } }
      // Count metadata/array slots before retention. Full cell projections are
      // validated, but never retained across this first validation pass.
      metadataBytes += boundedFactoryProjectionCharge(descriptor, LEAN_FACTORY_PROJECTION_CEILING_BYTES - metadataBytes) + 256
      if (metadataBytes > LEAN_FACTORY_PROJECTION_CEILING_BYTES) return fail("IMPORT_PROJECTION_LIMIT")
      boundedFactoryProjectionCharge(observation, LEAN_FACTORY_PROJECTION_CEILING_BYTES - metadataBytes)
      ;(reloads[cell.slot] ??= []).push(descriptor)
    } else observations[cell.slot] = [...(observations[cell.slot]??[]),observation]
    receiptByWorkload.set(workload.root,retained.descriptor.receiptRoot)
  }
  if (!same(input.supervisionArtifactRoots,observedSupervision) || new Set(observedSupervision).size !== observedSupervision.length) return fail("SUPERVISION_ROOTS")
  const pairs = new Set<string>()
  for (const root of input.pairingArtifactRoots) {
    const pairing = readFactoryCanonicalRecord(repository,root)
    if (pairing.schemaVersion === "factory-calibration-pairing-failure-v1") { requireFactoryRecordRoot(pairing,"factory-calibration-pairing-failure-v1"); reasons.push("candidate_pairing_failure"); continue }
    requireFactoryRecordRoot(pairing,"factory-calibration-pairing-v1")
    const group = String(pairing.pairGroup), workloads = fresh.workloads.filter((workload) => workload.pairGroup === group)
    if (pairs.has(group) || workloads.length !== 2) return fail("PAIR_GROUP")
    pairs.add(group)
    if (pairing.status !== "paired" || !same(pairing.workloadRoots,workloads.map((workload) => workload.root)) || !same(pairing.receiptRoots,workloads.map((workload) => receiptByWorkload.get(workload.root)??null))) reasons.push(`pair:${group}:incomplete`)
  }
  if (pairs.size !== 24) reasons.push("incomplete_24_pairs")
  const candidateReceipts = new Set<LabRoot>()
  for (const root of input.candidateArtifactRoots) {
    const publication = readFactoryCanonicalRecord(repository,root)
    requireFactoryRecordRoot(publication,"factory-candidate-publication-v1")
    const candidate = FactoryCandidateSchema.parse(publication.candidate)
    if (!same(publication.supervisionReceiptRoot,candidate.supervisionReceiptRoot) || ![...receiptByWorkload.values()].includes(candidate.supervisionReceiptRoot) || candidateReceipts.has(candidate.supervisionReceiptRoot)) return fail("CANDIDATE_BINDING")
    candidateReceipts.add(candidate.supervisionReceiptRoot)
  }
  if (candidateReceipts.size !== 48) reasons.push("incomplete_candidate_publications")
  if (input.windowTerminalArtifactRoot) {
    const window = readFactoryCanonicalRecord(repository,input.windowTerminalArtifactRoot); requireFactoryRecordRoot(window,"factory-calibration-window-terminal-v1")
    if (window.manifestRoot !== manifest.root || window.allocationRoot !== manifest.allocationRoot || window.completedCount !== ordered.length || window.nextOrdinal !== ordered.length || window.reason !== "timebox_exhausted") return fail("WINDOW_TERMINAL")
    reasons.push("timebox_exhausted")
  }
  const merged = {} as Record<FactorySourceSlot,NumericCalibrationEvidence>
  let completeSlots = 0
  for (const slot of fresh.allocation.sourceSlots) {
    const values = observations[slot]??[], count = options.boundedImport ? (reloads[slot]??[]).length : values.length
    if (count !== 4) { reasons.push(`slot:${slot}:incomplete`); continue }
    completeSlots++
    if (options.boundedImport) continue
    const combine = (field:"legalInputSamples"|"chronicleSamples"|"matchupSamples") => Object.assign({},...values.map((value) => value.evidence[field])) as Record<string,readonly string[]>
    merged[slot] = {...values[0]!.evidence,legalInputSamples:combine("legalInputSamples"),chronicleSamples:combine("chronicleSamples"),matchupSamples:combine("matchupSamples")}
  }
  // No numeric fitting or base comparisons from incomplete or failed data.
  let controls:NumericControlTable|null = null, baseEdges:Record<string,NumericComparison> = {}, thresholdArtifactRoot:LabRoot|null = null
  const hasDivergentStone = (left:NumericCalibrationEvidence,right:NumericCalibrationEvidence,xOnly:boolean) => Object.entries(left.legalInputSamples).some(([key,tokens]) => {
    const other = right.legalInputSamples[key]
    return other && (!xOnly || key.startsWith("block-a:") && tokens.includes("request.self.position.x=2")) && same(tokens.filter((token) => token.startsWith("request.")),other.filter((token) => token.startsWith("request."))) && !tokens.includes("decision.action.type=TURN_TO_STONE") && tokens.some((token) => token.startsWith("decision.action.type=")) && other.includes("decision.action.type=TURN_TO_STONE")
  })
  type PairResult = { score: Readonly<NumericComparison>; positiveEqual: boolean; stone: boolean; stoneX: boolean }
  const pairResults = new Map<string,PairResult>()
  const boundedPair = (id:string): PairResult => {
    const cached = pairResults.get(id); if (cached) return cached
    const [leftSlot,rightSlot] = id.split("/") as [FactorySourceSlot,FactorySourceSlot]
    if (!([...CONTROL_IDS,...BASE_EDGES] as readonly string[]).includes(id) || reloads[leftSlot]?.length !== 4 || reloads[rightSlot]?.length !== 4) return fail("IMPORT_PROJECTION_LIMIT")
    options.beforeAllocation?.(4 * 64 * 1024 * 1024)
    const pool = createBoundedFactoryProjectionPool(LEAN_FACTORY_PROJECTION_CEILING_BYTES - metadataBytes)
    const load = (slot:FactorySourceSlot): NumericCalibrationEvidence => {
      const values = reloads[slot].map(descriptor => {
        options.beforeAllocation?.(4 * 64 * 1024 * 1024)
        const retained = readFactorySupervisionArtifactRecordsBounded(repository,descriptor.root,{maxBytes:64*1024*1024,maxRecords:50000,beforeAllocation:options.beforeAllocation})
        if (retained.descriptor.receiptRoot !== descriptor.receiptRoot) return fail("RECEIPT_BINDING")
        return pool.project(createNumericObservationFromVerifiedCell({...descriptor.input,records:retained.records,maxTokenChargeBytes:64*1024*1024}))
      })
      const combine = (field:"legalInputSamples"|"chronicleSamples"|"matchupSamples") => {
        let keys = 0
        for (const value of values) for (const key in value.evidence[field]) if (Object.hasOwn(value.evidence[field],key)) keys++
        // Account transient spread/key/reference slots before Object.assign;
        // project then charges retained maps and reuses known frozen vectors.
        options.beforeAllocation?.(256 + keys * 64)
        return Object.assign({},...values.map(value=>value.evidence[field])) as Record<string,readonly string[]>
      }
      return pool.project({...values[0]!.evidence,legalInputSamples:combine("legalInputSamples"),chronicleSamples:combine("chronicleSamples"),matchupSamples:combine("matchupSamples")})
    }
    const left = load(leftSlot), right = load(rightSlot)
    options.beforeAllocation?.(4 * 64 * 1024 * 1024) // Numeric Set/union scratch.
    const result: PairResult = { score:compareNumericEvidence(left,right),positiveEqual:equalFactoryObservationMaps(left.legalInputSamples,right.legalInputSamples)&&equalFactoryObservationMaps(left.chronicleSamples,right.chronicleSamples),stone:hasDivergentStone(left,right,false),stoneX:hasDivergentStone(left,right,true) }
    metadataBytes += boundedFactoryProjectionCharge({id,result},LEAN_FACTORY_PROJECTION_CEILING_BYTES-metadataBytes) + 256
    if (metadataBytes + pool.chargedBytes() > LEAN_FACTORY_PROJECTION_CEILING_BYTES) return fail("IMPORT_PROJECTION_LIMIT")
    pairResults.set(id,result)
    return result // No graph/record/pool reference escapes into the cache.
  }
  const comparison = (id:string) => { const [left,right] = id.split("/") as [FactorySourceSlot,FactorySourceSlot]; return options.boundedImport ? boundedPair(id).score : compareNumericEvidence(merged[left],merged[right]) }
  const groundTruth:string[] = []
  if (completeSlots === 12) {
    for (const pair of ["S01/S02","S03/S04","S05/S06"]) {
      const [left,right] = pair.split("/") as [FactorySourceSlot,FactorySourceSlot]
      if (options.boundedImport ? !boundedPair(pair).positiveEqual : !equalFactoryObservationMaps(merged[left].legalInputSamples,merged[right].legalInputSamples) || !equalFactoryObservationMaps(merged[left].chronicleSamples,merged[right].chronicleSamples)) groundTruth.push(`positive_behavior:${pair}`)
    }
    const divergentStone = (left:FactorySourceSlot,right:FactorySourceSlot,xOnly:boolean) => options.boundedImport ? (xOnly ? boundedPair(`${left}/${right}`).stoneX : boundedPair(`${left}/${right}`).stone) : hasDivergentStone(merged[left],merged[right],xOnly)
    const stoneFacts = options.boundedImport ? reloads.S08.map(value=>value.facts) : observations.S08.map(value=>value.facts)
    if (!divergentStone("S01","S07",true)) groundTruth.push("near_x2_override_not_observed")
    if (!divergentStone("S01","S08",false) || !stoneFacts.every(value => value.allSoldierBrainActionsStone === true) || stoneFacts.reduce((sum,value) => sum+value.nonStoneToStoneCount,0) < 1) groundTruth.push("latent_stoning_not_observed")
    if (!divergentStone("S11","S12",false)) groundTruth.push("guard_contrast_not_observed")
    controls = Object.fromEntries(CONTROL_IDS.map((id) => [id,comparison(id)])) as unknown as NumericControlTable
    const fit = freezeNumericCalibrationThreshold(controls)
    if (fit.status === "frozen" && reasons.length === 0 && groundTruth.length === 0) {
      const threshold = rooted(options.correctionArtifactRoot ? "factory-numeric-threshold-v2" : "factory-numeric-threshold-v1",{...correctionBinding,manifestRoot:manifest.root,allocationRoot:manifest.allocationRoot,sourceRoots:fresh.allocation.sourceSlots.map((slot) => fresh.ingestions[slot].sourceRoot),receiptRoots:observedSupervision,implementationRoot:measurementImplementationRoot,studyPolicyRoot:manifest.studyPolicyRoot,measurementPolicyRoot:manifest.measurementPolicyRoot,controls,threshold:fit.threshold})
      thresholdArtifactRoot = artifactIdentity(threshold)
      if (persist) publishFactoryArtifact(repository,encode(threshold))
      else if (!same(readFactoryCanonicalRecord(repository,thresholdArtifactRoot),threshold)) return fail("THRESHOLD_REOPEN")
      // Freeze/publication precedes every unlabeled base-edge computation.
      baseEdges = Object.fromEntries(BASE_EDGES.map((id) => [id,comparison(id)]))
    }
  }
  reasons.push(...groundTruth)
  const sharing = Number(deriveFactorySharedHelperAudit(fresh.ingestions).strategicSharingViolations)
  const decision = controls ? decideFactoryIndependence(controls,baseEdges,reasons,sharing) : {status:"unresolved" as const,reasons:[...new Set([...reasons,"incomplete_controls"])]}
  const assessment = rooted(options.correctionArtifactRoot ? "factory-independence-assessment-v2" : "factory-independence-assessment-v1",{...correctionBinding,privacy:"private_offline",input:{...input,windowTerminalArtifactRoot:input.windowTerminalArtifactRoot??null},manifestRoot:manifest.root,allocationRoot:manifest.allocationRoot,implementationRoot:measurementImplementationRoot,executionEvidenceRoot:evidence.root,status:decision.status,reasons:decision.reasons,thresholdArtifactRoot,controls,baseEdges,strategicSharingViolations:sharing,completedCells:ordered.length,completePairs:pairs.size,scope:"two_geometry_side_confounded_fixed_opponent_one_phase_development",competitiveClaim:"none",publicAuthority:false,holdoutOpened:false,formationMaterialized:false})
  const assessmentArtifactRoot = persist ? publishFactoryArtifact(repository,encode(assessment)) : null
  return {status:decision.status,reasons:decision.reasons,assessmentRoot:assessment.root,assessmentArtifactRoot,thresholdArtifactRoot,manifestRoot:manifest.root,allocationRoot:manifest.allocationRoot}
}
export const assessFactoryIndependence = (repository: FactoryRepository, input: FactoryAssessmentInput, options: {persist?: boolean; correctionArtifactRoot?: LabRoot} = {}): FactoryAssessmentResult => assessBoundFactoryIndependence(repository, input, options)
/** Original measurement and current reader identities remain distinct. No new execution authority. */
export const verifyHistoricalFactoryAssessmentForLeague = (repository: FactoryRepository, artifactRoot: LabRoot, options: { readonly boundedImport?: true; readonly beforeCell?: (ordinal: number) => void; readonly beforeAllocation?: (reserveBytes: number) => void } = {}): FactoryAssessmentResult & { issued: false; historicalProducerImplementationRoot: LabRoot; historicalAssessmentImplementationRoot: LabRoot; currentReaderImplementationRoot: LabRoot } => {
  const context = readFactoryHistoricalImportContext(repository, artifactRoot), saved = readFactoryCanonicalRecord(repository, artifactRoot)
  const result = assessBoundFactoryIndependence(repository, saved.input as unknown as FactoryAssessmentInput, { persist: false, ...options, ...(saved.schemaVersion === "factory-independence-assessment-v2" ? { correctionArtifactRoot: saved.correctionArtifactRoot as LabRoot } : {}) }, context)
  if (result.assessmentRoot !== context.assessmentRoot) return fail("IMPORT_ASSESSMENT_REOPEN")
  return Object.freeze({ ...result, issued: false as const, historicalProducerImplementationRoot: context.historicalProducerImplementationRoot, historicalAssessmentImplementationRoot: context.historicalAssessmentImplementationRoot, currentReaderImplementationRoot: context.currentReaderImplementationRoot })
}

export const verifyRetainedFactoryAssessment = (repository:FactoryRepository,artifactRoot:LabRoot):FactoryAssessmentResult => {
  const saved = readFactoryCanonicalRecord(repository,artifactRoot)
  if (saved.schemaVersion!=="factory-independence-assessment-v1" && saved.schemaVersion!=="factory-independence-assessment-v2") return fail("SCHEMA")
  requireFactoryRecordRoot(saved,saved.schemaVersion)
  if (saved.schemaVersion==="factory-independence-assessment-v2" && (typeof saved.correctionArtifactRoot!=="string" || !/^sha256:[a-f0-9]{64}$/u.test(saved.correctionArtifactRoot))) return fail("CORRECTION_ROOT")
  const result = assessFactoryIndependence(repository,saved.input as unknown as FactoryAssessmentInput,{persist:false,...(saved.schemaVersion==="factory-independence-assessment-v2"?{correctionArtifactRoot:saved.correctionArtifactRoot as LabRoot}:{})})
  if (result.assessmentRoot !== saved.root) return fail("ASSESSMENT_REOPEN")
  return result
}
const argument = (name:string) => { const index=process.argv.indexOf(name); return index<0?undefined:process.argv[index+1] }
const main = () => {
  if (process.argv.includes("--help")) { process.stdout.write("Usage: assess-v1-38-factory-independence --verify-retained --store <factory-directory> --assessment-root <artifact-root>\nRead-only private verification; no model, guest, or Match execution.\n"); return }
  const directory=argument("--store"),root=argument("--assessment-root")
  if (!process.argv.includes("--verify-retained") || !directory || !root || !/^sha256:[a-f0-9]{64}$/u.test(root)) return fail("ARGUMENTS")
  process.stdout.write(`${JSON.stringify(verifyRetainedFactoryAssessment(createFactoryRepository(resolve(directory)),root as LabRoot))}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) { try { main() } catch(error) { process.stderr.write(`${error instanceof Error?error.message:"FACTORY_ASSESSMENT_ERROR"}\n`); process.exitCode=1 } }
