/// <reference types="node" />

import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_CORPUS_ROOT,
} from "../packages/golden/src/v1-37-conformance-corpus.js"
import {
  parseV137ConformanceCandidateArgs,
  writeV137ConformanceCandidate,
} from "./generate-v1-37-conformance-corpus.js"

const temporaryRoots: string[] = []

const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-corpus-candidate-"))
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

describe("v1.37 conformance candidate generation", () => {
  it("writes only a new versioned candidate and semantic diff", () => {
    const destinationRoot = temporaryRoot()
    const candidateCorpus = globalThis.structuredClone(
      V1_37_CONFORMANCE_CORPUS,
    )
    candidateCorpus.fixtures[0]!.source += "\n// reviewed candidate source change\n"

    const result = writeV137ConformanceCandidate({
      destinationRoot,
      nextVersion: "v2",
      candidateCorpus,
    })

    expect(result.version).toBe("v2")
    expect(result.corpusRootSha256).not.toBe(V1_37_CONFORMANCE_CORPUS_ROOT)
    expect(result.corpusPath).toBe(
      path.join(destinationRoot, "v2", "corpus.json"),
    )
    expect(result.semanticDiffPath).toBe(
      path.join(destinationRoot, "v2", "semantic-diff.json"),
    )

    const corpusBytes = readFileSync(result.corpusPath)
    const diffBytes = readFileSync(result.semanticDiffPath)
    const corpus = JSON.parse(corpusBytes.toString("utf8"))
    const diff = JSON.parse(diffBytes.toString("utf8"))
    expect(corpus.corpusRootSha256).toBe(result.corpusRootSha256)
    expect(sha256(corpusBytes)).toBe(result.corpusFileSha256)
    expect(diff).toMatchObject({
      schemaVersion: "v1.37-executable-conformance-semantic-diff-v1",
      baseline: {
        version: "v1",
        corpusRootSha256: V1_37_CONFORMANCE_CORPUS_ROOT,
      },
      candidate: {
        version: "v2",
        corpusRootSha256: result.corpusRootSha256,
      },
      sourceChanges: ["typescript"],
    })
    expect(diff.changedPaths).toContain("fixtures.typescript.source")
    expect(JSON.stringify(diff)).not.toMatch(/approval|approved|disposition/iu)
  })

  it("changes roots for seed, generator, case, mutation, expectation, and invocation inputs", () => {
    const mutations = [
      (corpus: typeof V1_37_CONFORMANCE_CORPUS) => {
        corpus.cases.find(({ seed }) => seed !== null)!.seed += ":changed"
      },
      (corpus: typeof V1_37_CONFORMANCE_CORPUS) => {
        corpus.cases.find(({ generatorId }) => generatorId !== null)!.generatorId +=
          ":changed"
      },
      (corpus: typeof V1_37_CONFORMANCE_CORPUS) => {
        corpus.cases[0]!.id = `z-${corpus.cases[0]!.id}`
        corpus.cases.sort((left, right) => left.id.localeCompare(right.id))
        for (const testCase of corpus.cases) {
          testCase.expectation.traceRef = `trace:${testCase.id}`
        }
      },
      (corpus: typeof V1_37_CONFORMANCE_CORPUS) => {
        corpus.cases.find(
          ({ mutationTarget }) => mutationTarget !== null,
        )!.mutationTarget += ":changed"
      },
      (corpus: typeof V1_37_CONFORMANCE_CORPUS) => {
        corpus.cases[0]!.expectation.reasonCode = "CHANGED_EXPECTATION"
      },
      (corpus: typeof V1_37_CONFORMANCE_CORPUS) => {
        corpus.behaviorManifest.invocationScript[0]!.inputFixtureId =
          "fixture:select:changed"
      },
    ]

    const roots = mutations.map((mutate, index) => {
      const corpus = globalThis.structuredClone(V1_37_CONFORMANCE_CORPUS)
      mutate(corpus)
      return writeV137ConformanceCandidate({
        destinationRoot: temporaryRoot(),
        nextVersion: `v${index + 2}`,
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
        nextVersion: "v2",
      }),
    ).toThrow("ACTIVE_GOLDEN_OVERWRITE_FORBIDDEN")

    expect(() =>
      writeV137ConformanceCandidate({
        destinationRoot: temporaryRoot(),
        nextVersion: "v1",
      }),
    ).toThrow("ACTIVE_VERSION_REUSE_FORBIDDEN")

    const destinationRoot = temporaryRoot()
    writeV137ConformanceCandidate({ destinationRoot, nextVersion: "v2" })
    expect(() =>
      writeV137ConformanceCandidate({ destinationRoot, nextVersion: "v2" }),
    ).toThrow("CANDIDATE_VERSION_EXISTS")
  })

  it("requires explicit candidate-only CLI arguments", () => {
    expect(
      parseV137ConformanceCandidateArgs([
        "--version",
        "v2",
        "--destination",
        ".planning/candidates/v1-37-conformance-corpus",
      ]),
    ).toEqual({
      nextVersion: "v2",
      destinationRoot: ".planning/candidates/v1-37-conformance-corpus",
      inputPath: undefined,
    })
    expect(() => parseV137ConformanceCandidateArgs(["--write"])).toThrow(
      "CANDIDATE_ARGUMENTS",
    )
  })
})
