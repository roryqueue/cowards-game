import { Fragment } from "react"
import type { ReplayUnavailableDto } from "../../types.js"

export function ReplayUnavailable({ data }: { data: ReplayUnavailableDto }) {
  const evidenceRows = data.evidenceRows?.length
    ? data.evidenceRows
    : [
        {
          label: "Evidence",
          value: "Public replay projection is unavailable for this Match.",
        },
        {
          label: "Public safety",
          value:
            "The page only shows public status and reason categories. Private authoring data and runtime details remain withheld.",
        },
        {
          label: "Next step",
          value:
            "Return to the MatchSet result page for lifecycle, retry, and availability evidence.",
        },
      ]

  return (
    <main className="replay-page replay-page--unavailable">
      <header className="replay-header">
        <div>
          <p className="replay-product-label">Coward&apos;s Game</p>
          <h1>Replay unavailable</h1>
        </div>
        <div className="replay-header-status">
          <span className="replay-status-chip">Replay unavailable</span>
          <div className="app-actions">
            <a href="/watch">Watch</a>
            <a href="/learn#trust">Trust</a>
          </div>
        </div>
      </header>

      <section
        className="replay-empty-state"
        aria-live="polite"
        data-testid="replay-unavailable-message"
      >
        <p className="replay-muted">Match {data.matchId}</p>
        <p>{data.message}</p>
        <dl className="replay-details-grid">
          <dt>Reason</dt>
          <dd>{data.reason}</dd>
          {evidenceRows.map((row) => (
            <Fragment key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </Fragment>
          ))}
        </dl>
      </section>
    </main>
  )
}
