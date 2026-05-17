"use client"

import { useEffect, useMemo, useState } from "react"
import type { StrategyRevisionValidationReport } from "@cowards/spec"
import { StrategySourceEditor } from "./monaco-editor.js"
import type { WorkshopSnapshot, WorkshopTemplateSummary } from "./types.js"
import {
  formatValidationIssueHeading,
  getDraftStatusClass,
  getDraftStatusLabel,
  validationStateFromReport,
} from "./workshop-client-state.js"

export interface WorkshopClientProps {
  initialData: WorkshopSnapshot
}

const replaceDraftCopy =
  "Replace draft: this will overwrite the current unsaved source with the selected template."

export function WorkshopClient({ initialData }: WorkshopClientProps) {
  const firstTemplate = initialData.templates[0]
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    firstTemplate?.id ?? "",
  )
  const [source, setSource] = useState(
    firstTemplate?.source ?? initialData.templateSource,
  )
  const [isDirty, setIsDirty] = useState(false)
  const [validation, setValidation] =
    useState<StrategyRevisionValidationReport | null>(
      firstTemplate?.validation ?? initialData.templateValidation,
    )
  const [checking, setChecking] = useState(false)
  const [label, setLabel] = useState("Workshop revision")
  const [notes, setNotes] = useState("")

  const selectedTemplate = useMemo(
    () =>
      initialData.templates.find(
        (template) => template.id === selectedTemplateId,
      ) ?? firstTemplate,
    [firstTemplate, initialData.templates, selectedTemplateId],
  )

  const draftState = validationStateFromReport(validation, checking)

  const validateSource = async (nextSource = source) => {
    setChecking(true)
    try {
      const response = await fetch("/api/workshop/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: nextSource }),
      })
      const body = (await response.json()) as {
        validation: StrategyRevisionValidationReport
      }
      setValidation(body.validation)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!isDirty) {
      return
    }
    const timeout = window.setTimeout(() => {
      void validateSource(source)
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [source, isDirty])

  const applyTemplate = (template: WorkshopTemplateSummary) => {
    if (isDirty && !window.confirm(replaceDraftCopy)) {
      return
    }
    setSelectedTemplateId(template.id)
    setSource(template.source)
    setValidation(template.validation)
    setIsDirty(false)
  }

  const onSourceChange = (nextSource: string) => {
    setSource(nextSource)
    setIsDirty(true)
  }

  return (
    <main className="workshop-shell">
      <div className="workshop-grid">
        <aside className="workshop-left workshop-stack">
          <section className="workshop-panel">
            <div className="workshop-row">
              <div>
                <p className="workshop-muted">Coward's Game</p>
                <h1 className="workshop-title">Strategy Workshop</h1>
              </div>
              <span
                className={`workshop-chip ${getDraftStatusClass(draftState)}`}
              >
                {draftState === "valid"
                  ? "Valid"
                  : draftState === "invalid"
                    ? "Invalid"
                    : "Draft"}
              </span>
            </div>
            <p className="workshop-muted">Local Player</p>
          </section>

          <section className="workshop-panel">
            <h2 className="workshop-heading">Templates</h2>
            <div className="workshop-list">
              {initialData.templates.map((template) => (
                <button
                  className={`workshop-list-row ${template.id === selectedTemplate?.id ? "active" : ""}`}
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  type="button"
                >
                  {template.label}
                </button>
              ))}
            </div>
            <p className="workshop-muted">{replaceDraftCopy}</p>
          </section>

          <section className="workshop-panel">
            <h2 className="workshop-heading">Revision history</h2>
            {initialData.revisions.length === 0 ? (
              <>
                <p>No revisions yet</p>
                <p className="workshop-muted">
                  Submit a valid draft to create the first immutable revision.
                </p>
              </>
            ) : (
              <div className="workshop-list">
                {initialData.revisions.map((revision) => (
                  <button
                    className="workshop-list-row"
                    key={revision.id}
                    title={revision.sourceHash}
                    type="button"
                  >
                    {revision.metadata.label ?? "Untitled revision"}
                    <span className="workshop-muted">
                      {" "}
                      {revision.sourceHash.slice(0, 10)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="workshop-center workshop-stack">
          <section className="workshop-panel workshop-stack">
            <div className="workshop-row">
              <div>
                <h2 className="workshop-heading">Editor</h2>
                <span
                  className={`workshop-chip ${getDraftStatusClass(draftState)}`}
                >
                  {getDraftStatusLabel(draftState)}
                </span>
              </div>
              <button type="button" onClick={() => void validateSource()}>
                Validate source
              </button>
            </div>
            <StrategySourceEditor value={source} onChange={onSourceChange} />
          </section>

          <section className="workshop-panel">
            <h2 className="workshop-heading">Validation</h2>
            <p>
              {getDraftStatusLabel(draftState)} ·{" "}
              {validation?.errors.length ?? 0} errors ·{" "}
              {validation?.warnings.length ?? 0} warnings
            </p>
            {validation?.errors.length ? (
              <ul className="validation-list">
                {validation.errors.map((issue, index) => (
                  <li className="validation-row" key={`${issue.code}-${index}`}>
                    <span className="validation-code">
                      {formatValidationIssueHeading(issue)}
                    </span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
            {validation ? (
              <details>
                <summary>Advanced details</summary>
                <dl className="details-grid">
                  <dt>sourceBytes</dt>
                  <dd>{validation.sourceBytes}</dd>
                  <dt>sourceHash</dt>
                  <dd>{validation.sourceHash}</dd>
                  <dt>runtimeVersion</dt>
                  <dd>{validation.runtimeVersion}</dd>
                  <dt>engineCompatibility.spec</dt>
                  <dd>{validation.engineCompatibility.spec}</dd>
                  <dt>engineCompatibility.engine</dt>
                  <dd>{validation.engineCompatibility.engine}</dd>
                  <dt>forbiddenPatterns</dt>
                  <dd>{validation.forbiddenPatterns.join(", ") || "none"}</dd>
                </dl>
              </details>
            ) : null}
          </section>
        </section>

        <aside className="workshop-right workshop-stack">
          <section className="workshop-panel workshop-stack">
            <h2 className="workshop-heading">Submit revision</h2>
            <label>
              <span className="workshop-label">Label</span>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              <span className="workshop-label">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <button className="primary" disabled type="button">
              Submit revision
            </button>
          </section>

          <section className="workshop-panel workshop-stack">
            <h2 className="workshop-heading">Workshop test</h2>
            <label>
              <span className="workshop-label">Opponent</span>
              <select disabled value={initialData.opponents[0]?.id ?? ""}>
                {initialData.opponents.map((opponent) => (
                  <option key={opponent.id} value={opponent.id}>
                    {opponent.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="workshop-label">Preset</span>
              <select disabled value={initialData.presets[0]?.id ?? ""}>
                {initialData.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.id}
                  </option>
                ))}
              </select>
            </label>
            <button disabled type="button">
              Launch test
            </button>
            <p className="workshop-muted">
              Select a revision to launch a Workshop test.
            </p>
          </section>
        </aside>
      </div>
    </main>
  )
}
