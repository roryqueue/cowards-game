import {
  ArenaSignal,
  BoundaryNotice,
  CompetitionDiscoveryCard,
  EmptyStates,
  MatchSetDiscoveryCard,
} from "./public-discovery-components.js"
import { getPublicHomeDiscovery } from "../lib/public-discovery-service.js"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const discovery = await getPublicHomeDiscovery()

  return (
    <main className="app-page public-home-page">
      <section className="app-panel public-home-hero">
        <div className="public-hero-copy">
          <p className="workshop-muted">Public competitive site</p>
          <h1>Coward&apos;s Game</h1>
          <p>
            Discover public MatchSets, replay-ready Chronicle evidence,
            competitions, players, and Strategy cards without entering the
            Workshop first.
          </p>
          <div className="app-actions">
            <a href="/watch">Watch latest</a>
            <a href="/competitions">Enter competition</a>
            <a href="/workshop">Open Workshop</a>
          </div>
        </div>
        <ArenaSignal />
      </section>

      <section className="public-discovery-layout">
        <div className="public-discovery-main">
          <section className="app-panel">
            <div className="app-section-header">
              <div>
                <p className="workshop-muted">Competition spine</p>
                <h2>Active opportunities</h2>
              </div>
              <a href="/competitions">All competitions</a>
            </div>
            <div className="discovery-card-grid">
              {discovery.competitions.map((competition) => (
                <CompetitionDiscoveryCard
                  competition={competition}
                  key={competition.competitionId}
                />
              ))}
            </div>
          </section>

          <section className="app-panel">
            <div className="app-section-header">
              <div>
                <p className="workshop-muted">Watch</p>
                <h2>Recent public evidence</h2>
              </div>
              <a href="/watch">Watch hub</a>
            </div>
            {discovery.latestEvidence.length ? (
              <div className="discovery-card-grid">
                {discovery.latestEvidence.map((matchSet) => (
                  <MatchSetDiscoveryCard
                    matchSet={matchSet}
                    key={matchSet.matchSetId}
                  />
                ))}
              </div>
            ) : null}
            <EmptyStates states={discovery.emptyStates} />
          </section>
        </div>

        <aside className="public-discovery-side">
          <BoundaryNotice
            privateFieldsExcluded={discovery.boundary.privateFieldsExcluded}
          />
          <section className="app-panel">
            <div className="app-section-header compact">
              <h2>Learn</h2>
            </div>
            <div className="public-link-list">
              {discovery.learnLinks.map((link) => (
                <a href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}
