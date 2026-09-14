import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { deriveFactoryExecutionCommitment, deriveFactoryOrderedRecordDescriptor, isIssuedFactorySupervisionReceipt, type FactorySupervisionReceipt } from "./admission.js"
import { publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "./repository.js"

const CAP = 262144
const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_SUPERVISION_ARTIFACT_${code}`) }
const encode = (value: unknown): Uint8Array => {
  const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!encoded.ok) return fail("CANONICAL_RECORD")
  return encoded.canonicalBytes
}
const parse = (bytes: Uint8Array): unknown => {
  const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("CANONICAL_BYTES")
  return parsed.value
}
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const natural = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0

export interface StoredFactorySupervisionDescriptor {
  readonly schemaVersion: "factory-supervision-artifacts-v1"
  readonly privacy: "private_offline"
  readonly root: LabRoot
  readonly receiptRoot: LabRoot
  readonly executionRoot: LabRoot
  readonly tracesRoot: LabRoot
  readonly recordCount: number
  readonly byteLength: number
  readonly chunkCount: number
  readonly tailRoot: LabRoot
}
export interface StoredFactorySupervision extends StoredFactorySupervisionDescriptor {
  /** Repository byte identity, distinct from the descriptor's domain identity. */
  readonly artifactRoot: LabRoot
}
export interface StoredFactorySupervisionRecord {
  readonly kind: "receipt" | "execution" | "transition" | "accounting" | "result-state" | "result-event" | "unchanged-state" | "trace"
  readonly ordinal: number
  readonly value: unknown
}
const KINDS = ["receipt", "execution", "transition", "accounting", "result-state", "result-event", "unchanged-state", "trace"]

function* records(receipt: FactorySupervisionReceipt): Generator<StoredFactorySupervisionRecord> {
  const { execution, traces, ...metadata } = receipt
  yield { kind: "receipt", ordinal: 0, value: metadata }
  const { transitions, accounting, ...executionMetadata } = execution
  if (executionMetadata.kind === "completed") {
    const { result, ...header } = executionMetadata
    const { state, events, ...resultMetadata } = result
    yield { kind: "execution", ordinal: 0, value: { ...header, resultMetadata } }
    yield { kind: "result-state", ordinal: 0, value: state ?? null }
    for (let ordinal = 0; ordinal < (events ?? []).length; ordinal++) yield { kind: "result-event", ordinal, value: events![ordinal] }
  } else {
    const { unchangedState, ...header } = executionMetadata
    yield { kind: "execution", ordinal: 0, value: header }
    yield { kind: "unchanged-state", ordinal: 0, value: unchangedState }
  }
  for (let ordinal = 0; ordinal < transitions.length; ordinal++) yield { kind: "transition", ordinal, value: transitions[ordinal] }
  for (let ordinal = 0; ordinal < accounting.length; ordinal++) yield { kind: "accounting", ordinal, value: accounting[ordinal] }
  for (let ordinal = 0; ordinal < traces.length; ordinal++) yield { kind: "trace", ordinal, value: traces[ordinal] }
}

/**
 * Private canonical JSONL is streamed across bounded raw-byte artifacts. A large
 * individual record may span chunks; neither the whole receipt nor a growing
 * list of chunk roots is ever put in one canonical-manifest envelope.
 * Publication requires live issued supervision. Reopening never reissues it.
 */
export const publishFactorySupervisionArtifacts = (repository: FactoryRepository, receipt: FactorySupervisionReceipt): Readonly<StoredFactorySupervision> => {
  if (!isIssuedFactorySupervisionReceipt(receipt)) return fail("UNISSUED_RECEIPT")
  let buffer = new Uint8Array(CAP), used = 0, byteLength = 0, chunkCount = 0, recordCount = 0
  let tailRoot: LabRoot | null = null
  const flush = () => {
    if (!used) return
    const bytesRoot = publishFactoryArtifact(repository, buffer.subarray(0, used))
    tailRoot = publishFactoryArtifact(repository, encode({ schemaVersion: "factory-supervision-chunk-v1", ordinal: chunkCount, previousRoot: tailRoot, bytesRoot, byteLength: used }))
    chunkCount++
    used = 0
    buffer = new Uint8Array(CAP)
  }
  const append = (bytes: Uint8Array) => {
    let offset = 0
    byteLength += bytes.byteLength
    if (!Number.isSafeInteger(byteLength)) return fail("SIZE")
    while (offset < bytes.byteLength) {
      const length = Math.min(CAP - used, bytes.byteLength - offset)
      buffer.set(bytes.subarray(offset, offset + length), used)
      offset += length; used += length
      if (used === CAP) flush()
    }
  }
  for (const record of records(receipt)) { append(encode(record)); append(new Uint8Array([10])); recordCount++ }
  flush()
  if (!tailRoot) return fail("EMPTY")
  const value = {
    schemaVersion: "factory-supervision-artifacts-v1" as const, privacy: "private_offline" as const,
    receiptRoot: receipt.root,
    executionRoot: labRoot("factory-stored-execution-v1", deriveFactoryExecutionCommitment(receipt.execution)),
    tracesRoot: deriveFactoryOrderedRecordDescriptor("factory-supervision-trace", receipt.traces).root,
    recordCount, byteLength, chunkCount, tailRoot,
  }
  const descriptor = { ...value, root: labRoot("factory-supervision-artifacts-v1", value) }
  return freezeLabValue({ ...descriptor, artifactRoot: publishFactoryArtifact(repository, encode(descriptor)) })
}

/** Bounded data-only reopening. The caller sets a read budget; this grants no execution authority. */
export const readFactorySupervisionArtifactRecords = (repository: FactoryRepository, artifactRoot: LabRoot, limits: { readonly maxBytes: number; readonly maxRecords: number }): Readonly<{ descriptor: StoredFactorySupervisionDescriptor; records: readonly StoredFactorySupervisionRecord[]; issued: false }> => {
  if (!natural(limits.maxBytes) || !natural(limits.maxRecords) || limits.maxBytes < 1 || limits.maxRecords < 1) return fail("READ_LIMITS")
  const raw = parse(readFactoryArtifact(repository, artifactRoot))
  if (!exactLabKeys(raw, ["schemaVersion", "privacy", "root", "receiptRoot", "executionRoot", "tracesRoot", "recordCount", "byteLength", "chunkCount", "tailRoot"])) return fail("DESCRIPTOR")
  const descriptor = raw as unknown as StoredFactorySupervisionDescriptor
  if (descriptor.schemaVersion !== "factory-supervision-artifacts-v1" || descriptor.privacy !== "private_offline" || ![descriptor.root, descriptor.receiptRoot, descriptor.executionRoot, descriptor.tracesRoot, descriptor.tailRoot].every(isRoot) || ![descriptor.recordCount, descriptor.byteLength, descriptor.chunkCount].every(natural) || descriptor.recordCount < 1 || descriptor.byteLength < 1 || descriptor.chunkCount !== Math.ceil(descriptor.byteLength / CAP) || descriptor.byteLength > limits.maxBytes || descriptor.recordCount > limits.maxRecords) return fail("DESCRIPTOR_LIMITS")
  const { root: descriptorRoot, ...value } = descriptor
  if (descriptorRoot !== labRoot("factory-supervision-artifacts-v1", value)) return fail("DESCRIPTOR_ROOT")
  const bytes = new Uint8Array(descriptor.byteLength)
  let tail: LabRoot | null = descriptor.tailRoot, remaining = descriptor.byteLength
  for (let ordinal = descriptor.chunkCount - 1; ordinal >= 0; ordinal--) {
    if (!tail) return fail("CHUNK_CHAIN")
    const chunk = parse(readFactoryArtifact(repository, tail))
    if (!exactLabKeys(chunk, ["schemaVersion", "ordinal", "previousRoot", "bytesRoot", "byteLength"])) return fail("CHUNK")
    const node = chunk as Record<string, unknown>
    const expectedLength = ordinal === descriptor.chunkCount - 1 ? (descriptor.byteLength - ordinal * CAP) : CAP
    if (node.schemaVersion !== "factory-supervision-chunk-v1" || node.ordinal !== ordinal || node.byteLength !== expectedLength || !isRoot(node.bytesRoot) || !(node.previousRoot === null || isRoot(node.previousRoot))) return fail("CHUNK_BINDING")
    const data = readFactoryArtifact(repository, node.bytesRoot)
    if (data.byteLength !== expectedLength) return fail("CHUNK_LENGTH")
    remaining -= data.byteLength
    bytes.set(data, remaining)
    tail = node.previousRoot as LabRoot | null
  }
  if (remaining !== 0 || tail !== null) return fail("CHUNK_CHAIN")
  const output: StoredFactorySupervisionRecord[] = []
  let start = 0
  const counts = new Map<string, number>()
  const order: Record<string, number> = { receipt: 0, execution: 1, "result-state": 2, "unchanged-state": 2, "result-event": 3, transition: 4, accounting: 5, trace: 6 }
  let previousKind = -1
  for (let end = 0; end < bytes.byteLength; end++) {
    if (bytes[end] !== 10) continue
    const record = parse(bytes.subarray(start, end)); start = end + 1
    if (!exactLabKeys(record, ["kind", "ordinal", "value"])) return fail("RECORD")
    const item = record as unknown as StoredFactorySupervisionRecord
    if (!KINDS.includes(item.kind) || item.ordinal !== (counts.get(item.kind) ?? 0) || order[item.kind]! < previousKind) return fail("RECORD_ORDER")
    previousKind = order[item.kind]!
    counts.set(item.kind, item.ordinal + 1); output.push(item)
    if (output.length > limits.maxRecords) return fail("RECORD_LIMIT")
  }
  if (start !== bytes.byteLength || output.length !== descriptor.recordCount || counts.get("receipt") !== 1 || counts.get("execution") !== 1) return fail("RECORD_COUNT")
  const values = (kind: StoredFactorySupervisionRecord["kind"]) => output.filter(record => record.kind === kind).map(record => record.value)
  const metadata = values("receipt")[0]
  if (!exactLabKeys(metadata, ["admission", "candidatePlayerId", "candidateIdentity", "root"])) return fail("RECEIPT_METADATA")
  const receiptMetadata = metadata as unknown as Omit<FactorySupervisionReceipt, "execution" | "traces">
  if (!receiptMetadata.admission || !isRoot(receiptMetadata.admission.authorizationRoot) || receiptMetadata.root !== descriptor.receiptRoot) return fail("RECEIPT_BINDING")
  const header = values("execution")[0] as Record<string, unknown> | null
  if (!header || typeof header !== "object" || Array.isArray(header) || !["completed", "failure"].includes(String(header.kind))) return fail("EXECUTION_METADATA")
  const transitions = values("transition"), accounting = values("accounting"), traces = values("trace")
  let execution: FactorySupervisionReceipt["execution"]
  if (header.kind === "completed") {
    if (counts.get("result-state") !== 1 || counts.has("unchanged-state") || !header.resultMetadata || typeof header.resultMetadata !== "object" || Array.isArray(header.resultMetadata)) return fail("RESULT_METADATA")
    const { resultMetadata, ...rest } = header
    execution = { ...rest, transitions, accounting, result: { ...resultMetadata, state: values("result-state")[0], events: values("result-event") } } as unknown as FactorySupervisionReceipt["execution"]
  } else {
    if (counts.get("unchanged-state") !== 1 || counts.has("result-state") || counts.has("result-event")) return fail("FAILURE_METADATA")
    execution = { ...header, transitions, accounting, unchangedState: values("unchanged-state")[0] } as unknown as FactorySupervisionReceipt["execution"]
  }
  const executionCommitment = deriveFactoryExecutionCommitment(execution)
  const traceCommitment = deriveFactoryOrderedRecordDescriptor("factory-supervision-trace", traces)
  const receiptRoot = labRoot("factory-supervision-receipt-v1", {
    authorizationRoot: receiptMetadata.admission.authorizationRoot,
    candidatePlayerId: receiptMetadata.candidatePlayerId,
    candidateIdentity: receiptMetadata.candidateIdentity,
    execution: executionCommitment,
    traces: traceCommitment,
  })
  if (receiptRoot !== descriptor.receiptRoot || labRoot("factory-stored-execution-v1", executionCommitment) !== descriptor.executionRoot || traceCommitment.root !== descriptor.tracesRoot) return fail("CONTENT_BINDING")
  return freezeLabValue({ descriptor, records: output, issued: false as const })
}
