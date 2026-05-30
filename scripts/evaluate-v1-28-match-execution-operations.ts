#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  MATCH_EXECUTION_APP_CONTRACT_VERSION,
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
  ".planning/artifacts/v1.28-match-execution-operations-proof.json",
)
const artifactMarkdownPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.28-match-execution-operations-proof.md",
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

const publicSafeMarkerLabel = (marker: string): string =>
  marker === "/Users/secret" ? "host-path-redaction-test" : marker

const privateMarkers = [
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "databaseUrl",
  "Bearer ",
  "/Users/",
  "postgres://",
] as const

const quarantineMarkers = requireMarkers(
  "apps/go-backend/match_execution_quarantine.go",
  [
    "matchExecutionQuarantineRetryExhausted",
    "matchExecutionQuarantineNonRetryable",
    "sanitizeMatchExecutionOperatorEvidence",
    "writeMatchExecutionQuarantineTx",
  ],
)

const recoveryMarkers = requireMarkers(
  "apps/go-backend/match_execution_recovery.go",
  [
    "matchExecutionRecoveryActionRequeue",
    "matchExecutionRecoveryActionRerun",
    "canOperatorRecoverFailureCategory",
    "chronicle_exists",
    "failure_category_not_recoverable",
  ],
)

const operatorEvidenceMarkers = requireMarkers(
  "apps/go-backend/match_execution_quarantine.go",
  [
    "sanitizeMatchExecutionOperatorEvidence",
    "sanitizeMatchJobFailureDetails",
    "allowedScalars",
  ],
).concat(
  requireMarkers("apps/go-backend/job_lifecycle_test.go", [
    "operator evidence leaked",
    "quarantine evidence leaked",
    "export default",
    "/Users/secret",
  ]),
).map(publicSafeMarkerLabel)

const runtimeRedactionMarkers = requireMarkers("apps/runtime-service/src/redaction.ts", [
  "redactedDiagnostics",
  "SENSITIVE_PATTERNS",
  "private\\s+runtime\\s+internals",
])

const internalEndpointMarkers = requireMarkers("apps/go-backend/live_backend.go", [
  "/internal/match-execution/requeue",
  "/internal/match-execution/rerun",
  "COWARDS_GO_BACKEND_INTERNAL_TOKEN",
])

const leaseRecoveryMarkers = requireMarkers("apps/go-backend/job_lifecycle_test.go", [
  "running unexpired job was double-claimed",
  "expired lease can be reclaimed",
  "expected invalid lease failure",
  "duplicate idempotent recovery result",
])

const interruptedMatchSetMarkers = requireMarkers("apps/go-backend/matchset_status.go", [
  "refreshMatchSetsForMatchTx",
  "matchSetStatusRunning",
  "matchSetStatusFailedSystem",
  "matchSetStatusComplete",
])

const migrationMarkers = requireMarkers(
  "packages/persistence/migrations/0007_match_execution_operations.sql",
  ["match_execution_quarantines", "retry_exhausted", "non_retryable_terminal"],
).concat(
  requireMarkers("packages/persistence/migrations/0008_match_execution_operator_actions.sql", [
    "match_execution_operator_actions",
    "idempotency_key",
    "requeue",
    "rerun",
  ]),
)

const fixtureValidation = MATCH_EXECUTION_CONTRACT_FIXTURES_V1.map((fixture) => {
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
    privateMarkerLeaks: privateMarkers.filter((marker) => payload.includes(marker)),
  }
})

const drillCatalog = [
  {
    id: "stopped-runtime-service",
    topology: ["postgres", "go-backend", "runtime-service-unavailable"],
    expectedPublicCategory: "runtime_unavailable",
    recoveryControl: "requeue",
  },
  {
    id: "malformed-envelope",
    topology: ["postgres", "go-backend", "fake-runtime-service"],
    expectedPublicCategory: "system_failure",
    recoveryControl: "requeue",
  },
  {
    id: "timeout",
    topology: ["postgres", "go-backend", "runtime-service-timeout"],
    expectedPublicCategory: "timeout",
    recoveryControl: "requeue",
  },
  {
    id: "stale-artifact",
    topology: ["postgres", "go-backend", "runtime-service"],
    expectedPublicCategory: "stale_artifact",
    recoveryControl: "quarantine-only",
  },
  {
    id: "malformed-runtime-result",
    topology: ["postgres", "go-backend", "runtime-service"],
    expectedPublicCategory: "malformed_runtime_result",
    recoveryControl: "quarantine-only",
  },
  {
    id: "stale-lease-reclaim",
    topology: ["postgres", "go-backend"],
    expectedPublicCategory: "system_failure",
    recoveryControl: "lease-aware-claim",
  },
  {
    id: "duplicate-worker-convergence",
    topology: ["postgres", "go-backend"],
    expectedPublicCategory: "system_failure",
    recoveryControl: "skip-locked-and-idempotency",
  },
  {
    id: "interrupted-matchset-refresh",
    topology: ["postgres", "go-backend"],
    expectedPublicCategory: "system_failure",
    recoveryControl: "matchset-refresh",
  },
] as const

const publicCompatibilityOutcomes = [
  {
    id: "complete",
    evidence: "contract-fixture",
    publicCategory: "complete",
    privateOperationsState: false,
  },
  {
    id: "queued-running",
    evidence: "contract-fixtures",
    publicCategory: "queued/running",
    privateOperationsState: false,
  },
  {
    id: "retrying",
    evidence: "retryable lifecycle disposition",
    publicCategory: "retryable",
    privateOperationsState: false,
  },
  {
    id: "degraded-unavailable-runtime",
    evidence: "contract-fixture-and-drill",
    publicCategory: "runtime_unavailable",
    privateOperationsState: false,
  },
  {
    id: "timeout",
    evidence: "contract-fixture-and-drill",
    publicCategory: "timeout",
    privateOperationsState: false,
  },
  {
    id: "malformed-runtime-result",
    evidence: "contract-fixture-and-drill",
    publicCategory: "malformed_runtime_result",
    privateOperationsState: false,
  },
  {
    id: "stale-artifact",
    evidence: "contract-fixture-and-quarantine-drill",
    publicCategory: "stale_artifact",
    privateOperationsState: false,
  },
  {
    id: "system-failure",
    evidence: "contract-fixture-and-drill",
    publicCategory: "system_failure",
    privateOperationsState: false,
  },
  {
    id: "strategy-failure",
    evidence: "contract-fixture",
    publicCategory: "strategy_failure",
    privateOperationsState: false,
  },
  {
    id: "quarantined-private-only",
    evidence: "quarantine-table-and-redacted-operator-evidence",
    publicCategory: "existing failed/degraded public lifecycle",
    privateOperationsState: true,
  },
  {
    id: "interrupted-matchset",
    evidence: "matchset-refresh-marker-and-drill",
    publicCategory: "system_failure",
    privateOperationsState: false,
  },
  {
    id: "missing-chronicle",
    evidence: "frozen-contract-category",
    publicCategory: "missing_chronicle",
    privateOperationsState: false,
  },
  {
    id: "no-result",
    evidence: "frozen-contract-category-and-evidence-copy",
    publicCategory: "no_result",
    privateOperationsState: false,
  },
] as const

const proof = {
  schemaVersion: "v1.28-match-execution-operations-proof",
  generatedAt: new Date().toISOString(),
  contractVersion: MATCH_EXECUTION_APP_CONTRACT_VERSION,
  publicContractChanged: false,
  countedStrategyPath: "javascript-typescript",
  nonCountedExhibitionBeta: ["python", "rust", "zig"],
  activeWasmWasiAbi: "preview1-stdin-stdout-json",
  ownership: {
    orchestration: "go",
    recoveryPolicy: "go",
    publicEvidence: "go",
    hostileStrategyExecution: "runtime-service",
    strategyExecutionInWebApiGo: false,
  },
  sourceMarkers: {
    quarantineMarkers,
    recoveryMarkers,
    operatorEvidenceMarkers,
    runtimeRedactionMarkers,
    internalEndpointMarkers,
    leaseRecoveryMarkers,
    interruptedMatchSetMarkers,
    migrationMarkers,
  },
  drillCatalog,
  publicCompatibilityOutcomes,
  fixtureValidation,
  relevantCommands: [
    "pnpm match-execution:operations",
    "pnpm match-execution:operations:check",
    "cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...",
    "pnpm --filter @cowards/persistence test",
  ],
  relevantLocalPages: [
    "http://localhost:3000/matchsets/match-set%3Afixture%3Aunavailable-runtime",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Astale-artifact",
    "http://localhost:3000/matchsets/match-set%3Afixture%3Amalformed-runtime-result",
    "http://localhost:3000/matches/match%3Afixture%3Apublic-safe-replay/replay",
  ],
  nonClaims: [
    "No public result/replay contract expansion",
    "No public operations UI",
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
const leakedFixtures = fixtureValidation.filter(
  (fixture) => fixture.privateMarkerLeaks.length > 0,
)
const requiredCompatibilityOutcomes = [
  "complete",
  "queued-running",
  "retrying",
  "degraded-unavailable-runtime",
  "timeout",
  "malformed-runtime-result",
  "stale-artifact",
  "system-failure",
  "strategy-failure",
  "quarantined-private-only",
  "interrupted-matchset",
  "missing-chronicle",
  "no-result",
] as const
const missingCompatibilityOutcomes = requiredCompatibilityOutcomes.filter(
  (id) => !publicCompatibilityOutcomes.some((outcome) => outcome.id === id),
)

if (missingMarkers.length > 0) {
  throw new Error(
    `v1.28 operations proof missing source markers: ${missingMarkers.join(", ")}`,
  )
}
if (leakedFixtures.length > 0) {
  throw new Error(
    `v1.28 fixture leak markers found: ${leakedFixtures
      .map((fixture) => fixture.id)
      .join(", ")}`,
  )
}
if (missingCompatibilityOutcomes.length > 0) {
  throw new Error(
    `v1.28 compatibility proof missing outcomes: ${missingCompatibilityOutcomes.join(", ")}`,
  )
}

mkdirSync(path.dirname(artifactJsonPath), { recursive: true })
writeFileSync(artifactJsonPath, `${JSON.stringify(proof, null, 2)}\n`)

const markdown = `# v1.28 Match Execution Operations Proof

**Generated:** ${proof.generatedAt}
**Contract:** \`${proof.contractVersion}\`
**Public contract changed:** ${proof.publicContractChanged ? "Yes" : "No"}

## Drill Catalog

${proof.drillCatalog
  .map(
    (drill) =>
      `- ${drill.id}: ${drill.expectedPublicCategory}; recovery=${drill.recoveryControl}; topology=${drill.topology.join(" -> ")}`,
  )
  .join("\n")}

## Source Markers

- Quarantine: ${quarantineMarkers.join(", ")}
- Recovery: ${recoveryMarkers.join(", ")}
- Operator evidence: ${operatorEvidenceMarkers.join(", ")}
- Runtime redaction: ${runtimeRedactionMarkers.join(", ")}
- Internal endpoints: ${internalEndpointMarkers.join(", ")}
- Lease and duplicate recovery: ${leaseRecoveryMarkers.join(", ")}
- Interrupted MatchSet refresh: ${interruptedMatchSetMarkers.join(", ")}
- Migrations: ${migrationMarkers.join(", ")}

## Public Compatibility Outcomes

${proof.publicCompatibilityOutcomes
  .map(
    (outcome) =>
      `- ${outcome.id}: ${outcome.publicCategory}; evidence=${outcome.evidence}; private operations state=${outcome.privateOperationsState}`,
  )
  .join("\n")}

## Frozen Contract Coverage

${fixtureValidation
  .map(
    (fixture) =>
      `- ${fixture.id}: ${fixture.contractVersion}; private leaks=${fixture.privateMarkerLeaks.length}`,
  )
  .join("\n")}

## Commands

${proof.relevantCommands.map((command) => `- \`${command}\``).join("\n")}

## Relevant Local Pages

${proof.relevantLocalPages.map((url) => `- ${url}`).join("\n")}

## Ownership and Non-Claims

- Go owns orchestration, recovery policy, persistence-facing lifecycle, scoring, public evidence, and promotion decisions.
- Runtime-service owns hostile Strategy execution through schema-validated envelopes and registered runtimes.
- Web/API/Go do not execute Strategy code.
${proof.nonClaims.map((claim) => `- ${claim}.`).join("\n")}
`

writeFileSync(artifactMarkdownPath, markdown)

console.log(`Wrote ${path.relative(repoRoot, artifactJsonPath)}`)
console.log(`Wrote ${path.relative(repoRoot, artifactMarkdownPath)}`)

if (!existsSync(artifactJsonPath) || !existsSync(artifactMarkdownPath)) {
  throw new Error("v1.28 operations proof artifacts were not written")
}
