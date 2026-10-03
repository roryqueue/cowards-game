import { expect, it } from "vitest"
import { mkdtempSync, realpathSync, rmSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs"
import { execFileSync, fork } from "node:child_process"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { parseLeanCommand, leanSourceManifest, authenticateLeanReview, readLeanSafeFile, validateLeanResult, assessLeanPrefixCapacity, admitLeanChildRelease, assertLeanEntryBinding, createLeanParentObservationGuard, assertLeanBoundParentObservation, assertLeanProspectiveWritableScope } from "./run-v1-38-lean-experiment.js"
import { claimLeanRuntimeAuthority, issueLeanRuntimeAuthority, deriveLeanCandidateRuntime } from "./lib/v1-38-lean-experiment-authority.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../packages/strategy-lab/src/factory/identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { leanBytesRoot, leanCanonicalBytes } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { createLeanAllocation, createLeanLedger, chargeLeanSlot } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { labRoot, LAB_ADMITTED_ROOTS } from "../packages/strategy-lab/src/contracts.js"
import { createLeanContainerMatchSession } from "./lib/v1-38-lean-container-match-session.js"
import { admitFactorySupervisorLifetime } from "./lib/v1-38-factory-supervised-runtime.js"
import { isLeanChildFailureReceipt, resolveLeanChildCliTerminal } from "./lib/v1-38-lean-child-cli-terminal.js"

it.each([{ mode: "success", exitCode: 0 }, { mode: "failure", exitCode: 1 }, { mode: "known-failure", exitCode: 1 }])("settles inert child IPC after cleanup on $mode", async ({ mode, exitCode }) => {
  const child = fork(resolve("scripts/fixtures/v1-38-lean-child-terminal-probe.ts"), [mode], { execArgv: ["--import", "tsx"], stdio: ["ignore", "ignore", "pipe", "ipc"] })
  const events: string[] = []
  const receipts: unknown[] = []
  let stderr = ""
  child.stderr?.setEncoding("utf8").on("data", chunk => { stderr += chunk })
  child.on("message", message => {
    if (message === "cleanup-complete") events.push("cleanup")
    else if (isLeanChildFailureReceipt(message)) { events.push("failure-receipt"); receipts.push(message) }
  })
  child.on("disconnect", () => events.push("disconnect"))
  const outcome = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolveOutcome, reject) => {
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("inert child did not terminate")) }, 5000)
    child.once("error", error => { clearTimeout(timer); reject(error) })
    child.once("exit", (code, signal) => { clearTimeout(timer); resolveOutcome({ code, signal }) })
  })
  expect(outcome).toEqual({ code: exitCode, signal: null })
  expect(events).toEqual(exitCode === 0 ? ["cleanup", "disconnect"] : ["cleanup", "failure-receipt", "disconnect"])
  expect(receipts).toEqual(exitCode === 0 ? [] : [{ type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: mode === "known-failure" ? "HANDSHAKE" : "UNKNOWN_INTERNAL_FAILURE", stage: mode === "known-failure" ? "handshake" : "unknown" }])
  expect(stderr).toBe(exitCode === 0 ? "" : "LEAN_PILOT_FAILED_DETAILS_WITHHELD\n")
})
it("rejects tampered failure receipts without widening the diagnostic boundary", () => {
  const valid = { type: "lean-child-failure", schemaVersion: "lean-child-failure-v1", code: "UNKNOWN_INTERNAL_FAILURE", stage: "unknown" }
  expect(isLeanChildFailureReceipt(valid)).toBe(true)
  expect(isLeanChildFailureReceipt({ ...valid, privateError: "must not be retained" })).toBe(false)
  expect(isLeanChildFailureReceipt({ ...valid, code: "PRIVATE_ERROR" })).toBe(false)
})
it("imports inertly and accepts only three explicit private modes", () => {
  expect(parseLeanCommand(["prepare-pilot", "--request", "x.json"])).toEqual({ mode: "prepare-pilot", request: "x.json" })
  expect(() => parseLeanCommand(["run-pilot", "--provider", "forged"])).toThrow()
  expect(() => parseLeanCommand(["production"])).toThrow()
  expect(() => parseLeanCommand(["run-pilot", "--request", "x", "--retry"])).toThrow()
  expect(() => parseLeanCommand(["child-pilot", "--request", "x"])).toThrow()
})
it("denies forged parent handshakes without dispatch", () => {
  const token = "ab".repeat(32), entry = { parentPid: 12, childPid: 13, handshakeRoot: leanBytesRoot(Buffer.from(token, "hex")) }
  admitLeanChildRelease(entry as never, token, 13, 12)
  for (const [value, pid, parent] of [["cd".repeat(32), 13, 12], [token, 14, 12], [token, 13, 11], ["not-hex", 13, 12]] as const) expect(() => admitLeanChildRelease(entry as never, value, pid, parent)).toThrow("HANDSHAKE")
})
it("stops an in-flight cell and future charge/invoke after bound-parent loss", () => {
  let pid = 12, connected = true, invoked = 0, charged = 0, closed = 0
  const guard = createLeanParentObservationGuard(12, () => pid, () => connected)
  guard.register({ close: () => { closed++; return { cleanupComplete: true, orphanedChild: false } } } as never)
  guard.assert(); charged++; guard.assert(); invoked++
  pid = 1; connected = false; guard.disconnect()
  expect(closed).toBe(1)
  expect(() => { guard.assert(); charged++ }).toThrow("PARENT_LOST")
  expect(() => { guard.assert(); invoked++ }).toThrow("PARENT_LOST")
  expect(charged).toBe(1); expect(invoked).toBe(1)
  expect(() => guard.register({ close: () => { throw new Error("late provider") } } as never)).toThrow("PARENT_LOST")
})
it("gates the whole import prefix against joint RSS, cell reserve, elapsed and physical capacity", () => {
  const m = { childRss: 300_000_000, parentRss: 150_000_000, freeBytes: 15_000_000_000, allocatedBytes: 12_288, elapsedMs: 565_459 }
  expect(assessLeanPrefixCapacity(m)).toBe(450_000_000)
  for (const changed of [{ ...m, childRss: 1_600_000_000 }, { ...m, freeBytes: 1 }, { ...m, elapsedMs: 28_800_000 }, { ...m, allocatedBytes: 15_000_000_001 }, { ...m, parentRss: -1 }]) expect(() => assessLeanPrefixCapacity(changed)).toThrow("PREFIX_CAPACITY")
})
it("never samples a reparented process as the trusted parent", () => {
  assertLeanBoundParentObservation(12, 12, true)
  expect(() => assertLeanBoundParentObservation(12, 1, true)).toThrow("PARENT_LOST")
  expect(() => assertLeanBoundParentObservation(12, 12, false)).toThrow("PARENT_LOST")
  expect(() => assertLeanBoundParentObservation(0, 0, true)).toThrow("PARENT_LOST")
})
it("sanitizes Node and TSX at a pre-Node shell boundary and rechecks inherited scope", () => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-launch-test-")))
  try {
    mkdirSync(join(p, ".strategy-lab"))
    const launcher = resolve("scripts/run-v1-38-lean-experiment.sh")
    const output = execFileSync("sh", [launcher, "--probe-launch-scope"], { cwd: p, encoding: "utf8", env: { PATH: process.env.PATH ?? "", LEAN_LAUNCH_PROBE: "1", NODE_OPTIONS: "--report-on-fatalerror --report-directory=/tmp/unowned", NODE_COMPILE_CACHE: "/tmp/unowned", NODE_REDIRECT_WARNINGS: "/tmp/unowned", NODE_V8_COVERAGE: "/tmp/unowned" } })
    expect(output).toContain("cache=1 compile=1 node_options=unset compile_cache=unset warnings=unset coverage=unset core=0")
    expect(output).toContain(`tmp=${join(p, ".strategy-lab", "lean-experiment-20261003-v3-tmp")}`)
  } finally { rmSync(p, { recursive: true, force: true }) }
  const safe = { cacheDisabled: "1", compileDisabled: "1", tempDirectory: resolve(".strategy-lab/lean-experiment-20261003-v3-tmp") }
  assertLeanProspectiveWritableScope(safe, "0")
  for (const changed of [{ ...safe, nodeOptions: "--report-on-fatalerror" }, { ...safe, compileCache: "/tmp/cache" }, { ...safe, warningRedirect: "/tmp/warnings" }, { ...safe, coverage: "/tmp/coverage" }, { ...safe, tempDirectory: "/tmp/unowned" }, { ...safe, cacheDisabled: undefined }]) expect(() => assertLeanProspectiveWritableScope(changed, "0")).toThrow("WRITABLE_SCOPE")
  expect(() => assertLeanProspectiveWritableScope(safe, "unlimited")).toThrow("WRITABLE_SCOPE")
})
it("rejects stale HEAD, source, request, allocation, process and interval before import", () => {
  const observed = { head: "a".repeat(40), sourceRoot: labRoot("source", 1), requestBytesRoot: labRoot("request", 1), allocationRoot: labRoot("allocation", 1), parentPid: 12, childPid: 13, intervalStartMs: 100 }
  const entry = { ...observed, wallStartMs: observed.intervalStartMs }
  assertLeanEntryBinding(entry as never, observed)
  for (const changed of [{ head: "b".repeat(40) }, { sourceRoot: labRoot("source", 2) }, { requestBytesRoot: labRoot("request", 2) }, { allocationRoot: labRoot("allocation", 2) }, { parentPid: 14 }, { childPid: 15 }, { intervalStartMs: 101 }]) expect(() => assertLeanEntryBinding(entry as never, { ...observed, ...changed })).toThrow("ENTRY")
})
it("denies caller-forged runtime authorities before native construction", () => {
  expect(() => claimLeanRuntimeAuthority({ schemaVersion: "lean-runtime-authority-v1" } as never, {} as never, "factory")).toThrow("AUTHORITY")
  expect(() => createLeanContainerMatchSession({ leanExperimentAuthority: {} } as never)).toThrow("BINDING")
  expect(admitFactorySupervisorLifetime({} as never)).toBe(120000)
})
const candidateFixture = (directory: string, name: string) => {
  mkdirSync(join(directory, `factory-${name}`), { mode: 0o700 })
  const factoryRepository = createFactoryRepository(join(directory, `factory-${name}`))
  const sourceBytes = new TextEncoder().encode(`// ${name}\nexport default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain() { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: {} }; } }`)
  const sourceRoot = leanBytesRoot(sourceBytes), base = factoryOraclePacketFixture()
  const draft = { ...base, source: { ...base.source, root: sourceRoot, sha256: sourceRoot, byteLength: sourceBytes.byteLength } }, packet = { ...draft, root: deriveFactoryOraclePacketRoot(draft) }
  const proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal), candidate = factoryCandidateFixture(proposal, validation, labRoot("receipt", name))
  const body = { schemaVersion: "factory-candidate-publication-v1", privacy: "private_offline", candidate, independenceReceipt: { root: labRoot("independence", name) }, supervisionReceiptRoot: candidate.supervisionReceiptRoot, independenceStatus: "unresolved" }
  return { candidate, factoryRepository, candidatePublicationArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes({ ...body, root: labRoot("factory-candidate-publication-v1", body) })), sourceArtifactRoot: publishFactoryArtifact(factoryRepository, sourceBytes), packetArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes(packet)), proposalArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes(proposal)), validationArtifactRoot: publishFactoryArtifact(factoryRepository, leanCanonicalBytes(validation)) }
}
it("requires allocated source closure, rejects a different valid candidate and binds ordered claims", () => {
  const p = realpathSync(mkdtempSync(join(tmpdir(), "lean-authority-"))), pin = labRoot("authority-test", 1)
  try {
    const fixtures = [candidateFixture(p, "a"), candidateFixture(p, "b")].sort((a,b) => a.candidate.root.localeCompare(b.candidate.root)), allocated = fixtures[0]!, other = fixtures[1]!
    const a = createLeanAllocation({ sourceRoot: pin, reviewRoot: pin, candidateRoots: fixtures.map(f => f.candidate.root), seed: "authority-test" }), l = createLeanLedger(join(p, "store"), a)
    const c = chargeLeanSlot(l, a.slots[0]!, { freeBytes: 20e9, availableMemoryBytes: 2e9 })
    const runtime = deriveLeanCandidateRuntime(allocated).runtime
    const b = { budgetRoot: a.root, attemptRoot: c.root, matchId: `lean-${c.root.slice(7, 31)}`, seat: "bottom" as const, containerName: `lean-${c.root.slice(7, 25)}-bottom`, ownershipLabel: `lean-${a.root.slice(7, 25)}`, runtime }
    expect(() => issueLeanRuntimeAuthority(l, { ...c, root: pin }, allocated, b)).toThrow("AUTHORITY")
    expect(() => issueLeanRuntimeAuthority(l, { ...c, ordinal: 2 }, other, { ...b, runtime: deriveLeanCandidateRuntime(other).runtime })).toThrow("AUTHORITY")
    expect(() => issueLeanRuntimeAuthority(l, c, allocated, { ...b, runtime: deriveLeanCandidateRuntime(other).runtime })).toThrow("AUTHORITY")
    expect(() => issueLeanRuntimeAuthority(l, c, other, { ...b, runtime: deriveLeanCandidateRuntime(other).runtime })).toThrow("AUTHORITY")
    const h = issueLeanRuntimeAuthority(l, c, allocated, b)
    expect(() => claimLeanRuntimeAuthority(h, b, "planner")).toThrow("AUTHORITY")
    expect(() => claimLeanRuntimeAuthority({ ...h }, b, "factory")).toThrow("AUTHORITY")
    expect(claimLeanRuntimeAuthority(h, b, "factory")).toEqual({ lifetimeMs: 600000, receiptMs: 5000 })
    expect(() => claimLeanRuntimeAuthority(h, b, "factory")).toThrow("AUTHORITY")
    expect(claimLeanRuntimeAuthority(h, b, "planner").lifetimeMs).toBe(600000)
    expect(claimLeanRuntimeAuthority(h, b, "session").receiptMs).toBe(5000)
    expect(() => JSON.stringify(h)).toThrow("AUTHORITY")
  } finally { rmSync(p, { recursive: true, force: true }) }
})
it("requires actual review bytes and rejects missing, fabricated and other-source reviews", () => {
  const p = mkdtempSync(".planning/phases/265-serious-current-rules-league-and-development-red-team/.review-test-")
  try {
    const pin = labRoot("review", 1), file = join(p, "review.md")
    expect(() => authenticateLeanReview(file, pin, pin)).toThrow()
    const bytes = Buffer.from(`---\nstatus: clean\nsource_commit: ${"a".repeat(40)}\nsource_root: ${labRoot("other", 1)}\nreviewer_agent: /root/reviewer\nauthor_agent: /root/author\nindependently_reviewed: true\n---\n`)
    writeFileSync(file, bytes)
    expect(() => authenticateLeanReview(file, pin, pin)).toThrow("REVIEW")
    expect(() => authenticateLeanReview(file, leanBytesRoot(bytes), pin)).toThrow("REVIEW")
  } finally { rmSync(p, { recursive: true, force: true }) }
})
it("uses bounded no-symlink result admission and rejects any head/count/extra-field change", () => {
  const p = mkdtempSync(join(tmpdir(), "lean-result-"))
  try {
    const file = join(p, "result.json"), alias = join(p, "alias.json")
    writeFileSync(file, "x".repeat(1025)); symlinkSync(file, alias)
    expect(() => readLeanSafeFile(file, 1024)).toThrow("FILE")
    expect(() => readLeanSafeFile(alias)).toThrow("FILE")
    const expected = { head: "a".repeat(40), successful: 8, charged: 8, cleanupComplete: true }
    validateLeanResult(expected, expected)
    for (const result of [{ ...expected, head: "b".repeat(40) }, { ...expected, successful: 7 }, { ...expected, extra: true }, { ...expected, cleanupComplete: false }]) expect(() => validateLeanResult(result, expected)).toThrow("RETAINED_RESULT")
  } finally { rmSync(p, { recursive: true, force: true }) }
})
it("binds the entire reviewed implementation including additive native opt-ins", () => {
  const m = leanSourceManifest(); expect(m.entries.some(e => e.path.endsWith("lean-experiment.ts"))).toBe(true)
  expect(m.entries.some(e => e.path.endsWith("run-v1-38-lean-experiment.sh"))).toBe(true)
  expect(m.entries.some(e => e.path.endsWith("v1-38-lean-container-match-session.ts"))).toBe(true)
  expect(m.root).toMatch(/^sha256:/)
})
