import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision, finalizeFactoryCandidate, mapFactorySupervision, superviseFactory, type FactoryAdmission, type FactorySupervisionProvider } from "../packages/strategy-lab/src/factory/admission.js"
import { admitFactoryCalibrationManifest, type FactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
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
  readonly runtimeOptions?: Partial<Omit<FactorySupervisedRuntimeOptions, "admission" | "sourceBytes" | "attemptRoot" | "budgetRoot" | "image" | "invocationLimit" | "benchmarkLifetimeMs" | "factoryLifetimeMs" | "matchId" | "containerName" | "ownershipLabel">>
  readonly plan?: (admission: FactoryAdmission, provider: FactorySupervisionProvider, startRoot: LabRoot) => FactoryCalibrationAttemptPlan
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
  if (!rooted(authorization, "factory-calibration-authorization-v1") || authorization.root !== manifest.authorizationRoot || authorization.schemaVersion !== "factory-calibration-authorization-v1" || authorization.status !== "authorized" || authorization.protocolArtifactRoot !== manifest.protocolArtifactRoot || authorization.allocationArtifactRoot !== manifest.allocationArtifactRoot || authorization.studyPolicyRoot !== manifest.studyPolicyRoot || authorization.measurementPolicyRoot !== manifest.measurementPolicyRoot || authorization.maxAttempts !== manifest.maxAttempts || authorization.maxInvocationsPerAttempt !== manifest.maxInvocationsPerAttempt || authorization.maxLifetimeMs !== manifest.maxLifetimeMs || !same(authorization.supervision, manifest.supervision) || !same(authorization.ingestionArtifactRoots, manifest.ingestions.map((entry) => entry.artifactRoot))) return fail("AUTHORIZATION_BINDING")
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

const createInertOpponent = (attemptRoot: LabRoot, budgetRoot: LabRoot): LabSupervisedProvider => {
  const identity = freezeLabValue({ revisionId: "factory-calibration-inert-opponent-v1", sourceRoot: labRoot("factory-inert-opponent-source-v1", "fixed"), executableRoot: labRoot("factory-inert-opponent-executable-v1", "fixed"), tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: labRoot("factory-inert-opponent-harness-v1", "fixed"), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
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

const defaultPlan = (admission: FactoryAdmission, provider: FactorySupervisionProvider, startRoot: LabRoot): FactoryCalibrationAttemptPlan => {
  const candidatePlayerId = "factory-candidate", opponentPlayerId = "factory-inert-opponent"
  const match = { matchId: `factory-calibration-${startRoot.slice(7, 23)}`, seed: `factory-calibration-${startRoot.slice(23, 39)}`, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")!, bottomPlayerId: candidatePlayerId, topPlayerId: opponentPlayerId, bottomStrategyRevisionId: provider.identity.revisionId, topStrategyRevisionId: "factory-calibration-inert-opponent-v1", initialInitiativePlayerId: candidatePlayerId, maxPhases: 1 }
  return { candidatePlayerId, input: { match, providers: { [candidatePlayerId]: provider, [opponentPlayerId]: createInertOpponent(startRoot, provider.identity.budgetRoot) } }, run: runCanonicalLabMatch }
}

const errorDisposition = (error: unknown, providerCreated: boolean): "invalid" | "system_failure" => {
  const message = error instanceof Error ? error.message : "unknown"
  if (/^(?:FACTORY_RUN_CLEANUP|LAB_)/u.test(message)) return "system_failure"
  if (!providerCreated || /^FACTORY_RUNTIME_(?:UNSUPPORTED_NATIVE_LANE|NATIVE_LANE_IDENTITY|SOURCE_BINDING|SOURCE_ENCODING|REVISION_BINDING|LIFETIME)$/u.test(message)) return "invalid"
  return "system_failure"
}

export const runFactoryCalibration = async (manifestArtifactRoot: LabRoot, repository: FactoryRepository, hooks: FactoryCalibrationRunnerHooks = {}): Promise<Readonly<FactoryCalibrationRunResult>> => {
  const manifest = admitFactoryCalibrationManifest(readCanonicalRecord(repository, manifestArtifactRoot))
  verifyRetainedAuthority(repository, manifest)
  const terminalRoots: LabRoot[] = []
  const supervisionArtifactRoots: LabRoot[] = []
  for (let ordinal = 0; ordinal < manifest.ingestions.length; ordinal += 1) {
    const ingestion = manifest.ingestions[ordinal]!
    const accountingRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-calibration-accounting-v1", manifestRoot: manifest.root, allocationRoot: manifest.allocationRoot, ordinal, maxInvocations: manifest.maxInvocationsPerAttempt, maxLifetimeMs: manifest.maxLifetimeMs }))
    const start = createFactoryAttemptStart({
      taskRoot: manifest.protocolRoot,
      budgetRoot: labRoot("factory-calibration-attempt-budget-v1", { allocationRoot: manifest.allocationRoot, ordinal }),
      candidateRoot: ingestion.packetRoot,
      authoringMechanism: "automated-oracle",
      inputRoot: ingestion.artifactRoot,
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
      const retained = readFactoryIngestion(repository, ingestion.artifactRoot)
      if (retained.packetRoot !== ingestion.packetRoot || retained.sourceRoot !== ingestion.sourceRoot || retained.producerIdentity !== ingestion.producerIdentity || retained.origin !== ingestion.origin) return fail("INGESTION_BINDING")
      const sourceBytes = new TextEncoder().encode(retained.sourceUtf8)
      const proposal = factoryProposalFromPacket(retained.packet)
      const sourceAdmission = admitFactory({ packet: retained.packet, proposal, sourceBytes, repository })
      const validation = validateSelectedSource(proposal, sourceBytes)
      validationRoot = validation.root
      const admission = authorizeFactorySupervision({ sourceAdmission, validation, repository })
      provider = createFactorySupervisedRuntime({ ...hooks.runtimeOptions, matchId: `factory-calibration-${start.root.slice(7, 23)}`, containerName: `factory-calibration-${start.root.slice(7, 19)}`, ownershipLabel: "v1.38-factory-calibration", admission, sourceBytes, attemptRoot: start.root, budgetRoot: start.budgetRoot, image: manifest.supervision.image, invocationLimit: manifest.maxInvocationsPerAttempt, factoryLifetimeMs: manifest.maxLifetimeMs })
      providerCreated = true
      const attemptPlan = hooks.plan ? hooks.plan(admission, provider, start.root) : defaultPlan(admission, provider, start.root)
      if (attemptPlan.candidatePlayerId !== attemptPlan.input.match.bottomPlayerId && attemptPlan.candidatePlayerId !== attemptPlan.input.match.topPlayerId) return fail("CANDIDATE_PLAYER")
      const receipt = await superviseFactory(admission, attemptPlan.candidatePlayerId, { ...attemptPlan.input, providers: { ...attemptPlan.input.providers, [attemptPlan.candidatePlayerId]: provider } }, attemptPlan.run)
      const cleanup = provider.close()
      provider = undefined
      if (!cleanup.cleanupComplete || cleanup.orphanedChild) return fail("CLEANUP")
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
        // Only actual retained stages are represented. Parent and recursive lock
        // evidence remains explicitly unverified until Plan 07 supplies it.
        const lineageNodes = [{ root: proposal.root, parents: [] as LabRoot[] }].map((node) => ({ ...node, artifactRoot: createFactoryGraphNodeArtifact(repository, { kind: "lineage", nodeRoot: node.root, links: node.parents }) }))
        const dependencyNodes = [{ root: proposal.source.root, dependencies: [] as LabRoot[] }].map((node) => ({ ...node, artifactRoot: createFactoryGraphNodeArtifact(repository, { kind: "dependency", nodeRoot: node.root, links: node.dependencies }) }))
        const candidateSide = attemptPlan.candidatePlayerId === attemptPlan.input.match.bottomPlayerId ? "bottom" as const : "top" as const
        const opponentId = candidateSide === "bottom" ? attemptPlan.input.match.topPlayerId : attemptPlan.input.match.bottomPlayerId
        const opponent = attemptPlan.input.providers[opponentId]
        if (!opponent) return fail("OPPONENT")
        const selectedRealPath = hooks.plan === undefined && hooks.runtimeOptions === undefined
        const evidenceValue: Omit<FactoryFingerprintEvidence, "schemaVersion" | "privacy" | "root"> = {
          proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: receipt.root,
          producerIdentity: retained.producerIdentity, origin: retained.origin, evidenceClass: selectedRealPath ? "real_producer" as const : "mechanics_only" as const, producerArtifactRoot: selectedRealPath ? ingestion.artifactRoot : null,
          authorshipRoots: [retained.root], lineageNodes, dependencyNodes,
          matchupResponses: [{ supervisionReceiptRoot: receipt.root, conditionRoot: labRoot("factory-issued-match-condition-v1", attemptPlan.input.match), opponentRoot: labRoot("factory-issued-opponent-identity-v1", opponent.identity), side: candidateSide, initialInitiative: attemptPlan.input.match.initialInitiativePlayerId === attemptPlan.candidatePlayerId, outcome: receipt.execution.kind === "failure" ? "failure" : "draw", responseRoot: storedSupervision.executionRoot }],
          counterfactualPairs: [{ leftRoot: proposal.root, rightRoot: proposal.root, relation: "borderline" }],
          failureModes: [supervision.disposition],
        }
        const evidence = selectedRealPath
          ? createAuthorizedFactoryFingerprintEvidence({ repository, calibrationManifestArtifactRoot: manifestArtifactRoot, value: evidenceValue })
          : createFactoryFingerprintEvidence(evidenceValue)
        const evidenceArtifactRoot = publishFactoryArtifact(repository, encode(evidence))
        const independence = deriveFactoryFingerprints({ repository, supervisionReceipt: receipt, evidence, evidenceArtifactRoot })
        const candidateValue = { schemaVersion: "factory-candidate-v1" as const, privacy: "private_offline" as const, proposal, validation, supervisionReceiptRoot: receipt.root, fingerprints: independence.fingerprints, lineage: proposal.lineage }
        const candidate = FactoryCandidateSchema.parse({ ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) })
        const finalized = finalizeFactoryCandidate({ receipt, independenceReceipt: independence, candidate, repository })
        disposition = "unresolved"
        outputRoot = finalized.artifactRoot
        duplicateEvidenceRoot = independence.supportingRoots.cloneEvidenceRoot
        finalEvidenceRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-calibration-terminal-evidence-v1", startRoot: start.root, disposition, supervisionArtifactRoot: storedSupervision.artifactRoot, actualUsageRoot, independenceReceiptRoot: independence.root, candidateArtifactRoot: finalized.artifactRoot }))
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
  const inventory = resumeFactoryAttemptInventory(repository)
  const readiness = { schemaVersion: "factory-calibration-readiness-v1", privacy: "private_offline", manifestRoot: manifest.root, ledgerRoot: inventory.ledgerRoot, terminalRoots, supervisionArtifactRoots, status: "not_ready", reason: "calibration_thresholds_not_frozen" }
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
