import { StrategyInputV119Schema, SoldierBrainInputV119Schema, StrategyResultSchema, SoldierBrainResultSchema } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { LeagueProbeFamily } from "../../packages/strategy-lab/src/league/red-team.js"

const fail = (code: string): never => { throw new TypeError(`LEAGUE_PROBE_RUNTIME_${code}`) }
/** Legal observation/output coordinate transformations; the Match kernel is untouched.
 * Memory remains opaque in the Strategy's observed frame for the entire Match. */
const createProbeProjection = (family: LeagueProbeFamily | undefined, bounds: { minX: number; maxX: number }) => {
  const changed = ["horizontal_symmetry", "opaque_ids", "soldier_order"].includes(String(family)), ids = new Map<string, string>(), originals = new Map<string, string>()
  const translate = (value: unknown, reverse = false, key = ""): any => {
    if (/(?:memory|objective)/iu.test(key)) return structuredClone(value)
    if (Array.isArray(value)) { const items = value.map((entry) => translate(entry, reverse, key)); return family === "soldier_order" && !reverse && ["soldiers", "mySoldiers", "enemySoldiers"].includes(key) ? items.reverse() : items }
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, translate(item, reverse, name)]))
    if (family === "horizontal_symmetry") {
      if (typeof value === "number" && ["x", "absoluteX"].includes(key)) return bounds.minX + bounds.maxX - value
      if (typeof value === "number" && key === "dx") return -value
      if (typeof value === "string" && ["facing", "direction", "lastSuccessfulMoveDirection"].includes(key)) return value === "LEFT" ? "RIGHT" : value === "RIGHT" ? "LEFT" : value
    }
    if (family === "opaque_ids" && typeof value === "string" && (key === "id" || /Id$/u.test(key))) {
      if (reverse) return originals.get(value) ?? fail("UNKNOWN_OPAQUE_ID")
      let opaque = ids.get(value)
      if (!opaque) { opaque = `opaque-${String(ids.size + 1).padStart(5, "0")}`; ids.set(value, opaque); originals.set(opaque, value) }
      return opaque
    }
    return value
  }
  return {
    dispatch(request: Parameters<FactorySupervisionProvider["invoke"]>[0]) {
      const translatedInput = changed ? translate(request.input) : request.input
      const validated = request.kind === "selectActivations" ? StrategyInputV119Schema.parse(translatedInput) : SoldierBrainInputV119Schema.parse(translatedInput)
      return changed ? freezeLabValue({ ...request, input: validated }) as typeof request : request
    },
    admit(request: Parameters<FactorySupervisionProvider["invoke"]>[0], evidence: LabRuntimeEvidence): LabRuntimeEvidence {
      if (!changed) return evidence
      const result = evidence.result.ok ? { ok: true as const, value: request.kind === "selectActivations" ? StrategyResultSchema.parse(translate(evidence.result.value, true)) : SoldierBrainResultSchema.parse(translate(evidence.result.value, true)) } : evidence.result
      return freezeLabValue({ ...evidence, inputRoot: labRoot("runtime-input", request.input), invocationRoot: labRoot("league-probe-invocation-v1", { family, originalRoot: evidence.invocationRoot, inputRoot: labRoot("runtime-input", request.input), result }), result }) as LabRuntimeEvidence
    },
  }
}
export const wrapLeagueProbeProvider = (provider: FactorySupervisionProvider, family: LeagueProbeFamily | undefined, bounds: { minX: number; maxX: number }, retain: (value: unknown) => void, beforeInvocation?: (request: unknown) => void): FactorySupervisionProvider => {
  const projection = createProbeProjection(family, bounds), issued = new WeakMap<object, LabRuntimeEvidence>()
  return {
    identity: provider.identity,
    async invoke(request, identity) {
      beforeInvocation?.(request)
      const dispatched = projection.dispatch(request)
      const evidence = await provider.invoke(dispatched, identity)
      if (!provider.verify(evidence)) return fail("UNISSUED_EVIDENCE")
      const wrapped = projection.admit(request, evidence)
      retain({ family: family ?? null, request, dispatched, originalEvidence: evidence, admittedEvidence: wrapped })
      issued.set(wrapped, evidence)
      return wrapped
    },
    verify(evidence) { const original = issued.get(evidence); return original !== undefined && provider.verify(original) },
    close() { return provider.close() },
  }
}
/** Data-only replay of the exact input/output projection; no host capability. */
export const verifyRetainedLeagueProbeInvocations = (values: readonly any[], accounting: readonly LabRuntimeEvidence[], family: LeagueProbeFamily | undefined, bounds: { minX: number; maxX: number }) => {
  const projections = new Map<LabRoot, ReturnType<typeof createProbeProjection>>(), byRoot = new Map(values.map((row) => [row.admittedEvidence.invocationRoot, row])), same = (a: unknown, b: unknown) => labRoot("league-probe-read-binding", a) === labRoot("league-probe-read-binding", b)
  if (values.length !== accounting.length || byRoot.size !== values.length) return fail("RETAINED_RAW_COVERAGE")
  for (const evidence of accounting) {
    const row = byRoot.get(evidence.invocationRoot) ?? fail("RETAINED_RAW_ACCOUNTING"), identityRoot = labRoot("league-probe-read-identity", evidence.identity), projection = projections.get(identityRoot) ?? createProbeProjection(family, bounds)
    projections.set(identityRoot, projection)
    if (row.family !== (family ?? null) || !same(evidence, row.admittedEvidence) || !same(evidence.identity, row.originalEvidence.identity) || row.originalEvidence.requestId !== row.request.requestId || row.originalEvidence.method !== row.request.kind || row.originalEvidence.inputRoot !== labRoot("runtime-input", row.dispatched.input) || !same(projection.dispatch(row.request), row.dispatched) || !same(projection.admit(row.request, row.originalEvidence), evidence)) return fail("RETAINED_RAW_PROJECTION")
  }
  return { issued: false as const }
}
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata, admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { admitLeagueExecutionAllocation, type LeagueExecutionAllocation, type LeagueResponseJob } from "../../packages/strategy-lab/src/league/allocation.js"
import { readCandidateClosure, type FactoryCandidateClosure, type FactorySupervisedRuntimeHost } from "../../packages/strategy-lab/src/league/connected-runner.js"
import { createLeagueProducedCandidateAdmission } from "../../packages/strategy-lab/src/league/contracts.js"
import { admitFactory, authorizeFactorySupervision, superviseFactory, mapFactorySupervision, finalizeFactoryCandidate, deriveFactoryExecutionCommitment, type FactorySupervisionReceipt } from "../../packages/strategy-lab/src/factory/admission.js"
import { factoryProposalFromPacket, FactoryValidationEvidenceSchema, FactoryCandidateSchema } from "../../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryValidationRoot, deriveFactoryCandidateRoot } from "../../packages/strategy-lab/src/factory/identity.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../../packages/strategy-lab/src/factory/ledger.js"
import { readFactoryArtifact, publishFactoryArtifact, recordFactoryAttemptStart, publishFactoryAttemptTerminal, type FactoryRepository } from "../../packages/strategy-lab/src/factory/repository.js"
import { publishFactorySupervisionArtifacts, readFactorySupervisionArtifactRecords } from "../../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { createFactoryGraphNodeArtifact, createLeagueAuthorizedFactoryFingerprintEvidence as issueLeagueFingerprint, deriveFactoryFingerprints, verifyRetainedLeagueFactoryFingerprints } from "../../packages/strategy-lab/src/factory/fingerprint.js"
import { compareNumericEvidence, freezeNumericCalibrationThreshold, classifyNumericComparison, type NumericCalibrationEvidence } from "../../packages/strategy-lab/src/factory/numeric-calibration.js"
import { runCanonicalLabMatch } from "../../packages/strategy-lab/src/runtime-bridge.js"
import type { RedTeamAttemptStart } from "../../packages/strategy-lab/src/league/red-team.js"
import { createNumericObservationFromVerifiedCell } from "../v1-38-factory-observations.js"
import { readFactoryIngestion } from "../ingest-v1-38-factory-packet.js"
import { executeLeagueAuthoring, verifyRetainedLeagueAuthoring, type LeagueAuthoringResult } from "./v1-38-league-authoring.js"
import { createFactorySupervisedRuntime } from "./v1-38-factory-supervised-runtime.js"
import { lstatSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const encode = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); return admitted.ok ? admitted.canonicalBytes : fail("CANONICAL") }
const read = (repository: FactoryRepository, artifactRoot: LabRoot): any => { const admitted = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" }); return admitted.ok ? admitted.value : fail("ARTIFACT") }
export interface LeagueResponseOpponent { readonly candidateRoot: LabRoot; readonly closure: FactoryCandidateClosure }
export interface LeagueResponseRetention { append(kind: string, value: unknown, links?: readonly LabRoot[]): LabRoot; beforeInvocation(request: unknown): void }
export const enumerateLeagueResponseConditions = (allocation: LeagueExecutionAllocation, opponentRoots: readonly LabRoot[]) => {
  admitLeagueExecutionAllocation(allocation)
  if (!opponentRoots.length || new Set(opponentRoots).size !== opponentRoots.length) return fail("RESPONSE_OPPONENTS")
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter((arena) => arena.status === "active" && arena.schedulable)
  if (arenas.length !== 2) return fail("RESPONSE_ARENAS")
  let ordinal = 0
  return opponentRoots.flatMap((opponentRoot) => allocation.seedBlocks.flatMap((seed) => arenas.flatMap((arena, arenaIndex) => (["bottom", "top"] as const).flatMap((side) => (["candidate", "opponent"] as const).flatMap((initial) => (["score", "independence_left", "independence_right"] as const).map((purpose) => ({ ordinal: ordinal++, opponentRoot, seed, arena: arena.semanticGeometryHash, arenaIndex, side, initial, purpose, referencePublicationRoot: allocation.independenceReferencePublicationRoot })))))))
}
export interface LeagueResponseProductionInput {
  readonly allocation: LeagueExecutionAllocation; readonly job: LeagueResponseJob; readonly start: RedTeamAttemptStart; readonly startArtifactRoot: LabRoot
  readonly remainingWallMilliseconds: number
  readonly repository: FactoryRepository; readonly targetArtifactRoot: LabRoot; readonly opponents: readonly LeagueResponseOpponent[]
  readonly threshold: { readonly repository: FactoryRepository; readonly artifactRoot: LabRoot }
  readonly retention: LeagueResponseRetention
  readonly fixture?: { readonly host: FactorySupervisedRuntimeHost; readonly run: typeof runCanonicalLabMatch; readonly author: typeof executeLeagueAuthoring }
}
const aggregateObservations = (rows: readonly NumericCalibrationEvidence[]): NumericCalibrationEvidence => {
  if (!rows.length || rows.some((row) => row.sourceUtf8 !== rows[0]!.sourceUtf8)) return fail("OBSERVATIONS")
  // Missing graph dimensions remain uninformative; no identity hash is converted
  // into a concrete lineage/dependency edge or a claim of independence.
  return { sourceUtf8: rows[0]!.sourceUtf8, lineageEdgeTokens: [], dependencyEdgeTokens: [], legalInputSamples: Object.assign({}, ...rows.map((row) => row.legalInputSamples)), chronicleSamples: Object.assign({}, ...rows.map((row) => row.chronicleSamples)), matchupSamples: Object.assign({}, ...rows.map((row) => row.matchupSamples)) }
}
const retainedObservation = (repository: FactoryRepository, allocation: LeagueExecutionAllocation, artifactRoot: LabRoot, sourceUtf8: string, condition: ReturnType<typeof enumerateLeagueResponseConditions>[number]): NumericCalibrationEvidence => {
  const retained = readFactorySupervisionArtifactRecords(repository, artifactRoot, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords })
  const row = createNumericObservationFromVerifiedCell({ sourceUtf8, cell: { key: `league:${condition.ordinal + 1}`, block: condition.arenaIndex === 0 ? "block-a" : "block-b", candidateSide: condition.side, initialInitiative: condition.initial }, lineageEdges: [], dependencyEdges: [], records: retained.records }).evidence
  const samples = (value: Readonly<Record<string, readonly string[]>>) => Object.fromEntries(Object.entries(value).map(([key, tokens]) => [`${condition.seed}:${condition.side}:${key}`, tokens]))
  return { ...row, legalInputSamples: samples(row.legalInputSamples), chronicleSamples: samples(row.chronicleSamples), matchupSamples: samples(row.matchupSamples) }
}

/** Fresh generation has its own pre-work factory charge. It never consumes or
 * rewrites an imported Phase 264 attempt. Every comparison runs both admitted
 * sources in fresh factory-supervised runtimes against the current population. */
export const produceLeagueResponse = async (input: LeagueResponseProductionInput) => {
  const allocation = admitLeagueExecutionAllocation(input.allocation), job = allocation.rounds.flatMap((round) => round.jobs).find((job) => job.id === input.job.id)
  if (!Number.isSafeInteger(input.remainingWallMilliseconds) || input.remainingWallMilliseconds < 1 || input.remainingWallMilliseconds > allocation.operations.wallClockMilliseconds) return fail("RESPONSE_WALL_BUDGET")
  if (!job || labRoot("league-job-binding", job) !== labRoot("league-job-binding", input.job) || input.fixture && allocation.evidenceClass !== "injected_fixture" || job.operation !== "produce" || input.start.inputRoot !== job.producerRequestArtifactRoot) return fail("RESPONSE_ALLOCATION")
  const neededMatches = allocation.seedBlocks.length * input.opponents.length * 24
  if (job.reservation.matches < neededMatches || !input.opponents.length || new Set(input.opponents.map((opponent) => opponent.candidateRoot)).size !== input.opponents.length) return fail("RESPONSE_MATCH_BUDGET")
  const opponents = input.opponents.map((opponent) => { const value = readCandidateClosure(opponent.closure); if (value.candidate.root !== opponent.candidateRoot) return fail("OPPONENT_BINDING"); return { ...opponent, ...value } })
  const conditions = enumerateLeagueResponseConditions(allocation, opponents.map((opponent) => opponent.candidateRoot))
  const reference = opponents.find((opponent) => opponent.closure.candidatePublicationArtifactRoot === allocation.independenceReferencePublicationRoot) ?? fail("INDEPENDENCE_REFERENCE")
  const thresholdRecord = read(input.threshold.repository, input.threshold.artifactRoot), fit = freezeNumericCalibrationThreshold(thresholdRecord.controls)
  if (fit.status !== "frozen" || labRoot("league-threshold-binding", fit.threshold) !== labRoot("league-threshold-binding", thresholdRecord.threshold)) return fail("THRESHOLD")
  const start = createFactoryAttemptStart({ taskRoot: allocation.root, budgetRoot: allocation.root, candidateRoot: job.producerRequestArtifactRoot, inputRoot: job.producerRequestArtifactRoot, resourceAccountingRoot: input.start.root, retryParentRoot: null, authoringMechanism: job.channel === "human" ? "human-submission" : job.channel === "external" ? "external-submission" : "automated-oracle" })
  recordFactoryAttemptStart(input.repository, start)
  const before = Date.now(), records: LabRoot[] = [input.retention.append("response-production-start", { start, redTeamStart: input.start, job, targetArtifactRoot: input.targetArtifactRoot })]
  let author: LeagueAuthoringResult | null = null, matchCount = 0
  let accepted: { terminal: ReturnType<typeof createFactoryAttemptTerminal>; closure: Omit<FactoryCandidateClosure, "factoryRepository"> } | null = null
  try {
    author = await (input.fixture?.author ?? executeLeagueAuthoring)({ repository: input.repository, allocation, jobId: job.id, startArtifactRoot: input.startArtifactRoot, ...(job.evaluationRole === "development_response" ? { targetArtifactRoot: input.targetArtifactRoot } : {}) })
    records.push(input.retention.append("response-authoring", author, records.slice(-1)))
    if (author.disposition !== "produced" || !author.ingestionArtifactRoot) return fail("RESPONSE_AUTHORING")
    const ingestion = readFactoryIngestion(input.repository, author.ingestionArtifactRoot), sourceBytes = new TextEncoder().encode(ingestion.sourceUtf8), proposal = factoryProposalFromPacket(ingestion.packet)
    const defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: ingestion.sourceUtf8, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== proposal.source.root.slice(7) || revision.sourceBytes !== proposal.source.byteLength) return fail("RESPONSE_VALIDATION")
    const validationBinding = { proposalRoot: proposal.root, sourceRoot: proposal.source.root, revisionId: revision.id, validation: revision.validation, exactNativeLane: proposal.nativeLane }
    const validationValue = { schemaVersion: "factory-validation-evidence-v1" as const, privacy: "private_offline" as const, proposalRoot: proposal.root, validationRoot: labRoot("factory-selected-source-validation-v1", validationBinding), status: "valid" as const, exactNativeLane: proposal.nativeLane, evidenceRoot: input.retention.append("response-validation", validationBinding, records) }
    const validation = FactoryValidationEvidenceSchema.parse({ ...validationValue, root: deriveFactoryValidationRoot(validationValue) }), admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: ingestion.packet, proposal, sourceBytes, repository: input.repository }), validation, repository: input.repository })
    const receipts: FactorySupervisionReceipt[] = [], comparisons: any[] = [], scores: Array<{ seed: string; opponentRoot: LabRoot; numerator: number; denominator: number; evidenceRoots: LabRoot[] }> = []
    const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter((arena) => arena.status === "active" && arena.schedulable)
    if (arenas.length !== 2) return fail("RESPONSE_ARENAS")
    for (const opponent of opponents) {
      const left: NumericCalibrationEvidence[] = [], right: NumericCalibrationEvidence[] = []
      for (const seed of allocation.seedBlocks) {
        let halfPoints = 0; const scoreEvidence: LabRoot[] = []
        for (const condition of conditions.filter((row) => row.opponentRoot === opponent.candidateRoot && row.seed === seed)) {
          const { arenaIndex, side, initial, purpose } = condition, arena = arenas[arenaIndex]!
          if (Date.now() - before >= Math.min(input.remainingWallMilliseconds, allocation.operations.perAttemptMilliseconds, job.reservation.effortMilliseconds) || matchCount >= job.reservation.matches) return fail("RESPONSE_BUDGET")
          const matchCharge = { parentStartRoot: start.root, ordinal: matchCount++, seed, opponentRoot: opponent.candidateRoot, arena: arena.semanticGeometryHash, side, initial, purpose, referencePublicationRoot: reference.closure.candidatePublicationArtifactRoot }, chargeRoot = input.retention.append("response-match-start", matchCharge, records.slice(0, 1)); records.push(chargeRoot)
          const matchId = `league-response-${chargeRoot.slice(7, 31)}`, candidatePlayerId = "league-response-candidate", opponentPlayerId = "league-response-opponent"
          const opposing = purpose === "score" ? opponent : reference
          const otherAdmission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: opposing.packet, proposal: opposing.proposal, sourceBytes: opposing.sourceBytes, repository: input.repository }), validation: opposing.validation, repository: input.repository })
          const measuredAdmission = purpose === "independence_right" ? authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: opponent.packet, proposal: opponent.proposal, sourceBytes: opponent.sourceBytes, repository: input.repository }), validation: opponent.validation, repository: input.repository }) : admission
          const measuredBytes = purpose === "independence_right" ? opponent.sourceBytes : sourceBytes
          const opened: FactorySupervisionProvider[] = [], invocationRecords: LabRoot[] = []
          const create = (bound: typeof admission, bytes: Uint8Array) => {
            const built = buildStrategyRevision({ source: new TextDecoder().decode(bytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
            if (!built.metadata.sourceArtifact || !built.validation.valid) return fail("RESPONSE_EXECUTABLE")
            // The measured source binds to the authoring charge; the opposing
            // runtime binds to this already-retained Match charge. Self-play
            // against the fixed reference must not alias two provider identities.
            const attemptRoot = opened.length === 0 ? input.start.root : chargeRoot
            const request = { admission: bound, sourceBytes: bytes, attemptRoot, budgetRoot: allocation.root, executableRoot: `sha256:${built.metadata.sourceArtifact.hash}` as LabRoot }
            const provider = input.fixture ? input.fixture.host.createFactorySupervisedRuntime(request) : createFactorySupervisedRuntime({ admission: bound, sourceBytes: bytes, attemptRoot, budgetRoot: allocation.root, matchId, containerName: `${matchId}-${opened.length}`, ownershipLabel: `league-${allocation.root.slice(7, 25)}`, image: allocation.operations.image, invocationLimit: allocation.operations.perProviderInvocations, factoryLifetimeMs: allocation.operations.perMatchMilliseconds })
            opened.push(provider)
            if (provider.identity.executableRoot !== request.executableRoot || provider.identity.sourceRoot !== bound.sourceRoot || provider.identity.factoryProposalRoot !== bound.proposalRoot || provider.identity.attemptRoot !== attemptRoot || provider.identity.budgetRoot !== allocation.root) return fail("RESPONSE_PROVIDER")
            const wrapped = wrapLeagueProbeProvider(provider, undefined, arena.initialBounds, (value) => { invocationRecords.push(input.retention.append("response-runtime-invocation", value, [chargeRoot])) }, (request) => input.retention.beforeInvocation(request))
            return { ...wrapped, invoke: async (request, identity) => {
              try { return await wrapped.invoke(request, identity) } catch (error) {
                invocationRecords.push(input.retention.append("response-runtime-invocation-failure", { identity: provider.identity, request, error: error instanceof Error ? error.name : "unknown" }, [chargeRoot]))
                throw error
              }
            } } satisfies FactorySupervisionProvider
          }
          try {
            const candidateProvider = create(measuredAdmission, measuredBytes), otherProvider = create(otherAdmission, opposing.sourceBytes)
            const match = { matchId, seed, arenaVariant: arena, bottomPlayerId: side === "bottom" ? candidatePlayerId : opponentPlayerId, topPlayerId: side === "top" ? candidatePlayerId : opponentPlayerId, bottomStrategyRevisionId: side === "bottom" ? candidateProvider.identity.revisionId : otherProvider.identity.revisionId, topStrategyRevisionId: side === "top" ? candidateProvider.identity.revisionId : otherProvider.identity.revisionId, initialInitiativePlayerId: initial === "candidate" ? candidatePlayerId : opponentPlayerId }
            let otherReceipt: FactorySupervisionReceipt | undefined
            const receipt = await superviseFactory(measuredAdmission, candidatePlayerId, { match, providers: { [candidatePlayerId]: candidateProvider, [opponentPlayerId]: otherProvider } }, async (request) => {
              otherReceipt = await superviseFactory(otherAdmission, opponentPlayerId, request, async (runtimeRequest) => {
                const execution = await (input.fixture?.run ?? runCanonicalLabMatch)(runtimeRequest)
                if (execution.kind === "failure") records.push(input.retention.append("response-match-execution-failure", { matchCharge, match, execution }, [chargeRoot, ...invocationRecords]))
                return execution
              })
              return otherReceipt.execution
            })
            if (!otherReceipt) return fail("RESPONSE_OTHER_RECEIPT")
            const stored = publishFactorySupervisionArtifacts(input.repository, receipt), otherStored = publishFactorySupervisionArtifacts(input.repository, otherReceipt)
            const resultRoot = input.retention.append("response-match-result", { matchCharge, match, candidateReceiptArtifactRoot: stored.artifactRoot, opponentReceiptArtifactRoot: otherStored.artifactRoot, execution: receipt.execution }, [chargeRoot, ...invocationRecords]); records.push(resultRoot)
            if (mapFactorySupervision(receipt).disposition !== "accepted" || mapFactorySupervision(otherReceipt).disposition !== "accepted" || receipt.execution.kind !== "completed") return fail("RESPONSE_MATCH_PROCESS")
            if (purpose === "score") { receipts.push(receipt); scoreEvidence.push(resultRoot) }
            const outcome = receipt.execution.result.state.outcome
            if (purpose === "score") halfPoints += outcome?.type === "DRAW" ? 1 : outcome?.type === "WIN" && outcome.winnerPlayerId === candidatePlayerId ? 2 : 0
            if (purpose === "independence_left") left.push(retainedObservation(input.repository, allocation, stored.artifactRoot, ingestion.sourceUtf8, condition))
            if (purpose === "independence_right") right.push(retainedObservation(input.repository, allocation, stored.artifactRoot, new TextDecoder().decode(opponent.sourceBytes), condition))
          } finally {
            let failed = false
            for (const provider of opened) {
              let cleanup: unknown
              try { const value = provider.close(); cleanup = value; failed ||= !value.cleanupComplete || value.orphanedChild } catch (error) { cleanup = { error: error instanceof Error ? error.name : "unknown" }; failed = true }
              records.push(input.retention.append("response-runtime-cleanup", { identity: provider.identity, cleanup }, [chargeRoot, ...invocationRecords]))
            }
            if (failed) return fail("RESPONSE_CLEANUP")
          }
        }
        scores.push({ seed, opponentRoot: opponent.candidateRoot, numerator: halfPoints, denominator: 16, evidenceRoots: scoreEvidence })
      }
      const leftEvidence = aggregateObservations(left), rightEvidence = aggregateObservations(right), comparison = compareNumericEvidence(leftEvidence, rightEvidence), relation = classifyNumericComparison(comparison, fit.threshold)
      const evidenceRoot = input.retention.append("response-numeric-comparison", { leftEvidence, rightEvidence, comparison, relation, thresholdArtifactRoot: input.threshold.artifactRoot, opponentRoot: opponent.candidateRoot }, records)
      comparisons.push({ opponentRoot: opponent.candidateRoot, opponentProposalRoot: opponent.proposal.root, comparison, relation, evidenceRoot })
    }
    const receipt = receipts[0] ?? fail("RESPONSE_SUPERVISION"), lineageNodes = [{ root: proposal.root, parents: [] as LabRoot[], artifactRoot: createFactoryGraphNodeArtifact(input.repository, { kind: "lineage", nodeRoot: proposal.root, links: [] }) }], dependencyNodes = [{ root: proposal.source.root, dependencies: [] as LabRoot[], artifactRoot: createFactoryGraphNodeArtifact(input.repository, { kind: "dependency", nodeRoot: proposal.source.root, links: [] }) }]
    const allocationArtifactRoot = publishFactoryArtifact(input.repository, encode(allocation))
    verifyRetainedLeagueAuthoring(input.repository, allocation, author.evidenceArtifactRoot)
    const createLeagueAuthorizedFactoryFingerprintEvidence = (value: Parameters<typeof issueLeagueFingerprint>[0]) => issueLeagueFingerprint({ ...value, authoringArtifactRoot: author!.evidenceArtifactRoot })
    const evidence = createLeagueAuthorizedFactoryFingerprintEvidence({ repository: input.repository, allocationArtifactRoot, startArtifactRoot: input.startArtifactRoot, supervisionReceipt: receipt, value: { proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: receipt.root, producerIdentity: ingestion.producerIdentity, origin: ingestion.origin, evidenceClass: "real_producer", producerArtifactRoot: author.ingestionArtifactRoot, authorshipRoots: [ingestion.root], lineageNodes, dependencyNodes, matchupResponses: receipts.map((row) => { if (row.matchup.status !== "verified") return fail("RESPONSE_MATCHUP"); return { supervisionReceiptRoot: row.root, conditionRoot: row.matchup.conditionRoot, opponentRoot: row.matchup.opponentRoot, side: row.matchup.side, initialInitiative: row.matchup.initialInitiative, outcome: row.execution.kind === "completed" && row.execution.result.state.outcome?.type === "DRAW" ? "draw" as const : row.execution.kind === "completed" && row.execution.result.state.outcome?.type === "WIN" ? (row.execution.result.state.outcome.winnerPlayerId === row.candidatePlayerId ? row.matchup.side : row.matchup.side === "bottom" ? "top" as const : "bottom" as const) : "failure" as const, responseRoot: labRoot("league-response-execution-v1", deriveFactoryExecutionCommitment(row.execution)) } }), counterfactualPairs: comparisons.map((entry) => ({ leftRoot: proposal.root, rightRoot: entry.opponentProposalRoot, relation: entry.relation === "unresolved" ? "borderline" : entry.relation })), failureModes: ["accepted"] } })
    const fingerprintArtifactRoot = publishFactoryArtifact(input.repository, encode(evidence)), independence = deriveFactoryFingerprints({ repository: input.repository, supervisionReceipt: receipt, pairedSupervisionReceipts: receipts, evidence, evidenceArtifactRoot: fingerprintArtifactRoot })
    const candidateValue = { schemaVersion: "factory-candidate-v1" as const, privacy: "private_offline" as const, proposal, validation, supervisionReceiptRoot: receipt.root, fingerprints: independence.fingerprints, lineage: proposal.lineage }, candidate = FactoryCandidateSchema.parse({ ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) })
    const publication = finalizeFactoryCandidate({ receipt, independenceReceipt: independence, candidate, repository: input.repository })
    const terminal = createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: candidate.root, validationRoot: validation.root, duplicateEvidenceRoot: input.retention.append("response-independence", { comparisons, scores, thresholdArtifactRoot: input.threshold.artifactRoot }, records), finalEvidenceRoot: author.evidenceArtifactRoot }); publishFactoryAttemptTerminal(input.repository, start, terminal)
    const closure = { factoryRepository: input.repository, candidatePublicationArtifactRoot: publication.artifactRoot, sourceArtifactRoot: admission.artifacts.source, packetArtifactRoot: admission.artifacts.packet, proposalArtifactRoot: admission.artifacts.proposal, validationArtifactRoot: admission.artifacts.validation }
    const { factoryRepository: _repository, ...retainedClosure } = closure
    accepted = { terminal, closure: retainedClosure }
    const candidateAdmission = createLeagueProducedCandidateAdmission({ candidate, supervisionReceiptRoot: receipt.root, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", candidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", candidate.lineage), tupleRoot: allocation.tupleRoot, runtimeRoot: allocation.runtimeRoot, provenanceRoot: input.start.provenanceRoot, attemptStart: start, attemptTerminal: terminal, productionEvidence: { allocationRoot: allocation.root, redTeamStartRoot: input.start.root, authoringArtifactRoot: author.evidenceArtifactRoot } })
    const result = { disposition: "produced" as const, evaluationRole: job.evaluationRole, admission: candidateAdmission, candidateAdmission, closure, publicationRoot: publication.artifactRoot, factoryRepository: input.repository, allocationArtifactRoot, startArtifactRoot: input.startArtifactRoot, targetArtifactRoot: input.targetArtifactRoot, fingerprintArtifactRoot, comparisons, scores, author, matchCount }
    const recordRoot = input.retention.append("response-production-result", { ...result, factoryRepository: input.repository.directory, closure: { ...closure, factoryRepository: input.repository.directory } }, records)
    return { ...result, recordRoot }
  } catch (error) {
    const evidenceRoot = input.retention.append("response-production-failure", { start, author, matchCount, accepted, error: error instanceof Error ? error.message : "unknown" }, records)
    if (!accepted) { const terminal = createFactoryAttemptTerminal({ startRoot: start.root, disposition: "system_failure", outputRoot: null, validationRoot: evidenceRoot, duplicateEvidenceRoot: evidenceRoot, finalEvidenceRoot: evidenceRoot }); publishFactoryAttemptTerminal(input.repository, start, terminal) }
    throw error
  }
}

/** Recompute response decisions from the retained full three-arm schedule.
 * This reader does not invoke the author, compiler, provider, or Match runner. */
export const verifyRetainedLeagueResponse = (input: {
  allocation: LeagueExecutionAllocation; repository: FactoryRepository; produced: any; opponents: readonly LeagueResponseOpponent[]
  threshold: { repository: FactoryRepository; artifactRoot: LabRoot }
  records: ReadonlyMap<LabRoot, { kind: string; value: any; links: readonly LabRoot[] }>
}) => {
  const allocation = admitLeagueExecutionAllocation(input.allocation), produced = input.produced, same = (a: unknown, b: unknown) => labRoot("league-retained-response-binding", a) === labRoot("league-retained-response-binding", b)
  if (!same(read(input.repository, produced.allocationArtifactRoot), allocation)) return fail("RETAINED_RESPONSE_ALLOCATION")
  const start = read(input.repository, produced.startArtifactRoot), authored = verifyRetainedLeagueAuthoring(input.repository, allocation, produced.author.evidenceArtifactRoot), closure = readCandidateClosure({ ...produced.closure, factoryRepository: input.repository })
  const job = allocation.rounds.flatMap((round) => round.jobs).find((job) => job.id === authored.result.jobId) ?? fail("RETAINED_RESPONSE_JOB")
  if (produced.evaluationRole !== job.evaluationRole || start.root !== authored.result.startRoot || produced.author.startRoot !== start.root || authored.result.targetArtifactRoot !== (job.evaluationRole === "development_response" ? produced.targetArtifactRoot : null) || !same(closure.candidate, produced.admission.candidate) || produced.admission.productionEvidence?.redTeamStartRoot !== start.root || produced.admission.attemptStart.resourceAccountingRoot !== start.root || produced.admission.attemptTerminal.finalEvidenceRoot !== produced.author.evidenceArtifactRoot) return fail("RETAINED_RESPONSE_START")
  for (const [suffix, expected] of [["started", produced.admission.attemptStart], ["terminal", produced.admission.attemptTerminal]] as const) {
    const path = resolve(input.repository.directory, `factory-attempt-${produced.admission.attemptStart.root.slice(7)}.${suffix}.json`), stat = lstatSync(path)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 262144) return fail("RETAINED_RESPONSE_JOURNAL")
    const parsed = admitCanonicalJsonBytes(readFileSync(path), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok || !same(parsed.value, expected)) return fail("RETAINED_RESPONSE_JOURNAL")
  }
  const target = read(input.repository, produced.targetArtifactRoot)
  if (target.roundRoot !== start.roundRoot || target.candidateRoot !== start.candidateRoot || !same(target.candidates.map((row: any) => row.candidateRoot), input.opponents.map((row) => row.candidateRoot))) return fail("RETAINED_RESPONSE_TARGET")
  const opponents = input.opponents.map((opponent) => ({ ...opponent, ...readCandidateClosure(opponent.closure) })), reference = opponents.find((opponent) => opponent.closure.candidatePublicationArtifactRoot === allocation.independenceReferencePublicationRoot) ?? fail("RETAINED_RESPONSE_REFERENCE")
  if (target.candidates.some((row: any, i: number) => row.sourceArtifactRoot !== opponents[i]!.proposal.source.root || row.byteLength !== opponents[i]!.sourceBytes.length || row.disclosedFile !== `candidate-${row.sourceArtifactRoot.slice(7)}.ts` || !same(Array.from(readFactoryArtifact(input.repository, row.sourceArtifactRoot)), Array.from(opponents[i]!.sourceBytes)))) return fail("RETAINED_RESPONSE_TARGET_SOURCE")
  const conditions = enumerateLeagueResponseConditions(allocation, opponents.map((opponent) => opponent.candidateRoot)), all = [...input.records.entries()], results = all.filter(([, row]) => row.kind === "response-match-result" && row.value.matchCharge.parentStartRoot === produced.admission.attemptStart.root), charges = all.filter(([, row]) => row.kind === "response-match-start" && row.value.parentStartRoot === produced.admission.attemptStart.root)
  if (results.length !== conditions.length || charges.length !== conditions.length || produced.matchCount !== conditions.length) return fail("RETAINED_RESPONSE_COVERAGE")
  const thresholdRecord = read(input.threshold.repository, input.threshold.artifactRoot), fit = freezeNumericCalibrationThreshold(thresholdRecord.controls)
  if (fit.status !== "frozen" || !same(fit.threshold, thresholdRecord.threshold)) return fail("RETAINED_RESPONSE_THRESHOLD")
  const observed = new Map<LabRoot, { left: NumericCalibrationEvidence[]; right: NumericCalibrationEvidence[] }>(), scoreMap = new Map<string, { seed: string; opponentRoot: LabRoot; numerator: number; denominator: number; evidenceRoots: LabRoot[] }>(), scoreSupervisionArtifactRoots: LabRoot[] = []
  for (const condition of conditions) {
    const [recordRoot, node] = results.find(([, row]) => row.value.matchCharge.ordinal === condition.ordinal) ?? fail("RETAINED_RESPONSE_CONDITION"), value = node.value, { arenaIndex: _arenaIndex, ...fields } = condition
    if (!same(value.matchCharge, { parentStartRoot: produced.admission.attemptStart.root, ...fields })) return fail("RETAINED_RESPONSE_CONDITION")
    const charge = charges.find(([, row]) => row.value.ordinal === condition.ordinal)
    if (!charge || !same(charge[1].value, value.matchCharge) || !node.links.includes(charge[0]) || value.match.matchId !== `league-response-${charge[0].slice(7, 31)}` || value.match.seed !== condition.seed || value.match.arenaVariant.semanticGeometryHash !== condition.arena) return fail("RETAINED_RESPONSE_CHARGE")
    const opponent = opponents.find((row) => row.candidateRoot === condition.opponentRoot)!, measured = condition.purpose === "independence_right" ? opponent : closure, opposing = condition.purpose === "score" ? opponent : reference
    const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter((arena) => arena.status === "active" && arena.schedulable)[condition.arenaIndex]!
    if (!same(value.match.arenaVariant, arena) || value.match.bottomPlayerId !== (condition.side === "bottom" ? "league-response-candidate" : "league-response-opponent") || value.match.topPlayerId !== (condition.side === "top" ? "league-response-candidate" : "league-response-opponent") || value.match.initialInitiativePlayerId !== (condition.initial === "candidate" ? "league-response-candidate" : "league-response-opponent")) return fail("RETAINED_RESPONSE_MATCH_IDENTITY")
    const rawInvocations = all.filter(([, row]) => row.kind === "response-runtime-invocation" && row.links.includes(charge[0]))
    verifyRetainedLeagueProbeInvocations(rawInvocations.map(([, row]) => row.value), value.execution.accounting, undefined, arena.initialBounds)
    for (const [artifactRoot, candidate, playerId] of [[value.candidateReceiptArtifactRoot, measured, "league-response-candidate"], [value.opponentReceiptArtifactRoot, opposing, "league-response-opponent"]] as const) {
      const stored = readFactorySupervisionArtifactRecords(input.repository, artifactRoot, { maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords }), metadata = stored.records.find((row) => row.kind === "receipt")!.value as any
      if (metadata.candidatePlayerId !== playerId || metadata.admission.proposalRoot !== candidate.proposal.root || metadata.admission.sourceRoot !== candidate.proposal.source.root || metadata.candidateIdentity.attemptRoot !== (playerId === "league-response-candidate" ? start.root : charge[0]) || metadata.candidateIdentity.budgetRoot !== allocation.root || stored.descriptor.executionRoot !== labRoot("factory-stored-execution-v1", deriveFactoryExecutionCommitment(value.execution)) || metadata.matchup.status !== "verified") return fail("RETAINED_RESPONSE_SUPERVISION")
      const otherIdentity = value.execution.accounting.find((row: any) => row.identity.attemptRoot !== metadata.candidateIdentity.attemptRoot)?.identity, side = value.match.bottomPlayerId === playerId ? "bottom" : "top"
      if (!otherIdentity || metadata.matchup.conditionRoot !== labRoot("factory-supervision-match-condition-v1", value.match) || metadata.matchup.opponentRoot !== labRoot("factory-supervision-opponent-identity-v1", otherIdentity) || metadata.matchup.side !== side || metadata.matchup.initialInitiative !== (value.match.initialInitiativePlayerId === playerId) || metadata.candidateIdentity.revisionId !== (side === "bottom" ? value.match.bottomStrategyRevisionId : value.match.topStrategyRevisionId)) return fail("RETAINED_RESPONSE_MATCHUP")
      const traces = stored.records.filter((row) => row.kind === "trace").map((row) => row.value as any), invocations = all.filter(([, row]) => row.kind === "response-runtime-invocation" && row.links.includes(charge[0]) && same(row.value.originalEvidence.identity, metadata.candidateIdentity))
      if (allocation.evidenceClass === "empirical" && (!traces.length || traces.some((trace) => !invocations.some(([, row]) => row.value.originalEvidence.invocationRoot === trace.invocationRoot && same(row.value.originalEvidence, row.value.admittedEvidence) && row.value.originalEvidence.inputRoot === labRoot("runtime-input", row.value.request.input) && same(row.value.request, row.value.dispatched))))) return fail("RETAINED_RESPONSE_RAW_EVIDENCE")
      const cleanups = all.filter(([, row]) => row.kind === "response-runtime-cleanup" && row.links.includes(charge[0]) && same(row.value.identity, metadata.candidateIdentity))
      if (!cleanups.some(([, row]) => row.value.cleanup.cleanupComplete && !row.value.cleanup.orphanedChild)) return fail("RETAINED_RESPONSE_CLEANUP")
    }
    if (value.execution.kind !== "completed" || value.execution.accounting.some((row: any) => !row.result.ok)) return fail("RETAINED_RESPONSE_EXECUTION")
    if (condition.purpose === "score") {
      const key = `${condition.seed}:${condition.opponentRoot}`, score = scoreMap.get(key) ?? { seed: condition.seed, opponentRoot: condition.opponentRoot, numerator: 0, denominator: 16, evidenceRoots: [] }, outcome = value.execution.result.state.outcome
      score.numerator += outcome?.type === "DRAW" ? 1 : outcome?.type === "WIN" && outcome.winnerPlayerId === "league-response-candidate" ? 2 : 0; score.evidenceRoots.push(recordRoot); scoreMap.set(key, score); scoreSupervisionArtifactRoots.push(value.candidateReceiptArtifactRoot)
    } else {
      const rows = observed.get(condition.opponentRoot) ?? { left: [], right: [] }, arm = condition.purpose === "independence_left" ? "left" : "right"
      rows[arm].push(retainedObservation(input.repository, allocation, value.candidateReceiptArtifactRoot, new TextDecoder().decode(measured.sourceBytes), condition)); observed.set(condition.opponentRoot, rows)
    }
  }
  const comparisons = opponents.map((opponent) => {
    const rows = observed.get(opponent.candidateRoot) ?? fail("RETAINED_RESPONSE_OBSERVATIONS"), leftEvidence = aggregateObservations(rows.left), rightEvidence = aggregateObservations(rows.right), comparison = compareNumericEvidence(leftEvidence, rightEvidence), relation = classifyNumericComparison(comparison, fit.threshold), original = produced.comparisons.find((row: any) => row.opponentRoot === opponent.candidateRoot), node = original && input.records.get(original.evidenceRoot)
    if (!node || node.kind !== "response-numeric-comparison" || !same(node.value, { leftEvidence, rightEvidence, comparison, relation, thresholdArtifactRoot: input.threshold.artifactRoot, opponentRoot: opponent.candidateRoot })) return fail("RETAINED_RESPONSE_NUMERIC")
    return { opponentRoot: opponent.candidateRoot, opponentProposalRoot: opponent.proposal.root, comparison, relation, evidenceRoot: original.evidenceRoot }
  }), scores = [...scoreMap.values()]
  if (!same(comparisons, produced.comparisons) || !same(scores, produced.scores)) return fail("RETAINED_RESPONSE_DECISIONS")
  verifyRetainedLeagueFactoryFingerprints({ repository: input.repository, allocationArtifactRoot: produced.allocationArtifactRoot, startArtifactRoot: produced.startArtifactRoot, authoringArtifactRoot: produced.author.evidenceArtifactRoot, candidate: closure.candidate, evidenceArtifactRoot: produced.fingerprintArtifactRoot, scoreSupervisionArtifactRoots, counterfactualPairs: comparisons.map((row) => ({ leftRoot: closure.proposal.root, rightRoot: row.opponentProposalRoot, relation: row.relation === "unresolved" ? "borderline" : row.relation })), maxBytes: allocation.operations.maxArtifactBytes, maxRecords: allocation.operations.maxArtifactRecords })
  return { issued: false as const, comparisons, scores, matchCount: conditions.length }
}
