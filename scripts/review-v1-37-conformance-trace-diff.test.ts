/// <reference types="node" />

import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
// eslint-disable-next-line no-restricted-imports -- repo-root governance test uses the canonical JSON codec directly.
import {
  encodeCanonicalJson,
  type JsonValue,
} from "../packages/spec/src/index.js"
import { hashCanonicalConformanceTrace } from "../packages/golden/src/v1-37-conformance-trace.js"
import {
  computeV137ConformanceTraceCandidateRoot,
  generateV137ConformanceTraceCandidate,
} from "./generate-v1-37-conformance-traces.js"
import {
  PROTECTED_V137_COMPATIBILITY_CATEGORIES,
  reviewV137ConformanceTraceDiff,
  writeV137ConformanceTraceIndependentReview,
} from "./review-v1-37-conformance-trace-diff.js"

const roots: string[] = []
const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v137-review-"))
  roots.push(root)
  return root
}
const render = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

afterEach(() => {
  while (roots.length > 0) {
    rmSync(roots.pop()!, { recursive: true, force: true })
  }
})

const candidate = (): string => {
  const directory = path.join(temporaryRoot(), "candidate")
  generateV137ConformanceTraceCandidate({
    candidateVersion: "v1.37-conformance-trace-v2",
    candidateDirectory: directory,
  })
  return directory
}

const rehash = (directory: string): void => {
  const manifestPath = path.join(directory, "manifest.json")
  const diffPath = path.join(directory, "semantic-diff.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  manifest.candidateRootSha256 =
    computeV137ConformanceTraceCandidateRoot(manifest)
  writeFileSync(manifestPath, render(manifest))
  const diff = JSON.parse(readFileSync(diffPath, "utf8"))
  diff.candidateRootSha256 = manifest.candidateRootSha256
  const { semanticDiffRootSha256: _root, ...material } = diff
  const encoded = encodeCanonicalJson(material as JsonValue, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) throw new Error(encoded.error.code)
  diff.semanticDiffRootSha256 = `sha256:${createHash("sha256")
    .update("cowards-game:v1.37:conformance-trace-semantic-diff:v1\0")
    .update(encoded.bytes)
    .digest("hex")}`
  writeFileSync(diffPath, render(diff))
}

const mutateTraceAndRehash = (
  directory: string,
  caseId: string,
  mutate: (trace: Record<string, any>) => void,
): void => {
  const tracePath = path.join(directory, "traces", `${caseId}.json`)
  const trace = JSON.parse(readFileSync(tracePath, "utf8"))
  mutate(trace)
  trace.traceRoot = hashCanonicalConformanceTrace(trace)
  const traceBytes = render(trace)
  writeFileSync(tracePath, traceBytes)

  const manifestPath = path.join(directory, "manifest.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  const entry = manifest.cases.find(
    ({ caseId: entryCaseId }: { caseId: string }) => entryCaseId === caseId,
  )
  entry.traceRoot = trace.traceRoot
  entry.traceFileSha256 = `sha256:${createHash("sha256")
    .update(traceBytes)
    .digest("hex")}`
  writeFileSync(manifestPath, render(manifest))

  const diffPath = path.join(directory, "semantic-diff.json")
  const diff = JSON.parse(readFileSync(diffPath, "utf8"))
  diff.caseDiffs.find(
    ({ caseId: entryCaseId }: { caseId: string }) => entryCaseId === caseId,
  ).candidateTraceRoot = trace.traceRoot
  writeFileSync(diffPath, render(diff))
  rehash(directory)
}

describe("v1.37 independent conformance trace review", () => {
  it("independently recomputes a protected-category-zero no-semantic-delta review", () => {
    const directory = candidate()
    const review = reviewV137ConformanceTraceDiff({
      candidateDirectory: directory,
    })
    expect(review.status).toBe("no_semantic_delta")
    expect(Object.keys(review.protectedCategories)).toEqual(
      PROTECTED_V137_COMPATIBILITY_CATEGORIES,
    )
    expect(
      Object.values(review.protectedCategories).every(
        ({ changeCount }) => changeCount === 0,
      ),
    ).toBe(true)
    expect(JSON.stringify(review)).not.toMatch(
      /sourceBytes|strategyMemory|soldierMemory|objectivePayload|hostPath/iu,
    )

    const outputPath = path.join(directory, "independent-review.json")
    const written = writeV137ConformanceTraceIndependentReview({
      candidateDirectory: directory,
      outputPath,
    })
    expect(JSON.parse(readFileSync(outputPath, "utf8"))).toEqual(written)
  }, 30_000)

  it("rejects generator self-disposition, generic labels, category omission, and root mutation", () => {
    const mutations: Array<(directory: string) => void> = [
      (directory) => {
        const diffPath = path.join(directory, "semantic-diff.json")
        const diff = JSON.parse(readFileSync(diffPath, "utf8"))
        diff.status = "no_semantic_delta"
        writeFileSync(diffPath, render(diff))
      },
      (directory) => {
        const diffPath = path.join(directory, "semantic-diff.json")
        const diff = JSON.parse(readFileSync(diffPath, "utf8"))
        diff.review = "compatible"
        writeFileSync(diffPath, render(diff))
      },
      (directory) => {
        const diffPath = path.join(directory, "semantic-diff.json")
        const diff = JSON.parse(readFileSync(diffPath, "utf8"))
        delete diff.protectedCategories.validV14State
        writeFileSync(diffPath, render(diff))
      },
      (directory) => {
        const manifestPath = path.join(directory, "manifest.json")
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
        manifest.candidateRootSha256 = `sha256:${"f".repeat(64)}`
        writeFileSync(manifestPath, render(manifest))
      },
    ]
    for (const mutate of mutations) {
      const directory = candidate()
      mutate(directory)
      expect(() =>
        reviewV137ConformanceTraceDiff({ candidateDirectory: directory }),
      ).toThrow()
    }
  }, 60_000)

  it("rejects rehashed tuple substitution and forged semantic diff contents", () => {
    const tupleDirectory = candidate()
    const tupleManifestPath = path.join(tupleDirectory, "manifest.json")
    const tupleManifest = JSON.parse(readFileSync(tupleManifestPath, "utf8"))
    tupleManifest.semanticTupleId = `sha256:${"0".repeat(64)}`
    writeFileSync(tupleManifestPath, render(tupleManifest))
    rehash(tupleDirectory)
    expect(() =>
      reviewV137ConformanceTraceDiff({
        candidateDirectory: tupleDirectory,
      }),
    ).toThrow()

    const diffDirectory = candidate()
    const diffPath = path.join(diffDirectory, "semantic-diff.json")
    const diff = JSON.parse(readFileSync(diffPath, "utf8"))
    diff.caseDiffs[0].caseId = "forged-case"
    diff.caseDiffs[0].candidateTraceRoot = `sha256:${"f".repeat(64)}`
    diff.protectedCategories.validV14State = {
      baselineHash: `sha256:${"1".repeat(64)}`,
      candidateHash: `sha256:${"2".repeat(64)}`,
      changeCount: 999,
    }
    writeFileSync(diffPath, render(diff))
    rehash(diffDirectory)
    expect(() =>
      reviewV137ConformanceTraceDiff({
        candidateDirectory: diffDirectory,
      }),
    ).toThrow()
  }, 60_000)

  it("allows only the exact artifact or candidate-local immutable review path", () => {
    const directory = candidate()
    expect(() =>
      writeV137ConformanceTraceIndependentReview({
        candidateDirectory: directory,
        outputPath: path.join(temporaryRoot(), "arbitrary.json"),
      }),
    ).toThrow("REVIEW_OUTPUT_PATH_FORBIDDEN")
    const outputPath = path.join(directory, "independent-review.json")
    const first = writeV137ConformanceTraceIndependentReview({
      candidateDirectory: directory,
      outputPath,
    })
    expect(
      writeV137ConformanceTraceIndependentReview({
        candidateDirectory: directory,
        outputPath,
      }),
    ).toEqual(first)
    writeFileSync(outputPath, "{}\n")
    expect(() =>
      writeV137ConformanceTraceIndependentReview({
        candidateDirectory: directory,
        outputPath,
      }),
    ).toThrow("REVIEW_OUTPUT_IMMUTABLE")
  }, 30_000)

  it("suspends every protected category change, including historical interpretation", () => {
    for (const category of PROTECTED_V137_COMPATIBILITY_CATEGORIES) {
      const directory = candidate()
      const manifestPath = path.join(directory, "manifest.json")
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
      manifest.compatibilityEvidence.protectedCategories[category] =
        `sha256:${"f".repeat(64)}`
      writeFileSync(manifestPath, render(manifest))
      const diffPath = path.join(directory, "semantic-diff.json")
      const diff = JSON.parse(readFileSync(diffPath, "utf8"))
      diff.protectedCategories[category].candidateHash =
        manifest.compatibilityEvidence.protectedCategories[category]
      diff.protectedCategories[category].changeCount = 1
      writeFileSync(diffPath, render(diff))
      rehash(directory)

      const review = reviewV137ConformanceTraceDiff({
        candidateDirectory: directory,
      })
      expect(review.status).toBe("suspended_pending_approval")
      expect(review.protectedCategories[category].changeCount).toBeGreaterThan(
        0,
      )
    }
  }, 120_000)

  it("derives protected changes from independently reconstructed trace semantics", () => {
    const directory = candidate()
    mutateTraceAndRehash(
      directory,
      "boundary-numeric-negative-zero",
      (trace) => {
        trace.invocations[0].canonicalPayloadHash =
          `sha256:${"f".repeat(64)}`
      },
    )

    const review = reviewV137ConformanceTraceDiff({
      candidateDirectory: directory,
    })
    expect(review.status).toBe("suspended_pending_approval")
    expect(review.protectedCategories.strategyObservation.changeCount).toBe(1)
    expect(
      review.protectedCategories.historicalInterpretation.changeCount,
    ).toBe(1)
    expect(review.protectedCategories.validV14State.changeCount).toBe(0)
  }, 30_000)
})
