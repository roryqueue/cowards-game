#!/usr/bin/env -S node --import tsx
import { execFileSync } from "node:child_process"
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { checkV138InactiveRetryV4Envelope } from "./lib/v1-38-bounded-retry-envelope-v4.js"
import { authenticateV138LiveV15ImmutableCustody } from "./run-v1-38-bounded-retry-envelope-v4-live-v15.js"
import { checkV138PublishedRetryV4OutcomeWithEnvelope } from "./run-v1-38-bounded-retry-envelope-v4.js"

type Sha256 = `sha256:${string}`
type GitObject = string
type Bytes = Uint8Array
type Material = Readonly<{
  historical: readonly Bytes[]
  receipts: readonly Bytes[]
  journal: Bytes
  terminal: Bytes
  reproduction: Bytes | null
  protectedHistory: readonly Bytes[]
}>
type AggregateCounts = Readonly<{
  generations: Readonly<{ v1: number; v2: number; v3: number; v4: number }>
  routeStartsCharged: number
  preflightObservationsCharged: number
  calibrationIdentitiesCharged: number
  reproductionIdentitiesCharged: number
  freshAccepted: number
  requiredAccepted: 540
}>
type ProducerDisposition = "exhausted" | "failed" | "succeeded"
export type V138Plan26294BranchInput = Readonly<{
  producerDisposition: ProducerDisposition
  freshAccepted: number
  requiredAccepted: 540
  reproductionPresent: boolean
  assuranceFindings: readonly string[]
  contamination: boolean
  route12Present?: boolean
}>
type SourceFile = Readonly<{
  path: string
  mode: "100644" | "100755"
  blob: GitObject
  sha256: Sha256
}>
type ReviewBody = Readonly<{
  schemaVersion: "v1.38-plan-262-123-admission-source-review-v1"
  sourceCommit: GitObject
  sourceTree: GitObject
  sourceFiles: readonly SourceFile[]
  aggregateManifestSha256: Sha256
  findingCount: 0
  plan124Eligible: true
  authorizesExecution: false
}>
export type V138Plan262123Review = ReviewBody & Readonly<{ reviewRoot: Sha256 }>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const IMPLEMENTATION_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
export const V138_PLAN_262_94_PATHS = Object.freeze({
  self: "scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.ts",
  test: "scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.test.ts",
  plan123Review: ".planning/artifacts/v1.38-plan-262-123-admission-source-review-v1.json",
  aggregate: ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v4.json",
  disposition: ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v4.json",
  correction: ".planning/artifacts/v1.38-phase-262-review-fix-correction-v12.json",
  route12: ".planning/artifacts/v1.38-plan-262-route-12-activation-v1.json",
  envelope: ".planning/artifacts/v1.38-plan-262-145-retry-envelope-v4.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v4.jsonl",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v4",
  key: ".planning/artifacts/v1.38-current-matrix-retry-private-v4/plan-262-94-aggregate-blinding-key-v1.bin",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v4.json",
  reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v18.json",
  historicalV1: ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v1.json",
  historicalV2: ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v2.json",
  failedPlan110Summary: `${PHASE}/262-110-SUMMARY.md`,
  failedPlan110Review: `${PHASE}/262-110-FAILURE-REVIEW.md`,
})

const DOMAINS = Object.freeze({
  aggregate: "v1.38:plan-262-94:aggregate-manifest:v4",
  historical: "v1.38:plan-262-94:keyed-history:v4",
  custody: "v1.38:plan-262-94:keyed-private-custody:v4",
  journal: "v1.38:plan-262-94:keyed-journal:v4",
  terminal: "v1.38:plan-262-94:keyed-terminal:v4",
  reproduction: "v1.38:plan-262-94:keyed-reproduction-state:v4",
  protectedHistory: "v1.38:plan-262-94:keyed-protected-history:v4",
  review: "v1.38:plan-262-123:admission-source-review:v1",
  disposition: "v1.38:plan-262-94:admission-disposition:v4",
  correction: "v1.38:phase-262:review-fix-correction:v12",
  route12: "v1.38:plan-262:route-12-activation:v1",
})

const fail = (code: string): never => { throw new TypeError(`V138_PLAN_262_94_${code}`) }
const normalize = (value: any): any => Array.isArray(value)
  ? value.map(normalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
    : value
const canonical = (value: unknown): string => `${JSON.stringify(normalize(value))}\n`
const sha256 = (value: string | Bytes): Sha256 => `sha256:${createHash("sha256").update(value).digest("hex")}`
const isSha = (value: unknown): value is Sha256 => typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value)
const isGit = (value: unknown): value is GitObject => typeof value === "string" && /^[0-9a-f]{40}$/.test(value)
const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null &&
  typeof value === "object" && !Array.isArray(value) && canonical(Object.keys(value as object).sort()) === canonical([...keys].sort())
const rootWithout = (domain: string, value: any, key: string): Sha256 => {
  const body = structuredClone(value)
  delete body[key]
  return sha256(`${domain}\0${canonical(body)}`)
}
const keyed = (key: Bytes, domain: string, chunks: readonly Bytes[]): Sha256 => {
  if (key.byteLength !== 32) fail("BLINDING_KEY_INVALID")
  const mac = createHmac("sha256", key)
  mac.update(`${domain}\0`)
  for (const bytes of chunks) {
    const length = Buffer.allocUnsafe(8)
    length.writeBigUInt64BE(BigInt(bytes.byteLength))
    mac.update(length)
    mac.update(bytes)
  }
  return `sha256:${mac.digest("hex")}`
}
const freeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !ArrayBuffer.isView(value) && !Object.isFrozen(value)) {
    for (const child of Object.values(value as object)) freeze(child)
    Object.freeze(value)
  }
  return value
}
const FALSE_AUTHORITY = freeze({
  foundationActivationAuthorized: false,
  phase263PlanningAuthorized: false,
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
})

const assertCounts = (counts: AggregateCounts): void => {
  if (!exactKeys(counts, ["generations", "routeStartsCharged", "preflightObservationsCharged", "calibrationIdentitiesCharged",
    "reproductionIdentitiesCharged", "freshAccepted", "requiredAccepted"]) ||
    !exactKeys(counts.generations, ["v1", "v2", "v3", "v4"]) || counts.requiredAccepted !== 540 ||
    [...Object.values(counts.generations), counts.routeStartsCharged, counts.preflightObservationsCharged,
      counts.calibrationIdentitiesCharged, counts.reproductionIdentitiesCharged, counts.freshAccepted]
      .some(value => !Number.isSafeInteger(value) || value < 0)) fail("AGGREGATE_COUNTS_INVALID")
}

export const buildV138Plan26294Aggregate = (key: Bytes, material: Material, counts: AggregateCounts) => {
  assertCounts(counts)
  const body = {
    schemaVersion: "v1.38-plan-262-historical-live-receipt-manifest-v4" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    assuranceLimitation: "single_operator_local_seal_v1_no_hostile_same_uid" as const,
    independentCustodyClaimed: false as const,
    generationsFungible: false as const,
    priorChargesReusable: false as const,
    counts: structuredClone(counts),
    commitments: {
      historicalRoot: keyed(key, DOMAINS.historical, material.historical),
      privateCustodyRoot: keyed(key, DOMAINS.custody, material.receipts),
      journalRoot: keyed(key, DOMAINS.journal, [material.journal]),
      terminalRoot: keyed(key, DOMAINS.terminal, [material.terminal]),
      reproductionStateRoot: keyed(key, DOMAINS.reproduction,
        material.reproduction === null ? [Buffer.from("absent", "utf8")] : [Buffer.from("present", "utf8"), material.reproduction]),
      protectedHistoryRoot: keyed(key, DOMAINS.protectedHistory, material.protectedHistory),
    },
    authority: FALSE_AUTHORITY,
  }
  return freeze({ ...body, aggregateRoot: sha256(`${DOMAINS.aggregate}\0${canonical(body)}`) })
}

const AGGREGATE_KEYS = ["schemaVersion", "assuranceClass", "assuranceLimitation", "independentCustodyClaimed",
  "generationsFungible", "priorChargesReusable", "counts", "commitments", "authority", "aggregateRoot"] as const
const forbiddenProjectionKey = (key: string): boolean => /(?:^|_)(?:path|filename|payload|bytes?|length|ordinal|identity|handle)(?:$|_)/i.test(key) ||
  /receipt(?:hash|root|path|id|identity|handle|payload|bytes|length|ordinal)/i.test(key)
const scanForbidden = (value: unknown, trail: string[] = []): string[] => {
  if (Array.isArray(value)) return value.flatMap((child, index) => scanForbidden(child, [...trail, String(index)]))
  if (value === null || typeof value !== "object") return []
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
    ...(forbiddenProjectionKey(key) ? [[...trail, key].join(".")] : []),
    ...scanForbidden(child, [...trail, key]),
  ])
}

export const validateV138Plan26294Aggregate = (value: unknown): ReturnType<typeof buildV138Plan26294Aggregate> => {
  if (!exactKeys(value, AGGREGATE_KEYS)) fail("AGGREGATE_SCHEMA_INVALID")
  const v = value as any
  if (v.schemaVersion !== "v1.38-plan-262-historical-live-receipt-manifest-v4" ||
    v.assuranceClass !== "single_operator_local_seal_v1" ||
    v.assuranceLimitation !== "single_operator_local_seal_v1_no_hostile_same_uid" ||
    v.independentCustodyClaimed !== false || v.generationsFungible !== false || v.priorChargesReusable !== false ||
    !exactKeys(v.commitments, ["historicalRoot", "privateCustodyRoot", "journalRoot", "terminalRoot", "reproductionStateRoot", "protectedHistoryRoot"]) ||
    Object.values(v.commitments).some(root => !isSha(root)) ||
    !exactKeys(v.authority, Object.keys(FALSE_AUTHORITY)) || Object.values(v.authority).some(flag => flag !== false) ||
    scanForbidden(v).length !== 0 || !isSha(v.aggregateRoot) ||
    v.aggregateRoot !== rootWithout(DOMAINS.aggregate, v, "aggregateRoot")) fail("AGGREGATE_SCHEMA_INVALID")
  assertCounts(v.counts)
  return freeze(v)
}

export const verifyV138Plan26294PrivateAggregate = (aggregate: unknown, key: Bytes, material: Material, counts: AggregateCounts): true => {
  const validated = validateV138Plan26294Aggregate(aggregate)
  const expected = buildV138Plan26294Aggregate(key, material, counts)
  const left = Buffer.from(canonical(validated))
  const right = Buffer.from(canonical(expected))
  if (left.byteLength !== right.byteLength || !timingSafeEqual(left, right)) fail("PRIVATE_AGGREGATE_MISMATCH")
  return true
}

export const deriveV138Plan26294Disposition = (input: V138Plan26294BranchInput) => {
  if (!exactKeys(input, ["producerDisposition", "freshAccepted", "requiredAccepted", "reproductionPresent", "assuranceFindings",
    "contamination", ...(Object.prototype.hasOwnProperty.call(input, "route12Present") ? ["route12Present"] : [])]) ||
    !["exhausted", "failed", "succeeded"].includes(input.producerDisposition) || input.requiredAccepted !== 540 ||
    !Number.isSafeInteger(input.freshAccepted) || input.freshAccepted < 0 || input.freshAccepted > 540 ||
    !Array.isArray(input.assuranceFindings) || input.assuranceFindings.some(finding => typeof finding !== "string" || !/^[A-Z0-9_]+$/.test(finding)) ||
    typeof input.contamination !== "boolean" || typeof input.reproductionPresent !== "boolean") fail("BRANCH_INPUT_INVALID")
  const producerSucceeded = input.producerDisposition === "succeeded" && input.freshAccepted === 540
  if (producerSucceeded !== input.reproductionPresent) fail("PRODUCER_REPRODUCTION_MISMATCH")
  const assuranceInvalid = input.contamination || input.assuranceFindings.length > 0
  const status = producerSucceeded && !assuranceInvalid ? "pass" as const : "non_pass" as const
  if (status === "non_pass" && input.route12Present === true) fail("NONPASS_ROUTE12_PRESENT")
  return freeze({
    status,
    producerDisposition: input.producerDisposition,
    producerSucceeded,
    assuranceStatus: assuranceInvalid ? "non_pass" as const : "clean" as const,
    assuranceFindings: [...input.assuranceFindings].sort(),
    contamination: input.contamination,
    preserveReproduction: producerSucceeded,
    writeCorrection: assuranceInvalid,
    writeRoute12: status === "pass",
    downstreamAuthority: status === "pass" ? "route_12_only" as const : "denied" as const,
  })
}

export const computeV138Plan262123ReviewRoot = (body: ReviewBody): Sha256 => sha256(`${DOMAINS.review}\0${canonical(body)}`)
export const validateV138Plan262123Review = (value: unknown): V138Plan262123Review => {
  if (!exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "sourceFiles", "aggregateManifestSha256",
    "findingCount", "plan124Eligible", "authorizesExecution", "reviewRoot"])) fail("PLAN123_REVIEW_INVALID")
  const v = value as any
  if (v.schemaVersion !== "v1.38-plan-262-123-admission-source-review-v1" || !isGit(v.sourceCommit) || !isGit(v.sourceTree) ||
    !Array.isArray(v.sourceFiles) || v.sourceFiles.length !== 2 || !isSha(v.aggregateManifestSha256) || v.findingCount !== 0 ||
    v.plan124Eligible !== true || v.authorizesExecution !== false || !isSha(v.reviewRoot)) fail("PLAN123_REVIEW_INVALID")
  const paths = new Set<string>()
  for (const source of v.sourceFiles) {
    if (!exactKeys(source, ["path", "mode", "blob", "sha256"]) || ![V138_PLAN_262_94_PATHS.self, V138_PLAN_262_94_PATHS.test].includes(source.path) ||
      paths.has(source.path) || !["100644", "100755"].includes(source.mode) || !isGit(source.blob) || !isSha(source.sha256)) fail("PLAN123_REVIEW_INVALID")
    paths.add(source.path)
  }
  if (v.reviewRoot !== rootWithout(DOMAINS.review, v, "reviewRoot")) fail("PLAN123_REVIEW_INVALID")
  return freeze(v)
}

type ExpectedReviewSubject = Readonly<Pick<ReviewBody, "sourceCommit" | "sourceTree" | "sourceFiles" | "aggregateManifestSha256">>
export const planV138Plan26294ReviewedWrites = (reviewValue: unknown, expected: ExpectedReviewSubject,
  branchInput: V138Plan26294BranchInput): readonly string[] => {
  const review = validateV138Plan262123Review(reviewValue)
  if (canonical({ sourceCommit: review.sourceCommit, sourceTree: review.sourceTree, sourceFiles: review.sourceFiles,
    aggregateManifestSha256: review.aggregateManifestSha256 }) !== canonical(expected)) fail("PLAN123_REVIEW_SUBJECT_MISMATCH")
  const branch = deriveV138Plan26294Disposition(branchInput)
  return freeze([V138_PLAN_262_94_PATHS.disposition,
    ...(branch.writeCorrection ? [V138_PLAN_262_94_PATHS.correction] : []),
    ...(branch.writeRoute12 ? [V138_PLAN_262_94_PATHS.route12] : []),
  ])
}

const relativePath = (value: string): boolean => !path.isAbsolute(value) && value.length > 0 && !value.split("/").some(part => part === "" || part === "." || part === "..")
const rootOf = (rootInput: string): string => {
  const root = realpathSync(path.resolve(rootInput))
  const stat = lstatSync(root)
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail("ROOT_INVALID")
  return root
}
const resolveContained = (root: string, repoPath: string): string => {
  if (!relativePath(repoPath)) fail("PATH_UNSAFE")
  const target = path.resolve(root, repoPath)
  if (!target.startsWith(`${root}${path.sep}`)) fail("PATH_UNSAFE")
  return target
}
type Kind = "absent" | "file" | "directory" | "unsafe"
const kind = (root: string, repoPath: string): Kind => {
  const target = resolveContained(root, repoPath)
  let current = root
  for (const [index, part] of path.relative(root, target).split(path.sep).entries()) {
    current = path.join(current, part)
    try {
      const stat = lstatSync(current)
      if (stat.isSymbolicLink()) return "unsafe"
      if (index < path.relative(root, target).split(path.sep).length - 1 && !stat.isDirectory()) return "unsafe"
      if (index === path.relative(root, target).split(path.sep).length - 1) return stat.isFile() ? "file" : stat.isDirectory() ? "directory" : "unsafe"
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"; throw error }
  }
  return "unsafe"
}
const readRegular = (root: string, repoPath: string, maximum = 64 * 1024 * 1024): Buffer => {
  if (kind(root, repoPath) !== "file") fail("REGULAR_FILE_REQUIRED")
  const target = resolveContained(root, repoPath)
  const before = lstatSync(target)
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(fd)
    if (opened.dev !== before.dev || opened.ino !== before.ino || opened.size > maximum || (opened.mode & 0o022) !== 0) fail("FILE_UNSAFE")
    const bytes = readFileSync(fd)
    const after = fstatSync(fd)
    if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs) fail("FILE_CHANGED")
    return bytes
  } finally { closeSync(fd) }
}
const parseJson = (bytes: Bytes): any => { try { return JSON.parse(Buffer.from(bytes).toString("utf8")) } catch { return fail("JSON_INVALID") } }
const git = (root: string, args: readonly string[]): string => execFileSync("/usr/bin/git", ["-C", root, "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false", ...args], { encoding: "utf8", env: { PATH: "/usr/bin:/bin", HOME: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_REPLACE_OBJECTS: "1", GIT_TERMINAL_PROMPT: "0" }, timeout: 30_000, maxBuffer: 32 * 1024 * 1024 }).trim()
const gitBytes = (root: string, args: readonly string[]): Buffer => execFileSync("/usr/bin/git", ["-C", root, "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false", ...args], { env: { PATH: "/usr/bin:/bin", HOME: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null", GIT_NO_REPLACE_OBJECTS: "1", GIT_TERMINAL_PROMPT: "0" }, timeout: 30_000, maxBuffer: 32 * 1024 * 1024 })

const fsyncParent = (target: string): void => {
  const fd = openSync(path.dirname(target), constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
  try { fsyncSync(fd) } finally { closeSync(fd) }
}
const exclusiveWrite = (root: string, repoPath: string, bytes: Bytes, mode: number): void => {
  if (kind(root, repoPath) !== "absent") fail("DESTINATION_PRESENT")
  const target = resolveContained(root, repoPath)
  const fd = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, mode)
  try { writeSync(fd, bytes); fchmodSync(fd, mode); fsyncSync(fd) } finally { closeSync(fd) }
  fsyncParent(target)
}

const exactPrivateNames = (journalCount: number): string[] => [
  "corrected-invocation-v1.json", "journal-bootstrap.commit", "terminal-only.commit",
  ...Array.from({ length: journalCount }, (_, index) => `journal-record-${String(index).padStart(4, "0")}.json`),
  path.basename(V138_PLAN_262_94_PATHS.key),
].sort()
const readPrivateMaterial = (root: string, expectedRecords: number, requireKey = true) => {
  if (kind(root, V138_PLAN_262_94_PATHS.privateDir) !== "directory" || (statSync(resolveContained(root, V138_PLAN_262_94_PATHS.privateDir)).mode & 0o777) !== 0o700)
    fail("PRIVATE_DIRECTORY_INVALID")
  const names = readdirSync(resolveContained(root, V138_PLAN_262_94_PATHS.privateDir)).sort()
  const expected = exactPrivateNames(expectedRecords)
  const withoutKey = names.filter(name => name !== path.basename(V138_PLAN_262_94_PATHS.key))
  const expectedWithoutKey = expected.filter(name => name !== path.basename(V138_PLAN_262_94_PATHS.key))
  if (canonical(requireKey ? names : withoutKey) !== canonical(requireKey ? expected : expectedWithoutKey)) fail("PRIVATE_POSTSTATE_INVALID")
  const receipts = Array.from({ length: expectedRecords }, (_, index) => {
    const repoPath = `${V138_PLAN_262_94_PATHS.privateDir}/journal-record-${String(index).padStart(4, "0")}.json`
    const bytes = readRegular(root, repoPath)
    if ((statSync(resolveContained(root, repoPath)).mode & 0o777) !== 0o600) fail("PRIVATE_FILE_MODE_INVALID")
    return bytes
  })
  const key = requireKey ? readRegular(root, V138_PLAN_262_94_PATHS.key, 32) : null
  if (key !== null && ((statSync(resolveContained(root, V138_PLAN_262_94_PATHS.key)).mode & 0o777) !== 0o600 || key.byteLength !== 32)) fail("BLINDING_KEY_INVALID")
  return { receipts, key }
}

const actualMaterialAndCounts = (rootInput: string, requireKey = true) => {
  const root = rootOf(rootInput)
  authenticateV138LiveV15ImmutableCustody(root)
  const envelope = checkV138InactiveRetryV4Envelope(parseJson(readRegular(root, V138_PLAN_262_94_PATHS.envelope)))
  const outcome = checkV138PublishedRetryV4OutcomeWithEnvelope(root, envelope)
  const journal = readRegular(root, V138_PLAN_262_94_PATHS.journal)
  const lines = journal.toString("utf8").trim().split("\n").filter(Boolean)
  if (lines.length === 0) fail("JOURNAL_EMPTY")
  const local = readPrivateMaterial(root, lines.length, requireKey)
  const terminal = readRegular(root, V138_PLAN_262_94_PATHS.terminal)
  const reproduction = kind(root, V138_PLAN_262_94_PATHS.reproduction) === "file" ? readRegular(root, V138_PLAN_262_94_PATHS.reproduction) : null
  if ((outcome.disposition === "succeeded") !== (reproduction !== null)) fail("PRODUCER_REPRODUCTION_MISMATCH")
  const terminalValue = parseJson(terminal)
  const material: Material = {
    historical: [readRegular(root, V138_PLAN_262_94_PATHS.historicalV1), readRegular(root, V138_PLAN_262_94_PATHS.historicalV2)],
    receipts: local.receipts,
    journal,
    terminal,
    reproduction,
    protectedHistory: [readRegular(root, V138_PLAN_262_94_PATHS.failedPlan110Summary), readRegular(root, V138_PLAN_262_94_PATHS.failedPlan110Review)],
  }
  const counts: AggregateCounts = {
    generations: { v1: 15, v2: 15, v3: 0, v4: local.receipts.length },
    routeStartsCharged: 6 + terminalValue.counters.routeStartsConsumed,
    preflightObservationsCharged: 6 + terminalValue.counters.preflightObservationsConsumed,
    calibrationIdentitiesCharged: 48 + terminalValue.counters.calibrationIdentitiesCharged,
    reproductionIdentitiesCharged: terminalValue.counters.reproductionIdentitiesCharged,
    freshAccepted: terminalValue.freshAccepted,
    requiredAccepted: 540,
  }
  const branch: V138Plan26294BranchInput = {
    producerDisposition: outcome.disposition,
    freshAccepted: terminalValue.freshAccepted,
    requiredAccepted: 540,
    reproductionPresent: reproduction !== null,
    assuranceFindings: [],
    contamination: false,
  }
  return freeze({ root, material, counts, key: local.key, branch, outcome })
}

export const createV138Plan26294BlindingKey = (rootInput: string): true => {
  const root = rootOf(rootInput)
  readPrivateMaterial(root, 15, false)
  exclusiveWrite(root, V138_PLAN_262_94_PATHS.key, randomBytes(32), 0o600)
  readPrivateMaterial(root, 15, true)
  return true
}

export const writeV138Plan26294Aggregate = (rootInput: string) => {
  const root = rootOf(rootInput)
  if (kind(root, V138_PLAN_262_94_PATHS.key) === "absent") createV138Plan26294BlindingKey(root)
  const actual = actualMaterialAndCounts(root, true)
  const aggregate = buildV138Plan26294Aggregate(actual.key!, actual.material, actual.counts)
  exclusiveWrite(root, V138_PLAN_262_94_PATHS.aggregate, Buffer.from(canonical(aggregate)), 0o644)
  return aggregate
}

export const checkV138Plan26294PublicAggregate = (rootInput: string) => {
  const root = rootOf(rootInput)
  return validateV138Plan26294Aggregate(parseJson(readRegular(root, V138_PLAN_262_94_PATHS.aggregate)))
}

export const checkV138Plan26294PrivateAggregate = (rootInput: string): true => {
  const actual = actualMaterialAndCounts(rootInput, true)
  return verifyV138Plan26294PrivateAggregate(checkV138Plan26294PublicAggregate(actual.root), actual.key!, actual.material, actual.counts)
}

const currentReviewSubject = (root: string, review: V138Plan262123Review): ExpectedReviewSubject => {
  try { execFileSync("/usr/bin/git", ["-C", root, "merge-base", "--is-ancestor", review.sourceCommit, "HEAD"], { stdio: "ignore" }) }
  catch { return fail("PLAN123_REVIEW_LINEAGE_INVALID") }
  if (git(root, ["rev-parse", `${review.sourceCommit}^{tree}`]) !== review.sourceTree) fail("PLAN123_SOURCE_TREE_INVALID")
  const sourceFiles = [V138_PLAN_262_94_PATHS.self, V138_PLAN_262_94_PATHS.test].map(repoPath => {
    const line = git(root, ["ls-tree", review.sourceCommit, "--", repoPath])
    const match = line.match(/^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/)
    if (!match || match[3] !== repoPath) fail("PLAN123_SOURCE_FILE_INVALID")
    const committed = gitBytes(root, ["show", `${review.sourceCommit}:${repoPath}`])
    const working = readRegular(root, repoPath)
    if (!committed.equals(working)) fail("PLAN123_SOURCE_WORKTREE_CHANGED")
    return { path: repoPath, mode: match[1] as SourceFile["mode"], blob: match[2]!, sha256: sha256(committed) }
  })
  return freeze({ sourceCommit: review.sourceCommit, sourceTree: review.sourceTree, sourceFiles,
    aggregateManifestSha256: sha256(readRegular(root, V138_PLAN_262_94_PATHS.aggregate)) })
}
const readCommittedReview = (root: string): V138Plan262123Review => {
  const review = validateV138Plan262123Review(parseJson(readRegular(root, V138_PLAN_262_94_PATHS.plan123Review)))
  const commit = git(root, ["log", "-1", "--format=%H", "HEAD", "--", V138_PLAN_262_94_PATHS.plan123Review])
  if (!isGit(commit) || !gitBytes(root, ["show", `${commit}:${V138_PLAN_262_94_PATHS.plan123Review}`]).equals(readRegular(root, V138_PLAN_262_94_PATHS.plan123Review)))
    fail("PLAN123_REVIEW_NOT_COMMITTED")
  return review
}

const artifactWithRoot = (domain: string, body: Record<string, unknown>, rootKey: string) => freeze({ ...body, [rootKey]: sha256(`${domain}\0${canonical(body)}`) })
const buildReviewedArtifacts = (aggregate: any, branchInput: V138Plan26294BranchInput) => {
  const branch = deriveV138Plan26294Disposition(branchInput)
  const disposition = artifactWithRoot(DOMAINS.disposition, {
    schemaVersion: "v1.38-plan-262-94-admission-disposition-v4",
    status: branch.status,
    producerDisposition: branch.producerDisposition,
    producerSucceeded: branch.producerSucceeded,
    assuranceStatus: branch.assuranceStatus,
    assuranceFindings: branch.assuranceFindings,
    contamination: branch.contamination,
    reproductionPreserved: branch.preserveReproduction,
    aggregateRoot: aggregate.aggregateRoot,
    counts: aggregate.counts,
    assuranceLimitation: aggregate.assuranceLimitation,
    authority: branch.status === "pass" ? { ...FALSE_AUTHORITY, foundationActivationAuthorized: true, phase263PlanningAuthorized: true } : FALSE_AUTHORITY,
  }, "dispositionRoot")
  const correction = branch.writeCorrection ? artifactWithRoot(DOMAINS.correction, {
    schemaVersion: "v1.38-phase-262-review-fix-correction-v12",
    status: "integrity_non_pass",
    assuranceFindings: branch.assuranceFindings,
    contamination: branch.contamination,
    producerOutcomePreserved: true,
    reproductionPreserved: branch.preserveReproduction,
    dispositionRoot: disposition.dispositionRoot,
    authority: FALSE_AUTHORITY,
  }, "correctionRoot") : null
  const route12 = branch.writeRoute12 ? artifactWithRoot(DOMAINS.route12, {
    schemaVersion: "v1.38-plan-262-route-12-activation-v1",
    dispositionRoot: disposition.dispositionRoot,
    aggregateRoot: aggregate.aggregateRoot,
    freshAccepted: 540,
    requiredAccepted: 540,
    assuranceLimitation: aggregate.assuranceLimitation,
    phase263PlanningAuthorized: true,
    phase263ExecutionAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productionAuthorized: false,
  }, "route12Root") : null
  return freeze({ branch, disposition, correction, route12 })
}

export const writeV138Plan26294ReviewedArtifacts = (rootInput: string) => {
  const actual = actualMaterialAndCounts(rootInput, true)
  const aggregate = checkV138Plan26294PublicAggregate(actual.root)
  verifyV138Plan26294PrivateAggregate(aggregate, actual.key!, actual.material, actual.counts)
  const review = readCommittedReview(actual.root)
  planV138Plan26294ReviewedWrites(review, currentReviewSubject(actual.root, review), actual.branch)
  const artifacts = buildReviewedArtifacts(aggregate, actual.branch)
  exclusiveWrite(actual.root, V138_PLAN_262_94_PATHS.disposition, Buffer.from(canonical(artifacts.disposition)), 0o644)
  if (artifacts.correction) exclusiveWrite(actual.root, V138_PLAN_262_94_PATHS.correction, Buffer.from(canonical(artifacts.correction)), 0o644)
  if (artifacts.route12) exclusiveWrite(actual.root, V138_PLAN_262_94_PATHS.route12, Buffer.from(canonical(artifacts.route12)), 0o644)
  else if (kind(actual.root, V138_PLAN_262_94_PATHS.route12) !== "absent") fail("NONPASS_ROUTE12_PRESENT")
  return artifacts
}

export const checkV138Plan26294ReviewedArtifacts = (rootInput: string) => {
  const actual = actualMaterialAndCounts(rootInput, true)
  const aggregate = checkV138Plan26294PublicAggregate(actual.root)
  const review = readCommittedReview(actual.root)
  planV138Plan26294ReviewedWrites(review, currentReviewSubject(actual.root, review), actual.branch)
  const expected = buildReviewedArtifacts(aggregate, actual.branch)
  if (canonical(parseJson(readRegular(actual.root, V138_PLAN_262_94_PATHS.disposition))) !== canonical(expected.disposition)) fail("DISPOSITION_INVALID")
  for (const [repoPath, artifact] of [[V138_PLAN_262_94_PATHS.correction, expected.correction], [V138_PLAN_262_94_PATHS.route12, expected.route12]] as const) {
    if (artifact === null ? kind(actual.root, repoPath) !== "absent" : kind(actual.root, repoPath) !== "file" || canonical(parseJson(readRegular(actual.root, repoPath))) !== canonical(artifact))
      fail("REVIEWED_WRITE_SET_INVALID")
  }
  return expected
}

const committedAtHead = (root: string, repoPath: string): boolean => {
  try { return gitBytes(root, ["show", `HEAD:${repoPath}`]).equals(readRegular(root, repoPath)) } catch { return false }
}
export const retireV138Plan26294ReviewedLocalEvidence = (rootInput: string): true => {
  const root = rootOf(rootInput)
  checkV138Plan26294ReviewedArtifacts(root)
  if (!committedAtHead(root, V138_PLAN_262_94_PATHS.aggregate) || !committedAtHead(root, V138_PLAN_262_94_PATHS.disposition)) fail("ADJUDICATION_NOT_COMMITTED")
  const journal = readRegular(root, V138_PLAN_262_94_PATHS.journal)
  const count = journal.toString("utf8").trim().split("\n").filter(Boolean).length
  readPrivateMaterial(root, count, true)
  for (const name of exactPrivateNames(count)) unlinkSync(path.join(resolveContained(root, V138_PLAN_262_94_PATHS.privateDir), name))
  rmdirSync(resolveContained(root, V138_PLAN_262_94_PATHS.privateDir))
  unlinkSync(resolveContained(root, V138_PLAN_262_94_PATHS.journal))
  fsyncParent(resolveContained(root, V138_PLAN_262_94_PATHS.journal))
  return true
}

export const checkV138Plan26294RetiredAggregate = (rootInput: string) => {
  const root = rootOf(rootInput)
  const aggregate = checkV138Plan26294PublicAggregate(root)
  if (kind(root, V138_PLAN_262_94_PATHS.journal) !== "absent" || kind(root, V138_PLAN_262_94_PATHS.privateDir) !== "absent" ||
    kind(root, V138_PLAN_262_94_PATHS.terminal) !== "file" || kind(root, V138_PLAN_262_94_PATHS.disposition) !== "file" ||
    !committedAtHead(root, V138_PLAN_262_94_PATHS.aggregate) || !committedAtHead(root, V138_PLAN_262_94_PATHS.disposition)) fail("RETIRED_AGGREGATE_INVALID")
  const disposition = parseJson(readRegular(root, V138_PLAN_262_94_PATHS.disposition))
  if (disposition.aggregateRoot !== aggregate.aggregateRoot || (disposition.status !== "pass" && kind(root, V138_PLAN_262_94_PATHS.route12) !== "absent"))
    fail("RETIRED_AGGREGATE_INVALID")
  return freeze({ aggregateRoot: aggregate.aggregateRoot, dispositionRoot: disposition.dispositionRoot, rawEvidenceRetired: true })
}

const main = (): void => {
  const args = process.argv.slice(2)
  if (canonical(args) === canonical(["--write-aggregate-manifest"])) {
    const aggregate = writeV138Plan26294Aggregate(IMPLEMENTATION_ROOT)
    process.stdout.write(canonical({ status: "non_authorizing_aggregate_written", counts: aggregate.counts, authority: false }))
    return
  }
  if (canonical(args) === canonical(["--check-private-aggregate"])) {
    checkV138Plan26294PrivateAggregate(IMPLEMENTATION_ROOT)
    process.stdout.write(canonical({ status: "private_aggregate_checked", authority: false }))
    return
  }
  if (canonical(args) === canonical(["--check-public-aggregate"])) {
    const aggregate = checkV138Plan26294PublicAggregate(IMPLEMENTATION_ROOT)
    process.stdout.write(canonical({ status: "public_aggregate_checked", counts: aggregate.counts, authority: false }))
    return
  }
  if (canonical(args) === canonical(["--derive-no-publish"])) {
    const actual = actualMaterialAndCounts(IMPLEMENTATION_ROOT, true)
    const branch = deriveV138Plan26294Disposition(actual.branch)
    process.stdout.write(canonical({ status: branch.status, producerDisposition: branch.producerDisposition,
      reproductionPreserved: branch.preserveReproduction, writeCorrection: branch.writeCorrection, writeRoute12: branch.writeRoute12,
      counts: actual.counts, authority: false }))
    return
  }
  if (canonical(args) === canonical(["--write-reviewed-artifacts"])) { writeV138Plan26294ReviewedArtifacts(IMPLEMENTATION_ROOT); return }
  if (canonical(args) === canonical(["--check-reviewed-artifacts"])) { checkV138Plan26294ReviewedArtifacts(IMPLEMENTATION_ROOT); return }
  if (canonical(args) === canonical(["--retire-reviewed-local-evidence"])) { retireV138Plan26294ReviewedLocalEvidence(IMPLEMENTATION_ROOT); return }
  if (canonical(args) === canonical(["--check-retired-aggregate"])) { checkV138Plan26294RetiredAggregate(IMPLEMENTATION_ROOT); return }
  fail("ARGUMENTS_INVALID")
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main() } catch { process.stderr.write("V138_PLAN_262_94_CHECK_FAILED\n"); process.exitCode = 1 }
}
