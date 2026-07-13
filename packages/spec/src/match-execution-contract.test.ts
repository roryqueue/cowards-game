import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import {
  MATCH_EXECUTION_APP_CONTRACT_VERSION,
  MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1,
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1,
  MATCH_EXECUTION_FAILURE_CATEGORIES,
  MATCH_EXECUTION_LIFECYCLE_STATES,
  MatchExecutionExactEvidenceV137Schema,
  MatchExecutionMatchSetSummaryV1Schema,
  MatchExecutionReplayEvidenceV1Schema,
  MatchExecutionReplayMetadataV1Schema,
  assertPublicServiceDtoLeakSafe,
  createMatchExecutionExactEvidenceV137,
  parseMatchExecutionEvidenceByVersion,
  projectPublicMatchExecutionIntegrityEvidenceV137,
  publicMatchSetSummaryExample,
  publicReplayEvidenceExample,
  publicReplayMetadataExample,
  type PublicMatchSetSummaryServiceDto,
  type PublicReplayEvidenceServiceDto,
  type PublicReplayMetadataServiceDto,
  toMatchExecutionMatchSetSummaryV1,
  toMatchExecutionReplayEvidenceV1,
  toMatchExecutionReplayMetadataV1,
} from "./index.js"
import { CANONICAL_COMPATIBILITY_TUPLES } from "./integrity-authority.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)

const readGoFixture = (fileName: string): unknown =>
  JSON.parse(
    readFileSync(
      path.join(
        repoRoot,
        "apps/go-backend/testdata/service-fixtures",
        fileName,
      ),
      "utf8",
    ),
  )

const privateMarkers = [
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "privateRuntime",
  "databaseUrl",
  "Bearer ",
] as const

describe("match execution app contract v1", () => {
  it("persists one exact compatibility tuple and ordered heterogeneous entrant evidence pair", () => {
    const registered = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const lane = (side: "bottom" | "top", languageId: string) => ({
      providerId: `provider:${side}`,
      languageId,
      runtimeId: `runtime:${side}`,
      runtimeVersion: "1.0.0",
      toolchainId: `toolchain:${side}`,
      toolchainVersion: "1.0.0",
      adapterId: `adapter:${side}`,
      adapterVersion: "1.0.0",
      policyId: "package-none",
      policyVersion: "1.0.0",
      corpusId: "corpus:v1.37",
      corpusVersion: "1.0.0",
      artifactId: `artifact:${side}`,
      artifactSha256: `${side}:artifact:hash`,
      implementationId: `implementation:${side}`,
      buildId: `build:${side}`,
      semanticTupleId: registered.tupleId,
      semanticTuple: { ...registered.tuple },
    })
    const entrant = (side: "bottom" | "top", languageId: string) => ({
      entrantKey: `entrant:${side}`,
      strategyRevisionId: `strategy-revision:${side}`,
      laneIdentity: lane(side, languageId),
      containmentCertificateRef: {
        kind: "containment" as const,
        certificateId: `containment:${side}`,
        certificateVersion: "1.0.0",
        certificateRecordHash: `containment:${side}:hash`,
        registryGeneration: "registry-generation:1",
      },
      conformanceCertificateRef: {
        kind: "conformance" as const,
        certificateId: `conformance:${side}`,
        certificateVersion: "1.0.0",
        certificateRecordHash: `conformance:${side}:hash`,
        registryGeneration: "registry-generation:1",
      },
      schedulingDecision: {
        status: "counted" as const,
        reasonCode: "EVIDENCE_CURRENT" as const,
        evaluatedAt: "2026-07-13T00:00:00.000Z",
        freshUntil: "2026-08-13T00:00:00.000Z",
        registryGeneration: "registry-generation:1",
      },
    })
    const evidenceSnapshot = {
      compatibility: {
        tupleId: registered.tupleId,
        tuple: { ...registered.tuple },
      },
      authorityBundleHash: "authority-bundle-hash:v1",
      registryGeneration: "registry-generation:1",
      entrants: {
        bottom: entrant("bottom", "typescript"),
        top: entrant("top", "python"),
      },
    }

    const exact = createMatchExecutionExactEvidenceV137({
      matchId: "match:exact-evidence",
      bottomEntrantKey: "entrant:bottom",
      topEntrantKey: "entrant:top",
      evidenceSnapshot,
    })
    expect(MatchExecutionExactEvidenceV137Schema.parse(exact)).toEqual(exact)
    expect(exact.evidenceSnapshot.entrants.top.laneIdentity.languageId).toBe(
      "python",
    )
    expect(() =>
      createMatchExecutionExactEvidenceV137({
        matchId: "match:exact-evidence",
        bottomEntrantKey: "entrant:top",
        topEntrantKey: "entrant:bottom",
        evidenceSnapshot,
      }),
    ).toThrow(/ordered entrant evidence/i)

    const publicProjection =
      projectPublicMatchExecutionIntegrityEvidenceV137(exact)
    const publicBytes = JSON.stringify(publicProjection)
    expect(publicProjection.compatibility.tupleId).toBe(registered.tupleId)
    expect(publicBytes).not.toMatch(
      /toolchainId|artifactSha256|buildId|certificateId|strategyMemory|objective/i,
    )

    const {
      conformanceCertificateRef: _omittedConformance,
      ...bottomContainmentOnly
    } = evidenceSnapshot.entrants.bottom
    const exhibition = createMatchExecutionExactEvidenceV137({
      matchId: "match:exhibition-evidence",
      bottomEntrantKey: "entrant:bottom",
      topEntrantKey: "entrant:top",
      evidenceSnapshot: {
        ...evidenceSnapshot,
        entrants: {
          ...evidenceSnapshot.entrants,
          bottom: {
            ...bottomContainmentOnly,
            schedulingDecision: {
              ...bottomContainmentOnly.schedulingDecision,
              status: "exhibition_only",
              reasonCode: "CONFORMANCE_UNVERIFIABLE",
            },
          },
        },
      },
    })
    expect(
      projectPublicMatchExecutionIntegrityEvidenceV137(exhibition).entrants
        .bottom.evidence,
    ).toEqual([
      {
        kind: "containment",
        version: "1.0.0",
        hash: "containment:bottom:hash",
      },
    ])
    expect(
      MatchExecutionExactEvidenceV137Schema.safeParse({
        ...exhibition,
        evidenceSnapshot: {
          ...exhibition.evidenceSnapshot,
          entrants: {
            ...exhibition.evidenceSnapshot.entrants,
            bottom: {
              ...exhibition.evidenceSnapshot.entrants.bottom,
              schedulingDecision: {
                ...exhibition.evidenceSnapshot.entrants.bottom
                  .schedulingDecision,
                status: "counted",
                reasonCode: "EVIDENCE_CURRENT",
              },
            },
          },
        },
      }).success,
    ).toBe(false)

    const historical = {
      profile: "historical-v1.4" as const,
      matchId: "match:historical-v1.4",
      rulesVersion: "cowards-rules-v1.4",
      chronicleVersion: "chronicle-v1.4",
      originalCountedStatus: "counted" as const,
    }
    const before = JSON.stringify(historical)
    expect(parseMatchExecutionEvidenceByVersion(historical)).toMatchObject({
      classification: "historical_original_semantics",
    })
    expect(JSON.stringify(historical)).toBe(before)
  })
  it("freezes lifecycle vocabulary and retryability as evidence fields", () => {
    expect(MATCH_EXECUTION_APP_CONTRACT_VERSION).toBe("match-execution-app-v1")
    expect(MATCH_EXECUTION_LIFECYCLE_STATES).toEqual([
      "queued",
      "accepted",
      "running",
      "complete",
      "failed",
      "degraded",
      "unavailable",
    ])
    expect(MATCH_EXECUTION_FAILURE_CATEGORIES).toContain("timeout")
    expect(MATCH_EXECUTION_FAILURE_CATEGORIES).toContain("stale_artifact")
  })

  it("projects current public service DTOs into app-facing DTO v1", () => {
    const summary = toMatchExecutionMatchSetSummaryV1(
      publicMatchSetSummaryExample as PublicMatchSetSummaryServiceDto,
    )
    const replayMetadata = toMatchExecutionReplayMetadataV1(
      publicReplayMetadataExample as PublicReplayMetadataServiceDto,
    )
    const replayEvidence = toMatchExecutionReplayEvidenceV1(
      publicReplayEvidenceExample as PublicReplayEvidenceServiceDto,
    )

    expect(() =>
      MatchExecutionMatchSetSummaryV1Schema.parse(summary),
    ).not.toThrow()
    expect(() =>
      MatchExecutionReplayMetadataV1Schema.parse(replayMetadata),
    ).not.toThrow()
    expect(() =>
      MatchExecutionReplayEvidenceV1Schema.parse(replayEvidence),
    ).not.toThrow()
    expect(summary.lifecycle.retryDisposition).toBe("not_applicable")
    expect(replayEvidence.lifecycle.replayAvailability).toBe("available")
  })

  it("commits complete fixture coverage for app and execution parallel work", () => {
    expect(MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1).toEqual([
      "complete",
      "running",
      "queued",
      "strategy-failure",
      "system-failure",
      "timeout",
      "unavailable-runtime",
      "malformed-runtime-result",
      "stale-artifact",
      "public-safe-replay",
    ])

    for (const fixture of MATCH_EXECUTION_CONTRACT_FIXTURES_V1) {
      expect(fixture.classification).toBe("public")
      if (fixture.service.matchSetSummary) {
        expect(() =>
          assertPublicServiceDtoLeakSafe(fixture.service.matchSetSummary),
        ).not.toThrow()
        expect(fixture.app.matchSetSummary?.contractVersion).toBe(
          MATCH_EXECUTION_APP_CONTRACT_VERSION,
        )
      }
    }
  })

  it("keeps public fixtures and app DTO schemas free of private markers", () => {
    const payload = JSON.stringify(MATCH_EXECUTION_CONTRACT_FIXTURES_V1)
    for (const marker of privateMarkers) {
      expect(payload).not.toContain(marker)
    }

    const schemaPayload = JSON.stringify(
      z.toJSONSchema(MatchExecutionMatchSetSummaryV1Schema),
    )
    for (const marker of privateMarkers) {
      expect(schemaPayload).not.toContain(marker)
    }
  })

  it("fails closed on unversioned or stale app DTO payloads", () => {
    expect(() =>
      MatchExecutionMatchSetSummaryV1Schema.parse({
        kind: "matchExecutionMatchSetSummary",
        matchSetId: "match-set:missing-version",
      }),
    ).toThrow()
    expect(() =>
      MatchExecutionMatchSetSummaryV1Schema.parse({
        ...MATCH_EXECUTION_CONTRACT_FIXTURES_V1[0]!.app.matchSetSummary,
        contractVersion: "match-execution-app-v0",
      }),
    ).toThrow()
  })

  it("projects committed Go public fixtures into the app contract", () => {
    for (const fileName of [
      "public-match-set-summary.json",
      "degraded-match-set-summary.json",
    ]) {
      const serviceDto = readGoFixture(fileName)
      const summary = toMatchExecutionMatchSetSummaryV1(
        serviceDto as PublicMatchSetSummaryServiceDto,
      )
      expect(() =>
        MatchExecutionMatchSetSummaryV1Schema.parse(summary),
      ).not.toThrow()
      expect(summary.privacy.ownerOrTestOnlyFieldsExcluded).toBe(true)
      expect(summary.runtimeEvidence.ownership.orchestration).toBe("go")
    }
    const replayMetadata = toMatchExecutionReplayMetadataV1(
      readGoFixture(
        "public-replay-metadata.json",
      ) as PublicReplayMetadataServiceDto,
    )
    const replayEvidence = toMatchExecutionReplayEvidenceV1(
      readGoFixture(
        "public-replay-evidence.json",
      ) as PublicReplayEvidenceServiceDto,
    )
    expect(() =>
      MatchExecutionReplayMetadataV1Schema.parse(replayMetadata),
    ).not.toThrow()
    expect(() =>
      MatchExecutionReplayEvidenceV1Schema.parse(replayEvidence),
    ).not.toThrow()
    expect(replayEvidence.privacy.ownerOrTestOnlyFieldsExcluded).toBe(true)
  })

  it("classifies blocked Match rows as non-retryable blocked evidence", () => {
    const blocked = MATCH_EXECUTION_CONTRACT_FIXTURES_V1.find(
      (fixture) => fixture.id === "stale-artifact",
    )?.app.matchSetSummary
    expect(blocked?.lifecycle.failureCategory).toBe("stale_artifact")
    expect(blocked?.matches[0]?.failureEvidence?.category).toBe("blocked")
    expect(blocked?.matches[0]?.lifecycle.retryDisposition).toBe(
      "non_retryable",
    )
  })
})
