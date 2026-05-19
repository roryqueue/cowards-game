import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../competitive/server.js"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const user = await getCurrentCompetitiveUser()
  const revisions = user
    ? await competitiveServer.listAccountRevisions(user)
    : []

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
            {revisions.length ? (
              <div className="app-table" role="table">
                <div className="app-table-row heading" role="row">
                  <span>Revision</span>
                  <span>Hash</span>
                  <span>Status</span>
                  <span>Source</span>
                </div>
                {revisions.map((revision) => (
                  <div className="app-table-row" role="row" key={revision.id}>
                    <span title={revision.id}>{revision.label}</span>
                    <span>{revision.sourceHash.slice(0, 10)}</span>
                    <span>{revision.valid ? "valid" : "invalid"}</span>
                    <a
                      href={`/api/account/revisions/${encodeURIComponent(
                        revision.id,
                      )}/source`}
                    >
                      Owner source
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
          <p>
            Anonymous Workshop drafting still works. Competitive revision saves
            and exhibition entry require a session-backed account.
          </p>
        )}
      </section>
    </main>
  )
}
