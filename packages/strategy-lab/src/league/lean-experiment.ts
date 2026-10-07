/** Private trusted-coordinator evidence. Never imported by the rules engine. */
import { createHash } from "node:crypto"
import { constants, openSync, closeSync, writeSync, fsyncSync, readFileSync, mkdirSync, lstatSync, realpathSync, readdirSync, statSync, statfsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { gzipSync, gunzipSync } from "node:zlib"
import { types as nodeTypes } from "node:util"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, exactLabKeys, freezeLabValue, type LabRoot } from "../contracts.js"

export const LEAN_CAPS = Object.freeze({ totalBytes: 15_000_000_000, retainedBytes: 12_000_000_000, scratchBytes: 2_000_000_000, terminalBytes: 1_000_000_000, elapsedMs: 28_800_000, matches: 300, matchMs: 600_000, guestMs: 1000, hostMs: 5000 })
export const LEAN_SUPERVISOR_V5_CAPS = Object.freeze({ ...LEAN_CAPS, elapsedMs: 43_200_000 })
export const LEAN_STARTUP_APPROVAL_ROOT: LabRoot = "sha256:a4dcbfbdfbe8303044b136a2581f9cc7f71399e356e39983bd88c5c25fd0c3c9"
export const LEAN_STARTUP_SUPPLEMENT_ROOT: LabRoot = "sha256:17dbc6af95308ec7527f019b3068760d3afcfd6a06c9241532ef126793b2a616"
const startupPolicyBody = { schemaVersion: "lean-startup-policy-v5", startupMs: 2500, guestMs: 1000, hostMs: 5000, cancellationMs: 100, receiptReserveMs: 1400 } as const
export const LEAN_STARTUP_POLICY_V5 = Object.freeze({ ...startupPolicyBody, root: labRoot("lean-startup-policy-v5", startupPolicyBody) })
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
export const LEAN_PROSPECTIVE_REQUEST = ".strategy-lab/lean-pilot-request-20261003-v3.json" as const
export const LEAN_PROSPECTIVE_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-experiment-20261003-v2-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v2.json", LEAN_PROSPECTIVE_REQUEST] as const)
export const LEAN_SUCCESSOR_REQUEST = ".strategy-lab/lean-pilot-request-20261003-v4.json" as const
export const LEAN_SUCCESSOR_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-experiment-20261003-v3-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v3.json", LEAN_SUCCESSOR_REQUEST] as const)
export const LEAN_V4_REQUEST = ".strategy-lab/lean-pilot-request-20261003-v5.json" as const
export const LEAN_V4_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-experiment-20261003-v4-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v4.json", LEAN_V4_REQUEST] as const)
export const LEAN_V5_REQUEST = ".strategy-lab/lean-pilot-request-20261003-v6.json" as const
export const LEAN_V5_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-experiment-20261003-v5-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v5.json", LEAN_V5_REQUEST] as const)
export const LEAN_V6_REQUEST = ".strategy-lab/lean-pilot-request-20261003-v7.json" as const
export const LEAN_V6_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-experiment-20261003-v6-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v6.json", LEAN_V6_REQUEST] as const)
export const LEAN_V7_REQUEST = ".strategy-lab/lean-pilot-request-20261004-v8.json" as const
export const LEAN_V7_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-experiment-20261004-v7-tmp", ".planning/artifacts/v1.38-lean-pilot-allocation-v7.json", LEAN_V7_REQUEST] as const)
export const LEAN_BASELINE_REQUEST = ".strategy-lab/lean-baseline-request-20261004-v1.json" as const
export const LEAN_BASELINE_STORE = ".strategy-lab/lean-baseline-20261004-v1" as const
export const LEAN_BASELINE_WRITABLE_PATHS = Object.freeze([".strategy-lab/lean-baseline-20261004-v1-tmp", ".planning/artifacts/v1.38-lean-current-baseline-allocation-v1.json", LEAN_BASELINE_REQUEST] as const)
/** Exactly two prospective correction identities. Historical routes stay closed. */
export const LEAN_CORRECTION_ROUTES = Object.freeze({
  diagnostic: Object.freeze({ store: ".strategy-lab/lean-correction-diagnostic-20261004-v1", request: ".strategy-lab/lean-correction-diagnostic-request-20261004-v1.json", allocation: ".planning/artifacts/v1.38-lean-correction-diagnostic-allocation-v1.json", check: "correction-diagnostic-check.json", temp: ".strategy-lab/lean-correction-diagnostic-20261004-v1-tmp" }),
  baseline: Object.freeze({ store: ".strategy-lab/lean-correction-baseline-20261004-v1", request: ".strategy-lab/lean-correction-baseline-request-20261004-v1.json", allocation: ".planning/artifacts/v1.38-lean-correction-baseline-allocation-v1.json", check: "correction-baseline-check.json", temp: ".strategy-lab/lean-correction-baseline-20261004-v1-tmp" }),
})
/** Separate prospective identities; never change the consumed v1 family. */
export const LEAN_SUPERVISOR_CORRECTION_ROUTES = Object.freeze({
  diagnostic: Object.freeze({ store: ".strategy-lab/lean-correction-supervisor-diagnostic-20261004-v2", request: ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261004-v2.json", allocation: ".planning/artifacts/v1.38-lean-correction-supervisor-diagnostic-allocation-v2.json", check: "correction-supervisor-diagnostic-check-v2.json", temp: ".strategy-lab/lean-correction-supervisor-diagnostic-20261004-v2-tmp", result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" }),
  baseline: Object.freeze({ store: ".strategy-lab/lean-correction-supervisor-baseline-20261004-v2", request: ".strategy-lab/lean-correction-supervisor-baseline-request-20261004-v2.json", allocation: ".planning/artifacts/v1.38-lean-correction-supervisor-baseline-allocation-v2.json", check: "correction-supervisor-baseline-check-v2.json", temp: ".strategy-lab/lean-correction-supervisor-baseline-20261004-v2-tmp", result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" }),
})
export const LEAN_SUPERVISOR_SETUP_PATH = ".strategy-lab/lean-correction-supervisor-setup-20261004-v2.json"
export type LeanRetryOrdinal = 1 | 2 | 3
export type LeanRetryMode = `v8-${LeanRetryOrdinal}` | `v9-${LeanRetryOrdinal}`
export type LeanSupervisorMode = boolean | "v3" | "v4" | "v5" | "v6" | "v7" | LeanRetryMode
export const isLeanRemainingBudgetMode = (mode: unknown): mode is `v9-${LeanRetryOrdinal}` => mode === "v9-1" || mode === "v9-2" || mode === "v9-3"
export const isLeanRetryMode = (mode: unknown): mode is LeanRetryMode => mode === "v8-1" || mode === "v8-2" || mode === "v8-3" || isLeanRemainingBudgetMode(mode)
export const leanRetryOrdinal = (mode: LeanSupervisorMode): LeanRetryOrdinal => isLeanRetryMode(mode) ? Number(mode.slice(-1)) as LeanRetryOrdinal : fail("RETRY_ORDINAL")
export const LEAN_RETRY_V8_APPROVAL_ROOT: LabRoot = "sha256:f60084e7d4b34f0f83e6432df1cd0468c9668c83f30be9c7cedd890667373ab1"
export const LEAN_RETRY_V8_PLAN_ROOT: LabRoot = "sha256:becc43f0198ca37376343fa52c9f10b590cd3588ddac45e820b072163d5326d6"
export const LEAN_RETRY_V8_CARRY = Object.freeze({ charged: 29, priorElapsedMs: 49_150_573, startedAtMs: 1791299252280, closedElapsedMs: 47_361_631, readerCloseMs: 1791295466715, allocationBytesRoot: "sha256:937a2bb49f6de7680a81601be727718055c11f8ed3bc471f1a2749d6c1273861" as LabRoot, timeBytesRoot: "sha256:63aceedab50124d68978631e567e78fecee558accc7f27067cb8f56f2ae05223" as LabRoot })
export const LEAN_RETRY_V8_POLICY = Object.freeze({ schemaVersion: "lean-retry-envelope-policy-v8", attemptOrdinals: [1, 2, 3] as const, maximumBaselines: 1, startupVersion: 7, approvalRoot: LEAN_RETRY_V8_APPROVAL_ROOT, planRoot: LEAN_RETRY_V8_PLAN_ROOT })
/** Additive prospective authority. Never changes the historical v8 policy/carry. */
const retryTimeboxBody = { schemaVersion: "lean-retry-timebox-extension-v8-v1", approvalRoot: "sha256:a60a562ea5697055e5f949c47234587c6c89109c9e97de0ddeb3f1e2109bf043" as LabRoot, planRoot: "sha256:7c6438011ac1316ea78b00a77a78bedfc32075907277f6a2b6e78c948e9580d4" as LabRoot, predecessorPolicyRoot: labRoot(LEAN_RETRY_V8_POLICY.schemaVersion, LEAN_RETRY_V8_POLICY), priorElapsedMs: 56_000_917, startedAtMs: 1791326194166, elapsedMs: 72_000_000, charged: 29, excludedIdleMs: 20_091_542, turnId: "01a1135c-8975-7330-98ad-8d24374dd0cd" } as const
export const LEAN_RETRY_V8_TIMEBOX_EXTENSION = Object.freeze({ ...retryTimeboxBody, root: labRoot(retryTimeboxBody.schemaVersion, retryTimeboxBody) })
const bookkeepingBody = {
  schemaVersion: "lean-retry-bookkeeping-continuation-v8-v1", attemptOrdinal: 2,
  approvalRoot: "sha256:fb43e7111786dd8016b20e51fb0c84c9fad3333b86ec694f2ffc8a8f456a0d27" as LabRoot,
  planRoot: "sha256:1085418da15ef73ceb205ca97dde0d5f1c8df7d2260bd5caf6d02d2ace96fc97" as LabRoot,
  predecessorPolicyRoot: retryTimeboxBody.predecessorPolicyRoot, predecessorExtensionRoot: LEAN_RETRY_V8_TIMEBOX_EXTENSION.root,
  priorElapsedMs: 62_024_083, startedAtMs: 1791335391279, previousCompletedAtMs: 1791332217332,
  elapsedMs: 72_000_000, charged: 30, excludedIdleMs: 3_173_947, turnId: "01a113e8-dfdc-7951-aed2-aafdd8cee95c",
  completionEventBytesRoot: "sha256:62e06206ecbf48230f93d9154081acf38bae9a26dacea25dcd091dfa2675e2f0" as LabRoot,
  startEventBytesRoot: "sha256:b5f7655ff7b6137e3fac5ed6fa8f4bfe04ff03e477164b75fff3b61a1f98ad70" as LabRoot,
  diagnosticClosureRoot: "sha256:6dcab26064d1fcb880518afc3716b0ed05812fb88c692525f94640681f78e830" as LabRoot,
  diagnosticClosureBytesRoot: "sha256:4371ca8d328460832a5c304f965b1a57c67de439fb509ac3085dc46c841f4e70" as LabRoot,
  diagnosticCheckRoot: "sha256:72ae7d0797b482fbe756e39fd3d9708b935c5106d06bad6e682a87601c2aae71" as LabRoot,
  baselineAllocationRoot: "sha256:851e13373686f825be17db4fdba70c52b3a6c586bf9822daeee14ded4757e16c" as LabRoot,
  baselineSourceRoot: "sha256:9ba555e78f094004ea29229672d587f7d08a3ace06974d26219d61727a1441a6" as LabRoot,
  baselineHead: "1b5f59d62704cf6672b4ba2953925ddede8a9957",
  baselineRawRoots: {
    "allocation.json": "sha256:0e5c9a9ae8ed11b60139c87896028b6ba88af7b984bdd002ddffae1df5e4d8d5",
    request: "sha256:77f41d3db3986281c6b7920ca23a6cad53457ed41bf2407112a28bfafd30e470",
    "entry.json": "sha256:167cde487500ae94eb83e8488d8242ce0c153ecc7d863512cb4e2dcbdad528cf",
    "child-terminal.json": "sha256:cc29918971dc5f93a1989113d5d27d3f82b74327b2c95ec5725d70d8ea28645b",
    "parent-supervisor-reasons.json": "sha256:c5abccf652a78c2bda702c1f06014c9ed86265303c8863181c3dee561428a390",
    "time.ndjson": "sha256:e98afdf741ef5de80eddd95ec66b6cc11c580d185e6917008c7afcdaea020478",
    "ledger.ndjson": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
} as const
export const LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION = freezeLabValue({ ...bookkeepingBody, root: labRoot(bookkeepingBody.schemaVersion, bookkeepingBody) })
/** Fresh family selected ONLY by this exact binding, not by allocation ordinal. */
const remainingBody = { schemaVersion: "lean-remaining-budget-envelope-v9", approvalRoot: "sha256:6e232516a77868bfff90f1f0d71a0322ca93c66e5d0b7e2adf6362afe3136576" as LabRoot, planRoot: "sha256:278850a7f44773b1f68bd92f38ad92f6f16de5f8dead6481af09bc0dd4c1e046" as LabRoot, predecessorExtensionRoot: LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION.root, priorElapsedMs: 64_594_435, startedAtMs: 1791346557488, previousCompletedAtMs: 1791337961631, elapsedMs: 72_000_000, charged: 30, excludedIdleMs: 8_595_857, maximumDiagnostics: 3, maximumBaselines: 1, reserveMs: 1_860_000, historicalRows: 367, physicalFloorBytes: 14_864_384, turnId: "01a11493-41e8-76d2-9d63-08e5a7d16ac3", completionEventBytesRoot: "sha256:f62a0d92fadfe9042f09b0291259248a849327b517dae9938b6ac6c70d520530" as LabRoot, startEventBytesRoot: "sha256:8f8c5248d853f44730cef0b8029127c194b8921abea3b56fcd5ec40d27a234a0" as LabRoot } as const
export const LEAN_REMAINING_V9_EXTENSION = freezeLabValue({ ...remainingBody, root: labRoot(remainingBody.schemaVersion, remainingBody) })
export type LeanRetryTimeboxExtension = typeof LEAN_RETRY_V8_TIMEBOX_EXTENSION | typeof LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION | typeof LEAN_REMAINING_V9_EXTENSION
export const isLeanRemainingBudgetExtensionV9 = (value: LeanRetryTimeboxExtension | undefined): value is typeof LEAN_REMAINING_V9_EXTENSION => value?.schemaVersion === "lean-remaining-budget-envelope-v9"
export const isLeanBookkeepingContinuationV8 = (value: LeanRetryTimeboxExtension | undefined): value is typeof LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION => value?.schemaVersion === "lean-retry-bookkeeping-continuation-v8-v1"
export const admitLeanRetryTimeboxExtension = (value: unknown): LeanRetryTimeboxExtension => {
  for (const expected of [LEAN_RETRY_V8_TIMEBOX_EXTENSION, LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION, LEAN_REMAINING_V9_EXTENSION]) {
    if (exactLabKeys(value, Object.keys(expected)) && labRoot("lean-retry-timebox-admission-v8", value) === labRoot("lean-retry-timebox-admission-v8", expected)) return expected
  }
  return fail("RETRY_TIMEBOX")
}
/** Exact failed baseline metadata, never ordinary retained evidence or success. */
export const validateLeanBookkeepingBaselineCustodyV8 = (value: unknown): void => {
  const b = LEAN_RETRY_V8_BOOKKEEPING_CONTINUATION
  if (!exactLabKeys(value, ["allocationRoot", "sourceRoot", "head", "rawRoots", "charged", "currentCharges", "currentTerminals", "active", "resultExists", "checkExists", "terminalStatus", "exitCode", "signal", "closedIntervals", "intervalTimes"])) return fail("RETRY_PREDECESSOR")
  const v = value as Record<string, unknown>
  if (v.allocationRoot !== b.baselineAllocationRoot || v.sourceRoot !== b.baselineSourceRoot || v.head !== b.baselineHead || labRoot("lean-bookkeeping-baseline-raw-v8", v.rawRoots) !== labRoot("lean-bookkeeping-baseline-raw-v8", b.baselineRawRoots) || v.charged !== 30 || v.currentCharges !== 0 || v.currentTerminals !== 0 || v.active !== false || v.resultExists !== false || v.checkExists !== false || v.terminalStatus !== "child_failed" || v.exitCode !== null || v.signal !== "SIGKILL" || labRoot("lean-bookkeeping-baseline-intervals-v8", v.closedIntervals) !== labRoot("lean-bookkeeping-baseline-intervals-v8", ["correction-preparation", "pilot-entry", "correction-run-finalization"]) || labRoot("lean-bookkeeping-baseline-times-v8", v.intervalTimes) !== labRoot("lean-bookkeeping-baseline-times-v8", [1791330138520, 1791330177618, 1791330177618, 1791330306049, 1791330306049, 1791330306250])) return fail("RETRY_PREDECESSOR")
}
/** Only the approved closed ordinal1 prefix crosses the new human-idle gap. */
export const leanRetryClosedPrefixFloorV8 = (closedElapsedMs: number, readerCloseMs: number, observedMs: number, ordinal: number, extension?: LeanRetryTimeboxExtension): number => {
  if (isLeanBookkeepingContinuationV8(extension) && ordinal === 1) {
    admitLeanRetryTimeboxExtension(extension)
    if (!natural(closedElapsedMs) || closedElapsedMs > extension.priorElapsedMs || !natural(readerCloseMs) || readerCloseMs > extension.previousCompletedAtMs || observedMs < extension.startedAtMs) return fail("RETRY_PREDECESSOR")
    return leanRetryRootElapsedFloorV8(observedMs, extension)
  }
  return closedElapsedMs + observedMs - readerCloseMs
}
export const LEAN_RETRY_V8_TIMEBOX_CAPS = Object.freeze({ ...LEAN_CAPS, elapsedMs: 72_000_000 })
export const leanRetrySetupPath = (mode: LeanRetryMode) => `.strategy-lab/lean-retry-envelope-setup-${isLeanRemainingBudgetMode(mode) ? "20261007" : "20261006"}-${mode}.json`
const retryPaths = Object.freeze(Object.fromEntries(([1, 2, 3] as const).map(n => {
  const routes = Object.fromEntries((["diagnostic", "baseline"] as const).map(route => [route, Object.freeze({ store: `.strategy-lab/lean-correction-supervisor-${route}-20261006-v8-${n}`, request: `.strategy-lab/lean-correction-supervisor-${route}-request-20261006-v8-${n}.json`, allocation: `.planning/artifacts/v1.38-lean-correction-supervisor-${route}-allocation-v8-${n}.json`, check: `correction-supervisor-${route}-check-v8-${n}.json`, temp: `.strategy-lab/lean-correction-supervisor-${route}-20261006-v8-${n}-tmp`, result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" })]))
  return [n, Object.freeze(routes)]
})) as unknown as Readonly<Record<LeanRetryOrdinal, typeof LEAN_STARTUP_V5_ROUTES>>)
const remainingPaths = Object.freeze(Object.fromEntries(([1, 2, 3] as const).map(n => [n, Object.freeze(Object.fromEntries((["diagnostic", "baseline"] as const).map(route => [route, Object.freeze({ store: `.strategy-lab/lean-correction-supervisor-${route}-20261007-v9-${n}`, request: `.strategy-lab/lean-correction-supervisor-${route}-request-20261007-v9-${n}.json`, allocation: `.planning/artifacts/v1.38-lean-correction-supervisor-${route}-allocation-v9-${n}.json`, check: `correction-supervisor-${route}-check-v9-${n}.json`, temp: `.strategy-lab/lean-correction-supervisor-${route}-20261007-v9-${n}-tmp`, result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" })])))])) as Readonly<Record<LeanRetryOrdinal, typeof LEAN_STARTUP_V5_ROUTES>>)
export const LEAN_REPLAY_V7_CAPS = Object.freeze({ ...LEAN_CAPS, elapsedMs: 57_600_000 })
export const LEAN_REPLAY_V7_APPROVAL_ROOT: LabRoot = "sha256:efe40c8d84c7191ac444ebbe47d1c7c1bb3b5f586a44f11438564ce9effd035b"
export const LEAN_REPLAY_V7_SUPPLEMENT_ROOT: LabRoot = "sha256:a54314594ab48cd309067e61edfd2728320d74fd53c518218545f3ba2f9876a7"
export const LEAN_REPLAY_V7_POLICY = Object.freeze({ identity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-POLICY-v1.json", bytesRoot: "sha256:23f576bf3fec786b9c4533678823aa3441d33411bc3c45969439fb5809549ff3" as LabRoot })
export const LEAN_REPLAY_V7_SETUP_PATH = ".strategy-lab/lean-correction-supervisor-setup-20261006-v7.json"
export const LEAN_REPLAY_V7_ROUTES = Object.freeze(Object.fromEntries((["diagnostic", "baseline"] as const).map(route => [route, Object.freeze({ store: `.strategy-lab/lean-correction-supervisor-${route}-20261006-v7`, request: `.strategy-lab/lean-correction-supervisor-${route}-request-20261006-v7.json`, allocation: `.planning/artifacts/v1.38-lean-correction-supervisor-${route}-allocation-v7.json`, check: `correction-supervisor-${route}-check-v7.json`, temp: `.strategy-lab/lean-correction-supervisor-${route}-20261006-v7-tmp`, result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" })])) as typeof LEAN_STARTUP_V5_ROUTES)
export const LEAN_REPLAY_V7_CARRY = Object.freeze({ charged: 28, priorElapsedMs: 41_943_494, startedAtMs: 1791290048578, closedElapsedMs: 41_342_676, effectiveCloseMs: 1791252224672, physicalFloorBytes: 12_894_208,
  allocationRoot: "sha256:df4c4e9046bc0dab740b5b69d44a45a0285629c07868a2c3ece1abd874c1e9a6" as LabRoot,
  roots: Object.freeze({ allocation: "sha256:500dc17163bd4d0d1b7523d4dae41c75bfb7bd79bc72a61bedf6523acfc02904", request: "sha256:de8be0f989891530dcb1a4e597e9148c311f10c08a2bc6f2292949ff10e6e4db", entry: "sha256:9761b57704a6a87fc833931201e7e6bccade8e84a43b119047fed0be0fc19ca9", terminal: "sha256:97b17e4daa84b1aa3152adcfe33228bff4e1d8728c0ea0ac6591820d3bf13d77", reason: "sha256:e6dbaabd63442af4c90690f12cd3b6f25015d88e9962cccebc34ce92afe917d2", time: "sha256:f338c44b8d32911849e8817d0ecabb76999c246e9833d7455eb617a004a3d669", ledger: "sha256:3c3adc922c3d4ebaad3ba2eb2b569ab96c079db14218331fe371ccde028d2a4a" }) })
/** Exact finite failed-prefix custody. Never infer a missing stop/result/terminal. */
export const validateLeanReplayV7PredecessorCustody = (value: unknown): void => {
  if (!exactLabKeys(value, ["allocationRoot", "rawRoots", "charged", "currentCharges", "currentTerminals", "nonterminalOrdinal", "stopped", "resultExists", "closedElapsedMs", "effectiveCloseMs", "active"])) return fail("SUPERVISOR_PREDECESSOR")
  const v = value as Record<string, unknown>, c = LEAN_REPLAY_V7_CARRY
  if (v.allocationRoot !== c.allocationRoot || labRoot("lean-v7-predecessor-raw", v.rawRoots) !== labRoot("lean-v7-predecessor-raw", c.roots) || v.charged !== 28 || v.currentCharges !== 3 || v.currentTerminals !== 2 || v.nonterminalOrdinal !== 2 || v.stopped !== false || v.resultExists !== false || v.closedElapsedMs !== c.closedElapsedMs || v.effectiveCloseMs !== c.effectiveCloseMs || v.active !== false) return fail("SUPERVISOR_PREDECESSOR")
}
export const LEAN_REPLAY_V6_APPROVAL_ROOT: LabRoot = "sha256:4372b0337c16545738937f4a92f5a21cf25973ae0b6b650e5c26d7e14e8f8932"
export const LEAN_REPLAY_V6_SUPPLEMENT_ROOT: LabRoot = "sha256:4b2f7426e91d842b64ea41af63381fdc60f9a3e843ce651745757ee58b97bc21"
export const LEAN_REPLAY_V6_SETUP_PATH = ".strategy-lab/lean-correction-supervisor-setup-20261006-v6.json"
export const LEAN_REPLAY_V6_CARRY = Object.freeze({ charged: 24, priorElapsedMs: 36_151_532, startedAtMs: 1791247033529, readerCloseMs: 1791242322180, closedElapsedMs: 33_812_347, physicalFloorBytes: 10_432_512, allocationRoot: "sha256:602a7e1b2869935b03a683943c220d0d7581a10119aa273ef1197633cb3a2d02" as LabRoot, allocationBytesRoot: "sha256:0a765ce8e2b91a880c27ed69dbcb235de2ab7c1e12de0c99da4a10e8ecc62111" as LabRoot, timeBytesRoot: "sha256:8d9a3adedb736731e32c3ef75279b3da7c7f608585b0e0826954c297b28d5c0d" as LabRoot, terminalBytesRoot: "sha256:00419d07df57a590288349013170461817bb8656dfc827181d3d1941d70fb114" as LabRoot })
/** Finite custody only. Empty charges do not imply a stop record. */
export const validateLeanReplayV6PredecessorCustody = (value: unknown): void => {
  if (!exactLabKeys(value, ["allocationRoot", "allocationBytesRoot", "timeBytesRoot", "terminalBytesRoot", "ledgerBytesRoot", "charged", "closedElapsedMs", "readerCloseMs", "active"])) return fail("SUPERVISOR_PREDECESSOR")
  const v = value as Record<string, unknown>
  for (const key of ["allocationRoot", "allocationBytesRoot", "timeBytesRoot", "terminalBytesRoot", "charged", "closedElapsedMs", "readerCloseMs"] as const) if (v[key] !== LEAN_REPLAY_V6_CARRY[key]) return fail("SUPERVISOR_PREDECESSOR")
  if (v.active !== false || v.ledgerBytesRoot !== leanBytesRoot(new Uint8Array())) return fail("SUPERVISOR_PREDECESSOR")
}
export const LEAN_REPLAY_V6_ROUTES = Object.freeze(Object.fromEntries((["diagnostic", "baseline"] as const).map(route => [route, Object.freeze({ store: `.strategy-lab/lean-correction-supervisor-${route}-20261006-v6`, request: `.strategy-lab/lean-correction-supervisor-${route}-request-20261006-v6.json`, allocation: `.planning/artifacts/v1.38-lean-correction-supervisor-${route}-allocation-v6.json`, check: `correction-supervisor-${route}-check-v6.json`, temp: `.strategy-lab/lean-correction-supervisor-${route}-20261006-v6-tmp`, result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" })])) as typeof LEAN_STARTUP_V5_ROUTES)
export const LEAN_STARTUP_V5_ROUTES = Object.freeze(Object.fromEntries((["diagnostic", "baseline"] as const).map(route => [route, Object.freeze({ store: `.strategy-lab/lean-correction-supervisor-${route}-20261005-v5`, request: `.strategy-lab/lean-correction-supervisor-${route}-request-20261005-v5.json`, allocation: `.planning/artifacts/v1.38-lean-correction-supervisor-${route}-allocation-v5.json`, check: `correction-supervisor-${route}-check-v5.json`, temp: `.strategy-lab/lean-correction-supervisor-${route}-20261005-v5-tmp`, result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" })])) as Record<"diagnostic" | "baseline", Readonly<{ store: string; request: string; allocation: string; check: string; temp: string; result: string; owner: string; reason: string }>>)
export const LEAN_STARTUP_V5_SETUP_PATH = ".strategy-lab/lean-correction-supervisor-setup-20261005-v5.json"
export const LEAN_FRESH_SUPERVISOR_ROUTES = Object.freeze({
  diagnostic: Object.freeze({ store: ".strategy-lab/lean-correction-supervisor-diagnostic-20261005-v3", request: ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261005-v3.json", allocation: ".planning/artifacts/v1.38-lean-correction-supervisor-diagnostic-allocation-v3.json", check: "correction-supervisor-diagnostic-check-v3.json", temp: ".strategy-lab/lean-correction-supervisor-diagnostic-20261005-v3-tmp", result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" }),
  baseline: Object.freeze({ store: ".strategy-lab/lean-correction-supervisor-baseline-20261005-v3", request: ".strategy-lab/lean-correction-supervisor-baseline-request-20261005-v3.json", allocation: ".planning/artifacts/v1.38-lean-correction-supervisor-baseline-allocation-v3.json", check: "correction-supervisor-baseline-check-v3.json", temp: ".strategy-lab/lean-correction-supervisor-baseline-20261005-v3-tmp", result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" }),
})
export const LEAN_REPAIRED_READER_ROUTES = Object.freeze({
  diagnostic: Object.freeze({ store: ".strategy-lab/lean-correction-supervisor-diagnostic-20261005-v4", request: ".strategy-lab/lean-correction-supervisor-diagnostic-request-20261005-v4.json", allocation: ".planning/artifacts/v1.38-lean-correction-supervisor-diagnostic-allocation-v4.json", check: "correction-supervisor-diagnostic-check-v4.json", temp: ".strategy-lab/lean-correction-supervisor-diagnostic-20261005-v4-tmp", result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" }),
  baseline: Object.freeze({ store: ".strategy-lab/lean-correction-supervisor-baseline-20261005-v4", request: ".strategy-lab/lean-correction-supervisor-baseline-request-20261005-v4.json", allocation: ".planning/artifacts/v1.38-lean-correction-supervisor-baseline-allocation-v4.json", check: "correction-supervisor-baseline-check-v4.json", temp: ".strategy-lab/lean-correction-supervisor-baseline-20261005-v4-tmp", result: "result.json", owner: "entry.json", reason: "parent-supervisor-reasons.json" }),
})
export const LEAN_REPAIRED_READER_SETUP_PATH = ".strategy-lab/lean-correction-supervisor-setup-20261005-v4.json"
export const LEAN_FRESH_SUPERVISOR_SETUP_PATH = ".strategy-lab/lean-correction-supervisor-setup-20261005-v3.json"
export const leanSupervisorVersion = (mode: LeanSupervisorMode): 2 | 3 | 4 | 5 | 6 | 7 | 8 => isLeanRetryMode(mode) ? 8 : mode === "v7" ? 7 : mode === "v6" ? 6 : mode === "v5" ? 5 : mode === "v4" ? 4 : mode === "v3" ? 3 : typeof mode === "boolean" ? 2 : fail("ALLOCATION_VERSION")
/** Closed v7 pilot identities are an accounting predecessor, not a second pilot verdict. */
export const LEAN_CLOSED_V7 = Object.freeze({
  storeIdentity: ".strategy-lab/lean-experiment-20261004-v7" as const,
  requestIdentity: LEAN_V7_REQUEST,
  canonicalIdentity: LEAN_V7_WRITABLE_PATHS[1],
  reportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-RETAINED-VERIFICATION-v2.md" as const,
  allocationRoot: "sha256:d884bda81501efd67a9570ae2bb316c652b6958eb3f9e3f0144d24c294b740fe" as LabRoot,
  allocationBytesRoot: "sha256:41a60f63b732d56e860fbe247f655e88508196c501a594f8f9e7d97df366d19b" as LabRoot,
  requestBytesRoot: "sha256:cc0dffaf655b0ed408ae6d7b1fef6dcf9cfd59206224da7ac3084a867bb2c92d" as LabRoot,
  resultBytesRoot: "sha256:ab4d351ba1ea0363f90fb2fb32a3995f1744db06455ba2987d50c7e1775d54d5" as LabRoot,
  ledgerBytesRoot: "sha256:1a76b1b2aba8f8d291f40e458692a5690c5e98b2c157db34849fefd4a2d16c69" as LabRoot,
  timeBytesRoot: "sha256:891d71cb55b387b959f6413527238ebdb7ce9b4529ffd0e0c22c26093a7fab7f" as LabRoot,
  entryBytesRoot: "sha256:7a5f050495799883aa1bb037cf8abc3499e6427bb56fecd3766d7a6f5de68594" as LabRoot,
  terminalBytesRoot: "sha256:c2e2f3cf1942f7dc530ead1a1f105a93f3cbef7ed0f8a1f9347fb228dce6df4f" as LabRoot,
  replayBytesRoot: "sha256:56ea0d33648258925206bf1c39529fffc029d1ee36d92bccbc91e1eedf4a4b94" as LabRoot,
  reportBytesRoot: "sha256:5073295bd57b5136ce2628abb504bb2a65a63bef813c0734d153aee8348db569" as LabRoot,
  replayName: "69efdfe1d98cf9c8680c0ba87f73ab799e7cd5af591e81925f77de4f3d301aef.gz" as const,
  sourceRoot: "sha256:83abe344f7d71bf4cd2aa78c2f73fbb8a59c40996c0999536e534b5245f7a590" as LabRoot,
  heldHead: "5aa4c4a16548b0ac02ed2743b65217fc92d21057" as const,
  priorPredecessorRoot: "sha256:5ae17d98572ba3572f94016ca56da5e4569e40d8c39cb43078d95ae8059b128f" as LabRoot,
  priorMeasuredSurvivingAllocatedBytes: 208_896,
  priorConservativeAllocatedBytes: 516_096,
  terminalPhysicalBytes: 897_024,
  elapsedUpperBoundMs: 3_305_606,
  chargedMatches: 9,
  successfulMatches: 8,
})
export const LEAN_CLOSED_V2 = Object.freeze({
  storeIdentity: ".strategy-lab/lean-experiment-20261003-v2" as const,
  requestIdentity: LEAN_PROSPECTIVE_REQUEST,
  canonicalIdentity: ".planning/artifacts/v1.38-lean-pilot-allocation-v2.json" as const,
  allocationRoot: "sha256:4a3dfb516d13c6c0816185af30e0d9b6b516752091ac525639bcf91474c4d846" as LabRoot,
  allocationBytesRoot: "sha256:bc7789b14530c4f585ce006bbe8576c57421621fed3f0e74b0172febcf3ec1fb" as LabRoot,
  requestBytesRoot: "sha256:3c2abfd6d3171efaedd5fa9fe72b006bcb76dcd98a91156c31c066ee43a9cd3d" as LabRoot,
  entryBytesRoot: "sha256:842c1ce65d419ee92a1e0bb9d3be5f6250616dbdb29f55e84495481bdf8ea438" as LabRoot,
  terminalBytesRoot: "sha256:74fc7885311158e587a101fc06b7cae4b52dae6597740c150cdfaa8637c9510a" as LabRoot,
  timeBytesRoot: "sha256:5272c9f354a5baf8bab1eab1fa501183804b8e307a73493ab18e870c1eb8d523" as LabRoot,
  emptyChargeBytesRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" as LabRoot,
  heldHead: "8961bf9b485e16cdd7ac49f44f98be0daa88e534" as const,
  sourceRoot: "sha256:28dbd0ec7de8954d53ffa67ff3b4db34b0a6c6f0ec02b501950f1ef7c8d58695" as LabRoot,
  terminalReportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v2.md" as const,
  terminalReportBytesRoot: "sha256:4d7afc3e7333f649333ea8ef8f356d46cfe55ea891851e8d3f8c6d851cddcb1c" as LabRoot,
  v1DiskBasisRoot: "sha256:7e203d25baaa1b295691943f2af02af6d468409018b9cf224454780052e7aa7f" as LabRoot,
  v1SurvivingAllocatedBytes: 20_480,
  terminalElapsedUpperBoundMs: 757_571,
  terminalPhysicalBytes: 114_688,
  elapsedUpperBoundMs: 1_323_030,
  chargedMatches: 0,
})
export const LEAN_CLOSED_V3 = Object.freeze({
  storeIdentity: ".strategy-lab/lean-experiment-20261003-v3" as const,
  requestIdentity: LEAN_SUCCESSOR_REQUEST,
  canonicalIdentity: ".planning/artifacts/v1.38-lean-pilot-allocation-v3.json" as const,
  allocationRoot: "sha256:46bf3f4b4ddd7fa3dbf4d1c44ba3bc8c7833c6c7afab9d62615b69c758818226" as LabRoot,
  allocationBytesRoot: "sha256:aadc20e1e1355b723f2771797969cba85445d4d8df47cd1da72616d012b13920" as LabRoot,
  requestBytesRoot: "sha256:1ce6b4ce6197f0d276e2f299a6f3724300ab9ddc793984fe9cee413be5493014" as LabRoot,
  entryBytesRoot: "sha256:9164628789ef3faa4ea953091113884753d1f5129af01f79bd0c443d7b827127" as LabRoot,
  receiptBytesRoot: "sha256:d8200b485f6aa73c7e37dd2c233766db62f7480f22133659f8abc6f0b45eb2fd" as LabRoot,
  terminalBytesRoot: "sha256:0d63ac6c5710faa7fb1b1d61d4eaee695ad7d2acb1925e752cebbf3679f70c8b" as LabRoot,
  timeBytesRoot: "sha256:cbca698eda8c182dd47cbe35e34a3feed83d817e31971a0e6a30e46870a733ed" as LabRoot,
  emptyChargeBytesRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" as LabRoot,
  heldHead: "4f728e055a18b011fa5382eaacbe881ea36c79ec" as const,
  sourceRoot: "sha256:0c88f6ba85d010617d9902edf872f3dd5bb53dedef9228df7881b5b1c6035080" as LabRoot,
  terminalReportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v3.md" as const,
  terminalReportBytesRoot: "sha256:72d24058b46cf579b6962f4f8ac2bc4c091d9988638be94d5e97290175ff28df" as LabRoot,
  priorPredecessorRoot: "sha256:09e1f9eee6bed18ce1c42bee5aa4f2eb6a99960dd4482e28f61ee3c8402b9a4d" as LabRoot,
  priorMeasuredSurvivingAllocatedBytes: 53_248,
  priorConservativeAllocatedBytes: 114_688,
  terminalElapsedUpperBoundMs: 39_446,
  terminalPhysicalBytes: 212_992,
  elapsedUpperBoundMs: 1_362_476,
  chargedMatches: 0,
})
export const LEAN_CLOSED_V4 = Object.freeze({
  storeIdentity: ".strategy-lab/lean-experiment-20261003-v4" as const,
  requestIdentity: LEAN_V4_REQUEST,
  canonicalIdentity: ".planning/artifacts/v1.38-lean-pilot-allocation-v4.json" as const,
  allocationRoot: "sha256:ec9cc8bbd0648042c2a94120c74fb4fda2744fa509c59f1836a5dc45f8ff6ce7" as LabRoot,
  allocationBytesRoot: "sha256:9accf6e1cd147911f060c7d2cb85ec9783e65346195084c2e0197cc03d66a61d" as LabRoot,
  requestBytesRoot: "sha256:159c74ded8312a154d6ba085349fe889268e7fc9e3e4be5a1f72dedfac2c5182" as LabRoot,
  entryBytesRoot: "sha256:a777cb3119ff2201ffdc3bb92381da2443098c1207cf56e0d30fd426644702ac" as LabRoot,
  receiptBytesRoot: "sha256:a42aba8742baeccb33ed26d550ac6339e022a8ad26b87d6608ea58e687b918e6" as LabRoot,
  terminalBytesRoot: "sha256:0714c37b1a6bb8658d4eed9a22f802932d4cae145bccd69a567b0e814e7ef76b" as LabRoot,
  timeBytesRoot: "sha256:f4dc79aaa7df0627236c3f2bcc95cbfb3bcd71358184d4a3db8ea5fe4a97a4ef" as LabRoot,
  emptyChargeBytesRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" as LabRoot,
  heldHead: "1fe30e56a8a708905fd2f1cb5dc95b71f3acc1c8" as const,
  sourceRoot: "sha256:9ac5823e745dd907b4ea3540e8892ca39f6026010b28f9932af36099db9827ff" as LabRoot,
  terminalReportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v4.md" as const,
  terminalReportBytesRoot: "sha256:858d141008736e58d436e28aed54a9ff024e78d6d23127431f738bf06aeb1e93" as LabRoot,
  priorPredecessorRoot: "sha256:c104e78ab1273667c602cea418284003aa8a9b32ebe49bf28e607a471b619224" as LabRoot,
  priorMeasuredSurvivingAllocatedBytes: 90_112,
  priorConservativeAllocatedBytes: 212_992,
  terminalElapsedUpperBoundMs: 39_966,
  terminalPhysicalBytes: 311_296,
  elapsedUpperBoundMs: 1_402_442,
  chargedMatches: 0,
})
export const LEAN_CLOSED_V5 = Object.freeze({
  storeIdentity: ".strategy-lab/lean-experiment-20261003-v5" as const,
  requestIdentity: LEAN_V5_REQUEST,
  canonicalIdentity: ".planning/artifacts/v1.38-lean-pilot-allocation-v5.json" as const,
  allocationRoot: "sha256:0da37dd99cacfc659f6c34f72b223c5aa9618d00cb0be588c3a452b72b537f45" as LabRoot,
  allocationBytesRoot: "sha256:f263279e4e8366b7c90d0689bbde5faef032514a14fec7ce5597b2707ec7555a" as LabRoot,
  requestBytesRoot: "sha256:7c02bb9de301563f614fe8035f5127c78a71a93672bae8e691388d781c448c4f" as LabRoot,
  entryBytesRoot: "sha256:274ff16739d89d89550ece0c4d98252e0e15e11153230f9b7389a70f057a6e7b" as LabRoot,
  receiptBytesRoot: "sha256:a42aba8742baeccb33ed26d550ac6339e022a8ad26b87d6608ea58e687b918e6" as LabRoot,
  terminalBytesRoot: "sha256:c61ebc66937fb865fe435ee12b1cf7e89382bf5e1d2108ee62039d9bb044d2a5" as LabRoot,
  timeBytesRoot: "sha256:f074a85cc1172b6c4176c2d14548b7b5ee7e6e69c98f6f437316033ee3837bbe" as LabRoot,
  emptyChargeBytesRoot: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" as LabRoot,
  heldHead: "cdcfb8a3087bd212fb465e39d4ed775e05d22f9c" as const,
  sourceCommit: "14765a978b528bf5ff61ac6a5567dfd8d3cd5aaa" as const,
  sourceRoot: "sha256:e4879404e048c8c78830f43350697c153a265875498419f9ec4ff9f2d8697337" as LabRoot,
  terminalReportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-ENTRY-TERMINAL-VERIFICATION-v5.md" as const,
  terminalReportBytesRoot: "sha256:d9ea2b079aa7c557e586f8d50867e88068227426c302a1f126c2f5fd09e9c24f" as LabRoot,
  priorPredecessorRoot: "sha256:759354aa55bc673de89f849268a3054355a03a856df4e5074c351b132e970dfe" as LabRoot,
  priorMeasuredSurvivingAllocatedBytes: 126_976,
  priorConservativeAllocatedBytes: 311_296,
  terminalElapsedUpperBoundMs: 152_945,
  terminalPhysicalBytes: 409_600,
  elapsedUpperBoundMs: 1_555_387,
  chargedMatches: 0,
})
/** Exact, bounded metadata for the already-consumed v6 route. This is not an
 * empirical verifier; it binds raw byte roots and accounting summaries only. */
export const LEAN_CLOSED_V6 = Object.freeze({
  storeIdentity: ".strategy-lab/lean-experiment-20261003-v6" as const,
  requestIdentity: LEAN_V6_REQUEST,
  canonicalIdentity: ".planning/artifacts/v1.38-lean-pilot-allocation-v6.json" as const,
  allocationRoot: "sha256:edb27fbe5c5491c526059b2b8770d84c814b096a9144ee99f03fee732430c56b" as LabRoot,
  allocationBytesRoot: "sha256:aa766ee396b1d0e6ca19cc8f151288f39105efe98936415747b5dafc1ed87e23" as LabRoot,
  requestBytesRoot: "sha256:9c9c2d50f6fdb229e65b3f77534060c7cca25116ec77e53ae06110313a2ce399" as LabRoot,
  resultBytesRoot: "sha256:686a0e51898a8d21b74c3eba7c89abe86fc5ab47834d42aa318f820d65429fe4" as LabRoot,
  ledgerBytesRoot: "sha256:3bbf307cbde7ed4290a429dcfe894ae651f7155a3a78c47501dcfa0a0c7a00f8" as LabRoot,
  timeBytesRoot: "sha256:912d66fdfb0d144cbb20519d964844c5f21e902157aee82902f165e58dce23c5" as LabRoot,
  entryBytesRoot: "sha256:422d2fef443223552985e4cd58ab85736ce5d2ed750d18e56c8902bf36cb5d84" as LabRoot,
  terminalBytesRoot: "sha256:2a38ef91a3a89b0c2d8518d147043a3f7649880f2c31b6a46c1e6905fed15253" as LabRoot,
  replayBytesRoot: "sha256:c8cdcd60d3b45e76f7d795182293d99b0d687bd1b054455ffca6933e52fa1711" as LabRoot,
  heldHead: "73b97a3d390a66300713ec9a91fb3829b75e8173" as const,
  sourceRoot: "sha256:b4245f41df4d06eac9dd6fdf43f822a39c97b9792e75b4bdc01dd4899bbbf905" as LabRoot,
  terminalReportIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-RETAINED-VERIFICATION-v1.md" as const,
  terminalReportBytesRoot: "sha256:ef0d7b3debeecbd76e270eeae0dcca5f6cd431ab3c07f6449083b91c556ce272" as LabRoot,
  erratumIdentity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-PILOT-RETAINED-VERIFICATION-ERRATUM-v1.md" as const,
  erratumBytesRoot: "sha256:745b3fe1e32ed50eb8b9bd39e0e3f5da2f921f4fa390b070f98dfe54dbb3de5d" as LabRoot,
  priorPredecessorRoot: "sha256:f651095ba79422c484d547bd2ff3ae3d453cbb9b32a8657f0bf88003c0e4e570" as LabRoot,
  priorMeasuredSurvivingAllocatedBytes: 163_840,
  priorConservativeAllocatedBytes: 409_600,
  elapsedUpperBoundMs: 2_168_630,
  chargedMatches: 1,
  terminalPhysicalBytes: 516_096,
  historicalPeakDiskBytes: "unknown" as const,
  historicalPeakRssBytes: "unknown" as const,
})
export const LEAN_DISK_APPROVAL = Object.freeze({
  identity: ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-HISTORICAL-DISK-ACCOUNTING-DECISION-v1.md" as const,
  bytesRoot: "sha256:33c0b6a597b6c0dc8009b3a5272265b03a901d46e43ccca77c0127d2adb1a220" as LabRoot,
})
type LeanSurvivor = { identity: string; bytesRoot: LabRoot; allocatedBytes: number }
export interface LeanProspectiveDiskBasis { schemaVersion: "lean-prospective-surviving-disk-v1"; historicalPeakDiskBytes: "unknown"; diskApproval: typeof LEAN_DISK_APPROVAL; survivors: readonly LeanSurvivor[]; oldStoreDirectoryAllocatedBytes: number; survivingAllocatedBytes: number; root: LabRoot }
type LeanClosedV2Observation = {
  raw: { allocation: LabRoot; canonical: LabRoot; request: LabRoot; entry: LabRoot; terminal: LabRoot; time: LabRoot; charge: LabRoot; report: LabRoot }
  storeFiles: readonly string[]; allocationRoot: LabRoot; sourceRoot: LabRoot; heldHead: string
  entry: { allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number }
  terminal: { entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; elapsedUpperBoundMs: number; physicalBytes: number; status: string; signal: string | null; exitCode: number | null }
  timeElapsedMs: number; timeStarts: number; timeCloses: number; chargedMatches: number; resultExists: boolean
  v1DiskBasisRoot: LabRoot; v1SurvivingAllocatedBytes: number; v2Survivors: readonly { identity: string; allocatedBytes: number }[]
}
export interface LeanClosedV2Predecessor { schemaVersion: "lean-closed-v2-predecessor-v1"; closed: typeof LEAN_CLOSED_V2; historicalPeakDiskBytes: "unknown"; v1SurvivingAllocatedBytes: number; v2Survivors: readonly { identity: string; allocatedBytes: number }[]; v2SurvivingAllocatedBytes: number; measuredSurvivingAllocatedBytes: number; terminalPhysicalBytes: number; allocatedDiskBytes: number; elapsedUpperBoundMs: number; chargedMatches: number; root: LabRoot }
const leanClosedV2SurvivorPaths = () => [LEAN_CLOSED_V2.storeIdentity, ...["allocation.json", "child-terminal.json", "entry.json", "ledger.ndjson", "time.ndjson"].map(name => `${LEAN_CLOSED_V2.storeIdentity}/${name}`), LEAN_CLOSED_V2.requestIdentity, LEAN_CLOSED_V2.canonicalIdentity, LEAN_PROSPECTIVE_WRITABLE_PATHS[0]]
/** A terminal snapshot is a conservative charged floor, not a measured old peak. */
export const createLeanClosedV2Predecessor = (o: LeanClosedV2Observation): Readonly<LeanClosedV2Predecessor> => {
  const c = LEAN_CLOSED_V2
  if (!exactLabKeys(o, ["raw", "storeFiles", "allocationRoot", "sourceRoot", "heldHead", "entry", "terminal", "timeElapsedMs", "timeStarts", "timeCloses", "chargedMatches", "resultExists", "v1DiskBasisRoot", "v1SurvivingAllocatedBytes", "v2Survivors"]) ||
    !exactLabKeys(o.raw, ["allocation", "canonical", "request", "entry", "terminal", "time", "charge", "report"]) ||
    o.raw.allocation !== c.allocationBytesRoot || o.raw.canonical !== c.allocationBytesRoot || o.raw.request !== c.requestBytesRoot || o.raw.entry !== c.entryBytesRoot || o.raw.terminal !== c.terminalBytesRoot || o.raw.time !== c.timeBytesRoot || o.raw.charge !== c.emptyChargeBytesRoot || o.raw.report !== c.terminalReportBytesRoot ||
    !Array.isArray(o.storeFiles) || o.storeFiles.join("|") !== "allocation.json|child-terminal.json|entry.json|ledger.ndjson|time.ndjson" || o.resultExists || o.allocationRoot !== c.allocationRoot || o.sourceRoot !== c.sourceRoot || o.heldHead !== c.heldHead ||
    !exactLabKeys(o.entry, ["allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid"]) || o.entry.allocationRoot !== c.allocationRoot || o.entry.sourceRoot !== c.sourceRoot || o.entry.requestBytesRoot !== c.requestBytesRoot || o.entry.head !== c.heldHead || !natural(o.entry.parentPid) || !natural(o.entry.childPid) || o.entry.parentPid === o.entry.childPid ||
    !exactLabKeys(o.terminal, ["entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "elapsedUpperBoundMs", "physicalBytes", "status", "signal", "exitCode"]) || o.terminal.entryBytesRoot !== c.entryBytesRoot || o.terminal.allocationRoot !== c.allocationRoot || o.terminal.sourceRoot !== c.sourceRoot || o.terminal.head !== c.heldHead || o.terminal.parentPid !== o.entry.parentPid || o.terminal.childPid !== o.entry.childPid || o.terminal.elapsedUpperBoundMs !== c.terminalElapsedUpperBoundMs || o.terminal.physicalBytes !== c.terminalPhysicalBytes || o.terminal.status !== "child_failed" || o.terminal.signal !== "SIGTERM" || o.terminal.exitCode !== null ||
    o.timeElapsedMs !== c.elapsedUpperBoundMs || o.timeStarts !== 1 || o.timeCloses !== 1 || o.chargedMatches !== 0 || c.elapsedUpperBoundMs !== LEAN_FAILED_PREFIX.elapsedUpperBoundMs + c.terminalElapsedUpperBoundMs ||
    o.v1DiskBasisRoot !== c.v1DiskBasisRoot || o.v1SurvivingAllocatedBytes !== c.v1SurvivingAllocatedBytes || !Array.isArray(o.v2Survivors) || o.v2Survivors.length !== 9) return fail("SUCCESSOR_PREDECESSOR")
  const paths = leanClosedV2SurvivorPaths()
  let v2SurvivingAllocatedBytes = 0
  for (let i = 0; i < paths.length; i++) {
    const item = o.v2Survivors[i]!
    if (!exactLabKeys(item, ["identity", "allocatedBytes"]) || item.identity !== paths[i] || !natural(item.allocatedBytes)) return fail("SUCCESSOR_PREDECESSOR")
    v2SurvivingAllocatedBytes += item.allocatedBytes
  }
  const measuredSurvivingAllocatedBytes = o.v1SurvivingAllocatedBytes + v2SurvivingAllocatedBytes
  const allocatedDiskBytes = Math.max(measuredSurvivingAllocatedBytes, c.terminalPhysicalBytes)
  if (!natural(measuredSurvivingAllocatedBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("SUCCESSOR_PREDECESSOR")
  const body = { schemaVersion: "lean-closed-v2-predecessor-v1" as const, closed: c, historicalPeakDiskBytes: "unknown" as const, v1SurvivingAllocatedBytes: o.v1SurvivingAllocatedBytes, v2Survivors: o.v2Survivors, v2SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, terminalPhysicalBytes: c.terminalPhysicalBytes, allocatedDiskBytes, elapsedUpperBoundMs: c.elapsedUpperBoundMs, chargedMatches: c.chargedMatches }
  return freezeLabValue({ ...body, root: labRoot("lean-closed-v2-predecessor-v1", body) })
}
export const verifyLeanClosedV2Predecessor = (claim: unknown, observed: LeanClosedV2Observation): Readonly<LeanClosedV2Predecessor> => {
  if (!exactLabKeys(claim, ["schemaVersion", "closed", "historicalPeakDiskBytes", "v1SurvivingAllocatedBytes", "v2Survivors", "v2SurvivingAllocatedBytes", "measuredSurvivingAllocatedBytes", "terminalPhysicalBytes", "allocatedDiskBytes", "elapsedUpperBoundMs", "chargedMatches", "root"])) return fail("SUCCESSOR_PREDECESSOR")
  const expected = createLeanClosedV2Predecessor(observed)
  if (labRoot("lean-successor-predecessor-admission", claim) !== labRoot("lean-successor-predecessor-admission", expected)) return fail("SUCCESSOR_PREDECESSOR")
  return expected
}
type LeanClosedV3Observation = {
  raw: { allocation: LabRoot; canonical: LabRoot; request: LabRoot; entry: LabRoot; receipt: LabRoot; terminal: LabRoot; time: LabRoot; charge: LabRoot; report: LabRoot }
  storeFiles: readonly string[]; allocationRoot: LabRoot; sourceRoot: LabRoot; heldHead: string
  entry: { allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number }
  terminal: { entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; elapsedUpperBoundMs: number; physicalBytes: number; status: string; signal: string | null; exitCode: number | null }
  receipt: { type: string; schemaVersion: string; code: string; stage: string }
  timeElapsedMs: number; timeStarts: number; timeCloses: number; chargedMatches: number; resultExists: boolean
  priorPredecessorRoot: LabRoot; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number
  v3Survivors: readonly { identity: string; allocatedBytes: number }[]
}
export interface LeanClosedV3Predecessor { schemaVersion: "lean-closed-v3-predecessor-v1"; closed: typeof LEAN_CLOSED_V3; historicalPeakDiskBytes: "unknown"; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number; v3Survivors: readonly { identity: string; allocatedBytes: number }[]; v3SurvivingAllocatedBytes: number; measuredSurvivingAllocatedBytes: number; terminalPhysicalBytes: number; allocatedDiskBytes: number; elapsedUpperBoundMs: number; chargedMatches: number; root: LabRoot }
const leanClosedV3SurvivorPaths = () => [LEAN_CLOSED_V3.storeIdentity, ...["allocation.json", "child-terminal.json", "entry-failure.json", "entry.json", "ledger.ndjson", "time.ndjson"].map(name => `${LEAN_CLOSED_V3.storeIdentity}/${name}`), LEAN_CLOSED_V3.requestIdentity, LEAN_CLOSED_V3.canonicalIdentity, LEAN_SUCCESSOR_WRITABLE_PATHS[0]]
/** Charge all surviving blocks once, with the larger terminal observation as a floor. */
export const createLeanClosedV3Predecessor = (o: LeanClosedV3Observation): Readonly<LeanClosedV3Predecessor> => {
  const c = LEAN_CLOSED_V3
  if (!exactLabKeys(o, ["raw", "storeFiles", "allocationRoot", "sourceRoot", "heldHead", "entry", "terminal", "receipt", "timeElapsedMs", "timeStarts", "timeCloses", "chargedMatches", "resultExists", "priorPredecessorRoot", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v3Survivors"]) ||
    !exactLabKeys(o.raw, ["allocation", "canonical", "request", "entry", "receipt", "terminal", "time", "charge", "report"]) ||
    o.raw.allocation !== c.allocationBytesRoot || o.raw.canonical !== c.allocationBytesRoot || o.raw.request !== c.requestBytesRoot || o.raw.entry !== c.entryBytesRoot || o.raw.receipt !== c.receiptBytesRoot || o.raw.terminal !== c.terminalBytesRoot || o.raw.time !== c.timeBytesRoot || o.raw.charge !== c.emptyChargeBytesRoot || o.raw.report !== c.terminalReportBytesRoot ||
    !Array.isArray(o.storeFiles) || o.storeFiles.join("|") !== "allocation.json|child-terminal.json|entry-failure.json|entry.json|ledger.ndjson|time.ndjson" || o.resultExists || o.allocationRoot !== c.allocationRoot || o.sourceRoot !== c.sourceRoot || o.heldHead !== c.heldHead ||
    !exactLabKeys(o.entry, ["allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid"]) || o.entry.allocationRoot !== c.allocationRoot || o.entry.sourceRoot !== c.sourceRoot || o.entry.requestBytesRoot !== c.requestBytesRoot || o.entry.head !== c.heldHead || !natural(o.entry.parentPid) || !natural(o.entry.childPid) || o.entry.parentPid === o.entry.childPid ||
    !exactLabKeys(o.terminal, ["entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "elapsedUpperBoundMs", "physicalBytes", "status", "signal", "exitCode"]) || o.terminal.entryBytesRoot !== c.entryBytesRoot || o.terminal.allocationRoot !== c.allocationRoot || o.terminal.sourceRoot !== c.sourceRoot || o.terminal.head !== c.heldHead || o.terminal.parentPid !== o.entry.parentPid || o.terminal.childPid !== o.entry.childPid || o.terminal.elapsedUpperBoundMs !== c.terminalElapsedUpperBoundMs || o.terminal.physicalBytes !== c.terminalPhysicalBytes || o.terminal.status !== "child_failed" || o.terminal.signal !== null || o.terminal.exitCode !== 1 ||
    !exactLabKeys(o.receipt, ["type", "schemaVersion", "code", "stage"]) || o.receipt.type !== "lean-child-failure" || o.receipt.schemaVersion !== "lean-child-failure-v1" || o.receipt.code !== "UNKNOWN_INTERNAL_FAILURE" || o.receipt.stage !== "unknown" ||
    o.timeElapsedMs !== c.elapsedUpperBoundMs || o.timeStarts !== 1 || o.timeCloses !== 1 || o.chargedMatches !== 0 || c.elapsedUpperBoundMs !== LEAN_CLOSED_V2.elapsedUpperBoundMs + c.terminalElapsedUpperBoundMs ||
    o.priorPredecessorRoot !== c.priorPredecessorRoot || o.priorMeasuredSurvivingAllocatedBytes !== c.priorMeasuredSurvivingAllocatedBytes || o.priorConservativeAllocatedBytes !== c.priorConservativeAllocatedBytes || !Array.isArray(o.v3Survivors) || o.v3Survivors.length !== 10) return fail("SUCCESSOR_PREDECESSOR")
  const paths = leanClosedV3SurvivorPaths()
  let v3SurvivingAllocatedBytes = 0
  for (let i = 0; i < paths.length; i++) {
    const item = o.v3Survivors[i]!
    if (!exactLabKeys(item, ["identity", "allocatedBytes"]) || item.identity !== paths[i] || !natural(item.allocatedBytes)) return fail("SUCCESSOR_PREDECESSOR")
    v3SurvivingAllocatedBytes += item.allocatedBytes
  }
  const measuredSurvivingAllocatedBytes = o.priorMeasuredSurvivingAllocatedBytes + v3SurvivingAllocatedBytes
  const allocatedDiskBytes = Math.max(measuredSurvivingAllocatedBytes, c.terminalPhysicalBytes)
  if (!natural(measuredSurvivingAllocatedBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("SUCCESSOR_PREDECESSOR")
  const body = { schemaVersion: "lean-closed-v3-predecessor-v1" as const, closed: c, historicalPeakDiskBytes: "unknown" as const, priorMeasuredSurvivingAllocatedBytes: o.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: o.priorConservativeAllocatedBytes, v3Survivors: o.v3Survivors, v3SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, terminalPhysicalBytes: c.terminalPhysicalBytes, allocatedDiskBytes, elapsedUpperBoundMs: c.elapsedUpperBoundMs, chargedMatches: c.chargedMatches }
  return freezeLabValue({ ...body, root: labRoot("lean-closed-v3-predecessor-v1", body) })
}
export const verifyLeanClosedV3Predecessor = (claim: unknown, observed: LeanClosedV3Observation): Readonly<LeanClosedV3Predecessor> => {
  if (!exactLabKeys(claim, ["schemaVersion", "closed", "historicalPeakDiskBytes", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v3Survivors", "v3SurvivingAllocatedBytes", "measuredSurvivingAllocatedBytes", "terminalPhysicalBytes", "allocatedDiskBytes", "elapsedUpperBoundMs", "chargedMatches", "root"])) return fail("SUCCESSOR_PREDECESSOR")
  const expected = createLeanClosedV3Predecessor(observed)
  if (labRoot("lean-successor-predecessor-admission", claim) !== labRoot("lean-successor-predecessor-admission", expected)) return fail("SUCCESSOR_PREDECESSOR")
  return expected
}
type LeanClosedV4Observation = {
  raw: { allocation: LabRoot; canonical: LabRoot; request: LabRoot; entry: LabRoot; receipt: LabRoot; terminal: LabRoot; time: LabRoot; charge: LabRoot; report: LabRoot }
  storeFiles: readonly string[]; allocationRoot: LabRoot; sourceRoot: LabRoot; heldHead: string
  entry: { allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number }
  terminal: { entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; elapsedUpperBoundMs: number; physicalBytes: number; status: string; signal: string | null; exitCode: number | null }
  receipt: { type: string; schemaVersion: string; code: string; stage: string }
  timeElapsedMs: number; timeStarts: number; timeCloses: number; chargedMatches: number; resultExists: boolean
  priorPredecessorRoot: LabRoot; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number
  v4Survivors: readonly { identity: string; allocatedBytes: number }[]
}
export interface LeanClosedV4Predecessor { schemaVersion: "lean-closed-v4-predecessor-v1"; closed: typeof LEAN_CLOSED_V4; historicalPeakDiskBytes: "unknown"; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number; v4Survivors: readonly { identity: string; allocatedBytes: number }[]; v4SurvivingAllocatedBytes: number; measuredSurvivingAllocatedBytes: number; cumulativeConservativeFloorBytes: number; terminalPhysicalBytes: number; allocatedDiskBytes: number; elapsedUpperBoundMs: number; chargedMatches: number; root: LabRoot }
const leanClosedV4SurvivorPaths = () => [LEAN_CLOSED_V4.storeIdentity, ...["allocation.json", "child-terminal.json", "entry-failure.json", "entry.json", "ledger.ndjson", "time.ndjson"].map(name => `${LEAN_CLOSED_V4.storeIdentity}/${name}`), LEAN_CLOSED_V4.requestIdentity, LEAN_CLOSED_V4.canonicalIdentity, LEAN_V4_WRITABLE_PATHS[0]]
/** Preserve the prior conservative debit while charging every new surviving block. */
export const createLeanClosedV4Predecessor = (o: LeanClosedV4Observation): Readonly<LeanClosedV4Predecessor> => {
  const c = LEAN_CLOSED_V4
  if (!exactLabKeys(o, ["raw", "storeFiles", "allocationRoot", "sourceRoot", "heldHead", "entry", "terminal", "receipt", "timeElapsedMs", "timeStarts", "timeCloses", "chargedMatches", "resultExists", "priorPredecessorRoot", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v4Survivors"]) ||
    !exactLabKeys(o.raw, ["allocation", "canonical", "request", "entry", "receipt", "terminal", "time", "charge", "report"]) ||
    o.raw.allocation !== c.allocationBytesRoot || o.raw.canonical !== c.allocationBytesRoot || o.raw.request !== c.requestBytesRoot || o.raw.entry !== c.entryBytesRoot || o.raw.receipt !== c.receiptBytesRoot || o.raw.terminal !== c.terminalBytesRoot || o.raw.time !== c.timeBytesRoot || o.raw.charge !== c.emptyChargeBytesRoot || o.raw.report !== c.terminalReportBytesRoot ||
    !Array.isArray(o.storeFiles) || o.storeFiles.join("|") !== "allocation.json|child-terminal.json|entry-failure.json|entry.json|ledger.ndjson|time.ndjson" || o.resultExists || o.allocationRoot !== c.allocationRoot || o.sourceRoot !== c.sourceRoot || o.heldHead !== c.heldHead ||
    !exactLabKeys(o.entry, ["allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid"]) || o.entry.allocationRoot !== c.allocationRoot || o.entry.sourceRoot !== c.sourceRoot || o.entry.requestBytesRoot !== c.requestBytesRoot || o.entry.head !== c.heldHead || !natural(o.entry.parentPid) || o.entry.parentPid === 0 || !natural(o.entry.childPid) || o.entry.childPid === 0 || o.entry.parentPid === o.entry.childPid ||
    !exactLabKeys(o.terminal, ["entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "elapsedUpperBoundMs", "physicalBytes", "status", "signal", "exitCode"]) || o.terminal.entryBytesRoot !== c.entryBytesRoot || o.terminal.allocationRoot !== c.allocationRoot || o.terminal.sourceRoot !== c.sourceRoot || o.terminal.head !== c.heldHead || o.terminal.parentPid !== o.entry.parentPid || o.terminal.childPid !== o.entry.childPid || o.terminal.elapsedUpperBoundMs !== c.terminalElapsedUpperBoundMs || o.terminal.physicalBytes !== c.terminalPhysicalBytes || o.terminal.status !== "child_failed" || o.terminal.signal !== null || o.terminal.exitCode !== 1 ||
    !exactLabKeys(o.receipt, ["type", "schemaVersion", "code", "stage"]) || o.receipt.type !== "lean-child-failure" || o.receipt.schemaVersion !== "lean-child-failure-v1" || o.receipt.code !== "FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT" || o.receipt.stage !== "unknown" ||
    o.timeElapsedMs !== c.elapsedUpperBoundMs || o.timeStarts !== 1 || o.timeCloses !== 1 || o.chargedMatches !== 0 || c.elapsedUpperBoundMs !== LEAN_CLOSED_V3.elapsedUpperBoundMs + c.terminalElapsedUpperBoundMs ||
    o.priorPredecessorRoot !== c.priorPredecessorRoot || o.priorMeasuredSurvivingAllocatedBytes !== c.priorMeasuredSurvivingAllocatedBytes || o.priorConservativeAllocatedBytes !== c.priorConservativeAllocatedBytes || !Array.isArray(o.v4Survivors) || o.v4Survivors.length !== 10) return fail("SUCCESSOR_PREDECESSOR")
  const paths = leanClosedV4SurvivorPaths()
  let v4SurvivingAllocatedBytes = 0
  for (let i = 0; i < paths.length; i++) {
    const item = o.v4Survivors[i]!
    if (!exactLabKeys(item, ["identity", "allocatedBytes"]) || item.identity !== paths[i] || !natural(item.allocatedBytes)) return fail("SUCCESSOR_PREDECESSOR")
    v4SurvivingAllocatedBytes += item.allocatedBytes
  }
  const measuredSurvivingAllocatedBytes = o.priorMeasuredSurvivingAllocatedBytes + v4SurvivingAllocatedBytes
  const cumulativeConservativeFloorBytes = o.priorConservativeAllocatedBytes + v4SurvivingAllocatedBytes
  const allocatedDiskBytes = Math.max(measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, c.terminalPhysicalBytes)
  if (!natural(measuredSurvivingAllocatedBytes) || !natural(cumulativeConservativeFloorBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("SUCCESSOR_PREDECESSOR")
  const body = { schemaVersion: "lean-closed-v4-predecessor-v1" as const, closed: c, historicalPeakDiskBytes: "unknown" as const, priorMeasuredSurvivingAllocatedBytes: o.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: o.priorConservativeAllocatedBytes, v4Survivors: o.v4Survivors, v4SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, terminalPhysicalBytes: c.terminalPhysicalBytes, allocatedDiskBytes, elapsedUpperBoundMs: c.elapsedUpperBoundMs, chargedMatches: c.chargedMatches }
  return freezeLabValue({ ...body, root: labRoot("lean-closed-v4-predecessor-v1", body) })
}
export const verifyLeanClosedV4Predecessor = (claim: unknown, observed: LeanClosedV4Observation): Readonly<LeanClosedV4Predecessor> => {
  if (!exactLabKeys(claim, ["schemaVersion", "closed", "historicalPeakDiskBytes", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v4Survivors", "v4SurvivingAllocatedBytes", "measuredSurvivingAllocatedBytes", "cumulativeConservativeFloorBytes", "terminalPhysicalBytes", "allocatedDiskBytes", "elapsedUpperBoundMs", "chargedMatches", "root"])) return fail("SUCCESSOR_PREDECESSOR")
  const expected = createLeanClosedV4Predecessor(observed)
  if (labRoot("lean-successor-predecessor-admission", claim) !== labRoot("lean-successor-predecessor-admission", expected)) return fail("SUCCESSOR_PREDECESSOR")
  return expected
}
type LeanClosedV5Observation = {
  raw: { allocation: LabRoot; canonical: LabRoot; request: LabRoot; entry: LabRoot; receipt: LabRoot; terminal: LabRoot; time: LabRoot; charge: LabRoot; report: LabRoot }
  storeFiles: readonly string[]; allocationRoot: LabRoot; sourceRoot: LabRoot; heldHead: string
  entry: { allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number }
  terminal: { entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; elapsedUpperBoundMs: number; physicalBytes: number; status: string; signal: string | null; exitCode: number | null }
  receipt: { type: string; schemaVersion: string; code: string; stage: string }
  timeElapsedMs: number; timeStarts: number; timeCloses: number; chargedMatches: number; resultExists: boolean
  priorPredecessorRoot: LabRoot; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number
  v5Survivors: readonly { identity: string; allocatedBytes: number }[]
}
export interface LeanClosedV5Predecessor { schemaVersion: "lean-closed-v5-predecessor-v1"; closed: typeof LEAN_CLOSED_V5; historicalPeakDiskBytes: "unknown"; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number; v5Survivors: readonly { identity: string; allocatedBytes: number }[]; v5SurvivingAllocatedBytes: number; measuredSurvivingAllocatedBytes: number; cumulativeConservativeFloorBytes: number; terminalPhysicalBytes: number; allocatedDiskBytes: number; elapsedUpperBoundMs: number; chargedMatches: number; root: LabRoot }
const leanClosedV5SurvivorPaths = () => [LEAN_CLOSED_V5.storeIdentity, ...["allocation.json", "child-terminal.json", "entry-failure.json", "entry.json", "ledger.ndjson", "time.ndjson"].map(name => `${LEAN_CLOSED_V5.storeIdentity}/${name}`), LEAN_CLOSED_V5.requestIdentity, LEAN_CLOSED_V5.canonicalIdentity, LEAN_V5_WRITABLE_PATHS[0]]
/** Charge every new surviving block over the prior conservative debit. */
export const createLeanClosedV5Predecessor = (o: LeanClosedV5Observation): Readonly<LeanClosedV5Predecessor> => {
  const c = LEAN_CLOSED_V5
  if (!exactLabKeys(o, ["raw", "storeFiles", "allocationRoot", "sourceRoot", "heldHead", "entry", "terminal", "receipt", "timeElapsedMs", "timeStarts", "timeCloses", "chargedMatches", "resultExists", "priorPredecessorRoot", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v5Survivors"]) ||
    !exactLabKeys(o.raw, ["allocation", "canonical", "request", "entry", "receipt", "terminal", "time", "charge", "report"]) ||
    o.raw.allocation !== c.allocationBytesRoot || o.raw.canonical !== c.allocationBytesRoot || o.raw.request !== c.requestBytesRoot || o.raw.entry !== c.entryBytesRoot || o.raw.receipt !== c.receiptBytesRoot || o.raw.terminal !== c.terminalBytesRoot || o.raw.time !== c.timeBytesRoot || o.raw.charge !== c.emptyChargeBytesRoot || o.raw.report !== c.terminalReportBytesRoot ||
    !Array.isArray(o.storeFiles) || o.storeFiles.join("|") !== "allocation.json|child-terminal.json|entry-failure.json|entry.json|ledger.ndjson|time.ndjson" || o.resultExists || o.allocationRoot !== c.allocationRoot || o.sourceRoot !== c.sourceRoot || o.heldHead !== c.heldHead ||
    !exactLabKeys(o.entry, ["allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid"]) || o.entry.allocationRoot !== c.allocationRoot || o.entry.sourceRoot !== c.sourceRoot || o.entry.requestBytesRoot !== c.requestBytesRoot || o.entry.head !== c.heldHead || !natural(o.entry.parentPid) || o.entry.parentPid === 0 || !natural(o.entry.childPid) || o.entry.childPid === 0 || o.entry.parentPid === o.entry.childPid ||
    !exactLabKeys(o.terminal, ["entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "elapsedUpperBoundMs", "physicalBytes", "status", "signal", "exitCode"]) || o.terminal.entryBytesRoot !== c.entryBytesRoot || o.terminal.allocationRoot !== c.allocationRoot || o.terminal.sourceRoot !== c.sourceRoot || o.terminal.head !== c.heldHead || o.terminal.parentPid !== o.entry.parentPid || o.terminal.childPid !== o.entry.childPid || o.terminal.elapsedUpperBoundMs !== c.terminalElapsedUpperBoundMs || o.terminal.physicalBytes !== c.terminalPhysicalBytes || o.terminal.status !== "child_failed" || o.terminal.signal !== null || o.terminal.exitCode !== 1 ||
    !exactLabKeys(o.receipt, ["type", "schemaVersion", "code", "stage"]) || o.receipt.type !== "lean-child-failure" || o.receipt.schemaVersion !== "lean-child-failure-v1" || o.receipt.code !== "FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT" || o.receipt.stage !== "unknown" ||
    o.timeElapsedMs !== c.elapsedUpperBoundMs || o.timeStarts !== 1 || o.timeCloses !== 1 || o.chargedMatches !== 0 || c.elapsedUpperBoundMs !== LEAN_CLOSED_V4.elapsedUpperBoundMs + c.terminalElapsedUpperBoundMs ||
    o.priorPredecessorRoot !== c.priorPredecessorRoot || o.priorMeasuredSurvivingAllocatedBytes !== c.priorMeasuredSurvivingAllocatedBytes || o.priorConservativeAllocatedBytes !== c.priorConservativeAllocatedBytes || !Array.isArray(o.v5Survivors) || o.v5Survivors.length !== 10) return fail("SUCCESSOR_PREDECESSOR")
  const paths = leanClosedV5SurvivorPaths()
  let v5SurvivingAllocatedBytes = 0
  for (let i = 0; i < paths.length; i++) {
    const item = o.v5Survivors[i]!
    if (!exactLabKeys(item, ["identity", "allocatedBytes"]) || item.identity !== paths[i] || !natural(item.allocatedBytes)) return fail("SUCCESSOR_PREDECESSOR")
    v5SurvivingAllocatedBytes += item.allocatedBytes
  }
  const measuredSurvivingAllocatedBytes = o.priorMeasuredSurvivingAllocatedBytes + v5SurvivingAllocatedBytes
  const cumulativeConservativeFloorBytes = o.priorConservativeAllocatedBytes + v5SurvivingAllocatedBytes
  const allocatedDiskBytes = Math.max(measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, c.terminalPhysicalBytes)
  if (!natural(measuredSurvivingAllocatedBytes) || !natural(cumulativeConservativeFloorBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes) return fail("SUCCESSOR_PREDECESSOR")
  const body = { schemaVersion: "lean-closed-v5-predecessor-v1" as const, closed: c, historicalPeakDiskBytes: "unknown" as const, priorMeasuredSurvivingAllocatedBytes: o.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: o.priorConservativeAllocatedBytes, v5Survivors: o.v5Survivors, v5SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, terminalPhysicalBytes: c.terminalPhysicalBytes, allocatedDiskBytes, elapsedUpperBoundMs: c.elapsedUpperBoundMs, chargedMatches: c.chargedMatches }
  return freezeLabValue({ ...body, root: labRoot("lean-closed-v5-predecessor-v1", body) })
}
export const verifyLeanClosedV5Predecessor = (claim: unknown, observed: LeanClosedV5Observation): Readonly<LeanClosedV5Predecessor> => {
  if (!exactLabKeys(claim, ["schemaVersion", "closed", "historicalPeakDiskBytes", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v5Survivors", "v5SurvivingAllocatedBytes", "measuredSurvivingAllocatedBytes", "cumulativeConservativeFloorBytes", "terminalPhysicalBytes", "allocatedDiskBytes", "elapsedUpperBoundMs", "chargedMatches", "root"])) return fail("SUCCESSOR_PREDECESSOR")
  const expected = createLeanClosedV5Predecessor(observed)
  if (labRoot("lean-successor-predecessor-admission", claim) !== labRoot("lean-successor-predecessor-admission", expected)) return fail("SUCCESSOR_PREDECESSOR")
  return expected
}
type LeanClosedV6Observation = {
  raw: { allocation: LabRoot; canonical: LabRoot; request: LabRoot; result: LabRoot; ledger: LabRoot; time: LabRoot; entry: LabRoot; terminal: LabRoot; replay: LabRoot; report: LabRoot; erratum: LabRoot }
  storeFiles: readonly string[]; allocationRoot: LabRoot; sourceRoot: LabRoot; heldHead: string
  result: { schemaVersion: string; allocationRoot: LabRoot; evidenceRoot: LabRoot; issued: boolean; charged: number; successful: number; elapsedMs: number; tier: string }
  timeElapsedMs: number; timeStarts: number; timeCloses: number; chargedMatches: number; successfulMatches: number; entryClosed: boolean; verifierClosed: boolean; parentClosed: boolean; childClosed: boolean
  priorPredecessorRoot: LabRoot; priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number
  v6Survivors: readonly { identity: string; allocatedBytes: number }[]
}
export interface LeanClosedV6Predecessor {
  schemaVersion: "lean-closed-v6-predecessor-v1"; closed: typeof LEAN_CLOSED_V6; historicalPeakDiskBytes: "unknown"; historicalPeakRssBytes: "unknown"
  priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number; v6Survivors: readonly { identity: string; allocatedBytes: number }[]
  v6SurvivingAllocatedBytes: number; measuredSurvivingAllocatedBytes: number; cumulativeConservativeFloorBytes: number
  terminalPhysicalBytes: number; allocatedDiskBytes: number; elapsedUpperBoundMs: number; chargedMatches: number; successfulMatches: number; root: LabRoot
}
const leanClosedV6SurvivorPaths = () => [LEAN_CLOSED_V6.storeIdentity, ...["allocation.json", "child-terminal.json", "entry.json", "ledger.ndjson", "result.json", "time.ndjson", "78905d6e33daf981ff164488f9b6cbc1be5fb347d316cc4332733c64213ec3c9.gz"].map(name => `${LEAN_CLOSED_V6.storeIdentity}/${name}`), LEAN_CLOSED_V6.requestIdentity, LEAN_CLOSED_V6.canonicalIdentity, LEAN_V6_WRITABLE_PATHS[0]]
/** Binds the already-retained, already-verified v6 metadata without replaying
 * its result, opening Strategy data, or invoking the ordinary evidence reader. */
export const createLeanClosedV6Predecessor = (o: LeanClosedV6Observation): Readonly<LeanClosedV6Predecessor> => {
  const c = LEAN_CLOSED_V6
  if (!exactLabKeys(o, ["raw", "storeFiles", "allocationRoot", "sourceRoot", "heldHead", "result", "timeElapsedMs", "timeStarts", "timeCloses", "chargedMatches", "successfulMatches", "entryClosed", "verifierClosed", "parentClosed", "childClosed", "priorPredecessorRoot", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v6Survivors"]) ||
    !exactLabKeys(o.raw, ["allocation", "canonical", "request", "result", "ledger", "time", "entry", "terminal", "replay", "report", "erratum"]) ||
    o.raw.allocation !== c.allocationBytesRoot || o.raw.canonical !== c.allocationBytesRoot || o.raw.request !== c.requestBytesRoot || o.raw.result !== c.resultBytesRoot || o.raw.ledger !== c.ledgerBytesRoot || o.raw.time !== c.timeBytesRoot || o.raw.entry !== c.entryBytesRoot || o.raw.terminal !== c.terminalBytesRoot || o.raw.replay !== c.replayBytesRoot || o.raw.report !== c.terminalReportBytesRoot || o.raw.erratum !== c.erratumBytesRoot ||
    !Array.isArray(o.storeFiles) || o.storeFiles.join("|") !== "78905d6e33daf981ff164488f9b6cbc1be5fb347d316cc4332733c64213ec3c9.gz|allocation.json|child-terminal.json|entry.json|ledger.ndjson|result.json|time.ndjson" || o.allocationRoot !== c.allocationRoot || o.sourceRoot !== c.sourceRoot || o.heldHead !== c.heldHead ||
    !exactLabKeys(o.result, ["schemaVersion", "allocationRoot", "evidenceRoot", "issued", "charged", "successful", "elapsedMs", "tier"]) || o.result.schemaVersion !== "lean-pilot-result-v2" || o.result.allocationRoot !== c.allocationRoot || o.result.evidenceRoot !== "sha256:ae82de483a9e773897a842b2f912449d1785ecc6032d1a4329b5cd8a1daf9cd6" || o.result.issued !== false || o.result.charged !== 1 || o.result.successful !== 0 || o.result.elapsedMs !== 2_165_100 || o.result.tier !== "pending_independent_verification" ||
    o.timeElapsedMs !== c.elapsedUpperBoundMs || o.timeStarts !== 2 || o.timeCloses !== 2 || o.chargedMatches !== c.chargedMatches || o.successfulMatches !== 0 || !o.entryClosed || !o.verifierClosed || !o.parentClosed || !o.childClosed ||
    o.priorPredecessorRoot !== c.priorPredecessorRoot || o.priorMeasuredSurvivingAllocatedBytes !== c.priorMeasuredSurvivingAllocatedBytes || o.priorConservativeAllocatedBytes !== c.priorConservativeAllocatedBytes || !Array.isArray(o.v6Survivors) || o.v6Survivors.length !== 11) return fail("SUCCESSOR_PREDECESSOR")
  let v6SurvivingAllocatedBytes = 0
  const paths = leanClosedV6SurvivorPaths()
  for (let i = 0; i < paths.length; i++) {
    const item = o.v6Survivors[i]!
    if (!exactLabKeys(item, ["identity", "allocatedBytes"]) || item.identity !== paths[i] || !natural(item.allocatedBytes)) return fail("SUCCESSOR_PREDECESSOR")
    v6SurvivingAllocatedBytes += item.allocatedBytes
  }
  const measuredSurvivingAllocatedBytes = c.priorMeasuredSurvivingAllocatedBytes + v6SurvivingAllocatedBytes
  const cumulativeConservativeFloorBytes = c.priorConservativeAllocatedBytes + v6SurvivingAllocatedBytes
  const allocatedDiskBytes = Math.max(measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, c.terminalPhysicalBytes)
  if (!natural(v6SurvivingAllocatedBytes) || !natural(measuredSurvivingAllocatedBytes) || !natural(cumulativeConservativeFloorBytes) || allocatedDiskBytes > LEAN_CAPS.retainedBytes || c.elapsedUpperBoundMs > LEAN_CAPS.elapsedMs || c.chargedMatches > LEAN_CAPS.matches) return fail("SUCCESSOR_PREDECESSOR")
  const body = { schemaVersion: "lean-closed-v6-predecessor-v1" as const, closed: c, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, priorMeasuredSurvivingAllocatedBytes: c.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: c.priorConservativeAllocatedBytes, v6Survivors: o.v6Survivors, v6SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, terminalPhysicalBytes: c.terminalPhysicalBytes, allocatedDiskBytes, elapsedUpperBoundMs: c.elapsedUpperBoundMs, chargedMatches: c.chargedMatches, successfulMatches: 0 as const }
  return freezeLabValue({ ...body, root: labRoot("lean-closed-v6-predecessor-v1", body) })
}
export const verifyLeanClosedV6Predecessor = (claim: unknown, observed: LeanClosedV6Observation): Readonly<LeanClosedV6Predecessor> => {
  if (!exactLabKeys(claim, ["schemaVersion", "closed", "historicalPeakDiskBytes", "historicalPeakRssBytes", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "v6Survivors", "v6SurvivingAllocatedBytes", "measuredSurvivingAllocatedBytes", "cumulativeConservativeFloorBytes", "terminalPhysicalBytes", "allocatedDiskBytes", "elapsedUpperBoundMs", "chargedMatches", "successfulMatches", "root"])) return fail("SUCCESSOR_PREDECESSOR")
  const expected = createLeanClosedV6Predecessor(observed)
  if (labRoot("lean-successor-predecessor-admission", claim) !== labRoot("lean-successor-predecessor-admission", expected)) return fail("SUCCESSOR_PREDECESSOR")
  return expected
}
export interface LeanClosedV7Observation {
  raw: { allocation: LabRoot; canonical: LabRoot; request: LabRoot; result: LabRoot; ledger: LabRoot; time: LabRoot; entry: LabRoot; terminal: LabRoot; replay: LabRoot; report: LabRoot }
  storeFiles: readonly string[]
  allocationRoot: LabRoot; sourceRoot: LabRoot; heldHead: string; priorPredecessorRoot: LabRoot
  priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number
  entry: { allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number }
  terminal: { entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; status: string; exitCode: number | null; signal: string | null; physicalBytes: number }
  result: { allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; charged: number; successful: number; elapsedMs: number; tier: string; issued: boolean; evidenceClass: string }
  timeEvents: readonly { kind: string; id: string; atMs: number }[]
  survivors: readonly { identity: string; allocatedBytes: number }[]
}
export interface LeanClosedV7Predecessor {
  schemaVersion: "lean-closed-v7-predecessor-v1"; closed: typeof LEAN_CLOSED_V7
  historicalPeakDiskBytes: "unknown"; historicalPeakRssBytes: "unknown"
  priorMeasuredSurvivingAllocatedBytes: number; priorConservativeAllocatedBytes: number
  survivors: readonly { identity: string; allocatedBytes: number }[]; v7SurvivingAllocatedBytes: number
  measuredSurvivingAllocatedBytes: number; cumulativeConservativeFloorBytes: number
  allocatedDiskBytes: number; elapsedUpperBoundMs: number; chargedMatches: number; successfulMatches: number; root: LabRoot
}
const leanClosedV7SurvivorPaths = () => [LEAN_CLOSED_V7.storeIdentity, ...[LEAN_CLOSED_V7.replayName, "allocation.json", "child-terminal.json", "entry.json", "ledger.ndjson", "result.json", "time.ndjson"].map(name => `${LEAN_CLOSED_V7.storeIdentity}/${name}`), LEAN_CLOSED_V7.requestIdentity, LEAN_CLOSED_V7.canonicalIdentity, LEAN_V7_WRITABLE_PATHS[0]]
/** Pure admission of already-closed raw identities and surviving blocks. It does
 * not reopen the v7 ledger or redo its sole ordinary retained verification. */
export const createLeanClosedV7Predecessor = (o: LeanClosedV7Observation): Readonly<LeanClosedV7Predecessor> => {
  const c = LEAN_CLOSED_V7
  if (!exactLabKeys(o, ["raw", "storeFiles", "allocationRoot", "sourceRoot", "heldHead", "priorPredecessorRoot", "priorMeasuredSurvivingAllocatedBytes", "priorConservativeAllocatedBytes", "entry", "terminal", "result", "timeEvents", "survivors"]) ||
    !exactLabKeys(o.raw, ["allocation", "canonical", "request", "result", "ledger", "time", "entry", "terminal", "replay", "report"]) ||
    o.raw.allocation !== c.allocationBytesRoot || o.raw.canonical !== c.allocationBytesRoot || o.raw.request !== c.requestBytesRoot || o.raw.result !== c.resultBytesRoot || o.raw.ledger !== c.ledgerBytesRoot || o.raw.time !== c.timeBytesRoot || o.raw.entry !== c.entryBytesRoot || o.raw.terminal !== c.terminalBytesRoot || o.raw.replay !== c.replayBytesRoot || o.raw.report !== c.reportBytesRoot ||
    !Array.isArray(o.storeFiles) || o.storeFiles.join("|") !== [c.replayName, "allocation.json", "child-terminal.json", "entry.json", "ledger.ndjson", "result.json", "time.ndjson"].join("|") ||
    o.allocationRoot !== c.allocationRoot || o.sourceRoot !== c.sourceRoot || o.heldHead !== c.heldHead || o.priorPredecessorRoot !== c.priorPredecessorRoot || o.priorMeasuredSurvivingAllocatedBytes !== c.priorMeasuredSurvivingAllocatedBytes || o.priorConservativeAllocatedBytes !== c.priorConservativeAllocatedBytes ||
    !exactLabKeys(o.entry, ["allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid"]) || o.entry.allocationRoot !== c.allocationRoot || o.entry.sourceRoot !== c.sourceRoot || o.entry.requestBytesRoot !== c.requestBytesRoot || o.entry.head !== c.heldHead || !natural(o.entry.parentPid) || !natural(o.entry.childPid) || o.entry.parentPid === o.entry.childPid ||
    !exactLabKeys(o.terminal, ["entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "status", "exitCode", "signal", "physicalBytes"]) || o.terminal.entryBytesRoot !== c.entryBytesRoot || o.terminal.allocationRoot !== c.allocationRoot || o.terminal.sourceRoot !== c.sourceRoot || o.terminal.head !== c.heldHead || o.terminal.parentPid !== o.entry.parentPid || o.terminal.childPid !== o.entry.childPid || o.terminal.status !== "child_exited" || o.terminal.exitCode !== 0 || o.terminal.signal !== null || o.terminal.physicalBytes !== c.terminalPhysicalBytes ||
    !exactLabKeys(o.result, ["allocationRoot", "sourceRoot", "head", "charged", "successful", "elapsedMs", "tier", "issued", "evidenceClass"]) || o.result.allocationRoot !== c.allocationRoot || o.result.sourceRoot !== c.sourceRoot || o.result.head !== c.heldHead || o.result.charged !== c.chargedMatches || o.result.successful !== c.successfulMatches || o.result.elapsedMs !== 3_296_898 || o.result.tier !== "pending_independent_verification" || o.result.issued !== false || o.result.evidenceClass !== "feasibility_only" ||
    !Array.isArray(o.timeEvents) || o.timeEvents.length !== 4 || o.timeEvents.map(e => `${e.kind}:${e.id}`).join("|") !== "start:pilot-entry|close:pilot-entry|start:pilot-retained-verifier|close:pilot-retained-verifier" || o.timeEvents.some(e => !exactLabKeys(e, ["kind", "id", "atMs"]) || !natural(e.atMs)) || o.timeEvents[1]!.atMs < o.timeEvents[0]!.atMs || o.timeEvents[2]!.atMs < o.timeEvents[1]!.atMs || o.timeEvents[3]!.atMs < o.timeEvents[2]!.atMs || c.priorConservativeAllocatedBytes < 0 || c.elapsedUpperBoundMs !== 2_168_630 + o.timeEvents[1]!.atMs - o.timeEvents[0]!.atMs + o.timeEvents[3]!.atMs - o.timeEvents[2]!.atMs ||
    !Array.isArray(o.survivors) || o.survivors.length !== leanClosedV7SurvivorPaths().length) return fail("BASELINE_PREDECESSOR")
  let v7SurvivingAllocatedBytes = 0
  const paths = leanClosedV7SurvivorPaths()
  for (let i = 0; i < paths.length; i++) {
    const item = o.survivors[i]!
    if (!exactLabKeys(item, ["identity", "allocatedBytes"]) || item.identity !== paths[i] || !natural(item.allocatedBytes)) return fail("BASELINE_PREDECESSOR")
    v7SurvivingAllocatedBytes += item.allocatedBytes
  }
  const measuredSurvivingAllocatedBytes = c.priorMeasuredSurvivingAllocatedBytes + v7SurvivingAllocatedBytes
  const cumulativeConservativeFloorBytes = c.priorConservativeAllocatedBytes + v7SurvivingAllocatedBytes
  const allocatedDiskBytes = Math.max(measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, c.terminalPhysicalBytes)
  if (![v7SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, allocatedDiskBytes].every(natural) || allocatedDiskBytes > LEAN_CAPS.retainedBytes || c.elapsedUpperBoundMs > LEAN_CAPS.elapsedMs || c.chargedMatches > LEAN_CAPS.matches) return fail("BASELINE_PREDECESSOR")
  const body = { schemaVersion: "lean-closed-v7-predecessor-v1" as const, closed: c, historicalPeakDiskBytes: "unknown" as const, historicalPeakRssBytes: "unknown" as const, priorMeasuredSurvivingAllocatedBytes: c.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: c.priorConservativeAllocatedBytes, survivors: o.survivors, v7SurvivingAllocatedBytes, measuredSurvivingAllocatedBytes, cumulativeConservativeFloorBytes, allocatedDiskBytes, elapsedUpperBoundMs: c.elapsedUpperBoundMs, chargedMatches: c.chargedMatches, successfulMatches: c.successfulMatches }
  return freezeLabValue({ ...body, root: labRoot("lean-closed-v7-predecessor-v1", body) })
}
/** Fixed-file metadata inspection only. Raw hashes and the completed time
 * journal are read; historical gameplay/replay interpretation is not repeated. */
export const inspectLeanClosedV7Predecessor = (): Readonly<LeanClosedV7Predecessor> => {
  const c = LEAN_CLOSED_V7, store = safeDirectory(c.storeIdentity)
  const files = readdirSync(store).sort(), digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const allocation = parse(readSafe(join(store, "allocation.json"))) as { root: LabRoot; sourceRoot: LabRoot; predecessor: { root: LabRoot; measuredSurvivingAllocatedBytes: number; allocatedDiskBytes: number } }
  const entry = parse(readSafe(join(store, "entry.json"))) as LeanChildEntryV2
  const terminal = parse(readSafe(join(store, "child-terminal.json"))) as LeanChildTerminalV2
  const result = parse(readSafe(join(store, "result.json"))) as { allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; charged: number; successful: number; elapsedMs: number; tier: string; issued: boolean; evidenceClass: string }
  const timeText = Buffer.from(readSafe(join(store, "time.ndjson"))).toString("utf8")
  if (!timeText.endsWith("\n")) return fail("BASELINE_PREDECESSOR")
  const paths = leanClosedV7SurvivorPaths(), seen = new Set<string>()
  const survivors = paths.map((identity, index) => {
    if (index === 0 || index === paths.length - 1) {
      const directory = safeDirectory(identity)
      if (index === paths.length - 1 && readdirSync(directory).length !== 0) return fail("BASELINE_PREDECESSOR")
      return { identity, allocatedBytes: statSync(directory).blocks * 512 }
    }
    const path = resolve(identity), stat = lstatSync(path), inode = `${stat.dev}:${stat.ino}`
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || seen.has(inode)) return fail("BASELINE_PREDECESSOR")
    seen.add(inode); return { identity, allocatedBytes: stat.blocks * 512 }
  })
  return createLeanClosedV7Predecessor({
    raw: { allocation: digest(join(store, "allocation.json")), canonical: digest(c.canonicalIdentity), request: digest(c.requestIdentity), result: digest(join(store, "result.json")), ledger: digest(join(store, "ledger.ndjson")), time: digest(join(store, "time.ndjson")), entry: digest(join(store, "entry.json")), terminal: digest(join(store, "child-terminal.json")), replay: digest(join(store, c.replayName)), report: digest(c.reportIdentity) },
    storeFiles: files, allocationRoot: allocation.root, sourceRoot: allocation.sourceRoot, heldHead: entry.head, priorPredecessorRoot: allocation.predecessor.root, priorMeasuredSurvivingAllocatedBytes: allocation.predecessor.measuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: allocation.predecessor.allocatedDiskBytes,
    entry: { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid },
    terminal: { entryBytesRoot: terminal.entryBytesRoot, allocationRoot: terminal.allocationRoot, sourceRoot: terminal.sourceRoot, head: terminal.head, parentPid: terminal.parentPid, childPid: terminal.childPid, status: terminal.status, exitCode: terminal.exitCode, signal: terminal.signal, physicalBytes: terminal.physicalBytes },
    result: { allocationRoot: result.allocationRoot, sourceRoot: result.sourceRoot, head: result.head, charged: result.charged, successful: result.successful, elapsedMs: result.elapsedMs, tier: result.tier, issued: result.issued, evidenceClass: result.evidenceClass },
    timeEvents: timeText.slice(0, -1).split("\n").map(line => parse(Buffer.from(line)) as { kind: string; id: string; atMs: number }), survivors,
  })
}
const expectedLeanSurvivors = () => [
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/allocation.json`, bytesRoot: LEAN_FAILED_PREFIX.oldAllocationBytesRoot },
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/entry.json`, bytesRoot: LEAN_FAILED_PREFIX.oldEntryBytesRoot },
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/ledger.ndjson`, bytesRoot: LEAN_FAILED_PREFIX.oldChargeBytesRoot },
  { identity: `${LEAN_FAILED_PREFIX.oldStoreIdentity}/time.ndjson`, bytesRoot: LEAN_FAILED_PREFIX.oldTimeBytesRoot },
  { identity: ".strategy-lab/lean-pilot-request-20261003-v2.json", bytesRoot: LEAN_FAILED_PREFIX.oldRequestBytesRoot },
  { identity: LEAN_FAILED_PREFIX.oldCanonicalAllocationIdentity, bytesRoot: LEAN_FAILED_PREFIX.oldAllocationBytesRoot },
]
/** Pure admission of observed surviving blocks. This is not a historical peak claim. */
export const createLeanProspectiveDiskBasis = (survivors: readonly LeanSurvivor[], oldStoreDirectoryAllocatedBytes: number, approvalBytes: Uint8Array): Readonly<LeanProspectiveDiskBasis> => {
  if (leanBytesRoot(approvalBytes) !== LEAN_DISK_APPROVAL.bytesRoot || !Array.isArray(survivors) || survivors.length !== 6 || !natural(oldStoreDirectoryAllocatedBytes)) return fail("DISK_BASIS")
  const expected = expectedLeanSurvivors()
  let storeBytes = oldStoreDirectoryAllocatedBytes, survivingAllocatedBytes = storeBytes
  for (let i = 0; i < expected.length; i++) {
    const item = survivors[i]!, fixed = expected[i]!
    if (!exactLabKeys(item, ["identity", "bytesRoot", "allocatedBytes"]) || item.identity !== fixed.identity || item.bytesRoot !== fixed.bytesRoot || !natural(item.allocatedBytes) || item.allocatedBytes > LEAN_CAPS.retainedBytes) return fail("DISK_BASIS")
    survivingAllocatedBytes += item.allocatedBytes
    if (i < 4) storeBytes += item.allocatedBytes
  }
  if (!natural(survivingAllocatedBytes) || survivingAllocatedBytes > LEAN_CAPS.retainedBytes || storeBytes !== LEAN_FAILED_PREFIX.allocatedDiskBytes) return fail("DISK_BASIS")
  const body = { schemaVersion: "lean-prospective-surviving-disk-v1" as const, historicalPeakDiskBytes: "unknown" as const, diskApproval: LEAN_DISK_APPROVAL, survivors, oldStoreDirectoryAllocatedBytes, survivingAllocatedBytes }
  return freezeLabValue({ ...body, root: labRoot("lean-prospective-surviving-disk-v1", body) })
}
export const verifyLeanProspectiveDiskBasis = (claim: unknown, survivors: readonly LeanSurvivor[], oldStoreDirectoryAllocatedBytes: number, approvalBytes: Uint8Array): Readonly<LeanProspectiveDiskBasis> => {
  if (!exactLabKeys(claim, ["schemaVersion", "historicalPeakDiskBytes", "diskApproval", "survivors", "oldStoreDirectoryAllocatedBytes", "survivingAllocatedBytes", "root"])) return fail("DISK_BASIS")
  const expected = createLeanProspectiveDiskBasis(survivors, oldStoreDirectoryAllocatedBytes, approvalBytes)
  if (labRoot("lean-disk-basis-admission", claim) !== labRoot("lean-disk-basis-admission", expected)) return fail("DISK_BASIS")
  return expected
}
const FAILED_WRITE_INVENTORY = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-FAILED-PREFIX-WRITE-INVENTORY-v1.json"
const FAILED_WRITE_REVIEW = ".planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-FAILED-PREFIX-DISK-INVENTORY-v1.md"
type FailedWriteDestination = { path: string; kind: "source" | "core" | "runtime-cache" | "scratch"; allocatedBytes: number; upperBoundBytes: number; evidenceRoot: LabRoot }
/** No contemporaneous failed-PID core limit or TSX-cache write ceiling is
 * retained. A present-day path inventory or reviewer signature cannot turn
 * either unknown historical maximum into an admissible number. This gate
 * remains closed until independently verified source evidence is bound in a
 * separately reviewed source amendment; it does not apply the pending human
 * resource-accounting choice. */
const HISTORICAL_CORE_CACHE_BOUNDS_ESTABLISHED = false
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
  if (!HISTORICAL_CORE_CACHE_BOUNDS_ESTABLISHED) return fail("PREDECESSOR_HISTORICAL_BOUND")
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
export interface LeanExperimentAllocationV2 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v2"; predecessor: Omit<typeof LEAN_FAILED_PREFIX, "allocatedDiskBytes"> & { readonly allocatedDiskBytes: number; readonly diskBasis: LeanProspectiveDiskBasis }; root: LabRoot }
export interface LeanExperimentAllocationV3 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v3"; predecessor: LeanClosedV2Predecessor; root: LabRoot }
export interface LeanExperimentAllocationV4 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v4"; predecessor: LeanClosedV3Predecessor; root: LabRoot }
export interface LeanExperimentAllocationV5 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v5"; predecessor: LeanClosedV4Predecessor; root: LabRoot }
export interface LeanExperimentAllocationV6 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v6"; predecessor: LeanClosedV5Predecessor; root: LabRoot }
export interface LeanExperimentAllocationV7 extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> { schemaVersion: "lean-experiment-allocation-v7"; predecessor: LeanClosedV6Predecessor; root: LabRoot }
export type LeanCurrentBaselineSlotKind = "initial_training" | "initial_matrix" | "response_training" | "response_pairing" | "probe" | "repeat"
const LEAN_BASELINE_SLOT_GROUPS = Object.freeze([8, 4, 8, 8, 4, 4] as const)
const LEAN_BASELINE_SLOT_KINDS = Object.freeze(["initial_training", "initial_matrix", "response_training", "response_pairing", "probe", "repeat"] as const)
const currentBaselineArenas = () => CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.status === "active" && a.schedulable).sort((a, b) => a.semanticGeometryHash.localeCompare(b.semanticGeometryHash))
const currentBaselineSmokeArenaIndex = (): number => {
  const arenas = currentBaselineArenas()
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter(a => a.id === "arena:smoke:v1" && a.name === "Smoke" && a.status === "active" && a.schedulable)
  if (arenas.length !== 2 || smoke.length !== 1) return fail("ARENA")
  const index = arenas.findIndex(a => a.semanticGeometryHash === smoke[0]!.semanticGeometryHash)
  return index < 0 ? fail("ARENA") : index
}
export const currentBaselineSlotKind = (ordinal: number): Readonly<{ kind: LeanCurrentBaselineSlotKind; localOrdinal: number; arenaIndex: number; condition: number }> => {
  if (!natural(ordinal) || ordinal >= 36) return fail("BASELINE_SLOT")
  let offset = 0
  for (let i = 0; i < LEAN_BASELINE_SLOT_GROUPS.length; i++) {
    const count = LEAN_BASELINE_SLOT_GROUPS[i]!
    if (ordinal < offset + count) {
      const localOrdinal = ordinal - offset
      return Object.freeze({ kind: LEAN_BASELINE_SLOT_KINDS[i]!, localOrdinal, arenaIndex: currentBaselineSmokeArenaIndex(), condition: localOrdinal % 4 })
    }
    offset += count
  }
  return fail("BASELINE_SLOT")
}
export interface LeanCurrentBaselineAllocation extends Omit<LeanExperimentAllocation, "schemaVersion" | "root"> {
  schemaVersion: "lean-current-baseline-allocation-v1"; coldRoot: LabRoot; planRoot: LabRoot; requestRoots: readonly LabRoot[]
  predecessor: LeanClosedV7Predecessor; root: LabRoot
}
export type LeanCurrentBaselineInput = { sourceRoot: LabRoot; reviewRoot: LabRoot; coldRoot: LabRoot; planRoot: LabRoot; candidateRoots: readonly LabRoot[]; requestRoots: readonly LabRoot[]; seed: string }
export interface LeanCorrectionPredecessor {
  schemaVersion: "lean-correction-predecessor-v1"; chargedMatches: number; elapsedUpperBoundMs: number; allocatedDiskBytes: number
  historicalPeakDiskBytes: "unknown"; historicalPeakRssBytes: "unknown"; historyRoot: LabRoot
  survivors: readonly { identity: string; allocatedBytes: number }[]; root: LabRoot
}
export interface LeanCorrectionAllocation extends Omit<LeanCurrentBaselineAllocation, "schemaVersion" | "predecessor" | "caps"> {
  caps: typeof LEAN_CAPS | typeof LEAN_SUPERVISOR_V5_CAPS | typeof LEAN_REPLAY_V7_CAPS | typeof LEAN_RETRY_V8_TIMEBOX_CAPS; timeboxExtension?: LeanRetryTimeboxExtension; startupPolicyRoot?: LabRoot
  schemaVersion: "lean-correction-supervisor-diagnostic-allocation-v8" | "lean-correction-supervisor-baseline-allocation-v8" | "lean-correction-supervisor-diagnostic-allocation-v7" | "lean-correction-supervisor-baseline-allocation-v7" | "lean-correction-supervisor-diagnostic-allocation-v6" | "lean-correction-supervisor-baseline-allocation-v6" | "lean-correction-supervisor-diagnostic-allocation-v5" | "lean-correction-supervisor-baseline-allocation-v5" | "lean-correction-supervisor-diagnostic-allocation-v4" | "lean-correction-supervisor-baseline-allocation-v4" | "lean-correction-diagnostic-allocation-v1" | "lean-correction-baseline-allocation-v1" | "lean-correction-supervisor-diagnostic-allocation-v2" | "lean-correction-supervisor-baseline-allocation-v2" | "lean-correction-supervisor-diagnostic-allocation-v3" | "lean-correction-supervisor-baseline-allocation-v3"
  route: "diagnostic" | "baseline"; reuseGrantRoot: LabRoot; diagnosisRoot: LabRoot | null; predecessor: LeanCorrectionPredecessor
  supervisorDecisionRoot?: LabRoot; acceptedCheckRoot?: LabRoot | null; requestBytesRoot?: LabRoot; dataReviewRoot?: LabRoot; setupAccountingRoot?: LabRoot
  attemptOrdinal?: LeanRetryOrdinal; priorClosureRoot?: LabRoot | null; continuationRoot?: LabRoot | null; acceptedReaderCloseRoot?: LabRoot | null
}
export type AnyLeanAllocation = LeanExperimentAllocation | LeanExperimentAllocationV2 | LeanExperimentAllocationV3 | LeanExperimentAllocationV4 | LeanExperimentAllocationV5 | LeanExperimentAllocationV6 | LeanExperimentAllocationV7 | LeanCurrentBaselineAllocation | LeanCorrectionAllocation
const leanProspective = (a: AnyLeanAllocation): a is Exclude<AnyLeanAllocation, LeanExperimentAllocation> => a.schemaVersion !== "lean-experiment-allocation-v1"
const leanPriorMs = (a: AnyLeanAllocation): number => leanProspective(a) ? a.predecessor.elapsedUpperBoundMs : 0
const leanPriorBytes = (a: AnyLeanAllocation): number => leanProspective(a) ? a.predecessor.allocatedDiskBytes : 0
export const leanCorrectionRoutePaths = (route: "diagnostic" | "baseline", supervisor: LeanSupervisorMode = false) => (isLeanRemainingBudgetMode(supervisor) ? remainingPaths[leanRetryOrdinal(supervisor)] : isLeanRetryMode(supervisor) ? retryPaths[leanRetryOrdinal(supervisor)] : supervisor === "v7" ? LEAN_REPLAY_V7_ROUTES : supervisor === "v6" ? LEAN_REPLAY_V6_ROUTES : supervisor === "v5" ? LEAN_STARTUP_V5_ROUTES : supervisor === "v4" ? LEAN_REPAIRED_READER_ROUTES : supervisor === "v3" ? LEAN_FRESH_SUPERVISOR_ROUTES : supervisor ? LEAN_SUPERVISOR_CORRECTION_ROUTES : LEAN_CORRECTION_ROUTES)[route]
export const isLeanSupervisorAllocation = (a: AnyLeanAllocation) => a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v2" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v2"
export const leanSupervisorAllocationMode = (a: AnyLeanAllocation): LeanSupervisorMode => a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v8" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v8" ? isLeanRetryMode(`${isLeanRemainingBudgetExtensionV9((a as LeanCorrectionAllocation).timeboxExtension) ? "v9" : "v8"}-${(a as LeanCorrectionAllocation).attemptOrdinal}`) ? `${isLeanRemainingBudgetExtensionV9((a as LeanCorrectionAllocation).timeboxExtension) ? "v9" : "v8"}-${(a as LeanCorrectionAllocation).attemptOrdinal}` as LeanRetryMode : fail("RETRY_ORDINAL") : a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v7" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v7" ? "v7" : a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v6" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v6" ? "v6" : a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v5" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v5" ? "v5" : a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v4" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v4" ? "v4" : a.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v3" || a.schemaVersion === "lean-correction-supervisor-baseline-allocation-v3" ? "v3" : isLeanSupervisorAllocation(a)
export const leanWritablePaths = (a: AnyLeanAllocation): readonly string[] => "route" in a ? (() => { const supervisor = leanSupervisorAllocationMode(a), p = leanCorrectionRoutePaths(a.route, supervisor); return [p.temp, p.allocation, p.request, ...(supervisor ? [isLeanRetryMode(supervisor) ? leanRetrySetupPath(supervisor) : supervisor === "v7" ? LEAN_REPLAY_V7_SETUP_PATH : supervisor === "v6" ? LEAN_REPLAY_V6_SETUP_PATH : supervisor === "v5" ? LEAN_STARTUP_V5_SETUP_PATH : supervisor === "v4" ? LEAN_REPAIRED_READER_SETUP_PATH : supervisor === "v3" ? LEAN_FRESH_SUPERVISOR_SETUP_PATH : LEAN_SUPERVISOR_SETUP_PATH] : [])] })() : a.schemaVersion === "lean-experiment-allocation-v2" ? LEAN_PROSPECTIVE_WRITABLE_PATHS : a.schemaVersion === "lean-experiment-allocation-v3" ? LEAN_SUCCESSOR_WRITABLE_PATHS : a.schemaVersion === "lean-experiment-allocation-v4" ? LEAN_V4_WRITABLE_PATHS : a.schemaVersion === "lean-experiment-allocation-v5" ? LEAN_V5_WRITABLE_PATHS : a.schemaVersion === "lean-experiment-allocation-v6" ? LEAN_V6_WRITABLE_PATHS : a.schemaVersion === "lean-experiment-allocation-v7" ? LEAN_V7_WRITABLE_PATHS : a.schemaVersion === "lean-current-baseline-allocation-v1" ? LEAN_BASELINE_WRITABLE_PATHS : a.schemaVersion === "lean-experiment-allocation-v1" ? [] : fail("ALLOCATION")
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
  const diskBasis = inspectLeanProspectiveDiskBasis()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v2" as const, predecessor: { ...LEAN_FAILED_PREFIX, allocatedDiskBytes: diskBasis.survivingAllocatedBytes, diskBasis } }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v2", body) })
}
export const createLeanAllocationV3 = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocationV3> => {
  const { root: _oldRoot, schemaVersion: _oldVersion, ...base } = createLeanAllocation(input)
  const predecessor = inspectLeanClosedV2Predecessor()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v3" as const, predecessor }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v3", body) })
}
export const createLeanAllocationV4 = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocationV4> => {
  const { root: _oldRoot, schemaVersion: _oldVersion, ...base } = createLeanAllocation(input)
  const predecessor = inspectLeanClosedV3Predecessor()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v4" as const, predecessor }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v4", body) })
}
export const createLeanAllocationV5 = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocationV5> => {
  const { root: _oldRoot, schemaVersion: _oldVersion, ...base } = createLeanAllocation(input)
  const predecessor = inspectLeanClosedV4Predecessor()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v5" as const, predecessor }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v5", body) })
}
export const createLeanAllocationV6 = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocationV6> => {
  const { root: _oldRoot, schemaVersion: _oldVersion, ...base } = createLeanAllocation(input)
  const predecessor = inspectLeanClosedV5Predecessor()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v6" as const, predecessor }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v6", body) })
}
export const createLeanAllocationV7 = (input: { sourceRoot: LabRoot; reviewRoot: LabRoot; candidateRoots: readonly LabRoot[]; seed: string }): Readonly<LeanExperimentAllocationV7> => {
  const { root: _oldRoot, schemaVersion: _oldVersion, ...base } = createLeanAllocation(input)
  const predecessor = inspectLeanClosedV6Predecessor()
  const body = { ...base, schemaVersion: "lean-experiment-allocation-v7" as const, predecessor }
  return freezeLabValue({ ...body, root: labRoot("lean-experiment-allocation-v7", body) })
}
/** The two candidateRoots bind predeclared mechanisms, not post-training
 * Strategy sources. Stage-frozen source receipts must be checked by the trusted
 * baseline entry separately before any slot is charged. */
export const createLeanCurrentBaselineAllocation = (input: LeanCurrentBaselineInput, predecessor: LeanClosedV7Predecessor = inspectLeanClosedV7Predecessor()): Readonly<LeanCurrentBaselineAllocation> => {
  if (!exactLabKeys(input, ["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed"]) || !root(input.sourceRoot) || !root(input.reviewRoot) || !root(input.coldRoot) || !root(input.planRoot) || !Array.isArray(input.candidateRoots) || input.candidateRoots.length !== 2 || !input.candidateRoots.every(root) || new Set(input.candidateRoots).size !== 2 || !Array.isArray(input.requestRoots) || input.requestRoots.length !== 36 || !input.requestRoots.every(root) || new Set(input.requestRoots).size !== 36 || !/^[a-z0-9-]{1,100}$/u.test(input.seed) || predecessor.schemaVersion !== "lean-closed-v7-predecessor-v1" || predecessor.closed.allocationRoot !== LEAN_CLOSED_V7.allocationRoot || predecessor.elapsedUpperBoundMs !== LEAN_CLOSED_V7.elapsedUpperBoundMs || predecessor.chargedMatches !== LEAN_CLOSED_V7.chargedMatches || !natural(predecessor.allocatedDiskBytes)) return fail("BASELINE_ALLOCATION")
  const candidateRoots = [...input.candidateRoots].sort(), requestRoots = [...input.requestRoots]
  const arenas = currentBaselineArenas()
  if (arenas.length !== 2 || new Set(arenas.map(a => a.semanticGeometryHash)).size !== 2 || arenas[currentBaselineSmokeArenaIndex()]!.id !== "arena:smoke:v1") return fail("ARENA")
  const slots = requestRoots.map((requestRoot, ordinal) => {
    const { arenaIndex, condition } = currentBaselineSlotKind(ordinal)
    const body = { ordinal, condition, arenaHash: arenas[arenaIndex]!.semanticGeometryHash, requestRoot }
    return { ...body, root: labRoot("lean-slot-v1", body) }
  })
  const sampleSlotRoots = LEAN_BASELINE_SLOT_GROUPS.map((_, i) => slots.find(s => currentBaselineSlotKind(s.ordinal).kind === LEAN_BASELINE_SLOT_KINDS[i])!.root)
  const body = { schemaVersion: "lean-current-baseline-allocation-v1" as const, privacy: "private_offline" as const, sourceRoot: input.sourceRoot, reviewRoot: input.reviewRoot, coldRoot: input.coldRoot, planRoot: input.planRoot, candidateRoots, requestRoots, seed: input.seed, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, caps: LEAN_CAPS, slots, sampleSlotRoots, predecessor }
  return freezeLabValue({ ...body, root: labRoot("lean-current-baseline-allocation-v1", body) })
}
export const createLeanCorrectionAllocation = (input: LeanCurrentBaselineInput & { route: "diagnostic" | "baseline"; reuseGrantRoot: LabRoot; diagnosisRoot: LabRoot | null; predecessor: LeanCorrectionPredecessor }): Readonly<LeanCorrectionAllocation> => {
  if (!exactLabKeys(input, ["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "route", "reuseGrantRoot", "diagnosisRoot", "predecessor"]) || !["diagnostic", "baseline"].includes(input.route) || !root(input.reuseGrantRoot) || (input.route === "diagnostic" ? input.diagnosisRoot !== null : !root(input.diagnosisRoot))) return fail("CORRECTION_ALLOCATION")
  const p = input.predecessor
  if (!exactLabKeys(p, ["schemaVersion", "chargedMatches", "elapsedUpperBoundMs", "allocatedDiskBytes", "historicalPeakDiskBytes", "historicalPeakRssBytes", "historyRoot", "survivors", "root"]) || p.schemaVersion !== "lean-correction-predecessor-v1" || !natural(p.chargedMatches) || p.chargedMatches < 10 || p.chargedMatches >= LEAN_CAPS.matches || !natural(p.elapsedUpperBoundMs) || p.elapsedUpperBoundMs < 3319046 || p.elapsedUpperBoundMs >= LEAN_CAPS.elapsedMs || !natural(p.allocatedDiskBytes) || p.allocatedDiskBytes > LEAN_CAPS.retainedBytes || p.historicalPeakDiskBytes !== "unknown" || p.historicalPeakRssBytes !== "unknown" || !root(p.historyRoot) || !Array.isArray(p.survivors) || !p.survivors.length) return fail("CORRECTION_PREDECESSOR")
  const { root: predecessorRoot, ...predecessorBody } = p
  if (predecessorRoot !== labRoot("lean-correction-predecessor-v1", predecessorBody) || new Set(p.survivors.map(s => s.identity)).size !== p.survivors.length || p.survivors.some(s => !exactLabKeys(s, ["identity", "allocatedBytes"]) || typeof s.identity !== "string" || !(s.identity.startsWith(".strategy-lab/") || s.identity === LEAN_BASELINE_WRITABLE_PATHS[1] || s.identity === LEAN_CORRECTION_ROUTES.diagnostic.allocation) || s.identity.includes("..") || !natural(s.allocatedBytes)) || p.survivors.reduce((n, s) => n + s.allocatedBytes, 0) > p.allocatedDiskBytes) return fail("CORRECTION_PREDECESSOR")
  if (![input.sourceRoot, input.reviewRoot, input.coldRoot, input.planRoot].every(root) || !/^[a-z0-9-]{1,100}$/u.test(input.seed) || !Array.isArray(input.candidateRoots) || input.candidateRoots.length !== 2 || !input.candidateRoots.every(root) || new Set(input.candidateRoots).size !== 2 || !Array.isArray(input.requestRoots) || input.requestRoots.length !== (input.route === "diagnostic" ? 1 : 36) || !input.requestRoots.every(root) || new Set(input.requestRoots).size !== input.requestRoots.length || (input.route === "diagnostic" ? p.chargedMatches !== 10 : p.chargedMatches < 11)) return fail("CORRECTION_ALLOCATION")
  const arenas = currentBaselineArenas()
  const slots = input.requestRoots.map((requestRoot, ordinal) => {
    const { arenaIndex, condition } = currentBaselineSlotKind(ordinal)
    const body = { ordinal, condition, arenaHash: arenas[arenaIndex]!.semanticGeometryHash, requestRoot }
    return { ...body, root: labRoot("lean-slot-v1", body) }
  })
  const sampleSlotRoots = input.route === "diagnostic" ? [slots[0]!.root] : LEAN_BASELINE_SLOT_KINDS.map(kind => slots.find(s => currentBaselineSlotKind(s.ordinal).kind === kind)!.root)
  const body = { schemaVersion: input.route === "diagnostic" ? "lean-correction-diagnostic-allocation-v1" as const : "lean-correction-baseline-allocation-v1" as const, privacy: "private_offline" as const, sourceRoot: input.sourceRoot, reviewRoot: input.reviewRoot, coldRoot: input.coldRoot, planRoot: input.planRoot, seed: input.seed, candidateRoots: [...input.candidateRoots].sort(), requestRoots: [...input.requestRoots], tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, caps: LEAN_CAPS, route: input.route, reuseGrantRoot: input.reuseGrantRoot, diagnosisRoot: input.diagnosisRoot, slots, sampleSlotRoots, predecessor: p }
  return freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
}
export const createLeanSupervisorCorrectionAllocation = (input: LeanCurrentBaselineInput & { route: "diagnostic" | "baseline"; reuseGrantRoot: LabRoot; supervisorDecisionRoot: LabRoot; acceptedCheckRoot: LabRoot | null; requestBytesRoot: LabRoot; dataReviewRoot: LabRoot; setupAccountingRoot: LabRoot; predecessor: LeanCorrectionPredecessor; startupPolicyRoot?: LabRoot; timeboxExtension?: LeanRetryTimeboxExtension; attemptOrdinal?: LeanRetryOrdinal; priorClosureRoot?: LabRoot | null; continuationRoot?: LabRoot | null; acceptedReaderCloseRoot?: LabRoot | null }, version: 2 | 3 | 4 | 5 | 6 | 7 | 8 = 2): Readonly<LeanCorrectionAllocation> => {
  if (version === 8) return createLeanRetryAllocationV8(input)
  if (![2, 3, 4, 5, 6, 7].includes(version) || !exactLabKeys(input, ["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "route", "reuseGrantRoot", "supervisorDecisionRoot", "acceptedCheckRoot", "requestBytesRoot", "dataReviewRoot", "setupAccountingRoot", "predecessor", ...((version === 5 || (version === 6 || version === 7)) ? ["startupPolicyRoot"] : [])]) || !["diagnostic", "baseline"].includes(input.route) || ![input.sourceRoot, input.reviewRoot, input.coldRoot, input.planRoot, input.reuseGrantRoot, input.supervisorDecisionRoot, input.requestBytesRoot, input.dataReviewRoot, input.setupAccountingRoot].every(root) || (input.route === "diagnostic" ? input.acceptedCheckRoot !== null : !root(input.acceptedCheckRoot)) || !/^[a-z0-9-]{1,100}$/u.test(input.seed) || !Array.isArray(input.candidateRoots) || input.candidateRoots.length !== 2 || !input.candidateRoots.every(root) || new Set(input.candidateRoots).size !== 2 || !Array.isArray(input.requestRoots) || input.requestRoots.length !== (input.route === "diagnostic" ? 1 : 36) || !input.requestRoots.every(root) || new Set(input.requestRoots).size !== input.requestRoots.length) return fail("SUPERVISOR_ALLOCATION")
  if (version === 5 && (input.supervisorDecisionRoot !== LEAN_STARTUP_APPROVAL_ROOT || input.planRoot !== LEAN_STARTUP_SUPPLEMENT_ROOT || input.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root)) return fail("STARTUP_POLICY")
  if (version === 6 && (input.supervisorDecisionRoot !== LEAN_REPLAY_V6_APPROVAL_ROOT || input.planRoot !== LEAN_REPLAY_V6_SUPPLEMENT_ROOT || input.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root)) return fail("STARTUP_POLICY")
  if (version === 7 && (input.supervisorDecisionRoot !== LEAN_REPLAY_V7_APPROVAL_ROOT || input.planRoot !== LEAN_REPLAY_V7_SUPPLEMENT_ROOT || input.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root)) return fail("STARTUP_POLICY")
  const caps = version === 7 ? LEAN_REPLAY_V7_CAPS : (version === 5 || version === 6) ? LEAN_SUPERVISOR_V5_CAPS : LEAN_CAPS
  const p = input.predecessor
  if (!exactLabKeys(p, ["schemaVersion", "chargedMatches", "elapsedUpperBoundMs", "allocatedDiskBytes", "historicalPeakDiskBytes", "historicalPeakRssBytes", "historyRoot", "survivors", "root"]) || p.schemaVersion !== "lean-correction-predecessor-v1" || !natural(p.chargedMatches) || (input.route === "diagnostic" ? p.chargedMatches !== (version === 7 ? 28 : version === 6 ? 24 : version === 5 ? 23 : version === 4 ? 12 : 11) : p.chargedMatches !== (version === 7 ? 29 : version === 6 ? 25 : version === 5 ? 24 : version === 4 ? 13 : 12)) || !natural(p.elapsedUpperBoundMs) || p.elapsedUpperBoundMs < (version === 7 ? 41943494 : version === 6 ? 36151532 : version === 5 ? 26634447 : version === 4 ? 20471046 : version === 3 ? 10888046 : 5282046) || p.elapsedUpperBoundMs >= caps.elapsedMs || !natural(p.allocatedDiskBytes) || (version === 7 ? p.allocatedDiskBytes < LEAN_REPLAY_V7_CARRY.physicalFloorBytes : version === 6 ? p.allocatedDiskBytes < 10432512 : version === 5 ? p.allocatedDiskBytes < 9617408 : version === 4 ? p.allocatedDiskBytes < 4231168 : version === 3 && p.allocatedDiskBytes < 2179072) || p.allocatedDiskBytes > LEAN_CAPS.retainedBytes || p.historicalPeakDiskBytes !== "unknown" || p.historicalPeakRssBytes !== "unknown" || !root(p.historyRoot) || !Array.isArray(p.survivors) || !p.survivors.length) return fail("SUPERVISOR_PREDECESSOR")
  const { root: predecessorRoot, ...predecessorBody } = p
  if (predecessorRoot !== labRoot(p.schemaVersion, predecessorBody) || new Set(p.survivors.map(s => s.identity)).size !== p.survivors.length || p.survivors.some(s => !exactLabKeys(s, ["identity", "allocatedBytes"]) || typeof s.identity !== "string" || !(s.identity.startsWith(".strategy-lab/") || s.identity.startsWith(".planning/artifacts/")) || s.identity.includes("..") || !natural(s.allocatedBytes)) || p.survivors.reduce((n, s) => n + s.allocatedBytes, 0) > p.allocatedDiskBytes) return fail("SUPERVISOR_PREDECESSOR")
  const arenas = currentBaselineArenas(), slots = input.requestRoots.map((requestRoot, ordinal) => {
    const { arenaIndex, condition } = currentBaselineSlotKind(ordinal)
    const body = { ordinal, condition, arenaHash: arenas[arenaIndex]!.semanticGeometryHash, requestRoot }
    return { ...body, root: labRoot("lean-slot-v1", body) }
  })
  const sampleSlotRoots = input.route === "diagnostic" ? [slots[0]!.root] : LEAN_BASELINE_SLOT_KINDS.map(kind => slots.find(s => currentBaselineSlotKind(s.ordinal).kind === kind)!.root)
  const body = { schemaVersion: (version === 7 ? input.route === "diagnostic" ? "lean-correction-supervisor-diagnostic-allocation-v7" : "lean-correction-supervisor-baseline-allocation-v7" : version === 6 ? input.route === "diagnostic" ? "lean-correction-supervisor-diagnostic-allocation-v6" : "lean-correction-supervisor-baseline-allocation-v6" : version === 5 ? input.route === "diagnostic" ? "lean-correction-supervisor-diagnostic-allocation-v5" : "lean-correction-supervisor-baseline-allocation-v5" : version === 4 ? input.route === "diagnostic" ? "lean-correction-supervisor-diagnostic-allocation-v4" : "lean-correction-supervisor-baseline-allocation-v4" : version === 3 ? input.route === "diagnostic" ? "lean-correction-supervisor-diagnostic-allocation-v3" : "lean-correction-supervisor-baseline-allocation-v3" : input.route === "diagnostic" ? "lean-correction-supervisor-diagnostic-allocation-v2" : "lean-correction-supervisor-baseline-allocation-v2") as LeanCorrectionAllocation["schemaVersion"], privacy: "private_offline" as const, sourceRoot: input.sourceRoot, reviewRoot: input.reviewRoot, coldRoot: input.coldRoot, planRoot: input.planRoot, seed: input.seed, candidateRoots: [...input.candidateRoots].sort(), requestRoots: [...input.requestRoots], tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, caps, ...((version === 5 || (version === 6 || version === 7)) ? { startupPolicyRoot: input.startupPolicyRoot! } : {}), route: input.route, reuseGrantRoot: input.reuseGrantRoot, diagnosisRoot: null, supervisorDecisionRoot: input.supervisorDecisionRoot, acceptedCheckRoot: input.acceptedCheckRoot, requestBytesRoot: input.requestBytesRoot, dataReviewRoot: input.dataReviewRoot, setupAccountingRoot: input.setupAccountingRoot, slots, sampleSlotRoots, predecessor: p }
  return freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
}
/** Reuse the unchanged schedule validation, never legacy authorization or identity. */
const bookkeepingReviewSurvivors = new Set([
  ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-BASELINE-DATA-REVIEW-v1.md",
  ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-DIAGNOSTIC-1-DATA-REVIEW-v1.md",
  ".planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-TWENTY-HOUR-REVIEW-v1.md",
])
export const LEAN_REMAINING_V9_PHASE = ".planning/phases/265-serious-current-rules-league-and-development-red-team/"
/** Physical custody only; never a functional manifest or a phase-wide whitelist. */
export const LEAN_REMAINING_V9_REVIEW_PATHS = Object.freeze([
  ...bookkeepingReviewSurvivors,
  ...["BOOKKEEPING-CONTINUATION-SOURCE-ADMISSION-REVIEW-v1", "BOOKKEEPING-CONTINUATION-DIAGNOSTIC-2-DATA-REVIEW-v1", "BOOKKEEPING-CONTINUATION-DIAGNOSTIC-2-TERMINAL-VERIFICATION-v1", "REMAINING-BUDGET-ENVELOPE-APPROVAL-20261007", "REMAINING-BUDGET-RESEARCH-v1", "REMAINING-BUDGET-RESEARCH-PLAN-v1", "REMAINING-BUDGET-SOURCE-REVIEW-v1", "REMAINING-BUDGET-REVIEW-FIX-v1", "REMAINING-BUDGET-SOURCE-VALIDATION-v1", "REMAINING-BUDGET-SOURCE-VERIFICATION-v1"].map(name => `${LEAN_REMAINING_V9_PHASE}NEW265-16-${name}.md`),
  ...([1, 2, 3] as const).flatMap(n => ["SOURCE", "DATA"].flatMap(kind => [`${LEAN_REMAINING_V9_PHASE}NEW265-16-V9-${n}-${kind}-REVIEW-v1.md`, `${LEAN_REMAINING_V9_PHASE}NEW265-16-V9-BASELINE-FOR-${n}-${kind}-REVIEW-v1.md`])),
  ...["V9-1-AUTHOR-FINALIZATION-TERMINAL-VERIFICATION-v1", "V9-1-FILE-ACCOUNTING-DIAGNOSIS-v1", "V9-FILE-BASIS-REPAIR-PLAN-v1", "V9-FILE-BASIS-PLAN-CHECK-v1", "V9-FILE-BASIS-SOURCE-SUMMARY-v1", "V9-FILE-BASIS-SOURCE-REVIEW-v1", "V9-FILE-BASIS-SOURCE-REVIEW-v2", "V9-FILE-BASIS-REVIEW-FIX-v1", "V9-FILE-BASIS-SOURCE-VALIDATION-v1", "V9-FILE-BASIS-SOURCE-VERIFICATION-v1"].map(name => `${LEAN_REMAINING_V9_PHASE}NEW265-16-${name}.md`),
])
export const validateLeanRemainingSurvivorsV9 = (p: LeanCorrectionPredecessor): void => {
  if (!exactLabKeys(p, ["schemaVersion", "chargedMatches", "elapsedUpperBoundMs", "allocatedDiskBytes", "historicalPeakDiskBytes", "historicalPeakRssBytes", "historyRoot", "survivors", "root"]) || !Array.isArray(p.survivors) || p.survivors.length < LEAN_REMAINING_V9_EXTENSION.historicalRows || !natural(p.allocatedDiskBytes) || p.allocatedDiskBytes < LEAN_REMAINING_V9_EXTENSION.physicalFloorBytes) return fail("RETRY_PREDECESSOR")
  const identities = new Set<string>(); let allocated = 0
  for (const row of p.survivors) {
    if (!exactLabKeys(row, ["identity", "allocatedBytes"]) || typeof row.identity !== "string" || !(row.identity.startsWith(".strategy-lab/") || row.identity.startsWith(".planning/artifacts/") || LEAN_REMAINING_V9_REVIEW_PATHS.includes(row.identity)) || row.identity.includes("..") || row.identity.includes("//") || !natural(row.allocatedBytes) || identities.has(row.identity)) return fail("RETRY_PREDECESSOR")
    identities.add(row.identity); allocated += row.allocatedBytes
    if (!natural(allocated) || allocated > p.allocatedDiskBytes) return fail("RETRY_PREDECESSOR")
  }
  // The allocated debit carries inherited conservative reserve; extant rows alone
  // need not meet that budget floor. Every row must still fit the allocated debit.
}
/** Uses the existing schedule builder, never reinterprets a v9 allocation as v8. */
const createLeanRemainingAllocationV9 = (input: Parameters<typeof createLeanSupervisorCorrectionAllocation>[0]): Readonly<LeanCorrectionAllocation> => {
  const b = admitLeanRetryTimeboxExtension(input.timeboxExtension), n = input.attemptOrdinal, p = input.predecessor
  if (!isLeanRemainingBudgetExtensionV9(b) || !exactLabKeys(input, ["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "route", "reuseGrantRoot", "supervisorDecisionRoot", "acceptedCheckRoot", "requestBytesRoot", "dataReviewRoot", "setupAccountingRoot", "predecessor", "startupPolicyRoot", "attemptOrdinal", "priorClosureRoot", "continuationRoot", "acceptedReaderCloseRoot", "timeboxExtension"]) || !isLeanRemainingBudgetMode(`v9-${n}`) || input.planRoot !== b.planRoot || input.supervisorDecisionRoot !== b.approvalRoot || input.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root) return fail("RETRY_ALLOCATION")
  validateLeanRemainingSurvivorsV9(p)
  const { root: pr, ...pb } = p
  if (pr !== labRoot(p.schemaVersion, pb) || !natural(p.chargedMatches) || p.chargedMatches < 30 || p.chargedMatches > 30 + n! - (input.route === "diagnostic" ? 1 : 0) || input.route === "baseline" && p.chargedMatches < 31 || !natural(p.elapsedUpperBoundMs) || p.elapsedUpperBoundMs < b.priorElapsedMs || p.elapsedUpperBoundMs + b.reserveMs >= b.elapsedMs || (n === 1 ? input.priorClosureRoot !== null || input.continuationRoot !== null : !root(input.priorClosureRoot) || !root(input.continuationRoot)) || (input.route === "diagnostic" ? input.acceptedReaderCloseRoot !== null : !root(input.acceptedReaderCloseRoot))) return fail("RETRY_PREDECESSOR")
  const { attemptOrdinal: _ordinal, priorClosureRoot: _closure, continuationRoot: _continuation, acceptedReaderCloseRoot: _accepted, timeboxExtension: _extension, ...common } = input
  const scheduleBody = { ...pb, survivors: p.survivors.filter(row => !LEAN_REMAINING_V9_REVIEW_PATHS.includes(row.identity)), elapsedUpperBoundMs: LEAN_RETRY_V8_CARRY.priorElapsedMs, chargedMatches: input.route === "diagnostic" ? 28 : 29 }
  const schedule = createLeanSupervisorCorrectionAllocation({ ...common, planRoot: LEAN_REPLAY_V7_SUPPLEMENT_ROOT, supervisorDecisionRoot: LEAN_REPLAY_V7_APPROVAL_ROOT, predecessor: { ...scheduleBody, root: labRoot(p.schemaVersion, scheduleBody) } }, 7)
  const { root: _schedule, ...base } = schedule
  const body = { ...base, caps: LEAN_RETRY_V8_TIMEBOX_CAPS, timeboxExtension: b, schemaVersion: `lean-correction-supervisor-${input.route}-allocation-v8` as LeanCorrectionAllocation["schemaVersion"], planRoot: input.planRoot, supervisorDecisionRoot: input.supervisorDecisionRoot, predecessor: p, attemptOrdinal: n!, priorClosureRoot: input.priorClosureRoot!, continuationRoot: input.continuationRoot!, acceptedReaderCloseRoot: input.acceptedReaderCloseRoot! }
  return freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
}
const createLeanRetryAllocationV8 = (input: Parameters<typeof createLeanSupervisorCorrectionAllocation>[0]): Readonly<LeanCorrectionAllocation> => {
  const extension = Object.hasOwn(input, "timeboxExtension") ? admitLeanRetryTimeboxExtension(input.timeboxExtension) : undefined
  if (isLeanRemainingBudgetExtensionV9(extension)) return createLeanRemainingAllocationV9(input)
  const caps = extension ? LEAN_RETRY_V8_TIMEBOX_CAPS : LEAN_REPLAY_V7_CAPS
  if (!exactLabKeys(input, ["sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "route", "reuseGrantRoot", "supervisorDecisionRoot", "acceptedCheckRoot", "requestBytesRoot", "dataReviewRoot", "setupAccountingRoot", "predecessor", "startupPolicyRoot", "attemptOrdinal", "priorClosureRoot", "continuationRoot", "acceptedReaderCloseRoot", ...(extension ? ["timeboxExtension"] : [])]) || !isLeanRetryMode(`v8-${input.attemptOrdinal}`) || input.planRoot !== LEAN_RETRY_V8_PLAN_ROOT || input.supervisorDecisionRoot !== LEAN_RETRY_V8_APPROVAL_ROOT || input.startupPolicyRoot !== LEAN_STARTUP_POLICY_V5.root) return fail("RETRY_ALLOCATION")
  const n = input.attemptOrdinal!, p = input.predecessor
  if (isLeanBookkeepingContinuationV8(extension) && (n !== 2 || input.priorClosureRoot !== extension.diagnosticClosureRoot || p.chargedMatches !== (input.route === "diagnostic" ? 30 : 31))) return fail("RETRY_PREDECESSOR")
  const { root: claimedPredecessorRoot, ...predecessorBody } = p
  if (claimedPredecessorRoot !== labRoot(p.schemaVersion, predecessorBody) || !natural(p.chargedMatches) || !natural(p.elapsedUpperBoundMs)) return fail("RETRY_PREDECESSOR")
  if (p.chargedMatches < 29 || p.chargedMatches > 29 + n - (input.route === "diagnostic" ? 1 : 0) || p.elapsedUpperBoundMs < (extension?.priorElapsedMs ?? LEAN_RETRY_V8_CARRY.priorElapsedMs) || (extension ? p.elapsedUpperBoundMs + 1_860_000 >= caps.elapsedMs : p.elapsedUpperBoundMs >= caps.elapsedMs) || (n === 1 ? input.priorClosureRoot !== null || input.continuationRoot !== null : !root(input.priorClosureRoot) || !root(input.continuationRoot)) || (input.route === "diagnostic" ? input.acceptedReaderCloseRoot !== null : !root(input.acceptedReaderCloseRoot))) return fail("RETRY_PREDECESSOR")
  let scheduleSurvivors = p.survivors
  if (isLeanBookkeepingContinuationV8(extension)) {
    // Validate the COMPLETE actual inventory before deriving a schedule-only
    // legacy compatibility view. Original rows/root/full debit remain below.
    if (!exactLabKeys(p, ["schemaVersion", "chargedMatches", "elapsedUpperBoundMs", "allocatedDiskBytes", "historicalPeakDiskBytes", "historicalPeakRssBytes", "historyRoot", "survivors", "root"]) || !Array.isArray(p.survivors) || !p.survivors.length || !natural(p.allocatedDiskBytes)) return fail("RETRY_PREDECESSOR")
    const identities = new Set<string>()
    let allocated = 0
    for (const row of p.survivors) {
      if (!exactLabKeys(row, ["identity", "allocatedBytes"]) || typeof row.identity !== "string" || !(row.identity.startsWith(".strategy-lab/") || row.identity.startsWith(".planning/artifacts/") || bookkeepingReviewSurvivors.has(row.identity)) || row.identity.includes("..") || !natural(row.allocatedBytes) || identities.has(row.identity)) return fail("RETRY_PREDECESSOR")
      identities.add(row.identity); allocated += row.allocatedBytes
      if (!natural(allocated) || allocated > p.allocatedDiskBytes) return fail("RETRY_PREDECESSOR")
    }
    scheduleSurvivors = p.survivors.filter(row => !bookkeepingReviewSurvivors.has(row.identity))
  }
  const { attemptOrdinal: _ordinal, priorClosureRoot: _closure, continuationRoot: _continuation, acceptedReaderCloseRoot: _accepted, timeboxExtension: _extension, ...common } = input
  const schedulePredecessorBody = { ...p, survivors: scheduleSurvivors, ...(extension ? { elapsedUpperBoundMs: LEAN_RETRY_V8_CARRY.priorElapsedMs } : {}), chargedMatches: input.route === "diagnostic" ? 28 : 29 }
  const { root: _priorRoot, ...scheduleBody } = schedulePredecessorBody
  const schedule = createLeanSupervisorCorrectionAllocation({ ...common, planRoot: LEAN_REPLAY_V7_SUPPLEMENT_ROOT, supervisorDecisionRoot: LEAN_REPLAY_V7_APPROVAL_ROOT, predecessor: { ...scheduleBody, root: labRoot(p.schemaVersion, scheduleBody) } }, 7)
  const { root: _scheduleRoot, ...base } = schedule
  const body = { ...base, caps, ...(extension ? { timeboxExtension: extension } : {}), schemaVersion: `lean-correction-supervisor-${input.route}-allocation-v8` as LeanCorrectionAllocation["schemaVersion"], planRoot: input.planRoot, supervisorDecisionRoot: input.supervisorDecisionRoot, predecessor: p, attemptOrdinal: n, priorClosureRoot: input.priorClosureRoot!, continuationRoot: input.continuationRoot!, acceptedReaderCloseRoot: input.acceptedReaderCloseRoot! }
  return freezeLabValue({ ...body, root: labRoot(body.schemaVersion, body) })
}
// Freeze alone does not make accessor/proxy results immutable. This eligibility
// check runs only after full admission and reads descriptors, never getters.
const RETRY_CACHE_MAX_DEPTH = 32
const RETRY_CACHE_MAX_NODES = 4096
const RETRY_CACHE_MAX_PROPERTIES = 4096
const immutableRetryData = (value: unknown): boolean => {
  const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }]
  const seen = new WeakSet<object>()
  let nodes = 0, properties = 0
  while (pending.length) {
    const current = pending.pop()!
    if (current.value === null || typeof current.value !== "object") {
      if (typeof current.value === "function") return false
      continue
    }
    const object = current.value
    if (current.depth > RETRY_CACHE_MAX_DEPTH || ++nodes > RETRY_CACHE_MAX_NODES || nodeTypes.isProxy(object) || seen.has(object)) return false
    seen.add(object)
    const array = Array.isArray(object), prototype = Object.getPrototypeOf(object)
    if ((array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) || !Object.isFrozen(object)) return false
    const keys = Reflect.ownKeys(object)
    properties += keys.length
    if (properties > RETRY_CACHE_MAX_PROPERTIES) return false
    if (array) {
      const length = Object.getOwnPropertyDescriptor(object, "length")
      if (!length || !("value" in length) || !natural(length.value) || length.value > RETRY_CACHE_MAX_PROPERTIES - properties) return false
      properties += length.value
      for (let i = 0; i < length.value; i++) {
        const index = Object.getOwnPropertyDescriptor(object, String(i))
        if (!index || !("value" in index)) return false
      }
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(object, key)
      if (!descriptor || !("value" in descriptor)) return false
      pending.push({ value: descriptor.value, depth: current.depth + 1 })
    }
  }
  return true
}
// Only safe reconstructed v8 objects returned by successful full admission are
// registered; caller objects, frozen clones and root strings acquire no authority.
const admittedRetryCaps = new WeakMap<object, typeof LEAN_REPLAY_V7_CAPS | typeof LEAN_RETRY_V8_TIMEBOX_CAPS>()
export const admitLeanAllocation = (value: unknown): Readonly<AnyLeanAllocation> => {
  if (typeof value === "object" && value !== null && ["lean-correction-supervisor-diagnostic-allocation-v8", "lean-correction-supervisor-baseline-allocation-v8"].includes((value as { schemaVersion: string }).schemaVersion)) {
    const a = value as LeanCorrectionAllocation
    const keys = ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "route", "reuseGrantRoot", "diagnosisRoot", "supervisorDecisionRoot", "acceptedCheckRoot", "requestBytesRoot", "dataReviewRoot", "setupAccountingRoot", "startupPolicyRoot", "attemptOrdinal", "priorClosureRoot", "continuationRoot", "acceptedReaderCloseRoot", "root", ...(Object.hasOwn(a, "timeboxExtension") ? ["timeboxExtension"] : [])]
    if (!exactLabKeys(a, keys)) return fail("RETRY_ALLOCATION")
    const { schemaVersion: _schema, privacy: _privacy, root: _root, caps: _caps, slots: _slots, tupleRoot: _tuple, runtimeRoot: _runtime, sampleSlotRoots: _samples, diagnosisRoot: _diagnosis, ...input } = a
    const expected = createLeanRetryAllocationV8(input as Parameters<typeof createLeanSupervisorCorrectionAllocation>[0])
    if (labRoot("lean-retry-admission-v8", a) !== labRoot("lean-retry-admission-v8", expected)) return fail("RETRY_ALLOCATION")
    if (immutableRetryData(expected)) admittedRetryCaps.set(expected, Object.hasOwn(expected, "timeboxExtension") ? LEAN_RETRY_V8_TIMEBOX_CAPS : LEAN_REPLAY_V7_CAPS)
    return expected
  }
  if (typeof value === "object" && value !== null && leanSupervisorAllocationMode(value as AnyLeanAllocation)) {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "route", "reuseGrantRoot", "diagnosisRoot", "supervisorDecisionRoot", "acceptedCheckRoot", "requestBytesRoot", "dataReviewRoot", "setupAccountingRoot", "root", ...((leanSupervisorAllocationMode(value as AnyLeanAllocation) === "v5" || (leanSupervisorAllocationMode(value as AnyLeanAllocation) === "v6" || leanSupervisorAllocationMode(value as AnyLeanAllocation) === "v7")) ? ["startupPolicyRoot"] : [])])) return fail("SUPERVISOR_ALLOCATION")
    const a = value as unknown as LeanCorrectionAllocation
    const expected = createLeanSupervisorCorrectionAllocation({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, coldRoot: a.coldRoot, planRoot: a.planRoot, candidateRoots: a.candidateRoots, requestRoots: a.requestRoots, seed: a.seed, route: a.route, reuseGrantRoot: a.reuseGrantRoot, supervisorDecisionRoot: a.supervisorDecisionRoot!, acceptedCheckRoot: a.acceptedCheckRoot!, requestBytesRoot: a.requestBytesRoot!, dataReviewRoot: a.dataReviewRoot!, setupAccountingRoot: a.setupAccountingRoot!, predecessor: a.predecessor, ...((leanSupervisorAllocationMode(a) === "v5" || (leanSupervisorAllocationMode(a) === "v6" || leanSupervisorAllocationMode(a) === "v7")) ? { startupPolicyRoot: a.startupPolicyRoot! } : {}) }, leanSupervisorVersion(leanSupervisorAllocationMode(a)))
    if (labRoot("lean-admission", expected) !== labRoot("lean-admission", a)) return fail("SUPERVISOR_ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && ["lean-correction-diagnostic-allocation-v1", "lean-correction-baseline-allocation-v1"].includes((value as { schemaVersion: string }).schemaVersion)) {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "route", "reuseGrantRoot", "diagnosisRoot", "root"])) return fail("CORRECTION_ALLOCATION")
    const a = value as unknown as LeanCorrectionAllocation
    const expected = createLeanCorrectionAllocation({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, coldRoot: a.coldRoot, planRoot: a.planRoot, candidateRoots: a.candidateRoots, requestRoots: a.requestRoots, seed: a.seed, route: a.route, reuseGrantRoot: a.reuseGrantRoot, diagnosisRoot: a.diagnosisRoot, predecessor: a.predecessor })
    if (labRoot("lean-admission", expected) !== labRoot("lean-admission", a)) return fail("CORRECTION_ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-current-baseline-allocation-v1") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "coldRoot", "planRoot", "candidateRoots", "requestRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("BASELINE_ALLOCATION")
    const a = value as unknown as LeanCurrentBaselineAllocation
    const expected = createLeanCurrentBaselineAllocation({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, coldRoot: a.coldRoot, planRoot: a.planRoot, candidateRoots: a.candidateRoots, requestRoots: a.requestRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("BASELINE_ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-experiment-allocation-v7") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("ALLOCATION")
    const a = value as unknown as LeanExperimentAllocationV7, expected = createLeanAllocationV7({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-experiment-allocation-v6") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("ALLOCATION")
    const a = value as unknown as LeanExperimentAllocationV6, expected = createLeanAllocationV6({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-experiment-allocation-v5") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("ALLOCATION")
    const a = value as unknown as LeanExperimentAllocationV5, expected = createLeanAllocationV5({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-experiment-allocation-v4") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("ALLOCATION")
    const a = value as unknown as LeanExperimentAllocationV4, expected = createLeanAllocationV4({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
    return expected
  }
  if (typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === "lean-experiment-allocation-v3") {
    if (!exactLabKeys(value, ["schemaVersion", "privacy", "sourceRoot", "reviewRoot", "candidateRoots", "seed", "tupleRoot", "runtimeRoot", "caps", "slots", "sampleSlotRoots", "predecessor", "root"])) return fail("ALLOCATION")
    const a = value as unknown as LeanExperimentAllocationV3, expected = createLeanAllocationV3({ sourceRoot: a.sourceRoot, reviewRoot: a.reviewRoot, candidateRoots: a.candidateRoots, seed: a.seed })
    if (labRoot("lean-admission", value) !== labRoot("lean-admission", expected)) return fail("ALLOCATION")
    return expected
  }
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
/** Validate all frames without retaining decoded text, line or frame collections.
 * Inflate remains synchronous and fully buffered under the original 4× guard. */
export const validateLeanReplay = (container: LeanReplayContainer, bytes: Uint8Array, maximumBytes = REPLAY_MAX): void => {
  if (!exactLabKeys(container, ["schemaVersion", "privacy", "codec", "compressedRoot", "uncompressedRoot", "compressedBytes", "uncompressedBytes", "frames", "root"]) || container.schemaVersion !== "lean-sampled-replay-gzip-v1" || container.privacy !== "private_offline" || container.codec !== "gzip-node-v1" || ![container.compressedRoot, container.uncompressedRoot, container.root].every(root) || ![container.compressedBytes, container.uncompressedBytes, container.frames].every(natural) || container.uncompressedBytes > Math.min(maximumBytes, REPLAY_MAX) || container.compressedBytes !== bytes.length || leanBytesRoot(bytes) !== container.compressedRoot) return fail("REPLAY")
  const { root: claimed, ...body } = container
  if (claimed !== labRoot("lean-sampled-replay-gzip-v1", body)) return fail("REPLAY")
  let plain: Buffer
  assertTransient(container.uncompressedBytes * 4)
  try { plain = gunzipSync(bytes, { maxOutputLength: Math.max(1, Math.min(maximumBytes, REPLAY_MAX)) }) } catch { return fail("REPLAY_LIMIT") }
  if (plain.length !== container.uncompressedBytes || leanBytesRoot(plain) !== container.uncompressedRoot) return fail("REPLAY")
  let count = 0
  for (let i = 0; i < plain.length; i++) if (plain[i] === 0x0a) count++
  if ((plain.length > 0 && plain[plain.length - 1] !== 0x0a) || count !== container.frames) return fail("REPLAY")
  let start = 0
  for (let i = 0; i < plain.length; i++) if (plain[i] === 0x0a) {
    // Match decodeLeanReplay's UTF-8 replacement and re-encoding semantics.
    parse(Buffer.from(plain.subarray(start, i).toString("utf8")))
    start = i + 1
  }
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
const inspectLeanFailedPrefixIdentity = () => {
  const store = safeDirectory(LEAN_FAILED_PREFIX.oldStoreIdentity)
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const files = readdirSync(store).sort()
  const p = LEAN_FAILED_PREFIX
  verifyLeanFailedPrefix({ allocation: digest(join(store, "allocation.json")), canonicalAllocation: digest(p.oldCanonicalAllocationIdentity), request: digest(".strategy-lab/lean-pilot-request-20261003-v2.json"), entry: digest(join(store, "entry.json")), time: digest(join(store, "time.ndjson")), charge: digest(join(store, "ledger.ndjson")), report: digest(p.terminalReportIdentity), decision: digest(p.approvedDecisionIdentity), storeFiles: files, physicalBytes: measureLeanPhysicalBytes(store), oldResultExists: files.includes("result.json") })
  return store
}
export const inspectLeanFailedPrefix = () => {
  inspectLeanFailedPrefixIdentity()
  return readLeanFailedWriteInventory()
}
/** Bounded to six known surviving files; no retrospective shared-cache scan. */
export const inspectLeanProspectiveDiskBasis = (): Readonly<LeanProspectiveDiskBasis> => {
  const store = inspectLeanFailedPrefixIdentity()
  const seen = new Set<string>()
  const survivors = expectedLeanSurvivors().map(fixed => {
    const path = resolve(fixed.identity), stat = lstatSync(path)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || !natural(stat.blocks * 512)) return fail("DISK_BASIS")
    const inode = `${stat.dev}:${stat.ino}`
    if (seen.has(inode)) return fail("DISK_BASIS")
    seen.add(inode)
    return { ...fixed, allocatedBytes: stat.blocks * 512 }
  })
  const directoryBlocks = statSync(store).blocks * 512
  return createLeanProspectiveDiskBasis(survivors, directoryBlocks, readSafe(resolve(LEAN_DISK_APPROVAL.identity)))
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
const activeTime = new Map<string, { id: string; atMs: number; priorMs: number; monotonicStartNs: bigint }>()
export const readLeanTimeAccounting = (ledger: LeanExperimentLedger) => {
  const priorMs = leanPriorMs(ledger.allocation)
  const text = Buffer.from(readSafe(join(safeDirectory(ledger.directory), "time.ndjson"))).toString("utf8")
  if (text.length && !text.endsWith("\n")) return fail("TIME_PUBLICATION")
  const starts = new Map<string, number>(), closed = new Set<string>(), closes = new Map<string, number>()
  let elapsedMs = priorMs
  for (const line of text ? text.slice(0, -1).split("\n") : []) {
    const e = parse(Buffer.from(line)) as { kind: string; id: string; atMs: number }
    if (!exactLabKeys(e, ["kind", "id", "atMs"]) || !/^[a-z0-9-]{1,80}$/u.test(e.id) || !natural(e.atMs)) return fail("TIME")
    if (e.kind === "start") { if (starts.has(e.id) || starts.size !== closed.size) return fail("TIME_ACTIVE"); starts.set(e.id, e.atMs) }
    else if (e.kind === "close") { const start = starts.get(e.id); if (start === undefined || closed.has(e.id) || e.atMs < start) return fail("TIME"); elapsedMs += e.atMs - start; if ((leanSupervisorAllocationMode(ledger.allocation) === "v5" || (leanSupervisorAllocationMode(ledger.allocation) === "v6" || (leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation))))) && !natural(elapsedMs)) return fail("TIME"); closed.add(e.id); closes.set(e.id, e.atMs) }
    else return fail("TIME")
  }
  return { elapsedMs: starts.size === closed.size ? elapsedMs : leanCapsForAllocation(ledger.allocation).elapsedMs, closedElapsedMs: elapsedMs, active: starts.size !== closed.size, starts, closed, closes }
}
const appendTime = (ledger: LeanExperimentLedger, kind: "start" | "close", id: string, atMs: number) => {
  assertLeanPublicationCapacity(ledger, 4096)
  const fd = openSync(join(safeDirectory(ledger.directory), "time.ndjson"), constants.O_APPEND | constants.O_WRONLY | constants.O_NOFOLLOW)
  try { writeLeanAll(fd, Buffer.concat([leanCanonicalBytes({ kind, id, atMs }), Buffer.from("\n")])); fsyncSync(fd) } finally { closeSync(fd) }
}
export const beginLeanInterval = (ledger: LeanExperimentLedger, id: string, atMs = Date.now(), monotonicStartNs = process.hrtime.bigint()) => {
  const s = readLeanTimeAccounting(ledger)
  if (s.active || s.starts.has(id) || s.elapsedMs >= leanCapsForAllocation(ledger.allocation).elapsedMs || !natural(atMs) || !/^[a-z0-9-]{1,80}$/u.test(id)) return fail("TIME_ACTIVE")
  appendTime(ledger, "start", id, atMs)
  activeTime.set(ledger.directory, { id, atMs, priorMs: s.elapsedMs, monotonicStartNs })
}
export const closeLeanInterval = (ledger: LeanExperimentLedger, id: string, atMs = Date.now(), monotonicObservedNs = process.hrtime.bigint()) => {
  const s = readLeanTimeAccounting(ledger), start = s.starts.get(id)
  const v5 = (leanSupervisorAllocationMode(ledger.allocation) === "v5" || (leanSupervisorAllocationMode(ledger.allocation) === "v6" || (leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation)))))
  if (!s.active || start === undefined || s.closed.has(id) || !natural(atMs) || !v5 && atMs < start) return fail("TIME")
  const local = activeTime.get(ledger.directory)
  if (v5) {
    if (local?.id !== id) return fail("TIME")
    const mono = monotonicObservedNs - local.monotonicStartNs
    if (mono < 0n || mono > BigInt(Number.MAX_SAFE_INTEGER) * 1000000n) return fail("TIME")
    atMs = start + Math.max(0, atMs - start, Number((mono + 999999n) / 1000000n))
    if (!natural(atMs)) return fail("TIME")
  }
  appendTime(ledger, "close", id, atMs)
  activeTime.delete(ledger.directory)
  return readLeanTimeAccounting(ledger)
}
/** Import an already authenticated historical wall span, not a newly timed
 * execution interval. Its append cost belongs to the caller's closure interval. */
export const importLeanClosedInterval = (ledger: LeanExperimentLedger, id: string, startMs: number, closeMs: number) => {
  const s = readLeanTimeAccounting(ledger)
  if (s.active || s.starts.has(id) || !natural(startMs) || !natural(closeMs) || closeMs < startMs || !/^[a-z0-9-]{1,80}$/u.test(id) || s.elapsedMs >= leanCapsForAllocation(ledger.allocation).elapsedMs) return fail("TIME")
  appendTime(ledger, "start", id, startMs); appendTime(ledger, "close", id, closeMs)
  return readLeanTimeAccounting(ledger)
}
export const leanRetryRootElapsedFloorV8 = (observedMs: number, timeboxExtension?: LeanRetryTimeboxExtension) => {
  if (!natural(observedMs)) return fail("RETRY_TIMEBOX_CLOCK")
  const carry = timeboxExtension === undefined ? LEAN_RETRY_V8_CARRY : admitLeanRetryTimeboxExtension(timeboxExtension)
  return carry.priorElapsedMs + Math.max(0, observedMs - carry.startedAtMs)
}
const currentLeanJournalElapsedMs = (ledger: LeanExperimentLedger) => {
  const s = readLeanTimeAccounting(ledger), local = activeTime.get(ledger.directory)
  if (s.active && leanProspective(ledger.allocation)) {
    const started = [...s.starts.values()].at(-1)
    if (started === undefined) return leanCapsForAllocation(ledger.allocation).elapsedMs
    if (!s.closed.has("pilot-entry")) {
      const entry = readLeanChildEntry(ledger), mono = process.hrtime.bigint() - monotonic(entry.monotonicStartNs)
      if (mono < 0n || mono > BigInt(Number.MAX_SAFE_INTEGER) * 1_000_000n) return leanCapsForAllocation(ledger.allocation).elapsedMs
      return s.closedElapsedMs + Math.max(0, Date.now() - started, Number((mono + 999_999n) / 1_000_000n))
    }
    if ((leanSupervisorAllocationMode(ledger.allocation) === "v5" || (leanSupervisorAllocationMode(ledger.allocation) === "v6" || (leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation)))))) {
      if (!local || local.atMs !== started) return leanCapsForAllocation(ledger.allocation).elapsedMs
      const mono = process.hrtime.bigint() - local.monotonicStartNs, wall = Date.now() - started
      if (mono < 0n || mono > BigInt(Number.MAX_SAFE_INTEGER) * 1000000n) return leanCapsForAllocation(ledger.allocation).elapsedMs
      const total = s.closedElapsedMs + Math.max(0, wall, Number((mono + 999999n) / 1000000n))
      return natural(total) ? total : LEAN_SUPERVISOR_V5_CAPS.elapsedMs
    }
    return s.closedElapsedMs + Math.max(0, Date.now() - started)
  }
  if (s.active && local) return local.priorMs + Math.max(0, Date.now() - local.atMs)
  return s.elapsedMs
}
/** All administration and gate wall time remains spent even between journals. */
export const currentLeanElapsedMs = (ledger: LeanExperimentLedger, notYetImportedGapMs = 0) => Math.max(currentLeanJournalElapsedMs(ledger) + notYetImportedGapMs, ledger.allocation.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v8" || ledger.allocation.schemaVersion === "lean-correction-supervisor-baseline-allocation-v8" ? leanRetryRootElapsedFloorV8(Date.now(), ledger.allocation.timeboxExtension) : 0)
export const createLeanLedger = (directory: string, allocation: AnyLeanAllocation): LeanExperimentLedger => {
  const p = resolve(directory)
  if (realpathSync(dirname(p)) !== dirname(p)) return fail("STORE")
  // A near-cap prospective claim must fail before predecessor evidence or
  // creating a directory. Admission below replaces it with the measured basis.
  if (leanProspective(allocation)) assertLeanProspectiveStoreCapacity(p, allocation, allocation.predecessor?.allocatedDiskBytes, 1_048_576)
  const a = admitLeanAllocation(allocation)
  if (leanProspective(a)) {
    if (a.schemaVersion === "lean-experiment-allocation-v2") inspectLeanProspectiveDiskBasis()
    assertLeanProspectiveStoreCapacity(p, a, a.predecessor.allocatedDiskBytes, leanCanonicalBytes(a).length)
  }
  mkdirSync(p, { mode: 0o700 }); safeDirectory(p)
  const allocationBytes = leanCanonicalBytes(a)
  if (leanProspective(a)) assertLeanProspectiveStoreCapacity(p, a, a.predecessor.allocatedDiskBytes, allocationBytes.length)
  writeExclusive(join(p, "allocation.json"), allocationBytes)
  if (leanProspective(a)) assertLeanProspectiveStoreCapacity(p, a, a.predecessor.allocatedDiskBytes, 0)
  writeExclusive(join(p, "ledger.ndjson"), new Uint8Array())
  if (leanProspective(a)) assertLeanProspectiveStoreCapacity(p, a, a.predecessor.allocatedDiskBytes, 0)
  writeExclusive(join(p, "time.ndjson"), new Uint8Array())
  return { directory: p, allocation: a }
}
export const openLeanLedger = (directory: string): LeanExperimentLedger => { const p = safeDirectory(directory), allocation = admitLeanAllocation(parse(readSafe(join(p, "allocation.json")))); if (allocation.schemaVersion === "lean-experiment-allocation-v2") inspectLeanProspectiveDiskBasis(); return { directory: p, allocation } }
export const measureLeanPhysicalBytes = (directory: string): number => {
  const p = safeDirectory(directory)
  return readdirSync(p).reduce((n, name) => { const s = lstatSync(join(p, name)); if (s.isSymbolicLink() || !s.isFile()) return fail("FILE"); return n + s.blocks * 512 }, statSync(p).blocks * 512)
}
/** Reserve disk for the pending store publication before each v2 write. The
 * parent filesystem must also have the unspent 15 GB envelope available. */
const assertLeanProspectiveStoreCapacity = (store: string, allocation: AnyLeanAllocation, survivingBytes: unknown, nextFileBytes: number): void => {
  if (!natural(survivingBytes) || !natural(nextFileBytes)) return fail("RESOURCE")
  const owned = leanWritablePaths(allocation).reduce((bytes, path) => bytes + measuredDestinationBlocks(path), 0)
  const current = survivingBytes + owned + measuredDestinationBlocks(store)
  const projected = current + Math.ceil(nextFileBytes / 4096) * 4096 + 131_072
  if (!natural(projected) || projected > LEAN_CAPS.retainedBytes || projected + LEAN_CAPS.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes) return fail("RESOURCE")
  const filesystem = statfsSync(dirname(store), { bigint: true })
  if (filesystem.bavail * filesystem.bsize < BigInt(LEAN_CAPS.totalBytes - current)) return fail("RESOURCE")
}
export const leanProspectiveOwnedBytes = (ledger: LeanExperimentLedger): number => measureLeanPhysicalBytes(ledger.directory) + leanWritablePaths(ledger.allocation).reduce((bytes, path) => bytes + measuredDestinationBlocks(path), 0)
export const cumulativeLeanPhysicalBytes = (ledger: LeanExperimentLedger): number => leanProspectiveOwnedBytes(ledger) + leanPriorBytes(ledger.allocation)
export interface LeanChildEntryV2 { schemaVersion: "lean-child-entry-v2"; allocationRoot: LabRoot; sourceRoot: LabRoot; requestBytesRoot: LabRoot; head: string; parentPid: number; childPid: number; handshakeRoot: LabRoot; wallStartMs: number; monotonicStartNs: string }
export interface LeanChildTerminalV2 { schemaVersion: "lean-child-terminal-v2"; entryBytesRoot: LabRoot; allocationRoot: LabRoot; sourceRoot: LabRoot; head: string; parentPid: number; childPid: number; exitCode: number | null; signal: string | null; wallObservedMs: number; monotonicObservedNs: string; elapsedUpperBoundMs: number; status: "child_exited" | "child_failed"; parentRssBytes: number; childRssObservedBytes: number | null; physicalBytes: number; freeBytes: number | null }
const monotonic = (v: string): bigint => /^\d{1,30}$/u.test(v) ? BigInt(v) : fail("MONOTONIC")
const syncLeanDirectory = (path: string): void => { const fd = openSync(safeDirectory(path), constants.O_RDONLY); try { fsyncSync(fd) } finally { closeSync(fd) } }
/** Correction-only setup costs must already be closed before runtime entry.
 * Legacy allocations still require an empty pre-entry time journal. */
export const admitsLeanPreEntryTime = (correction: boolean, time: Pick<ReturnType<typeof readLeanTimeAccounting>, "active" | "starts" | "closed">): boolean => correction
  ? !time.active && time.starts.size === time.closed.size && [...time.starts.keys()].every(id => (id === "correction-preparation" || id === "correction-request-data") && time.closed.has(id))
  : time.starts.size === 0 && !time.active && time.closed.size === 0
export const publishLeanChildEntry = (ledger: LeanExperimentLedger, entry: LeanChildEntryV2): void => {
  if (!leanProspective(ledger.allocation) || !exactLabKeys(entry, ["schemaVersion", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid", "handshakeRoot", "wallStartMs", "monotonicStartNs"]) || entry.schemaVersion !== "lean-child-entry-v2" || entry.allocationRoot !== ledger.allocation.root || entry.sourceRoot !== ledger.allocation.sourceRoot || !root(entry.requestBytesRoot) || !root(entry.handshakeRoot) || !/^[a-f0-9]{40}$/u.test(entry.head) || !natural(entry.parentPid) || entry.parentPid === 0 || !natural(entry.childPid) || entry.childPid === 0 || entry.parentPid === entry.childPid || !natural(entry.wallStartMs)) return fail("ENTRY")
  monotonic(entry.monotonicStartNs)
  const entryTime = readLeanTimeAccounting(ledger)
  if (!admitsLeanPreEntryTime("route" in ledger.allocation, entryTime) || readLeanLedger(ledger).events.length) return fail("ENTRY")
  writeExclusive(join(safeDirectory(ledger.directory), "entry.json"), leanCanonicalBytes(entry)); syncLeanDirectory(ledger.directory)
}
export const readLeanChildEntry = (ledger: LeanExperimentLedger): LeanChildEntryV2 => {
  if (!leanProspective(ledger.allocation)) return fail("ENTRY")
  const entry = parse(readSafe(join(safeDirectory(ledger.directory), "entry.json"))) as LeanChildEntryV2
  if (!exactLabKeys(entry, ["schemaVersion", "allocationRoot", "sourceRoot", "requestBytesRoot", "head", "parentPid", "childPid", "handshakeRoot", "wallStartMs", "monotonicStartNs"]) || entry.schemaVersion !== "lean-child-entry-v2" || entry.allocationRoot !== ledger.allocation.root || entry.sourceRoot !== ledger.allocation.sourceRoot || !root(entry.requestBytesRoot) || !root(entry.handshakeRoot) || !/^[a-f0-9]{40}$/u.test(entry.head) || !natural(entry.parentPid) || entry.parentPid === 0 || !natural(entry.childPid) || entry.childPid === 0 || entry.parentPid === entry.childPid || !natural(entry.wallStartMs)) return fail("ENTRY")
  monotonic(entry.monotonicStartNs); return entry
}
export const deriveLeanChildTerminal = (ledger: LeanExperimentLedger, entry: LeanChildEntryV2, observation: Omit<LeanChildTerminalV2, "schemaVersion" | "entryBytesRoot" | "allocationRoot" | "sourceRoot" | "head" | "parentPid" | "childPid" | "elapsedUpperBoundMs">): LeanChildTerminalV2 => {
  if (!leanProspective(ledger.allocation)) return fail("TERMINAL")
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
  if (!time.active || ("route" in ledger.allocation ? time.starts.size !== time.closed.size + 1 : time.starts.size !== 1 || time.closed.size !== 0) || time.starts.get("pilot-entry") !== entry.wallStartMs) return fail("TERMINAL")
  writeExclusive(join(safeDirectory(ledger.directory), "child-terminal.json"), leanCanonicalBytes(terminal)); syncLeanDirectory(ledger.directory)
  // V5 closes at the receipt's authenticated clock snapshot. Publication work
  // after that observation is debited by admission finalization, not silently
  // added to a close that must join the immutable terminal exactly.
  if ((leanSupervisorAllocationMode(ledger.allocation) === "v5" || (leanSupervisorAllocationMode(ledger.allocation) === "v6" || (leanSupervisorAllocationMode(ledger.allocation) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(ledger.allocation)))))) closeLeanInterval(ledger, "pilot-entry", entry.wallStartMs + terminal.elapsedUpperBoundMs, monotonic(terminal.monotonicObservedNs))
  else closeLeanInterval(ledger, "pilot-entry", entry.wallStartMs + terminal.elapsedUpperBoundMs)
}
export const readLeanChildTerminal = (ledger: LeanExperimentLedger): LeanChildTerminalV2 => {
  const terminal = parse(readSafe(join(safeDirectory(ledger.directory), "child-terminal.json"))) as LeanChildTerminalV2
  if (!exactLabKeys(terminal, ["schemaVersion", "entryBytesRoot", "allocationRoot", "sourceRoot", "head", "parentPid", "childPid", "exitCode", "signal", "wallObservedMs", "monotonicObservedNs", "elapsedUpperBoundMs", "status", "parentRssBytes", "childRssObservedBytes", "physicalBytes", "freeBytes"])) return fail("TERMINAL")
  const entry = readLeanChildEntry(ledger), { schemaVersion: _s, entryBytesRoot: _e, allocationRoot: _a, sourceRoot: _r, head: _h, parentPid: _p, childPid: _c, elapsedUpperBoundMs: _m, ...observation } = terminal
  if (labRoot("lean-terminal-admission", terminal) !== labRoot("lean-terminal-admission", deriveLeanChildTerminal(ledger, entry, observation))) return fail("TERMINAL")
  const time = readLeanTimeAccounting(ledger)
  const priorMs = leanPriorMs(ledger.allocation)
  if (time.starts.get("pilot-entry") !== entry.wallStartMs || time.closes.get("pilot-entry") !== entry.wallStartMs + terminal.elapsedUpperBoundMs || time.closedElapsedMs < priorMs + terminal.elapsedUpperBoundMs || terminal.elapsedUpperBoundMs + priorMs > leanCapsForAllocation(ledger.allocation).elapsedMs) return fail("TERMINAL")
  return terminal
}
/** Only the seven bounded closed-v2 records and its previously owned paths
 * are read. This never replays the historical factory repository. */
export const inspectLeanClosedV2Predecessor = (): Readonly<LeanClosedV2Predecessor> => {
  const c = LEAN_CLOSED_V2, store = safeDirectory(c.storeIdentity)
  const ledger = openLeanLedger(store)
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v2") return fail("SUCCESSOR_PREDECESSOR")
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
  const time = readLeanTimeAccounting(ledger), state = readLeanLedger(ledger)
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const paths = leanClosedV2SurvivorPaths(), seen = new Set<string>()
  const v2Survivors = paths.map((identity, index) => {
    if (index === 0 || index === paths.length - 1) {
      const directory = safeDirectory(identity)
      if (index === paths.length - 1 && readdirSync(directory).length !== 0) return fail("SUCCESSOR_PREDECESSOR")
      return { identity, allocatedBytes: statSync(directory).blocks * 512 }
    }
    const path = resolve(identity), stat = lstatSync(path), inode = `${stat.dev}:${stat.ino}`
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || seen.has(inode)) return fail("SUCCESSOR_PREDECESSOR")
    seen.add(inode)
    return { identity, allocatedBytes: stat.blocks * 512 }
  })
  return createLeanClosedV2Predecessor({
    raw: { allocation: digest(join(store, "allocation.json")), canonical: digest(c.canonicalIdentity), request: digest(c.requestIdentity), entry: digest(join(store, "entry.json")), terminal: digest(join(store, "child-terminal.json")), time: digest(join(store, "time.ndjson")), charge: digest(join(store, "ledger.ndjson")), report: digest(c.terminalReportIdentity) },
    storeFiles: readdirSync(store).sort(), allocationRoot: ledger.allocation.root, sourceRoot: ledger.allocation.sourceRoot, heldHead: entry.head,
    entry: { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid },
    terminal: { entryBytesRoot: terminal.entryBytesRoot, allocationRoot: terminal.allocationRoot, sourceRoot: terminal.sourceRoot, head: terminal.head, parentPid: terminal.parentPid, childPid: terminal.childPid, elapsedUpperBoundMs: terminal.elapsedUpperBoundMs, physicalBytes: terminal.physicalBytes, status: terminal.status, signal: terminal.signal, exitCode: terminal.exitCode },
    timeElapsedMs: time.elapsedMs, timeStarts: time.starts.size, timeCloses: time.closes.size, chargedMatches: state.charged, resultExists: readdirSync(store).includes("result.json"),
    v1DiskBasisRoot: ledger.allocation.predecessor.diskBasis.root, v1SurvivingAllocatedBytes: ledger.allocation.predecessor.allocatedDiskBytes, v2Survivors,
  })
}
/** Reopen only the closed v3 metadata chain; never replay its factory import. */
export const inspectLeanClosedV3Predecessor = (): Readonly<LeanClosedV3Predecessor> => {
  const c = LEAN_CLOSED_V3, store = safeDirectory(c.storeIdentity)
  const ledger = openLeanLedger(store)
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v3") return fail("SUCCESSOR_PREDECESSOR")
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
  const time = readLeanTimeAccounting(ledger), state = readLeanLedger(ledger)
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const receipt = parse(readSafe(join(store, "entry-failure.json"))) as LeanClosedV3Observation["receipt"]
  const paths = leanClosedV3SurvivorPaths(), seen = new Set<string>()
  const v3Survivors = paths.map((identity, index) => {
    if (index === 0 || index === paths.length - 1) {
      const directory = safeDirectory(identity)
      if (index === paths.length - 1 && readdirSync(directory).length !== 0) return fail("SUCCESSOR_PREDECESSOR")
      return { identity, allocatedBytes: statSync(directory).blocks * 512 }
    }
    const path = resolve(identity), stat = lstatSync(path), inode = `${stat.dev}:${stat.ino}`
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || seen.has(inode)) return fail("SUCCESSOR_PREDECESSOR")
    seen.add(inode)
    return { identity, allocatedBytes: stat.blocks * 512 }
  })
  return createLeanClosedV3Predecessor({
    raw: { allocation: digest(join(store, "allocation.json")), canonical: digest(c.canonicalIdentity), request: digest(c.requestIdentity), entry: digest(join(store, "entry.json")), receipt: digest(join(store, "entry-failure.json")), terminal: digest(join(store, "child-terminal.json")), time: digest(join(store, "time.ndjson")), charge: digest(join(store, "ledger.ndjson")), report: digest(c.terminalReportIdentity) },
    storeFiles: readdirSync(store).sort(), allocationRoot: ledger.allocation.root, sourceRoot: ledger.allocation.sourceRoot, heldHead: entry.head,
    entry: { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid },
    terminal: { entryBytesRoot: terminal.entryBytesRoot, allocationRoot: terminal.allocationRoot, sourceRoot: terminal.sourceRoot, head: terminal.head, parentPid: terminal.parentPid, childPid: terminal.childPid, elapsedUpperBoundMs: terminal.elapsedUpperBoundMs, physicalBytes: terminal.physicalBytes, status: terminal.status, signal: terminal.signal, exitCode: terminal.exitCode },
    receipt, timeElapsedMs: time.elapsedMs, timeStarts: time.starts.size, timeCloses: time.closes.size, chargedMatches: state.charged, resultExists: readdirSync(store).includes("result.json"),
    priorPredecessorRoot: ledger.allocation.predecessor.root, priorMeasuredSurvivingAllocatedBytes: ledger.allocation.predecessor.measuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: ledger.allocation.predecessor.allocatedDiskBytes, v3Survivors,
  })
}
/** Reopen only the closed v4 metadata chain; never replay its factory import. */
export const inspectLeanClosedV4Predecessor = (): Readonly<LeanClosedV4Predecessor> => {
  const c = LEAN_CLOSED_V4, store = safeDirectory(c.storeIdentity)
  const ledger = openLeanLedger(store)
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v4") return fail("SUCCESSOR_PREDECESSOR")
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
  const time = readLeanTimeAccounting(ledger), state = readLeanLedger(ledger)
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const receipt = parse(readSafe(join(store, "entry-failure.json"))) as LeanClosedV4Observation["receipt"]
  const paths = leanClosedV4SurvivorPaths(), seen = new Set<string>()
  const v4Survivors = paths.map((identity, index) => {
    if (index === 0 || index === paths.length - 1) {
      const directory = safeDirectory(identity)
      if (index === paths.length - 1 && readdirSync(directory).length !== 0) return fail("SUCCESSOR_PREDECESSOR")
      return { identity, allocatedBytes: statSync(directory).blocks * 512 }
    }
    const path = resolve(identity), stat = lstatSync(path), inode = `${stat.dev}:${stat.ino}`
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || seen.has(inode)) return fail("SUCCESSOR_PREDECESSOR")
    seen.add(inode)
    return { identity, allocatedBytes: stat.blocks * 512 }
  })
  return createLeanClosedV4Predecessor({
    raw: { allocation: digest(join(store, "allocation.json")), canonical: digest(c.canonicalIdentity), request: digest(c.requestIdentity), entry: digest(join(store, "entry.json")), receipt: digest(join(store, "entry-failure.json")), terminal: digest(join(store, "child-terminal.json")), time: digest(join(store, "time.ndjson")), charge: digest(join(store, "ledger.ndjson")), report: digest(c.terminalReportIdentity) },
    storeFiles: readdirSync(store).sort(), allocationRoot: ledger.allocation.root, sourceRoot: ledger.allocation.sourceRoot, heldHead: entry.head,
    entry: { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid },
    terminal: { entryBytesRoot: terminal.entryBytesRoot, allocationRoot: terminal.allocationRoot, sourceRoot: terminal.sourceRoot, head: terminal.head, parentPid: terminal.parentPid, childPid: terminal.childPid, elapsedUpperBoundMs: terminal.elapsedUpperBoundMs, physicalBytes: terminal.physicalBytes, status: terminal.status, signal: terminal.signal, exitCode: terminal.exitCode },
    receipt, timeElapsedMs: time.elapsedMs, timeStarts: time.starts.size, timeCloses: time.closes.size, chargedMatches: state.charged, resultExists: readdirSync(store).includes("result.json"),
    priorPredecessorRoot: ledger.allocation.predecessor.root, priorMeasuredSurvivingAllocatedBytes: ledger.allocation.predecessor.measuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: ledger.allocation.predecessor.allocatedDiskBytes, v4Survivors,
  })
}
/** Reopen only the closed v5 metadata chain; never replay its factory import. */
export const inspectLeanClosedV5Predecessor = (): Readonly<LeanClosedV5Predecessor> => {
  const c = LEAN_CLOSED_V5, store = safeDirectory(c.storeIdentity)
  const ledger = openLeanLedger(store)
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v5") return fail("SUCCESSOR_PREDECESSOR")
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
  const time = readLeanTimeAccounting(ledger), state = readLeanLedger(ledger)
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const receipt = parse(readSafe(join(store, "entry-failure.json"))) as LeanClosedV5Observation["receipt"]
  const paths = leanClosedV5SurvivorPaths(), seen = new Set<string>()
  const v5Survivors = paths.map((identity, index) => {
    if (index === 0 || index === paths.length - 1) {
      const directory = safeDirectory(identity)
      if (index === paths.length - 1 && readdirSync(directory).length !== 0) return fail("SUCCESSOR_PREDECESSOR")
      return { identity, allocatedBytes: statSync(directory).blocks * 512 }
    }
    const path = resolve(identity), stat = lstatSync(path), inode = `${stat.dev}:${stat.ino}`
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || seen.has(inode)) return fail("SUCCESSOR_PREDECESSOR")
    seen.add(inode)
    return { identity, allocatedBytes: stat.blocks * 512 }
  })
  return createLeanClosedV5Predecessor({
    raw: { allocation: digest(join(store, "allocation.json")), canonical: digest(c.canonicalIdentity), request: digest(c.requestIdentity), entry: digest(join(store, "entry.json")), receipt: digest(join(store, "entry-failure.json")), terminal: digest(join(store, "child-terminal.json")), time: digest(join(store, "time.ndjson")), charge: digest(join(store, "ledger.ndjson")), report: digest(c.terminalReportIdentity) },
    storeFiles: readdirSync(store).sort(), allocationRoot: ledger.allocation.root, sourceRoot: ledger.allocation.sourceRoot, heldHead: entry.head,
    entry: { allocationRoot: entry.allocationRoot, sourceRoot: entry.sourceRoot, requestBytesRoot: entry.requestBytesRoot, head: entry.head, parentPid: entry.parentPid, childPid: entry.childPid },
    terminal: { entryBytesRoot: terminal.entryBytesRoot, allocationRoot: terminal.allocationRoot, sourceRoot: terminal.sourceRoot, head: terminal.head, parentPid: terminal.parentPid, childPid: terminal.childPid, elapsedUpperBoundMs: terminal.elapsedUpperBoundMs, physicalBytes: terminal.physicalBytes, status: terminal.status, signal: terminal.signal, exitCode: terminal.exitCode },
    receipt, timeElapsedMs: time.elapsedMs, timeStarts: time.starts.size, timeCloses: time.closes.size, chargedMatches: state.charged, resultExists: readdirSync(store).includes("result.json"),
    priorPredecessorRoot: ledger.allocation.predecessor.root, priorMeasuredSurvivingAllocatedBytes: ledger.allocation.predecessor.measuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: ledger.allocation.predecessor.allocatedDiskBytes, v5Survivors,
  })
}
/** Minimal closed-metadata carry for v6. This deliberately does not call
 * openLeanLedger/readLeanLedger/verifyLeanEvidence: exact roots and the
 * already-published bounded summary are sufficient to carry its spent cost. */
export const inspectLeanClosedV6Predecessor = (): Readonly<LeanClosedV6Predecessor> => {
  const c = LEAN_CLOSED_V6, store = safeDirectory(c.storeIdentity)
  const paths = leanClosedV6SurvivorPaths(), seen = new Set<string>()
  if (readdirSync(store).sort().join("|") !== "78905d6e33daf981ff164488f9b6cbc1be5fb347d316cc4332733c64213ec3c9.gz|allocation.json|child-terminal.json|entry.json|ledger.ndjson|result.json|time.ndjson") return fail("SUCCESSOR_PREDECESSOR")
  const digest = (path: string) => leanBytesRoot(readSafe(resolve(path)))
  const v6Survivors = paths.map((identity, index) => {
    if (index === 0 || index === paths.length - 1) {
      const directory = safeDirectory(identity)
      if (index === paths.length - 1 && readdirSync(directory).length !== 0) return fail("SUCCESSOR_PREDECESSOR")
      return { identity, allocatedBytes: statSync(directory).blocks * 512 }
    }
    const path = resolve(identity), stat = lstatSync(path), inode = `${stat.dev}:${stat.ino}`
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || realpathSync(path) !== path || seen.has(inode)) return fail("SUCCESSOR_PREDECESSOR")
    seen.add(inode)
    return { identity, allocatedBytes: stat.blocks * 512 }
  })
  return createLeanClosedV6Predecessor({
    raw: { allocation: digest(join(store, "allocation.json")), canonical: digest(c.canonicalIdentity), request: digest(c.requestIdentity), result: digest(join(store, "result.json")), ledger: digest(join(store, "ledger.ndjson")), time: digest(join(store, "time.ndjson")), entry: digest(join(store, "entry.json")), terminal: digest(join(store, "child-terminal.json")), replay: digest(join(store, "78905d6e33daf981ff164488f9b6cbc1be5fb347d316cc4332733c64213ec3c9.gz")), report: digest(c.terminalReportIdentity), erratum: digest(c.erratumIdentity) },
    storeFiles: readdirSync(store).sort(), allocationRoot: c.allocationRoot, sourceRoot: c.sourceRoot, heldHead: c.heldHead,
    result: { schemaVersion: "lean-pilot-result-v2", allocationRoot: c.allocationRoot, evidenceRoot: "sha256:ae82de483a9e773897a842b2f912449d1785ecc6032d1a4329b5cd8a1daf9cd6", issued: false, charged: 1, successful: 0, elapsedMs: 2_165_100, tier: "pending_independent_verification" },
    timeElapsedMs: c.elapsedUpperBoundMs, timeStarts: 2, timeCloses: 2, chargedMatches: c.chargedMatches, successfulMatches: 0,
    entryClosed: true, verifierClosed: true, parentClosed: true, childClosed: true,
    priorPredecessorRoot: c.priorPredecessorRoot, priorMeasuredSurvivingAllocatedBytes: c.priorMeasuredSurvivingAllocatedBytes, priorConservativeAllocatedBytes: c.priorConservativeAllocatedBytes, v6Survivors,
  })
}
export const readLeanLedger = (ledger: LeanExperimentLedger) => {
  const retained = openLeanLedger(ledger.directory)
  if (retained.allocation.root !== ledger.allocation.root) return fail("ALLOCATION")
  const text = Buffer.from(readSafe(join(ledger.directory, "ledger.ndjson"))).toString("utf8")
  if (text.length && !text.endsWith("\n")) return fail("PUBLICATION")
  const events = text ? text.slice(0, -1).split("\n").map(line => parse(Buffer.from(line)) as Event) : []
  const charges = new Map<LabRoot, LeanCharge>(), terminals = new Map<LabRoot, Extract<Event, { kind: "terminal" }>>()
  const previous = leanProspective(ledger.allocation) ? ledger.allocation.predecessor : null
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
      if (!exactLabKeys(e, ["kind", "elapsedMs", "physicalBytes", "bufferBytes", "scratchBytes"]) || ![e.elapsedMs, e.physicalBytes, e.bufferBytes, e.scratchBytes].every(natural) || e.elapsedMs < elapsedMs || e.elapsedMs > leanCapsForAllocation(ledger.allocation).elapsedMs || e.physicalBytes + (previous?.allocatedDiskBytes ?? 0) > LEAN_CAPS.retainedBytes || e.scratchBytes + e.bufferBytes > LEAN_CAPS.scratchBytes || e.physicalBytes + (previous?.allocatedDiskBytes ?? 0) + e.bufferBytes + e.scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes) return fail("RESOURCE")
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
  if (!leanProspective(ledger.allocation)) return { elapsedMs: time.elapsedMs, charged: state.charged, physicalHighWaterBytes: state.physicalHighWaterBytes, active: time.active }
  const terminal = readLeanChildTerminal(ledger)
  return { elapsedMs: time.elapsedMs, charged: state.charged, physicalHighWaterBytes: Math.max(state.physicalHighWaterBytes, terminal.physicalBytes, cumulativeLeanPhysicalBytes(ledger)), active: time.active }
}
export const chargeLeanSlot = (ledger: LeanExperimentLedger, slot: LeanSlot, capacity: { freeBytes: number; availableMemoryBytes: number }): LeanCharge => {
  if (leanProspective(ledger.allocation)) {
    const time = readLeanTimeAccounting(ledger), entry = readLeanChildEntry(ledger)
    if (!time.closed.has("pilot-entry")) {
      if (!time.active || time.starts.get("pilot-entry") !== entry.wallStartMs || entry.childPid !== process.pid || entry.parentPid !== process.ppid) return fail("ENTRY")
    } else { readLeanChildTerminal(ledger); return fail("SLOT_CLOSED") }
  }
  const state = readLeanLedger(ledger)
  if (state.stopped || ledger.allocation.slots[slot.ordinal]?.root !== slot.root || labRoot("lean-slot-v1", { ordinal: slot.ordinal, condition: slot.condition, arenaHash: slot.arenaHash, requestRoot: slot.requestRoot }) !== slot.root) return fail("SLOT")
  if (state.charges.has(slot.root)) return fail("CHARGED")
  if (!natural(capacity.freeBytes) || !natural(capacity.availableMemoryBytes) || capacity.freeBytes < LEAN_CAPS.totalBytes - cumulativeLeanPhysicalBytes(ledger) || capacity.availableMemoryBytes < 1_073_741_824 || Math.max(state.elapsedMs, currentLeanElapsedMs(ledger)) + LEAN_CAPS.matchMs > leanCapsForAllocation(ledger.allocation).elapsedMs || state.charged >= LEAN_CAPS.matches) return fail("CAPACITY")
  const body = { schemaVersion: "lean-slot-charge-v1" as const, allocationRoot: ledger.allocation.root, slotRoot: slot.root, ordinal: slot.ordinal }
  const charge = { ...body, root: labRoot("lean-slot-charge-v1", body) }; append(ledger, { kind: "charge", charge }); return charge
}
const admitCompactRecord = (r: LeanCompactMatchRecord): void => {
  if (!exactLabKeys(r, ["classification", "code", "outcome", "elapsedMs", "cleanupComplete", "invocationCount", "accountingRoot", "executionRoot", "telemetry"]) || !["success", "player_violation", "system_failure"].includes(r.classification) || !["OK", "PLAYER_VIOLATION", "SUPERVISOR_FAILURE", "CAPACITY", "CLEANUP"].includes(r.code) || ![null, "bottom", "top", "DRAW"].includes(r.outcome) || !natural(r.elapsedMs) || r.elapsedMs > LEAN_CAPS.matchMs + 30_000 || typeof r.cleanupComplete !== "boolean" || !natural(r.invocationCount) || r.invocationCount > 49_600 || !root(r.accountingRoot) || !root(r.executionRoot) || !exactLabKeys(r.telemetry, ["transitions", "events"]) || !Object.values(r.telemetry).every(natural)) return fail("RECORD")
  if (r.classification === "success" ? r.code !== "OK" || !r.cleanupComplete || r.outcome === null : r.outcome !== null || r.code === "OK" || (r.classification === "player_violation" ? r.code !== "PLAYER_VIOLATION" || !r.cleanupComplete : !["SUPERVISOR_FAILURE", "CAPACITY", "CLEANUP"].includes(r.code)) || (!r.cleanupComplete && r.code !== "CLEANUP")) return fail("RECORD_CLASSIFICATION")
}
export const assertLeanPublicationCapacity = (ledger: LeanExperimentLedger, bytes: number, currentPhysicalBytes = leanProspectiveOwnedBytes(ledger)) => {
  if (!natural(bytes) || !natural(currentPhysicalBytes) || currentPhysicalBytes + leanPriorBytes(ledger.allocation) + Math.ceil(bytes / 4096) * 4096 + 65536 > LEAN_CAPS.retainedBytes) return fail("RESOURCE")
}
export const retainLeanMatch = (ledger: LeanExperimentLedger, charge: LeanCharge, record: LeanCompactMatchRecord, replayFrames: Iterable<unknown>, hostFailure?: (stage: "compact_replay_retention_publication" | "terminal_result_publication", caught: unknown) => never) => {
  let replay: ReturnType<typeof encodeLeanReplay> | null
  try {
  admitCompactRecord(record)
  const s = readLeanLedger(ledger)
  if (s.charges.get(charge.slotRoot)?.root !== charge.root || s.terminals.has(charge.root)) return fail("TERMINAL")
  const selected = ledger.allocation.sampleSlotRoots.includes(charge.slotRoot) || record.classification !== "success" || !record.cleanupComplete
  const remaining = LEAN_CAPS.retainedBytes - cumulativeLeanPhysicalBytes(ledger) - 131072
  replay = selected ? encodeLeanReplay(replayFrames, remaining) : null
  if (replay) { assertLeanPublicationCapacity(ledger, replay.bytes.length); writeExclusive(join(safeDirectory(ledger.directory), `${charge.root.slice(7)}.gz`), replay.bytes) }
  } catch (error) { if (hostFailure) hostFailure("compact_replay_retention_publication", error); throw error }
  try { append(ledger, { kind: "terminal", chargeRoot: charge.root, record, replay: replay?.container ?? null }) }
  catch (error) { if (hostFailure) hostFailure("terminal_result_publication", error); throw error }
}
export const checkpointLeanResources = (ledger: LeanExperimentLedger, elapsedMs: number, bufferBytes: number, scratchBytes = 0) => {
  const e = { kind: "resource" as const, elapsedMs, physicalBytes: leanProspectiveOwnedBytes(ledger), bufferBytes, scratchBytes }
  const cumulative = cumulativeLeanPhysicalBytes(ledger)
  if (cumulative > LEAN_CAPS.retainedBytes || bufferBytes + scratchBytes > LEAN_CAPS.scratchBytes || cumulative + bufferBytes + scratchBytes + LEAN_CAPS.terminalBytes > LEAN_CAPS.totalBytes || elapsedMs > leanCapsForAllocation(ledger.allocation).elapsedMs) return fail("RESOURCE")
  append(ledger, e); readLeanLedger(ledger)
}
export const stopLeanLedger = (ledger: LeanExperimentLedger, reason: "complete" | "failure" | "capacity" | "integrity") => { readLeanLedger(ledger); append(ledger, { kind: "stop", reason }) }
export const verifyLeanEvidence = (ledger: LeanExperimentLedger) => {
  const state = readLeanLedger(ledger)
  const validationOnly = isLeanRetryMode(leanSupervisorAllocationMode(admitLeanAllocation(ledger.allocation))) || (ledger.allocation.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v7" || ledger.allocation.schemaVersion === "lean-correction-supervisor-baseline-allocation-v7") && leanSupervisorAllocationMode(admitLeanAllocation(ledger.allocation)) === "v7" || ((ledger.allocation.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v6" || ledger.allocation.schemaVersion === "lean-correction-supervisor-baseline-allocation-v6") && (leanSupervisorAllocationMode(admitLeanAllocation(ledger.allocation)) === "v6" || leanSupervisorAllocationMode(admitLeanAllocation(ledger.allocation)) === "v7")) || (ledger.allocation.schemaVersion === "lean-correction-supervisor-diagnostic-allocation-v5" || ledger.allocation.schemaVersion === "lean-correction-supervisor-baseline-allocation-v5") && leanSupervisorAllocationMode(admitLeanAllocation(ledger.allocation)) === "v5"
  const records = ledger.allocation.slots.map(slot => {
    const c = state.charges.get(slot.root), terminal = c && state.terminals.get(c.root)
    if (c && !terminal) return fail("TERMINAL_MISSING")
    if (terminal) {
      const selected = ledger.allocation.sampleSlotRoots.includes(slot.root) || terminal.record.classification !== "success" || !terminal.record.cleanupComplete
      if (selected !== (terminal.replay !== null)) return fail("REPLAY_MISSING")
      if (terminal.replay) {
        const bytes = readSafe(join(ledger.directory, `${c!.root.slice(7)}.gz`))
        if (validationOnly) validateLeanReplay(terminal.replay, bytes)
        else decodeLeanReplay(terminal.replay, bytes)
      }
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
/** Authenticate the full allocation before selecting prospective bounds. */
export const leanReplayV7CapsForAllocation = (value: unknown): typeof LEAN_REPLAY_V7_CAPS => {
  const a = admitLeanAllocation(value)
  if (leanSupervisorAllocationMode(a) !== "v7") return fail("ALLOCATION_VERSION")
  return LEAN_REPLAY_V7_CAPS
}
export const leanCapsForAllocation = (value: unknown): typeof LEAN_CAPS | typeof LEAN_SUPERVISOR_V5_CAPS | typeof LEAN_REPLAY_V7_CAPS | typeof LEAN_RETRY_V8_TIMEBOX_CAPS => {
  const cached = typeof value === "object" && value !== null ? admittedRetryCaps.get(value) : undefined
  if (cached) return cached
  const admitted = admitLeanAllocation(value)
  if (isLeanRetryMode(leanSupervisorAllocationMode(admitted)) && "timeboxExtension" in admitted) { admitLeanRetryTimeboxExtension(admitted.timeboxExtension); return LEAN_RETRY_V8_TIMEBOX_CAPS }
  return (leanSupervisorAllocationMode(admitted) === "v7" || isLeanRetryMode(leanSupervisorAllocationMode(admitted))) ? LEAN_REPLAY_V7_CAPS : (leanSupervisorAllocationMode(admitted) === "v5" || (leanSupervisorAllocationMode(admitted) === "v6" || leanSupervisorAllocationMode(admitted) === "v7")) ? LEAN_SUPERVISOR_V5_CAPS : LEAN_CAPS
}
