import { COMPETITION_FAIR_PLAY_POLICY } from "@cowards/spec"

export default function FairPlayPage() {
  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Public beta competition</p>
            <h1>{COMPETITION_FAIR_PLAY_POLICY.title}</h1>
          </div>
          <a href="/competitions">Competitions</a>
        </div>
        <div className="app-form-stack">
          <p>{COMPETITION_FAIR_PLAY_POLICY.currentBehavior}</p>
          <p>{COMPETITION_FAIR_PLAY_POLICY.evidenceLimit}</p>
          <p className="workshop-muted">
            {COMPETITION_FAIR_PLAY_POLICY.limitation}
          </p>
        </div>
      </section>
    </main>
  )
}
