import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../competitive/server.js"

export const dynamic = "force-dynamic"

export default async function TrialLadderSeasonPage({
  params,
}: {
  params: Promise<{ seasonId: string }> | { seasonId: string }
}) {
  const resolvedParams = await params
  const seasonId = decodeURIComponent(resolvedParams.seasonId)
  const [season, user] = await Promise.all([
    competitiveServer.getTrialLadderSeason(seasonId),
    getCurrentCompetitiveUser(),
  ])

  if (!season) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Trial ladder</p>
              <h1>Season not found</h1>
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
            <p className="workshop-muted">Competition Trust Beta</p>
            <h1>{season.name}</h1>
            <p className="workshop-muted">{season.seasonId}</p>
          </div>
          <div className="app-actions">
            <a href="/account">Account</a>
            <a href="/">Workshop</a>
          </div>
        </div>

        <div className="status-strip">
          <span className="workshop-chip valid">{season.statusLabel}</span>
          <span>Resettable trial standings</span>
          <span>No permanent ratings</span>
          <span>
            {season.entries.length}/{season.policy.minimumEntries} entries
          </span>
        </div>

        <section className="app-subsection">
          <h2>Rules</h2>
          <dl className="details-grid">
            <dt>Eligibility</dt>
            <dd>One active owned Strategy Revision per user per season</dd>
            <dt>Replacement</dt>
            <dd>{season.policy.replacementPolicy}</dd>
            <dt>Stale revisions</dt>
            <dd>{season.policy.staleRevisionPolicy}</dd>
            <dt>Scheduling</dt>
            <dd>{season.policy.targetPodSize}-entry deterministic pods</dd>
          </dl>
        </section>

        {user && season.status === "open" ? (
          <p className="workshop-muted">
            Enter from your account page by choosing a valid account-owned
            Strategy Revision.
          </p>
        ) : null}

        <div className="app-section-header compact">
          <h2>Standings</h2>
          <span className="workshop-muted">
            {season.standings.length} ranked entries
          </span>
        </div>
        {season.standings.length ? (
          <div className="app-table standings-table" role="table">
            <div className="app-table-row heading" role="row">
              <span>Rank</span>
              <span>Entry</span>
              <span>Points</span>
              <span>Record</span>
              <span>Tie-breakers</span>
            </div>
            {season.standings.map((standing) => (
              <div
                className="app-table-row"
                role="row"
                key={standing.entrantId}
              >
                <span>{standing.rank}</span>
                <span>{standing.displayLabel}</span>
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
            Standings appear after counted MatchSets have complete replay
            evidence.
          </p>
        )}

        <div className="app-section-header compact">
          <h2>Entries</h2>
        </div>
        <div className="entrant-grid">
          {season.entries.map((entry) => (
            <article className="entrant-card" key={entry.entryId}>
              <strong>{entry.strategyName}</strong>
              <a href={`/players/${encodeURIComponent(entry.ownerHandle)}`}>
                @{entry.ownerHandle}
              </a>
              <span className="workshop-chip">{entry.status}</span>
              <dl className="details-grid">
                <dt>hash</dt>
                <dd>{entry.sourceHash.slice(0, 12)}</dd>
                <dt>revision</dt>
                <dd>{entry.strategyRevisionId}</dd>
              </dl>
            </article>
          ))}
        </div>

        <div className="app-section-header compact">
          <h2>MatchSets</h2>
        </div>
        <div className="app-table match-ledger-table" role="table">
          <div className="app-table-row heading" role="row">
            <span>MatchSet</span>
            <span>Status</span>
            <span>Counted</span>
            <span>Evidence</span>
          </div>
          {season.matchSets.map((matchSet) => (
            <div className="app-table-row" role="row" key={matchSet.matchSetId}>
              <span>{matchSet.matchSetId}</span>
              <span>{matchSet.status}</span>
              <span>{matchSet.publicExplanation}</span>
              <a href={matchSet.resultHref}>Result</a>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
