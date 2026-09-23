import { createHash } from "node:crypto"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, SoldierBrainInputV119Schema, SoldierBrainResultSchema, StrategyResultSchema, type Action, type SoldierBrainInputV119 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { deriveFactoryExecutionCommitment } from "../../packages/strategy-lab/src/factory/admission.js"
import { createLeagueRepository, readLeagueArtifact, type LeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { declareLeagueRound } from "../../packages/strategy-lab/src/league/psro.js"
import type { AdmittedLeagueExecutionAllocation, LeagueResponseJob } from "../../packages/strategy-lab/src/league/allocation.js"
import { readFactoryArtifact, type FactoryRepository } from "../../packages/strategy-lab/src/factory/repository.js"
import type { LabMatchExecution, LabRuntimeEvidence } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { createTacticalAdaptationCorpus, admitTacticalAdaptationCorpus, type TacticalAdaptationCorpus, type TacticalAdaptationObservation } from "../../packages/strategy-oracle-tactical/src/adaptation.js"
import { isLeagueExecutionStreamReference, readLeagueExecutionStream } from "./v1-38-league-execution-stream.js"

const fail = (code: string): never => { throw new TypeError(`LEAGUE_TACTICAL_${code}`) }
const exact = (value: unknown, keys: readonly string[]): value is Record<string, any> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join()
const encode = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); return admitted.ok ? admitted.canonicalBytes : fail("CANONICAL") }
const parse = (bytes: Uint8Array): any => { const admitted = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" }); return admitted.ok ? admitted.value : fail("CANONICAL_BYTES") }
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const same = (a: unknown, b: unknown) => byteRoot(encode(a)) === byteRoot(encode(b))
type Limits = { maxArtifactBytes: number; maxArtifactRecords: number }
export type TacticalCellReader = (root: LabRoot) => { kind: string; value: any }

/** Read only the requested immutable graph record, not its entire predecessor graph. */
export const readTacticalLeagueRecord = (repository: LeagueRepository, root: LabRoot, limits: Limits): ReturnType<TacticalCellReader> => {
  let bytesRead = 0, recordsRead = 0
  const read = (artifactRoot: LabRoot) => { const bytes = readLeagueArtifact(repository, artifactRoot); bytesRead += bytes.length; if (++recordsRead > limits.maxArtifactRecords || bytesRead > limits.maxArtifactBytes || byteRoot(bytes) !== artifactRoot) return fail("READ_BOUND"); return bytes }
  const descriptor = parse(read(root)), { root: domainRoot, ...body } = descriptor
  if (!exact(descriptor, ["schemaVersion", "privacy", "root", "kind", "byteLength", "recordRoot", "chunkCount", "tailRoot", "links"]) || descriptor.schemaVersion !== "league-record-v1" || descriptor.privacy !== "private_offline" || domainRoot !== labRoot("league-record-v1", body) || !Array.isArray(descriptor.links) || descriptor.links.length > 128 || !same(descriptor.links, [...new Set(descriptor.links)].sort()) || !Number.isSafeInteger(descriptor.byteLength) || descriptor.byteLength < 1 || descriptor.byteLength > limits.maxArtifactBytes || descriptor.chunkCount !== Math.ceil(descriptor.byteLength / 131072) || descriptor.chunkCount * 2 + 1 > limits.maxArtifactRecords) return fail("RECORD_DESCRIPTOR")
  const bytes = new Uint8Array(descriptor.byteLength); let tail = descriptor.tailRoot
  for (let ordinal = descriptor.chunkCount - 1; ordinal >= 0; ordinal--) {
    const node = parse(read(tail))
    if (!exact(node, ["schemaVersion", "ordinal", "previousRoot", "bytesRoot", "byteLength"]) || node.schemaVersion !== "league-record-chunk-v1" || node.ordinal !== ordinal || node.byteLength !== (ordinal === descriptor.chunkCount - 1 ? descriptor.byteLength - ordinal * 131072 : 131072)) return fail("RECORD_CHUNK")
    const chunk = read(node.bytesRoot); if (chunk.length !== node.byteLength) return fail("RECORD_CHUNK")
    bytes.set(chunk, ordinal * 131072); tail = node.previousRoot
  }
  if (tail !== null || byteRoot(bytes) !== descriptor.recordRoot) return fail("RECORD_ROOT")
  const value = parse(bytes)
  if (value?.execution?.schemaVersion === "league-execution-ref-v2") {
    if (descriptor.kind !== "cell-result" || !isLeagueExecutionStreamReference(value.execution)) return fail("EXECUTION_REFERENCE")
    value.execution = readLeagueExecutionStream(value.execution, read, limits)
  }
  return { kind: descriptor.kind, value }
}

type Target = { candidateRoot: LabRoot; roles: TacticalAdaptationObservation["roles"]; mixtureWeight: TacticalAdaptationObservation["mixtureWeight"] }
export interface TacticalCorpusTarget {
  roundRoot: LabRoot; strongestPureCandidateRoot: LabRoot; vulnerablePureCandidateRoot: LabRoot
  weights: readonly { candidateRoot: LabRoot; numerator: string; denominator: string }[]
}
const consolidateTargets = (input: TacticalCorpusTarget): Target[] => {
  if (!input.weights.length || new Set(input.weights.map((row) => row.candidateRoot)).size !== input.weights.length) return fail("TARGETS")
  const targets = new Map<LabRoot, Target>()
  for (const weight of input.weights) {
    if (!/^(0|[1-9][0-9]*)$/u.test(weight.numerator) || !/^[1-9][0-9]*$/u.test(weight.denominator) || BigInt(weight.numerator) > BigInt(weight.denominator)) return fail("TARGET_WEIGHT")
    if (BigInt(weight.numerator) > 0n) targets.set(weight.candidateRoot, { candidateRoot: weight.candidateRoot, roles: ["mixture"], mixtureWeight: { numerator: weight.numerator, denominator: weight.denominator } })
  }
  for (const [candidateRoot, role] of [[input.strongestPureCandidateRoot, "strongest_pure"], [input.vulnerablePureCandidateRoot, "vulnerable_pure"]] as const) {
    const target = targets.get(candidateRoot) ?? { candidateRoot, roles: [], mixtureWeight: null }
    target.roles = [...target.roles, role]; targets.set(candidateRoot, target)
  }
  return [...targets.values()].sort((a, b) => a.candidateRoot.localeCompare(b.candidateRoot))
}
type Rehydrated = { observation: TacticalAdaptationObservation; input: SoldierBrainInputV119 }
const observationKey = (row: Pick<TacticalAdaptationObservation, "cellResultRoot" | "targetCandidateRoot" | "invocationRoot" | "selectRequestRoot">) => [row.cellResultRoot, row.targetCandidateRoot, row.invocationRoot, row.selectRequestRoot].join("\n")
const brainKey = (row: TacticalAdaptationObservation) => [observationKey(row), row.soldierBrainInvocationRoot, row.soldierBrainRequestRoot].join("\n")

/** After named-pure reservations, scan cell roots globally; candidate grouping cannot change the canonical fill. */
export const fillCanonicalTacticalMixture = <T extends { observation: Pick<TacticalAdaptationObservation, "cellResultRoot" | "targetCandidateRoot" | "invocationRoot" | "selectRequestRoot"> }>(input: {
  cellResultRoots: readonly LabRoot[]; usedCellRoots: ReadonlySet<LabRoot>; mixtureCandidateRoots: ReadonlySet<LabRoot>; eligible: (root: LabRoot) => readonly T[]; count: number
}): T[] => {
  const selected: T[] = []
  for (const root of [...input.cellResultRoots].sort()) {
    if (selected.length === input.count) break
    if (input.usedCellRoots.has(root)) continue
    const row = input.eligible(root).filter((entry) => input.mixtureCandidateRoots.has(entry.observation.targetCandidateRoot)).sort((a, b) => observationKey(a.observation).localeCompare(observationKey(b.observation)))[0]
    if (row) selected.push(row)
  }
  return selected
}

/** Exactly the saved effect results advance MATCH_KERNEL; no provider or Strategy capability. */
const observationsFromCell = (cellResultRoot: LabRoot, roundRoot: LabRoot, targets: readonly Target[], readCell: TacticalCellReader): Rehydrated[] => {
  const node = readCell(cellResultRoot), value = node.value
  if (node.kind !== "cell-result" || value.terminal?.disposition !== "success" || !exact(value.options, [])) return fail("CELL")
  const execution = value.execution as LabMatchExecution, match = value.match as Parameters<typeof MATCH_KERNEL.createMachineV119>[0]
  if (execution.kind !== "completed" || execution.privacy !== "private_offline" || "maxPhases" in match || !Array.isArray(execution.accounting) || !Array.isArray(execution.transitions) || execution.transitions.length > 1010000 || !CANONICAL_ARENA_CATALOG_V1_37.arenas.some((arena) => arena.status === "active" && same(arena, match.arenaVariant))) return fail("CANONICAL_MATCH")
  if (!targets.some((target) => target.candidateRoot === value.bottomCandidateRoot || target.candidateRoot === value.topCandidateRoot)) return []
  let machine = MATCH_KERNEL.createMachineV119(match)
  if (machine.initialState.soldiers.length !== 16) return fail("CANONICAL_START")
  const matchRoot = labRoot("tactical-adaptation-match-v1", match), executionRoot = labRoot("league-execution-commitment-v2", deriveFactoryExecutionCommitment(execution))
  const targetPlayers = new Map<string, Target>()
  for (const target of targets) {
    if (value.bottomCandidateRoot === target.candidateRoot) targetPlayers.set(match.bottomPlayerId, target)
    else if (value.topCandidateRoot === target.candidateRoot) targetPlayers.set(match.topPlayerId, target)
  }
  const selections = new Map<string, { request: any; evidence: LabRuntimeEvidence; index: number; ids: string[] }>(), ordinals = new Map<string, number>(), consumed = new Set<LabRoot>(), rows: Rehydrated[] = []
  let invocation = 0, completed = false, eventIndex = 0
  for (let transition = 0; transition < 1010000; transition++) {
    let next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (next.kind === "effect") {
      const request = next.request, evidence = execution.accounting[invocation], index = invocation++, player = String(request.coordinates.actingPlayerId), expectedRevision = player === match.bottomPlayerId ? match.bottomStrategyRevisionId : player === match.topPlayerId ? match.topStrategyRevisionId : fail("PLAYER")
      if (!evidence || evidence.identity.revisionId !== expectedRevision || evidence.identity.tupleId !== machine.semanticTuple.tupleId || evidence.identity.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || evidence.identity.image !== LAB_ADMITTED_ROOTS.image || evidence.identity.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || evidence.requestId !== request.requestId || evidence.method !== request.kind || evidence.inputRoot !== labRoot("runtime-input", request.input) || evidence.ordinal !== (ordinals.get(player) ?? 0) || !evidence.charged || !evidence.completed || !Number.isSafeInteger(evidence.outputBytes) || evidence.outputBytes < 0 || evidence.outputBytes > 262144 || consumed.has(evidence.invocationRoot)) return fail("ACCOUNTING")
      consumed.add(evidence.invocationRoot); ordinals.set(player, evidence.ordinal + 1)
      const target = targetPlayers.get(player)
      if (target && request.kind === "selectActivations") {
        selections.delete(player)
        if (evidence.result.ok && request.input.activationCount > 0 && request.input.mySoldiers.some((soldier) => soldier.status === "ACTIVE")) {
          const result = StrategyResultSchema.safeParse(evidence.result.value)
          if (!result.success) return fail("SELECT_OUTPUT")
          selections.set(player, { request, evidence, index, ids: result.data.activationOrders.map((order) => order.soldierId) })
        }
      } else if (target && request.kind === "soldierBrain" && evidence.result.ok) {
        const selected = selections.get(player), result = SoldierBrainResultSchema.safeParse(evidence.result.value)
        if (!result.success) return fail("BRAIN_OUTPUT")
        if (selected && selected.ids.includes(request.input.self.id) && request.input.self.status === "ACTIVE") {
          const raw = result.data.action
          const action: Action = raw.type === "TURN_TO_STONE" ? { type: raw.type } : { type: raw.type, direction: raw.direction }
          const ownIds = machine.initialState.soldiers.filter((soldier) => soldier.ownerPlayerId === player).map((soldier) => soldier.id).sort(), normalized = ownIds.indexOf(request.input.self.id)
          if (normalized < 0) return fail("SELECTED_SOLDIER")
          rows.push({ observation: { cellResultRoot, matchRoot, executionRoot, roundRoot, targetCandidateRoot: target.candidateRoot, roles: target.roles, mixtureWeight: target.mixtureWeight, selectAccountingOrdinal: selected.index, invocationRoot: selected.evidence.invocationRoot, selectRequestRoot: labRoot("tactical-adaptation-request-v1", selected.request), selectInputRoot: selected.evidence.inputRoot, selectedSoldierId: `soldier-${normalized}`, brainAccountingOrdinal: index, soldierBrainRequestRoot: labRoot("tactical-adaptation-request-v1", request), soldierBrainInputRoot: evidence.inputRoot, soldierBrainInvocationRoot: evidence.invocationRoot, soldierBrainOutputRoot: labRoot("tactical-adaptation-output-v1", evidence.result), targetAction: action }, input: SoldierBrainInputV119Schema.parse(request.input) as unknown as SoldierBrainInputV119 })
        }
      }
      const base = { kind: "runtime_resume" as const, requestId: request.requestId, effectKind: request.kind }, result = evidence.result
      next = MATCH_KERNEL.stepMatch(next.machine, result.ok ? { ...base, classification: "success", value: result.value } : "systemFailure" in result ? { ...base, classification: "system_failure", failure: result.systemFailure } : { ...base, classification: "player_violation", violation: result.violation })
    }
    if (next.kind === "effect" || next.kind === "failure" || !same(next.record, execution.transitions[transition])) return fail("TRANSITION")
    for (const event of next.record.events) if (!same(event, execution.result.events[eventIndex++])) return fail("RESULT_EVENTS")
    machine = next.machine
    if (next.kind === "completed") { if (transition + 1 !== execution.transitions.length) return fail("TRAILING_TRANSITIONS"); completed = true; break }
  }
  if (!completed || invocation !== execution.accounting.length || eventIndex !== execution.result.events.length || !same(machine.state, execution.result.state)) return fail("COMPLETION")
  // Only the earliest canonical eligible observation for each target in a cell can be selected.
  return [...new Map(rows.sort((a, b) => brainKey(b.observation).localeCompare(brainKey(a.observation))).map((row) => [row.observation.targetCandidateRoot, row])).values()]
}

export const buildLeagueTacticalCorpus = (input: TacticalCorpusTarget & { cellResultRoots: readonly LabRoot[]; readCell: TacticalCellReader }): { corpus: TacticalAdaptationCorpus; inputs: SoldierBrainInputV119[] } => {
  if (input.cellResultRoots.length < 4 || new Set(input.cellResultRoots).size !== input.cellResultRoots.length) return fail("CELL_COVERAGE")
  const targets = consolidateTargets(input), ordered = [...input.cellResultRoots].sort(), cache = new Map<LabRoot, Rehydrated[]>()
  const eligible = (root: LabRoot) => { let rows = cache.get(root); if (!rows) { rows = observationsFromCell(root, input.roundRoot, targets, input.readCell).sort((a, b) => observationKey(a.observation).localeCompare(observationKey(b.observation))); cache.set(root, rows) }; return rows }
  const selected: Rehydrated[] = [], used = new Set<LabRoot>()
  const take = (row: Rehydrated | undefined) => { if (!row) return fail("OBSERVATION_COVERAGE"); selected.push(row); used.add(row.observation.cellResultRoot) }
  const earliest = (candidate: LabRoot) => { for (const root of ordered) if (!used.has(root)) { const row = eligible(root).find((row) => row.observation.targetCandidateRoot === candidate); if (row) return row }; return undefined }
  for (const candidate of [...new Set([input.strongestPureCandidateRoot, input.vulnerablePureCandidateRoot])].sort()) take(earliest(candidate))
  const mixture = new Set(targets.filter((row) => row.roles.includes("mixture")).map((row) => row.candidateRoot))
  for (const row of fillCanonicalTacticalMixture({ cellResultRoots: ordered, usedCellRoots: used, mixtureCandidateRoots: mixture, eligible, count: 4 - selected.length })) take(row)
  if (selected.length !== 4) return fail("OBSERVATION_COVERAGE")
  return { corpus: createTacticalAdaptationCorpus({ schemaVersion: "tactical-adaptation-corpus-v1", privacy: "private_offline", roundRoot: input.roundRoot, observations: selected.map((row) => row.observation) }), inputs: selected.map((row) => row.input) }
}

export const rehydrateLeagueTacticalCorpus = (value: unknown, readCell: TacticalCellReader): SoldierBrainInputV119[] => {
  const corpus = admitTacticalAdaptationCorpus(value)
  return corpus.observations.map((observation) => {
    const target = { candidateRoot: observation.targetCandidateRoot, roles: observation.roles, mixtureWeight: observation.mixtureWeight }
    const row = observationsFromCell(observation.cellResultRoot, corpus.roundRoot, [target], readCell).find((row) => same(row.observation, observation))
    return row?.input ?? fail("OBSERVATION_REHYDRATION")
  })
}

export const isProspectiveTacticalJob = (allocation: AdmittedLeagueExecutionAllocation, job: LeagueResponseJob): boolean => allocation.schemaVersion === "league-prospective-execution-allocation-v1" && job.evaluationRole === "development_response" && [0, 3, 6].includes(allocation.rounds.flatMap((round) => round.jobs).findIndex((row) => row.id === job.id))

/** Rederive target roles/order and every input from its frozen current matrix. */
export const readRetainedTacticalAuthoringContext = (repository: FactoryRepository, allocation: AdmittedLeagueExecutionAllocation, job: LeagueResponseJob, target: any) => {
  if (!isProspectiveTacticalJob(allocation, job) || !exact(target.tacticalAdaptation, ["allocationArtifactRoot", "matrixRecordRoot", "corpusArtifactRoot"]) || !Array.isArray(target.targets) || target.targets.length !== 1) return fail("AUTHORING_CONTEXT")
  const read = (root: LabRoot) => parse(readFactoryArtifact(repository, root))
  if (!same(read(target.tacticalAdaptation.allocationArtifactRoot), allocation)) return fail("ALLOCATION_BINDING")
  const league = createLeagueRepository(allocation.outputDirectories.league), readCell: TacticalCellReader = (root) => readTacticalLeagueRecord(league, root, allocation.operations)
  const matrix = readCell(target.tacticalAdaptation.matrixRecordRoot), value = matrix.value, ordinal = allocation.rounds.findIndex((round) => round.jobs.some((row) => row.id === job.id)), seed = allocation.seedBlocks[0]!
  if (matrix.kind !== "complete-matrix" || value.schemaVersion !== "league-retained-matrix-v2" || !Array.isArray(value.matrix.cells) || target.targets[0].seed !== seed || !same(target.targets[0].weights, value.solver.weights)) return fail("MATRIX_BINDING")
  const round = declareLeagueRound({ snapshot: value.snapshot, solver: value.solver, responseAllocationRoot: labRoot("league-round-allocation-v1", { allocationRoot: allocation.root, ordinal, seed }), roundOrdinal: ordinal, maximumRounds: allocation.rounds.length, closureRule: "bounded-no-accepted-counter-v1" })
  if (target.roundRoot !== round.round.root || target.candidateRoot !== round.target.strongestPureCandidateRoot || !same(target.targets[0].target, round.target)) return fail("ROUND_BINDING")
  const built = buildLeagueTacticalCorpus({ roundRoot: round.round.root, strongestPureCandidateRoot: round.target.strongestPureCandidateRoot, vulnerablePureCandidateRoot: round.target.vulnerablePureCandidateRoot, weights: value.solver.weights, cellResultRoots: value.matrix.cells, readCell })
  const retained = read(target.tacticalAdaptation.corpusArtifactRoot)
  if (!same(retained, built.corpus)) return fail("CORPUS_REDERIVATION")
  return built
}
