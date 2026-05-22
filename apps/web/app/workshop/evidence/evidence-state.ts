import type {
  AnalyticsEvidenceBand,
  AnalyticsGauntletProfileRun,
  AnalyticsMatchupRecord,
} from "@cowards/spec"
import { sortMatchupsForWeakness } from "../heatmap-state.js"

export type EvidenceSort = "weakness" | "points" | "evidence"
export type EvidenceReplayFilter = "all" | "with-replay" | "without-replay"
export type EvidenceCountedFilter = "all" | "counted" | "not-counted"
export type EvidenceBandFilter = "all" | AnalyticsEvidenceBand

export interface EvidenceFilters {
  band: EvidenceBandFilter
  tier: "all" | "starter" | "advanced" | "workshop"
  archetype: string
  counted: EvidenceCountedFilter
  replay: EvidenceReplayFilter
  sort: EvidenceSort
}

export const defaultEvidenceFilters: EvidenceFilters = {
  band: "all",
  tier: "all",
  archetype: "all",
  counted: "all",
  replay: "all",
  sort: "weakness",
}

export const filterEvidenceMatchups = (
  run: AnalyticsGauntletProfileRun,
  filters: EvidenceFilters,
): AnalyticsMatchupRecord[] => {
  const filtered = run.summary.matchupRecords.filter((matchup) => {
    if (filters.band !== "all" && matchup.evidence.band !== filters.band) {
      return false
    }
    if (filters.tier !== "all" && matchup.opponent.tier !== filters.tier) {
      return false
    }
    if (
      filters.archetype !== "all" &&
      !matchup.opponent.archetypeTags.includes(filters.archetype)
    ) {
      return false
    }
    if (
      filters.counted !== "all" &&
      matchup.evidence.counted !== (filters.counted === "counted")
    ) {
      return false
    }
    const hasReplay = matchup.replayReferences.length > 0
    if (filters.replay === "with-replay" && !hasReplay) {
      return false
    }
    if (filters.replay === "without-replay" && hasReplay) {
      return false
    }
    return true
  })

  if (filters.sort === "points") {
    return filtered.sort(
      (left, right) =>
        right.points - left.points ||
        left.opponent.label.localeCompare(right.opponent.label),
    )
  }
  if (filters.sort === "evidence") {
    return filtered.sort(
      (left, right) =>
        right.evidence.completedCount - left.evidence.completedCount ||
        left.opponent.label.localeCompare(right.opponent.label),
    )
  }
  return sortMatchupsForWeakness(filtered)
}
