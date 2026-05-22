"use client"

import { useState } from "react"
import type {
  AnalyticsGauntletProfile,
  AnalyticsGauntletProfileRun,
  AnalyticsMatchupRecord,
} from "@cowards/spec"
import {
  bandLabel,
  formatHeatmapCell,
  formatWld,
  getRepresentativeReplayHref,
  sortMatchupsForWeakness,
  summarizeRun,
} from "./heatmap-state.js"

export interface WorkshopHeatmapProps {
  profiles: AnalyticsGauntletProfile[]
  runs: AnalyticsGauntletProfileRun[]
  selectedProfileId: string
  selectedRunId: string
}

const evidenceClass = (matchup: AnalyticsMatchupRecord): string =>
  `analytics-cell band-${matchup.evidence.band}`

export function WorkshopHeatmap({
  profiles,
  runs,
  selectedProfileId,
  selectedRunId,
}: WorkshopHeatmapProps) {
  const [profileMessage, setProfileMessage] = useState("")
  const profile =
    profiles.find((candidate) => candidate.id === selectedProfileId) ??
    profiles[0]
  const run =
    runs.find((candidate) => candidate.id === selectedRunId) ?? runs[0]
  const matchups = run
    ? sortMatchupsForWeakness(run.summary.matchupRecords)
    : []
  const weakest = matchups[0]
  const ownerLocal = profile?.ownerUserId === "user:local"

  return (
    <section className="workshop-panel workshop-stack analytics-panel">
      <div className="workshop-row">
        <div>
          <h2 className="workshop-heading">Matchup heatmap</h2>
          <p className="workshop-muted">
            Saved profile evidence across Starters and Advanced seeds.
          </p>
        </div>
        <span className="workshop-chip">v1.6</span>
      </div>
      {profile && run ? (
        <>
          <div className="analytics-summary-strip">
            <strong>{profile.name}</strong>
            <span>{summarizeRun(run)}</span>
            <span title={profile.compatibility.hash}>
              {profile.compatibility.hash.slice(0, 18)}
            </span>
          </div>
          <div className="analytics-heatmap" data-testid="analytics-heatmap">
            {matchups.map((matchup) => {
              const replayHref = getRepresentativeReplayHref(matchup)
              return (
                <div
                  className={evidenceClass(matchup)}
                  data-band={matchup.evidence.band}
                  key={matchup.opponent.opponentId}
                  title={`${matchup.opponent.label}: ${bandLabel(matchup.evidence.band)}`}
                >
                  <span className="analytics-cell-opponent">
                    {matchup.opponent.label}
                  </span>
                  <span className="analytics-cell-score">
                    {formatHeatmapCell(matchup)}
                  </span>
                  <span className="analytics-cell-band">
                    {bandLabel(matchup.evidence.band)} ·{" "}
                    {matchup.evidence.completedCount}/
                    {matchup.evidence.totalCount}
                  </span>
                  {replayHref ? (
                    <a className="analytics-cell-replay" href={replayHref}>
                      Replay
                    </a>
                  ) : null}
                  <a
                    className="analytics-cell-evidence"
                    href={`/workshop/evidence?opponent=${encodeURIComponent(matchup.opponent.opponentId)}`}
                  >
                    Evidence
                  </a>
                </div>
              )
            })}
          </div>
          {weakest ? (
            <div className="analytics-weakness" data-testid="weakest-matchup">
              <p className="workshop-label">Weakest archetype</p>
              <strong>{weakest.opponent.label}</strong>
              <span className="workshop-muted">
                {formatWld(weakest)} · {weakest.points} points ·{" "}
                {weakest.opponent.archetypeTags.slice(0, 3).join(", ")}
              </span>
              <div className="workshop-chip-row">
                <a
                  className="workshop-replay-link"
                  href={`/workshop/evidence?opponent=${encodeURIComponent(weakest.opponent.opponentId)}`}
                >
                  Open evidence
                </a>
                {getRepresentativeReplayHref(weakest) ? (
                  <a
                    className="workshop-replay-link"
                    href={getRepresentativeReplayHref(weakest)!}
                  >
                    Representative replay
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          {ownerLocal ? (
            <div className="analytics-export-row">
              <button
                type="button"
                onClick={async () => {
                  const response = await fetch(
                    "/api/workshop/analytics/profiles",
                    {
                      method: "POST",
                    },
                  )
                  setProfileMessage(
                    response.ok ? "Profile saved" : "Profile save blocked",
                  )
                }}
              >
                Save profile
              </button>
              <button
                type="button"
                onClick={async () => {
                  const response = await fetch(
                    `/api/workshop/analytics/profiles/${encodeURIComponent(profile.id)}/runs`,
                    { method: "POST" },
                  )
                  setProfileMessage(
                    response.ok ? "Compatible rerun ready" : "Rerun blocked",
                  )
                }}
              >
                Rerun profile
              </button>
              <a
                className="workshop-replay-link"
                href={`/api/workshop/analytics/profiles/${encodeURIComponent(profile.id)}/compare`}
              >
                Compare runs
              </a>
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
          {profileMessage ? (
            <p className="workshop-muted" role="status">
              {profileMessage}
            </p>
          ) : null}
          <p className="workshop-muted">
            Owner-safe exports omit Strategy source, StrategyMemory,
            SoldierMemory, objective payloads, raw Awareness Grid, owner debug,
            stack traces, and private runtime internals.
          </p>
        </>
      ) : (
        <p className="workshop-muted">
          Save or load a compatible gauntlet profile to populate analytics.
        </p>
      )}
    </section>
  )
}
