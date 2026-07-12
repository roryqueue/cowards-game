import type {
  CompetitionCountedPublicReason,
  CompetitionCountedStateProjection,
} from "./competition-counted-state.js"
import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const COMPETITION_REPORT_SUBMISSION_TYPES = [
  "report",
  "dispute",
] as const
export type CompetitionReportSubmissionType =
  (typeof COMPETITION_REPORT_SUBMISSION_TYPES)[number]

export const COMPETITION_REPORT_CATEGORIES = [
  "result_integrity",
  "entry_eligibility",
  "identity_or_coordination",
  "abusive_conduct",
  "other",
] as const
export type CompetitionReportCategory =
  (typeof COMPETITION_REPORT_CATEGORIES)[number]

export const COMPETITION_GOVERNANCE_ACTIONS = [
  "under_review",
  "counted",
  "non_counted",
  "non_competitive",
  "invalid",
  "invalidated",
] as const
export type CompetitionGovernanceAction =
  (typeof COMPETITION_GOVERNANCE_ACTIONS)[number]

export const COMPETITION_GOVERNANCE_CATEGORIES = [
  "integrity_review",
  "entrant_dispute",
  "evidence_incomplete",
  "competition_policy",
  "result_invalid",
  "result_invalidated",
  "review_resolved_counted",
] as const
export type CompetitionGovernanceCategory =
  (typeof COMPETITION_GOVERNANCE_CATEGORIES)[number]

export interface PublicCompetitionGovernanceProjection {
  status:
    | "clear"
    | "under_review"
    | "disputed"
    | "resolved"
    | "non_counted"
    | "non_competitive"
    | "invalid"
    | "invalidated"
  publicReason?: CompetitionCountedPublicReason | undefined
  publicExplanation: string
  changedAt?: string | undefined
  standingsEffect: string
  replayAvailable: boolean
}

const ACTION_POLICY: Record<
  CompetitionGovernanceAction,
  {
    categories: readonly CompetitionGovernanceCategory[]
    publicReason?: CompetitionCountedPublicReason | undefined
    publicExplanation: string
  }
> = {
  under_review: {
    categories: ["integrity_review", "entrant_dispute"],
    publicReason: "governance_hold",
    publicExplanation:
      "This result is being reviewed and is held out of standings for now.",
  },
  counted: {
    categories: ["review_resolved_counted"],
    publicExplanation:
      "Review is complete and the available evidence counts for this Season.",
  },
  non_counted: {
    categories: ["evidence_incomplete", "competition_policy"],
    publicReason: "non_counted",
    publicExplanation:
      "This public result is excluded from this Season's standings.",
  },
  non_competitive: {
    categories: ["competition_policy"],
    publicReason: "non_competitive",
    publicExplanation:
      "This result is exhibition or study evidence and does not affect standings.",
  },
  invalid: {
    categories: ["result_invalid"],
    publicReason: "invalid_result",
    publicExplanation: "This result is not valid counted competition evidence.",
  },
  invalidated: {
    categories: ["result_invalidated"],
    publicReason: "invalidated",
    publicExplanation:
      "This result has been invalidated and is excluded from standings.",
  },
}

export const competitionGovernanceActionPolicy = (
  action: CompetitionGovernanceAction,
  category: CompetitionGovernanceCategory,
) => {
  const policy = ACTION_POLICY[action]
  if (!policy.categories.includes(category)) {
    throw new Error(
      `Governance category ${category} is not valid for ${action}.`,
    )
  }
  return policy
}

export const normalizeCompetitionReportDetail = (
  value: unknown,
): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value !== "string") throw new Error("Report detail must be text.")
  const detail = value.trim()
  if (!detail) return undefined
  if (detail.length > 500) {
    throw new Error("Report detail must be 500 characters or fewer.")
  }
  if (/\p{Cc}/u.test(detail)) {
    throw new Error("Report detail contains unsupported control characters.")
  }
  return detail
}

const governanceStatus = (
  state: CompetitionCountedStateProjection["state"],
  reviewState?: "none" | "under_review" | "disputed" | "resolved",
): PublicCompetitionGovernanceProjection["status"] => {
  if (reviewState === "resolved" && state === "counted") return "resolved"
  if (state === "under_review") return "under_review"
  if (state === "disputed") return "disputed"
  if (state === "non_counted") return "non_counted"
  if (state === "non_competitive") return "non_competitive"
  if (state === "invalid") return "invalid"
  if (state === "invalidated") return "invalidated"
  return "clear"
}

export const projectPublicCompetitionGovernance = (input: {
  countedState: CompetitionCountedStateProjection
  reviewState?: "none" | "under_review" | "disputed" | "resolved"
  changedAt?: string | undefined
  replayAvailable: boolean
}): PublicCompetitionGovernanceProjection => ({
  status: governanceStatus(input.countedState.state, input.reviewState),
  ...(input.countedState.publicReason
    ? { publicReason: input.countedState.publicReason }
    : {}),
  publicExplanation: input.countedState.publicExplanation,
  ...(input.changedAt ? { changedAt: input.changedAt } : {}),
  standingsEffect: input.countedState.standingsEffect,
  replayAvailable: input.replayAvailable,
})

export const COMPETITION_FAIR_PLAY_POLICY = {
  title: "Fair play and result reports",
  currentBehavior:
    "Signed-in Players can report a competition result. Entrants can dispute their own result while public evidence is reviewed.",
  evidenceLimit:
    "Share only a short description. Do not submit credentials, tokens, Strategy source, private runtime details, or recovery evidence.",
  limitation:
    "Reports do not guarantee automatic action, a public sanction record, a response deadline, or an appeal deadline.",
} as const

export const COMPETITION_ACCOUNT_RECOVERY_POLICY = {
  title: "Account recovery expectations",
  currentBehavior:
    "Competition entries remain attached to the account and immutable Strategy Revision that submitted them.",
  limitation:
    "Self-service ownership transfer and full account recovery are not available in this public beta. Do not submit recovery evidence through competition reports.",
  ratings:
    "Resettable Season standings are not permanent ratings and no permanent rating repair is promised.",
} as const

const PRIVATE_KEY =
  /^(reporter|operator|privateDetail|privateNote|reportCount|audit|recoveryEvidence|dedupe|rateLimit)/i
const assertNoPrivateKeys = (value: unknown): void => {
  if (Array.isArray(value)) return value.forEach(assertNoPrivateKeys)
  if (!value || typeof value !== "object") return
  for (const [key, nested] of Object.entries(value)) {
    if (PRIVATE_KEY.test(key)) {
      throw new Error(
        `Public governance projection contains private field ${key}.`,
      )
    }
    assertNoPrivateKeys(nested)
  }
}

export const assertPublicCompetitionGovernanceLeakSafe = (
  value: unknown,
): void => {
  assertNoPrivateKeys(value)
  assertPublicOutputLeakSafe(value, "public competition governance")
}
