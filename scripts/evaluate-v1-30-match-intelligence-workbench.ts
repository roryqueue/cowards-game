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
  toMatchExecutionMatchSetSummaryV1,
  type PublicMatchSetSummaryServiceDto,
} from "../packages/spec/src/index.ts"
import { getCanonicalReplayScenarioIds } from "../packages/test-utils/src/index.ts"
import { createReplayFixtureData } from "../apps/web/app/matches/replay-fixture.ts"
import { createMatchExecutionFixturePublicReadClient } from "../apps/web/lib/match-execution-fixture-adapter.ts"
import type { PublicReadMatchSetResultDto } from "../apps/web/lib/public-service-boundary.ts"
import {
  buildReplayIntelligenceViewModel,
  buildResultIntelligenceViewModel,
} from "../apps/web/app/match-intelligence.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const artifactJsonPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.30-match-intelligence-workbench-proof.json",
)
const artifactMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.30-match-intelligence-workbench-proof.md",
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

const readResult = (
  summary: PublicMatchSetSummaryServiceDto,
): PublicReadMatchSetResultDto => {
  const result = summary.result
  const contract = toMatchExecutionMatchSetSummaryV1(summary)
  const entrantById = new Map(
    result.entrants.map((entrant) => [entrant.entrantId, entrant]),
  )
  return {
    ...result,
    contract,
    lifecycle: contract.lifecycle,
    currentUser: null,
    entrants: result.entrants.map((entrant) => ({
      ...entrant,
      shortHash: entrant.sourceHash.slice(0, 10),
      isOwner: false,
    })),
    matches: result.matches.map((match) => ({
      ...match,
      bottomLabel:
        entrantById.get(match.entrants.bottom)?.displayLabel ??
        match.entrants.bottom,
      topLabel:
        entrantById.get(match.entrants.top)?.displayLabel ?? match.entrants.top,
      ...(match.replayAvailable
        ? { replayHref: `/matches/${encodeURIComponent(match.matchId)}/replay` }
        : {}),
    })),
  }
}

const publicReadClient = createMatchExecutionFixturePublicReadClient({
  NODE_ENV: "test",
})

if (!publicReadClient) {
  throw new Error("v1.30 fixture public read client was not enabled")
}

const resultCoverage = await Promise.all(
  targetResultFixtureIds.map(async (fixtureId) => {
    const summary = await publicReadClient.getPublicMatchSetSummary(
      `match-set:fixture:${fixtureId}`,
    )
    if (!summary) {
      throw new Error(`missing v1.30 public fixture ${fixtureId}`)
    }
    const model = buildResultIntelligenceViewModel(readResult(summary), [
      "JS/TS - counted eligible",
    ])
    return {
      id: fixtureId,
      availability: model.availability,
      confidence: model.confidence,
      comparisonRows: model.comparisonRows.length,
      jumpTargets: model.jumpTargets.length,
      privateMarkerLeakCount: publicLeakCount(model),
    }
  }),
)

const replayCoverage = getCanonicalReplayScenarioIds().map((scenarioId) => {
  const data = createReplayFixtureData({ scenarioId })
  if (data.status !== "ready") {
    throw new Error(`canonical replay scenario ${scenarioId} is not ready`)
  }
  const model = buildReplayIntelligenceViewModel(data)
  const boardRealism = data.states.every((state) => {
    const { bounds, soldiers, terrainStones } = state.board
    const inBounds = (point: { x: number; y: number }) =>
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY
    return (
      soldiers.every((soldier) =>
        soldier.status === "FALLEN"
          ? soldier.position === null
          : soldier.position !== null && inBounds(soldier.position),
      ) && terrainStones.every(inBounds)
    )
  })
  return {
    id: scenarioId,
    annotations: model.annotations.length,
    tacticalPanels: model.panels.length,
    soldiers: model.soldiers.length,
    boardRealism,
    privateMarkerLeakCount: publicLeakCount(model),
  }
})

const unavailableReplayCoverage = [
  buildReplayIntelligenceViewModel({
    status: "unavailable",
    matchId: "match:fixture:missing-chronicle",
    reason: "missing-chronicle",
    message: "Replay unavailable: missing-chronicle public state.",
  }),
  buildReplayIntelligenceViewModel({
    status: "unavailable",
    matchId: "match:fixture:no-result",
    reason: "no-result",
    message: "Replay unavailable: no-result public state.",
  }),
].map((model) => ({
  availability: model.availability,
  confidence: model.confidence,
  emptyTacticalOutput:
    model.annotations.length === 0 &&
    model.soldiers.length === 0 &&
    model.panels.length === 0,
  privateMarkerLeakCount: publicLeakCount(model),
}))

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
  schemaVersion: "v1.30-match-intelligence-workbench-proof",
  milestone: "v1.30",
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
  replayCoverage,
  unavailableReplayCoverage,
  dtoFieldShapes,
  privacyScan: {
    scannedPublicPayloads:
      resultCoverage.length +
      replayCoverage.length +
      unavailableReplayCoverage.length,
    privateMarkerLeakCount:
      resultCoverage.reduce(
        (total, fixture) => total + fixture.privateMarkerLeakCount,
        0,
      ) +
      replayCoverage.reduce(
        (total, fixture) => total + fixture.privateMarkerLeakCount,
        0,
      ) +
      unavailableReplayCoverage.reduce(
        (total, fixture) => total + fixture.privateMarkerLeakCount,
        0,
      ),
  },
  proofArtifacts: [
    "apps/web/app/match-intelligence.ts",
    "apps/web/app/match-intelligence.test.ts",
    "apps/web/e2e/v1-30-match-intelligence-workbench.spec.ts",
    "apps/web/e2e/replay.visual.spec.ts",
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
    "http://localhost:3000/matches/match%3Ae2e-replay-fixture/replay",
    "http://localhost:3000/matches/match%3Ae2e-replay-fixture%3Acompound-tour/replay",
    "http://localhost:3000/matches/match%3Ae2e-replay-fixture%3Apush/replay",
    "http://localhost:3000/matches/match%3Ae2e-replay-fixture%3Afall/replay",
    "http://localhost:3000/matches/match%3Afixture%3Amissing-chronicle/replay",
    "http://localhost:3000/matches/match%3Afixture%3Ano-result/replay",
  ],
  nonClaims: [
    "No match-execution-app-v1 change",
    "No public execution DTO fields added",
    "No runtime promotion",
    "No production sandbox certification",
    "No execution ABI migration",
    "No counted non-JS play",
    "No AI coach or live model inference",
    "No Strategy code execution in web, API, or Go",
  ],
}

assertPublicOutputLeakSafe(artifact)

if (artifact.publicContractChanged || artifact.newPublicExecutionDtoFields) {
  throw new Error("v1.30 proof detected public execution contract drift")
}
if (artifact.privacyScan.privateMarkerLeakCount !== 0) {
  throw new Error("v1.30 proof detected private marker leaks")
}
if (replayCoverage.some((entry) => !entry.boardRealism)) {
  throw new Error("v1.30 replay board realism check failed")
}
if (unavailableReplayCoverage.some((entry) => !entry.emptyTacticalOutput)) {
  throw new Error("v1.30 unavailable replay output invented tactical analysis")
}

const markdown = `# v1.30 Match Intelligence Workbench Proof

- Contract version: ${artifact.contractVersion}
- Public contract changed: ${artifact.publicContractChanged}
- New public execution DTO fields: ${artifact.newPublicExecutionDtoFields}
- Public payload privacy leaks: ${artifact.privacyScan.privateMarkerLeakCount}
- Replay scenarios checked: ${artifact.replayCoverage.length}

## Result Intelligence Coverage

${artifact.resultCoverage
  .map(
    (fixture) =>
      `- ${fixture.id}: ${fixture.availability}; confidence ${fixture.confidence}; comparison rows ${fixture.comparisonRows}; jump targets ${fixture.jumpTargets}`,
  )
  .join("\n")}

## Replay Intelligence Coverage

${artifact.replayCoverage
  .map(
    (entry) =>
      `- ${entry.id}: ${entry.annotations} annotations; ${entry.tacticalPanels} tactical panels; ${entry.soldiers} Soldiers; board realism ${entry.boardRealism}`,
  )
  .join("\n")}

## Unavailable Replay Coverage

${artifact.unavailableReplayCoverage
  .map(
    (entry) =>
      `- ${entry.availability}: confidence ${entry.confidence}; empty tactical output ${entry.emptyTacticalOutput}`,
  )
  .join("\n")}

## Non-Claims

${artifact.nonClaims.map((claim) => `- ${claim}`).join("\n")}
`

assertPublicOutputLeakSafe(markdown, "v1.30 match intelligence markdown")

if (!existsSync(path.dirname(artifactJsonPath))) {
  mkdirSync(path.dirname(artifactJsonPath), { recursive: true })
}

const checkOnly = process.argv.includes("--check")
if (checkOnly) {
  if (!existsSync(artifactJsonPath) || !existsSync(artifactMarkdownPath)) {
    throw new Error("v1.30 match intelligence proof artifacts are missing")
  }
  const existingJson = JSON.parse(readFileSync(artifactJsonPath, "utf8"))
  if (
    JSON.stringify(existingJson, null, 2) !== JSON.stringify(artifact, null, 2)
  ) {
    throw new Error("v1.30 match intelligence proof JSON is stale")
  }
  const existingMarkdown = readFileSync(artifactMarkdownPath, "utf8")
  if (existingMarkdown !== markdown) {
    throw new Error("v1.30 match intelligence proof markdown is stale")
  }
} else {
  writeFileSync(artifactJsonPath, `${JSON.stringify(artifact, null, 2)}\n`)
  writeFileSync(artifactMarkdownPath, markdown)
}

console.log(
  `v1.30 match intelligence proof passed: ${artifact.resultCoverage.length} result fixtures, ${artifact.replayCoverage.length} replay scenarios, no contract drift`,
)
