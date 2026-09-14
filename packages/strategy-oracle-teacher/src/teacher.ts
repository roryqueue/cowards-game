import { MATCH_KERNEL, type RunMatchInput } from "../../engine/src/index.js"
import { createHash } from "node:crypto"

export interface TeacherCounterfactualState { readonly opponentHypothesis: "cautious" | "aggressive" }
export interface TeacherSearchRequest { readonly canonicalMatch: RunMatchInput; readonly counterfactual: TeacherCounterfactualState; readonly maxDepth?: number; readonly maxNodes?: number }
export interface TeacherSearchReceipt { readonly canonicalTransitionRoot: `sha256:${string}`; readonly selectedTemplate: string; readonly depthReached: number; readonly nodesVisited: number; readonly alternativesEvaluated: number; readonly outcomeRoots: readonly `sha256:${string}`[]; readonly offlineOnly: true }
const root = (value: unknown): `sha256:${string}` => `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`

/**
 * Bounded private counterfactual frontier. Each branch is a distinct canonical
 * Match seed and every evaluated transition is delegated to MATCH_KERNEL; no
 * rule, geometry, Action resolver, or tactical scorer is duplicated here.
 */
export const searchCanonicalCounterfactual = (request: TeacherSearchRequest): TeacherSearchReceipt => {
  const maxDepth = request.maxDepth ?? 3, maxNodes = request.maxNodes ?? 24
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 2 || maxDepth > 6 || !Number.isSafeInteger(maxNodes) || maxNodes < 2 || maxNodes > 64) throw new TypeError("TEACHER_SEARCH_BUDGET")
  let calls = 0, actualDepth = 0
  const call = <T>(operation: () => T): T => { if (calls >= maxNodes) throw new TypeError("TEACHER_NODE_CAP"); calls++; return operation() }
  const branchCount = Math.min(3, maxNodes)
  const outcomes: { label: string; score: number; root: `sha256:${string}` }[] = []
  for (let branch = 0; branch < branchCount; branch++) {
    const machine = call(() => MATCH_KERNEL.createMachineV119({ ...request.canonicalMatch, initialInitiativePlayerId: branch % 2 === 0 ? request.canonicalMatch.bottomPlayerId : request.canonicalMatch.topPlayerId }))
    let cursor = machine, score = 0, depth = 0
    for (; depth < maxDepth; depth++) {
      if (calls >= maxNodes) break
      const result = call(() => MATCH_KERNEL.stepMatch(cursor, { kind: "advance" }))
      const transitionRoot = root({ tuple: MATCH_KERNEL.tupleId, branch, depth, result })
      score += result.kind === "completed" ? 1000 + result.record.events.length : result.kind === "failure" ? -1000 : result.kind === "transition" ? result.record.events.length : 0
      outcomes.push({ label: `branch-${branch}-depth-${depth}`, score, root: transitionRoot })
      actualDepth = Math.max(actualDepth, depth + 1)
      if (result.kind === "effect" && calls < maxNodes) {
        const value = result.request.kind === "soldierBrain" ? { action: request.counterfactual.opponentHypothesis === "aggressive" ? { type: "MOVE", direction: "UP" } : { type: "TURN", direction: "UP" }, soldierMemory: {} } : { activationOrders: [], strategyMemory: {} }
        const resumed = call(() => MATCH_KERNEL.stepMatch(result.machine, { kind: "runtime_resume", requestId: result.request.requestId, effectKind: result.request.kind, classification: "success", value }))
        outcomes.push({ label: `branch-${branch}-response-${request.counterfactual.opponentHypothesis}`, score: score + (resumed.kind === "failure" ? -1000 : resumed.kind === "transition" ? resumed.record.events.length : 0) + (request.counterfactual.opponentHypothesis === "aggressive" ? 1 : 0), root: root({ resumed }) })
      }
      if (result.kind !== "transition") break
      cursor = result.machine
    }
  }
  const selected = [...outcomes].sort((left, right) => right.score - left.score || left.root.localeCompare(right.root))[0]
  if (!selected) throw new TypeError("TEACHER_EMPTY_FRONTIER")
  return Object.freeze({ canonicalTransitionRoot: selected.root, selectedTemplate: selected.label, depthReached: actualDepth, nodesVisited: calls, alternativesEvaluated: branchCount, outcomeRoots: Object.freeze(outcomes.map((outcome) => outcome.root)), offlineOnly: true })
}
