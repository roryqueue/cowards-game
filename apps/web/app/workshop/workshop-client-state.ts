import type { StrategyRevisionValidationReport } from "@cowards/spec"
import type { WorkshopRevisionSummary } from "./types.js"
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
): string => `${issue.severity.toUpperCase()} · ${issue.code}`

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

export const canSubmitRevision = (input: {
  validation: StrategyRevisionValidationReport | null
  checking: boolean
  submitting: boolean
}): boolean =>
  Boolean(input.validation?.valid) && !input.checking && !input.submitting

export const getSubmitBlockedReason = (input: {
  validation: StrategyRevisionValidationReport | null
  checking: boolean
}): string | null => {
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

export const getReplayHref = (matchId: string): string =>
  `/matches/${encodeURIComponent(matchId)}/replay`

export const canOpenReplay = (match: WorkshopMatchSummary): boolean =>
  match.status === "complete" && match.hasReplay === true

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
