/** Trusted native Match composition for the distinct private current baseline. */
import { performance } from "node:perf_hooks"
import { CANONICAL_ARENA_CATALOG_V1_37, createSetScenarioV137, defaultRuntimeMetadata, type SoldierBrainInputV119, type StrategyInputV119 } from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { admitFactory, authorizeFactorySupervision, type FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import { runCanonicalLabMatch, type LabMatchExecution } from "../../packages/strategy-lab/src/runtime-bridge.js"
import { LEAN_CAPS, type LeanExperimentLedger, type LeanCharge, type LeanSlot } from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { compactExecution, deriveLeanSupervisorDiagnostic } from "../run-v1-38-lean-experiment.js"
import { createFactorySupervisedRuntime, getFactoryPrivateDiagnostic } from "./v1-38-factory-supervised-runtime.js"
import { prospectiveLeagueRuntimeBinding } from "./v1-38-league-prospective-lifetime.js"
import { issueLeanBaselineRuntimeAuthority } from "./v1-38-lean-experiment-authority.js"
import { validateLeanBaselineSource, type LeanBaselineSource } from "./v1-38-lean-baseline-source.js"

const fail = (): never => { throw new TypeError("LEAN_BASELINE_MATCH") }
export const leanBaselineMatchSeed = (seed: string, ordinal: number): string => `${seed}-${ordinal >= 32 ? ordinal - 24 : ordinal}`
/** Repeats preserve the initial matrix's seed, arena, side and initiative. */
export const leanBaselineScenario = (input: { seed: string; slot: LeanSlot; bottom: LeanBaselineSource; top: LeanBaselineSource }) => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(a => a.status === "active" && a.semanticGeometryHash === input.slot.arenaHash) ?? fail()
  const bottomPlayerId = `lean-source-${input.bottom.sourceRoot.slice(7)}`, topPlayerId = `lean-source-${input.top.sourceRoot.slice(7)}`
  if (bottomPlayerId === topPlayerId) return fail()
  const scenario = createSetScenarioV137({ arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion, arenaSemanticGeometryHash: input.slot.arenaHash, entrantA: { entrantKey: input.bottom.sourceRoot, playerId: bottomPlayerId }, entrantB: { entrantKey: input.top.sourceRoot, playerId: topPlayerId }, baseSeed: leanBaselineMatchSeed(input.seed, input.slot.ordinal) })
  // Sources are already in their retained bottom/top seats. Only initiative is
  // selected here; a Set condition must not silently swap them a second time.
  const initialInitiativePlayerId = input.slot.condition % 2 === 0 ? bottomPlayerId : topPlayerId
  return { arena, bottomPlayerId, topPlayerId, initialInitiativePlayerId, seed: scenario.baseSeed }
}
const redact = (value: unknown): unknown => Array.isArray(value) ? value.map(redact) : value !== null && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([key]) => !/(?:source|memory|objective|input|output|stdio|prompt)/iu.test(key)).map(([key, v]) => [key, redact(v)])) : value
/** Normalize only engine-owned run identity, never arbitrary user memory keys.
 * Canonical transition hashes bind the original Match identity and therefore
 * cannot themselves be compared across distinct counted repeat Matches. The
 * complete normalized gameplay projections and private runtime results remain
 * bound, incrementally rooted to avoid one unbounded canonical JSON graph. */
export const leanBaselineSemanticRoot = (actual: LabMatchExecution): LabRoot | null => {
  if (actual.kind !== "completed") return null
  const normalizeState = (state: Readonly<Record<string, unknown>>) => ({ ...state, matchId: "lean-baseline-repeat-identity" })
  const transitionRoots = actual.transitions.map(record => {
    const { beforeStateHash: _beforeState, afterStateHash: _afterState, beforeMachineHash: _beforeMachine, afterMachineHash: _afterMachine, beforeState, afterState, events, ...body } = record
    return labRoot("lean-baseline-repeat-transition-v1", { ...body, beforeState: normalizeState(beforeState), afterState: normalizeState(afterState), events: events.map(event => event.type === "MATCH_STARTED" && event.payload !== null && typeof event.payload === "object" && !Array.isArray(event.payload) ? { ...event, payload: { ...event.payload, matchId: "lean-baseline-repeat-identity" } } : event) })
  })
  const runtimeRoots = actual.accounting.map(evidence => labRoot("lean-baseline-repeat-runtime-v1", { sourceRoot: evidence.identity.sourceRoot, revisionId: evidence.identity.revisionId, method: evidence.method, ordinal: evidence.ordinal, inputRoot: evidence.inputRoot, result: evidence.result }))
  return labRoot("lean-baseline-canonical-repeat-v1", { finalStateRoot: labRoot("lean-baseline-repeat-state-v1", normalizeState(actual.result.state as unknown as Readonly<Record<string, unknown>>)), transitionRoots, runtimeRoots })
}

export const runLeanBaselineMatch = async (input: {
  ledger: LeanExperimentLedger; charge: LeanCharge; slot: LeanSlot; seed: string
  bottom: LeanBaselineSource; top: LeanBaselineSource; observedRole?: string
  checkpoint: () => void
  register: (provider: Pick<FactorySupervisionProvider, "close">) => void
  unregister: (provider: Pick<FactorySupervisionProvider, "close">) => void
}) => {
  const bottomSource = validateLeanBaselineSource(input.bottom), topSource = validateLeanBaselineSource(input.top)
  const scenario = leanBaselineScenario({ seed: input.seed, slot: input.slot, bottom: bottomSource, top: topSource })
  const began = performance.now(), opened: FactorySupervisionProvider[] = []
  const brainInputs: SoldierBrainInputV119[] = [], strategyInputs: StrategyInputV119[] = []
  const decisionRows: Array<{ method: string; inputRoot: LabRoot; outputRoot: LabRoot }> = []
  let cleanupComplete = true
  const create = (snapshot: LeanBaselineSource, seat: "bottom" | "top"): FactorySupervisionProvider => {
    input.checkpoint()
    const sourceBytes = new TextEncoder().encode(snapshot.source)
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet: snapshot.packet, proposal: snapshot.proposal, sourceBytes }), validation: snapshot.validation })
    const defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: snapshot.source, runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    if (!revision.validation.valid || !revision.metadata.sourceArtifact) return fail()
    const matchId = `lean-${input.charge.root.slice(7, 31)}`, containerName = `lean-${input.charge.root.slice(7, 25)}-${seat}`, ownershipLabel = `lean-${input.ledger.allocation.root.slice(7, 25)}`
    const runtime = prospectiveLeagueRuntimeBinding(admission, { revisionId: revision.id, sourceRoot: snapshot.sourceRoot, executableRoot: `sha256:${revision.metadata.sourceArtifact.hash}`, tupleId: MATCH_KERNEL.tupleId, tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, image: LAB_ADMITTED_ROOTS.image })
    const authority = issueLeanBaselineRuntimeAuthority(input.ledger, input.charge, snapshot, { budgetRoot: input.ledger.allocation.root, attemptRoot: input.charge.root, matchId, containerName, ownershipLabel, seat, runtime })
    const native = createFactorySupervisedRuntime({ admission, sourceBytes, leanExperimentAuthority: authority, matchId, containerName, ownershipLabel, attemptRoot: input.charge.root, budgetRoot: input.ledger.allocation.root, image: LAB_ADMITTED_ROOTS.image, invocationLimit: 24800, factoryLifetimeMs: 600000 })
    let closed: ReturnType<FactorySupervisionProvider["close"]> | undefined
    const observed = snapshot.role === input.observedRole
    const provider: FactorySupervisionProvider = {
      identity: native.identity,
      async invoke(request, identity) {
        if (performance.now() - began >= LEAN_CAPS.matchMs) { provider.close(); return fail() }
        input.checkpoint()
        const evidence = await native.invoke(request, identity)
        if (observed && native.verify(evidence) && evidence.result.ok) {
          if (request.kind === "soldierBrain" && brainInputs.length < 16) brainInputs.push(structuredClone(request.input as SoldierBrainInputV119))
          if (request.kind === "selectActivations" && strategyInputs.length < 16) strategyInputs.push(structuredClone(request.input as StrategyInputV119))
          if (decisionRows.length < 128) decisionRows.push({ method: request.kind, inputRoot: evidence.inputRoot, outputRoot: labRoot("lean-runtime-decision-output-v1", evidence.result.value) })
        }
        input.checkpoint()
        return evidence
      },
      verify: evidence => native.verify(evidence),
      close() { if (!closed) closed = native.close(); cleanupComplete = cleanupComplete && closed.cleanupComplete && !closed.orphanedChild; return closed },
    }
    // This accessor is kept private and only read after a finite failure.
    diagnosticProviders.set(provider, evidence => getFactoryPrivateDiagnostic(native, evidence))
    opened.push(provider); input.register(provider)
    return provider
  }
  let actual: LabMatchExecution
  try {
    const bottom = create(bottomSource, "bottom"), top = create(topSource, "top")
    actual = await runCanonicalLabMatch({ match: { matchId: `lean-${input.charge.root.slice(7, 31)}`, seed: scenario.seed, arenaVariant: scenario.arena, bottomPlayerId: scenario.bottomPlayerId, topPlayerId: scenario.topPlayerId, initialInitiativePlayerId: scenario.initialInitiativePlayerId, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }, providers: { [scenario.bottomPlayerId]: bottom, [scenario.topPlayerId]: top } })
  } catch { actual = { kind: "failure", privacy: "private_offline", unchangedState: null, transitions: [], accounting: [], failure: { classification: "system_failure", code: "LEAN_BASELINE_SUPERVISOR_FAILURE" } } }
  finally { for (const provider of opened) { input.unregister(provider); try { provider.close() } catch { cleanupComplete = false } } }
  input.checkpoint()
  const elapsedMs = Math.ceil(performance.now() - began), compact = compactExecution(actual, elapsedMs, cleanupComplete, scenario.bottomPlayerId)
  const observedSeat = input.observedRole === bottomSource.role ? "bottom" : input.observedRole === topSource.role ? "top" : null
  const trainingHalfPoints = compact.outcome === "DRAW" ? 1 as const : observedSeat && compact.outcome === observedSeat ? 2 as const : 0 as const
  const semanticRoot = leanBaselineSemanticRoot(actual)
  function* replayFrames() {
    if (actual.kind === "completed") {
      yield redact({ kind: "final-state", value: actual.result.state })
      for (const transition of actual.transitions) { input.checkpoint(); yield redact({ kind: "transition", value: transition }) }
    } else yield { kind: "failure", code: compact.code }
  }
  const failedEvidence = actual.accounting.find(e => !e.result.ok && "systemFailure" in e.result)
  const provider = failedEvidence && opened.find(p => p.identity.sourceRoot === failedEvidence.identity.sourceRoot)
  const origin = provider && failedEvidence ? diagnosticProviders.get(provider)?.(failedEvidence) : undefined
  const diagnostic = compact.classification !== "success" ? deriveLeanSupervisorDiagnostic(input.charge.root, actual, origin ? { stage: "native_response", reason: ["stream_exchange", "outer_frame", "inner_response", "executor"].includes(origin.stage) ? origin.stage as "stream_exchange" | "outer_frame" | "inner_response" | "executor" : "system_failure", method: failedEvidence!.method, ordinal: failedEvidence!.ordinal, code: !failedEvidence!.result.ok && "systemFailure" in failedEvidence!.result ? failedEvidence!.result.systemFailure.code : undefined } : undefined) : null
  return { compact, replayFrames: replayFrames(), brainInputs, strategyInputs, trainingHalfPoints, semanticRoot, decisionRoot: labRoot("lean-baseline-observed-decisions-v1", decisionRows), diagnostic }
}
const diagnosticProviders = new WeakMap<object, (evidence: Parameters<typeof getFactoryPrivateDiagnostic>[1]) => ReturnType<typeof getFactoryPrivateDiagnostic>>()
