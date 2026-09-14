import { createHash } from "node:crypto"
import {
  ActionSchema,
  SoldierBrainInputV119Schema,
  StrategyInputV119Schema,
  StrategyResultSchema,
  type Action,
  type StrategyResult,
} from "../../spec/src/index.js"
import { MATCH_KERNEL, type GameState, type RunMatchInput } from "../../engine/src/index.js"

type Root = `sha256:${string}`
type ParsedStrategyInput = ReturnType<typeof StrategyInputV119Schema.parse>
type ParsedBrainInput = ReturnType<typeof SoldierBrainInputV119Schema.parse>
type CanonicalMatchSeed = Omit<RunMatchInput, "runtime"> & {
  readonly initialInitiativePlayerId: string
}

export interface TeacherCounterfactualState {
  readonly opponentHypothesis: "cautious" | "aggressive"
}

export interface TeacherSearchRequest {
  readonly canonicalMatch: CanonicalMatchSeed
  readonly studentPlayerId: string
  readonly counterfactual: TeacherCounterfactualState
  /** Maximum number of student decisions in a branch, including selection. */
  readonly maxDepth?: number
  /** Global cap across machine creation and every canonical kernel resume/advance. */
  readonly maxNodes?: number
}

export type TeacherLegalTarget =
  | {
      readonly kind: "activation"
      readonly input: ParsedStrategyInput
      readonly target: "press" | "screen"
    }
  | {
      readonly kind: "brain"
      readonly input: ParsedBrainInput
      readonly target: Action
    }

export interface TeacherSearchReceipt {
  readonly canonicalTransitionRoot: Root
  readonly selectedTemplate: string | null
  readonly selectedOutcomeRoot: Root
  readonly depthReached: number
  readonly nodesVisited: number
  readonly alternativesEvaluated: number
  readonly outcomeRoots: readonly Root[]
  readonly outcomes: readonly TeacherOutcomeSummary[]
  /** Schema-admitted observations and targets from the selected canonical branch only. */
  readonly selectedLegalTargets: readonly TeacherLegalTarget[]
  readonly offlineOnly: true
}

export interface TeacherOutcomeSummary {
  readonly template: string
  readonly score: readonly number[]
  readonly stateRoot: Root
  readonly terminal: "win" | "loss" | "draw" | "failed" | "nonterminal"
  readonly outcomeRoot: Root
}

type Template = Readonly<{
  id: string
  activationMode: "press" | "screen"
  brainMode: "move" | "turn" | "stone"
}>

type SearchBranch = {
  template: Template
  machine: ReturnType<typeof MATCH_KERNEL.createMachineV119>
  depth: number
  targets: TeacherLegalTarget[]
  evaluated: boolean
  done: boolean
  failed: boolean
}

const TEMPLATES: readonly Template[] = Object.freeze([
  Object.freeze({ id: "press-advance", activationMode: "press", brainMode: "move" }),
  Object.freeze({ id: "press-reorient", activationMode: "press", brainMode: "turn" }),
  Object.freeze({ id: "screen-anchor", activationMode: "screen", brainMode: "stone" }),
])

const root = (value: unknown): Root =>
  `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

const distance = (left: { x: number; y: number }, right: { x: number; y: number }) =>
  Math.abs(left.x - right.x) + Math.abs(left.y - right.y)

const selectionResponse = (
  input: ParsedStrategyInput,
  mode: "press" | "screen",
): StrategyResult => {
  const active = input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position)
  const ordered = [...active].sort((left, right) => {
    const leftPosition = left.position!
    const rightPosition = right.position!
    if (mode === "press") {
      const leftEnemy = Math.min(...input.enemySoldiers.filter((enemy) => enemy.position).map((enemy) => distance(leftPosition, enemy.position!)), Number.MAX_SAFE_INTEGER)
      const rightEnemy = Math.min(...input.enemySoldiers.filter((enemy) => enemy.position).map((enemy) => distance(rightPosition, enemy.position!)), Number.MAX_SAFE_INTEGER)
      return leftEnemy - rightEnemy || leftPosition.y - rightPosition.y || leftPosition.x - rightPosition.x
    }
    const leftEdge = Math.min(leftPosition.x - input.board.bounds.minX, input.board.bounds.maxX - leftPosition.x, leftPosition.y - input.board.bounds.minY, input.board.bounds.maxY - leftPosition.y)
    const rightEdge = Math.min(rightPosition.x - input.board.bounds.minX, input.board.bounds.maxX - rightPosition.x, rightPosition.y - input.board.bounds.minY, input.board.bounds.maxY - rightPosition.y)
    return leftEdge - rightEdge || leftPosition.x - rightPosition.x || leftPosition.y - rightPosition.y
  })
  const orders = ordered.slice(0, input.activationCount).map((soldier) => ({
    soldierId: soldier.id,
    objective: {
      schemaVersion: "teacher-legal-mission-v1",
      mode,
      goal: soldier.position,
    },
  }))
  return StrategyResultSchema.parse({ activationOrders: orders, strategyMemory: {} }) as StrategyResult
}

const nearestEnemyDirection = (input: ParsedBrainInput) => {
  const enemy = input.awarenessGrid.cells
    .filter((cell) => cell.contents === "ENEMY_ACTIVE")
    .sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - Math.abs(right.dx) - Math.abs(right.dy) || left.dy - right.dy || left.dx - right.dx)[0]
  if (!enemy) return input.self.facing ?? "UP"
  return Math.abs(enemy.dx) >= Math.abs(enemy.dy)
    ? enemy.dx >= 0 ? "RIGHT" as const : "LEFT" as const
    : enemy.dy >= 0 ? "DOWN" as const : "UP" as const
}

const brainResponse = (input: ParsedBrainInput, mode: Template["brainMode"]): Action => {
  if (mode === "stone") return ActionSchema.parse({ type: "TURN_TO_STONE" })
  const direction = mode === "move" ? input.self.facing ?? "UP" : nearestEnemyDirection(input)
  return ActionSchema.parse({ type: mode === "move" ? "MOVE" : "TURN", direction })
}

type EffectRequest = Extract<ReturnType<typeof MATCH_KERNEL.stepMatch>, { kind: "effect" }>["request"]

const responseFor = (
  request: EffectRequest,
  policy: Pick<Template, "activationMode" | "brainMode">,
) => request.kind === "selectActivations"
  ? selectionResponse(StrategyInputV119Schema.parse(request.input), policy.activationMode)
  : { action: brainResponse(SoldierBrainInputV119Schema.parse(request.input), policy.brainMode), soldierMemory: {} }

const targetFor = (request: EffectRequest, template: Template): TeacherLegalTarget =>
  request.kind === "selectActivations"
    ? deepFreeze({ kind: "activation", input: structuredClone(StrategyInputV119Schema.parse(request.input)), target: template.activationMode })
    : deepFreeze({ kind: "brain", input: structuredClone(SoldierBrainInputV119Schema.parse(request.input)), target: brainResponse(SoldierBrainInputV119Schema.parse(request.input), template.brainMode) })

const opponentPolicy = (hypothesis: TeacherCounterfactualState["opponentHypothesis"]): Pick<Template, "activationMode" | "brainMode"> =>
  hypothesis === "aggressive"
    ? { activationMode: "press", brainMode: "move" }
    : { activationMode: "screen", brainMode: "stone" }

const stateScore = (state: GameState, playerId: string, failed: boolean): readonly number[] => {
  if (failed) return [-1, -1, -1, -1]
  const opponent = state.players.find((player) => player.id !== playerId)?.id
  const outcomeRank = state.outcome?.type === "WIN"
    ? state.outcome.winnerPlayerId === playerId ? 4 : 0
    : state.outcome?.type === "DRAW" ? 3
    : state.outcome?.type === "FAILED" ? 0
    : 2
  const count = (owner: string | undefined, status: "ACTIVE" | "STONE" | "FALLEN") =>
    state.soldiers.filter((soldier) => soldier.ownerPlayerId === owner && soldier.status === status).length
  return [
    outcomeRank,
    count(playerId, "ACTIVE") - count(opponent, "ACTIVE"),
    count(opponent, "FALLEN") - count(playerId, "FALLEN"),
    count(opponent, "STONE") - count(playerId, "STONE"),
  ]
}

const compareScore = (left: readonly number[], right: readonly number[]) => {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

const terminalLabel = (state: GameState, playerId: string, failed: boolean): TeacherOutcomeSummary["terminal"] => {
  if (failed || state.outcome?.type === "FAILED") return "failed"
  if (state.outcome?.type === "DRAW") return "draw"
  if (state.outcome?.type === "WIN") return state.outcome.winnerPlayerId === playerId ? "win" : "loss"
  return "nonterminal"
}

/**
 * Private deterministic response search. Candidate branches resume the same
 * canonical effect with different legal mission/Action policies. Opponent
 * responses are modeled separately by the declared hypothesis. Every state
 * consequence comes from MATCH_KERNEL; this leaf owns no transition rule.
 */
export const searchCanonicalCounterfactual = (request: TeacherSearchRequest): TeacherSearchReceipt => {
  const maxDepth = request.maxDepth ?? 2
  const maxNodes = request.maxNodes ?? 48
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 1 || maxDepth > 6 || !Number.isSafeInteger(maxNodes) || maxNodes < 2 || maxNodes > 256) throw new TypeError("TEACHER_SEARCH_BUDGET")
  if (request.studentPlayerId !== request.canonicalMatch.bottomPlayerId && request.studentPlayerId !== request.canonicalMatch.topPlayerId) throw new TypeError("TEACHER_STUDENT_PLAYER")

  let nodesVisited = 0
  const canCharge = () => nodesVisited < maxNodes
  const charge = <T>(operation: () => T): T | undefined => {
    if (!canCharge()) return undefined
    nodesVisited += 1
    return operation()
  }

  const initial = charge(() => MATCH_KERNEL.createMachineV119(request.canonicalMatch))
  if (!initial) throw new TypeError("TEACHER_EMPTY_FRONTIER")
  let prefixMachine = initial
  let firstDecision: Extract<ReturnType<typeof MATCH_KERNEL.stepMatch>, { kind: "effect" }> | undefined
  let prefixTerminal = false

  while (canCharge() && !firstDecision && !prefixTerminal) {
    const stepped = charge(() => MATCH_KERNEL.stepMatch(prefixMachine, { kind: "advance" }))
    if (!stepped) break
    if (stepped.kind === "failure" || stepped.kind === "completed") {
      prefixMachine = stepped.machine
      prefixTerminal = true
    } else if (stepped.kind === "transition") {
      prefixMachine = stepped.machine
    } else if (stepped.request.coordinates.actingPlayerId === request.studentPlayerId) {
      firstDecision = stepped
    } else {
      const value = responseFor(stepped.request, opponentPolicy(request.counterfactual.opponentHypothesis))
      const resumed = charge(() => MATCH_KERNEL.stepMatch(stepped.machine, {
        kind: "runtime_resume",
        requestId: stepped.request.requestId,
        effectKind: stepped.request.kind,
        classification: "success",
        value,
      }))
      if (!resumed) break
      prefixMachine = resumed.machine
      prefixTerminal = resumed.kind === "failure" || resumed.kind === "completed"
    }
  }

  const branches: SearchBranch[] = []
  if (firstDecision) {
    for (const template of TEMPLATES) {
      if (!canCharge()) break
      const target = targetFor(firstDecision.request, template)
      const resumed = charge(() => MATCH_KERNEL.stepMatch(firstDecision!.machine, {
        kind: "runtime_resume",
        requestId: firstDecision!.request.requestId,
        effectKind: firstDecision!.request.kind,
        classification: "success",
        value: responseFor(firstDecision!.request, template),
      }))
      if (!resumed) break
      branches.push({
        template,
        machine: resumed.machine,
        depth: 1,
        targets: [target],
        evaluated: resumed.kind !== "failure",
        done: resumed.kind === "failure" || resumed.kind === "completed" || maxDepth === 1,
        failed: resumed.kind === "failure",
      })
    }
  }

  while (canCharge() && branches.some((branch) => !branch.done)) {
    let progressed = false
    for (const branch of branches) {
      if (!canCharge() || branch.done) continue
      const stepped = charge(() => MATCH_KERNEL.stepMatch(branch.machine, { kind: "advance" }))
      if (!stepped) break
      progressed = true
      if (stepped.kind === "failure" || stepped.kind === "completed") {
        branch.machine = stepped.machine
        branch.failed = stepped.kind === "failure"
        branch.done = true
        continue
      }
      if (stepped.kind === "transition") {
        branch.machine = stepped.machine
        continue
      }

      const studentDecision = stepped.request.coordinates.actingPlayerId === request.studentPlayerId
      if (studentDecision && branch.depth >= maxDepth) {
        branch.done = true
        continue
      }
      if (!canCharge()) break
      const target = studentDecision ? targetFor(stepped.request, branch.template) : undefined
      const policy = studentDecision ? branch.template : opponentPolicy(request.counterfactual.opponentHypothesis)
      const resumed = charge(() => MATCH_KERNEL.stepMatch(stepped.machine, {
        kind: "runtime_resume",
        requestId: stepped.request.requestId,
        effectKind: stepped.request.kind,
        classification: "success",
        value: responseFor(stepped.request, policy),
      }))
      if (!resumed) break
      branch.machine = resumed.machine
      if (studentDecision && target) {
        branch.targets.push(target)
        branch.depth += 1
      }
      branch.failed = resumed.kind === "failure"
      branch.done = resumed.kind === "failure" || resumed.kind === "completed" || branch.depth >= maxDepth
    }
    if (!progressed) break
  }

  const evaluated = branches.filter((branch) => branch.evaluated)
  const ranked = evaluated.map((branch) => {
    const score = stateScore(branch.machine.state, request.studentPlayerId, branch.failed)
    const stateRoot = root(branch.machine.state)
    const terminal = terminalLabel(branch.machine.state, request.studentPlayerId, branch.failed)
    return {
      branch,
      score,
      stateRoot,
      terminal,
      outcomeRoot: root({ template: branch.template.id, score, stateRoot, terminal }),
    }
  }).sort((left, right) => compareScore(right.score, left.score) || left.branch.template.id.localeCompare(right.branch.template.id))
  const selected = ranked[0]
  const fallbackRoot = root({ state: prefixMachine.state, terminal: prefixTerminal, nodesVisited })
  const selectedRoot = selected?.outcomeRoot ?? fallbackRoot

  return deepFreeze({
    canonicalTransitionRoot: selectedRoot,
    selectedTemplate: selected?.branch.template.id ?? null,
    selectedOutcomeRoot: selectedRoot,
    depthReached: Math.max(0, ...evaluated.map((branch) => branch.depth)),
    nodesVisited,
    alternativesEvaluated: evaluated.length,
    outcomeRoots: ranked.map((entry) => entry.outcomeRoot),
    outcomes: ranked.map((entry) => ({ template: entry.branch.template.id, score: entry.score, stateRoot: entry.stateRoot, terminal: entry.terminal, outcomeRoot: entry.outcomeRoot })),
    selectedLegalTargets: selected?.branch.targets ?? [],
    offlineOnly: true as const,
  })
}
