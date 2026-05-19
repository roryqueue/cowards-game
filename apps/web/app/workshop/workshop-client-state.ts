import type { StrategyRevisionValidationReport } from "@cowards/spec"
import type { WorkshopRevisionSummary } from "./types.js"
import type { WorkshopSampleSummary } from "./types.js"
import type { WorkshopTestSummary } from "./types.js"

export type DraftValidationState =
  | "not-checked"
  | "checking"
  | "valid"
  | "invalid"

export const getDraftStatusLabel = (
  state: DraftValidationState,
): "Not checked" | "Checking..." | "Valid draft" | "Invalid draft" => {
  switch (state) {
    case "checking":
      return "Checking..."
    case "valid":
      return "Valid draft"
    case "invalid":
      return "Invalid draft"
    case "not-checked":
      return "Not checked"
  }
}

export const getDraftStatusClass = (state: DraftValidationState): string =>
  state === "valid" ? "valid" : state === "invalid" ? "invalid" : ""

export const formatValidationIssueHeading = (
  issue: StrategyRevisionValidationReport["errors"][number],
): string => `${issue.severity.toUpperCase()} / ${issue.code}`

export interface ValidationIssueGuidance {
  constraint: string
  message: string
  remediation: string | null
  reference: string | null
}

export const formatValidationIssueGuidance = (
  issue: StrategyRevisionValidationReport["errors"][number],
): ValidationIssueGuidance => {
  if (issue.constraint && issue.remediation) {
    return {
      constraint: issue.constraint,
      message: issue.message,
      remediation: issue.remediation,
      reference: issue.reference ?? null,
    }
  }
  return {
    constraint: issue.message,
    message: issue.message,
    remediation: null,
    reference: issue.reference ?? null,
  }
}

export const validationStateFromReport = (
  report: StrategyRevisionValidationReport | null,
  checking: boolean,
): DraftValidationState => {
  if (checking) {
    return "checking"
  }
  if (!report) {
    return "not-checked"
  }
  return report.valid ? "valid" : "invalid"
}

export interface WorkshopSampleGroups {
  starters: WorkshopSampleSummary[]
  failureModes: WorkshopSampleSummary[]
}

export const groupWorkshopSamples = (
  samples: WorkshopSampleSummary[],
): WorkshopSampleGroups => ({
  starters: samples.filter((sample) => sample.sampleKind === "starter"),
  failureModes: samples.filter(
    (sample) => sample.sampleKind === "failure-mode",
  ),
})

export const getSampleKindLabel = (
  sample: WorkshopSampleSummary,
): "Valid sample" | "Failure mode" =>
  sample.sampleKind === "starter" ? "Valid sample" : "Failure mode"

export const getSampleChipLabels = (
  sample: WorkshopSampleSummary,
): string[] => [...sample.categories, getSampleKindLabel(sample)]

export const canSubmitRevision = (input: {
  validation: StrategyRevisionValidationReport | null
  checking: boolean
  submitting: boolean
}): boolean =>
  Boolean(input.validation?.valid) && !input.submitting

export const getSubmitBlockedReason = (input: {
  validation: StrategyRevisionValidationReport | null
  checking: boolean
}): string | null => {
  if (input.validation?.valid) {
    return null
  }
  if (input.checking) {
    return "Checking draft before submitting."
  }
  if (input.validation && !input.validation.valid) {
    return "Resolve validation errors before submitting."
  }
  if (!input.validation) {
    return "Validate source before submitting."
  }
  return null
}

export const getRevisionTitle = (revision: WorkshopRevisionSummary): string =>
  revision.label ?? "Untitled revision"

export const formatUsedInMatches = (
  revision: WorkshopRevisionSummary,
): string => `${revision.usedInMatches} used in matches`

export const prependRevision = (
  revisions: WorkshopRevisionSummary[],
  revision: WorkshopRevisionSummary,
): WorkshopRevisionSummary[] => [
  revision,
  ...revisions.filter((candidate) => candidate.id !== revision.id),
]

export const getTestStatusCopy = (
  status: WorkshopTestSummary["status"] | null,
): string => {
  switch (status) {
    case "pending":
      return "Test queued"
    case "running":
      return "Test running"
    case "complete":
      return "Test complete"
    case "failed_system":
    case "blocked":
    case "degraded":
      return "Test failed; review system status before retrying."
    case null:
      return ""
  }
}

export const isTerminalTestStatus = (
  status: WorkshopTestSummary["status"],
): boolean =>
  status === "complete" ||
  status === "failed_system" ||
  status === "blocked" ||
  status === "degraded"

export type WorkshopMatchSummary = WorkshopTestSummary["matches"][number]

export const LOCAL_WORKSHOP_PLAYER_ID = "player:workshop-local"

export const getReplayHref = (matchId: string): string =>
  `/matches/${encodeURIComponent(matchId)}/replay`

export const getOwnerReplayHref = (
  matchId: string,
  ownerPlayerId = LOCAL_WORKSHOP_PLAYER_ID,
): string =>
  `${getReplayHref(matchId)}?ownerDebug=1&ownerPlayerId=${encodeURIComponent(ownerPlayerId)}`

export const canOpenReplay = (match: WorkshopMatchSummary): boolean =>
  match.status === "complete" && match.hasReplay === true

export const getWorkshopOwnerPlayerId = (
  match: WorkshopMatchSummary,
  localPlayerId = LOCAL_WORKSHOP_PLAYER_ID,
): string | null =>
  match.bottomPlayerId === localPlayerId || match.topPlayerId === localPlayerId
    ? localPlayerId
    : null

export const canOpenOwnerReplay = (
  match: WorkshopMatchSummary,
  localPlayerId = LOCAL_WORKSHOP_PLAYER_ID,
): boolean => canOpenReplay(match) && getWorkshopOwnerPlayerId(match, localPlayerId) !== null

export type ReplayAvailability =
  | {
      state: "available"
      label: "Open replay"
      href: string
      ownerHref: string | null
      reason: null
    }
  | {
      state: "unavailable"
      label: "Replay unavailable"
      href: null
      ownerHref: null
      reason: string
    }

export const getReplayAvailability = (
  match: WorkshopMatchSummary,
): ReplayAvailability => {
  if (canOpenReplay(match)) {
    return {
      state: "available",
      label: "Open replay",
      href: getReplayHref(match.matchId),
      ownerHref:
        getWorkshopOwnerPlayerId(match) === null
          ? null
          : getOwnerReplayHref(match.matchId, LOCAL_WORKSHOP_PLAYER_ID),
      reason: null,
    }
  }
  switch (match.status) {
    case "pending":
      return {
        state: "unavailable",
        label: "Replay unavailable",
        href: null,
        ownerHref: null,
        reason:
          "Replay will appear after this Match leaves the queue and stores a Chronicle.",
      }
    case "running":
      return {
        state: "unavailable",
        label: "Replay unavailable",
        href: null,
        ownerHref: null,
        reason:
          "Replay will appear after the Match completes and its Chronicle is stored.",
      }
    case "failed_system":
      return {
        state: "unavailable",
        label: "Replay unavailable",
        href: null,
        ownerHref: null,
        reason:
          "Replay unavailable because the Match failed before a Chronicle could be stored.",
      }
    case "blocked":
      return {
        state: "unavailable",
        label: "Replay unavailable",
        href: null,
        ownerHref: null,
        reason:
          "Replay unavailable because the Match was blocked before execution.",
      }
    case "complete":
      return {
        state: "unavailable",
        label: "Replay unavailable",
        href: null,
        ownerHref: null,
        reason:
          "Replay unavailable: this completed Match has no stored Chronicle.",
      }
  }
}

const outcomeRecord = (
  outcome: WorkshopMatchSummary["outcome"],
): Record<string, unknown> | null =>
  outcome !== null && typeof outcome === "object" && !Array.isArray(outcome)
    ? outcome
    : null

export const formatMatchOutcome = (match: WorkshopMatchSummary): string => {
  if (match.status === "pending") {
    return "Pending"
  }
  if (match.status === "running") {
    return "Running"
  }
  if (match.status === "failed_system" || match.status === "blocked") {
    return "Failed system"
  }
  if (!match.hasReplay) {
    return "Replay unavailable"
  }

  const outcome = outcomeRecord(match.outcome)
  if (outcome?.type === "DRAW") {
    return "Draw"
  }
  if (outcome?.type === "FAILED" && typeof outcome.reason === "string") {
    return `Failed: ${outcome.reason}`
  }
  const winner =
    typeof outcome?.winnerPlayerId === "string"
      ? outcome.winnerPlayerId
      : match.winnerPlayerId
  return winner ? `Winner: ${winner}` : "Complete"
}
