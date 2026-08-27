#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { deriveV138Plan26283NoPublish } from "./check-v1-38-plan-262-83-bounded-retry-source-rereview.js"

type Sha256 = `sha256:${string}`
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export const V138_POST_RUN_AUDIT_CORRECTION_PATH =
  ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v1.json"
const PATHS = Object.freeze({
  seal: ".planning/artifacts/v1.38-successor-source-seal-v11.json",
  envelope: ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
  plan83:
    ".planning/artifacts/v1.38-plan-262-83-bounded-retry-source-rereview-v1.json",
  disposition:
    ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v1",
})
const HISTORICAL = Object.freeze({
  sourceCommit: "e844279f62192c41175fb3e7a08910493c6f24ab",
  sealCommit: "4841357d7aa89b7996f9ce299256f1d8d56a6290",
  liveCommit: "b4be9f5f5207c7eb87c6cd0e8f79863d4877cf3b",
  oldPlan83Root:
    "sha256:9518cfcff11ba64029ff74f6e56e0c0448f82b5d0d63500dedf793f7ce85595c",
  oldPlan80Root:
    "sha256:5fe2dbf967971c6d69d619e91e8d838f5e6495ded3cc23889cf98f0b42dcccdf",
  fixedSourceCommits: [
    "63ddaf79dbff53357dbdded35d0e5ef85df84a7a",
    "91cffe9227c7a5ace81cb4b9414c6304987828ab",
    "087bab44d369131e49610fa64b675bc987686b09",
  ],
})
const SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.ts",
  "scripts/run-v1-38-bounded-retry-envelope.test.ts",
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
const safeType = (
  target: string,
): "absent" | "regular" | "directory" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}
const readRegular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  if (safeType(target) !== "regular") fail("V138_AUDIT_CORRECTION_INPUT_UNSAFE")
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], { cwd: root })
const git = (root: string, args: string[]): string =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
const requireAncestor = (root: string, commit: string): void => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
      cwd: root,
      stdio: "ignore",
    })
  } catch {
    fail("V138_AUDIT_CORRECTION_ANCESTRY_INVALID")
  }
}

export const computeV138PostRunAuditCorrectionRoot = (
  candidate: any,
): Sha256 => {
  const body = JSON.parse(JSON.stringify(candidate))
  delete body.correctionRoot
  return sha256(`v138-plan262-post-run-audit-correction-v1\0${canonical(body)}`)
}

export const deriveV138PostRunAuditCorrection = (root: string): any => {
  for (const commit of [
    HISTORICAL.sourceCommit,
    HISTORICAL.sealCommit,
    HISTORICAL.liveCommit,
    ...HISTORICAL.fixedSourceCommits,
  ])
    requireAncestor(root, commit)
  const sourceBlobs = SOURCE_PATHS.map((repoPath) => {
    const bytes = gitBytes(root, HISTORICAL.sourceCommit, repoPath)
    return { repoPath, byteLength: bytes.length, sha256: sha256(bytes) }
  })
  const privateReceipts = readdirSync(path.resolve(root, PATHS.privateDir))
    .sort()
    .map((name) => ({
      name,
      mode: statSync(path.resolve(root, PATHS.privateDir, name)).mode & 0o777,
      sha256: sha256(readRegular(root, `${PATHS.privateDir}/${name}`)),
    }))
  const strengthened = deriveV138Plan26283NoPublish(root)
  const oldPlan83 = JSON.parse(readRegular(root, PATHS.plan83).toString("utf8"))
  const oldDisposition = JSON.parse(
    readRegular(root, PATHS.disposition).toString("utf8"),
  )
  if (
    oldPlan83.reviewRoot !== HISTORICAL.oldPlan83Root ||
    oldDisposition.dispositionRoot !== HISTORICAL.oldPlan80Root ||
    oldDisposition.status !== "non_pass" ||
    oldDisposition.terminalDisposition !== "exhausted" ||
    oldDisposition.counters?.freshAccepted !== 0 ||
    oldDisposition.counters?.requiredAccepted !== 540 ||
    strengthened.status !== "blocked" ||
    strengthened.findingCount < 1
  )
    fail("V138_AUDIT_CORRECTION_HISTORICAL_MEANING_INVALID")
  const body = {
    schemaVersion: "v1.38-plan-262-post-run-audit-correction-v1",
    correctionKind: "additive_post_run_assurance_supersession",
    historical: {
      sourceCommit: HISTORICAL.sourceCommit,
      sourceBlobs,
      sealCommit: HISTORICAL.sealCommit,
      sealSha256: sha256(readRegular(root, PATHS.seal)),
      sealRoot: JSON.parse(readRegular(root, PATHS.seal).toString("utf8"))
        .sealRoot,
      envelopeSha256: sha256(readRegular(root, PATHS.envelope)),
      envelopeRoot: JSON.parse(
        readRegular(root, PATHS.envelope).toString("utf8"),
      ).envelopeRoot,
      liveCommit: HISTORICAL.liveCommit,
      journalSha256: sha256(readRegular(root, PATHS.journal)),
      terminalSha256: sha256(readRegular(root, PATHS.terminal)),
      privateReceiptCount: privateReceipts.length,
      privateReceiptRoot: sha256(canonical(privateReceipts)),
      oldPlan83ReviewRoot: oldPlan83.reviewRoot,
      oldPlan83Sha256: sha256(readRegular(root, PATHS.plan83)),
      oldPlan80DispositionRoot: oldDisposition.dispositionRoot,
      oldPlan80Sha256: sha256(readRegular(root, PATHS.disposition)),
    },
    strengthenedReReview: {
      reviewedHistoricalCommit: strengthened.reviewedSource.commit,
      status: strengthened.status,
      findingCount: strengthened.findingCount,
      reviewRoot: strengthened.reviewRoot,
      sourceReviewPassed: false,
    },
    fixedSourceCommits: [...HISTORICAL.fixedSourceCommits],
    empiricalOutcome: {
      terminalDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      preserved: true,
    },
    effectiveAssurance: {
      integrityPassed: false,
      status: "integrity_non_pass",
      supersedesHistoricalCleanConclusion: true,
      historicalBytesMutated: false,
    },
    authority: {
      activationAuthorized: false,
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
    },
  }
  return Object.freeze({
    ...body,
    correctionRoot: sha256(
      `v138-plan262-post-run-audit-correction-v1\0${canonical(body)}`,
    ),
  })
}

export const validateV138PostRunAuditCorrection = (
  candidate: any,
  expected: any,
): true => {
  if (
    candidate?.schemaVersion !==
      "v1.38-plan-262-post-run-audit-correction-v1" ||
    candidate.correctionRoot !==
      computeV138PostRunAuditCorrectionRoot(candidate) ||
    canonical(candidate) !== canonical(expected) ||
    candidate.effectiveAssurance?.integrityPassed !== false ||
    candidate.effectiveAssurance?.supersedesHistoricalCleanConclusion !==
      true ||
    candidate.empiricalOutcome?.freshAccepted !== 0 ||
    candidate.empiricalOutcome?.requiredAccepted !== 540 ||
    Object.values(candidate.authority ?? {}).some((value) => value !== false)
  )
    fail("V138_AUDIT_CORRECTION_INVALID")
  return true
}

export const checkV138PostRunAuditCorrection = (root: string): any => {
  const bytes = readRegular(root, V138_POST_RUN_AUDIT_CORRECTION_PATH).toString(
    "utf8",
  )
  const candidate = JSON.parse(bytes)
  const expected = deriveV138PostRunAuditCorrection(root)
  if (bytes !== canonical(candidate)) fail("V138_AUDIT_CORRECTION_NONCANONICAL")
  validateV138PostRunAuditCorrection(candidate, expected)
  return candidate
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent")
    fail("V138_AUDIT_CORRECTION_DESTINATION_PRESENT")
  const fd = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(fd, bytes)
  } finally {
    closeSync(fd)
  }
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const argv = process.argv.slice(2)
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (argv.length === 1 && argv[0] === "--derive-no-publish") {
      const value = deriveV138PostRunAuditCorrection(repoRoot)
      process.stdout.write(
        canonical({
          status: value.effectiveAssurance.status,
          correctionRoot: value.correctionRoot,
          freshAccepted: 0,
          requiredAccepted: 540,
          downstreamAuthority: "denied",
        }),
      )
    } else if (argv.length === 1 && argv[0] === "--write-correction") {
      const value = deriveV138PostRunAuditCorrection(repoRoot)
      exclusiveWrite(
        path.resolve(repoRoot, V138_POST_RUN_AUDIT_CORRECTION_PATH),
        canonical(value),
      )
      process.stdout.write(
        canonical({
          status: value.effectiveAssurance.status,
          correctionRoot: value.correctionRoot,
          freshAccepted: 0,
          requiredAccepted: 540,
          downstreamAuthority: "denied",
        }),
      )
    } else if (argv.length === 1 && argv[0] === "--check-correction") {
      const value = checkV138PostRunAuditCorrection(repoRoot)
      process.stdout.write(
        canonical({
          status: "verified_integrity_non_pass",
          correctionRoot: value.correctionRoot,
          freshAccepted: 0,
          requiredAccepted: 540,
          downstreamAuthority: "denied",
        }),
      )
    } else fail("V138_AUDIT_CORRECTION_ARGUMENTS_INVALID")
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  }
}
