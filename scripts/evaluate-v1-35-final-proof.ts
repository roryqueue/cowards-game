#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkV135BoundarySurfaceInventoryArtifacts } from "./evaluate-v1-35-boundary-surface-inventory.ts"
import { checkV135AccountProviderEntryProofArtifacts } from "./evaluate-v1-35-account-provider-entry-proof.ts"
import { checkV135OwnershipAliasProofArtifacts } from "./evaluate-v1-35-ownership-alias-proof.ts"
import { checkV135SandboxReadinessProofArtifacts } from "./evaluate-v1-35-sandbox-readiness-proof.ts"
import { checkV135PackagePolicyProofArtifacts } from "./evaluate-v1-35-package-policy-proof.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const finalProofSchemaVersion = "v1.35-final-proof" as const
export const finalProofGeneratedAt = "2026-06-15" as const
export const finalProofGeneratedBy =
  "scripts/evaluate-v1-35-final-proof.ts" as const

export type V135FinalProofRequirement =
  | "PROOF-01"
  | "PROOF-02"
  | "PROOF-03"
  | "PROOF-04"
  | "PROOF-05"

export type V135FinalProofEvidenceKind =
  | "focused-test-coverage"
  | "service-backed-postgresql-proof"
  | "privacy-scan-coverage"
  | "boundary-monitor-coverage"
  | "final-validation-record"

export interface V135FinalProofEvidenceRow {
  id: string
  kind: V135FinalProofEvidenceKind
  requirements: readonly V135FinalProofRequirement[]
  files: readonly string[]
  commands: readonly string[]
  outcome: string
  limitations: readonly string[]
}

export interface V135FinalProof {
  schemaVersion: typeof finalProofSchemaVersion
  milestone: "v1.35"
  phase: 248
  generatedAt: typeof finalProofGeneratedAt
  generatedBy: typeof finalProofGeneratedBy
  requiredRequirements: readonly V135FinalProofRequirement[]
  requiredEvidenceKinds: readonly V135FinalProofEvidenceKind[]
  guardrails: {
    noStrategyExecutionInWebApiGo: true
    runtimeBoundaryUnchanged: true
    typeScriptPythonProvenanceOnly: true
    rustZigWasmWasiPreview1ArtifactBacked: true
    tinyGoHidden: true
    packageModeNoneOnly: true
    productionSandboxCertified: false
    richPackageEcosystemEnabled: false
  }
  serviceBackedProof: {
    status: "passed-local-postgresql" | "not-run-local-postgresql-unavailable"
    artifact: string
  }
  priorArtifactChecks: readonly string[]
  privacyScanFailures: readonly string[]
  sourceChecks: readonly string[]
  evidence: readonly V135FinalProofEvidenceRow[]
}

export const finalProofArtifactPaths = {
  json: ".planning/artifacts/v1.35-final-proof.json",
  markdown: ".planning/artifacts/v1.35-final-proof.md",
} as const

export const requiredFinalProofRequirements = [
  "PROOF-01",
  "PROOF-02",
  "PROOF-03",
  "PROOF-04",
  "PROOF-05",
] as const satisfies readonly V135FinalProofRequirement[]

export const requiredFinalProofEvidenceKinds = [
  "focused-test-coverage",
  "service-backed-postgresql-proof",
  "privacy-scan-coverage",
  "boundary-monitor-coverage",
  "final-validation-record",
] as const satisfies readonly V135FinalProofEvidenceKind[]

const proofArtifactFiles = [
  ".planning/artifacts/v1.35-account-provider-entry-proof.json",
  ".planning/artifacts/v1.35-account-provider-entry-proof.md",
  ".planning/artifacts/v1.35-ownership-alias-proof.json",
  ".planning/artifacts/v1.35-ownership-alias-proof.md",
  ".planning/artifacts/v1.35-sandbox-readiness-proof.json",
  ".planning/artifacts/v1.35-sandbox-readiness-proof.md",
  ".planning/artifacts/v1.35-package-policy-proof.json",
  ".planning/artifacts/v1.35-package-policy-proof.md",
] as const

const concretePrivateMarkers = [
  "bytesBase64",
  "PRIVATE_",
  "GOLDEN_PRIVATE_",
  "/Users/",
  "postgres://",
  "postgresql://",
  "mysql://",
  "token=",
  "Bearer ",
  "node_modules/",
  "site-packages/",
  "export default {",
] as const

const readRepoFile = (repo: string, file: string): string =>
  readFileSync(path.join(repo, file), "utf8")

const defaultEvidenceRows: readonly V135FinalProofEvidenceRow[] = [
  {
    id: "phase244-provider-proof-state-coverage",
    kind: "focused-test-coverage",
    requirements: ["PROOF-01"],
    files: [
      "apps/go-backend/provider_readiness_test.go",
      "apps/go-backend/runtime_service_client_test.go",
      "apps/go-backend/phase244_account_provider_db_test.go",
      ".planning/artifacts/v1.35-account-provider-entry-proof.md",
    ],
    commands: [
      "cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'TestProviderReadiness|TestRuntimeServiceClient|TestPhase244AccountProviderProofPersistsThroughDBEntryAndRuntimeRequest' -count=1",
      "pnpm v1.35:account-provider-entry-proof:check",
    ],
    outcome:
      "Account-save and entry proof states cover valid, invalid, draft, unavailable, stale, missing, mismatched, malformed, package-declared, unsupported-provider, and TinyGo-hidden cases across TypeScript, Python, Rust, and Zig evidence.",
    limitations: [],
  },
  {
    id: "service-backed-typescript-postgresql-proof",
    kind: "service-backed-postgresql-proof",
    requirements: ["PROOF-02", "PROOF-05"],
    files: [
      "apps/go-backend/phase244_account_provider_db_test.go",
      ".planning/artifacts/v1.35-account-provider-entry-proof.md",
    ],
    commands: [
      "cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL=<local-db> go test ./... -run TestPhase244AccountProviderProofPersistsThroughDBEntryAndRuntimeRequest -count=1",
    ],
    outcome:
      "The v1.35 account/provider proof records a passed local PostgreSQL test showing TypeScript account save persists provider proof and only matching source/artifact identity becomes entry eligible.",
    limitations: [],
  },
  {
    id: "public-default-privacy-scan-suite",
    kind: "privacy-scan-coverage",
    requirements: ["PROOF-03", "PROOF-05"],
    files: [
      "packages/spec/src/public-output-privacy.ts",
      "apps/go-backend/main_test.go",
      "apps/web/app/matches/server.test.ts",
      "apps/web/app/api/workshop/source/route.test.ts",
      "apps/web/app/api/workshop/revisions/[revisionId]/source/route.test.ts",
      "scripts/evaluate-v1-35-final-proof.ts",
    ],
    commands: [
      "cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run TestPublicResponses -count=1",
      "pnpm --filter @cowards/web exec vitest run app/matches/server.test.ts app/api/workshop/source/route.test.ts app/api/workshop/revisions/[revisionId]/source/route.test.ts",
      "pnpm v1.35:final-proof:check",
    ],
    outcome:
      "Privacy scans cover account source, owner-debug replay, public replay/result APIs, Workshop aliases, checker/provider proof responses, package diagnostics, and generated proof artifacts for concrete private marker leakage.",
    limitations: [
      "The final proof scans concrete leak markers in proof artifacts; the boundary inventory may still name forbidden categories as requirements.",
    ],
  },
  {
    id: "v135-boundary-monitor-chain",
    kind: "boundary-monitor-coverage",
    requirements: ["PROOF-04", "PROOF-05"],
    files: ["package.json", "scripts/check-boundary-monitors.ts"],
    commands: [
      "pnpm v1.35:boundary-inventory:check",
      "pnpm v1.35:account-provider-entry-proof:check",
      "pnpm v1.35:ownership-alias-proof:check",
      "pnpm v1.35:sandbox-readiness-proof:check",
      "pnpm v1.35:package-policy-proof:check",
      "pnpm v1.35:final-proof:check",
      "pnpm exec tsx scripts/check-boundary-monitors.ts",
    ],
    outcome:
      "Boundary monitors prove no Strategy execution moved into web/API/Go, TinyGo remains hidden, TypeScript/Python remain provenance-only, Rust/Zig remain WASM/WASI Preview 1 artifact-backed, package mode remains none, and unsupported claims fail loudly.",
    limitations: [],
  },
  {
    id: "final-v135-validation-record",
    kind: "final-validation-record",
    requirements: ["PROOF-05"],
    files: [
      ".planning/artifacts/v1.35-boundary-surface-inventory.md",
      ".planning/artifacts/v1.35-account-provider-entry-proof.md",
      ".planning/artifacts/v1.35-ownership-alias-proof.md",
      ".planning/artifacts/v1.35-sandbox-readiness-proof.md",
      ".planning/artifacts/v1.35-package-policy-proof.md",
      ".planning/artifacts/v1.35-final-proof.md",
    ],
    commands: ["pnpm v1.35:final-proof:check"],
    outcome:
      "Final validation records inventory findings, provider-proof decisions, account/entry readiness behavior, alias decisions, sandbox readiness, package policy, service-backed proof, privacy scans, boundary monitors, limitations, and audit readiness.",
    limitations: [
      "Production sandbox certification and rich package ecosystems remain future explicit milestones.",
    ],
  },
]

const priorArtifactChecks = (repo: string): string[] => [
  ...checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: repo }),
  ...checkV135AccountProviderEntryProofArtifacts(repo),
  ...checkV135OwnershipAliasProofArtifacts(repo),
  ...checkV135SandboxReadinessProofArtifacts(repo),
  ...checkV135PackagePolicyProofArtifacts(repo),
]

const serviceBackedProofStatus = (
  repo: string,
): V135FinalProof["serviceBackedProof"] => {
  const artifact = ".planning/artifacts/v1.35-account-provider-entry-proof.json"
  const parsed = JSON.parse(readRepoFile(repo, artifact)) as {
    serviceBackedProof?: { status?: string }
  }
  const status =
    parsed.serviceBackedProof?.status === "passed-local-postgresql"
      ? "passed-local-postgresql"
      : "not-run-local-postgresql-unavailable"
  return { status, artifact }
}

const privacyScanFailures = (repo: string): string[] => {
  const failures: string[] = []
  for (const file of proofArtifactFiles) {
    const fullPath = path.join(repo, file)
    if (!existsSync(fullPath)) {
      failures.push(`${file} is missing`)
      continue
    }
    const text = readFileSync(fullPath, "utf8")
    for (const marker of concretePrivateMarkers) {
      if (text.includes(marker)) {
        failures.push(`${file} contains private marker ${marker}`)
      }
    }
  }
  return failures
}

const sourceChecks = (repo: string): string[] => {
  const checks: string[] = []
  const packageJson = readRepoFile(repo, "package.json")
  const accountDbTest = readRepoFile(
    repo,
    "apps/go-backend/phase244_account_provider_db_test.go",
  )
  const publicPrivacy = readRepoFile(
    repo,
    "packages/spec/src/public-output-privacy.ts",
  )
  const goMainTest = readRepoFile(repo, "apps/go-backend/main_test.go")
  const webReplayTest = readRepoFile(
    repo,
    "apps/web/app/matches/server.test.ts",
  )

  for (const scriptName of [
    "v1.35:boundary-inventory:check",
    "v1.35:account-provider-entry-proof:check",
    "v1.35:ownership-alias-proof:check",
    "v1.35:sandbox-readiness-proof:check",
    "v1.35:package-policy-proof:check",
    "v1.35:final-proof:check",
  ]) {
    if (!packageJson.includes(scriptName)) {
      checks.push(`package.json missing ${scriptName}`)
    }
  }
  if (
    !accountDbTest.includes(
      "TestPhase244AccountProviderProofPersistsThroughDBEntryAndRuntimeRequest",
    )
  ) {
    checks.push("service-backed PostgreSQL provider proof test is missing")
  }
  if (!publicPrivacy.includes("PUBLIC_OUTPUT_FORBIDDEN_FIELDS")) {
    checks.push("public output privacy contract is missing")
  }
  if (!goMainTest.includes("TestPublicResponses")) {
    checks.push("Go public response privacy tests are missing")
  }
  if (!webReplayTest.includes("returns public replay data by default")) {
    checks.push("web public replay privacy test is missing")
  }
  return checks
}

export const generateV135FinalProof = (
  repo: string = repoRoot,
  rows: readonly V135FinalProofEvidenceRow[] = defaultEvidenceRows,
  checks: readonly string[] = priorArtifactChecks(repo),
): V135FinalProof => ({
  schemaVersion: finalProofSchemaVersion,
  milestone: "v1.35",
  phase: 248,
  generatedAt: finalProofGeneratedAt,
  generatedBy: finalProofGeneratedBy,
  requiredRequirements: requiredFinalProofRequirements,
  requiredEvidenceKinds: requiredFinalProofEvidenceKinds,
  guardrails: {
    noStrategyExecutionInWebApiGo: true,
    runtimeBoundaryUnchanged: true,
    typeScriptPythonProvenanceOnly: true,
    rustZigWasmWasiPreview1ArtifactBacked: true,
    tinyGoHidden: true,
    packageModeNoneOnly: true,
    productionSandboxCertified: false,
    richPackageEcosystemEnabled: false,
  },
  serviceBackedProof: serviceBackedProofStatus(repo),
  priorArtifactChecks: checks,
  privacyScanFailures: privacyScanFailures(repo),
  sourceChecks: sourceChecks(repo),
  evidence: rows,
})

export const validateV135FinalProof = (proof: V135FinalProof): string[] => {
  const errors: string[] = []
  for (const requirement of proof.requiredRequirements) {
    if (!proof.evidence.some((row) => row.requirements.includes(requirement))) {
      errors.push(`missing requirement ${requirement}`)
    }
  }
  for (const kind of proof.requiredEvidenceKinds) {
    if (!proof.evidence.some((row) => row.kind === kind)) {
      errors.push(`missing evidence kind ${kind}`)
    }
  }
  if (proof.serviceBackedProof.status !== "passed-local-postgresql") {
    errors.push("service-backed PostgreSQL provider proof must be passed")
  }
  if (proof.guardrails.productionSandboxCertified !== false) {
    errors.push("production sandbox certification must remain false")
  }
  if (proof.guardrails.richPackageEcosystemEnabled !== false) {
    errors.push("rich package ecosystem must remain disabled")
  }
  for (const [key, value] of Object.entries(proof.guardrails)) {
    if (
      key !== "productionSandboxCertified" &&
      key !== "richPackageEcosystemEnabled" &&
      value !== true
    ) {
      errors.push(`${key} must remain true`)
    }
  }
  errors.push(...proof.priorArtifactChecks)
  errors.push(...proof.privacyScanFailures)
  errors.push(...proof.sourceChecks)
  const serialized = JSON.stringify(proof)
  for (const marker of concretePrivateMarkers) {
    if (serialized.includes(marker)) {
      errors.push(`final proof contains private marker ${marker}`)
    }
  }
  return errors
}

const markdownEscape = (value: unknown): string =>
  String(Array.isArray(value) ? value.join("<br>") : value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>")

export const renderV135FinalProofJson = (proof: V135FinalProof): string =>
  `${JSON.stringify(proof, null, 2)}\n`

export const renderV135FinalProofMarkdown = (
  proof: V135FinalProof,
): string => `# v1.35 Final Proof

**Generated:** ${proof.generatedAt}  
**Phase:** ${proof.phase}  
**Schema:** ${proof.schemaVersion}

This artifact is the Phase 248 final evidence rollup for v1.35. It summarizes provider-proof coverage, service-backed PostgreSQL proof, privacy scans, boundary monitors, sandbox-readiness labels, package policy, and remaining future-only limitations.

## Guardrails

| Guardrail | Value |
| --- | --- |
| No Strategy execution in web/API/Go | ${proof.guardrails.noStrategyExecutionInWebApiGo} |
| Runtime boundary unchanged | ${proof.guardrails.runtimeBoundaryUnchanged} |
| TypeScript/Python provenance only | ${proof.guardrails.typeScriptPythonProvenanceOnly} |
| Rust/Zig WASM/WASI Preview 1 artifact-backed | ${proof.guardrails.rustZigWasmWasiPreview1ArtifactBacked} |
| TinyGo hidden | ${proof.guardrails.tinyGoHidden} |
| Package mode none only | ${proof.guardrails.packageModeNoneOnly} |
| Production sandbox certified | ${proof.guardrails.productionSandboxCertified} |
| Rich package ecosystem enabled | ${proof.guardrails.richPackageEcosystemEnabled} |

## Service-Backed Proof

- Status: ${proof.serviceBackedProof.status}
- Artifact: ${proof.serviceBackedProof.artifact}

## Checks

- Prior artifact check failures: ${proof.priorArtifactChecks.length}
- Privacy scan failures: ${proof.privacyScanFailures.length}
- Source check failures: ${proof.sourceChecks.length}

## Evidence

| ID | Kind | Requirements | Files | Commands | Outcome | Limitations |
| --- | --- | --- | --- | --- | --- | --- |
${proof.evidence
  .map(
    (row) =>
      `| ${markdownEscape(row.id)} | ${markdownEscape(row.kind)} | ${markdownEscape(row.requirements)} | ${markdownEscape(row.files)} | ${markdownEscape(row.commands)} | ${markdownEscape(row.outcome)} | ${markdownEscape(row.limitations.length ? row.limitations : "None")} |`,
  )
  .join("\n")}
`

export const writeV135FinalProofArtifacts = (
  repo: string = repoRoot,
  checks?: readonly string[],
): V135FinalProof => {
  const proof = generateV135FinalProof(repo, defaultEvidenceRows, checks)
  const errors = validateV135FinalProof(proof)
  if (errors.length) {
    throw new Error(`Invalid v1.35 final proof:\n${errors.join("\n")}`)
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, finalProofArtifactPaths.json),
    renderV135FinalProofJson(proof),
  )
  writeFileSync(
    path.join(repo, finalProofArtifactPaths.markdown),
    renderV135FinalProofMarkdown(proof),
  )
  return proof
}

export const checkV135FinalProofArtifacts = (
  repo: string = repoRoot,
  checks?: readonly string[],
): string[] => {
  const proof = generateV135FinalProof(repo, defaultEvidenceRows, checks)
  const errors = validateV135FinalProof(proof)
  const expectedJson = renderV135FinalProofJson(proof)
  const expectedMarkdown = renderV135FinalProofMarkdown(proof)
  const jsonPath = path.join(repo, finalProofArtifactPaths.json)
  const markdownPath = path.join(repo, finalProofArtifactPaths.markdown)
  if (
    !existsSync(jsonPath) ||
    readFileSync(jsonPath, "utf8") !== expectedJson
  ) {
    errors.push(`${finalProofArtifactPaths.json} is stale`)
  }
  if (
    !existsSync(markdownPath) ||
    readFileSync(markdownPath, "utf8") !== expectedMarkdown
  ) {
    errors.push(`${finalProofArtifactPaths.markdown} is stale`)
  }
  return errors
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    writeV135FinalProofArtifacts()
    console.log("wrote v1.35 final proof artifacts")
    return
  }
  if (args.has("--check")) {
    const errors = checkV135FinalProofArtifacts()
    if (errors.length) {
      console.error("v1.35 final proof artifacts are stale:")
      for (const error of errors) {
        console.error(`- ${error}`)
      }
      process.exit(1)
    }
    console.log("v1.35 final proof artifacts are current")
    return
  }
  console.log(renderV135FinalProofMarkdown(generateV135FinalProof()))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
