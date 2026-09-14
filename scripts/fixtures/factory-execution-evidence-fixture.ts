import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, publishFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { deriveFrozenModelBundleRoot, deriveFrozenModelRawResponseRecordRoot, deriveFrozenModelRequestRecordRoot, deriveFrozenModelResponseRoot } from "../../packages/strategy-oracle-model/src/bundle.js"
import { distillLegalStudent } from "../../packages/strategy-oracle-teacher/src/distill.js"
import { createFactoryAuthoringAllocation, FACTORY_SOURCE_RECIPES } from "../v1-38-factory-allocation.js"
import { deriveFactoryNegativeWitness, deriveFactorySharedHelperAudit, factoryEvidenceByteRoot, type FactoryAuthoringRecordRefs } from "../v1-38-factory-execution-evidence.js"
import { ingestNamedFactoryPacket } from "../ingest-v1-38-factory-packet.js"
import { factoryAssessmentImplementationRoot } from "../v1-38-factory-implementation.js"

const source = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}"
const bytesRoot = (value: string | Uint8Array): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}`
const root = (value: string): LabRoot => labRoot("factory-execution-fixture-v1", value)
const encode = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw new TypeError("FACTORY_EXECUTION_FIXTURE_ENCODING"); return admitted.canonicalBytes }
const publishRooted = (repository: ReturnType<typeof createFactoryRepository>, domain: string, value: Record<string, unknown>) => publishFactoryArtifact(repository, encode({ ...value, root: labRoot(domain, value) }))

/** Pure retained-data fixture. It launches no model, search, guest, runtime, or Match. */
export const createFactoryExecutionEvidenceFixture = async () => {
  const repository = createFactoryRepository(realpathSync(mkdtempSync(join(tmpdir(), "factory-execution-evidence-fixture-"))))
  const allocation = createFactoryAuthoringAllocation(), cwd = join(repository.directory, "isolated-author")
  const settings = { providerId: "openai-codex", settingsRoot: root("settings"), promptRoot: root("prompt"), contextRoot: root("context"), budgetRoot: root("budget"), runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, predecessorRoot: root("predecessor"), correctionRoot: null, retryParentRoot: null }
  const stdin = "inert admitted packet only", usage = { inputTokens: 12, cachedInputTokens: 2, outputTokens: 8, totalTokens: 20 }
  const raw = [
    { jsonrpc: "2.0", id: 2, result: { thread: { id: "thread-1" }, model: "gpt-5.6-sol", modelProvider: settings.providerId, cwd, sandbox: { type: "readOnly", networkAccess: false }, approvalPolicy: "never", instructionSources: [] } },
    { jsonrpc: "2.0", id: 3, result: { turn: { id: "turn-1" } } },
    { jsonrpc: "2.0", method: "item/completed", params: { turnId: "turn-1", item: { type: "agentMessage", text: JSON.stringify({ source }) } } },
    { jsonrpc: "2.0", method: "thread/tokenUsage/updated", params: { turnId: "turn-1", tokenUsage: { total: { ...usage, reasoningOutputTokens: 1 } } } },
    { jsonrpc: "2.0", method: "turn/completed", params: { turn: { id: "turn-1", status: "completed" } } },
  ].map((event) => JSON.stringify(event)).join("\n") + "\n"
  const request = { schemaVersion: "factory-model-author-request-v1", allocationRoot: allocation.root, packetRoot: root("packet"), requestedModel: "gpt-5.6-sol", codexExecutable: "/usr/bin/codex", clientVersion: "codex-cli 0.139.0", clientSettings: ["--stdio", "--strict-config", ...Object.keys(FACTORY_SOURCE_RECIPES).slice(0, 11).flatMap((name) => ["--disable", name])], launchEnvironment: { PATH: "/usr/bin:/bin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }, frozenSettings: settings, recipes: FACTORY_SOURCE_RECIPES, context: stdin, cwd, cwdClass: "fresh-disclosed-packet-only-outside-repository" }
  const requestRoot = labRoot("factory-model-author-request-v1", request)
  const startValue = { schemaVersion: "factory-model-author-attempt-start-v1", allocationRoot: allocation.root, ordinal: "A-01", startedAtMs: 1000, firstStartedAtMs: 1000, requestRecordRoot: requestRoot }, start = { ...startValue, root: labRoot("factory-model-author-attempt-start-v1", startValue) }
  const terminalValue = { schemaVersion: "factory-model-author-attempt-terminal-v1", startRoot: start.root, disposition: "valid", usage, elapsedMilliseconds: 50, requestBytesRoot: bytesRoot(stdin), responseBytesRoot: bytesRoot(raw), sourceBytesRoot: bytesRoot(source), requestedModel: request.requestedModel, reportedModel: request.requestedModel }, terminal = { ...terminalValue, root: labRoot("factory-model-author-attempt-terminal-v1", terminalValue) }
  const cleanupValue = { schemaVersion: "factory-model-author-process-cleanup-v1", startRoot: start.root, disposition: "sigterm" }, cleanup = { ...cleanupValue, root: labRoot("factory-model-author-process-cleanup-v1", cleanupValue) }
  const retain = (value: unknown) => publishFactoryArtifact(repository, encode(value))
  const refs: FactoryAuthoringRecordRefs = { start: retain(start), request: retain(request), stdin: publishFactoryArtifact(repository, new TextEncoder().encode(stdin)), response: publishFactoryArtifact(repository, new TextEncoder().encode(raw)), source: publishFactoryArtifact(repository, new TextEncoder().encode(source)), terminal: retain(terminal), cleanup: retain(cleanup) }
  const requestRecordValue = { byteLength: new TextEncoder().encode(stdin).byteLength, encoding: "utf8" as const, bodyUtf8: stdin }, requestRecord = { ...requestRecordValue, root: deriveFrozenModelRequestRecordRoot(requestRecordValue) }
  const rawResponseValue = { format: "codex-exec-json" as const, bodyUtf8: raw }, rawResponseRecord = { ...rawResponseValue, root: deriveFrozenModelRawResponseRecordRoot(rawResponseValue) }
  const responseValue = { format: "explicit-typescript-source" as const, source }, response = { ...responseValue, root: deriveFrozenModelResponseRoot(responseValue) }
  const bundleValue = { schemaVersion: "frozen-model-bundle-v2" as const, privacy: "private_offline" as const, provider: { providerId: settings.providerId, modelId: request.requestedModel, modelVersion: null, settingsRoot: settings.settingsRoot, promptRoot: settings.promptRoot, contextRoot: settings.contextRoot, servingSnapshot: { availability: "unavailable" as const } }, request: { root: requestRecord.root, byteLength: requestRecord.byteLength, encoding: "utf8" as const }, response, source: { root: bytesRoot(source), sha256: bytesRoot(source), byteLength: new TextEncoder().encode(source).byteLength, encoding: "utf8" as const }, accounting: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, tokenLimit: 50_000, elapsedMilliseconds: 50, resourceRoot: labRoot("factory-model-author-resource-v1", { usage, elapsedMilliseconds: 50 }) }, attempt: { attemptRoot: start.root, budgetRoot: settings.budgetRoot, ordinal: 1 }, nativeLane: { language: "typescript" as const, providerId: settings.providerId, runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: settings.runtimeProfileRoot, translation: "none" as const }, lineage: { predecessorRoot: settings.predecessorRoot, correctionRoot: null, retryParentRoot: null }, provenance: { requestedModelId: request.requestedModel, reportedModelId: request.requestedModel, client: { version: request.clientVersion, settingsRoot: settings.settingsRoot }, servingSnapshot: { availability: "unavailable" as const }, requestRecordRoot: requestRecord.root, responseRecordRoot: rawResponseRecord.root, requestRecord, rawResponseRecord, actualUsage: usage } }
  const bundle = { ...bundleValue, root: deriveFrozenModelBundleRoot(bundleValue) }
  const base = (kind: string) => ({ split: "development" as const, doctrineFamily: `fixture-${kind}`, provider: { providerId: `fixture-${kind}`, modelId: "fixture", modelVersion: "v1", settingsRoot: root(`${kind}-settings`), promptRoot: root(`${kind}-prompt`), contextRoot: root(`${kind}-context`) }, build: { buildRoot: root(`${kind}-build`), toolchainRoot: root(`${kind}-tools`) }, lineage: { predecessorRoot: root(`${kind}-parent`), correctionRoot: null, retryParentRoot: null } })
  const tactical = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: base("tactical") }, repository)
  const soldier = { id: "s", ownerPlayerId: "bottom", status: "ACTIVE", position: { x: 2, y: 11 }, facing: "UP", lastSuccessfulMoveDirection: null }
  const legal = { kind: "activation" as const, target: "press" as const, input: { phaseNumber: 1, roundNumber: 1, activationCount: 2, board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers: [soldier], terrainStones: [] }, mySoldiers: [soldier], enemySoldiers: [], strategyMemory: {}, initialInitiativePlayerId: "bottom", hasInitialInitiative: true, roundInitiativePlayerId: "bottom", hasRoundInitiative: true } }
  const student = distillLegalStudent([legal])
  const teacher = await ingestNamedFactoryPacket({ producerIdentity: "emitTeacherFactoryPacket", origin: "teacher-oracle", evidenceClass: "real_producer", producerInput: { student, request: base("teacher") } }, repository)
  const model = await ingestNamedFactoryPacket({ producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput: { bundle, request: { split: "development", doctrineFamily: "fixture-model", build: base("model").build, lineage: { predecessorRoot: settings.predecessorRoot, correctionRoot: null, retryParentRoot: null } } } }, repository)
  if (tactical.disposition !== "accepted" || teacher.disposition !== "accepted" || model.disposition !== "accepted") throw new TypeError("FACTORY_EXECUTION_FIXTURE_INGESTION")
  const ingestions = { S01: tactical.record, S03: teacher.record, S05: model.record }
  const manifest = { root: root("manifest") }, fresh = { manifest, ingestions } as any
  const sourceCommit = "a".repeat(40), reportArtifactRoot = publishFactoryArtifact(repository, new TextEncoder().encode(`review ${sourceCommit}`))
  const reviewValue = { schemaVersion: "factory-source-review-v1", sourceCommit, implementationRoot: factoryAssessmentImplementationRoot(), reviewerId: "reviewer", authorIds: ["author"], status: "passed", unresolvedFindings: 0, reportArtifactRoot }, sourceReviewArtifactRoot = publishRooted(repository, "factory-source-review-v1", reviewValue)
  const outcomes = ["one", "two"].map((template, index) => { const value = { template, score: [index,0,0,0], stateRoot: root(`state-${index}`), terminal: "nonterminal" }; return { ...value, outcomeRoot: factoryEvidenceByteRoot(JSON.stringify(value)) } })
  const receipt = { alternativesEvaluated: 2, canonicalTransitionRoot: outcomes[0]!.outcomeRoot, depthReached: 1, nodesVisited: 2, offlineOnly: true, outcomeRoots: outcomes.map((entry) => entry.outcomeRoot), outcomes, selectedLegalTargets: [legal], selectedOutcomeRoot: outcomes[0]!.outcomeRoot, selectedTemplate: outcomes[0]!.template }
  const teacherSearchArtifactRoot = publishRooted(repository, "factory-teacher-search-evidence-v1", { schemaVersion: "factory-teacher-search-evidence-v1", charged: true, runs: 1, allocationOrdinal: 0, request: { maxDepth: 3, maxNodes: 128 }, receipt })
  const teacherTrainingArtifactRoot = publishRooted(repository, "factory-teacher-training-evidence-v1", { schemaVersion: "factory-teacher-training-evidence-v1", searchArtifactRoot: teacherSearchArtifactRoot, records: [legal], student })
  const sharedHelperAuditArtifactRoot = retain(deriveFactorySharedHelperAudit(ingestions))
  const negativeWitnessArtifactRoots = { S01: retain(deriveFactoryNegativeWitness(ingestions.S01)), S03: retain(deriveFactoryNegativeWitness(ingestions.S03)), S05: retain(deriveFactoryNegativeWitness(ingestions.S05)) }
  const executionValue = { schemaVersion: "factory-calibration-execution-evidence-v1", manifestRoot: manifest.root, sourceCommit, sourceReviewArtifactRoot, authoring: [refs], teacherSearchArtifactRoot, teacherTrainingArtifactRoot, sharedHelperAuditArtifactRoot, negativeWitnessArtifactRoots }
  const executionEvidenceArtifactRoot = publishRooted(repository, "factory-calibration-execution-evidence-v1", executionValue)
  return { repository, fresh, executionEvidenceArtifactRoot, refs, roots: { sourceReviewArtifactRoot, teacherSearchArtifactRoot, teacherTrainingArtifactRoot, sharedHelperAuditArtifactRoot, ...negativeWitnessArtifactRoots } }
}
