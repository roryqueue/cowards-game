import { admitCanonicalJsonValue } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { LeagueCandidateAdmissionSchema, type LeagueProcessValidity } from "./contracts.js"
import { admitLeagueResponse, type DeclaredLeagueRound, type LeagueResponseRow } from "./psro.js"
import { LEAGUE_PROBES } from "./probes.js"
export { LEAGUE_PROBES } from "./probes.js"

export const RED_TEAM_CHANNELS = ["automated", "model", "human", "external"] as const
export type RedTeamChannel = typeof RED_TEAM_CHANNELS[number]
export type LeagueProbeFamily = typeof LEAGUE_PROBES[number]
const IDENTITIES: readonly LeagueProbeFamily[] = ["semantic_arena_identity", "repeat_restart", "worker_shard_completion"]
const RESOURCE_KEYS = ["matches", "modelTokens", "effortMilliseconds", "reviewMilliseconds", "searchNodes", "teacherNodes", "distillationUnits"] as const
export type RedTeamResources = Readonly<Record<typeof RESOURCE_KEYS[number], number>>
export type RedTeamDisposition = "success" | "accepted" | "rejected" | "legal_but_weak" | "invalid" | "duplicate" | "player_violation" | "system_failure" | "retried" | "unfilled" | "unused"
const DISPOSITIONS: readonly RedTeamDisposition[] = ["success", "accepted", "rejected", "legal_but_weak", "invalid", "duplicate", "player_violation", "system_failure", "retried", "unfilled", "unused"]
function fail(code: string): never { throw new TypeError(`LEAGUE_RED_TEAM_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value)
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
const exact = (value: unknown, keys: readonly string[]): boolean => exactLabKeys(value, keys)
const canonical = (value: unknown) => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!result.ok || result.canonicalByteLength > 262144) fail("CANONICAL"); return result }
const rooted = <T extends object>(domain: string, body: T): Readonly<T & { root: LabRoot }> => { canonical(body); return freezeLabValue({ ...body, root: labRoot(domain, body) }) as Readonly<T & { root: LabRoot }> }
const resources = (value: unknown): RedTeamResources => {
  if (!exact(value, RESOURCE_KEYS) || !RESOURCE_KEYS.every((key) => integer((value as RedTeamResources)[key]))) return fail("RESOURCES")
  return value as RedTeamResources
}
const identifiers = (values: readonly string[]) => Array.isArray(values) && new Set(values).size === values.length && values.every((value) => typeof value === "string" && /^[a-z][a-z0-9._:-]{0,95}$/u.test(value))

export interface RedTeamChannelAllocation {
  readonly channel: RedTeamChannel
  readonly disposition: "allocated" | "authorized_zero"
  readonly opportunities: number
  readonly ceilings: RedTeamResources
  readonly perAttempt: RedTeamResources
  readonly retryLimit: number
  readonly participants: readonly string[]
  readonly reviewers: readonly string[]
  readonly disclosure: "complete-source-build-and-dependencies"
  readonly conflicts: "distinct-reviewer"
  readonly provenance: "explicit-deterministic-data-only"
  readonly burn: "reserve-full-no-refund"
}
export interface LeagueProbeAllocation { readonly family: LeagueProbeFamily; readonly pairs: number; readonly maximumAbsoluteMeanDelta: Readonly<{ numerator: number; denominator: number }> | null }
export interface RedTeamAllocationInput { readonly phase: 265; readonly evidenceClass: "empirical" | "injected_fixture"; readonly authorityRoot: LabRoot; readonly channels: readonly RedTeamChannelAllocation[]; readonly probes: readonly LeagueProbeAllocation[] }
export type RedTeamAllocation = Readonly<RedTeamAllocationInput & { root: LabRoot }>
interface Target { readonly roundRoot: LabRoot; readonly candidateRoot: LabRoot }
export interface RedTeamAttemptStart extends Target {
  readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly channel: RedTeamChannel; readonly ordinal: number; readonly participantId: string; readonly reviewerId: string
  readonly disclosureRoot: LabRoot; readonly provenanceRoot: LabRoot; readonly inputRoot: LabRoot; readonly retryParentRoot: LabRoot | null; readonly reservation: RedTeamResources
}
export interface RedTeamAttemptTerminal { readonly root: LabRoot; readonly startRoot: LabRoot; readonly disposition: RedTeamDisposition; readonly usage: RedTeamResources | null; readonly charge: RedTeamResources; readonly evidenceRoots: readonly LabRoot[]; readonly candidateAdmissionRoot: LabRoot | null; readonly processValidity: LeagueProcessValidity }
export interface LeagueProbeObservation { readonly canonicalBytes: string; readonly halfPoints: 0 | 1 | 2; readonly conditionRoot: LabRoot; readonly evidenceRoot: LabRoot }
export interface LeagueProbePair { readonly left: LeagueProbeObservation; readonly right: LeagueProbeObservation }
export interface LeagueProbeReceipt extends Target { readonly root: LabRoot; readonly allocationRoot: LabRoot; readonly family: LeagueProbeFamily; readonly criterion: "byte_identity" | "paired_contrast"; readonly pairs: readonly LeagueProbePair[]; readonly passed: boolean; readonly processValidity: LeagueProcessValidity }
export interface RedTeamLedger { readonly root: LabRoot; readonly allocation: RedTeamAllocation; readonly starts: readonly RedTeamAttemptStart[]; readonly terminals: readonly RedTeamAttemptTerminal[]; readonly probes: readonly LeagueProbeReceipt[] }
// Individual receipts retain the canonical-envelope cap. The logical ledger is
// an aggregate retained by the command's bounded chunk graph, not one artifact.
const ledger = (allocation: RedTeamAllocation, starts: readonly RedTeamAttemptStart[], terminals: readonly RedTeamAttemptTerminal[], probes: readonly LeagueProbeReceipt[]): RedTeamLedger => {
  const body = { allocation, starts, terminals, probes }, admitted = admitCanonicalJsonValue(body, { profile: "canonical-manifest" })
  if (!admitted.ok) return fail("CANONICAL")
  return freezeLabValue({ ...body, root: labRoot("league-red-team-ledger-v1", body) })
}
const verifyLedger = (value: RedTeamLedger): void => {
  if (!value || !exact(value, ["root", "allocation", "starts", "terminals", "probes"])) fail("LEDGER")
  const { root, ...body } = value
  if (root !== labRoot("league-red-team-ledger-v1", body)) fail("LEDGER_REWRITE")
  if (new Set(value.starts.map((row) => row.root)).size !== value.starts.length || new Set(value.terminals.map((row) => row.startRoot)).size !== value.terminals.length || value.terminals.some((row) => !value.starts.some((start) => start.root === row.startRoot))) fail("LEDGER_COVERAGE")
}

/** All policy values are supplied prospectively; there is no inherited channel waiver. */
export const declareRedTeamAllocation = (input: RedTeamAllocationInput): Readonly<RedTeamLedger> => {
  canonical(input)
  if (!exact(input, ["phase", "evidenceClass", "authorityRoot", "channels", "probes"]) || input.phase !== 265 || !["empirical", "injected_fixture"].includes(input.evidenceClass) || !isRoot(input.authorityRoot) || !Array.isArray(input.channels) || input.channels.length !== RED_TEAM_CHANNELS.length || new Set(input.channels.map((row) => row.channel)).size !== RED_TEAM_CHANNELS.length) fail("ALLOCATION")
  for (const row of input.channels) {
    if (!exact(row, ["channel", "disposition", "opportunities", "ceilings", "perAttempt", "retryLimit", "participants", "reviewers", "disclosure", "conflicts", "provenance", "burn"]) || !RED_TEAM_CHANNELS.includes(row.channel) || !["allocated", "authorized_zero"].includes(row.disposition) || !integer(row.opportunities) || !integer(row.retryLimit) || row.retryLimit > row.opportunities || !identifiers(row.participants) || !identifiers(row.reviewers) || row.disclosure !== "complete-source-build-and-dependencies" || row.conflicts !== "distinct-reviewer" || row.provenance !== "explicit-deterministic-data-only" || row.burn !== "reserve-full-no-refund") fail("CHANNEL")
    resources(row.ceilings); resources(row.perAttempt)
    if (RESOURCE_KEYS.some((key) => row.perAttempt[key] > row.ceilings[key])) fail("CHANNEL_RESOURCES")
    if (row.disposition === "authorized_zero") {
      if (row.opportunities !== 0 || row.retryLimit !== 0 || row.participants.length || row.reviewers.length || RESOURCE_KEYS.some((key) => row.ceilings[key] !== 0 || row.perAttempt[key] !== 0)) fail("ZERO_AUTHORIZATION")
    } else if (!row.opportunities || !row.participants.length || !row.reviewers.length || row.participants.some((participant: string) => !row.reviewers.some((reviewer: string) => reviewer !== participant))) fail("CHANNEL_POLICY")
  }
  if (!Array.isArray(input.probes) || input.probes.length !== LEAGUE_PROBES.length || new Set(input.probes.map((row) => row.family)).size !== LEAGUE_PROBES.length) fail("PROBE_ALLOCATION")
  for (const probe of input.probes) {
    if (!exact(probe, ["family", "pairs", "maximumAbsoluteMeanDelta"]) || !LEAGUE_PROBES.includes(probe.family) || !integer(probe.pairs) || !probe.pairs) fail("PROBE_ALLOCATION")
    const bound = probe.maximumAbsoluteMeanDelta
    if (IDENTITIES.includes(probe.family)) { if (bound !== null) fail("IDENTITY_BOUND") }
    else if (!exact(bound, ["numerator", "denominator"]) || !bound || !integer(bound.numerator) || !integer(bound.denominator) || !bound.denominator || bound.numerator > bound.denominator) fail("MATERIAL_BOUND_REQUIRED")
  }
  return ledger(rooted("league-red-team-allocation-v1", { ...input, channels: RED_TEAM_CHANNELS.map((channel) => input.channels.find((row) => row.channel === channel)!), probes: LEAGUE_PROBES.map((family) => input.probes.find((row) => row.family === family)!) }), [], [], [])
}

/** Return the immutable start BEFORE invoking work; the coordinator persists it before dispatch. */
export const startRedTeamAttempt = (input: Omit<RedTeamAttemptStart, "root" | "allocationRoot" | "ordinal"> & { readonly ledger: RedTeamLedger }): Readonly<RedTeamLedger> => {
  verifyLedger(input.ledger)
  const state = input.ledger, row = state.allocation.channels.find((entry) => entry.channel === input.channel)
  if (!row || row.disposition !== "allocated" || ![input.roundRoot, input.candidateRoot, input.disclosureRoot, input.provenanceRoot, input.inputRoot].every(isRoot) || !row.participants.includes(input.participantId) || !row.reviewers.includes(input.reviewerId) || input.participantId === input.reviewerId) fail("ATTEMPT_POLICY")
  if (state.starts.some((start) => !state.terminals.some((terminal) => terminal.startRoot === start.root))) fail("UNTERMINATED_CHARGE")
  const prior = state.starts.filter((start) => start.channel === row.channel), reservation = resources(input.reservation)
  if (prior.length >= row.opportunities || RESOURCE_KEYS.some((key) => reservation[key] > row.perAttempt[key] || prior.reduce((sum, start) => sum + start.reservation[key], 0) + reservation[key] > row.ceilings[key])) fail("CAPACITY")
  if (input.retryParentRoot !== null) {
    const parent = prior.find((start) => start.root === input.retryParentRoot)
    if (!parent || parent.roundRoot !== input.roundRoot || parent.candidateRoot !== input.candidateRoot || parent.inputRoot !== input.inputRoot || parent.participantId !== input.participantId || prior.filter((start) => start.retryParentRoot !== null).length >= row.retryLimit) fail("RETRY")
  }
  const { ledger: _ledger, ...body } = input
  const start = rooted("league-red-team-start-v1", { ...body, allocationRoot: state.allocation.root, ordinal: prior.length })
  return ledger(state.allocation, [...state.starts, start], state.terminals, state.probes)
}

export const terminalizeRedTeamAttempt = (input: Omit<RedTeamAttemptTerminal, "root" | "charge" | "processValidity"> & { readonly ledger: RedTeamLedger }): Readonly<RedTeamLedger> => {
  verifyLedger(input.ledger)
  const state = input.ledger, start = state.starts.find((row) => row.root === input.startRoot)
  if (!start || state.terminals.some((row) => row.startRoot === start.root) || !DISPOSITIONS.includes(input.disposition) || !Array.isArray(input.evidenceRoots) || !input.evidenceRoots.length || !input.evidenceRoots.every(isRoot) || new Set(input.evidenceRoots).size !== input.evidenceRoots.length || (input.candidateAdmissionRoot !== null && !isRoot(input.candidateAdmissionRoot)) || (input.disposition === "success") !== (input.candidateAdmissionRoot !== null)) fail("TERMINAL")
  if (input.usage !== null && RESOURCE_KEYS.some((key) => resources(input.usage)[key] > start.reservation[key])) fail("USAGE")
  if (input.usage === null && input.disposition !== "system_failure") fail("UNKNOWN_USAGE")
  const { ledger: _ledger, ...body } = input
  const terminal = rooted("league-red-team-terminal-v1", { ...body, evidenceRoots: [...body.evidenceRoots].sort(), charge: start.reservation, processValidity: ["invalid", "player_violation", "system_failure"].includes(input.disposition) ? "process_invalid" as const : "process_valid" as const })
  return ledger(state.allocation, state.starts, [...state.terminals, terminal], state.probes)
}

/** Identity probes compare normalized canonical bytes; real condition changes compare exact paired scores. */
export const recordLeagueProbe = (input: Target & { readonly ledger: RedTeamLedger; readonly family: LeagueProbeFamily; readonly pairs: readonly LeagueProbePair[] }): Readonly<RedTeamLedger> => {
  verifyLedger(input.ledger)
  const state = input.ledger, allocation = state.allocation.probes.find((row) => row.family === input.family)
  if (!allocation || !isRoot(input.roundRoot) || !isRoot(input.candidateRoot) || !Array.isArray(input.pairs) || input.pairs.length !== allocation.pairs || state.probes.some((row) => row.family === input.family && row.roundRoot === input.roundRoot && row.candidateRoot === input.candidateRoot)) fail("PROBE_COVERAGE")
  const identity = IDENTITIES.includes(input.family)
  for (const pair of input.pairs) for (const observation of [pair.left, pair.right]) {
    if (!exact(observation, ["canonicalBytes", "halfPoints", "conditionRoot", "evidenceRoot"]) || typeof observation.canonicalBytes !== "string" || !observation.canonicalBytes.length || ![0, 1, 2].includes(observation.halfPoints) || !isRoot(observation.conditionRoot) || !isRoot(observation.evidenceRoot)) fail("PROBE_OBSERVATION")
  }
  if (input.pairs.some((pair) => identity ? pair.left.conditionRoot !== pair.right.conditionRoot : pair.left.conditionRoot === pair.right.conditionRoot)) fail("PROBE_CONDITIONS")
  const delta = input.pairs.reduce((sum, pair) => sum + BigInt(pair.left.halfPoints - pair.right.halfPoints), 0n), magnitude = delta < 0n ? -delta : delta, bound = allocation.maximumAbsoluteMeanDelta
  const passed = identity ? input.pairs.every((pair) => pair.left.canonicalBytes === pair.right.canonicalBytes && pair.left.halfPoints === pair.right.halfPoints) : magnitude * BigInt(bound!.denominator) <= BigInt(bound!.numerator) * 2n * BigInt(input.pairs.length)
  const receipt = rooted("league-probe-receipt-v1", { allocationRoot: state.allocation.root, roundRoot: input.roundRoot, candidateRoot: input.candidateRoot, family: input.family, criterion: identity ? "byte_identity" as const : "paired_contrast" as const, pairs: input.pairs, passed, processValidity: identity && !passed ? "process_invalid" as const : "process_valid" as const })
  return ledger(state.allocation, state.starts, state.terminals, [...state.probes, receipt])
}

export interface AcceptedCounterAssessment {
  readonly targetRoot: LabRoot
  readonly fingerprintEvidenceRoot: LabRoot
  readonly independentCounterfactualRelations: readonly ("distinct" | "correlated" | "borderline")[]
  readonly existingCandidateRoots: readonly LabRoot[]
  readonly completeTargetScores: readonly Readonly<{ targetRoot: LabRoot; numerator: number; denominator: number; evidenceRoot: LabRoot }>[]
}
/** This is an actual Plan 04 admission, not a narrative recommendation to re-enter. */
export const reenterAcceptedCounter = (input: { readonly ledger: RedTeamLedger; readonly startRoot: LabRoot; readonly round: DeclaredLeagueRound; readonly candidateAdmission: unknown; readonly assessment: AcceptedCounterAssessment }): Readonly<LeagueResponseRow> => {
  verifyLedger(input.ledger)
  const terminal = input.ledger.terminals.find((row) => row.startRoot === input.startRoot), start = input.ledger.starts.find((row) => row.root === input.startRoot)
  if (!start || !terminal || terminal.disposition !== "success" || terminal.processValidity !== "process_valid" || start.roundRoot !== input.round.round.root) fail("COUNTER_TERMINAL")
  const candidate = LeagueCandidateAdmissionSchema.parse(input.candidateAdmission), evidence = input.assessment
  if (candidate.root !== terminal.candidateAdmissionRoot || evidence.targetRoot !== input.round.target.root || !isRoot(evidence.fingerprintEvidenceRoot) || !evidence.independentCounterfactualRelations.length || evidence.independentCounterfactualRelations.some((value) => value !== "distinct") || evidence.existingCandidateRoots.includes(candidate.candidate.root)) fail("COUNTER_ADMISSION")
  const targets = [...new Set([input.round.target.mixtureRoot, input.round.target.strongestPureCandidateRoot, input.round.target.vulnerablePureCandidateRoot])].sort()
  if (evidence.completeTargetScores.length !== targets.length || new Set(evidence.completeTargetScores.map((row) => row.targetRoot)).size !== targets.length || targets.some((targetRoot) => !evidence.completeTargetScores.some((row) => row.targetRoot === targetRoot))) fail("COUNTER_TARGET_COVERAGE")
  for (const row of evidence.completeTargetScores) if (!integer(row.numerator) || !integer(row.denominator) || !row.denominator || row.numerator > row.denominator || !isRoot(row.evidenceRoot) || BigInt(row.numerator) * 100n <= BigInt(row.denominator) * 55n) fail("COUNTER_NOT_POSITIVE")
  return admitLeagueResponse({ round: input.round, candidateAdmission: candidate, ordinal: start.ordinal, terminal: { disposition: "success", legal: "verified", runtime: "accepted", provenance: "verified", independence: "independent", novelty: "novel", positive: "positive", evidenceRoot: labRoot("league-counter-assessment-v1", { terminalRoot: terminal.root, evidence }) } })
}

/** Unused opportunities and resource remainders are retained, never refunded or silently omitted. */
export const closeRedTeamLedger = (input: { readonly ledger: RedTeamLedger; readonly requiredTargets: readonly Target[]; readonly reentries: readonly LeagueResponseRow[] }) => {
  verifyLedger(input.ledger)
  const state = input.ledger
  if (state.starts.length !== state.terminals.length || input.requiredTargets.length === 0 || input.requiredTargets.some((target) => LEAGUE_PROBES.some((family) => !state.probes.some((probe) => probe.family === family && probe.roundRoot === target.roundRoot && probe.candidateRoot === target.candidateRoot)))) fail("CLOSURE_COVERAGE")
  if (state.terminals.filter((row) => row.disposition === "success").some((row) => !input.reentries.some((reentry) => reentry.disposition === "success" && reentry.candidateAdmissionRoot === row.candidateAdmissionRoot && reentry.roundRoot === state.starts.find((start) => start.root === row.startRoot)!.roundRoot))) fail("COUNTER_REENTRY_REQUIRED")
  const capacity = state.allocation.channels.map((row) => {
    const starts = state.starts.filter((start) => start.channel === row.channel)
    return { channel: row.channel, disposition: row.disposition, attempted: starts.length, unusedOpportunities: row.opportunities - starts.length, charged: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, starts.reduce((sum, start) => sum + start.reservation[key], 0)])), unused: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, row.ceilings[key] - starts.reduce((sum, start) => sum + start.reservation[key], 0)])) }
  })
  return rooted("league-red-team-close-v1", { ledgerRoot: state.root, allocationRoot: state.allocation.root, requiredTargets: input.requiredTargets, capacity, reentryRoots: input.reentries.map((row) => row.root).sort(), processValidity: state.terminals.some((row) => row.processValidity === "process_invalid") || state.probes.some((row) => row.processValidity === "process_invalid") ? "process_invalid" as const : "process_valid" as const, materialDependencePassed: state.probes.every((row) => row.passed) })
}
