import { createHash } from "node:crypto"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { admitFrozenModelBundle } from "../packages/strategy-oracle-model/src/bundle.js"
import { createFactoryAuthoringAllocation } from "./v1-38-factory-allocation.js"
import { readFactoryCanonicalRecord, requireFactoryRecordRoot } from "./v1-38-factory-fresh-evidence.js"

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
const fail = (code: string): never => { throw new TypeError(`FACTORY_EXECUTION_${code}`) }
const same = (left: unknown, right: unknown) => labRoot("factory-execution-equality-v1", left) === labRoot("factory-execution-equality-v1", right)
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
    if (index === 0) { firstStart = Number(start.startedAtMs); requestIdentity = requestRoot }
    const startedAt = Number(start.startedAtMs), elapsed = Number(terminal.elapsedMilliseconds), usage = terminal.usage as Record<string, number> | null
    const last = index === references.length - 1
    if (start.schemaVersion !== "factory-model-author-attempt-start-v1" || start.allocationRoot !== allocation.root || start.ordinal !== allocation.attempts[index] || start.firstStartedAtMs !== firstStart || start.requestRecordRoot !== requestRoot || requestRoot !== requestIdentity || request.allocationRoot !== allocation.root || !Number.isSafeInteger(startedAt) || !Number.isSafeInteger(elapsed) || firstStart < 0 || startedAt < firstStart || startedAt < priorStart || elapsed < 0 || startedAt + elapsed - firstStart >= 1_800_000) return fail("AUTHOR_START")
    priorStart = startedAt
    if (terminal.schemaVersion !== "factory-model-author-attempt-terminal-v1" || terminal.startRoot !== start.root || terminal.disposition !== (last ? "valid" : "invalid") || cleanup.schemaVersion !== "factory-model-author-process-cleanup-v1" || cleanup.startRoot !== start.root || !["already_exited", "sigterm", "sigkill"].includes(String(cleanup.disposition))) return fail("AUTHOR_TERMINAL")
    if (!usage || ![usage.inputTokens, usage.outputTokens, usage.cachedInputTokens, usage.totalTokens].every(Number.isSafeInteger) || usage.inputTokens! < 0 || usage.outputTokens! < 0 || usage.cachedInputTokens! < 0 || usage.cachedInputTokens! > usage.inputTokens! || usage.totalTokens !== usage.inputTokens! + usage.outputTokens! || usage.totalTokens > 50_000) return fail("AUTHOR_USAGE")
    totalTokens += usage.totalTokens
    if (totalTokens > 200_000 || terminal.requestedModel !== request.requestedModel || terminal.reportedModel !== request.requestedModel) return fail("AUTHOR_IDENTITY")
    const stdin = new TextDecoder("utf-8", { fatal: true }).decode(readFactoryArtifact(repository, refs.stdin)), raw = new TextDecoder("utf-8", { fatal: true }).decode(readFactoryArtifact(repository, refs.response))
    if (factoryEvidenceByteRoot(stdin) !== terminal.requestBytesRoot || factoryEvidenceByteRoot(raw) !== terminal.responseBytesRoot || request.context !== stdin) return fail("AUTHOR_BYTES")
    const events = raw.split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line) as Record<string, any>)
    const identities = events.filter((event) => event.id === 2 && event.result?.model), returnedUsage = events.filter((event) => event.method === "thread/tokenUsage/updated").at(-1)?.params?.tokenUsage?.total
    const settings = request.frozenSettings as Record<string, unknown>
    if (identities.length !== 1 || identities[0]!.result.model !== request.requestedModel || identities[0]!.result.modelProvider !== settings.providerId || !returnedUsage || returnedUsage.inputTokens !== usage.inputTokens || returnedUsage.outputTokens !== usage.outputTokens || returnedUsage.cachedInputTokens !== usage.cachedInputTokens || returnedUsage.totalTokens !== usage.totalTokens) return fail("AUTHOR_PROTOCOL")
    if (refs.source === null ? terminal.sourceBytesRoot !== null : factoryEvidenceByteRoot(readFactoryArtifact(repository, refs.source)) !== terminal.sourceBytesRoot) return fail("AUTHOR_SOURCE")
    if (last && (bundle.attempt.attemptRoot !== start.root || bundle.attempt.ordinal !== index + 1 || bundle.attempt.budgetRoot !== settings.budgetRoot || bundle.source.root !== terminal.sourceBytesRoot || bundle.provenance.requestRecord.bodyUtf8 !== stdin || bundle.provenance.rawResponseRecord.bodyUtf8 !== raw || bundle.provenance.requestedModelId !== request.requestedModel || bundle.provenance.client.version !== request.clientVersion || bundle.provider.settingsRoot !== settings.settingsRoot || bundle.provider.promptRoot !== settings.promptRoot || bundle.provider.contextRoot !== settings.contextRoot || !same(bundle.provenance.actualUsage, usage) || bundle.accounting.elapsedMilliseconds !== elapsed)) return fail("AUTHOR_WINNER_BINDING")
  }
}
