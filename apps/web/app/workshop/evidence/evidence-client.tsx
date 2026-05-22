"use client"

import { useMemo, useState } from "react"
import type { AnalyticsMatchupRecord } from "@cowards/spec"
import type { WorkshopInitialData } from "../types.js"
import { bandLabel, formatWld } from "../heatmap-state.js"
import {
  defaultEvidenceFilters,
  filterEvidenceMatchups,
  type EvidenceFilters,
} from "./evidence-state.js"

export interface EvidenceExplorerClientProps {
  initialData: WorkshopInitialData
  defaultOpponentId?: string | undefined
}

const replayLabel = (matchup: AnalyticsMatchupRecord): string =>
  matchup.replayReferences.length
    ? matchup.replayReferences[0]!.label
    : "Replay unavailable"

export function EvidenceExplorerClient({
  initialData,
  defaultOpponentId,
}: EvidenceExplorerClientProps) {
  const run =
    initialData.analytics.runs.find(
      (candidate) => candidate.id === initialData.analytics.selectedRunId,
    ) ?? initialData.analytics.runs[0]
  const [filters, setFilters] = useState<EvidenceFilters>(
    defaultEvidenceFilters,
  )
  const matchups = useMemo(
    () => (run ? filterEvidenceMatchups(run, filters) : []),
    [filters, run],
  )
  const initialSelection =
    matchups.find(
      (matchup) => matchup.opponent.opponentId === defaultOpponentId,
    ) ??
    matchups[0] ??
    null
  const [selectedOpponentId, setSelectedOpponentId] = useState(
    initialSelection?.opponent.opponentId ?? "",
  )
  const selected =
    matchups.find(
      (matchup) => matchup.opponent.opponentId === selectedOpponentId,
    ) ?? initialSelection

  const updateFilter = <K extends keyof EvidenceFilters>(
    key: K,
    value: EvidenceFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }
  const archetypes = useMemo(
    () =>
      [
        ...new Set(
          run?.summary.matchupRecords.flatMap(
            (matchup) => matchup.opponent.archetypeTags,
          ) ?? [],
        ),
      ].sort(),
    [run],
  )
  const ownerLocal =
    initialData.analytics.profiles[0]?.ownerUserId === "user:local"

  return (
    <main className="app-page evidence-page">
      <section className="app-panel evidence-header">
        <div>
          <p className="workshop-muted">Coward&apos;s Game</p>
          <h1>Evidence Explorer</h1>
          <p className="workshop-muted">
            Strategy matchup evidence, sorted to reveal weak archetypes first.
          </p>
        </div>
        <a className="workshop-replay-link" href="/">
          Back to Workshop
        </a>
      </section>

      <section className="app-panel evidence-controls" aria-label="Filters">
        <label>
          <span className="workshop-label">Band</span>
          <select
            value={filters.band}
            onChange={(event) =>
              updateFilter(
                "band",
                event.currentTarget.value as EvidenceFilters["band"],
              )
            }
          >
            <option value="all">All bands</option>
            <option value="strong">Strong</option>
            <option value="thin">Thin</option>
            <option value="degraded_non_counted">Degraded</option>
            <option value="system_failed">System failed</option>
          </select>
        </label>
        <label>
          <span className="workshop-label">Tier</span>
          <select
            value={filters.tier}
            onChange={(event) =>
              updateFilter(
                "tier",
                event.currentTarget.value as EvidenceFilters["tier"],
              )
            }
          >
            <option value="all">All tiers</option>
            <option value="starter">Starter</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
        <label>
          <span className="workshop-label">Counted</span>
          <select
            value={filters.counted}
            onChange={(event) =>
              updateFilter(
                "counted",
                event.currentTarget.value as EvidenceFilters["counted"],
              )
            }
          >
            <option value="all">All</option>
            <option value="counted">Counted</option>
            <option value="not-counted">Not counted</option>
          </select>
        </label>
        <label>
          <span className="workshop-label">Archetype</span>
          <select
            value={filters.archetype}
            onChange={(event) =>
              updateFilter("archetype", event.currentTarget.value)
            }
          >
            <option value="all">All archetypes</option>
            {archetypes.map((archetype) => (
              <option key={archetype} value={archetype}>
                {archetype}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="workshop-label">Replay</span>
          <select
            value={filters.replay}
            onChange={(event) =>
              updateFilter(
                "replay",
                event.currentTarget.value as EvidenceFilters["replay"],
              )
            }
          >
            <option value="all">All</option>
            <option value="with-replay">With replay</option>
            <option value="without-replay">Without replay</option>
          </select>
        </label>
        <label>
          <span className="workshop-label">Sort</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              updateFilter(
                "sort",
                event.currentTarget.value as EvidenceFilters["sort"],
              )
            }
          >
            <option value="weakness">Weakness first</option>
            <option value="points">Points high to low</option>
            <option value="evidence">Evidence count</option>
          </select>
        </label>
      </section>

      <section className="evidence-layout">
        <div className="app-panel evidence-table" data-testid="evidence-table">
          {matchups.map((matchup) => (
            <button
              aria-pressed={
                selected?.opponent.opponentId === matchup.opponent.opponentId
              }
              className={`evidence-row band-${matchup.evidence.band} ${
                selected?.opponent.opponentId === matchup.opponent.opponentId
                  ? "active"
                  : ""
              }`}
              data-band={matchup.evidence.band}
              key={matchup.opponent.opponentId}
              onClick={() => setSelectedOpponentId(matchup.opponent.opponentId)}
              type="button"
            >
              <span data-label="Opponent">{matchup.opponent.label}</span>
              <span data-label="Tier">{matchup.opponent.tier}</span>
              <strong data-label="W-L-D">{formatWld(matchup)}</strong>
              <span data-label="Points">{matchup.points} pts</span>
              <span data-label="Band">{bandLabel(matchup.evidence.band)}</span>
            </button>
          ))}
          {matchups.length === 0 ? (
            <p className="workshop-muted">
              No evidence rows match these filters.
            </p>
          ) : null}
        </div>

        <aside
          className="app-panel evidence-detail"
          data-testid="evidence-detail"
        >
          {selected ? (
            <>
              <p className="workshop-label">Selected matchup</p>
              <h2>{selected.opponent.label}</h2>
              <p className="workshop-muted">
                {selected.opponent.archetypeTags.slice(0, 4).join(", ")}
              </p>
              <dl className="details-grid">
                <dt>W-L-D</dt>
                <dd>{formatWld(selected)}</dd>
                <dt>points</dt>
                <dd>{selected.points}</dd>
                <dt>band</dt>
                <dd>{bandLabel(selected.evidence.band)}</dd>
                <dt>evidence</dt>
                <dd>
                  {selected.evidence.completedCount}/
                  {selected.evidence.totalCount}
                </dd>
                <dt>side bias</dt>
                <dd>{selected.sideBias}</dd>
                <dt>MatchSet</dt>
                <dd>{selected.matchSetId}</dd>
                <dt>Match ids</dt>
                <dd>{selected.matchIds.slice(0, 8).join(", ")}</dd>
                <dt>compatibility</dt>
                <dd>{run?.summary.compatibility.hash.slice(0, 24)}</dd>
                <dt>mismatches</dt>
                <dd>
                  {run?.summary.compatibility.mismatches.length
                    ? run.summary.compatibility.mismatches.join(", ")
                    : "none"}
                </dd>
              </dl>
              <div className="workshop-match-list">
                {selected.replayReferences.map((replay) => (
                  <a
                    className="workshop-match-row evidence-replay-row"
                    href={replay.href}
                    key={`${replay.matchId}:${replay.momentType}`}
                  >
                    <span>{replay.label}</span>
                    <span className="workshop-muted">
                      {replay.momentType} #{replay.sequence}
                    </span>
                  </a>
                ))}
              </div>
              {selected.replayReferences.length === 0 ? (
                <p className="workshop-muted">{replayLabel(selected)}</p>
              ) : null}
              {ownerLocal ? (
                <div className="analytics-export-row">
                  <a
                    className="workshop-replay-link"
                    href="/api/workshop/analytics/export?format=json"
                  >
                    Export JSON
                  </a>
                  <a
                    className="workshop-replay-link"
                    href="/api/workshop/analytics/export?format=csv"
                  >
                    Export CSV
                  </a>
                </div>
              ) : null}
            </>
          ) : (
            <p className="workshop-muted">Select an evidence row.</p>
          )}
        </aside>
      </section>
    </main>
  )
}
