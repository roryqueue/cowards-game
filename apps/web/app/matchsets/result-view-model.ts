import type {
  MatchExecutionFailureCategoryV1,
  MatchExecutionLifecycleStateV1,
  MatchExecutionReplayAvailabilityV1,
} from "@cowards/spec"
import { describeStrategyRuntimeProductSemantics } from "@cowards/spec"
import type { PublicReadMatchSetResultDto } from "../../lib/public-service-boundary.js"
import {
  buildResultIntelligenceViewModel,
  type ResultIntelligenceViewModel,
} from "../match-intelligence.js"
import {
  candidateLaneCue,
  publicMatchEvidenceLabel,
  publicPrivacyProvenanceCue,
  publicReliabilityPrivacyCue,
  reliabilityBudgetCue,
} from "./evidence-copy.js"

export interface ResultWorkbenchMetric {
  label: string
  value: string
  tone?: "neutral" | "good" | "warning" | "danger" | undefined
}

export interface ResultWorkbenchSection {
  id: string
  title: string
  eyebrow: string
  summary: string
  metrics: ResultWorkbenchMetric[]
}

export interface ResultWorkbenchMatchRow {
  matchId: string
  bottomLabel: string
  topLabel: string
  status: string
  evidence: string
  replayHref?: string | undefined
  tone: "neutral" | "good" | "warning" | "danger"
}

export interface ResultWorkbenchViewModel {
  statusLabel: string
  statusTone: "neutral" | "good" | "warning" | "danger"
  lifecycleSummary: string
  availabilitySummary: string
  privacySummary: string
  intelligence: ResultIntelligenceViewModel
  sections: ResultWorkbenchSection[]
  matches: ResultWorkbenchMatchRow[]
}

const lifecycleCopy: Record<MatchExecutionLifecycleStateV1, string> = {
  queued:
    "Queued for orchestration. Public result evidence is not expected yet.",
  accepted:
    "Accepted by orchestration. Match execution has not published public evidence yet.",
  running:
    "Running under bounded execution. Partial public evidence can appear before terminal scoring.",
  complete:
    "Complete with public scoring evidence and replay links where available.",
  failed: "Failed with public-safe reason categories only.",
  degraded:
    "Degraded with partial evidence. Treat as inspectable, not a clean counted outcome.",
  unavailable:
    "Unavailable because execution dependencies cannot currently publish public evidence.",
}

const failureCopy: Record<MatchExecutionFailureCategoryV1, string> = {
  strategy_failure:
    "A submitted Strategy caused terminal public failure evidence.",
  system_failure:
    "Execution infrastructure failed before a clean public result was published.",
  timeout:
    "Execution exceeded a bounded public time window and is classified separately from Strategy failure.",
  runtime_unavailable:
    "The runtime path needed for execution was not available to publish result evidence.",
  malformed_runtime_result:
    "The runtime returned data that could not be accepted as public result evidence.",
  stale_artifact:
    "An immutable artifact reference was stale or blocked before replayable output was usable.",
  blocked:
    "The Match was blocked before public replay evidence could be accepted.",
  missing_chronicle:
    "Replay publication is blocked because the public Chronicle projection is missing.",
  no_result: "No public result evidence has been published for this Match.",
}

const replayAvailabilityCopy: Record<
  MatchExecutionReplayAvailabilityV1,
  string
> = {
  none: "No public replay is available.",
  pending: "Replay publication is pending.",
  available: "Replay is available from public projection data.",
  stale: "Replay evidence is stale and withheld from default public replay.",
  missing: "Replay evidence is missing.",
}

const lifecycleLabel: Record<MatchExecutionLifecycleStateV1, string> = {
  queued: "Queued",
  accepted: "Accepted",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  degraded: "Degraded",
  unavailable: "Unavailable",
}

const retryLabel = (
  retry: PublicReadMatchSetResultDto["lifecycle"]["retryDisposition"],
): string => {
  if (retry === "not_applicable") {
    return "No retry needed"
  }
  if (retry === "non_retryable") {
    return "Not retryable"
  }
  return "Retryable"
}

const availabilityLabel = (
  availability: PublicReadMatchSetResultDto["lifecycle"]["resultAvailability"],
): string => {
  if (availability === "complete") {
    return "Complete"
  }
  if (availability === "partial") {
    return "Partial"
  }
  return "None"
}

const replayLabel = (
  availability: PublicReadMatchSetResultDto["lifecycle"]["replayAvailability"],
): string => {
  switch (availability) {
    case "available":
      return "Available"
    case "pending":
      return "Pending"
    case "stale":
      return "Stale"
    case "missing":
      return "Missing"
    case "none":
      return "None"
  }
}

const failureLabel = (category: MatchExecutionFailureCategoryV1): string => {
  switch (category) {
    case "strategy_failure":
      return "Strategy failure"
    case "system_failure":
      return "System failure"
    case "timeout":
      return "Timeout"
    case "runtime_unavailable":
      return "Runtime unavailable"
    case "malformed_runtime_result":
      return "Malformed runtime result"
    case "stale_artifact":
      return "Stale artifact"
    case "blocked":
      return "Blocked"
    case "missing_chronicle":
      return "Missing Chronicle"
    case "no_result":
      return "No result"
  }
}

const toneForLifecycle = (
  state: MatchExecutionLifecycleStateV1,
): ResultWorkbenchViewModel["statusTone"] => {
  if (state === "complete") {
    return "good"
  }
  if (state === "failed" || state === "unavailable") {
    return "danger"
  }
  if (state === "degraded" || state === "running" || state === "queued") {
    return "warning"
  }
  return "neutral"
}

const toneForMatch = (
  match: PublicReadMatchSetResultDto["matches"][number],
): ResultWorkbenchMatchRow["tone"] => {
  if (match.publicReason) {
    return match.publicReason === "no_result" ? "warning" : "danger"
  }
  if (match.status === "complete") {
    return "good"
  }
  if (match.status === "failed_system" || match.status === "blocked") {
    return "danger"
  }
  if (match.status === "running" || match.status === "pending") {
    return "warning"
  }
  return "neutral"
}

const formatFailureCategories = (
  result: PublicReadMatchSetResultDto,
): string => {
  const categories = [
    ...new Set(
      result.contract.failureEvidence
        .map((failure) => failure.category)
        .concat(
          result.lifecycle.failureCategory
            ? [result.lifecycle.failureCategory]
            : [],
        ),
    ),
  ]
  if (!categories.length) {
    return "none"
  }
  return categories.map((category) => failureCopy[category]).join(" ")
}

const formatEntrantRuntimeSummary = (
  result: PublicReadMatchSetResultDto,
  entrantRuntimeLabels: readonly string[],
): string => {
  const storedCountedStatus =
    result.metadata &&
    typeof result.metadata === "object" &&
    !Array.isArray(result.metadata) &&
    "countedStatus" in result.metadata &&
    typeof result.metadata.countedStatus === "string"
      ? result.metadata.countedStatus
      : null
  const nonCountedLanguages = new Set<string>(
    result.contract.runtimeEvidence.eligibility.nonCountedExhibitionBeta,
  )
  const counted = result.entrants.filter(
    (entrant) => {
      if (storedCountedStatus === "non_counted") {
        return false
      }
      return (
        describeStrategyRuntimeProductSemantics(entrant.runtime)
          .countedPlayEligible &&
        !nonCountedLanguages.has(entrant.runtime.language.id)
      )
    },
  ).length
  const exhibition = result.entrants.length - counted
  return [
    `${counted} counted entrant${counted === 1 ? "" : "s"}`,
    exhibition
      ? `${exhibition} non-counted exhibition beta entrant${exhibition === 1 ? "" : "s"}`
      : "no non-counted exhibition beta entrants",
    entrantRuntimeLabels.join(", "),
  ].join("; ")
}

export const buildResultWorkbenchViewModel = (
  result: PublicReadMatchSetResultDto,
  entrantRuntimeLabels: readonly string[],
): ResultWorkbenchViewModel => {
  const lifecycle = result.lifecycle
  const statusTone = toneForLifecycle(lifecycle.state)
  const terminalLabel = lifecycle.terminal ? "terminal" : "in progress"
  const replayCopy = replayAvailabilityCopy[lifecycle.replayAvailability]
  const failureSummary = formatFailureCategories(result)
  const runtime = result.contract.runtimeEvidence
  const matches = result.matches.map((match) => ({
    matchId: match.matchId,
    bottomLabel: match.bottomLabel,
    topLabel: match.topLabel,
    status: match.status,
    evidence: match.replayHref
      ? "Replay available"
      : publicMatchEvidenceLabel(match),
    replayHref: match.replayHref,
    tone: toneForMatch(match),
  }))

  return {
    statusLabel: lifecycleLabel[lifecycle.state],
    statusTone,
    lifecycleSummary: lifecycleCopy[lifecycle.state],
    availabilitySummary: `Result ${availabilityLabel(lifecycle.resultAvailability).toLowerCase()}; replay ${replayLabel(lifecycle.replayAvailability).toLowerCase()}. ${replayCopy}`,
    privacySummary: publicReliabilityPrivacyCue,
    intelligence: buildResultIntelligenceViewModel(
      result,
      entrantRuntimeLabels,
    ),
    sections: [
      {
        id: "lifecycle",
        title: "Lifecycle",
        eyebrow: terminalLabel,
        summary: lifecycleCopy[lifecycle.state],
        metrics: [
          {
            label: "state",
            value: lifecycleLabel[lifecycle.state],
            tone: statusTone,
          },
          {
            label: "retry",
            value: retryLabel(lifecycle.retryDisposition),
            tone:
              lifecycle.retryDisposition === "retryable"
                ? "warning"
                : "neutral",
          },
          {
            label: "message",
            value: lifecycleCopy[lifecycle.state],
          },
        ],
      },
      {
        id: "availability",
        title: "Availability",
        eyebrow: "public output",
        summary: `${availabilityLabel(lifecycle.resultAvailability)} result evidence; ${replayCopy}`,
        metrics: [
          {
            label: "result",
            value: availabilityLabel(lifecycle.resultAvailability),
          },
          { label: "replay", value: replayLabel(lifecycle.replayAvailability) },
          {
            label: "Matches",
            value: `${matches.length} public row${matches.length === 1 ? "" : "s"}`,
          },
        ],
      },
      {
        id: "failure",
        title: "Failure and Retry Evidence",
        eyebrow: lifecycle.failureCategory
          ? failureLabel(lifecycle.failureCategory)
          : "No failure category",
        summary: failureSummary,
        metrics: result.contract.failureEvidence.length
          ? result.contract.failureEvidence.map((failure) => ({
              label: failureLabel(failure.category),
              value: `${retryLabel(failure.retryDisposition)}; ${failureCopy[failure.category]}`,
              tone:
                failure.retryDisposition === "retryable" ? "warning" : "danger",
            }))
          : [{ label: "failure", value: "none", tone: "good" }],
      },
      {
        id: "runtime",
        title: "Runtime Eligibility",
        eyebrow: runtime.ownership.hostileStrategyExecution,
        summary: [
          "JS/TS, Python, and provider-validated Rust are counted Strategy paths.",
          `${runtime.eligibility.nonCountedExhibitionBeta.join(", ")} remain non-counted exhibition beta for this evidence view.`,
          "The app reads frozen public DTOs only.",
        ].join(" "),
        metrics: [
          {
            label: "ABI",
            value: "Preview 1 stdin/stdout JSON",
          },
          {
            label: "app execution",
            value: runtime.ownership.appExecution ? "true" : "false",
            tone: runtime.ownership.appExecution ? "danger" : "good",
          },
          {
            label: "entrants",
            value: formatEntrantRuntimeSummary(result, entrantRuntimeLabels),
          },
        ],
      },
      {
        id: "proof",
        title: "Proof and Privacy",
        eyebrow: "public-safe",
        summary: publicReliabilityPrivacyCue,
        metrics: [
          { label: "budget", value: reliabilityBudgetCue },
          { label: "candidate lane", value: candidateLaneCue },
          { label: "provenance", value: publicPrivacyProvenanceCue },
        ],
      },
    ],
    matches,
  }
}
