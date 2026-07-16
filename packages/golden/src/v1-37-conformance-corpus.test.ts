/// <reference types="node" />

import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  V1_37_CONFORMANCE_ACTIVE_REGISTRY,
  V1_37_CONFORMANCE_CASE_KINDS,
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  V1_37_CONFORMANCE_LANGUAGES,
  V1_37_CONFORMANCE_REQUIRED_CAPABILITIES,
  computeV137ConformanceCorpusRoot,
  createV137ConformanceRunRoot,
  validateCompleteConformanceCaseInventory,
  validateV137ConformanceCorpus,
  type V137ConformanceCaseResult,
  type V137ConformanceCorpus,
} from "./v1-37-conformance-corpus.js"
import { V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN } from "./v1-37-conformance-corpus-pin.js"

const expectedLanguages = ["typescript", "python", "rust", "zig"] as const
const expectedKinds = [
  "normative",
  "boundary",
  "seeded-property",
  "mutation-kill",
  "positive-failure",
  "negative-failure",
  "raw-envelope",
] as const
const expectedCapabilities = [
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
] as const

const sha256 = (value: string): string =>
  `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`

const completeResults = (): V137ConformanceCaseResult[] =>
  V1_37_CONFORMANCE_CORPUS.cases.flatMap((testCase) =>
    V1_37_CONFORMANCE_CORPUS.fixtures.map((fixture) => ({
      caseId: testCase.id,
      languageId: fixture.languageId,
      capability: testCase.capability,
      status: "passed" as const,
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      sourceSha256: fixture.sourceSha256,
      resultSha256: sha256(`${testCase.id}:${fixture.languageId}:result`),
    })),
  )

const expectCorpusMutationRejected = (
  mutate: (corpus: V137ConformanceCorpus) => void,
  code: string,
): void => {
  const corpus = globalThis.structuredClone(
    V1_37_CONFORMANCE_CORPUS,
  ) as V137ConformanceCorpus
  mutate(corpus)
  corpus.corpusRootSha256 = computeV137ConformanceCorpusRoot(corpus)
  expect(() => validateV137ConformanceCorpus(corpus)).toThrow(code)
}

describe("v1.37 executable conformance corpus", () => {
  it("freezes one closed mandatory D-01 through D-04 manifest", () => {
    expect(V1_37_CONFORMANCE_CORPUS.schemaVersion).toBe(
      "v1.37-executable-conformance-corpus-v1",
    )
    expect(V1_37_CONFORMANCE_LANGUAGES).toEqual(expectedLanguages)
    expect(V1_37_CONFORMANCE_CASE_KINDS).toEqual(expectedKinds)
    expect(V1_37_CONFORMANCE_REQUIRED_CAPABILITIES).toEqual(
      expectedCapabilities,
    )
    expect(V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)).toEqual(
      [...V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)].sort(),
    )
    expect(
      new Set(V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id)).size,
    ).toBe(V1_37_CONFORMANCE_CORPUS.cases.length)
    expect(
      new Set(V1_37_CONFORMANCE_CORPUS.cases.map(({ kind }) => kind)),
    ).toEqual(new Set(expectedKinds))
    expect(
      new Set(
        V1_37_CONFORMANCE_CORPUS.cases.map(({ capability }) => capability),
      ),
    ).toEqual(new Set(expectedCapabilities))

    for (const testCase of V1_37_CONFORMANCE_CORPUS.cases) {
      expect(testCase.required).toBe(true)
      expect(testCase.unsupportedDisposition).toBe("fail-certification")
      expect(testCase.requiredLanguageIds).toEqual(expectedLanguages)
      expect(testCase.expectation.traceRef).toBe(`trace:${testCase.id}`)
    }

    expect(Object.isFrozen(V1_37_CONFORMANCE_CORPUS)).toBe(true)
    expect(Object.isFrozen(V1_37_CONFORMANCE_CORPUS.cases)).toBe(true)
    expect(Object.isFrozen(V1_37_CONFORMANCE_CORPUS.cases[0])).toBe(true)
  })

  it("binds readable independent fixture source bytes to one behavior manifest", () => {
    expect(
      V1_37_CONFORMANCE_CORPUS.fixtures.map(({ languageId }) => languageId),
    ).toEqual(expectedLanguages)
    expect(V1_37_CONFORMANCE_CORPUS.behaviorManifest.invocationScript).toEqual([
      {
        ordinal: 0,
        methodName: "selectActivations",
        inputFixtureId: "fixture:select:first-active",
      },
      {
        ordinal: 1,
        methodName: "soldierBrain",
        inputFixtureId: "fixture:brain:turn-to-stone",
      },
    ])
    for (const fixture of V1_37_CONFORMANCE_CORPUS.fixtures) {
      expect(fixture.source.trim().split("\n").length).toBeGreaterThan(5)
      expect(fixture.sourceSha256).toBe(sha256(fixture.source))
      expect(fixture.behaviorManifestId).toBe(
        V1_37_CONFORMANCE_CORPUS.behaviorManifest.id,
      )
    }
    expect(
      new Set(
        V1_37_CONFORMANCE_CORPUS.fixtures.map(
          ({ sourceSha256 }) => sourceSha256,
        ),
      ).size,
    ).toBe(expectedLanguages.length)
    expect(
      V1_37_CONFORMANCE_CORPUS.cases.some(
        ({ executionMode }) => executionMode === "raw-envelope",
      ),
    ).toBe(true)
  })

  it("recomputes the domain-framed root and changes it for every governed input", () => {
    validateV137ConformanceCorpus(V1_37_CONFORMANCE_CORPUS)
    expect(computeV137ConformanceCorpusRoot(V1_37_CONFORMANCE_CORPUS)).toBe(
      V1_37_CONFORMANCE_CORPUS_ROOT,
    )

    const sourceMutation = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
    sourceMutation.fixtures[0]!.source += "\n// mutation"
    expect(computeV137ConformanceCorpusRoot(sourceMutation)).not.toBe(
      V1_37_CONFORMANCE_CORPUS_ROOT,
    )

    const seedMutation = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
    const seeded = seedMutation.cases.find(({ seed }) => seed !== null)!
    seeded.seed = `${seeded.seed}:mutation`
    expect(computeV137ConformanceCorpusRoot(seedMutation)).not.toBe(
      V1_37_CONFORMANCE_CORPUS_ROOT,
    )

    const expectationMutation = globalThis.structuredClone(
      V1_37_CONFORMANCE_CORPUS,
    )
    expectationMutation.cases[0]!.expectation.reasonCode = "MUTATED"
    expect(computeV137ConformanceCorpusRoot(expectationMutation)).not.toBe(
      V1_37_CONFORMANCE_CORPUS_ROOT,
    )
  })

  it("resolves the active immutable version by exact version, root, and path", () => {
    expect(V1_37_CONFORMANCE_ACTIVE_REGISTRY).toEqual({
      schemaVersion: "v1.37-executable-conformance-registry-v1",
      activeVersion: V1_37_CONFORMANCE_CORPUS.version,
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      corpusFileSha256:
        "sha256:8d51df780a1c9dcb35e28547f4891af0e28a4bd2cd8e854165a61a1726f3a0dd",
      path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/corpus.json",
    })
    const activeCorpusPath = fileURLToPath(
      new URL(
        "./fixtures/v1-37-conformance-corpus/v2/corpus.json",
        import.meta.url,
      ),
    )
    expect(existsSync(activeCorpusPath)).toBe(true)
    expect(
      existsSync(
        path.join(path.dirname(activeCorpusPath), "..", "corpus.json"),
      ),
    ).toBe(false)
    expect(V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN).toEqual({
      schemaVersion: "v1.37-executable-conformance-reviewed-pin-v1",
      reviewedUnder: "259-16-toolchain-revalidation",
      activeVersion: "v2",
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      corpusFileSha256:
        "sha256:8d51df780a1c9dcb35e28547f4891af0e28a4bd2cd8e854165a61a1726f3a0dd",
      registryFileSha256:
        "sha256:440869c22aaffca1e872245809823cded028fb07783f1e7d6ece7b0b3781f3a0",
      independentReviewFileSha256:
        "sha256:871554dbd5d926a65016b1f30bc6dfb5403d52653579e9565b080b0ecb5e1942",
      path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/corpus.json",
      independentReviewPath:
        "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/independent-review.json",
      updatePolicy: "explicit-new-version-and-reviewed-pin-change",
    })
    expect(sha256(readFileSync(activeCorpusPath, "utf8"))).toBe(
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusFileSha256,
    )
  })

  it("rejects missing, duplicate, reordered, skipped, unsupported, and substituted results", () => {
    const results = completeResults()
    expect(validateCompleteConformanceCaseInventory(results)).toHaveLength(
      V1_37_CONFORMANCE_CORPUS.cases.length *
        V1_37_CONFORMANCE_CORPUS.fixtures.length,
    )
    expect(createV137ConformanceRunRoot(results)).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(createV137ConformanceRunRoot(results)).toBe(
      createV137ConformanceRunRoot(completeResults()),
    )

    const missing = results.slice(1)
    expect(() => validateCompleteConformanceCaseInventory(missing)).toThrow(
      "INCOMPLETE_CASE_INVENTORY",
    )

    const duplicate = [...results, results[0]!]
    expect(() => validateCompleteConformanceCaseInventory(duplicate)).toThrow(
      "INCOMPLETE_CASE_INVENTORY",
    )

    const reordered = [...results]
    ;[reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!]
    expect(() => validateCompleteConformanceCaseInventory(reordered)).toThrow(
      "NON_CANONICAL_CASE_ORDER",
    )

    for (const status of ["skipped", "unsupported", "failed"] as const) {
      const blocked = globalThis.structuredClone(results)
      blocked[0]!.status = status
      expect(() => validateCompleteConformanceCaseInventory(blocked)).toThrow(
        "CASE_DID_NOT_PASS",
      )
    }

    const substituted = globalThis.structuredClone(results)
    substituted[0]!.sourceSha256 = sha256("substituted")
    expect(() => validateCompleteConformanceCaseInventory(substituted)).toThrow(
      "SOURCE_IDENTITY_MISMATCH",
    )
  })

  it("rejects coercible identifiers, open enums, and unbounded optional identifiers", () => {
    expectCorpusMutationRejected((corpus) => {
      corpus.behaviorManifest.invocationScript[0]!.inputFixtureId =
        123 as unknown as string
    }, "INVOCATION_SCRIPT")
    expectCorpusMutationRejected((corpus) => {
      corpus.cases[0]!.expectation.resultClass =
        "made_up" as (typeof corpus.cases)[0]["expectation"]["resultClass"]
    }, "CASE_EXPECTATION")
    expectCorpusMutationRejected((corpus) => {
      corpus.cases.find(({ seed }) => seed !== null)!.seed = ""
    }, "CASE_INVENTORY")
    expectCorpusMutationRejected((corpus) => {
      corpus.cases.find(
        ({ generatorId }) => generatorId !== null,
      )!.generatorId = "x".repeat(257)
    }, "CASE_INVENTORY")
    expectCorpusMutationRejected((corpus) => {
      corpus.cases.find(
        ({ mutationTarget }) => mutationTarget !== null,
      )!.mutationTarget = ""
    }, "CASE_INVENTORY")
  })
})
