import { authenticateLeanRetryBaselineAuthorityV8 } from "./v1-38-lean-baseline-retained.js"
import { isLeanRetryMode, leanRetryOrdinal, admitLeanAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
/** New compact-route capability; never a legacy full-league receipt. */
import { labRoot, freezeLabValue, LAB_ADMITTED_ROOTS, exactLabKeys, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { readLeanLedger, readLeanChildEntry, type LeanExperimentLedger, type LeanCharge } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import type { ProspectiveLeagueLifetimeProviderBinding } from "./v1-38-league-prospective-lifetime.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { readCandidateClosure, type FactoryCandidateClosure } from "../../packages/strategy-lab/src/league/connected-runner.js"
import { admitFactory, authorizeFactorySupervision } from "../../packages/strategy-lab/src/factory/admission.js"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { readLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"
import { constants, openSync, closeSync, readFileSync, lstatSync, realpathSync, fstatSync, statfsSync, writeSync, fsyncSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { createHash } from "node:crypto"
import { assertLeanAggregateMemoryV15 } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanCanonicalBytes, leanBytesRoot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { validateLeanColdReuse, type LeanColdReuse } from "./v1-38-lean-baseline-reuse.js"
import { leanCapsForAllocation, leanSupervisorAllocationMode, LEAN_STARTUP_POLICY_V5, LEAN_RESOURCE_WINDOW_V15_STARTUP_ATTRIBUTION_POLICY, type LeanCorrectionAllocation } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { buildLeanStartupWorkerHarnessV5, buildLeanStartupWorkerHarnessV8, readLeanPrivateProbeGitV1 } from "./v1-38-lean-container-match-session.js"

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
export interface LeanPrivateProbeAllocationV1 {
  readonly schemaVersion: "lean-private-probe-allocation-v1"; readonly sourceHead: string; readonly matchCount: 0
  readonly cases: readonly LeanPrivateProbeInvocationV1[]; readonly root: LabRoot
  readonly sourceRoot: LabRoot; readonly executableRoot: LabRoot; readonly image: string; readonly tupleId: string
  readonly tupleRoot: LabRoot; readonly runtimeLimitsRoot: LabRoot; readonly costSnapshotRoot: LabRoot
  readonly ceilings: Readonly<{ guestMs: 1000; hostMs: 5000; startupMs: 2500; matchMs: 600000 }>
}
export interface LeanPrivateProbeCapacityReceiptV1 { readonly schemaVersion: "lean-private-probe-capacity-v1"; toJSON(): never }
export interface LeanPrivateProbeAdmissionV1 { readonly schemaVersion: "lean-private-probe-admission-v1"; toJSON(): never }
type PrivateProbeAdmissionState = { allocation: LeanPrivateProbeAllocationV1; allocationBytes: Buffer; allocationCommit: string; allocationPath: string; storePath: string; nextOrdinal: number; used: boolean }
type PrivateProbeCapabilityState = { binding: LeanPrivateProbeBindingV1; claims: Set<Layer> }
const privateProbeAdmissions = new WeakMap<object, PrivateProbeAdmissionState>()
const privateProbeCapacities = new WeakMap<object, { startedAt: number; storePath: string }>()
const privateProbeAuthorities = new WeakMap<object, PrivateProbeCapabilityState>()
const opaque = (): never => { throw new TypeError("LEAN_PRIVATE_PROBE_AUTHORITY") }
const privateProbeFail = (): never => { throw new TypeError("LEAN_PRIVATE_PROBE_AUTHORITY") }
export const LEAN_PRIVATE_PROBE_COST_ROOT = "sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381" as LabRoot
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
export const observeLeanPrivateProbeResourcesV1 = (storePath: string) => {
  const snapshot = authenticateLeanPrivateProbeCostV1(), wallAtMs = Date.now(), cumulativeElapsedMs = 292757903 + wallAtMs - 1791640699000
  if (!Number.isSafeInteger(cumulativeElapsedMs) || cumulativeElapsedMs < 292757903 || cumulativeElapsedMs + 1860000 > 296357903 || wallAtMs + 1860000 > 1791644299000) return privateProbeFail()
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
  const retainedBytesUpperBound = snapshot.allocatedDiskBytes + newAllocatedBytes + 131072
  const parentRssBytes = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024)
  const containerMemoryUpperBound = 268435456
  const aggregateMemoryUpperBound = assertLeanAggregateMemoryV15({ parentRssBytes, childRssBytes: containerMemoryUpperBound }, snapshot.timeboxExtension)
  const disk = statfsSync(path), availableDiskBytes = disk.bavail * disk.bsize
  if (!Number.isSafeInteger(retainedBytesUpperBound) || retainedBytesUpperBound > 12000000000 || retainedBytesUpperBound + 2000000000 > 15000000000 || !Number.isSafeInteger(availableDiskBytes) || availableDiskBytes < 2000000000 || process.memoryUsage().arrayBuffers > 2000000000) return privateProbeFail()
  return Object.freeze({ costSnapshotRoot: LEAN_PRIVATE_PROBE_COST_ROOT, historicalCharged: 40, historicalAllocatedBytes: snapshot.allocatedDiskBytes, wallAtMs, cumulativeElapsedMs, newAllocatedBytes, retainedBytesUpperBound, parentRssBytes, containerMemoryUpperBound, aggregateMemoryUpperBound, availableDiskBytes })
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
const validatePrivateProbeAllocation = (value: unknown): LeanPrivateProbeAllocationV1 => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return privateProbeFail()
  const allocation = value as LeanPrivateProbeAllocationV1
  const keys = ["schemaVersion", "sourceHead", "matchCount", "cases", "root", "sourceRoot", "executableRoot", "image", "tupleId", "tupleRoot", "runtimeLimitsRoot", "costSnapshotRoot", "ceilings"]
  const validCase = (candidate: unknown, ordinal: number): boolean => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) || !exactLabKeys(candidate, ["ordinal", "caseId", "method", "sourceRoot", "executableRoot", "requestRoot", "inputRoot", "image", "tupleId", "tupleRoot", "runtimeLimitsRoot"])) return false
    const item = candidate as unknown as LeanPrivateProbeInvocationV1
    return item.ordinal === ordinal && ["selectActivations", "soldierBrain"].includes(item.method) && typeof item.caseId === "string" && /^sha256:[a-f0-9]{64}$/.test(item.sourceRoot) && /^sha256:[a-f0-9]{64}$/.test(item.executableRoot) && /^sha256:[a-f0-9]{64}$/.test(item.requestRoot) && /^sha256:[a-f0-9]{64}$/.test(item.inputRoot) && item.image === LAB_ADMITTED_ROOTS.image && item.tupleId === MATCH_KERNEL.tupleId && item.tupleRoot === LAB_ADMITTED_ROOTS.tupleRoot && item.runtimeLimitsRoot === LAB_ADMITTED_ROOTS.runtimeLimitsRoot
  }
  if (!exactLabKeys(allocation, keys) || allocation.schemaVersion !== "lean-private-probe-allocation-v1" || !/^[a-f0-9]{40,64}$/.test(allocation.sourceHead) || allocation.matchCount !== 0 || !Array.isArray(allocation.cases) || allocation.cases.length !== 4 || allocation.cases.some((item, ordinal) => !validCase(item, ordinal)) || !/^sha256:[a-f0-9]{64}$/.test(allocation.sourceRoot) || !/^sha256:[a-f0-9]{64}$/.test(allocation.executableRoot) || allocation.image !== LAB_ADMITTED_ROOTS.image || allocation.tupleId !== MATCH_KERNEL.tupleId || allocation.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || allocation.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || !/^sha256:[a-f0-9]{64}$/.test(allocation.costSnapshotRoot) || allocation.ceilings?.guestMs !== 1000 || allocation.ceilings.hostMs !== 5000 || allocation.ceilings.startupMs !== 2500 || allocation.ceilings.matchMs !== 600000) return privateProbeFail()
  const { root, ...body } = allocation
  if (root !== labRoot("lean-private-probe-allocation-v1", body) || allocation.cases.some(item => item.sourceRoot !== allocation.sourceRoot || item.executableRoot !== allocation.executableRoot || item.image !== allocation.image || item.tupleId !== allocation.tupleId || item.tupleRoot !== allocation.tupleRoot || item.runtimeLimitsRoot !== allocation.runtimeLimitsRoot)) return privateProbeFail()
  return freezeLabValue(structuredClone(allocation))
}

/** Sample process capacity in this process; receipts cannot be caller-constructed. */
export const observeLeanPrivateProbeCapacityV1 = (storePath: string): LeanPrivateProbeCapacityReceiptV1 => {
  observeLeanPrivateProbeResourcesV1(storePath)
  const path = resolve(storePath), stat = statfsSync(path), memory = process.memoryUsage()
  if (memory.rss > 3_000_000_000 || stat.bavail * stat.bsize < 2_000_000_000) return privateProbeFail()
  const receipt = Object.freeze({ schemaVersion: "lean-private-probe-capacity-v1" as const, toJSON: opaque })
  privateProbeCapacities.set(receipt, { startedAt: performance.now(), storePath: path })
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
  if (allocation.costSnapshotRoot !== LEAN_PRIVATE_PROBE_COST_ROOT) return privateProbeFail()
  if (!allocationBytes.equals(canonicalPrivateProbe(allocation))) return privateProbeFail()
  const output = readLeanPrivateProbeGitV1(["rev-list", "--parents", "-n", "1", input.allocationCommit]).toString("utf8").trim().split(/\s+/u)
  if (output.length !== 2 || output[1] !== allocation.sourceHead) return privateProbeFail()
  const committed = readLeanPrivateProbeGitV1(["show", `${input.allocationCommit}:${input.allocationPath}`])
  if (!Buffer.from(committed).equals(allocationBytes) || readLeanPrivateProbeGitV1(["rev-parse", "HEAD"]).toString("utf8").trim() !== input.allocationCommit) return privateProbeFail()
  const admission: LeanPrivateProbeAdmissionV1 = Object.freeze({ schemaVersion: "lean-private-probe-admission-v1", toJSON: opaque })
  privateProbeAdmissions.set(admission, { allocation, allocationBytes, allocationCommit: input.allocationCommit, allocationPath: input.allocationPath, storePath, nextOrdinal: 0, used: false })
  return admission
}

/** Append/fsync/reopen the exact next debit before minting a one-invocation handle. */
export const recordAndIssueLeanPrivateProbeRuntimeAuthorityV1 = (admission: LeanPrivateProbeAdmissionV1, invocation: LeanPrivateProbeInvocationV1, capacity: LeanPrivateProbeCapacityReceiptV1): LeanPrivateProbeRuntimeAuthority => {
  const state = privateProbeAdmissions.get(admission), receipt = privateProbeCapacities.get(capacity)
  // Uncertain issuance is terminal, even if the caller restores the files.
  if (state && !state.used) state.used = true
  else return privateProbeFail()
  if (!receipt || receipt.storePath !== state.storePath || performance.now() - receipt.startedAt > 30_000) return privateProbeFail()
  observeLeanPrivateProbeResourcesV1(state.storePath)
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
  privateProbeAuthorities.set(capability, { binding, claims: new Set() })
  state.nextOrdinal += 1
  state.used = state.nextOrdinal === state.allocation.cases.length
  return capability
}

export const claimLeanPrivateProbeRuntimeAuthority = (authority: LeanPrivateProbeRuntimeAuthority, binding: LeanPrivateProbeBindingV1, layer: Layer): LeanPrivateProbeBindingV1 => {
  const state = authority && privateProbeAuthorities.get(authority)
  if (!state || authority.schemaVersion !== "lean-private-probe-runtime-authority-v1" || !["factory", "planner", "session"].includes(layer) || state.claims.has(layer) || layer === "planner" && !state.claims.has("factory") || layer === "session" && !state.claims.has("planner") || labRoot("lean-private-probe-binding-v1", binding) !== labRoot("lean-private-probe-binding-v1", state.binding)) return privateProbeFail()
  state.claims.add(layer)
  return state.binding
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
