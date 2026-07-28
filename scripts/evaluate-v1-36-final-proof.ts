#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
// eslint-disable-next-line no-restricted-imports -- Root evaluators execute the spec source directly.
import {
  assertCompetitionPolicyV136PublicLeakSafe,
  assertPublicCompetitionGovernanceLeakSafe,
  assertPublicOutputLeakSafe,
} from "../packages/spec/src/index.ts"
import {
  checkV136CompetitionBoundaryArtifacts,
  validateV136CompetitionBoundaryProof,
  v136CompetitionBoundaryArtifactPaths,
  type GenerateV136CompetitionBoundaryOptions,
  type V136GovernanceBoundaryProof,
} from "./evaluate-v1-36-competition-boundaries.ts"
import {
  checkV136CompetitionPolicyScan,
  checkV136CompetitionSurfaceInventoryArtifacts,
  createV136CompetitionPolicyPhase249ScanSuppressions,
} from "./evaluate-v1-36-competition-policy.ts"
import {
  checkV136ServiceProofArtifacts,
  readV136ServiceProofArtifact,
  requiredV136BrowserScenarioIds,
  requiredV136NegativeScenarioIds,
  requiredV136PositiveScenarioIds,
  v136ServiceProofArtifactPaths,
  type V136ServiceProof,
} from "./evaluate-v1-36-service-proof.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const v136FinalProofSchemaVersion = "v1.36-final-proof" as const
export const v136FinalProofGeneratedBy =
  "scripts/evaluate-v1-36-final-proof.ts" as const
export const v136FinalProofArtifactPaths = {
  json: ".planning/artifacts/v1.36-final-proof.json",
  markdown: ".planning/artifacts/v1.36-final-proof.md",
} as const

export type V136ProofRequirement =
  | "PROOF-01"
  | "PROOF-02"
  | "PROOF-03"
  | "PROOF-04"
  | "PROOF-05"
  | "PROOF-06"

export type V136FinalEvidenceKind =
  | "focused-tests"
  | "live-positive-service"
  | "live-negative-matrix"
  | "live-governance"
  | "privacy-scan"
  | "ownership-monitor"
  | "live-browser-realism"
  | "deterministic-browser-realism"

export interface V136FinalHash {
  path: string
  sha256: string
}

export interface V136FocusedTestCoverage {
  id: string
  requirements: readonly V136ProofRequirement[]
  command: string
  files: readonly V136FinalHash[]
}

export interface V136FinalEvidence {
  id: string
  kind: V136FinalEvidenceKind
  status: "passed" | "incomplete"
  requirements: readonly V136ProofRequirement[]
  command: string
  artifacts: readonly string[]
}

export interface V136FinalRequirementResult {
  id: V136ProofRequirement
  status: "passed" | "incomplete"
  evidenceIds: readonly string[]
}

export interface V136FinalProof {
  schemaVersion: typeof v136FinalProofSchemaVersion
  milestone: "v1.36"
  phase: 255
  generatedAt: string
  generatedBy: typeof v136FinalProofGeneratedBy
  status: "passed" | "incomplete"
  strictServiceRequiredForPass: true
  serviceStatus: V136ServiceProof["status"]
  boundaryStatus: V136GovernanceBoundaryProof["status"]
  requirements: readonly V136FinalRequirementResult[]
  evidence: readonly V136FinalEvidence[]
  focusedTests: readonly V136FocusedTestCoverage[]
  artifactHashes: readonly V136FinalHash[]
  limitation: string | null
}

export interface GenerateV136FinalProofOptions {
  now?: Date
  requireServiceProof?: boolean
  policyFailures?: readonly string[]
  boundaryOptions?: GenerateV136CompetitionBoundaryOptions
  focusedTestCatalog?: readonly FocusedTestCatalogRow[]
}

interface FocusedTestCatalogRow {
  id: string
  requirements: readonly V136ProofRequirement[]
  command: string
  files: readonly string[]
}

interface FinalInputs {
  proof: V136FinalProof
  serviceFailures: string[]
  boundaryFailures: string[]
  policyFailures: string[]
  focusedTestFailures: string[]
}

export const requiredV136FinalRequirements = [
  "PROOF-01",
  "PROOF-02",
  "PROOF-03",
  "PROOF-04",
  "PROOF-05",
  "PROOF-06",
] as const satisfies readonly V136ProofRequirement[]

export const requiredV136FinalEvidenceKinds = [
  "focused-tests",
  "live-positive-service",
  "live-negative-matrix",
  "live-governance",
  "privacy-scan",
  "ownership-monitor",
  "live-browser-realism",
  "deterministic-browser-realism",
] as const satisfies readonly V136FinalEvidenceKind[]

const focusedTestCatalog: readonly FocusedTestCatalogRow[] = [
  {
    id: "phase250-entry-eligibility",
    requirements: ["PROOF-01", "PROOF-02"],
    command:
      "pnpm exec vitest run packages/spec/src/competition-entry-eligibility.test.ts apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts",
    files: [
      "packages/spec/src/competition-entry-eligibility.test.ts",
      "apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts",
    ],
  },
  {
    id: "phase251-season-lifecycle",
    requirements: ["PROOF-01", "PROOF-02"],
    command:
      "pnpm exec vitest run packages/spec/src/competition-season-policy.test.ts packages/persistence/src/ladder.test.ts",
    files: [
      "packages/spec/src/competition-season-policy.test.ts",
      "packages/persistence/src/ladder.test.ts",
    ],
  },
  {
    id: "phase252-counted-standings",
    requirements: ["PROOF-01", "PROOF-03"],
    command:
      "pnpm exec vitest run packages/spec/src/competition-counted-state.test.ts packages/persistence/src/competition.test.ts",
    files: [
      "packages/spec/src/competition-counted-state.test.ts",
      "packages/persistence/src/competition.test.ts",
    ],
  },
  {
    id: "phase253-governance",
    requirements: ["PROOF-03", "PROOF-04", "PROOF-05"],
    command:
      "pnpm exec vitest run packages/spec/src/competition-governance.test.ts packages/persistence/src/governance.test.ts apps/web/app/api/admin/matchsets/governance/route.test.ts",
    files: [
      "packages/spec/src/competition-governance.test.ts",
      "packages/persistence/src/governance.test.ts",
      "apps/web/app/api/admin/matchsets/governance/route.test.ts",
    ],
  },
  {
    id: "phase254-public-trust",
    requirements: ["PROOF-04", "PROOF-06"],
    command:
      "pnpm exec vitest run apps/web/app/competition-trust-projections.test.ts apps/web/lib/public-discovery-service.test.ts packages/spec/src/public-discovery.test.ts",
    files: [
      "apps/web/app/competition-trust-projections.test.ts",
      "apps/web/lib/public-discovery-service.test.ts",
      "packages/spec/src/public-discovery.test.ts",
    ],
  },
]

const sha256Pattern = /^[a-f0-9]{64}$/
const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("hex")
const hashFile = (repo: string, file: string): V136FinalHash => ({
  path: file.split(path.sep).join("/"),
  sha256: sha256(readFileSync(path.join(repo, file), "utf8")),
})

const policyFailures = (repo: string): string[] => {
  const options = {
    repoRoot: repo,
    suppressions: createV136CompetitionPolicyPhase249ScanSuppressions({
      includePostureDeferrals: true,
      repoRoot: repo,
    }),
  }
  return [
    ...checkV136CompetitionSurfaceInventoryArtifacts(options),
    ...checkV136CompetitionPolicyScan(options),
  ]
}

const readJson = <T>(repo: string, file: string): T =>
  JSON.parse(readFileSync(path.join(repo, file), "utf8")) as T

const scenarioPassed = (service: V136ServiceProof, id: string): boolean =>
  service.scenarios.some(
    (scenario) => scenario.id === id && scenario.status === "passed",
  )

const hashFocusedTests = (
  repo: string,
  catalog: readonly FocusedTestCatalogRow[],
): { coverage: V136FocusedTestCoverage[]; failures: string[] } => {
  const failures: string[] = []
  const coverage = catalog.map((row) => ({
    id: row.id,
    requirements: row.requirements,
    command: row.command,
    files: row.files.flatMap((file) => {
      if (!existsSync(path.join(repo, file))) {
        failures.push(`focused test file ${file} is missing`)
        return []
      }
      return [hashFile(repo, file)]
    }),
  }))
  return { coverage, failures }
}

const artifactInputPaths = [
  ".planning/artifacts/v1.36-competition-surface-inventory.json",
  ".planning/artifacts/v1.36-competition-surface-inventory.md",
  v136ServiceProofArtifactPaths.json,
  v136ServiceProofArtifactPaths.markdown,
  v136CompetitionBoundaryArtifactPaths.json,
  v136CompetitionBoundaryArtifactPaths.markdown,
] as const

const collectFinalInputs = (
  repo: string,
  options: GenerateV136FinalProofOptions = {},
): FinalInputs => {
  const service = readV136ServiceProofArtifact(repo)
  const boundary = readJson<V136GovernanceBoundaryProof>(
    repo,
    v136CompetitionBoundaryArtifactPaths.json,
  )
  const serviceFailures = checkV136ServiceProofArtifacts(repo, {
    now: options.now,
    requireServiceProof: false,
  })
  const boundaryFailures = checkV136CompetitionBoundaryArtifacts(repo, {
    ...options.boundaryOptions,
    now: options.now,
    requireServiceProof: false,
  })
  boundaryFailures.push(
    ...validateV136CompetitionBoundaryProof(boundary, {
      requireServiceProof: false,
    }),
  )
  const currentPolicyFailures = [
    ...(options.policyFailures ?? policyFailures(repo)),
  ]
  const focused = hashFocusedTests(
    repo,
    options.focusedTestCatalog ?? focusedTestCatalog,
  )
  const focusedPassed = focused.failures.length === 0
  const positivePassed = requiredV136PositiveScenarioIds.every((id) =>
    scenarioPassed(service, id),
  )
  const negativesPassed = requiredV136NegativeScenarioIds.every((id) =>
    scenarioPassed(service, id),
  )
  const liveBrowserPassed = [
    "live-result-replay-desktop",
    "live-result-replay-mobile",
  ].every((id) => scenarioPassed(service, id))
  const fixtureBrowserPassed = scenarioPassed(
    service,
    "deterministic-replay-events",
  )
  const boundaryPassed =
    boundary.status === "passed" && boundaryFailures.length === 0
  const privacyPassed =
    boundary.monitors.some(
      (monitor) =>
        monitor.id === "public-privacy" && monitor.status === "passed",
    ) && currentPolicyFailures.length === 0
  const ownershipPassed = boundary.monitors.some(
    (monitor) =>
      monitor.id === "ownership-boundaries" && monitor.status === "passed",
  )
  const evidence: V136FinalEvidence[] = [
    {
      id: "focused-phase-250-254-tests",
      kind: "focused-tests",
      status: focusedPassed ? "passed" : "incomplete",
      requirements: requiredV136FinalRequirements,
      command:
        "pnpm exec vitest run scripts/evaluate-v1-36-service-proof.test.ts scripts/evaluate-v1-36-competition-boundaries.test.ts scripts/evaluate-v1-36-final-proof.test.ts",
      artifacts: focused.coverage.flatMap((row) =>
        row.files.map((file) => file.path),
      ),
    },
    {
      id: "live-counted-season-service-flow",
      kind: "live-positive-service",
      status: positivePassed ? "passed" : "incomplete",
      requirements: ["PROOF-01"],
      command: "pnpm e2e:v1.36-service-proof",
      artifacts: [v136ServiceProofArtifactPaths.json],
    },
    {
      id: "live-entry-rejection-matrix",
      kind: "live-negative-matrix",
      status: negativesPassed ? "passed" : "incomplete",
      requirements: ["PROOF-02"],
      command: "pnpm e2e:v1.36-service-proof",
      artifacts: [v136ServiceProofArtifactPaths.json],
    },
    {
      id: "live-governance-recompute-flow",
      kind: "live-governance",
      status: boundaryPassed ? "passed" : "incomplete",
      requirements: ["PROOF-03"],
      command: "pnpm v1.36:competition-boundaries:check",
      artifacts: [v136CompetitionBoundaryArtifactPaths.json],
    },
    {
      id: "public-competition-privacy-scan",
      kind: "privacy-scan",
      status: privacyPassed ? "passed" : "incomplete",
      requirements: ["PROOF-04"],
      command: "pnpm v1.36:competition-boundaries:check",
      artifacts: [
        v136CompetitionBoundaryArtifactPaths.json,
        ".planning/artifacts/v1.36-competition-surface-inventory.json",
      ],
    },
    {
      id: "competition-ownership-boundary-monitor",
      kind: "ownership-monitor",
      status: ownershipPassed ? "passed" : "incomplete",
      requirements: ["PROOF-05"],
      command: "pnpm exec tsx scripts/check-boundary-monitors.ts",
      artifacts: [v136CompetitionBoundaryArtifactPaths.json],
    },
    {
      id: "live-desktop-mobile-replay-realism",
      kind: "live-browser-realism",
      status: liveBrowserPassed ? "passed" : "incomplete",
      requirements: ["PROOF-06"],
      command: "pnpm e2e:v1.36-realism-proof",
      artifacts: [v136ServiceProofArtifactPaths.json],
    },
    {
      id: "deterministic-event-replay-realism",
      kind: "deterministic-browser-realism",
      status: fixtureBrowserPassed ? "passed" : "incomplete",
      requirements: ["PROOF-06"],
      command:
        "PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop --project=mobile replay.visual.spec.ts replay.fixture.spec.ts",
      artifacts: [v136ServiceProofArtifactPaths.json],
    },
  ]
  const requirements = requiredV136FinalRequirements.map((id) => {
    const rows = evidence.filter((row) => row.requirements.includes(id))
    return {
      id,
      status:
        rows.length > 0 && rows.every((row) => row.status === "passed")
          ? ("passed" as const)
          : ("incomplete" as const),
      evidenceIds: rows.map((row) => row.id),
    }
  })
  const passed =
    service.status === "passed-local-services" &&
    serviceFailures.length === 0 &&
    boundaryFailures.length === 0 &&
    currentPolicyFailures.length === 0 &&
    focused.failures.length === 0 &&
    requirements.every((row) => row.status === "passed") &&
    requiredV136BrowserScenarioIds.every((id) => scenarioPassed(service, id))
  const artifactHashes = artifactInputPaths.map((file) => hashFile(repo, file))
  const limitation = passed
    ? null
    : service.status === "not-run-environment-unavailable"
      ? service.limitation
      : "One or more v1.36 service, governance, privacy, ownership, test, or browser requirements are incomplete."

  return {
    proof: {
      schemaVersion: v136FinalProofSchemaVersion,
      milestone: "v1.36",
      phase: 255,
      generatedAt: service.generatedAt,
      generatedBy: v136FinalProofGeneratedBy,
      status: passed ? "passed" : "incomplete",
      strictServiceRequiredForPass: true,
      serviceStatus: service.status,
      boundaryStatus: boundary.status,
      requirements,
      evidence,
      focusedTests: focused.coverage,
      artifactHashes,
      limitation,
    },
    serviceFailures,
    boundaryFailures: [...new Set(boundaryFailures)],
    policyFailures: currentPolicyFailures,
    focusedTestFailures: focused.failures,
  }
}

export const generateV136FinalProof = (
  repo: string = repoRoot,
  options: GenerateV136FinalProofOptions = {},
): V136FinalProof => collectFinalInputs(repo, options).proof

const guardFailures = (proof: V136FinalProof): string[] => {
  const errors: string[] = []
  for (const guard of [
    assertPublicOutputLeakSafe,
    assertPublicCompetitionGovernanceLeakSafe,
    assertCompetitionPolicyV136PublicLeakSafe,
  ]) {
    try {
      guard(proof)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }
  return errors
}

export const validateV136FinalProof = (
  proof: V136FinalProof,
  options: Pick<GenerateV136FinalProofOptions, "requireServiceProof"> = {},
): string[] => {
  const errors: string[] = []
  if (proof.schemaVersion !== v136FinalProofSchemaVersion) {
    errors.push(`schemaVersion must be ${v136FinalProofSchemaVersion}`)
  }
  if (proof.milestone !== "v1.36" || proof.phase !== 255) {
    errors.push("milestone and phase must identify v1.36 Phase 255")
  }
  if (proof.strictServiceRequiredForPass !== true) {
    errors.push("strict service proof must remain required for pass")
  }
  for (const requirement of requiredV136FinalRequirements) {
    if (!proof.requirements.some((row) => row.id === requirement)) {
      errors.push(`missing requirement ${requirement}`)
    }
  }
  for (const kind of requiredV136FinalEvidenceKinds) {
    if (!proof.evidence.some((row) => row.kind === kind)) {
      errors.push(`missing evidence kind ${kind}`)
    }
  }
  for (const entry of [
    ...proof.artifactHashes,
    ...proof.focusedTests.flatMap((row) => row.files),
  ]) {
    if (path.isAbsolute(entry.path) || !sha256Pattern.test(entry.sha256)) {
      errors.push(`invalid current hash for ${entry.path}`)
    }
  }
  if (proof.status === "passed") {
    if (proof.serviceStatus !== "passed-local-services") {
      errors.push("passed final proof requires passed service evidence")
    }
    if (proof.boundaryStatus !== "passed") {
      errors.push("passed final proof requires passed boundary evidence")
    }
    if (proof.requirements.some((row) => row.status !== "passed")) {
      errors.push("passed final proof requires PROOF-01 through PROOF-06")
    }
    if (proof.evidence.some((row) => row.status !== "passed")) {
      errors.push("passed final proof requires every evidence kind")
    }
    if (proof.limitation !== null)
      errors.push("passed final proof cannot have a limitation")
  } else if (!proof.limitation) {
    errors.push("incomplete final proof requires a limitation")
  }
  if (options.requireServiceProof && proof.status !== "passed") {
    errors.push("strict mode requires a passed v1.36 final proof")
  }
  errors.push(...guardFailures(proof))
  return [...new Set(errors)]
}

export const renderV136FinalProofJson = (proof: V136FinalProof): string =>
  `${JSON.stringify(proof, null, 2)}\n`

export const renderV136FinalProofMarkdown = (
  proof: V136FinalProof,
): string => `# v1.36 Final Proof

**Generated:** ${proof.generatedAt}  
**Status:** ${proof.status}  
**Service status:** ${proof.serviceStatus}  
**Boundary status:** ${proof.boundaryStatus}

This Phase 255 rollup separates deterministic coverage from live service and browser evidence. A passed artifact always requires strict live service proof.

## Requirements

| Requirement | Status | Evidence |
| --- | --- | --- |
${proof.requirements
  .map(
    (row) => `| ${row.id} | ${row.status} | ${row.evidenceIds.join("<br>")} |`,
  )
  .join("\n")}

## Evidence

| ID | Kind | Status | Requirements | Command |
| --- | --- | --- | --- | --- |
${proof.evidence
  .map(
    (row) =>
      `| ${row.id} | ${row.kind} | ${row.status} | ${row.requirements.join(", ")} | \`${row.command.replaceAll("|", "\\|")}\` |`,
  )
  .join("\n")}

## Current Artifact Hashes

${proof.artifactHashes.map((entry) => `- ${entry.path}: \`${entry.sha256}\``).join("\n")}

## Focused Tests

${proof.focusedTests
  .map(
    (row) =>
      `- ${row.id}: \`${row.command}\` (${row.files.map((file) => file.path).join(", ")})`,
  )
  .join("\n")}

## Limitation

${proof.limitation ?? "None"}
`

export const writeV136FinalProofArtifacts = (
  repo: string = repoRoot,
  options: GenerateV136FinalProofOptions = {},
): V136FinalProof => {
  const inputs = collectFinalInputs(repo, options)
  const errors = [
    ...inputs.serviceFailures,
    ...inputs.boundaryFailures,
    ...inputs.policyFailures,
    ...inputs.focusedTestFailures,
    ...validateV136FinalProof(inputs.proof, options),
  ]
  if (errors.length) {
    throw new Error(`Invalid v1.36 final proof:\n${errors.join("\n")}`)
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, v136FinalProofArtifactPaths.json),
    renderV136FinalProofJson(inputs.proof),
  )
  writeFileSync(
    path.join(repo, v136FinalProofArtifactPaths.markdown),
    renderV136FinalProofMarkdown(inputs.proof),
  )
  return inputs.proof
}

export const checkV136FinalProofArtifacts = (
  repo: string = repoRoot,
  options: GenerateV136FinalProofOptions = {},
): string[] => {
  const jsonPath = path.join(repo, v136FinalProofArtifactPaths.json)
  const markdownPath = path.join(repo, v136FinalProofArtifactPaths.markdown)
  if (!existsSync(jsonPath))
    return [`${v136FinalProofArtifactPaths.json} is missing`]
  let actual: V136FinalProof
  try {
    actual = readJson<V136FinalProof>(repo, v136FinalProofArtifactPaths.json)
  } catch {
    return [`${v136FinalProofArtifactPaths.json} is invalid JSON`]
  }
  const inputs = collectFinalInputs(repo, options)
  const errors = [
    ...inputs.serviceFailures,
    ...inputs.boundaryFailures,
    ...inputs.policyFailures,
    ...inputs.focusedTestFailures,
    ...validateV136FinalProof(actual, options),
  ]
  if (
    readFileSync(jsonPath, "utf8") !== renderV136FinalProofJson(inputs.proof)
  ) {
    errors.push(`${v136FinalProofArtifactPaths.json} is stale`)
  }
  if (!existsSync(markdownPath)) {
    errors.push(`${v136FinalProofArtifactPaths.markdown} is missing`)
  } else if (
    readFileSync(markdownPath, "utf8") !==
    renderV136FinalProofMarkdown(inputs.proof)
  ) {
    errors.push(`${v136FinalProofArtifactPaths.markdown} is stale`)
  }
  return [...new Set(errors)]
}

const main = (): void => {
  const args = new Set(process.argv.slice(2))
  const options = {
    requireServiceProof:
      process.env.COWARDS_V1_36_REQUIRE_SERVICE_PROOF === "1",
  }
  try {
    if (args.has("--write")) {
      writeV136FinalProofArtifacts(repoRoot, options)
      console.log("wrote v1.36 final proof artifacts")
      return
    }
    if (args.has("--check")) {
      const errors = checkV136FinalProofArtifacts(repoRoot, options)
      if (errors.length) {
        console.error("v1.36 final proof check failed:")
        errors.forEach((error) => console.error(`- ${error}`))
        process.exitCode = 1
        return
      }
      console.log("v1.36 final proof artifacts are current")
      return
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
    return
  }
  console.error("Use --write or --check.")
  process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) main()
