import { competitiveServer } from "../../competitive/server.js"

export const dynamic = "force-dynamic"

export default async function StrategyCardPage({
  params,
}: {
  params: Promise<{ strategyId: string }> | { strategyId: string }
}) {
  const { strategyId } = await params
  const strategy = await competitiveServer.getPublicStrategyCard(
    decodeURIComponent(strategyId),
  )
  if (!strategy) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <h1>Strategy not found</h1>
        </section>
      </main>
    )
  }
  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Public Strategy card</p>
            <h1>{strategy.name}</h1>
            <a href={`/players/${encodeURIComponent(strategy.authorHandle)}`}>
              @{strategy.authorHandle}
            </a>
          </div>
          <span className="workshop-chip">{strategy.validationStatus}</span>
        </div>
        {strategy.description ? <p>{strategy.description}</p> : null}
        <div className="workshop-chip-row">
          {strategy.tags.map((tag) => (
            <span className="workshop-chip" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <dl className="details-grid">
          <dt>revision</dt>
          <dd>{strategy.strategyRevisionId}</dd>
          <dt>hash</dt>
          <dd>{strategy.sourceHash}</dd>
          <dt>runtime</dt>
          <dd>
            {strategy.runtime.name} {strategy.runtime.version}
          </dd>
          <dt>record</dt>
          <dd>
            {strategy.record.wins}-{strategy.record.losses}-
            {strategy.record.draws}, {strategy.record.points} points
          </dd>
          {strategy.starterLineage ? (
            <>
              <dt>lineage</dt>
              <dd>
                Forked from {strategy.starterLineage.starterName}{" "}
                {strategy.starterLineage.starterVersion}
              </dd>
            </>
          ) : null}
          {strategy.advancedLineage ? (
            <>
              <dt>tier</dt>
              <dd>Advanced seed</dd>
              <dt>archetype</dt>
              <dd>{strategy.advancedLineage.archetype}</dd>
              <dt>lineage</dt>
              <dd>
                Forked from {strategy.advancedLineage.advancedName}{" "}
                {strategy.advancedLineage.advancedVersion}
              </dd>
            </>
          ) : null}
        </dl>
        {strategy.resultLinks.length || strategy.replayLinks.length ? (
          <div className="workshop-stack">
            <h2 className="workshop-heading">Evidence links</h2>
            <div className="workshop-chip-row">
              {strategy.resultLinks.slice(0, 4).map((href) => (
                <a className="workshop-replay-link" href={href} key={href}>
                  MatchSet result
                </a>
              ))}
              {strategy.replayLinks.slice(0, 4).map((href) => (
                <a className="workshop-replay-link" href={href} key={href}>
                  Replay
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
