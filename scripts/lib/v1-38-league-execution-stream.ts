import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { deriveFactoryExecutionCommitment } from "../../packages/strategy-lab/src/factory/admission.js"
import type { LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"

const CAP = 131072
const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAGUE_EXECUTION_STREAM_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const natural = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
const exact = (value: unknown, keys: readonly string[]): value is Record<string, any> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...keys].sort().join(",")
const bytesRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot
const encode = (value: unknown): Uint8Array => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); return admitted.ok ? admitted.canonicalBytes : fail("RECORD_CANONICAL") }
const parse = (bytes: Uint8Array): any => { const admitted = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" }); return admitted.ok ? admitted.value : fail("RECORD_BYTES") }
const concatenate = (left: Uint8Array, right: Uint8Array): Uint8Array => { const joined = new Uint8Array(left.length + right.length); joined.set(left); joined.set(right, left.length); return joined }

export interface LeagueExecutionStreamReference { readonly schemaVersion: "league-execution-ref-v2"; readonly artifactRoot: LabRoot }
export const isLeagueExecutionStreamReference = (value: unknown): value is LeagueExecutionStreamReference => exact(value, ["schemaVersion", "artifactRoot"]) && value.schemaVersion === "league-execution-ref-v2" && root(value.artifactRoot)
type Frame = { kind: "header" | "result-state" | "unchanged-state" | "result-event" | "transition" | "accounting"; ordinal: number; value: unknown }
const frameOrder: Record<Frame["kind"], number> = { header: 0, "result-state": 1, "unchanged-state": 1, "result-event": 2, transition: 3, accounting: 4 }

/** Prepared artifacts are published with the parent graph record under one
 * aggregate budget preflight. Frames, not the execution, are canonicalized. */
export const prepareLeagueExecutionStream = (execution: LabMatchExecution): Readonly<{ reference: LeagueExecutionStreamReference; artifacts: readonly Uint8Array[] }> => {
  if (execution.kind === "completed" ? !exact(execution, ["kind", "privacy", "result", "transitions", "accounting"]) || !exact(execution.result, ["state", "events"]) : !exact(execution, ["kind", "privacy", "unchangedState", "failure", "transitions", "accounting"])) return fail("SHAPE")
  if (!["completed", "failure"].includes(execution.kind) || execution.privacy !== "private_offline" || !Array.isArray(execution.transitions) || !Array.isArray(execution.accounting) || execution.kind === "completed" && !Array.isArray(execution.result.events) || execution.kind === "failure" && (execution.transitions.length || !exact(execution.failure, ["classification", "code"]) || execution.failure.classification !== "system_failure" || typeof execution.failure.code !== "string")) return fail("SHAPE")
  const artifacts: Uint8Array[] = []
  let buffer = new Uint8Array(CAP), used = 0, byteLength = 0, chunkCount = 0, recordCount = 0
  let tailRoot: LabRoot | null = null, chainRoot = labRoot("league-execution-record-empty-v2", { count: 0 })
  const flush = () => {
    if (!used) return
    const chunk = buffer.subarray(0, used), chunkRoot = bytesRoot(chunk)
    artifacts.push(chunk)
    const node = encode({ schemaVersion: "league-execution-chunk-v2", ordinal: chunkCount, previousRoot: tailRoot, bytesRoot: chunkRoot, byteLength: used })
    artifacts.push(node); tailRoot = bytesRoot(node); chunkCount++; buffer = new Uint8Array(CAP); used = 0
  }
  const append = (frame: Frame) => {
    const bytes = encode(frame), recordRoot = labRoot("league-execution-record-v2", frame)
    chainRoot = labRoot("league-execution-record-link-v2", { ordinal: recordCount, previousRoot: chainRoot, recordRoot })
    recordCount++
    if (!Number.isSafeInteger(recordCount) || !Number.isSafeInteger(byteLength + bytes.length + 1)) return fail("SIZE")
    byteLength += bytes.length + 1
    for (const part of [bytes, new Uint8Array([10])]) for (let offset = 0; offset < part.length;) {
      const count = Math.min(CAP - used, part.length - offset)
      buffer.set(part.subarray(offset, offset + count), used); used += count; offset += count
      if (used === CAP) flush()
    }
  }
  append({ kind: "header", ordinal: 0, value: execution.kind === "completed" ? { kind: execution.kind, privacy: execution.privacy } : { kind: execution.kind, privacy: execution.privacy, failure: execution.failure } })
  append({ kind: execution.kind === "completed" ? "result-state" : "unchanged-state", ordinal: 0, value: execution.kind === "completed" ? execution.result.state : execution.unchangedState })
  if (execution.kind === "completed") for (let ordinal = 0; ordinal < execution.result.events.length; ordinal++) append({ kind: "result-event", ordinal, value: execution.result.events[ordinal] })
  for (let ordinal = 0; ordinal < execution.transitions.length; ordinal++) append({ kind: "transition", ordinal, value: execution.transitions[ordinal] })
  for (let ordinal = 0; ordinal < execution.accounting.length; ordinal++) append({ kind: "accounting", ordinal, value: execution.accounting[ordinal] })
  flush()
  if (!tailRoot) return fail("EMPTY")
  const body = { schemaVersion: "league-execution-stream-v2", privacy: "private_offline", kind: execution.kind, counts: { resultEvents: execution.kind === "completed" ? execution.result.events.length : 0, transitions: execution.transitions.length, accounting: execution.accounting.length }, recordCount, byteLength, chunkCount, tailRoot, chainRoot, executionRoot: labRoot("league-execution-commitment-v2", deriveFactoryExecutionCommitment(execution)) }
  const descriptor = encode({ ...body, root: labRoot("league-execution-stream-v2", body) })
  artifacts.push(descriptor)
  return { reference: { schemaVersion: "league-execution-ref-v2", artifactRoot: bytesRoot(descriptor) }, artifacts }
}

/** Authenticate the entire stream on first graph traversal, then reconstruct
 * only the requested execution. No decoded stream cache survives this call. */
export const readLeagueExecutionStream = (reference: LeagueExecutionStreamReference, read: (root: LabRoot) => Uint8Array, limits: { maxArtifactBytes: number; maxArtifactRecords: number }): LabMatchExecution => {
  if (!isLeagueExecutionStreamReference(reference)) return fail("REFERENCE")
  const checkedRead = (artifactRoot: LabRoot) => { const bytes = read(artifactRoot); if (bytesRoot(bytes) !== artifactRoot) return fail("ARTIFACT_ROOT"); return bytes }
  const descriptor = parse(checkedRead(reference.artifactRoot))
  if (!exact(descriptor, ["schemaVersion", "privacy", "kind", "counts", "recordCount", "byteLength", "chunkCount", "tailRoot", "chainRoot", "executionRoot", "root"]) || descriptor.schemaVersion !== "league-execution-stream-v2" || descriptor.privacy !== "private_offline" || !["completed", "failure"].includes(descriptor.kind) || !exact(descriptor.counts, ["resultEvents", "transitions", "accounting"]) || !Object.values(descriptor.counts).every(natural) || ![descriptor.recordCount, descriptor.byteLength, descriptor.chunkCount].every(natural) || ![descriptor.tailRoot, descriptor.chainRoot, descriptor.executionRoot, descriptor.root].every(root) || descriptor.recordCount !== 2 + descriptor.counts.resultEvents + descriptor.counts.transitions + descriptor.counts.accounting || descriptor.kind === "failure" && (descriptor.counts.resultEvents || descriptor.counts.transitions) || descriptor.byteLength < 1 || descriptor.byteLength > limits.maxArtifactBytes || descriptor.recordCount > limits.maxArtifactRecords || descriptor.chunkCount * 2 + 1 > limits.maxArtifactRecords || descriptor.chunkCount !== Math.ceil(descriptor.byteLength / CAP)) return fail("DESCRIPTOR")
  const { root: claimedRoot, ...body } = descriptor
  if (claimedRoot !== labRoot("league-execution-stream-v2", body)) return fail("DESCRIPTOR_ROOT")
  const chunks = Array<LabRoot>(descriptor.chunkCount)
  let tail: LabRoot | null = descriptor.tailRoot
  for (let ordinal = descriptor.chunkCount - 1; ordinal >= 0; ordinal--) {
    if (!tail) return fail("CHUNK_CHAIN")
    const node = parse(checkedRead(tail))
    if (!exact(node, ["schemaVersion", "ordinal", "previousRoot", "bytesRoot", "byteLength"]) || node.schemaVersion !== "league-execution-chunk-v2" || node.ordinal !== ordinal || !root(node.bytesRoot) || !(node.previousRoot === null || root(node.previousRoot)) || node.byteLength !== (ordinal === descriptor.chunkCount - 1 ? descriptor.byteLength - ordinal * CAP : CAP)) return fail("CHUNK")
    const chunk = checkedRead(node.bytesRoot)
    if (chunk.length !== node.byteLength) return fail("CHUNK_SIZE")
    chunks[ordinal] = node.bytesRoot; tail = node.previousRoot
  }
  if (tail !== null) return fail("CHUNK_CHAIN")
  const counts = new Map<string, number>(), events: unknown[] = [], transitions: unknown[] = [], accounting: unknown[] = []
  let priorKind = -1, recordCount = 0, chainRoot = labRoot("league-execution-record-empty-v2", { count: 0 })
  let carry: Uint8Array = new Uint8Array(0)
  let header: any, state: unknown
  const accept = (bytes: Uint8Array) => {
    const frame = parse(bytes)
    if (!exact(frame, ["kind", "ordinal", "value"]) || !Object.hasOwn(frameOrder, frame.kind) || frame.ordinal !== (counts.get(frame.kind) ?? 0) || frameOrder[frame.kind as Frame["kind"]]! < priorKind) return fail("RECORD_ORDER")
    priorKind = frameOrder[frame.kind as Frame["kind"]]!
    counts.set(frame.kind, frame.ordinal + 1)
    const recordRoot = labRoot("league-execution-record-v2", frame)
    chainRoot = labRoot("league-execution-record-link-v2", { ordinal: recordCount, previousRoot: chainRoot, recordRoot }); recordCount++
    if (recordCount > limits.maxArtifactRecords) return fail("RECORD_LIMIT")
    if (frame.kind === "header") header = frame.value
    else if (frame.kind === "result-state" || frame.kind === "unchanged-state") state = frame.value
    else if (frame.kind === "result-event") events.push(frame.value)
    else if (frame.kind === "transition") transitions.push(frame.value)
    else accounting.push(frame.value)
  }
  for (const chunkRoot of chunks) {
    const chunk = checkedRead(chunkRoot)
    let start = 0
    for (let end = 0; end < chunk.length; end++) if (chunk[end] === 10) {
      const part = chunk.subarray(start, end), bytes = carry.length ? concatenate(carry, part) : part
      accept(bytes); carry = new Uint8Array(0); start = end + 1
    }
    if (start < chunk.length) { const part = chunk.subarray(start); carry = carry.length ? concatenate(carry, part) : new Uint8Array(part); if (carry.length > 8388608) return fail("RECORD_LIMIT") }
  }
  if (carry.length || recordCount !== descriptor.recordCount || chainRoot !== descriptor.chainRoot || counts.get("header") !== 1 || counts.get(descriptor.kind === "completed" ? "result-state" : "unchanged-state") !== 1 || counts.get(descriptor.kind === "completed" ? "unchanged-state" : "result-state") || (counts.get("result-event") ?? 0) !== descriptor.counts.resultEvents || (counts.get("transition") ?? 0) !== descriptor.counts.transitions || (counts.get("accounting") ?? 0) !== descriptor.counts.accounting) return fail("RECORD_COUNT")
  if (descriptor.kind === "completed" ? !exact(header, ["kind", "privacy"]) : !exact(header, ["kind", "privacy", "failure"])) return fail("HEADER")
  if (header.kind !== descriptor.kind || header.privacy !== "private_offline") return fail("HEADER")
  if (descriptor.kind === "failure" && (!exact(header.failure, ["classification", "code"]) || header.failure.classification !== "system_failure" || typeof header.failure.code !== "string")) return fail("HEADER")
  const execution = (descriptor.kind === "completed" ? { ...header, result: { state, events }, transitions, accounting } : { ...header, unchangedState: state, transitions, accounting }) as LabMatchExecution
  if (labRoot("league-execution-commitment-v2", deriveFactoryExecutionCommitment(execution)) !== descriptor.executionRoot) return fail("EXECUTION_COMMITMENT")
  return execution
}
