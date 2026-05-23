import type {
  MatchSetId,
  StrategyRevisionId,
  StrategyRevisionValidationReport,
  WorkshopAnalyticsSnapshot,
} from "@cowards/spec"
import type {
  WorkshopOpponentSummary,
  WorkshopPresetSummary,
  WorkshopRevisionSummary,
  WorkshopSnapshot,
  WorkshopSampleSummary,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
} from "@cowards/persistence/workshop"

export type {
  WorkshopOpponentSummary,
  WorkshopPresetSummary,
  WorkshopRevisionSummary,
  WorkshopSnapshot,
  WorkshopSampleSummary,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
  WorkshopAnalyticsSnapshot,
}

export type WorkshopInitialData = WorkshopSnapshot & {
  analytics: WorkshopAnalyticsSnapshot
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

export type WorkshopMatchHasReplay =
  WorkshopTestSummary["matches"][number]["hasReplay"]

export interface WorkshopLaunchTestResponse {
  matchSetId: MatchSetId
  matchIds: string[]
  status: WorkshopTestSummary["status"]
  matchCount: number
  matches: WorkshopTestSummary["matches"]
  scoring: WorkshopTestSummary["scoring"]
}

export interface WorkshopErrorResponse {
  error: string
}
