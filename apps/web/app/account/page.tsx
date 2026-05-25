import {
  getCurrentAccountReadUser,
  listAccountReadRevisions,
} from "../../lib/account-service-boundary.js"
import { CompetitiveInputError } from "../../lib/competitive-errors.js"
import { isGoBackendServiceUnavailableError } from "../../lib/go-backend-service-client.js"

export const dynamic = "force-dynamic"

const runtimeDisplayLabel = (revision: {
  runtimeSemantics: {
    languageId: string
    languageLabel: string
    countedPlayLabel: string
  }
}) =>
  revision.runtimeSemantics.languageId === "python"
    ? `${revision.runtimeSemantics.languageLabel} · non-counted exhibition beta`
    : revision.runtimeSemantics.languageId === "rust"
      ? `${revision.runtimeSemantics.languageLabel} · non-counted exhibition alpha`
      : revision.runtimeSemantics.languageId === "zig"
        ? `${revision.runtimeSemantics.languageLabel} · gated stretch`
        : `${revision.runtimeSemantics.languageLabel} · ${revision.runtimeSemantics.countedPlayLabel}`

export default async function AccountPage() {
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

  return (
    <main className="app-page">
      <section className="app-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Competitive account</p>
            <h1>{user ? `@${user.handle}` : "Sign in required"}</h1>
          </div>
          <div className="app-actions">
            <a href="/">Workshop</a>
            {user ? (
              <a href={`/players/${user.handle}`}>Public profile</a>
            ) : null}
            {user ? (
              <form action="/api/auth/sign-out" method="post">
                <button type="submit">Sign out</button>
              </form>
            ) : (
              <a href="/auth/sign-in">Sign in</a>
            )}
          </div>
        </div>
        {user ? (
          <>
            <dl className="details-grid">
              <dt>User id</dt>
              <dd>{user.id}</dd>
              <dt>Display name</dt>
              <dd>{user.displayName}</dd>
              <dt>Username</dt>
              <dd>{user.username}</dd>
            </dl>
            <div className="app-section-header compact">
              <h2>Account revisions</h2>
              <a href="/exhibitions/new">Create exhibition</a>
            </div>
            {revisionsUnavailable ? (
              <p className="workshop-muted">
                Account revisions are temporarily unavailable. Go-backed
                revision reads failed closed without TypeScript backend
                fallback.
              </p>
            ) : revisions.length ? (
              <div className="app-table" role="table">
                <div className="app-table-row heading" role="row">
                  <span>Revision</span>
                  <span>Hash</span>
                  <span>Status</span>
                  <span>Runtime</span>
                  <span>Source</span>
                </div>
                {revisions.map((revision) => (
                  <div className="app-table-row" role="row" key={revision.id}>
                    <span title={revision.id}>{revision.label}</span>
                    <span>{revision.sourceHash.slice(0, 10)}</span>
                    <span>{revision.valid ? "valid" : "invalid"}</span>
                    <span>{runtimeDisplayLabel(revision)}</span>
                    <a
                      href={`/api/account/revisions/${encodeURIComponent(
                        revision.id,
                      )}/source`}
                    >
                      Owner source
                    </a>
                    <a
                      href={`/strategies/${encodeURIComponent(revision.strategyId)}`}
                    >
                      Public card
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="workshop-muted">
                Save a valid draft from the Workshop to make it eligible for
                exhibition entry.
              </p>
            )}
          </>
        ) : (
          <>
            {accountUnavailable ? (
              <p className="workshop-muted">
                Account services are temporarily unavailable. Go-backed account
                reads failed closed without TypeScript backend fallback.
              </p>
            ) : null}
            <p>
              Anonymous Workshop drafting still works. Competitive revision
              saves and exhibition entry require a session-backed account.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
