#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import type { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from "node:fs"
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
// eslint-disable-next-line no-restricted-imports -- independent review binds the exact inactive corpus candidate pin.
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts"
// eslint-disable-next-line no-restricted-imports -- independent trace admission uses the pure Plan-03 verifier.
import {
  compareCanonicalConformanceTrace,
  hashCanonicalConformanceTrace,
  type CanonicalConformanceTrace,
} from "../packages/golden/src/v1-37-conformance-trace.ts"
// eslint-disable-next-line no-restricted-imports -- use the existing canonical JSON codec.
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD,
  encodeCanonicalJson,
  type JsonValue,
} from "../packages/spec/src/index.ts"
import {
  reconstructV137ConformanceTrace,
  V137_CONFORMANCE_TRACE_REVIEW_ARTIFACT,
  type V137ConformanceTraceCandidateManifest,
  type V137ObservationTraceV4Bundle,
  type V137ObservationTraceV4Manifest,
  type V137ConformanceTraceProtectedCategory,
  type V137ConformanceTraceSemanticDiff,
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
const VERSION = /^v[1-9][0-9A-Za-z.-]{0,127}$/u
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
  return Object.freeze(Object.fromEntries(entries)) as Readonly<
    Record<V137ConformanceTraceProtectedCategory, string>
  >
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

let cachedExpectedTraces: readonly CanonicalConformanceTrace[] | undefined
const reconstructedExpectedTraces =
  (): readonly CanonicalConformanceTrace[] => {
    cachedExpectedTraces ??= Object.freeze(
      V1_37_CONFORMANCE_CORPUS.cases.map((testCase) =>
        reconstructV137ConformanceTrace(testCase),
      ),
    )
    return cachedExpectedTraces
  }

const computedManifestRoot = (
  manifest: V137ConformanceTraceCandidateManifest,
): string => {
  const { candidateRootSha256: _candidateRootSha256, ...material } = manifest
  return canonicalHash(
    "cowards-game:v1.37:conformance-trace-candidate:v1",
    material as unknown as JsonValue,
  )
}

const computedDiffRoot = (diff: V137ConformanceTraceSemanticDiff): string => {
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
    manifest.generatedBy !== "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.authoritySource !== "canonical-engine-kernel-recording" ||
    manifest.recordingApi !== "RecordedCanonicalTransitionV137" ||
    manifest.projectorApi !== "projectCanonicalConformanceTrace" ||
    manifest.policy !== "candidate-only-no-live-lane-oracle-no-promotion" ||
    !VERSION.test(manifest.candidateVersion) ||
    manifest.corpusVersion !== V1_37_CONFORMANCE_CORPUS.version ||
    manifest.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    manifest.semanticTupleId !==
      CURRENT_CANONICAL_COMPATIBILITY_TUPLE_RECORD.tupleId ||
    !HASH.test(manifest.candidateRootSha256) ||
    !exactKeys(manifest.compatibilityEvidence, [
      "baselineVersion",
      "candidateCorpusVersion",
      "protectedCategories",
    ]) ||
    manifest.compatibilityEvidence.baselineVersion !== BASELINE_VERSION ||
    manifest.compatibilityEvidence.candidateCorpusVersion !==
      V1_4_COMPATIBILITY_CORPUS_VERSION ||
    !exactKeys(
      manifest.compatibilityEvidence.protectedCategories,
      PROTECTED_V137_COMPATIBILITY_CATEGORIES,
    )
  ) {
    fail("MANIFEST_SHAPE_INVALID")
  }
}

const expectedSemanticDiff = (
  manifest: V137ConformanceTraceCandidateManifest,
): V137ConformanceTraceSemanticDiff => {
  const compatibility = recomputeCompatibility()
  const protectedCategories = Object.fromEntries(
    PROTECTED_V137_COMPATIBILITY_CATEGORIES.map((category) => [
      category,
      {
        baselineHash: compatibility.baseline[category],
        candidateHash:
          manifest.compatibilityEvidence.protectedCategories[category],
        changeCount:
          compatibility.baseline[category] ===
          manifest.compatibilityEvidence.protectedCategories[category]
            ? 0
            : 1,
      },
    ]),
  ) as V137ConformanceTraceSemanticDiff["protectedCategories"]
  const material = {
    schemaVersion: "v1.37-conformance-trace-semantic-diff-v1" as const,
    generatedBy: "scripts/generate-v1-37-conformance-traces.ts" as const,
    baselineVersion: BASELINE_VERSION,
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

const validateCaseTracePolicy = ({
  testCase,
  trace,
}: {
  readonly testCase: (typeof V1_37_CONFORMANCE_CORPUS.cases)[number]
  readonly trace: CanonicalConformanceTrace
}): void => {
  const expectation = testCase.expectation
  if (trace.resultClass !== expectation.resultClass) {
    return fail("CASE_RESULT_IDENTITY_INVALID")
  }
  if (expectation.resultClass === "success") {
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
      return fail("CASE_EXECUTION_MODE_INVALID")
    }
    return
  }
  const failure = trace.failure
  if (
    failure === null ||
    failure.resultClass !== expectation.resultClass ||
    failure.stableCode !== expectation.reasonCode ||
    failure.failingBoundary !== expectation.failingBoundary ||
    failure.gameplayMutation !== expectation.gameplayMutation ||
    failure.retryable !== expectation.retryable
  ) {
    return fail("CASE_FAILURE_IDENTITY_INVALID")
  }
}

const protectedTraceProjection = (
  category: V137ConformanceTraceProtectedCategory,
  trace: CanonicalConformanceTrace,
): JsonValue => {
  switch (category) {
    case "validV14State":
      return {
        caseId: trace.caseId,
        transitions: trace.transitions.map(
          ({ ordinal, beforeStateHash, afterStateHash }) => ({
            ordinal,
            beforeStateHash,
            afterStateHash,
          }),
        ),
        finalStateHash: trace.finalStateHash,
      } as JsonValue
    case "actionLegality":
      return {
        caseId: trace.caseId,
        resultClass: trace.resultClass,
        invocations: trace.invocations.map(
          ({
            ordinal,
            resultClass,
            stableCode,
            failingBoundary,
            gameplayMutation,
          }) => ({
            ordinal,
            resultClass,
            stableCode,
            failingBoundary,
            gameplayMutation,
          }),
        ),
        transitions: trace.transitions.map(
          ({ ordinal, kind, resultClass, failureStatus }) => ({
            ordinal,
            kind,
            resultClass,
            failureStatus,
          }),
        ),
        failure: trace.failure,
      } as unknown as JsonValue
    case "eventOrder":
      return {
        caseId: trace.caseId,
        transitions: trace.transitions.map(({ ordinal, orderedEvents }) => ({
          ordinal,
          orderedEvents,
        })),
      } as unknown as JsonValue
    case "outcome":
      return {
        caseId: trace.caseId,
        resultClass: trace.resultClass,
        outcomeHash: trace.outcomeHash,
      } as JsonValue
    case "terminalTimingReason":
      return {
        caseId: trace.caseId,
        transitions: trace.transitions.map(
          ({ ordinal, terminalStatus, terminalHash, orderedEvents }) => ({
            ordinal,
            terminalStatus,
            terminalHash,
            terminalEvents: orderedEvents.filter(
              ({ type }) => type === "MATCH_ENDED",
            ),
          }),
        ),
        failureTerminalEffectHash: trace.failure?.terminalEffectHash ?? null,
      } as unknown as JsonValue
    case "strategyObservation":
      return {
        caseId: trace.caseId,
        invocations: trace.invocations,
        transitions: trace.transitions.map(
          ({
            ordinal,
            canonicalOutputHash,
            strategyMemoryHash,
            soldierMemoryHash,
            objectiveHash,
          }) => ({
            ordinal,
            canonicalOutputHash,
            strategyMemoryHash,
            soldierMemoryHash,
            objectiveHash,
          }),
        ),
      } as unknown as JsonValue
    case "historicalInterpretation":
      return trace as unknown as JsonValue
  }
}

const protectedTraceRoot = (
  category: V137ConformanceTraceProtectedCategory,
  traces: readonly CanonicalConformanceTrace[],
): string =>
  canonicalHash(
    `cowards-game:v1.37:conformance-trace-protected:${category}:v1`,
    traces.map((trace) =>
      protectedTraceProjection(category, trace),
    ) as JsonValue,
  )

const protectedTraceChangeCount = (
  category: V137ConformanceTraceProtectedCategory,
  expected: readonly CanonicalConformanceTrace[],
  candidate: readonly CanonicalConformanceTrace[],
): number =>
  expected.reduce(
    (count, trace, index) =>
      canonicalHash(
        `cowards-game:v1.37:conformance-trace-protected-case:${category}:v1`,
        protectedTraceProjection(category, trace),
      ) ===
      canonicalHash(
        `cowards-game:v1.37:conformance-trace-protected-case:${category}:v1`,
        protectedTraceProjection(category, candidate[index]!),
      )
        ? count
        : count + 1,
    0,
  )

const combinedProtectedRoot = ({
  category,
  compatibilityRoot,
  traceRoot,
}: {
  readonly category: V137ConformanceTraceProtectedCategory
  readonly compatibilityRoot: string
  readonly traceRoot: string
}): string =>
  canonicalHash(
    `cowards-game:v1.37:conformance-trace-protected-combined:${category}:v1`,
    { compatibilityRoot, traceRoot },
  )

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
  let directoryStat
  try {
    directoryStat = lstatSync(directory)
  } catch {
    return fail("CANDIDATE_EVIDENCE_MISSING")
  }
  if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
    return fail("CANDIDATE_EVIDENCE_MISSING")
  }
  const manifestPath = path.join(directory, "manifest.json")
  const diffPath = path.join(directory, "semantic-diff.json")
  const manifestBytes = readRegularFileNoFollow(manifestPath)
  const diffBytes = readRegularFileNoFollow(diffPath)
  const tracesDirectory = path.join(directory, "traces")
  let tracesDirectoryStat
  try {
    tracesDirectoryStat = lstatSync(tracesDirectory)
  } catch {
    return fail("CANDIDATE_EVIDENCE_MISSING")
  }
  if (
    manifestBytes === undefined ||
    diffBytes === undefined ||
    tracesDirectoryStat.isSymbolicLink() ||
    !tracesDirectoryStat.isDirectory()
  ) {
    return fail("CANDIDATE_EVIDENCE_MISSING")
  }
  let manifest: V137ConformanceTraceCandidateManifest
  let diff: V137ConformanceTraceSemanticDiff
  try {
    manifest = JSON.parse(
      manifestBytes.toString("utf8"),
    ) as V137ConformanceTraceCandidateManifest
    diff = JSON.parse(
      diffBytes.toString("utf8"),
    ) as V137ConformanceTraceSemanticDiff
  } catch {
    return fail("CANDIDATE_EVIDENCE_MISSING")
  }
  validateManifestShape(manifest)
  validateDiffShape(diff)
  if (
    manifestBytes.toString("utf8") !== renderJson(manifest) ||
    diffBytes.toString("utf8") !== renderJson(diff)
  ) {
    return fail("CANDIDATE_EXACT_TEXT_INVALID")
  }
  const compatibility = recomputeCompatibility()

  const expectedCaseIds = V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)
  if (
    manifest.caseCount !== expectedCaseIds.length ||
    JSON.stringify(manifest.cases.map(({ caseId }) => caseId)) !==
      JSON.stringify(expectedCaseIds)
  ) {
    return fail("CASE_INVENTORY_INVALID")
  }
  if (
    readdirSync(tracesDirectory, { withFileTypes: true }).some(
      (entry) => !entry.isFile(),
    ) ||
    JSON.stringify(
      readdirSync(tracesDirectory, { withFileTypes: true })
        .map(({ name }) => name)
        .sort(),
    ) !== JSON.stringify(expectedCaseIds.map((caseId) => `${caseId}.json`))
  ) {
    return fail("CASE_FILE_INVENTORY_INVALID")
  }
  const traceRoots: string[] = []
  const expectedTraces: CanonicalConformanceTrace[] = []
  const candidateTraces: CanonicalConformanceTrace[] = []
  const reconstructedTraces = reconstructedExpectedTraces()
  for (const [ordinal, entry] of manifest.cases.entries()) {
    const testCase = V1_37_CONFORMANCE_CORPUS.cases[ordinal]!
    const tracePath = path.join(directory, entry.tracePath)
    const traceBytes = readRegularFileNoFollow(tracePath)
    if (
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
      !HASH.test(entry.traceRoot) ||
      traceBytes === undefined
    ) {
      return fail("CASE_TRACE_MISSING")
    }
    let trace: CanonicalConformanceTrace
    try {
      trace = JSON.parse(
        traceBytes.toString("utf8"),
      ) as CanonicalConformanceTrace
    } catch {
      return fail("CASE_TRACE_INVALID")
    }
    if (
      traceBytes.toString("utf8") !== renderJson(trace) ||
      sha256(traceBytes) !== entry.traceFileSha256 ||
      hashCanonicalConformanceTrace(trace) !== trace.traceRoot ||
      trace.traceRoot !== entry.traceRoot ||
      trace.caseId !== entry.caseId ||
      trace.corpusVersion !== manifest.corpusVersion ||
      trace.corpusRootSha256 !== manifest.corpusRootSha256 ||
      trace.semanticTupleId !== manifest.semanticTupleId ||
      trace.resultClass !== entry.resultClass ||
      compareCanonicalConformanceTrace({ expected: trace, actual: trace })
        .status !== "equal"
    ) {
      return fail("CASE_TRACE_INVALID")
    }
    validateCaseTracePolicy({ testCase, trace })
    const expectedTrace = reconstructedTraces[ordinal]!
    if (
      compareCanonicalConformanceTrace({
        expected: expectedTrace,
        actual: expectedTrace,
      }).status !== "equal"
    ) {
      return fail("EXPECTED_TRACE_RECONSTRUCTION_INVALID")
    }
    expectedTraces.push(expectedTrace)
    candidateTraces.push(trace)
    traceRoots.push(trace.traceRoot)
  }

  const computedCandidateRootSha256 = computedManifestRoot(manifest)
  const computedSemanticDiffRootSha256 = computedDiffRoot(diff)
  const expectedDiff = expectedSemanticDiff(manifest)
  if (
    computedCandidateRootSha256 !== manifest.candidateRootSha256 ||
    computedSemanticDiffRootSha256 !== diff.semanticDiffRootSha256 ||
    JSON.stringify(diff) !== JSON.stringify(expectedDiff)
  ) {
    return fail("INDEPENDENT_ROOT_RECOMPUTATION_FAILED")
  }

  const protectedCategories = Object.fromEntries(
    PROTECTED_V137_COMPATIBILITY_CATEGORIES.map((category) => {
      const claimedCompatibility =
        manifest.compatibilityEvidence.protectedCategories[category]
      const currentCompatibility = compatibility.candidate[category]
      const baselineCompatibility = compatibility.baseline[category]
      const expectedTraceRoot = protectedTraceRoot(category, expectedTraces)
      const candidateTraceRoot = protectedTraceRoot(category, candidateTraces)
      const compatibilityChange =
        claimedCompatibility === baselineCompatibility &&
        currentCompatibility === baselineCompatibility &&
        claimedCompatibility === currentCompatibility
          ? 0
          : 1
      return [
        category,
        {
          baselineHash: combinedProtectedRoot({
            category,
            compatibilityRoot: baselineCompatibility,
            traceRoot: expectedTraceRoot,
          }),
          candidateHash: combinedProtectedRoot({
            category,
            compatibilityRoot: claimedCompatibility,
            traceRoot: candidateTraceRoot,
          }),
          recomputedCandidateHash: combinedProtectedRoot({
            category,
            compatibilityRoot: currentCompatibility,
            traceRoot: candidateTraceRoot,
          }),
          changeCount:
            compatibilityChange +
            protectedTraceChangeCount(
              category,
              expectedTraces,
              candidateTraces,
            ),
        },
      ]
    }),
  ) as V137ConformanceTraceIndependentReview["protectedCategories"]
  const status = Object.values(protectedCategories).some(
    ({ changeCount }) => changeCount > 0,
  )
    ? "suspended_pending_approval"
    : "no_semantic_delta"

  return {
    schemaVersion: "v1.37-conformance-trace-independent-review-v1",
    reviewedBy: "scripts/review-v1-37-conformance-trace-diff.ts",
    candidateVersion: manifest.candidateVersion,
    corpusVersion: manifest.corpusVersion,
    corpusRootSha256: manifest.corpusRootSha256,
    semanticTupleId: manifest.semanticTupleId,
    candidateManifestSha256: sha256(manifestBytes),
    claimedCandidateRootSha256: manifest.candidateRootSha256,
    computedCandidateRootSha256,
    semanticDiffSha256: sha256(diffBytes),
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
  const candidateRealPath = realpathSync(path.resolve(candidateDirectory))
  const absoluteOutput = path.resolve(outputPath)
  const normalizedOutput = path.join(
    realpathSync(path.dirname(absoluteOutput)),
    path.basename(absoluteOutput),
  )
  const candidateLocalOutput = path.join(
    candidateRealPath,
    "independent-review.json",
  )
  const artifactOutput = path.join(
    realpathSync(path.dirname(V137_CONFORMANCE_TRACE_REVIEW_ARTIFACT)),
    path.basename(V137_CONFORMANCE_TRACE_REVIEW_ARTIFACT),
  )
  if (
    normalizedOutput !== artifactOutput &&
    normalizedOutput !== candidateLocalOutput
  ) {
    return fail("REVIEW_OUTPUT_PATH_FORBIDDEN")
  }
  const bytes = renderJson(review)
  let outputStat
  try {
    outputStat = lstatSync(normalizedOutput)
  } catch {
    outputStat = undefined
  }
  if (outputStat !== undefined) {
    if (outputStat.isSymbolicLink() || !outputStat.isFile()) {
      return fail("REVIEW_OUTPUT_PATH_FORBIDDEN")
    }
    if (readRegularFileNoFollow(normalizedOutput)?.toString("utf8") !== bytes) {
      return fail("REVIEW_OUTPUT_IMMUTABLE")
    }
    return review
  }
  const descriptor = openSync(
    normalizedOutput,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      constants.O_NOFOLLOW,
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  return review
}

export interface V137ObservationTraceV4IndependentReview {
  readonly schemaVersion: "v1.37-observation-trace-independent-review-v1"
  readonly reviewedBy: "scripts/review-v1-37-conformance-trace-diff.ts"
  readonly generatedBy: "scripts/generate-v1-37-conformance-traces.ts"
  readonly candidateVersion: "v1.37-observation-trace-v4"
  readonly lifecycle: "inactive-candidate"
  readonly current: false
  readonly corpusCandidateVersion: "v3"
  readonly corpusRootSha256: string
  readonly corpusCandidatePinFileSha256: string
  readonly semanticTupleId: string
  readonly candidateRootSha256: string
  readonly manifestFileSha256: string
  readonly bundleFileSha256: string
  readonly bundleRootSha256: string
  readonly semanticDiffFileSha256: string
  readonly semanticDiffRootSha256: string
  readonly compatibilityDispositionFileSha256: string
  readonly compatibilityDispositionRootSha256: string
  readonly caseCount: number
  readonly caseTraceRootsSha256: string
  readonly dispositionCoverageSha256: string
  readonly protectedSurfaceRootsSha256: string
  readonly status: "approved-inactive-observation-candidate"
}

const observationExactJsonHash = (domain: string, value: unknown): string =>
  sha256(`${domain}\0${renderJson(JSON.parse(JSON.stringify(value)))}`)

const parseExactObservationJson = <T>(
  candidateDirectory: string,
  name: string,
): { readonly value: T; readonly bytes: Buffer } => {
  const bytes = readRegularFileNoFollow(path.join(candidateDirectory, name))
  if (bytes === undefined) return fail("OBSERVATION_EVIDENCE_MISSING")
  let value: T
  try {
    value = JSON.parse(bytes.toString("utf8")) as T
  } catch {
    return fail("OBSERVATION_EVIDENCE_INVALID")
  }
  if (bytes.toString("utf8") !== renderJson(value)) {
    return fail("OBSERVATION_EXACT_TEXT_INVALID")
  }
  return { value, bytes }
}

const validateObservationBundleRecord = ({
  record,
  ordinal,
  manifestCase,
}: {
  readonly record: V137ObservationTraceV4Bundle["records"][number]
  readonly ordinal: number
  readonly manifestCase: V137ObservationTraceV4Manifest["cases"][number]
}): void => {
  const expectedCase =
    V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots[ordinal]
  if (
    expectedCase === undefined ||
    !exactKeys(record, [
      "ordinal",
      "caseId",
      "traceRef",
      "resultClass",
      "canonicalInput",
      "trace",
      "evidence",
      "traceRoot",
    ]) ||
    record.ordinal !== ordinal ||
    record.caseId !== expectedCase.caseId ||
    record.traceRef !== `trace:${record.caseId}` ||
    record.traceRoot !== record.trace.traceRoot ||
    record.traceRoot !== manifestCase.traceRoot ||
    record.resultClass !== manifestCase.resultClass ||
    record.trace.caseId !== record.caseId ||
    record.trace.corpusVersion !== "v3" ||
    record.trace.corpusRootSha256 !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256 ||
    record.trace.semanticTupleId !== CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID ||
    record.trace.resultClass !== record.resultClass ||
    hashCanonicalConformanceTrace(record.trace) !== record.traceRoot ||
    compareCanonicalConformanceTrace({
      expected: record.trace,
      actual: record.trace,
    }).status !== "equal"
  ) {
    return fail("OBSERVATION_BUNDLE_CASE_INVALID")
  }
  if (
    record.canonicalInput === null ||
    typeof record.canonicalInput !== "object" ||
    record.evidence === null ||
    typeof record.evidence !== "object"
  ) {
    return fail("OBSERVATION_BUNDLE_EVIDENCE_INVALID")
  }
  const evidence = record.evidence as Record<string, unknown>
  if (
    !exactKeys(evidence, [
      "states",
      "events",
      "memories",
      "objectives",
      "terminal",
      "failure",
    ]) ||
    JSON.stringify(evidence.failure) !== JSON.stringify(record.trace.failure)
  ) {
    return fail("OBSERVATION_BUNDLE_EVIDENCE_INVALID")
  }
}

export const reviewV137ObservationTraceV4Candidate = ({
  candidateDirectory,
}: {
  readonly candidateDirectory: string
}): V137ObservationTraceV4IndependentReview => {
  const directory = path.resolve(candidateDirectory)
  let directoryStat
  try {
    directoryStat = lstatSync(directory)
  } catch {
    return fail("OBSERVATION_EVIDENCE_MISSING")
  }
  if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
    return fail("OBSERVATION_EVIDENCE_MISSING")
  }
  const manifestInput =
    parseExactObservationJson<V137ObservationTraceV4Manifest>(
      directory,
      "manifest.json",
    )
  const bundleInput = parseExactObservationJson<V137ObservationTraceV4Bundle>(
    directory,
    "traces.bundle.json",
  )
  const diffInput = parseExactObservationJson<Record<string, unknown>>(
    directory,
    "semantic-diff.json",
  )
  const dispositionInput = parseExactObservationJson<Record<string, unknown>>(
    directory,
    "compatibility-disposition.json",
  )
  const { value: manifest } = manifestInput
  const { value: bundle } = bundleInput
  if (
    !exactKeys(manifest, [
      "schemaVersion",
      "candidateVersion",
      "lifecycle",
      "current",
      "generatedBy",
      "policy",
      "corpusCandidateVersion",
      "corpusRootSha256",
      "corpusFileSha256",
      "corpusCandidatePinPath",
      "corpusCandidatePinFileSha256",
      "semanticTupleId",
      "bundlePath",
      "bundleFileSha256",
      "bundleRootSha256",
      "semanticDiffPath",
      "semanticDiffFileSha256",
      "semanticDiffRootSha256",
      "compatibilityDispositionPath",
      "compatibilityDispositionFileSha256",
      "compatibilityDispositionRootSha256",
      "caseCount",
      "cases",
      "candidateRootSha256",
    ]) ||
    manifest.schemaVersion !== "v1.37-observation-trace-candidate-v4" ||
    manifest.candidateVersion !== "v1.37-observation-trace-v4" ||
    manifest.lifecycle !== "inactive-candidate" ||
    manifest.current !== false ||
    manifest.generatedBy !== "scripts/generate-v1-37-conformance-traces.ts" ||
    manifest.policy !== "candidate-only-plan-14-atomic-promotion" ||
    manifest.corpusCandidateVersion !== "v3" ||
    manifest.corpusRootSha256 !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256 ||
    manifest.corpusFileSha256 !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusFileSha256 ||
    manifest.semanticTupleId !== CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID ||
    manifest.bundlePath !== "traces.bundle.json" ||
    manifest.semanticDiffPath !== "semantic-diff.json" ||
    manifest.compatibilityDispositionPath !==
      "compatibility-disposition.json" ||
    manifest.caseCount !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots.length ||
    manifest.caseCount !== manifest.cases.length
  ) {
    return fail("OBSERVATION_MANIFEST_INVALID")
  }
  const { candidateRootSha256: _candidateRootSha256, ...manifestMaterial } =
    manifest
  if (
    canonicalHash(
      "cowards-game:v1.37:observation-trace-candidate:v4",
      manifestMaterial as unknown as JsonValue,
    ) !== manifest.candidateRootSha256 ||
    sha256(bundleInput.bytes) !== manifest.bundleFileSha256 ||
    sha256(diffInput.bytes) !== manifest.semanticDiffFileSha256 ||
    sha256(dispositionInput.bytes) !==
      manifest.compatibilityDispositionFileSha256
  ) {
    return fail("OBSERVATION_ROOT_MISMATCH")
  }
  if (
    !exactKeys(bundle, [
      "schemaVersion",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "caseCount",
      "records",
      "bundleRootSha256",
    ]) ||
    bundle.schemaVersion !== "v1.37-observation-trace-bundle-v1" ||
    bundle.candidateVersion !== manifest.candidateVersion ||
    bundle.corpusVersion !== "v3" ||
    bundle.corpusRootSha256 !== manifest.corpusRootSha256 ||
    bundle.semanticTupleId !== manifest.semanticTupleId ||
    bundle.caseCount !== manifest.caseCount ||
    bundle.records.length !== manifest.caseCount
  ) {
    return fail("OBSERVATION_BUNDLE_INVALID")
  }
  const { bundleRootSha256: _bundleRootSha256, ...bundleMaterial } = bundle
  const recomputedBundleRoot = observationExactJsonHash(
    "cowards-game:v1.37:observation-trace-bundle:exact-json:v1",
    bundleMaterial,
  )
  if (
    recomputedBundleRoot !== bundle.bundleRootSha256 ||
    bundle.bundleRootSha256 !== manifest.bundleRootSha256
  ) {
    return fail("OBSERVATION_ROOT_MISMATCH")
  }
  for (const [ordinal, record] of bundle.records.entries()) {
    const manifestCase = manifest.cases[ordinal]
    if (
      manifestCase === undefined ||
      !exactKeys(manifestCase, [
        "ordinal",
        "caseId",
        "resultClass",
        "traceRoot",
      ]) ||
      manifestCase.ordinal !== ordinal ||
      manifestCase.caseId !== record.caseId
    ) {
      return fail("OBSERVATION_CASE_COVERAGE_INVALID")
    }
    validateObservationBundleRecord({ record, ordinal, manifestCase })
  }

  const diff = diffInput.value
  const disposition = dispositionInput.value
  const caseDiffs = diff.caseDiffs
  const dispositionCases = disposition.cases
  const protectedSurfaces = disposition.protectedSurfaces
  if (
    diff.schemaVersion !== "v1.37-observation-trace-semantic-diff-v1" ||
    diff.generatedBy !== "scripts/generate-v1-37-conformance-traces.ts" ||
    diff.candidateVersion !== manifest.candidateVersion ||
    diff.bundleRootSha256 !== bundle.bundleRootSha256 ||
    diff.caseCount !== manifest.caseCount ||
    !Array.isArray(caseDiffs) ||
    caseDiffs.length !== manifest.caseCount ||
    disposition.schemaVersion !==
      "v1.37-observation-trace-compatibility-disposition-v1" ||
    disposition.candidateVersion !== manifest.candidateVersion ||
    disposition.lifecycle !== "inactive-candidate" ||
    disposition.current !== false ||
    disposition.status !== "observation-only-compatible-candidate" ||
    disposition.caseCount !== manifest.caseCount ||
    !Array.isArray(dispositionCases) ||
    dispositionCases.length !== manifest.caseCount ||
    disposition.approval !== null ||
    protectedSurfaces === null ||
    typeof protectedSurfaces !== "object" ||
    Array.isArray(protectedSurfaces)
  ) {
    return fail("OBSERVATION_DISPOSITION_COVERAGE_INVALID")
  }
  const { semanticDiffRootSha256: _diffRoot, ...diffMaterial } = diff
  const {
    compatibilityDispositionRootSha256: _dispositionRoot,
    ...dispositionMaterial
  } = disposition
  const diffRoot = observationExactJsonHash(
    "cowards-game:v1.37:observation-trace-semantic-diff:v1",
    diffMaterial,
  )
  const dispositionRoot = observationExactJsonHash(
    "cowards-game:v1.37:observation-trace-compatibility-disposition:v1",
    dispositionMaterial,
  )
  if (
    diffRoot !== diff.semanticDiffRootSha256 ||
    diffRoot !== manifest.semanticDiffRootSha256 ||
    dispositionRoot !== disposition.compatibilityDispositionRootSha256 ||
    dispositionRoot !== manifest.compatibilityDispositionRootSha256
  ) {
    return fail("OBSERVATION_ROOT_MISMATCH")
  }
  for (const [ordinal, manifestCase] of manifest.cases.entries()) {
    const caseDiff = caseDiffs[ordinal] as Record<string, unknown> | undefined
    const caseDisposition = dispositionCases[ordinal] as
      | Record<string, unknown>
      | undefined
    if (
      caseDiff === undefined ||
      caseDisposition === undefined ||
      caseDiff.ordinal !== ordinal ||
      caseDisposition.ordinal !== ordinal ||
      caseDiff.caseId !== manifestCase.caseId ||
      caseDisposition.caseId !== manifestCase.caseId ||
      caseDiff.candidateTraceRoot !== manifestCase.traceRoot ||
      caseDisposition.candidateTraceRoot !== manifestCase.traceRoot ||
      caseDiff.baselineTraceRoot !== caseDisposition.baselineTraceRoot ||
      caseDiff.disposition !== caseDisposition.disposition
    ) {
      return fail("OBSERVATION_DISPOSITION_COVERAGE_INVALID")
    }
  }
  const expectedSurfaces = [
    "gameplayState",
    "actionLegality",
    "eventOrder",
    "cleanup",
    "terminalTimingReason",
    "outcome",
    "backstab",
    "arenaGeometry",
    "historicalInterpretation",
    "failureOwnership",
  ]
  if (!exactKeys(protectedSurfaces, expectedSurfaces)) {
    return fail("OBSERVATION_DISPOSITION_COVERAGE_INVALID")
  }
  for (const surface of expectedSurfaces) {
    const value = protectedSurfaces[surface]
    if (
      !exactKeys(value, [
        "baselineRoot",
        "candidateRoot",
        "changeCount",
        "disposition",
      ]) ||
      value.baselineRoot !== value.candidateRoot ||
      value.changeCount !== 0 ||
      value.disposition !== "unchanged" ||
      typeof value.baselineRoot !== "string" ||
      !HASH.test(value.baselineRoot)
    ) {
      return fail("OBSERVATION_UNAPPROVED_SEMANTIC_DELTA")
    }
  }

  return {
    schemaVersion: "v1.37-observation-trace-independent-review-v1",
    reviewedBy: "scripts/review-v1-37-conformance-trace-diff.ts",
    generatedBy: "scripts/generate-v1-37-conformance-traces.ts",
    candidateVersion: "v1.37-observation-trace-v4",
    lifecycle: "inactive-candidate",
    current: false,
    corpusCandidateVersion: "v3",
    corpusRootSha256: manifest.corpusRootSha256,
    corpusCandidatePinFileSha256: manifest.corpusCandidatePinFileSha256,
    semanticTupleId: manifest.semanticTupleId,
    candidateRootSha256: manifest.candidateRootSha256,
    manifestFileSha256: sha256(manifestInput.bytes),
    bundleFileSha256: sha256(bundleInput.bytes),
    bundleRootSha256: bundle.bundleRootSha256,
    semanticDiffFileSha256: sha256(diffInput.bytes),
    semanticDiffRootSha256: diffRoot,
    compatibilityDispositionFileSha256: sha256(dispositionInput.bytes),
    compatibilityDispositionRootSha256: dispositionRoot,
    caseCount: manifest.caseCount,
    caseTraceRootsSha256: canonicalHash(
      "cowards-game:v1.37:observation-trace-case-roots:v1",
      manifest.cases.map(({ caseId, traceRoot }) => ({
        caseId,
        traceRoot,
      })) as unknown as JsonValue,
    ),
    dispositionCoverageSha256: canonicalHash(
      "cowards-game:v1.37:observation-trace-disposition-coverage:v1",
      dispositionCases as JsonValue,
    ),
    protectedSurfaceRootsSha256: canonicalHash(
      "cowards-game:v1.37:observation-trace-protected-surfaces:v1",
      protectedSurfaces as JsonValue,
    ),
    status: "approved-inactive-observation-candidate",
  }
}

export const writeV137ObservationTraceV4IndependentReview = ({
  candidateDirectory,
  outputPath,
}: {
  readonly candidateDirectory: string
  readonly outputPath: string
}): V137ObservationTraceV4IndependentReview => {
  const review = reviewV137ObservationTraceV4Candidate({ candidateDirectory })
  const candidateRealPath = realpathSync(path.resolve(candidateDirectory))
  const absoluteOutput = path.resolve(outputPath)
  const normalizedOutput = path.join(
    realpathSync(path.dirname(absoluteOutput)),
    path.basename(absoluteOutput),
  )
  if (
    normalizedOutput !== path.join(candidateRealPath, "independent-review.json")
  ) {
    return fail("OBSERVATION_REVIEW_OUTPUT_FORBIDDEN")
  }
  const bytes = renderJson(review)
  const existing = readRegularFileNoFollow(normalizedOutput)
  if (existing !== undefined) {
    if (existing.toString("utf8") !== bytes) {
      return fail("OBSERVATION_REVIEW_STALE_OR_SELF_AUTHORED")
    }
    return review
  }
  const descriptor = openSync(
    normalizedOutput,
    constants.O_CREAT |
      constants.O_EXCL |
      constants.O_WRONLY |
      constants.O_NOFOLLOW,
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
  return review
}

export const checkV137ConformanceTraceCheckpointDisposition = (
  reviewPath: string,
): "no_semantic_delta" => {
  const bytes = readRegularFileNoFollow(path.resolve(reviewPath))
  if (bytes === undefined) return fail("CHECKPOINT_REVIEW_NOT_REGULAR")
  let review: V137ConformanceTraceIndependentReview
  try {
    review = JSON.parse(
      bytes.toString("utf8"),
    ) as V137ConformanceTraceIndependentReview
  } catch {
    return fail("CHECKPOINT_REVIEW_INVALID")
  }
  if (
    bytes.toString("utf8") !== renderJson(review) ||
    !exactKeys(review, [
      "schemaVersion",
      "reviewedBy",
      "candidateVersion",
      "corpusVersion",
      "corpusRootSha256",
      "semanticTupleId",
      "candidateManifestSha256",
      "claimedCandidateRootSha256",
      "computedCandidateRootSha256",
      "semanticDiffSha256",
      "claimedSemanticDiffRootSha256",
      "computedSemanticDiffRootSha256",
      "caseCount",
      "caseTraceRootsSha256",
      "protectedCategories",
      "status",
    ]) ||
    review.schemaVersion !== "v1.37-conformance-trace-independent-review-v1" ||
    review.reviewedBy !== "scripts/review-v1-37-conformance-trace-diff.ts" ||
    !exactKeys(
      review.protectedCategories,
      PROTECTED_V137_COMPATIBILITY_CATEGORIES,
    ) ||
    !PROTECTED_V137_COMPATIBILITY_CATEGORIES.every((category) => {
      const value = review.protectedCategories[category]
      return (
        exactKeys(value, [
          "baselineHash",
          "candidateHash",
          "recomputedCandidateHash",
          "changeCount",
        ]) &&
        Number.isSafeInteger(value.changeCount) &&
        value.changeCount >= 0
      )
    })
  ) {
    return fail("CHECKPOINT_REVIEW_INVALID")
  }
  if (review.status === "suspended_pending_approval") {
    return fail("EXACT_COMPATIBILITY_CHECKPOINT_REQUIRED")
  }
  if (
    review.status !== "no_semantic_delta" ||
    !PROTECTED_V137_COMPATIBILITY_CATEGORIES.every(
      (category) =>
        review.protectedCategories[category].changeCount === 0 &&
        review.protectedCategories[category].candidateHash ===
          review.protectedCategories[category].recomputedCandidateHash,
    )
  ) {
    return fail("CHECKPOINT_REVIEW_INVALID")
  }
  return "no_semantic_delta"
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
  const rawArgs = process.argv.slice(2)
  const checkpoint = rawArgs[0]?.startsWith("--check-checkpoint-disposition=")
  if (checkpoint && rawArgs.length === 1) {
    const reviewPath = rawArgs[0]!.slice(
      "--check-checkpoint-disposition=".length,
    )
    checkV137ConformanceTraceCheckpointDisposition(reviewPath)
    console.log("v1.37 conformance trace checkpoint: no semantic delta")
    return
  }
  const args = parseArgs(rawArgs)
  const review = writeV137ConformanceTraceIndependentReview(args)
  if (
    readFileSync(path.resolve(args.outputPath), "utf8") !== renderJson(review)
  ) {
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
