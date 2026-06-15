#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const accountProviderEntryProofSchemaVersion =
  "v1.35-account-provider-entry-proof" as const
export const accountProviderEntryProofGeneratedAt = "2026-06-15" as const
export const accountProviderEntryProofGeneratedBy =
  "scripts/evaluate-v1-35-account-provider-entry-proof.ts" as const

export type V135AccountProviderEntryRequirement =
  | "ACCT-01"
  | "ACCT-02"
  | "ACCT-03"
  | "ACCT-04"
  | "ACCT-05"
  | "ENTRY-01"
  | "ENTRY-02"
  | "ENTRY-03"
  | "ENTRY-04"

export type V135AccountProviderEntryEvidenceKind =
  | "typescript-runtime-service-validation"
  | "provider-proof-persistence"
  | "readiness-state-separation"
  | "fail-closed-proof-gates"
  | "public-safe-diagnostics"
  | "counted-entry-gate"
  | "non-counted-entry-gate"
  | "go-persistence-parity"
  | "proof-derived-labels"

export interface V135AccountProviderEntryEvidenceRow {
  id: string
  kind: V135AccountProviderEntryEvidenceKind
  decisions: readonly string[]
  requirements: readonly V135AccountProviderEntryRequirement[]
  files: readonly string[]
  commands: readonly string[]
  outcome: string
  limitations: readonly string[]
}

export interface V135AccountProviderEntryProof {
  schemaVersion: typeof accountProviderEntryProofSchemaVersion
  milestone: "v1.35"
  phase: 244
  generatedAt: typeof accountProviderEntryProofGeneratedAt
  generatedBy: typeof accountProviderEntryProofGeneratedBy
  requiredRequirements: readonly V135AccountProviderEntryRequirement[]
  requiredEvidenceKinds: readonly V135AccountProviderEntryEvidenceKind[]
  claimGuardrails: {
    noStrategyExecutionInWebApiGo: true
    typeScriptPythonProvenanceOnly: true
    rustZigImmutableWasmWasiPreview1: true
    tinyGoHidden: true
    packageModeNoneOnly: true
    productionSandboxCertified: false
  }
  serviceBackedProof: {
    status: "passed-local-postgresql" | "not-run-local-postgresql-unavailable"
    note: string
  }
  evidence: readonly V135AccountProviderEntryEvidenceRow[]
}

export const accountProviderEntryArtifactPaths = {
  json: ".planning/artifacts/v1.35-account-provider-entry-proof.json",
  markdown: ".planning/artifacts/v1.35-account-provider-entry-proof.md",
} as const

export const requiredAccountProviderEntryRequirements = [
  "ACCT-01",
  "ACCT-02",
  "ACCT-03",
  "ACCT-04",
  "ACCT-05",
  "ENTRY-01",
  "ENTRY-02",
  "ENTRY-03",
  "ENTRY-04",
] as const satisfies readonly V135AccountProviderEntryRequirement[]

export const requiredAccountProviderEntryEvidenceKinds = [
  "typescript-runtime-service-validation",
  "provider-proof-persistence",
  "readiness-state-separation",
  "fail-closed-proof-gates",
  "public-safe-diagnostics",
  "counted-entry-gate",
  "non-counted-entry-gate",
  "go-persistence-parity",
  "proof-derived-labels",
] as const satisfies readonly V135AccountProviderEntryEvidenceKind[]

const forbiddenPrivateMarkers = [
  "bytesBase64",
  "PRIVATE_ARTIFACT_BYTES",
  "/Users/",
  "process.env",
  "postgres://",
  "mysql://",
  "token=",
  "session-secret",
  "provider signing material",
  "private runtime internals",
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
] as const

const forbiddenOverclaims = [
  /production sandbox certification\s*:\s*true/i,
  /TypeScript\/Python WASM isolation/i,
  /TinyGo production support/i,
  /package ecosystem support\s*:\s*enabled/i,
  /Strategy execution in (?:web|API|Go)\s*:\s*enabled/i,
] as const

export const generateV135AccountProviderEntryProof = (
  rows: readonly V135AccountProviderEntryEvidenceRow[] = defaultEvidenceRows,
): V135AccountProviderEntryProof => ({
  schemaVersion: accountProviderEntryProofSchemaVersion,
  milestone: "v1.35",
  phase: 244,
  generatedAt: accountProviderEntryProofGeneratedAt,
  generatedBy: accountProviderEntryProofGeneratedBy,
  requiredRequirements: requiredAccountProviderEntryRequirements,
  requiredEvidenceKinds: requiredAccountProviderEntryEvidenceKinds,
  claimGuardrails: {
    noStrategyExecutionInWebApiGo: true,
    typeScriptPythonProvenanceOnly: true,
    rustZigImmutableWasmWasiPreview1: true,
    tinyGoHidden: true,
    packageModeNoneOnly: true,
    productionSandboxCertified: false,
  },
  serviceBackedProof: {
    status: "passed-local-postgresql",
    note: "Local PostgreSQL proof passed after services were made available: authenticated Go account save persisted internally authorized private provider artifact material, counted entry snapshots stayed public-safe, and runtime request construction preserved private artifact bytes for execution.",
  },
  evidence: rows,
})

const defaultEvidenceRows: readonly V135AccountProviderEntryEvidenceRow[] = [
  {
    id: "ts-runtime-service-validation-d01-d02-d04-d09-d10",
    kind: "typescript-runtime-service-validation",
    decisions: ["D-01", "D-02", "D-04", "D-09", "D-10"],
    requirements: ["ACCT-01", "ACCT-04", "ACCT-05"],
    files: [
      "apps/go-backend/runtime_service_client.go",
      "apps/go-backend/runtime_service_client_test.go",
      "apps/runtime-service/src/server.ts",
      "apps/runtime-service/src/server.test.ts",
      "apps/runtime-service/src/redaction.ts",
      "apps/runtime-service/src/redaction.test.ts",
    ],
    commands: [
      "pnpm --filter @cowards/runtime-service exec vitest run src/server.test.ts src/redaction.test.ts",
      "cd apps/go-backend && go test ./... -run 'TestRuntimeServiceClient'",
    ],
    outcome:
      "Go accepts TypeScript provider validation through runtime-service with an internally authorized private account-save request, while default and unauthorized validation responses redact or reject raw artifact material and malformed, mismatched, incomplete, oversized, unauthorized, and unavailable proof responses fail closed.",
    limitations: [],
  },
  {
    id: "account-save-readiness-d02-d03-d04-d09-d10-d11",
    kind: "provider-proof-persistence",
    decisions: ["D-02", "D-03", "D-04", "D-09", "D-10", "D-11"],
    requirements: ["ACCT-02", "ACCT-03", "ACCT-04", "ACCT-05"],
    files: [
      "apps/go-backend/live_backend.go",
      "apps/go-backend/phase244_account_provider_db_test.go",
      "apps/go-backend/provider_readiness.go",
      "apps/go-backend/provider_readiness_test.go",
    ],
    commands: [
      "cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL=<local-db> go test ./... -run TestPhase244AccountProviderProofPersistsThroughDBEntryAndRuntimeRequest -count=1",
      "cd apps/go-backend && go test ./... -run 'TestProviderReadiness|TestRuntimeServiceClient|Test.*Account.*Revision|Test.*CreateStrategyRevision'",
    ],
    outcome:
      "Authenticated Go account save persists runtime, validation, engine compatibility, source identity, internally authorized private artifact material, provider proof metadata, and readiness labels through PostgreSQL; counted entry snapshots stay public-safe and runtime request construction preserves private artifact bytes for execution.",
    limitations: [],
  },
  {
    id: "readiness-state-separation-d03-d04",
    kind: "readiness-state-separation",
    decisions: ["D-03", "D-04"],
    requirements: ["ACCT-03", "ACCT-04"],
    files: [
      "apps/go-backend/provider_readiness.go",
      "apps/go-backend/provider_readiness_test.go",
    ],
    commands: [
      "cd apps/go-backend && go test ./... -run 'TestProviderReadiness'",
    ],
    outcome:
      "Execution-ready, non-execution draft, invalid proof, package policy violation, hidden provider, and runtime-service unavailable states are distinct and non-ready states are not entry eligible.",
    limitations: [],
  },
  {
    id: "entry-gates-d05-d06-d07-d08-d11",
    kind: "counted-entry-gate",
    decisions: ["D-05", "D-06", "D-07", "D-08", "D-11"],
    requirements: ["ENTRY-01", "ENTRY-02", "ENTRY-03"],
    files: [
      "apps/go-backend/live_backend.go",
      "apps/go-backend/main_test.go",
      "packages/persistence/src/competition.test.ts",
      "packages/persistence/src/ladder.test.ts",
    ],
    commands: [
      "cd apps/go-backend && go test ./... -run 'Test.*Runtime.*Semantics|Test.*PublicStrategy|Test.*Runtime.*Play|Test.*Entry|Test.*LoadOwnedEntrants|Test.*Ownership'",
      "pnpm --filter @cowards/persistence test -- competition.test.ts ladder.test.ts",
      "pnpm go:parity",
    ],
    outcome:
      "Counted entry and non-counted exhibition gates require provider proof for TypeScript, Python, Rust, and Zig; Go and persistence parity checks pass.",
    limitations: [],
  },
  {
    id: "non-counted-proof-gate-d07-d09",
    kind: "non-counted-entry-gate",
    decisions: ["D-07", "D-09"],
    requirements: ["ENTRY-02", "ENTRY-03"],
    files: ["apps/go-backend/live_backend.go", "apps/go-backend/main_test.go"],
    commands: [
      "cd apps/go-backend && go test ./... -run 'Test.*Runtime.*Play|Test.*Entry'",
    ],
    outcome:
      "Non-counted exhibition changes counted status only; it does not bypass provider proof, package mode none, required-capability, runtime metadata, or ownership checks.",
    limitations: [],
  },
  {
    id: "proof-derived-public-labels-d04-d09-d10",
    kind: "proof-derived-labels",
    decisions: ["D-04", "D-09", "D-10"],
    requirements: ["ENTRY-04"],
    files: [
      "apps/go-backend/live_backend.go",
      "apps/web/app/strategies/[strategyId]/page.tsx",
      "apps/web/app/matchsets/result-view-model.ts",
      "apps/web/app/matchsets/[matchSetId]/page.tsx",
      "packages/spec/src/competition.ts",
      "packages/spec/src/schemas.ts",
      "packages/spec/src/match-execution-contract.ts",
    ],
    commands: [
      "pnpm --filter @cowards/spec test -- schemas.test.ts service.test.ts",
      "pnpm --filter @cowards/web test -- public-go-read-client.test.ts result-view-model.test.ts",
    ],
    outcome:
      "Public Strategy cards, MatchSet result pages, and replay-facing workbench summaries consume proof-aware runtime semantics instead of raw runtime-only readiness.",
    limitations: [],
  },
  {
    id: "fail-closed-public-safe-diagnostics-d04-d09-d10",
    kind: "fail-closed-proof-gates",
    decisions: ["D-04", "D-09", "D-10"],
    requirements: ["ACCT-04", "ACCT-05", "ENTRY-02"],
    files: [
      "apps/go-backend/runtime_service_client_test.go",
      "apps/go-backend/provider_readiness_test.go",
      "apps/runtime-service/src/server.test.ts",
    ],
    commands: [
      "pnpm --filter @cowards/runtime-service exec vitest run src/server.test.ts",
      "cd apps/go-backend && go test ./... -run 'TestRuntimeServiceClient|TestProviderReadiness'",
    ],
    outcome:
      "Malformed, unavailable, unauthorized-private-artifact, mismatched, missing, package-declared, hidden, and proof-invalid states fail closed with category-based public diagnostics.",
    limitations: [],
  },
  {
    id: "public-safe-diagnostics-d09-d10",
    kind: "public-safe-diagnostics",
    decisions: ["D-09", "D-10"],
    requirements: ["ACCT-05", "ENTRY-04"],
    files: [
      "apps/runtime-service/src/server.ts",
      "apps/runtime-service/src/server.test.ts",
      "apps/runtime-service/src/redaction.ts",
      "apps/runtime-service/src/redaction.test.ts",
      "apps/go-backend/runtime_service_client_test.go",
    ],
    commands: [
      "pnpm --filter @cowards/runtime-service exec vitest run src/server.test.ts src/redaction.test.ts",
      "cd apps/go-backend && go test ./... -run 'TestRuntimeServiceClient'",
    ],
    outcome:
      "Default validation responses expose provider proof identity and public categories without raw artifact material, host details, credential material, or private runtime data; private account-save validation is available only through an internally authorized Go request.",
    limitations: [],
  },
  {
    id: "go-persistence-parity-entry-d08",
    kind: "go-persistence-parity",
    decisions: ["D-08"],
    requirements: ["ENTRY-01", "ENTRY-02", "ENTRY-03"],
    files: [
      "apps/go-backend/live_backend.go",
      "packages/persistence/src/competition.ts",
      "packages/persistence/src/ladder.ts",
      "scripts/generate-go-parity-fixtures.ts",
    ],
    commands: ["pnpm go:parity"],
    outcome:
      "Go parity fixtures and backend tests pass after provider-proof entry semantics and runtimeSemantics fixture regeneration.",
    limitations: [],
  },
]

export const validateV135AccountProviderEntryProof = (
  proof: V135AccountProviderEntryProof,
): readonly string[] => {
  const errors: string[] = []
  if (proof.schemaVersion !== accountProviderEntryProofSchemaVersion) {
    errors.push(
      `schemaVersion must be ${accountProviderEntryProofSchemaVersion}`,
    )
  }
  if (proof.milestone !== "v1.35" || proof.phase !== 244) {
    errors.push("proof must target v1.35 phase 244")
  }
  const coveredRequirements = new Set(
    proof.evidence.flatMap((row) => row.requirements),
  )
  for (const requirement of requiredAccountProviderEntryRequirements) {
    if (!coveredRequirements.has(requirement)) {
      errors.push(`missing requirement ${requirement}`)
    }
  }
  const coveredKinds = new Set(proof.evidence.map((row) => row.kind))
  for (const kind of requiredAccountProviderEntryEvidenceKinds) {
    if (!coveredKinds.has(kind)) {
      errors.push(`missing evidence kind ${kind}`)
    }
  }
  if (!proof.claimGuardrails.noStrategyExecutionInWebApiGo) {
    errors.push("proof must keep Strategy execution out of web/API/Go")
  }
  if (!proof.claimGuardrails.typeScriptPythonProvenanceOnly) {
    errors.push("TypeScript/Python must remain provenance-only")
  }
  if (!proof.claimGuardrails.rustZigImmutableWasmWasiPreview1) {
    errors.push("Rust/Zig must remain immutable WASM/WASI Preview 1")
  }
  if (!proof.claimGuardrails.tinyGoHidden) {
    errors.push("TinyGo must remain hidden")
  }
  if (!proof.claimGuardrails.packageModeNoneOnly) {
    errors.push("package mode must remain none-only")
  }
  if (proof.claimGuardrails.productionSandboxCertified) {
    errors.push("Phase 244 must not certify a production sandbox")
  }
  const serialized = JSON.stringify(proof)
  for (const marker of forbiddenPrivateMarkers) {
    if (serialized.includes(marker)) {
      errors.push(`forbidden private marker ${marker}`)
    }
  }
  for (const pattern of forbiddenOverclaims) {
    if (pattern.test(serialized)) {
      errors.push(`forbidden overclaim ${pattern}`)
    }
  }
  for (const row of proof.evidence) {
    if (
      !row.id ||
      !row.outcome ||
      row.files.length === 0 ||
      row.commands.length === 0
    ) {
      errors.push(`evidence row ${row.id || "(missing id)"} is incomplete`)
    }
    if (row.decisions.length === 0) {
      errors.push(`evidence row ${row.id} must reference locked decisions`)
    }
  }
  return errors
}

export const renderV135AccountProviderEntryProofJson = (
  proof: V135AccountProviderEntryProof,
): string => `${JSON.stringify(proof, null, 2)}\n`

export const renderV135AccountProviderEntryProofMarkdown = (
  proof: V135AccountProviderEntryProof,
): string => {
  const lines = [
    "# v1.35 Account Provider Entry Proof",
    "",
    `Generated: ${proof.generatedAt}`,
    `Schema: ${proof.schemaVersion}`,
    "",
    "## Guardrails",
    "",
    `- Strategy execution in web/API/Go: ${proof.claimGuardrails.noStrategyExecutionInWebApiGo ? "blocked" : "not blocked"}`,
    `- TypeScript/Python: ${proof.claimGuardrails.typeScriptPythonProvenanceOnly ? "provenance evidence only" : "overclaimed"}`,
    `- Rust/Zig: ${proof.claimGuardrails.rustZigImmutableWasmWasiPreview1 ? "immutable WASM/WASI Preview 1 artifact-backed" : "overclaimed"}`,
    `- TinyGo: ${proof.claimGuardrails.tinyGoHidden ? "hidden" : "visible"}`,
    `- Package mode: ${proof.claimGuardrails.packageModeNoneOnly ? "none only" : "expanded"}`,
    `- Production sandbox certified: ${proof.claimGuardrails.productionSandboxCertified ? "yes" : "no"}`,
    "",
    "## Service-Backed Proof",
    "",
    `- Status: ${proof.serviceBackedProof.status}`,
    `- Note: ${proof.serviceBackedProof.note}`,
    "",
    "## Evidence",
    "",
    "| ID | Kind | Requirements | Decisions | Outcome | Commands |",
    "| --- | --- | --- | --- | --- | --- |",
    ...proof.evidence.map(
      (row) =>
        `| ${row.id} | ${row.kind} | ${row.requirements.join(", ")} | ${row.decisions.join(", ")} | ${row.outcome} | ${row.commands.join("<br>")} |`,
    ),
    "",
  ]
  return `${lines.join("\n")}\n`
}

export const writeV135AccountProviderEntryProofArtifacts = (
  root = repoRoot,
): V135AccountProviderEntryProof => {
  const proof = generateV135AccountProviderEntryProof()
  const failures = validateV135AccountProviderEntryProof(proof)
  if (failures.length > 0) {
    throw new Error(failures.join("; "))
  }
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(root, accountProviderEntryArtifactPaths.json),
    renderV135AccountProviderEntryProofJson(proof),
  )
  writeFileSync(
    path.join(root, accountProviderEntryArtifactPaths.markdown),
    renderV135AccountProviderEntryProofMarkdown(proof),
  )
  return proof
}

export const checkV135AccountProviderEntryProofArtifacts = (
  root = repoRoot,
): readonly string[] => {
  const proof = generateV135AccountProviderEntryProof()
  const failures = [...validateV135AccountProviderEntryProof(proof)]
  const expectedJson = renderV135AccountProviderEntryProofJson(proof)
  const expectedMarkdown = renderV135AccountProviderEntryProofMarkdown(proof)
  const jsonPath = path.join(root, accountProviderEntryArtifactPaths.json)
  const markdownPath = path.join(
    root,
    accountProviderEntryArtifactPaths.markdown,
  )
  if (!existsSync(jsonPath)) {
    failures.push(`missing ${accountProviderEntryArtifactPaths.json}`)
  } else if (readFileSync(jsonPath, "utf8") !== expectedJson) {
    failures.push(`${accountProviderEntryArtifactPaths.json} is stale`)
  }
  if (!existsSync(markdownPath)) {
    failures.push(`missing ${accountProviderEntryArtifactPaths.markdown}`)
  } else if (readFileSync(markdownPath, "utf8") !== expectedMarkdown) {
    failures.push(`${accountProviderEntryArtifactPaths.markdown} is stale`)
  }
  return failures
}

const main = () => {
  if (process.argv.includes("--write")) {
    writeV135AccountProviderEntryProofArtifacts()
    return
  }
  if (process.argv.includes("--check")) {
    const failures = checkV135AccountProviderEntryProofArtifacts()
    if (failures.length > 0) {
      console.error(failures.join("\n"))
      process.exit(1)
    }
    return
  }
  process.stdout.write(
    renderV135AccountProviderEntryProofJson(
      generateV135AccountProviderEntryProof(),
    ),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
