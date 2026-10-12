/** Bounded trusted-host custody for the fresh continuation. Importing is inert. */
import { createHash } from "node:crypto"
import { constants, openSync, closeSync, fstatSync, readSync, lstatSync, realpathSync, readdirSync } from "node:fs"
import { resolve, join, relative } from "node:path"
import { labRoot, freezeLabValue, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_CAPS, LEAN_BASELINE_CONTINUATION_WINDOW as WINDOW, LEAN_BASELINE_CONTINUATION_PATHS, leanBytesRoot, leanCanonicalBytes, validateLeanBaselineContinuationAllocation, type LeanBaselineContinuationAllocation, type LeanBaselineContinuationCarry } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { LEAN_PRIVATE_MATCH_CARRY_V3, LEAN_PRIVATE_MATCH_CARRY_V2, LEAN_PRIVATE_MATCH_ARTIFACT_V3, LEAN_PRIVATE_PROBE_COST_ROOT, validateLeanPrivateMatchAllocationV3, validateLeanPrivateMatchAllocationV2, validateLeanPrivateMatchAllocationV1, authenticateLeanPrivateMatchProbeCarryV1 } from "./v1-38-lean-experiment-authority.js"

export { LEAN_BASELINE_CONTINUATION_PATHS }
const fail = (code: string): never => { throw new TypeError(`LEAN_BASELINE_CONTINUATION_${code}`) }
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0
const equal = (a: unknown, b: unknown) => Buffer.from(leanCanonicalBytes(a)).equals(Buffer.from(leanCanonicalBytes(b)))
export type LeanContinuationGit = (args: readonly string[]) => Buffer
export const assertLeanContinuationDirectParent = (commit: string, sourceHead: string, parents: readonly string[], canonical: Uint8Array, committed: Uint8Array): void => {
  if (!/^[a-f0-9]{40}$/u.test(commit) || !/^[a-f0-9]{40}$/u.test(sourceHead) || !equal(parents, [commit, sourceHead]) || !Buffer.from(canonical).equals(Buffer.from(committed))) return fail("DIRECT_PARENT")
}
export interface LeanContinuationFrontier {
  nowMs: number; monotonicElapsedMs: number; remainingSlots: number; charged: number; retainedBytes: number; scratchBytes: number
  parentRssBytes: number; childRssBytes: number; arrayBuffersBytes: number; availableMemoryBytes: number; freeBytes: number; live: boolean
}
/** Real callers obtain observations in the same process immediately before each
 * use. This pure predicate never turns a serialized capacity into authority. */
export const assertLeanBaselineContinuationFrontier = (allocation: LeanBaselineContinuationAllocation, s: LeanContinuationFrontier): number => {
  const a = validateLeanBaselineContinuationAllocation(allocation)
  if (Object.entries(s).some(([key, value]) => key !== "live" && !integer(value)) || !s.live || s.nowMs < WINDOW.anchorMs || s.remainingSlots > 36 || s.charged < 43 || s.charged > 79 || s.remainingSlots !== 0 && (s.charged + s.remainingSlots < 79 || s.charged + s.remainingSlots > 80)) return fail("FRONTIER")
  const elapsed = WINDOW.carryMs + Math.max(s.nowMs - WINDOW.anchorMs, s.monotonicElapsedMs)
  const reserve = s.remainingSlots * LEAN_CAPS.matchMs + WINDOW.reserveMs + a.offlineOverheadMs
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
export const readLeanContinuationJson = (name: string, maximum = 8388608, mode?: number): Record<string, any> => {
  const bytes = readLeanContinuationBytes(name, maximum, mode), value = JSON.parse(bytes.toString("utf8")) as Record<string, any>
  if (!bytes.equals(Buffer.from(leanCanonicalBytes(value)))) return fail("CANONICAL")
  return value
}
export interface LeanContinuationInventoryRow { path: string; kind: "file" | "directory" | "sealed_metadata"; bytes: number; allocatedBytes: number; dev: number; ino: number; mode: number; mtimeMs: number; ctimeMs: number; rawRoot: LabRoot | null }
/** Explicit experiment scope. Enumerate names/stats, stream ordinary content,
 * and never open/hash/decode anything within a sealed or preimage subtree. */
export const inventoryLeanContinuationSurvivors = (pinnedPaths: readonly string[], guard: () => void): readonly LeanContinuationInventoryRow[] => {
  if (pinnedPaths.length > 1024 || new Set(pinnedPaths).size !== pinnedPaths.length || pinnedPaths.some(p => !/^(?:scripts|packages|\.planning)\/[A-Za-z0-9_./-]+$/u.test(p) || p.split("/").includes("..") || /preimage|secret/iu.test(p))) return fail("INVENTORY_SCOPE")
  const names = new Set(pinnedPaths)
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
    if (s.isSymbolicLink() || realpathSync(path) !== path || !s.isFile() && !s.isDirectory() || s.isFile() && s.nlink !== 1 || seenInodes.has(inode)) return fail("INVENTORY_ALIAS")
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
  const parse = (name: Exclude<typeof privateNames[number], "replay-0.ndjson">) => JSON.parse(values.get(name)!.toString("utf8")) as Record<string, any>
  const result = parse("result.json"), entry = parse("entry.json"), pair = parse("pair-0.json"), debit = parse("debit-0.json"), terminal = parse("terminal-0.json")
  for (const [value, kind] of [[result, "result"], [entry, "entry"], [pair, "pair"], [debit, "debit"], [terminal, "terminal"]] as const) { rooted(value, `lean-private-match-${kind}-v3`); if (value.allocationRoot !== a.root) return fail("CUSTODY_ALLOCATION") }
  const commit = result.allocationCommit
  if (typeof commit !== "string" || !/^[a-f0-9]{40}$/u.test(commit) || entry.allocationCommit !== commit || result.sourceHead !== a.sourceHead || entry.sourceHead !== a.sourceHead || entry.allocationDigest !== leanBytesRoot(bytes) || result.cumulativeCharged !== 43 || debit.cumulativeCharged !== 43 || debit.ordinal !== 0 || !equal(result.attemptedOrdinals, [0]) || !equal(result.unattemptedOrdinals, []) || debit.pairRoot !== pair.root || terminal.debitRoot !== debit.root || pair.slotRoot !== a.slots[0].root || terminal.slotRoot !== pair.slotRoot || result.terminals?.length !== 1 || result.terminals[0].root !== terminal.root || result.terminals[0].rawRoot !== leanBytesRoot(values.get("terminal-0.json")!) || !values.get("ledger.ndjson")!.equals(Buffer.concat([leanCanonicalBytes(debit), Buffer.from("\n")]))) return fail("CUSTODY_JOIN")
  const parents = git(["rev-list", "--parents", "-n", "1", commit]).toString("utf8").trim().split(/\s+/u)
  assertLeanContinuationDirectParent(commit, a.sourceHead, parents, bytes, git(["show", `${commit}:${LEAN_PRIVATE_MATCH_ARTIFACT_V3}`]))
  // The 42-charge and 41-charge inventories are authenticated by their frozen
  // roots, without loading replay or historical source trees into memory.
  const predecessors = [
    { carry: LEAN_PRIVATE_MATCH_CARRY_V3, version: 2, validate: validateLeanPrivateMatchAllocationV2, inventoryDomain: "lean-private-match-spent-inventory-v3", reader: "265-16-ONE-MATCH-DIAGNOSTIC-RETAINED-VERIFICATION-v2.md" },
    { carry: LEAN_PRIVATE_MATCH_CARRY_V2, version: 1, validate: validateLeanPrivateMatchAllocationV1, inventoryDomain: "lean-private-match-spent-inventory-v2", reader: "265-16-TWO-MATCH-RETAINED-VERIFICATION-v1.md" },
  ] as const
  const inventory = inventoryLeanContinuationSurvivors(pinnedPaths, guard), byPath = new Map(inventory.map(row => [row.path, row]))
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
  const costPath = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-PAIR-CLOSURE-v1.json"
  const costBytes = readLeanContinuationBytes(costPath, 262144, 0o644), cost = JSON.parse(costBytes.toString("utf8")) as Record<string, any>
  rooted(cost, "lean-resource-window-pair-closure-v15")
  if (leanBytesRoot(costBytes) !== "sha256:efe0acbd35beb37c47877cd843e695b4ed0d94b781e66c07464238f152bc45b4" || cost.root !== LEAN_PRIVATE_PROBE_COST_ROOT || cost.cumulativeCharged !== 40 || cost.survivors?.length !== 1077 || cost.survivors.some((row: { identity: string }) => !byPath.has(row.identity))) return fail("OLD_COST")
  if (!equal(a.priorProbeCarry, authenticateLeanPrivateMatchProbeCarryV1())) return fail("PROBE_COST")
  const replay = byPath.get(`${store}/replay-0.ndjson`)
  if (!replay?.rawRoot || terminal.evidence?.streamRawRoot !== replay.rawRoot || terminal.evidence?.streamBytes !== replay.bytes || result.terminals[0].streamRawRoot !== replay.rawRoot || result.terminals[0].streamBytes !== replay.bytes) return fail("REPLAY_CUSTODY")
  const custody = { allocationRoot: a.root, allocationDigest: leanBytesRoot(bytes), allocationCommit: commit, sourceHead: a.sourceHead, records: [...values].map(([name, b]) => ({ name, rawRoot: leanBytesRoot(b) })), replayRoot: replay.rawRoot, priorMatchCarryRoot: a.priorMatchCarry.root, priorProbeCarryRoot: a.priorProbeCarry.root, costSnapshotRoot: cost.root, resultRoot: result.root, terminalRoot: terminal.root }
  const allocatedDiskBytes = inventory.reduce((sum, row) => sum + row.allocatedBytes, 0)
  if (!integer(allocatedDiskBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("CARRY_CAPACITY")
  const body = { schemaVersion: "lean-baseline-continuation-carry-v1" as const, chargedMatches: 43 as const, elapsedUpperBoundMs: 415746903 as const, allocatedDiskBytes, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, custodyRoot: labRoot("lean-baseline-continuation-custody-v1", custody), inventoryRoot: labRoot("lean-baseline-continuation-inventory-v1", inventory), qualifiedReaderAuthority: "cost_only" as const }
  const carry: LeanBaselineContinuationCarry = freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
  guard(); return freezeLabValue({ carry, custody, inventory })
}
