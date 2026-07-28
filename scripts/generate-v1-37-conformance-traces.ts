#!/usr/bin/env -S pnpm exec tsx
/// <reference types="node" />

import { createHash } from "node:crypto"
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
// eslint-disable-next-line no-restricted-imports -- repo-root candidate generator consumes the canonical engine authority.
import {
  MATCH_KERNEL,
  type StrategyRuntime,
} from "../packages/engine/src/index.ts"
// eslint-disable-next-line no-restricted-imports -- fixture-only adapter binds deterministic kernel requests without invoking a language lane.
import { adaptRuntimeForCurrentKernel } from "../packages/engine/src/test/current-kernel-runtime.ts"
// eslint-disable-next-line no-restricted-imports -- compatibility roots are immutable review inputs, not regenerated authority.
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
// eslint-disable-next-line no-restricted-imports -- repo-root generator binds the exact active corpus source contract.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  computeV137ConformanceCorpusRoot,
  validateV137ConformanceCorpus,
  type V137ConformanceCase,
  type V137ConformanceCorpus,
} from "../packages/golden/src/v1-37-conformance-corpus.ts"
// eslint-disable-next-line no-restricted-imports -- the inactive trace candidate binds the reviewed inactive corpus candidate explicitly.
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts"
// eslint-disable-next-line no-restricted-imports -- candidate traces use the pure canonical projector only.
import {
  projectCanonicalConformanceTrace,
  type CanonicalConformanceInvocation,
  type CanonicalConformanceTrace,
} from "../packages/golden/src/v1-37-conformance-trace.ts"
// eslint-disable-next-line no-restricted-imports -- canonical engine recordings are the sole transition input.
import { recordChronicleFromExecution } from "../packages/replay/src/record.ts"
// eslint-disable-next-line no-restricted-imports -- use the existing canonical JSON codec and types.
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE,
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  SET_CONDITION_POLICY_VERSION_V1_37,
  createSetScenarioV137,
  encodeCanonicalJson,
  type JsonValue,
} from "../packages/spec/src/index.ts"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

export const ACTIVE_V137_CONFORMANCE_TRACE_ROOT = path.join(
  repoRoot,
  "packages/golden/src/fixtures/v1-37-conformance-traces",
)
const RELEASED_V137_CONFORMANCE_TRACE_V3_PATH = path.join(
  ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
  "v1.37-conformance-trace-v3",
)
const RELEASED_V137_CONFORMANCE_TRACE_V3_ROOT =
  "sha256:53ac4a34b8ea3a52b65b566dfb1da94cbc36ce220c590fe46c0bf43489668696" as const
export const V137_CONFORMANCE_TRACE_BASELINE_VERSION =
  "v1.4-locked-compatibility-v1" as const
export const V137_CONFORMANCE_TRACE_REVIEW_ARTIFACT = path.join(
  repoRoot,
  ".planning/artifacts/v1.37-conformance-trace-independent-review.json",
)
export const V137_CONFORMANCE_TRACE_REVIEWED_HISTORY_ARTIFACT = path.join(
  repoRoot,
  ".planning/artifacts/v1.37-conformance-trace-reviewed-history.json",
)
export const V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES = Object.freeze([
  "validV14State",
  "actionLegality",
  "eventOrder",
  "outcome",
  "terminalTimingReason",
  "strategyObservation",
  "historicalInterpretation",
] as const)

export type V137ConformanceTraceProtectedCategory =
  (typeof V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES)[number]

interface CompatibilityEvidence {
  readonly baselineVersion: typeof V137_CONFORMANCE_TRACE_BASELINE_VERSION
  readonly candidateCorpusVersion: typeof V1_4_COMPATIBILITY_CORPUS_VERSION
  readonly protectedCategories: Readonly<
    Record<V137ConformanceTraceProtectedCategory, string>
  >
}

export interface V137ConformanceTraceCandidateCase {
  readonly ordinal: number
  readonly caseId: string
  readonly traceRef: string
  readonly resultClass: "success" | "player_violation" | "system_failure"
  readonly tracePath: string
  readonly traceFileSha256: string
  readonly traceRoot: string
}

export interface V137ConformanceTraceCandidateManifest {
  readonly schemaVersion: "v1.37-conformance-trace-candidate-v1"
  readonly candidateVersion: string
  readonly corpusVersion: string
  readonly corpusRootSha256: string
  readonly semanticTupleId: string
  readonly generatedBy: "scripts/generate-v1-37-conformance-traces.ts"
  readonly authoritySource: "canonical-engine-kernel-recording"
  readonly recordingApi: "RecordedCanonicalTransitionV137"
  readonly projectorApi: "projectCanonicalConformanceTrace"
  readonly policy: "candidate-only-no-live-lane-oracle-no-promotion"
  readonly caseCount: number
  readonly cases: readonly V137ConformanceTraceCandidateCase[]
  readonly compatibilityEvidence: CompatibilityEvidence
  readonly candidateRootSha256: string
}

export interface V137ConformanceTraceSemanticDiff {
  readonly schemaVersion: "v1.37-conformance-trace-semantic-diff-v1"
  readonly generatedBy: "scripts/generate-v1-37-conformance-traces.ts"
  readonly baselineVersion: typeof V137_CONFORMANCE_TRACE_BASELINE_VERSION
  readonly candidateVersion: string
  readonly corpusVersion: string
  readonly corpusRootSha256: string
  readonly candidateRootSha256: string
  readonly caseDiffs: readonly {
    readonly ordinal: number
    readonly caseId: string
    readonly baselineTraceRef: string
    readonly candidateTraceRoot: string
    readonly resultClass: "success" | "player_violation" | "system_failure"
  }[]
  readonly protectedCategories: Readonly<
    Record<
      V137ConformanceTraceProtectedCategory,
      {
        readonly baselineHash: string
        readonly candidateHash: string
        readonly changeCount: number
      }
    >
  >
  readonly semanticDiffRootSha256: string
}

export interface GenerateV137ConformanceTraceCandidateInput {
  readonly candidateVersion: string
  readonly candidateDirectory: string
  readonly corpus?: V137ConformanceCorpus
}

export interface GenerateV137ConformanceTraceCandidateResult {
  readonly candidateVersion: string
  readonly candidateDirectory: string
  readonly manifestPath: string
  readonly semanticDiffPath: string
  readonly candidateRootSha256: string
  readonly manifestFileSha256: string
}

export interface V137ObservationTraceV4BundleRecord {
  readonly ordinal: number
  readonly caseId: string
  readonly traceRef: string
  readonly resultClass: "success" | "player_violation" | "system_failure"
  readonly canonicalInput: JsonValue
  readonly trace: Readonly<CanonicalConformanceTrace>
  readonly evidence: JsonValue
  readonly traceRoot: string
}

export interface V137ObservationTraceV4Bundle {
  readonly schemaVersion: "v1.37-observation-trace-bundle-v1"
  readonly candidateVersion: "v1.37-observation-trace-v4"
  readonly corpusVersion: "v3"
  readonly corpusRootSha256: string
  readonly semanticTupleId: string
  readonly caseCount: number
  readonly records: readonly V137ObservationTraceV4BundleRecord[]
  readonly bundleRootSha256: string
}

export interface V137ObservationTraceV4Manifest {
  readonly schemaVersion: "v1.37-observation-trace-candidate-v4"
  readonly candidateVersion: "v1.37-observation-trace-v4"
  readonly lifecycle: "inactive-candidate"
  readonly current: false
  readonly generatedBy: "scripts/generate-v1-37-conformance-traces.ts"
  readonly policy: "candidate-only-plan-14-atomic-promotion"
  readonly corpusCandidateVersion: "v3"
  readonly corpusRootSha256: string
  readonly corpusFileSha256: string
  readonly corpusCandidatePinPath: string
  readonly corpusCandidatePinFileSha256: string
  readonly semanticTupleId: string
  readonly bundlePath: "traces.bundle.json"
  readonly bundleFileSha256: string
  readonly bundleRootSha256: string
  readonly semanticDiffPath: "semantic-diff.json"
  readonly semanticDiffFileSha256: string
  readonly semanticDiffRootSha256: string
  readonly compatibilityDispositionPath: "compatibility-disposition.json"
  readonly compatibilityDispositionFileSha256: string
  readonly compatibilityDispositionRootSha256: string
  readonly caseCount: number
  readonly cases: readonly {
    readonly ordinal: number
    readonly caseId: string
    readonly resultClass: "success" | "player_violation" | "system_failure"
    readonly traceRoot: string
  }[]
  readonly candidateRootSha256: string
}

export interface GenerateV137ObservationTraceV4CandidateResult {
  readonly candidateDirectory: string
  readonly manifestPath: string
  readonly bundlePath: string
  readonly semanticDiffPath: string
  readonly compatibilityDispositionPath: string
  readonly candidateRootSha256: string
  readonly bundleRootSha256: string
}

export interface V137ConformanceTraceReviewedHistory {
  readonly schemaVersion: "v1.37-conformance-trace-reviewed-history-v1"
  readonly entries: readonly {
    readonly ordinal: number
    readonly candidateVersion: string
    readonly computedCandidateRootSha256: string
    readonly status: "no_semantic_delta" | "suspended_pending_approval"
  }[]
  readonly historyRootSha256: string
}

export class V137ConformanceTraceCandidateError extends Error {
  constructor(readonly code: string) {
    super(`Conformance trace candidate rejected: ${code}.`)
    this.name = "V137ConformanceTraceCandidateError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceTraceCandidateError(code)
}
const VERSION = /^v[1-9][0-9A-Za-z.-]{0,127}$/u
const HASH = /^sha256:[0-9a-f]{64}$/u
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
const inside = (candidate: string, root: string): boolean => {
  const relative = path.relative(root, candidate)
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  )
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
const evidenceHash = (label: string, caseId: string): string =>
  canonicalHash("cowards-game:v1.37:conformance-trace-evidence:v1", {
    label,
    caseId,
  } as JsonValue)

const reviewedHistoryRoot = (
  history: Omit<V137ConformanceTraceReviewedHistory, "historyRootSha256">,
): string =>
  canonicalHash(
    "cowards-game:v1.37:conformance-trace-reviewed-history:v1",
    history as unknown as JsonValue,
  )

export const parseV137ConformanceTraceReviewedHistory = (
  value: unknown,
): V137ConformanceTraceReviewedHistory => {
  if (
    !exactKeys(value, ["schemaVersion", "entries", "historyRootSha256"]) ||
    value.schemaVersion !== "v1.37-conformance-trace-reviewed-history-v1" ||
    !Array.isArray(value.entries) ||
    value.entries.length === 0 ||
    !HASH.test(value.historyRootSha256 as string)
  ) {
    return fail("REVIEW_HISTORY_INVALID")
  }
  const versions = new Set<string>()
  for (const [ordinal, entry] of value.entries.entries()) {
    if (
      !exactKeys(entry, [
        "ordinal",
        "candidateVersion",
        "computedCandidateRootSha256",
        "status",
      ]) ||
      entry.ordinal !== ordinal ||
      typeof entry.candidateVersion !== "string" ||
      !VERSION.test(entry.candidateVersion) ||
      typeof entry.computedCandidateRootSha256 !== "string" ||
      !HASH.test(entry.computedCandidateRootSha256) ||
      (entry.status !== "no_semantic_delta" &&
        entry.status !== "suspended_pending_approval") ||
      versions.has(entry.candidateVersion)
    ) {
      return fail("REVIEW_HISTORY_INVALID")
    }
    versions.add(entry.candidateVersion)
  }
  const history = value as unknown as V137ConformanceTraceReviewedHistory
  const { historyRootSha256: _historyRootSha256, ...material } = history
  if (reviewedHistoryRoot(material) !== history.historyRootSha256) {
    return fail("REVIEW_HISTORY_INVALID")
  }
  return history
}

export const readV137ConformanceTraceReviewedHistory =
  (): V137ConformanceTraceReviewedHistory => {
    let parsed: unknown
    try {
      const bytes = readFileSync(
        V137_CONFORMANCE_TRACE_REVIEWED_HISTORY_ARTIFACT,
        "utf8",
      )
      parsed = JSON.parse(bytes)
      if (bytes !== renderJson(parsed)) return fail("REVIEW_HISTORY_INVALID")
    } catch {
      return fail("REVIEW_HISTORY_INVALID")
    }
    const history = parseV137ConformanceTraceReviewedHistory(parsed)
    let currentReview: unknown
    try {
      currentReview = JSON.parse(
        readFileSync(V137_CONFORMANCE_TRACE_REVIEW_ARTIFACT, "utf8"),
      )
    } catch {
      return fail("REVIEW_HISTORY_INVALID")
    }
    if (
      !exactKeys(currentReview, [
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
      typeof currentReview.candidateVersion !== "string" ||
      typeof currentReview.computedCandidateRootSha256 !== "string" ||
      (currentReview.status !== "no_semantic_delta" &&
        currentReview.status !== "suspended_pending_approval")
    ) {
      return fail("REVIEW_HISTORY_INVALID")
    }
    const currentEntry = history.entries.find(
      ({ candidateVersion }) =>
        candidateVersion === currentReview.candidateVersion,
    )
    if (
      currentEntry === undefined ||
      currentEntry.computedCandidateRootSha256 !==
        currentReview.computedCandidateRootSha256 ||
      currentEntry.status !== currentReview.status
    ) {
      return fail("REVIEW_HISTORY_INVALID")
    }
    return history
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

const compatibilityCategoryRoots = ({
  dimensionRoots,
  fixtureRoots,
}: {
  readonly dimensionRoots: Readonly<Record<CompatibilityDimension, string>>
  readonly fixtureRoots: readonly [string, string][]
}): Readonly<Record<V137ConformanceTraceProtectedCategory, string>> => {
  const entries = Object.entries(categoryDimensions).map(
    ([category, dimensions]) => [
      category,
      hashCompatibilityValue(
        dimensions.map((dimension) => [dimension, dimensionRoots[dimension]]),
      ),
    ],
  )
  entries.push([
    "historicalInterpretation",
    hashCompatibilityValue({
      corpusVersion: V1_4_COMPATIBILITY_CORPUS_VERSION,
      dimensions: COMPATIBILITY_DIMENSIONS.map((dimension) => [
        dimension,
        dimensionRoots[dimension],
      ]),
      fixtures: fixtureRoots,
    }),
  ])
  return Object.freeze(Object.fromEntries(entries)) as Readonly<
    Record<V137ConformanceTraceProtectedCategory, string>
  >
}

export const lockedV137CompatibilityCategoryRoots = (): Readonly<
  Record<V137ConformanceTraceProtectedCategory, string>
> => {
  lockedCompatibilityRoots ??= compatibilityCategoryRoots({
    dimensionRoots: LOCKED_V1_4_DIMENSION_ROOTS,
    fixtureRoots: Object.entries(LOCKED_V1_4_FIXTURE_HASHES),
  })
  return lockedCompatibilityRoots
}

export const captureV137CompatibilityCategoryRoots = (): Readonly<
  Record<V137ConformanceTraceProtectedCategory, string>
> => {
  if (capturedCompatibilityRoots !== undefined) {
    return capturedCompatibilityRoots
  }
  const fixtures = captureV14CompatibilityCorpus()
  capturedCompatibilityRoots = compatibilityCategoryRoots({
    dimensionRoots: hashCompatibilityDimensionRoots(fixtures),
    fixtureRoots: fixtures.map(({ name, overallHash }) => [name, overallHash]),
  })
  return capturedCompatibilityRoots
}

let lockedCompatibilityRoots:
  | Readonly<Record<V137ConformanceTraceProtectedCategory, string>>
  | undefined
let capturedCompatibilityRoots:
  | Readonly<Record<V137ConformanceTraceProtectedCategory, string>>
  | undefined

const fixtureRuntime: StrategyRuntime = {
  selectActivations(input) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter(({ status }) => status === "ACTIVE")
          .slice(0, input.activationCount)
          .map(({ id }) => ({
            soldierId: id,
            objective: { fixture: "v1.37", intent: "stone" },
          })),
        strategyMemory: { fixture: "v1.37" },
      },
    }
  },
  runSoldierBrain() {
    return {
      ok: true,
      value: {
        action: { type: "TURN_TO_STONE" as const },
        soldierMemory: { fixture: "v1.37" },
      },
    }
  },
}

const canonicalRecording = (testCase: V137ConformanceCase) => {
  const identity = testCase.seed ?? testCase.id
  const execution = MATCH_KERNEL.runMatchV117({
    matchId: `conformance:${testCase.id}`,
    seed: identity,
    arenaVariant: {
      id: "v1.37-conformance-arena",
      name: "v1.37 Conformance Arena",
      initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
      terrainStones: [],
    },
    bottomPlayerId: "bottom",
    topPlayerId: "top",
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    runtime: adaptRuntimeForCurrentKernel(fixtureRuntime),
    maxPhases: 1,
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
      semanticTuple: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE,
    },
  })
  if (!recorded.ok) return fail(`CANONICAL_RECORDING_${recorded.failure.code}`)
  return { transitions: recorded.recordedTransitions }
}

const strategySuccessTrace = (
  testCase: V137ConformanceCase,
): Readonly<CanonicalConformanceTrace> => {
  const recorded = canonicalRecording(testCase)
  const first = recorded.transitions[0]
  const last = recorded.transitions.at(-1)
  if (
    first === undefined ||
    last === undefined ||
    last.terminalStatus === null
  ) {
    return fail("CANONICAL_RECORDING_INCOMPLETE")
  }
  const invocations: readonly CanonicalConformanceInvocation[] = [
    {
      ordinal: 0,
      invocationId: `invocation:${testCase.id}:select`,
      methodName: "selectActivations",
      resultClass: "success",
      stableCode: null,
      failingBoundary: "complete",
      canonicalPayloadHash: first.canonicalOutputHash,
      strategyMemoryHash: first.strategyMemoryHash,
      soldierMemoryHash: first.soldierMemoryHash,
      objectiveHash: first.objectiveHash,
      beforeObjectiveHash: evidenceHash("objective-before-select", testCase.id),
      afterObjectiveHash: evidenceHash("objective-after-select", testCase.id),
      beforeStateHash: first.beforeStateHash,
      afterStateHash: first.afterStateHash,
      beforeMemoryHash: evidenceHash("memory-before-select", testCase.id),
      afterMemoryHash: evidenceHash("memory-after-select", testCase.id),
      gameplayMutation: false,
      memoryMutation: true,
      terminalEffectHash: null,
      retryable: false,
    },
    {
      ordinal: 1,
      invocationId: `invocation:${testCase.id}:brain`,
      methodName: "soldierBrain",
      resultClass: "success",
      stableCode: null,
      failingBoundary: "complete",
      canonicalPayloadHash: last.canonicalOutputHash,
      strategyMemoryHash: last.strategyMemoryHash,
      soldierMemoryHash: last.soldierMemoryHash,
      objectiveHash: last.objectiveHash,
      beforeObjectiveHash: evidenceHash("objective-before-brain", testCase.id),
      afterObjectiveHash: evidenceHash("objective-after-brain", testCase.id),
      beforeStateHash: last.beforeStateHash,
      afterStateHash: last.afterStateHash,
      beforeMemoryHash: evidenceHash("memory-before-brain", testCase.id),
      afterMemoryHash: evidenceHash("memory-after-brain", testCase.id),
      gameplayMutation: true,
      memoryMutation: true,
      terminalEffectHash: last.terminalHash,
      retryable: false,
    },
  ]
  return projectCanonicalConformanceTrace({
    corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    caseId: testCase.id,
    semanticTupleId: CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
    resultClass: "success",
    invocations,
    transitions: recorded.transitions,
    finalStateHash: last.afterStateHash,
    outcomeHash: canonicalHash(
      "cowards-game:v1.37:conformance-outcome:v1",
      last.terminalStatus as unknown as JsonValue,
    ),
    failure: null,
  })
}

const rawEnvelopeSuccessTrace = (
  testCase: V137ConformanceCase,
): Readonly<CanonicalConformanceTrace> => {
  const stateHash = evidenceHash("unchanged-state", testCase.id)
  const memoryHash = evidenceHash("unchanged-memory", testCase.id)
  const objectiveHash = evidenceHash("unchanged-objective", testCase.id)
  const invocation: CanonicalConformanceInvocation = {
    ordinal: 0,
    invocationId: `invocation:${testCase.id}:raw-envelope`,
    methodName: "selectActivations",
    resultClass: "success",
    stableCode: null,
    failingBoundary: testCase.expectation.failingBoundary,
    canonicalPayloadHash: evidenceHash("canonical-payload", testCase.id),
    strategyMemoryHash: memoryHash,
    soldierMemoryHash: memoryHash,
    objectiveHash,
    beforeObjectiveHash: objectiveHash,
    afterObjectiveHash: objectiveHash,
    beforeStateHash: stateHash,
    afterStateHash: stateHash,
    beforeMemoryHash: memoryHash,
    afterMemoryHash: memoryHash,
    gameplayMutation: false,
    memoryMutation: false,
    terminalEffectHash: null,
    retryable: false,
  }
  return projectCanonicalConformanceTrace({
    corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    caseId: testCase.id,
    semanticTupleId: MATCH_KERNEL.tupleId,
    resultClass: "success",
    invocations: [invocation],
    transitions: [],
    finalStateHash: stateHash,
    outcomeHash: evidenceHash("no-outcome", testCase.id),
    failure: null,
  })
}

export const reconstructV137ConformanceTrace = (
  testCase: V137ConformanceCase,
): Readonly<CanonicalConformanceTrace> => {
  const resultClass = testCase.expectation.resultClass
  if (resultClass === "success") {
    return testCase.executionMode === "raw-envelope"
      ? rawEnvelopeSuccessTrace(testCase)
      : strategySuccessTrace(testCase)
  }
  const stateHash = evidenceHash("unchanged-state", testCase.id)
  const memoryHash = evidenceHash("unchanged-memory", testCase.id)
  const objectiveHash = evidenceHash("unchanged-objective", testCase.id)
  const invocation: CanonicalConformanceInvocation = {
    ordinal: 0,
    invocationId: `invocation:${testCase.id}:failure`,
    methodName: "selectActivations",
    resultClass,
    stableCode: testCase.expectation.reasonCode,
    failingBoundary: testCase.expectation.failingBoundary,
    canonicalPayloadHash: null,
    strategyMemoryHash: memoryHash,
    soldierMemoryHash: memoryHash,
    objectiveHash,
    beforeObjectiveHash: objectiveHash,
    afterObjectiveHash: objectiveHash,
    beforeStateHash: stateHash,
    afterStateHash: stateHash,
    beforeMemoryHash: memoryHash,
    afterMemoryHash: memoryHash,
    gameplayMutation: false,
    memoryMutation: false,
    terminalEffectHash: null,
    retryable: testCase.expectation.retryable,
  }
  return projectCanonicalConformanceTrace({
    corpusVersion: V1_37_CONFORMANCE_CORPUS.version,
    corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
    caseId: testCase.id,
    semanticTupleId: MATCH_KERNEL.tupleId,
    resultClass,
    invocations: [invocation],
    transitions: [],
    finalStateHash: stateHash,
    outcomeHash: evidenceHash("no-outcome", testCase.id),
    failure: {
      resultClass,
      stableCode: testCase.expectation.reasonCode,
      failingBoundary: testCase.expectation.failingBoundary,
      invocationOrdinal: 0,
      transitionOrdinal: null,
      gameplayMutation: false,
      memoryMutation: false,
      terminalEffectHash: null,
      retryable: testCase.expectation.retryable,
    },
  })
}

const reviewedVersionRoots = (): ReadonlyMap<string, string> => {
  return new Map(
    readV137ConformanceTraceReviewedHistory().entries.map(
      ({ candidateVersion, computedCandidateRootSha256 }) => [
        candidateVersion,
        computedCandidateRootSha256,
      ],
    ),
  )
}

const manifestRoot = (
  manifest: Omit<V137ConformanceTraceCandidateManifest, "candidateRootSha256">,
): string =>
  canonicalHash(
    "cowards-game:v1.37:conformance-trace-candidate:v1",
    manifest as unknown as JsonValue,
  )

export const computeV137ConformanceTraceCandidateRoot = (
  manifest: V137ConformanceTraceCandidateManifest,
): string => {
  const { candidateRootSha256: _candidateRootSha256, ...material } = manifest
  return manifestRoot(material)
}

const semanticDiff = (
  manifest: V137ConformanceTraceCandidateManifest,
): V137ConformanceTraceSemanticDiff => {
  const baselineCategories = lockedV137CompatibilityCategoryRoots()
  const candidateCategories = manifest.compatibilityEvidence.protectedCategories
  const protectedCategories = Object.fromEntries(
    V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES.map((category) => [
      category,
      {
        baselineHash: baselineCategories[category],
        candidateHash: candidateCategories[category],
        changeCount:
          baselineCategories[category] === candidateCategories[category]
            ? 0
            : 1,
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

const candidateParent = (requestedDirectory: string): string => {
  const requested = path.resolve(requestedDirectory)
  if (inside(requested, ACTIVE_V137_CONFORMANCE_TRACE_ROOT)) {
    return fail("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")
  }

  const planningRoot = path.join(repoRoot, ".planning")
  const planningTemporaryRoot = path.join(planningRoot, "tmp")
  const systemTemporaryRoot = path.resolve(tmpdir())
  let lexicalRoot: string
  let realRoot: string
  if (inside(requested, planningTemporaryRoot)) {
    const planningStat = lstatSync(planningRoot)
    if (planningStat.isSymbolicLink() || !planningStat.isDirectory()) {
      return fail("CANDIDATE_PARENT_SYMLINK_FORBIDDEN")
    }
    if (!existsSync(planningTemporaryRoot)) {
      mkdirSync(planningTemporaryRoot, { mode: 0o700 })
    }
    const temporaryStat = lstatSync(planningTemporaryRoot)
    if (temporaryStat.isSymbolicLink() || !temporaryStat.isDirectory()) {
      return fail("CANDIDATE_PARENT_SYMLINK_FORBIDDEN")
    }
    lexicalRoot = planningTemporaryRoot
    realRoot = realpathSync(planningTemporaryRoot)
  } else if (
    inside(requested, systemTemporaryRoot) ||
    inside(requested, realpathSync(systemTemporaryRoot))
  ) {
    lexicalRoot = inside(requested, systemTemporaryRoot)
      ? systemTemporaryRoot
      : realpathSync(systemTemporaryRoot)
    realRoot = realpathSync(systemTemporaryRoot)
  } else {
    return fail("CANDIDATE_PARENT_FORBIDDEN")
  }

  const relative = path.relative(lexicalRoot, requested)
  if (
    relative === "" ||
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    return fail("CANDIDATE_PARENT_FORBIDDEN")
  }
  const segments = relative.split(path.sep)
  const basename = segments.pop()!
  let realParent = realRoot
  for (const segment of segments) {
    realParent = path.join(realParent, segment)
    if (!existsSync(realParent)) return fail("CANDIDATE_PARENT_MISSING")
    const stat = lstatSync(realParent)
    if (stat.isSymbolicLink()) {
      return fail("CANDIDATE_PARENT_SYMLINK_FORBIDDEN")
    }
    if (!stat.isDirectory()) return fail("CANDIDATE_PARENT_INVALID")
  }
  const candidateDirectory = path.join(realParent, basename)
  if (
    existsSync(ACTIVE_V137_CONFORMANCE_TRACE_ROOT) &&
    inside(candidateDirectory, realpathSync(ACTIVE_V137_CONFORMANCE_TRACE_ROOT))
  ) {
    return fail("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")
  }
  return candidateDirectory
}

export const generateV137ConformanceTraceCandidate = (
  input: GenerateV137ConformanceTraceCandidateInput,
): GenerateV137ConformanceTraceCandidateResult => {
  if (
    !VERSION.test(input.candidateVersion) ||
    input.candidateVersion === V137_CONFORMANCE_TRACE_BASELINE_VERSION
  ) {
    return fail(
      input.candidateVersion === V137_CONFORMANCE_TRACE_BASELINE_VERSION
        ? "BASELINE_VERSION_REUSE_FORBIDDEN"
        : "CANDIDATE_VERSION_INVALID",
    )
  }
  const candidateDirectory = candidateParent(input.candidateDirectory)
  if (existsSync(candidateDirectory)) return fail("CANDIDATE_DIRECTORY_EXISTS")

  const corpus = input.corpus ?? V1_37_CONFORMANCE_CORPUS
  if (
    corpus.version !== V1_37_CONFORMANCE_CORPUS.version ||
    corpus.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT ||
    computeV137ConformanceCorpusRoot(corpus) !== V1_37_CONFORMANCE_CORPUS_ROOT
  ) {
    return fail("ACTIVE_CORPUS_IDENTITY_REQUIRED")
  }
  validateV137ConformanceCorpus(corpus)
  const reviewedRoots = reviewedVersionRoots()
  const stagingDirectory = mkdtempSync(
    path.join(
      path.dirname(candidateDirectory),
      `.${path.basename(candidateDirectory)}.staging-`,
    ),
  )
  try {
    const tracesDirectory = path.join(stagingDirectory, "traces")
    mkdirSync(tracesDirectory)
    const cases: V137ConformanceTraceCandidateCase[] = []
    for (const [ordinal, testCase] of corpus.cases.entries()) {
      const trace = reconstructV137ConformanceTrace(testCase)
      const tracePath = path.posix.join("traces", `${testCase.id}.json`)
      const traceBytes = renderJson(trace)
      writeFileSync(path.join(stagingDirectory, tracePath), traceBytes, {
        flag: "wx",
        mode: 0o600,
      })
      cases.push({
        ordinal,
        caseId: testCase.id,
        traceRef: testCase.expectation.traceRef,
        resultClass: trace.resultClass,
        tracePath,
        traceFileSha256: sha256(traceBytes),
        traceRoot: trace.traceRoot,
      })
    }
    const material = {
      schemaVersion: "v1.37-conformance-trace-candidate-v1" as const,
      candidateVersion: input.candidateVersion,
      corpusVersion: corpus.version,
      corpusRootSha256: corpus.corpusRootSha256,
      semanticTupleId: MATCH_KERNEL.tupleId,
      generatedBy: "scripts/generate-v1-37-conformance-traces.ts" as const,
      authoritySource: "canonical-engine-kernel-recording" as const,
      recordingApi: "RecordedCanonicalTransitionV137" as const,
      projectorApi: "projectCanonicalConformanceTrace" as const,
      policy: "candidate-only-no-live-lane-oracle-no-promotion" as const,
      caseCount: cases.length,
      cases,
      compatibilityEvidence: {
        baselineVersion: V137_CONFORMANCE_TRACE_BASELINE_VERSION,
        candidateCorpusVersion: V1_4_COMPATIBILITY_CORPUS_VERSION,
        protectedCategories: captureV137CompatibilityCategoryRoots(),
      },
    }
    const manifest: V137ConformanceTraceCandidateManifest = {
      ...material,
      candidateRootSha256: manifestRoot(material),
    }
    const reviewedRoot = reviewedRoots.get(input.candidateVersion)
    if (
      reviewedRoot !== undefined &&
      reviewedRoot !== manifest.candidateRootSha256
    ) {
      return fail("REVIEWED_VERSION_ROOT_MISMATCH")
    }
    const manifestBytes = renderJson(manifest)
    writeFileSync(path.join(stagingDirectory, "manifest.json"), manifestBytes, {
      flag: "wx",
      mode: 0o600,
    })
    writeFileSync(
      path.join(stagingDirectory, "semantic-diff.json"),
      renderJson(semanticDiff(manifest)),
      { flag: "wx", mode: 0o600 },
    )
    if (existsSync(candidateDirectory)) {
      return fail("CANDIDATE_DIRECTORY_EXISTS")
    }
    renameSync(stagingDirectory, candidateDirectory)
    return {
      candidateVersion: input.candidateVersion,
      candidateDirectory,
      manifestPath: path.join(candidateDirectory, "manifest.json"),
      semanticDiffPath: path.join(candidateDirectory, "semantic-diff.json"),
      candidateRootSha256: manifest.candidateRootSha256,
      manifestFileSha256: sha256(manifestBytes),
    }
  } finally {
    if (existsSync(stagingDirectory)) {
      rmSync(stagingDirectory, { recursive: true, force: true })
    }
  }
}

const V137_OBSERVATION_TRACE_V4_VERSION = "v1.37-observation-trace-v4" as const
const V137_OBSERVATION_CORPUS_PATH = path.join(
  repoRoot,
  V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusPath,
)
const V137_OBSERVATION_CORPUS_PIN_PATH = path.join(
  repoRoot,
  "packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts",
)

const loadV137ObservationCorpusV3 = (): V137ConformanceCorpus => {
  const corpusBytes = readFileSync(V137_OBSERVATION_CORPUS_PATH)
  if (
    sha256(corpusBytes) !==
    V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusFileSha256
  ) {
    return fail("OBSERVATION_CORPUS_FILE_IDENTITY_MISMATCH")
  }
  let corpus: V137ConformanceCorpus
  try {
    corpus = JSON.parse(corpusBytes.toString("utf8")) as V137ConformanceCorpus
  } catch {
    return fail("OBSERVATION_CORPUS_INVALID")
  }
  validateV137ConformanceCorpus(corpus)
  if (
    corpus.version !== "v3" ||
    corpus.corpusRootSha256 !==
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256 ||
    computeV137ConformanceCorpusRoot(corpus) !== corpus.corpusRootSha256 ||
    JSON.stringify(corpus.cases.map(({ id }) => id)) !==
      JSON.stringify(
        V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots.map(
          ({ caseId }) => caseId,
        ),
      )
  ) {
    return fail("OBSERVATION_CORPUS_IDENTITY_MISMATCH")
  }
  return corpus
}

const canonicalRecordingV119 = (testCase: V137ConformanceCase) => {
  const identity = testCase.seed ?? testCase.id
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ id }) => id === "arena:smoke:v1",
  )
  if (arena === undefined) return fail("CANONICAL_ARENA_MISSING")
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: { entrantKey: "entrant:bottom", playerId: "bottom" },
    entrantB: { entrantKey: "entrant:top", playerId: "top" },
    baseSeed: identity,
  })
  const condition = scenario.conditions[0]
  if (condition === undefined) return fail("CANONICAL_CONDITION_MISSING")
  const execution = MATCH_KERNEL.runMatchV119({
    matchId: `conformance:${testCase.id}`,
    seed: scenario.baseSeed,
    arenaVariant: {
      id: arena.id,
      name: arena.name,
      initialBounds: { ...arena.initialBounds },
      terrainStones: arena.terrainStones.map((position) => ({ ...position })),
    },
    bottomPlayerId: condition.bottomPlayerId,
    topPlayerId: condition.topPlayerId,
    bottomStrategyRevisionId: "bottom-revision",
    topStrategyRevisionId: "top-revision",
    initialInitiativePlayerId: condition.initialInitiativePlayerId,
    runtime: fixtureRuntime as never,
    maxPhases: 1,
  })
  const recorded = recordChronicleFromExecution({
    execution,
    metadata: {
      schemaVersion: "chronicle-v1.4",
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      semanticTuple: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE,
    },
    candidateMatch: {
      semanticAuthorityKey: "runtime-v1.19",
      matchId: `conformance:${testCase.id}`,
      seed: scenario.baseSeed,
      arenaVariantId: arena.id,
      bottomStrategyRevisionId: "bottom-revision",
      topStrategyRevisionId: "top-revision",
      bottomPlayerId: condition.bottomPlayerId,
      topPlayerId: condition.topPlayerId,
      bottomEntrantKey: condition.bottomEntrantKey,
      topEntrantKey: condition.topEntrantKey,
      setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
      scenarioId: scenario.scenarioId,
      conditionId: condition.conditionId,
      conditionOrdinal: condition.ordinal,
      conditionSuffix: condition.suffix,
      requestIdentity: condition.requestIdentity,
      arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
      arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
      initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
      initialInitiativePlayerId: condition.initialInitiativePlayerId,
    },
  })
  if (!recorded.ok) return fail(`CANONICAL_RECORDING_${recorded.failure.code}`)
  return { transitions: recorded.recordedTransitions }
}

const projectV137ObservationTraceV4 = (
  testCase: V137ConformanceCase,
  corpus: V137ConformanceCorpus,
): Readonly<CanonicalConformanceTrace> => {
  const resultClass = testCase.expectation.resultClass
  if (resultClass === "success") {
    if (testCase.executionMode === "raw-envelope") {
      const stateHash = evidenceHash("unchanged-state-v4", testCase.id)
      const memoryHash = evidenceHash("unchanged-memory-v4", testCase.id)
      const objectiveHash = evidenceHash("unchanged-objective-v4", testCase.id)
      return projectCanonicalConformanceTrace({
        corpusVersion: corpus.version,
        corpusRootSha256: corpus.corpusRootSha256,
        caseId: testCase.id,
        semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        resultClass,
        invocations: [
          {
            ordinal: 0,
            invocationId: `invocation:${testCase.id}:raw-envelope`,
            methodName: "selectActivations",
            resultClass,
            stableCode: null,
            failingBoundary: testCase.expectation.failingBoundary,
            canonicalPayloadHash: evidenceHash(
              "canonical-payload-v4",
              testCase.id,
            ),
            strategyMemoryHash: memoryHash,
            soldierMemoryHash: memoryHash,
            objectiveHash,
            beforeObjectiveHash: objectiveHash,
            afterObjectiveHash: objectiveHash,
            beforeStateHash: stateHash,
            afterStateHash: stateHash,
            beforeMemoryHash: memoryHash,
            afterMemoryHash: memoryHash,
            gameplayMutation: false,
            memoryMutation: false,
            terminalEffectHash: null,
            retryable: false,
          },
        ],
        transitions: [],
        finalStateHash: stateHash,
        outcomeHash: evidenceHash("no-outcome-v4", testCase.id),
        failure: null,
      })
    }
    const recorded = canonicalRecordingV119(testCase)
    const first = recorded.transitions[0]
    const last = recorded.transitions.at(-1)
    if (
      first === undefined ||
      last === undefined ||
      last.terminalStatus === null
    ) {
      return fail("CANONICAL_RECORDING_INCOMPLETE")
    }
    return projectCanonicalConformanceTrace({
      corpusVersion: corpus.version,
      corpusRootSha256: corpus.corpusRootSha256,
      caseId: testCase.id,
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      resultClass,
      invocations: [
        {
          ordinal: 0,
          invocationId: `invocation:${testCase.id}:select`,
          methodName: "selectActivations",
          resultClass,
          stableCode: null,
          failingBoundary: "complete",
          canonicalPayloadHash: first.canonicalOutputHash,
          strategyMemoryHash: first.strategyMemoryHash,
          soldierMemoryHash: first.soldierMemoryHash,
          objectiveHash: first.objectiveHash,
          beforeObjectiveHash: evidenceHash(
            "objective-before-select-v4",
            testCase.id,
          ),
          afterObjectiveHash: evidenceHash(
            "objective-after-select-v4",
            testCase.id,
          ),
          beforeStateHash: first.beforeStateHash,
          afterStateHash: first.afterStateHash,
          beforeMemoryHash: evidenceHash(
            "memory-before-select-v4",
            testCase.id,
          ),
          afterMemoryHash: evidenceHash("memory-after-select-v4", testCase.id),
          gameplayMutation: false,
          memoryMutation: true,
          terminalEffectHash: null,
          retryable: false,
        },
        {
          ordinal: 1,
          invocationId: `invocation:${testCase.id}:brain`,
          methodName: "soldierBrain",
          resultClass,
          stableCode: null,
          failingBoundary: "complete",
          canonicalPayloadHash: last.canonicalOutputHash,
          strategyMemoryHash: last.strategyMemoryHash,
          soldierMemoryHash: last.soldierMemoryHash,
          objectiveHash: last.objectiveHash,
          beforeObjectiveHash: evidenceHash(
            "objective-before-brain-v4",
            testCase.id,
          ),
          afterObjectiveHash: evidenceHash(
            "objective-after-brain-v4",
            testCase.id,
          ),
          beforeStateHash: last.beforeStateHash,
          afterStateHash: last.afterStateHash,
          beforeMemoryHash: evidenceHash("memory-before-brain-v4", testCase.id),
          afterMemoryHash: evidenceHash("memory-after-brain-v4", testCase.id),
          gameplayMutation: true,
          memoryMutation: true,
          terminalEffectHash: last.terminalHash,
          retryable: false,
        },
      ],
      transitions: recorded.transitions,
      finalStateHash: last.afterStateHash,
      outcomeHash: canonicalHash(
        "cowards-game:v1.37:conformance-outcome:v1",
        last.terminalStatus as unknown as JsonValue,
      ),
      failure: null,
    })
  }

  const stateHash = evidenceHash("unchanged-state-v4", testCase.id)
  const memoryHash = evidenceHash("unchanged-memory-v4", testCase.id)
  const objectiveHash = evidenceHash("unchanged-objective-v4", testCase.id)
  const invocation: CanonicalConformanceInvocation = {
    ordinal: 0,
    invocationId: `invocation:${testCase.id}:failure`,
    methodName: "selectActivations",
    resultClass,
    stableCode: testCase.expectation.reasonCode,
    failingBoundary: testCase.expectation.failingBoundary,
    canonicalPayloadHash: null,
    strategyMemoryHash: memoryHash,
    soldierMemoryHash: memoryHash,
    objectiveHash,
    beforeObjectiveHash: objectiveHash,
    afterObjectiveHash: objectiveHash,
    beforeStateHash: stateHash,
    afterStateHash: stateHash,
    beforeMemoryHash: memoryHash,
    afterMemoryHash: memoryHash,
    gameplayMutation: false,
    memoryMutation: false,
    terminalEffectHash: null,
    retryable: testCase.expectation.retryable,
  }
  return projectCanonicalConformanceTrace({
    corpusVersion: corpus.version,
    corpusRootSha256: corpus.corpusRootSha256,
    caseId: testCase.id,
    semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
    resultClass,
    invocations: [invocation],
    transitions: [],
    finalStateHash: stateHash,
    outcomeHash: evidenceHash("no-outcome-v4", testCase.id),
    failure: {
      resultClass,
      stableCode: testCase.expectation.reasonCode,
      failingBoundary: testCase.expectation.failingBoundary,
      invocationOrdinal: 0,
      transitionOrdinal: null,
      gameplayMutation: false,
      memoryMutation: false,
      terminalEffectHash: null,
      retryable: testCase.expectation.retryable,
    },
  })
}

const observationInputForCase = (
  testCase: V137ConformanceCase,
  corpus: V137ConformanceCorpus,
): JsonValue => {
  const invocation = corpus.behaviorManifest.invocationScript.find(
    ({ inputFixtureId }) => inputFixtureId === `fixture:${testCase.id}`,
  )
  if (invocation === undefined) {
    return {
      testCase: testCase as unknown as JsonValue,
      invocation: null,
      observation: null,
    }
  }
  const hasAdvanced = new Set([
    "observation-d05-successful-pusher-true",
    "observation-d06-later-cycle-true",
    "observation-d06-post-self-advance-true",
  ]).has(testCase.id)
  const laterRound =
    testCase.id === "observation-d02-round-initiative-later-round"
  const observation =
    invocation.methodName === "selectActivations"
      ? {
          initialInitiativePlayerId: "player:bottom",
          hasInitialInitiative: !laterRound,
          roundInitiativePlayerId: laterRound ? "player:top" : "player:bottom",
          hasRoundInitiative: true,
        }
      : { hasAdvancedThisActivation: hasAdvanced }
  return {
    testCase: testCase as unknown as JsonValue,
    invocation: invocation as unknown as JsonValue,
    observation,
  }
}

const traceEvidence = (trace: CanonicalConformanceTrace): JsonValue =>
  ({
    states: {
      boundaries: trace.transitions.map(
        ({ ordinal, beforeStateHash, afterStateHash }) => ({
          ordinal,
          beforeStateHash,
          afterStateHash,
        }),
      ),
      finalStateHash: trace.finalStateHash,
    },
    events: trace.transitions.map(
      ({ ordinal, orderedEvents, orderedEventsHash }) => ({
        ordinal,
        orderedEvents,
        orderedEventsHash,
      }),
    ),
    memories: trace.invocations.map(
      ({
        ordinal,
        strategyMemoryHash,
        soldierMemoryHash,
        beforeMemoryHash,
        afterMemoryHash,
      }) => ({
        ordinal,
        strategyMemoryHash,
        soldierMemoryHash,
        beforeMemoryHash,
        afterMemoryHash,
      }),
    ),
    objectives: trace.invocations.map(
      ({
        ordinal,
        objectiveHash,
        beforeObjectiveHash,
        afterObjectiveHash,
      }) => ({
        ordinal,
        objectiveHash,
        beforeObjectiveHash,
        afterObjectiveHash,
      }),
    ),
    terminal: {
      outcomeHash: trace.outcomeHash,
      statuses: trace.transitions.map(
        ({ ordinal, terminalStatus, terminalHash }) => ({
          ordinal,
          terminalStatus,
          terminalHash,
        }),
      ),
    },
    failure: trace.failure as unknown as JsonValue,
  }) as JsonValue

const observationBundleRoot = (
  bundle: Omit<V137ObservationTraceV4Bundle, "bundleRootSha256">,
): string =>
  sha256(
    `cowards-game:v1.37:observation-trace-bundle:exact-json:v1\0${renderJson(
      JSON.parse(JSON.stringify(bundle)),
    )}`,
  )

const observationCandidateRoot = (
  manifest: Omit<V137ObservationTraceV4Manifest, "candidateRootSha256">,
): string =>
  canonicalHash(
    "cowards-game:v1.37:observation-trace-candidate:v4",
    manifest as unknown as JsonValue,
  )

const exactJsonDomainHash = (domain: string, value: unknown): string =>
  sha256(`${domain}\0${renderJson(JSON.parse(JSON.stringify(value)))}`)

const readReleasedV137TraceManifest =
  (): V137ConformanceTraceCandidateManifest => {
    let manifest: V137ConformanceTraceCandidateManifest
    try {
      manifest = JSON.parse(
        readFileSync(
          path.join(RELEASED_V137_CONFORMANCE_TRACE_V3_PATH, "manifest.json"),
          "utf8",
        ),
      ) as V137ConformanceTraceCandidateManifest
    } catch {
      return fail("RELEASED_TRACE_MANIFEST_INVALID")
    }
    if (
      manifest.candidateVersion !== "v1.37-conformance-trace-v3" ||
      manifest.candidateRootSha256 !== RELEASED_V137_CONFORMANCE_TRACE_V3_ROOT ||
      manifest.caseCount !== manifest.cases.length ||
      computeV137ConformanceTraceCandidateRoot(manifest) !==
        manifest.candidateRootSha256
    ) {
      return fail("RELEASED_TRACE_MANIFEST_INVALID")
    }
    return manifest
  }

const protectedObservationSurfaceRoots = (): Readonly<
  Record<
    | "gameplayState"
    | "actionLegality"
    | "eventOrder"
    | "cleanup"
    | "terminalTimingReason"
    | "outcome"
    | "backstab"
    | "arenaGeometry"
    | "historicalInterpretation"
    | "failureOwnership",
    string
  >
> => {
  const locked = lockedV137CompatibilityCategoryRoots()
  const captured = captureV137CompatibilityCategoryRoots()
  for (const category of V137_CONFORMANCE_TRACE_PROTECTED_CATEGORIES) {
    if (locked[category] !== captured[category]) {
      return fail(`UNAPPROVED_COMPATIBILITY_DRIFT_${category}`)
    }
  }
  const lifecycleMaterial = {
    gameplayState: locked.validV14State,
    actionLegality: locked.actionLegality,
    eventOrder: locked.eventOrder,
    terminalTimingReason: locked.terminalTimingReason,
    outcome: locked.outcome,
  } as const
  const arenaGeometry = CANONICAL_ARENA_CATALOG_V1_37.arenas.map(
    ({ id, status, semanticGeometryHash }) => ({
      id,
      status,
      semanticGeometryHash,
    }),
  )
  return Object.freeze({
    gameplayState: lifecycleMaterial.gameplayState,
    actionLegality: lifecycleMaterial.actionLegality,
    eventOrder: lifecycleMaterial.eventOrder,
    cleanup: exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-protected-cleanup:v1",
      lifecycleMaterial,
    ),
    terminalTimingReason: lifecycleMaterial.terminalTimingReason,
    outcome: lifecycleMaterial.outcome,
    backstab: exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-protected-backstab:v1",
      lifecycleMaterial,
    ),
    arenaGeometry: exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-protected-arena:v1",
      arenaGeometry,
    ),
    historicalInterpretation: locked.historicalInterpretation,
    failureOwnership: exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-protected-failure-ownership:v1",
      {
        classes: ["success", "player_violation", "system_failure"],
        systemFailure:
          "no-gameplay-memory-objective-terminal-mutation-or-player-penalty",
      },
    ),
  })
}

const createObservationSemanticDiffAndDisposition = ({
  records,
  bundleRootSha256,
}: {
  readonly records: readonly V137ObservationTraceV4BundleRecord[]
  readonly bundleRootSha256: string
}) => {
  const active = readReleasedV137TraceManifest()
  const baselineByCase = new Map(
    active.cases.map(({ caseId, traceRoot }) => [caseId, traceRoot]),
  )
  const caseDiffs = records.map(({ ordinal, caseId, traceRoot }) => {
    const baselineTraceRoot = baselineByCase.get(caseId) ?? null
    return {
      ordinal,
      caseId,
      baselineTraceRoot,
      candidateTraceRoot: traceRoot,
      disposition:
        baselineTraceRoot === null
          ? ("observation-case-added" as const)
          : ("observation-or-fixture-identity-only" as const),
      allowedDeltaFields: [
        "corpusVersion",
        "corpusRootSha256",
        "semanticTupleId",
        "canonicalInput.observation",
        "traceIdentity",
        "fixtureArenaIdentity",
      ],
    }
  })
  const surfaceRoots = protectedObservationSurfaceRoots()
  const protectedSurfaces = Object.fromEntries(
    Object.entries(surfaceRoots).map(([surface, root]) => [
      surface,
      {
        baselineRoot: root,
        candidateRoot: root,
        changeCount: 0,
        disposition: "unchanged" as const,
      },
    ]),
  )
  const diffMaterial = {
    schemaVersion: "v1.37-observation-trace-semantic-diff-v1" as const,
    generatedBy: "scripts/generate-v1-37-conformance-traces.ts" as const,
    baselineVersion: active.candidateVersion,
    candidateVersion: V137_OBSERVATION_TRACE_V4_VERSION,
    baselineCandidateRootSha256: active.candidateRootSha256,
    bundleRootSha256,
    caseCount: records.length,
    caseDiffs,
    protectedSurfaces,
  }
  const semanticDiff = {
    ...diffMaterial,
    semanticDiffRootSha256: exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-semantic-diff:v1",
      diffMaterial,
    ),
  }
  const dispositionMaterial = {
    schemaVersion:
      "v1.37-observation-trace-compatibility-disposition-v1" as const,
    candidateVersion: V137_OBSERVATION_TRACE_V4_VERSION,
    lifecycle: "inactive-candidate" as const,
    current: false as const,
    status: "observation-only-compatible-candidate" as const,
    bundleRootSha256,
    semanticDiffRootSha256: semanticDiff.semanticDiffRootSha256,
    caseCount: records.length,
    cases: caseDiffs.map(
      ({
        ordinal,
        caseId,
        baselineTraceRoot,
        candidateTraceRoot,
        disposition,
      }) => ({
        ordinal,
        caseId,
        baselineTraceRoot,
        candidateTraceRoot,
        disposition,
      }),
    ),
    protectedSurfaces,
    approval: null,
  }
  const compatibilityDisposition = {
    ...dispositionMaterial,
    compatibilityDispositionRootSha256: exactJsonDomainHash(
      "cowards-game:v1.37:observation-trace-compatibility-disposition:v1",
      dispositionMaterial,
    ),
  }
  return { semanticDiff, compatibilityDisposition }
}

export const generateV137ObservationTraceV4Candidate = ({
  candidateDirectory: requestedDirectory,
}: {
  readonly candidateDirectory: string
}): GenerateV137ObservationTraceV4CandidateResult => {
  const registryPath = path.join(
    ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
    "registry.json",
  )
  const registryBefore = readFileSync(registryPath)
  const requested = path.resolve(requestedDirectory)
  const committedCandidateDirectory = path.join(
    ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
    V137_OBSERVATION_TRACE_V4_VERSION,
  )
  const candidateDirectory =
    requested === committedCandidateDirectory
      ? requested
      : candidateParent(requestedDirectory)
  if (
    requested ===
    path.join(ACTIVE_V137_CONFORMANCE_TRACE_ROOT, "v1.37-conformance-trace-v3")
  ) {
    return fail("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")
  }
  if (existsSync(candidateDirectory)) return fail("CANDIDATE_DIRECTORY_EXISTS")
  const corpus = loadV137ObservationCorpusV3()
  const stagingDirectory = mkdtempSync(
    path.join(
      path.dirname(candidateDirectory),
      `.${path.basename(candidateDirectory)}.staging-`,
    ),
  )
  try {
    const records = corpus.cases.map((testCase, ordinal) => {
      const trace = projectV137ObservationTraceV4(testCase, corpus)
      return {
        ordinal,
        caseId: testCase.id,
        traceRef: testCase.expectation.traceRef,
        resultClass: trace.resultClass,
        canonicalInput: observationInputForCase(testCase, corpus),
        trace,
        evidence: traceEvidence(trace),
        traceRoot: trace.traceRoot,
      } satisfies V137ObservationTraceV4BundleRecord
    })
    const bundleMaterial = {
      schemaVersion: "v1.37-observation-trace-bundle-v1" as const,
      candidateVersion: V137_OBSERVATION_TRACE_V4_VERSION,
      corpusVersion: "v3" as const,
      corpusRootSha256: corpus.corpusRootSha256,
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      caseCount: records.length,
      records,
    }
    const bundle: V137ObservationTraceV4Bundle = {
      ...bundleMaterial,
      bundleRootSha256: observationBundleRoot(bundleMaterial),
    }
    const bundleBytes = renderJson(bundle)
    writeFileSync(
      path.join(stagingDirectory, "traces.bundle.json"),
      bundleBytes,
      {
        flag: "wx",
        mode: 0o600,
      },
    )
    const { semanticDiff, compatibilityDisposition } =
      createObservationSemanticDiffAndDisposition({
        records,
        bundleRootSha256: bundle.bundleRootSha256,
      })
    const semanticDiffBytes = renderJson(semanticDiff)
    const compatibilityDispositionBytes = renderJson(compatibilityDisposition)
    writeFileSync(
      path.join(stagingDirectory, "semantic-diff.json"),
      semanticDiffBytes,
      { flag: "wx", mode: 0o600 },
    )
    writeFileSync(
      path.join(stagingDirectory, "compatibility-disposition.json"),
      compatibilityDispositionBytes,
      { flag: "wx", mode: 0o600 },
    )
    const manifestMaterial = {
      schemaVersion: "v1.37-observation-trace-candidate-v4" as const,
      candidateVersion: V137_OBSERVATION_TRACE_V4_VERSION,
      lifecycle: "inactive-candidate" as const,
      current: false as const,
      generatedBy: "scripts/generate-v1-37-conformance-traces.ts" as const,
      policy: "candidate-only-plan-14-atomic-promotion" as const,
      corpusCandidateVersion: "v3" as const,
      corpusRootSha256: corpus.corpusRootSha256,
      corpusFileSha256:
        V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusFileSha256,
      corpusCandidatePinPath:
        "packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts",
      corpusCandidatePinFileSha256: sha256(
        readFileSync(V137_OBSERVATION_CORPUS_PIN_PATH),
      ),
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      bundlePath: "traces.bundle.json" as const,
      bundleFileSha256: sha256(bundleBytes),
      bundleRootSha256: bundle.bundleRootSha256,
      semanticDiffPath: "semantic-diff.json" as const,
      semanticDiffFileSha256: sha256(semanticDiffBytes),
      semanticDiffRootSha256: semanticDiff.semanticDiffRootSha256,
      compatibilityDispositionPath: "compatibility-disposition.json" as const,
      compatibilityDispositionFileSha256: sha256(compatibilityDispositionBytes),
      compatibilityDispositionRootSha256:
        compatibilityDisposition.compatibilityDispositionRootSha256,
      caseCount: records.length,
      cases: records.map(({ ordinal, caseId, resultClass, traceRoot }) => ({
        ordinal,
        caseId,
        resultClass,
        traceRoot,
      })),
    }
    const manifest: V137ObservationTraceV4Manifest = {
      ...manifestMaterial,
      candidateRootSha256: observationCandidateRoot(manifestMaterial),
    }
    writeFileSync(
      path.join(stagingDirectory, "manifest.json"),
      renderJson(manifest),
      {
        flag: "wx",
        mode: 0o600,
      },
    )
    if (!registryBefore.equals(readFileSync(registryPath))) {
      return fail("ACTIVE_TRACE_REGISTRY_CHANGED")
    }
    renameSync(stagingDirectory, candidateDirectory)
    return {
      candidateDirectory,
      manifestPath: path.join(candidateDirectory, "manifest.json"),
      bundlePath: path.join(candidateDirectory, "traces.bundle.json"),
      semanticDiffPath: path.join(candidateDirectory, "semantic-diff.json"),
      compatibilityDispositionPath: path.join(
        candidateDirectory,
        "compatibility-disposition.json",
      ),
      candidateRootSha256: manifest.candidateRootSha256,
      bundleRootSha256: bundle.bundleRootSha256,
    }
  } finally {
    if (existsSync(stagingDirectory))
      rmSync(stagingDirectory, { recursive: true, force: true })
  }
}

export const parseV137ConformanceTraceCandidateArgs = (
  args: readonly string[],
): {
  readonly candidateVersion: string
  readonly candidateDirectory: string
} => {
  if (args.length !== 2) return fail("CANDIDATE_ARGUMENTS")
  const values = new Map<string, string>()
  for (const arg of args) {
    const separator = arg.indexOf("=")
    if (separator <= 2) return fail("CANDIDATE_ARGUMENTS")
    values.set(arg.slice(0, separator), arg.slice(separator + 1))
  }
  if (
    values.size !== 2 ||
    !values.has("--candidate-version") ||
    !values.has("--candidate-dir")
  ) {
    return fail("CANDIDATE_ARGUMENTS")
  }
  return {
    candidateVersion: values.get("--candidate-version")!,
    candidateDirectory: values.get("--candidate-dir")!,
  }
}

const main = (): void => {
  if (
    process.argv.length === 3 &&
    process.argv[2] === "--write-observation-v4"
  ) {
    const result = generateV137ObservationTraceV4Candidate({
      candidateDirectory: path.join(
        ACTIVE_V137_CONFORMANCE_TRACE_ROOT,
        V137_OBSERVATION_TRACE_V4_VERSION,
      ),
    })
    console.log(
      `v1.37 observation trace candidate ${V137_OBSERVATION_TRACE_V4_VERSION}: ${result.candidateRootSha256}`,
    )
    return
  }
  const args = parseV137ConformanceTraceCandidateArgs(process.argv.slice(2))
  const result = generateV137ConformanceTraceCandidate(args)
  console.log(
    `v1.37 conformance trace candidate ${result.candidateVersion}: ${result.candidateRootSha256}`,
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
