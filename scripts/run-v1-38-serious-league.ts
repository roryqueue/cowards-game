import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { closeSync, fsyncSync, lstatSync, openSync, readFileSync, readdirSync, statfsSync, writeSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, createSetScenarioV137 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createLeagueExecutionAllocation, admitAnyLeagueExecutionAllocation as admitLeagueExecutionAllocation, createProspectiveLeagueExecutionAllocation, createLeagueCapacityReceipt, admitLeagueCapacityReceipt, admitLeagueCapacityPlanInput, LEAGUE_MINIMUM_PROCESS_HEADROOM_BYTES, type AdmittedLeagueExecutionAllocation as LeagueExecutionAllocation, type ProspectiveLeagueExecutionAllocation, type LeagueCapacityReceipt, type LeagueCapacityContext } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeaguePopulation, createLeagueCell, createLeagueCellTerminal, createLeagueMixture, importAssessedFactoryCandidate, projectCanonicalKernelOutcomeToEntrantHalfPoints, LeagueCandidateAdmissionSchema, type LeagueCandidateAdmission, type LeagueCell, type LeagueCellTerminal } from "../packages/strategy-lab/src/league/contracts.js"
import { createLeagueRepository, publishLeagueArtifact, readLeagueArtifact, publishLeagueComposedArtifact, readLeagueComposedArtifact, recordLeagueCellStart, publishLeagueCellTerminal, reopenLeagueEvidence, type LeagueRepository, type ReopenedLeagueEvidence } from "../packages/strategy-lab/src/league/repository.js"
import { enumerateLeagueCells, admitCompletePayoffSnapshot, assertLeaguePayoffCapacity, leaguePlayerId, type LeagueMatrix } from "../packages/strategy-lab/src/league/matrix.js"
import { issueLeagueProviderFromFactoryCandidate, readCandidateClosure, runLeagueCell, deriveLeagueMatchExecutionTerminal, type FactoryCandidateClosure, type FactorySupervisedRuntimeHost } from "../packages/strategy-lab/src/league/connected-runner.js"
import { solveLeagueSnapshot } from "../packages/strategy-lab/src/league/solver.js"
import { declareLeagueRound, advanceLeagueRound, type DeclaredLeagueRound, type LeagueResponseRow } from "../packages/strategy-lab/src/league/psro.js"
import { declareRedTeamAllocation, startRedTeamAttempt, terminalizeRedTeamAttempt, reenterAcceptedCounter, recordLeagueProbe, closeRedTeamLedger, LEAGUE_PROBES, type LeagueProbeFamily, type RedTeamLedger, type RedTeamResources } from "../packages/strategy-lab/src/league/red-team.js"
import { deriveLeaguePortfolio, selectRobustPure, type LeaguePortfolioCandidate, type LeagueLinkedResponseIteration } from "../packages/strategy-lab/src/league/selection.js"
import { publishLeagueReport, reopenLeagueReport } from "../packages/strategy-lab/src/league/report.js"
import { createFactoryRepository, readFactoryArtifact, publishFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { validateFactoryAttemptStart, validateFactoryAttemptLedger } from "../packages/strategy-lab/src/factory/ledger.js"
import { deriveFactoryExecutionCommitment, deriveFactoryOrderedRecordDescriptor } from "../packages/strategy-lab/src/factory/admission.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { FactorySupervisionProvider } from "../packages/strategy-lab/src/factory/admission.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { factoryAssessmentImplementationRoot, factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { verifyHistoricalFactoryAssessmentForLeague, readRetainedFactoryLedger } from "./assess-v1-38-factory-independence.js"
import { readFactorySupervisionArtifactRecords } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { preflightLeagueAuthoring, verifyRetainedLeagueAuthoring } from "./lib/v1-38-league-authoring.js"
import { wrapLeagueProbeProvider, produceLeagueResponse, verifyRetainedLeagueResponse, verifyRetainedLeagueProbeInvocations, enumerateLeagueResponseConditions } from "./lib/v1-38-league-response-runtime.js"
import { isLeagueExecutionStreamReference, prepareLeagueExecutionStream, readLeagueExecutionStream } from "./lib/v1-38-league-execution-stream.js"
import { buildLeagueTacticalCorpus, isProspectiveTacticalJob, readRetainedTacticalAuthoringContext, readTacticalLeagueRecord } from "./lib/v1-38-league-tactical-corpus.js"
import { MEMORY_PRESSURE_Q_REQUEST, parseMemoryPressureQ, type MemoryPressureQCommandResult } from "./lib/v1-38-darwin-headroom.js"

const fail = (code: string): never => { throw new TypeError(`SERIOUS_LEAGUE_${code}`) }
/** Diagnostic only: exact supervisor-owned codes, never a free-form message.
 * This does not change the Match/system-failure classification or authorize a
 * retry. Adding a code requires reviewing its producer and privacy boundary. */
const SUPERVISOR_FAILURE_CODES = new Set([
  "FACTORY_RUNTIME_LIFETIME_EXHAUSTED", "FACTORY_RUNTIME_REQUEST_IDENTITY", "FACTORY_RUNTIME_EVIDENCE_IDENTITY",
  "LAB_RUNTIME_STOPPED", "LAB_REQUEST_BINDING", "LAB_INPUT_INVALID", "LAB_INPUT_BINDING",
])
export const retainedSupervisorFailureDiagnostic = (error: unknown): Readonly<{ error: "TypeError" | "Error" | "unknown"; supervisorCode: string | null }> => ({
  error: error instanceof TypeError ? "TypeError" : error instanceof Error ? "Error" : "unknown",
  supervisorCode: error instanceof TypeError && SUPERVISOR_FAILURE_CODES.has(error.message) ? error.message : null,
})
const bytesRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const encode = (value: unknown): Uint8Array => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); return result.ok ? result.canonicalBytes : fail("CANONICAL") }
const parse = (bytes: Uint8Array): any => { const result = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" }); return result.ok ? result.value : fail("CANONICAL_BYTES") }
const same = (left: unknown, right: unknown) => bytesRoot(encode(left)) === bytesRoot(encode(right))
const rooted = <T extends object>(schemaVersion: string, value: T) => { const body = { schemaVersion, privacy: "private_offline", ...value }; return { ...body, root: labRoot(schemaVersion, body) } }

/** One allocation-backed counter shared by both fresh repositories. Failed or
 * uncertain writes keep their charge. Existing identical files never call it. */
export class LeagueRetentionBudget {
  private workBytes = 0; private workRecords = 0; private terminalBytes = 0; private terminalRecords = 0; private terminalMode = false
  private readonly charged = new Set<string>()
  exhausted = false
  constructor(readonly allocation: LeagueExecutionAllocation, readonly checkDispatchCapacity?: () => void) { admitLeagueExecutionAllocation(allocation) }
  beforeDispatch() {
    if (this.exhausted || this.terminalMode) return fail("RETENTION_DISPATCH_STOP")
    try { this.checkDispatchCapacity?.() } catch (error) { this.exhausted = true; throw error }
  }
  checkCapacity(byteLength: number, records: number, terminal = this.terminalMode) {
    const limits = this.allocation.operations
    if (!terminal && (this.exhausted || this.workBytes + byteLength > limits.maxArtifactBytes - limits.terminalReserveBytes || this.workRecords + records > limits.maxArtifactRecords - limits.terminalReserveRecords)) { this.exhausted = true; return fail("RETENTION_BUDGET") }
    if (terminal && (this.terminalBytes + byteLength > limits.terminalReserveBytes || this.terminalRecords + records > limits.terminalReserveRecords)) return fail("TERMINAL_RETENTION_BUDGET")
  }
  readonly beforePublication = (value: { target: string; byteLength: number; terminal: boolean }) => {
    const terminal = value.terminal || this.terminalMode
    if (this.charged.has(value.target)) return fail("UNCERTAIN_REPUBLICATION")
    if (value.target.endsWith(".started.json")) {
      this.beforeDispatch()
      if (this.exhausted || this.terminalMode) return fail("RETENTION_DISPATCH_STOP")
      this.checkCapacity(6 * 262144, 24, true)
      // A start and its ordinary terminal must fit the work pool before work.
      // Failure/cleanup headroom remains entirely separate and untouched.
      this.checkCapacity(value.byteLength + 262144, 2, false)
    }
    this.checkCapacity(value.byteLength, 1, terminal); this.charged.add(value.target)
    if (terminal) { this.terminalBytes += value.byteLength; this.terminalRecords++ } else { this.workBytes += value.byteLength; this.workRecords++ }
  }
  terminal<T>(action: () => T): T { const prior = this.terminalMode; this.terminalMode = true; try { return action() } finally { this.terminalMode = prior } }
  get usage() { return { workBytes: this.workBytes, workRecords: this.workRecords, terminalBytes: this.terminalBytes, terminalRecords: this.terminalRecords, exhausted: this.exhausted } }
}

/** Every private value is retained as bounded canonical chunks with explicit dependency edges. */
export class LeagueRecordGraph {
  private writtenBytes = 0
  private records = 0
  latestRoot: LabRoot | null = null
  constructor(readonly repository: LeagueRepository, readonly limits: { maxArtifactBytes: number; maxArtifactRecords: number }, readonly budget?: LeagueRetentionBudget) {}
  beforeDispatch() { this.budget?.beforeDispatch() }
  beforeInvocation(request: unknown) {
    if (!this.budget) return
    this.beforeDispatch()
    // Two request projections and two result projections, including worst-case
    // JSON escaping, fit before the guest is called. The final envelope and
    // chunk records are included; this is capacity, not an extra execution cap.
    const bytes = encode(request).length * 4 + this.budget.allocation.operations.outputLimitBytes * 12 + 262144
    this.budget.checkCapacity(bytes, 2 * Math.ceil(bytes / 131072) + 1)
  }
  append(kind: string, value: unknown, links: readonly LabRoot[] = [], reserve: { bytes: number; records: number } = { bytes: 0, records: 0 }): LabRoot {
    if (this.budget?.exhausted && ["run-failure", "red-team-terminal", "red-team-process-failure", "response-production-failure", "response-runtime-cleanup", "response-runtime-invocation-failure", "response-match-execution-failure", "runtime-cleanup", "runtime-cleanup-failure", "runtime-invocation-failure", "cell-issuance-failure"].includes(kind)) {
      const preserveChargeLinks = ["cell-issuance-failure", "runtime-cleanup", "runtime-cleanup-failure", "runtime-invocation-failure"].includes(kind)
      return this.budget.terminal(() => this.publish(kind, value, preserveChargeLinks ? links : [], true))
    }
    return this.publish(kind, value, links, false, reserve)
  }
  private publish(kind: string, value: unknown, links: readonly LabRoot[], terminal: boolean, reserve: { bytes: number; records: number } = { bytes: 0, records: 0 }): LabRoot {
    let dependencies = [...new Set([...links, ...(this.latestRoot ? [this.latestRoot] : [])])].sort()
    while (dependencies.length > 128) { const groups: LabRoot[] = []; for (let i = 0; i < dependencies.length; i += 127) { const rows = dependencies.slice(i, i + 127); groups.push(this.publish("record-links", { count: rows.length }, rows, terminal)) }; dependencies = [...new Set(groups)].sort() }
    const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
    const carriesExecution = ["cell-result", "response-match-result", "response-match-execution-failure"].includes(kind)
    let streamArtifacts: readonly Uint8Array[] = []
    let bytes: Uint8Array
    if (admitted.ok) bytes = admitted.canonicalBytes
    else if (carriesExecution && ["MAX_NODES_EXCEEDED", "MAX_RAW_UTF8_BYTES_EXCEEDED"].includes(admitted.error.code) && value && typeof value === "object" && !Array.isArray(value) && "execution" in value) {
      const { execution, ...rest } = value as Record<string, any>
      const stream = prepareLeagueExecutionStream(execution as LabMatchExecution)
      streamArtifacts = stream.artifacts
      bytes = encode({ ...rest, execution: stream.reference })
    } else return fail("CANONICAL")
    const pending: Uint8Array[] = [...streamArtifacts]
    let tailRoot: LabRoot | null = null, ordinal = 0
    for (let offset = 0; offset < bytes.length; offset += 131072) { const chunk = bytes.subarray(offset, offset + 131072), chunkRoot = bytesRoot(chunk); pending.push(chunk); const node = encode({ schemaVersion: "league-record-chunk-v1", ordinal: ordinal++, previousRoot: tailRoot, bytesRoot: chunkRoot, byteLength: chunk.length }); pending.push(node); tailRoot = bytesRoot(node) }
    const descriptor = encode(rooted("league-record-v1", { kind, byteLength: bytes.length, recordRoot: bytesRoot(bytes), chunkCount: ordinal, tailRoot, links: dependencies })); pending.push(descriptor)
    const size = pending.reduce((sum, bytes) => sum + bytes.length, 0)
    if (this.budget) {
      const fresh = pending.filter((bytes) => { try { lstatSync(resolve(this.repository.directory, `league-artifact-${bytesRoot(bytes).slice(7)}.bin`)); return false } catch { return true } })
      this.budget.checkCapacity(fresh.reduce((sum, bytes) => sum + bytes.length, 0) + reserve.bytes, fresh.length + reserve.records, terminal)
    }
    else if (this.writtenBytes + size + reserve.bytes > this.limits.maxArtifactBytes || this.records + pending.length + reserve.records > this.limits.maxArtifactRecords) return fail("RETENTION_BUDGET")
    this.writtenBytes += size; this.records += pending.length
    for (const artifact of pending) publishLeagueArtifact(this.repository, artifact)
    this.latestRoot = bytesRoot(descriptor)
    return this.latestRoot
  }
}
export const readLeagueRecordGraph = (repository: LeagueRepository, head: LabRoot, limits: { maxArtifactBytes: number; maxArtifactRecords: number }) => {
  type Indexed = { kind: string; links: LabRoot[]; recordRoot: LabRoot; byteLength: number; chunks: LabRoot[] }
  const descriptors = new Map<LabRoot, Indexed>(), active = new Set<LabRoot>(), seenArtifacts = new Set<LabRoot>()
  const matchIndex = new Map<string, Map<LabRoot, Array<{ root: LabRoot; ordinal: number }>>>()
  let consumed = 0
  const read = (root: LabRoot) => { const bytes = readLeagueArtifact(repository, root); if (!seenArtifacts.has(root)) { seenArtifacts.add(root); consumed += bytes.length; if (consumed > limits.maxArtifactBytes || seenArtifacts.size > limits.maxArtifactRecords) return fail("GRAPH_READ_BUDGET") }; return bytes }
  const decode = (entry: Indexed, hydrate = true) => {
    const bytes = new Uint8Array(entry.byteLength); let offset = 0
    for (const chunkRoot of entry.chunks) { const chunk = read(chunkRoot); bytes.set(chunk, offset); offset += chunk.length }
    if (offset !== bytes.length || bytesRoot(bytes) !== entry.recordRoot) return fail("GRAPH_BYTES")
    const value = parse(bytes)
    if (value && typeof value === "object" && value.execution?.schemaVersion === "league-execution-ref-v2") {
      if (!["cell-result", "response-match-result", "response-match-execution-failure"].includes(entry.kind) || !isLeagueExecutionStreamReference(value.execution)) return fail("GRAPH_EXECUTION_REFERENCE")
      const execution = readLeagueExecutionStream(value.execution, read, limits)
      if (hydrate) return { ...value, execution }
    }
    return value
  }
  const pending: Array<{ root: LabRoot; completed?: Indexed }> = [{ root: head }]
  while (pending.length) {
    const { root, completed } = pending.pop()!
    if (completed) { descriptors.set(root, completed); active.delete(root); continue }
    if (descriptors.has(root)) continue
    if (active.has(root) || descriptors.size + active.size >= limits.maxArtifactRecords) return fail("GRAPH_CYCLE_OR_LIMIT")
    active.add(root)
    const descriptor = parse(read(root)), { root: domainRoot, ...body } = descriptor
    if (!same(Object.keys(descriptor).sort(), ["schemaVersion", "privacy", "root", "kind", "byteLength", "recordRoot", "chunkCount", "tailRoot", "links"].sort()) || descriptor.privacy !== "private_offline" || descriptor.schemaVersion !== "league-record-v1" || domainRoot !== labRoot("league-record-v1", body) || !Array.isArray(descriptor.links) || descriptor.links.length > 128 || !same(descriptor.links, [...new Set(descriptor.links)].sort()) || !Number.isSafeInteger(descriptor.byteLength) || descriptor.byteLength < 1 || descriptor.byteLength > limits.maxArtifactBytes || descriptor.chunkCount !== Math.ceil(descriptor.byteLength / 131072)) return fail("GRAPH_DESCRIPTOR")
    const chunks = Array<LabRoot>(descriptor.chunkCount); let tail = descriptor.tailRoot
    for (let ordinal = descriptor.chunkCount - 1; ordinal >= 0; ordinal--) { const node = parse(read(tail)); if (node.schemaVersion !== "league-record-chunk-v1" || node.ordinal !== ordinal || !same(Object.keys(node).sort(), ["schemaVersion", "ordinal", "previousRoot", "bytesRoot", "byteLength"].sort())) return fail("GRAPH_CHUNK"); const chunk = read(node.bytesRoot); if (chunk.length !== node.byteLength || chunk.length !== (ordinal === descriptor.chunkCount - 1 ? descriptor.byteLength - ordinal * 131072 : 131072)) return fail("GRAPH_CHUNK_SIZE"); chunks[ordinal] = node.bytesRoot; tail = node.previousRoot }
    if (tail !== null) return fail("GRAPH_BYTES")
    const indexed = { kind: descriptor.kind, links: descriptor.links, recordRoot: descriptor.recordRoot, byteLength: descriptor.byteLength, chunks }
    const value = decode(indexed, false) // Authenticate canonical bytes and any execution stream now, without retaining decoded payloads.
    if (indexed.kind === "response-match-start" || indexed.kind === "response-match-result") {
      const charge = indexed.kind === "response-match-start" ? value : value.matchCharge
      if (charge && typeof charge.parentStartRoot === "string" && Number.isSafeInteger(charge.ordinal)) {
        const group = matchIndex.get(indexed.kind) ?? new Map<LabRoot, Array<{ root: LabRoot; ordinal: number }>>(), matches = group.get(charge.parentStartRoot) ?? []
        matches.push({ root, ordinal: charge.ordinal }); group.set(charge.parentStartRoot, matches); matchIndex.set(indexed.kind, group)
      }
    }
    pending.push({ root, completed: indexed })
    for (const dependency of [...descriptor.links].reverse()) pending.push({ root: dependency })
  }
  const byKind = new Map<string, LabRoot[]>(), byLink = new Map<LabRoot, Map<string, LabRoot[]>>()
  for (const [root, entry] of descriptors) {
    const kinds = byKind.get(entry.kind) ?? []; kinds.push(root); byKind.set(entry.kind, kinds)
    for (const link of entry.links) { const group = byLink.get(link) ?? new Map<string, LabRoot[]>(), linked = group.get(entry.kind) ?? []; linked.push(root); group.set(entry.kind, linked); byLink.set(link, group) }
  }
  for (const groups of matchIndex.values()) for (const matches of groups.values()) matches.sort((left, right) => left.ordinal - right.ordinal || left.root.localeCompare(right.root))
  const get = (root: LabRoot) => { const entry = descriptors.get(root); return entry && { kind: entry.kind, links: entry.links, get value(): any { return decode(entry) } } }
  return {
    get, has: (root: LabRoot) => descriptors.has(root), get size() { return descriptors.size },
    *entries(): IterableIterator<[LabRoot, NonNullable<ReturnType<typeof get>>]> { for (const root of descriptors.keys()) yield [root, get(root)!] },
    *values(): IterableIterator<NonNullable<ReturnType<typeof get>>> { for (const root of descriptors.keys()) yield get(root)! },
    roots: (kind: string) => byKind.get(kind) ?? [],
    linked: (kind: string, root: LabRoot) => byLink.get(root)?.get(kind) ?? [],
    matches: (kind: "response-match-start" | "response-match-result", parentStartRoot: LabRoot) => matchIndex.get(kind)?.get(parentStartRoot) ?? [],
  }
}

/** Historical links are an unlabeled union of caller dependencies and the
 * publisher's latestRoot. Even authenticated record-links cannot prove which
 * grouped edge was explicit. Charge is established by the independent durable
 * journal plus exact, one-to-one start/result value joins, not link expansion.
 * This is retained consistency verification, not proof of live execution. */
export const verifyRetainedCellJournalBijection = (input: {
  reopened: ReopenedLeagueEvidence
  cellStarts: readonly (readonly [LabRoot, { readonly value: any }])[]
  cellResults: readonly (readonly [LabRoot, { readonly value: any }])[]
  allocationRoot: LabRoot
  executedCells: number
}) => {
  const { reopened, cellStarts, cellResults, allocationRoot, executedCells } = input
  const journals = new Map(reopened.records.map((row) => [row.start.root, row]))
  const startByRoot = new Map(cellStarts.map(([root, node]) => [node.value.start.root as LabRoot, [root, node] as const]))
  const resultByStartRoot = new Map(cellResults.map(([root, node]) => [node.value.start.root as LabRoot, [root, node] as const]))
  const cellByRoot = new Map(cellResults.map(([recordRoot, node]) => { const value = node.value; return [value.cell.root as LabRoot, { recordRoot, cell: value.cell as LeagueCell, startRoot: value.start.root as LabRoot, terminal: value.terminal as LeagueCellTerminal, seed: value.seed as string, bottomCandidateRoot: value.bottomCandidateRoot as LabRoot, topCandidateRoot: value.topCandidateRoot as LabRoot }] as const }))
  if (reopened.remnants.length || journals.size !== reopened.records.length || cellStarts.length !== reopened.records.length || startByRoot.size !== cellStarts.length || cellResults.length !== executedCells || resultByStartRoot.size !== cellResults.length || cellByRoot.size !== cellResults.length) return fail("RETAINED_JOURNAL_COVERAGE")
  for (const journal of reopened.records) {
    const start = startByRoot.get(journal.start.root)?.[1]?.value
    if (!start || !same(start.start, journal.start) || journal.start.allocationRoot !== allocationRoot || start.cell?.root !== journal.start.cellRoot || journal.terminal.cellRoot !== journal.start.cellRoot) return fail("RETAINED_CHARGE")
    const result = resultByStartRoot.get(journal.start.root)?.[1]?.value
    if (result && (result.start?.cellRoot !== result.cell?.root || !same(result.start, journal.start) || !same(start.cell, result.cell) || start.bottomCandidateRoot !== result.bottomCandidateRoot || start.topCandidateRoot !== result.topCandidateRoot || start.seed !== result.seed || !same(start.options, result.options))) return fail("RETAINED_CELL_JOURNAL")
  }
  for (const [, node] of cellResults) if (!journals.has(node.value.start.root)) return fail("RETAINED_CELL_JOURNAL")
  return { journals, startByRoot, resultByStartRoot, cellByRoot }
}

export interface LeagueCandidateInput extends LeaguePortfolioCandidate { readonly admission: LeagueCandidateAdmission; readonly closure: FactoryCandidateClosure; readonly publicationRoot: LabRoot }
/** Data-only selection has no execution/allocation authority. This lets the
 * same reader derive original evidence before the amendment/allocation DAG. */
export type LeagueInitialCandidateSelection = Pick<LeagueExecutionAllocation, "initialCandidatePublicationRoots" | "factoryAssessmentArtifactRoots"> & { readonly operations: Pick<LeagueExecutionAllocation["operations"], "maxArtifactBytes" | "maxArtifactRecords"> }
const indexFactory = (repository: FactoryRepository, allocation: LeagueInitialCandidateSelection) => {
  const byRoot = new Map<LabRoot, LabRoot>(); let bytes = 0, records = 0
  for (const name of readdirSync(repository.directory).sort()) {
    const match = /^factory-artifact-([a-f0-9]{64})\.bin$/u.exec(name); if (!match) continue
    const artifactRoot = `sha256:${match[1]}` as LabRoot, raw = readFactoryArtifact(repository, artifactRoot)
    if ((bytes += raw.length) > allocation.operations.maxArtifactBytes || ++records > allocation.operations.maxArtifactRecords) return fail("FACTORY_READ_BUDGET")
    const parsed = admitCanonicalJsonBytes(raw, { profile: "canonical-manifest", operation: "require-canonical" })
    if (parsed.ok && parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value) && "root" in parsed.value && typeof parsed.value.root === "string") byRoot.set(parsed.value.root as LabRoot, artifactRoot)
  }
  return byRoot
}
export const readLeagueInitialCandidates = (repository: FactoryRepository, allocation: LeagueInitialCandidateSelection): readonly LeagueCandidateInput[] => {
  const prospective = "schemaVersion" in allocation && allocation.schemaVersion === "league-prospective-execution-allocation-v1" ? admitLeagueExecutionAllocation(allocation) as ProspectiveLeagueExecutionAllocation : null
  const index = indexFactory(repository, allocation), ledger = readRetainedFactoryLedger(repository)
  const assessments = allocation.factoryAssessmentArtifactRoots.map((artifactRoot) => ({ artifactRoot, value: parse(readFactoryArtifact(repository, artifactRoot)), verified: verifyHistoricalFactoryAssessmentForLeague(repository, artifactRoot) }))
  if (prospective) {
    const expected = prospective.amendment.historicalAssessment, assessed = assessments[0]
    if (assessments.length !== 1 || !assessed || assessed.artifactRoot !== expected.artifactRoot || assessed.verified.issued !== false || assessed.verified.status !== "affirmed" || assessed.verified.assessmentRoot !== expected.assessmentRoot || assessed.verified.thresholdArtifactRoot !== expected.thresholdArtifactRoot || assessed.verified.historicalProducerImplementationRoot !== expected.producerImplementationRoot || assessed.verified.historicalAssessmentImplementationRoot !== expected.assessmentImplementationRoot) return fail("PROSPECTIVE_BASE_ASSESSMENT")
  }
  const candidates = allocation.initialCandidatePublicationRoots.map((publicationRoot) => {
    const publication = parse(readFactoryArtifact(repository, publicationRoot)), candidate = publication.candidate
    const assessment = assessments.filter((entry) => entry.value.input.candidateArtifactRoots.includes(publicationRoot) && entry.verified.status === "affirmed")
    if (assessment.length !== 1) return fail("CANDIDATE_ASSESSMENT")
    const subject = assessment[0]!, stored = subject.value.input.supervisionArtifactRoots.map((root: LabRoot) => ({ root, descriptor: parse(readFactoryArtifact(repository, root)) })).find((entry: any) => entry.descriptor.receiptRoot === candidate.supervisionReceiptRoot)
    if (!stored) return fail("CANDIDATE_SUPERVISION")
    const retained = readFactorySupervisionArtifactRecords(repository, stored.root, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords }), receipt = retained.records.find((entry) => entry.kind === "receipt")!.value as any
    const attempt = ledger.entries.find((entry) => entry.start.root === receipt.candidateIdentity.attemptRoot) ?? fail("CANDIDATE_CHARGE")
    const admission = importAssessedFactoryCandidate({ repository, publicationArtifactRoot: publicationRoot, supervisionArtifactRoot: stored.root, assessmentArtifactRoot: subject.artifactRoot, attemptStart: attempt.start, attemptTerminal: attempt.terminal, maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords, verifyRetainedAssessment: verifyHistoricalFactoryAssessmentForLeague })
    const packet = index.get(candidate.proposal.packetRoot), proposal = index.get(candidate.proposal.root), validation = index.get(candidate.validation.root)
    if (!packet || !proposal || !validation) return fail("CANDIDATE_CLOSURE")
    const closure = { factoryRepository: repository, candidatePublicationArtifactRoot: publicationRoot, sourceArtifactRoot: candidate.proposal.source.root, packetArtifactRoot: packet, proposalArtifactRoot: proposal, validationArtifactRoot: validation }
    readFactoryArtifact(repository, closure.sourceArtifactRoot)
    return { admission, candidateAdmission: admission, closure, publicationRoot, factoryRepository: repository, fingerprintArtifactRoot: publication.independenceReceipt.evidenceArtifactRoot, importedAssessment: { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords, verifyRetainedAssessment: verifyHistoricalFactoryAssessmentForLeague } }
  })
  if (prospective) validateProspectiveLeagueInitialCandidates(prospective, candidates)
  return candidates
}

/** Called only after the existing data-only assessment reader, never on labels
 * supplied as empirical evidence. Fixture seams cannot enter an empirical run. */
export const validateProspectiveLeagueInitialCandidates = (allocation: ProspectiveLeagueExecutionAllocation, candidates: readonly LeagueCandidateInput[]) => {
  const amendment = allocation.amendment, history = amendment.historicalAssessment
  if (candidates.length !== 3 || new Set(candidates.map((row) => row.publicationRoot)).size !== 3) return fail("PROSPECTIVE_BASE_COUNT")
  for (const base of amendment.bases) {
    const row = candidates.find((row) => row.publicationRoot === base.publicationArtifactRoot), evidence = row?.admission.importEvidence
    if (!row || !evidence || row.admission.schemaVersion !== "league-candidate-import-v1" || row.admission.root !== base.candidateAdmissionRoot || row.admission.candidate.proposal.source.root !== base.sourceRoot || !same(evidence, { sourcePhase: 264, publicationArtifactRoot: base.publicationArtifactRoot, supervisionArtifactRoot: base.supervisionArtifactRoot, assessmentArtifactRoot: history.artifactRoot, assessmentRoot: history.assessmentRoot, thresholdArtifactRoot: history.thresholdArtifactRoot, sourceSlot: base.sourceSlot, qualification: "base_distinct" })) return fail("PROSPECTIVE_BASE_IDENTITY")
  }
}
/** Final source identities are derived at preparation time, never stored in a
 * mutable global historical policy. Tests derive only ephemeral fixture roots. */
export const leagueCurrentSourceIdentity = () => {
  const manifest = factoryAssessmentImplementationManifest()
  return { implementationRoot: manifest.root, sourceRoot: labRoot("league-reviewed-source-bytes-v1", manifest.entries) }
}
export const prepareProspectiveSeriousLeague = (input: unknown, options: { factoryRepository: FactoryRepository; fixture?: { readCandidates: (repository: FactoryRepository, allocation: ProspectiveLeagueExecutionAllocation) => readonly LeagueCandidateInput[] } }) => {
  const allocation = createProspectiveLeagueExecutionAllocation(input as never), source = leagueCurrentSourceIdentity()
  if (allocation.implementationRoot !== source.implementationRoot || allocation.amendment.sourceRoot !== source.sourceRoot) return fail("STALE_IMPLEMENTATION")
  if (options.fixture && allocation.evidenceClass !== "injected_fixture") return fail("PROSPECTIVE_FIXTURE_AUTHORITY")
  validateProspectiveLeagueInitialCandidates(allocation, (options.fixture?.readCandidates ?? readLeagueInitialCandidates)(options.factoryRepository, allocation))
  return allocation
}

/** Darwin's immediately free pages are not its reclaimable available memory.
 * The strict C-locale memorystatus reader is the previously reviewed host
 * metric; only its conservative byte estimate is used here, not its separate
 * Phase 262 percentage admission threshold. */
export const leagueEffectiveAvailableMemoryBytes = (result: Readonly<MemoryPressureQCommandResult>): number => {
  const parsed = parseMemoryPressureQ(result)
  if (!parsed.ok) return fail("CAPACITY_MEMORY_MEASUREMENT")
  const bytes = Math.floor(parsed.observation.totalBytes * parsed.observation.percentage / 100)
  if (!Number.isSafeInteger(bytes) || bytes < 0) return fail("CAPACITY_MEMORY_MEASUREMENT")
  return bytes
}
export const observeLeagueAvailableMemoryBytes = (execute: typeof spawnSync = spawnSync) => {
  const request = MEMORY_PRESSURE_Q_REQUEST
  const result = execute(request.executable, [...request.args], { env: { ...request.env }, stdio: ["ignore", "pipe", "pipe"], timeout: request.timeoutMilliseconds, killSignal: "SIGKILL", maxBuffer: request.maximumOutputBytes, shell: request.shell })
  try {
    if (result.error || !(result.stdout instanceof Uint8Array) || !(result.stderr instanceof Uint8Array)) return fail("CAPACITY_MEMORY_MEASUREMENT")
    return leagueEffectiveAvailableMemoryBytes({ stdout: result.stdout, stderr: result.stderr, exitCode: result.status, signal: result.signal, timedOut: false })
  } finally {
    if (result.stdout instanceof Uint8Array) result.stdout.fill(0)
    if (result.stderr instanceof Uint8Array) result.stderr.fill(0)
  }
}
const capacityHostObservation = (allocation: ProspectiveLeagueExecutionAllocation) => {
  const directories = [allocation.outputDirectories.league, allocation.outputDirectories.responseFactory!]
  const stats = directories.map((directory) => ({ device: String(lstatSync(directory).dev), fs: statfsSync(directory, { bigint: true }) }))
  if (stats[0]!.device !== stats[1]!.device) return fail("CAPACITY_FILESYSTEM_SPLIT")
  const free = stats.map(({ fs }) => fs.bavail * fs.bsize).reduce((a, b) => a < b ? a : b)
  if (free > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY_FILESYSTEM_RANGE")
  return { nowMilliseconds: Date.now(), filesystemDevice: stats[0]!.device, freeFilesystemBytes: Number(free), availableMemoryBytes: observeLeagueAvailableMemoryBytes() }
}
export const preflightProspectiveSeriousLeague = (input: { allocation: unknown; capacity: unknown; factoryRepository: FactoryRepository; fixture?: LeagueFixtureSeams }) => {
  const allocation = admitLeagueExecutionAllocation(input.allocation)
  if (allocation.schemaVersion !== "league-prospective-execution-allocation-v1") return fail("CAPACITY_AUTHORITY")
  const request: LeagueRunInput = { allocation, allocationRoot: allocation.root, capacityInput: input.capacity, factoryRepository: input.factoryRepository, repository: createLeagueRepository(allocation.outputDirectories.league), responseFactoryRepository: createFactoryRepository(allocation.outputDirectories.responseFactory!), ...(input.fixture ? { fixture: input.fixture } : {}) }
  prepareLeagueRunInputs(request)
  return measureProspectiveCapacity(request, allocation).receipt
}
const observeProspectiveCapacity = (input: LeagueRunInput, allocation: ProspectiveLeagueExecutionAllocation) => input.fixture?.observeCapacity?.() ?? input.fixture?.capacityContext ?? capacityHostObservation(allocation)
/** Called only after complete static verification in this same process. Never
 * refresh a supplied receipt or accept its old host values as new observations. */
const measureProspectiveCapacity = (input: LeagueRunInput, allocation: ProspectiveLeagueExecutionAllocation) => {
  const plan = admitLeagueCapacityPlanInput(input.capacityInput, allocation), observation = { ...leagueCurrentSourceIdentity(), ...observeProspectiveCapacity(input, allocation) }
  const receipt = createLeagueCapacityReceipt({ ...plan, measuredAtMilliseconds: observation.nowMilliseconds, expiresAtMilliseconds: observation.nowMilliseconds + allocation.amendment.policy.capacity.maximumReceiptAgeMilliseconds, filesystemDevice: observation.filesystemDevice, freeFilesystemBytes: observation.freeFilesystemBytes, availableMemoryBytes: observation.availableMemoryBytes }, allocation)
  return { receipt: admitLeagueCapacityReceipt(receipt, allocation, observation), observation }
}
const prospectiveRunCapacity = (input: LeagueRunInput, allocation: ProspectiveLeagueExecutionAllocation) => {
  if (input.fixture && allocation.evidenceClass !== "injected_fixture" || !input.fixture && allocation.evidenceClass !== "empirical") return fail("PROSPECTIVE_FIXTURE_AUTHORITY")
  // Validate absence, shape, root and freshness before opening host paths. The
  // receipt is downstream of allocation, and can never be an amendment field.
  const receipt = input.capacityReceipt as LeagueCapacityReceipt | undefined
  if (!receipt) return fail("CAPACITY_RECEIPT_REQUIRED")
  const source = leagueCurrentSourceIdentity()
  const declared = { ...source, nowMilliseconds: input.fixture?.capacityContext?.nowMilliseconds ?? Date.now(), filesystemDevice: receipt.filesystemDevice, freeFilesystemBytes: receipt.freeFilesystemBytes, availableMemoryBytes: receipt.availableMemoryBytes }
  admitLeagueCapacityReceipt(receipt, allocation, declared)
  const observation = { ...source, ...observeProspectiveCapacity(input, allocation) }
  return { receipt: admitLeagueCapacityReceipt(receipt, allocation, observation), observation }
}

export const prepareSeriousLeague = (input: unknown) => {
  const allocation = createLeagueExecutionAllocation(input as never)
  if (allocation.implementationRoot !== factoryAssessmentImplementationRoot()) return fail("STALE_IMPLEMENTATION")
  return allocation
}
export interface LeagueFixtureSeams { readonly candidates: readonly LeagueCandidateInput[]; readonly readCandidates?: () => readonly LeagueCandidateInput[]; readonly host: FactorySupervisedRuntimeHost; readonly run: typeof runCanonicalLabMatch; readonly produce?: typeof produceLeagueResponse; readonly beforeReportPublication?: (seed: string, budget: LeagueRetentionBudget) => void; readonly capacityContext?: LeagueCapacityContext; readonly observeCapacity?: () => LeagueCapacityContext }
export interface LeagueRunInput { readonly allocation: unknown; readonly allocationRoot: LabRoot; readonly repository: LeagueRepository; readonly factoryRepository: FactoryRepository; readonly responseFactoryRepository: FactoryRepository | null; readonly fixture?: LeagueFixtureSeams; readonly capacityReceipt?: unknown; readonly capacityInput?: unknown }
type MatchInput = Parameters<typeof runCanonicalLabMatch>[0]["match"]
const normalizedGameplay = (execution: LabMatchExecution): unknown => {
  if (execution.kind !== "completed") return fail("PROCESS_INVALID")
  const scrub = (value: unknown, parent = ""): unknown => Array.isArray(value) ? value.map((item) => scrub(item, parent)) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:memory|objective|private|matchId|revision|arenaId|arenaName)/iu.test(key) && !(parent === "arenaVariant" && ["id", "name"].includes(key))).map(([key, item]) => [key, scrub(item, key)])) : value
  return scrub({ state: execution.result.state, events: execution.result.events })
}
const oversized = (code: string) => ["MAX_NODES_EXCEEDED", "MAX_RAW_UTF8_BYTES_EXCEEDED"].includes(code)
export const normalizedGameplayRoot = (execution: LabMatchExecution): LabRoot => {
  const value = normalizedGameplay(execution) as { state: unknown; events: readonly unknown[] }
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (admitted.ok) return bytesRoot(admitted.canonicalBytes)
  if (!oversized(admitted.error.code)) return fail("GAMEPLAY_CANONICAL")
  return labRoot("league-normalized-gameplay-v2", { stateRoot: labRoot("league-normalized-state-v2", value.state), events: deriveFactoryOrderedRecordDescriptor("league-normalized-event-v2", value.events) })
}
export const sameLargeExecution = (left: LabMatchExecution, right: LabMatchExecution): boolean => {
  const a = admitCanonicalJsonValue(left, { profile: "canonical-manifest" }), b = admitCanonicalJsonValue(right, { profile: "canonical-manifest" })
  if (a.ok && b.ok) return bytesRoot(a.canonicalBytes) === bytesRoot(b.canonicalBytes)
  if ((!a.ok && !oversized(a.error.code)) || (!b.ok && !oversized(b.error.code))) return false
  return left.kind === right.kind && left.privacy === right.privacy && same(deriveFactoryExecutionCommitment(left), deriveFactoryExecutionCommitment(right))
}
/** Data-only diagnostic for an already-retained execution. The caller must
 * supply a fresh empty league repository; this never runs a Match or provider. */
export const diagnoseLeagueExecutionStorage = (repository: LeagueRepository, execution: LabMatchExecution, limits: { maxArtifactBytes: number; maxArtifactRecords: number }) => {
  if (readdirSync(repository.directory).length) return fail("DIAGNOSTIC_NONEMPTY_REPOSITORY")
  const graph = new LeagueRecordGraph(repository, limits), headRoot = graph.append("cell-result", { execution })
  const reopened = readLeagueRecordGraph(repository, headRoot, limits).get(headRoot)?.value.execution as LabMatchExecution | undefined
  if (!reopened || !sameLargeExecution(execution, reopened)) return fail("DIAGNOSTIC_ROUND_TRIP")
  const names = readdirSync(repository.directory).filter((name) => /^league-artifact-[a-f0-9]{64}\.bin$/u.test(name))
  const storedBytes = names.reduce((sum, name) => sum + lstatSync(resolve(repository.directory, name)).size, 0)
  const inputJsonBytes = Buffer.byteLength(JSON.stringify(execution), "utf8")
  return { headRoot, inputJsonBytes, storedBytes, overheadBytes: storedBytes - inputJsonBytes, artifactRecords: names.length }
}
export const sameLargeResult = (left: { state: unknown; events: readonly unknown[] }, right: { state: unknown; events: readonly unknown[] }): boolean => {
  const a = admitCanonicalJsonValue(left, { profile: "canonical-manifest" }), b = admitCanonicalJsonValue(right, { profile: "canonical-manifest" })
  if (a.ok && b.ok) return bytesRoot(a.canonicalBytes) === bytesRoot(b.canonicalBytes)
  if ((!a.ok && !oversized(a.error.code)) || (!b.ok && !oversized(b.error.code))) return false
  return same(left.state, right.state) && same(deriveFactoryOrderedRecordDescriptor("league-result-compare-v2", left.events), deriveFactoryOrderedRecordDescriptor("league-result-compare-v2", right.events))
}
const conditionFor = (cell: LeagueCell, seed: string) => {
  const scenario = createSetScenarioV137({ arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion, arenaSemanticGeometryHash: cell.semanticGeometryHash, entrantA: { entrantKey: cell.entrantCandidateRoot, playerId: leaguePlayerId(cell.entrantCandidateRoot) }, entrantB: { entrantKey: cell.opponentCandidateRoot, playerId: leaguePlayerId(cell.opponentCandidateRoot) }, baseSeed: seed })
  return scenario.conditions.find((condition) => labRoot("league-condition-v1", { scenarioId: scenario.scenarioId, conditionId: condition.conditionId, requestIdentity: condition.requestIdentity, ordinal: condition.ordinal }) === cell.conditionRoot) ?? fail("CONDITION")
}
export class LeagueConnectedSession {
  readonly graph: LeagueRecordGraph
  executedCells = 0
  readonly startTime = Date.now()
  responseMatchCharges = 0
  constructor(readonly input: LeagueRunInput, readonly allocation: LeagueExecutionAllocation, readonly budget?: LeagueRetentionBudget) {
    if (allocation.schemaVersion === "league-prospective-execution-allocation-v1") prospectiveRunCapacity(input, allocation)
    this.graph = new LeagueRecordGraph(input.repository, allocation.operations, budget)
  }
  async execute(cell: LeagueCell, bottom: LeagueCandidateInput, top: LeagueCandidateInput, seed: string, options: { baseCell?: LeagueCell; order?: "forward" | "reverse"; transform?: LeagueProbeFamily; arenaAlias?: boolean } = {}) {
    this.budget?.beforeDispatch()
    if (this.executedCells + this.responseMatchCharges >= this.allocation.opportunities.matches || Date.now() - this.startTime >= this.allocation.operations.wallClockMilliseconds) return fail("EXECUTION_BUDGET")
    const startValue = { cellRoot: cell.root, allocationRoot: this.allocation.root }, start = { ...startValue, root: labRoot("league-cell-start-v1", startValue) }
    const startRecordValue = { start, cell, bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root, seed, options }
    if (this.budget) {
      // Check the journal pair AND its graph publication before making a
      // durable charge. Chunk envelopes/descriptor retain the existing cap.
      const graphBytes = encode(startRecordValue).length, chunks = Math.ceil(graphBytes / 131072)
      this.budget.checkCapacity(encode(start).length + graphBytes + (chunks + 2) * 262144, 2 * chunks + 3)
    }
    recordLeagueCellStart(this.input.repository, start)
    const startRecord = this.graph.append("cell-start", startRecordValue)
    const runtimeRecords: LabRoot[] = [], opened: FactorySupervisionProvider[] = []
    const condition = conditionFor(options.baseCell ?? cell, seed), arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.semanticGeometryHash === cell.semanticGeometryHash && arena.status === "active") ?? fail("ARENA")
    const matchBase = { matchId: `league-${start.root.slice(7, 31)}`, seed: condition.baseSeed, arenaVariant: options.arenaAlias ? { ...arena, id: `alias-${arena.id}`, name: `alias-${arena.name}` } : arena, bottomPlayerId: leaguePlayerId(bottom.admission.candidate.root), topPlayerId: leaguePlayerId(top.admission.candidate.root), initialInitiativePlayerId: condition.initialInitiativePlayerId }
    let actual: LabMatchExecution | null = null
    let recordRoot: LabRoot | null = null
    const publishedResultRoot = (): LabRoot | null => recordRoot
    try {
      const host: FactorySupervisedRuntimeHost = { createFactorySupervisedRuntime: (request) => {
        const { executableRoot: _executableRoot, ...runtimeInput } = request
        const provider = this.input.fixture ? this.input.fixture.host.createFactorySupervisedRuntime(request) : createFactorySupervisedRuntime({ ...runtimeInput, matchId: matchBase.matchId, containerName: `league-${start.root.slice(7, 25)}-${opened.length}`, ownershipLabel: `league-${this.allocation.root.slice(7, 25)}`, image: this.allocation.operations.image, invocationLimit: this.allocation.operations.perProviderInvocations, factoryLifetimeMs: this.allocation.operations.perMatchMilliseconds })
        opened.push(provider)
        const wrapped = wrapLeagueProbeProvider(provider, options.transform, arena.initialBounds, (value) => { runtimeRecords.push(this.graph.append("runtime-invocation", value, [startRecord])) }, (request) => this.graph.beforeInvocation(request))
        return {
          ...wrapped,
          invoke: async (request, identity) => {
            try { return await wrapped.invoke(request, identity) }
            catch (error) {
              runtimeRecords.push(this.graph.append("runtime-invocation-failure", { identity: provider.identity, request, ...retainedSupervisorFailureDiagnostic(error) }, [startRecord]))
              throw error
            }
          },
          close: () => { const closed = wrapped.close(); runtimeRecords.push(this.graph.append("runtime-cleanup", { identity: provider.identity, closed }, [startRecord])); return closed },
        }
      } }
      const issue = (candidate: LeagueCandidateInput) => issueLeagueProviderFromFactoryCandidate({ ...candidate.closure, host, cell, start, allocationRoot: this.allocation.root })
      const [issuedBottom, issuedTop] = options.order === "reverse" ? (() => { const t = issue(top), b = issue(bottom); return [b, t] as const })() : [issue(bottom), issue(top)] as const
      const match: MatchInput = { ...matchBase, bottomStrategyRevisionId: issuedBottom.identity.revisionId, topStrategyRevisionId: issuedTop.identity.revisionId }
      const retainResult = (execution: LabMatchExecution, terminal: LeagueCellTerminal) => { recordRoot = this.graph.append("cell-result", { start, cell, match, terminal, execution, bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root, seed, options }, [startRecord, ...runtimeRecords], { bytes: 262144, records: 1 }); this.executedCells++ }
      const terminal = await runLeagueCell({ repository: this.input.repository, start, cell, bottom: issuedBottom, top: issuedTop, requestRoot: cell.requestRoot, match, runCanonicalLabMatch: async (request) => { actual = await (this.input.fixture?.run ?? runCanonicalLabMatch)(request); return actual }, beforeTerminal: retainResult })
      if (!actual) return fail("MISSING_EXECUTION")
      const completedRecordRoot = publishedResultRoot() ?? fail("MISSING_RESULT_RECORD")
      if (terminal.disposition !== "success") return fail("PROCESS_INVALID")
      return { cell, startRoot: start.root, terminal, recordRoot: completedRecordRoot, ...(options.baseCell ? { canonicalBytes: normalizedGameplayRoot(actual) } : {}), bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root }
    } catch (error) {
      for (const provider of opened) { try { runtimeRecords.push(this.graph.append("runtime-cleanup", { identity: provider.identity, closed: provider.close() }, [startRecord])) } catch (error) { runtimeRecords.push(this.graph.append("runtime-cleanup-failure", { identity: provider.identity, error: error instanceof Error ? error.name : "unknown" }, [startRecord])) } }
      const attachedRoot = publishedResultRoot()
      const evidenceRoot = this.graph.append("cell-issuance-failure", { start, cell, failure: error instanceof Error ? error.name : "unknown" }, [startRecord, ...(this.budget?.exhausted ? [] : runtimeRecords), ...(attachedRoot ? [attachedRoot] : [])])
      const existing = reopenLeagueEvidence(this.input.repository, { maxBytes: this.allocation.operations.maxArtifactBytes, maxRecords: this.allocation.operations.maxArtifactRecords }).records.find((entry) => entry.start.root === start.root)
      if (existing?.terminalProvenance === "derived_unterminated_start") publishLeagueCellTerminal(this.input.repository, start, createLeagueCellTerminal({ cellRoot: cell.root, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot, projection: null }))
      throw error
    }
  }
  async matrix(candidates: readonly LeagueCandidateInput[], seed: string) {
    const population = createLeaguePopulation({ candidateAdmissionRoots: candidates.map((entry) => entry.admission.root).sort(), studyPolicyRoot: this.allocation.studyPolicyRoot, measurementPolicyRoot: this.allocation.measurementPolicyRoot }), matrix = enumerateLeagueCells({ population, candidateAdmissions: candidates.map((entry) => entry.admission), tupleRoot: this.allocation.tupleRoot, runtimeRoot: this.allocation.runtimeRoot, baseSeed: seed }), byRoot = new Map(candidates.map((entry) => [entry.admission.candidate.root, entry])), results = []
    for (const entry of matrix.cells) results.push(await this.execute(entry.cell, byRoot.get(entry.bottomCandidateRoot)!, byRoot.get(entry.topCandidateRoot)!, seed))
    const admitted = admitCompletePayoffSnapshot(matrix, results.map((result) => result.terminal))
    if (admitted.kind !== "complete") return fail("MATRIX_INCOMPLETE")
    const solver = solveLeagueSnapshot({ snapshot: admitted.snapshot, solverPayoffBytes: admitted.solverPayoffTransport })
    if (solver.status !== "solved") return fail("SOLVER")
    const solverPayoffArtifactRoot = publishLeagueComposedArtifact(this.input.repository, admitted.solverPayoffBytes)
    const recordRoot = this.graph.append("complete-matrix", { schemaVersion: "league-retained-matrix-v2", population, matrix: { ...matrix, cells: results.map((result) => result.recordRoot) }, snapshot: admitted.snapshot, solverPayoffArtifactRoot, solver: { ...solver, canonicalBytes: new TextDecoder().decode(solver.canonicalBytes) } }, results.map((result) => result.recordRoot))
    return { population, matrix, admitted, solver, results, recordRoot, seed }
  }
}
type CompleteMatrix = Awaited<ReturnType<LeagueConnectedSession["matrix"]>>
const scoreAgainst = (matrix: CompleteMatrix, candidateRoot: LabRoot, opponentRoot: LabRoot): { numerator: number; denominator: number } => {
  if (candidateRoot === opponentRoot) return { numerator: 1, denominator: 2 }
  const rows = matrix.results.filter((entry) => [entry.bottomCandidateRoot, entry.topCandidateRoot].includes(candidateRoot) && [entry.bottomCandidateRoot, entry.topCandidateRoot].includes(opponentRoot))
  if (rows.length !== 8) return fail("SCORE_COVERAGE")
  return { numerator: rows.reduce((sum, row) => sum + (row.cell.entrantCandidateRoot === candidateRoot ? row.terminal.projection!.halfPoints : 2 - row.terminal.projection!.halfPoints), 0), denominator: rows.length * 2 }
}
const runRoundProbes = async (session: LeagueConnectedSession, matrix: CompleteMatrix, candidates: readonly LeagueCandidateInput[], round: DeclaredLeagueRound, seed: string, initial: RedTeamLedger) => {
  let ledger = initial
  const byRoot = new Map(candidates.map((candidate) => [candidate.admission.candidate.root, candidate])), roots: LabRoot[] = []
  for (const candidate of candidates) for (const policy of session.allocation.probes) {
    const available = matrix.matrix.cells.filter((entry) => entry.bottomCandidateRoot === candidate.admission.candidate.root || entry.topCandidateRoot === candidate.admission.candidate.root), pairs = []
    for (let pair = 0; pair < policy.pairs; pair++) {
      const leftBase = available[pair % available.length]!, leftCondition = conditionFor(leftBase.cell, seed)
      const rightBase = ["side", "initiative"].includes(policy.family) ? available.find((entry) => { const condition = conditionFor(entry.cell, seed); return entry.cell.pairRoot === leftBase.cell.pairRoot && entry.cell.semanticGeometryHash === leftBase.cell.semanticGeometryHash && (policy.family === "side" ? condition.bottomEntrantKey !== leftCondition.bottomEntrantKey && condition.initialInitiativeEntrantKey === leftCondition.initialInitiativeEntrantKey : condition.bottomEntrantKey === leftCondition.bottomEntrantKey && condition.initialInitiativeEntrantKey !== leftCondition.initialInitiativeEntrantKey) })! : leftBase
      if (!rightBase) return fail("PROBE_CONDITION")
      const observations = []
      for (const [arm, base] of [["left", leftBase], ["right", rightBase]] as const) {
        const identity = { roundRoot: round.round.root, candidateRoot: candidate.admission.candidate.root, family: policy.family, pair, arm, baseConditionRoot: base.cell.conditionRoot }, cell = createLeagueCell({ ...base.cell, conditionRoot: labRoot("league-probe-condition-v1", identity), requestRoot: labRoot("league-probe-request-v1", identity) })
        const result = await session.execute(cell, byRoot.get(base.bottomCandidateRoot)!, byRoot.get(base.topCandidateRoot)!, seed, { baseCell: base.cell, order: arm === "right" && ["source_order", "worker_shard_completion"].includes(policy.family) ? "reverse" : "forward", ...(arm === "right" && ["horizontal_symmetry", "opaque_ids", "soldier_order"].includes(policy.family) ? { transform: policy.family } : {}), arenaAlias: arm === "right" && policy.family === "semantic_arena_identity" })
        roots.push(result.recordRoot)
        if (["source_order", "worker_shard_completion"].includes(policy.family)) {
          const reversed = arm === "right", completionOrder = reversed ? [...matrix.results].reverse() : matrix.results, replay = admitCompletePayoffSnapshot(matrix.matrix, completionOrder.map((row) => row.terminal))
          if (replay.kind !== "complete" || !same(replay.snapshot, matrix.admitted.snapshot) || !same(Array.from(replay.solverPayoffBytes), Array.from(matrix.admitted.solverPayoffBytes))) return fail("LAYOUT_MATRIX_IDENTITY")
          const solved = solveLeagueSnapshot({ snapshot: replay.snapshot, solverPayoffBytes: replay.solverPayoffTransport, workerCount: reversed ? 3 : 1, shardOrder: reversed ? [2, 0, 1] : [0], restart: reversed ? 1 : 0 })
          if (solved.status !== "solved" || !same(solved.output, matrix.solver.output) || !same(Array.from(solved.canonicalBytes), Array.from(matrix.solver.canonicalBytes))) return fail("LAYOUT_SOLVER_IDENTITY")
          roots.push(session.graph.append("layout-verification", { roundRoot: round.round.root, family: policy.family, arm, cellResultRoot: result.recordRoot, matrixRoot: matrix.recordRoot, completionOrder: completionOrder.map((row) => row.terminal.root), snapshotRoot: replay.snapshot.root, payoffBytesRoot: bytesRoot(replay.solverPayoffBytes), solverBytesRoot: bytesRoot(solved.canonicalBytes), workerCount: reversed ? 3 : 1, shardOrder: reversed ? [2, 0, 1] : [0], restart: reversed ? 1 : 0 }, [result.recordRoot, matrix.recordRoot]))
        }
        const halfPoints = (result.cell.entrantCandidateRoot === candidate.admission.candidate.root ? result.terminal.projection!.halfPoints : 2 - result.terminal.projection!.halfPoints) as 0 | 1 | 2
        observations.push({ canonicalBytes: result.canonicalBytes ?? fail("PROBE_DIGEST"), halfPoints, conditionRoot: ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(policy.family) ? leftBase.cell.conditionRoot : cell.conditionRoot, evidenceRoot: result.recordRoot })
      }
      pairs.push({ left: observations[0]!, right: observations[1]! })
    }
    ledger = recordLeagueProbe({ ledger, family: policy.family, roundRoot: round.round.root, candidateRoot: candidate.admission.candidate.root, pairs })
    roots.push(session.graph.append("probe-ledger", ledger, roots.slice(-policy.pairs * 2)))
  }
  return { ledger, roots }
}

const candidateRecord = (candidate: LeagueCandidateInput) => ({ admission: candidate.admission, publicationRoot: candidate.publicationRoot, fingerprintArtifactRoot: candidate.fingerprintArtifactRoot, factoryDirectory: candidate.factoryRepository.directory, closure: { ...candidate.closure, factoryRepository: candidate.closure.factoryRepository.directory } })
const candidateContent = (record: ReturnType<typeof candidateRecord>) => {
  const { factoryDirectory, closure: { factoryRepository, ...closure }, ...content } = record
  if (typeof factoryDirectory !== "string" || factoryDirectory !== factoryRepository) return fail("CANDIDATE_DIRECTORY_PROVENANCE")
  return { ...content, closure }
}
const targetSources = (repository: FactoryRepository, candidates: readonly LeagueCandidateInput[]) => candidates.map((candidate) => {
  const bytes = readCandidateClosure(candidate.closure).sourceBytes, sourceArtifactRoot = publishFactoryArtifact(repository, bytes)
  return { candidateRoot: candidate.admission.candidate.root, sourceArtifactRoot, byteLength: bytes.length, disclosedFile: `candidate-${sourceArtifactRoot.slice(7)}.ts` }
})
const zeroUsage = (): RedTeamResources => ({ matches: 0, modelTokens: 0, effortMilliseconds: 0, reviewMilliseconds: 0, searchNodes: 0, teacherNodes: 0, distillationUnits: 0 })
const runReservation = (allocation: LeagueExecutionAllocation) => rooted("league-prospective-allocation-reservation-v1", { allocationRoot: allocation.root })
const runMarker = (allocation: LeagueExecutionAllocation, capacityReceipt?: LeagueCapacityReceipt) => allocation.schemaVersion === "league-prospective-execution-allocation-v1" ? rooted("league-prospective-allocation-start-v1", { allocation, reservationRoot: bytesRoot(encode(runReservation(allocation))), capacityReceiptRoot: capacityReceipt?.root ?? fail("CAPACITY_RECEIPT_REQUIRED") }) : rooted("league-allocation-start-v1", { allocation })
const reserveRun = (repository: LeagueRepository, allocation: LeagueExecutionAllocation, capacityReceipt?: LeagueCapacityReceipt) => {
  const markerBytes = encode(runMarker(allocation, capacityReceipt))
  const bytes = allocation.schemaVersion === "league-prospective-execution-allocation-v1" ? encode(runReservation(allocation)) : markerBytes, artifactRoot = bytesRoot(bytes)
  repository.beforePublication?.({ target: resolve(repository.directory, `league-artifact-${artifactRoot.slice(7)}.bin`), byteLength: bytes.length, terminal: false })
  // The prospective exclusive key depends on allocation alone, never the
  // refreshable receipt. Its authenticated run marker separately binds both.
  // Legacy V1 retains its original marker bytes and exclusive filename.
  // A crash or a partial marker never creates permission to rerun it.
  const descriptor = openSync(resolve(repository.directory, `league-artifact-${artifactRoot.slice(7)}.bin`), "wx", 0o600)
  try { let offset = 0; while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset, bytes.length - offset); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  repository.durability.syncDirectory(repository.directory)
  return allocation.schemaVersion === "league-prospective-execution-allocation-v1" ? publishLeagueArtifact(repository, markerBytes) : artifactRoot
}
const addFractions = (rows: readonly { numerator: number; denominator: number; weightNumerator: string; weightDenominator: string }[]) => {
  let numerator = 0n, denominator = 1n
  const gcd = (a: bigint, b: bigint): bigint => b === 0n ? a : gcd(b, a % b)
  for (const row of rows) { const n = BigInt(row.numerator) * BigInt(row.weightNumerator), d = BigInt(row.denominator) * BigInt(row.weightDenominator); numerator = numerator * d + n * denominator; denominator *= d; const g = gcd(numerator, denominator); numerator /= g; denominator /= g }
  if (numerator > BigInt(Number.MAX_SAFE_INTEGER) || denominator > BigInt(Number.MAX_SAFE_INTEGER)) return fail("SCORE_RANGE")
  return { numerator: Number(numerator), denominator: Number(denominator) }
}
type RoundBlock = { seed: string; matrix: CompleteMatrix; round: DeclaredLeagueRound; candidateRoots: LabRoot[] }
const responseScores = (produced: Awaited<ReturnType<typeof produceLeagueResponse>>, block: RoundBlock) => {
  const score = (candidateRoot: LabRoot) => produced.scores.find((row) => row.seed === block.seed && row.opponentRoot === candidateRoot) ?? fail("RESPONSE_SCORE_COVERAGE")
  const mixture = addFractions(block.matrix.solver.weights.map((weight) => ({ ...score(weight.candidateRoot), weightNumerator: weight.numerator, weightDenominator: weight.denominator })))
  const rows = [{ targetRoot: block.round.target.mixtureRoot, ...mixture }, { targetRoot: block.round.target.strongestPureCandidateRoot, ...score(block.round.target.strongestPureCandidateRoot) }, { targetRoot: block.round.target.vulnerablePureCandidateRoot, ...score(block.round.target.vulnerablePureCandidateRoot) }]
  return [...new Map(rows.map((row) => [row.targetRoot, { targetRoot: row.targetRoot, numerator: row.numerator, denominator: row.denominator, evidenceRoot: produced.recordRoot }])).values()]
}
const responseIterations = (blocks: readonly RoundBlock[], ledger: RedTeamLedger, production: readonly Awaited<ReturnType<typeof produceLeagueResponse>>[], allocation: LeagueExecutionAllocation): LeagueLinkedResponseIteration[] => {
  const accepted = production.filter((row) => row.evaluationRole === "development_response" && ledger.terminals.some((terminal) => terminal.startRoot === row.author.startRoot && terminal.disposition === "success" && terminal.candidateAdmissionRoot === row.admission.root))
  return accepted.flatMap((produced) => {
    const start = ledger.starts.find((start) => start.root === produced.author.startRoot) ?? fail("ITERATION_START")
    const primary = blocks.find((block) => block.round.round.root === start.roundRoot) ?? fail("ITERATION_ROUND")
    const ordinal = primary.round.roundOrdinal, schedule = allocation.rounds[ordinal]!
    const job = schedule.jobs.find((job) => job.producerRequestArtifactRoot === start.inputRoot && job.participantId === start.participantId) ?? fail("ITERATION_JOB")
    const selected = blocks.filter((block) => block.round.roundOrdinal === ordinal)
    const following = blocks.filter((block) => block.round.roundOrdinal === ordinal + 1)
    if (following.length !== allocation.seedBlocks.length) return [] // no closed continuation, never invented proof
    const terminal = ledger.terminals.find((terminal) => terminal.startRoot === start.root)!
    const roundAccepted = accepted.filter((row) => ledger.starts.find((start) => start.root === row.author.startRoot)?.roundRoot === primary.round.round.root)
    const conditions = enumerateLeagueResponseConditions(allocation, primary.candidateRoots).filter((row) => row.purpose === "score")
    const measurements = selected.map((block) => {
      const next = following.find((entry) => entry.seed === block.seed) ?? fail("ITERATION_NEXT_SEED")
      const targetCandidateAdmissionRoots = block.matrix.population.candidateAdmissionRoots
      const expectedNext = [...targetCandidateAdmissionRoots, ...roundAccepted.map((row) => row.admission.root)].sort()
      if (block.candidateRoots.includes(produced.admission.candidate.root) || !same(expectedNext, next.matrix.population.candidateAdmissionRoots)) return fail("ITERATION_POPULATION_EVOLUTION")
      const scoreRows = produced.scores.filter((row) => row.seed === block.seed)
      const conditionRows = conditions.filter((row) => row.seed === block.seed)
      if (!same(scoreRows.map((row) => row.opponentRoot), block.candidateRoots) || scoreRows.some((row) => row.evidenceRoots.length !== 8) || conditionRows.length !== scoreRows.length * 8) return fail("ITERATION_MEASUREMENT_COVERAGE")
      const mixtureScore = responseScores(produced, block)[0]!
      return {
        seed: block.seed, roundRoot: block.round.round.root, targetRoot: block.round.target.root,
        snapshotRoot: block.matrix.admitted.snapshot.root, nextSnapshotRoot: next.matrix.admitted.snapshot.root,
        targetCandidateAdmissionRoots, nextCandidateAdmissionRoots: next.matrix.population.candidateAdmissionRoots,
        conditionRoots: conditionRows.map((condition) => labRoot("league-response-measurement-condition-v1", { parentStartRoot: produced.admission.attemptStart.root, condition })),
        terminalRoots: scoreRows.flatMap((row) => row.evidenceRoots),
        numerator: mixtureScore.numerator, denominator: mixtureScore.denominator,
      }
    })
    const assessment = { targetRoot: primary.round.target.root, fingerprintEvidenceRoot: produced.fingerprintArtifactRoot, independentCounterfactualRelations: produced.comparisons.map((row) => row.relation === "unresolved" ? "borderline" : row.relation), existingCandidateRoots: primary.candidateRoots, completeTargetScores: responseScores(produced, primary) }
    const reentry = reenterAcceptedCounter({ ledger, startRoot: start.root, round: primary.round, candidateAdmission: produced.admission, assessment })
    return [{ candidateAdmissionRoot: produced.admission.root, ordinal, allocationRoot: allocation.root, jobId: job.id, startRoot: start.root, productionRoot: produced.recordRoot, reentryRoot: reentry.root, blocks: measurements, responseTerminals: [{ root: terminal.root, disposition: terminal.disposition, processValidity: terminal.processValidity }] }]
  })
}
const selectionFor = (matrix: CompleteMatrix, candidates: readonly LeagueCandidateInput[], blocks: readonly RoundBlock[], ledger: RedTeamLedger, production: readonly Awaited<ReturnType<typeof produceLeagueResponse>>[], allocation: LeagueExecutionAllocation) => {
  const mixture = createLeagueMixture({ snapshotRoot: matrix.admitted.snapshot.root, solverOutputRoot: matrix.solver.output.root, weightRoot: matrix.solver.output.distributionRoot }), portfolio = deriveLeaguePortfolio({ snapshotRoot: matrix.admitted.snapshot.root, mixture, candidates })
  const byCandidate = new Map(candidates.map((candidate) => [candidate.admission.candidate.root, candidate])), byAdmission = new Map(candidates.map((candidate) => [candidate.admission.root, candidate]))
  const independentScores = (role: "validation_opponent" | "independent_probe_opponent") => production.filter((attempt) => attempt.evaluationRole === role && attempt.comparisons.length === candidates.length && attempt.comparisons.every((row) => row.relation === "distinct")).flatMap((attempt) => attempt.scores.map((score) => ({ candidateAdmissionRoot: byCandidate.get(score.opponentRoot)!.admission.root, conditionRoot: labRoot("league-independent-score-condition-v1", { role, seed: score.seed, opponentAdmissionRoot: attempt.admission.root }), numerator: score.denominator - score.numerator, denominator: score.denominator, evidenceRoot: attempt.recordRoot })))
  const responseRows = independentScores("validation_opponent"), probeRows = independentScores("independent_probe_opponent")
  const redTeamRows = production.filter((attempt) => attempt.evaluationRole === "development_response").flatMap((attempt) => attempt.scores.map((score) => ({ candidateAdmissionRoot: byCandidate.get(score.opponentRoot)!.admission.root, conditionRoot: labRoot("league-red-team-score-condition-v1", { seed: score.seed, responseRoot: attempt.admission.root }), numerator: score.numerator, denominator: score.denominator, evidenceRoot: attempt.recordRoot })))
  const invarianceRows = ledger.probes.filter((probe) => !["semantic_arena_identity", "worker_shard_completion"].includes(probe.family)).map((probe) => ({ candidateAdmissionRoot: byCandidate.get(probe.candidateRoot)!.admission.root, probe: probe.family === "horizontal_symmetry" ? "symmetry" : probe.family === "repeat_restart" ? "repeat" : probe.family, observations: probe.pairs.length, mismatches: probe.passed ? 0 : 1, evidenceRoot: probe.root }))
  const terminalRows = candidates.flatMap((candidate) => ["legality", "privacy", "runtime"].map((boundary) => ({ candidateAdmissionRoot: candidate.admission.root, boundary, disposition: "success", processValidity: "process_valid", evidenceRoot: matrix.recordRoot })))
  const worstCases = portfolio.portfolio.candidateAdmissionRoots.flatMap((candidate) => portfolio.portfolio.candidateAdmissionRoots.map((opponent) => ({ candidateAdmissionRoot: candidate, opponentAdmissionRoot: opponent, ...scoreAgainst(matrix, byAdmission.get(candidate)!.admission.candidate.root, byAdmission.get(opponent)!.admission.candidate.root), evidenceRoot: matrix.recordRoot })))
  const iterations = responseIterations(blocks, ledger, production, allocation)
  const evidence = rooted("league-selection-evidence-v5", { snapshotRoot: matrix.admitted.snapshot.root, populationRoot: matrix.population.root, policyRoot: LAB_ADMITTED_ROOTS.measurementPolicyRoot, solverOutputRoot: matrix.solver.output.root, allocationRoot: allocation.root, seedBlocks: allocation.seedBlocks, iterations, responseRows, probeRows, redTeamRows, invarianceRows, terminalRows, worstCases })
  const dispositions = portfolio.portfolio.candidateAdmissionRoots.map((candidateAdmissionRoot) => selectRobustPure({ snapshotRoot: matrix.admitted.snapshot.root, populationRoot: matrix.population.root, mixture, portfolio: portfolio.portfolio, candidateAdmissionRoot, evidence, population: matrix.population, populationCandidates: candidates }))
  return { mixture, portfolio, evidence, dispositions, finalist: dispositions.find((row) => row.kind === "robust_pure_finalist") ?? dispositions[0]! }
}
const reportProjection = (matrix: CompleteMatrix, candidates: readonly LeagueCandidateInput[], blocks: readonly RoundBlock[], ledger: RedTeamLedger, closed: ReturnType<typeof closeRedTeamLedger>, reentries: readonly LeagueResponseRow[], selection: ReturnType<typeof selectionFor>, allocation: LeagueExecutionAllocation) => ({
  population: { root: matrix.population.root, candidates: candidates.map((candidate) => candidate.admission.root), evidenceClass: allocation.evidenceClass }, conditions: matrix.matrix.cells.map((row) => row.cell.conditionRoot), semanticArenas: [...new Set(matrix.matrix.cells.map((row) => row.cell.semanticGeometryHash))], oracleFamilies: [...new Set(candidates.map((candidate) => candidate.admission.candidate.proposal.oracleFamily))], policyRoots: [allocation.studyPolicyRoot, allocation.measurementPolicyRoot], tupleRoot: allocation.tupleRoot, runtimeRoot: allocation.runtimeRoot, allocationLedger: closed.capacity, iterationCurves: blocks.map((block) => ({ round: block.round.roundOrdinal, population: block.candidateRoots.length, snapshot: block.matrix.admitted.snapshot.root })), payoffMatrix: [matrix.recordRoot], distributions: matrix.solver.weights, bestResponseGraph: reentries.map((row) => ({ round: row.roundRoot, candidate: row.candidateAdmissionRoot, disposition: row.disposition })), pureWorstCases: selection.evidence.worstCases, responseGaps: selection.evidence.responseRows, attempts: ledger.terminals.map((terminal) => ({ root: terminal.root, disposition: terminal.disposition, charge: terminal.charge })),
})

/** Static authority stays local to this call. No candidate/verification cache
 * is serialized or accepted by the empirical command-line path. */
const prepareLeagueRunInputs = (input: LeagueRunInput) => {
  const allocation = admitLeagueExecutionAllocation(input.allocation)
  if (allocation.root !== input.allocationRoot || allocation.implementationRoot !== factoryAssessmentImplementationRoot() || input.fixture && allocation.evidenceClass !== "injected_fixture" || !input.fixture && allocation.evidenceClass !== "empirical") return fail("RUN_AUTHORITY")
  if (allocation.schemaVersion === "league-prospective-execution-allocation-v1") {
    if (input.capacityInput !== undefined && input.capacityReceipt !== undefined) return fail("CAPACITY_INPUT_EXCLUSIVE")
    if (allocation.amendment.sourceRoot !== leagueCurrentSourceIdentity().sourceRoot) return fail("STALE_IMPLEMENTATION")
    if (input.capacityInput !== undefined) admitLeagueCapacityPlanInput(input.capacityInput, allocation)
    else prospectiveRunCapacity(input, allocation)
  }
  if (allocation.outputDirectories.league !== input.repository.directory || allocation.outputDirectories.responseFactory !== (input.responseFactoryRepository?.directory ?? null)) return fail("OUTPUT_BINDING")
  assertLeaguePayoffCapacity(allocation.operations.maxPopulation, allocation.operations.maxArtifactBytes)
  const candidates = [...(input.fixture?.readCandidates?.() ?? input.fixture?.candidates ?? readLeagueInitialCandidates(input.factoryRepository, allocation))]
  if (allocation.schemaVersion === "league-prospective-execution-allocation-v1") validateProspectiveLeagueInitialCandidates(allocation, candidates)
  if (!same(candidates.map((candidate) => candidate.publicationRoot).sort(), allocation.initialCandidatePublicationRoots) || new Set(candidates.map((candidate) => candidate.admission.candidate.root)).size !== candidates.length) return fail("INITIAL_POPULATION")
  for (const candidate of candidates) { LeagueCandidateAdmissionSchema.parse(candidate.admission); if (readCandidateClosure(candidate.closure).candidate.root !== candidate.admission.candidate.root) return fail("INITIAL_CLOSURE") }
  const jobs = allocation.rounds.flatMap((round) => round.jobs)
  if (jobs.length && (!input.responseFactoryRepository || input.responseFactoryRepository.directory === input.factoryRepository.directory || candidates.some((candidate) => candidate.factoryRepository.directory === input.responseFactoryRepository!.directory))) return fail("SEPARATE_RESPONSE_REPOSITORY")
  for (const job of jobs) { preflightLeagueAuthoring({ allocation, jobId: job.id, repository: input.responseFactoryRepository! }); if (job.operation === "produce" && job.reservation.matches < allocation.seedBlocks.length * allocation.operations.maxPopulation * 24) return fail("RESPONSE_MATCH_COVERAGE") }
  if (reopenLeagueEvidence(input.repository, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords }).records.length) return fail("NONEMPTY_RUN_REPOSITORY")
  return { allocation, candidates, jobs }
}
/** Complete source composition. The only execution seams are explicitly marked
 * injected fixtures; the command-line path never accepts a runtime provider. */
export const runSeriousLeague = async (input: LeagueRunInput) => {
  const prepared = prepareLeagueRunInputs(input), { allocation, jobs } = prepared
  let candidates = prepared.candidates
  const capacity = allocation.schemaVersion === "league-prospective-execution-allocation-v1" ? input.capacityInput !== undefined ? measureProspectiveCapacity(input, allocation) : prospectiveRunCapacity(input, allocation) : undefined
  const capacityGuard = allocation.schemaVersion === "league-prospective-execution-allocation-v1" && capacity ? () => {
    const current = observeProspectiveCapacity(input, allocation)
    if (current.filesystemDevice !== capacity.receipt.filesystemDevice || current.freeFilesystemBytes < allocation.operations.terminalReserveBytes + allocation.amendment.policy.capacity.freeFilesystemMarginBytes || current.availableMemoryBytes < Math.max(capacity.receipt.processHeadroomBytes, LEAGUE_MINIMUM_PROCESS_HEADROOM_BYTES)) return fail("CAPACITY_DISPATCH_STOP")
  } : undefined
  capacityGuard?.()
  const budget = new LeagueRetentionBudget(allocation, capacityGuard)
  input = { ...input, ...(capacity ? { capacityInput: undefined, capacityReceipt: capacity.receipt } : {}), repository: { ...input.repository, beforePublication: budget.beforePublication }, responseFactoryRepository: input.responseFactoryRepository ? { ...input.responseFactoryRepository, beforePublication: budget.beforePublication } : null }
  const session = new LeagueConnectedSession(input, allocation, budget)
  const markerRoot = reserveRun(input.repository, allocation, capacity?.receipt), roots: LabRoot[] = [], blocks: RoundBlock[] = [], reentries: LeagueResponseRow[] = [], production: Array<Awaited<ReturnType<typeof produceLeagueResponse>>> = [], requiredTargets: Array<{ roundRoot: LabRoot; candidateRoot: LabRoot }> = []
  roots.push(session.graph.append("run-start", { allocation, markerRoot, candidates: candidates.map(candidateRecord), factoryDirectory: input.factoryRepository.directory, responseFactoryDirectory: input.responseFactoryRepository?.directory ?? null, ...(capacity ? { capacityReceipt: capacity.receipt, capacityAtStart: capacity.observation } : {}) }))
  let ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  const startsByJob = new Map<string, LabRoot>(), completedJobs: string[] = []
  let currentMatrices: CompleteMatrix[] = [], terminalAdvance: ReturnType<typeof advanceLeagueRound> | null = null
  try {
    const initial: CompleteMatrix[] = []
    for (const seed of allocation.seedBlocks) { const matrix = await session.matrix(candidates, seed); initial.push(matrix); roots.push(matrix.recordRoot) }
    currentMatrices = initial
    for (const schedule of allocation.rounds) {
      const roundBlocks = currentMatrices.map((matrix, i) => ({ seed: allocation.seedBlocks[i]!, matrix, round: declareLeagueRound({ snapshot: matrix.admitted.snapshot, solver: matrix.solver, responseAllocationRoot: labRoot("league-round-allocation-v1", { allocationRoot: allocation.root, ordinal: schedule.ordinal, seed: allocation.seedBlocks[i] }), roundOrdinal: schedule.ordinal, maximumRounds: allocation.rounds.length, closureRule: "bounded-no-accepted-counter-v1" }), candidateRoots: candidates.map((candidate) => candidate.admission.candidate.root) }))
      const primary = roundBlocks[0]!, accepted: LeagueCandidateInput[] = [], roundReentries: LeagueResponseRow[] = []
      for (const block of roundBlocks) { blocks.push(block); roots.push(session.graph.append("declared-round", { seed: block.seed, round: block.round, candidateRoots: block.candidateRoots }, [block.matrix.recordRoot])); const probe = await runRoundProbes(session, block.matrix, candidates, block.round, block.seed, ledger); ledger = probe.ledger; roots.push(...probe.roots); requiredTargets.push(...candidates.map((candidate) => ({ roundRoot: block.round.round.root, candidateRoot: candidate.admission.candidate.root }))) }
      for (const job of schedule.jobs.filter((job) => job.evaluationRole === "development_response")) {
        const repository = input.responseFactoryRepository!, before = Date.now()
        session.graph.beforeDispatch()
        ledger = startRedTeamAttempt({ ledger, channel: job.channel, roundRoot: primary.round.round.root, candidateRoot: primary.round.target.strongestPureCandidateRoot, participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: job.retryParentJobId === null ? null : startsByJob.get(job.retryParentJobId) ?? fail("RETRY_PARENT"), reservation: job.reservation })
        const start = ledger.starts.at(-1)!, startArtifactRoot = publishFactoryArtifact(repository, encode(start)); startsByJob.set(job.id, start.root)
        roots.push(session.graph.append("red-team-start", { jobId: job.id, start, startArtifactRoot, ledgerRoot: ledger.root }))
        if (job.operation !== "produce") { const evidenceRoot = session.graph.append("red-team-unfilled", { jobId: job.id, operation: job.operation, reason: "prospectively_allocated_disposition" }); roots.push(evidenceRoot); ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: job.operation, usage: zeroUsage(), evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }) }
        else {
          const imported = candidates.find((candidate) => candidate.admission.importEvidence) ?? fail("NUMERIC_MEASUREMENT_REQUIRED"), threshold = { repository: imported.factoryRepository, artifactRoot: imported.admission.importEvidence!.thresholdArtifactRoot }
          session.responseMatchCharges += job.reservation.matches
          let produced: Awaited<ReturnType<typeof produceLeagueResponse>>
          try {
            let tacticalAdaptation: { allocationArtifactRoot: LabRoot; matrixRecordRoot: LabRoot; corpusArtifactRoot: LabRoot } | undefined
            if (isProspectiveTacticalJob(allocation, job)) {
              const built = buildLeagueTacticalCorpus({ roundRoot: start.roundRoot, strongestPureCandidateRoot: primary.round.target.strongestPureCandidateRoot, vulnerablePureCandidateRoot: primary.round.target.vulnerablePureCandidateRoot, weights: primary.matrix.solver.weights, cellResultRoots: primary.matrix.results.map((row) => row.recordRoot), readCell: (root) => readTacticalLeagueRecord(input.repository, root, allocation.operations) })
              const corpusArtifactRoot = publishFactoryArtifact(repository, encode(built.corpus))
              tacticalAdaptation = { allocationArtifactRoot: publishFactoryArtifact(repository, encode(allocation)), matrixRecordRoot: primary.matrix.recordRoot, corpusArtifactRoot }
              roots.push(session.graph.append("tactical-adaptation-corpus", { jobId: job.id, roundRoot: start.roundRoot, corpusArtifactRoot, corpusRoot: built.corpus.root, matrixRecordRoot: primary.matrix.recordRoot }, [primary.matrix.recordRoot, ...built.corpus.observations.map((row) => row.cellResultRoot)]))
            }
            const targetArtifactRoot = publishFactoryArtifact(repository, encode({ roundRoot: start.roundRoot, candidateRoot: start.candidateRoot, targets: roundBlocks.map((block) => ({ seed: block.seed, target: block.round.target, weights: block.matrix.solver.weights })), candidates: targetSources(repository, candidates), ...(tacticalAdaptation ? { tacticalAdaptation } : {}) }))
            produced = await (input.fixture?.produce ?? produceLeagueResponse)({ allocation, job, start, startArtifactRoot, repository, targetArtifactRoot, remainingWallMilliseconds: allocation.operations.wallClockMilliseconds - (Date.now() - session.startTime), opponents: candidates.map((candidate) => ({ candidateRoot: candidate.admission.candidate.root, closure: candidate.closure })), threshold, retention: session.graph })
          }
          catch (error) {
            const evidenceRoot = session.graph.append("red-team-process-failure", { jobId: job.id, startRoot: start.root }); roots.push(evidenceRoot)
            ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null })
            roots.push(session.graph.append("red-team-terminal", { jobId: job.id, terminal: ledger.terminals.at(-1), ledgerRoot: ledger.root }, [evidenceRoot]))
            throw error
          }
          roots.push(produced.recordRoot); production.push(produced)
          const duplicate = [...candidates, ...accepted].some((candidate) => candidate.admission.candidate.proposal.source.root === produced.admission.candidate.proposal.source.root), independent = produced.comparisons.length === candidates.length && produced.comparisons.every((row) => row.relation === "distinct"), scores = roundBlocks.map((block) => responseScores(produced, block)), positive = scores.every((rows) => rows.every((score) => BigInt(score.numerator) * 100n > BigInt(score.denominator) * 55n)), eligible = !duplicate && independent && positive && accepted.length < schedule.acceptedSlots
          const assessment = { targetRoot: primary.round.target.root, fingerprintEvidenceRoot: produced.fingerprintArtifactRoot, independentCounterfactualRelations: produced.comparisons.map((row) => row.relation === "unresolved" ? "borderline" : row.relation), existingCandidateRoots: candidates.map((candidate) => candidate.admission.candidate.root), completeTargetScores: scores[0]! }
          const assessmentRoot = session.graph.append("red-team-assessment", { jobId: job.id, startRoot: start.root, producedRoot: produced.recordRoot, scores, duplicate, independent, positive, eligible, assessment }, [produced.recordRoot]); roots.push(assessmentRoot)
          const usage = { ...zeroUsage(), matches: produced.matchCount, modelTokens: produced.author.modelTokens ?? 0, effortMilliseconds: Math.max(0, Date.now() - before), reviewMilliseconds: job.reservation.reviewMilliseconds, searchNodes: job.reservation.searchNodes, teacherNodes: job.reservation.teacherNodes, distillationUnits: job.reservation.distillationUnits }
          ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: eligible ? "success" : duplicate ? "duplicate" : "legal_but_weak", usage, evidenceRoots: [assessmentRoot, produced.recordRoot], candidateAdmissionRoot: eligible ? produced.admission.root : null })
          if (eligible) { const reentry = reenterAcceptedCounter({ ledger, startRoot: start.root, round: primary.round, candidateAdmission: produced.admission, assessment }); reentries.push(reentry); roundReentries.push(reentry); accepted.push(produced); roots.push(session.graph.append("counter-reentry", { reentry, assessment, startRoot: start.root, candidateAdmission: produced.admission, round: primary.round }, [assessmentRoot])) }
        }
        completedJobs.push(job.id); roots.push(session.graph.append("red-team-terminal", { jobId: job.id, terminal: ledger.terminals.at(-1), ledgerRoot: ledger.root }))
      }
      if (accepted.length) {
        candidates = [...candidates, ...accepted]; currentMatrices = []
        for (const seed of allocation.seedBlocks) { const fresh = await session.matrix(candidates, seed); currentMatrices.push(fresh); roots.push(fresh.recordRoot) }
        const advanced = advanceLeagueRound({ round: primary.round, admissions: roundReentries, requestClosure: false, nextPopulationRoot: currentMatrices[0]!.population.root, nextSnapshot: currentMatrices[0]!.admitted.snapshot }); terminalAdvance = advanced; roots.push(session.graph.append("round-advance", { round: primary.round, admissions: roundReentries, requestClosure: false, nextPopulationRoot: currentMatrices[0]!.population.root, nextSnapshot: currentMatrices[0]!.admitted.snapshot, advanced }))
      } else { const advanced = advanceLeagueRound({ round: primary.round, admissions: [], requestClosure: schedule.ordinal === allocation.rounds.length - 1 }); terminalAdvance = advanced; roots.push(session.graph.append("round-advance", { round: primary.round, admissions: [], requestClosure: schedule.ordinal === allocation.rounds.length - 1, advanced })) }
    }
    if (terminalAdvance?.kind !== "closed") {
      if (terminalAdvance?.kind !== "fresh_snapshot_required") return fail("ROUND_CLOSURE")
    const value = { allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_valid" as const, result: "response_round_budget_exhausted" as const, closure: "not_closed" as const, closureRoot: roots.at(-1)!, candidates: candidates.map(candidateRecord), matrixRoots: currentMatrices.map((matrix) => matrix.recordRoot), completedJobs, undispatchedJobIds: jobs.filter((job) => !completedJobs.includes(job.id)).map((job) => job.id), ledgerRoot: ledger.root, executedCells: session.executedCells, reservedResponseMatches: ledger.starts.reduce((sum, start) => sum + start.reservation.matches, 0) }
      const headRoot = session.graph.append("run-budget-exhausted", value, roots)
      return { ...value, headRoot, empiricalRequirementsComplete: false }
    }
    // These independently frozen packets are authored without any development
    // target, trace, mixture or probe feedback. Only the coordinator measures
    // them against the now-final population, after all adaptation has ended.
    for (const job of jobs.filter((job) => job.evaluationRole !== "development_response")) {
      const repository = input.responseFactoryRepository!, before = Date.now(), roundRoot = labRoot("league-independent-evaluation-v1", { allocationRoot: allocation.root, role: job.evaluationRole, snapshotRoots: currentMatrices.map((matrix) => matrix.admitted.snapshot.root) })
      session.graph.beforeDispatch()
      ledger = startRedTeamAttempt({ ledger, channel: job.channel, roundRoot, candidateRoot: candidates[0]!.admission.candidate.root, participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: job.retryParentJobId === null ? null : startsByJob.get(job.retryParentJobId) ?? fail("RETRY_PARENT"), reservation: job.reservation })
      const start = ledger.starts.at(-1)!, startArtifactRoot = publishFactoryArtifact(repository, encode(start)); startsByJob.set(job.id, start.root); roots.push(session.graph.append("red-team-start", { jobId: job.id, start, startArtifactRoot, ledgerRoot: ledger.root }))
      if (job.operation !== "produce") { const evidenceRoot = session.graph.append("red-team-unfilled", { jobId: job.id, operation: job.operation, reason: "prospectively_allocated_disposition" }); roots.push(evidenceRoot); ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: job.operation, usage: zeroUsage(), evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }) }
      else {
        const targetArtifactRoot = publishFactoryArtifact(repository, encode({ roundRoot: start.roundRoot, candidateRoot: start.candidateRoot, candidates: targetSources(repository, candidates) })), imported = candidates.find((candidate) => candidate.admission.importEvidence) ?? fail("NUMERIC_MEASUREMENT_REQUIRED")
        session.responseMatchCharges += job.reservation.matches
        try {
          const produced = await (input.fixture?.produce ?? produceLeagueResponse)({ allocation, job, start, startArtifactRoot, repository, targetArtifactRoot, remainingWallMilliseconds: allocation.operations.wallClockMilliseconds - (Date.now() - session.startTime), opponents: candidates.map((candidate) => ({ candidateRoot: candidate.admission.candidate.root, closure: candidate.closure })), threshold: { repository: imported.factoryRepository, artifactRoot: imported.admission.importEvidence!.thresholdArtifactRoot }, retention: session.graph })
          production.push(produced); roots.push(produced.recordRoot)
          const evidenceRoot = session.graph.append("independent-evaluation", { jobId: job.id, startRoot: start.root, evaluationRole: job.evaluationRole, producedRoot: produced.recordRoot, matrixRoots: currentMatrices.map((matrix) => matrix.recordRoot), authoredFromFrozenPacketOnly: true }, [produced.recordRoot, ...currentMatrices.map((matrix) => matrix.recordRoot)]); roots.push(evidenceRoot)
          ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "accepted", usage: { ...zeroUsage(), matches: produced.matchCount, modelTokens: produced.author.modelTokens ?? 0, effortMilliseconds: Math.max(0, Date.now() - before), reviewMilliseconds: job.reservation.reviewMilliseconds, searchNodes: job.reservation.searchNodes, teacherNodes: job.reservation.teacherNodes, distillationUnits: job.reservation.distillationUnits }, evidenceRoots: [produced.recordRoot, evidenceRoot], candidateAdmissionRoot: null })
        } catch (error) {
          const evidenceRoot = session.graph.append("red-team-process-failure", { jobId: job.id, startRoot: start.root }); roots.push(evidenceRoot)
          ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null })
          roots.push(session.graph.append("red-team-terminal", { jobId: job.id, terminal: ledger.terminals.at(-1), ledgerRoot: ledger.root }, [evidenceRoot]))
          throw error
        }
      }
      completedJobs.push(job.id); roots.push(session.graph.append("red-team-terminal", { jobId: job.id, terminal: ledger.terminals.at(-1), ledgerRoot: ledger.root }))
    }
    if (completedJobs.length !== jobs.length) return fail("JOB_COVERAGE")
    const closed = closeRedTeamLedger({ ledger, requiredTargets, reentries }), ledgerRoot = session.graph.append("red-team-close", { ledger, closed, requiredTargets, reentries }, roots); roots.push(ledgerRoot)
    if (closed.processValidity !== "process_valid") return fail("PROBE_PROCESS_INVALID")
    const reports = []
    for (const matrix of currentMatrices) {
      const selection = selectionFor(matrix, candidates, blocks, ledger, production, allocation), selectionRoot = session.graph.append("selection", { ...selection, candidates: candidates.map(candidateRecord) }, [matrix.recordRoot, ledgerRoot]); roots.push(selectionRoot)
      const all = reopenLeagueEvidence(input.repository, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords }), cellRoots = new Set(matrix.matrix.cells.map((row) => row.cell.root)), reopened = { ...all, records: all.records.filter((row) => cellRoots.has(row.start.cellRoot)) }
      const projection = reportProjection(matrix, candidates, blocks, ledger, closed, reentries, selection, allocation)
      input.fixture?.beforeReportPublication?.(matrix.seed, budget)
      const report = publishLeagueReport({ repository: input.repository, snapshot: matrix.admitted.snapshot, solverManifest: matrix.solver.manifest, solver: matrix.solver.output, mixture: selection.mixture, portfolio: selection.portfolio.portfolio, redTeamRoot: closed.root, finalistDisposition: selection.finalist, reopen: reopened, projection }); reports.push(report); roots.push(session.graph.append("report", { report, matrixRoot: matrix.recordRoot, selectionRoot, projection }, [matrix.recordRoot, selectionRoot, ledgerRoot]))
    }
    const value = { evidenceClass: allocation.evidenceClass, allocationRoot: allocation.root, completedJobs, processValidity: "process_valid", result: reports.length ? "bounded_league_complete" : "process_failure", candidates: candidates.map(candidateRecord), matrixRoots: currentMatrices.map((matrix) => matrix.recordRoot), reports, ledgerRoot, executedCells: session.executedCells, reservedResponseMatches: ledger.starts.reduce((sum, start) => sum + start.reservation.matches, 0) }
    const headRoot = session.graph.append("run-complete", value, roots)
    return { ...value, headRoot, empiricalRequirementsComplete: false }
  } catch (error) {
    for (const start of ledger.starts.filter((start) => !ledger.terminals.some((terminal) => terminal.startRoot === start.root))) {
      const evidenceRoot = session.graph.append("red-team-process-failure", { startRoot: start.root, error: error instanceof Error ? error.message : "unknown" }); roots.push(evidenceRoot)
      ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }); roots.push(session.graph.append("red-team-terminal", { startRoot: start.root, terminal: ledger.terminals.at(-1), ledgerRoot: ledger.root }, [evidenceRoot]))
    }
    const headRoot = session.graph.append("run-failure", { allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_invalid", completedJobs, ledgerRoot: ledger.root, matrixRoots: currentMatrices.map((matrix) => matrix.recordRoot), error: error instanceof Error ? error.message.slice(0, 512) : "unknown", executedCells: session.executedCells, reservedResponseMatches: ledger.starts.reduce((sum, start) => sum + start.reservation.matches, 0), retentionUsage: budget.usage })
    return { headRoot, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_invalid" as const, empiricalRequirementsComplete: false }
  }
}

/** Replay retained responses through the pure canonical kernel. This performs
 * no Strategy invocation, creates no runtime capability and writes no files. */
const replayRetainedKernel = (match: MatchInput, execution: LabMatchExecution, empirical: boolean, context: { invocationFailures: readonly any[]; cleanupIncomplete: boolean } = { invocationFailures: [], cleanupIncomplete: false }) => {
  if (!["completed", "failure"].includes(execution.kind) || "maxPhases" in match || execution.privacy !== "private_offline" || !Array.isArray(execution.accounting) || !Array.isArray(execution.transitions)) return fail("RETAINED_EXECUTION")
  let machine = MATCH_KERNEL.createMachineV119(match)
  if (machine.initialState.soldiers.length !== 16) return fail("CANONICAL_START")
  if (!empirical && execution.kind === "completed" && execution.accounting.every((entry) => entry.result.ok)) return
  if (execution.transitions.length > 1010000 || execution.kind === "failure" && (execution.transitions.length || !same(execution.unchangedState, machine.initialState) || execution.failure.classification !== "system_failure")) return fail("RETAINED_FAILURE_STATE")
  let invocation = 0, completed = false, failureCode: string | null = null, transitionCount = 0
  const transitions = [], consumed = new Set<LabRoot>(), ordinals = new Map<string, number>()
  for (let ordinal = 0; ordinal < 1010000; ordinal++) {
    let next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (next.kind === "effect") {
      const request = next.request, evidence = execution.accounting[invocation]
      if (!evidence) {
        if (execution.kind !== "failure" || context.invocationFailures.length !== 1 || !same(context.invocationFailures[0].request, request)) return fail("RETAINED_INVOCATION")
        failureCode = "LAB_SUPERVISOR_FAILURE"; break
      }
      invocation++
      const identity = labRoot("retained-runtime-identity", evidence.identity), expectedOrdinal = ordinals.get(identity) ?? 0
      if (evidence.requestId !== request.requestId || evidence.method !== request.kind || evidence.inputRoot !== labRoot("runtime-input", request.input) || !evidence.completed || !evidence.charged || evidence.ordinal !== expectedOrdinal || !Number.isSafeInteger(evidence.outputBytes) || evidence.outputBytes < 0 || evidence.outputBytes > 262144 || consumed.has(evidence.invocationRoot)) return fail("RETAINED_INVOCATION")
      consumed.add(evidence.invocationRoot); ordinals.set(identity, expectedOrdinal + 1)
      const base = { kind: "runtime_resume" as const, requestId: request.requestId, effectKind: request.kind }, result = evidence.result
      next = MATCH_KERNEL.stepMatch(next.machine, result.ok ? { ...base, classification: "success", value: result.value } : "systemFailure" in result ? { ...base, classification: "system_failure", failure: result.systemFailure } : { ...base, classification: "player_violation", violation: result.violation })
    }
    if (next.kind === "failure") { failureCode = next.failure.code; break }
    if (next.kind === "effect") return fail("RETAINED_TRANSITION")
    if (execution.kind === "completed" && !same(next.record, execution.transitions[ordinal])) return fail("RETAINED_TRANSITION")
    transitions.push(next.record); transitionCount++; machine = next.machine
    if (next.kind === "completed") { completed = true; break }
  }
  if (invocation !== execution.accounting.length) return fail("RETAINED_TRAILING_INVOCATIONS")
  if (execution.kind === "failure") {
    const expected = context.cleanupIncomplete ? "LAB_CLEANUP_INCOMPLETE" : failureCode ?? (!completed && transitionCount === 1010000 ? "LAB_KERNEL_STEP_BOUND" : null)
    if (expected === null || execution.failure.code !== expected) return fail("RETAINED_FAILURE_CAUSE")
  } else {
    if (!completed || context.cleanupIncomplete || context.invocationFailures.length || transitionCount !== execution.transitions.length || !sameLargeResult({ state: machine.state, events: transitions.flatMap((transition) => transition.events) }, execution.result)) return fail("RETAINED_COMPLETION")
  }
}

/** Failed production retains a charged prefix, not a pretend complete payoff. */
const verifyRetainedProductionFailures = (repository: FactoryRepository | null, allocation: LeagueExecutionAllocation, graph: ReturnType<typeof readLeagueRecordGraph>, ledger: RedTeamLedger, blocks: readonly RoundBlock[], candidates: readonly LeagueCandidateInput[]) => {
  const nodes = [...graph.entries()], rows = (kind: string) => graph.roots(kind).map((root) => [root, graph.get(root)!] as const)
  const starts = rows("response-production-start"), failures = rows("response-production-failure")
  if (!repository && starts.length) return fail("RETAINED_RESPONSE_REPOSITORY")
  for (const [, node] of rows("response-match-start")) if (starts.filter(([, start]) => start.value.start.root === node.value.parentStartRoot).length !== 1) return fail("RETAINED_RESPONSE_CHARGE_PARENT")
  for (const [, node] of nodes.filter(([, node]) => ["response-runtime-invocation", "response-runtime-invocation-failure", "response-runtime-cleanup"].includes(node.kind))) {
    if (rows("response-match-start").filter(([root]) => node.links.includes(root)).length !== 1) return fail("RETAINED_RESPONSE_RUNTIME_CHARGE")
  }
  for (const [failureRoot, failureNode] of failures) {
    const failure = failureNode.value, start = validateFactoryAttemptStart(failure.start)
    const matching = starts.filter(([, node]) => node.value.start.root === start.root)
    if (matching.length !== 1 || failures.filter(([, node]) => node.value.start.root === start.root).length !== 1) return fail("RETAINED_RESPONSE_FAILURE_START")
    const production = matching[0]![1].value, redTeamStart = ledger.starts.find((row) => row.root === start.resourceAccountingRoot)
    const job = allocation.rounds.flatMap((round) => round.jobs).find((job) => job.id === production.job.id)
    if (!job || !redTeamStart || !same(production.start, start) || !same(production.redTeamStart, redTeamStart) || !same(production.job, job) || start.taskRoot !== allocation.root || start.budgetRoot !== allocation.root || start.candidateRoot !== job.producerRequestArtifactRoot || start.inputRoot !== job.producerRequestArtifactRoot || ledger.terminals.find((row) => row.startRoot === redTeamStart.root)?.disposition !== "system_failure") return fail("RETAINED_RESPONSE_FAILURE_AUTHORITY")
    const journal = (suffix: string) => {
      const path = resolve(repository!.directory, `factory-attempt-${start.root.slice(7)}.${suffix}.json`), stat = lstatSync(path)
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 262144) return fail("RETAINED_RESPONSE_JOURNAL")
      return parse(readFileSync(path))
    }
    if (!same(journal("started"), start)) return fail("RETAINED_RESPONSE_JOURNAL")
    const terminal = validateFactoryAttemptLedger(start, journal("terminal"))
    if (failure.accepted === null) {
      if (terminal.disposition !== "system_failure" || terminal.outputRoot !== null || [terminal.validationRoot, terminal.duplicateEvidenceRoot, terminal.finalEvidenceRoot].some((root) => root !== failureRoot)) return fail("RETAINED_RESPONSE_FAILURE_TERMINAL")
    } else {
      const accepted = failure.accepted
      const resultPublished = rows("response-production-result").some(([, row]) => row.value.author.startRoot === redTeamStart.root)
      if (!accepted || !same(Object.keys(accepted).sort(), ["terminal", "closure"].sort()) || !same(terminal, accepted.terminal) || terminal.disposition !== "accepted" || resultPublished) return fail("RETAINED_RESPONSE_FAILURE_TERMINAL")
      const closure = readCandidateClosure({ ...accepted.closure, factoryRepository: repository! })
      const independence = graph.get(terminal.duplicateEvidenceRoot), validation = graph.get(closure.validation.evidenceRoot)
      const expectedThreshold = candidates.find((candidate) => candidate.admission.importEvidence)?.admission.importEvidence?.thresholdArtifactRoot
      const candidateBound = terminal.outputRoot === closure.candidate.root && terminal.validationRoot === closure.validation.root && terminal.finalEvidenceRoot === failure.author?.evidenceArtifactRoot
      const validationBound = validation?.kind === "response-validation" && validation.value.proposalRoot === closure.proposal.root && validation.value.sourceRoot === closure.proposal.source.root
      const independenceBound = independence?.kind === "response-independence" && independence.value.thresholdArtifactRoot === expectedThreshold
      if (!candidateBound || !validationBound || !independenceBound) return fail("RETAINED_RESPONSE_FAILURE_TERMINAL")
    }
    const target = parse(readFactoryArtifact(repository!, production.targetArtifactRoot))
    for (const row of target.candidates) {
      const candidate = candidates.find((candidate) => candidate.admission.candidate.root === row.candidateRoot)
      if (!candidate || candidate.closure.sourceArtifactRoot !== row.sourceArtifactRoot || row.byteLength !== readFactoryArtifact(repository!, row.sourceArtifactRoot).length) return fail("RETAINED_FAILED_TARGET_SOURCE")
    }
    const roundBlocks = blocks.filter((block) => block.round.round.root === redTeamStart.roundRoot || block.round.roundOrdinal === blocks.find((row) => row.round.round.root === redTeamStart.roundRoot)?.round.roundOrdinal)
    if (target.roundRoot !== redTeamStart.roundRoot || target.candidateRoot !== redTeamStart.candidateRoot || job.evaluationRole === "development_response" && (!roundBlocks.length || !same(target.targets, roundBlocks.map((block) => ({ seed: block.seed, target: block.round.target, weights: block.matrix.solver.weights }))) || !same(target.candidates.map((row: any) => row.candidateRoot), roundBlocks[0]!.candidateRoots))) return fail("RETAINED_RESPONSE_FAILURE_TARGET")
    let authoredSource: LabRoot | null = null
    if (failure.author) {
      const author = failure.author, retained = parse(readFactoryArtifact(repository!, author.evidenceArtifactRoot)), { root, ...body } = retained
      if (root !== labRoot("league-authoring-result-v1", body) || retained.allocationRoot !== allocation.root || retained.startRoot !== redTeamStart.root || retained.jobId !== job.id || !same(author, { disposition: retained.disposition, startRoot: retained.startRoot, ingestionArtifactRoot: retained.ingestionArtifactRoot, evidenceArtifactRoot: author.evidenceArtifactRoot, modelTokens: retained.modelTokens, elapsedMilliseconds: retained.elapsedMilliseconds })) return fail("RETAINED_FAILED_AUTHOR")
      if (author.disposition === "produced") authoredSource = verifyRetainedLeagueAuthoring(repository!, allocation, author.evidenceArtifactRoot).ingestion.packet.source.root
    }
    const conditions = enumerateLeagueResponseConditions(allocation, target.candidates.map((row: any) => row.candidateRoot))
    const charges = [...graph.matches("response-match-start", start.root)].sort((a, b) => a.ordinal - b.ordinal).map(({ root }) => [root, graph.get(root)!] as const)
    const results = graph.matches("response-match-result", start.root).map(({ root }) => [root, graph.get(root)!] as const)
    if (failure.accepted && (failure.matchCount !== conditions.length || results.length !== conditions.length)) return fail("RETAINED_RESPONSE_FAILURE_TERMINAL")
    if (charges.length !== failure.matchCount || charges.length > conditions.length || charges.length > job.reservation.matches || results.length < charges.length - 1 || results.length > charges.length || charges.length && !authoredSource) return fail("RETAINED_FAILED_RESPONSE_COVERAGE")
    for (const [ordinal, [chargeRoot, charge]] of charges.entries()) {
      const { arenaIndex, ...condition } = conditions[ordinal]!
      if (!same(charge.value, { parentStartRoot: start.root, ...condition })) return fail("RETAINED_FAILED_RESPONSE_CONDITION")
      const matched = results.filter(([, node]) => node.links.includes(chargeRoot)), cleanup = rows("response-runtime-cleanup").filter(([, node]) => node.links.includes(chargeRoot))
      if (matched.length > 1 || matched.length === 0 && ordinal !== charges.length - 1) return fail("RETAINED_FAILED_RESPONSE_PREFIX")
      const failedExecutions = rows("response-match-execution-failure").filter(([, node]) => node.links.includes(chargeRoot))
      if (failedExecutions.length > 1 || !matched.length && !failedExecutions.length && rows("response-runtime-invocation-failure").some(([, node]) => node.links.includes(chargeRoot))) return fail("RETAINED_FAILED_EXECUTION_MISSING")
      if (!matched.length && !failedExecutions.length) continue // Charged issuance failed before a Match executed.
      const value = (matched[0] ?? failedExecutions[0])![1].value, arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter((arena) => arena.status === "active" && arena.schedulable)[arenaIndex]!
      if (failedExecutions.length && (failedExecutions[0]![1].value.execution.kind !== "failure" || !sameLargeExecution(failedExecutions[0]![1].value.execution, value.execution))) return fail("RETAINED_FAILED_EXECUTION_CONFLICT")
      if (!same(value.matchCharge, charge.value) || !same(value.match.arenaVariant, arena)) return fail("RETAINED_FAILED_RESPONSE_MATCH")
      const raw = rows("response-runtime-invocation").filter(([, node]) => node.links.includes(chargeRoot)), thrown = rows("response-runtime-invocation-failure").filter(([, node]) => node.links.includes(chargeRoot))
      if ([...raw.map(([, node]) => node.value.originalEvidence.identity), ...thrown.map(([, node]) => node.value.identity)].some((identity) => !cleanup.some(([, node]) => same(node.value.identity, identity)))) return fail("RETAINED_FAILED_RUNTIME_IDENTITY")
      verifyRetainedLeagueProbeInvocations(raw.map(([, node]) => node.value), value.execution.accounting, undefined, arena.initialBounds)
      replayRetainedKernel(value.match, value.execution, allocation.evidenceClass === "empirical", { invocationFailures: thrown.map(([, node]) => node.value), cleanupIncomplete: cleanup.some(([, node]) => !node.value.cleanup.cleanupComplete || node.value.cleanup.orphanedChild) })
      const opponent = target.candidates.find((row: any) => row.candidateRoot === condition.opponentRoot)
      const reference = candidates.find((candidate) => candidate.publicationRoot === allocation.independenceReferencePublicationRoot)
      const measuredSource = condition.purpose === "independence_right" ? opponent.sourceArtifactRoot : authoredSource
      for (const [artifactRoot, playerId, sourceRoot, attemptRoot] of [[value.candidateReceiptArtifactRoot, "league-response-candidate", measuredSource, redTeamStart.root], [value.opponentReceiptArtifactRoot, "league-response-opponent", condition.purpose === "score" ? opponent.sourceArtifactRoot : reference?.closure.sourceArtifactRoot, chargeRoot]] as const) {
        const cleanupRows = cleanup.filter(([, node]) => node.value.identity.sourceRoot === sourceRoot && node.value.identity.attemptRoot === attemptRoot)
        const side = (condition.side === "bottom") === (playerId === "league-response-candidate") ? "bottom" : "top"
        if (!sourceRoot || cleanupRows.length !== 1 || cleanupRows[0]![1].value.identity.budgetRoot !== allocation.root || cleanupRows[0]![1].value.identity.revisionId !== (side === "bottom" ? value.match.bottomStrategyRevisionId : value.match.topStrategyRevisionId)) return fail("RETAINED_FAILED_RESPONSE_IDENTITY")
        if (!matched.length) continue // Honest failed execution, never an issued supervision receipt.
        const stored = readFactorySupervisionArtifactRecords(repository!, artifactRoot, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords }), metadata = stored.records.find((row) => row.kind === "receipt")!.value as any
        if (!sourceRoot || metadata.candidatePlayerId !== playerId || metadata.admission.sourceRoot !== sourceRoot || metadata.candidateIdentity.attemptRoot !== attemptRoot || metadata.candidateIdentity.budgetRoot !== allocation.root || stored.descriptor.executionRoot !== labRoot("factory-stored-execution-v1", deriveFactoryExecutionCommitment(value.execution)) || cleanup.filter(([, node]) => same(node.value.identity, metadata.candidateIdentity)).length !== 1) return fail("RETAINED_FAILED_RESPONSE_SUPERVISION")
      }
    }
  }
}

/** Recompute the state-machine path, including every intervening population.
 * A locally valid advance is insufficient if it omits a counter or a round. */
const verifyRetainedRoundPath = (allocation: LeagueExecutionAllocation, graph: ReturnType<typeof readLeagueRecordGraph>, blocks: readonly RoundBlock[], matrices: ReadonlyMap<LabRoot, CompleteMatrix>, reentries: readonly LeagueResponseRow[], initialRoots: readonly LabRoot[], finalRoots: readonly LabRoot[], head: { kind: string; value: any }) => {
  const advances = graph.roots("round-advance").map((root) => [root, graph.get(root)!] as const)
  if (new Set(advances.map(([, node]) => node.value.round.roundOrdinal)).size !== advances.length) return fail("RETAINED_ADVANCE_CHAIN")
  let population = [...initialRoots].sort(), last: typeof advances[number] | undefined
  const allowedPopulations = new Set([population.join()])
  const matrixFor = (roots: readonly LabRoot[], seed: string) => [...matrices.values()].find((matrix) => same(matrix.population.candidateAdmissionRoots, roots) && matrix.seed === seed)
  for (let ordinal = 0; ordinal < allocation.rounds.length; ordinal++) {
    const roundBlocks = blocks.filter((block) => block.round.roundOrdinal === ordinal), advance = advances.find(([, node]) => node.value.round.roundOrdinal === ordinal)
    if (!roundBlocks.length) {
      if (advance || blocks.some((block) => block.round.roundOrdinal > ordinal)) return fail("RETAINED_ADVANCE_CHAIN")
      break
    }
    if (!same(roundBlocks.map((block) => block.seed), allocation.seedBlocks.slice(0, roundBlocks.length)) || roundBlocks.some((block) => !same(block.matrix.population.candidateAdmissionRoots, population) || block.matrix.seed !== block.seed)) return fail("RETAINED_POPULATION_EVOLUTION")
    const round = roundBlocks[0]!.round, admissions = reentries.filter((entry) => entry.roundRoot === round.round.root), nextPopulation = [...population, ...admissions.map((entry) => entry.candidateAdmissionRoot)].sort()
    if (new Set(nextPopulation).size !== nextPopulation.length) return fail("RETAINED_POPULATION_EVOLUTION")
    allowedPopulations.add(nextPopulation.join())
    if (!advance) {
      if (head.kind !== "run-failure" || blocks.some((block) => block.round.roundOrdinal > ordinal)) return fail("RETAINED_ADVANCE_CHAIN")
      population = nextPopulation; break
    }
    if (roundBlocks.length !== allocation.seedBlocks.length) return fail("RETAINED_ADVANCE_CHAIN")
    const next = admissions.length ? matrixFor(nextPopulation, allocation.seedBlocks[0]!) : undefined
    if (admissions.length && (!next || allocation.seedBlocks.some((seed) => !matrixFor(nextPopulation, seed)))) return fail("RETAINED_FRESH_SNAPSHOT")
    const request = { round, admissions, requestClosure: !admissions.length && ordinal === allocation.rounds.length - 1, ...(next ? { nextPopulationRoot: next.population.root, nextSnapshot: next.admitted.snapshot } : {}) }
    if (!same(advance[1].value, { ...request, advanced: advanceLeagueRound(request) })) return fail("RETAINED_ADVANCE_CHAIN")
    population = nextPopulation; last = advance
  }
  const matrixKeys = [...matrices.values()].map((matrix) => {
    const seed = matrix.seed
    if (!allowedPopulations.has(matrix.population.candidateAdmissionRoots.join()) || !allocation.seedBlocks.includes(seed)) return fail("RETAINED_POPULATION_EVOLUTION")
    return `${matrix.population.root}:${seed}`
  })
  if (new Set(matrixKeys).size !== matrixKeys.length || !same([...finalRoots].sort(), population)) return fail("RETAINED_POPULATION_EVOLUTION")
  if (head.kind === "run-failure") return
  if (advances.length !== allocation.rounds.length || !last) return fail("RETAINED_ADVANCE_CHAIN")
  const expected = head.kind === "run-complete" ? "closed" : "fresh_snapshot_required"
  if (last[1].value.advanced.kind !== expected || head.kind === "run-budget-exhausted" && head.value.closureRoot !== last[0]) return fail("RETAINED_CLOSURE")
}

export const verifyRetainedSeriousLeague = (input: { repository: LeagueRepository; factoryRepository: FactoryRepository; responseFactoryRepository: FactoryRepository | null; headRoot: LabRoot; allocationRoot: LabRoot; limits: { maxArtifactBytes: number; maxArtifactRecords: number }; fixtureCandidates?: readonly LeagueCandidateInput[] }) => {
  const graph = readLeagueRecordGraph(input.repository, input.headRoot, input.limits), head = graph.get(input.headRoot) ?? fail("HEAD"), nodes = [...graph.entries()], rows = (kind: string) => graph.roots(kind).map((root) => [root, graph.get(root)!] as const)
  const starts = rows("run-start")
  if (starts.length !== 1 || !["run-complete", "run-failure", "run-budget-exhausted"].includes(head.kind)) return fail("RUN_GRAPH")
  const initial = starts[0]![1].value, allocation = admitLeagueExecutionAllocation(initial.allocation)
  const capacity = allocation.schemaVersion === "league-prospective-execution-allocation-v1" ? admitLeagueCapacityReceipt(initial.capacityReceipt, allocation, initial.capacityAtStart) : undefined
  const marker = parse(readLeagueArtifact(input.repository, initial.markerRoot))
  if (allocation.root !== input.allocationRoot || head.value.allocationRoot !== allocation.root || head.value.evidenceClass !== allocation.evidenceClass || allocation.operations.maxArtifactBytes > input.limits.maxArtifactBytes || allocation.operations.maxArtifactRecords > input.limits.maxArtifactRecords || input.fixtureCandidates && allocation.evidenceClass !== "injected_fixture" || !same(marker, runMarker(allocation, capacity))) return fail("RETAINED_ALLOCATION")
  if (allocation.schemaVersion === "league-prospective-execution-allocation-v1" && !same(parse(readLeagueArtifact(input.repository, marker.reservationRoot)), runReservation(allocation))) return fail("RETAINED_RESERVATION")
  const imported = input.fixtureCandidates ?? readLeagueInitialCandidates(input.factoryRepository, allocation), importedMap = new Map(imported.map((candidate) => [candidate.admission.root, candidate]))
  if (allocation.schemaVersion === "league-prospective-execution-allocation-v1") validateProspectiveLeagueInitialCandidates(allocation, imported)
  const restoreCandidate = (record: any): LeagueCandidateInput => {
    const prior = importedMap.get(record.admission.root)
    if (prior) { if (!same(candidateContent(candidateRecord(prior)), candidateContent(record))) return fail("RETAINED_CANDIDATE"); return prior }
    if (!input.responseFactoryRepository) return fail("RETAINED_FACTORY_DIRECTORY")
    candidateContent(record)
    const admission = LeagueCandidateAdmissionSchema.parse(record.admission)
    if (!admission.productionEvidence || admission.productionEvidence.allocationRoot !== allocation.root) return fail("RETAINED_PRODUCTION_AUTHORITY")
    const candidate = { admission, candidateAdmission: admission, closure: { ...record.closure, factoryRepository: input.responseFactoryRepository }, publicationRoot: record.publicationRoot, factoryRepository: input.responseFactoryRepository, fingerprintArtifactRoot: record.fingerprintArtifactRoot }
    if (readCandidateClosure(candidate.closure).candidate.root !== admission.candidate.root) return fail("RETAINED_PRODUCTION_CLOSURE")
    return candidate
  }
  if (!same(initial.candidates.map(candidateContent), imported.map(candidateRecord).map(candidateContent))) return fail("RETAINED_INITIAL_POPULATION")
  const acceptedRoots = new Set(rows("counter-reentry").map(([, node]) => node.value.candidateAdmission.root))
  const retainedGrowth = rows("response-production-result").filter(([, node]) => acceptedRoots.has(node.value.admission.root)).map(([, node]) => {
    const value = node.value
    return { admission: value.admission, publicationRoot: value.publicationRoot, fingerprintArtifactRoot: value.fingerprintArtifactRoot, factoryDirectory: value.factoryRepository, closure: value.closure }
  })
  // Growth is provisional until the production, assessment and re-entry joins
  // below have all been recomputed. Failure is not permission to skip them.
  const finalCandidates = (head.kind !== "run-failure" ? head.value.candidates : [...initial.candidates, ...retainedGrowth]).map(restoreCandidate), candidateAdmissions = new Map(finalCandidates.map((candidate: LeagueCandidateInput) => [candidate.admission.root, candidate.admission]))
  const reopened = reopenLeagueEvidence(input.repository, { maxBytes: input.limits.maxArtifactBytes, maxRecords: input.limits.maxArtifactRecords }), cellResults = rows("cell-result"), cellStarts = rows("cell-start")
  const { journals, startByRoot, cellByRoot } = verifyRetainedCellJournalBijection({ reopened, cellStarts, cellResults, allocationRoot: allocation.root, executedCells: head.value.executedCells })
  for (const journal of reopened.records) {
    const charged = startByRoot.get(journal.start.root)
    if (!charged || !same(charged[1].value.start, journal.start) || journal.start.allocationRoot !== allocation.root) return fail("RETAINED_CHARGE")
    const linkedFailures = graph.linked("cell-issuance-failure", charged[0])
    if (journal.terminalProvenance !== "persisted" && !(head.kind === "run-failure" && linkedFailures.length === 1 && journal.terminal.disposition === "system_failure" && journal.terminal.processValidity === "process_invalid" && journal.terminal.projection === null)) return fail("RETAINED_CHARGE")
    if (!cellByRoot.has(journal.start.cellRoot)) {
      if (head.kind === "run-complete" || linkedFailures.length !== 1 || journal.terminalProvenance === "persisted" && linkedFailures[0] !== journal.terminal.evidenceRoot || !same(graph.get(linkedFailures[0]!)!.value.cell, charged[1].value.cell) || journal.terminal.disposition !== "system_failure" || journal.terminal.projection !== null) return fail("RETAINED_ISSUANCE_FAILURE")
    }
  }
  for (const [recordRoot, node] of cellResults) {
    const value = node.value, journal = journals.get(value.start.root), startRecordRoot = startByRoot.get(value.start.root)?.[0] ?? fail("RETAINED_CELL_JOURNAL")
    const postResultFailures = graph.linked("cell-issuance-failure", recordRoot)
    const postResultFailure = head.kind === "run-failure" && postResultFailures.length === 1 && graph.get(postResultFailures[0]!)?.links.includes(startRecordRoot) && graph.get(postResultFailures[0]!)?.value.start.root === value.start.root && journal?.terminal.disposition === "system_failure" && journal.terminal.processValidity === "process_invalid" && journal.terminal.projection === null && (journal.terminalProvenance === "derived_unterminated_start" || journal.terminal.evidenceRoot === postResultFailures[0])
    if (!journal || !same(journal.start, value.start) || !(journal.terminalProvenance === "persisted" && same(journal.terminal, value.terminal) || postResultFailure) || value.start.allocationRoot !== allocation.root) return fail("RETAINED_CELL_JOURNAL")
    const linked = (kind: string) => graph.linked(kind, startRecordRoot).map((root) => [root, graph.get(root)!] as const)
    const cleanup = linked("runtime-cleanup"), cleanupFailures = linked("runtime-cleanup-failure")
    const invocationFailures = linked("runtime-invocation-failure")
    const identities = [...cleanup, ...cleanupFailures].map(([, row]) => row.value.identity)
    for (const [candidateRoot, revisionId] of [[value.bottomCandidateRoot, value.match.bottomStrategyRevisionId], [value.topCandidateRoot, value.match.topStrategyRevisionId]]) {
      const candidate = finalCandidates.find((row: LeagueCandidateInput) => row.admission.candidate.root === candidateRoot)
      if (!candidate || !identities.some((identity) => identity.sourceRoot === candidate.admission.candidate.proposal.source.root && identity.revisionId === revisionId && identity.budgetRoot === allocation.root && identity.runtimeLimitsRoot === allocation.runtimeRoot && identity.tupleRoot === allocation.tupleRoot)) return fail("RETAINED_CLEANUP_COVERAGE")
    }
    const cleanupIncomplete = cleanupFailures.length > 0 || cleanup.some(([, row]) => !row.value.closed.cleanupComplete || row.value.closed.orphanedChild)
    replayRetainedKernel(value.match, value.execution, allocation.evidenceClass === "empirical", { invocationFailures: invocationFailures.map(([, row]) => row.value), cleanupIncomplete })
    const terminal = deriveLeagueMatchExecutionTerminal(value.execution, value.cell, value.start, { candidateRoot: value.bottomCandidateRoot }, { candidateRoot: value.topCandidateRoot }, value.match)
    if (!same(terminal, value.terminal) || head.kind === "run-complete" && terminal.disposition !== "success") return fail("RETAINED_PAYOFF")
    const invocations = linked("runtime-invocation")
    verifyRetainedLeagueProbeInvocations(invocations.map(([, row]) => row.value), value.execution.accounting, value.options.transform, value.match.arenaVariant.initialBounds)
    void recordRoot
  }
  for (const [, node] of nodes.filter(([, node]) => ["runtime-invocation", "runtime-invocation-failure", "runtime-cleanup", "runtime-cleanup-failure"].includes(node.kind))) {
    const value = node.value, identity = value.identity ?? value.originalEvidence?.identity
    const start = startByRoot.get(identity?.attemptRoot)
    if (!start || !node.links.includes(start[0]) || identity.budgetRoot !== allocation.root) return fail("RETAINED_RUNTIME_CHARGE")
  }
  const matrices = new Map<LabRoot, CompleteMatrix>()
  for (const [recordRoot, node] of rows("complete-matrix")) {
    const value = node.value, compact = value.schemaVersion === "league-retained-matrix-v2"
    const references = compact ? value.matrix.cells.map((root: LabRoot) => { const record = graph.get(root); if (!record || record.kind !== "cell-result" || !node.links.includes(root)) return fail("RETAINED_MATRIX_REFERENCE"); return root }) : null
    const admissions = value.population.candidateAdmissionRoots.map((root: LabRoot) => candidateAdmissions.get(root) ?? fail("RETAINED_POPULATION")), firstCell = compact ? graph.get(references[0]!)?.value : cellByRoot.get(value.matrix.cells[0]?.cell.root)
    if (!firstCell) return fail("RETAINED_MATRIX_CELLS")
    const matrix = enumerateLeagueCells({ population: value.population, candidateAdmissions: admissions, tupleRoot: allocation.tupleRoot, runtimeRoot: allocation.runtimeRoot, baseSeed: firstCell.seed })
    if (compact ? !same({ ...matrix, cells: matrix.cells.map((entry) => cellByRoot.get(entry.cell.root)?.recordRoot) }, value.matrix) : !same(matrix, value.matrix)) return fail("RETAINED_MATRIX_ENUMERATION")
    const results = matrix.cells.map((row) => cellByRoot.get(row.cell.root) ?? fail("RETAINED_MATRIX_MISSING")), terminals = results.map((row) => row.terminal), admitted = admitCompletePayoffSnapshot(matrix, terminals)
    const retainedPayoffs = compact ? readLeagueComposedArtifact(input.repository, value.solverPayoffArtifactRoot, { maxBytes: input.limits.maxArtifactBytes, maxRecords: input.limits.maxArtifactRecords }) : new TextEncoder().encode(value.solverPayoffBytes)
    if (admitted.kind !== "complete" || !compact && !same(terminals, value.terminals) || !same(admitted.snapshot, value.snapshot) || bytesRoot(admitted.solverPayoffBytes) !== bytesRoot(retainedPayoffs)) return fail("RETAINED_MATRIX_TRANSPORT")
    const solver = solveLeagueSnapshot({ snapshot: admitted.snapshot, solverPayoffBytes: admitted.solverPayoffTransport, workerCount: 3, shardOrder: [2, 0, 1], restart: 1 })
    if (solver.status !== "solved" || !same({ ...solver, canonicalBytes: new TextDecoder().decode(solver.canonicalBytes) }, value.solver)) return fail("RETAINED_SOLVER")
    matrices.set(recordRoot, { population: value.population, matrix, admitted, solver, results, recordRoot, seed: firstCell.seed })
  }
  const blocks: RoundBlock[] = []
  for (const [, node] of rows("declared-round")) {
    const value = node.value, matrix = [...matrices.values()].find((matrix) => matrix.admitted.snapshot.root === value.round.snapshotRoot) ?? fail("RETAINED_ROUND_SNAPSHOT")
    const round = declareLeagueRound({ snapshot: matrix.admitted.snapshot, solver: matrix.solver, responseAllocationRoot: labRoot("league-round-allocation-v1", { allocationRoot: allocation.root, ordinal: value.round.roundOrdinal, seed: value.seed }), roundOrdinal: value.round.roundOrdinal, maximumRounds: allocation.rounds.length, closureRule: "bounded-no-accepted-counter-v1" })
    if (!allocation.seedBlocks.includes(value.seed) || !same(round, value.round) || !same([...value.candidateRoots].sort(), matrix.solver.weights.map((row) => row.candidateRoot).sort())) return fail("RETAINED_ROUND")
    blocks.push({ seed: value.seed, matrix, round, candidateRoots: value.candidateRoots })
  }
  blocks.sort((a, b) => a.round.roundOrdinal - b.round.roundOrdinal || allocation.seedBlocks.indexOf(a.seed) - allocation.seedBlocks.indexOf(b.seed))
  for (const [, node] of rows("layout-verification")) {
    const value = node.value, matrix = matrices.get(value.matrixRoot) ?? fail("RETAINED_LAYOUT_MATRIX"), results = value.completionOrder.map((root: LabRoot) => matrix.results.find((row) => row.terminal.root === root) ?? fail("RETAINED_LAYOUT_ORDER")), replay = admitCompletePayoffSnapshot(matrix.matrix, results.map((row: CompleteMatrix["results"][number]) => row.terminal))
    if (replay.kind !== "complete") return fail("RETAINED_LAYOUT_COVERAGE")
    const solved = solveLeagueSnapshot({ snapshot: replay.snapshot, solverPayoffBytes: replay.solverPayoffTransport, workerCount: value.workerCount, shardOrder: value.shardOrder, restart: value.restart })
    if (solved.status !== "solved" || value.snapshotRoot !== replay.snapshot.root || value.payoffBytesRoot !== bytesRoot(replay.solverPayoffBytes) || value.solverBytesRoot !== bytesRoot(solved.canonicalBytes) || !same(solved.output, matrix.solver.output)) return fail("RETAINED_LAYOUT_IDENTITY")
  }
  const complete = head.kind === "run-complete", budgetExhausted = head.kind === "run-budget-exhausted"
  if ((complete || budgetExhausted) && (blocks.length !== allocation.seedBlocks.length * allocation.rounds.length || allocation.rounds.some((round) => allocation.seedBlocks.some((seed) => blocks.filter((block) => block.seed === seed && block.round.roundOrdinal === round.ordinal).length !== 1)))) return fail("RETAINED_ROUND_COVERAGE")
  const closings = rows("red-team-close")
  if (complete && (closings.length !== 1 || closings[0]![0] !== head.value.ledgerRoot)) return fail("RETAINED_CLOSE")
  const close = closings[0]?.[1].value
  let ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  const scheduled = allocation.rounds.flatMap((round) => round.jobs)
  const retainedStarts = rows("red-team-start").sort(([, a], [, b]) => scheduled.findIndex((job) => job.id === a.value.jobId) - scheduled.findIndex((job) => job.id === b.value.jobId)).map(([, node]) => node.value.start)
  const retainedTerminals = rows("red-team-terminal").map(([, node]) => node.value.terminal)
  const probeLedgers = rows("probe-ledger").map(([, node]) => node.value).sort((a, b) => a.probes.length - b.probes.length)
  const retainedProbes = probeLedgers.at(-1)?.probes ?? []
  if (new Set(retainedStarts.map((start) => start.root)).size !== retainedStarts.length || retainedStarts.length !== retainedTerminals.length || complete && retainedStarts.length !== scheduled.length) return fail("RETAINED_JOB_COVERAGE")
  const completedJobs = retainedStarts.flatMap((start, index) => retainedTerminals.find((terminal) => terminal.startRoot === start.root)?.disposition === "system_failure" ? [] : [scheduled[index]!.id])
  if (!same(completedJobs, head.value.completedJobs)) return fail("RETAINED_JOB_COVERAGE")
  const reservedMatches = retainedStarts.reduce((sum, start) => sum + start.reservation.matches, 0)
  if (reservedMatches !== head.value.reservedResponseMatches || reservedMatches + reopened.records.length > allocation.opportunities.matches) return fail("RETAINED_MATCH_CHARGES")
  for (const [index, start] of retainedStarts.entries()) {
    const { root: _root, allocationRoot: _allocationRoot, ordinal: _ordinal, ...body } = start, job = scheduled[index]
    if (!job || job.id !== rows("red-team-start").find(([, node]) => node.value.start.root === start.root)?.[1].value.jobId || job.producerRequestArtifactRoot !== start.inputRoot || !same(job.reservation, start.reservation)) return fail("RETAINED_JOB_BINDING")
    ledger = startRedTeamAttempt({ ledger, ...body }); if (!same(ledger.starts.at(-1), start)) return fail("RETAINED_START")
    const terminal = retainedTerminals.find((row: any) => row.startRoot === start.root) ?? fail("RETAINED_TERMINAL"), { root: _terminalRoot, charge: _charge, processValidity: _processValidity, ...terminalBody } = terminal
    if (!terminal.evidenceRoots.every((root: LabRoot) => graph.has(root))) return fail("RETAINED_TERMINAL_EVIDENCE")
    ledger = terminalizeRedTeamAttempt({ ledger, ...terminalBody }); if (!same(ledger.terminals.at(-1), terminal)) return fail("RETAINED_TERMINAL")
  }
  for (const retained of probeLedgers) {
    const { root, ...body } = retained
    if (root !== labRoot("league-red-team-ledger-v1", body) || !same(retained.probes, retainedProbes.slice(0, retained.probes.length)) || retained.starts.some((start: any) => !retainedStarts.some((row) => same(start, row))) || retained.terminals.some((terminal: any) => !retainedTerminals.some((row) => same(terminal, row)))) return fail("RETAINED_PROBE_LEDGER")
  }
  for (const probe of retainedProbes) {
    if (["source_order", "worker_shard_completion"].includes(probe.family)) for (const pair of probe.pairs) for (const arm of ["left", "right"] as const) if (rows("layout-verification").filter(([, node]) => node.value.roundRoot === probe.roundRoot && node.value.family === probe.family && node.value.arm === arm && node.value.cellResultRoot === pair[arm].evidenceRoot).length !== 1) return fail("RETAINED_LAYOUT_PROBE_COVERAGE")
    const pairs = probe.pairs.map((pair: any) => Object.fromEntries(["left", "right"].map((arm) => { const observed = pair[arm], node = graph.get(observed.evidenceRoot); if (!node || node.kind !== "cell-result") return fail("RETAINED_PROBE_CELL"); const value = node.value, halfPoints = value.cell.entrantCandidateRoot === probe.candidateRoot ? value.terminal.projection.halfPoints : 2 - value.terminal.projection.halfPoints, conditionRoot = ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(probe.family) ? value.options.baseCell.conditionRoot : value.cell.conditionRoot; return [arm, { canonicalBytes: normalizedGameplayRoot(value.execution), halfPoints, conditionRoot, evidenceRoot: observed.evidenceRoot }] })))
    if (!same(pairs, probe.pairs)) return fail("RETAINED_PROBE_OBSERVATION")
    ledger = recordLeagueProbe({ ledger, family: probe.family, roundRoot: probe.roundRoot, candidateRoot: probe.candidateRoot, pairs }); if (!same(ledger.probes.at(-1), probe)) return fail("RETAINED_PROBE")
  }
  const production = rows("response-production-result").map(([recordRoot, node]) => ({ ...node.value, recordRoot })).sort((a, b) => ledger.starts.findIndex((start) => start.root === a.author.startRoot) - ledger.starts.findIndex((start) => start.root === b.author.startRoot)), verifiedAssessments = new Map<LabRoot, any>(), acceptedByRound = new Map<number, typeof production>()
  if (complete && production.length !== scheduled.filter((job) => job.operation === "produce").length) return fail("RETAINED_PRODUCTION_COVERAGE")
  for (const produced of production) {
    if (produced.evaluationRole !== "development_response") {
      const start = ledger.starts.find((start) => start.root === produced.author.startRoot) ?? fail("RETAINED_EVALUATION_START"), job = scheduled.filter((job) => job.channel === start.channel)[start.ordinal], imported = finalCandidates.find((candidate: LeagueCandidateInput) => candidate.admission.importEvidence), finalMatrices = head.value.matrixRoots.map((root: LabRoot) => matrices.get(root) ?? fail("RETAINED_EVALUATION_MATRIX"))
      if (!job || job.evaluationRole !== produced.evaluationRole || !input.responseFactoryRepository || !imported || start.roundRoot !== labRoot("league-independent-evaluation-v1", { allocationRoot: allocation.root, role: job.evaluationRole, snapshotRoots: finalMatrices.map((matrix: CompleteMatrix) => matrix.admitted.snapshot.root) })) return fail("RETAINED_EVALUATION_BINDING")
      verifyRetainedLeagueResponse({ allocation, repository: input.responseFactoryRepository, produced, opponents: finalCandidates.map((candidate: LeagueCandidateInput) => ({ candidateRoot: candidate.admission.candidate.root, closure: candidate.closure })), threshold: { repository: imported.factoryRepository, artifactRoot: imported.admission.importEvidence!.thresholdArtifactRoot }, records: graph })
      const evidence = rows("independent-evaluation").filter(([, node]) => node.value.startRoot === start.root)
      if (evidence.length !== 1 || !same(evidence[0]![1].value, { jobId: job.id, startRoot: start.root, evaluationRole: job.evaluationRole, producedRoot: produced.recordRoot, matrixRoots: head.value.matrixRoots, authoredFromFrozenPacketOnly: true }) || ledger.terminals.find((terminal) => terminal.startRoot === start.root)?.disposition !== "accepted") return fail("RETAINED_EVALUATION_TERMINAL")
      continue
    }
    const start = ledger.starts.find((start) => start.root === produced.author.startRoot) ?? fail("RETAINED_RESPONSE_START"), block = blocks.find((block) => block.round.round.root === start.roundRoot) ?? fail("RETAINED_RESPONSE_ROUND"), schedule = allocation.rounds[block.round.roundOrdinal]!, candidates = block.candidateRoots.map((root) => finalCandidates.find((candidate: LeagueCandidateInput) => candidate.admission.candidate.root === root) ?? fail("RETAINED_RESPONSE_OPPONENT")), imported = candidates.find((candidate: LeagueCandidateInput) => candidate.admission.importEvidence), roundBlocks = blocks.filter((entry) => entry.round.roundOrdinal === block.round.roundOrdinal), job = schedule.jobs.find((job) => job.producerRequestArtifactRoot === start.inputRoot && job.participantId === start.participantId) ?? fail("RETAINED_RESPONSE_JOB")
    if (!input.responseFactoryRepository || !imported) return fail("RETAINED_RESPONSE_REPOSITORY")
    const targetPacket = parse(readFactoryArtifact(input.responseFactoryRepository, produced.targetArtifactRoot))
    if (!same(targetPacket.targets, roundBlocks.map((entry) => ({ seed: entry.seed, target: entry.round.target, weights: entry.matrix.solver.weights })))) return fail("RETAINED_PRE_RESPONSE_TARGET")
    if (isProspectiveTacticalJob(allocation, job)) {
      if (targetPacket.tacticalAdaptation?.matrixRecordRoot !== block.matrix.recordRoot) return fail("RETAINED_TACTICAL_MATRIX")
      const context = readRetainedTacticalAuthoringContext(input.responseFactoryRepository, allocation, job, targetPacket), retained = rows("tactical-adaptation-corpus").filter(([, node]) => node.value.jobId === job.id)
      if (retained.length !== 1 || !same(retained[0]![1].value, { jobId: job.id, roundRoot: start.roundRoot, corpusArtifactRoot: targetPacket.tacticalAdaptation.corpusArtifactRoot, corpusRoot: context.corpus.root, matrixRecordRoot: block.matrix.recordRoot })) return fail("RETAINED_TACTICAL_CORPUS")
    } else if (targetPacket.tacticalAdaptation !== undefined) return fail("RETAINED_TACTICAL_SCOPE")
    verifyRetainedLeagueResponse({ allocation, repository: input.responseFactoryRepository, produced, opponents: candidates.map((candidate: LeagueCandidateInput) => ({ candidateRoot: candidate.admission.candidate.root, closure: candidate.closure })), threshold: { repository: imported.factoryRepository, artifactRoot: imported.admission.importEvidence!.thresholdArtifactRoot }, records: graph })
    const accepted = acceptedByRound.get(schedule.ordinal) ?? [], duplicate = [...candidates, ...accepted].some((candidate: LeagueCandidateInput) => candidate.admission.candidate.proposal.source.root === produced.admission.candidate.proposal.source.root), independent = produced.comparisons.length === candidates.length && produced.comparisons.every((row: any) => row.relation === "distinct"), scores = roundBlocks.map((entry) => responseScores(produced, entry)), positive = scores.every((rows) => rows.every((score) => BigInt(score.numerator) * 100n > BigInt(score.denominator) * 55n)), eligible = !duplicate && independent && positive && accepted.length < schedule.acceptedSlots
    const assessment = { targetRoot: block.round.target.root, fingerprintEvidenceRoot: produced.fingerprintArtifactRoot, independentCounterfactualRelations: produced.comparisons.map((row: any) => row.relation === "unresolved" ? "borderline" : row.relation), existingCandidateRoots: block.candidateRoots, completeTargetScores: scores[0]! }, expected = { jobId: job.id, startRoot: start.root, producedRoot: produced.recordRoot, scores, duplicate, independent, positive, eligible, assessment }, retained = rows("red-team-assessment").filter(([, row]) => row.value.startRoot === start.root)
    if (retained.length !== 1 || !same(retained[0]![1].value, expected) || ledger.terminals.find((terminal) => terminal.startRoot === start.root)?.disposition !== (eligible ? "success" : duplicate ? "duplicate" : "legal_but_weak")) return fail("RETAINED_RESPONSE_ASSESSMENT")
    if (eligible) { accepted.push(produced); acceptedByRound.set(schedule.ordinal, accepted); verifiedAssessments.set(start.root, assessment) }
  }
  const reentries = rows("counter-reentry").map(([, node]) => { const row = node.value; if (!same(row.assessment, verifiedAssessments.get(row.startRoot))) return fail("RETAINED_REENTRY_ASSESSMENT"); const admission = reenterAcceptedCounter({ ledger, startRoot: row.startRoot, round: row.round, candidateAdmission: row.candidateAdmission, assessment: row.assessment }); if (!same(admission, row.reentry)) return fail("RETAINED_REENTRY"); return admission })
  const requiredTargets = blocks.flatMap((block) => block.candidateRoots.map((candidateRoot) => ({ roundRoot: block.round.round.root, candidateRoot })))
  if (ledger.terminals.filter((terminal) => terminal.disposition === "success").some((terminal) => reentries.filter((entry) => entry.candidateAdmissionRoot === terminal.candidateAdmissionRoot).length !== 1)) return fail("RETAINED_COUNTER_REENTRY_COVERAGE")
  if (complete ? !same(ledger, close.ledger) : ledger.root !== head.value.ledgerRoot) return fail("RETAINED_RED_TEAM_CLOSE")
  verifyRetainedRoundPath(allocation, graph, blocks, matrices, reentries, imported.map((candidate) => candidate.admission.root), finalCandidates.map((candidate: LeagueCandidateInput) => candidate.admission.root), head)
  verifyRetainedProductionFailures(input.responseFactoryRepository, allocation, graph, ledger, blocks, finalCandidates)
  const failedProductionRoots = new Set(rows("response-production-failure").map(([, node]) => node.value.start.root))
  for (const [, node] of rows("response-match-result")) { const value = node.value; if (!failedProductionRoots.has(value.matchCharge.parentStartRoot)) replayRetainedKernel(value.match, value.execution, allocation.evidenceClass === "empirical") }
  const verifyPublishedSeedPrefix = (requireComplete: boolean) => {
    const selections = rows("selection"), reports = rows("report")
    if (!requireComplete && !selections.length && !reports.length) return
    if (closings.length !== 1 || !close || !same(close.ledger, ledger)) return fail("RETAINED_REPORT_CLOSE")
    const closed = closeRedTeamLedger({ ledger, requiredTargets, reentries })
    if (!same(closed, close.closed) || closed.processValidity !== "process_valid") return fail("RETAINED_RED_TEAM_CLOSE")
    const orderedMatrices = head.value.matrixRoots.map((root: LabRoot, index: number) => {
      const matrix = matrices.get(root)
      if (!matrix || matrix.seed !== allocation.seedBlocks[index]) return fail("RETAINED_REPORT_MATRIX")
      return matrix
    }) as CompleteMatrix[]
    if (orderedMatrices.length !== allocation.seedBlocks.length) return fail("RETAINED_REPORT_MATRIX")
    const selectionBySeed = new Map<number, typeof selections[number]>()
    for (const entry of selections) {
      const [selectionRoot, node] = entry, index = orderedMatrices.findIndex((matrix) => matrix.admitted.snapshot.root === node.value.mixture.snapshotRoot)
      if (index < 0 || selectionBySeed.has(index)) return fail("RETAINED_SELECTION_MATRIX")
      const { candidates: _candidates, ...prior } = node.value
      if (!same(selectionFor(orderedMatrices[index]!, finalCandidates, blocks, ledger, production, allocation), prior)) return fail("RETAINED_SELECTION")
      selectionBySeed.set(index, [selectionRoot, node])
    }
    if (selections.length > allocation.seedBlocks.length || reports.length > selections.length || reports.length < selections.length - 1 || requireComplete && (selections.length !== allocation.seedBlocks.length || reports.length !== selections.length)) return fail("RETAINED_REPORT_COVERAGE")
    const reportBySeed = new Map<number, typeof reports[number]>()
    for (const entry of reports) {
      const [reportRoot, node] = entry, index = orderedMatrices.findIndex((matrix) => matrix.recordRoot === node.value.matrixRoot)
      if (index < 0 || reportBySeed.has(index) || node.value.selectionRoot !== selectionBySeed.get(index)?.[0] || !node.links.includes(node.value.selectionRoot)) return fail("RETAINED_REPORT_COVERAGE")
      const matrix = orderedMatrices[index]!, selection = selectionBySeed.get(index)![1].value
      const reopened = reopenLeagueReport({ repository: input.repository, descriptor: node.value.report.descriptor, maxBytes: input.limits.maxArtifactBytes, maxRecords: input.limits.maxArtifactRecords })
      const projection = reportProjection(matrix, finalCandidates, blocks, ledger, closed, reentries, selection, allocation)
      if (!same(matrix.population.candidateAdmissionRoots, finalCandidates.map((candidate: LeagueCandidateInput) => candidate.admission.root).sort()) || !same(node.value.projection, projection) || node.value.report.descriptor.finalistDispositionRoot !== selection.finalist.root || reopened.chunks.length !== 1 || reopened.chunks[0]!.root !== node.value.report.reportRoot || !same(reopened.chunks[0]!.report.projection, projection)) return fail("RETAINED_REPORT")
      reportBySeed.set(index, [reportRoot, node])
    }
    for (let index = 0; index < selections.length; index++) {
      const selection = selectionBySeed.get(index), previousReport = reportBySeed.get(index - 1)
      if (!selection || index > 0 && (!previousReport || !selection[1].links.includes(previousReport[0]))) return fail("RETAINED_REPORT_ORDER")
    }
    for (let index = 0; index < reports.length; index++) if (!reportBySeed.has(index)) return fail("RETAINED_REPORT_ORDER")
    if (requireComplete && !same(allocation.seedBlocks.map((_, index) => reportBySeed.get(index)![1].value.report), head.value.reports)) return fail("RETAINED_REPORT_COVERAGE")
  }
  if (!complete) {
    if (budgetExhausted) {
      const expectedJobs = scheduled.filter((job) => job.evaluationRole === "development_response").map((job) => job.id), undispatched = scheduled.filter((job) => job.evaluationRole !== "development_response").map((job) => job.id)
      if (head.value.processValidity !== "process_valid" || head.value.result !== "response_round_budget_exhausted" || head.value.closure !== "not_closed" || !same(head.value.completedJobs, expectedJobs) || !same(head.value.undispatchedJobIds, undispatched) || retainedStarts.length !== expectedJobs.length || rows("selection").length || rows("report").length || rows("independent-evaluation").length || closings.length || ledger.terminals.some((terminal) => terminal.processValidity !== "process_valid")) return fail("RETAINED_NONCLOSED_DISPOSITION")
      if (!same(head.value.matrixRoots, allocation.seedBlocks.map((seed) => [...matrices.values()].find((matrix) => same(matrix.population.candidateAdmissionRoots, [...candidateAdmissions.keys()].sort()) && matrix.seed === seed)?.recordRoot))) return fail("RETAINED_NONCLOSED_MATRICES")
      return { issued: false as const, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_valid" as const, result: "response_round_budget_exhausted" as const, closure: "not_closed" as const, headRoot: input.headRoot, empiricalRequirementsComplete: false }
    }
    if (head.value.processValidity !== "process_invalid" || Object.hasOwn(head.value, "reports") || Object.hasOwn(head.value, "result")) return fail("RETAINED_FAILURE_DISPOSITION")
    verifyPublishedSeedPrefix(false)
    return { issued: false as const, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_invalid" as const, headRoot: input.headRoot, empiricalRequirementsComplete: false }
  }
  verifyPublishedSeedPrefix(true)
  return { issued: false as const, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_valid" as const, headRoot: input.headRoot, empiricalRequirementsComplete: false }
}

export const seriousLeagueHelp = `Usage:
  run-v1-38-serious-league prepare --allocation <complete-canonical-input.json>
  run-v1-38-serious-league prepare-prospective --allocation <complete-prospective-input.json> --factory-repository <historical-factory-directory>
  run-v1-38-serious-league preflight --allocation <rooted-prospective-allocation.json> --allocation-root <sha256:...> --capacity-input <data-only-measurements.json> --factory-repository <historical-factory-directory>
  run-v1-38-serious-league run --allocation <rooted-canonical-allocation.json> --allocation-root <sha256:...> --repository <league-directory> --factory-repository <factory-directory> [--response-factory-repository <factory-directory>] [--capacity-input <data-only-measurements.json> | --capacity-receipt <rooted-receipt.json>]
  run-v1-38-serious-league verify-retained --allocation <rooted-canonical-allocation.json> --allocation-root <sha256:...> --repository <league-directory> --factory-repository <factory-directory> [--response-factory-repository <factory-directory>] --head-root <sha256:...>
Private current-rules league only. No allocation, participant, provider, or resource defaults.
prepare prints the immutable allocation but never dispatches. run accepts empirical allocations only.
prepare-prospective alone creates the distinct prospective allocation after data-only S01/S03/S05 verification.
preflight is data-only: all static checks precede a fresh host observation and receipt. It does not reserve a run.
prospective run --capacity-input performs static verification, fresh host measurement, receipt admission and once-only reservation in one process. The data-only input contains no host observations or timestamps.
--capacity-receipt is mutually exclusive and strictly admitted before and after static checks; old receipt authority is never refreshed. All output directories must already exist. No command creates a default allocation or raises a bound.
verify-retained is read-only and never invokes a Strategy, producer, model or runtime.`
export const seriousLeagueMain = async (args: readonly string[]) => {
  if (args.length === 1 && args[0] === "--help") return seriousLeagueHelp
  const [mode, ...rest] = args, options = new Map<string, string>(), allowed = new Set(["--allocation", "--allocation-root", "--repository", "--factory-repository", "--response-factory-repository", "--head-root", "--capacity-input", "--capacity-receipt"])
  if (!["prepare", "prepare-prospective", "preflight", "run", "verify-retained"].includes(String(mode)) || rest.length % 2) return fail("ARGUMENTS")
  for (let i = 0; i < rest.length; i += 2) { const name = rest[i]!, value = rest[i + 1]!; if (!allowed.has(name) || options.has(name) || !value || value.startsWith("--")) return fail("ARGUMENTS"); options.set(name, value) }
  if (options.has("--capacity-input") && options.has("--capacity-receipt")) return fail("ARGUMENTS")
  const required = (name: string) => options.get(name) ?? fail("ARGUMENTS"), value = parse(readFileSync(resolve(required("--allocation"))))
  if (mode === "prepare") { if (options.size !== 1) return fail("ARGUMENTS"); return new TextDecoder().decode(encode(prepareSeriousLeague(value))) }
  if (mode === "prepare-prospective") {
    if (options.size !== 2 || value.evidenceClass !== "empirical") return fail("ARGUMENTS")
    return new TextDecoder().decode(encode(prepareProspectiveSeriousLeague(value, { factoryRepository: createFactoryRepository(resolve(required("--factory-repository"))) })))
  }
  const allocation = admitLeagueExecutionAllocation(value), allocationRoot = required("--allocation-root") as LabRoot
  if (allocation.root !== allocationRoot || mode === "run" && allocation.evidenceClass !== "empirical" || mode === "run" && options.has("--head-root")) return fail("RUN_AUTHORITY")
  if (mode === "preflight") {
    if (options.size !== 4) return fail("ARGUMENTS")
    return new TextDecoder().decode(encode(preflightProspectiveSeriousLeague({ allocation, capacity: parse(readFileSync(resolve(required("--capacity-input")))), factoryRepository: createFactoryRepository(resolve(required("--factory-repository"))) })))
  }
  if ((mode === "verify-retained" || allocation.schemaVersion === "league-execution-allocation-v1") && (options.has("--capacity-input") || options.has("--capacity-receipt"))) return fail("ARGUMENTS")
  const prospectiveRun = allocation.schemaVersion === "league-prospective-execution-allocation-v1" && mode === "run"
  const capacityInput = prospectiveRun && options.has("--capacity-input") ? parse(readFileSync(resolve(required("--capacity-input")))) : undefined
  const capacityReceipt = prospectiveRun && !options.has("--capacity-input") ? parse(readFileSync(resolve(required("--capacity-receipt")))) : undefined
  const repository = createLeagueRepository(resolve(required("--repository"))), factoryRepository = createFactoryRepository(resolve(required("--factory-repository"))), responseFactoryRepository = options.has("--response-factory-repository") ? createFactoryRepository(resolve(required("--response-factory-repository"))) : null
  const result = mode === "run" ? await runSeriousLeague({ allocation, allocationRoot, repository, factoryRepository, responseFactoryRepository, ...(capacityReceipt !== undefined ? { capacityReceipt } : {}), ...(capacityInput !== undefined ? { capacityInput } : {}) }) : verifyRetainedSeriousLeague({ allocationRoot, repository, factoryRepository, responseFactoryRepository, headRoot: required("--head-root") as LabRoot, limits: allocation.operations })
  return JSON.stringify(result)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void seriousLeagueMain(process.argv.slice(2)).then((result) => process.stdout.write(`${result}\n`)).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "SERIOUS_LEAGUE_FAILURE"}\n`); process.exitCode = 1 })
