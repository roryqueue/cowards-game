import {
  COMPETITION_POLICY_V1_36_COUNTED_STATE_PUBLIC_PROJECTIONS,
  type CompetitionPolicyV136CountedStatePublicProjection,
} from "./competition-policy-v1-36.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const COMPETITION_COUNTED_STATE_CONTRACT_ID =
  "competition-counted-state-v1.36" as const

export type CompetitionEvidenceAvailability =
  | "available"
  | "partial"
  | "unavailable"

export type CompetitionCountedPublicReason =
  | "system_failure"
  | "incomplete_evidence"
  | "invalid_result"
  | "governance_hold"
  | "non_counted"
  | "non_competitive"
  | "disputed"
  | "invalidated"

export interface CompetitionCountedStateInput {
  executionStatus:
    | "accepted"
    | "queued"
    | "running"
    | "complete"
    | "degraded"
    | "failed"
  storedState?: CompetitionPolicyV136CountedStatePublicProjection | undefined
  reviewState?: "none" | "under_review" | "disputed" | "resolved" | undefined
  origin: "trial" | "non_competitive"
  expectedMatchCount: number
  chronicleMatchCount: number
  scoringAvailable: boolean
}

export interface CompetitionCountedStateProjection {
  state: CompetitionPolicyV136CountedStatePublicProjection
  publicLabel: string
  publicExplanation: string
  standingsEffect: string
  evidenceAvailability: CompetitionEvidenceAvailability
  publicReason?: CompetitionCountedPublicReason | undefined
}

const evidenceAvailability = (
  input: CompetitionCountedStateInput,
): CompetitionEvidenceAvailability => {
  if (
    input.expectedMatchCount > 0 &&
    input.chronicleMatchCount === input.expectedMatchCount &&
    input.scoringAvailable
  ) {
    return "available"
  }
  if (input.chronicleMatchCount > 0 || input.scoringAvailable) {
    return "partial"
  }
  return "unavailable"
}

const storedGovernanceState = (
  input: CompetitionCountedStateInput,
): CompetitionPolicyV136CountedStatePublicProjection | null => {
  for (const state of [
    "invalidated",
    "invalid",
    "disputed",
    "under_review",
    "non_competitive",
    "non_counted",
  ] as const) {
    if (input.storedState === state) return state
  }
  if (input.reviewState === "disputed") return "disputed"
  if (input.reviewState === "under_review") return "under_review"
  if (input.origin === "non_competitive") return "non_competitive"
  return null
}

const deriveState = (
  input: CompetitionCountedStateInput,
): CompetitionPolicyV136CountedStatePublicProjection => {
  const governance = storedGovernanceState(input)
  if (governance) return governance
  if (
    input.storedState === "degraded_system_failure" ||
    input.executionStatus === "degraded" ||
    input.executionStatus === "failed"
  ) {
    return "degraded_system_failure"
  }
  if (input.executionStatus === "running") return "retrying"
  if (
    input.executionStatus === "complete" &&
    input.expectedMatchCount > 0 &&
    input.chronicleMatchCount === input.expectedMatchCount &&
    input.scoringAvailable
  ) {
    return "counted"
  }
  return "pending"
}

const publicReasonFor = (
  state: CompetitionPolicyV136CountedStatePublicProjection,
): CompetitionCountedPublicReason | undefined => {
  switch (state) {
    case "degraded_system_failure":
      return "system_failure"
    case "pending":
    case "retrying":
      return "incomplete_evidence"
    case "invalid":
      return "invalid_result"
    case "invalidated":
      return "invalidated"
    case "under_review":
      return "governance_hold"
    case "disputed":
      return "disputed"
    case "non_counted":
      return "non_counted"
    case "non_competitive":
      return "non_competitive"
    case "counted":
      return undefined
  }
}

export const classifyCompetitionCountedState = (
  input: CompetitionCountedStateInput,
): CompetitionCountedStateProjection => {
  const state = deriveState(input)
  const copy = COMPETITION_POLICY_V1_36_COUNTED_STATE_PUBLIC_PROJECTIONS.find(
    (entry) => entry.state === state,
  )
  if (!copy) {
    throw new Error(`Missing public counted-state copy for ${state}.`)
  }
  const publicReason = publicReasonFor(state)
  return {
    state,
    publicLabel: copy.publicLabel,
    publicExplanation: copy.publicMeaning,
    standingsEffect: copy.standingEffect,
    evidenceAvailability: evidenceAvailability(input),
    ...(publicReason ? { publicReason } : {}),
  }
}

export const assertCompetitionCountedStatePublicLeakSafe = (
  value: unknown,
): void => assertPublicOutputLeakSafe(value, "competition counted state")
