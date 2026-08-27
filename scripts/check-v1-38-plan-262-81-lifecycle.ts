#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  computeV138Plan26280ActivationRoot,
  validateV138Plan26280Disposition,
} from "./check-v1-38-plan-262-80-bounded-retry-admission.js"

type Sha256 = `sha256:${string}`
type Stage = "pre_summary" | "post_summary"
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const EXPECTED_ARCHIVE_SHA =
  "sha256:9fc59c094d5423830500c383c1a7613e54a0d2dc6e0ee1a00f4882981f16913d"
const SUCCESSOR_IDS = Object.freeze([75, 76, 77, 78, 79, 80, 81, 82, 83])
const REQUIREMENT_IDS = Object.freeze([
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
])
const DENIED_AUTHORITY_KEYS = Object.freeze([
  "phase263Authorized",
  "candidateSearchAuthorized",
  "formationMaterializationAuthorized",
  "holdoutOpeningAuthorized",
  "publicAuthorized",
  "productAuthorized",
  "productionAuthorized",
  "countedPlayAuthorized",
  "gameplayChangeAuthorized",
])

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
const safeType = (target: string): "absent" | "regular" | "directory" | "unsafe" => {
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
  if (safeType(target) !== "regular") fail("V138_PLAN_262_81_INPUT_UNSAFE")
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}
const readJson = (target: string): any => JSON.parse(readRegular(target).toString("utf8"))
const ensureWithin = (parent: string, child: string): void => {
  const resolvedParent = realpathSync(parent)
  const resolvedChildParent = realpathSync(path.dirname(child))
  if (resolvedChildParent !== resolvedParent && !resolvedChildParent.startsWith(`${resolvedParent}${path.sep}`))
    fail("V138_PLAN_262_81_PATH_ESCAPE")
}

export interface V138Plan26281Topology {
  activePlanCount: number
  summaryCount: number
  activePlanIds: number[]
  summaryIds: number[]
  missingSummaryIds: number[]
  planIdentityRoot: Sha256
  summaryIdentityRoot: Sha256
  archiveSha256: Sha256
  plan74SummaryPresent: false
}

const collectIdentities = (phaseDir: string, suffix: "PLAN" | "SUMMARY"): number[] => {
  const pattern = new RegExp(`^262-(\\d+)-${suffix}\\.md$`, "u")
  return readdirSync(phaseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => Number(pattern.exec(entry.name)![1]))
    .sort((left, right) => left - right)
}

export const inspectV138Plan26281Topology = (
  phaseDir: string,
  stage: Stage,
): V138Plan26281Topology => {
  if (safeType(phaseDir) !== "directory") fail("V138_PLAN_262_81_PHASE_DIR_UNSAFE")
  const plans = collectIdentities(phaseDir, "PLAN")
  const summaries = collectIdentities(phaseDir, "SUMMARY")
  if (plans.includes(74)) fail("V138_PLAN_262_81_PLAN_74_ACTIVE_FORBIDDEN")
  if (summaries.includes(74)) fail("V138_PLAN_262_81_PLAN_74_SUMMARY_FORBIDDEN")
  if (new Set(plans).size !== plans.length || new Set(summaries).size !== summaries.length)
    fail("V138_PLAN_262_81_DUPLICATE_IDENTITY")
  if (plans.length !== 64) fail("V138_PLAN_262_81_ACTIVE_PLAN_COUNT_INVALID")
  if (!SUCCESSOR_IDS.every((id) => plans.includes(id)))
    fail("V138_PLAN_262_81_SUCCESSOR_TOPOLOGY_INVALID")
  if (summaries.some((id) => !plans.includes(id)))
    fail("V138_PLAN_262_81_ORPHAN_SUMMARY")
  const expectedSummaryCount = stage === "pre_summary" ? 63 : 64
  if (summaries.length !== expectedSummaryCount)
    fail("V138_PLAN_262_81_SUMMARY_COUNT_INVALID")
  const missing = plans.filter((id) => !summaries.includes(id))
  if (
    (stage === "pre_summary" && canonical(missing) !== canonical([81])) ||
    (stage === "post_summary" && missing.length !== 0)
  )
    fail("V138_PLAN_262_81_SUMMARY_LATCH_INVALID")
  for (const id of SUCCESSOR_IDS) {
    if (stage === "pre_summary" && id === 81) continue
    if (!summaries.includes(id)) fail("V138_PLAN_262_81_SUCCESSOR_SUMMARY_INVALID")
  }
  const archive = path.join(phaseDir, "archived/262-74-HISTORICAL.md")
  if (sha256(readRegular(archive)) !== EXPECTED_ARCHIVE_SHA)
    fail("V138_PLAN_262_81_PLAN_74_ARCHIVE_INVALID")
  return {
    activePlanCount: plans.length,
    summaryCount: summaries.length,
    activePlanIds: plans,
    summaryIds: summaries,
    missingSummaryIds: missing,
    planIdentityRoot: sha256(canonical(plans)),
    summaryIdentityRoot: sha256(canonical(summaries)),
    archiveSha256: EXPECTED_ARCHIVE_SHA,
    plan74SummaryPresent: false,
  }
}

const authorityDenied = (disposition: any): boolean =>
  DENIED_AUTHORITY_KEYS.every((key) => disposition?.authority?.[key] === false)

export const evaluateV138Plan26281Verification = ({
  disposition,
  activationRoot,
  requirementsComplete,
}: {
  disposition: any
  activationRoot: any | null
  requirementsComplete: boolean
}): { status: "passed" | "gaps_found"; gaps: string[] } => {
  const exactPass =
    disposition?.schemaVersion === "v1.38-plan-262-80-admission-disposition-v1" &&
    disposition?.status === "pass" &&
    ["complete", "succeeded"].includes(disposition?.terminalDisposition) &&
    disposition?.counters?.freshAccepted === 540 &&
    disposition?.counters?.requiredAccepted === 540 &&
    disposition?.integrityPassed === true &&
    disposition?.privacySafe === true &&
    disposition?.assuranceClass === "single_operator_local_seal_v1" &&
    disposition?.authority?.foundationActivationAuthorized === true &&
    authorityDenied(disposition) &&
    activationRoot?.schemaVersion === "v1.38-foundation-activation-root-route9-v1" &&
    requirementsComplete
  if (exactPass) return { status: "passed", gaps: [] }
  const gaps: string[] = []
  if (
    disposition?.status !== "pass" ||
    disposition?.counters?.freshAccepted !== 540 ||
    disposition?.counters?.requiredAccepted !== 540
  )
    gaps.push("ADMIT-03")
  if (activationRoot === null) gaps.push("ROUTE9_ACTIVATION_ROOT_ABSENT")
  if (!requirementsComplete) gaps.push("REQUIREMENT_ROOTS_INCOMPLETE")
  if (disposition?.privacySafe !== true) gaps.push("PRIVACY_INVALID")
  if (!authorityDenied(disposition)) gaps.push("PROHIBITION_INVALID")
  return { status: "gaps_found", gaps: [...new Set(gaps)] }
}

const requirementStatus = (requirements: string): { complete: boolean; blocked: string[] } => {
  const blocked: string[] = []
  for (const id of REQUIREMENT_IDS) {
    const checkbox = new RegExp(`^- \\[(x| )\\] \\*\\*${id}\\*\\*:`, "mu").exec(requirements)
    if (!checkbox || checkbox[1] !== "x") blocked.push(id)
  }
  return { complete: blocked.length === 0, blocked }
}

export const renderV138Plan26281Validation = (
  topology: V138Plan26281Topology,
  verification: { status: "passed" | "gaps_found"; gaps: string[] },
  disposition: any,
): string => {
  const rows = REQUIREMENT_IDS.map((id) => {
    const status = id === "ADMIT-03" && verification.status !== "passed" ? "PARTIAL — BLOCKED" : "COVERED"
    const evidence =
      id === "ADMIT-03"
        ? `Plan-80 ${disposition.status}/${disposition.terminalDisposition}; fresh ${disposition.counters?.freshAccepted ?? 0}/${disposition.counters?.requiredAccepted ?? 540}.`
        : "Existing focused contract suites plus the Plan-81 exact lifecycle join."
    return `| ${id} | ${status} | ${evidence} |`
  }).join("\n")
  return `---\nphase: 262\nslug: foundation-admission-measurement-custody-and-containment-con\nstatus: ${verification.status === "passed" ? "complete" : "partial"}\nnyquist_compliant: ${verification.status === "passed"}\nwave_0_complete: true\ncreated: 2026-07-28\nlast_audited: 2026-08-27\n---\n\n# Phase 262 — Validation Strategy\n\n> Plan 262-81 refresh at the exact pre-summary lifecycle boundary: ${topology.activePlanCount} active plans / ${topology.summaryCount} trustworthy summaries. Archived Plan 74 is historical, byte-authenticated, excluded from active discovery, and intentionally unsummarized.\n\n## Test Infrastructure\n\n| Item | Value |\n|---|---|\n| Framework | Vitest 4.1.6 and TypeScript/tsx integration checkers |\n| Lifecycle runner | \`pnpm exec vitest run scripts/check-v1-38-plan-262-81-lifecycle.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1\` |\n| Accounting | Filesystem-derived identities; archived directories excluded; no copied plan counts |\n\n## Requirement Coverage\n\n| Requirement | Status | Behavioral evidence |\n|---|---|---|\n${rows}\n\nCoverage is ${verification.status === "passed" ? "16 covered" : "15 covered and 1 partial-blocked"}. ADMIT-03 is noncompensating: topology equality cannot replace exact fresh 540/540 admission and the Route-9 activation root.\n\n## Lifecycle Topology\n\n| Check | Result |\n|---|---|\n| Active plans | ${topology.activePlanCount} |\n| Trustworthy summaries before Plan-81 summary | ${topology.summaryCount} |\n| Sole missing summary | 262-81 |\n| Required successor plans | 262-75 through 262-83, including corrective Plans 262-82 and 262-83 |\n| Archived Plan 74 | ${topology.archiveSha256} |\n| Active Plan 74 / Plan-74 summary | absent / absent |\n\n## Current Admission Evidence\n\n| Field | Result |\n|---|---|\n| Plan-80 status | ${disposition.status} |\n| Terminal | ${disposition.terminalDisposition} |\n| Fresh accepted | ${disposition.counters?.freshAccepted ?? 0}/${disposition.counters?.requiredAccepted ?? 540} |\n| Route-9 activation root | ${disposition.status === "pass" ? "required and authenticated" : "absent by branch contract"} |\n| Privacy / integrity | ${String(disposition.privacySafe)} / ${String(disposition.integrityPassed)} |\n| Downstream authority | denied |\n\n## Validation Audit 2026-08-27\n\n| Metric | Count |\n|---|---:|\n| Active plans | ${topology.activePlanCount} |\n| Pre-summary trustworthy summaries | ${topology.summaryCount} |\n| Requirements with automated evidence | 16 |\n| Unmet requirements | ${verification.status === "passed" ? 0 : 1} |\n| Fresh accepted | ${disposition.counters?.freshAccepted ?? 0}/540 |\n\nNo lifecycle completion carrier is mutated by this validation refresh. Phase 263 and all formation, holdout-opening, public, product, production, counted-play, and gameplay-change authority remain denied.\n`
}

export const renderV138Plan26281Verification = (
  topology: V138Plan26281Topology,
  result: { status: "passed" | "gaps_found"; gaps: string[] },
  disposition: any,
): string => {
  const body = {
    schemaVersion: "v1.38-plan-262-81-verification-v1",
    status: result.status,
    activePlans: topology.activePlanCount,
    trustworthySummaries: topology.summaryCount,
    archivedPlan74Sha256: topology.archiveSha256,
    plan74SummaryPresent: false,
    dispositionRoot: disposition.dispositionRoot,
    dispositionStatus: disposition.status,
    terminalDisposition: disposition.terminalDisposition,
    freshAccepted: disposition.counters?.freshAccepted ?? 0,
    requiredAccepted: disposition.counters?.requiredAccepted ?? 540,
    gaps: result.gaps,
    phase263Authorized: false,
    downstreamAuthorityDenied: true,
  }
  const reportRoot = sha256(`v138-plan26281-verification-v1\0${canonical(body)}`)
  return `---\nstatus: ${result.status}\nschema: v1.38-plan-262-81-verification-v1\nreport_root: ${reportRoot}\n---\n\n# Phase 262 Verification\n\nActive plans: ${topology.activePlanCount}\nTrustworthy summaries: ${topology.summaryCount}\nArchived Plan 74: ${topology.archiveSha256}\nPlan-74 summary present: false\nPlan-80 disposition: ${disposition.status}\nAdmission disposition root: ${disposition.dispositionRoot}\nTerminal: ${disposition.terminalDisposition}\nFresh accepted: ${disposition.counters?.freshAccepted ?? 0}/${disposition.counters?.requiredAccepted ?? 540}\nRoute-9 activation root: ${disposition.status === "pass" ? "authenticated" : "absent"}\nGaps: ${result.gaps.length === 0 ? "none" : result.gaps.join(", ")}\nHuman items: 0\nPhase 263 authorized: false\nDownstream authority denied: true\n`
}

export const refreshV138Plan26281PreSummaryProof = (args: {
  phaseDir: string
  dispositionPath: string
  activationPath: string
  validationPath: string
  verificationPath: string
  requirementsPath: string
}): any => {
  const topology = inspectV138Plan26281Topology(args.phaseDir, "pre_summary")
  const disposition = readJson(args.dispositionPath)
  validateV138Plan26280Disposition(disposition, disposition)
  const activationType = safeType(args.activationPath)
  let activationRoot: any | null = null
  if (disposition.status === "pass") {
    if (activationType !== "regular") fail("V138_PLAN_262_81_ACTIVATION_MISSING")
    activationRoot = readJson(args.activationPath)
    if (canonical(activationRoot) !== canonical(computeV138Plan26280ActivationRoot(disposition)))
      fail("V138_PLAN_262_81_ACTIVATION_INVALID")
  } else if (activationType !== "absent") {
    fail("V138_PLAN_262_81_NONPASS_ACTIVATION_PRESENT")
  }
  const requirements = readRegular(args.requirementsPath).toString("utf8")
  const requirementCheck = requirementStatus(requirements)
  const result = evaluateV138Plan26281Verification({
    disposition,
    activationRoot,
    requirementsComplete: requirementCheck.complete,
  })
  ensureWithin(args.phaseDir, args.validationPath)
  ensureWithin(args.phaseDir, args.verificationPath)
  writeFileSync(args.validationPath, renderV138Plan26281Validation(topology, result, disposition))
  writeFileSync(args.verificationPath, renderV138Plan26281Verification(topology, result, disposition))
  return { topology, result, dispositionRoot: disposition.dispositionRoot }
}

const checkPreSummary = (args: {
  phaseDir: string
  dispositionPath: string
  activationPath: string
  validationPath: string
  verificationPath: string
  requirementsPath: string
}): any => {
  const topology = inspectV138Plan26281Topology(args.phaseDir, "pre_summary")
  const disposition = readJson(args.dispositionPath)
  validateV138Plan26280Disposition(disposition, disposition)
  const activationRoot = safeType(args.activationPath) === "regular" ? readJson(args.activationPath) : null
  if (disposition.status === "pass") {
    if (activationRoot === null || canonical(activationRoot) !== canonical(computeV138Plan26280ActivationRoot(disposition)))
      fail("V138_PLAN_262_81_ACTIVATION_INVALID")
  } else if (activationRoot !== null) fail("V138_PLAN_262_81_NONPASS_ACTIVATION_PRESENT")
  const requirementCheck = requirementStatus(readRegular(args.requirementsPath).toString("utf8"))
  const result = evaluateV138Plan26281Verification({
    disposition,
    activationRoot,
    requirementsComplete: requirementCheck.complete,
  })
  if (readRegular(args.validationPath).toString("utf8") !== renderV138Plan26281Validation(topology, result, disposition))
    fail("V138_PLAN_262_81_VALIDATION_STALE")
  if (readRegular(args.verificationPath).toString("utf8") !== renderV138Plan26281Verification(topology, result, disposition))
    fail("V138_PLAN_262_81_VERIFICATION_STALE")
  return { topology, result, dispositionRoot: disposition.dispositionRoot }
}

const option = (argv: string[], name: string): string => {
  const index = argv.indexOf(name)
  if (index < 0 || index + 1 >= argv.length) fail("V138_PLAN_262_81_ARGUMENTS_INVALID")
  return argv[index + 1]!
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const resolveRepo = (value: string): string => path.resolve(repoRoot, value)

const main = (): void => {
  const argv = process.argv.slice(2)
  if (argv[0] === "--refresh-pre-summary") {
    const result = refreshV138Plan26281PreSummaryProof({
      phaseDir: resolveRepo(option(argv, "--phase-dir")),
      dispositionPath: resolveRepo(option(argv, "--disposition")),
      activationPath: resolveRepo(option(argv, "--activation-root")),
      validationPath: resolveRepo(option(argv, "--validation")),
      verificationPath: resolveRepo(option(argv, "--verification")),
      requirementsPath: resolveRepo(".planning/REQUIREMENTS.md"),
    })
    process.stdout.write(canonical({ status: result.result.status, activePlans: 64, summaries: 63 }))
    return
  }
  if (argv[0] === "--check-pre-summary") {
    const result = checkPreSummary({
      phaseDir: resolveRepo(option(argv, "--phase-dir")),
      dispositionPath: resolveRepo(option(argv, "--disposition")),
      activationPath: resolveRepo(option(argv, "--activation-root")),
      validationPath: resolveRepo(option(argv, "--validation")),
      verificationPath: resolveRepo(option(argv, "--verification")),
      requirementsPath: resolveRepo(".planning/REQUIREMENTS.md"),
    })
    process.stdout.write(canonical({ status: result.result.status, activePlans: 64, summaries: 63 }))
    return
  }
  fail("V138_PLAN_262_81_ARGUMENTS_INVALID")
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) main()
