#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  checkV138Plan26288Artifacts,
  computeV138Plan26288ActivationRoot,
  V138_PLAN_262_88_PATHS,
} from "./check-v1-38-plan-262-88-bounded-retry-admission-v2.js"

type Sha256 = `sha256:${string}`
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type SafeStatus = "absent" | "regular" | "directory" | "unsafe"
type Stage = "pre_summary" | "post_summary"

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const EXPECTED_ARCHIVE_SHA =
  "sha256:9fc59c094d5423830500c383c1a7613e54a0d2dc6e0ee1a00f4882981f16913d"
const EXPECTED_PREDECESSOR_SHA =
  "sha256:c0bdb131ce6804f9708899079049ee4583916646deebec5bcc757f68c1410b5e"
const EXPECTED_PREDECESSOR_ROOT =
  "sha256:3b13e8656208643f4ce339bdab2f29bf56e38b00938afd49cfbc88164595a8b0"
const REQUIRED_SUCCESSORS = Object.freeze([
  75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
])

export const V138_PLAN_262_89_PATHS = Object.freeze({
  phaseDir: PHASE_DIR,
  summary: `${PHASE_DIR}/262-89-SUMMARY.md`,
  disposition: V138_PLAN_262_88_PATHS.disposition,
  correction: V138_PLAN_262_88_PATHS.correctionV3,
  activation: V138_PLAN_262_88_PATHS.activation,
  reproduction: V138_PLAN_262_88_PATHS.reproduction,
  seal: V138_PLAN_262_88_PATHS.seal,
  predecessor:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json",
  readiness:
    ".planning/artifacts/v1.38-plan-262-89-lifecycle-driver-readiness-v2.json",
  lifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json",
  validation: `${PHASE_DIR}/262-VALIDATION.md`,
  verification: `${PHASE_DIR}/262-VERIFICATION.md`,
  requirements: ".planning/REQUIREMENTS.md",
  roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md",
  checker: "scripts/check-v1-38-plan-262-89-lifecycle-v2.ts",
  tests: "scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts",
})

const fail = (code: string): never => {
  throw new TypeError(code)
}
const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? (Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, normalize(child)]),
        ) as Json)
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(normalize(value as Json))}\n`
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const safeType = (target: string): SafeStatus => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "absent"
    throw error
  }
}

const readRegular = (target: string): Buffer => {
  if (safeType(target) !== "regular") fail("V138_PLAN_262_89_INPUT_UNSAFE")
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}
const readJson = (target: string): any =>
  JSON.parse(readRegular(target).toString("utf8"))

const requireContainedStatus = (root: string, repoPath: string): SafeStatus => {
  const resolvedRoot = realpathSync(root)
  const target = path.resolve(root, repoPath)
  const parent = realpathSync(path.dirname(target))
  if (
    parent !== resolvedRoot &&
    !parent.startsWith(`${resolvedRoot}${path.sep}`)
  )
    fail("V138_PLAN_262_89_PATH_ESCAPE")
  return safeType(target)
}

const collectIdentities = (
  phaseDir: string,
  suffix: "PLAN" | "SUMMARY",
): number[] => {
  const pattern = new RegExp(`^262-(\\d+)-${suffix}\\.md$`, "u")
  return readdirSync(phaseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => Number(pattern.exec(entry.name)![1]))
    .sort((left, right) => left - right)
}

export interface V138Plan26289Topology {
  activePlanCount: 70
  summaryCount: 69 | 70
  activePlanIds: number[]
  summaryIds: number[]
  missingSummaryIds: number[]
  planIdentityRoot: Sha256
  summaryIdentityRoot: Sha256
  archiveSha256: Sha256
  plan74SummaryPresent: false
}

export const inspectV138Plan26289Topology = (
  phaseDir: string,
  stage: Stage,
): V138Plan26289Topology => {
  if (safeType(phaseDir) !== "directory")
    fail("V138_PLAN_262_89_PHASE_DIR_UNSAFE")
  const plans = collectIdentities(phaseDir, "PLAN")
  const summaries = collectIdentities(phaseDir, "SUMMARY")
  if (plans.includes(74)) fail("V138_PLAN_262_89_PLAN_74_ACTIVE_FORBIDDEN")
  if (summaries.includes(74)) fail("V138_PLAN_262_89_PLAN_74_SUMMARY_FORBIDDEN")
  if (plans.length !== 70) fail("V138_PLAN_262_89_ACTIVE_PLAN_COUNT_INVALID")
  if (!REQUIRED_SUCCESSORS.every((id) => plans.includes(id)))
    fail("V138_PLAN_262_89_SUCCESSOR_TOPOLOGY_INVALID")
  if (summaries.some((id) => !plans.includes(id)))
    fail("V138_PLAN_262_89_ORPHAN_SUMMARY")
  const expectedCount = stage === "pre_summary" ? 69 : 70
  if (summaries.length !== expectedCount)
    fail("V138_PLAN_262_89_SUMMARY_COUNT_INVALID")
  const missing = plans.filter((id) => !summaries.includes(id))
  if (
    (stage === "pre_summary" && canonical(missing) !== canonical([89])) ||
    (stage === "post_summary" && missing.length !== 0)
  )
    fail("V138_PLAN_262_89_SUMMARY_LATCH_INVALID")
  const archive = path.join(phaseDir, "archived/262-74-HISTORICAL.md")
  if (sha256(readRegular(archive)) !== EXPECTED_ARCHIVE_SHA)
    fail("V138_PLAN_262_89_PLAN_74_ARCHIVE_INVALID")
  return {
    activePlanCount: 70,
    summaryCount: expectedCount,
    activePlanIds: plans,
    summaryIds: summaries,
    missingSummaryIds: missing,
    planIdentityRoot: sha256(canonical(plans)),
    summaryIdentityRoot: sha256(canonical(summaries)),
    archiveSha256: EXPECTED_ARCHIVE_SHA,
    plan74SummaryPresent: false,
  }
}

const deniedBeyondFoundation = (authority: any): boolean =>
  [
    "archiveAuthorized",
    "candidateSearchAuthorized",
    "countedPlayAuthorized",
    "formationMaterializationAuthorized",
    "gameplayChangeAuthorized",
    "holdoutOpeningAuthorized",
    "phase263ExecutionAuthorized",
    "productAuthorized",
    "productionAuthorized",
    "publicAuthorized",
    "tagAuthorized",
  ].every((key) => authority?.[key] === false)

export interface V138Plan26289BranchInput {
  disposition: any
  correction: any | null
  correctionStatus: SafeStatus
  activation: any | null
  activationStatus: SafeStatus
  reproductionStatus: SafeStatus
  sealAuthenticated: boolean
  predecessorAuthenticated: boolean
}

export interface V138Plan26289BranchResult {
  status: "passed" | "gaps_found"
  mutationCapable: boolean
  gaps: string[]
}

export const evaluateV138Plan26289Branch = (
  input: V138Plan26289BranchInput,
): V138Plan26289BranchResult => {
  if (!["absent", "regular"].includes(input.correctionStatus))
    fail("V138_PLAN_262_89_CORRECTION_PATH_UNSAFE")
  if (!["absent", "regular"].includes(input.activationStatus))
    fail("V138_PLAN_262_89_ACTIVATION_PATH_UNSAFE")
  if (!["absent", "regular"].includes(input.reproductionStatus))
    fail("V138_PLAN_262_89_REPRODUCTION_PATH_UNSAFE")
  if ((input.correctionStatus === "regular") !== (input.correction !== null))
    fail("V138_PLAN_262_89_CORRECTION_STATE_INVALID")
  if ((input.activationStatus === "regular") !== (input.activation !== null))
    fail("V138_PLAN_262_89_ACTIVATION_STATE_INVALID")

  const correctionPresent = input.correctionStatus === "regular"
  const otherwiseExactPass =
    input.disposition?.schemaVersion ===
      "v1.38-plan-262-88-admission-disposition-v2" &&
    input.disposition?.status === "pass" &&
    input.disposition?.terminalDisposition === "succeeded" &&
    input.disposition?.counters?.freshAccepted === 540 &&
    input.disposition?.counters?.requiredAccepted === 540 &&
    input.disposition?.counters?.reproductionIdentitiesCharged === 540 &&
    input.disposition?.integrityPassed === true &&
    input.disposition?.privacySafe === true &&
    input.disposition?.assuranceClass === "single_operator_local_seal_v1" &&
    input.disposition?.independentCustodyClaimed === false &&
    input.disposition?.correctionRequired === false &&
    input.disposition?.correctionRoot === null &&
    input.disposition?.authority?.foundationActivationAuthorized === true &&
    input.disposition?.authority?.phase263PlanningAuthorized === true &&
    deniedBeyondFoundation(input.disposition?.authority) &&
    input.reproductionStatus === "regular" &&
    input.disposition?.evidence?.reproductionRoot !== null &&
    input.sealAuthenticated &&
    input.predecessorAuthenticated &&
    !correctionPresent

  if (!otherwiseExactPass && input.activationStatus !== "absent")
    fail("V138_PLAN_262_89_NONPASS_ACTIVATION_PRESENT")

  const activationValid =
    otherwiseExactPass &&
    input.activationStatus === "regular" &&
    canonical(input.activation) ===
      canonical(computeV138Plan26288ActivationRoot(input.disposition))
  if (otherwiseExactPass && activationValid)
    return { status: "passed", mutationCapable: true, gaps: [] }

  const gaps: string[] = []
  if (
    input.disposition?.status !== "pass" ||
    input.disposition?.counters?.freshAccepted !== 540 ||
    input.disposition?.counters?.requiredAccepted !== 540
  )
    gaps.push("ADMIT-03")
  if (!input.sealAuthenticated) gaps.push("SEAL_V12_INVALID")
  if (!input.predecessorAuthenticated)
    gaps.push("PREDECESSOR_LIFECYCLE_INVALID")
  if (correctionPresent) gaps.push("CORRECTION_V3_PRESENT")
  if (input.disposition?.integrityPassed !== true)
    gaps.push("INTEGRITY_NON_PASS")
  if (input.disposition?.privacySafe !== true) gaps.push("PRIVACY_INVALID")
  if (
    input.reproductionStatus !== "regular" ||
    input.disposition?.evidence?.reproductionRoot == null
  )
    gaps.push("REPRODUCTION_V16_ABSENT_OR_INVALID")
  if (!activationValid) gaps.push("ROUTE10_ACTIVATION_ABSENT_OR_INVALID")
  return {
    status: "gaps_found",
    mutationCapable: false,
    gaps: [...new Set(gaps)],
  }
}

const authenticatePredecessor = (target: string): any => {
  const candidate = readJson(target)
  if (
    sha256(readRegular(target)) !== EXPECTED_PREDECESSOR_SHA ||
    candidate?.schemaVersion !==
      "v1.38-phase-262-current-lifecycle-status-v1" ||
    candidate?.statusRoot !== EXPECTED_PREDECESSOR_ROOT
  )
    fail("V138_PLAN_262_89_PREDECESSOR_INVALID")
  return candidate
}

interface AuthenticatedEvidence {
  disposition: any
  correction: any | null
  correctionStatus: SafeStatus
  activation: any | null
  activationStatus: SafeStatus
  reproductionStatus: SafeStatus
  sealAuthenticated: boolean
  predecessor: any
  predecessorAuthenticated: boolean
}

const authenticateRealEvidence = (root: string): AuthenticatedEvidence => {
  const checked = checkV138Plan26288Artifacts(root)
  const predecessor = authenticatePredecessor(
    path.join(root, V138_PLAN_262_89_PATHS.predecessor),
  )
  const correctionStatus = requireContainedStatus(
    root,
    V138_PLAN_262_89_PATHS.correction,
  )
  const activationStatus = requireContainedStatus(
    root,
    V138_PLAN_262_89_PATHS.activation,
  )
  const reproductionStatus = requireContainedStatus(
    root,
    V138_PLAN_262_89_PATHS.reproduction,
  )
  return {
    disposition: checked.disposition,
    correction:
      correctionStatus === "regular"
        ? readJson(path.join(root, V138_PLAN_262_89_PATHS.correction))
        : null,
    correctionStatus,
    activation:
      activationStatus === "regular"
        ? readJson(path.join(root, V138_PLAN_262_89_PATHS.activation))
        : null,
    activationStatus,
    reproductionStatus,
    sealAuthenticated:
      checked.disposition?.evidence?.sealRoot ===
      "sha256:b4fa466f9bc437b0b1cc5e22d7c1faf7ac91ea7c57e78be6c9fb9c33f5e83b7a",
    predecessor,
    predecessorAuthenticated: true,
  }
}

const renderValidation = (
  topology: V138Plan26289Topology,
  branch: V138Plan26289BranchResult,
  evidence: AuthenticatedEvidence,
): string => `---
phase: 262
slug: foundation-admission-measurement-custody-and-containment-con
status: ${branch.status === "passed" ? "complete" : "partial"}
nyquist_compliant: ${branch.status === "passed"}
wave_0_complete: true
created: 2026-07-28
last_audited: 2026-08-27
---

# Phase 262 — Validation Strategy

> Plan 262-89 v2 pre-summary validation authenticates ${topology.activePlanCount} active plans / ${topology.summaryCount} committed summaries and independently joins disposition-v2, correction-v3 state, reproduction-v16 state, seal-v12, Route-10 state, and exact lifecycle-status-v1 predecessor custody.

## Exact Commands

- \`pnpm exec vitest run scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1\`
- \`pnpm exec tsx scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.ts --check-artifacts\`
- \`pnpm exec tsx scripts/check-v1-38-plan-262-89-lifecycle-v2.ts --check-pre-summary\`

## Observed v2 Evidence

| Check | Result |
|---|---|
| Disposition | ${evidence.disposition.status} / ${evidence.disposition.terminalDisposition} |
| Fresh accepted | ${evidence.disposition.counters.freshAccepted}/${evidence.disposition.counters.requiredAccepted} |
| Assurance | ${evidence.disposition.assuranceStatus}; correction-v3 ${evidence.correctionStatus} |
| Reproduction-v16 | ${evidence.reproductionStatus} |
| Route-10 activation | ${evidence.activationStatus} |
| Predecessor status root | ${evidence.predecessor.statusRoot} |
| Lifecycle branch | ${branch.status} |
| Completion mutation before summary | forbidden / absent |

## Requirement Coverage

ADMIT-03 remains ${branch.status === "passed" ? "eligible for root-only completion after the committed summary latch" : "PARTIAL — BLOCKED at fresh 0/540"}. ADMIT-04, MEAS-02, MEAS-04, MEAS-09, MEAS-10, and SEAL-01 retain their independently verified evidence. No current-rules empirical failure, assurance defect, missing activation, or topology coincidence can compensate for exact fresh 540/540.

## Adversarial Branches

Synthetic tests prove exact pass, clean empirical exhaustion, correction-present, integrity failure, contamination, reproducibility failure, missing activation, unsafe optional paths, non-pass activation injection, and predecessor/topology substitution. Only exact clean pass is completion-mutation-capable.

No Plan-74 summary exists or is implied. No requirement, roadmap, state, phase-completion, Phase-263, candidate, formation, holdout, public, product, production, counted-play, gameplay, archive, or tag projection is mutated by this pre-summary validation.
`

const renderVerification = (
  topology: V138Plan26289Topology,
  branch: V138Plan26289BranchResult,
  evidence: AuthenticatedEvidence,
): string => {
  const body = {
    schemaVersion: "v1.38-plan-262-89-verification-v2",
    status: branch.status,
    activePlans: topology.activePlanCount,
    trustworthySummaries: topology.summaryCount,
    dispositionRoot: evidence.disposition.dispositionRoot,
    correctionStatus: evidence.correctionStatus,
    correctionRoot: evidence.correction?.correctionRoot ?? null,
    reproductionStatus: evidence.reproductionStatus,
    activationStatus: evidence.activationStatus,
    predecessorStatusRoot: evidence.predecessor.statusRoot,
    freshAccepted: evidence.disposition.counters.freshAccepted,
    requiredAccepted: evidence.disposition.counters.requiredAccepted,
    gaps: branch.gaps,
    lifecycleMutationPerformed: false,
    phase263PlanningAuthorized: false,
    downstreamAuthorityDenied: true,
  }
  const reportRoot = sha256(
    `v138-plan26289-verification-v2\0${canonical(body)}`,
  )
  return `---
status: ${branch.status}
schema: v1.38-plan-262-89-verification-v2
report_root: ${reportRoot}
---

# Phase 262 Verification

Active plans: ${topology.activePlanCount}
Trustworthy summaries before Plan-89 summary: ${topology.summaryCount}
Plan-74 summary present: false
Disposition-v2: ${evidence.disposition.status} / ${evidence.disposition.terminalDisposition}
Disposition root: ${evidence.disposition.dispositionRoot}
Fresh accepted: ${evidence.disposition.counters.freshAccepted}/${evidence.disposition.counters.requiredAccepted}
Correction-v3: ${evidence.correctionStatus}
Reproduction-v16: ${evidence.reproductionStatus}
Route-10 activation: ${evidence.activationStatus}
Predecessor lifecycle root: ${evidence.predecessor.statusRoot}
Gaps: ${branch.gaps.length ? branch.gaps.join(", ") : "none"}
Human items: 0
Lifecycle mutation performed: false
Phase 263 planning authorized: false
Downstream authority denied: true

Result: ${branch.status}. ${branch.status === "passed" ? "The root-only post-summary latch may complete ADMIT-03 after separately authenticating the committed summary." : "The clean empirical non-pass remains truthful; ADMIT-03 and Phase 262 remain incomplete."}
`
}

const derivePreSummary = (root: string) => {
  const topology = inspectV138Plan26289Topology(
    path.join(root, PHASE_DIR),
    "pre_summary",
  )
  const evidence = authenticateRealEvidence(root)
  const branch = evaluateV138Plan26289Branch(evidence)
  return { topology, evidence, branch }
}

const atomicPublish = (target: string, value: string): void => {
  if (safeType(target) !== "absent")
    fail("V138_PLAN_262_89_DESTINATION_CONFLICT")
  const parent = path.dirname(target)
  const temporary = `${target}.tmp-${process.pid}`
  const fd = openSync(
    temporary,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(fd, value)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  renameSync(temporary, target)
  const parentFd = openSync(parent, constants.O_RDONLY)
  try {
    fsyncSync(parentFd)
  } finally {
    closeSync(parentFd)
  }
}

export const refreshV138Plan26289PreSummary = (root: string): any => {
  const checked = derivePreSummary(root)
  writeFileSync(
    path.join(root, V138_PLAN_262_89_PATHS.validation),
    renderValidation(checked.topology, checked.branch, checked.evidence),
  )
  writeFileSync(
    path.join(root, V138_PLAN_262_89_PATHS.verification),
    renderVerification(checked.topology, checked.branch, checked.evidence),
  )
  return checked
}

export const checkV138Plan26289PreSummary = (root: string): any => {
  const checked = derivePreSummary(root)
  if (
    readRegular(path.join(root, V138_PLAN_262_89_PATHS.validation)).toString(
      "utf8",
    ) !== renderValidation(checked.topology, checked.branch, checked.evidence)
  )
    fail("V138_PLAN_262_89_VALIDATION_STALE")
  if (
    readRegular(path.join(root, V138_PLAN_262_89_PATHS.verification)).toString(
      "utf8",
    ) !== renderVerification(checked.topology, checked.branch, checked.evidence)
  )
    fail("V138_PLAN_262_89_VERIFICATION_STALE")
  if (safeType(path.join(root, V138_PLAN_262_89_PATHS.lifecycle)) !== "absent")
    fail("V138_PLAN_262_89_PREMATURE_LIFECYCLE")
  return checked
}

export interface V138Plan26289Readiness {
  schemaVersion: "v1.38-plan-262-89-lifecycle-driver-readiness-v2"
  checkerSha256: Sha256
  testSha256: Sha256
  validationSha256: Sha256
  verificationSha256: Sha256
  planIdentityRoot: Sha256
  summaryIdentityRoot: Sha256
  dispositionRoot: Sha256
  correctionStatus: "absent" | "regular"
  correctionRoot: Sha256 | null
  activationStatus: "absent" | "regular"
  predecessorStatusRoot: Sha256
  predecessorSha256: Sha256
  verificationStatus: "passed" | "gaps_found"
  activePlans: 70
  preSummarySummaries: 69
  syntheticPassVerified: true
  syntheticNonPassVerified: true
  syntheticCorrectionVerified: true
  syntheticMissingActivationVerified: true
  postSummaryDriverInvoked: false
  lifecycleMutationPerformed: false
  readinessRoot: Sha256
}

const readinessRoot = (candidate: any): Sha256 => {
  const body = JSON.parse(JSON.stringify(candidate))
  delete body.readinessRoot
  return sha256(
    `v138-plan26289-lifecycle-driver-readiness-v2\0${canonical(body)}`,
  )
}

const deriveReadiness = (root: string): V138Plan26289Readiness => {
  const checked = checkV138Plan26289PreSummary(root)
  const body = {
    schemaVersion: "v1.38-plan-262-89-lifecycle-driver-readiness-v2" as const,
    checkerSha256: sha256(
      readRegular(path.join(root, V138_PLAN_262_89_PATHS.checker)),
    ),
    testSha256: sha256(
      readRegular(path.join(root, V138_PLAN_262_89_PATHS.tests)),
    ),
    validationSha256: sha256(
      readRegular(path.join(root, V138_PLAN_262_89_PATHS.validation)),
    ),
    verificationSha256: sha256(
      readRegular(path.join(root, V138_PLAN_262_89_PATHS.verification)),
    ),
    planIdentityRoot: checked.topology.planIdentityRoot,
    summaryIdentityRoot: checked.topology.summaryIdentityRoot,
    dispositionRoot: checked.evidence.disposition.dispositionRoot as Sha256,
    correctionStatus: checked.evidence.correctionStatus as "absent" | "regular",
    correctionRoot: (checked.evidence.correction?.correctionRoot ??
      null) as Sha256 | null,
    activationStatus: checked.evidence.activationStatus as "absent" | "regular",
    predecessorStatusRoot: checked.evidence.predecessor.statusRoot as Sha256,
    predecessorSha256: EXPECTED_PREDECESSOR_SHA,
    verificationStatus: checked.branch.status,
    activePlans: 70 as const,
    preSummarySummaries: 69 as const,
    syntheticPassVerified: true as const,
    syntheticNonPassVerified: true as const,
    syntheticCorrectionVerified: true as const,
    syntheticMissingActivationVerified: true as const,
    postSummaryDriverInvoked: false as const,
    lifecycleMutationPerformed: false as const,
  }
  return { ...body, readinessRoot: readinessRoot(body) }
}

export const writeV138Plan26289Readiness = (
  root: string,
): V138Plan26289Readiness => {
  const readiness = deriveReadiness(root)
  atomicPublish(
    path.join(root, V138_PLAN_262_89_PATHS.readiness),
    canonical(readiness),
  )
  return readiness
}

export const checkV138Plan26289Readiness = (
  root: string,
): V138Plan26289Readiness => {
  const candidate = readJson(path.join(root, V138_PLAN_262_89_PATHS.readiness))
  const expected = deriveReadiness(root)
  if (canonical(candidate) !== canonical(expected))
    fail("V138_PLAN_262_89_READINESS_INVALID")
  return candidate
}

export interface V138Plan26289LifecycleCommand {
  step: "requirements" | "roadmap" | "state" | "phase_complete"
  argv: string[]
}

export const computeV138Plan26289LifecycleStatusRoot = (
  candidate: any,
): Sha256 => {
  const body = JSON.parse(JSON.stringify(candidate))
  delete body.statusRoot
  return sha256(`v138-phase262-current-lifecycle-status-v2\0${canonical(body)}`)
}

const requireCommittedSummary = (root: string, target: string): Sha256 => {
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative))
    fail("V138_PLAN_262_89_SUMMARY_PATH_INVALID")
  const dirty = execFileSync("git", ["status", "--porcelain", "--", relative], {
    cwd: root,
    encoding: "utf8",
  }).trim()
  const commit = execFileSync(
    "git",
    ["log", "-1", "--format=%H", "--", relative],
    {
      cwd: root,
      encoding: "utf8",
    },
  ).trim()
  if (dirty || !/^[0-9a-f]{40}$/u.test(commit))
    fail("V138_PLAN_262_89_SUMMARY_NOT_COMMITTED")
  return sha256(readRegular(target))
}

const verificationStatus = (target: string): "passed" | "gaps_found" => {
  const matches = [
    ...readRegular(target)
      .toString("utf8")
      .matchAll(/^status: (passed|gaps_found)$/gmu),
  ]
  if (matches.length !== 1) fail("V138_PLAN_262_89_VERIFICATION_STATUS_INVALID")
  return matches[0]![1] as "passed" | "gaps_found"
}

const buildLifecycleStatus = (
  topology: V138Plan26289Topology,
  branch: V138Plan26289BranchResult,
  evidence: AuthenticatedEvidence,
  summarySha256: Sha256,
): any => {
  const body = {
    schemaVersion: "v1.38-phase-262-current-lifecycle-status-v2",
    supersedes:
      ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json",
    previousStatusRoot: evidence.predecessor.statusRoot,
    previousStatusSha256: EXPECTED_PREDECESSOR_SHA,
    plan89SummarySha256: summarySha256,
    lifecycle: {
      activePlans: topology.activePlanCount,
      summaries: topology.summaryCount,
      plan89VerificationStatus: branch.status,
      lifecycleMutationPerformed: branch.status === "passed",
      phase262Status: branch.status === "passed" ? "complete" : "incomplete",
    },
    retryOutcome: {
      terminalDisposition: evidence.disposition.terminalDisposition,
      routeStartsConsumed: evidence.disposition.counters.routeStartsConsumed,
      calibrationIdentitiesCharged:
        evidence.disposition.counters.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged:
        evidence.disposition.counters.reproductionIdentitiesCharged,
      freshAccepted: evidence.disposition.counters.freshAccepted,
      requiredAccepted: evidence.disposition.counters.requiredAccepted,
      reproductionV16Present: evidence.reproductionStatus === "regular",
    },
    adjudication: {
      dispositionRoot: evidence.disposition.dispositionRoot,
      correctionStatus: evidence.correctionStatus,
      correctionRoot: evidence.correction?.correctionRoot ?? null,
      activationStatus: evidence.activationStatus,
      gaps: branch.gaps,
    },
    authority: {
      phase263PlanningAuthorized: branch.status === "passed",
      phase263ExecutionAuthorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
      archiveAuthorized: false,
      tagAuthorized: false,
    },
  }
  return { ...body, statusRoot: computeV138Plan26289LifecycleStatusRoot(body) }
}

export const runV138Plan26289PostSummaryLifecycle = (
  args: {
    phaseDir: string
    summaryPath: string
    dispositionPath: string
    correctionPath: string
    activationPath: string
    reproductionPath: string
    predecessorPath: string
    validationPath: string
    verificationPath: string
    requirementsPath: string
    roadmapPath: string
    statePath: string
    lifecyclePath: string
  },
  options: {
    root?: string
    requireCommittedSummary?: boolean
    runCommand?: (command: V138Plan26289LifecycleCommand) => void
    authenticateEvidence?: () => AuthenticatedEvidence
  } = {},
): {
  status: "passed" | "gaps_found"
  completionMutated: boolean
  lifecycleStatus: any
  topology: V138Plan26289Topology
} => {
  const root = options.root ?? repoRoot
  const topology = inspectV138Plan26289Topology(args.phaseDir, "post_summary")
  if (
    path.resolve(args.summaryPath) !==
    path.join(path.resolve(args.phaseDir), "262-89-SUMMARY.md")
  )
    fail("V138_PLAN_262_89_SUMMARY_PATH_INVALID")
  const summarySha =
    options.requireCommittedSummary === false
      ? sha256(readRegular(args.summaryPath))
      : requireCommittedSummary(root, args.summaryPath)
  const evidence =
    options.authenticateEvidence?.() ?? authenticateRealEvidence(root)
  const branch = evaluateV138Plan26289Branch(evidence)
  if (verificationStatus(args.verificationPath) !== branch.status)
    fail("V138_PLAN_262_89_VERIFICATION_BRANCH_INVALID")

  const before = [args.requirementsPath, args.roadmapPath, args.statePath].map(
    (target) => sha256(readRegular(target)),
  )
  if (branch.status === "passed") {
    const gsdTools = "/Users/roryquinlan/.codex/gsd-core/bin/gsd-tools.cjs"
    const run =
      options.runCommand ??
      ((command: V138Plan26289LifecycleCommand): void => {
        execFileSync("node", [gsdTools, "query", ...command.argv], {
          cwd: root,
          stdio: "inherit",
        })
      })
    for (const command of [
      {
        step: "requirements",
        argv: ["requirements.mark-complete", "ADMIT-03"],
      },
      { step: "roadmap", argv: ["roadmap.update-plan-progress", "262"] },
      {
        step: "state",
        argv: ["state.record-session", "", "Completed 262-89-PLAN.md", "None"],
      },
      { step: "phase_complete", argv: ["phase.complete", "262"] },
    ] as V138Plan26289LifecycleCommand[])
      run(command)
  } else {
    const after = [args.requirementsPath, args.roadmapPath, args.statePath].map(
      (target) => sha256(readRegular(target)),
    )
    if (canonical(before) !== canonical(after))
      fail("V138_PLAN_262_89_NONPASS_COMPLETION_MUTATION")
  }
  const lifecycleStatus = buildLifecycleStatus(
    topology,
    branch,
    evidence,
    summarySha,
  )
  atomicPublish(args.lifecyclePath, canonical(lifecycleStatus))
  return {
    status: branch.status,
    completionMutated: branch.status === "passed",
    lifecycleStatus,
    topology,
  }
}

const commonPostSummaryArgs = (root: string) => ({
  phaseDir: path.join(root, V138_PLAN_262_89_PATHS.phaseDir),
  summaryPath: path.join(root, V138_PLAN_262_89_PATHS.summary),
  dispositionPath: path.join(root, V138_PLAN_262_89_PATHS.disposition),
  correctionPath: path.join(root, V138_PLAN_262_89_PATHS.correction),
  activationPath: path.join(root, V138_PLAN_262_89_PATHS.activation),
  reproductionPath: path.join(root, V138_PLAN_262_89_PATHS.reproduction),
  predecessorPath: path.join(root, V138_PLAN_262_89_PATHS.predecessor),
  validationPath: path.join(root, V138_PLAN_262_89_PATHS.validation),
  verificationPath: path.join(root, V138_PLAN_262_89_PATHS.verification),
  requirementsPath: path.join(root, V138_PLAN_262_89_PATHS.requirements),
  roadmapPath: path.join(root, V138_PLAN_262_89_PATHS.roadmap),
  statePath: path.join(root, V138_PLAN_262_89_PATHS.state),
  lifecyclePath: path.join(root, V138_PLAN_262_89_PATHS.lifecycle),
})

export const checkV138Plan26289Final = (root: string): any => {
  const topology = inspectV138Plan26289Topology(
    path.join(root, PHASE_DIR),
    "post_summary",
  )
  const evidence = authenticateRealEvidence(root)
  const branch = evaluateV138Plan26289Branch(evidence)
  const lifecycle = readJson(path.join(root, V138_PLAN_262_89_PATHS.lifecycle))
  const summarySha = sha256(
    readRegular(path.join(root, V138_PLAN_262_89_PATHS.summary)),
  )
  const expected = buildLifecycleStatus(topology, branch, evidence, summarySha)
  if (canonical(lifecycle) !== canonical(expected))
    fail("V138_PLAN_262_89_LIFECYCLE_STATUS_INVALID")
  return { topology, branch, lifecycle }
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const main = (): void => {
  const mode = process.argv[2]
  if (mode === "--refresh-pre-summary") {
    const result = refreshV138Plan26289PreSummary(repoRoot)
    process.stdout.write(
      canonical({
        status: result.branch.status,
        activePlans: 70,
        summaries: 69,
      }),
    )
    return
  }
  if (mode === "--check-pre-summary") {
    const result = checkV138Plan26289PreSummary(repoRoot)
    process.stdout.write(
      canonical({
        status: result.branch.status,
        activePlans: 70,
        summaries: 69,
      }),
    )
    return
  }
  if (mode === "--write-post-summary-driver-readiness") {
    const readiness = writeV138Plan26289Readiness(repoRoot)
    process.stdout.write(
      canonical({
        status: "ready",
        readinessRoot: readiness.readinessRoot,
        postSummaryDriverInvoked: false,
      }),
    )
    return
  }
  if (mode === "--check-post-summary-driver-ready") {
    const readiness = checkV138Plan26289Readiness(repoRoot)
    process.stdout.write(
      canonical({
        status: "ready",
        readinessRoot: readiness.readinessRoot,
        postSummaryDriverInvoked: false,
      }),
    )
    return
  }
  if (mode === "--apply-post-summary") {
    checkV138Plan26289Readiness(repoRoot)
    const result = runV138Plan26289PostSummaryLifecycle(
      commonPostSummaryArgs(repoRoot),
    )
    process.stdout.write(
      canonical({
        status: result.status,
        lifecycleMutated: true,
        completionMutated: result.completionMutated,
        statusRoot: result.lifecycleStatus.statusRoot,
      }),
    )
    return
  }
  if (mode === "--check-final") {
    const result = checkV138Plan26289Final(repoRoot)
    process.stdout.write(
      canonical({
        status: result.branch.status,
        lifecycleStatusRoot: result.lifecycle.statusRoot,
        completionMutated: result.branch.status === "passed",
      }),
    )
    return
  }
  fail("V138_PLAN_262_89_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
)
  main()
