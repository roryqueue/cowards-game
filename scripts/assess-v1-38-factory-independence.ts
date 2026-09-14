import { lstatSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, publishFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { admitFactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
import { validateFactoryAttemptStart, validateFactoryAttemptLedger } from "../packages/strategy-lab/src/factory/ledger.js"
import { FactoryCandidateSchema } from "../packages/strategy-lab/src/factory/contracts.js"
import { readFactorySupervisionArtifactRecords } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { compareNumericEvidence, freezeNumericCalibrationThreshold, classifyNumericComparison, type NumericCalibrationEvidence, type NumericComparison, type NumericControlTable, type NumericControlId } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
import { readFactoryCanonicalRecord, readFreshFactoryCalibration, requireFactoryRecordRoot, remainingFreshWorkloadLifetime } from "./v1-38-factory-fresh-evidence.js"
import { deriveFactorySharedHelperAudit, factoryEvidenceByteRoot, readFactoryExecutionEvidence } from "./v1-38-factory-execution-evidence.js"
import { createNumericObservationFromVerifiedCell, type VerifiedFactoryCellObservation } from "./v1-38-factory-observations.js"
import { auditFactorySource } from "./v1-38-factory-source-audit.js"
import { FACTORY_CONTROL_BASES, type FactoryControlSlot } from "./v1-38-factory-controls.js"
import type { FactorySourceSlot } from "./v1-38-factory-allocation.js"
import { factoryAssessmentImplementationRoot as implementationRoot } from "./v1-38-factory-implementation.js"

const BASE_EDGES = ["S01/S03", "S01/S05", "S03/S05"] as const
const CONTROL_IDS: readonly NumericControlId[] = ["S01/S02", "S03/S04", "S05/S06", "S01/S07", "S01/S08", "S11/S12"]
const fail = (code: string): never => { throw new TypeError(`FACTORY_ASSESSMENT_${code}`) }
const encode = (value: unknown) => { const result = admitCanonicalJsonValue(value, {profile:"canonical-manifest"}); return result.ok ? result.canonicalBytes : fail("CANONICAL") }
const same = (left: unknown, right: unknown) => labRoot("factory-assessment-equality-v1",left) === labRoot("factory-assessment-equality-v1",right)
const record = (value: unknown): Record<string,unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : fail("RECORD")
export const factoryWorkloadResourceViolations = (_started:number,_completed:number,_invocations:number,_lifetime:number):readonly string[] => []

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
export const readRetainedFactoryLedger = (repository: FactoryRepository) => {
  const names = readdirSync(repository.directory).sort()
  const read = (name: string) => {
    const path = join(repository.directory,name), stat = lstatSync(path)
    if (!stat.isFile() || stat.size > 262144) return fail("LEDGER_FILE")
    const parsed = admitCanonicalJsonBytes(readFileSync(path),{profile:"canonical-manifest",operation:"require-canonical"})
    return parsed.ok ? parsed.value : fail("LEDGER_BYTES")
  }
  const entries = names.filter((name) => /^factory-attempt-[a-f0-9]{64}\.started\.json$/u.test(name)).map((name) => {
    const start = validateFactoryAttemptStart(read(name))
    if (name !== `factory-attempt-${start.root.slice(7)}.started.json`) return fail("LEDGER_NAME")
    const terminalName = name.replace(".started.json",".terminal.json")
    if (!names.includes(terminalName)) return fail("UNCERTAIN_START")
    return {start,terminal:validateFactoryAttemptLedger(start,read(terminalName))}
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

export const assessFactoryIndependence = (repository: FactoryRepository, input: FactoryAssessmentInput, options: {persist?: boolean} = {}): FactoryAssessmentResult => {
  const persist = options.persist !== false, reasons:string[] = []
  const manifest = admitFactoryCalibrationManifest(readFactoryCanonicalRecord(repository,input.manifestArtifactRoot))
  const opponentIdentityRoot = labRoot("factory-fixed-mechanics-opponent-identity-v1",{opponentId:"factory-fixed-mechanics-v1",tupleId:MATCH_KERNEL.tupleId,tupleRoot:LAB_ADMITTED_ROOTS.tupleRoot,image:LAB_ADMITTED_ROOTS.image,runtimeLimitsRoot:LAB_ADMITTED_ROOTS.runtimeLimitsRoot})
  const fresh = readFreshFactoryCalibration(repository,manifest,opponentIdentityRoot)
  const evidence = readFactoryExecutionEvidence(repository,input.executionEvidenceArtifactRoot,fresh)
  const ledger = readRetainedFactoryLedger(repository)
  if (ledger.ledgerRoot !== input.ledgerRoot) return fail("LEDGER_ROOT")
  if (ledger.entries.length > 48) return fail("EXTRA_ATTEMPTS")
  if (ledger.entries.length !== 48) reasons.push("incomplete_48_cells")
  const ordered = ledger.entries.map((entry) => ({...entry,accounting:readFactoryCanonicalRecord(repository,entry.start.resourceAccountingRoot)})).sort((left,right) => Number(left.accounting.ordinal)-Number(right.accounting.ordinal))
  if (!same(input.terminalRoots,ordered.map((entry) => entry.terminal.root))) return fail("TERMINAL_ROOTS")
  const observations = {} as Record<FactorySourceSlot,VerifiedFactoryCellObservation[]>
  const receiptByWorkload = new Map<LabRoot,LabRoot>(), observedSupervision:LabRoot[] = []
  let firstStart:number|null = null, previousStartedAtMs = -1
  for (const [ordinal,entry] of ordered.entries()) {
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
    const retained = readFactorySupervisionArtifactRecords(repository,supervisionRoot,{maxBytes:64*1024*1024,maxRecords:50000})
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
    if (Number(usage.completedAtMs) - firstStart > 5400000) reasons.push(`cell:${ordinal}:window_overrun`)
    if (usage.retainedRecordCount !== retained.descriptor.recordCount || usage.retainedByteLength !== retained.descriptor.byteLength || usage.outputBytes !== accountingRecords.reduce((sum,item) => sum+Number(record(item.value).outputBytes),0)) return fail("USAGE_TOTALS")
    if (accountingRecords.some((item) => record(record(item.value).result).ok !== true) || traces.some((item) => record(item.value).classification !== "success")) { reasons.push(`cell:${ordinal}:runtime_failure`); continue }
    const sourceAudit = auditFactorySource(ingestion.sourceUtf8)
    const baseSlot = Object.hasOwn(FACTORY_CONTROL_BASES,cell.slot) ? FACTORY_CONTROL_BASES[cell.slot as FactoryControlSlot] : cell.slot
    const lineageEdges = [{label:"emitted-by",from:"strategy",to:fresh.ingestions[baseSlot].producerIdentity},...(baseSlot === cell.slot ? [] : [{label:"derived-from",from:"control",to:"strategy"}])]
    const observation = createNumericObservationFromVerifiedCell({sourceUtf8:ingestion.sourceUtf8,cell:{key:`${cell.slot}:${cell.block}:${cell.initialInitiative}`,block:cell.block === "A"?"block-a":"block-b",candidateSide:cell.candidateSide,initialInitiative:cell.initialInitiative},lineageEdges,dependencyEdges:sourceAudit.dependencyEdges,records:retained.records})
    observations[cell.slot] = [...(observations[cell.slot]??[]),observation]
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
  for (const slot of fresh.allocation.sourceSlots) {
    const values = observations[slot]??[]
    if (values.length !== 4) { reasons.push(`slot:${slot}:incomplete`); continue }
    const combine = (field:"legalInputSamples"|"chronicleSamples"|"matchupSamples") => Object.assign({},...values.map((value) => value.evidence[field])) as Record<string,readonly string[]>
    merged[slot] = {...values[0]!.evidence,legalInputSamples:combine("legalInputSamples"),chronicleSamples:combine("chronicleSamples"),matchupSamples:combine("matchupSamples")}
  }
  // No numeric fitting or base comparisons from incomplete or failed data.
  let controls:NumericControlTable|null = null, baseEdges:Record<string,NumericComparison> = {}, thresholdArtifactRoot:LabRoot|null = null
  const comparison = (id:string) => { const [left,right] = id.split("/") as [FactorySourceSlot,FactorySourceSlot]; return compareNumericEvidence(merged[left],merged[right]) }
  const groundTruth:string[] = []
  if (Object.keys(merged).length === 12) {
    for (const pair of ["S01/S02","S03/S04","S05/S06"]) {
      const [left,right] = pair.split("/") as [FactorySourceSlot,FactorySourceSlot]
      if (!same(merged[left].legalInputSamples,merged[right].legalInputSamples) || !same(merged[left].chronicleSamples,merged[right].chronicleSamples)) groundTruth.push(`positive_behavior:${pair}`)
    }
    const divergentStone = (left:FactorySourceSlot,right:FactorySourceSlot,xOnly:boolean) => Object.entries(merged[left].legalInputSamples).some(([key,tokens]) => {
      const other = merged[right].legalInputSamples[key]
      return other && (!xOnly || key.startsWith("block-a:") && tokens.includes("request.self.position.x=2")) && same(tokens.filter((token) => token.startsWith("request.")),other.filter((token) => token.startsWith("request."))) && !tokens.includes("decision.action.type=TURN_TO_STONE") && tokens.some((token) => token.startsWith("decision.action.type=")) && other.includes("decision.action.type=TURN_TO_STONE")
    })
    if (!divergentStone("S01","S07",true)) groundTruth.push("near_x2_override_not_observed")
    if (!divergentStone("S01","S08",false) || !observations.S08.every((value) => value.facts.allSoldierBrainActionsStone === true) || observations.S08.reduce((sum,value) => sum+value.facts.nonStoneToStoneCount,0) < 1) groundTruth.push("latent_stoning_not_observed")
    if (!divergentStone("S11","S12",false)) groundTruth.push("guard_contrast_not_observed")
    controls = Object.fromEntries(CONTROL_IDS.map((id) => [id,comparison(id)])) as unknown as NumericControlTable
    const fit = freezeNumericCalibrationThreshold(controls)
    if (fit.status === "frozen" && reasons.length === 0 && groundTruth.length === 0) {
      const threshold = rooted("factory-numeric-threshold-v1",{manifestRoot:manifest.root,allocationRoot:manifest.allocationRoot,sourceRoots:fresh.allocation.sourceSlots.map((slot) => fresh.ingestions[slot].sourceRoot),receiptRoots:observedSupervision,implementationRoot:implementationRoot(),studyPolicyRoot:manifest.studyPolicyRoot,measurementPolicyRoot:manifest.measurementPolicyRoot,controls,threshold:fit.threshold})
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
  const assessment = rooted("factory-independence-assessment-v1",{privacy:"private_offline",input:{...input,windowTerminalArtifactRoot:input.windowTerminalArtifactRoot??null},manifestRoot:manifest.root,allocationRoot:manifest.allocationRoot,implementationRoot:implementationRoot(),executionEvidenceRoot:evidence.root,status:decision.status,reasons:decision.reasons,thresholdArtifactRoot,controls,baseEdges,strategicSharingViolations:sharing,completedCells:ordered.length,completePairs:pairs.size,scope:"two_geometry_side_confounded_fixed_opponent_one_phase_development",competitiveClaim:"none",publicAuthority:false,holdoutOpened:false,formationMaterialized:false})
  const assessmentArtifactRoot = persist ? publishFactoryArtifact(repository,encode(assessment)) : null
  return {status:decision.status,reasons:decision.reasons,assessmentRoot:assessment.root,assessmentArtifactRoot,thresholdArtifactRoot,manifestRoot:manifest.root,allocationRoot:manifest.allocationRoot}
}

export const verifyRetainedFactoryAssessment = (repository:FactoryRepository,artifactRoot:LabRoot):FactoryAssessmentResult => {
  const saved = readFactoryCanonicalRecord(repository,artifactRoot); requireFactoryRecordRoot(saved,"factory-independence-assessment-v1")
  const result = assessFactoryIndependence(repository,saved.input as unknown as FactoryAssessmentInput,{persist:false})
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
