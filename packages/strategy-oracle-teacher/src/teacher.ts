import { MATCH_KERNEL, type RunMatchInput } from "../../engine/src/index.js"
import { createHash } from "node:crypto"

/** Private-only state for offline counterfactual exploration. It is never part of a student record. */
export interface TeacherCounterfactualState {
  readonly opponentHypothesis: "cautious" | "aggressive"
  readonly hiddenBranchBias: number
}

export interface TeacherSearchRequest {
  readonly canonicalMatch: RunMatchInput
  readonly counterfactual: TeacherCounterfactualState
}

export interface TeacherSearchReceipt {
  readonly canonicalTransitionRoot: `sha256:${string}`
  readonly selectedTemplate: "stone" | "turn-up"
  readonly offlineOnly: true
}

const root = (value: unknown): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`

/**
 * Evaluates the first authoritative transition through the exported kernel.
 * This package has no local rules, geometry resolver, Action scorer, or search tree.
 */
export const searchCanonicalCounterfactual = (request: TeacherSearchRequest): TeacherSearchReceipt => {
  if (!Number.isSafeInteger(request.counterfactual.hiddenBranchBias)) throw new TypeError("TEACHER_COUNTERFACTUAL_BIAS")
  const machine = MATCH_KERNEL.createMachine(request.canonicalMatch)
  const transition = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
  const canonicalTransitionRoot = root({ tuple: MATCH_KERNEL.tupleId, transition })
  const signal = canonicalTransitionRoot.charCodeAt(canonicalTransitionRoot.length - 1) + request.counterfactual.hiddenBranchBias + (request.counterfactual.opponentHypothesis === "aggressive" ? 1 : 0)
  return Object.freeze({ canonicalTransitionRoot, selectedTemplate: signal % 2 === 0 ? "stone" : "turn-up", offlineOnly: true })
}
