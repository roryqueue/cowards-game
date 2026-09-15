import { createHash } from "node:crypto"
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, symlinkSync, writeFileSync } from "node:fs"
import { isAbsolute, join } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitLeagueExecutionAllocation, type LeagueExecutionAllocation, type LeagueResponseJob } from "../../packages/strategy-lab/src/league/allocation.js"
import { declareRedTeamAllocation, type RedTeamAttemptStart } from "../../packages/strategy-lab/src/league/red-team.js"
import { publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "../../packages/strategy-lab/src/factory/repository.js"
import { admitFrozenModelBundle, deriveFrozenModelBundleRoot, deriveFrozenModelRequestRecordRoot, deriveFrozenModelRawResponseRecordRoot, deriveFrozenModelResponseRoot } from "../../packages/strategy-oracle-model/src/bundle.js"
import { assertModelSourceClosure } from "../../packages/strategy-oracle-model/src/emit.js"
import { searchCanonicalCounterfactual, type TeacherSearchRequest } from "../../packages/strategy-oracle-teacher/src/teacher.js"
import { distillLegalStudent, projectTeacherSearchToLegalTraining } from "../../packages/strategy-oracle-teacher/src/distill.js"
import { admitFrozenIntakeProtocol } from "../../packages/strategy-lab/src/factory/intake-protocol.js"
import { ingestNamedFactoryPacket, readFactoryIngestion, type FactoryIngestionRequest } from "../ingest-v1-38-factory-packet.js"
import { createFactoryAppServerTransport, FactoryAppServerTurnFailure, type FactoryAppServerTransport, type FactoryAppServerTransportOptions, type FactoryAppServerTurnResult } from "../v1-38-factory-app-server-transport.js"

const fail = (code: string): never => { throw new TypeError(`LEAGUE_AUTHOR_${code}`) }
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join()
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const encode = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); return encoded.ok ? encoded.canonicalBytes : fail("CANONICAL") }
const read = (repository: FactoryRepository, root: LabRoot): unknown => { const result = admitCanonicalJsonBytes(readFactoryArtifact(repository, root), { profile: "canonical-manifest", operation: "require-canonical" }); return result.ok ? result.value : fail("ARTIFACT") }
interface ModelAuthoring {
  sourceMessage: string; codexExecutable: string; clientVersion: string; stateDirectory: string; disclosedDirectory: string; existingAuthFile: string;
  requestedModel: string; requestedProvider: string; path: string; settingsRoot: LabRoot; promptRoot: LabRoot; contextRoot: LabRoot
}
export interface LeagueAuthoringPreflight { allocation: LeagueExecutionAllocation; job: LeagueResponseJob; request: FactoryIngestionRequest; model: ModelAuthoring | null }

/** Validate the entire explicit job before creating directories, intake records or a model process. */
export const preflightLeagueAuthoring = (input: { allocation: unknown; jobId: string; repository: FactoryRepository }): Readonly<LeagueAuthoringPreflight> => {
  const allocation = admitLeagueExecutionAllocation(input.allocation), job = allocation.rounds.flatMap((round) => round.jobs).find((job) => job.id === input.jobId) ?? fail("JOB")
  if (allocation.outputDirectories.responseFactory !== input.repository.directory) return fail("OUTPUT_BINDING")
  const request = read(input.repository, job.producerRequestArtifactRoot)
  if (!exact(request, ["producerIdentity", "origin", "evidenceClass", "producerInput"]) || request.evidenceClass !== "real_producer") return fail("REQUEST")
  const disclosure = read(input.repository, job.disclosureArtifactRoot), provenance = read(input.repository, job.provenanceArtifactRoot), review = read(input.repository, job.reviewArtifactRoot)
  if (!exact(disclosure, ["participantId", "requestArtifactRoot", "sourceAndBuildDisclosed", "dependencyArtifactRoots"]) || disclosure.participantId !== job.participantId || disclosure.requestArtifactRoot !== job.producerRequestArtifactRoot || disclosure.sourceAndBuildDisclosed !== true || !Array.isArray(disclosure.dependencyArtifactRoots)) return fail("DISCLOSURE")
  for (const artifact of disclosure.dependencyArtifactRoots) readFactoryArtifact(input.repository, artifact as LabRoot)
  if (!exact(provenance, ["participantId", "priorExposure", "conflicts", "origin", "deterministicDataOnly"]) || provenance.participantId !== job.participantId || typeof provenance.priorExposure !== "string" || provenance.conflicts !== "none" || provenance.origin !== request.origin || provenance.deterministicDataOnly !== true) return fail("PROVENANCE")
  if (!exact(review, ["reviewerId", "participantId", "disclosureArtifactRoot", "provenanceArtifactRoot", "disposition", "reviewMilliseconds"]) || review.reviewerId !== job.reviewerId || review.participantId !== job.participantId || review.disclosureArtifactRoot !== job.disclosureArtifactRoot || review.provenanceArtifactRoot !== job.provenanceArtifactRoot || review.disposition !== "accepted" || !Number.isSafeInteger(review.reviewMilliseconds) || Number(review.reviewMilliseconds) < 0 || Number(review.reviewMilliseconds) > job.reservation.reviewMilliseconds) return fail("REVIEW")
  const allowed = job.channel === "automated" ? ["emitTacticalFactoryPacket", "emitTeacherFactoryPacket"] : job.channel === "model" ? ["emitModelFactoryPacket"] : ["admitQuarantinedIntakePacket"]
  if (!allowed.includes(String(request.producerIdentity))) return fail("CHANNEL")
  if (job.channel === "human" || job.channel === "external") {
    const data = request.producerInput as Record<string, unknown>, protocol = admitFrozenIntakeProtocol(data.protocol)
    const decisionRoot = labRoot("league-prospective-decision-v1", { operatorDecision: allocation.operatorDecision, implementationRoot: allocation.implementationRoot })
    if (protocol.participantId !== job.participantId || protocol.reviewerIds.join() !== job.reviewerId || protocol.participantAuthorizationRoot !== labRoot("league-intake-participant-v1", { decisionRoot, jobId: job.id, participantId: job.participantId }) || protocol.reviewerAuthorizationRoot !== labRoot("league-intake-reviewer-v1", { decisionRoot, jobId: job.id, reviewerId: job.reviewerId }) || protocol.submissionLimit !== 1 || protocol.acceptanceBudget !== 1 || protocol.reviewerLimit !== 1 || protocol.reviewerReuseLimit !== 1 || protocol.timeLimitMinutes * 60000 > job.reservation.effortMilliseconds) return fail("INTAKE_ALLOCATION")
  }
  if (request.producerIdentity === "emitTeacherFactoryPacket") {
    const data = request.producerInput
    if (!exact(data, ["searches", "request"]) || !Array.isArray(data.searches) || !data.searches.length || data.searches.length > job.reservation.distillationUnits || data.searches.some((search: TeacherSearchRequest) => !Number.isSafeInteger(search.maxDepth) || Number(search.maxDepth) < 1 || !Number.isSafeInteger(search.maxNodes) || Number(search.maxNodes) < 1) || data.searches.reduce((sum: number, search: TeacherSearchRequest) => sum + Number(search.maxNodes), 0) > job.reservation.teacherNodes) return fail("TEACHER_BUDGET")
  }
  let model: ModelAuthoring | null = null
  if (job.channel === "model" && job.operation === "produce") {
    const producerInput = request.producerInput
    if (!exact(producerInput, ["authoring", "request"]) || !exact(producerInput.authoring, ["sourceMessage", "codexExecutable", "clientVersion", "stateDirectory", "disclosedDirectory", "existingAuthFile", "requestedModel", "requestedProvider", "path", "settingsRoot", "promptRoot", "contextRoot"])) return fail("MODEL_CONFIGURATION")
    model = producerInput.authoring as unknown as ModelAuthoring
    if (Object.values(model).some((value) => typeof value !== "string" || !value.length) || [model.codexExecutable, model.stateDirectory, model.disclosedDirectory, model.existingAuthFile].some((path) => !isAbsolute(path)) || model.stateDirectory === model.disclosedDirectory || existsSync(model.stateDirectory) || existsSync(model.disclosedDirectory) || !lstatSync(model.codexExecutable).isFile() || !lstatSync(model.existingAuthFile).isFile() || job.reservation.modelTokens < 1 || job.reservation.effortMilliseconds < 1 || byteRoot(new TextEncoder().encode(model.sourceMessage)) !== model.promptRoot || model.contextRoot !== labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: disclosure.dependencyArtifactRoots })) return fail("MODEL_CONFIGURATION")
  }
  return Object.freeze({ allocation, job, request: request as unknown as FactoryIngestionRequest, model })
}

export interface LeagueAuthoringResult { disposition: "produced" | "invalid" | "system_failure" | "unfilled" | "unused"; startRoot: LabRoot; ingestionArtifactRoot: LabRoot | null; evidenceArtifactRoot: LabRoot; modelTokens: number | null; elapsedMilliseconds: number }
const retainRaw = (repository: FactoryRepository, bytes: Uint8Array, maximum: number): LabRoot => {
  if (bytes.byteLength > maximum) return fail("RAW_BUDGET")
  let previousRoot: LabRoot | null = null, ordinal = 0
  for (let offset = 0; offset < bytes.length; offset += 131072) { const data = bytes.subarray(offset, offset + 131072), bytesRoot = publishFactoryArtifact(repository, data); previousRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "league-author-raw-chunk-v1", ordinal: ordinal++, previousRoot, bytesRoot, byteLength: data.byteLength })) }
  return publishFactoryArtifact(repository, encode({ schemaVersion: "league-author-raw-stream-v1", byteLength: bytes.length, byteRoot: byteRoot(bytes), chunkCount: ordinal, tailRoot: previousRoot }))
}
export const readRetainedLeagueAuthorRaw = (repository: FactoryRepository, artifactRoot: LabRoot, maximum: number): Uint8Array => {
  const descriptor = read(repository, artifactRoot) as any
  if (!exact(descriptor, ["schemaVersion", "byteLength", "byteRoot", "chunkCount", "tailRoot"]) || descriptor.schemaVersion !== "league-author-raw-stream-v1" || !Number.isSafeInteger(descriptor.byteLength) || Number(descriptor.byteLength) < 0 || Number(descriptor.byteLength) > maximum || descriptor.chunkCount !== Math.ceil(Number(descriptor.byteLength) / 131072)) return fail("RETAINED_RAW_DESCRIPTOR")
  const bytes = new Uint8Array(Number(descriptor.byteLength)); let tail = descriptor.tailRoot, remaining = bytes.length
  for (let ordinal = Number(descriptor.chunkCount) - 1; ordinal >= 0; ordinal--) {
    const chunk = read(repository, tail as LabRoot) as any
    if (!exact(chunk, ["schemaVersion", "ordinal", "previousRoot", "bytesRoot", "byteLength"]) || chunk.schemaVersion !== "league-author-raw-chunk-v1" || chunk.ordinal !== ordinal) return fail("RETAINED_RAW_CHUNK")
    const data = readFactoryArtifact(repository, chunk.bytesRoot as LabRoot), expected = ordinal === Number(descriptor.chunkCount) - 1 ? bytes.length - ordinal * 131072 : 131072
    if (data.length !== chunk.byteLength || data.length !== expected) return fail("RETAINED_RAW_SIZE")
    remaining -= data.length; bytes.set(data, remaining); tail = chunk.previousRoot
  }
  if (remaining || tail !== null || byteRoot(bytes) !== descriptor.byteRoot) return fail("RETAINED_RAW_CONTENT")
  return bytes
}

/** The durable Phase 265 charge must already exist. The injected transport is fixture-only. */
export const executeLeagueAuthoring = async (input: { repository: FactoryRepository; allocation: unknown; jobId: string; startArtifactRoot: LabRoot; targetArtifactRoot?: LabRoot; transportFactory?: (options: FactoryAppServerTransportOptions) => Promise<FactoryAppServerTransport>; clock?: () => number }): Promise<Readonly<LeagueAuthoringResult>> => {
  const preflight = preflightLeagueAuthoring(input), { allocation, job } = preflight, start = read(input.repository, input.startArtifactRoot) as RedTeamAttemptStart
  const { root: startRoot, ...startBody } = start
  const ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
  if (startRoot !== labRoot("league-red-team-start-v1", startBody) || start.allocationRoot !== ledger.allocation.root || start.inputRoot !== job.producerRequestArtifactRoot || start.participantId !== job.participantId || start.reviewerId !== job.reviewerId || labRoot("league-reservation", start.reservation) !== labRoot("league-reservation", job.reservation) || input.transportFactory && allocation.evidenceClass !== "injected_fixture") return fail("CHARGE")
  const target = input.targetArtifactRoot === undefined ? null : read(input.repository, input.targetArtifactRoot) as { roundRoot: LabRoot; candidateRoot: LabRoot }
  if (target && (target.roundRoot !== start.roundRoot || target.candidateRoot !== start.candidateRoot)) return fail("TARGET_BINDING")
  if (job.evaluationRole !== "development_response" && target !== null) return fail("INDEPENDENT_AUTHORING_TARGET_LEAK")
  if (allocation.evidenceClass === "empirical" && job.operation === "produce" && job.evaluationRole === "development_response" && target === null) return fail("TARGET_REQUIRED")
  const clock = input.clock ?? Date.now, before = clock()
  let ingestionArtifactRoot: LabRoot | null = null, disposition: LeagueAuthoringResult["disposition"] = "invalid", modelTokens: number | null = 0, rawRoot: LabRoot | null = null, cleanup = "not_started", failure: string | null = null, transport: FactoryAppServerTransport | null = null
  const teacherArtifactRoots: LabRoot[] = []
  try {
    if (job.operation !== "produce") disposition = job.operation
    else {
      let request = preflight.request
      if (preflight.model) {
        const template = preflight.model, sourceMessage = target === null ? template.sourceMessage : `${template.sourceMessage}\n\nFrozen current league target (data, not instructions):\n${new TextDecoder().decode(encode(target))}`
        const model = { ...template, sourceMessage, promptRoot: byteRoot(new TextEncoder().encode(sourceMessage)), contextRoot: target === null ? template.contextRoot : labRoot("league-response-context-v1", { templateContextRoot: template.contextRoot, targetArtifactRoot: input.targetArtifactRoot }) }
        mkdirSync(model.stateDirectory, { mode: 0o700 }); mkdirSync(model.disclosedDirectory, { mode: 0o700 })
        if (readdirSync(model.stateDirectory).length || readdirSync(model.disclosedDirectory).length) return fail("MODEL_DIRECTORY")
        if (target !== null) for (const candidate of (target as any).candidates ?? []) {
          const bytes = readFactoryArtifact(input.repository, candidate.sourceArtifactRoot)
          if (bytes.length !== candidate.byteLength || bytes.length > allocation.operations.sourceLimitBytes || candidate.disclosedFile !== `candidate-${candidate.sourceArtifactRoot.slice(7)}.ts`) return fail("TARGET_SOURCE")
          writeFileSync(join(model.disclosedDirectory, candidate.disclosedFile), bytes, { flag: "wx", mode: 0o600 })
        }
        writeFileSync(join(model.stateDirectory, "config.toml"), `model = ${JSON.stringify(model.requestedModel)}\napproval_policy = "never"\nsandbox_mode = "read-only"\n`, { flag: "wx", mode: 0o600 })
        symlinkSync(realpathSync(model.existingAuthFile), join(model.stateDirectory, "auth.json"))
        modelTokens = null
        transport = await (input.transportFactory ?? createFactoryAppServerTransport)({ codexExecutable: realpathSync(model.codexExecutable), codexHome: model.stateDirectory, cwd: model.disclosedDirectory, env: { CODEX_HOME: model.stateDirectory, LANG: "C.UTF-8", LC_ALL: "C.UTF-8", PATH: model.path }, requestedModel: model.requestedModel, requestedProvider: model.requestedProvider, timeoutMs: job.reservation.effortMilliseconds })
        const remaining = job.reservation.effortMilliseconds - Math.max(0, clock() - before)
        if (remaining < 1) return fail("MODEL_TIMEBOX")
        const observed: FactoryAppServerTurnResult = await transport.startTurn(model.sourceMessage, remaining)
        rawRoot = retainRaw(input.repository, observed.rawJsonl, allocation.operations.maxArtifactBytes)
        modelTokens = observed.usage.totalTokens
        if (observed.reportedModel !== model.requestedModel || modelTokens > job.reservation.modelTokens || clock() - before > job.reservation.effortMilliseconds) return fail("MODEL_BOUND")
        const parsed = JSON.parse(observed.sourceMessage)
        if (!exact(parsed, ["source"]) || typeof parsed.source !== "string") return fail("MODEL_SOURCE")
        assertModelSourceClosure(parsed.source)
        const source = parsed.source, sourceBytes = new TextEncoder().encode(source), sourceRoot = byteRoot(sourceBytes), elapsedMilliseconds = Math.max(0, clock() - before)
        const requestRecordValue = { byteLength: new TextEncoder().encode(model.sourceMessage).length, encoding: "utf8" as const, bodyUtf8: model.sourceMessage }, requestRecord = { ...requestRecordValue, root: deriveFrozenModelRequestRecordRoot(requestRecordValue) }
        const rawValue = { format: "codex-exec-json" as const, bodyUtf8: new TextDecoder("utf-8", { fatal: true }).decode(observed.rawJsonl) }, rawResponseRecord = { ...rawValue, root: deriveFrozenModelRawResponseRecordRoot(rawValue) }
        const responseValue = { format: "explicit-typescript-source" as const, source }, response = { ...responseValue, root: deriveFrozenModelResponseRoot(responseValue) }
        const producerInput = request.producerInput as { request: { lineage: { predecessorRoot: LabRoot; correctionRoot: LabRoot | null; retryParentRoot: LabRoot | null } } }
        const usage = { inputTokens: observed.usage.inputTokens, outputTokens: observed.usage.outputTokens, cachedInputTokens: observed.usage.cachedInputTokens, totalTokens: observed.usage.totalTokens }
        const provider = { providerId: model.requestedProvider, modelId: model.requestedModel, modelVersion: null, settingsRoot: model.settingsRoot, promptRoot: model.promptRoot, contextRoot: model.contextRoot, servingSnapshot: { availability: "unavailable" as const } }
        const value = { schemaVersion: "frozen-model-bundle-v2" as const, privacy: "private_offline" as const, provider, request: { root: requestRecord.root, byteLength: requestRecord.byteLength, encoding: requestRecord.encoding }, response, source: { root: sourceRoot, sha256: sourceRoot, byteLength: sourceBytes.length, encoding: "utf8" as const }, accounting: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, tokenLimit: job.reservation.modelTokens, elapsedMilliseconds, resourceRoot: labRoot("league-model-resource-v1", { startRoot, usage, elapsedMilliseconds }) }, attempt: { attemptRoot: startRoot, budgetRoot: allocation.root, ordinal: start.ordinal + 1 }, nativeLane: { language: "typescript" as const, providerId: model.requestedProvider, runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: allocation.runtimeRoot, translation: "none" as const }, lineage: producerInput.request.lineage, provenance: { requestedModelId: model.requestedModel, reportedModelId: observed.reportedModel, client: { version: model.clientVersion, settingsRoot: model.settingsRoot }, servingSnapshot: { availability: "unavailable" as const }, requestRecordRoot: requestRecord.root, responseRecordRoot: rawResponseRecord.root, requestRecord, rawResponseRecord, actualUsage: usage } }
        const bundle = admitFrozenModelBundle({ ...value, root: deriveFrozenModelBundleRoot(value) })
        request = { ...request, producerInput: { bundle, request: producerInput.request } }
      } else if (job.channel === "human" || job.channel === "external") {
        const { sourceUtf8, ...packet } = request.producerInput as Record<string, unknown>
        if (typeof sourceUtf8 !== "string") return fail("INTAKE_SOURCE")
        request = { ...request, producerInput: { ...packet, sourceBytes: new TextEncoder().encode(sourceUtf8) } }
      } else if (request.producerIdentity === "emitTeacherFactoryPacket") {
        const teacher = request.producerInput as { searches: TeacherSearchRequest[]; request: unknown }, receipts = []
        for (const search of teacher.searches) { if (clock() - before >= job.reservation.effortMilliseconds) return fail("TEACHER_TIMEBOX"); const receipt = searchCanonicalCounterfactual(search); teacherArtifactRoots.push(retainRaw(input.repository, encode({ schemaVersion: "league-teacher-search-v1", startRoot, requestRoot: labRoot("league-teacher-search-request-v1", search), receipt }), allocation.operations.maxArtifactBytes)); receipts.push(receipt) }
        const student = distillLegalStudent(receipts.flatMap(projectTeacherSearchToLegalTraining))
        request = { ...request, producerInput: { student, request: teacher.request } }
      }
      const produced = await ingestNamedFactoryPacket(request, input.repository)
      if (produced.disposition !== "accepted") return fail("PRODUCER_CONFIGURATION")
      readFactoryIngestion(input.repository, produced.artifactRoot)
      ingestionArtifactRoot = produced.artifactRoot; disposition = "produced"
    }
  } catch (error) {
    disposition = "system_failure"; failure = error instanceof Error ? error.name : "unknown"
    if (error instanceof FactoryAppServerTurnFailure) { modelTokens = error.evidence.usage?.totalTokens ?? null; rawRoot = retainRaw(input.repository, error.evidence.rawJsonl, allocation.operations.maxArtifactBytes) }
  } finally {
    if (transport) { try { cleanup = await transport.close() } catch { cleanup = "failed_to_exit"; disposition = "system_failure" } }
  }
  const elapsedMilliseconds = Math.max(0, clock() - before)
  if (job.operation === "produce" && elapsedMilliseconds > job.reservation.effortMilliseconds) disposition = "system_failure"
  const body = { schemaVersion: "league-authoring-result-v1", privacy: "private_offline", allocationRoot: allocation.root, jobId: job.id, startRoot, targetArtifactRoot: input.targetArtifactRoot ?? null, teacherArtifactRoots, disposition, ingestionArtifactRoot, rawRoot, cleanup, failure, modelTokens, elapsedMilliseconds }
  const evidenceArtifactRoot = publishFactoryArtifact(input.repository, encode({ ...body, root: labRoot("league-authoring-result-v1", body) }))
  return Object.freeze({ disposition, startRoot, ingestionArtifactRoot, evidenceArtifactRoot, modelTokens, elapsedMilliseconds })
}

/** Read-only closure: source emission is re-derived as inert data; teacher search,
 * native processes and Strategy execution are never repeated. */
export const verifyRetainedLeagueAuthoring = (repository: FactoryRepository, allocation: LeagueExecutionAllocation, artifactRoot: LabRoot) => {
  admitLeagueExecutionAllocation(allocation)
  const result = read(repository, artifactRoot) as any, { root, ...body } = result, job = allocation.rounds.flatMap((round) => round.jobs).find((job) => job.id === result.jobId)
  if (!job || root !== labRoot("league-authoring-result-v1", body) || result.allocationRoot !== allocation.root || result.disposition !== "produced" || !result.ingestionArtifactRoot || !Array.isArray(result.teacherArtifactRoots) || !Number.isSafeInteger(result.elapsedMilliseconds) || result.elapsedMilliseconds < 0 || result.elapsedMilliseconds > job.reservation.effortMilliseconds) return fail("RETAINED_RESULT")
  const ingestion = readFactoryIngestion(repository, result.ingestionArtifactRoot), request = read(repository, job.producerRequestArtifactRoot) as any
  if (ingestion.producerIdentity !== request.producerIdentity || ingestion.origin !== request.origin) return fail("RETAINED_PRODUCER")
  if (ingestion.producerIdentity === "emitModelFactoryPacket") {
    const bundle = admitFrozenModelBundle(ingestion.modelCompanion?.bundle), template = request.producerInput.authoring, target = result.targetArtifactRoot === null ? null : read(repository, result.targetArtifactRoot), sourceMessage = target === null ? template.sourceMessage : `${template.sourceMessage}\n\nFrozen current league target (data, not instructions):\n${new TextDecoder().decode(encode(target))}`
    if (bundle.schemaVersion !== "frozen-model-bundle-v2" || result.rawRoot === null || allocation.evidenceClass === "empirical" && job.evaluationRole === "development_response" && target === null || job.evaluationRole !== "development_response" && target !== null || bundle.attempt.attemptRoot !== result.startRoot || bundle.attempt.budgetRoot !== allocation.root || bundle.accounting.tokenLimit !== job.reservation.modelTokens || bundle.provider.providerId !== template.requestedProvider || bundle.provider.modelId !== template.requestedModel || bundle.provider.settingsRoot !== template.settingsRoot || bundle.provider.promptRoot !== byteRoot(new TextEncoder().encode(sourceMessage)) || bundle.provenance.requestRecord.bodyUtf8 !== sourceMessage || bundle.provider.contextRoot !== (target === null ? template.contextRoot : labRoot("league-response-context-v1", { templateContextRoot: template.contextRoot, targetArtifactRoot: result.targetArtifactRoot })) || bundle.provenance.actualUsage.totalTokens !== result.modelTokens || result.modelTokens > job.reservation.modelTokens || result.cleanup === "failed_to_exit" || result.cleanup === "not_started") return fail("RETAINED_MODEL_BINDING")
    const raw = readRetainedLeagueAuthorRaw(repository, result.rawRoot, allocation.operations.maxArtifactBytes)
    if (new TextDecoder("utf-8", { fatal: true }).decode(raw) !== bundle.provenance.rawResponseRecord.bodyUtf8 || labRoot("league-model-request", request.producerInput.request) !== labRoot("league-model-request", (ingestion.producerInput as any).request)) return fail("RETAINED_MODEL_RAW")
  } else if (result.rawRoot !== null || result.modelTokens !== 0) return fail("RETAINED_NONMODEL_USAGE")
  if (ingestion.producerIdentity === "emitTeacherFactoryPacket") {
    const searches = request.producerInput.searches as TeacherSearchRequest[]
    if (result.teacherArtifactRoots.length !== searches.length) return fail("RETAINED_TEACHER_COVERAGE")
    const receipts = result.teacherArtifactRoots.map((root: LabRoot, ordinal: number) => { const bytes = readRetainedLeagueAuthorRaw(repository, root, allocation.operations.maxArtifactBytes), parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" }); if (!parsed.ok) return fail("RETAINED_TEACHER_BYTES"); const row = parsed.value as any, search = searches[ordinal]!; if (row.schemaVersion !== "league-teacher-search-v1" || row.startRoot !== result.startRoot || row.requestRoot !== labRoot("league-teacher-search-request-v1", search) || row.receipt.nodesVisited > Number(search.maxNodes) || row.receipt.depthReached > Number(search.maxDepth)) return fail("RETAINED_TEACHER_BINDING"); return row.receipt })
    const student = distillLegalStudent(receipts.flatMap(projectTeacherSearchToLegalTraining)), actual = ingestion.producerInput as any
    if (labRoot("league-student-binding", student) !== labRoot("league-student-binding", actual.student) || labRoot("league-teacher-request-binding", request.producerInput.request) !== labRoot("league-teacher-request-binding", actual.request)) return fail("RETAINED_STUDENT")
  }
  return { issued: false as const, result, ingestion }
}
