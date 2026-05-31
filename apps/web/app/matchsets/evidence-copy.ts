import type {
  MatchExecutionLifecycleV1,
  PublicMatchEvidenceDto,
  PublicMatchSetResultDto,
} from "@cowards/spec"
import type { ReplayReadyDto } from "../matches/types.js"

export interface EvidenceRow {
  label: string
  value: string
}

export const publicReliabilityPrivacyCue =
  "private code, memory, objectives, environment values, host path values, raw streams, stack traces, tokens, DB details, and runtime internals excluded"

export const reliabilityBudgetCue =
  "Strategy calls keep the 1000 ms deterministic cap; Match/runtime-service and proof budgets are outer reliability windows."

export const candidateLaneCue =
  "Docker/container is v1.20 readiness evidence; WASM/WASI is v1.23 non-counted exhibition beta readiness evidence. Neither is production sandbox certification."

const matchReasonLabel = (
  reason: PublicMatchEvidenceDto["publicReason"],
): string => {
  switch (reason) {
    case "strategy_failure":
      return "strategy-failed"
    case "system_failure":
      return "system-failed"
    case "invalid_result":
      return "invalid-result"
    case "no_result":
      return "no-result"
    default:
      return "unspecified"
  }
}

export const publicMatchEvidenceLabel = (
  match: Pick<PublicMatchEvidenceDto, "status" | "publicReason">,
): string => {
  if (match.publicReason) {
    switch (match.publicReason) {
      case "strategy_failure":
        return "Strategy failure"
      case "system_failure":
        return "System failure"
      case "invalid_result":
        return "Invalid public result"
      case "no_result":
        return "No public result"
    }
  }
  switch (match.status) {
    case "pending":
      return "Pending"
    case "running":
      return "Running"
    case "complete":
      return "Replay unavailable"
    case "failed_system":
      return "Failed"
    case "blocked":
      return "Blocked"
  }
  return "Pending"
}

type PublicMatchSetEvidenceInput = PublicMatchSetResultDto & {
  lifecycle?: MatchExecutionLifecycleV1 | undefined
}

const statusLabel = (result: PublicMatchSetEvidenceInput): string => {
  const state = result.lifecycle?.state ?? result.status
  if (state === "queued" || state === "accepted") {
    return "Queued; Go owns the job lifecycle until Matches start."
  }
  if (state === "running") {
    return "Running or slow; exhibition Matches remain bounded by outer MatchSet/job budgets."
  }
  if (state === "complete") {
    return "Complete; scoring and replay publication are Go-owned."
  }
  if (state === "degraded") {
    return "Degraded; terminal partial public evidence, not a counted clean outcome by default."
  }
  if (state === "unavailable") {
    return "Unavailable; execution dependencies cannot currently provide public Match evidence."
  }
  return "Failed; public evidence is limited to safe status and reason categories."
}

const retryPolicy = (matches: readonly PublicMatchEvidenceDto[]): string => {
  const reasons = new Set(matches.map((match) => match.publicReason))
  const statuses = new Set(matches.map((match) => match.status))
  if (reasons.has("strategy_failure")) {
    return "Strategy-caused failures are terminal evidence and are not retried as system failures."
  }
  if (statuses.has("blocked")) {
    return "Blocked Matches stop before replayable execution evidence and are shown as terminal public status."
  }
  if (reasons.has("invalid_result")) {
    return "Invalid public results are terminal evidence and stay separated from retryable system failures."
  }
  if (reasons.has("no_result")) {
    return "No-result Matches expose only safe status evidence until Go-owned completion produces replayable output."
  }
  if (reasons.has("system_failure") || statuses.has("failed_system")) {
    return "Retryable system/runtime-service failures are Go-owned while attempts remain; terminal failures stay public-safe."
  }
  if (statuses.has("running") || statuses.has("pending")) {
    return "Pending and running Matches may continue or retry only through Go-owned orchestration."
  }
  return "No retry was needed for the completed public evidence."
}

const matchStateSummary = (
  matches: readonly PublicMatchEvidenceDto[],
): string => {
  const counts = new Map<string, number>()
  for (const match of matches) {
    const key =
      match.status === "failed_system" && match.publicReason
        ? matchReasonLabel(match.publicReason)
        : match.status
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  if (counts.size === 0) {
    return "No Match rows are public yet."
  }
  return [...counts.entries()]
    .map(([state, count]) => `${state}: ${count}`)
    .join(", ")
}

const lifecycleResultExplanation = (
  result: PublicMatchSetEvidenceInput,
): string => {
  const lifecycle = result.lifecycle
  if (!lifecycle) {
    if (result.status === "complete") {
      return "Complete public result; scoring and replay links are expected when public evidence is available."
    }
    if (result.status === "queued" || result.status === "accepted") {
      return "Queued public result; no scoring or replay claim is made before execution starts."
    }
    if (result.status === "running") {
      return "Running public result; players can see that execution is in progress without private runtime details."
    }
    if (result.status === "degraded") {
      return "Degraded public result; partial evidence is shown without overclaiming a clean counted outcome."
    }
    if (result.status === "failed") {
      return "Failed public result; only safe status and reason categories are shown."
    }
    return "Public result state is shown from the public MatchSet summary only."
  }
  if (lifecycle.state === "complete") {
    return "Complete public result; scoring and replay links are expected when public evidence is available."
  }
  if (lifecycle.state === "queued" || lifecycle.state === "accepted") {
    return "Queued public result; no scoring or replay claim is made before Go-owned execution starts."
  }
  if (lifecycle.state === "running") {
    return "Running public result; players can see that execution is in progress without private runtime details."
  }
  if (lifecycle.failureCategory === "runtime_unavailable") {
    return "Unavailable runtime; public evidence says execution could not start or continue in the runtime lane."
  }
  if (lifecycle.failureCategory === "malformed_runtime_result") {
    return "Malformed runtime result; the public result was rejected without exposing raw runtime output."
  }
  if (lifecycle.failureCategory === "stale_artifact") {
    return "Stale artifact; public evidence is terminal, and stale replay evidence is not trusted for playback."
  }
  if (lifecycle.failureCategory === "missing_chronicle") {
    return "Missing Chronicle; result evidence remains public, but replay proof is not available."
  }
  if (lifecycle.failureCategory === "no_result") {
    return "No public result; no winner, scoring, or replay claim is made from this evidence."
  }
  if (lifecycle.failureCategory === "timeout") {
    return "Timeout; public result evidence is bounded by the Match execution budget."
  }
  if (lifecycle.failureCategory === "strategy_failure") {
    return "Strategy failure; terminal public evidence is attributed without retrying it as a system failure."
  }
  if (lifecycle.failureCategory === "system_failure") {
    return "System failure; retry handling remains Go-owned while public output stays coarse."
  }
  if (lifecycle.state === "degraded") {
    return "Degraded public result; partial evidence is shown without overclaiming a clean counted outcome."
  }
  return "Failed public result; only safe status and reason categories are shown."
}

export const matchSetEvidenceRows = (
  result: PublicMatchSetEvidenceInput,
  entrantRuntimeLabels: readonly string[],
): EvidenceRow[] => {
  const lifecycle = result.lifecycle
  return [
    { label: "status", value: statusLabel(result) },
    { label: "result state", value: lifecycleResultExplanation(result) },
    ...(lifecycle
      ? [
          {
            label: "lifecycle",
            value: `${lifecycle.state}; ${lifecycle.terminal ? "terminal" : "non-terminal"}; ${lifecycle.retryDisposition}`,
          },
          {
            label: "availability",
            value: `result: ${lifecycle.resultAvailability}; replay: ${lifecycle.replayAvailability}`,
          },
        ]
      : []),
    { label: "match states", value: matchStateSummary(result.matches) },
    { label: "retry policy", value: retryPolicy(result.matches) },
    { label: "timeout budget", value: reliabilityBudgetCue },
    {
      label: "runtime evidence",
      value: "Public runtime labels below; execution-path proof is gated.",
    },
    { label: "candidate lane", value: candidateLaneCue },
    {
      label: "proof limits",
      value:
        "Signed-in reliability proofs use bounded cycles, not stress tests.",
    },
    { label: "entrants", value: entrantRuntimeLabels.join(", ") },
    { label: "privacy", value: publicReliabilityPrivacyCue },
  ]
}

export const publicPrivacyProvenanceCue =
  "source, private memory, objectives, owner debug data, raw diagnostics, and runtime internals"

export const replayEvidenceRows = (data: ReplayReadyDto): EvidenceRow[] => [
  {
    label: "status",
    value:
      data.mode === "owner"
        ? "Owner debug view; public replay evidence remains separately gated."
        : "Public replay proof; Match playback is reconstructed from public Chronicle projection.",
  },
  { label: "timeout budget", value: reliabilityBudgetCue },
  { label: "candidate lane", value: candidateLaneCue },
  {
    label: "runtime evidence",
    value: "Replay DTO shows public outcome evidence, not runtime internals.",
  },
  ...(data.contract
    ? [
        {
          label: "lifecycle",
          value: `${data.contract.lifecycle.state}; ${data.contract.lifecycle.retryDisposition}; replay: ${data.contract.lifecycle.replayAvailability}`,
        },
      ]
    : []),
  { label: "privacy", value: publicReliabilityPrivacyCue },
]

export const statusChipClass = (
  status: PublicMatchSetResultDto["status"],
): string => {
  if (status === "complete") {
    return "valid"
  }
  if (status === "degraded" || status === "running" || status === "queued") {
    return "warning"
  }
  if (status === "failed") {
    return "invalid"
  }
  return ""
}
