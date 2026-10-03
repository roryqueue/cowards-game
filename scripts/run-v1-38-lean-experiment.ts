/** Main-orchestrator private entry. Importing this file never starts a job. */
import { constants, openSync, writeSync, fsyncSync, closeSync, readFileSync, lstatSync, realpathSync, statfsSync, readdirSync } from "node:fs"
import { resolve, join } from "node:path"
import { pathToFileURL } from "node:url"
import { execFileSync, fork } from "node:child_process"
import { randomBytes } from "node:crypto"
import { performance } from "node:perf_hooks"
import { CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata, createSetScenarioV137 } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision, deriveFactoryExecutionCommitment, deriveFactoryOrderedRecordDescriptor, type FactorySupervisionProvider } from "../packages/strategy-lab/src/factory/admission.js"
import { createFactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { readFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { readCandidateClosure } from "../packages/strategy-lab/src/league/connected-runner.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import { writeLeanAll, createLeanAllocationV2, createLeanLedger, openLeanLedger, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, measureLeanPhysicalBytes, readLeanLedger, readLeanCumulativeAccounting, stopLeanLedger, verifyLeanEvidence, chooseLeanTier, leanBytesRoot, leanCanonicalBytes, LEAN_CAPS, LEAN_FAILED_PREFIX, publishLeanChildEntry, readLeanChildEntry, deriveLeanChildTerminal, publishLeanChildTerminal, readLeanChildTerminal, cumulativeLeanPhysicalBytes, type LeanChildEntryV2, type LeanExperimentLedger, type LeanCompactMatchRecord, type LeanCharge } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { readLeanPilotInitialCandidates, observeLeagueAvailableMemoryBytes, type LeagueInitialCandidateSelection } from "./run-v1-38-serious-league.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { issueLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
import { prospectiveLeagueRuntimeBinding } from "./lib/v1-38-league-prospective-lifetime.js"
import { beginLeanInterval, closeLeanInterval, readLeanTimeAccounting, currentLeanElapsedMs, LEAN_EXTERNAL_SCRATCH_RESERVE, assertLeanPublicationCapacity, boundLeanReplayFrame } from "../packages/strategy-lab/src/league/lean-experiment.js"

const fail = (code: string): never => { throw new TypeError(`LEAN_PILOT_${code}`) }
const STORE = resolve(".strategy-lab/lean-experiment-20261003-v2")
const ALLOCATION = ".planning/artifacts/v1.38-lean-pilot-allocation-v2.json"
/** These controls must be inherited before the tsx loader runs: checking them
 * inside the route alone cannot retroactively undo a loader-cache/core write. */
export const assertLeanProspectiveWritableScope = (cacheDisabled: string | undefined, coreSoftLimit: string): void => {
  if (cacheDisabled !== "1" || coreSoftLimit.trim() !== "0") return fail("WRITABLE_SCOPE")
}
const requireLeanProspectiveWritableScope = () => {
  const coreSoftLimit = execFileSync("sh", ["-c", "ulimit -c"], { encoding: "utf8", timeout: 1000, maxBuffer: 128 })
  assertLeanProspectiveWritableScope(process.env.TSX_DISABLE_CACHE, coreSoftLimit)
}
interface Request { schemaVersion: "lean-pilot-request-v1"; seed: string; reviewPath: string; reviewRoot: LabRoot; sourceRoot: LabRoot; factoryDirectory: string; selection: LeagueInitialCandidateSelection }
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
export const leanSourceManifest = () => {
  const legacy = factoryAssessmentImplementationManifest()
  const paths = ["scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "packages/strategy-lab/src/league/lean-experiment.ts", "scripts/lib/v1-38-factory-supervised-runtime.ts", "scripts/lib/v1-38-planner-supervised-runtime.ts", "scripts/lib/v1-38-lean-container-match-session.ts", "scripts/lib/v1-38-league-prospective-lifetime.ts", "scripts/run-v1-38-serious-league.ts"]
  const byPath = new Map(legacy.entries.map(e => [e.path, e]))
  for (const path of paths) byPath.set(path, { path, root: leanBytesRoot(readFileSync(resolve(path))) })
  const entries = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
  return { entries, root: labRoot("lean-reviewed-source-v1", entries) }
}
export const parseLeanCommand = (args: readonly string[]) => {
  if (args.length !== 3 || !["prepare-pilot", "run-pilot", "verify-retained"].includes(args[0]!) || args[1] !== "--request" || !args[2] || args[2].startsWith("--")) return fail("ARGUMENTS")
  return { mode: args[0] as "prepare-pilot" | "run-pilot" | "verify-retained", request: args[2] }
}
const readRequest = (path: string): Request => {
  const p = resolve(path), s = lstatSync(p)
  if (s.isSymbolicLink() || !s.isFile() || s.size > 262144 || realpathSync(p) !== p) return fail("REQUEST")
  const r = JSON.parse(readFileSync(p, "utf8")) as Request
  if (!exactLabKeys(r, ["schemaVersion", "seed", "reviewPath", "reviewRoot", "sourceRoot", "factoryDirectory", "selection"]) || r.schemaVersion !== "lean-pilot-request-v1" || !root(r.reviewRoot) || !root(r.sourceRoot) || r.sourceRoot !== leanSourceManifest().root || !exactLabKeys(r.selection, ["initialCandidatePublicationRoots", "factoryAssessmentArtifactRoots", "operations"]) || r.selection.initialCandidatePublicationRoots.length !== 2 || r.selection.factoryAssessmentArtifactRoots.length !== 1 || ![...r.selection.initialCandidatePublicationRoots, ...r.selection.factoryAssessmentArtifactRoots].every(root) || !exactLabKeys(r.selection.operations, ["maxArtifactBytes", "maxArtifactRecords"]) || r.selection.operations.maxArtifactBytes !== 12_000_000_000 || r.selection.operations.maxArtifactRecords !== 200_000) return fail("REQUEST")
  authenticateLeanReview(r.reviewPath, r.reviewRoot, r.sourceRoot)
  const f = resolve(r.factoryDirectory)
  if (!f.startsWith(`${resolve(".strategy-lab")}/`) || realpathSync(f) !== f || lstatSync(f).isSymbolicLink()) return fail("FACTORY")
  return r
}
export const readLeanSafeFile = (path: string, maximumBytes = 262144): Uint8Array => {
  const p = resolve(path), s = lstatSync(p)
  if (!s.isFile() || s.isSymbolicLink() || realpathSync(p) !== p || s.size > maximumBytes) return fail("FILE")
  const fd = openSync(p, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { const bytes = readFileSync(fd); if (bytes.length > maximumBytes) return fail("FILE"); return bytes } finally { closeSync(fd) }
}
/** Actual local reviewer report, authenticated bytes and exact fixed implementation.
 * Role provenance remains local single-operator assurance, never external custody. */
export const authenticateLeanReview = (path: string, expectedRoot: LabRoot, sourceRoot: LabRoot) => {
  if (typeof path !== "string" || !resolve(path).startsWith(`${resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team")}/`)) return fail("REVIEW")
  const bytes = readLeanSafeFile(path), text = Buffer.from(bytes).toString("utf8")
  if (leanBytesRoot(bytes) !== expectedRoot || !text.startsWith("---\n")) return fail("REVIEW")
  const front = text.split("\n---", 2)[0]!
  const field = (key: string) => front.match(new RegExp(`^${key}: ([^\\n]+)$`, "mu"))?.[1]?.replace(/^['"]|['"]$/gu, "")
  const commit = field("source_commit"), reviewer = field("reviewer_agent"), author = field("author_agent")
  if (field("status") !== "clean" || field("source_root") !== sourceRoot || !commit || !/^[a-f0-9]{40}$/u.test(commit) || !reviewer?.startsWith("/root/") || !author?.startsWith("/root/") || reviewer === author || field("independently_reviewed") !== "true") return fail("REVIEW")
  const manifest = leanSourceManifest()
  if (manifest.root !== sourceRoot) return fail("REVIEW_SOURCE")
  try { execFileSync("git", ["diff", "--exit-code", commit, "--", ...manifest.entries.map(e => e.path)], { maxBuffer: 1024, stdio: "pipe" }) } catch { return fail("REVIEW_SOURCE") }
  return { reviewRoot: expectedRoot, sourceRoot, sourceCommit: commit }
}
const exclusive = (path: string, value: unknown) => { const bytes = leanCanonicalBytes(value); if (resolve(path).startsWith(`${STORE}/`)) assertLeanPublicationCapacity(openLeanLedger(STORE), bytes.length); const fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600); try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) } }
const rssOf = (pid: number): number => {
  if (!Number.isSafeInteger(pid) || pid <= 0) return fail("PROCESS_RSS")
  const value = execFileSync("ps", ["-o", "rss=", "-p", String(pid)], { encoding: "utf8", timeout: 1000, maxBuffer: 128 }).trim()
  const kib = Number(value)
  if (!Number.isSafeInteger(kib) || kib <= 0 || kib * 1024 > Number.MAX_SAFE_INTEGER) return fail("PROCESS_RSS")
  return kib * 1024
}
/** Pre-import and per-cell checks include the entry-bound live parent, explicit reserve,
 * measured store blocks, and the remaining real free-space envelope. The
 * bounded importer itself enforces its 64-MiB cell/256-MiB projection ceilings. */
export const assertLeanBoundParentObservation = (expectedPid: number, observedPid: number, connected: boolean): void => {
  if (!Number.isSafeInteger(expectedPid) || expectedPid <= 0 || observedPid !== expectedPid || !connected) return fail("PARENT_LOST")
}
export const assertLeanPrefixCapacity = (ledger: LeanExperimentLedger, parentPid: number, reserveBytes = 320 * 1024 * 1024): number => {
  assertLeanBoundParentObservation(parentPid, process.ppid, process.connected)
  const childRss = Math.max(process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024), parentRss = rssOf(parentPid)
  assertLeanBoundParentObservation(parentPid, process.ppid, process.connected)
  const stat = statfsSync(ledger.directory, { bigint: true }), available = stat.bavail * stat.bsize
  if (available > BigInt(Number.MAX_SAFE_INTEGER)) return fail("PREFIX_CAPACITY")
  return assessLeanPrefixCapacity({ childRss, parentRss, freeBytes: Number(available), allocatedBytes: cumulativeLeanPhysicalBytes(ledger), elapsedMs: currentLeanElapsedMs(ledger) }, reserveBytes)
}
export const assessLeanPrefixCapacity = (m: { childRss: number; parentRss: number; freeBytes: number; allocatedBytes: number; elapsedMs: number }, reserveBytes = 320 * 1024 * 1024): number => {
  if (!exactLabKeys(m, ["childRss", "parentRss", "freeBytes", "allocatedBytes", "elapsedMs"]) || !Object.values(m).every(n => Number.isSafeInteger(n) && n >= 0) || !Number.isSafeInteger(reserveBytes) || reserveBytes < 0 || m.childRss + m.parentRss + LEAN_EXTERNAL_SCRATCH_RESERVE + reserveBytes > LEAN_CAPS.scratchBytes || m.elapsedMs >= LEAN_CAPS.elapsedMs || m.allocatedBytes > LEAN_CAPS.totalBytes || m.freeBytes < LEAN_CAPS.totalBytes - m.allocatedBytes) return fail("PREFIX_CAPACITY")
  return m.childRss + m.parentRss
}
export const admitLeanChildRelease = (entry: LeanChildEntryV2, token: string, pid: number, parentPid: number): void => {
  if (!/^[a-f0-9]{64}$/u.test(token) || entry.parentPid !== parentPid || entry.childPid !== pid || leanBytesRoot(Buffer.from(token, "hex")) !== entry.handshakeRoot) return fail("HANDSHAKE")
}
/** The observing parent is part of the child's work authority for the whole
 * interval, not just the release handshake. A lost IPC channel closes every
 * currently owned provider before the child exits without a success terminal. */
export const createLeanParentObservationGuard = (parentPid: number, observedPid = () => process.ppid, connected = () => process.connected) => {
  let lost = false
  const providers = new Set<Pick<FactorySupervisionProvider, "close">>()
  const disconnect = () => {
    if (lost) return
    lost = true
    for (const provider of providers) { try { provider.close() } catch { /* loss remains fatal */ } }
    providers.clear()
  }
  const assert = () => {
    if (lost || !connected() || observedPid() !== parentPid) { disconnect(); return fail("PARENT_LOST") }
  }
  return {
    assert,
    disconnect,
    register(provider: Pick<FactorySupervisionProvider, "close">) { assert(); providers.add(provider) },
    unregister(provider: Pick<FactorySupervisionProvider, "close">) { providers.delete(provider) },
  }
}
export const assertLeanEntryBinding = (entry: LeanChildEntryV2, observed: { head: string; sourceRoot: LabRoot; requestBytesRoot: LabRoot; allocationRoot: LabRoot; parentPid: number; childPid: number; intervalStartMs: number }): void => {
  if (!exactLabKeys(observed, ["head", "sourceRoot", "requestBytesRoot", "allocationRoot", "parentPid", "childPid", "intervalStartMs"]) || entry.head !== observed.head || entry.sourceRoot !== observed.sourceRoot || entry.requestBytesRoot !== observed.requestBytesRoot || entry.allocationRoot !== observed.allocationRoot || entry.parentPid !== observed.parentPid || entry.childPid !== observed.childPid || entry.wallStartMs !== observed.intervalStartMs) return fail("ENTRY")
}
const readCandidates = (r: Request, checkpoint: () => void, beforeAllocation: (reserveBytes: number) => void) => {
  const repository = createFactoryRepository(resolve(r.factoryDirectory)), candidates = readLeanPilotInitialCandidates(repository, r.selection, checkpoint, beforeAllocation)
  if (candidates.length !== 2 || candidates.some(c => !c.admission.importEvidence || !["S01", "S03"].includes(c.admission.importEvidence.sourceSlot))) return fail("ASSESSED_PAIR")
  return [...candidates].sort((a, b) => a.admission.candidate.root.localeCompare(b.admission.candidate.root))
}
export const prepareLeanPilot = (requestPath: string) => {
  requireLeanProspectiveWritableScope()
  const request = readRequest(requestPath), repository = createFactoryRepository(resolve(request.factoryDirectory))
  // Preparation makes no empirical claim: two bounded publication headers fix
  // candidate IDs; the child performs the one complete authenticated import.
  const candidateRoots = request.selection.initialCandidatePublicationRoots.map(id => {
    const publication = JSON.parse(Buffer.from(readFactoryArtifact(repository, id)).toString("utf8")) as { candidate?: { root?: unknown } }
    if (!root(publication?.candidate?.root)) return fail("CANDIDATE_HEADER")
    return publication.candidate.root
  })
  const allocation = createLeanAllocationV2({ seed: request.seed, sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, candidateRoots })
  const ledger = createLeanLedger(STORE, allocation)
  exclusive(resolve(ALLOCATION), allocation)
  return { issued: false, evidenceClass: "preparation_only", allocationRoot: ledger.allocation.root, allocationPath: ALLOCATION, store: STORE }
}
const redactReplay = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redactReplay)
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:source|memory|objective|input|output|stdio|prompt)/iu.test(key)).map(([key, v]) => [key, redactReplay(v)]))
  return value
}
const compactExecution = (e: LabMatchExecution, elapsedMs: number, cleanupComplete: boolean, bottom: string): LeanCompactMatchRecord => {
  boundLeanReplayFrame(e)
  const system = e.kind === "failure" || e.accounting.some(a => !a.result.ok && "systemFailure" in a.result)
  const player = e.accounting.some(a => !a.result.ok && !("systemFailure" in a.result))
  const classification = system || !cleanupComplete ? "system_failure" : player ? "player_violation" : "success"
  const outcome = e.kind === "completed" && classification === "success" ? e.result.state.outcome : null
  return { classification, code: !cleanupComplete ? "CLEANUP" : system ? "SUPERVISOR_FAILURE" : player ? "PLAYER_VIOLATION" : "OK", outcome: outcome?.type === "DRAW" ? "DRAW" : outcome?.type === "WIN" ? outcome.winnerPlayerId === bottom ? "bottom" : "top" : null, elapsedMs, cleanupComplete, invocationCount: e.accounting.length, accountingRoot: labRoot("lean-accounting-v1", deriveFactoryOrderedRecordDescriptor("lean-accounting", e.accounting.map(a => ({ identity: a.identity, invocationRoot: a.invocationRoot, requestId: a.requestId, method: a.method, inputRoot: a.inputRoot, ordinal: a.ordinal, charged: a.charged, completed: a.completed, outputBytes: a.outputBytes, classification: a.result.ok ? "success" : "systemFailure" in a.result ? "system_failure" : "player_violation" })))), executionRoot: labRoot("lean-execution-v1", deriveFactoryExecutionCommitment(e)), telemetry: { transitions: e.transitions.length, events: e.kind === "completed" ? e.result.events.length : 0 } }
}
/** Native construction only, after the immutable charge is independently reopened. */
const nativeLeanProvider = (ledger: LeanExperimentLedger, charge: LeanCharge, candidate: ReturnType<typeof readCandidates>[number], seat: "bottom" | "top", trackBuffer: () => void, cellBegan: number): FactorySupervisionProvider => {
  const closure = readCandidateClosure(candidate.closure)
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: closure.packet, proposal: closure.proposal, sourceBytes: closure.sourceBytes }), validation: closure.validation })
  const defaults = defaultRuntimeMetadata("typescript"), revision = buildStrategyRevision({ source: new TextDecoder("utf8", { fatal: true }).decode(closure.sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== closure.candidate.proposal.source.root.slice(7)) return fail("REVISION")
  const matchId = `lean-${charge.root.slice(7, 31)}`, containerName = `lean-${charge.root.slice(7, 25)}-${seat}`, ownershipLabel = `lean-${ledger.allocation.root.slice(7, 25)}`
  const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
  const binding = { budgetRoot: ledger.allocation.root, attemptRoot: charge.root, matchId, containerName, ownershipLabel, seat, runtime }
  const authority = issueLeanRuntimeAuthority(ledger, charge, candidate.closure, binding)
  const provider = createFactorySupervisedRuntime({ admission, sourceBytes: closure.sourceBytes, leanExperimentAuthority: authority, matchId, containerName, ownershipLabel, attemptRoot: charge.root, budgetRoot: ledger.allocation.root, image: LAB_ADMITTED_ROOTS.image, invocationLimit: 24800, factoryLifetimeMs: 600000 })
  if (provider.identity.sourceRoot !== admission.sourceRoot || provider.identity.revisionId !== revision.id || provider.identity.budgetRoot !== ledger.allocation.root || provider.identity.attemptRoot !== charge.root || provider.identity.tupleRoot !== ledger.allocation.tupleRoot || provider.identity.runtimeLimitsRoot !== ledger.allocation.runtimeRoot || provider.identity.executableRoot !== runtime.executableRoot) { provider.close(); return fail("IDENTITY") }
  return { identity: provider.identity, verify: evidence => provider.verify(evidence), close: () => provider.close(), invoke(request, identity) { if (performance.now() - cellBegan >= LEAN_CAPS.matchMs) { provider.close(); return fail("MATCH_DEADLINE") }; trackBuffer(); const evidence = provider.invoke(request, identity); trackBuffer(); return evidence } }
}
const runLeanPilotBody = async (requestPath: string) => {
  const began = performance.now(), request = readRequest(requestPath), ledger = openLeanLedger(STORE)
  if (ledger.allocation.sourceRoot !== request.sourceRoot || ledger.allocation.reviewRoot !== request.reviewRoot || ledger.allocation.seed !== request.seed || readLeanLedger(ledger).events.length) return fail("ALLOCATION")
  const committed = execFileSync("git", ["show", `HEAD:${ALLOCATION}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(readFileSync(resolve(ALLOCATION))) || leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(ledger.allocation))) return fail("UNCOMMITTED_ALLOCATION")
  const entry = readLeanChildEntry(ledger), head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
  assertLeanEntryBinding(entry, { head, sourceRoot: request.sourceRoot, requestBytesRoot: leanBytesRoot(readLeanSafeFile(requestPath)), allocationRoot: ledger.allocation.root, parentPid: process.ppid, childPid: process.pid, intervalStartMs: readLeanTimeAccounting(ledger).starts.get("pilot-entry") ?? -1 })
  const parent = createLeanParentObservationGuard(entry.parentPid)
  const onDisconnect = () => { parent.disconnect(); process.exit(1) }
  process.once("disconnect", onDisconnect)
  try {
  parent.assert()
  let bufferHighWater = assertLeanPrefixCapacity(ledger, entry.parentPid), maximumCellMs = 0, maximumCellPhysicalBytes = 0, clean = true
  const trackBuffer = () => { parent.assert(); bufferHighWater = Math.max(bufferHighWater, assertLeanPrefixCapacity(ledger, entry.parentPid)) }
  const beforeAllocation = (reserveBytes: number) => { parent.assert(); bufferHighWater = Math.max(bufferHighWater, assertLeanPrefixCapacity(ledger, entry.parentPid, reserveBytes)) }
  const candidates = readCandidates(request, trackBuffer, beforeAllocation)
  trackBuffer()
  if (labRoot("lean-candidates", candidates.map(c => c.admission.candidate.root)) !== labRoot("lean-candidates", ledger.allocation.candidateRoots)) return fail("CANDIDATE_JOIN")
  for (const slot of ledger.allocation.slots) {
    const f = statfsSync(STORE, { bigint: true }), freeBytes = f.bavail * f.bsize
    if (freeBytes > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY_RANGE")
    trackBuffer()
    checkpointLeanResources(ledger, Math.max(currentLeanElapsedMs(ledger), LEAN_FAILED_PREFIX.elapsedUpperBoundMs + Math.ceil(performance.now() - began)), bufferHighWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
    parent.assert()
    const charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(freeBytes), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
    const cellBegan = performance.now(), opened: FactorySupervisionProvider[] = []
    let cleanupComplete = true, actual: LabMatchExecution
    try {
      const side = slot.condition < 2 ? candidates : [...candidates].reverse()
      const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active" && a.semanticGeometryHash === slot.arenaHash) ?? fail("ARENA")
      const bottomPlayerId = `lean-${side[0]!.admission.candidate.root.slice(7)}`, topPlayerId = `lean-${side[1]!.admission.candidate.root.slice(7)}`
      const scenario = createSetScenarioV137({ arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion, arenaSemanticGeometryHash: slot.arenaHash, entrantA: { entrantKey: candidates[0]!.admission.candidate.root, playerId: `lean-${candidates[0]!.admission.candidate.root.slice(7)}` }, entrantB: { entrantKey: candidates[1]!.admission.candidate.root, playerId: `lean-${candidates[1]!.admission.candidate.root.slice(7)}` }, baseSeed: request.seed })
      const condition = scenario.conditions[slot.condition]!
      trackBuffer(); const bottom = nativeLeanProvider(ledger, charge, side[0]!, "bottom", trackBuffer, cellBegan); opened.push(bottom); parent.register(bottom)
      trackBuffer(); const top = nativeLeanProvider(ledger, charge, side[1]!, "top", trackBuffer, cellBegan); opened.push(top); parent.register(top)
      actual = await runCanonicalLabMatch({ match: { matchId: `lean-${charge.root.slice(7, 31)}`, seed: condition.baseSeed, arenaVariant: arena, bottomPlayerId, topPlayerId, initialInitiativePlayerId: condition.initialInitiativePlayerId, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, providers: { [bottomPlayerId]: bottom, [topPlayerId]: top } })
    } catch { actual = { kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "LEAN_SUPERVISOR_FAILURE" } } }
    finally { for (const p of opened) { parent.unregister(p); try { const closed = p.close(); cleanupComplete = cleanupComplete && closed.cleanupComplete && !closed.orphanedChild } catch { cleanupComplete = false } } }
    parent.assert()
    const elapsedMs = Math.ceil(performance.now() - cellBegan), bottom = slot.condition < 2 ? candidates[0]! : candidates[1]!
    const record = compactExecution(actual, elapsedMs, cleanupComplete, `lean-${bottom.admission.candidate.root.slice(7)}`)
    function* replayFrames() {
      if (actual.kind === "completed") { trackBuffer(); boundLeanReplayFrame(actual.result.state); yield redactReplay({ kind: "final-state", value: actual.result.state }); for (const t of actual.transitions) { trackBuffer(); boundLeanReplayFrame(t); yield redactReplay({ kind: "transition", value: t }) } }
      else yield { kind: "failure", code: record.code }
    }
    const frames = replayFrames()
    retainLeanMatch(ledger, charge, record, frames)
    trackBuffer(); maximumCellMs = Math.max(maximumCellMs, elapsedMs)
    checkpointLeanResources(ledger, Math.max(currentLeanElapsedMs(ledger), LEAN_FAILED_PREFIX.elapsedUpperBoundMs + Math.ceil(performance.now() - began)), bufferHighWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
    if (record.classification !== "success" || !cleanupComplete) { clean = false; break }
  }
  stopLeanLedger(ledger, clean ? "complete" : "failure")
  maximumCellPhysicalBytes = derivePilotPhysicalMaximum(ledger)
  verifyLeanEvidence(ledger)
  if (leanSourceManifest().root !== request.sourceRoot || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== head) return fail("SOURCE_HOLD")
  checkpointLeanResources(ledger, currentLeanElapsedMs(ledger), bufferHighWater, LEAN_EXTERNAL_SCRATCH_RESERVE)
  const verified = verifyLeanEvidence(ledger)
  const result = { schemaVersion: "lean-pilot-result-v2", issued: false, evidenceClass: "feasibility_only", allocationRoot: ledger.allocation.root, sourceRoot: request.sourceRoot, head, evidenceRoot: verified.root, charged: verified.charged, successful: verified.records.filter(r => r.status === "success").length, tier: "pending_independent_verification", maximumCellMs, maximumCellPhysicalBytes, elapsedMs: verified.elapsedMs, physicalHighWaterBytes: verified.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes }
  exclusive(join(STORE, "result.json"), result); return result
  } finally { process.off("disconnect", onDisconnect) }
}
/** The hidden child mode has no work authority until the one-use parent IPC
 * release matches its create-exclusive entry. An ordinary CLI call cannot
 * supply `process.send` or forge the child PID/parent PID binding. */
export const runLeanPilotChild = async (requestPath: string) => {
  requireLeanProspectiveWritableScope()
  if (!process.send || !process.connected) return fail("CHILD_PARENT")
  const token = await new Promise<string>((resolveToken, reject) => {
    const timer = setTimeout(() => reject(new TypeError("LEAN_PILOT_HANDSHAKE")), 30_000)
    process.once("disconnect", () => { clearTimeout(timer); reject(new TypeError("LEAN_PILOT_PARENT_LOST")) })
    process.once("message", message => { clearTimeout(timer); if (!message || typeof message !== "object" || !exactLabKeys(message, ["release"]) || typeof message.release !== "string") { reject(new TypeError("LEAN_PILOT_HANDSHAKE")); return }; resolveToken(message.release) })
    process.send!({ ready: process.pid })
  })
  const ledger = openLeanLedger(STORE), entry = readLeanChildEntry(ledger)
  admitLeanChildRelease(entry, token, process.pid, process.ppid)
  if (!process.connected) return fail("PARENT_LOST")
  if (!readLeanTimeAccounting(ledger).active) return fail("HANDSHAKE")
  return runLeanPilotBody(requestPath)
}
export const runLeanPilot = async (requestPath: string) => {
  requireLeanProspectiveWritableScope()
  const request = readRequest(requestPath), ledger = openLeanLedger(STORE)
  if (ledger.allocation.schemaVersion !== "lean-experiment-allocation-v2" || ledger.allocation.sourceRoot !== request.sourceRoot || ledger.allocation.reviewRoot !== request.reviewRoot || ledger.allocation.seed !== request.seed || readLeanLedger(ledger).events.length || readLeanTimeAccounting(ledger).starts.size || readdirSync(STORE).some(name => ["entry.json", "child-terminal.json", "result.json", "entry-failure.json"].includes(name))) return fail("ALLOCATION")
  const committed = execFileSync("git", ["show", `HEAD:${ALLOCATION}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(readLeanSafeFile(ALLOCATION)) || leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(ledger.allocation))) return fail("UNCOMMITTED_ALLOCATION")
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
  const token = randomBytes(32).toString("hex")
  const child = fork(resolve(process.argv[1] ?? fail("ENTRY_PATH")), ["child-pilot", "--request", requestPath], { execArgv: process.execArgv, stdio: ["ignore", "ignore", "ignore", "ipc"] })
  let entered = false, childRssObservedBytes: number | null = null, uncertain = false
  child.on("error", () => { uncertain = true })
  try {
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new TypeError("LEAN_PILOT_CHILD_READY")), 30_000)
      child.once("message", message => { clearTimeout(timer); if (!message || typeof message !== "object" || !exactLabKeys(message, ["ready"]) || message.ready !== child.pid) { reject(new TypeError("LEAN_PILOT_CHILD_READY")); return }; resolveReady() })
      child.once("exit", () => { clearTimeout(timer); reject(new TypeError("LEAN_PILOT_CHILD_EXIT_BEFORE_ENTRY")) })
    })
    if (!child.pid) return fail("CHILD_PID")
    childRssObservedBytes = rssOf(child.pid)
    if (process.memoryUsage().rss + childRssObservedBytes + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > LEAN_CAPS.scratchBytes) return fail("PREFIX_CAPACITY")
    const f = statfsSync(STORE, { bigint: true }), free = f.bavail * f.bsize
    if (free > BigInt(Number.MAX_SAFE_INTEGER) || free < BigInt(LEAN_CAPS.totalBytes - cumulativeLeanPhysicalBytes(ledger))) return fail("PREFIX_CAPACITY")
    const entry: LeanChildEntryV2 = { schemaVersion: "lean-child-entry-v2", allocationRoot: ledger.allocation.root, sourceRoot: request.sourceRoot, requestBytesRoot: leanBytesRoot(readLeanSafeFile(requestPath)), head, parentPid: process.pid, childPid: child.pid, handshakeRoot: leanBytesRoot(Buffer.from(token, "hex")), wallStartMs: Date.now(), monotonicStartNs: process.hrtime.bigint().toString() }
    publishLeanChildEntry(ledger, entry)
    beginLeanInterval(ledger, "pilot-entry", entry.wallStartMs)
    entered = true
    child.send({ release: token })
    const period = setInterval(() => {
      try {
        const rss = rssOf(child.pid!)
        childRssObservedBytes = Math.max(childRssObservedBytes ?? 0, rss)
        if (process.memoryUsage().rss + rss + LEAN_EXTERNAL_SCRATCH_RESERVE + 320 * 1024 * 1024 > LEAN_CAPS.scratchBytes || currentLeanElapsedMs(ledger) >= LEAN_CAPS.elapsedMs) { uncertain = true; child.kill("SIGKILL") }
      } catch { uncertain = true; child.kill("SIGKILL") }
    }, 250)
    const timeout = setTimeout(() => { uncertain = true; child.kill("SIGKILL") }, LEAN_CAPS.elapsedMs - LEAN_FAILED_PREFIX.elapsedUpperBoundMs)
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolveExit => child.once("exit", (code, signal) => resolveExit({ code, signal })))
    clearInterval(period); clearTimeout(timeout)
    try {
      if (execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", maxBuffer: 128 }).trim() !== head || leanSourceManifest().root !== request.sourceRoot || leanBytesRoot(readLeanSafeFile(requestPath)) !== entry.requestBytesRoot) uncertain = true
    } catch { uncertain = true }
    const stat = statfsSync(STORE, { bigint: true }), freeBytes = stat.bavail * stat.bsize
    const terminal = deriveLeanChildTerminal(ledger, entry, { exitCode: exit.code, signal: exit.signal, wallObservedMs: Date.now(), monotonicObservedNs: process.hrtime.bigint().toString(), status: exit.code === 0 && !uncertain ? "child_exited" : "child_failed", parentRssBytes: process.memoryUsage().rss, childRssObservedBytes, physicalBytes: cumulativeLeanPhysicalBytes(ledger) + 65_536, freeBytes: freeBytes <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(freeBytes) : null })
    publishLeanChildTerminal(ledger, terminal)
    if (terminal.status !== "child_exited") return fail("CHILD_FAILED")
    return { issued: false, evidenceClass: "feasibility_only", status: "child_exited_pending_independent_verification", allocationRoot: ledger.allocation.root, terminalElapsedUpperBoundMs: terminal.elapsedUpperBoundMs }
  } finally { if (!entered && child.exitCode === null) child.kill("SIGKILL") }
}
const derivePilotPhysicalMaximum = (ledger: LeanExperimentLedger): number => {
  const resources = readLeanLedger(ledger).events.filter(e => e.kind === "resource")
  return resources.reduce((maximum, e, i) => Math.max(maximum, i % 2 === 1 ? e.physicalBytes - resources[i - 1]!.physicalBytes : 0), 0)
}
const readLeanPilotResultBody = (requestPath: string) => {
  const request = readRequest(requestPath), ledger = openLeanLedger(STORE), verified = verifyLeanEvidence(ledger)
  const bytes = readLeanSafeFile(join(STORE, "result.json")), result = JSON.parse(Buffer.from(bytes).toString("utf8"))
  if (leanBytesRoot(bytes) !== leanBytesRoot(leanCanonicalBytes(result))) return fail("RETAINED_RESULT")
  const entry = readLeanChildEntry(ledger), terminal = readLeanChildTerminal(ledger)
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
  const committed = execFileSync("git", ["show", `${head}:${ALLOCATION}`], { maxBuffer: 262144 })
  if (terminal.status !== "child_exited" || entry.head !== head || entry.sourceRoot !== request.sourceRoot || entry.requestBytesRoot !== leanBytesRoot(readLeanSafeFile(requestPath)) || leanBytesRoot(committed) !== leanBytesRoot(readLeanSafeFile(resolve(ALLOCATION))) || leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(ledger.allocation)) || !readLeanLedger(ledger).stopped) return fail("RETAINED_ENTRY")
  const records = verified.records.flatMap(r => r.terminal ? [r.terminal.record] : []), maximumCellMs = Math.max(0, ...records.map(r => r.elapsedMs))
  const maximumCellPhysicalBytes = derivePilotPhysicalMaximum(ledger)
  const expected = { schemaVersion: "lean-pilot-result-v2", issued: false, evidenceClass: "feasibility_only", allocationRoot: ledger.allocation.root, sourceRoot: request.sourceRoot, head, evidenceRoot: verified.root, charged: verified.charged, successful: records.filter(r => r.classification === "success").length, tier: "pending_independent_verification", maximumCellMs, maximumCellPhysicalBytes, elapsedMs: verified.elapsedMs, physicalHighWaterBytes: verified.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes }
  validateLeanResult(result, expected)
  if (currentLeanElapsedMs(ledger) > LEAN_CAPS.elapsedMs || verified.physicalHighWaterBytes > LEAN_CAPS.totalBytes || readLeanTimeAccounting(ledger).elapsedMs > LEAN_CAPS.elapsedMs) return fail("TIME_CAP")
  return { issued: false, evidenceClass: "feasibility_only", allocationRoot: ledger.allocation.root, evidenceRoot: verified.root, charged: verified.charged, maximumCellMs, maximumCellPhysicalBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes, status: verified.records.every(r => r.status === "success") ? "pilot_complete" : "feasibility_not_established" }
}
export const validateLeanResult = (result: unknown, expected: Record<string, unknown>) => {
  if (!exactLabKeys(result, Object.keys(expected)) || labRoot("lean-result-admission", result) !== labRoot("lean-result-admission", expected)) return fail("RETAINED_RESULT")
}
export const readLeanPilotResult = (requestPath: string) => {
  const ledger = openLeanLedger(STORE)
  readLeanChildTerminal(ledger)
  beginLeanInterval(ledger, "pilot-retained-verifier")
  let verified: ReturnType<typeof readLeanPilotResultBody>
  try { verified = readLeanPilotResultBody(requestPath) }
  finally { closeLeanInterval(ledger, "pilot-retained-verifier") }
  const cumulative = readLeanCumulativeAccounting(ledger)
  const tier = verified.status === "pilot_complete" ? chooseLeanTier({ pilotCells: 8, maximumCellMs: verified.maximumCellMs, maximumCellPhysicalBytes: verified.maximumCellPhysicalBytes, elapsedMs: cumulative.elapsedMs, physicalHighWaterBytes: cumulative.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes }) : "feasibility_not_established"
  return { ...verified, tier, elapsedMs: cumulative.elapsedMs, physicalHighWaterBytes: cumulative.physicalHighWaterBytes, status: tier === "feasibility_not_established" ? "feasibility_not_established" : verified.status }
}
export const leanPilotMain = async (args: readonly string[]) => { const c = parseLeanCommand(args); return c.mode === "prepare-pilot" ? prepareLeanPilot(c.request) : c.mode === "run-pilot" ? runLeanPilot(c.request) : readLeanPilotResult(c.request) }
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  const action = args.length === 3 && args[0] === "child-pilot" && args[1] === "--request" ? runLeanPilotChild(args[2]!) : leanPilotMain(args)
  void action.then(v => { if (args[0] !== "child-pilot") process.stdout.write(`${JSON.stringify(v)}\n`) }).catch(() => { process.stderr.write("LEAN_PILOT_FAILED_DETAILS_WITHHELD\n"); process.exitCode = 1 })
}
