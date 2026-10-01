import { CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { MATCH_KERNEL } from "@cowards/engine"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { admitFactory, authorizeFactorySupervision, type FactoryAdmission, type FactorySupervisionProvider } from "../factory/admission.js"
import type { FactoryRepository } from "../factory/repository.js"
import type { FactoryCandidate } from "../factory/contracts.js"
import { readCandidateClosure } from "./connected-runner.js"
import { requireDiagnosticPilotAssessedCandidate, type DiagnosticPilotAssessedCandidate } from "./diagnostic-pilot.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../runtime-bridge.js"
import { admitDiagnosticRetryV4Allocation, admitDiagnosticRetryV4Cell, createDiagnosticRetryV4Start, diagnosticRetryV4ContainerIdentity, runAndRetainCanonicalDiagnosticRetryV4, verifyDiagnosticRetryV4Ledger, type DiagnosticRetryV4Allocation, type DiagnosticRetryV4Cell, type DiagnosticRetryV4Ledger, type DiagnosticRetryV4LifetimeGrant, type DiagnosticRetryV4Start, type DiagnosticRetryV4RunPermit, type DiagnosticRetryV4RuntimeBinding, type DiagnosticRetryV4GrantBinding } from "./diagnostic-retry-v4.js"
const fail = (code: string): never => { throw new TypeError(`DIAGNOSTIC_RETRY_V4_${code}`) }
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === [...keys].sort().join(",")
export interface DiagnosticRetryV4RuntimeHost {
  readonly createFactorySupervisedRuntime: (input: Readonly<{ admission: FactoryAdmission; sourceBytes: Uint8Array; attemptRoot: LabRoot; budgetRoot: LabRoot; executableRoot: LabRoot; retryV4LifetimeGrant: DiagnosticRetryV4LifetimeGrant }>) => FactorySupervisionProvider
}
const retryV4IssuedProviders = new WeakSet<object>()
const privateProviders = new WeakMap<object, FactorySupervisionProvider>()
const retryV4IssueBindings = new WeakMap<object, Readonly<{ admission: FactoryAdmission; candidate: FactoryCandidate; seat: "bottom" | "top"; allocationRoot: LabRoot; cellRoot: LabRoot; startRoot: LabRoot; requestRoot: LabRoot }>>()
const consumedRetryV4Issuances = new Map<LabRoot, Set<"bottom" | "top">>()
const retryV4HandleSymbol = Symbol("diagnostic-retry-v4-issued-provider")
const lifetimeGrants = new WeakMap<object, {
  ledger: DiagnosticRetryV4Ledger; allocation: DiagnosticRetryV4Allocation; cell: DiagnosticRetryV4Cell; start: DiagnosticRetryV4Start;
  active: boolean; factoryClaimed: boolean; plannerClaimed: boolean;
}>()
export const requireDiagnosticRetryV4LifetimeGrant = (value: unknown, binding: DiagnosticRetryV4GrantBinding): DiagnosticRetryV4LifetimeGrant => {
  if (!value || typeof value !== "object" || !lifetimeGrants.has(value)) return fail("GRANT_UNISSUED")
  const issuance = lifetimeGrants.get(value)!
  if (!issuance.active) return fail("GRANT_INACTIVE")
  verifyDiagnosticRetryV4Ledger(issuance.ledger, issuance.allocation, issuance.cell, issuance.start)
  const grant = value as DiagnosticRetryV4LifetimeGrant
  if (grant.schemaVersion !== "diagnostic-retry-lifetime-grant-v4" || grant.allocationRoot !== binding.allocationRoot || grant.cellRoot !== binding.cellRoot || grant.startRoot !== binding.startRoot || grant.seat !== binding.seat || grant.containerName !== binding.containerName || grant.ownershipLabel !== binding.ownershipLabel || !Number.isSafeInteger(binding.lifetimeMilliseconds) || binding.lifetimeMilliseconds < 1 || binding.lifetimeMilliseconds > 240_000 || labRoot("diagnostic-retry-grant-runtime-v4", grant.runtime) !== labRoot("diagnostic-retry-grant-runtime-v4", binding.runtime)) return fail("GRANT_BINDING")
  return grant
}
export const claimDiagnosticRetryV4LifetimeGrant = (value: unknown, binding: DiagnosticRetryV4GrantBinding, layer: "factory" | "planner"): DiagnosticRetryV4LifetimeGrant => {
  const grant = requireDiagnosticRetryV4LifetimeGrant(value, binding), issuance = lifetimeGrants.get(grant)!
  if (layer === "factory") {
    if (issuance.factoryClaimed || issuance.plannerClaimed) return fail("GRANT_FACTORY_REUSED")
    issuance.factoryClaimed = true
  } else if (layer === "planner") {
    if (!issuance.factoryClaimed || issuance.plannerClaimed) return fail("GRANT_PLANNER_REUSED")
    issuance.plannerClaimed = true
  } else return fail("GRANT_LAYER")
  return grant
}
/** Only the assessed candidate issuer can mint; this object expires when its
 * one synchronous factory→planner construction returns or throws. */
const constructGrantedProvider = (input: {
  ledger: DiagnosticRetryV4Ledger; allocation: DiagnosticRetryV4Allocation; cell: DiagnosticRetryV4Cell; start: DiagnosticRetryV4Start;
  seat: "bottom" | "top"; runtime: DiagnosticRetryV4RuntimeBinding;
  construct: (grant: DiagnosticRetryV4LifetimeGrant) => FactorySupervisionProvider;
}): FactorySupervisionProvider => {
  const owner = diagnosticRetryV4ContainerIdentity(input.allocation, input.cell, input.seat)
  const grant: DiagnosticRetryV4LifetimeGrant = Object.freeze({
    schemaVersion: "diagnostic-retry-lifetime-grant-v4", allocationRoot: input.allocation.root, cellRoot: input.cell.root, startRoot: input.start.root,
    seat: input.seat, ...owner, ceilingMilliseconds: 240_000, runtime: freezeLabValue(structuredClone(input.runtime)),
    toJSON(): never { return fail("GRANT_NON_SERIALIZABLE") },
  })
  const issuance = { ledger: input.ledger, allocation: input.allocation, cell: input.cell, start: input.start, active: true, factoryClaimed: false, plannerClaimed: false }
  lifetimeGrants.set(grant, issuance)
  let provider: FactorySupervisionProvider | undefined
  try {
    provider = input.construct(grant)
    if (!issuance.factoryClaimed || !issuance.plannerClaimed) return fail("GRANT_CONSTRUCTION_UNCLAIMED")
    return provider
  } catch (error) { provider?.close(); throw error }
  finally { issuance.active = false }
}
export interface DiagnosticRetryV4IssuedProvider {
  readonly candidateRoot: LabRoot
  readonly startRoot: LabRoot
  readonly allocationRoot: LabRoot
  readonly cellRoot: LabRoot
  readonly requestRoot: LabRoot
  readonly seat: "bottom" | "top"
  readonly identity: FactorySupervisionProvider["identity"]
  readonly producerBuildRoot: LabRoot
  readonly [retryV4HandleSymbol]: true
  toJSON(): never
}
/** Distinct v4 issuance; no consumed pilot or v3 handle is accepted. */
export const issueDiagnosticRetryV4ProviderFromFactoryCandidate = (input: Readonly<{
  host: DiagnosticRetryV4RuntimeHost
  factoryRepository: FactoryRepository
  ledger: DiagnosticRetryV4Ledger
  allocation: DiagnosticRetryV4Allocation
  cell: DiagnosticRetryV4Cell
  start: DiagnosticRetryV4Start
  requestRoot: LabRoot
  assessed: DiagnosticPilotAssessedCandidate
}>): Readonly<DiagnosticRetryV4IssuedProvider> => {
  const allocation = admitDiagnosticRetryV4Allocation(input.allocation), cell = admitDiagnosticRetryV4Cell(allocation, input.cell)
  const start = verifyDiagnosticRetryV4Ledger(input.ledger, allocation, cell, input.start)
  if (input.requestRoot !== cell.requestRoot || start.root !== createDiagnosticRetryV4Start(allocation, cell).root) return fail("RETRY_V4_REQUEST_BINDING")
  const assessed = requireDiagnosticPilotAssessedCandidate(input.assessed, input.factoryRepository)
  const pin = allocation.candidateRoots.includes(assessed.candidate.root) && allocation.candidateAdmissionRoots.includes(assessed.admission.root)
  const seat = cell.bottomCandidateRoot === assessed.candidate.root ? "bottom" : cell.topCandidateRoot === assessed.candidate.root ? "top" : null
  if (!pin || !seat || assessed.admission.candidate.root !== assessed.candidate.root || assessed.admission.tupleRoot !== cell.tupleRoot || assessed.admission.runtimeRoot !== cell.runtimeRoot || assessed.candidate.proposal.build.compatibilityTupleRoot !== cell.tupleRoot || assessed.candidate.proposal.nativeLane.runtimeProfileRoot !== cell.runtimeRoot) return fail("RETRY_V4_CANDIDATE_BINDING")
  const closure = readCandidateClosure(assessed.closure)
  if (closure.candidate.root !== assessed.candidate.root || closure.candidate.supervisionReceiptRoot !== assessed.candidate.supervisionReceiptRoot) return fail("RETRY_V4_CLOSURE_BINDING")
  const sourceAdmission = admitFactory({ packet: closure.packet, proposal: closure.proposal, sourceBytes: closure.sourceBytes, })
  const admission = authorizeFactorySupervision({ sourceAdmission, validation: closure.validation })
  const defaults = defaultRuntimeMetadata("typescript")
  const revision = buildStrategyRevision({ source: new TextDecoder("utf-8", { fatal: true }).decode(closure.sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
  if (!revision.validation.valid || !revision.metadata.sourceArtifact || revision.sourceHash !== admission.sourceRoot.slice(7)) return fail("RETRY_V4_EXECUTABLE_BUILD")
  const executableRoot = `sha256:${revision.metadata.sourceArtifact.hash}` as LabRoot
  const consumed = consumedRetryV4Issuances.get(start.root) ?? new Set<"bottom" | "top">()
  if (consumed.has(seat)) return fail("RETRY_V4_SEAT_ALREADY_ISSUED")
  consumed.add(seat); consumedRetryV4Issuances.set(start.root, consumed)
  const runtime: DiagnosticRetryV4RuntimeBinding = { candidateRoot: assessed.candidate.root, admissionRoot: assessed.admission.root, factoryAuthorizationRoot: admission.authorizationRoot,
    factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
    sourceRoot: admission.sourceRoot, revisionId: revision.id, executableRoot, tupleId: MATCH_KERNEL.tupleId, tupleRoot: cell.tupleRoot,
    runtimeLimitsRoot: cell.runtimeRoot, image: allocation.image }
  const provider = constructGrantedProvider({ ledger: input.ledger, allocation, cell, start, seat, runtime,
    construct: (retryV4LifetimeGrant) => input.host.createFactorySupervisedRuntime({ admission, sourceBytes: new Uint8Array(closure.sourceBytes), attemptRoot: start.root, budgetRoot: allocation.root, executableRoot, retryV4LifetimeGrant }),
  })
  const identity = provider?.identity
  if (!identity || identity.revisionId !== revision.id || identity.sourceRoot !== admission.sourceRoot || identity.factoryPacketRoot !== admission.packetRoot || identity.factoryProposalRoot !== admission.proposalRoot || identity.factoryValidationRoot !== admission.validationRoot || identity.runtimeLimitsRoot !== cell.runtimeRoot || identity.tupleRoot !== cell.tupleRoot || identity.tupleId !== MATCH_KERNEL.tupleId || identity.image !== allocation.image || identity.attemptRoot !== start.root || identity.budgetRoot !== allocation.root || identity.executableRoot !== executableRoot) { provider?.close(); return fail("RETRY_V4_PROVIDER_IDENTITY") }
  const handle = Object.freeze({ candidateRoot: closure.candidate.root, startRoot: start.root, allocationRoot: allocation.root, cellRoot: cell.root, requestRoot: cell.requestRoot, seat, producerBuildRoot: closure.candidate.proposal.build.buildRoot, identity: freezeLabValue(structuredClone(identity)), [retryV4HandleSymbol]: true as const, toJSON(): never { return fail("RETRY_V4_HANDLE_NON_SERIALIZABLE") } }) as DiagnosticRetryV4IssuedProvider
  retryV4IssuedProviders.add(handle); privateProviders.set(handle, provider); retryV4IssueBindings.set(handle, Object.freeze({ admission, candidate: closure.candidate, seat, allocationRoot: allocation.root, cellRoot: cell.root, startRoot: start.root, requestRoot: cell.requestRoot }))
  return handle
}
const requireRetryV4Issued = (value: DiagnosticRetryV4IssuedProvider, allocation: DiagnosticRetryV4Allocation, cell: DiagnosticRetryV4Cell, start: DiagnosticRetryV4Start, seat: "bottom" | "top"): FactorySupervisionProvider => {
  if (!value || !retryV4IssuedProviders.has(value) || value[retryV4HandleSymbol] !== true || value.seat !== seat || value.allocationRoot !== allocation.root || value.cellRoot !== cell.root || value.startRoot !== start.root || value.requestRoot !== cell.requestRoot || value.candidateRoot !== (seat === "bottom" ? cell.bottomCandidateRoot : cell.topCandidateRoot)) return fail("RETRY_V4_UNISSUED_PROVIDER")
  const provider = privateProviders.get(value), binding = retryV4IssueBindings.get(value)
  if (!provider || !binding || binding.seat !== seat || binding.allocationRoot !== allocation.root || binding.cellRoot !== cell.root || binding.startRoot !== start.root || binding.requestRoot !== cell.requestRoot || binding.candidate.root !== value.candidateRoot || labRoot("diagnostic-retry-provider-identity-v4", provider.identity) !== labRoot("diagnostic-retry-provider-identity-v4", value.identity)) return fail("RETRY_V4_ISSUED_BINDING")
  return provider
}
/** Rechecked by the evidence producer itself, so a direct call cannot supply
 * raw self-verifying providers or a different current-rules condition. */
const requireDiagnosticRetryV4OpaquePair = (input: { readonly allocation: DiagnosticRetryV4Allocation; readonly cell: DiagnosticRetryV4Cell; readonly start: DiagnosticRetryV4Start; readonly match: Parameters<typeof runCanonicalLabMatch>[0]["match"]; readonly bottom: DiagnosticRetryV4IssuedProvider; readonly top: DiagnosticRetryV4IssuedProvider }) => {
  const allocation = admitDiagnosticRetryV4Allocation(input.allocation), cell = admitDiagnosticRetryV4Cell(allocation, input.cell)
  const start = createDiagnosticRetryV4Start(allocation, cell)
  if (input.start.root !== start.root || input.bottom === input.top) return fail("RETRY_V4_MATCH_REQUEST")
  const bottom = requireRetryV4Issued(input.bottom, allocation, cell, start, "bottom"), top = requireRetryV4Issued(input.top, allocation, cell, start, "top")
  // The caller retains its input object and its kernel-entry callback runs
  // after this admission. Only a detached, deeply frozen snapshot may cross
  // that callback boundary into the canonical Match bridge.
  const match = freezeLabValue(structuredClone(input.match))
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === "arena:smoke:v1")
  if (!smoke || !exact(match, ["matchId", "seed", "arenaVariant", "bottomPlayerId", "topPlayerId", "initialInitiativePlayerId", "bottomStrategyRevisionId", "topStrategyRevisionId"]) || match.matchId !== `retry-v4-${cell.requestRoot.slice(7)}` || match.seed !== allocation.seed || labRoot("diagnostic-retry-arena-v4", match.arenaVariant) !== labRoot("diagnostic-retry-arena-v4", smoke) || match.bottomPlayerId === match.topPlayerId || match.bottomPlayerId !== `league-${cell.bottomCandidateRoot.slice(7)}` || match.topPlayerId !== `league-${cell.topCandidateRoot.slice(7)}` || match.initialInitiativePlayerId !== `league-${cell.initialInitiativeCandidateRoot.slice(7)}` || match.bottomStrategyRevisionId !== bottom.identity.revisionId || match.topStrategyRevisionId !== top.identity.revisionId) return fail("RETRY_V4_MATCH_BINDING")
  return Object.freeze({ bottom, top, match, matchRoot: labRoot("diagnostic-retry-admitted-match-v4", match) })
}
const retryV4BridgePermits = new WeakMap<object, { readonly bottom: FactorySupervisionProvider; readonly top: FactorySupervisionProvider; readonly match: Parameters<typeof runCanonicalLabMatch>[0]["match"]; readonly matchRoot: LabRoot; consumed: boolean }>()
export interface DiagnosticRetryV4BridgePermit { readonly schemaVersion: "diagnostic-retry-bridge-permit-v4"; toJSON(): never }
/** The bridge does not return unwrapped providers. This one-shot operation is
 * callable only with a token created inside runDiagnosticRetryV4Cell. */
export const runDiagnosticRetryV4CanonicalFromBridge = async (value: DiagnosticRetryV4BridgePermit): Promise<LabMatchExecution> => {
  const binding = value && retryV4BridgePermits.get(value)
  if (!binding || binding.consumed) return fail("RETRY_V4_BRIDGE_PERMIT")
  binding.consumed = true
  if (labRoot("diagnostic-retry-admitted-match-v4", binding.match) !== binding.matchRoot) return fail("RETRY_V4_BRIDGE_MATCH_DRIFT")
  return runCanonicalLabMatch({ match: binding.match, providers: { [binding.match.bottomPlayerId]: binding.bottom, [binding.match.topPlayerId]: binding.top } })
}
export const closeDiagnosticRetryV4IssuedProvider = (value: DiagnosticRetryV4IssuedProvider): boolean => {
  if (!value || !retryV4IssuedProviders.has(value)) return fail("RETRY_V4_UNISSUED_PROVIDER")
  const provider = privateProviders.get(value)
  if (!provider) return fail("RETRY_V4_MISSING_PROVIDER")
  const closed = provider.close()
  return closed.cleanupComplete && !closed.orphanedChild
}
/** The only v4 Match bridge; it calls the unchanged canonical transition engine. */
export const runAuthorizedDiagnosticRetryV4 = async (input: Readonly<{
  ledger: DiagnosticRetryV4Ledger
  runPermit: DiagnosticRetryV4RunPermit
  allocation: DiagnosticRetryV4Allocation
  cell: DiagnosticRetryV4Cell
  start: DiagnosticRetryV4Start
  requestRoot: LabRoot
  bottom: DiagnosticRetryV4IssuedProvider
  top: DiagnosticRetryV4IssuedProvider
  match: Parameters<typeof runCanonicalLabMatch>[0]["match"]
  onKernelEntry: (admittedMatch: Parameters<typeof runCanonicalLabMatch>[0]["match"]) => void
  onEvidenceStart: () => void
}>): Promise<Readonly<{ disposition: "success" | "system_failure" | "player_violation"; processValidity: "process_valid" | "process_invalid"; evidenceRoot: LabRoot; artifactBytes: number; artifactRecords: number; transitionCount: number; accountingCount: number; cleanupComplete: boolean }>> => {
  const allocation = admitDiagnosticRetryV4Allocation(input.allocation), cell = admitDiagnosticRetryV4Cell(allocation, input.cell)
  const start = verifyDiagnosticRetryV4Ledger(input.ledger, allocation, cell, input.start)
  if (input.requestRoot !== cell.requestRoot || input.bottom === input.top) return fail("RETRY_V4_MATCH_REQUEST")
  const providers = requireDiagnosticRetryV4OpaquePair({ allocation, cell, start, match: input.match, bottom: input.bottom, top: input.top })
  const runPermit = input.runPermit
  const bridgePermit = Object.freeze({ schemaVersion: "diagnostic-retry-bridge-permit-v4" as const, toJSON(): never { return fail("RETRY_V4_BRIDGE_PERMIT_NON_SERIALIZABLE") } })
  retryV4BridgePermits.set(bridgePermit, { ...providers, consumed: false })
  const retained = await runAndRetainCanonicalDiagnosticRetryV4({ ledger: input.ledger, allocation, cell, start, runPermit, bridgePermit, onKernelEntry: () => input.onKernelEntry(providers.match), onEvidenceStart: input.onEvidenceStart })
  return Object.freeze({ disposition: retained.disposition, processValidity: retained.processValidity, evidenceRoot: retained.evidenceRoot, artifactBytes: retained.artifactBytes, artifactRecords: retained.artifactRecords, transitionCount: retained.transitionCount, accountingCount: retained.accountingCount, cleanupComplete: retained.cleanupComplete })
}
