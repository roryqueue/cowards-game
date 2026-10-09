/** Negative HOST custody proof only; no fabricated successful diagnostic. */
import { expect, it, vi } from "vitest"
import { mkdtempSync, realpathSync, rmSync, readFileSync, writeFileSync, mkdirSync, existsSync, lstatSync, chmodSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname, resolve } from "node:path"
import { execFileSync } from "node:child_process"
import * as correction from "../run-v1-38-lean-correction.js"
import * as retained from "./v1-38-lean-correction-retained.js"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION as policy, leanCanonicalBytes, leanBytesRoot, leanCorrectionRoutePaths } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { leanFivePairDocumentsV14, LEAN_FIVE_PAIR_V14_HISTORY_PINS } from "./v1-38-lean-post-v13-five-pair.js"

it("real no-ledger refusal publishes and reauthenticates terminal, carry, hold and spent-pair bytes", async () => {
  const before = process.cwd(), mode = "v14-1", route = "diagnostic", directory = realpathSync(mkdtempSync(join(tmpdir(), "v14-terminal-host-")))
  // Copy public functional bytes and the three permitted finite metadata files.
  // Historical payload fixtures are opaque allocated bytes: never read/execute
  // old private Strategy or trace contents and never pretend they authorize play.
  const manifest = correction.leanCorrectionSourceManifest(mode, policy)
  const metadata = LEAN_FIVE_PAIR_V14_HISTORY_PINS.map(pin => ({ path: pin.path, bytes: readFileSync(pin.path) }))
  const history = correction.authenticateLeanPostV13HistoricalCustodyV14()
  try {
    for (const entry of manifest.entries) { const path = join(directory, entry.path); mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); writeFileSync(path, readFileSync(resolve(before, entry.path)), { mode: 0o600 }) }
    for (const row of history.predecessor.survivors) {
      const path = join(directory, row.identity), isDirectory = history.predecessor.survivors.some(other => other.identity.startsWith(`${row.identity}/`))
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
      if (isDirectory) mkdirSync(path, { recursive: true, mode: 0o700 })
      else if (!existsSync(path)) writeFileSync(path, Buffer.alloc(row.allocatedBytes), { mode: 0o600 })
    }
    for (const value of metadata) { mkdirSync(dirname(join(directory, value.path)), { recursive: true, mode: 0o700 }); writeFileSync(join(directory, value.path), value.bytes, { mode: 0o600 }); chmodSync(join(directory, value.path), 0o600) }
    for (const row of history.predecessor.survivors) {
      const path = join(directory, row.identity), stat = lstatSync(path)
      if (stat.isDirectory()) { for (let n = 0; lstatSync(path).blocks * 512 < row.allocatedBytes && n < 2000; n++) writeFileSync(join(path, `HOST-opaque-directory-padding-${n}`), "", { mode: 0o600 }); expect(lstatSync(path).blocks * 512).toBeGreaterThanOrEqual(row.allocatedBytes) }
      else if (stat.blocks * 512 < row.allocatedBytes) { expect(LEAN_FIVE_PAIR_V14_HISTORY_PINS.some(pin => pin.path === row.identity)).toBe(false); writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.alloc(row.allocatedBytes)])) }
    }
    process.chdir(directory)
    const paths = leanCorrectionRoutePaths(route, mode), docs = leanFivePairDocumentsV14(route, mode), root = labRoot("HOST-unaccepted-review", 1)
    mkdirSync(paths.temp, { recursive: true, mode: 0o700 }); chmodSync(paths.temp, 0o700)
    const setup = correction.createLeanPostV13SetupV14(mode, Date.now() - 1)
    correction.publishLeanCorrection(docs.setup, setup)
    expect(correction.readLeanPostV13SetupV14(mode)).toEqual(setup)
    const helperBytes = Buffer.from("HOST inert helper, never executed")
    writeFileSync(docs.helper, helperBytes, { mode: 0o600 })
    const sourceRoot = correction.leanCorrectionSourceManifest(mode, policy).root
    const continuation = correction.createLeanPostV13ContinuationV14(mode, { priorClosureRoot: history.carryRoot, sourceRoot, reviewRoot: root, cumulativeCharged: 35, cumulativeElapsedMs: 148694388, allocatedDiskBytes: 22777856, distinction: { kind: "prospective_diagnostic_distinction", evidenceRoot: leanBytesRoot(helperBytes), reviewRoot: root } })
    correction.publishLeanCorrection(docs.continuation, continuation)
    const request = correction.createLeanPostV13RequestDraftV14(mode, route, { sourceRoot, reviewRoot: root, dataReviewRoot: root, helperReviewRoot: root, helperPath: docs.helper, helperBytesRoot: leanBytesRoot(helperBytes), setupAccountingRoot: setup.root, reuseGrantRoot: root, authorizationRoot: root, priorClosureRoot: history.carryRoot, continuationRoot: continuation.root, acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
    correction.publishLeanCorrection(paths.request, request)
    execFileSync("git", ["init", "-q"], { stdio: "pipe" }); execFileSync("git", ["add", ...manifest.entries.map(entry => entry.path)], { stdio: "pipe" }); execFileSync("git", ["-c", "user.name=HOST fixture", "-c", "user.email=host@example.invalid", "commit", "-qm", "HOST public source fixture"], { stdio: "pipe" })
    // Genuine scope refusal before any request authority or allocation. The
    // following success is a non-authorizing failure writer, not admission.
    expect(() => correction.prepareLeanCorrection(paths.request, route, mode)).toThrow()
    expect(existsSync(paths.store)).toBe(false); expect(existsSync(paths.allocation)).toBe(false)
    const report = retained.verifyLeanPostV13TerminalOnlyV14(paths.request, mode, route)
    expect(report).toMatchObject({ accepted: false, authorizing: false, currentCharges: 0, cumulativeCharged: 35, entryHead: null, allocationRoot: null, resultAbsent: true })
    const authenticated = retained.authenticateLeanPostV13TerminalVerificationV14(mode, route)
    expect(authenticated.value.root).toBe(report.root)
    const carry = retained.authenticateLeanPostV13TerminalCarryV14(mode, route), pair = retained.authenticateLeanPostV13ClosedPairV14(mode)
    expect(carry).toMatchObject({ outcome: "refused_before_entry", accepted: false, currentCharges: 0, cumulativeCharged: 35 })
    expect(pair).toMatchObject({ historicalCharged: 35, attemptOrdinal: 1, baselineCarryRoot: null, endsEnvelope: false })
    expect(correction.readLeanPostV13PriorPairV14("v14-2").carryRoot).toBe(pair.root)
    expect(() => retained.verifyLeanPostV13TerminalOnlyV14(paths.request, mode, route)).toThrow()
    expect(() => correction.prepareLeanCorrection(paths.request, route, mode)).toThrow()
  } finally { process.chdir(before); rmSync(directory, { recursive: true, force: true }) }
}, 45000)

it("constructs exact fresh request drafts and binds immutable setup origin for all five ordinals", () => {
  const root = labRoot("v14-draft-host", 1)
  for (const n of [1, 2, 3, 4, 5] as const) {
    const mode = `v14-${n}` as const, docs = leanFivePairDocumentsV14("diagnostic", mode)
    const setup = correction.createLeanPostV13SetupV14(mode, 1791496635485)
    expect(setup).toMatchObject({ attemptOrdinal: n, startedAtMs: policy.startedAtMs, priorElapsedMs: policy.priorElapsedMs, decisionRoot: policy.approvalRoot })
    const request = correction.createLeanPostV13RequestDraftV14(mode, "diagnostic", { sourceRoot: root, reviewRoot: root, dataReviewRoot: root, helperReviewRoot: root, helperPath: docs.helper, helperBytesRoot: root, setupAccountingRoot: setup.root, reuseGrantRoot: root, authorizationRoot: root, priorClosureRoot: root, continuationRoot: root, acceptedCheckRoot: null, acceptedReaderCloseRoot: null })
    expect(request).toMatchObject({ schemaVersion: "lean-correction-supervisor-request-v14", reviewPath: docs.review, helperPath: docs.helper, attemptOrdinal: n, timeboxExtension: policy })
    expect(correction.leanCorrectionRequestDataRoot(request)).not.toBe(correction.leanCorrectionRequestDataRoot({ ...request, continuationRoot: labRoot("changed-continuation", n) }))
  }
})

it("binds only ROOT-observed finite failed-v13 metadata, not an old ordinary reader", () => {
  const oldReader = vi.spyOn(retained, "authenticateLeanSupervisorDiagnosticCheck")
  try {
    const history = correction.authenticateLeanPostV13HistoricalCustodyV14()
    expect(history.cumulativeCharged).toBe(35)
    expect(history.predecessor.elapsedUpperBoundMs).toBe(148694388)
    expect(history.predecessor.allocatedDiskBytes).toBe(22777856)
    expect(history.predecessor.survivors.length).toBe(774)
    expect(oldReader).not.toHaveBeenCalled()
  } finally { oldReader.mockRestore() }
})

it("new accepted-join dispatch rejects missing real same-pair custody on every call", () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "v14-custody-host-"))), before = process.cwd()
  const audit = vi.spyOn(retained, "authenticateLeanRetryClosureV8")
  try {
    process.chdir(directory)
    for (let n = 0; n < 3; n++) expect(() => correction.authenticateLeanPostV13FivePairAcceptedJoinV14("v14-1")).toThrow()
    expect(audit).toHaveBeenCalledTimes(3)
    for (const mode of ["v13-1", "v14-0", "v14-6"]) expect(() => correction.authenticateLeanPostV13FivePairAcceptedJoinV14(mode as never)).toThrow()
    expect(audit).toHaveBeenCalledTimes(3)
  } finally { process.chdir(before); audit.mockRestore(); rmSync(directory, { recursive: true, force: true }) }
})

it("legacy request authorities cannot enter the v14 data path or reopen old readers", () => {
  for (const route of ["diagnostic", "baseline"] as const) {
    expect(() => correction.readLeanRemainingRequestV9(".strategy-lab/old-request.json", route, "v14-1")).toThrow("POST_V13_CUSTODY_UNAVAILABLE")
  }
})
