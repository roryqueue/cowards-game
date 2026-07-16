import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  createV137RuntimeAbiValidation,
  evaluateV137CanonicalJsonCorpus,
  evaluateV137EvidenceDag,
  evaluateV137HistoricalV116,
  evaluateV137OutcomeSemantics,
  evaluateV137RuntimeBudgets,
  evaluateV137SourceIdentity,
  evaluateV137TypescriptGoParity,
  parseV137RuntimeAbiEvaluatorArgs,
  renderV137RuntimeAbiValidationJson,
  renderV137RuntimeAbiValidationMarkdown,
  summarizeV137RuntimeAbiTestReceipt,
} from "./evaluate-v1-37-runtime-abi.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

describe("Phase 258 integrated runtime ABI evaluator", () => {
  it("accepts only pure check or atomic write-and-check modes", () => {
    expect(parseV137RuntimeAbiEvaluatorArgs(["--check"])).toEqual({
      write: false,
      check: true,
    })
    expect(parseV137RuntimeAbiEvaluatorArgs(["--write", "--check"])).toEqual({
      write: true,
      check: true,
    })
    for (const args of [
      [],
      ["--write"],
      ["--write", "--check", "--extra"],
      ["--check", "--check"],
    ]) {
      expect(() => parseV137RuntimeAbiEvaluatorArgs(args)).toThrow()
    }
  })

  it("executes the exact canonical JSON raw-byte corpus", () => {
    const gate = evaluateV137CanonicalJsonCorpus(repoRoot)
    expect(gate).toEqual({
      id: "canonical-json-corpus",
      status: "passed",
      vectorCount: 70,
      vectorRootSha256:
        "sha256:f658a8bcb6bd4457b2eb52b6628f7fc6ff4ca36661f685ab28d7b60c8b2722c0",
      successCount: expect.any(Number),
      rejectionCount: expect.any(Number),
    })
    expect(gate.successCount + gate.rejectionCount).toBe(gate.vectorCount)
  }, 20_000)

  it("proves exclusive outcomes and no-mutation failure ownership", () => {
    expect(evaluateV137OutcomeSemantics()).toEqual({
      id: "exclusive-outcome-no-mutation",
      status: "passed",
      variants: ["success", "player_violation", "system_failure"],
      playerViolationDiscardsProposedValue: true,
      systemFailureCarriesNoProposedValue: true,
      ambiguousAttributionIsSystemFailure: true,
    })
  })

  it("validates the exact budget artifact while retaining every lane as uncounted", () => {
    expect(evaluateV137RuntimeBudgets(repoRoot)).toEqual({
      id: "runtime-budget-contract",
      status: "passed",
      dimensionCount: 10,
      exactPinCount: 10,
      laneCount: 5,
      countedEligibleLaneCount: 0,
      productionTrustedProducerCount: 0,
      phase259ConformanceRequired: true,
    })
  })

  it("reconciles original and normalized source identity for all four languages", () => {
    expect(evaluateV137SourceIdentity()).toEqual({
      id: "source-normalization-identity",
      status: "passed",
      languages: ["typescript", "python", "rust", "zig"],
      normalizationPolicy: "source-line-endings-lf-v1.17",
      lineEndingKind: "mixed",
      originalAndNormalizedAreDistinct: true,
      languageNeutralRequestIdentity: true,
      domainFramedArtifactIdentity: true,
    })
  })

  it("closes the evidence DAG and keeps production trust empty", () => {
    expect(evaluateV137EvidenceDag(repoRoot)).toEqual({
      id: "exact-runtime-evidence-dag",
      status: "passed",
      nodeCount: 15,
      edgeCount: 26,
      exactPinCount: 10,
      rootKind: "evidenceBundle",
      productionTrustedProducerCount: 0,
      verifiedManagedAttestationCount: 4,
      verifiedCertificateCount: 4,
      verifiedEvidenceRootCount: 2,
    })
  })

  it("keeps immutable v1.16 dispatch and exact successor TS/Go wire parity", () => {
    const historical = evaluateV137HistoricalV116(repoRoot)
    expect(historical.id).toBe("historical-v1.16-dispatch")
    expect(historical.status).toBe("passed")
    expect(historical.protectedDigestCount).toBe(6)
    expect(historical.runtimeService).toBe("runtime-execution-service-v1.16")
    expect(historical.semanticReceipt).toBe("runtime-semantic-receipt-v1")

    const parity = evaluateV137TypescriptGoParity(repoRoot)
    expect(parity).toMatchObject({
      id: "typescript-go-v1.17-wire-parity",
      status: "passed",
      runtimeService: "runtime-execution-service-v1.17",
      currentDescriptor: true,
    })
    for (const digest of [
      parity.requestSha256,
      parity.responseSha256,
      parity.receiptClaimSha256,
    ]) {
      expect(digest).toMatch(/^sha256:[0-9a-f]{64}$/u)
    }
    expect(
      readFileSync(
        path.join(
          repoRoot,
          "packages/spec/artifacts/runtime-execution-service-request.v1.17.json",
        ),
      ).equals(
        readFileSync(
          path.join(
            repoRoot,
            "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
          ),
        ),
      ),
    ).toBe(true)
  })

  it("renders one deterministic public-safe validation result without overclaiming conformance", () => {
    const validation = createV137RuntimeAbiValidation({
      activation: {
        activationCommit: "a".repeat(40),
        activationPathCount: 23,
      },
      testReceipt: {
        stage: "postactivation",
        testManifestSha256: `sha256:${"b".repeat(64)}`,
        selectedCommandCount: 19,
        passedCount: 321,
        skippedCount: 0,
        databaseCommandCount: 8,
        passedCommandIds: [
          "phase258.service-and-engine",
          "phase258.database",
          "phase258.go.mixed-fails-closed",
          "phase258.full-engine-compatibility",
        ],
      },
      gates: [
        evaluateV137CanonicalJsonCorpus(repoRoot),
        evaluateV137OutcomeSemantics(),
        evaluateV137RuntimeBudgets(repoRoot),
        evaluateV137SourceIdentity(),
        evaluateV137EvidenceDag(repoRoot),
        evaluateV137HistoricalV116(repoRoot),
        evaluateV137TypescriptGoParity(repoRoot),
      ],
    })
    expect(validation).toMatchObject({
      schemaVersion: "runtime-abi-v1.17-validation-v1",
      milestone: "v1.37",
      phase: 258,
      status: "passed",
      posture: "activated-uncertified-pending-phase-259-conformance",
      activation: {
        activationCommit: "a".repeat(40),
        activationPathCount: 23,
        manifestStatus: "verified",
      },
      current: {
        runtimeAbi: "strategy-runtime-abi-v1.17",
        runtimeService: "runtime-execution-service-v1.17",
        semanticReceipt: "runtime-semantic-receipt-v1.17",
        canonicalJson: "canonical-json-v1.1",
        productionTrustedProducerCount: 0,
        countedEligibleLaneCount: 0,
      },
      requirements: [
        { id: "RABI-01", status: "proved" },
        { id: "RABI-02", status: "proved" },
        { id: "RABI-03", status: "proved" },
        { id: "RABI-04", status: "proved" },
        { id: "RABI-05", status: "proved" },
        { id: "RABI-06", status: "proved" },
        { id: "RABI-07", status: "proved" },
        { id: "RABI-08", status: "proved" },
      ],
      noMutationEvidenceCommandIds: [
        "phase258.service-and-engine",
        "phase258.database",
        "phase258.go.mixed-fails-closed",
        "phase258.full-engine-compatibility",
      ],
    })
    expect(validation.gates).toHaveLength(7)
    expect(validation.limitations).toEqual([
      "phase259-four-language-full-state-event-memory-objective-and-failure-trace-conformance-required",
      "production-trusted-producers-empty",
      "counted-runtime-lanes-empty",
    ])
    const json = renderV137RuntimeAbiValidationJson(validation)
    const markdown = renderV137RuntimeAbiValidationMarkdown(validation)
    expect(JSON.parse(json)).toEqual(validation)
    expect(markdown).toContain("# v1.37 Runtime ABI Validation")
    expect(markdown).toContain("19 exact commands")
    for (const output of [json, markdown]) {
      expect(output).not.toMatch(
        /DATABASE_URL|postgres(?:ql)?:|BEGIN PRIVATE KEY|\/Users\//u,
      )
      expect(output).not.toContain("artifactBytes")
      expect(output).not.toContain("strategyMemory")
      expect(output).not.toContain("objectivePayload")
    }
  }, 20_000)

  it("summarizes only exact PASS/not-SKIP receipt rows", () => {
    const receipt = {
      schemaVersion: "runtime-abi-v1.17-test-receipt-v1" as const,
      activationPlan: "258-14" as const,
      stage: "postactivation" as const,
      testManifestSha256: `sha256:${"c".repeat(64)}` as const,
      selectedCommandCount: 2,
      results: [
        {
          id: "phase258.service-and-engine",
          stage: "preactivation" as const,
          kind: "vitest" as const,
          namedResult: "service-and-engine",
          ownedFiles: ["service.test.ts"],
          status: "PASS" as const,
          passedCount: 102,
          skippedCount: 0 as const,
          databaseRequired: false,
          databaseObserved: false,
        },
        {
          id: "phase258.database",
          stage: "preactivation" as const,
          kind: "vitest" as const,
          namedResult: "database",
          ownedFiles: ["database.test.ts"],
          status: "PASS" as const,
          passedCount: 63,
          skippedCount: 0 as const,
          databaseRequired: true,
          databaseObserved: true,
        },
      ],
    }
    expect(summarizeV137RuntimeAbiTestReceipt(receipt)).toEqual({
      stage: "postactivation",
      testManifestSha256: receipt.testManifestSha256,
      selectedCommandCount: 2,
      passedCount: 165,
      skippedCount: 0,
      databaseCommandCount: 1,
      passedCommandIds: ["phase258.service-and-engine", "phase258.database"],
    })
    expect(() =>
      summarizeV137RuntimeAbiTestReceipt({
        ...receipt,
        results: [
          { ...receipt.results[0]!, skippedCount: 1 as never },
          receipt.results[1]!,
        ],
      }),
    ).toThrow(/incomplete/u)
  })
})
