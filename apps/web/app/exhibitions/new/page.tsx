import { COMPETITION_PRESETS } from "@cowards/spec"
import {
  getCurrentAccountReadUser,
  listAccountReadRevisions,
} from "../../../lib/account-service-boundary.js"
import { ExhibitionClient } from "./exhibition-client.js"

export const dynamic = "force-dynamic"

export default async function NewExhibitionPage() {
  const user = await getCurrentAccountReadUser()
  const revisions = user ? await listAccountReadRevisions() : []
  const presets = COMPETITION_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description:
      preset.id === "smoke-exhibition-v1"
        ? "Fast mirrored pairwise exhibition for quick checks."
        : "Broader mirrored pairwise exhibition for stronger evidence.",
    minEntrants: preset.entrantCount.min,
    maxEntrants: preset.entrantCount.max,
  }))

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
