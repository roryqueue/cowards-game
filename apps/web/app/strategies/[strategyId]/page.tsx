import type { PublicStrategyCardDto, StrategyId } from "@cowards/spec"
import { describeStrategyRuntimeProductSemantics } from "@cowards/spec"
import {
  getPublicStrategyCard,
  isPublicStrategyReadUnavailable,
} from "../../../lib/public-service-boundary.js"

export const dynamic = "force-dynamic"

const runtimeDisplayLabel = (runtimeSemantics: {
  languageId: string
  languageLabel: string
  adapterLabel: string
}) =>
  runtimeSemantics.languageId === "python"
    ? `${runtimeSemantics.languageLabel} / ${runtimeSemantics.adapterLabel} / non-counted exhibition beta`
    : `${runtimeSemantics.languageLabel} / ${runtimeSemantics.adapterLabel}`

export default async function StrategyCardPage({
  params,
}: {
  params: Promise<{ strategyId: string }> | { strategyId: string }
}) {
  const { strategyId } = await params
  let strategy: PublicStrategyCardDto | null
  try {
    strategy = await getPublicStrategyCard(strategyId as StrategyId)
  } catch (error) {
    if (!isPublicStrategyReadUnavailable(error)) {
      throw error
    }
    return (
      <main className="app-page">
        <section className="app-panel">
          <h1>Strategy temporarily unavailable</h1>
          <p className="workshop-muted">Try again shortly.</p>
        </section>
      </main>
    )
  }
  if (!strategy) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <h1>Strategy not found</h1>
        </section>
      </main>
    )
  }
  const runtimeSemantics = describeStrategyRuntimeProductSemantics(
    strategy.runtime,
  )
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
          <div className="workshop-chip-row">
            <span className="workshop-chip">{strategy.validationStatus}</span>
            <span className="workshop-chip">
              {runtimeSemantics.readinessLabel}
            </span>
            <span className="workshop-chip">
              {runtimeSemantics.countedPlayLabel}
            </span>
          </div>
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
            {runtimeDisplayLabel(runtimeSemantics)}{" "}
            {strategy.runtime.adapter.version}
          </dd>
          <dt>packages</dt>
          <dd>{runtimeSemantics.packagePolicyLabel}</dd>
          {runtimeSemantics.countedPlayReason ? (
            <>
              <dt>eligibility</dt>
              <dd>{runtimeSemantics.countedPlayReason}</dd>
            </>
          ) : null}
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
