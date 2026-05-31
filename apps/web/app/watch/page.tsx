import {
  BoundaryNotice,
  EmptyStates,
  MatchSetDiscoveryCard,
} from "../public-discovery-components.js"
import { getPublicWatchIndex } from "../../lib/public-discovery-service.js"

export const dynamic = "force-dynamic"

export default async function WatchPage() {
  const watch = await getPublicWatchIndex()

  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Watch</p>
            <h1>Public MatchSet evidence</h1>
            <p className="workshop-muted">
              Replay-ready Matches first, followed by active and degraded public
              states.
            </p>
          </div>
          <div className="app-actions">
            <a href="/competitions">Competitions</a>
            <a href="/learn#trust">Trust model</a>
          </div>
        </div>
        <BoundaryNotice
          privateFieldsExcluded={watch.boundary.privateFieldsExcluded}
        />
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Replay-ready</h2>
          <span className="workshop-muted">{watch.replayReady.length}</span>
        </div>
        <div className="discovery-card-grid">
          {watch.replayReady.map((matchSet) => (
            <MatchSetDiscoveryCard
              matchSet={matchSet}
              key={matchSet.matchSetId}
            />
          ))}
        </div>
        <EmptyStates states={watch.emptyStates} />
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Running and queued</h2>
          <span className="workshop-muted">{watch.active.length}</span>
        </div>
        <div className="discovery-card-grid">
          {watch.active.map((matchSet) => (
            <MatchSetDiscoveryCard
              matchSet={matchSet}
              key={matchSet.matchSetId}
            />
          ))}
        </div>
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Degraded evidence</h2>
          <span className="workshop-muted">{watch.degraded.length}</span>
        </div>
        <div className="discovery-card-grid">
          {watch.degraded.map((matchSet) => (
            <MatchSetDiscoveryCard
              matchSet={matchSet}
              key={matchSet.matchSetId}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
