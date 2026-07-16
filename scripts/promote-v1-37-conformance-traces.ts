#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { checkV137ConformanceTraceCandidate } from "./check-v1-37-conformance-traces.js"
import { reviewV137ConformanceTraceDiff } from "./review-v1-37-conformance-trace-diff.js"

const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`
const sha256 = (bytes: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const HASH = /^sha256:[0-9a-f]{64}$/u
const VERSION = /^v[1-9][0-9A-Za-z.-]{0,127}$/u

export const V137_CONFORMANCE_TRACE_REGISTRY_SCHEMA =
  "v1.37-conformance-trace-registry-v1" as const
export const V137_CONFORMANCE_TRACE_DISPOSITION_SCHEMA =
  "v1.37-conformance-trace-compatibility-disposition-v1" as const

export interface V137ConformanceTraceCompatibilityApproval {
  readonly candidateRootSha256: `sha256:${string}`
  readonly semanticDiffRootSha256: `sha256:${string}`
  readonly independentReviewSha256: `sha256:${string}`
  readonly approvedBy: string
  readonly ruling: string
}

export interface V137ConformanceTraceCompatibilityDisposition {
  readonly schemaVersion: typeof V137_CONFORMANCE_TRACE_DISPOSITION_SCHEMA
  readonly candidateVersion: string
  readonly status: "no_semantic_delta" | "approved_compatibility_ruling"
  readonly candidateRootSha256: `sha256:${string}`
  readonly semanticDiffRootSha256: `sha256:${string}`
  readonly independentReviewSha256: `sha256:${string}`
  readonly approval: V137ConformanceTraceCompatibilityApproval | null
}

export interface V137ConformanceTraceActiveRegistry {
  readonly schemaVersion: typeof V137_CONFORMANCE_TRACE_REGISTRY_SCHEMA
  readonly activeVersion: string
  readonly activePath: string
  readonly candidateRootSha256: `sha256:${string}`
  readonly manifestSha256: `sha256:${string}`
  readonly semanticDiffSha256: `sha256:${string}`
  readonly independentReviewSha256: `sha256:${string}`
  readonly compatibilityDispositionSha256: `sha256:${string}`
  readonly caseCount: number
}

export class V137ConformanceTracePromotionError extends Error {
  constructor(readonly code: string) {
    super(`Conformance trace promotion rejected: ${code}.`)
    this.name = "V137ConformanceTracePromotionError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceTracePromotionError(code)
}

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === expected.length &&
  expected.every((key) => Object.hasOwn(value, key))

const readExactJson = (
  filePath: string,
): {
  readonly bytes: Buffer
  readonly value: unknown
} => {
  const stat = lstatSync(filePath)
  if (stat.isSymbolicLink() || !stat.isFile())
    return fail("EVIDENCE_NOT_REGULAR")
  const bytes = readFileSync(filePath)
  let value: unknown
  try {
    value = JSON.parse(bytes.toString("utf8"))
  } catch {
    return fail("EVIDENCE_INVALID_JSON")
  }
  if (bytes.toString("utf8") !== renderJson(value)) {
    return fail("EVIDENCE_NONCANONICAL_TEXT")
  }
  return { bytes, value }
}

const validateApproval = (
  approval: V137ConformanceTraceCompatibilityApproval | undefined,
  review: ReturnType<typeof reviewV137ConformanceTraceDiff>,
  reviewSha256: `sha256:${string}`,
): V137ConformanceTraceCompatibilityApproval => {
  if (
    approval === undefined ||
    !exactKeys(approval, [
      "candidateRootSha256",
      "semanticDiffRootSha256",
      "independentReviewSha256",
      "approvedBy",
      "ruling",
    ]) ||
    approval.candidateRootSha256 !== review.computedCandidateRootSha256 ||
    approval.semanticDiffRootSha256 !== review.computedSemanticDiffRootSha256 ||
    approval.independentReviewSha256 !== reviewSha256 ||
    typeof approval.approvedBy !== "string" ||
    approval.approvedBy.length < 1 ||
    approval.approvedBy.length > 256 ||
    typeof approval.ruling !== "string" ||
    approval.ruling.length < 1 ||
    approval.ruling.length > 4_096
  ) {
    return fail("EXACT_COMPATIBILITY_APPROVAL_REQUIRED")
  }
  return Object.freeze({ ...approval })
}

const buildDisposition = (
  review: ReturnType<typeof reviewV137ConformanceTraceDiff>,
  reviewSha256: `sha256:${string}`,
  approval?: V137ConformanceTraceCompatibilityApproval,
): V137ConformanceTraceCompatibilityDisposition => {
  if (review.status === "no_semantic_delta") {
    if (
      !Object.values(review.protectedCategories).every(
        ({ changeCount }) => changeCount === 0,
      ) ||
      approval !== undefined
    ) {
      return fail("NO_SEMANTIC_DELTA_DISPOSITION_INVALID")
    }
    return Object.freeze({
      schemaVersion: V137_CONFORMANCE_TRACE_DISPOSITION_SCHEMA,
      candidateVersion: review.candidateVersion,
      status: "no_semantic_delta",
      candidateRootSha256:
        review.computedCandidateRootSha256 as `sha256:${string}`,
      semanticDiffRootSha256:
        review.computedSemanticDiffRootSha256 as `sha256:${string}`,
      independentReviewSha256: reviewSha256,
      approval: null,
    })
  }
  return Object.freeze({
    schemaVersion: V137_CONFORMANCE_TRACE_DISPOSITION_SCHEMA,
    candidateVersion: review.candidateVersion,
    status: "approved_compatibility_ruling",
    candidateRootSha256:
      review.computedCandidateRootSha256 as `sha256:${string}`,
    semanticDiffRootSha256:
      review.computedSemanticDiffRootSha256 as `sha256:${string}`,
    independentReviewSha256: reviewSha256,
    approval: validateApproval(approval, review, reviewSha256),
  })
}

const activeRootFor = (repoRoot: string): string =>
  path.join(repoRoot, "packages/golden/src/fixtures/v1-37-conformance-traces")

export const promoteV137ConformanceTraceCandidate = (input: {
  readonly repoRoot: string
  readonly candidateDirectory: string
  readonly independentReviewPath: string
  readonly approval?: V137ConformanceTraceCompatibilityApproval
}): V137ConformanceTraceActiveRegistry => {
  const candidateDirectory = path.resolve(input.candidateDirectory)
  const errors = checkV137ConformanceTraceCandidate({ candidateDirectory })
  if (errors.length > 0) return fail("CANDIDATE_CHECK_FAILED")

  const manifest = readExactJson(path.join(candidateDirectory, "manifest.json"))
  const semanticDiff = readExactJson(
    path.join(candidateDirectory, "semantic-diff.json"),
  )
  const reviewEvidence = readExactJson(
    path.resolve(input.independentReviewPath),
  )
  const recomputedReview = reviewV137ConformanceTraceDiff({
    candidateDirectory,
  })
  if (
    reviewEvidence.bytes.toString("utf8") !== renderJson(recomputedReview) ||
    !exactKeys(manifest.value, [
      "schemaVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "generatedBy",
      "authoritySource",
      "recordingApi",
      "projectorApi",
      "policy",
      "caseCount",
      "cases",
      "compatibilityEvidence",
      "candidateRootSha256",
    ]) ||
    typeof manifest.value.candidateVersion !== "string" ||
    !VERSION.test(manifest.value.candidateVersion) ||
    manifest.value.candidateVersion !== recomputedReview.candidateVersion ||
    manifest.value.candidateRootSha256 !==
      recomputedReview.computedCandidateRootSha256 ||
    !exactKeys(semanticDiff.value, [
      "schemaVersion",
      "generatedBy",
      "baselineVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "candidateRootSha256",
      "caseDiffs",
      "protectedCategories",
      "semanticDiffRootSha256",
    ]) ||
    semanticDiff.value.semanticDiffRootSha256 !==
      recomputedReview.computedSemanticDiffRootSha256
  ) {
    return fail("INDEPENDENT_REVIEW_BINDING_MISMATCH")
  }

  const reviewSha256 = sha256(reviewEvidence.bytes)
  const disposition = buildDisposition(
    recomputedReview,
    reviewSha256,
    input.approval,
  )
  const dispositionBytes = Buffer.from(renderJson(disposition), "utf8")
  const activeRoot = activeRootFor(path.resolve(input.repoRoot))
  const targetDirectory = path.join(
    activeRoot,
    recomputedReview.candidateVersion,
  )
  const registryPath = path.join(activeRoot, "registry.json")
  if (existsSync(targetDirectory) || existsSync(registryPath)) {
    return fail("ACTIVE_EVIDENCE_IMMUTABLE")
  }

  mkdirSync(activeRoot, { recursive: true })
  const stagingDirectory = path.join(
    activeRoot,
    `.staging-${recomputedReview.candidateVersion}-${process.pid}`,
  )
  if (existsSync(stagingDirectory)) return fail("STAGING_PATH_EXISTS")
  try {
    cpSync(candidateDirectory, stagingDirectory, {
      recursive: true,
      dereference: false,
      errorOnExist: true,
      force: false,
    })
    const stagedReviewPath = path.join(
      stagingDirectory,
      "independent-review.json",
    )
    if (existsSync(stagedReviewPath)) {
      if (!readFileSync(stagedReviewPath).equals(reviewEvidence.bytes)) {
        return fail("INDEPENDENT_REVIEW_BINDING_MISMATCH")
      }
    } else {
      writeFileSync(stagedReviewPath, reviewEvidence.bytes, {
        flag: "wx",
        mode: 0o644,
      })
    }
    writeFileSync(
      path.join(stagingDirectory, "compatibility-disposition.json"),
      dispositionBytes,
      { flag: "wx", mode: 0o644 },
    )
    renameSync(stagingDirectory, targetDirectory)

    const registry: V137ConformanceTraceActiveRegistry = Object.freeze({
      schemaVersion: V137_CONFORMANCE_TRACE_REGISTRY_SCHEMA,
      activeVersion: recomputedReview.candidateVersion,
      activePath: path.posix.join(
        "packages/golden/src/fixtures/v1-37-conformance-traces",
        recomputedReview.candidateVersion,
      ),
      candidateRootSha256:
        recomputedReview.computedCandidateRootSha256 as `sha256:${string}`,
      manifestSha256: sha256(manifest.bytes),
      semanticDiffSha256: sha256(semanticDiff.bytes),
      independentReviewSha256: reviewSha256,
      compatibilityDispositionSha256: sha256(dispositionBytes),
      caseCount: recomputedReview.caseCount,
    })
    const temporaryRegistry = `${registryPath}.tmp-${process.pid}`
    writeFileSync(temporaryRegistry, renderJson(registry), {
      flag: "wx",
      mode: 0o644,
    })
    renameSync(temporaryRegistry, registryPath)
    return registry
  } catch (error) {
    if (existsSync(stagingDirectory)) {
      rmSync(stagingDirectory, { recursive: true, force: true })
    }
    if (existsSync(targetDirectory) && !existsSync(registryPath)) {
      rmSync(targetDirectory, { recursive: true, force: true })
    }
    throw error
  }
}

export const checkActiveV137ConformanceTrace = ({
  repoRoot,
}: {
  readonly repoRoot: string
}): string[] => {
  const activeRoot = activeRootFor(path.resolve(repoRoot))
  const errors: string[] = []
  let registryEvidence: ReturnType<typeof readExactJson>
  try {
    registryEvidence = readExactJson(path.join(activeRoot, "registry.json"))
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)]
  }
  const registry = registryEvidence.value
  if (
    !exactKeys(registry, [
      "schemaVersion",
      "activeVersion",
      "activePath",
      "candidateRootSha256",
      "manifestSha256",
      "semanticDiffSha256",
      "independentReviewSha256",
      "compatibilityDispositionSha256",
      "caseCount",
    ]) ||
    registry.schemaVersion !== V137_CONFORMANCE_TRACE_REGISTRY_SCHEMA ||
    typeof registry.activeVersion !== "string" ||
    !VERSION.test(registry.activeVersion) ||
    registry.activePath !==
      path.posix.join(
        "packages/golden/src/fixtures/v1-37-conformance-traces",
        registry.activeVersion,
      ) ||
    typeof registry.caseCount !== "number" ||
    !Number.isSafeInteger(registry.caseCount) ||
    registry.caseCount < 1 ||
    ![
      registry.candidateRootSha256,
      registry.manifestSha256,
      registry.semanticDiffSha256,
      registry.independentReviewSha256,
      registry.compatibilityDispositionSha256,
    ].every((value) => typeof value === "string" && HASH.test(value))
  ) {
    return ["active registry shape is invalid"]
  }
  const directory = path.join(activeRoot, registry.activeVersion)
  errors.push(
    ...checkV137ConformanceTraceCandidate({
      candidateDirectory: directory,
    }),
  )
  try {
    const manifest = readExactJson(path.join(directory, "manifest.json"))
    const semanticDiff = readExactJson(
      path.join(directory, "semantic-diff.json"),
    )
    const review = readExactJson(
      path.join(directory, "independent-review.json"),
    )
    const disposition = readExactJson(
      path.join(directory, "compatibility-disposition.json"),
    )
    const recomputedReview = reviewV137ConformanceTraceDiff({
      candidateDirectory: directory,
    })
    if (
      sha256(manifest.bytes) !== registry.manifestSha256 ||
      sha256(semanticDiff.bytes) !== registry.semanticDiffSha256 ||
      sha256(review.bytes) !== registry.independentReviewSha256 ||
      sha256(disposition.bytes) !== registry.compatibilityDispositionSha256 ||
      review.bytes.toString("utf8") !== renderJson(recomputedReview) ||
      registry.candidateRootSha256 !==
        recomputedReview.computedCandidateRootSha256 ||
      registry.caseCount !== recomputedReview.caseCount
    ) {
      errors.push("active evidence hash or independent review mismatch")
    }
    if (
      !exactKeys(disposition.value, [
        "schemaVersion",
        "candidateVersion",
        "status",
        "candidateRootSha256",
        "semanticDiffRootSha256",
        "independentReviewSha256",
        "approval",
      ]) ||
      disposition.value.schemaVersion !==
        V137_CONFORMANCE_TRACE_DISPOSITION_SCHEMA ||
      disposition.value.candidateVersion !== registry.activeVersion ||
      disposition.value.candidateRootSha256 !==
        recomputedReview.computedCandidateRootSha256 ||
      disposition.value.semanticDiffRootSha256 !==
        recomputedReview.computedSemanticDiffRootSha256 ||
      disposition.value.independentReviewSha256 !==
        registry.independentReviewSha256 ||
      (recomputedReview.status === "no_semantic_delta"
        ? disposition.value.status !== "no_semantic_delta" ||
          disposition.value.approval !== null
        : disposition.value.status !== "approved_compatibility_ruling" ||
          disposition.value.approval === null)
    ) {
      errors.push("active compatibility disposition mismatch")
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }
  return errors
}

const main = (): void => {
  const repoRootArgument = process.argv
    .slice(2)
    .find((argument) => argument.startsWith("--repo-root="))
  const candidateArgument = process.argv
    .slice(2)
    .find((argument) => argument.startsWith("--candidate-dir="))
  const reviewArgument = process.argv
    .slice(2)
    .find((argument) => argument.startsWith("--independent-review="))
  if (
    process.argv.slice(2).length !== 5 ||
    repoRootArgument === undefined ||
    candidateArgument === undefined ||
    reviewArgument === undefined ||
    !process.argv.includes("--promote") ||
    !process.argv.includes("--check")
  ) {
    return fail("PROMOTION_ARGUMENTS")
  }
  const registry = promoteV137ConformanceTraceCandidate({
    repoRoot: repoRootArgument.slice("--repo-root=".length),
    candidateDirectory: candidateArgument.slice("--candidate-dir=".length),
    independentReviewPath: reviewArgument.slice("--independent-review=".length),
  })
  const errors = checkActiveV137ConformanceTrace({
    repoRoot: repoRootArgument.slice("--repo-root=".length),
  })
  if (errors.length > 0) throw new Error(errors.join("\n"))
  console.log(
    `v1.37 conformance trace active: ${registry.activeVersion} root=${registry.candidateRootSha256}`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
