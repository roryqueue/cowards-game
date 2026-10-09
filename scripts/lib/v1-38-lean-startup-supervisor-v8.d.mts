import type { LeanStartupBindingV5, LeanStartupOriginV8, LeanStartupSupervisorHostV8 } from "./v1-38-lean-container-match-session.js"
export function superviseLeanStartupV8(binding: LeanStartupBindingV5, hostBudgetMs: number, host: LeanStartupSupervisorHostV8): Promise<{ ok: boolean; output: unknown; origin: LeanStartupOriginV8 }>
