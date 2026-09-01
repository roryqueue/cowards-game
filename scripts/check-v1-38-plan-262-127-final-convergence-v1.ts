#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
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
const LOCAL_SEAL_LIMITATION =
  "single_operator_local_seal_v1_no_hostile_same_uid"
const REVIEW_SCHEMA = "v1.38-plan-262-127-final-convergence-review-v1"
const FINAL_SCHEMA = "v1.38-phase-262-final-eligibility-v1"
const REVIEW_DOMAIN = "v1.38:plan-262:127:final-convergence-review:v1"
const FINAL_DOMAIN = "v1.38:phase-262:final-eligibility:v1"
const AGGREGATE_DOMAIN = "v1.38:plan-262-94:aggregate-manifest:v4"
const DISPOSITION_DOMAIN = "v1.38:plan-262-94:admission-disposition:v4"
const LIFECYCLE_DOMAIN = "v1.38:phase-262:provisional-lifecycle:v4"
const READINESS_DOMAIN = "v1.38:plan-262:126:lifecycle-readiness:v4"
const PLAN125_REVIEW_DOMAIN = "v1.38:plan-262:125:lifecycle-source-review:v1"

export const PLAN_106_COMMIT =
  "ee5bfa5e88ac7f6bf4686d88e8cf4b9cadc1d4b6"
const REVIEWED_SOURCE_COMMIT = "69ef5511d6f64f302073dccb71aebda70adc465e"
const REVIEWED_SOURCE_ROOT =
  "sha256:d1a79571d662ac63f4ffcb97765e15d074a9f0c89a6a5fe25f1139464565fe6d"
const READINESS_ROOT =
  "sha256:64eeba53ce869e2fd421872e642fbdda7e8996a6d5827c4e32649581ccca8350"

export const REQUIREMENT_IDS = Object.freeze([
  "ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04",
  "MEAS-01", "MEAS-02", "MEAS-03", "MEAS-04", "MEAS-05",
  "MEAS-06", "MEAS-07", "MEAS-08", "MEAS-09", "MEAS-10",
  "SEAL-01", "DECI-02",
] as const)

export const AUTHORITY_KEYS = Object.freeze([
  "archiveAuthorized", "candidateSearchAuthorized", "countedPlayAuthorized",
  "formationMaterializationAuthorized", "foundationActivationAuthorized",
  "gameplayChangeAuthorized", "holdoutOpeningAuthorized",
  "phase263ExecutionAuthorized", "phase263PlanningAuthorized",
  "productAuthorized", "productionAuthorized", "publicAuthorized", "tagAuthorized",
] as const)

type Authority = Record<(typeof AUTHORITY_KEYS)[number], boolean>
const FALSE_AUTHORITY = Object.freeze(
  Object.fromEntries(AUTHORITY_KEYS.map((key) => [key, false])) as Authority,
)

const PATHS = Object.freeze({
  source: "scripts/check-v1-38-plan-262-127-final-convergence-v1.ts",
  tests: "scripts/check-v1-38-plan-262-127-final-convergence-v1.test.ts",
  reviewCarrier:
    ".planning/artifacts/v1.38-plan-262-127-final-convergence-review-v1.json",
  reviewReport: `${PHASE_DIR}/262-127-REVIEW.md`,
  summary127: `${PHASE_DIR}/262-127-SUMMARY.md`,
  finalCarrier: ".planning/artifacts/v1.38-phase-262-final-eligibility-v1.json",
  summary128: `${PHASE_DIR}/262-128-SUMMARY.md`,
  anchor129: `${PHASE_DIR}/262-129-LATER-HEAD-ANCHOR.md`,
  verification129:
    ".planning/artifacts/v1.38-plan-262-129-later-head-verification-v1.json",
  verificationReport129: `${PHASE_DIR}/262-129-VERIFICATION.md`,
  summary129: `${PHASE_DIR}/262-129-SUMMARY.md`,
  review125:
    ".planning/artifacts/v1.38-plan-262-125-lifecycle-source-review-v1.json",
  readiness126:
    ".planning/artifacts/v1.38-plan-262-126-lifecycle-readiness-v4.json",
  lifecycle106:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v4.json",
  summary106: `${PHASE_DIR}/262-106-SUMMARY.md`,
  requirements: ".planning/REQUIREMENTS.md",
  roadmap: ".planning/ROADMAP.md",
  state: ".planning/STATE.md",
  validation: `${PHASE_DIR}/262-VALIDATION.md`,
  verification: `${PHASE_DIR}/262-VERIFICATION.md`,
  metadataCorrection:
    ".planning/artifacts/v1.38-plan-262-121-summary-metadata-correction-v1.json",
  summary121: `${PHASE_DIR}/262-121-SUMMARY.md`,
  disposition:
    ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
  aggregate:
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v4.json",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v4.json",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v18.json",
  route12: ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl",
  privateV4: ".planning/artifacts/v1.38-current-matrix-retry-private-v4",
  privateV3: ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
})

export const PLAN_106_PATHS = Object.freeze([
  PATHS.requirements,
  PATHS.roadmap,
  PATHS.state,
  PATHS.lifecycle106,
  PATHS.summary106,
].sort())

export const PLAN_128_PATHS = Object.freeze([
  PATHS.requirements,
  PATHS.roadmap,
  PATHS.state,
  PATHS.finalCarrier,
  PATHS.summary128,
].sort())

const fail = (code: string): never => {
  throw new TypeError(`V138_PLAN_262_127_${code}`)
}
const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, normalize(child)]),
        ) as Json
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(normalize(value as Json))}\n`
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, body: unknown): Sha256 =>
  sha256(`${domain}\0${canonical(body)}`)
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  canonical(Object.keys(value).sort()) === canonical([...keys].sort())
const git = (root: string, args: string[]): string =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
const gitBytes = (root: string, ref: string, repoPath: string): Buffer =>
  execFileSync("git", ["show", `${ref}:${repoPath}`], {
    cwd: root,
    encoding: "buffer",
  })
const isAncestor = (root: string, ancestor: string, descendant: string): boolean => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    })
    return true
  } catch {
    return false
  }
}
const pathExistsAt = (root: string, ref: string, repoPath: string): boolean => {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}:${repoPath}`], {
      cwd: root,
      stdio: "ignore",
    })
    return true
  } catch {
    return false
  }
}
const kind = (target: string): "absent" | "file" | "directory" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "file"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "absent"
    throw error
  }
}
const readJsonAt = (root: string, ref: string, repoPath: string): any =>
  JSON.parse(gitBytes(root, ref, repoPath).toString("utf8"))
const changedPaths = (root: string, commit: string): string[] =>
  git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit])
    .split("\n").filter(Boolean).sort()

interface Inventory {
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

const makeInventory = (groups: Omit<Inventory, "allPaths" | "counts" | "roots">): Inventory => {
  const allPaths = [...new Set(Object.values(groups).flat())].sort()
  return {
    ...groups,
    allPaths,
    counts: {
      ...Object.fromEntries(
        Object.entries(groups).map(([name, values]) => [name, values.length]),
      ),
      total: allPaths.length,
    },
    roots: {
      ...Object.fromEntries(
        Object.entries(groups).map(([name, values]) => [name, sha256(canonical(values))]),
      ),
      all: sha256(canonical(allPaths)),
    },
  }
}

export const classifyPhase262Paths = (
  committed: readonly string[],
  phaseDir = PHASE_DIR,
): Inventory => {
  const prefix = `${phaseDir}/`
  const relative = (repoPath: string) => repoPath.slice(prefix.length)
  const select = (predicate: (item: string) => boolean) =>
    committed.filter((repoPath) => repoPath.startsWith(prefix) && predicate(relative(repoPath))).sort()
  const groups = {
    activePlans: select((item) => /^262-\d+-PLAN\.md$/u.test(item)),
    historicalPlans: select((item) => /^archived\/262-\d+-HISTORICAL\.md$/u.test(item)),
    dormantCarriers: select((item) => item.startsWith("dormant/")),
    summaries: select((item) => /^262-\d+-SUMMARY\.md$/u.test(item)),
    reviews: select((item) => /(?:^|-)REVIEW(?:-|\.|$)/u.test(item)),
    validations: select((item) => /(?:^|-)VALIDATION\.md$/u.test(item)),
    verifications: select((item) => /(?:^|-)VERIFICATION\.md$/u.test(item)),
  }
  for (const [name, values] of Object.entries(groups))
    if (values.length === 0) fail(`INVENTORY_${name.toUpperCase()}_EMPTY`)
  return makeInventory(groups)
}

const inventoryAt = (root: string, ref: string): Inventory =>
  classifyPhase262Paths(
    git(root, ["ls-tree", "-r", "--name-only", ref, PHASE_DIR])
      .split("\n").filter(Boolean),
  )

export const deriveHistoricalInventory = (
  current: Inventory,
  soleSummaryPath: string = PATHS.summary106,
): Inventory => {
  if (!current.summaries.includes(soleSummaryPath)) fail("SOLE_106_SUMMARY_DELTA")
  const historical = makeInventory({
    activePlans: current.activePlans,
    historicalPlans: current.historicalPlans,
    dormantCarriers: current.dormantCarriers,
    summaries: current.summaries.filter((item) => item !== soleSummaryPath),
    reviews: current.reviews,
    validations: current.validations,
    verifications: current.verifications,
  })
  const delta = current.allPaths.filter((item) => !historical.allPaths.includes(item))
  if (canonical(delta) !== canonical([soleSummaryPath])) fail("SOLE_106_SUMMARY_DELTA")
  return historical
}

const rootWithout = (domain: string, value: any, key: string): Sha256 => {
  const body = structuredClone(value)
  delete body[key]
  return rooted(domain, body)
}

const forbiddenAggregateKeys = (value: unknown, trail: string[] = []): string[] => {
  if (Array.isArray(value))
    return value.flatMap((child, index) => forbiddenAggregateKeys(child, [...trail, String(index)]))
  if (value === null || typeof value !== "object") return []
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
    ...(/(?:^|_)(?:path|filename|payload|bytes?|length|ordinal|identity|handle)(?:$|_)/iu.test(key) ||
    /receipt(?:hash|root|path|id|identity|handle|payload|bytes|length|ordinal)/iu.test(key)
      ? [[...trail, key].join(".")] : []),
    ...forbiddenAggregateKeys(child, [...trail, key]),
  ])
}

export const assertAggregateProjection = (value: any): any => {
  const forbidden = forbiddenAggregateKeys(value)
  if (forbidden.length !== 0) fail("AGGREGATE_PRIVACY")
  if (!exactKeys(value, [
    "schemaVersion", "assuranceClass", "assuranceLimitation",
    "independentCustodyClaimed", "generationsFungible", "priorChargesReusable",
    "counts", "commitments", "authority", "aggregateRoot",
  ])) fail("AGGREGATE_SCHEMA")
  return value
}

const assertRooted = (value: any, domain: string, rootKey: string, code: string): void => {
  if (typeof value?.[rootKey] !== "string" || value[rootKey] !== rootWithout(domain, value, rootKey))
    fail(code)
}

const assertAllFalse = (value: any, code: string): Authority => {
  if (!exactKeys(value, AUTHORITY_KEYS) || AUTHORITY_KEYS.some((key) => value[key] !== false))
    fail(code)
  return value
}

export const projectFinalAuthority = (branch: "pass" | "gaps"): Authority =>
  Object.freeze({
    ...FALSE_AUTHORITY,
    phase263PlanningAuthorized: branch === "pass",
  })

const inspectDAG = (root: string, ref: string, inventory: Inventory) => {
  const paths = [...inventory.activePlans, ...inventory.historicalPlans]
  const ids = paths.map((repoPath) => {
    const match = /(?:^|\/)(262-\d+)-(?:PLAN|HISTORICAL)\.md$/u.exec(repoPath)
    const id = match?.[1]
    if (!id) fail("DAG_ID_INVALID")
    return id as string
  })
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort()
  const nodes = new Set(ids)
  const edges = new Map<string, string[]>()
  const missingDependencies: string[] = []
  for (let index = 0; index < paths.length; index += 1) {
    const repoPath = paths[index] as string
    const nodeId = ids[index] as string
    const text = gitBytes(root, ref, repoPath).toString("utf8")
    const line = /^depends_on:\s*\[([^\]]*)\]/mu.exec(text)?.[1] ?? ""
    const deps = line.split(",").map((item) => item.trim().replace(/^['"]|['"]$/gu, "")).filter(Boolean)
    edges.set(nodeId, deps)
    for (const dep of deps) if (!nodes.has(dep)) missingDependencies.push(`${nodeId}->${dep}`)
  }
  const cycles: string[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visiting.has(id)) { cycles.push(id); return }
    if (visited.has(id)) return
    visiting.add(id)
    for (const dep of edges.get(id) ?? []) if (nodes.has(dep)) visit(dep)
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of nodes) visit(id)
  return {
    nodeCount: nodes.size,
    edgeCount: [...edges.values()].flat().length,
    duplicateIds,
    missingDependencies: [...new Set(missingDependencies)].sort(),
    cycles: [...new Set(cycles)].sort(),
  }
}

export const classifyRequirements = (requirementsText: string) => {
  const classifications: Record<string, string> = {}
  for (const id of REQUIREMENT_IDS) {
    const checklist = [...requirementsText.matchAll(new RegExp(`^- \\[([ x])\\] \\*\\*${id}\\*\\*:`, "gmu"))]
    const trace = [...requirementsText.matchAll(new RegExp(`^\\| ${id} \\| Phase 262 \\| ([^|]+)\\|$`, "gmu"))]
    if (checklist.length !== 1 || trace.length !== 1) fail(`REQUIREMENT_${id}_CLASSIFICATION`)
    const checklistStatus = checklist[0][1] === "x" ? "complete" : "blocked"
    const traceStatus = trace[0][1].trim()
    const expectedChecklist = id === "ADMIT-03" ? "blocked" : "complete"
    const expectedTrace = id === "ADMIT-03"
      ? "Blocked (0/540; partial infrastructure evidence only)"
      : "Complete"
    if (checklistStatus !== expectedChecklist || traceStatus !== expectedTrace)
      fail(`REQUIREMENT_${id}_STATUS`)
    const actual = `${checklistStatus}:${traceStatus}`
    classifications[id] = actual
  }
  return classifications
}

export const assertStructuredProofCoverage = (
  validation: string,
  verification: string,
  historical: Inventory,
): void => {
  const expectedStatus = (id: string) =>
    id === "ADMIT-03" ? "BLOCKED" : id === "SEAL-01" ? "SATISFIED WITH LIMIT" : "SATISFIED"
  for (const text of [validation, verification]) {
    for (const id of REQUIREMENT_IDS) {
      const rows = [...text.matchAll(new RegExp(`^\\| ${id} \\| COVERED \\| ([^|]+)\\|`, "gmu"))]
      if (rows.length !== 1 || rows[0][1].trim() !== expectedStatus(id))
        fail(`PROOF_REQUIREMENT_${id}`)
    }
  }
  const inventoryLine = verification.split("\n").find((line) =>
    line.startsWith('{"schemaVersion":"v1.38-plan-262-126-wr02-proof-inventory-v1"'))
  if (!inventoryLine) fail("PROOF_INVENTORY_MISSING")
  const proof = JSON.parse(inventoryLine as string)
  if (canonical(proof.counts) !== canonical(historical.counts) ||
      canonical(proof.roots) !== canonical(historical.roots) ||
      !exactKeys(proof.classes, [
        "activePlans", "historicalPlans", "dormantCarriers", "summaries",
        "reviews", "validations", "verifications",
      ]) ||
      Object.keys(proof.classes).some((key) =>
        canonical(proof.classes[key]) !== canonical((historical as any)[key])))
    fail("PROOF_INVENTORY_INVALID")
}

const assertSourceReview = (root: string, ref: string, value: any) => {
  if (value?.sourceCommit !== REVIEWED_SOURCE_COMMIT || value?.reviewRoot !== REVIEWED_SOURCE_ROOT ||
      value?.findingCount !== 0 || value?.plan126Eligible !== true || value?.authorizesExecution !== false)
    fail("HISTORICAL_REVIEW_VERDICT")
  assertRooted(value, PLAN125_REVIEW_DOMAIN, "reviewRoot", "HISTORICAL_REVIEW_ROOT")
  if (!isAncestor(root, REVIEWED_SOURCE_COMMIT, ref)) fail("HISTORICAL_SOURCE_ANCESTRY")
  if (git(root, ["rev-parse", `${REVIEWED_SOURCE_COMMIT}^{tree}`]) !== value.sourceTree)
    fail("HISTORICAL_SOURCE_TREE")
  for (const entry of value.sourceFiles ?? []) {
    const line = git(root, ["ls-tree", REVIEWED_SOURCE_COMMIT, "--", entry.path])
    const match = /^(\d+) blob ([a-f0-9]{40})\t/u.exec(line)
    if (!match || match[1] !== entry.mode || match[2] !== entry.blob ||
        sha256(gitBytes(root, REVIEWED_SOURCE_COMMIT, entry.path)) !== entry.sha256)
      fail("HISTORICAL_SOURCE_BYTES")
  }
  return value
}

const assertReadiness = (value: any, review: any, historical: Inventory) => {
  if (value?.readinessRoot !== READINESS_ROOT || value?.reviewRoot !== review.reviewRoot ||
      value?.sourceCommit !== review.sourceCommit || value?.reviewedSourceEligible !== true ||
      value?.lifecycleMutationAuthorized !== false || value?.authorizesExecution !== false ||
      value?.assuranceLimitation !== LOCAL_SEAL_LIMITATION)
    fail("READINESS_CUSTODY")
  assertRooted(value, READINESS_DOMAIN, "readinessRoot", "READINESS_ROOT")
  if (canonical(value.requirementIds) !== canonical(REQUIREMENT_IDS) ||
      canonical(value.inventoryCounts) !== canonical(historical.counts) ||
      canonical(value.inventoryRoots) !== canonical(historical.roots))
    fail("READINESS_HISTORICAL_SNAPSHOT")
  assertAllFalse(value.authority, "READINESS_AUTHORITY")
  return value
}

export const assertDispositionProjection = (disposition: any, aggregate: any): any => {
  if (!exactKeys(disposition, [
      "aggregateRoot", "assuranceFindings", "assuranceLimitation", "assuranceStatus",
      "authority", "contamination", "counts", "dispositionRoot", "producerDisposition",
      "producerSucceeded", "reproductionPreserved", "schemaVersion", "status",
    ]) || forbiddenAggregateKeys(disposition).length !== 0 ||
      disposition?.schemaVersion !== "v1.38-plan-262-94-admission-disposition-v4" ||
      disposition?.aggregateRoot !== aggregate.aggregateRoot ||
      !Array.isArray(disposition?.assuranceFindings) || disposition.assuranceFindings.length !== 0 ||
      canonical(disposition?.counts) !== canonical(aggregate.counts) ||
      disposition?.assuranceLimitation !== LOCAL_SEAL_LIMITATION ||
      disposition?.status !== "non_pass" || disposition?.producerDisposition !== "exhausted" ||
      disposition?.producerSucceeded !== false || disposition?.assuranceStatus !== "clean" ||
      disposition?.contamination !== false || disposition?.reproductionPreserved !== false)
    fail("DISPOSITION_BRANCH")
  assertRooted(disposition, DISPOSITION_DOMAIN, "dispositionRoot", "DISPOSITION_ROOT")
  assertAllFalse(disposition.authority, "DISPOSITION_AUTHORITY")
  return disposition
}

const inspectAggregate = (aggregate: any, disposition: any) => {
  assertAggregateProjection(aggregate)
  const forbiddenProjectionKeys = forbiddenAggregateKeys(aggregate)
  if (aggregate?.schemaVersion !== "v1.38-plan-262-historical-live-receipt-manifest-v4" ||
      aggregate?.assuranceClass !== "single_operator_local_seal_v1" ||
      aggregate?.assuranceLimitation !== LOCAL_SEAL_LIMITATION ||
      aggregate?.independentCustodyClaimed !== false || aggregate?.generationsFungible !== false ||
      aggregate?.priorChargesReusable !== false)
    fail("AGGREGATE_SCHEMA")
  if (!exactKeys(aggregate.commitments, [
      "historicalRoot", "privateCustodyRoot", "journalRoot", "terminalRoot",
      "reproductionStateRoot", "protectedHistoryRoot",
    ]) || Object.values(aggregate.commitments).some((value) =>
      typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(value as string)) ||
      !exactKeys(aggregate.counts, [
        "generations", "routeStartsCharged", "preflightObservationsCharged",
        "calibrationIdentitiesCharged", "reproductionIdentitiesCharged",
        "freshAccepted", "requiredAccepted",
      ]) || !exactKeys(aggregate.counts.generations, ["v1", "v2", "v3", "v4"]) ||
      Object.values(aggregate.counts.generations).some((value) => !Number.isSafeInteger(value)) ||
      Object.entries(aggregate.counts).some(([key, value]) =>
        key !== "generations" && (!Number.isSafeInteger(value) || (value as number) < 0)))
    fail("AGGREGATE_SCHEMA")
  assertRooted(aggregate, AGGREGATE_DOMAIN, "aggregateRoot", "AGGREGATE_ROOT")
  assertAllFalse(aggregate.authority, "AGGREGATE_AUTHORITY")
  assertDispositionProjection(disposition, aggregate)
  return {
    aggregateRoot: aggregate.aggregateRoot,
    dispositionRoot: disposition.dispositionRoot,
    forbiddenProjectionKeys,
    independentCustodyClaimed: aggregate.independentCustodyClaimed,
    assuranceLimitation: aggregate.assuranceLimitation,
  }
}

const inspectCleanup = (root: string) => ({
  journalAbsent: kind(path.join(root, PATHS.journal)) === "absent",
  privateV4Absent: kind(path.join(root, PATHS.privateV4)) === "absent",
  emptyPrivateV3: kind(path.join(root, PATHS.privateV3)) === "directory" &&
    readdirSync(path.join(root, PATHS.privateV3)).length === 0,
  rootSuccessorLocks: readdirSync(root).filter((name) =>
    /^\.v138-successor-[a-f0-9]{64}\.lock$/u.test(name)).length,
})

export const assertCommittedAuditCarrier = (root: string, carrier: any): string => {
  if (carrier?.schemaVersion !== REVIEW_SCHEMA || carrier?.findingCount !== 0 ||
      carrier?.plan128Eligible !== true || carrier?.authorizesExecution !== false ||
      carrier?.phase263PlanningEligible !== false || carrier?.phase263ExecutionEligible !== false ||
      !/^[a-f0-9]{40}$/u.test(carrier?.sourceCommit ?? "") ||
      !/^[a-f0-9]{40}$/u.test(carrier?.sourceTree ?? "") ||
      !Array.isArray(carrier?.sourceFiles) || carrier.sourceFiles.length !== 2)
    fail("DEFAULT_AUDIT_CARRIER")
  assertRooted(carrier, REVIEW_DOMAIN, "reviewRoot", "DEFAULT_AUDIT_REVIEW_ROOT")
  if (!isAncestor(root, carrier.sourceCommit, "HEAD") ||
      git(root, ["rev-parse", `${carrier.sourceCommit}^{tree}`]) !== carrier.sourceTree)
    fail("DEFAULT_AUDIT_SOURCE")
  const expectedPaths = [PATHS.source, PATHS.tests].sort()
  if (canonical(carrier.sourceFiles.map((entry: any) => entry.path).sort()) !== canonical(expectedPaths))
    fail("DEFAULT_AUDIT_SOURCE_FILES")
  for (const entry of carrier.sourceFiles) {
    const match = /^(\d+) blob ([a-f0-9]{40})\t/u.exec(
      git(root, ["ls-tree", carrier.sourceCommit, "--", entry.path]),
    )
    if (!match || entry.mode !== match[1] || entry.blob !== match[2] ||
        entry.sha256 !== sha256(gitBytes(root, carrier.sourceCommit, entry.path)))
      fail("DEFAULT_AUDIT_SOURCE_FILES")
  }
  const publicationCommit = git(root, ["log", "-1", "--format=%H", "--", PATHS.reviewCarrier])
  const publicationParents = git(root, ["show", "-s", "--format=%P", publicationCommit])
    .split(/\s+/u).filter(Boolean)
  if (canonical(changedPaths(root, publicationCommit)) !==
      canonical([PATHS.reviewCarrier, PATHS.reviewReport, PATHS.summary127].sort()) ||
      publicationParents.length !== 1 || publicationParents[0] !== carrier.sourceCommit)
    fail("DEFAULT_AUDIT_PUBLICATION")
  for (const repoPath of [PATHS.reviewCarrier, PATHS.reviewReport, PATHS.summary127])
    if (!gitBytes(root, "HEAD", repoPath).equals(gitBytes(root, publicationCommit, repoPath)))
      fail("DEFAULT_AUDIT_PUBLICATION_BYTES")
  return carrier.sourceCommit
}

const defaultAuditRef = (root: string): string => {
  if (!pathExistsAt(root, "HEAD", PATHS.reviewCarrier)) return "HEAD"
  try {
    assertCommittedAuditCarrier(
      root,
      readJsonAt(root, "HEAD", PATHS.reviewCarrier),
    )
    return PLAN_106_COMMIT
  } catch {
    return "HEAD"
  }
}

export const auditFinalConvergence = async (root: string, ref?: string) => {
  const auditRef = ref ?? defaultAuditRef(root)
  const findings: string[] = []
  const inventory = inventoryAt(root, auditRef)
  const historicalInventory = deriveHistoricalInventory(inventory)
  const inventoryDelta = inventory.allPaths.filter((item) => !historicalInventory.allPaths.includes(item))
  const review = assertSourceReview(root, auditRef, readJsonAt(root, auditRef, PATHS.review125))
  const readiness = assertReadiness(readJsonAt(root, auditRef, PATHS.readiness126), review, historicalInventory)
  const lifecycle = readJsonAt(root, auditRef, PATHS.lifecycle106)
  assertRooted(lifecycle, LIFECYCLE_DOMAIN, "lifecycleRoot", "LIFECYCLE_ROOT")
  if (lifecycle?.branch !== "gaps" || lifecycle?.admit03 !== "blocked" ||
      lifecycle?.phase262 !== "incomplete" || lifecycle?.phase263PlanningEligible !== false ||
      lifecycle?.phase263ExecutionEligible !== false || lifecycle?.assuranceLimitation !== LOCAL_SEAL_LIMITATION ||
      canonical(lifecycle.inventoryCounts) !== canonical(historicalInventory.counts) ||
      canonical(lifecycle.inventoryRoots) !== canonical(historicalInventory.roots))
    fail("LIFECYCLE_HISTORICAL_SNAPSHOT")
  assertAllFalse(lifecycle.authority, "LIFECYCLE_AUTHORITY")
  if (changedPaths(root, PLAN_106_COMMIT).join("\n") !== [...PLAN_106_PATHS].sort().join("\n") ||
      !isAncestor(root, PLAN_106_COMMIT, auditRef))
    fail("PLAN106_ATOMIC_COMMIT")
  const requirementsText = gitBytes(root, auditRef, PATHS.requirements).toString("utf8")
  const requirementClassifications = classifyRequirements(requirementsText)
  const validation = gitBytes(root, auditRef, PATHS.validation).toString("utf8")
  const verification = gitBytes(root, auditRef, PATHS.verification).toString("utf8")
  assertStructuredProofCoverage(validation, verification, historicalInventory)
  const correction = readJsonAt(root, auditRef, PATHS.metadataCorrection)
  if (correction?.schemaVersion !== "v1.38-plan-262-121-summary-metadata-correction-v1" ||
      correction?.admit03CompletionCreditGranted !== false || correction?.admit03Status !== "blocked" ||
      correction?.authorizesExecution !== false || correction?.summaryPath !== PATHS.summary121 ||
      correction?.summarySha256 !== sha256(gitBytes(root, auditRef, PATHS.summary121)))
    fail("METADATA_CORRECTION")
  const aggregateBase = inspectAggregate(
    readJsonAt(root, auditRef, PATHS.aggregate),
    readJsonAt(root, auditRef, PATHS.disposition),
  )
  const terminal = readJsonAt(root, auditRef, PATHS.terminal)
  if (terminal?.schemaVersion !== "v1.38-current-matrix-retry-terminal-v4" ||
      terminal?.disposition !== "exhausted" || terminal?.freshAccepted !== 0 ||
      terminal?.completeCleanup !== true || terminal?.downstreamAuthority !== "denied")
    fail("TERMINAL_INVALID")
  const reproductionPresent = pathExistsAt(root, auditRef, PATHS.reproduction)
  const route12Present = pathExistsAt(root, auditRef, PATHS.route12)
  if (reproductionPresent || route12Present) fail("NONPASS_ARTIFACT_PRESENT")
  const cleanup = inspectCleanup(root)
  if (!cleanup.journalAbsent || !cleanup.privateV4Absent || !cleanup.emptyPrivateV3 || cleanup.rootSuccessorLocks !== 36)
    fail("CLEANUP_STATE")
  const aggregate = {
    ...aggregateBase,
    rawEvidenceRetired:
      cleanup.journalAbsent && cleanup.privateV4Absent && cleanup.emptyPrivateV3,
  }
  const dag = inspectDAG(root, auditRef, inventory)
  if (dag.duplicateIds.length || dag.missingDependencies.length || dag.cycles.length) fail("DAG_INVALID")
  return {
    findings,
    inventory,
    historicalInventory,
    inventoryDelta,
    dag,
    custody: {
      sourceCommit: review.sourceCommit,
      reviewRoot: review.reviewRoot,
      readinessRoot: readiness.readinessRoot,
      plan106Commit: PLAN_106_COMMIT,
      plan106Paths: changedPaths(root, PLAN_106_COMMIT),
    },
    branch: {
      name: "gaps" as const,
      producerDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      reproductionPresent,
      route12Present,
    },
    authority: FALSE_AUTHORITY,
    aggregate,
    cleanup,
    metadataCorrection: { valid: true, summarySha256: correction.summarySha256 },
    proofCoverage: { requirements: REQUIREMENT_IDS.length, inventoryPaths: inventory.allPaths.length },
    requirementClassifications,
  }
}

interface SourceFile {
  path: string
  mode: string
  blob: string
  sha256: Sha256
}
const frozenSourceCommit = (root: string): string =>
  git(root, ["log", "-1", "--format=%H", "--", PATHS.source])
const sourceFilesAt = (root: string, commit: string): SourceFile[] =>
  [PATHS.source, PATHS.tests].map((repoPath) => {
    const match = /^(\d+) blob ([a-f0-9]{40})\t/u.exec(git(root, ["ls-tree", commit, "--", repoPath]))
    const mode = match?.[1]
    const blob = match?.[2]
    if (!mode || !blob) fail("SOURCE_FILE_MISSING")
    return {
      path: repoPath,
      mode: mode as string,
      blob: blob as string,
      sha256: sha256(gitBytes(root, commit, repoPath)),
    }
  })

const buildReview = async (root: string) => {
  const sourceCommit = frozenSourceCommit(root)
  const audit = await auditFinalConvergence(root, PLAN_106_COMMIT)
  const body = {
    schemaVersion: REVIEW_SCHEMA,
    sourceCommit,
    sourceTree: git(root, ["rev-parse", `${sourceCommit}^{tree}`]),
    sourceFiles: sourceFilesAt(root, sourceCommit),
    findingCount: audit.findings.length,
    plan128Eligible: audit.findings.length === 0,
    authorizesExecution: false,
    branch: audit.branch.name,
    phase263PlanningEligible: false,
    phase263ExecutionEligible: false,
    inventoryCounts: audit.inventory.counts,
    inventoryRoots: audit.inventory.roots,
    historicalInventoryCounts: audit.historicalInventory.counts,
    historicalInventoryRoots: audit.historicalInventory.roots,
    inventoryDelta: audit.inventoryDelta,
    requirementIds: REQUIREMENT_IDS,
    dag: audit.dag,
    custody: audit.custody,
    aggregate: audit.aggregate,
    cleanup: audit.cleanup,
    authority: FALSE_AUTHORITY,
    nextAction: "dispatch-262-128-only",
  }
  const carrier = { ...body, reviewRoot: rooted(REVIEW_DOMAIN, body) }
  const report = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "127"\nfinding_count: ${carrier.findingCount}\nplan128_eligible: ${carrier.plan128Eligible}\nauthorizes_execution: false\nreview_root: ${carrier.reviewRoot}\nstatus: ${carrier.findingCount === 0 ? "clean" : "blocked"}\n---\n\n# Phase 262 Plan 127: Final Convergence Review\n\n## Verdict\n\n**${carrier.findingCount === 0 ? "LITERAL ZERO FINDINGS" : "BLOCKED"}.** Plan 128 is eligible only at literal zero. This review grants no Phase 263 planning or execution authority.\n\n## Gap Closure\n\nHistorical reviewed source \`${REVIEWED_SOURCE_COMMIT}\`, review root \`${REVIEWED_SOURCE_ROOT}\`, readiness root \`${READINESS_ROOT}\`, and atomic Plan 106 commit \`${PLAN_106_COMMIT}\` authenticate exactly. The readiness/lifecycle snapshot remains truthful at 120 summaries and 434 classified paths; current source-stage topology is derived independently as 121 summaries and 435 paths with the sole delta \`${PATHS.summary106}\`. This is checker self-reference closure, not an authority repair.\n\n## Convergence\n\n- DAG: ${audit.dag.nodeCount} nodes, ${audit.dag.edgeCount} edges, no missing dependencies or cycles.\n- Requirements: all ${REQUIREMENT_IDS.length} classified and covered.\n- Branch: exhausted, fresh 0/540, reproduction-v18 absent, Route-12 absent.\n- Aggregate: privacy-safe root/count projection only; raw v4 evidence retired.\n- Custody limitation: \`${LOCAL_SEAL_LIMITATION}\`; no independent or external custody claim.\n- Root successor locks preserved: ${audit.cleanup.rootSuccessorLocks}.\n\n## Findings\n\n${carrier.findingCount === 0 ? "None." : audit.findings.map((item) => `- ${item}`).join("\n")}\n\n## Authority\n\nAll authority remains false. The review makes only Plan 128 eligible and authorizes no execution.\n`
  const summary = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "127"\nsubsystem: final-convergence-review\ntags: [independent-review, aggregate-privacy, authority-separation, later-head]\nrequires:\n  - phase: 262-106\n    provides: atomic provisional lifecycle closeout\nprovides:\n  - literal-zero final convergence review\n  - reviewed Plan 128 and Plan 129 selectors\naffects: [262-128, 262-129]\ntech-stack:\n  added: []\n  patterns: [historical-snapshot-plus-exact-delta, committed-source review root, closed prospective writer]\nkey-files:\n  created:\n    - ${PATHS.source}\n    - ${PATHS.tests}\n    - ${PATHS.reviewCarrier}\n    - ${PATHS.reviewReport}\n    - ${PATHS.summary127}\nkey-decisions:\n  - "Treat the sole 262-106 summary delta as checker self-reference only after exact historical and atomic commit custody passes."\n  - "Publish findings and Plan 128 eligibility only; retain every Phase 263 and broader authority denial."\nrequirements-completed: []\nstatus: complete\n---\n\n# Phase 262 Plan 127: Final Convergence Review Summary\n\n**Independent convergence authenticates the historical reviewed snapshot plus the exact atomic Plan 106 summary delta, closing the self-reference gap with zero findings and no new authority.**\n\n## Result\n\n- Findings: **${carrier.findingCount}**\n- Plan 128 eligible: **${carrier.plan128Eligible}**\n- Authorizes execution: **false**\n- Phase 263 planning/execution eligible: **false/false**\n- Current topology: **${audit.inventory.counts.summaries} summaries / ${audit.inventory.counts.total} classified paths**\n- Historical readiness topology: **${audit.historicalInventory.counts.summaries} summaries / ${audit.historicalInventory.counts.total} classified paths**\n- Exact delta: \`${PATHS.summary106}\` only\n- Review root: \`${carrier.reviewRoot}\`\n\n## Verification\n\nThe focused suite covers the complete ${audit.dag.nodeCount}-node DAG, all 16 requirements, dynamic inventory, aggregate privacy, retired raw custody, atomic Plan 106 paths, Route-12 absence, Phase 263 false, invalid review gates, and prospective Plan 128/129 selectors. A separate read-only code review of the frozen source reported zero findings before publication.\n\n## Deviations from Plan\n\nNone - the verification gap was closed as exact historical-snapshot self-reference, with no lifecycle or tracking mutation.\n\n## Known Stubs\n\nNone. The Plan 128 writer and later-head selectors are intentionally dormant until their owning plans.\n\n## Threat Flags\n\nNone. The review consumes committed aggregate roots and counts only and exposes no receipt-level identity, path, key, or payload.\n\n## Authority and Next Action\n\nPlan 128 is the sole eligible successor. Phase 263 planning/execution and candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, release, and tag authority remain false.\n\n## Self-Check: PASSED\n\nThe exact frozen source/test, carrier, review report, and summary are present; later-HEAD review authentication passes from committed bytes.\n`
  return { carrier, report, summary, audit }
}

const containedTarget = (root: string, repoPath: string): string => {
  const target = path.resolve(root, repoPath)
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) fail("PATH_ESCAPE")
  return target
}
const exclusiveWrite = (root: string, repoPath: string, contents: string): void => {
  const target = containedTarget(root, repoPath)
  if (kind(target) !== "absent") fail("DESTINATION_EXISTS")
  mkdirSync(path.dirname(target), { recursive: true })
  const fd = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
    (constants.O_NOFOLLOW ?? 0), 0o644)
  try { writeFileSync(fd, contents) } finally { closeSync(fd) }
}

interface ReviewPublicationEntry {
  repoPath: string
  contents: string
}

export const publishReviewSet = (root: string, entries: ReviewPublicationEntry[]): void => {
  const expectedPaths = [PATHS.reviewCarrier, PATHS.reviewReport, PATHS.summary127].sort()
  if (canonical(entries.map((entry) => entry.repoPath).sort()) !== canonical(expectedPaths))
    fail("REVIEW_PUBLICATION_PATHS")
  const targets = entries.map((entry) => ({
    ...entry,
    target: containedTarget(root, entry.repoPath),
  }))
  const targetKinds = targets.map(({ target }) => kind(target))
  if (!targetKinds.every((value) => value === "absent") &&
      !targetKinds.every((value) => value === "file"))
    fail("REVIEW_REPLACEMENT_DRIFT")

  const replacing = targetKinds[0] === "file"
  const originals = new Map<string, Buffer | null>()
  for (const { repoPath, target } of targets) {
    const original = replacing ? readFileSync(target) : null
    originals.set(target, original)
    if (replacing && !original?.equals(gitBytes(root, "HEAD", repoPath)))
      fail("REVIEW_REPLACEMENT_DRIFT")
  }
  if (replacing)
    assertCommittedAuditCarrier(root, readJsonAt(root, "HEAD", PATHS.reviewCarrier))

  const prepared: Array<{ target: string; temporary: string }> = []
  try {
    for (const [index, { target, contents }] of targets.entries()) {
      mkdirSync(path.dirname(target), { recursive: true })
      const temporary = `${target}.plan127-${process.pid}-${index}.tmp`
      const fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
        (constants.O_NOFOLLOW ?? 0), 0o644)
      try {
        writeFileSync(fd, contents)
        fsyncSync(fd)
      } finally {
        closeSync(fd)
      }
      prepared.push({ target, temporary })
    }
    for (const item of prepared) renameSync(item.temporary, item.target)
  } catch (error) {
    for (const { target } of targets) {
      const original = originals.get(target)
      try {
        if (original === null) {
          if (kind(target) === "file") unlinkSync(target)
        } else if (original !== undefined) {
          writeFileSync(target, original)
        }
      } catch { /* preserve the original publication error */ }
    }
    throw error
  } finally {
    for (const { temporary } of prepared)
      if (kind(temporary) === "file") unlinkSync(temporary)
  }
}

export const assertFinalReviewGate = (value: any, expectedSourceCommit: string): any => {
  if (value === undefined || value === null) fail("REVIEW_MISSING")
  if (value.findingCount !== 0 || value.plan128Eligible !== true) fail("REVIEW_NOT_LITERAL_ZERO")
  if (value.authorizesExecution !== false) fail("REVIEW_AUTHORITY")
  if (value.sourceCommit !== expectedSourceCommit) fail("REVIEW_STALE")
  return value
}

const assertPublishedReviewAtCommit = async (root: string, publicationCommit: string) => {
  const expected = await buildReview(root)
  const actual = readJsonAt(root, publicationCommit, PATHS.reviewCarrier)
  assertFinalReviewGate(actual, expected.carrier.sourceCommit)
  if (canonical(actual) !== canonical(expected.carrier) ||
      gitBytes(root, publicationCommit, PATHS.reviewReport).toString("utf8") !== expected.report ||
      gitBytes(root, publicationCommit, PATHS.summary127).toString("utf8") !== expected.summary)
    fail("PUBLISHED_REVIEW_BYTES")
  assertRooted(actual, REVIEW_DOMAIN, "reviewRoot", "PUBLISHED_REVIEW_ROOT")
  if (canonical(changedPaths(root, publicationCommit)) !==
      canonical([PATHS.reviewCarrier, PATHS.reviewReport, PATHS.summary127].sort()) ||
      git(root, ["show", "-s", "--format=%P", publicationCommit]) !== expected.carrier.sourceCommit)
    fail("PUBLISHED_REVIEW_COMMIT")
  return { ...expected, publicationCommit }
}

const assertPublishedReview = async (root: string) => {
  const publicationCommit = git(root, ["log", "-1", "--format=%H", "--", PATHS.reviewCarrier])
  const expected = await assertPublishedReviewAtCommit(root, publicationCommit)
  for (const repoPath of [PATHS.reviewCarrier, PATHS.reviewReport, PATHS.summary127])
    if (!readFileSync(containedTarget(root, repoPath)).equals(gitBytes(root, publicationCommit, repoPath)))
      fail("PUBLISHED_REVIEW_NOT_COMMITTED")
  return expected
}

const appendMarker = (text: string, name: string, payload: unknown): string => {
  const open = `<!-- ${name}: `
  if (text.includes(open)) fail("TRACKING_MARKER_PRESENT")
  return `${text.trimEnd()}\n\n${open}${JSON.stringify(normalize(payload as Json))} -->\n`
}

export const assertTrackingUnchanged = (
  current: Record<string, string>,
  expected: Record<string, string>,
): true => {
  if (canonical(Object.keys(current).sort()) !== canonical(Object.keys(expected).sort()) ||
      Object.keys(expected).some((repoPath) => current[repoPath] !== expected[repoPath]))
    fail("LATER_HEAD_TRACKING_DRIFT")
  return true
}

const buildFinalProjection = async (root: string) => {
  const review = await assertPublishedReview(root)
  const branch = review.carrier.branch as "pass" | "gaps"
  const authority = projectFinalAuthority(branch)
  const currentInventory = inventoryAt(root, review.publicationCommit)
  const body = {
    schemaVersion: FINAL_SCHEMA,
    branch,
    admit03: branch === "pass" ? "complete" : "blocked",
    phase262: branch === "pass" ? "complete" : "incomplete",
    phase263PlanningEligible: branch === "pass",
    phase263ExecutionEligible: false,
    authority,
    convergenceReviewRoot: review.carrier.reviewRoot,
    convergenceReviewCommit: review.publicationCommit,
    lifecycleRoot: readJsonAt(root, review.publicationCommit, PATHS.lifecycle106).lifecycleRoot,
    readinessRoot: READINESS_ROOT,
    inventoryCounts: currentInventory.counts,
    inventoryRoots: currentInventory.roots,
    assuranceLimitation: LOCAL_SEAL_LIMITATION,
    nextAction: "dispatch-262-129-only",
  }
  const carrier = { ...body, eligibilityRoot: rooted(FINAL_DOMAIN, body) }
  const marker = {
    schemaVersion: "v1.38-plan-262-128-final-tracking-v1",
    branch,
    admit03: body.admit03,
    phase262: body.phase262,
    phase263PlanningEligible: body.phase263PlanningEligible,
    phase263ExecutionEligible: false,
    authority,
    convergenceReviewRoot: review.carrier.reviewRoot,
    inventoryCounts: currentInventory.counts,
    inventoryRoot: currentInventory.roots.all,
    nextAction: "dispatch-262-129-only",
  }
  const tracking = Object.fromEntries(
    [PATHS.requirements, PATHS.roadmap, PATHS.state].map((repoPath) => [
      repoPath,
      appendMarker(readFileSync(containedTarget(root, repoPath), "utf8"),
        "phase-262-plan-128-final-tracking", marker),
    ]),
  )
  const summary = `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "128"\nsubsystem: final-eligibility\nstatus: complete\nrequirements-completed: []\n---\n\n# Phase 262 Plan 128: Final Eligibility Projection Summary\n\n**Reviewed ${branch} projection published atomically after literal-zero Plan 127 convergence.**\n\n## Projection\n\n- ADMIT-03: ${body.admit03}\n- Phase 262: ${body.phase262}\n- Phase 263 planning eligible: ${body.phase263PlanningEligible}\n- Phase 263 execution eligible: false\n- Next action: Plan 262-129 only\n\n## Authority\n\nOnly Phase 263 planning may become eligible on exact pass. Every execution, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, release, and tag authority remains false.\n`
  return { carrier, tracking, summary, review }
}

const writeFinalProjection = async (root: string) => {
  if (git(root, ["status", "--porcelain", "--untracked-files=no"]) !== "") fail("FINAL_TRACKED_DRIFT")
  const projection = await buildFinalProjection(root)
  exclusiveWrite(root, PATHS.finalCarrier, canonical(projection.carrier))
  for (const [repoPath, contents] of Object.entries(projection.tracking))
    writeFileSync(containedTarget(root, repoPath), contents)
  exclusiveWrite(root, PATHS.summary128, projection.summary)
  return projection
}

const checkFinalProjection = async (root: string) => {
  const finalCommit = git(root, ["log", "-1", "--format=%H", "--", PATHS.finalCarrier])
  const carrier = readJsonAt(root, finalCommit, PATHS.finalCarrier)
  const reviewCommit = carrier?.convergenceReviewCommit
  if (!/^[a-f0-9]{40}$/u.test(reviewCommit ?? "") || !isAncestor(root, reviewCommit, finalCommit) ||
      canonical(changedPaths(root, finalCommit)) !== canonical(PLAN_128_PATHS))
    fail("FINAL_ATOMIC_COMMIT")
  const publishedReview = await assertPublishedReviewAtCommit(root, reviewCommit)
  const review = publishedReview.carrier
  assertRooted(carrier, FINAL_DOMAIN, "eligibilityRoot", "FINAL_ROOT")
  if (carrier.convergenceReviewRoot !== review.reviewRoot ||
      carrier.branch !== review.branch || carrier.phase263ExecutionEligible !== false ||
      carrier.phase263PlanningEligible !== (carrier.branch === "pass"))
    fail("FINAL_PROJECTION")
  const expectedAuthority = projectFinalAuthority(carrier.branch)
  if (canonical(carrier.authority) !== canonical(expectedAuthority)) fail("FINAL_AUTHORITY")
  for (const repoPath of [PATHS.requirements, PATHS.roadmap, PATHS.state]) {
    const text = gitBytes(root, finalCommit, repoPath).toString("utf8")
    if (!text.includes("phase-262-plan-128-final-tracking") ||
        !text.includes('"phase263ExecutionEligible":false')) fail("FINAL_TRACKING")
  }
  return { finalCommit, carrier, reviewCommit, review }
}

const checkLaterHead = async (root: string) => {
  const final = await checkFinalProjection(root)
  const anchorCommit = git(root, ["log", "-1", "--format=%H", "--", PATHS.anchor129])
  const parents = git(root, ["show", "-s", "--format=%P", anchorCommit]).split(" ").filter(Boolean)
  if (parents.length !== 1 || parents[0] !== final.finalCommit ||
      canonical(changedPaths(root, anchorCommit)) !== canonical([PATHS.anchor129]) ||
      !isAncestor(root, anchorCommit, "HEAD")) fail("LATER_HEAD_ANCHOR")
  const anchor = gitBytes(root, anchorCommit, PATHS.anchor129).toString("utf8")
  if (!anchor.includes(final.finalCommit) || !anchor.includes("grants no authority"))
    fail("LATER_HEAD_ANCHOR_BYTES")
  const sourceAudit = await auditFinalConvergence(root, PLAN_106_COMMIT)
  const currentInventory = inventoryAt(root, "HEAD")
  const currentDag = inspectDAG(root, "HEAD", currentInventory)
  const currentRequirementsText = gitBytes(root, "HEAD", PATHS.requirements).toString("utf8")
  const currentRequirements = classifyRequirements(currentRequirementsText)
  const currentValidation = gitBytes(root, "HEAD", PATHS.validation).toString("utf8")
  const currentVerification = gitBytes(root, "HEAD", PATHS.verification).toString("utf8")
  assertStructuredProofCoverage(
    currentValidation,
    currentVerification,
    sourceAudit.historicalInventory,
  )
  if (currentDag.duplicateIds.length || currentDag.missingDependencies.length || currentDag.cycles.length ||
      currentDag.nodeCount !== sourceAudit.dag.nodeCount ||
      Object.keys(currentRequirements).length !== REQUIREMENT_IDS.length)
    fail("LATER_HEAD_TOPOLOGY")
  const trackingPaths = [PATHS.requirements, PATHS.roadmap, PATHS.state]
  assertTrackingUnchanged(
    Object.fromEntries(trackingPaths.map((repoPath) => [
      repoPath, gitBytes(root, "HEAD", repoPath).toString("utf8"),
    ])),
    Object.fromEntries(trackingPaths.map((repoPath) => [
      repoPath, gitBytes(root, final.finalCommit, repoPath).toString("utf8"),
    ])),
  )
  const aggregateBase = inspectAggregate(
    readJsonAt(root, "HEAD", PATHS.aggregate),
    readJsonAt(root, "HEAD", PATHS.disposition),
  )
  const cleanup = inspectCleanup(root)
  const rawEvidenceRetired = cleanup.journalAbsent && cleanup.privateV4Absent && cleanup.emptyPrivateV3
  if (!rawEvidenceRetired || cleanup.rootSuccessorLocks !== 36 ||
      aggregateBase.forbiddenProjectionKeys.length !== 0 ||
      aggregateBase.aggregateRoot !== final.review.aggregate.aggregateRoot ||
      aggregateBase.dispositionRoot !== final.review.aggregate.dispositionRoot ||
      pathExistsAt(root, "HEAD", PATHS.reproduction) || pathExistsAt(root, "HEAD", PATHS.route12) ||
      !gitBytes(root, "HEAD", PATHS.lifecycle106).equals(
        gitBytes(root, final.review.sourceCommit, PATHS.lifecycle106)))
    fail("LATER_HEAD_AGGREGATE")
  return {
    verified: true,
    finalCommit: final.finalCommit,
    anchorCommit,
    branch: final.carrier.branch,
    phase263PlanningEligible: final.carrier.phase263PlanningEligible,
    phase263ExecutionEligible: false,
    authority: final.carrier.authority,
    aggregateRoot: aggregateBase.aggregateRoot,
    rawEvidenceRetired,
    inventoryCounts: currentInventory.counts,
    inventoryRoots: currentInventory.roots,
    dag: currentDag,
    requirementClassifications: currentRequirements,
    cleanup,
  }
}

const writeReview = async (root: string) => {
  const review = await buildReview(root)
  publishReviewSet(root, [
    { repoPath: PATHS.reviewCarrier, contents: canonical(review.carrier) },
    { repoPath: PATHS.reviewReport, contents: review.report },
    { repoPath: PATHS.summary127, contents: review.summary },
  ])
  return review
}

const main = async (): Promise<void> => {
  const root = process.cwd()
  const selector = process.argv[2]
  if (selector === "--audit") {
    process.stdout.write(canonical(await auditFinalConvergence(root)))
    return
  }
  if (selector === "--write-review") {
    const review = await writeReview(root)
    process.stdout.write(canonical({
      findingCount: review.carrier.findingCount,
      plan128Eligible: review.carrier.plan128Eligible,
      authorizesExecution: false,
      reviewRoot: review.carrier.reviewRoot,
    }))
    return
  }
  if (selector === "--check-review") {
    const review = await assertPublishedReview(root)
    process.stdout.write(canonical({
      findingCount: review.carrier.findingCount,
      plan128Eligible: review.carrier.plan128Eligible,
      authorizesExecution: false,
      reviewRoot: review.carrier.reviewRoot,
    }))
    return
  }
  if (selector === "--write-final-projection") {
    const projection = await writeFinalProjection(root)
    process.stdout.write(canonical({ branch: projection.carrier.branch, authority: false }))
    return
  }
  if (selector === "--check-final-projection") {
    process.stdout.write(canonical(await checkFinalProjection(root)))
    return
  }
  if (selector === "--check-later-head") {
    process.stdout.write(canonical(await checkLaterHead(root)))
    return
  }
  fail("SELECTOR_INVALID")
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  await main()
