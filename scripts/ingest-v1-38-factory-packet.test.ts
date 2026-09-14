import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { factoryOraclePacketFixture } from "../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../packages/strategy-lab/src/factory/identity.js"
import { deriveIntakeProvenanceRoot } from "../packages/strategy-lab/src/factory/intake.js"
import { admitFrozenIntakeProtocol, deriveFrozenIntakeProtocolRoot, deriveIntakeAuthorizationRoot } from "../packages/strategy-lab/src/factory/intake-protocol.js"
import { createFactoryRepository, readFactoryArtifact, resumeFactoryAttemptInventory } from "../packages/strategy-lab/src/factory/repository.js"
import { deriveFrozenModelBundleRoot, deriveFrozenModelRawResponseRecordRoot, deriveFrozenModelRequestRecordRoot, deriveFrozenModelResponseRoot } from "../packages/strategy-oracle-model/src/bundle.js"
import { distillLegalStudent, projectTeacherSearchToLegalTraining, searchCanonicalCounterfactual } from "../packages/strategy-oracle-teacher/src/index.js"
import { ingestNamedFactoryPacket, readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"

const dirs: string[] = []
const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })

describe("named private factory ingestion", () => {
  it("materializes and reloads the real tactical leaf emitter without executing its source", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const result = await ingestNamedFactoryPacket({
      producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer",
      producerInput: { split: "development", doctrineFamily: "test-doctrine", provider: { providerId: "tactical-test", modelId: "local", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: root("6"), correctionRoot: null, retryParentRoot: null } },
    }, repository)
    expect(result.disposition).toBe("accepted")
    if (result.disposition !== "accepted") throw new Error("expected accepted ingestion")
    const reloaded = readFactoryIngestion(repository, result.artifactRoot)
    expect(reloaded.packet.root).toBe(result.packetRoot)
    expect(reloaded.packet.source.root).toBe(result.sourceRoot)
    expect(reloaded.producerIdentity).toBe("emitTacticalFactoryPacket")
    expect(reloaded.sourceUtf8).toContain("export default")
    expect(readFactoryArtifact(repository, result.artifactRoot).byteLength).toBeLessThanOrEqual(262_144)
  })

  it("ingests and reloads a nonempty canonical-search teacher student as inert source data", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-teacher-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const search = searchCanonicalCounterfactual({ canonicalMatch: { matchId: "teacher-ingestion-mechanics", seed: "teacher-ingestion-mechanics", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!, bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: "bottom-fixture", topStrategyRevisionId: "top-fixture", initialInitiativePlayerId: "bottom" }, studentPlayerId: "bottom", counterfactual: { opponentHypothesis: "cautious" }, maxDepth: 3, maxNodes: 128 })
    const records = projectTeacherSearchToLegalTraining(search)
    expect(records.length).toBeGreaterThan(0)
    const student = distillLegalStudent(records)
    const request = { producerIdentity: "emitTeacherFactoryPacket" as const, origin: "teacher-oracle" as const, evidenceClass: "real_producer" as const, producerInput: { student, request: { split: "development" as const, doctrineFamily: "teacher-ingestion", provider: { providerId: "teacher-local", modelId: "offline-search-teacher", modelVersion: "teacher-v3", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } } } }
    const result = await ingestNamedFactoryPacket(request, repository)
    if (result.disposition !== "accepted") throw new Error("teacher ingestion")
    const retained = readFactoryIngestion(createFactoryRepository(directory), result.artifactRoot)
    expect(retained.packetRoot).toBe(result.packetRoot)
    expect(retained.sourceRoot).toBe(result.sourceRoot)
    expect(retained.sourceUtf8).toContain("controllerSoldierBrain")
    expect(retained.producerInput).toEqual(request.producerInput)
    expect(resumeFactoryAttemptInventory(repository).completedAttemptRoots).toHaveLength(0)
    await expect(ingestNamedFactoryPacket(request, repository)).rejects.toThrow("FACTORY_INGEST_DUPLICATE")
  })

  it("rejects fabricated producer labels and mismatched provenance before publication", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    await expect(ingestNamedFactoryPacket({ producerIdentity: "fixture", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: {} } as never, repository)).rejects.toThrow()
    expect(() => readFileSync(join(directory, `factory-artifact-${labRoot("missing", {}).slice(7)}.bin`))).toThrow()
  })

  it("retains unavailable intake configuration without fabricating an attempt", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const result = await ingestNamedFactoryPacket({ producerIdentity: "admitQuarantinedIntakePacket", origin: "human-external-intake", evidenceClass: "real_producer", producerInput: { protocol: {} } }, createFactoryRepository(directory))
    expect(result).toMatchObject({ disposition: "blocked_configuration", attemptRoot: null, authorized: false, allocation: "none" })
  })

  it("reloads an accepted intake from its original charge without consuming another attempt", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const protocolDraft = { schemaVersion: "frozen-intake-protocol-v1" as const, privacy: "private_offline" as const, root: root("0"), authorization: root("0"), participantId: "participant-alpha", reviewerIds: ["reviewer-one"], participantAuthorizationRoot: root("a"), reviewerAuthorizationRoot: root("b"), disclosure: "source-and-provenance" as const, submissionLimit: 1, timeLimitMinutes: 10, reviewerLimit: 1, reviewerReuseLimit: 1, conflictsDeclared: true as const, conflictPolicy: "reject-on-conflict" as const, confidentiality: "private_offline" as const, provenanceRequired: true as const, provenancePolicy: "complete-explicit-deterministic" as const, validationRequired: true as const, validationPolicy: "common-hostile-admission" as const, acceptanceBudget: 1, acceptancePolicy: "accept-only-reviewed-source" as const, dispositionPolicy: "retain-all-terminal-outcomes" as const }
    const authorized = { ...protocolDraft, authorization: deriveIntakeAuthorizationRoot(protocolDraft) }
    const protocol = admitFrozenIntakeProtocol({ ...authorized, root: deriveFrozenIntakeProtocolRoot(authorized) })
    const sourceUtf8 = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}", bytes = new TextEncoder().encode(sourceUtf8)
    const sourceRoot = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot, fixture = factoryOraclePacketFixture()
    const packetValue = { ...fixture, oracleFamily: "human-external-intake", source: { ...fixture.source, root: sourceRoot, sha256: sourceRoot, byteLength: bytes.byteLength } }, packet = { ...packetValue, root: deriveFactoryOraclePacketRoot(packetValue) }
    const provenanceValue = { schemaVersion: "intake-provenance-v1" as const, root: root("0"), participantId: protocol.participantId, reviewerId: "reviewer-one", packetRoot: packet.root, sourceRoot, builderRoot: packet.build.buildRoot, toolchainRoot: packet.build.toolchainRoot, dependencyRoot: root("e"), runtimeRoot: packet.nativeLane.runtimeProfileRoot, sourceKind: "explicit-deterministic" as const, execution: "data-only" as const, liveAgent: false as const, complete: true as const }, provenance = { ...provenanceValue, root: deriveIntakeProvenanceRoot(provenanceValue) }
    const result = await ingestNamedFactoryPacket({ producerIdentity: "admitQuarantinedIntakePacket", origin: "human-external-intake", evidenceClass: "real_producer", producerInput: { protocol, packet, sourceBytes: bytes, provenance, participantId: protocol.participantId, reviewerId: "reviewer-one", elapsedMinutes: 1, conflictFree: true, reviewDisposition: "accept" } }, repository)
    if (result.disposition !== "accepted") throw new Error("intake ingestion")
    expect(readFactoryIngestion(repository, result.artifactRoot).packetRoot).toBe(packet.root)
    expect(resumeFactoryAttemptInventory(repository).completedAttemptRoots).toHaveLength(1)
  })

  it("retains the full admitted model companion and re-admits it on reload", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const modelSource = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}"
    const hash = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
    const responseValue = { format: "explicit-typescript-source" as const, source: modelSource }
    const bundleValue = { schemaVersion: "frozen-model-bundle-v1" as const, privacy: "private_offline" as const, provider: { providerId: "frozen-provider", modelId: "frozen-model", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, request: { root: root("4"), byteLength: 1, encoding: "utf8" as const }, response: { ...responseValue, root: deriveFrozenModelResponseRoot(responseValue) }, source: { root: hash(modelSource), sha256: hash(modelSource), byteLength: new TextEncoder().encode(modelSource).byteLength, encoding: "utf8" as const }, accounting: { inputTokens: 1, outputTokens: 1, tokenLimit: 2, elapsedMilliseconds: 1, resourceRoot: root("5") }, attempt: { attemptRoot: root("6"), budgetRoot: root("7"), ordinal: 0 }, nativeLane: { language: "typescript" as const, providerId: "frozen-provider", runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const }, lineage: { predecessorRoot: root("8"), correctionRoot: null, retryParentRoot: null } }
    const bundle = { ...bundleValue, root: deriveFrozenModelBundleRoot(bundleValue) }
    const result = await ingestNamedFactoryPacket({ producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput: { bundle, request: { split: "development", doctrineFamily: "model-test", build: { buildRoot: root("9"), toolchainRoot: root("a") }, lineage: bundle.lineage } } }, repository)
    if (result.disposition !== "accepted") throw new Error("model ingestion")
    const reloaded = readFactoryIngestion(repository, result.artifactRoot)
    expect(reloaded.modelCompanion?.bundle).toEqual(bundle)
    expect(reloaded.modelCompanion?.packetRoot).toBe(reloaded.packetRoot)
  })

  it("re-admits a v2 bundle only with its exact private unavailable-snapshot provenance", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-v2-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const modelSource = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}"
    const hash = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
    const responseValue = { format: "explicit-typescript-source" as const, source: modelSource }
    const requestRecordValue = { byteLength: new TextEncoder().encode("disclosed packet").byteLength, encoding: "utf8" as const, bodyUtf8: "disclosed packet" }
    const requestRecord = { ...requestRecordValue, root: deriveFrozenModelRequestRecordRoot(requestRecordValue) }
    const rawResponseRecordValue = { format: "codex-exec-json" as const, bodyUtf8: [
      { jsonrpc: "2.0", id: 2, result: { thread: { id: "thread-1" }, model: "reported-model", modelProvider: "frozen-provider", cwd: "/disclosed", sandbox: { type: "readOnly", networkAccess: false }, instructionSources: [] } },
      { jsonrpc: "2.0", id: 3, result: { turn: { id: "turn-1" } } },
      { jsonrpc: "2.0", method: "item/completed", params: { threadId: "thread-1", turnId: "turn-1", item: { id: "item-1", type: "agentMessage", text: JSON.stringify({ source: modelSource }) } } },
      { jsonrpc: "2.0", method: "thread/tokenUsage/updated", params: { threadId: "thread-1", turnId: "turn-1", tokenUsage: { total: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1, reasoningOutputTokens: 0, totalTokens: 2 }, last: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1, reasoningOutputTokens: 0, totalTokens: 2 } } } },
      { jsonrpc: "2.0", method: "turn/completed", params: { threadId: "thread-1", turn: { id: "turn-1", status: "completed" } } },
    ].map((event) => JSON.stringify(event)).join("\n") + "\n" }
    const rawResponseRecord = { ...rawResponseRecordValue, root: deriveFrozenModelRawResponseRecordRoot(rawResponseRecordValue) }
    const v1 = { schemaVersion: "frozen-model-bundle-v1" as const, privacy: "private_offline" as const, provider: { providerId: "frozen-provider", modelId: "reported-model", modelVersion: "undisclosed", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, request: { root: requestRecord.root, byteLength: requestRecord.byteLength, encoding: "utf8" as const }, response: { ...responseValue, root: deriveFrozenModelResponseRoot(responseValue) }, source: { root: hash(modelSource), sha256: hash(modelSource), byteLength: new TextEncoder().encode(modelSource).byteLength, encoding: "utf8" as const }, accounting: { inputTokens: 1, outputTokens: 1, tokenLimit: 2, elapsedMilliseconds: 1, resourceRoot: root("5") }, attempt: { attemptRoot: root("6"), budgetRoot: root("7"), ordinal: 0 }, nativeLane: { language: "typescript" as const, providerId: "frozen-provider", runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const }, lineage: { predecessorRoot: root("8"), correctionRoot: null, retryParentRoot: null } }
    const value = { ...v1, schemaVersion: "frozen-model-bundle-v2" as const, provider: { ...v1.provider, modelVersion: null, servingSnapshot: { availability: "unavailable" as const } }, provenance: { requestedModelId: "reported-model", reportedModelId: "reported-model", client: { version: "codex-cli-test", settingsRoot: v1.provider.settingsRoot }, servingSnapshot: { availability: "unavailable" as const }, requestRecordRoot: requestRecord.root, responseRecordRoot: rawResponseRecord.root, requestRecord, rawResponseRecord, actualUsage: { inputTokens: 1, outputTokens: 1, cachedInputTokens: 0, totalTokens: 2 } } }
    const bundle = { ...value, root: deriveFrozenModelBundleRoot(value) }
    const result = await ingestNamedFactoryPacket({ producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput: { bundle, request: { split: "development", doctrineFamily: "model-v2", build: { buildRoot: root("9"), toolchainRoot: root("a") }, lineage: bundle.lineage } } }, repository)
    if (result.disposition !== "accepted") throw new Error("v2 model ingestion")
    expect(readFactoryIngestion(repository, result.artifactRoot).modelCompanion?.bundle.schemaVersion).toBe("frozen-model-bundle-v2")
  })
})
