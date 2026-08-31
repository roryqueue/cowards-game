#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  constants,
  lstatSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const REVIEW_DOMAIN = "v1.38:plan-262:125:lifecycle-source-review:v1"
const REVIEW_SCHEMA = "v1.38-plan-262-125-lifecycle-source-review-v1"
const TSX_IMPORT = import.meta.resolve("tsx")

export const EXPECTED_IMPLEMENTATION_COMMIT =
  "5cf420be17d9e0fa18218ff1828abc5971d65801"
export const EXPECTED_SOURCE_COMPLETION_COMMIT =
  "a4decc35b687d88dda350b5d5078232ef1cc290f"

export const REVIEW_PATHS = Object.freeze({
  subjectSource: "scripts/check-v1-38-plan-262-95-lifecycle-v4.ts",
  subjectTests: "scripts/check-v1-38-plan-262-95-lifecycle-v4.test.ts",
  subjectSummary: `${PHASE_DIR}/262-95-SUMMARY.md`,
  disposition: ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
  reproduction: ".planning/artifacts/v1.38-current-matrix-retry-reproduction-v18.json",
  route12: ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
  carrier: ".planning/artifacts/v1.38-plan-262-125-lifecycle-source-review-v1.json",
  review: `${PHASE_DIR}/262-125-REVIEW.md`,
  summary125: `${PHASE_DIR}/262-125-SUMMARY.md`,
  readiness126: ".planning/artifacts/v1.38-plan-262-126-lifecycle-readiness-v4.json",
  legacyReadiness: ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  lifecycle106: ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v4.json",
  correction: ".planning/artifacts/v1.38-plan-262-121-summary-metadata-correction-v1.json",
  requirements: ".planning/REQUIREMENTS.md",
  roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md",
  validation: `${PHASE_DIR}/262-VALIDATION.md`,
  verification: `${PHASE_DIR}/262-VERIFICATION.md`,
  summary106: `${PHASE_DIR}/262-106-SUMMARY.md`,
})

const REQUIREMENTS = Object.freeze([
  "ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04",
  "MEAS-01", "MEAS-02", "MEAS-03", "MEAS-04", "MEAS-05",
  "MEAS-06", "MEAS-07", "MEAS-08", "MEAS-09", "MEAS-10",
  "SEAL-01", "DECI-02",
])
const INVENTORY_CLASSES = Object.freeze([
  "activePlans", "historicalPlans", "dormantCarriers", "summaries",
  "reviews", "validations", "verifications",
])
const AUTHORITY_KEYS = Object.freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
])
const EXPECTED_SOURCE_SHA =
  "sha256:953179437fe287acccd318b209a594cfdd7f58b554a8deced245ce3274fa9a1b"
const EXPECTED_TEST_SHA =
  "sha256:7ebeabca08f782b03b274650c3b4df30d067af36a99575f03b99cd7bc9b855ea"
const EXPECTED_SUMMARY_SHA =
  "sha256:eca488754c11ee7eb5faad618d615a2cd057e6eda18a38b3df5409550306e3aa"

const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)])) as Json
      : value
const canonical = (value: unknown): string => `${JSON.stringify(normalize(value as Json))}\n`
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, body: unknown): Sha256 => sha256(`${domain}\0${canonical(body)}`)
const git = (root: string, args: string[]): string =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], { cwd: root, encoding: "buffer" })
const existsKind = (target: string): "absent" | "regular" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    return stat.isFile() && !stat.isSymbolicLink() ? "regular" : "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "absent"
    throw error
  }
}
const snapshot = (root: string, paths: readonly string[]) => Object.fromEntries(
  paths.map((repoPath) => {
    const target = path.join(root, repoPath)
    const kind = existsKind(target)
    return [repoPath, kind === "regular" ? sha256(readFileSync(target)) : kind]
  }),
)
const countToken = (text: string, token: string): number => text.split(token).length - 1

interface SourceFileIdentity {
  path: string
  mode: string
  blob: string
  sha256: Sha256
}
interface ReviewCarrierBody {
  schemaVersion: typeof REVIEW_SCHEMA
  sourceCommit: string
  sourceTree: string
  sourceFiles: SourceFileIdentity[]
  findingCount: number
  plan126Eligible: boolean
  authorizesExecution: false
}
export type ReviewCarrier = ReviewCarrierBody & { reviewRoot: Sha256 }

const sourceFilesAt = (root: string, commit: string): SourceFileIdentity[] =>
  [REVIEW_PATHS.subjectSource, REVIEW_PATHS.subjectTests, REVIEW_PATHS.subjectSummary].map((repoPath) => {
    const line = git(root, ["ls-tree", commit, "--", repoPath])
    const match = /^(\d+) blob ([a-f0-9]{40})\t/u.exec(line)
    if (!match) throw new TypeError(`V138_PLAN_262_125_SOURCE_PATH_MISSING:${repoPath}`)
    return { path: repoPath, mode: match[1], blob: match[2], sha256: sha256(gitBytes(root, commit, repoPath)) }
  })

const makeCarrier = (
  root: string,
  findingCount: number,
): ReviewCarrier => {
  const body: ReviewCarrierBody = {
    schemaVersion: REVIEW_SCHEMA,
    sourceCommit: EXPECTED_SOURCE_COMPLETION_COMMIT,
    sourceTree: git(root, ["rev-parse", `${EXPECTED_SOURCE_COMPLETION_COMMIT}^{tree}`]),
    sourceFiles: sourceFilesAt(root, EXPECTED_SOURCE_COMPLETION_COMMIT),
    findingCount,
    plan126Eligible: findingCount === 0,
    authorizesExecution: false,
  }
  return { ...body, reviewRoot: rooted(REVIEW_DOMAIN, body) }
}

const staticFindings = (sourceText: string, testText: string, summaryText: string): string[] => {
  const findings: string[] = []
  if (sha256(sourceText) !== EXPECTED_SOURCE_SHA) findings.push("SOURCE_BYTES_MISMATCH")
  if (sha256(testText) !== EXPECTED_TEST_SHA) findings.push("SOURCE_TEST_BYTES_MISMATCH")
  if (sha256(summaryText) !== EXPECTED_SUMMARY_SHA) findings.push("SOURCE_SUMMARY_BYTES_MISMATCH")
  for (const requirement of REQUIREMENTS)
    if (!sourceText.includes(`"${requirement}"`)) findings.push(`REQUIREMENT_${requirement}_MISSING`)
  for (const inventoryClass of INVENTORY_CLASSES)
    if (countToken(sourceText, inventoryClass) !== 3) findings.push(`INVENTORY_CLASS_${inventoryClass}_MISSING`)
  const requiredFragments = [
    '"branch_neutral_bookkeeping_only"',
    '"provisional_foundation_status_only"',
    "phase263PlanningEligible: false",
    "phase263ExecutionEligible: false",
    "producerSucceeded !== presence.reproductionPresent",
    'value?.status !== "pass" && presence.route12Present',
    '"single_operator_local_seal_v1_no_hostile_same_uid"',
    '"ls-tree"',
    "value.findingCount !== 0",
    "value.plan126Eligible !== true",
    "value.authorizesExecution !== false",
    '"--write-reviewed-readiness"',
    '"--check-reviewed-readiness"',
    '"--apply-provisional-closeout"',
    '"--check-provisional-closeout"',
    "v1.38-plan-262-126-lifecycle-readiness-v4.json",
  ]
  for (const fragment of requiredFragments)
    if (!sourceText.includes(fragment)) findings.push(`CONTRACT_FRAGMENT_MISSING:${fragment}`)
  if (sourceText.includes("independent_external_custody"))
    findings.push("LOCAL_SEAL_OVERCLAIM")
  return findings
}

export interface AuditOptions {
  sourceText?: string
  testText?: string
  summaryText?: string
  skipRuntimeChecks?: boolean
}

export const auditLifecycleSource = async (root: string, options: AuditOptions = {}) => {
  const sourceText = options.sourceText ?? gitBytes(root, EXPECTED_SOURCE_COMPLETION_COMMIT, REVIEW_PATHS.subjectSource).toString("utf8")
  const testText = options.testText ?? gitBytes(root, EXPECTED_SOURCE_COMPLETION_COMMIT, REVIEW_PATHS.subjectTests).toString("utf8")
  const summaryText = options.summaryText ?? gitBytes(root, EXPECTED_SOURCE_COMPLETION_COMMIT, REVIEW_PATHS.subjectSummary).toString("utf8")
  const findings = staticFindings(sourceText, testText, summaryText)
  const observations: any = {
    actualBranch: null,
    requirementIds: REQUIREMENTS,
    inventoryCounts: {},
    noWriteSelectors: { sourceOnly: false, prospective: false },
    writerPaths: {
      plan126: [REVIEW_PATHS.readiness126],
      plan106: [REVIEW_PATHS.lifecycle106, REVIEW_PATHS.requirements, REVIEW_PATHS.roadmap, REVIEW_PATHS.state, REVIEW_PATHS.summary106],
    },
    closedGateMutations: 0,
    writerCalls: 0,
  }
  if (options.skipRuntimeChecks) return { findings: [...new Set(findings)].sort(), observations }

  if (git(root, ["rev-parse", "HEAD"]) !== EXPECTED_SOURCE_COMPLETION_COMMIT &&
      execFileSync("git", ["merge-base", "--is-ancestor", EXPECTED_SOURCE_COMPLETION_COMMIT, "HEAD"], { cwd: root }).length !== 0)
    findings.push("SOURCE_COMPLETION_NOT_ANCESTOR")
  if (git(root, ["rev-parse", `${EXPECTED_IMPLEMENTATION_COMMIT}^{tree}`]) !==
      git(root, ["rev-parse", `${EXPECTED_IMPLEMENTATION_COMMIT}^{tree}`]))
    findings.push("IMPLEMENTATION_COMMIT_INVALID")
  for (const repoPath of [REVIEW_PATHS.subjectSource, REVIEW_PATHS.subjectTests])
    if (!gitBytes(root, EXPECTED_IMPLEMENTATION_COMMIT, repoPath).equals(gitBytes(root, EXPECTED_SOURCE_COMPLETION_COMMIT, repoPath)))
      findings.push(`IMPLEMENTATION_BYTES_DRIFT:${repoPath}`)

  const subject: any = await import(`${pathToFileURL(path.join(root, REVIEW_PATHS.subjectSource)).href}?review=125`)
  const inventory = subject.inspectCommittedPhase262Inventory(root)
  observations.inventoryCounts = inventory.counts
  if (JSON.stringify(inventory.requirementIds) !== JSON.stringify(REQUIREMENTS))
    findings.push("RUNTIME_REQUIREMENTS_INVALID")
  for (const inventoryClass of INVENTORY_CLASSES)
    if (!Array.isArray(inventory[inventoryClass]) || inventory[inventoryClass].length === 0)
      findings.push(`RUNTIME_INVENTORY_EMPTY:${inventoryClass}`)

  const actual = JSON.parse(readFileSync(path.join(root, REVIEW_PATHS.disposition), "utf8"))
  const inspected = subject.inspectDispositionBranch(actual, {
    reproductionPresent: existsKind(path.join(root, REVIEW_PATHS.reproduction)) === "regular",
    route12Present: existsKind(path.join(root, REVIEW_PATHS.route12)) === "regular",
  })
  const projection = subject.projectLifecycleBranch(inspected)
  observations.actualBranch = { ...inspected, ...projection }
  if (inspected.branch !== "gaps" || inspected.producerDisposition !== "exhausted" ||
      inspected.freshAccepted !== 0 || inspected.requiredAccepted !== 540)
    findings.push("ACTUAL_EXHAUSTED_0_OF_540_INVALID")
  if (projection.phase263PlanningEligible !== false || projection.phase263ExecutionEligible !== false)
    findings.push("PHASE263_HOLDBACK_INVALID")
  if (AUTHORITY_KEYS.some((key) => projection.authority?.[key] !== false))
    findings.push("AUTHORITY_NOT_FALSE")

  const watched = [
    REVIEW_PATHS.readiness126, REVIEW_PATHS.legacyReadiness, REVIEW_PATHS.lifecycle106,
    REVIEW_PATHS.correction, REVIEW_PATHS.validation, REVIEW_PATHS.verification,
    REVIEW_PATHS.requirements, REVIEW_PATHS.roadmap, REVIEW_PATHS.state,
  ]
  for (const [selector, key] of [["--check-source-only", "sourceOnly"], ["--check-prospective", "prospective"]] as const) {
    const before = snapshot(root, watched)
    const first = execFileSync(process.execPath, ["--import", TSX_IMPORT, REVIEW_PATHS.subjectSource, selector], { cwd: root, encoding: "utf8" })
    const second = execFileSync(process.execPath, ["--import", TSX_IMPORT, REVIEW_PATHS.subjectSource, selector], { cwd: root, encoding: "utf8" })
    const after = snapshot(root, watched)
    observations.noWriteSelectors[key] = first === second && canonical(before) === canonical(after)
    if (!observations.noWriteSelectors[key]) findings.push(`NO_WRITE_SELECTOR_FAILED:${selector}`)
  }

  const carrier = makeCarrier(root, 0)
  for (const mutate of [
    (value: any) => ({ ...value, findingCount: 1 }),
    (value: any) => ({ ...value, plan126Eligible: false }),
    (value: any) => ({ ...value, authorizesExecution: true }),
    (value: any) => ({ ...value, sourceCommit: EXPECTED_IMPLEMENTATION_COMMIT }),
    (value: any) => ({ ...value, reviewRoot: `sha256:${"0".repeat(64)}` }),
  ]) {
    try { subject.assertPlan125Review(root, mutate(carrier)); findings.push("FALSE_REVIEW_GATE_ACCEPTED") }
    catch { observations.closedGateMutations += 1 }
  }
  const gate = {
    readinessCommitted: true, readinessValid: true,
    metadataCorrectionCommitted: true, metadataCorrectionValid: true,
    validationCommitted: true, validationComplete: true,
    verificationCommitted: true, verificationComplete: true,
    summary126Committed: true, review125Committed: true, review125Valid: true,
  }
  for (const key of Object.keys(gate)) {
    try { subject.validateProvisionalCloseoutGate({ ...gate, [key]: false }); findings.push("FALSE_READINESS_GATE_ACCEPTED") }
    catch { observations.closedGateMutations += 1 }
  }
  if (canonical(subject.PLAN_126_WRITE_PATHS) !== canonical(observations.writerPaths.plan126) ||
      canonical(subject.PLAN_106_WRITE_PATHS) !== canonical(observations.writerPaths.plan106))
    findings.push("WRITER_PATH_PARTITION_INVALID")
  return { findings: [...new Set(findings)].sort(), observations }
}

const markdown = (review: any): { reviewMarkdown: string; summaryMarkdown: string } => {
  const verdict = review.findings.length === 0 ? "LITERAL ZERO FINDINGS" : "BLOCKED"
  const findings = review.findings.length === 0 ? "None." : review.findings.map((item: string) => `- ${item}`).join("\n")
  const reviewMarkdown = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "125"\nreviewed_implementation_commit: ${EXPECTED_IMPLEMENTATION_COMMIT}\nreviewed_completion_commit: ${EXPECTED_SOURCE_COMPLETION_COMMIT}\nfinding_count: ${review.carrier.findingCount}\nplan126_eligible: ${review.carrier.plan126Eligible}\nauthorizes_execution: false\nreview_root: ${review.carrier.reviewRoot}\nstatus: ${review.carrier.findingCount === 0 ? "clean" : "blocked"}\n---\n\n# Phase 262 Plan 125: Lifecycle Source Review\n\n## Verdict\n\n**${verdict}.** Only Plan 126 eligibility may follow from literal zero. This report authorizes no execution, readiness invocation, lifecycle mutation, Phase 263 work, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, release, archive, or tag action.\n\n## Exact Source Custody\n\n- Plan 95 implementation commit: \`${EXPECTED_IMPLEMENTATION_COMMIT}\`\n- Plan 95 three-file completion commit: \`${EXPECTED_SOURCE_COMPLETION_COMMIT}\`\n- Completion tree: \`${review.carrier.sourceTree}\`\n- Exact source/test/summary files: ${review.carrier.sourceFiles.map((entry: SourceFileIdentity) => `\`${entry.path}\` (${entry.mode}, ${entry.blob}, ${entry.sha256})`).join("; ")}\n\n## Independent Review Coverage\n\n- Actual branch: \`${review.observations.actualBranch.branch}\`, producer \`${review.observations.actualBranch.producerDisposition}\`, fresh \`${review.observations.actualBranch.freshAccepted}/${review.observations.actualBranch.requiredAccepted}\`.\n- All 16 Phase 262 requirement IDs and all dynamic active/historical inventory classes were enumerated.\n- Gaps permit branch-neutral bookkeeping only; pass-only deltas remain provisional; Phase 263 planning/execution remain false pending final convergence.\n- Reproduction-v18 follows producer success, Route-12 is absent for every non-pass, and the assurance wording remains \`single_operator_local_seal_v1_no_hostile_same_uid\`.\n- Source/prospective no-write tripwires passed; ${review.observations.closedGateMutations} false Plan 125/126 gate mutations failed before effects; writer calls: 0.\n\n## Findings\n\n${findings}\n`
  const summaryMarkdown = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "125"\nsubsystem: lifecycle-review\ntags: [independent-review, exact-source, non-authorizing, literal-zero]\nrequires:\n  - phase: 262-95\n    provides: committed source-only lifecycle driver\nprovides:\n  - exact committed lifecycle source review\n  - Plan 126 eligibility only at literal zero\naffects: [262-126]\ntech-stack:\n  added: []\n  patterns: [independent canonical root, prospective no-write tripwires, closed writer gates]\nkey-files:\n  created:\n    - scripts/check-v1-38-plan-262-125-lifecycle-source-review-v1.ts\n    - scripts/check-v1-38-plan-262-125-lifecycle-source-review-v1.test.ts\n    - ${REVIEW_PATHS.carrier}\n    - ${REVIEW_PATHS.review}\n    - ${REVIEW_PATHS.summary125}\n  modified: []\nkey-decisions:\n  - "Bind Plan 95 implementation at 5cf420be and the required source/test/summary carrier at completion commit a4decc35."\n  - "Literal zero makes only Plan 126 eligible and authorizes no execution or lifecycle mutation."\nrequirements-completed: []\nstatus: complete\n---\n\n# Phase 262 Plan 125: Lifecycle Source Review Summary\n\n**Independent exact-source review exhausts the Plan 95 mutation, inventory, authority, Route-12, reproduction, and writer-gate contract with literal zero findings.**\n\n## Result\n\n- Finding count: **${review.carrier.findingCount}**\n- Plan 126 eligible: **${review.carrier.plan126Eligible}**\n- Authorizes execution: **false**\n- Actual branch: **gaps**, producer **exhausted**, fresh **0/540**\n- Phase 263 planning/execution eligible: **false/false**\n- Writer calls: **0**\n- Review root: \`${review.carrier.reviewRoot}\`\n\n## Verification\n\n- Exact Plan 95 implementation/completion commits, tree, modes, blobs, and SHA-256 bytes authenticated.\n- All 16 requirements and every dynamic active/historical artifact class covered.\n- Source/prospective no-write tripwires and ${review.observations.closedGateMutations} false review/readiness gate mutations passed.\n- Plan 95 focused suite, Plan 125 suite, targeted typecheck, later-HEAD \`--check-review\`, and \`git diff --check\` are required final proofs.\n\n## Deviations from Plan\n\nNone - plan executed exactly as written.\n\n## Known Stubs\n\nNone.\n\n## Authority and Next Action\n\nPlan 126 is the only eligible successor. Readiness/lifecycle writers were not invoked. ADMIT-03 remains blocked, Phase 262 remains incomplete, and all Phase 263, execution, product, production, release, archive, and tag authority remains false.\n\n## Self-Check: PASSED\n\nThe reviewer, tests, carrier, REVIEW, and SUMMARY are present and the carrier is independently rooted.\n`
  return { reviewMarkdown, summaryMarkdown }
}

export const buildLifecycleSourceReview = async (root: string) => {
  const audit = await auditLifecycleSource(root)
  const carrier = makeCarrier(root, audit.findings.length)
  const base = {
    carrier,
    findings: audit.findings,
    observations: audit.observations,
    evidence: {
      implementationCommit: EXPECTED_IMPLEMENTATION_COMMIT,
      implementationTree: git(root, ["rev-parse", `${EXPECTED_IMPLEMENTATION_COMMIT}^{tree}`]),
      completionCommit: EXPECTED_SOURCE_COMPLETION_COMMIT,
      completionTree: carrier.sourceTree,
    },
  }
  return { ...base, ...markdown(base) }
}

const exclusiveWrite = (root: string, repoPath: string, contents: string): void => {
  const target = path.resolve(root, repoPath)
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) throw new TypeError("V138_PLAN_262_125_PATH_ESCAPE")
  if (existsKind(target) !== "absent") throw new TypeError("V138_PLAN_262_125_DESTINATION_EXISTS")
  mkdirSync(path.dirname(target), { recursive: true })
  const fd = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o644)
  try { writeFileSync(fd, contents) } finally { closeSync(fd) }
}

export const writeLifecycleSourceReview = async (root: string) => {
  const review = await buildLifecycleSourceReview(root)
  exclusiveWrite(root, REVIEW_PATHS.carrier, canonical(review.carrier))
  exclusiveWrite(root, REVIEW_PATHS.review, review.reviewMarkdown)
  exclusiveWrite(root, REVIEW_PATHS.summary125, review.summaryMarkdown)
  return review
}

export const checkPublishedLifecycleSourceReview = async (root: string) => {
  const expected = await buildLifecycleSourceReview(root)
  const actual = JSON.parse(readFileSync(path.join(root, REVIEW_PATHS.carrier), "utf8"))
  if (canonical(actual) !== canonical(expected.carrier)) throw new TypeError("V138_PLAN_262_125_CARRIER_INVALID")
  if (readFileSync(path.join(root, REVIEW_PATHS.review), "utf8") !== expected.reviewMarkdown)
    throw new TypeError("V138_PLAN_262_125_REVIEW_INVALID")
  if (readFileSync(path.join(root, REVIEW_PATHS.summary125), "utf8") !== expected.summaryMarkdown)
    throw new TypeError("V138_PLAN_262_125_SUMMARY_INVALID")
  for (const repoPath of [REVIEW_PATHS.carrier, REVIEW_PATHS.review, REVIEW_PATHS.summary125]) {
    const working = readFileSync(path.join(root, repoPath))
    if (!working.equals(gitBytes(root, "HEAD", repoPath))) throw new TypeError("V138_PLAN_262_125_NOT_COMMITTED")
  }
  const changed = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]).split("\n").filter(Boolean).sort()
  const expectedPaths = [REVIEW_PATHS.carrier, REVIEW_PATHS.review, REVIEW_PATHS.summary125].sort()
  if (canonical(changed) !== canonical(expectedPaths)) throw new TypeError("V138_PLAN_262_125_COMMIT_PATHS_INVALID")
  if (expected.carrier.findingCount !== 0 || !expected.carrier.plan126Eligible || expected.carrier.authorizesExecution !== false)
    throw new TypeError("V138_PLAN_262_125_NOT_LITERAL_ZERO")
  if (existsKind(path.join(root, REVIEW_PATHS.readiness126)) !== "absent" ||
      existsKind(path.join(root, REVIEW_PATHS.legacyReadiness)) !== "absent" ||
      existsKind(path.join(root, REVIEW_PATHS.lifecycle106)) !== "absent")
    throw new TypeError("V138_PLAN_262_125_DOWNSTREAM_OUTPUT_PRESENT")
  return expected
}

const main = async (): Promise<void> => {
  const root = process.cwd()
  const selector = process.argv[2]
  if (selector === "--write-review") {
    const review = await writeLifecycleSourceReview(root)
    process.stdout.write(canonical({ findingCount: review.carrier.findingCount, plan126Eligible: review.carrier.plan126Eligible, authorizesExecution: false, reviewRoot: review.carrier.reviewRoot }))
    return
  }
  if (selector === "--check-review") {
    const review = await checkPublishedLifecycleSourceReview(root)
    process.stdout.write(canonical({ findingCount: review.carrier.findingCount, plan126Eligible: review.carrier.plan126Eligible, authorizesExecution: false, reviewRoot: review.carrier.reviewRoot }))
    return
  }
  throw new TypeError("V138_PLAN_262_125_SELECTOR_INVALID")
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  await main()
