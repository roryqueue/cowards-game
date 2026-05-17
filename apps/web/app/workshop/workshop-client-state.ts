import type { StrategyRevisionValidationReport } from "@cowards/spec"
import type { WorkshopRevisionSummary } from "./types.js"

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
