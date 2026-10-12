/** Bounded trusted-host custody for the fresh continuation. Importing is inert. */
import { createHash } from "node:crypto"
import { constants, openSync, closeSync, fstatSync, readSync, lstatSync, realpathSync, readdirSync, type Stats } from "node:fs"
import { resolve, join, relative } from "node:path"
import { labRoot, freezeLabValue, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, LEAN_BASELINE_CONTINUATION_WINDOW as WINDOW, LEAN_BASELINE_CONTINUATION_PATHS, leanBytesRoot, leanCanonicalBytes, validateLeanBaselineContinuationAllocation, type LeanBaselineContinuationAllocation, type LeanBaselineContinuationCarry } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_BASELINE_CONTINUATION_PATHS_V2, LEAN_BASELINE_CONTINUATION_POLICY_V2, validateLeanBaselineContinuationAllocationV2, leanBaselineContinuationElapsedFloorV2, type LeanBaselineContinuationAllocationV2, type LeanBaselineContinuationCarryV2 } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { exactLabKeys } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_PRIVATE_MATCH_CARRY_V3, LEAN_PRIVATE_MATCH_CARRY_V2, LEAN_PRIVATE_MATCH_ARTIFACT_V3, LEAN_PRIVATE_PROBE_COST_ROOT, validateLeanPrivateMatchAllocationV3, validateLeanPrivateMatchAllocationV2, validateLeanPrivateMatchAllocationV1, authenticateLeanPrivateMatchProbeCarryV1 } from "./v1-38-lean-experiment-authority.js"

export { LEAN_BASELINE_CONTINUATION_PATHS }
export const LEAN_CONTINUATION_PRIVATE_COST_MODE = 0o600
const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_CONTINUATION_${code}`) }
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const equal = (a: unknown, b: unknown) => Buffer.from(leanCanonicalBytes(a)).equals(Buffer.from(leanCanonicalBytes(b)))
export type LeanContinuationGit = (args: readonly string[]) => Buffer
/** Bounded descriptor reads reserve before allocation; no real caller can opt out. */
export const readLeanContinuationBoundedBytesV2 = (name: string, maximum: number, mode: number, guard: (additionalBytes?: number) => void): Buffer => {
  if (!integer(maximum) || maximum > 4194304 || /preimage|secret|sealed/iu.test(name) || typeof guard !== "function") return fail("V2_READ_SCOPE")
  guard()
  const path = resolve(name), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.uid !== process.getuid?.() || realpathSync(path) !== path || (stat.mode & 0o777) !== mode || stat.size > maximum || !integer(stat.size)) return fail("V2_FILE")
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
export const assertLeanBaselineContinuationFrontierV2 = (allocation: LeanBaselineContinuationAllocationV2, s: LeanContinuationFrontier): number => {
  const a = validateLeanBaselineContinuationAllocationV2(allocation), w = a.window
  const required = ["nowMs", "monotonicElapsedMs", "remainingSlots", "charged", "retainedBytes", "scratchBytes", "parentRssBytes", "childRssBytes", "arrayBuffersBytes", "availableMemoryBytes", "freeBytes", "live"]
  const keys = Object.keys(s), optional = keys.includes("remainingClosureMs") || keys.includes("remainingOfflineMs")
  if (!exactLabKeys(s, optional ? [...required, "remainingClosureMs", "remainingOfflineMs"] : required) || keys.some(key => key !== "live" && !integer((s as any)[key])) || s.live !== true || s.remainingSlots > 36 || s.charged < 50 || s.charged > 86 || s.remainingSlots !== 0 && (s.charged + s.remainingSlots < 86 || s.charged + s.remainingSlots > 87) || optional && s.remainingSlots !== 0 || (s.remainingClosureMs ?? w.closureMs) > w.closureMs || (s.remainingOfflineMs ?? w.offlineOverheadMs) > w.offlineOverheadMs) return fail("V2_FRONTIER")
  const elapsed = leanBaselineContinuationElapsedFloorV2(w, s.nowMs, a.predecessor.elapsedUpperBoundMs, s.monotonicElapsedMs)
  const reserve = s.remainingSlots * LEAN_CAPS.matchMs + (s.remainingClosureMs ?? w.closureMs) + (s.remainingOfflineMs ?? w.offlineOverheadMs), native = 2 * 268435456 + 512000000 + 335544320
  if (!integer(s.nowMs + reserve) || !integer(elapsed + reserve) || s.nowMs + reserve > w.deadlineMs || elapsed + reserve > w.capMs || s.retainedBytes < a.predecessor.allocatedDiskBytes || s.retainedBytes > LEAN_CAPS.retainedBytes || s.scratchBytes > LEAN_CAPS.scratchBytes || s.retainedBytes + s.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || s.parentRssBytes + s.childRssBytes + s.arrayBuffersBytes + native > LEAN_BASELINE_CONTINUATION_POLICY_V2.memoryBytes || s.availableMemoryBytes < native || s.freeBytes < LEAN_CAPS.totalBytes - s.retainedBytes) return fail("V2_CAPACITY")
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
export const authenticateLeanContinuationPinnedSource = (row: { path: string; root: string }, head: string, pinnedPaths: readonly string[], git: LeanContinuationGit, guard: () => void): void => {
  const name = row.path
  if (!/^sha256:[a-f0-9]{64}$/u.test(row.root) || !/^[a-f0-9]{40}$/u.test(head) || !pinnedPaths.includes(name) || name.startsWith("/") || name.split("/").some(p => !p || p === "." || p === "..") || !/^[A-Za-z0-9_./-]+$/u.test(name) || /preimage|secret/iu.test(name)) return fail("SOURCE_SCOPE")
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
export const createLeanContinuationIdentityGuard = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRow[]): (() => void) => {
  const predicates = new Map<string, { pins: Pick<Stats, "dev" | "ino" | "size" | "mtimeMs" | "ctimeMs">[]; survivors: LeanContinuationInventoryRow[] }>()
  const at = (path: string) => { const absolute = resolve(path); let row = predicates.get(absolute); if (!row) { row = { pins: [], survivors: [] }; predicates.set(absolute, row) }; return row }
  for (const { path, stat } of pins) at(path).pins.push({ dev: stat.dev, ino: stat.ino, size: stat.size, mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs })
  for (const row of survivors) at(row.path).survivors.push({ ...row })
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
const futurePathsV2: readonly string[] = [LEAN_BASELINE_CONTINUATION_PATHS_V2.request, LEAN_BASELINE_CONTINUATION_PATHS_V2.allocation, LEAN_BASELINE_CONTINUATION_PATHS_V2.store, LEAN_BASELINE_CONTINUATION_PATHS_V2.temp, LEAN_BASELINE_CONTINUATION_PATHS_V2.window]
const futureV2 = (path: string) => futurePathsV2.some(p => path === p || path.startsWith(`${p}/`))
const sameIdentityV2 = (old: LeanContinuationInventoryRow, row: LeanContinuationInventoryRow) => ["path", "kind", "bytes", "allocatedBytes", "dev", "ino", "mode", "mtimeMs", "ctimeMs"].every(key => old[key as keyof LeanContinuationInventoryRow] === row[key as keyof LeanContinuationInventoryRow])
/** Exact reviewed bytes may transition before freeze. Consumed evidence cannot. */
export const reconcileLeanContinuationInventoryV2 = (prior: readonly LeanContinuationInventoryRow[], current: readonly LeanContinuationInventoryRowV2[], reviewed: readonly LeanContinuationReviewedRowV2[]): void => {
  const live = new Map(current.map(row => [row.path, row])), transitions = new Map(reviewed.map(row => [row.path, row]))
  if (prior.length > 4096 || current.length > 4096 || reviewed.length > 1024 || new Set(prior.map(row => row.path)).size !== prior.length || live.size !== current.length || transitions.size !== reviewed.length || current.some(row => futureV2(row.path)) || reviewed.some(row => !["reviewed_source", "active_planning"].includes(row.kind) || !/^[a-f0-9]{40}$/u.test(row.commit) || !/^sha256:[a-f0-9]{64}$/u.test(row.root) || row.path.startsWith(".strategy-lab/") || row.path.startsWith(".planning/artifacts/"))) return fail("V2_TRANSITION_SCOPE")
  for (const old of prior) {
    const row = live.get(old.path), transition = transitions.get(old.path)
    if (!row || row.allocatedBytes < old.allocatedBytes || row.mode !== old.mode || row.kind !== old.kind) return fail("V2_SURVIVOR_SHRINK")
    if (transition) { if (row.kind !== "file" || row.rawRoot !== transition.root) return fail("V2_UNREVIEWED_BYTES"); continue }
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
export const inventoryLeanContinuationSurvivorsV2 = (prior: readonly LeanContinuationInventoryRow[], reviewed: readonly LeanContinuationReviewedRowV2[], git: LeanContinuationGit, guard: (additionalBytes?: number) => void): readonly LeanContinuationInventoryRowV2[] => {
  const old = new Map(prior.map(row => [row.path, row])), review = new Map(reviewed.map(row => [row.path, row])), names = new Set([...old.keys(), ...review.keys()])
  if (old.size !== prior.length || review.size !== reviewed.length || prior.length > 4096 || reviewed.length > 1024) return fail("V2_INVENTORY_BOUND")
  for (const dir of [".strategy-lab", ".planning/artifacts"]) {
    const members = readdirSync(resolve(dir)); if (members.length > 4096) return fail("V2_INVENTORY_BOUND")
    for (const name of members) if (dir === ".strategy-lab" ? /^(?:lean-|v1[.-]38|sealed-|holdout)/u.test(name) : /^v1\.38-/u.test(name)) names.add(`${dir}/${name}`)
  }
  const rows: LeanContinuationInventoryRowV2[] = [], seen = new Set<string>(), inodes = new Set<string>()
  const visit = (name: string, depth: number): void => {
    if (futureV2(name) || seen.has(name)) return
    if (depth > 16 || rows.length >= 4096 || name.startsWith("/") || name.split("/").some(p => !p || p === "." || p === "..")) return fail("V2_INVENTORY_SCOPE")
    guard(); const path = resolve(name), s = lstatSync(path), inode = `${s.dev}:${s.ino}`
    if (s.isSymbolicLink() || s.uid !== process.getuid?.() || realpathSync(path) !== path || !s.isFile() && !s.isDirectory() || s.isFile() && s.nlink !== 1 || inodes.has(inode) || !integer(s.blocks * 512)) return fail("V2_INVENTORY_ALIAS")
    seen.add(name); inodes.add(inode)
    const priorRow = old.get(name), reviewedRow = review.get(name), sealed = /preimage|secret|sealed|holdout/iu.test(name)
    let rawRoot = priorRow?.rawRoot ?? null
    if (reviewedRow) {
      if (!s.isFile() || sealed || (s.mode & 0o777) !== 0o644) return fail("V2_REVIEWED_FILE")
      guard(65536); authenticateLeanContinuationPinnedSource(reviewedRow, reviewedRow.commit, [...review.keys()], git, guard)
      rawRoot = s.size > 4194304 ? reviewedRow.root : leanBytesRoot(readLeanContinuationBoundedBytesV2(name, 4194304, 0o644, guard))
      if (rawRoot !== reviewedRow.root) return fail("V2_UNREVIEWED_BYTES")
    }
    const members = s.isDirectory() ? readdirSync(path).sort() : undefined
    if (members && (members.length > 4096 || members.some(n => n.includes("/") || n === "." || n === ".."))) return fail("V2_DIRECTORY_BOUND")
    const row: LeanContinuationInventoryRowV2 = { path: name, kind: s.isDirectory() ? "directory" : sealed ? "sealed_metadata" : "file", bytes: s.size, allocatedBytes: s.blocks * 512, dev: s.dev, ino: s.ino, mode: s.mode & 0o777, mtimeMs: s.mtimeMs, ctimeMs: s.ctimeMs, rawRoot, ...(members ? { members } : {}) }
    rows.push(row)
    if (members) for (const child of members) visit(`${name}/${child}`, depth + 1)
    guard(); const after = lstatSync(path)
    if (after.dev !== s.dev || after.ino !== s.ino || after.size !== s.size || after.blocks !== s.blocks || after.mtimeMs !== s.mtimeMs || after.ctimeMs !== s.ctimeMs) return fail("V2_INVENTORY_CHANGED")
  }
  for (const name of [...names].sort()) visit(name, 0)
  rows.sort((a, b) => a.path.localeCompare(b.path)); reconcileLeanContinuationInventoryV2(prior, rows, reviewed)
  guard(); return freezeLabValue(rows)
}
export const createLeanContinuationIdentityGuardV2 = (pins: readonly { path: string; stat: Stats }[], survivors: readonly LeanContinuationInventoryRowV2[]): (() => void) => {
  const base = createLeanContinuationIdentityGuard(pins, survivors)
  return () => {
    base()
    for (const row of survivors) {
      const path = resolve(row.path), s = lstatSync(path)
      if (s.uid !== process.getuid?.() || realpathSync(path) !== path || (s.mode & 0o777) !== row.mode || row.members && !equal(readdirSync(path).sort(), row.members)) return fail("V2_IDENTITY_CHANGED")
    }
  }
}

export const LEAN_CONTINUATION_CLOSED_COST_V2 = Object.freeze({ sourceHead: "16db0fa0610e1a2378be8594b191d61f2f3c3baa", allocationCommit: "f6ff7ec36de7387feab7e4b4ad3695db480a4c1f", allocationBytesRoot: "sha256:3ea8c18d1a8a5b7816ed44f10572d4469870e75dcee8c7223895809830cd2c87", resultBytesRoot: "sha256:79ad5c21114afcec3b420b2f452db20cc29b2ca769c8ade317a343187b792796", checkBytesRoot: "sha256:64015d7c5e2c0ced02e0fa09f7c10f2cd7534a3f42b7f046af2a65d7bef17286", checkRoot: "sha256:e1711e16eafd3ded5d69988fe7617208fa7fcdc62b9681d45910ef2825f88838" })
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
export const authenticateLeanBaselineContinuationCarryV2 = (git: LeanContinuationGit, pinnedPaths: readonly LeanContinuationReviewedRowV2[], guard: (additionalBytes?: number) => void) => {
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
  const inventory = inventoryLeanContinuationSurvivorsV2(carry.inventory as LeanContinuationInventoryRow[], pinnedPaths, git, guard)
  const originalSum = (carry.inventory as LeanContinuationInventoryRow[]).reduce((n, row) => n + row.allocatedBytes, 0), residualDiskBytes = a.predecessor.allocatedDiskBytes - originalSum
  if (!integer(residualDiskBytes)) return fail("V2_RESIDUAL")
  // Consumed-v2 is already in current inventory. Preserve larger authenticated
  // debit as residual, rather than adding that store a second time.
  const debit = reconcileLeanContinuationV2DiskDebit(a.predecessor.allocatedDiskBytes, carry.inventory as LeanContinuationInventoryRow[], closed.allocatedDiskBytes, inventory)
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
) => {
  const consumed = (path: string) => [LEAN_BASELINE_CONTINUATION_PATHS.request, LEAN_BASELINE_CONTINUATION_PATHS.allocation, LEAN_BASELINE_CONTINUATION_PATHS.store, LEAN_BASELINE_CONTINUATION_PATHS.temp].some(root => path === root || (root === LEAN_BASELINE_CONTINUATION_PATHS.store || root === LEAN_BASELINE_CONTINUATION_PATHS.temp) && path.startsWith(`${root}/`))
  if (!integer(originalDebit) || !integer(closedDebit) || original.length > 4096 || current.length > 4096 || new Set(original.map(r => r.path)).size !== original.length || new Set(current.map(r => r.path)).size !== current.length || [...original, ...current].some(r => !r.path || r.path.startsWith("/") || r.path.split("/").some(x => !x || x === "." || x === "..") || !integer(r.allocatedBytes)) || original.some(r => consumed(r.path)) || current.some(r => futureV2(r.path))) return fail("V2_DISK_SCOPE")
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
