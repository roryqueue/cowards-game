import {
  MATCH_EXECUTION_APP_CONTRACT_VERSION,
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1,
} from "@cowards/spec"
import { isMatchExecutionFixtureEnabled } from "../../../lib/match-execution-fixture-adapter.js"

export const dynamic = "force-dynamic"

const notFound = (): never => {
  const error = new Error("NEXT_HTTP_ERROR_FALLBACK;404") as Error & {
    digest: "NEXT_HTTP_ERROR_FALLBACK;404"
  }
  error.digest = "NEXT_HTTP_ERROR_FALLBACK;404"
  throw error
}

const matchSetHref = (fixtureId: string): string =>
  `/matchsets/${encodeURIComponent(`match-set:fixture:${fixtureId}`)}`

const replayHref = (matchId: string): string =>
  `/matches/${encodeURIComponent(matchId)}/replay`

export default function MatchExecutionFixtureCatalogPage() {
  if (!isMatchExecutionFixtureEnabled()) {
    notFound()
  }

  return (
    <main className="app-page">
      <section className="app-panel fixture-catalog-page">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Test Support</p>
            <h1>Match Execution Fixtures</h1>
            <p className="workshop-muted">
              {MATCH_EXECUTION_APP_CONTRACT_VERSION}
            </p>
          </div>
          <div className="app-actions">
            <a href="/account">Account</a>
          </div>
        </div>

        <div className="status-strip">
          <span className="workshop-chip valid">fixture mode</span>
          <span>Frozen public app DTOs only</span>
          <span>No live execution service required</span>
          <span>Not a production fallback</span>
        </div>

        <div className="fixture-catalog-grid">
          {MATCH_EXECUTION_CONTRACT_FIXTURES_V1.map((fixture) => {
            const summary = fixture.app.matchSetSummary
            const match = summary?.matches[0]
            const lifecycle = summary?.lifecycle
            const replay = fixture.app.replayMetadata
            return (
              <article
                className="fixture-card"
                data-testid={`fixture-card-${fixture.id}`}
                key={fixture.id}
              >
                <div className="app-section-header compact">
                  <div>
                    <p className="workshop-muted">{fixture.id}</p>
                    <h2>{fixture.label}</h2>
                  </div>
                  <span className="workshop-chip">
                    {lifecycle?.state ?? "no summary"}
                  </span>
                </div>
                <dl className="details-grid">
                  <dt>classification</dt>
                  <dd>{fixture.classification}</dd>
                  <dt>retry</dt>
                  <dd>{lifecycle?.retryDisposition ?? "n/a"}</dd>
                  <dt>result</dt>
                  <dd>{lifecycle?.resultAvailability ?? "n/a"}</dd>
                  <dt>replay</dt>
                  <dd>{lifecycle?.replayAvailability ?? "n/a"}</dd>
                  <dt>failure</dt>
                  <dd>{lifecycle?.failureCategory ?? "none"}</dd>
                </dl>
                <div className="fixture-card-actions">
                  {summary ? (
                    <a href={matchSetHref(fixture.id)}>Result</a>
                  ) : null}
                  {replay ? (
                    <a href={replayHref(replay.matchId)}>Replay</a>
                  ) : null}
                  {match && !match.replayAvailable ? (
                    <span className="workshop-muted">Replay unavailable</span>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}
