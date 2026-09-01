#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type JsonObject = Record<string, any>

const PHASE_DIR = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const PLAN128_COMMIT = "45c27939c146f588d2ce526dd912100f5352db05"
const PLAN128_TREE = "631145ff0c3eb3697aed53c0ffaaf089148b9cab"
const PLAN129_COMMIT = "1cd2a2da213ab40afd146c67c85cecfa38c0dc6a"
const PLAN129_PATH = ".planning/artifacts/v1.38-plan-262-129-later-head-verification-v1.json"
const PLAN129_BLOB = "4404b6851f0430054513fbcec5dd8c90851bf2a1"
const PLAN129_ROOT = "sha256:600be93582bc9307c4dd503a29f1109689bb61a6518b48ed9203403482e57cad"
const TERMINAL_BLOB = "02ab853c58c8a28c9345b969d208387ff644da44"
const DISPOSITION_BLOB = "942dc3dd9a0b693fdc350f6551f94dcd02e632f4"

const PLAN128_BLOBS = Object.freeze({
  ".planning/REQUIREMENTS.md": "0188ef8aad9159255d36075f50431d9f69471c0c",
  ".planning/ROADMAP.md": "b09b037d1c008c11b26538a83ebb5ed086b79586",
  ".planning/STATE.md": "a27d3bf07dc9b22cd6b2131decbb47dc02eb919b",
  ".planning/artifacts/v1.38-phase-262-final-eligibility-v1.json": "28fb1c15a3ffd5cdc0e4cc41ed8c176c5249fa1e",
  [`${PHASE_DIR}/262-128-SUMMARY.md`]: "1b33900e319f2f55e5a173ebd99253bbbde9c7a9",
})

export const AUTHORITY_KEYS = Object.freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
] as const)

export const PLAN_148_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-148-lean-contract-revision.ts",
  "scripts/check-v1-38-plan-262-148-lean-contract-revision.test.ts",
  ".planning/research/SUMMARY.md",
  ".planning/research/competitive-strategy-factory-and-adversarial-league.md",
  ".planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md",
  ".planning/artifacts/v1.38-lean-admission-contract-v1.json",
  ".planning/PROJECT.md",
  ".planning/REQUIREMENTS.md",
  ".planning/ROADMAP.md",
  ".planning/STATE.md",
  ".planning/v1.38-CURRENT-STATUS.md",
  ".planning/v1.38-v1.38-MILESTONE-AUDIT.md",
  `${PHASE_DIR}/262-148-SUMMARY.md`,
].sort())

export const assertProspectiveRevisionPaths = (paths: readonly string[]): void => {
  const actual = [...new Set(paths)].sort()
  if (JSON.stringify(actual) !== JSON.stringify(PLAN_148_PATHS)) fail("PROSPECTIVE_PATH_SET")
  if (actual.some((repoPath) => /(?:run|runner|live|formation|holdout)/iu.test(
    repoPath.replace("check-v1-38-plan-262-148-lean-contract-revision", "contract-checker"),
  ))) fail("PROSPECTIVE_EFFECT_PATH")
}

const CONTRACT_PATH = ".planning/artifacts/v1.38-lean-admission-contract-v1.json"
const TERMINAL_PATH = ".planning/artifacts/v1.38-current-matrix-retry-terminal-v4.json"
const DISPOSITION_PATH = ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json"
const REPRODUCTION_PATH = ".planning/artifacts/v1.38-current-matrix-reproduction-v18.json"

const fail = (code: string): never => { throw new TypeError(`V138_PLAN_262_148_${code}`) }
const sha256 = (bytes: string | Buffer): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const git = (root: string, args: string[]): string =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
const gitBytes = (root: string, ref: string, repoPath: string): Buffer =>
  execFileSync("git", ["show", `${ref}:${repoPath}`], { cwd: root })
const blobAt = (root: string, ref: string, repoPath: string): string =>
  git(root, ["rev-parse", `${ref}:${repoPath}`])
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())
const allFalseAuthority = (): Record<string, false> =>
  Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false])) as Record<string, false>

export const assertWriterStatus = (lines: readonly string[]): void => {
  for (const line of lines) {
    const repoPath = line.slice(3)
    if (line.startsWith("?? ") && (
      repoPath === "scripts/check-v1-38-plan-262-148-lean-contract-revision.ts" ||
      repoPath === "scripts/check-v1-38-plan-262-148-lean-contract-revision.test.ts" ||
      /^\.v138-successor-[a-f0-9]{64}\.lock$/u.test(repoPath)
    )) continue
    fail("WRITER_UNEXPECTED_PATH")
  }
}

export const checkHistoricalCustody = (root: string): JsonObject => {
  if (git(root, ["rev-parse", `${PLAN128_COMMIT}^{tree}`]) !== PLAN128_TREE) fail("PLAN128_TREE")
  for (const [repoPath, blob] of Object.entries(PLAN128_BLOBS))
    if (blobAt(root, PLAN128_COMMIT, repoPath) !== blob) fail("PLAN128_BLOB")
  if (blobAt(root, PLAN129_COMMIT, PLAN129_PATH) !== PLAN129_BLOB) fail("PLAN129_BLOB")
  if (sha256(gitBytes(root, PLAN129_COMMIT, PLAN129_PATH)) !== PLAN129_ROOT) fail("PLAN129_ROOT")
  if (blobAt(root, "HEAD", TERMINAL_PATH) !== TERMINAL_BLOB) fail("TERMINAL_BLOB")
  if (blobAt(root, "HEAD", DISPOSITION_PATH) !== DISPOSITION_BLOB) fail("DISPOSITION_BLOB")

  const terminal = JSON.parse(readFileSync(path.join(root, TERMINAL_PATH), "utf8"))
  const disposition = JSON.parse(readFileSync(path.join(root, DISPOSITION_PATH), "utf8"))
  if (terminal.disposition !== "exhausted" || terminal.freshAccepted !== 0 ||
      terminal.counters?.acceptedCells !== 0 || terminal.productionAuthorized !== false ||
      terminal.downstreamAuthority !== "denied") fail("TERMINAL_HISTORY")
  if (disposition.status !== "non_pass" || disposition.producerDisposition !== "exhausted" ||
      disposition.counts?.freshAccepted !== 0 || disposition.counts?.requiredAccepted !== 540 ||
      disposition.reproductionPreserved !== false) fail("DISPOSITION_HISTORY")
  try {
    execFileSync("git", ["cat-file", "-e", `HEAD:${REPRODUCTION_PATH}`], { cwd: root, stdio: "ignore" })
    fail("REPRODUCTION_PRESENT")
  } catch (error) {
    if (String(error).includes("REPRODUCTION_PRESENT")) throw error
  }
  return {
    historicalFullMatrix: {
      disposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      reproductionPresent: false,
      reinterpreted: false,
    },
    historicalCustody: {
      plan128: { publicationCommit: PLAN128_COMMIT, tree: PLAN128_TREE, protectedBlobs: PLAN128_BLOBS },
      plan129: { verificationCommit: PLAN129_COMMIT, verificationPath: PLAN129_PATH, verificationBlob: PLAN129_BLOB, verificationRoot: PLAN129_ROOT },
    },
  }
}

export const renderLeanContract = (root: string): JsonObject => {
  const history = checkHistoricalCustody(root)
  return {
    schemaVersion: "v1.38-lean-admission-contract-v1",
    decision: "D-34L",
    activePrerequisite: "lean_runner_feasibility_v1",
    ...history,
    fixtureContract: {
      fixturePair: "one_existing_starter_advanced_pair",
      arenaLabels: 3,
      sideAssignments: 2,
      initiativeParities: 2,
      uniqueCells: 12,
      serialPasses: 2,
      chargedMatches: 24,
      outerLimitMinutes: 15,
      capacityPreflight: false,
      calibration: false,
      routeBackoff: false,
      fullMatrixAllocation: false,
      formationMaterialization: false,
      currentFormationOnly: true,
      canonicalTransitionEngineUnchanged: true,
      supervisedRuntimeRequired: true,
      exactSourceAndTupleCustodyRequired: true,
      requiredSupervisedSuccesses: 24,
      requiredCleanupComplete: true,
      requiredCrossPassIdentity: ["terminalOutcome", "finalState", "orderedTransitionsAndEvents", "runtimeAccounting"],
    },
    claimClass: "fixture_feasibility_only",
    correctiveRerunLimit: 1,
    correctiveRerunPreauthorized: false,
    correctiveRerunQualification: "diagnosed_implementation_defect_after_separate_committed_fix_only",
    correctiveRerunDisallowedReasons: ["resource_pressure", "slowness", "gameplay_outcome", "unexplained_nondeterminism"],
    partialCellReuseAllowed: false,
    nextAction: "dispatch-262-149-source-and-tests-only",
    authority: allFalseAuthority(),
  }
}

export const assertLeanContract = (value: JsonObject): JsonObject => {
  const expected = renderLeanContract(process.cwd())
  if (!exactKeys(value, Object.keys(expected))) fail("CONTRACT_SCHEMA")
  if (!exactKeys(value.authority, AUTHORITY_KEYS) || AUTHORITY_KEYS.some((key) => value.authority[key] !== false)) fail("AUTHORITY")
  if (JSON.stringify(value) !== JSON.stringify(expected)) fail("CONTRACT_VALUE")
  return value
}

const replaceOnce = (text: string, before: string, after: string, code: string): string => {
  if (!text.includes(before)) fail(code)
  if (text.indexOf(before) !== text.lastIndexOf(before)) fail(`${code}_DUPLICATE`)
  return text.replace(before, after)
}

const D34L = `## Active D-34L lean admission contract — 2026-09-01

The operator approved \`lean_runner_feasibility_v1\` as the active ADMIT-03 prerequisite. It freezes one existing Starter/Advanced fixture pair across three canonical arena labels, both sides, and both initiative parities: 12 unique cells executed twice serially, exactly 24 charged Matches, and a 15-minute outer limit. The historical full-matrix result remains immutable \`exhausted\` at fresh \`0/540\`, with no reproduction and \`reinterpreted:false\`. The lean gate is pending, not passed; Plan 262-149 is the sole next action and may create only source and tests. Phase 263 planning/execution and every candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, release, and tag authority remain false.`

const addCurrentBlock = (text: string, heading: string): string =>
  text.includes("## Active D-34L lean admission contract") ? text : replaceOnce(text, heading, `${heading}\n\n${D34L}`, "TRACKING_HEADING")

const renderDocuments = (root: string): Record<string, string> => {
  const read = (repoPath: string) => readFileSync(path.join(root, repoPath), "utf8")
  const projectOld = `## Current recovery authority — 2026-08-31\n\nPhase262 remains incomplete at ADMIT-03 0/540. Plan110's sole run failed in native owner/transaction lock composition before allocating observations or Matches; its failure and empty local receipt directory are preserved. The operator approved one corrected invocation under unchanged resource limits. D-33R in the Phase262 context and activation prompt controls this additive repair/review/run; old dispatch/status prose below is historical and does not authorize re-entering110. No further retry, candidate, formation, holdout or public/production authority is implied. Research recommends145→146→147 replacing110 in the pending admission chain, subject to normal GSD plan checking.`
  let project = read(".planning/PROJECT.md")
  project = replaceOnce(project, projectOld, D34L, "PROJECT_D33R")

  let requirements = read(".planning/REQUIREMENTS.md")
  requirements = replaceOnce(requirements,
    "- [ ] **ADMIT-03**: Researchers can reproduce the persisted current-rules audit matrix before candidate search and can use Starter and Advanced Strategies only as smoke, regression, and throughput fixtures rather than balance evidence.",
    "- [ ] **ADMIT-03**: Before candidate search, researchers can pass `lean_runner_feasibility_v1`: one existing Starter/Advanced fixture pair across three canonical arena labels, both side assignments, and both initiative parities (12 unique cells) executes twice serially as exactly 24 charged supervised Matches within a 15-minute outer limit, with complete coverage and cleanup and byte-identical normalized terminal outcome, final-state, ordered transition/event, and runtime-accounting roots across passes. This is `fixture_feasibility_only`; the historical full-matrix result remains immutable `exhausted` at fresh `0/540`, no reproduction, and `reinterpreted:false`.", "REQUIREMENT_ADMIT03")
  requirements = replaceOnce(requirements,
    "| ADMIT-03 | Phase 262 | Blocked (0/540; partial infrastructure evidence only) |",
    "| ADMIT-03 | Phase 262 | Pending (`lean_runner_feasibility_v1`; historical 0/540 retained as superseded evidence) |", "REQUIREMENT_TRACE")
  requirements += `\n<!-- phase-262-plan-148-lean-tracking: {"schemaVersion":"v1.38-plan-262-148-lean-tracking-v1","decision":"D-34L","activePrerequisite":"lean_runner_feasibility_v1","admit03":"pending","historicalFullMatrix":{"disposition":"exhausted","freshAccepted":0,"requiredAccepted":540,"reproductionPresent":false,"reinterpreted":false},"phase262":"in_progress","phase263PlanningEligible":false,"phase263ExecutionEligible":false,"nextAction":"dispatch-262-149-source-and-tests-only","authorityAllFalse":true} -->\n`

  let roadmap = read(".planning/ROADMAP.md")
  const roadmapIntro = /^## Approved D-33R recovery — 2026-08-31\n\n[^\n]+\n/mu.exec(roadmap)?.[0]
  if (!roadmapIntro) fail("ROADMAP_D33R")
  roadmap = roadmap.replace(roadmapIntro, `${D34L}\n`)
  roadmap = replaceOnce(roadmap,
    "  2. Researchers can reproduce the persisted current-rules matrix under the resolved tuple, while Starter and Advanced Strategies are mechanically labeled and accepted only as smoke, regression, and throughput fixtures.",
    "  2. Researchers can pass the reviewed `lean_runner_feasibility_v1` fixture gate: 12 current-formation Starter/Advanced cells run twice serially as 24 charged supervised Matches within 15 minutes, with complete cleanup and byte-identical normalized results across passes; the exhausted 0/540 full-matrix result remains immutable non-pass history.", "ROADMAP_SUCCESS")
  roadmap = roadmap.replace("**Depends on:** Phase 261 (v1.37 complete)", "**Depends on:** Phase 261 (v1.37 complete); Phase 263 remains blocked until reviewed `lean_runner_feasibility_v1` passes")
  roadmap = roadmap.replace("**Current verdict:** PLAN110 NATIVE BOOTSTRAP FAILURE / SOLE INVOCATION USED / FRESH0/540 / NO REENTRY / DOWNSTREAM DENIED.", "**Current verdict:** D-34L LEAN RUNNER FEASIBILITY PENDING / HISTORICAL FULL MATRIX EXHAUSTED 0/540 / NO REINTERPRETATION / ALL AUTHORITY FALSE.")

  let state = read(".planning/STATE.md")
  state = state.replace("status: blocked", "status: in_progress")
    .replace(/^stopped_at:.*$/mu, "stopped_at: Plan262-148 D-34L contract revision; Plan262-149 source/tests are the sole next action")
    .replace(/^last_activity:.*$/mu, "last_activity: 2026-09-01")
    .replace(/^last_activity_desc:.*$/mu, "last_activity_desc: D-34L approved lean_runner_feasibility_v1 as the pending ADMIT-03 prerequisite; historical 0/540 remains immutable")
  state = addCurrentBlock(state, "# State: Coward's Game")
  state += `\n<!-- phase-262-plan-148-lean-tracking: {"activePrerequisite":"lean_runner_feasibility_v1","admit03":"pending","historicalFullMatrix":{"disposition":"exhausted","freshAccepted":0,"requiredAccepted":540,"reproductionPresent":false,"reinterpreted":false},"phase262":"in_progress","phase263PlanningEligible":false,"phase263ExecutionEligible":false,"nextAction":"dispatch-262-149-source-and-tests-only","authorityAllFalse":true} -->\n`

  const researchSummary = addCurrentBlock(read(".planning/research/SUMMARY.md"), "# Project Research Summary")
  const research = addCurrentBlock(read(".planning/research/competitive-strategy-factory-and-adversarial-league.md"), "# Competitive Strategy Factory and Adversarial League")
  const seed = addCurrentBlock(read(".planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md"), "# SEED-002: Competitive Strategy Factory and Adversarial League")

  let status = read(".planning/v1.38-CURRENT-STATUS.md")
  status = status.replace("status: paused_deferred", "status: active_contract_revision")
    .replace("admit_03: blocked", "admit_03: pending_lean_runner_feasibility_v1")
    .replace("updated: 2026-08-31T23:59:00Z", "updated: 2026-09-01T00:00:00Z")
  status = addCurrentBlock(status, "# v1.38 Current Operational Status")
  status = status.replace("v1.38 is paused/deferred at incomplete Phase 262.", "v1.38 is active at incomplete Phase 262 under the approved D-34L contract revision.")
    .replace("ADMIT-03 is blocked. Phase 263", "ADMIT-03 is pending `lean_runner_feasibility_v1`. Phase 263")
    .replace("The protected files remain authoritative inputs to the Plan 128 later-HEAD integrity check and are intentionally not rewritten here.", "The protected Plan 128 commit and blobs remain authoritative historical inputs; this D-34L descendant revises only current admission semantics and tracking.")
    .replace("The ROADMAP and STATE bodies contain stale historical dispatch prose", "The ROADMAP and STATE bodies retain stale historical dispatch prose below their current D-34L sections")

  let audit = read(".planning/v1.38-v1.38-MILESTONE-AUDIT.md")
  audit = addCurrentBlock(audit, "# v1.38 Milestone Audit — Competitive Strategy Factory and Adversarial League")
  audit = audit.replace("status: gaps_found", "status: reopened_pending_lean_gate")
    .replace("      status: unsatisfied\n      phase: 262", "      status: pending_lean_runner_feasibility_v1\n      phase: 262")
    .replace("- Keep v1.38 paused/deferred and untagged.", "- Keep v1.38 active only for the pending D-34L lean gate and untagged.")
    .replace("- Do not start Phases 263–270 under the current contract.", "- Do not start Phase 263 until the reviewed lean gate passes; Phase 264–270 remain unavailable under their ordinary dependencies.")

  return {
    ".planning/PROJECT.md": project,
    ".planning/REQUIREMENTS.md": requirements,
    ".planning/ROADMAP.md": roadmap,
    ".planning/STATE.md": state,
    ".planning/research/SUMMARY.md": researchSummary,
    ".planning/research/competitive-strategy-factory-and-adversarial-league.md": research,
    ".planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md": seed,
    ".planning/v1.38-CURRENT-STATUS.md": status,
    ".planning/v1.38-v1.38-MILESTONE-AUDIT.md": audit,
  }
}

export const checkNoFormationOrAuthority = (text: string): void => {
  if (/formationMaterializationAuthorized"?\s*:\s*true|phase263(?:Planning|Execution)Authorized"?\s*:\s*true/iu.test(text)) fail("TRACKING_AUTHORITY")
  if (/lean_runner_feasibility_v1[^\n]{0,120}\b(?:passed|complete)\b/iu.test(text)) fail("LEAN_FALSE_PASS")
}

export const writeContractRevision = (root: string): void => {
  checkHistoricalCustody(root)
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" })
    .split("\n").filter(Boolean)
  assertWriterStatus(status)
  const documents = renderDocuments(root)
  const contract = `${JSON.stringify(renderLeanContract(root), null, 2)}\n`
  checkNoFormationOrAuthority(contract + Object.values(documents).join("\n"))
  for (const [repoPath, contents] of Object.entries({ ...documents, [CONTRACT_PATH]: contract }))
    writeFileSync(path.join(root, repoPath), contents)
}

export const checkContractRevision = (root: string): JsonObject => {
  const actual = JSON.parse(readFileSync(path.join(root, CONTRACT_PATH), "utf8"))
  assertLeanContract(actual)
  const tracked = [
    ".planning/PROJECT.md", ".planning/REQUIREMENTS.md", ".planning/ROADMAP.md", ".planning/STATE.md",
    ".planning/research/SUMMARY.md", ".planning/research/competitive-strategy-factory-and-adversarial-league.md",
    ".planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md",
    ".planning/v1.38-CURRENT-STATUS.md", ".planning/v1.38-v1.38-MILESTONE-AUDIT.md",
  ]
  const combined = tracked.map((repoPath) => readFileSync(path.join(root, repoPath), "utf8")).join("\n")
  for (const token of ["D-34L", "lean_runner_feasibility_v1", "fixture_feasibility_only", "reinterpreted:false", "Plan 262-149"])
    if (!combined.includes(token)) fail("TRACKING_TOKEN")
  checkNoFormationOrAuthority(combined)
  return actual
}

export const checkD34LLaterHead = (root: string): void => {
  checkHistoricalCustody(root)
  checkContractRevision(root)
  const finalChecker = "scripts/check-v1-38-plan-262-152-lean-final-tracking-v1.ts"
  let finalCheckerPresent = false
  try {
    execFileSync("git", ["cat-file", "-e", `HEAD:${finalChecker}`], { cwd: root, stdio: "ignore" })
    finalCheckerPresent = true
  } catch {
    finalCheckerPresent = false
  }
  if (finalCheckerPresent)
    execFileSync("node", ["--import", "tsx", finalChecker, "--check-final-tracking"], { cwd: root, stdio: "inherit" })
  else {
    const workingPaths = execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" })
      .split("\n").filter(Boolean)
      .map((line) => line.slice(3))
      .filter((repoPath) => !/^\.v138-successor-[a-f0-9]{64}\.lock$/u.test(repoPath))
    if (workingPaths.length > 0) assertProspectiveRevisionPaths(workingPaths)
    else {
      const headPaths = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"])
        .split("\n").filter(Boolean)
      assertProspectiveRevisionPaths(headPaths)
    }
  }
}

const main = (): void => {
  const root = process.cwd()
  const selector = process.argv[2]
  if (selector === "--check-historical-custody") checkHistoricalCustody(root)
  else if (selector === "--write-contract-revision") writeContractRevision(root)
  else if (selector === "--check-contract-revision") checkContractRevision(root)
  else if (selector === "--check-d34l-later-head") checkD34LLaterHead(root)
  else fail("SELECTOR")
  process.stdout.write(`${selector}: PASS\n`)
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invoked) main()
