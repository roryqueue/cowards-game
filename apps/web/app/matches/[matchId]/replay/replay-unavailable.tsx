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
          <dt>Evidence</dt>
          <dd>Public replay projection is unavailable for this Match.</dd>
          <dt>Public safety</dt>
          <dd>
            The page only shows public status and reason categories. Private
            authoring data and runtime details remain withheld.
          </dd>
          <dt>Next step</dt>
          <dd>
            Return to the MatchSet result page for lifecycle, retry, and
            availability evidence.
          </dd>
        </dl>
      </section>
    </main>
  )
}
