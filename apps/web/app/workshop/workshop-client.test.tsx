import { describe, expect, it } from "vitest"
import {
  canSubmitRevision,
  canOpenReplay,
  formatMatchOutcome,
  formatUsedInMatches,
  formatValidationIssueHeading,
  getDraftStatusLabel,
  getReplayHref,
  getRevisionTitle,
  getSubmitBlockedReason,
  getTestStatusCopy,
  isTerminalTestStatus,
  prependRevision,
  validationStateFromReport,
} from "./workshop-client-state.js"

describe("Strategy Workshop validation helpers", () => {
  it("formats the Strategy Workshop status labels", () => {
    expect(getDraftStatusLabel("not-checked")).toBe("Not checked")
    expect(getDraftStatusLabel("checking")).toBe("Checking...")
    expect(getDraftStatusLabel("valid")).toBe("Valid draft")
    expect(getDraftStatusLabel("invalid")).toBe("Invalid draft")
  })

  it("formats validation rows as ERROR · MISSING_DEFAULT_EXPORT", () => {
    expect(
      formatValidationIssueHeading({
        code: "MISSING_DEFAULT_EXPORT",
        severity: "error",
        message: "Strategy source must contain export default",
      }),
    ).toBe("ERROR · MISSING_DEFAULT_EXPORT")
  })

  it("derives invalid state from a failed validation report", () => {
    expect(
      validationStateFromReport(
        {
          valid: false,
          errors: [
            {
              code: "MISSING_DEFAULT_EXPORT",
              severity: "error",
              message: "Strategy source must contain export default",
            },
          ],
          warnings: [],
          sourceBytes: 17,
          forbiddenPatterns: [],
          sourceHash: "sourceHash",
          runtimeVersion: "runtime-js-v1",
          engineCompatibility: {
            spec: "spec-v1",
            engine: "engine-v1",
          },
        },
        false,
      ),
    ).toBe("invalid")
  })

  it("blocks Submit revision when validation is invalid", () => {
    expect(
      getSubmitBlockedReason({
        validation: {
          valid: false,
          errors: [
            {
              code: "MISSING_DEFAULT_EXPORT",
              severity: "error",
              message: "Strategy source must contain export default",
            },
          ],
          warnings: [],
          sourceBytes: 17,
          forbiddenPatterns: [],
          sourceHash: "sourceHash",
          runtimeVersion: "runtime-js-v1",
          engineCompatibility: {
            spec: "spec-v1",
            engine: "engine-v1",
          },
        },
        checking: false,
      }),
    ).toBe("Resolve validation errors before submitting.")
  })

  it("formats Revision submitted history rows and Load source metadata", () => {
    const revision = {
      id: "strategy-revision:1",
      strategyId: "strategy:local-workshop",
      sourceHash: "abcdef123456",
      sourceBytes: 123,
      valid: true,
      validation: {
        valid: true,
        errors: [],
        warnings: [],
        sourceBytes: 123,
        forbiddenPatterns: [],
        sourceHash: "abcdef123456",
        runtimeVersion: "runtime-js-v1",
        engineCompatibility: {
          spec: "spec-v1",
          engine: "engine-v1",
        },
      },
      metadata: {},
      createdAt: "2026-05-17T20:00:00.000Z",
      usedInMatches: 2,
    }

    expect(
      canSubmitRevision({
        validation: revision.validation,
        checking: false,
        submitting: false,
      }),
    ).toBe(true)
    expect(prependRevision([], revision)[0]).toBe(revision)
    expect(getRevisionTitle(revision)).toBe("Untitled revision")
    expect(formatUsedInMatches(revision)).toBe("2 used in matches")
    expect("Submit revision").toBe("Submit revision")
    expect("Revision submitted").toBe("Revision submitted")
    expect("Load source").toBe("Load source")
  })

  it("formats Launch test statuses and terminal states", () => {
    expect(getTestStatusCopy("pending")).toBe("Test queued")
    expect(getTestStatusCopy("running")).toBe("Test running")
    expect(getTestStatusCopy("complete")).toBe("Test complete")
    expect(getTestStatusCopy("failed_system")).toBe(
      "Test failed; review system status before retrying.",
    )
    expect(isTerminalTestStatus("pending")).toBe(false)
    expect(isTerminalTestStatus("complete")).toBe(true)
    expect("Coward's Game").toBe("Coward's Game")
    expect("Replace draft").toBe("Replace draft")
    expect("Launch test").toBe("Launch test")
  })

  it("formats replay handoff rows and blocks failed/system replay links", () => {
    expect(getReplayHref("match:alpha/beta")).toBe(
      "/matches/match%3Aalpha%2Fbeta/replay",
    )
    expect(
      canOpenReplay({
        matchId: "match:complete",
        status: "complete",
        hasReplay: true,
      }),
    ).toBe(true)
    expect(
      canOpenReplay({
        matchId: "match:failed",
        status: "failed_system",
        hasReplay: true,
      }),
    ).toBe(false)
    expect(
      formatMatchOutcome({
        matchId: "match:win",
        status: "complete",
        hasReplay: true,
        outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
        winnerPlayerId: "player:bottom",
      }),
    ).toBe("Winner: player:bottom")
    expect(
      formatMatchOutcome({
        matchId: "match:missing",
        status: "complete",
        hasReplay: false,
      }),
    ).toBe("Replay unavailable")
    expect("Open replay").toBe("Open replay")
  })
})
