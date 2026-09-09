/** Explicitly selected by the operator-approved closeout route; historical callers omit it. */
export type LeanInfrastructureProfile = "closeout"
export const LEAN_CLOSEOUT_PROFILE = Object.freeze({
  cpus: "2" as const,
  memory: "256m" as const,
  cellDeadlineMilliseconds: 120_000,
  outerDeadlineMilliseconds: 3_600_000,
})

export const assertLeanInfrastructureProfile = (profile: LeanInfrastructureProfile | undefined): void => {
  if (profile !== undefined && profile !== "closeout") throw new TypeError("LEAN_INFRASTRUCTURE_PROFILE_INVALID")
}
