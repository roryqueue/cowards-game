import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision, finalizeFactoryCandidate, mapFactorySupervision, superviseFactory, type FactoryAdmission, type FactorySupervisionProvider, type FactorySupervisionReceipt } from "../packages/strategy-lab/src/factory/admission.js"
import { admitFactoryCalibrationManifest, admitFactoryCalibrationWorkload, type FactoryCalibrationManifest, type FactoryCalibrationWorkload } from "../packages/strategy-lab/src/factory/calibration.js"
import { deriveFactoryCandidateRoot, deriveFactoryValidationRoot } from "../packages/strategy-lab/src/factory/identity.js"
import { FactoryCandidateSchema, factoryProposalFromPacket, type FactoryProposal, type FactoryValidationEvidence } from "../packages/strategy-lab/src/factory/contracts.js"
import { createAuthorizedFactoryFingerprintEvidence, createFactoryFingerprintEvidence, createFactoryGraphNodeArtifact, deriveFactoryFingerprints, type FactoryFingerprintEvidence } from "../packages/strategy-lab/src/factory/fingerprint.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal, validateFactoryAttemptStart, type FactoryAttemptTerminal } from "../packages/strategy-lab/src/factory/ledger.js"
import { createFactoryRepository, publishFactoryArtifact, publishFactoryAttemptTerminal, readFactoryArtifact, recordFactoryAttemptStart, resumeFactoryAttemptInventory, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { publishFactorySupervisionArtifacts } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { runCanonicalLabMatch, type LabKernelRequest, type LabMatchExecution, type LabRuntimeEvidence, type LabSupervisedProvider } from "../packages/strategy-lab/src/runtime-bridge.js"
import { readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"
import { createFactorySupervisedRuntime, type FactorySupervisedRuntimeOptions } from "./lib/v1-38-factory-supervised-runtime.js"

const fail = (code: string): never => { throw new TypeError(`FACTORY_RUN_${code}`) }
const encode = (value: unknown): Uint8Array => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok || admitted.canonicalByteLength > 262144) return fail("ARTIFACT"); return admitted.canonicalBytes }
export interface FactoryCalibrationAttemptPlan {
  readonly candidatePlayerId: string
  readonly input: Parameters<typeof superviseFactory>[2]
  readonly run: (input: Parameters<typeof superviseFactory>[2]) => Promise<LabMatchExecution>
  readonly runtimeOptions?: Omit<FactorySupervisedRuntimeOptions, "admission" | "sourceBytes" | "attemptRoot" | "budgetRoot">
}
export interface FactoryCalibrationRunnerHooks {
  /** Historical mechanics fixtures are never an admissible fresh-v2 route. */
  readonly legacyMechanics?: true
  readonly runtimeOptions?: Partial<Omit<FactorySupervisedRuntimeOptions, "admission" | "sourceBytes" | "attemptRoot" | "budgetRoot" | "image" | "invocationLimit" | "benchmarkLifetimeMs" | "factoryLifetimeMs" | "matchId" | "containerName" | "ownershipLabel">>
  readonly plan?: (admission: FactoryAdmission, provider: FactorySupervisionProvider, startRoot: LabRoot, workload: FactoryCalibrationWorkload) => FactoryCalibrationAttemptPlan
}
export interface FactoryCalibrationRunResult {
  readonly manifestRoot: LabRoot; readonly readinessArtifactRoot: LabRoot; readonly readiness: "not_ready"
  readonly terminalRoots: readonly LabRoot[]; readonly supervisionArtifactRoots: readonly LabRoot[]; readonly ledgerRoot: LabRoot
}

const readCanonicalRecord = (repository: FactoryRepository, artifactRoot: LabRoot): Record<string, unknown> => {
  const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return fail("RETAINED_FACT")
  return parsed.value as Record<string, unknown>
}
const same = (left: unknown, right: unknown) => labRoot("factory-run-comparison-v1", left) === labRoot("factory-run-comparison-v1", right)
const rooted = (record: Record<string, unknown>, domain: string): boolean => {
  const { root, ...value } = record
  return root === labRoot(domain, value)
}
const verifyRetainedAuthority = (repository: FactoryRepository, manifest: FactoryCalibrationManifest) => {
  const authorization = readCanonicalRecord(repository, manifest.authorizationArtifactRoot)
  if (!rooted(authorization, "factory-calibration-authorization-v1") || authorization.root !== manifest.authorizationRoot || authorization.schemaVersion !== "factory-calibration-authorization-v1" || authorization.status !== "authorized" || authorization.protocolArtifactRoot !== manifest.protocolArtifactRoot || authorization.allocationArtifactRoot !== manifest.allocationArtifactRoot || authorization.studyPolicyRoot !== manifest.studyPolicyRoot || authorization.measurementPolicyRoot !== manifest.measurementPolicyRoot || authorization.maxAttempts !== manifest.maxAttempts || authorization.maxInvocationsPerAttempt !== manifest.maxInvocationsPerAttempt || authorization.maxLifetimeMs !== manifest.maxLifetimeMs || !same(authorization.supervision, manifest.supervision) || !same(authorization.ingestionArtifactRoots, manifest.ingestions.map((entry) => entry.artifactRoot)) || !same(authorization.workloadArtifactRoots, manifest.workloads.map((entry) => entry.artifactRoot))) return fail("AUTHORIZATION_BINDING")
  const protocol = readCanonicalRecord(repository, manifest.protocolArtifactRoot)
  if (!rooted(protocol, "factory-calibration-protocol-v1") || protocol.root !== manifest.protocolRoot || protocol.schemaVersion !== "factory-calibration-protocol-v1" || protocol.phase !== "264" || protocol.purpose !== "development-independence-calibration" || protocol.split !== "development") return fail("PROTOCOL_BINDING")
  const allocation = readCanonicalRecord(repository, manifest.allocationArtifactRoot)
  if (!rooted(allocation, "factory-calibration-allocation-v1") || allocation.root !== manifest.allocationRoot || allocation.schemaVersion !== "factory-calibration-allocation-v1" || allocation.phase !== "264" || allocation.protocolRoot !== manifest.protocolRoot || allocation.maxAttempts !== manifest.maxAttempts || allocation.maxInvocationsPerAttempt !== manifest.maxInvocationsPerAttempt || allocation.maxLifetimeMs !== manifest.maxLifetimeMs) return fail("ALLOCATION_BINDING")
  for (const name of readdirSync(repository.directory)) {
    if (!/^factory-attempt-[a-f0-9]{64}\.started\.json$/u.test(name)) continue
    const parsed = admitCanonicalJsonBytes(readFileSync(resolve(repository.directory, name)), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok) return fail("LEDGER")
    const start = validateFactoryAttemptStart(parsed.value)
    const accounting = readCanonicalRecord(repository, start.resourceAccountingRoot)
    if (start.taskRoot === manifest.protocolRoot || accounting.allocationRoot === manifest.allocationRoot) return fail("ALLOCATION_CONSUMED")
  }
}

const validateSelectedSource = (proposal: FactoryProposal, sourceBytes: Uint8Array): FactoryValidationEvidence => {
  let source: string
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes) } catch { return fail("SOURCE_ENCODING") }
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || `sha256:${revision.sourceHash}` !== proposal.source.root || revision.sourceBytes !== proposal.source.byteLength || proposal.nativeLane.language !== "typescript" || proposal.nativeLane.translation !== "none" || proposal.nativeLane.runtimeAbi !== "strategy-runtime-abi-v1.19" || proposal.nativeLane.runtimeProfileRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) return fail("VALIDATION")
  const binding = { proposalRoot: proposal.root, sourceRoot: proposal.source.root, revisionId: revision.id, validation: revision.validation, exactNativeLane: proposal.nativeLane }
  const value = { schemaVersion: "factory-validation-evidence-v1" as const, privacy: "private_offline" as const, proposalRoot: proposal.root, validationRoot: labRoot("factory-selected-source-validation-v1", binding), status: "valid" as const, exactNativeLane: proposal.nativeLane, evidenceRoot: labRoot("factory-selected-source-validation-evidence-v1", binding) }
  return Object.freeze({ ...value, root: deriveFactoryValidationRoot(value) })
}

export const deriveFixedMechanicsOpponentIdentityRoot = (): LabRoot => labRoot("factory-fixed-mechanics-opponent-identity-v1", { opponentId: "factory-fixed-mechanics-v1", tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
const createFixedMechanicsOpponent = (workload: FactoryCalibrationWorkload, attemptRoot: LabRoot, budgetRoot: LabRoot): LabSupervisedProvider => {
  if (workload.opponent.identityRoot !== deriveFixedMechanicsOpponentIdentityRoot()) return fail("OPPONENT_IDENTITY")
  const identity = freezeLabValue({ revisionId: workload.opponent.opponentId, sourceRoot: labRoot("factory-fixed-mechanics-opponent-source-v1", workload.opponent.opponentId), executableRoot: labRoot("factory-fixed-mechanics-opponent-executable-v1", workload.opponent.opponentId), tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: labRoot("factory-fixed-mechanics-opponent-harness-v1", workload.opponent.opponentId), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
  const issued = new WeakSet<object>()
  let ordinal = 0
  return {
    identity,
    invoke(request: LabKernelRequest) {
      const result = request.kind === "selectActivations" ? { ok: true as const, value: { activationOrders: [], strategyMemory: null } } : { ok: true as const, value: { action: { type: "TURN_TO_STONE" as const }, soldierMemory: null } }
      const evidence = freezeLabValue({ identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: ordinal++, invocationRoot: labRoot("factory-inert-opponent-invocation-v1", { attemptRoot, requestId: request.requestId }), charged: true, completed: true, outputBytes: new TextEncoder().encode(JSON.stringify(result)).byteLength, result }) as LabRuntimeEvidence
      issued.add(evidence)
      return evidence
    },
    verify(evidence) { return issued.has(evidence) },
    close() { return { cleanupComplete: true, orphanedChild: false } },
  }
}

export const buildFactoryCalibrationMatchInput = (workload: FactoryCalibrationWorkload, candidateRevisionId: string, startRoot: LabRoot) => {
  const candidatePlayerId = "factory-candidate", opponentPlayerId = workload.opponent.opponentId
  const arenaVariant = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === workload.condition.arenaId)
  if (!arenaVariant) return fail("ARENA")
  const bottomPlayerId = workload.condition.candidateSide === "bottom" ? candidatePlayerId : opponentPlayerId
  const topPlayerId = workload.condition.candidateSide === "top" ? candidatePlayerId : opponentPlayerId
  const initialInitiativePlayerId = workload.condition.initialInitiative === "candidate" ? candidatePlayerId : opponentPlayerId
  return { matchId: `factory-calibration-${workload.root.slice(7, 23)}-${startRoot.slice(7, 15)}`, seed: workload.condition.seed, arenaVariant, bottomPlayerId, topPlayerId, bottomStrategyRevisionId: workload.condition.candidateSide === "bottom" ? candidateRevisionId : workload.opponent.opponentId, topStrategyRevisionId: workload.condition.candidateSide === "top" ? candidateRevisionId : workload.opponent.opponentId, initialInitiativePlayerId, maxPhases: workload.condition.maxPhases }
}
const defaultPlan = (workload: FactoryCalibrationWorkload, _admission: FactoryAdmission, provider: FactorySupervisionProvider, startRoot: LabRoot): FactoryCalibrationAttemptPlan => {
  const candidatePlayerId = "factory-candidate", opponentPlayerId = workload.opponent.opponentId
  const match = buildFactoryCalibrationMatchInput(workload, provider.identity.revisionId, startRoot)
  return { candidatePlayerId, input: { match, providers: { [candidatePlayerId]: provider, [opponentPlayerId]: createFixedMechanicsOpponent(workload, startRoot, provider.identity.budgetRoot) } }, run: runCanonicalLabMatch }
}

const errorDisposition = (error: unknown, providerCreated: boolean): "invalid" | "system_failure" => {
  const message = error instanceof Error ? error.message : "unknown"
  if (/^(?:FACTORY_RUN_CLEANUP|LAB_)/u.test(message)) return "system_failure"
  if (!providerCreated || /^FACTORY_RUNTIME_(?:UNSUPPORTED_NATIVE_LANE|NATIVE_LANE_IDENTITY|SOURCE_BINDING|SOURCE_ENCODING|REVISION_BINDING|LIFETIME)$/u.test(message)) return "invalid"
  return "system_failure"
}
export const deriveFactoryCalibrationOutcome = (execution: LabMatchExecution, match: FactoryCalibrationAttemptPlan["input"]["match"]): "bottom" | "top" | "draw" | "failure" => {
  if (execution.kind === "failure") return "failure"
  const outcome = execution.result.state?.outcome
  if (outcome?.type === "DRAW") return "draw"
  if (outcome?.type === "WIN" && outcome.winnerPlayerId === match.bottomPlayerId) return "bottom"
  if (outcome?.type === "WIN" && outcome.winnerPlayerId === match.topPlayerId) return "top"
  return fail("MATCH_OUTCOME")
}

export const runFactoryCalibration = async (manifestArtifactRoot: LabRoot, repository: FactoryRepository, hooks: FactoryCalibrationRunnerHooks = {}): Promise<Readonly<FactoryCalibrationRunResult>> => {
  const manifest = admitFactoryCalibrationManifest(readCanonicalRecord(repository, manifestArtifactRoot))
  const authorization = readCanonicalRecord(repository, manifest.authorizationArtifactRoot)
  verifyRetainedAuthority(repository, manifest)
  if (authorization.schemaVersion === "factory-calibration-authorization-v1" && hooks.legacyMechanics !== true && !(hooks.runtimeOptions && hooks.plan)) return fail("LEGACY_MECHANICS_HOOKS")
  const terminalRoots: LabRoot[] = []
  const supervisionArtifactRoots: LabRoot[] = []
  const candidateArtifactRoots: LabRoot[] = []
  const pairingArtifactRoots: LabRoot[] = []
  const pendingPairing: Array<Readonly<{
    workload: FactoryCalibrationWorkload; receipt: FactorySupervisionReceipt; proposal: FactoryProposal; validation: FactoryValidationEvidence
    ingestion: FactoryCalibrationManifest["ingestions"][number]; producerIdentity: FactoryFingerprintEvidence["producerIdentity"]; origin: FactoryFingerprintEvidence["origin"]; retainedRoot: LabRoot
    storedSupervisionArtifactRoot: LabRoot; storedExecutionRoot: LabRoot; attemptPlan: FactoryCalibrationAttemptPlan; selectedRealPath: boolean
  }>> = []
  for (let ordinal = 0; ordinal < manifest.workloads.length; ordinal += 1) {
    const workloadRef = manifest.workloads[ordinal]!
    const ingestion = manifest.ingestions.find((entry) => entry.artifactRoot === workloadRef.candidateIngestionArtifactRoot) ?? fail("WORKLOAD_INGESTION")
    const accountingRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-calibration-accounting-v1", manifestRoot: manifest.root, allocationRoot: manifest.allocationRoot, ordinal, workloadArtifactRoot: workloadRef.artifactRoot, maxInvocations: manifest.maxInvocationsPerAttempt, maxLifetimeMs: manifest.maxLifetimeMs }))
    const start = createFactoryAttemptStart({
      taskRoot: manifest.protocolRoot,
      budgetRoot: labRoot("factory-calibration-attempt-budget-v1", { allocationRoot: manifest.allocationRoot, ordinal }),
      candidateRoot: ingestion.packetRoot,
      authoringMechanism: "automated-oracle",
      inputRoot: workloadRef.artifactRoot,
      resourceAccountingRoot: accountingRoot,
      retryParentRoot: null,
    })
    recordFactoryAttemptStart(repository, start)
    let disposition: FactoryAttemptTerminal["disposition"] = "invalid"
    let outputRoot: LabRoot | null = null
    let validationRoot = manifest.authorizationRoot
    let duplicateEvidenceRoot = manifest.authorizationRoot
    let finalEvidenceRoot = manifest.authorizationRoot
    let provider: FactorySupervisionProvider | undefined
    let providerCreated = false
    try {
      // Validation intentionally begins only after the durable start above.
      const workload = admitFactoryCalibrationWorkload(readCanonicalRecord(repository, workloadRef.artifactRoot))
      if (workload.root !== workloadRef.root || workload.candidateIngestionArtifactRoot !== ingestion.artifactRoot || workload.pairGroup !== workloadRef.pairGroup || workload.budget.maxInvocations > manifest.maxInvocationsPerAttempt || workload.budget.maxLifetimeMs > manifest.maxLifetimeMs) fail("WORKLOAD_BINDING")
      const retained = readFactoryIngestion(repository, ingestion.artifactRoot)
      if (retained.packetRoot !== ingestion.packetRoot || retained.sourceRoot !== ingestion.sourceRoot || retained.producerIdentity !== ingestion.producerIdentity || retained.origin !== ingestion.origin) fail("INGESTION_BINDING")
      const sourceBytes = new TextEncoder().encode(retained.sourceUtf8)
      const proposal = factoryProposalFromPacket(retained.packet)
      const sourceAdmission = admitFactory({ packet: retained.packet, proposal, sourceBytes, repository })
      const validation = validateSelectedSource(proposal, sourceBytes)
      validationRoot = validation.root
      const admission = authorizeFactorySupervision({ sourceAdmission, validation, repository })
      provider = createFactorySupervisedRuntime({ ...hooks.runtimeOptions, matchId: `factory-calibration-${start.root.slice(7, 23)}`, containerName: `factory-calibration-${start.root.slice(7, 19)}`, ownershipLabel: "v1.38-factory-calibration", admission, sourceBytes, attemptRoot: start.root, budgetRoot: start.budgetRoot, image: manifest.supervision.image, invocationLimit: workload.budget.maxInvocations, factoryLifetimeMs: workload.budget.maxLifetimeMs })
      providerCreated = true
      const attemptPlan = hooks.plan ? hooks.plan(admission, provider, start.root, workload) : defaultPlan(workload, admission, provider, start.root)
      if (attemptPlan.candidatePlayerId !== attemptPlan.input.match.bottomPlayerId && attemptPlan.candidatePlayerId !== attemptPlan.input.match.topPlayerId) fail("CANDIDATE_PLAYER")
      const receipt = await superviseFactory(admission, attemptPlan.candidatePlayerId, { ...attemptPlan.input, providers: { ...attemptPlan.input.providers, [attemptPlan.candidatePlayerId]: provider } }, attemptPlan.run)
      const cleanup = provider.close()
      provider = undefined
      if (!cleanup.cleanupComplete || cleanup.orphanedChild) fail("CLEANUP")
      const storedSupervision = publishFactorySupervisionArtifacts(repository, receipt)
      supervisionArtifactRoots.push(storedSupervision.artifactRoot)
      const actualUsageRoot = publishFactoryArtifact(repository, encode({
        schemaVersion: "factory-calibration-actual-usage-v1", startRoot: start.root, receiptRoot: receipt.root,
        supervisionArtifactRoot: storedSupervision.artifactRoot, totalInvocations: receipt.execution.accounting.length,
        candidateInvocations: receipt.traces.length, outputBytes: receipt.execution.accounting.reduce((total, entry) => total + entry.outputBytes, 0),
        retainedRecordCount: storedSupervision.recordCount, retainedByteLength: storedSupervision.byteLength,
      }))
      const supervision = mapFactorySupervision(receipt)
      if (supervision.candidateDisposition !== "accepted") {
        disposition = supervision.candidateDisposition
        outputRoot = disposition === "system_failure" ? null : storedSupervision.artifactRoot
        duplicateEvidenceRoot = supervision.evidenceRoot
        finalEvidenceRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-calibration-terminal-evidence-v1", startRoot: start.root, disposition, supervisionArtifactRoot: storedSupervision.artifactRoot, actualUsageRoot }))
      } else {
        // The attempt is final now. Pairing/fingerprinting runs only after every
        // declared sibling receipt is durable; no terminal is ever rewritten.
        disposition = "unresolved"
        outputRoot = storedSupervision.artifactRoot
        duplicateEvidenceRoot = supervision.evidenceRoot
        finalEvidenceRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-calibration-terminal-evidence-v1", startRoot: start.root, disposition, supervisionArtifactRoot: storedSupervision.artifactRoot, actualUsageRoot, pairing: "pending_retained_group" }))
        pendingPairing.push(freezeLabValue({ workload, receipt, proposal, validation, ingestion, producerIdentity: retained.producerIdentity, origin: retained.origin, retainedRoot: retained.root, storedSupervisionArtifactRoot: storedSupervision.artifactRoot, storedExecutionRoot: storedSupervision.executionRoot, attemptPlan, selectedRealPath: retained.evidenceClass === "real_producer" && hooks.plan === undefined && hooks.runtimeOptions === undefined }))
      }
    } catch (error) {
      disposition = errorDisposition(error, providerCreated)
      const evidenceRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-calibration-error-v1", startRoot: start.root, disposition, error: error instanceof Error ? error.message : "unknown" }))
      outputRoot = disposition === "system_failure" ? null : evidenceRoot
      duplicateEvidenceRoot = evidenceRoot
      finalEvidenceRoot = evidenceRoot
    } finally {
      if (provider) {
        try {
          const cleanup = provider.close()
          if (!cleanup.cleanupComplete || cleanup.orphanedChild) disposition = "system_failure"
        } catch { disposition = "system_failure" }
        if (disposition === "system_failure") outputRoot = null
      }
    }
    const terminal = createFactoryAttemptTerminal({ startRoot: start.root, disposition, outputRoot, validationRoot, duplicateEvidenceRoot, finalEvidenceRoot })
    publishFactoryAttemptTerminal(repository, start, terminal)
    terminalRoots.push(terminal.root)
    if (terminal.disposition === "system_failure") break
  }
  const groups = new Map<string, typeof pendingPairing>()
  for (const item of pendingPairing) groups.set(item.workload.pairGroup, [...(groups.get(item.workload.pairGroup) ?? []), item])
  for (const [pairGroup, entries] of groups) {
    const first = entries[0]!
    const workloadMatchesReceipt = (entry: typeof first) => {
      const matchup = entry.receipt.matchup, match = entry.attemptPlan.input.match
      const candidateSide = entry.workload.condition.candidateSide
      const expectedOpponentId = candidateSide === "bottom" ? match.topPlayerId : match.bottomPlayerId
      return matchup.status === "verified" && match.seed === entry.workload.condition.seed && match.arenaVariant.id === entry.workload.condition.arenaId &&
        match.maxPhases === entry.workload.condition.maxPhases && (candidateSide === "bottom" ? match.bottomPlayerId : match.topPlayerId) === entry.attemptPlan.candidatePlayerId &&
        expectedOpponentId === entry.workload.opponent.opponentId && matchup.conditionRoot === labRoot("factory-supervision-match-condition-v1", match) &&
        matchup.side === candidateSide && matchup.initialInitiative === (entry.workload.condition.initialInitiative === "candidate")
    }
    const paired = entries.length === 2 &&
      new Set(entries.map((entry) => entry.receipt.root)).size === 2 &&
      entries.every((entry) => entry.proposal.root === first.proposal.root && entry.receipt.admission.sourceRoot === first.receipt.admission.sourceRoot && entry.workload.pairAxis === "initialInitiative" &&
        entry.workload.candidateIngestionArtifactRoot === first.workload.candidateIngestionArtifactRoot && entry.workload.condition.arenaId === first.workload.condition.arenaId && entry.workload.condition.seed === first.workload.condition.seed && entry.workload.condition.candidateSide === first.workload.condition.candidateSide && entry.workload.condition.maxPhases === first.workload.condition.maxPhases && same(entry.workload.opponent, first.workload.opponent) && same(entry.workload.budget, first.workload.budget) && entry.workload.lineageManifestArtifactRoot === first.workload.lineageManifestArtifactRoot && entry.workload.dependencyManifestArtifactRoot === first.workload.dependencyManifestArtifactRoot &&
        workloadMatchesReceipt(entry)) &&
      new Set(entries.map((entry) => entry.workload.condition.initialInitiative)).size === 2
    const pairingValue = { schemaVersion: "factory-calibration-pairing-v1" as const, privacy: "private_offline" as const, pairGroup, status: paired ? "paired" as const : "unavailable" as const, workloadRoots: entries.map((entry) => entry.workload.root), receiptRoots: entries.map((entry) => entry.receipt.root) }
    pairingArtifactRoots.push(publishFactoryArtifact(repository, encode({ ...pairingValue, root: labRoot("factory-calibration-pairing-v1", pairingValue) })))
    for (const entry of entries) {
      try {
        const lineageNodes = [{ root: entry.proposal.root, parents: [] as LabRoot[] }].map((node) => ({ ...node, artifactRoot: createFactoryGraphNodeArtifact(repository, { kind: "lineage", nodeRoot: node.root, links: node.parents }) }))
        const dependencyNodes = [{ root: entry.proposal.source.root, dependencies: [] as LabRoot[] }].map((node) => ({ ...node, artifactRoot: createFactoryGraphNodeArtifact(repository, { kind: "dependency", nodeRoot: node.root, links: node.dependencies }) }))
        const candidateSide = entry.attemptPlan.candidatePlayerId === entry.attemptPlan.input.match.bottomPlayerId ? "bottom" as const : "top" as const
        const opponentId = candidateSide === "bottom" ? entry.attemptPlan.input.match.topPlayerId : entry.attemptPlan.input.match.bottomPlayerId
        const opponent = entry.attemptPlan.input.providers[opponentId] ?? fail("OPPONENT")
        const evidenceValue: Omit<FactoryFingerprintEvidence, "schemaVersion" | "privacy" | "root"> = {
          proposalRoot: entry.proposal.root, validationRoot: entry.validation.root, supervisionReceiptRoot: entry.receipt.root,
          producerIdentity: entry.producerIdentity, origin: entry.origin, evidenceClass: entry.selectedRealPath ? "real_producer" as const : "mechanics_only" as const, producerArtifactRoot: entry.selectedRealPath ? entry.ingestion.artifactRoot : null,
          authorshipRoots: [entry.retainedRoot], lineageNodes, dependencyNodes,
          matchupResponses: [{ supervisionReceiptRoot: entry.receipt.root, conditionRoot: labRoot("factory-issued-match-condition-v1", entry.attemptPlan.input.match), opponentRoot: labRoot("factory-issued-opponent-identity-v1", opponent.identity), side: candidateSide, initialInitiative: entry.attemptPlan.input.match.initialInitiativePlayerId === entry.attemptPlan.candidatePlayerId, outcome: deriveFactoryCalibrationOutcome(entry.receipt.execution, entry.attemptPlan.input.match), responseRoot: entry.storedExecutionRoot }],
          // A declared and successfully retained pair is an available comparison,
          // not a measured correlation or a frozen materiality conclusion.
          counterfactualPairs: [{ leftRoot: entries[0]!.proposal.root, rightRoot: entries.at(-1)!.proposal.root, relation: "borderline" }],
          failureModes: ["accepted"],
        }
        const evidence = entry.selectedRealPath
          ? createAuthorizedFactoryFingerprintEvidence({ repository, calibrationManifestArtifactRoot: manifestArtifactRoot, value: evidenceValue })
          : createFactoryFingerprintEvidence(evidenceValue)
        const evidenceArtifactRoot = publishFactoryArtifact(repository, encode(evidence))
        const independence = deriveFactoryFingerprints({ repository, supervisionReceipt: entry.receipt, pairedSupervisionReceipts: paired ? entries.map((item) => item.receipt) : [entry.receipt], evidence, evidenceArtifactRoot, ...(entry.workload.lineageManifestArtifactRoot === null ? {} : { lineageManifestArtifactRoot: entry.workload.lineageManifestArtifactRoot }), ...(entry.workload.dependencyManifestArtifactRoot === null ? {} : { dependencyManifestArtifactRoot: entry.workload.dependencyManifestArtifactRoot }) })
        const candidateValue = { schemaVersion: "factory-candidate-v1" as const, privacy: "private_offline" as const, proposal: entry.proposal, validation: entry.validation, supervisionReceiptRoot: entry.receipt.root, fingerprints: independence.fingerprints, lineage: entry.proposal.lineage }
        const candidate = FactoryCandidateSchema.parse({ ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) })
        candidateArtifactRoots.push(finalizeFactoryCandidate({ receipt: entry.receipt, independenceReceipt: independence, candidate, repository }).artifactRoot)
      } catch (error) {
        const value = { schemaVersion: "factory-calibration-pairing-failure-v1" as const, privacy: "private_offline" as const, pairGroup, workloadRoot: entry.workload.root, receiptRoot: entry.receipt.root, error: error instanceof Error ? error.message : "unknown" }
        pairingArtifactRoots.push(publishFactoryArtifact(repository, encode({ ...value, root: labRoot("factory-calibration-pairing-failure-v1", value) })))
      }
    }
  }
  const inventory = resumeFactoryAttemptInventory(repository)
  const readiness = { schemaVersion: "factory-calibration-readiness-v1", privacy: "private_offline", manifestRoot: manifest.root, ledgerRoot: inventory.ledgerRoot, terminalRoots, supervisionArtifactRoots, pairingArtifactRoots, candidateArtifactRoots, status: "not_ready", reason: "calibration_thresholds_not_frozen" }
  const readinessArtifactRoot = publishFactoryArtifact(repository, encode(readiness))
  return freezeLabValue({ manifestRoot: manifest.root, readinessArtifactRoot, readiness: "not_ready", terminalRoots, supervisionArtifactRoots, ledgerRoot: inventory.ledgerRoot })
}

const help = "Usage: run-v1-38-factory-calibration --repository <factory-directory> --manifest <artifact-root>\nRuns only the retained Phase 264 allocation through the selected container adapter."
const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined }
const main = async () => {
  if (process.argv.includes("--help")) { process.stdout.write(`${help}\n`); return }
  const directory = argument("--repository"), manifest = argument("--manifest")
  if (!directory || !manifest || !/^sha256:[0-9a-f]{64}$/u.test(manifest)) return fail("ARGUMENTS")
  const result = await runFactoryCalibration(manifest as LabRoot, createFactoryRepository(resolve(directory)))
  process.stdout.write(`${JSON.stringify(result)}\n`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 })
