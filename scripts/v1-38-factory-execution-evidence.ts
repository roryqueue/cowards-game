import { createHash } from "node:crypto"
import { isAbsolute } from "node:path"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { admitFrozenModelBundle } from "../packages/strategy-oracle-model/src/bundle.js"
import { createFactoryAuthoringAllocation, FACTORY_DISABLED_AUTHOR_FEATURES, factoryAuthoringRequestPolicyRoot } from "./v1-38-factory-allocation.js"
import { readFactoryCanonicalRecord, requireFactoryRecordRoot } from "./v1-38-factory-fresh-evidence.js"
import type { readFreshFactoryCalibration } from "./v1-38-factory-fresh-evidence.js"
import type { FactoryIngestionRecord } from "./ingest-v1-38-factory-packet.js"
import { admitFactory } from "../packages/strategy-lab/src/factory/admission.js"
import { factoryProposalFromPacket } from "../packages/strategy-lab/src/factory/contracts.js"
import { distillLegalStudent, projectTeacherSearchToLegalTraining } from "../packages/strategy-oracle-teacher/src/distill.js"
import { auditFactorySource } from "./v1-38-factory-source-audit.js"
import { factoryAssessmentImplementationRoot } from "./v1-38-factory-implementation.js"

export interface FactoryAuthoringRecordRefs {
  readonly start: LabRoot; readonly request: LabRoot; readonly stdin: LabRoot; readonly response: LabRoot
  readonly source: LabRoot | null; readonly terminal: LabRoot; readonly cleanup: LabRoot
}
export interface FactoryExecutionEvidence {
  readonly schemaVersion: "factory-calibration-execution-evidence-v1"; readonly root: LabRoot
  readonly manifestRoot: LabRoot; readonly sourceCommit: string; readonly sourceReviewArtifactRoot: LabRoot
  readonly authoring: readonly FactoryAuthoringRecordRefs[]
  readonly teacherSearchArtifactRoot: LabRoot; readonly teacherTrainingArtifactRoot: LabRoot
  readonly sharedHelperAuditArtifactRoot: LabRoot
  readonly negativeWitnessArtifactRoots: Readonly<Record<"S01" | "S03" | "S05", LabRoot>>
}
export const factoryEvidenceByteRoot = (bytes: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
export const deriveFactoryNegativeWitness = (record: FactoryIngestionRecord): Record<string, unknown> => {
  const sourceBytes = new TextEncoder().encode(record.sourceUtf8), proposal = factoryProposalFromPacket(record.packet)
  // Establish the real positive byte/packet binding before the one negative mutation.
  admitFactory({ packet: record.packet, proposal, sourceBytes })
  const mutated = new TextEncoder().encode(`${record.sourceUtf8}\n`)
  let rejected = false
  try { admitFactory({ packet: record.packet, proposal, sourceBytes: mutated }) } catch (error) { if (error instanceof TypeError && error.message === "FACTORY_ADMISSION") rejected = true; else throw error }
  if (!rejected) throw new TypeError("FACTORY_EXECUTION_NEGATIVE_WITNESS")
  const value = { schemaVersion: "factory-negative-admission-witness-v1", ingestionRoot: record.root, sourceRoot: record.sourceRoot, packetRoot: record.packetRoot, mutatedSourceRoot: factoryEvidenceByteRoot(mutated), charged: true, allocation: "none", runtimeExecuted: false, disposition: "rejected", mutation: "append-newline-source-mismatch" }
  return { ...value, root: labRoot("factory-negative-admission-witness-v1", value) }
}
export const deriveFactorySharedHelperAudit = (records: Readonly<Record<"S01" | "S03" | "S05", FactoryIngestionRecord>>): Record<string, unknown> => {
  const slots = ["S01", "S03", "S05"] as const
  const audits = slots.map((slot) => auditFactorySource(records[slot].sourceUtf8))
  const sharedBodies = [[0,1],[0,2],[1,2]].map(([left,right]) => audits[left!]!.functionBodies.filter((body) => audits[right!]!.functionBodies.includes(body)).length)
  const value = { schemaVersion: "factory-shared-helper-audit-v1", sourceRoots: Object.fromEntries(slots.map((slot) => [slot, records[slot].sourceRoot])), forbiddenModuleCounts: audits.map((audit) => audit.forbiddenModuleCount), sharedSubstantialBodyCounts: sharedBodies, strategicSharingViolations: sharedBodies.reduce((sum, count) => sum + count, 0) + audits.reduce((sum, audit) => sum + audit.forbiddenModuleCount, 0), limitation: "syntactic-clone-screen-not-semantic-proof" }
  return { ...value, root: labRoot("factory-shared-helper-audit-v1", value) }
}
/** Reopens local evidence only. A clean source review is not a custody attestation. */
export const readFactoryExecutionEvidence = (repository: FactoryRepository, artifactRoot: LabRoot, fresh: ReturnType<typeof readFreshFactoryCalibration>): FactoryExecutionEvidence => {
  const raw = readFactoryCanonicalRecord(repository, artifactRoot)
  if (!exactLabKeys(raw, ["schemaVersion", "root", "manifestRoot", "sourceCommit", "sourceReviewArtifactRoot", "authoring", "teacherSearchArtifactRoot", "teacherTrainingArtifactRoot", "sharedHelperAuditArtifactRoot", "negativeWitnessArtifactRoots"]) || raw.schemaVersion !== "factory-calibration-execution-evidence-v1" || raw.manifestRoot !== fresh.manifest.root || typeof raw.sourceCommit !== "string" || !/^[a-f0-9]{40}$/u.test(raw.sourceCommit)) return fail("INDEX")
  requireFactoryRecordRoot(raw, "factory-calibration-execution-evidence-v1")
  const value = raw as unknown as FactoryExecutionEvidence
  const review = readFactoryCanonicalRecord(repository, value.sourceReviewArtifactRoot)
  requireFactoryRecordRoot(review, "factory-source-review-v1")
  if (!exactLabKeys(review, ["schemaVersion", "sourceCommit", "implementationRoot", "reviewerId", "authorIds", "status", "unresolvedFindings", "reportArtifactRoot", "root"]) || review.schemaVersion !== "factory-source-review-v1" || review.sourceCommit !== value.sourceCommit || review.implementationRoot !== factoryAssessmentImplementationRoot() || review.status !== "passed" || review.unresolvedFindings !== 0 || typeof review.reviewerId !== "string" || !Array.isArray(review.authorIds) || review.authorIds.length === 0 || review.authorIds.includes(review.reviewerId)) return fail("REVIEW")
  const report = new TextDecoder("utf-8", { fatal: true }).decode(readFactoryArtifact(repository, review.reportArtifactRoot as LabRoot))
  if (!report.includes(value.sourceCommit)) return fail("REVIEW_SOURCE")
  const model = fresh.ingestions.S05.modelCompanion
  if (!model) return fail("MODEL")
  verifyFactoryAuthoringRecords(repository, value.authoring, model.bundle)
  const search = readFactoryCanonicalRecord(repository, value.teacherSearchArtifactRoot)
  requireFactoryRecordRoot(search, "factory-teacher-search-evidence-v1")
  const request = search.request as Record<string, unknown>, receipt = search.receipt as Record<string, unknown>
  if (search.schemaVersion !== "factory-teacher-search-evidence-v1" || search.charged !== true || search.runs !== 1 || search.allocationOrdinal !== 0 || !request || request.maxDepth !== 3 || request.maxNodes !== 128 || !receipt || !Number.isSafeInteger(receipt.nodesVisited) || Number(receipt.nodesVisited) < 1 || Number(receipt.nodesVisited) > 128 || Number(receipt.depthReached) > 3 || Number(receipt.alternativesEvaluated) < 2 || receipt.canonicalTransitionRoot !== receipt.selectedOutcomeRoot) return fail("TEACHER_SEARCH")
  const records = projectTeacherSearchToLegalTraining(receipt)
  const outcomes = receipt.outcomes as Array<Record<string, unknown>>
  for (const outcome of outcomes) {
    const expected = factoryEvidenceByteRoot(JSON.stringify({ template: outcome.template, score: outcome.score, stateRoot: outcome.stateRoot, terminal: outcome.terminal }))
    if (outcome.outcomeRoot !== expected) return fail("TEACHER_OUTCOME")
  }
  if (!same(receipt.outcomeRoots, outcomes.map((outcome) => outcome.outcomeRoot)) || !outcomes.some((outcome) => outcome.template === receipt.selectedTemplate && outcome.outcomeRoot === receipt.selectedOutcomeRoot)) return fail("TEACHER_SELECTION")
  const training = readFactoryCanonicalRecord(repository, value.teacherTrainingArtifactRoot)
  requireFactoryRecordRoot(training, "factory-teacher-training-evidence-v1")
  const teacherInput = fresh.ingestions.S03.producerInput as { student: unknown }
  if (training.schemaVersion !== "factory-teacher-training-evidence-v1" || training.searchArtifactRoot !== value.teacherSearchArtifactRoot || !same(training.records, records) || !same(training.student, distillLegalStudent(records)) || !same(training.student, teacherInput.student)) return fail("TEACHER_TRAINING")
  const audit = readFactoryCanonicalRecord(repository, value.sharedHelperAuditArtifactRoot)
  if (!same(audit, deriveFactorySharedHelperAudit(fresh.ingestions))) return fail("SHARED_HELPER_AUDIT")
  if (!exactLabKeys(value.negativeWitnessArtifactRoots, ["S01", "S03", "S05"])) return fail("NEGATIVE_WITNESSES")
  for (const slot of ["S01", "S03", "S05"] as const) if (!same(readFactoryCanonicalRecord(repository, value.negativeWitnessArtifactRoots[slot]), deriveFactoryNegativeWitness(fresh.ingestions[slot]))) return fail("NEGATIVE_WITNESS")
  return value
}
const fail = (code: string): never => { throw new TypeError(`FACTORY_EXECUTION_${code}`) }
const same = (left: unknown, right: unknown) => labRoot("factory-execution-equality-v1", left) === labRoot("factory-execution-equality-v1", right)
export const decodeChargedAuthorTranscript = (raw: string, request: Record<string, unknown>) => {
  const events = raw.split(/\r?\n/u).filter(Boolean).map((line) => { try { return JSON.parse(line) as Record<string, any> } catch { return fail("AUTHOR_PROTOCOL") } })
  const starts = events.filter((event) => event.result?.thread && event.result?.model && event.result?.modelProvider), turns = events.filter((event) => event.result?.turn && !event.result?.model)
  if (starts.length !== 1 || turns.length !== 1) return fail("AUTHOR_PROTOCOL")
  const started = starts[0]!.result as Record<string, any>, sandbox = started?.sandbox as Record<string, unknown>, turnId = turns[0]!.result?.turn?.id
  const settings = request.frozenSettings as Record<string, unknown>, cwd = request.cwd
  if (started.model !== request.requestedModel || started.modelProvider !== settings.providerId || started.cwd !== cwd || typeof cwd !== "string" || !isAbsolute(cwd) || request.cwdClass !== "fresh-disclosed-packet-only-outside-repository" || started.approvalPolicy !== "never" || sandbox?.type !== "readOnly" || sandbox.networkAccess !== false || !Array.isArray(started.instructionSources) || started.instructionSources.length !== 0 || typeof turnId !== "string" || turnId.length === 0) return fail("AUTHOR_ISOLATION")
  if (events.some((event) => {
    if (event.method !== "turn/failed" && event.method !== "error") return false
    return true
  })) return fail("AUTHOR_PROTOCOL")
  if (events.some((event) => event.method === "model/rerouted" || (event.method === "item/completed" && event.params?.turnId === turnId && !["agentMessage", "reasoning"].includes(String(event.params?.item?.type))))) return fail("AUTHOR_TOOLS")
  const completions = events.filter((event) => event.method === "turn/completed" && event.params?.turn?.id === turnId && event.params.turn.status === "completed")
  const returnedUsage = events.filter((event) => event.method === "thread/tokenUsage/updated" && event.params?.turnId === turnId).at(-1)?.params?.tokenUsage?.total
  if (completions.length !== 1 || !returnedUsage) return fail("AUTHOR_PROTOCOL")
  const clientSettings = request.clientSettings, launchEnvironment = request.launchEnvironment as Record<string, unknown>
  if (!same(clientSettings,["--stdio","--strict-config",...FACTORY_DISABLED_AUTHOR_FEATURES.flatMap(feature=>["--disable",feature])]) || !launchEnvironment || !exactLabKeys(launchEnvironment, Object.hasOwn(launchEnvironment, "CODEX_HOME") ? ["PATH", "LANG", "LC_ALL", "CODEX_HOME"] : ["PATH", "LANG", "LC_ALL"]) || launchEnvironment.LANG !== "C.UTF-8" || launchEnvironment.LC_ALL !== "C.UTF-8") return fail("AUTHOR_LAUNCH")
  return { started, returnedUsage }
}
/** Reopen every charged author attempt, not merely the winning model label. */
export const verifyFactoryAuthoringRecords = (repository: FactoryRepository, references: readonly FactoryAuthoringRecordRefs[], value: unknown): void => {
  if (!Array.isArray(references) || references.length < 1 || references.length > 4) return fail("AUTHOR_ATTEMPTS")
  const bundle = admitFrozenModelBundle(value), allocation = createFactoryAuthoringAllocation()
  if (bundle.schemaVersion !== "frozen-model-bundle-v2") return fail("AUTHOR_BUNDLE")
  let firstStart = -1, priorStart = -1, requestIdentity: LabRoot | null = null, totalTokens = 0
  for (const [index, refs] of references.entries()) {
    const start = readFactoryCanonicalRecord(repository, refs.start), request = readFactoryCanonicalRecord(repository, refs.request), terminal = readFactoryCanonicalRecord(repository, refs.terminal), cleanup = readFactoryCanonicalRecord(repository, refs.cleanup)
    requireFactoryRecordRoot(start, "factory-model-author-attempt-start-v1")
    requireFactoryRecordRoot(terminal, "factory-model-author-attempt-terminal-v1")
    requireFactoryRecordRoot(cleanup, "factory-model-author-process-cleanup-v1")
    const requestRoot = labRoot("factory-model-author-request-v1", request)
    const policyRoot=factoryAuthoringRequestPolicyRoot(request)
    if (index === 0) { firstStart = Number(start.startedAtMs); requestIdentity = policyRoot }
    const startedAt = Number(start.startedAtMs), elapsed = Number(terminal.elapsedMilliseconds), usage = terminal.usage as Record<string, number> | null
    const last = index === references.length - 1
    if (start.schemaVersion !== "factory-model-author-attempt-start-v1" || start.allocationRoot !== allocation.root || start.ordinal !== allocation.attempts[index] || start.firstStartedAtMs !== firstStart || start.requestRecordRoot !== requestRoot || policyRoot !== requestIdentity || request.allocationRoot !== allocation.root || !Number.isSafeInteger(startedAt) || !Number.isSafeInteger(elapsed) || firstStart < 0 || startedAt < firstStart || startedAt < priorStart || elapsed < 0 || startedAt + elapsed - firstStart >= 1_800_000) return fail("AUTHOR_START")
    priorStart = startedAt
    if (terminal.schemaVersion !== "factory-model-author-attempt-terminal-v1" || terminal.startRoot !== start.root || terminal.disposition !== (last ? "valid" : "invalid") || cleanup.schemaVersion !== "factory-model-author-process-cleanup-v1" || cleanup.startRoot !== start.root || !["already_exited", "sigterm", "sigkill"].includes(String(cleanup.disposition))) return fail("AUTHOR_TERMINAL")
    if (!usage || ![usage.inputTokens, usage.outputTokens, usage.cachedInputTokens, usage.totalTokens].every(Number.isSafeInteger) || usage.inputTokens! < 0 || usage.outputTokens! < 0 || usage.cachedInputTokens! < 0 || usage.cachedInputTokens! > usage.inputTokens! || usage.totalTokens !== usage.inputTokens! + usage.outputTokens! || usage.totalTokens > 50_000) return fail("AUTHOR_USAGE")
    totalTokens += usage.totalTokens
    if (totalTokens > 200_000 || terminal.requestedModel !== request.requestedModel || terminal.reportedModel !== request.requestedModel) return fail("AUTHOR_IDENTITY")
    const stdin = new TextDecoder("utf-8", { fatal: true }).decode(readFactoryArtifact(repository, refs.stdin)), raw = new TextDecoder("utf-8", { fatal: true }).decode(readFactoryArtifact(repository, refs.response))
    if (factoryEvidenceByteRoot(stdin) !== terminal.requestBytesRoot || factoryEvidenceByteRoot(raw) !== terminal.responseBytesRoot || request.context !== stdin) return fail("AUTHOR_BYTES")
    const decoded = decodeChargedAuthorTranscript(raw, request), returnedUsage = decoded.returnedUsage
    const settings = request.frozenSettings as Record<string, unknown>
    if (returnedUsage.inputTokens !== usage.inputTokens || returnedUsage.outputTokens !== usage.outputTokens || returnedUsage.cachedInputTokens !== usage.cachedInputTokens || returnedUsage.totalTokens !== usage.totalTokens) return fail("AUTHOR_PROTOCOL")
    if (refs.source === null ? terminal.sourceBytesRoot !== null : factoryEvidenceByteRoot(readFactoryArtifact(repository, refs.source)) !== terminal.sourceBytesRoot) return fail("AUTHOR_SOURCE")
    if (last && (bundle.attempt.attemptRoot !== start.root || bundle.attempt.ordinal !== index + 1 || bundle.attempt.budgetRoot !== settings.budgetRoot || bundle.source.root !== terminal.sourceBytesRoot || bundle.provenance.requestRecord.bodyUtf8 !== stdin || bundle.provenance.rawResponseRecord.bodyUtf8 !== raw || bundle.provenance.requestedModelId !== request.requestedModel || bundle.provenance.client.version !== request.clientVersion || bundle.provider.settingsRoot !== settings.settingsRoot || bundle.provider.promptRoot !== settings.promptRoot || bundle.provider.contextRoot !== settings.contextRoot || !same(bundle.provenance.actualUsage, usage) || bundle.accounting.elapsedMilliseconds !== elapsed)) return fail("AUTHOR_WINNER_BINDING")
  }
}
