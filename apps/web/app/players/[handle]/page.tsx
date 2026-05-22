import { getPublicPlayerProfile } from "../../../lib/public-service-boundary.js"

export const dynamic = "force-dynamic"

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }> | { handle: string }
}) {
  const { handle } = await params
  const profile = await getPublicPlayerProfile(decodeURIComponent(handle))
  if (!profile) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <h1>Player not found</h1>
        </section>
      </main>
    )
  }
  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Player profile</p>
            <h1>@{profile.handle}</h1>
            <p>{profile.displayName}</p>
          </div>
          <a href="/account">Account</a>
        </div>
        <div className="app-section-header compact">
          <h2>Strategies</h2>
        </div>
        <div className="entrant-grid">
          {profile.strategies.map((strategy) => (
            <article className="entrant-card" key={strategy.strategyId}>
              <strong>{strategy.name}</strong>
              {strategy.description ? (
                <span className="workshop-muted">{strategy.description}</span>
              ) : null}
              <span>{strategy.validationStatus}</span>
              {strategy.starterLineage ? (
                <span className="workshop-muted">
                  Forked from {strategy.starterLineage.starterName}{" "}
                  {strategy.starterLineage.starterVersion}
                </span>
              ) : null}
              {strategy.advancedLineage ? (
                <span className="workshop-muted">
                  Advanced seed: {strategy.advancedLineage.archetype}
                </span>
              ) : null}
              <a
                href={`/strategies/${encodeURIComponent(strategy.strategyId)}`}
              >
                Strategy card
              </a>
            </article>
          ))}
        </div>
        <div className="app-section-header compact">
          <h2>Ladder history</h2>
        </div>
        <div className="app-table" role="table">
          {profile.ladderHistory.map((entry) => (
            <div className="app-table-row" role="row" key={entry.seasonId}>
              <span>{entry.seasonName}</span>
              <span>{entry.entryStatus}</span>
              <a href={`/ladder/${encodeURIComponent(entry.seasonId)}`}>
                Season
              </a>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
