import { Fragment } from "react"
import type { ReplayUnavailableDto } from "../../types.js"

export function ReplayUnavailable({ data }: { data: ReplayUnavailableDto }) {
  return (
    <main className="replay-page replay-page--unavailable">
      <header className="replay-header">
        <div>
          <p className="replay-product-label">Coward&apos;s Game</p>
          <h1>Replay unavailable</h1>
        </div>
        <span className="replay-status-chip">Replay unavailable</span>
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
          {(data.evidenceRows ?? []).map((row) => (
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
