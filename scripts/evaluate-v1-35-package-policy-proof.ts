#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertStrategyRuntimePackagePolicyContract,
  getStrategyRuntimePackagePolicyClaim,
  STRATEGY_RUNTIME_PACKAGE_POLICY_CLAIMS,
  STRATEGY_RUNTIME_PACKAGE_POLICY_CONTRACT_VERSION,
} from "../packages/spec/src/runtime.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const packagePolicyProofSchemaVersion =
  "v1.35-package-policy-proof" as const
export const packagePolicyProofGeneratedAt = "2026-06-15" as const
export const packagePolicyProofGeneratedBy =
  "scripts/evaluate-v1-35-package-policy-proof.ts" as const

export type V135PackagePolicyRequirement =
  | "PKG-01"
  | "PKG-02"
  | "PKG-03"
  | "PKG-04"

export type V135PackagePolicyEvidenceKind =
  | "spec-package-policy-contract"
  | "account-entry-package-mode-none-gates"
  | "language-validator-package-denial"
  | "public-safe-package-diagnostics"
  | "future-package-lane-requirements"
  | "fail-loud-package-drift-monitor"

export interface V135PackagePolicyEvidenceRow {
  id: string
  kind: V135PackagePolicyEvidenceKind
  requirements: readonly V135PackagePolicyRequirement[]
  files: readonly string[]
  commands: readonly string[]
  outcome: string
  limitations: readonly string[]
}

export interface V135PackagePolicyProof {
  schemaVersion: typeof packagePolicyProofSchemaVersion
  milestone: "v1.35"
  phase: 247
  generatedAt: typeof packagePolicyProofGeneratedAt
  generatedBy: typeof packagePolicyProofGeneratedBy
  contractVersion: typeof STRATEGY_RUNTIME_PACKAGE_POLICY_CONTRACT_VERSION
  requiredRequirements: readonly V135PackagePolicyRequirement[]
  requiredEvidenceKinds: readonly V135PackagePolicyEvidenceKind[]
  guardrails: {
    productionPackageMode: "none"
    typeScriptPackages: false
    pythonPackages: false
    rustExternalCrates: false
    zigPackages: false
    tinyGoProductionPackages: false
    hostImports: false
    richPackageEcosystem: false
  }
  laneClaims: typeof STRATEGY_RUNTIME_PACKAGE_POLICY_CLAIMS
  sourceChecks: readonly string[]
  evidence: readonly V135PackagePolicyEvidenceRow[]
}

export const packagePolicyArtifactPaths = {
  json: ".planning/artifacts/v1.35-package-policy-proof.json",
  markdown: ".planning/artifacts/v1.35-package-policy-proof.md",
} as const

export const requiredPackagePolicyRequirements = [
  "PKG-01",
  "PKG-02",
  "PKG-03",
  "PKG-04",
] as const satisfies readonly V135PackagePolicyRequirement[]

export const requiredPackagePolicyEvidenceKinds = [
  "spec-package-policy-contract",
  "account-entry-package-mode-none-gates",
  "language-validator-package-denial",
  "public-safe-package-diagnostics",
  "future-package-lane-requirements",
  "fail-loud-package-drift-monitor",
] as const satisfies readonly V135PackagePolicyEvidenceKind[]

const forbiddenPrivateMarkers = [
  "bytesBase64",
  "PRIVATE_ARTIFACT_BYTES",
  "PRIVATE_STRATEGY_SOURCE",
  "/Users/",
  "process.env",
  "postgres://",
  "mysql://",
  "token=",
  "site-packages/",
  "node_modules/",
  "Cargo.lock:",
] as const

const positiveOverclaimPatterns = [
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\bpackage ecosystem support\b/i,
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\brich-package support\b/i,
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\bhost import support\b/i,
  /\bpackage mode (?!`?none`?\b)[^.\n]{0,100}\bproduction-supported\b/i,
] as const

const readRepoFile = (repo: string, file: string): string =>
  readFileSync(path.join(repo, file), "utf8")

const defaultEvidenceRows: readonly V135PackagePolicyEvidenceRow[] = [
  {
    id: "spec-owned-package-policy-contract",
    kind: "spec-package-policy-contract",
    requirements: ["PKG-01", "PKG-04"],
    files: ["packages/spec/src/runtime.ts", "packages/spec/src/spec.test.ts"],
    commands: ["pnpm --filter @cowards/spec exec vitest run src/spec.test.ts"],
    outcome:
      "Spec owns a versioned package policy contract for JavaScript, TypeScript, Python, Rust, Zig, and hidden TinyGo, with production package mode fixed at none.",
    limitations: [
      "No rich package lane is enabled; future support remains a separate milestone.",
    ],
  },
  {
    id: "account-entry-package-mode-none-gates",
    kind: "account-entry-package-mode-none-gates",
    requirements: ["PKG-02", "PKG-03"],
    files: [
      "apps/go-backend/provider_readiness.go",
      "apps/go-backend/live_backend.go",
      "apps/go-backend/runtime_service_client.go",
      "apps/go-backend/main_test.go",
    ],
    commands: [
      "cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Package|TestTypeScriptRuntimeMetadataRequiresProviderProofForCountedPlay|Test.*Provider.*Readiness' -count=1",
    ],
    outcome:
      "Go account-save, runtime compatibility, counted entry, and non-counted exhibition gates reject package mode other than none with public-safe categories and labels.",
    limitations: [],
  },
  {
    id: "language-validators-deny-package-and-host-imports",
    kind: "language-validator-package-denial",
    requirements: ["PKG-01", "PKG-02", "PKG-03"],
    files: [
      "packages/runtime-js/src/validation.test.ts",
      "packages/runtime-python/src/validation.ts",
      "packages/runtime-wasm-wasi/src/validation.ts",
    ],
    commands: [
      "pnpm --filter @cowards/runtime-js exec vitest run src/validation.test.ts",
      "pnpm --filter @cowards/runtime-python exec vitest run src/python-subprocess-adapter.test.ts",
      "pnpm --filter @cowards/runtime-wasm-wasi exec vitest run src/wasm-wasi-subprocess-adapter.test.ts",
    ],
    outcome:
      "Language validation denies declared package metadata, host imports, package imports, dynamic imports, package installation, and native/package capabilities.",
    limitations: [],
  },
  {
    id: "public-safe-package-diagnostics",
    kind: "public-safe-package-diagnostics",
    requirements: ["PKG-03"],
    files: [
      "packages/spec/src/runtime.ts",
      "apps/go-backend/provider_readiness.go",
      "apps/go-backend/live_backend.go",
      "scripts/evaluate-v1-35-package-policy-proof.ts",
    ],
    commands: ["pnpm v1.35:package-policy-proof:check"],
    outcome:
      "Generated package evidence and package diagnostics omit package paths, host paths, env values, tokens, DB details, raw diagnostics, source, and artifact bytes.",
    limitations: [],
  },
  {
    id: "future-package-lane-requirements-only",
    kind: "future-package-lane-requirements",
    requirements: ["PKG-04"],
    files: ["packages/spec/src/runtime.ts", ".planning/REQUIREMENTS.md"],
    commands: ["pnpm v1.35:package-policy-proof:check"],
    outcome:
      "Future package support requirements cover reproducibility, lockfiles, supply chain, native code, deterministic builds, privacy, rollback, and runtime-boundary proof without enabling packages.",
    limitations: [
      "Approval of any package lane is deferred to a future explicit package milestone.",
    ],
  },
  {
    id: "package-policy-drift-monitor",
    kind: "fail-loud-package-drift-monitor",
    requirements: ["PKG-02", "PKG-03", "PKG-04"],
    files: ["scripts/evaluate-v1-35-package-policy-proof.ts", "package.json"],
    commands: [
      "pnpm v1.35:package-policy-proof:check",
      "pnpm boundary:monitors",
    ],
    outcome:
      "Boundary monitors include a fail-loud proof gate for package mode, host import, rich-package, diagnostics, and future-support overclaim drift.",
    limitations: [],
  },
]

const sourceChecks = (repo: string): string[] => {
  const checks: string[] = []
  const runtimeSpec = readRepoFile(repo, "packages/spec/src/runtime.ts")
  const goBackend = readRepoFile(repo, "apps/go-backend/live_backend.go")
  const providerReadiness = readRepoFile(
    repo,
    "apps/go-backend/provider_readiness.go",
  )
  const runtimeClient = readRepoFile(
    repo,
    "apps/go-backend/runtime_service_client.go",
  )
  const pythonValidation = readRepoFile(
    repo,
    "packages/runtime-python/src/validation.ts",
  )
  const wasmValidation = readRepoFile(
    repo,
    "packages/runtime-wasm-wasi/src/validation.ts",
  )
  const jsValidationTest = readRepoFile(
    repo,
    "packages/runtime-js/src/validation.test.ts",
  )
  const packageJson = readRepoFile(repo, "package.json")

  const requiredSpecSnippets = [
    "STRATEGY_RUNTIME_PACKAGE_POLICY_CONTRACT_VERSION",
    'productionPackageMode: "none"',
    "hostImportsAllowed: false",
    "richPackagesAllowed: false",
    "nativeDependenciesAllowed: false",
    "Package metadata unsupported",
    "runtime-boundary proof before entry eligibility",
  ] as const
  for (const snippet of requiredSpecSnippets) {
    if (!runtimeSpec.includes(snippet)) {
      checks.push(`runtime spec missing ${snippet}`)
    }
  }

  const requiredGoSnippets = [
    "packagePolicyLabel",
    "Package metadata unsupported",
    "Package metadata is not supported for counted play.",
    "package_policy_violation",
  ] as const
  for (const snippet of requiredGoSnippets) {
    if (!goBackend.includes(snippet) && !providerReadiness.includes(snippet)) {
      checks.push(`Go package gate missing ${snippet}`)
    }
  }
  if (!runtimeClient.includes('packageMode == "none"')) {
    checks.push(
      "Go runtime-service compatibility must require package mode none",
    )
  }
  if (!pythonValidation.includes("import, package")) {
    checks.push("Python validator must deny import/package capability")
  }
  if (!wasmValidation.includes("package capabilities")) {
    checks.push("WASM/WASI validator must deny package capabilities")
  }
  if (!jsValidationTest.includes("UNSUPPORTED_PACKAGE_METADATA")) {
    checks.push("runtime-js validation must test unsupported package metadata")
  }
  if (!packageJson.includes("v1.35:package-policy-proof:check")) {
    checks.push("boundary monitors must include package policy proof check")
  }

  for (const [file, text] of [
    ["packages/spec/src/runtime.ts", runtimeSpec],
    ["apps/go-backend/live_backend.go", goBackend],
    ["apps/go-backend/provider_readiness.go", providerReadiness],
  ] as const) {
    for (const pattern of positiveOverclaimPatterns) {
      if (pattern.test(text)) {
        checks.push(`${file} contains forbidden positive package overclaim`)
      }
    }
  }

  return checks
}

export const generateV135PackagePolicyProof = (
  repo: string = repoRoot,
  rows: readonly V135PackagePolicyEvidenceRow[] = defaultEvidenceRows,
): V135PackagePolicyProof => {
  assertStrategyRuntimePackagePolicyContract()
  return {
    schemaVersion: packagePolicyProofSchemaVersion,
    milestone: "v1.35",
    phase: 247,
    generatedAt: packagePolicyProofGeneratedAt,
    generatedBy: packagePolicyProofGeneratedBy,
    contractVersion: STRATEGY_RUNTIME_PACKAGE_POLICY_CONTRACT_VERSION,
    requiredRequirements: requiredPackagePolicyRequirements,
    requiredEvidenceKinds: requiredPackagePolicyEvidenceKinds,
    guardrails: {
      productionPackageMode: "none",
      typeScriptPackages: false,
      pythonPackages: false,
      rustExternalCrates: false,
      zigPackages: false,
      tinyGoProductionPackages: false,
      hostImports: false,
      richPackageEcosystem: false,
    },
    laneClaims: STRATEGY_RUNTIME_PACKAGE_POLICY_CLAIMS,
    sourceChecks: sourceChecks(repo),
    evidence: rows,
  }
}

export const validateV135PackagePolicyProof = (
  proof: V135PackagePolicyProof,
): string[] => {
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
  if (proof.guardrails.productionPackageMode !== "none") {
    errors.push("production package mode must remain none")
  }
  for (const [name, value] of Object.entries(proof.guardrails)) {
    if (name !== "productionPackageMode" && value !== false) {
      errors.push(`${name} must remain false`)
    }
  }
  for (const laneId of [
    "typescript",
    "python",
    "rust",
    "zig",
    "tinygo",
  ] as const) {
    const claim = getStrategyRuntimePackagePolicyClaim(laneId)
    if (!claim || claim.productionPackageMode !== "none") {
      errors.push(`${laneId} must remain package mode none`)
    }
    if (
      claim &&
      (claim.hostImportsAllowed ||
        claim.richPackagesAllowed ||
        claim.nativeDependenciesAllowed)
    ) {
      errors.push(`${laneId} package support flags must remain false`)
    }
  }
  errors.push(...proof.sourceChecks)
  const artifactText = JSON.stringify(proof)
  for (const marker of forbiddenPrivateMarkers) {
    if (artifactText.includes(marker)) {
      errors.push(`forbidden private marker ${marker}`)
    }
  }
  return errors
}

const markdownEscape = (value: unknown): string =>
  String(Array.isArray(value) ? value.join("<br>") : value)
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>")

export const renderV135PackagePolicyProofJson = (
  proof: V135PackagePolicyProof,
): string => `${JSON.stringify(proof, null, 2)}\n`

export const renderV135PackagePolicyProofMarkdown = (
  proof: V135PackagePolicyProof,
): string => `# v1.35 Package Policy Proof

**Generated:** ${proof.generatedAt}  
**Phase:** ${proof.phase}  
**Schema:** ${proof.schemaVersion}  
**Contract:** ${proof.contractVersion}

This artifact records the Phase 247 package/dependency policy. Current production Strategy lanes use package mode \`none\`; host imports, rich package ecosystems, native dependencies, and TinyGo production packages remain unsupported.

## Guardrails

| Guardrail | Value |
| --- | --- |
| Production package mode | ${proof.guardrails.productionPackageMode} |
| TypeScript packages | ${proof.guardrails.typeScriptPackages} |
| Python packages | ${proof.guardrails.pythonPackages} |
| Rust external crates | ${proof.guardrails.rustExternalCrates} |
| Zig packages | ${proof.guardrails.zigPackages} |
| TinyGo production packages | ${proof.guardrails.tinyGoProductionPackages} |
| Host imports | ${proof.guardrails.hostImports} |
| Rich package ecosystem | ${proof.guardrails.richPackageEcosystem} |

## Lane Claims

| Lane | Package mode | Public label | Developer label | Current restrictions | Future requirements |
| --- | --- | --- | --- | --- | --- |
${proof.laneClaims
  .map(
    (claim) =>
      `| ${markdownEscape(claim.laneId)} | ${markdownEscape(claim.productionPackageMode)} | ${markdownEscape(claim.publicLabel)} | ${markdownEscape(claim.developerLabel)} | ${markdownEscape(claim.currentRestrictions)} | ${markdownEscape(claim.futureSupportRequirements)} |`,
  )
  .join("\n")}

## Source Checks

${proof.sourceChecks.length === 0 ? "- All source checks passed." : proof.sourceChecks.map((check) => `- ${check}`).join("\n")}

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

export const writeV135PackagePolicyProofArtifacts = (
  repo: string = repoRoot,
): V135PackagePolicyProof => {
  const proof = generateV135PackagePolicyProof(repo)
  const errors = validateV135PackagePolicyProof(proof)
  if (errors.length) {
    throw new Error(`Invalid v1.35 package policy proof:\n${errors.join("\n")}`)
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, packagePolicyArtifactPaths.json),
    renderV135PackagePolicyProofJson(proof),
  )
  writeFileSync(
    path.join(repo, packagePolicyArtifactPaths.markdown),
    renderV135PackagePolicyProofMarkdown(proof),
  )
  return proof
}

export const checkV135PackagePolicyProofArtifacts = (
  repo: string = repoRoot,
): string[] => {
  const proof = generateV135PackagePolicyProof(repo)
  const errors = validateV135PackagePolicyProof(proof)
  const expectedJson = renderV135PackagePolicyProofJson(proof)
  const expectedMarkdown = renderV135PackagePolicyProofMarkdown(proof)
  const jsonPath = path.join(repo, packagePolicyArtifactPaths.json)
  const markdownPath = path.join(repo, packagePolicyArtifactPaths.markdown)
  if (
    !existsSync(jsonPath) ||
    readFileSync(jsonPath, "utf8") !== expectedJson
  ) {
    errors.push(`${packagePolicyArtifactPaths.json} is stale`)
  }
  if (
    !existsSync(markdownPath) ||
    readFileSync(markdownPath, "utf8") !== expectedMarkdown
  ) {
    errors.push(`${packagePolicyArtifactPaths.markdown} is stale`)
  }
  return errors
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    writeV135PackagePolicyProofArtifacts()
    console.log("wrote v1.35 package policy proof artifacts")
    return
  }
  if (args.has("--check")) {
    const errors = checkV135PackagePolicyProofArtifacts()
    if (errors.length) {
      console.error("v1.35 package policy proof artifacts are stale:")
      for (const error of errors) {
        console.error(`- ${error}`)
      }
      process.exit(1)
    }
    console.log("v1.35 package policy proof artifacts are current")
    return
  }
  console.log(
    renderV135PackagePolicyProofMarkdown(generateV135PackagePolicyProof()),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
