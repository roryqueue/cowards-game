/// <reference types="node" />

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { generateV137ConformanceTraceCandidate } from "./generate-v1-37-conformance-traces.js"
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
    candidateVersion: "v1.37-conformance-trace-v1",
    candidateDirectory: directory,
  })
  return directory
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

    const outputPath = path.join(temporaryRoot(), "review.json")
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

  it("suspends every protected category change, including historical interpretation", () => {
    for (const category of PROTECTED_V137_COMPATIBILITY_CATEGORIES) {
      const directory = candidate()
      const manifestPath = path.join(directory, "manifest.json")
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
      manifest.compatibilityEvidence.protectedCategories[category] =
        `sha256:${"f".repeat(64)}`
      writeFileSync(manifestPath, render(manifest))

      const review = reviewV137ConformanceTraceDiff({
        candidateDirectory: directory,
      })
      expect(review.status).toBe("suspended_pending_approval")
      expect(review.protectedCategories[category].changeCount).toBeGreaterThan(
        0,
      )
    }
  }, 120_000)
})
