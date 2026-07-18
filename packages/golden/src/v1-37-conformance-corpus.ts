/// <reference types="node" />

import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"
import { V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN } from "./v1-37-conformance-corpus-pin.js"
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "./v1-37-conformance-corpus-v3-candidate-pin.js"

export const V1_37_CONFORMANCE_LANGUAGES = Object.freeze([
  "typescript",
  "python",
  "rust",
  "zig",
] as const)

export type V137ConformanceLanguageId =
  (typeof V1_37_CONFORMANCE_LANGUAGES)[number]

export const V1_37_CONFORMANCE_CASE_KINDS = Object.freeze([
  "normative",
  "boundary",
  "seeded-property",
  "mutation-kill",
  "positive-failure",
  "negative-failure",
  "raw-envelope",
] as const)

export type V137ConformanceCaseKind =
  (typeof V1_37_CONFORMANCE_CASE_KINDS)[number]

export const V1_37_CONFORMANCE_REQUIRED_CAPABILITIES = Object.freeze([
  "valid-behavior",
  "canonical-json",
  "numeric",
  "unicode",
  "depth",
  "malformed-output",
  "timeout",
  "resource",
  "stale-artifact",
  "transport",
  "deterministic-repeat",
  "differential",
  "seeded-property",
  "mutation-kill",
] as const)

export type V137ConformanceCapability =
  (typeof V1_37_CONFORMANCE_REQUIRED_CAPABILITIES)[number]

export const V1_37_CONFORMANCE_RESULT_CLASSES = Object.freeze([
  "success",
  "player_violation",
  "system_failure",
] as const)

export type V137ConformanceResultClass =
  (typeof V1_37_CONFORMANCE_RESULT_CLASSES)[number]

export interface V137ConformanceInvocation {
  ordinal: number
  methodName: "selectActivations" | "soldierBrain"
  inputFixtureId: string
}

export interface V137ConformanceBehaviorManifest {
  id: string
  description: string
  invocationScript: V137ConformanceInvocation[]
  expectedSelection: JsonValue
  expectedBrain: JsonValue
}

export interface V137ConformanceFixture {
  languageId: V137ConformanceLanguageId
  providerId: string
  runtimeTarget: "runtime-js" | "runtime-python" | "runtime-wasm-wasi"
  behaviorManifestId: string
  sourceEncoding: "utf-8"
  sourceSha256: string
  source: string
}

export interface V137ConformanceExpectation {
  resultClass: V137ConformanceResultClass
  reasonCode: string
  failingBoundary: string
  gameplayMutation: boolean
  retryable: boolean
  traceRef: string
}

export interface V137ConformanceCase {
  id: string
  kind: V137ConformanceCaseKind
  capability: V137ConformanceCapability
  executionMode: "strategy" | "raw-envelope"
  seed: string | null
  generatorId: string | null
  mutationTarget: string | null
  required: true
  unsupportedDisposition: "fail-certification"
  requiredLanguageIds: V137ConformanceLanguageId[]
  expectation: V137ConformanceExpectation
}

export interface V137ConformanceCorpus {
  schemaVersion: "v1.37-executable-conformance-corpus-v1"
  version: string
  generatedBy: "scripts/generate-v1-37-conformance-corpus.ts"
  hashAlgorithm: "sha256"
  rootDomain: "cowards-game:v1.37:executable-conformance-corpus:v1"
  rootFraming: "unsigned-64-bit-big-endian-length-then-bytes"
  languageIds: V137ConformanceLanguageId[]
  behaviorManifest: V137ConformanceBehaviorManifest
  fixtures: V137ConformanceFixture[]
  cases: V137ConformanceCase[]
  corpusRootSha256: string
}

export interface V137ConformanceRegistry {
  schemaVersion: "v1.37-executable-conformance-registry-v1"
  activeVersion: string
  corpusRootSha256: string
  corpusFileSha256: string
  path: string
}

export type V137ConformanceCaseStatus =
  | "passed"
  | "failed"
  | "skipped"
  | "unsupported"

export interface V137ConformanceCaseResult {
  caseId: string
  languageId: V137ConformanceLanguageId
  capability: V137ConformanceCapability
  status: V137ConformanceCaseStatus
  corpusRootSha256: string
  sourceSha256: string
  resultSha256: string
}

export class V137ConformanceCorpusError extends Error {
  constructor(readonly code: string) {
    super(`Executable conformance corpus rejected: ${code}.`)
    this.name = "V137ConformanceCorpusError"
  }
}

const fail = (code: string): never => {
  throw new V137ConformanceCorpusError(code)
}

const textEncoder = new TextEncoder()
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u

const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (encoded.ok === false) return fail("CANONICAL_JSON")
  return encoded.bytes
}

const frame = (value: Uint8Array): Uint8Array => {
  const output = new Uint8Array(8 + value.byteLength)
  new DataView(output.buffer).setBigUint64(0, BigInt(value.byteLength), false)
  output.set(value, 8)
  return output
}

const sha256 = (value: Uint8Array | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const exactKeys = (
  value: unknown,
  expected: readonly string[],
  code = "STRICT_SHAPE",
): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(code)
  }
  const record = value as Record<string, unknown>
  const actual = Object.keys(record)
  if (
    actual.length !== expected.length ||
    expected.some((key) => !Object.hasOwn(record, key))
  ) {
    fail(code)
  }
  return record
}

const exactArray = <T>(
  actual: readonly T[],
  expected: readonly T[],
  code: string,
): void => {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(code)
  }
}

const exactJson = (actual: unknown, expected: unknown, code: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(code)
}

const requireIdentifier = (value: unknown, code: string): string => {
  if (
    typeof value !== "string" ||
    !IDENTIFIER.test(value) ||
    textEncoder.encode(value).byteLength > 256
  ) {
    fail(code)
  }
  return value as string
}

const rootMaterial = (corpus: V137ConformanceCorpus): JsonValue[] => [
  {
    schemaVersion: corpus.schemaVersion,
    version: corpus.version,
    generatedBy: corpus.generatedBy,
    hashAlgorithm: corpus.hashAlgorithm,
    rootDomain: corpus.rootDomain,
    rootFraming: corpus.rootFraming,
    languageIds: corpus.languageIds,
    behaviorManifest: corpus.behaviorManifest,
  } as unknown as JsonValue,
  ...corpus.fixtures.map(
    (fixture) =>
      ({
        languageId: fixture.languageId,
        providerId: fixture.providerId,
        runtimeTarget: fixture.runtimeTarget,
        behaviorManifestId: fixture.behaviorManifestId,
        sourceEncoding: fixture.sourceEncoding,
        sourceSha256: fixture.sourceSha256,
        source: fixture.source,
      }) as JsonValue,
  ),
  ...corpus.cases.map((testCase) => testCase as unknown as JsonValue),
]

export const computeV137ConformanceCorpusRoot = (
  corpus: V137ConformanceCorpus,
): string => {
  const hash = createHash("sha256")
  hash.update(frame(textEncoder.encode(corpus.rootDomain)))
  for (const value of rootMaterial(corpus)) {
    hash.update(frame(canonicalBytes(value)))
  }
  return `sha256:${hash.digest("hex")}`
}

const validateBehaviorManifest = (
  value: V137ConformanceBehaviorManifest,
): void => {
  exactKeys(value, [
    "id",
    "description",
    "invocationScript",
    "expectedSelection",
    "expectedBrain",
  ])
  requireIdentifier(value.id, "BEHAVIOR_MANIFEST")
  if (
    typeof value.description !== "string" ||
    value.description.length === 0 ||
    textEncoder.encode(value.description).byteLength > 1_024 ||
    !Array.isArray(value.invocationScript)
  ) {
    fail("BEHAVIOR_MANIFEST")
  }
  if (value.invocationScript.length < 2) {
    fail("INVOCATION_SCRIPT")
  }
  const fixtureIds = new Set<string>()
  for (const [index, invocation] of value.invocationScript.entries()) {
    exactKeys(invocation, ["ordinal", "methodName", "inputFixtureId"])
    requireIdentifier(invocation.inputFixtureId, "INVOCATION_SCRIPT")
    if (
      invocation.ordinal !== index ||
      (invocation.methodName !== "selectActivations" &&
        invocation.methodName !== "soldierBrain") ||
      fixtureIds.has(invocation.inputFixtureId)
    ) {
      fail("INVOCATION_SCRIPT")
    }
    fixtureIds.add(invocation.inputFixtureId)
  }
  if (
    !value.invocationScript.some(
      ({ methodName }) => methodName === "selectActivations",
    ) ||
    !value.invocationScript.some(
      ({ methodName }) => methodName === "soldierBrain",
    )
  ) {
    fail("INVOCATION_SCRIPT")
  }
  canonicalBytes(value.expectedSelection)
  canonicalBytes(value.expectedBrain)
}

const validateFixtures = (
  fixtures: readonly V137ConformanceFixture[],
  behaviorManifestId: string,
): void => {
  if (!Array.isArray(fixtures) || fixtures.length !== 4) fail("FIXTURE_SET")
  const sourceHashes = new Set<string>()
  for (const [index, fixture] of fixtures.entries()) {
    exactKeys(fixture, [
      "languageId",
      "providerId",
      "runtimeTarget",
      "behaviorManifestId",
      "sourceEncoding",
      "sourceSha256",
      "source",
    ])
    const languageId = V1_37_CONFORMANCE_LANGUAGES[index]!
    if (
      fixture.languageId !== languageId ||
      fixture.behaviorManifestId !== behaviorManifestId ||
      fixture.sourceEncoding !== "utf-8" ||
      typeof fixture.source !== "string" ||
      fixture.source.length === 0 ||
      textEncoder.encode(fixture.source).byteLength > 64 * 1024 ||
      fixture.sourceSha256 !== sha256(fixture.source) ||
      sourceHashes.has(fixture.sourceSha256)
    ) {
      fail("FIXTURE_SET")
    }
    requireIdentifier(fixture.providerId, "FIXTURE_SET")
    const expectedTarget =
      languageId === "typescript"
        ? "runtime-js"
        : languageId === "python"
          ? "runtime-python"
          : "runtime-wasm-wasi"
    if (fixture.runtimeTarget !== expectedTarget) fail("FIXTURE_SET")
    sourceHashes.add(fixture.sourceSha256)
  }
}

const validateCases = (cases: readonly V137ConformanceCase[]): void => {
  if (!Array.isArray(cases) || cases.length === 0) fail("CASE_INVENTORY")
  const ids = new Set<string>()
  const kinds = new Set<V137ConformanceCaseKind>()
  const capabilities = new Set<V137ConformanceCapability>()
  let previousId = ""
  for (const testCase of cases) {
    exactKeys(testCase, [
      "id",
      "kind",
      "capability",
      "executionMode",
      "seed",
      "generatorId",
      "mutationTarget",
      "required",
      "unsupportedDisposition",
      "requiredLanguageIds",
      "expectation",
    ])
    exactKeys(testCase.expectation, [
      "resultClass",
      "reasonCode",
      "failingBoundary",
      "gameplayMutation",
      "retryable",
      "traceRef",
    ])
    requireIdentifier(testCase.id, "CASE_INVENTORY")
    if (testCase.id <= previousId || ids.has(testCase.id)) {
      fail("CASE_ORDER")
    }
    previousId = testCase.id
    ids.add(testCase.id)
    if (
      !V1_37_CONFORMANCE_CASE_KINDS.includes(testCase.kind) ||
      !V1_37_CONFORMANCE_REQUIRED_CAPABILITIES.includes(testCase.capability) ||
      (testCase.executionMode !== "strategy" &&
        testCase.executionMode !== "raw-envelope") ||
      testCase.required !== true ||
      testCase.unsupportedDisposition !== "fail-certification" ||
      !Array.isArray(testCase.requiredLanguageIds)
    ) {
      fail("CASE_INVENTORY")
    }
    exactArray(
      testCase.requiredLanguageIds,
      V1_37_CONFORMANCE_LANGUAGES,
      "CASE_LANGUAGE_MEMBERSHIP",
    )
    if (testCase.seed !== null) {
      requireIdentifier(testCase.seed, "CASE_INVENTORY")
    }
    if (testCase.generatorId !== null) {
      requireIdentifier(testCase.generatorId, "CASE_INVENTORY")
    }
    if (testCase.mutationTarget !== null) {
      requireIdentifier(testCase.mutationTarget, "CASE_INVENTORY")
    }
    if (
      (testCase.kind === "seeded-property" &&
        (testCase.seed === null || testCase.generatorId === null)) ||
      (testCase.kind === "mutation-kill" && testCase.mutationTarget === null) ||
      testCase.expectation.traceRef !== `trace:${testCase.id}` ||
      typeof testCase.expectation.gameplayMutation !== "boolean" ||
      typeof testCase.expectation.retryable !== "boolean"
    ) {
      fail("CASE_INVENTORY")
    }
    if (
      !V1_37_CONFORMANCE_RESULT_CLASSES.includes(
        testCase.expectation.resultClass,
      )
    ) {
      fail("CASE_EXPECTATION")
    }
    requireIdentifier(testCase.expectation.reasonCode, "CASE_EXPECTATION")
    requireIdentifier(testCase.expectation.failingBoundary, "CASE_EXPECTATION")
    kinds.add(testCase.kind)
    capabilities.add(testCase.capability)
  }
  exactArray(
    [...kinds].sort(),
    [...V1_37_CONFORMANCE_CASE_KINDS].sort(),
    "CASE_KIND_COVERAGE",
  )
  exactArray(
    [...capabilities].sort(),
    [...V1_37_CONFORMANCE_REQUIRED_CAPABILITIES].sort(),
    "CASE_CAPABILITY_COVERAGE",
  )
}

export const validateV137ConformanceCorpus = (
  value: unknown,
): Readonly<V137ConformanceCorpus> => {
  const corpus = value as V137ConformanceCorpus
  exactKeys(corpus, [
    "schemaVersion",
    "version",
    "generatedBy",
    "hashAlgorithm",
    "rootDomain",
    "rootFraming",
    "languageIds",
    "behaviorManifest",
    "fixtures",
    "cases",
    "corpusRootSha256",
  ])
  if (
    corpus.schemaVersion !== "v1.37-executable-conformance-corpus-v1" ||
    !/^v[1-9][0-9]*$/u.test(corpus.version) ||
    corpus.generatedBy !== "scripts/generate-v1-37-conformance-corpus.ts" ||
    corpus.hashAlgorithm !== "sha256" ||
    corpus.rootDomain !==
      "cowards-game:v1.37:executable-conformance-corpus:v1" ||
    corpus.rootFraming !== "unsigned-64-bit-big-endian-length-then-bytes" ||
    !Array.isArray(corpus.languageIds)
  ) {
    fail("CORPUS_HEADER")
  }
  exactArray(
    corpus.languageIds,
    V1_37_CONFORMANCE_LANGUAGES,
    "LANGUAGE_INVENTORY",
  )
  validateBehaviorManifest(corpus.behaviorManifest)
  validateFixtures(corpus.fixtures, corpus.behaviorManifest.id)
  validateCases(corpus.cases)
  if (
    !SHA256.test(corpus.corpusRootSha256) ||
    corpus.corpusRootSha256 !== computeV137ConformanceCorpusRoot(corpus)
  ) {
    fail("CORPUS_ROOT")
  }
  return corpus
}

export const validateCompleteConformanceCaseInventory = (
  results: readonly V137ConformanceCaseResult[],
): readonly Readonly<V137ConformanceCaseResult>[] => {
  if (
    !Array.isArray(results) ||
    results.length !==
      V1_37_CONFORMANCE_CORPUS.cases.length *
        V1_37_CONFORMANCE_CORPUS.fixtures.length
  ) {
    fail("INCOMPLETE_CASE_INVENTORY")
  }
  const accepted: V137ConformanceCaseResult[] = []
  let resultIndex = 0
  for (const testCase of V1_37_CONFORMANCE_CORPUS.cases) {
    for (const fixture of V1_37_CONFORMANCE_CORPUS.fixtures) {
      const result = results[resultIndex++]
      if (result === undefined) return fail("INCOMPLETE_CASE_INVENTORY")
      if (
        result.caseId !== testCase.id ||
        result.languageId !== fixture.languageId
      ) {
        fail("NON_CANONICAL_CASE_ORDER")
      }
      exactKeys(result, [
        "caseId",
        "languageId",
        "capability",
        "status",
        "corpusRootSha256",
        "sourceSha256",
        "resultSha256",
      ])
      if (result.capability !== testCase.capability) {
        fail("CASE_CAPABILITY_MISMATCH")
      }
      if (result.status !== "passed") fail("CASE_DID_NOT_PASS")
      if (result.corpusRootSha256 !== V1_37_CONFORMANCE_CORPUS_ROOT) {
        fail("CORPUS_IDENTITY_MISMATCH")
      }
      if (result.sourceSha256 !== fixture.sourceSha256) {
        fail("SOURCE_IDENTITY_MISMATCH")
      }
      if (!SHA256.test(result.resultSha256)) fail("RESULT_IDENTITY")
      accepted.push(deepFreeze(globalThis.structuredClone(result)))
    }
  }
  return deepFreeze(accepted)
}

export const createV137ConformanceRunRoot = (
  results: readonly V137ConformanceCaseResult[],
): string => {
  const accepted = validateCompleteConformanceCaseInventory(results)
  const hash = createHash("sha256")
  hash.update(
    frame(
      textEncoder.encode("cowards-game:v1.37:executable-conformance-run:v1"),
    ),
  )
  hash.update(frame(textEncoder.encode(V1_37_CONFORMANCE_CORPUS_ROOT)))
  for (const result of accepted) {
    hash.update(frame(canonicalBytes(result as unknown as JsonValue)))
  }
  return `sha256:${hash.digest("hex")}`
}

const V2_REVIEW_SHA256 =
  "sha256:871554dbd5d926a65016b1f30bc6dfb5403d52653579e9565b080b0ecb5e1942"
const V2_SEMANTIC_DIFF_SHA256 =
  "sha256:f5120aeeeb4877b626637a6ef5905ebc710a1630433642243e0d6d036ceb3707"

const V2_REVIEW = Object.freeze({
  schemaVersion: "v1.37-executable-conformance-independent-review-v1",
  reviewedBy: "phase-259-plan-16-pinned-toolchain-revalidation",
  candidateVersion: "v2",
  candidateCorpusRootSha256:
    "sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2",
  candidateCorpusFileSha256:
    "sha256:8d51df780a1c9dcb35e28547f4891af0e28a4bd2cd8e854165a61a1726f3a0dd",
  semanticDiffFileSha256: V2_SEMANTIC_DIFF_SHA256,
  sourceChanges: ["rust", "zig"],
  caseChanges: [],
  behaviorManifestChanged: false,
  expectedSelectionChanged: false,
  expectedBrainChanged: false,
  rust: {
    toolchain: "rustc 1.95.0 (59807616e 2026-04-14)",
    target: "wasm32-wasip1",
    artifactSha256:
      "sha256:fef2bad9e18a53e6e0de72573096dfd37165fdd824c1e5992b99f87a6a19ffbd",
    selectActivationsEquivalent: true,
    soldierBrainEquivalent: true,
  },
  zig: {
    toolchain: "0.16.0",
    target: "wasm32-wasi",
    artifactSha256:
      "sha256:76b3d99310baa72b05a13631f2b086f0f0829d95dbcbb98e9835f18303e7d08c",
    selectActivationsEquivalent: true,
    soldierBrainEquivalent: true,
  },
  status: "behavior_preserving_toolchain_repair",
})

const V3_CHANGED_PATHS = Object.freeze([
  "behaviorManifest",
  "cases.observation-d01-initial-initiative-both-observers",
  "cases.observation-d02-round-initiative-later-round",
  "cases.observation-d03-kernel-owned-signed-transport",
  "cases.observation-d04-real-revalidation-required",
  "cases.observation-d05-blocked-move-false",
  "cases.observation-d05-blocked-push-false",
  "cases.observation-d05-pushed-target-false",
  "cases.observation-d05-successful-pusher-true",
  "cases.observation-d05-turn-false",
  "cases.observation-d06-first-call-false",
  "cases.observation-d06-later-cycle-true",
  "cases.observation-d06-post-self-advance-true",
  "cases.observation-d07-new-slot-reset-false",
  "cases.observation-d08-observational-only-no-hold",
  "corpusRootSha256",
  "fixtures.python.behaviorManifestId",
  "fixtures.python.source",
  "fixtures.python.sourceSha256",
  "fixtures.rust.behaviorManifestId",
  "fixtures.rust.source",
  "fixtures.rust.sourceSha256",
  "fixtures.typescript.behaviorManifestId",
  "fixtures.typescript.source",
  "fixtures.typescript.sourceSha256",
  "fixtures.zig.behaviorManifestId",
  "fixtures.zig.source",
  "fixtures.zig.sourceSha256",
  "version",
])
const V3_FIXTURE_CHANGES = Object.freeze(
  V3_CHANGED_PATHS.filter((entry) => entry.startsWith("fixtures.")),
)
const V3_CASE_CHANGES = Object.freeze(
  V3_CHANGED_PATHS.filter((entry) => entry.startsWith("cases.")).map((entry) =>
    entry.slice("cases.".length),
  ),
)
const V3_DECISIONS = Object.freeze(
  ["D-01", "D-02", "D-03", "D-04", "D-05", "D-06", "D-07", "D-08"].map(
    (decisionId) => ({
      decisionId,
      disposition: "approved-observation-only",
    }),
  ),
)
const V3_PROTECTED_SURFACES = Object.freeze(
  [
    "valid-match-state",
    "action-legality",
    "canonical-event-order",
    "match-outcome",
    "v1.4-history",
    "hold-or-end-activation-vocabulary",
    "failure-ownership",
    "public-privacy-boundary",
  ].map((surface) => ({ surface, disposition: "unchanged" })),
)

export interface V137ActiveConformanceReviewInput {
  readonly registry: unknown
  readonly registryBytes: Uint8Array
  readonly reviewedPin: unknown
  readonly corpus: unknown
  readonly corpusBytes: Uint8Array
  readonly independentReview: unknown
  readonly independentReviewBytes: Uint8Array
  readonly semanticDiff: unknown
  readonly semanticDiffBytes: Uint8Array
}

const validateReviewShape = (
  review: unknown,
  expectedKeys: readonly string[],
): Record<string, unknown> => exactKeys(review, expectedKeys, "ACTIVE_REGISTRY")

const validateV2Review = (
  review: unknown,
  reviewBytes: Uint8Array,
  semanticDiff: unknown,
  semanticDiffBytes: Uint8Array,
): void => {
  validateReviewShape(review, Object.keys(V2_REVIEW))
  exactJson(review, V2_REVIEW, "ACTIVE_REGISTRY")
  if (
    sha256(reviewBytes) !== V2_REVIEW_SHA256 ||
    sha256(semanticDiffBytes) !== V2_SEMANTIC_DIFF_SHA256
  ) {
    fail("ACTIVE_REGISTRY")
  }
  const diff = exactKeys(
    semanticDiff,
    [
      "schemaVersion",
      "generatedBy",
      "baseline",
      "candidate",
      "changedPaths",
      "fixtureChanges",
      "sourceChanges",
      "caseChanges",
    ],
    "ACTIVE_REGISTRY",
  )
  exactKeys(
    diff.baseline,
    ["version", "corpusRootSha256", "path"],
    "ACTIVE_REGISTRY",
  )
  exactKeys(
    diff.candidate,
    ["version", "corpusRootSha256", "path"],
    "ACTIVE_REGISTRY",
  )
  if (
    diff.schemaVersion !== "v1.37-executable-conformance-semantic-diff-v1" ||
    diff.generatedBy !== "scripts/generate-v1-37-conformance-corpus.ts"
  ) {
    fail("ACTIVE_REGISTRY")
  }
  exactJson(diff.sourceChanges, ["rust", "zig"], "ACTIVE_REGISTRY")
  exactJson(diff.caseChanges, [], "ACTIVE_REGISTRY")
}

const validateV3Review = (
  corpus: V137ConformanceCorpus,
  review: unknown,
  reviewBytes: Uint8Array,
  semanticDiff: unknown,
  semanticDiffBytes: Uint8Array,
): void => {
  const candidatePin = V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN
  const expectedReview = {
    schemaVersion: "v1.37-executable-conformance-independent-review-v1",
    reviewedBy: "phase-260-plan-11-independent-observation-review",
    lifecycle: "inactive-candidate",
    current: false,
    status: "approved-inactive-observation-candidate",
    candidateVersion: "v3",
    candidateCorpusRootSha256: candidatePin.corpusRootSha256,
    candidateCorpusFileSha256: candidatePin.corpusFileSha256,
    semanticDiffFileSha256: candidatePin.semanticDiffFileSha256,
    caseInventoryRootSha256: candidatePin.caseInventoryRootSha256,
    sourceInventoryRootSha256: candidatePin.sourceInventoryRootSha256,
    caseRoots: candidatePin.caseRoots,
    sourceRoots: candidatePin.sourceRoots,
    decisionDispositions: V3_DECISIONS,
    protectedSurfaces: V3_PROTECTED_SURFACES,
    approvedChangedPaths: V3_CHANGED_PATHS,
  }
  validateReviewShape(review, Object.keys(expectedReview))
  exactJson(review, expectedReview, "ACTIVE_REGISTRY")
  if (
    sha256(reviewBytes) !== candidatePin.independentReviewFileSha256 ||
    sha256(semanticDiffBytes) !== candidatePin.semanticDiffFileSha256
  ) {
    fail("ACTIVE_REGISTRY")
  }

  const expectedCaseRoots = corpus.cases.map((testCase) => ({
    caseId: testCase.id,
    rootSha256: sha256(`${JSON.stringify(testCase, null, 2)}\n`),
  }))
  const expectedSourceRoots = corpus.fixtures.map((fixture) => ({
    languageId: fixture.languageId,
    sourceSha256: fixture.sourceSha256,
  }))
  exactJson(expectedCaseRoots, candidatePin.caseRoots, "ACTIVE_REGISTRY")
  exactJson(expectedSourceRoots, candidatePin.sourceRoots, "ACTIVE_REGISTRY")
  if (
    sha256(`${JSON.stringify(expectedCaseRoots, null, 2)}\n`) !==
      candidatePin.caseInventoryRootSha256 ||
    sha256(`${JSON.stringify(expectedSourceRoots, null, 2)}\n`) !==
      candidatePin.sourceInventoryRootSha256
  ) {
    fail("ACTIVE_REGISTRY")
  }

  const diff = exactKeys(
    semanticDiff,
    [
      "schemaVersion",
      "generatedBy",
      "baseline",
      "candidate",
      "changedPaths",
      "fixtureChanges",
      "sourceChanges",
      "caseChanges",
    ],
    "ACTIVE_REGISTRY",
  )
  const baseline = exactKeys(
    diff.baseline,
    ["version", "corpusRootSha256", "path"],
    "ACTIVE_REGISTRY",
  )
  const candidate = exactKeys(
    diff.candidate,
    ["version", "corpusRootSha256", "path"],
    "ACTIVE_REGISTRY",
  )
  if (
    diff.schemaVersion !== "v1.37-executable-conformance-semantic-diff-v1" ||
    diff.generatedBy !== "scripts/generate-v1-37-conformance-corpus.ts" ||
    baseline.version !== "v2" ||
    baseline.corpusRootSha256 !== V2_REVIEW.candidateCorpusRootSha256 ||
    baseline.path !==
      "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/corpus.json" ||
    candidate.version !== "v3" ||
    candidate.corpusRootSha256 !== candidatePin.corpusRootSha256 ||
    candidate.path !== candidatePin.corpusPath
  ) {
    fail("ACTIVE_REGISTRY")
  }
  exactJson(diff.changedPaths, V3_CHANGED_PATHS, "ACTIVE_REGISTRY")
  exactJson(diff.fixtureChanges, V3_FIXTURE_CHANGES, "ACTIVE_REGISTRY")
  exactJson(
    diff.sourceChanges,
    ["python", "rust", "typescript", "zig"],
    "ACTIVE_REGISTRY",
  )
  exactJson(diff.caseChanges, V3_CASE_CHANGES, "ACTIVE_REGISTRY")
}

export const validateV137ActiveConformanceReview = (
  input: V137ActiveConformanceReviewInput,
): void => {
  const registry = exactKeys(
    input.registry,
    [
      "schemaVersion",
      "activeVersion",
      "corpusRootSha256",
      "corpusFileSha256",
      "path",
    ],
    "ACTIVE_REGISTRY",
  )
  const pin = exactKeys(
    input.reviewedPin,
    [
      "schemaVersion",
      "reviewedUnder",
      "activeVersion",
      "corpusRootSha256",
      "corpusFileSha256",
      "registryFileSha256",
      "independentReviewFileSha256",
      "path",
      "independentReviewPath",
      "updatePolicy",
    ],
    "ACTIVE_REGISTRY",
  )
  const corpus = input.corpus as V137ConformanceCorpus
  validateV137ConformanceCorpus(corpus)
  if (
    registry.schemaVersion !== "v1.37-executable-conformance-registry-v1" ||
    pin.schemaVersion !== "v1.37-executable-conformance-reviewed-pin-v1" ||
    registry.activeVersion !== corpus.version ||
    registry.corpusRootSha256 !== corpus.corpusRootSha256 ||
    registry.corpusFileSha256 !== sha256(input.corpusBytes) ||
    registry.path !==
      `packages/golden/src/fixtures/v1-37-conformance-corpus/${corpus.version}/corpus.json` ||
    pin.activeVersion !== registry.activeVersion ||
    pin.corpusRootSha256 !== registry.corpusRootSha256 ||
    pin.corpusFileSha256 !== registry.corpusFileSha256 ||
    pin.registryFileSha256 !== sha256(input.registryBytes) ||
    pin.path !== registry.path ||
    pin.independentReviewPath !==
      `packages/golden/src/fixtures/v1-37-conformance-corpus/${corpus.version}/independent-review.json` ||
    pin.updatePolicy !== "explicit-new-version-and-reviewed-pin-change"
  ) {
    fail("ACTIVE_REGISTRY")
  }

  if (registry.activeVersion === "v2") {
    if (
      pin.reviewedUnder !== "259-16-toolchain-revalidation" ||
      pin.independentReviewFileSha256 !== V2_REVIEW_SHA256
    ) {
      fail("ACTIVE_REGISTRY")
    }
    validateV2Review(
      input.independentReview,
      input.independentReviewBytes,
      input.semanticDiff,
      input.semanticDiffBytes,
    )
    return
  }
  if (registry.activeVersion === "v3") {
    const candidatePin = V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN
    if (
      pin.reviewedUnder !== candidatePin.reviewedUnder ||
      pin.corpusRootSha256 !== candidatePin.corpusRootSha256 ||
      pin.corpusFileSha256 !== candidatePin.corpusFileSha256 ||
      pin.independentReviewFileSha256 !==
        candidatePin.independentReviewFileSha256 ||
      pin.path !== candidatePin.corpusPath ||
      pin.independentReviewPath !== candidatePin.independentReviewPath
    ) {
      fail("ACTIVE_REGISTRY")
    }
    validateV3Review(
      corpus,
      input.independentReview,
      input.independentReviewBytes,
      input.semanticDiff,
      input.semanticDiffBytes,
    )
    return
  }
  fail("ACTIVE_REGISTRY")
}

const fixtureUrl = (path: string): URL =>
  new URL(`./fixtures/v1-37-conformance-corpus/${path}`, import.meta.url)
const registryBytes = readFileSync(fixtureUrl("registry.json"))
const registry = deepFreeze(
  JSON.parse(registryBytes.toString("utf8")) as V137ConformanceRegistry,
)
const corpusBytes = readFileSync(
  fixtureUrl(`${registry.activeVersion}/corpus.json`),
)
const corpus = deepFreeze(
  JSON.parse(corpusBytes.toString("utf8")) as V137ConformanceCorpus,
)
const independentReviewBytes = readFileSync(
  fixtureUrl(`${registry.activeVersion}/independent-review.json`),
)
const independentReview = JSON.parse(
  independentReviewBytes.toString("utf8"),
) as unknown
const semanticDiffBytes = readFileSync(
  fixtureUrl(`${registry.activeVersion}/semantic-diff.json`),
)
const semanticDiff = JSON.parse(semanticDiffBytes.toString("utf8")) as unknown

validateV137ActiveConformanceReview({
  registry,
  registryBytes,
  reviewedPin: V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN,
  corpus,
  corpusBytes,
  independentReview,
  independentReviewBytes,
  semanticDiff,
  semanticDiffBytes,
})

export const V1_37_CONFORMANCE_CORPUS: Readonly<V137ConformanceCorpus> = corpus
export const V1_37_CONFORMANCE_CORPUS_ROOT = corpus.corpusRootSha256
export const V1_37_CONFORMANCE_ACTIVE_REGISTRY: Readonly<V137ConformanceRegistry> =
  registry
