"use client"

import { useEffect, useMemo, useState } from "react"
import type { StrategyRevisionValidationReport } from "@cowards/spec"
import { StrategySourceEditor } from "./monaco-editor.js"
import type {
  WorkshopSnapshot,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
} from "./types.js"
import {
  canSubmitRevision,
  formatUsedInMatches,
  formatValidationIssueHeading,
  getDraftStatusClass,
  getDraftStatusLabel,
  getTestStatusCopy,
  getSubmitBlockedReason,
  isTerminalTestStatus,
  prependRevision,
  validationStateFromReport,
} from "./workshop-client-state.js"

export interface WorkshopClientProps {
  initialData: WorkshopSnapshot
}

const replaceDraftCopy =
  "Replace draft: this will overwrite the current unsaved source with the selected template."
const invalidSubmitBlockedReason =
  "Resolve validation errors before submitting."

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
  const [validationSource, setValidationSource] = useState(
    firstTemplate?.source ?? initialData.templateSource,
  )
  const [checking, setChecking] = useState(false)
  const [label, setLabel] = useState("Workshop revision")
  const [notes, setNotes] = useState("")
  const [revisions, setRevisions] = useState(initialData.revisions)
  const [selectedRevisionId, setSelectedRevisionId] = useState(
    initialData.revisions[0]?.id ?? "",
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [selectedOpponentId, setSelectedOpponentId] = useState(
    initialData.opponents[0]?.id ?? "",
  )
  const [selectedPresetId, setSelectedPresetId] = useState(
    initialData.presets[0]?.id ?? "smoke-v1",
  )
  const [testResult, setTestResult] = useState<WorkshopTestSummary | null>(null)
  const [launchingTest, setLaunchingTest] = useState(false)
  const [testError, setTestError] = useState("")

  const selectedTemplate = useMemo(
    () =>
      initialData.templates.find(
        (template) => template.id === selectedTemplateId,
      ) ?? firstTemplate,
    [firstTemplate, initialData.templates, selectedTemplateId],
  )

  const currentValidation = validationSource === source ? validation : null
  const draftState = validationStateFromReport(currentValidation, checking)
  const submitEnabled = canSubmitRevision({
    validation: currentValidation,
    checking,
    submitting,
  })
  const submitBlockedReason = getSubmitBlockedReason({
    validation: currentValidation,
    checking,
  })
  const displayedSubmitBlockedReason =
    submitBlockedReason === invalidSubmitBlockedReason
      ? invalidSubmitBlockedReason
      : submitBlockedReason
  const selectedRevision = revisions.find(
    (revision) => revision.id === selectedRevisionId,
  )
  const canLaunchTest = Boolean(selectedRevision?.valid) && !launchingTest

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
      setValidationSource(nextSource)
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
    setValidationSource(template.source)
    setIsDirty(false)
  }

  const onSourceChange = (nextSource: string) => {
    setSource(nextSource)
    setValidation(null)
    setValidationSource("")
    setIsDirty(true)
  }

  const submitRevision = async () => {
    if (!submitEnabled) {
      return
    }
    setSubmitting(true)
    setSubmitError("")
    setSubmitMessage("")
    try {
      const response = await fetch("/api/workshop/revisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, label, notes }),
      })
      const body = (await response.json()) as {
        error?: string
        ok?: boolean
        revision?: WorkshopSnapshot["revisions"][number]
        validation?: StrategyRevisionValidationReport
      }
      if (!response.ok || body.ok === false || !body.revision) {
        setValidation(body.validation ?? validation)
        setSubmitError(body.error ?? "Revision submission failed.")
        return
      }
      setRevisions((current) => prependRevision(current, body.revision!))
      setSelectedRevisionId(body.revision.id)
      setValidation(body.validation ?? body.revision.validation)
      setValidationSource(source)
      setSubmitMessage("Revision submitted")
    } finally {
      setSubmitting(false)
    }
  }

  const loadRevisionSource = async (revisionId: string) => {
    const response = await fetch(
      `/api/workshop/revisions/${encodeURIComponent(revisionId)}/source`,
    )
    const body = (await response.json()) as { source?: string; error?: string }
    if (!response.ok || typeof body.source !== "string") {
      setSubmitError(body.error ?? "Revision source could not be loaded.")
      return
    }
    setSource(body.source)
    setValidation(null)
    setValidationSource("")
    setIsDirty(true)
  }

  const refreshTestStatus = async (matchSetId = testResult?.matchSetId) => {
    if (!matchSetId) {
      return
    }
    const response = await fetch(
      `/api/workshop/tests/${encodeURIComponent(matchSetId)}`,
    )
    const body = (await response.json()) as typeof testResult & {
      error?: string
    }
    if (!response.ok || !body) {
      setTestError(body?.error ?? "Test status could not be loaded.")
      return
    }
    setTestResult(body)
  }

  const launchTest = async () => {
    if (!selectedRevision || !canLaunchTest) {
      return
    }
    setLaunchingTest(true)
    setTestError("")
    try {
      const response = await fetch("/api/workshop/tests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          revisionId: selectedRevision.id,
          opponentId: selectedOpponentId,
          presetId: selectedPresetId,
        }),
      })
      const body = (await response.json()) as typeof testResult & {
        error?: string
      }
      if (!response.ok || !body) {
        setTestError(body?.error ?? "Test launch failed.")
        return
      }
      setTestResult(body)
    } finally {
      setLaunchingTest(false)
    }
  }

  useEffect(() => {
    if (!testResult || isTerminalTestStatus(testResult.status)) {
      return
    }
    const timeout = window.setTimeout(() => {
      void refreshTestStatus(testResult.matchSetId)
    }, 2000)
    return () => window.clearTimeout(timeout)
  }, [testResult])

  return (
    <main className="workshop-shell">
      <div className="workshop-grid">
        <aside className="workshop-left workshop-stack">
          <section className="workshop-panel workshop-header-panel">
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

          <section className="workshop-panel workshop-template-panel">
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

          <section className="workshop-panel workshop-revision-panel">
            <h2 className="workshop-heading">Revision history</h2>
            {revisions.length === 0 ? (
              <>
                <p>No revisions yet</p>
                <p className="workshop-muted">
                  Submit a valid draft to create the first immutable revision.
                </p>
              </>
            ) : (
              <div className="workshop-list">
                {revisions.map((revision) => (
                  <div
                    className={`workshop-list-row ${revision.id === selectedRevisionId ? "active" : ""}`}
                    key={revision.id}
                    title={revision.sourceHash}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRevisionId(revision.id)}
                    >
                      {revision.label ?? "Untitled revision"}
                    </button>
                    <p className="workshop-muted">
                      {new Date(revision.createdAt).toLocaleString()} ·{" "}
                      {revision.sourceHash.slice(0, 10)} ·{" "}
                      {revision.sourceBytes} bytes ·{" "}
                      {revision.valid ? "valid" : "invalid"} ·{" "}
                      {formatUsedInMatches(revision)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadRevisionSource(revision.id)}
                    >
                      Load source
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="workshop-center workshop-stack">
          <section className="workshop-panel workshop-stack workshop-editor-panel">
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

          <section className="workshop-panel workshop-validation-panel">
            <h2 className="workshop-heading">Validation</h2>
            <p>
              {getDraftStatusLabel(draftState)} ·{" "}
              {validation?.errors.length ?? 0} errors ·{" "}
              {validation?.warnings.length ?? 0} warnings
            </p>
            <p aria-live="polite" role="status">
              {getDraftStatusLabel(draftState)}
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
          <section className="workshop-panel workshop-stack workshop-submit-panel">
            <h2 className="workshop-heading">Submit revision</h2>
            <label>
              <span className="workshop-label">Revision label</span>
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
            {displayedSubmitBlockedReason ? (
              <p className="workshop-muted">{displayedSubmitBlockedReason}</p>
            ) : null}
            {submitMessage ? <p>{submitMessage}</p> : null}
            {submitError ? <p role="alert">{submitError}</p> : null}
            <button
              className="primary"
              disabled={!submitEnabled}
              type="button"
              onClick={() => void submitRevision()}
            >
              Submit revision
            </button>
          </section>

          <section className="workshop-panel workshop-stack workshop-test-panel">
            <h2 className="workshop-heading">Workshop test</h2>
            <label>
              <span className="workshop-label">Revision</span>
              <select
                value={selectedRevisionId}
                onChange={(event) => setSelectedRevisionId(event.target.value)}
              >
                <option value="">Select revision</option>
                {revisions
                  .filter((revision) => revision.valid)
                  .map((revision) => (
                    <option key={revision.id} value={revision.id}>
                      {revision.label ?? revision.sourceHash.slice(0, 10)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span className="workshop-label">Opponent</span>
              <select
                value={selectedOpponentId}
                onChange={(event) => setSelectedOpponentId(event.target.value)}
              >
                {initialData.opponents.map((opponent) => (
                  <option key={opponent.id} value={opponent.id}>
                    {opponent.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="workshop-label">Preset</span>
              <select
                value={selectedPresetId}
                onChange={(event) =>
                  setSelectedPresetId(
                    event.target.value as typeof selectedPresetId,
                  )
                }
              >
                {initialData.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.id}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={!canLaunchTest}
              type="button"
              onClick={() => void launchTest()}
            >
              Launch test
            </button>
            {!canLaunchTest ? (
              <p className="workshop-muted">
                Select a revision to launch a Workshop test.
              </p>
            ) : null}
            {testError ? <p role="alert">{testError}</p> : null}
            {testResult ? (
              <div aria-live="polite" role="status">
                <p>{getTestStatusCopy(testResult.status)}</p>
                <p className="workshop-muted">
                  MatchSet ID: {testResult.matchSetId} · Status:{" "}
                  {testResult.status} · Match count: {testResult.matchCount}
                </p>
                <button
                  type="button"
                  onClick={() => void refreshTestStatus(testResult.matchSetId)}
                >
                  Refresh status
                </button>
                {testResult.scoring.rankings.length ? (
                  <div className="details-grid">
                    {testResult.scoring.rankings.map((ranking) => (
                      <div key={ranking.strategyRevisionId}>
                        <strong>{ranking.strategyRevisionId}</strong>
                        <span>
                          wins {ranking.wins}, losses {ranking.losses}, draws{" "}
                          {ranking.draws}, surviving soldiers{" "}
                          {ranking.survivingSoldiers}, survival turns{" "}
                          {ranking.survivalTurns}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  )
}
