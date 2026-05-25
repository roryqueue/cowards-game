import type {
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
  "Docker/container is v1.20 readiness evidence; WASM/WASI is v1.21 runtime-candidate evidence. Neither is production sandbox certification."

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

const statusLabel = (result: PublicMatchSetResultDto): string => {
  if (result.status === "queued" || result.status === "accepted") {
    return "Queued; Go owns the job lifecycle until Matches start."
  }
  if (result.status === "running") {
    return "Running or slow; exhibition Matches remain bounded by outer MatchSet/job budgets."
  }
  if (result.status === "complete") {
    return "Complete; scoring and replay publication are Go-owned."
  }
  if (result.status === "degraded") {
    return "Degraded; at least one Match produced public-safe partial or failure evidence."
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

export const matchSetEvidenceRows = (
  result: PublicMatchSetResultDto,
  entrantRuntimeLabels: readonly string[],
): EvidenceRow[] => [
  { label: "status", value: statusLabel(result) },
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
    value: "Signed-in reliability proofs use bounded cycles, not stress tests.",
  },
  { label: "entrants", value: entrantRuntimeLabels.join(", ") },
  { label: "privacy", value: publicReliabilityPrivacyCue },
]

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
