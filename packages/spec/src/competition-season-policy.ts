import { assertPublicOutputLeakSafe } from "./public-output-privacy.js"

export const COMPETITION_SEASON_POLICY_ID =
  "competition-season-policy-v1.36" as const

export const TRIAL_SEASON_LIFECYCLE_STATUSES = [
  "draft",
  "open",
  "scheduling",
  "active",
  "completed",
  "archived",
] as const

export type TrialSeasonLifecycleStatus =
  (typeof TRIAL_SEASON_LIFECYCLE_STATUSES)[number]

export const TRIAL_SEASON_ALLOWED_TRANSITIONS = {
  draft: ["open"],
  open: ["scheduling", "completed"],
  scheduling: ["active", "completed"],
  active: ["completed"],
  completed: ["archived"],
  archived: [],
} as const satisfies Record<
  TrialSeasonLifecycleStatus,
  readonly TrialSeasonLifecycleStatus[]
>

export type TrialSeasonWindowState = "not_started" | "open" | "closed"

export interface TrialSeasonWindowProjection {
  state: TrialSeasonWindowState
  publicLabel: string
  openedAt?: string | undefined
  closedAt?: string | undefined
}

export type TrialSeasonOutcomeStatus =
  | "pending"
  | "scheduled"
  | "insufficient_evidence"

export interface TrialSeasonOutcomeProjection {
  status: TrialSeasonOutcomeStatus
  publicLabel: string
  publicExplanation: string
}

export interface TrialSeasonPublicLinks {
  seasonHref: string
  standingsHref: string
}

export const canTrialSeasonTransition = (
  from: TrialSeasonLifecycleStatus,
  to: TrialSeasonLifecycleStatus,
): boolean =>
  from === to ||
  (TRIAL_SEASON_ALLOWED_TRANSITIONS[from] as readonly string[]).includes(to)

export const assertTrialSeasonTransition = (
  from: TrialSeasonLifecycleStatus,
  to: TrialSeasonLifecycleStatus,
): void => {
  if (!canTrialSeasonTransition(from, to)) {
    throw new Error(`Trial Season cannot move from ${from} to ${to}.`)
  }
}

const entryWindowState = (
  status: TrialSeasonLifecycleStatus,
): TrialSeasonWindowState => {
  if (status === "draft") return "not_started"
  if (status === "open") return "open"
  return "closed"
}

const schedulingWindowState = (
  status: TrialSeasonLifecycleStatus,
): TrialSeasonWindowState => {
  if (status === "draft" || status === "open") return "not_started"
  if (status === "scheduling") return "open"
  return "closed"
}

export const projectTrialSeasonWindows = (input: {
  status: TrialSeasonLifecycleStatus
  openedAt?: string | undefined
  closedAt?: string | undefined
  scheduledAt?: string | undefined
}): {
  entryWindow: TrialSeasonWindowProjection
  schedulingWindow: TrialSeasonWindowProjection
} => {
  const entryState = entryWindowState(input.status)
  const schedulingState = schedulingWindowState(input.status)
  return {
    entryWindow: {
      state: entryState,
      publicLabel:
        entryState === "open"
          ? "Open for counted entries"
          : entryState === "closed"
            ? "Counted entries closed"
            : "Counted entries not open yet",
      ...(input.openedAt ? { openedAt: input.openedAt } : {}),
      ...(input.closedAt ? { closedAt: input.closedAt } : {}),
    },
    schedulingWindow: {
      state: schedulingState,
      publicLabel:
        schedulingState === "open"
          ? "Scheduling frozen entrant snapshots"
          : schedulingState === "closed"
            ? "Scheduling window closed"
            : "Scheduling has not started",
      ...(input.scheduledAt ? { openedAt: input.scheduledAt } : {}),
      ...(schedulingState === "closed" && input.scheduledAt
        ? { closedAt: input.scheduledAt }
        : {}),
    },
  }
}

export const trialSeasonOutcome = (
  status: TrialSeasonOutcomeStatus,
): TrialSeasonOutcomeProjection => {
  switch (status) {
    case "scheduled":
      return {
        status,
        publicLabel: "Scheduled evidence",
        publicExplanation:
          "The Season produced public MatchSet evidence for resettable Season-scoped standings.",
      }
    case "insufficient_evidence":
      return {
        status,
        publicLabel: "Insufficient evidence",
        publicExplanation:
          "The Season closed below its minimum entry requirement and produced no counted MatchSets.",
      }
    case "pending":
      return {
        status,
        publicLabel: "Outcome pending",
        publicExplanation:
          "The Season has not reached a final scheduling outcome.",
      }
  }
}

export const trialSeasonPublicLinks = (
  seasonIdOrSlug: string,
): TrialSeasonPublicLinks => {
  const encoded = encodeURIComponent(seasonIdOrSlug)
  return {
    seasonHref: `/ladder/${encoded}`,
    standingsHref: `/ladder/${encoded}#standings`,
  }
}

export const COMPETITION_SEASON_PUBLIC_POLICY = {
  id: COMPETITION_SEASON_POLICY_ID,
  standingsScope: "resettable Season-scoped standings",
  durableRatingPromise: "no durable permanent rating promise",
  archivePolicy:
    "Completed and archived Seasons preserve public evidence links while remaining resettable trial records.",
  outcomes: [
    trialSeasonOutcome("pending"),
    trialSeasonOutcome("scheduled"),
    trialSeasonOutcome("insufficient_evidence"),
  ],
} as const

export const assertCompetitionSeasonPublicLeakSafe = (
  value: unknown = COMPETITION_SEASON_PUBLIC_POLICY,
): void => assertPublicOutputLeakSafe(value, "competition Season public policy")
