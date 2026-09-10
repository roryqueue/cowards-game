import { createHash } from "node:crypto"
import { closeSync, constants, fsyncSync, fstatSync, linkSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, LabAttemptSchema, LabOperationalRecordSchema, LabSemanticRecordSchema, type LabAttempt, type LabOperationalRecord, type LabSemanticRecord, type LabRoot } from "./contracts.js"
import { isLabRoot } from "./identity.js"
import { validateLabTaskGraph, type LabTaskGraph } from "./tasks.js"

export interface LabTraceReference { id: string; root: LabRoot; bytes: number }
export interface LabStoredRecord { attempt: LabAttempt; semantic: LabSemanticRecord | null; operational: LabOperationalRecord; trace: LabTraceReference | null }
export interface LabShard { schemaVersion: "lab-shard-v1"; graphRoot: LabRoot; records: readonly LabStoredRecord[]; root: LabRoot }
export type LabPublicationFault = "before-write" | "during-write" | "before-publish" | "after-publish" | "before-ledger"
const MAX_SHARD_BYTES = 262144
const MAX_TRACE_BYTES = 64 * 1024 * 1024
const hashBytes = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const fail = (code: string): never => { throw new TypeError(`LAB_${code}`) }
const directory = (dir: string): string => {
  const path = resolve(dir)
  if (!basename(path).startsWith("lab-") || realpathSync(path) !== path || !lstatSync(path).isDirectory()) return fail("PRIVATE_DIRECTORY")
  return path
}
const safePath = (dir: string, id: string) => {
  if (!/^(?:shard-[a-f0-9]{64}\.json|trace-[a-f0-9]{64}\.bin|attempt-[a-f0-9]{64}\.(?:started|finished)\.json)$/u.test(id)) return fail("ARTIFACT_ID")
  return join(directory(dir), id)
}
const boundedRead = (path: string, cap: number): Uint8Array => {
  if (!lstatSync(path).isFile()) return fail("FILE_TYPE")
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = fstatSync(fd)
    if (!stat.isFile() || stat.size > cap) return fail("RAW_CAP")
    const bytes = readFileSync(fd)
    if (bytes.length > cap) return fail("RAW_CAP")
    return bytes
  } finally { closeSync(fd) }
}
const canonicalBytes = (value: unknown) => {
  const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!encoded.ok || encoded.canonicalByteLength > MAX_SHARD_BYTES) return fail("CANONICAL_VALUE")
  return encoded.canonicalBytes
}
const parse = (bytes: Uint8Array): unknown => {
  if (bytes.length > MAX_SHARD_BYTES) return fail("RAW_CAP")
  const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("CANONICAL_BYTES")
  return parsed.value
}
// Single coordinator owns these operations. Hard-link publication is atomic and
// fails EEXIST, unlike overwrite-capable rename. No hostile-same-UID claim.
const publishBytes = (dir: string, id: string, bytes: Uint8Array, fault?: LabPublicationFault) => {
  const target = safePath(dir, id)
  if (fault === "before-write") return fail("INJECTED_BEFORE_WRITE")
  const temporary = `${target}.tmp`
  const fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try {
    let offset = 0
    const length = fault === "during-write" ? Math.floor(bytes.length / 2) : bytes.length
    while (offset < length) offset += writeSync(fd, bytes, offset, length - offset)
    fsyncSync(fd)
  } finally { closeSync(fd) }
  if (fault === "during-write") return fail("INJECTED_DURING_WRITE")
  if (hashBytes(boundedRead(temporary, Math.max(MAX_SHARD_BYTES, bytes.length))) !== hashBytes(bytes)) return fail("TEMP_TAMPER")
  if (fault === "before-publish") return fail("INJECTED_BEFORE_PUBLISH")
  linkSync(temporary, target)
  const directoryFd = openSync(directory(dir), constants.O_RDONLY)
  try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
  if (fault === "after-publish") return fail("INJECTED_AFTER_PUBLISH")
  unlinkSync(temporary)
}

export const publishLabTrace = (dir: string, bytes: Uint8Array): LabTraceReference => {
  if (!(bytes instanceof Uint8Array) || bytes.length === 0 || bytes.length > MAX_TRACE_BYTES) return fail("TRACE_CAP")
  const root = hashBytes(bytes), id = `trace-${root.slice(7)}.bin`
  const path = safePath(dir, id)
  if (readdirSync(directory(dir)).includes(id)) {
    if (hashBytes(boundedRead(path, MAX_TRACE_BYTES)) !== root) return fail("TRACE_CONFLICT")
  } else publishBytes(dir, id, bytes)
  return freezeLabValue({ id, root, bytes: bytes.length })
}
const validateTrace = (dir: string, trace: unknown): LabTraceReference | null => {
  if (trace === null) return null
  if (!exactLabKeys(trace, ["id", "root", "bytes"]) || !isLabRoot(trace.root) || trace.id !== `trace-${trace.root.slice(7)}.bin` || !Number.isSafeInteger(trace.bytes) || Number(trace.bytes) <= 0 || Number(trace.bytes) > MAX_TRACE_BYTES) return fail("TRACE_REF")
  const bytes = boundedRead(safePath(dir, String(trace.id)), MAX_TRACE_BYTES)
  if (bytes.length !== trace.bytes || hashBytes(bytes) !== trace.root) return fail("TRACE_DIGEST")
  return trace as unknown as LabTraceReference
}
export const validateLabStoredRecord = (graph: LabTaskGraph, value: unknown): LabStoredRecord => {
  if (!exactLabKeys(value, ["attempt", "semantic", "operational", "trace"])) return fail("STORED_RECORD_KEYS")
  const attempt = LabAttemptSchema.parse(value.attempt), operational = LabOperationalRecordSchema.parse(value.operational)
  const allocated = graph.attempts.find((a) => a.id === attempt.attemptRoot)
  if (!allocated || allocated.taskId !== attempt.taskRoot || allocated.ordinal !== attempt.ordinal || operational.attemptRoot !== attempt.attemptRoot) return fail("ATTEMPT_BINDING")
  const semantic = value.semantic === null ? null : LabSemanticRecordSchema.parse(value.semantic)
  if (attempt.classification === "success" || attempt.classification === "player_violation") {
    if (!semantic || semantic.taskRoot !== attempt.taskRoot || semantic.classification !== attempt.classification || labRoot("semantic-record", semantic) !== attempt.semanticRoot) return fail("SEMANTIC_BINDING")
  } else if (semantic !== null) return fail("UNSCORED_SEMANTIC")
  if (value.trace !== null && (!exactLabKeys(value.trace, ["id", "root", "bytes"]) || !isLabRoot(value.trace.root) || value.trace.id !== `trace-${value.trace.root.slice(7)}.bin` || !Number.isSafeInteger(value.trace.bytes) || Number(value.trace.bytes) <= 0 || Number(value.trace.bytes) > MAX_TRACE_BYTES)) return fail("TRACE_REF")
  return freezeLabValue({ attempt, semantic, operational, trace: value.trace as LabTraceReference | null })
}
const startedId = (id: LabRoot) => `attempt-${id.slice(7)}.started.json`
const finishedId = (id: LabRoot) => `attempt-${id.slice(7)}.finished.json`
export const recordLabAttemptStart = (dir: string, input: LabTaskGraph, attemptId: LabRoot): void => {
  const graph = validateLabTaskGraph(input)
  if (!graph.attempts.some((a) => a.id === attemptId)) return fail("UNALLOCATED_ATTEMPT")
  publishBytes(dir, startedId(attemptId), canonicalBytes({ schemaVersion: "lab-charge-v1", graphRoot: graph.root, attemptId }))
}
const hasValidStart = (dir: string, graph: LabTaskGraph, id: LabRoot) => {
  const value = parse(boundedRead(safePath(dir, startedId(id)), MAX_SHARD_BYTES))
  if (labRoot("charge", value) !== labRoot("charge", { schemaVersion: "lab-charge-v1", graphRoot: graph.root, attemptId: id })) return fail("CHARGE_BINDING")
}
export const publishLabShard = (dir: string, input: LabTaskGraph, values: readonly LabStoredRecord[], options: { fault?: LabPublicationFault } = {}) => {
  const graph = validateLabTaskGraph(input)
  if (values.length < 1 || values.length > 3) return fail("SHARD_COUNT")
  const records = values.map((v) => validateLabStoredRecord(graph, v))
  if (new Set(records.map((r) => r.attempt.attemptRoot)).size !== records.length) return fail("DUPLICATE_COVERAGE")
  const existing = resumeLabInventory(dir, graph)
  for (const record of records) {
    if (existing.completedAttemptIds.includes(record.attempt.attemptRoot)) return fail("DUPLICATE_COVERAGE")
    if (record.attempt.classification !== "unused") hasValidStart(dir, graph, record.attempt.attemptRoot)
    else if (existing.uncertainAttemptIds.includes(record.attempt.attemptRoot)) return fail("CHARGED_UNUSED")
    validateTrace(dir, record.trace)
  }
  const payload = { schemaVersion: "lab-shard-v1" as const, graphRoot: graph.root, records }
  const root = labRoot("physical-shard", payload), id = `shard-${root.slice(7)}.json`
  const shard = { ...payload, root }
  publishBytes(dir, id, canonicalBytes(shard), options.fault)
  readLabShard(dir, graph, id)
  if (options.fault === "before-ledger") return fail("INJECTED_BEFORE_LEDGER")
  for (const record of records) publishBytes(dir, finishedId(record.attempt.attemptRoot), canonicalBytes({ schemaVersion: "lab-terminal-v1", graphRoot: graph.root, attemptId: record.attempt.attemptRoot, shardRoot: root, recordRoot: labRoot("stored-record", record) }))
  return freezeLabValue({ id, root })
}
export const readLabShard = (dir: string, input: LabTaskGraph, id: string): Readonly<LabShard> => {
  input = validateLabTaskGraph(input)
  const value = parse(boundedRead(safePath(dir, id), MAX_SHARD_BYTES))
  if (!exactLabKeys(value, ["schemaVersion", "graphRoot", "records", "root"]) || value.schemaVersion !== "lab-shard-v1" || value.graphRoot !== input.root || !Array.isArray(value.records) || value.records.length < 1 || value.records.length > 3 || !isLabRoot(value.root) || id !== `shard-${value.root.slice(7)}.json`) return fail("SHARD_BINDING")
  const records = value.records.map((v) => validateLabStoredRecord(input, v))
  if (new Set(records.map((r) => r.attempt.attemptRoot)).size !== records.length || labRoot("physical-shard", { schemaVersion: value.schemaVersion, graphRoot: value.graphRoot, records }) !== value.root) return fail("SHARD_DIGEST")
  for (const record of records) validateTrace(dir, record.trace)
  return freezeLabValue({ schemaVersion: "lab-shard-v1", graphRoot: input.root, records, root: value.root })
}
export const resumeLabInventory = (dir: string, input: LabTaskGraph) => {
  const graph = validateLabTaskGraph(input)
  const names = readdirSync(directory(dir)).sort()
  if (names.length > 256) return fail("INVENTORY_CAP")
  const records: LabStoredRecord[] = [], shards: LabRoot[] = []
  const started = new Set<LabRoot>(), completed = new Set<LabRoot>()
  const recordShards = new Map<LabRoot, LabRoot>()
  for (const name of names) {
    if (name.endsWith(".tmp")) continue // Interrupted bytes are not accepted evidence.
    if (/^trace-[a-f0-9]{64}\.bin$/u.test(name)) continue
    if (/^attempt-[a-f0-9]{64}\.started\.json$/u.test(name)) {
      const id = `sha256:${name.slice(8,72)}` as LabRoot
      if (!graph.attempts.some((a) => a.id === id)) return fail("UNKNOWN_CHARGE")
      hasValidStart(dir, graph, id); started.add(id); continue
    }
    if (/^attempt-[a-f0-9]{64}\.finished\.json$/u.test(name)) continue
    if (!/^shard-[a-f0-9]{64}\.json$/u.test(name)) return fail("UNEXPECTED_ARTIFACT")
    const shard = readLabShard(dir, graph, name); shards.push(shard.root)
    for (const record of shard.records) {
      if (completed.has(record.attempt.attemptRoot)) return fail("DUPLICATE_COVERAGE")
      completed.add(record.attempt.attemptRoot); recordShards.set(record.attempt.attemptRoot, shard.root); records.push(record)
    }
  }
  for (const record of records) {
    const charged = started.has(record.attempt.attemptRoot)
    if (record.attempt.classification === "unused" ? charged : !charged) return fail("CHARGE_CLASSIFICATION")
  }
  for (const name of names.filter((n) => /^attempt-[a-f0-9]{64}\.finished\.json$/u.test(n))) {
    const value = parse(boundedRead(safePath(dir, name), MAX_SHARD_BYTES))
    if (!exactLabKeys(value, ["schemaVersion", "graphRoot", "attemptId", "shardRoot", "recordRoot"]) || value.schemaVersion !== "lab-terminal-v1" || value.graphRoot !== graph.root || !isLabRoot(value.attemptId) || name !== finishedId(value.attemptId)) return fail("LEDGER_BINDING")
    const record = records.find((r) => r.attempt.attemptRoot === value.attemptId)
    if (!record || value.recordRoot !== labRoot("stored-record", record) || recordShards.get(value.attemptId) !== value.shardRoot) return fail("LEDGER_PUBLICATION_MISMATCH")
  }
  return freezeLabValue({ records, shardRoots: shards, completedAttemptIds: [...completed].sort(),
    uncertainAttemptIds: [...started].filter((id) => !completed.has(id)).sort(),
    pendingAttemptIds: graph.attempts.filter((a) => !started.has(a.id) && !completed.has(a.id)).map((a) => a.id),
    ledgerRoot: labRoot("attempt-ledger", { graphRoot: graph.root, started: [...started].sort(), completed: [...completed].sort(), shards }) })
}
