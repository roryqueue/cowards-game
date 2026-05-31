import {
  BoundaryNotice,
  CompetitionDiscoveryCard,
  EmptyStates,
} from "../public-discovery-components.js"
import { getPublicCompetitionIndex } from "../../lib/public-discovery-service.js"

export const dynamic = "force-dynamic"

export default async function CompetitionsPage() {
  const index = await getPublicCompetitionIndex()

  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Competitions</p>
            <h1>Tournaments, ladders, and exhibitions</h1>
            <p className="workshop-muted">
              Public competition discovery is separate from execution and only
              links to public-safe result and replay projections.
            </p>
          </div>
          <div className="app-actions">
            <a href="/watch">Watch evidence</a>
            <a href="/workshop">Workshop</a>
          </div>
        </div>
        <BoundaryNotice
          privateFieldsExcluded={index.boundary.privateFieldsExcluded}
        />
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Entry opportunities</h2>
          <span className="workshop-muted">
            {index.entryOpportunities.length}
          </span>
        </div>
        <div className="discovery-card-grid">
          {index.entryOpportunities.map((competition) => (
            <CompetitionDiscoveryCard
              competition={competition}
              key={competition.competitionId}
            />
          ))}
        </div>
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Active public competitions</h2>
          <span className="workshop-muted">
            {index.activeCompetitions.length}
          </span>
        </div>
        <div className="discovery-card-grid">
          {index.activeCompetitions.map((competition) => (
            <CompetitionDiscoveryCard
              competition={competition}
              key={competition.competitionId}
            />
          ))}
        </div>
        <EmptyStates states={index.emptyStates} />
      </section>

      {index.completedCompetitions.length ? (
        <section className="app-panel">
          <div className="app-section-header compact">
            <h2>Completed</h2>
          </div>
          <div className="discovery-card-grid">
            {index.completedCompetitions.map((competition) => (
              <CompetitionDiscoveryCard
                competition={competition}
                key={competition.competitionId}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
