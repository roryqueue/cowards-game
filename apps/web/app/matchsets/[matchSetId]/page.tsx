import type { MatchSetId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../competitive/server.js"

export const dynamic = "force-dynamic"

const resultCopy = (status: string): string => {
  switch (status) {
    case "complete":
      return "Valid public result"
    case "degraded":
      return "Degraded public result"
    case "failed":
      return "Invalid public result"
    default:
      return "Pending public result"
  }
}

export default async function MatchSetResultPage({
  params,
}: {
  params: Promise<{ matchSetId: string }> | { matchSetId: string }
}) {
  const resolvedParams = await params
  const matchSetId = decodeURIComponent(resolvedParams.matchSetId) as MatchSetId
  const user = await getCurrentCompetitiveUser()
  const result = await competitiveServer.getMatchSetResult(matchSetId, user)

  if (!result) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">MatchSet</p>
              <h1>Not found</h1>
            </div>
            <a href="/account">Account</a>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Competitive Alpha Result</p>
            <h1>{result.preset.label}</h1>
            <p className="workshop-muted">{result.matchSetId}</p>
          </div>
          <div className="app-actions">
            <a href="/exhibitions/new">New exhibition</a>
            <a href="/account">Account</a>
          </div>
        </div>

        <div className="status-strip">
          <span className="workshop-chip valid">{result.status}</span>
          <span>{resultCopy(result.status)}</span>
          <span>{result.scoringPolicy.id}</span>
          <span>{result.visibility}</span>
        </div>

        <div className="app-section-header compact">
          <h2>Standings</h2>
          <span className="workshop-muted">
            {result.standings.length || result.entrants.length} entrants
          </span>
        </div>
        {result.standings.length ? (
          <div className="app-table standings-table" role="table">
            <div className="app-table-row heading" role="row">
              <span>Rank</span>
              <span>Entrant</span>
              <span>Points</span>
              <span>Record</span>
              <span>Tie-breakers</span>
            </div>
            {result.standings.map((standing) => (
              <div
                className="app-table-row"
                role="row"
                key={standing.entrantId}
              >
                <span>{standing.rank}</span>
                <span title={standing.strategyRevisionId}>
                  {standing.displayLabel}
                </span>
                <span>{standing.points}</span>
                <span>
                  {standing.wins}-{standing.losses}-{standing.draws}
                </span>
                <span>
                  Soldiers {standing.survivingSoldiers}, turns{" "}
                  {standing.survivalTurns}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="workshop-muted">
            Matches have not produced scoring evidence yet.
          </p>
        )}

        <div className="app-section-header compact">
          <h2>Entrants</h2>
        </div>
        <div className="entrant-grid">
          {result.entrants.map((entrant) => (
            <article className="entrant-card" key={entrant.entrantId}>
              <strong>{entrant.displayLabel}</strong>
              <span className="workshop-muted">@{entrant.ownerHandle}</span>
              <dl className="details-grid">
                <dt>revision</dt>
                <dd>{entrant.strategyRevisionId}</dd>
                <dt>hash</dt>
                <dd>{entrant.shortHash}</dd>
                <dt>locked</dt>
                <dd>{new Date(entrant.lockedAt).toLocaleString()}</dd>
              </dl>
              {entrant.ownerSourceHref ? (
                <a href={entrant.ownerSourceHref}>Owner source</a>
              ) : null}
            </article>
          ))}
        </div>

        <div className="app-section-header compact">
          <h2>Replay evidence</h2>
          <span className="workshop-muted">
            {result.matches.length} Matches
          </span>
        </div>
        <div className="app-table match-ledger-table" role="table">
          <div className="app-table-row heading" role="row">
            <span>Match</span>
            <span>Bottom</span>
            <span>Top</span>
            <span>Status</span>
            <span>Evidence</span>
          </div>
          {result.matches.map((match) => (
            <div className="app-table-row" role="row" key={match.matchId}>
              <span title={match.matchId}>{match.matchId}</span>
              <span>{match.bottomLabel}</span>
              <span>{match.topLabel}</span>
              <span>{match.status}</span>
              <span>
                {match.replayHref ? (
                  <a href={match.replayHref}>Replay</a>
                ) : (
                  (match.publicReason ?? "Pending")
                )}
              </span>
            </div>
          ))}
        </div>

        <details>
          <summary>Provenance</summary>
          <dl className="details-grid">
            <dt>preset</dt>
            <dd>{result.provenance.presetId}</dd>
            <dt>scoring</dt>
            <dd>{result.provenance.scoringPolicyVersion}</dd>
            <dt>snapshots</dt>
            <dd>{result.provenance.entrantSnapshotIds.join(", ")}</dd>
            <dt>chronicles</dt>
            <dd>
              {result.provenance.chronicleHashes.join(", ") || "none yet"}
            </dd>
            <dt>private fields excluded</dt>
            <dd>{result.publication.privateFieldsExcluded.join(", ")}</dd>
          </dl>
        </details>
      </section>
    </main>
  )
}
