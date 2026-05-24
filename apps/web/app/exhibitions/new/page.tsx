import { COMPETITION_PRESETS } from "@cowards/spec"
import {
  getCurrentAccountReadUser,
  listAccountReadRevisions,
} from "../../../lib/account-service-boundary.js"
import { CompetitiveInputError } from "../../../lib/competitive-errors.js"
import { isGoBackendServiceUnavailableError } from "../../../lib/go-backend-service-client.js"
import { ExhibitionClient } from "./exhibition-client.js"

export const dynamic = "force-dynamic"

export default async function NewExhibitionPage() {
  let accountUnavailable = false
  let revisionsUnavailable = false
  let user: Awaited<ReturnType<typeof getCurrentAccountReadUser>> = null
  let revisions: Awaited<ReturnType<typeof listAccountReadRevisions>> = []
  try {
    user = await getCurrentAccountReadUser()
  } catch (error) {
    if (
      isGoBackendServiceUnavailableError(error) ||
      (error instanceof CompetitiveInputError && error.status === 401)
    ) {
      accountUnavailable = isGoBackendServiceUnavailableError(error)
    } else {
      throw error
    }
  }
  if (user) {
    try {
      revisions = await listAccountReadRevisions()
    } catch (error) {
      if (isGoBackendServiceUnavailableError(error)) {
        revisionsUnavailable = true
      } else {
        throw error
      }
    }
  }
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
        revisionsUnavailable ? (
          <section className="app-panel">
            <div className="app-section-header">
              <div>
                <p className="workshop-muted">Competitive Alpha</p>
                <h1>Account revisions unavailable</h1>
              </div>
              <div className="app-actions">
                <a href="/account">Account</a>
                <a href="/">Workshop</a>
              </div>
            </div>
            <p className="workshop-muted">
              Go-backed account revision reads failed closed without TypeScript
              backend fallback.
            </p>
          </section>
        ) : (
          <ExhibitionClient presets={presets} revisions={revisions} />
        )
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
          {accountUnavailable ? (
            <p className="workshop-muted">
              Account services are temporarily unavailable. Exhibition entry
              failed closed without TypeScript backend fallback.
            </p>
          ) : null}
          <p>
            Exhibition entry requires a session-backed account so Strategy
            Revision ownership can be checked before the MatchSet is created.
          </p>
        </section>
      )}
    </main>
  )
}
