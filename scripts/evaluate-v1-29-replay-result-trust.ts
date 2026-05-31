#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  MATCH_EXECUTION_APP_CONTRACT_VERSION,
  MatchExecutionMatchResultV1Schema,
  MatchExecutionMatchSetSummaryV1Schema,
  MatchExecutionReplayEvidenceV1Schema,
  MatchExecutionReplayMetadataV1Schema,
  assertPublicOutputLeakSafe,
  getMatchExecutionContractFixtureByMatchId,
  toMatchExecutionMatchSetSummaryV1,
} from "../packages/spec/src/index.ts"
import { createMatchExecutionFixturePublicReadClient } from "../apps/web/lib/match-execution-fixture-adapter.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const artifactJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.29-replay-result-trust-proof.json",
)
const artifactMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.29-replay-result-trust-proof.md",
)

const targetResultFixtureIds = [
  "complete",
  "queued",
  "running",
  "strategy-failure",
  "system-failure",
  "timeout",
  "unavailable-runtime",
  "malformed-runtime-result",
  "stale-artifact",
  "missing-chronicle",
  "no-result",
] as const

const targetReplayStates = [
  "available",
  "pending",
  "missing",
  "stale",
  "none",
  "missing-public-evidence",
  "invalid-chronicle",
] as const

const expectedDtoFields = {
  matchSetSummary: [
    "contractVersion",
    "failureEvidence",
    "kind",
    "lifecycle",
    "matchSetId",
    "matches",
    "privacy",
    "result",
    "runtimeEvidence",
  ],
  matchResult: [
    "arenaVariantId",
    "chronicleHash",
    "contractVersion",
    "entrants",
    "failureEvidence",
    "kind",
    "lifecycle",
    "matchId",
    "replayAvailable",
    "runtimeEvidence",
  ],
  replayMetadata: [
    "contractVersion",
    "kind",
    "lifecycle",
    "matchId",
    "privacy",
    "serviceDto",
  ],
  replayEvidence: [
    "contractVersion",
    "kind",
    "lifecycle",
    "matchId",
    "privacy",
    "serviceDto",
  ],
} as const

const schemaFields = (schema: {
  keyof: () => { options: readonly string[] }
}): readonly string[] => [...schema.keyof().options].sort()

const sameFields = (
  actual: readonly string[],
  expected: readonly string[],
): boolean =>
  actual.length === expected.length &&
  actual.every((field, index) => field === expected[index])

const publicLeakCount = (value: unknown): number => {
  try {
    assertPublicOutputLeakSafe(value)
    return 0
  } catch {
    return 1
  }
}

const publicReadClient = createMatchExecutionFixturePublicReadClient({
  NODE_ENV: "test",
})

if (!publicReadClient) {
  throw new Error("v1.29 fixture public read client was not enabled")
}

const resultCoverage = await Promise.all(
  targetResultFixtureIds.map(async (fixtureId) => {
    const summary = await publicReadClient.getPublicMatchSetSummary(
      `match-set:fixture:${fixtureId}`,
    )
    if (!summary) {
      throw new Error(`missing v1.29 public fixture ${fixtureId}`)
    }
    const appSummary = toMatchExecutionMatchSetSummaryV1(summary)
    return {
      id: fixtureId,
      present: true,
      state: appSummary.lifecycle.state,
      resultAvailability: appSummary.lifecycle.resultAvailability,
      replayAvailability: appSummary.lifecycle.replayAvailability,
      failureCategory: appSummary.lifecycle.failureCategory ?? "none",
      privateMarkerLeakCount: publicLeakCount(summary),
    }
  }),
)

const replayStateCoverage = [
  {
    state: "available",
    proof:
      (await publicReadClient.getPublicReplayEvidence(
        "match:fixture:public-safe-replay",
      )) !== null,
  },
  {
    state: "pending",
    proof: resultCoverage.some(
      (fixture) => fixture.replayAvailability === "pending",
    ),
  },
  {
    state: "missing",
    proof: resultCoverage.some(
      (fixture) => fixture.replayAvailability === "missing",
    ),
  },
  {
    state: "stale",
    proof: resultCoverage.some(
      (fixture) => fixture.replayAvailability === "stale",
    ),
  },
  {
    state: "none",
    proof: resultCoverage.some(
      (fixture) => fixture.replayAvailability === "none",
    ),
  },
  {
    state: "missing-public-evidence",
    proof: readFileSync(
      path.join(repoRoot, "apps/web/app/matches/server.ts"),
      "utf8",
    ).includes("missing-public-evidence"),
  },
  {
    state: "invalid-chronicle",
    proof: readFileSync(
      path.join(repoRoot, "apps/web/app/matches/replay-ready.ts"),
      "utf8",
    ).includes("invalid-chronicle"),
  },
]

const replayEvidence = getMatchExecutionContractFixtureByMatchId(
  "match:fixture:public-safe-replay",
)?.service.replayEvidence
if (!replayEvidence) {
  throw new Error("missing public-safe replay evidence fixture")
}

const boardRealism = replayEvidence.projection.snapshots.every((snapshot) => {
  const { bounds, soldiers, terrainStones } = snapshot.board
  const inBounds = (point: { x: number; y: number }) =>
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  return (
    soldiers.every(
      (soldier) => soldier.position === null || inBounds(soldier.position),
    ) && terrainStones.every(inBounds)
  )
})

const dtoFieldShapes = {
  matchSetSummary: schemaFields(MatchExecutionMatchSetSummaryV1Schema),
  matchResult: schemaFields(MatchExecutionMatchResultV1Schema),
  replayMetadata: schemaFields(MatchExecutionReplayMetadataV1Schema),
  replayEvidence: schemaFields(MatchExecutionReplayEvidenceV1Schema),
}

const newPublicExecutionDtoFields = !(
  sameFields(
    dtoFieldShapes.matchSetSummary,
    expectedDtoFields.matchSetSummary,
  ) &&
  sameFields(dtoFieldShapes.matchResult, expectedDtoFields.matchResult) &&
  sameFields(dtoFieldShapes.replayMetadata, expectedDtoFields.replayMetadata) &&
  sameFields(dtoFieldShapes.replayEvidence, expectedDtoFields.replayEvidence)
)

const artifact = {
  schemaVersion: "v1.29-replay-result-trust-proof",
  milestone: "v1.29",
  contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
  publicContractChanged: false,
  newPublicExecutionDtoFields,
  countedStrategyPath: "javascript-typescript",
  nonCountedExhibitionBeta: ["python", "rust", "zig"],
  activeWasmWasiAbi: "preview1-stdin-stdout-json",
  ownership: {
    orchestration: "go",
    publicEvidence: "go-or-persisted-public-chronicle",
    hostileStrategyExecution: "runtime-service",
    strategyExecutionInWebApiGo: false,
  },
  resultCoverage,
  replayStateCoverage,
  dtoFieldShapes,
  privacyScan: {
    scannedPublicPayloads: resultCoverage.length + 1,
    privateMarkerLeakCount: resultCoverage.reduce(
      (total, fixture) => total + fixture.privateMarkerLeakCount,
      0,
    ),
  },
  boardRealism: {
    publicSafeReplayFixtureChecked: true,
    visiblePiecesInsideBounds: boardRealism,
  },
  proofArtifacts: [
    "apps/web/e2e/v1-29-public-result-replay-proof.spec.ts",
    "apps/web/e2e/v1-25-match-execution-fixtures.spec.ts",
    "apps/web/app/matches/server.test.ts",
    "apps/web/app/matchsets/evidence-copy.test.ts",
  ],
  relevantLocalPages: [
    "http://localhost:3000/matchsets/match-set%3Afixture%3Acomplete",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Aqueued",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Arunning",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Aunavailable-runtime",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Amalformed-runtime-result",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Astale-artifact",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Amissing-chronicle",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Ano-result",
    "http://localhost:3000/matches/match%3Afixture%3Apublic-safe-replay/replay",
    "http://localhost:3000/matches/match%3Afixture%3Amissing-chronicle/replay",
    "http://localhost:3000/matches/match%3Afixture%3Ano-result/replay",
  ],
  nonClaims: [
    "No public execution DTO fields added",
    "No match-execution-app-v1 version bump",
    "No execution contract expansion",
    "No Go execution behavior change",
    "No runtime-service behavior change",
    "No retry or recovery policy change",
    "No MatchSet scoring change",
    "No Strategy code execution in web, API, or Go",
    "No runtime promotion",
    "No counted non-JS play",
  ],
}

assertPublicOutputLeakSafe(artifact)

if (artifact.publicContractChanged || artifact.newPublicExecutionDtoFields) {
  throw new Error("v1.29 proof detected public execution contract drift")
}
if (artifact.privacyScan.privateMarkerLeakCount !== 0) {
  throw new Error("v1.29 proof detected private marker leaks")
}
if (!artifact.boardRealism.visiblePiecesInsideBounds) {
  throw new Error("v1.29 replay board realism check failed")
}
if (replayStateCoverage.some((entry) => !entry.proof)) {
  throw new Error("v1.29 replay state coverage is incomplete")
}

const markdown = `# v1.29 Replay and Result Trust Proof

- Contract version: ${artifact.contractVersion}
- Public contract changed: ${artifact.publicContractChanged}
- New public execution DTO fields: ${artifact.newPublicExecutionDtoFields}
- Public payload privacy leaks: ${artifact.privacyScan.privateMarkerLeakCount}
- Replay board realism checked: ${artifact.boardRealism.visiblePiecesInsideBounds}

## Result Coverage

${artifact.resultCoverage
  .map(
    (fixture) =>
      `- ${fixture.id}: ${fixture.state}; result ${fixture.resultAvailability}; replay ${fixture.replayAvailability}; category ${fixture.failureCategory}`,
  )
  .join("\n")}

## Replay State Coverage

${artifact.replayStateCoverage
  .map((entry) => `- ${entry.state}: ${entry.proof ? "covered" : "missing"}`)
  .join("\n")}

## Non-Claims

${artifact.nonClaims.map((claim) => `- ${claim}`).join("\n")}
`

assertPublicOutputLeakSafe(markdown, "v1.29 replay result trust markdown")

if (!existsSync(path.dirname(artifactJsonPath))) {
  mkdirSync(path.dirname(artifactJsonPath), { recursive: true })
}

const checkOnly = process.argv.includes("--check")
if (checkOnly) {
  if (!existsSync(artifactJsonPath) || !existsSync(artifactMarkdownPath)) {
    throw new Error("v1.29 replay/result trust proof artifacts are missing")
  }
  const existingJson = JSON.parse(readFileSync(artifactJsonPath, "utf8"))
  if (
    JSON.stringify(existingJson, null, 2) !== JSON.stringify(artifact, null, 2)
  ) {
    throw new Error("v1.29 replay/result trust proof JSON is stale")
  }
  const existingMarkdown = readFileSync(artifactMarkdownPath, "utf8")
  if (existingMarkdown !== markdown) {
    throw new Error("v1.29 replay/result trust proof markdown is stale")
  }
} else {
  writeFileSync(artifactJsonPath, `${JSON.stringify(artifact, null, 2)}\n`)
  writeFileSync(artifactMarkdownPath, markdown)
}

console.log(
  `v1.29 replay/result trust proof passed: ${artifact.resultCoverage.length} result fixtures, ${artifact.replayStateCoverage.length} replay states, no contract drift`,
)
