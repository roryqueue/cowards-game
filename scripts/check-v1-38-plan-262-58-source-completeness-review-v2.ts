#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Candidate = Record<string, any>

export const V138_PLAN_262_58_SOURCE_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
] as const)

export const V138_PLAN_262_58_COMMANDS = Object.freeze([
  "--check-plan-262-57-pre-execution-readiness-v1",
  "--resolve-plan-262-57-pre-start-v1",
  "--check-plan-262-57-pre-start-obstruction-v1",
  "--write-execution-context-v11-receipt",
  "--write-plan-262-57-route-start-v1",
  "--write-headroom-preflight-v11-receipt",
  "--calibrate-parallel-v11-receipt",
  "--write-authoritative-v12-receipt",
  "--write-plan-262-57-terminal-v1",
  "--check-plan-262-57-terminal-v1",
] as const)

const canonicalize = (value: Json): Json => Array.isArray(value)
  ? value.map(canonicalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) =>
      a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]))
    : value
const canonical = (value: unknown) => JSON.stringify(canonicalize(value as Json))
const sha256 = (value: Buffer | string) => `sha256:${createHash("sha256")
  .update(value).digest("hex")}`
const fail = (code: string): never => { throw new TypeError(code) }
const oid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const digest = (value: unknown) => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const record = (value: unknown): value is Candidate => value !== null &&
  typeof value === "object" && !Array.isArray(value)
const equal = (a: unknown, b: unknown) => canonical(a) === canonical(b)
const unique = (values: unknown[]) => new Set(values).size === values.length

const candidateBody = (candidate: Candidate) => Object.fromEntries(
  Object.entries(candidate).filter(([key]) => key !== "candidateRoot"))

export const validateReviewV2Candidate = (value: unknown) => {
  if (!record(value) || value.schemaVersion !==
      "v1.38-plan-262-58-source-completeness-review-v2-candidate" ||
    value.candidateRoot !== sha256(canonical(candidateBody(value)))) {
    fail("REVIEW_V2_CANDIDATE_ROOT_INVALID")
  }
  const candidate = value as Candidate
  const transcript = candidate.transcript
  if (record(transcript) && Array.isArray(transcript.records) &&
    !equal(transcript.records.map((item: Candidate) => item.command),
      V138_PLAN_262_58_COMMANDS)) {
    fail("WR01_SEMANTIC_ROOT_RECOMPUTED")
  }
  if (!record(transcript) || typeof transcript.fixtureRoot !== "string" ||
    !transcript.fixtureRoot.startsWith("/private/tmp/") ||
    transcript.fixtureRemoved !== true || transcript.repositoryRootCanonical !== true ||
    !Array.isArray(transcript.records) || transcript.records.length !==
      V138_PLAN_262_58_COMMANDS.length || !Array.isArray(transcript.eventLedger) ||
    !equal(transcript.eventLedger,
      ["lstat:before", "open:nofollow", "dispatch", "cleanup", "lstat:absent"]) ||
    !digest(transcript.beforeRoot) || transcript.beforeRoot !== transcript.afterRoot ||
    !Array.isArray(transcript.canonicalWrites) || transcript.canonicalWrites.length !== 0 ||
    transcript.records.some((item: unknown) => !record(item) ||
      !Array.isArray(item.argv) || item.argv.length !== 1 ||
      item.argv[0] !== item.command || typeof item.reachedHandler !== "string" ||
      typeof item.prerequisite !== "string" || typeof item.destination !== "string" ||
      !["none", "fixture-write"].includes(item.effectClass) ||
      item.disposition !== "success" || item.exitStatus !== 0 ||
      !digest(item.outputDigest))) fail("CR01_EXECUTION_TRANSCRIPT_INVALID")
  const reachability = candidate.reachability
  if (!record(reachability) || !equal(reachability.commands,
      V138_PLAN_262_58_COMMANDS) || !equal(reachability.manifestCommands,
      V138_PLAN_262_58_COMMANDS) || !equal(reachability.dispatchCommands,
      V138_PLAN_262_58_COMMANDS) || !Array.isArray(reachability.exports) ||
    reachability.exports.length !== V138_PLAN_262_58_COMMANDS.length ||
    !unique(reachability.exports) || reachability.routeOrdinal !== 7 ||
    !equal(reachability.executionVersions, ["v11", "v11", "v11", "v12"])) {
    fail("CR02_REACHABILITY_INVENTORY_INVALID")
  }
  const custody = candidate.custody
  if (!record(custody) || !oid(custody.sourceBase8) || !oid(custody.a8) ||
    !equal(custody.parents, [custody.sourceBase8]) ||
    !equal(custody.paths, V138_PLAN_262_58_SOURCE_PATHS) ||
    custody.maximal !== true || custody.planningDescendantsOnly !== true) {
    fail("CR03_SOURCE_CUSTODY_INVALID")
  }
  const history = candidate.protectedHistory
  if (!record(history) || history.a7 !==
      "5f39aba7833030d537c4c2767c369d24c982ed83" ||
    !Array.isArray(history.exactChargeIds) || history.exactChargeIds.length !== 40 ||
    !unique(history.exactChargeIds) || history.exactChargeIds.some((item: unknown) =>
      typeof item !== "string" || !/^charge:\d+$/u.test(item)) ||
    !Array.isArray(history.priorAuthorizationBytes) ||
    history.priorAuthorizationBytes.length !== 6 ||
    history.priorAuthorizationBytes.some((item: unknown) => !record(item) ||
      typeof item.path !== "string" || !digest(item.sha256)) ||
    !record(history.roots) || Object.values(history.roots).some(item => !digest(item))) {
    fail("CR04_PROTECTED_HISTORY_INVALID")
  }
  const snapshots = candidate.snapshots
  if (!record(snapshots) || snapshots.inventoryComplete !== true ||
    snapshots.transientWritesObserved !== true || !digest(snapshots.beforeRoot) ||
    snapshots.beforeRoot !== snapshots.afterRoot) fail("CR05_STATE_PRESERVATION_INVALID")
  const publication = candidate.publication
  if (!record(publication) || publication.mode !== "exclusive-create" ||
    publication.introducingCommitCount !== 1 || publication.immutableBlobs !== true ||
    publication.laterModificationCount !== 0 || !Array.isArray(publication.changedPaths) ||
    publication.changedPaths.length !== 2 || !unique(publication.changedPaths)) {
    fail("CR06_PUBLICATION_CUSTODY_INVALID")
  }
  const identity = candidate.identity
  if (!record(identity) || identity.independentPersonClaimed !== false ||
    identity.reviewerSeparated !== false || identity.externalIdentityClaimed !== false ||
    identity.cryptographicReviewerIdentityClaimed !== false ||
    identity.independentCustodyClaimed !== false ||
    typeof identity.proceduralContext !== "string") fail("CR07_IDENTITY_CLAIM_INVALID")
  const confinement = candidate.confinement
  if (!record(confinement) || confinement.repositoryRootCanonical !== true ||
    confinement.canonicalRelativePathsOnly !== true ||
    confinement.extraCliArguments !== false || confinement.symlinkAncestor !== false ||
    confinement.symlinkLeaf !== false || confinement.hardLinkAlias !== false ||
    confinement.pathEscape !== false) fail("CR08_PATH_CONFINEMENT_INVALID")
  return value
}

const git = (repoRoot: string, args: readonly string[]) => execFileSync("git",
  [...args], { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim()

const REVIEW_V1_INVALID_PATH =
  ".planning/artifacts/v1.38-plan-262-58-review-v1-invalid-disposition-v1.json"

export const buildV138ReviewV1InvalidDisposition = (repoRoot: string) => {
  const evidencePaths = [
    ".planning/artifacts/v1.38-plan-262-55-source-completeness-review-v1.json",
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-55-REVIEW.md",
    "scripts/check-v1-38-plan-262-55-source-completeness-review.ts",
    "scripts/check-v1-38-plan-262-55-source-completeness-review.test.ts",
  ] as const
  const evidence = evidencePaths.map(repoPath => ({ path: repoPath,
    blobOid: git(repoRoot, ["rev-parse", `HEAD:${repoPath}`]),
    sha256: sha256(readFileSync(path.resolve(repoRoot, repoPath))) }))
  const findings = [
    ...Array.from({ length: 8 }, (_, index) => ({
      id: `CR-${String(index + 1).padStart(2, "0")}`, severity: "BLOCKER" })),
    { id: "WR-01", severity: "WARNING" },
  ]
  const body = { schemaVersion:
    "v1.38-plan-262-58-review-v1-invalid-disposition-v1",
    disposition: "review_v1_invalid_disproved_non_authorizing",
    reviewRoot:
      "sha256:856f39f2f613678e057ec799499a285152b08420e0a518263c29253112f42433",
    exactA7: "5f39aba7833030d537c4c2767c369d24c982ed83",
    evidence: Object.freeze(evidence),
    codeReviewSha256: sha256(readFileSync(path.resolve(repoRoot,
      ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-55-CODE-REVIEW.md"))),
    archivedPlanSha256:
      "sha256:20084e32b072e697523b843cbf7d664672518e9db380bbf6cfca6a38b06b9940",
    archivedSummarySha256:
      "sha256:a25bb91378a70cf0df517ff033a63322f6b1d2285fb1f212db2593373f8b5ee0",
    findings: Object.freeze(findings), findingCount: 9 as const,
    reviewV1PassDisproved: true as const,
    sourceCompletenessPassedDisproved: true as const,
    eligibleAuthorizationInput: false as const,
    historicalEvidencePreserved: true as const,
    identityClaims: Object.freeze({ independentPersonClaimed: false as const,
      reviewerSeparated: false as const,
      cryptographicReviewerIdentityClaimed: false as const,
      independentCustodyClaimed: false as const }),
    authority: Object.freeze({ admit03: "blocked" as const,
      acceptedCells: 0 as const, requiredCells: 540 as const,
      routeStarted: false as const, candidateSearchAuthorized: false as const,
      phase263Authorized: false as const,
      formationMaterializationAuthorized: false as const,
      holdoutOpeningAuthorized: false as const, publicAuthorized: false as const,
      productionAuthorized: false as const }),
  }
  return Object.freeze({ ...body, dispositionRoot: sha256(canonical(body)) })
}

export const checkV138ReviewV1InvalidDisposition = (repoRoot: string,
  value: unknown) => {
  const expected = buildV138ReviewV1InvalidDisposition(repoRoot)
  if (!equal(value, expected)) fail("V138_REVIEW_V1_INVALID_DISPOSITION_INVALID")
  return expected
}

export const inspectV138SourceIdentityA8 = (repoRoot: string, sourceA8?: string) => {
  const candidates = (sourceA8 === undefined
    ? git(repoRoot, ["log", "--all", "--format=%H", "--",
      ...V138_PLAN_262_58_SOURCE_PATHS]).split("\n").filter(Boolean)
    : [git(repoRoot, ["rev-parse", sourceA8])])
  const exact = candidates.filter((commit, index) => candidates.indexOf(commit) === index)
    .map(commit => {
      const parents = git(repoRoot, ["show", "-s", "--format=%P", commit])
        .split(" ").filter(Boolean)
      const paths = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
        "-r", "--no-renames", commit]).split("\n").filter(Boolean).sort()
      return { commit, parents, paths }
    }).filter(item => item.parents.length === 1 && equal(item.paths,
      [...V138_PLAN_262_58_SOURCE_PATHS].sort()))
  if (exact.length !== 1) fail("V138_PLAN_262_58_A8_CUSTODY_INVALID")
  const selected = exact[0]!
  const blobs = V138_PLAN_262_58_SOURCE_PATHS.map(repoPath => ({ path: repoPath,
    blobOid: git(repoRoot, ["rev-parse", `${selected.commit}:${repoPath}`]),
    sha256: sha256(execFileSync("git", ["show", `${selected.commit}:${repoPath}`],
      { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 })) }))
  return Object.freeze({ sourceBase8: selected.parents[0]!, a8: selected.commit,
    parents: Object.freeze(selected.parents), paths: V138_PLAN_262_58_SOURCE_PATHS,
    tree: git(repoRoot, ["rev-parse", `${selected.commit}^{tree}`]),
    blobs: Object.freeze(blobs) })
}

const forbiddenCanonicalPaths = [
  ".planning/artifacts/v1.38-plan-262-59-source-completeness-review-v2.json",
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-59-REVIEW.md",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v8.json",
  ".planning/artifacts/v1.38-successor-source-seal-v8.json",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v7.json",
  ".planning/artifacts/v1.38-successor-source-seal-v7.json",
] as const

export const assertV138Plan26258DestinationAbsence = (repoRoot: string) => {
  for (const repoPath of forbiddenCanonicalPaths) {
    try { lstatSync(path.resolve(repoRoot, repoPath)); fail("V138_PLAN_262_58_DESTINATION_PRESENT") }
    catch (error) {
      if (error instanceof TypeError) throw error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
  return Object.freeze([...forbiddenCanonicalPaths])
}

const main = () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (process.argv.slice(2).length === 1 && process.argv[2] === "--check-source-a8") {
    const custody = inspectV138SourceIdentityA8(repoRoot)
    assertV138Plan26258DestinationAbsence(repoRoot)
    process.stdout.write(`${canonical(custody)}\n`)
    return
  }
  if (process.argv.slice(2).length === 1 && process.argv[2] === "--check-review-v2") {
    const target = path.resolve(repoRoot,
      ".planning/artifacts/v1.38-plan-262-59-source-completeness-review-v2.json")
    const value = JSON.parse(readFileSync(target, "utf8"))
    validateReviewV2Candidate(value)
    process.stdout.write(`${canonical({ findingCount: 0,
      sourceCompletenessPassed: true, reviewRoot: value.candidateRoot })}\n`)
    return
  }
  if (process.argv.slice(2).length === 1 &&
      process.argv[2] === "--check-review-v1-invalid-disposition") {
    const target = path.resolve(repoRoot, REVIEW_V1_INVALID_PATH)
    const bytes = readFileSync(target, "utf8")
    const value = checkV138ReviewV1InvalidDisposition(repoRoot,
      JSON.parse(bytes))
    if (bytes !== `${canonical(value)}\n`) {
      fail("V138_REVIEW_V1_INVALID_DISPOSITION_BYTES_INVALID")
    }
    process.stdout.write(`${canonical({ disposition: value.disposition,
      dispositionRoot: value.dispositionRoot,
      eligibleAuthorizationInput: value.eligibleAuthorizationInput })}\n`)
    return
  }
  fail("V138_PLAN_262_58_REVIEWER_V2_CLI_ARGUMENTS_INVALID")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
