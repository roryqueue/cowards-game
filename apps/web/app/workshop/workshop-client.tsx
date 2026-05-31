"use client"

import { useEffect, useMemo, useState } from "react"
import type {
  StrategyArtifactSourceFormat,
  StrategyRevisionValidationReport,
} from "@cowards/spec"
import { StrategySourceEditor } from "./monaco-editor.js"
import type {
  WorkshopSampleSummary,
  WorkshopInitialData,
  WorkshopTemplateSummary,
  WorkshopTestSummary,
} from "./types.js"
import { WorkshopHeatmap } from "./heatmap-client.js"
import {
  canSubmitRevision,
  canOpenReplay,
  canOpenOwnerReplay,
  formatMatchOutcome,
  formatUsedInMatches,
  formatValidationIssueGuidance,
  formatValidationIssueHeading,
  getReplayHref,
  getOwnerReplayHref,
  getDraftStatusClass,
  getDraftStatusLabel,
  getReplayAvailability,
  getSampleChipLabels,
  getTestStatusCopy,
  getSubmitBlockedReason,
  groupWorkshopSamples,
  isTerminalTestStatus,
  prependRevision,
  validationStateFromReport,
} from "./workshop-client-state.js"
import {
  sourceFormatExhibitionLabel,
  sourceFormatRuntimeCue,
  sourceFormatShortLabel,
} from "../../lib/runtime-labels.js"

export interface WorkshopClientProps {
  initialData: WorkshopInitialData
}

const replaceDraftCopy =
  "Replace draft: this will overwrite the current unsaved source with the selected template."
const invalidSubmitBlockedReason =
  "Resolve validation errors before submitting."
const runtimeDisplayLabel = (revision: { sourceFormat?: string | undefined }) =>
  sourceFormatExhibitionLabel(revision.sourceFormat)

type WorkshopEditorSourceFormat = Extract<
  StrategyArtifactSourceFormat,
  "typescript" | "python" | "rust" | "zig"
>

const normalizeEditorSourceFormat = (
  value: string | undefined,
): WorkshopEditorSourceFormat =>
  value === "python"
    ? "python"
    : value === "rust"
      ? "rust"
      : value === "zig"
        ? "zig"
        : "typescript"

export function WorkshopClient({ initialData }: WorkshopClientProps) {
  const firstTemplate = initialData.templates[0]
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    firstTemplate?.id ?? "",
  )
  const [selectedStarterId, setSelectedStarterId] = useState("")
  const [selectedAdvancedId, setSelectedAdvancedId] = useState("")
  const [selectedSampleId, setSelectedSampleId] = useState("")
  const [source, setSource] = useState(
    firstTemplate?.source ?? initialData.templateSource,
  )
  const [sourceFormat, setSourceFormat] = useState<WorkshopEditorSourceFormat>(
    normalizeEditorSourceFormat(firstTemplate?.sourceFormat),
  )
  const [isDirty, setIsDirty] = useState(false)
  const [validation, setValidation] =
    useState<StrategyRevisionValidationReport | null>(
      firstTemplate?.validation ?? initialData.templateValidation,
    )
  const [validationSource, setValidationSource] = useState(
    firstTemplate?.source ?? initialData.templateSource,
  )
  const [validationSourceFormat, setValidationSourceFormat] =
    useState<WorkshopEditorSourceFormat>(
      normalizeEditorSourceFormat(firstTemplate?.sourceFormat),
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
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountMessage, setAccountMessage] = useState("")
  const [accountError, setAccountError] = useState("")
  const [forkingStarter, setForkingStarter] = useState(false)
  const [forkingAdvanced, setForkingAdvanced] = useState(false)
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
      ) ?? null,
    [initialData.templates, selectedTemplateId],
  )
  const selectedStarter = useMemo(
    () =>
      initialData.starters.find(
        (starter) => starter.id === selectedStarterId,
      ) ?? null,
    [initialData.starters, selectedStarterId],
  )
  const selectedAdvanced = useMemo(
    () =>
      initialData.advancedStrategies.find(
        (advanced) => advanced.id === selectedAdvancedId,
      ) ?? null,
    [initialData.advancedStrategies, selectedAdvancedId],
  )
  const sampleGroups = useMemo(
    () => groupWorkshopSamples(initialData.samples),
    [initialData.samples],
  )

  const currentValidation =
    validationSource === source && validationSourceFormat === sourceFormat
      ? validation
      : null
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
  const validationIssues = [
    ...(currentValidation?.errors ?? []),
    ...(currentValidation?.warnings ?? []),
  ]
  const selectedStarterMatchesDraft =
    Boolean(selectedStarter) &&
    source === selectedStarter?.source &&
    currentValidation?.sourceHash === selectedStarter?.sourceHash
  const selectedAdvancedMatchesDraft =
    Boolean(selectedAdvanced) &&
    source === selectedAdvanced?.source &&
    currentValidation?.sourceHash === selectedAdvanced?.sourceHash
  const previousRevision = useMemo(() => {
    if (!selectedRevision) return null
    const index = revisions.findIndex(
      (revision) => revision.id === selectedRevision.id,
    )
    return index >= 0 ? (revisions[index + 1] ?? null) : null
  }, [revisions, selectedRevision])

  const validateSource = async (nextSource = source) => {
    setChecking(true)
    try {
      const response = await fetch("/api/workshop/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: nextSource, sourceFormat }),
      })
      const body = (await response.json()) as {
        validation: StrategyRevisionValidationReport
      }
      setValidation(body.validation)
      setValidationSource(nextSource)
      setValidationSourceFormat(sourceFormat)
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
  }, [source, sourceFormat, isDirty])

  const applyTemplate = (template: WorkshopTemplateSummary) => {
    if (isDirty && !window.confirm(replaceDraftCopy)) {
      return
    }
    setSelectedTemplateId(template.id)
    setSelectedStarterId("")
    setSelectedSampleId("")
    setSourceFormat(normalizeEditorSourceFormat(template.sourceFormat))
    setSource(template.source)
    setValidation(template.validation)
    setValidationSource(template.source)
    setValidationSourceFormat(
      normalizeEditorSourceFormat(template.sourceFormat),
    )
    setIsDirty(false)
  }

  const applyStarter = (starter: WorkshopInitialData["starters"][number]) => {
    if (isDirty && !window.confirm(replaceDraftCopy)) {
      return
    }
    setSelectedTemplateId("")
    setSelectedStarterId(starter.id)
    setSelectedAdvancedId("")
    setSelectedSampleId("")
    setSourceFormat("typescript")
    setSource(starter.source)
    setValidation(starter.validation)
    setValidationSource(starter.source)
    setValidationSourceFormat("typescript")
    setLabel(starter.name)
    setNotes(starter.description)
    setIsDirty(false)
  }

  const applyAdvanced = (
    advanced: WorkshopInitialData["advancedStrategies"][number],
  ) => {
    if (isDirty && !window.confirm(replaceDraftCopy)) {
      return
    }
    setSelectedTemplateId("")
    setSelectedStarterId("")
    setSelectedAdvancedId(advanced.id)
    setSelectedSampleId("")
    setSourceFormat("typescript")
    setSource(advanced.source)
    setValidation(advanced.validation)
    setValidationSource(advanced.source)
    setValidationSourceFormat("typescript")
    setLabel(advanced.name)
    setNotes(advanced.description)
    setIsDirty(false)
  }

  const applySample = (sample: WorkshopSampleSummary) => {
    if (isDirty && !window.confirm(replaceDraftCopy)) {
      return
    }
    setSelectedTemplateId("")
    setSelectedStarterId("")
    setSelectedAdvancedId("")
    setSelectedSampleId(sample.id)
    setSourceFormat(normalizeEditorSourceFormat(sample.sourceFormat))
    setSource(sample.source)
    setValidation(sample.validation)
    setValidationSource(sample.source)
    setValidationSourceFormat(normalizeEditorSourceFormat(sample.sourceFormat))
    setIsDirty(false)
  }

  const onSourceChange = (nextSource: string) => {
    setSource(nextSource)
    setSelectedStarterId("")
    setSelectedAdvancedId("")
    setValidation(null)
    setValidationSource("")
    setValidationSourceFormat(sourceFormat)
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
        body: JSON.stringify({ source, sourceFormat, label, notes }),
      })
      const body = (await response.json()) as {
        error?: string
        ok?: boolean
        revision?: WorkshopInitialData["revisions"][number]
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

  const saveAccountRevision = async () => {
    if (!submitEnabled) {
      return
    }
    setAccountSaving(true)
    setAccountError("")
    setAccountMessage("")
    try {
      const response = await fetch("/api/account/revisions/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source,
          sourceFormat,
          label,
          notes,
          ...(selectedStarterMatchesDraft && selectedStarter
            ? { starterId: selectedStarter.id }
            : {}),
          ...(selectedAdvancedMatchesDraft && selectedAdvanced
            ? { advancedId: selectedAdvanced.id }
            : {}),
        }),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) {
        setAccountError(body.error ?? "Account revision save failed.")
        return
      }
      setAccountMessage("Saved to competitive account")
    } finally {
      setAccountSaving(false)
    }
  }

  const forkStarter = async () => {
    if (!selectedStarter) {
      return
    }
    setForkingStarter(true)
    setAccountError("")
    setAccountMessage("")
    try {
      const response = await fetch("/api/account/starter-forks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ starterId: selectedStarter.id }),
      })
      const body = (await response.json()) as {
        error?: string
        revision?: { label?: string | undefined }
      }
      if (!response.ok || !body.revision) {
        setAccountError(body.error ?? "Starter fork failed.")
        return
      }
      setAccountMessage(`Forked ${body.revision.label ?? selectedStarter.name}`)
    } finally {
      setForkingStarter(false)
    }
  }

  const forkAdvanced = async () => {
    if (!selectedAdvanced) {
      return
    }
    setForkingAdvanced(true)
    setAccountError("")
    setAccountMessage("")
    try {
      const response = await fetch("/api/account/advanced-forks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ advancedId: selectedAdvanced.id }),
      })
      const body = (await response.json()) as {
        error?: string
        revision?: { label?: string | undefined }
      }
      if (!response.ok || !body.revision) {
        setAccountError(body.error ?? "Advanced seed fork failed.")
        return
      }
      setAccountMessage(
        `Forked ${body.revision.label ?? selectedAdvanced.name}`,
      )
    } finally {
      setForkingAdvanced(false)
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
    setSourceFormat(
      normalizeEditorSourceFormat(
        revisions.find((revision) => revision.id === revisionId)?.sourceFormat,
      ),
    )
    setValidation(null)
    setValidationSource("")
    setValidationSourceFormat(
      normalizeEditorSourceFormat(
        revisions.find((revision) => revision.id === revisionId)?.sourceFormat,
      ),
    )
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
            <div className="workshop-row">
              <div>
                <h2 className="workshop-heading">Advanced Library</h2>
                <p className="workshop-muted">
                  Advanced seeds are stronger benchmark templates with
                  profile-scoped evidence.
                </p>
              </div>
              <span className="workshop-chip">Advanced seed</span>
            </div>
            <div className="workshop-list" data-testid="advanced-library">
              {initialData.advancedStrategies.map((advanced) => (
                <button
                  className={`workshop-list-row ${advanced.id === selectedAdvanced?.id ? "active" : ""}`}
                  aria-pressed={advanced.id === selectedAdvanced?.id}
                  data-advanced-id={advanced.id}
                  key={advanced.id}
                  onClick={() => applyAdvanced(advanced)}
                  type="button"
                >
                  <span className="workshop-sample-title">{advanced.name}</span>
                  <span className="workshop-muted">
                    {advanced.primaryArchetype}
                  </span>
                  <span className="workshop-muted">{advanced.description}</span>
                  <span className="workshop-chip-row">
                    {advanced.tags.map((tag) => (
                      <span className="workshop-chip valid" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
            {selectedAdvanced ? (
              <div className="starter-detail" data-testid="advanced-detail">
                <p className="workshop-label">Doctrine notes</p>
                <ul>
                  {selectedAdvanced.doctrineNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <dl className="details-grid">
                  <dt>archetype</dt>
                  <dd>{selectedAdvanced.primaryArchetype}</dd>
                  <dt>hash</dt>
                  <dd>{selectedAdvanced.sourceHash.slice(0, 16)}</dd>
                  <dt>bytes</dt>
                  <dd>{selectedAdvanced.sourceBytes}</dd>
                  <dt>validation</dt>
                  <dd>
                    {selectedAdvanced.validation.valid ? "valid" : "invalid"}
                  </dd>
                  <dt>memory</dt>
                  <dd>
                    {selectedAdvanced.usesMemory ? "uses memory" : "stateless"}
                  </dd>
                </dl>
                <button
                  className="primary"
                  disabled={forkingAdvanced}
                  type="button"
                  onClick={() => void forkAdvanced()}
                >
                  {forkingAdvanced ? "Forking..." : "Fork advanced seed"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="workshop-panel workshop-template-panel">
            <h2 className="workshop-heading">Starter Library</h2>
            <div className="workshop-list" data-testid="starter-library">
              {initialData.starters.map((starter) => (
                <button
                  className={`workshop-list-row ${starter.id === selectedStarter?.id ? "active" : ""}`}
                  aria-pressed={starter.id === selectedStarter?.id}
                  data-starter-id={starter.id}
                  key={starter.id}
                  onClick={() => applyStarter(starter)}
                  type="button"
                >
                  <span className="workshop-sample-title">{starter.name}</span>
                  <span className="workshop-muted">{starter.description}</span>
                  <span className="workshop-chip-row">
                    {starter.tags.map((tag) => (
                      <span className="workshop-chip valid" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
            {selectedStarter ? (
              <div className="starter-detail" data-testid="starter-detail">
                <p className="workshop-label">Doctrine notes</p>
                <ul>
                  {selectedStarter.doctrineNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                <dl className="details-grid">
                  <dt>hash</dt>
                  <dd>{selectedStarter.sourceHash.slice(0, 16)}</dd>
                  <dt>bytes</dt>
                  <dd>{selectedStarter.sourceBytes}</dd>
                  <dt>validation</dt>
                  <dd>
                    {selectedStarter.validation.valid ? "valid" : "invalid"}
                  </dd>
                  <dt>memory</dt>
                  <dd>
                    {selectedStarter.usesMemory ? "uses memory" : "stateless"}
                  </dd>
                </dl>
                <button
                  className="primary"
                  disabled={forkingStarter}
                  type="button"
                  onClick={() => void forkStarter()}
                >
                  {forkingStarter ? "Forking..." : "Fork to my account"}
                </button>
              </div>
            ) : null}
          </section>

          <section className="workshop-panel workshop-template-panel">
            <h2 className="workshop-heading">Sample Strategies</h2>
            <div className="workshop-list">
              {initialData.templates.map((template) => (
                <button
                  className={`workshop-list-row ${template.id === selectedTemplate?.id ? "active" : ""}`}
                  aria-pressed={template.id === selectedTemplate?.id}
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  type="button"
                >
                  <span>{template.label}</span>
                  {template.experimental ? (
                    <span className="workshop-chip warning">
                      {template.sourceFormat === "rust"
                        ? "Rust"
                        : template.sourceFormat === "zig"
                          ? "Zig beta"
                          : "Experimental"}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {initialData.samples.length ? (
              <div
                className="workshop-list"
                data-testid="workshop-sample-catalog"
              >
                <p className="workshop-label">Starter samples</p>
                {sampleGroups.starters.map((sample) => (
                  <button
                    className={`workshop-list-row ${sample.id === selectedSampleId ? "active" : ""}`}
                    aria-pressed={sample.id === selectedSampleId}
                    data-sample-id={sample.id}
                    data-testid="workshop-sample-row"
                    key={sample.id}
                    onClick={() => applySample(sample)}
                    type="button"
                  >
                    <span className="workshop-sample-title">
                      {sample.label}
                    </span>
                    <span className="workshop-muted">{sample.description}</span>
                    <span className="workshop-chip-row">
                      {getSampleChipLabels(sample).map((label) => (
                        <span className="workshop-chip valid" key={label}>
                          {label}
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
                <p className="workshop-label">Failure-mode samples</p>
                {sampleGroups.failureModes.map((sample) => (
                  <button
                    className={`workshop-list-row ${sample.id === selectedSampleId ? "active" : ""}`}
                    aria-pressed={sample.id === selectedSampleId}
                    data-sample-id={sample.id}
                    data-testid="workshop-sample-row"
                    key={sample.id}
                    onClick={() => applySample(sample)}
                    type="button"
                  >
                    <span className="workshop-sample-title">
                      {sample.label}
                    </span>
                    <span className="workshop-muted">{sample.description}</span>
                    <span className="workshop-chip-row">
                      {getSampleChipLabels(sample).map((label) => (
                        <span className="workshop-chip warning" key={label}>
                          {label}
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
            <p className="workshop-muted">{replaceDraftCopy}</p>
          </section>

          <section className="workshop-panel workshop-revision-panel">
            <div className="workshop-row">
              <h2 className="workshop-heading">Revision history</h2>
              <span className="workshop-chip">Compare</span>
            </div>
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
                      {runtimeDisplayLabel(revision) ??
                        formatUsedInMatches(revision)}
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
            {selectedRevision && previousRevision ? (
              <div className="starter-detail" data-testid="revision-compare">
                <p className="workshop-label">Revision comparison</p>
                <dl className="details-grid">
                  <dt>current</dt>
                  <dd>{selectedRevision.sourceHash.slice(0, 12)}</dd>
                  <dt>previous</dt>
                  <dd>{previousRevision.sourceHash.slice(0, 12)}</dd>
                  <dt>byte delta</dt>
                  <dd>
                    {selectedRevision.sourceBytes -
                      previousRevision.sourceBytes}
                  </dd>
                  <dt>validation delta</dt>
                  <dd>
                    {selectedRevision.valid === previousRevision.valid
                      ? "unchanged"
                      : `${previousRevision.valid ? "valid" : "invalid"} -> ${
                          selectedRevision.valid ? "valid" : "invalid"
                        }`}
                  </dd>
                </dl>
              </div>
            ) : null}
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
            <div className="segmented-control" aria-label="Strategy language">
              <button
                className={sourceFormat === "typescript" ? "active" : ""}
                type="button"
                onClick={() => setSourceFormat("typescript")}
              >
                {sourceFormatShortLabel("typescript")}
              </button>
              <button
                className={sourceFormat === "python" ? "active" : ""}
                type="button"
                onClick={() => setSourceFormat("python")}
              >
                {sourceFormatShortLabel("python")}
              </button>
              <button
                className={sourceFormat === "rust" ? "active" : ""}
                type="button"
                onClick={() => setSourceFormat("rust")}
              >
                {sourceFormatShortLabel("rust")}
              </button>
              <button
                className={sourceFormat === "zig" ? "active" : ""}
                type="button"
                onClick={() => setSourceFormat("zig")}
              >
                {sourceFormatShortLabel("zig")}
              </button>
            </div>
            {sourceFormatRuntimeCue(sourceFormat) ? (
              <p className="workshop-muted">
                {sourceFormatRuntimeCue(sourceFormat)}
              </p>
            ) : null}
            <StrategySourceEditor
              language={sourceFormat}
              value={source}
              onChange={onSourceChange}
            />
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
            {currentValidation?.valid ? (
              <div className="validation-empty">
                <p>No validation issues</p>
                <p className="workshop-muted">
                  This draft passes the Strategy API checks. Submit a revision
                  or launch a Workshop test to inspect runtime behavior.
                </p>
              </div>
            ) : null}
            {validationIssues.length ? (
              <ul
                className="validation-list"
                data-testid="workshop-validation-guidance-list"
              >
                {validationIssues.map((issue, index) => (
                  <li
                    className={`validation-row ${issue.severity === "warning" ? "warning" : ""}`}
                    data-testid="workshop-validation-guidance-row"
                    data-validation-code={issue.code}
                    key={`${issue.code}-${index}`}
                  >
                    <span className="validation-code">
                      {formatValidationIssueHeading(issue)}
                    </span>
                    {(() => {
                      const guidance = formatValidationIssueGuidance(issue)
                      return (
                        <>
                          <span>Constraint: {guidance.constraint}</span>
                          {guidance.message === guidance.constraint ? null : (
                            <span>{guidance.message}</span>
                          )}
                          {guidance.remediation ? (
                            <span>Next: {guidance.remediation}</span>
                          ) : null}
                          {guidance.reference ? (
                            <span>Reference: {guidance.reference}</span>
                          ) : null}
                        </>
                      )
                    })()}
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
            {accountMessage ? <p>{accountMessage}</p> : null}
            {accountError ? <p role="alert">{accountError}</p> : null}
            <button
              className="primary"
              disabled={!submitEnabled}
              type="button"
              onClick={() => void submitRevision()}
            >
              Submit revision
            </button>
            <button
              disabled={!submitEnabled || accountSaving}
              type="button"
              onClick={() => void saveAccountRevision()}
            >
              {accountSaving ? "Saving..." : "Save to account"}
            </button>
            <a className="workshop-replay-link" href="/account">
              Competitive account
            </a>
          </section>

          <section className="workshop-panel workshop-stack workshop-test-panel">
            <div className="workshop-row">
              <div>
                <h2 className="workshop-heading">Gauntlet results</h2>
                <p className="workshop-muted">
                  Test matrices use immutable revisions and profile-scoped
                  summaries.
                </p>
              </div>
              <span className="workshop-chip">Smoke first</span>
            </div>
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
              <div
                aria-live="polite"
                className="workshop-test-result"
                role="status"
              >
                <p className="workshop-test-status">
                  {getTestStatusCopy(testResult.status)}
                </p>
                <p className="workshop-muted workshop-test-meta">
                  MatchSet ID: {testResult.matchSetId} · Status:{" "}
                  {testResult.status} · Match count: {testResult.matchCount}
                </p>
                <p className="workshop-muted">
                  Profile summary: W-L-D and reliability are scoped to this
                  exact preset/opponent profile.
                </p>
                <button
                  type="button"
                  onClick={() => void refreshTestStatus(testResult.matchSetId)}
                >
                  Refresh status
                </button>
                {testResult.scoring.rankings.length ? (
                  <div
                    aria-label="Strategy rankings"
                    className="workshop-score-list"
                  >
                    {testResult.scoring.rankings.map((ranking) => (
                      <div
                        className="workshop-score-row"
                        key={ranking.strategyRevisionId}
                      >
                        <strong title={ranking.strategyRevisionId}>
                          {ranking.strategyRevisionId}
                        </strong>
                        <span className="workshop-muted">
                          wins {ranking.wins}, losses {ranking.losses}, draws{" "}
                          {ranking.draws}, surviving soldiers{" "}
                          {ranking.survivingSoldiers}, survival turns{" "}
                          {ranking.survivalTurns}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {testResult.status === "degraded" ? (
                  <p>
                    Some Matches failed, but completed replays are available.
                  </p>
                ) : null}
                {testResult.matches.length ? (
                  <div className="workshop-match-list" aria-label="Matches">
                    {testResult.matches.map((match) => {
                      const replay = getReplayAvailability(match)
                      return (
                        <div className="workshop-match-row" key={match.matchId}>
                          <div className="workshop-match-main">
                            <span
                              className="workshop-match-id"
                              title={match.matchId}
                            >
                              {match.matchId}
                            </span>
                            <span className="workshop-muted">
                              {match.status} · {formatMatchOutcome(match)}
                            </span>
                          </div>
                          <span
                            className="workshop-muted"
                            data-replay-state={replay.state}
                            data-testid="workshop-replay-availability"
                          >
                            {canOpenReplay(match) ? (
                              <>
                                <a
                                  className="workshop-replay-link"
                                  href={getReplayHref(match.matchId)}
                                >
                                  {replay.label}
                                </a>
                                {canOpenOwnerReplay(match) ? (
                                  <>
                                    {" · "}
                                    <a
                                      className="workshop-replay-link"
                                      href={getOwnerReplayHref(match.matchId)}
                                    >
                                      Open owner debug
                                    </a>
                                  </>
                                ) : null}
                              </>
                            ) : (
                              replay.reason
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
          <WorkshopHeatmap
            profiles={initialData.analytics.profiles}
            runs={initialData.analytics.runs}
            selectedProfileId={initialData.analytics.selectedProfileId}
            selectedRunId={initialData.analytics.selectedRunId}
          />
        </aside>
      </div>
    </main>
  )
}
