"use client"

import { useState, type FormEvent } from "react"

export interface LadderEntryRevisionOption {
  strategyRevisionId: string
  label: string
  languageLabel: string
}

export function LadderEntryClient({
  entryHref,
  competitionHref,
  revisions,
}: {
  entryHref: string
  competitionHref: string
  revisions: LadderEntryRevisionOption[]
}) {
  const [revisionId, setRevisionId] = useState(
    revisions[0]?.strategyRevisionId ?? "",
  )
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "accepted" }
    | { kind: "rejected"; message: string; remediation?: string }
  >({ kind: "idle" })

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!revisionId || status.kind === "submitting") return
    setStatus({ kind: "submitting" })
    try {
      const response = await fetch(entryHref, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revisionId }),
      })
      const body = (await response.json()) as {
        entryId?: string
        error?: string
        eligibility?: { publicMessage: string; remediation: string }
      }
      if (response.ok && body.entryId) {
        setStatus({ kind: "accepted" })
        return
      }
      setStatus({
        kind: "rejected",
        message:
          body.eligibility?.publicMessage ??
          body.error ??
          "Counted entry is unavailable right now.",
        ...(body.eligibility?.remediation
          ? { remediation: body.eligibility.remediation }
          : {}),
      })
    } catch {
      setStatus({
        kind: "rejected",
        message: "Counted entry is unavailable right now.",
        remediation: "Try again after competition services are available.",
      })
    }
  }

  if (!revisions.length) {
    return (
      <p className="workshop-muted">
        No saved Strategy Revision currently meets counted entry policy.
      </p>
    )
  }

  return (
    <form className="app-subsection" onSubmit={submit}>
      <label htmlFor="counted-entry-revision">Strategy Revision</label>
      <select
        id="counted-entry-revision"
        value={revisionId}
        onChange={(event) => setRevisionId(event.currentTarget.value)}
        disabled={status.kind === "submitting"}
      >
        {revisions.map((revision) => (
          <option
            key={revision.strategyRevisionId}
            value={revision.strategyRevisionId}
          >
            {revision.label} - {revision.languageLabel}
          </option>
        ))}
      </select>
      <button type="submit" disabled={status.kind === "submitting"}>
        {status.kind === "submitting" ? "Entering..." : "Enter counted Season"}
      </button>
      {status.kind === "accepted" ? (
        <p>
          Entry accepted. <a href={competitionHref}>View Season</a>
        </p>
      ) : null}
      {status.kind === "rejected" ? (
        <div role="status">
          <p>{status.message}</p>
          {status.remediation ? (
            <p className="workshop-muted">{status.remediation}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
