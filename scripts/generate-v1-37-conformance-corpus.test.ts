/// <reference types="node" />

import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  resolveCurrentSemanticAuthoritySelection,
  resolveSemanticAuthoritySelection,
} from "@cowards/spec"
import { afterEach, describe, expect, it } from "vitest"
// eslint-disable-next-line no-restricted-imports -- repo-root governance test exercises the exact golden source contract.
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
  type V137ConformanceCorpus,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
import {
  checkCommittedV137ObservationCorpusV3Candidate,
  createV137ObservationCorpusV3Candidate,
  parseV137ConformanceCandidateArgs,
  reviewCommittedV137ObservationCorpusV3Candidate,
  repairV137PinnedToolchainFixtures,
  writeCommittedV137ObservationCorpusV3Candidate,
  writeV137ConformanceCandidate,
} from "./generate-v1-37-conformance-corpus.js"
// eslint-disable-next-line no-restricted-imports -- candidate review test binds the exact inactive pin without changing current exports.
import { V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN } from "../packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.js"

const temporaryRoots: string[] = []

const temporaryRoot = (): string => {
  const root = mkdtempSync(
    path.join(tmpdir(), "cowards-v137-corpus-candidate-"),
  )
  temporaryRoots.push(root)
  return root
}

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
  }
})

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const v3IsCurrent = V1_37_CONFORMANCE_CORPUS.version === "v3"
const successorVersion = `v${Number(V1_37_CONFORMANCE_CORPUS.version.slice(1)) + 1}`
const observationCorpus = (): V137ConformanceCorpus =>
  createV137ObservationCorpusV3Candidate()

const expectCurrentV3Evidence = (): void => {
  const currentSelection = resolveCurrentSemanticAuthoritySelection({
    semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
  })
  expect(currentSelection?.semanticAuthorityKey).toBe("runtime-v1.19")
  expect(V1_37_CONFORMANCE_CORPUS_ROOT).toBe(
    V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.corpusRootSha256,
  )
  expect(createV137ObservationCorpusV3Candidate()).toEqual(
    V1_37_CONFORMANCE_CORPUS,
  )
  expect(checkCommittedV137ObservationCorpusV3Candidate()).toEqual([])
}

describe("v1.37 conformance candidate generation", () => {
  it("creates an inactive v3 observation candidate with complete D-01 through D-08 cases", () => {
    const candidate = observationCorpus()

    expect(candidate.version).toBe("v3")
    expect(candidate.behaviorManifest.id).toBe(
      "behavior:truthful-strategy-observations:v1.19",
    )
    expect(candidate.cases.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "observation-d01-initial-initiative-both-observers",
        "observation-d02-round-initiative-later-round",
        "observation-d03-kernel-owned-signed-transport",
        "observation-d04-real-revalidation-required",
        "observation-d05-blocked-move-false",
        "observation-d05-blocked-push-false",
        "observation-d05-pushed-target-false",
        "observation-d05-successful-pusher-true",
        "observation-d05-turn-false",
        "observation-d06-first-call-false",
        "observation-d06-later-cycle-true",
        "observation-d06-post-self-advance-true",
        "observation-d07-new-slot-reset-false",
        "observation-d08-observational-only-no-hold",
      ]),
    )
    for (const fixture of candidate.fixtures) {
      expect(fixture.source).toContain("initialInitiativePlayerId")
      expect(fixture.source).toContain("hasInitialInitiative")
      expect(fixture.source).toContain("roundInitiativePlayerId")
      expect(fixture.source).toContain("hasRoundInitiative")
      expect(fixture.source).toContain("hasAdvancedThisActivation")
      expect(fixture.behaviorManifestId).toBe(candidate.behaviorManifest.id)
    }
  })

  it("writes v3 without mutating historical v1.17 and resolves whether v3 is current from the sole selector", () => {
    if (v3IsCurrent) {
      expectCurrentV3Evidence()
      return
    }
    const root = temporaryRoot()
    const goldenRoot = path.join(
      root,
      "packages/golden/src/fixtures/v1-37-conformance-corpus",
    )
    const result = writeCommittedV137ObservationCorpusV3Candidate({ root })

    expect(result.corpusPath).toBe(path.join(goldenRoot, "v3/corpus.json"))
    expect(result.semanticDiffPath).toBe(
      path.join(goldenRoot, "v3/semantic-diff.json"),
    )
    expect(() => readFileSync(path.join(goldenRoot, "registry.json"))).toThrow()
    const historicalSelection = resolveSemanticAuthoritySelection({
      semanticAuthorityKey: "runtime-v1.17",
    })
    const currentSelection = resolveCurrentSemanticAuthoritySelection({
      semanticAuthorityKey: CURRENT_SEMANTIC_AUTHORITY_KEY,
    })
    expect(historicalSelection.semanticAuthorityKey).toBe("runtime-v1.17")
    expect(result.corpusRootSha256).not.toBe(
      "sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2",
    )
    expect(result.corpusRootSha256 === V1_37_CONFORMANCE_CORPUS_ROOT).toBe(
      currentSelection?.semanticAuthorityKey === "runtime-v1.19",
    )
  })

  it("independently reviews and checks exact v3 roots and D-01 through D-08 dispositions", () => {
    if (v3IsCurrent) {
      expectCurrentV3Evidence()
      return
    }
    const root = temporaryRoot()
    writeCommittedV137ObservationCorpusV3Candidate({ root })
    const review = reviewCommittedV137ObservationCorpusV3Candidate({
      root,
      reviewedBy: "phase-260-plan-11-independent-observation-review",
    })

    expect(review.status).toBe("approved-inactive-observation-candidate")
    expect(review.lifecycle).toBe("inactive-candidate")
    expect(review.current).toBe(false)
    expect(
      review.decisionDispositions.map(({ decisionId }) => decisionId),
    ).toEqual(["D-01", "D-02", "D-03", "D-04", "D-05", "D-06", "D-07", "D-08"])
    expect(
      review.protectedSurfaces.every(
        ({ disposition }) => disposition === "unchanged",
      ),
    ).toBe(true)
    expect(checkCommittedV137ObservationCorpusV3Candidate({ root })).toEqual([])
  })

  it("rejects self-authored or stale candidate review evidence", () => {
    if (v3IsCurrent) {
      expectCurrentV3Evidence()
      return
    }
    const selfAuthoredRoot = temporaryRoot()
    writeCommittedV137ObservationCorpusV3Candidate({ root: selfAuthoredRoot })
    expect(() =>
      reviewCommittedV137ObservationCorpusV3Candidate({
        root: selfAuthoredRoot,
        reviewedBy: "scripts/generate-v1-37-conformance-corpus.ts",
      }),
    ).toThrow("SELF_AUTHORED_REVIEW")

    const staleRoot = temporaryRoot()
    writeCommittedV137ObservationCorpusV3Candidate({ root: staleRoot })
    const corpusPath = path.join(
      staleRoot,
      "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
    )
    const staleCorpus = readFileSync(corpusPath, "utf8").replace(
      "v1.37-observation-v1.19",
      "v1.37-observation-stale",
    )
    writeFileSync(corpusPath, staleCorpus)
    expect(() =>
      reviewCommittedV137ObservationCorpusV3Candidate({
        root: staleRoot,
        reviewedBy: "phase-260-plan-11-independent-observation-review",
      }),
    ).toThrow("CANDIDATE_CORPUS_STALE")
  })

  it("binds an explicit non-current candidate pin beside the Phase-259 pin", () => {
    expect(V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN).toMatchObject({
      schemaVersion: "v1.37-executable-conformance-candidate-pin-v1",
      lifecycle: "inactive-candidate",
      current: false,
      candidateVersion: "v3",
      corpusPath:
        "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/corpus.json",
      independentReviewPath:
        "packages/golden/src/fixtures/v1-37-conformance-corpus/v3/independent-review.json",
    })
    expect(V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.caseRoots).toHaveLength(30)
    expect(V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN.sourceRoots).toHaveLength(
      4,
    )
    expect(V1_37_CONFORMANCE_CORPUS_V3_CANDIDATE_PIN).not.toHaveProperty(
      "activeVersion",
    )
  })

  it("repairs Rust and Zig fixtures for the exact pinned compilers", () => {
    const repaired = repairV137PinnedToolchainFixtures()
    const root = temporaryRoot()
    const rust = repaired.fixtures.find(
      ({ languageId }) => languageId === "rust",
    )
    const zig = repaired.fixtures.find(({ languageId }) => languageId === "zig")
    if (rust === undefined || zig === undefined) {
      throw new Error("repaired fixtures are missing")
    }
    const rustPath = path.join(root, "main.rs")
    const zigPath = path.join(root, "main.zig")
    writeFileSync(rustPath, rust.source)
    writeFileSync(zigPath, zig.source)
    const rustCompile = spawnSync(
      "rustc",
      [
        "--target",
        "wasm32-wasip1",
        "-O",
        rustPath,
        "-o",
        path.join(root, "rust.wasm"),
      ],
      { encoding: "utf8", shell: false, timeout: 30_000 },
    )
    const zigCompile = spawnSync(
      "zig",
      [
        "build-exe",
        "-target",
        "wasm32-wasi",
        "-O",
        "ReleaseSmall",
        zigPath,
        `-femit-bin=${path.join(root, "zig.wasm")}`,
      ],
      { encoding: "utf8", shell: false, timeout: 30_000 },
    )
    expect(rustCompile.status, rustCompile.stderr).toBe(0)
    expect(zigCompile.status, zigCompile.stderr).toBe(0)
  })

  it("compiles the v3 observation fixtures with the pinned Rust and Zig toolchains", () => {
    const candidate = observationCorpus()
    const root = temporaryRoot()
    const rust = candidate.fixtures.find(
      ({ languageId }) => languageId === "rust",
    )
    const zig = candidate.fixtures.find(
      ({ languageId }) => languageId === "zig",
    )
    if (rust === undefined || zig === undefined) {
      throw new Error("candidate fixtures are missing")
    }
    const rustPath = path.join(root, "candidate.rs")
    const zigPath = path.join(root, "candidate.zig")
    writeFileSync(rustPath, rust.source)
    writeFileSync(zigPath, zig.source)
    const rustCompile = spawnSync(
      "rustc",
      [
        "--target",
        "wasm32-wasip1",
        "-O",
        rustPath,
        "-o",
        path.join(root, "candidate-rust.wasm"),
      ],
      { encoding: "utf8", shell: false, timeout: 30_000 },
    )
    const zigCompile = spawnSync(
      "zig",
      [
        "build-exe",
        "-target",
        "wasm32-wasi",
        "-O",
        "ReleaseSmall",
        zigPath,
        `-femit-bin=${path.join(root, "candidate-zig.wasm")}`,
      ],
      { encoding: "utf8", shell: false, timeout: 30_000 },
    )
    expect(rustCompile.status, rustCompile.stderr).toBe(0)
    expect(zigCompile.status, zigCompile.stderr).toBe(0)
  })

  it("writes only a new versioned candidate and semantic diff", () => {
    const destinationRoot = path.join(
      temporaryRoot(),
      "not-yet-created",
      "candidates",
    )
    const candidateCorpus = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
    candidateCorpus.fixtures[0]!.source +=
      "\n// reviewed candidate source change\n"

    const result = writeV137ConformanceCandidate({
      destinationRoot,
      nextVersion: successorVersion,
      candidateCorpus,
    })

    expect(result.version).toBe(successorVersion)
    expect(result.corpusRootSha256).not.toBe(V1_37_CONFORMANCE_CORPUS_ROOT)
    expect(result.corpusPath).toBe(
      path.join(destinationRoot, successorVersion, "corpus.json"),
    )
    expect(result.semanticDiffPath).toBe(
      path.join(destinationRoot, successorVersion, "semantic-diff.json"),
    )
    expect(result.corpusLogicalPath).toBe(`${successorVersion}/corpus.json`)

    const corpusBytes = readFileSync(result.corpusPath)
    const diffBytes = readFileSync(result.semanticDiffPath)
    const corpus = JSON.parse(corpusBytes.toString("utf8"))
    const diff = JSON.parse(diffBytes.toString("utf8"))
    expect(corpus.corpusRootSha256).toBe(result.corpusRootSha256)
    expect(sha256(corpusBytes)).toBe(result.corpusFileSha256)
    expect(diff).toMatchObject({
      schemaVersion: "v1.37-executable-conformance-semantic-diff-v1",
      baseline: {
        version: V1_37_CONFORMANCE_CORPUS.version,
        corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      },
      candidate: {
        version: successorVersion,
        corpusRootSha256: result.corpusRootSha256,
        path: `${successorVersion}/corpus.json`,
      },
      sourceChanges: ["typescript"],
      fixtureChanges: [
        "fixtures.typescript.source",
        "fixtures.typescript.sourceSha256",
      ],
    })
    expect(diff.changedPaths).toContain("fixtures.typescript.source")
    expect(diffBytes.toString("utf8")).not.toContain(destinationRoot)
    expect(JSON.stringify(diff)).not.toMatch(/approval|approved|disposition/iu)
  })

  it("reports every governed fixture identity field in the semantic diff", () => {
    const candidateCorpus = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
    candidateCorpus.fixtures[0]!.providerId =
      "strategy-language-provider-js-ts-reviewed-candidate"

    const result = writeV137ConformanceCandidate({
      destinationRoot: temporaryRoot(),
      nextVersion: successorVersion,
      candidateCorpus,
    })
    const diff = JSON.parse(readFileSync(result.semanticDiffPath, "utf8"))
    expect(diff.fixtureChanges).toEqual(["fixtures.typescript.providerId"])
    expect(diff.changedPaths).toContain("fixtures.typescript.providerId")
  })

  it("changes roots for seed, generator, case, mutation, expectation, and invocation inputs", () => {
    const mutations = [
      (corpus: V137ConformanceCorpus) => {
        corpus.cases.find(({ seed }) => seed !== null)!.seed += ":changed"
      },
      (corpus: V137ConformanceCorpus) => {
        corpus.cases.find(
          ({ generatorId }) => generatorId !== null,
        )!.generatorId += ":changed"
      },
      (corpus: V137ConformanceCorpus) => {
        corpus.cases[0]!.id = `z-${corpus.cases[0]!.id}`
        corpus.cases.sort((left, right) => left.id.localeCompare(right.id))
        for (const testCase of corpus.cases) {
          testCase.expectation.traceRef = `trace:${testCase.id}`
        }
      },
      (corpus: V137ConformanceCorpus) => {
        corpus.cases.find(
          ({ mutationTarget }) => mutationTarget !== null,
        )!.mutationTarget += ":changed"
      },
      (corpus: V137ConformanceCorpus) => {
        corpus.cases[0]!.expectation.reasonCode = "CHANGED_EXPECTATION"
      },
      (corpus: V137ConformanceCorpus) => {
        corpus.behaviorManifest.invocationScript[0]!.inputFixtureId =
          "fixture:select:changed"
      },
    ]

    const roots = mutations.map((mutate, index) => {
      const corpus = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
      mutate(corpus)
      return writeV137ConformanceCandidate({
        destinationRoot: temporaryRoot(),
        nextVersion: `v${index + Number(successorVersion.slice(1))}`,
        candidateCorpus: corpus,
      }).corpusRootSha256
    })

    expect(new Set(roots).size).toBe(mutations.length)
    expect(roots).not.toContain(V1_37_CONFORMANCE_CORPUS_ROOT)
  })

  it("rejects active overwrite, active version reuse, and existing candidates", () => {
    expect(() =>
      writeV137ConformanceCandidate({
        destinationRoot:
          "packages/golden/src/fixtures/v1-37-conformance-corpus",
        nextVersion: successorVersion,
      }),
    ).toThrow("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")

    expect(() =>
      writeV137ConformanceCandidate({
        destinationRoot: temporaryRoot(),
        nextVersion: V1_37_CONFORMANCE_CORPUS.version,
      }),
    ).toThrow("ACTIVE_VERSION_REUSE_FORBIDDEN")

    const destinationRoot = temporaryRoot()
    writeV137ConformanceCandidate({
      destinationRoot,
      nextVersion: successorVersion,
    })
    expect(() =>
      writeV137ConformanceCandidate({
        destinationRoot,
        nextVersion: successorVersion,
      }),
    ).toThrow("CANDIDATE_VERSION_EXISTS")
  })

  it("requires explicit candidate-only CLI arguments", () => {
    expect(
      parseV137ConformanceCandidateArgs([
        "--version",
        "v3",
        "--destination",
        ".planning/candidates/v1-37-conformance-corpus",
      ]),
    ).toEqual({
      nextVersion: "v3",
      destinationRoot: ".planning/candidates/v1-37-conformance-corpus",
      inputPath: undefined,
    })
    expect(() => parseV137ConformanceCandidateArgs(["--write"])).toThrow(
      "CANDIDATE_ARGUMENTS",
    )
  })
})
