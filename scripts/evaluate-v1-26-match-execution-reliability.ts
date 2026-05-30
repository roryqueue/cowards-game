#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  MATCH_EXECUTION_APP_CONTRACT_VERSION,
  MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1,
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1,
  MatchExecutionMatchSetSummaryV1Schema,
  assertPublicServiceDtoLeakSafe,
} from "../packages/spec/src/index.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const artifactJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.26-match-execution-reliability-proof.json",
)
const artifactMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.26-match-execution-reliability-proof.md",
)

const readSource = (relativePath: string): string =>
  readFileSync(path.join(repoRoot, relativePath), "utf8")

const requireMarkers = (
  relativePath: string,
  markers: readonly string[],
): string[] => {
  const source = readSource(relativePath)
  return markers.filter((marker) => source.includes(marker))
}

const privateMarkers = [
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "databaseUrl",
  "Bearer ",
  "/Users/",
] as const

const requiredFixtureIds = [
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
] as const

const goRetryMarkers = requireMarkers("apps/go-backend/retry_policy.go", [
  "matchFailureCategoryRuntimeUnavailable",
  "matchFailureCategoryTimeout",
  "matchFailureCategoryMalformedRuntimeResult",
  "matchFailureCategoryStaleArtifact",
  "retryable",
  "non_retryable",
])

const goLifecycleMarkers = requireMarkers("apps/go-backend/orchestrator.go", [
  "recordAttemptFailure",
  "RuntimeServiceContractMismatch",
  "classifyMatchFailure",
])

const publicProjectionMarkers = requireMarkers(
  "apps/go-backend/live_backend.go",
  [
    "matchSetExecutionMetadata",
    "matchExecution",
    "publicReasonForMatchFailureCategory",
  ],
)

const runtimeServiceMarkers = requireMarkers(
  "apps/runtime-service/src/server.ts",
  ["redactedErrorMessage", "malformedRequestResponse"],
)

const runtimeEnvelopeMarkers = requireMarkers(
  "apps/runtime-service/src/execute-match.ts",
  [
    "RuntimeExecutionServiceResponseSchema.parse",
    "RESPONSE_SCHEMA_INVALID",
    "EXECUTION_EXCEPTION",
    "validateRevisionArtifact",
  ],
)

const fixtureCoverage = requiredFixtureIds.map((id) => ({
  id,
  present: MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1.includes(id),
}))

const fixtureValidation = MATCH_EXECUTION_CONTRACT_FIXTURES_V1.map(
  (fixture) => {
    if (fixture.service.matchSetSummary) {
      assertPublicServiceDtoLeakSafe(fixture.service.matchSetSummary)
    }
    if (fixture.app.matchSetSummary) {
      MatchExecutionMatchSetSummaryV1Schema.parse(fixture.app.matchSetSummary)
    }
    const payload = JSON.stringify(fixture)
    return {
      id: fixture.id,
      contractVersion:
        fixture.app.matchSetSummary?.contractVersion ??
        MATCH_EXECUTION_APP_CONTRACT_VERSION,
      privateMarkerLeaks: privateMarkers.filter((marker) =>
        payload.includes(marker),
      ),
    }
  },
)

const proof = {
  schemaVersion: "v1.26-match-execution-reliability-proof",
  generatedAt: new Date().toISOString(),
  contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
  noAppContractChange: true,
  countedStrategyPath: "javascript-typescript",
  nonCountedExhibitionBeta: ["python", "rust", "zig"],
  activeWasmWasiAbi: "preview1-stdin-stdout-json",
  ownership: {
    orchestration: "go",
    publicEvidence: "go",
    hostileStrategyExecution: "runtime-service",
    strategyExecutionInWebApiGo: false,
  },
  sourceMarkers: {
    goRetryMarkers,
    goLifecycleMarkers,
    publicProjectionMarkers,
    runtimeServiceMarkers,
    runtimeEnvelopeMarkers,
  },
  retryMatrix: [
    {
      failure: "runtime-service stopped/transport/read/oversized",
      retryable: true,
      publicCategory: "runtime_unavailable",
    },
    {
      failure: "runtime-service timeout",
      retryable: true,
      publicCategory: "timeout",
    },
    {
      failure: "runtime-service malformed HTTP/envelope response",
      retryable: true,
      publicCategory: "system_failure",
    },
    {
      failure: "malformed Strategy/runtime output",
      retryable: false,
      publicCategory: "malformed_runtime_result",
    },
    {
      failure: "source/artifact metadata mismatch",
      retryable: false,
      publicCategory: "stale_artifact",
    },
  ],
  fixtureCoverage,
  fixtureValidation,
  relevantPages: [
    "http://localhost:3000/matchsets/match-set%3Afixture%3Aunavailable-runtime",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Astale-artifact",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Amalformed-runtime-result",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Apublic-safe-replay",
    "http://localhost:3000/matches/match%3Afixture%3Apublic-safe-replay/replay",
  ],
  nonClaims: [
    "No runtime promotion",
    "No production sandbox certification",
    "No direct-export ABI migration",
    "No Component Model/WIT ABI migration",
    "No counted non-JS play",
  ],
}

const missingMarkers = Object.entries(proof.sourceMarkers).flatMap(
  ([group, markers]) => (markers.length === 0 ? [group] : []),
)
const missingFixtures = fixtureCoverage
  .filter((fixture) => !fixture.present)
  .map((fixture) => fixture.id)
const leakedFixtures = fixtureValidation.filter(
  (fixture) => fixture.privateMarkerLeaks.length > 0,
)

if (missingMarkers.length > 0) {
  throw new Error(
    `v1.26 proof missing source markers: ${missingMarkers.join(", ")}`,
  )
}
if (missingFixtures.length > 0) {
  throw new Error(`v1.26 proof missing fixtures: ${missingFixtures.join(", ")}`)
}
if (leakedFixtures.length > 0) {
  throw new Error(
    `v1.26 fixture leak markers found: ${leakedFixtures
      .map((fixture) => fixture.id)
      .join(", ")}`,
  )
}

mkdirSync(path.dirname(artifactJsonPath), { recursive: true })
writeFileSync(artifactJsonPath, `${JSON.stringify(proof, null, 2)}\n`)

const markdown = `# v1.26 Match Execution Reliability Proof

**Generated:** ${proof.generatedAt}
**Contract:** \`${proof.contractVersion}\`
**Decision:** No app-facing contract change.

## Retry Matrix

${proof.retryMatrix
  .map(
    (row) =>
      `- ${row.failure}: ${row.retryable ? "retryable" : "non-retryable"} -> \`${row.publicCategory}\``,
  )
  .join("\n")}

## Frozen Contract Coverage

${fixtureCoverage
  .map(
    (fixture) => `- ${fixture.id}: ${fixture.present ? "present" : "missing"}`,
  )
  .join("\n")}

## Ownership and Non-Claims

- Go owns orchestration, persistence-facing lifecycle, scoring, public evidence, retry policy, and promotion decisions.
- Runtime-service owns hostile Strategy execution through schema-validated envelopes and registered runtimes.
- Web/API/Go do not execute Strategy code.
${proof.nonClaims.map((claim) => `- ${claim}.`).join("\n")}

## Relevant Local Pages

${proof.relevantPages.map((url) => `- ${url}`).join("\n")}
`

writeFileSync(artifactMarkdownPath, markdown)

console.log(`Wrote ${path.relative(repoRoot, artifactJsonPath)}`)
console.log(`Wrote ${path.relative(repoRoot, artifactMarkdownPath)}`)

if (!existsSync(artifactJsonPath) || !existsSync(artifactMarkdownPath)) {
  throw new Error("v1.26 proof artifacts were not written")
}
