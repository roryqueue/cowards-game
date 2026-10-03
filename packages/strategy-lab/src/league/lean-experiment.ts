/** Private trusted-coordinator evidence. Never imported by the rules engine. */
import { createHash } from "node:crypto"
import { constants, openSync, closeSync, writeSync, fsyncSync, readFileSync, mkdirSync, lstatSync, realpathSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { gzipSync, gunzipSync } from "node:zlib"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, exactLabKeys, freezeLabValue, type LabRoot } from "../contracts.js"

export const LEAN_CAPS = Object.freeze({ totalBytes: 15_000_000_000, retainedBytes: 12_000_000_000, scratchBytes: 2_000_000_000, terminalBytes: 1_000_000_000, elapsedMs: 28_800_000, matches: 300, matchMs: 600_000, guestMs: 1000, hostMs: 5000 })
const fail = (code: string): never => { throw new TypeError(`LEAN_EXPERIMENT_${code}`) }
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
const natural = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0
export const leanBytesRoot = (v: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(v).digest("hex")}`
export const leanCanonicalBytes = (v: unknown): Uint8Array => { const a = admitCanonicalJsonValue(v, { profile: "canonical-manifest" }); return a.ok ? a.canonicalBytes : fail("CANONICAL") }
const parse = (b: Uint8Array): unknown => { const a = admitCanonicalJsonBytes(b, { profile: "canonical-manifest", operation: "require-canonical" }); return a.ok ? a.value : fail("CANONICAL") }
export interface LeanSlot { ordinal: number; condition: number; arenaHash: LabRoot; requestRoot: LabRoot; root: LabRoot }
export interface LeanExperimentAllocation { schemaVersion: "lean-experiment-allocation-v1"; privacy: "private_offline"; sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string; tupleRoot: LabRoot; runtimeRoot: LabRoot; caps: typeof LEAN_CAPS; slots: readonly LeanSlot[]; sampleSlotRoots: readonly LabRoot[]; root: LabRoot }
/** Fixed, independently witnessed failed prefix. These are raw byte digests, not
 * a claim that the legacy open interval was closed or that its peak RSS is known. */
export const LEAN_FAILED_PREFIX = Object.freeze({
  schemaVersion: "lean-failed-prefix-v2" as const,
  oldAllocationRoot: "sha256:8520a35eb4a6af3f2d7760d819ce72eef9d8dd764a0a925a19fa7554db327980" as LabRoot,
  oldAllocationBytesRoot: "sha256:559c8c9d1a2f696f713c4ad9206cd66b6cbb7bd79f0fd56c468cbe7ada11b5a9" as LabRoot,
  oldRequestBytesRoot: "sha256:667337207f3e172975ab0bde6217188e6555adcc20ddb87a65c52401467e413a" as LabRoot,
  oldEntryBytesRoot: "sha256:a281a0ab187a6e7d8247d81d403f99ed753a572f8e2bce6c81488b86f6b9ee2b" as LabRoot,
  oldTimeBytesRoot: "sha256:25ed9e4cbf8bcf1f8948fb17ad7472d1d7ab75d4d6312c991e84a0edeb8bb51c" as LabRoot,
  oldChargeBytesRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" as LabRoot,
  oldResultIdentity: ".strategy-lab/lean-experiment-20261003/result.json" as const,
  oldStoreIdentity: ".strategy-lab/lean-experiment-20261003" as const,
  oldCanonicalAllocationIdentity: ".planning/artifacts/v1.38-lean-pilot-allocation-v1.json" as const,
  terminalReportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v1.md" as const,
  terminalReportBytesRoot: "sha256:94d16859662d444ed6d1c22b139c58ed0937f8eb5be8951ee19feb4620e26209" as LabRoot,
  approvedDecisionIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-CRASH-ACCOUNTING-DECISION-v1.md" as const,
  approvedDecisionBytesRoot: "sha256:9d7c1d5a0fc3232c15db3d0707e4825510f81ee3e3f20f6979db66399816d074" as LabRoot,
  elapsedUpperBoundMs: 565_459,
  chargedMatches: 0,
  allocatedDiskBytes: 12_288,
  oldPeakRss: "unknown" as const,
})
const FAILED_WRITE_INVENTORY = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-FAILED-PREFIX-WRITE-INVENTORY-v1.json"
const FAILED_WRITE_REVIEW = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-FAILED-PREFIX-DISK-INVENTORY-v1.md"
type FailedWriteDestination = { path: string; kind: "source" | "core" | "runtime-cache" | "scratch"; allocatedBytes: number; upperBoundBytes: number; evidenceRoot: LabRoot }
export const verifyLeanFailedWriteInventory = (value: unknown): { inventoryRoot: LabRoot; allocatedDiskBytes: number; completenessEvidenceRoot: LabRoot; destinations: readonly FailedWriteDestination[] } => {
  if (!exactLabKeys(value, ["schemaVersion", "failedHead", "entryPid", "storeAllocatedBytes", "sourcePrefixWrites", "otherWritableDestinations", "reviewer", "completenessEvidenceRoot", "scope"])) return fail("PREDECESSOR_INVENTORY")
  const v = value as Record<string, unknown>
  const required = [LEAN_FAILED_PREFIX.oldStoreIdentity, ".strategy-lab/lean-pilot-request-20261003-v2.json", LEAN_FAILED_PREFIX.oldCanonicalAllocationIdentity]
  if (!Array.isArray(v.sourcePrefixWrites) || !Array.isArray(v.otherWritableDestinations)) return fail("PREDECESSOR_INVENTORY")
  const sourcePrefixWrites = v.sourcePrefixWrites as string[]
  if (v.schemaVersion !== "lean-failed-prefix-write-inventory-v1" || v.failedHead !== "1da8d11393359ffb23b96e15cc87513e49a0fbea" || v.entryPid !== 66239 || v.storeAllocatedBytes !== LEAN_FAILED_PREFIX.allocatedDiskBytes || v.scope !== "complete_source_runtime_and_crash_destinations" || typeof v.reviewer !== "string" || !/^\/root\/[a-z0-9_-]+$/u.test(v.reviewer) || !root(v.completenessEvidenceRoot) || required.some(path => !sourcePrefixWrites.includes(path)) || new Set(sourcePrefixWrites).size !== sourcePrefixWrites.length || v.otherWritableDestinations.length < 3) return fail("PREDECESSOR_INVENTORY")
  let upper = LEAN_FAILED_PREFIX.allocatedDiskBytes
  const paths = new Set<string>()
  let hasCore = false, hasCache = false
  for (const item of v.otherWritableDestinations as FailedWriteDestination[]) {
    if (!exactLabKeys(item, ["path", "kind", "allocatedBytes", "upperBoundBytes", "evidenceRoot"]) || typeof item.path !== "string" || !item.path || item.path.includes("*") || item.path.includes("..") || paths.has(item.path) || !["source", "core", "runtime-cache", "scratch"].includes(item.kind) || !natural(item.allocatedBytes) || !natural(item.upperBoundBytes) || item.upperBoundBytes < item.allocatedBytes || !root(item.evidenceRoot) || item.path === LEAN_FAILED_PREFIX.oldStoreIdentity) return fail("PREDECESSOR_INVENTORY")
    paths.add(item.path); upper += item.upperBoundBytes
    hasCore ||= item.kind === "core"; hasCache ||= item.kind === "runtime-cache"
  }
  if (!hasCore || !hasCache || !paths.has(required[1]!) || !paths.has(required[2]!) || !natural(upper) || upper > LEAN_CAPS.totalBytes || (v.sourcePrefixWrites as string[]).some(path => path !== required[0] && !paths.has(path))) return fail("PREDECESSOR_INVENTORY")
  return { inventoryRoot: leanBytesRoot(leanCanonicalBytes(value)), allocatedDiskBytes: upper, completenessEvidenceRoot: v.completenessEvidenceRoot as LabRoot, destinations: v.otherWritableDestinations as FailedWriteDestination[] }
}
const measuredDestinationBlocks = (path: string): number => {
  const visit = (target: string, depth: number): number => {
    if (depth > 16) return fail("PREDECESSOR_INVENTORY")
    let stat: ReturnType<typeof lstatSync>
    try { stat = lstatSync(target) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0; throw error }
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) return fail("PREDECESSOR_INVENTORY")
    let bytes = stat.blocks * 512
    if (stat.isDirectory()) {
      const names = readdirSync(target)
      if (names.length > 200_000) return fail("PREDECESSOR_INVENTORY")
      for (const name of names) bytes += visit(join(target, name), depth + 1)
    }
    return bytes
  }
  return visit(resolve(path), 0)
}
const readLeanFailedWriteInventory = () => {
  const bytes = readSafe(resolve(FAILED_WRITE_INVENTORY)), verified = verifyLeanFailedWriteInventory(parse(bytes))
  if (leanBytesRoot(bytes) !== verified.inventoryRoot || leanBytesRoot(readSafe(resolve(FAILED_WRITE_REVIEW))) !== verified.completenessEvidenceRoot) return fail("PREDECESSOR_INVENTORY")
  for (const destination of verified.destinations) if (measuredDestinationBlocks(destination.path) !== destination.allocatedBytes) return fail("PREDECESSOR_INVENTORY")
  return verified
}
export interface LeanExperimentAllocationV2 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v2"; predecessor: Omit<typeof LEAN_FAILED_PREFIX, "allocatedDiskBytes"> & { readonly writeInventoryRoot: LabRoot; readonly allocatedDiskBytes: number }; root: LabRoot }
export type AnyLeanAllocation = LeanExperimentAllocation | LeanExperimentAllocationV2
export const createLeanAllocation = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocation> => {
  if (!exactLabKeys(input, ["sourceRoot", "reviewRoot", "candidateRoots", "seed"]) || !root(input.sourceRoot) || !root(input.reviewRoot) || !Array.isArray(input.candidateRoots) || input.candidateRoots.length !== 2 || !input.candidateRoots.every(root) || new Set(input.candidateRoots).size !== 2 || !/^[a-z0-9-]{1,100}$/u.test(input.seed)) return fail("ALLOCATION")
  const candidateRoots = [...input.candidateRoots].sort()
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active").sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
  if (arenas.length !== 2 || new Set(arenas.map(a => a.semanticGeometryHash)).size !== 2) return fail("ARENA")
  const slots = arenas.flatMap(a => Array.from({ length: 4 }, (_, condition) => {
    const ordinal = arenas.indexOf(a) * 4 + condition
    const requestRoot = labRoot("lean-pilot-request-v1", { candidateRoots, seed: input.seed, condition, arenaHash: a.semanticGeometryHash, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot })
    const body = { ordinal, condition, arenaHash: a.semanticGeometryHash, requestRoot }
    return { ...body, root: labRoot("lean-slot-v1", body) }
  }))
  const body = { schemaVersion: "lean-experiment-allocation-v1" as const, privacy: "private_offline" as const, ...input, candidateRoots, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, caps: LEAN_CAPS, slots, sampleSlotRoots: [slots.map(s => s.root).sort()[0]!] }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v1", body) })
}
export const createLeanAllocationV2 = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocationV2> => {
  const { root: _oldRoot, schemaVersion: _oldVersion, ...base } = createLeanAllocation(input)
  const inventory = inspectLeanFailedPrefix()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v2" as const, predecessor: { ...LEAN_FAILED_PREFIX, writeInventoryRoot: inventory.inventoryRoot, allocatedDiskBytes: inventory.allocatedDiskBytes } }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v2", body) })
}
export const admitLeanAllocation = (value: unknown): Readonly<AnyLeanAllocation> => {
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-experiment-allocation-v2") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("ALLOCATION")
    const a = value as unknown as LeanExperimentAllocationV2, expected = createLeanAllocationV2({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
    return expected
  }
  if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "root"])) return fail("ALLOCATION")
  const a = value as unknown as LeanExperimentAllocation, expected = createLeanAllocation({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
  if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
  return expected
}
/** No states/candidates/profiles are materialized by this metadata-only schedule. */
export const leanSchedule = (tier: "full" | "reduced") => {
  if (!["full", "reduced"].includes(tier)) return fail("TIER")
  const vector = tier === "full" ? [8, 8, 8, 16, 8, 8, 8] : [8, 4, 8, 8, 4, 4, 4]
  const purposes = ["initial-training", "initial-matrix", "response-training", "response-matrix", "probe", "repeat", "sealed"]
  return Object.freeze([...Array.from({ length: 8 }, (_, ordinal) => ({ arm: "pilot", purpose: "pilot", ordinal })), ...["current", "inward", "bracket"].flatMap(arm => vector.flatMap((count, purpose) => Array.from({ length: count }, (_, ordinal) => ({ arm, purpose: purposes[purpose]!, ordinal }))))])
}
export interface LeanReplayContainer { schemaVersion: "lean-sampled-replay-gzip-v1"; privacy: "private_offline"; codec: "gzip-node-v1"; compressedRoot: LabRoot; uncompressedRoot: LabRoot; compressedBytes: number; uncompressedBytes: number; frames: number; root: LabRoot }
const REPLAY_MAX = 256_000_000
export const LEAN_EXTERNAL_SCRATCH_RESERVE = 512_000_000
const assertTransient = (additionalBytes = 0) => { if (Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024) + LEAN_EXTERNAL_SCRATCH_RESERVE + additionalBytes > LEAN_CAPS.scratchBytes) return fail("BUFFER_CAP") }
/** Conservative JSON-size traversal refuses large frames before JSON/string/buffer allocation. */
const boundedFrameEstimate = (value: unknown, remaining: number): number => {
  let bytes = 1
  const visit = (v: unknown, depth: number): void => {
    if (depth > 128) return fail("REPLAY_LIMIT")
    if (typeof v === "string") bytes += 6 * v.length + 2
    else if (v === null || typeof v !== "object") bytes += 32
    else if (Array.isArray(v)) { bytes += 2 + v.length; for (const x of v) { visit(x, depth + 1); if (bytes > remaining) return fail("REPLAY_LIMIT") } }
    else { bytes += 2; for (const key in v) { if (!Object.hasOwn(v, key)) continue; bytes += key.length * 6 + 5; visit((v as Record<string, unknown>)[key], depth + 1); if (bytes > remaining) return fail("REPLAY_LIMIT") } }
    if (bytes > remaining) return fail("REPLAY_LIMIT")
  }
  visit(value, 0); return bytes
}
export const boundLeanReplayFrame = (value: unknown) => { const upper = boundedFrameEstimate(value, REPLAY_MAX); assertTransient(upper * 3) }
export const encodeLeanReplay = (frames: Iterable<unknown>, maximumBytes = REPLAY_MAX): { container: LeanReplayContainer; bytes: Uint8Array } => {
  const limit = Math.min(maximumBytes, REPLAY_MAX), chunks: Buffer[] = []
  let length = 0, count = 0
  for (const frame of frames) {
    const upper = boundedFrameEstimate(frame, limit - length)
    assertTransient(length + upper * 3)
    const encoded = leanCanonicalBytes(frame)
    if (length + encoded.length + 1 > limit) return fail("REPLAY_LIMIT")
    chunks.push(Buffer.concat([encoded, Buffer.from("\n")])); length += encoded.length + 1; count++
  }
  assertTransient(length * 3 + 1_000_000)
  const plain = Buffer.concat(chunks), bytes = gzipSync(plain, { level: 6 })
  assertTransient()
  const body = { schemaVersion: "lean-sampled-replay-gzip-v1" as const, privacy: "private_offline" as const, codec: "gzip-node-v1" as const, compressedRoot: leanBytesRoot(bytes), uncompressedRoot: leanBytesRoot(plain), compressedBytes: bytes.length, uncompressedBytes: plain.length, frames: count }
  return { container: { ...body, root: labRoot("lean-sampled-replay-gzip-v1", body) }, bytes }
}
export const decodeLeanReplay = (container: LeanReplayContainer, bytes: Uint8Array, maximumBytes = REPLAY_MAX): unknown[] => {
  if (!exactLabKeys(container, ["schemaVersion", "privacy", "codec", "compressedRoot", "uncompressedRoot", "compressedBytes", "uncompressedBytes", "frames", "root"]) || container.schemaVersion !== "lean-sampled-replay-gzip-v1" || container.privacy !== "private_offline" || container.codec !== "gzip-node-v1" || ![container.compressedRoot, container.uncompressedRoot, container.root].every(root) || ![container.compressedBytes, container.uncompressedBytes, container.frames].every(natural) || container.uncompressedBytes > Math.min(maximumBytes, REPLAY_MAX) || container.compressedBytes !== bytes.length || leanBytesRoot(bytes) !== container.compressedRoot) return fail("REPLAY")
  const { root: claimed, ...body } = container
  if (claimed !== labRoot("lean-sampled-replay-gzip-v1", body)) return fail("REPLAY")
  let plain: Buffer
  assertTransient(container.uncompressedBytes * 4)
  try { plain = gunzipSync(bytes, { maxOutputLength: Math.max(1, Math.min(maximumBytes, REPLAY_MAX)) }) } catch { return fail("REPLAY_LIMIT") }
  if (plain.length !== container.uncompressedBytes || leanBytesRoot(plain) !== container.uncompressedRoot) return fail("REPLAY")
  const lines = plain.toString("utf8").split("\n")
  if (lines.pop() !== "" || lines.length !== container.frames) return fail("REPLAY")
  return lines.map(line => parse(Buffer.from(line)))
}
export interface LeanCompactMatchRecord { classification: "success" | "player_violation" | "system_failure"; code: "OK" | "PLAYER_VIOLATION" | "SUPERVISOR_FAILURE" | "CAPACITY" | "CLEANUP"; outcome: "bottom" | "top" | "DRAW" | null; elapsedMs: number; cleanupComplete: boolean; invocationCount: number; accountingRoot: LabRoot; executionRoot: LabRoot; telemetry: { transitions: number; events: number } }
export interface LeanCharge { schemaVersion: "lean-slot-charge-v1"; allocationRoot: LabRoot; slotRoot: LabRoot; ordinal: number; root: LabRoot }
type Event = { kind: "charge"; charge: LeanCharge } | { kind: "terminal"; chargeRoot: LabRoot; record: LeanCompactMatchRecord; replay: LeanReplayContainer | null } | { kind: "resource"; elapsedMs: number; physicalBytes: number; bufferBytes: number; scratchBytes: number } | { kind: "stop"; reason: string }
export interface LeanExperimentLedger { directory: string; allocation: Readonly<AnyLeanAllocation> }
const safeDirectory = (directory: string): string => { const p = resolve(directory), s = lstatSync(p); if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(p) !== p || (s.mode & 0o777) !== 0o700) return fail("STORE"); return p }
/** Exact old files and independent report are required on every v2 reopening.
 * The old route is read-only here and its v1 open-time interpretation is intact. */
export const verifyLeanFailedPrefix = (observed: { allocation: LabRoot; canonicalAllocation: LabRoot; request: LabRoot; entry: LabRoot; time: LabRoot; charge: LabRoot; report: LabRoot; decision: LabRoot; storeFiles: readonly string[]; physicalBytes: number; oldResultExists: boolean }) => {
  const p = LEAN_FAILED_PREFIX
  if (!exactLabKeys(observed, ["allocation", "canonicalAllocation", "request", "entry", "time", "charge", "report", "decision", "storeFiles", "physicalBytes", "oldResultExists"]) ||
    observed.allocation !== p.oldAllocationBytesRoot || observed.canonicalAllocation !== p.oldAllocationBytesRoot || observed.request !== p.oldRequestBytesRoot || observed.entry !== p.oldEntryBytesRoot || observed.time !== p.oldTimeBytesRoot || observed.charge !== p.oldChargeBytesRoot || observed.report !== p.terminalReportBytesRoot || observed.decision !== p.approvedDecisionBytesRoot ||
    !Array.isArray(observed.storeFiles) || observed.storeFiles.join("|") !== "allocation.json|entry.json|ledger.ndjson|time.ndjson" || observed.physicalBytes !== p.allocatedDiskBytes || observed.oldResultExists) return fail("PREDECESSOR")
  return p
}
export const inspectLeanFailedPrefix = () => {
  const store = safeDirectory(LEAN_FAILED_PREFIX.oldStoreIdentity)
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const files = readdirSync(store).sort()
  const p = LEAN_FAILED_PREFIX
  verifyLeanFailedPrefix({ allocation: digest(join(store, "allocation.json")), canonicalAllocation: digest(p.oldCanonicalAllocationIdentity), request: digest(".strategy-lab/lean-pilot-request-20261003-v2.json"), entry: digest(join(store, "entry.json")), time: digest(join(store, "time.ndjson")), charge: digest(join(store, "ledger.ndjson")), report: digest(p.terminalReportIdentity), decision: digest(p.approvedDecisionIdentity), storeFiles: files, physicalBytes: measureLeanPhysicalBytes(store), oldResultExists: files.includes("result.json") })
  return readLeanFailedWriteInventory()
}
export const writeLeanAll = (fd: number, bytes: Uint8Array, writer = writeSync): void => {
  let offset = 0
  while (offset < bytes.length) {
    const count = writer(fd, bytes, offset, bytes.length - offset)
    if (!Number.isSafeInteger(count) || count <= 0 || count > bytes.length - offset) return fail("PUBLICATION")
    offset += count
  }
}
const writeExclusive = (path: string, bytes: Uint8Array) => { const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) } }
const readSafe = (path: string): Uint8Array => { const s = lstatSync(path); if (!s.isFile() || s.isSymbolicLink() || s.size > REPLAY_MAX) return fail("FILE"); const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { return readFileSync(fd) } finally { closeSync(fd) } }
const append = (ledger: LeanExperimentLedger, event: Event) => {
  const p = safeDirectory(ledger.directory), bytes = leanCanonicalBytes(event)
  assertLeanPublicationCapacity(ledger, bytes.length + 1)
  const fd = openSync(join(p, "ledger.ndjson"), constants.O_APPEND | constants.O_WRONLY | constants.O_NOFOLLOW)
  try { writeLeanAll(fd, Buffer.concat([bytes, Buffer.from("\n")])); fsyncSync(fd) } finally { closeSync(fd) }
}
/** Append-only trusted host intervals. Interrupted intervals conservatively burn the
 * remaining eight-hour envelope; no future stage may reset or recover that time. */
const activeTime = new Map<string, { id: string; atMs: number; priorMs: number }>()
export const readLeanTimeAccounting = (ledger: LeanExperimentLedger) => {
  const priorMs = ledger.allocation.schemaVersion === "lean-experiment-allocation-v2" ? LEAN_FAILED_PREFIX.elapsedUpperBoundMs : 0
  const text = Buffer.from(readSafe(join(safeDirectory(ledger.directory), "time.ndjson"))).toString("utf8")
  if (text.length && !text.endsWith("\n")) return fail("TIME_PUBLICATION")
  const starts = new Map<string, number>(), closed = new Set<string>(), closes = new Map<string, number>()
  let elapsedMs = priorMs
  for (const line of text ? text.slice(0, -1).split("\n") : []) {
    const e = parse(Buffer.from(line)) as { kind: string; id: string; atMs: number }
    if (!exactLabKeys(e, ["kind", "id", "atMs"]) || !/^[a-z0-9-]{1,80}$/u.test(e.id) || !natural(e.atMs)) return fail("TIME")
    if (e.kind === "start") { if (starts.has(e.id) || starts.size !== closed.size) return fail("TIME_ACTIVE"); starts.set(e.id, e.atMs) }
    else if (e.kind === "close") { const start = starts.get(e.id); if (start === undefined || closed.has(e.id) || e.atMs < start) return fail("TIME"); elapsedMs += e.atMs - start; closed.add(e.id); closes.set(e.id, e.atMs) }
    else return fail("TIME")
  }
  return { elapsedMs: starts.size === closed.size ? elapsedMs : LEAN_CAPS.elapsedMs, closedElapsedMs: elapsedMs, active: starts.size !== closed.size, starts, closed, closes }
}
const appendTime = (ledger: LeanExperimentLedger, kind: "start" | "close", id: string, atMs: number) => {
  assertLeanPublicationCapacity(ledger, 4096)
  const fd = openSync(join(safeDirectory(ledger.directory), "time.ndjson"), constants.O_APPEND | constants.O_WRONLY | constants.O_NOFOLLOW)
  try { writeLeanAll(fd, Buffer.concat([leanCanonicalBytes({ kind, id, atMs }), Buffer.from("\n")])); fsyncSync(fd) } finally { closeSync(fd) }
}
export const beginLeanInterval = (ledger: LeanExperimentLedger, id: string, atMs = Date.now()) => {
  const s = readLeanTimeAccounting(ledger)
  if (s.active || s.starts.has(id) || s.elapsedMs >= LEAN_CAPS.elapsedMs || !natural(atMs) || !/^[a-z0-9-]{1,80}$/u.test(id)) return fail("TIME_ACTIVE")
  appendTime(ledger, "start", id, atMs)
  activeTime.set(ledger.directory, { id, atMs, priorMs: s.elapsedMs })
}
export const closeLeanInterval = (ledger: LeanExperimentLedger, id: string, atMs = Date.now()) => {
  const s = readLeanTimeAccounting(ledger), start = s.starts.get(id)
  if (!s.active || start === undefined || s.closed.has(id) || !natural(atMs) || atMs < start) return fail("TIME")
  appendTime(ledger, "close", id, atMs)
  activeTime.delete(ledger.directory)
  return readLeanTimeAccounting(ledger)
}
export const currentLeanElapsedMs = (ledger: LeanExperimentLedger) => {
  const s = readLeanTimeAccounting(ledger), local = activeTime.get(ledger.directory)
  if (s.active && ledger.allocation.schemaVersion === "lean-experiment-allocation-v2") {
    const started = [...s.starts.values()].at(-1)
    if (started === undefined) return LEAN_CAPS.elapsedMs
    if (!s.closed.has("pilot-entry")) {
      const entry = readLeanChildEntry(ledger), mono = process.hrtime.bigint() - monotonic(entry.monotonicStartNs)
      if (mono < 0n || mono > BigInt(Number.MAX_SAFE_INTEGER) * 1_000_000n) return LEAN_CAPS.elapsedMs
      return s.closedElapsedMs + Math.max(0, Date.now() - started, Number((mono + 999_999n) / 1_000_000n))
    }
    return s.closedElapsedMs + Math.max(0, Date.now() - started)
  }
  if (s.active && local) return local.priorMs + Math.max(0, Date.now() - local.atMs)
  return s.elapsedMs
}
export const createLeanLedger = (directory: string, allocation: AnyLeanAllocation): LeanExperimentLedger => {
  const a = admitLeanAllocation(allocation), p = resolve(directory)
  if (a.schemaVersion === "lean-experiment-allocation-v2") inspectLeanFailedPrefix()
  if (realpathSync(dirname(p)) !== dirname(p)) return fail("STORE")
  mkdirSync(p, { mode: 0o700 }); safeDirectory(p)
  writeExclusive(join(p, "allocation.json"), leanCanonicalBytes(a)); writeExclusive(join(p, "ledger.ndjson"), new Uint8Array()); writeExclusive(join(p, "time.ndjson"), new Uint8Array())
  return { directory: p, allocation: a }
}
export const openLeanLedger = (directory: string): LeanExperimentLedger => { const p = safeDirectory(directory), allocation = admitLeanAllocation(parse(readSafe(join(p, "allocation.json")))); if (allocation.schemaVersion === "lean-experiment-allocation-v2") inspectLeanFailedPrefix(); return { directory: p, allocation } }
export const measureLeanPhysicalBytes = (directory: string): number => {
  const p = safeDirectory(directory)
  return readdirSync(p).reduce((n, name) => { const s = lstatSync(join(p, name)); if (s.isSymbolicLink() || !s.isFile()) return fail("FILE"); return n + s.blocks * 512 }, statSync(p).blocks * 512)
}
export const cumulativeLeanPhysicalBytes = (ledger: LeanExperimentLedger): number => measureLeanPhysicalBytes(ledger.directory) + (ledger.allocation.schemaVersion === "lean-experiment-allocation-v2" ? ledger.allocation.predecessor.allocatedDiskBytes : 0)
export interface LeanChildEntryV2 { schemaVersion: "lean-child-entry-v2"; allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number; handshakeRoot: LabRoot; wallStartMs: number; monotonicStartNs: string }
export interface LeanChildTerminalV2 { schemaVersion: "lean-child-terminal-v2"; entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; exitCode: number | null; signal: string | null; wallObservedMs: number; monotonicObservedNs: string; elapsedUpperBoundMs: number; status: "child_exited" | "child_failed"; parentRssBytes: number; childRssObservedBytes: number | null; physicalBytes: number; freeBytes: number | null }
const monotonic = (v: string): bigint => /^\d{1,30}$/u.test(v) ? BigInt(v) : fail("MONOTONIC")
const syncLeanDirectory = (path: string): void => { const fd = openSync(safeDirectory(path), constants.O_RDONLY); try { fsyncSync(fd) } finally { closeSync(fd) } }
export const publishLeanChildEntry = (ledger: LeanExperimentLedger, entry: LeanChildEntryV2): void => {
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v2" || !exactLabKeys(entry, ["schemaVersion", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid", "handshakeRoot", "wallStartMs", "monotonicStartNs"]) || entry.schemaVersion !== "lean-child-entry-v2" || entry.allocationRoot !== ledger.allocation.root || entry.sourceRoot !== ledger.allocation.sourceRoot || !root(entry.requestBytesRoot) || !root(entry.handshakeRoot) || !/^[a-f0-9]{40}$/u.test(entry.head) || !natural(entry.parentPid) || entry.parentPid === 0 || !natural(entry.childPid) || entry.childPid === 0 || entry.parentPid === entry.childPid || !natural(entry.wallStartMs)) return fail("ENTRY")
  monotonic(entry.monotonicStartNs)
  if (readLeanTimeAccounting(ledger).starts.size || readLeanLedger(ledger).events.length) return fail("ENTRY")
  writeExclusive(join(safeDirectory(ledger.directory), "entry.json"), leanCanonicalBytes(entry)); syncLeanDirectory(ledger.directory)
}
export const readLeanChildEntry = (ledger: LeanExperimentLedger): LeanChildEntryV2 => {
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v2") return fail("ENTRY")
  const entry = parse(readSafe(join(safeDirectory(ledger.directory), "entry.json"))) as LeanChildEntryV2
  if (!exactLabKeys(entry, ["schemaVersion", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid", "handshakeRoot", "wallStartMs", "monotonicStartNs"]) || entry.schemaVersion !== "lean-child-entry-v2" || entry.allocationRoot !== ledger.allocation.root || entry.sourceRoot !== ledger.allocation.sourceRoot || !root(entry.requestBytesRoot) || !root(entry.handshakeRoot) || !/^[a-f0-9]{40}$/u.test(entry.head) || !natural(entry.parentPid) || entry.parentPid === 0 || !natural(entry.childPid) || entry.childPid === 0 || entry.parentPid === entry.childPid || !natural(entry.wallStartMs)) return fail("ENTRY")
  monotonic(entry.monotonicStartNs); return entry
}
export const deriveLeanChildTerminal = (ledger: LeanExperimentLedger, entry: LeanChildEntryV2, observation: Omit<LeanChildTerminalV2, "schemaVersion" | "entryBytesRoot" | "allocationRoot" | "sourceRoot" | "head" | "parentPid" | "childPid" | "elapsedUpperBoundMs">): LeanChildTerminalV2 => {
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v2") return fail("TERMINAL")
  if (!exactLabKeys(observation, ["exitCode", "signal", "wallObservedMs", "monotonicObservedNs", "status", "parentRssBytes", "childRssObservedBytes", "physicalBytes", "freeBytes"]) || !natural(observation.wallObservedMs) || observation.wallObservedMs < entry.wallStartMs || !natural(observation.parentRssBytes) || !natural(observation.physicalBytes) || observation.physicalBytes < ledger.allocation.predecessor.allocatedDiskBytes || observation.childRssObservedBytes !== null && !natural(observation.childRssObservedBytes) || observation.freeBytes !== null && !natural(observation.freeBytes) || observation.exitCode !== null && !natural(observation.exitCode) || observation.signal !== null && !/^[A-Z0-9]{1,20}$/u.test(observation.signal) || !["child_exited", "child_failed"].includes(observation.status) || observation.status === "child_exited" && (observation.exitCode !== 0 || observation.signal !== null)) return fail("TERMINAL")
  const ns = monotonic(observation.monotonicObservedNs) - monotonic(entry.monotonicStartNs)
  if (ns < 0n) return fail("TERMINAL")
  const elapsedUpperBoundMs = Math.max(observation.wallObservedMs - entry.wallStartMs, Number((ns + 999_999n) / 1_000_000n))
  if (!natural(elapsedUpperBoundMs)) return fail("TERMINAL")
  return { schemaVersion: "lean-child-terminal-v2", entryBytesRoot: leanBytesRoot(leanCanonicalBytes(entry)), allocationRoot: ledger.allocation.root, sourceRoot: entry.sourceRoot, head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid, ...observation, elapsedUpperBoundMs }
}
export const publishLeanChildTerminal = (ledger: LeanExperimentLedger, terminal: LeanChildTerminalV2): void => {
  const entry = readLeanChildEntry(ledger), { schemaVersion: _s, entryBytesRoot: _e, allocationRoot: _a, sourceRoot: _r, head: _h, parentPid: _p, childPid: _c, elapsedUpperBoundMs: _m, ...observation } = terminal
  const expected = deriveLeanChildTerminal(ledger, entry, observation)
  if (labRoot("lean-terminal-admission", terminal) !== labRoot("lean-terminal-admission", expected)) return fail("TERMINAL")
  const time = readLeanTimeAccounting(ledger)
  if (!time.active || time.starts.size !== 1 || time.closed.size !== 0 || time.starts.get("pilot-entry") !== entry.wallStartMs) return fail("TERMINAL")
  writeExclusive(join(safeDirectory(ledger.directory), "child-terminal.json"), leanCanonicalBytes(terminal)); syncLeanDirectory(ledger.directory)
  closeLeanInterval(ledger, "pilot-entry", entry.wallStartMs + terminal.elapsedUpperBoundMs)
}
export const readLeanChildTerminal = (ledger: LeanExperimentLedger): LeanChildTerminalV2 => {
  const terminal = parse(readSafe(join(safeDirectory(ledger.directory), "child-terminal.json"))) as LeanChildTerminalV2
  if (!exactLabKeys(terminal, ["schemaVersion", "entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "exitCode", "signal", "wallObservedMs", "monotonicObservedNs", "elapsedUpperBoundMs", "status", "parentRssBytes", "childRssObservedBytes", "physicalBytes", "freeBytes"])) return fail("TERMINAL")
  const entry = readLeanChildEntry(ledger), { schemaVersion: _s, entryBytesRoot: _e, allocationRoot: _a, sourceRoot: _r, head: _h, parentPid: _p, childPid: _c, elapsedUpperBoundMs: _m, ...observation } = terminal
  if (labRoot("lean-terminal-admission", terminal) !== labRoot("lean-terminal-admission", deriveLeanChildTerminal(ledger, entry, observation))) return fail("TERMINAL")
  const time = readLeanTimeAccounting(ledger)
  if (time.starts.get("pilot-entry") !== entry.wallStartMs || time.closes.get("pilot-entry") !== entry.wallStartMs + terminal.elapsedUpperBoundMs || time.closedElapsedMs < LEAN_FAILED_PREFIX.elapsedUpperBoundMs + terminal.elapsedUpperBoundMs || terminal.elapsedUpperBoundMs + LEAN_FAILED_PREFIX.elapsedUpperBoundMs > LEAN_CAPS.elapsedMs) return fail("TERMINAL")
  return terminal
}
export const readLeanLedger = (ledger: LeanExperimentLedger) => {
  const retained = openLeanLedger(ledger.directory)
  if (retained.allocation.root !== ledger.allocation.root) return fail("ALLOCATION")
  const text = Buffer.from(readSafe(join(ledger.directory, "ledger.ndjson"))).toString("utf8")
  if (text.length && !text.endsWith("\n")) return fail("PUBLICATION")
  const events = text ? text.slice(0, -1).split("\n").map(line => parse(Buffer.from(line)) as Event) : []
  const charges = new Map<LabRoot, LeanCharge>(), terminals = new Map<LabRoot, Extract<Event, { kind: "terminal" }>>()
  const previous = ledger.allocation.schemaVersion === "lean-experiment-allocation-v2" ? ledger.allocation.predecessor : null
  let elapsedMs = previous?.elapsedUpperBoundMs ?? 0, physicalHighWaterBytes = previous?.allocatedDiskBytes ?? 0, scratchHighWaterBytes = 0, stopped = false
  for (const e of events) {
    if (e.kind === "charge") {
      if (!exactLabKeys(e, ["kind", "charge"]) || stopped) return fail("LEDGER")
      const c = e.charge, slot = ledger.allocation.slots[c.ordinal]
      if (!slot || !exactLabKeys(c, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "root"]) || c.schemaVersion !== "lean-slot-charge-v1" || c.allocationRoot !== ledger.allocation.root || c.slotRoot !== slot.root || c.root !== labRoot("lean-slot-charge-v1", { schemaVersion: c.schemaVersion, allocationRoot: c.allocationRoot, slotRoot: c.slotRoot, ordinal: c.ordinal }) || charges.has(c.slotRoot)) return fail("CHARGED")
      charges.set(c.slotRoot, c)
    } else if (e.kind === "terminal") {
      if (!exactLabKeys(e, ["kind", "chargeRoot", "record", "replay"]) || ![...charges.values()].some(c => c.root === e.chargeRoot) || terminals.has(e.chargeRoot)) return fail("TERMINAL")
      admitCompactRecord(e.record); terminals.set(e.chargeRoot, e)
    } else if (e.kind === "resource") {
      if (!exactLabKeys(e, ["kind", "elapsedMs", "physicalBytes", "bufferBytes", "scratchBytes"]) || ![e.elapsedMs, e.physicalBytes, e.bufferBytes, e.scratchBytes].every(natural) || e.elapsedMs < elapsedMs || e.elapsedMs > LEAN_CAPS.elapsedMs || e.physicalBytes + (previous?.allocatedDiskBytes ?? 0) > LEAN_CAPS.retainedBytes || e.scratchBytes + e.bufferBytes > LEAN_CAPS.scratchBytes || e.physicalBytes + (previous?.allocatedDiskBytes ?? 0) + e.bufferBytes + e.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes) return fail("RESOURCE")
      elapsedMs = e.elapsedMs; physicalHighWaterBytes = Math.max(physicalHighWaterBytes, (previous?.allocatedDiskBytes ?? 0) + e.physicalBytes + e.bufferBytes + e.scratchBytes); scratchHighWaterBytes = Math.max(scratchHighWaterBytes, e.bufferBytes + e.scratchBytes)
    } else if (e.kind === "stop") { if (!exactLabKeys(e, ["kind", "reason"]) || !["complete", "failure", "capacity", "integrity"].includes(e.reason) || stopped) return fail("STOP"); stopped = true }
    else return fail("LEDGER")
  }
  if (charges.size + (previous?.chargedMatches ?? 0) > LEAN_CAPS.matches) return fail("RESOURCE")
  return { events, charges, terminals, charged: charges.size + (previous?.chargedMatches ?? 0), elapsedMs, physicalHighWaterBytes, scratchHighWaterBytes, stopped }
}
/** Reader for all later arms/review: a missing or torn parent terminal is an
 * open interval, never a recoverable elapsed sample. */
export const readLeanCumulativeAccounting = (ledger: LeanExperimentLedger) => {
  const state = readLeanLedger(ledger), time = readLeanTimeAccounting(ledger)
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v2") return { elapsedMs: time.elapsedMs, charged: state.charged, physicalHighWaterBytes: state.physicalHighWaterBytes, active: time.active }
  const terminal = readLeanChildTerminal(ledger)
  return { elapsedMs: time.elapsedMs, charged: state.charged, physicalHighWaterBytes: Math.max(state.physicalHighWaterBytes, terminal.physicalBytes, cumulativeLeanPhysicalBytes(ledger)), active: time.active }
}
export const chargeLeanSlot = (ledger: LeanExperimentLedger, slot: LeanSlot, capacity: { freeBytes: number; availableMemoryBytes: number }): LeanCharge => {
  if (ledger.allocation.schemaVersion === "lean-experiment-allocation-v2") {
    const time = readLeanTimeAccounting(ledger), entry = readLeanChildEntry(ledger)
    if (!time.closed.has("pilot-entry")) {
      if (!time.active || time.starts.get("pilot-entry") !== entry.wallStartMs || entry.childPid !== process.pid || entry.parentPid !== process.ppid) return fail("ENTRY")
    } else { readLeanChildTerminal(ledger); return fail("SLOT_CLOSED") }
  }
  const state = readLeanLedger(ledger)
  if (state.stopped || ledger.allocation.slots[slot.ordinal]?.root !== slot.root || labRoot("lean-slot-v1", { ordinal: slot.ordinal, condition: slot.condition, arenaHash: slot.arenaHash, requestRoot: slot.requestRoot }) !== slot.root) return fail("SLOT")
  if (state.charges.has(slot.root)) return fail("CHARGED")
  if (!natural(capacity.freeBytes) || !natural(capacity.availableMemoryBytes) || capacity.freeBytes < LEAN_CAPS.totalBytes - cumulativeLeanPhysicalBytes(ledger) || capacity.availableMemoryBytes < 1_073_741_824 || Math.max(state.elapsedMs, currentLeanElapsedMs(ledger)) + LEAN_CAPS.matchMs > LEAN_CAPS.elapsedMs || state.charged >= LEAN_CAPS.matches) return fail("CAPACITY")
  const body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: ledger.allocation.root, slotRoot: slot.root, ordinal: slot.ordinal }
  const charge = { ...body, root: labRoot("lean-slot-charge-v1", body) }; append(ledger, { kind: "charge", charge }); return charge
}
const admitCompactRecord = (r: LeanCompactMatchRecord): void => {
  if (!exactLabKeys(r, ["classification", "code", "outcome", "elapsedMs", "cleanupComplete", "invocationCount", "accountingRoot", "executionRoot", "telemetry"]) || !["success", "player_violation", "system_failure"].includes(r.classification) || !["OK", "PLAYER_VIOLATION", "SUPERVISOR_FAILURE", "CAPACITY", "CLEANUP"].includes(r.code) || ![null, "bottom", "top", "DRAW"].includes(r.outcome) || !natural(r.elapsedMs) || r.elapsedMs > LEAN_CAPS.matchMs + 30_000 || typeof r.cleanupComplete !== "boolean" || !natural(r.invocationCount) || r.invocationCount > 49_600 || !root(r.accountingRoot) || !root(r.executionRoot) || !exactLabKeys(r.telemetry, ["transitions", "events"]) || !Object.values(r.telemetry).every(natural)) return fail("RECORD")
  if (r.classification === "success" ? r.code !== "OK" || !r.cleanupComplete || r.outcome === null : r.outcome !== null || r.code === "OK" || (r.classification === "player_violation" ? r.code !== "PLAYER_VIOLATION" || !r.cleanupComplete : !["SUPERVISOR_FAILURE", "CAPACITY", "CLEANUP"].includes(r.code)) || (!r.cleanupComplete && r.code !== "CLEANUP")) return fail("RECORD_CLASSIFICATION")
}
export const assertLeanPublicationCapacity = (ledger: LeanExperimentLedger, bytes: number, currentPhysicalBytes = measureLeanPhysicalBytes(ledger.directory)) => {
  if (!natural(bytes) || !natural(currentPhysicalBytes) || currentPhysicalBytes + (ledger.allocation.schemaVersion === "lean-experiment-allocation-v2" ? ledger.allocation.predecessor.allocatedDiskBytes : 0) + Math.ceil(bytes / 4096) * 4096 + 65536 > LEAN_CAPS.retainedBytes) return fail("RESOURCE")
}
export const retainLeanMatch = (ledger: LeanExperimentLedger, charge: LeanCharge, record: LeanCompactMatchRecord, replayFrames: Iterable<unknown>) => {
  admitCompactRecord(record)
  const s = readLeanLedger(ledger)
  if (s.charges.get(charge.slotRoot)?.root !== charge.root || s.terminals.has(charge.root)) return fail("TERMINAL")
  const selected = ledger.allocation.sampleSlotRoots.includes(charge.slotRoot) || record.classification !== "success" || !record.cleanupComplete
  const remaining = LEAN_CAPS.retainedBytes - cumulativeLeanPhysicalBytes(ledger) - 131072
  const replay = selected ? encodeLeanReplay(replayFrames, remaining) : null
  if (replay) { assertLeanPublicationCapacity(ledger, replay.bytes.length); writeExclusive(join(safeDirectory(ledger.directory), `${charge.root.slice(7)}.gz`), replay.bytes) }
  append(ledger, { kind: "terminal", chargeRoot: charge.root, record, replay: replay?.container ?? null })
}
export const checkpointLeanResources = (ledger: LeanExperimentLedger, elapsedMs: number, bufferBytes: number, scratchBytes = 0) => {
  const e = { kind: "resource" as const, elapsedMs, physicalBytes: measureLeanPhysicalBytes(ledger.directory), bufferBytes, scratchBytes }
  const cumulative = cumulativeLeanPhysicalBytes(ledger)
  if (cumulative > LEAN_CAPS.retainedBytes || bufferBytes + scratchBytes > LEAN_CAPS.scratchBytes || cumulative + bufferBytes + scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || elapsedMs > LEAN_CAPS.elapsedMs) return fail("RESOURCE")
  append(ledger, e); readLeanLedger(ledger)
}
export const stopLeanLedger = (ledger: LeanExperimentLedger, reason: "complete" | "failure" | "capacity" | "integrity") => { readLeanLedger(ledger); append(ledger, { kind: "stop", reason }) }
export const verifyLeanEvidence = (ledger: LeanExperimentLedger) => {
  const state = readLeanLedger(ledger)
  const records = ledger.allocation.slots.map(slot => {
    const c = state.charges.get(slot.root), terminal = c && state.terminals.get(c.root)
    if (c && !terminal) return fail("TERMINAL_MISSING")
    if (terminal) {
      const selected = ledger.allocation.sampleSlotRoots.includes(slot.root) || terminal.record.classification !== "success" || !terminal.record.cleanupComplete
      if (selected !== (terminal.replay !== null)) return fail("REPLAY_MISSING")
      if (terminal.replay) decodeLeanReplay(terminal.replay, readSafe(join(ledger.directory, `${c!.root.slice(7)}.gz`)))
    }
    return { slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: c?.root ?? null, terminal: terminal ?? null, status: c ? terminal!.record.classification : "unused" }
  })
  return { schemaVersion: "lean-pilot-verification-v1" as const, issued: false as const, evidenceClass: "feasibility_only" as const, records, charged: state.charged, elapsedMs: state.elapsedMs, physicalHighWaterBytes: state.physicalHighWaterBytes, scratchHighWaterBytes: state.scratchHighWaterBytes, root: labRoot("lean-evidence-v1", { allocationRoot: ledger.allocation.root, events: state.events, records }) }
}
export interface LeanPilotMeasurement { pilotCells: number; maximumCellMs: number; maximumCellPhysicalBytes: number; elapsedMs: number; physicalHighWaterBytes: number; scratchHighWaterBytes: number }
export const chooseLeanTier = (m: LeanPilotMeasurement): "full" | "reduced" | "feasibility_not_established" => {
  if (!exactLabKeys(m, ["pilotCells", "maximumCellMs", "maximumCellPhysicalBytes", "elapsedMs", "physicalHighWaterBytes", "scratchHighWaterBytes"]) || !Object.values(m).every(natural) || m.pilotCells !== 8 || m.scratchHighWaterBytes > LEAN_CAPS.scratchBytes) return "feasibility_not_established"
  for (const [tier, cells] of [["full", 192], ["reduced", 120]] as const) if (2 * m.maximumCellMs * cells + 2_700_000 <= LEAN_CAPS.elapsedMs - m.elapsedMs && 2 * m.maximumCellPhysicalBytes * cells + 2_000_000_000 <= LEAN_CAPS.totalBytes - m.physicalHighWaterBytes) return tier
  return "feasibility_not_established"
}
