import { COMPETITION_ACCOUNT_RECOVERY_POLICY } from "@cowards/spec"
import type { JSX } from "react"

export default function AccountRecoveryPage(): JSX.Element {
  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Account ownership</p>
            <h1>{COMPETITION_ACCOUNT_RECOVERY_POLICY.title}</h1>
          </div>
          <a href="/account">Account</a>
        </div>
        <div className="app-form-stack">
          <p>{COMPETITION_ACCOUNT_RECOVERY_POLICY.currentBehavior}</p>
          <p>{COMPETITION_ACCOUNT_RECOVERY_POLICY.limitation}</p>
          <p className="workshop-muted">
            {COMPETITION_ACCOUNT_RECOVERY_POLICY.ratings}
          </p>
        </div>
      </section>
    </main>
  )
}
