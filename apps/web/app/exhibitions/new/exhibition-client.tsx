"use client"

import { useMemo, useState } from "react"
import type { AccountReadRevisionSummary } from "../../../lib/account-service-boundary.js"

interface ExhibitionPresetSummary {
  id: string
  label: string
  description: string
  minEntrants: number
  maxEntrants: number
}

interface ExhibitionClientProps {
  presets: ExhibitionPresetSummary[]
  revisions: AccountReadRevisionSummary[]
}

const runtimeDisplayLabel = (revision: AccountReadRevisionSummary) =>
  revision.runtimeSemantics.languageId === "python"
    ? `${revision.runtimeSemantics.languageLabel} · non-counted exhibition beta`
    : revision.runtimeSemantics.languageId === "rust"
      ? `${revision.runtimeSemantics.languageLabel} · non-counted exhibition alpha`
      : revision.runtimeSemantics.languageId === "zig"
        ? `${revision.runtimeSemantics.languageLabel} · gated stretch`
        : `${revision.runtimeSemantics.languageLabel} · ${revision.runtimeSemantics.countedPlayLabel}`

export function ExhibitionClient({
  presets,
  revisions,
}: ExhibitionClientProps) {
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "")
  const [selectedRevisionIds, setSelectedRevisionIds] = useState<string[]>([])
  const [counted, setCounted] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? presets[0],
    [presetId, presets],
  )
  const validRevisions = revisions.filter((revision) => revision.valid)
  const selectableRevisionIds = new Set(
    validRevisions
      .filter((revision) =>
        counted ? revision.runtimeSemantics.countedPlayEligible : true,
      )
      .map((revision) => revision.id),
  )
  const canSubmit =
    selectedRevisionIds.length >= 2 &&
    selectedRevisionIds.length <= 8 &&
    selectedRevisionIds.every((revisionId) =>
      selectableRevisionIds.has(revisionId),
    ) &&
    Boolean(selectedPreset) &&
    !submitting

  const toggleRevision = (revisionId: string) => {
    if (!selectableRevisionIds.has(revisionId)) {
      return
    }
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
        body: JSON.stringify({
          presetId,
          revisionIds: selectedRevisionIds,
          counted,
        }),
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

        <div className="segmented-control" aria-label="Exhibition counting">
          <button
            className={counted ? "active" : ""}
            type="button"
            onClick={() => {
              setCounted(true)
              setSelectedRevisionIds((current) =>
                current.filter((revisionId) =>
                  validRevisions
                    .filter(
                      (revision) =>
                        revision.runtimeSemantics.countedPlayEligible,
                    )
                    .some((revision) => revision.id === revisionId),
                ),
              )
            }}
          >
            Counted
          </button>
          <button
            className={!counted ? "active" : ""}
            type="button"
            onClick={() => setCounted(false)}
          >
            Unranked
          </button>
        </div>
        {!counted ? (
          <p className="workshop-muted">
            Unranked exhibitions may include Python beta or Rust alpha revisions
            and are marked non-counted.
          </p>
        ) : null}

        {validRevisions.length ? (
          <div className="selectable-list">
            {validRevisions.map((revision) => {
              const checked = selectedRevisionIds.includes(revision.id)
              const selectable = selectableRevisionIds.has(revision.id)
              return (
                <label
                  className={`selectable-row ${checked ? "active" : ""}`}
                  key={revision.id}
                >
                  <input
                    checked={checked}
                    disabled={!selectable}
                    type="checkbox"
                    onChange={() => toggleRevision(revision.id)}
                  />
                  <span>
                    <strong>{revision.label ?? "Untitled revision"}</strong>
                    <small>
                      {revision.sourceHash.slice(0, 10)} ·{" "}
                      {revision.sourceBytes} bytes ·{" "}
                      {runtimeDisplayLabel(revision)} ·{" "}
                      {new Date(revision.createdAt).toLocaleString()}
                    </small>
                    {!selectable &&
                    revision.runtimeSemantics.countedPlayReason ? (
                      <small>
                        {revision.runtimeSemantics.countedPlayReason}
                      </small>
                    ) : null}
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
