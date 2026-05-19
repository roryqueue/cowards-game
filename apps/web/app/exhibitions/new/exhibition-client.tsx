"use client"

import { useMemo, useState } from "react"
import type {
  CompetitivePresetSummary,
  CompetitiveRevisionSummary,
} from "../../competitive/server.js"

interface ExhibitionClientProps {
  presets: CompetitivePresetSummary[]
  revisions: CompetitiveRevisionSummary[]
}

export function ExhibitionClient({
  presets,
  revisions,
}: ExhibitionClientProps) {
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "")
  const [selectedRevisionIds, setSelectedRevisionIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? presets[0],
    [presetId, presets],
  )
  const validRevisions = revisions.filter((revision) => revision.valid)
  const canSubmit =
    selectedRevisionIds.length >= 2 &&
    selectedRevisionIds.length <= 8 &&
    Boolean(selectedPreset) &&
    !submitting

  const toggleRevision = (revisionId: string) => {
    setSelectedRevisionIds((current) =>
      current.includes(revisionId)
        ? current.filter((candidate) => candidate !== revisionId)
        : [...current, revisionId],
    )
  }

  const submit = async () => {
    if (!canSubmit) {
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const response = await fetch("/api/exhibitions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presetId, revisionIds: selectedRevisionIds }),
      })
      const body = (await response.json()) as {
        matchSetId?: string
        error?: string
      }
      if (!response.ok || !body.matchSetId) {
        setError(body.error ?? "Exhibition could not be created.")
        return
      }
      window.location.assign(
        `/matchsets/${encodeURIComponent(body.matchSetId)}`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="app-panel">
      <div className="app-section-header">
        <div>
          <p className="workshop-muted">Competitive Alpha</p>
          <h1>Create exhibition</h1>
        </div>
        <div className="app-actions">
          <a href="/account">Account</a>
          <a href="/">Workshop</a>
        </div>
      </div>

      <div className="app-form-stack">
        <label>
          <span className="workshop-label">Preset</span>
          <select
            value={presetId}
            onChange={(event) => setPresetId(event.target.value)}
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        {selectedPreset ? (
          <p className="workshop-muted">
            {selectedPreset.description} Select {selectedPreset.minEntrants}-
            {selectedPreset.maxEntrants} owned revisions.
          </p>
        ) : null}

        {validRevisions.length ? (
          <div className="selectable-list">
            {validRevisions.map((revision) => {
              const checked = selectedRevisionIds.includes(revision.id)
              return (
                <label
                  className={`selectable-row ${checked ? "active" : ""}`}
                  key={revision.id}
                >
                  <input
                    checked={checked}
                    type="checkbox"
                    onChange={() => toggleRevision(revision.id)}
                  />
                  <span>
                    <strong>{revision.label ?? "Untitled revision"}</strong>
                    <small>
                      {revision.sourceHash.slice(0, 10)} ·{" "}
                      {revision.sourceBytes} bytes ·{" "}
                      {new Date(revision.createdAt).toLocaleString()}
                    </small>
                  </span>
                </label>
              )
            })}
          </div>
        ) : (
          <p className="workshop-muted">
            Save at least two valid account revisions before creating an
            exhibition.
          </p>
        )}

        <div className="app-actions">
          <button
            className="primary"
            disabled={!canSubmit}
            type="button"
            onClick={() => void submit()}
          >
            {submitting ? "Creating..." : "Create exhibition"}
          </button>
          <span className="workshop-muted">
            {selectedRevisionIds.length} selected
          </span>
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </section>
  )
}
