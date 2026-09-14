/** Import-free legal-feature controller; the emitter statically bundles these exact bytes. */
export const TEACHER_CONTROLLER_VERSION = "teacher-legal-controller-v2" as const
export type TeacherActivationFeature = "initiative-contact" | "initiative-distant" | "response-contact" | "response-distant"
export type TeacherBrainFeature = `${"left" | "right" | "vertical"}:${"open" | "blocked"}:${"fresh" | "advanced"}`
export type TeacherFeaturePolicy = Readonly<{ activationFallback: "press" | "screen"; brainFallback: "move" | "turn" | "stone"; activation: readonly Readonly<{ feature: TeacherActivationFeature; target: "press" | "screen" }>[]; brain: readonly Readonly<{ feature: TeacherBrainFeature; target: "move" | "turn" | "stone" }>[] }>

const controllerDistance = (left: { readonly x: number; readonly y: number }, right: { readonly x: number; readonly y: number }) => Math.abs(left.x - right.x) + Math.abs(left.y - right.y)
const controllerDirection = (dx: number, dy: number) => Math.abs(dx) >= Math.abs(dy) ? dx >= 0 ? "RIGHT" as const : "LEFT" as const : dy >= 0 ? "DOWN" as const : "UP" as const
const controllerOffset = (direction: "UP" | "RIGHT" | "DOWN" | "LEFT") => direction === "RIGHT" ? { dx: 1, dy: 0 } : direction === "LEFT" ? { dx: -1, dy: 0 } : direction === "DOWN" ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 }

export const controllerActivationFeature = (input: { readonly hasRoundInitiative: boolean; readonly mySoldiers: readonly { readonly position: { readonly x: number; readonly y: number } | null }[]; readonly enemySoldiers: readonly { readonly position: { readonly x: number; readonly y: number } | null }[] }): TeacherActivationFeature => {
  const nearest = Math.min(...input.mySoldiers.filter((soldier) => soldier.position).flatMap((soldier) => input.enemySoldiers.filter((enemy) => enemy.position).map((enemy) => controllerDistance(soldier.position!, enemy.position!))), Number.MAX_SAFE_INTEGER)
  return `${input.hasRoundInitiative ? "initiative" : "response"}-${nearest <= 4 ? "contact" : "distant"}` as TeacherActivationFeature
}

export const controllerBrainFeature = (input: { readonly awarenessGrid: { readonly cells: readonly { readonly dx: number; readonly dy: number; readonly contents: string }[] }; readonly hasAdvancedThisActivation: boolean; readonly self: { readonly facing: "UP" | "RIGHT" | "DOWN" | "LEFT" | null } }): TeacherBrainFeature => {
  const enemy = input.awarenessGrid.cells.filter((cell) => cell.contents === "ENEMY_ACTIVE").sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - Math.abs(right.dx) - Math.abs(right.dy) || left.dy - right.dy || left.dx - right.dx)[0]
  const bearing = !enemy ? "vertical" : Math.abs(enemy.dx) > Math.abs(enemy.dy) ? enemy.dx < 0 ? "left" : "right" : "vertical"
  const direction = enemy ? controllerDirection(enemy.dx, enemy.dy) : input.self.facing ?? "UP"
  const offset = controllerOffset(direction)
  const forward = input.awarenessGrid.cells.find((cell) => cell.dx === offset.dx && cell.dy === offset.dy)
  return `${bearing}:${forward?.contents === "EMPTY" ? "open" : "blocked"}:${input.hasAdvancedThisActivation ? "advanced" : "fresh"}` as TeacherBrainFeature
}

export const controllerActivationMode = (policy: TeacherFeaturePolicy, input: Parameters<typeof controllerActivationFeature>[0]) => policy.activation.find((rule) => rule.feature === controllerActivationFeature(input))?.target ?? policy.activationFallback
export const controllerBrainMode = (policy: TeacherFeaturePolicy, input: Parameters<typeof controllerBrainFeature>[0]) => policy.brain.find((rule) => rule.feature === controllerBrainFeature(input))?.target ?? policy.brainFallback

export const controllerSelectActivations = (policy: TeacherFeaturePolicy, input: { readonly activationCount: number; readonly board: { readonly bounds: { readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number } }; readonly hasRoundInitiative: boolean; readonly mySoldiers: readonly { readonly id: string; readonly status: string; readonly position: { readonly x: number; readonly y: number } | null }[]; readonly enemySoldiers: readonly { readonly position: { readonly x: number; readonly y: number } | null }[] }) => {
  const mode = controllerActivationMode(policy, input)
  const enemies = input.enemySoldiers.filter((soldier) => soldier.position)
  const selected = input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position).slice().sort((left, right) => {
    const leftPosition = left.position!
    const rightPosition = right.position!
    if (mode === "press") {
      const leftNearest = Math.min(...enemies.map((enemy) => controllerDistance(leftPosition, enemy.position!)), Number.MAX_SAFE_INTEGER)
      const rightNearest = Math.min(...enemies.map((enemy) => controllerDistance(rightPosition, enemy.position!)), Number.MAX_SAFE_INTEGER)
      return leftNearest - rightNearest || leftPosition.y - rightPosition.y || leftPosition.x - rightPosition.x
    }
    const leftEdge = Math.min(leftPosition.x - input.board.bounds.minX, input.board.bounds.maxX - leftPosition.x, leftPosition.y - input.board.bounds.minY, input.board.bounds.maxY - leftPosition.y)
    const rightEdge = Math.min(rightPosition.x - input.board.bounds.minX, input.board.bounds.maxX - rightPosition.x, rightPosition.y - input.board.bounds.minY, input.board.bounds.maxY - rightPosition.y)
    return leftEdge - rightEdge || leftPosition.x - rightPosition.x || leftPosition.y - rightPosition.y
  }).slice(0, input.activationCount)
  return { activationOrders: selected.map((soldier) => ({ soldierId: soldier.id, objective: { schemaVersion: "teacher-legal-mission-v1", mode, goal: soldier.position } })), strategyMemory: { teacher: { schemaVersion: "teacher-student-v3", mode } } }
}

export const controllerSoldierBrain = (policy: TeacherFeaturePolicy, input: Parameters<typeof controllerBrainFeature>[0]) => {
  const mode = controllerBrainMode(policy, input)
  const enemy = input.awarenessGrid.cells.filter((cell) => cell.contents === "ENEMY_ACTIVE").sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - Math.abs(right.dx) - Math.abs(right.dy) || left.dy - right.dy || left.dx - right.dx)[0]
  const direction = enemy ? controllerDirection(enemy.dx, enemy.dy) : input.self.facing ?? "UP"
  const offset = controllerOffset(direction)
  const forward = input.awarenessGrid.cells.find((cell) => cell.dx === offset.dx && cell.dy === offset.dy)
  const action = mode === "stone" && !input.hasAdvancedThisActivation
    ? { type: "TURN_TO_STONE" as const }
    : mode === "move" && !input.hasAdvancedThisActivation && forward?.contents === "EMPTY"
      ? { type: "MOVE" as const, direction }
      : { type: "TURN" as const, direction }
  return { action, soldierMemory: { teacher: { schemaVersion: "teacher-brain-v3", mode } } }
}
