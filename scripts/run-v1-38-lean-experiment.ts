/** Main-orchestrator private entry. Importing this file never starts a job. */
import { constants, openSync, writeSync, fsyncSync, closeSync, readFileSync, lstatSync, realpathSync, statfsSync } from "node:fs"
import { resolve, join } from "node:path"
import { pathToFileURL } from "node:url"
import { execFileSync } from "node:child_process"
import { performance } from "node:perf_hooks"
import { CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata, createSetScenarioV137 } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { buildStrategyRevision } from "../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision, deriveFactoryExecutionCommitment, deriveFactoryOrderedRecordDescriptor, type FactorySupervisionProvider } from "../packages/strategy-lab/src/factory/admission.js"
import { createFactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { readCandidateClosure } from "../packages/strategy-lab/src/league/connected-runner.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../packages/strategy-lab/src/runtime-bridge.js"
import { writeLeanAll, createLeanAllocation, createLeanLedger, openLeanLedger, chargeLeanSlot, retainLeanMatch, checkpointLeanResources, measureLeanPhysicalBytes, readLeanLedger, stopLeanLedger, verifyLeanEvidence, chooseLeanTier, leanBytesRoot, leanCanonicalBytes, LEAN_CAPS, type LeanExperimentLedger, type LeanCompactMatchRecord, type LeanCharge } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { readLeagueInitialCandidates, observeLeagueAvailableMemoryBytes, type LeagueInitialCandidateSelection } from "./run-v1-38-serious-league.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"
import { createFactorySupervisedRuntime } from "./lib/v1-38-factory-supervised-runtime.js"
import { issueLeanRuntimeAuthority } from "./lib/v1-38-lean-experiment-authority.js"
import { prospectiveLeagueRuntimeBinding } from "./lib/v1-38-league-prospective-lifetime.js"

const fail = (code: string): never => { throw new TypeError(`LEAN_PILOT_${code}`) }
const STORE = resolve(".strategy-lab/lean-experiment-20261003")
const ALLOCATION = ".planning/artifacts/v1.38-lean-pilot-allocation-v1.json"
interface Request { schemaVersion: "lean-pilot-request-v1"; seed: string; reviewRoot: LabRoot; sourceRoot: LabRoot; factoryDirectory: string; selection: LeagueInitialCandidateSelection }
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[0-9a-f]{64}$/u.test(v)
export const leanSourceManifest = () => {
  const legacy = factoryAssessmentImplementationManifest()
  const paths = ["scripts/run-v1-38-lean-experiment.ts", "scripts/lib/v1-38-lean-experiment-authority.ts", "packages/strategy-lab/src/league/lean-experiment.ts"]
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
  if (!exactLabKeys(r, ["schemaVersion", "seed", "reviewRoot", "sourceRoot", "factoryDirectory", "selection"]) || r.schemaVersion !== "lean-pilot-request-v1" || !root(r.reviewRoot) || !root(r.sourceRoot) || r.sourceRoot !== leanSourceManifest().root || !exactLabKeys(r.selection, ["initialCandidatePublicationRoots", "factoryAssessmentArtifactRoots", "operations"]) || r.selection.initialCandidatePublicationRoots.length !== 2 || r.selection.factoryAssessmentArtifactRoots.length !== 1 || ![...r.selection.initialCandidatePublicationRoots, ...r.selection.factoryAssessmentArtifactRoots].every(root) || !exactLabKeys(r.selection.operations, ["maxArtifactBytes", "maxArtifactRecords"]) || r.selection.operations.maxArtifactBytes !== 12_000_000_000 || r.selection.operations.maxArtifactRecords !== 200_000) return fail("REQUEST")
  const f = resolve(r.factoryDirectory)
  if (!f.startsWith(`${resolve(".strategy-lab")}/`) || realpathSync(f) !== f || lstatSync(f).isSymbolicLink()) return fail("FACTORY")
  return r
}
const exclusive = (path: string, value: unknown) => { const bytes = leanCanonicalBytes(value); const fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600); try { writeLeanAll(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) } }
const readCandidates = (r: Request) => {
  const repository = createFactoryRepository(resolve(r.factoryDirectory)), candidates = readLeagueInitialCandidates(repository, r.selection)
  if (candidates.length !== 2 || candidates.some(c => !c.admission.importEvidence || !["S01", "S03"].includes(c.admission.importEvidence.sourceSlot))) return fail("ASSESSED_PAIR")
  return [...candidates].sort((a, b) => a.admission.candidate.root.localeCompare(b.admission.candidate.root))
}
export const prepareLeanPilot = (requestPath: string) => {
  const request = readRequest(requestPath), candidates = readCandidates(request)
  const allocation = createLeanAllocation({ seed: request.seed, sourceRoot: request.sourceRoot, reviewRoot: request.reviewRoot, candidateRoots: candidates.map(c => c.admission.candidate.root) })
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
  const authority = issueLeanRuntimeAuthority(ledger, charge, candidate.admission.candidate.root, binding)
  const provider = createFactorySupervisedRuntime({ admission, sourceBytes: closure.sourceBytes, leanExperimentAuthority: authority, matchId, containerName, ownershipLabel, attemptRoot: charge.root, budgetRoot: ledger.allocation.root, image: LAB_ADMITTED_ROOTS.image, invocationLimit: 24800, factoryLifetimeMs: 600000 })
  if (provider.identity.sourceRoot !== admission.sourceRoot || provider.identity.revisionId !== revision.id || provider.identity.budgetRoot !== ledger.allocation.root || provider.identity.attemptRoot !== charge.root || provider.identity.tupleRoot !== ledger.allocation.tupleRoot || provider.identity.runtimeLimitsRoot !== ledger.allocation.runtimeRoot || provider.identity.executableRoot !== runtime.executableRoot) { provider.close(); return fail("IDENTITY") }
  return { identity: provider.identity, verify: evidence => provider.verify(evidence), close: () => provider.close(), invoke(request, identity) { if (performance.now() - cellBegan >= LEAN_CAPS.matchMs) { provider.close(); return fail("MATCH_DEADLINE") }; trackBuffer(); const evidence = provider.invoke(request, identity); trackBuffer(); return evidence } }
}
const runLeanPilotBody = async (requestPath: string, entryCreated: () => void) => {
  const began = performance.now(), request = readRequest(requestPath), ledger = openLeanLedger(STORE)
  if (ledger.allocation.sourceRoot !== request.sourceRoot || ledger.allocation.reviewRoot !== request.reviewRoot || ledger.allocation.seed !== request.seed || readLeanLedger(ledger).events.length) return fail("ALLOCATION")
  const committed = execFileSync("git", ["show", `HEAD:${ALLOCATION}`], { maxBuffer: 262144 })
  if (leanBytesRoot(committed) !== leanBytesRoot(readFileSync(resolve(ALLOCATION))) || leanBytesRoot(committed) !== leanBytesRoot(leanCanonicalBytes(ledger.allocation))) return fail("UNCOMMITTED_ALLOCATION")
  const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
  exclusive(join(STORE, "entry.json"), { schemaVersion: "lean-pilot-entry-v1", sourceRoot: request.sourceRoot, allocationRoot: ledger.allocation.root, head, pid: process.pid })
  entryCreated()
  let bufferHighWater = process.memoryUsage().rss, maximumCellMs = 0, maximumCellPhysicalBytes = 0, clean = true
  const trackBuffer = () => { bufferHighWater = Math.max(bufferHighWater, process.memoryUsage().rss, process.resourceUsage().maxRSS * 1024); if (bufferHighWater > LEAN_CAPS.scratchBytes) return fail("BUFFER_CAP") }
  const candidates = readCandidates(request)
  if (labRoot("lean-candidates", candidates.map(c => c.admission.candidate.root)) !== labRoot("lean-candidates", ledger.allocation.candidateRoots)) return fail("CANDIDATE_JOIN")
  for (const slot of ledger.allocation.slots) {
    const f = statfsSync(STORE, { bigint: true }), freeBytes = f.bavail * f.bsize
    if (freeBytes > BigInt(Number.MAX_SAFE_INTEGER)) return fail("CAPACITY_RANGE")
    checkpointLeanResources(ledger, Math.ceil(performance.now() - began), bufferHighWater)
    const charge = chargeLeanSlot(ledger, slot, { freeBytes: Number(freeBytes), availableMemoryBytes: observeLeagueAvailableMemoryBytes() })
    const cellBegan = performance.now(), opened: FactorySupervisionProvider[] = []
    let cleanupComplete = true, actual: LabMatchExecution
    try {
      const side = slot.condition < 2 ? candidates : [...candidates].reverse()
      const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active" && a.semanticGeometryHash === slot.arenaHash) ?? fail("ARENA")
      const bottomPlayerId = `lean-${side[0]!.admission.candidate.root.slice(7)}`, topPlayerId = `lean-${side[1]!.admission.candidate.root.slice(7)}`
      const scenario = createSetScenarioV137({ arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion, arenaSemanticGeometryHash: slot.arenaHash, entrantA: { entrantKey: candidates[0]!.admission.candidate.root, playerId: `lean-${candidates[0]!.admission.candidate.root.slice(7)}` }, entrantB: { entrantKey: candidates[1]!.admission.candidate.root, playerId: `lean-${candidates[1]!.admission.candidate.root.slice(7)}` }, baseSeed: request.seed })
      const condition = scenario.conditions[slot.condition]!
      const bottom = nativeLeanProvider(ledger, charge, side[0]!, "bottom", trackBuffer, cellBegan); opened.push(bottom)
      const top = nativeLeanProvider(ledger, charge, side[1]!, "top", trackBuffer, cellBegan); opened.push(top)
      actual = await runCanonicalLabMatch({ match: { matchId: `lean-${charge.root.slice(7, 31)}`, seed: condition.baseSeed, arenaVariant: arena, bottomPlayerId, topPlayerId, initialInitiativePlayerId: condition.initialInitiativePlayerId, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, providers: { [bottomPlayerId]: bottom, [topPlayerId]: top } })
    } catch { actual = { kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "LEAN_SUPERVISOR_FAILURE" } } }
    finally { for (const p of opened) { try { const closed = p.close(); cleanupComplete = cleanupComplete && closed.cleanupComplete && !closed.orphanedChild } catch { cleanupComplete = false } } }
    const elapsedMs = Math.ceil(performance.now() - cellBegan), bottom = slot.condition < 2 ? candidates[0]! : candidates[1]!
    const record = compactExecution(actual, elapsedMs, cleanupComplete, `lean-${bottom.admission.candidate.root.slice(7)}`)
    const frames = actual.kind === "completed" ? [redactReplay({ kind: "final-state", value: actual.result.state }), ...actual.transitions.map(t => redactReplay({ kind: "transition", value: t }))] : [{ kind: "failure", code: record.code }]
    retainLeanMatch(ledger, charge, record, frames)
    trackBuffer(); maximumCellMs = Math.max(maximumCellMs, elapsedMs)
    checkpointLeanResources(ledger, Math.ceil(performance.now() - began), bufferHighWater)
    if (record.classification !== "success" || !cleanupComplete) { clean = false; break }
  }
  stopLeanLedger(ledger, clean ? "complete" : "failure")
  maximumCellPhysicalBytes = derivePilotPhysicalMaximum(ledger)
  const verified = verifyLeanEvidence(ledger), tier = clean && verified.charged === 8 ? chooseLeanTier({ pilotCells: 8, maximumCellMs, maximumCellPhysicalBytes, elapsedMs: verified.elapsedMs, physicalHighWaterBytes: verified.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes }) : "feasibility_not_established"
  if (leanSourceManifest().root !== request.sourceRoot || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== head) return fail("SOURCE_HOLD")
  const result = { schemaVersion: "lean-pilot-result-v1", issued: false, evidenceClass: "feasibility_only", allocationRoot: ledger.allocation.root, sourceRoot: request.sourceRoot, head, evidenceRoot: verified.root, charged: verified.charged, successful: verified.records.filter(r => r.status === "success").length, tier, maximumCellMs, maximumCellPhysicalBytes, elapsedMs: verified.elapsedMs, physicalHighWaterBytes: verified.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes }
  exclusive(join(STORE, "result.json"), result); return result
}
export const runLeanPilot = async (requestPath: string) => {
  let entered = false
  try { return await runLeanPilotBody(requestPath, () => { entered = true }) }
  catch (error) {
    if (entered) {
      const code = error instanceof Error && /(?:CAPACITY|RESOURCE|BUFFER_CAP)/u.test(error.message) ? "CAPACITY" : "INTEGRITY_OR_PUBLICATION"
      exclusive(join(STORE, "entry-failure.json"), { schemaVersion: "lean-pilot-entry-terminal-v1", issued: false, status: "feasibility_not_established", code, noRetry: true, pid: process.pid })
    }
    throw error
  }
}
const derivePilotPhysicalMaximum = (ledger: LeanExperimentLedger): number => {
  const resources = readLeanLedger(ledger).events.filter(e => e.kind === "resource")
  return resources.reduce((maximum, e, i) => Math.max(maximum, i % 2 === 1 ? e.physicalBytes - resources[i - 1]!.physicalBytes : 0), 0)
}
export const readLeanPilotResult = (requestPath: string) => {
  const request = readRequest(requestPath), ledger = openLeanLedger(STORE), verified = verifyLeanEvidence(ledger)
  const result = JSON.parse(readFileSync(join(STORE, "result.json"), "utf8"))
  if (result.schemaVersion !== "lean-pilot-result-v1" || result.issued !== false || result.evidenceClass !== "feasibility_only" || result.sourceRoot !== request.sourceRoot || result.allocationRoot !== ledger.allocation.root || result.evidenceRoot !== verified.root || result.charged !== verified.charged || !readLeanLedger(ledger).stopped) return fail("RETAINED_RESULT")
  const records = verified.records.flatMap(r => r.terminal ? [r.terminal.record] : []), maximumCellMs = Math.max(0, ...records.map(r => r.elapsedMs))
  const maximumCellPhysicalBytes = derivePilotPhysicalMaximum(ledger)
  const expectedTier = verified.charged === 8 && records.every(r => r.classification === "success" && r.cleanupComplete) ? chooseLeanTier({ pilotCells: 8, maximumCellMs, maximumCellPhysicalBytes, elapsedMs: verified.elapsedMs, physicalHighWaterBytes: verified.physicalHighWaterBytes, scratchHighWaterBytes: verified.scratchHighWaterBytes }) : "feasibility_not_established"
  if (result.tier !== expectedTier || result.maximumCellPhysicalBytes !== maximumCellPhysicalBytes || result.maximumCellMs !== maximumCellMs || result.elapsedMs !== verified.elapsedMs || result.physicalHighWaterBytes !== verified.physicalHighWaterBytes || result.scratchHighWaterBytes !== verified.scratchHighWaterBytes) return fail("RETAINED_MEASUREMENT")
  return { issued: false, evidenceClass: "feasibility_only", allocationRoot: ledger.allocation.root, evidenceRoot: verified.root, charged: verified.charged, tier: result.tier, status: verified.records.every(r => r.status === "success") ? "pilot_complete" : "feasibility_not_established" }
}
export const leanPilotMain = async (args: readonly string[]) => { const c = parseLeanCommand(args); return c.mode === "prepare-pilot" ? prepareLeanPilot(c.request) : c.mode === "run-pilot" ? runLeanPilot(c.request) : readLeanPilotResult(c.request) }
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) void leanPilotMain(process.argv.slice(2)).then(v => process.stdout.write(`${JSON.stringify(v)}\n`)).catch(() => { process.stderr.write("LEAN_PILOT_FAILED_DETAILS_WITHHELD\n"); process.exitCode = 1 })
