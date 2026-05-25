import { describe, expect, it } from "vitest"
import {
  canSubmitRevision,
  canOpenReplay,
  canOpenOwnerReplay,
  formatMatchOutcome,
  formatUsedInMatches,
  formatValidationIssueGuidance,
  formatValidationIssueHeading,
  getSampleChipLabels,
  getSampleKindLabel,
  getDraftStatusLabel,
  getReplayAvailability,
  getReplayHref,
  getOwnerReplayHref,
  getWorkshopOwnerPlayerId,
  getRevisionTitle,
  getSubmitBlockedReason,
  getTestStatusCopy,
  groupWorkshopSamples,
  isTerminalTestStatus,
  prependRevision,
  validationStateFromReport,
} from "./workshop-client-state.js"

const validReport = {
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
}

const invalidReport = {
  ...validReport,
  valid: false,
  errors: [
    {
      code: "MISSING_DEFAULT_EXPORT" as const,
      severity: "error" as const,
      message: "Strategy source must contain export default",
      constraint: "Strategy API requires an export default Strategy object.",
      remediation: "Add export default with the Strategy methods.",
      reference: "samples/minimal-strategy",
    },
  ],
}

describe("Strategy Workshop validation helpers", () => {
  it("formats the Strategy Workshop status labels", () => {
    expect(getDraftStatusLabel("not-checked")).toBe("Not checked")
    expect(getDraftStatusLabel("checking")).toBe("Checking...")
    expect(getDraftStatusLabel("valid")).toBe("Valid draft")
    expect(getDraftStatusLabel("invalid")).toBe("Invalid draft")
  })

  it("formats validation rows as ERROR / MISSING_DEFAULT_EXPORT", () => {
    expect(
      formatValidationIssueHeading({
        code: "MISSING_DEFAULT_EXPORT",
        severity: "error",
        message: "Strategy source must contain export default",
      }),
    ).toBe("ERROR / MISSING_DEFAULT_EXPORT")
  })

  it("formats validation issue guidance from constraint and remediation fields", () => {
    expect(
      formatValidationIssueGuidance({
        code: "MISSING_DEFAULT_EXPORT",
        severity: "error",
        message: "Strategy source must contain export default",
        constraint: "Strategy API requires an export default Strategy object.",
        remediation: "Add export default with the Strategy methods.",
      }),
    ).toEqual({
      constraint: "Strategy API requires an export default Strategy object.",
      message: "Strategy source must contain export default",
      remediation: "Add export default with the Strategy methods.",
      reference: null,
    })
  })

  it("falls back to the validation issue message when guidance fields are absent", () => {
    expect(
      formatValidationIssueGuidance({
        code: "MISSING_DEFAULT_EXPORT",
        severity: "error",
        message: "Strategy source must contain export default",
      }),
    ).toEqual({
      constraint: "Strategy source must contain export default",
      message: "Strategy source must contain export default",
      remediation: null,
      reference: null,
    })
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

  it("keeps Submit revision stable while revalidating an already-valid source", () => {
    expect(
      canSubmitRevision({
        validation: validReport,
        checking: true,
        submitting: false,
      }),
    ).toBe(true)
    expect(
      getSubmitBlockedReason({
        validation: validReport,
        checking: true,
      }),
    ).toBeNull()
  })

  it("formats Revision submitted history rows and Load source metadata", () => {
    const revision = {
      id: "strategy-revision:1",
      strategyId: "strategy:local-workshop",
      sourceHash: "abcdef123456",
      sourceBytes: 123,
      sourceFormat: "typescript" as const,
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
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: true,
      }),
    ).toBe(true)
    expect(
      canOpenReplay({
        matchId: "match:failed",
        status: "failed_system",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: true,
      }),
    ).toBe(false)
    expect(
      formatMatchOutcome({
        matchId: "match:win",
        status: "complete",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: true,
        outcome: { type: "WIN", winnerPlayerId: "player:bottom" },
        winnerPlayerId: "player:bottom",
      }),
    ).toBe("Winner: player:bottom")
    expect(
      formatMatchOutcome({
        matchId: "match:missing",
        status: "complete",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: false,
      }),
    ).toBe("Replay unavailable")
    expect("Open replay").toBe("Open replay")
  })

  it("formats replay availability for every Workshop handoff state", () => {
    expect(
      getReplayAvailability({
        matchId: "match:complete",
        status: "complete",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: true,
      }),
    ).toEqual({
      state: "available",
      label: "Open replay",
      href: "/matches/match%3Acomplete/replay",
      ownerHref:
        "/matches/match%3Acomplete/replay?ownerDebug=1&ownerPlayerId=player%3Aworkshop-local",
      reason: null,
    })
    expect(
      getReplayAvailability({
        matchId: "match:pending",
        status: "pending",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: false,
      }).reason,
    ).toBe(
      "Replay will appear after this Match leaves the queue and stores a Chronicle.",
    )
    expect(
      getReplayAvailability({
        matchId: "match:running",
        status: "running",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: false,
      }).reason,
    ).toBe(
      "Replay will appear after the Match completes and its Chronicle is stored.",
    )
    expect(
      getReplayAvailability({
        matchId: "match:failed",
        status: "failed_system",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: false,
      }).reason,
    ).toBe(
      "Replay unavailable because the Match failed before a Chronicle could be stored.",
    )
    expect(
      getReplayAvailability({
        matchId: "match:blocked",
        status: "blocked",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: false,
      }).reason,
    ).toBe("Replay unavailable because the Match was blocked before execution.")
    expect(
      getReplayAvailability({
        matchId: "match:no-chronicle",
        status: "complete",
        bottomPlayerId: "player:workshop-local",
        topPlayerId: "player:opponent",
        hasReplay: false,
      }).reason,
    ).toBe("Replay unavailable: this completed Match has no stored Chronicle.")
  })

  it("builds owner replay links only for local Workshop participant Matches", () => {
    const mirroredMatch = {
      matchId: "match:mirrored",
      status: "complete" as const,
      bottomPlayerId: "player:opponent",
      topPlayerId: "player:workshop-local",
      hasReplay: true,
    }
    const nonParticipantMatch = {
      ...mirroredMatch,
      matchId: "match:other",
      topPlayerId: "player:other",
    }

    expect(getOwnerReplayHref("match:mirrored/slash")).toBe(
      "/matches/match%3Amirrored%2Fslash/replay?ownerDebug=1&ownerPlayerId=player%3Aworkshop-local",
    )
    expect(getWorkshopOwnerPlayerId(mirroredMatch)).toBe(
      "player:workshop-local",
    )
    expect(canOpenOwnerReplay(mirroredMatch)).toBe(true)
    expect(getReplayAvailability(mirroredMatch).ownerHref).toBe(
      "/matches/match%3Amirrored/replay?ownerDebug=1&ownerPlayerId=player%3Aworkshop-local",
    )
    expect(getWorkshopOwnerPlayerId(nonParticipantMatch)).toBeNull()
    expect(canOpenOwnerReplay(nonParticipantMatch)).toBe(false)
    expect(getReplayAvailability(nonParticipantMatch).ownerHref).toBeNull()
  })

  it("groups starter samples separately from failure-mode samples", () => {
    const starter = {
      id: "sample:basic-advance" as const,
      label: "Basic advance and turn",
      description: "Advance when clear, otherwise turn.",
      source: "export default {}",
      validation: validReport,
      sampleKind: "starter" as const,
      categories: ["Movement"],
    }
    const failureMode = {
      id: "sample:invalid-output" as const,
      label: "Invalid output",
      description: "Returns an Action payload that fails schema validation.",
      source: "export default {}",
      validation: invalidReport,
      sampleKind: "failure-mode" as const,
      categories: ["Invalid output"],
      expectedValidationCode: "MISSING_DEFAULT_EXPORT" as const,
    }

    const groups = groupWorkshopSamples([failureMode, starter])

    expect(groups.starters).toEqual([starter])
    expect(groups.failureModes).toEqual([failureMode])
    expect(getSampleKindLabel(starter)).toBe("Valid sample")
    expect(getSampleKindLabel(failureMode)).toBe("Failure mode")
    expect(getSampleChipLabels(starter)).toEqual(["Movement", "Valid sample"])
    expect(getSampleChipLabels(failureMode)).toEqual([
      "Invalid output",
      "Failure mode",
    ])
  })
})
