"use client"

import { useState } from "react"

interface AuthClientProps {
  mode: "sign-in" | "sign-up"
}

export function AuthClient({ mode }: AuthClientProps) {
  const [username, setUsername] = useState("")
  const [handle, setHandle] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch(
        mode === "sign-in" ? "/api/auth/sign-in" : "/api/auth/sign-up",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            ...(mode === "sign-up" ? { handle, displayName } : {}),
          }),
        },
      )
      const body = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(body.error ?? "Authentication failed.")
        return
      }
      window.location.assign("/account")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-page">
      <section className="app-panel auth-panel">
        <div className="app-section-header">
          <div>
            <p className="workshop-muted">Coward's Game Competitive Alpha</p>
            <h1>{mode === "sign-in" ? "Sign in" : "Create account"}</h1>
          </div>
          <a href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}>
            {mode === "sign-in" ? "Create account" : "Sign in"}
          </a>
        </div>
        <div className="app-form-stack">
          <label>
            <span className="workshop-label">Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          {mode === "sign-up" ? (
            <>
              <label>
                <span className="workshop-label">Public handle</span>
                <input
                  autoComplete="nickname"
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                />
              </label>
              <label>
                <span className="workshop-label">Display name</span>
                <input
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
            </>
          ) : null}
          <label>
            <span className="workshop-label">Password</span>
            <input
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {mode === "sign-up" ? (
            <p className="workshop-muted">
              Alpha accounts have no password reset or recovery flow.
            </p>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
          <button
            className="primary"
            disabled={submitting}
            type="button"
            onClick={() => void submit()}
          >
            {submitting
              ? "Working..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </div>
      </section>
    </main>
  )
}
