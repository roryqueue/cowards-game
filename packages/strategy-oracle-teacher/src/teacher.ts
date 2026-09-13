import { MATCH_KERNEL, type RunMatchInput } from "../../engine/src/index.js"
import { createHash } from "node:crypto"

export interface TeacherCounterfactualState { readonly opponentHypothesis: "cautious" | "aggressive"; readonly hiddenBranchBias: number }
export interface TeacherSearchRequest { readonly canonicalMatch: RunMatchInput; readonly counterfactual: TeacherCounterfactualState; readonly maxDepth?: number; readonly maxNodes?: number }
export interface TeacherSearchReceipt { readonly canonicalTransitionRoot: `sha256:${string}`; readonly selectedTemplate: string; readonly depthReached: number; readonly nodesVisited: number; readonly alternativesEvaluated: number; readonly outcomeRoots: readonly `sha256:${string}`[]; readonly offlineOnly: true }
const root = (value: unknown): `sha256:${string}` => `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`

/**
 * Bounded private counterfactual frontier. Each branch is a distinct canonical
 * Match seed and every evaluated transition is delegated to MATCH_KERNEL; no
 * rule, geometry, Action resolver, or tactical scorer is duplicated here.
 */
export const searchCanonicalCounterfactual = (request: TeacherSearchRequest): TeacherSearchReceipt => {
  if (!Number.isSafeInteger(request.counterfactual.hiddenBranchBias)) throw new TypeError("TEACHER_COUNTERFACTUAL_BIAS")
  const maxDepth = request.maxDepth ?? 3, maxNodes = request.maxNodes ?? 24
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 2 || maxDepth > 6 || !Number.isSafeInteger(maxNodes) || maxNodes < 2 || maxNodes > 64) throw new TypeError("TEACHER_SEARCH_BUDGET")
  const branchCount = Math.min(3, maxNodes)
  const outcomes: { label: string; score: number; root: `sha256:${string}` }[] = []
  for (let branch = 0; branch < branchCount; branch++) {
    const machine = MATCH_KERNEL.createMachine({ ...request.canonicalMatch, seed: `${request.canonicalMatch.seed}:teacher-branch:${branch}` })
    let cursor = machine, score = 0, depth = 0
    for (; depth < maxDepth; depth++) {
      const result = MATCH_KERNEL.stepMatch(cursor, { kind: "advance" })
      const transitionRoot = root({ tuple: MATCH_KERNEL.tupleId, branch, depth, result })
      score += result.kind === "completed" ? 1000 + result.record.events.length : result.kind === "failure" ? -1000 : result.kind === "transition" ? result.record.events.length : 0
      outcomes.push({ label: `branch-${branch}-depth-${depth}`, score, root: transitionRoot })
      if (result.kind !== "transition") break
      cursor = result.machine
    }
  }
  const selected = [...outcomes].sort((left, right) => right.score - left.score || left.root.localeCompare(right.root))[0]
  if (!selected) throw new TypeError("TEACHER_EMPTY_FRONTIER")
  return Object.freeze({ canonicalTransitionRoot: selected.root, selectedTemplate: selected.label, depthReached: maxDepth, nodesVisited: outcomes.length, alternativesEvaluated: branchCount, outcomeRoots: Object.freeze(outcomes.map((outcome) => outcome.root)), offlineOnly: true })
}
