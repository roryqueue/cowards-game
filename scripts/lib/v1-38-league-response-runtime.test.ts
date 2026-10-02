import { describe, expect, it } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import type { FactorySupervisionProvider } from "../../packages/strategy-lab/src/factory/admission.js"
import { wrapLeagueProbeProvider, verifyRetainedLeagueProbeInvocations } from "./v1-38-league-response-runtime.js"

const root = labRoot("probe-test", "identity")
const soldiers = [1, 2].map((x) => ({ id: `soldier-${x}`, ownerPlayerId: "player", status: "ACTIVE", position: { x, y: 1 }, facing: "LEFT", lastSuccessfulMoveDirection: "LEFT" }))
const request = { kind: "selectActivations", requestId: "request", semanticTupleId: "tuple", coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0, actingPlayerId: "player" }, input: { phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers, terrainStones: [] }, mySoldiers: soldiers, enemySoldiers: [], strategyMemory: { x: 9, id: "opaque-memory" }, initialInitiativePlayerId: "player", hasInitialInitiative: true, roundInitiativePlayerId: "player", hasRoundInitiative: true } } as const
const fixture = () => {
  const identities = new WeakSet<object>(), seen: unknown[] = []
  const identity = { revisionId: "fixture", sourceRoot: root, executableRoot: root, tupleId: "tuple", tupleRoot: root, image: "fixture", harnessRoot: root, budgetRoot: root, attemptRoot: root, runtimeLimitsRoot: root } as FactorySupervisionProvider["identity"]
  const provider: FactorySupervisionProvider = { identity, invoke(input) { seen.push(input); const evidence = { identity, requestId: input.requestId, method: input.kind, inputRoot: labRoot("runtime-input", input.input), ordinal: 0, invocationRoot: root, charged: true, completed: true, outputBytes: 2, result: { ok: true as const, value: { activationOrders: [], strategyMemory: input.kind === "selectActivations" ? input.input.strategyMemory : null } } }; identities.add(evidence); return evidence }, verify(value) { return identities.has(value) }, close() { return { cleanupComplete: true, orphanedChild: false } } }
  return { provider, seen }
}
describe("host-bound league behavioral probes", () => {
  it.each([false, true])("awaits retention before issuance, refuses synchronous pending close, and stops after failure=%s", async (failure) => {
    const { provider, seen } = fixture(); let closeCalls = 0, captured: any, finished = false
    provider.close = () => { closeCalls++; return { cleanupComplete: true, orphanedChild: false } }
    let release!: () => void, reject!: (error: Error) => void
    const gate = new Promise<void>((resolve, refuse) => { release = resolve; reject = refuse })
    const wrapper = wrapLeagueProbeProvider(provider, undefined, { minX: 0, maxX: 11 }, (value) => { captured = value; return gate })
    const result = Promise.resolve(wrapper.invoke(request as never, provider.identity)).then((value) => { finished = true; return value }, (error) => { finished = true; return error })
    await Promise.resolve(); await Promise.resolve()
    expect(captured).toBeDefined(); expect(wrapper.verify(captured.admittedEvidence)).toBe(false); expect(finished).toBe(false)
    expect(() => wrapper.close()).toThrow("PENDING"); expect(closeCalls).toBe(0)
    const error = Error("retention failed")
    if (failure) reject(error); else release()
    const value = await result
    expect(value).toBe(failure ? error : captured.admittedEvidence)
    expect(wrapper.verify(captured.admittedEvidence)).toBe(!failure)
    if (failure) { await expect(wrapper.invoke(request as never, provider.identity)).rejects.toThrow("RETENTION_STOP"); expect(seen).toHaveLength(1) }
    expect(wrapper.close()).toEqual({ cleanupComplete: true, orphanedChild: false }); expect(closeCalls).toBe(1)
  })
  it("tracks the whole invocation and settles a same-wrapper race before rejecting without another guest or capacity call", async () => {
    const { provider, seen } = fixture(); let release!: () => void, before = 0, retained = 0, closed = 0
    const guestGate = new Promise<void>((resolve) => { release = resolve }), original = provider.invoke.bind(provider)
    provider.invoke = async (...args) => { await guestGate; return original(...args) }
    provider.close = () => { closed++; return { cleanupComplete: true, orphanedChild: false } }
    const wrapper = wrapLeagueProbeProvider(provider, undefined, { minX: 0, maxX: 11 }, () => { retained++ }, () => { before++ })
    const first = wrapper.invoke(request as never, provider.identity)
    let raced = false
    const second = Promise.resolve(wrapper.invoke(request as never, provider.identity)).catch((error) => { raced = true; return error })
    await Promise.resolve(); expect(raced).toBe(false); expect(before).toBe(1); expect(retained).toBe(0)
    expect(() => wrapper.close()).toThrow("PENDING"); expect(closed).toBe(0)
    release(); await first
    expect((await second).message).toContain("PENDING"); expect(seen).toHaveLength(1); expect(before).toBe(1); expect(retained).toBe(1)
  })
  it("retains the invocation-time capacity guard before calling the provider", async () => {
    const { provider, seen } = fixture(), retained: unknown[] = []
    const wrapped = wrapLeagueProbeProvider(provider, undefined, { minX: 0, maxX: 11 }, (value) => { retained.push(value) }, () => { throw Error("injected invocation capacity stop") })
    await expect(wrapped.invoke(request as never, provider.identity)).rejects.toThrow("invocation capacity stop")
    expect(seen).toEqual([]); expect(retained).toEqual([])
  })
  it("reflects public geometry and facing while preserving opaque Strategy state and original evidence", async () => {
    const { provider, seen } = fixture(), retained: any[] = [], wrapper = wrapLeagueProbeProvider(provider, "horizontal_symmetry", { minX: 0, maxX: 11 }, (value) => { retained.push(value) })
    const evidence = await wrapper.invoke(request as never, provider.identity)
    expect((seen[0] as any).input.mySoldiers[0]).toMatchObject({ position: { x: 10, y: 1 }, facing: "RIGHT", lastSuccessfulMoveDirection: "RIGHT" })
    expect((seen[0] as any).input.strategyMemory).toEqual(request.input.strategyMemory)
    expect(wrapper.verify(evidence)).toBe(true); expect(wrapper.verify({ ...evidence })).toBe(false)
    expect(retained[0].request).toEqual(request); expect(retained[0].originalEvidence).not.toBe(evidence)
    expect(evidence.inputRoot).toBe(labRoot("runtime-input", request.input))
    expect(verifyRetainedLeagueProbeInvocations(retained, [evidence], "horizontal_symmetry", { minX: 0, maxX: 11 })).toEqual({ issued: false })
    expect(() => verifyRetainedLeagueProbeInvocations([{ ...retained[0], dispatched: request }], [evidence], "horizontal_symmetry", { minX: 0, maxX: 11 })).toThrow("RETAINED_RAW_PROJECTION")
  })
  it("changes opaque identifiers and Soldier enumeration through the actual issued invocation path", async () => {
    for (const family of ["opaque_ids", "soldier_order"] as const) {
      const { provider, seen } = fixture(), wrapper = wrapLeagueProbeProvider(provider, family, { minX: 0, maxX: 11 }, () => {})
      await wrapper.invoke(request as never, provider.identity)
      const observed = (seen[0] as any).input
      if (family === "opaque_ids") { expect(observed.mySoldiers[0].id).not.toBe("soldier-1"); expect(observed.mySoldiers[0].ownerPlayerId).toBe(observed.initialInitiativePlayerId) }
      else expect(observed.mySoldiers[0].id).toBe("soldier-2")
      expect(observed.strategyMemory).toEqual(request.input.strategyMemory)
    }
  })
})
import { enumerateLeagueResponseConditions } from "./v1-38-league-response-runtime.js"
import { allocationFixture } from "../../packages/strategy-lab/src/league/allocation.test.js"
import { createLeagueExecutionAllocation } from "../../packages/strategy-lab/src/league/allocation.js"
import { importedCandidateFixture } from "../../packages/strategy-lab/src/league/contracts.test.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "../../packages/strategy-lab/src/factory/repository.js"
import { declareRedTeamAllocation, startRedTeamAttempt } from "../../packages/strategy-lab/src/league/red-team.js"
import { admitCanonicalJsonValue, defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../packages/runtime-js/src/revision.js"
import { LAB_ADMITTED_ROOTS, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import { executeLeagueAuthoring } from "./v1-38-league-authoring.js"
import { produceLeagueResponse, verifyRetainedLeagueResponse, type LeagueResponseProductionInput } from "./v1-38-league-response-runtime.js"
import { fsync, mkdtempSync, realpathSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { createLeagueRepository } from "../../packages/strategy-lab/src/league/repository.js"
import { LeagueRecordGraph, LeagueRetentionBudget } from "../run-v1-38-serious-league.js"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** Explicitly synthetic favorable response, never an empirical performance claim.
 * Real author/admission/supervision/measurement code consumes these inert records. */
export const positiveResponseFixture = (initialSources: ReadonlySet<LabRoot>): NonNullable<LeagueResponseProductionInput["fixture"]> => {
  const revisions = new Map<LabRoot, ReturnType<typeof buildStrategyRevision>>()
  return { author: async (input) => executeLeagueAuthoring({ ...input, clock: () => 0 }), host: { createFactorySupervisedRuntime({ admission, sourceBytes, executableRoot, attemptRoot, budgetRoot }) {
    const defaults = defaultRuntimeMetadata("typescript"), revision = revisions.get(admission.sourceRoot) ?? buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } }); revisions.set(admission.sourceRoot, revision)
    const issued = new WeakSet<object>(), identity = { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: labRoot("positive-fixture-harness", 1), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot }
    return { identity, invoke(input) { const evidence = { identity, requestId: input.requestId, method: input.kind, inputRoot: labRoot("runtime-input", input.input), ordinal: 0, invocationRoot: labRoot("positive-fixture-invocation", { identity, input }), charged: true, completed: true, outputBytes: 2, result: { ok: true as const, value: { activationOrders: [], strategyMemory: {} } } }; issued.add(evidence); return evidence }, verify(value) { return issued.has(value) }, close() { return { cleanupComplete: true, orphanedChild: false } } }
  } }, run: async ({ match, providers }) => {
    const state = MATCH_KERNEL.createMachineV119(match).initialState, measured = providers["league-response-candidate"]!, favorable = !initialSources.has(measured.identity.sourceRoot), accounting = []
    expect(state.soldiers).toHaveLength(16)
    for (const [playerId, provider] of Object.entries(providers)) {
      const fresh = !initialSources.has(provider.identity.sourceRoot), observedSoldiers = fresh ? state.soldiers : [], input = { ...request, requestId: `${match.matchId}:${playerId}`, semanticTupleId: "candidate-kernel-v1.19", coordinates: { ...request.coordinates, actingPlayerId: playerId }, input: { ...request.input, board: { bounds: state.bounds, soldiers: observedSoldiers, terrainStones: [] }, mySoldiers: observedSoldiers.filter((row) => row.ownerPlayerId === playerId), enemySoldiers: observedSoldiers.filter((row) => row.ownerPlayerId !== playerId), initialInitiativePlayerId: match.initialInitiativePlayerId, roundInitiativePlayerId: match.initialInitiativePlayerId } }
      accounting.push(await provider.invoke(input as never, provider.identity))
    }
    const outcome = favorable ? { type: "WIN", winnerPlayerId: "league-response-candidate" } : { type: "DRAW" }
    return { kind: "completed", privacy: "private_offline", transitions: [], accounting, result: { state: { ...state, soldiers: favorable ? state.soldiers : [], outcome }, events: [{ type: "MATCH_ENDED", payload: outcome }] } } as never
  } }
}

it("charges separate common-reference counterfactual cells on the entire multi-seed product", () => {
  const base = allocationFixture(), allocation = createLeagueExecutionAllocation({ ...base, seedBlocks: ["block-one", "block-two"], opportunities: { ...base.opportunities, matches: 400 } })
  const cells = enumerateLeagueResponseConditions(allocation, allocation.initialCandidatePublicationRoots)
  expect(cells).toHaveLength(96)
  expect(cells.map((cell) => cell.ordinal)).toEqual(Array.from({ length: 96 }, (_, i) => i))
  for (const purpose of ["score", "independence_left", "independence_right"]) expect(cells.filter((cell) => cell.purpose === purpose)).toHaveLength(32)
  expect(new Set(cells.map((cell) => JSON.stringify({ ...cell, ordinal: 0 })))).toHaveLength(96)
  expect(cells.every((cell) => cell.referencePublicationRoot === allocation.independenceReferencePublicationRoot)).toBe(true)
  expect(() => createLeagueExecutionAllocation({ ...base, independenceReferencePublicationRoot: labRoot("foreign-reference", 1) })).toThrow("INDEPENDENCE_REFERENCE")
})

it.each([
  ["runs source-only three-arm production (complete) without executing Strategies", "complete"],
  ["runs source-only three-arm production (capacity after authoring) without executing Strategies", "capacity after authoring"],
  ["runs source-only three-arm production (capacity between Matches) without executing Strategies", "capacity between Matches"],
  ["host-bound league behavioral probes: asynchronous invocation graph retention response same-wrapper", "async same-wrapper"],
  ["host-bound league behavioral probes: asynchronous invocation graph retention response shared-graph", "async shared-graph"],
  ["host-bound league behavioral probes: CR-02 persistent response retention failure", "async persistent"],
  ["host-bound league behavioral probes: CR-02 response production failure-record fault", "async production-failure"],
  ["host-bound league behavioral probes: CR-02 response factory-terminal fault", "async factory-terminal"],
  ["host-bound league behavioral probes: CR-02 response cleanup retention fault without primary", "cleanup without primary"],
  ["host-bound league behavioral probes: CR-02 response actual close fault without primary", "close without primary"],
] as const)("%s", async (_name, scenario) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-response-injected-test-")))
  const leagueDirectory = scenario.startsWith("async") ? realpathSync(mkdtempSync(join(tmpdir(), "league-response-injected-test-"))) : null
  let secondaryActive = false
  const secondary = Error("secondary response retention fault")
  const closeError = Error("original actual close fault"), noPrimary = scenario.endsWith("without primary")
  try {
    const repository = createFactoryRepository(directory, { beforePublication(value) { if (secondaryActive && scenario === "async factory-terminal" && value.terminal) throw secondary } }), put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("fixture encoding"); return publishFactoryArtifact(repository, encoded.canonicalBytes) }, initial = [await importedCandidateFixture(1), await importedCandidateFixture(3)], opponents = initial.map((entry) => ({ candidateRoot: entry.candidateAdmission.candidate.root, closure: entry.closure })), base = allocationFixture(), r = (text: string) => labRoot("response-fixture", text)
    const producerInput = { split: "development", doctrineFamily: "source-only-response", provider: { providerId: "source-fixture", modelId: "local", modelVersion: "test", settingsRoot: r("settings"), promptRoot: r("prompt"), contextRoot: r("context") }, build: { buildRoot: r("build"), toolchainRoot: r("toolchain") }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }, producerRequestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput }), disclosureArtifactRoot = put({ participantId: "author", requestArtifactRoot: producerRequestArtifactRoot, sourceAndBuildDisclosed: true, dependencyArtifactRoots: [] }), provenanceArtifactRoot = put({ participantId: "author", priorExposure: "none", conflicts: "none", origin: "tactical-oracle", deterministicDataOnly: true }), reviewArtifactRoot = put({ reviewerId: "reviewer", participantId: "author", disclosureArtifactRoot, provenanceArtifactRoot, disposition: "accepted", reviewMilliseconds: 0 }), reservation = { ...base.channels[0]!.perAttempt, matches: 48, effortMilliseconds: 180000 }
    const job = { id: "source-response", channel: "automated" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot, disclosureArtifactRoot, provenanceArtifactRoot, reviewArtifactRoot, participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }, allocation = createLeagueExecutionAllocation({ ...base, outputDirectories: { league: "/fixture/league-response", responseFactory: directory }, initialCandidatePublicationRoots: initial.map((entry) => entry.input.publicationArtifactRoot).sort(), independenceReferencePublicationRoot: initial[0]!.input.publicationArtifactRoot, opportunities: { ...base.opportunities, attemptedCandidates: 1, matches: 200 }, operations: { ...base.operations, perAttemptMilliseconds: 180000, wallClockMilliseconds: 240000, maxArtifactBytes: 160000000, maxArtifactRecords: 100000 }, channels: base.channels.map((channel) => channel.channel === "automated" ? { ...channel, disposition: "allocated", opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: [job] }, base.rounds[1]!] }), ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes }), start = startRedTeamAttempt({ ledger, channel: "automated", roundRoot: r("round"), candidateRoot: opponents[0]!.candidateRoot, participantId: "author", reviewerId: "reviewer", disclosureRoot: disclosureArtifactRoot, provenanceRoot: provenanceArtifactRoot, inputRoot: producerRequestArtifactRoot, retryParentRoot: null, reservation }).starts[0]!, startArtifactRoot = put(start), targetArtifactRoot = put({ roundRoot: start.roundRoot, candidateRoot: start.candidateRoot, candidates: initial.map((entry) => { const bytes = readFactoryArtifact(entry.factoryRepository, entry.closure.sourceArtifactRoot), sourceArtifactRoot = publishFactoryArtifact(repository, bytes); return { candidateRoot: entry.candidateAdmission.candidate.root, sourceArtifactRoot, byteLength: bytes.length, disclosedFile: `candidate-${sourceArtifactRoot.slice(7)}.ts` } }) })
    const asynchronous = scenario.startsWith("async"), syncs: Array<(error?: Error) => Promise<void>> = []
    let syncReady!: () => void, raceReady!: () => void, firstError: unknown, raceError: unknown, closeCalls = 0, guestCalls = 0
    const syncing = new Promise<void>((resolve) => { syncReady = resolve }), racing = new Promise<void>((resolve) => { raceReady = resolve }), asyncError = Error("original response dependency error")
    const budget = new LeagueRetentionBudget(allocation)
    const graph = leagueDirectory ? new LeagueRecordGraph(createLeagueRepository(leagueDirectory, { beforePublication(value) { budget.beforePublication(value); if (secondaryActive && scenario === "async persistent") throw secondary }, syncFile(fd) { return new Promise<void>((resolve, reject) => { syncs.push((error) => new Promise<void>((done) => fsync(fd, (actual) => { if (error || actual) reject(error ?? actual); else resolve(); done() }))); if (syncs.length === 2) syncReady() }) } }), allocation.operations, budget) : null
    let calls = 0, providers = 0, authoringFinished = false, invocationChecks = 0
    const completedBeforeStop = scenario === "capacity after authoring" ? 0 : 1
    const checkCapacity = () => { if (!asynchronous && scenario !== "complete" && !noPrimary && authoringFinished && calls >= completedBeforeStop) throw Error("injected live capacity stop"); graph?.beforeDispatch() }
    const records = new Map<LabRoot, { kind: string; value: any; links: readonly LabRoot[] }>(), retention = {
      append(kind: string, value: unknown, links: readonly LabRoot[] = []) {
        if (secondaryActive && scenario === "async production-failure" && kind === "response-production-failure" || noPrimary && ["response-runtime-cleanup", "response-production-failure"].includes(kind)) throw secondary
        const root = graph ? graph.append(kind, value, links) : labRoot("response-fixture-record", { kind, value, links }); records.set(root, { kind, value, links }); return root
      },
      ...(graph ? { async appendInvocation(kind: string, value: unknown, links: readonly LabRoot[] = []) { const root = await graph.appendInvocation(kind, value, links); records.set(root, { kind, value, links }); return root }, settlePending: () => graph.settlePending() } : {}),
      get invocationPending() { return graph?.invocationPending ?? false },
      beforeDispatch: checkCapacity, beforeInvocation(request: unknown) { invocationChecks++; graph?.beforeInvocation(request) },
    }, revisions = new Map<string, ReturnType<typeof buildStrategyRevision>>()
    const pending = produceLeagueResponse({ allocation, job, start, startArtifactRoot, targetArtifactRoot, remainingWallMilliseconds: 240000, repository, opponents, threshold: { repository: initial[0]!.factoryRepository, artifactRoot: initial[0]!.candidateAdmission.importEvidence!.thresholdArtifactRoot }, retention, fixture: { author: async (input) => { const result = await executeLeagueAuthoring({ ...input, clock: () => 0 }); authoringFinished = true; return result }, host: { createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot, budgetRoot, executableRoot }) {
      providers++
      const defaults = defaultRuntimeMetadata("typescript"), revision = revisions.get(admission.sourceRoot) ?? buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } }); revisions.set(admission.sourceRoot, revision)
      const issued = new WeakSet<object>(), identity = { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: r("harness"), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot }
      return { identity, invoke(request) { guestCalls++; const evidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0, invocationRoot: labRoot("response-fixture-invocation", { identity, request }), charged: true, completed: true, outputBytes: 2, result: { ok: true as const, value: { activationOrders: [], strategyMemory: {} } } }; issued.add(evidence); return evidence }, verify(value) { return issued.has(value) }, close() { closeCalls++; if (scenario === "close without primary" && closeCalls === 1) throw closeError; return { cleanupComplete: true, orphanedChild: false } } }
    } }, run: async ({ match, providers }) => {
      calls++; const state = MATCH_KERNEL.createMachineV119(match).initialState, accounting = []
      expect(state.soldiers).toHaveLength(16)
      for (const [playerId, provider] of Object.entries(providers)) {
        const selected = { ...request, requestId: `${match.matchId}:${playerId}`, semanticTupleId: "candidate-kernel-v1.19", coordinates: { ...request.coordinates, actingPlayerId: playerId }, input: { ...request.input, board: { ...request.input.board, bounds: state.bounds }, initialInitiativePlayerId: match.initialInitiativePlayerId, roundInitiativePlayerId: match.initialInitiativePlayerId } }
        if (asynchronous) {
          const work = Promise.resolve(provider.invoke(selected as never, provider.identity)).catch((error) => { firstError = error })
          await syncing
          const target = scenario === "async same-wrapper" ? provider : Object.values(providers).find((other) => other !== provider)!
          const rejected = Promise.resolve(target.invoke(selected as never, target.identity)).catch((error) => { raceError = error })
          expect(() => target.close()).toThrow("PENDING"); raceReady()
          await Promise.all([work, rejected]); throw firstError
        }
        accounting.push(await provider.invoke(selected as never, provider.identity))
      }
      return { kind: "completed", privacy: "private_offline", transitions: [], accounting, result: { state: { ...state, outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } } as never
    } } })
    if (asynchronous) {
      const result = pending.catch((error) => error)
      await racing
      const before = [...records.values()].map((row) => row.kind), prior = graph!.latestRoot
      expect(guestCalls).toBe(1); expect(closeCalls).toBe(0)
      expect(before).not.toContain("response-runtime-invocation"); expect(before).not.toContain("response-runtime-invocation-failure"); expect(before).not.toContain("response-runtime-cleanup")
      await syncs[0]!(asyncError); await Promise.resolve()
      expect(firstError).toBeUndefined(); expect(raceError).toBeUndefined(); expect(closeCalls).toBe(0); expect(graph!.latestRoot).toBe(prior)
      expect([...records.values()].map((row) => row.kind)).toEqual(before)
      const priorUsage = { ...budget.usage }; secondaryActive = true
      await syncs[1]!(); expect(await result).toBe(asyncError); expect(firstError).toBe(asyncError)
      expect((raceError as Error).message).toContain("PENDING"); expect(guestCalls).toBe(1); expect(closeCalls).toBe(2); expect(calls).toBe(1)
      const kinds = [...records.values()].map((row) => row.kind)
      expect(kinds.filter((kind) => kind === "response-runtime-invocation-failure")).toHaveLength(scenario === "async persistent" ? 0 : 2); expect(kinds.filter((kind) => kind === "response-runtime-cleanup")).toHaveLength(scenario === "async persistent" ? 0 : 2)
      expect(kinds).not.toContain("response-runtime-invocation")
      expect(kinds.filter((kind) => kind === "response-production-failure")).toHaveLength(["async persistent", "async production-failure"].includes(scenario) ? 0 : 1)
      expect(readdirSync(directory).filter((name) => name.endsWith(".terminal.json"))).toHaveLength(["async persistent", "async production-failure", "async factory-terminal"].includes(scenario) ? 0 : 1)
      if (scenario === "async persistent") { expect(graph!.latestRoot).toBe(prior); expect(budget.usage.workRecords).toBeGreaterThan(priorUsage.workRecords) }
      expect(budget.usage.workBytes).toBeGreaterThanOrEqual(priorUsage.workBytes)
      expect(() => graph!.beforeInvocation({})).toThrow("RETENTION_DISPATCH_STOP")
      return
    }
    if (noPrimary) {
      await expect(pending).rejects.toBe(scenario === "close without primary" ? closeError : secondary)
      expect(closeCalls).toBe(2); expect(calls).toBe(1)
      const kinds = [...records.values()].map((row) => row.kind)
      expect(kinds).not.toContain("response-runtime-cleanup"); expect(kinds).not.toContain("response-production-failure")
      expect(readdirSync(directory).filter((name) => name.endsWith(".terminal.json"))).toEqual([])
      return
    }
    if (scenario !== "complete") {
      await expect(pending).rejects.toThrow("injected live capacity stop")
      expect(authoringFinished).toBe(true)
      expect(calls).toBe(completedBeforeStop)
      expect(providers).toBe(2 * completedBeforeStop)
      expect(invocationChecks).toBe(2 * completedBeforeStop)
      const rows = [...records.values()], failed = rows.filter((row) => row.kind === "response-production-failure")
      expect(rows.filter((row) => row.kind === "response-match-start")).toHaveLength(completedBeforeStop)
      expect(rows.filter((row) => row.kind === "response-runtime-cleanup")).toHaveLength(2 * completedBeforeStop)
      expect(failed).toHaveLength(1)
      expect(failed[0]!.value).toMatchObject({ matchCount: completedBeforeStop, author: { disposition: "produced" }, error: "injected live capacity stop" })
      const factoryStart = failed[0]!.value.start
      expect(factoryStart.resourceAccountingRoot).toBe(start.root)
      expect(JSON.parse(readFileSync(join(directory, `factory-attempt-${factoryStart.root.slice(7)}.started.json`), "utf8"))).toEqual(factoryStart)
      expect(JSON.parse(readFileSync(join(directory, `factory-attempt-${factoryStart.root.slice(7)}.terminal.json`), "utf8"))).toMatchObject({ startRoot: factoryStart.root, disposition: "system_failure" })
      return
    }
    const produced = await pending
    expect(calls).toBe(48); expect(produced.matchCount).toBe(48)
    expect(produced.scores.every((score) => score.numerator === 8 && score.denominator === 16 && score.evidenceRoots.length === 8)).toBe(true)
    const names = readdirSync(directory).sort(), bytes = names.map((name) => readFileSync(join(directory, name)).toString("hex")), verify = { allocation, repository, produced, opponents, threshold: { repository: initial[0]!.factoryRepository, artifactRoot: initial[0]!.candidateAdmission.importEvidence!.thresholdArtifactRoot }, records }
    expect(verifyRetainedLeagueResponse(verify)).toMatchObject({ issued: false, matchCount: 48 })
    const indexedRecords = {
      get: (root: LabRoot) => records.get(root), entries: () => records.entries(),
      linked: (kind: string, root: LabRoot) => [...records].filter(([, row]) => row.kind === kind && row.links.includes(root)).map(([id]) => id),
      matches: (kind: "response-match-start" | "response-match-result", parentStartRoot: LabRoot) => [...records].flatMap(([root, row]) => {
        if (row.kind !== kind) return []
        const charge = kind === "response-match-result" ? row.value.matchCharge : row.value
        return charge.parentStartRoot === parentStartRoot ? [{ root, ordinal: charge.ordinal as number }] : []
      }),
    }
    expect(verifyRetainedLeagueResponse({ ...verify, records: indexedRecords })).toMatchObject({ issued: false, matchCount: 48 })
    expect(names.map((name) => readFileSync(join(directory, name)).toString("hex"))).toEqual(bytes); expect(readdirSync(directory).sort()).toEqual(names)
    expect(() => verifyRetainedLeagueResponse({ ...verify, produced: { ...produced, scores: produced.scores.map((row) => ({ ...row, numerator: 16 })) } })).toThrow("RETAINED_RESPONSE_DECISIONS")
    const missing = new Map(records); missing.delete([...missing.entries()].find(([, row]) => row.kind === "response-match-result")![0])
    expect(() => verifyRetainedLeagueResponse({ ...verify, records: missing })).toThrow("RETAINED_RESPONSE_COVERAGE")
  } finally { rmSync(directory, { recursive: true, force: true }); if (leagueDirectory) rmSync(leagueDirectory, { recursive: true, force: true }) }
}, 240000)
