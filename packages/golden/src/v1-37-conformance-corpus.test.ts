/// <reference types="node" />

import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  resolveCurrentSemanticAuthoritySelection,
  resolveSemanticAuthoritySelection,
} from "@cowards/spec"
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
  validateV137ActiveConformanceReview,
  validateV137ConformanceCorpus,
  type V137ActiveConformanceReviewInput,
  type V137ConformanceCaseResult,
  type V137ConformanceCorpus,
} from "./v1-37-conformance-corpus.js"
import { V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN } from "./v1-37-conformance-corpus-pin.js"
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "./v1-37-conformance-corpus-v3-candidate-pin.js"

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

const sha256 = (value: string | Uint8Array): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const fixtureRoot = fileURLToPath(
  new URL("./fixtures/v1-37-conformance-corpus/", import.meta.url),
)

const admissionInput = (
  version: "v2" | "v3",
): V137ActiveConformanceReviewInput => {
  const corpusBytes = readFileSync(
    path.join(fixtureRoot, version, "corpus.json"),
  )
  const corpus = JSON.parse(
    corpusBytes.toString("utf8"),
  ) as V137ConformanceCorpus
  const registry = {
    schemaVersion: "v1.37-executable-conformance-registry-v1",
    activeVersion: version,
    corpusRootSha256: corpus.corpusRootSha256,
    corpusFileSha256: sha256(corpusBytes),
    path: `packages/golden/src/fixtures/v1-37-conformance-corpus/${version}/corpus.json`,
  }
  const registryBytes = Buffer.from(`${JSON.stringify(registry, null, 2)}\n`)
  const independentReviewBytes = readFileSync(
    path.join(fixtureRoot, version, "independent-review.json"),
  )
  const semanticDiffBytes = readFileSync(
    path.join(fixtureRoot, version, "semantic-diff.json"),
  )
  const reviewedPin =
    version === "v2"
      ? {
          schemaVersion: "v1.37-executable-conformance-reviewed-pin-v1",
          reviewedUnder: "259-16-toolchain-revalidation",
          activeVersion: "v2",
          corpusRootSha256: corpus.corpusRootSha256,
          corpusFileSha256: sha256(corpusBytes),
          registryFileSha256: sha256(registryBytes),
          independentReviewFileSha256:
            "sha256:871554dbd5d926a65016b1f30bc6dfb5403d52653579e9565b080b0ecb5e1942",
          path: registry.path,
          independentReviewPath:
            "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/independent-review.json",
          updatePolicy: "explicit-new-version-and-reviewed-pin-change",
        }
      : {
          schemaVersion: "v1.37-executable-conformance-reviewed-pin-v1",
          reviewedUnder:
            V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.reviewedUnder,
          activeVersion: "v3",
          corpusRootSha256:
            V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256,
          corpusFileSha256:
            V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusFileSha256,
          registryFileSha256: sha256(registryBytes),
          independentReviewFileSha256:
            V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.independentReviewFileSha256,
          path: V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusPath,
          independentReviewPath:
            V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.independentReviewPath,
          updatePolicy: "explicit-new-version-and-reviewed-pin-change",
        }
  return {
    registry,
    registryBytes,
    reviewedPin,
    corpus,
    corpusBytes,
    independentReview: JSON.parse(independentReviewBytes.toString("utf8")),
    independentReviewBytes,
    semanticDiff: JSON.parse(semanticDiffBytes.toString("utf8")),
    semanticDiffBytes,
  }
}

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
    if (V1_37_CONFORMANCE_CORPUS.version === "v2") {
      expect(
        V1_37_CONFORMANCE_CORPUS.behaviorManifest.invocationScript,
      ).toEqual([
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
    } else {
      expect(
        V1_37_CONFORMANCE_CORPUS.behaviorManifest.invocationScript,
      ).toHaveLength(14)
      expect(
        V1_37_CONFORMANCE_CORPUS.behaviorManifest.invocationScript.map(
          ({ inputFixtureId }) => inputFixtureId,
        ),
      ).toEqual(
        expect.arrayContaining([
          "fixture:observation-d01-initial-initiative-both-observers",
          "fixture:observation-d08-observational-only-no-hold",
        ]),
      )
    }
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

  it("preserves historical v1.17 corpus evidence and resolves current registry from the sole selector", () => {
    const historicalRegistry = {
      schemaVersion: "v1.37-executable-conformance-registry-v1",
      activeVersion: "v2",
      corpusRootSha256:
        "sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2",
      corpusFileSha256:
        "sha256:8d51df780a1c9dcb35e28547f4891af0e28a4bd2cd8e854165a61a1726f3a0dd",
      path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v2/corpus.json",
    } as const
    const successorRegistry = {
      schemaVersion: "v1.37-executable-conformance-registry-v1",
      activeVersion: "v3",
      corpusRootSha256:
        "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
      corpusFileSha256:
        "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
      path: "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
    } as const
    const historicalSelection = resolveSemanticAuthoritySelection({
      semanticAuthorityKey: "runtime-v1.17",
    })
    const currentSelection = resolveCurrentSemanticAuthoritySelection({
      semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
    })
    expect(historicalSelection.semanticAuthorityKey).toBe("runtime-v1.17")
    expect(currentSelection?.semanticAuthorityKey).toBe(
      CURRENT_SEMANTIC_AUTHORITY_KEY,
    )
    expect(V1_37_CONFORMANCE_ACTIVE_REGISTRY).toEqual(
      currentSelection?.semanticAuthorityKey === "runtime-v1.19"
        ? successorRegistry
        : historicalRegistry,
    )
    expect(V1_37_CONFORMANCE_CORPUS.version).toBe(
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion,
    )
    expect(V1_37_CONFORMANCE_CORPUS_ROOT).toBe(
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.corpusRootSha256,
    )
    const activeCorpusPath = fileURLToPath(
      new URL(
        `./fixtures/v1-37-conformance-corpus/${V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion}/corpus.json`,
        import.meta.url,
      ),
    )
    expect(existsSync(activeCorpusPath)).toBe(true)
    expect(
      existsSync(
        path.join(path.dirname(activeCorpusPath), "..", "corpus.json"),
      ),
    ).toBe(false)
    expect(V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.activeVersion).toBe(
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion,
    )
    expect(V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusRootSha256).toBe(
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.corpusRootSha256,
    )
    expect(sha256(readFileSync(activeCorpusPath, "utf8"))).toBe(
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.corpusFileSha256,
    )
  })

  it("admits only the exact immutable review contract selected for v2 or v3", () => {
    expect(() =>
      validateV137ActiveConformanceReview(admissionInput("v2")),
    ).not.toThrow()
    expect(() =>
      validateV137ActiveConformanceReview(admissionInput("v3")),
    ).not.toThrow()

    const successor = admissionInput("v3")
    expect(successor.independentReview).toMatchObject({
      lifecycle: "inactive-candidate",
      current: false,
      status: "approved-inactive-observation-candidate",
    })
  })

  it.each([
    [
      "status relabel",
      (input: V137ActiveConformanceReviewInput) => {
        ;(input.independentReview as { status: string }).status =
          "approved-active"
      },
    ],
    [
      "candidate root drift",
      (input: V137ActiveConformanceReviewInput) => {
        ;(
          input.independentReview as { candidateCorpusRootSha256: string }
        ).candidateCorpusRootSha256 = sha256("wrong-root")
      },
    ],
    [
      "review hash drift",
      (input: V137ActiveConformanceReviewInput) => {
        ;(
          input.reviewedPin as { independentReviewFileSha256: string }
        ).independentReviewFileSha256 = sha256("wrong-review")
      },
    ],
    [
      "case inventory drift",
      (input: V137ActiveConformanceReviewInput) => {
        const review = input.independentReview as {
          caseRoots: Array<{ rootSha256: string }>
        }
        review.caseRoots[0]!.rootSha256 = sha256("wrong-case")
      },
    ],
    [
      "changed-path inventory drift",
      (input: V137ActiveConformanceReviewInput) => {
        const review = input.independentReview as {
          approvedChangedPaths: string[]
        }
        review.approvedChangedPaths.push("match-outcome")
      },
    ],
    [
      "missing review field",
      (input: V137ActiveConformanceReviewInput) => {
        delete (input.independentReview as Record<string, unknown>)
          .protectedSurfaces
      },
    ],
    [
      "extra review field",
      (input: V137ActiveConformanceReviewInput) => {
        ;(
          input.independentReview as Record<string, unknown>
        ).activationApproval = true
      },
    ],
  ])("fails v3 closed for %s", (_name, mutate) => {
    const input = admissionInput("v3")
    mutate(input)
    expect(() => validateV137ActiveConformanceReview(input)).toThrow(
      "ACTIVE_REGISTRY",
    )
  })

  it("rejects cross-version review hybrids and unknown active versions", () => {
    const hybrid = admissionInput("v3")
    const v2 = admissionInput("v2")
    ;(hybrid as { independentReview: unknown }).independentReview =
      v2.independentReview
    ;(hybrid as { independentReviewBytes: Uint8Array }).independentReviewBytes =
      v2.independentReviewBytes
    expect(() => validateV137ActiveConformanceReview(hybrid)).toThrow(
      "ACTIVE_REGISTRY",
    )

    const unknown = admissionInput("v3")
    ;(unknown.registry as { activeVersion: string }).activeVersion = "v4"
    expect(() => validateV137ActiveConformanceReview(unknown)).toThrow(
      "ACTIVE_REGISTRY",
    )
  })

  it("keeps immutable v1.17 bytes exact while the v3 source pin stays explicit", () => {
    const fixtureRoot = fileURLToPath(
      new URL("./fixtures/v1-37-conformance-corpus/", import.meta.url),
    )
    const registryPath = path.join(fixtureRoot, "registry.json")
    const currentPinPath = fileURLToPath(
      new URL("./v1-37-conformance-corpus-pin.ts", import.meta.url),
    )
    expect(sha256(readFileSync(registryPath, "utf8"))).toBe(
      V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.registryFileSha256,
    )
    expect(sha256(readFileSync(currentPinPath, "utf8"))).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(
      sha256(readFileSync(path.join(fixtureRoot, "v1/corpus.json"), "utf8")),
    ).toBe(
      "sha256:276aa063351d649db0d21a96b7db7f8af6fa6a5f5736736775d42d35ee7ec574",
    )
    expect(
      sha256(readFileSync(path.join(fixtureRoot, "v2/corpus.json"), "utf8")),
    ).toBe(
      "sha256:8d51df780a1c9dcb35e28547f4891af0e28a4bd2cd8e854165a61a1726f3a0dd",
    )
    expect(V1_37_CONFORMANCE_CORPUS.version).toBe(
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion,
    )
    expect(V1_37_CONFORMANCE_CORPUS_REVIEWED_PIN.activeVersion).toBe(
      V1_37_CONFORMANCE_ACTIVE_REGISTRY.activeVersion,
    )
    expect(existsSync(path.join(fixtureRoot, "corpus.json"))).toBe(false)

    expect(V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN).toMatchObject({
      lifecycle: "inactive-candidate",
      current: false,
      candidateVersion: "v3",
    })
    const candidatePath = path.join(
      fileURLToPath(new URL("../../../", import.meta.url)),
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusPath,
    )
    const candidate = JSON.parse(
      readFileSync(candidatePath, "utf8"),
    ) as V137ConformanceCorpus
    expect(validateV137ConformanceCorpus(candidate).version).toBe("v3")
    expect(candidate.corpusRootSha256).toBe(
      V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256,
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
