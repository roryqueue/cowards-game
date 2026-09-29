import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { admitFactory, authorizeFactorySupervision, type FactoryAdmission, type FactorySupervisionProvider } from "../factory/admission.js"
import { FactoryCandidateSchema, FactoryOraclePacketSchema, FactoryProposalSchema, FactoryValidationEvidenceSchema, type FactoryCandidate } from "../factory/contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "../factory/repository.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../runtime-bridge.js"
import { createLeagueCellTerminal, deriveLeagueResultEventRoot, projectCanonicalKernelOutcomeToEntrantHalfPoints, LeagueCellSchema, type LeagueCell, type LeagueCellTerminal } from "./contracts.js"
import { publishLeagueCellTerminal, recordLeagueCellStart, type LeagueCellStart, type LeagueRepository } from "./repository.js"
import { admitDiagnosticPilotAllocation, admitDiagnosticPilotCell, createDiagnosticPilotStart, diagnosticPilotContainerIdentity, requireDiagnosticPilotAssessedCandidate, requireDiagnosticPilotLifetimeGrant, verifyDiagnosticPilotLedger, type DiagnosticPilotAllocation, type DiagnosticPilotAssessedCandidate, type DiagnosticPilotCell, type DiagnosticPilotLedger, type DiagnosticPilotLifetimeGrant, type DiagnosticPilotStart } from "./diagnostic-pilot.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAGUE_CONNECTED_RUNNER_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const hash = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot
const parse = (bytes: Uint8Array): unknown => {
  const value = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!value.ok) return fail("CANONICAL_ARTIFACT")
  return value.value
}
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).sort().join(",") === [...keys].sort().join(",")

/**
 * Host-only composition point. The CLI owns this adapter and binds it to
 * `createFactorySupervisedRuntime`; callers supply a constructor, never a provider.
 */
export interface FactorySupervisedRuntimeHost {
  readonly createFactorySupervisedRuntime: (input: Readonly<{
    admission: FactoryAdmission
    sourceBytes: Uint8Array
    attemptRoot: LabRoot
    budgetRoot: LabRoot
    executableRoot: LabRoot
    pilotLifetimeGrant?: DiagnosticPilotLifetimeGrant
  }>) => FactorySupervisionProvider
}

export interface FactoryCandidateClosure {
  readonly factoryRepository: FactoryRepository
  readonly candidatePublicationArtifactRoot: LabRoot
  readonly sourceArtifactRoot: LabRoot
  readonly packetArtifactRoot: LabRoot
  readonly proposalArtifactRoot: LabRoot
  readonly validationArtifactRoot: LabRoot
}

export interface LeagueIssuedProvider {
  readonly candidateRoot: LabRoot
  readonly startRoot: LabRoot
  readonly allocationRoot: LabRoot
  readonly cellRoot: LabRoot
  readonly identity: FactorySupervisionProvider["identity"]
  readonly producerBuildRoot: LabRoot
}

const issuedProviders = new WeakSet<object>()
const privateProviders = new WeakMap<object, FactorySupervisionProvider>()
const issueBindings = new WeakMap<object, Readonly<{ admission: FactoryAdmission; candidate: FactoryCandidate }>>()
const pilotIssuedProviders = new WeakSet<object>()
const pilotIssueBindings = new WeakMap<object, Readonly<{ admission: FactoryAdmission; candidate: FactoryCandidate; seat: "bottom" | "top"; allocationRoot: LabRoot; cellRoot: LabRoot; startRoot: LabRoot; requestRoot: LabRoot }>>()
const consumedPilotIssuances = new Map<LabRoot, Set<"bottom" | "top">>()
const pilotHandleSymbol = Symbol("diagnostic-pilot-issued-provider")

export const readCandidateClosure = (closure: FactoryCandidateClosure): Readonly<{ candidate: FactoryCandidate; packet: ReturnType<typeof FactoryOraclePacketSchema.parse>; proposal: ReturnType<typeof FactoryProposalSchema.parse>; validation: ReturnType<typeof FactoryValidationEvidenceSchema.parse>; sourceBytes: Uint8Array }> => {
  if (![closure.candidatePublicationArtifactRoot, closure.sourceArtifactRoot, closure.packetArtifactRoot, closure.proposalArtifactRoot, closure.validationArtifactRoot].every(isRoot)) return fail("CLOSURE_ROOT")
  const descriptor = parse(readFactoryArtifact(closure.factoryRepository, closure.candidatePublicationArtifactRoot))
  if (!exact(descriptor, ["schemaVersion", "privacy", "root", "candidate", "independenceReceipt", "supervisionReceiptRoot", "independenceStatus"])) return fail("PUBLICATION_DESCRIPTOR")
  const value = descriptor as Record<string, unknown>
  if (value.schemaVersion !== "factory-candidate-publication-v1" || value.privacy !== "private_offline" || !isRoot(value.root) || !isRoot(value.supervisionReceiptRoot) || value.independenceStatus !== "unresolved") return fail("PUBLICATION_DESCRIPTOR")
  const { root: descriptorRoot, ...descriptorValue } = value
  if (descriptorRoot !== labRoot("factory-candidate-publication-v1", descriptorValue)) return fail("PUBLICATION_ROOT")
  const candidate = FactoryCandidateSchema.parse(value.candidate)
  if (candidate.supervisionReceiptRoot !== value.supervisionReceiptRoot) return fail("PUBLICATION_CANDIDATE")
  const packet = FactoryOraclePacketSchema.parse(parse(readFactoryArtifact(closure.factoryRepository, closure.packetArtifactRoot)))
  const proposal = FactoryProposalSchema.parse(parse(readFactoryArtifact(closure.factoryRepository, closure.proposalArtifactRoot)))
  const validation = FactoryValidationEvidenceSchema.parse(parse(readFactoryArtifact(closure.factoryRepository, closure.validationArtifactRoot)))
  const sourceBytes = readFactoryArtifact(closure.factoryRepository, closure.sourceArtifactRoot)
  if (hash(sourceBytes) !== candidate.proposal.source.root || closure.sourceArtifactRoot !== candidate.proposal.source.root ||
      candidate.proposal.root !== proposal.root || candidate.validation.root !== validation.root ||
      proposal.packetRoot !== packet.root || validation.proposalRoot !== proposal.root ||
      candidate.proposal.source.root !== packet.source.root || candidate.proposal.source.byteLength !== sourceBytes.byteLength ||
      candidate.proposal.build.compatibilityTupleRoot !== packet.build.compatibilityTupleRoot) return fail("SOURCE_CLOSURE")
  // A non-empty Uint8Array cannot be recursively frozen; it is copied again at the host boundary.
  return Object.freeze({ candidate, packet, proposal, validation, sourceBytes: new Uint8Array(sourceBytes) }) as Readonly<{ candidate: FactoryCandidate; packet: ReturnType<typeof FactoryOraclePacketSchema.parse>; proposal: ReturnType<typeof FactoryProposalSchema.parse>; validation: ReturnType<typeof FactoryValidationEvidenceSchema.parse>; sourceBytes: Uint8Array }>
}

/** Re-admits persisted source data and records a nonserializable host-issued capability. */
export const issueLeagueProviderFromFactoryCandidate = (input: FactoryCandidateClosure & Readonly<{ host: FactorySupervisedRuntimeHost; cell: LeagueCell; start: LeagueCellStart; allocationRoot: LabRoot }>): Readonly<LeagueIssuedProvider> => {
  const cell = LeagueCellSchema.parse(input.cell)
  if (!isRoot(input.allocationRoot) || input.start.cellRoot !== cell.root || input.start.allocationRoot !== input.allocationRoot) return fail("START_BINDING")
  const closure = readCandidateClosure(input)
  if (cell.entrantCandidateRoot !== closure.candidate.root && cell.opponentCandidateRoot !== closure.candidate.root) return fail("CELL_CANDIDATE")
  if (cell.tupleRoot !== closure.candidate.proposal.build.compatibilityTupleRoot || cell.runtimeRoot !== closure.candidate.proposal.nativeLane.runtimeProfileRoot) return fail("CELL_RUNTIME")
  const sourceAdmission = admitFactory({ packet: closure.packet, proposal: closure.proposal, sourceBytes: closure.sourceBytes, repository: input.factoryRepository })
  const admission = authorizeFactorySupervision({ sourceAdmission, validation: closure.validation, repository: input.factoryRepository })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: new TextDecoder("utf-8", { fatal: true }).decode(closure.sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== admission.sourceRoot.slice(7)) return fail("EXECUTABLE_BUILD")
  const executableRoot = `sha256:${revision.metadata.sourceArtifact.hash}` as LabRoot
  const provider = input.host.createFactorySupervisedRuntime({ admission, sourceBytes: new Uint8Array(closure.sourceBytes), attemptRoot: input.start.root, budgetRoot: input.allocationRoot, executableRoot })
  const identity = provider?.identity
  if (!identity || identity.revisionId !== revision.id || identity.sourceRoot !== admission.sourceRoot || identity.factoryPacketRoot !== admission.packetRoot || identity.factoryProposalRoot !== admission.proposalRoot || identity.factoryValidationRoot !== admission.validationRoot || identity.runtimeLimitsRoot !== cell.runtimeRoot || identity.tupleRoot !== cell.tupleRoot || identity.attemptRoot !== input.start.root || identity.budgetRoot !== input.allocationRoot || identity.executableRoot !== executableRoot) { provider?.close(); return fail("PROVIDER_IDENTITY") }
  const issued = freezeLabValue({ candidateRoot: closure.candidate.root, startRoot: input.start.root, allocationRoot: input.allocationRoot, cellRoot: cell.root, producerBuildRoot: closure.candidate.proposal.build.buildRoot, identity: structuredClone(identity) }) as LeagueIssuedProvider
  issuedProviders.add(issued); privateProviders.set(issued, provider); issueBindings.set(issued, freezeLabValue({ admission, candidate: closure.candidate }))
  return issued
}

export interface DiagnosticPilotIssuedProvider {
  readonly candidateRoot: LabRoot
  readonly startRoot: LabRoot
  readonly allocationRoot: LabRoot
  readonly cellRoot: LabRoot
  readonly requestRoot: LabRoot
  readonly seat: "bottom" | "top"
  readonly identity: FactorySupervisionProvider["identity"]
  readonly producerBuildRoot: LabRoot
  readonly [pilotHandleSymbol]: true
  toJSON(): never
}

/** Pilot-specific issuance. A caller cannot substitute a legacy LeagueCell or
 * LeagueCellStart, and a durable pilot charge is reopened before the host sees
 * source bytes or creates either provider. */
export const issueDiagnosticPilotProviderFromFactoryCandidate = (input: Readonly<{
  host: FactorySupervisedRuntimeHost
  factoryRepository: FactoryRepository
  ledger: Pick<DiagnosticPilotLedger, "readStart" | "readTerminal">
  allocation: DiagnosticPilotAllocation
  cell: DiagnosticPilotCell
  start: DiagnosticPilotStart
  requestRoot: LabRoot
  assessed: DiagnosticPilotAssessedCandidate
  pilotLifetimeGrant: DiagnosticPilotLifetimeGrant
}>): Readonly<DiagnosticPilotIssuedProvider> => {
  const allocation = admitDiagnosticPilotAllocation(input.allocation)
  const cell = admitDiagnosticPilotCell(allocation, input.cell)
  const start = verifyDiagnosticPilotLedger(input.ledger, allocation, cell, input.start)
  if (input.requestRoot !== cell.requestRoot || start.root !== createDiagnosticPilotStart(allocation, cell).root) return fail("PILOT_REQUEST_BINDING")
  const assessed = requireDiagnosticPilotAssessedCandidate(input.assessed, input.factoryRepository)
  const pin = allocation.candidateRoots.includes(assessed.candidate.root) && allocation.candidateAdmissionRoots.includes(assessed.admission.root)
  const seat = cell.bottomCandidateRoot === assessed.candidate.root ? "bottom" : cell.topCandidateRoot === assessed.candidate.root ? "top" : null
  if (!pin || !seat || assessed.admission.candidate.root !== assessed.candidate.root || assessed.admission.tupleRoot !== cell.tupleRoot || assessed.admission.runtimeRoot !== cell.runtimeRoot || assessed.candidate.proposal.build.compatibilityTupleRoot !== cell.tupleRoot || assessed.candidate.proposal.nativeLane.runtimeProfileRoot !== cell.runtimeRoot) return fail("PILOT_CANDIDATE_BINDING")
  const container = diagnosticPilotContainerIdentity(allocation, cell, seat)
  requireDiagnosticPilotLifetimeGrant(input.pilotLifetimeGrant, { allocationRoot: allocation.root, cellRoot: cell.root, startRoot: start.root, seat, containerName: container.containerName, ownershipLabel: container.ownershipLabel, lifetimeMilliseconds: 240_000 })
  const closure = readCandidateClosure(assessed.closure)
  if (closure.candidate.root !== assessed.candidate.root || closure.candidate.supervisionReceiptRoot !== assessed.candidate.supervisionReceiptRoot) return fail("PILOT_CLOSURE_BINDING")
  const sourceAdmission = admitFactory({ packet: closure.packet, proposal: closure.proposal, sourceBytes: closure.sourceBytes, repository: input.factoryRepository })
  const admission = authorizeFactorySupervision({ sourceAdmission, validation: closure.validation, repository: input.factoryRepository })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: new TextDecoder("utf-8", { fatal: true }).decode(closure.sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== admission.sourceRoot.slice(7)) return fail("PILOT_EXECUTABLE_BUILD")
  const executableRoot = `sha256:${revision.metadata.sourceArtifact.hash}` as LabRoot
  // Burn the single seat issuance before the opaque host boundary. A failed or
  // uncertain create cannot be retried under the same durable charge.
  const consumed = consumedPilotIssuances.get(start.root) ?? new Set<"bottom" | "top">()
  if (consumed.has(seat)) return fail("PILOT_SEAT_ALREADY_ISSUED")
  consumed.add(seat); consumedPilotIssuances.set(start.root, consumed)
  const provider = input.host.createFactorySupervisedRuntime({ admission, sourceBytes: new Uint8Array(closure.sourceBytes), attemptRoot: start.root, budgetRoot: allocation.root, executableRoot, pilotLifetimeGrant: input.pilotLifetimeGrant })
  const identity = provider?.identity
  if (!identity || identity.revisionId !== revision.id || identity.sourceRoot !== admission.sourceRoot || identity.factoryPacketRoot !== admission.packetRoot || identity.factoryProposalRoot !== admission.proposalRoot || identity.factoryValidationRoot !== admission.validationRoot || identity.runtimeLimitsRoot !== cell.runtimeRoot || identity.tupleRoot !== cell.tupleRoot || identity.attemptRoot !== start.root || identity.budgetRoot !== allocation.root || identity.executableRoot !== executableRoot) { provider?.close(); return fail("PILOT_PROVIDER_IDENTITY") }
  const handle = Object.freeze({ candidateRoot: closure.candidate.root, startRoot: start.root, allocationRoot: allocation.root, cellRoot: cell.root, requestRoot: cell.requestRoot, seat, producerBuildRoot: closure.candidate.proposal.build.buildRoot, identity: freezeLabValue(structuredClone(identity)), [pilotHandleSymbol]: true as const, toJSON(): never { return fail("PILOT_HANDLE_NON_SERIALIZABLE") } }) as DiagnosticPilotIssuedProvider
  pilotIssuedProviders.add(handle); privateProviders.set(handle, provider); pilotIssueBindings.set(handle, Object.freeze({ admission, candidate: closure.candidate, seat, allocationRoot: allocation.root, cellRoot: cell.root, startRoot: start.root, requestRoot: cell.requestRoot }))
  return handle
}

const requirePilotIssued = (value: DiagnosticPilotIssuedProvider, allocation: DiagnosticPilotAllocation, cell: DiagnosticPilotCell, start: DiagnosticPilotStart, seat: "bottom" | "top"): FactorySupervisionProvider => {
  if (!value || !pilotIssuedProviders.has(value) || value[pilotHandleSymbol] !== true || value.seat !== seat || value.allocationRoot !== allocation.root || value.cellRoot !== cell.root || value.startRoot !== start.root || value.requestRoot !== cell.requestRoot || value.candidateRoot !== (seat === "bottom" ? cell.bottomCandidateRoot : cell.topCandidateRoot)) return fail("PILOT_UNISSUED_PROVIDER")
  const provider = privateProviders.get(value), binding = pilotIssueBindings.get(value)
  if (!provider || !binding || binding.seat !== seat || binding.allocationRoot !== allocation.root || binding.cellRoot !== cell.root || binding.startRoot !== start.root || binding.requestRoot !== cell.requestRoot || binding.candidate.root !== value.candidateRoot || labRoot("diagnostic-pilot-provider-identity-v1", provider.identity) !== labRoot("diagnostic-pilot-provider-identity-v1", value.identity)) return fail("PILOT_ISSUED_BINDING")
  return provider
}

/** Issuance can fail before canonical Match entry; only this module can unwrap
 * and close an already issued pilot provider. Never expose the real provider. */
export const closeDiagnosticPilotIssuedProvider = (value: DiagnosticPilotIssuedProvider): boolean => {
  if (!value || !pilotIssuedProviders.has(value)) return fail("PILOT_UNISSUED_PROVIDER")
  const provider = privateProviders.get(value)
  if (!provider) return fail("PILOT_MISSING_PROVIDER")
  const closed = provider.close()
  return closed.cleanupComplete && !closed.orphanedChild
}

/** Private canonical bridge only. No legacy journal, payoff, meta-solver or
 * public projection is written here; the pilot ledger is owned by the caller. */
export const runDiagnosticPilotCell = async (input: Readonly<{
  ledger: Pick<DiagnosticPilotLedger, "readStart" | "readTerminal">
  allocation: DiagnosticPilotAllocation
  cell: DiagnosticPilotCell
  start: DiagnosticPilotStart
  requestRoot: LabRoot
  bottom: DiagnosticPilotIssuedProvider
  top: DiagnosticPilotIssuedProvider
  match: Parameters<typeof runCanonicalLabMatch>[0]["match"]
  beforeReturn?: (execution: LabMatchExecution) => void
}>): Promise<Readonly<{ disposition: "success" | "system_failure" | "player_violation"; processValidity: "process_valid" | "process_invalid"; evidenceRoot: LabRoot; transitionCount: number; accountingCount: number; cleanupComplete: boolean }>> => {
  const allocation = admitDiagnosticPilotAllocation(input.allocation), cell = admitDiagnosticPilotCell(allocation, input.cell)
  const start = verifyDiagnosticPilotLedger(input.ledger, allocation, cell, input.start)
  if (input.requestRoot !== cell.requestRoot || input.bottom === input.top) return fail("PILOT_MATCH_REQUEST")
  const bottom = requirePilotIssued(input.bottom, allocation, cell, start, "bottom"), top = requirePilotIssued(input.top, allocation, cell, start, "top")
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")
  if (!smoke || input.match.seed !== allocation.seed || labRoot("diagnostic-pilot-arena-v1", input.match.arenaVariant) !== labRoot("diagnostic-pilot-arena-v1", smoke) || input.match.bottomPlayerId === input.match.topPlayerId || input.match.bottomPlayerId !== `league-${cell.bottomCandidateRoot.slice(7)}` || input.match.topPlayerId !== `league-${cell.topCandidateRoot.slice(7)}` || input.match.initialInitiativePlayerId !== `league-${cell.initialInitiativeCandidateRoot.slice(7)}` || input.match.bottomStrategyRevisionId !== bottom.identity.revisionId || input.match.topStrategyRevisionId !== top.identity.revisionId) return fail("PILOT_MATCH_BINDING")
  const execution = await runCanonicalLabMatch({ match: input.match, providers: { [input.match.bottomPlayerId]: bottom, [input.match.topPlayerId]: top } })
  const disposition = execution.kind === "failure" || execution.accounting.some((entry) => !entry.result.ok && "systemFailure" in entry.result) ? "system_failure" as const : execution.accounting.some((entry) => !entry.result.ok) ? "player_violation" as const : "success" as const
  const evidenceRoot = labRoot("diagnostic-pilot-execution-v1", { startRoot: start.root, cellRoot: cell.root, disposition, kind: execution.kind, transitionCount: execution.transitions.length, accountingCount: execution.accounting.length })
  input.beforeReturn?.(execution)
  return Object.freeze({ disposition, processValidity: disposition === "success" ? "process_valid" as const : "process_invalid" as const, evidenceRoot, transitionCount: execution.transitions.length, accountingCount: execution.accounting.length, cleanupComplete: execution.kind !== "failure" || execution.failure.code !== "LAB_CLEANUP_INCOMPLETE" })
}

const requireIssued = (value: LeagueIssuedProvider, cell: LeagueCell, start: LeagueCellStart): FactorySupervisionProvider => {
  if (!issuedProviders.has(value) || value.cellRoot !== cell.root || value.startRoot !== start.root || value.allocationRoot !== start.allocationRoot) return fail("UNISSUED_PROVIDER")
  const provider = privateProviders.get(value), binding = issueBindings.get(value)
  if (!provider || !binding || provider.identity.sourceRoot !== value.identity.sourceRoot || binding.candidate.root !== value.candidateRoot) return fail("ISSUED_PROVIDER_BINDING")
  return provider
}
const failureTerminal = (cell: LeagueCell, start: LeagueCellStart, code: string): LeagueCellTerminal => createLeagueCellTerminal({ cellRoot: cell.root, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: labRoot("league-cell-failure-v1", { startRoot: start.root, cellRoot: cell.root, code }), projection: null })
/** Shared data-only reduction for live publication and authenticated reopening. */
export const deriveLeagueMatchExecutionTerminal = (execution: LabMatchExecution, cell: LeagueCell, start: LeagueCellStart, bottom: Pick<LeagueIssuedProvider, "candidateRoot">, top: Pick<LeagueIssuedProvider, "candidateRoot">, match: { bottomPlayerId: string; topPlayerId: string }): LeagueCellTerminal => {
  const evidenceRoot = labRoot("league-cell-execution-v1", { startRoot: start.root, cellRoot: cell.root, bottomCandidateRoot: bottom.candidateRoot, topCandidateRoot: top.candidateRoot, executionKind: execution.kind, transitionCount: execution.transitions.length, accountingCount: execution.accounting.length })
  if (execution.kind === "failure" || execution.accounting.some((entry) => !entry.result.ok && "systemFailure" in entry.result)) return createLeagueCellTerminal({ cellRoot: cell.root, disposition: "system_failure", processValidity: "process_invalid", evidenceRoot, projection: null })
  if (execution.accounting.some((entry) => !entry.result.ok)) return createLeagueCellTerminal({ cellRoot: cell.root, disposition: "player_violation", processValidity: "process_invalid", evidenceRoot, projection: null })
  const resultEventRoot = deriveLeagueResultEventRoot(execution.result.events)
  const projection = projectCanonicalKernelOutcomeToEntrantHalfPoints({ execution, entrantCandidateRoot: cell.entrantCandidateRoot, bottomCandidateRoot: bottom.candidateRoot, topCandidateRoot: top.candidateRoot, bottomPlayerId: match.bottomPlayerId, topPlayerId: match.topPlayerId, cellRoot: cell.root, conditionRoot: cell.conditionRoot, semanticGeometryHash: cell.semanticGeometryHash, resultEventRoot })
  return createLeagueCellTerminal({ cellRoot: cell.root, disposition: "success", processValidity: "process_valid", evidenceRoot, projection })
}

/** Charges first, runs only the canonical bridge, and never turns runtime failure into payoff. */
export const runLeagueCell = async (input: Readonly<{ repository: LeagueRepository; start: LeagueCellStart; cell: LeagueCell; bottom: LeagueIssuedProvider; top: LeagueIssuedProvider; requestRoot: LabRoot; match: Parameters<typeof runCanonicalLabMatch>[0]["match"]; runCanonicalLabMatch?: typeof runCanonicalLabMatch; beforeTerminal?: (execution: LabMatchExecution, terminal: LeagueCellTerminal) => void }>): Promise<Readonly<LeagueCellTerminal>> => {
  recordLeagueCellStart(input.repository, input.start)
  const cell = LeagueCellSchema.parse(input.cell)
  let terminal: LeagueCellTerminal
  let execution: LabMatchExecution | null = null, derived = false
  try {
    if (!isRoot(input.requestRoot) || input.requestRoot !== cell.requestRoot) return fail("REQUEST_BINDING")
    const bottom = requireIssued(input.bottom, cell, input.start), top = requireIssued(input.top, cell, input.start)
    if (input.bottom.candidateRoot === input.top.candidateRoot || input.match.bottomPlayerId === input.match.topPlayerId || input.match.bottomStrategyRevisionId !== input.bottom.identity.revisionId || input.match.topStrategyRevisionId !== input.top.identity.revisionId) return fail("MATCH_BINDING")
    const run = input.runCanonicalLabMatch ?? runCanonicalLabMatch
    execution = await run({ match: input.match, providers: { [input.match.bottomPlayerId]: bottom, [input.match.topPlayerId]: top } })
    terminal = deriveLeagueMatchExecutionTerminal(execution, cell, input.start, input.bottom, input.top, input.match)
    derived = true
  } catch (error) {
    // The connected caller owns an anchored issuance-failure graph record and
    // terminal when execution or terminal derivation itself fails.
    if (input.beforeTerminal) throw error
    terminal = failureTerminal(cell, input.start, error instanceof Error ? error.name : "UNKNOWN")
  }
  // The connected retention callback is deliberately outside the catch: a
  // failed graph publication must not leave an immutable success terminal.
  if (derived && execution) input.beforeTerminal?.(execution, terminal)
  publishLeagueCellTerminal(input.repository, input.start, terminal)
  return terminal
}
