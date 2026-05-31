import { Fragment } from "react"
import type { MatchSetId } from "@cowards/spec"
import { getPublicMatchSetResult } from "../../../lib/public-service-boundary.js"
import {
  matchSetEvidenceRows,
  publicPrivacyProvenanceCue,
  statusChipClass,
} from "../evidence-copy.js"
import { buildResultWorkbenchViewModel } from "../result-view-model.js"
import { runtimeExhibitionStatusLabel } from "../../../lib/runtime-labels.js"

export const dynamic = "force-dynamic"

const runtimeLabel = (
  entrant: {
  runtime: {
    language: { id: string }
    adapter: { id: string }
    package: { mode: string }
  }
},
  nonCountedLanguages: ReadonlySet<string>,
): string => {
  const nonCountedByContract = nonCountedLanguages.has(
    entrant.runtime.language.id,
  )
  const language = (() => {
    return runtimeExhibitionStatusLabel({
      languageId: entrant.runtime.language.id,
      languageLabel:
        entrant.runtime.language.id === "python"
          ? "Python"
          : entrant.runtime.language.id === "rust"
            ? "Rust"
            : entrant.runtime.language.id === "zig"
              ? "Zig"
              : "JS/TS",
      countedPlayLabel: nonCountedByContract
        ? "Not counted"
        : "Counted eligible",
    })
  })()
  return `${language} · ${entrant.runtime.adapter.id}`
}

export default async function MatchSetResultPage({
  params,
}: {
  params: Promise<{ matchSetId: string }> | { matchSetId: string }
}) {
  const resolvedParams = await params
  const result = await getPublicMatchSetResult(
    resolvedParams.matchSetId as MatchSetId,
  )

  if (!result) {
    return (
      <main className="app-page">
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">MatchSet</p>
              <h1>Not found</h1>
            </div>
            <div className="app-actions">
              <a href="/watch">Watch</a>
              <a href="/competitions">Competitions</a>
              <a href="/account">Account</a>
            </div>
          </div>
        </section>
      </main>
    )
  }
  const governance =
    result.metadata &&
    typeof result.metadata === "object" &&
    !Array.isArray(result.metadata)
      ? (result.metadata as {
          countedStatus?: string
          publicExplanation?: string
          reviewStatus?: string
        })
      : {}
  const nonCountedLanguages = new Set<string>(
    result.contract.runtimeEvidence.eligibility.nonCountedExhibitionBeta,
  )
  if (governance.countedStatus === "non_counted") {
    for (const entrant of result.entrants) {
      nonCountedLanguages.add(entrant.runtime.language.id)
    }
  }
  const hasNonCountedEntrant = result.entrants.some((entrant) =>
    nonCountedLanguages.has(entrant.runtime.language.id),
  )
  const evidenceStatus =
    governance.countedStatus ??
    (hasNonCountedEntrant ? "non-counted exhibition" : "public exhibition")
  const entrantRuntimeLabels = result.entrants.map((entrant) =>
    runtimeLabel(entrant, nonCountedLanguages),
  )
  const evidenceRows = matchSetEvidenceRows(result, entrantRuntimeLabels)
  const workbench = buildResultWorkbenchViewModel(result, entrantRuntimeLabels)

  return (
    <main className="app-page">
      <section className="app-panel result-workbench">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Result Workbench</p>
            <h1>{result.preset.label}</h1>
            <p className="workshop-muted">{result.matchSetId}</p>
          </div>
          <div className="app-actions">
            <a href="/watch">Watch</a>
            <a href="/competitions">Competitions</a>
            <a href="/competitions/exhibition%3Astandard-exhibition-v1/enter">
              Enter exhibition
            </a>
            <a href="/account">Account</a>
          </div>
        </div>

        <div className="status-strip">
          <span
            className={`workshop-chip ${statusChipClass(result.status)} result-tone-${workbench.statusTone}`}
          >
            {workbench.statusLabel}
          </span>
          <span>{workbench.lifecycleSummary}</span>
          <span>{workbench.availabilitySummary}</span>
          {governance.countedStatus ? (
            <span>{governance.countedStatus}</span>
          ) : null}
          <span>{result.scoringPolicy.id}</span>
          <span>{result.visibility}</span>
        </div>
        {governance.publicExplanation ? (
          <p className="workshop-muted">{governance.publicExplanation}</p>
        ) : null}

        <div
          className="result-workbench-grid"
          aria-label="Result workbench state model"
        >
          {workbench.sections.map((section) => (
            <article className="result-workbench-card" key={section.id}>
              <div className="app-section-header compact">
                <div>
                  <p className="workshop-muted">{section.eyebrow}</p>
                  <h2>{section.title}</h2>
                </div>
              </div>
              <p className="workshop-muted">{section.summary}</p>
              <dl className="result-metric-grid">
                {section.metrics.map((metric) => (
                  <Fragment key={`${section.id}:${metric.label}`}>
                    <dt>{metric.label}</dt>
                    <dd
                      className={
                        metric.tone ? `result-tone-${metric.tone}` : undefined
                      }
                    >
                      {metric.value}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            </article>
          ))}
        </div>

        <section
          className="match-intelligence-panel"
          aria-label="Match intelligence summary"
          data-testid="match-intelligence-panel"
        >
          <div className="app-section-header compact">
            <div>
              <p className="workshop-muted">
                {workbench.intelligence.availability} evidence ·{" "}
                {workbench.intelligence.confidence} confidence
              </p>
              <h2>Match Intelligence</h2>
            </div>
            <span className="workshop-chip">
              {workbench.intelligence.availability}
            </span>
          </div>
          <p>{workbench.intelligence.headline}</p>
          <p className="workshop-muted">{workbench.intelligence.summary}</p>
          <dl className="result-metric-grid">
            {workbench.intelligence.metrics.map((metric) => (
              <Fragment key={`intelligence:${metric.label}`}>
                <dt>{metric.label}</dt>
                <dd
                  className={
                    metric.tone ? `result-tone-${metric.tone}` : undefined
                  }
                >
                  {metric.value}
                </dd>
              </Fragment>
            ))}
          </dl>
          <div className="match-intelligence-comparison">
            {workbench.intelligence.comparisonRows.map((row) => (
              <article
                className="match-intelligence-comparison-row"
                key={row.label}
              >
                <strong>{row.label}</strong>
                <span>{row.record}</span>
                <span>{row.runtime}</span>
                <small>{row.evidence}</small>
              </article>
            ))}
          </div>
          {workbench.intelligence.jumpTargets.length ? (
            <div className="match-intelligence-jump-grid">
              {workbench.intelligence.jumpTargets.map((target) => (
                <a key={target.href} href={target.href}>
                  {target.label}
                </a>
              ))}
            </div>
          ) : (
            <p className="workshop-muted">
              No public replay jump targets are available for this MatchSet.
            </p>
          )}
          <p className="workshop-muted">{workbench.intelligence.provenance}</p>
        </section>

        <section
          className="evidence-panel"
          aria-label="MatchSet evidence"
          data-testid="matchset-evidence-panel"
        >
          <div className="app-section-header compact">
            <h2>Evidence</h2>
            <span className="workshop-chip">{evidenceStatus}</span>
          </div>
          <p className="workshop-muted">{workbench.privacySummary}</p>
          <dl className="details-grid">
            {evidenceRows.map((row) => (
              <Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </Fragment>
            ))}
          </dl>
        </section>

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
            {result.status === "complete"
              ? "This fixture omits standings; inspect the Match ledger for published result evidence."
              : "Matches have not produced scoring evidence yet."}
          </p>
        )}

        <div className="app-section-header compact">
          <h2>Entrants</h2>
        </div>
        <div className="entrant-grid">
          {result.entrants.map((entrant) => (
            <article className="entrant-card" key={entrant.entrantId}>
              <strong>{entrant.displayLabel}</strong>
              <a
                className="workshop-muted"
                href={`/players/${encodeURIComponent(entrant.ownerHandle)}`}
              >
                @{entrant.ownerHandle}
              </a>
              <dl className="details-grid">
                <dt>revision</dt>
                <dd>{entrant.strategyRevisionId}</dd>
                <dt>hash</dt>
                <dd>{entrant.shortHash}</dd>
                <dt>runtime</dt>
                <dd>{runtimeLabel(entrant, nonCountedLanguages)}</dd>
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
            {workbench.matches.length} Matches
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
          {workbench.matches.map((match) => (
            <div className="app-table-row" role="row" key={match.matchId}>
              <span title={match.matchId}>{match.matchId}</span>
              <span>{match.bottomLabel}</span>
              <span>{match.topLabel}</span>
              <span className={`result-tone-${match.tone}`}>
                {match.status}
              </span>
              <span>
                {match.replayHref ? (
                  <a href={match.replayHref}>Replay</a>
                ) : (
                  match.evidence
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
            <dd>{publicPrivacyProvenanceCue}</dd>
          </dl>
        </details>
      </section>
    </main>
  )
}
