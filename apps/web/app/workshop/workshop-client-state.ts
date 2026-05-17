import type { StrategyRevisionValidationReport } from "@cowards/spec"

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
