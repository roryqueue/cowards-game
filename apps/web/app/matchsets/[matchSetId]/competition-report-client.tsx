"use client"

import { useState } from "react"
import {
  COMPETITION_REPORT_CATEGORIES,
  type CompetitionReportCategory,
} from "@cowards/spec"

const categoryLabels: Record<CompetitionReportCategory, string> = {
  result_integrity: "Result integrity",
  entry_eligibility: "Entry eligibility",
  identity_or_coordination: "Identity or coordination",
  abusive_conduct: "Abusive conduct",
  other: "Other",
}

export function CompetitionReportClient({
  matchSetId,
  signedIn,
  canDispute,
}: {
  matchSetId: string
  signedIn: boolean
  canDispute: boolean
}) {
  const [submissionType, setSubmissionType] = useState<"report" | "dispute">(
    "report",
  )
  const [category, setCategory] =
    useState<CompetitionReportCategory>("result_integrity")
  const [privateDetail, setPrivateDetail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  if (!signedIn) {
    return (
      <p className="workshop-muted">
        <a href="/auth/sign-in">Sign in</a> to report this result. Read the{" "}
        <a href="/competitions/fair-play">fair-play policy</a> first.
      </p>
    )
  }

  const submit = async () => {
    setSubmitting(true)
    setMessage("")
    try {
      const response = await fetch(
        `/api/matchsets/${encodeURIComponent(matchSetId)}/reports`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            submissionType,
            category,
            ...(privateDetail.trim() ? { privateDetail } : {}),
          }),
        },
      )
      const body = (await response.json()) as {
        publicMessage?: string
        error?: string
      }
      setMessage(
        response.ok
          ? (body.publicMessage ?? "Report received.")
          : (body.error ?? "The report could not be submitted."),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-form-stack" data-testid="competition-report-form">
      <div className="status-strip" aria-label="Report type">
        <label>
          <input
            checked={submissionType === "report"}
            name="submissionType"
            onChange={() => setSubmissionType("report")}
            type="radio"
          />{" "}
          Report
        </label>
        <label>
          <input
            checked={submissionType === "dispute"}
            disabled={!canDispute}
            name="submissionType"
            onChange={() => setSubmissionType("dispute")}
            type="radio"
          />{" "}
          Dispute as entrant
        </label>
      </div>
      <label>
        <span className="workshop-label">Category</span>
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as CompetitionReportCategory)
          }
        >
          {COMPETITION_REPORT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {categoryLabels[value]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="workshop-label">Private detail (optional)</span>
        <textarea
          maxLength={500}
          onChange={(event) => setPrivateDetail(event.target.value)}
          value={privateDetail}
        />
      </label>
      <p className="workshop-muted">
        Do not include credentials, tokens, Strategy source, runtime details, or
        recovery evidence.
      </p>
      {message ? <p role="status">{message}</p> : null}
      <div className="app-actions">
        <button
          disabled={submitting}
          onClick={() => void submit()}
          type="button"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
        <a href="/competitions/fair-play">Fair-play policy</a>
      </div>
    </div>
  )
}
