import { createHash } from "node:crypto"
import { closeSync, fsyncSync, lstatSync, openSync, readFileSync, readdirSync, writeSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, createSetScenarioV137 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createLeagueExecutionAllocation, admitLeagueExecutionAllocation, type LeagueExecutionAllocation } from "../packages/strategy-lab/src/league/allocation.js"
import { createLeaguePopulation, createLeagueCell, createLeagueCellTerminal, createLeagueMixture, importAssessedFactoryCandidate, projectCanonicalKernelOutcomeToEntrantHalfPoints, LeagueCandidateAdmissionSchema, type LeagueCandidateAdmission, type LeagueCell, type LeagueCellTerminal } from "../packages/strategy-lab/src/league/contracts.js"
import { createLeagueRepository, publishLeagueArtifact, readLeagueArtifact, recordLeagueCellStart, publishLeagueCellTerminal, reopenLeagueEvidence, type LeagueRepository } from "../packages/strategy-lab/src/league/repository.js"
import { enumerateLeagueCells, admitCompletePayoffSnapshot, leaguePlayerId, type LeagueMatrix } from "../packages/strategy-lab/src/league/matrix.js"
import { issueLeagueProviderFromFactoryCandidate, readCandidateClosure, runLeagueCell, type FactoryCandidateClosure, type FactorySupervisedRuntimeHost } from "../packages/strategy-lab/src/league/connected-runner.js"
import { solveLeagueSnapshot } from "../packages/strategy-lab/src/league/solver.js"
import { declareLeagueRound, advanceLeagueRound, type DeclaredLeagueRound, type LeagueResponseRow } from "../packages/strategy-lab/src/league/psro.js"
import { declareRedTeamAllocation, startRedTeamAttempt, terminalizeRedTeamAttempt, reenterAcceptedCounter, recordLeagueProbe, closeRedTeamLedger, LEAGUE_PROBES, type LeagueProbeFamily, type RedTeamLedger, type RedTeamResources } from "../packages/strategy-lab/src/league/red-team.js"
import { deriveLeaguePortfolio, selectRobustPure, type LeaguePortfolioCandidate } from "../packages/strategy-lab/src/league/selection.js"
import { publishLeagueReport, reopenLeagueReport } from "../packages/strategy-lab/src/league/report.js"
import { createFactoryRepository, readFactoryArtifact, publishFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import type { FactorySupervisionProvider } from "../packages/strategy-lab/src/factory/admission.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { factoryAssessmentImplementationRoot } from "./v1-38-factory-implementation.js"
import { verifyHistoricalFactoryAssessmentForLeague, readRetainedFactoryLedger } from "./assess-v1-38-factory-independence.js"
import { readFactorySupervisionArtifactRecords } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { preflightLeagueAuthoring, verifyRetainedLeagueAuthoring } from "./lib/v1-38-league-authoring.js"
import { wrapLeagueProbeProvider, produceLeagueResponse, verifyRetainedLeagueResponse, verifyRetainedLeagueProbeInvocations } from "./lib/v1-38-league-response-runtime.js"

const fail = (code: string): never => { throw new TypeError(`SERIOUS_LEAGUE_${code}`) }
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
  constructor(readonly allocation: LeagueExecutionAllocation) { admitLeagueExecutionAllocation(allocation) }
  checkCapacity(byteLength: number, records: number, terminal = this.terminalMode) {
    const limits = this.allocation.operations
    if (!terminal && (this.exhausted || this.workBytes + byteLength > limits.maxArtifactBytes - limits.terminalReserveBytes || this.workRecords + records > limits.maxArtifactRecords - limits.terminalReserveRecords)) { this.exhausted = true; return fail("RETENTION_BUDGET") }
    if (terminal && (this.terminalBytes + byteLength > limits.terminalReserveBytes || this.terminalRecords + records > limits.terminalReserveRecords)) return fail("TERMINAL_RETENTION_BUDGET")
  }
  readonly beforePublication = (value: { target: string; byteLength: number; terminal: boolean }) => {
    const terminal = value.terminal || this.terminalMode
    if (this.charged.has(value.target)) return fail("UNCERTAIN_REPUBLICATION")
    if (value.target.endsWith(".started.json")) {
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
  beforeInvocation(request: unknown) {
    if (!this.budget) return
    // Two request projections and two result projections, including worst-case
    // JSON escaping, fit before the guest is called. The final envelope and
    // chunk records are included; this is capacity, not an extra execution cap.
    const bytes = encode(request).length * 4 + this.budget.allocation.operations.outputLimitBytes * 12 + 262144
    this.budget.checkCapacity(bytes, 2 * Math.ceil(bytes / 131072) + 1)
  }
  append(kind: string, value: unknown, links: readonly LabRoot[] = []): LabRoot {
    if (this.budget?.exhausted && ["run-failure", "red-team-terminal", "red-team-process-failure", "response-production-failure", "response-runtime-cleanup", "runtime-cleanup", "runtime-cleanup-failure", "cell-issuance-failure"].includes(kind)) return this.budget.terminal(() => this.publish(kind, value, [], true))
    return this.publish(kind, value, links, false)
  }
  private publish(kind: string, value: unknown, links: readonly LabRoot[], terminal: boolean): LabRoot {
    let dependencies = [...new Set([...links, ...(this.latestRoot ? [this.latestRoot] : [])])].sort()
    while (dependencies.length > 128) { const groups: LabRoot[] = []; for (let i = 0; i < dependencies.length; i += 127) { const rows = dependencies.slice(i, i + 127); groups.push(this.publish("record-links", { count: rows.length }, rows, terminal)) }; dependencies = [...new Set(groups)].sort() }
    const bytes = encode(value), pending: Uint8Array[] = []
    let tailRoot: LabRoot | null = null, ordinal = 0
    for (let offset = 0; offset < bytes.length; offset += 131072) { const chunk = bytes.subarray(offset, offset + 131072), chunkRoot = bytesRoot(chunk); pending.push(chunk); const node = encode({ schemaVersion: "league-record-chunk-v1", ordinal: ordinal++, previousRoot: tailRoot, bytesRoot: chunkRoot, byteLength: chunk.length }); pending.push(node); tailRoot = bytesRoot(node) }
    const descriptor = encode(rooted("league-record-v1", { kind, byteLength: bytes.length, recordRoot: bytesRoot(bytes), chunkCount: ordinal, tailRoot, links: dependencies })); pending.push(descriptor)
    const size = pending.reduce((sum, bytes) => sum + bytes.length, 0)
    if (this.budget) {
      const fresh = pending.filter((bytes) => { try { lstatSync(resolve(this.repository.directory, `league-artifact-${bytesRoot(bytes).slice(7)}.bin`)); return false } catch { return true } })
      this.budget.checkCapacity(fresh.reduce((sum, bytes) => sum + bytes.length, 0), fresh.length, terminal)
    }
    else if (this.writtenBytes + size > this.limits.maxArtifactBytes || this.records + pending.length > this.limits.maxArtifactRecords) return fail("RETENTION_BUDGET")
    this.writtenBytes += size; this.records += pending.length
    for (const artifact of pending) publishLeagueArtifact(this.repository, artifact)
    this.latestRoot = bytesRoot(descriptor)
    return this.latestRoot
  }
}
export const readLeagueRecordGraph = (repository: LeagueRepository, head: LabRoot, limits: { maxArtifactBytes: number; maxArtifactRecords: number }) => {
  const nodes = new Map<LabRoot, { kind: string; value: any; links: LabRoot[] }>(), active = new Set<LabRoot>(), seenArtifacts = new Set<LabRoot>(); let consumed = 0
  const read = (root: LabRoot) => { const bytes = readLeagueArtifact(repository, root); if (!seenArtifacts.has(root)) { seenArtifacts.add(root); consumed += bytes.length; if (consumed > limits.maxArtifactBytes || seenArtifacts.size > limits.maxArtifactRecords) return fail("GRAPH_READ_BUDGET") }; return bytes }
  const pending: Array<{ root: LabRoot; completed?: { kind: string; value: any; links: LabRoot[] } }> = [{ root: head }]
  while (pending.length) {
    const { root, completed } = pending.pop()!
    if (completed) { nodes.set(root, completed); active.delete(root); continue }
    if (nodes.has(root)) continue
    if (active.has(root) || nodes.size + active.size >= limits.maxArtifactRecords) return fail("GRAPH_CYCLE_OR_LIMIT")
    active.add(root)
    const descriptor = parse(read(root)), { root: domainRoot, ...body } = descriptor
    if (!same(Object.keys(descriptor).sort(), ["schemaVersion", "privacy", "root", "kind", "byteLength", "recordRoot", "chunkCount", "tailRoot", "links"].sort()) || descriptor.privacy !== "private_offline" || descriptor.schemaVersion !== "league-record-v1" || domainRoot !== labRoot("league-record-v1", body) || !Array.isArray(descriptor.links) || descriptor.links.length > 128 || !same(descriptor.links, [...new Set(descriptor.links)].sort()) || !Number.isSafeInteger(descriptor.byteLength) || descriptor.byteLength < 1 || descriptor.byteLength > limits.maxArtifactBytes || descriptor.chunkCount !== Math.ceil(descriptor.byteLength / 131072)) return fail("GRAPH_DESCRIPTOR")
    const bytes = new Uint8Array(descriptor.byteLength); let tail = descriptor.tailRoot, remaining = bytes.length
    for (let ordinal = descriptor.chunkCount - 1; ordinal >= 0; ordinal--) { const node = parse(read(tail)); if (node.schemaVersion !== "league-record-chunk-v1" || node.ordinal !== ordinal || !same(Object.keys(node).sort(), ["schemaVersion", "ordinal", "previousRoot", "bytesRoot", "byteLength"].sort())) return fail("GRAPH_CHUNK"); const chunk = read(node.bytesRoot); if (chunk.length !== node.byteLength || chunk.length !== (ordinal === descriptor.chunkCount - 1 ? bytes.length - ordinal * 131072 : 131072)) return fail("GRAPH_CHUNK_SIZE"); remaining -= chunk.length; bytes.set(chunk, remaining); tail = node.previousRoot }
    if (tail !== null || remaining !== 0 || bytesRoot(bytes) !== descriptor.recordRoot) return fail("GRAPH_BYTES")
    pending.push({ root, completed: { kind: descriptor.kind, value: parse(bytes), links: descriptor.links } })
    for (const dependency of [...descriptor.links].reverse()) pending.push({ root: dependency })
  }
  return nodes
}

export interface LeagueCandidateInput extends LeaguePortfolioCandidate { readonly admission: LeagueCandidateAdmission; readonly closure: FactoryCandidateClosure; readonly publicationRoot: LabRoot }
const indexFactory = (repository: FactoryRepository, allocation: LeagueExecutionAllocation) => {
  const byRoot = new Map<LabRoot, { artifactRoot: LabRoot; value: any }>(); let bytes = 0, records = 0
  for (const name of readdirSync(repository.directory).sort()) {
    const match = /^factory-artifact-([a-f0-9]{64})\.bin$/u.exec(name); if (!match) continue
    const artifactRoot = `sha256:${match[1]}` as LabRoot, raw = readFactoryArtifact(repository, artifactRoot)
    if ((bytes += raw.length) > allocation.operations.maxArtifactBytes || ++records > allocation.operations.maxArtifactRecords) return fail("FACTORY_READ_BUDGET")
    const parsed = admitCanonicalJsonBytes(raw, { profile: "canonical-manifest", operation: "require-canonical" })
    if (parsed.ok && parsed.value && typeof parsed.value === "object" && !Array.isArray(parsed.value) && "root" in parsed.value && typeof parsed.value.root === "string") byRoot.set(parsed.value.root as LabRoot, { artifactRoot, value: parsed.value })
  }
  return byRoot
}
export const readLeagueInitialCandidates = (repository: FactoryRepository, allocation: LeagueExecutionAllocation): readonly LeagueCandidateInput[] => {
  const index = indexFactory(repository, allocation), ledger = readRetainedFactoryLedger(repository)
  const assessments = allocation.factoryAssessmentArtifactRoots.map((artifactRoot) => ({ artifactRoot, value: parse(readFactoryArtifact(repository, artifactRoot)), verified: verifyHistoricalFactoryAssessmentForLeague(repository, artifactRoot) }))
  return allocation.initialCandidatePublicationRoots.map((publicationRoot) => {
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
    const closure = { factoryRepository: repository, candidatePublicationArtifactRoot: publicationRoot, sourceArtifactRoot: candidate.proposal.source.root, packetArtifactRoot: packet.artifactRoot, proposalArtifactRoot: proposal.artifactRoot, validationArtifactRoot: validation.artifactRoot }
    readFactoryArtifact(repository, closure.sourceArtifactRoot)
    return { admission, candidateAdmission: admission, closure, publicationRoot, factoryRepository: repository, fingerprintArtifactRoot: publication.independenceReceipt.evidenceArtifactRoot, importedAssessment: { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords, verifyRetainedAssessment: verifyHistoricalFactoryAssessmentForLeague } }
  })
}

export const prepareSeriousLeague = (input: unknown) => {
  const allocation = createLeagueExecutionAllocation(input as never)
  if (allocation.implementationRoot !== factoryAssessmentImplementationRoot()) return fail("STALE_IMPLEMENTATION")
  return allocation
}
export interface LeagueFixtureSeams { readonly candidates: readonly LeagueCandidateInput[]; readonly host: FactorySupervisedRuntimeHost; readonly run: typeof runCanonicalLabMatch; readonly produce?: typeof produceLeagueResponse }
export interface LeagueRunInput { readonly allocation: unknown; readonly allocationRoot: LabRoot; readonly repository: LeagueRepository; readonly factoryRepository: FactoryRepository; readonly responseFactoryRepository: FactoryRepository | null; readonly fixture?: LeagueFixtureSeams }
type MatchInput = Parameters<typeof runCanonicalLabMatch>[0]["match"]
const normalizedGameplay = (execution: LabMatchExecution): unknown => {
  if (execution.kind !== "completed") return fail("PROCESS_INVALID")
  const scrub = (value: unknown, parent = ""): unknown => Array.isArray(value) ? value.map((item) => scrub(item, parent)) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:memory|objective|private|matchId|revision|arenaId|arenaName)/iu.test(key) && !(parent === "arenaVariant" && ["id", "name"].includes(key))).map(([key, item]) => [key, scrub(item, key)])) : value
  return scrub({ state: execution.result.state, events: execution.result.events })
}
const conditionFor = (cell: LeagueCell, seed: string) => {
  const scenario = createSetScenarioV137({ arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion, arenaSemanticGeometryHash: cell.semanticGeometryHash, entrantA: { entrantKey: cell.entrantCandidateRoot, playerId: leaguePlayerId(cell.entrantCandidateRoot) }, entrantB: { entrantKey: cell.opponentCandidateRoot, playerId: leaguePlayerId(cell.opponentCandidateRoot) }, baseSeed: seed })
  return scenario.conditions.find((condition) => labRoot("league-condition-v1", { scenarioId: scenario.scenarioId, conditionId: condition.conditionId, requestIdentity: condition.requestIdentity, ordinal: condition.ordinal }) === cell.conditionRoot) ?? fail("CONDITION")
}
export class LeagueConnectedSession {
  readonly graph: LeagueRecordGraph
  readonly cells: Array<{ cell: LeagueCell; startRoot: LabRoot; terminal: LeagueCellTerminal; recordRoot: LabRoot; execution: LabMatchExecution; bottomCandidateRoot: LabRoot; topCandidateRoot: LabRoot }> = []
  readonly startTime = Date.now()
  responseMatchCharges = 0
  constructor(readonly input: LeagueRunInput, readonly allocation: LeagueExecutionAllocation, readonly budget?: LeagueRetentionBudget) { this.graph = new LeagueRecordGraph(input.repository, allocation.operations, budget) }
  async execute(cell: LeagueCell, bottom: LeagueCandidateInput, top: LeagueCandidateInput, seed: string, options: { baseCell?: LeagueCell; order?: "forward" | "reverse"; transform?: LeagueProbeFamily; arenaAlias?: boolean } = {}) {
    if (this.cells.length + this.responseMatchCharges >= this.allocation.opportunities.matches || Date.now() - this.startTime >= this.allocation.operations.wallClockMilliseconds) return fail("EXECUTION_BUDGET")
    const startValue = { cellRoot: cell.root, allocationRoot: this.allocation.root }, start = { ...startValue, root: labRoot("league-cell-start-v1", startValue) }
    recordLeagueCellStart(this.input.repository, start)
    const startRecord = this.graph.append("cell-start", { start, cell, bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root, seed, options })
    const runtimeRecords: LabRoot[] = [], opened: FactorySupervisionProvider[] = []
    const condition = conditionFor(options.baseCell ?? cell, seed), arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.semanticGeometryHash === cell.semanticGeometryHash && arena.status === "active") ?? fail("ARENA")
    const matchBase = { matchId: `league-${start.root.slice(7, 31)}`, seed: condition.baseSeed, arenaVariant: options.arenaAlias ? { ...arena, id: `alias-${arena.id}`, name: `alias-${arena.name}` } : arena, bottomPlayerId: leaguePlayerId(bottom.admission.candidate.root), topPlayerId: leaguePlayerId(top.admission.candidate.root), initialInitiativePlayerId: condition.initialInitiativePlayerId }
    let actual: LabMatchExecution | null = null
    try {
      const host: FactorySupervisedRuntimeHost = { createFactorySupervisedRuntime: (request) => {
        const { executableRoot: _executableRoot, ...runtimeInput } = request
        const provider = this.input.fixture ? this.input.fixture.host.createFactorySupervisedRuntime(request) : createFactorySupervisedRuntime({ ...runtimeInput, matchId: matchBase.matchId, containerName: `league-${start.root.slice(7, 25)}-${opened.length}`, ownershipLabel: `league-${this.allocation.root.slice(7, 25)}`, image: this.allocation.operations.image, invocationLimit: this.allocation.operations.perProviderInvocations, factoryLifetimeMs: this.allocation.operations.perMatchMilliseconds })
        opened.push(provider)
        const wrapped = wrapLeagueProbeProvider(provider, options.transform, arena.initialBounds, (value) => { runtimeRecords.push(this.graph.append("runtime-invocation", value, [startRecord])) }, (request) => this.graph.beforeInvocation(request))
        return { ...wrapped, close: () => { const closed = wrapped.close(); runtimeRecords.push(this.graph.append("runtime-cleanup", { identity: provider.identity, closed }, [startRecord])); return closed } }
      } }
      const issue = (candidate: LeagueCandidateInput) => issueLeagueProviderFromFactoryCandidate({ ...candidate.closure, host, cell, start, allocationRoot: this.allocation.root })
      const [issuedBottom, issuedTop] = options.order === "reverse" ? (() => { const t = issue(top), b = issue(bottom); return [b, t] as const })() : [issue(bottom), issue(top)] as const
      const match: MatchInput = { ...matchBase, bottomStrategyRevisionId: issuedBottom.identity.revisionId, topStrategyRevisionId: issuedTop.identity.revisionId }
      const terminal = await runLeagueCell({ repository: this.input.repository, start, cell, bottom: issuedBottom, top: issuedTop, requestRoot: cell.requestRoot, match, runCanonicalLabMatch: async (request) => { actual = await (this.input.fixture?.run ?? runCanonicalLabMatch)(request); return actual } })
      if (!actual) return fail("MISSING_EXECUTION")
      const recordRoot = this.graph.append("cell-result", { start, cell, match, terminal, execution: actual, bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root, seed, options }, [startRecord, ...runtimeRecords])
      const result = { cell, startRoot: start.root, terminal, recordRoot, execution: actual as LabMatchExecution, bottomCandidateRoot: bottom.admission.candidate.root, topCandidateRoot: top.admission.candidate.root }; this.cells.push(result)
      if (terminal.disposition !== "success") return fail("PROCESS_INVALID")
      return result
    } catch (error) {
      for (const provider of opened) { try { runtimeRecords.push(this.graph.append("runtime-cleanup", { identity: provider.identity, closed: provider.close() }, [startRecord])) } catch (error) { runtimeRecords.push(this.graph.append("runtime-cleanup-failure", { identity: provider.identity, error: error instanceof Error ? error.name : "unknown" }, [startRecord])) } }
      const evidenceRoot = this.graph.append("cell-issuance-failure", { start, cell, failure: error instanceof Error ? error.name : "unknown" }, [startRecord, ...runtimeRecords])
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
    const solver = solveLeagueSnapshot({ snapshot: admitted.snapshot, solverPayoffBytes: admitted.solverPayoffBytes })
    if (solver.status !== "solved") return fail("SOLVER")
    const recordRoot = this.graph.append("complete-matrix", { population, matrix, terminals: results.map((result) => result.terminal), snapshot: admitted.snapshot, solverPayoffBytes: new TextDecoder().decode(admitted.solverPayoffBytes), solver: { ...solver, canonicalBytes: new TextDecoder().decode(solver.canonicalBytes) } }, results.map((result) => result.recordRoot))
    return { population, matrix, admitted, solver, results, recordRoot }
  }
}
type CompleteMatrix = Awaited<ReturnType<LeagueConnectedSession["matrix"]>>
const scoreAgainst = (matrix: CompleteMatrix, candidateRoot: LabRoot, opponentRoot: LabRoot): { numerator: number; denominator: number } => {
  if (candidateRoot === opponentRoot) return { numerator: 1, denominator: 2 }
  const rows = matrix.results.filter((entry) => [entry.bottomCandidateRoot, entry.topCandidateRoot].includes(candidateRoot) && [entry.bottomCandidateRoot, entry.topCandidateRoot].includes(opponentRoot))
  if (rows.length !== 8) return fail("SCORE_COVERAGE")
  return { numerator: rows.reduce((sum, row) => sum + (row.cell.entrantCandidateRoot === candidateRoot ? row.terminal.projection!.halfPoints : 2 - row.terminal.projection!.halfPoints), 0), denominator: rows.length * 2 }
}
const mixtureScore = (matrix: CompleteMatrix, candidateRoot: LabRoot) => {
  let numerator = 0n, denominator = 1n
  const gcd = (a: bigint, b: bigint): bigint => b === 0n ? a : gcd(b, a % b)
  for (const weight of matrix.solver.weights) { const score = scoreAgainst(matrix, candidateRoot, weight.candidateRoot), n = BigInt(score.numerator) * BigInt(weight.numerator), d = BigInt(score.denominator) * BigInt(weight.denominator); numerator = numerator * d + n * denominator; denominator *= d; const g = gcd(numerator, denominator); numerator /= g; denominator /= g }
  if (numerator > BigInt(Number.MAX_SAFE_INTEGER) || denominator > BigInt(Number.MAX_SAFE_INTEGER)) return fail("SCORE_NUMERIC_RANGE")
  return { numerator: Number(numerator), denominator: Number(denominator) }
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
          const solved = solveLeagueSnapshot({ snapshot: replay.snapshot, solverPayoffBytes: replay.solverPayoffBytes, workerCount: reversed ? 3 : 1, shardOrder: reversed ? [2, 0, 1] : [0], restart: reversed ? 1 : 0 })
          if (solved.status !== "solved" || !same(solved.output, matrix.solver.output) || !same(Array.from(solved.canonicalBytes), Array.from(matrix.solver.canonicalBytes))) return fail("LAYOUT_SOLVER_IDENTITY")
          roots.push(session.graph.append("layout-verification", { roundRoot: round.round.root, family: policy.family, arm, cellResultRoot: result.recordRoot, matrixRoot: matrix.recordRoot, completionOrder: completionOrder.map((row) => row.terminal.root), snapshotRoot: replay.snapshot.root, payoffBytesRoot: bytesRoot(replay.solverPayoffBytes), solverBytesRoot: bytesRoot(solved.canonicalBytes), workerCount: reversed ? 3 : 1, shardOrder: reversed ? [2, 0, 1] : [0], restart: reversed ? 1 : 0 }, [result.recordRoot, matrix.recordRoot]))
        }
        const halfPoints = (result.cell.entrantCandidateRoot === candidate.admission.candidate.root ? result.terminal.projection!.halfPoints : 2 - result.terminal.projection!.halfPoints) as 0 | 1 | 2
        observations.push({ canonicalBytes: bytesRoot(encode(normalizedGameplay(result.execution))), halfPoints, conditionRoot: ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(policy.family) ? leftBase.cell.conditionRoot : cell.conditionRoot, evidenceRoot: result.recordRoot })
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
const reserveRun = (repository: LeagueRepository, allocation: LeagueExecutionAllocation) => {
  const bytes = encode(rooted("league-allocation-start-v1", { allocation })), artifactRoot = bytesRoot(bytes)
  repository.beforePublication?.({ target: resolve(repository.directory, `league-artifact-${artifactRoot.slice(7)}.bin`), byteLength: bytes.length, terminal: false })
  // A durable exclusive content-addressed marker consumes this allocation once.
  // A crash or a partial marker never creates permission to rerun it.
  const descriptor = openSync(resolve(repository.directory, `league-artifact-${artifactRoot.slice(7)}.bin`), "wx", 0o600)
  try { let offset = 0; while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset, bytes.length - offset); fsyncSync(descriptor) } finally { closeSync(descriptor) }
  repository.durability.syncDirectory(repository.directory)
  return artifactRoot
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
const selectionFor = (matrix: CompleteMatrix, candidates: readonly LeagueCandidateInput[], blocks: readonly RoundBlock[], ledger: RedTeamLedger, production: readonly Awaited<ReturnType<typeof produceLeagueResponse>>[], allocation: LeagueExecutionAllocation) => {
  const mixture = createLeagueMixture({ snapshotRoot: matrix.admitted.snapshot.root, solverOutputRoot: matrix.solver.output.root, weightRoot: matrix.solver.output.distributionRoot }), portfolio = deriveLeaguePortfolio({ snapshotRoot: matrix.admitted.snapshot.root, mixture, candidates })
  const byCandidate = new Map(candidates.map((candidate) => [candidate.admission.candidate.root, candidate])), byAdmission = new Map(candidates.map((candidate) => [candidate.admission.root, candidate]))
  const independentScores = (role: "validation_opponent" | "independent_probe_opponent") => production.filter((attempt) => attempt.evaluationRole === role && attempt.comparisons.length === candidates.length && attempt.comparisons.every((row) => row.relation === "distinct")).flatMap((attempt) => attempt.scores.map((score) => ({ candidateAdmissionRoot: byCandidate.get(score.opponentRoot)!.admission.root, conditionRoot: labRoot("league-independent-score-condition-v1", { role, seed: score.seed, opponentAdmissionRoot: attempt.admission.root }), numerator: score.denominator - score.numerator, denominator: score.denominator, evidenceRoot: attempt.recordRoot })))
  const responseRows = independentScores("validation_opponent"), probeRows = independentScores("independent_probe_opponent")
  const redTeamRows = production.filter((attempt) => attempt.evaluationRole === "development_response").flatMap((attempt) => attempt.scores.map((score) => ({ candidateAdmissionRoot: byCandidate.get(score.opponentRoot)!.admission.root, conditionRoot: labRoot("league-red-team-score-condition-v1", { seed: score.seed, responseRoot: attempt.admission.root }), numerator: score.numerator, denominator: score.denominator, evidenceRoot: attempt.recordRoot })))
  const invarianceRows = ledger.probes.filter((probe) => !["semantic_arena_identity", "worker_shard_completion"].includes(probe.family)).map((probe) => ({ candidateAdmissionRoot: byCandidate.get(probe.candidateRoot)!.admission.root, probe: probe.family === "horizontal_symmetry" ? "symmetry" : probe.family === "repeat_restart" ? "repeat" : probe.family, observations: probe.pairs.length, mismatches: probe.passed ? 0 : 1, evidenceRoot: probe.root }))
  const terminalRows = candidates.flatMap((candidate) => ["legality", "privacy", "runtime"].map((boundary) => ({ candidateAdmissionRoot: candidate.admission.root, boundary, disposition: "success", processValidity: "process_valid", evidenceRoot: matrix.recordRoot })))
  const worstCases = portfolio.portfolio.candidateAdmissionRoots.flatMap((candidate) => portfolio.portfolio.candidateAdmissionRoots.map((opponent) => ({ candidateAdmissionRoot: candidate, opponentAdmissionRoot: opponent, ...scoreAgainst(matrix, byAdmission.get(candidate)!.admission.candidate.root, byAdmission.get(opponent)!.admission.candidate.root), evidenceRoot: matrix.recordRoot })))
  const iterations = candidates.flatMap((candidate) => allocation.rounds.map((schedule) => {
    const selected = blocks.filter((block) => block.round.roundOrdinal === schedule.ordinal && block.candidateRoots.includes(candidate.admission.candidate.root)), roundRoots = selected.map((block) => block.round.round.root), starts = ledger.starts.filter((start) => roundRoots.includes(start.roundRoot))
    return { candidateAdmissionRoot: candidate.admission.root, ordinal: schedule.ordinal, allocationRoot: allocation.root, blocks: selected.map((block) => ({ seed: block.seed, roundRoot: block.round.round.root, targetRoot: block.round.target.root, snapshotRoot: block.matrix.admitted.snapshot.root, conditionRoots: block.matrix.matrix.cells.map((entry) => entry.cell.conditionRoot), terminalRoots: block.matrix.results.map((row) => row.terminal.root), ...mixtureScore(block.matrix, candidate.admission.candidate.root) })), responseTerminals: ledger.terminals.filter((terminal) => starts.some((start) => start.root === terminal.startRoot)).map((terminal) => ({ root: terminal.root, disposition: terminal.disposition, processValidity: terminal.processValidity })) }
  }))
  const evidence = rooted("league-selection-evidence-v4", { snapshotRoot: matrix.admitted.snapshot.root, populationRoot: matrix.population.root, policyRoot: LAB_ADMITTED_ROOTS.measurementPolicyRoot, solverOutputRoot: matrix.solver.output.root, allocationRoot: allocation.root, seedBlocks: allocation.seedBlocks, iterations, responseRows, probeRows, redTeamRows, invarianceRows, terminalRows, worstCases })
  const dispositions = portfolio.portfolio.candidateAdmissionRoots.map((candidateAdmissionRoot) => selectRobustPure({ snapshotRoot: matrix.admitted.snapshot.root, populationRoot: matrix.population.root, mixture, portfolio: portfolio.portfolio, candidateAdmissionRoot, evidence, population: matrix.population, populationCandidates: candidates }))
  return { mixture, portfolio, evidence, dispositions, finalist: dispositions.find((row) => row.kind === "robust_pure_finalist") ?? dispositions[0]! }
}
const reportProjection = (matrix: CompleteMatrix, candidates: readonly LeagueCandidateInput[], blocks: readonly RoundBlock[], ledger: RedTeamLedger, closed: ReturnType<typeof closeRedTeamLedger>, reentries: readonly LeagueResponseRow[], selection: ReturnType<typeof selectionFor>, allocation: LeagueExecutionAllocation) => ({
  population: { root: matrix.population.root, candidates: candidates.map((candidate) => candidate.admission.root), evidenceClass: allocation.evidenceClass }, conditions: matrix.matrix.cells.map((row) => row.cell.conditionRoot), semanticArenas: [...new Set(matrix.matrix.cells.map((row) => row.cell.semanticGeometryHash))], oracleFamilies: [...new Set(candidates.map((candidate) => candidate.admission.candidate.proposal.oracleFamily))], policyRoots: [allocation.studyPolicyRoot, allocation.measurementPolicyRoot], tupleRoot: allocation.tupleRoot, runtimeRoot: allocation.runtimeRoot, allocationLedger: closed.capacity, iterationCurves: blocks.map((block) => ({ round: block.round.roundOrdinal, population: block.candidateRoots.length, snapshot: block.matrix.admitted.snapshot.root })), payoffMatrix: [matrix.recordRoot], distributions: matrix.solver.weights, bestResponseGraph: reentries.map((row) => ({ round: row.roundRoot, candidate: row.candidateAdmissionRoot, disposition: row.disposition })), pureWorstCases: selection.evidence.worstCases, responseGaps: selection.evidence.responseRows, attempts: ledger.terminals.map((terminal) => ({ root: terminal.root, disposition: terminal.disposition, charge: terminal.charge })),
})

/** Complete source composition. The only execution seams are explicitly marked
 * injected fixtures; the command-line path never accepts a runtime provider. */
export const runSeriousLeague = async (input: LeagueRunInput) => {
  const allocation = admitLeagueExecutionAllocation(input.allocation)
  if (allocation.root !== input.allocationRoot || allocation.implementationRoot !== factoryAssessmentImplementationRoot() || input.fixture && allocation.evidenceClass !== "injected_fixture" || !input.fixture && allocation.evidenceClass !== "empirical") return fail("RUN_AUTHORITY")
  if (allocation.outputDirectories.league !== input.repository.directory || allocation.outputDirectories.responseFactory !== (input.responseFactoryRepository?.directory ?? null)) return fail("OUTPUT_BINDING")
  let candidates = [...(input.fixture?.candidates ?? readLeagueInitialCandidates(input.factoryRepository, allocation))]
  if (!same(candidates.map((candidate) => candidate.publicationRoot).sort(), allocation.initialCandidatePublicationRoots) || new Set(candidates.map((candidate) => candidate.admission.candidate.root)).size !== candidates.length) return fail("INITIAL_POPULATION")
  for (const candidate of candidates) { LeagueCandidateAdmissionSchema.parse(candidate.admission); if (readCandidateClosure(candidate.closure).candidate.root !== candidate.admission.candidate.root) return fail("INITIAL_CLOSURE") }
  const jobs = allocation.rounds.flatMap((round) => round.jobs)
  if (jobs.length && (!input.responseFactoryRepository || input.responseFactoryRepository.directory === input.factoryRepository.directory || candidates.some((candidate) => candidate.factoryRepository.directory === input.responseFactoryRepository!.directory))) return fail("SEPARATE_RESPONSE_REPOSITORY")
  for (const job of jobs) { preflightLeagueAuthoring({ allocation, jobId: job.id, repository: input.responseFactoryRepository! }); if (job.operation === "produce" && job.reservation.matches < allocation.seedBlocks.length * allocation.operations.maxPopulation * 24) return fail("RESPONSE_MATCH_COVERAGE") }
  if (reopenLeagueEvidence(input.repository, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords }).records.length) return fail("NONEMPTY_RUN_REPOSITORY")
  const budget = new LeagueRetentionBudget(allocation)
  input = { ...input, repository: { ...input.repository, beforePublication: budget.beforePublication }, responseFactoryRepository: input.responseFactoryRepository ? { ...input.responseFactoryRepository, beforePublication: budget.beforePublication } : null }
  const markerRoot = reserveRun(input.repository, allocation), session = new LeagueConnectedSession(input, allocation, budget), roots: LabRoot[] = [], blocks: RoundBlock[] = [], reentries: LeagueResponseRow[] = [], production: Array<Awaited<ReturnType<typeof produceLeagueResponse>>> = [], requiredTargets: Array<{ roundRoot: LabRoot; candidateRoot: LabRoot }> = []
  roots.push(session.graph.append("run-start", { allocation, markerRoot, candidates: candidates.map(candidateRecord), factoryDirectory: input.factoryRepository.directory, responseFactoryDirectory: input.responseFactoryRepository?.directory ?? null }))
  let ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  const startsByJob = new Map<string, LabRoot>(), completedJobs: string[] = []
  try {
    const initial: CompleteMatrix[] = []
    for (const seed of allocation.seedBlocks) { const matrix = await session.matrix(candidates, seed); initial.push(matrix); roots.push(matrix.recordRoot) }
    let currentMatrices = initial
    for (const schedule of allocation.rounds) {
      const roundBlocks = currentMatrices.map((matrix, i) => ({ seed: allocation.seedBlocks[i]!, matrix, round: declareLeagueRound({ snapshot: matrix.admitted.snapshot, solver: matrix.solver, responseAllocationRoot: labRoot("league-round-allocation-v1", { allocationRoot: allocation.root, ordinal: schedule.ordinal, seed: allocation.seedBlocks[i] }), roundOrdinal: schedule.ordinal, maximumRounds: allocation.rounds.length, closureRule: "bounded-no-accepted-counter-v1" }), candidateRoots: candidates.map((candidate) => candidate.admission.candidate.root) }))
      const primary = roundBlocks[0]!, accepted: LeagueCandidateInput[] = [], roundReentries: LeagueResponseRow[] = []
      for (const block of roundBlocks) { blocks.push(block); roots.push(session.graph.append("declared-round", { seed: block.seed, round: block.round, candidateRoots: block.candidateRoots }, [block.matrix.recordRoot])); const probe = await runRoundProbes(session, block.matrix, candidates, block.round, block.seed, ledger); ledger = probe.ledger; roots.push(...probe.roots); requiredTargets.push(...candidates.map((candidate) => ({ roundRoot: block.round.round.root, candidateRoot: candidate.admission.candidate.root }))) }
      for (const job of schedule.jobs.filter((job) => job.evaluationRole === "development_response")) {
        const repository = input.responseFactoryRepository!, before = Date.now()
        ledger = startRedTeamAttempt({ ledger, channel: job.channel, roundRoot: primary.round.round.root, candidateRoot: primary.round.target.strongestPureCandidateRoot, participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: job.retryParentJobId === null ? null : startsByJob.get(job.retryParentJobId) ?? fail("RETRY_PARENT"), reservation: job.reservation })
        const start = ledger.starts.at(-1)!, startArtifactRoot = publishFactoryArtifact(repository, encode(start)); startsByJob.set(job.id, start.root)
        roots.push(session.graph.append("red-team-start", { jobId: job.id, start, startArtifactRoot, ledgerRoot: ledger.root }))
        if (job.operation !== "produce") { const evidenceRoot = session.graph.append("red-team-unfilled", { jobId: job.id, operation: job.operation, reason: "prospectively_allocated_disposition" }); roots.push(evidenceRoot); ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: job.operation, usage: zeroUsage(), evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }) }
        else {
          const targetArtifactRoot = publishFactoryArtifact(repository, encode({ roundRoot: start.roundRoot, candidateRoot: start.candidateRoot, targets: roundBlocks.map((block) => ({ seed: block.seed, target: block.round.target, weights: block.matrix.solver.weights })), candidates: targetSources(repository, candidates) }))
          const imported = candidates.find((candidate) => candidate.admission.importEvidence) ?? fail("NUMERIC_MEASUREMENT_REQUIRED"), threshold = { repository: imported.factoryRepository, artifactRoot: imported.admission.importEvidence!.thresholdArtifactRoot }
          session.responseMatchCharges += job.reservation.matches
          let produced: Awaited<ReturnType<typeof produceLeagueResponse>>
          try { produced = await (input.fixture?.produce ?? produceLeagueResponse)({ allocation, job, start, startArtifactRoot, repository, targetArtifactRoot, remainingWallMilliseconds: allocation.operations.wallClockMilliseconds - (Date.now() - session.startTime), opponents: candidates.map((candidate) => ({ candidateRoot: candidate.admission.candidate.root, closure: candidate.closure })), threshold, retention: session.graph }) } catch (error) { const evidenceRoot = session.graph.append("red-team-process-failure", { jobId: job.id, startRoot: start.root }); roots.push(evidenceRoot); ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }); throw error }
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
        const advanced = advanceLeagueRound({ round: primary.round, admissions: roundReentries, requestClosure: false, nextPopulationRoot: currentMatrices[0]!.population.root, nextSnapshot: currentMatrices[0]!.admitted.snapshot }); roots.push(session.graph.append("round-advance", { round: primary.round, admissions: roundReentries, requestClosure: false, nextPopulationRoot: currentMatrices[0]!.population.root, nextSnapshot: currentMatrices[0]!.admitted.snapshot, advanced }))
      } else { const advanced = advanceLeagueRound({ round: primary.round, admissions: [], requestClosure: schedule.ordinal === allocation.rounds.length - 1 }); roots.push(session.graph.append("round-advance", { round: primary.round, admissions: [], requestClosure: schedule.ordinal === allocation.rounds.length - 1, advanced })) }
    }
    // These independently frozen packets are authored without any development
    // target, trace, mixture or probe feedback. Only the coordinator measures
    // them against the now-final population, after all adaptation has ended.
    for (const job of jobs.filter((job) => job.evaluationRole !== "development_response")) {
      const repository = input.responseFactoryRepository!, before = Date.now(), roundRoot = labRoot("league-independent-evaluation-v1", { allocationRoot: allocation.root, role: job.evaluationRole, snapshotRoots: currentMatrices.map((matrix) => matrix.admitted.snapshot.root) })
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
        } catch (error) { const evidenceRoot = session.graph.append("red-team-process-failure", { jobId: job.id, startRoot: start.root }); roots.push(evidenceRoot); ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }); throw error }
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
      const report = publishLeagueReport({ repository: input.repository, snapshot: matrix.admitted.snapshot, solverManifest: matrix.solver.manifest, solver: matrix.solver.output, mixture: selection.mixture, portfolio: selection.portfolio.portfolio, redTeamRoot: closed.root, finalistDisposition: selection.finalist, reopen: reopened, projection }); reports.push(report); roots.push(session.graph.append("report", { report, matrixRoot: matrix.recordRoot, selectionRoot, projection }, [matrix.recordRoot, selectionRoot, ledgerRoot]))
    }
    const value = { evidenceClass: allocation.evidenceClass, allocationRoot: allocation.root, completedJobs, processValidity: "process_valid", result: reports.length ? "bounded_league_complete" : "process_failure", candidates: candidates.map(candidateRecord), matrixRoots: currentMatrices.map((matrix) => matrix.recordRoot), reports, ledgerRoot, executedCells: session.cells.length, reservedResponseMatches: session.responseMatchCharges }
    const headRoot = session.graph.append("run-complete", value, roots)
    return { ...value, headRoot, empiricalRequirementsComplete: false }
  } catch (error) {
    for (const start of ledger.starts.filter((start) => !ledger.terminals.some((terminal) => terminal.startRoot === start.root))) {
      const evidenceRoot = session.graph.append("red-team-process-failure", { startRoot: start.root, error: error instanceof Error ? error.message : "unknown" }); roots.push(evidenceRoot)
      ledger = terminalizeRedTeamAttempt({ ledger, startRoot: start.root, disposition: "system_failure", usage: null, evidenceRoots: [evidenceRoot], candidateAdmissionRoot: null }); roots.push(session.graph.append("red-team-terminal", { startRoot: start.root, terminal: ledger.terminals.at(-1), ledgerRoot: ledger.root }, [evidenceRoot]))
    }
    const headRoot = session.graph.append("run-failure", { allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_invalid", completedJobs, ledgerRoot: ledger.root, error: error instanceof Error ? error.message.slice(0, 512) : "unknown", executedCells: session.cells.length, retentionUsage: budget.usage })
    return { headRoot, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_invalid" as const, empiricalRequirementsComplete: false }
  }
}

/** Replay retained responses through the pure canonical kernel. This performs
 * no Strategy invocation, creates no runtime capability and writes no files. */
const replayRetainedKernel = (match: MatchInput, execution: LabMatchExecution, empirical: boolean) => {
  if (execution.kind !== "completed" || "maxPhases" in match || execution.accounting.some((entry) => !entry.result.ok)) return fail("RETAINED_EXECUTION")
  let machine = MATCH_KERNEL.createMachineV119(match)
  if (machine.initialState.soldiers.length !== 16) return fail("CANONICAL_START")
  if (!empirical) return
  if (!execution.transitions.length || !execution.accounting.length || execution.transitions.length > 1010000) return fail("EMPIRICAL_KERNEL_COVERAGE")
  let invocation = 0, completed = false
  for (let ordinal = 0; ordinal < execution.transitions.length; ordinal++) {
    let next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (next.kind === "effect") {
      const evidence = execution.accounting[invocation++], request = next.request
      if (!evidence || evidence.requestId !== request.requestId || evidence.method !== request.kind || evidence.inputRoot !== labRoot("runtime-input", request.input) || !evidence.completed || !evidence.charged || !evidence.result.ok) return fail("RETAINED_INVOCATION")
      next = MATCH_KERNEL.stepMatch(next.machine, { kind: "runtime_resume", requestId: request.requestId, effectKind: request.kind, classification: "success", value: evidence.result.value })
    }
    if (next.kind === "effect" || next.kind === "failure" || !same(next.record, execution.transitions[ordinal])) return fail("RETAINED_TRANSITION")
    machine = next.machine
    if (next.kind === "completed") { if (ordinal !== execution.transitions.length - 1) return fail("RETAINED_TRAILING_TRANSITIONS"); completed = true }
  }
  if (!completed || invocation !== execution.accounting.length || !same({ state: machine.state, events: execution.transitions.flatMap((transition) => transition.events) }, execution.result)) return fail("RETAINED_COMPLETION")
}

export const verifyRetainedSeriousLeague = (input: { repository: LeagueRepository; factoryRepository: FactoryRepository; responseFactoryRepository: FactoryRepository | null; headRoot: LabRoot; allocationRoot: LabRoot; limits: { maxArtifactBytes: number; maxArtifactRecords: number }; fixtureCandidates?: readonly LeagueCandidateInput[] }) => {
  const graph = readLeagueRecordGraph(input.repository, input.headRoot, input.limits), head = graph.get(input.headRoot) ?? fail("HEAD"), nodes = [...graph.entries()], rows = (kind: string) => nodes.filter(([, node]) => node.kind === kind)
  const starts = rows("run-start")
  if (starts.length !== 1 || !["run-complete", "run-failure"].includes(head.kind)) return fail("RUN_GRAPH")
  const initial = starts[0]![1].value, allocation = admitLeagueExecutionAllocation(initial.allocation), marker = parse(readLeagueArtifact(input.repository, initial.markerRoot))
  if (allocation.root !== input.allocationRoot || head.value.allocationRoot !== allocation.root || head.value.evidenceClass !== allocation.evidenceClass || allocation.operations.maxArtifactBytes > input.limits.maxArtifactBytes || allocation.operations.maxArtifactRecords > input.limits.maxArtifactRecords || input.fixtureCandidates && allocation.evidenceClass !== "injected_fixture" || !same(marker, rooted("league-allocation-start-v1", { allocation }))) return fail("RETAINED_ALLOCATION")
  const imported = input.fixtureCandidates ?? readLeagueInitialCandidates(input.factoryRepository, allocation), importedMap = new Map(imported.map((candidate) => [candidate.admission.root, candidate]))
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
  const finalCandidates = (head.kind === "run-complete" ? head.value.candidates : initial.candidates).map(restoreCandidate), candidateAdmissions = new Map(finalCandidates.map((candidate: LeagueCandidateInput) => [candidate.admission.root, candidate.admission]))
  const reopened = reopenLeagueEvidence(input.repository, { maxBytes: input.limits.maxArtifactBytes, maxRecords: input.limits.maxArtifactRecords }), cellResults = rows("cell-result"), cellByRoot = new Map(cellResults.map(([recordRoot, node]) => [node.value.cell.root, { recordRoot, ...node.value }]))
  if (reopened.remnants.length || head.kind === "run-complete" && (reopened.records.length !== cellResults.length || cellResults.length !== head.value.executedCells)) return fail("RETAINED_JOURNAL_COVERAGE")
  for (const [recordRoot, node] of cellResults) {
    const value = node.value, journal = reopened.records.find((row) => row.start.root === value.start.root)
    if (!journal || journal.terminalProvenance !== "persisted" || !same(journal.start, value.start) || !same(journal.terminal, value.terminal) || value.start.allocationRoot !== allocation.root || !node.links.some((link) => graph.get(link)?.kind === "cell-start")) return fail("RETAINED_CELL_JOURNAL")
    replayRetainedKernel(value.match, value.execution, allocation.evidenceClass === "empirical")
    const projection = projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution: value.execution, entrantCandidateRoot: value.cell.entrantCandidateRoot, bottomCandidateRoot: value.bottomCandidateRoot, topCandidateRoot: value.topCandidateRoot, bottomPlayerId: value.match.bottomPlayerId, topPlayerId: value.match.topPlayerId, cellRoot: value.cell.root, conditionRoot: value.cell.conditionRoot, semanticGeometryHash: value.cell.semanticGeometryHash, resultEventRoot: labRoot("league-result-events-v1", value.execution.result.events) })
    if (!same(projection, value.terminal.projection) || value.terminal.disposition !== "success") return fail("RETAINED_PAYOFF")
    const invocations = rows("runtime-invocation").filter(([, invocation]) => invocation.value.originalEvidence?.identity?.attemptRoot === value.start.root)
    verifyRetainedLeagueProbeInvocations(invocations.map(([, row]) => row.value), value.execution.accounting, value.options.transform, value.match.arenaVariant.initialBounds)
    void recordRoot
  }
  const matrices = new Map<LabRoot, CompleteMatrix>()
  for (const [recordRoot, node] of rows("complete-matrix")) {
    const value = node.value, admissions = value.population.candidateAdmissionRoots.map((root: LabRoot) => candidateAdmissions.get(root) ?? fail("RETAINED_POPULATION")), firstCell = cellByRoot.get(value.matrix.cells[0]?.cell.root) ?? fail("RETAINED_MATRIX_CELLS")
    const matrix = enumerateLeagueCells({ population: value.population, candidateAdmissions: admissions, tupleRoot: allocation.tupleRoot, runtimeRoot: allocation.runtimeRoot, baseSeed: firstCell.seed })
    if (!same(matrix, value.matrix)) return fail("RETAINED_MATRIX_ENUMERATION")
    const results = matrix.cells.map((row) => cellByRoot.get(row.cell.root) ?? fail("RETAINED_MATRIX_MISSING")), terminals = results.map((row) => row.terminal), admitted = admitCompletePayoffSnapshot(matrix, terminals)
    if (admitted.kind !== "complete" || !same(terminals, value.terminals) || !same(admitted.snapshot, value.snapshot) || new TextDecoder().decode(admitted.solverPayoffBytes) !== value.solverPayoffBytes) return fail("RETAINED_MATRIX_TRANSPORT")
    const solver = solveLeagueSnapshot({ snapshot: admitted.snapshot, solverPayoffBytes: admitted.solverPayoffBytes, workerCount: 3, shardOrder: [2, 0, 1], restart: 1 })
    if (solver.status !== "solved" || !same({ ...solver, canonicalBytes: new TextDecoder().decode(solver.canonicalBytes) }, value.solver)) return fail("RETAINED_SOLVER")
    matrices.set(recordRoot, { population: value.population, matrix, admitted, solver, results, recordRoot })
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
    const solved = solveLeagueSnapshot({ snapshot: replay.snapshot, solverPayoffBytes: replay.solverPayoffBytes, workerCount: value.workerCount, shardOrder: value.shardOrder, restart: value.restart })
    if (solved.status !== "solved" || value.snapshotRoot !== replay.snapshot.root || value.payoffBytesRoot !== bytesRoot(replay.solverPayoffBytes) || value.solverBytesRoot !== bytesRoot(solved.canonicalBytes) || !same(solved.output, matrix.solver.output)) return fail("RETAINED_LAYOUT_IDENTITY")
  }
  if (head.kind === "run-failure") return { issued: false as const, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_invalid" as const, headRoot: input.headRoot, empiricalRequirementsComplete: false }
  if (blocks.length !== allocation.seedBlocks.length * allocation.rounds.length || allocation.rounds.some((round) => allocation.seedBlocks.some((seed) => blocks.filter((block) => block.seed === seed && block.round.roundOrdinal === round.ordinal).length !== 1))) return fail("RETAINED_ROUND_COVERAGE")
  const closings = rows("red-team-close")
  if (closings.length !== 1 || closings[0]![0] !== head.value.ledgerRoot) return fail("RETAINED_CLOSE")
  const close = closings[0]![1].value
  let ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  const scheduled = allocation.rounds.flatMap((round) => round.jobs)
  if (!same(head.value.completedJobs, scheduled.map((job) => job.id)) || close.ledger.starts.length !== scheduled.length) return fail("RETAINED_JOB_COVERAGE")
  for (const [index, start] of close.ledger.starts.entries()) {
    const { root: _root, allocationRoot: _allocationRoot, ordinal: _ordinal, ...body } = start, job = scheduled[index]
    if (!job || job.id !== rows("red-team-start").find(([, node]) => node.value.start.root === start.root)?.[1].value.jobId || job.producerRequestArtifactRoot !== start.inputRoot || !same(job.reservation, start.reservation)) return fail("RETAINED_JOB_BINDING")
    ledger = startRedTeamAttempt({ ledger, ...body }); if (!same(ledger.starts.at(-1), start)) return fail("RETAINED_START")
    const terminal = close.ledger.terminals.find((row: any) => row.startRoot === start.root) ?? fail("RETAINED_TERMINAL"), { root: _terminalRoot, charge: _charge, processValidity: _processValidity, ...terminalBody } = terminal
    ledger = terminalizeRedTeamAttempt({ ledger, ...terminalBody }); if (!same(ledger.terminals.at(-1), terminal)) return fail("RETAINED_TERMINAL")
  }
  for (const probe of close.ledger.probes) {
    if (["source_order", "worker_shard_completion"].includes(probe.family)) for (const pair of probe.pairs) for (const arm of ["left", "right"] as const) if (rows("layout-verification").filter(([, node]) => node.value.roundRoot === probe.roundRoot && node.value.family === probe.family && node.value.arm === arm && node.value.cellResultRoot === pair[arm].evidenceRoot).length !== 1) return fail("RETAINED_LAYOUT_PROBE_COVERAGE")
    const pairs = probe.pairs.map((pair: any) => Object.fromEntries(["left", "right"].map((arm) => { const observed = pair[arm], node = graph.get(observed.evidenceRoot); if (!node || node.kind !== "cell-result") return fail("RETAINED_PROBE_CELL"); const value = node.value, halfPoints = value.cell.entrantCandidateRoot === probe.candidateRoot ? value.terminal.projection.halfPoints : 2 - value.terminal.projection.halfPoints, conditionRoot = ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"].includes(probe.family) ? value.options.baseCell.conditionRoot : value.cell.conditionRoot; return [arm, { canonicalBytes: bytesRoot(encode(normalizedGameplay(value.execution))), halfPoints, conditionRoot, evidenceRoot: observed.evidenceRoot }] })))
    if (!same(pairs, probe.pairs)) return fail("RETAINED_PROBE_OBSERVATION")
    ledger = recordLeagueProbe({ ledger, family: probe.family, roundRoot: probe.roundRoot, candidateRoot: probe.candidateRoot, pairs }); if (!same(ledger.probes.at(-1), probe)) return fail("RETAINED_PROBE")
  }
  const production = rows("response-production-result").map(([recordRoot, node]) => ({ ...node.value, recordRoot })).sort((a, b) => ledger.starts.findIndex((start) => start.root === a.author.startRoot) - ledger.starts.findIndex((start) => start.root === b.author.startRoot)), verifiedAssessments = new Map<LabRoot, any>(), acceptedByRound = new Map<number, typeof production>()
  if (production.length !== scheduled.filter((job) => job.operation === "produce").length) return fail("RETAINED_PRODUCTION_COVERAGE")
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
    verifyRetainedLeagueResponse({ allocation, repository: input.responseFactoryRepository, produced, opponents: candidates.map((candidate: LeagueCandidateInput) => ({ candidateRoot: candidate.admission.candidate.root, closure: candidate.closure })), threshold: { repository: imported.factoryRepository, artifactRoot: imported.admission.importEvidence!.thresholdArtifactRoot }, records: graph })
    const accepted = acceptedByRound.get(schedule.ordinal) ?? [], duplicate = [...candidates, ...accepted].some((candidate: LeagueCandidateInput) => candidate.admission.candidate.proposal.source.root === produced.admission.candidate.proposal.source.root), independent = produced.comparisons.length === candidates.length && produced.comparisons.every((row: any) => row.relation === "distinct"), scores = roundBlocks.map((entry) => responseScores(produced, entry)), positive = scores.every((rows) => rows.every((score) => BigInt(score.numerator) * 100n > BigInt(score.denominator) * 55n)), eligible = !duplicate && independent && positive && accepted.length < schedule.acceptedSlots
    const assessment = { targetRoot: block.round.target.root, fingerprintEvidenceRoot: produced.fingerprintArtifactRoot, independentCounterfactualRelations: produced.comparisons.map((row: any) => row.relation === "unresolved" ? "borderline" : row.relation), existingCandidateRoots: block.candidateRoots, completeTargetScores: scores[0]! }, expected = { jobId: job.id, startRoot: start.root, producedRoot: produced.recordRoot, scores, duplicate, independent, positive, eligible, assessment }, retained = rows("red-team-assessment").filter(([, row]) => row.value.startRoot === start.root)
    if (retained.length !== 1 || !same(retained[0]![1].value, expected) || ledger.terminals.find((terminal) => terminal.startRoot === start.root)?.disposition !== (eligible ? "success" : duplicate ? "duplicate" : "legal_but_weak")) return fail("RETAINED_RESPONSE_ASSESSMENT")
    if (eligible) { accepted.push(produced); acceptedByRound.set(schedule.ordinal, accepted); verifiedAssessments.set(start.root, assessment) }
  }
  const reentries = rows("counter-reentry").map(([, node]) => { const row = node.value; if (!same(row.assessment, verifiedAssessments.get(row.startRoot))) return fail("RETAINED_REENTRY_ASSESSMENT"); const admission = reenterAcceptedCounter({ ledger, startRoot: row.startRoot, round: row.round, candidateAdmission: row.candidateAdmission, assessment: row.assessment }); if (!same(admission, row.reentry)) return fail("RETAINED_REENTRY"); return admission })
  const requiredTargets = blocks.flatMap((block) => block.candidateRoots.map((candidateRoot) => ({ roundRoot: block.round.round.root, candidateRoot }))), closed = closeRedTeamLedger({ ledger, requiredTargets, reentries })
  if (!same(ledger, close.ledger) || !same(closed, close.closed) || closed.processValidity !== "process_valid") return fail("RETAINED_RED_TEAM_CLOSE")
  for (const [, node] of rows("round-advance")) { const { advanced, ...request } = node.value; if (!same(advanceLeagueRound(request), advanced)) return fail("RETAINED_ADVANCE") }
  for (const [, node] of rows("response-match-result")) replayRetainedKernel(node.value.match, node.value.execution, allocation.evidenceClass === "empirical")
  for (const [, node] of rows("selection")) {
    const value = node.value, matrix = [...matrices.values()].find((matrix) => matrix.admitted.snapshot.root === value.mixture.snapshotRoot) ?? fail("RETAINED_SELECTION_MATRIX"), selected = selectionFor(matrix, finalCandidates, blocks, ledger, production, allocation)
    const { candidates: _candidates, ...prior } = value
    if (!same(selected, prior)) return fail("RETAINED_SELECTION")
  }
  const reportSeed = (value: any) => cellByRoot.get(matrices.get(value.matrixRoot)!.matrix.cells[0]!.cell.root)?.seed
  const reports = rows("report").sort(([, a], [, b]) => allocation.seedBlocks.indexOf(reportSeed(a.value)) - allocation.seedBlocks.indexOf(reportSeed(b.value)))
  if (reports.length !== allocation.seedBlocks.length || !same(reports.map(([, node]) => node.value.report), head.value.reports) || !same(reports.map(([, node]) => node.value.matrixRoot), head.value.matrixRoots) || !same(reports.map(([, node]) => reportSeed(node.value)), allocation.seedBlocks) || rows("selection").length !== reports.length) return fail("RETAINED_REPORT_COVERAGE")
  for (const [, node] of reports) {
    const value = node.value, reopenedReport = reopenLeagueReport({ repository: input.repository, descriptor: value.report.descriptor, maxBytes: input.limits.maxArtifactBytes, maxRecords: input.limits.maxArtifactRecords }), selection = graph.get(value.selectionRoot)?.value
    const matrix = matrices.get(value.matrixRoot)
    if (!matrix || !selection || !same(matrix.population.candidateAdmissionRoots, finalCandidates.map((candidate: LeagueCandidateInput) => candidate.admission.root).sort()) || !same(value.projection, reportProjection(matrix, finalCandidates, blocks, ledger, closed, reentries, selection, allocation)) || value.report.descriptor.finalistDispositionRoot !== selection.finalist.root || reopenedReport.chunks.length !== 1 || reopenedReport.chunks[0]!.root !== value.report.reportRoot || !same(reopenedReport.chunks[0]!.report.projection, value.projection)) return fail("RETAINED_REPORT")
  }
  return { issued: false as const, allocationRoot: allocation.root, evidenceClass: allocation.evidenceClass, processValidity: "process_valid" as const, headRoot: input.headRoot, empiricalRequirementsComplete: false }
}

export const seriousLeagueHelp = `Usage:
  run-v1-38-serious-league prepare --allocation <complete-canonical-input.json>
  run-v1-38-serious-league run --allocation <rooted-canonical-allocation.json> --allocation-root <sha256:...> --repository <league-directory> --factory-repository <factory-directory> [--response-factory-repository <factory-directory>]
  run-v1-38-serious-league verify-retained --allocation <rooted-canonical-allocation.json> --allocation-root <sha256:...> --repository <league-directory> --factory-repository <factory-directory> [--response-factory-repository <factory-directory>] --head-root <sha256:...>
Private current-rules league only. No allocation, participant, provider, or resource defaults.
prepare prints the immutable allocation but never dispatches. run accepts empirical allocations only.
verify-retained is read-only and never invokes a Strategy, producer, model or runtime.`
export const seriousLeagueMain = async (args: readonly string[]) => {
  if (args.length === 1 && args[0] === "--help") return seriousLeagueHelp
  const [mode, ...rest] = args, options = new Map<string, string>(), allowed = new Set(["--allocation", "--allocation-root", "--repository", "--factory-repository", "--response-factory-repository", "--head-root"])
  if (!["prepare", "run", "verify-retained"].includes(String(mode)) || rest.length % 2) return fail("ARGUMENTS")
  for (let i = 0; i < rest.length; i += 2) { const name = rest[i]!, value = rest[i + 1]!; if (!allowed.has(name) || options.has(name) || !value || value.startsWith("--")) return fail("ARGUMENTS"); options.set(name, value) }
  const required = (name: string) => options.get(name) ?? fail("ARGUMENTS"), value = parse(readFileSync(resolve(required("--allocation"))))
  if (mode === "prepare") { if (options.size !== 1) return fail("ARGUMENTS"); return new TextDecoder().decode(encode(prepareSeriousLeague(value))) }
  const allocation = admitLeagueExecutionAllocation(value), allocationRoot = required("--allocation-root") as LabRoot
  if (allocation.root !== allocationRoot || mode === "run" && allocation.evidenceClass !== "empirical" || mode === "run" && options.has("--head-root")) return fail("RUN_AUTHORITY")
  const repository = createLeagueRepository(resolve(required("--repository"))), factoryRepository = createFactoryRepository(resolve(required("--factory-repository"))), responseFactoryRepository = options.has("--response-factory-repository") ? createFactoryRepository(resolve(required("--response-factory-repository"))) : null
  const result = mode === "run" ? await runSeriousLeague({ allocation, allocationRoot, repository, factoryRepository, responseFactoryRepository }) : verifyRetainedSeriousLeague({ allocationRoot, repository, factoryRepository, responseFactoryRepository, headRoot: required("--head-root") as LabRoot, limits: allocation.operations })
  return JSON.stringify(result)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void seriousLeagueMain(process.argv.slice(2)).then((result) => process.stdout.write(`${result}\n`)).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "SERIOUS_LEAGUE_FAILURE"}\n`); process.exitCode = 1 })
