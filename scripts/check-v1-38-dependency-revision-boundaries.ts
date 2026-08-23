#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import {
  readdirSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Buffer } from "node:buffer"
import ts from "typescript"
import { encodeCanonicalJson } from "../packages/spec/src/canonical-json-encode.js"
import { hashCanonicalIdentity } from "../packages/spec/src/canonical-identity-domains.js"
import type { JsonValue } from "../packages/spec/src/types.js"
import {
  V138_PLAN_262_47_FRESH_DESTINATIONS,
  checkV138CanonicalParentChain,
  checkV138Plan26247PreExecutionSourceFailureV1,
  inspectV138SourceA9Custody,
  readV138RepositoryFileNoFollow,
  validateV138CanonicalParentChain,
} from "./lib/v1-38-successor-source-seal.js"
import { V138_PLAN_262_60_CORRECTION_RUN } from
  "./lib/v1-38-source-completeness-review-v3.js"

type Sha256 = `sha256:${string}`

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const phaseDirectory =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const planBaselineCommit = "9de96e4a615d634d05fef655433d5b96b5970264" as const
const manifestPath = ".planning/artifacts/v1.38-phase-262-plan-supersession.json"
const plan26247DispositionPath =
  ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json"
const correctiveArchiveEntries = Object.freeze([
  { path: `${phaseDirectory}/archived/262-47-HISTORICAL.md`,
    sha256: "sha256:5044f497cf1d289954dc72c2b443dd4283821c52cabdda945c0e56dfffcb5a1e" as Sha256 },
  { path: `${phaseDirectory}/archived/262-48-HISTORICAL.md`,
    sha256: "sha256:8ac51a38c5b73d901dde595ed315bf497a42ce243513e056e3a67b22c37dd3d1" as Sha256 },
] as const)

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new TypeError("V138_DEPENDENCY_MANIFEST_CANONICAL_INVALID")
  return encoded.bytes
}

const identityRoot = (schemaVersion: string, value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("artifactManifest", [
    Buffer.from(schemaVersion, "utf8"),
    canonicalBytes(value),
  ])}`

const repositoryFile = (repoRoot: string, target: string): Buffer =>
  readV138RepositoryFileNoFollow(repoRoot, target, "required")!

const repositoryFilePresent = (repoRoot: string, target: string): boolean =>
  readV138RepositoryFileNoFollow(repoRoot, target, "optional") !== undefined

export const V138_DEPENDENCY_REVISION_TOOLING_DEPENDENCY = Object.freeze({
  tooling_dependency: "frozen_replay_commit_unreachable",
  frozenCommit: "4fab0afc058232f37ba11506b5d04a1d59b2f4e0",
  disposition: "unresolved_external_to_plan_262_34",
  substitutionAllowed: false,
  replayManifestMutationAllowed: false,
} as const)

const historicalPlans = Object.freeze([
  {
    planId: "262-03",
    originalExecutablePath: `${phaseDirectory}/262-03-PLAN.md`,
    archivalPath: `${phaseDirectory}/archived/262-03-HISTORICAL.md`,
    sha256: "sha256:d25cf4eede098232cc0b9022eed71da2867582f36e5bbc7c2a3f13d8681745b3",
    replacementPlans: ["262-34", "262-35"],
  },
  {
    planId: "262-04",
    originalExecutablePath: `${phaseDirectory}/262-04-PLAN.md`,
    archivalPath: `${phaseDirectory}/archived/262-04-HISTORICAL.md`,
    sha256: "sha256:7b9fbfef375f2439246740b26fa3c8c1d45baaf54f23ff884ea364fa53effc68",
    replacementPlans: ["262-35", "262-36"],
  },
  {
    planId: "262-05",
    originalExecutablePath: `${phaseDirectory}/262-05-PLAN.md`,
    archivalPath: `${phaseDirectory}/archived/262-05-HISTORICAL.md`,
    sha256: "sha256:53e027d767e2a753adc0c1d2d577cb367bd7f7808ff453d29b3e5aa6203dbcf3",
    replacementPlans: ["262-37"],
  },
  {
    planId: "262-06",
    originalExecutablePath: `${phaseDirectory}/262-06-PLAN.md`,
    archivalPath: `${phaseDirectory}/archived/262-06-HISTORICAL.md`,
    sha256: "sha256:7f07cc1f2baf300b4d4dc9200799eabbfb390a96ac7daef26905c9973ddc06b0",
    replacementPlans: ["262-38", "262-40"],
  },
  {
    planId: "262-07",
    originalExecutablePath: `${phaseDirectory}/262-07-PLAN.md`,
    archivalPath: `${phaseDirectory}/archived/262-07-HISTORICAL.md`,
    sha256: "sha256:5c86c379a31e8bd7706c857666d31edc974600242e0e0ef5f78934151f23704d",
    replacementPlans: ["262-39"],
  },
] as const)

const activePlans = Object.freeze([
  { planId: "262-34", responsibility: "acceptance statuses, stopped facts, supersession, and safety monitor" },
  { planId: "262-35", responsibility: "non-authorizing study and accounting policy" },
  { planId: "262-36", responsibility: "non-authorizing measurement and claim policy" },
  { planId: "262-37", responsibility: "protocol-only classifiers and pre-formation containment" },
  { planId: "262-38", responsibility: "synthetic custody mechanics without operational credit" },
  { planId: "262-39", responsibility: "non-authorizing pre-search policy root" },
  { planId: "262-42", responsibility: "privacy-safe terminal disposition and paused tracking" },
  { planId: "262-44", responsibility: "binding local-seal contract and additive sentinel supersession" },
  { planId: "262-45", responsibility: "single-operator local-seal mechanics" },
  { planId: "262-46", responsibility: "independent evidence and claim-boundary verification" },
  { planId: "262-47", responsibility: "separately authorized fresh literal ADMIT-03 route" },
  { planId: "262-48", responsibility: "exact two-latch foundation activation join" },
] as const)

const archivedCheckpoint = Object.freeze({
  planId: "262-40" as const,
  originalExecutablePath: `${phaseDirectory}/262-40-PLAN.md`,
  archivalPath: `${phaseDirectory}/archived/262-40-HISTORICAL.md`,
  sha256: "sha256:e745ba878fcd0090a968762f314c787dae86896d27f2bc8a72498d684ed39231" as Sha256,
  replacementPlan: "262-42" as const,
  resumable: false as const,
})

const archivedSentinel = Object.freeze({
  planId: "262-43" as const,
  originalExecutablePath: `${phaseDirectory}/262-43-PLAN.md`,
  archivalPath: `${phaseDirectory}/archived/262-43-HISTORICAL.md`,
  sha256: "sha256:aad6ed06fc7e1fc0a0643d9ece8a9e85611d836212516c3284541a153c581239" as Sha256,
  truthfulUnderFormerContract: true as const,
  resumable: false as const,
  futureReplacementPlans: Object.freeze(["262-44", "262-45", "262-46", "262-47", "262-48"] as const),
})

const protectedTerminalHistory = Object.freeze({
  plan26242SummarySha256: "sha256:297aacff196884d5cbdd5e97dfc69c596055359ac6cf55a91f2ef7ac2555808b" as Sha256,
  terminalDispositionSha256: "sha256:ac612457eacefd5333d4d179027cf1f48a6235dbb47fb4c0a259b81132a73f15" as Sha256,
  terminalDispositionRoot: "sha256:2eff8d9ee93fa4259537a981e8a2ce08a83b82863c595da7ee4cb30c24b4327e" as Sha256,
})

const successorContract = Object.freeze({
  researchInputSha256: "sha256:a268ebfa78d1ab26e0dc5958b33af032e75ba41208e5cfb333982336a8331ad4" as Sha256,
  assuranceClass: "single_operator_local_seal_v1" as const,
  operatorRole: "repository_operator" as const,
  localSealMechanics: "pending" as const,
  independentEvidenceVerification: "pending" as const,
  admit03: "blocked" as const,
  seal01: "pending" as const,
})

export interface V138PlanSupersessionManifest {
  readonly schemaVersion: "v1.38-phase-262-plan-supersession-v1"
  readonly kind: "plan-dependency-revision"
  readonly baselineCommit: typeof planBaselineCommit
  readonly historicalPlans: typeof historicalPlans
  readonly activePlans: typeof activePlans
  readonly archivedCheckpoint: typeof archivedCheckpoint
  readonly archivedSentinel: typeof archivedSentinel
  readonly protectedTerminalHistory: typeof protectedTerminalHistory
  readonly successorContract: typeof successorContract
  readonly dormantActivation: Readonly<{
    planId: "262-41"
    path: string
    sha256: Sha256
    executable: false
    requiresFutureLiteralAdmit03Pass: true
  }>
  readonly stoppedBranch: Readonly<{
    disposition: "calibration_stopped"
    freshCharged: 0
    freshAccepted: 0
    authorityExpired: true
    noRetry: true
    admit03: "blocked"
    seal01: "unmet"
  }>
  readonly authority: Readonly<{
    matrixAdmissionStatus: "blocked"
    downstreamAuthority: "denied"
    candidateSearchAuthorized: false
    phase263Authorized: false
    formationMaterializationAuthorized: false
    productionAuthorized: false
  }>
  readonly toolingDependency: typeof V138_DEPENDENCY_REVISION_TOOLING_DEPENDENCY
  readonly manifestRoot: Sha256
}

export const buildV138PlanSupersessionManifest = (): V138PlanSupersessionManifest => {
  const frame = {
    schemaVersion: "v1.38-phase-262-plan-supersession-v1" as const,
    kind: "plan-dependency-revision" as const,
    baselineCommit: planBaselineCommit,
    historicalPlans,
    activePlans,
    archivedCheckpoint,
    archivedSentinel,
    protectedTerminalHistory,
    successorContract,
    dormantActivation: Object.freeze({
      planId: "262-41" as const,
      path: `${phaseDirectory}/dormant/262-41-ACTIVATION-CONTRACT.md`,
      sha256: "sha256:5d42af52835c2bbd8eaba1868d50bde1384d143f7f8822b6a9e725bac1075641" as Sha256,
      executable: false as const,
      requiresFutureLiteralAdmit03Pass: true as const,
    }),
    stoppedBranch: Object.freeze({
      disposition: "calibration_stopped" as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
      authorityExpired: true as const,
      noRetry: true as const,
      admit03: "blocked" as const,
      seal01: "unmet" as const,
    }),
    authority: Object.freeze({
      matrixAdmissionStatus: "blocked" as const,
      downstreamAuthority: "denied" as const,
      candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      productionAuthorized: false as const,
    }),
    toolingDependency: V138_DEPENDENCY_REVISION_TOOLING_DEPENDENCY,
  }
  return Object.freeze({
    ...frame,
    manifestRoot: identityRoot(frame.schemaVersion, frame),
  })
}

export const renderV138PlanSupersessionManifest = (
  manifest = buildV138PlanSupersessionManifest(),
): string => `${Buffer.from(canonicalBytes(manifest)).toString("utf8")}\n`

export type V138DependencyRevisionFindingCode =
  | "PROTECTED_HISTORY_DRIFT"
  | "PROTECTED_HISTORY_MISSING"
  | "ROUTE_CAPABLE_SOURCE_DRIFT"
  | "ROUTE5_REUSE"
  | "AUTHORITY_WRITER"
  | "LIVE_WORK_COMMAND"
  | "CANDIDATE_FORMATION_SURFACE"
  | "PRODUCT_PUBLIC_IMPORT"
  | "PRIVATE_DATA_EXPOSURE"
  | "MUTABLE_ALIAS"
  | "PLAN_DISCOVERY_DRIFT"
  | "MANIFEST_DRIFT"
  | "TOOLING_DEPENDENCY_DRIFT"
  | "TERMINAL_DISPOSITION_DRIFT"
  | "AUTHORITY_ARTIFACT_PRESENT"
  | "LOCAL_SEAL_CONTRACT_DRIFT"

export interface V138DependencyRevisionFinding {
  readonly code: V138DependencyRevisionFindingCode
  readonly path: string
  readonly line: number
  readonly detail: string
}

export interface V138DependencyRevisionBoundaryAnalysis {
  readonly findings: readonly V138DependencyRevisionFinding[]
  readonly protectedPathCount: number
  readonly scannedSourceCount: number
  readonly protectedInventoryRoot: Sha256
}

const localSealCarrierPatterns = Object.freeze([
  /single_operator_local_seal_v1/u,
  /repository[_ -]operator/iu,
  /independent(?:\/third-party| or third-party|-custody| custody)/iu,
  /ADMIT-03/iu,
  /SEAL-01/iu,
  /blocked/iu,
  /pending/iu,
  /Phase[ _-]?263/iu,
  /production/iu,
] as const)

export const analyzeV138LocalSealCarriers = (
  carriers: Readonly<Record<string, string>>,
): readonly V138DependencyRevisionFinding[] => Object.entries(carriers)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([carrier, source]) => localSealCarrierPatterns
    .filter((pattern) => !pattern.test(source))
    .map((pattern) => ({
      code: "LOCAL_SEAL_CONTRACT_DRIFT" as const,
      path: carrier,
      line: 1,
      detail: `Active carrier is missing required local-seal contract pattern ${pattern.source}.`,
    })))

export const checkV138ExactMachineStatus = (
  source: string,
  marker: string,
  expected: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> => {
  const markerPrefix = `<!-- ${marker}:`
  if (source.split(markerPrefix).length !== 2) {
    throw new TypeError("V138_MACHINE_STATUS_MARKER_COUNT_INVALID")
  }
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
  const matches = [...source.matchAll(new RegExp(
    `^<!-- ${escapedMarker}: (\\{.*\\}) -->$`,
    "gmu",
  ))]
  if (matches.length !== 1 || matches[0]?.[1] === undefined) {
    throw new TypeError("V138_MACHINE_STATUS_MARKER_INVALID")
  }
  const json = matches[0][1]
  const keyTokens = [...json.matchAll(/"((?:\\.|[^"\\])*)"\s*:/gu)]
    .map((match) => JSON.parse(`"${match[1]}"`) as string)
  const value = JSON.parse(json) as unknown
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    keyTokens.length !== new Set(keyTokens).size ||
    keyTokens.length !== Object.keys(value).length ||
    Buffer.from(canonicalBytes(value)).compare(Buffer.from(canonicalBytes(expected))) !== 0
  ) throw new TypeError("V138_MACHINE_STATUS_VALUE_INVALID")
  return value as Readonly<Record<string, unknown>>
}

const correctiveRequirementDisposition = Object.freeze({
  proof_status: "source_incomplete_pre_execution",
  admit_03: "blocked",
  seal_01: "passed_reduced_assurance",
  assurance_class: "single_operator_local_seal_v1",
  phase_262: "incomplete",
  route_started: false,
  fresh_charged: 0,
  fresh_accepted: 0,
  candidate_search_authorized: false,
  phase263_authorized: false,
  formation_materialization_authorized: false,
  holdout_opening_authorized: false,
  public_authorized: false,
  activation_authorized: false,
  production_authorized: false,
})

const correctiveRequirementDispositionFindings = (repoRoot: string):
  readonly V138DependencyRevisionFinding[] => {
  const repoPath = ".planning/REQUIREMENTS.md"
  const source = repositoryFile(repoRoot, path.join(repoRoot, repoPath))
    .toString("utf8")
  try {
    checkV138ExactMachineStatus(source, "phase-262-requirement-disposition",
      correctiveRequirementDisposition)
    return []
  } catch {
    return [{
      code: "LOCAL_SEAL_CONTRACT_DRIFT" as const,
      path: repoPath,
      line: 1,
      detail: "Corrective requirement disposition block is missing, duplicated, or not exact.",
    }]
  }
}

const correctiveLifecycleStatus = (post53: boolean) => Object.freeze({
  proof_status: "source_incomplete_pre_execution",
  admit_03: "blocked",
  seal_01: "passed_reduced_assurance",
  assurance_class: "single_operator_local_seal_v1",
  independent_custody_claimed: false,
  route_started: false,
  plan_262_47_terminal_present: false,
  fresh_charged: 0,
  fresh_accepted: 0,
  required_accepted: 540,
  authority_expired: true,
  no_retry: true,
  policy_status: "ready_non_authorizing",
  pre_search_policy_root:
    "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382",
  independent_verification_root:
    "sha256:4385ac8270b649f0876c7846cfc75bdc3682b8526d3ab517736ff27f01ab4b3b",
  candidate_search_authorized: false,
  phase263_authorized: false,
  formation_materialization_authorized: false,
  holdout_opening_authorized: false,
  public_authorized: false,
  foundation_activation_root_present: false,
  production_authorized: false,
  next_action: post53 ? "262-54" : "262-53",
  total_plans: 46,
  completed_plans: post53 ? 41 : 40,
  active_successors: Object.freeze([
    "262-44", "262-45", "262-49", "262-51", "262-52", "262-53",
    "262-54", "262-55", "262-56", "262-57", "262-48",
  ]),
  incomplete: Object.freeze(post53
    ? ["262-54", "262-55", "262-56", "262-57", "262-48"]
    : ["262-53", "262-54", "262-55", "262-56", "262-57", "262-48"]),
  archived_source_incomplete_plan: "archived/262-47-HISTORICAL.md",
  archived_source_incomplete_plan_sha256:
    "5044f497cf1d289954dc72c2b443dd4283821c52cabdda945c0e56dfffcb5a1e",
  archived_original_activation_plan: "archived/262-48-HISTORICAL.md",
  archived_original_activation_plan_sha256:
    "8ac51a38c5b73d901dde595ed315bf497a42ce243513e056e3a67b22c37dd3d1",
  dormant_contract: "dormant/262-41-ACTIVATION-CONTRACT.md",
})

const correctiveLifecycleCarrierFindings = (repoRoot: string):
  readonly V138DependencyRevisionFinding[] => {
  let lifecycle: ReturnType<typeof checkV138Plan26260LiveLifecycle>
  try { lifecycle = checkV138Plan26260LiveLifecycle(repoRoot) } catch {
    return [{ code: "PLAN_DISCOVERY_DRIFT", path: phaseDirectory, line: 1,
      detail: "Live corrective lifecycle could not be derived." }]
  }
  return [".planning/ROADMAP.md", ".planning/STATE.md"].flatMap(repoPath => {
    const source = repositoryFile(repoRoot, path.join(repoRoot, repoPath))
      .toString("utf8")
    try {
      const marker = /^<!-- phase-262-successor-status: (\{.*\}) -->$/gmu
        .exec(source)?.[1]
      if (marker === undefined) throw new TypeError("marker")
      const value = JSON.parse(marker) as Record<string, unknown>
      if (value.total_plans !== lifecycle.totalPlans ||
        value.admit_03 !== "blocked" || value.route_started !== false ||
        value.fresh_charged !== 0 || value.fresh_accepted !== 0 ||
        value.required_accepted !== 540 || value.reviewer_separated !== false ||
        value.independent_person_claimed !== false ||
        value.cryptographic_reviewer_identity_claimed !== false ||
        value.independent_custody_claimed !== false ||
        value.candidate_search_authorized !== false ||
        value.phase263_authorized !== false ||
        value.formation_materialization_authorized !== false ||
        value.holdout_opening_authorized !== false ||
        value.public_authorized !== false || value.production_authorized !== false) {
        throw new TypeError("semantic drift")
      }
      return []
    } catch {
      return [{
        code: "PLAN_DISCOVERY_DRIFT" as const,
        path: repoPath,
        line: 1,
        detail: "Corrective lifecycle status block is missing, duplicated, or not exact.",
      }]
    }
  })
}

export const analyzeV138ProtectedHistory = (
  repoRoot: string,
  entries: readonly Readonly<{ path: string; sha256: Sha256 }>[],
): readonly V138DependencyRevisionFinding[] => {
  const findings: V138DependencyRevisionFinding[] = []
  for (const entry of entries) {
    const target = path.join(repoRoot, entry.path)
    const bytes = readV138RepositoryFileNoFollow(repoRoot, target, "optional")
    if (bytes === undefined) findings.push({
      code: "PROTECTED_HISTORY_MISSING",
      path: entry.path,
      line: 1,
      detail: "Protected historical evidence is missing.",
    })
    else if (sha256(bytes) !== entry.sha256) findings.push({
      code: "PROTECTED_HISTORY_DRIFT",
      path: entry.path,
      line: 1,
      detail: "Protected historical evidence bytes drifted.",
    })
  }
  return findings
}

const lineOf = (sourceFile: ts.SourceFile, node: ts.Node): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

const PRIVATE_DATA_NAMES = new Set([
  "privatekey", "secret", "preimage", "rawdiagnostics", "strategymemory", "soldiermemory", "objectivepayload",
])

const normalizedName = (value: string): string => value.replace(/[^A-Za-z0-9]/gu, "").toLowerCase()

const propertyName = (name: ts.PropertyName | ts.BindingName | undefined): string | undefined => {
  if (name === undefined) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  if (ts.isComputedPropertyName(name) && (ts.isStringLiteral(name.expression) || ts.isNoSubstitutionTemplateLiteral(name.expression))) {
    return name.expression.text
  }
  return undefined
}

const isPrivateDataName = (value: string | undefined): boolean =>
  value !== undefined && PRIVATE_DATA_NAMES.has(normalizedName(value))

const isPublicProjectionName = (value: string | undefined): boolean =>
  value !== undefined && /(?:public|receipt|projection|output|artifact|render|response)/iu.test(value)

const isPassedToCanonicalPrivacyValidator = (sourceFile: ts.SourceFile, identifier: string): boolean => {
  let validated = false
  const visit = (node: ts.Node): void => {
    if (validated) return
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
      node.expression.text === "assertPublicOutputLeakSafe" && node.arguments[0] !== undefined &&
      ts.isIdentifier(node.arguments[0]) && node.arguments[0].text === identifier) validated = true
    else ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return validated
}

const expressionCarriesPrivateData = (node: ts.Node, tainted: ReadonlySet<string>): boolean => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return false
  if (ts.isIdentifier(node) && tainted.has(node.text)) return true
  if (ts.isPropertyAccessExpression(node) && isPrivateDataName(node.name.text)) return true
  if (ts.isElementAccessExpression(node) && node.argumentExpression !== undefined &&
    (ts.isStringLiteral(node.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)) &&
    isPrivateDataName(node.argumentExpression.text)) return true
  if ((ts.isPropertyAssignment(node) || ts.isPropertySignature(node) || ts.isMethodSignature(node)) &&
    isPrivateDataName(propertyName(node.name))) return true
  if (ts.isShorthandPropertyAssignment(node) &&
    (isPrivateDataName(node.name.text) || tainted.has(node.name.text))) return true
  let carries = false
  ts.forEachChild(node, (child) => { if (!carries && expressionCarriesPrivateData(child, tainted)) carries = true })
  return carries
}

const collectPrivateAliases = (sourceFile: ts.SourceFile): ReadonlySet<string> => {
  const tainted = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    const visit = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node)) {
        if (ts.isIdentifier(node.name) && node.initializer !== undefined &&
          !ts.isArrowFunction(node.initializer) && !ts.isFunctionExpression(node.initializer) &&
          expressionCarriesPrivateData(node.initializer, tainted) && !tainted.has(node.name.text)) {
          tainted.add(node.name.text)
          changed = true
        } else if (ts.isObjectBindingPattern(node.name)) {
          for (const element of node.name.elements) {
            const bound = ts.isIdentifier(element.name) ? element.name.text : undefined
            if (bound !== undefined && (isPrivateDataName(propertyName(element.propertyName ?? element.name)) ||
              (element.initializer !== undefined && expressionCarriesPrivateData(element.initializer, tainted))) && !tainted.has(bound)) {
              tainted.add(bound)
              changed = true
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return tainted
}

export const analyzeV138DependencyRevisionSources = (
  sources: Readonly<Record<string, string>>,
): readonly V138DependencyRevisionFinding[] => {
  const findings: V138DependencyRevisionFinding[] = []
  const add = (
    code: V138DependencyRevisionFindingCode,
    repoPath: string,
    sourceFile: ts.SourceFile,
    node: ts.Node,
    detail: string,
  ): void => {
    findings.push({ code, path: repoPath, line: lineOf(sourceFile, node), detail })
  }

  for (const [repoPath, source] of Object.entries(sources).sort(([a], [b]) => a.localeCompare(b))) {
    const sourceFile = ts.createSourceFile(repoPath, source, ts.ScriptTarget.Latest, true)
    const privateAliases = collectPrivateAliases(sourceFile)
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text
        if (/v1-38-(?:current-matrix-reproduction|successor-source-seal)/u.test(moduleName)) {
          add("ROUTE5_REUSE", repoPath, sourceFile, node, "Expired route-5 execution or seal code cannot be reused.")
        }
        if (/(?:apps\/web|apps\/go-backend|apps\/runtime-service|packages\/persistence|@cowards\/replay)/u.test(moduleName)) {
          add("PRODUCT_PUBLIC_IMPORT", repoPath, sourceFile, node, "Dependency-revision policy cannot import product, public, persistence, replay, or runtime surfaces.")
        }
      }
      if (
        (ts.isFunctionDeclaration(node) && node.name !== undefined) ||
        (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name))
      ) {
        const name = ts.isFunctionDeclaration(node)
          ? node.name!.text
          : ts.isIdentifier(node.name)
            ? node.name.text
            : ""
        if (/^(?:write|create|generate).*(?:authority|authorization|activation|seal|route)/iu.test(name)) {
          add("AUTHORITY_WRITER", repoPath, sourceFile, node, "This lane cannot create or write authority.")
        }
        if (/(?:materialize|execute|create).*(?:candidate|formation|profile|strategy|match)/iu.test(name)) {
          add("CANDIDATE_FORMATION_SURFACE", repoPath, sourceFile, node, "Candidate, formation, Strategy, Match, or profile materialization is forbidden.")
        }
      }
      if (ts.isCallExpression(node)) {
        const name = ts.isIdentifier(node.expression)
          ? node.expression.text
          : ts.isPropertyAccessExpression(node.expression)
            ? node.expression.name.text
            : ""
        const callText = node.getText(sourceFile)
        if (
          /^(?:executeV138ParallelMatrix|dispatchV138CurrentMatrixDirectEntry)$/u.test(name) ||
          (/^(?:spawnSync|execFileSync|execSync)$/u.test(name) &&
            /(?:matrix|preflight|calibration|reproduction|candidate|formation).*(?:run|write|execute|launch)/iu.test(callText))
        ) add("LIVE_WORK_COMMAND", repoPath, sourceFile, node, "Live matrix, calibration, reproduction, candidate, or formation work is forbidden.")
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && isPublicProjectionName(node.name.text) &&
        node.initializer !== undefined && !ts.isArrowFunction(node.initializer) && !ts.isFunctionExpression(node.initializer) &&
        expressionCarriesPrivateData(node.initializer, privateAliases) &&
        !isPassedToCanonicalPrivacyValidator(sourceFile, node.name.text)) {
        add("PRIVATE_DATA_EXPOSURE", repoPath, sourceFile, node, "Executable private data enters a public projection or receipt.")
      }
      if ((ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node)) &&
        isPublicProjectionName(node.name?.text) && expressionCarriesPrivateData(node, privateAliases)) {
        add("PRIVATE_DATA_EXPOSURE", repoPath, sourceFile, node, "A public projection type carries a private-data member.")
      }
      if (ts.isReturnStatement(node) && node.expression !== undefined) {
        const owner = node.parent
        const namedOwner = ts.isBlock(owner) && owner.parent !== undefined &&
          (ts.isFunctionDeclaration(owner.parent) || ts.isFunctionExpression(owner.parent) || ts.isArrowFunction(owner.parent))
          ? owner.parent : undefined
        const ownerName = namedOwner !== undefined && "name" in namedOwner && namedOwner.name !== undefined && ts.isIdentifier(namedOwner.name)
          ? namedOwner.name.text : undefined
        if (isPublicProjectionName(ownerName) && expressionCarriesPrivateData(node.expression, privateAliases)) {
          add("PRIVATE_DATA_EXPOSURE", repoPath, sourceFile, node, "Executable private data is returned from a public projection function.")
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    const firstNode = sourceFile.statements[0] ?? sourceFile
    if (/(?:^|[/'"`])latest(?:[/'"`]|$)/iu.test(source)) {
      add("MUTABLE_ALIAS", repoPath, sourceFile, firstNode, "Mutable latest aliases are forbidden.")
    }
  }
  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.code.localeCompare(b.code))
}

const loadFrozenRouteSources = () => {
  const gitFrozen = (args: readonly string[]) => execFileSync("git", [...args], {
    cwd: defaultRepoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  const frozenRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value)
  const summaryPath = `${phaseDirectory}/archived/262-58-SUMMARY-HISTORICAL.md`
  const historicalSummaryPath = `${phaseDirectory}/262-58-SUMMARY.md`
  const summary = repositoryFile(defaultRepoRoot,
    path.join(defaultRepoRoot, summaryPath)).toString("utf8")
  const match = /<!-- PLAN262-58-A8-CUSTODY-V1\n([^]*?)\n-->/u.exec(summary)
  if (match === null) throw new TypeError("V138_FROZEN_A8_CARRIER_INVALID")
  const carrier = JSON.parse(match[1]!) as Record<string, unknown>
  const blobs = Array.isArray(carrier.blobs) ? carrier.blobs : []
  const a8 = String(carrier.sourceA8 ?? "")
  const carrierCommits = gitFrozen(["log", "--first-parent", "--reverse",
    "--format=%H", "HEAD", "--", historicalSummaryPath]).trim().split("\n").filter(Boolean)
    .filter(commit => gitFrozen(["diff-tree", "--no-commit-id", "--name-only",
      "-r", "--no-renames", commit]).trim() === historicalSummaryPath &&
      execFileSync("git", ["show", `${commit}:${historicalSummaryPath}`], { cwd: defaultRepoRoot,
        encoding: "utf8" }) === summary)
  if (carrier.sourceBase8 !== "5fa635ccebfcef6ff00cd05876401cec4688e64f" ||
    carrierCommits.length !== 1 || gitFrozen(["show", "-s", "--format=%P",
      carrierCommits[0]!]).trim() !== a8) {
    throw new TypeError("V138_FROZEN_A8_CARRIER_INVALID")
  }
  const records: Record<string, Readonly<{ blobOid: string; sha256: Sha256 }>> = {
    "scripts/lib/v1-38-current-matrix-reproduction.ts": { blobOid:
      "4b4fe9201f529e4dee5529e7982fa75c1c31b08a", sha256:
      "sha256:507a5ad25a536b5930b9edd102ba460ec0f7dc4664e5c4496b1745bb7b5f2db5" },
    "scripts/check-v1-38-plan-262-55-source-completeness-review.ts": { blobOid:
      "649b50c98ea0ffeed6c8bd0e6cb2858601087237", sha256:
      "sha256:1d3bf3ecb99f1f5a52ef4e54d52ae2d358b9825d3b7028d787dd3542600678da" },
  }
  for (const repoPath of ["scripts/lib/v1-38-successor-source-seal.ts"]) {
    const blob = blobs.find(item => frozenRecord(item) && item.path === repoPath)
    if (!frozenRecord(blob) || typeof blob.blobOid !== "string" ||
      typeof blob.sha256 !== "string") throw new TypeError("V138_FROZEN_A8_CARRIER_INVALID")
    records[repoPath] = { blobOid: blob.blobOid,
      sha256: blob.sha256 as Sha256 }
  }
  const orderedRecords = Object.fromEntries([
    "scripts/lib/v1-38-current-matrix-reproduction.ts",
    "scripts/lib/v1-38-successor-source-seal.ts",
    "scripts/check-v1-38-plan-262-55-source-completeness-review.ts",
  ].map(repoPath => [repoPath, records[repoPath]!]))
  for (const [repoPath, record] of Object.entries(orderedRecords)) {
    const objectBytes = execFileSync("git", ["cat-file", "blob", record.blobOid],
      { cwd: defaultRepoRoot, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 })
    if (sha256(objectBytes) !== record.sha256) {
      throw new TypeError("V138_FROZEN_ROUTE_SOURCE_OBJECT_INVALID")
    }
  }
  return Object.freeze(orderedRecords)
}

export const V138_FROZEN_ROUTE_CAPABLE_SOURCE_OBJECTS = loadFrozenRouteSources()
export const V138_HISTORICAL_REVIEWER_V2_SOURCE_OBJECT = Object.freeze({
  path: "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
  blobOid: "b257f7a1d4931c4d44584e63c9e69ab62b115292",
  sha256: "sha256:52040127b905f5081ab8205fcceaaee5f26d04b0f301be5be0fc6dbb51836907",
} as const)
{
  const historicalBytes = execFileSync("git", ["cat-file", "blob",
    V138_HISTORICAL_REVIEWER_V2_SOURCE_OBJECT.blobOid], {
    cwd: defaultRepoRoot, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 })
  if (sha256(historicalBytes) !==
    V138_HISTORICAL_REVIEWER_V2_SOURCE_OBJECT.sha256) {
    throw new TypeError("V138_HISTORICAL_REVIEWER_V2_CUSTODY_INVALID")
  }
}
export const V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256 = Object.freeze(
  Object.fromEntries(Object.entries(V138_FROZEN_ROUTE_CAPABLE_SOURCE_OBJECTS)
    .map(([repoPath, record]) => [repoPath, record.sha256])) as
    Readonly<Record<string, Sha256>>)

export const analyzeV138PolicySourcesWithFrozenRouteAllowlist = (
  sources: Readonly<Record<string, string>>,
): readonly V138DependencyRevisionFinding[] => {
  const ordinary: Record<string, string> = {}
  const findings: V138DependencyRevisionFinding[] = []
  for (const repoPath of Object.keys(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)) {
    if (Object.hasOwn(sources, repoPath)) continue
    findings.push({
      code: "ROUTE_CAPABLE_SOURCE_DRIFT",
      path: repoPath,
      line: 1,
      detail:
        "V138_ROUTE_CAPABLE_SOURCE_INVENTORY_REQUIRED: required frozen route-capable source is absent from the policy source inventory.",
    })
  }
  for (const [repoPath, source] of Object.entries(sources)) {
    const frozenHash = V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256[
      repoPath as keyof typeof V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256
    ]
    if (frozenHash === undefined) {
      ordinary[repoPath] = source
      continue
    }
    if (sha256(source) === frozenHash) continue
    findings.push({
      code: "ROUTE_CAPABLE_SOURCE_DRIFT",
      path: repoPath,
      line: 1,
      detail:
        "Route-capable source no longer matches its exact frozen historical byte allowlist.",
    })
    findings.push(...analyzeV138DependencyRevisionSources({
      [repoPath]: source,
    }))
  }
  findings.push(...analyzeV138DependencyRevisionSources(ordinary))
  return findings.sort((a, b) =>
    a.path.localeCompare(b.path) || a.line - b.line || a.code.localeCompare(b.code))
}

export const analyzeV138DependencyRevisionPaths = (
  repoPaths: readonly string[],
): readonly V138DependencyRevisionFinding[] => repoPaths
  .filter((repoPath) =>
    /(?:^|\/)(?:formations?|profiles|candidates|prompts|cache|traces|replays|results)(?:\/|$)/iu.test(repoPath) ||
    /(?:formation|profile|candidate|prompt|cache|trace|replay|result)-(?:manifest|state|source|artifact)\b/iu.test(repoPath),
  )
  .map((repoPath) => ({
    code: "CANDIDATE_FORMATION_SURFACE" as const,
    path: repoPath,
    line: 1,
    detail: "Executable formation, profile, candidate, prompt, cache, trace, replay, or result namespaces are forbidden.",
  }))

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })

const protectedInventory = (
  repoRoot: string,
): readonly Readonly<{ path: string; sha256: Sha256 }>[] => {
  const paths = git(repoRoot, ["ls-tree", "-r", "--name-only", planBaselineCommit])
    .split("\n")
    .filter(Boolean)
    .filter((repoPath) => repoPath !== archivedCheckpoint.originalExecutablePath)
    .filter((repoPath) => repoPath !== `${phaseDirectory}/262-VERIFICATION.md`)
    .filter((repoPath) => repoPath !== `${phaseDirectory}/262-CONTEXT.md`)
    .filter((repoPath) => repoPath !==
      `${phaseDirectory}/262-DEPENDENCY-REVISION-RESEARCH.md`)
    .filter((repoPath) =>
      repoPath.startsWith(`${phaseDirectory}/`) ||
      (repoPath.startsWith(".planning/artifacts/v1.38-") &&
        /(?:admission|authorization|seal|terminal|consumption|reproduction|calibration|preflight|execution-context|diagnostic|root)/u.test(repoPath)),
    )
    .sort()
  return paths.map((repoPath) => ({
    path: repoPath,
    sha256: sha256(execFileSync("git", ["show", `${planBaselineCommit}:${repoPath}`], {
      cwd: repoRoot,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    })),
  }))
}

interface V138PolicySourceCollection {
  readonly sources: Readonly<Record<string, string>>
  readonly findings: readonly V138DependencyRevisionFinding[]
}

const exactFailureReason = (error: unknown): string =>
  error instanceof Error && error.message.length > 0
    ? error.message
    : "V138_ROUTE_CAPABLE_SOURCE_READ_FAILED"

export const collectV138ChangedPolicySources = (
  repoRoot: string,
): Readonly<V138PolicySourceCollection> => {
  const requiredPaths = Object.keys(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256)
  const names = new Set([
    ...requiredPaths,
    ...changedPaths(repoRoot).filter((repoPath) => repoPath.startsWith("scripts/")),
  ])
  const sources: Record<string, string> = {}
  const findings: V138DependencyRevisionFinding[] = []
  for (const repoPath of [...names].sort()) {
    if (!repoPath.endsWith(".ts") || repoPath.endsWith(".test.ts") ||
      repoPath === "scripts/check-v1-38-dependency-revision-boundaries.ts") continue
    const target = path.join(repoRoot, repoPath)
    const required = Object.hasOwn(V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256,
      repoPath)
    try {
      const bytes = readV138RepositoryFileNoFollow(repoRoot, target,
        required ? "required" : "optional")
      if (bytes !== undefined) sources[repoPath] = bytes.toString("utf8")
    } catch (error) {
      if (!required) throw error
      findings.push({
        code: "ROUTE_CAPABLE_SOURCE_DRIFT",
        path: repoPath,
        line: 1,
        detail: `${exactFailureReason(error)}: required frozen route-capable source could not be read as its canonical regular file.`,
      })
    }
  }
  return Object.freeze({
    sources: Object.freeze(sources),
    findings: Object.freeze(findings),
  })
}

const changedPaths = (repoRoot: string): readonly string[] => [...new Set([
    ...git(repoRoot, ["diff", "--name-only", planBaselineCommit, "--", "scripts"]).split("\n"),
    ...git(repoRoot, ["diff", "--name-only", planBaselineCommit]).split("\n"),
    ...git(repoRoot, ["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ].filter(Boolean))].sort()

const correctiveDispositionCanonical = (repoRoot: string): boolean => {
  const target = path.join(repoRoot, plan26247DispositionPath)
  try {
    const bytes = readV138RepositoryFileNoFollow(repoRoot, target, "required")
    if (bytes === undefined) return false
    const value = JSON.parse(bytes.toString("utf8")) as unknown
    const expected = checkV138Plan26247PreExecutionSourceFailureV1(
      repoRoot,
      value,
    )
    const expectedBytes = Buffer.concat([
      Buffer.from(canonicalBytes(expected)),
      Buffer.from("\n", "utf8"),
    ])
    return (
      bytes.equals(expectedBytes) &&
      V138_PLAN_262_47_FRESH_DESTINATIONS.every((repoPath) =>
        readV138RepositoryFileNoFollow(repoRoot,
          path.join(repoRoot, repoPath), "absent") === undefined,
      )
    )
  } catch { return false }
}

const planDiscoveryFindings = (repoRoot: string): readonly V138DependencyRevisionFinding[] => {
  const findings: V138DependencyRevisionFinding[] = []
  try {
    checkV138Plan26260LiveLifecycle(repoRoot)
  } catch {
    findings.push({ code: "PLAN_DISCOVERY_DRIFT", path: phaseDirectory, line: 1,
      detail: "Phase 262 live index does not match the derived 48-plan corrective lifecycle." })
  }
  const exactInventory = ["262-01", "262-02", "262-08", "262-09", "262-10",
    "262-11", "262-12", "262-13", "262-14", "262-15", "262-16", "262-17",
    "262-18", "262-19", "262-20", "262-21", "262-22", "262-23", "262-24",
    "262-25", "262-26", "262-27", "262-28", "262-29", "262-30", "262-31",
    "262-32", "262-33", "262-34", "262-35", "262-36", "262-37", "262-38",
    "262-39", "262-42", "262-44", "262-45", "262-48", "262-49", "262-51",
    "262-52", "262-53", "262-54", "262-56", "262-57", "262-60", "262-61", "262-62"]
  const exactWaves = Object.fromEntries(exactInventory.map((id, index) => {
    const special: Record<string, number> = { "262-48": 48, "262-49": 38,
      "262-51": 39, "262-52": 40, "262-53": 41, "262-54": 42,
      "262-56": 46, "262-57": 47, "262-60": 43, "262-61": 44,
      "262-62": 45 }
    return [id, special[id] ?? index + 1]
  }))
  const exactDependencies: Record<string, readonly string[]> = {}
  for (let index = 1; index < 34; index += 1) {
    exactDependencies[exactInventory[index]!] = [exactInventory[index - 1]!]
  }
  exactDependencies["262-01"] = []
  exactDependencies["262-39"] = ["262-35", "262-36", "262-37", "262-38"]
  Object.assign(exactDependencies, { "262-42": ["262-39"], "262-44": ["262-42"],
    "262-45": ["262-44"], "262-48": ["262-57"], "262-49": ["262-45"],
    "262-51": ["262-49"], "262-52": ["262-51"], "262-53": ["262-52"],
    "262-54": ["262-53"], "262-56": ["262-62"], "262-57": ["262-56"],
    "262-60": ["262-54"], "262-61": ["262-60"], "262-62": ["262-61"] })
  const toolPath = path.join(process.env.HOME ?? "", ".codex/gsd-core/bin/gsd-tools.cjs")
  const indexed = spawnSync(process.execPath,
    [toolPath, "query", "phase-plan-index", "262"], { cwd: repoRoot,
      encoding: "utf8", timeout: 20_000 })
  try {
    const parsed = JSON.parse(indexed.stdout) as Record<string, unknown>
    const plans = Array.isArray(parsed.plans) ? parsed.plans : []
    const observedIds = plans.map(plan => isRecord(plan) ? plan.id : undefined)
    const inventoryExact = JSON.stringify(observedIds) === JSON.stringify(exactInventory)
    const dependencyExact = plans.every(plan => isRecord(plan) &&
      typeof plan.id === "string" && plan.wave === exactWaves[plan.id] &&
      JSON.stringify(plan.depends_on) === JSON.stringify(exactDependencies[plan.id]))
    const waves = isRecord(parsed.waves) ? parsed.waves : {}
    const waveExact = exactInventory.every(id =>
      JSON.stringify(waves[String(exactWaves[id])]) === JSON.stringify([id]))
    const summaryIds = plans.filter(plan => isRecord(plan) && plan.has_summary === true)
      .map(plan => String(plan.id))
    const incomplete = Array.isArray(parsed.incomplete) ? parsed.incomplete : []
    const expectedIncomplete = V138_PLAN_262_60_CORRECTIVE_CHAIN.filter(planId =>
      !repositoryFilePresent(repoRoot, path.join(repoRoot, phaseDirectory,
        `${planId}-SUMMARY.md`)))
    const archivesExact = !repositoryFilePresent(repoRoot, path.join(repoRoot,
      phaseDirectory, "262-58-PLAN.md")) && ["262-58-HISTORICAL.md",
      "262-58-SUMMARY-HISTORICAL.md", "262-59-HISTORICAL.md"].every(name => repositoryFilePresent(repoRoot,
        path.join(repoRoot, phaseDirectory, "archived", name)))
    if (indexed.status !== 0 || !inventoryExact || !dependencyExact || !waveExact ||
      summaryIds.length !== 48 - expectedIncomplete.length ||
      JSON.stringify([...incomplete].sort()) !== JSON.stringify([...expectedIncomplete].sort()) ||
      !archivesExact) findings.push({ code: "PLAN_DISCOVERY_DRIFT",
        path: phaseDirectory, line: 1,
        detail: "Exact ordered 48-plan inventory, dependencies, waves, summaries, archives, or incomplete set drifted." })
  } catch {
    findings.push({ code: "PLAN_DISCOVERY_DRIFT", path: phaseDirectory, line: 1,
      detail: "phase-plan-index 262 returned invalid JSON." })
  }
  return findings
  /* Historical transition implementation retained below for read-only archaeology.
  const forbidden = new Set(["262-03", "262-04", "262-05", "262-06", "262-07", "262-40", "262-41", "262-43", "262-47"])
  const phaseChain = validateV138CanonicalParentChain(repoRoot,
    path.join(repoRoot, phaseDirectory, ".v138-directory-probe"))
  let directPlans: string[]
  try {
    directPlans = readdirSync(phaseChain.parent)
      .filter((name) => /^262-\d+-PLAN\.md$/u.test(name))
      .map((name) => name.slice(0, 6))
  } finally {
    checkV138CanonicalParentChain(phaseChain)
  }
  if (directPlans.some((planId) => forbidden.has(planId))) findings.push({
    code: "PLAN_DISCOVERY_DRIFT",
    path: phaseDirectory,
    line: 1,
    detail: "Archived or dormant plan is present in direct PLAN.md discovery.",
  })
  const toolPath = path.join(process.env.HOME ?? "", ".codex/gsd-core/bin/gsd-tools.cjs")
  const indexed = spawnSync(process.execPath, [toolPath, "query", "phase-plan-index", "262"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 20_000,
  })
  if (indexed.status !== 0) {
    findings.push({ code: "PLAN_DISCOVERY_DRIFT", path: phaseDirectory, line: 1, detail: "phase-plan-index 262 could not be evaluated." })
    return findings
  }
  try {
    const parsed = JSON.parse(indexed.stdout) as { plans?: unknown; incomplete?: unknown; waves?: unknown }
    const discovered = [
      ...(Array.isArray(parsed.incomplete) ? parsed.incomplete : []),
      ...Object.values(parsed.waves ?? {}).flatMap((value) => Array.isArray(value) ? value : []),
    ]
    if (discovered.some((value) => typeof value === "string" && forbidden.has(value))) findings.push({
      code: "PLAN_DISCOVERY_DRIFT",
      path: phaseDirectory,
      line: 1,
      detail: "phase-plan-index 262 includes archived or dormant plan IDs.",
    })
    const plans = Array.isArray(parsed.plans) ? parsed.plans : []
    const actualIncomplete = Array.isArray(parsed.incomplete) ? parsed.incomplete : []
    const actualSummaryCount = plans.filter((entry) => isRecord(entry) && entry.has_summary === true).length
    const planIds = plans.map((entry) => isRecord(entry) ? entry.id : undefined)
    const expectedPlanIds = [
      "262-01", "262-02", "262-08", "262-09", "262-10", "262-11", "262-12", "262-13", "262-14",
      "262-15", "262-16", "262-17", "262-18", "262-19", "262-20", "262-21", "262-22", "262-23",
      "262-24", "262-25", "262-26", "262-27", "262-28", "262-29", "262-30", "262-31", "262-32",
      "262-33", "262-34", "262-35", "262-36", "262-37", "262-38", "262-39", "262-42", "262-44",
      "262-45", "262-48", "262-49", "262-51", "262-52", "262-53", "262-54", "262-55", "262-56",
      "262-57",
    ]
    const waves = isRecord(parsed.waves) ? parsed.waves : {}
    const activeWavesExact = JSON.stringify({
      "38": waves["38"], "39": waves["39"], "40": waves["40"], "41": waves["41"], "42": waves["42"],
      "43": waves["43"], "44": waves["44"], "45": waves["45"], "46": waves["46"],
    }) === JSON.stringify({
      "38": ["262-49"], "39": ["262-51"], "40": ["262-52"], "41": ["262-53"], "42": ["262-54"],
      "43": ["262-55"], "44": ["262-56"], "45": ["262-57"], "46": ["262-48"],
    })
    const summary = (planId: string): boolean => repositoryFilePresent(repoRoot,
      path.join(repoRoot, phaseDirectory, `${planId}-SUMMARY.md`))
    const artifactPath = path.join(repoRoot, ".planning/artifacts/v1.38-local-seal-independent-verification-v2.json")
    const reviewPath = path.join(repoRoot, phaseDirectory, "262-50-REVIEW.md")
    const failArtifactCanonical = isCanonicalPlan50Artifact(repoRoot,
      artifactPath, "fail")
    const failReviewCanonical = failArtifactCanonical && isCanonicalPlan50Review(
      repoRoot, reviewPath, artifactPath, "fail")
    const v3ArtifactPath = path.join(repoRoot, ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json")
    const v3ReviewPath = path.join(repoRoot, phaseDirectory, "262-52-REVIEW.md")
    const v3PassArtifactCanonical = isCanonicalPlan52Artifact(repoRoot,
      v3ArtifactPath, "pass")
    const v3FailArtifactCanonical = isCanonicalPlan52Artifact(repoRoot,
      v3ArtifactPath, "fail")
    const v3PassReviewCanonical = v3PassArtifactCanonical &&
      isCanonicalPlan52Review(repoRoot, v3ReviewPath, v3ArtifactPath, "pass")
    const v3FailReviewCanonical = v3FailArtifactCanonical &&
      isCanonicalPlan52Review(repoRoot, v3ReviewPath, v3ArtifactPath, "fail")
    const v3Verdict = v3PassArtifactCanonical ? "pass" as const : v3FailArtifactCanonical ? "fail" as const : "absent" as const
    const post53 = summary("262-53")
    const expectedSummaryCount = post53 ? 41 : 40
    const expectedIncomplete = post53
      ? ["262-48", "262-54", "262-55", "262-56", "262-57"]
      : ["262-48", "262-53", "262-54", "262-55", "262-56", "262-57"]
    const lifecycleExact = plans.length === 46 &&
      actualSummaryCount === expectedSummaryCount &&
      JSON.stringify(actualIncomplete) === JSON.stringify(expectedIncomplete) &&
      failArtifactCanonical && failReviewCanonical && !summary("262-50") &&
      v3Verdict === "pass" && v3PassArtifactCanonical && v3PassReviewCanonical &&
      summary("262-51") && summary("262-52") && !summary("262-47") &&
      correctiveDispositionCanonical(repoRoot) &&
      correctiveArchiveEntries.every((entry) => {
        const bytes = readV138RepositoryFileNoFollow(repoRoot,
          path.join(repoRoot, entry.path), "optional")
        return bytes !== undefined && sha256(bytes) === entry.sha256
      })
    if (!lifecycleExact) findings.push({
      code: "PLAN_DISCOVERY_DRIFT",
      path: phaseDirectory,
      line: 1,
      detail: "Phase 262 corrective index, disposition, or archive evidence does not match the declared pre/post-262-53 lifecycle.",
    })
    if (JSON.stringify(planIds) !== JSON.stringify(expectedPlanIds) || !activeWavesExact) findings.push({
      code: "PLAN_DISCOVERY_DRIFT",
      path: phaseDirectory,
      line: 1,
      detail: `phase-plan-index 262 must preserve the exact corrective 46-plan inventory and waves; expected 46/${expectedSummaryCount} with incomplete ${JSON.stringify(expectedIncomplete)}.`,
    })
  } catch {
    findings.push({ code: "PLAN_DISCOVERY_DRIFT", path: phaseDirectory, line: 1, detail: "phase-plan-index 262 returned invalid JSON." })
  }
  return findings
  }
  */
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

type V138PhasePlanIndexLifecycle =
  | "pre_51" | "post_51_pre_52" | "plan_52_pass" | "plan_52_fail" | "post_47" | "post_48"

const isCanonicalPlan50Artifact = (repoRoot: string, target: string,
  expected: "pass" | "fail"): boolean => {
  try {
    const bytes = repositoryFile(repoRoot, target).toString("utf8")
    const value = JSON.parse(bytes) as unknown
    if (!isRecord(value) || bytes !== `${JSON.stringify(value)}\n` ||
      value.schemaVersion !== "v1.38-local-seal-independent-verification-v2" ||
      typeof value.verificationRoot !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value.verificationRoot) ||
      value.independentCustodyClaimed !== false || value.candidateSearchAuthorized !== false ||
      value.phase263Authorized !== false || value.formationMaterializationAuthorized !== false ||
      value.holdoutOpeningAuthorized !== false || value.publicAuthorized !== false || value.productionAuthorized !== false) return false
    const findingCount = value.findingCount
    return expected === "pass"
      ? value.independentEvidenceVerification === "passed" && value.satisfiesRevisedSeal01 === true && findingCount === 0
      : value.independentEvidenceVerification === "failed_with_findings" && value.satisfiesRevisedSeal01 === false &&
          typeof findingCount === "number" && Number.isSafeInteger(findingCount) && findingCount > 0
  } catch { return false }
}

const isCanonicalPlan50Review = (repoRoot: string, reviewTarget: string,
  artifactTarget: string, expected: "pass" | "fail"): boolean => {
  try {
    const artifact = JSON.parse(repositoryFile(repoRoot, artifactTarget)
      .toString("utf8")) as { verificationRoot?: unknown }
    const review = repositoryFile(repoRoot, reviewTarget).toString("utf8")
    return typeof artifact.verificationRoot === "string" && review.includes(artifact.verificationRoot) &&
      (expected === "pass" ? /\bPASS\b/u.test(review) : /\bFAIL\b/u.test(review))
  } catch { return false }
}

const isCanonicalPlan52Artifact = (repoRoot: string, target: string,
  expected: "pass" | "fail"): boolean => {
  try {
    const bytes = repositoryFile(repoRoot, target).toString("utf8")
    const value = JSON.parse(bytes) as unknown
    if (!isRecord(value) || bytes !== `${JSON.stringify(value)}\n` ||
      value.schemaVersion !== "v1.38-local-seal-independent-verification-v3" ||
      typeof value.verificationRoot !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value.verificationRoot) ||
      value.independentCustodyClaimed !== false || value.admit03Status !== "blocked" ||
      value.candidateSearchAuthorized !== false || value.phase263Authorized !== false ||
      value.formationMaterializationAuthorized !== false || value.holdoutOpeningAuthorized !== false ||
      value.publicAuthorized !== false || value.activationAuthorized !== false || value.productionAuthorized !== false ||
      value.downstreamAuthority !== "denied" || !Array.isArray(value.findingCodes) ||
      value.findingCount !== value.findingCodes.length) return false
    return expected === "pass"
      ? value.independentEvidenceVerification === "passed" && value.satisfiesRevisedSeal01 === true && value.findingCount === 0
      : value.independentEvidenceVerification === "failed_with_findings" && value.satisfiesRevisedSeal01 === false &&
          typeof value.findingCount === "number" && Number.isSafeInteger(value.findingCount) && value.findingCount > 0
  } catch { return false }
}

const isCanonicalPlan52Review = (repoRoot: string, reviewTarget: string,
  artifactTarget: string, expected: "pass" | "fail"): boolean =>
  isCanonicalPlan50Review(repoRoot, reviewTarget, artifactTarget, expected)

export const V138_PLAN_262_60_CORRECTIVE_CHAIN = Object.freeze([
  "262-60", "262-61", "262-62", "262-56", "262-57", "262-48",
] as const)

export type V138Plan26260LifecycleMode =
  | "a9_pending_42_of_48"
  | "a9_complete_43_of_48"
  | "reviewer_r3_complete_44_of_48"
  | "review_v3_complete_45_of_48"
  | "authority_complete_46_of_48"
  | "route_complete_47_of_48"
  | "phase_complete_48_of_48"

export const evaluateV138Plan26260Lifecycle = (input: Readonly<{
  mode: V138Plan26260LifecycleMode
  totalPlans: number
  completedPlans: number
  correctiveChain: readonly string[]
  incomplete: readonly string[]
  archivedPlan58Active: boolean
  reviewV2InvalidDispositionPresent: boolean
  authorizationVersion: number
  sealVersion: number
  obsoleteV7V8Present: boolean
  routeOrdinal: number
  executionVersions: readonly number[]
}>) => {
  const expected = {
    a9_pending_42_of_48: { completed: 42,
      incomplete: ["262-60", "262-61", "262-62", "262-56", "262-57", "262-48"] },
    a9_complete_43_of_48: { completed: 43,
      incomplete: ["262-61", "262-62", "262-56", "262-57", "262-48"] },
    reviewer_r3_complete_44_of_48: { completed: 44,
      incomplete: ["262-62", "262-56", "262-57", "262-48"] },
    review_v3_complete_45_of_48: { completed: 45,
      incomplete: ["262-56", "262-57", "262-48"] },
    authority_complete_46_of_48: { completed: 46,
      incomplete: ["262-57", "262-48"] },
    route_complete_47_of_48: { completed: 47, incomplete: ["262-48"] },
    phase_complete_48_of_48: { completed: 48, incomplete: [] },
  }[input.mode]
  if (expected === undefined || input.totalPlans !== 48 ||
    input.completedPlans !== expected.completed ||
    JSON.stringify(input.correctiveChain) !==
      JSON.stringify(V138_PLAN_262_60_CORRECTIVE_CHAIN) ||
    JSON.stringify(input.incomplete) !== JSON.stringify(expected.incomplete) ||
    input.archivedPlan58Active !== false ||
    input.reviewV2InvalidDispositionPresent !== true ||
    input.authorizationVersion !== 9 || input.sealVersion !== 9 ||
    input.obsoleteV7V8Present !== false || input.routeOrdinal !== 7 ||
    JSON.stringify(input.executionVersions) !== JSON.stringify([11, 11, 11, 12])) {
    throw new TypeError("V138_PLAN_262_60_LIFECYCLE_INVALID")
  }
  return Object.freeze({ mode: input.mode, totalPlans: 48 as const,
    completedPlans: expected.completed,
    incomplete: Object.freeze([...expected.incomplete]),
    correctiveChain: V138_PLAN_262_60_CORRECTIVE_CHAIN })
}

export const checkV138Plan26260LiveLifecycle = (repoRoot = defaultRepoRoot) => {
  const toolPath = path.join(process.env.HOME ?? "",
    ".codex/gsd-core/bin/gsd-tools.cjs")
  const indexed = spawnSync(process.execPath,
    [toolPath, "query", "phase-plan-index", "262"], { cwd: repoRoot,
      encoding: "utf8", timeout: 20_000 })
  if (indexed.status !== 0) {
    throw new TypeError("V138_PLAN_262_60_LIFECYCLE_INDEX_INVALID")
  }
  const parsed = JSON.parse(indexed.stdout) as Record<string, unknown>
  const plans = Array.isArray(parsed.plans) ? parsed.plans : []
  const waves = isRecord(parsed.waves) ? parsed.waves : {}
  const actualIncomplete = Array.isArray(parsed.incomplete)
    ? parsed.incomplete.filter((item): item is string => typeof item === "string") : []
  const summary = (planId: string) => repositoryFilePresent(repoRoot,
    path.join(repoRoot, phaseDirectory, `${planId}-SUMMARY.md`))
  const states = [
    { mode: "phase_complete_48_of_48", summary: summary("262-48") },
    { mode: "route_complete_47_of_48", summary: summary("262-57") },
    { mode: "authority_complete_46_of_48", summary: summary("262-56") },
    { mode: "review_v3_complete_45_of_48", summary: summary("262-62") },
    { mode: "reviewer_r3_complete_44_of_48", summary: summary("262-61") },
    { mode: "a9_complete_43_of_48", summary: summary("262-60") },
    { mode: "a9_pending_42_of_48", summary: true },
  ] as const
  const mode = states.find(entry => entry.summary)!.mode
  const completed = 42 + ["262-60", "262-61", "262-62", "262-56", "262-57", "262-48"]
    .filter(summary).length
  const expectedWaves = { "43": ["262-60"], "44": ["262-61"],
    "45": ["262-62"], "46": ["262-56"], "47": ["262-57"], "48": ["262-48"] }
  if (plans.length !== 48 || plans.filter(item => isRecord(item) &&
      item.has_summary === true).length !== completed ||
    JSON.stringify(Object.fromEntries(Object.keys(expectedWaves).map(key =>
      [key, waves[key]]))) !== JSON.stringify(expectedWaves) ||
    repositoryFilePresent(repoRoot, path.join(repoRoot, phaseDirectory,
      "262-58-PLAN.md")) ||
    !repositoryFilePresent(repoRoot, path.join(repoRoot, phaseDirectory,
      "archived/262-58-HISTORICAL.md")) ||
    !repositoryFilePresent(repoRoot, path.join(repoRoot, phaseDirectory,
      "archived/262-58-SUMMARY-HISTORICAL.md"))) {
    throw new TypeError("V138_PLAN_262_60_LIFECYCLE_INDEX_INVALID")
  }
  const dispositionPresent = repositoryFilePresent(repoRoot, path.join(repoRoot,
    ".planning/artifacts/v1.38-plan-262-60-review-v2-invalid-disposition-v1.json"))
  const expectedIncomplete = V138_PLAN_262_60_CORRECTIVE_CHAIN.filter(planId =>
    !summary(planId))
  const sealSource = repositoryFile(repoRoot, path.join(repoRoot,
    "scripts/lib/v1-38-successor-source-seal.ts")).toString("utf8")
  const routeSource = repositoryFile(repoRoot, path.join(repoRoot,
    "scripts/lib/v1-38-current-matrix-reproduction.ts")).toString("utf8")
  const authorizationVersion = Number(/V138_PLAN_262_56_AUTHORIZATION_V9_SCHEMA\s*=\s*\n?\s*"v1\.38-plan-262-56-authorization-v(\d+)"/u
    .exec(sealSource)?.[1])
  const sealVersion = Number(/V138_SUCCESSOR_SOURCE_SEAL_V9_SCHEMA\s*=\s*\n?\s*"v1\.38-successor-source-seal-v(\d+)"/u
    .exec(sealSource)?.[1])
  const routeBlock = routeSource.slice(routeSource.indexOf(
    "export const V138_PLAN_262_57_ROUTE_CONTRACT"), routeSource.indexOf(
    "export const checkV138Plan26257RouteContract"))
  const routeOrdinal = Number(/routeOrdinal:\s*(\d+)/u.exec(routeBlock)?.[1])
  const executionVersions = ["execution-context", "headroom-preflight",
    "calibration", "reproduction"].map((name) => Number(new RegExp(
      `v1\\.38-current-matrix-${name}-v(\\d+)`, "u").exec(routeBlock)?.[1]))
  const lifecycle = evaluateV138Plan26260Lifecycle({ mode, totalPlans: 48,
    completedPlans: completed,
    correctiveChain: V138_PLAN_262_60_CORRECTIVE_CHAIN,
    incomplete: expectedIncomplete, archivedPlan58Active: false,
    reviewV2InvalidDispositionPresent: dispositionPresent,
    authorizationVersion, sealVersion,
    obsoleteV7V8Present: [
      ".planning/artifacts/v1.38-plan-262-56-authorization-v7.json",
      ".planning/artifacts/v1.38-successor-source-seal-v7.json",
      ".planning/artifacts/v1.38-plan-262-56-authorization-v8.json",
      ".planning/artifacts/v1.38-successor-source-seal-v8.json",
    ].some(repoPath => repositoryFilePresent(repoRoot,
      path.join(repoRoot, repoPath))), routeOrdinal,
    executionVersions })
  if (JSON.stringify([...actualIncomplete].sort()) !==
    JSON.stringify([...expectedIncomplete].sort())) {
    throw new TypeError("V138_PLAN_262_60_LIFECYCLE_INCOMPLETE_INVALID")
  }
  return lifecycle
}

export const evaluateV138PhasePlanIndexTransition = (
  input: Readonly<{
    lifecycle: V138PhasePlanIndexLifecycle
    planCount: number
    summaryCount: number
    incomplete: readonly string[]
    v2FailArtifactCanonical: boolean
    v2FailReviewCanonical: boolean
    summary26250Present: boolean
    v3Verdict: "absent" | "pass" | "fail"
    v3ArtifactCanonical: boolean
    v3ReviewCanonical: boolean
    summary26251Present: boolean
    summary26252Present: boolean
  }>,
): Readonly<{ planCount: 42; summaryCount: number; incomplete: readonly string[] }> => {
  const keys = [
    "lifecycle", "planCount", "summaryCount", "incomplete", "v2FailArtifactCanonical", "v2FailReviewCanonical",
    "summary26250Present", "v3Verdict", "v3ArtifactCanonical", "v3ReviewCanonical", "summary26251Present",
    "summary26252Present",
  ]
  if (!isRecord(input) || JSON.stringify(Object.keys(input).sort()) !== JSON.stringify(keys.sort()) ||
    !["pre_51", "post_51_pre_52", "plan_52_pass", "plan_52_fail", "post_47", "post_48"].includes(input.lifecycle as string) ||
    typeof input.planCount !== "number" || typeof input.summaryCount !== "number" || !Array.isArray(input.incomplete) ||
    typeof input.v2FailArtifactCanonical !== "boolean" || typeof input.v2FailReviewCanonical !== "boolean" ||
    typeof input.summary26250Present !== "boolean" || !["absent", "pass", "fail"].includes(input.v3Verdict) ||
    typeof input.v3ArtifactCanonical !== "boolean" || typeof input.v3ReviewCanonical !== "boolean" ||
    typeof input.summary26251Present !== "boolean" || typeof input.summary26252Present !== "boolean") {
    throw new TypeError("V138_PHASE_PLAN_INDEX_TRANSITION_INVALID")
  }
  const expected = {
    pre_51: { summaryCount: 38, incomplete: ["262-47", "262-48", "262-51", "262-52"], v3: "absent", artifact: false, review: false, summary51: false, summary52: false },
    post_51_pre_52: { summaryCount: 39, incomplete: ["262-47", "262-48", "262-52"], v3: "absent", artifact: false, review: false, summary51: true, summary52: false },
    plan_52_pass: { summaryCount: 40, incomplete: ["262-47", "262-48"], v3: "pass", artifact: true, review: true, summary51: true, summary52: true },
    plan_52_fail: { summaryCount: 39, incomplete: ["262-47", "262-48", "262-52"], v3: "fail", artifact: true, review: true, summary51: true, summary52: false },
    post_47: { summaryCount: 41, incomplete: ["262-48"], v3: "pass", artifact: true, review: true, summary51: true, summary52: true },
    post_48: { summaryCount: 42, incomplete: [], v3: "pass", artifact: true, review: true, summary51: true, summary52: true },
  }[input.lifecycle]
  if (input.planCount !== 42 || input.summaryCount !== expected.summaryCount ||
    JSON.stringify(input.incomplete) !== JSON.stringify(expected.incomplete) ||
    input.v2FailArtifactCanonical !== true || input.v2FailReviewCanonical !== true || input.summary26250Present !== false ||
    input.v3Verdict !== expected.v3 || input.v3ArtifactCanonical !== expected.artifact ||
    input.v3ReviewCanonical !== expected.review || input.summary26251Present !== expected.summary51 ||
    input.summary26252Present !== expected.summary52) throw new TypeError("V138_PHASE_PLAN_INDEX_TRANSITION_INVALID")
  return Object.freeze({ planCount: 42 as const, summaryCount: expected.summaryCount, incomplete: Object.freeze([...expected.incomplete]) })
}

export const checkV138DependencyRevisionBoundaries = (
  repoRoot = defaultRepoRoot,
): V138DependencyRevisionBoundaryAnalysis => {
  const protectedEntries = protectedInventory(repoRoot)
  const policySourceCollection = collectV138ChangedPolicySources(repoRoot)
  const sources = policySourceCollection.sources
  const implementationBoundary = [
    "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
    "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
    "scripts/lib/v1-38-source-completeness-review-v3.ts",
    "scripts/lib/v1-38-successor-source-seal.ts",
    "scripts/lib/v1-38-current-matrix-reproduction.ts",
    "scripts/evaluate-v1-38-successor-route.test.ts",
    "scripts/evaluate-v1-38-successor-source-complete.test.ts",
    "scripts/check-v1-38-dependency-revision-boundaries.ts",
  ].sort()
  const correctedSourceBoundary = implementationBoundary.filter(repoPath =>
    !repoPath.includes("source-completeness-review-v2"))
  const deletedSourceBoundary = implementationBoundary.filter(repoPath =>
    !correctedSourceBoundary.includes(repoPath))
  const historicalDeletion = {
    commit: "8c3cab21d7da0d59101480e17a973e0317646622",
    parent: "af0520618b5f236b5d0b7afbb9f0bcebbad9e951",
    tree: "4e35defcf4ee02927aa7b56ec09d19e5cc9981ae",
    authorRun: "codex-plan-262-60-a9-v1",
    priorBlobs: {
      "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts":
        "bd380a22c5833f0c4a8b1829da655121538c8913",
      "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts":
        "b257f7a1d4931c4d44584e63c9e69ab62b115292",
    },
  } as const
  const a9Commits = git(repoRoot, ["log", "--first-parent", "--format=%H", "HEAD",
    `--grep=Plan-262-60-Author-Run: ${V138_PLAN_262_60_CORRECTION_RUN}`])
    .trim().split("\n").filter(Boolean)
  const orderedRun = [...a9Commits].reverse()
  const a9 = orderedRun.at(-1)
  const sourceBase9 = orderedRun.length === 0 ? undefined : git(repoRoot,
    ["show", "-s", "--format=%P", orderedRun[0]!]).trim()
  const aggregate = new Set<string>()
  let expectedParent = orderedRun.length === 0 ? "" : git(repoRoot, ["show", "-s",
    "--format=%P", orderedRun[0]!]).trim()
  const runValid = orderedRun.length > 0 && orderedRun.every(commit => {
    const parents = git(repoRoot, ["show", "-s", "--format=%P", commit]).trim()
      .split(" ").filter(Boolean)
    const changed = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
      "-r", "--no-renames", commit]).trim().split("\n").filter(Boolean).sort()
    const valid = parents.length === 1 && parents[0] === expectedParent &&
      changed.length > 0 && changed.every(repoPath => correctedSourceBoundary.includes(repoPath)) &&
      git(repoRoot, ["show", "-s",
        "--format=%(trailers:key=Plan-262-60-Author-Run,valueonly)", commit]).trim() ===
        V138_PLAN_262_60_CORRECTION_RUN
    changed.forEach(repoPath => aggregate.add(repoPath))
    expectedParent = commit
    return valid
  })
  const deletionFirstParentCount = a9 === undefined ? 0 : git(repoRoot,
    ["rev-list", "--first-parent", a9]).trim().split("\n")
    .filter(commit => commit === historicalDeletion.commit).length
  const deletionHistoryValid = a9 !== undefined && sourceBase9 !== undefined &&
    git(repoRoot, ["show", "-s", "--format=%P", historicalDeletion.commit]).trim() ===
      historicalDeletion.parent &&
    git(repoRoot, ["rev-parse", `${historicalDeletion.commit}^{tree}`]).trim() ===
      historicalDeletion.tree &&
    git(repoRoot, ["show", "-s",
      "--format=%(trailers:key=Plan-262-60-Author-Run,valueonly)",
      historicalDeletion.commit]).trim() === historicalDeletion.authorRun &&
    spawnSync("git", ["merge-base", "--is-ancestor", historicalDeletion.commit,
      sourceBase9], { cwd: repoRoot }).status === 0 &&
    spawnSync("git", ["merge-base", "--is-ancestor", historicalDeletion.commit,
      a9], { cwd: repoRoot }).status === 0 && deletionFirstParentCount === 1 &&
    deletedSourceBoundary.every(repoPath =>
      git(repoRoot, ["diff-tree", "--no-commit-id", "--name-status", "-r",
        "--no-renames", historicalDeletion.commit, "--", repoPath]).trim() ===
          `D\t${repoPath}` &&
      git(repoRoot, ["rev-parse", `${historicalDeletion.parent}:${repoPath}`]).trim() ===
        historicalDeletion.priorBlobs[
          repoPath as keyof typeof historicalDeletion.priorBlobs] &&
      git(repoRoot, ["ls-tree", "--name-only", a9, "--", repoPath]).trim() === "" &&
      !repositoryFilePresent(repoRoot, path.join(repoRoot, repoPath)))
  let productionCustodyValid = false
  if (a9 !== undefined && sourceBase9 !== undefined) {
    try {
      const custody = inspectV138SourceA9Custody(repoRoot,
        { sourceBase9, sourceA9: a9 })
      productionCustodyValid = custody.sourceBase9 === sourceBase9 &&
        custody.sourceA9 === a9 &&
        JSON.stringify([...custody.sourceA9Paths].sort()) ===
          JSON.stringify(correctedSourceBoundary)
    } catch { productionCustodyValid = false }
  }
  const a9SourceValid = runValid && productionCustodyValid && a9 !== undefined &&
    JSON.stringify([...aggregate].sort()) === JSON.stringify(correctedSourceBoundary) &&
    deletionHistoryValid &&
    git(repoRoot, ["log", "--format=%H", `${a9}..HEAD`, "--",
      ...correctedSourceBoundary])
      .trim() === ""
  const summaryPath = `${phaseDirectory}/262-60-SUMMARY.md`
  const summaryText = repositoryFile(repoRoot,
    path.join(repoRoot, summaryPath)).toString("utf8")
  const summaryA9 = /- \*\*sourceA9:\*\* `([0-9a-f]{40})`/u.exec(summaryText)?.[1]
  const summaryTree = /- \*\*sourceA9 tree:\*\* `([0-9a-f]{40})`/u
    .exec(summaryText)?.[1]
  const summaryParent = /- \*\*sourceA9 sole parent:\*\* `([0-9a-f]{40})`/u
    .exec(summaryText)?.[1]
  const summaryBindings = new Map<string, { blobOid: string; sha256: string }>()
  const bindingPattern = /^\| `([^`]+)` \| `100644` \| `([0-9a-f]{40})` \| `(sha256:[0-9a-f]{64})` \| [0-9]+ \|$/gmu
  for (const match of summaryText.matchAll(bindingPattern)) {
    summaryBindings.set(match[1]!, { blobOid: match[2]!, sha256: match[3]! })
  }
  const a9CarrierBindingsValid = a9SourceValid && summaryA9 === a9 &&
    summaryTree === git(repoRoot, ["rev-parse", `${a9}^{tree}`]).trim() &&
    summaryParent === git(repoRoot, ["show", "-s", "--format=%P", a9]).trim() &&
    [...summaryBindings].every(([repoPath, binding]) => {
      if (!correctedSourceBoundary.includes(repoPath)) return false
      const committed = execFileSync("git", ["show", `${a9}:${repoPath}`], {
        cwd: repoRoot, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 })
      return git(repoRoot, ["rev-parse", `${a9}:${repoPath}`]).trim() ===
        binding.blobOid && sha256(committed) === binding.sha256 &&
        repositoryFile(repoRoot, path.join(repoRoot, repoPath)).equals(committed)
    }) && JSON.stringify([...summaryBindings.keys()].sort()) ===
      JSON.stringify(correctedSourceBoundary)
  const changedLineRanges = new Map<string, readonly [number, number][]>()
  if (a9CarrierBindingsValid && sourceBase9 !== undefined) {
    for (const repoPath of correctedSourceBoundary) {
      const diff = git(repoRoot, ["diff", "--unified=0", sourceBase9, a9!, "--",
        repoPath])
      changedLineRanges.set(repoPath, [...diff.matchAll(
        /^@@ -(?:[0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,([0-9]+))? @@/gmu)]
        .map(match => [Number(match[1]), Number(match[2] ?? "1")] as const)
        .filter(([, count]) => count > 0)
        .map(([start, count]) => [start, start + count - 1] as const))
    }
  }
  const policyFindings = analyzeV138PolicySourcesWithFrozenRouteAllowlist(sources)
    .filter((finding) => !(finding.code === "ROUTE_CAPABLE_SOURCE_DRIFT" &&
      a9CarrierBindingsValid && summaryBindings.has(finding.path)))
    .filter((finding) => {
      if (!a9CarrierBindingsValid || finding.code === "ROUTE_CAPABLE_SOURCE_DRIFT") {
        return true
      }
      const ranges = changedLineRanges.get(finding.path)
      return ranges === undefined || ranges.some(([start, end]) =>
        finding.line >= start && finding.line <= end)
    })
    .filter((finding) => !policySourceCollection.findings.some((collectionFinding) =>
      collectionFinding.code === finding.code &&
      collectionFinding.path === finding.path))
  const findings = [
    ...analyzeV138ProtectedHistory(repoRoot, protectedEntries),
    ...analyzeV138ProtectedHistory(repoRoot, [
      { path: archivedCheckpoint.archivalPath, sha256: archivedCheckpoint.sha256 },
      { path: archivedSentinel.archivalPath, sha256: archivedSentinel.sha256 },
      {
        path: `${phaseDirectory}/262-42-SUMMARY.md`,
        sha256: protectedTerminalHistory.plan26242SummarySha256,
      },
      {
        path: ".planning/artifacts/v1.38-phase-262-terminal-deferment.json",
        sha256: protectedTerminalHistory.terminalDispositionSha256,
      },
      {
        path: `${phaseDirectory}/262-LOCAL-SEALED-HOLDOUT-RESEARCH.md`,
        sha256: successorContract.researchInputSha256,
      },
      {
        path: `${phaseDirectory}/dormant/262-41-ACTIVATION-CONTRACT.md`,
        sha256: "sha256:5d42af52835c2bbd8eaba1868d50bde1384d143f7f8822b6a9e725bac1075641",
      },
    ]),
    ...policySourceCollection.findings,
    ...policyFindings,
    ...analyzeV138DependencyRevisionPaths(changedPaths(repoRoot)),
    ...analyzeV138LocalSealCarriers(Object.fromEntries([
      [".planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md"],
      [".planning/REQUIREMENTS.md"],
      [`${phaseDirectory}/262-CONTEXT.md`],
      [".planning/ROADMAP.md"],
      [".planning/research/SUMMARY.md"],
      [".planning/research/competitive-strategy-factory-and-adversarial-league.md"],
      [".planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md"],
      [".planning/STATE.md"],
    ].map(([repoPath]) => [repoPath, repositoryFile(repoRoot,
      path.join(repoRoot, repoPath)).toString("utf8")]))),
    ...correctiveRequirementDispositionFindings(repoRoot),
    ...correctiveLifecycleCarrierFindings(repoRoot),
    ...planDiscoveryFindings(repoRoot),
  ]
  const expectedManifest = renderV138PlanSupersessionManifest()
  const manifestTarget = path.join(repoRoot, manifestPath)
  const manifestBytes = readV138RepositoryFileNoFollow(repoRoot,
    manifestTarget, "optional")
  if (manifestBytes === undefined || manifestBytes.toString("utf8") !==
    expectedManifest) findings.push({
    code: "MANIFEST_DRIFT",
    path: manifestPath,
    line: 1,
    detail: "Supersession manifest is missing or not byte-identical to its canonical rendering.",
  })
  for (const forbiddenPath of [
    ".planning/artifacts/v1.38-custody-public-reference.json",
    ".planning/artifacts/v1.38-local-seal-public-reference.json",
    ".planning/artifacts/v1.38-foundation-activation-root.json",
    ".planning/artifacts/v1.38-current-matrix-reproduction-v10.json",
  ]) if (repositoryFilePresent(repoRoot,
    path.join(repoRoot, forbiddenPath))) findings.push({
    code: "AUTHORITY_ARTIFACT_PRESENT",
    path: forbiddenPath,
    line: 1,
    detail: "Custody, activation, or reproduction:v10 authority artifact must remain absent.",
  })
  for (const repoPath of [
    "packages/replay/src/historical-v1-4.test.ts",
    "packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json",
  ]) {
    const source = repositoryFile(repoRoot, path.join(repoRoot, repoPath))
      .toString("utf8")
    if (!source.includes(V138_DEPENDENCY_REVISION_TOOLING_DEPENDENCY.frozenCommit)) findings.push({
      code: "TOOLING_DEPENDENCY_DRIFT",
      path: repoPath,
      line: 1,
      detail: "Frozen replay commit classification was changed or substituted.",
    })
  }
  findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.code.localeCompare(b.code))
  return {
    findings,
    protectedPathCount: protectedEntries.length,
    scannedSourceCount: Object.keys(sources).length,
    protectedInventoryRoot: identityRoot("v1.38-protected-phase-262-history-v1", protectedEntries),
  }
}

const isDirectExecution = (): boolean =>
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution()) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === "--write") {
    writeFileSync(path.join(defaultRepoRoot, manifestPath), renderV138PlanSupersessionManifest(), { flag: "wx", mode: 0o644 })
  } else if (!(args.length === 1 && args[0] === "--check")) {
    process.stderr.write("V138_DEPENDENCY_REVISION_MODE_INVALID\n")
    process.exitCode = 1
  }
  if (process.exitCode !== 1) {
    try {
      const analysis = checkV138DependencyRevisionBoundaries()
      if (analysis.findings.length !== 0) {
        process.stderr.write(`${JSON.stringify({ status: "failed_boundaries",
          findingCount: analysis.findings.length,
          findings: analysis.findings })}\n`)
        process.exitCode = 1
        throw new TypeError("V138_DEPENDENCY_REVISION_BOUNDARIES_FAILED")
      }
      const lifecycle = checkV138Plan26260LiveLifecycle()
      process.stdout.write(`${JSON.stringify({ status: "passed",
        findingCount: 0, protectedPathCount: analysis.protectedPathCount,
        scannedSourceCount: analysis.scannedSourceCount, ...lifecycle,
        matrixAdmissionStatus: "blocked",
        downstreamAuthority: "denied" })}\n`)
    } catch (error) {
      if (process.exitCode !== 1) process.stderr.write(`${error instanceof Error ?
        error.message : "V138_PLAN_262_58_LIFECYCLE_INVALID"}\n`)
      process.exitCode = 1
    }
  }
}
