import { authenticateLeanRetryBaselineAuthorityV8 } from "./v1-38-lean-baseline-retained.js"
import { isLeanRetryMode, leanRetryOrdinal, admitLeanAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
/** New compact-route capability; never a legacy full-league receipt. */
import { labRoot, freezeLabValue, LAB_ADMITTED_ROOTS, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { readLeanLedger, readLeanChildEntry, type LeanExperimentLedger, type LeanCharge } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import type { ProspectiveLeagueLifetimeProviderBinding } from "./v1-38-league-prospective-lifetime.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { readCandidateClosure, type FactoryCandidateClosure } from "../../packages/strategy-lab/src/league/connected-runner.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { defaultRuntimeMetadata, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { readLeanBaselineSource, validateLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { constants, openSync, closeSync, readFileSync, lstatSync, realpathSync, fstatSync, statfsSync, writeSync, fsyncSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { createHash } from "node:crypto"
import { assertLeanAggregateMemoryV15 } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanCanonicalBytes, leanBytesRoot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { validateLeanColdReuse, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { leanCapsForAllocation, leanSupervisorAllocationMode, LEAN_STARTUP_POLICY_V5, LEAN_RESOURCE_WINDOW_V15_STARTUP_ATTRIBUTION_POLICY, type LeanCorrectionAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanStartupWorkerHarnessV5, buildLeanStartupWorkerHarnessV8, readLeanPrivateProbeGitV1, readLeanPrivateMatchGitV1 } from "./v1-38-lean-container-match-session.js"

export interface LeanRuntimeAuthority { readonly schemaVersion: "lean-runtime-authority-v1"; readonly runtime: ProspectiveLeagueLifetimeProviderBinding["runtime"]; readonly seat: "bottom" | "top"; toJSON(): never }
const correctionAuthorities = new WeakSet<object>()
export const isLeanCorrectionRuntimeAuthority = (value: unknown): value is LeanRuntimeAuthority => typeof value === "object" && value !== null && correctionAuthorities.has(value)
export interface LeanBaselinePair {
  readonly schemaVersion: "lean-baseline-pair-v1"; readonly ordinal: number; readonly slotRoot: LabRoot; readonly requestRoot: LabRoot
  readonly priorLedgerBytesRoot: LabRoot; readonly priorLedgerByteLength: number; readonly priorCharged: number
  readonly bottomRole: string; readonly bottomSourceRoot: LabRoot; readonly bottomSnapshotRoot: LabRoot
  readonly topRole: string; readonly topSourceRoot: LabRoot; readonly topSnapshotRoot: LabRoot; readonly root: LabRoot
}
type Layer = "factory" | "planner" | "session"

/** No-Match probe capability. It is deliberately disjoint from LeanRuntimeAuthority. */
export interface LeanPrivateProbeRuntimeAuthority { readonly schemaVersion: "lean-private-probe-runtime-authority-v1"; readonly binding: LeanPrivateProbeBindingV1; toJSON(): never }
export interface LeanPrivateProbeInvocationV1 {
  readonly ordinal: number; readonly caseId: string; readonly method: "selectActivations" | "soldierBrain"
  readonly sourceRoot: LabRoot; readonly executableRoot: LabRoot; readonly requestRoot: LabRoot; readonly inputRoot: LabRoot
  readonly image: string; readonly tupleId: string; readonly tupleRoot: LabRoot; readonly runtimeLimitsRoot: LabRoot
}
export interface LeanPrivateProbeBindingV1 extends LeanPrivateProbeInvocationV1 {
  readonly allocationRoot: LabRoot; readonly allocationDigest: LabRoot; readonly debitDigest: LabRoot; readonly debitOffset: number
  readonly executionOwnerId: string
}
export interface LeanPrivateProbeStartupGrantV1 {
  readonly schemaVersion: "lean-private-probe-startup-grant-v1"; readonly policyRoot: LabRoot; readonly harnessRoot: LabRoot; toJSON(): never
}
export interface LeanPrivateProbeAllocationV1 {
  readonly schemaVersion: "lean-private-probe-allocation-v1"; readonly sourceHead: string; readonly matchCount: 0
  readonly cases: readonly LeanPrivateProbeInvocationV1[]; readonly root: LabRoot
  readonly sourceRoot: LabRoot; readonly executableRoot: LabRoot; readonly image: string; readonly tupleId: string
  readonly tupleRoot: LabRoot; readonly runtimeLimitsRoot: LabRoot; readonly costSnapshotRoot: LabRoot
  readonly ceilings: Readonly<{ guestMs: 1000; hostMs: 5000; startupMs: 2500; matchMs: 600000 }>
}
export interface LeanPrivateProbeV1CarryV2 {
  readonly allocationRoot: LabRoot; readonly allocationDigest: LabRoot; readonly allocationCommit: string; readonly sourceHead: string
  readonly resultRoot: LabRoot; readonly resultDigest: LabRoot; readonly debitDigest: LabRoot; readonly debitOffset: 0
  readonly debitBytes: 436; readonly retainedAllocatedBytes: 32768; readonly ordinal: 0; readonly caseId: "case-0"
  readonly method: "selectActivations"; readonly inputRoot: LabRoot; readonly requestRoot: LabRoot; readonly root: LabRoot
}
export interface LeanPrivateProbeAllocationV2 extends Omit<LeanPrivateProbeAllocationV1, "schemaVersion" | "cases" | "root"> {
  readonly schemaVersion: "lean-private-probe-allocation-v2"; readonly cases: readonly [LeanPrivateProbeInvocationV1]
  readonly priorV1Carry: LeanPrivateProbeV1CarryV2; readonly windowRoot: LabRoot; readonly root: LabRoot
}
export interface LeanPrivateProbeCapacityReceiptV1 { readonly schemaVersion: "lean-private-probe-capacity-v1"; toJSON(): never }
export interface LeanPrivateProbeAdmissionV1 { readonly schemaVersion: "lean-private-probe-admission-v1"; toJSON(): never }
type PrivateProbeAdmissionState = { allocation: LeanPrivateProbeAllocationV1 | LeanPrivateProbeAllocationV2; allocationBytes: Buffer; allocationCommit: string; allocationPath: string; storePath: string; priorRetainedBytes: number; nextOrdinal: number; used: boolean }
type PrivateProbeCapabilityState = { binding: LeanPrivateProbeBindingV1; claims: Set<Layer>; startupGrant: LeanPrivateProbeStartupGrantV1 }
const privateProbeAdmissions = new WeakMap<object, PrivateProbeAdmissionState>()
const privateProbeCapacities = new WeakMap<object, { startedAt: number; storePath: string; priorRetainedBytes: number; allocationRoot?: LabRoot; windowRoot?: LabRoot }>()
const privateProbeAuthorities = new WeakMap<object, PrivateProbeCapabilityState>()
const privateProbeStartupGrants = new WeakMap<object, { binding: LeanPrivateProbeBindingV1; claims: Set<Layer> }>()
const opaque = (): never => { throw new TypeError("LEAN_PRIVATE_PROBE_AUTHORITY") }
const privateProbeFail = (): never => { throw new TypeError("LEAN_PRIVATE_PROBE_AUTHORITY") }
export const LEAN_PRIVATE_PROBE_COST_ROOT = "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381" as LabRoot
const privateProbeWindowV2Body = { schemaVersion: "lean-private-probe-window-v2", anchorMs: 1791667800000, carryMs: 319858903, capMs: 323458903, deadlineMs: 1791671400000, reserveMs: 1860000, sourceAllocatedBytes: 1183744 }
export const LEAN_PRIVATE_PROBE_WINDOW_V2 = freezeLabValue({ ...privateProbeWindowV2Body, root: labRoot("lean-private-probe-window-v2", privateProbeWindowV2Body) })
const privateProbeV1CarryStore = ".strategy-lab/lean-private-probe-v1/17ea1073af11097956b919cbe4e5fc06faef624d815a093413bb222505ea7dd7"
const privateProbeV1Artifact = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json"
const privateProbeV1Commit = "dd67460e6628aebff6bc35c253adaa2cdfea284e"
const privateProbeV1Hashes = Object.freeze({ allocation: "70cfd1476ab3ead999c126235b8b2e7518193e887d75477e1e4132f918f3b565", entry: "9a7eca48abebb6369c2b047b33c8ea4c8eb3a0091e3a3d226b93e26aa9028c25", ledger: "4b21d070d9f351eb6b8b531d7a0f1eb00197a296ff8632f59380d2c5e1d8c27a", probe: "4dac2e8ad6d5f87f64171f6f18e14428db78c1eb5af8c0db510b027e4f6bfc49", request: "9f937071d774eb788a6fa0629c11b5bb4b084267766bcb5d89f928e9ee241955", result: "52755f198838ce8b1e99b8d9dbf5fdbb10c759b8051583f8d3d778238c6cc9ee", terminal: "cf85c582d0cb9eb94de950e232bc06ee65a9cd32958f7d97b8d7eee1aad8d842" })
export const authenticateLeanPrivateProbeV1CarryV2 = (): LeanPrivateProbeV1CarryV2 => {
  const rootPath = resolve(privateProbeV1CarryStore), directory = lstatSync(rootPath)
  if (!directory.isDirectory() || directory.isSymbolicLink() || (directory.mode & 0o777) !== 0o700 || realpathSync(rootPath) !== rootPath) return privateProbeFail()
  const names = ["allocation.json", "entry.json", "ledger.ndjson", "probe-00.json", "request.json", "result.json", "terminal.json"]
  const inventory = readdirSync(rootPath).sort()
  if (inventory.length !== names.length || inventory.some((name, index) => name !== names[index])) return privateProbeFail()
  const hashes: Record<string, string> = {}
  let allocatedBytes = directory.blocks * 512
  for (const name of names) {
    const bytes = privateProbeFile(resolve(rootPath, name), 65_536, 0o600), stat = lstatSync(resolve(rootPath, name))
    hashes[name] = createHash("sha256").update(bytes).digest("hex")
    allocatedBytes += stat.blocks * 512
  }
  if (hashes["allocation.json"] !== privateProbeV1Hashes.allocation || hashes["entry.json"] !== privateProbeV1Hashes.entry || hashes["ledger.ndjson"] !== privateProbeV1Hashes.ledger || hashes["probe-00.json"] !== privateProbeV1Hashes.probe || hashes["request.json"] !== privateProbeV1Hashes.request || hashes["result.json"] !== privateProbeV1Hashes.result || hashes["terminal.json"] !== privateProbeV1Hashes.terminal) return privateProbeFail()
  const allocationBytes = privateProbeFile(resolve(rootPath, "allocation.json"), 65_536, 0o600), allocation = JSON.parse(allocationBytes.toString("utf8")) as Record<string, unknown>, { root: allocationRoot, ...allocationBody } = allocation
  if (allocationRoot !== "sha256:17ea1073af11097956b919cbe4e5fc06faef624d815a093413bb222505ea7dd7" || allocationRoot !== labRoot("lean-private-probe-allocation-v1", allocationBody) || !allocationBytes.equals(canonicalPrivateProbe(allocation)) || allocation.sourceHead !== "8bed800f753235deaea1956d1166080973c9bba0" || allocation.matchCount !== 0 || !Array.isArray(allocation.cases) || allocation.cases.length !== 4) return privateProbeFail()
  const resultBytes = privateProbeFile(resolve(rootPath, "result.json"), 65_536, 0o600), result = JSON.parse(resultBytes.toString("utf8")) as Record<string, unknown>, { root: resultRoot, ...resultBody } = result
  if (resultRoot !== "sha256:90b01860ac40b716854ebf082586793150abf59f8dc7fea161b44f9636353ab4" || resultRoot !== labRoot("lean-private-probe-result-v1", resultBody) || result.allocationRoot !== allocationRoot || result.sourceHead !== allocation.sourceHead || result.matchCount !== 0 || JSON.stringify(result.attemptedOrdinals) !== "[0]" || !Array.isArray(result.outcomes) || result.outcomes.length !== 1 || (result.outcomes[0] as Record<string, unknown>).status !== "system_failure") return privateProbeFail()
  const ledgerBytes = privateProbeFile(resolve(rootPath, "ledger.ndjson"), 65_536, 0o600), ledgerRows = ledgerBytes.toString("utf8").trimEnd().split("\n")
  if (ledgerRows.length !== 1 || !ledgerBytes.equals(Buffer.concat([canonicalPrivateProbe(JSON.parse(ledgerRows[0]!) as unknown), Buffer.from("\n")])) || !exactLabKeys(JSON.parse(ledgerRows[0]!) as unknown, ["schemaVersion", "allocationRoot", "allocationDigest", "ordinal", "caseId", "requestRoot", "inputRoot"])) return privateProbeFail()
  const debit = JSON.parse(ledgerRows[0]!) as Record<string, unknown>
  if (debit.schemaVersion !== "lean-private-probe-debit-v1" || debit.allocationRoot !== allocationRoot || debit.allocationDigest !== `sha256:${privateProbeV1Hashes.allocation}` || debit.ordinal !== 0 || debit.caseId !== "case-0" || debit.requestRoot !== (allocation.cases[0] as Record<string, unknown>).requestRoot || debit.inputRoot !== (allocation.cases[0] as Record<string, unknown>).inputRoot) return privateProbeFail()
  const committed = readLeanPrivateProbeGitV1(["show", `${privateProbeV1Commit}:${privateProbeV1Artifact}`]), parents = readLeanPrivateProbeGitV1(["rev-list", "--parents", "-n", "1", privateProbeV1Commit]).toString("utf8").trim().split(/\s+/u)
  const artifact = privateProbeFile(resolve(privateProbeV1Artifact), 65_536, 0o644); allocatedBytes += lstatSync(resolve(privateProbeV1Artifact)).blocks * 512
  if (parents.length !== 2 || parents[1] !== allocation.sourceHead || !Buffer.from(committed).equals(allocationBytes) || !artifact.equals(allocationBytes) || allocatedBytes !== 32768) return privateProbeFail()
  const firstCase = allocation.cases[0] as Record<string, unknown>
  if (firstCase.ordinal !== 0 || firstCase.caseId !== "case-0" || firstCase.method !== "selectActivations" || firstCase.inputRoot !== debit.inputRoot || firstCase.requestRoot !== debit.requestRoot) return privateProbeFail()
  const body = { allocationRoot: allocationRoot as LabRoot, allocationDigest: `sha256:${privateProbeV1Hashes.allocation}` as LabRoot, allocationCommit: privateProbeV1Commit, sourceHead: allocation.sourceHead as string, resultRoot: resultRoot as LabRoot, resultDigest: `sha256:${privateProbeV1Hashes.result}` as LabRoot, debitDigest: leanBytesRoot(ledgerBytes), debitOffset: 0 as const, debitBytes: 436 as const, retainedAllocatedBytes: 32768 as const, ordinal: 0 as const, caseId: "case-0" as const, method: "selectActivations" as const, inputRoot: firstCase.inputRoot as LabRoot, requestRoot: firstCase.requestRoot as LabRoot }
  return freezeLabValue({ ...body, root: labRoot("lean-private-probe-v1-carry-v2", body) })
}
const privateProbeSnapshotPath = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-diagnostic-v15-5-PAIR-CLOSURE-v1.json"
let privateProbeSnapshot: Readonly<{ allocatedDiskBytes: number; cumulativeCharged: number; timeboxExtension: unknown }> | undefined
export const authenticateLeanPrivateProbeCostV1 = () => {
  if (privateProbeSnapshot) return privateProbeSnapshot
  const path = resolve(privateProbeSnapshotPath), file = lstatSync(path)
  if (!file.isFile() || file.isSymbolicLink() || file.size !== 144640) return privateProbeFail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  let bytes: Buffer
  try { const opened = fstatSync(fd); if (opened.ino !== file.ino || opened.dev !== file.dev || opened.size !== 144640) return privateProbeFail(); bytes = readFileSync(fd) } finally { closeSync(fd) }
  if (bytes.length !== 144640 || `sha256:${createHash("sha256").update(bytes).digest("hex")}` !== "sha256:efe0acbd35beb37c47877cd843e695b4ed0d94b781e66c07464238f152bc45b4") return privateProbeFail()
  const snapshot = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>, { root, ...body } = snapshot
  if (root !== LEAN_PRIVATE_PROBE_COST_ROOT || root !== labRoot("lean-resource-window-pair-closure-v15", body) || snapshot.cumulativeCharged !== 40 || snapshot.allocatedDiskBytes !== 29970432 || !Array.isArray(snapshot.survivors) || snapshot.survivors.length !== 1077 || snapshot.survivors.reduce((sum, row) => sum + Number(row.allocatedBytes), 0) > 29970432) return privateProbeFail()
  privateProbeSnapshot = freezeLabValue({ allocatedDiskBytes: 29970432, cumulativeCharged: 40, timeboxExtension: snapshot.timeboxExtension })
  return privateProbeSnapshot
}
export const observeLeanPrivateProbeResourcesV1 = (storePath: string, priorRetainedBytes = 0) => {
  const snapshot = authenticateLeanPrivateProbeCostV1(), wallAtMs = Date.now(), cumulativeElapsedMs = 292757903 + wallAtMs - 1791640699000
  if (!Number.isSafeInteger(priorRetainedBytes) || priorRetainedBytes < 0 || !Number.isSafeInteger(cumulativeElapsedMs) || cumulativeElapsedMs < 292757903 || cumulativeElapsedMs + 1860000 > 296357903 || wallAtMs + 1860000 > 1791644299000) return privateProbeFail()
  let path = resolve(storePath), fresh = false
  try { lstatSync(path) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; path = dirname(path); fresh = true }
  const directory = lstatSync(path)
  if (!directory.isDirectory() || directory.isSymbolicLink()) return privateProbeFail()
  const names = fresh ? [] : readdirSync(path)
  if (names.length > 10) return privateProbeFail()
  let newAllocatedBytes = fresh ? 4096 : directory.blocks * 512
  for (const name of names) { const file = lstatSync(resolve(path, name)); if (!file.isFile() || file.isSymbolicLink() || file.size > 65536) return privateProbeFail(); newAllocatedBytes += file.blocks * 512 }
  // Reserve all remaining bounded writes and the enforced 256MiB container
  // ceiling. This is an upper bound, not a claimed sampled guest RSS/peak.
  const retainedBytesUpperBound = snapshot.allocatedDiskBytes + priorRetainedBytes + newAllocatedBytes + 131072
  const parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024)
  const containerMemoryUpperBound = 268435456
  const aggregateMemoryUpperBound = assertLeanAggregateMemoryV15({ parentRssBytes, childRssBytes: containerMemoryUpperBound }, snapshot.timeboxExtension)
  const disk = statfsSync(path), availableDiskBytes = disk.bavail * disk.bsize
  if (!Number.isSafeInteger(retainedBytesUpperBound) || retainedBytesUpperBound > 12000000000 || retainedBytesUpperBound + 2000000000 > 15000000000 || !Number.isSafeInteger(availableDiskBytes) || availableDiskBytes < 2000000000 || process.memoryUsage().arrayBuffers > 2000000000) return privateProbeFail()
  return Object.freeze({ costSnapshotRoot: LEAN_PRIVATE_PROBE_COST_ROOT, historicalCharged: 40, historicalAllocatedBytes: snapshot.allocatedDiskBytes, wallAtMs, cumulativeElapsedMs, newAllocatedBytes, retainedBytesUpperBound, parentRssBytes, containerMemoryUpperBound, aggregateMemoryUpperBound, availableDiskBytes })
}
export const observeLeanPrivateProbeResourcesV2 = (storePath: string, value: unknown) => {
  const allocation = validatePrivateProbeAllocation(value)
  if (allocation.schemaVersion !== "lean-private-probe-allocation-v2" || allocation.windowRoot !== LEAN_PRIVATE_PROBE_WINDOW_V2.root) return privateProbeFail()
  const priorRetainedBytes = allocation.priorV1Carry.retainedAllocatedBytes, window = LEAN_PRIVATE_PROBE_WINDOW_V2
  const snapshot = authenticateLeanPrivateProbeCostV1(), wallAtMs = Date.now(), cumulativeElapsedMs = window.carryMs + wallAtMs - window.anchorMs
  if (!Number.isSafeInteger(priorRetainedBytes) || priorRetainedBytes < 0 || !Number.isSafeInteger(cumulativeElapsedMs) || cumulativeElapsedMs < window.carryMs || cumulativeElapsedMs + window.reserveMs > window.capMs || wallAtMs + window.reserveMs > window.deadlineMs) return privateProbeFail()
  let path = resolve(storePath), fresh = false
  try { lstatSync(path) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; path = dirname(path); fresh = true }
  const directory = lstatSync(path)
  if (!directory.isDirectory() || directory.isSymbolicLink()) return privateProbeFail()
  const names = fresh ? [] : readdirSync(path)
  if (names.length > 10) return privateProbeFail()
  let newAllocatedBytes = fresh ? 4096 : directory.blocks * 512
  for (const name of names) { const file = lstatSync(resolve(path, name)); if (!file.isFile() || file.isSymbolicLink() || file.size > 65536) return privateProbeFail(); newAllocatedBytes += file.blocks * 512 }
  // Reserve all remaining bounded writes and the enforced 256MiB container
  // ceiling. This is an upper bound, not a claimed sampled guest RSS/peak.
  const retainedBytesUpperBound = snapshot.allocatedDiskBytes + window.sourceAllocatedBytes + priorRetainedBytes + newAllocatedBytes + 131072
  const parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024)
  const containerMemoryUpperBound = 268435456
  const aggregateMemoryUpperBound = assertLeanAggregateMemoryV15({ parentRssBytes, childRssBytes: containerMemoryUpperBound }, snapshot.timeboxExtension)
  const disk = statfsSync(path), availableDiskBytes = disk.bavail * disk.bsize
  if (!Number.isSafeInteger(retainedBytesUpperBound) || retainedBytesUpperBound > 12000000000 || retainedBytesUpperBound + 2000000000 > 15000000000 || !Number.isSafeInteger(availableDiskBytes) || availableDiskBytes < 2000000000 || process.memoryUsage().arrayBuffers > 2000000000) return privateProbeFail()
  return Object.freeze({ windowRoot: window.root, sourceAllocatedBytes: window.sourceAllocatedBytes, priorRetainedBytes, costSnapshotRoot: LEAN_PRIVATE_PROBE_COST_ROOT, historicalCharged: 40, historicalAllocatedBytes: snapshot.allocatedDiskBytes, wallAtMs, cumulativeElapsedMs, newAllocatedBytes, retainedBytesUpperBound, parentRssBytes, containerMemoryUpperBound, aggregateMemoryUpperBound, availableDiskBytes })
}
const canonicalPrivateProbe = (value: unknown): Buffer => Buffer.from(leanCanonicalBytes(value))
const privateProbeFile = (path: string, maxBytes: number, expectedMode: number): Buffer => {
  const before = lstatSync(path)
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.uid !== (typeof process.getuid === "function" ? process.getuid() : before.uid) || (before.mode & 0o777) !== expectedMode || before.size > maxBytes || realpathSync(path) !== path) return privateProbeFail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.nlink !== 1 || opened.size !== before.size || (opened.mode & 0o777) !== expectedMode) return privateProbeFail()
    const bytes = readFileSync(fd)
    if (bytes.byteLength !== opened.size || bytes.byteLength > maxBytes) return privateProbeFail()
    return bytes
  } finally { closeSync(fd) }
}
const validatePrivateProbeAllocation = (value: unknown): LeanPrivateProbeAllocationV1 | LeanPrivateProbeAllocationV2 => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return privateProbeFail()
  const allocation = value as LeanPrivateProbeAllocationV1 | LeanPrivateProbeAllocationV2
  const v2 = allocation.schemaVersion === "lean-private-probe-allocation-v2"
  const allocationKeys = ["schemaVersion", "sourceHead", "matchCount", "cases", "root", "sourceRoot", "executableRoot", "image", "tupleId", "tupleRoot", "runtimeLimitsRoot", "costSnapshotRoot", "ceilings", ...(v2 ? ["priorV1Carry", "windowRoot"] : [])]
  if (v2 && allocation.windowRoot !== LEAN_PRIVATE_PROBE_WINDOW_V2.root) return privateProbeFail()
  const keys = ["schemaVersion", "sourceHead", "matchCount", "cases", "root", "sourceRoot", "executableRoot", "image", "tupleId", "tupleRoot", "runtimeLimitsRoot", "costSnapshotRoot", "ceilings"]
  const validCase = (candidate: unknown, ordinal: number): boolean => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) || !exactLabKeys(candidate, ["ordinal", "caseId", "method", "sourceRoot", "executableRoot", "requestRoot", "inputRoot", "image", "tupleId", "tupleRoot", "runtimeLimitsRoot"])) return false
    const item = candidate as unknown as LeanPrivateProbeInvocationV1
    return item.ordinal === ordinal && ["selectActivations", "soldierBrain"].includes(item.method) && typeof item.caseId === "string" && /^sha256:[a-f0-9]{64}$/.test(item.sourceRoot) && /^sha256:[a-f0-9]{64}$/.test(item.executableRoot) && /^sha256:[a-f0-9]{64}$/.test(item.requestRoot) && /^sha256:[a-f0-9]{64}$/.test(item.inputRoot) && item.image === LAB_ADMITTED_ROOTS.image && item.tupleId === MATCH_KERNEL.tupleId && item.tupleRoot === LAB_ADMITTED_ROOTS.tupleRoot && item.runtimeLimitsRoot === LAB_ADMITTED_ROOTS.runtimeLimitsRoot
  }
  if (!exactLabKeys(allocation, allocationKeys) || !Array.isArray(allocation.cases) || (v2 ? allocation.cases.length !== 1 || !exactLabKeys(allocation.priorV1Carry, ["allocationRoot", "allocationDigest", "allocationCommit", "sourceHead", "resultRoot", "resultDigest", "debitDigest", "debitOffset", "debitBytes", "retainedAllocatedBytes", "ordinal", "caseId", "method", "inputRoot", "requestRoot", "root"]) || canonicalPrivateProbe(allocation.priorV1Carry).compare(canonicalPrivateProbe(authenticateLeanPrivateProbeV1CarryV2())) !== 0 || allocation.sourceHead === allocation.priorV1Carry.sourceHead || allocation.cases[0]?.method !== allocation.priorV1Carry.method || allocation.cases[0]?.caseId !== allocation.priorV1Carry.caseId || allocation.cases[0]?.inputRoot !== allocation.priorV1Carry.inputRoot || allocation.cases[0]?.requestRoot !== allocation.priorV1Carry.requestRoot : allocation.schemaVersion !== "lean-private-probe-allocation-v1" || allocation.cases.length !== 4) || !/^[a-f0-9]{40,64}$/.test(allocation.sourceHead) || allocation.matchCount !== 0 || allocation.cases.some((item, ordinal) => !validCase(item, ordinal)) || !/^sha256:[a-f0-9]{64}$/.test(allocation.sourceRoot) || !/^sha256:[a-f0-9]{64}$/.test(allocation.executableRoot) || allocation.image !== LAB_ADMITTED_ROOTS.image || allocation.tupleId !== MATCH_KERNEL.tupleId || allocation.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || allocation.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || !/^sha256:[a-f0-9]{64}$/.test(allocation.costSnapshotRoot) || allocation.ceilings?.guestMs !== 1000 || allocation.ceilings.hostMs !== 5000 || allocation.ceilings.startupMs !== 2500 || allocation.ceilings.matchMs !== 600000) return privateProbeFail()
  if (!v2 && !exactLabKeys(allocation, keys)) return privateProbeFail()
  const { root, ...body } = allocation
  if (root !== labRoot(v2 ? "lean-private-probe-allocation-v2" : "lean-private-probe-allocation-v1", body) || allocation.cases.some(item => item.sourceRoot !== allocation.sourceRoot || item.executableRoot !== allocation.executableRoot || item.image !== allocation.image || item.tupleId !== allocation.tupleId || item.tupleRoot !== allocation.tupleRoot || item.runtimeLimitsRoot !== allocation.runtimeLimitsRoot) || v2 && allocation.cases[0]?.ordinal !== 0) return privateProbeFail()
  return freezeLabValue(structuredClone(allocation))
}

/** Sample process capacity in this process; receipts cannot be caller-constructed. */
export const observeLeanPrivateProbeCapacityV1 = (storePath: string, priorRetainedBytes = 0): LeanPrivateProbeCapacityReceiptV1 => {
  observeLeanPrivateProbeResourcesV1(storePath, priorRetainedBytes)
  const path = resolve(storePath), stat = statfsSync(path), memory = process.memoryUsage()
  if (memory.rss > 3_000_000_000 || stat.bavail * stat.bsize < 2_000_000_000) return privateProbeFail()
  const receipt = Object.freeze({ schemaVersion: "lean-private-probe-capacity-v1" as const, toJSON: opaque })
  privateProbeCapacities.set(receipt, { startedAt: performance.now(), storePath: path, priorRetainedBytes })
  return receipt
}
export const observeLeanPrivateProbeCapacityV2 = (storePath: string, value: unknown): LeanPrivateProbeCapacityReceiptV1 => {
  const allocation = validatePrivateProbeAllocation(value)
  if (allocation.schemaVersion !== "lean-private-probe-allocation-v2") return privateProbeFail()
  observeLeanPrivateProbeResourcesV2(storePath, allocation)
  const receipt = Object.freeze({ schemaVersion: "lean-private-probe-capacity-v1" as const, toJSON: opaque })
  privateProbeCapacities.set(receipt, { startedAt: performance.now(), storePath: resolve(storePath), priorRetainedBytes: allocation.priorV1Carry.retainedAllocatedBytes, allocationRoot: allocation.root, windowRoot: allocation.windowRoot })
  return receipt
}

/** Authenticate the committed allocation and fresh private store before issuing an admission handle. */
export const openLeanPrivateProbeAdmissionV1 = (input: { readonly storePath: string; readonly allocationCommit: string; readonly allocationPath: string; readonly capacity: LeanPrivateProbeCapacityReceiptV1 }): LeanPrivateProbeAdmissionV1 => {
  const capacity = privateProbeCapacities.get(input.capacity)
  const storePath = resolve(input.storePath), allocationPath = resolve(input.allocationPath)
  if (!capacity || capacity.storePath !== storePath || performance.now() - capacity.startedAt > 30_000 || !/^[a-f0-9]{40,64}$/.test(input.allocationCommit) || ![".planning/artifacts/v1.38-phase-265-private-probe-allocation-v1.json", ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json"].includes(input.allocationPath)) return privateProbeFail()
  privateProbeCapacities.delete(input.capacity)
  const directory = lstatSync(storePath)
  if (!directory.isDirectory() || directory.isSymbolicLink() || directory.uid !== (typeof process.getuid === "function" ? process.getuid() : directory.uid) || (directory.mode & 0o777) !== 0o700 || realpathSync(storePath) !== storePath) return privateProbeFail()
  const initialInventory = readdirSync(storePath).sort()
  if (initialInventory.length !== 2 || initialInventory[0] !== "allocation.json" || initialInventory[1] !== "request.json") return privateProbeFail()
  const allocationBytes = privateProbeFile(resolve(storePath, "allocation.json"), 65_536, 0o600)
  const parsed = JSON.parse(allocationBytes.toString("utf8")) as unknown
  const allocation = validatePrivateProbeAllocation(parsed)
  if (allocation.schemaVersion === "lean-private-probe-allocation-v2" ? capacity.allocationRoot !== allocation.root || capacity.windowRoot !== allocation.windowRoot : capacity.allocationRoot !== undefined || capacity.windowRoot !== undefined) return privateProbeFail()
  if (allocation.schemaVersion === "lean-private-probe-allocation-v2") observeLeanPrivateProbeResourcesV2(storePath, allocation)
  if ((allocation.schemaVersion === "lean-private-probe-allocation-v2") !== input.allocationPath.endsWith("allocation-v2.json")) return privateProbeFail()
  const priorRetainedBytes = allocation.schemaVersion === "lean-private-probe-allocation-v2" ? allocation.priorV1Carry.retainedAllocatedBytes : 0
  if (capacity.priorRetainedBytes !== priorRetainedBytes) return privateProbeFail()
  if (allocation.costSnapshotRoot !== LEAN_PRIVATE_PROBE_COST_ROOT) return privateProbeFail()
  if (!allocationBytes.equals(canonicalPrivateProbe(allocation))) return privateProbeFail()
  const output = readLeanPrivateProbeGitV1(["rev-list", "--parents", "-n", "1", input.allocationCommit]).toString("utf8").trim().split(/\s+/u)
  if (output.length !== 2 || output[1] !== allocation.sourceHead) return privateProbeFail()
  const committed = readLeanPrivateProbeGitV1(["show", `${input.allocationCommit}:${input.allocationPath}`])
  if (!Buffer.from(committed).equals(allocationBytes) || readLeanPrivateProbeGitV1(["rev-parse", "HEAD"]).toString("utf8").trim() !== input.allocationCommit) return privateProbeFail()
  const admission: LeanPrivateProbeAdmissionV1 = Object.freeze({ schemaVersion: "lean-private-probe-admission-v1", toJSON: opaque })
  privateProbeAdmissions.set(admission, { allocation, allocationBytes, allocationCommit: input.allocationCommit, allocationPath: input.allocationPath, storePath, priorRetainedBytes, nextOrdinal: 0, used: false })
  return admission
}

/** Append/fsync/reopen the exact next debit before minting a one-invocation handle. */
export const recordAndIssueLeanPrivateProbeRuntimeAuthorityV1 = (admission: LeanPrivateProbeAdmissionV1, invocation: LeanPrivateProbeInvocationV1, capacity: LeanPrivateProbeCapacityReceiptV1): LeanPrivateProbeRuntimeAuthority => {
  const state = privateProbeAdmissions.get(admission), receipt = privateProbeCapacities.get(capacity)
  // Uncertain issuance is terminal, even if the caller restores the files.
  if (state && !state.used) state.used = true
  else return privateProbeFail()
  if (!receipt || receipt.storePath !== state.storePath || receipt.priorRetainedBytes !== state.priorRetainedBytes || performance.now() - receipt.startedAt > 30_000) return privateProbeFail()
  if (state.allocation.schemaVersion === "lean-private-probe-allocation-v2") {
    if (receipt.allocationRoot !== state.allocation.root || receipt.windowRoot !== state.allocation.windowRoot) return privateProbeFail()
    observeLeanPrivateProbeResourcesV2(state.storePath, state.allocation)
  } else {
    if (receipt.allocationRoot !== undefined || receipt.windowRoot !== undefined) return privateProbeFail()
    observeLeanPrivateProbeResourcesV1(state.storePath, state.priorRetainedBytes)
  }
  privateProbeCapacities.delete(capacity)
  const expected = state.allocation.cases[state.nextOrdinal]
  if (!expected || canonicalPrivateProbe(expected).compare(canonicalPrivateProbe(invocation)) !== 0) return privateProbeFail()
  const expectedInventory = ["allocation.json", "entry.json", "request.json", ...(state.nextOrdinal > 0 ? ["ledger.ndjson"] : []), ...Array.from({ length: state.nextOrdinal }, (_, ordinal) => `probe-${String(ordinal).padStart(2, "0")}.json`)].sort()
  const currentInventory = readdirSync(state.storePath).sort()
  if (currentInventory.length !== expectedInventory.length || currentInventory.some((name, index) => name !== expectedInventory[index])) return privateProbeFail()
  if (readLeanPrivateProbeGitV1(["rev-parse", "HEAD"]).toString("utf8").trim() !== state.allocationCommit) return privateProbeFail()
  const allocationBefore = privateProbeFile(resolve(state.storePath, "allocation.json"), 65_536, 0o600)
  const committedBefore = readLeanPrivateProbeGitV1(["show", `${state.allocationCommit}:${state.allocationPath}`])
  if (!allocationBefore.equals(state.allocationBytes) || !Buffer.from(committedBefore).equals(state.allocationBytes)) return privateProbeFail()
  const ledgerPath = resolve(state.storePath, "ledger.ndjson")
  let prior: Buffer<ArrayBufferLike> = Buffer.alloc(0)
  try { prior = privateProbeFile(ledgerPath, 65_536, 0o600) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") return privateProbeFail() }
  const expectedPrior = Buffer.concat(state.allocation.cases.slice(0, state.nextOrdinal).map(item => Buffer.concat([canonicalPrivateProbe({ schemaVersion: "lean-private-probe-debit-v1", allocationRoot: state.allocation.root, allocationDigest: leanBytesRoot(state.allocationBytes), ordinal: item.ordinal, caseId: item.caseId, requestRoot: item.requestRoot, inputRoot: item.inputRoot }), Buffer.from("\n")])))
  if (!prior.equals(expectedPrior)) return privateProbeFail()
  const offset = prior.length
  const row = { schemaVersion: "lean-private-probe-debit-v1", allocationRoot: state.allocation.root, allocationDigest: leanBytesRoot(state.allocationBytes), ordinal: invocation.ordinal, caseId: invocation.caseId, requestRoot: invocation.requestRoot, inputRoot: invocation.inputRoot }
  const rowBytes = Buffer.concat([canonicalPrivateProbe(row), Buffer.from("\n")])
  const fd = openSync(ledgerPath, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o600)
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || opened.nlink !== 1 || opened.uid !== (typeof process.getuid === "function" ? process.getuid() : opened.uid) || (opened.mode & 0o777) !== 0o600 || opened.size !== offset) return privateProbeFail()
    let written = 0
    while (written < rowBytes.length) {
      const count = writeSync(fd, rowBytes, written, rowBytes.length - written)
      if (count <= 0) return privateProbeFail()
      written += count
    }
    fsyncSync(fd)
  } finally { closeSync(fd) }
  const directoryFd = openSync(state.storePath, constants.O_RDONLY)
  try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
  const reopened = privateProbeFile(ledgerPath, 65_536, 0o600)
  if (!reopened.subarray(0, offset).equals(prior) || !reopened.subarray(offset).equals(rowBytes)) return privateProbeFail()
  const finalAllocation = privateProbeFile(resolve(state.storePath, "allocation.json"), 65_536, 0o600)
  if (!finalAllocation.equals(state.allocationBytes)) return privateProbeFail()
  const verifiedRows = reopened.toString("utf8").trimEnd().split("\n").map(line => JSON.parse(line) as Record<string, unknown>)
  if (verifiedRows.length !== state.nextOrdinal + 1 || verifiedRows.some((item, ordinal) => item.ordinal !== ordinal || item.allocationRoot !== state.allocation.root || item.allocationDigest !== leanBytesRoot(state.allocationBytes))) return privateProbeFail()
  const binding: LeanPrivateProbeBindingV1 = freezeLabValue({ ...invocation, allocationRoot: state.allocation.root, allocationDigest: leanBytesRoot(state.allocationBytes), debitDigest: leanBytesRoot(rowBytes), debitOffset: offset, executionOwnerId: `probe-${state.allocation.root.slice(7, 19)}-${invocation.ordinal}` })
  const capability: LeanPrivateProbeRuntimeAuthority = Object.freeze({ schemaVersion: "lean-private-probe-runtime-authority-v1", binding, toJSON: opaque })
  const startupGrant: LeanPrivateProbeStartupGrantV1 = Object.freeze({ schemaVersion: "lean-private-probe-startup-grant-v1", policyRoot: LEAN_STARTUP_POLICY_V5.root, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())), toJSON: opaque })
  privateProbeStartupGrants.set(startupGrant, { binding, claims: new Set() })
  privateProbeAuthorities.set(capability, { binding, claims: new Set(), startupGrant })
  state.nextOrdinal += 1
  state.used = state.nextOrdinal === state.allocation.cases.length
  return capability
}

export const claimLeanPrivateProbeRuntimeAuthority = (authority: LeanPrivateProbeRuntimeAuthority, binding: LeanPrivateProbeBindingV1, layer: Layer): Readonly<{ binding: LeanPrivateProbeBindingV1; startupGrant: LeanPrivateProbeStartupGrantV1 }> => {
  const state = authority && privateProbeAuthorities.get(authority)
  if (!state || authority.schemaVersion !== "lean-private-probe-runtime-authority-v1" || !["factory", "planner", "session"].includes(layer) || state.claims.has(layer) || layer === "planner" && !state.claims.has("factory") || layer === "session" && !state.claims.has("planner") || labRoot("lean-private-probe-binding-v1", binding) !== labRoot("lean-private-probe-binding-v1", state.binding)) return privateProbeFail()
  const grantState = privateProbeStartupGrants.get(state.startupGrant)
  if (!grantState || grantState.binding !== state.binding || state.startupGrant.schemaVersion !== "lean-private-probe-startup-grant-v1" || state.startupGrant.policyRoot !== LEAN_STARTUP_POLICY_V5.root || state.startupGrant.harnessRoot !== leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())) || grantState.claims.has(layer) || layer === "planner" && !grantState.claims.has("factory") || layer === "session" && !grantState.claims.has("planner")) return privateProbeFail()
  state.claims.add(layer)
  grantState.claims.add(layer)
  return Object.freeze({ binding: state.binding, startupGrant: state.startupGrant })
}
export interface LeanStartupGrantV5 { readonly version?: 6 | 7; readonly allocationRoot: LabRoot; readonly chargeRoot: LabRoot; readonly seat: "bottom" | "top"; readonly policyRoot: LabRoot; readonly harnessRoot: LabRoot }
export interface LeanStartupGrantV8 extends Omit<LeanStartupGrantV5, "version"> { readonly version: 8; toJSON(): never }
const issued = new WeakMap<object, { binding: ProspectiveLeagueLifetimeProviderBinding; claims: Set<Layer>; startup?: Readonly<LeanStartupGrantV5>; startupV8?: Readonly<LeanStartupGrantV8> }>()
export const leanStartupAuthorityDescriptorV5 = (authority: LeanRuntimeAuthority): Readonly<LeanStartupGrantV5> | undefined => issued.get(authority)?.startup
export const leanStartupAuthorityDescriptorV8 = (authority: LeanRuntimeAuthority): Readonly<LeanStartupGrantV8> | undefined => issued.get(authority)?.startupV8
const used = new Set<string>()
const fail = (): never => { throw new TypeError("LEAN_RUNTIME_AUTHORITY") }
export const deriveLeanCandidateRuntime = (input: FactoryCandidateClosure) => {
  const closure = readCandidateClosure(input)
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: closure.packet, proposal: closure.proposal, sourceBytes: closure.sourceBytes }), validation: closure.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: new TextDecoder("utf8", { fatal: true }).decode(closure.sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== admission.sourceRoot.slice(7)) return fail()
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  return { candidateRoot: closure.candidate.root, runtime }
}
export const issueLeanRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, input: FactoryCandidateClosure, binding: ProspectiveLeagueLifetimeProviderBinding): LeanRuntimeAuthority => {
  const state = readLeanLedger(ledger)
  const retainedCharge = state.charges.get(charge.slotRoot)
  if (!retainedCharge || labRoot("lean-slot-charge", charge) !== labRoot("lean-slot-charge", retainedCharge)) return fail()
  const derived = deriveLeanCandidateRuntime(input), candidateRoot = derived.candidateRoot
  const slot = ledger.allocation.slots[retainedCharge.ordinal]
  const seatIndex = binding.seat === "bottom" ? 0 : 1
  const scheduled = slot && ledger.allocation.candidateRoots[slot.condition < 2 ? seatIndex : 1 - seatIndex]
  if (candidateRoot !== scheduled || labRoot("lean-candidate-runtime", binding.runtime) !== labRoot("lean-candidate-runtime", derived.runtime)) return fail()
  if (state.stopped || state.terminals.has(retainedCharge.root) || !ledger.allocation.candidateRoots.includes(candidateRoot) || binding.budgetRoot !== ledger.allocation.root || binding.attemptRoot !== retainedCharge.root || binding.matchId !== `lean-${retainedCharge.root.slice(7, 31)}` || binding.containerName !== `lean-${retainedCharge.root.slice(7, 25)}-${binding.seat}` || binding.ownershipLabel !== `lean-${ledger.allocation.root.slice(7, 25)}` || binding.runtime.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || binding.runtime.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || binding.runtime.image !== LAB_ADMITTED_ROOTS.image || !["bottom", "top"].includes(binding.seat)) return fail()
  const key = `${ledger.allocation.root}:${charge.root}:${binding.seat}`
  if (used.has(key)) return fail()
  const authority: LeanRuntimeAuthority = Object.freeze({ schemaVersion: "lean-runtime-authority-v1", runtime: freezeLabValue(structuredClone(binding.runtime)), seat: binding.seat, toJSON: fail })
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), claims: new Set() }); used.add(key); return authority
}
export const claimLeanRuntimeAuthority = (authority: LeanRuntimeAuthority, binding: Omit<ProspectiveLeagueLifetimeProviderBinding, "seat"> & { seat?: "bottom" | "top" }, layer: Layer): { lifetimeMs: 600000; receiptMs: 5000; startup?: Readonly<LeanStartupGrantV5> } => {
  const state = authority && issued.get(authority)
  if (!state || state.startupV8 || authority.schemaVersion !== "lean-runtime-authority-v1" || !["factory", "planner", "session"].includes(layer) || state.claims.has(layer) || layer === "planner" && !state.claims.has("factory") || layer === "session" && !state.claims.has("planner") || labRoot("lean-runtime-binding-v1", { ...binding, seat: authority.seat }) !== labRoot("lean-runtime-binding-v1", state.binding)) return fail()
  state.claims.add(layer); return { lifetimeMs: 600000, receiptMs: 5000, ...(state.startup === undefined ? {} : { startup: state.startup }) }
}
/** Distinct claim path: no legacy caller can dispatch V8 between units. */
export const claimLeanStartupAuthorityV8 = (authority: LeanRuntimeAuthority, binding: Omit<ProspectiveLeagueLifetimeProviderBinding, "seat"> & { seat?: "bottom" | "top" }, layer: Layer): { lifetimeMs: 600000; receiptMs: 5000; startup: Readonly<LeanStartupGrantV8> } => {
  const state = authority && issued.get(authority)
  if (!state?.startupV8 || authority.schemaVersion !== "lean-runtime-authority-v1" || !["factory", "planner", "session"].includes(layer) || state.claims.has(layer) || layer === "planner" && !state.claims.has("factory") || layer === "session" && !state.claims.has("planner") || labRoot("lean-runtime-binding-v1", { ...binding, seat: authority.seat }) !== labRoot("lean-runtime-binding-v1", state.binding)) return fail()
  state.claims.add(layer)
  return { lifetimeMs: 600000, receiptMs: 5000, startup: state.startupV8 }
}

/** Distinct current-baseline route. The old pilot issuer and its two-source
 * scheduling predicate are unchanged. A pair is retained before charge and
 * both independently validated immutable source snapshots are reopened here. */
export const issueLeanBaselineRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding): LeanRuntimeAuthority => issueBaselineAuthority(ledger, charge, snapshot, binding)
export const issueLeanCorrectionRuntimeAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding, reuse: LeanColdReuse): LeanRuntimeAuthority => issueBaselineAuthority(ledger, charge, snapshot, binding, validateLeanColdReuse(reuse, ledger.allocation.sourceRoot))
const issueBaselineAuthority = (ledger: LeanExperimentLedger, charge: LeanCharge, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding, reuse?: LeanColdReuse): LeanRuntimeAuthority => {
  const allocation = ledger.allocation as unknown as { schemaVersion: string; coldRoot?: LabRoot; sourceRoot: LabRoot; predecessor?: { chargedMatches: number } }
  if (reuse ? !["lean-correction-diagnostic-allocation-v1", "lean-correction-baseline-allocation-v1", "lean-correction-supervisor-diagnostic-allocation-v2", "lean-correction-supervisor-diagnostic-allocation-v3", "lean-correction-supervisor-baseline-allocation-v2", "lean-correction-supervisor-baseline-allocation-v3", "lean-correction-supervisor-diagnostic-allocation-v4", "lean-correction-supervisor-baseline-allocation-v4", "lean-correction-supervisor-diagnostic-allocation-v5", "lean-correction-supervisor-baseline-allocation-v5", "lean-correction-supervisor-diagnostic-allocation-v6", "lean-correction-supervisor-baseline-allocation-v6", "lean-correction-supervisor-diagnostic-allocation-v7", "lean-correction-supervisor-baseline-allocation-v7", "lean-correction-supervisor-diagnostic-allocation-v8", "lean-correction-supervisor-baseline-allocation-v8"].includes(allocation.schemaVersion) || !("reuseGrantRoot" in ledger.allocation) || ledger.allocation.reuseGrantRoot !== reuse.grant.root : allocation.schemaVersion !== "lean-current-baseline-allocation-v1") return fail()
  if ((allocation.schemaVersion.endsWith("-v5") || allocation.schemaVersion.endsWith("-v6") || allocation.schemaVersion.endsWith("-v7") || allocation.schemaVersion.endsWith("-v8"))) leanCapsForAllocation(ledger.allocation)
  if (allocation.schemaVersion.endsWith("-v8")) {
    // Admission authenticates the prospective extension as part of the exact
    // allocation root; the runtime/startup protocol remains wire v7.
    const admitted = admitLeanAllocation(ledger.allocation)
    if (admitted.root !== binding.budgetRoot) return fail()
  }
  if (allocation.schemaVersion === "lean-correction-supervisor-baseline-allocation-v8") authenticateLeanRetryBaselineAuthorityV8(ledger.allocation as import("../../packages/strategy-lab/src/league/lean-experiment.js").LeanCorrectionAllocation, readLeanChildEntry(ledger).head)
  const state = readLeanLedger(ledger), retainedCharge = state.charges.get(charge.slotRoot)
  if (!retainedCharge || state.stopped || state.terminals.has(retainedCharge.root) || labRoot("lean-slot-charge", charge) !== labRoot("lean-slot-charge", retainedCharge)) return fail()
  const path = resolve(ledger.directory, `pair-${charge.ordinal}.json`), stat = lstatSync(path)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || (stat.mode & 0o777) !== 0o600 || stat.size > 16384 || realpathSync(path) !== path) return fail()
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  let pair: LeanBaselinePair
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino || opened.nlink !== 1 || opened.size !== stat.size || (opened.mode & 0o777) !== 0o600) return fail()
    const bytes = readFileSync(fd)
    if (bytes.length > 16384) return fail()
    pair = JSON.parse(Buffer.from(bytes).toString("utf8"))
    if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(pair))) return fail()
  } finally { closeSync(fd) }
  const slot = ledger.allocation.slots[retainedCharge.ordinal]
  if (!exactLabKeys(pair, ["schemaVersion", "ordinal", "slotRoot", "requestRoot", "priorLedgerBytesRoot", "priorLedgerByteLength", "priorCharged", "bottomRole", "bottomSourceRoot", "bottomSnapshotRoot", "topRole", "topSourceRoot", "topSnapshotRoot", "root"]) || pair.schemaVersion !== "lean-baseline-pair-v1" || pair.ordinal !== retainedCharge.ordinal || pair.slotRoot !== retainedCharge.slotRoot || pair.requestRoot !== slot?.requestRoot || pair.priorCharged !== (allocation.predecessor?.chargedMatches ?? -1) + retainedCharge.ordinal || !["bottom", "top"].includes(binding.seat)) return fail()
  const { root: pairRoot, ...pairBody } = pair
  if (pairRoot !== labRoot("lean-baseline-pair-v1", pairBody)) return fail()
  // Prefix commitment proves the pair was retained against an uncharged slot;
  // fresh capacity resource rows may occur between that prefix and its charge.
  const journalPath = resolve(ledger.directory, "ledger.ndjson"), journalStat = lstatSync(journalPath)
  if (!journalStat.isFile() || journalStat.isSymbolicLink() || journalStat.nlink !== 1 || (journalStat.mode & 0o777) !== 0o600 || journalStat.size > 4 * 1024 * 1024 || realpathSync(journalPath) !== journalPath || !Number.isSafeInteger(pair.priorLedgerByteLength) || pair.priorLedgerByteLength < 0 || pair.priorLedgerByteLength > journalStat.size) return fail()
  const journalFd = openSync(journalPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(journalFd)
    if (!opened.isFile() || opened.dev !== journalStat.dev || opened.ino !== journalStat.ino || opened.nlink !== 1 || opened.size !== journalStat.size) return fail()
    const bytes = readFileSync(journalFd)
    const prefix = bytes.subarray(0, pair.priorLedgerByteLength), suffix = bytes.subarray(pair.priorLedgerByteLength)
    if (leanBytesRoot(prefix) !== pair.priorLedgerBytesRoot || (prefix.length && prefix[prefix.length - 1] !== 10)) return fail()
    const charges = (part: Uint8Array) => Buffer.from(part).toString("utf8").split("\n").filter(Boolean).map(line => JSON.parse(line) as { kind: string; charge?: LeanCharge }).filter(row => row.kind === "charge").map(row => row.charge)
    const before = charges(prefix), after = charges(suffix)
    if (before.length !== retainedCharge.ordinal || before.some(c => c?.root === retainedCharge.root) || after.length !== 1 || labRoot("lean-slot-charge", after[0]) !== labRoot("lean-slot-charge", retainedCharge)) return fail()
  } finally { closeSync(journalFd) }
  const expectedRole = binding.seat === "bottom" ? pair.bottomRole : pair.topRole
  const expectedRoot = binding.seat === "bottom" ? pair.bottomSourceRoot : pair.topSourceRoot
  const expectedSnapshot = binding.seat === "bottom" ? pair.bottomSnapshotRoot : pair.topSnapshotRoot
  const source = readLeanBaselineSource(ledger.directory, expectedRole, (leanSupervisorAllocationMode(ledger.allocation) === "v6" || (leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation)))) ? { allocation: ledger.allocation, head: readLeanChildEntry(ledger).head } : undefined)
  if (source.sourceRoot !== expectedRoot || source.root !== expectedSnapshot || source.root !== snapshot.root || source.coldRoot !== allocation.coldRoot || (source.implementationRoot !== allocation.sourceRoot && (!reuse || !reuse.sources.some(s => s.root === source.root && s.role === source.role)))) return fail()
  const sourceBytes = new TextEncoder().encode(source.source)
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes }), validation: source.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact) return fail()
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: source.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  if (labRoot("lean-candidate-runtime", binding.runtime) !== labRoot("lean-candidate-runtime", runtime) || binding.budgetRoot !== ledger.allocation.root || binding.attemptRoot !== retainedCharge.root || binding.matchId !== `lean-${retainedCharge.root.slice(7, 31)}` || binding.containerName !== `lean-${retainedCharge.root.slice(7, 25)}-${binding.seat}` || binding.ownershipLabel !== `lean-${ledger.allocation.root.slice(7, 25)}`) return fail()
  const key = `${ledger.allocation.root}:${charge.root}:${binding.seat}`
  if (used.has(key)) return fail()
  const authority: LeanRuntimeAuthority = Object.freeze({ schemaVersion: "lean-runtime-authority-v1", runtime: freezeLabValue(structuredClone(runtime)), seat: binding.seat, toJSON: fail })
  const mode = leanSupervisorAllocationMode(ledger.allocation), v8 = mode === "v15-5"
  const correction = ledger.allocation as LeanCorrectionAllocation
  if (v8 && (correction.attemptOrdinal !== 5 || correction.timeboxExtension?.root !== LEAN_RESOURCE_WINDOW_V15_STARTUP_ATTRIBUTION_POLICY.root || correction.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root)) return fail()
  const startupV8: Readonly<LeanStartupGrantV8> | undefined = v8 ? Object.freeze({ version: 8 as const, allocationRoot: ledger.allocation.root, chargeRoot: retainedCharge.root, seat: binding.seat, policyRoot: correction.startupPolicyRoot!, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())), toJSON: fail }) : undefined
  const startup = !v8 && (leanSupervisorAllocationMode(ledger.allocation) === "v5" || (leanSupervisorAllocationMode(ledger.allocation) === "v6" || (leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation))))) ? Object.freeze({ ...((leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation))) ? { version: 7 as const } : leanSupervisorAllocationMode(ledger.allocation) === "v6" ? { version: 6 as const } : {}), allocationRoot: ledger.allocation.root, chargeRoot: retainedCharge.root, seat: binding.seat, policyRoot: (ledger.allocation as LeanCorrectionAllocation).startupPolicyRoot!, harnessRoot: leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV5())) }) : undefined
  if (startup && startup.policyRoot !== LEAN_STARTUP_POLICY_V5.root) return fail()
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), claims: new Set(), ...(startup === undefined ? {} : { startup }), ...(startupV8 === undefined ? {} : { startupV8 }) }); used.add(key)
  if (reuse) correctionAuthorities.add(authority)
  return authority
}

/** Prospective two-Match HOST route. None of the legacy predicates above are
 * widened. Serialized records are evidence; only WeakMap handles authorize. */
const privateMatchFail = (): never => { throw new TypeError("LEAN_PRIVATE_MATCH_AUTHORITY") }
const privateMatchWindow = { schemaVersion: "lean-private-match-window-v1", anchorMs: 1791669996000, deadlineMs: 1791677196000, carryMs: 322054903, capMs: 329254903, reserveMs: 1860000 }
export const LEAN_PRIVATE_MATCH_WINDOW_V1 = freezeLabValue({ ...privateMatchWindow, root: labRoot(privateMatchWindow.schemaVersion, privateMatchWindow) })
export const LEAN_PRIVATE_MATCH_ARTIFACT_V1 = ".planning/artifacts/v1.38-phase-265-private-match-allocation-v1.json"
export const LEAN_PRIVATE_MATCH_SOURCE_STORE_V1 = ".strategy-lab/lean-correction-supervisor-baseline-20261006-v6"
export const LEAN_PRIVATE_MATCH_SEED_V1 = "phase265-private-two-match-20261010"
export interface LeanPrivateMatchSourceV1 {
  readonly role: "tactical-0" | "cold-opponent"; readonly rawRoot: LabRoot; readonly snapshotRoot: LabRoot; readonly sourceRoot: LabRoot
  readonly sourceBytes: number; readonly fileBytes: number; readonly structureRoot: LabRoot; readonly packetRoot: LabRoot; readonly proposalRoot: LabRoot; readonly validationRoot: LabRoot
  readonly coldRoot: LabRoot; readonly implementationRoot: LabRoot; readonly executableRoot: LabRoot | null
}
export interface LeanPrivateMatchSlotV1 {
  readonly ordinal: 0 | 1; readonly condition: 0 | 2; readonly bottomRole: "tactical-0" | "cold-opponent"; readonly topRole: "tactical-0" | "cold-opponent"
  readonly requestRoot: LabRoot; readonly root: LabRoot
}
export interface LeanPrivateMatchAllocationV1 {
  readonly schemaVersion: "lean-private-match-allocation-v1"; readonly sourceHead: string; readonly matchCount: 2; readonly seed: typeof LEAN_PRIVATE_MATCH_SEED_V1
  readonly windowRoot: LabRoot; readonly costSnapshotRoot: LabRoot; readonly historicalCharged: 40; readonly priorProbeCarry: Readonly<{ failedRoot: LabRoot; successRoot: LabRoot; retainedBytes: 65536; root: LabRoot }>
  readonly sourcePrefix: Readonly<{ root: LabRoot; allocatedBytes: number; rows: readonly Readonly<{ name: string; rawRoot: LabRoot; bytes: number; allocatedBytes: number }>[] }>
  readonly sources: readonly [LeanPrivateMatchSourceV1, LeanPrivateMatchSourceV1]; readonly slots: readonly [LeanPrivateMatchSlotV1, LeanPrivateMatchSlotV1]
  readonly arenaHash: string; readonly catalogRoot: LabRoot; readonly currentStartRoot: LabRoot; readonly tupleId: string; readonly tupleRoot: LabRoot; readonly runtimeLimitsRoot: LabRoot; readonly image: string
  readonly startupPolicyRoot: LabRoot; readonly harnessRoot: LabRoot; readonly ceilings: Readonly<{ guestMs: 1000; startupMs: 2500; hostMs: 5000; matchMs: 600000 }>; readonly root: LabRoot
}
export interface LeanPrivateMatchCapacityV1 { readonly schemaVersion: "lean-private-match-capacity-v1"; toJSON(): never }
export interface LeanPrivateMatchAdmissionV1 { readonly schemaVersion: "lean-private-match-admission-v1"; toJSON(): never }
export interface LeanPrivateMatchDebitV1 { readonly schemaVersion: "lean-private-match-debit-handle-v1"; toJSON(): never }
type MatchResources = Readonly<{ windowRoot: LabRoot; allocationRoot: LabRoot; wallAtMs: number; cumulativeElapsedMs: number; remainingSlots: number; historicalCharged: 40; historicalAllocatedBytes: number; priorProbeBytes: 65536; sourceAllocatedBytes: number; newAllocatedBytes: number; retainedBytesUpperBound: number; parentRssBytes: number; aggregateMemoryUpperBound: number; availableDiskBytes: number }>
type MatchAdmission = { allocation: LeanPrivateMatchAllocationV1; storePath: string; allocationCommit: string; journal: Buffer; nextOrdinal: number; stopped: boolean; active: boolean }
type MatchDebit = { admission: MatchAdmission; slot: LeanPrivateMatchSlotV1; root: LabRoot; row: Readonly<Record<string, unknown>>; seats: Set<string> }
const matchCapacities = new WeakMap<object, { path: string; at: number; allocationRoot: LabRoot; resources: MatchResources }>()
const matchAdmissions = new WeakMap<object, MatchAdmission>()
const matchDebits = new WeakMap<object, MatchDebit>()
const matchRoot = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value)
const matchEqual = (a: unknown, b: unknown): boolean => canonicalPrivateProbe(a).equals(canonicalPrivateProbe(b))
export const readLeanPrivateMatchFileV1 = (path: string, maximum = 65536, mode = 0o600): Buffer => privateProbeFile(resolve(path), maximum, mode)
export const writeLeanPrivateMatchFileV1 = (path: string, bytes: Uint8Array, maximum = 65536): void => {
  if (bytes.byteLength > maximum) return privateMatchFail()
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { let offset = 0; while (offset < bytes.byteLength) { const n = writeSync(fd, bytes, offset, bytes.byteLength - offset); if (n <= 0) return privateMatchFail(); offset += n }; fsyncSync(fd) } finally { closeSync(fd) }
  const parent = openSync(dirname(path), constants.O_RDONLY | constants.O_NOFOLLOW)
  try { fsyncSync(parent) } finally { closeSync(parent) }
  if (!readLeanPrivateMatchFileV1(path, maximum).equals(Buffer.from(bytes))) return privateMatchFail()
}
const matchDirectory = (path: string): void => {
  const s = lstatSync(path)
  if (!s.isDirectory() || s.isSymbolicLink() || (s.mode & 0o777) !== 0o700 || s.uid !== process.getuid?.() || realpathSync(path) !== path) return privateMatchFail()
}
/** Metadata only: no revision builder, validator/compiler, provider or engine. */
export const inspectLeanPrivateMatchSourceV1 = (directory: string, role: "tactical-0" | "cold-opponent"): LeanPrivateMatchSourceV1 => {
  if (!["tactical-0", "cold-opponent"].includes(role)) return privateMatchFail()
  const bytes = readLeanPrivateMatchFileV1(resolve(directory, `source-${role}.json`), 262144)
  const source = JSON.parse(bytes.toString("utf8")) as LeanBaselineSource
  if (!exactLabKeys(source, ["schemaVersion", "role", "coldRoot", "implementationRoot", "source", "sourceRoot", "structureRoot", "packet", "proposal", "validation", "root"]) || source.schemaVersion !== "lean-baseline-source-v1" || source.role !== role || typeof source.source !== "string" || !bytes.equals(canonicalPrivateProbe(source))) return privateMatchFail()
  const sourceBytes = Buffer.byteLength(source.source), { root, ...body } = source
  if (!sourceBytes || sourceBytes > 65536 || source.sourceRoot !== leanBytesRoot(Buffer.from(source.source)) || root !== labRoot("lean-baseline-source-v1", body) || ![root, source.sourceRoot, source.structureRoot, source.coldRoot, source.implementationRoot, source.packet?.root, source.proposal?.root, source.validation?.root].every(matchRoot)) return privateMatchFail()
  return freezeLabValue({ role, rawRoot: leanBytesRoot(bytes), snapshotRoot: root, sourceRoot: source.sourceRoot, sourceBytes, fileBytes: bytes.length, structureRoot: source.structureRoot, packetRoot: source.packet.root, proposalRoot: source.proposal.root, validationRoot: source.validation.root, coldRoot: source.coldRoot, implementationRoot: source.implementationRoot, executableRoot: null })
}
/** A finite prefix inventory, never a materialization of historical Matches. */
export const inspectLeanPrivateMatchPrefixV1 = (sourceHead: string): LeanPrivateMatchAllocationV1["sourcePrefix"] => {
  if (!/^[a-f0-9]{40}$/u.test(sourceHead)) return privateMatchFail()
  const list = readLeanPrivateMatchGitV1(["diff", "--name-only", "dd67460e6628aebff6bc35c253adaa2cdfea284e", sourceHead])
  if (list.length > 32768) return privateMatchFail()
  const names = list.toString("utf8").trim().split("\n").filter(Boolean).sort()
  if (!names.length || names.length > 100 || names.some(name => !/^(?:scripts|\.planning)\/[a-zA-Z0-9_./-]{1,240}$/u.test(name) || name.split("/").includes(".."))) return privateMatchFail()
  let allocatedBytes = 0, total = 0
  const rows = names.map(name => { const p = resolve(name), s = lstatSync(p), bytes = readLeanPrivateMatchFileV1(p, 4194304, s.mode & 0o777), committed = readLeanPrivateMatchGitV1(["show", `${sourceHead}:${name}`]); total += bytes.length; allocatedBytes += s.blocks * 512; if (total > 16777216 || !bytes.equals(committed)) return privateMatchFail(); return { name, rawRoot: leanBytesRoot(bytes), bytes: bytes.length, allocatedBytes: s.blocks * 512 } })
  return freezeLabValue({ root: labRoot("lean-private-match-source-prefix-v1", rows), allocatedBytes, rows })
}
/** Bounded immutable probe carry, not its old empirical reader. */
export const authenticateLeanPrivateMatchProbeCarryV1 = (): LeanPrivateMatchAllocationV1["priorProbeCarry"] => {
  const failed = authenticateLeanPrivateProbeV1CarryV2()
  const allocationRoot = "sha256:a3e6546bfd01ecfd141100644ac2fd51cef26ca6827a17060f11493c761cf548" as LabRoot
  const store = resolve(".strategy-lab/lean-private-probe-v1", allocationRoot.slice(7)); matchDirectory(store)
  const names = ["allocation.json", "entry.json", "ledger.ndjson", "probe-00.json", "request.json", "result.json", "terminal.json"]
  if (!matchEqual(readdirSync(store).sort(), names)) return privateMatchFail()
  let allocated = lstatSync(store).blocks * 512
  const inventory = names.map(name => { const p = resolve(store, name), bytes = readLeanPrivateMatchFileV1(p); allocated += lstatSync(p).blocks * 512; return { name, root: leanBytesRoot(bytes) } })
  const allocationBytes = readLeanPrivateMatchFileV1(resolve(store, "allocation.json")), allocation = JSON.parse(allocationBytes.toString("utf8")) as Record<string, unknown>
  const result = JSON.parse(readLeanPrivateMatchFileV1(resolve(store, "result.json")).toString("utf8")) as Record<string, unknown>
  const { root: ar, ...ab } = allocation, { root: rr, ...rb } = result
  const artifact = ".planning/artifacts/v1.38-phase-265-private-probe-allocation-v2.json"
  if (ar !== allocationRoot || ar !== labRoot("lean-private-probe-allocation-v2", ab) || rr !== "sha256:d6cdd08823e7c8ad384a4486466a757a5637ac35a8cd1078991e17fd2b58ae02" || rr !== labRoot("lean-private-probe-result-v1", rb) || result.allocationRoot !== ar || result.matchCount !== 0 || !matchEqual(result.attemptedOrdinals, [0]) || !allocationBytes.equals(canonicalPrivateProbe(allocation)) || !Buffer.from(readLeanPrivateProbeGitV1(["show", `c98a6d3f0e78201ad57324ad4d4814710429b452:${artifact}`])).equals(allocationBytes)) return privateMatchFail()
  const artifactBytes = readLeanPrivateMatchFileV1(resolve(artifact), 65536, 0o644); allocated += lstatSync(resolve(artifact)).blocks * 512
  if (!artifactBytes.equals(allocationBytes) || allocated !== 32768) return privateMatchFail()
  const body = { failedRoot: failed.root, successRoot: labRoot("lean-private-match-probe-v2-carry-v1", { allocationRoot, resultRoot: rr, inventory }), retainedBytes: 65536 as const }
  return freezeLabValue({ ...body, root: labRoot("lean-private-match-probe-carry-v1", body) })
}
export const validateLeanPrivateMatchAllocationV1 = (value: unknown): LeanPrivateMatchAllocationV1 => {
  if (!exactLabKeys(value, ["schemaVersion", "sourceHead", "matchCount", "seed", "windowRoot", "costSnapshotRoot", "historicalCharged", "priorProbeCarry", "sourcePrefix", "sources", "slots", "arenaHash", "catalogRoot", "currentStartRoot", "tupleId", "tupleRoot", "runtimeLimitsRoot", "image", "startupPolicyRoot", "harnessRoot", "ceilings", "root"])) return privateMatchFail()
  const a = value as unknown as LeanPrivateMatchAllocationV1, { root, ...body } = a
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(arena => arena.id === "arena:smoke:v1" && arena.status === "active")
  if (a.schemaVersion !== "lean-private-match-allocation-v1" || !/^[a-f0-9]{40}$/u.test(a.sourceHead) || a.matchCount !== 2 || a.seed !== LEAN_PRIVATE_MATCH_SEED_V1 || a.windowRoot !== LEAN_PRIVATE_MATCH_WINDOW_V1.root || a.costSnapshotRoot !== LEAN_PRIVATE_PROBE_COST_ROOT || a.historicalCharged !== 40 || a.arenaHash !== smoke?.semanticGeometryHash || a.catalogRoot !== labRoot("lean-private-match-catalog-v1", CANONICAL_ARENA_CATALOG_V1_37) || a.currentStartRoot !== LAB_ADMITTED_ROOTS.currentStartRoot || a.tupleId !== MATCH_KERNEL.tupleId || a.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || a.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || a.image !== LAB_ADMITTED_ROOTS.image || a.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root || a.harnessRoot !== leanBytesRoot(Buffer.from(buildLeanStartupWorkerHarnessV8())) || !matchEqual(a.ceilings, { guestMs: 1000, startupMs: 2500, hostMs: 5000, matchMs: 600000 }) || root !== labRoot(a.schemaVersion, body)) return privateMatchFail()
  if (!Array.isArray(a.sources) || a.sources.length !== 2 || !Array.isArray(a.slots) || a.slots.length !== 2 || a.sources[0].role !== "tactical-0" || a.sources[1].role !== "cold-opponent" || a.sources[0].sourceRoot === a.sources[1].sourceRoot || a.sources[0].coldRoot !== a.sources[1].coldRoot) return privateMatchFail()
  for (const source of a.sources) if (!exactLabKeys(source, ["role", "rawRoot", "snapshotRoot", "sourceRoot", "sourceBytes", "fileBytes", "structureRoot", "packetRoot", "proposalRoot", "validationRoot", "coldRoot", "implementationRoot", "executableRoot"]) || ![source.rawRoot, source.snapshotRoot, source.sourceRoot, source.structureRoot, source.packetRoot, source.proposalRoot, source.validationRoot, source.coldRoot, source.implementationRoot, source.executableRoot].every(matchRoot) || !Number.isSafeInteger(source.sourceBytes) || Number(source.sourceBytes) <= 0 || Number(source.sourceBytes) > 65536 || Number(source.fileBytes) <= 0 || Number(source.fileBytes) > 262144) return privateMatchFail()
  for (const [ordinal, slot] of a.slots.entries()) {
    if (!exactLabKeys(slot, ["ordinal", "condition", "bottomRole", "topRole", "requestRoot", "root"]) || slot.ordinal !== ordinal || slot.condition !== ordinal * 2 || slot.bottomRole !== (ordinal === 0 ? "tactical-0" : "cold-opponent") || slot.topRole !== (ordinal === 0 ? "cold-opponent" : "tactical-0")) return privateMatchFail()
    const { root: sr, ...sb } = slot
    if (sr !== labRoot("lean-private-match-slot-v1", sb) || slot.requestRoot !== labRoot("lean-private-match-request-v1", { ordinal, seed: a.seed, arenaHash: a.arenaHash, bottom: a.sources.find(s => s.role === slot.bottomRole), top: a.sources.find(s => s.role === slot.topRole) })) return privateMatchFail()
  }
  if (!exactLabKeys(a.sourcePrefix, ["root", "allocatedBytes", "rows"]) || !Number.isSafeInteger(a.sourcePrefix.allocatedBytes) || a.sourcePrefix.allocatedBytes <= 0 || a.sourcePrefix.allocatedBytes > 16777216 || !Array.isArray(a.sourcePrefix.rows) || a.sourcePrefix.rows.length > 128 || a.sourcePrefix.root !== labRoot("lean-private-match-source-prefix-v1", a.sourcePrefix.rows) || !exactLabKeys(a.priorProbeCarry, ["failedRoot", "successRoot", "retainedBytes", "root"]) || a.priorProbeCarry.retainedBytes !== 65536 || ![a.priorProbeCarry.failedRoot, a.priorProbeCarry.successRoot].every(matchRoot)) return privateMatchFail()
  const prefixRows = a.sourcePrefix.rows as LeanPrivateMatchAllocationV1["sourcePrefix"]["rows"]
  if (!prefixRows.length || prefixRows.length > 100 || prefixRows.some(row => !exactLabKeys(row, ["name", "rawRoot", "bytes", "allocatedBytes"]) || typeof row.name !== "string" || !/^(?:scripts|\.planning)\/[a-zA-Z0-9_./-]{1,240}$/u.test(row.name) || row.name.split("/").includes("..") || !matchRoot(row.rawRoot) || !Number.isSafeInteger(row.bytes) || Number(row.bytes) < 0 || Number(row.bytes) > 4194304 || !Number.isSafeInteger(row.allocatedBytes) || Number(row.allocatedBytes) < 0) || new Set(prefixRows.map(row => row.name)).size !== prefixRows.length || !matchEqual(prefixRows.map(row => row.name), prefixRows.map(row => row.name).sort()) || prefixRows.reduce((sum, row) => sum + row.allocatedBytes, 0) !== a.sourcePrefix.allocatedBytes) return privateMatchFail()
  const { root: carryRoot, ...carryBody } = a.priorProbeCarry
  if (carryRoot !== labRoot("lean-private-match-probe-carry-v1", carryBody)) return privateMatchFail()
  return freezeLabValue(structuredClone(a))
}
const authenticateMatchAllocation = (a: LeanPrivateMatchAllocationV1): void => {
  if (!matchEqual(a.priorProbeCarry, authenticateLeanPrivateMatchProbeCarryV1()) || !matchEqual(a.sourcePrefix, inspectLeanPrivateMatchPrefixV1(a.sourceHead))) return privateMatchFail()
  for (const s of a.sources) if (!matchEqual({ ...s, executableRoot: null }, inspectLeanPrivateMatchSourceV1(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, s.role))) return privateMatchFail()
}
export const observeLeanPrivateMatchResourcesV1 = (storePath: string, value: unknown, remainingSlots: number): MatchResources => {
  const a = validateLeanPrivateMatchAllocationV1(value), w = LEAN_PRIVATE_MATCH_WINDOW_V1, wallAtMs = Date.now(), cumulativeElapsedMs = w.carryMs + wallAtMs - w.anchorMs
  if (!Number.isSafeInteger(remainingSlots) || remainingSlots < 0 || remainingSlots > 2 || wallAtMs < w.anchorMs || cumulativeElapsedMs + w.reserveMs + remainingSlots * 600000 > w.capMs || wallAtMs + w.reserveMs + remainingSlots * 600000 > w.deadlineMs) return privateMatchFail()
  authenticateMatchAllocation(a)
  const path = resolve(storePath); matchDirectory(path)
  const names = readdirSync(path)
  if (names.length > 13 || names.some(name => !/^(?:allocation\.json|entry\.json|ledger\.ndjson|result\.json|(?:pair|debit|terminal)-[01]\.json|replay-[01]\.ndjson)$/u.test(name))) return privateMatchFail()
  let newAllocatedBytes = lstatSync(path).blocks * 512
  for (const name of names) { const s = lstatSync(resolve(path, name)); if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || (s.mode & 0o777) !== 0o600 || s.size > (name.startsWith("replay-") ? 67108864 : name.startsWith("terminal-") ? 16777216 : 65536)) return privateMatchFail(); newAllocatedBytes += s.blocks * 512 }
  const historical = authenticateLeanPrivateProbeCostV1(), retainedBytesUpperBound = historical.allocatedDiskBytes + 65536 + a.sourcePrefix.allocatedBytes + newAllocatedBytes + 2 * (67108864 + 16777216) + 262144
  const parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), aggregateMemoryUpperBound = assertLeanAggregateMemoryV15({ parentRssBytes, childRssBytes: 2 * 268435456 }, historical.timeboxExtension)
  const disk = statfsSync(path), availableDiskBytes = disk.bavail * disk.bsize
  if (aggregateMemoryUpperBound > 3000000000 || process.memoryUsage().arrayBuffers > 2000000000 || retainedBytesUpperBound > 12000000000 || retainedBytesUpperBound + 2000000000 > 15000000000 || availableDiskBytes < 2000000000) return privateMatchFail()
  return Object.freeze({ windowRoot: w.root, allocationRoot: a.root, wallAtMs, cumulativeElapsedMs, remainingSlots, historicalCharged: 40, historicalAllocatedBytes: historical.allocatedDiskBytes, priorProbeBytes: 65536, sourceAllocatedBytes: a.sourcePrefix.allocatedBytes, newAllocatedBytes, retainedBytesUpperBound, parentRssBytes, aggregateMemoryUpperBound, availableDiskBytes })
}
export const observeLeanPrivateMatchCapacityV1 = (storePath: string, allocation: unknown, remainingSlots: number): LeanPrivateMatchCapacityV1 => {
  const resources = observeLeanPrivateMatchResourcesV1(storePath, allocation, remainingSlots), receipt = Object.freeze({ schemaVersion: "lean-private-match-capacity-v1" as const, toJSON: privateMatchFail })
  matchCapacities.set(receipt, { path: resolve(storePath), at: performance.now(), allocationRoot: resources.allocationRoot, resources }); return receipt
}
export const verifyLeanPrivateMatchResourcesV1 = (a: LeanPrivateMatchAllocationV1, value: unknown, remainingSlots: number): boolean => {
  if (!exactLabKeys(value, ["windowRoot", "allocationRoot", "wallAtMs", "cumulativeElapsedMs", "remainingSlots", "historicalCharged", "historicalAllocatedBytes", "priorProbeBytes", "sourceAllocatedBytes", "newAllocatedBytes", "retainedBytesUpperBound", "parentRssBytes", "aggregateMemoryUpperBound", "availableDiskBytes"])) return false
  const r = value as unknown as MatchResources, w = LEAN_PRIVATE_MATCH_WINDOW_V1
  const numeric = Object.entries(r).filter(([key]) => !["windowRoot", "allocationRoot"].includes(key)).every(([, v]) => Number.isSafeInteger(v) && Number(v) >= 0)
  return numeric && r.windowRoot === w.root && r.allocationRoot === a.root && r.remainingSlots === remainingSlots && r.wallAtMs >= w.anchorMs && r.cumulativeElapsedMs === w.carryMs + r.wallAtMs - w.anchorMs && r.cumulativeElapsedMs + w.reserveMs + remainingSlots * 600000 <= w.capMs && r.wallAtMs + w.reserveMs + remainingSlots * 600000 <= w.deadlineMs && r.historicalCharged === 40 && r.historicalAllocatedBytes === 29970432 && r.priorProbeBytes === 65536 && r.sourceAllocatedBytes === a.sourcePrefix.allocatedBytes && r.retainedBytesUpperBound === 29970432 + 65536 + a.sourcePrefix.allocatedBytes + r.newAllocatedBytes + 2 * (67108864 + 16777216) + 262144 && r.retainedBytesUpperBound <= 12000000000 && r.retainedBytesUpperBound + 2000000000 <= 15000000000 && r.aggregateMemoryUpperBound === r.parentRssBytes + 2 * 268435456 + 512000000 + 335544320 && r.aggregateMemoryUpperBound <= 3000000000 && r.availableDiskBytes >= 2000000000
}
const consumeMatchCapacity = (capacity: LeanPrivateMatchCapacityV1, path: string, a: LeanPrivateMatchAllocationV1, remaining: number): MatchResources => {
  const c = matchCapacities.get(capacity); matchCapacities.delete(capacity)
  if (!c || c.path !== path || c.allocationRoot !== a.root || c.resources.remainingSlots !== remaining || performance.now() - c.at > 30000) return privateMatchFail()
  observeLeanPrivateMatchResourcesV1(path, a, remaining); return c.resources
}
export const authenticateLeanPrivateMatchCommitV1 = (a: LeanPrivateMatchAllocationV1, bytes: Buffer, allocationCommit: string, allocationPath: string): void => {
  if (allocationPath !== LEAN_PRIVATE_MATCH_ARTIFACT_V1 || !/^[a-f0-9]{40}$/u.test(allocationCommit)) return privateMatchFail()
  const parents = readLeanPrivateMatchGitV1(["rev-list", "--parents", "-n", "1", allocationCommit]).toString("utf8").trim().split(/\s+/u)
  if (parents.length !== 2 || parents[0] !== allocationCommit || parents[1] !== a.sourceHead || readLeanPrivateMatchGitV1(["rev-parse", "HEAD"]).toString("utf8").trim() !== allocationCommit || !Buffer.from(readLeanPrivateMatchGitV1(["show", `${allocationCommit}:${allocationPath}`])).equals(bytes) || !readLeanPrivateMatchFileV1(resolve(allocationPath), 65536, 0o644).equals(bytes)) return privateMatchFail()
}
export const openLeanPrivateMatchAdmissionV1 = (input: { storePath: string; allocationCommit: string; allocationPath: string; capacity: LeanPrivateMatchCapacityV1 }): LeanPrivateMatchAdmissionV1 => {
  const path = resolve(input.storePath); matchDirectory(path)
  if (!matchEqual(readdirSync(path), ["allocation.json"])) return privateMatchFail()
  const bytes = readLeanPrivateMatchFileV1(resolve(path, "allocation.json")), a = validateLeanPrivateMatchAllocationV1(JSON.parse(bytes.toString("utf8")))
  if (path !== resolve(".strategy-lab/lean-private-matches-v1", a.root.slice(7)) || !bytes.equals(canonicalPrivateProbe(a))) return privateMatchFail()
  authenticateLeanPrivateMatchCommitV1(a, bytes, input.allocationCommit, input.allocationPath)
  const resources = consumeMatchCapacity(input.capacity, path, a, 2)
  const body = { schemaVersion: "lean-private-match-entry-v1", allocationRoot: a.root, allocationDigest: leanBytesRoot(bytes), allocationCommit: input.allocationCommit, sourceHead: a.sourceHead, resources }
  writeLeanPrivateMatchFileV1(resolve(path, "entry.json"), canonicalPrivateProbe({ ...body, root: labRoot(body.schemaVersion, body) }))
  writeLeanPrivateMatchFileV1(resolve(path, "ledger.ndjson"), Buffer.alloc(0))
  const handle = Object.freeze({ schemaVersion: "lean-private-match-admission-v1" as const, toJSON: privateMatchFail })
  matchAdmissions.set(handle, { allocation: a, storePath: path, allocationCommit: input.allocationCommit, journal: Buffer.alloc(0), nextOrdinal: 0, stopped: false, active: false }); return handle
}
export const readLeanPrivateMatchContextV1 = (admission: LeanPrivateMatchAdmissionV1, debit: LeanPrivateMatchDebitV1) => {
  const a = matchAdmissions.get(admission), d = matchDebits.get(debit)
  if (!a || !d || d.admission !== a || a.stopped || !a.active || d.slot.ordinal !== a.nextOrdinal - 1) return privateMatchFail()
  return Object.freeze({ allocation: a.allocation, slot: d.slot, debitRoot: d.root, storePath: a.storePath })
}
/** Cheap ongoing guard: capacity/cost/immutable joins were authenticated at
 * admission/debit. Do not repeatedly reopen historical carry during frames. */
export const checkpointLeanPrivateMatchV1 = (admission: LeanPrivateMatchAdmissionV1, debit: LeanPrivateMatchDebitV1, additionalBytes = 0): void => {
  const context = readLeanPrivateMatchContextV1(admission, debit), w = LEAN_PRIVATE_MATCH_WINDOW_V1, now = Date.now()
  if (!Number.isSafeInteger(additionalBytes) || additionalBytes < 0 || additionalBytes > 2000000000 || now < w.anchorMs || now + w.reserveMs + (1 - context.slot.ordinal) * 600000 > w.deadlineMs) return privateMatchFail()
  const disk = statfsSync(context.storePath), parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024)
  if (parentRssBytes + 2 * 268435456 + 512000000 + 335544320 + additionalBytes > 3000000000 || process.memoryUsage().arrayBuffers + additionalBytes > 2000000000 || disk.bavail * disk.bsize < 2000000000 + additionalBytes) return privateMatchFail()
}
export const recordLeanPrivateMatchDebitV1 = (admission: LeanPrivateMatchAdmissionV1, ordinal: 0 | 1, capacity: LeanPrivateMatchCapacityV1): LeanPrivateMatchDebitV1 => {
  const a = matchAdmissions.get(admission)
  if (!a || a.stopped || a.active || ordinal !== a.nextOrdinal || ordinal > 1) return privateMatchFail()
  const resources = consumeMatchCapacity(capacity, a.storePath, a.allocation, 2 - ordinal)
  authenticateLeanPrivateMatchCommitV1(a.allocation, canonicalPrivateProbe(a.allocation), a.allocationCommit, LEAN_PRIVATE_MATCH_ARTIFACT_V1)
  if (!readLeanPrivateMatchFileV1(resolve(a.storePath, "ledger.ndjson")).equals(a.journal)) { a.stopped = true; return privateMatchFail() }
  const slot = a.allocation.slots[ordinal], prefix = { priorLedgerBytesRoot: leanBytesRoot(a.journal), priorLedgerByteLength: a.journal.length }
  const pairBody = { schemaVersion: "lean-private-match-pair-v1", allocationRoot: a.allocation.root, slotRoot: slot.root, ordinal, requestRoot: slot.requestRoot, sources: a.allocation.sources, ...prefix }
  const pair = { ...pairBody, root: labRoot(pairBody.schemaVersion, pairBody) }
  const body = { schemaVersion: "lean-private-match-debit-v1", allocationRoot: a.allocation.root, slotRoot: slot.root, ordinal, requestRoot: slot.requestRoot, pairRoot: pair.root, cumulativeCharged: 40 + ordinal + 1, ...prefix, resources }
  const row = { ...body, root: labRoot(body.schemaVersion, body) }, bytes = Buffer.concat([canonicalPrivateProbe(row), Buffer.from("\n")])
  a.active = true; a.nextOrdinal++
  try {
    writeLeanPrivateMatchFileV1(resolve(a.storePath, `pair-${ordinal}.json`), canonicalPrivateProbe(pair))
    writeLeanPrivateMatchFileV1(resolve(a.storePath, `debit-${ordinal}.json`), canonicalPrivateProbe(row))
    const fd = openSync(resolve(a.storePath, "ledger.ndjson"), constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW)
    try { const s = fstatSync(fd); if (s.size !== a.journal.length || s.nlink !== 1 || (s.mode & 0o777) !== 0o600) return privateMatchFail(); let offset = 0; while (offset < bytes.length) { const n = writeSync(fd, bytes, offset, bytes.length - offset); if (n <= 0) return privateMatchFail(); offset += n }; fsyncSync(fd) } finally { closeSync(fd) }
    const parent = openSync(a.storePath, constants.O_RDONLY | constants.O_NOFOLLOW); try { fsyncSync(parent) } finally { closeSync(parent) }
    a.journal = Buffer.concat([a.journal, bytes]); if (!readLeanPrivateMatchFileV1(resolve(a.storePath, "ledger.ndjson")).equals(a.journal)) return privateMatchFail()
  } catch { a.stopped = true; return privateMatchFail() }
  const handle = Object.freeze({ schemaVersion: "lean-private-match-debit-handle-v1" as const, toJSON: privateMatchFail }); matchDebits.set(handle, { admission: a, slot, root: row.root, row, seats: new Set() }); return handle
}
export const issueLeanPrivateMatchRuntimeAuthorityV1 = (admission: LeanPrivateMatchAdmissionV1, debit: LeanPrivateMatchDebitV1, snapshot: LeanBaselineSource, binding: ProspectiveLeagueLifetimeProviderBinding): LeanRuntimeAuthority => {
  const context = readLeanPrivateMatchContextV1(admission, debit), d = matchDebits.get(debit)!, a = context.allocation
  if (!["bottom", "top"].includes(binding.seat) || d.seats.has(binding.seat)) return privateMatchFail()
  if (!readLeanPrivateMatchFileV1(resolve(context.storePath, `debit-${d.slot.ordinal}.json`)).equals(canonicalPrivateProbe(d.row)) || !readLeanPrivateMatchFileV1(resolve(context.storePath, "ledger.ndjson")).equals(d.admission.journal)) return privateMatchFail()
  authenticateLeanPrivateMatchCommitV1(a, canonicalPrivateProbe(a), d.admission.allocationCommit, LEAN_PRIVATE_MATCH_ARTIFACT_V1)
  const role = binding.seat === "bottom" ? d.slot.bottomRole : d.slot.topRole, expected = a.sources.find(s => s.role === role) ?? privateMatchFail()
  const metadata = inspectLeanPrivateMatchSourceV1(LEAN_PRIVATE_MATCH_SOURCE_STORE_V1, role)
  const source = validateLeanBaselineSource(snapshot)
  if (!matchEqual({ ...expected, executableRoot: null }, metadata) || source.role !== role || source.root !== expected.snapshotRoot || source.sourceRoot !== expected.sourceRoot || leanBytesRoot(canonicalPrivateProbe(source)) !== expected.rawRoot) return privateMatchFail()
  const sourceBytes = Buffer.from(source.source), approved = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: source.packet, proposal: source.proposal, sourceBytes }), validation: source.validation }), defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: source.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || `sha256:${revision.metadata.sourceArtifact.hash}` !== expected.executableRoot) return privateMatchFail()
  const runtime = prospectiveLeagueRuntimeBinding(approved, { revisionId: revision.id, sourceRoot: source.sourceRoot, executableRoot: expected.executableRoot!, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  if (!matchEqual(runtime, binding.runtime) || binding.budgetRoot !== a.root || binding.attemptRoot !== d.root || binding.matchId !== `lean-${d.root.slice(7, 31)}` || binding.containerName !== `lean-${d.root.slice(7, 25)}-${binding.seat}` || binding.ownershipLabel !== `lean-${a.root.slice(7, 25)}`) return privateMatchFail()
  const authority: LeanRuntimeAuthority = Object.freeze({ schemaVersion: "lean-runtime-authority-v1", runtime, seat: binding.seat, toJSON: privateMatchFail })
  const startupV8: Readonly<LeanStartupGrantV8> = Object.freeze({ version: 8, allocationRoot: a.root, chargeRoot: d.root, seat: binding.seat, policyRoot: a.startupPolicyRoot, harnessRoot: a.harnessRoot, toJSON: privateMatchFail })
  issued.set(authority, { binding: freezeLabValue(structuredClone(binding)), claims: new Set(), startupV8 }); d.seats.add(binding.seat); return authority
}
/** Completion is not an authority callback. Reopen the durable terminal and
 * require the debit's two actual minted seats; uncertain evidence spends it. */
export const closeLeanPrivateMatchDebitV1 = (admission: LeanPrivateMatchAdmissionV1, debit: LeanPrivateMatchDebitV1): boolean => {
  const context = readLeanPrivateMatchContextV1(admission, debit), d = matchDebits.get(debit)!, a = d.admission
  a.active = false; a.stopped = true
  const terminal = JSON.parse(readLeanPrivateMatchFileV1(resolve(context.storePath, `terminal-${d.slot.ordinal}.json`), 16777216).toString("utf8")) as Record<string, unknown>, { root, ...body } = terminal
  const evidence = terminal.evidence as Record<string, unknown> | undefined
  if (terminal.schemaVersion !== "lean-private-match-terminal-v1" || root !== labRoot("lean-private-match-terminal-v1", body) || terminal.allocationRoot !== a.allocation.root || terminal.debitRoot !== d.root || terminal.slotRoot !== d.slot.root || d.seats.size !== 2 || evidence?.classification !== "success" || evidence.cleanupComplete !== true || evidence.boardEvidenceAvailable !== true || evidence.fullChronicleVerified !== false || !matchRoot(evidence.lastFrameRoot) || evidence.outcome === null) return false
  a.stopped = false; return true
}
