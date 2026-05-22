import type {
  AnalyticsEvidenceBand,
  AnalyticsGauntletProfileRun,
  AnalyticsMatchupRecord,
} from "@cowards/spec"

export const bandLabel = (band: AnalyticsEvidenceBand): string => {
  switch (band) {
    case "strong":
      return "Strong"
    case "thin":
      return "Thin"
    case "degraded_non_counted":
      return "Degraded"
    case "system_failed":
      return "System failed"
  }
}

export const formatWld = (matchup: AnalyticsMatchupRecord): string =>
  `${matchup.wins}-${matchup.losses}-${matchup.draws}`

export const formatHeatmapCell = (matchup: AnalyticsMatchupRecord): string => {
  if (matchup.evidence.band === "system_failed") {
    return "System failed"
  }
  if (matchup.evidence.band === "degraded_non_counted") {
    return `${formatWld(matchup)} degraded`
  }
  return `${formatWld(matchup)} ${matchup.points} pts`
}

export const sortMatchupsForWeakness = (
  matchups: readonly AnalyticsMatchupRecord[],
): AnalyticsMatchupRecord[] =>
  [...matchups].sort(
    (left, right) =>
      left.points - right.points ||
      right.losses - left.losses ||
      left.evidence.completedCount - right.evidence.completedCount ||
      left.opponent.tier.localeCompare(right.opponent.tier) ||
      left.opponent.label.localeCompare(right.opponent.label),
  )

export const summarizeRun = (run: AnalyticsGauntletProfileRun): string =>
  `${run.summary.totals.wins}-${run.summary.totals.losses}-${run.summary.totals.draws} · ${run.summary.totals.points} pts · ${run.summary.totals.matchups} matchups`

export const getRepresentativeReplayHref = (
  matchup: AnalyticsMatchupRecord,
): string | null => matchup.replayReferences[0]?.href ?? null
