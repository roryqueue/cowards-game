import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../competitive/server.js"
import { ExhibitionClient } from "./exhibition-client.js"

export const dynamic = "force-dynamic"

export default async function NewExhibitionPage() {
  const user = await getCurrentCompetitiveUser()
  const revisions = user
    ? await competitiveServer.listAccountRevisions(user)
    : []
  const presets = competitiveServer.listPresets()

  return (
    <main className="app-page">
      {user ? (
        <ExhibitionClient presets={presets} revisions={revisions} />
      ) : (
        <section className="app-panel">
          <div className="app-section-header">
            <div>
              <p className="workshop-muted">Competitive Alpha</p>
              <h1>Sign in required</h1>
            </div>
            <div className="app-actions">
              <a href="/auth/sign-in">Sign in</a>
              <a href="/auth/sign-up">Create account</a>
            </div>
          </div>
          <p>
            Exhibition entry requires a session-backed account so Strategy
            Revision ownership can be checked before the MatchSet is created.
          </p>
        </section>
      )}
    </main>
  )
}
