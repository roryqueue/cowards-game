#!/usr/bin/env -S pnpm exec tsx
/* eslint-disable no-restricted-imports -- repository-local maintenance command */
import {
  createFixtureMatchSetEvidenceResolver,
  resolveMatchSetExecutionEvidence,
} from "../packages/persistence/src/matchset-service.ts"
import { listAdvancedStrategies } from "../packages/persistence/src/advanced-strategies.ts"
import { buildStrategyRevision } from "../packages/runtime-js/src/index.ts"

const DEMO_EVALUATION_INSTANT = "2026-05-20T00:00:00.000Z"
const EXECUTION_UNAVAILABLE_CODE = "V15_DEMO_EXECUTION_UNAVAILABLE"

/**
 * The historical v1.5 demo used the retired TypeScript worker and then rewrote
 * fixture rows as counted. That is intentionally no longer executable. This
 * command now performs only a fixture-domain authority preflight and creates
 * zero rows until an authority-checked runtime service owns execution.
 */
const main = async (): Promise<void> => {
  if (process.env.COWARDS_V15_DEMO_FIXTURE_AUTHORITY !== "1") {
    throw new Error(
      "V15_DEMO_FIXTURE_AUTHORITY_REQUIRED: set COWARDS_V15_DEMO_FIXTURE_AUTHORITY=1 for the development-only evidence preflight",
    )
  }

  const revisions = listAdvancedStrategies()
    .slice(0, 8)
    .map((strategy) =>
      buildStrategyRevision({
        strategyId: `strategy:demo:v1-5:${strategy.id}`,
        source: strategy.source,
        metadata: {
          createdBy: `user:demo:v1-5:${strategy.id}`,
          label: strategy.name,
          notes: "Development-only v1.5 authority preflight; not persisted.",
        },
      }),
    )
  const evidence = await resolveMatchSetExecutionEvidence({
    resolver: createFixtureMatchSetEvidenceResolver(),
    purpose: "development",
    evaluationInstant: DEMO_EVALUATION_INSTANT,
    entrants: revisions.map((revision) => ({
      entrantKey: revision.id,
      strategyRevisionId: revision.id,
    })),
  })

  console.log(
    JSON.stringify(
      {
        status: "execution_unavailable",
        code: EXECUTION_UNAVAILABLE_CODE,
        fixtureOnly: true,
        rowsCreated: 0,
        semanticTupleId: evidence.compatibility.tupleId,
        authorityBundleHash: evidence.authorityBundleHash,
        entrantCount: Object.keys(evidence.executionEntrants).length,
        reason:
          "An authority-checked supported runtime service is required before execution or counted results.",
      },
      null,
      2,
    ),
  )
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
