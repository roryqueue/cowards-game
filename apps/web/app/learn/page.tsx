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

      <section className="app-panel" id="supported-languages">
        <div className="app-section-header compact">
          <h2>Supported Strategy languages</h2>
        </div>
        <p>
          TypeScript, Python, Rust, and Zig can enter counted play when their
          Strategy Revisions carry provider-compatible runtime evidence. The web
          app, API, and Go read paths inspect provider metadata; Strategy code
          executes behind runtime-service, Runtime Broker, and language provider
          boundaries.
        </p>
        <p>
          Python is source-backed with no packages or host imports. Rust and Zig
          are artifact-backed through immutable WASM/WASI Preview 1 stdin/stdout
          JSON artifacts. Zig remains no-std/import-audited. Provider proof binds
          source hash, source byte count, and artifact hash/bytes where an
          artifact exists.
        </p>
        <p>
          Runtime failures fail closed rather than falling back to another
          language. Counted support does not claim broad sandbox certification
          for arbitrary programs; public output omits Strategy source,
          StrategyMemory, SoldierMemory, objective payloads, raw diagnostics,
          host paths, environment values, and private runtime internals by
          default.
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
