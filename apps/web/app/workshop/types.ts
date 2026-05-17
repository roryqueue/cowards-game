import type {
  MatchSetId,
  StrategyRevisionId,
  StrategyRevisionValidationReport,
} from "@cowards/spec"
import type {
  WorkshopOpponentSummary,
  WorkshopPresetSummary,
  WorkshopRevisionSummary,
  WorkshopSnapshot,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
} from "@cowards/persistence/workshop"

export type {
  WorkshopOpponentSummary,
  WorkshopPresetSummary,
  WorkshopRevisionSummary,
  WorkshopSnapshot,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
}

export interface WorkshopSubmitRequest {
  source: string
  label?: string | undefined
  notes?: string | undefined
}

export type WorkshopSubmitResponse =
  | {
      ok: true
      revision: WorkshopRevisionSummary
      validation: StrategyRevisionValidationReport
    }
  | {
      ok: false
      validation: StrategyRevisionValidationReport
    }

export interface WorkshopSourceResponse {
  revisionId: StrategyRevisionId
  source: string
}

export interface WorkshopLaunchTestRequest {
  revisionId: StrategyRevisionId
  opponentId: WorkshopOpponentSummary["id"]
  presetId: WorkshopPresetSummary["id"]
}

export interface WorkshopLaunchTestResponse {
  matchSetId: MatchSetId
  matchIds: string[]
}

export interface WorkshopErrorResponse {
  error: string
}
