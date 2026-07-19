import {
  BoundaryNotice,
  EmptyStates,
  MatchSetDiscoveryCard,
} from "../../public-discovery-components.js"
import type { JSX } from "react"
import { getPublicCompetitionDetail } from "../../../lib/public-discovery-service.js"
import { COMPETITION_POLICY_V1_36_POSTURE } from "@cowards/spec"

export const dynamic = "force-dynamic"

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ competitionId: string }> | { competitionId: string }
}): Promise<JSX.Element> {
  const { competitionId } = await params
  const detail = await getPublicCompetitionDetail(competitionId)

  if (!detail) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Competition</p>
              <h1>Not found</h1>
            </div>
            <div className="app-actions">
              <a href="/competitions">Competitions</a>
              <a href="/watch">Watch</a>
            </div>
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
            <p className="workshop-muted">{detail.competition.kind}</p>
            <h1>{detail.competition.title}</h1>
            {detail.competition.description ? (
              <p className="workshop-muted">{detail.competition.description}</p>
            ) : null}
          </div>
          <div className="app-actions">
            {detail.competition.enterHref ? (
              <a href={detail.competition.enterHref}>Enter</a>
            ) : null}
            <a href="/competitions">All competitions</a>
            <a href="/watch">Watch</a>
          </div>
        </div>
        <div className="status-strip">
          <span className={`workshop-chip ${detail.competition.status}`}>
            {detail.competition.statusLabel}
          </span>
          <span>{detail.scheduleLabel}</span>
          <span>{detail.replayCoverage.label}</span>
          <span>{COMPETITION_POLICY_V1_36_POSTURE.standingsScope}</span>
          <span>{COMPETITION_POLICY_V1_36_POSTURE.durableRatingPromise}</span>
        </div>
        <BoundaryNotice
          privateFieldsExcluded={detail.boundary.privateFieldsExcluded}
        />
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Replay coverage</h2>
          <span className="workshop-muted">
            {detail.replayCoverage.replayReadyCount} /{" "}
            {detail.replayCoverage.matchCount} Matches
          </span>
        </div>
        {detail.matchSets.length ? (
          <div className="discovery-card-grid">
            {detail.matchSets.map((matchSet) => (
              <MatchSetDiscoveryCard
                matchSet={matchSet}
                key={matchSet.matchSetId}
              />
            ))}
          </div>
        ) : (
          <EmptyStates
            states={[
              "No public MatchSets are published for this competition yet.",
            ]}
          />
        )}
      </section>

      <section className="app-panel">
        <div className="app-section-header compact">
          <h2>Entrants</h2>
          <span className="workshop-muted">{detail.entrants.length}</span>
        </div>
        {detail.entrants.length ? (
          <div className="entrant-grid">
            {detail.entrants.map((entrant) => (
              <article className="entrant-card" key={entrant.entrantId}>
                <strong>{entrant.label}</strong>
                <a href={entrant.playerHref}>@{entrant.ownerHandle}</a>
                <span className="workshop-muted">
                  {entrant.strategyRevisionId}
                </span>
                <span className="workshop-chip">{entrant.statusLabel}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyStates
            states={[
              "Entrants appear after a public ladder/tournament publishes entry snapshots or after a signed-in exhibition creates a MatchSet.",
            ]}
          />
        )}
      </section>

      {detail.standings.length ? (
        <section className="app-panel">
          <div className="app-section-header compact">
            <h2>Standings</h2>
          </div>
          <div className="app-table standings-table" role="table">
            <div className="app-table-row heading" role="row">
              <span>Rank</span>
              <span>Entrant</span>
              <span>Points</span>
              <span>Record</span>
              <span>Evidence</span>
            </div>
            {detail.standings.map((standing) => (
              <div className="app-table-row" role="row" key={standing.label}>
                <span>{standing.rank}</span>
                <span>{standing.label}</span>
                <span>{standing.points}</span>
                <span>{standing.record}</span>
                <span>
                  {standing.competitionEvidence ? (
                    <>
                      {standing.competitionEvidence.countedMatchSetCount}{" "}
                      counted /{" "}
                      {standing.competitionEvidence.excludedMatchSetCount}{" "}
                      excluded · Evidence{" "}
                      {standing.competitionEvidence.evidenceAvailability}
                      {standing.competitionEvidence.resultLinks.map(
                        (href, index) => (
                          <span key={`result-${index}-${href}`}>
                            {" · "}
                            <a href={href}>Result {index + 1}</a>
                          </span>
                        ),
                      )}
                      {standing.competitionEvidence.replayLinks.map(
                        (href, index) => (
                          <span key={`replay-${index}-${href}`}>
                            {" · "}
                            <a href={href}>Replay {index + 1}</a>
                          </span>
                        ),
                      )}
                    </>
                  ) : (
                    "No competition evidence"
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
