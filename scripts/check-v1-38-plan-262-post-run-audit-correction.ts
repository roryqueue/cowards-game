#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  lstatSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { deriveV138Plan26283NoPublish } from "./check-v1-38-plan-262-83-bounded-retry-source-rereview.js"

type Sha256 = `sha256:${string}`
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export const V138_POST_RUN_AUDIT_CORRECTION_PATH =
  ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v2.json"
export const V138_HISTORICAL_LIVE_RECEIPT_MANIFEST_PATH =
  ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v1.json"
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
  receiptManifestCommit: "fb1fdf8190714f08d2350eed88ee7e98077fadfc",
  plan83Commit: "f69bd27f1e5b8bb2b751230e9290d2956e06f454",
  plan80Commit: "a0b323784a96b19748867936dd06d18079db0ebb",
  oldPlan83Root:
    "sha256:9518cfcff11ba64029ff74f6e56e0c0448f82b5d0d63500dedf793f7ce85595c",
  oldPlan80Root:
    "sha256:5fe2dbf967971c6d69d619e91e8d838f5e6495ded3cc23889cf98f0b42dcccdf",
  fixedSourceCommits: [
    "63ddaf79dbff53357dbdded35d0e5ef85df84a7a",
    "91cffe9227c7a5ace81cb4b9414c6304987828ab",
    "087bab44d369131e49610fa64b675bc987686b09",
    "5f30280cab4167898841f097e0adefe247c59221",
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
  return sha256(`v138-plan262-post-run-audit-correction-v2\0${canonical(body)}`)
}

const historicalBlob = (root: string, commit: string, repoPath: string) => {
  const bytes = gitBytes(root, commit, repoPath)
  return Object.freeze({
    repoPath,
    gitBlob: git(root, ["rev-parse", `${commit}:${repoPath}`]),
    byteLength: bytes.length,
    sha256: sha256(bytes),
  })
}

export const computeV138HistoricalLiveReceiptManifestRoot = (
  candidate: any,
): Sha256 => {
  const body = JSON.parse(JSON.stringify(candidate))
  delete body.manifestRoot
  return sha256(
    `v138-plan262-historical-live-receipt-manifest-v1\0${canonical(body)}`,
  )
}

export const deriveV138HistoricalLiveReceiptManifest = (root: string): any => {
  requireAncestor(root, HISTORICAL.liveCommit)
  const receiptPaths = git(root, [
    "ls-tree",
    "-r",
    "--name-only",
    HISTORICAL.liveCommit,
    "--",
    PATHS.privateDir,
  ])
    .split("\n")
    .filter(Boolean)
    .sort()
  const receipts = receiptPaths.map((repoPath) =>
    historicalBlob(root, HISTORICAL.liveCommit, repoPath),
  )
  if (receipts.length !== 15) fail("V138_AUDIT_CORRECTION_RECEIPT_SET_INVALID")
  const body = {
    schemaVersion: "v1.38-plan-262-historical-live-receipt-manifest-v1",
    liveCommit: HISTORICAL.liveCommit,
    journal: historicalBlob(root, HISTORICAL.liveCommit, PATHS.journal),
    terminal: historicalBlob(root, HISTORICAL.liveCommit, PATHS.terminal),
    receipts,
    receiptCount: receipts.length,
    privateReceiptRoot: sha256(canonical(receipts)),
    empiricalOutcome: {
      terminalDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
    },
  }
  return Object.freeze({
    ...body,
    manifestRoot: computeV138HistoricalLiveReceiptManifestRoot(body),
  })
}

export const checkV138HistoricalLiveReceiptManifest = (root: string): any => {
  const bytes = readRegular(
    root,
    V138_HISTORICAL_LIVE_RECEIPT_MANIFEST_PATH,
  ).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138HistoricalLiveReceiptManifest(root)
  if (
    bytes !== canonical(candidate) ||
    candidate.manifestRoot !==
      computeV138HistoricalLiveReceiptManifestRoot(candidate) ||
    canonical(candidate) !== canonical(expected) ||
    !gitBytes(
      root,
      HISTORICAL.receiptManifestCommit,
      V138_HISTORICAL_LIVE_RECEIPT_MANIFEST_PATH,
    ).equals(Buffer.from(bytes))
  )
    fail("V138_AUDIT_CORRECTION_MANIFEST_INVALID")
  return candidate
}

const requireCurrentBlob = (
  root: string,
  commit: string,
  repoPath: string,
): Buffer => {
  const historical = gitBytes(root, commit, repoPath)
  if (!readRegular(root, repoPath).equals(historical))
    fail("V138_AUDIT_CORRECTION_HISTORICAL_BLOB_MISMATCH")
  return historical
}

export const deriveV138PostRunAuditCorrection = (root: string): any => {
  for (const commit of [
    HISTORICAL.sourceCommit,
    HISTORICAL.sealCommit,
    HISTORICAL.liveCommit,
    HISTORICAL.plan83Commit,
    HISTORICAL.plan80Commit,
    ...HISTORICAL.fixedSourceCommits,
  ])
    requireAncestor(root, commit)
  const sourceBlobs = SOURCE_PATHS.map((repoPath) => {
    const bytes = gitBytes(root, HISTORICAL.sourceCommit, repoPath)
    return { repoPath, byteLength: bytes.length, sha256: sha256(bytes) }
  })
  const manifest = checkV138HistoricalLiveReceiptManifest(root)
  for (const receipt of manifest.receipts)
    requireCurrentBlob(root, HISTORICAL.liveCommit, receipt.repoPath)
  const strengthened = deriveV138Plan26283NoPublish(root)
  const oldPlan83Bytes = requireCurrentBlob(
    root,
    HISTORICAL.plan83Commit,
    PATHS.plan83,
  )
  const oldPlan83 = JSON.parse(oldPlan83Bytes.toString("utf8"))
  const oldDispositionBytes = requireCurrentBlob(
    root,
    HISTORICAL.plan80Commit,
    PATHS.disposition,
  )
  const oldDisposition = JSON.parse(oldDispositionBytes.toString("utf8"))
  const sealBytes = requireCurrentBlob(root, HISTORICAL.sealCommit, PATHS.seal)
  const envelopeBytes = requireCurrentBlob(
    root,
    HISTORICAL.sealCommit,
    PATHS.envelope,
  )
  const journalBytes = requireCurrentBlob(
    root,
    HISTORICAL.liveCommit,
    PATHS.journal,
  )
  const terminalBytes = requireCurrentBlob(
    root,
    HISTORICAL.liveCommit,
    PATHS.terminal,
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
    schemaVersion: "v1.38-plan-262-post-run-audit-correction-v2",
    correctionKind: "additive_post_run_assurance_supersession",
    historical: {
      sourceCommit: HISTORICAL.sourceCommit,
      sourceBlobs,
      sealCommit: HISTORICAL.sealCommit,
      sealSha256: sha256(sealBytes),
      sealRoot: JSON.parse(sealBytes.toString("utf8")).sealRoot,
      envelopeSha256: sha256(envelopeBytes),
      envelopeRoot: JSON.parse(envelopeBytes.toString("utf8")).envelopeRoot,
      liveCommit: HISTORICAL.liveCommit,
      journalSha256: sha256(journalBytes),
      terminalSha256: sha256(terminalBytes),
      privateReceiptCount: manifest.receiptCount,
      privateReceiptRoot: manifest.privateReceiptRoot,
      receiptManifestPath: V138_HISTORICAL_LIVE_RECEIPT_MANIFEST_PATH,
      receiptManifestCommit: HISTORICAL.receiptManifestCommit,
      receiptManifestRoot: manifest.manifestRoot,
      oldPlan83ReviewRoot: oldPlan83.reviewRoot,
      oldPlan83Commit: HISTORICAL.plan83Commit,
      oldPlan83Sha256: sha256(oldPlan83Bytes),
      oldPlan80DispositionRoot: oldDisposition.dispositionRoot,
      oldPlan80Commit: HISTORICAL.plan80Commit,
      oldPlan80Sha256: sha256(oldDispositionBytes),
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
      `v138-plan262-post-run-audit-correction-v2\0${canonical(body)}`,
    ),
  })
}

export const validateV138PostRunAuditCorrection = (
  candidate: any,
  expected: any,
): true => {
  if (
    candidate?.schemaVersion !==
      "v1.38-plan-262-post-run-audit-correction-v2" ||
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
  const commits = git(root, [
    "log",
    "--format=%H",
    "--all",
    "--",
    V138_POST_RUN_AUDIT_CORRECTION_PATH,
  ])
    .split("\n")
    .filter(Boolean)
  if (
    commits.length !== 1 ||
    gitBytes(root, commits[0]!, V138_POST_RUN_AUDIT_CORRECTION_PATH).toString(
      "utf8",
    ) !== bytes ||
    git(root, [
      "status",
      "--porcelain",
      "--",
      V138_POST_RUN_AUDIT_CORRECTION_PATH,
    ]) !== ""
  )
    fail("V138_AUDIT_CORRECTION_PUBLICATION_LINEAGE_INVALID")
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
    if (argv.length === 1 && argv[0] === "--write-manifest") {
      const value = deriveV138HistoricalLiveReceiptManifest(repoRoot)
      exclusiveWrite(
        path.resolve(repoRoot, V138_HISTORICAL_LIVE_RECEIPT_MANIFEST_PATH),
        canonical(value),
      )
      process.stdout.write(
        canonical({
          status: "historical_live_receipts_manifested",
          manifestRoot: value.manifestRoot,
          receiptCount: value.receiptCount,
        }),
      )
    } else if (argv.length === 1 && argv[0] === "--derive-no-publish") {
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
