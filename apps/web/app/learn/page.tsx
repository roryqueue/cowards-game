export const dynamic = "force-dynamic"

export default function LearnPage() {
  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Learn</p>
            <h1>Rules, terms, and trust</h1>
          </div>
          <div className="app-actions">
            <a href="/watch">Watch</a>
            <a href="/competitions">Competitions</a>
            <a href="/workshop">Workshop</a>
          </div>
        </div>
      </section>

      <section className="app-panel" id="rules">
        <div className="app-section-header compact">
          <h2>Rules and terms</h2>
        </div>
        <p>
          A Match is a deterministic contest between Strategy Revisions.
          Soldiers act through Phase, Round, Activation, Cycle, Action, and
          Advance timing on a shrinking board. STONE blocks movement and FALLEN
          Soldiers are removed from active play.
        </p>
      </section>

      <section className="app-panel" id="trust">
        <div className="app-section-header compact">
          <h2>Replay and result trust</h2>
        </div>
        <p>
          Public results link to MatchSet summaries and replay-ready Chronicle
          projections when available. Public discovery does not expose private
          code, private memory, hidden objectives, diagnostics, credentials, or
          runtime internals.
        </p>
      </section>

      <section className="app-panel" id="competitions">
        <div className="app-section-header compact">
          <h2>Competition formats</h2>
        </div>
        <p>
          Exhibitions are the current signed-in entry path. Trial ladders and
          tournament-style pages appear through public-safe discovery reads when
          configured public projections exist. JS/TS, Python, Rust, and Zig are
          counted Strategy paths through provider validation.
        </p>
      </section>
    </main>
  )
}
