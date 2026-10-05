import type { LeanStartupBindingV5, LeanStartupOriginV5, LeanStartupSupervisorHostV5 } from "./v1-38-lean-container-match-session.js"
export function superviseLeanStartupV5(binding: LeanStartupBindingV5, hostBudgetMs: number, host: LeanStartupSupervisorHostV5): Promise<{ ok: boolean; output: unknown; origin: LeanStartupOriginV5 }>
