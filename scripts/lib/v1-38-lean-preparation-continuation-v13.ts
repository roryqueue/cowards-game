import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { leanBytesRoot, leanCanonicalBytes, LEAN_SUPERVISOR_RETEST_V12_EXTENSION, type LeanCorrectionPredecessor } from "../../packages/strategy-lab/src/league/lean-experiment.js"

/** Finite immutable failed custody only. No historical reader, source gate or IO. */
const oldTemp = ".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v12-1-tmp"
export const LEAN_PREPARATION_V13_HISTORY_PINS = Object.freeze({
  "admission-prepare-start.json": ["dd90732881eb481230431f822436bbbf00941967456cb7f87494726e40ab0bc3", "1bb78491f66bbb9219ac98d4edd9e97ef2448467a17543b998dac5b7d5434938"],
  "admission-prepare-close.json": ["c25e23f000475d114e879cd47ab34fa5f0402ce8522bcac38e31528702964188", "69f30e53ed8d29ffcec7f4743a8f9d09b866a75f916aefc6ded42562b9290774"],
  "admission-failure-v8.json": ["662c9325c21e31f36decca2f52ac0eabbf16a6eb9a506361a83da327c3f041e5", "014509c0ac0ff27464cc57c7d8ef32402bc9101ef0832a1e57dd564d53fc8b11"],
  "terminal-verifier-start-v12.json": ["8fa42db84c46cdf647184c5a2cfdd021b9ee77859325c2a188cef6a2a3217f23", "4da60e639af2465fa3131cfb3285d993a269d77e33b3f6509ac4be07b39b2d9b"],
  "terminal-verifier-close-v12.json": ["2b948d5b1c5fb30ae2852c6a4dbe00383e82c8fb9cc369de73dee2478e83dea6", "b2690b26e3271cb63f472bacdc60bbe47ef84e8a71bec82302e56f2433e2e63d"],
  "terminal-verification-v12.json": ["701681c585ea746d7658f1855231041221a8309ea10914676e3d6e659659b71c", "cecb2931f36f097224f46af65935a88cd215545631a100d32aaa8b7804d54b93"],
  "terminal-carry-v12.json": ["565e95a5a6383c6e7207c1d896db53abd6459f4a8027aa15375d39fd397c0589", "48d7c26de178e5803182c705fa9816f4a1983fabbaba3d06c6cecb412b3706c1"],
  "terminal-hold-complete-v12.json": ["4479bc92c8fab73d637a5f972ab45d74f6894535acae11c6e89e5ad246c8ab23", "0b400cfa1858bbe9ad9424bd07e66b7aaae8c6dfb35dee95793971f7ae9ef019"],
} as const)
export const LEAN_PREPARATION_V13_HISTORY_PATHS = Object.freeze(Object.keys(LEAN_PREPARATION_V13_HISTORY_PINS).map(name => `${oldTemp}/${name}`))
const fail = (): never => { throw new TypeError("LEAN_PREPARATION_V13_HISTORY_CUSTODY") }
export const validateLeanPreparationHistoryV13 = (raw: ReadonlyMap<string, Uint8Array>, forbidden: readonly string[] = []) => {
  if (forbidden.length || raw.size !== LEAN_PREPARATION_V13_HISTORY_PATHS.length) return fail()
  const values = new Map<string, Record<string, unknown>>()
  for (const [name, [bytesRoot, claimedRoot]] of Object.entries(LEAN_PREPARATION_V13_HISTORY_PINS)) {
    const bytes = raw.get(`${oldTemp}/${name}`)
    if (!bytes || leanBytesRoot(bytes) !== `sha256:${bytesRoot}`) return fail()
    const value = JSON.parse(Buffer.from(bytes).toString("utf8")) as Record<string, unknown>, { root, ...body } = value
    if (!Buffer.from(leanCanonicalBytes(value)).equals(Buffer.from(bytes)) || typeof value.schemaVersion !== "string" || root !== `sha256:${claimedRoot}` || root !== labRoot(value.schemaVersion, body)) return fail()
    values.set(name, value)
  }
  const start = values.get("admission-prepare-start.json")!, close = values.get("admission-prepare-close.json")!, failure = values.get("admission-failure-v8.json")!
  const readerStart = values.get("terminal-verifier-start-v12.json")!, readerClose = values.get("terminal-verifier-close-v12.json")!, report = values.get("terminal-verification-v12.json")!
  const carry = values.get("terminal-carry-v12.json")!, seal = values.get("terminal-hold-complete-v12.json")!
  if (start.mode !== "prepare" || start.route !== "diagnostic" || close.startRoot !== start.root || close.mode !== start.mode || close.route !== start.route || close.allocationRoot !== null || close.ledgerInterval !== null || close.importedMs !== 0 || failure.authorizing !== false || failure.startRoot !== start.root || failure.closeRoot !== close.root || failure.currentCharges !== 0 || failure.cumulativeCharged !== null || failure.storeAbsent !== true || failure.childSpawned !== false || failure.entryAbsent !== true || failure.resultAbsent !== true || failure.acceptedCheckAbsent !== true) return fail()
  if (readerStart.mode !== "v12-1" || readerStart.route !== "diagnostic" || readerClose.startRoot !== readerStart.root || report.readerStartRoot !== readerStart.root || report.readerCloseRoot !== readerClose.root || report.failureRoot !== failure.root || report.accepted !== false || report.authorizing !== false || report.finalReaderClose !== false || report.resultAbsent !== true || report.checkAbsent !== true || report.currentCharges !== 0 || report.cumulativeCharged !== 34 || report.entryHead !== null || report.allocationRoot !== null || report.entryBytesRoot !== null || report.terminalBytesRoot !== null) return fail()
  if (carry.schemaVersion !== "lean-supervisor-retest-terminal-carry-v12" || carry.outcome !== "refused_before_entry" || carry.accepted !== false || carry.authorizing !== false || carry.route !== "diagnostic" || carry.attemptOrdinal !== 1 || carry.currentCharges !== 0 || carry.cumulativeCharged !== 34 || carry.closedAtMs !== 1791462838439 || carry.cumulativeElapsedMs !== 114897342 || carry.allocatedDiskBytes !== 21020672 || !Array.isArray(carry.survivors) || carry.survivors.length !== 695 || carry.verificationRoot !== report.root || carry.closureRoot !== report.root || carry.verificationBytesRoot !== `sha256:${LEAN_PREPARATION_V13_HISTORY_PINS["terminal-verification-v12.json"][0]}` || carry.entryHead !== null || carry.entryBytesRoot !== null || carry.terminalBytesRoot !== null || carry.resultBytesRoot !== null || carry.allocationRoot !== null || labRoot("lean-history-extension-identity-v13", carry.timeboxExtension) !== labRoot("lean-history-extension-identity-v13", LEAN_SUPERVISOR_RETEST_V12_EXTENSION)) return fail()
  if (seal.mode !== "v12-1" || seal.route !== "diagnostic" || seal.carryRoot !== carry.root || seal.carryBytesRoot !== `sha256:${LEAN_PREPARATION_V13_HISTORY_PINS["terminal-carry-v12.json"][0]}` || seal.verificationRoot !== report.root || seal.verificationBytesRoot !== carry.verificationBytesRoot || seal.entryBytesRoot !== null || seal.head !== readerStart.head || seal.sourceRoot !== carry.sourceRoot || seal.requestBytesRoot !== carry.requestBytesRoot || report.sourceRoot !== carry.sourceRoot || report.requestBytesRoot !== carry.requestBytesRoot || readerStart.sourceRoot !== carry.sourceRoot || failure.sourceRoot !== carry.sourceRoot || failure.requestBytesRoot !== carry.requestBytesRoot || failure.head !== seal.head) return fail()
  const survivors = carry.survivors as LeanCorrectionPredecessor["survivors"]
  const body = { schemaVersion: "lean-preparation-history-v13", authorizing: false as const, accepted: false as const, carryRoot: carry.root as LabRoot, cumulativeCharged: 34, priorElapsedMs: 108000000, closedAtMs: 1791462838439, predecessor: { survivors, allocatedDiskBytes: 21020672, elapsedUpperBoundMs: 114897342 }, identities: [...new Set([...LEAN_PREPARATION_V13_HISTORY_PATHS, ...survivors.map(row => row.identity)])], custodyRoot: labRoot("lean-preparation-history-pins-v13", LEAN_PREPARATION_V13_HISTORY_PINS) }
  return Object.freeze({ ...body, root: labRoot(body.schemaVersion, body) })
}
