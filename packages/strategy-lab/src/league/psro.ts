import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import {
  CompletePayoffSnapshotSchema,
  createLeagueMixture,
  createLeagueResponseAdmission,
  createLeagueRound,
  LeagueCandidateAdmissionSchema,
  LeagueSolverOutputSchema,
  type LeagueResponseAdmission,
  type LeagueRound,
} from "./contracts.js"
import type { LeagueSolverResult } from "./solver.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const fail = (code: string): never => { throw new TypeError(`LEAGUE_PSRO_${code}`) }
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")

type ResponseDisposition = "success" | "invalid" | "duplicate" | "legal_but_weak" | "retried" | "unfilled" | "unused" | "rejected" | "player_violation" | "system_failure"
type ResponseTerminalInput = Readonly<{
  disposition: ResponseDisposition
  legal: "verified" | "invalid"
  runtime: "accepted" | "player_violation" | "system_failure"
  provenance: "verified" | "unverified"
  independence: "independent" | "clone" | "unresolved"
  novelty: "novel" | "duplicate" | "weak"
  positive: "positive" | "weak"
  evidenceRoot: LabRoot
}>

export interface LeagueRoundTarget {
  readonly root: LabRoot
  readonly snapshotRoot: LabRoot
  readonly solverManifestRoot: LabRoot
  readonly solverOutputRoot: LabRoot
  readonly mixtureRoot: LabRoot
  readonly strongestPureCandidateRoot: LabRoot
  readonly vulnerablePureCandidateRoot: LabRoot
  readonly closureRule: "bounded-no-accepted-counter-v1"
}
export interface DeclaredLeagueRound {
  readonly round: Readonly<LeagueRound>
  readonly target: Readonly<LeagueRoundTarget>
  readonly snapshotRoot: LabRoot
  readonly responseAllocationRoot: LabRoot
  readonly roundOrdinal: number
  readonly maximumRounds: number
  /** A root-only charge exists before any response evidence is admitted. */
  readonly charge: Readonly<{ startRoot: LabRoot }>
}
export interface LeagueResponseRow extends Readonly<LeagueResponseAdmission> {
  readonly chargeStartRoot: LabRoot
  readonly terminalRoot: LabRoot
  readonly candidateAdmissionRoot: LabRoot
}

const terminalRoot = (round: DeclaredLeagueRound, candidateAdmissionRoot: LabRoot, ordinal: number, terminal: ResponseTerminalInput): LabRoot =>
  labRoot("league-response-terminal-v1", { roundRoot: round.round.root, candidateAdmissionRoot, ordinal, ...terminal })
const chargeRoot = (round: DeclaredLeagueRound, candidateAdmissionRoot: LabRoot, ordinal: number): LabRoot =>
  labRoot("league-response-charge-v1", { roundRoot: round.round.root, responseAllocationRoot: round.responseAllocationRoot, candidateAdmissionRoot, ordinal })
const isAccepted = (terminal: ResponseTerminalInput) => terminal.disposition === "success" && terminal.legal === "verified" && terminal.runtime === "accepted" && terminal.provenance === "verified" && terminal.independence === "independent" && terminal.novelty === "novel" && terminal.positive === "positive"

/** Freeze one solver result, mixture, named pures, allocation, and closure rule before any response can start. */
export const declareLeagueRound = (input: { readonly snapshot: unknown; readonly solver: LeagueSolverResult; readonly responseAllocationRoot: LabRoot; readonly roundOrdinal: number; readonly maximumRounds: number; readonly closureRule: "bounded-no-accepted-counter-v1" }): Readonly<DeclaredLeagueRound> => {
  const snapshot = CompletePayoffSnapshotSchema.parse(input.snapshot)
  if (input.solver.status !== "solved" || !root(input.responseAllocationRoot) || input.solver.manifest.snapshotRoot !== snapshot.root || input.solver.output.snapshotRoot !== snapshot.root || !Number.isSafeInteger(input.roundOrdinal) || input.roundOrdinal < 0 || !Number.isSafeInteger(input.maximumRounds) || input.maximumRounds < 1 || input.roundOrdinal >= input.maximumRounds || input.closureRule !== "bounded-no-accepted-counter-v1") return fail("ROUND_INPUT")
  const output = LeagueSolverOutputSchema.parse(input.solver.output)
  const mixture = createLeagueMixture({ solverOutputRoot: output.root, weightRoot: output.distributionRoot, snapshotRoot: snapshot.root })
  const targetValue = {
    snapshotRoot: snapshot.root, solverManifestRoot: input.solver.manifest.root, solverOutputRoot: output.root, mixtureRoot: mixture.root,
    strongestPureCandidateRoot: input.solver.strongestPureCandidateRoot, vulnerablePureCandidateRoot: input.solver.vulnerablePureCandidateRoot,
    closureRule: input.closureRule,
  }
  const target = freezeLabValue({ ...targetValue, root: labRoot("league-target-v1", targetValue) }) as LeagueRoundTarget
  const round = createLeagueRound({ priorSnapshotRoot: snapshot.root, solverOutputRoot: output.root, targetRoot: target.root, responseAllocationRoot: input.responseAllocationRoot })
  const charge = freezeLabValue({ startRoot: labRoot("league-round-charge-v1", { roundRoot: round.root, responseAllocationRoot: input.responseAllocationRoot }) })
  return freezeLabValue({ round, target, snapshotRoot: snapshot.root, responseAllocationRoot: input.responseAllocationRoot, roundOrdinal: input.roundOrdinal, maximumRounds: input.maximumRounds, charge }) as DeclaredLeagueRound
}

/** Admit a response from derived terminal receipts, never caller-selected success booleans or bare gate roots. */
export const admitLeagueResponse = (input: { readonly round: DeclaredLeagueRound; readonly candidateAdmission: unknown; readonly ordinal: number; readonly terminal: unknown }): Readonly<LeagueResponseRow> => {
  if (!input.round || !Number.isSafeInteger(input.ordinal) || input.ordinal < 0) return fail("RESPONSE_INPUT")
  const round = input.round
  if (round.round.priorSnapshotRoot !== round.snapshotRoot || round.round.responseAllocationRoot !== round.responseAllocationRoot || round.round.targetRoot !== round.target.root) return fail("ROUND_REWRITE")
  const candidate = LeagueCandidateAdmissionSchema.parse(input.candidateAdmission)
  if (!exact(input.terminal, ["disposition", "legal", "runtime", "provenance", "independence", "novelty", "positive", "evidenceRoot"]) || !root(input.terminal.evidenceRoot) || !["success", "invalid", "duplicate", "legal_but_weak", "retried", "unfilled", "unused", "rejected", "player_violation", "system_failure"].includes(String(input.terminal.disposition)) || !["verified", "invalid"].includes(String(input.terminal.legal)) || !["accepted", "player_violation", "system_failure"].includes(String(input.terminal.runtime)) || !["verified", "unverified"].includes(String(input.terminal.provenance)) || !["independent", "clone", "unresolved"].includes(String(input.terminal.independence)) || !["novel", "duplicate", "weak"].includes(String(input.terminal.novelty)) || !["positive", "weak"].includes(String(input.terminal.positive))) return fail("TERMINAL_RECEIPT")
  const terminal = input.terminal as ResponseTerminalInput
  const chargeStartRoot = chargeRoot(round, candidate.root, input.ordinal)
  const receiptRoot = terminalRoot(round, candidate.root, input.ordinal, terminal)
  const accepted = isAccepted(terminal)
  if ((terminal.disposition === "success") !== accepted) return fail("TERMINAL_CONTRADICTION")
  const validationRoot = labRoot("league-response-validation-v1", { terminalRoot: receiptRoot, legal: terminal.legal, runtime: terminal.runtime, provenance: terminal.provenance })
  const noveltyRoot = labRoot("league-response-novelty-v1", { terminalRoot: receiptRoot, independence: terminal.independence, novelty: terminal.novelty, positive: terminal.positive })
  const admission = createLeagueResponseAdmission({ roundRoot: round.round.root, candidateAdmissionRoot: candidate.root, noveltyRoot, validationRoot, disposition: terminal.disposition })
  return freezeLabValue({ ...admission, chargeStartRoot, terminalRoot: receiptRoot, candidateAdmissionRoot: candidate.root }) as LeagueResponseRow
}

export type LeagueRoundAdvance =
  | Readonly<{ kind: "fresh_snapshot_required"; priorRoundRoot: LabRoot; nextPopulationRoot: LabRoot; nextSnapshotRoot: LabRoot; acceptedCandidateAdmissionRoots: readonly LabRoot[]; retainedTerminalRoots: readonly LabRoot[] }>
  | Readonly<{ kind: "continue_response_loop"; priorRoundRoot: LabRoot; retainedTerminalRoots: readonly LabRoot[] }>
  | Readonly<{ kind: "closed"; priorRoundRoot: LabRoot; retainedTerminalRoots: readonly LabRoot[] }>

/** A successful late counter always creates a new population/snapshot branch and cannot close the historical round. */
export const advanceLeagueRound = (input: { readonly round: DeclaredLeagueRound; readonly admissions: readonly LeagueResponseRow[]; readonly requestClosure: boolean; readonly nextPopulationRoot?: LabRoot; readonly nextSnapshot?: unknown }): LeagueRoundAdvance => {
  const round = input.round
  if (!round || !Array.isArray(input.admissions) || new Set(input.admissions.map((entry) => entry.root)).size !== input.admissions.length || input.admissions.some((entry) => entry.roundRoot !== round.round.root || !root(entry.chargeStartRoot) || !root(entry.terminalRoot))) return fail("ADVANCE_INPUT")
  const retainedTerminalRoots = Object.freeze(input.admissions.map((entry) => entry.terminalRoot).sort())
  const accepted = input.admissions.filter((entry) => entry.disposition === "success").map((entry) => entry.candidateAdmissionRoot).sort()
  if (accepted.length) {
    if (input.requestClosure) return fail("EARLY_CLOSURE")
    if (!root(input.nextPopulationRoot)) return fail("FRESH_SNAPSHOT")
    let nextSnapshot: LabRoot
    try { nextSnapshot = CompletePayoffSnapshotSchema.parse(input.nextSnapshot).root } catch { return fail("FRESH_SNAPSHOT") }
    if (nextSnapshot === round.snapshotRoot) return fail("FRESH_SNAPSHOT")
    return freezeLabValue({ kind: "fresh_snapshot_required" as const, priorRoundRoot: round.round.root, nextPopulationRoot: input.nextPopulationRoot, nextSnapshotRoot: nextSnapshot, acceptedCandidateAdmissionRoots: Object.freeze(accepted), retainedTerminalRoots }) as LeagueRoundAdvance
  }
  if (input.requestClosure && round.roundOrdinal + 1 < round.maximumRounds) return fail("EARLY_CLOSURE")
  return freezeLabValue(input.requestClosure
    ? { kind: "closed" as const, priorRoundRoot: round.round.root, retainedTerminalRoots }
    : { kind: "continue_response_loop" as const, priorRoundRoot: round.round.root, retainedTerminalRoots }) as LeagueRoundAdvance
}
