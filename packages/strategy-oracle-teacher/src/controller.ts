/** Pure legal-feature controller. Kept import-free so the emitter can bundle these exact bytes. */
export const TEACHER_CONTROLLER_VERSION = "teacher-legal-controller-v1" as const
export type TeacherFeaturePolicy = Readonly<{ activation: readonly ("press" | "screen")[]; brain: readonly { readonly enemy: "left" | "right" | "vertical"; readonly action: "move" | "turn" | "stone" }[] }>
export const controllerFeature = (input: { readonly awarenessGrid?: { readonly cells?: readonly { readonly dx: number; readonly dy: number; readonly contents: string }[] } }) => {
  const enemy = input.awarenessGrid?.cells?.filter((cell) => cell.contents === "ENEMY_ACTIVE").sort((left, right) => Math.abs(left.dx) + Math.abs(left.dy) - Math.abs(right.dx) - Math.abs(right.dy))[0]
  return !enemy ? "vertical" : Math.abs(enemy.dx) > Math.abs(enemy.dy) ? enemy.dx < 0 ? "left" : "right" : "vertical"
}
export const controllerBrainAction = (policy: TeacherFeaturePolicy, input: { readonly awarenessGrid: { readonly cells: readonly { readonly dx: number; readonly dy: number; readonly contents: string }[] }; readonly hasAdvancedThisActivation: boolean; readonly self: { readonly facing: "UP" | "RIGHT" | "DOWN" | "LEFT" | null } }) => {
  const feature = controllerFeature(input), selected = policy.brain.find((rule) => rule.enemy === feature)?.action ?? "turn"
  const direction = feature === "left" ? "LEFT" : feature === "right" ? "RIGHT" : input.self.facing ?? "UP"
  if (selected === "stone" && !input.hasAdvancedThisActivation) return { type: "TURN_TO_STONE" as const }
  const cell = input.awarenessGrid.cells.find((entry) => entry.dx === (direction === "RIGHT" ? 1 : direction === "LEFT" ? -1 : 0) && entry.dy === (direction === "DOWN" ? 1 : direction === "UP" ? -1 : 0))
  return selected === "move" && !input.hasAdvancedThisActivation && cell?.contents === "EMPTY" ? { type: "MOVE" as const, direction } : { type: "TURN" as const, direction }
}
