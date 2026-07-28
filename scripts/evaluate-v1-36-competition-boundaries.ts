#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
// eslint-disable-next-line no-restricted-imports -- Root evaluators execute the spec source directly.
import {
  assertCompetitionPolicyV136PublicLeakSafe,
  assertPublicCompetitionGovernanceLeakSafe,
  assertPublicOutputLeakSafe,
} from "../packages/spec/src/index.ts"
import {
  checkV136CompetitionPolicyScan,
  checkV136CompetitionSurfaceInventoryArtifacts,
  createV136CompetitionPolicyPhase249ScanSuppressions,
} from "./evaluate-v1-36-competition-policy.ts"
import {
  checkV136ServiceProofArtifacts,
  readV136ServiceProofArtifact,
  requiredV136GovernanceScenarioIds,
  validateV136ServiceProof,
  v136ServiceProofArtifactPaths,
  type V136ServiceProof,
  type V136ServiceProofScenario,
} from "./evaluate-v1-36-service-proof.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const v136CompetitionBoundarySchemaVersion =
  "v1.36-governance-boundary-proof" as const
export const v136CompetitionBoundaryGeneratedBy =
  "scripts/evaluate-v1-36-competition-boundaries.ts" as const
export const v136CompetitionBoundaryArtifactPaths = {
  json: ".planning/artifacts/v1.36-governance-boundary-proof.json",
  markdown: ".planning/artifacts/v1.36-governance-boundary-proof.md",
} as const

export interface V136BoundaryHash {
  path: string
  sha256: string
}

export interface V136BoundaryMonitor {
  id: "competition-policy" | "public-privacy" | "ownership-boundaries"
  status: "passed" | "failed"
  checkedFiles: readonly string[]
}

export interface V136GovernanceBoundaryProof {
  schemaVersion: typeof v136CompetitionBoundarySchemaVersion
  milestone: "v1.36"
  phase: 255
  generatedAt: string
  generatedBy: typeof v136CompetitionBoundaryGeneratedBy
  status: "passed" | "incomplete"
  serviceStatus: V136ServiceProof["status"]
  requiredGovernanceScenarioIds: readonly string[]
  governanceScenarios: readonly V136ServiceProofScenario[]
  monitors: readonly V136BoundaryMonitor[]
  scannedFiles: readonly V136BoundaryHash[]
  artifactHashes: readonly V136BoundaryHash[]
  limitation: string | null
}

export interface GenerateV136CompetitionBoundaryOptions {
  now?: Date
  requireServiceProof?: boolean
  policyFailures?: readonly string[]
  ownershipFailures?: readonly string[]
  scanFiles?: readonly string[]
}

interface BoundaryInputs {
  proof: V136GovernanceBoundaryProof
  serviceFailures: string[]
  policyFailures: string[]
  ownershipFailures: string[]
  privacyFailures: string[]
}

const sha256Pattern = /^[a-f0-9]{64}$/
const sourceAssignmentPattern =
  /\b(strategySource|strategyMemory|soldierMemory|objectivePayload|rawDiagnostics|ownerDebug|reporterUserId|operatorUserId|recoveryEvidence|auditPayload|databaseUrl|dbDsn)\b\s*[:=]/i
const concreteValueMarkers = [
  "/Users/",
  "/home/",
  "postgres://",
  "postgresql://",
  "Bearer ",
  "GOLDEN_PRIVATE_",
  "PRIVATE_ARTIFACT_",
  "site-packages/",
  "node_modules/",
] as const

const relative = (file: string): string => file.split(path.sep).join("/")
const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("hex")
const hashFile = (repo: string, file: string): V136BoundaryHash => ({
  path: relative(file),
  sha256: sha256(readFileSync(path.join(repo, file), "utf8")),
})

const listFiles = (repo: string, relativeRoot: string): string[] => {
  const fullRoot = path.join(repo, relativeRoot)
  if (!existsSync(fullRoot)) return []
  if (!statSync(fullRoot).isDirectory()) return [relativeRoot]
  return readdirSync(fullRoot)
    .flatMap((entry) => listFiles(repo, path.join(relativeRoot, entry)))
    .sort()
}

const defaultScanFiles = (repo: string): string[] => [
  v136ServiceProofArtifactPaths.json,
  v136ServiceProofArtifactPaths.markdown,
  ".planning/artifacts/v1.36-competition-surface-inventory.json",
  ".planning/artifacts/v1.36-competition-surface-inventory.md",
  "packages/spec/artifacts/service-api-v1.8.openapi.json",
  ...listFiles(repo, "apps/go-backend/testdata/service-fixtures").filter(
    (file) => file.endsWith(".json"),
  ),
  "apps/web/app/competitions/page.tsx",
  "apps/web/app/competitions/[competitionId]/page.tsx",
  "apps/web/app/competitions/fair-play/page.tsx",
  "apps/web/app/ladder/[seasonId]/page.tsx",
  "apps/web/app/matchsets/result-view-model.ts",
  "apps/web/app/matches/server.ts",
]

const guardValue = (value: unknown, label: string): string[] => {
  const failures: string[] = []
  for (const guard of [
    assertPublicOutputLeakSafe,
    assertPublicCompetitionGovernanceLeakSafe,
    assertCompetitionPolicyV136PublicLeakSafe,
  ]) {
    try {
      guard(value)
    } catch (error) {
      failures.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  return failures
}

const scanPublicFiles = (
  repo: string,
  files: readonly string[],
): { hashes: V136BoundaryHash[]; failures: string[] } => {
  const hashes: V136BoundaryHash[] = []
  const failures: string[] = []
  for (const file of [...new Set(files)].sort()) {
    const fullPath = path.join(repo, file)
    if (!existsSync(fullPath)) {
      failures.push(`${relative(file)} is missing from the privacy scan`)
      continue
    }
    const text = readFileSync(fullPath, "utf8")
    hashes.push({ path: relative(file), sha256: sha256(text) })
    for (const marker of concreteValueMarkers) {
      if (text.includes(marker)) {
        failures.push(`${relative(file)} contains private marker ${marker}`)
      }
    }
    if (/[A-Za-z]:\\/.test(text)) {
      failures.push(`${relative(file)} contains an absolute Windows path`)
    }
    if (file.endsWith(".json")) {
      try {
        const value = JSON.parse(text) as unknown
        const isProofArtifact = file.includes("v1.36-")
        if (isProofArtifact) failures.push(...guardValue(value, relative(file)))
      } catch {
        failures.push(`${relative(file)} is invalid JSON`)
      }
    } else if (sourceAssignmentPattern.test(text)) {
      failures.push(`${relative(file)} contains a private-field assignment`)
    }
  }
  return { hashes, failures: [...new Set(failures)] }
}

const currentPolicyFailures = (repo: string): string[] => {
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

const currentOwnershipFailures = (repo: string): string[] => {
  const files = {
    "scripts/check-boundary-monitors.ts": [
      "checkNoStrategyExecutionOutsideRuntimeBoundary",
      "checkV136CompetitionPolicyMonitor",
      "knownReportOnlyBoundaryOffenses",
      "nodeVmSecurityBoundaryAllowed",
      "assertPublicCompetitionGovernanceLeakSafe",
    ],
    "packages/spec/src/competition-policy-v1-36.ts": [
      "COMPETITION_POLICY_V1_36_AUTHORITY_OWNERS",
      "goBackendOrchestration",
      "runtimeServiceProviderBoundary",
      "webProjection",
    ],
    "package.json": ["boundary:monitors", "check-boundary-monitors.ts"],
  } as const
  const failures: string[] = []
  for (const [file, markers] of Object.entries(files)) {
    const fullPath = path.join(repo, file)
    if (!existsSync(fullPath)) {
      failures.push(`${file} is missing`)
      continue
    }
    const text = readFileSync(fullPath, "utf8")
    for (const marker of markers) {
      if (!text.includes(marker)) failures.push(`${file} is missing ${marker}`)
    }
  }
  return failures
}

const requiredGovernanceScenarios = (
  service: V136ServiceProof,
): V136ServiceProofScenario[] =>
  [...service.scenarios]
    .filter((scenario) =>
      (requiredV136GovernanceScenarioIds as readonly string[]).includes(
        scenario.id,
      ),
    )
    .sort((left, right) => left.id.localeCompare(right.id))

const monitorHashFiles = [
  "scripts/check-boundary-monitors.ts",
  "packages/spec/src/public-output-privacy.ts",
  "packages/spec/src/competition-governance.ts",
  "packages/spec/src/competition-policy-v1-36.ts",
] as const

const collectBoundaryInputs = (
  repo: string,
  options: GenerateV136CompetitionBoundaryOptions = {},
): BoundaryInputs => {
  const service = readV136ServiceProofArtifact(repo)
  const serviceFailures = checkV136ServiceProofArtifacts(repo, {
    now: options.now,
    requireServiceProof: false,
  })
  serviceFailures.push(
    ...validateV136ServiceProof(service, {
      now: options.now,
      requireServiceProof: false,
    }),
  )
  const policyFailures = [
    ...(options.policyFailures ?? currentPolicyFailures(repo)),
  ]
  const ownershipFailures = [
    ...(options.ownershipFailures ?? currentOwnershipFailures(repo)),
  ]
  const scan = scanPublicFiles(
    repo,
    options.scanFiles ?? defaultScanFiles(repo),
  )
  const governanceScenarios = requiredGovernanceScenarios(service)
  const governancePassed = requiredV136GovernanceScenarioIds.every((id) =>
    governanceScenarios.some(
      (scenario) => scenario.id === id && scenario.status === "passed",
    ),
  )
  const passed =
    service.status === "passed-local-services" &&
    serviceFailures.length === 0 &&
    policyFailures.length === 0 &&
    ownershipFailures.length === 0 &&
    scan.failures.length === 0 &&
    governancePassed
  const artifactFiles = [
    v136ServiceProofArtifactPaths.json,
    v136ServiceProofArtifactPaths.markdown,
    ".planning/artifacts/v1.36-competition-surface-inventory.json",
    ".planning/artifacts/v1.36-competition-surface-inventory.md",
    ...monitorHashFiles,
  ]
  const artifactHashes = [...new Set(artifactFiles)]
    .filter((file) => existsSync(path.join(repo, file)))
    .sort()
    .map((file) => hashFile(repo, file))
  const limitation = passed
    ? null
    : service.status === "not-run-environment-unavailable"
      ? service.limitation
      : "Live governance or boundary evidence is incomplete."

  return {
    proof: {
      schemaVersion: v136CompetitionBoundarySchemaVersion,
      milestone: "v1.36",
      phase: 255,
      generatedAt: service.generatedAt,
      generatedBy: v136CompetitionBoundaryGeneratedBy,
      status: passed ? "passed" : "incomplete",
      serviceStatus: service.status,
      requiredGovernanceScenarioIds: [...requiredV136GovernanceScenarioIds],
      governanceScenarios,
      monitors: [
        {
          id: "competition-policy",
          status: policyFailures.length ? "failed" : "passed",
          checkedFiles: [
            ".planning/artifacts/v1.36-competition-surface-inventory.json",
            ".planning/artifacts/v1.36-competition-surface-inventory.md",
          ],
        },
        {
          id: "public-privacy",
          status: scan.failures.length ? "failed" : "passed",
          checkedFiles: scan.hashes.map((entry) => entry.path),
        },
        {
          id: "ownership-boundaries",
          status: ownershipFailures.length ? "failed" : "passed",
          checkedFiles: [...monitorHashFiles],
        },
      ],
      scannedFiles: scan.hashes,
      artifactHashes,
      limitation,
    },
    serviceFailures: [...new Set(serviceFailures)],
    policyFailures,
    ownershipFailures,
    privacyFailures: scan.failures,
  }
}

export const generateV136CompetitionBoundaryProof = (
  repo: string = repoRoot,
  options: GenerateV136CompetitionBoundaryOptions = {},
): V136GovernanceBoundaryProof => collectBoundaryInputs(repo, options).proof

export const validateV136CompetitionBoundaryProof = (
  proof: V136GovernanceBoundaryProof,
  options: Pick<
    GenerateV136CompetitionBoundaryOptions,
    "requireServiceProof"
  > = {},
): string[] => {
  const errors: string[] = []
  if (proof.schemaVersion !== v136CompetitionBoundarySchemaVersion) {
    errors.push(`schemaVersion must be ${v136CompetitionBoundarySchemaVersion}`)
  }
  if (proof.milestone !== "v1.36" || proof.phase !== 255) {
    errors.push("milestone and phase must identify v1.36 Phase 255")
  }
  for (const id of requiredV136GovernanceScenarioIds) {
    if (!proof.requiredGovernanceScenarioIds.includes(id)) {
      errors.push(`required governance catalog is missing ${id}`)
    }
  }
  if (
    new Set(proof.requiredGovernanceScenarioIds).size !==
    proof.requiredGovernanceScenarioIds.length
  ) {
    errors.push("required governance scenario ids must be unique")
  }
  for (const monitorId of [
    "competition-policy",
    "public-privacy",
    "ownership-boundaries",
  ] as const) {
    if (!proof.monitors.some((monitor) => monitor.id === monitorId)) {
      errors.push(`missing monitor ${monitorId}`)
    }
  }
  for (const hash of [...proof.scannedFiles, ...proof.artifactHashes]) {
    if (
      !hash.path ||
      path.isAbsolute(hash.path) ||
      !sha256Pattern.test(hash.sha256)
    ) {
      errors.push(
        `invalid public artifact hash for ${hash.path || "<missing>"}`,
      )
    }
  }
  if (proof.status === "passed") {
    if (proof.serviceStatus !== "passed-local-services") {
      errors.push("passed boundary proof requires passed service evidence")
    }
    if (proof.monitors.some((monitor) => monitor.status !== "passed")) {
      errors.push("passed boundary proof requires every monitor to pass")
    }
    for (const id of requiredV136GovernanceScenarioIds) {
      if (
        !proof.governanceScenarios.some(
          (row) => row.id === id && row.status === "passed",
        )
      ) {
        errors.push(
          `passed boundary proof is missing governance scenario ${id}`,
        )
      }
    }
    if (proof.limitation !== null)
      errors.push("passed boundary proof cannot have a limitation")
  } else if (!proof.limitation) {
    errors.push("incomplete boundary proof requires a limitation")
  }
  if (options.requireServiceProof && proof.status !== "passed") {
    errors.push("strict mode requires passed governance boundary evidence")
  }
  errors.push(...guardValue(proof, "governance boundary proof"))
  return [...new Set(errors)]
}

export const renderV136CompetitionBoundaryJson = (
  proof: V136GovernanceBoundaryProof,
): string => `${JSON.stringify(proof, null, 2)}\n`

const md = (value: string): string => value.replaceAll("|", "\\|")

export const renderV136CompetitionBoundaryMarkdown = (
  proof: V136GovernanceBoundaryProof,
): string => `# v1.36 Governance Boundary Proof

**Generated:** ${proof.generatedAt}  
**Status:** ${proof.status}  
**Service status:** ${proof.serviceStatus}

This aggregate records coarse public scenario outcomes, current monitor status, and content hashes. It stores no captured public bodies or private workflow evidence.

## Governance Scenarios

| ID | Status | Outcome |
| --- | --- | --- |
${
  proof.governanceScenarios.length
    ? proof.governanceScenarios
        .map((row) => `| ${row.id} | ${row.status} | ${md(row.outcome)} |`)
        .join("\n")
    : "| None | not-run | Live governance evidence is not present. |"
}

## Monitors

| Monitor | Status | Checked files |
| --- | --- | --- |
${proof.monitors
  .map(
    (monitor) =>
      `| ${monitor.id} | ${monitor.status} | ${monitor.checkedFiles.join("<br>")} |`,
  )
  .join("\n")}

## Artifact Hashes

${proof.artifactHashes.map((entry) => `- ${entry.path}: \`${entry.sha256}\``).join("\n")}

## Limitation

${proof.limitation ?? "None"}
`

export const writeV136CompetitionBoundaryArtifacts = (
  repo: string = repoRoot,
  options: GenerateV136CompetitionBoundaryOptions = {},
): V136GovernanceBoundaryProof => {
  const inputs = collectBoundaryInputs(repo, options)
  const hardFailures = [
    ...inputs.serviceFailures,
    ...inputs.policyFailures,
    ...inputs.ownershipFailures,
    ...inputs.privacyFailures,
  ]
  const errors = [
    ...hardFailures,
    ...validateV136CompetitionBoundaryProof(inputs.proof, options),
  ]
  if (errors.length) {
    throw new Error(
      `Invalid v1.36 competition boundary proof:\n${errors.join("\n")}`,
    )
  }
  mkdirSync(path.join(repo, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(repo, v136CompetitionBoundaryArtifactPaths.json),
    renderV136CompetitionBoundaryJson(inputs.proof),
  )
  writeFileSync(
    path.join(repo, v136CompetitionBoundaryArtifactPaths.markdown),
    renderV136CompetitionBoundaryMarkdown(inputs.proof),
  )
  return inputs.proof
}

export const checkV136CompetitionBoundaryArtifacts = (
  repo: string = repoRoot,
  options: GenerateV136CompetitionBoundaryOptions = {},
): string[] => {
  const jsonPath = path.join(repo, v136CompetitionBoundaryArtifactPaths.json)
  const markdownPath = path.join(
    repo,
    v136CompetitionBoundaryArtifactPaths.markdown,
  )
  if (!existsSync(jsonPath))
    return [`${v136CompetitionBoundaryArtifactPaths.json} is missing`]
  let actual: V136GovernanceBoundaryProof
  try {
    actual = JSON.parse(
      readFileSync(jsonPath, "utf8"),
    ) as V136GovernanceBoundaryProof
  } catch {
    return [`${v136CompetitionBoundaryArtifactPaths.json} is invalid JSON`]
  }
  const inputs = collectBoundaryInputs(repo, options)
  const errors = [
    ...inputs.serviceFailures,
    ...inputs.policyFailures,
    ...inputs.ownershipFailures,
    ...inputs.privacyFailures,
    ...validateV136CompetitionBoundaryProof(actual, options),
  ]
  if (
    readFileSync(jsonPath, "utf8") !==
    renderV136CompetitionBoundaryJson(inputs.proof)
  ) {
    errors.push(`${v136CompetitionBoundaryArtifactPaths.json} is stale`)
  }
  if (!existsSync(markdownPath)) {
    errors.push(`${v136CompetitionBoundaryArtifactPaths.markdown} is missing`)
  } else if (
    readFileSync(markdownPath, "utf8") !==
    renderV136CompetitionBoundaryMarkdown(inputs.proof)
  ) {
    errors.push(`${v136CompetitionBoundaryArtifactPaths.markdown} is stale`)
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
      writeV136CompetitionBoundaryArtifacts(repoRoot, options)
      console.log("wrote v1.36 governance boundary proof artifacts")
      return
    }
    if (args.has("--check")) {
      const errors = checkV136CompetitionBoundaryArtifacts(repoRoot, options)
      if (errors.length) {
        console.error("v1.36 competition boundary check failed:")
        errors.forEach((error) => console.error(`- ${error}`))
        process.exitCode = 1
        return
      }
      console.log("v1.36 governance boundary proof artifacts are current")
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
