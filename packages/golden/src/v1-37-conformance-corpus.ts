/// <reference types="node" />

import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { encodeCanonicalJson, type JsonValue } from "@cowards/spec"

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
  resultClass: "success" | "player_violation" | "system_failure"
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
  const expectedInvocations = [
    [0, "selectActivations", "fixture:select:first-active"],
    [1, "soldierBrain", "fixture:brain:turn-to-stone"],
  ] as const
  if (value.invocationScript.length !== expectedInvocations.length) {
    fail("INVOCATION_SCRIPT")
  }
  for (const [index, invocation] of value.invocationScript.entries()) {
    exactKeys(invocation, ["ordinal", "methodName", "inputFixtureId"])
    const expected = expectedInvocations[index]!
    if (
      invocation.ordinal !== expected[0] ||
      invocation.methodName !== expected[1] ||
      invocation.inputFixtureId !== expected[2]
    ) {
      fail("INVOCATION_SCRIPT")
    }
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
    if (
      (testCase.seed !== null && typeof testCase.seed !== "string") ||
      (testCase.generatorId !== null &&
        typeof testCase.generatorId !== "string") ||
      (testCase.mutationTarget !== null &&
        typeof testCase.mutationTarget !== "string") ||
      (testCase.kind === "seeded-property" &&
        (testCase.seed === null || testCase.generatorId === null)) ||
      (testCase.kind === "mutation-kill" &&
        testCase.mutationTarget === null) ||
      testCase.expectation.traceRef !== `trace:${testCase.id}` ||
      typeof testCase.expectation.gameplayMutation !== "boolean" ||
      typeof testCase.expectation.retryable !== "boolean"
    ) {
      fail("CASE_INVENTORY")
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
    corpus.rootFraming !==
      "unsigned-64-bit-big-endian-length-then-bytes" ||
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
      textEncoder.encode(
        "cowards-game:v1.37:executable-conformance-run:v1",
      ),
    ),
  )
  hash.update(frame(textEncoder.encode(V1_37_CONFORMANCE_CORPUS_ROOT)))
  for (const result of accepted) {
    hash.update(frame(canonicalBytes(result as unknown as JsonValue)))
  }
  return `sha256:${hash.digest("hex")}`
}

const loadJson = (url: URL): unknown =>
  JSON.parse(readFileSync(url, "utf8")) as unknown

const corpus = deepFreeze(
  loadJson(
    new URL(
      "./fixtures/v1-37-conformance-corpus/v1/corpus.json",
      import.meta.url,
    ),
  ) as V137ConformanceCorpus,
)
const registry = deepFreeze(
  loadJson(
    new URL(
      "./fixtures/v1-37-conformance-corpus/registry.json",
      import.meta.url,
    ),
  ) as V137ConformanceRegistry,
)

validateV137ConformanceCorpus(corpus)
exactKeys(registry, [
  "schemaVersion",
  "activeVersion",
  "corpusRootSha256",
  "path",
])
if (
  registry.schemaVersion !== "v1.37-executable-conformance-registry-v1" ||
  registry.activeVersion !== corpus.version ||
  registry.corpusRootSha256 !== corpus.corpusRootSha256 ||
  registry.path !==
    `packages/golden/src/fixtures/v1-37-conformance-corpus/${corpus.version}/corpus.json`
) {
  fail("ACTIVE_REGISTRY")
}

export const V1_37_CONFORMANCE_CORPUS: Readonly<V137ConformanceCorpus> = corpus
export const V1_37_CONFORMANCE_CORPUS_ROOT = corpus.corpusRootSha256
export const V1_37_CONFORMANCE_ACTIVE_REGISTRY: Readonly<V137ConformanceRegistry> =
  registry
