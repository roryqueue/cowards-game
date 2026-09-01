#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const DOMAIN_REVIEW = "v1.38:plan-262:125:lifecycle-source-review:v1"
const DOMAIN_READINESS = "v1.38:plan-262:126:lifecycle-readiness:v4"
const DOMAIN_LIFECYCLE = "v1.38:phase-262:provisional-lifecycle:v4"
const LOCAL_SEAL_LIMITATION =
  "single_operator_local_seal_v1_no_hostile_same_uid"

export const PLAN_125_REVIEW_SCHEMA =
  "v1.38-plan-262-125-lifecycle-source-review-v1" as const

export const REQUIREMENT_IDS = Object.freeze([
  "ADMIT-01",
  "ADMIT-02",
  "ADMIT-03",
  "ADMIT-04",
  "MEAS-01",
  "MEAS-02",
  "MEAS-03",
  "MEAS-04",
  "MEAS-05",
  "MEAS-06",
  "MEAS-07",
  "MEAS-08",
  "MEAS-09",
  "MEAS-10",
  "SEAL-01",
  "DECI-02",
] as const)

export const AUTHORITY_KEYS = Object.freeze([
  "archiveAuthorized",
  "candidateSearchAuthorized",
  "countedPlayAuthorized",
  "formationMaterializationAuthorized",
  "foundationActivationAuthorized",
  "gameplayChangeAuthorized",
  "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized",
  "phase263PlanningAuthorized",
  "productAuthorized",
  "productionAuthorized",
  "publicAuthorized",
  "tagAuthorized",
] as const)

const FALSE_AUTHORITY = Object.freeze(
  Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false])) as Record<
    (typeof AUTHORITY_KEYS)[number],
    false
  >,
)

export const V138_PLAN_262_95_PATHS = Object.freeze({
  source: "scripts/check-v1-38-plan-262-95-lifecycle-v4.ts",
  tests: "scripts/check-v1-38-plan-262-95-lifecycle-v4.test.ts",
  summary: `${PHASE_DIR}/262-95-SUMMARY.md`,
  disposition:
    ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-retry-reproduction-v18.json",
  route12: ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
  review125:
    ".planning/artifacts/v1.38-plan-262-125-lifecycle-source-review-v1.json",
  readiness:
    ".planning/artifacts/v1.38-plan-262-126-lifecycle-readiness-v4.json",
  legacyReadiness:
    ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  metadataCorrection:
    ".planning/artifacts/v1.38-plan-262-121-summary-metadata-correction-v1.json",
  lifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v4.json",
  validation: `${PHASE_DIR}/262-VALIDATION.md`,
  verification: `${PHASE_DIR}/262-VERIFICATION.md`,
  summary126: `${PHASE_DIR}/262-126-SUMMARY.md`,
  summary106: `${PHASE_DIR}/262-106-SUMMARY.md`,
  summary121: `${PHASE_DIR}/262-121-SUMMARY.md`,
  requirements: ".planning/REQUIREMENTS.md",
  roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md",
})

export const PLAN_126_WRITE_PATHS = Object.freeze([
  V138_PLAN_262_95_PATHS.readiness,
])

export const PLAN_106_WRITE_PATHS = Object.freeze([
  V138_PLAN_262_95_PATHS.lifecycle,
  V138_PLAN_262_95_PATHS.requirements,
  V138_PLAN_262_95_PATHS.roadmap,
  V138_PLAN_262_95_PATHS.state,
  V138_PLAN_262_95_PATHS.summary106,
])

const fail = (code: string): never => {
  throw new TypeError(`V138_PLAN_262_95_${code}`)
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
const rooted = (domain: string, body: unknown): Sha256 =>
  sha256(`${domain}\0${canonical(body)}`)

const git = (root: string, args: string[]): string =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()

const safeKind = (target: string): "absent" | "regular" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    return stat.isFile() && !stat.isSymbolicLink() ? "regular" : "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "absent"
    throw error
  }
}

const readRegular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative))
    fail("PATH_ESCAPE")
  if (safeKind(target) !== "regular") fail("INPUT_NOT_REGULAR")
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}

const readJson = (root: string, repoPath: string): any =>
  JSON.parse(readRegular(root, repoPath).toString("utf8"))

const committedBytes = (root: string, repoPath: string): Buffer => {
  try {
    return execFileSync("git", ["show", `HEAD:${repoPath}`], {
      cwd: root,
      encoding: "buffer",
    })
  } catch {
    return fail("COMMITTED_INPUT_MISSING")
  }
}

const assertWorkingEqualsCommitted = (root: string, repoPath: string): void => {
  const working = readRegular(root, repoPath)
  if (!working.equals(committedBytes(root, repoPath)))
    fail("COMMITTED_INPUT_DRIFT")
}

const exclusiveWrite = (
  root: string,
  repoPath: string,
  bytes: string,
): void => {
  const target = path.resolve(root, repoPath)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative))
    fail("PATH_ESCAPE")
  if (safeKind(target) !== "absent") fail("DESTINATION_ALREADY_EXISTS")
  const fd = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o644,
  )
  try {
    writeFileSync(fd, bytes)
  } finally {
    closeSync(fd)
  }
}

const atomicReplaceRegular = (
  root: string,
  repoPath: string,
  bytes: string,
): void => {
  const target = path.resolve(root, repoPath)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative))
    fail("PATH_ESCAPE")
  if (safeKind(target) !== "regular") fail("REPLACE_TARGET_NOT_REGULAR")
  const temporary = path.join(
    path.dirname(target),
    `.${path.basename(target)}.replace-${process.pid}`,
  )
  if (safeKind(temporary) !== "absent") fail("REPLACE_TEMP_PRESENT")
  let created = false
  try {
    const fd = openSync(
      temporary,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0),
      0o644,
    )
    created = true
    try {
      writeFileSync(fd, bytes)
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
    if (safeKind(target) !== "regular") fail("REPLACE_TARGET_CHANGED")
    renameSync(temporary, target)
    created = false
  } finally {
    if (created && safeKind(temporary) === "regular") unlinkSync(temporary)
  }
}

export interface V138Phase262Inventory {
  requirementIds: readonly string[]
  activePlans: string[]
  historicalPlans: string[]
  dormantCarriers: string[]
  summaries: string[]
  reviews: string[]
  validations: string[]
  verifications: string[]
  allPaths: string[]
  counts: Record<string, number>
  roots: Record<string, Sha256>
}

type InventoryGroups = Pick<
  V138Phase262Inventory,
  | "activePlans"
  | "historicalPlans"
  | "dormantCarriers"
  | "summaries"
  | "reviews"
  | "validations"
  | "verifications"
>

const buildInventory = (groups: InventoryGroups): V138Phase262Inventory => {
  const allPaths = [...new Set(Object.values(groups).flat())].sort(
    (left, right) => left.localeCompare(right),
  )
  return Object.freeze({
    requirementIds: REQUIREMENT_IDS,
    ...groups,
    allPaths,
    counts: Object.freeze({
      ...Object.fromEntries(
        Object.entries(groups).map(([name, paths]) => [name, paths.length]),
      ),
      total: allPaths.length,
    }),
    roots: Object.freeze({
      ...Object.fromEntries(
        Object.entries(groups).map(([name, paths]) => [
          name,
          sha256(canonical(paths)),
        ]),
      ),
      all: sha256(canonical(allPaths)),
    }),
  })
}

export const inspectCommittedPhase262Inventory = (
  root: string,
): V138Phase262Inventory => {
  const prefix = `${PHASE_DIR}/`
  const committed = git(root, [
    "ls-tree",
    "-r",
    "--name-only",
    "HEAD",
    PHASE_DIR,
  ])
    .split("\n")
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
  const classify = (test: (relative: string) => boolean): string[] =>
    committed.filter((repoPath) => test(repoPath.slice(prefix.length)))
  const activePlans = classify((relative) =>
    /^262-\d+-PLAN\.md$/u.test(relative),
  )
  const historicalPlans = classify((relative) =>
    /^archived\/262-\d+-HISTORICAL\.md$/u.test(relative),
  )
  const dormantCarriers = classify((relative) =>
    relative.startsWith("dormant/"),
  )
  const summaries = classify((relative) =>
    /^262-\d+-SUMMARY\.md$/u.test(relative),
  )
  const reviews = classify((relative) =>
    /(?:^|-)REVIEW(?:-|\.|$)/u.test(relative),
  )
  const validations = classify((relative) =>
    /(?:^|-)VALIDATION\.md$/u.test(relative),
  )
  const verifications = classify((relative) =>
    /(?:^|-)VERIFICATION\.md$/u.test(relative),
  )
  const groups = {
    activePlans,
    historicalPlans,
    dormantCarriers,
    summaries,
    reviews,
    validations,
    verifications,
  }
  for (const [name, paths] of Object.entries(groups)) {
    if (paths.length === 0) fail(`INVENTORY_${name.toUpperCase()}_EMPTY`)
  }
  return buildInventory(groups)
}

export interface DispositionPresence {
  reproductionPresent: boolean
  route12Present: boolean
}

export interface InspectedBranch {
  branch: "pass" | "gaps"
  status: string
  producerDisposition: string
  assuranceStatus: string
  freshAccepted: number
  requiredAccepted: number
  reproductionPresent: boolean
  route12Present: boolean
  gaps: string[]
}

const authorityMatches = (value: any, passInput: boolean): boolean =>
  AUTHORITY_KEYS.every((key) => {
    if (
      passInput &&
      (key === "foundationActivationAuthorized" ||
        key === "phase263PlanningAuthorized")
    )
      return value?.[key] === true || value?.[key] === false
    return value?.[key] === false
  })

export const inspectDispositionBranch = (
  value: any,
  presence: DispositionPresence,
): InspectedBranch => {
  if (value?.schemaVersion !== "v1.38-plan-262-94-admission-disposition-v4")
    fail("DISPOSITION_SCHEMA_INVALID")
  if (value?.assuranceLimitation !== LOCAL_SEAL_LIMITATION)
    fail("LOCAL_SEAL_LIMITATION_INVALID")
  if (
    typeof presence.reproductionPresent !== "boolean" ||
    typeof presence.route12Present !== "boolean"
  )
    fail("PRESENCE_INVALID")
  const producerSucceeded = value?.producerSucceeded === true
  const exactCounts =
    value?.counts?.freshAccepted === 540 &&
    value?.counts?.requiredAccepted === 540 &&
    value?.counts?.reproductionIdentitiesCharged === 540
  const assuranceClean =
    value?.assuranceStatus === "clean" &&
    Array.isArray(value?.assuranceFindings) &&
    value.assuranceFindings.length === 0 &&
    value?.contamination === false
  const passInput =
    value?.status === "pass" &&
    value?.producerDisposition === "succeeded" &&
    producerSucceeded &&
    exactCounts &&
    assuranceClean
  if (!authorityMatches(value?.authority, passInput)) fail("AUTHORITY_INVALID")
  if (value?.status !== "pass" && presence.route12Present)
    fail("NONPASS_ROUTE12_PRESENT")
  if (producerSucceeded !== presence.reproductionPresent)
    fail("PRODUCER_REPRODUCTION_PRESENCE_INVALID")
  if (value?.reproductionPreserved !== presence.reproductionPresent)
    fail("REPRODUCTION_PRESERVATION_INVALID")
  if (passInput && (!presence.reproductionPresent || !presence.route12Present))
    fail("PASS_EVIDENCE_INCOMPLETE")
  if (!passInput && presence.route12Present) fail("GAPS_ROUTE12_PRESENT")

  const gaps = [
    ...(producerSucceeded ? [] : ["producer_not_successful"]),
    ...(exactCounts ? [] : ["fresh_540_of_540_absent"]),
    ...(assuranceClean ? [] : ["assurance_not_clean"]),
    ...(presence.reproductionPresent ? [] : ["reproduction_v18_absent"]),
    ...(presence.route12Present ? [] : ["route_12_absent"]),
  ]
  return Object.freeze({
    branch: passInput ? "pass" : "gaps",
    status: String(value.status),
    producerDisposition: String(value.producerDisposition),
    assuranceStatus: String(value.assuranceStatus),
    freshAccepted: Number(value.counts?.freshAccepted),
    requiredAccepted: Number(value.counts?.requiredAccepted),
    reproductionPresent: presence.reproductionPresent,
    route12Present: presence.route12Present,
    gaps,
  })
}

export const projectLifecycleBranch = (inspected: InspectedBranch) =>
  Object.freeze({
    branch: inspected.branch,
    admit03:
      inspected.branch === "pass"
        ? "provisionally_complete_pending_convergence"
        : "blocked",
    phase262:
      inspected.branch === "pass"
        ? "provisionally_complete_pending_convergence"
        : "incomplete",
    phase263PlanningEligible: false,
    phase263ExecutionEligible: false,
    permittedMutationClass:
      inspected.branch === "pass"
        ? "provisional_foundation_status_only"
        : "branch_neutral_bookkeeping_only",
    authority: FALSE_AUTHORITY,
    gaps: inspected.gaps,
  })

interface Plan125SourceFile {
  path: string
  mode: string
  blob: string
  sha256: Sha256
}

export interface Plan125ReviewBody {
  schemaVersion: typeof PLAN_125_REVIEW_SCHEMA
  sourceCommit: string
  sourceTree: string
  sourceFiles: Plan125SourceFile[]
  findingCount: number
  plan126Eligible: boolean
  authorizesExecution: false
}

export type Plan125Review = Plan125ReviewBody & { reviewRoot: Sha256 }

export const buildPlan125ReviewRoot = (body: Plan125ReviewBody): Sha256 =>
  rooted(DOMAIN_REVIEW, body)

const exactKeys = (value: any, expected: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  canonical(Object.keys(value).sort()) === canonical([...expected].sort())

export const assertPlan125Review = (
  root: string,
  value: any,
): Plan125Review => {
  const reviewKeys = [
    "schemaVersion",
    "sourceCommit",
    "sourceTree",
    "sourceFiles",
    "findingCount",
    "plan126Eligible",
    "authorizesExecution",
    "reviewRoot",
  ]
  if (!exactKeys(value, reviewKeys)) fail("REVIEW_KEYS_INVALID")
  if (
    value.schemaVersion !== PLAN_125_REVIEW_SCHEMA ||
    value.findingCount !== 0 ||
    value.plan126Eligible !== true ||
    value.authorizesExecution !== false ||
    !/^[a-f0-9]{40}$/u.test(value.sourceCommit) ||
    !/^[a-f0-9]{40}$/u.test(value.sourceTree)
  )
    fail("REVIEW_VERDICT_INVALID")
  try {
    git(root, ["cat-file", "-e", `${value.sourceCommit}^{commit}`])
  } catch {
    fail("REVIEW_SOURCE_COMMIT_INVALID")
  }
  if (
    git(root, ["rev-parse", `${value.sourceCommit}^{tree}`]) !==
    value.sourceTree
  )
    fail("REVIEW_SOURCE_TREE_INVALID")
  const expectedPaths = [
    V138_PLAN_262_95_PATHS.source,
    V138_PLAN_262_95_PATHS.tests,
    V138_PLAN_262_95_PATHS.summary,
  ]
  if (
    !Array.isArray(value.sourceFiles) ||
    value.sourceFiles.length !== 3 ||
    expectedPaths.some((item) => typeof item !== "string") ||
    canonical(value.sourceFiles.map((entry: any) => entry.path).sort()) !==
      canonical([...expectedPaths].sort())
  )
    fail("REVIEW_SOURCE_PATHS_INVALID")
  for (const entry of value.sourceFiles as Plan125SourceFile[]) {
    if (!exactKeys(entry, ["path", "mode", "blob", "sha256"]))
      fail("REVIEW_SOURCE_ENTRY_KEYS_INVALID")
    const treeLine = git(root, [
      "ls-tree",
      value.sourceCommit,
      "--",
      entry.path,
    ])
    const match = /^(\d+) blob ([a-f0-9]{40})\t/u.exec(treeLine)
    if (!match || match[1] !== entry.mode || match[2] !== entry.blob)
      fail("REVIEW_SOURCE_ENTRY_GIT_INVALID")
    const bytes = execFileSync(
      "git",
      ["show", `${value.sourceCommit}:${entry.path}`],
      {
        cwd: root,
        encoding: "buffer",
      },
    )
    if (sha256(bytes) !== entry.sha256) fail("REVIEW_SOURCE_ENTRY_SHA_INVALID")
  }
  const { reviewRoot, ...body } = value
  if (buildPlan125ReviewRoot(body as Plan125ReviewBody) !== reviewRoot)
    fail("REVIEW_ROOT_INVALID")
  return value as Plan125Review
}

const assertReviewMatchesCurrentSource = (
  root: string,
  review: Plan125Review,
): void => {
  for (const entry of review.sourceFiles) {
    const currentBlob = (() => {
      try {
        return git(root, ["rev-parse", `HEAD:${entry.path}`])
      } catch {
        return fail("REVIEW_CURRENT_SOURCE_MISSING")
      }
    })()
    if (currentBlob !== entry.blob) fail("REVIEW_CURRENT_SOURCE_STALE")
  }
}

const buildReviewedReadiness = (
  review: Plan125Review,
  inventory: V138Phase262Inventory,
) => {
  const body = {
    schemaVersion: "v1.38-plan-262-126-lifecycle-readiness-v4",
    reviewRoot: review.reviewRoot,
    sourceCommit: review.sourceCommit,
    sourceTree: review.sourceTree,
    sourceFiles: review.sourceFiles,
    requirementIds: REQUIREMENT_IDS,
    inventoryCounts: inventory.counts,
    inventoryRoots: inventory.roots,
    assuranceLimitation: LOCAL_SEAL_LIMITATION,
    reviewedSourceEligible: true,
    lifecycleMutationAuthorized: false,
    authorizesExecution: false,
    authority: FALSE_AUTHORITY,
    nextAction: "plan-262-106-only-after-plan-126-proof-is-committed",
  }
  return Object.freeze({
    ...body,
    readinessRoot: rooted(DOMAIN_READINESS, body),
  })
}

export const validateReviewedReadinessGate = (
  root: string,
  reviewInput: unknown,
) =>
  buildReviewedReadiness(
    assertPlan125Review(root, reviewInput),
    inspectCommittedPhase262Inventory(root),
  )

export const assertReviewedReadiness = (root: string, value: any): any => {
  const review = readJson(root, V138_PLAN_262_95_PATHS.review125)
  const authenticatedReview = assertPlan125Review(root, review)
  return assertReadinessForReview(root, value, authenticatedReview)
}

const assertReadinessForReview = (
  root: string,
  value: any,
  authenticatedReview: Plan125Review,
): any => {
  const current = inspectCommittedPhase262Inventory(root)
  const expectedCurrent = buildReviewedReadiness(authenticatedReview, current)
  if (canonical(value) === canonical(expectedCurrent)) return value

  if (!current.summaries.includes(V138_PLAN_262_95_PATHS.summary126))
    fail("READINESS_INVALID")
  const baseline = buildInventory({
    activePlans: current.activePlans,
    historicalPlans: current.historicalPlans,
    dormantCarriers: current.dormantCarriers,
    summaries: current.summaries.filter(
      (repoPath) => repoPath !== V138_PLAN_262_95_PATHS.summary126,
    ),
    reviews: current.reviews,
    validations: current.validations,
    verifications: current.verifications,
  })
  const expectedBaseline = buildReviewedReadiness(authenticatedReview, baseline)
  if (canonical(value) !== canonical(expectedBaseline)) fail("READINESS_INVALID")
  return value
}

export const validateProvisionalCloseoutGate = <
  T extends Record<string, boolean>,
>(
  value: T,
): T => {
  const expected = [
    "readinessCommitted",
    "readinessValid",
    "metadataCorrectionCommitted",
    "metadataCorrectionValid",
    "validationCommitted",
    "validationComplete",
    "verificationCommitted",
    "verificationComplete",
    "summary126Committed",
    "review125Committed",
    "review125Valid",
  ]
  if (
    !exactKeys(value, expected) ||
    expected.some((key) => value[key] !== true)
  )
    fail("PROVISIONAL_GATE_INVALID")
  return value
}

const assertCommittedProof = (root: string, repoPath: string): string => {
  assertWorkingEqualsCommitted(root, repoPath)
  return readRegular(root, repoPath).toString("utf8")
}

const inspectProvisionalGate = (root: string) => {
  assertWorkingEqualsCommitted(root, V138_PLAN_262_95_PATHS.review125)
  const review = assertPlan125Review(
    root,
    readJson(root, V138_PLAN_262_95_PATHS.review125),
  )
  assertWorkingEqualsCommitted(root, V138_PLAN_262_95_PATHS.readiness)
  assertReviewedReadiness(
    root,
    readJson(root, V138_PLAN_262_95_PATHS.readiness),
  )
  const correction = JSON.parse(
    assertCommittedProof(root, V138_PLAN_262_95_PATHS.metadataCorrection),
  )
  if (
    correction?.schemaVersion !==
      "v1.38-plan-262-121-summary-metadata-correction-v1" ||
    correction?.admit03CompletionCreditGranted !== false ||
    correction?.admit03Status !== "blocked" ||
    correction?.authorizesExecution !== false ||
    correction?.summaryPath !== V138_PLAN_262_95_PATHS.summary121 ||
    correction?.summarySha256 !==
      sha256(committedBytes(root, V138_PLAN_262_95_PATHS.summary121))
  )
    fail("METADATA_CORRECTION_INVALID")
  const inventory = inspectCommittedPhase262Inventory(root)
  const validation = assertCommittedProof(
    root,
    V138_PLAN_262_95_PATHS.validation,
  )
  const verification = assertCommittedProof(
    root,
    V138_PLAN_262_95_PATHS.verification,
  )
  for (const required of [...REQUIREMENT_IDS, ...inventory.allPaths]) {
    if (!validation.includes(required) || !verification.includes(required))
      fail("PROOF_COVERAGE_INCOMPLETE")
  }
  assertCommittedProof(root, V138_PLAN_262_95_PATHS.summary126)
  return validateProvisionalCloseoutGate({
    readinessCommitted: true,
    readinessValid: true,
    metadataCorrectionCommitted: true,
    metadataCorrectionValid: true,
    validationCommitted: true,
    validationComplete: true,
    verificationCommitted: true,
    verificationComplete: true,
    summary126Committed: true,
    review125Committed: true,
    review125Valid: review.findingCount === 0,
  })
}

const currentPresence = (root: string): DispositionPresence => ({
  reproductionPresent:
    safeKind(path.join(root, V138_PLAN_262_95_PATHS.reproduction)) ===
    "regular",
  route12Present:
    safeKind(path.join(root, V138_PLAN_262_95_PATHS.route12)) === "regular",
})

export const inspectCurrentLifecycleSource = (root: string) => {
  const inventory = inspectCommittedPhase262Inventory(root)
  const inspected = inspectDispositionBranch(
    readJson(root, V138_PLAN_262_95_PATHS.disposition),
    currentPresence(root),
  )
  return Object.freeze({
    schemaVersion: "v1.38-plan-262-95-lifecycle-source-check-v1",
    sourceMode: true,
    mutationCapable: false,
    inventory,
    inspected,
    projection: projectLifecycleBranch(inspected),
    reviewedWritersDormant: true,
    nextAction: "dispatch-262-125-only",
  })
}

const appendMarker = (text: string, name: string, payload: unknown): string => {
  const open = `<!-- ${name}: `
  if (text.includes(open)) fail("TRACKING_MARKER_ALREADY_PRESENT")
  return `${text.trimEnd()}\n\n${open}${JSON.stringify(normalize(payload as Json))} -->\n`
}

const lifecycleWithRoot = (body: Record<string, unknown>) => ({
  ...body,
  lifecycleRoot: rooted(DOMAIN_LIFECYCLE, body),
})

export const writeReviewedReadiness = (root: string): any => {
  assertWorkingEqualsCommitted(root, V138_PLAN_262_95_PATHS.review125)
  if (
    safeKind(path.join(root, V138_PLAN_262_95_PATHS.legacyReadiness)) !==
    "absent"
  )
    fail("LEGACY_READINESS_PRESENT")
  const review = readJson(root, V138_PLAN_262_95_PATHS.review125)
  const readiness = validateReviewedReadinessGate(root, review)
  exclusiveWrite(root, V138_PLAN_262_95_PATHS.readiness, canonical(readiness))
  return readiness
}

export const replaceReviewedReadiness = (root: string): any => {
  if (
    safeKind(path.join(root, V138_PLAN_262_95_PATHS.legacyReadiness)) !==
    "absent"
  )
    fail("LEGACY_READINESS_PRESENT")
  const trackedDrift = git(root, [
    "status",
    "--porcelain",
    "--untracked-files=no",
  ])
  if (trackedDrift !== "") fail("REPLACEMENT_TRACKED_DRIFT")
  assertWorkingEqualsCommitted(root, V138_PLAN_262_95_PATHS.review125)
  assertWorkingEqualsCommitted(root, V138_PLAN_262_95_PATHS.readiness)

  let oldReadiness: any
  const oldBytes = readRegular(root, V138_PLAN_262_95_PATHS.readiness).toString(
    "utf8",
  )
  try {
    oldReadiness = JSON.parse(oldBytes)
  } catch {
    fail("REPLACEMENT_READINESS_MALFORMED")
  }
  if (canonical(oldReadiness) !== oldBytes)
    fail("REPLACEMENT_READINESS_NONCANONICAL")
  const oldReview = assertPlan125Review(root, {
    schemaVersion: PLAN_125_REVIEW_SCHEMA,
    sourceCommit: oldReadiness?.sourceCommit,
    sourceTree: oldReadiness?.sourceTree,
    sourceFiles: oldReadiness?.sourceFiles,
    findingCount: 0,
    plan126Eligible: true,
    authorizesExecution: false,
    reviewRoot: oldReadiness?.reviewRoot,
  })
  assertReadinessForReview(root, oldReadiness, oldReview)

  const freshReview = assertPlan125Review(
    root,
    readJson(root, V138_PLAN_262_95_PATHS.review125),
  )
  assertReviewMatchesCurrentSource(root, freshReview)
  if (
    freshReview.reviewRoot === oldReview.reviewRoot ||
    freshReview.sourceCommit === oldReview.sourceCommit
  )
    fail("REPLACEMENT_READINESS_NOT_STALE")
  const inspected = inspectDispositionBranch(
    readJson(root, V138_PLAN_262_95_PATHS.disposition),
    currentPresence(root),
  )
  const projection = projectLifecycleBranch(inspected)
  if (
    projection.branch !== "gaps" ||
    canonical(projection.authority) !== canonical(FALSE_AUTHORITY)
  )
    fail("REPLACEMENT_BRANCH_INVALID")

  const replacement = validateReviewedReadinessGate(root, freshReview)
  atomicReplaceRegular(
    root,
    V138_PLAN_262_95_PATHS.readiness,
    canonical(replacement),
  )
  return replacement
}

export const checkReviewedReadiness = (root: string): any => {
  if (
    safeKind(path.join(root, V138_PLAN_262_95_PATHS.legacyReadiness)) !==
    "absent"
  )
    fail("LEGACY_READINESS_PRESENT")
  assertWorkingEqualsCommitted(root, V138_PLAN_262_95_PATHS.readiness)
  return assertReviewedReadiness(
    root,
    readJson(root, V138_PLAN_262_95_PATHS.readiness),
  )
}

export const applyProvisionalCloseout = (root: string): any => {
  inspectProvisionalGate(root)
  const source = inspectCurrentLifecycleSource(root)
  const projection = source.projection
  const inventory = source.inventory
  const body = {
    schemaVersion: "v1.38-phase-262-current-lifecycle-status-v4",
    dispositionPath: V138_PLAN_262_95_PATHS.disposition,
    branch: projection.branch,
    admit03: projection.admit03,
    phase262: projection.phase262,
    phase263PlanningEligible: false,
    phase263ExecutionEligible: false,
    permittedMutationClass: projection.permittedMutationClass,
    authority: FALSE_AUTHORITY,
    inventoryCounts: inventory.counts,
    inventoryRoots: inventory.roots,
    assuranceLimitation: LOCAL_SEAL_LIMITATION,
    nextAction: "dispatch-262-127-only",
  }
  const lifecycle = lifecycleWithRoot(body)
  exclusiveWrite(root, V138_PLAN_262_95_PATHS.lifecycle, canonical(lifecycle))

  const pre = Object.fromEntries(
    [
      V138_PLAN_262_95_PATHS.requirements,
      V138_PLAN_262_95_PATHS.roadmap,
      V138_PLAN_262_95_PATHS.state,
    ].map((repoPath) => [
      repoPath,
      readRegular(root, repoPath).toString("utf8"),
    ]),
  )
  const marker = {
    schemaVersion: "v1.38-plan-262-106-provisional-tracking-v1",
    branch: projection.branch,
    admit03: projection.admit03,
    phase262: projection.phase262,
    phase263PlanningEligible: false,
    phase263ExecutionEligible: false,
    inventoryCounts: inventory.counts,
    inventoryRoot: inventory.roots.all,
    authority: FALSE_AUTHORITY,
    nextAction: "dispatch-262-127-only",
  }
  const post: Record<string, string> = {}
  for (const [repoPath, text] of Object.entries(pre)) {
    const next = appendMarker(
      text,
      "phase-262-plan-106-provisional-tracking",
      marker,
    )
    writeFileSync(path.join(root, repoPath), next)
    post[repoPath] = next
  }
  const changes = Object.keys(pre).map((repoPath) => ({
    path: repoPath,
    beforeSha256: sha256(pre[repoPath]),
    afterSha256: sha256(post[repoPath]),
  }))
  const summary = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "106"\nsubsystem: lifecycle\nstatus: complete\nrequirements-completed: []\n---\n\n# Phase 262 Plan 106: Provisional Lifecycle Projection Summary\n\n**Branch-honest ${projection.branch} projection with Phase 263 withheld pending independent convergence.**\n\n## Projection\n\n- ADMIT-03: ${projection.admit03}\n- Phase 262: ${projection.phase262}\n- Phase 263 planning/execution eligible: false/false\n- Mutation class: ${projection.permittedMutationClass}\n- Next action: Plan 262-127 only\n\n## Bound Changes\n\n\`\`\`json\n${JSON.stringify({ lifecycleSha256: sha256(canonical(lifecycle)), changes }, null, 2)}\n\`\`\`\n\n## Authority\n\nAll candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, tag, and Phase 263 authority remains false.\n`
  exclusiveWrite(root, V138_PLAN_262_95_PATHS.summary106, summary)
  return { lifecycle, changes, summarySha256: sha256(summary) }
}

export const checkProvisionalCloseout = (root: string): any => {
  inspectProvisionalGate(root)
  for (const repoPath of PLAN_106_WRITE_PATHS)
    assertWorkingEqualsCommitted(root, repoPath)
  const changed = git(root, [
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    "HEAD",
  ])
    .split("\n")
    .filter(Boolean)
    .sort()
  if (canonical(changed) !== canonical([...PLAN_106_WRITE_PATHS].sort()))
    fail("PROVISIONAL_COMMIT_PATHS_INVALID")
  const source = inspectCurrentLifecycleSource(root)
  const lifecycle = readJson(root, V138_PLAN_262_95_PATHS.lifecycle)
  const { lifecycleRoot, ...body } = lifecycle
  if (rooted(DOMAIN_LIFECYCLE, body) !== lifecycleRoot)
    fail("LIFECYCLE_ROOT_INVALID")
  if (
    lifecycle.branch !== source.projection.branch ||
    lifecycle.admit03 !== source.projection.admit03 ||
    lifecycle.phase262 !== source.projection.phase262 ||
    lifecycle.phase263PlanningEligible !== false ||
    lifecycle.phase263ExecutionEligible !== false ||
    canonical(lifecycle.authority) !== canonical(FALSE_AUTHORITY)
  )
    fail("LIFECYCLE_PROJECTION_INVALID")
  for (const repoPath of [
    V138_PLAN_262_95_PATHS.requirements,
    V138_PLAN_262_95_PATHS.roadmap,
    V138_PLAN_262_95_PATHS.state,
  ]) {
    const text = readRegular(root, repoPath).toString("utf8")
    if (
      !text.includes("phase-262-plan-106-provisional-tracking") ||
      !text.includes('"phase263PlanningEligible":false') ||
      !text.includes('"phase263ExecutionEligible":false')
    )
      fail("TRACKING_PROJECTION_INVALID")
  }
  return { lifecycle, changedPaths: changed }
}

const main = (): void => {
  const root = process.cwd()
  const selector = process.argv[2]
  if (selector === "--check-source-only") {
    process.stdout.write(canonical(inspectCurrentLifecycleSource(root)))
    return
  }
  if (selector === "--check-prospective") {
    const pass = projectLifecycleBranch(
      inspectDispositionBranch(
        {
          schemaVersion: "v1.38-plan-262-94-admission-disposition-v4",
          status: "pass",
          producerDisposition: "succeeded",
          producerSucceeded: true,
          assuranceStatus: "clean",
          assuranceFindings: [],
          assuranceLimitation: LOCAL_SEAL_LIMITATION,
          contamination: false,
          reproductionPreserved: true,
          counts: {
            freshAccepted: 540,
            requiredAccepted: 540,
            reproductionIdentitiesCharged: 540,
          },
          authority: FALSE_AUTHORITY,
        },
        { reproductionPresent: true, route12Present: true },
      ),
    )
    const gaps = projectLifecycleBranch(
      inspectDispositionBranch(
        readJson(root, V138_PLAN_262_95_PATHS.disposition),
        {
          reproductionPresent: false,
          route12Present: false,
        },
      ),
    )
    process.stdout.write(
      canonical({
        schemaVersion: "v1.38-plan-262-95-prospective-matrix-v1",
        mutationCapable: false,
        pass,
        gaps,
        nextAction: "dispatch-262-125-only",
      }),
    )
    return
  }
  if (selector === "--write-reviewed-readiness") {
    process.stdout.write(canonical(writeReviewedReadiness(root)))
    return
  }
  if (selector === "--check-reviewed-readiness") {
    process.stdout.write(canonical(checkReviewedReadiness(root)))
    return
  }
  if (selector === "--replace-reviewed-readiness") {
    process.stdout.write(canonical(replaceReviewedReadiness(root)))
    return
  }
  if (selector === "--apply-provisional-closeout") {
    process.stdout.write(canonical(applyProvisionalCloseout(root)))
    return
  }
  if (selector === "--check-provisional-closeout") {
    process.stdout.write(canonical(checkProvisionalCloseout(root)))
    return
  }
  fail("SELECTOR_INVALID")
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""
if (invokedPath === fileURLToPath(import.meta.url)) main()
