#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import type { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- checker binds the exact immutable compatibility corpus identity.
import { V1_4_COMPATIBILITY_CORPUS_VERSION } from "../packages/engine/src/fixtures/v1-4-compatibility.ts"
// eslint-disable-next-line no-restricted-imports -- repo-root checker binds the exact corpus authority.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"
// eslint-disable-next-line no-restricted-imports -- checker semantically admits every candidate trace.
import {
  compareCanonicalConformanceTrace,
  hashCanonicalConformanceTrace,
  type CanonicalConformanceTrace,
} from "../packages/golden/src/v1-37-conformance-trace.ts"
// eslint-disable-next-line no-restricted-imports -- checker binds the separately named inactive trace pin.
import { V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts"
// eslint-disable-next-line no-restricted-imports -- use the existing canonical JSON codec.
import {
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  encodeCanonicalJson,
  type JsonValue,
} from "../packages/spec/src/index.ts"
import {
  V137_CONFORMANCE_TRACE_BASELINE_VERSION,
  V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES,
  computeV137ConformanceTraceCandidateRoot,
  generateV137ObservationTraceV4Candidate,
  lockedV137CompatibilityCategoryRoots,
  type V137ConformanceTraceCandidateManifest,
  type V137ConformanceTraceSemanticDiff,
} from "./generate-v1-37-conformance-traces.js"
import { reviewV137ObservationTraceV4Candidate } from "./review-v1-37-conformance-trace-diff.js"

export class V137ConformanceTraceCheckError extends Error {
  constructor(readonly code: string) {
    super(`Conformance trace check rejected: ${code}.`)
    this.name = "V137ConformanceTraceCheckError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceTraceCheckError(code)
}
const HASH = /^sha256:[0-9a-f]{64}$/u
const VERSION = /^v[1-9][0-9A-Za-z.-]{0,127}$/u
const renderJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`
const sha256 = (value: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonicalHash = (domain: string, value: JsonValue): string => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) return fail("CANONICAL_JSON_INVALID")
  return `sha256:${createHash("sha256")
    .update(`${domain}\0`, "utf8")
    .update(encoded.bytes)
    .digest("hex")}`
}
const readRegularFileNoFollow = (filePath: string): Buffer | undefined => {
  let stat
  try {
    stat = lstatSync(filePath)
  } catch {
    return undefined
  }
  if (stat.isSymbolicLink() || !stat.isFile()) return undefined
  let descriptor: number | undefined
  try {
    descriptor = openSync(filePath, constants.O_RDONLY | constants.O_NOFOLLOW)
    return readFileSync(descriptor)
  } catch {
    return undefined
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}
const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false
  }
  const keys = Object.keys(value)
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  )
}

const expectedSemanticDiff = (
  manifest: V137ConformanceTraceCandidateManifest,
): V137ConformanceTraceSemanticDiff => {
  const baseline = lockedV137CompatibilityCategoryRoots()
  const candidate = manifest.compatibilityEvidence.protectedCategories
  const protectedCategories = Object.fromEntries(
    V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES.map((category) => [
      category,
      {
        baselineHash: baseline[category],
        candidateHash: candidate[category],
        changeCount: baseline[category] === candidate[category] ? 0 : 1,
      },
    ]),
  ) as V137ConformanceTraceSemanticDiff["protectedCategories"]
  const material = {
    schemaVersion: "v1.37-conformance-trace-semantic-diff-v1" as const,
    generatedBy: "scripts/generate-v1-37-conformance-traces.ts" as const,
    baselineVersion: V137_CONFORMANCE_TRACE_BASELINE_VERSION,
    candidateVersion: manifest.candidateVersion,
    corpusVersion: manifest.corpusVersion,
    corpusRootSha256: manifest.corpusRootSha256,
    candidateRootSha256: manifest.candidateRootSha256,
    caseDiffs: manifest.cases.map((entry) => ({
      ordinal: entry.ordinal,
      caseId: entry.caseId,
      baselineTraceRef: entry.traceRef,
      candidateTraceRoot: entry.traceRoot,
      resultClass: entry.resultClass,
    })),
    protectedCategories,
  }
  return {
    ...material,
    semanticDiffRootSha256: canonicalHash(
      "cowards-game:v1.37:conformance-trace-semantic-diff:v1",
      material as unknown as JsonValue,
    ),
  }
}

const manifestShapeValid = (
  manifest: V137ConformanceTraceCandidateManifest,
): boolean => {
  if (
    !exactKeys(manifest, [
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
    manifest.schemaVersion !== "v1.37-conformance-trace-candidate-v1" ||
    manifest.generatedBy !== "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.authoritySource !== "canonical-engine-kernel-recording" ||
    manifest.recordingApi !== "RecordedCanonicalTransitionV137" ||
    manifest.projectorApi !== "projectCanonicalConformanceTrace" ||
    manifest.policy !== "candidate-only-no-live-lane-oracle-no-promotion" ||
    !VERSION.test(manifest.candidateVersion) ||
    manifest.candidateVersion === V137_CONFORMANCE_TRACE_BASELINE_VERSION ||
    manifest.semanticTupleId !==
      CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId ||
    !Array.isArray(manifest.cases) ||
    !HASH.test(manifest.candidateRootSha256)
  ) {
    return false
  }
  const evidence = manifest.compatibilityEvidence
  return (
    exactKeys(evidence, [
      "baselineVersion",
      "candidateCorpusVersion",
      "protectedCategories",
    ]) &&
    evidence.baselineVersion === V137_CONFORMANCE_TRACE_BASELINE_VERSION &&
    evidence.candidateCorpusVersion === V1_4_COMPATIBILITY_CORPUS_VERSION &&
    exactKeys(
      evidence.protectedCategories,
      V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES,
    ) &&
    V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES.every((category) =>
      HASH.test(evidence.protectedCategories[category]),
    )
  )
}

export const checkV137ConformanceTraceCandidate = ({
  candidateDirectory,
}: {
  readonly candidateDirectory: string
}): string[] => {
  const directory = path.resolve(candidateDirectory)
  const errors: string[] = []
  try {
    const stat = lstatSync(directory)
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      return ["candidate directory must be a regular no-follow directory"]
    }
  } catch {
    return ["candidate directory must be a regular no-follow directory"]
  }
  const manifestPath = path.join(directory, "manifest.json")
  const diffPath = path.join(directory, "semantic-diff.json")
  const tracesDirectory = path.join(directory, "traces")
  const manifestBytes = readRegularFileNoFollow(manifestPath)
  const diffBytes = readRegularFileNoFollow(diffPath)
  let tracesDirectoryValid = false
  try {
    const stat = lstatSync(tracesDirectory)
    tracesDirectoryValid = stat.isDirectory() && !stat.isSymbolicLink()
  } catch {
    tracesDirectoryValid = false
  }
  if (
    manifestBytes === undefined ||
    diffBytes === undefined ||
    !tracesDirectoryValid
  ) {
    return [
      "regular no-follow candidate manifest, semantic diff, and traces directory are required",
    ]
  }
  let manifest: V137ConformanceTraceCandidateManifest
  try {
    manifest = JSON.parse(
      manifestBytes.toString("utf8"),
    ) as V137ConformanceTraceCandidateManifest
  } catch {
    return ["candidate manifest is invalid JSON"]
  }
  if (
    manifestBytes.toString("utf8") !== renderJson(manifest) ||
    !manifestShapeValid(manifest)
  ) {
    errors.push("candidate manifest shape or exact text is invalid")
    return errors
  }
  if (
    manifest.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    manifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    manifest.caseCount !== V1_37_CONFORMANCE_CORPUS.cases.length
  ) {
    errors.push("candidate corpus identity mismatch")
  }

  const expectedCaseIds = V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)
  const actualCaseIds = manifest.cases.map(({ caseId }) => caseId)
  if (JSON.stringify(actualCaseIds) !== JSON.stringify(expectedCaseIds)) {
    errors.push("candidate case inventory is missing, extra, or reordered")
  }
  const expectedTraceFiles = expectedCaseIds.map((caseId) => `${caseId}.json`)
  const actualTraceEntries = readdirSync(tracesDirectory, {
    withFileTypes: true,
  })
  const actualTraceFiles = actualTraceEntries.map(({ name }) => name).sort()
  if (
    actualTraceEntries.some((entry) => !entry.isFile()) ||
    JSON.stringify(actualTraceFiles) !== JSON.stringify(expectedTraceFiles)
  ) {
    errors.push("candidate trace files are missing or extra")
  }

  for (const [ordinal, entry] of manifest.cases.entries()) {
    const testCase = V1_37_CONFORMANCE_CORPUS.cases[ordinal]
    if (
      testCase === undefined ||
      !exactKeys(entry, [
        "ordinal",
        "caseId",
        "traceRef",
        "resultClass",
        "tracePath",
        "traceFileSha256",
        "traceRoot",
      ]) ||
      entry.ordinal !== ordinal ||
      entry.caseId !== expectedCaseIds[ordinal] ||
      entry.traceRef !== testCase.expectation.traceRef ||
      entry.resultClass !== testCase.expectation.resultClass ||
      entry.tracePath !== path.posix.join("traces", `${entry.caseId}.json`) ||
      !HASH.test(entry.traceFileSha256) ||
      !HASH.test(entry.traceRoot)
    ) {
      errors.push(`candidate case ${ordinal} identity is invalid`)
      continue
    }
    const tracePath = path.join(directory, entry.tracePath)
    const bytes = readRegularFileNoFollow(tracePath)
    if (bytes === undefined) {
      errors.push(`trace ${entry.caseId} is missing or non-regular`)
      continue
    }
    try {
      const trace = JSON.parse(
        bytes.toString("utf8"),
      ) as CanonicalConformanceTrace
      if (bytes.toString("utf8") !== renderJson(trace)) {
        errors.push(`trace ${entry.caseId} exact text is invalid`)
      }
      if (
        sha256(bytes) !== entry.traceFileSha256 ||
        trace.traceRoot !== entry.traceRoot ||
        hashCanonicalConformanceTrace(trace) !== trace.traceRoot ||
        trace.caseId !== entry.caseId ||
        trace.corpusVersion !== manifest.corpusVersion ||
        trace.corpusRootSha256 !== manifest.corpusRootSha256 ||
        trace.semanticTupleId !== manifest.semanticTupleId ||
        trace.resultClass !== entry.resultClass ||
        compareCanonicalConformanceTrace({ expected: trace, actual: trace })
          .status !== "equal"
      ) {
        errors.push(`trace ${entry.caseId} identity or semantics mismatch`)
      }
      if (testCase.expectation.resultClass === "success") {
        if (
          trace.failure !== null ||
          (testCase.executionMode === "raw-envelope"
            ? trace.transitions.length !== 0 ||
              trace.invocations.length === 0 ||
              trace.invocations.some(
                ({ gameplayMutation }) => gameplayMutation !== false,
              )
            : trace.transitions.length === 0)
        ) {
          errors.push(`trace ${entry.caseId} execution mode mismatch`)
        }
      } else if (
        trace.failure === null ||
        trace.failure.resultClass !== testCase.expectation.resultClass ||
        trace.failure.stableCode !== testCase.expectation.reasonCode ||
        trace.failure.failingBoundary !==
          testCase.expectation.failingBoundary ||
        trace.failure.gameplayMutation !==
          testCase.expectation.gameplayMutation ||
        trace.failure.retryable !== testCase.expectation.retryable
      ) {
        errors.push(`trace ${entry.caseId} failure identity mismatch`)
      }
    } catch {
      errors.push(`trace ${entry.caseId} is invalid`)
    }
  }
  if (
    computeV137ConformanceTraceCandidateRoot(manifest) !==
    manifest.candidateRootSha256
  ) {
    errors.push("candidate root mismatch")
  }

  try {
    const diff = JSON.parse(
      diffBytes.toString("utf8"),
    ) as V137ConformanceTraceSemanticDiff
    if (
      diffBytes.toString("utf8") !== renderJson(diff) ||
      !exactKeys(diff, [
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
      Object.keys(diff).some((key) =>
        /status|review|approval|approved|compatible|disposition/iu.test(key),
      ) ||
      JSON.stringify(diff) !== JSON.stringify(expectedSemanticDiff(manifest))
    ) {
      errors.push("semantic diff mismatch or self-disposition")
    }
  } catch {
    errors.push("semantic diff is invalid")
  }
  return errors
}

export const assertV137ConformanceTraceCheckArgs = (
  args: readonly string[],
): { readonly candidateDirectory: string; readonly check: true } => {
  if (
    args.length !== 2 ||
    args[1] !== "--check" ||
    !args[0]?.startsWith("--candidate-dir=")
  ) {
    return fail("READ_ONLY_CHECK_ARGUMENTS")
  }
  const candidateDirectory = args[0].slice("--candidate-dir=".length)
  if (candidateDirectory.length === 0) return fail("READ_ONLY_CHECK_ARGUMENTS")
  return { candidateDirectory, check: true }
}

export const assertV137ActiveConformanceTraceCheckArgs = (
  args: readonly string[],
): { readonly checkActive: true; readonly requireIndependentReview: true } => {
  if (
    args.length !== 2 ||
    args[0] !== "--check-active" ||
    args[1] !== "--require-independent-review"
  ) {
    return fail("READ_ONLY_ACTIVE_CHECK_ARGUMENTS")
  }
  return { checkActive: true, requireIndependentReview: true }
}

export const checkV137ObservationTraceV4Candidate = ({
  repoRoot,
}: {
  readonly repoRoot: string
}): string[] => {
  const candidateDirectory = path.join(
    repoRoot,
    "packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4",
  )
  const temporaryRoot = mkdtempSync(
    path.join(tmpdir(), "cowards-v137-observation-trace-check-"),
  )
  try {
    const regeneratedDirectory = path.join(temporaryRoot, "candidate")
    generateV137ObservationTraceV4Candidate({
      candidateDirectory: regeneratedDirectory,
    })
    const required = [
      "manifest.json",
      "traces.bundle.json",
      "semantic-diff.json",
      "compatibility-disposition.json",
    ] as const
    const errors: string[] = []
    for (const name of required) {
      const committed = readRegularFileNoFollow(
        path.join(candidateDirectory, name),
      )
      const regenerated = readRegularFileNoFollow(
        path.join(regeneratedDirectory, name),
      )
      if (
        committed === undefined ||
        regenerated === undefined ||
        !committed.equals(regenerated)
      ) {
        errors.push(`observation trace candidate ${name} is stale or invalid`)
      }
    }
    const reviewPath = path.join(candidateDirectory, "independent-review.json")
    const reviewBytes = readRegularFileNoFollow(reviewPath)
    if (reviewBytes === undefined) {
      errors.push("observation trace independent review is missing")
      return errors
    }
    let review: ReturnType<typeof reviewV137ObservationTraceV4Candidate>
    try {
      review = reviewV137ObservationTraceV4Candidate({ candidateDirectory })
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      return errors
    }
    if (reviewBytes.toString("utf8") !== renderJson(review)) {
      errors.push(
        "observation trace independent review is stale or self-authored",
      )
    }
    const pin = V1_37_OBSERVATION_TRACE_V4_CANDIDATE_PIN
    const pinFields = [
      "corpusRootSha256",
      "corpusCandidatePinFileSha256",
      "semanticTupleId",
      "candidateRootSha256",
      "manifestFileSha256",
      "bundleFileSha256",
      "bundleRootSha256",
      "semanticDiffFileSha256",
      "semanticDiffRootSha256",
      "compatibilityDispositionFileSha256",
      "compatibilityDispositionRootSha256",
      "caseCount",
      "caseTraceRootsSha256",
      "dispositionCoverageSha256",
      "protectedSurfaceRootsSha256",
    ] as const
    if (
      pin.lifecycle !== "inactive-candidate" ||
      pin.current !== false ||
      pin.candidateVersion !== review.candidateVersion ||
      pin.independentReviewFileSha256 !== sha256(reviewBytes) ||
      pin.activeRegistryFileSha256 !==
        sha256(
          readFileSync(
            path.join(
              repoRoot,
              "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
            ),
          ),
        ) ||
      pinFields.some((field) => pin[field] !== review[field])
    ) {
      errors.push("observation trace candidate pin is stale or promoted")
    }
    const closureValues = [
      review.corpusRootSha256,
      review.candidateRootSha256,
      review.manifestFileSha256,
      review.bundleFileSha256,
      review.bundleRootSha256,
      review.semanticDiffFileSha256,
      review.semanticDiffRootSha256,
      review.compatibilityDispositionFileSha256,
      review.compatibilityDispositionRootSha256,
      sha256(reviewBytes),
      review.caseTraceRootsSha256,
      review.dispositionCoverageSha256,
      review.protectedSurfaceRootsSha256,
    ]
    if (
      sha256(
        `cowards-game:v1.37:observation-trace-candidate-closure:v1\0${closureValues.join("\0")}`,
      ) !== pin.candidateClosureRootSha256
    ) {
      errors.push("observation trace candidate closure root is invalid")
    }
    return errors
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true })
  }
}

const main = async (): Promise<void> => {
  const rawArgs = process.argv.slice(2)
  if (rawArgs.length === 0) {
    const { checkActiveV137ConformanceTrace } =
      await import("./promote-v1-37-conformance-traces.js")
    const repoRoot = path.resolve(import.meta.dirname, "..")
    const errors = [
      ...checkActiveV137ConformanceTrace({ repoRoot }),
      ...checkV137ObservationTraceV4Candidate({ repoRoot }),
    ]
    if (errors.length > 0) throw new Error(errors.join("\n"))
    console.log(
      "v1.37 active conformance trace exact; observation trace v4 reviewed and inactive",
    )
    return
  }
  if (
    rawArgs.length === 1 &&
    rawArgs[0] === "--candidate=v1.37-observation-trace-v4"
  ) {
    const errors = checkV137ObservationTraceV4Candidate({
      repoRoot: path.resolve(import.meta.dirname, ".."),
    })
    if (errors.length > 0) throw new Error(errors.join("\n"))
    console.log("v1.37 observation trace v4 candidate exact and inactive")
    return
  }
  if (rawArgs[0] === "--check-active") {
    assertV137ActiveConformanceTraceCheckArgs(rawArgs)
    const { checkActiveV137ConformanceTrace } =
      await import("./promote-v1-37-conformance-traces.js")
    const errors = checkActiveV137ConformanceTrace({
      repoRoot: path.resolve(import.meta.dirname, ".."),
    })
    if (errors.length > 0) throw new Error(errors.join("\n"))
    console.log("v1.37 active conformance trace and independent review current")
    return
  }
  const args = assertV137ConformanceTraceCheckArgs(rawArgs)
  const errors = checkV137ConformanceTraceCandidate(args)
  if (errors.length > 0) throw new Error(errors.join("\n"))
  console.log(
    `v1.37 conformance trace candidate current: ${args.candidateDirectory}`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
