import type {
  PublicDiscoveryCompetitionCard,
  PublicDiscoveryMatchSetCard,
} from "@cowards/spec"

export function ArenaSignal() {
  return (
    <div className="arena-signal" aria-label="Coward's Game arena preview">
      <div className="arena-signal-board">
        {Array.from({ length: 25 }).map((_, index) => {
          const x = index % 5
          const y = Math.floor(index / 5)
          const stone = (x === 2 && y === 2) || (x === 4 && y === 1)
          const bottom = x === 1 && y === 4
          const top = x === 3 && y === 0
          return (
            <span
              className={`arena-cell ${stone ? "stone" : ""} ${bottom ? "bottom-soldier" : ""} ${top ? "top-soldier" : ""}`}
              key={`${x}:${y}`}
            >
              {stone ? "STONE" : bottom || top ? "Soldier" : ""}
            </span>
          )
        })}
      </div>
      <div className="arena-signal-copy">
        <span>Replay-ready evidence</span>
        <strong>
          Chronicle-backed Matches, public results, no source leaks.
        </strong>
      </div>
    </div>
  )
}

export function BoundaryNotice({
  privateFieldsExcluded: _privateFieldsExcluded,
}: {
  privateFieldsExcluded: readonly string[]
}) {
  return (
    <aside className="boundary-notice" aria-label="Discovery read boundary">
      <strong>public-discovery-v1</strong>
      <span>Separate from match-execution-app-v1.</span>
      <span>
        Excludes private code, private memory, hidden objectives, diagnostics,
        credentials, and runtime internals.
      </span>
    </aside>
  )
}

export function EmptyStates({ states }: { states: readonly string[] }) {
  if (!states.length) {
    return null
  }
  return (
    <div className="empty-state-list">
      {states.map((state) => (
        <p className="workshop-muted" key={state}>
          {state}
        </p>
      ))}
    </div>
  )
}

export function MatchSetDiscoveryCard({
  matchSet,
}: {
  matchSet: PublicDiscoveryMatchSetCard
}) {
  return (
    <article className="discovery-card">
      <div className="discovery-card-header">
        <div>
          <p className="workshop-muted">MatchSet</p>
          <h2>{matchSet.title}</h2>
        </div>
        <span className={`workshop-chip ${matchSet.status}`}>
          {matchSet.statusLabel}
        </span>
      </div>
      <p className="workshop-muted">{matchSet.matchSetId}</p>
      <p>{matchSet.evidenceLabel}</p>
      <div className="discovery-metrics">
        <span>{matchSet.replayReadyCount} replay-ready</span>
        <span>{matchSet.matchCount} Matches</span>
      </div>
      {matchSet.entrantLabels.length ? (
        <p className="workshop-muted">
          {matchSet.entrantLabels.slice(0, 3).join(" vs ")}
        </p>
      ) : null}
      <div className="app-actions">
        <a href={matchSet.resultHref}>Result</a>
        {matchSet.replayHref ? <a href={matchSet.replayHref}>Replay</a> : null}
      </div>
    </article>
  )
}

export function CompetitionDiscoveryCard({
  competition,
}: {
  competition: PublicDiscoveryCompetitionCard
}) {
  return (
    <article className="discovery-card">
      <div className="discovery-card-header">
        <div>
          <p className="workshop-muted">{competition.kind}</p>
          <h2>{competition.title}</h2>
        </div>
        <span className={`workshop-chip ${competition.status}`}>
          {competition.statusLabel}
        </span>
      </div>
      {competition.description ? <p>{competition.description}</p> : null}
      <div className="discovery-metrics">
        {competition.entrantCount !== undefined ? (
          <span>{competition.entrantCount} entrants</span>
        ) : null}
        {competition.matchSetCount !== undefined ? (
          <span>{competition.matchSetCount} MatchSets</span>
        ) : null}
      </div>
      <div className="app-actions">
        <a href={competition.href}>Details</a>
        {competition.enterHref ? (
          <a href={competition.enterHref}>Enter</a>
        ) : null}
      </div>
    </article>
  )
}
