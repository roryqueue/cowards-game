/** Bounded trusted-host custody for the fresh continuation. Importing is inert. */
import { readLeanContinuationExpectedObservations } from "./v1-38-lean-continuation-observations.js"
import { createHash } from "node:crypto"
import { constants, openSync, closeSync, fstatSync, readSync, lstatSync, realpathSync, readdirSync, type Stats } from "node:fs"
import { resolve, join, relative } from "node:path"
import { labRoot, freezeLabValue, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, LEAN_BASELINE_CONTINUATION_WINDOW as WINDOW, LEAN_BASELINE_CONTINUATION_PATHS, leanBytesRoot, leanCanonicalBytes, validateLeanBaselineContinuationAllocation, type LeanBaselineContinuationAllocation, type LeanBaselineContinuationCarry } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_BASELINE_CONTINUATION_PATHS_V2, LEAN_BASELINE_CONTINUATION_PATHS_V4, LEAN_BASELINE_CONTINUATION_PATHS_V5, LEAN_BASELINE_CONTINUATION_POLICY_V2, validateLeanBaselineContinuationAllocationV2, readLeanAdmittedContinuationAllocationV2, leanAdmittedContinuationElapsedFloorV2, leanHostIsProxy, leanBaselineContinuationElapsedFloorV2, leanBaselineContinuationPathsForWindowV2, type LeanExperimentLedger, type LeanBaselineContinuationWindowV2, type LeanBaselineContinuationAllocationV2, type LeanBaselineContinuationCarryV2 } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { exactLabKeys } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_BASELINE_CONTINUATION_PATHS_V6, LEAN_BASELINE_CONTINUATION_PATHS_V7, LEAN_BASELINE_CONTINUATION_PATHS_V8, LEAN_BASELINE_CONTINUATION_PATHS_V9, LEAN_BASELINE_CONTINUATION_PATHS_V10, LEAN_BASELINE_CONTINUATION_PATHS_V11, LEAN_BASELINE_CONTINUATION_PATHS_V12, LEAN_BASELINE_CONTINUATION_PATHS_V13, validateLeanBaselineContinuationWindowV2, leanBaselineContinuationMatchReserveMsV2 } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_PRIVATE_MATCH_CARRY_V3, LEAN_PRIVATE_MATCH_CARRY_V2, LEAN_PRIVATE_MATCH_ARTIFACT_V3, LEAN_PRIVATE_PROBE_COST_ROOT, validateLeanPrivateMatchAllocationV3, validateLeanPrivateMatchAllocationV2, validateLeanPrivateMatchAllocationV1, authenticateLeanPrivateMatchProbeCarryV1 } from "./v1-38-lean-experiment-authority.js"

export { LEAN_BASELINE_CONTINUATION_PATHS }
export const LEAN_CONTINUATION_PRIVATE_COST_MODE = 0o600
const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_CONTINUATION_${code}`) }
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const equal = (a: unknown, b: unknown) => Buffer.from(leanCanonicalBytes(a)).equals(Buffer.from(leanCanonicalBytes(b)))
export type LeanContinuationGit = (args: readonly string[]) => Buffer
/** Bounded descriptor reads reserve before allocation; no real caller can opt out. */
export interface LeanContinuationReadObservation {
  observationMode: LeanContinuationObservationMode
  window: LeanBaselineContinuationWindowV2
  authenticatedPrefix?: Buffer
}
export const readLeanContinuationBoundedBytesV2 = (name: string, maximum: number, mode: number, guard: (additionalBytes?: number) => void, observation?: LeanContinuationReadObservation): Buffer => {
  if (!integer(maximum) || maximum > 4194304 || /preimage|secret|sealed/iu.test(name) || typeof guard !== "function") return fail("V2_READ_SCOPE")
  if (observation?.observationMode === "one-current-owned-overlap") {
    const paths = leanBaselineContinuationPathsForWindowV2(validateLeanBaselineContinuationWindowV2(observation.window)), path = resolve(name)
    if (!["ledger.ndjson", "time.ndjson"].some(leaf => path === resolve(paths.store, leaf)) || mode !== 0o600 || path === resolve(paths.store, "time.ndjson") && maximum > 65536) return fail("V2_READ_SCOPE")
    const prefix = observation.authenticatedPrefix ?? Buffer.alloc(0)
    guard(prefix.length)
    const first = lstatSync(path)
    let latest = first, grew = false
    const hold = (s: Stats) => {
      if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.uid !== process.getuid?.() || (s.mode & 0o7777) !== mode || !sameOwnedIdentity(first, s) || !integer(s.size) || !integer(s.blocks * 512) || s.size > maximum || s.size < latest.size || s.blocks < latest.blocks || s.size === latest.size && !sameOwnedStat(latest, s) || realpathSync(path) !== path) return fail("V2_FILE_CHANGED")
      grew ||= s.size > first.size; latest = s
    }
    hold(first); guard(first.size + prefix.length)
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
    const custody = () => { hold(fstatSync(fd)); hold(lstatSync(path)) }
    let bytes: Buffer
    try {
      custody(); bytes = Buffer.alloc(first.size)
      for (let offset = 0; offset < bytes.length;) { guard(first.size + prefix.length); custody(); const n = readSync(fd, bytes, offset, Math.min(65536, bytes.length - offset), offset); if (!n) return fail("V2_TORN"); offset += n; custody() }
      guard(first.size + prefix.length); custody()
    } finally { closeSync(fd) }
    if (grew) {
      // This second read is deliberately strict. No retry or old-EOF result.
      hold(lstatSync(path))
      const fresh = readLeanContinuationBoundedBytesV2(path, maximum, mode, more => guard(bytes.length + prefix.length + (more ?? 0)))
      hold(lstatSync(path))
      if (fresh.length !== latest.size || !fresh.subarray(0, bytes.length).equals(bytes)) return fail("V2_FILE_CHANGED")
      bytes = fresh
    }
    if (bytes.length < prefix.length || !bytes.subarray(0, prefix.length).equals(prefix)) return fail("V2_FILE_CHANGED")
    return bytes
  }
  if (observation && observation.observationMode !== "strict") return fail("V2_READ_SCOPE")
  guard()
  const path = resolve(name), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid?.() || realpathSync(path) !== path || (stat.mode & 0o7777) !== mode || stat.size > maximum || !integer(stat.size)) return fail("V2_FILE")
  const same = (s: Stats) => s.isFile() && !s.isSymbolicLink() && s.nlink === 1 && s.uid === stat.uid && s.mode === stat.mode && s.dev === stat.dev && s.ino === stat.ino && s.size === stat.size && s.blocks === stat.blocks && s.mtimeMs === stat.mtimeMs && s.ctimeMs === stat.ctimeMs
  guard(stat.size)
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  const hold = () => { if (!same(fstatSync(fd)) || !same(lstatSync(path)) || realpathSync(path) !== path) return fail("V2_FILE_CHANGED") }
  try {
    hold(); const bytes = Buffer.alloc(stat.size)
    for (let offset = 0; offset < bytes.length;) { guard(); hold(); const n = readSync(fd, bytes, offset, Math.min(65536, bytes.length - offset), offset); if (!n) return fail("V2_TORN"); offset += n; hold(); guard() }
    guard(); hold(); return bytes
  } finally { closeSync(fd) }
}
export const readLeanContinuationJsonV2 = (path: string, maximum: number, mode: number, guard: (additionalBytes?: number) => void): Record<string, any> => {
  const bytes = readLeanContinuationBoundedBytesV2(path, maximum, mode, guard)
  guard(bytes.length * 6)
  const value = JSON.parse(bytes.toString("utf8")) as Record<string, any>
  if (!bytes.equals(Buffer.from(leanCanonicalBytes(value)))) return fail("V2_CANONICAL")
  guard(); return value
}
export const assertLeanBaselineContinuationFrontierV2 = (allocation: LeanBaselineContinuationAllocationV2, s: LeanContinuationFrontier, ledger?: LeanExperimentLedger): number => {
  const a = ledger === undefined ? validateLeanBaselineContinuationAllocationV2(allocation) : readLeanAdmittedContinuationAllocationV2(ledger), w = a.window
  if (ledger !== undefined && a !== allocation) return fail("V2_LEDGER_ALLOCATION")
  const required = ["nowMs", "monotonicElapsedMs", "remainingSlots", "charged", "retainedBytes", "scratchBytes", "parentRssBytes", "childRssBytes", "arrayBuffersBytes", "availableMemoryBytes", "freeBytes", "live"]
  const keys = Object.keys(s), optional = keys.includes("remainingClosureMs") || keys.includes("remainingOfflineMs")
  if (!exactLabKeys(s, optional ? [...required, "remainingClosureMs", "remainingOfflineMs"] : required) || keys.some(key => key !== "live" && !integer((s as any)[key])) || s.live !== true || s.remainingSlots > 36 || s.charged < 50 || s.charged > 86 || s.remainingSlots !== 0 && (s.charged + s.remainingSlots < 86 || s.charged + s.remainingSlots > 87) || optional && s.remainingSlots !== 0 || (s.remainingClosureMs ?? w.closureMs) > w.closureMs || (s.remainingOfflineMs ?? w.offlineOverheadMs) > w.offlineOverheadMs) return fail("V2_FRONTIER")
  // Same global/grant/journal/monotonic floors as the public strict path. Only
  // its already-admitted immutable window validation is redundant here.
  const elapsed = ledger === undefined ? leanBaselineContinuationElapsedFloorV2(w, s.nowMs, a.predecessor.elapsedUpperBoundMs, s.monotonicElapsedMs) : leanAdmittedContinuationElapsedFloorV2(ledger, s.nowMs, a.predecessor.elapsedUpperBoundMs, s.monotonicElapsedMs)
  if (!integer(elapsed)) return fail("V2_CLOCK")
  const reserve = leanBaselineContinuationMatchReserveMsV2(w, s.remainingSlots) + (s.remainingClosureMs ?? w.closureMs) + (s.remainingOfflineMs ?? w.offlineOverheadMs), native = 2 * 268435456 + 512000000 + 335544320
  if (!integer(s.nowMs + reserve) || !integer(elapsed + reserve) || (w.routeNamespace === "20261017-v10" || (w.routeNamespace === "20261017-v11" || (w.routeNamespace === "20261017-v12" || w.routeNamespace === "20261017-v13"))) && s.nowMs >= w.deadlineMs || s.nowMs + reserve > w.deadlineMs || elapsed + reserve > w.capMs || s.retainedBytes < a.predecessor.allocatedDiskBytes || s.retainedBytes > LEAN_CAPS.retainedBytes || s.scratchBytes > LEAN_CAPS.scratchBytes || s.retainedBytes + s.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || s.parentRssBytes + s.childRssBytes + s.arrayBuffersBytes + native > LEAN_BASELINE_CONTINUATION_POLICY_V2.memoryBytes || s.availableMemoryBytes < native || s.freeBytes < LEAN_CAPS.totalBytes - s.retainedBytes) return fail("V2_CAPACITY")
  return elapsed
}
export const assertLeanContinuationDirectParent = (commit: string, sourceHead: string, parents: readonly string[], canonical: Uint8Array, committed: Uint8Array): void => {
  if (!/^[a-f0-9]{40}$/u.test(commit) || !/^[a-f0-9]{40}$/u.test(sourceHead) || !equal(parents, [commit, sourceHead]) || !Buffer.from(canonical).equals(Buffer.from(committed))) return fail("DIRECT_PARENT")
}
export interface LeanContinuationFrontier {
  nowMs: number; monotonicElapsedMs: number; remainingSlots: number; charged: number; retainedBytes: number; scratchBytes: number
  parentRssBytes: number; childRssBytes: number; arrayBuffersBytes: number; availableMemoryBytes: number; freeBytes: number; live: boolean
  remainingClosureMs?: number; remainingOfflineMs?: number
}
/** Real callers obtain observations in the same process immediately before each
 * use. This pure predicate never turns a serialized capacity into authority. */
export const assertLeanBaselineContinuationFrontier = (allocation: LeanBaselineContinuationAllocation, s: LeanContinuationFrontier): number => {
  const a = validateLeanBaselineContinuationAllocation(allocation)
  if (Object.entries(s).some(([key, value]) => key !== "live" && !integer(value)) || !s.live || s.nowMs < WINDOW.anchorMs || s.remainingSlots > 36 || s.charged < 43 || s.charged > 79 || s.remainingSlots !== 0 && (s.charged + s.remainingSlots < 79 || s.charged + s.remainingSlots > 80)) return fail("FRONTIER")
  const elapsed = WINDOW.carryMs + Math.max(s.nowMs - WINDOW.anchorMs, s.monotonicElapsedMs)
  if (s.remainingSlots !== 0 && (s.remainingClosureMs !== undefined || s.remainingOfflineMs !== undefined) || (s.remainingClosureMs ?? WINDOW.reserveMs) > WINDOW.reserveMs || (s.remainingOfflineMs ?? a.offlineOverheadMs) > a.offlineOverheadMs) return fail("FRONTIER")
  const reserve = s.remainingSlots * LEAN_CAPS.matchMs + (s.remainingClosureMs ?? WINDOW.reserveMs) + (s.remainingOfflineMs ?? a.offlineOverheadMs)
  // Native heaps, host serialization and decompression remain reserved; an
  // old --max-old-space-size setting is never reported as an observed RSS.
  const memory = s.parentRssBytes + s.childRssBytes + s.arrayBuffersBytes + 2 * 268435456 + 512000000 + 335544320
  if (s.nowMs + reserve > WINDOW.deadlineMs || elapsed + reserve > WINDOW.capMs || s.retainedBytes > LEAN_CAPS.retainedBytes || s.scratchBytes > LEAN_CAPS.scratchBytes || s.retainedBytes + s.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || memory > WINDOW.memoryBytes || s.availableMemoryBytes < 2 * 268435456 + 512000000 + 335544320 || s.freeBytes < LEAN_CAPS.totalBytes - s.retainedBytes) return fail("CAPACITY")
  return elapsed
}

/** Descriptor-checked bounded reads; secret preimages cannot enter this API. */
export const readLeanContinuationBytes = (name: string, maximum: number, mode?: number): Buffer => {
  if (/preimage|secret/iu.test(name) || !integer(maximum) || maximum > 8388608) return fail("READ_SCOPE")
  const path = resolve(name), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > maximum || realpathSync(path) !== path || mode !== undefined && (stat.mode & 0o777) !== mode || stat.uid !== process.getuid?.()) return fail("FILE")
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const before = fstatSync(fd)
    if (before.ino !== stat.ino || before.dev !== stat.dev || before.size !== stat.size || before.nlink !== 1) return fail("FILE_CHANGED")
    const bytes = Buffer.alloc(stat.size)
    let offset = 0
    while (offset < bytes.length) { const n = readSync(fd, bytes, offset, Math.min(65536, bytes.length - offset), offset); if (!n) return fail("TORN"); offset += n }
    const after = fstatSync(fd)
    if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs || after.ctimeMs !== stat.ctimeMs) return fail("FILE_CHANGED")
    return bytes
  } finally { closeSync(fd) }
}
/** Authenticate all pinned bytes without requesting a large Git blob. The caller
 * supplies the exact manifest and a live resource/time guard, not a source scan. */
export const authenticateLeanContinuationPinnedSource = (row: { path: string; root: string }, head: string, pinnedPaths: readonly string[] | ReadonlySet<string>, git: LeanContinuationGit, guard: () => void): void => {
  const name = row.path
  if (!/^sha256:[a-f0-9]{64}$/u.test(row.root) || !/^[a-f0-9]{40}$/u.test(head) || !("has" in pinnedPaths ? pinnedPaths.has(name) : pinnedPaths.includes(name)) || name.startsWith("/") || name.split("/").some(p => !p || p === "." || p === "..") || !/^[A-Za-z0-9_./-]+$/u.test(name) || /preimage|secret/iu.test(name)) return fail("SOURCE_SCOPE")
  guard()
  const path = resolve(name), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid?.() || realpathSync(path) !== path || !integer(stat.size) || stat.size > LEAN_CAPS.totalBytes) return fail("SOURCE_FILE")
  if (stat.size <= 4194304) {
    if (leanBytesRoot(git(["show", `${head}:${name}`])) !== row.root) return fail("SOURCE_ROOT")
    guard(); return
  }
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  const same = (s: ReturnType<typeof fstatSync>) => s.isFile() && s.nlink === 1 && s.uid === stat.uid && s.dev === stat.dev && s.ino === stat.ino && s.size === stat.size && s.mode === stat.mode && s.mtimeMs === stat.mtimeMs && s.ctimeMs === stat.ctimeMs
  const hold = () => { if (!same(fstatSync(fd)) || !same(lstatSync(path)) || realpathSync(path) !== path) return fail("SOURCE_CHANGED") }
  try {
    hold()
    const output = git(["rev-parse", `${head}:${name}`])
    if (output.length > 128 || !/^[a-f0-9]{40}\n?$/u.test(output.toString("utf8"))) return fail("SOURCE_OID")
    const oid = output.toString("utf8").trim(), raw = createHash("sha256"), blob = createHash("sha1").update(`blob ${stat.size}\0`), chunk = Buffer.alloc(65536)
    let offset = 0
    while (offset < stat.size) {
      guard(); hold()
      const n = readSync(fd, chunk, 0, Math.min(chunk.length, stat.size - offset), offset)
      if (!n) return fail("SOURCE_TORN")
      raw.update(chunk.subarray(0, n)); blob.update(chunk.subarray(0, n)); offset += n
      hold()
    }
    guard(); hold()
    if (`sha256:${raw.digest("hex")}` !== row.root || blob.digest("hex") !== oid) return fail("SOURCE_ROOT")
  } finally { closeSync(fd) }
}
export const readLeanContinuationJson = (name: string, maximum = 8388608, mode?: number): Record<string, any> => {
  const bytes = readLeanContinuationBytes(name, maximum, mode), value = JSON.parse(bytes.toString("utf8")) as Record<string, any>
  if (!bytes.equals(Buffer.from(leanCanonicalBytes(value)))) return fail("CANONICAL")
  return value
}
export interface LeanContinuationInventoryRow { path: string; kind: "file" | "directory" | "sealed_metadata"; bytes: number; allocatedBytes: number; dev: number; ino: number; mode: number; mtimeMs: number; ctimeMs: number; rawRoot: LabRoot | null }
/** Merge immutable predicates, never observations. Every invocation stats every
 * unique absolute path afresh, including directories and non-pinned survivors. */
const leanContinuationIdentityPredicates = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRowV2[]) => {
  const predicates = new Map<string, { pins: Pick<Stats, "dev" | "ino" | "size" | "mtimeMs" | "ctimeMs" | "uid" | "mode" | "blocks">[]; survivors: LeanContinuationInventoryRowV2[] }>()
  const at = (path: string) => { const absolute = resolve(path); let row = predicates.get(absolute); if (!row) { row = { pins: [], survivors: [] }; predicates.set(absolute, row) }; return row }
  for (const { path, stat } of pins) at(path).pins.push({ dev: stat.dev, ino: stat.ino, size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, uid: stat.uid, mode: stat.mode, blocks: stat.blocks })
  for (const row of survivors) at(row.path).survivors.push({ ...row, ...(row.members ? { members: [...row.members] } : {}) })
  return predicates
}
export const createLeanContinuationIdentityGuard = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRow[]): (() => void) => {
  const predicates = leanContinuationIdentityPredicates(pins, survivors)
  return () => {
    for (const [path, expected] of predicates) {
      const s = lstatSync(path)
      for (const pin of expected.pins) if (!s.isFile() || s.nlink !== 1 || s.dev !== pin.dev || s.ino !== pin.ino || s.size !== pin.size || s.mtimeMs !== pin.mtimeMs || s.ctimeMs !== pin.ctimeMs) return fail("CONTINUATION_PIN_CHANGED")
      for (const row of expected.survivors) if (s.dev !== row.dev || s.ino !== row.ino || s.blocks * 512 !== row.allocatedBytes || s.size !== row.bytes || s.mtimeMs !== row.mtimeMs || s.ctimeMs !== row.ctimeMs || s.isSymbolicLink() || s.isFile() && s.nlink !== 1) return fail("CONTINUATION_SURVIVOR_CHANGED")
    }
  }
}
const rootFiles = ["AGENTS.md", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json", "tsconfig.base.json"]
/** Scope only: the caller must authenticate frozen cost bytes and root first.
 * These historical identities confer no pinned/source authority. */
export const isLeanContinuationAuthenticatedCostPath = (p: string): boolean =>
  p === ".planning/debug/supervisor-sampling-repair.md" || p === ".planning/debug/v9-baseline-prepare.md" ||
  !(!rootFiles.includes(p) && !/^(?:scripts|packages|\.strategy-lab|\.planning\/(?:artifacts|phases\/265-serious-current-rules-league-and-development-red-team|milestone-proposals\/v1\.38-competitive-strategy-factory-and-adversarial-league))\/[A-Za-z0-9_./-]+$/u.test(p) || p.split("/").includes(".."))

/** Explicit experiment scope. Enumerate names/stats, stream ordinary content,
 * and never open/hash/decode anything within a sealed or preimage subtree. */
export const inventoryLeanContinuationSurvivors = (pinnedPaths: readonly string[], guard: () => void, authenticatedCostPaths: readonly string[] = []): readonly LeanContinuationInventoryRow[] => {
  if (pinnedPaths.length > 1024 || authenticatedCostPaths.length > 2048 || new Set(pinnedPaths).size !== pinnedPaths.length || pinnedPaths.some(p => !rootFiles.includes(p) && !/^(?:scripts|packages|\.planning)\/[A-Za-z0-9_./-]+$/u.test(p) || p.split("/").includes("..") || /preimage|secret/iu.test(p)) || authenticatedCostPaths.some(p => !isLeanContinuationAuthenticatedCostPath(p))) return fail("INVENTORY_SCOPE")
  const names = new Set([...pinnedPaths, ...authenticatedCostPaths])
  for (const directory of [".strategy-lab", ".planning/artifacts"]) {
    for (const name of readdirSync(resolve(directory))) {
      if (directory === ".strategy-lab" ? /^(?:lean-|v1[.-]38|sealed-|holdout)/u.test(name) : /^v1\.38-/u.test(name)) names.add(`${directory}/${name}`)
    }
  }
  // The fresh route is accounted separately. Its request is already pinned.
  names.delete(LEAN_BASELINE_CONTINUATION_PATHS.store); names.delete(LEAN_BASELINE_CONTINUATION_PATHS.temp); names.delete(LEAN_BASELINE_CONTINUATION_PATHS.allocation); names.delete(LEAN_BASELINE_CONTINUATION_PATHS.request)
  const rows: LeanContinuationInventoryRow[] = [], seenPaths = new Set<string>(), seenInodes = new Set<string>()
  let totalBytes = 0
  const visit = (name: string, depth: number, sealed = false): void => {
    guard()
    if (depth > 16 || rows.length >= 4096) return fail("INVENTORY_BOUND")
    const path = resolve(name), key = relative(process.cwd(), path)
    if (seenPaths.has(key)) return
    seenPaths.add(key)
    const s = lstatSync(path), inode = `${s.dev}:${s.ino}`
    if (s.isSymbolicLink() || s.uid !== process.getuid?.() || realpathSync(path) !== path || !s.isFile() && !s.isDirectory() || s.isFile() && s.nlink !== 1 || seenInodes.has(inode)) return fail("INVENTORY_ALIAS")
    seenInodes.add(inode); totalBytes += s.size
    if (totalBytes > LEAN_CAPS.totalBytes) return fail("INVENTORY_BOUND")
    sealed ||= /preimage|secret|sealed|holdout/iu.test(key)
    let rawRoot: LabRoot | null = null
    if (s.isFile() && !sealed) {
      const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW), h = createHash("sha256"), buffer = Buffer.alloc(65536)
      try {
        const start = fstatSync(fd)
        if (start.ino !== s.ino || start.dev !== s.dev || start.nlink !== 1 || start.size !== s.size) return fail("INVENTORY_CHANGED")
        let read = 0
        for (;;) { guard(); const n = readSync(fd, buffer, 0, buffer.length, null); if (!n) break; read += n; if (read > s.size) return fail("INVENTORY_CHANGED"); h.update(buffer.subarray(0, n)) }
        const end = fstatSync(fd)
        if (read !== s.size || end.size !== s.size || end.mtimeMs !== s.mtimeMs || end.ctimeMs !== s.ctimeMs) return fail("INVENTORY_CHANGED")
        rawRoot = `sha256:${h.digest("hex")}`
      } finally { closeSync(fd) }
    }
    rows.push({ path: key, kind: s.isDirectory() ? "directory" : sealed ? "sealed_metadata" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot })
    if (s.isDirectory()) for (const child of readdirSync(path).sort()) visit(join(key, child), depth + 1, sealed)
  }
  for (const name of [...names].sort()) visit(name, 0)
  guard(); return freezeLabValue(rows.sort((a, b) => a.path.localeCompare(b.path)))
}

const privateNames = ["allocation.json", "debit-0.json", "entry.json", "ledger.ndjson", "pair-0.json", "replay-0.ndjson", "result.json", "terminal-0.json"] as const
export interface LeanContinuationReviewedRowV2 { path: string; root: LabRoot; commit: string; kind: "reviewed_source" | "active_planning" }
export interface LeanContinuationInventoryRowV2 extends LeanContinuationInventoryRow { members?: readonly string[] }
const pathsForV2 = (window?: LeanBaselineContinuationWindowV2) => window === undefined ? LEAN_BASELINE_CONTINUATION_PATHS_V2 : leanBaselineContinuationPathsForWindowV2(window)
const futureV2 = (path: string, p: ReturnType<typeof pathsForV2>) => [p.request, p.allocation, p.store, p.temp, p.window].some(root => path === root || path.startsWith(`${root}/`))
const { spentV3Metadata, spentV4Metadata, spentV4Directories, spentV5Metadata, spentV5Directories, spentV6Metadata, spentV7Metadata, spentV7Directories, spentV8Metadata, spentV8Directories, spentV9Metadata, spentV9Directories, spentV10Metadata, spentV11Metadata, spentV11Directories, spentV11Absences, spentV12Metadata, spentV12Absences } = readLeanContinuationExpectedObservations()
export const LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8 = 88924160 + 1167360
export const LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V9 = LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V8 + 1196032
export const LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V10 = 92491776
export const LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V11 = 92499968
export const LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V12 = LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V11 + 1421312
export const LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V13 = LEAN_CONTINUATION_KNOWN_FILE_FLOOR_V12 + 4096
const sameIdentityV2 = (old: LeanContinuationInventoryRow, row: LeanContinuationInventoryRow) => ["path", "kind", "bytes", "allocatedBytes", "dev", "ino", "mode", "mtimeMs", "ctimeMs"].every(key => old[key as keyof LeanContinuationInventoryRow] === row[key as keyof LeanContinuationInventoryRow])
/** Exact reviewed bytes may transition before freeze. Consumed evidence cannot. */
export const reconcileLeanContinuationInventoryV2 = (prior: readonly LeanContinuationInventoryRow[], current: readonly LeanContinuationInventoryRowV2[], reviewed: readonly LeanContinuationReviewedRowV2[], window?: LeanBaselineContinuationWindowV2): void => {
  reconcileContinuationInventory(prior, current, reviewed, window)
}
const reconcileContinuationInventory = (prior: readonly LeanContinuationInventoryRow[], current: readonly LeanContinuationInventoryRowV2[], reviewed: readonly LeanContinuationReviewedRowV2[], window?: LeanBaselineContinuationWindowV2, continuity = new Map<LeanContinuationInventoryRow, LeanContinuationInventoryRowV2>()): void => {
  const selected = pathsForV2(window)
  const live = new Map(current.map(row => [row.path, row])), transitions = new Map(reviewed.map(row => [row.path, row]))
if (prior.length > 4096 || current.length > 4096 || reviewed.length > 1024 || new Set(prior.map(row => row.path)).size !== prior.length || live.size !== current.length || transitions.size !== reviewed.length || current.some(row => futureV2(row.path, selected)) || reviewed.some(row => !["reviewed_source", "active_planning"].includes(row.kind) || !/^[a-f0-9]{40}$/u.test(row.commit) || !/^sha256:[a-f0-9]{64}$/u.test(row.root) || row.path.startsWith(".strategy-lab/") || row.path.startsWith(".planning/artifacts/"))) return fail("V2_TRANSITION_SCOPE")
  for (const old of prior) {
    const row = live.get(old.path), transition = transitions.get(old.path)
    if (!row || row.allocatedBytes < old.allocatedBytes || row.mode !== old.mode || row.kind !== old.kind) return fail("V2_SURVIVOR_SHRINK")
    if (transition) { if (row.kind !== "file" || row.rawRoot !== transition.root) return fail("V2_UNREVIEWED_BYTES"); continue }
    // Only the authenticated importer owns this invocation-local exact pair.
    // Public rows, copied fingerprints and caller flags cannot produce it.
    if ((selected === LEAN_BASELINE_CONTINUATION_PATHS_V11 || (selected === LEAN_BASELINE_CONTINUATION_PATHS_V12 || selected === LEAN_BASELINE_CONTINUATION_PATHS_V13)) && continuity.get(old) === row) continue
    if (old.kind === "directory") {
      const ancestor = reviewed.some(r => r.path.startsWith(`${old.path}/`))
      if (!ancestor) { if (!sameIdentityV2(old, row)) return fail("V2_IMMUTABLE_CHANGED") }
      else {
        if (row.dev !== old.dev || row.ino !== old.ino || !row.members) return fail("V2_DIRECTORY")
        const known = new Set([...prior.map(r => r.path), ...reviewed.map(r => r.path)].filter(p => p.startsWith(`${old.path}/`)).map(p => p.slice(old.path.length + 1).split("/")[0]!))
        if (!equal([...known].sort(), row.members)) return fail("V2_DIRECTORY_MEMBERS")
      }
    } else if (!sameIdentityV2(old, row) || row.rawRoot !== old.rawRoot) return fail("V2_IMMUTABLE_CHANGED")
  }
}
/** Enumerate bounded metadata. Historical contents are never reopened here. */
export const inventoryLeanContinuationSurvivorsV2 = (prior: readonly LeanContinuationInventoryRow[], reviewed: readonly LeanContinuationReviewedRowV2[], git: LeanContinuationGit, guard: (additionalBytes?: number) => void, window?: LeanBaselineContinuationWindowV2): readonly LeanContinuationInventoryRowV2[] => {
  return inventoryContinuationSurvivors(prior, reviewed, git, guard, window, false)
}
const inventoryContinuationSurvivors = (prior: readonly LeanContinuationInventoryRow[], reviewed: readonly LeanContinuationReviewedRowV2[], git: LeanContinuationGit, guard: (additionalBytes?: number) => void, window: LeanBaselineContinuationWindowV2 | undefined, authenticated: boolean): readonly LeanContinuationInventoryRowV2[] => {
  const selected = pathsForV2(window), retainV3 = selected !== LEAN_BASELINE_CONTINUATION_PATHS_V2
  const old = new Map(prior.map(row => [row.path, row])), review = new Map(reviewed.map(row => [row.path, row])), reviewedPaths = new Set(review.keys()), names = new Set([...old.keys(), ...review.keys()])
  if (old.size !== prior.length || review.size !== reviewed.length || prior.length > 4096 || reviewed.length > 1024) return fail("V2_INVENTORY_BOUND")
  if (retainV3) for (const row of spentV3Metadata) names.add(row.path)
  const retainV10 = (selected === LEAN_BASELINE_CONTINUATION_PATHS_V11 || (selected === LEAN_BASELINE_CONTINUATION_PATHS_V12 || selected === LEAN_BASELINE_CONTINUATION_PATHS_V13))
  const retainV9 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V10 || retainV10
  const continuity = new Map<LeanContinuationInventoryRow, LeanContinuationInventoryRowV2>()
  let readBytes = 0
  const spentV10Absent = () => {
    if (!retainV10) return
    for (const name of [LEAN_BASELINE_CONTINUATION_PATHS_V10.allocation, LEAN_BASELINE_CONTINUATION_PATHS_V10.store, LEAN_BASELINE_CONTINUATION_PATHS_V10.temp]) {
      guard()
      try { lstatSync(resolve(name)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error }
      return fail("V11_SPENT_ABSENCE")
    }
  }
  spentV10Absent()
  const retainV11 = (selected === LEAN_BASELINE_CONTINUATION_PATHS_V12 || selected === LEAN_BASELINE_CONTINUATION_PATHS_V13)
  const spentV11Absent = () => {
    if (!retainV11) return
    for (const name of spentV11Absences) { guard(); try { lstatSync(resolve(name)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error }; return fail("V12_SPENT_ABSENCE") }
  }
  spentV11Absent()
  if (retainV11) for (const row of [...spentV11Metadata, ...spentV11Directories]) names.add(row.path)
  const retainV12 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V13
  const spentV12Absent = () => {
    if (!retainV12) return
    for (const name of spentV12Absences) { guard(); try { lstatSync(resolve(name)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error }; return fail("V13_SPENT_ABSENCE") }
  }
  spentV12Absent()
  if (retainV12) for (const row of spentV12Metadata) names.add(row.path)
  if (retainV10) for (const row of spentV10Metadata) names.add(row.path)
  const retainV8 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V9 || retainV9
  const retainV7 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V8 || retainV8
  const retainV6 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V7 || retainV7
  const retainV4 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V5 || selected === LEAN_BASELINE_CONTINUATION_PATHS_V6 || retainV6, retainV5 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V6 || retainV6
  if (retainV4) for (const row of [...spentV4Metadata, ...spentV4Directories]) names.add(row.path)
  if (retainV5) for (const row of [...spentV5Metadata, ...spentV5Directories]) names.add(row.path)
  if (retainV7) for (const row of [...spentV7Metadata, ...spentV7Directories]) names.add(row.path)
  if (retainV8) for (const row of [...spentV8Metadata, ...spentV8Directories]) names.add(row.path)
  if (retainV9) for (const row of [...spentV9Metadata, ...spentV9Directories]) names.add(row.path)
  const spentV6Absent = () => {
    if (!retainV6) return
    for (const name of [LEAN_BASELINE_CONTINUATION_PATHS_V6.allocation, LEAN_BASELINE_CONTINUATION_PATHS_V6.store, LEAN_BASELINE_CONTINUATION_PATHS_V6.temp]) {
      guard()
      try { lstatSync(resolve(name)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { guard(); continue }; throw error }
      return fail("V6_SPENT_ABSENCE")
    }
  }
  spentV6Absent()
  const spentV8Absent = () => {
    if (!retainV8) return
    for (const name of ["result.json", "reader-claim.json", "retained-check.json"]) {
      guard()
      try { lstatSync(resolve(LEAN_BASELINE_CONTINUATION_PATHS_V8.store, name)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { guard(); continue }; throw error }
      return fail("V9_SPENT_ABSENCE")
    }
  }
  spentV8Absent()
  const spentV9Absent = () => {
    if (!retainV9) return
    for (const name of ["result.json", "reader-claim.json", "retained-check.json"]) {
      guard()
      try { lstatSync(resolve(LEAN_BASELINE_CONTINUATION_PATHS_V9.store, name)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") { guard(); continue }; throw error }
      return fail("V10_SPENT_ABSENCE")
    }
  }
  spentV9Absent()
  if (retainV6) for (const row of spentV6Metadata) names.add(row.path)
  for (const dir of [".strategy-lab", ".planning/artifacts"]) {
    const members = readdirSync(resolve(dir)); if (members.length > 4096) return fail("V2_INVENTORY_BOUND")
    for (const name of members) if (dir === ".strategy-lab" ? /^(?:lean-|v1[.-]38|sealed-|holdout)/u.test(name) : /^v1\.38-/u.test(name)) names.add(`${dir}/${name}`)
  }
  const rows: LeanContinuationInventoryRowV2[] = [], seen = new Set<string>(), inodes = new Set<string>()
  const visit = (name: string, depth: number): void => {
    if (futureV2(name, selected) || seen.has(name)) return
    if (depth > 16 || rows.length >= 4096 || name.startsWith("/") || name.split("/").some(p => !p || p === "." || p === "..")) return fail("V2_INVENTORY_SCOPE")
    guard(); const path = resolve(name), s = lstatSync(path), inode = `${s.dev}:${s.ino}`
    if (s.isSymbolicLink() || s.uid !== process.getuid?.() || realpathSync(path) !== path || !s.isFile() && !s.isDirectory() || s.isFile() && s.nlink !== 1 || inodes.has(inode) || !integer(s.blocks * 512)) return fail("V2_INVENTORY_ALIAS")
    seen.add(name); inodes.add(inode)
    const priorRow = old.get(name), reviewedRow = review.get(name), sealed = /preimage|secret|sealed|holdout/iu.test(name)
    let rawRoot = priorRow?.rawRoot ?? null
    const spent = retainV3 ? spentV3Metadata.find(row => row.path === name) : undefined
    const spentV4 = retainV4 ? spentV4Metadata.find(row => row.path === name) : undefined, spentDirectory = retainV4 ? spentV4Directories.find(row => row.path === name) : undefined
    const spentV5 = retainV5 ? spentV5Metadata.find(row => row.path === name) : undefined, spentDirectoryV5 = retainV5 ? spentV5Directories.find(row => row.path === name) : undefined
    const spentV6 = retainV6 ? spentV6Metadata.find(row => row.path === name) : undefined
    const spentV7 = retainV7 ? spentV7Metadata.find(row => row.path === name) : undefined, spentDirectoryV7 = retainV7 ? spentV7Directories.find(row => row.path === name) : undefined
    const spentV8 = retainV8 ? spentV8Metadata.find(row => row.path === name) : undefined, spentDirectoryV8 = retainV8 ? spentV8Directories.find(row => row.path === name) : undefined
    if (spentV8) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV8.bytes || s.blocks * 512 !== spentV8.allocatedBytes || (s.mode & 0o7777) !== spentV8.mode) return fail("V9_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV8.maximum, spentV8.mode, guard))
      if (rawRoot !== spentV8.rawRoot) return fail("V9_SPENT_METADATA")
    }
    if (spentDirectoryV8 && (!s.isDirectory() || s.uid !== 501 || (s.mode & 0o7777) !== 0o700 || !equal(readdirSync(path).sort(), spentDirectoryV8.members))) return fail("V9_SPENT_DIRECTORY")
    const spentV9 = retainV9 ? spentV9Metadata.find(row => row.path === name) : undefined, spentDirectoryV9 = retainV9 ? spentV9Directories.find(row => row.path === name) : undefined
    const spentV10 = retainV10 ? spentV10Metadata.find(row => row.path === name) : undefined
    const spentV12 = retainV12 ? spentV12Metadata.find(row => row.path === name) : undefined
    if (spentV12) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV12.bytes || s.blocks * 512 !== spentV12.allocatedBytes || (s.mode & 0o7777) !== spentV12.mode) return fail("V13_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV12.maximum, spentV12.mode, guard))
      if (rawRoot !== spentV12.rawRoot) return fail("V13_SPENT_METADATA")
    }
    const spentV11 = retainV11 ? spentV11Metadata.find(row => row.path === name) : undefined, spentDirectoryV11 = retainV11 ? spentV11Directories.find(row => row.path === name) : undefined
    if (spentV11) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV11.bytes || s.blocks * 512 !== spentV11.allocatedBytes || (s.mode & 0o7777) !== spentV11.mode) return fail("V12_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV11.maximum, spentV11.mode, guard))
      if (rawRoot !== spentV11.rawRoot) return fail("V12_SPENT_METADATA")
    }
    if (spentDirectoryV11 && (!s.isDirectory() || s.uid !== 501 || (s.mode & 0o7777) !== 0o700 || s.blocks * 512 < spentDirectoryV11.allocatedBytes || !equal(readdirSync(path).sort(), spentDirectoryV11.members))) return fail("V12_SPENT_DIRECTORY")
    if (spentV10) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV10.bytes || s.blocks * 512 !== spentV10.allocatedBytes || (s.mode & 0o7777) !== spentV10.mode) return fail("V11_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV10.maximum, spentV10.mode, guard))
      if (rawRoot !== spentV10.rawRoot) return fail("V11_SPENT_METADATA")
    }
    if (spentV9) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV9.bytes || s.blocks * 512 !== spentV9.allocatedBytes || (s.mode & 0o7777) !== spentV9.mode) return fail("V10_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV9.maximum, spentV9.mode, guard))
      if (rawRoot !== spentV9.rawRoot) return fail("V10_SPENT_METADATA")
    }
    if (spentDirectoryV9 && (!s.isDirectory() || s.uid !== 501 || (s.mode & 0o7777) !== 0o700 || !equal(readdirSync(path).sort(), spentDirectoryV9.members))) return fail("V10_SPENT_DIRECTORY")
    if (spentV7) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV7.bytes || s.blocks * 512 !== spentV7.allocatedBytes || (s.mode & 0o7777) !== spentV7.mode) return fail("V8_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV7.maximum, spentV7.mode, guard))
      if (rawRoot !== spentV7.rawRoot) return fail("V8_SPENT_METADATA")
    }
    if (spentDirectoryV7 && (!s.isDirectory() || s.uid !== 501 || (s.mode & 0o7777) !== 0o700 || !equal(readdirSync(path).sort(), spentDirectoryV7.members))) return fail("V8_SPENT_DIRECTORY")
    if (spentV6) {
      if (!s.isFile() || s.uid !== 501 || s.size !== spentV6.bytes || (s.mode & 0o7777) !== spentV6.mode) return fail("V6_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV6.maximum, spentV6.mode, guard))
      if (rawRoot !== spentV6.rawRoot) return fail("V6_SPENT_METADATA")
    }
    if (spentV5) {
      if (!s.isFile() || spentV5.bytes !== null && s.size !== spentV5.bytes || s.size > spentV5.maximum || (s.mode & 0o7777) !== spentV5.mode) return fail("V5_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV5.maximum, spentV5.mode, guard))
      if (rawRoot !== spentV5.rawRoot) return fail("V5_SPENT_METADATA")
    }
    if (spentDirectoryV5 && (!s.isDirectory() || (s.mode & 0o7777) !== 0o700 || !equal(readdirSync(path).sort(), spentDirectoryV5.members))) return fail("V5_SPENT_DIRECTORY")
    if (spentV4) {
      if (!s.isFile() || s.size !== spentV4.bytes || (s.mode & 0o7777) !== spentV4.mode) return fail("V4_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spentV4.maximum, spentV4.mode, guard))
      if (rawRoot !== spentV4.rawRoot) return fail("V4_SPENT_METADATA")
    }
    if (spentDirectory && (!s.isDirectory() || (s.mode & 0o7777) !== 0o700 || !equal(readdirSync(path).sort(), spentDirectory.members))) return fail("V4_SPENT_DIRECTORY")
    if (spent) {
      if (s.size !== spent.bytes) return fail("V3_SPENT_METADATA")
      rawRoot = leanBytesRoot(readLeanContinuationBoundedBytesV2(name, spent.bytes, 0o600, guard))
      if (rawRoot !== spent.rawRoot) return fail("V3_SPENT_METADATA")
    }
    if (reviewedRow) {
      const mode = s.mode & 0o7777
      const permitted = reviewedRow.kind === "reviewed_source" ? mode === 0o644 || mode === 0o755 : reviewedRow.kind === "active_planning" && mode === 0o644
      if (!s.isFile() || sealed || !permitted) return fail("V2_REVIEWED_FILE")
      guard(65536); authenticateLeanContinuationPinnedSource(reviewedRow, reviewedRow.commit, reviewedPaths, git, guard)
      rawRoot = s.size > 4194304 ? reviewedRow.root : leanBytesRoot(readLeanContinuationBoundedBytesV2(name, 4194304, mode, guard))
      if (rawRoot !== reviewedRow.root) return fail("V2_UNREVIEWED_BYTES")
    }
    const members = s.isDirectory() ? readdirSync(path).sort() : undefined
    if (members && (members.length > 4096 || members.some(n => n.includes("/") || n === "." || n === ".."))) return fail("V2_DIRECTORY_BOUND")
    const row: LeanContinuationInventoryRowV2 = { path: name, kind: s.isDirectory() ? "directory" : sealed ? "sealed_metadata" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot, ...(members ? { members } : {}) }
    if (retainV10 && authenticated && priorRow && !reviewedRow && priorRow.dev !== row.dev) {
      const ancestor = row.kind === "directory" && reviewed.some(r => r.path.startsWith(`${name}/`))
      const stableKeys = ancestor ? ["path", "kind", "ino", "mode"] as const : ["path", "kind", "ino", "mode", "bytes", "allocatedBytes", "mtimeMs", "ctimeMs"] as const
      if (sealed || stableKeys.some(key => priorRow[key] !== row[key]) || (s.mode & 0o7777) !== priorRow.mode) return fail("V11_CONTINUITY_METADATA")
      const same = (x: Stats) => x.dev === s.dev && x.ino === s.ino && x.uid === s.uid && x.mode === s.mode && x.size === s.size && x.blocks === s.blocks && x.mtimeMs === s.mtimeMs && x.ctimeMs === s.ctimeMs && !x.isSymbolicLink() && (s.isFile() ? x.isFile() && x.nlink === 1 : x.isDirectory())
      guard(65536)
      const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | (s.isDirectory() ? constants.O_DIRECTORY : 0))
      const hold = () => { if (!same(fstatSync(fd)) || !same(lstatSync(path)) || realpathSync(path) !== path) return fail("V11_CONTINUITY_CHANGED") }
      try {
        hold()
        if (row.kind === "file") {
          if (!priorRow.rawRoot || !/^sha256:[a-f0-9]{64}$/u.test(priorRow.rawRoot) || !integer(priorRow.bytes) || !integer(readBytes + priorRow.bytes) || readBytes + priorRow.bytes > LEAN_CAPS.totalBytes) return fail("V11_CONTINUITY_BOUND")
          readBytes += priorRow.bytes
          guard(65536); hold()
          const chunk = Buffer.alloc(65536), hash = createHash("sha256")
          for (let offset = 0; offset < priorRow.bytes;) {
            guard(65536); hold()
            const n = readSync(fd, chunk, 0, Math.min(chunk.length, priorRow.bytes - offset), offset)
            if (!n) return fail("V11_CONTINUITY_TORN")
            hash.update(chunk.subarray(0, n)); offset += n; hold(); guard(65536)
          }
          rawRoot = `sha256:${hash.digest("hex")}`; row.rawRoot = rawRoot
          if (rawRoot !== priorRow.rawRoot) return fail("V11_CONTINUITY_HASH")
        } else if (row.kind === "directory") {
          // Direct members derive from authenticated original rows, plus only
          // the existing reviewed-ancestor allowance. No guessed public set.
          const known = new Set([...prior.map(r => r.path), ...(ancestor ? reviewed.map(r => r.path) : [])].filter(p => p.startsWith(`${name}/`)).map(p => p.slice(name.length + 1).split("/")[0]!))
          const originalMembers = (priorRow as LeanContinuationInventoryRowV2).members
          if (originalMembers && !ancestor && !equal([...known].sort(), originalMembers) || !members || !equal([...known].sort(), members) || !equal(readdirSync(path).sort(), members)) return fail("V11_CONTINUITY_MEMBERS")
        } else return fail("V11_CONTINUITY_METADATA")
        guard(65536); hold(); continuity.set(priorRow, row)
      } finally { closeSync(fd) }
    }
    rows.push(row)
    if (members) for (const child of members) visit(`${name}/${child}`, depth + 1)
    guard(); const after = lstatSync(path)
    if (after.dev !== s.dev || after.ino !== s.ino || after.size !== s.size || after.blocks !== s.blocks || after.mtimeMs !== s.mtimeMs || after.ctimeMs !== s.ctimeMs || (reviewedRow || spent) && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.nlink !== 1 || realpathSync(path) !== path)) return fail("V2_INVENTORY_CHANGED")
    if (spentV4 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path) || spentDirectory && (after.mode !== s.mode || after.uid !== s.uid || !after.isDirectory() || after.isSymbolicLink() || realpathSync(path) !== path || !equal(readdirSync(path).sort(), spentDirectory.members))) return fail("V4_SPENT_CHANGED")
    if (spentV5 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path) || spentDirectoryV5 && (after.mode !== s.mode || after.uid !== s.uid || !after.isDirectory() || after.isSymbolicLink() || realpathSync(path) !== path || !equal(readdirSync(path).sort(), spentDirectoryV5.members))) return fail("V5_SPENT_CHANGED")
    if (spentV6 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path)) return fail("V6_SPENT_CHANGED")
    if (spentV7 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path) || spentDirectoryV7 && (after.mode !== s.mode || after.uid !== s.uid || !after.isDirectory() || after.isSymbolicLink() || realpathSync(path) !== path || !equal(readdirSync(path).sort(), spentDirectoryV7.members))) return fail("V8_SPENT_CHANGED")
    if (spentV8 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path) || spentDirectoryV8 && (after.mode !== s.mode || after.uid !== s.uid || !after.isDirectory() || after.isSymbolicLink() || realpathSync(path) !== path || !equal(readdirSync(path).sort(), spentDirectoryV8.members))) return fail("V9_SPENT_CHANGED")
    if (spentV9 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path) || spentDirectoryV9 && (after.mode !== s.mode || after.uid !== s.uid || !after.isDirectory() || after.isSymbolicLink() || realpathSync(path) !== path || !equal(readdirSync(path).sort(), spentDirectoryV9.members))) return fail("V10_SPENT_CHANGED")
    if (spentV11 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path) || spentDirectoryV11 && (after.mode !== s.mode || after.uid !== s.uid || !after.isDirectory() || after.isSymbolicLink() || realpathSync(path) !== path || !equal(readdirSync(path).sort(), spentDirectoryV11.members))) return fail("V12_SPENT_CHANGED")
    if (spentV12 && (after.mode !== s.mode || after.uid !== s.uid || !after.isFile() || after.isSymbolicLink() || after.nlink !== 1 || realpathSync(path) !== path)) return fail("V13_SPENT_CHANGED")
  }
  // V7's two observed V6 files are checked once before the older opaque tree.
  // All predecessor rows still authenticate; no root substitution or credit.
  const ordered = [...names].sort()
  if (retainV8) { for (const row of spentV8Metadata) visit(row.path, 0) }
  if (retainV7) { for (const row of spentV7Metadata) visit(row.path, 0) }
  if (retainV6) { for (const row of spentV6Metadata) visit(row.path, 0) }
  for (const name of ordered) visit(name, 0)
  spentV8Absent()
  spentV6Absent()
  spentV10Absent()
  spentV11Absent()
  spentV12Absent()
  rows.sort((a, b) => a.path.localeCompare(b.path)); reconcileContinuationInventory(prior, rows, reviewed, window, continuity)
  guard(); return freezeLabValue(rows)
}
/** Reject executable expected data before reading fields; never freeze a caller
 * Stats object. These snapshots compile expectations only, not observations. */
const captureContinuationArrayV2 = (value: unknown): readonly unknown[] => {
  if (value === null || typeof value !== "object" || leanHostIsProxy(value) || !Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return fail("V2_EXPECTED_IDENTITY")
  const fields: PropertyDescriptorMap = Object.getOwnPropertyDescriptors(value as object), length = fields.length!.value as unknown
  if (!integer(length) || length > 4096 || Reflect.ownKeys(fields).length !== length + 1) return fail("V2_EXPECTED_IDENTITY")
  const captured: unknown[] = []
  for (let i = 0; i < length; i++) {
    const key = String(i)
    if (!Object.hasOwn(fields, key) || !("value" in fields[key]!)) return fail("V2_EXPECTED_IDENTITY")
    captured[i] = fields[key]!.value
  }
  return Object.freeze(captured)
}
const captureContinuationRecordV2 = (value: unknown, required: readonly string[], plain = true, membership = false): Readonly<Record<string, unknown>> => {
  if (value === null || typeof value !== "object" || leanHostIsProxy(value) || plain && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return fail("V2_EXPECTED_IDENTITY")
  const fields = Object.getOwnPropertyDescriptors(value), captured: Record<string, unknown> = Object.create(null)
  for (const key of Reflect.ownKeys(fields)) {
    if (typeof key !== "string" || !("value" in fields[key]!)) return fail("V2_EXPECTED_IDENTITY")
  }
  for (const key of required) { if (!Object.hasOwn(fields, key)) return fail("V2_EXPECTED_IDENTITY"); captured[key] = fields[key]!.value }
  // Optional means own DATA only, never inherited lookup. Retain a sentinel for
  // explicit undefined while rejecting inherited accessors without evaluation.
  if (membership) {
    if (Object.hasOwn(fields, "members")) captured.members = fields.members!.value
    else if ("members" in value) return fail("V2_EXPECTED_IDENTITY")
  }
  return Object.freeze(captured)
}
const captureContinuationMembersV2 = (value: unknown): readonly string[] => {
  const data = captureContinuationArrayV2(value), captured: string[] = [], names = new Set<string>()
  for (let i = 0; i < data.length; i++) {
    const name = data[i]
    if (typeof name !== "string" || !name || name.includes("/") || name.includes("\0") || name === "." || name === ".." || names.has(name)) return fail("V2_EXPECTED_MEMBERS")
    captured[i] = name; names.add(name)
  }
  return Object.freeze(captured)
}
const continuationMembersTextV2 = (members: readonly string[]): string => Buffer.from(leanCanonicalBytes(captureContinuationMembersV2(members))).toString("utf8")
const compileContinuationIdentityV2 = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRowV2[], growingDirectories?: ReadonlySet<string>, directoryPolicy?: (path: string, members: readonly string[]) => void) => {
  type Pin = Pick<Stats, "dev" | "ino" | "size" | "mtimeMs" | "ctimeMs" | "uid" | "mode" | "blocks">
  const predicates = new Map<string, { pins: Readonly<Pin>[]; survivors: Readonly<LeanContinuationInventoryRowV2>[] }>()
  const at = (path: string) => { const absolute = resolve(path); let expected = predicates.get(absolute); if (!expected) { expected = { pins: [], survivors: [] }; predicates.set(absolute, expected) }; return expected }
  const pinValues = captureContinuationArrayV2(pins), survivorValues = captureContinuationArrayV2(survivors)
  for (let i = 0; i < pinValues.length; i++) {
    const pin = captureContinuationRecordV2(pinValues[i], ["path", "stat"]), s = captureContinuationRecordV2(pin.stat, ["dev", "ino", "size", "uid", "mode", "blocks", "mtimeMs", "ctimeMs"], false)
    if (typeof pin.path !== "string" || !pin.path || ![s.dev, s.ino, s.size, s.uid, s.mode, s.blocks].every(integer) || ![s.mtimeMs, s.ctimeMs].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0)) return fail("V2_EXPECTED_IDENTITY")
    at(pin.path).pins.push(s as Readonly<Pin>)
  }
  for (let i = 0; i < survivorValues.length; i++) {
    const row = captureContinuationRecordV2(survivorValues[i], ["path", "kind", "bytes", "allocatedBytes", "dev", "ino", "mode", "mtimeMs", "ctimeMs", "rawRoot"], true, true)
    if (typeof row.path !== "string" || !row.path || typeof row.kind !== "string" || !["file", "directory", "sealed_metadata"].includes(row.kind) || ![row.bytes, row.allocatedBytes, row.dev, row.ino, row.mode].every(integer) || (row.mode as number) > 0o7777 || ![row.mtimeMs, row.ctimeMs].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0) || row.rawRoot !== null && typeof row.rawRoot !== "string") return fail("V2_EXPECTED_IDENTITY")
    const snapshot = Object.assign(Object.create(null), row) as LeanContinuationInventoryRowV2
    if (Object.hasOwn(row, "members") && row.members !== undefined) {
      const members = captureContinuationMembersV2(row.members)
      if (row.kind !== "directory") return fail("V2_EXPECTED_MEMBERS")
      for (let j = 1; j < members.length; j++) if (members[j - 1]! >= members[j]!) return fail("V2_EXPECTED_MEMBERS")
      snapshot.members = members
    }
    at(row.path).survivors.push(Object.freeze(snapshot))
  }
  const expectedMembers = new Map<LeanContinuationInventoryRowV2, string>()
  for (const expected of predicates.values()) for (const row of expected.survivors) if (row.members !== undefined) expectedMembers.set(row, continuationMembersTextV2(row.members))
  const observe = (selected?: ReadonlySet<string>) => {
    for (const [path, expected] of predicates) {
      if (selected && !selected.has(path)) continue
      const s = lstatSync(path)
      if (s.isSymbolicLink() || s.uid !== process.getuid?.() || realpathSync(path) !== path) return fail("V2_IDENTITY_CHANGED")
      for (const pin of expected.pins) if (!s.isFile() || s.nlink !== 1 || s.dev !== pin.dev || s.ino !== pin.ino || s.size !== pin.size || s.mtimeMs !== pin.mtimeMs || s.ctimeMs !== pin.ctimeMs || s.uid !== pin.uid || s.mode !== pin.mode || s.blocks !== pin.blocks) return fail("CONTINUATION_PIN_CHANGED")
      for (const row of expected.survivors) {
        if (row.kind === "directory" && growingDirectories?.has(path)) {
          const members = readdirSync(path).sort()
          if (!directoryPolicy || !s.isDirectory() || s.nlink < 2 || s.dev !== row.dev || s.ino !== row.ino || (s.mode & 0o7777) !== row.mode || s.size < row.bytes || s.blocks * 512 < row.allocatedBytes || members.length > 4096 || row.members?.some(name => !members.includes(name))) return fail("V6_DIRECTORY_CHANGED")
          directoryPolicy(path, members); continue
        }
        if (s.dev !== row.dev || s.ino !== row.ino || s.blocks * 512 !== row.allocatedBytes || s.size !== row.bytes || s.mtimeMs !== row.mtimeMs || s.ctimeMs !== row.ctimeMs || s.isFile() && s.nlink !== 1) return fail("CONTINUATION_SURVIVOR_CHANGED")
        if (!(row.kind === "directory" ? s.isDirectory() : (row.kind === "file" || row.kind === "sealed_metadata") && s.isFile()) || (s.mode & 0o7777) !== row.mode || row.members && continuationMembersTextV2(readdirSync(path).sort()) !== expectedMembers.get(row)) return fail("V2_IDENTITY_CHANGED")
      }
    }
  }
  return { observe, paths: new Set(predicates.keys()) }
}
export const createLeanContinuationIdentityGuardV2 = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRowV2[]): (() => void) => compileContinuationIdentityV2(pins, survivors).observe

export type LeanContinuationStageV6 = "source" | "archive" | "bootstrap" | "prepare" | "claim" | "import" | "charge" | "dispatch" | "post_match" | "terminal" | "reader" | "publication"
export type LeanContinuationRoleV6 = "fixed_source" | "closed_history" | "closed_directory" | "active_planning" | "active_input" | "active_directory"
/** Invocation-local checking state, never an authority token. Static mutations
 * restored between barriers are intentionally outside this approved assurance. */
export const createLeanContinuationStageControllerV6 = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRowV2[], roles: readonly { path: string; role: string }[], context: object, current: () => void, directoryPolicy?: (path: string, members: readonly string[]) => void) => {
  const identity = compileContinuationIdentityV2(pins, survivors), livePaths = new Set<string>(), classified = new Set<string>()
  const growingDirectories = new Set<string>()
  const captured = captureContinuationArrayV2(roles), allowed = new Set<LeanContinuationRoleV6>(["fixed_source", "closed_history", "closed_directory", "active_planning", "active_input", "active_directory"])
  for (let i = 0; i < captured.length; i++) {
    const row = captureContinuationRecordV2(captured[i], ["path", "role"])
    if (typeof row.path !== "string" || !row.path || typeof row.role !== "string" || !allowed.has(row.role as LeanContinuationRoleV6)) return fail("V6_ROLE")
    const path = resolve(row.path)
    if (!identity.paths.has(path)) return fail("V6_ROLE_PATH")
    classified.add(path)
    if (row.role === "active_planning" || row.role === "active_input" || row.role === "active_directory") livePaths.add(path)
    if (row.role === "active_directory") growingDirectories.add(path)
  }
  const observation = growingDirectories.size ? compileContinuationIdentityV2(pins, survivors, growingDirectories, directoryPolicy) : identity
  if (!context || typeof context !== "object" || leanHostIsProxy(context) || typeof current !== "function" || classified.size !== identity.paths.size) return fail("V6_CONTEXT")
  const pid = process.pid, stages = new Set<LeanContinuationStageV6>(["source", "archive", "bootstrap", "prepare", "claim", "import", "charge", "dispatch", "terminal", "reader", "publication"])
  let invalid = false, inStage = false, inLive = false, inCurrent = false, epoch = 0, accepted: LeanContinuationStageV6 | undefined
  const assert = (candidate: object) => {
    if (invalid || candidate !== context || process.pid !== pid) { invalid = true; return fail("V6_CONTEXT") }
    if (inCurrent) { invalid = true; return fail("V6_CONTEXT") }
    inCurrent = true
    try { current() } catch (error) { invalid = true; throw error } finally { inCurrent = false }
  }
  const denied = (): never => { invalid = true; return fail("V6_STAGE") }
  const begin = (candidate: object, stage: LeanContinuationStageV6) => {
    assert(candidate)
    if (inStage || inLive || !stages.has(stage) || accepted === "terminal" && stage !== "publication" || accepted === "publication") return denied()
    inStage = true; epoch++
    try { observation.observe() } catch (error) { invalid = true; inStage = false; throw error }
    return epoch
  }
  const close = (candidate: object, stage: LeanContinuationStageV6, opened: number) => {
    assert(candidate)
    if (!inStage || inLive || epoch !== opened) return denied()
    observation.observe(); assert(candidate); accepted = stage; inStage = false
  }
  return Object.freeze({
    live<T>(candidate: object, body: () => T): T {
      assert(candidate); if (inLive) return denied(); inLive = true
      try { observation.observe(livePaths); const result = body(); assert(candidate); observation.observe(livePaths); return result }
      catch (error) { invalid = true; throw error } finally { inLive = false }
    },
    withStage<T>(candidate: object, stage: LeanContinuationStageV6, body: () => T): T {
      const opened = begin(candidate, stage)
      try { const result = body(); if (result instanceof Promise) return denied(); close(candidate, stage, opened); return result }
      catch (error) { invalid = true; inStage = false; throw error }
    },
    async withStageAsync<T>(candidate: object, stage: LeanContinuationStageV6, body: () => Promise<T>): Promise<T> {
      const opened = begin(candidate, stage)
      try { const result = await body(); close(candidate, stage, opened); return result }
      catch (error) { invalid = true; inStage = false; throw error }
    },
    assertStage(candidate: object, stage: LeanContinuationStageV6): void { assert(candidate); if (inStage || inLive || accepted !== stage) return denied() },
    invalidate(): void { invalid = true },
  })
}

/** Accounting only, never admission. Durable reservations survive write return;
 * only fresh monotonic owned-block growth can discharge them. Transient read
 * reservations are passed to required(), not accumulated as durable writes. */
export const createLeanContinuationReservationAccountingV8 = (carriedDebitFloor: number, otherKnownDisjointBytes = 0) => {
  if (![carriedDebitFloor, otherKnownDisjointBytes, carriedDebitFloor + otherKnownDisjointBytes].every(integer)) return fail("V8_RESERVATION")
  let measuredOwnedBlocks = 0, outstandingReservations = 0
  const required = (additionalBytes: number, measured: number) => {
    if (![additionalBytes, measured].every(integer) || measured < measuredOwnedBlocks) return fail("V8_RESERVATION")
    outstandingReservations = Math.max(0, outstandingReservations - (measured - measuredOwnedBlocks)); measuredOwnedBlocks = measured
    const bytes = carriedDebitFloor + otherKnownDisjointBytes + measuredOwnedBlocks + outstandingReservations + additionalBytes
    if (!integer(bytes)) return fail("V8_RESERVATION")
    return bytes
  }
  return Object.freeze({ required, reserve(bytes: number, measured: number) { required(0, measured); if (!integer(bytes) || !integer(outstandingReservations + bytes)) return fail("V8_RESERVATION"); outstandingReservations += bytes; return required(0, measured) } })
}

/** Bounded local ownership measurements only. No JSON, ledger, source, history
 * authenticator, capacity-basis callback or complete controller is reachable. */
export type LeanContinuationObservationMode = "strict" | "one-current-owned-overlap"
const sameOwnedIdentity = (a: Stats, b: Stats, classifiedStoreDirectory = false) => a.dev === b.dev && a.ino === b.ino && a.mode === b.mode && a.uid === b.uid && (classifiedStoreDirectory || a.nlink === b.nlink) && a.isFile() === b.isFile() && a.isDirectory() === b.isDirectory()
const sameOwnedStat = (a: Stats, b: Stats) => sameOwnedIdentity(a, b) && a.size === b.size && a.blocks === b.blocks && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs
/** Checking policy only; no caller receives route, runtime or reader authority. */
const stabilizedOwnedMeasurement = (p: { window: string; request: string; allocation: string; store: string; temp: string }, names: ReadonlySet<string>) => {
  type Pin = { stat: Stats; members?: readonly string[]; scratch: boolean }
  let committed = new Map<string, Pin>(), invalid = false
  const store = resolve(p.store), journals = new Set(["ledger.ndjson", "time.ndjson"].map(name => join(store, name)))
  const allowed = (name: string, scratch: boolean) => scratch ? name === "window-claim.json" : names.has(name) || /^(?:(?:pair|observation)-\d{1,2}|(?:source|publication)-[a-z0-9-]+|diagnostic-[a-f0-9]{64})\.json$/u.test(name) || /^[a-f0-9]{64}\.gz$/u.test(name)
  return () => {
    if (invalid) return fail("V8_OWNED_CHANGED")
    const pins = new Map(committed), absentPins = new Set<string>()
    try {
      const scan = (canNominate: boolean) => {
        let nominated = false
        const seen = new Set<string>(), inodes = new Map<string, string>(), absent = new Set<string>()
        const observe = (path: string, mode: number, directory: boolean) => {
          const s = lstatSync(path), prior = pins.get(path)?.stat, inode = `${s.dev}:${s.ino}`
          if (s.isSymbolicLink() || realpathSync(path) !== path || s.uid !== process.getuid?.() || (s.mode & 0o7777) !== mode || (directory ? !s.isDirectory() : !s.isFile() || s.nlink !== 1) || !integer(s.size) || !integer(s.blocks * 512) || inodes.has(inode) && inodes.get(inode) !== path || prior && (!sameOwnedIdentity(prior, s, directory && path === store && canNominate) || s.size < prior.size || s.blocks < prior.blocks || s.nlink < prior.nlink || !canNominate && !sameOwnedStat(prior, s))) return fail("V8_OWNED_CHANGED")
          if (prior && !directory && !journals.has(path) && !sameOwnedStat(prior, s)) return fail("V8_OWNED_CHANGED")
          if (prior && journals.has(path) && s.size === prior.size && !sameOwnedStat(prior, s)) return fail("V8_OWNED_CHANGED")
          inodes.set(inode, path); return s
        }
        const members = (path: string, scratch: boolean) => {
          const values = readdirSync(path).sort()
          if (values.length > 512 || values.some(name => !allowed(name, scratch))) return fail("V8_OWNED_MEMBERS")
          const prior = pins.get(path)?.members
          if (prior && (prior.some(name => !values.includes(name)) || !canNominate && prior.length !== values.length)) return fail("V8_OWNED_CHANGED")
          return values
        }
        const directoryChange = (path: string, before: Stats, opening: readonly string[], after: Stats, closing: readonly string[]) => {
          const added = closing.filter(name => !opening.includes(name))
          if (opening.some(name => !closing.includes(name)) || path !== store || !added.length || after.nlink < before.nlink || after.nlink !== before.nlink && after.nlink - before.nlink !== added.length) return fail("V8_OWNED_CHANGED")
        }
        const nominate = () => { if (!canNominate) return fail("V8_OWNED_CHANGED"); nominated = true }
        const leaf = (path: string, mode: number, scratch: boolean) => {
          seen.add(path)
          const before = observe(path, mode, false); pins.set(path, { stat: before, scratch })
          const after = observe(path, mode, false)
          if (!sameOwnedStat(before, after)) {
            if (!journals.has(path) || after.size <= before.size) return fail("V8_OWNED_CHANGED")
            nominate()
          }
          pins.set(path, { stat: after, scratch })
        }
        const directory = (path: string, scratch: boolean) => {
          seen.add(path)
          const before = observe(path, 0o700, true), opening = members(path, scratch)
          const prior = pins.get(path)
          const unsettledOpening = prior?.members && opening.length > prior.members.length && sameOwnedStat(prior.stat, before)
          // Later additions cannot explain drift already present at opening.
          if (prior?.members && (!sameOwnedStat(prior.stat, before) || prior.members.length !== opening.length)) directoryChange(path, prior.stat, prior.members, before, opening)
          pins.set(path, { stat: before, members: opening, scratch })
          for (const name of opening) leaf(join(path, name), 0o600, scratch)
          const closing = members(path, scratch), after = observe(path, 0o700, true), added = closing.filter(name => !opening.includes(name))
          if (prior?.members && (!sameOwnedStat(prior.stat, after) || prior.members.length !== closing.length)) directoryChange(path, prior.stat, prior.members, after, closing)
          if (!sameOwnedStat(before, after) || added.length) {
            if (!unsettledOpening) directoryChange(path, before, opening, after, closing)
            nominate()
          }
          pins.set(path, { stat: after, members: closing, scratch })
          for (const name of added) leaf(join(path, name), 0o600, scratch)
        }
        for (const [name, mode, dir, scratch] of [[p.window, 0o600, false, false], [p.request, 0o600, false, false], [p.allocation, 0o644, false, false], [p.store, 0o700, true, false], [p.temp, 0o700, true, true]] as const) {
          const path = resolve(name)
          try { lstatSync(path) } catch (error) { if (!pins.has(path) && (error as NodeJS.ErrnoException).code === "ENOENT") { absent.add(path); absentPins.add(path); continue }; throw error }
          if (absentPins.has(path)) return fail("V8_OWNED_CHANGED")
          if (dir) directory(path, scratch); else leaf(path, mode, scratch)
        }
        for (const path of pins.keys()) if (!seen.has(path)) return fail("V8_OWNED_CHANGED")
        // Revalidate the complete candidate after every root was traversed.
        // New members are pinned now too, not merely counted by the next scan.
        for (const [path, pin] of pins) {
          if (pin.members) {
            const current = members(path, pin.scratch), added = current.filter(name => !pin.members!.includes(name)), after = observe(path, 0o700, true)
            if (!sameOwnedStat(pin.stat, after) || added.length) {
              directoryChange(path, pin.stat, pin.members, after, current)
              nominate(); pins.set(path, { ...pin, stat: after, members: current })
              for (const name of added) leaf(join(path, name), 0o600, pin.scratch)
            }
          } else {
            const after = observe(path, pin.stat.mode & 0o7777, false)
            if (!sameOwnedStat(pin.stat, after)) {
              if (!journals.has(path) || after.size <= pin.stat.size) return fail("V8_OWNED_CHANGED")
              nominate(); pins.set(path, { ...pin, stat: after })
            }
          }
        }
        for (const path of absent) { try { lstatSync(path) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error }; return fail("V8_OWNED_CHANGED") }
        return nominated
      }
      if (scan(true)) scan(false)
      let retainedBytes = 0, scratchBytes = 0
      for (const pin of pins.values()) { retainedBytes += pin.stat.blocks * 512; if (pin.scratch) scratchBytes += pin.stat.blocks * 512 }
      if (!integer(retainedBytes) || !integer(scratchBytes) || retainedBytes > LEAN_CAPS.retainedBytes || scratchBytes > LEAN_CAPS.scratchBytes) return fail("V8_OWNED_CHANGED")
      committed = pins
      return { retainedBytes, scratchBytes }
    } catch (error) { invalid = true; throw error }
  }
}
export const createLeanContinuationOwnedMeasurementV8 = (window: LeanBaselineContinuationWindowV2, observationMode: LeanContinuationObservationMode = "strict") => {
  const p = leanBaselineContinuationPathsForWindowV2(window)
  if (p !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && p !== LEAN_BASELINE_CONTINUATION_PATHS_V9 && p !== LEAN_BASELINE_CONTINUATION_PATHS_V10 && (p !== LEAN_BASELINE_CONTINUATION_PATHS_V11 && (p !== LEAN_BASELINE_CONTINUATION_PATHS_V12 && p !== LEAN_BASELINE_CONTINUATION_PATHS_V13))) return fail("V8_SCOPE")
  const previous = new Map<string, { dev: number; ino: number; blocks: number; mode: number }>()
  const names = new Set(["allocation.json", "carry.json", "source-manifest.json", "source-hold.json", "ledger.ndjson", "time.ndjson", "entry.json", "child-terminal.json", "entry-failure.json", "parent-supervisor-reasons.json", "result.json", "run-claim.json", "reader-claim.json", "retained-check.json", "seal-metadata.json", "cold-corpus.json", "initial-proposals.json", "initial-selection.json", "initial-training.json", "response-training.json", "response-work.json", "response-node-receipts.json", "work-accounting.json", "initial-analysis.json", "current-analysis.json"])
  if (observationMode === "one-current-owned-overlap") return stabilizedOwnedMeasurement(p, names)
  if (observationMode !== "strict") return fail("V8_SCOPE")
  return () => {
    let retainedBytes = 0, scratchBytes = 0
    const inodes = new Set<string>(), seen = new Set<string>()
    const visit = (name: string, mode: number, directory = false, scratch = false) => {
      const path = resolve(name); if (seen.has(path)) return fail("V8_OWNED_ALIAS"); seen.add(path)
      let s: Stats
      try { s = lstatSync(path) } catch (error) { if (!previous.has(path) && (error as NodeJS.ErrnoException).code === "ENOENT") return; throw error }
      const inode = `${s.dev}:${s.ino}`, before = previous.get(path), blocks = s.blocks * 512
      if (s.isSymbolicLink() || realpathSync(path) !== path || s.uid !== process.getuid?.() || (s.mode & 0o7777) !== mode || (directory ? !s.isDirectory() : !s.isFile() || s.nlink !== 1) || inodes.has(inode) || !integer(blocks) || before && (before.dev !== s.dev || before.ino !== s.ino || before.mode !== s.mode || blocks < before.blocks)) return fail("V8_OWNED_CHANGED")
      inodes.add(inode); previous.set(path, { dev: s.dev, ino: s.ino, blocks, mode: s.mode }); retainedBytes += blocks; if (scratch) scratchBytes += blocks
      if (directory) {
        const members = readdirSync(path).sort()
        if (members.length > 512) return fail("V8_OWNED_MEMBERS")
        for (const member of members) {
          if (scratch ? member !== "window-claim.json" : !names.has(member) && !/^(?:(?:pair|observation)-\d{1,2}|(?:source|publication)-[a-z0-9-]+|diagnostic-[a-f0-9]{64})\.json$/u.test(member) && !/^[a-f0-9]{64}\.gz$/u.test(member)) return fail("V8_OWNED_MEMBERS")
          visit(join(name, member), 0o600, false, scratch)
        }
      }
      const after = lstatSync(path)
      if (after.dev !== s.dev || after.ino !== s.ino || after.size !== s.size || after.blocks !== s.blocks || after.mode !== s.mode || after.uid !== s.uid || after.mtimeMs !== s.mtimeMs || after.ctimeMs !== s.ctimeMs || realpathSync(path) !== path) return fail("V8_OWNED_CHANGED")
    }
    visit(p.window, 0o600); visit(p.request, 0o600); visit(p.allocation, 0o644); visit(p.store, 0o700, true); visit(p.temp, 0o700, true, true)
    for (const path of previous.keys()) if (!seen.has(path)) return fail("V8_OWNED_CHANGED")
    if (!integer(retainedBytes) || !integer(scratchBytes)) return fail("V8_OWNED_CHANGED")
    return { retainedBytes, scratchBytes }
  }
}

/** Additional static disjoint costs beyond the V8 known FILE lower bound.
 * No contents are read; the real archive importer must still authenticate all
 * of these files. V7 file blocks are already in the lower bound, not stacked. */
export const measureLeanContinuationKnownDisjointBytesV8 = (window?: LeanBaselineContinuationWindowV2): number => {
  const selected = window === undefined ? LEAN_BASELINE_CONTINUATION_PATHS_V8 : pathsForV2(window)
  if (selected !== LEAN_BASELINE_CONTINUATION_PATHS_V8 && selected !== LEAN_BASELINE_CONTINUATION_PATHS_V9 && selected !== LEAN_BASELINE_CONTINUATION_PATHS_V10 && (selected !== LEAN_BASELINE_CONTINUATION_PATHS_V11 && (selected !== LEAN_BASELINE_CONTINUATION_PATHS_V12 && selected !== LEAN_BASELINE_CONTINUATION_PATHS_V13))) return fail("V8_SCOPE")
  const retainV10 = (selected === LEAN_BASELINE_CONTINUATION_PATHS_V11 || (selected === LEAN_BASELINE_CONTINUATION_PATHS_V12 || selected === LEAN_BASELINE_CONTINUATION_PATHS_V13))
  const retainV11 = (selected === LEAN_BASELINE_CONTINUATION_PATHS_V12 || selected === LEAN_BASELINE_CONTINUATION_PATHS_V13)
  const retainedV12 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V13 ? spentV12Metadata : []
  const retainV9 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V10 || retainV10, retainV8 = selected === LEAN_BASELINE_CONTINUATION_PATHS_V9 || retainV9
  const retainedV8 = retainV8 ? spentV8Metadata : [], directoriesV8 = retainV8 ? spentV8Directories : [], retainedV9 = retainV9 ? spentV9Metadata : [], directoriesV9 = retainV9 ? spentV9Directories : []
  let bytes = 0
  const inodes = new Set<string>()
  for (const row of [...spentV3Metadata.map(row => ({ ...row, mode: 0o600 })), ...spentV4Metadata, ...spentV5Metadata, ...spentV6Metadata, ...spentV7Metadata, ...retainedV8, ...retainedV9, ...(retainV10 ? spentV10Metadata : []), ...(retainV11 ? spentV11Metadata : []), ...retainedV12]) {
    const path = resolve(row.path), s = lstatSync(path), key = `${s.dev}:${s.ino}`
    if (!s.isFile() || s.nlink !== 1 || s.uid !== process.getuid?.() || s.isSymbolicLink() || realpathSync(path) !== path || (s.mode & 0o7777) !== row.mode || row.bytes !== null && s.size !== row.bytes || !integer(s.blocks * 512) || inodes.has(key)) return fail("V8_KNOWN_COST")
    inodes.add(key)
    const included = [...spentV7Metadata, ...retainedV8, ...retainedV9, ...(retainV10 ? spentV10Metadata : []), ...(retainV11 ? spentV11Metadata : []), ...retainedV12].find(r => r.path === row.path)?.allocatedBytes ?? 0
    if (s.blocks * 512 < included) return fail("V8_KNOWN_COST")
    bytes += s.blocks * 512 - included
  }
  for (const row of [...spentV4Directories, ...spentV5Directories, ...spentV7Directories, ...directoriesV8, ...directoriesV9, ...(retainV11 ? spentV11Directories : [])]) {
    const path = resolve(row.path), s = lstatSync(path), key = `${s.dev}:${s.ino}`
    if (!s.isDirectory() || s.uid !== process.getuid?.() || s.isSymbolicLink() || realpathSync(path) !== path || (s.mode & 0o7777) !== 0o700 || !integer(s.blocks * 512) || inodes.has(key) || !equal(readdirSync(path).sort(), row.members)) return fail("V8_KNOWN_COST")
    inodes.add(key); bytes += s.blocks * 512
  }
  if (retainV11) for (const path of spentV11Absences) { try { lstatSync(resolve(path)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error }; return fail("V12_SPENT_ABSENCE") }
  if (selected === LEAN_BASELINE_CONTINUATION_PATHS_V13) for (const path of spentV12Absences) { try { lstatSync(resolve(path)) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error }; return fail("V13_SPENT_ABSENCE") }
  return integer(bytes) ? bytes : fail("V8_KNOWN_COST")
}

/** Same complete boundary machinery, with a distinct, private local reservation
 * path. It cannot mint or serialize authority, and never calls current/live
 * from reserve. Current is invoked ONLY by complete opening/closing checks. */
export const createLeanContinuationBoundaryControllerV8 = <T>(pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRowV2[], roles: readonly { path: string; role: string }[], context: object, current: () => void, observeReservation: (additionalBytes: number) => T, directoryPolicy?: (path: string, members: readonly string[]) => void) => {
  const pid = process.pid, cwd = process.cwd(); let invalid = false, observing = false, inLive = false
  const assert = (candidate: object) => { if (invalid || candidate !== context || process.pid !== pid || process.cwd() !== cwd) { invalid = true; return fail("V8_CONTEXT") } }
  const controller = createLeanContinuationStageControllerV6(pins, survivors, roles, context, () => { assert(context); current() }, directoryPolicy)
  const reserve = (candidate: object, additionalBytes = 0) => {
    assert(candidate)
    if (observing || !integer(additionalBytes)) { invalid = true; return fail("V8_RESERVATION") }
    observing = true
    try { const result = observeReservation(additionalBytes); assert(candidate); return result } catch (error) { invalid = true; controller.invalidate(); throw error } finally { observing = false }
  }
  return Object.freeze({
    reserve,
    live<T>(candidate: object, body: () => T): T { reserve(candidate); if (inLive) { invalid = true; return fail("V8_CONTEXT") }; inLive = true; try { const result = body(); if (result instanceof Promise) { invalid = true; return fail("V8_CONTEXT") }; reserve(candidate); return result } catch (error) { invalid = true; controller.invalidate(); throw error } finally { inLive = false } },
    withStage<T>(candidate: object, stage: LeanContinuationStageV6, body: () => T): T { assert(candidate); if (observing || inLive) { invalid = true; return fail("V8_CONTEXT") }; try { return controller.withStage(candidate, stage === "post_match" ? "dispatch" : stage, body) } catch (error) { invalid = true; throw error } },
    async withStageAsync<T>(candidate: object, stage: LeanContinuationStageV6, body: () => Promise<T>): Promise<T> { assert(candidate); if (observing || inLive) { invalid = true; return fail("V8_CONTEXT") }; try { return await controller.withStageAsync(candidate, stage === "post_match" ? "dispatch" : stage, body) } catch (error) { invalid = true; throw error } },
    assertStage(candidate: object, stage: LeanContinuationStageV6) { assert(candidate); try { controller.assertStage(candidate, stage) } catch (error) { invalid = true; throw error } },
    invalidate() { invalid = true; controller.invalidate() },
  })
}

export const LEAN_CONTINUATION_CLOSED_COST_V2 = readLeanContinuationExpectedObservations().closedCostV2
/** Pure closed-cost join, shared by the pinned importer and inert fixtures. */
export const validateLeanContinuationClosedCapsuleV2 = (a: LeanBaselineContinuationAllocation, capsule: { carry: Record<string, any>; result: Record<string, any>; check: Record<string, any>; entry: Record<string, any>; terminal: Record<string, any>; parent: Record<string, any>; events: readonly Record<string, any>[]; intervals: readonly Record<string, any>[] }): { elapsedMs: number; allocatedDiskBytes: number } => {
  validateLeanBaselineContinuationAllocation(a)
  const { carry, result, check, entry, terminal, parent, events, intervals } = capsule
  if (!equal(carry.carry, a.predecessor) || !Array.isArray(carry.inventory) || carry.inventory.length > 4096 || labRoot("lean-baseline-continuation-inventory-v1", carry.inventory) !== a.predecessor.inventoryRoot || labRoot("lean-baseline-continuation-custody-v1", carry.custody) !== a.predecessor.custodyRoot) return fail("V2_ORIGINAL_CARRY")
  const { root: checkRoot, ...checkBody } = check
  if (check.schemaVersion !== "lean-baseline-continuation-retained-check-v1" || checkRoot !== labRoot(check.schemaVersion, checkBody) || check.disposition !== "gaps_found" || check.failure !== null || check.sourceHoldFailure !== null || check.report?.complete !== false || check.charged !== 50 || check.currentCharged !== 7 || check.report?.charged !== 50 || check.report?.currentCharged !== 7 || check.report?.successful !== 6 || check.report?.allocationRoot !== a.root || result.schemaVersion !== "lean-baseline-continuation-result-v1" || result.charged !== 50 || result.successful !== 6 || result.failure !== null || result.status !== "partial_or_failed_baseline" || result.holdoutOpened !== false || result.formationMaterialized !== false || result.planningRoot !== a.planningRoot || result.requestBytesRoot !== a.requestBytesRoot || result.sourceRoot !== a.sourceRoot || result.sourceAuthor !== check.report.sourceAuthor || result.runOperator !== check.report.runOperator || result.evidenceRoot !== check.report.evidenceRoot || result.pipeline?.root !== check.report.pipelineRoot || !equal(result.holdoutReservations, a.holdoutReservations)) return fail("V2_CLOSED_CHECK")
  const { root: reportRoot, ...reportBody } = check.report
  if (reportRoot !== labRoot("lean-baseline-continuation-retained-v1", reportBody)) return fail("V2_CLOSED_CHECK")
  const unused = Array.from({ length: 29 }, (_, i) => i + 7)
  if (![result, check, check.report, result.pipeline].every(r => equal(r.unusedOrdinals, unused)) || ![result, check, entry, terminal, parent].every(r => r.allocationRoot === a.root) || ![entry, terminal, parent, result, check.report].every(r => r.head === result.head) || entry.sourceRoot !== a.sourceRoot || entry.requestBytesRoot !== a.requestBytesRoot || terminal.sourceRoot !== a.sourceRoot || terminal.entryBytesRoot !== leanBytesRoot(leanCanonicalBytes(entry)) || terminal.parentPid !== entry.parentPid || terminal.childPid !== entry.childPid || terminal.status !== "child_exited" || terminal.exitCode !== 0 || terminal.signal !== null || parent.entryBytesRoot !== terminal.entryBytesRoot || parent.parentPid !== entry.parentPid || parent.childPid !== entry.childPid || parent.exitCode !== 0 || parent.signal !== null || parent.uncertain !== false) return fail("V2_CLOSED_JOIN")
  const { root: parentRoot, ...parentBody } = parent
  if (parentRoot !== labRoot(parent.schemaVersion, parentBody)) return fail("V2_PARENT_ROOT")
  if (intervals.length !== 6) return fail("V2_CLOSED_TIME")
  let elapsedMs: number = a.predecessor.elapsedUpperBoundMs, previous: number = a.window.anchorMs
  for (const [i, id] of ["continuation-run-admission", "pilot-entry", "continuation-retained-verifier"].entries()) {
    const start = intervals[2 * i]!, close = intervals[2 * i + 1]!
    if (!exactLabKeys(start, ["kind", "id", "atMs"]) || !exactLabKeys(close, ["kind", "id", "atMs"]) || start.kind !== "start" || close.kind !== "close" || start.id !== id || close.id !== id || !integer(start.atMs) || !integer(close.atMs) || start.atMs < previous || close.atMs < start.atMs || close.atMs > a.window.deadlineMs) return fail("V2_CLOSED_TIME")
    elapsedMs += close.atMs - start.atMs; previous = close.atMs
    if (id === "pilot-entry" && (start.atMs !== entry.wallStartMs || close.atMs !== entry.wallStartMs + terminal.elapsedUpperBoundMs || terminal.wallObservedMs > close.atMs)) return fail("V2_CLOSED_TIME")
  }
  if (!integer(check.elapsedMs) || check.elapsedMs < Math.max(465187899, elapsedMs, a.window.carryMs + previous - a.window.anchorMs) || !integer(result.elapsedMs) || result.elapsedMs > check.elapsedMs) return fail("V2_CLOSED_TIME")
  const charges: Record<string, any>[] = [], terminals: Record<string, any>[] = []
  let stopped = false, debit = a.predecessor.allocatedDiskBytes
  if (events.length > 64) return fail("V2_CLOSED_LEDGER")
  for (const event of events) {
    if (stopped) return fail("V2_CLOSED_LEDGER")
    if (event.kind === "charge") {
      const c = event.charge, slot = a.slots[charges.length]
      if (charges.length !== terminals.length || !slot || !exactLabKeys(event, ["kind", "charge"]) || !exactLabKeys(c, ["schemaVersion", "allocationRoot", "slotRoot", "ordinal", "root"]) || c.schemaVersion !== "lean-slot-charge-v1" || c.allocationRoot !== a.root || c.ordinal !== charges.length || c.slotRoot !== slot.root) return fail("V2_CLOSED_LEDGER")
      const { root, ...body } = c; if (root !== labRoot(c.schemaVersion, body)) return fail("V2_CLOSED_LEDGER"); charges.push(c)
    } else if (event.kind === "terminal") {
      const record = event.record as Record<string, unknown>
      if (!exactLabKeys(event, ["kind", "chargeRoot", "record", "replay"]) || charges.length !== terminals.length + 1 || event.chargeRoot !== charges.at(-1)?.root || record.classification !== (terminals.length === 6 ? "system_failure" : "success") || record.code !== (terminals.length === 6 ? "SUPERVISOR_FAILURE" : "OK") || record.cleanupComplete !== true || (terminals.length === 6 ? record.outcome !== null : !["bottom", "top", "DRAW"].includes(String(record.outcome)))) return fail("V2_CLOSED_LEDGER")
      terminals.push(event)
    } else if (event.kind === "resource") {
      if (!exactLabKeys(event, ["kind", "elapsedMs", "physicalBytes", "bufferBytes", "scratchBytes"]) || ![event.elapsedMs, event.physicalBytes, event.bufferBytes, event.scratchBytes].every(integer) || Number(event.elapsedMs) > check.elapsedMs) return fail("V2_CLOSED_LEDGER")
      debit = Math.max(debit, a.predecessor.allocatedDiskBytes + Number(event.physicalBytes))
    } else if (event.kind === "stop" && event.reason === "failure" && exactLabKeys(event, ["kind", "reason"])) stopped = true
    else return fail("V2_CLOSED_LEDGER")
  }
  if (!stopped || charges.length !== 7 || terminals.length !== 7 || !integer(check.physicalBytes) || !integer(terminal.physicalBytes) || check.physicalBytes < debit) return fail("V2_CLOSED_LEDGER")
  const evidenceRecords = a.slots.map((slot, ordinal) => ({ slotRoot: slot.root, requestRoot: slot.requestRoot, chargeRoot: charges[ordinal]?.root ?? null, terminal: terminals[ordinal] ?? null, status: charges[ordinal] ? terminals[ordinal]!.record.classification : "unused" }))
  if (result.evidenceRoot !== labRoot("lean-evidence-v1", { allocationRoot: a.root, events, records: evidenceRecords })) return fail("V2_CLOSED_EVIDENCE_ROOT")
  const { root: pipelineRoot, ...pipelineBody } = result.pipeline
  if (pipelineRoot !== labRoot("lean-baseline-continuation-pipeline-v1", pipelineBody)) return fail("V2_CLOSED_PIPELINE_ROOT")
  return { elapsedMs: check.elapsedMs, allocatedDiskBytes: Math.max(88924160, check.physicalBytes, terminal.physicalBytes, debit) }
}
/** Fixed raw anchors authenticate cost only; no old reader/replay/recursive importer. */
export const authenticateLeanBaselineContinuationCarryV2 = (git: LeanContinuationGit, pinnedPaths: readonly LeanContinuationReviewedRowV2[], guard: (additionalBytes?: number) => void, window?: LeanBaselineContinuationWindowV2) => {
  pathsForV2(window)
  const old = LEAN_BASELINE_CONTINUATION_PATHS, anchor = LEAN_CONTINUATION_CLOSED_COST_V2, records: { name: string; rawRoot: LabRoot }[] = []
  const read = (name: string, mode = 0o600, maximum = 4194304): Buffer => { const bytes = readLeanContinuationBoundedBytesV2(name, maximum, mode, guard); records.push({ name, rawRoot: leanBytesRoot(bytes) }); return bytes }
  const parse = (bytes: Buffer): Record<string, any> => { guard(bytes.length * 6); const v = JSON.parse(bytes.toString("utf8")) as Record<string, any>; if (!bytes.equals(Buffer.from(leanCanonicalBytes(v)))) return fail("V2_CANONICAL"); return v }
  const bytes = read(old.allocation, 0o644, 262144)
  if (leanBytesRoot(bytes) !== anchor.allocationBytesRoot) return fail("V2_ALLOCATION_ANCHOR")
  const a = validateLeanBaselineContinuationAllocation(parse(bytes))
  if (a.sourceHead !== anchor.sourceHead || !bytes.equals(read(`${old.store}/allocation.json`, 0o600, 262144))) return fail("V2_ALLOCATION_JOIN")
  assertLeanContinuationDirectParent(anchor.allocationCommit, a.sourceHead, git(["rev-list", "--parents", "-n", "1", anchor.allocationCommit]).toString("utf8").trim().split(/\s+/u), bytes, git(["show", `${anchor.allocationCommit}:${old.allocation}`]))
  if (git(["diff", "--name-only", a.sourceHead, anchor.allocationCommit]).toString("utf8").trim() !== old.allocation) return fail("V2_ALLOCATION_DIFF")
  const resultBytes = read(`${old.store}/result.json`), checkBytes = read(`${old.store}/retained-check.json`)
  if (leanBytesRoot(resultBytes) !== anchor.resultBytesRoot || leanBytesRoot(checkBytes) !== anchor.checkBytesRoot) return fail("V2_CLOSED_ANCHOR")
  const result = parse(resultBytes), check = parse(checkBytes), carry = parse(read(`${old.store}/carry.json`)), entry = parse(read(`${old.store}/entry.json`)), terminal = parse(read(`${old.store}/child-terminal.json`)), parent = parse(read(`${old.store}/parent-supervisor-reasons.json`))
  if (check.root !== anchor.checkRoot || result.head !== anchor.allocationCommit || leanBytesRoot(read(old.request, 0o600, 65536)) !== a.requestBytesRoot) return fail("V2_CLOSED_ANCHOR")
  const lines = (name: string) => { const b = read(`${old.store}/${name}`), t = b.toString("utf8"); if (!t.endsWith("\n")) return fail("V2_CLOSED_LINES"); return t.slice(0, -1).split("\n").map(line => parse(Buffer.from(line))) }
  const events = lines("ledger.ndjson"), intervals = lines("time.ndjson"), closed = validateLeanContinuationClosedCapsuleV2(a, { carry, result, check, entry, terminal, parent, events, intervals })
  if ((window?.routeNamespace === "20261017-v11" || (window?.routeNamespace === "20261017-v12" || window?.routeNamespace === "20261017-v13"))) {
    const expected = spentV10Metadata.find(row => row.path === LEAN_BASELINE_CONTINUATION_PATHS_V10.window)
    const anchorBytes = read(LEAN_BASELINE_CONTINUATION_PATHS_V10.window, 0o600, 65536)
    if (!expected || leanBytesRoot(anchorBytes) !== expected.rawRoot) return fail("V11_ALLOWANCE_ANCHOR")
    const allowance = validateLeanBaselineContinuationWindowV2(parse(anchorBytes))
    // V12 has its own prospective approval; authenticated V10 remains lineage
    // and cost evidence only. V11 retains the entire original allowance join.
    const allowanceKeys = (window.routeNamespace === "20261017-v12" || window.routeNamespace === "20261017-v13") ? ["durationMs", "closureMs", "offlineOverheadMs"] : ["approvedAtMs", "anchorMs", "carryMs", "capMs", "deadlineMs", "durationMs", "closureMs", "offlineOverheadMs"]
    if (allowance.routeNamespace !== "20261017-v10" || allowanceKeys.some(key => allowance[key as keyof typeof allowance] !== window[key as keyof typeof window]) || (window.routeNamespace === "20261017-v11" && !equal(allowance.approvalEvidence, window.approvalEvidence))) return fail("V11_ALLOWANCE_ANCHOR")
  }
  if (window?.routeNamespace === "20261017-v13") {
    const expected = spentV12Metadata.find(row => row.path === LEAN_BASELINE_CONTINUATION_PATHS_V12.window)
    const anchorBytes = read(LEAN_BASELINE_CONTINUATION_PATHS_V12.window, 0o600, 65536)
    if (!expected || leanBytesRoot(anchorBytes) !== expected.rawRoot) return fail("V13_ALLOWANCE_ANCHOR")
    const allowance = validateLeanBaselineContinuationWindowV2(parse(anchorBytes))
    if (allowance.routeNamespace !== "20261017-v12" || ["approvedAtMs", "anchorMs", "carryMs", "capMs", "deadlineMs", "durationMs", "closureMs", "offlineOverheadMs"].some(key => allowance[key as keyof typeof allowance] !== window[key as keyof typeof window]) || !equal(allowance.approvalEvidence, window.approvalEvidence)) return fail("V13_ALLOWANCE_ANCHOR")
  }
  const inventory = inventoryContinuationSurvivors(carry.inventory as LeanContinuationInventoryRow[], pinnedPaths, git, guard, window, true)
  const originalSum = (carry.inventory as LeanContinuationInventoryRow[]).reduce((n, row) => n + row.allocatedBytes, 0), residualDiskBytes = a.predecessor.allocatedDiskBytes - originalSum
  if (!integer(residualDiskBytes)) return fail("V2_RESIDUAL")
  // Consumed-v2 is already in current inventory. Preserve larger authenticated
  // debit as residual, rather than adding that store a second time.
  const debit = reconcileLeanContinuationV2DiskDebit(a.predecessor.allocatedDiskBytes, carry.inventory as LeanContinuationInventoryRow[], closed.allocatedDiskBytes, inventory, window)
  const allocatedDiskBytes = debit.allocatedDiskBytes
  const custody = { originalCarryRoot: a.predecessor.root, allocationRoot: a.root, allocationBytesRoot: leanBytesRoot(bytes), allocationCommit: anchor.allocationCommit, sourceHead: a.sourceHead, resultRoot: labRoot(result.schemaVersion, result), resultBytesRoot: leanBytesRoot(resultBytes), checkRoot: check.root as LabRoot, checkBytesRoot: leanBytesRoot(checkBytes), records }
  const body = { schemaVersion: "lean-baseline-continuation-carry-v2" as const, chargedMatches: 50 as const, elapsedUpperBoundMs: closed.elapsedMs, allocatedDiskBytes, residualDiskBytes: debit.residualDiskBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, originalCarryRoot: a.predecessor.root, closedCapsuleRoot: labRoot("lean-baseline-continuation-closed-capsule-v2", custody), custodyRoot: labRoot("lean-baseline-continuation-custody-v2", custody), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v2", inventory), qualifiedReaderAuthority: "cost_only" as const }
  const newCarry: LeanBaselineContinuationCarryV2 = freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
  guard(); return freezeLabValue({ carry: newCarry, custody, inventory })
}
/** Preserve the authenticated no-refund debit, including debit not represented
 * by surviving rows. Overlapping pinned paths have one current inventory row. */
export const reconcileLeanContinuationDiskDebit = (prior: { allocatedDiskBytes: number; survivors: readonly { identity: string; allocatedBytes: number }[] }, current: readonly { path: string; allocatedBytes: number }[]): number => {
  const old = new Map(prior.survivors.map(row => [row.identity, row.allocatedBytes])), live = new Map(current.map(row => [row.path, row.allocatedBytes]))
  if (!integer(prior.allocatedDiskBytes) || old.size !== prior.survivors.length || live.size !== current.length || [...old.values(), ...live.values()].some(bytes => !integer(bytes)) || [...old.values()].reduce((sum, bytes) => sum + bytes, 0) > prior.allocatedDiskBytes || [...old].some(([path, bytes]) => !live.has(path) || live.get(path)! < bytes)) return fail("OLD_COST")
  const debit = prior.allocatedDiskBytes + [...live].reduce((sum, [path, bytes]) => sum + Math.max(0, bytes - (old.get(path) ?? 0)), 0)
  if (!integer(debit) || debit > LEAN_CAPS.retainedBytes) return fail("CARRY_CAPACITY")
  return debit
}
/** V2 keeps the closed capsule as a base, then adds only post-capsule growth.
 * The consumed old-v2 route is already represented by closed debit and is
 * excluded from the incremental rows exactly once. */
export const reconcileLeanContinuationV2DiskDebit = (
  originalDebit: number,
  original: readonly { path: string; allocatedBytes: number }[],
  closedDebit: number,
  current: readonly { path: string; allocatedBytes: number }[],
  window?: LeanBaselineContinuationWindowV2,
) => {
  const selected = pathsForV2(window)
  const consumed = (path: string) => [LEAN_BASELINE_CONTINUATION_PATHS.request, LEAN_BASELINE_CONTINUATION_PATHS.allocation, LEAN_BASELINE_CONTINUATION_PATHS.store, LEAN_BASELINE_CONTINUATION_PATHS.temp].some(root => path === root || (root === LEAN_BASELINE_CONTINUATION_PATHS.store || root === LEAN_BASELINE_CONTINUATION_PATHS.temp) && path.startsWith(`${root}/`))
  if (!integer(originalDebit) || !integer(closedDebit) || original.length > 4096 || current.length > 4096 || new Set(original.map(r => r.path)).size !== original.length || new Set(current.map(r => r.path)).size !== current.length || [...original, ...current].some(r => !r.path || r.path.startsWith("/") || r.path.split("/").some(x => !x || x === "." || x === "..") || !integer(r.allocatedBytes)) || original.some(r => consumed(r.path)) || current.some(r => futureV2(r.path, selected))) return fail("V2_DISK_SCOPE")
  const old = new Map(original.map(r => [r.path, r.allocatedBytes])), live = new Map(current.map(r => [r.path, r.allocatedBytes]))
  const roots = [LEAN_BASELINE_CONTINUATION_PATHS.request, LEAN_BASELINE_CONTINUATION_PATHS.allocation, LEAN_BASELINE_CONTINUATION_PATHS.store, LEAN_BASELINE_CONTINUATION_PATHS.temp]
  if (roots.some(path => !live.has(path)) || [...old].some(([path, bytes]) => !live.has(path) || live.get(path)! < bytes)) return fail("V2_DISK_MISSING_OR_SHRINK")
  const oldSum = [...old.values()].reduce((a, b) => a + b, 0), currentSum = [...live.values()].reduce((a, b) => a + b, 0)
  const consumedBytes = [...live].filter(([path]) => consumed(path)).reduce((a, [, b]) => a + b, 0)
  const originalGrowth = [...old].reduce((n, [path, bytes]) => n + Math.max(0, live.get(path)! - bytes), 0)
  const newRows = [...live].filter(([path]) => !old.has(path) && !consumed(path)).reduce((a, [, b]) => a + b, 0)
  const base = Math.max(closedDebit, originalDebit + consumedBytes)
  const allocatedDiskBytes = base + originalGrowth + newRows, residualDiskBytes = allocatedDiskBytes - currentSum
  if (![oldSum, currentSum, consumedBytes, originalGrowth, newRows, base, allocatedDiskBytes, residualDiskBytes].every(integer) || oldSum > originalDebit || residualDiskBytes < 0 || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("V2_DISK_OVERFLOW")
  return Object.freeze({ allocatedDiskBytes, residualDiskBytes, consumedBytes, originalGrowth, newRows, base })
}
const rooted = (value: Record<string, any>, domain: string) => { const { root, ...body } = value; if (root !== labRoot(domain, body)) return fail("CUSTODY_ROOT") }
/** Exact bounded canonical custody, no historical reader or source materializer. */
export const authenticateLeanBaselineContinuationCarry = (git: LeanContinuationGit, pinnedPaths: readonly string[], guard: () => void) => {
  guard()
  const bytes = readLeanContinuationBytes(LEAN_PRIVATE_MATCH_ARTIFACT_V3, 65536, 0o644), a = validateLeanPrivateMatchAllocationV3(JSON.parse(bytes.toString("utf8")))
  if (!bytes.equals(Buffer.from(leanCanonicalBytes(a))) || !equal(a.priorMatchCarry, LEAN_PRIVATE_MATCH_CARRY_V3)) return fail("CARRY")
  const store = `.strategy-lab/lean-private-matches-v3/${a.root.slice(7)}`
  if (!equal(readdirSync(store).sort(), privateNames)) return fail("CUSTODY_INVENTORY")
  const values = new Map(privateNames.filter(n => n !== "replay-0.ndjson").map(name => [name, readLeanContinuationBytes(join(store, name), name === "terminal-0.json" ? 8388608 : 65536, 0o600)]))
  if (!values.get("allocation.json")!.equals(bytes)) return fail("CANONICAL_ALLOCATION")
  const parse = (name: Exclude<typeof privateNames[number], "replay-0.ndjson">) => { const bytes = values.get(name)!, value = JSON.parse(bytes.toString("utf8")) as Record<string, any>; if (!bytes.equals(Buffer.from(leanCanonicalBytes(value)))) return fail("CANONICAL"); return value }
  const result = parse("result.json"), entry = parse("entry.json"), pair = parse("pair-0.json"), debit = parse("debit-0.json"), terminal = parse("terminal-0.json")
  for (const [value, kind] of [[result, "result"], [entry, "entry"], [pair, "pair"], [debit, "debit"], [terminal, "terminal"]] as const) { rooted(value, `lean-private-match-${kind}-v3`); if (value.allocationRoot !== a.root) return fail("CUSTODY_ALLOCATION") }
  const commit = result.allocationCommit
  if (result.matchCount !== 1 || result.terminals?.[0]?.ordinal !== 0 || result.terminals?.[0]?.rowCount !== terminal.evidence?.rowCount || pair.ordinal !== 0 || terminal.ordinal !== 0 || debit.requestRoot !== a.slots[0].requestRoot || pair.requestRoot !== a.slots[0].requestRoot || debit.slotRoot !== a.slots[0].root || !equal(pair.sources, a.sources) || pair.priorLedgerByteLength !== 0 || debit.priorLedgerByteLength !== 0 || pair.priorLedgerBytesRoot !== leanBytesRoot(Buffer.alloc(0)) || debit.priorLedgerBytesRoot !== pair.priorLedgerBytesRoot) return fail("CUSTODY_JOIN")
  if (typeof commit !== "string" || !/^[a-f0-9]{40}$/u.test(commit) || entry.allocationCommit !== commit || result.sourceHead !== a.sourceHead || entry.sourceHead !== a.sourceHead || entry.allocationDigest !== leanBytesRoot(bytes) || result.cumulativeCharged !== 43 || debit.cumulativeCharged !== 43 || debit.ordinal !== 0 || !equal(result.attemptedOrdinals, [0]) || !equal(result.unattemptedOrdinals, []) || debit.pairRoot !== pair.root || terminal.debitRoot !== debit.root || pair.slotRoot !== a.slots[0].root || terminal.slotRoot !== pair.slotRoot || result.terminals?.length !== 1 || result.terminals[0].root !== terminal.root || result.terminals[0].rawRoot !== leanBytesRoot(values.get("terminal-0.json")!) || !values.get("ledger.ndjson")!.equals(Buffer.concat([leanCanonicalBytes(debit), Buffer.from("\n")]))) return fail("CUSTODY_JOIN")
  const parents = git(["rev-list", "--parents", "-n", "1", commit]).toString("utf8").trim().split(/\s+/u)
  assertLeanContinuationDirectParent(commit, a.sourceHead, parents, bytes, git(["show", `${commit}:${LEAN_PRIVATE_MATCH_ARTIFACT_V3}`]))
  // The 42-charge and 41-charge inventories are authenticated by their frozen
  // roots, without loading replay or historical source trees into memory.
  const predecessors = [
    { carry: LEAN_PRIVATE_MATCH_CARRY_V3, version: 2, validate: validateLeanPrivateMatchAllocationV2, inventoryDomain: "lean-private-match-spent-inventory-v3", reader: "265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v2.md" },
    { carry: LEAN_PRIVATE_MATCH_CARRY_V2, version: 1, validate: validateLeanPrivateMatchAllocationV1, inventoryDomain: "lean-private-match-spent-inventory-v2", reader: "265-16-TWO-MATCH-RETAINED-VERIFICATION-v1.md" },
  ] as const
  const costPath = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-PAIR-CLOSURE-v1.json"
  const costBytes = readLeanContinuationBytes(costPath, 262144, LEAN_CONTINUATION_PRIVATE_COST_MODE), cost = JSON.parse(costBytes.toString("utf8")) as Record<string, any>
  rooted(cost, "lean-resource-window-pair-closure-v15")
  if (leanBytesRoot(costBytes) !== "sha256:efe0acbd35beb37c47877cd843e695b4ed0d94b781e66c07464238f152bc45b4" || cost.root !== LEAN_PRIVATE_PROBE_COST_ROOT || cost.cumulativeCharged !== 40 || cost.survivors?.length !== 1077) return fail("OLD_COST")
  const costPaths = cost.survivors.map((row: { identity: string }) => row.identity) as string[]
  const costOnlyReaders = ["265-16-PRIVATE-STARTUP-INTEGRATION-RETAINED-VERIFICATION-v1.md", "265-16-PRIVATE-STARTUP-INTEGRATION-RETAINED-VERIFICATION-v2.md"].map(name => `.planning/phases/265-serious-current-rules-league-and-development-red-team/${name}`)
  const inventory = inventoryLeanContinuationSurvivors(pinnedPaths, guard, [...costPaths, costPath, ...costOnlyReaders, ...predecessors.map(old => `.planning/phases/265-serious-current-rules-league-and-development-red-team/${old.reader}`)]), byPath = new Map(inventory.map(row => [row.path, row]))
  for (const old of predecessors) {
    guard()
    const directory = `.strategy-lab/lean-private-matches-v${old.version}/${old.carry.allocationRoot.slice(7)}`, hashes: Record<string, string> = {}
    if (!equal(readdirSync(directory).sort(), privateNames)) return fail("OLD_INVENTORY")
    for (const name of privateNames) { const row = byPath.get(`${directory}/${name}`); if (!row?.rawRoot) return fail("OLD_INVENTORY"); hashes[name] = row.rawRoot.slice(7) }
    if (labRoot(old.inventoryDomain, hashes) !== old.carry.inventoryRoot) return fail("OLD_INVENTORY")
    const oldBytes = readLeanContinuationBytes(`${directory}/allocation.json`, 65536, 0o600), oldAllocation = old.validate(JSON.parse(oldBytes.toString("utf8")))
    const canonical = `.planning/artifacts/v1.38-phase-265-private-match-allocation-v${old.version}.json`
    if (oldAllocation.root !== old.carry.allocationRoot || !oldBytes.equals(readLeanContinuationBytes(canonical, 65536, 0o644)) || !oldBytes.equals(git(["show", `${old.carry.allocationCommit}:${canonical}`])) || !equal(git(["rev-list", "--parents", "-n", "1", old.carry.allocationCommit]).toString("utf8").trim().split(/\s+/u), [old.carry.allocationCommit, oldAllocation.sourceHead])) return fail("OLD_JOIN")
    const report = `.planning/phases/265-serious-current-rules-league-and-development-red-team/${old.reader}`
    if (leanBytesRoot(readLeanContinuationBytes(report, 65536, 0o644)) !== old.carry.readerRawRoot) return fail("OLD_READER_COST")
  }
  const allocatedDiskBytes = reconcileLeanContinuationDiskDebit(cost as { allocatedDiskBytes: number; survivors: { identity: string; allocatedBytes: number }[] }, inventory)
  if (!equal(a.priorProbeCarry, authenticateLeanPrivateMatchProbeCarryV1())) return fail("PROBE_COST")
  const replay = byPath.get(`${store}/replay-0.ndjson`)
  if (!replay?.rawRoot || terminal.evidence?.streamRawRoot !== replay.rawRoot || terminal.evidence?.streamBytes !== replay.bytes || result.terminals[0].streamRawRoot !== replay.rawRoot || result.terminals[0].streamBytes !== replay.bytes) return fail("REPLAY_CUSTODY")
  const custody = { allocationRoot: a.root, allocationDigest: leanBytesRoot(bytes), allocationCommit: commit, sourceHead: a.sourceHead, records: [...values].map(([name, b]) => ({ name, rawRoot: leanBytesRoot(b) })), replayRoot: replay.rawRoot, priorMatchCarryRoot: a.priorMatchCarry.root, priorProbeCarryRoot: a.priorProbeCarry.root, costSnapshotRoot: cost.root, resultRoot: result.root, terminalRoot: terminal.root }
  if (!integer(allocatedDiskBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("CARRY_CAPACITY")
  const body = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 459375903 as const, allocatedDiskBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: labRoot("lean-baseline-continuation-custody-v1", custody), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v1", inventory), qualifiedReaderAuthority: "cost_only" as const }
  const carry: LeanBaselineContinuationCarry = freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
  guard(); return freezeLabValue({ carry, custody, inventory })
}
