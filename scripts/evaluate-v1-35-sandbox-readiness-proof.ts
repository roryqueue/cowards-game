#!/usr/bin/env -S pnpm exec tsx
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  assertStrategyRuntimeSandboxReadinessContract,
  getStrategyRuntimeSandboxReadinessClaim,
  STRATEGY_RUNTIME_SANDBOX_READINESS_CLAIMS,
  STRATEGY_RUNTIME_SANDBOX_READINESS_CONTRACT_VERSION,
} from "../packages/spec/src/runtime.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const sandboxReadinessProofSchemaVersion =
  "v1.35-sandbox-readiness-proof" as const
export const sandboxReadinessProofGeneratedAt = "2026-06-15" as const
export const sandboxReadinessProofGeneratedBy =
  "scripts/evaluate-v1-35-sandbox-readiness-proof.ts" as const

export type V135SandboxReadinessRequirement =
  | "SBOX-01"
  | "SBOX-02"
  | "LABEL-01"
  | "LABEL-02"

export type V135SandboxReadinessEvidenceKind =
  | "runtime-containment-current-lanes"
  | "typescript-python-provenance-only"
  | "rust-zig-wasm-wasi-preview1-artifact"
  | "tinygo-hidden-spike-only"
  | "fail-loud-claim-drift-monitor"

export interface V135SandboxReadinessEvidenceRow {
  id: string
  kind: V135SandboxReadinessEvidenceKind
  requirements: readonly V135SandboxReadinessRequirement[]
  files: readonly string[]
  commands: readonly string[]
  outcome: string
  limitations: readonly string[]
}

export interface V135SandboxReadinessProof {
  schemaVersion: typeof sandboxReadinessProofSchemaVersion
  milestone: "v1.35"
  phase: 246
  generatedAt: typeof sandboxReadinessProofGeneratedAt
  generatedBy: typeof sandboxReadinessProofGeneratedBy
  contractVersion: typeof STRATEGY_RUNTIME_SANDBOX_READINESS_CONTRACT_VERSION
  requiredRequirements: readonly V135SandboxReadinessRequirement[]
  requiredEvidenceKinds: readonly V135SandboxReadinessEvidenceKind[]
  guardrails: {
    productionSandboxCertification: false
    typeScriptPythonWasmIsolation: false
    tinyGoProductionSupport: false
    packageEcosystemSupport: false
    directExportOrComponentModelAbiPromotion: false
  }
  laneClaims: typeof STRATEGY_RUNTIME_SANDBOX_READINESS_CLAIMS
  sourceChecks: readonly string[]
  evidence: readonly V135SandboxReadinessEvidenceRow[]
}

export const sandboxReadinessArtifactPaths = {
  json: ".planning/artifacts/v1.35-sandbox-readiness-proof.json",
  markdown: ".planning/artifacts/v1.35-sandbox-readiness-proof.md",
} as const

export const requiredSandboxReadinessRequirements = [
  "SBOX-01",
  "SBOX-02",
  "LABEL-01",
  "LABEL-02",
] as const satisfies readonly V135SandboxReadinessRequirement[]

export const requiredSandboxReadinessEvidenceKinds = [
  "runtime-containment-current-lanes",
  "typescript-python-provenance-only",
  "rust-zig-wasm-wasi-preview1-artifact",
  "tinygo-hidden-spike-only",
  "fail-loud-claim-drift-monitor",
] as const satisfies readonly V135SandboxReadinessEvidenceKind[]

const forbiddenPrivateMarkers = [
  "bytesBase64",
  "PRIVATE_STRATEGY_SOURCE",
  "PRIVATE_ARTIFACT_BYTES",
  "/Users/",
  "process.env",
  "postgres://",
  "mysql://",
  "token=",
  "StrategyMemory",
  "SoldierMemory",
] as const

const positiveOverclaimPatterns = [
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\bproduction sandbox certification\b/i,
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\bTypeScript\/Python WASM isolation\b/i,
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\bTinyGo production support\b/i,
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\bpackage ecosystem support\b/i,
  /\b(?:claims?|certifies?|certified|supports?|enables?|promotes?|declares?)\b[^.\n]{0,100}\b(?:direct-export|Component Model|WIT) ABI\b/i,
] as const

const readRepoFile = (repo: string, file: string): string =>
  readFileSync(path.join(repo, file), "utf8")

const defaultEvidenceRows: readonly V135SandboxReadinessEvidenceRow[] = [
  {
    id: "current-runtime-containment-no-certification",
    kind: "runtime-containment-current-lanes",
    requirements: ["SBOX-01", "SBOX-02", "LABEL-01"],
    files: ["packages/spec/src/runtime.ts", "apps/go-backend/live_backend.go"],
    commands: [
      "pnpm --filter @cowards/spec exec vitest run src/spec.test.ts",
      "cd apps/go-backend && go test ./... -run 'Test.*Runtime.*Semantics|Test.*Provider|Test.*Readiness' -count=1",
    ],
    outcome:
      "Current runtime labels describe evidence posture and explicitly leave production sandbox certification false for every lane.",
    limitations: [
      "No broader production sandbox is certified by this milestone.",
    ],
  },
  {
    id: "typescript-python-provenance-not-wasm-isolation",
    kind: "typescript-python-provenance-only",
    requirements: ["SBOX-01", "LABEL-01", "LABEL-02"],
    files: [
      "packages/spec/src/runtime.ts",
      "apps/go-backend/live_backend.go",
      "apps/web/lib/public-discovery-service.test.ts",
    ],
    commands: [
      "pnpm exec vitest run scripts/evaluate-v1-35-sandbox-readiness-proof.test.ts",
    ],
    outcome:
      "TypeScript and Python public labels are provenance evidence only, and developer labels deny WASM/WASI isolation or sandbox certification.",
    limitations: [
      "Provider-grade provenance is evidence for source/artifact identity, not isolation.",
    ],
  },
  {
    id: "rust-zig-immutable-wasi-preview1",
    kind: "rust-zig-wasm-wasi-preview1-artifact",
    requirements: ["SBOX-01", "LABEL-01", "LABEL-02"],
    files: [
      "packages/spec/src/runtime.ts",
      "packages/runtime-wasm-wasi/src/validation.ts",
      "apps/go-backend/live_backend.go",
    ],
    commands: [
      "pnpm --filter @cowards/spec exec vitest run src/spec.test.ts",
      "pnpm wasm-wasi:evaluate:check",
    ],
    outcome:
      "Rust and Zig remain immutable WASM/WASI Preview 1 artifact-backed lanes with evidence-scoped labels.",
    limitations: [
      "Direct-export, Component Model, and WIT ABI promotion remain future scoped.",
    ],
  },
  {
    id: "tinygo-hidden-spike-only",
    kind: "tinygo-hidden-spike-only",
    requirements: ["SBOX-01", "LABEL-01", "LABEL-02"],
    files: [
      "packages/spec/src/runtime.ts",
      "apps/web/app/learn/page.test.ts",
      "apps/web/app/matchsets/evidence-copy.test.ts",
      "scripts/check-boundary-monitors.ts",
    ],
    commands: [
      "pnpm tinygo-wasi:spike:check",
      "pnpm --filter @cowards/web exec vitest run app/learn/page.test.ts app/matchsets/evidence-copy.test.ts",
    ],
    outcome:
      "TinyGo remains a hidden spike-only lane and is absent from public/default production-facing copy.",
    limitations: [
      "TinyGo production support requires a future explicit productionization milestone.",
    ],
  },
  {
    id: "claim-drift-monitor",
    kind: "fail-loud-claim-drift-monitor",
    requirements: ["SBOX-02", "LABEL-02"],
    files: [
      "scripts/evaluate-v1-35-sandbox-readiness-proof.ts",
      "package.json",
    ],
    commands: [
      "pnpm v1.35:sandbox-readiness-proof:check",
      "pnpm boundary:monitors",
    ],
    outcome:
      "Boundary monitors include a fail-loud proof gate for forbidden sandbox, TinyGo, package, and ABI overclaims.",
    limitations: [],
  },
]

const sourceChecks = (repo: string): string[] => {
  const checks: string[] = []
  const runtimeSpec = readRepoFile(repo, "packages/spec/src/runtime.ts")
  const goBackend = readRepoFile(repo, "apps/go-backend/live_backend.go")
  const packageJson = readRepoFile(repo, "package.json")

  const requiredSpecSnippets = [
    "STRATEGY_RUNTIME_SANDBOX_READINESS_CONTRACT_VERSION",
    "productionSandboxCertification: false",
    'publicLabel: "Provenance evidence only"',
    'publicLabel: "WASM/WASI artifact-backed evidence"',
    'publicLabel: "Hidden spike-only lane"',
    "TinyGo remains hidden and spike-only",
    "not WASM/WASI isolation or sandbox certification",
  ] as const
  for (const snippet of requiredSpecSnippets) {
    if (!runtimeSpec.includes(snippet)) {
      checks.push(`runtime spec missing ${snippet}`)
    }
  }
  if (runtimeSpec.includes("productionSandboxCertification: true")) {
    checks.push("runtime spec must not certify any production sandbox")
  }
  if (runtimeSpec.includes('"Production candidate"')) {
    checks.push("runtime spec must not publish Production candidate labels")
  }

  const requiredGoSnippets = [
    "sandboxReadinessLabel",
    "Provenance evidence only",
    "WASM/WASI artifact-backed evidence",
    "Runtime containment evidence only",
  ] as const
  for (const snippet of requiredGoSnippets) {
    if (!goBackend.includes(snippet)) {
      checks.push(`Go backend missing ${snippet}`)
    }
  }
  if (goBackend.includes('"Production candidate"')) {
    checks.push("Go backend must not publish Production candidate labels")
  }

  if (!packageJson.includes("v1.35:sandbox-readiness-proof:check")) {
    checks.push("boundary monitors must include sandbox readiness proof check")
  }

  for (const [file, text] of [
    ["packages/spec/src/runtime.ts", runtimeSpec],
    ["apps/go-backend/live_backend.go", goBackend],
  ] as const) {
    for (const pattern of positiveOverclaimPatterns) {
      if (pattern.test(text)) {
        checks.push(`${file} contains forbidden positive sandbox overclaim`)
      }
    }
  }

  return checks
}

export const generateV135SandboxReadinessProof = (
  repo: string = repoRoot,
  rows: readonly V135SandboxReadinessEvidenceRow[] = defaultEvidenceRows,
): V135SandboxReadinessProof => {
  assertStrategyRuntimeSandboxReadinessContract()
  return {
    schemaVersion: sandboxReadinessProofSchemaVersion,
    milestone: "v1.35",
    phase: 246,
    generatedAt: sandboxReadinessProofGeneratedAt,
    generatedBy: sandboxReadinessProofGeneratedBy,
    contractVersion: STRATEGY_RUNTIME_SANDBOX_READINESS_CONTRACT_VERSION,
    requiredRequirements: requiredSandboxReadinessRequirements,
    requiredEvidenceKinds: requiredSandboxReadinessEvidenceKinds,
    guardrails: {
      productionSandboxCertification: false,
      typeScriptPythonWasmIsolation: false,
      tinyGoProductionSupport: false,
      packageEcosystemSupport: false,
      directExportOrComponentModelAbiPromotion: false,
    },
    laneClaims: STRATEGY_RUNTIME_SANDBOX_READINESS_CLAIMS,
    sourceChecks: sourceChecks(repo),
    evidence: rows,
  }
}

export const validateV135SandboxReadinessProof = (
  proof: V135SandboxReadinessProof,
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
  if (proof.guardrails.productionSandboxCertification !== false) {
    errors.push("production sandbox certification must remain false")
  }
  if (proof.guardrails.typeScriptPythonWasmIsolation !== false) {
    errors.push("TypeScript/Python WASM isolation must remain false")
  }
  if (proof.guardrails.tinyGoProductionSupport !== false) {
    errors.push("TinyGo production support must remain false")
  }
  if (proof.guardrails.packageEcosystemSupport !== false) {
    errors.push("package ecosystem support must remain false")
  }
  if (proof.guardrails.directExportOrComponentModelAbiPromotion !== false) {
    errors.push(
      "direct-export/Component Model/WIT ABI promotion must remain false",
    )
  }
  const typeScriptClaim = getStrategyRuntimeSandboxReadinessClaim("typescript")
  const pythonClaim = getStrategyRuntimeSandboxReadinessClaim("python")
  const rustClaim = getStrategyRuntimeSandboxReadinessClaim("rust")
  const zigClaim = getStrategyRuntimeSandboxReadinessClaim("zig")
  const tinyGoClaim = getStrategyRuntimeSandboxReadinessClaim("tinygo")
  if (
    typeScriptClaim?.evidenceClass !== "source-artifact-provenance" ||
    pythonClaim?.evidenceClass !== "source-artifact-provenance"
  ) {
    errors.push("TypeScript/Python must remain provenance-only")
  }
  if (
    rustClaim?.artifactPosture !== "immutable-wasm-wasi-preview1" ||
    zigClaim?.artifactPosture !== "immutable-wasm-wasi-preview1"
  ) {
    errors.push("Rust/Zig must remain immutable WASM/WASI Preview 1")
  }
  if (!tinyGoClaim?.unavailableInProduction) {
    errors.push("TinyGo must remain hidden/unavailable in production")
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

export const renderV135SandboxReadinessProofJson = (
  proof: V135SandboxReadinessProof,
): string => `${JSON.stringify(proof, null, 2)}\n`

export const renderV135SandboxReadinessProofMarkdown = (
  proof: V135SandboxReadinessProof,
): string => `# v1.35 Sandbox Readiness Proof

**Generated:** ${proof.generatedAt}  
**Phase:** ${proof.phase}  
**Schema:** ${proof.schemaVersion}  
**Contract:** ${proof.contractVersion}

This artifact records the Phase 246 sandbox-readiness contract. It distinguishes runtime containment, source/artifact provenance, immutable WASM/WASI Preview 1 artifact backing, hidden spike-only lanes, and unavailable production certification.

## Guardrails

| Guardrail | Value |
| --- | --- |
| Production sandbox certification | ${proof.guardrails.productionSandboxCertification} |
| TypeScript/Python WASM isolation | ${proof.guardrails.typeScriptPythonWasmIsolation} |
| TinyGo production support | ${proof.guardrails.tinyGoProductionSupport} |
| Package ecosystem support | ${proof.guardrails.packageEcosystemSupport} |
| Direct-export/Component Model/WIT ABI promotion | ${proof.guardrails.directExportOrComponentModelAbiPromotion} |

## Lane Claims

| Lane | Evidence | Artifact posture | Public label | Developer label |
| --- | --- | --- | --- | --- |
${proof.laneClaims
  .map(
    (claim) =>
      `| ${markdownEscape(claim.laneId)} | ${markdownEscape(claim.evidenceClass)} | ${markdownEscape(claim.artifactPosture)} | ${markdownEscape(claim.publicLabel)} | ${markdownEscape(claim.developerLabel)} |`,
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

export const writeV135SandboxReadinessProofArtifacts = (
  repo: string = repoRoot,
): V135SandboxReadinessProof => {
  const proof = generateV135SandboxReadinessProof(repo)
  const errors = validateV135SandboxReadinessProof(proof)
  if (errors.length) {
    throw new Error(
      `Invalid v1.35 sandbox readiness proof:\n${errors.join("\n")}`,
    )
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, sandboxReadinessArtifactPaths.json),
    renderV135SandboxReadinessProofJson(proof),
  )
  writeFileSync(
    path.join(repo, sandboxReadinessArtifactPaths.markdown),
    renderV135SandboxReadinessProofMarkdown(proof),
  )
  return proof
}

export const checkV135SandboxReadinessProofArtifacts = (
  repo: string = repoRoot,
): string[] => {
  const proof = generateV135SandboxReadinessProof(repo)
  const errors = validateV135SandboxReadinessProof(proof)
  const expectedJson = renderV135SandboxReadinessProofJson(proof)
  const expectedMarkdown = renderV135SandboxReadinessProofMarkdown(proof)
  const jsonPath = path.join(repo, sandboxReadinessArtifactPaths.json)
  const markdownPath = path.join(repo, sandboxReadinessArtifactPaths.markdown)
  if (
    !existsSync(jsonPath) ||
    readFileSync(jsonPath, "utf8") !== expectedJson
  ) {
    errors.push(`${sandboxReadinessArtifactPaths.json} is stale`)
  }
  if (
    !existsSync(markdownPath) ||
    readFileSync(markdownPath, "utf8") !== expectedMarkdown
  ) {
    errors.push(`${sandboxReadinessArtifactPaths.markdown} is stale`)
  }
  return errors
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  if (args.has("--write")) {
    writeV135SandboxReadinessProofArtifacts()
    console.log("wrote v1.35 sandbox readiness proof artifacts")
    return
  }
  if (args.has("--check")) {
    const errors = checkV135SandboxReadinessProofArtifacts()
    if (errors.length) {
      console.error("v1.35 sandbox readiness proof artifacts are stale:")
      for (const error of errors) {
        console.error(`- ${error}`)
      }
      process.exit(1)
    }
    console.log("v1.35 sandbox readiness proof artifacts are current")
    return
  }
  console.log(
    renderV135SandboxReadinessProofMarkdown(
      generateV135SandboxReadinessProof(),
    ),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
