#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- the independent reviewer recomputes locked/current compatibility roots directly.
import {
  COMPATIBILITY_DIMENSIONS,
  LOCKED_V1_4_DIMENSION_ROOTS,
  LOCKED_V1_4_FIXTURE_HASHES,
  V1_4_COMPATIBILITY_CORPUS_VERSION,
  captureV14CompatibilityCorpus,
  hashCompatibilityDimensionRoots,
  hashCompatibilityValue,
  type CompatibilityDimension,
} from "../packages/engine/src/fixtures/v1-4-compatibility.ts"
// eslint-disable-next-line no-restricted-imports -- the independent reviewer binds the exact ordered corpus.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"
// eslint-disable-next-line no-restricted-imports -- independent trace admission uses the pure Plan-03 verifier.
import {
  compareCanonicalConformanceTrace,
  hashCanonicalConformanceTrace,
  type CanonicalConformanceTrace,
} from "../packages/golden/src/v1-37-conformance-trace.ts"
// eslint-disable-next-line no-restricted-imports -- use the existing canonical JSON codec.
import { encodeCanonicalJson, type JsonValue } from "../packages/spec/src/index.ts"
import type {
  V137ConformanceTraceCandidateManifest,
  V137ConformanceTraceProtectedCategory,
  V137ConformanceTraceSemanticDiff,
} from "./generate-v1-37-conformance-traces.js"

export const PROTECTED_V137_COMPATIBILITY_CATEGORIES = Object.freeze([
  "validV14State",
  "actionLegality",
  "eventOrder",
  "outcome",
  "terminalTimingReason",
  "strategyObservation",
  "historicalInterpretation",
] as const satisfies readonly V137ConformanceTraceProtectedCategory[])

export interface V137ConformanceTraceIndependentReview {
  readonly schemaVersion: "v1.37-conformance-trace-independent-review-v1"
  readonly reviewedBy: "scripts/review-v1-37-conformance-trace-diff.ts"
  readonly candidateVersion: string
  readonly corpusVersion: string
  readonly corpusRootSha256: string
  readonly semanticTupleId: string
  readonly candidateManifestSha256: string
  readonly claimedCandidateRootSha256: string
  readonly computedCandidateRootSha256: string
  readonly semanticDiffSha256: string
  readonly claimedSemanticDiffRootSha256: string
  readonly computedSemanticDiffRootSha256: string
  readonly caseCount: number
  readonly caseTraceRootsSha256: string
  readonly protectedCategories: Readonly<
    Record<
      V137ConformanceTraceProtectedCategory,
      {
        readonly baselineHash: string
        readonly candidateHash: string
        readonly recomputedCandidateHash: string
        readonly changeCount: number
      }
    >
  >
  readonly status: "no_semantic_delta" | "suspended_pending_approval"
}

export class V137ConformanceTraceReviewError extends Error {
  constructor(readonly code: string) {
    super(`Conformance trace independent review rejected: ${code}.`)
    this.name = "V137ConformanceTraceReviewError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceTraceReviewError(code)
}
const HASH = /^sha256:[0-9a-f]{64}$/u
const BASELINE_VERSION = "v1.4-locked-compatibility-v1" as const
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
const readJson = <T>(filePath: string): T =>
  JSON.parse(readFileSync(filePath, "utf8")) as T

const categoryDimensions: Readonly<
  Record<
    Exclude<V137ConformanceTraceProtectedCategory, "historicalInterpretation">,
    readonly CompatibilityDimension[]
  >
> = Object.freeze({
  validV14State: ["initialState", "intermediateStates", "finalState"],
  actionLegality: ["events", "failureTrace"],
  eventOrder: ["lifecycleCoordinates", "events"],
  outcome: ["outcome"],
  terminalTimingReason: ["terminalEventCount", "events"],
  strategyObservation: [
    "runtimeCalls",
    "strategyObservations",
    "soldierBrainObservations",
    "memoryHandoffs",
    "objectiveHandoffs",
  ],
})

const categoryRoots = ({
  dimensions,
  fixtures,
}: {
  readonly dimensions: Readonly<Record<CompatibilityDimension, string>>
  readonly fixtures: readonly [string, string][]
}): Readonly<Record<V137ConformanceTraceProtectedCategory, string>> => {
  const entries = Object.entries(categoryDimensions).map(
    ([category, selected]) => [
      category,
      hashCompatibilityValue(
        selected.map((dimension) => [dimension, dimensions[dimension]]),
      ),
    ],
  )
  entries.push([
    "historicalInterpretation",
    hashCompatibilityValue({
      corpusVersion: V1_4_COMPATIBILITY_CORPUS_VERSION,
      dimensions: COMPATIBILITY_DIMENSIONS.map((dimension) => [
        dimension,
        dimensions[dimension],
      ]),
      fixtures,
    }),
  ])
  return Object.freeze(
    Object.fromEntries(entries),
  ) as Readonly<Record<V137ConformanceTraceProtectedCategory, string>>
}

const recomputeCompatibility = (): {
  readonly baseline: Readonly<
    Record<V137ConformanceTraceProtectedCategory, string>
  >
  readonly candidate: Readonly<
    Record<V137ConformanceTraceProtectedCategory, string>
  >
} => {
  if (cachedCompatibility !== undefined) return cachedCompatibility
  const fixtures = captureV14CompatibilityCorpus()
  cachedCompatibility = {
    baseline: categoryRoots({
      dimensions: LOCKED_V1_4_DIMENSION_ROOTS,
      fixtures: Object.entries(LOCKED_V1_4_FIXTURE_HASHES),
    }),
    candidate: categoryRoots({
      dimensions: hashCompatibilityDimensionRoots(fixtures),
      fixtures: fixtures.map(({ name, overallHash }) => [name, overallHash]),
    }),
  }
  return cachedCompatibility
}

let cachedCompatibility:
  | {
      readonly baseline: Readonly<
        Record<V137ConformanceTraceProtectedCategory, string>
      >
      readonly candidate: Readonly<
        Record<V137ConformanceTraceProtectedCategory, string>
      >
    }
  | undefined

const computedManifestRoot = (
  manifest: V137ConformanceTraceCandidateManifest,
): string => {
  const { candidateRootSha256: _candidateRootSha256, ...material } = manifest
  return canonicalHash(
    "cowards-game:v1.37:conformance-trace-candidate:v1",
    material as unknown as JsonValue,
  )
}

const computedDiffRoot = (
  diff: V137ConformanceTraceSemanticDiff,
): string => {
  const { semanticDiffRootSha256: _semanticDiffRootSha256, ...material } = diff
  return canonicalHash(
    "cowards-game:v1.37:conformance-trace-semantic-diff:v1",
    material as unknown as JsonValue,
  )
}

const validateManifestShape = (
  manifest: V137ConformanceTraceCandidateManifest,
): void => {
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
    manifest.generatedBy !==
      "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.authoritySource !== "canonical-engine-kernel-recording" ||
    manifest.policy !== "candidate-only-no-live-lane-oracle-no-promotion" ||
    manifest.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    manifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    !HASH.test(manifest.candidateRootSha256) ||
    !exactKeys(manifest.compatibilityEvidence, [
      "baselineVersion",
      "candidateCorpusVersion",
      "protectedCategories",
    ]) ||
    manifest.compatibilityEvidence.baselineVersion !== BASELINE_VERSION ||
    !exactKeys(
      manifest.compatibilityEvidence.protectedCategories,
      PROTECTED_V137_COMPATIBILITY_CATEGORIES,
    )
  ) {
    fail("MANIFEST_SHAPE_INVALID")
  }
}

const validateDiffShape = (diff: V137ConformanceTraceSemanticDiff): void => {
  if (
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
    !exactKeys(
      diff.protectedCategories,
      PROTECTED_V137_COMPATIBILITY_CATEGORIES,
    )
  ) {
    fail("GENERATOR_SELF_DISPOSITION_FORBIDDEN")
  }
}

export const reviewV137ConformanceTraceDiff = ({
  candidateDirectory,
}: {
  readonly candidateDirectory: string
}): V137ConformanceTraceIndependentReview => {
  const directory = path.resolve(candidateDirectory)
  const manifestPath = path.join(directory, "manifest.json")
  const diffPath = path.join(directory, "semantic-diff.json")
  if (!existsSync(manifestPath) || !existsSync(diffPath)) {
    return fail("CANDIDATE_EVIDENCE_MISSING")
  }
  const manifest = readJson<V137ConformanceTraceCandidateManifest>(manifestPath)
  const diff = readJson<V137ConformanceTraceSemanticDiff>(diffPath)
  validateManifestShape(manifest)
  validateDiffShape(diff)
  const compatibility = recomputeCompatibility()
  const protectedCategories = Object.fromEntries(
    PROTECTED_V137_COMPATIBILITY_CATEGORIES.map((category) => {
      const claimed =
        manifest.compatibilityEvidence.protectedCategories[category]
      const recomputed = compatibility.candidate[category]
      const baseline = compatibility.baseline[category]
      return [
        category,
        {
          baselineHash: baseline,
          candidateHash: claimed,
          recomputedCandidateHash: recomputed,
          changeCount:
            claimed === baseline && recomputed === baseline && claimed === recomputed
              ? 0
              : 1,
        },
      ]
    }),
  ) as V137ConformanceTraceIndependentReview["protectedCategories"]
  const status = Object.values(protectedCategories).some(
    ({ changeCount }) => changeCount > 0,
  )
    ? "suspended_pending_approval"
    : "no_semantic_delta"

  const expectedCaseIds = V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)
  if (
    manifest.caseCount !== expectedCaseIds.length ||
    JSON.stringify(manifest.cases.map(({ caseId }) => caseId)) !==
      JSON.stringify(expectedCaseIds)
  ) {
    return fail("CASE_INVENTORY_INVALID")
  }
  const traceRoots: string[] = []
  for (const [ordinal, entry] of manifest.cases.entries()) {
    const tracePath = path.join(directory, entry.tracePath)
    if (
      entry.ordinal !== ordinal ||
      entry.caseId !== expectedCaseIds[ordinal] ||
      !existsSync(tracePath)
    ) {
      return fail("CASE_TRACE_MISSING")
    }
    const trace = readJson<CanonicalConformanceTrace>(tracePath)
    if (
      hashCanonicalConformanceTrace(trace) !== trace.traceRoot ||
      trace.traceRoot !== entry.traceRoot ||
      trace.caseId !== entry.caseId ||
      compareCanonicalConformanceTrace({ expected: trace, actual: trace })
        .status !== "equal"
    ) {
      return fail("CASE_TRACE_INVALID")
    }
    traceRoots.push(trace.traceRoot)
  }

  const computedCandidateRootSha256 = computedManifestRoot(manifest)
  const computedSemanticDiffRootSha256 = computedDiffRoot(diff)
  if (
    status === "no_semantic_delta" &&
    (computedCandidateRootSha256 !== manifest.candidateRootSha256 ||
      computedSemanticDiffRootSha256 !== diff.semanticDiffRootSha256 ||
      diff.candidateRootSha256 !== manifest.candidateRootSha256 ||
      diff.candidateVersion !== manifest.candidateVersion ||
      diff.corpusVersion !== manifest.corpusVersion ||
      diff.corpusRootSha256 !== manifest.corpusRootSha256 ||
      diff.caseDiffs.length !== manifest.cases.length)
  ) {
    return fail("INDEPENDENT_ROOT_RECOMPUTATION_FAILED")
  }

  return {
    schemaVersion: "v1.37-conformance-trace-independent-review-v1",
    reviewedBy: "scripts/review-v1-37-conformance-trace-diff.ts",
    candidateVersion: manifest.candidateVersion,
    corpusVersion: manifest.corpusVersion,
    corpusRootSha256: manifest.corpusRootSha256,
    semanticTupleId: manifest.semanticTupleId,
    candidateManifestSha256: sha256(readFileSync(manifestPath)),
    claimedCandidateRootSha256: manifest.candidateRootSha256,
    computedCandidateRootSha256,
    semanticDiffSha256: sha256(readFileSync(diffPath)),
    claimedSemanticDiffRootSha256: diff.semanticDiffRootSha256,
    computedSemanticDiffRootSha256,
    caseCount: manifest.cases.length,
    caseTraceRootsSha256: canonicalHash(
      "cowards-game:v1.37:conformance-trace-case-roots:v1",
      traceRoots as unknown as JsonValue,
    ),
    protectedCategories,
    status,
  }
}

export const writeV137ConformanceTraceIndependentReview = ({
  candidateDirectory,
  outputPath,
}: {
  readonly candidateDirectory: string
  readonly outputPath: string
}): V137ConformanceTraceIndependentReview => {
  const review = reviewV137ConformanceTraceDiff({ candidateDirectory })
  const absoluteOutput = path.resolve(outputPath)
  mkdirSync(path.dirname(absoluteOutput), { recursive: true })
  writeFileSync(absoluteOutput, renderJson(review))
  return review
}

const parseArgs = (
  args: readonly string[],
): {
  readonly candidateDirectory: string
  readonly outputPath: string
  readonly check: true
} => {
  const candidate = args.find((arg) => arg.startsWith("--candidate-dir="))
  const write = args.find((arg) => arg.startsWith("--write="))
  if (
    args.length !== 3 ||
    args.at(-1) !== "--check" ||
    candidate === undefined ||
    write === undefined
  ) {
    return fail("REVIEW_ARGUMENTS")
  }
  return {
    candidateDirectory: candidate.slice("--candidate-dir=".length),
    outputPath: write.slice("--write=".length),
    check: true,
  }
}

const main = (): void => {
  const args = parseArgs(process.argv.slice(2))
  const review = writeV137ConformanceTraceIndependentReview(args)
  if (readFileSync(path.resolve(args.outputPath), "utf8") !== renderJson(review)) {
    return fail("REVIEW_WRITE_CHECK_FAILED")
  }
  console.log(
    `v1.37 conformance trace review: ${review.status} root=${review.computedCandidateRootSha256}`,
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
