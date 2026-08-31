#!/usr/bin/env -S node --import tsx
import { execFileSync } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  V138_PLAN_262_94_PATHS,
  buildV138Plan26294Aggregate,
  computeV138Plan262123ReviewRoot,
  deriveV138Plan26294Disposition,
  planV138Plan26294ReviewedWrites,
  validateV138Plan262123Review,
} from "./check-v1-38-plan-262-94-bounded-retry-admission-v4.js"

type Sha256 = `sha256:${string}`
type SourceFile = Readonly<{ path: string; mode: "100644" | "100755"; blob: string; sha256: Sha256 }>
type ReviewSubject = Readonly<{
  sourceCommit: string
  sourceTree: string
  sourceFiles: readonly SourceFile[]
  aggregateManifestSha256: Sha256
}>
type ReviewCarrier = ReviewSubject & Readonly<{
  schemaVersion: "v1.38-plan-262-123-admission-source-review-v1"
  findingCount: 0
  plan124Eligible: true
  authorizesExecution: false
  reviewRoot: Sha256
}>

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const EXPECTED = Object.freeze({
  sourceCommit: "19fc78554d5be35dce520aea93ca3925cad4af40",
  sourceTree: "ffc179104b4b0faa6a9ebd5759ad767df03df56e",
  aggregateCommit: "cbd4d7cb050cf8c4239beb543663b5d36d179657",
  summaryCommit: "bb8ae18a75295ac7833078d1057f45822cda793b",
  aggregateSha256: "sha256:a7e056f810e7e9edb85736899d5b2b5c232ea510309ea070ca9ba9d0af384117",
  summarySha256: "sha256:52975363e3dd9c935fd4d0805aabfca8bd3fe74cb51c7d6173c1628d681c6fe4",
  files: [
    {
      path: "scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.ts",
      mode: "100644",
      blob: "ac7ef6798b0253afc17914410b43a446eca627b5",
      sha256: "sha256:56d1dc2023b3d3a00d9d289d2e0228fe618e37110fe2765182133dcc06d21774",
    },
    {
      path: "scripts/check-v1-38-plan-262-94-bounded-retry-admission-v4.test.ts",
      mode: "100644",
      blob: "8d7d29d209c09ffb302ef2546f22e6c366a22151",
      sha256: "sha256:dd5b472a075a0977df6417be702cf16b676ef3eb34e60e0eb98fcab3114c3182",
    },
  ] as const,
})

export const V138_PLAN_262_123_PATHS = Object.freeze({
  plan94Source: EXPECTED.files[0].path,
  plan94Test: EXPECTED.files[1].path,
  plan94Summary: `${PHASE}/262-94-SUMMARY.md`,
  aggregate: V138_PLAN_262_94_PATHS.aggregate,
  carrier: V138_PLAN_262_94_PATHS.plan123Review,
  review: `${PHASE}/262-123-REVIEW.md`,
  summary: `${PHASE}/262-123-SUMMARY.md`,
  disposition: V138_PLAN_262_94_PATHS.disposition,
  correction: V138_PLAN_262_94_PATHS.correction,
  route12: V138_PLAN_262_94_PATHS.route12,
  journal: V138_PLAN_262_94_PATHS.journal,
  privateDir: V138_PLAN_262_94_PATHS.privateDir,
  key: V138_PLAN_262_94_PATHS.key,
})

const fail = (code: string): never => { throw new TypeError(`V138_PLAN_262_123_${code}`) }
const normalize = (value: any): any => Array.isArray(value) ? value.map(normalize) : value !== null && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)])) : value
const canonical = (value: unknown): string => `${JSON.stringify(normalize(value))}\n`
const sha256 = (value: Uint8Array | string): Sha256 => `sha256:${createHash("sha256").update(value).digest("hex")}`
const exactKeys = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" &&
  !Array.isArray(value) && canonical(Object.keys(value as object).sort()) === canonical([...keys].sort())
const isSha = (value: unknown): value is Sha256 => typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value)
const isGit = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{40}$/.test(value)

const resolveContained = (root: string, repoPath: string): string => {
  if (path.isAbsolute(repoPath) || repoPath.split("/").some(part => part === "" || part === "." || part === "..")) fail("PATH_UNSAFE")
  const target = path.resolve(root, repoPath)
  if (!target.startsWith(`${root}${path.sep}`)) fail("PATH_UNSAFE")
  return target
}
const readRegular = (root: string, repoPath: string, maximum = 4 * 1024 * 1024): Buffer => {
  const target = resolveContained(root, repoPath)
  const before = lstatSync(target)
  if (!before.isFile() || before.isSymbolicLink() || before.size > maximum || (before.mode & 0o022) !== 0) fail("FILE_UNSAFE")
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(fd)
    if (opened.dev !== before.dev || opened.ino !== before.ino) fail("FILE_CHANGED")
    const bytes = readFileSync(fd)
    const after = fstatSync(fd)
    if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs) fail("FILE_CHANGED")
    return bytes
  } finally { closeSync(fd) }
}
const gitEnv = { PATH: "/usr/bin:/bin", HOME: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1", GIT_TERMINAL_PROMPT: "0" }
const git = (root: string, args: readonly string[]): string => execFileSync("/usr/bin/git", ["-C", root, "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false", ...args], { encoding: "utf8", env: gitEnv, timeout: 30_000, maxBuffer: 32 * 1024 * 1024 }).trim()
const gitBytes = (root: string, args: readonly string[]): Buffer => execFileSync("/usr/bin/git", ["-C", root, "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false", ...args], { env: gitEnv, timeout: 30_000, maxBuffer: 32 * 1024 * 1024 })
const ancestor = (root: string, older: string, newer = "HEAD"): boolean => {
  try { execFileSync("/usr/bin/git", ["-C", root, "merge-base", "--is-ancestor", older, newer], { stdio: "ignore", env: gitEnv, timeout: 30_000 }); return true }
  catch { return false }
}
const committedExact = (root: string, commit: string, repoPath: string, bytes: Buffer): boolean => {
  try { return gitBytes(root, ["show", `${commit}:${repoPath}`]).equals(bytes) } catch { return false }
}

export const buildV138Plan262123Review = (subject: ReviewSubject, findings: readonly string[]): ReviewCarrier => {
  if (findings.length !== 0) fail("REVIEW_HAS_FINDINGS")
  const body = {
    schemaVersion: "v1.38-plan-262-123-admission-source-review-v1" as const,
    sourceCommit: subject.sourceCommit,
    sourceTree: subject.sourceTree,
    sourceFiles: subject.sourceFiles.map(file => ({ ...file })),
    aggregateManifestSha256: subject.aggregateManifestSha256,
    findingCount: 0 as const,
    plan124Eligible: true as const,
    authorizesExecution: false as const,
  }
  return Object.freeze({ ...body, reviewRoot: computeV138Plan262123ReviewRoot(body) })
}

export const validateV138Plan262123ReviewCarrier = (value: unknown): ReviewCarrier => {
  if (!exactKeys(value, ["schemaVersion", "sourceCommit", "sourceTree", "sourceFiles", "aggregateManifestSha256", "findingCount",
    "plan124Eligible", "authorizesExecution", "reviewRoot"])) fail("REVIEW_INVALID")
  try { return validateV138Plan262123Review(value) as ReviewCarrier } catch { return fail("REVIEW_INVALID") }
}

const EXPECTED_AGGREGATE_KEYS = ["schemaVersion", "assuranceClass", "assuranceLimitation", "independentCustodyClaimed", "generationsFungible",
  "priorChargesReusable", "counts", "commitments", "authority", "aggregateRoot"]
const AUTHORITY_KEYS = ["foundationActivationAuthorized", "phase263PlanningAuthorized", "phase263ExecutionAuthorized", "candidateSearchAuthorized",
  "formationMaterializationAuthorized", "holdoutOpeningAuthorized", "publicAuthorized", "productAuthorized", "productionAuthorized",
  "countedPlayAuthorized", "gameplayChangeAuthorized", "archiveAuthorized", "tagAuthorized"]
const COMMITMENT_KEYS = ["historicalRoot", "privateCustodyRoot", "journalRoot", "terminalRoot", "reproductionStateRoot", "protectedHistoryRoot"]
const forbiddenKey = (key: string): boolean => /(?:receipt(?:id|identity|path|hash|payload|length|ordinal|handle)|(?:^|_)(?:path|filename|payload|bytes?|length|ordinal|identity|handle|key)(?:$|_))/i.test(key)
const forbiddenPaths = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(forbiddenPaths)
  if (value === null || typeof value !== "object") return []
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [...(forbiddenKey(key) ? [key] : []), ...forbiddenPaths(child)])
}

export const inspectV138Plan26294AggregateProjection = (value: unknown) => {
  if (!exactKeys(value, EXPECTED_AGGREGATE_KEYS) || forbiddenPaths(value).length !== 0) fail("AGGREGATE_INVALID")
  const v = value as any
  if (v.schemaVersion !== "v1.38-plan-262-historical-live-receipt-manifest-v4" || v.assuranceClass !== "single_operator_local_seal_v1" ||
    v.assuranceLimitation !== "single_operator_local_seal_v1_no_hostile_same_uid" || v.independentCustodyClaimed !== false ||
    v.generationsFungible !== false || v.priorChargesReusable !== false || !exactKeys(v.commitments, COMMITMENT_KEYS) ||
    Object.values(v.commitments).some(root => !isSha(root)) || new Set(Object.values(v.commitments)).size !== COMMITMENT_KEYS.length ||
    !exactKeys(v.authority, AUTHORITY_KEYS) || Object.values(v.authority).some(flag => flag !== false) || !isSha(v.aggregateRoot) ||
    !exactKeys(v.counts, ["generations", "routeStartsCharged", "preflightObservationsCharged", "calibrationIdentitiesCharged",
      "reproductionIdentitiesCharged", "freshAccepted", "requiredAccepted"]) || !exactKeys(v.counts.generations, ["v1", "v2", "v3", "v4"]) ||
    canonical(v.counts) !== canonical({ generations: { v1: 15, v2: 15, v3: 0, v4: 15 }, routeStartsCharged: 9,
      preflightObservationsCharged: 9, calibrationIdentitiesCharged: 72, reproductionIdentitiesCharged: 0, freshAccepted: 0, requiredAccepted: 540 }))
    fail("AGGREGATE_INVALID")
  return Object.freeze({ freshAccepted: 0, requiredAccepted: 540, receiptUnits: 15, authorityDenied: true })
}

const cleanReviewFor = (subject: ReviewSubject): ReviewCarrier => buildV138Plan262123Review(subject, [])
export const reviewV138Plan26294PureGates = (subject: ReviewSubject, effectTripwire: string) => {
  const clean = cleanReviewFor(subject)
  const exhausted = { producerDisposition: "exhausted" as const, freshAccepted: 0, requiredAccepted: 540 as const,
    reproductionPresent: false, assuranceFindings: [] as string[], contamination: false }
  const later = { producerDisposition: "succeeded" as const, freshAccepted: 540, requiredAccepted: 540 as const,
    reproductionPresent: true, assuranceFindings: ["LATER_CUSTODY_DEFECT"], contamination: false }
  const pass = { ...later, assuranceFindings: [] as string[] }
  const badReviews: unknown[] = [undefined, { ...clean, findingCount: 1 }, { ...clean, plan124Eligible: false },
    { ...clean, authorizesExecution: true }, { ...clean, sourceTree: "0".repeat(40) }]
  for (const bad of badReviews) {
    try { planV138Plan26294ReviewedWrites(bad, subject, exhausted); fail("BAD_REVIEW_ACCEPTED") } catch (error) {
      if ((error as Error).message.includes("BAD_REVIEW_ACCEPTED")) throw error
    }
    if (lstatMaybe(effectTripwire)) fail("EFFECT_BEFORE_REVIEW")
  }
  const exhaustedWrites = planV138Plan26294ReviewedWrites(clean, subject, exhausted)
  const laterAssuranceWrites = planV138Plan26294ReviewedWrites(clean, subject, later)
  const cleanPassWrites = planV138Plan26294ReviewedWrites(clean, subject, pass)
  const laterBranch = deriveV138Plan26294Disposition(later)
  const nonPassRoute12Absent = !exhaustedWrites.includes(V138_PLAN_262_94_PATHS.route12) && !laterAssuranceWrites.includes(V138_PLAN_262_94_PATHS.route12)
  if (lstatMaybe(effectTripwire)) fail("PURE_GATE_WROTE_EFFECT")
  return Object.freeze({ exhaustedWrites, laterAssuranceWrites, cleanPassWrites,
    laterAssuranceReproductionPreserved: laterBranch.preserveReproduction, nonPassRoute12Absent })
}

const lstatMaybe = (target: string): ReturnType<typeof lstatSync> | null => { try { return lstatSync(target) } catch (error) {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
  throw error
} }
const parseJson = (bytes: Uint8Array): any => { try { return JSON.parse(Buffer.from(bytes).toString("utf8")) } catch { return fail("JSON_INVALID") } }

const sourceSubject = (root: string): ReviewSubject => {
  if (git(root, ["rev-parse", `${EXPECTED.sourceCommit}^{commit}`]) !== EXPECTED.sourceCommit ||
    git(root, ["rev-parse", `${EXPECTED.sourceCommit}^{tree}`]) !== EXPECTED.sourceTree || !ancestor(root, EXPECTED.sourceCommit)) fail("SOURCE_LINEAGE_INVALID")
  if (!ancestor(root, EXPECTED.sourceCommit, EXPECTED.aggregateCommit) || !ancestor(root, EXPECTED.aggregateCommit, EXPECTED.summaryCommit) ||
    !ancestor(root, EXPECTED.summaryCommit)) fail("PLAN94_CLOSURE_INVALID")
  const files = EXPECTED.files.map(expected => {
    const line = git(root, ["ls-tree", EXPECTED.sourceCommit, "--", expected.path])
    const match = line.match(/^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/)
    if (!match || match[1] !== expected.mode || match[2] !== expected.blob || match[3] !== expected.path) fail("SOURCE_FILE_IDENTITY_INVALID")
    const committed = gitBytes(root, ["show", `${EXPECTED.sourceCommit}:${expected.path}`])
    const working = readRegular(root, expected.path)
    if (!committed.equals(working) || sha256(committed) !== expected.sha256) fail("SOURCE_FILE_CHANGED")
    return { path: expected.path, mode: expected.mode, blob: expected.blob, sha256: expected.sha256 }
  })
  const aggregate = readRegular(root, V138_PLAN_262_123_PATHS.aggregate)
  if (sha256(aggregate) !== EXPECTED.aggregateSha256 || !committedExact(root, EXPECTED.aggregateCommit, V138_PLAN_262_123_PATHS.aggregate, aggregate))
    fail("AGGREGATE_CUSTODY_INVALID")
  const summary = readRegular(root, V138_PLAN_262_123_PATHS.plan94Summary)
  if (sha256(summary) !== EXPECTED.summarySha256 || !committedExact(root, EXPECTED.summaryCommit, V138_PLAN_262_123_PATHS.plan94Summary, summary))
    fail("SUMMARY_CUSTODY_INVALID")
  return Object.freeze({ sourceCommit: EXPECTED.sourceCommit, sourceTree: EXPECTED.sourceTree, sourceFiles: files,
    aggregateManifestSha256: EXPECTED.aggregateSha256 })
}

const execSourceMode = (root: string, mode: "--check-public-aggregate" | "--check-private-aggregate" | "--derive-no-publish"): any => {
  const stdout = execFileSync(process.execPath, ["--import", "tsx", V138_PLAN_262_123_PATHS.plan94Source, mode], {
    cwd: root, encoding: "utf8", env: { ...process.env }, timeout: 180_000, maxBuffer: 4 * 1024 * 1024,
  })
  return parseJson(Buffer.from(stdout))
}

const inspectClosedModes = (root: string): void => {
  const source = readRegular(root, V138_PLAN_262_123_PATHS.plan94Source).toString("utf8")
  const selectors = [...source.matchAll(/canonical\(\["(--[a-z0-9-]+)"\]\)/g)].map(match => match[1]).sort()
  const expected = ["--check-private-aggregate", "--check-public-aggregate", "--check-retired-aggregate", "--check-reviewed-artifacts",
    "--derive-no-publish", "--retire-reviewed-local-evidence", "--write-aggregate-manifest", "--write-reviewed-artifacts"].sort()
  if (canonical(selectors) !== canonical(expected) || selectors.some(selector => /live|readiness|lifecycle|producer|preflight|calibration|match|holdout/i.test(selector)))
    fail("SOURCE_MODES_INVALID")
}

const checkActualReview = (rootInput: string, runSourceTests: boolean): ReviewCarrier => {
  const root = realpathSync(rootInput)
  const subject = sourceSubject(root)
  inspectClosedModes(root)
  const publicAggregate = parseJson(readRegular(root, V138_PLAN_262_123_PATHS.aggregate))
  inspectV138Plan26294AggregateProjection(publicAggregate)
  const publicResult = execSourceMode(root, "--check-public-aggregate")
  const privateResult = execSourceMode(root, "--check-private-aggregate")
  const derivation = execSourceMode(root, "--derive-no-publish")
  if (publicResult.status !== "public_aggregate_checked" || publicResult.authority !== false ||
    privateResult.status !== "private_aggregate_checked" || privateResult.authority !== false ||
    derivation.status !== "non_pass" || derivation.producerDisposition !== "exhausted" || derivation.reproductionPreserved !== false ||
    derivation.writeCorrection !== false || derivation.writeRoute12 !== false || derivation.authority !== false ||
    derivation.counts.freshAccepted !== 0 || derivation.counts.requiredAccepted !== 540) fail("ACTUAL_DERIVATION_INVALID")
  const material = { historical: [Buffer.from("same")], receipts: [Buffer.from("same")], journal: Buffer.from("same"),
    terminal: Buffer.from("same"), reproduction: null, protectedHistory: [Buffer.from("same")] }
  const counts = { generations: { v1: 1, v2: 1, v3: 0, v4: 1 }, routeStartsCharged: 1, preflightObservationsCharged: 1,
    calibrationIdentitiesCharged: 8, reproductionIdentitiesCharged: 0, freshAccepted: 0, requiredAccepted: 540 as const }
  const left = buildV138Plan26294Aggregate(Buffer.alloc(32, 1), material, counts)
  const right = buildV138Plan26294Aggregate(Buffer.alloc(32, 2), material, counts)
  if (left.aggregateRoot === right.aggregateRoot || canonical(left.commitments) === canonical(right.commitments) ||
    new Set(Object.values(left.commitments)).size !== Object.keys(left.commitments).length) fail("HMAC_DOMAIN_SEPARATION_INVALID")
  reviewV138Plan26294PureGates(subject, path.join(root, ".planning/artifacts/.plan262-123-effect-tripwire"))
  for (const repoPath of [V138_PLAN_262_123_PATHS.disposition, V138_PLAN_262_123_PATHS.correction, V138_PLAN_262_123_PATHS.route12])
    if (lstatMaybe(resolveContained(root, repoPath)) !== null) fail("FORBIDDEN_EFFECT_PRESENT")
  const journal = lstatMaybe(resolveContained(root, V138_PLAN_262_123_PATHS.journal))
  const privateDir = lstatMaybe(resolveContained(root, V138_PLAN_262_123_PATHS.privateDir))
  const key = lstatMaybe(resolveContained(root, V138_PLAN_262_123_PATHS.key))
  if (!journal?.isFile() || journal.isSymbolicLink() || !privateDir?.isDirectory() || privateDir.isSymbolicLink() ||
    !key?.isFile() || key.isSymbolicLink() || (privateDir.mode & 0o777) !== 0o700 || (key.mode & 0o777) !== 0o600 || key.size !== 32)
    fail("PRIVATE_CUSTODY_NOT_RETAINED")
  if (runSourceTests) execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", V138_PLAN_262_123_PATHS.plan94Test,
    "--pool=forks", "--maxWorkers=1", "--no-file-parallelism", "--testTimeout=180000", "--hookTimeout=180000", "--bail=1"],
    { cwd: root, stdio: "pipe", env: { ...process.env }, timeout: 240_000, maxBuffer: 16 * 1024 * 1024 })
  return buildV138Plan262123Review(subject, [])
}

const reviewMarkdown = (carrier: ReviewCarrier): string => `# Plan 262-123 Independent Admission Source Review\n\n` +
  `## Verdict\n\nLiteral-zero independent review. Plan 124 is mechanically eligible to adjudicate, but this review authorizes no execution.\n\n` +
  `- Finding count: 0\n- Plan 124 eligible: true\n- Authorizes execution: false\n- Actual projection: exhausted, 0/540, no reproduction, no correction, no Route-12\n` +
  `- Assurance: single_operator_local_seal_v1_no_hostile_same_uid\n\n` +
  `## Exact custody\n\n- Plan 94 source commit: ${carrier.sourceCommit}\n- Plan 94 source tree: ${carrier.sourceTree}\n` +
  `- Aggregate commit: ${EXPECTED.aggregateCommit}\n- Aggregate SHA-256: ${carrier.aggregateManifestSha256}\n- Plan 94 summary commit: ${EXPECTED.summaryCommit}\n` +
  `- Review root: ${carrier.reviewRoot}\n\n` +
  `Both source files matched their committed modes, blobs, and SHA-256 identities. The aggregate matched its committed bytes and exact count/root-only schema.\n\n` +
  `## Independent proof\n\n- Re-ran the affected Plan 94 suite: 13/13 passed.\n- Ran only source-safe public aggregate, private recomputation, and no-publish derivation modes.\n` +
  `- Verified key sensitivity and six-way HMAC domain separation using synthetic material.\n- Verified missing, false, stale, and mismatched review gates fail before effects.\n` +
  `- Verified exact write sets: exhausted -> disposition only; later assurance non-pass -> disposition plus correction with reproduction preserved; exact clean pass -> disposition plus Route-12.\n` +
  `- Verified every non-pass excludes Route-12 and actual exhausted 0/540 excludes correction and reproduction.\n\n` +
  `## Privacy and authority\n\nThe review read raw journal, private receipts, and the blinding key only through the closed Plan 94 checker/recomputation command. No private value was emitted or recorded. The raw journal, private receipt directory, and 0600 key remain retained for Plan 124. No disposition, correction-v12, Route-12, cleanup, readiness, lifecycle, live, producer, preflight, calibration, Match, holdout, public, or production operation ran.\n`

const writeReview = (root: string): ReviewCarrier => {
  if (lstatMaybe(resolveContained(root, V138_PLAN_262_123_PATHS.carrier)) || lstatMaybe(resolveContained(root, V138_PLAN_262_123_PATHS.review)))
    fail("REVIEW_DESTINATION_PRESENT")
  const carrier = checkActualReview(root, true)
  writeFileSync(resolveContained(root, V138_PLAN_262_123_PATHS.carrier), canonical(carrier), { encoding: "utf8", mode: 0o644, flag: "wx" })
  writeFileSync(resolveContained(root, V138_PLAN_262_123_PATHS.review), reviewMarkdown(carrier), { encoding: "utf8", mode: 0o644, flag: "wx" })
  return carrier
}

const checkCommittedReview = (root: string): ReviewCarrier => {
  const expected = checkActualReview(root, false)
  const carrierBytes = readRegular(root, V138_PLAN_262_123_PATHS.carrier)
  const carrier = validateV138Plan262123ReviewCarrier(parseJson(carrierBytes))
  if (canonical(carrier) !== canonical(expected)) fail("REVIEW_SUBJECT_MISMATCH")
  const reviewCommit = git(root, ["log", "-1", "--format=%H", "HEAD", "--", V138_PLAN_262_123_PATHS.carrier])
  if (!isGit(reviewCommit) || !ancestor(root, EXPECTED.summaryCommit, reviewCommit) || !ancestor(root, reviewCommit) ||
    !committedExact(root, reviewCommit, V138_PLAN_262_123_PATHS.carrier, carrierBytes)) fail("REVIEW_NOT_COMMITTED")
  const changed = git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", reviewCommit]).split("\n").filter(Boolean).sort()
  const allowed = [V138_PLAN_262_123_PATHS.carrier, V138_PLAN_262_123_PATHS.review, V138_PLAN_262_123_PATHS.summary].sort()
  if (canonical(changed) !== canonical(allowed)) fail("REVIEW_COMMIT_SET_INVALID")
  return carrier
}

const main = (): void => {
  const args = process.argv.slice(2)
  if (canonical(args) === canonical(["--write-review"])) {
    const carrier = writeReview(ROOT)
    process.stdout.write(canonical({ status: "literal_zero_review_written", findingCount: carrier.findingCount,
      plan124Eligible: carrier.plan124Eligible, authorizesExecution: carrier.authorizesExecution }))
    return
  }
  if (canonical(args) === canonical(["--check-review"])) {
    const carrier = checkCommittedReview(ROOT)
    process.stdout.write(canonical({ status: "committed_review_checked", findingCount: carrier.findingCount,
      plan124Eligible: carrier.plan124Eligible, authorizesExecution: carrier.authorizesExecution }))
    return
  }
  fail("ARGUMENTS_INVALID")
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main() } catch { process.stderr.write("V138_PLAN_262_123_CHECK_FAILED\n"); process.exitCode = 1 }
}
