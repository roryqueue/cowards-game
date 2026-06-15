import { describe, expect, it } from "vitest"
import type { WorkshopCheckerResponse } from "@cowards/spec"
import type { WorkshopRevisionSummary } from "./types.js"
import {
  canSubmitRevision,
  canOpenReplay,
  canOpenOwnerReplay,
  checkerMatchesValidation,
  formatMatchOutcome,
  formatUsedInMatches,
  formatCheckerDiagnosticGuidance,
  formatCheckerDiagnosticHeading,
  formatValidationIssueGuidance,
  formatValidationIssueHeading,
  getAccountRevisionSourceHref,
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
  validationStateFromChecker,
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

const validChecker: WorkshopCheckerResponse = {
  contractVersion: "workshop-checker-v1.34",
  status: "ready",
  sourceFormat: "typescript",
  language: {
    id: "typescript",
    label: "TypeScript",
    providerId: "strategy-language-provider-js-ts",
    contractVersion: "strategy-language-provider-contract-v1.33",
  },
  owners: {
    validationOwner: "runtime-service",
    buildOwner: "runtime-service",
    executionOwner: "runtime-service",
  },
  source: {
    hash: validReport.sourceHash,
    bytes: validReport.sourceBytes,
  },
  artifact: {
    kind: "source-artifact",
    format: "transpiled-javascript",
    hash: "artifact-hash",
    bytes: 456,
    state: "present",
  },
  provenance: {
    state: "valid",
    providerProofState: "valid",
  },
  runtimeService: {
    availability: "available",
    publicReason: null,
  },
  toolchain: {
    availability: "not_required",
    languageToolchain: null,
    publicReason: null,
  },
  diagnostics: [],
  cacheIdentity: {
    languageId: "typescript",
    providerId: "strategy-language-provider-js-ts",
    sourceHash: validReport.sourceHash,
    sourceBytes: validReport.sourceBytes,
    artifactHash: "artifact-hash",
    artifactBytes: 456,
    providerContractVersion: "strategy-language-provider-contract-v1.33",
    runtimeAbiVersion: "strategy-runtime-abi-v1.14",
    validationPolicy: "workshop-provider-checker-policy-v1.34",
    toolchainKey: null,
  },
  privacy: {
    publicSafe: true,
    redacted: true,
    excludedFields: [],
  },
}

describe("Strategy Workshop validation helpers", () => {
  it("formats the Strategy Workshop status labels", () => {
    expect(getDraftStatusLabel("not-checked")).toBe("Not checked")
    expect(getDraftStatusLabel("checking")).toBe("Checking source...")
    expect(getDraftStatusLabel("valid")).toBe("Ready to submit")
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

  it("formats public checker diagnostics by category and actionability", () => {
    const diagnostic = {
      code: "TRANSPILE_FAILED",
      category: "toolchain_unavailable" as const,
      severity: "error" as const,
      actionability: "install_or_configure_toolchain" as const,
      message:
        "Rust checker could not use the required toolchain. The Strategy has not been judged invalid.",
      constraint: null,
      remediation: "Install rustc and the wasm32-wasip1 target.",
      reference: "runtime/languages#rust",
      line: null,
      column: null,
      publicSafe: true as const,
    }

    expect(formatCheckerDiagnosticHeading(diagnostic)).toBe(
      "ERROR / TRANSPILE_FAILED",
    )
    expect(formatCheckerDiagnosticGuidance(diagnostic)).toEqual({
      constraint:
        "Rust checker could not use the required toolchain. The Strategy has not been judged invalid.",
      message:
        "Rust checker could not use the required toolchain. The Strategy has not been judged invalid.",
      remediation: "Install rustc and the wasm32-wasip1 target.",
      reference: "runtime/languages#rust",
      actionability: "install_or_configure_toolchain",
    })
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

  it("derives stale and unavailable states from checker responses", () => {
    expect(validationStateFromReport(validReport, false, true)).toBe("stale")
    expect(
      validationStateFromChecker(
        {
          contractVersion: "workshop-checker-v1.34",
          status: "runtime_service_unavailable",
          sourceFormat: "python",
          language: {
            id: "python",
            label: "Python",
            providerId: "strategy-language-provider-python",
            contractVersion: "strategy-language-provider-contract-v1.33",
          },
          owners: {
            validationOwner: "runtime-service",
            buildOwner: "runtime-service",
            executionOwner: "runtime-service",
          },
          source: { hash: "hash", bytes: 10 },
          artifact: {
            kind: "source-artifact",
            format: "python-source-bundle",
            hash: null,
            bytes: null,
            state: "missing",
          },
          provenance: {
            state: "missing",
            providerProofState: "missing",
          },
          runtimeService: {
            availability: "unavailable",
            publicReason:
              "Python checker could not reach runtime-service. The Strategy has not been judged invalid.",
          },
          toolchain: {
            availability: "not_required",
            languageToolchain: null,
            publicReason: null,
          },
          diagnostics: [],
          cacheIdentity: {
            languageId: "python",
            providerId: "strategy-language-provider-python",
            sourceHash: "hash",
            sourceBytes: 10,
            artifactHash: null,
            artifactBytes: null,
            providerContractVersion:
              "strategy-language-provider-contract-v1.33",
            runtimeAbiVersion: "strategy-runtime-abi-v1.14",
            validationPolicy: "workshop-provider-checker-policy-v1.34",
            toolchainKey: null,
          },
          privacy: {
            publicSafe: true,
            redacted: true,
            excludedFields: [],
          },
        },
        false,
      ),
    ).toBe("unavailable")
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

  it("requires a current ready checker before submitting", () => {
    expect(checkerMatchesValidation(validChecker, validReport)).toBe(true)
    expect(
      canSubmitRevision({
        validation: validReport,
        checker: validChecker,
        checking: false,
        submitting: false,
      }),
    ).toBe(true)
    expect(
      canSubmitRevision({
        validation: validReport,
        checker: validChecker,
        checking: true,
        submitting: false,
      }),
    ).toBe(false)
    expect(
      canSubmitRevision({
        validation: validReport,
        checking: false,
        submitting: false,
      }),
    ).toBe(false)
    expect(
      getSubmitBlockedReason({
        validation: validReport,
        checking: true,
      }),
    ).toBe("Checking source before submitting.")
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
      runtimeSemantics: {
        languageId: "typescript",
        adapterId: "runtime-js-worker-thread",
        languageLabel: "TypeScript",
        adapterLabel: "runtime-js worker thread",
        readiness: "local-dev-fallback",
        readinessLabel: "Local/dev fallback",
        experimental: false,
        countedPlayEligible: true,
        countedPlayLabel: "Counted eligible",
        countedPlayReason: null,
        sourcePolicyLabel: "Self-contained Strategy source",
        packagePolicyLabel: "No packages",
        docsReference: "runtime/languages",
        examplesReference: "samples/minimal-strategy",
        warnings: [],
        validationIssueCodes: [],
      },
      createdAt: "2026-05-17T20:00:00.000Z",
      usedInMatches: 2,
    } satisfies WorkshopRevisionSummary

    expect(
      canSubmitRevision({
        validation: revision.validation,
        checker: validChecker,
        checking: false,
        submitting: false,
      }),
    ).toBe(true)
    expect(prependRevision([], revision)[0]).toBe(revision)
    expect(getRevisionTitle(revision)).toBe("Untitled revision")
    expect(formatUsedInMatches(revision)).toBe("2 used in matches")
    expect(getAccountRevisionSourceHref(revision.id)).toBe(
      "/api/account/revisions/strategy-revision%3A1/source",
    )
    expect(getAccountRevisionSourceHref("strategy revision/space")).toBe(
      "/api/account/revisions/strategy%20revision%2Fspace/source",
    )
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
      ownerHref: null,
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

  it("keeps local Workshop replay links public-only", () => {
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
    expect(canOpenOwnerReplay(mirroredMatch)).toBe(false)
    expect(getReplayAvailability(mirroredMatch).ownerHref).toBeNull()
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
