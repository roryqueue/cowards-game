import type {
  MatchSetId,
  RuntimeViolationType,
  StrategyRevision,
  StrategyRevisionId,
  StrategyArtifactSourceFormat,
  StrategyRevisionValidationCode,
  StrategyRevisionValidationReport,
  StrategyRuntimeProductSemantics,
  WorkshopAnalyticsSnapshot,
  WorkshopTestSummary,
} from "@cowards/spec"

export type MatchSetPresetId = "smoke-v1" | "standard-v1" | "stress-v1"

export interface WorkshopRevisionSummary {
  id: StrategyRevisionId
  strategyId: string
  label?: string | undefined
  notes?: string | undefined
  createdBy?: string | undefined
  sourceHash: string
  sourceBytes: number
  sourceFormat: StrategyArtifactSourceFormat
  valid: boolean
  validation: StrategyRevisionValidationReport
  metadata: StrategyRevision["metadata"]
  runtimeSemantics: StrategyRuntimeProductSemantics
  createdAt: string
  usedInMatches: number
}

export interface WorkshopPresetSummary {
  id: MatchSetPresetId
  label: string
  matchCount: number
  arenaVariantIds: string[]
  seeds: string[]
  mirrorSides: boolean
}

export interface WorkshopOpponentSummary {
  id: "opponent:cautious" | "opponent:reckless"
  label: string
  revisionId: StrategyRevisionId
}

export interface WorkshopTemplateSummary {
  id:
    | "template:cautious"
    | "template:reckless"
    | "template:sentinel"
    | "template:python-tactical"
    | "template:rust-wasi-tactical"
    | "template:zig-wasi-tactical"
  label: string
  sourceFormat: StrategyArtifactSourceFormat
  experimental?: boolean | undefined
  countedPlayEligible?: boolean | undefined
  source: string
  validation: StrategyRevisionValidationReport
}

interface WorkshopSampleBase {
  id: `sample:${string}`
  label: string
  description: string
  categories: string[]
  sourceFormat?: StrategyArtifactSourceFormat | undefined
  source: string
  validation: StrategyRevisionValidationReport
}

export type WorkshopSampleSummary =
  | (WorkshopSampleBase & {
      sampleKind: "starter"
      expectedValidationCode?: undefined
      expectedRuntimeViolationType?: undefined
    })
  | (WorkshopSampleBase & {
      sampleKind: "failure-mode"
      expectedValidationCode?: StrategyRevisionValidationCode | undefined
      expectedRuntimeViolationType?: RuntimeViolationType | undefined
    })

export interface StarterStrategySummary {
  id: string
  name: string
  version: string
  description: string
  tags: string[]
  doctrineNotes: string[]
  expectedBehavior: string
  usesMemory: boolean
  source: string
  validation: StrategyRevisionValidationReport
  sourceHash: string
  sourceBytes: number
}

export interface AdvancedStrategySummary extends StarterStrategySummary {
  primaryArchetype: string
  benchmarkStarterId: string
}

export interface WorkshopSnapshot {
  templateSource: string
  templateValidation: StrategyRevisionValidationReport
  revisions: WorkshopRevisionSummary[]
  presets: WorkshopPresetSummary[]
  opponents: WorkshopOpponentSummary[]
  templates: WorkshopTemplateSummary[]
  starters: StarterStrategySummary[]
  advancedStrategies: AdvancedStrategySummary[]
  samples: WorkshopSampleSummary[]
}

export type { WorkshopTestSummary, WorkshopAnalyticsSnapshot }

export type WorkshopInitialData = WorkshopSnapshot & {
  analytics: WorkshopAnalyticsSnapshot
}

export interface WorkshopSubmitRequest {
  source: string
  sourceFormat?: StrategyArtifactSourceFormat | undefined
  runtime?: StrategyRevision["runtime"] | undefined
  validation?: StrategyRevisionValidationReport | undefined
  engineCompatibility?: StrategyRevision["engineCompatibility"] | undefined
  metadata?: StrategyRevision["metadata"] | undefined
  runtimeServiceValidated?: boolean | undefined
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
