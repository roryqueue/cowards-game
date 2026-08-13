#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { encodeCanonicalJson } from "../packages/spec/src/canonical-json-encode.js"
import { hashCanonicalIdentity } from "../packages/spec/src/canonical-identity-domains.js"
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.js"
import type { JsonValue } from "../packages/spec/src/types.js"
import {
  V138_CURRENT_STOPPED_BRANCH,
  evaluateV138DownstreamAuthority,
} from "./lib/v1-38-policy-authority.js"

type Sha256 = `sha256:${string}`
type RecordValue = Record<string, unknown>

const defaultRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const artifactPath = ".planning/artifacts/v1.38-phase-262-terminal-deferment.json"
const generatorPath = "scripts/evaluate-v1-38-terminal-disposition.ts"
const testPath = "scripts/evaluate-v1-38-terminal-disposition.test.ts"
const authorityPath = "scripts/lib/v1-38-policy-authority.ts"
const policyArtifactPath = ".planning/artifacts/v1.38-pre-search-policy-root.json"
const planPath = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-42-PLAN.md"
const sentinelPath = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-43-PLAN.md"
const archivedPath = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-40-HISTORICAL.md"
const dormantPath = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/dormant/262-41-ACTIVATION-CONTRACT.md"
const policyRoot = "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" as const
const archivedSha256 = "sha256:e745ba878fcd0090a968762f314c787dae86896d27f2bc8a72498d684ed39231" as const
const dormantSha256 = "sha256:5d42af52835c2bbd8eaba1868d50bde1384d143f7f8822b6a9e725bac1075641" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u

const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("V138_TERMINAL_DISPOSITION_CANONICAL_INVALID")
  return encoded.bytes
}

const rootIdentity = (value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("artifactManifest", [
    Buffer.from("cowards-game:v1.38:phase-262-terminal-deferment:v1", "utf8"),
    canonicalBytes(value),
  ])}`

const isRecord = (value: unknown): value is RecordValue =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const asRecord = (value: unknown, code: string): RecordValue => {
  if (!isRecord(value)) throw new TypeError(code)
  return value
}

const exactKeys = (value: RecordValue, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

export interface V138TerminalDispositionSourceBindings {
  readonly generatorPath: typeof generatorPath
  readonly generatorSha256: Sha256
  readonly testPath: typeof testPath
  readonly testSha256: Sha256
  readonly authorityPath: typeof authorityPath
  readonly authoritySha256: Sha256
  readonly preSearchPolicyArtifactPath: typeof policyArtifactPath
  readonly preSearchPolicyArtifactSha256: Sha256
  readonly planPath: typeof planPath
  readonly planSha256: Sha256
  readonly sentinelPath: typeof sentinelPath
  readonly sentinelSha256: Sha256
}

export interface V138TerminalDisposition {
  readonly schemaVersion: "v1.38-phase-262-terminal-deferment-v1"
  readonly dispositionKind: "phase_262_terminal_deferment"
  readonly identityDomain: "cowards-game:v1.38:phase-262-terminal-deferment:v1"
  readonly operatorFact: Readonly<{
    fact: "no_external_custody_system"
    externalCustodySystem: "absent_confirmed"
  }>
  readonly custody: Readonly<{
    status: "unavailable"
    seal01: "unmet"
    satisfiesSeal01: false
    publicCustodyReferencePresent: false
  }>
  readonly admission: Readonly<{
    routeTerminal: "calibration_stopped"
    admit03: "blocked"
    authorityExpired: true
    noRetry: true
    freshCharged: 0
    freshAccepted: 0
    requiredAccepted: 540
    reproductionV10Present: false
  }>
  readonly policy: Readonly<{
    status: "ready"
    authorizing: false
    preSearchPolicyRoot: typeof policyRoot
  }>
  readonly lifecycle: Readonly<{
    phaseStatus: "deferred_incomplete"
    verificationStatus: "gaps_found"
    milestoneStatus: "paused_deferred"
    totalPlans: 36
    completedSummariesBeforeCloseout: 34
    incompleteBeforeCloseout: readonly ["262-42", "262-43"]
    incompleteAfterCloseout: readonly ["262-43"]
  }>
  readonly resumption: Readonly<{
    requiresBothPrerequisites: true
    externalCustodySystemRequired: true
    separatelyPlannedLiteralAdmit03PassRouteRequired: true
    action: "fresh_gsd_plan_phase_262"
    archivedPlan26240MayResume: false
    dormantPlan26241MayExecute: false
    pendingPlan26243MayBecomeAuthority: false
  }>
  readonly denials: Readonly<{
    satisfiesAdmit03: false
    satisfiesSeal01: false
    candidateSearchAuthorized: false
    phase263Authorized: false
    formationMaterializationAuthorized: false
    productionAuthorized: false
  }>
  readonly absences: Readonly<{
    custodyReferencePresent: false
    activationRootPresent: false
    reproductionV10Present: false
    executableFormationArtifactPresent: false
    candidateSearchAuthorityPresent: false
    phase263AuthorityPresent: false
    publicCustodyOrActivationRootPresent: false
    routeWriterPresent: false
  }>
  readonly protectedLineage: Readonly<{
    archivedPlan26240: Readonly<{ path: typeof archivedPath; sha256: typeof archivedSha256; resumable: false }>
    dormantPlan26241: Readonly<{ path: typeof dormantPath; sha256: typeof dormantSha256; executable: false }>
    pendingPlan26243: Readonly<{ path: typeof sentinelPath; summaryPresent: false; requirementCredit: false; authoritySource: false }>
  }>
  readonly toolingDependency: "frozen_replay_commit_unreachable"
  readonly sourceBindings: V138TerminalDispositionSourceBindings
  readonly dispositionRoot: Sha256
}

const rootKeys = Object.freeze([
  "schemaVersion", "dispositionKind", "identityDomain", "operatorFact", "custody",
  "admission", "policy", "lifecycle", "resumption", "denials", "absences",
  "protectedLineage", "toolingDependency", "sourceBindings", "dispositionRoot",
] as const)
const denialKeys = Object.freeze([
  "satisfiesAdmit03", "satisfiesSeal01", "candidateSearchAuthorized",
  "phase263Authorized", "formationMaterializationAuthorized", "productionAuthorized",
] as const)
const sourceBindingKeys = Object.freeze([
  "generatorPath", "generatorSha256", "testPath", "testSha256", "authorityPath",
  "authoritySha256", "preSearchPolicyArtifactPath", "preSearchPolicyArtifactSha256",
  "planPath", "planSha256", "sentinelPath", "sentinelSha256",
] as const)

const validateSourceBindings = (value: unknown): V138TerminalDispositionSourceBindings => {
  const bindings = asRecord(value, "V138_TERMINAL_DISPOSITION_SOURCE_BINDINGS_INVALID")
  if (!exactKeys(bindings, sourceBindingKeys) || bindings.generatorPath !== generatorPath ||
    bindings.testPath !== testPath || bindings.authorityPath !== authorityPath ||
    bindings.preSearchPolicyArtifactPath !== policyArtifactPath || bindings.planPath !== planPath ||
    bindings.sentinelPath !== sentinelPath ||
    [bindings.generatorSha256, bindings.testSha256, bindings.authoritySha256,
      bindings.preSearchPolicyArtifactSha256, bindings.planSha256, bindings.sentinelSha256]
      .some((entry) => typeof entry !== "string" || !SHA256.test(entry))) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_SOURCE_BINDINGS_INVALID")
  }
  return bindings as unknown as V138TerminalDispositionSourceBindings
}

export interface V138TerminalDispositionBuildInput {
  readonly sourceBindings: V138TerminalDispositionSourceBindings
}

export const buildV138TerminalDisposition = (
  input: V138TerminalDispositionBuildInput,
): V138TerminalDisposition => {
  if (!isRecord(input) || !exactKeys(input, ["sourceBindings"])) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_INPUT_INVALID")
  }
  const sourceBindings = validateSourceBindings(input.sourceBindings)
  if (evaluateV138DownstreamAuthority({
    policyStatus: "ready",
    matrixAdmissionStatus: "blocked",
    custodyStatus: "unavailable",
    containmentPassed: true,
    identitiesJoined: true,
  }) !== "denied") throw new TypeError("V138_TERMINAL_DISPOSITION_AUTHORITY_INVALID")

  const frame = {
    schemaVersion: "v1.38-phase-262-terminal-deferment-v1" as const,
    dispositionKind: "phase_262_terminal_deferment" as const,
    identityDomain: "cowards-game:v1.38:phase-262-terminal-deferment:v1" as const,
    operatorFact: Object.freeze({
      fact: "no_external_custody_system" as const,
      externalCustodySystem: "absent_confirmed" as const,
    }),
    custody: Object.freeze({
      status: "unavailable" as const,
      seal01: "unmet" as const,
      satisfiesSeal01: false as const,
      publicCustodyReferencePresent: false as const,
    }),
    admission: Object.freeze({
      routeTerminal: V138_CURRENT_STOPPED_BRANCH.disposition,
      admit03: V138_CURRENT_STOPPED_BRANCH.admit03,
      authorityExpired: V138_CURRENT_STOPPED_BRANCH.authorityExpired,
      noRetry: V138_CURRENT_STOPPED_BRANCH.noRetry,
      freshCharged: V138_CURRENT_STOPPED_BRANCH.freshCharged,
      freshAccepted: V138_CURRENT_STOPPED_BRANCH.freshAccepted,
      requiredAccepted: 540 as const,
      reproductionV10Present: false as const,
    }),
    policy: Object.freeze({ status: "ready" as const, authorizing: false as const, preSearchPolicyRoot: policyRoot }),
    lifecycle: Object.freeze({
      phaseStatus: "deferred_incomplete" as const,
      verificationStatus: "gaps_found" as const,
      milestoneStatus: "paused_deferred" as const,
      totalPlans: 36 as const,
      completedSummariesBeforeCloseout: 34 as const,
      incompleteBeforeCloseout: Object.freeze(["262-42", "262-43"] as const),
      incompleteAfterCloseout: Object.freeze(["262-43"] as const),
    }),
    resumption: Object.freeze({
      requiresBothPrerequisites: true as const,
      externalCustodySystemRequired: true as const,
      separatelyPlannedLiteralAdmit03PassRouteRequired: true as const,
      action: "fresh_gsd_plan_phase_262" as const,
      archivedPlan26240MayResume: false as const,
      dormantPlan26241MayExecute: false as const,
      pendingPlan26243MayBecomeAuthority: false as const,
    }),
    denials: Object.freeze({
      satisfiesAdmit03: false as const,
      satisfiesSeal01: false as const,
      candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      productionAuthorized: false as const,
    }),
    absences: Object.freeze({
      custodyReferencePresent: false as const,
      activationRootPresent: false as const,
      reproductionV10Present: false as const,
      executableFormationArtifactPresent: false as const,
      candidateSearchAuthorityPresent: false as const,
      phase263AuthorityPresent: false as const,
      publicCustodyOrActivationRootPresent: false as const,
      routeWriterPresent: false as const,
    }),
    protectedLineage: Object.freeze({
      archivedPlan26240: Object.freeze({ path: archivedPath, sha256: archivedSha256, resumable: false as const }),
      dormantPlan26241: Object.freeze({ path: dormantPath, sha256: dormantSha256, executable: false as const }),
      pendingPlan26243: Object.freeze({ path: sentinelPath, summaryPresent: false as const, requirementCredit: false as const, authoritySource: false as const }),
    }),
    toolingDependency: "frozen_replay_commit_unreachable" as const,
    sourceBindings: Object.freeze({ ...sourceBindings }),
  }
  const result = Object.freeze({ ...frame, dispositionRoot: rootIdentity(frame) })
  assertPublicOutputLeakSafe(result, "v1.38 Phase 262 terminal disposition")
  return result
}

export const generateV138TerminalDisposition = (
  repoRoot = defaultRepoRoot,
): V138TerminalDisposition => {
  const policyArtifact = asRecord(
    JSON.parse(readFileSync(path.join(repoRoot, policyArtifactPath), "utf8")),
    "V138_TERMINAL_DISPOSITION_POLICY_INVALID",
  )
  if (policyArtifact.policyRoot !== policyRoot || policyArtifact.policyStatus !== "ready" ||
    policyArtifact.downstreamAuthority !== "denied") {
    throw new TypeError("V138_TERMINAL_DISPOSITION_POLICY_INVALID")
  }
  if (sha256(readFileSync(path.join(repoRoot, archivedPath))) !== archivedSha256 ||
    sha256(readFileSync(path.join(repoRoot, dormantPath))) !== dormantSha256) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_PROTECTED_LINEAGE_INVALID")
  }
  return buildV138TerminalDisposition({
    sourceBindings: {
      generatorPath,
      generatorSha256: sha256(readFileSync(path.join(repoRoot, generatorPath))),
      testPath,
      testSha256: sha256(readFileSync(path.join(repoRoot, testPath))),
      authorityPath,
      authoritySha256: sha256(readFileSync(path.join(repoRoot, authorityPath))),
      preSearchPolicyArtifactPath: policyArtifactPath,
      preSearchPolicyArtifactSha256: sha256(readFileSync(path.join(repoRoot, policyArtifactPath))),
      planPath,
      planSha256: sha256(readFileSync(path.join(repoRoot, planPath))),
      sentinelPath,
      sentinelSha256: sha256(readFileSync(path.join(repoRoot, sentinelPath))),
    },
  })
}

export const validateV138TerminalDisposition = (input: unknown): V138TerminalDisposition => {
  const value = asRecord(input, "V138_TERMINAL_DISPOSITION_INVALID")
  if (!exactKeys(value, rootKeys) || value.schemaVersion !== "v1.38-phase-262-terminal-deferment-v1" ||
    value.dispositionKind !== "phase_262_terminal_deferment" ||
    value.identityDomain !== "cowards-game:v1.38:phase-262-terminal-deferment:v1" ||
    value.toolingDependency !== "frozen_replay_commit_unreachable") {
    throw new TypeError("V138_TERMINAL_DISPOSITION_INVALID")
  }
  const operatorFact = asRecord(value.operatorFact, "V138_TERMINAL_DISPOSITION_OPERATOR_FACT_INVALID")
  const custody = asRecord(value.custody, "V138_TERMINAL_DISPOSITION_CUSTODY_INVALID")
  const admission = asRecord(value.admission, "V138_TERMINAL_DISPOSITION_ADMISSION_INVALID")
  const policy = asRecord(value.policy, "V138_TERMINAL_DISPOSITION_POLICY_INVALID")
  const lifecycle = asRecord(value.lifecycle, "V138_TERMINAL_DISPOSITION_LIFECYCLE_INVALID")
  const resumption = asRecord(value.resumption, "V138_TERMINAL_DISPOSITION_RESUMPTION_INVALID")
  const denials = asRecord(value.denials, "V138_TERMINAL_DISPOSITION_DENIALS_INVALID")
  const absences = asRecord(value.absences, "V138_TERMINAL_DISPOSITION_ABSENCES_INVALID")
  const lineage = asRecord(value.protectedLineage, "V138_TERMINAL_DISPOSITION_LINEAGE_INVALID")
  if (!exactKeys(operatorFact, ["fact", "externalCustodySystem"]) ||
    operatorFact.fact !== "no_external_custody_system" || operatorFact.externalCustodySystem !== "absent_confirmed") {
    throw new TypeError("V138_TERMINAL_DISPOSITION_OPERATOR_FACT_INVALID")
  }
  if (!exactKeys(custody, ["status", "seal01", "satisfiesSeal01", "publicCustodyReferencePresent"]) ||
    custody.status !== "unavailable" || custody.seal01 !== "unmet" || custody.satisfiesSeal01 !== false ||
    custody.publicCustodyReferencePresent !== false) throw new TypeError("V138_TERMINAL_DISPOSITION_CUSTODY_INVALID")
  if (!exactKeys(admission, ["routeTerminal", "admit03", "authorityExpired", "noRetry", "freshCharged", "freshAccepted", "requiredAccepted", "reproductionV10Present"]) ||
    admission.routeTerminal !== "calibration_stopped" || admission.admit03 !== "blocked" ||
    admission.authorityExpired !== true || admission.noRetry !== true || admission.freshCharged !== 0 ||
    admission.freshAccepted !== 0 || admission.requiredAccepted !== 540 || admission.reproductionV10Present !== false) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_ADMISSION_INVALID")
  }
  if (!exactKeys(policy, ["status", "authorizing", "preSearchPolicyRoot"]) || policy.status !== "ready" ||
    policy.authorizing !== false || policy.preSearchPolicyRoot !== policyRoot) throw new TypeError("V138_TERMINAL_DISPOSITION_POLICY_INVALID")
  if (!exactKeys(lifecycle, ["phaseStatus", "verificationStatus", "milestoneStatus", "totalPlans", "completedSummariesBeforeCloseout", "incompleteBeforeCloseout", "incompleteAfterCloseout"]) ||
    lifecycle.phaseStatus !== "deferred_incomplete" || lifecycle.verificationStatus !== "gaps_found" ||
    lifecycle.milestoneStatus !== "paused_deferred" || lifecycle.totalPlans !== 36 ||
    lifecycle.completedSummariesBeforeCloseout !== 34 || JSON.stringify(lifecycle.incompleteBeforeCloseout) !== '["262-42","262-43"]' ||
    JSON.stringify(lifecycle.incompleteAfterCloseout) !== '["262-43"]') throw new TypeError("V138_TERMINAL_DISPOSITION_LIFECYCLE_INVALID")
  if (!exactKeys(resumption, ["requiresBothPrerequisites", "externalCustodySystemRequired", "separatelyPlannedLiteralAdmit03PassRouteRequired", "action", "archivedPlan26240MayResume", "dormantPlan26241MayExecute", "pendingPlan26243MayBecomeAuthority"]) ||
    resumption.requiresBothPrerequisites !== true || resumption.externalCustodySystemRequired !== true ||
    resumption.separatelyPlannedLiteralAdmit03PassRouteRequired !== true || resumption.action !== "fresh_gsd_plan_phase_262" ||
    resumption.archivedPlan26240MayResume !== false || resumption.dormantPlan26241MayExecute !== false ||
    resumption.pendingPlan26243MayBecomeAuthority !== false) throw new TypeError("V138_TERMINAL_DISPOSITION_RESUMPTION_INVALID")
  if (!exactKeys(denials, denialKeys) || denialKeys.some((key) => denials[key] !== false)) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_DENIALS_INVALID")
  }
  const absenceKeys = ["custodyReferencePresent", "activationRootPresent", "reproductionV10Present", "executableFormationArtifactPresent", "candidateSearchAuthorityPresent", "phase263AuthorityPresent", "publicCustodyOrActivationRootPresent", "routeWriterPresent"] as const
  if (!exactKeys(absences, absenceKeys) || absenceKeys.some((key) => absences[key] !== false)) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_ABSENCES_INVALID")
  }
  const archived = asRecord(lineage.archivedPlan26240, "V138_TERMINAL_DISPOSITION_LINEAGE_INVALID")
  const dormant = asRecord(lineage.dormantPlan26241, "V138_TERMINAL_DISPOSITION_LINEAGE_INVALID")
  const pending = asRecord(lineage.pendingPlan26243, "V138_TERMINAL_DISPOSITION_LINEAGE_INVALID")
  if (!exactKeys(lineage, ["archivedPlan26240", "dormantPlan26241", "pendingPlan26243"]) ||
    !exactKeys(archived, ["path", "sha256", "resumable"]) || archived.path !== archivedPath || archived.sha256 !== archivedSha256 || archived.resumable !== false ||
    !exactKeys(dormant, ["path", "sha256", "executable"]) || dormant.path !== dormantPath || dormant.sha256 !== dormantSha256 || dormant.executable !== false ||
    !exactKeys(pending, ["path", "summaryPresent", "requirementCredit", "authoritySource"]) || pending.path !== sentinelPath ||
    pending.summaryPresent !== false || pending.requirementCredit !== false || pending.authoritySource !== false) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_LINEAGE_INVALID")
  }
  validateSourceBindings(value.sourceBindings)
  const { dispositionRoot: _root, ...frame } = value
  if (typeof value.dispositionRoot !== "string" || value.dispositionRoot !== rootIdentity(frame)) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_ROOT_MISMATCH")
  }
  assertPublicOutputLeakSafe(value, "v1.38 Phase 262 terminal disposition")
  return value as unknown as V138TerminalDisposition
}

export const renderV138TerminalDisposition = (
  disposition = generateV138TerminalDisposition(),
): string => `${Buffer.from(canonicalBytes(validateV138TerminalDisposition(disposition))).toString("utf8")}\n`

export const writeV138TerminalDisposition = (
  repoRoot = defaultRepoRoot,
  target = path.join(repoRoot, artifactPath),
): V138TerminalDisposition => {
  if (existsSync(target)) throw new TypeError("V138_TERMINAL_DISPOSITION_ARTIFACT_EXISTS")
  mkdirSync(path.dirname(target), { recursive: true })
  const result = generateV138TerminalDisposition(repoRoot)
  const temporary = `${target}.tmp-${process.pid}`
  if (existsSync(temporary)) throw new TypeError("V138_TERMINAL_DISPOSITION_TEMP_EXISTS")
  try {
    writeFileSync(temporary, renderV138TerminalDisposition(result), { flag: "wx", mode: 0o644 })
    linkSync(temporary, target)
    unlinkSync(temporary)
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary)
    throw error
  }
  return result
}

export const checkV138TerminalDisposition = (
  repoRoot = defaultRepoRoot,
  target = path.join(repoRoot, artifactPath),
): V138TerminalDisposition => {
  if (!existsSync(target)) throw new TypeError("V138_TERMINAL_DISPOSITION_ARTIFACT_MISSING")
  const expected = generateV138TerminalDisposition(repoRoot)
  const actualBytes = readFileSync(target, "utf8")
  const actual = validateV138TerminalDisposition(JSON.parse(actualBytes))
  if (actualBytes !== renderV138TerminalDisposition(expected) || actual.dispositionRoot !== expected.dispositionRoot) {
    throw new TypeError("V138_TERMINAL_DISPOSITION_ARTIFACT_EDITED")
  }
  return actual
}

const publicSummary = (result: V138TerminalDisposition) => Object.freeze({
  dispositionRoot: result.dispositionRoot,
  operatorFact: result.operatorFact.fact,
  custodyStatus: result.custody.status,
  routeTerminal: result.admission.routeTerminal,
  admit03: result.admission.admit03,
  seal01: result.custody.seal01,
  phaseStatus: result.lifecycle.phaseStatus,
  verificationStatus: result.lifecycle.verificationStatus,
  milestoneStatus: result.lifecycle.milestoneStatus,
  pendingSentinel: result.lifecycle.incompleteAfterCloseout[0],
  downstreamAuthority: "denied" as const,
})

const isDirectExecution = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  try {
    const args = process.argv.slice(2)
    const result = args.length === 1 && args[0] === "--write"
      ? writeV138TerminalDisposition(defaultRepoRoot)
      : args.length === 1 && args[0] === "--check"
        ? checkV138TerminalDisposition(defaultRepoRoot)
        : (() => { throw new TypeError("V138_TERMINAL_DISPOSITION_MODE_INVALID") })()
    process.stdout.write(`${JSON.stringify(publicSummary(result))}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "V138_TERMINAL_DISPOSITION_FAILED"}\n`)
    process.exitCode = 1
  }
}
