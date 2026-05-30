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
  MatchExecutionMatchSetSummaryV1Schema,
  MatchExecutionReplayEvidenceV1Schema,
  MatchExecutionReplayMetadataV1Schema,
  assertPublicServiceDtoLeakSafe,
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
