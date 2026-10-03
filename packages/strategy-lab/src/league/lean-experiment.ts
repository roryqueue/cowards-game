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
export const admitLeanAllocation = (value: unknown): Readonly<LeanExperimentAllocation> => {
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
export const encodeLeanReplay = (frames: readonly unknown[]): { container: LeanReplayContainer; bytes: Uint8Array } => {
  const chunks = frames.map(frame => Buffer.concat([leanCanonicalBytes(frame), Buffer.from("\n")]))
  const length = chunks.reduce((n, b) => n + b.length, 0)
  if (length > REPLAY_MAX) return fail("REPLAY_LIMIT")
  const plain = Buffer.concat(chunks), bytes = gzipSync(plain, { level: 6 })
  const body = { schemaVersion: "lean-sampled-replay-gzip-v1" as const, privacy: "private_offline" as const, codec: "gzip-node-v1" as const, compressedRoot: leanBytesRoot(bytes), uncompressedRoot: leanBytesRoot(plain), compressedBytes: bytes.length, uncompressedBytes: plain.length, frames: frames.length }
  return { container: { ...body, root: labRoot("lean-sampled-replay-gzip-v1", body) }, bytes }
}
export const decodeLeanReplay = (container: LeanReplayContainer, bytes: Uint8Array, maximumBytes = REPLAY_MAX): unknown[] => {
  if (!exactLabKeys(container, ["schemaVersion", "privacy", "codec", "compressedRoot", "uncompressedRoot", "compressedBytes", "uncompressedBytes", "frames", "root"]) || container.schemaVersion !== "lean-sampled-replay-gzip-v1" || container.privacy !== "private_offline" || container.codec !== "gzip-node-v1" || ![container.compressedRoot, container.uncompressedRoot, container.root].every(root) || ![container.compressedBytes, container.uncompressedBytes, container.frames].every(natural) || container.uncompressedBytes > Math.min(maximumBytes, REPLAY_MAX) || container.compressedBytes !== bytes.length || leanBytesRoot(bytes) !== container.compressedRoot) return fail("REPLAY")
  const { root: claimed, ...body } = container
  if (claimed !== labRoot("lean-sampled-replay-gzip-v1", body)) return fail("REPLAY")
  let plain: Buffer
  try { plain = gunzipSync(bytes, { maxOutputLength: Math.max(1, Math.min(maximumBytes, REPLAY_MAX)) }) } catch { return fail("REPLAY_LIMIT") }
  if (plain.length !== container.uncompressedBytes || leanBytesRoot(plain) !== container.uncompressedRoot) return fail("REPLAY")
  const lines = plain.toString("utf8").split("\n")
  if (lines.pop() !== "" || lines.length !== container.frames) return fail("REPLAY")
  return lines.map(line => parse(Buffer.from(line)))
}
export interface LeanCompactMatchRecord { classification: "success" | "player_violation" | "system_failure"; code: "OK" | "PLAYER_VIOLATION" | "SUPERVISOR_FAILURE" | "CAPACITY" | "CLEANUP"; outcome: "bottom" | "top" | "DRAW" | null; elapsedMs: number; cleanupComplete: boolean; invocationCount: number; accountingRoot: LabRoot; executionRoot: LabRoot; telemetry: { transitions: number; events: number } }
export interface LeanCharge { schemaVersion: "lean-slot-charge-v1"; allocationRoot: LabRoot; slotRoot: LabRoot; ordinal: number; root: LabRoot }
type Event = { kind: "charge"; charge: LeanCharge } | { kind: "terminal"; chargeRoot: LabRoot; record: LeanCompactMatchRecord; replay: LeanReplayContainer | null } | { kind: "resource"; elapsedMs: number; physicalBytes: number; bufferBytes: number; scratchBytes: number } | { kind: "stop"; reason: string }
export interface LeanExperimentLedger { directory: string; allocation: Readonly<LeanExperimentAllocation> }
const safeDirectory = (directory: string): string => { const p = resolve(directory), s = lstatSync(p); if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(p) !== p || (s.mode & 0o777) !== 0o700) return fail("STORE"); return p }
const writeExclusive = (path: string, bytes: Uint8Array) => { const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); try { writeSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) } }
const readSafe = (path: string): Uint8Array => { const s = lstatSync(path); if (!s.isFile() || s.isSymbolicLink() || s.size > REPLAY_MAX) return fail("FILE"); const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); try { return readFileSync(fd) } finally { closeSync(fd) } }
const append = (ledger: LeanExperimentLedger, event: Event) => {
  const p = safeDirectory(ledger.directory), bytes = leanCanonicalBytes(event)
  const fd = openSync(join(p, "ledger.ndjson"), constants.O_APPEND | constants.O_WRONLY | constants.O_NOFOLLOW)
  try { writeSync(fd, Buffer.concat([bytes, Buffer.from("\n")])); fsyncSync(fd) } finally { closeSync(fd) }
}
export const createLeanLedger = (directory: string, allocation: LeanExperimentAllocation): LeanExperimentLedger => {
  const a = admitLeanAllocation(allocation), p = resolve(directory)
  if (realpathSync(dirname(p)) !== dirname(p)) return fail("STORE")
  mkdirSync(p, { mode: 0o700 }); safeDirectory(p)
  writeExclusive(join(p, "allocation.json"), leanCanonicalBytes(a)); writeExclusive(join(p, "ledger.ndjson"), new Uint8Array())
  return { directory: p, allocation: a }
}
export const openLeanLedger = (directory: string): LeanExperimentLedger => { const p = safeDirectory(directory); return { directory: p, allocation: admitLeanAllocation(parse(readSafe(join(p, "allocation.json")))) } }
export const measureLeanPhysicalBytes = (directory: string): number => {
  const p = safeDirectory(directory)
  return readdirSync(p).reduce((n, name) => { const s = lstatSync(join(p, name)); if (s.isSymbolicLink() || !s.isFile()) return fail("FILE"); return n + s.blocks * 512 }, statSync(p).blocks * 512)
}
export const readLeanLedger = (ledger: LeanExperimentLedger) => {
  const retained = openLeanLedger(ledger.directory)
  if (retained.allocation.root !== ledger.allocation.root) return fail("ALLOCATION")
  const text = Buffer.from(readSafe(join(ledger.directory, "ledger.ndjson"))).toString("utf8")
  if (text.length && !text.endsWith("\n")) return fail("PUBLICATION")
  const events = text ? text.slice(0, -1).split("\n").map(line => parse(Buffer.from(line)) as Event) : []
  const charges = new Map<LabRoot, LeanCharge>(), terminals = new Map<LabRoot, Extract<Event, { kind: "terminal" }>>()
  let elapsedMs = 0, physicalHighWaterBytes = 0, scratchHighWaterBytes = 0, stopped = false
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
      if (!exactLabKeys(e, ["kind", "elapsedMs", "physicalBytes", "bufferBytes", "scratchBytes"]) || ![e.elapsedMs, e.physicalBytes, e.bufferBytes, e.scratchBytes].every(natural) || e.elapsedMs < elapsedMs || e.elapsedMs > LEAN_CAPS.elapsedMs || e.physicalBytes > LEAN_CAPS.retainedBytes || e.scratchBytes + e.bufferBytes > LEAN_CAPS.scratchBytes || e.physicalBytes + e.bufferBytes + e.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes) return fail("RESOURCE")
      elapsedMs = e.elapsedMs; physicalHighWaterBytes = Math.max(physicalHighWaterBytes, e.physicalBytes + e.bufferBytes + e.scratchBytes); scratchHighWaterBytes = Math.max(scratchHighWaterBytes, e.bufferBytes + e.scratchBytes)
    } else if (e.kind === "stop") { if (!exactLabKeys(e, ["kind", "reason"]) || !["complete", "failure", "capacity", "integrity"].includes(e.reason) || stopped) return fail("STOP"); stopped = true }
    else return fail("LEDGER")
  }
  if (charges.size > LEAN_CAPS.matches) return fail("RESOURCE")
  return { events, charges, terminals, charged: charges.size, elapsedMs, physicalHighWaterBytes, scratchHighWaterBytes, stopped }
}
export const chargeLeanSlot = (ledger: LeanExperimentLedger, slot: LeanSlot, capacity: { freeBytes: number; availableMemoryBytes: number }): LeanCharge => {
  const state = readLeanLedger(ledger)
  if (state.stopped || ledger.allocation.slots[slot.ordinal]?.root !== slot.root || labRoot("lean-slot-v1", { ordinal: slot.ordinal, condition: slot.condition, arenaHash: slot.arenaHash, requestRoot: slot.requestRoot }) !== slot.root) return fail("SLOT")
  if (state.charges.has(slot.root)) return fail("CHARGED")
  if (!natural(capacity.freeBytes) || !natural(capacity.availableMemoryBytes) || capacity.freeBytes < LEAN_CAPS.totalBytes - measureLeanPhysicalBytes(ledger.directory) || capacity.availableMemoryBytes < 1_073_741_824 || state.elapsedMs + LEAN_CAPS.matchMs > LEAN_CAPS.elapsedMs || state.charged >= LEAN_CAPS.matches) return fail("CAPACITY")
  const body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: ledger.allocation.root, slotRoot: slot.root, ordinal: slot.ordinal }
  const charge = { ...body, root: labRoot("lean-slot-charge-v1", body) }; append(ledger, { kind: "charge", charge }); return charge
}
const admitCompactRecord = (r: LeanCompactMatchRecord): void => {
  if (!exactLabKeys(r, ["classification", "code", "outcome", "elapsedMs", "cleanupComplete", "invocationCount", "accountingRoot", "executionRoot", "telemetry"]) || !["success", "player_violation", "system_failure"].includes(r.classification) || !["OK", "PLAYER_VIOLATION", "SUPERVISOR_FAILURE", "CAPACITY", "CLEANUP"].includes(r.code) || ![null, "bottom", "top", "DRAW"].includes(r.outcome) || !natural(r.elapsedMs) || r.elapsedMs > LEAN_CAPS.matchMs + 30_000 || typeof r.cleanupComplete !== "boolean" || !natural(r.invocationCount) || r.invocationCount > 49_600 || !root(r.accountingRoot) || !root(r.executionRoot) || !exactLabKeys(r.telemetry, ["transitions", "events"]) || !Object.values(r.telemetry).every(natural)) return fail("RECORD")
}
export const retainLeanMatch = (ledger: LeanExperimentLedger, charge: LeanCharge, record: LeanCompactMatchRecord, replayFrames: readonly unknown[]) => {
  admitCompactRecord(record)
  const s = readLeanLedger(ledger)
  if (s.charges.get(charge.slotRoot)?.root !== charge.root || s.terminals.has(charge.root)) return fail("TERMINAL")
  const selected = ledger.allocation.sampleSlotRoots.includes(charge.slotRoot) || record.classification !== "success" || !record.cleanupComplete
  const replay = selected ? encodeLeanReplay(replayFrames) : null
  if (replay) writeExclusive(join(safeDirectory(ledger.directory), `${charge.root.slice(7)}.gz`), replay.bytes)
  append(ledger, { kind: "terminal", chargeRoot: charge.root, record, replay: replay?.container ?? null })
}
export const checkpointLeanResources = (ledger: LeanExperimentLedger, elapsedMs: number, bufferBytes: number, scratchBytes = 0) => {
  const e = { kind: "resource" as const, elapsedMs, physicalBytes: measureLeanPhysicalBytes(ledger.directory), bufferBytes, scratchBytes }
  if (e.physicalBytes > LEAN_CAPS.retainedBytes || bufferBytes + scratchBytes > LEAN_CAPS.scratchBytes || e.physicalBytes + bufferBytes + scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || elapsedMs > LEAN_CAPS.elapsedMs) return fail("RESOURCE")
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
